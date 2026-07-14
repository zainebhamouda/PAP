package com.leoni.pap.dto.request;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.NotBlank;

/**
 * CreerAuditExportRequest — Sprint 4 MODIFIÉ
 * Simplifié : expert ne saisit plus séries/caisses.
 * Champs : auditeurId + responsableMagasinId + semaineExport + salleExport + observations
 */
public class CreerAuditExportRequest {
    // Ajout pour permettre la sélection du plant lors de la création d'un audit export
    private Integer plantId;

    @NotNull
    private Integer auditeurId;

    private Integer responsableMagasinId;

    @NotBlank
    private String semaineExport;

    @NotBlank
    private String salleExport;

    private String observations;

    public Integer getAuditeurId() { return auditeurId; }
    public void setAuditeurId(Integer v) { this.auditeurId = v; }

    public Integer getResponsableMagasinId() { return responsableMagasinId; }
    public void setResponsableMagasinId(Integer v) { this.responsableMagasinId = v; }

    public String getSemaineExport() { return semaineExport; }
    public void setSemaineExport(String v) { this.semaineExport = v; }

    public String getSalleExport() { return salleExport; }
    public void setSalleExport(String v) { this.salleExport = v; }

    public String getObservations() { return observations; }
    public void setObservations(String v) { this.observations = v; }

    public Integer getPlantId() { return plantId; }
    public void setPlantId(Integer plantId) { this.plantId = plantId; }

   
}
