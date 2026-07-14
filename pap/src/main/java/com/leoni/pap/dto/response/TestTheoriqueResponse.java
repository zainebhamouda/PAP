package com.leoni.pap.dto.response;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class TestTheoriqueResponse {

    private Long            id;
    private String          titre;
    private String          description;
    private Boolean         actif;

    // Toujours 70 — fixe
    private Integer         seuilReussite;

    // Toujours 30 secondes — fixe, non modifiable par l'expert
    private Integer         chronoSecondesParQuestion;

    private LocalDateTime   dateCreation;
    private LocalDateTime   dateActivation;
    private String          expertNom;

    // Compteurs questions
    private Integer         nbQuestionsImage;    // doit être 10 pour activer
    private Integer         nbQuestionsQCMPool;  // min 10 pour activer

    private Integer         nbSessions;          // nombre de fois passé
}