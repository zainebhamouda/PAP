package com.leoni.pap.dto.request;

import lombok.Data;

@Data
public class UploadFormationRequest {
    private String base64;
    private String nomFichier;
}