package com.leoni.pap.repository;

import com.leoni.pap.entity.AuditProduitAnnexe;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.Optional;

/**
 * AuditProduitAnnexeRepository — NOUVEAU Sprint 3
 */
public interface AuditProduitAnnexeRepository extends JpaRepository<AuditProduitAnnexe, Long> {
    List<AuditProduitAnnexe> findByAuditId(Long auditId);
    List<AuditProduitAnnexe> findByAuditIdOrderByOrdreAffichageAsc(Long auditId);

    Optional<AuditProduitAnnexe> findByAuditIdAndTypeAnnexe(Long auditId, String typeAnnexe);

    /** Toutes les annexes importées pour un audit */
    @Query("SELECT a FROM AuditProduitAnnexe a WHERE a.audit.id = :auditId AND a.importe = true")
    List<AuditProduitAnnexe> findImporteesByAuditId(@Param("auditId") Long auditId);

    /** Vérifie si toutes les annexes obligatoires ont été importées */
    @Query("""
        SELECT COUNT(a) = 0
        FROM AuditProduitAnnexe a
        WHERE a.audit.id = :auditId
          AND a.importe = false
        """)
    boolean toutesAnnexesImportees(@Param("auditId") Long auditId);

    /** Annexes portant la valeur QK pour un audit */
    @Query("""
        SELECT a FROM AuditProduitAnnexe a
        WHERE a.audit.id = :auditId
          AND a.valeurQkExtraite IS NOT NULL
        ORDER BY a.ordreAffichage DESC
        """)
    List<AuditProduitAnnexe> findAnnexesAvecQK(@Param("auditId") Long auditId);

    void deleteByAuditId(Long auditId);

    void deleteByAuditIdAndTypeAnnexe(Long auditId, String typeAnnexe);
}