package com.leoni.pap.repository;

import com.leoni.pap.entity.CertificatAuditeur;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface CertificatAuditeurRepository extends JpaRepository<CertificatAuditeur, Long> {

    // ── Pour l'expert : tout ce qu'il a importé pour son plant ──
    List<CertificatAuditeur> findByPlantIdOrderByDateImportDesc(Integer plantId);

    // ── Pour un auditeur : ses propres certificats importés ─────
    List<CertificatAuditeur> findByAuditeurIdOrderByDateObtentionDesc(Integer auditeurId);

    /**
     * ✅ Auditeurs "certifiés" (au sens : possèdent un import de certificat
     * encore valide) pour un plant donné — utilisé pour enrichir la liste
     * des auditeurs proposés en planification.
     */
    @Query("""
        SELECT c FROM CertificatAuditeur c
        WHERE c.plant.id = :plantId
          AND c.actif = true
          AND c.dateExpiration > :now
        ORDER BY c.dateExpiration ASC
        """)
    List<CertificatAuditeur> findValidesParPlant(@Param("plantId") Integer plantId,
                                                 @Param("now") LocalDateTime now);

    /** ✅ Pour le scheduler — certificats expirant bientôt, notif pas encore envoyée */
    @Query("""
        SELECT c FROM CertificatAuditeur c
        WHERE c.actif = true
          AND c.notifExpirationEnvoyee = false
          AND c.dateExpiration BETWEEN :now AND :seuil
        """)
    List<CertificatAuditeur> findExpirantBientot(@Param("now") LocalDateTime now,
                                                 @Param("seuil") LocalDateTime seuil);
}