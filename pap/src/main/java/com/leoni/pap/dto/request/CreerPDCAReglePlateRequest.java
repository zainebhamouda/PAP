package com.leoni.pap.dto.request;

import java.util.List;

/**
 * Requête PDCA pour audit règle plate.
 * Supporte : responsable plateforme OU email externe.
 * Si plusieurs NC, peut envoyer séparément ou groupé.
 */
public class CreerPDCAReglePlateRequest {

    // ── Responsable interne (plateforme) ──────────────────────
    private Integer responsableQualiteId;       // null si email externe

    // ── Destinataire externe ───────────────────────────────────
    private String  emailExterne;               // email saisi manuellement
    private String  matriculeExterne;           // optionnel
    private String  nomDestinataire;            // nom affiché dans l'email

    // ── Contenu ───────────────────────────────────────────────
    private String  numeroInstrument;
    private String  remarques;

    /**
     * Liste des non-conformités à inclure dans l'email.
     * Chaque item = une ligne du tableau checklist.
     */
    private List<NonConformiteItem> nonConformites;

    /**
     * true  → un email par NC (un responsable par NC)
     * false → toutes les NC dans un seul email (défaut)
     */
    private boolean envoyerSepare = false;

    // ── Inner class ───────────────────────────────────────────
    public static class NonConformiteItem {
        private String numeroInstrument;
        private String typeInstrument;
        private String emplacement;
        private String dateControle;
        private String nomControleur;
        private String resultat;
        private String remarques;
        // Email destinataire spécifique si envoyerSepare=true
        private String emailDestinataire;
        private String nomDestinataire;

        public String getNumeroInstrument()   { return numeroInstrument; }
        public void   setNumeroInstrument(String v) { this.numeroInstrument = v; }
        public String getTypeInstrument()     { return typeInstrument; }
        public void   setTypeInstrument(String v) { this.typeInstrument = v; }
        public String getEmplacement()        { return emplacement; }
        public void   setEmplacement(String v){ this.emplacement = v; }
        public String getDateControle()       { return dateControle; }
        public void   setDateControle(String v){ this.dateControle = v; }
        public String getNomControleur()      { return nomControleur; }
        public void   setNomControleur(String v){ this.nomControleur = v; }
        public String getResultat()           { return resultat; }
        public void   setResultat(String v)   { this.resultat = v; }
        public String getRemarques()          { return remarques; }
        public void   setRemarques(String v)  { this.remarques = v; }
        public String getEmailDestinataire()  { return emailDestinataire; }
        public void   setEmailDestinataire(String v){ this.emailDestinataire = v; }
        public String getNomDestinataire()    { return nomDestinataire; }
        public void   setNomDestinataire(String v){ this.nomDestinataire = v; }
    }

    // ── Getters / Setters ─────────────────────────────────────
    public Integer getResponsableQualiteId()  { return responsableQualiteId; }
    public void    setResponsableQualiteId(Integer v) { this.responsableQualiteId = v; }
    public String  getEmailExterne()          { return emailExterne; }
    public void    setEmailExterne(String v)  { this.emailExterne = v; }
    public String  getMatriculeExterne()      { return matriculeExterne; }
    public void    setMatriculeExterne(String v){ this.matriculeExterne = v; }
    public String  getNomDestinataire()       { return nomDestinataire; }
    public void    setNomDestinataire(String v){ this.nomDestinataire = v; }
    public String  getNumeroInstrument()      { return numeroInstrument; }
    public void    setNumeroInstrument(String v){ this.numeroInstrument = v; }
    public String  getRemarques()             { return remarques; }
    public void    setRemarques(String v)     { this.remarques = v; }
    public List<NonConformiteItem> getNonConformites() { return nonConformites; }
    public void    setNonConformites(List<NonConformiteItem> v){ this.nonConformites = v; }
    public boolean isEnvoyerSepare()          { return envoyerSepare; }
    public void    setEnvoyerSepare(boolean v){ this.envoyerSepare = v; }
}