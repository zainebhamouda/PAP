package com.leoni.pap.controller;

import com.leoni.pap.dto.request.PlanifierAuditRequest;
import com.leoni.pap.dto.request.UpdateAuditRequest;
import com.leoni.pap.dto.request.SaisirResultatAuditRequest;
import com.leoni.pap.dto.response.AuditResponse;
import com.leoni.pap.entity.enums.TypeAudit;
import com.leoni.pap.repository.UtilisateurRepository;
import com.leoni.pap.service.AuditProduitService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

/**
 * AuditController MODIFIÉ — Sprint 3/4 :
 *  - Ajout : upload rapport par auditeur (multipart)
 *  - Ajout : déclarer audit terminé par auditeur
 *  - Ajout : filtrage par série
 *  - Ajout : modifier deadline (expert)
 */
@RestController
@RequestMapping("/api/audits")
@RequiredArgsConstructor
public class AuditController {

    private final AuditProduitService   auditService;
    private final UtilisateurRepository userRepo;

    private Integer getCurrentUserId(UserDetails p) {
        return userRepo.findByMatricule(p.getUsername())
                .orElseThrow(() -> new RuntimeException("Utilisateur introuvable"))
                .getId();
    }

    // ── PLANIFICATION ─────────────────────────────────────────
    @PostMapping("/planifier")
    @PreAuthorize("hasAnyRole('EXPERT_PRODUCT_AUDIT','AUDITEUR')")   // ← CHANGER ICI
    public ResponseEntity<AuditResponse> planifier(
            @Valid @RequestBody PlanifierAuditRequest request,
            @AuthenticationPrincipal UserDetails principal) {
        return ResponseEntity.ok(auditService.planifierAudit(request, getCurrentUserId(principal)));
    }

    // ── MODIFIER AUDIT (expert) ─────────────────────────────
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('EXPERT_PRODUCT_AUDIT')")
    public ResponseEntity<AuditResponse> modifier(
            @PathVariable Long id,
            @RequestBody UpdateAuditRequest request,
            @AuthenticationPrincipal UserDetails principal) {
        return ResponseEntity.ok(auditService.modifierAudit(id, request, getCurrentUserId(principal)));
    }

    // ── SUPPRIMER AUDIT (expert) ────────────────────────────
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('EXPERT_PRODUCT_AUDIT')")
    public ResponseEntity<String> supprimer(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails principal) {
        auditService.supprimerAudit(id, getCurrentUserId(principal));
        return ResponseEntity.ok("Audit supprime.");
    }

    // ── DÉMARRAGE ─────────────────────────────────────────────
    @PutMapping("/{id}/demarrer")
    public ResponseEntity<AuditResponse> demarrer(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails principal) {
        return ResponseEntity.ok(auditService.demarrerAudit(id, getCurrentUserId(principal)));
    }

    // ── SAISIE RÉSULTATS ──────────────────────────────────────
    @PutMapping("/{id}/resultats")
    public ResponseEntity<AuditResponse> saisirResultats(
            @PathVariable Long id,
            @RequestBody SaisirResultatAuditRequest request,
            @AuthenticationPrincipal UserDetails principal) {
        return ResponseEntity.ok(auditService.saisirResultats(id, request, getCurrentUserId(principal)));
    }

    // ── UPLOAD RAPPORT (auditeur envoie son rapport PDF) ──────
    @PostMapping(value = "/{id}/rapport", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAnyRole('AUDITEUR', 'EXPERT_PRODUCT_AUDIT')")
    public ResponseEntity<AuditResponse> uploadRapport(
            @PathVariable Long id,
            @RequestParam("fichier") MultipartFile fichier,
            @AuthenticationPrincipal UserDetails principal) {
        return ResponseEntity.ok(auditService.uploadRapport(id, fichier, getCurrentUserId(principal)));
    }

    // ── TERMINER PAR AUDITEUR ─────────────────────────────────
    @PutMapping("/{id}/terminer")
    @PreAuthorize("hasAnyRole('AUDITEUR', 'EXPERT_PRODUCT_AUDIT')")
    public ResponseEntity<AuditResponse> terminer(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails principal) {
        return ResponseEntity.ok(auditService.terminerParAuditeur(id, getCurrentUserId(principal)));
    }

    // ── PDCA ──────────────────────────────────────────────────
    @PutMapping("/{id}/pdca")
    public ResponseEntity<AuditResponse> declencherPdca(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails principal) {
        return ResponseEntity.ok(auditService.declencherPdca(id, getCurrentUserId(principal)));
    }

    // ── ANNULATION ────────────────────────────────────────────
    @PutMapping("/{id}/annuler")
    public ResponseEntity<AuditResponse> annuler(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails principal) {
        return ResponseEntity.ok(auditService.annulerAudit(id, getCurrentUserId(principal)));
    }

    // ── LECTURE UNIQUE ────────────────────────────────────────
    @GetMapping("/{id}")
    public ResponseEntity<AuditResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(auditService.getById(id));
    }

    // ── MES AUDITS (auditeur connecté) ────────────────────────
    @GetMapping("/mes-audits")
    public ResponseEntity<List<AuditResponse>> getMesAudits(
            @AuthenticationPrincipal UserDetails principal) {
        return ResponseEntity.ok(auditService.getMesAudits(getCurrentUserId(principal)));
    }

    @GetMapping("/mes-audits/type/{type}")
    public ResponseEntity<List<AuditResponse>> getMesAuditsByType(
            @PathVariable String type,
            @AuthenticationPrincipal UserDetails principal) {
        return ResponseEntity.ok(
                auditService.getMesAuditsByType(getCurrentUserId(principal), TypeAudit.valueOf(type)));
    }

    // ── PAR SÉRIE ─────────────────────────────────────────────
    @GetMapping("/serie/{serieId}")
    public ResponseEntity<List<AuditResponse>> getBySerie(@PathVariable Integer serieId) {
        return ResponseEntity.ok(auditService.getBySerie(serieId));
    }

    // ── PAR PLANT ─────────────────────────────────────────────
    @GetMapping("/plant/{plantId}")
    public ResponseEntity<List<AuditResponse>> getByPlant(@PathVariable Integer plantId) {
        return ResponseEntity.ok(auditService.getByPlant(plantId));
    }

    // ── PAR TYPE ──────────────────────────────────────────────
    @GetMapping("/type/{type}")
    public ResponseEntity<List<AuditResponse>> getByType(@PathVariable String type) {
        return ResponseEntity.ok(auditService.getByType(TypeAudit.valueOf(type)));
    }

    // ── TOUS LES AUDITS ───────────────────────────────────────
    @GetMapping
    public ResponseEntity<List<AuditResponse>> getAll(
            @RequestParam(required = false) Long planificationId) {
        if (planificationId != null) {
            return ResponseEntity.ok(auditService.getByPlanification(planificationId));
        }
        return ResponseEntity.ok(auditService.getAllAudits());
    }
    // ── PLANNING MENSUEL ──────────────────────────────────────
    @GetMapping("/planning")
    public ResponseEntity<List<AuditResponse>> getPlanning(
            @RequestParam(required = false) Integer plantId,
            @RequestParam int annee,
            @RequestParam int mois) {
        return ResponseEntity.ok(auditService.getPlanningMois(plantId, annee, mois));
    }

    // ── DASHBOARD STATS ───────────────────────────────────────
    @GetMapping("/stats/dashboard")
    public ResponseEntity<Map<String, Object>> getDashboard(
            @RequestParam(required = false) Integer plantId) {
        return ResponseEntity.ok(auditService.getDashboardStats(plantId));
    }
}