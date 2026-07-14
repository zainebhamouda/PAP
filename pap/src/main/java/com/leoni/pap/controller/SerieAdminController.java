package com.leoni.pap.controller;

import com.leoni.pap.dto.request.SerieRequest;
import com.leoni.pap.dto.response.SerieResponse;
import com.leoni.pap.service.SerieService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/series")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class SerieAdminController {

    private final SerieService serieService;

    @GetMapping
    public ResponseEntity<List<SerieResponse>> getAll() {
        return ResponseEntity.ok(serieService.getAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<SerieResponse> getById(@PathVariable Integer id) {
        return ResponseEntity.ok(serieService.getById(id));
    }

    @GetMapping("/par-projet/{projetId}")
    public ResponseEntity<List<SerieResponse>> getByProjet(@PathVariable Integer projetId) {
        return ResponseEntity.ok(serieService.getByProjet(projetId));
    }

    @PostMapping
    public ResponseEntity<SerieResponse> creer(@RequestBody SerieRequest req) {
        return ResponseEntity.ok(serieService.creer(req));
    }

    @PutMapping("/{id}")
    public ResponseEntity<SerieResponse> modifier(@PathVariable Integer id,
                                                  @RequestBody SerieRequest req) {
        return ResponseEntity.ok(serieService.modifier(id, req));
    }

    @PutMapping("/{id}/toggle")
    public ResponseEntity<SerieResponse> toggle(@PathVariable Integer id) {
        return ResponseEntity.ok(serieService.toggleActif(id));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> supprimer(@PathVariable Integer id) {
        serieService.supprimer(id);
        return ResponseEntity.noContent().build();
    }
}