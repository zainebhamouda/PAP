package com.leoni.pap.entity;

import com.leoni.pap.entity.enums.StatutChecklistItem;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Ligne de checklist pour l'audit des règles plates / mètres ruban.
 * Chaque instrument est vérifié périodiquement (par date).
 * Forme : checklist structurée avec critères de conformité.
 */
@Entity
@Table(name = "checklist_regle_plate",
        indexes = {
                @Index(name = "idx_crp_audit",      columnList = "audit_id"),
                @Index(name = "idx_crp_statut",     columnList = "statut"),
                @Index(name = "idx_crp_prochain",   columnList = "prochaineVerification")
        })
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class LigneChecklistReglePlate {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // ── LIEN AUDIT ────────────────────────────────────────────
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "audit_id", nullable = false)
    private AuditProduit audit;

    // ── IDENTIFICATION INSTRUMENT ─────────────────────────────
    // Numéro / identifiant de l'instrument
    @Column(nullable = false, length = 100)
    private String numeroInstrument;

    // Type : "REGLE_PLATE" ou "METRE_RUBAN"
    @Column(nullable = false, length = 50)
    private String typeInstrument;

    // Localisation (poste, ligne, zone)
    @Column(length = 200)
    private String localisation;

    // Plage de mesure (ex: 0-300mm)
    @Column(length = 100)
    private String plageMesure;

    // ── CRITÈRES DE VÉRIFICATION ──────────────────────────────
    // Critère 1 : Lisibilité des graduations
    @Enumerated(EnumType.STRING)
    private StatutChecklistItem lisibiliteGraduations = StatutChecklistItem.NON_VERIFIE;

    // Critère 2 : Absence de détérioration physique
    @Enumerated(EnumType.STRING)
    private StatutChecklistItem etatPhysique = StatutChecklistItem.NON_VERIFIE;

    // Critère 3 : Précision de mesure (étalonnage)
    @Enumerated(EnumType.STRING)
    private StatutChecklistItem precisionMesure = StatutChecklistItem.NON_VERIFIE;

    // Critère 4 : Présence étiquette validité
    @Enumerated(EnumType.STRING)
    private StatutChecklistItem etiquetteValidite = StatutChecklistItem.NON_VERIFIE;

    // Critère 5 : Propreté
    @Enumerated(EnumType.STRING)
    private StatutChecklistItem proprete = StatutChecklistItem.NON_VERIFIE;

    // Statut global de l'instrument
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private StatutChecklistItem statut = StatutChecklistItem.NON_VERIFIE;

    // ── DATES ─────────────────────────────────────────────────
    private LocalDate derniereVerification;
    private LocalDate prochaineVerification; // Calculée automatiquement (+ périodicité)

    // Périodicité en mois (par défaut 3 mois selon IT TN 3625)
    private Integer periodiciteEnMois = 3;

    // ── OBSERVATIONS ──────────────────────────────────────────
    @Column(length = 1000)
    private String observations;

    @Column(length = 500)
    private String actionCorrective;

    // Valeur mesurée lors du contrôle (en mm)
    private Double valeurMesuree;
    private Double valeurReference;
    private Double ecart;
    private Double toleranceMax;

    // ── MÉTADONNÉES ───────────────────────────────────────────
    @Column(nullable = false, updatable = false)
    private LocalDateTime dateCreation = LocalDateTime.now();

    private LocalDateTime dateModification;

    @PreUpdate
    public void preUpdate() {
        this.dateModification = LocalDateTime.now();
        // Calcul automatique écart
        if (this.valeurMesuree != null && this.valeurReference != null) {
            this.ecart = Math.abs(this.valeurMesuree - this.valeurReference);
        }
        // Statut global : NON_CONFORME si au moins un critère NON_CONFORME
        if (lisibiliteGraduations == StatutChecklistItem.NON_CONFORME
                || etatPhysique == StatutChecklistItem.NON_CONFORME
                || precisionMesure == StatutChecklistItem.NON_CONFORME
                || etiquetteValidite == StatutChecklistItem.NON_CONFORME
                || proprete == StatutChecklistItem.NON_CONFORME) {
            this.statut = StatutChecklistItem.NON_CONFORME;
        } else if (lisibiliteGraduations == StatutChecklistItem.CONFORME
                && etatPhysique == StatutChecklistItem.CONFORME
                && precisionMesure == StatutChecklistItem.CONFORME
                && etiquetteValidite == StatutChecklistItem.CONFORME
                && proprete == StatutChecklistItem.CONFORME) {
            this.statut = StatutChecklistItem.CONFORME;
        }
    }
}
