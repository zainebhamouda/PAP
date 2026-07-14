package com.leoni.pap.entity;

import jakarta.persistence.*;
        import lombok.*;
        import java.time.LocalDateTime;
import java.util.List;

/**
 * LE test théorique unique créé par l'Expert.
 * Un seul test peut être ACTIF à la fois.
 * L'expert peut en créer un nouveau (désactive l'ancien).
 *
 * Structure :
 *   - Partie 1 : 10 questions IMAGE_DEFAUT
 *   - Partie 2 : pool QCM (min 15) → 10 tirés aléatoirement
 *
 * Validité : changeable tous les 2 ans par l'expert.
 */
@Entity
@Table(name = "test_theorique")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class TestTheorique {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String titre;

    @Column(length = 500)
    private String description;

    // Seul 1 test peut être actif
    @Column(nullable = false)
    private Boolean actif = false;

    // Seuil de réussite (défaut 70)
    @Column(nullable = false)
    private Integer seuilReussite = 70;

    // Créé par l'expert
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(nullable = false,name = "expert_id")
    private Utilisateur expert;

    @Column(nullable = false)
    private LocalDateTime dateCreation = LocalDateTime.now();

    private LocalDateTime dateActivation;

    // Questions Partie 1 (IMAGE_DEFAUT) - exactement 10
    @OneToMany(mappedBy = "testTheorique", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("ordre ASC")
    private List<QuestionTest> questions;

    // Nombre total de sessions passées sur ce test
    private Integer nbSessions = 0;
}