package com.leoni.pap.dto.request;

/**
 * Étape 3 — Confirmation finale
 * L'utilisateur saisit département, téléphone et accepte les conditions.
 * Les données des étapes 1 et 2 sont récupérées depuis la DB (via matricule).
 */
public class RegisterFinalRequest {

    // Récupéré depuis l'étape 1 (passé par le frontend)
    private String matricule;

    // Nouveau champ de l'étape 3
    private String telephone;

    // Checkboxes obligatoires
    private Boolean accepterConditions;       // CGU + Politique de confidentialité
    private Boolean recevoirNotifications;    // Notifications email

    public String getMatricule() { return matricule; }
    public void setMatricule(String matricule) { this.matricule = matricule; }

    public String getTelephone() { return telephone; }
    public void setTelephone(String telephone) { this.telephone = telephone; }

    public Boolean getAccepterConditions() { return accepterConditions; }
    public void setAccepterConditions(Boolean accepterConditions) { this.accepterConditions = accepterConditions; }

    public Boolean getRecevoirNotifications() { return recevoirNotifications; }
    public void setRecevoirNotifications(Boolean recevoirNotifications) { this.recevoirNotifications = recevoirNotifications; }
}