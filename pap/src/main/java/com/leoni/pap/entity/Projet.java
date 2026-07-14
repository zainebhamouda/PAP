package com.leoni.pap.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import java.util.List;

/**
 * Entité Projet — MODIFIÉE pour inclure la liste des Séries.
 * Un Projet appartient à un Segment et contient une liste de Séries.
 * Les audits sont réalisés par série.
 */
@Entity
@Table(name = "projet")
public class Projet {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    private String nom;
    private String description;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "segment_id", nullable = false)
    @JsonIgnore
    private Segment segment;

    /** Liste des séries rattachées à ce projet — NOUVEAU */
    @OneToMany(mappedBy = "projet", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnore
    private List<Serie> series;

    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }
    public String getNom() { return nom; }
    public void setNom(String nom) { this.nom = nom; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public Segment getSegment() { return segment; }
    public void setSegment(Segment segment) { this.segment = segment; }
    public List<Serie> getSeries() { return series; }
    public void setSeries(List<Serie> series) { this.series = series; }
}