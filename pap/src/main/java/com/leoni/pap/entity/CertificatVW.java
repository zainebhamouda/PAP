package com.leoni.pap.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * CertificatVW — Certification externe VW (Volkswagen).
 *
 * Pour les plants VW, les auditeurs sont certifiés directement par le client VW
 * et non via le parcours de qualification interne (examens, tests pratiques…).
 *
 * L'expert du plant VW importe manuellement le PDF de certification fourni par VW.
 * L'administrateur peut autoriser cette saisie via le flag peutCreerCertif de l'expert.
 *
 * Un CertificatVW est lié à un auditeur (Utilisateur de rôle AUDITEUR)
 * dont le plant est un plant VW.
 */
@Entity
@Table(name = "certificat_vw",
        uniqueConstraints = @UniqueConstraint(columnNames = {"auditeur_id", "date_obtention"}))
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class CertificatVW {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // ── Auditeur concerné ────────────────────────────────────
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "auditeur_id", nullable = false)
    private Utilisateur auditeur;

    // ── Plant VW de l'auditeur ───────────────────────────────
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "plant_id", nullable = false)
    private Plant plant;

    // ── Expert qui a saisi cette certification ───────────────
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "expert_id", nullable = false)
    private Utilisateur expertSaisi;

    // ── Informations du certificat ───────────────────────────
    /** Nom complet de l'auditeur (dénormalisé pour historique) */
    @Column(name = "auditeur_nom", nullable = false, length = 200)
    private String auditeurNom;

    /** Matricule de l'auditeur */
    @Column(name = "auditeur_matricule", nullable = false, length = 50)
    private String auditeurMatricule;

    /** Nom du plant (dénormalisé) */
    @Column(name = "plant_nom", length = 100)
    private String plantNom;

    /** Nom du site (dénormalisé) */
    @Column(name = "site_nom", length = 100)
    private String siteNom;

    /** Date d'obtention de la certification VW */
    @Column(name = "date_obtention", nullable = false)
    private LocalDate dateObtention;

    /**
     * Date d'expiration — automatiquement 4 ans après dateObtention.
     * Calculée côté service à la création.
     */
    @Column(name = "date_expiration", nullable = false)
    private LocalDate dateExpiration;

    /** Chemin du fichier PDF importé */
    @Column(name = "pdf_path", length = 500)
    private String pdfPath;

    /** Nom original du fichier PDF */
    @Column(name = "pdf_nom", length = 255)
    private String pdfNom;

    // ── Métadonnées ──────────────────────────────────────────
    @Builder.Default
    @Column(name = "date_saisie", nullable = false)
    private LocalDateTime dateSaisie = LocalDateTime.now();

    /** Statut : ACTIF, EXPIRE, REVOQUE */
    @Builder.Default
    @Column(nullable = false, length = 20)
    private String statut = "ACTIF";

    // ── Méthode utilitaire ───────────────────────────────────
    /** Retourne true si la certification est encore valide aujourd'hui */
    @Transient
    public boolean isValide() {
        return "ACTIF".equals(statut) && !LocalDate.now().isAfter(dateExpiration);
    }
}
