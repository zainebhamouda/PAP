package com.leoni.pap.controller;

import com.leoni.pap.dto.request.ChangerRoleRequest;
import com.leoni.pap.dto.request.UpdateUtilisateurRequest;
import com.leoni.pap.dto.request.CreerUtilisateurRequest;
import com.leoni.pap.dto.response.UtilisateurResponse;
import com.leoni.pap.service.UtilisateurService;
import com.leoni.pap.repository.*;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.*;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;
import java.util.OptionalDouble;

import com.leoni.pap.entity.*;
import com.leoni.pap.entity.enums.*;

@RestController
@RequestMapping("/api/admin/utilisateurs")
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "Admin - Utilisateurs", description = "Gestion complète des profils utilisateurs")
public class UtilisateurController {

    private final UtilisateurService              service;
    private final UtilisateurRepository           userRepo;
    private final AuditProduitRepository          auditRepo;
    private final PassageCertificationRepository  passageRepo;

    public UtilisateurController(
            UtilisateurService             service,
            UtilisateurRepository          userRepo,
            AuditProduitRepository         auditRepo,
            PassageCertificationRepository passageRepo) {
        this.service      = service;
        this.userRepo     = userRepo;
        this.auditRepo    = auditRepo;
        this.passageRepo  = passageRepo;
    }

    // ── endpoints existants (inchangés) ──────────────────────────

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Lister tous les utilisateurs")
    public ResponseEntity<List<UtilisateurResponse>> getAll() {
        return ResponseEntity.ok(service.getAll());
    }

    @GetMapping("/recherche")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Rechercher des utilisateurs")
    public ResponseEntity<List<UtilisateurResponse>> rechercher(@RequestParam String q) {
        return ResponseEntity.ok(service.rechercher(q));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Voir le profil d'un utilisateur")
    public ResponseEntity<UtilisateurResponse> getById(@PathVariable Integer id) {
        return ResponseEntity.ok(service.getById(id));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Modifier le profil d'un utilisateur")
    public ResponseEntity<UtilisateurResponse> modifier(
            @PathVariable Integer id,
            @RequestBody UpdateUtilisateurRequest req) {
        return ResponseEntity.ok(service.modifier(id, req));
    }

    @PutMapping("/{id}/role")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Changer le rôle d'un utilisateur")
    public ResponseEntity<UtilisateurResponse> changerRole(
            @PathVariable Integer id,
            @RequestBody ChangerRoleRequest req) {
        return ResponseEntity.ok(service.changerRole(id, req.getRole()));
    }

    @PutMapping("/{id}/toggle-actif")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Activer / Désactiver un compte")
    public ResponseEntity<String> toggleActif(@PathVariable Integer id) {
        return ResponseEntity.ok(service.toggleActif(id));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Supprimer un utilisateur")
    public ResponseEntity<String> supprimer(@PathVariable Integer id) {
        service.supprimer(id);
        return ResponseEntity.ok("Utilisateur supprimé avec succès.");
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Créer un utilisateur")
    public ResponseEntity<UtilisateurResponse> creer(@RequestBody CreerUtilisateurRequest req) {
        return ResponseEntity.ok(service.creer(req));
    }

    @PutMapping("/{id}/toggle-certif")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Activer/désactiver le droit de créer des certifications")
    public ResponseEntity<UtilisateurResponse> toggleCertif(@PathVariable Integer id) {
        return ResponseEntity.ok(service.togglePeutCreerCertif(id));
    }

    // ════════════════════════════════════════════════════════════════
    // ENDPOINT CLASSEMENT IA — /auditeurs?withStats=true
    //
    // Retourne TOUS les champs nécessaires au moteur IA (AuditeurRankingIA.jsx)
    // Pondération : Qualité 40% · Activité 30% · Certification 30%
    // ════════════════════════════════════════════════════════════════
    @GetMapping("/auditeurs")
    @PreAuthorize("hasAnyRole('EXPERT_PRODUCT_AUDIT','ADMIN','RESPONSABLE_QUALITE_CENTRALE','CHEF_SERVICE')")
    @Operation(summary = "Lister les auditeurs avec stats IA complètes")
    public ResponseEntity<List<Map<String, Object>>> getAuditeurs(
            @RequestParam(value = "withStats", defaultValue = "false") boolean withStats) {

        List<Utilisateur> auditeurs = userRepo.findByRoleAndActifTrue(RoleUser.AUDITEUR);

        List<Map<String, Object>> result = auditeurs.stream().map(a -> {
            Map<String, Object> m = new LinkedHashMap<>();

            // ── Identité ─────────────────────────────────────────
            m.put("id",      a.getId());
            m.put("prenom",  a.getPrenom());
            m.put("nom",     a.getNom());
            m.put("email",   a.getEmail());
            m.put("matricule", a.getMatricule());

            if (a.getPlant() != null) {
                m.put("plantId",  a.getPlant().getId());
                m.put("plantNom", a.getPlant().getNom());
            } else {
                m.put("plantId",  null);
                m.put("plantNom", "—");
            }

            // Utilisateur n'a pas de segment — on met null
            m.put("segmentId",  null);
            m.put("segmentNom", "—");

            m.put("certifications", List.of());

            if (!withStats) return m;

            // ════════════════════════════════════════════════════
            // BLOC STATS — alimentent le moteur IA côté frontend
            // ════════════════════════════════════════════════════

            // ── 1. Tous les audits PRODUIT de l'auditeur (toutes périodes) ──
            List<AuditProduit> tousAudits =
                    auditRepo.findByAuditeurIdAndTypeAuditOrderByDatePrevueDesc(
                            a.getId(), TypeAudit.AUDIT_PRODUIT);

            long nbTotal   = tousAudits.size();
            long nbTermine = tousAudits.stream()
                    .filter(ap -> StatutAudit.TERMINE.equals(ap.getStatut())).count();
            long nbRetard  = tousAudits.stream()
                    .filter(ap -> StatutAudit.EN_RETARD.equals(ap.getStatut())).count();
            long nbEnCours = tousAudits.stream()
                    .filter(ap -> StatutAudit.EN_COURS.equals(ap.getStatut())).count();
            long nbPlanifie = tousAudits.stream()
                    .filter(ap -> StatutAudit.PLANIFIE.equals(ap.getStatut())).count();

            double tauxRetardPct = nbTotal > 0
                    ? Math.round(nbRetard * 100.0 / nbTotal * 10) / 10.0
                    : 0.0;

            // Délai moyen de clôture (jours) — positif = en retard, négatif = en avance
            double delaiMoyenJours = tousAudits.stream()
                    .filter(ap -> StatutAudit.TERMINE.equals(ap.getStatut())
                            && ap.getDateRealisation() != null
                            && ap.getDatePrevue() != null)
                    .mapToLong(ap -> ChronoUnit.DAYS.between(
                            ap.getDatePrevue(), ap.getDateRealisation()))
                    .average()
                    .orElse(0.0);

            // ── 2. Métriques qualité (tous audits terminés) ──────
            double qkMoyenGlobal = tousAudits.stream()
                    .filter(ap -> StatutAudit.TERMINE.equals(ap.getStatut())
                            && ap.getValeurQK() != null)
                    .mapToDouble(ap -> ap.getValeurQK().doubleValue())
                    .average()
                    .orElse(0.0);

            long nbQkVert = tousAudits.stream()
                    .filter(ap -> StatutAudit.TERMINE.equals(ap.getStatut())
                            && CouleurQK.VERT.equals(ap.getCouleurQK()))
                    .count();

            long nbQkCritique = tousAudits.stream()
                    .filter(ap -> StatutAudit.TERMINE.equals(ap.getStatut())
                            && (CouleurQK.ROUGE.equals(ap.getCouleurQK())
                            || CouleurQK.ROSE.equals(ap.getCouleurQK())))
                    .count();

            long nbPdcaDeclenches = tousAudits.stream()
                    .filter(ap -> Boolean.TRUE.equals(ap.getPdcaDeclenche()))
                    .count();

            // Taux de conformité (audits avec QK ≤ 1.0 / total terminés)
            long nbConformes = tousAudits.stream()
                    .filter(ap -> StatutAudit.TERMINE.equals(ap.getStatut())
                            && ap.getValeurQK() != null
                            && ap.getValeurQK().doubleValue() <= 1.0)
                    .count();
            double tauxConformite = nbTermine > 0
                    ? Math.round(nbConformes * 100.0 / nbTermine)
                    : 100.0;

            // ── 3. Stats du mois courant (compatibilité ancienne UI) ──
            YearMonth moisCourant = YearMonth.now();
            LocalDate debutMois   = moisCourant.atDay(1);
            LocalDate finMois     = moisCourant.atEndOfMonth();

            List<AuditProduit> auditsMois =
                    auditRepo.findByAuditeurIdAndDatePrevueBetween(a.getId(), debutMois, finMois)
                            .stream()
                            .filter(ap -> TypeAudit.AUDIT_PRODUIT.equals(ap.getTypeAudit()))
                            .collect(Collectors.toList());

            int    nbAuditsMois = auditsMois.size();
            double qkMoyen      = auditsMois.stream()
                    .filter(ap -> ap.getValeurQK() != null)
                    .mapToDouble(ap -> ap.getValeurQK().doubleValue())
                    .average().orElse(0.0);

            // ── 4. Historique QK sur 6 mois (sparkline) ─────────
            List<Double> historiqueQK = new ArrayList<>();
            for (int i = 5; i >= 0; i--) {
                YearMonth mois = moisCourant.minusMonths(i);
                OptionalDouble qkMois = auditRepo
                        .findByAuditeurIdAndDatePrevueBetween(
                                a.getId(), mois.atDay(1), mois.atEndOfMonth())
                        .stream()
                        .filter(ap -> TypeAudit.AUDIT_PRODUIT.equals(ap.getTypeAudit()))
                        .filter(ap -> ap.getValeurQK() != null)
                        .mapToDouble(ap -> ap.getValeurQK().doubleValue())
                        .average();
                historiqueQK.add(qkMois.isPresent()
                        ? Math.round(qkMois.getAsDouble() * 10) / 10.0
                        : 0.0);
            }

            double tendance = historiqueQK.size() >= 2
                    ? Math.round((historiqueQK.get(5) - historiqueQK.get(4)) * 10) / 10.0
                    : 0.0;

            // ── 5. Certifications ────────────────────────────────
            List<PassageCertification> passages;
            try {
                passages = passageRepo.findByAuditeurIdOrderByDateDebutDesc(a.getId());
            } catch (Exception e) {
                passages = List.of(); // fallback si méthode absente
            }

            int nbCertTentees  = passages.size();
            long nbCertReussies = passages.stream()
                    .filter(p -> StatutPassage.CERTIFIE.equals(p.getStatut())
                            || StatutPassage.RAPPORT_VALIDE.equals(p.getStatut()))
                    .count();
            long nbCertBloquees = passages.stream()
                    .filter(p -> StatutPassage.BLOQUE.equals(p.getStatut()))
                    .count();
            boolean estBloqueCertif = passages.stream()
                    .anyMatch(p -> StatutPassage.BLOQUE.equals(p.getStatut()));

            // Score théorique moyen (sur 20, les passages avec note)
            double scoreTheoMoyen = passages.stream()
                    .filter(p -> p.getScoreTheorique() != null)
                    .mapToInt(PassageCertification::getScoreTheorique)
                    .average().orElse(0.0);

            // Score pratique moyen (nb défauts identifiés / nb défauts total × 100)
            double scorePratMoyen = passages.stream()
                    .filter(p -> p.getNbDefautsTotal() != null
                            && p.getNbDefautsTotal() > 0
                            && p.getNbDefautsIdentifies() != null)
                    .mapToDouble(p -> p.getNbDefautsIdentifies() * 100.0 / p.getNbDefautsTotal())
                    .average().orElse(0.0);

            int nbQualifications = (int) nbCertReussies;

            // ── 6. Écriture dans la map ──────────────────────────

            // --- ACTIVITÉ ---
            m.put("nbAuditsTotal",    nbTotal);        // ← moteur IA : score volume
            m.put("nbAuditsTermines", nbTermine);       // ← moteur IA : taux complétion
            m.put("nbAuditsEnRetard", nbRetard);        // ← moteur IA : ponctualité
            m.put("nbAuditsEnCours",  nbEnCours);
            m.put("nbAuditsPlanifies",nbPlanifie);
            m.put("tauxRetardPct",    tauxRetardPct);  // ← moteur IA direct
            m.put("delaiMoyenJours",  Math.round(delaiMoyenJours * 10) / 10.0); // ← moteur IA

            // --- QUALITÉ ---
            m.put("qkMoyenGlobal",    Math.round(qkMoyenGlobal * 100) / 100.0); // tous audits
            m.put("qkMoyen",          Math.round(qkMoyen * 10) / 10.0);          // mois courant
            m.put("nbQkVert",         nbQkVert);         // ← moteur IA : taux vert
            m.put("nbQkCritique",     nbQkCritique);     // ← moteur IA : pénalité critique
            m.put("nbPdcaDeclenches", nbPdcaDeclenches); // ← moteur IA : pénalité PDCA
            m.put("tauxConformite",   tauxConformite);   // ← moteur IA : fallback taux vert

            // --- STATS MOIS (compatibilité ancienne UI) ---
            m.put("nbAuditsMois",  nbAuditsMois);
            m.put("historiqueQK",  historiqueQK);
            m.put("tendance",      tendance);
            m.put("scoreGlobal",   Math.max(0, Math.min(100,
                    (int)(100 - qkMoyenGlobal * 15 + nbTotal * 0.8))));

            // --- CERTIFICATION ---
            m.put("nbCertificationsTentees",  nbCertTentees);   // ← moteur IA
            m.put("nbCertificationsReussies", nbCertReussies);  // ← moteur IA
            m.put("nbCertificationsBloquees", nbCertBloquees);
            m.put("estBloqueCertif",          estBloqueCertif); // ← moteur IA : malus blocage
            m.put("scoreTheoMoyen",           Math.round(scoreTheoMoyen * 10) / 10.0); // ← moteur IA
            m.put("scorePratMoyen",           Math.round(scorePratMoyen * 10) / 10.0); // ← moteur IA
            m.put("nbQualifications",         nbQualifications);

            return m;

        }).collect(Collectors.toList());

        return ResponseEntity.ok(result);
    }
}