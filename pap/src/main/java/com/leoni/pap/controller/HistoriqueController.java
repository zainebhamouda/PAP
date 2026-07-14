package com.leoni.pap.controller;

import com.leoni.pap.dto.response.HistoriqueResponse;
import com.leoni.pap.dto.response.PlantResponse;
import com.leoni.pap.entity.Historique;
import com.leoni.pap.entity.Plant;
import com.leoni.pap.entity.RoleUser;
import com.leoni.pap.entity.Utilisateur;
import com.leoni.pap.entity.enums.TypeHistorique;
import com.leoni.pap.exception.BusinessException;
import com.leoni.pap.repository.HistoriqueRepository;
import com.leoni.pap.repository.PlantRepository;
import com.leoni.pap.repository.UtilisateurRepository;
import com.leoni.pap.service.HistoriqueService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/historique")
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "Historique", description = "Journal d'activité — tous rôles")
@RequiredArgsConstructor
@PreAuthorize("isAuthenticated()")
public class HistoriqueController {

    private final HistoriqueService     historiqueService;
    private final HistoriqueRepository  historiqueRepo;
    private final UtilisateurRepository utilisateurRepo;
    private final PlantRepository       plantRepo;  // ← AJOUTER CETTE LIGNE

    // ── GET /api/historique ───────────────────────────────────
    @GetMapping
    @Operation(summary = "Mon historique complet (filtrable par type)")
    public ResponseEntity<List<HistoriqueResponse>> getHistorique(
            @AuthenticationPrincipal UserDetails ud,
            @RequestParam(required = false) String type) {

        Utilisateur u = getUser(ud.getUsername());

        List<Historique> list;
        if (type != null && !type.isBlank()) {
            try {
                TypeHistorique t = TypeHistorique.valueOf(type.toUpperCase());
                list = historiqueRepo.findByUtilisateurAndTypeOrderByDateActionDesc(u, t);
            } catch (IllegalArgumentException e) {
                list = historiqueRepo.findByUtilisateurOrderByDateActionDesc(u);
            }
        } else {
            list = historiqueRepo.findByUtilisateurOrderByDateActionDesc(u);
        }

        return ResponseEntity.ok(list.stream().map(this::toResponse).collect(Collectors.toList()));
    }

    // ── GET /api/historique/plant ──────────────────────────────
    @GetMapping("/plant")
    @PreAuthorize("hasAnyRole('AUDITEUR','CHEF_SERVICE','EXPERT_PRODUCT_AUDIT','RESPONSABLE_QUALITE_CENTRALE','ADMIN')")
    @Operation(summary = "Historique de tous les acteurs de mon plant")
    public ResponseEntity<List<HistoriqueResponse>> getHistoriquePlant(
            @AuthenticationPrincipal UserDetails ud,
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String role) {

        Utilisateur u = getUser(ud.getUsername());
        Plant plant = u.getPlant();
        if (plant == null) {
            throw new BusinessException("Aucun plant rattaché à votre compte.");
        }

        TypeHistorique typeFiltre = null;
        if (type != null && !type.isBlank()) {
            try {
                typeFiltre = TypeHistorique.valueOf(type.toUpperCase());
            } catch (IllegalArgumentException ignored) {
            }
        }

        RoleUser roleFiltre = null;
        if (role != null && !role.isBlank()) {
            try {
                roleFiltre = RoleUser.valueOf(role.toUpperCase());
            } catch (IllegalArgumentException ignored) {
            }
        }

        List<Historique> list = historiqueService.getHistoriquePlant(plant, typeFiltre, roleFiltre);
        return ResponseEntity.ok(list.stream().map(this::toResponse).collect(Collectors.toList()));
    }

    // ── DELETE /api/historique/{id} ───────────────────────────
    @DeleteMapping("/{id}")
    @Operation(summary = "Supprimer une entrée d'historique")
    public ResponseEntity<String> supprimer(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails ud) {

        Utilisateur u = getUser(ud.getUsername());
        Historique h = historiqueRepo.findById(id)
                .orElseThrow(() -> new BusinessException("Entrée introuvable."));

        if (!h.getUtilisateur().getId().equals(u.getId())) {
            throw new BusinessException("Accès refusé.");
        }
        historiqueRepo.deleteById(id);
        return ResponseEntity.ok("Supprimé.");
    }

    // ── DELETE /api/historique ────────────────────────────────
    @DeleteMapping
    @Operation(summary = "Effacer tout mon historique")
    public ResponseEntity<String> supprimerTout(
            @AuthenticationPrincipal UserDetails ud) {

        Utilisateur u = getUser(ud.getUsername());
        List<Historique> list = historiqueRepo.findByUtilisateurOrderByDateActionDesc(u);
        historiqueRepo.deleteAll(list);
        return ResponseEntity.ok("Historique effacé.");
    }

    // ── GET /api/historique/all ────────────────────────────────
    @GetMapping("/all")
    @PreAuthorize("hasAnyRole('ADMIN', 'RESPONSABLE_QUALITE_CENTRALE')")
    @Operation(summary = "Tous les historiques (admin et responsable qualité)")
    public ResponseEntity<List<HistoriqueResponse>> getAllHistorique(
            @AuthenticationPrincipal UserDetails ud,
            @RequestParam(required = false) String plantId) {

        Utilisateur u = getUser(ud.getUsername());
        List<Historique> list;

        if (u.getRole() == RoleUser.RESPONSABLE_QUALITE_CENTRALE) {
            if (plantId != null && !plantId.isBlank()) {
                try {
                    Integer plantIdInt = Integer.parseInt(plantId);
                    list = historiqueRepo.findByPlantIdOrderByDateActionDesc(plantIdInt);
                } catch (NumberFormatException e) {
                    list = historiqueRepo.findAllByOrderByDateActionDesc();
                }
            } else {
                list = historiqueRepo.findAllByOrderByDateActionDesc();
            }
        } else if (u.getRole() == RoleUser.ADMIN) {
            list = historiqueRepo.findAllByOrderByDateActionDesc();
        } else {
            throw new BusinessException("Vous n'avez pas les droits pour accéder à cet historique.");
        }

        return ResponseEntity.ok(list.stream().map(this::toResponse).collect(Collectors.toList()));
    }

    // ── GET /api/historique/plants ──────────────────────────────
    @GetMapping("/plants")
    @PreAuthorize("hasAnyRole('ADMIN', 'RESPONSABLE_QUALITE_CENTRALE')")
    @Operation(summary = "Liste des plants pour filtrer l'historique")
    public ResponseEntity<List<PlantResponse>> getPlants() {
        List<Plant> plants = plantRepo.findAllByOrderByNomAsc();
        return ResponseEntity.ok(
                plants.stream()
                        .map(PlantResponse::from)
                        .collect(Collectors.toList())
        );
    }

    // ── HELPERS ───────────────────────────────────────────────
    private Utilisateur getUser(String matricule) {
        return utilisateurRepo.findByMatricule(matricule)
                .orElseThrow(() -> new BusinessException("Utilisateur introuvable."));
    }

    private HistoriqueResponse toResponse(Historique h) {
        HistoriqueResponse r = new HistoriqueResponse();
        r.setId(h.getId());
        r.setType(h.getType() != null ? h.getType().name() : null);
        r.setDetails(h.getDetails());
        r.setScoreSnapshot(h.getScoreSnapshot());
        r.setDateAction(h.getDateAction());

        if (h.getUtilisateur() != null) {
            Utilisateur acteur = h.getUtilisateur();
            r.setActeurId(acteur.getId());
            r.setActeurMatricule(acteur.getMatricule());
            r.setActeurNomPrenom(
                    (acteur.getPrenom() != null ? acteur.getPrenom() : "") + " " +
                            (acteur.getNom() != null ? acteur.getNom() : ""));
            r.setActeurRole(acteur.getRole() != null ? acteur.getRole().name() : null);
        }

        if (h.getPlant() != null) {
            r.setPlantId(h.getPlant().getId());
            r.setPlantNom(h.getPlant().getNom());
            r.setPlantCode(h.getPlant().getCode());
        }

        if (h.getAudit() != null) {
            r.setAuditId(h.getAudit().getId());
            r.setAuditReference(h.getAudit().getReference());
        }

        if (h.getCertification() != null) {
            r.setCertificationNom(h.getCertification().getTitre());
        }

        if (h.getCible() != null) {
            r.setCibleMatricule(h.getCible().getMatricule());
            r.setCibleNomPrenom(h.getCible().getPrenom() + " " + h.getCible().getNom());
        }

        return r;
    }
}