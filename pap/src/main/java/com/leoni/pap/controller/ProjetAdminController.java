package com.leoni.pap.controller;

import com.leoni.pap.dto.request.ProjetRequest;
import com.leoni.pap.dto.response.ProjetResponse;
import com.leoni.pap.service.ProjetService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/admin/projets")
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "Admin - Projets")
public class ProjetAdminController {

    private final ProjetService projetService;
    public ProjetAdminController(ProjetService projetService) { this.projetService = projetService; }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<ProjetResponse>> getAll() {
        return ResponseEntity.ok(projetService.getAll());
    }

    @GetMapping("/by-segment/{segmentId}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Projets d'un segment")
    public ResponseEntity<List<ProjetResponse>> getBySegment(@PathVariable Integer segmentId) {
        return ResponseEntity.ok(projetService.getBySegmentId(segmentId));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ProjetResponse> getById(@PathVariable Integer id) {
        return ResponseEntity.ok(projetService.getById(id));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(description = "{ \"nom\": \"Projet X\", \"segmentId\": 1 }")
    public ResponseEntity<ProjetResponse> creer(@RequestBody ProjetRequest req) {
        return ResponseEntity.ok(projetService.creer(req));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ProjetResponse> modifier(@PathVariable Integer id, @RequestBody ProjetRequest req) {
        return ResponseEntity.ok(projetService.modifier(id, req));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<String> supprimer(@PathVariable Integer id) {
        projetService.supprimer(id);
        return ResponseEntity.ok("Projet supprimé.");
    }
}