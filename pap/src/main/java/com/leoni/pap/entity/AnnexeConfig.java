package com.leoni.pap.entity;

import jakarta.persistence.*;
import lombok.*;

/**
 * AnnexeConfig — NOUVEAU Sprint 3
 *
 * Configuration des annexes disponibles par plant.
 * Permet de définir quelles annexes l'auditeur doit importer
 * pour chaque plant (BMW, VW, Audi, Mercedes, etc.)
 *
 * Exemples :
 *   BMW → Annexe 1A, 1B, 4, 5, 6, 7, 8
 *   VW  → Annexe 1A, 1B, 4, 5, 6
 *   Commune → Annexe rapport final (tous plants)
 */
@Entity
@Table(name = "annexe_config",
        indexes = {
                @Index(name = "idx_annexe_cfg_plant", columnList = "plant_id")
        })
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class AnnexeConfig {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    /**
     * Plant concerné — null si annexe commune à tous les plants.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "plant_id")
    private Plant plant;

    /** Code de l'annexe : "1A", "1B", "4", "5", "6", "7", "8" */
    @Column(nullable = false, length = 20)
    private String typeAnnexe;

    /**
     * Libellé complet de l'annexe.
     * Ex: "Annexe 1B - Feuille de calcul QK (principale)"
     */
    @Column(nullable = false, length = 200)
    private String libelle;

    /**
     * Vrai si cette annexe contient la valeur QK.
     * Uniquement 1A et 1B sont porteurs de QK.
     */
    @Column(nullable = false)
    private Boolean porteurQK = false;

    /**
     * Priorité QK : si plusieurs annexes portent le QK,
     * celle avec la priorité la plus haute est utilisée.
     * 1B = priorité 2 (préférée), 1A = priorité 1.
     */
    @Column(nullable = false)
    private Integer prioriteQK = 0;

    /** Obligatoire : l'auditeur doit l'importer pour valider */
    @Column(nullable = false)
    private Boolean obligatoire = true;

    /** Ordre d'affichage dans la liste des annexes */
    @Column(nullable = false)
    private Integer ordreAffichage = 1;

    /** Annexe commune à tous les plants (plant_id = null) */
    @Column(nullable = false)
    private Boolean communeTousPlants = false;
}