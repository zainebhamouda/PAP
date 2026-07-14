package com.leoni.pap.repository;

import com.leoni.pap.entity.PlanAction;
import com.leoni.pap.entity.PlanAction.StatutPlanAction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * PlanActionRepository — Sprint 3 (enrichi)
 *
 * Ajouts par rapport au Sprint 2 :
 *  - findPDCAsEnCoursARelancer : pour le scheduler de relance automatique (3 jours)
 *  - findByTokenValider / findByTokenEnCours : pour le traitement des actions email
 *  - findByEmailExterne : pour retrouver les PDCA envoyés à un email externe
 */
public interface PlanActionRepository extends JpaRepository<PlanAction, Long> {

    // ── Requêtes existantes ───────────────────────────────────

    List<PlanAction> findByAuditId(Long auditId);

    List<PlanAction> findByResponsableId(Integer responsableId);

    List<PlanAction> findByStatut(StatutPlanAction statut);

    @Query("""
        SELECT p FROM PlanAction p
        WHERE p.audit.id = :auditId
          AND (p.statut = 'FERME' OR p.statut = 'RESOLU')
        """)
    List<PlanAction> findPDCAValidesParAudit(@Param("auditId") Long auditId);

    // ── Nouvelles requêtes Sprint 3 ───────────────────────────

    /**
     * PDCA marqués "En cours" par le destinataire externe
     * et dont le dernier envoi remonte à plus de {@code limite} (= now - 3 jours).
     * Utilisé par {@link com.leoni.pap.scheduler.FicheReparationScheduler}
     * pour déclencher la relance automatique.
     */
    @Query("""
        SELECT p FROM PlanAction p
        WHERE p.statut = 'EN_COURS'
          AND p.emailExterne IS NOT NULL
          AND p.dateDernierEnvoi < :limite
        ORDER BY p.dateDernierEnvoi ASC
        """)
    List<PlanAction> findPDCAsEnCoursARelancer(@Param("limite") LocalDateTime limite);

    /**
     * Retrouver un PDCA par son token de validation (bouton "Valider" dans l'email).
     */
    Optional<PlanAction> findByTokenValider(String tokenValider);
    Optional<PlanAction> findTopByAuditIdOrderByDateCreationDesc(Long auditId);
    /**
     * Retrouver un PDCA par son token "En cours" (bouton "En cours" dans l'email).
     */
    Optional<PlanAction> findByTokenEnCours(String tokenEnCours);

    /**
     * Tous les PDCA envoyés à un email externe particulier.
     */
    List<PlanAction> findByEmailExterne(String emailExterne);
}