package com.leoni.pap.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "client")
public class Client {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(nullable = false, unique = true, length = 100)
    private String nom;

    @Column(length = 20)
    private String code;

    @Column(length = 255)
    private String logoUrl;

    @Column(length = 30)
    private String couleur;

    @Column(length = 500)
    private String description;

    @Column(nullable = false)
    private Boolean actif = true;

    @Column(name = "pays_origine", length = 100)
    private String paysOrigine;

    /**
     * TRUE  → Client/Groupe (BMW Group, VW Group, OEM Supplier…)
     *         → affiché dans les selects de qualification + page admin principale
     * FALSE → Marque (BMW, Volkswagen, Bentley…)
     *         → visible uniquement dans le panel "Marques liées" d'un groupe
     */
    @Column(name = "est_groupe", nullable = false)
    private Boolean estGroupe = false;

    // ── Getters & Setters ─────────────────────────────
    public Integer getId()                      { return id; }
    public void    setId(Integer id)            { this.id = id; }
    public String  getNom()                     { return nom; }
    public void    setNom(String nom)           { this.nom = nom; }
    public String  getCode()                    { return code; }
    public void    setCode(String code)         { this.code = code; }
    public String  getLogoUrl()                 { return logoUrl; }
    public void    setLogoUrl(String logoUrl)   { this.logoUrl = logoUrl; }
    public String  getCouleur()                 { return couleur; }
    public void    setCouleur(String couleur)   { this.couleur = couleur; }
    public String  getDescription()             { return description; }
    public void    setDescription(String d)     { this.description = d; }
    public Boolean getActif()                   { return actif; }
    public void    setActif(Boolean actif)      { this.actif = actif; }
    public String  getPaysOrigine()             { return paysOrigine; }
    public void    setPaysOrigine(String p)     { this.paysOrigine = p; }
    public Boolean getEstGroupe()               { return estGroupe; }
    public void    setEstGroupe(Boolean g)      { this.estGroupe = g; }
}