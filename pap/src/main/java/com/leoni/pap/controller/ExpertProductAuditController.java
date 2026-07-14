package com.leoni.pap.controller;

import com.leoni.pap.dto.request.*;
import com.leoni.pap.dto.response.*;
import com.leoni.pap.entity.Utilisateur;
import com.leoni.pap.exception.BusinessException;
import com.leoni.pap.repository.UtilisateurRepository;
import com.leoni.pap.repository.*;
import com.leoni.pap.service.*;
import java.util.stream.Collectors;
import com.leoni.pap.entity.*;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.Files;
import java.util.LinkedHashMap;
import com.leoni.pap.entity.QuestionTest;
import com.leoni.pap.entity.SessionTest;
import com.leoni.pap.entity.PassageCertification;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.net.MalformedURLException;
import java.util.*;

@RestController
@RequestMapping("/api/expert-audit")
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "Expert Product Audit", description = "Toutes les fonctionnalités de l'Expert Product Audit")
@RequiredArgsConstructor
@PreAuthorize("hasRole('EXPERT_PRODUCT_AUDIT')")
public class ExpertProductAuditController {

    private final ProfilService          profilService;
    private final TestTheoriqueService   testService;
    private final TestPratiqueService    pratiqueService;
    private final CertificationService   certificationService;
    private final PassageService         passageService;
    private final UtilisateurRepository  utilisateurRepo;
    private final ProjetService          projetService;
    private final SerieService           serieService;
    private final PlantService           plantService;
    private final ClientService          clientService;
    private final PassageCertificationRepository passageRepo;
    private final ReponseSessionRepository       reponseSessionRepo;
    private final ObjectMapper                   objectMapper;
    private static final String CERTIFICATS_AUDITEUR_DIR = "uploads/certifiact-auditeur/";



    private void verifierDroitCertif(String matricule) {
        Utilisateur u = utilisateurRepo.findByMatricule(matricule)
                .orElseThrow(() -> new BusinessException("Utilisateur introuvable."));
        if (!Boolean.TRUE.equals(u.getPeutCreerCertif()))
            throw new BusinessException(
                    "Vous n'avez pas le droit de créer des certifications. Contactez l'administrateur.");
    }

    // ═════════════════════════════════════════════════════════
    // A. DASHBOARD & PROFIL
    // ═════════════════════════════════════════════════════════

    @GetMapping("/dashboard")
    @Operation(summary = "Dashboard Expert")
    public ResponseEntity<Map<String, Object>> getDashboard(
            @AuthenticationPrincipal UserDetails user) {
        ProfilResponse profil = profilService.getMonProfil(user.getUsername());
        Map<String, Object> data = new HashMap<>();
        data.put("profil", profil);
        data.put("message", "Bienvenue " + profil.getPrenom() + " !");
        data.put("testTheoriqueActif",   getTestTheoriqueActifSafe());
        data.put("testPratiqueActif",    getTestPratiqueActifSafe());
        data.put("certificationActive",  getCertificationActiveSafe());
        data.put("certificationsActives", certificationService.getAllCertificationsActives());
        return ResponseEntity.ok(data);
    }

    @GetMapping("/profil")
    public ResponseEntity<ProfilResponse> getProfil(@AuthenticationPrincipal UserDetails user) {
        return ResponseEntity.ok(profilService.getMonProfil(user.getUsername()));
    }

    // ═════════════════════════════════════════════════════════
    // B. TESTS THÉORIQUES
    // ═════════════════════════════════════════════════════════

    @PostMapping("/tests")
    @Operation(summary = "Créer un test théorique")
    public ResponseEntity<TestTheoriqueResponse> creerTest(
            @RequestBody CreerTestRequest req,
            @AuthenticationPrincipal UserDetails user) {
        verifierDroitCertif(user.getUsername());
        return ResponseEntity.ok(testService.creerTest(req, user.getUsername()));
    }

    @GetMapping("/tests/all")
    public ResponseEntity<List<TestTheoriqueResponse>> allTests() {
        return ResponseEntity.ok(testService.getAllTests());
    }

    @GetMapping("/tests/actif")
    public ResponseEntity<TestTheoriqueResponse> testTheoriqueActif() {
        return ResponseEntity.ok(testService.getTestActif());
    }

    @GetMapping("/tests/{testId}/questions")
    public ResponseEntity<?> getQuestions(@PathVariable Long testId) {
        return ResponseEntity.ok(testService.getQuestionsTest(testId));
    }

    @PostMapping("/tests/{testId}/questions/image")
    public ResponseEntity<Void> ajouterQuestionImage(
            @PathVariable Long testId,
            @RequestBody QuestionImageRequest req,
            @AuthenticationPrincipal UserDetails user) {
        verifierDroitCertif(user.getUsername());
        testService.ajouterQuestionImage(testId, req);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/tests/{testId}/questions/qcm")
    public ResponseEntity<Void> ajouterQuestionQCM(
            @PathVariable Long testId,
            @RequestBody QuestionQCMRequest req,
            @AuthenticationPrincipal UserDetails user) {
        verifierDroitCertif(user.getUsername());
        testService.ajouterQuestionQCM(testId, req);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/tests/{id}/activer")
    public ResponseEntity<TestTheoriqueResponse> activerTest(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails user) {
        verifierDroitCertif(user.getUsername());
        return ResponseEntity.ok(testService.activerTest(id));
    }

    @DeleteMapping("/tests/questions/{questionId}")
    public ResponseEntity<Void> supprimerQuestion(
            @PathVariable Long questionId,
            @AuthenticationPrincipal UserDetails user) {
        verifierDroitCertif(user.getUsername());
        testService.supprimerQuestion(questionId);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/tests/{testId}")
    public ResponseEntity<TestTheoriqueResponse> modifierTest(
            @PathVariable Long testId,
            @RequestBody CreerTestRequest req,
            @AuthenticationPrincipal UserDetails user) {
        verifierDroitCertif(user.getUsername());
        return ResponseEntity.ok(testService.modifierTest(testId, req));
    }

    @DeleteMapping("/tests/{testId}")
    public ResponseEntity<Void> supprimerTest(
            @PathVariable Long testId,
            @AuthenticationPrincipal UserDetails user) {
        verifierDroitCertif(user.getUsername());
        testService.supprimerTest(testId);
        return ResponseEntity.noContent().build();
    }

    // ═════════════════════════════════════════════════════════
    // C. TESTS PRATIQUES
    // ═════════════════════════════════════════════════════════

    @PostMapping("/tests-pratiques")
    public ResponseEntity<TestPratiqueResponse> creerTestPratique(
            @RequestBody CreerTestPratiqueRequest req,
            @AuthenticationPrincipal UserDetails user) {
        verifierDroitCertif(user.getUsername());
        return ResponseEntity.ok(pratiqueService.creerTestPratique(req, user.getUsername()));
    }

    @GetMapping("/tests-pratiques/all")
    public ResponseEntity<List<TestPratiqueResponse>> allTestsPratiques() {
        return ResponseEntity.ok(pratiqueService.getAllTestsPratiques());
    }

    @GetMapping("/tests-pratiques/{testId}")
    public ResponseEntity<TestPratiqueResponse> getTestPratique(@PathVariable Long testId) {
        return ResponseEntity.ok(pratiqueService.getTestPratique(testId));
    }

    @PostMapping("/tests-pratiques/{testId}/defauts")
    public ResponseEntity<Void> ajouterDefaut(
            @PathVariable Long testId,
            @RequestBody DefautPratiqueRequest req,
            @AuthenticationPrincipal UserDetails user) {
        verifierDroitCertif(user.getUsername());
        pratiqueService.ajouterDefaut(testId, req);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/tests-pratiques/{id}/activer")
    public ResponseEntity<TestPratiqueResponse> activerTestPratique(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails user) {
        verifierDroitCertif(user.getUsername());
        return ResponseEntity.ok(pratiqueService.activerTestPratique(id));
    }

    @DeleteMapping("/tests-pratiques/defauts/{defautId}")
    public ResponseEntity<Void> supprimerDefaut(
            @PathVariable Long defautId,
            @AuthenticationPrincipal UserDetails user) {
        verifierDroitCertif(user.getUsername());
        pratiqueService.supprimerDefaut(defautId);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/tests-pratiques/{testId}")
    public ResponseEntity<TestPratiqueResponse> modifierTestPratique(
            @PathVariable Long testId,
            @RequestBody CreerTestPratiqueRequest req,
            @AuthenticationPrincipal UserDetails user) {
        verifierDroitCertif(user.getUsername());
        return ResponseEntity.ok(pratiqueService.modifierTestPratique(testId, req));
    }

    @DeleteMapping("/tests-pratiques/{testId}")
    public ResponseEntity<Void> supprimerTestPratique(
            @PathVariable Long testId,
            @AuthenticationPrincipal UserDetails user) {
        verifierDroitCertif(user.getUsername());
        pratiqueService.supprimerTestPratique(testId);
        return ResponseEntity.noContent().build();
    }

    // ═════════════════════════════════════════════════════════
    // D. CERTIFICATIONS
    // ═════════════════════════════════════════════════════════

    @PostMapping("/certifications/confirmer")
    public ResponseEntity<CertificationResponse> confirmerCertification(
            @RequestBody CreerCertificationRequest req,
            @AuthenticationPrincipal UserDetails user) {
        verifierDroitCertif(user.getUsername());
        return ResponseEntity.ok(certificationService.confirmerCertification(req, user.getUsername()));
    }

    @GetMapping("/certifications/tests-theoriques-disponibles")
    public ResponseEntity<List<TestTheoriqueResponse>> testsTheoriquesPourChoix() {
        return ResponseEntity.ok(certificationService.getTestsTheoriquesPourChoix());
    }

    @GetMapping("/certifications/tests-pratiques-disponibles")
    public ResponseEntity<List<TestPratiqueResponse>> testsPratiquesPourChoix() {
        return ResponseEntity.ok(certificationService.getTestsPratiquesPourChoix());
    }

    @PostMapping("/certifications/brouillon")
    public ResponseEntity<?> sauvegarderBrouillon(
            @RequestBody CreerCertificationRequest req,
            @AuthenticationPrincipal UserDetails user) {
        try {
            verifierDroitCertif(user.getUsername());
            CertificationResponse res = certificationService.sauvegarderBrouillon(req, user.getUsername());
            return ResponseEntity.ok(res);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/certifications/mon-brouillon")
    public ResponseEntity<CertificationResponse> getMonBrouillon(
            @AuthenticationPrincipal UserDetails userDetails) {
        try {
            CertificationResponse brouillon = certificationService.getMonBrouillon(userDetails.getUsername());
            return ResponseEntity.ok(brouillon);
        } catch (Exception e) {
            return ResponseEntity.ok(null);
        }
    }

    @GetMapping("/certifications/mes-brouillons")
    public ResponseEntity<List<CertificationResponse>> getMesBrouillons(
            @AuthenticationPrincipal UserDetails user) {
        return ResponseEntity.ok(certificationService.getMesBrouillons(user.getUsername()));
    }

    @GetMapping("/certifications/all")
    public ResponseEntity<List<CertificationResponse>> allCertifications() {
        return ResponseEntity.ok(certificationService.getAllCertifications());
    }

    /**
     * Liste tous les fichiers présents dans le dossier uploads/formations/
     * Retourne [{formationNom, formationUrl}] pour alimenter la bibliothèque
     * de formations dans CreerCertification.jsx
     */
    @GetMapping("/formations/all")
    public ResponseEntity<List<java.util.Map<String, String>>> listerFormations() {
        return ResponseEntity.ok(certificationService.listerFichiersFormations());
    }

    @GetMapping("/certifications/actives")
    public ResponseEntity<List<CertificationResponse>> getCertificationsActives() {
        return ResponseEntity.ok(certificationService.getAllCertificationsActives());
    }

    @GetMapping("/certifications/active")
    public ResponseEntity<?> certificationActive() {
        try {
            return ResponseEntity.ok(certificationService.getCertificationActive());
        } catch (Exception e) {
            return ResponseEntity.ok(null);
        }
    }

    @GetMapping("/certifications")
    public ResponseEntity<List<CertificationResponse>> mesCertifications(
            @AuthenticationPrincipal UserDetails user) {
        return ResponseEntity.ok(certificationService.getMesCertifications(user.getUsername()));
    }

    @GetMapping("/certifications/{id}")
    public ResponseEntity<?> getCertification(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(certificationService.getCertificationById(id));
        } catch (Exception e) {
            return ResponseEntity.notFound().build(); // 404 au lieu de 400
        }
    }

    @PostMapping("/certifications/{id}/activer")
    @Operation(summary = "Activer une qualification (plusieurs peuvent être actives)")
    public ResponseEntity<CertificationResponse> activerCertification(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails user) {
        verifierDroitCertif(user.getUsername());
        return ResponseEntity.ok(certificationService.activerCertification(id));
    }

    @PostMapping("/certifications/{id}/desactiver")
    @Operation(summary = "Désactiver une qualification")
    public ResponseEntity<CertificationResponse> desactiverCertification(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails user) {
        verifierDroitCertif(user.getUsername());
        return ResponseEntity.ok(certificationService.desactiverCertification(id));
    }

    @PutMapping("/certifications/{id}")
    public ResponseEntity<CertificationResponse> modifierCertification(
            @PathVariable Long id,
            @RequestBody CreerCertificationRequest req,
            @AuthenticationPrincipal UserDetails user) {
        verifierDroitCertif(user.getUsername());
        return ResponseEntity.ok(certificationService.modifierCertification(id, req));
    }

    @DeleteMapping("/certifications/{id}")
    public ResponseEntity<Void> supprimerCertification(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails user) {
        verifierDroitCertif(user.getUsername());
        certificationService.supprimerCertification(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/certifications/{id}/upload-formation")
    public ResponseEntity<CertificationResponse> uploadFormation(
            @PathVariable Long id,
            @RequestBody Map<String, String> body,
            @AuthenticationPrincipal UserDetails user) {
        verifierDroitCertif(user.getUsername());
        return ResponseEntity.ok(certificationService.uploadFormation(id, body.get("base64"), body.get("nom")));
    }

    @PostMapping("/certifications/{id}/upload-certificat")
    public ResponseEntity<CertificationResponse> uploadCertificatVide(
            @PathVariable Long id,
            @RequestBody Map<String, String> body,
            @AuthenticationPrincipal UserDetails user) {
        verifierDroitCertif(user.getUsername());
        return ResponseEntity.ok(certificationService.uploadCertificatVide(id, body.get("base64"), body.get("nom")));
    }

    @PostMapping("/certifications/{id}/copier-formation")
    public ResponseEntity<CertificationResponse> copierFormation(
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {
        return ResponseEntity.ok(certificationService.copierFormation(id, body.get("formationUrl"), body.get("formationNom")));
    }

    // ═════════════════════════════════════════════════════════
    // E. PASSAGES
    // ═════════════════════════════════════════════════════════

    @GetMapping("/passages/all")
    public ResponseEntity<List<PassageResponse>> allPassages() {
        return ResponseEntity.ok(passageService.getAllPassages());
    }

    /**
     * SPRINT 2 : L'expert valide ou invalide le rapport avec un score.
     * Body : { valide: true/false, commentaire: "...", score: 85.0 }
     * → Si validé : passage passe à REUSSI, l'expert peut ensuite générer le certificat
     */
    @PostMapping("/passages/{passageId}/valider-pratique")
    @Operation(summary = "L'expert valide ou invalide le rapport pratique (avec score)")
    public ResponseEntity<PassageResponse> validerRapportPratique(
            @PathVariable Long passageId,
            @RequestBody Map<String, Object> body,
            @AuthenticationPrincipal UserDetails user) {
        verifierDroitCertif(user.getUsername());
        boolean valide = Boolean.parseBoolean(body.getOrDefault("valide", false).toString());
        String commentaire = (String) body.getOrDefault("commentaire", "");
        Double score = null;
        if (body.get("score") != null) {
            try { score = Double.parseDouble(body.get("score").toString()); } catch (Exception ignored) {}
        }
        return ResponseEntity.ok(passageService.validerRapportPratique(passageId, valide, commentaire, score));
    }
    /**
     * NOUVEAU : Générer le certificat PDF après validation du rapport pratique.
     * Accessible uniquement pour les passages au statut REUSSI.
     * POST /api/expert-audit/passages/{passageId}/generer-certificat
     */
    @PostMapping("/passages/{passageId}/generer-certificat")
    @Operation(summary = "Générer le certificat PDF pour un auditeur qualifié")
    public ResponseEntity<PassageResponse> genererCertificat(
            @PathVariable Long passageId,
            @AuthenticationPrincipal UserDetails user) {
        verifierDroitCertif(user.getUsername());
        return ResponseEntity.ok(passageService.genererCertificat(passageId, user.getUsername()));
    }

    /**
     * NOUVEAU : Envoyer le certificat généré au chef de service pour validation.
     * POST /api/expert-audit/passages/{passageId}/envoyer-certificat-chef
     * Body : { chefServiceId: 5, remarqueExpert: "..." }
     */
    @PostMapping("/passages/{passageId}/envoyer-certificat-chef")
    @Operation(summary = "Envoyer le certificat au chef de service pour validation")
    public ResponseEntity<PassageResponse> envoyerCertificatAuChef(
            @PathVariable Long passageId,
            @RequestBody EnvoyerCertificatChefRequest req,
            @AuthenticationPrincipal UserDetails user) {
        verifierDroitCertif(user.getUsername());
        return ResponseEntity.ok(passageService.envoyerCertificatAuChef(passageId, req, user.getUsername()));
    }

    /**
     * NOUVEAU : Lister les passages dont le certificat a été généré (historique expert).
     * GET /api/expert-audit/passages/avec-certificat
     */
    @GetMapping("/passages/avec-certificat")
    @Operation(summary = "Lister les passages avec un certificat généré (historique expert)")
    public ResponseEntity<List<PassageResponse>> passagesAvecCertificat(
            @AuthenticationPrincipal UserDetails user) {
        return ResponseEntity.ok(passageService.getPassagesAvecCertificat(user.getUsername()));
    }

    /**
     * NOUVEAU : Télécharger le certificat PDF d'un passage.
     * GET /api/expert-audit/passages/{passageId}/certificat/download
     */
    @GetMapping("/passages/{passageId}/certificat/download")
    public ResponseEntity<Resource> downloadCertificat(@PathVariable Long passageId) {
        PassageResponse passage = passageService.getAllPassages().stream()
                .filter(p -> p.getId().equals(passageId))
                .findFirst()
                .orElseThrow(() -> new BusinessException("Passage introuvable."));

        String pdfNom = passage.getCertificatPdfPath();
        if (pdfNom == null || pdfNom.isBlank())
            throw new BusinessException("Aucun certificat généré pour ce passage.");

        // Chercher dans tous les emplacements possibles
        Path filePath = null;
        for (String dir : new String[]{
                CERTIFICATS_AUDITEUR_DIR,
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
    @GetMapping("/passages/{passageId}/certificat/view")
    public ResponseEntity<Resource> viewCertificat(@PathVariable Long passageId) {
        PassageResponse passage = passageService.getAllPassages().stream()
                .filter(p -> p.getId().equals(passageId))
                .findFirst()
                .orElseThrow(() -> new BusinessException("Passage introuvable."));

        String pdfNom = passage.getCertificatPdfPath();
        if (pdfNom == null || pdfNom.isBlank())
            throw new BusinessException("Aucun certificat généré pour ce passage.");

        Path filePath = null;
        for (String dir : new String[]{
                CERTIFICATS_AUDITEUR_DIR,
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

    @PostMapping("/passages/{passageId}/debloquer")
    public ResponseEntity<PassageResponse> debloquerAuditeur(
            @PathVariable Long passageId,
            @RequestBody(required = false) Map<String, Object> body,
            @AuthenticationPrincipal UserDetails user) {
        verifierDroitCertif(user.getUsername());
        String cause = body != null ? (String) body.getOrDefault("cause", "") : "";
        if (cause == null || cause.isBlank())
            throw new BusinessException("La cause du déblocage est obligatoire.");
        return ResponseEntity.ok(
                passageService.debloquerAuditeur(passageId, cause, user.getUsername()));
    }
    @PostMapping("/certifications/{id}/fix-formation")
    public ResponseEntity<?> fixFormation(
            @PathVariable Long id,
            @RequestBody Map<String, String> body,
            @AuthenticationPrincipal UserDetails user) {
        verifierDroitCertif(user.getUsername());
        return ResponseEntity.ok(
                certificationService.fixerFormation(id, body.get("formationUrl"), body.get("formationNom"))
        );
    }

    // ═════════════════════════════════════════════════════════
    // F. CLIENTS (pour l'étape de sélection client)
    // ═════════════════════════════════════════════════════════

    @GetMapping("/clients")
    public ResponseEntity<List<ClientResponse>> getClients() {
        return ResponseEntity.ok(clientService.getGroupesActifs()); // ← seulement les groupes
    }
    @PostMapping("/tests-pratiques/init-generique")
    @Operation(summary = "Crée le test pratique générique 'sans défauts' s'il n'existe pas encore")
    public ResponseEntity<TestPratiqueResponse> initTestGenerique(
            @AuthenticationPrincipal UserDetails user) {
        verifierDroitCertif(user.getUsername());
        Utilisateur expert = utilisateurRepo.findByMatricule(user.getUsername())
                .orElseThrow(() -> new BusinessException("Expert introuvable."));
        TestPratique tp = pratiqueService.getOrCreateTestSansDefauts(expert);
        return ResponseEntity.ok(pratiqueService.toResponse(tp));
    }
    // ═════════════════════════════════════════════════════════
    // G. DONNÉES PLANIFICATION
    // ═════════════════════════════════════════════════════════

    @GetMapping("/segments/{segmentId}/projets")
    public ResponseEntity<List<ProjetResponse>> getProjetsBySegment(@PathVariable Integer segmentId) {
        return ResponseEntity.ok(projetService.getBySegmentId(segmentId));
    }

    @GetMapping("/projets/{projetId}/series-actives")
    public ResponseEntity<List<SerieResponse>> getSeriesActivesByProjet(@PathVariable Integer projetId) {
        return ResponseEntity.ok(serieService.getByProjetActives(projetId));
    }

    @GetMapping("/mes-plants-site")
    public ResponseEntity<List<PlantResponse>> getMesPlantsSite(@AuthenticationPrincipal UserDetails user) {
        Utilisateur u = utilisateurRepo.findByMatricule(user.getUsername())
                .orElseThrow(() -> new BusinessException("Utilisateur introuvable."));
        Integer siteId = null;
        if (u.getPlant() != null && u.getPlant().getSite() != null)
            siteId = u.getPlant().getSite().getId();
        else if (u.getSite() != null)
            siteId = u.getSite().getId();
        if (siteId == null) return ResponseEntity.ok(Collections.emptyList());
        return ResponseEntity.ok(plantService.getPlantsBySiteId(siteId));
    }

    // ═════════════════════════════════════════════════════════
    // HELPERS PRIVÉS
    // ═════════════════════════════════════════════════════════
    private TestTheoriqueResponse getTestTheoriqueActifSafe() {
        try { return testService.getTestActif(); } catch (Exception e) { return null; }
    }

    private TestPratiqueResponse getTestPratiqueActifSafe() {
        try { return pratiqueService.getTestPratiqueActif(); } catch (Exception e) { return null; }
    }

    private CertificationResponse getCertificationActiveSafe() {
        try { return certificationService.getCertificationActive(); } catch (Exception e) { return null; }
    }
    @GetMapping("/chefs-service")
    @Operation(summary = "Liste des chefs de service (uniquement inscrits) pour l'envoi de certificat")

    public ResponseEntity<List<UtilisateurResponse>> getChefsService() {
        List<Utilisateur> chefs = utilisateurRepo.findByRole(RoleUser.CHEF_SERVICE)
                .stream()
                .filter(u -> Boolean.TRUE.equals(u.getActif())) // ⬅️ filtre sur actif
                .collect(Collectors.toList());
        List<UtilisateurResponse> response = chefs.stream()
                .map(u -> {
                    UtilisateurResponse dto = new UtilisateurResponse();
                    dto.setId(u.getId());
                    dto.setNom(u.getNom());
                    dto.setPrenom(u.getPrenom());
                    dto.setMatricule(u.getMatricule());
                    dto.setEmail(u.getEmail());
                    dto.setRole(u.getRole().name());
                    dto.setActif(u.getActif());
                    dto.setTelephone(u.getTelephone());
                    dto.setPeutCreerCertif(u.getPeutCreerCertif());
                    // Ne pas setter inscrit car il n'existe pas
                    if (u.getSite() != null) {
                        dto.setSiteId(u.getSite().getId());
                        dto.setSiteNom(u.getSite().getNom());
                        dto.setSiteLocalisation(u.getSite().getLocalisation());
                    }
                    if (u.getPlant() != null) {
                        dto.setPlantId(u.getPlant().getId());
                        dto.setPlantNom(u.getPlant().getNom());
                    }
                    return dto;
                })
                .collect(Collectors.toList());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/certifications/formations")
    public ResponseEntity<List<java.util.Map<String, String>>> listerFormationsPourCertif() {
        return ResponseEntity.ok(certificationService.listerFichiersFormations());
    }

    /**
     * Upload d'une formation directement depuis le PanelParams
     * POST /api/expert-audit/certifications/{id}/formation/upload
     * Body : { base64: "...", nomFichier: "formation.pdf" }
     */
    @PostMapping("/certifications/{id}/formation/upload")
    public ResponseEntity<CertificationResponse> uploadFormationDepuisPanel(
            @PathVariable Long id,
            @RequestBody Map<String, String> body,
            @AuthenticationPrincipal UserDetails user) {
        verifierDroitCertif(user.getUsername());
        String base64     = body.get("base64");
        String nomFichier = body.get("nomFichier");
        if (base64 == null || nomFichier == null)
            throw new com.leoni.pap.exception.BusinessException("base64 et nomFichier sont requis.");
        return ResponseEntity.ok(certificationService.uploadFormation(id, base64, nomFichier));
    }

    /**
     * Liste tous les modèles de certificats PDF dans uploads/certificats/
     * Retourne [{certifNom, certifUrl}] pour la bibliothèque étape 4
     * GET /api/expert-audit/certifications/modeles-certif/all
     */
    @GetMapping("/certifications/modeles-certif/all")
    public ResponseEntity<List<java.util.Map<String, String>>> listerModelesCertificats() {
        return ResponseEntity.ok(certificationService.listerModelesCertificats());
    }

    /**
     * Copier un modèle de certificat existant vers une certification
     * (même pattern que copierFormation)
     * POST /api/expert-audit/certifications/{id}/copier-certif
     * Body : { certifUrl: "...", certifNom: "..." }
     */
    @PostMapping("/certifications/{id}/copier-certif")
    public ResponseEntity<CertificationResponse> copierModelesCertif(
            @PathVariable Long id,
            @RequestBody Map<String, String> body,
            @AuthenticationPrincipal UserDetails user) {
        verifierDroitCertif(user.getUsername());
        return ResponseEntity.ok(
                certificationService.copierCertificatVide(id, body.get("certifUrl"), body.get("certifNom"))
        );
    }

    @GetMapping("/passages/{passageId}/reponses-theoriques")
    @Operation(summary = "Récupérer les réponses au test théorique d'un auditeur")
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
    public ResponseEntity<List<ClassementAuditeurResponse>> getClassementAuditeurs(
            @PathVariable Long certifId) {

        List<ClassementAuditeurResponse> classement =
                certificationService.getClassementAuditeurs(certifId);
        return ResponseEntity.ok(classement);
    }




}