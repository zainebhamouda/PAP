package com.leoni.pap.controller;

import com.leoni.pap.dto.request.PreferencesRequest;
import com.leoni.pap.dto.response.PreferencesResponse;
import com.leoni.pap.repository.SiteRepository;
import com.leoni.pap.repository.UtilisateurRepository;
import com.leoni.pap.service.ProfilService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/commun")
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "Commun", description = "Routes communes à tous les rôles connectés")
public class CommunController {

    private final UtilisateurRepository utilisateurRepo;
    private final SiteRepository        siteRepo;
    private final ProfilService         profilService;

    public CommunController(UtilisateurRepository utilisateurRepo,
                            SiteRepository siteRepo,
                            ProfilService profilService) {
        this.utilisateurRepo = utilisateurRepo;
        this.siteRepo        = siteRepo;
        this.profilService   = profilService;
    }

    /** GET /api/commun/stats-profil */
    @GetMapping("/stats-profil")
    @Operation(summary = "Stats hero strip profil")
    public ResponseEntity<?> getStatsProfil(
            @AuthenticationPrincipal UserDetails userDetails) {
        if (userDetails == null) return ResponseEntity.status(401).build();

        Map<String, Object> stats = new HashMap<>();
        stats.put("totalUsers",          utilisateurRepo.count());
        stats.put("totalSites",          siteRepo.count());
        stats.put("certifs",             0);
        stats.put("examens",             0);
        stats.put("certifsCreees",       0);
        stats.put("auditeursSupervises", 0);
        stats.put("equipe",              0);
        stats.put("rapports",            0);
        stats.put("sites",               0);
        stats.put("nonConf",             0);
        return ResponseEntity.ok(stats);
    }

    /** GET /api/commun/preferences */
    @GetMapping("/preferences")
    @Operation(summary = "Lire mes préférences")
    public ResponseEntity<?> getPreferences(
            @AuthenticationPrincipal UserDetails userDetails) {
        if (userDetails == null) return ResponseEntity.status(401).build();
        return ResponseEntity.ok(profilService.getPreferences(userDetails.getUsername()));
    }

    /** PUT /api/commun/preferences */
    @PutMapping("/preferences")
    @Operation(summary = "Sauvegarder mes préférences (thème, langue, email notifs…)")
    public ResponseEntity<?> savePreferences(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody PreferencesRequest req) {
        if (userDetails == null) return ResponseEntity.status(401).build();
        PreferencesResponse saved =
                profilService.savePreferences(userDetails.getUsername(), req);
        return ResponseEntity.ok(saved);
    }
}