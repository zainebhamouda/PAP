package com.leoni.pap.dto.response;

import com.leoni.pap.entity.DemandeExtension;
import lombok.Data;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
public class DemandeExtensionResponse {
    private Long          id;
    private Long          auditId;
    private String        auditRef;
    private String        raisonType;
    private String        description;
    private LocalDate     delaiDemande;
    private String        statut;
    private LocalDateTime createdAt;
    private String        auditeurNom;
    private String        expertNom;

    public static DemandeExtensionResponse from(DemandeExtension d) {
        DemandeExtensionResponse r = new DemandeExtensionResponse();
        r.setId(d.getId());
        r.setAuditId(d.getAudit() != null ? d.getAudit().getId() : null);
        r.setAuditRef(d.getAudit() != null ? d.getAudit().getReference() : null);
        r.setRaisonType(d.getRaisonType());
        r.setDescription(d.getDescription());
        r.setDelaiDemande(d.getDelaiDemande());
        r.setStatut(d.getStatut());
        r.setCreatedAt(d.getCreatedAt());
        if (d.getAuditeur() != null)
            r.setAuditeurNom(d.getAuditeur().getPrenom() + " " + d.getAuditeur().getNom());
        if (d.getExpert() != null)
            r.setExpertNom(d.getExpert().getPrenom() + " " + d.getExpert().getNom());
        return r;
    }
}