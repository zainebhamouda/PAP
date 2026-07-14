package com.leoni.pap.dto.response;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class SessionResponse {
    private Long          id;
    private Long          testTheoriqueId;
    private String        statut;
    private Integer       numeroTentative;
    private LocalDateTime dateDebut;
    private Integer       questionActuelle;
    private Integer       partieActuelle;
    private Integer       totalQuestions;              // toujours 20
    private Integer       chronoSecondesParQuestion;   // 120 (2 minutes)
}