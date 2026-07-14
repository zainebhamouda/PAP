package com.leoni.pap.repository;

import com.leoni.pap.entity.FicheReparation;
import com.leoni.pap.entity.FicheReparation.StatutFicheReparation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface FicheReparationRepository extends JpaRepository<FicheReparation, Long> {

    // ── Par audit ─────────────────────────────────────────────
    List<FicheReparation> findByAuditId(Long auditId);

    Optional<FicheReparation> findFirstByAuditIdOrderByDateCreationDesc(Long auditId);

    // ── Par créateur (remplace chefService + expert) ──────────
    List<FicheReparation> findByCreeParId(Integer creeParId);

    // ── Par statut ────────────────────────────────────────────
    List<FicheReparation> findByStatut(StatutFicheReparation statut);

    // ── Par token (actions email) ─────────────────────────────
    Optional<FicheReparation> findByTokenValider(String tokenValider);

    Optional<FicheReparation> findByTokenEnCours(String tokenEnCours);

    // ── Relances automatiques (scheduler) ────────────────────
    @Query("""
        SELECT f FROM FicheReparation f
        WHERE f.statut = 'EN_COURS_TRAITEMENT'
          AND f.dateDernierEnvoi < :limite
        ORDER BY f.dateDernierEnvoi ASC
        """)
    List<FicheReparation> findFichesEnCoursARelancer(@Param("limite") LocalDateTime limite);
    List<FicheReparation> findByStatutIn(List<StatutFicheReparation> statuts);
}