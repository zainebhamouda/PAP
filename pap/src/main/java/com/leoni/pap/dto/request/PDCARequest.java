package com.leoni.pap.dto.request;

import java.time.LocalDate;
import java.util.List;

public class PDCARequest {

    private String titre;
    private String description;
    private String actionCorrective;
    private String causeRacine;

    /** P — Planifier */
    private String planifier;

    /** D — Do */
    private String do_;

    /** C — Check */
    private String check;

    /** A — Act */
    private String act;

    private LocalDate dateEcheance;

    // Workflow interne
    private Integer responsableQualiteCentraleId;

    // Email principal externe
    private String emailExterne;

    // Emails additionnels externes
    private List<String> emailsExternesListe;

    // Nom affiché dans l'email
    private String nomDestinataire;

    public String getTitre() { return titre; }
    public void setTitre(String v) { this.titre = v; }

    public String getDescription() { return description; }
    public void setDescription(String v) { this.description = v; }

    public String getActionCorrective() { return actionCorrective; }
    public void setActionCorrective(String v) { this.actionCorrective = v; }

    public String getCauseRacine() { return causeRacine; }
    public void setCauseRacine(String v) { this.causeRacine = v; }

    public String getPlanifier() { return planifier; }
    public void setPlanifier(String v) { this.planifier = v; }

    public String getDo_() { return do_; }
    public void setDo_(String v) { this.do_ = v; }

    public String getCheck() { return check; }
    public void setCheck(String v) { this.check = v; }

    public String getAct() { return act; }
    public void setAct(String v) { this.act = v; }

    public LocalDate getDateEcheance() { return dateEcheance; }
    public void setDateEcheance(LocalDate v) { this.dateEcheance = v; }

    public Integer getResponsableQualiteCentraleId() { return responsableQualiteCentraleId; }
    public void setResponsableQualiteCentraleId(Integer v) { this.responsableQualiteCentraleId = v; }

    public String getEmailExterne() { return emailExterne; }
    public void setEmailExterne(String v) { this.emailExterne = v; }

    public List<String> getEmailsExternesListe() { return emailsExternesListe; }
    public void setEmailsExternesListe(List<String> v) { this.emailsExternesListe = v; }

    public String getNomDestinataire() { return nomDestinataire; }
    public void setNomDestinataire(String v) { this.nomDestinataire = v; }
}