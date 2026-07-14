// ─── SerieRequest.java ─────────────────────────────────────────────────────
package com.leoni.pap.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class SerieRequest {

    @NotBlank(message = "Le nom de la série est obligatoire")
    private String nom;

    private String description;

    /** Code série court (ex: VW_A1) */
    private String code;

    /** Client automobile (VW, BMW, PSA, FCA, MB...) */
    private String domaine;

    private String familleCablage;

    @NotNull(message = "Le projet est obligatoire")
    private Integer projetId;

    // ── Getters / Setters ────────────────────────────────────
    public String getNom() { return nom; }
    public void setNom(String nom) { this.nom = nom; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }
    public String getDomaine() { return domaine; }
    public void setDomaine(String domaine) { this.domaine = domaine; }
    public String getFamilleCablage() { return familleCablage; }
    public void setFamilleCablage(String familleCablage) { this.familleCablage = familleCablage; }
    public Integer getProjetId() { return projetId; }
    public void setProjetId(Integer projetId) { this.projetId = projetId; }
}