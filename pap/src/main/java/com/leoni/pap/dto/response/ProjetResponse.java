package com.leoni.pap.dto.response;

public class ProjetResponse {
    private Integer id;
    private String nom;
    private String description;
    private Integer segmentId;
    private String segmentNom;
    private String plantNom;
    private String siteNom;

    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }
    public String getNom() { return nom; }
    public void setNom(String nom) { this.nom = nom; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public Integer getSegmentId() { return segmentId; }
    public void setSegmentId(Integer segmentId) { this.segmentId = segmentId; }
    public String getSegmentNom() { return segmentNom; }
    public void setSegmentNom(String segmentNom) { this.segmentNom = segmentNom; }
    public String getPlantNom() { return plantNom; }
    public void setPlantNom(String plantNom) { this.plantNom = plantNom; }
    public String getSiteNom() { return siteNom; }
    public void setSiteNom(String siteNom) { this.siteNom = siteNom; }
}