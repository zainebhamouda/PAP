package com.leoni.pap.controller;

import java.util.*;
import java.util.stream.Collectors;
import com.leoni.pap.dto.request.LancerPlanificationRequest;
import com.leoni.pap.dto.response.AuditResponse;
import com.leoni.pap.dto.response.PlanificationResponse;
import com.leoni.pap.dto.response.SegmentResponse;
import com.leoni.pap.repository.UtilisateurRepository;
import com.leoni.pap.service.PlanificationService;
import com.leoni.pap.service.UtilisateurService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import com.leoni.pap.repository.*;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/planification")
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "Planification", description = "Gestion des planifications des audits produit")
@RequiredArgsConstructor
public class PlanificationController {

    private final PlanificationService planifService;
    private final UtilisateurRepository userRepo;
    private final UtilisateurService utilisateurService;
    private final SiteRepository siteRepo;
    private final PlantRepository plantRepo;
    private final SegmentRepository segmentRepo;
    private final ClientRepository clientRepo;   // ← AJOUTÉ

    private Integer getCurrentUserId(UserDetails u) {
        return userRepo.findByMatricule(u.getUsername())
                .orElseThrow(() -> new RuntimeException("Utilisateur introuvable"))
                .getId();
    }

    // ── IMPORT EXCEL ──────────────────────────────────────────

    @PostMapping(value = "/import-excel", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAnyRole('EXPERT_PRODUCT_AUDIT','AUDITEUR')")
    @Operation(
            summary = "Importer un fichier Excel de planification",
            description = "Parse le fichier Excel et retourne la liste des audits à compléter."
    )
    public ResponseEntity<Map<String, Object>> importerExcel(
            @RequestParam("fichier") MultipartFile fichier,
            @RequestParam(value = "segmentId", required = false) Integer segmentId,
            @RequestParam(value = "plantId",   required = false) Integer plantId,
            @RequestParam(value = "siteId",    required = false) Integer siteId,
            @AuthenticationPrincipal UserDetails userDetails) {

        Integer createurId = getCurrentUserId(userDetails);
        Map<String, Object> result = planifService.importerExcel(
                fichier, createurId, segmentId, plantId, siteId);
        return ResponseEntity.ok(result);
    }

    // ── LANCER ────────────────────────────────────────────────

    @PostMapping("/lancer")
    @PreAuthorize("hasAnyRole('EXPERT_PRODUCT_AUDIT','AUDITEUR')")
    @Operation(
            summary = "Lancer la planification",
            description = "Crée tous les audits avec auditeurs et deadlines."
    )
    public ResponseEntity<PlanificationResponse> lancer(
            @RequestBody LancerPlanificationRequest req,
            @AuthenticationPrincipal UserDetails user) {
        return ResponseEntity.ok(
                planifService.lancerPlanification(req, getCurrentUserId(user)));
    }

    // ── MODIFIER DEADLINE ─────────────────────────────────────

    @PutMapping("/audits/{auditId}/deadline")
    @PreAuthorize("hasRole('EXPERT_PRODUCT_AUDIT')")
    @Operation(summary = "Modifier le deadline d'un audit")
    public ResponseEntity<AuditResponse> modifierDeadline(
            @PathVariable Long auditId,
            @RequestParam String deadline) {
        return ResponseEntity.ok(
                planifService.modifierDeadline(auditId, LocalDate.parse(deadline)));
    }

    // ── SUPPRIMER UNE PLANIFICATION ───────────────────────────

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('EXPERT_PRODUCT_AUDIT','AUDITEUR')")
    @Operation(
            summary = "Supprimer une planification",
            description = "Possible uniquement si la planification est en statut BROUILLON."
    )
    public ResponseEntity<String> supprimer(@PathVariable Long id) {
        planifService.supprimerPlanification(id);
        return ResponseEntity.ok("Planification supprimée.");
    }

    // ── LECTURE EXPERT ────────────────────────────────────────

    @GetMapping("/mes-planifications")
    @PreAuthorize("hasRole('EXPERT_PRODUCT_AUDIT')")
    @Operation(summary = "Mes planifications (Expert)")
    public ResponseEntity<List<PlanificationResponse>> getMesPlanifications(
            @AuthenticationPrincipal UserDetails user) {
        return ResponseEntity.ok(
                planifService.getMesPlanifications(getCurrentUserId(user)));
    }

    // ✅ CORRIGÉ : ajout du rôle AUDITEUR (c'est ce endpoint qu'appelle
    // AuditeurSuiviPlanification.jsx via fetchPlanifDetail -> 500 sinon,
    // car Spring renvoyait un AccessDeniedException converti en 500
    // par le handler global au lieu d'un 403 propre)
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('EXPERT_PRODUCT_AUDIT','RESPONSABLE_QUALITE_CENTRALE','AUDITEUR')")
    @Operation(summary = "Détail d'une planification")
    public ResponseEntity<PlanificationResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(planifService.getById(id));
    }

    // ✅ CORRIGÉ : ajout du rôle AUDITEUR (même raison que ci-dessus)
    @GetMapping("/{id}/segment")
    @PreAuthorize("hasAnyRole('EXPERT_PRODUCT_AUDIT','RESPONSABLE_QUALITE_CENTRALE','AUDITEUR')")
    @Operation(summary = "Segment d'une planification")
    public ResponseEntity<SegmentResponse> getSegmentByPlanification(@PathVariable Long id) {
        return ResponseEntity.ok(planifService.getSegmentByPlanificationId(id));
    }

    // ── LECTURE TOUTES ────────────────────────────────────────

    @GetMapping
    @PreAuthorize("hasAnyRole('EXPERT_PRODUCT_AUDIT','RESPONSABLE_QUALITE_CENTRALE','AUDITEUR')")
    @Operation(summary = "Toutes les planifications")
    public ResponseEntity<List<PlanificationResponse>> getAll() {
        return ResponseEntity.ok(planifService.getAll());
    }

    @GetMapping("/mes-planifications-auditeur")
    @PreAuthorize("hasRole('AUDITEUR')")
    @Operation(summary = "Planifications visibles par l'auditeur")
    public ResponseEntity<List<PlanificationResponse>> getMesPlanificationsAuditeur(
            @AuthenticationPrincipal UserDetails user) {
        return ResponseEntity.ok(
                planifService.getMesPlanificationsAuditeur(getCurrentUserId(user)));
    }

    @GetMapping("/mes-planifications-creees")
    @PreAuthorize("hasRole('AUDITEUR')")
    @Operation(
            summary = "Planifications créées par l'auditeur (Suivi)",
            description = "Uniquement les planifications que l'auditeur connecté a lui-même créées, pour son écran de suivi."
    )
    public ResponseEntity<List<PlanificationResponse>> getMesPlanificationsCreesAuditeur(
            @AuthenticationPrincipal UserDetails user) {
        return ResponseEntity.ok(
                planifService.getMesPlanificationsCreesAuditeur(getCurrentUserId(user)));
    }

    // ── EXPORT FICHIER PLANIFICATION ──────────────────────────

    @GetMapping("/{id}/export")
    @PreAuthorize("hasAnyRole('EXPERT_PRODUCT_AUDIT','RESPONSABLE_QUALITE_CENTRALE','AUDITEUR')")
    @Operation(summary = "Exporter le fichier Excel de planification")
    public ResponseEntity<Resource> exporterFichier(@PathVariable Long id) {
        PlanificationService.ExportFichier export = planifService.exporterFichierPlanification(id);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=\"" + export.getFilename() + "\"")
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .body(export.getResource());
    }

    // ── SITES / PLANTS / SEGMENTS ─────────────────────────────

    @GetMapping("/sites")
    public ResponseEntity<List<Map<String, Object>>> getSites() {
        List<Map<String, Object>> result = siteRepo.findAll().stream().map(s -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id",  s.getId());
            m.put("nom", s.getNom());
            return m;
        }).collect(Collectors.toList());
        return ResponseEntity.ok(result);
    }

    @GetMapping("/sites/{siteId}/plants")
    public ResponseEntity<List<Map<String, Object>>> getPlantsBySite(@PathVariable Integer siteId) {
        List<Map<String, Object>> result = plantRepo.findBySiteId(siteId).stream().map(p -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id",        p.getId());
            m.put("nom",       p.getNom());
            m.put("clientNom", p.getClientNom());
            return m;
        }).collect(Collectors.toList());
        return ResponseEntity.ok(result);
    }

    @GetMapping("/sites/plants/{plantId}/segments")
    @PreAuthorize("hasAnyRole('EXPERT_PRODUCT_AUDIT','RESPONSABLE_QUALITE_CENTRALE','ADMIN','AUDITEUR')")
    public ResponseEntity<List<Map<String, Object>>> getSegmentsByPlant(@PathVariable Integer plantId) {
        List<Map<String, Object>> result = segmentRepo.findByPlantId(plantId).stream()
                .map(s -> {
                    Map<String, Object> m = new LinkedHashMap<>();
                    m.put("id",   s.getId());
                    m.put("nom",  s.getNom());
                    m.put("code", s.getCode());
                    return m;
                })
                .collect(Collectors.toList());
        return ResponseEntity.ok(result);
    }

    // ── CLIENTS-DISTINCTS ─────────────────────────────────────
    // ✅ MODIFIÉ : utilise les vrais groupes clients (estGroupe=true)
    // au lieu de lire clientNom depuis les plants

    @GetMapping("/clients-distincts")
    @PreAuthorize("hasAnyRole('EXPERT_PRODUCT_AUDIT','ADMIN','AUDITEUR')")   // ← AUDITEUR ajouté
    @Operation(summary = "Noms des groupes clients actifs (BMW Group, VW Group…)")
    public ResponseEntity<List<String>> getClientsDistincts() {
        List<String> clients = clientRepo
                .findByActifTrueAndEstGroupeTrueOrderByNomAsc()   // ← groupes seulement
                .stream()
                .map(c -> c.getNom())
                .collect(Collectors.toList());
        return ResponseEntity.ok(clients);
    }
}