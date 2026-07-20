package com.leoni.pap.dto.response;

import com.leoni.pap.entity.CertificatAuditeur;

import java.time.LocalDateTime;

public class CertificatAuditeurResponse {

    private Long id;
    private Integer auditeurId;
    private String  auditeurNom;
    private String  auditeurMatricule;
    private Integer plantId;
    private String  plantNom;
    private String  importeParNom;
    private LocalDateTime dateObtention;
    private LocalDateTime dateExpiration;
    private String  nomFichierPdf;
    private String  cheminPdf;
    private LocalDateTime dateImport;
    private Boolean actif;
    private boolean expire;
    private long    joursRestants;

    public static CertificatAuditeurResponse from(CertificatAuditeur c) {
        CertificatAuditeurResponse r = new CertificatAuditeurResponse();
        r.id = c.getId();
        r.auditeurId = c.getAuditeur() != null ? c.getAuditeur().getId() : null;
        r.auditeurNom = c.getAuditeur() != null
                ? c.getAuditeur().getPrenom() + " " + c.getAuditeur().getNom() : null;
        r.auditeurMatricule = c.getAuditeur() != null ? c.getAuditeur().getMatricule() : null;
        r.plantId = c.getPlant() != null ? c.getPlant().getId() : null;
        r.plantNom = c.getPlant() != null ? c.getPlant().getNom() : null;
        r.importeParNom = c.getImportePar() != null
                ? c.getImportePar().getPrenom() + " " + c.getImportePar().getNom() : null;
        r.dateObtention = c.getDateObtention();
        r.dateExpiration = c.getDateExpiration();
        r.nomFichierPdf = c.getNomFichierPdf();
        r.cheminPdf = c.getCheminPdf();
        r.dateImport = c.getDateImport();
        r.actif = c.getActif();
        r.expire = c.getDateExpiration() != null && c.getDateExpiration().isBefore(LocalDateTime.now());
        r.joursRestants = c.getDateExpiration() != null
                ? java.time.Duration.between(LocalDateTime.now(), c.getDateExpiration()).toDays() : 0;
        return r;
    }

    public Long getId() { return id; }
    public Integer getAuditeurId() { return auditeurId; }
    public String getAuditeurNom() { return auditeurNom; }
    public String getAuditeurMatricule() { return auditeurMatricule; }
    public Integer getPlantId() { return plantId; }
    public String getPlantNom() { return plantNom; }
    public String getImporteParNom() { return importeParNom; }
    public LocalDateTime getDateObtention() { return dateObtention; }
    public LocalDateTime getDateExpiration() { return dateExpiration; }
    public String getNomFichierPdf() { return nomFichierPdf; }
    public String getCheminPdf() { return cheminPdf; }
    public LocalDateTime getDateImport() { return dateImport; }
    public Boolean getActif() { return actif; }
    public boolean isExpire() { return expire; }
    public long getJoursRestants() { return joursRestants; }
}