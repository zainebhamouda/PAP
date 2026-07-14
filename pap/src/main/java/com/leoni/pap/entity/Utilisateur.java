package com.leoni.pap.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.List;
import java.time.Instant;

@Entity
@Table(name = "utilisateur")
@Inheritance(strategy = InheritanceType.JOINED)
public class Utilisateur {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(nullable = true)
    private String nom;

    @Column(nullable = true)
    private String prenom;

    @Column(unique = true, nullable = true)
    private String email;

    @Column(nullable = true)
    @JsonIgnore
    private String motDePasse;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private RoleUser role;

    @Column(nullable = false)
    private Boolean actif = false;

    @Column(unique = true, nullable = false)
    private String matricule;

    @Column(nullable = true)
    private String telephone;

    @Column(nullable = false, updatable = false)
    private LocalDateTime dateCreation = LocalDateTime.now();

    // ── PRÉFÉRENCES NOTIFICATIONS ─────────────────────────────
    /** L'utilisateur reçoit des emails pour les notifs importantes */
    @Column(nullable = false)
    private Boolean emailNotificationsActif = false;

    /** Types de notifs envoyés par email (JSON CSV ex: "CERTIF_EXPIRE_7J,ROLE_CHANGE") */
    @Column(nullable = true, length = 500)
    private String emailNotificationsTypes;

    // ── PRÉFÉRENCES UI ────────────────────────────────────────
    @Column(nullable = false)
    private Boolean recevoirNotifications = false;

    /** Thème : "light" ou "dark" */
    @Column(nullable = false)
    private String theme = "light";

    /** Mode compact */
    @Column(nullable = false)
    private Boolean modeCompact = false;

    /** Animations activées */
    @Column(nullable = false)
    private Boolean animations = true;

    /** Langue : "fr", "ar", "en" */
    @Column(nullable = false)
    private String langue = "fr";

    /** Fuseau horaire */
    @Column(nullable = false)
    private String timezone = "Africa/Tunis";

    /** Format de date */
    @Column(nullable = false)
    private String dateFormat = "DD/MM/YYYY";

    @ManyToOne
    @JoinColumn(name = "site_id")
    @JsonIgnore
    private Site site;

    @ManyToOne
    @JoinColumn(name = "plant_id")
    @JsonIgnore
    private Plant plant;

    @OneToMany(mappedBy = "destinataire", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnore
    private List<Notification> notifications;

    @Column(nullable = false)
    private Boolean peutCreerCertif = false;

    // ── Getters / Setters ─────────────────────────────────────
    public Integer getId()                              { return id; }
    public void    setId(Integer id)                   { this.id = id; }
    public String  getNom()                            { return nom; }
    public void    setNom(String nom)                  { this.nom = nom; }
    public String  getPrenom()                         { return prenom; }
    public void    setPrenom(String prenom)            { this.prenom = prenom; }
    public String  getEmail()                          { return email; }
    public void    setEmail(String email)              { this.email = email; }
    public String  getMotDePasse()                     { return motDePasse; }
    public void    setMotDePasse(String motDePasse)    { this.motDePasse = motDePasse; }
    public RoleUser getRole()                          { return role; }
    public void     setRole(RoleUser role)             { this.role = role; }
    public Boolean  getActif()                         { return actif; }
    public void     setActif(Boolean actif)            { this.actif = actif; }
    public String   getMatricule()                     { return matricule; }
    public void     setMatricule(String matricule)     { this.matricule = matricule; }
    public String   getTelephone()                     { return telephone; }
    public void     setTelephone(String telephone)     { this.telephone = telephone; }
    public LocalDateTime getDateCreation()             { return dateCreation; }
    public void          setDateCreation(LocalDateTime v) { this.dateCreation = v; }
    public Boolean  getRecevoirNotifications()         { return recevoirNotifications; }
    public void     setRecevoirNotifications(Boolean r){ this.recevoirNotifications = r; }
    public Boolean  getEmailNotificationsActif()       { return emailNotificationsActif; }
    public void     setEmailNotificationsActif(Boolean v) { this.emailNotificationsActif = v; }
    public String   getEmailNotificationsTypes()       { return emailNotificationsTypes; }
    public void     setEmailNotificationsTypes(String v)  { this.emailNotificationsTypes = v; }
    public String   getTheme()                         { return theme; }
    public void     setTheme(String theme)             { this.theme = theme; }
    public Boolean  getModeCompact()                   { return modeCompact; }
    public void     setModeCompact(Boolean v)          { this.modeCompact = v; }
    public Boolean  getAnimations()                    { return animations; }
    public void     setAnimations(Boolean v)           { this.animations = v; }
    public String   getLangue()                        { return langue; }
    public void     setLangue(String langue)           { this.langue = langue; }
    public String   getTimezone()                      { return timezone; }
    public void     setTimezone(String v)              { this.timezone = v; }
    public String   getDateFormat()                    { return dateFormat; }
    public void     setDateFormat(String v)            { this.dateFormat = v; }
    public Site     getSite()                          { return site; }
    public void     setSite(Site site)                 { this.site = site; }
    public List<Notification> getNotifications()       { return notifications; }
    public void setNotifications(List<Notification> n) { this.notifications = n; }
    public Plant    getPlant()                         { return plant; }
    public void     setPlant(Plant plant)              { this.plant = plant; }
    public Boolean  getPeutCreerCertif()               { return peutCreerCertif; }
    public void     setPeutCreerCertif(Boolean v)      { this.peutCreerCertif = v; }
    private String resetToken;
    private Instant resetTokenExpiry;
    public String getResetToken() { return resetToken; }
    public void setResetToken(String resetToken) { this.resetToken = resetToken; }

    public Instant getResetTokenExpiry() { return resetTokenExpiry; }
    public void setResetTokenExpiry(Instant resetTokenExpiry) { this.resetTokenExpiry = resetTokenExpiry; }
}