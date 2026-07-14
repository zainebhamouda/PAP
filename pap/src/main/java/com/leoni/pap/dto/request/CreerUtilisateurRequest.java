package com.leoni.pap.dto.request;

public class CreerUtilisateurRequest {
    private String matricule;
    private String role;
    private String email; // ← NOUVEAU

    public String getMatricule() { return matricule; }
    public void setMatricule(String matricule) { this.matricule = matricule; }

    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
}