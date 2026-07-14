package com.leoni.pap.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import java.util.List;

/**
 * Entité Plant — MODIFIÉE Sprint 3
 * Ajout : code, clientNom, description, actif
 * Un Plant = un client (BMW, VW, Audi, Mercedes, etc.) sur un site Leoni
 */
@Entity
@Table(name = "plant")
public class Plant {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(nullable = false, length = 100)
    private String nom;

    /** Code court du plant (ex: BMW-SOU, VW-SOU) */
    @Column(length = 20)
    private String code;

    /** Nom du client (BMW, Volkswagen, Audi, Mercedes...) */
    @Column(name = "client_nom", length = 100)
    private String clientNom;

    /** Description du plant */
    @Column(length = 500)
    private String description;

    /** Statut actif/inactif */
    @Column(nullable = false)
    private Boolean actif = true;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "site_id", nullable = false)
    @JsonIgnore
    private Site site;

    @OneToMany(mappedBy = "plant", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnore
    private List<Segment> segments;

    // ── Getters / Setters ──────────────────────────────────────

    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }

    public String getNom() { return nom; }
    public void setNom(String nom) { this.nom = nom; }

    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }

    public String getClientNom() { return clientNom; }
    public void setClientNom(String clientNom) { this.clientNom = clientNom; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public Boolean getActif() { return actif; }
    public void setActif(Boolean actif) { this.actif = actif; }

    public Site getSite() { return site; }
    public void setSite(Site site) { this.site = site; }

    public List<Segment> getSegments() { return segments; }
    public void setSegments(List<Segment> segments) { this.segments = segments; }
}