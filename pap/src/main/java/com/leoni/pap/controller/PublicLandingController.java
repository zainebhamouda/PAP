package com.leoni.pap.controller;

import com.leoni.pap.entity.RoleUser;
import com.leoni.pap.entity.enums.StatutPassage;
import com.leoni.pap.repository.PassageCertificationRepository;
import com.leoni.pap.repository.PlantRepository;
import com.leoni.pap.repository.SiteRepository;
import com.leoni.pap.repository.UtilisateurRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/public")
@RequiredArgsConstructor
@Tag(name = "Landing public", description = "Compteurs publics affichés sur la page d'accueil")
public class PublicLandingController {

    private final SiteRepository siteRepo;
    private final PlantRepository plantRepo;
    private final UtilisateurRepository utilisateurRepo;
    private final PassageCertificationRepository passageRepo;

    @GetMapping("/landing-stats")
    @Operation(summary = "Récupérer les compteurs publics du hero d'accueil")
    public ResponseEntity<Map<String, Object>> getLandingStats() {
        long totalSites = siteRepo.count();
        long totalPlants = plantRepo.count();

        long totalAuditeurs = utilisateurRepo.findByRole(RoleUser.AUDITEUR).size();
        List<StatutPassage> statutsCertifies = List.of(StatutPassage.CERTIFIE, StatutPassage.CERTIFIE);
        long auditeursCertifies = passageRepo.findAll().stream()
                .filter(p -> p.getStatut() != null && statutsCertifies.contains(p.getStatut()))
                .count();

        long totalPassages = passageRepo.count();
        int tauxConformite = totalPassages > 0
                ? (int) Math.round((auditeursCertifies * 100.0) / totalPassages)
                : 0;

        Map<String, Object> data = new LinkedHashMap<>();
        data.put("totalSites", totalSites);
        data.put("totalPlants", totalPlants);
        data.put("auditeursCertifies", auditeursCertifies);
        data.put("totalAuditeurs", totalAuditeurs);
        data.put("tauxConformite", tauxConformite);
        return ResponseEntity.ok(data);
    }
}