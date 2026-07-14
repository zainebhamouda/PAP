package com.leoni.pap.controller;

import com.leoni.pap.dto.response.*;
import com.leoni.pap.entity.enums.StatutPassage;
import com.leoni.pap.repository.*;
import com.leoni.pap.service.*;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Controller RESPONSABLE QUALITÉ CENTRALE — version complète.
 *
 * Routes :
 *   GET /api/responsable-centrale/dashboard
 *   GET /api/responsable-centrale/profil
 *   GET /api/responsable-centrale/certifications
 *   GET /api/responsable-centrale/passages
 *   GET /api/responsable-centrale/auditeurs
 *   GET /api/responsable-centrale/auditeurs-non-certifies
 *
 *   — Sites & hiérarchie —
 *   GET /api/responsable-centrale/sites                          → liste sites + stats
 *   GET /api/responsable-centrale/sites/{siteId}/detail         → détail complet d'un site
 *   GET /api/responsable-centrale/sites/{siteId}/plants         → plants du site
 *   GET /api/responsable-centrale/sites/{siteId}/segments       → segments du site
 *   GET /api/responsable-centrale/sites/{siteId}/projets        → projets du site
 *   GET /api/responsable-centrale/plants/{plantId}/segments     → segments d'un plant
 *   GET /api/responsable-centrale/segments/{segmentId}/projets  → projets d'un segment
 *
 *   — Qualifications par site —
 *   GET /api/responsable-centrale/sites/{siteId}/qualifications → passages filtrés par site
 *
 *   — Audits par site —
 *   GET /api/responsable-centrale/sites/{siteId}/audits         → audits du site
 *   GET /api/responsable-centrale/sites/{siteId}/non-conformites→ NC du site
 *   GET /api/responsable-centrale/sites/{siteId}/qk             → valeurs QK du site
 *   GET /api/responsable-centrale/sites/{siteId}/qk/par-projet  → QK agrégé par projet
 *   GET /api/responsable-centrale/sites/{siteId}/qk/par-segment → QK agrégé par segment
 *   GET /api/responsable-centrale/sites/{siteId}/qk/par-plant   → QK agrégé par plant
 *   GET /api/responsable-centrale/sites/{siteId}/planifications  → planifications par segment/semestre
 *   GET /api/responsable-centrale/sites/{siteId}/rapports        → audits terminés (= rapports)
 */
@RestController
@RequestMapping("/api/responsable-centrale")
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "Responsable Centrale", description = "Supervision globale multi-sites")
@RequiredArgsConstructor
@PreAuthorize("hasRole('RESPONSABLE_QUALITE_CENTRALE')")
public class ResponsableCentraleController {

    private final ProfilService                   profilService;
    private final CertificationService            certificationService;
    private final PassageService                  passageService;
    private final UtilisateurService              utilisateurService;
    private final AuditProduitService             auditService;
    private final SiteService                     siteService;
    private final PlantService                    plantService;
    private final SegmentService                  segmentService;
    private final ProjetService                   projetService;

    private final UtilisateurRepository           utilisateurRepo;
    private final SiteRepository                  siteRepo;
    private final PlantRepository                 plantRepo;
    private final SegmentRepository               segmentRepo;
    private final ProjetRepository                projetRepo;
    private final AuditProduitRepository          auditRepo;
    private final NonConformiteAuditRepository    ncRepo;
    private final PassageCertificationRepository  passageRepo;

    // ═══════════════════════════════════════════════════
    // PROFIL
    // ═══════════════════════════════════════════════════

    @GetMapping("/profil")
    @Operation(summary = "Mon profil Responsable Centrale")
    public ResponseEntity<ProfilResponse> getProfil(@AuthenticationPrincipal UserDetails ud) {
        return ResponseEntity.ok(profilService.getMonProfil(ud.getUsername()));
    }

    // ═══════════════════════════════════════════════════
    // DASHBOARD — Vue globale (onglet unique, sans onglets qualif/site)
    // ═══════════════════════════════════════════════════

    @GetMapping("/dashboard")
    @Operation(summary = "Dashboard — KPIs globaux + données graphiques")
    public ResponseEntity<Map<String, Object>> getDashboard(@AuthenticationPrincipal UserDetails ud) {

        ProfilResponse profil = profilService.getMonProfil(ud.getUsername());
        Map<String, Object> data = new HashMap<>();
        data.put("profil", profil);

        try {
            List<CertificationResponse> certifs      = certificationService.getAllCertifications();
            List<PassageResponse>       tousPassages = passageService.getAllPassages();
            List<UtilisateurResponse>   tousUsers    = utilisateurService.getAll();
            long                        totalSites   = siteRepo.count();

            List<UtilisateurResponse> auditeurs = tousUsers.stream()
                    .filter(u -> "AUDITEUR".equals(u.getRole()))
                    .collect(Collectors.toList());

            long certifies    = tousPassages.stream().filter(p -> p.getStatut() != null &&
                    List.of("REUSSI","CERTIFIE").contains(p.getStatut().name())).count();
            long bloques      = tousPassages.stream().filter(p -> p.getStatut() != null &&
                    "BLOQUE".equals(p.getStatut().name())).count();
            long enCours      = tousPassages.stream().filter(p -> p.getStatut() != null &&
                    List.of("THEORIQUE_EN_COURS","THEORIQUE_ECHOUE","PRATIQUE_EN_COURS",
                            "PRATIQUE_ECHOUE","FORMATION_OBLIGATOIRE").contains(p.getStatut().name())).count();
            long expires      = tousPassages.stream().filter(p -> p.getStatut() != null &&
                    "ANNULE".equals(p.getStatut().name())).count();
            long nonCertifies = Math.max(0, auditeurs.size() - certifies);

            int tauxCertif   = auditeurs.size() > 0 ? (int) Math.round((certifies * 100.0) / auditeurs.size()) : 0;
            int tauxReussite = tousPassages.size() > 0 ? (int) Math.round((certifies * 100.0) / tousPassages.size()) : 0;

            data.put("totalAuditeurs",  auditeurs.size());
            data.put("totalSites",      totalSites);
            data.put("totalPassages",   tousPassages.size());
            data.put("certifies",       certifies);
            data.put("bloques",         bloques);
            data.put("enCours",         enCours);
            data.put("expires",         expires);
            data.put("nonCertifies",    nonCertifies);
            data.put("tauxCertif",      tauxCertif);
            data.put("tauxReussite",    tauxReussite);
            data.put("totalCertifs",    certifs.size());
            data.put("certifsActives",  certifs.stream().filter(c -> Boolean.TRUE.equals(c.getActif())).count());

            // Camembert
            Map<String, Object> pie = new HashMap<>();
            pie.put("certifies",    certifies);
            pie.put("enCours",      enCours);
            pie.put("bloques",      bloques);
            pie.put("nonCertifies", nonCertifies);
            pie.put("expires",      expires);
            data.put("pieQualif", pie);

            // Stats audits globales
            data.put("totalAudits",       auditRepo.count());
            data.put("auditsEnRetard",     auditRepo.findEnRetard(LocalDate.now()).size());
            data.put("auditsQkDepasses",   auditRepo.countQkDepasses());
            data.put("auditsPdcaOuverts",  auditRepo.findAll().stream().filter(a -> Boolean.TRUE.equals(a.getPdcaDeclenche())).count());

            // Par site
            List<Map<String, Object>> parSite = siteRepo.findAll().stream().map(site -> {
                Map<String, Object> s = new HashMap<>();
                long nbAuditeurs = utilisateurRepo.findAll().stream()
                        .filter(u -> u.getSite() != null && u.getSite().getId().equals(site.getId())
                                && u.getRole() != null && u.getRole().name().equals("AUDITEUR"))
                        .count();
                long nbCertifies = tousPassages.stream()
                        .filter(p -> p.getStatut() != null && List.of("REUSSI","CERTIFIE").contains(p.getStatut().name()))
                        .filter(p -> utilisateurRepo.findByMatricule(p.getAuditeurMatricule() != null ? p.getAuditeurMatricule() : "")
                                .map(u -> u.getSite() != null && u.getSite().getId().equals(site.getId()))
                                .orElse(false))
                        .count();
                long nbAudits = auditRepo.findAll().stream()
                        .filter(a -> a.getSite() != null && a.getSite().getId().equals(site.getId()))
                        .count();
                s.put("id",        site.getId());
                s.put("nom",       site.getNom());
                s.put("localisation", site.getLocalisation());
                s.put("auditeurs", nbAuditeurs);
                s.put("certifies", nbCertifies);
                s.put("audits",    nbAudits);
                s.put("taux",      nbAuditeurs > 0 ? (int) Math.round(nbCertifies * 100.0 / nbAuditeurs) : 0);
                return s;
            }).collect(Collectors.toList());
            data.put("parSite", parSite);

            // Derniers passages
            List<Map<String, Object>> recents = tousPassages.stream()
                    .sorted((a, b) -> {
                        if (a.getDateDebut() == null) return 1;
                        if (b.getDateDebut() == null) return -1;
                        return b.getDateDebut().compareTo(a.getDateDebut());
                    })
                    .limit(6)
                    .map(p -> {
                        Map<String, Object> m = new HashMap<>();
                        m.put("id",                p.getId());
                        m.put("auditeurNom",       p.getAuditeurNom());
                        m.put("auditeurMatricule", p.getAuditeurMatricule());
                        m.put("certificationTitre",p.getCertificationTitre());
                        m.put("statut",            p.getStatut() != null ? p.getStatut().name() : "—");
                        m.put("dateDebut",         p.getDateDebut());
                        return m;
                    }).collect(Collectors.toList());
            data.put("derniersPassages", recents);

            // Derniers audits
            List<Map<String, Object>> derniersAudits = auditRepo.findAll().stream()
                    .sorted(Comparator.comparing(a -> a.getDatePrevue() == null ? LocalDate.MIN : a.getDatePrevue(),
                            Comparator.reverseOrder()))
                    .limit(5)
                    .map(a -> {
                        Map<String, Object> m = new HashMap<>();
                        m.put("id",          a.getId());
                        m.put("reference",   a.getReference());
                        m.put("typeAudit",   a.getTypeAudit() != null ? a.getTypeAudit().name() : "—");
                        m.put("statut",      a.getStatut() != null ? a.getStatut().name() : "—");
                        m.put("siteNom",     a.getSite() != null ? a.getSite().getNom() : "—");
                        m.put("datePrevue",  a.getDatePrevue());
                        m.put("valeurQK",    a.getValeurQK());
                        return m;
                    }).collect(Collectors.toList());
            data.put("derniersAudits", derniersAudits);

        } catch (Exception e) {
            data.put("error", "Stats partiellement indisponibles : " + e.getMessage());
            data.put("totalAuditeurs", 0); data.put("totalSites", 0);
            data.put("certifies", 0);      data.put("bloques", 0);
            data.put("enCours", 0);        data.put("tauxCertif", 0);
        }
        return ResponseEntity.ok(data);
    }

    // ═══════════════════════════════════════════════════
    // QUALIFICATIONS — liste complète avec infos site
    // ═══════════════════════════════════════════════════

    @GetMapping("/certifications")
    @Operation(summary = "Toutes les certifications/passages")
    public ResponseEntity<List<PassageResponse>> getCertifications() {
        try { return ResponseEntity.ok(passageService.getAllPassages()); }
        catch (Exception e) { return ResponseEntity.ok(List.of()); }
    }

    @GetMapping("/passages")
    @Operation(summary = "Tous les passages (filtre statut optionnel)")
    public ResponseEntity<List<PassageResponse>> getPassages(@RequestParam(required = false) String statut) {
        try {
            List<PassageResponse> tous = passageService.getAllPassages();
            if (statut != null && !statut.isBlank() && !"all".equalsIgnoreCase(statut)) {
                tous = tous.stream()
                        .filter(p -> p.getStatut() != null && p.getStatut().name().equalsIgnoreCase(statut))
                        .collect(Collectors.toList());
            }
            return ResponseEntity.ok(tous);
        } catch (Exception e) { return ResponseEntity.ok(List.of()); }
    }

    @GetMapping("/auditeurs-non-certifies")
    @Operation(summary = "Auditeurs sans certification active")
    public ResponseEntity<List<UtilisateurResponse>> getAuditeursNonCertifies() {
        try {
            List<String> matriculesCertifies = passageService.getPassagesReussis().stream()
                    .map(PassageResponse::getAuditeurMatricule).filter(Objects::nonNull)
                    .collect(Collectors.toList());
            List<UtilisateurResponse> nc = utilisateurService.getAll().stream()
                    .filter(u -> "AUDITEUR".equals(u.getRole()))
                    .filter(u -> !matriculesCertifies.contains(u.getMatricule()))
                    .collect(Collectors.toList());
            return ResponseEntity.ok(nc);
        } catch (Exception e) { return ResponseEntity.ok(List.of()); }
    }

    // ═══════════════════════════════════════════════════
    // SITES — liste + stats enrichies
    // ═══════════════════════════════════════════════════

    @GetMapping("/sites")
    @Operation(summary = "Liste des sites avec statistiques complètes")
    public ResponseEntity<List<Map<String, Object>>> getSites() {
        try {
            List<PassageResponse> tousPassages = passageService.getAllPassages();
            List<Map<String, Object>> result = siteRepo.findAll().stream().map(site -> {
                Map<String, Object> s = new HashMap<>();
                s.put("id",           site.getId());
                s.put("nom",          site.getNom());
                s.put("localisation", site.getLocalisation());

                // Plants du site
                List<Map<String, Object>> plants = plantRepo.findBySiteId(site.getId()).stream().map(plant -> {
                    Map<String, Object> pm = new HashMap<>();
                    pm.put("id",  plant.getId());
                    pm.put("nom", plant.getNom());
                    long nbSeg = segmentRepo.findByPlantId(plant.getId()).size();
                    pm.put("nombreSegments", nbSeg);
                    return pm;
                }).collect(Collectors.toList());
                s.put("plants", plants);

                // Auditeurs du site
                List<?> auditeursSite = utilisateurRepo.findAll().stream()
                        .filter(u -> u.getSite() != null && u.getSite().getId().equals(site.getId())
                                && u.getRole() != null && "AUDITEUR".equals(u.getRole().name()))
                        .collect(Collectors.toList());
                long nbAuditeurs = auditeursSite.size();
                s.put("nombreAuditeurs", nbAuditeurs);
                s.put("nombrePlants",    plants.size());

                // Certifications
                Set<String> matriculesSite = utilisateurRepo.findAll().stream()
                        .filter(u -> u.getSite() != null && u.getSite().getId().equals(site.getId()))
                        .map(u -> u.getMatricule()).filter(Objects::nonNull).collect(Collectors.toSet());

                long certifies = tousPassages.stream()
                        .filter(p -> p.getStatut() != null && List.of("REUSSI","CERTIFIE").contains(p.getStatut().name()))
                        .filter(p -> matriculesSite.contains(p.getAuditeurMatricule()))
                        .count();
                long bloques = tousPassages.stream()
                        .filter(p -> p.getStatut() != null && "BLOQUE".equals(p.getStatut().name()))
                        .filter(p -> matriculesSite.contains(p.getAuditeurMatricule()))
                        .count();
                long enCours = tousPassages.stream()
                        .filter(p -> p.getStatut() != null && List.of("THEORIQUE_EN_COURS","PRATIQUE_EN_COURS",
                                "THEORIQUE_ECHOUE","PRATIQUE_ECHOUE","FORMATION_OBLIGATOIRE").contains(p.getStatut().name()))
                        .filter(p -> matriculesSite.contains(p.getAuditeurMatricule()))
                        .count();

                s.put("certifies",       certifies);
                s.put("bloques",         bloques);
                s.put("enCours",         enCours);
                s.put("nonCertifies",    Math.max(0, nbAuditeurs - certifies));
                s.put("tauxCertif",      nbAuditeurs > 0 ? (int) Math.round(certifies * 100.0 / nbAuditeurs) : 0);

                // Audits du site
                List<?> auditsSite = auditRepo.findAll().stream()
                        .filter(a -> a.getSite() != null && a.getSite().getId().equals(site.getId()))
                        .collect(Collectors.toList());
                s.put("nombreAudits",    auditsSite.size());
                s.put("auditsEnRetard",  auditsSite.stream().filter(a -> {
                    var audit = (com.leoni.pap.entity.AuditProduit) a;
                    return com.leoni.pap.entity.enums.StatutAudit.EN_RETARD.equals(audit.getStatut());
                }).count());
                s.put("qkDepasses",      auditsSite.stream().filter(a -> Boolean.TRUE.equals(
                        ((com.leoni.pap.entity.AuditProduit) a).getQkDepasseSeuil())).count());
                s.put("pdcaOuverts",     auditsSite.stream().filter(a -> Boolean.TRUE.equals(
                        ((com.leoni.pap.entity.AuditProduit) a).getPdcaDeclenche())).count());

                // NC du site
                long nbNC = auditRepo.findAll().stream()
                        .filter(a -> a.getSite() != null && a.getSite().getId().equals(site.getId()))
                        .mapToLong(a -> a.getNonConformites() != null ? a.getNonConformites().size() : 0)
                        .sum();
                s.put("nombreNonConformites", nbNC);

                return s;
            }).collect(Collectors.toList());
            return ResponseEntity.ok(result);
        } catch (Exception e) { return ResponseEntity.ok(List.of()); }
    }

    // ═══════════════════════════════════════════════════
    // HIÉRARCHIE SITE → PLANT → SEGMENT → PROJET
    // ═══════════════════════════════════════════════════

    @GetMapping("/sites/{siteId}/plants")
    @Operation(summary = "Plants d'un site")
    public ResponseEntity<List<PlantResponse>> getPlantsBySite(@PathVariable Integer siteId) {
        try { return ResponseEntity.ok(plantService.getBySiteId(siteId)); }
        catch (Exception e) { return ResponseEntity.ok(List.of()); }
    }

    @GetMapping("/sites/{siteId}/segments")
    @Operation(summary = "Tous les segments d'un site (via ses plants)")
    public ResponseEntity<List<SegmentResponse>> getSegmentsBySite(@PathVariable Integer siteId) {
        try {
            List<SegmentResponse> segs = plantRepo.findBySiteId(siteId).stream()
                    .flatMap(p -> segmentRepo.findByPlantId(p.getId()).stream())
                    .map(seg -> {
                        SegmentResponse r = new SegmentResponse();
                        r.setId(seg.getId());
                        r.setNom(seg.getNom());
                        if (seg.getPlant() != null) {
                            r.setPlantId(seg.getPlant().getId());
                            r.setPlantNom(seg.getPlant().getNom());
                        }
                        r.setNombreProjets(seg.getProjets() != null ? seg.getProjets().size() : 0);
                        return r;
                    }).collect(Collectors.toList());
            return ResponseEntity.ok(segs);
        } catch (Exception e) { return ResponseEntity.ok(List.of()); }
    }

    @GetMapping("/sites/{siteId}/projets")
    @Operation(summary = "Tous les projets d'un site")
    public ResponseEntity<List<ProjetResponse>> getProjetsBySite(@PathVariable Integer siteId) {
        try {
            List<ProjetResponse> projets = plantRepo.findBySiteId(siteId).stream()
                    .flatMap(p -> segmentRepo.findByPlantId(p.getId()).stream())
                    .flatMap(seg -> projetRepo.findBySegmentId(seg.getId()).stream())
                    .map(proj -> {
                        ProjetResponse r = new ProjetResponse();
                        r.setId(proj.getId());
                        r.setNom(proj.getNom());
                        r.setDescription(proj.getDescription());
                        if (proj.getSegment() != null) {
                            r.setSegmentId(proj.getSegment().getId());
                            r.setSegmentNom(proj.getSegment().getNom());
                            if (proj.getSegment().getPlant() != null) {
                                r.setPlantNom(proj.getSegment().getPlant().getNom());
                            }
                        }
                        return r;
                    }).collect(Collectors.toList());
            return ResponseEntity.ok(projets);
        } catch (Exception e) { return ResponseEntity.ok(List.of()); }
    }

    @GetMapping("/plants/{plantId}/segments")
    @Operation(summary = "Segments d'un plant")
    public ResponseEntity<List<SegmentResponse>> getSegmentsByPlant(@PathVariable Integer plantId) {
        try { return ResponseEntity.ok(segmentService.getByPlantId(plantId)); }
        catch (Exception e) { return ResponseEntity.ok(List.of()); }
    }

    @GetMapping("/segments/{segmentId}/projets")
    @Operation(summary = "Projets d'un segment")
    public ResponseEntity<List<ProjetResponse>> getProjetsBySegment(@PathVariable Integer segmentId) {
        try { return ResponseEntity.ok(projetService.getBySegmentId(segmentId)); }
        catch (Exception e) { return ResponseEntity.ok(List.of()); }
    }

    // ═══════════════════════════════════════════════════
    // QUALIFICATIONS PAR SITE
    // ═══════════════════════════════════════════════════

    @GetMapping("/sites/{siteId}/qualifications")
    @Operation(summary = "Passages/qualifications des auditeurs d'un site")
    public ResponseEntity<List<Map<String, Object>>> getQualificationsBySite(
            @PathVariable Integer siteId,
            @RequestParam(required = false) String statut) {
        try {
            Set<String> matriculesSite = utilisateurRepo.findAll().stream()
                    .filter(u -> u.getSite() != null && u.getSite().getId().equals(siteId))
                    .map(u -> u.getMatricule()).filter(Objects::nonNull)
                    .collect(Collectors.toSet());

            List<PassageResponse> passages = passageService.getAllPassages().stream()
                    .filter(p -> matriculesSite.contains(p.getAuditeurMatricule()))
                    .collect(Collectors.toList());

            if (statut != null && !statut.isBlank() && !"all".equalsIgnoreCase(statut)) {
                passages = passages.stream()
                        .filter(p -> p.getStatut() != null && p.getStatut().name().equalsIgnoreCase(statut))
                        .collect(Collectors.toList());
            }

            List<Map<String, Object>> result = passages.stream().map(p -> {
                Map<String, Object> m = new LinkedHashMap<>();
                m.put("id",                  p.getId());
                m.put("auditeurNom",         p.getAuditeurNom());
                m.put("auditeurMatricule",   p.getAuditeurMatricule());
                m.put("certificationTitre",  p.getCertificationTitre());
                m.put("statut",              p.getStatut() != null ? p.getStatut().name() : null);
                m.put("scoreTheorique",      p.getScoreTheorique());
                m.put("nbDefautsIdentifies", p.getNbDefautsIdentifies());
                m.put("nbDefautsTotal",      p.getNbDefautsTotal());
                m.put("nbTentativesTheorique",p.getNbTentativesTheorique());
                m.put("nbTentativesPratique", p.getNbTentativesPratique());
                m.put("dateDebut",           p.getDateDebut());
                // Enrichir avec infos utilisateur
                utilisateurRepo.findByMatricule(p.getAuditeurMatricule() != null ? p.getAuditeurMatricule() : "")
                        .ifPresent(u -> {
                            m.put("auditeurRole", u.getRole() != null ? u.getRole().name() : null);
                            if (u.getSite() != null) m.put("siteNom", u.getSite().getNom());
                            if (u.getPlant() != null) m.put("plantNom", u.getPlant().getNom());
                        });
                return m;
            }).collect(Collectors.toList());

            return ResponseEntity.ok(result);
        } catch (Exception e) { return ResponseEntity.ok(List.of()); }
    }

    // ═══════════════════════════════════════════════════
    // AUDITS PAR SITE
    // ═══════════════════════════════════════════════════

    @GetMapping("/sites/{siteId}/audits")
    @Operation(summary = "Audits d'un site")
    public ResponseEntity<List<AuditResponse>> getAuditsBySite(
            @PathVariable Integer siteId,
            @RequestParam(required = false) String statut,
            @RequestParam(required = false) String type) {
        try {
            List<AuditResponse> audits = auditRepo.findAll().stream()
                    .filter(a -> a.getSite() != null && a.getSite().getId().equals(siteId))
                    .filter(a -> statut == null || statut.isBlank() || "TOUS".equals(statut)
                            || (a.getStatut() != null && a.getStatut().name().equals(statut)))
                    .filter(a -> type == null || type.isBlank() || "TOUS".equals(type)
                            || (a.getTypeAudit() != null && a.getTypeAudit().name().equals(type)))
                    .sorted(Comparator.comparing(a -> a.getDatePrevue() == null ? LocalDate.MIN : a.getDatePrevue(),
                            Comparator.reverseOrder()))
                    .map(AuditResponse::from)
                    .collect(Collectors.toList());
            return ResponseEntity.ok(audits);
        } catch (Exception e) { return ResponseEntity.ok(List.of()); }
    }

    // ═══════════════════════════════════════════════════
    // NON-CONFORMITÉS PAR SITE
    // ═══════════════════════════════════════════════════

    @GetMapping("/sites/{siteId}/non-conformites")
    @Operation(summary = "Non-conformités d'un site")
    public ResponseEntity<List<Map<String, Object>>> getNonConformitesBySite(
            @PathVariable Integer siteId,
            @RequestParam(required = false) Integer plantId) {
        try {
            List<Map<String, Object>> ncs = auditRepo.findAll().stream()
                    .filter(a -> a.getSite() != null && a.getSite().getId().equals(siteId))
                    .filter(a -> plantId == null || (a.getPlant() != null && a.getPlant().getId().equals(plantId)))
                    .filter(a -> com.leoni.pap.entity.enums.StatutAudit.TERMINE.equals(a.getStatut()))
                    .flatMap(a -> (a.getNonConformites() != null ? a.getNonConformites() : List.<com.leoni.pap.entity.NonConformiteAudit>of()).stream().map(nc -> {
                        Map<String, Object> m = new LinkedHashMap<>();
                        m.put("id",          nc.getId());
                        m.put("description", nc.getDescription());
                        m.put("typeDefaut",  nc.getTypeDefaut());
                        m.put("codeDefaut",  nc.getCodeDefaut());
                        m.put("points",      nc.getPoints());
                        m.put("quantite",    nc.getQuantite());
                        m.put("totalPoints", nc.getTotalPoints());
                        m.put("zone",        nc.getZone());
                        m.put("actionCorrective", nc.getActionCorrective());
                        m.put("auditRef",    a.getReference());
                        m.put("auditId",     a.getId());
                        m.put("auditDate",   a.getDateRealisation() != null ? a.getDateRealisation() : a.getDatePrevue());
                        m.put("auditeurNom", a.getAuditeur() != null ? a.getAuditeur().getNom() + " " + a.getAuditeur().getPrenom() : "—");
                        m.put("plantNom",    a.getPlant() != null ? a.getPlant().getNom() : "—");
                        m.put("siteNom",     a.getSite() != null ? a.getSite().getNom() : "—");
                        m.put("domaine",     a.getDomaine());
                        m.put("pdca",        a.getPdcaDeclenche());
                        return m;
                    }))
                    .collect(Collectors.toList());
            return ResponseEntity.ok(ncs);
        } catch (Exception e) { return ResponseEntity.ok(List.of()); }
    }

    // ═══════════════════════════════════════════════════
    // QK PAR SITE (global + par projet / segment / plant)
    // ═══════════════════════════════════════════════════

    @GetMapping("/sites/{siteId}/qk")
    @Operation(summary = "Valeurs QK d'un site (audits terminés)")
    public ResponseEntity<List<Map<String, Object>>> getQkBySite(@PathVariable Integer siteId) {
        try {
            List<Map<String, Object>> qks = auditRepo.findAll().stream()
                    .filter(a -> a.getSite() != null && a.getSite().getId().equals(siteId)
                            && com.leoni.pap.entity.enums.StatutAudit.TERMINE.equals(a.getStatut())
                            && a.getValeurQK() != null)
                    .sorted(Comparator.comparing(a -> a.getDateRealisation() == null ? LocalDate.MIN : a.getDateRealisation(),
                            Comparator.reverseOrder()))
                    .map(a -> {
                        Map<String, Object> m = new LinkedHashMap<>();
                        m.put("id",            a.getId());
                        m.put("reference",     a.getReference());
                        m.put("valeurQK",      a.getValeurQK());
                        m.put("qkDepasseSeuil",a.getQkDepasseSeuil());
                        m.put("dateRealisation",a.getDateRealisation());
                        m.put("datePrevue",    a.getDatePrevue());
                        m.put("typeAudit",     a.getTypeAudit() != null ? a.getTypeAudit().name() : null);
                        m.put("familleCablage",a.getFamilleCablage());
                        m.put("domaine",       a.getDomaine());
                        m.put("plantId",       a.getPlant() != null ? a.getPlant().getId() : null);
                        m.put("plantNom",      a.getPlant() != null ? a.getPlant().getNom() : "—");
                        m.put("segmentId",     a.getSegment() != null ? a.getSegment().getId() : null);
                        m.put("segmentNom",    a.getSegment() != null ? a.getSegment().getNom() : "—");
                        m.put("projetId",      a.getProjet() != null ? a.getProjet().getId() : null);
                        m.put("projetNom",     a.getProjet() != null ? a.getProjet().getNom() : "—");
                        m.put("auditeurNom",   a.getAuditeur() != null ? a.getAuditeur().getNom() + " " + a.getAuditeur().getPrenom() : "—");
                        m.put("totalPoints",   a.getTotalPoints());
                        m.put("facteur",       a.getFacteur());
                        m.put("pdcaDeclenche", a.getPdcaDeclenche());
                        return m;
                    }).collect(Collectors.toList());
            return ResponseEntity.ok(qks);
        } catch (Exception e) { return ResponseEntity.ok(List.of()); }
    }

    @GetMapping("/sites/{siteId}/qk/par-projet")
    @Operation(summary = "QK agrégé par projet pour un site")
    public ResponseEntity<List<Map<String, Object>>> getQkParProjet(@PathVariable Integer siteId) {
        try {
            Map<String, List<Double>> grouped = auditRepo.findAll().stream()
                    .filter(a -> a.getSite() != null && a.getSite().getId().equals(siteId)
                            && com.leoni.pap.entity.enums.StatutAudit.TERMINE.equals(a.getStatut())
                            && a.getValeurQK() != null && a.getProjet() != null)
                    .collect(Collectors.groupingBy(
                            a -> a.getProjet().getId() + "|" + a.getProjet().getNom(),
                            Collectors.mapping(a -> a.getValeurQK(), Collectors.toList())));

            List<Map<String, Object>> result = grouped.entrySet().stream().map(e -> {
                        String[] parts = e.getKey().split("\\|", 2);
                        Map<String, Object> m = new LinkedHashMap<>();
                        m.put("projetId",   parts[0]);
                        m.put("projetNom",  parts.length > 1 ? parts[1] : "—");
                        m.put("qkMoyen",    e.getValue().stream().mapToDouble(Double::doubleValue).average().orElse(0));
                        m.put("qkMax",      e.getValue().stream().mapToDouble(Double::doubleValue).max().orElse(0));
                        m.put("qkMin",      e.getValue().stream().mapToDouble(Double::doubleValue).min().orElse(0));
                        m.put("nbAudits",   e.getValue().size());
                        m.put("nbDepasses", e.getValue().stream().filter(v -> v > 0.5).count());
                        return m;
                    }).sorted(Comparator.comparingDouble(m -> -((Double) m.get("qkMoyen"))))
                    .collect(Collectors.toList());
            return ResponseEntity.ok(result);
        } catch (Exception e) { return ResponseEntity.ok(List.of()); }
    }

    @GetMapping("/sites/{siteId}/qk/par-segment")
    @Operation(summary = "QK agrégé par segment pour un site")
    public ResponseEntity<List<Map<String, Object>>> getQkParSegment(@PathVariable Integer siteId) {
        try {
            Map<String, List<Double>> grouped = auditRepo.findAll().stream()
                    .filter(a -> a.getSite() != null && a.getSite().getId().equals(siteId)
                            && com.leoni.pap.entity.enums.StatutAudit.TERMINE.equals(a.getStatut())
                            && a.getValeurQK() != null && a.getSegment() != null)
                    .collect(Collectors.groupingBy(
                            a -> a.getSegment().getId() + "|" + a.getSegment().getNom(),
                            Collectors.mapping(a -> a.getValeurQK(), Collectors.toList())));

            List<Map<String, Object>> result = grouped.entrySet().stream().map(e -> {
                        String[] parts = e.getKey().split("\\|", 2);
                        Map<String, Object> m = new LinkedHashMap<>();
                        m.put("segmentId",  parts[0]);
                        m.put("segmentNom", parts.length > 1 ? parts[1] : "—");
                        m.put("qkMoyen",    e.getValue().stream().mapToDouble(Double::doubleValue).average().orElse(0));
                        m.put("qkMax",      e.getValue().stream().mapToDouble(Double::doubleValue).max().orElse(0));
                        m.put("nbAudits",   e.getValue().size());
                        m.put("nbDepasses", e.getValue().stream().filter(v -> v > 0.5).count());
                        return m;
                    }).sorted(Comparator.comparingDouble(m -> -((Double) m.get("qkMoyen"))))
                    .collect(Collectors.toList());
            return ResponseEntity.ok(result);
        } catch (Exception e) { return ResponseEntity.ok(List.of()); }
    }

    @GetMapping("/sites/{siteId}/qk/par-plant")
    @Operation(summary = "QK agrégé par plant pour un site")
    public ResponseEntity<List<Map<String, Object>>> getQkParPlant(@PathVariable Integer siteId) {
        try {
            Map<String, List<Double>> grouped = auditRepo.findAll().stream()
                    .filter(a -> a.getSite() != null && a.getSite().getId().equals(siteId)
                            && com.leoni.pap.entity.enums.StatutAudit.TERMINE.equals(a.getStatut())
                            && a.getValeurQK() != null && a.getPlant() != null)
                    .collect(Collectors.groupingBy(
                            a -> a.getPlant().getId() + "|" + a.getPlant().getNom(),
                            Collectors.mapping(a -> a.getValeurQK(), Collectors.toList())));

            List<Map<String, Object>> result = grouped.entrySet().stream().map(e -> {
                        String[] parts = e.getKey().split("\\|", 2);
                        Map<String, Object> m = new LinkedHashMap<>();
                        m.put("plantId",    parts[0]);
                        m.put("plantNom",   parts.length > 1 ? parts[1] : "—");
                        m.put("qkMoyen",    e.getValue().stream().mapToDouble(Double::doubleValue).average().orElse(0));
                        m.put("qkMax",      e.getValue().stream().mapToDouble(Double::doubleValue).max().orElse(0));
                        m.put("nbAudits",   e.getValue().size());
                        m.put("nbDepasses", e.getValue().stream().filter(v -> v > 0.5).count());
                        return m;
                    }).sorted(Comparator.comparingDouble(m -> -((Double) m.get("qkMoyen"))))
                    .collect(Collectors.toList());
            return ResponseEntity.ok(result);
        } catch (Exception e) { return ResponseEntity.ok(List.of()); }
    }

    // ═══════════════════════════════════════════════════
    // PLANIFICATIONS PAR SITE (par segment, par semestre)
    // ═══════════════════════════════════════════════════

    @GetMapping("/sites/{siteId}/planifications")
    @Operation(summary = "Planifications d'un site, organisées par segment et semestre")
    public ResponseEntity<List<Map<String, Object>>> getPlanificationsBySite(
            @PathVariable Integer siteId,
            @RequestParam(required = false) Integer plantId,
            @RequestParam(required = false) Integer segmentId,
            @RequestParam(required = false) Integer annee) {

        int year = annee != null ? annee : LocalDate.now().getYear();
        try {
            // Récupérer tous les audits du site pour l'année
            LocalDate debut = LocalDate.of(year, 1, 1);
            LocalDate fin   = LocalDate.of(year, 12, 31);

            List<com.leoni.pap.entity.AuditProduit> audits = auditRepo.findAll().stream()
                    .filter(a -> a.getSite() != null && a.getSite().getId().equals(siteId))
                    .filter(a -> plantId == null || (a.getPlant() != null && a.getPlant().getId().equals(plantId)))
                    .filter(a -> segmentId == null || (a.getSegment() != null && a.getSegment().getId().equals(segmentId)))
                    .filter(a -> a.getDatePrevue() != null
                            && !a.getDatePrevue().isBefore(debut)
                            && !a.getDatePrevue().isAfter(fin))
                    .collect(Collectors.toList());

            // Grouper par segment puis par semestre
            Map<String, List<com.leoni.pap.entity.AuditProduit>> bySegment = audits.stream()
                    .collect(Collectors.groupingBy(a -> {
                        if (a.getSegment() == null) return "0|Sans segment";
                        return a.getSegment().getId() + "|" + a.getSegment().getNom();
                    }));

            List<Map<String, Object>> result = bySegment.entrySet().stream().map(e -> {
                String[] parts = e.getKey().split("\\|", 2);
                Map<String, Object> seg = new LinkedHashMap<>();
                seg.put("segmentId",  parts[0]);
                seg.put("segmentNom", parts.length > 1 ? parts[1] : "Sans segment");

                // Semestre 1 (jan–juin)
                List<Map<String, Object>> s1 = e.getValue().stream()
                        .filter(a -> a.getDatePrevue().getMonthValue() <= 6)
                        .sorted(Comparator.comparing(a -> a.getDatePrevue()))
                        .map(a -> auditToPlanMap(a)).collect(Collectors.toList());
                // Semestre 2 (juil–déc)
                List<Map<String, Object>> s2 = e.getValue().stream()
                        .filter(a -> a.getDatePrevue().getMonthValue() > 6)
                        .sorted(Comparator.comparing(a -> a.getDatePrevue()))
                        .map(a -> auditToPlanMap(a)).collect(Collectors.toList());

                seg.put("semestre1", s1);
                seg.put("semestre2", s2);
                seg.put("totalAudits", e.getValue().size());

                // Plant du segment
                if (e.getValue().get(0).getPlant() != null) {
                    seg.put("plantId",  e.getValue().get(0).getPlant().getId());
                    seg.put("plantNom", e.getValue().get(0).getPlant().getNom());
                }
                return seg;
            }).collect(Collectors.toList());

            return ResponseEntity.ok(result);
        } catch (Exception e) { return ResponseEntity.ok(List.of()); }
    }

    // ═══════════════════════════════════════════════════
    // RAPPORTS PAR SITE (audits terminés = rapports)
    // ═══════════════════════════════════════════════════

    @GetMapping("/sites/{siteId}/rapports")
    @Operation(summary = "Rapports (audits terminés) d'un site, filtrables par plant")
    public ResponseEntity<List<Map<String, Object>>> getRapportsBySite(
            @PathVariable Integer siteId,
            @RequestParam(required = false) Integer plantId) {
        try {
            List<Map<String, Object>> rapports = auditRepo.findAll().stream()
                    .filter(a -> a.getSite() != null && a.getSite().getId().equals(siteId)
                            && com.leoni.pap.entity.enums.StatutAudit.TERMINE.equals(a.getStatut()))
                    .filter(a -> plantId == null || (a.getPlant() != null && a.getPlant().getId().equals(plantId)))
                    .sorted(Comparator.comparing(a -> a.getDateRealisation() == null ? LocalDate.MIN : a.getDateRealisation(),
                            Comparator.reverseOrder()))
                    .map(a -> {
                        Map<String, Object> m = new LinkedHashMap<>();
                        m.put("id",             a.getId());
                        m.put("reference",      a.getReference());
                        m.put("typeAudit",      a.getTypeAudit() != null ? a.getTypeAudit().name() : null);
                        m.put("natureAudit",    a.getNatureAudit() != null ? a.getNatureAudit().name() : null);
                        m.put("dateRealisation",a.getDateRealisation());
                        m.put("datePrevue",     a.getDatePrevue());
                        m.put("plantNom",       a.getPlant() != null ? a.getPlant().getNom() : "—");
                        m.put("plantId",        a.getPlant() != null ? a.getPlant().getId() : null);
                        m.put("segmentNom",     a.getSegment() != null ? a.getSegment().getNom() : "—");
                        m.put("projetNom",      a.getProjet() != null ? a.getProjet().getNom() : "—");
                        m.put("domaine",        a.getDomaine());
                        m.put("familleCablage", a.getFamilleCablage());
                        m.put("auditeurNom",    a.getAuditeur() != null ? a.getAuditeur().getNom() + " " + a.getAuditeur().getPrenom() : "—");
                        m.put("valeurQK",       a.getValeurQK());
                        m.put("qkDepasseSeuil", a.getQkDepasseSeuil());
                        m.put("totalPoints",    a.getTotalPoints());
                        m.put("nbNonConformites",a.getNonConformites() != null ? a.getNonConformites().size() : 0);
                        m.put("pdcaDeclenche",  a.getPdcaDeclenche());
                        m.put("observations",   a.getObservations());
                        m.put("rapportUrl",     a.getRapportUrl());
                        m.put("numeroRapport",  a.getNumeroRapport());
                        return m;
                    }).collect(Collectors.toList());
            return ResponseEntity.ok(rapports);
        } catch (Exception e) { return ResponseEntity.ok(List.of()); }
    }

    // ═══════════════════════════════════════════════════
    // UTILITAIRES PRIVÉS
    // ═══════════════════════════════════════════════════

    private Map<String, Object> auditToPlanMap(com.leoni.pap.entity.AuditProduit a) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id",          a.getId());
        m.put("reference",   a.getReference());
        m.put("typeAudit",   a.getTypeAudit() != null ? a.getTypeAudit().name() : null);
        m.put("statut",      a.getStatut() != null ? a.getStatut().name() : null);
        m.put("datePrevue",  a.getDatePrevue());
        m.put("dateRealisation", a.getDateRealisation());
        m.put("familleCablage",  a.getFamilleCablage());
        m.put("domaine",     a.getDomaine());
        m.put("plantNom",    a.getPlant() != null ? a.getPlant().getNom() : "—");
        m.put("segmentNom",  a.getSegment() != null ? a.getSegment().getNom() : "—");
        m.put("projetNom",   a.getProjet() != null ? a.getProjet().getNom() : "—");
        m.put("auditeurNom", a.getAuditeur() != null ? a.getAuditeur().getNom() + " " + a.getAuditeur().getPrenom() : "—");
        m.put("valeurQK",    a.getValeurQK());
        return m;
    }
    @GetMapping("/certifications/{certifId}/classement-auditeurs")
    public ResponseEntity<List<ClassementAuditeurResponse>> getClassementAuditeurs(
            @PathVariable Long certifId) {

        List<ClassementAuditeurResponse> classement =
                certificationService.getClassementAuditeurs(certifId);
        return ResponseEntity.ok(classement);
    }
    @GetMapping("/certifications/all")
    @Operation(summary = "Toutes les certifications confirmées (responsable centrale)")
    public ResponseEntity<List<CertificationResponse>> getAllCertificationsAll() {
        try {
            List<CertificationResponse> result = certificationService.getAllCertifications();
            return ResponseEntity.ok(result != null ? result : List.of());
        } catch (Exception e) {
            System.err.println("[RESPONSABLE] /certifications/all error: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.ok(List.of());
        }
    }
}