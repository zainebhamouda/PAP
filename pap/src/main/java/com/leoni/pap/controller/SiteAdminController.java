package com.leoni.pap.controller;

import com.leoni.pap.dto.request.SiteRequest;
import com.leoni.pap.dto.response.SiteResponse;
import com.leoni.pap.service.SiteService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/admin/sites")
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "Admin - Sites")
public class SiteAdminController {

    private final SiteService siteService;

    public SiteAdminController(SiteService siteService) { this.siteService = siteService; }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<SiteResponse>> getAll() {
        return ResponseEntity.ok(siteService.getAll());
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<SiteResponse> getById(@PathVariable Integer id) {
        return ResponseEntity.ok(siteService.getById(id));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(description = "{ \"nom\": \"Site Tunis\" }")
    public ResponseEntity<SiteResponse> creer(@RequestBody SiteRequest req) {
        return ResponseEntity.ok(siteService.creer(req));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<SiteResponse> modifier(@PathVariable Integer id, @RequestBody SiteRequest req) {
        return ResponseEntity.ok(siteService.modifier(id, req));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<String> supprimer(@PathVariable Integer id) {
        siteService.supprimer(id);
        return ResponseEntity.ok("Site supprimé.");
    }


}