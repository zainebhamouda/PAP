package com.leoni.pap.dto.response;
import lombok.Data;
import java.util.List;

@Data
public class QuestionSessionResponse {
    private Long id;
    private String type;            // IMAGE_DEFAUT ou QCM
    private Integer numero;         // 1-10 dans la partie
    private Integer partie;         // 1 ou 2
    private Integer chronoSecondes;
    private Integer points;

    // Partie 1 IMAGE
    private String imageUrl;
    private List<String> defautsDisponibles;

    // Partie 2 QCM
    private String enonce;
    private List<String> options;

    // Nombre de bonnes réponses attendues (pour QCM multi-réponses)
    private Integer nbBonnesReponses;
}