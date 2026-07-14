package com.leoni.pap.dto.response;

import com.leoni.pap.entity.Site;

/**
 * SiteResponse — MODIFIÉ Sprint 3
 * Expose tous les attributs réels des sites Leoni
 */
public class SiteResponse {

    private Integer id;
    private String  nom;
    private String  localisation;
    private Integer totalSpaceM2;
    private Integer productionSpaceM2;
    private Integer numberOfPlants;
    private Integer totalHc;
    private Integer directHc;
    private Integer indirectHc;
    private Integer nbPlants;

    public static SiteResponse from(Site site) {
        SiteResponse r = new SiteResponse();
        r.id                = site.getId();
        r.nom               = site.getNom();
        r.localisation      = site.getLocalisation();
        r.totalSpaceM2      = site.getTotalSpaceM2();
        r.productionSpaceM2 = site.getProductionSpaceM2();
        r.numberOfPlants    = site.getNumberOfPlants();
        r.totalHc           = site.getTotalHc();
        r.directHc          = site.getDirectHc();
        r.indirectHc        = site.getIndirectHc();
        r.nbPlants          = site.getPlants() != null ? site.getPlants().size() : 0;
        return r;
    }

    // ── Getters ──────────────────────────────────────────────────

    public Integer getId()                { return id; }
    public String  getNom()               { return nom; }
    public String  getLocalisation()      { return localisation; }
    public Integer getTotalSpaceM2()      { return totalSpaceM2; }
    public Integer getProductionSpaceM2() { return productionSpaceM2; }
    public Integer getNumberOfPlants()    { return numberOfPlants; }
    public Integer getTotalHc()           { return totalHc; }
    public Integer getDirectHc()          { return directHc; }
    public Integer getIndirectHc()        { return indirectHc; }
    public Integer getNbPlants()          { return nbPlants; }
}