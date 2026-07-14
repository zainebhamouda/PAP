package com.leoni.pap.dto.response;

import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;

/**
 * DTO de classement d'un auditeur pour une qualification donnée.
 * Utilisé par l'endpoint GET /api/expert-audit/certifications/{certifId}/classement-auditeurs
 */
@Data
@Builder
public class ClassementAuditeurResponse {

    // ── Identité ──────────────────────────────────────────────
    private Long    passageId;
    private Integer auditeurId;
    private String  auditeurNom;
    private String  auditeurPrenom;
    private String  auditeurMatricule;
    private String  siteNom;
    private Integer siteId;           // ← AJOUTER cette ligne
    private String  plantNom;
    private Integer plantId;          // ← AJOUTER cette ligne

    // ── Statut du passage ─────────────────────────────────────
    private String  statut;             // StatutPassage.name()
    private Boolean certifie;
    private Boolean bloque;

    // ── Scores bruts ──────────────────────────────────────────
    private Integer scoreTheorique;     // score brut (sur scoreTheoriqueMax)
    private Integer scoreTheoriqueMax;  // nb de questions (= 20 en général)
    private Integer scoreTheoriquePct;  // % arrondi
    private Double  scorePratique;      // % pratique saisi par l'expert

    // ── Tentatives ────────────────────────────────────────────
    private Integer nbTentativesTheorique;
    private Integer nbTentativesPratique;
    private Boolean premierEssai;       // true si theor=1 ET prat=1

    // ── Score composite (calculé côté backend) ───────────────
    private Double  scoreComposite;

    // ── Rang & médaille ───────────────────────────────────────
    private Integer rang;               // 1, 2, 3, ...
    private String  medaille;           // OR, ARGENT, BRONZE, null

    // ── Dates ────────────────────────────────────────────────
    private LocalDateTime dateDebut;
    private LocalDateTime dateFin;
}