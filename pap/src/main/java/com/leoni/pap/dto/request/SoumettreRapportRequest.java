package com.leoni.pap.dto.request;
import lombok.Data;
import java.util.List;
@Data
public class SoumettreRapportRequest {
    private List<LigneRapportRequest> lignes;

    @Data
    public static class LigneRapportRequest {
        private Integer numero;
        private String typeDefaut;
        private String localisation;
        private String mesure;
        private String observations;
    }
}