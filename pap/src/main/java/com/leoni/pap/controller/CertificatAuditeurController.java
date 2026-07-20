package com.leoni.pap.controller;

import com.leoni.pap.dto.response.CertificatAuditeurResponse;
import com.leoni.pap.dto.response.UtilisateurResponse;
import com.leoni.pap.entity.Utilisateur;
import com.leoni.pap.exception.BusinessException;
import com.leoni.pap.repository.UtilisateurRepository;
import com.leoni.pap.service.CertificatAuditeurService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.List;

/**
 * ✅ NOUVEAU — Import par l'expert de plant des certificats déjà obtenus par
 * des auditeurs déjà certifiés (entreprise en production). Concerne tous
 * les experts SAUF l'expert VW, qui garde son propre circuit de certificat
 * dédié ({@code CertificatVWController}).
 */
@RestController
@RequestMapping("/api/certificats-auditeur")
@RequiredArgsConstructor
public class CertificatAuditeurController {

    private final CertificatAuditeurService certifAuditeurService;
    private final UtilisateurRepository     utilisateurRepository;

    private Integer getCurrentUserId(UserDetails user) {
        Utilisateur u = utilisateurRepository.findByMatricule(user.getUsername())
                .orElseThrow(() -> new BusinessException("Utilisateur introuvable."));
        return u.getId();
    }

    /**
     * POST /api/certificats-auditeur/importer
     * Formulaire : auditeurId, dateObtention (le plant est déduit du plant
     * de l'expert connecté), fichier PDF du certificat.
     */
    @PostMapping(value = "/importer", consumes = "multipart/form-data")
    @PreAuthorize("hasRole('EXPERT_PRODUCT_AUDIT')")
    public ResponseEntity<CertificatAuditeurResponse> importer(
            @RequestParam Integer auditeurId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime dateObtention,
            @RequestParam(value = "fichier", required = false) MultipartFile fichier,
            @AuthenticationPrincipal UserDetails user) {

        return ResponseEntity.ok(certifAuditeurService.importer(
                getCurrentUserId(user), auditeurId, dateObtention, fichier));
    }

    /** GET /api/certificats-auditeur/mon-plant — tout ce que l'expert a importé pour son plant */
    @GetMapping("/mon-plant")
    @PreAuthorize("hasAnyRole('EXPERT_PRODUCT_AUDIT','CHEF_SERVICE')")
    public ResponseEntity<List<CertificatAuditeurResponse>> getCertificatsDeMonPlant(
            @AuthenticationPrincipal UserDetails user) {
        return ResponseEntity.ok(certifAuditeurService.getCertificatsDeMonPlant(getCurrentUserId(user)));
    }

    /** GET /api/certificats-auditeur/auditeurs-plant — pour peupler le formulaire d'import */
    @GetMapping("/auditeurs-plant")
    @PreAuthorize("hasRole('EXPERT_PRODUCT_AUDIT')")
    public ResponseEntity<List<UtilisateurResponse>> getAuditeursDeMonPlant(
            @AuthenticationPrincipal UserDetails user) {
        return ResponseEntity.ok(certifAuditeurService.getAuditeursDeMonPlant(getCurrentUserId(user)));
    }

    /**
     * GET /api/certificats-auditeur/auditeurs-certifies/{plantId}
     * ✅ Consommé par la page de planification pour enrichir la liste des
     * auditeurs "qualifiés" avec ceux ayant un certificat importé valide.
     */
    @GetMapping("/auditeurs-certifies/{plantId}")
    @PreAuthorize("hasAnyRole('EXPERT_PRODUCT_AUDIT','RESPONSABLE_QUALITE_CENTRALE','ADMIN')")
    public ResponseEntity<List<UtilisateurResponse>> getAuditeursCertifiesParPlant(
            @PathVariable Integer plantId) {
        return ResponseEntity.ok(certifAuditeurService.getAuditeursCertifiesParPlant(plantId));
    }

    /** GET /api/certificats-auditeur/mes-certificats — vue auditeur sur ses propres certificats importés */
    @GetMapping("/mes-certificats")
    @PreAuthorize("hasRole('AUDITEUR')")
    public ResponseEntity<List<CertificatAuditeurResponse>> getMesCertificats(
            @AuthenticationPrincipal UserDetails user) {
        return ResponseEntity.ok(certifAuditeurService.getMesCertificats(getCurrentUserId(user)));
    }

    /** PUT /api/certificats-auditeur/{id}/annuler — annuler un import fait par erreur */
    @PutMapping("/{id}/annuler")
    @PreAuthorize("hasRole('EXPERT_PRODUCT_AUDIT')")
    public ResponseEntity<Void> annuler(@PathVariable Long id, @AuthenticationPrincipal UserDetails user) {
        certifAuditeurService.annuler(id, getCurrentUserId(user));
        return ResponseEntity.noContent().build();
    }

}