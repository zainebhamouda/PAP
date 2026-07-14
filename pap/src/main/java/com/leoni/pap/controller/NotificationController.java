package com.leoni.pap.controller;

import com.leoni.pap.dto.response.NotificationResponse;
import com.leoni.pap.entity.Utilisateur;
import com.leoni.pap.exception.BusinessException;
import com.leoni.pap.repository.UtilisateurRepository;
import com.leoni.pap.service.NotificationService;
import com.leoni.pap.service.*;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "Notifications", description = "Gestion des notifications")
@RequiredArgsConstructor
@PreAuthorize("isAuthenticated()")
public class NotificationController {

    private final NotificationService   notifService;
    private final UtilisateurRepository utilisateurRepo;
    private final EmailService           emailService;
    // ── GET /api/notifications ────────────────────────────────
    @GetMapping
    @Operation(summary = "Toutes mes notifications")
    public ResponseEntity<?> getMesNotifications(
            @AuthenticationPrincipal UserDetails userDetails) {

        if (userDetails == null) return ResponseEntity.status(401).build();

        // ← FIX : appel via matricule (méthode List<NotificationResponse>)
        List<NotificationResponse> notifs =
                notifService.getMesNotifications(userDetails.getUsername());
        return ResponseEntity.ok(notifs);
    }

    // ── GET /api/notifications/non-lues ──────────────────────
    @GetMapping("/non-lues")
    @Operation(summary = "Nombre + liste des notifications non lues")
    public ResponseEntity<?> getNonLues(
            @AuthenticationPrincipal UserDetails userDetails) {

        if (userDetails == null) return ResponseEntity.status(401).build();

        Utilisateur u = getUtilisateur(userDetails.getUsername());
        Map<String, Object> result = new HashMap<>();
        result.put("count",         notifService.countNonLues(u));
        result.put("notifications", notifService.getMesNonLues(u));
        return ResponseEntity.ok(result);
    }

    // ── PUT /api/notifications/{id}/lire ─────────────────────
    @PutMapping("/{id}/lire")
    @Operation(summary = "Marquer une notification comme lue")
    public ResponseEntity<?> marquerLue(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {

        if (userDetails == null) return ResponseEntity.status(401).build();

        notifService.marquerLue(id);
        return ResponseEntity.ok("Notification marquée comme lue.");
    }

    // ── PUT /api/notifications/lire-tout ─────────────────────
    @PutMapping("/lire-tout")
    @Operation(summary = "Marquer toutes les notifications comme lues")
    public ResponseEntity<?> marquerToutesLues(
            @AuthenticationPrincipal UserDetails userDetails) {

        if (userDetails == null) return ResponseEntity.status(401).build();

        Utilisateur u = getUtilisateur(userDetails.getUsername());
        notifService.marquerToutesLues(u);
        return ResponseEntity.ok("Toutes les notifications marquées comme lues.");
    }

    // ── DELETE /api/notifications/{id} ───────────────────────
    @DeleteMapping("/{id}")
    @Operation(summary = "Supprimer une notification")
    public ResponseEntity<?> supprimer(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {

        if (userDetails == null) return ResponseEntity.status(401).build();

        notifService.supprimer(id);
        return ResponseEntity.ok("Notification supprimée.");
    }

    // ── HELPER ───────────────────────────────────────────────
    private Utilisateur getUtilisateur(String matricule) {
        return utilisateurRepo.findByMatricule(matricule)
                .orElseThrow(() -> new BusinessException(
                        "Utilisateur introuvable : " + matricule));
    }
}