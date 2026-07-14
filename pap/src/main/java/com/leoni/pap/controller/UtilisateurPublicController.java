package com.leoni.pap.controller;

import com.leoni.pap.dto.response.UtilisateurResponse;
import com.leoni.pap.service.UtilisateurService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/utilisateurs")
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "Utilisateurs", description = "Endpoints accessibles aux roles metiers")
@RequiredArgsConstructor
public class UtilisateurPublicController {

    private final UtilisateurService utilisateurService;

    @GetMapping("/auditeurs")
    @PreAuthorize("hasAnyRole('ADMIN','EXPERT_PRODUCT_AUDIT','CHEF_SERVICE','RESPONSABLE_QUALITE_CENTRALE')")
    @Operation(summary = "Lister les auditeurs actifs")
    public ResponseEntity<List<UtilisateurResponse>> getAuditeursActifs() {
        return ResponseEntity.ok(utilisateurService.getAuditeursActifs());
    }
}
