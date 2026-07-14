package com.leoni.pap.entity.enums;

public enum StatutAudit {
    PLANIFIE,       // Audit planifié, non encore commencé
    EN_COURS,       // Audit en cours de réalisation
    TERMINE,        // Audit terminé, rapport disponible
    ANNULE,         // Audit annulé
    EN_RETARD       // Date dépassée sans réalisation
}
