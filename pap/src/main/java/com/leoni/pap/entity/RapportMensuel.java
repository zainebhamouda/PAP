package com.leoni.pap.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

/**
 * RapportMensuel — NOUVEAU
 *
 * Représente le rapport mensuel "Annexe 1A" (Monthly Report Product Audit
 * Wire Harnesses) compilé pour un plant / mois / année donné.
 *
 * Il agrège, dans l'ordre chronologique, une ligne par audit produit
 * (typeAudit = AUDIT_PRODUIT, statut = TERMINE, Annexe 1A validée) réalisé
 * sur ce plant durant le mois concerné, avec la valeur QK de chaque audit
 * (colorée : VERT si QK = 0, ORANGE si 0 < QK <= 0.5, ROUGE si QK > 0.5).
 *
 * Un seul enregistrement existe par couple (plant, annee, mois) : chaque
 * nouvelle validation d'Annexe 1A sur ce plant/mois régénère les fichiers.
 */
@Entity
@Table(name = "rapport_mensuel",
        uniqueConstraints = @UniqueConstraint(name = "uk_rapport_plant_annee_mois",
                columnNames = {"plant_id", "annee", "mois"}),
        indexes = {
                @Index(name = "idx_rapport_annee", columnList = "annee"),
                @Index(name = "idx_rapport_plant", columnList = "plant_id")
        })
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class RapportMensuel {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "plant_id", nullable = false)
    private Plant plant;

    /** Année du rapport (ex: 2026) */
    @Column(nullable = false)
    private Integer annee;

    /** Mois du rapport, 1 = Janvier ... 12 = Décembre */
    @Column(nullable = false)
    private Integer mois;

    /** Nombre d'audits agrégés dans ce rapport */
    @Column(nullable = false)
    private Integer nombreAudits = 0;

    /** Date de dernière génération / régénération */
    private LocalDateTime dateGeneration;

    /** Utilisateur ayant déclenché la dernière génération (peut être null si auto) */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "genere_par_id")
    private Utilisateur generePar;

    /** Chemin / URL du fichier Excel généré (.xlsx) */
    @Column(length = 1000)
    private String excelUrl;

    /** Chemin / URL du fichier PDF généré */
    @Column(length = 1000)
    private String pdfUrl;
}
