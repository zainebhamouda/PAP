package com.leoni.pap.dto.request;

import lombok.Data;
import java.util.List;

@Data
public class EnregistrerReponseRequest {
    private Long            questionId;
    private String          reponseTexte;      // Partie 1 IMAGE — inchangé
    private Integer         reponseIndex;      // rétro-compat — ne plus utiliser pour QCM
    private List<Integer>   reponsesIndexes;   // Partie 2 QCM multi-réponse
    private Integer         tempsUtilise;      // secondes
    private Boolean         expiree;           // true si temps écoulé
}