package com.leoni.pap.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

/**
 * AuditProduitAnnexe — NOUVEAU Sprint 3
 *
 * Représente un fichier annexe importé par l'auditeur pour un AuditProduit.
 * Chaque plant peut avoir ses propres annexes (ex: BMW → 1A, 1B, 4, 5, 6, 7, 8).
 * Des annexes communes existent pour tous les plants.
 *
 * La valeur QK est extraite des annexes 1A ou 1B.
 */
@Entity
@Table(name = "audit_produit_annexe",
        indexes = {
                @Index(name = "idx_annexe_audit", columnList = "audit_id"),
                @Index(name = "idx_annexe_type",  columnList = "typeAnnexe")
        })
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class AuditProduitAnnexe {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Audit auquel appartient cette annexe */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "audit_id", nullable = false)
    private AuditProduit audit;

    /**
     * Type / nom de l'annexe : "1A", "1B", "4", "5", "6", "7", "8"
     * "COMMUN_1", "COMMUN_2", etc. pour les annexes communes à tous les plants
     */
    @Column(nullable = false, length = 20)
    private String typeAnnexe;

    /**
     * Libellé affiché (ex: "Annexe 1A - Feuille de mesure QK",
     *                      "Annexe 4 - Contrôle visuel")
     */
    @Column(length = 200)
    private String libelle;

    /** Nom du fichier importé par l'auditeur */
    @Column(length = 500)
    private String fichierNom;

    /** Chemin / URL du fichier stocké */
    @Column(length = 1000)
    private String fichierUrl;

    /** Type MIME du fichier (application/pdf, image/jpeg, ...) */
    @Column(length = 100)
    private String mimeType;

    /** L'auditeur a importé ce fichier */
    @Column(nullable = false)
    private Boolean importe = false;

    /**
     * Valeur QK extraite de cette annexe (uniquement pour 1A et 1B).
     * La valeur retenue pour l'audit est celle de 1B si disponible, sinon 1A.
     */
    private Double valeurQkExtraite;

    /** Date d'import par l'auditeur */
    private LocalDateTime dateImport;

    /** Auditeur ayant importé ce fichier */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "importe_par_id")
    private Utilisateur importePar;

    /** Ordre d'affichage dans la liste des annexes */
    @Column(nullable = false)
    private Integer ordreAffichage = 1;

    /** Indique si cette annexe est commune à tous les plants */
    @Column(nullable = false)
    private Boolean communeTousPlants = false;

    /** Donnees du formulaire annexe (brouillon ou valide) */
    @Column(columnDefinition = "TEXT")
    private String formDataJson;

    /** Formulaire annexe valide par l'auditeur */
    @Column(nullable = false)
    private Boolean formValide = false;

    // ═══════════════════════════════════════════════════════════
    // NOUVEAU : Validation croisée par un autre auditeur (ex: Annexe 4)
    // ═══════════════════════════════════════════════════════════

    /** Auditeur du même plant désigné pour valider (signer) cette annexe */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "auditeur_validateur_id")
    private Utilisateur auditeurValidateur;

    /** null (pas de circuit) | EN_ATTENTE | VALIDEE | REJETEE */
    @Column(length = 20)
    private String statutValidationCroisee;

    /** Date d'envoi de l'annexe vers l'auditeur validateur */
    private LocalDateTime dateEnvoiValidation;

    /** Date de la décision (validation ou rejet) de l'auditeur validateur */
    private LocalDateTime dateValidationCroisee;

    /** Commentaire laissé par l'auditeur validateur */
    @Column(length = 1000)
    private String commentaireValidationCroisee;

    /** Chemin du PDF généré de l'annexe remplie, envoyé pour signature */
    @Column(length = 500)
    private String pdfValidationPath;
}