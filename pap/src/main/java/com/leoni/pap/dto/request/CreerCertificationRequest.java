package com.leoni.pap.dto.request;

import lombok.Data;

@Data
public class CreerCertificationRequest {

    private String  titre;
    private String  description;
    private Long    testTheoriqueId;
    private Long    testPratiqueId;

    // SPRINT 2 : client constructeur (BMW, VW, etc.)
    private Integer clientId;

    /**
     * Si true → crée toujours un nouveau brouillon vierge.
     * Si false (ou null) → réutilise le brouillon existant.
     */
    private Boolean forcerNouveau;

    private String formationUrl;
    private String formationNom;

    // Getters/Setters (ou @Data Lombok les génère automatiquement)
    public String getFormationUrl() { return formationUrl; }
    public void setFormationUrl(String formationUrl) { this.formationUrl = formationUrl; }

    public String getFormationNom() { return formationNom; }
    public void setFormationNom(String formationNom) { this.formationNom = formationNom; }
}