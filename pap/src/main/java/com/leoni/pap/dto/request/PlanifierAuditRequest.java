package com.leoni.pap.dto.request;

import com.leoni.pap.entity.enums.NatureAudit;
import com.leoni.pap.entity.enums.TypeAudit;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.util.List;

public class PlanifierAuditRequest {

    @NotNull
    private TypeAudit typeAudit;

    private NatureAudit natureAudit; // Obligatoire pour AUDIT_PRODUIT

    @NotNull
    private LocalDate datePrevue;

    @NotNull
    private Integer plantId;

    private Integer segmentId;
    private Integer projetId;
    private Integer auditeurId;
    private Long    planificationId;

    private String familleCablage;
    private String domaine; // VW, BMW, PSA, FCA, MB...
    private String observations;

    // Pour AUDIT_MAGASIN_EXPORT
    private String zoneExpedition;
    private String destinationExport;

    // Pour AUDIT_REGLES_PLATES : instruments à vérifier
    private List<InstrumentRequest> instruments;

    private LocalDate deadline;
    private Integer   serieId;

    // ── Getters / Setters ─────────────────────────────────────
    public TypeAudit getTypeAudit() { return typeAudit; }
    public void setTypeAudit(TypeAudit v) { this.typeAudit = v; }

    public NatureAudit getNatureAudit() { return natureAudit; }
    public void setNatureAudit(NatureAudit v) { this.natureAudit = v; }

    public LocalDate getDatePrevue() { return datePrevue; }
    public void setDatePrevue(LocalDate v) { this.datePrevue = v; }

    public Integer getPlantId() { return plantId; }
    public void setPlantId(Integer v) { this.plantId = v; }

    public Integer getSegmentId() { return segmentId; }
    public void setSegmentId(Integer v) { this.segmentId = v; }

    public Integer getProjetId() { return projetId; }
    public void setProjetId(Integer v) { this.projetId = v; }

    public Integer getAuditeurId() { return auditeurId; }
    public void setAuditeurId(Integer v) { this.auditeurId = v; }

    public Long getPlanificationId() { return planificationId; }
    public void setPlanificationId(Long v) { this.planificationId = v; }

    public String getFamilleCablage() { return familleCablage; }
    public void setFamilleCablage(String v) { this.familleCablage = v; }

    public String getDomaine() { return domaine; }
    public void setDomaine(String v) { this.domaine = v; }

    public String getObservations() { return observations; }
    public void setObservations(String v) { this.observations = v; }

    public String getZoneExpedition() { return zoneExpedition; }
    public void setZoneExpedition(String v) { this.zoneExpedition = v; }

    public String getDestinationExport() { return destinationExport; }
    public void setDestinationExport(String v) { this.destinationExport = v; }

    public List<InstrumentRequest> getInstruments() { return instruments; }
    public void setInstruments(List<InstrumentRequest> v) { this.instruments = v; }

    public LocalDate getDeadline() { return deadline; }
    public void setDeadline(LocalDate deadline) { this.deadline = deadline; }

    public Integer getSerieId() { return serieId; }
    public void setSerieId(Integer serieId) { this.serieId = serieId; }

    // ── Classe interne pour les instruments ──────────────────
    public static class InstrumentRequest {
        private String numeroInstrument;
        private String typeInstrument; // REGLE_PLATE / METRE_RUBAN
        private String localisation;
        private String plageMesure;
        private Integer periodiciteEnMois;

        public String getNumeroInstrument() { return numeroInstrument; }
        public void setNumeroInstrument(String v) { this.numeroInstrument = v; }

        public String getTypeInstrument() { return typeInstrument; }
        public void setTypeInstrument(String v) { this.typeInstrument = v; }

        public String getLocalisation() { return localisation; }
        public void setLocalisation(String v) { this.localisation = v; }

        public String getPlageMesure() { return plageMesure; }
        public void setPlageMesure(String v) { this.plageMesure = v; }

        public Integer getPeriodiciteEnMois() { return periodiciteEnMois; }
        public void setPeriodiciteEnMois(Integer v) { this.periodiciteEnMois = v; }
    }
}