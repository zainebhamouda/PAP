package com.leoni.pap.controller;

import com.leoni.pap.entity.PlanAction;
import com.leoni.pap.repository.UtilisateurRepository;
import com.leoni.pap.service.PlanActionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/pdca")
@SecurityRequirement(name = "bearerAuth")
@RequiredArgsConstructor
public class PlanActionController {

    private final PlanActionService planActionService;
    private final UtilisateurRepository userRepo;

    private Integer getCurrentUserId(UserDetails u) {
        return userRepo.findByMatricule(u.getUsername())
                .orElseThrow(() -> new RuntimeException("Utilisateur introuvable"))
                .getId();
    }

    @GetMapping("/audit/{auditId}")
    @PreAuthorize("hasAnyRole('AUDITEUR','RESPONSABLE_QUALITE_CENTRALE','EXPERT_PRODUCT_AUDIT','CHEF_SERVICE')")
    @Operation(summary = "Lister les PDCA d'un audit")
    public ResponseEntity<List<PlanAction>> getByAudit(@PathVariable Long auditId) {
        return ResponseEntity.ok(planActionService.getByAudit(auditId));
    }

    @PostMapping("/{pdcaId}/valider")
    @PreAuthorize("hasRole('RESPONSABLE_QUALITE_CENTRALE')")
    @Operation(summary = "Valider un PDCA par le responsable qualite centrale")
    public ResponseEntity<Map<String, Object>> valider(
            @PathVariable Long pdcaId,
            @AuthenticationPrincipal UserDetails user) {
        return ResponseEntity.ok(planActionService.validerPdca(pdcaId, getCurrentUserId(user)));
    }
    @GetMapping("/mes-pdcas/en-attente")
    @PreAuthorize("hasRole('RESPONSABLE_QUALITE_CENTRALE')")
    public ResponseEntity<List<Map<String, Object>>> getMesPdcasEnAttente(@AuthenticationPrincipal UserDetails user) {
        return ResponseEntity.ok(planActionService.getMesPdcasEnAttente(getCurrentUserId(user)));
    }

    @GetMapping("/mes-pdcas/valides")
    @PreAuthorize("hasRole('RESPONSABLE_QUALITE_CENTRALE')")
    public ResponseEntity<List<Map<String, Object>>> getMesPdcasValides(@AuthenticationPrincipal UserDetails user) {
        return ResponseEntity.ok(planActionService.getMesPdcasValides(getCurrentUserId(user)));
    }
}
