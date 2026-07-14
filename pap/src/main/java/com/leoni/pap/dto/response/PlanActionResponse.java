package com.leoni.pap.dto.response;

import com.leoni.pap.entity.PlanAction;
import java.time.LocalDate;
import java.time.LocalDateTime;

public class PlanActionResponse {

    private Long id;
    private Long auditId;
    private String auditReference;
    private Long nonConformiteId;
    private String titre;
    private String description;
    private String actionCorrective;
    private String causeRacine;
    private String statut;
    private LocalDate dateEcheance;
    private LocalDate dateCloture;
    private String responsableNom;
    private Integer responsableId;
    private Boolean efficace;
    private String commentaireEfficacite;
    private LocalDateTime dateCreation;

    public static PlanActionResponse from(PlanAction p) {
        PlanActionResponse r = new PlanActionResponse();
        r.id = p.getId();
        r.titre = p.getTitre();
        r.description = p.getDescription();
        r.actionCorrective = p.getActionCorrective();
        r.causeRacine = p.getCauseRacine();
        r.statut = p.getStatut() != null ? p.getStatut().name() : null;
        r.dateEcheance = p.getDateEcheance();
        r.dateCloture = p.getDateCloture();
        r.efficace = p.getEfficace();
        r.commentaireEfficacite = p.getCommentaireEfficacite();
        r.dateCreation = p.getDateCreation();
        if (p.getAudit() != null) {
            r.auditId = p.getAudit().getId();
            r.auditReference = p.getAudit().getReference();
        }
        if (p.getNonConformite() != null) r.nonConformiteId = p.getNonConformite().getId();
        if (p.getResponsable() != null) {
            r.responsableId = p.getResponsable().getId();
            r.responsableNom = p.getResponsable().getPrenom() + " " + p.getResponsable().getNom();
        }
        return r;
    }

    public Long getId() { return id; }
    public Long getAuditId() { return auditId; }
    public String getAuditReference() { return auditReference; }
    public Long getNonConformiteId() { return nonConformiteId; }
    public String getTitre() { return titre; }
    public String getDescription() { return description; }
    public String getActionCorrective() { return actionCorrective; }
    public String getCauseRacine() { return causeRacine; }
    public String getStatut() { return statut; }
    public LocalDate getDateEcheance() { return dateEcheance; }
    public LocalDate getDateCloture() { return dateCloture; }
    public String getResponsableNom() { return responsableNom; }
    public Integer getResponsableId() { return responsableId; }
    public Boolean getEfficace() { return efficace; }
    public String getCommentaireEfficacite() { return commentaireEfficacite; }
    public LocalDateTime getDateCreation() { return dateCreation; }
}