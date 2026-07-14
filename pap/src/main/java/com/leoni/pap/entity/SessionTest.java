package com.leoni.pap.entity;

import com.leoni.pap.entity.enums.StatutTestSession;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "session_test")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class SessionTest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(nullable = false, name = "auditeur_id")
    private Utilisateur auditeur;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(nullable = false, name = "test_theorique_id")
    private TestTheorique testTheorique;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private StatutTestSession statut = StatutTestSession.EN_COURS;

    @Column(nullable = false)
    private Integer numeroTentative = 1;

    private LocalDateTime dateDebut;
    private LocalDateTime dateFin;

    // Scores
    private Double  scorePart1;
    private Double  scorePart2;
    private Double  scoreTotal;
    private Integer pointsObtenus;
    private Integer pointsTotal;
    private Boolean reussi = false;

    // Questions Part 1 tirees aleatoirement (10 IMAGE parmi N)
    @Column(columnDefinition = "TEXT")
    private String questionsPart1IdsJson;

    // Questions Part 2 tirees aleatoirement (10 QCM parmi N)
    @Column(columnDefinition = "TEXT")
    private String questionsPart2IdsJson;

    @OneToMany(mappedBy = "session", cascade = CascadeType.ALL)
    private List<ReponseSession> reponses;

    // Index question actuelle (0-19)
    private Integer questionActuelle = 0;

    // Partie actuelle (1 ou 2)
    private Integer partieActuelle = 1;
}