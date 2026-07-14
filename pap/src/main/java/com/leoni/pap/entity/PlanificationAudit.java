package com.leoni.pap.entity;

import com.leoni.pap.entity.enums.StatutPlanification;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import com.fasterxml.jackson.annotation.JsonIgnore;

@Entity
@Table(name = "planification_audit",
        indexes = {
                @Index(name = "idx_planif_statut",       columnList = "statut"),
                @Index(name = "idx_planif_date_debut",   columnList = "dateDebut"),
                @Index(name = "idx_planif_createur",     columnList = "createur_id"),
                @Index(name = "idx_planif_segment",      columnList = "segment_id")
        })
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class PlanificationAudit {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String nom;

    @Column(length = 1000)
    private String description;

    @Column(nullable = false)
    private LocalDate dateDebut;

    @Column(nullable = false)
    private LocalDate dateFin;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private ModePlanification mode;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private StatutPlanification statut = StatutPlanification.BROUILLON;

    private LocalDateTime dateLancement;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "createur_id", nullable = false)
    private Utilisateur createur;

    // ── SEGMENT ───────────────────────────────────────────────
    /**
     * Segment auquel appartient cette planification.
     * Extrait depuis le nom du fichier Excel ou sélectionné manuellement.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "segment_id")
    private Segment segment;

    @Column(length = 500)
    private String fichierPlanificationNom;

    @Column(length = 500)
    private String fichierReclamationsNom;

    @Column(length = 500)
    private String fichierChangementsTechniquesNom;

    private Integer nombreAuditsTotal    = 0;
    private Integer nombreAuditsTermines = 0;
    private Integer nombreAuditsEnRetard = 0;

    @OneToMany(mappedBy = "planification", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    @JsonIgnore
    private List<AuditProduit> audits = new ArrayList<>();

    @Column(nullable = false, updatable = false)
    @Builder.Default
    private LocalDateTime dateCreation = LocalDateTime.now();

    private LocalDateTime dateModification;

    @PreUpdate
    public void preUpdate() {
        this.dateModification = LocalDateTime.now();
    }

    public enum ModePlanification {
        IMPORT_EXCEL,
        GENERATION_IA
    }
}