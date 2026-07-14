package com.leoni.pap.service;

import com.leoni.pap.dto.request.UpdateUtilisateurRequest;
import com.leoni.pap.dto.request.CreerUtilisateurRequest;
import com.leoni.pap.dto.response.UtilisateurResponse;
import com.leoni.pap.entity.Plant;
import com.leoni.pap.entity.Site;
import com.leoni.pap.entity.Utilisateur;
import com.leoni.pap.entity.RoleUser;
import com.leoni.pap.entity.enums.TypeHistorique;
import com.leoni.pap.entity.enums.TypeNotification;
import com.leoni.pap.exception.BusinessException;
import com.leoni.pap.repository.*;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.jdbc.core.JdbcTemplate;
import java.util.List;
import java.util.stream.Collectors;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UtilisateurService {

    private final UtilisateurRepository utilisateurRepo;
    private final SiteRepository        siteRepo;
    private final PlantRepository       plantRepo;
    private final PasswordEncoder       passwordEncoder;
    private final NotificationService   notificationService;
    private final HistoriqueService     historiqueService;
    private final EmailService          emailService;
    private final SessionTestRepository sessionTestRepository;
    private final JdbcTemplate          jdbcTemplate;

    public UtilisateurService(UtilisateurRepository utilisateurRepo,
                              SiteRepository siteRepo,
                              PlantRepository plantRepo,
                              PasswordEncoder passwordEncoder,
                              NotificationService notificationService,
                              HistoriqueService historiqueService,
                              EmailService emailService,
                              SessionTestRepository sessionTestRepository,
                              JdbcTemplate jdbcTemplate) {
        this.utilisateurRepo     = utilisateurRepo;
        this.siteRepo            = siteRepo;
        this.plantRepo           = plantRepo;
        this.passwordEncoder     = passwordEncoder;
        this.notificationService = notificationService;
        this.historiqueService   = historiqueService;
        this.emailService        = emailService;
        this.sessionTestRepository = sessionTestRepository;
        this.jdbcTemplate          = jdbcTemplate;
    }

    public List<UtilisateurResponse> getAll() {
        return utilisateurRepo.findAll()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    public List<UtilisateurResponse> getAuditeursActifs() {
        return utilisateurRepo.findByRoleAndActifTrue(RoleUser.AUDITEUR)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    public List<UtilisateurResponse> rechercher(String q) {
        String keyword = q.toLowerCase().trim();
        return utilisateurRepo.findAll()
                .stream()
                .filter(u ->
                        (u.getNom()       != null && u.getNom().toLowerCase().contains(keyword)) ||
                                (u.getPrenom()    != null && u.getPrenom().toLowerCase().contains(keyword)) ||
                                (u.getMatricule() != null && u.getMatricule().toLowerCase().contains(keyword)) ||
                                (u.getRole()      != null && u.getRole().name().toLowerCase().contains(keyword))
                )
                .map(this::toResponse)
                .toList();
    }

    // ── Créer utilisateur ─────────────────────────────────────────────────
    public UtilisateurResponse creer(CreerUtilisateurRequest req) {
        if (utilisateurRepo.existsByMatricule(req.getMatricule()))
            throw new BusinessException("Ce matricule existe déjà.");

        if (req.getEmail() == null || req.getEmail().isBlank())
            throw new BusinessException("L'email est obligatoire pour créer un utilisateur.");

        if (utilisateurRepo.existsByEmail(req.getEmail()))
            throw new BusinessException("Cet email est déjà utilisé.");

        Utilisateur u = new Utilisateur();
        u.setMatricule(req.getMatricule());
        u.setEmail(req.getEmail());
        u.setRole(RoleUser.valueOf(req.getRole()));
        u.setActif(false);

        Utilisateur saved = utilisateurRepo.save(u);

        // Envoi email invitation
        emailService.envoyerInvitation(req.getEmail(), req.getMatricule(), req.getRole());

        // ── Historique ────────────────────────────────────────────────────
        try {
            historiqueService.logAdmin(saved, TypeHistorique.UTILISATEUR_CREE, saved,
                    "Compte créé par l'administrateur — matricule: " + saved.getMatricule()
                            + " — rôle: " + getRoleLabel(saved.getRole())
                            + " — email: " + saved.getEmail());
        } catch (Exception e) {
            System.err.println("[Historique] creer: " + e.getMessage());
        }

        return toResponse(saved);
    }

    public UtilisateurResponse getById(Integer id) {
        return toResponse(utilisateurRepo.findById(id)
                .orElseThrow(() -> new BusinessException("Utilisateur introuvable.")));
    }

    // ── Modifier utilisateur ──────────────────────────────────────────────
    public UtilisateurResponse modifier(Integer id, UpdateUtilisateurRequest req) {
        Utilisateur u = utilisateurRepo.findById(id)
                .orElseThrow(() -> new BusinessException("Utilisateur introuvable."));

        StringBuilder details = new StringBuilder("Profil modifié par l'administrateur");

        if (req.getNom() != null) {
            details.append(" — nom: ").append(req.getNom());
            u.setNom(req.getNom());
        }
        if (req.getPrenom() != null) {
            details.append(" — prénom: ").append(req.getPrenom());
            u.setPrenom(req.getPrenom());
        }
        if (req.getTelephone() != null) {
            u.setTelephone(req.getTelephone());
        }

        if (req.getEmail() != null && !req.getEmail().equals(u.getEmail())) {
            if (utilisateurRepo.existsByEmail(req.getEmail()))
                throw new BusinessException("Cet email est deja utilise.");
            details.append(" — email modifié");
            u.setEmail(req.getEmail());
        }

        if (req.getRole() != null) {
            try {
                RoleUser nouveauRole = RoleUser.valueOf(req.getRole().toUpperCase());
                details.append(" — rôle: ").append(getRoleLabel(nouveauRole));
                u.setRole(nouveauRole);
            } catch (IllegalArgumentException e) {
                throw new BusinessException("Role invalide : " + req.getRole());
            }
        }

        if (req.getSiteId() != null) {
            Site site = siteRepo.findById(req.getSiteId())
                    .orElseThrow(() -> new BusinessException("Site introuvable."));
            details.append(" — site: ").append(site.getNom());
            u.setSite(site);
        }

        if (req.getPlantId() != null) {
            Plant plant = plantRepo.findById(req.getPlantId())
                    .orElseThrow(() -> new BusinessException("Plant introuvable."));
            details.append(" — plant: ").append(plant.getNom());
            u.setPlant(plant);
        }

        if (req.getActif() != null) u.setActif(req.getActif());

        if (req.getNouveauMotDePasse() != null && !req.getNouveauMotDePasse().isBlank()) {
            u.setMotDePasse(passwordEncoder.encode(req.getNouveauMotDePasse()));
            details.append(" — mot de passe modifié");
        }

        Utilisateur saved = utilisateurRepo.save(u);

        // ── Historique ────────────────────────────────────────────────────
        try {
            historiqueService.logAdmin(saved, TypeHistorique.UTILISATEUR_MODIFIE, saved,
                    details.toString());
        } catch (Exception e) {
            System.err.println("[Historique] modifier: " + e.getMessage());
        }

        return toResponse(saved);
    }

    // ── Toggle actif ──────────────────────────────────────────────────────
    public String toggleActif(Integer id) {
        Utilisateur u = utilisateurRepo.findById(id)
                .orElseThrow(() -> new BusinessException("Utilisateur introuvable."));

        boolean etaitActif = u.getActif();
        u.setActif(!etaitActif);
        utilisateurRepo.save(u);

        try {
            if (!etaitActif) {
                historiqueService.log(u, TypeHistorique.COMPTE_ACTIVE,
                        "Compte activé par l'administrateur — utilisateur: "
                                + u.getPrenom() + " " + u.getNom()
                                + " (" + u.getMatricule() + ")");
                notificationService.creer(u, TypeNotification.SYSTEME,
                        "Votre compte a ete active. Vous pouvez maintenant acceder a la plateforme.");
            } else {
                historiqueService.log(u, TypeHistorique.COMPTE_DESACTIVE,
                        "Compte désactivé par l'administrateur — utilisateur: "
                                + u.getPrenom() + " " + u.getNom()
                                + " (" + u.getMatricule() + ")");
                notificationService.creer(u, TypeNotification.SYSTEME,
                        "Votre compte a ete desactive. Contactez l'administrateur.");
            }
        } catch (Exception e) {
            System.err.println("[ToggleActif] Erreur historique/notif : " + e.getMessage());
        }

        return !etaitActif ? "Compte active avec succes." : "Compte desactive avec succes.";
    }

    // ── Supprimer utilisateur ─────────────────────────────────────────────
    @Transactional
    public void supprimer(Integer id) {
        Utilisateur u = utilisateurRepo.findById(id)
                .orElseThrow(() -> new BusinessException("Utilisateur introuvable."));

        String nomComplet = (u.getPrenom() != null ? u.getPrenom() : "")
                + " " + (u.getNom() != null ? u.getNom() : "")
                + " (" + u.getMatricule() + ")";

        // 1. reponse_session
        try { sessionTestRepository.deleteReponsesSession(id); }
        catch (Exception e) { System.err.println("[del] reponse_session: " + e.getMessage()); }

        // 2. détacher passage_certification de session_test
        try { sessionTestRepository.detacherPassageCertification(id); }
        catch (Exception e) { System.err.println("[del] passage_certification: " + e.getMessage()); }

        // 3. session_test
        try { sessionTestRepository.deleteByUtilisateurId(id); }
        catch (Exception e) { System.err.println("[del] session_test: " + e.getMessage()); }

        // 4. notifications
        try { notificationService.supprimerParDestinataire(u); }
        catch (Exception e) { System.err.println("[del] notifications: " + e.getMessage()); }

        // 5. données liées via jdbcTemplate
        try {
            jdbcTemplate.update("DELETE FROM historique WHERE utilisateur_id = ? OR cible_id = ?", id, id);
            jdbcTemplate.update("DELETE FROM fiche_reparation WHERE cree_par_id = ? OR expert_id = ? OR chef_service_id = ?", id, id, id);
            jdbcTemplate.update("DELETE FROM audit_produit_annexe WHERE importe_par_id = ?", id);
            jdbcTemplate.update("DELETE FROM plan_action WHERE responsable_id = ?", id);
            jdbcTemplate.update("DELETE FROM passage_certification WHERE auditeur_id = ?", id);
            jdbcTemplate.update("DELETE FROM audit WHERE planificateur_id = ? OR auditeur_id = ? OR responsable_magasin_id = ? OR responsable_pdca_id = ?", id, id, id, id);
            jdbcTemplate.update("DELETE FROM planification_audit WHERE createur_id = ?", id);
            jdbcTemplate.update("DELETE FROM certificat WHERE chef_id = ? OR expert_id = ?", id, id);
            jdbcTemplate.update("DELETE FROM certification WHERE expert_id = ? OR auditeur_id = ?", id, id);
            jdbcTemplate.update("DELETE FROM test_pratique WHERE expert_id = ?", id);
            jdbcTemplate.update("DELETE FROM test_theorique WHERE expert_id = ?", id);
        } catch (Exception e) {
            System.err.println("[del] données liées: " + e.getMessage());
        }

        // 6. Supprimer l'utilisateur
        utilisateurRepo.delete(u);

        // ── Historique — après suppression impossible, on log avant ───────
        // Note : l'historique est supprimé en étape 5, donc ce log
        // n'est possible qu'avec un utilisateur admin existant
        // → le log est géré en étape 5 avant la suppression si nécessaire
        System.out.println("[Supprimer] Utilisateur supprimé : " + nomComplet);
    }

    // ── Changer rôle ──────────────────────────────────────────────────────
    public UtilisateurResponse changerRole(Integer id, String nouveauRole) {
        Utilisateur u = utilisateurRepo.findById(id)
                .orElseThrow(() -> new BusinessException("Utilisateur introuvable."));

        RoleUser ancienRole = u.getRole();

        try {
            u.setRole(RoleUser.valueOf(nouveauRole.toUpperCase()));
        } catch (IllegalArgumentException e) {
            throw new BusinessException(
                    "Role invalide : " + nouveauRole +
                            ". Valeurs : AUDITEUR, CHEF_SERVICE, " +
                            "RESPONSABLE_QUALITE_CENTRALE, EXPERT_PRODUCT_AUDIT, ADMIN");
        }

        utilisateurRepo.save(u);

        // ── Historique ────────────────────────────────────────────────────
        try {
            historiqueService.logAdmin(u, TypeHistorique.ROLE_CHANGE, u,
                    "Rôle modifié par l'administrateur: "
                            + getRoleLabel(ancienRole) + " → " + getRoleLabel(u.getRole())
                            + " — utilisateur: " + u.getPrenom() + " " + u.getNom()
                            + " (" + u.getMatricule() + ")");
        } catch (Exception e) {
            System.err.println("[Historique] changerRole: " + e.getMessage());
        }

        notificationService.creer(
                u,
                TypeNotification.ROLE_CHANGE,
                "Votre role a ete mis a jour : "
                        + getRoleLabel(ancienRole) + " -> " + getRoleLabel(u.getRole())
                        + ". Reconnectez-vous pour acceder a votre nouvel espace."
        );

        return toResponse(u);
    }

    // ── Toggle droit certif ───────────────────────────────────────────────
    public UtilisateurResponse togglePeutCreerCertif(Integer id) {
        Utilisateur u = utilisateurRepo.findById(id)
                .orElseThrow(() -> new BusinessException("Utilisateur introuvable."));

        if (u.getRole() != RoleUser.EXPERT_PRODUCT_AUDIT)
            throw new BusinessException("Seuls les experts peuvent avoir ce droit.");

        Boolean actuel = u.getPeutCreerCertif();
        boolean nouveauDroit = !Boolean.TRUE.equals(actuel);
        u.setPeutCreerCertif(nouveauDroit);
        utilisateurRepo.save(u);

        // ── Historique ────────────────────────────────────────────────────
        try {
            historiqueService.logAdmin(u, TypeHistorique.UTILISATEUR_MODIFIE, u,
                    "Droit de créer des certifications "
                            + (nouveauDroit ? "activé" : "révoqué")
                            + " pour l'expert: " + u.getPrenom() + " " + u.getNom()
                            + " (" + u.getMatricule() + ")");
        } catch (Exception e) {
            System.err.println("[Historique] toggleCertif: " + e.getMessage());
        }

        return toResponse(u);
    }

    // ── Utilitaires ───────────────────────────────────────────────────────
    private String getRoleLabel(RoleUser role) {
        return switch (role) {
            case AUDITEUR                     -> "Auditeur";
            case CHEF_SERVICE                 -> "Chef de Service";
            case RESPONSABLE_QUALITE_CENTRALE -> "Responsable Qualite Centrale";
            case EXPERT_PRODUCT_AUDIT         -> "Expert Product Audit";
            case ADMIN                        -> "Administrateur";
        };
    }
    public Integer getIdByUsername(String username) {
        return utilisateurRepo.findByEmail(username)
                .orElseThrow(() -> new BusinessException("Utilisateur non trouvé avec l'email : " + username))
                .getId();
    }
    public Integer getIdByEmail(String email) {
        return utilisateurRepo.findByEmail(email)
                .orElseThrow(() -> new BusinessException(
                        "Utilisateur non trouvé avec l'email : " + email))
                .getId();
    }
    public UtilisateurResponse toResponse(Utilisateur u) {
        UtilisateurResponse r = new UtilisateurResponse();
        r.setId(u.getId());
        r.setNom(u.getNom());
        r.setPrenom(u.getPrenom());
        r.setEmail(u.getEmail());
        r.setMatricule(u.getMatricule());
        r.setRole(u.getRole().name());
        r.setTelephone(u.getTelephone());
        r.setActif(u.getActif());
        r.setInscrit(u.getMotDePasse() != null);
        r.setPeutCreerCertif(u.getPeutCreerCertif() != null && u.getPeutCreerCertif());
        if (u.getSite() != null) {
            r.setSiteId(u.getSite().getId());
            r.setSiteNom(u.getSite().getNom());
            r.setSiteLocalisation(u.getSite().getLocalisation());
        }
        if (u.getPlant() != null) {
            r.setPlantId(u.getPlant().getId());
            r.setPlantNom(u.getPlant().getNom());
        }
        return r;
    }

    public List<UtilisateurResponse> getExpertsAvecDroitCertif() {
        return utilisateurRepo.findAll().stream()
                .filter(u -> u.getRole() == RoleUser.EXPERT_PRODUCT_AUDIT
                        && Boolean.TRUE.equals(u.getPeutCreerCertif())
                        && Boolean.TRUE.equals(u.getActif()))
                .map(u -> {
                    UtilisateurResponse r = new UtilisateurResponse();
                    r.setId(u.getId());
                    r.setNom(u.getNom());
                    r.setPrenom(u.getPrenom());
                    r.setMatricule(u.getMatricule());
                    if (u.getSite() != null) r.setSiteNom(u.getSite().getNom());
                    return r;
                })
                .collect(Collectors.toList());
    }


}