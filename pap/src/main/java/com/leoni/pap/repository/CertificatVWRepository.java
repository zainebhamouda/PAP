package com.leoni.pap.repository;

import com.leoni.pap.entity.CertificatVW;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface CertificatVWRepository extends JpaRepository<CertificatVW, Long> {

    /** Toutes les certifs d'un plant donné, triées par date desc */
    List<CertificatVW> findByPlantIdOrderByDateObtentionDesc(Integer plantId);

    /** Toutes les certifs d'un auditeur donné */
    List<CertificatVW> findByAuditeurIdOrderByDateObtentionDesc(Integer auditeurId);

    /**
     * Vérifie si un auditeur possède une certification VW ACTIVE non expirée
     * pour son plant. Utilisé pour le contrôle d'accès aux audits.
     */
    @Query("""
        SELECT COUNT(c) > 0 FROM CertificatVW c
        WHERE c.auditeur.id = :auditeurId
          AND c.plant.id    = :plantId
          AND c.statut      = 'ACTIF'
          AND c.dateExpiration >= :today
    """)
    boolean existsCertifValide(
            @Param("auditeurId") Integer auditeurId,
            @Param("plantId")    Integer plantId,
            @Param("today")      LocalDate today
    );

    /**
     * Certification VW valide la plus récente d'un auditeur pour un plant.
     */
    @Query("""
        SELECT c FROM CertificatVW c
        WHERE c.auditeur.id = :auditeurId
          AND c.plant.id    = :plantId
          AND c.statut      = 'ACTIF'
          AND c.dateExpiration >= :today
        ORDER BY c.dateObtention DESC
    """)
    Optional<CertificatVW> findCertifValide(
            @Param("auditeurId") Integer auditeurId,
            @Param("plantId")    Integer plantId,
            @Param("today")      LocalDate today
    );

    /** Certifs saisies par un expert donné */
    List<CertificatVW> findByExpertSaisiIdOrderByDateSaisieDesc(Integer expertId);
}
