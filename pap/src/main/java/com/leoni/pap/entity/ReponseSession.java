package com.leoni.pap.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "reponse_session")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ReponseSession {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(nullable = false, name = "session_id")
    private SessionTest session;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(nullable = false, name = "question_id")
    private QuestionTest question;

    private Integer numeroQuestion;

    // Réponse IMAGE
    private String reponseTexte;

    // Réponse QCM
    private Integer reponseIndex;

    // Résultat
    private Boolean correcte      = false;
    private Boolean expiree       = false;   // ✅ sans accent — Lombok génère getExpiree() + builder .expiree()
    private Integer pointsObtenus = 0;
    private Integer tempsUtilise;

    private LocalDateTime dateReponse = LocalDateTime.now();
}