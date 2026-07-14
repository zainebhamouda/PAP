package com.leoni.pap.dto.response;

import com.leoni.pap.entity.Plant;

/**
 * PlantResponse — MODIFIÉ Sprint 3
 * Expose code, clientNom, description, actif
 */
public class PlantResponse {

    private Integer id;
    private String  nom;
    private String  code;
    private String  clientNom;
    private String  description;
    private Boolean actif;
    private Integer siteId;
    private String  siteNom;
    private int     nombreSegments;

    public static PlantResponse from(Plant p) {
        PlantResponse r = new PlantResponse();
        r.id             = p.getId();
        r.nom            = p.getNom();
        r.code           = p.getCode();
        r.clientNom      = p.getClientNom();
        r.description    = p.getDescription();
        r.actif          = p.getActif();
        r.siteId         = p.getSite() != null ? p.getSite().getId()  : null;
        r.siteNom        = p.getSite() != null ? p.getSite().getNom() : null;
        r.nombreSegments = p.getSegments() != null ? p.getSegments().size() : 0;
        return r;
    }

    public Integer getId()            { return id; }
    public String  getNom()           { return nom; }
    public String  getCode()          { return code; }
    public String  getClientNom()     { return clientNom; }
    public String  getDescription()   { return description; }
    public Boolean getActif()         { return actif; }
    public Integer getSiteId()        { return siteId; }
    public String  getSiteNom()       { return siteNom; }
    public int     getNombreSegments(){ return nombreSegments; }

    // Setters (pour compatibilité avec anciens appels)
    public void setId(Integer id)            { this.id = id; }
    public void setNom(String nom)           { this.nom = nom; }
    public void setCode(String code)         { this.code = code; }
    public void setClientNom(String v)       { this.clientNom = v; }
    public void setDescription(String v)     { this.description = v; }
    public void setActif(Boolean actif)      { this.actif = actif; }
    public void setSiteId(Integer siteId)    { this.siteId = siteId; }
    public void setSiteNom(String siteNom)   { this.siteNom = siteNom; }
    public void setNombreSegments(int v)     { this.nombreSegments = v; }
}