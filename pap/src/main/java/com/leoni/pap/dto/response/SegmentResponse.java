package com.leoni.pap.dto.response;

public class SegmentResponse {
    private Integer id;
    private String nom;
    private Integer plantId;
    private String plantNom;
    private String siteNom;
    private int nombreProjets;

    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }
    public String getNom() { return nom; }
    public void setNom(String nom) { this.nom = nom; }
    public Integer getPlantId() { return plantId; }
    public void setPlantId(Integer plantId) { this.plantId = plantId; }
    public String getPlantNom() { return plantNom; }
    public void setPlantNom(String plantNom) { this.plantNom = plantNom; }
    public String getSiteNom() { return siteNom; }
    public void setSiteNom(String siteNom) { this.siteNom = siteNom; }
    public int getNombreProjets() { return nombreProjets; }
    public void setNombreProjets(int nombreProjets) { this.nombreProjets = nombreProjets; }
}