package com.leoni.pap.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.leoni.pap.entity.enums.TypeQuestionTest;
import jakarta.persistence.*;
import lombok.*;
import java.util.List;
import java.util.ArrayList;
import java.util.List;
@Entity
@Table(name = "question_test")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class QuestionTest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "test_theorique_id")
    @JsonIgnore
    private TestTheorique testTheorique;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TypeQuestionTest type;

    @Column(nullable = false)
    private Integer ordre;

    // ── PARTIE 1 : IMAGE ─────────────────────────────────────
    private String imageUrl;
    private String bonneReponseImage;

    /**
     * Type de réponse pour les questions image :
     *   "QCM"   → l'auditeur choisit parmi les options (defautsDisponiblesJson)
     *   "LIBRE" → l'auditeur écrit librement dans un champ texte
     *
     * Défaut = "QCM" si defautsDisponiblesJson non vide, sinon "LIBRE"
     */
    @Column(name = "type_reponse_image", length = 10)
    private String typeReponseImage = "QCM";

    @Column(columnDefinition = "TEXT")
    private String defautsDisponiblesJson;

    // ── PARTIE 2 : QCM ───────────────────────────────────────
    @Column(columnDefinition = "TEXT")
    private String enonce;

    @ElementCollection
    @CollectionTable(
            name = "question_test_options",
            joinColumns = @JoinColumn(name = "question_id"))
    @Column(name = "option_texte")
    private List<String> options;

    private Integer bonneReponseIndex;
    @ElementCollection
    @CollectionTable(
            name = "question_test_bonnes_reponses",
            joinColumns = @JoinColumn(name = "question_id"))
    @Column(name = "reponse_index")
    @Builder.Default
    private List<Integer> bonnesReponsesIndexes = new ArrayList<>();
    // ── COMMUN ───────────────────────────────────────────────
    @Column(nullable = false)
    private Integer points = 1;

    @Column(nullable = false)
    private Integer chronoSecondes = 120; // 2 minutes

    private Boolean dansPool = false;
}