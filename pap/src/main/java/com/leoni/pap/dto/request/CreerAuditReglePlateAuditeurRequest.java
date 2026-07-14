package com.leoni.pap.dto.request;

import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;

public class CreerAuditReglePlateAuditeurRequest {

    @NotNull
    private Integer plantId;

    private LocalDate dateProchaineVerification;
    private String observations;

    public Integer getPlantId() { return plantId; }
    public void setPlantId(Integer v) { this.plantId = v; }

    public LocalDate getDateProchaineVerification() { return dateProchaineVerification; }
    public void setDateProchaineVerification(LocalDate v) { this.dateProchaineVerification = v; }

    public String getObservations() { return observations; }
    public void setObservations(String v) { this.observations = v; }
}