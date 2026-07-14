package com.leoni.pap.controller;

import com.leoni.pap.dto.request.*;
import com.leoni.pap.dto.response.AuditResponse;
import com.leoni.pap.entity.AuditProduit;
import com.leoni.pap.repository.UtilisateurRepository;
import com.leoni.pap.service.AuditSpecialService;
import com.leoni.pap.service.RapportPdfService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/audit-special")
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "Audit Spécial", description = "Audits règles plates et magasin export — Sprint 4")
@RequiredArgsConstructor
public class AuditSpecialController {

    private final AuditSpecialService   service;
    private final UtilisateurRepository userRepo;
    private final RapportPdfService     rapportPdfService;

    private Integer uid(UserDetails p) {
        return userRepo.findByMatricule(p.getUsername())
                .orElseThrow(() -> new RuntimeException("Utilisateur introuvable")).getId();
    }

    // ═══ EXPERT — CRÉER ═══════════════════════════════════════════════════
    @PostMapping("/regle-plate")
    @PreAuthorize("hasRole('EXPERT_PRODUCT_AUDIT')")
    @Operation(summary = "Créer un audit règles plates (expert)")
    public ResponseEntity<AuditResponse> creerReglePlate(
            @Valid @RequestBody CreerAuditReglePlateRequest req,
            @AuthenticationPrincipal UserDetails u) {
        return ResponseEntity.ok(service.creerAuditReglePlate(req, uid(u)));
    }

    @PostMapping("/export")
    @PreAuthorize("hasRole('EXPERT_PRODUCT_AUDIT')")
    @Operation(summary = "Créer un audit magasin export (expert)")
    public ResponseEntity<AuditResponse> creerExport(
            @Valid @RequestBody CreerAuditExportRequest req,
            @AuthenticationPrincipal UserDetails u) {
        return ResponseEntity.ok(service.creerAuditExport(req, uid(u)));
    }

    // ═══ EXPERT — LISTER ══════════════════════════════════════════════════
    @GetMapping("/regle-plate")
    @PreAuthorize("hasRole('EXPERT_PRODUCT_AUDIT')")
    @Operation(summary = "Lister audits règles plates (expert)")
    public ResponseEntity<List<AuditResponse>> listerReglePlates(
            @RequestParam(required = false) Integer annee,
            @RequestParam(required = false) Integer plantId) {
        return ResponseEntity.ok(service.getAuditsReglePlates(annee, plantId));
    }

    @GetMapping("/export")
    @PreAuthorize("hasRole('EXPERT_PRODUCT_AUDIT')")
    @Operation(summary = "Lister audits magasin export (expert)")
    public ResponseEntity<List<AuditResponse>> listerExports(
            @RequestParam(required = false) Integer annee) {
        return ResponseEntity.ok(service.getAuditsExport(annee));
    }

    // ═══ AUDITEUR — MES AUDITS ════════════════════════════════════════════
    @GetMapping("/mes-audits/regle-plate")
    @PreAuthorize("hasRole('AUDITEUR')")
    @Operation(summary = "Mes audits règles plates")
    public ResponseEntity<List<AuditResponse>> mesReglePlates(
            @AuthenticationPrincipal UserDetails u) {
        return ResponseEntity.ok(service.getMesAuditsReglePlates(uid(u)));
    }

    @GetMapping("/mes-audits/export")
    @PreAuthorize("hasRole('AUDITEUR')")
    @Operation(summary = "Mes audits magasin export")
    public ResponseEntity<List<AuditResponse>> mesExports(
            @AuthenticationPrincipal UserDetails u) {
        return ResponseEntity.ok(service.getMesAuditsExport(uid(u)));
    }

    // ═══ AUDITEUR — ACTIONS ═══════════════════════════════════════════════
    @PutMapping("/{id}/demarrer")
    @PreAuthorize("hasRole('AUDITEUR')")
    @Operation(summary = "Démarrer un audit spécial")
    public ResponseEntity<AuditResponse> demarrer(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails u) {
        return ResponseEntity.ok(service.demarrerAuditSpecial(id, uid(u)));
    }

    @PostMapping(value = "/{id}/rapport/import", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('AUDITEUR')")
    @Operation(summary = "Importer rapport (auditeur)")
    public ResponseEntity<AuditResponse> validerImport(
            @PathVariable Long id,
            @RequestParam("fichier") MultipartFile fichier,
            @AuthenticationPrincipal UserDetails u) throws IOException {
        return ResponseEntity.ok(service.validerRapportImport(id, fichier, uid(u)));
    }

    @PostMapping("/{id}/rapport/formulaire")
    @PreAuthorize("hasRole('AUDITEUR')")
    @Operation(summary = "Valider formulaire rempli (auditeur)")
    public ResponseEntity<AuditResponse> validerFormulaire(
            @PathVariable Long id,
            @RequestBody ValiderRapportAuditSpecialRequest req,
            @AuthenticationPrincipal UserDetails u) {
        return ResponseEntity.ok(service.validerRapportFormulaire(id, req, uid(u)));
    }

    @PostMapping("/{id}/pdca-regle-plate")
    @PreAuthorize("hasRole('AUDITEUR')")
    @Operation(summary = "Créer PDCA pour non-conformité règle plate (auditeur)")
    public ResponseEntity<AuditResponse> creerPDCA(
            @PathVariable Long id,
            @Valid @RequestBody CreerPDCAReglePlateRequest req,
            @AuthenticationPrincipal UserDetails u) {
        return ResponseEntity.ok(service.creerPDCAReglePlate(id, req, uid(u)));
    }

    // ═══ RESPONSABLE QUALITÉ — VALIDER PDCA ══════════════════════════════
    @PutMapping("/{id}/pdca-regle-plate/valider")
    @PreAuthorize("hasRole('RESPONSABLE_QUALITE_CENTRALE')")
    @Operation(summary = "Valider PDCA règle plate (responsable qualité)")
    public ResponseEntity<AuditResponse> validerPDCA(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails u) {
        return ResponseEntity.ok(service.validerPDCAReglePlate(id, uid(u)));
    }

    // ═══ RESPONSABLE MAGASIN — LISTER ET VALIDER ══════════════════════════
    @GetMapping("/export/mes-audits")
    @PreAuthorize("hasRole('RESPONSABLE_MAGASIN')")
    @Operation(summary = "Audits export à valider (responsable magasin)")
    public ResponseEntity<List<AuditResponse>> auditsExportResponsable(
            @AuthenticationPrincipal UserDetails u) {
        return ResponseEntity.ok(service.getAuditsExportResponsable(uid(u)));
    }

    @PutMapping("/{id}/export/valider")
    @PreAuthorize("hasRole('RESPONSABLE_MAGASIN')")
    @Operation(summary = "Valider audit export (responsable magasin)")
    public ResponseEntity<AuditResponse> validerExport(
            @PathVariable Long id,
            @RequestParam(required = false) String commentaires,
            @AuthenticationPrincipal UserDetails u) {
        return ResponseEntity.ok(service.validerAuditExport(id, uid(u), commentaires));
    }

    // ═══ GÉNÉRATION RAPPORT PDF ═══════════════════════════════════════════
    @PostMapping("/{id}/generer-rapport")
    @PreAuthorize("hasRole('AUDITEUR') or hasRole('EXPERT_PRODUCT_AUDIT')")
    @Operation(summary = "Générer le rapport final PDF")
    public ResponseEntity<Map<String, Object>> genererRapport(
            @PathVariable Long id,
            @RequestBody(required = false) Map<String, Object> body,
            @AuthenticationPrincipal UserDetails u) throws Exception {

        Integer userId = uid(u);
        boolean includeNC = body != null && Boolean.TRUE.equals(body.get("includeNonConformites"));

        String rapportUrl = rapportPdfService.genererEtSauvegarder(id, includeNC);
        service.terminerAudit(id, userId);

        return ResponseEntity.ok(Map.of(
                "success", true,
                "rapportUrl", rapportUrl,
                "message", "Rapport généré avec succès"
        ));
    }

    @GetMapping("/{id}/rapport-pdf")
    @PreAuthorize("hasRole('AUDITEUR') or hasRole('EXPERT_PRODUCT_AUDIT') or hasRole('RESPONSABLE_QUALITE_CENTRALE')")
    @Operation(summary = "Télécharger le rapport PDF")
    public ResponseEntity<byte[]> downloadRapport(
            @PathVariable Long id,
            @RequestParam(defaultValue = "false") boolean includeNonConformites,
            @AuthenticationPrincipal UserDetails u) throws Exception {

        AuditProduit audit = service.getAuditById(id);
        byte[] pdf;
        if (audit.getRapportGenerePdfUrl() != null) {
            Path path = Paths.get(audit.getRapportGenerePdfUrl());
            if (Files.exists(path)) {
                pdf = Files.readAllBytes(path);
            } else {
                pdf = rapportPdfService.genererPdf(audit, includeNonConformites);
            }
        } else {
            pdf = rapportPdfService.genererPdf(audit, includeNonConformites);
        }

        String filename = "rapport_audit_" + audit.getReference().replaceAll("[^a-zA-Z0-9_-]", "_") + ".pdf";
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_PDF);
        headers.setContentDisposition(
                ContentDisposition.attachment().filename(filename).build()
        );
        headers.setContentLength(pdf.length); // long

        return ResponseEntity.ok().headers(headers).body(pdf);
    }
    @GetMapping("/action/valider/{token}")
    public ResponseEntity<String> validerParToken(@PathVariable String token) {
        return ResponseEntity.ok(service.traiterTokenAction(token, true));
    }

    @GetMapping("/action/en-cours/{token}")
    public ResponseEntity<String> enCoursParToken(@PathVariable String token) {
        return ResponseEntity.ok(service.traiterTokenAction(token, false));
    }
    @GetMapping("/{auditId}/plan-action-statut")
    @PreAuthorize("hasRole('AUDITEUR')")
    public ResponseEntity<Map<String, String>> getPlanActionStatut(@PathVariable Long auditId) {
        return ResponseEntity.ok(service.getPlanActionStatut(auditId));
    }

    // ═══ EXPERT — MODIFIER ════════════════════════════════════════
    @PutMapping("/regle-plate/{id}")
    @PreAuthorize("hasRole('EXPERT_PRODUCT_AUDIT')")
    @Operation(summary = "Modifier un audit règles plates (expert)")
    public ResponseEntity<AuditResponse> modifierReglePlate(
            @PathVariable Long id,
            @RequestBody Map<String, Object> body,
            @AuthenticationPrincipal UserDetails u) {
        return ResponseEntity.ok(service.modifierAuditSpecial(id, body, uid(u)));
    }

    @PutMapping("/export/{id}")
    @PreAuthorize("hasRole('EXPERT_PRODUCT_AUDIT')")
    @Operation(summary = "Modifier un audit magasin export (expert)")
    public ResponseEntity<AuditResponse> modifierExport(
            @PathVariable Long id,
            @RequestBody Map<String, Object> body,
            @AuthenticationPrincipal UserDetails u) {
        return ResponseEntity.ok(service.modifierAuditSpecial(id, body, uid(u)));
    }
}