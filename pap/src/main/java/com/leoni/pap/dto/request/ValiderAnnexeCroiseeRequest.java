package com.leoni.pap.dto.request;

import lombok.Data;

/**
 * Requête envoyée par l'auditeur validateur pour valider ou rejeter
 * l'annexe qui lui a été soumise (ex: Annexe 4).
 */
@Data
public class ValiderAnnexeCroiseeRequest {
    private Boolean valide;
    private String commentaire;
}
