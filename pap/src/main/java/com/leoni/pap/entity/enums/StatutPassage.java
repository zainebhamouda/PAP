package com.leoni.pap.entity.enums;

/**
 * Statuts d'un passage de certification.
 *
 * FORMATION_OBLIGATOIRE → l'auditeur doit lire la formation
 * THEORIQUE_EN_COURS    → l'auditeur passe le test théorique
 * THEORIQUE_ECHOUE      → 1er échec théorique → peut retenter
 * PRATIQUE_EN_COURS     → théorique réussi, passe le rapport pratique
 * PRATIQUE_ECHOUE       → 1er échec pratique → peut retenter
 * REUSSI                → pratique réussi → en attente certificat
 * BLOQUE                → bloqué 6 mois (2ème échec théorique OU pratique)
 * ANNULE                → passage annulé (nouvelle certification activée)
 * CERTIFIE              → certificat signé et délivré
 */
public enum StatutPassage {
    FORMATION_OBLIGATOIRE,
    THEORIQUE_EN_COURS,
    THEORIQUE_ECHOUE,   // 1er échec → peut retenter
    PRATIQUE_EN_COURS,
    PRATIQUE_ECHOUE,    // 1er échec pratique → peut retenter
    RAPPORT_VALIDE,
    BLOQUE,
    ANNULE,
    CERTIFIE
}