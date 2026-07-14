package com.leoni.pap.dto.response;
import lombok.Data;
import java.time.LocalDateTime;
@Data
public class CertificatResponse {
    private Long id;
    private String numeroCertificat;
    private String statut;
    private String auditeurNom;
    private String auditeurPrenom;
    private String auditeurMatricule;
    private String siteNom;
    private Double scoreFinal;
    private String niveauBadge;
    private LocalDateTime dateObtention;
    private LocalDateTime dateExpiration;
    private Boolean signatureExpert;
    private Boolean signatureChef;
    private String expertNom;
    private String chefNom;
    private String cheminPdf;
    private LocalDateTime dateGeneration;
}