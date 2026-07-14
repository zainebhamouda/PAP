package com.leoni.pap.dto.request;

/**
 * PlantRequest — MODIFIÉ Sprint 3
 * Ajout : code, clientNom, description, actif
 */
public class PlantRequest {

    private String  nom;
    private Integer siteId;
    private String  code;
    private String  clientNom;
    private String  description;
    private Boolean actif = true;

    public String  getNom()         { return nom; }
    public void    setNom(String nom){ this.nom = nom; }

    public Integer getSiteId()      { return siteId; }
    public void    setSiteId(Integer siteId){ this.siteId = siteId; }

    public String  getCode()        { return code; }
    public void    setCode(String code){ this.code = code; }

    public String  getClientNom()   { return clientNom; }
    public void    setClientNom(String clientNom){ this.clientNom = clientNom; }

    public String  getDescription() { return description; }
    public void    setDescription(String description){ this.description = description; }

    public Boolean getActif()       { return actif; }
    public void    setActif(Boolean actif){ this.actif = actif; }
}