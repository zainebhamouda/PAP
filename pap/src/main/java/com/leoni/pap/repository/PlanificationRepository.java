package com.leoni.pap.repository;

import com.leoni.pap.entity.PlanificationAudit;
import com.leoni.pap.entity.enums.StatutPlanification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface PlanificationRepository extends JpaRepository<PlanificationAudit, Long> {

    // ── Mes planifications (avec audits chargés pour les compteurs) ──
    @Query("""
        SELECT DISTINCT p
        FROM PlanificationAudit p
        LEFT JOIN FETCH p.audits
        LEFT JOIN FETCH p.segment seg
        LEFT JOIN FETCH seg.plant pl
        LEFT JOIN FETCH pl.site
        WHERE p.createur.id = :createurId
        ORDER BY p.dateCreation DESC
        """)
    List<PlanificationAudit> findMesPlanifications(@Param("createurId") Integer createurId);

    // ── Toutes les planifications (avec audits chargés) ──────────────
    @Query("""
        SELECT DISTINCT p
        FROM PlanificationAudit p
        LEFT JOIN FETCH p.audits
        LEFT JOIN FETCH p.segment seg
        LEFT JOIN FETCH seg.plant pl
        LEFT JOIN FETCH pl.site
        ORDER BY p.dateCreation DESC
        """)
    List<PlanificationAudit> findAllByOrderByDateCreationDesc();

    // ── Par statut ───────────────────────────────────────────────────
    @Query("""
        SELECT DISTINCT p
        FROM PlanificationAudit p
        LEFT JOIN FETCH p.audits
        LEFT JOIN FETCH p.segment seg
        LEFT JOIN FETCH seg.plant pl
        LEFT JOIN FETCH pl.site
        WHERE p.statut = :statut
        ORDER BY p.dateCreation DESC
        """)
    List<PlanificationAudit> findByStatutOrderByDateCreationDesc(
            @Param("statut") StatutPlanification statut);

    // ── Par créateur (simple, sans fetch) ────────────────────────────
    List<PlanificationAudit> findByCreateurIdOrderByDateCreationDesc(Integer createurId);

    // ── Par site (via segment ou via audits) ─────────────────────────
    @Query("""
        SELECT DISTINCT p
        FROM PlanificationAudit p
        LEFT JOIN FETCH p.audits
        LEFT JOIN FETCH p.segment seg
        LEFT JOIN FETCH seg.plant pl
        LEFT JOIN FETCH pl.site site
        WHERE site.id = :siteId
        ORDER BY p.dateCreation DESC
        """)
    List<PlanificationAudit> findPlanificationsBySiteId(@Param("siteId") Integer siteId);

    // ── Par plant (via segment) ──────────────────────────────────────
    @Query("""
        SELECT DISTINCT p
        FROM PlanificationAudit p
        LEFT JOIN FETCH p.audits
        LEFT JOIN FETCH p.segment seg
        LEFT JOIN FETCH seg.plant pl
        LEFT JOIN FETCH pl.site
        WHERE pl.id = :plantId
        ORDER BY p.dateCreation DESC
        """)
    List<PlanificationAudit> findPlanificationsByPlantId(@Param("plantId") Integer plantId);

    // ── Détail unique avec audits chargés ────────────────────────────
    @Query("""
        SELECT DISTINCT p
        FROM PlanificationAudit p
        LEFT JOIN FETCH p.audits
        LEFT JOIN FETCH p.segment seg
        LEFT JOIN FETCH seg.plant pl
        LEFT JOIN FETCH pl.site
        WHERE p.id = :id
        """)
    Optional<PlanificationAudit> findByIdWithAudits(@Param("id") Long id);


    // ── Planifications où l'auditeur est assigné sur au moins 1 audit ──
    @Query("""
    SELECT DISTINCT p
    FROM PlanificationAudit p
    LEFT JOIN FETCH p.audits a
    LEFT JOIN FETCH p.segment seg
    LEFT JOIN FETCH seg.plant pl
    LEFT JOIN FETCH pl.site
    WHERE a.auditeur.id = :auditeurId
    ORDER BY p.dateCreation DESC
    """)
    List<PlanificationAudit> findPlanificationsParAuditeurAssigne(@Param("auditeurId") Integer auditeurId);

    // ── Planifications créées par l'auditeur (il peut en créer) ─────────
    @Query("""
    SELECT DISTINCT p
    FROM PlanificationAudit p
    LEFT JOIN FETCH p.audits
    LEFT JOIN FETCH p.segment seg
    LEFT JOIN FETCH seg.plant pl
    LEFT JOIN FETCH pl.site
    WHERE p.createur.id = :auditeurId
    ORDER BY p.dateCreation DESC
    """)
    List<PlanificationAudit> findPlanificationsCreesParAuditeur(@Param("auditeurId") Integer auditeurId);
}