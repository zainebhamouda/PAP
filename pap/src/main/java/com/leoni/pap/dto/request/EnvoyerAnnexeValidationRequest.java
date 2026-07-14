package com.leoni.pap.dto.request;

import lombok.Data;

/**
 * Requête envoyée par l'auditeur qui a rempli l'annexe (ex: Annexe 4)
 * pour désigner un auditeur du même plant chargé de la valider.
 */
@Data
public class EnvoyerAnnexeValidationRequest {
    private Long auditeurValidateurId;
}
