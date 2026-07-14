package com.leoni.pap.dto.request;

import lombok.Data;
import java.time.LocalDate;

/**
 * Request pour créer ou modifier une certification VW externe.
 *
 * dateExpiration n'est PAS fournie par le client : elle est calculée
 * automatiquement côté service (dateObtention + 4 ans).
 */
@Data
public class CreerCertificatVWRequest {

    /** Matricule de l'auditeur — permet l'auto-complétion plant/site */
    private String  matriculeAuditeur;

    /** Date à laquelle VW a délivré la certification */
    private LocalDate dateObtention;

    /**
     * PDF en base64 (optionnel à la création, peut être uploadé séparément).
     * Format : data:application/pdf;base64,JVBERi0xLjQ...
     */
    private String  pdfBase64;

    /** Nom original du fichier PDF */
    private String  pdfNom;
}
