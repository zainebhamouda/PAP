package com.leoni.pap.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import java.util.List;

/**
 * Entité Série — un Projet contient une liste de Séries.
 * Les audits produit sont réalisés PAR SÉRIE.
 * La Série est gérée par l'Admin (comme les Segments, Plants, etc.)
 *
 * Hiérarchie complète :
 *  Site → Plant → Segment → Projet → Série → AuditProduit
 */
@Entity
@Table(name = "serie",
        indexes = {
                @Index(name = "idx_serie_projet", columnList = "projet_id")
        })
public class Serie {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(nullable = false, length = 100)
    private String nom;

    @Column(length = 500)
    private String description;

    /** Code série (ex: VW_A1, BMW_X5, PSA_208...) */
    @Column(length = 50)
    private String code;

    /** Client / Domaine automobile lié à cette série (VW, BMW, PSA, FCA, MB...) */
    @Column(length = 50)
    private String domaine;

    /** Famille câblage associée à cette série */
    @Column(length = 200)
    private String familleCablage;

    /** Statut actif/inactif */
    @Column(nullable = false)
    private Boolean actif = true;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "projet_id", nullable = false)
    @JsonIgnore
    private Projet projet;

    /** Liste des audits réalisés sur cette série */
    @OneToMany(mappedBy = "serie", cascade = CascadeType.ALL)
    @JsonIgnore
    private List<AuditProduit> audits;

    // ── Getters / Setters ─────────────────────────────────────────────
    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }
    public String getNom() { return nom; }
    public void setNom(String nom) { this.nom = nom; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }
    public String getDomaine() { return domaine; }
    public void setDomaine(String domaine) { this.domaine = domaine; }
    public String getFamilleCablage() { return familleCablage; }
    public void setFamilleCablage(String familleCablage) { this.familleCablage = familleCablage; }
    public Boolean getActif() { return actif; }
    public void setActif(Boolean actif) { this.actif = actif; }
    public Projet getProjet() { return projet; }
    public void setProjet(Projet projet) { this.projet = projet; }
    public List<AuditProduit> getAudits() { return audits; }
    public void setAudits(List<AuditProduit> audits) { this.audits = audits; }
}