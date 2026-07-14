package com.leoni.pap.dto.response;
import lombok.Data;
import java.util.List;
@Data
public class ResultatTestResponse {
    private Double scoreTotal;
    private Double scorePart1;
    private Double scorePart2;
    private Integer pointsObtenus;
    private Integer pointsTotal;
    private Boolean reussi;
    private String message;
    private Integer numeroTentative;
    private Boolean bloque;
    private String dateDeblocage; // si bloqué
    private List<CorrectionResponse> corrections;

    @Data
    public static class CorrectionResponse {
        private Long questionId;
        private String type;
        private String enonce;
        private String imageUrl;
        private String reponseDonnee;
        private String bonneReponse;
        private Boolean correcte;
        private Boolean expiree;
        private Integer points;
        private Integer pointsObtenus;
    }
}
