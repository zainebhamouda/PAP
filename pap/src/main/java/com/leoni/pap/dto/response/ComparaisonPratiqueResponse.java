package com.leoni.pap.dto.response;
import lombok.Data;
import java.util.List;
@Data
public class ComparaisonPratiqueResponse {
    private Double score;
    private Integer defautsCorrects;
    private Integer totalDefauts;
    private Boolean reussi;
    private List<LigneComparaison> comparaison;

    @Data
    public static class LigneComparaison {
        private Integer numero;
        private String defautExpert;
        private String defautAuditeur;
        private String localisationExpert;
        private String localisationAuditeur;
        private String mesureExpert;
        private String mesureAuditeur;
        private Boolean correct;
        private String commentaire;
    }
}