package com.leoni.pap.dto.response;

import com.leoni.pap.entity.CertificatVW;
import lombok.Data;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
public class CertificatVWResponse {

    private Long          id;
    private String        auditeurNom;
    private String        auditeurPrenom;
    private String        auditeurMatricule;
    private Integer       auditeurId;
    private Integer       plantId;
    private String        plantNom;
    private String        siteNom;
    private LocalDate     dateObtention;
    private LocalDate     dateExpiration;
    private String        statut;
    private boolean       valide;
    private String        pdfPath;
    private String        pdfNom;
    private LocalDateTime dateSaisie;
    private String        expertSaisiNomPrenom;

    /** Nombre de jours avant expiration (négatif si déjà expiré) */
    private long joursAvantExpiration;

    public static CertificatVWResponse from(CertificatVW c) {
        CertificatVWResponse r = new CertificatVWResponse();
        r.id                   = c.getId();
        r.auditeurNom          = c.getAuditeur() != null ? c.getAuditeur().getNom()    : c.getAuditeurNom();
        r.auditeurPrenom       = c.getAuditeur() != null ? c.getAuditeur().getPrenom() : "";
        r.auditeurMatricule    = c.getAuditeurMatricule();
        r.auditeurId           = c.getAuditeur() != null ? c.getAuditeur().getId()     : null;
        r.plantId              = c.getPlant()    != null ? c.getPlant().getId()        : null;
        r.plantNom             = c.getPlantNom();
        r.siteNom              = c.getSiteNom();
        r.dateObtention        = c.getDateObtention();
        r.dateExpiration       = c.getDateExpiration();
        r.statut               = c.getStatut();
        r.valide               = c.isValide();
        r.pdfPath              = c.getPdfPath();
        r.pdfNom               = c.getPdfNom();
        r.dateSaisie           = c.getDateSaisie();
        r.joursAvantExpiration = java.time.temporal.ChronoUnit.DAYS.between(
                LocalDate.now(), c.getDateExpiration());
        if (c.getExpertSaisi() != null) {
            r.expertSaisiNomPrenom = c.getExpertSaisi().getPrenom() + " " + c.getExpertSaisi().getNom();
        }
        return r;
    }
}
