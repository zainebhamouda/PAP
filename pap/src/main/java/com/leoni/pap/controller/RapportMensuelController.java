package com.leoni.pap.controller;

import com.leoni.pap.entity.RapportMensuel;
import com.leoni.pap.entity.Utilisateur;
import com.leoni.pap.repository.UtilisateurRepository;
import com.leoni.pap.service.RapportMensuelService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.Map;

/**
 * RapportMensuelController
 * ══════════════════════════════════════════════════════════════
 * Endpoints consommés par le bouton "Rapport Mensuel" de la sidebar
 * (Auditeur + Expert + Chef de service + Responsable qualité centrale).
 * Voir RapportMensuelService pour la logique métier.
 *
 * ✅ CORRIGÉ — Chaque acteur ne voit / ne génère / ne télécharge désormais
 * QUE les rapports de SON établissement (Utilisateur.plant). Un utilisateur
 * dont le compte n'est rattaché à aucun plant (rôle central, ex:
 * RESPONSABLE_QUALITE_CENTRALE ou ADMIN) continue de voir tous les plants —
 * c'est le comportement attendu pour ces rôles transverses.
 */
@RestController
@RequestMapping("/api/rapports-mensuels")
@RequiredArgsConstructor
@Slf4j
public class RapportMensuelController {

    private final RapportMensuelService rapportMensuelService;
    private final UtilisateurRepository userRepo;

    private Utilisateur getCurrentUser(UserDetails u) {
        return userRepo.findByMatricule(u.getUsername())
                .orElseThrow(() -> new RuntimeException("Utilisateur introuvable"));
    }

    /** Plant de l'utilisateur connecté, ou null s'il n'est rattaché à aucun plant (rôle central). */
    private Integer getPlantIdUtilisateur(UserDetails user) {
        if (user == null) return null;
        Utilisateur u = getCurrentUser(user);
        return u.getPlant() != null ? u.getPlant().getId() : null;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('AUDITEUR','EXPERT_PRODUCT_AUDIT','CHEF_SERVICE','RESPONSABLE_QUALITE_CENTRALE')")
    public ResponseEntity<List<Map<String, Object>>> lister(
            @RequestParam(required = false) Integer annee,
            @RequestParam(required = false) String recherche,
            @AuthenticationPrincipal UserDetails user) {
        Integer plantId = getPlantIdUtilisateur(user);
        return ResponseEntity.ok(rapportMensuelService.listerRapports(annee, recherche, plantId));
    }

    @GetMapping("/annees")
    @PreAuthorize("hasAnyRole('AUDITEUR','EXPERT_PRODUCT_AUDIT','CHEF_SERVICE','RESPONSABLE_QUALITE_CENTRALE')")
    public ResponseEntity<List<Integer>> anneesDisponibles(@AuthenticationPrincipal UserDetails user) {
        Integer plantId = getPlantIdUtilisateur(user);
        return ResponseEntity.ok(rapportMensuelService.listerAnneesDisponibles(plantId));
    }

    /**
     * Génération / régénération manuelle. ✅ CORRIGÉ — un utilisateur rattaché
     * à un plant ne peut générer QUE le rapport de son propre plant : le
     * plantId envoyé par le front est ignoré et remplacé par celui de
     * l'utilisateur connecté (sauf pour les rôles centraux sans plant).
     */
    @PostMapping("/generer")
    @PreAuthorize("hasAnyRole('AUDITEUR','EXPERT_PRODUCT_AUDIT')")
    public ResponseEntity<RapportMensuel> genererManuellement(
            @RequestParam Integer plantId,
            @RequestParam Integer annee,
            @RequestParam Integer mois,
            @AuthenticationPrincipal UserDetails user) {
        Utilisateur u = user != null ? getCurrentUser(user) : null;
        Integer plantIdUtilisateur = (u != null && u.getPlant() != null) ? u.getPlant().getId() : null;
        Integer plantIdEffectif = plantIdUtilisateur != null ? plantIdUtilisateur : plantId;
        Integer userId = u != null ? u.getId() : null;
        return ResponseEntity.ok(rapportMensuelService.genererRapportMensuel(plantIdEffectif, annee, mois, userId));
    }

    @GetMapping("/{id}/pdf")
    @PreAuthorize("hasAnyRole('AUDITEUR','EXPERT_PRODUCT_AUDIT','CHEF_SERVICE','RESPONSABLE_QUALITE_CENTRALE')")
    public ResponseEntity<byte[]> telechargerPdf(@PathVariable Long id,
                                                 @AuthenticationPrincipal UserDetails user) throws IOException {
        RapportMensuel rapport = rapportMensuelService.getRapport(id);
        rapportMensuelService.verifierAccesPlant(rapport, getPlantIdUtilisateur(user));
        return telecharger(rapport.getPdfUrl(), "application/pdf", "rapport-mensuel-" + id + ".pdf");
    }

    @GetMapping("/{id}/excel")
    @PreAuthorize("hasAnyRole('AUDITEUR','EXPERT_PRODUCT_AUDIT','CHEF_SERVICE','RESPONSABLE_QUALITE_CENTRALE')")
    public ResponseEntity<byte[]> telechargerExcel(@PathVariable Long id,
                                                   @AuthenticationPrincipal UserDetails user) throws IOException {
        RapportMensuel rapport = rapportMensuelService.getRapport(id);
        rapportMensuelService.verifierAccesPlant(rapport, getPlantIdUtilisateur(user));
        return telecharger(rapport.getExcelUrl(),
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                "rapport-mensuel-" + id + ".xlsx");
    }

    private ResponseEntity<byte[]> telecharger(String chemin, String contentType, String filename) throws IOException {
        if (chemin == null) return ResponseEntity.notFound().build();
        Path path = Path.of(chemin);
        if (!Files.exists(path)) return ResponseEntity.notFound().build();
        byte[] bytes = Files.readAllBytes(path);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_TYPE, contentType)
                .header(HttpHeaders.CONTENT_DISPOSITION, ContentDisposition.attachment().filename(filename).build().toString())
                .contentLength(bytes.length)
                .body(bytes);
    }
}