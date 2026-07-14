package com.leoni.pap.dto.response;

import lombok.Data;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class TestPratiqueResponse {
    private Long    id;
    private String  titre;
    private String  description;
    private Boolean actif;
    private Integer seuilReussite;
    private String  expertNom;
    private Long    testTheoriqueId;
    private String  testTheoriqueNom;
    private Integer nbDefauts;
    private LocalDateTime dateCreation;
    private LocalDateTime dateActivation;
    private List<DefautPratiqueResponse> defauts;

    @Data
    public static class DefautPratiqueResponse {
        private Long    id;
        private Integer numero;
        private String  typeDefaut;
        private String  localisation;
        private String  mesureReelle;
        private String  valeurAcceptable;
        private String  observations;
    }
}