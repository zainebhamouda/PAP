package com.leoni.pap.dto.request;

import lombok.Data;
import java.time.LocalDate;

@Data
public class DemandeExtensionRequest {
    private Long    auditId;
    private String  auditRef;
    private String  raisonType;       // CHARGE_TRAVAIL | PROBLEME_ACCES | MALADIE | ...
    private String  description;
    private String  delaiDemande;     // ISO date string "2025-07-15"
    private Integer expertId;
}