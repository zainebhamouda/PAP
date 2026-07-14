package com.leoni.pap.dto.response;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class CertificationResponse {

    // ── EXISTANT ─────────────────────────────────────────────
    private Long id;
    private String auditeurNom;
    private String auditeurPrenom;
    private String auditeurMatricule;
    private String statut;
    private Double scoreTheorique;
    private Double scorePratique;
    private Double scoreFinal;
    private String numeroCertificat;
    private String niveauBadge;
    private LocalDateTime dateObtention;
    private LocalDateTime dateExpiration;
    private Long   joursAvantExpiration;
    private Integer nbTentativesTheoriques;
    private String siteNom;

    // ── CONFIG CERTIFICATION ──────────────────────────────────
    private String  titre;
    private String  description;
    private Boolean actif;
    private Integer seuilTheorique;
    private String  expertNom;

    // SPRINT 2 : client constructeur
    private Integer clientId;
    private String  clientNom;
    private String  clientCode;
    private String  clientCouleur;
    private String  clientLogoUrl;

    // Test théorique lié
    private Long    testTheoriqueId;
    private String  testTheoriqueNom;
    private Integer nbQuestionsImage;
    private Integer nbQuestionsQCM;

    // Test pratique lié
    private Long    testPratiqueId;
    private String  testPratiqueNom;
    private Integer nbDefautsPratique;
    private Integer seuilPratique;

    // Dates
    private LocalDateTime dateCreation;
    private LocalDateTime dateActivation;
    private LocalDateTime dateDesactivation;

    // ── FICHIERS ──────────────────────────────────────────────
    private String  formationUrl;
    private String  formationNom;
    private String  certificatVideUrl;
    private String  certificatVideNom;

    private Boolean brouillon;
}