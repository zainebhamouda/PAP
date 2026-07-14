package com.leoni.pap.scheduler;

import com.leoni.pap.entity.*;
import com.leoni.pap.entity.enums.*;
import com.leoni.pap.repository.*;
import com.leoni.pap.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class CertificationScheduler {

    private final CertificationRepository certifRepo;
    private final HistoriqueRepository    historiqueRepo;
    private final NotificationService     notifService;

    // ═════════════════════════════════════════════════════════
    // 08h00 — ALERTE J-30
    // ═════════════════════════════════════════════════════════
    @Scheduled(cron = "0 0 8 * * *")
    @Transactional
    public void alerteJ30() {
        log.info("[SCHEDULER] Vérification expirations J-30...");
        LocalDateTime now     = LocalDateTime.now();
        LocalDateTime dans30J = now.plusDays(30);

        // ✅ findExpirantAvant30Jours — filtre déjà notifJ30Envoyee = false
        List<Certification> certifs = certifRepo.findExpirantAvant30Jours(now, dans30J);

        for (Certification certif : certifs) {
            notifService.creer(certif.getAuditeur(), TypeNotification.CERTIF_EXPIRE_30J,
                    "⚠️ Votre certification " + certif.getNumeroCertificat()
                            + " expire dans 30 jours, le "
                            + certif.getDateExpiration().toLocalDate() + ".");

            notifService.notifierEncadrement(TypeNotification.CERTIF_EXPIRE_30J,
                    "📋 Certification de " + certif.getAuditeur().getNom() + " "
                            + certif.getAuditeur().getPrenom() + " expire le "
                            + certif.getDateExpiration().toLocalDate() + ".", certif);

            logHistorique(certif.getAuditeur(), TypeHistorique.EXPIRATION_NOTIF_30J,
                    certif, "Alerte J-30 envoyée");

            // ✅ notifJ30Envoyee — nom exact du champ
            certif.setNotifJ30Envoyee(true);
            certifRepo.save(certif);
            log.info("[SCHEDULER] J-30 → {}", certif.getNumeroCertificat());
        }
        log.info("[SCHEDULER] J-30 terminé — {} traités", certifs.size());
    }

    // ═════════════════════════════════════════════════════════
    // 08h30 — ALERTE J-7
    // ═════════════════════════════════════════════════════════
    @Scheduled(cron = "0 30 8 * * *")
    @Transactional
    public void alerteJ7() {
        log.info("[SCHEDULER] Vérification expirations J-7...");
        LocalDateTime now    = LocalDateTime.now();
        LocalDateTime dans7J = now.plusDays(7);

        // ✅ findExpirantAvant7Jours — filtre déjà notifJ7Envoyee = false
        List<Certification> certifs = certifRepo.findExpirantAvant7Jours(now, dans7J);

        for (Certification certif : certifs) {
            notifService.creer(certif.getAuditeur(), TypeNotification.CERTIF_EXPIRE_7J,
                    "🚨 URGENT — Votre certification " + certif.getNumeroCertificat()
                            + " expire dans 7 jours, le "
                            + certif.getDateExpiration().toLocalDate() + " !");

            String msgEnc = "🚨 Certification de " + certif.getAuditeur().getNom()
                    + " " + certif.getAuditeur().getPrenom()
                    + " expire dans 7 jours !";
            notifService.notifierEncadrement(TypeNotification.CERTIF_EXPIRE_7J, msgEnc, certif);
            notifService.notifierTousExperts(TypeNotification.CERTIF_EXPIRE_7J, msgEnc, certif);

            logHistorique(certif.getAuditeur(), TypeHistorique.EXPIRATION_NOTIF_7J,
                    certif, "Alerte J-7 urgente envoyée");

            // ✅ notifJ7Envoyee — nom exact du champ
            certif.setNotifJ7Envoyee(true);
            certifRepo.save(certif);
            log.info("[SCHEDULER] J-7 → {}", certif.getNumeroCertificat());
        }
        log.info("[SCHEDULER] J-7 terminé — {} traités", certifs.size());
    }

    // ═════════════════════════════════════════════════════════
    // 09h00 — MARQUER EXPIRÉES + DÉBLOQUER
    // ═════════════════════════════════════════════════════════
    @Scheduled(cron = "0 0 9 * * *")
    @Transactional
    public void traiterExpirations() {
        log.info("[SCHEDULER] Traitement expirations + déblocages...");
        LocalDateTime now = LocalDateTime.now();

        // ── Marquer expirées ──────────────────────────────────
        List<Certification> expirees = certifRepo.findExpirees(now);
        for (Certification certif : expirees) {
            certif.setStatut(StatutCertification.EXPIRE);
            certifRepo.save(certif);

            notifService.creer(certif.getAuditeur(), TypeNotification.CERTIF_EXPIREE,
                    "❌ Votre certification " + certif.getNumeroCertificat()
                            + " a expiré le " + certif.getDateExpiration().toLocalDate()
                            + ". Recertifiez-vous.");

            notifService.notifierEncadrement(TypeNotification.CERTIF_EXPIREE,
                    "❌ Certification de " + certif.getAuditeur().getNom() + " "
                            + certif.getAuditeur().getPrenom() + " a expiré.", certif);

            logHistorique(certif.getAuditeur(), TypeHistorique.CERTIFICATION_EXPIREE,
                    certif, "Certification expirée automatiquement");

            log.info("[SCHEDULER] Expirée : {}", certif.getNumeroCertificat());
        }

        // ── Débloquer auditeurs ───────────────────────────────
        List<Certification> debloquables = certifRepo.findDebloquables(now);
        for (Certification certif : debloquables) {
            certif.setStatut(StatutCertification.EN_ATTENTE);
            certif.setNbTentativesTheoriques(0);
            certif.setDateDeblocage(null);
            certifRepo.save(certif);

            notifService.creer(certif.getAuditeur(), TypeNotification.CERTIF_DEBLOQUE,
                    "✅ Votre période de blocage est terminée. "
                            + "Vous pouvez à nouveau passer votre certification.");

            logHistorique(certif.getAuditeur(), TypeHistorique.DEBLOQUE,
                    certif, "Déblocage automatique après 6 mois");

            log.info("[SCHEDULER] Débloqué : {}", certif.getAuditeur().getMatricule());
        }

        log.info("[SCHEDULER] Expirées : {} | Débloqués : {}",
                expirees.size(), debloquables.size());
    }

    // ═════════════════════════════════════════════════════════
    // 03h00 — NETTOYAGE NOTIFICATIONS
    // ═════════════════════════════════════════════════════════
    @Scheduled(cron = "0 0 3 * * *")
    @Transactional
    public void nettoyerNotifications() {
        log.info("[SCHEDULER] Nettoyage notifications anciennes...");
        notifService.nettoyerAnciennesNotifs();
        log.info("[SCHEDULER] Nettoyage terminé.");
    }

    // ═════════════════════════════════════════════════════════
    // HELPER
    // ═════════════════════════════════════════════════════════
    private void logHistorique(Utilisateur acteur, TypeHistorique type,
                               Certification certif, String details) {
        historiqueRepo.save(Historique.builder()
                .utilisateur(acteur)
                .type(type)
                .certification(certif)
                .details(details)
                .dateAction(LocalDateTime.now())
                .build());
    }
}