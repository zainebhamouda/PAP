package com.leoni.pap.service;

import com.leoni.pap.dto.response.NotificationResponse;
import com.leoni.pap.entity.Certification;
import com.leoni.pap.entity.Notification;
import com.leoni.pap.entity.RoleUser;
import com.leoni.pap.entity.Utilisateur;
import com.leoni.pap.entity.enums.TypeNotification;
import com.leoni.pap.exception.BusinessException;
import com.leoni.pap.repository.NotificationRepository;
import com.leoni.pap.repository.UtilisateurRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notifRepo;
    private final UtilisateurRepository  utilisateurRepo;
    private final EmailService           emailService;

    // ═══════════════════════════════════════════════════════════
    // CRÉER
    // ═══════════════════════════════════════════════════════════

    @Transactional
    public Notification creer(Utilisateur destinataire,
                              TypeNotification type,
                              String message) {
        Notification n = notifRepo.save(Notification.builder()
                .destinataire(destinataire)
                .type(type)
                .titre(labelParType(type))
                .message(message)
                .priorite(prioriteParType(type))
                .dateCreation(LocalDateTime.now())
                .lue(false)
                .build());
        envoyerEmailSiActif(destinataire, type, labelParType(type), message);
        return n;
    }

    @Transactional
    public Notification creerComplete(Utilisateur destinataire,
                                      TypeNotification type,
                                      String titre,
                                      String message,
                                      String lienAction,
                                      Certification certif) {
        String titreEffectif = titre != null ? titre : labelParType(type);
        Notification n = notifRepo.save(Notification.builder()
                .destinataire(destinataire)
                .type(type)
                .titre(titreEffectif)
                .message(message)
                .lienAction(lienAction)
                .certification(certif)
                .priorite(prioriteParType(type))
                .dateCreation(LocalDateTime.now())
                .lue(false)
                .build());
        envoyerEmailSiActif(destinataire, type, titreEffectif, message);
        return n;
    }

    private void envoyerEmailSiActif(Utilisateur u, TypeNotification type,
                                     String titre, String message) {
        if (!Boolean.TRUE.equals(u.getEmailNotificationsActif())) return;
        if (u.getEmail() == null) return;
        String csv = u.getEmailNotificationsTypes();
        if (csv == null || csv.isBlank()) return;
        if (!Arrays.asList(csv.split(",")).contains(type.name())) return;
        try {
            emailService.envoyerNotification(u.getEmail(),
                    u.getPrenom() + " " + u.getNom(), titre, message);
        } catch (Exception ignored) { }
    }

    // ═══════════════════════════════════════════════════════════
    // BROADCASTS
    // ═══════════════════════════════════════════════════════════

    @Transactional
    public void notifierTousExperts(TypeNotification type, String message, Certification certif) {
        utilisateurRepo.findByRoleAndActifTrue(RoleUser.EXPERT_PRODUCT_AUDIT)
                .forEach(u -> creerComplete(u, type, null, message, null, certif));
    }

    @Transactional
    public void notifierEncadrement(TypeNotification type, String message, Certification certif) {
        utilisateurRepo.findByRoleAndActifTrue(RoleUser.CHEF_SERVICE)
                .forEach(u -> creerComplete(u, type, null, message, null, certif));
        utilisateurRepo.findByRoleAndActifTrue(RoleUser.RESPONSABLE_QUALITE_CENTRALE)
                .forEach(u -> creerComplete(u, type, null, message, null, certif));
    }

    @Transactional
    public void notifierRole(RoleUser role, TypeNotification type, String message) {
        utilisateurRepo.findByRoleAndActifTrue(role)
                .forEach(u -> creer(u, type, message));
    }

    // ═══════════════════════════════════════════════════════════
    // LIRE
    // ═══════════════════════════════════════════════════════════

    @Transactional(readOnly = true)
    public List<NotificationResponse> getMesNotifications(String matricule) {
        Utilisateur u = getUser(matricule);
        return notifRepo.findByDestinataireOrderByDateCreationDesc(u)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public int getNombreNonLues(String matricule) {
        return (int) notifRepo.countByDestinataireAndLueFalse(getUser(matricule));
    }

    @Transactional(readOnly = true)
    public List<Notification> getMesNotifications(Utilisateur destinataire) {
        return notifRepo.findByDestinataireOrderByDateCreationDesc(destinataire);
    }

    @Transactional(readOnly = true)
    public List<Notification> getMesNonLues(Utilisateur destinataire) {
        return notifRepo.findByDestinataireAndLueFalseOrderByDateCreationDesc(destinataire);
    }

    @Transactional(readOnly = true)
    public long countNonLues(Utilisateur destinataire) {
        return notifRepo.countByDestinataireAndLueFalse(destinataire);
    }

    // ═══════════════════════════════════════════════════════════
    // MARQUER / SUPPRIMER
    // ═══════════════════════════════════════════════════════════

    @Transactional
    public void marquerLue(Long notifId) {
        notifRepo.findById(notifId).ifPresent(n -> {
            n.setLue(true);
            n.setDateLecture(LocalDateTime.now());
            notifRepo.save(n);
        });
    }

    @Transactional
    public void marquerToutesLues(Utilisateur destinataire) {
        notifRepo.marquerToutesLues(destinataire, LocalDateTime.now());
    }

    @Transactional
    public void supprimer(Long notifId) {
        notifRepo.deleteById(notifId);
    }

    @Transactional
    public void nettoyerAnciennesNotifs() {
        notifRepo.supprimerAnciennesLues(LocalDateTime.now().minusDays(30));
    }

    // ═══════════════════════════════════════════════════════════
    // HELPERS
    // ═══════════════════════════════════════════════════════════

    private Utilisateur getUser(String matricule) {
        return utilisateurRepo.findByMatricule(matricule)
                .orElseThrow(() -> new BusinessException("Utilisateur introuvable : " + matricule));
    }

    private NotificationResponse toResponse(Notification n) {
        NotificationResponse r = new NotificationResponse();
        r.setId(n.getId() != null ? n.getId().intValue() : null);
        r.setTitre(n.getTitre() != null ? n.getTitre() : labelParType(n.getType()));
        r.setMessage(n.getMessage());
        r.setType(n.getType() != null ? n.getType().name() : "SYSTEME");
        r.setLue(n.getLue());
        r.setLienAction(n.getLienAction());
        r.setPriorite(prioriteScore(n.getPriorite()));
        r.setDateCreation(n.getDateCreation());
        return r;
    }

    // ─── CORRIGÉ : switch couvre maintenant TOUS les cas de TypeNotification ──
    private String prioriteParType(TypeNotification type) {
        if (type == null) return "NORMALE";
        return switch (type) {
            // HAUTE
            case CERTIF_BLOQUE,
                 CERTIF_EXPIRE_7J,
                 CERTIF_EXPIREE,
                 ALERTE,
                 ALERTE_QK,
                 AUDIT_QK_DEPASSE,
                 AUDIT_EN_RETARD        -> "HAUTE";

            // BASSE
            case INFORMATION,
                 SYSTEME,
                 AUDIT_TERMINE_NOTIF    -> "BASSE";

            // NORMALE (tout le reste)
            case CERTIF_TEST_REUSSI,
                 CERTIF_TEST_ECHOUE,
                 CERTIF_DEBLOQUE,
                 CERTIF_PRATIQUE_PRET,
                 CERTIF_PRATIQUE_REUSSI,
                 CERTIF_PRATIQUE_ECHOUE,
                 CERTIF_OBTENUE,
                 CERTIF_IMPORTEE,
                 CERTIF_A_SIGNER_EXPERT,
                 FICHE_REPARATION_CREEE,
                 FICHE_REPARATION_VALIDEE_CHEF,
                 FICHE_REPARATION_VALIDEE_EXPERT,
                 PLANIFICATION_IMPORTEE,
                 PLANIFICATION_LANCEE,
                 AUDIT_SPECIAL_ASSIGNE,
                 AUDIT_EXPORT_VALIDE,
                 CERTIF_INVALIDE_CHEF,
                 CERTIF_VALIDE_CHEF,
                 CERTIF_A_SIGNER_CHEF,
                 CERTIF_PDF_DISPONIBLE,
                 CERTIF_EXPIRE_30J,
                 COMPTE_ACTIVE,
                 COMPTE_DESACTIVE,
                 PLANIFICATION_LANCEE_PAR_AUDITEUR,
                 ROLE_CHANGE,
                 AUDIT_ASSIGNE,
                 AUDIT_PDCA_REQUIS,
                 RAPPEL_DEADLINE,
                 ANNEXE_A_VALIDER_AUDITEUR,
                 ANNEXE_VALIDEE_AUDITEUR,
                 ANNEXE_REJETEE_AUDITEUR -> "NORMALE";



        };
    }

    private int prioriteScore(String p) {
        if (p == null) return 2;
        return switch (p) {
            case "HAUTE" -> 1;
            case "BASSE" -> 3;
            default      -> 2;
        };
    }

    // ─── CORRIGÉ : switch couvre TOUS les cas de TypeNotification ────────────
    private String labelParType(TypeNotification type) {
        if (type == null) return "Notification";
        return switch (type) {
            // Certification
            case CERTIF_TEST_REUSSI      -> "Examen théorique réussi";
            case CERTIF_TEST_ECHOUE      -> "Échec à l'examen";
            case CERTIF_BLOQUE           -> "Certification bloquée";
            case CERTIF_DEBLOQUE         -> "Certification débloquée";
            case CERTIF_PRATIQUE_PRET    -> "Test pratique disponible";
            case CERTIF_PRATIQUE_REUSSI  -> "Test pratique réussi";
            case CERTIF_PRATIQUE_ECHOUE  -> "Échec au test pratique";
            case CERTIF_OBTENUE          -> "Certification obtenue";
            // ✅ NOUVEAU — Import direct par l'expert (auditeur déjà certifié)
            case CERTIF_IMPORTEE         -> "Certificat importé";
            // Certificat
            case CERTIF_A_SIGNER_EXPERT  -> "Signature expert requise";
            case CERTIF_A_SIGNER_CHEF    -> "Signature chef requise";
            case CERTIF_PDF_DISPONIBLE   -> "Certificat disponible";
            // Expiration
            case CERTIF_EXPIRE_30J       -> "Expiration dans 30 jours";
            case CERTIF_EXPIRE_7J        -> "Expiration dans 7 jours";
            case CERTIF_EXPIREE          -> "Certification expirée";
            // Compte & Admin
            case COMPTE_ACTIVE           -> "Compte activé";
            case COMPTE_DESACTIVE        -> "Compte désactivé";
            case ROLE_CHANGE             -> "Changement de rôle";
            // Système
            case SYSTEME                 -> "Notification système";
            case INFORMATION             -> "Information";
            case ALERTE                  -> "Alerte";
            // Audits Sprint 3
            case AUDIT_ASSIGNE           -> "Nouvel audit assigné";
            case AUDIT_EN_RETARD         -> "Audit en retard";
            case AUDIT_QK_DEPASSE        -> "⚠️ Seuil QK dépassé";
            case AUDIT_PDCA_REQUIS       -> "PDCA à valider";
            case AUDIT_TERMINE_NOTIF     -> "Audit terminé";
            // Deadline & Alerte QK (NOUVEAUX)
            case RAPPEL_DEADLINE         -> "⏰ Rappel deadline";
            case ALERTE_QK               -> "🔴 Alerte QK critique";
            case CERTIF_VALIDE_CHEF      -> "Certification valide chef";
            case CERTIF_INVALIDE_CHEF    -> "Certification valide chef";
            case FICHE_REPARATION_CREEE -> "Fiche réparation créée";
            case FICHE_REPARATION_VALIDEE_CHEF -> "Fiche validée par chef";
            case FICHE_REPARATION_VALIDEE_EXPERT -> "Fiche validée par expert";

            case PLANIFICATION_IMPORTEE -> "Planification importée";
            case PLANIFICATION_LANCEE -> "Planification lancée";

            case AUDIT_SPECIAL_ASSIGNE -> "Audit spécial assigné";
            case AUDIT_EXPORT_VALIDE -> "Export audit validé";
            case PLANIFICATION_LANCEE_PAR_AUDITEUR -> "Lancer par auditeur ";

            case ANNEXE_A_VALIDER_AUDITEUR -> "Annexe à valider";
            case ANNEXE_VALIDEE_AUDITEUR   -> "Annexe validée";
            case ANNEXE_REJETEE_AUDITEUR   -> "Annexe rejetée";
        };
    }
    @Transactional
    public void supprimerParDestinataire(Utilisateur destinataire) {
        notifRepo.deleteByDestinataire(destinataire);
    }
}