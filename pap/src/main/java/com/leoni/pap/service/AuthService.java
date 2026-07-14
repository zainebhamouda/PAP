package com.leoni.pap.service;

import com.leoni.pap.dto.request.*;
import com.leoni.pap.dto.response.AuthResponse;
import com.leoni.pap.entity.*;
import com.leoni.pap.entity.RoleUser;
import com.leoni.pap.entity.enums.TypeHistorique;
import com.leoni.pap.exception.BusinessException;
import com.leoni.pap.repository.*;
import com.leoni.pap.security.JwtUtil;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import java.time.Instant;
import java.util.UUID;

@Service
public class AuthService {

    private final UtilisateurRepository utilisateurRepo;
    private final SiteRepository        siteRepo;
    private final PlantRepository       plantRepo;
    private final PasswordEncoder       passwordEncoder;
    private final JwtUtil               jwtUtil;
    private final HistoriqueService     historiqueService;
    private final EmailService          emailService;

    public AuthService(UtilisateurRepository utilisateurRepo,
                       SiteRepository siteRepo,
                       PlantRepository plantRepo,
                       PasswordEncoder passwordEncoder,
                       JwtUtil jwtUtil,
                       HistoriqueService historiqueService,
                       EmailService emailService) {
        this.utilisateurRepo   = utilisateurRepo;
        this.siteRepo          = siteRepo;
        this.plantRepo         = plantRepo;
        this.passwordEncoder   = passwordEncoder;
        this.jwtUtil           = jwtUtil;
        this.historiqueService = historiqueService;
        this.emailService      = emailService;
    }

    // ══════════════════════════════════════════════
    // ETAPE 1 - Valider + sauvegarder nom/prenom/email/mdp
    // ══════════════════════════════════════════════
    public void validerEtape1(RegisterStep1Request req) {

        if (!req.getMotDePasse().equals(req.getConfirmerMotDePasse()))
            throw new BusinessException("Les mots de passe ne correspondent pas.");

        if (!utilisateurRepo.existsByMatricule(req.getMatricule()))
            throw new BusinessException("Matricule non reconnu. Contactez l'administrateur.");

        Utilisateur u = utilisateurRepo.findByMatricule(req.getMatricule()).get();

        if (u.getMotDePasse() != null)
            throw new BusinessException("Ce matricule est deja inscrit.");

        if (u.getEmail() != null && !u.getEmail().isBlank()) {
            if (!u.getEmail().equalsIgnoreCase(req.getEmail().trim()))
                throw new BusinessException(
                        "L'email saisi ne correspond pas à celui enregistré pour ce matricule. " +
                                "Utilisez l'email sur lequel vous avez reçu votre invitation.");
        } else {
            if (utilisateurRepo.existsByEmail(req.getEmail()))
                throw new BusinessException("Cet email est deja utilise.");
        }

        u.setNom(req.getNom());
        u.setPrenom(req.getPrenom());
        u.setEmail(req.getEmail());
        u.setMotDePasse(passwordEncoder.encode(req.getMotDePasse()));
        u.setActif(false);
        utilisateurRepo.save(u);

        // ── Historique ────────────────────────────────────────────────────────
        try {
            historiqueService.log(u, TypeHistorique.MOT_DE_PASSE_CHANGE,
                    "Étape 1 complétée — informations personnelles enregistrées");
        } catch (Exception e) {
            System.err.println("[Historique] Étape 1 : " + e.getMessage());
        }
    }

    // ══════════════════════════════════════════════
    // ETAPE 2 - Verifier role + sauvegarder site + plant
    // ══════════════════════════════════════════════
    public void validerEtape2(RegisterStep2Request req) {
        RoleUser roleChoisi = parseRole(req.getRoleChoisi());

        boolean roleCorrect = utilisateurRepo
                .existsByMatriculeAndRole(req.getMatricule(), roleChoisi);

        if (!roleCorrect) {
            Utilisateur u = utilisateurRepo
                    .findByMatricule(req.getMatricule())
                    .orElseThrow(() -> new BusinessException("Matricule introuvable."));
            throw new BusinessException(
                    "Role incorrect. Votre role dans le systeme est : "
                            + formatRole(u.getRole())
                            + ". Veuillez selectionner le bon role.");
        }

        Site site = siteRepo.findById(req.getSiteId())
                .orElseThrow(() -> new BusinessException("Site introuvable."));

        Utilisateur u = utilisateurRepo.findByMatricule(req.getMatricule()).get();
        u.setSite(site);

        if (req.getPlantId() != null) {
            Plant plant = plantRepo.findById(req.getPlantId())
                    .orElseThrow(() -> new BusinessException("Plant introuvable."));
            u.setPlant(plant);
        }

        utilisateurRepo.save(u);

        // ── Historique ────────────────────────────────────────────────────────
        try {
            historiqueService.log(u, TypeHistorique.UTILISATEUR_MODIFIE,
                    "Étape 2 complétée — rôle: " + formatRole(roleChoisi)
                            + " — site: " + site.getNom());
        } catch (Exception e) {
            System.err.println("[Historique] Étape 2 : " + e.getMessage());
        }
    }

    // ══════════════════════════════════════════════════════
    // ETAPE 3 - Telephone + Conditions -> actif
    // ══════════════════════════════════════════════════════
    public void creerCompte(RegisterFinalRequest req) {
        if (req.getAccepterConditions() == null || !req.getAccepterConditions())
            throw new BusinessException("Vous devez accepter les Conditions Generales d'Utilisation.");

        Utilisateur u = utilisateurRepo
                .findByMatricule(req.getMatricule())
                .orElseThrow(() -> new BusinessException("Matricule introuvable."));

        u.setTelephone(req.getTelephone());
        u.setRecevoirNotifications(
                req.getRecevoirNotifications() != null && req.getRecevoirNotifications());
        u.setActif(true);
        utilisateurRepo.save(u);

        // ── Historique ────────────────────────────────────────────────────────
        try {
            historiqueService.log(u, TypeHistorique.INSCRIPTION,
                    "Inscription complète — rôle: " + formatRole(u.getRole())
                            + " — site: " + (u.getSite() != null ? u.getSite().getNom() : "non défini")
                            + " — plant: " + (u.getPlant() != null ? u.getPlant().getNom() : "non défini"));
        } catch (Exception e) {
            System.err.println("[Historique] Inscription : " + e.getMessage());
        }
    }

    // ══════════════════════════════════════════════
    // CONNEXION
    // ══════════════════════════════════════════════
    public AuthResponse login(LoginRequest req) {
        Utilisateur utilisateur = utilisateurRepo
                .findByMatricule(req.getMatricule())
                .orElseThrow(() -> new BusinessException("Matricule ou mot de passe incorrect."));

        if (utilisateur.getMotDePasse() == null)
            throw new BusinessException("Compte non active. Veuillez completer votre inscription.");

        if (!passwordEncoder.matches(req.getMotDePasse(), utilisateur.getMotDePasse()))
            throw new BusinessException("Matricule ou mot de passe incorrect.");

        if (!utilisateur.getActif())
            throw new BusinessException("Compte desactive. Contactez l'administrateur.");

        String token = jwtUtil.generateToken(
                utilisateur.getMatricule(),
                utilisateur.getRole().name());

        // ── Historique ────────────────────────────────────────────────────────
        try {
            historiqueService.log(utilisateur, TypeHistorique.CONNEXION,
                    "Connexion réussie — rôle: " + formatRole(utilisateur.getRole()));
        } catch (Exception e) {
            System.err.println("[Historique] Connexion : " + e.getMessage());
        }

        // ── Email log connexion ───────────────────────────────────────────────
        if (utilisateur.getEmail() != null) {
            emailService.envoyerEmailConnexion(
                    utilisateur.getEmail(),
                    utilisateur.getPrenom() + " " + utilisateur.getNom());
        }

        AuthResponse response = new AuthResponse();
        response.setToken(token);
        response.setRole(utilisateur.getRole().name());
        response.setNom(utilisateur.getNom());
        response.setPrenom(utilisateur.getPrenom());
        response.setMatricule(utilisateur.getMatricule());

        if (utilisateur.getSite() != null) {
            response.setSiteId(utilisateur.getSite().getId());
            response.setSiteNom(utilisateur.getSite().getNom());
        }

        return response;
    }

    // ══════════════════════════════════════════════
    // RESET MOT DE PASSE
    // ══════════════════════════════════════════════
    public String generateResetToken(String matricule) {
        Utilisateur u = utilisateurRepo.findByMatricule(matricule)
                .orElseThrow(() -> new BusinessException("Matricule introuvable."));

        String token = UUID.randomUUID().toString();
        u.setResetToken(token);
        u.setResetTokenExpiry(Instant.now().plusSeconds(3600));
        utilisateurRepo.save(u);

        return token;
    }

    public void resetPassword(String token, String newPassword) {
        Utilisateur u = utilisateurRepo.findByResetToken(token)
                .orElseThrow(() -> new BusinessException("Token invalide ou expiré."));

        if (u.getResetTokenExpiry() == null || u.getResetTokenExpiry().isBefore(Instant.now()))
            throw new BusinessException("Token expiré.");

        u.setMotDePasse(passwordEncoder.encode(newPassword));
        u.setResetToken(null);
        u.setResetTokenExpiry(null);
        utilisateurRepo.save(u);

        // ── Historique ────────────────────────────────────────────────────────
        try {
            historiqueService.log(u, TypeHistorique.MOT_DE_PASSE_CHANGE,
                    "Mot de passe réinitialisé via token");
        } catch (Exception e) {
            System.err.println("[Historique] Reset password : " + e.getMessage());
        }
    }

    public void resetPasswordByMatricule(String matricule, String newPassword) {
        Utilisateur u = utilisateurRepo.findByMatricule(matricule)
                .orElseThrow(() -> new BusinessException("Matricule introuvable."));

        u.setMotDePasse(passwordEncoder.encode(newPassword));
        utilisateurRepo.save(u);

        // ── Historique ────────────────────────────────────────────────────────
        try {
            historiqueService.log(u, TypeHistorique.MOT_DE_PASSE_CHANGE,
                    "Mot de passe réinitialisé via matricule");
        } catch (Exception e) {
            System.err.println("[Historique] Reset password matricule : " + e.getMessage());
        }
    }

    // ── Utilitaires ───────────────────────────────────────────────────────────
    private RoleUser parseRole(String role) {
        try {
            return RoleUser.valueOf(role.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new BusinessException("Role invalide : " + role);
        }
    }

    private String formatRole(RoleUser role) {
        return switch (role) {
            case AUDITEUR                     -> "Auditeur";
            case CHEF_SERVICE                 -> "Chef de Service";
            case RESPONSABLE_QUALITE_CENTRALE -> "Responsable Qualite Centrale";
            case EXPERT_PRODUCT_AUDIT         -> "Expert Product Audit";
            case ADMIN                        -> "Administrateur";
        };
    }
}