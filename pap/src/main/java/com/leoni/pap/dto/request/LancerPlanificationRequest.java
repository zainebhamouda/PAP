// ─── LancerPlanificationRequest.java ────────────────────────────────────────
package com.leoni.pap.dto.request;

import java.time.LocalDate;
import java.util.List;

/**
 * Requête pour lancer une planification après avoir complété
 * les auditeurs et deadlines de chaque audit.
 */
public class LancerPlanificationRequest {

    private Long planificationId;
    private List<AuditPlanifItem> audits;

    public Long getPlanificationId() { return planificationId; }
    public void setPlanificationId(Long planificationId) { this.planificationId = planificationId; }
    public List<AuditPlanifItem> getAudits() { return audits; }
    public void setAudits(List<AuditPlanifItem> audits) { this.audits = audits; }

    public static class AuditPlanifItem {
        private Long auditId;       // null si audit créé depuis Excel (temporaire)
        private String reference;   // référence temporaire depuis Excel
        private Integer auditeurId;
        private LocalDate deadline;

        // Pour audits créés depuis Excel (pas encore en base)
        private String typeAudit;
        private String natureAudit;
        private LocalDate datePrevue;
        private Integer projetId;
        private Integer serieId;
        private Integer segmentId;
        private Integer plantId;
        private Integer siteId;
        private String familleCablage;
        private String domaine;
        private String serieNom;
        private String projetNom;
        private String variantNo;
        private String bmwNo;

        public Long getAuditId() { return auditId; }
        public void setAuditId(Long auditId) { this.auditId = auditId; }
        public String getReference() { return reference; }
        public void setReference(String reference) { this.reference = reference; }
        public Integer getAuditeurId() { return auditeurId; }
        public void setAuditeurId(Integer auditeurId) { this.auditeurId = auditeurId; }
        public LocalDate getDeadline() { return deadline; }
        public void setDeadline(LocalDate deadline) { this.deadline = deadline; }
        public String getTypeAudit() { return typeAudit; }
        public void setTypeAudit(String typeAudit) { this.typeAudit = typeAudit; }
        public String getNatureAudit() { return natureAudit; }
        public void setNatureAudit(String natureAudit) { this.natureAudit = natureAudit; }
        public LocalDate getDatePrevue() { return datePrevue; }
        public void setDatePrevue(LocalDate datePrevue) { this.datePrevue = datePrevue; }
        public Integer getProjetId() { return projetId; }
        public void setProjetId(Integer projetId) { this.projetId = projetId; }
        public Integer getSerieId() { return serieId; }
        public void setSerieId(Integer serieId) { this.serieId = serieId; }
        public Integer getSegmentId() { return segmentId; }
        public void setSegmentId(Integer segmentId) { this.segmentId = segmentId; }
        public Integer getPlantId() { return plantId; }
        public void setPlantId(Integer plantId) { this.plantId = plantId; }
        public Integer getSiteId() { return siteId; }
        public void setSiteId(Integer siteId) { this.siteId = siteId; }
        public String getFamilleCablage() { return familleCablage; }
        public void setFamilleCablage(String familleCablage) { this.familleCablage = familleCablage; }
        public String getDomaine() { return domaine; }
        public void setDomaine(String domaine) { this.domaine = domaine; }
        public String getSerieNom() { return serieNom; }
        public void setSerieNom(String serieNom) { this.serieNom = serieNom; }
        public String getProjetNom() { return projetNom; }
        public void setProjetNom(String projetNom) { this.projetNom = projetNom; }
        public String getVariantNo() { return variantNo; }
        public void setVariantNo(String variantNo) { this.variantNo = variantNo; }
        public String getBmwNo() { return bmwNo; }
        public void setBmwNo(String bmwNo) { this.bmwNo = bmwNo; }
    }
}