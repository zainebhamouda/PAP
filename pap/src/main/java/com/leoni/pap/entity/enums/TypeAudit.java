package com.leoni.pap.entity.enums;

public enum TypeAudit {
    AUDIT_PRODUIT,       // Audit produit principal (destructif / non destructif)
    AUDIT_REGLES_PLATES, // Contrôle périodique des règles plates / mètres ruban
    AUDIT_MAGASIN_EXPORT // Audit du magasin d'export (expédition)
}
