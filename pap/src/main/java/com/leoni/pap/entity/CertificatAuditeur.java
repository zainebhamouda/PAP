package com.leoni.pap.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * ✅ NOUVEAU — Certificat d'un auditeur déjà obtenu AVANT/EN DEHORS du
 * système (entreprise déjà en activité, auditeurs déjà certifiés). L'expert
 * du plant importe simplement le PDF du certificat existant plutôt que de
 * faire repasser les tests théorique/pratique à l'auditeur.
 *
 * Indépendant du workflow {@link Certification} (tests + signatures) afin de
 * ne pas perturber ce système existant : ceci est un simple constat qu'un
 * auditeur possède déjà, à une date donnée, un certificat valide.
 *
 * Ne concerne pas les certificats VW, qui gardent leur propre circuit dédié
 * ({@link CertificatVW}).
 */
@Entity
@Table(name = "certificat_auditeur")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class CertificatAuditeur {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "auditeur_id", nullable = false)
    private Utilisateur auditeur;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "plant_id", nullable = false)
    private Plant plant;

    /** L'expert qui a réalisé l'import */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "importe_par_id")
    private Utilisateur importePar;

    /** Date d'obtention du certificat (saisie par l'expert) */
    @Column(nullable = false)
    private LocalDateTime dateObtention;

    /**
     * Date d'expiration — calculée automatiquement à l'import
     * (dateObtention + durée de validité configurée, 2 ans par défaut).
     */
    @Column(nullable = false)
    private LocalDateTime dateExpiration;

    private String cheminPdf;
    private String nomFichierPdf;

    @Builder.Default
    private LocalDateTime dateImport = LocalDateTime.now();

    /** Empêche le renvoi multiple de la notification d'expiration proche */
    @Builder.Default
    private Boolean notifExpirationEnvoyee = false;

    /**
     * Permet d'invalider un import fait par erreur sans le supprimer
     * (traçabilité). Un certificat inactif n'est plus pris en compte comme
     * "auditeur certifié" en planification.
     */
    @Builder.Default
    private Boolean actif = true;
}