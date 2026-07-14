
// ═══════════════════════════════════════════════
// RapportPratique.java
// Rapport rempli par l'auditeur pendant le test pratique
// ═══════════════════════════════════════════════
package com.leoni.pap.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Rapport rempli par l'auditeur lors du test pratique.
 * Sera comparé avec les données expert pour calculer le score.
 */
@Entity
@Table(name = "rapport_pratique")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class RapportPratique {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne( fetch = FetchType.LAZY)
    @JoinColumn(nullable = false,name = "certification_id")
    private Certification certification;

    // Lignes du rapport (JSON)
    // [{numero:1, typeDefaut:"...", localisation:"...", mesure:"...", observations:"..."}]
    @Column(columnDefinition = "TEXT")
    private String lignesJson;

    // Score calculé après comparaison
    private Double score;
    private Integer defautsCorrectementIdentifies;
    private Integer totalDefauts;

    private LocalDateTime dateSoumission;
    private Boolean soumis = false;
}
