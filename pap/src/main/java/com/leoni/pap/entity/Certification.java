package com.leoni.pap.entity;

import com.leoni.pap.entity.enums.StatutCertification;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "certification")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Certification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String titre;

    private String  formationUrl;
    private String  formationNom;
    private Boolean brouillon = true;

    // ── CLIENT (SPRINT 2) ─────────────────────────────────────
    // Chaque qualification est liée à un client constructeur (BMW, VW, etc.)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "client_id")
    private Client client;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "test_theorique_id")
    private TestTheorique testTheorique;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "test_pratique_id")
    private TestPratique testPratique;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "expert_id")
    private Utilisateur expert;

    // Plusieurs qualifications peuvent être actives simultanément (une par client)
    @Column(nullable = false)
    private Boolean actif = false;

    @Column(nullable = false)
    private Integer seuilTheorique = 70;

    private LocalDateTime dateActivation;
    private LocalDateTime dateDesactivation;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(nullable = true, name = "auditeur_id")
    private Utilisateur auditeur;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private StatutCertification statut = StatutCertification.EN_ATTENTE;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "session_test_id")
    private SessionTest sessionTest;

    private Double  scoreTheorique;
    private Double  scorePratique;
    private Double  scoreFinal;

    private Integer nbTentativesTheoriques = 0;
    private LocalDateTime dateDeblocage;

    private LocalDateTime dateCreation = LocalDateTime.now();
    private LocalDateTime dateObtention;
    private LocalDateTime dateExpiration;

    private String  numeroCertificat;
    private String  niveauBadge;

    private Boolean notifJ30Envoyee = false;
    private Boolean notifJ7Envoyee  = false;

    @Column(name = "certificat_vide_url")
    private String certificatVideUrl;

    @Column(name = "certificat_vide_nom")
    private String certificatVideNom;

    public String getCertificatVideUrl()           { return certificatVideUrl; }
    public void   setCertificatVideUrl(String v)   { this.certificatVideUrl = v; }
    public String getCertificatVideNom()           { return certificatVideNom; }
    public void   setCertificatVideNom(String v)   { this.certificatVideNom = v; }
}