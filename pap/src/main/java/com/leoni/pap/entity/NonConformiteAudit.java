package com.leoni.pap.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

/**
 * Non-conformité détectée lors d'un audit.
 * Chaque défaut a un type, une gravité (points) et une description.
 * La somme des points × facteur = indicateur QK.
 */
@Entity
@Table(name = "non_conformite_audit")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class NonConformiteAudit {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // ── LIEN AUDIT ────────────────────────────────────────────
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "audit_id", nullable = false)
    private AuditProduit audit;

    // ── DÉFAUT ────────────────────────────────────────────────
    // Code défaut (ex: depuis catalogue IC3115)
    @Column(length = 50)
    private String codeDefaut;

    // Description du défaut
    @Column(nullable = false, length = 500)
    private String description;

    // Type de défaut (ex: Couleur fil incorrect, Contact oxydé, Mesure non conforme...)
    @Column(length = 200)
    private String typeDefaut;

    // Gravité en points (25, 50, 75, 100 selon IT TN 3625 / annexe 4 IP3010)
    @Column(nullable = false)
    private Integer points;

    // Quantité de défauts de ce type trouvés
    @Column(nullable = false)
    private Integer quantite = 1;

    // Total points pour cette ligne (points × quantite)
    private Integer totalPoints;

    // Zone concernée (processus, poste, ligne...)
    @Column(length = 200)
    private String zone;

    // Photo du défaut (URL)
    @Column(length = 500)
    private String photoUrl;

    // Action corrective proposée
    @Column(length = 1000)
    private String actionCorrective;

    // ── MÉTADONNÉES ───────────────────────────────────────────
    @Column(nullable = false, updatable = false)
    private LocalDateTime dateCreation = LocalDateTime.now();

    @PrePersist
    public void prePersist() {
        if (this.points != null && this.quantite != null) {
            this.totalPoints = this.points * this.quantite;
        }
    }

    @PreUpdate
    public void preUpdate() {
        if (this.points != null && this.quantite != null) {
            this.totalPoints = this.points * this.quantite;
        }
    }
}
