package com.leoni.pap.dto.request;

import lombok.Data;

@Data
public class ValiderCertificatChefRequest {
    private Boolean valide;
    private String commentaireChef;
}