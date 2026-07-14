package com.leoni.pap.dto.request;

/**
 * DTO pour la modification d'un utilisateur par l'ADMIN.
 * L'admin peut modifier tous les champs du profil.
 */
public class UpdateUtilisateurRequest {
    private String  nom;
    private String  prenom;
    private String  email;
    private String  telephone;
    private String  role;       // ex: "AUDITEUR", "CHEF_SERVICE"...
    private Integer siteId;     // changer le site affecté
    private Integer plantId;    // changer le plant affecté
    private Boolean actif;      // activer / désactiver le compte
    private String  nouveauMotDePasse; // optionnel — reset mot de passe par admin

    public String getNom() { return nom; }
    public void setNom(String nom) { this.nom = nom; }
    public String getPrenom() { return prenom; }
    public void setPrenom(String prenom) { this.prenom = prenom; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getTelephone() { return telephone; }
    public void setTelephone(String telephone) { this.telephone = telephone; }
    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }
    public Integer getSiteId() { return siteId; }
    public void setSiteId(Integer siteId) { this.siteId = siteId; }
    public Integer getPlantId() { return plantId; }
    public void setPlantId(Integer plantId) { this.plantId = plantId; }
    public Boolean getActif() { return actif; }
    public void setActif(Boolean actif) { this.actif = actif; }
    public String getNouveauMotDePasse() { return nouveauMotDePasse; }
    public void setNouveauMotDePasse(String nouveauMotDePasse) { this.nouveauMotDePasse = nouveauMotDePasse; }
}