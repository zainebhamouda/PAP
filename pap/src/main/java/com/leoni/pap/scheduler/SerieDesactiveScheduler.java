package com.leoni.pap.scheduler;

import com.leoni.pap.entity.AuditProduit;
import com.leoni.pap.entity.Utilisateur;
import com.leoni.pap.entity.enums.StatutAudit;
import com.leoni.pap.entity.enums.TypeNotification;
import com.leoni.pap.repository.AuditProduitRepository;
import com.leoni.pap.service.EmailService;
import com.leoni.pap.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Scheduler — Détection séries désactivées
 *
 * Vérifie chaque nuit les audits PLANIFIE ou EN_COURS dont la série
 * est désactivée (actif=false), et notifie l'expert planificateur
 * ainsi que l'auditeur (si assigné).
 *
 * L'expert peut ensuite modifier le mois via :
 *   PUT /api/audits/{id}  (champ datePrevue)
 *
 * L'auditeur peut modifier mois + deadline via :
 *   PUT /api/planification/audits/{id}/deadline
 *   PUT /api/audits/{id}
 */
@Component
@RequiredArgsConstructor
public class SerieDesactiveScheduler {

    private final AuditProduitRepository auditRepo;
    private final NotificationService    notifService;
    private final EmailService           emailService;

    /**
     * Exécuté chaque nuit à 07h00.
     * Cherche tous les audits actifs (PLANIFIE ou EN_COURS)
     * dont la série vient d'être désactivée.
     */
    @Scheduled(cron = "0 0 7 * * *")
    @Transactional
    public void detecterSeriesDesactivees() {

        // Cas 1 — Audits PLANIFIE avec série désactivée
        List<AuditProduit> auditsPlanifeSerieDesactivee =
                auditRepo.findAuditsPlanifiesSerieDesactivee();

        for (AuditProduit audit : auditsPlanifeSerieDesactivee) {
            notifierSerieDesactivee(audit, false);
        }

        // Cas 2 — Audits EN_COURS avec série désactivée
        List<AuditProduit> auditsEnCoursSerieDesactivee =
                auditRepo.findAuditsEnCoursSerieDesactivee();

        for (AuditProduit audit : auditsEnCoursSerieDesactivee) {
            notifierSerieDesactivee(audit, true);
        }

        if (!auditsPlanifeSerieDesactivee.isEmpty() || !auditsEnCoursSerieDesactivee.isEmpty()) {
            System.out.printf("[SerieDesactiveScheduler] %d audit(s) planifiés + %d en cours affectés par désactivation de série%n",
                    auditsPlanifeSerieDesactivee.size(),
                    auditsEnCoursSerieDesactivee.size());
        }
    }

    private void notifierSerieDesactivee(AuditProduit audit, boolean auditeurConcerne) {
        String serieNom = audit.getSerie() != null ? audit.getSerie().getNom() : "inconnue";
        String ref      = audit.getReference();
        String mois     = audit.getDatePrevue() != null ? audit.getDatePrevue().toString() : "—";

        String msgExpert = String.format(
                "⚠️ La série \"%s\" a été désactivée. L'audit %s (prévu %s) doit être reprogrammé. " +
                        "Modifiez le mois depuis le planning.", serieNom, ref, mois);

        String msgAuditeur = String.format(
                "⚠️ La série \"%s\" a été désactivée. Votre audit %s (prévu %s) sera reprogrammé par l'expert. " +
                        "Vous pourrez modifier la deadline.", serieNom, ref, mois);

        // Notifier le planificateur / expert
        Utilisateur expert = audit.getPlanificateur() != null
                ? audit.getPlanificateur()
                : (audit.getPlanification() != null ? audit.getPlanification().getCreateur() : null);

        if (expert != null) {
            notifService.creer(expert, TypeNotification.ALERTE, msgExpert);
            if (expert.getEmail() != null) {
                emailService.envoyerNotification(
                        expert.getEmail(),
                        expert.getPrenom() + " " + expert.getNom(),
                        "Série désactivée — Audit à reprogrammer : " + ref,
                        msgExpert);
            }
        }

        // Notifier l'auditeur si audit déjà assigné (cas 2)
        if (auditeurConcerne && audit.getAuditeur() != null) {
            notifService.creer(audit.getAuditeur(), TypeNotification.ALERTE, msgAuditeur);
            if (audit.getAuditeur().getEmail() != null) {
                emailService.envoyerNotification(
                        audit.getAuditeur().getEmail(),
                        audit.getAuditeur().getPrenom() + " " + audit.getAuditeur().getNom(),
                        "Série désactivée — Audit " + ref,
                        msgAuditeur);
            }
        }
    }
}