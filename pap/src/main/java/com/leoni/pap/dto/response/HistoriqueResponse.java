package com.leoni.pap.dto.response;

import java.time.LocalDateTime;

public class HistoriqueResponse {

    private Long          id;
    private String        type;       // TypeHistorique.name()
    private String        details;
    private Double        scoreSnapshot;
    private LocalDateTime dateAction;

    // ── Acteur (celui qui a réalisé l'action) ─────────────────
    private Integer       acteurId;
    private String        acteurMatricule;
    private String        acteurNomPrenom;
    private String        acteurRole;      // AUDITEUR, EXPERT_PRODUCT_AUDIT, CHEF_SERVICE...

    // ── Plant (isolation par plant) ───────────────────────────
    private Integer       plantId;
    private String        plantNom;
    private String        plantCode;

    // ── Audit concerné, si applicable ─────────────────────────
    private Long           auditId;
    private String         auditReference;

    // Infos certification si applicable
    private String        certificationNom;

    // Infos cible (admin actions) si applicable
    private String        cibleMatricule;
    private String        cibleNomPrenom;

    // Getters & Setters
    public Long          getId()                        { return id; }
    public void          setId(Long v)                  { this.id = v; }
    public String        getType()                      { return type; }
    public void          setType(String v)              { this.type = v; }
    public String        getDetails()                   { return details; }
    public void          setDetails(String v)           { this.details = v; }
    public Double        getScoreSnapshot()             { return scoreSnapshot; }
    public void          setScoreSnapshot(Double v)     { this.scoreSnapshot = v; }
    public LocalDateTime getDateAction()                { return dateAction; }
    public void          setDateAction(LocalDateTime v) { this.dateAction = v; }

    public Integer        getActeurId()                 { return acteurId; }
    public void           setActeurId(Integer v)         { this.acteurId = v; }
    public String        getActeurMatricule()           { return acteurMatricule; }
    public void          setActeurMatricule(String v)   { this.acteurMatricule = v; }
    public String        getActeurNomPrenom()           { return acteurNomPrenom; }
    public void          setActeurNomPrenom(String v)   { this.acteurNomPrenom = v; }
    public String        getActeurRole()                { return acteurRole; }
    public void          setActeurRole(String v)        { this.acteurRole = v; }

    public Integer       getPlantId()                   { return plantId; }
    public void          setPlantId(Integer v)           { this.plantId = v; }
    public String        getPlantNom()                   { return plantNom; }
    public void          setPlantNom(String v)           { this.plantNom = v; }
    public String        getPlantCode()                  { return plantCode; }
    public void          setPlantCode(String v)          { this.plantCode = v; }

    public Long          getAuditId()                    { return auditId; }
    public void          setAuditId(Long v)              { this.auditId = v; }
    public String        getAuditReference()             { return auditReference; }
    public void          setAuditReference(String v)     { this.auditReference = v; }

    public String        getCertificationNom()          { return certificationNom; }
    public void          setCertificationNom(String v)  { this.certificationNom = v; }
    public String        getCibleMatricule()            { return cibleMatricule; }
    public void          setCibleMatricule(String v)    { this.cibleMatricule = v; }
    public String        getCibleNomPrenom()            { return cibleNomPrenom; }
    public void          setCibleNomPrenom(String v)    { this.cibleNomPrenom = v; }
}
