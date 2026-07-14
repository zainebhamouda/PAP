package com.leoni.pap.entity;

import com.leoni.pap.entity.enums.StatutPassage;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

/**
 * Représente le passage d'un auditeur à une certification.
 *
 * Flow corrigé :
 *   FORMATION_OBLIGATOIRE
 *     → THEORIQUE_EN_COURS
 *         → réussi → PRATIQUE_EN_COURS
 *                       → réussi → REUSSI → (expert génère & envoie certif au chef) → CERTIFIE
 *                       → échoué → BLOQUE
 *         → échoué → BLOQUE
 *
 * Workflow certificat :
 *   NON_GENERE → GENERE → EN_ATTENTE_CHEF → VALIDE_CHEF (passage passe à CERTIFIE)
 *                                         → INVALIDE_CHEF (passage passe à BLOQUE)
 */
@Entity
@Table(name = "passage_certification")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class PassageCertification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // L'auditeur qui passe
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "auditeur_id", nullable = false)
    private Utilisateur auditeur;

    // La certification au moment du passage
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "certification_id", nullable = false)
    private Certification certification;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private StatutPassage statut = StatutPassage.FORMATION_OBLIGATOIRE;

    // ── THÉORIQUE ────────────────────────────────────────────
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "session_test_id")
    private SessionTest sessionTest;

    private Boolean theoriqueReussi;
    private Integer scoreTheorique;        // score sur 20
    private LocalDateTime dateTheorique;

    // Nombre de tentatives théoriques (max 2 avant blocage)
    @Column(nullable = false)
    private Integer nbTentativesTheorique = 0;

    // ── PRATIQUE ─────────────────────────────────────────────
    @Column(columnDefinition = "TEXT")
    private String rapportPratiqueJson;

    @Column(columnDefinition = "TEXT")
    private String causeDeblocage;

    private Boolean pratiqueReussi;
    private Integer nbDefautsIdentifies;
    private Integer nbDefautsTotal;
    private LocalDateTime datePratique;

    // Nombre de tentatives pratiques (max 2 avant blocage)
    @Column(nullable = false)
    private Integer nbTentativesPratique = 0;

    // ── CERTIFICAT (ancien lien) ─────────────────────────────
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "certificat_id")
    private Certificat certificat;

    // ── NOUVEAU : CERTIFICAT GÉNÉRÉ PAR L'EXPERT ─────────────
    /** Chemin physique du PDF généré (ex: uploads/certificats/BMW_NOM_PRENOM_2025-01-15.pdf) */
    @Column(name = "certificat_pdf_path")
    private String certificatPdfPath;

    /** L'expert a envoyé le certificat au chef pour validation */
    @Column(name = "certificat_envoye_chef")
    private Boolean certificatEnvoyeChef = false;

    /** Chef de service choisi par l'expert pour valider */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "chef_validateur_id")
    private Utilisateur chefValidateur;

    /** Remarque de l'expert lors de l'envoi au chef */
    @Column(name = "remarque_expert", columnDefinition = "TEXT")
    private String remarqueExpert;

    /**
     * Statut du certificat :
     * NON_GENERE → GENERE → EN_ATTENTE_CHEF → VALIDE_CHEF | INVALIDE_CHEF
     */
    @Column(name = "statut_certificat")
    private String statutCertificat = "NON_GENERE";

    @Column(name = "date_generation_certif")
    private LocalDateTime dateGenerationCertif;

    @Column(name = "date_validation_chef")
    private LocalDateTime dateValidationChef;

    @Column(name = "commentaire_chef", columnDefinition = "TEXT")
    private String commentaireChef;

    /** Expert qui a généré le certificat */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "expert_generateur_id")
    private Utilisateur expertGenerateur;

    // ── BLOCAGE ──────────────────────────────────────────────
    private LocalDateTime dateDeblocage;   // fin de blocage 6 mois

    // ── DATES ────────────────────────────────────────────────
    private LocalDateTime dateDebut;
    private LocalDateTime dateFin;

    @Column(name = "score_expert_saisi")
    private Double scoreExpertSaisi;
}
