package com.leoni.pap.dto.request;

import java.util.List;

/**
 * DTO pour sauvegarder les préférences utilisateur depuis /api/commun/preferences
 */
public class PreferencesRequest {

    // ── Notifications ──────────────────────────────────────────
    /** Email activé pour les notifs importantes */
    private Boolean emailNotificationsActif;

    /** Types de notifs à envoyer par email */
    private List<String> emailNotificationsTypes;

    /** Push in-app activé */
    private Boolean push;

    // ── UI ─────────────────────────────────────────────────────
    private String  theme;
    private Boolean modeCompact;
    private Boolean animations;
    private String  langue;
    private String  timezone;
    private String  dateFormat;

    // Getters / Setters
    public Boolean getEmailNotificationsActif()           { return emailNotificationsActif; }
    public void    setEmailNotificationsActif(Boolean v)  { this.emailNotificationsActif = v; }
    public List<String> getEmailNotificationsTypes()      { return emailNotificationsTypes; }
    public void    setEmailNotificationsTypes(List<String> v) { this.emailNotificationsTypes = v; }
    public Boolean getPush()                              { return push; }
    public void    setPush(Boolean v)                     { this.push = v; }
    public String  getTheme()                             { return theme; }
    public void    setTheme(String v)                     { this.theme = v; }
    public Boolean getModeCompact()                       { return modeCompact; }
    public void    setModeCompact(Boolean v)              { this.modeCompact = v; }
    public Boolean getAnimations()                        { return animations; }
    public void    setAnimations(Boolean v)               { this.animations = v; }
    public String  getLangue()                            { return langue; }
    public void    setLangue(String v)                    { this.langue = v; }
    public String  getTimezone()                          { return timezone; }
    public void    setTimezone(String v)                  { this.timezone = v; }
    public String  getDateFormat()                        { return dateFormat; }
    public void    setDateFormat(String v)                { this.dateFormat = v; }
}