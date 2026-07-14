package com.leoni.pap.dto.request;

/**
 * ValiderAuditExportRequest — Sprint 4
 * Requête de validation d'un audit magasin export par le responsable magasin.
 */
public class ValiderAuditExportRequest {
    private String commentaires;

    public String getCommentaires() { return commentaires; }
    public void setCommentaires(String v) { this.commentaires = v; }
}
