package com.leoni.pap.controller;

import com.leoni.pap.dto.request.ValiderCertificatChefRequest;
import com.leoni.pap.dto.response.*;
import com.leoni.pap.entity.Utilisateur;
import com.leoni.pap.exception.BusinessException;
import com.leoni.pap.repository.UtilisateurRepository;
import com.leoni.pap.repository.*;
import com.leoni.pap.service.*;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import java.util.LinkedHashMap;
import java.util.stream.Collectors;

import java.util.ArrayList;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.Collections;
import java.util.List;
import java.util.Map;

import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.Map;
import com.leoni.pap.entity.QuestionTest;
import com.leoni.pap.entity.SessionTest;
import com.leoni.pap.entity.PassageCertification;

@RestController
@RequestMapping("/api/chef-service")
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "Chef de Service", description = "Fonctionnalités réservées au rôle CHEF_SERVICE")
@RequiredArgsConstructor
@PreAuthorize("hasRole('CHEF_SERVICE')")
public class ChefServiceController {

    private final ProfilService          profilService;
    private final PassageService         passageService;
    private final UtilisateurRepository  utilisateurRepo;
    private final SiteService            siteService;
    private final PlantService           plantService;      // ✅ Injecté
    private final PassageCertificationRepository passageRepo;
    private final CertificationService          certificationService;
    private final ReponseSessionRepository       reponseSessionRepo;
    private final ObjectMapper                   objectMapper;
    // Chemin corrigé sans "PFE"
    private static final String CERTIFICATS_DIR = "uploads/certifiact-auditeur/";

    // ── DASHBOARD ─────────────────────────────────────────────────────

    @GetMapping("/dashboard")
    public ResponseEntity<?> getDashboard(@AuthenticationPrincipal UserDetails userDetails) {
        ProfilResponse profil = profilService.getMonProfil(userDetails.getUsername());
        List<PassageResponse> certifEnAttente =
                passageService.getCertificatsEnAttenteChef(userDetails.getUsername());
        return ResponseEntity.ok(Map.of(
                "profil", profil,
                "message", "Bienvenue " + profil.getPrenom() + " !",
                "certifEnAttenteCount", certifEnAttente.size()
        ));
    }

    @GetMapping("/profil")
    public ResponseEntity<ProfilResponse> getProfil(@AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(profilService.getMonProfil(userDetails.getUsername()));
    }

    // ═════════════════════════════════════════════════════════
    // QUALIFICATIONS
    // ═════════════════════════════════════════════════════════

    @GetMapping("/qualifications")
    public ResponseEntity<List<PassageResponse>> getAllQualifications(@AuthenticationPrincipal UserDetails user) {
        return ResponseEntity.ok(passageService.getAllPassagesForChef());
    }

    @GetMapping("/qualifications/certifs-en-attente")
    public ResponseEntity<List<PassageResponse>> getCertificatsEnAttente(@AuthenticationPrincipal UserDetails user) {
        return ResponseEntity.ok(passageService.getCertificatsEnAttenteChef(user.getUsername()));
    }

    @GetMapping("/qualifications/certifs-historique")
    public ResponseEntity<List<PassageResponse>> getCertificatsHistorique(@AuthenticationPrincipal UserDetails user) {
        return ResponseEntity.ok(passageService.getCertificatsByChef(user.getUsername()));
    }

    @PostMapping("/qualifications/{passageId}/valider-certificat")
    public ResponseEntity<PassageResponse> validerCertificat(
            @PathVariable Long passageId,
            @RequestBody ValiderCertificatChefRequest req,
            @AuthenticationPrincipal UserDetails user) {
        return ResponseEntity.ok(passageService.validerCertificatParChef(passageId, req, user.getUsername()));
    }

    @GetMapping("/qualifications/{passageId}/certificat/download")
    public ResponseEntity<Resource> downloadCertificat(
            @PathVariable Long passageId,
            @AuthenticationPrincipal UserDetails user) {
        PassageResponse passage = passageService.getAllPassages().stream()
                .filter(p -> p.getId().equals(passageId))
                .findFirst()
                .orElseThrow(() -> new BusinessException("Passage introuvable."));

        String pdfNom = passage.getCertificatPdfPath();
        if (pdfNom == null || pdfNom.isBlank())
            throw new BusinessException("Aucun certificat généré.");

        Path filePath = null;
        for (String dir : new String[]{
                CERTIFICATS_DIR,
                "uploads/certificat-auditeur/",
                "uploads/certifiact-auditeur/" }) {
            Path p = Paths.get(dir + pdfNom);
            if (Files.exists(p)) { filePath = p; break; }
        }
        if (filePath == null)
            throw new BusinessException("Fichier PDF introuvable : " + pdfNom);

        try {
            Resource resource = new UrlResource(filePath.toUri());
            return ResponseEntity.ok()
                    .contentType(MediaType.APPLICATION_PDF)
                    .header(HttpHeaders.CONTENT_DISPOSITION,
                            "attachment; filename=\"" + pdfNom + "\"")
                    .body(resource);
        } catch (MalformedURLException e) {
            throw new BusinessException("Erreur accès fichier PDF.");
        }
    }

    @GetMapping("/qualifications/{passageId}/certificat/view")
    public ResponseEntity<Resource> viewCertificat(
            @PathVariable Long passageId,
            @AuthenticationPrincipal UserDetails user) {
        PassageResponse passage = passageService.getAllPassages().stream()
                .filter(p -> p.getId().equals(passageId))
                .findFirst()
                .orElseThrow(() -> new BusinessException("Passage introuvable."));

        String pdfNom = passage.getCertificatPdfPath();
        if (pdfNom == null || pdfNom.isBlank())
            throw new BusinessException("Aucun certificat.");

        Path filePath = null;
        for (String dir : new String[]{
                CERTIFICATS_DIR,
                "uploads/certificat-auditeur/",
                "uploads/certifiact-auditeur/" }) {
            Path p = Paths.get(dir + pdfNom);
            if (Files.exists(p)) { filePath = p; break; }
        }
        if (filePath == null)
            throw new BusinessException("Fichier PDF introuvable : " + pdfNom);

        try {
            Resource resource = new UrlResource(filePath.toUri());
            return ResponseEntity.ok()
                    .contentType(MediaType.APPLICATION_PDF)
                    .header(HttpHeaders.CONTENT_DISPOSITION,
                            "inline; filename=\"" + pdfNom + "\"")
                    .body(resource);
        } catch (MalformedURLException e) {
            throw new BusinessException("Erreur accès fichier.");
        }
    }
    // ═════════════════════════════════════════════════════════
    // SITES & PLANTS (pour les filtres)
    // ═════════════════════════════════════════════════════════

    @GetMapping("/sites")
    public ResponseEntity<List<SiteResponse>> getSites() {
        return ResponseEntity.ok(siteService.getAll());
    }

    @GetMapping("/plants/by-site/{siteId}")
    @Operation(summary = "Liste des plants d'un site")
    public ResponseEntity<List<PlantResponse>> getPlantsBySite(@PathVariable Integer siteId) {
        return ResponseEntity.ok(plantService.getPlantsBySiteId(siteId));
    }

    @GetMapping("/qualifications/{passageId}/reponses-theoriques")
    @Operation(summary = "Consulter les réponses théoriques d'un auditeur")
    public ResponseEntity<List<Map<String, Object>>> getReponsesTheoriques(
            @PathVariable Long passageId) {

        PassageCertification passage = passageRepo.findById(passageId)
                .orElseThrow(() -> new BusinessException("Passage introuvable."));

        SessionTest session = passage.getSessionTest();
        if (session == null)
            return ResponseEntity.ok(Collections.emptyList());

        List<Map<String, Object>> result = reponseSessionRepo
                .findBySessionIdOrderByNumeroQuestionAsc(session.getId())
                .stream()
                .map(r -> {
                    Map<String, Object> m = new LinkedHashMap<>();
                    QuestionTest q = r.getQuestion();

                    List<String> defauts = new ArrayList<>();
                    if (q.getDefautsDisponiblesJson() != null
                            && !q.getDefautsDisponiblesJson().isBlank()) {
                        try {
                            defauts = objectMapper.readValue(
                                    q.getDefautsDisponiblesJson(),
                                    new com.fasterxml.jackson.core.type.TypeReference<List<String>>() {});
                        } catch (Exception ignored) {}
                    }

                    m.put("questionId",            q.getId());
                    m.put("type",                  q.getType().name());
                    m.put("enonce",                q.getEnonce());
                    m.put("imageUrl",              q.getImageUrl());
                    m.put("typeReponseImage",      q.getTypeReponseImage());
                    m.put("defautsDisponibles",    defauts);
                    m.put("bonneReponseImage",     q.getBonneReponseImage());
                    m.put("options",               q.getOptions());
                    m.put("bonnesReponsesIndexes", q.getBonnesReponsesIndexes());
                    m.put("reponseTexte",          r.getReponseTexte());
                    m.put("reponseIndex",          r.getReponseIndex());
                    m.put("expiree",               r.getExpiree());
                    m.put("correcte",              r.getCorrecte());
                    m.put("points",                q.getPoints());
                    m.put("pointsObtenus",         r.getPointsObtenus());
                    m.put("ordre",                 q.getOrdre());
                    m.put("numeroQuestion",        r.getNumeroQuestion());
                    return m;
                })
                .collect(Collectors.toList());

        return ResponseEntity.ok(result);
    }
    @GetMapping("/certifications/{certifId}/classement-auditeurs")
    @Operation(summary = "Classement des auditeurs pour une certification (chef de service)")
    public ResponseEntity<List<ClassementAuditeurResponse>> getClassementAuditeurs(
            @PathVariable Long certifId) {
        try {
            return ResponseEntity.ok(certificationService.getClassementAuditeurs(certifId));
        } catch (Exception e) {
            return ResponseEntity.ok(List.of());
        }
    }

    // GET /api/chef-service/certifications/all
    @GetMapping("/certifications/all")
    @PreAuthorize("hasRole('CHEF_SERVICE')")
    public ResponseEntity<List<CertificationResponse>> getAllCertifications() {
        return ResponseEntity.ok(certificationService.getAllCertifications());
    }


}