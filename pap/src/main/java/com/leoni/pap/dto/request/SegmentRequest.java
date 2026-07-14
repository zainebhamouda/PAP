package com.leoni.pap.dto.request;

public class SegmentRequest {
    private String nom;
    private Integer plantId;

    public String getNom() { return nom; }
    public void setNom(String nom) { this.nom = nom; }
    public Integer getPlantId() { return plantId; }
    public void setPlantId(Integer plantId) { this.plantId = plantId; }
}