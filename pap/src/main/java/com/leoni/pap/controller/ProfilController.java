package com.leoni.pap.controller;

import com.leoni.pap.dto.response.ProfilResponse;
import com.leoni.pap.service.ProfilService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

/**
 * Controller du profil personnel — accessible à TOUS les rôles connectés.
 *
 * L'utilisateur peut UNIQUEMENT voir son profil.
 * Toute modification est gérée par l'administrateur via /api/admin/utilisateurs.
 *
 * Route :
 *   GET /api/profil  → voir mon profil (lecture seule)
 */
@RestController
@RequestMapping("/api/profil")
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "Mon Profil", description = "Profil personnel en lecture seule — l'admin gère les modifications")
public class ProfilController {

    private final ProfilService profilService;

    public ProfilController(ProfilService profilService) {
        this.profilService = profilService;
    }

    /**
     * Retourne le profil complet de l'utilisateur connecté.
     * Le matricule est extrait automatiquement du token JWT.
     * Aucune modification possible depuis cette route.
     *
     * GET /api/profil
     */
    @GetMapping
    @Operation(summary = "Voir mon profil (lecture seule)")
    public ResponseEntity<?> getMonProfil(
            @AuthenticationPrincipal UserDetails userDetails) {

        // ← FIX : guard null
        if (userDetails == null) {
            return ResponseEntity.status(401).body("Token manquant ou expiré.");
        }

        return ResponseEntity.ok(profilService.getMonProfil(userDetails.getUsername()));
    }
}