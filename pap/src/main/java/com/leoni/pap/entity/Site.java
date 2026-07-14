package com.leoni.pap.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import java.util.List;

/**
 * Entité Site — MODIFIÉE Sprint 3
 * Ajout des attributs réels des sites Leoni :
 *  totalSpaceM2, productionSpaceM2, numberOfPlants,
 *  totalHc, directHc, indirectHc
 */
@Entity
@Table(name = "site")
public class Site {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(nullable = false, length = 100)
    private String nom;

    @Column(length = 200)
    private String localisation;

    // ── ATTRIBUTS RÉELS LEONI (Image 2) ──────────────────────

    /** Surface totale du site en m² */
    @Column(name = "total_space_m2")
    private Integer totalSpaceM2;

    /** Surface de production en m² */
    @Column(name = "production_space_m2")
    private Integer productionSpaceM2;

    /** Nombre de plants sur ce site */
    @Column(name = "number_of_plants")
    private Integer numberOfPlants;

    /** Total headcount (effectif total) */
    @Column(name = "total_hc")
    private Integer totalHc;

    /** Effectif direct */
    @Column(name = "direct_hc")
    private Integer directHc;

    /** Effectif indirect */
    @Column(name = "indirect_hc")
    private Integer indirectHc;

    // ── RELATIONS ──────────────────────────────────────────────

    @OneToMany(mappedBy = "site", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnore
    private List<Plant> plants;

    @OneToMany(mappedBy = "site", cascade = CascadeType.ALL)
    @JsonIgnore
    private List<Utilisateur> utilisateurs;

    // ── Getters / Setters ──────────────────────────────────────

    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }

    public String getNom() { return nom; }
    public void setNom(String nom) { this.nom = nom; }

    public String getLocalisation() { return localisation; }
    public void setLocalisation(String localisation) { this.localisation = localisation; }

    public Integer getTotalSpaceM2() { return totalSpaceM2; }
    public void setTotalSpaceM2(Integer totalSpaceM2) { this.totalSpaceM2 = totalSpaceM2; }

    public Integer getProductionSpaceM2() { return productionSpaceM2; }
    public void setProductionSpaceM2(Integer productionSpaceM2) { this.productionSpaceM2 = productionSpaceM2; }

    public Integer getNumberOfPlants() { return numberOfPlants; }
    public void setNumberOfPlants(Integer numberOfPlants) { this.numberOfPlants = numberOfPlants; }

    public Integer getTotalHc() { return totalHc; }
    public void setTotalHc(Integer totalHc) { this.totalHc = totalHc; }

    public Integer getDirectHc() { return directHc; }
    public void setDirectHc(Integer directHc) { this.directHc = directHc; }

    public Integer getIndirectHc() { return indirectHc; }
    public void setIndirectHc(Integer indirectHc) { this.indirectHc = indirectHc; }

    public List<Plant> getPlants() { return plants; }
    public void setPlants(List<Plant> plants) { this.plants = plants; }

    public List<Utilisateur> getUtilisateurs() { return utilisateurs; }
    public void setUtilisateurs(List<Utilisateur> utilisateurs) { this.utilisateurs = utilisateurs; }
}