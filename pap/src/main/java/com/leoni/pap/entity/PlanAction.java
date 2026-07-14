package com.leoni.pap.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Plan d'action corrective (PDCA) lié à un audit produit.
 * Déclenché quand QK > 0.5 (rose ou rouge).
 *
 * Sprint 3 — ajouts :
 *  - Champs P/D/C/A (planifier, do_, check, act) pour le formulaire PDCA
 *  - Envoi possible à un email externe avec boutons tokenisés
 *  - Relance automatique si EN_COURS depuis 3 jours
 *  - Statut EN_COURS ajouté à l'enum
 */
@Entity
@Table(name = "plan_action",
        indexes = {
                @Index(name = "idx_plan_action_audit",   columnList = "audit_id"),
                @Index(name = "idx_plan_action_statut",  columnList = "statut"),
                @Index(name = "idx_plan_action_resp",    columnList = "responsable_id")
        })
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class PlanAction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Audit concerné */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "audit_id", nullable = false)
    private AuditProduit audit;

    /** Non-conformité à l'origine de ce plan (peut être null = plan global) */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "non_conformite_id")
    private NonConformiteAudit nonConformite;

    // ── CONTENU GÉNÉRAL ───────────────────────────────────────
    @Column(nullable = false, length = 500)
    private String titre;

    @Column(length = 2000)
    private String description;

    /** Action corrective à mener */
    @Column(length = 2000)
    private String actionCorrective;

    /** Cause racine identifiée */
    @Column(length = 1000)
    private String causeRacine;

    // ── CHAMPS PDCA ───────────────────────────────────────────

    /**
     * P — Plan : Planifier les actions correctives.
     * Renseigné par l'auditeur dans le formulaire PDCA.
     */
    @Column(name = "planifier", length = 2000)
    private String planifier;

    /**
     * D — Do : Réaliser / déployer les actions planifiées.
     */
    @Column(name = "do_", length = 2000)
    private String do_;

    /**
     * C — Check : Contrôler l'efficacité des actions.
     */
    @Column(name = "check_", length = 2000)
    private String check;

    /**
     * A — Act : Standardiser et ajuster pour pérenniser.
     */
    @Column(name = "act", length = 2000)
    private String act;

    // ── STATUT ────────────────────────────────────────────────
    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private StatutPlanAction statut = StatutPlanAction.OUVERT;

    // ── DATES ─────────────────────────────────────────────────
    private LocalDate dateEcheance;

    private LocalDate dateCloture;

    // ── RESPONSABLE INTERNE ───────────────────────────────────
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "responsable_id")
    private Utilisateur responsable;

    // ── DESTINATAIRE EXTERNE ─────────────────────────────────

    /**
     * Email externe (hors plateforme) à qui le PDCA est envoyé.
     * Alternative au responsable interne de la plateforme.
     */
    @Column(name = "email_externe", length = 200)
    private String emailExterne;

    /**
     * Token UUID permettant au destinataire externe de valider le PDCA
     * sans se connecter à la plateforme.
     */
    @Column(name = "token_valider", length = 36)
    private String tokenValider;

    /**
     * Token UUID permettant au destinataire externe de marquer le PDCA
     * "En cours" — déclenche une relance automatique après 3 jours.
     */
    @Column(name = "token_en_cours", length = 36)
    private String tokenEnCours;

    /**
     * Date du dernier envoi ou relance d'email externe.
     * Utilisé par le scheduler pour calculer les 3 jours avant relance.
     */
    @Column(name = "date_dernier_envoi")
    private LocalDateTime dateDernierEnvoi;

    // ── EFFICACITÉ ────────────────────────────────────────────
    @Column(length = 1000)
    private String commentaireEfficacite;

    private Boolean efficace;

    // ── MÉTADONNÉES ───────────────────────────────────────────
    @Builder.Default
    @Column(nullable = false, updatable = false)
    private LocalDateTime dateCreation = LocalDateTime.now();

    private LocalDateTime dateModification;

    @PreUpdate
    public void preUpdate() {
        this.dateModification = LocalDateTime.now();
    }

    // ── Enum ──────────────────────────────────────────────────
    public enum StatutPlanAction {
        OUVERT,    // Plan créé, action non commencée
        EN_COURS,  // Destinataire a signalé qu'il traite (relance après 3 jours)
        FERME,     // Plan clôturé
        RESOLU     // Plan résolu avec succès → audit peut passer au vert
    }
}