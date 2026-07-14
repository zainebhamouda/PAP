package com.leoni.pap.controller;

import com.leoni.pap.dto.response.ClientResponse;
import com.leoni.pap.service.ClientLienService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/clients/{clientParentId}/membres")
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "Clients — Membres liés", description = "Gestion des sous-clients liés à un client")
@RequiredArgsConstructor
public class ClientLienController {

    private final ClientLienService lienService;

    // GET /api/clients/{id}/membres
    @GetMapping
    @Operation(summary = "Liste des membres liés à un client")
    public ResponseEntity<List<ClientResponse>> getMembres(
            @PathVariable Integer clientParentId) {
        return ResponseEntity.ok(lienService.getMembres(clientParentId));
    }

    // POST /api/clients/{id}/membres/{membreId}
    @PostMapping("/{clientMembreId}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Lier un client membre à un client parent")
    public ResponseEntity<Void> ajouterMembre(
            @PathVariable Integer clientParentId,
            @PathVariable Integer clientMembreId) {
        lienService.ajouterMembre(clientParentId, clientMembreId);
        return ResponseEntity.ok().build();
    }

    // DELETE /api/clients/{id}/membres/{membreId}
    @DeleteMapping("/{clientMembreId}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Supprimer le lien entre deux clients")
    public ResponseEntity<Void> supprimerMembre(
            @PathVariable Integer clientParentId,
            @PathVariable Integer clientMembreId) {
        lienService.supprimerMembre(clientParentId, clientMembreId);
        return ResponseEntity.noContent().build();
    }
}