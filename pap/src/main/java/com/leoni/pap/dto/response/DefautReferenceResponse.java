package com.leoni.pap.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DefautReferenceResponse {
    private String  code;           // ex: "000"
    private String  descriptionEng; // anglais
    private String  descriptionFr;  // français (sera utilisé dans l'autocomplete)
}