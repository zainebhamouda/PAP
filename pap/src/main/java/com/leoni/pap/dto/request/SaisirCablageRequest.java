package com.leoni.pap.dto.request;
import lombok.Data;
import java.util.List;
@Data
public class SaisirCablageRequest {
    private List<DefautCablageRequest> defauts;

    @Data
    public static class DefautCablageRequest {
        private Integer numero;
        private String typeDefaut;
        private String localisation;
        private String mesureReelle;
        private String valeurAcceptable;
        private String observations;
    }
}