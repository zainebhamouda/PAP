package com.leoni.pap.entity.enums;

public enum StatutCertification {
    EN_ATTENTE,         // Pas encore commencé
    THEORIQUE_EN_COURS, // Examen théorique en cours
    THEORIQUE_ECHOUE_1, // 1er échec — peut retenter
    BLOQUE,             // 2ème échec — bloqué 6 mois
    THEORIQUE_VALIDE,   // Théorique réussi → attente test pratique
    PRATIQUE_EN_COURS,  // Test pratique en cours
    PRATIQUE_ECHOUE,    // Test pratique échoué
    SIGNATURE_EXPERT,   // Attend signature expert
    SIGNATURE_CHEF,     // Attend signature chef de service
    CERTIFIE,           // Certification complète obtenue
    EXPIRE              // Certification expirée (> 1 an)
}