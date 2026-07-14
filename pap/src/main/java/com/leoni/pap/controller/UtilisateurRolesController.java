package com.leoni.pap.controller;

import com.leoni.pap.dto.response.UtilisateurResponse;
import com.leoni.pap.entity.RoleUser;
import com.leoni.pap.repository.UtilisateurRepository;
import com.leoni.pap.service.UtilisateurService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/utilisateurs/roles")
@SecurityRequirement(name = "bearerAuth")
@RequiredArgsConstructor
public class UtilisateurRolesController {

    private final UtilisateurRepository userRepo;
    private final UtilisateurService utilisateurService;

    @GetMapping("/chefs-service")
    @PreAuthorize("hasAnyRole('AUDITEUR','EXPERT_PRODUCT_AUDIT','RESPONSABLE_QUALITE_CENTRALE','CHEF_SERVICE','ADMIN')")
    @Operation(summary = "Lister les chefs de service actifs")
    public ResponseEntity<List<UtilisateurResponse>> getChefsService() {
        return ResponseEntity.ok(userRepo.findByRoleAndActifTrue(RoleUser.CHEF_SERVICE)
                .stream().map(utilisateurService::toResponse).collect(Collectors.toList()));
    }

    @GetMapping("/experts-audit")
    @PreAuthorize("hasAnyRole('AUDITEUR','EXPERT_PRODUCT_AUDIT','RESPONSABLE_QUALITE_CENTRALE','CHEF_SERVICE','ADMIN')")
    @Operation(summary = "Lister les experts product audit actifs")
    public ResponseEntity<List<UtilisateurResponse>> getExpertsAudit() {
        return ResponseEntity.ok(userRepo.findByRoleAndActifTrue(RoleUser.EXPERT_PRODUCT_AUDIT)
                .stream().map(utilisateurService::toResponse).collect(Collectors.toList()));
    }

    @GetMapping("/responsables-qualite")
    @PreAuthorize("hasAnyRole('AUDITEUR','EXPERT_PRODUCT_AUDIT','RESPONSABLE_QUALITE_CENTRALE','CHEF_SERVICE','ADMIN')")
    @Operation(summary = "Lister les responsables qualite centrale actifs")
    public ResponseEntity<List<UtilisateurResponse>> getResponsablesQualite() {
        return ResponseEntity.ok(userRepo.findByRoleAndActifTrue(RoleUser.RESPONSABLE_QUALITE_CENTRALE)
                .stream().map(utilisateurService::toResponse).collect(Collectors.toList()));
    }
}
