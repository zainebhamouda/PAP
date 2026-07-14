package com.leoni.pap.entity.enums;

/**
 * CouleurQK — NOUVEAU Sprint 3
 *
 * Couleur de l'audit produit calculée selon la valeur QK (IP3010) :
 *
 *   VERT   → QK = 0       : produit conforme. Bouton : Exporter rapport PDF
 *   ORANGE → 0 < QK ≤ 0.5 : non-conformité mineure.
 *                           Boutons : Exporter rapport + Fiche réparation
 *   ROSE   → 0.5 < QK ≤ 1 : non-conformité significative.
 *                           Boutons : Exporter rapport + Fiche réparation + PDCA
 *   ROUGE  → QK > 1       : ALERTE HAUTE NIVEAU.
 *                           Boutons : Fiche réparation + PDCA + Action immédiate
 */
public enum CouleurQK {
    VERT,
    ORANGE,
    ROSE,
    ROUGE
}