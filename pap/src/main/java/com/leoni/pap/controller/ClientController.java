package com.leoni.pap.controller;

import com.leoni.pap.dto.request.ClientRequest;
import com.leoni.pap.dto.response.ClientResponse;
import com.leoni.pap.service.ClientService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/clients")
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "Clients", description = "Gestion des clients constructeurs automobiles")
@RequiredArgsConstructor
public class ClientController {

    private final ClientService clientService;

    @GetMapping
    @Operation(summary = "Tous les clients et marques")
    public ResponseEntity<List<ClientResponse>> getAll() {
        return ResponseEntity.ok(clientService.getAll());
    }

    @GetMapping("/actifs")
    @Operation(summary = "Clients + marques actifs")
    public ResponseEntity<List<ClientResponse>> getActifs() {
        return ResponseEntity.ok(clientService.getActifs());
    }

    /**
     * ── NOUVEAU ──
     * Groupes/clients actifs uniquement (estGroupe = true).
     * Utilisé par : CreerCertification, ExpertCertifications, PlanificationPage,
     *               et tout autre select "Client" dans l'application.
     */
    @GetMapping("/groupes")
    @Operation(summary = "Groupes clients actifs uniquement (pour les selects)")
    public ResponseEntity<List<ClientResponse>> getGroupes() {
        return ResponseEntity.ok(clientService.getGroupesActifs());
    }

    /**
     * ── NOUVEAU ──
     * Marques uniquement (estGroupe = false).
     * Utilisé par le panel "Marques liées" dans AdminClients.
     */
    @GetMapping("/marques")
    @Operation(summary = "Marques uniquement (pour le panel d'association)")
    public ResponseEntity<List<ClientResponse>> getMarques() {
        return ResponseEntity.ok(clientService.getMarques());
    }

    @GetMapping("/{id}")
    @Operation(summary = "Détail d'un client")
    public ResponseEntity<ClientResponse> getById(@PathVariable Integer id) {
        return ResponseEntity.ok(clientService.getById(id));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Créer un nouveau client ou marque")
    public ResponseEntity<ClientResponse> creer(@RequestBody ClientRequest req) {
        return ResponseEntity.ok(clientService.creer(req));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Modifier un client")
    public ResponseEntity<ClientResponse> modifier(
            @PathVariable Integer id,
            @RequestBody ClientRequest req) {
        return ResponseEntity.ok(clientService.modifier(id, req));
    }

    @PatchMapping("/{id}/toggle")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Activer / Désactiver")
    public ResponseEntity<ClientResponse> toggleActif(@PathVariable Integer id) {
        return ResponseEntity.ok(clientService.toggleActif(id));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Supprimer un client")
    public ResponseEntity<Void> supprimer(@PathVariable Integer id) {
        clientService.supprimer(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/initialiser")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Initialiser les clients/marques Leoni par défaut")
    public ResponseEntity<String> initialiser() {
        clientService.initialiserClientsLeoni();
        return ResponseEntity.ok("Clients et marques Leoni initialisés avec succès.");
    }
}