package com.leoni.pap.repository;

import com.leoni.pap.entity.Certification;
import com.leoni.pap.entity.PassageCertification;
import com.leoni.pap.entity.Utilisateur;
import com.leoni.pap.entity.enums.StatutPassage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PassageCertificationRepository extends JpaRepository<PassageCertification, Long> {
    @Query("""
        SELECT p FROM PassageCertification p
        WHERE p.auditeur.id = :auditeurId
          AND p.statut IN :statuts
        ORDER BY p.dateDebut DESC NULLS LAST
        LIMIT 1
    """)
    Optional<PassageCertification> findTopEnCoursParAuditeur(
            @Param("auditeurId") Integer auditeurId,
            @Param("statuts")    List<StatutPassage> statuts);
    // ── EXISTANT ──────────────────────────────────────────────
    Optional<PassageCertification> findByAuditeurIdAndStatutIn(
            Integer auditeurId, List<StatutPassage> statuts);

    Optional<PassageCertification> findTopByAuditeurIdAndStatutOrderByDateDebutDesc(
            Integer auditeurId, StatutPassage statut);

    List<PassageCertification> findByAuditeurIdOrderByDateDebutDesc(Integer auditeurId);
    List<PassageCertification> findByCertificationIdOrderByDateDebutDesc(Long certifId);
    List<PassageCertification> findByStatutOrderByDateDebutDesc(StatutPassage statut);
    Optional<PassageCertification> findBySessionTestId(Long sessionTestId);

    List<PassageCertification> findByStatutAndCertificationIdOrderByDateDebutDesc(
            StatutPassage statut, Long certifId);

    Optional<PassageCertification> findTopByAuditeurAndStatutOrderByDateDebutDesc(
            Utilisateur auditeur, StatutPassage statut);

    Optional<PassageCertification> findByAuditeurIdAndStatut(
            Integer auditeurId, StatutPassage statut);

    List<PassageCertification> findByCertificationIdAndStatutInOrderByDateDebutDesc(
            Long certifId, List<StatutPassage> statuts);

    Optional<PassageCertification> findTopByAuditeurAndStatutInOrderByDateDebutDesc(
            Utilisateur auditeur, List<StatutPassage> statuts);

    List<PassageCertification> findByAuditeurAndStatutInOrderByDateDebutDesc(
            Utilisateur auditeur, List<StatutPassage> statuts);

    long countByAuditeurAndCertificationAndStatutIn(
            Utilisateur auditeur, Certification certification, List<StatutPassage> statuts);

    Optional<PassageCertification> findTopByAuditeurAndCertificationAndStatutInOrderByDateDebutDesc(
            Utilisateur auditeur, Certification certification, List<StatutPassage> statuts);

    List<PassageCertification> findByStatutIn(List<StatutPassage> statuts);

    @Query("SELECT p FROM PassageCertification p ORDER BY COALESCE(p.dateDebut, p.id) DESC")
    List<PassageCertification> findAllOrderByDateDebutDesc();

    // ── SPRINT 2 NOUVEAU ──────────────────────────────────────

    // Passage actif pour une certification SPECIFIQUE (pour multi-certif)
    Optional<PassageCertification> findByAuditeurIdAndCertificationIdAndStatutIn(
            Integer auditeurId, Long certificationId, List<StatutPassage> statuts);

    // Passages d'un auditeur par certification (pour savoir quelles certifs sont déjà passées)
    List<PassageCertification> findByAuditeurIdAndCertificationId(
            Integer auditeurId, Long certificationId);

    // Dernier passage par certif pour un auditeur
    Optional<PassageCertification> findTopByAuditeurIdAndCertificationIdOrderByDateDebutDesc(
            Integer auditeurId, Long certificationId);

    /** Passages dont le certificat attend la validation du chef (un chef précis) */
    List<PassageCertification> findByChefValidateurIdAndStatutCertificat(
            Integer chefId, String statutCertificat);

    /** Passages dont le certificat est en attente chef (tous statuts) */
    List<PassageCertification> findByStatutCertificatOrderByDateGenerationCertifDesc(
            String statutCertificat);

    /** Passages dont le certificat a été généré, par expert */
    List<PassageCertification> findByExpertGenerateurIdAndStatutCertificatIn(
            Integer expertId, List<String> statuts);
    // Dans PassageCertificationRepository.java
    List<PassageCertification> findByCertificationId(Long certificationId);
    /** Passages CERTIFIE ou avec certif VALIDE_CHEF pour un chef */
    @Query("""
        SELECT p FROM PassageCertification p
        WHERE p.chefValidateur.id = :chefId
        AND p.statutCertificat IN :statuts
        ORDER BY p.dateValidationChef DESC NULLS LAST
    """)
    List<PassageCertification> findByChefValidateurIdAndStatutCertificatIn(
            @Param("chefId") Integer chefId,
            @Param("statuts") List<String> statuts);

    /** Tous les passages avec un certificat généré (pour l'expert) */
    @Query("""
        SELECT p FROM PassageCertification p
        WHERE p.statutCertificat IS NOT NULL
        AND p.statutCertificat != 'NON_GENERE'
        ORDER BY p.dateGenerationCertif DESC NULLS LAST
    """)
    List<PassageCertification> findAllAvecCertificat();

    /** Passages en attente chef, filtrés par site du chef */
    @Query("""
        SELECT p FROM PassageCertification p
        WHERE p.chefValidateur.id = :chefId
        AND p.statutCertificat = 'EN_ATTENTE_CHEF'
        ORDER BY p.dateGenerationCertif DESC
    """)
    List<PassageCertification> findCertificatsEnAttenteParChef(@Param("chefId") Integer chefId);

    /** Pour le chef : tous les passages avec certificat (pour suivi) */
    @Query("""
        SELECT p FROM PassageCertification p
        WHERE p.chefValidateur.id = :chefId
        AND p.statutCertificat IN ('EN_ATTENTE_CHEF', 'VALIDE_CHEF', 'INVALIDE_CHEF')
        ORDER BY COALESCE(p.dateValidationChef, p.dateGenerationCertif) DESC NULLS LAST
    """)
    List<PassageCertification> findCertificatsByChef(@Param("chefId") Integer chefId);


}