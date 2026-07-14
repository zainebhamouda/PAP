package com.leoni.pap.dto.request;

import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;

/**
 * CreerAuditReglePlateRequest — Sprint 4 MODIFIÉ
 * Simplifié : expert ne saisit plus les instruments.
 * Champs : plantId + auditeurId + dateProchaineVerification + observations
 */
public class CreerAuditReglePlateRequest {

    @NotNull
    private Integer plantId;

    @NotNull
    private Integer auditeurId;

    private LocalDate dateProchaineVerification;
    private String observations;

    public Integer getPlantId() { return plantId; }
    public void setPlantId(Integer v) { this.plantId = v; }

    public Integer getAuditeurId() { return auditeurId; }
    public void setAuditeurId(Integer v) { this.auditeurId = v; }

    public LocalDate getDateProchaineVerification() { return dateProchaineVerification; }
    public void setDateProchaineVerification(LocalDate v) { this.dateProchaineVerification = v; }

    public String getObservations() { return observations; }
    public void setObservations(String v) { this.observations = v; }
}
