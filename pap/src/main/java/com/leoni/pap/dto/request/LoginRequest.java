package com.leoni.pap.dto.request;

/**
 * Connexion par matricule + mot de passe
 */
public class LoginRequest {
    private String matricule;
    private String motDePasse;

    public String getMatricule() { return matricule; }
    public void setMatricule(String matricule) { this.matricule = matricule; }

    public String getMotDePasse() { return motDePasse; }
    public void setMotDePasse(String motDePasse) { this.motDePasse = motDePasse; }
}