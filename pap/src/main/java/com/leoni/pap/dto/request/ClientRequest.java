package com.leoni.pap.dto.request;

public class ClientRequest {
    private String  nom;
    private String  code;
    private String  logoUrl;
    private String  couleur;
    private String  description;
    private Boolean actif;
    private String  paysOrigine;
    private Boolean estGroupe;   // ← NOUVEAU

    public String  getNom()                     { return nom; }
    public void    setNom(String nom)           { this.nom = nom; }
    public String  getCode()                    { return code; }
    public void    setCode(String code)         { this.code = code; }
    public String  getLogoUrl()                 { return logoUrl; }
    public void    setLogoUrl(String logoUrl)   { this.logoUrl = logoUrl; }
    public String  getCouleur()                 { return couleur; }
    public void    setCouleur(String c)         { this.couleur = c; }
    public String  getDescription()             { return description; }
    public void    setDescription(String d)     { this.description = d; }
    public Boolean getActif()                   { return actif; }
    public void    setActif(Boolean actif)      { this.actif = actif; }
    public String  getPaysOrigine()             { return paysOrigine; }
    public void    setPaysOrigine(String p)     { this.paysOrigine = p; }
    public Boolean getEstGroupe()               { return estGroupe; }
    public void    setEstGroupe(Boolean g)      { this.estGroupe = g; }
}