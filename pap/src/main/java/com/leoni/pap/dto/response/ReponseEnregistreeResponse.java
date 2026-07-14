package com.leoni.pap.dto.response;
import lombok.Data;
@Data
public class ReponseEnregistreeResponse {
    private Long questionId;
    private Boolean enregistree;
    private Integer questionSuivante; // index de la prochaine question
    private Boolean partieTerminee;
    private Boolean testTermine;
    // ✅ AJOUTS pour correction immédiate
    private Boolean correcte;
    private String  bonneReponse;   // texte de la bonne réponse
    private Integer bonneReponseIndex; // index pour QCM
    private Integer pointsObtenus;
}