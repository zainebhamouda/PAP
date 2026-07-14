package com.leoni.pap.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonManagedReference;

@Entity
@Table(name = "test_pratique")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class TestPratique {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String titre;

    private String description;

    @Column(nullable = false)
    private Boolean actif = false;

    // Lié automatiquement au TestTheorique actif au moment de la création
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "test_theorique_id")
    private TestTheorique testTheorique;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "expert_id", nullable = false)
    private Utilisateur expert;

    private LocalDateTime dateCreation;
    private LocalDateTime dateActivation;

    // Liste des défauts préparés par l'expert
    @OneToMany(mappedBy = "testPratique", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonManagedReference
    private List<CablageDefaut> defauts;

    @Column(nullable = false)
    private Integer seuilReussite = 70;  // ← ajouter
}