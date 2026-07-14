package com.leoni.pap.dto.request;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import com.leoni.pap.entity.enums.NatureAudit;
import java.time.LocalDate;
@JsonIgnoreProperties(ignoreUnknown = true)
public class UpdateAuditRequest {

    private NatureAudit natureAudit;
    private LocalDate datePrevue;
    private LocalDate deadline;
    private Integer plantId;
    private Integer segmentId;
    private Integer projetId;
    private Integer serieId;
    private Integer auditeurId;
    private String familleCablage;
    private String domaine;
    private String observations;

    public NatureAudit getNatureAudit() { return natureAudit; }
    public void setNatureAudit(NatureAudit v) { this.natureAudit = v; }

    public LocalDate getDatePrevue() { return datePrevue; }
    public void setDatePrevue(LocalDate v) { this.datePrevue = v; }

    public LocalDate getDeadline() { return deadline; }
    public void setDeadline(LocalDate v) { this.deadline = v; }

    public Integer getPlantId() { return plantId; }
    public void setPlantId(Integer v) { this.plantId = v; }

    public Integer getSegmentId() { return segmentId; }
    public void setSegmentId(Integer v) { this.segmentId = v; }

    public Integer getProjetId() { return projetId; }
    public void setProjetId(Integer v) { this.projetId = v; }

    public Integer getSerieId() { return serieId; }
    public void setSerieId(Integer v) { this.serieId = v; }

    public Integer getAuditeurId() { return auditeurId; }
    public void setAuditeurId(Integer v) { this.auditeurId = v; }

    public String getFamilleCablage() { return familleCablage; }
    public void setFamilleCablage(String v) { this.familleCablage = v; }

    public String getDomaine() { return domaine; }
    public void setDomaine(String v) { this.domaine = v; }

    public String getObservations() { return observations; }
    public void setObservations(String v) { this.observations = v; }
}
