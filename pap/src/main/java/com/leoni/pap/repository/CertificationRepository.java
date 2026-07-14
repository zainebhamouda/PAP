package com.leoni.pap.repository;

import com.leoni.pap.entity.Certification;
import com.leoni.pap.entity.Utilisateur;
import com.leoni.pap.entity.enums.StatutCertification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface CertificationRepository extends JpaRepository<Certification, Long> {

    // ── EXISTANT — NE PAS TOUCHER ─────────────────────────────

    Optional<Certification> findTopByAuditeurOrderByDateCreationDesc(Utilisateur auditeur);
    List<Certification>     findByAuditeurOrderByDateCreationDesc(Utilisateur auditeur);
    List<Certification>     findByStatut(StatutCertification statut);
    long                    countByStatut(StatutCertification statut);

    @Query("SELECT c FROM Certification c WHERE c.statut = 'CERTIFIE' ORDER BY c.scoreFinal DESC")
    List<Certification> findClassement();

    @Query("SELECT c FROM Certification c WHERE c.statut = 'CERTIFIE' " +
            "AND c.dateExpiration BETWEEN :now AND :limite AND c.notifJ30Envoyee = false")
    List<Certification> findExpirantAvant30Jours(@Param("now") LocalDateTime now, @Param("limite") LocalDateTime limite);

    @Query("SELECT c FROM Certification c WHERE c.statut = 'CERTIFIE' " +
            "AND c.dateExpiration BETWEEN :now AND :limite AND c.notifJ7Envoyee = false")
    List<Certification> findExpirantAvant7Jours(@Param("now") LocalDateTime now, @Param("limite") LocalDateTime limite);

    @Query("SELECT c FROM Certification c WHERE c.statut = 'CERTIFIE' AND c.dateExpiration < :now")
    List<Certification> findExpirees(@Param("now") LocalDateTime now);

    @Query("SELECT c FROM Certification c WHERE c.statut = 'BLOQUE' AND c.dateDeblocage < :now")
    List<Certification> findDebloquables(@Param("now") LocalDateTime now);

    List<Certification> findByStatutAndDateExpirationBetween(StatutCertification statut, LocalDateTime debut, LocalDateTime fin);
    List<Certification> findByStatutAndDateExpirationBefore(StatutCertification statut, LocalDateTime date);
    List<Certification> findByStatutAndDateDeblocageBefore(StatutCertification statut, LocalDateTime date);

    // ── SPRINT 2 — MULTI-ACTIVE ───────────────────────────────

    // Rétro-compatibilité : retourne la première active (au cas où)
    Optional<Certification> findByActifTrue();

    // NOUVEAU : toutes les certifications actives (plusieurs possibles)
    List<Certification> findAllByActifTrue();

    // NOUVEAU : certifications actives par client
    List<Certification> findAllByActifTrueAndClientId(Integer clientId);

    // Certifications créées par un expert
    List<Certification> findByExpertIdOrderByDateCreationDesc(Integer expertId);
    List<Certification> findByExpertIdOrderByDateCreationDesc(Long expertId);

    List<Certification> findAllByOrderByDateCreationDesc();

    List<Certification> findByTestTheoriqueIdOrderByDateCreationDesc(Long testTheoriqueId);
    List<Certification> findByTestPratiqueIdOrderByDateCreationDesc(Long testPratiqueId);

    Optional<Certification> findByExpertIdAndBrouillonTrue(Integer expertId);
    Optional<Certification> findFirstByExpertIdAndBrouillonTrueOrderByDateCreationDesc(Long expertId);
    List<Certification>     findAllByExpertIdAndBrouillonTrue(Long expertId);

    // NOUVEAU : certifications confirmées (non brouillon) avec client
    @Query("SELECT c FROM Certification c WHERE c.brouillon = false ORDER BY c.dateCreation DESC")
    List<Certification> findAllConfirmees();

    // NOUVEAU : certifications actives exclues d'un passage déjà effectué par cet auditeur
    @Query("SELECT c FROM Certification c WHERE c.actif = true AND c.brouillon = false " +
            "AND c.id NOT IN (SELECT p.certification.id FROM PassageCertification p " +
            "WHERE p.auditeur.id = :auditeurId AND p.statut NOT IN ('ANNULE'))")
    List<Certification> findActivesNonPasseesPar(@Param("auditeurId") Integer auditeurId);

    // NOUVEAU : toutes les certifications actives non brouillon
    @Query("SELECT c FROM Certification c WHERE c.actif = true AND c.brouillon = false ORDER BY c.titre ASC")
    List<Certification> findAllActives();
}