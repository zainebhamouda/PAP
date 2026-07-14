package com.leoni.pap.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import java.util.List;

@Entity
@Table(name = "segment")
public class Segment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    private String nom;

    /**
     * Code court du segment (ex: "S32", "SEG32").
     * Utilisé pour le matching depuis le nom du fichier Excel.
     */
    @Column(length = 20)
    private String code;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "plant_id", nullable = false)
    @JsonIgnore
    private Plant plant;

    @OneToMany(mappedBy = "segment", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnore
    private List<Projet> projets;

    public Integer getId()                       { return id; }
    public void    setId(Integer id)             { this.id = id; }
    public String  getNom()                      { return nom; }
    public void    setNom(String nom)            { this.nom = nom; }
    public String  getCode()                     { return code; }
    public void    setCode(String code)          { this.code = code; }
    public Plant   getPlant()                    { return plant; }
    public void    setPlant(Plant plant)         { this.plant = plant; }
    public List<Projet> getProjets()             { return projets; }
    public void    setProjets(List<Projet> p)    { this.projets = p; }
}