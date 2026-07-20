package com.leoni.pap.entity;

import com.leoni.pap.entity.enums.*;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import com.fasterxml.jackson.annotation.JsonIgnore;

/**
 * AuditProduit — MODIFIÉ Sprint 4
 *
 * Nouveautés Sprint 4 :
 *  - responsableMagasin : responsable magasin qui valide l'audit export
 *  - dateProchaineVerification : pour audit règles plates (+3 mois après réalisation)
 *  - semaineExport : semaine de l'export (ex: KW13)
 *  - salleExport : salle d'export (ex: LTN01)
 */
@Entity
@Table(name = "audit",
        indexes = {
                @Index(name = "idx_audit_statut",     columnList = "statut"),
                @Index(name = "idx_audit_type",       columnList = "typeAudit"),
                @Index(name = "idx_audit_date_prev",  columnList = "datePrevue"),
                @Index(name = "idx_audit_auditeur",   columnList = "auditeur_id"),
                @Index(name = "idx_audit_plant",      columnList = "plant_id"),
                @Index(name = "idx_audit_serie",      columnList = "serie_id"),
                @Index(name = "idx_audit_planif",     columnList = "planification_id")
        })
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class AuditProduit {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // ── TYPE & NATURE ──────────────────────────────────────────
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TypeAudit typeAudit;

    @Enumerated(EnumType.STRING)
    private NatureAudit natureAudit;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private StatutAudit statut = StatutAudit.PLANIFIE;

    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    private StatutAudit statutAvantRetard;

    // ── RÉFÉRENCE ──────────────────────────────────────────────
    @Column(unique = true, nullable = false, length = 100)
    private String reference;

    // ── PLANIFICATION ─────────────────────────────────────────
    @Column(nullable = false)
    private LocalDate datePrevue;

    private LocalDate dateRealisation;

    /** Deadline imposée par l'expert */
    private LocalDate deadline;

    // ── LIEN PLANIFICATION ────────────────────────────────────
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "planification_id")
    @JsonIgnore
    private PlanificationAudit planification;

    // ── ORGANISATION ──────────────────────────────────────────
    @Column(length = 200)
    private String familleCablage;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "serie_id")
    private Serie serie;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "projet_id")
    private Projet projet;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "segment_id")
    private Segment segment;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "plant_id", nullable = true)
    private Plant plant;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "site_id")
    private Site site;

    // ── ACTEURS ───────────────────────────────────────────────
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "auditeur_id")
    private Utilisateur auditeur;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "planificateur_id")
    private Utilisateur planificateur;

    /** ✅ Sprint 4 — Responsable magasin (pour AUDIT_MAGASIN_EXPORT) */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "responsable_magasin_id")
    private Utilisateur responsableMagasin;

    /**
     * ✅ NOUVEAU — Suivi entre collègues du même plant : liste des auditeurs
     * qui "suivent" la réalisation de cet audit (sans en avoir la
     * responsabilité). Permet à un auditeur de suivre l'avancement d'un
     * audit encore planifié ou en cours réalisé par un camarade du même
     * plant, sans pouvoir le modifier ni le démarrer/terminer à sa place.
     */
    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
            name = "audit_produit_suiveurs",
            joinColumns = @JoinColumn(name = "audit_id"),
            inverseJoinColumns = @JoinColumn(name = "suiveur_id")
    )
    @JsonIgnore
    @Builder.Default
    private java.util.Set<Utilisateur> suiveurs = new java.util.HashSet<>();

    @Column(length = 50)
    private String domaine;

    // ── RÉSULTATS AUDIT PRODUIT ────────────────────────────────
    private Integer nombreComposants;

    // ── Champs texte libres (fallback quand entités non résolues) ────
    private String variantNo;
    private String bmwNo;
    private String serieLabel;   // nom série en texte libre (depuis Excel)
    private String projetLabel;  // nom projet en texte libre (depuis Excel)
    private Double  totalPoints;
    private Double  facteur;
    private Double  valeurQK;
    private Boolean qkDepasseSeuil = false;

    @Enumerated(EnumType.STRING)
    @Column(length = 10)
    private CouleurQK couleurQK;

    // ── OBSERVATIONS ──────────────────────────────────────────
    @Column(length = 2000)
    private String observations;

    @Column(length = 500)
    private String actionImmediate;

    // ── PDCA ──────────────────────────────────────────────────
    private Boolean pdcaDeclenche = false;
    private LocalDateTime datePdca;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "responsable_pdca_id")
    private Utilisateur responsablePdca;

    // ── RAPPORT ───────────────────────────────────────────────
    @Column(length = 50)
    private String numeroRapport;

    @Column(length = 500)
    private String rapportUrl;

    @Column(length = 500)
    private String rapportFichierNom;

    private LocalDateTime dateEnvoi;

    private Boolean termineParAuditeur = false;
    private Boolean rapportGenere = false;

    @Column(length = 500)
    private String rapportGenerePdfUrl;

    @Column(name = "checklist_json", columnDefinition = "TEXT")
    private String checklistJson;

    @Column(name = "scores_json", columnDefinition = "TEXT")
    private String scoresJson;
    // ── AUDIT MAGASIN EXPORT — Sprint 4 ──────────────────────
    @Column(length = 200)
    private String zoneExpedition;   // Salle export (ex: LTN01)

    @Column(length = 200)
    private String destinationExport; // Numéros de série (info)

    /** ✅ Sprint 4 — Semaine export (ex: KW13) */
    @Column(length = 20)
    private String semaineExport;

    /** ✅ Sprint 4 — Validation par le responsable magasin */
    private Boolean valideParResponsableMagasin = false;
    private LocalDateTime dateValidationMagasin;

    // ── AUDIT RÈGLES PLATES — Sprint 4 ───────────────────────
    /** ✅ Sprint 4 — Date du prochain contrôle (+3 mois) */
    private LocalDate dateProchaineVerification;

    // ── NON-CONFORMITÉS ───────────────────────────────────────
    @OneToMany(mappedBy = "audit", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<NonConformiteAudit> nonConformites = new ArrayList<>();

    // ── CHECKLIST RÈGLES PLATES ───────────────────────────────
    @OneToMany(mappedBy = "audit", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<LigneChecklistReglePlate> checklistItems = new ArrayList<>();

    // ── PLANS D'ACTION ────────────────────────────────────────
    @OneToMany(mappedBy = "audit", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<PlanAction> plansAction = new ArrayList<>();

    // ── ANNEXES ───────────────────────────────────────────────
    @OneToMany(mappedBy = "audit", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<AuditProduitAnnexe> annexes = new ArrayList<>();

    // ── FICHE RÉPARATION ──────────────────────────────────────
    @OneToMany(mappedBy = "audit", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<FicheReparation> fichesReparation = new ArrayList<>();

    // ── MÉTADONNÉES ───────────────────────────────────────────
    @Column(nullable = true, updatable = false)
    private LocalDateTime dateCreation = LocalDateTime.now();

    private LocalDateTime dateModification;

    @PreUpdate
    public void preUpdate() {
        this.dateModification = LocalDateTime.now();
    }

    // ── CALCUL COULEUR QK ────────────────────────────────────
    public void calculerCouleurQK() {
        if (this.valeurQK == null) { this.couleurQK = null; return; }
        if (this.valeurQK == 0.0)      this.couleurQK = CouleurQK.VERT;
        else if (this.valeurQK <= 0.5) this.couleurQK = CouleurQK.ORANGE;
        else if (this.valeurQK <= 1.0) this.couleurQK = CouleurQK.ROSE;
        else                           this.couleurQK = CouleurQK.ROUGE;
        this.qkDepasseSeuil = (this.valeurQK > 0.0);
    }
}