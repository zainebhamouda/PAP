package com.leoni.pap.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * FicheReparation — Version simplifiée (workflow externe uniquement)
 *
 * Déclenchée quand QK > 0.
 * Envoyée à un ou plusieurs destinataires externes (email + matricule)
 * via des liens tokenisés (validation / en cours).
 *
 * Statuts :
 *   EN_ATTENTE           → créée, en attente d'action d'un destinataire
 *   EN_COURS_TRAITEMENT  → un destinataire a cliqué "En cours" (relance après 3 jours)
 *   VALIDEE              → un destinataire a cliqué "Valider" → audit passe au vert
 *   REJETEE              → (optionnel) rejet explicite
 */
@Entity
@Table(name = "fiche_reparation",
        indexes = {
                @Index(name = "idx_fiche_rep_audit", columnList = "audit_id"),
                @Index(name = "idx_fiche_rep_statut", columnList = "statut")
        })
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
public class FicheReparation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // ── LIEN AUDIT ────────────────────────────────────────────
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "audit_id", nullable = false)
    private AuditProduit audit;

    // ── STATUT ────────────────────────────────────────────────
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private StatutFicheReparation statut = StatutFicheReparation.EN_ATTENTE;

    // ── NOUVEAUX CHAMPS (remplacent les anciens) ───────────────

    /** Zone affectée par la non-conformité (réception, production, magasin, expéditions, autre plant, magasin avance, client) */
    @Column(length = 50)
    private String zoneAffectee;

    /** Origine de la non-conformité (ex: audit produit, non-conformité fournisseur, etc.) */
    @Column(length = 100)
    private String origineNC;

    /** Code article : voiture, projet, référence + index */
    @Column(length = 200)
    private String codeArticle;

    /** Description détaillée de la non-conformité */
    @Column(length = 4000)
    private String descriptionNC;

    /** Remarques optionnelles (libre) */
    @Column(length = 2000)
    private String remarquesOptionnelles;

    // ── GESTION DES DESTINATAIRES EXTERNES (EMAIL + MATRICULE) ──

    /**
     * Liste des destinataires au format JSON.
     * Exemple : [{"email":"jean.dupont@leoni.com","matricule":"12345"}, ...]
     */
    @Column(columnDefinition = "TEXT", name = "destinataires_json")
    private String destinatairesJson;

    // ── TOKENS POUR ACTIONS EMAIL ─────────────────────────────

    /** Token UUID pour l'action "Valider" */
    @Column(name = "token_valider", length = 36)
    private String tokenValider;

    /** Token UUID pour l'action "En cours de traitement" */
    @Column(name = "token_en_cours", length = 36)
    private String tokenEnCours;

    /** Date du dernier envoi (ou relance) des emails */
    @Column(name = "date_dernier_envoi")
    private LocalDateTime dateDernierEnvoi;

    // ── VALIDATION EXTERNE (un seul niveau) ────────────────────

    /** true si un destinataire a validé la fiche via le token */
    private Boolean valide = false;

    /** Date de validation par le premier destinataire ayant cliqué sur "Valider" */
    private LocalDateTime dateValidation;

    // ── CRÉATEUR DE LA FICHE (auditeur) ───────────────────────
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cree_par_id")
    private Utilisateur creePar;

    // ── MÉTADONNÉES ───────────────────────────────────────────
    @Column(nullable = false, updatable = false)
    private LocalDateTime dateCreation;

    private LocalDateTime dateModification;

    @PrePersist
    protected void onCreate() {
        dateCreation = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        dateModification = LocalDateTime.now();
    }

    // ── Méthode utilitaire pour récupérer la liste des destinataires parsée ──
    // (À compléter avec une vraie logique JSON si besoin, ou déléguer au service)
    // Pour l'instant, simple méthode qui retourne une liste vide.
    // Vous pouvez utiliser Jackson ou Gson dans le service pour parser.

    /**
     * Retourne la liste des destinataires (email + matricule) à partir du JSON stocké.
     * Dans le service, on utilisera ObjectMapper. Cette méthode est un placeholder.
     */
    public List<DestinataireExterne> getDestinatairesList() {
        // À implémenter avec Jackson ou Gson dans le service.
        // Retourne une liste vide par défaut.
        return new ArrayList<>();
    }

    // ── ENUM des statuts (simplifié) ──────────────────────────
    public enum StatutFicheReparation {
        EN_ATTENTE,          // Créée, en attente d'une action (Valider / En cours)
        EN_COURS_TRAITEMENT, // Un destinataire a cliqué "En cours" → relance auto 3j
        VALIDEE,             // Un destinataire a cliqué "Valider" → audit passe au vert
        REJETEE              // (Optionnel) Rejetée
    }

    // Classe interne simple pour représenter un destinataire (utilisation côté service)
    @lombok.Value
    public static class DestinataireExterne {
        String email;
        String matricule;
    }
}