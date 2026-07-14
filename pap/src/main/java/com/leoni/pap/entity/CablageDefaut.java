package com.leoni.pap.entity;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonIgnore;

import jakarta.persistence.*;
import lombok.*;

/**
 * Défaut réel présent dans le cablage du test pratique.
 * Saisi par l'Expert AVANT que l'auditeur passe le test.
 * Utilisé pour comparer avec ce que l'auditeur trouve.
 *
 * MODIFICATION SPRINT 2 :
 * - Ajout du lien vers TestPratique (nouveau modèle)
 * - certification_id conservé pour compatibilité existante
 */
@Entity
@Table(name = "cablage_defaut")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class CablageDefaut {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // ── EXISTANT — NE PAS TOUCHER ─────────────────────────────
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "certification_id")
    private Certification certification;

    // ── NOUVEAU SPRINT 2 ──────────────────────────────────────
    // Lien vers le TestPratique (nouveau modèle)
    // Un défaut appartient soit à un TestPratique, soit à une Certification (ancien modèle)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "test_pratique_id")
    @JsonBackReference
    @JsonIgnore
    private TestPratique testPratique;

    // Numéro du défaut (1-10)
    private Integer numero;

    // Type de défaut (ex: "Dénudage excessif")
    @Column(nullable = false)
    private String typeDefaut;

    // Localisation sur le cablage (ex: "Fil 3, position 15cm")
    private String localisation;

    // Mesure réelle (ex: "12.5mm")
    private String mesureReelle;

    // Valeur acceptable selon standard
    private String valeurAcceptable;

    private String observations;
}