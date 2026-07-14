package com.leoni.pap.dto.request;

/**
 * SiteRequest — MODIFIÉ Sprint 3
 * Ajout des champs réels des sites Leoni
 */
public class SiteRequest {

    private String nom;
    private String localisation;

    // Nouveaux champs
    private Integer totalSpaceM2;
    private Integer productionSpaceM2;
    private Integer numberOfPlants;
    private Integer totalHc;
    private Integer directHc;
    private Integer indirectHc;

    public String getNom() { return nom; }
    public void setNom(String nom) { this.nom = nom; }

    public String getLocalisation() { return localisation; }
    public void setLocalisation(String localisation) { this.localisation = localisation; }

    public Integer getTotalSpaceM2() { return totalSpaceM2; }
    public void setTotalSpaceM2(Integer totalSpaceM2) { this.totalSpaceM2 = totalSpaceM2; }

    public Integer getProductionSpaceM2() { return productionSpaceM2; }
    public void setProductionSpaceM2(Integer productionSpaceM2) { this.productionSpaceM2 = productionSpaceM2; }

    public Integer getNumberOfPlants() { return numberOfPlants; }
    public void setNumberOfPlants(Integer numberOfPlants) { this.numberOfPlants = numberOfPlants; }

    public Integer getTotalHc() { return totalHc; }
    public void setTotalHc(Integer totalHc) { this.totalHc = totalHc; }

    public Integer getDirectHc() { return directHc; }
    public void setDirectHc(Integer directHc) { this.directHc = directHc; }

    public Integer getIndirectHc() { return indirectHc; }
    public void setIndirectHc(Integer indirectHc) { this.indirectHc = indirectHc; }
}