package com.leoni.pap.controller;

import com.leoni.pap.dto.request.CreerCertificatVWRequest;
import com.leoni.pap.dto.response.CertificatVWResponse;
import com.leoni.pap.service.CertificatVWService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Endpoints pour la gestion des certifications VW externes.
 *
 * Accessible par :
 *   - EXPERT_PRODUCT_AUDIT (avec peutCreerCertif = true) → CRUD complet
 *   - AUDITEUR → accès en lecture de ses propres certifs
 *   - ADMIN    → lecture globale
 *
 * Base : /api/certif-vw
 */
@RestController
@RequestMapping("/api/certif-vw")
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "Certifications VW", description = "Gestion des certifications externes VW pour les plants Volkswagen")
@RequiredArgsConstructor
public class CertificatVWController {

    private final CertificatVWService service;

    // ── LISTE PAR PLANT ──────────────────────────────────────
    @GetMapping("/plant/{plantId}")
    @PreAuthorize("hasAnyRole('EXPERT_PRODUCT_AUDIT','ADMIN')")
    @Operation(summary = "Lister toutes les certifications VW d'un plant")
    public ResponseEntity<List<CertificatVWResponse>> getByPlant(@PathVariable Integer plantId) {
        return ResponseEntity.ok(service.getByPlant(plantId));
    }

    // ── LISTE MES CERTIFS (utilisateur connecté) ─────────────
    @GetMapping("/mes-certifs")
    @PreAuthorize("hasAnyRole('AUDITEUR','EXPERT_PRODUCT_AUDIT','ADMIN')")
    @Operation(summary = "Mes certifications VW (utilisateur connecté)")
    public ResponseEntity<List<CertificatVWResponse>> mesCertifs(
            @AuthenticationPrincipal UserDetails user) {
        return ResponseEntity.ok(service.getByAuditeurEmail(user.getUsername()));
    }

    // ── AUTO-COMPLÉTION MATRICULE ────────────────────────────
    @GetMapping("/auditeur/matricule/{matricule}")
    @PreAuthorize("hasAnyRole('EXPERT_PRODUCT_AUDIT','ADMIN')")
    @Operation(summary = "Récupérer les infos auditeur par matricule (auto-complétion)")
    public ResponseEntity<CertificatVWResponse> infoParMatricule(
            @PathVariable String matricule) {
        return ResponseEntity.ok(service.infoParMatricule(matricule));
    }

    // ── CRÉER ────────────────────────────────────────────────
    @PostMapping
    @PreAuthorize("hasRole('EXPERT_PRODUCT_AUDIT')")
    @Operation(summary = "Ajouter une certification VW externe",
            description = "Réservé à l'expert du plant VW ayant l'autorisation peutCreerCertif")
    public ResponseEntity<CertificatVWResponse> creer(
            @RequestBody CreerCertificatVWRequest req,
            @AuthenticationPrincipal UserDetails user) {
        return ResponseEntity.ok(service.creer(req, user.getUsername()));
    }

    // ── MODIFIER ─────────────────────────────────────────────
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('EXPERT_PRODUCT_AUDIT')")
    @Operation(summary = "Modifier une certification VW")
    public ResponseEntity<CertificatVWResponse> modifier(
            @PathVariable Long id,
            @RequestBody CreerCertificatVWRequest req,
            @AuthenticationPrincipal UserDetails user) {
        return ResponseEntity.ok(service.modifier(id, req, user.getUsername()));
    }

    // ── SUPPRIMER ────────────────────────────────────────────
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('EXPERT_PRODUCT_AUDIT')")
    @Operation(summary = "Supprimer une certification VW")
    public ResponseEntity<String> supprimer(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails user) {
        service.supprimer(id, user.getUsername());
        return ResponseEntity.ok("Certification supprimée.");
    }

    // ── TÉLÉCHARGER PDF ──────────────────────────────────────
    @GetMapping("/{id}/pdf")
    @PreAuthorize("hasAnyRole('EXPERT_PRODUCT_AUDIT','AUDITEUR','ADMIN')")
    @Operation(summary = "Télécharger le PDF de la certification VW")
    public ResponseEntity<byte[]> getPdf(@PathVariable Long id) {
        byte[] pdf = service.getPdf(id);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "inline; filename=\"certificat_vw_" + id + ".pdf\"")
                .contentType(MediaType.APPLICATION_PDF)
                .body(pdf);
    }
}