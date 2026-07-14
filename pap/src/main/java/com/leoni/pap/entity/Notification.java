package com.leoni.pap.entity;
import com.leoni.pap.entity.enums.*;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

/**
 * Entité unique pour TOUTES les notifications du système.
 *
 * Chaque notification est liée à un destinataire.
 * Les références (certification, certificat…) sont optionnelles
 * selon le type de notification.
 *
 * Priorités :
 *   HAUTE  → CERTIF_BLOQUE, CERTIF_EXPIRE_7J, CERTIF_EXPIREE
 *   NORMALE → tout le reste
 *   BASSE   → INFORMATION
 */
@Entity
@Table(name = "notification",
        indexes = {
                @Index(name = "idx_notif_destinataire", columnList = "destinataire_id"),
                @Index(name = "idx_notif_lue",          columnList = "lue"),
                @Index(name = "idx_notif_date",         columnList = "dateCreation")
        })
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // ── DESTINATAIRE (toujours renseigné) ─────────────────────
    @ManyToOne( fetch = FetchType.LAZY)
    @JoinColumn(nullable = false,name = "destinataire_id")
    private Utilisateur destinataire;

    // ── TYPE ──────────────────────────────────────────────────
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TypeNotification type;

    // ── MESSAGE AFFICHÉ ───────────────────────────────────────
    @Column(nullable = false, length = 1000)
    private String message;

    // ── TITRE (optionnel — pour les notifications avec en-tête) ─
    @Column(length = 200)
    private String titre;

    // ── ÉTAT ──────────────────────────────────────────────────
    @Column(nullable = false)
    private Boolean lue = false;

    @Column(nullable = false)
    private LocalDateTime dateCreation = LocalDateTime.now();

    private LocalDateTime dateLecture;

    // ── PRIORITÉ ──────────────────────────────────────────────
    // HAUTE / NORMALE / BASSE
    @Column(nullable = false)
    private String priorite = "NORMALE";

    // ── RÉFÉRENCES OPTIONNELLES ───────────────────────────────

    // Expéditeur (si la notif vient d'un utilisateur précis)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "expediteur_id")
    private Utilisateur expediteur;

    // Certification liée
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "certification_id")
    private Certification certification;

    // Certificat lié (pour notif signature PDF)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "certificat_id")
    private Certificat certificat;

    // Lien de redirection (ex: "/auditeur/mon-certificat")
    @Column(length = 300)
    private String lienAction;

    /** Lien de navigation associé (ex: /chef-service/qualifications) */
    @Column(name = "lien_navigation")
    private String lienNavigation;

}
