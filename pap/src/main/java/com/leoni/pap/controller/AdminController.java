package com.leoni.pap.controller;

import com.leoni.pap.dto.response.DashboardResponse;
import com.leoni.pap.dto.response.ProfilResponse;
import com.leoni.pap.service.ProfilService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

/**
 * Controller ADMIN — espace personnel de l'administrateur.
 *
 * Fonctionnalités selon le diagramme use case :
 *   - Dashboard admin (statistiques globales)
 *   - Voir son profil
 *   - Gérer utilisateurs      → UtilisateurController
 *   - Gérer sites             → SiteAdminController
 *   - Gérer plants            → PlantAdminController
 *   - Paramétrer examens      → Sprint 2
 *   - Paramétrage sécurité    → Sprint 2
 *   - Gestion des notifications → NotificationController (partagé)
 *   - Superviser système      → Sprint 3
 */
@RestController
@RequestMapping("/api/admin")
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "Admin - Dashboard", description = "Espace personnel administrateur")
public class AdminController {

    private final com.leoni.pap.service.DashboardService dashboardService;
    private final ProfilService                         profilService;

    public AdminController(com.leoni.pap.service.DashboardService dashboardService,
                           ProfilService profilService) {
        this.dashboardService = dashboardService;
        this.profilService    = profilService;
    }

    /**
     * Dashboard admin — statistiques globales de la plateforme.
     * GET /api/admin/dashboard
     */
    @GetMapping("/dashboard")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(
            summary = "Dashboard Admin",
            description = "Statistiques globales : utilisateurs par rôle, actifs/inactifs, sites, plants, derniers inscrits"
    )
    public ResponseEntity<DashboardResponse> getDashboard() {
        return ResponseEntity.ok(dashboardService.getDashboard());
    }

    /**
     * Profil de l'admin connecté.
     * GET /api/admin/profil
     */
    @GetMapping("/profil")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Voir mon profil (Admin)")
    public ResponseEntity<ProfilResponse> getProfil(
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(profilService.getMonProfil(userDetails.getUsername()));
    }

    /** Sprint 2 — POST /api/admin/examens      → Paramétrer examens     */
    /** Sprint 2 — PUT  /api/admin/securite     → Paramétrage sécurité   */
    /** Sprint 3 — GET  /api/admin/supervision  → Superviser système      */
}