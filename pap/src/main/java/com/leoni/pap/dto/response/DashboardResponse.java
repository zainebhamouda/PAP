package com.leoni.pap.dto.response;

import java.util.List;
import java.util.Map;

public class DashboardResponse {

    // ── Stats globales utilisateurs ───────────────────
    private Integer totalUtilisateurs;
    private Integer utilisateursActifs;
    private Integer utilisateursInactifs;
    private Integer utilisateursNonInscrits;
    private Map<String, Long> utilisateursParRole;

    // ── Stats infrastructure ──────────────────────────
    private Integer totalSites;
    private Integer totalPlants;
    private Integer totalPlantsActifs;
    private Integer totalSegments;
    private Integer totalProjets;
    private Integer totalSeries;
    private Integer totalSeriesActives;

    // ── Activité 7 derniers jours ─────────────────────
    private List<JourActiviteResponse> activite7Jours;

    // ── Stats par site ────────────────────────────────
    private List<StatSiteResponse> statsParSite;

    // ── Derniers inscrits ─────────────────────────────
    private List<DernierInscritResponse> derniersInscrits;

    // ─────────────────────────────────────────────────
    // Classe interne : activité d'un jour
    // ─────────────────────────────────────────────────
    public static class JourActiviteResponse {
        private String  jour;        // ex: "Lun", "Mar", ...
        private String  date;        // ex: "2026-04-13"
        private Integer connexions;
        private Integer inscriptions;
        private Integer actionsAdmin;

        public String  getJour()             { return jour; }
        public void    setJour(String v)     { this.jour = v; }
        public String  getDate()             { return date; }
        public void    setDate(String v)     { this.date = v; }
        public Integer getConnexions()       { return connexions; }
        public void    setConnexions(Integer v) { this.connexions = v; }
        public Integer getInscriptions()     { return inscriptions; }
        public void    setInscriptions(Integer v) { this.inscriptions = v; }
        public Integer getActionsAdmin()     { return actionsAdmin; }
        public void    setActionsAdmin(Integer v) { this.actionsAdmin = v; }
    }

    // ─────────────────────────────────────────────────
    // Classe interne : stats d'un site
    // ─────────────────────────────────────────────────
    public static class StatSiteResponse {
        private String  siteNom;
        private String  siteLocalisation;
        private String  plantNom;
        private Integer totalUtilisateurs;
        private Integer auditeurs;
        private Integer chefs;
        private Integer responsables;
        private Integer experts;
        private Integer totalPlants;
        private Integer totalSegments;
        private Integer totalProjets;
        private Integer totalSeries;

        public String  getSiteNom()            { return siteNom; }
        public void    setSiteNom(String v)    { this.siteNom = v; }
        public String  getSiteLocalisation()   { return siteLocalisation; }
        public void    setSiteLocalisation(String v) { this.siteLocalisation = v; }
        public String  getPlantNom()           { return plantNom; }
        public void    setPlantNom(String v)   { this.plantNom = v; }
        public Integer getTotalUtilisateurs()  { return totalUtilisateurs; }
        public void    setTotalUtilisateurs(Integer v) { this.totalUtilisateurs = v; }
        public Integer getAuditeurs()          { return auditeurs; }
        public void    setAuditeurs(Integer v) { this.auditeurs = v; }
        public Integer getChefs()              { return chefs; }
        public void    setChefs(Integer v)     { this.chefs = v; }
        public Integer getResponsables()       { return responsables; }
        public void    setResponsables(Integer v) { this.responsables = v; }
        public Integer getExperts()            { return experts; }
        public void    setExperts(Integer v)   { this.experts = v; }
        public Integer getTotalPlants()        { return totalPlants; }
        public void    setTotalPlants(Integer v) { this.totalPlants = v; }
        public Integer getTotalSegments()      { return totalSegments; }
        public void    setTotalSegments(Integer v) { this.totalSegments = v; }
        public Integer getTotalProjets()       { return totalProjets; }
        public void    setTotalProjets(Integer v) { this.totalProjets = v; }
        public Integer getTotalSeries()        { return totalSeries; }
        public void    setTotalSeries(Integer v) { this.totalSeries = v; }
    }

    // ─────────────────────────────────────────────────
    // Classe interne : dernier inscrit
    // ─────────────────────────────────────────────────
    public static class DernierInscritResponse {
        private Integer id;
        private String  nom;
        private String  prenom;
        private String  matricule;
        private String  role;
        private String  site;

        public Integer getId()                { return id; }
        public void    setId(Integer v)       { this.id = v; }
        public String  getNom()               { return nom; }
        public void    setNom(String v)       { this.nom = v; }
        public String  getPrenom()            { return prenom; }
        public void    setPrenom(String v)    { this.prenom = v; }
        public String  getMatricule()         { return matricule; }
        public void    setMatricule(String v) { this.matricule = v; }
        public String  getRole()              { return role; }
        public void    setRole(String v)      { this.role = v; }
        public String  getSite()              { return site; }
        public void    setSite(String v)      { this.site = v; }
    }

    // ── Getters & Setters ─────────────────────────────
    public Integer getTotalUtilisateurs()                { return totalUtilisateurs; }
    public void    setTotalUtilisateurs(Integer v)       { this.totalUtilisateurs = v; }
    public Integer getUtilisateursActifs()               { return utilisateursActifs; }
    public void    setUtilisateursActifs(Integer v)      { this.utilisateursActifs = v; }
    public Integer getUtilisateursInactifs()             { return utilisateursInactifs; }
    public void    setUtilisateursInactifs(Integer v)    { this.utilisateursInactifs = v; }
    public Integer getUtilisateursNonInscrits()          { return utilisateursNonInscrits; }
    public void    setUtilisateursNonInscrits(Integer v) { this.utilisateursNonInscrits = v; }
    public Map<String, Long> getUtilisateursParRole()    { return utilisateursParRole; }
    public void    setUtilisateursParRole(Map<String, Long> v) { this.utilisateursParRole = v; }
    public Integer getTotalSites()                       { return totalSites; }
    public void    setTotalSites(Integer v)              { this.totalSites = v; }
    public Integer getTotalPlants()                      { return totalPlants; }
    public void    setTotalPlants(Integer v)             { this.totalPlants = v; }
    public Integer getTotalPlantsActifs()                { return totalPlantsActifs; }
    public void    setTotalPlantsActifs(Integer v)       { this.totalPlantsActifs = v; }
    public Integer getTotalSegments()                    { return totalSegments; }
    public void    setTotalSegments(Integer v)           { this.totalSegments = v; }
    public Integer getTotalProjets()                     { return totalProjets; }
    public void    setTotalProjets(Integer v)            { this.totalProjets = v; }
    public Integer getTotalSeries()                      { return totalSeries; }
    public void    setTotalSeries(Integer v)             { this.totalSeries = v; }
    public Integer getTotalSeriesActives()               { return totalSeriesActives; }
    public void    setTotalSeriesActives(Integer v)      { this.totalSeriesActives = v; }
    public List<JourActiviteResponse> getActivite7Jours() { return activite7Jours; }
    public void    setActivite7Jours(List<JourActiviteResponse> v) { this.activite7Jours = v; }
    public List<StatSiteResponse> getStatsParSite()     { return statsParSite; }
    public void    setStatsParSite(List<StatSiteResponse> v) { this.statsParSite = v; }
    public List<DernierInscritResponse> getDerniersInscrits() { return derniersInscrits; }
    public void    setDerniersInscrits(List<DernierInscritResponse> v) { this.derniersInscrits = v; }
}