package com.leoni.pap.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "demande_extension")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class DemandeExtension {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "audit_id", nullable = false)
    private AuditProduit audit;

    @Column(name = "raison_type", nullable = false, length = 50)
    private String raisonType;           // CHARGE_TRAVAIL, MALADIE, etc.

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "delai_demande")
    private LocalDate delaiDemande;      // Nouveau délai souhaité par l'auditeur

    @Column(name = "statut", length = 20)
    private String statut;               // EN_ATTENTE | TRAITE | REFUSE

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "traite_at")
    private LocalDateTime traiteAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "auditeur_id")
    private Utilisateur auditeur;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "expert_id")
    private Utilisateur expert;

    @PrePersist
    void prePersist() {
        if (createdAt == null) createdAt = LocalDateTime.now();
        if (statut == null) statut = "EN_ATTENTE";
    }
}