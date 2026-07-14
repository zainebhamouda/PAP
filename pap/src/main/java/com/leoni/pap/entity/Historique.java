package com.leoni.pap.entity;
import com.leoni.pap.entity.enums.*;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

/**
 * Entité unique pour TOUT l'historique du système.
 *
 * Couvre :
 *   - Authentification (connexions, inscriptions…)
 *   - Gestion utilisateurs (admin)
 *   - Tests théoriques (expert : créer, modifier, activer…)
 *   - Sessions d'examen (auditeur : démarrer, répondre…)
 *   - Certifications (théorique, pratique, blocage…)
 *   - Certificats (générer, signer, envoyer…)
 *   - Expirations (notifications, marquage)
 *
 * Champs optionnels selon le contexte :
 *   - utilisateur    : toujours renseigné (acteur de l'action)
 *   - cible          : utilisateur concerné (si différent de l'acteur)
 *   - certification  : si lié à une certification
 *   - sessionTest    : si lié à une session d'examen
 *   - testTheorique  : si lié à un test théorique
 *   - questionTest   : si lié à une question
 *   - scoreSnapshot  : score au moment de l'action
 *   - details        : description textuelle libre
 *   - metadataJson   : données supplémentaires JSON (flexible)
 */
@Entity
@Table(name = "historique",
        indexes = {
                @Index(name = "idx_hist_utilisateur", columnList = "utilisateur_id"),
                @Index(name = "idx_hist_type",        columnList = "type"),
                @Index(name = "idx_hist_date",        columnList = "dateAction"),
                @Index(name = "idx_hist_certif",      columnList = "certification_id"),
                @Index(name = "idx_hist_plant",       columnList = "plant_id")
        })
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Historique {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // ── ACTEUR de l'action (toujours renseigné) ───────────────
    @ManyToOne( fetch = FetchType.LAZY)
    @JoinColumn(nullable = false,name = "utilisateur_id")
    private Utilisateur utilisateur;

    // ── TYPE d'événement ──────────────────────────────────────
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TypeHistorique type;

    // ── DATE ──────────────────────────────────────────────────
    @Column(nullable = false)
    private LocalDateTime dateAction = LocalDateTime.now();

    // ── DESCRIPTION LIBRE ─────────────────────────────────────
    @Column(length = 1000)
    private String details;

    // ── SCORE (si applicable) ─────────────────────────────────
    private Double scoreSnapshot;

    // ── RÉFÉRENCES OPTIONNELLES ───────────────────────────────

    // Utilisateur cible (ex: admin désactive un auditeur → cible = auditeur)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cible_id")
    private Utilisateur cible;

    // ── PLANT (isolation par plant) ───────────────────────────
    // Recopié depuis l'acteur au moment de l'action (dénormalisé pour
    // permettre un filtrage rapide de "l'historique de mon plant").
    // Chaque plant (auditeurs + expert + chef de service qui lui sont
    // rattachés) est indépendant des autres plants : un chef de service
    // ou un expert ne voit que l'historique de SON plant.
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "plant_id")
    private Plant plant;

    // Audit concerné (planification, démarrage, modification, etc.)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "audit_id")
    private AuditProduit audit;

    // Certification concernée
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "certification_id")
    private Certification certification;

    // Session d'examen concernée
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "session_test_id")
    private SessionTest sessionTest;

    // Test théorique concerné
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "test_theorique_id")
    private TestTheorique testTheorique;

    // Question concernée
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "question_id")
    private QuestionTest questionTest;

    // Données supplémentaires libres en JSON
    // Ex: {"ancienRole":"AUDITEUR","nouveauRole":"CHEF_SERVICE"}
    // Ex: {"nbTentative":2,"seuil":70,"questionIndex":5}
    @Column(columnDefinition = "TEXT")
    private String metadataJson;

    // ── Auto-complétion du plant (isolation par plant) ────────
    // Quel que soit le point d'entrée qui crée une entrée d'historique
    // (service dédié ou repository.save() direct), on garantit que le
    // plant de l'acteur est recopié avant la sauvegarde. Cela permet de
    // filtrer de façon fiable "l'historique de mon plant" pour tous les
    // acteurs (auditeur, expert, chef de service) sans risque d'oubli.
    @PrePersist
    private void completerPlantAvantSauvegarde() {
        if (this.plant == null && this.utilisateur != null) {
            this.plant = this.utilisateur.getPlant();
        }
        if (this.plant == null && this.audit != null) {
            this.plant = this.audit.getPlant();
        }
    }
}