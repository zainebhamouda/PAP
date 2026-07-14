package com.leoni.pap.dto.request;
import lombok.Data;
@Data
public class SignerCertificatRequest {
    private Integer chefServiceId; // requis uniquement pour la signature expert (choisir le chef)
}