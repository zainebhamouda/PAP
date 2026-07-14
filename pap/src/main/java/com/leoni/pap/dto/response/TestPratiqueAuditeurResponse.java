package com.leoni.pap.dto.response;

import lombok.Data;
import java.time.LocalDateTime;

/**
 * Response du test pratique pour l'AUDITEUR uniquement.
 * ⚠️ Ne contient PAS les défauts — l'auditeur inspecte physiquement le cablage.
 */
@Data
public class TestPratiqueAuditeurResponse {
    private Long   id;
    private String titre;
    private String description;
    private Integer nbDefauts;       // combien de défauts chercher
    private String  instructions;    // message affiché à l'auditeur
    private LocalDateTime dateActivation;
}