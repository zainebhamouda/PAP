package com.leoni.pap.dto.response;

import com.leoni.pap.entity.AuditProduit;
import com.leoni.pap.entity.LigneChecklistReglePlate;
import com.leoni.pap.entity.NonConformiteAudit;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

/**
 * AuditResponse — MODIFIÉ Sprint 3+
 *
 * Nouveau champ ajouté :
 *  - demandeExtension : demande de prolongation EN_ATTENTE (si existante)
 *    → permet au frontend expert de détecter un message auditeur sans appel séparé
 */
public class AuditResponse {

    private Long      id;
    private String    reference;
    private String    typeAudit;
    private String    natureAudit;
    private String    statut;
    private LocalDate datePrevue;
    private LocalDate dateRealisation;
    private LocalDate deadline;
    private String    familleCablage;
    private String    domaine;
    private String    observations;
    private String    actionImmediate;

    // ── ORGANISATION ──────────────────────────────────────────
    private String  plantNom;
    private Integer plantId;
    private String  siteNom;
    private Integer siteId;
    private String  segmentNom;
    private Integer segmentId;
    private String  projetNom;
    private Integer projetId;

    // ── SÉRIE ─────────────────────────────────────────────────
    private String  serieNom;
    private Integer serieId;
    private String  serieCode;

    // ── PLANIFICATION ─────────────────────────────────────────
    private Long   planificationId;
    private String planificationNom;

    // ── ACTEURS ───────────────────────────────────────────────
    private String  auditeurNom;
    private Integer auditeurId;
    private String  planificateurNom;
    private Integer planificateurId;   // ← AJOUTÉ : utile pour l'envoi de la demande

    // ── RÉSULTATS QK ─────────────────────────────────────────
    private Integer nombreComposants;
    private Double  totalPoints;
    private Double  facteur;
    private Double  valeurQK;
    private Boolean qkDepasseSeuil;
    private String  couleurQK;

    // ── PDCA ─────────────────────────────────────────────────
    private Boolean       pdcaDeclenche;
    private LocalDateTime datePdca;

    // ── RAPPORT ──────────────────────────────────────────────
    private String  numeroRapport;
    private String  rapportUrl;
    private Boolean rapportGenere;
    private String  rapportGenerePdfUrl;

    // ── MAGASIN EXPORT ────────────────────────────────────────
    private String zoneExpedition;
    private String destinationExport;

    // ── NON-CONFORMITÉS ───────────────────────────────────────
    private List<NonConformiteResponse> nonConformites;

    // ── CHECKLIST ─────────────────────────────────────────────
    private List<ChecklistItemResponse> checklistItems;

    // ── MÉTADONNÉES ───────────────────────────────────────────
    private LocalDateTime dateCreation;
    private LocalDateTime dateModification;

    // ═══════════════════════════════════════════════════════════
    // ✅ NOUVEAU CHAMP Sprint 3+ — Demande d'extension en attente
    // ═══════════════════════════════════════════════════════════
    private DemandeExtensionInfo demandeExtension;

    /**
     * Sous-objet léger embarqué dans AuditResponse.
     * Contient uniquement les infos nécessaires au frontend
     * pour afficher le badge "Message en attente" et le modal.
     */
    public static class DemandeExtensionInfo {
        private Long   id;
        private String raisonType;
        private String description;
        private String delaiDemande;   // ISO string "2025-07-15"
        private String statut;         // EN_ATTENTE | TRAITE | REFUSE
        private String createdAt;
        private String auditeurNom;

        // ── Getters ──
        public Long   getId()          { return id; }
        public String getRaisonType()  { return raisonType; }
        public String getDescription() { return description; }
        public String getDelaiDemande(){ return delaiDemande; }
        public String getStatut()      { return statut; }
        public String getCreatedAt()   { return createdAt; }
        public String getAuditeurNom() { return auditeurNom; }

        // ── Setters ──
        public void setId(Long id)                   { this.id = id; }
        public void setRaisonType(String v)          { this.raisonType = v; }
        public void setDescription(String v)         { this.description = v; }
        public void setDelaiDemande(String v)        { this.delaiDemande = v; }
        public void setStatut(String v)              { this.statut = v; }
        public void setCreatedAt(String v)           { this.createdAt = v; }
        public void setAuditeurNom(String v)         { this.auditeurNom = v; }
    }

    // ═══════════════════════════════════════════════════════════
    // FACTORY METHOD
    // ═══════════════════════════════════════════════════════════

    public static AuditResponse from(AuditProduit a) {
        AuditResponse r = new AuditResponse();
        r.id              = a.getId();
        r.reference       = a.getReference();
        r.typeAudit       = a.getTypeAudit()    != null ? a.getTypeAudit().name()    : null;
        r.natureAudit     = a.getNatureAudit()  != null ? a.getNatureAudit().name()  : null;
        r.statut          = a.getStatut()       != null ? a.getStatut().name()       : null;
        r.datePrevue      = a.getDatePrevue();
        r.dateRealisation = a.getDateRealisation();
        r.deadline        = a.getDeadline();
        r.familleCablage  = a.getFamilleCablage();
        r.domaine         = a.getDomaine();
        r.observations    = a.getObservations();
        r.actionImmediate = a.getActionImmediate();

        // Organisation
        r.plantId   = a.getPlant()   != null ? a.getPlant().getId()    : null;
        r.plantNom  = a.getPlant()   != null ? a.getPlant().getNom()   : null;
        r.siteId    = a.getSite()    != null ? a.getSite().getId()     : null;
        r.siteNom   = a.getSite()    != null ? a.getSite().getNom()    : null;
        r.segmentId = a.getSegment() != null ? a.getSegment().getId()  : null;
        r.segmentNom= a.getSegment() != null ? a.getSegment().getNom() : null;
        r.projetId  = a.getProjet()  != null ? a.getProjet().getId()   : null;
        r.projetNom = a.getProjet()  != null ? a.getProjet().getNom()
                : (a.getProjetLabel() != null ? a.getProjetLabel() : null);

        // Série
        r.serieId   = a.getSerie() != null ? a.getSerie().getId()   : null;
        r.serieNom  = a.getSerie() != null ? a.getSerie().getNom()
                : (a.getSerieLabel() != null ? a.getSerieLabel() : null);
        r.serieCode = a.getSerie() != null ? a.getSerie().getCode() : null;

        // Planification
        r.planificationId  = a.getPlanification() != null ? a.getPlanification().getId()  : null;
        r.planificationNom = a.getPlanification() != null ? a.getPlanification().getNom() : null;

        // Acteurs
        r.auditeurId     = a.getAuditeur() != null ? a.getAuditeur().getId() : null;
        r.auditeurNom    = a.getAuditeur() != null
                ? a.getAuditeur().getPrenom() + " " + a.getAuditeur().getNom() : null;
        r.planificateurNom = a.getPlanificateur() != null
                ? a.getPlanificateur().getPrenom() + " " + a.getPlanificateur().getNom() : null;
        // ✅ NOUVEAU : planificateurId (expert qui a créé l'audit)
        r.planificateurId  = a.getPlanificateur() != null ? a.getPlanificateur().getId() : null;

        // Résultats QK
        r.nombreComposants = a.getNombreComposants();
        r.totalPoints      = a.getTotalPoints();
        r.facteur          = a.getFacteur();
        r.valeurQK         = a.getValeurQK();
        r.qkDepasseSeuil   = a.getQkDepasseSeuil();
        r.couleurQK        = a.getCouleurQK() != null ? a.getCouleurQK().name() : null;

        // PDCA
        r.pdcaDeclenche = a.getPdcaDeclenche();
        r.datePdca      = a.getDatePdca();

        // Rapport
        r.numeroRapport       = a.getNumeroRapport();
        r.rapportUrl          = a.getRapportUrl();
        r.rapportGenere       = a.getRapportGenere();
        r.rapportGenerePdfUrl = a.getRapportGenerePdfUrl();

        // Magasin
        r.zoneExpedition    = a.getZoneExpedition();
        r.destinationExport = a.getDestinationExport();

        // Métadonnées
        r.dateCreation     = a.getDateCreation();
        r.dateModification = a.getDateModification();

        // Non-conformités
        if (a.getNonConformites() != null) {
            r.nonConformites = a.getNonConformites().stream()
                    .map(nc -> new NonConformiteResponse(
                            nc.getId(), nc.getDescription(),
                            nc.getPoints(), nc.getZone()))
                    .collect(Collectors.toList());
        }

        // Checklist
        if (a.getChecklistItems() != null) {
            r.checklistItems = a.getChecklistItems().stream()
                    .map(ci -> new ChecklistItemResponse(
                            ci.getId(),
                            ci.getNumeroInstrument(),
                            ci.getTypeInstrument(),
                            ci.getStatut() != null ? ci.getStatut().name() : null))
                    .collect(Collectors.toList());
        }

        // ✅ demandeExtension : laissé null ici, enrichi par le service
        //    (voir AuditProduitService.getAllAudits() et getMesAuditsProduit())
        r.demandeExtension = null;

        return r;
    }

    // ═══════════════════════════════════════════════════════════
    // Getters & Setters
    // ═══════════════════════════════════════════════════════════
    public Long      getId()                 { return id; }
    public String    getReference()          { return reference; }
    public String    getTypeAudit()          { return typeAudit; }
    public String    getNatureAudit()        { return natureAudit; }
    public String    getStatut()             { return statut; }
    public LocalDate getDatePrevue()         { return datePrevue; }
    public LocalDate getDateRealisation()    { return dateRealisation; }
    public LocalDate getDeadline()           { return deadline; }
    public String    getFamilleCablage()     { return familleCablage; }
    public String    getDomaine()            { return domaine; }
    public String    getObservations()       { return observations; }
    public String    getActionImmediate()    { return actionImmediate; }
    public String    getPlantNom()           { return plantNom; }
    public Integer   getPlantId()            { return plantId; }
    public String    getSiteNom()            { return siteNom; }
    public Integer   getSiteId()             { return siteId; }
    public String    getSegmentNom()         { return segmentNom; }
    public Integer   getSegmentId()          { return segmentId; }
    public String    getProjetNom()          { return projetNom; }
    public Integer   getProjetId()           { return projetId; }
    public String    getSerieNom()           { return serieNom; }
    public Integer   getSerieId()            { return serieId; }
    public String    getSerieCode()          { return serieCode; }
    public Long      getPlanificationId()    { return planificationId; }
    public String    getPlanificationNom()   { return planificationNom; }
    public String    getAuditeurNom()        { return auditeurNom; }
    public Integer   getAuditeurId()         { return auditeurId; }
    public String    getPlanificateurNom()   { return planificateurNom; }
    public Integer   getPlanificateurId()    { return planificateurId; }  // ← NOUVEAU getter
    public Integer   getNombreComposants()   { return nombreComposants; }
    public Double    getTotalPoints()        { return totalPoints; }
    public Double    getFacteur()            { return facteur; }
    public Double    getValeurQK()           { return valeurQK; }
    public Boolean   getQkDepasseSeuil()     { return qkDepasseSeuil; }
    public String    getCouleurQK()          { return couleurQK; }
    public Boolean   getPdcaDeclenche()      { return pdcaDeclenche; }
    public LocalDateTime getDatePdca()       { return datePdca; }
    public String    getNumeroRapport()      { return numeroRapport; }
    public String    getRapportUrl()         { return rapportUrl; }
    public Boolean   getRapportGenere()      { return rapportGenere; }
    public String    getRapportGenerePdfUrl(){ return rapportGenerePdfUrl; }
    public String    getZoneExpedition()     { return zoneExpedition; }
    public String    getDestinationExport()  { return destinationExport; }
    public List<NonConformiteResponse> getNonConformites()  { return nonConformites; }
    public List<ChecklistItemResponse> getChecklistItems()  { return checklistItems; }
    public LocalDateTime getDateCreation()   { return dateCreation; }
    public LocalDateTime getDateModification(){ return dateModification; }

    // ✅ NOUVEAU getter + setter pour demandeExtension
    public DemandeExtensionInfo getDemandeExtension()              { return demandeExtension; }
    public void setDemandeExtension(DemandeExtensionInfo d)        { this.demandeExtension = d; }

    // ── Inner classes ─────────────────────────────────────────
    public record NonConformiteResponse(
            Long id, String description, Integer points, String localisation) {}

    public record ChecklistItemResponse(
            Long id, String numeroInstrument,
            String typeInstrument, String statut) {}
}