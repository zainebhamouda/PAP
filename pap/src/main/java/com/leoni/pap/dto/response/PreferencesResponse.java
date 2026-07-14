package com.leoni.pap.dto.response;

import java.util.List;

/**
 * DTO de réponse pour les préférences utilisateur
 */
public class PreferencesResponse {

    private Boolean      emailNotificationsActif;
    private List<String> emailNotificationsTypes;
    private Boolean      push;
    private String       theme;
    private Boolean      modeCompact;
    private Boolean      animations;
    private String       langue;
    private String       timezone;
    private String       dateFormat;

    public Boolean      getEmailNotificationsActif()           { return emailNotificationsActif; }
    public void         setEmailNotificationsActif(Boolean v)  { this.emailNotificationsActif = v; }
    public List<String> getEmailNotificationsTypes()           { return emailNotificationsTypes; }
    public void         setEmailNotificationsTypes(List<String> v) { this.emailNotificationsTypes = v; }
    public Boolean      getPush()                              { return push; }
    public void         setPush(Boolean v)                     { this.push = v; }
    public String       getTheme()                             { return theme; }
    public void         setTheme(String v)                     { this.theme = v; }
    public Boolean      getModeCompact()                       { return modeCompact; }
    public void         setModeCompact(Boolean v)              { this.modeCompact = v; }
    public Boolean      getAnimations()                        { return animations; }
    public void         setAnimations(Boolean v)               { this.animations = v; }
    public String       getLangue()                            { return langue; }
    public void         setLangue(String v)                    { this.langue = v; }
    public String       getTimezone()                          { return timezone; }
    public void         setTimezone(String v)                  { this.timezone = v; }
    public String       getDateFormat()                        { return dateFormat; }
    public void         setDateFormat(String v)                { this.dateFormat = v; }
}