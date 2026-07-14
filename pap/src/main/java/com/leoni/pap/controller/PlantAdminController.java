package com.leoni.pap.controller;

import com.leoni.pap.dto.request.PlantRequest;
import com.leoni.pap.dto.response.PlantResponse;
import com.leoni.pap.service.PlantService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/admin/plants")
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "Admin - Plants")
public class PlantAdminController {

    private final PlantService plantService;
    public PlantAdminController(PlantService plantService) { this.plantService = plantService; }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<PlantResponse>> getAll() {
        return ResponseEntity.ok(plantService.getAll());
    }

    @GetMapping("/by-site/{siteId}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Plants d'un site")
    public ResponseEntity<List<PlantResponse>> getBySite(@PathVariable Integer siteId) {
        return ResponseEntity.ok(plantService.getBySiteId(siteId));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<PlantResponse> getById(@PathVariable Integer id) {
        return ResponseEntity.ok(plantService.getById(id));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(description = "{ \"nom\": \"Plant A\", \"siteId\": 1 }")
    public ResponseEntity<PlantResponse> creer(@RequestBody PlantRequest req) {
        return ResponseEntity.ok(plantService.creer(req));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<PlantResponse> modifier(@PathVariable Integer id, @RequestBody PlantRequest req) {
        return ResponseEntity.ok(plantService.modifier(id, req));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<String> supprimer(@PathVariable Integer id) {
        plantService.supprimer(id);
        return ResponseEntity.ok("Plant supprimé.");
    }
}