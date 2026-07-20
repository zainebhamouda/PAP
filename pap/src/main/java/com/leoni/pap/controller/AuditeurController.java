package com.leoni.pap.controller;

import org.springframework.security.core.Authentication;
import com.leoni.pap.dto.request.EnregistrerReponseRequest;
import com.leoni.pap.dto.request.SoumettreRapportRequest;
import com.leoni.pap.dto.response.*;
import com.leoni.pap.entity.*;
import com.leoni.pap.repository.*;
import com.leoni.pap.service.*;
import com.leoni.pap.dto.request.*;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import com.leoni.pap.dto.request.SaisirCablageRequest;
import com.leoni.pap.service.PassageService;
import com.leoni.pap.service.SessionTestService;
import com.leoni.pap.service.CertificationService;
import com.leoni.pap.service.DefautReferenceService;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;
import com.leoni.pap.exception.BusinessException;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import io.swagger.v3.oas.annotations.Operation;
import java.util.stream.Collectors;

import com.leoni.pap.service.AuditSpecialService;
import com.leoni.pap.dto.response.AuditResponse;
@RestController
@RequestMapping("/api/auditeur")
@RequiredArgsConstructor
public class AuditeurController {

    private final PassageService          passageService;
    private final SessionTestService      sessionTestService;
    private final CertificationService    certifService;
    private final ObjectMapper            objectMapper;
    private final UtilisateurService      utilisateurService;
    private final DefautReferenceService  defautReferenceService;
    private final ProjetService           projetService;
    private final SerieService            serieService;
    private final AuditSpecialService     auditSpecialService;
    private final UtilisateurRepository   utilisateurRepository;
    private final AuditProduitService     auditProduitService;
    // ─── CERTIFICATION ───────────────────────────────────────────────

    /** Démarrer ou reprendre un passage (ancienne API — prend la 1ère certif active) */
    @PostMapping("/certification/demarrer")
    public ResponseEntity<PassageResponse> demarrer(
            @AuthenticationPrincipal UserDetails user) {
        return ResponseEntity.ok(passageService.demarrer(user.getUsername()));
    }

    /**
     * SPRINT 2 : Démarrer pour une certification spécifique.
     * L'auditeur a d'abord choisi sa qualification parmi la liste active.
     */
    @PostMapping("/certification/demarrer/{certificationId}")
    public ResponseEntity<PassageResponse> demarrerPourCertif(
            @PathVariable Long certificationId,
            @AuthenticationPrincipal UserDetails user) {
        return ResponseEntity.ok(passageService.demarrerPourCertif(user.getUsername(), certificationId));
    }

    /** Formation terminée → passer au test théorique */
    @PostMapping("/certification/passer-au-test")
    public ResponseEntity<PassageResponse> passerAuTest(
            @AuthenticationPrincipal UserDetails user) {
        return ResponseEntity.ok(passageService.passerAuTestTheorique(user.getUsername()));
    }

    /** Passage en cours de cet auditeur */
    @GetMapping("/certification/en-cours")
    public ResponseEntity<PassageResponse> getEnCours(
            @AuthenticationPrincipal UserDetails user) {
        PassageResponse r = passageService.getMonPassageEnCours(user.getUsername());
        if (r == null) return ResponseEntity.noContent().build();
        return ResponseEntity.ok(r);
    }

    /** Historique des passages */
    @GetMapping("/certification/historique")
    public ResponseEntity<List<PassageResponse>> getHistorique(
            @AuthenticationPrincipal UserDetails user) {
        return ResponseEntity.ok(passageService.getMesPassages(user.getUsername()));
    }

    /**
     * SPRINT 2 : Toutes les qualifications actives disponibles pour l'auditeur
     * (exclut celles déjà passées et non annulées)
     */
    @GetMapping("/certifications/disponibles")
    public ResponseEntity<List<CertificationResponse>> getCertificationsDisponibles(
            @AuthenticationPrincipal UserDetails user) {
        return ResponseEntity.ok(
                certifService.getCertificationsDisponiblesPourAuditeur(user.getUsername()));
    }

    /**
     * SPRINT 2 : Toutes les qualifications actives (pour affichage liste)
     */
    @GetMapping("/certifications/actives")
    public ResponseEntity<List<CertificationResponse>> getCertificationsActives() {
        return ResponseEntity.ok(certifService.getAllCertificationsActives());
    }

    /** Infos du test pratique */
    @GetMapping("/certification/pratique")
    public ResponseEntity<TestPratiqueAuditeurResponse> getTestPratique(
            @AuthenticationPrincipal UserDetails user) {
        PassageResponse passage = passageService.getMonPassageEnCours(user.getUsername());
        if (passage == null) return ResponseEntity.notFound().build();
        TestPratiqueAuditeurResponse r = certifService.getTestPratiqueAuditeur(passage.getId());
        return ResponseEntity.ok(r);
    }

    /** Soumettre le rapport pratique JSON */
    @PostMapping("/certification/{passageId}/rapport")
    public ResponseEntity<PassageResponse> soumettreRapport(
            @PathVariable Long passageId,
            @RequestBody SaisirCablageRequest body) throws Exception {

        var defauts = body.getDefauts().stream().map(d -> Map.of(
                "numero",           (Object)(d.getNumero()          != null ? d.getNumero()          : 0),
                "typeDefaut",       (Object)(d.getTypeDefaut()       != null ? d.getTypeDefaut()       : ""),
                "localisation",     (Object)(d.getLocalisation()     != null ? d.getLocalisation()     : ""),
                "mesureReelle",     (Object)(d.getMesureReelle()     != null ? d.getMesureReelle()     : ""),
                "valeurAcceptable", (Object)(d.getValeurAcceptable() != null ? d.getValeurAcceptable() : ""),
                "observations",     (Object)(d.getObservations()     != null ? d.getObservations()     : ""),
                "identifie",        (Object)(d.getTypeDefaut()       != null && !d.getTypeDefaut().trim().isEmpty())
        )).toList();

        String rapportJson = objectMapper.writeValueAsString(defauts);
        return ResponseEntity.ok(passageService.soumettreRapport(passageId, rapportJson));
    }

    // ─── SESSION TEST ────────────────────────────────────────────────

    @GetMapping("/session/{sessionId}/question")
    public ResponseEntity<QuestionSessionResponse> getQuestion(
            @PathVariable Long sessionId) {
        QuestionSessionResponse q = sessionTestService.getQuestionActuelle(sessionId);
        if (q == null) return ResponseEntity.noContent().build();
        return ResponseEntity.ok(q);
    }

    @PostMapping("/session/{sessionId}/repondre")
    public ResponseEntity<ReponseEnregistreeResponse> repondre(
            @PathVariable Long sessionId,
            @RequestBody EnregistrerReponseRequest body) {
        return ResponseEntity.ok(sessionTestService.enregistrerReponse(sessionId, body));
    }

    @PostMapping("/session/{sessionId}/terminer")
    public ResponseEntity<PassageResponse> terminer(
            @PathVariable Long sessionId,
            @AuthenticationPrincipal UserDetails user) {
        PassageResponse passage = passageService.getMonPassageEnCours(user.getUsername());
        if (passage == null) return ResponseEntity.notFound().build();

        try {
            sessionTestService.terminerSession(sessionId);
        } catch (Exception ignored) {}

        return ResponseEntity.ok(passageService.terminerTheorique(passage.getId()));
    }

    // ─── DASHBOARD ───────────────────────────────────────────────────

    @GetMapping("/dashboard")
    public ResponseEntity<?> getDashboard(
            @AuthenticationPrincipal UserDetails user) {
        return ResponseEntity.ok(certifService.getDashboardAuditeur(user.getUsername()));
    }
// ─── PLANIFICATION AUDITS SPÉCIAUX (par l'auditeur lui-même) ─────

    /**
     * L'auditeur planifie lui-même un audit Règle Plate / Mètre Ruban.
     * auditeurId est déduit automatiquement de l'utilisateur connecté.
     */
    @PostMapping("/audit-special/regle-plate")
    public ResponseEntity<AuditResponse> creerAuditReglePlateParAuditeur(
            @RequestBody CreerAuditReglePlateAuditeurRequest req,
            @AuthenticationPrincipal UserDetails user) {

        Utilisateur auditeur = utilisateurRepository.findByMatricule(user.getUsername())
                .orElseThrow(() -> new BusinessException("Utilisateur introuvable."));

        CreerAuditReglePlateRequest full = new CreerAuditReglePlateRequest();
        full.setPlantId(req.getPlantId());
        full.setAuditeurId(auditeur.getId());
        full.setDateProchaineVerification(req.getDateProchaineVerification());
        full.setObservations(req.getObservations());

        return ResponseEntity.ok(
                auditSpecialService.creerAuditReglePlate(full, auditeur.getId()));
    }

    /**
     * L'auditeur planifie lui-même un audit Magasin Export.
     * auditeurId est déduit automatiquement de l'utilisateur connecté.
     */
    @PostMapping("/audit-special/export")
    public ResponseEntity<AuditResponse> creerAuditExportParAuditeur(
            @RequestBody CreerAuditExportAuditeurRequest req,
            @AuthenticationPrincipal UserDetails user) {

        Utilisateur auditeur = utilisateurRepository.findByMatricule(user.getUsername())
                .orElseThrow(() -> new BusinessException("Utilisateur introuvable."));

        CreerAuditExportRequest full = new CreerAuditExportRequest();
        full.setPlantId(req.getPlantId());
        full.setAuditeurId(auditeur.getId());
        full.setSemaineExport(req.getSemaineExport());
        full.setSalleExport(req.getSalleExport());
        full.setObservations(req.getObservations());

        return ResponseEntity.ok(
                auditSpecialService.creerAuditExport(full, auditeur.getId()));
    }
    // ─── CERTIFICAT PDF ──────────────────────────────────────────────

    // ❌ Méthode supprimée (en conflit) :
    // @GetMapping("/certification/{passageId}/certificat")
    // public ResponseEntity<byte[]> getCertificat(@PathVariable Long passageId) { ... }

    /**
     * Endpoint principal : exporter le certificat PDF (téléchargement)
     * GET /api/auditeur/certification/{passageId}/certificat
     */
    @GetMapping("/certification/{passageId}/certificat")
    @Operation(summary = "Exporter le certificat PDF (téléchargement)")
    public ResponseEntity<byte[]> exporterCertificat(@PathVariable Long passageId) {
        byte[] pdf = getCertificatBytes(passageId);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_PDF_VALUE)
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=\"certificat_qualification.pdf\"")
                .body(pdf);
    }

    /**
     * NOUVEAU endpoint : voir le certificat PDF (affichage inline)
     * GET /api/auditeur/certification/{passageId}/certificat/voir
     */
    @GetMapping("/certification/{passageId}/certificat/voir")
    @Operation(summary = "Voir le certificat PDF (affichage inline)")
    public ResponseEntity<byte[]> voirCertificat(@PathVariable Long passageId) {
        byte[] pdf = getCertificatBytes(passageId);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_PDF_VALUE)
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "inline; filename=\"certificat_qualification.pdf\"")
                .body(pdf);
    }

    /**
     * Helper : tente d'abord le nouveau workflow (fichier dans certificat-auditeur/),
     * sinon fallback sur l'ancien service IA.
     */
    private byte[] getCertificatBytes(Long passageId) {
        // 1. Essayer le nouveau workflow (PDF sauvegardé dans certificat-auditeur/)
        try {
            return passageService.getCertificatPdfBytes(passageId);
        } catch (BusinessException newEx) {
            // 2. Fallback sur l'ancien getCertificatPdf de CertificationService
            try {
                return certifService.getCertificatPdf(passageId);
            } catch (Exception oldEx) {
                // Renvoyer l'erreur originale du nouveau workflow
                throw new BusinessException(newEx.getMessage());
            }
        }
    }

    /** Envoyer le rapport pratique en PDF à un expert */
    @PostMapping("/certification/{passageId}/rapport-pdf")
    public ResponseEntity<PassageResponse> envoyerRapportPdf(
            @PathVariable Long passageId,
            @RequestParam("rapport")  MultipartFile rapportPdf,
            @RequestParam("expertId") Long expertId,
            @AuthenticationPrincipal UserDetails user) {
        return ResponseEntity.ok(
                passageService.envoyerRapportPdf(passageId, rapportPdf, expertId));
    }

    @GetMapping("/experts-disponibles")
    public ResponseEntity<List<UtilisateurResponse>> getExpertsDispo() {
        return ResponseEntity.ok(utilisateurService.getExpertsAvecDroitCertif());
    }

    @GetMapping("/defauts-reference")
    public ResponseEntity<List<DefautReferenceResponse>> getDefautsReference() {
        return ResponseEntity.ok(defautReferenceService.getAll());
    }

    // ─── MODIFICATION D'AUDIT PAR L'AUDITEUR ──────────────────────────

    @PutMapping("/audits/{auditId}")
    @Operation(summary = "Modifier un audit (par l'auditeur, limité à ses propres audits)")
    public ResponseEntity<AuditResponse> modifierAuditParAuditeur(
            @PathVariable Long auditId,
            @RequestBody UpdateAuditRequest req,
            @AuthenticationPrincipal UserDetails user) {

        Utilisateur auditeur = utilisateurRepository.findByMatricule(user.getUsername())
                .orElseThrow(() -> new BusinessException("Utilisateur introuvable."));

        return ResponseEntity.ok(
                auditProduitService.modifierAuditParAuditeur(auditId, req, auditeur.getId()));
    }

    // ─── DONNÉES PLANIFICATION (pour le Suivi de l'auditeur) ──────────

    @GetMapping("/segments/{segmentId}/projets")
    @Operation(summary = "Projets d'un segment (pour ajouter/modifier un audit dans son Suivi)")
    public ResponseEntity<List<ProjetResponse>> getProjetsBySegment(@PathVariable Integer segmentId) {
        return ResponseEntity.ok(projetService.getBySegmentId(segmentId));
    }

    @GetMapping("/projets/{projetId}/series-actives")
    @Operation(summary = "Séries actives d'un projet (pour ajouter/modifier un audit dans son Suivi)")
    public ResponseEntity<List<SerieResponse>> getSeriesActivesByProjet(@PathVariable Integer projetId) {
        return ResponseEntity.ok(serieService.getByProjetActives(projetId));
    }

    @DeleteMapping("/audits/{auditId}")
    @Operation(summary = "Supprimer un audit (par l'auditeur, limité à ses propres audits)")
    public ResponseEntity<String> supprimerAuditParAuditeur(
            @PathVariable Long auditId,
            @AuthenticationPrincipal UserDetails user) {

        Utilisateur auditeur = utilisateurRepository.findByMatricule(user.getUsername())
                .orElseThrow(() -> new BusinessException("Utilisateur introuvable."));

        auditProduitService.supprimerAudit(auditId, auditeur.getId());
        return ResponseEntity.ok("Audit supprimé.");
    }

    @GetMapping("/mon-plant/auditeurs")
    @Operation(summary = "Liste des auditeurs du même plant (pour réassignation)")
    public ResponseEntity<List<UtilisateurResponse>> getAuditeursMonPlant(
            @AuthenticationPrincipal UserDetails user) {

        Utilisateur moi = utilisateurRepository.findByMatricule(user.getUsername())
                .orElseThrow(() -> new BusinessException("Utilisateur introuvable."));

        if (moi.getPlant() == null) return ResponseEntity.ok(List.of());

        List<UtilisateurResponse> result = utilisateurRepository.findAll().stream()
                .filter(u -> u.getRole() == RoleUser.AUDITEUR)
                .filter(u -> u.getPlant() != null && u.getPlant().getId().equals(moi.getPlant().getId()))
                .map(u -> {
                    UtilisateurResponse dto = new UtilisateurResponse();
                    dto.setId(u.getId());
                    dto.setNom(u.getNom());
                    dto.setPrenom(u.getPrenom());
                    dto.setMatricule(u.getMatricule());
                    return dto;
                })
                .collect(Collectors.toList());

        return ResponseEntity.ok(result);
    }



    // ✅ AJOUTÉ — Toutes les séries d'un projet, actives OU non, pour permettre
    // à l'auditeur d'affecter son audit à une série d'un mois futur pas encore
    // active (ex : anticiper la réalisation avant l'activation officielle).
    @GetMapping("/projets/{projetId}/series")
    @Operation(summary = "Toutes les séries d'un projet (actives ou non) — pour changer la série d'un audit vers un mois futur")
    public ResponseEntity<List<SerieResponse>> getToutesSeriesByProjet(@PathVariable Integer projetId) {
        return ResponseEntity.ok(serieService.getByProjetId(projetId));
    }
}