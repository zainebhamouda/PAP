package com.leoni.pap.entity.enums;

public enum StatutPlanification {
    BROUILLON,   // Créée, non encore lancée
    LANCE,       // Lancée — notifications envoyées aux auditeurs
    TERMINE,     // Tous les audits terminés
    ANNULE       // Annulée par l'expert
}