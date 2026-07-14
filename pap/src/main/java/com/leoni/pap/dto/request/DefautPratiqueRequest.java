package com.leoni.pap.dto.request;

import lombok.Data;

@Data
public class DefautPratiqueRequest {
    private Integer numero;
    private String  typeDefaut;
    private String  localisation;
    private String  mesureReelle;
    private String  valeurAcceptable;
    private String  observations;
}