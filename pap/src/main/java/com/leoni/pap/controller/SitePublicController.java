package com.leoni.pap.controller;

import com.leoni.pap.dto.response.SiteResponse;
import com.leoni.pap.service.SiteService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import com.leoni.pap.dto.response.PlantResponse;
import com.leoni.pap.service.PlantService;
/**
 * Routes PUBLIQUES pour les sites.
 * Utilisées uniquement lors de l'inscription (étape 2)
 * pour afficher le dropdown "Site affecté".
 * Aucun token requis.
 */
@RestController
@RequestMapping("/api/sites")
@Tag(name = "Sites (public)", description = "Liste des sites — utilisée dans le formulaire d'inscription (étape 2)")
public class SitePublicController {

    private final SiteService  siteService;
    private final PlantService plantService;

    public SitePublicController(SiteService siteService, PlantService plantService) {
        this.siteService  = siteService;
        this.plantService = plantService;
    }

    @GetMapping
    @Operation(summary = "Lister tous les sites (public)")
    public ResponseEntity<List<SiteResponse>> getAll() {
        return ResponseEntity.ok(siteService.getAll());
    }

    @GetMapping("/plants")
    @Operation(summary = "Lister tous les plants (public)")
    public ResponseEntity<List<PlantResponse>> getAllPlants() {
        return ResponseEntity.ok(plantService.getAll());
    }

    // ── NOUVEAU : plants d'un site (public, pour l'inscription) ──
    @GetMapping("/{siteId}/plants")
    @Operation(summary = "Lister les plants d'un site (public)")
    public ResponseEntity<List<PlantResponse>> getPlantsBySite(@PathVariable Integer siteId) {
        return ResponseEntity.ok(plantService.getPlantsBySiteId(siteId));
    }

}