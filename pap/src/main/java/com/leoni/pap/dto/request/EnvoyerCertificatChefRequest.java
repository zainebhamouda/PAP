package com.leoni.pap.dto.request;

import lombok.Data;

@Data
public class EnvoyerCertificatChefRequest {
    private Long chefServiceId;
    private String remarqueExpert;
}