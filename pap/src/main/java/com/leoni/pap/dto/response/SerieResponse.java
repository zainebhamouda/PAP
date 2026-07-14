package com.leoni.pap.dto.response;

import com.leoni.pap.entity.Serie;

public class SerieResponse {

    private Integer id;
    private String nom;
    private String description;
    private String code;
    private String domaine;
    private String familleCablage;
    private Boolean actif;
    private Integer projetId;
    private String projetNom;
    private Integer segmentId;
    private String segmentNom;
    private String plantNom;
    private String siteNom;

    public static SerieResponse from(Serie s) {
        SerieResponse r = new SerieResponse();
        r.id = s.getId();
        r.nom = s.getNom();
        r.description = s.getDescription();
        r.code = s.getCode();
        r.domaine = s.getDomaine();
        r.familleCablage = s.getFamilleCablage();
        r.actif = s.getActif();
        if (s.getProjet() != null) {
            r.projetId = s.getProjet().getId();
            r.projetNom = s.getProjet().getNom();
            if (s.getProjet().getSegment() != null) {
                r.segmentId = s.getProjet().getSegment().getId();
                r.segmentNom = s.getProjet().getSegment().getNom();
                if (s.getProjet().getSegment().getPlant() != null) {
                    r.plantNom = s.getProjet().getSegment().getPlant().getNom();
                    if (s.getProjet().getSegment().getPlant().getSite() != null)
                        r.siteNom = s.getProjet().getSegment().getPlant().getSite().getNom();
                }
            }
        }
        return r;
    }

    public Integer getId() { return id; }
    public String getNom() { return nom; }
    public String getDescription() { return description; }
    public String getCode() { return code; }
    public String getDomaine() { return domaine; }
    public String getFamilleCablage() { return familleCablage; }
    public Boolean getActif() { return actif; }
    public Integer getProjetId() { return projetId; }
    public String getProjetNom() { return projetNom; }
    public Integer getSegmentId() { return segmentId; }
    public String getSegmentNom() { return segmentNom; }
    public String getPlantNom() { return plantNom; }
    public String getSiteNom() { return siteNom; }
}