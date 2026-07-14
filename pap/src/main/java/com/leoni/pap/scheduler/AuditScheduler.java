package com.leoni.pap.scheduler;

import com.leoni.pap.entity.AuditProduit;
import com.leoni.pap.entity.enums.StatutAudit;
import com.leoni.pap.entity.enums.TypeNotification;
import com.leoni.pap.repository.AuditProduitRepository;
import com.leoni.pap.service.EmailService;
import com.leoni.pap.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.List;

/**
 * AuditScheduler — MODIFIÉ Sprint 3
 *
 * Tâches planifiées :
 *  1. Chaque matin à 7h00 : marquer les audits en retard (statut → EN_RETARD)
 *  2. Chaque matin à 7h00 : envoyer les rappels deadline J-4
 *     (notification plateforme + email pour les audits dont le deadline est dans 4 jours)
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class AuditScheduler {

    private final AuditProduitRepository auditRepo;
    private final NotificationService    notifService;
    private final EmailService           emailService;

    // ═══════════════════════════════════════════════════════════
    // 1. MARQUER LES AUDITS EN RETARD — chaque jour à 7h00
    // ═══════════════════════════════════════════════════════════

    @Scheduled(cron = "0 0 7 * * *")
    public void marquerAuditsEnRetard() {
        LocalDate aujourd_hui = LocalDate.now();
        List<AuditProduit> enRetard = auditRepo.findEnRetard(aujourd_hui);

        int count = 0;
        for (AuditProduit audit : enRetard) {
            if (audit.getStatut() == StatutAudit.PLANIFIE
                    || audit.getStatut() == StatutAudit.EN_COURS) {
                audit.setStatutAvantRetard(audit.getStatut());
                audit.setStatut(StatutAudit.EN_RETARD);
                auditRepo.save(audit);

                // Notifier l'auditeur
                if (audit.getAuditeur() != null) {
                    notifService.creer(
                            audit.getAuditeur(),
                            TypeNotification.RAPPEL_DEADLINE,
                            "RETARD : L'audit " + audit.getReference()
                                    + " était prévu le " + audit.getDatePrevue()
                                    + " et n'a pas encore été réalisé."
                    );
                }
                // Notifier le planificateur / expert
                if (audit.getPlanificateur() != null) {
                    notifService.creer(
                            audit.getPlanificateur(),
                            TypeNotification.RAPPEL_DEADLINE,
                            "RETARD : L'audit " + audit.getReference()
                                    + " assigné à "
                                    + (audit.getAuditeur() != null
                                    ? audit.getAuditeur().getPrenom() + " " + audit.getAuditeur().getNom()
                                    : "non assigné")
                                    + " est en retard."
                    );
                }
                count++;
            }
        }
        if (count > 0) {
            log.info("[AuditScheduler] {} audit(s) marqué(s) EN_RETARD.", count);
        }
    }

    // ═══════════════════════════════════════════════════════════
    // 2. RAPPELS DEADLINE J-4 — chaque jour à 7h00
    // ═══════════════════════════════════════════════════════════

    /**
     * Envoie une notification + email à l'auditeur
     * 4 jours avant le deadline de son audit produit.
     *
     * Si le deadline est dans 4 jours (date du jour + 4),
     * et que l'audit n'est pas encore TERMINE ou ANNULE :
     *  → Notification plateforme
     *  → Email
     */
    @Scheduled(cron = "0 0 7 * * *")
    public void envoyerRappelsDeadline() {
        LocalDate dateDeadlineVisee = LocalDate.now().plusDays(4);
        List<AuditProduit> auditsProches = auditRepo.findByDeadline(dateDeadlineVisee);

        int count = 0;
        for (AuditProduit audit : auditsProches) {
            // Ne pas envoyer si déjà terminé ou annulé
            if (audit.getStatut() == StatutAudit.TERMINE
                    || audit.getStatut() == StatutAudit.ANNULE) {
                continue;
            }

            String message = "⏰ RAPPEL : L'audit " + audit.getReference()
                    + " doit être terminé dans 4 jours"
                    + " (deadline : " + audit.getDeadline() + "). "
                    + "Projet : " + (audit.getProjet() != null ? audit.getProjet().getNom() : "N/A")
                    + " — Série : " + (audit.getSerie() != null ? audit.getSerie().getNom() : "N/A");

            // Notification plateforme
            if (audit.getAuditeur() != null) {
                notifService.creer(
                        audit.getAuditeur(),
                        TypeNotification.RAPPEL_DEADLINE,
                        message
                );

                // Email
                if (audit.getAuditeur().getEmail() != null) {
                    emailService.envoyerNotification(
                            audit.getAuditeur().getEmail(),
                            audit.getAuditeur().getPrenom() + " " + audit.getAuditeur().getNom(),
                            "Rappel deadline — " + audit.getReference(),
                            message + "\n\nConnectez-vous à AICAP pour réaliser votre audit."
                    );
                }
            }
            count++;
        }
        if (count > 0) {
            log.info("[AuditScheduler] {} rappel(s) deadline J-4 envoyé(s).", count);
        }
    }
}