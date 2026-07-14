package com.leoni.pap.dto.request;

import java.util.List;

/**
 * Requête de validation du rapport d'audit spécial.
 *
 * L'auditeur remplit le formulaire, l'audit est marqué TERMINÉ,
 * et le rapport est envoyé directement aux emails fournis
 * (pas de PDCA, pas de validation en attente).
 */
public class ValiderRapportAuditSpecialRequest {

    private String  checklistJson;
    private String  criteresExportJson;
    private Integer resultatAuditPourcentage;
    private String  remarques;

    // ── Audit Export — destinataire externe (conservé pour compatibilité) ──
    private String  emailResponsableMagasin;
    private String  matriculeResponsableMagasin;   // optionnel
    private String  nomResponsableMagasin;

    // ── Audit Export — score JSON pour email annexe ──────────
    private String  scoresJson;  // JSON brut des scores par critère

    // ── Envoi du rapport après remplissage du formulaire ─────
    /** Liste des emails destinataires du rapport (envoi direct, sans validation) */
    private List<String> emailsDestinataires;

    public String  getChecklistJson()              { return checklistJson; }
    public void    setChecklistJson(String v)      { this.checklistJson = v; }
    public String  getCriteresExportJson()         { return criteresExportJson; }
    public void    setCriteresExportJson(String v) { this.criteresExportJson = v; }
    public Integer getResultatAuditPourcentage()   { return resultatAuditPourcentage; }
    public void    setResultatAuditPourcentage(Integer v){ this.resultatAuditPourcentage = v; }
    public String  getRemarques()                  { return remarques; }
    public void    setRemarques(String v)          { this.remarques = v; }
    public String  getEmailResponsableMagasin()    { return emailResponsableMagasin; }
    public void    setEmailResponsableMagasin(String v){ this.emailResponsableMagasin = v; }
    public String  getMatriculeResponsableMagasin(){ return matriculeResponsableMagasin; }
    public void    setMatriculeResponsableMagasin(String v){ this.matriculeResponsableMagasin = v; }
    public String  getNomResponsableMagasin()      { return nomResponsableMagasin; }
    public void    setNomResponsableMagasin(String v){ this.nomResponsableMagasin = v; }
    public String  getScoresJson()                 { return scoresJson; }
    public void    setScoresJson(String v)         { this.scoresJson = v; }
    public List<String> getEmailsDestinataires()        { return emailsDestinataires; }
    public void          setEmailsDestinataires(List<String> v) { this.emailsDestinataires = v; }

}

