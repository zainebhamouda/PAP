package com.leoni.pap.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

/**
 * Certificat final PDF avec workflow de signatures.
 * Workflow : Génération → Signature Expert → Signature Chef → PDF final
 */
@Entity
@Table(name = "certificat")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Certificat {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(nullable = false,name = "certification_id")
    private Certification certification;

    private String numeroCertificat;

    // Chemin du PDF généré
    private String cheminPdf;

    // ── SIGNATURES ───────────────────────────────
    // Signature Expert
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "expert_id")
    private Utilisateur expert;
    private Boolean signatureExpert = false;
    private LocalDateTime dateSignatureExpert;

    // Signature Chef de Service (choisi par l'expert)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "chef_id")
    private Utilisateur chefService;
    private Boolean signatureChef = false;
    private LocalDateTime dateSignatureChef;

    // ── STATUT ───────────────────────────────────
    // GENERE → EN_ATTENTE_EXPERT → EN_ATTENTE_CHEF → SIGNE → ENVOYE
    private String statut = "GENERE";

    private LocalDateTime dateGeneration = LocalDateTime.now();
    private LocalDateTime dateEnvoi;

    // Historique stocké
    private Boolean dansHistoriqueExpert = false;
    private Boolean dansHistoriqueChef   = false;
}
