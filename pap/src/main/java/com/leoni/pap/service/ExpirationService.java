package com.leoni.pap.service;

import com.leoni.pap.entity.Certification;
import com.leoni.pap.entity.PassageCertification;
import com.leoni.pap.entity.Utilisateur;
import com.leoni.pap.entity.enums.StatutPassage;
import com.leoni.pap.entity.enums.TypeHistorique;
import com.leoni.pap.entity.enums.TypeNotification;
import com.leoni.pap.repository.CertificationRepository;
import com.leoni.pap.repository.PassageCertificationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ExpirationService {

    private final CertificationRepository        certifRepo;
    private final PassageCertificationRepository passageRepo;
    private final NotificationService            notificationService;
    private final HistoriqueService              historiqueService;
    private final EmailService                   emailService;

    // ── Vérification quotidienne à 8h00 ──────────────────────────────────
    @Scheduled(cron = "0 0 8 * * *")
    @Transactional
    public void verifierExpirations() {
        verifierNotif30Jours();
        verifierNotif7Jours();
        verifierExpirees();
    }

    // ═════════════════════════════════════════════════════════════════════
    // NOTIFICATION 30 JOURS
    // ═════════════════════════════════════════════════════════════════════
    private void verifierNotif30Jours() {
        LocalDateTime dans30j = LocalDateTime.now().plusDays(30);
        LocalDateTime dans31j = LocalDateTime.now().plusDays(31);

        certifRepo.findAll().stream()
                .filter(c -> Boolean.TRUE.equals(c.getActif()))
                .filter(c -> c.getDateExpiration() != null)
                .filter(c -> !Boolean.TRUE.equals(c.getNotifJ30Envoyee()))
                .filter(c -> c.getDateExpiration().isAfter(dans30j)
                        && c.getDateExpiration().isBefore(dans31j))
                .forEach(this::envoyerNotif30Jours);
    }

    private void envoyerNotif30Jours(Certification certif) {
        List<PassageCertification> passages = passageRepo
                .findByStatutOrderByDateDebutDesc(StatutPassage.RAPPORT_VALIDE);

        for (PassageCertification passage : passages) {
            if (!passage.getCertification().getId().equals(certif.getId())) continue;

            Utilisateur auditeur = passage.getAuditeur();
            long joursRestants = ChronoUnit.DAYS.between(
                    LocalDateTime.now(), certif.getDateExpiration());

            // ── Notification plateforme auditeur ──
            notificationService.creer(auditeur, TypeNotification.CERTIF_EXPIRE_30J,
                    "⚠️ Votre qualification « " + certif.getTitre()
                            + " » expire dans " + joursRestants + " jours ("
                            + certif.getDateExpiration().toLocalDate() + "). "
                            + "Pensez à vous recertifier.");
            // ── Email auditeur ────────────────────
            if (auditeur.getEmail() != null) {
                emailService.envoyerNotification(
                        auditeur.getEmail(),
                        auditeur.getPrenom() + " " + auditeur.getNom(),
                        "Qualification expire dans 30 jours",
                        buildMessageExpiration(auditeur, certif, joursRestants)
                );
            }

            // ── Historique ────────────────────────
            try {
                historiqueService.logCertif(auditeur,
                        TypeHistorique.EXPIRATION_NOTIF_30J,
                        certif,
                        "Notification expiration 30j envoyée — Qualification : "
                                + certif.getTitre(), null);
            } catch (Exception e) {
                System.err.println("[Expiration] Historique 30j : " + e.getMessage());
            }
        }

        // ── Notifier l'expert ─────────────────────────────────────────
        if (certif.getExpert() != null) {
            Utilisateur expert = certif.getExpert();
            long joursRestants = ChronoUnit.DAYS.between(
                    LocalDateTime.now(), certif.getDateExpiration());

            notificationService.creer(expert, TypeNotification.CERTIF_EXPIRE_30J,
                    "⚠️ La qualification « " + certif.getTitre()
                            + " » que vous gérez expire dans " + joursRestants + " jours. "
                            + "Pensez à la renouveler.");

            if (expert.getEmail() != null) {
                emailService.envoyerNotification(
                        expert.getEmail(),
                        expert.getPrenom() + " " + expert.getNom(),
                        "Qualification expire dans 30 jours",
                        "La qualification « " + certif.getTitre()
                                + " » expire dans " + joursRestants + " jours ("
                                + certif.getDateExpiration().toLocalDate() + "). "
                                + "Pensez à créer une nouvelle version."
                );
            }
        }

        // Marquer comme envoyée
        certif.setNotifJ30Envoyee(true);
        certifRepo.save(certif);

        System.out.println("[Expiration] Notif 30j envoyée pour : " + certif.getTitre());
    }

    // ═════════════════════════════════════════════════════════════════════
    // NOTIFICATION 7 JOURS
    // ═════════════════════════════════════════════════════════════════════
    private void verifierNotif7Jours() {
        LocalDateTime dans7j = LocalDateTime.now().plusDays(7);
        LocalDateTime dans8j = LocalDateTime.now().plusDays(8);

        certifRepo.findAll().stream()
                .filter(c -> Boolean.TRUE.equals(c.getActif()))
                .filter(c -> c.getDateExpiration() != null)
                .filter(c -> !Boolean.TRUE.equals(c.getNotifJ7Envoyee()))
                .filter(c -> c.getDateExpiration().isAfter(dans7j)
                        && c.getDateExpiration().isBefore(dans8j))
                .forEach(this::envoyerNotif7Jours);
    }

    private void envoyerNotif7Jours(Certification certif) {
        List<PassageCertification> passages = passageRepo
                .findByStatutOrderByDateDebutDesc(StatutPassage.RAPPORT_VALIDE);

        for (PassageCertification passage : passages) {
            if (!passage.getCertification().getId().equals(certif.getId())) continue;

            Utilisateur auditeur = passage.getAuditeur();
            long joursRestants = ChronoUnit.DAYS.between(
                    LocalDateTime.now(), certif.getDateExpiration());

            // ── Notification plateforme auditeur ──
            notificationService.creer(auditeur, TypeNotification.CERTIF_EXPIRE_7J,
                    "🚨 URGENT — Votre qualification « " + certif.getTitre()
                            + " » expire dans " + joursRestants + " jours ("
                            + certif.getDateExpiration().toLocalDate() + "). "
                            + "Recertifiez-vous immédiatement.");
            // ── Email auditeur ────────────────────
            if (auditeur.getEmail() != null) {
                emailService.envoyerNotification(
                        auditeur.getEmail(),
                        auditeur.getPrenom() + " " + auditeur.getNom(),
                        "🚨 URGENT — Qualification expire dans 7 jours",
                        buildMessageExpiration(auditeur, certif, joursRestants)
                );
            }

            // ── Historique ────────────────────────
            try {
                historiqueService.logCertif(auditeur,
                        TypeHistorique.EXPIRATION_NOTIF_7J,
                        certif,
                        "Notification expiration 7j envoyée — Qualification : "
                                + certif.getTitre(), null);
            } catch (Exception e) {
                System.err.println("[Expiration] Historique 7j : " + e.getMessage());
            }
        }

        // ── Notifier l'expert ─────────────────────────────────────────
        if (certif.getExpert() != null) {
            Utilisateur expert = certif.getExpert();
            long joursRestants = ChronoUnit.DAYS.between(
                    LocalDateTime.now(), certif.getDateExpiration());

            notificationService.creer(expert, TypeNotification.CERTIF_EXPIRE_7J,
                    "🚨 URGENT — La qualification « " + certif.getTitre()
                            + " » expire dans " + joursRestants + " jours. "
                            + "Action requise immédiatement.");

            if (expert.getEmail() != null) {
                emailService.envoyerNotification(
                        expert.getEmail(),
                        expert.getPrenom() + " " + expert.getNom(),
                        "🚨 URGENT — Qualification expire dans 7 jours",
                        "URGENT — La qualification « " + certif.getTitre()
                                + " » expire dans " + joursRestants + " jours ("
                                + certif.getDateExpiration().toLocalDate() + "). "
                                + "Créez une nouvelle qualification dès maintenant."
                );
            }
        }

        // Marquer comme envoyée
        certif.setNotifJ7Envoyee(true);
        certifRepo.save(certif);

        System.out.println("[Expiration] Notif 7j envoyée pour : " + certif.getTitre());
    }

    // ═════════════════════════════════════════════════════════════════════
    // MARQUER EXPIRÉES
    // ═════════════════════════════════════════════════════════════════════
    private void verifierExpirees() {
        certifRepo.findAll().stream()
                .filter(c -> Boolean.TRUE.equals(c.getActif()))
                .filter(c -> c.getDateExpiration() != null)
                .filter(c -> c.getDateExpiration().isBefore(LocalDateTime.now()))
                .forEach(this::marquerExpiree);
    }

    private void marquerExpiree(Certification certif) {
        certif.setActif(false);
        certifRepo.save(certif);

        List<PassageCertification> passages = passageRepo
                .findByStatutOrderByDateDebutDesc(StatutPassage.RAPPORT_VALIDE);

        for (PassageCertification passage : passages) {
            if (!passage.getCertification().getId().equals(certif.getId())) continue;

            Utilisateur auditeur = passage.getAuditeur();

            // ── Notification plateforme auditeur ──
            notificationService.creer(auditeur, TypeNotification.CERTIF_EXPIREE,
                    "❌ Votre qualification « " + certif.getTitre()
                            + " » est expirée depuis le "
                            + certif.getDateExpiration().toLocalDate() + ". "
                            + "Vous devez vous recertifier pour continuer à auditer.");

            // ── Email auditeur ────────────────────
            if (auditeur.getEmail() != null) {
                emailService.envoyerNotification(
                        auditeur.getEmail(),
                        auditeur.getPrenom() + " " + auditeur.getNom(),
                        "❌ Votre qualification est expirée",
                        "Votre qualification « " + certif.getTitre()
                                + " » a expiré le " + certif.getDateExpiration().toLocalDate()
                                + ". Vous devez vous recertifier pour continuer à exercer."
                );
            }

            // ── Historique ────────────────────────
            try {
                historiqueService.logCertif(auditeur,
                        TypeHistorique.CERTIFICATION_EXPIREE,
                        certif,
                        "Qualification expirée : " + certif.getTitre()
                                + " — date : " + certif.getDateExpiration().toLocalDate(),
                        null);
            } catch (Exception e) {
                System.err.println("[Expiration] Historique expiree : " + e.getMessage());
            }
        }

        // ── Notifier l'expert ─────────────────────────────────────────
        if (certif.getExpert() != null) {
            Utilisateur expert = certif.getExpert();

            notificationService.creer(expert, TypeNotification.CERTIF_EXPIREE,
                    "❌ La qualification « " + certif.getTitre()
                            + " » a expiré. Elle a été désactivée automatiquement.");

            if (expert.getEmail() != null) {
                emailService.envoyerNotification(
                        expert.getEmail(),
                        expert.getPrenom() + " " + expert.getNom(),
                        "❌ Qualification expirée — action requise",
                        "La qualification « " + certif.getTitre()
                                + " » a expiré le " + certif.getDateExpiration().toLocalDate()
                                + " et a été désactivée automatiquement. "
                                + "Créez une nouvelle qualification pour vos auditeurs."
                );
            }
        }

        System.out.println("[Expiration] Qualification expirée : " + certif.getTitre());
    }

    // ═════════════════════════════════════════════════════════════════════
    // TEMPLATE MESSAGE EMAIL
    // ═════════════════════════════════════════════════════════════════════
    private String buildMessageExpiration(Utilisateur auditeur,
                                          Certification certif,
                                          long joursRestants) {
        return "Bonjour " + auditeur.getPrenom() + " " + auditeur.getNom() + ",\n\n"
                + "Votre qualification « " + certif.getTitre() + " » expire dans "
                + joursRestants + " jours, le "
                + certif.getDateExpiration().toLocalDate() + ".\n\n"
                + "Connectez-vous à la plateforme LEONI PAP pour vous recertifier "
                + "avant cette date.\n\n"
                + "Cordialement,\n"
                + "L'équipe LEONI PAP";
    }
}