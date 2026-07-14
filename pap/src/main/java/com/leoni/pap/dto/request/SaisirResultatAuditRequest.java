package com.leoni.pap.dto.request;

import java.time.LocalDate;
import java.util.List;

public class SaisirResultatAuditRequest {

    private LocalDate dateRealisation;
    private Integer nombreComposants;
    private String observations;
    private String actionImmediate;

    // Non-conformités détectées (pour AUDIT_PRODUIT et AUDIT_MAGASIN_EXPORT)
    private List<NonConformiteRequest> nonConformites;

    // Items checklist (pour AUDIT_REGLES_PLATES)
    private List<ChecklistItemRequest> checklistItems;

    // ── Getters / Setters ─────────────────────────────────────
    public LocalDate getDateRealisation() { return dateRealisation; }
    public void setDateRealisation(LocalDate v) { this.dateRealisation = v; }
    public Integer getNombreComposants() { return nombreComposants; }
    public void setNombreComposants(Integer v) { this.nombreComposants = v; }
    public String getObservations() { return observations; }
    public void setObservations(String v) { this.observations = v; }
    public String getActionImmediate() { return actionImmediate; }
    public void setActionImmediate(String v) { this.actionImmediate = v; }
    public List<NonConformiteRequest> getNonConformites() { return nonConformites; }
    public void setNonConformites(List<NonConformiteRequest> v) { this.nonConformites = v; }
    public List<ChecklistItemRequest> getChecklistItems() { return checklistItems; }
    public void setChecklistItems(List<ChecklistItemRequest> v) { this.checklistItems = v; }

    // ── Non-conformité ────────────────────────────────────────
    public static class NonConformiteRequest {
        private String codeDefaut;
        private String description;
        private String typeDefaut;
        private Integer points;       // 25, 50, 75 ou 100
        private Integer quantite;
        private String zone;
        private String actionCorrective;

        public String getCodeDefaut() { return codeDefaut; }
        public void setCodeDefaut(String v) { this.codeDefaut = v; }
        public String getDescription() { return description; }
        public void setDescription(String v) { this.description = v; }
        public String getTypeDefaut() { return typeDefaut; }
        public void setTypeDefaut(String v) { this.typeDefaut = v; }
        public Integer getPoints() { return points; }
        public void setPoints(Integer v) { this.points = v; }
        public Integer getQuantite() { return quantite; }
        public void setQuantite(Integer v) { this.quantite = v; }
        public String getZone() { return zone; }
        public void setZone(String v) { this.zone = v; }
        public String getActionCorrective() { return actionCorrective; }
        public void setActionCorrective(String v) { this.actionCorrective = v; }
    }

    // ── Checklist item (règle plate) ──────────────────────────
    public static class ChecklistItemRequest {
        private Long ligneId;
        private String lisibiliteGraduations;   // CONFORME / NON_CONFORME
        private String etatPhysique;
        private String precisionMesure;
        private String etiquetteValidite;
        private String proprete;
        private Double valeurMesuree;
        private Double valeurReference;
        private Double toleranceMax;
        private String observations;
        private String actionCorrective;

        public Long getLigneId() { return ligneId; }
        public void setLigneId(Long v) { this.ligneId = v; }
        public String getLisibiliteGraduations() { return lisibiliteGraduations; }
        public void setLisibiliteGraduations(String v) { this.lisibiliteGraduations = v; }
        public String getEtatPhysique() { return etatPhysique; }
        public void setEtatPhysique(String v) { this.etatPhysique = v; }
        public String getPrecisionMesure() { return precisionMesure; }
        public void setPrecisionMesure(String v) { this.precisionMesure = v; }
        public String getEtiquetteValidite() { return etiquetteValidite; }
        public void setEtiquetteValidite(String v) { this.etiquetteValidite = v; }
        public String getProprete() { return proprete; }
        public void setProprete(String v) { this.proprete = v; }
        public Double getValeurMesuree() { return valeurMesuree; }
        public void setValeurMesuree(Double v) { this.valeurMesuree = v; }
        public Double getValeurReference() { return valeurReference; }
        public void setValeurReference(Double v) { this.valeurReference = v; }
        public Double getToleranceMax() { return toleranceMax; }
        public void setToleranceMax(Double v) { this.toleranceMax = v; }
        public String getObservations() { return observations; }
        public void setObservations(String v) { this.observations = v; }
        public String getActionCorrective() { return actionCorrective; }
        public void setActionCorrective(String v) { this.actionCorrective = v; }
    }
}
