package com.leoni.pap.dto.request;

import jakarta.validation.constraints.NotBlank;

public class CreerAuditExportAuditeurRequest {

    private Integer plantId;

    @NotBlank
    private String semaineExport;

    @NotBlank
    private String salleExport;

    private String observations;

    public Integer getPlantId() { return plantId; }
    public void setPlantId(Integer v) { this.plantId = v; }

    public String getSemaineExport() { return semaineExport; }
    public void setSemaineExport(String v) { this.semaineExport = v; }

    public String getSalleExport() { return salleExport; }
    public void setSalleExport(String v) { this.salleExport = v; }

    public String getObservations() { return observations; }
    public void setObservations(String v) { this.observations = v; }
}