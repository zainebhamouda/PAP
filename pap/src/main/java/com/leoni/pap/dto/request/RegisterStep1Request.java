package com.leoni.pap.dto.request;

/**
 * Étape 1 : Informations personnelles
 */
public class RegisterStep1Request {
    private String nom;
    private String prenom;
    private String email;
    private String matricule;
    private String motDePasse;
    private String confirmerMotDePasse;

    public String getNom() { return nom; }
    public void setNom(String nom) { this.nom = nom; }

    public String getPrenom() { return prenom; }
    public void setPrenom(String prenom) { this.prenom = prenom; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getMatricule() { return matricule; }
    public void setMatricule(String matricule) { this.matricule = matricule; }

    public String getMotDePasse() { return motDePasse; }
    public void setMotDePasse(String motDePasse) { this.motDePasse = motDePasse; }

    public String getConfirmerMotDePasse() { return confirmerMotDePasse; }
    public void setConfirmerMotDePasse(String confirmerMotDePasse) { this.confirmerMotDePasse = confirmerMotDePasse; }
}