package com.leoni.pap.scheduler;

import com.leoni.pap.entity.CertificatAuditeur;
import com.leoni.pap.entity.enums.TypeNotification;
import com.leoni.pap.repository.CertificatAuditeurRepository;
import com.leoni.pap.service.CertificatAuditeurService;
import com.leoni.pap.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/**
 * ✅ NOUVEAU — Vérifie l'expiration prochaine des certificats importés.
 *
 * IMPORTANT : contrairement à {@link CertificationScheduler} (cron fixe une
 * fois par jour), ce scheduler tourne toutes les MINUTES. Ceci est fait
 * exprès pour permettre de tester le mécanisme rapidement en configurant
 * temporairement des durées courtes dans application.properties :
 *   certificat.auditeur.duree-validite-minutes=5
 *   certificat.auditeur.notif-avant-expiration-minutes=2
 * (au lieu des valeurs de production : 1051200 = 2 ans, 10080 = 7 jours).
 * Une fois le test terminé, remettre les valeurs de production — le
 * scheduler continuera de tourner chaque minute mais ne trouvera
 * simplement rien à traiter la plupart du temps (requête légère, sans
 * impact notable).
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class CertificatAuditeurScheduler {

    private final CertificatAuditeurRepository certifAuditeurRepo;
    private final NotificationService          notifService;
    private final CertificatAuditeurService    certifAuditeurService;

    @Scheduled(fixedRate = 60_000) // toutes les 60 secondes
    @Transactional
    public void verifierExpirations() {
        LocalDateTime now   = LocalDateTime.now();
        long minutesAvant   = certifAuditeurService.getNotifAvantExpirationMinutes();
        LocalDateTime seuil = now.plusMinutes(minutesAvant);

        List<CertificatAuditeur> expirantBientot = certifAuditeurRepo.findExpirantBientot(now, seuil);
        for (CertificatAuditeur certif : expirantBientot) {
            if (certif.getAuditeur() != null) {
                notifService.creer(certif.getAuditeur(), TypeNotification.CERTIF_EXPIRE_7J,
                        "⚠️ Votre certificat importé expire bientôt (le "
                                + certif.getDateExpiration() + "). Contactez l'expert de votre plant.");
            }
            if (certif.getImportePar() != null) {
                notifService.creer(certif.getImportePar(), TypeNotification.CERTIF_EXPIRE_7J,
                        "⚠️ Le certificat de " + (certif.getAuditeur() != null
                                ? certif.getAuditeur().getPrenom() + " " + certif.getAuditeur().getNom() : "un auditeur")
                                + " expire bientôt (le " + certif.getDateExpiration() + ").");
            }
            certif.setNotifExpirationEnvoyee(true);
            certifAuditeurRepo.save(certif);
            log.info("[SCHEDULER][CertificatAuditeur] Alerte expiration envoyée — id={}", certif.getId());
        }
        if (!expirantBientot.isEmpty()) {
            log.info("[SCHEDULER][CertificatAuditeur] {} certificat(s) traité(s)", expirantBientot.size());
        }
    }
}