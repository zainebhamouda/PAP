package com.leoni.pap.dto.request;

import lombok.Data;

@Data
public class CreerTestPratiqueRequest {
    private String  titre;
    private String  description;
    private Integer seuilReussite; // obligatoire — saisi par l'expert
}