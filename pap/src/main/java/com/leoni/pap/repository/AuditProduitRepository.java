package com.leoni.pap.repository;

import com.leoni.pap.entity.AuditProduit;
import com.leoni.pap.entity.enums.CouleurQK;
import com.leoni.pap.entity.enums.StatutAudit;
import com.leoni.pap.entity.enums.TypeAudit;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface AuditProduitRepository extends JpaRepository<AuditProduit, Long> {

    // ── PAR TYPE ──────────────────────────────────────────────
    List<AuditProduit> findByTypeAuditOrderByDatePrevueDesc(TypeAudit type);
    List<AuditProduit> findByTypeAuditAndStatutOrderByDatePrevueDesc(TypeAudit type, StatutAudit statut);

    // ── PAR AUDITEUR ──────────────────────────────────────────
    List<AuditProduit> findByAuditeurIdOrderByDatePrevueDesc(Integer auditeurId);
    List<AuditProduit> findByAuditeurIdAndStatutOrderByDatePrevueDesc(Integer auditeurId, StatutAudit statut);
    List<AuditProduit> findByAuditeurIdAndTypeAuditOrderByDatePrevueDesc(Integer auditeurId, TypeAudit type);
    List<AuditProduit> findByAuditeurIdAndStatut(Integer auditeurId, StatutAudit statut);

    List<AuditProduit> findByAuditeurIdAndTypeAuditAndPlanificationId(
            Integer auditeurId, TypeAudit type, Long planificationId);

    // ── PAR PLANT ─────────────────────────────────────────────
    List<AuditProduit> findByPlantIdOrderByDatePrevueDesc(Integer plantId);
    List<AuditProduit> findByPlantIdAndTypeAuditOrderByDatePrevueDesc(Integer plantId, TypeAudit type);
    List<AuditProduit> findByAuditeurId(Integer auditeurId);
    // ── PAR SITE ──────────────────────────────────────────────
    List<AuditProduit> findBySiteIdOrderByDatePrevueDesc(Integer siteId);

    // ── PAR SÉRIE ─────────────────────────────────────────────
    List<AuditProduit> findBySerieId(Integer serieId);
    List<AuditProduit> findBySerieIdOrderByDatePrevueDesc(Integer serieId);

    // ── PAR PLANIFICATION ─────────────────────────────────────
    List<AuditProduit> findByPlanificationId(Long planificationId);

    // ── PAR RÉFÉRENCE ─────────────────────────────────────────
    Optional<AuditProduit> findByReference(String reference);
    boolean existsByReference(String reference);

    // ── PAR COULEUR QK ────────────────────────────────────────
    List<AuditProduit> findByCouleurQK(CouleurQK couleurQK);

    @Query("SELECT a FROM AuditProduit a WHERE a.plant.id = :plantId AND a.couleurQK = :couleur ORDER BY a.datePrevue DESC")
    List<AuditProduit> findByPlantAndCouleur(@Param("plantId") Integer plantId,
                                             @Param("couleur") CouleurQK couleur);

    @Query("SELECT a FROM AuditProduit a WHERE a.plant.id = :plantId AND a.couleurQK IN ('ORANGE','ROSE','ROUGE') ORDER BY a.datePrevue DESC")
    List<AuditProduit> findAlertesByPlant(@Param("plantId") Integer plantId);

    // ── AUDITS EN RETARD ──────────────────────────────────────
    /**
     * ✅ CORRIGÉ — Se base sur la DEADLINE (et non datePrevue)
     * Cible PLANIFIE et EN_COURS uniquement (pas TERMINE/ANNULE/EN_RETARD)
     * Un audit dont la deadline est dans le futur ne sera JAMAIS marqué EN_RETARD
     */
    @Query("""
        SELECT a FROM AuditProduit a
        WHERE a.statut IN ('PLANIFIE', 'EN_COURS')
          AND a.deadline IS NOT NULL
          AND a.deadline < :today
        """)
    List<AuditProduit> findEnRetard(@Param("today") LocalDate today);

    /**
     * ✅ NOUVEAU — Audits EN_RETARD dont la deadline est repassée dans le futur
     * Utilisé par le scheduler pour les débloquer automatiquement
     */
    @Query("""
        SELECT a FROM AuditProduit a
        WHERE a.statut = 'EN_RETARD'
          AND a.deadline IS NOT NULL
          AND a.deadline >= :today
        """)
    List<AuditProduit> findEnRetardAvecDeadlineFuture(@Param("today") LocalDate today);

    // ── DEADLINE PROCHE (notifications J-4) ──────────────────
    @Query("""
        SELECT a FROM AuditProduit a
        WHERE a.deadline = :dateDeadline
          AND a.statut IN ('PLANIFIE', 'EN_COURS')
          AND a.auditeur IS NOT NULL
        """)
    List<AuditProduit> findByDeadline(@Param("dateDeadline") LocalDate dateDeadline);

    // ── AUDITS D'AUJOURD'HUI ──────────────────────────────────
    @Query("SELECT a FROM AuditProduit a WHERE a.datePrevue = :today AND a.statut IN ('PLANIFIE', 'EN_COURS')")
    List<AuditProduit> findAujourdhui(@Param("today") LocalDate today);

    // ── PLANNING DU MOIS ──────────────────────────────────────
    @Query("SELECT a FROM AuditProduit a WHERE a.datePrevue BETWEEN :debut AND :fin ORDER BY a.datePrevue")
    List<AuditProduit> findByMois(@Param("debut") LocalDate debut, @Param("fin") LocalDate fin);

    @Query("SELECT a FROM AuditProduit a WHERE a.plant.id = :plantId AND a.datePrevue BETWEEN :debut AND :fin ORDER BY a.datePrevue")
    List<AuditProduit> findByPlantAndMois(@Param("plantId") Integer plantId,
                                          @Param("debut") LocalDate debut,
                                          @Param("fin") LocalDate fin);

    // ── RAPPORT MENSUEL (Annexe 1A) ────────────────────────────
    // ⚠️ Se base sur dateRealisation (date RÉELLE de fin d'audit), pas datePrevue
    // (date planifiée) : un audit planifié un mois et réalisé le mois suivant
    // doit apparaître dans le rapport du mois où il a réellement été terminé.
    @Query("SELECT a FROM AuditProduit a WHERE a.plant.id = :plantId AND a.dateRealisation BETWEEN :debut AND :fin ORDER BY a.dateRealisation")
    List<AuditProduit> findByPlantAndMoisRealisation(@Param("plantId") Integer plantId,
                                                     @Param("debut") LocalDate debut,
                                                     @Param("fin") LocalDate fin);

    // ── STATISTIQUES QK ───────────────────────────────────────
    @Query("SELECT AVG(a.valeurQK) FROM AuditProduit a WHERE a.typeAudit = 'AUDIT_PRODUIT' AND a.statut = 'TERMINE' AND a.site.id = :siteId AND a.dateRealisation BETWEEN :debut AND :fin")
    Double avgQkBySiteAndPeriode(@Param("siteId") Integer siteId,
                                 @Param("debut") LocalDate debut,
                                 @Param("fin") LocalDate fin);

    @Query("SELECT COUNT(a) FROM AuditProduit a WHERE a.auditeur.id = :auditeurId AND a.statut = 'TERMINE'")
    Long countAuditsTerminesByAuditeur(@Param("auditeurId") Integer auditeurId);

    // ── CHECKLIST RÈGLES PLATES ───────────────────────────────
    @Query("SELECT a FROM AuditProduit a WHERE a.typeAudit = 'AUDIT_REGLES_PLATES' AND a.plant.id = :plantId ORDER BY a.datePrevue DESC")
    List<AuditProduit> findChecklistsByPlant(@Param("plantId") Integer plantId);

    // ── RAPPORTS GÉNÉRÉS ──────────────────────────────────────
    List<AuditProduit> findByRapportGenereTrueOrderByDateEnvoiDesc();

    // ── DERNIER AUDIT PAR FAMILLE ─────────────────────────────
    @Query("SELECT a FROM AuditProduit a WHERE a.typeAudit = 'AUDIT_PRODUIT' AND a.plant.id = :plantId AND a.familleCablage = :famille ORDER BY a.dateRealisation DESC")
    List<AuditProduit> findByFamilleCablage(@Param("plantId") Integer plantId,
                                            @Param("famille") String famille);

    // ── DASHBOARD COMPTAGES ───────────────────────────────────
    long countByStatut(StatutAudit statut);
    long countByTypeAudit(TypeAudit type);
    long countByTypeAuditAndStatut(TypeAudit type, StatutAudit statut);

    @Query("SELECT COUNT(a) FROM AuditProduit a WHERE a.qkDepasseSeuil = true AND a.statut = 'TERMINE'")
    long countQkDepasses();

    long countByCouleurQK(CouleurQK couleurQK);

    @Query("SELECT COUNT(a) FROM AuditProduit a WHERE a.couleurQK IN ('ORANGE','ROSE','ROUGE') AND a.statut = 'TERMINE'")
    long countAuditsEnAlerte();

    // ── PAR AUDITEUR + STATUT ─────────────────────────────────
    long countByAuditeurIdAndStatut(Integer auditeurId, StatutAudit statut);

    @Query("""
        SELECT a FROM AuditProduit a
         JOIN FETCH a.serie s
        LEFT JOIN FETCH a.planificateur
        LEFT JOIN FETCH a.planification p
        LEFT JOIN FETCH p.createur
        WHERE a.statut = 'PLANIFIE'
          AND s.actif = false
          AND a.typeAudit = 'AUDIT_PRODUIT'
        """)
    List<AuditProduit> findAuditsPlanifiesSerieDesactivee();

    @Query("""
        SELECT a FROM AuditProduit a
         JOIN FETCH a.serie s
        LEFT JOIN FETCH a.auditeur
        LEFT JOIN FETCH a.planificateur
        LEFT JOIN FETCH a.planification p
        LEFT JOIN FETCH p.createur
        WHERE a.statut = 'EN_COURS'
          AND s.actif = false
          AND a.typeAudit = 'AUDIT_PRODUIT'
        """)
    List<AuditProduit> findAuditsEnCoursSerieDesactivee();

    @Query("""
        SELECT a FROM AuditProduit a
        LEFT JOIN FETCH a.serie
        LEFT JOIN FETCH a.auditeur
        LEFT JOIN FETCH a.planification
        LEFT JOIN FETCH a.plant
        WHERE (a.rapportUrl IS NOT NULL OR a.rapportFichierNom IS NOT NULL)
          AND a.typeAudit = 'AUDIT_PRODUIT'
        ORDER BY a.dateEnvoi DESC
        """)
    List<AuditProduit> findAllWithRapport();

    List<AuditProduit> findByPlanificationIdOrderByDatePrevueAsc(Long planificationId);

    List<AuditProduit> findByAuditeurIdAndDatePrevueBetween(
            Integer auditeurId,
            LocalDate debut,
            LocalDate fin);
}