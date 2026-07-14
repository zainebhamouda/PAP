package com.leoni.pap.dto.response;

import java.time.LocalDateTime;
import java.util.List;

/**
 * ProfilResponse — CORRIGÉ
 *
 * Correction : ajout de siteId et plantId
 * Ces champs sont indispensables côté front pour :
 *  - charger les plants du site de l'expert (filtrage audit produit)
 *  - pré-sélectionner le plant de l'utilisateur connecté
 */
public class ProfilResponse {
    private Integer       id;
    private String        nom;
    private String        prenom;
    private String        email;
    private String        matricule;
    private String        role;
    private String        telephone;
    private Boolean       actif;

    // ── Site ────────────────────────────────────────────────────
    private Integer       siteId;           // ← AJOUTÉ
    private String        siteNom;
    private String        siteLocalisation;

    // ── Plant ───────────────────────────────────────────────────
    private Integer       plantId;          // ← AJOUTÉ
    private String        plantNom;

    private Boolean       peutCreerCertif;
    private LocalDateTime dateCreation;

    // ── Préférences UI ──────────────────────────────────────────
    private String       theme;
    private Boolean      modeCompact;
    private Boolean      animations;
    private String       langue;
    private String       timezone;
    private String       dateFormat;
    private Boolean      emailNotificationsActif;
    private List<String> emailNotificationsTypes;
    private Boolean      push;

    // ── Getters / Setters ────────────────────────────────────────
    public Integer       getId()                              { return id; }
    public void          setId(Integer id)                   { this.id = id; }
    public String        getNom()                            { return nom; }
    public void          setNom(String nom)                  { this.nom = nom; }
    public String        getPrenom()                         { return prenom; }
    public void          setPrenom(String prenom)            { this.prenom = prenom; }
    public String        getEmail()                          { return email; }
    public void          setEmail(String email)              { this.email = email; }
    public String        getMatricule()                      { return matricule; }
    public void          setMatricule(String matricule)      { this.matricule = matricule; }
    public String        getRole()                           { return role; }
    public void          setRole(String role)                { this.role = role; }
    public String        getTelephone()                      { return telephone; }
    public void          setTelephone(String telephone)      { this.telephone = telephone; }
    public Boolean       getActif()                          { return actif; }
    public void          setActif(Boolean actif)             { this.actif = actif; }

    // Site
    public Integer       getSiteId()                         { return siteId; }
    public void          setSiteId(Integer v)                { this.siteId = v; }
    public String        getSiteNom()                        { return siteNom; }
    public void          setSiteNom(String v)                { this.siteNom = v; }
    public String        getSiteLocalisation()               { return siteLocalisation; }
    public void          setSiteLocalisation(String v)       { this.siteLocalisation = v; }

    // Plant
    public Integer       getPlantId()                        { return plantId; }
    public void          setPlantId(Integer v)               { this.plantId = v; }
    public String        getPlantNom()                       { return plantNom; }
    public void          setPlantNom(String v)               { this.plantNom = v; }

    public Boolean       getPeutCreerCertif()                { return peutCreerCertif; }
    public void          setPeutCreerCertif(Boolean v)       { this.peutCreerCertif = v; }
    public LocalDateTime getDateCreation()                   { return dateCreation; }
    public void          setDateCreation(LocalDateTime v)    { this.dateCreation = v; }
    public String        getTheme()                          { return theme; }
    public void          setTheme(String v)                  { this.theme = v; }
    public Boolean       getModeCompact()                    { return modeCompact; }
    public void          setModeCompact(Boolean v)           { this.modeCompact = v; }
    public Boolean       getAnimations()                     { return animations; }
    public void          setAnimations(Boolean v)            { this.animations = v; }
    public String        getLangue()                         { return langue; }
    public void          setLangue(String v)                 { this.langue = v; }
    public String        getTimezone()                       { return timezone; }
    public void          setTimezone(String v)               { this.timezone = v; }
    public String        getDateFormat()                     { return dateFormat; }
    public void          setDateFormat(String v)             { this.dateFormat = v; }
    public Boolean       getEmailNotificationsActif()        { return emailNotificationsActif; }
    public void          setEmailNotificationsActif(Boolean v){ this.emailNotificationsActif = v; }
    public List<String>  getEmailNotificationsTypes()        { return emailNotificationsTypes; }
    public void          setEmailNotificationsTypes(List<String> v){ this.emailNotificationsTypes = v; }
    public Boolean       getPush()                           { return push; }
    public void          setPush(Boolean v)                  { this.push = v; }
}