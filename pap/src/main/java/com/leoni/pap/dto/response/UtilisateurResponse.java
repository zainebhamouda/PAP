package com.leoni.pap.dto.response;

public class UtilisateurResponse {
    private Integer id;
    private String  nom;
    private String  prenom;
    private String  email;
    private String  matricule;
    private String  role;
    private String  telephone;
    private Boolean actif;
    private Boolean inscrit;
    private Integer siteId;
    private String  siteNom;
    private String  siteLocalisation;
    private Integer plantId;
    private String  plantNom;
    private Boolean peutCreerCertif;

    public Integer getId()                              { return id; }
    public void    setId(Integer id)                   { this.id = id; }
    public String  getNom()                            { return nom; }
    public void    setNom(String nom)                  { this.nom = nom; }
    public String  getPrenom()                         { return prenom; }
    public void    setPrenom(String prenom)            { this.prenom = prenom; }
    public String  getEmail()                          { return email; }
    public void    setEmail(String email)              { this.email = email; }
    public String  getMatricule()                      { return matricule; }
    public void    setMatricule(String matricule)      { this.matricule = matricule; }
    public String  getRole()                           { return role; }
    public void    setRole(String role)                { this.role = role; }
    public String  getTelephone()                      { return telephone; }
    public void    setTelephone(String telephone)      { this.telephone = telephone; }
    public Boolean getActif()                          { return actif; }
    public void    setActif(Boolean actif)             { this.actif = actif; }
    public Boolean getInscrit()                        { return inscrit; }
    public void    setInscrit(Boolean inscrit)         { this.inscrit = inscrit; }
    public Integer getSiteId()                         { return siteId; }
    public void    setSiteId(Integer siteId)           { this.siteId = siteId; }
    public String  getSiteNom()                        { return siteNom; }
    public void    setSiteNom(String siteNom)          { this.siteNom = siteNom; }
    public String  getSiteLocalisation()               { return siteLocalisation; }
    public void    setSiteLocalisation(String v)       { this.siteLocalisation = v; }
    public Integer getPlantId()                        { return plantId; }
    public void    setPlantId(Integer plantId)         { this.plantId = plantId; }
    public String  getPlantNom()                       { return plantNom; }
    public void    setPlantNom(String plantNom)        { this.plantNom = plantNom; }
    public Boolean getPeutCreerCertif()           { return peutCreerCertif; }
    public void    setPeutCreerCertif(Boolean v)  { this.peutCreerCertif = v; }
}