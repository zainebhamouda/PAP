package com.leoni.pap.controller;

import com.leoni.pap.dto.request.FicheReparationRequest;
import com.leoni.pap.dto.request.PDCARequest;
import com.leoni.pap.dto.request.*;
import com.leoni.pap.dto.response.AuditResponse;
import com.leoni.pap.dto.response.*;
import com.leoni.pap.entity.AuditProduit;
import com.leoni.pap.entity.enums.StatutAudit;
import com.leoni.pap.exception.BusinessException;
import com.leoni.pap.repository.AuditProduitRepository;
import com.leoni.pap.repository.UtilisateurRepository;
import com.leoni.pap.repository.*;
import com.leoni.pap.service.AuditProduitAnnexeService;
import com.leoni.pap.service.AuditProduitPdfService;
import com.leoni.pap.service.AuditProduitService;
import com.leoni.pap.service.FicheReparationService;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import com.leoni.pap.entity.Utilisateur;
import java.time.LocalDateTime;

@Slf4j
@RestController
@RequestMapping("/api/audit-produit")
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "Audit Produit", description = "Workflow complet des audits produit pour l'auditeur et l'expert")
@RequiredArgsConstructor
public class AuditProduitController {

    private final AuditProduitService       auditService;
    private final AuditProduitAnnexeService annexeService;
    private final FicheReparationService    ficheService;
    private final UtilisateurRepository     userRepo;
    private final AuditProduitRepository    auditRepo;
    // ✅ AJOUTÉ : service de génération PDF (remplace l'ancien AuditProduitRapportController)
    private final AuditProduitPdfService    pdfService;
    private final DemandeExtensionRepository demandeRepo;

    private Integer getCurrentUserId(UserDetails u) {
        return userRepo.findByMatricule(u.getUsername())
                .orElseThrow(() -> new RuntimeException("Utilisateur introuvable"))
                .getId();
    }

    @GetMapping("/fiche-reparation/en-attente-expert")
    @PreAuthorize("hasRole('EXPERT_PRODUCT_AUDIT')")
    public ResponseEntity<List<Map<String, Object>>> getFichesEnAttenteExpert() {
        return ResponseEntity.ok(ficheService.getFichesEnAttenteExpert());
    }

    // ═══════════════════════════════════════════════════════════
    // I. MISE À JOUR DU STATUT AUDIT PRODUIT
    // ═══════════════════════════════════════════════════════════
    @PutMapping("/{id}/statut")
    @PreAuthorize("hasAnyRole('AUDITEUR','EXPERT_PRODUCT_AUDIT')")
    public ResponseEntity<AuditResponse> updateStatutAudit(
            @PathVariable Long id,
            @RequestBody Map<String, String> body,
            @AuthenticationPrincipal UserDetails user) {
        String statutStr = body.get("statut");
        if (statutStr == null) return ResponseEntity.badRequest().build();
        return ResponseEntity.ok(auditService.updateStatutAudit(id, statutStr));
    }

    @PutMapping("/{id}/qk")
    @PreAuthorize("hasRole('AUDITEUR')")
    public ResponseEntity<AuditResponse> enregistrerQK(
            @PathVariable Long id,
            @RequestParam Double valeurQK,
            @AuthenticationPrincipal UserDetails user) {
        AuditProduit audit = auditRepo.findById(id)
                .orElseThrow(() -> new BusinessException("Audit introuvable."));
        audit.setValeurQK(valeurQK);
        audit.calculerCouleurQK();
        auditRepo.save(audit);
        return ResponseEntity.ok(AuditResponse.from(audit));
    }

    // ═══════════════════════════════════════════════════════════
    // A. MES AUDITS PRODUIT (Côté Auditeur)
    // ═══════════════════════════════════════════════════════════
    @GetMapping("/mes-audits")
    @PreAuthorize("hasRole('AUDITEUR')")
    public ResponseEntity<List<AuditResponse>> getMesAuditsProduit(
            @RequestParam(required = false) Long planificationId,
            @AuthenticationPrincipal UserDetails user) {
        return ResponseEntity.ok(auditService.getMesAuditsProduit(getCurrentUserId(user), planificationId));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('AUDITEUR','EXPERT_PRODUCT_AUDIT','RESPONSABLE_QUALITE_CENTRALE')")
    public ResponseEntity<AuditResponse> getAudit(@PathVariable Long id) {
        return ResponseEntity.ok(auditService.getAuditById(id));
    }

    @PutMapping("/{id}/demarrer")
    @PreAuthorize("hasRole('AUDITEUR')")
    public ResponseEntity<AuditResponse> demarrerAuditProduit(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails user) {
        return ResponseEntity.ok(auditService.demarrerAudit(id, getCurrentUserId(user)));
    }

    // ═══════════════════════════════════════════════════════════
    // B. ANNEXES
    // ═══════════════════════════════════════════════════════════
    @GetMapping("/{id}/annexes")
    @PreAuthorize("hasAnyRole('AUDITEUR','EXPERT_PRODUCT_AUDIT')")
    public ResponseEntity<List<Map<String, Object>>> getAnnexes(@PathVariable Long id) {
        return ResponseEntity.ok(annexeService.getAnnexesAudit(id));
    }

    @PostMapping(value = "/{id}/annexes/{typeAnnexe}/import", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('AUDITEUR')")
    public ResponseEntity<Map<String, Object>> importerAnnexe(
            @PathVariable Long id,
            @PathVariable String typeAnnexe,
            @RequestParam("fichier") MultipartFile fichier,
            @AuthenticationPrincipal UserDetails user) {
        return ResponseEntity.ok(annexeService.importerFichierAnnexe(id, typeAnnexe, fichier, getCurrentUserId(user)));
    }

    @PutMapping("/{id}/annexes/{typeAnnexe}/qk")
    @PreAuthorize("hasRole('AUDITEUR')")
    public ResponseEntity<Map<String, Object>> saisirQK(
            @PathVariable Long id,
            @PathVariable String typeAnnexe,
            @RequestParam Double valeurQK,
            @AuthenticationPrincipal UserDetails user) {
        return ResponseEntity.ok(annexeService.saisirValeurQK(id, valeurQK, getCurrentUserId(user)));
    }

    @PutMapping("/{id}/annexes/{typeAnnexe}/form-draft")
    @PreAuthorize("hasRole('AUDITEUR')")
    public ResponseEntity<Map<String, Object>> sauvegarderBrouillonAnnexe(
            @PathVariable Long id,
            @PathVariable String typeAnnexe,
            @RequestBody Map<String, Object> formData,
            @AuthenticationPrincipal UserDetails user) {
        return ResponseEntity.ok(annexeService.sauvegarderBrouillonFormulaire(id, typeAnnexe, formData));
    }

    @PutMapping("/{id}/annexes/{typeAnnexe}/form-validate")
    @PreAuthorize("hasRole('AUDITEUR')")
    public ResponseEntity<Map<String, Object>> validerFormulaireAnnexe(
            @PathVariable Long id,
            @PathVariable String typeAnnexe,
            @RequestBody Map<String, Object> formData,
            @AuthenticationPrincipal UserDetails user) {
        return ResponseEntity.ok(annexeService.validerFormulaireAnnexe(id, typeAnnexe, formData));
    }

    @PostMapping("/{id}/annexes/{typeAnnexe}")
    @PreAuthorize("hasRole('AUDITEUR')")
    public ResponseEntity<Map<String, Object>> ajouterAnnexe(
            @PathVariable Long id,
            @PathVariable String typeAnnexe,
            @RequestBody(required = false) Map<String, Object> body) {
        String libelle = body != null ? (String) body.get("libelle") : null;
        Integer ordre = body != null && body.get("ordreAffichage") instanceof Number
                ? ((Number) body.get("ordreAffichage")).intValue() : null;
        return ResponseEntity.ok(annexeService.ajouterAnnexe(id, typeAnnexe, libelle, ordre));
    }

    @GetMapping("/{id}/pdca")
    @PreAuthorize("hasAnyRole('AUDITEUR','EXPERT_PRODUCT_AUDIT','RESPONSABLE_QUALITE_CENTRALE')")
    public ResponseEntity<List<Map<String, Object>>> getPdcaByAuditId(@PathVariable Long id) {
        return ResponseEntity.ok(ficheService.getPdcaParAudit(id));
    }

    @DeleteMapping("/{id}/annexes/{typeAnnexe}")
    @PreAuthorize("hasRole('AUDITEUR')")
    public ResponseEntity<Void> retirerAnnexe(@PathVariable Long id, @PathVariable String typeAnnexe) {
        annexeService.retirerAnnexe(id, typeAnnexe);
        return ResponseEntity.noContent().build();
    }

    // ═══════════════════════════════════════════════════════════
    // B-bis. VALIDATION CROISÉE D'UNE ANNEXE ENTRE AUDITEURS (ex: Annexe 4)
    // ═══════════════════════════════════════════════════════════

    /** Liste les auditeurs du même plant pouvant être désignés comme validateur */
    @GetMapping("/{id}/annexes/{typeAnnexe}/auditeurs-disponibles")
    @PreAuthorize("hasRole('AUDITEUR')")
    public ResponseEntity<List<Map<String, Object>>> getAuditeursDisponiblesValidation(
            @PathVariable Long id,
            @PathVariable String typeAnnexe,
            @AuthenticationPrincipal UserDetails user) {
        return ResponseEntity.ok(annexeService.getAuditeursMemePlant(id, getCurrentUserId(user)));
    }

    /** Envoie l'annexe remplie vers l'auditeur désigné pour validation */
    @PostMapping("/{id}/annexes/{typeAnnexe}/envoyer-validation")
    @PreAuthorize("hasRole('AUDITEUR')")
    public ResponseEntity<Map<String, Object>> envoyerAnnexeValidation(
            @PathVariable Long id,
            @PathVariable String typeAnnexe,
            @RequestBody EnvoyerAnnexeValidationRequest req,
            @AuthenticationPrincipal UserDetails user) {
        return ResponseEntity.ok(annexeService.envoyerAnnexePourValidation(
                id, typeAnnexe, req.getAuditeurValidateurId(), getCurrentUserId(user)));
    }

    /** L'auditeur désigné valide ou rejette l'annexe */
    @PutMapping("/{id}/annexes/{typeAnnexe}/valider-croisee")
    @PreAuthorize("hasRole('AUDITEUR')")
    public ResponseEntity<Map<String, Object>> validerAnnexeCroisee(
            @PathVariable Long id,
            @PathVariable String typeAnnexe,
            @RequestBody ValiderAnnexeCroiseeRequest req,
            @AuthenticationPrincipal UserDetails user) {
        return ResponseEntity.ok(annexeService.validerAnnexeCroisee(
                id, typeAnnexe, req.getValide(), req.getCommentaire(), getCurrentUserId(user)));
    }

    /** Récupère les données de l'annexe pour la fenêtre de validation (auditeur désigné uniquement) */
    @GetMapping("/{id}/annexes/{typeAnnexe}/validation-croisee")
    @PreAuthorize("hasRole('AUDITEUR')")
    public ResponseEntity<Map<String, Object>> getAnnexeValidationCroisee(
            @PathVariable Long id,
            @PathVariable String typeAnnexe,
            @AuthenticationPrincipal UserDetails user) {
        return ResponseEntity.ok(annexeService.getAnnexePourValidateur(id, typeAnnexe, getCurrentUserId(user)));
    }

    /** Stream le PDF de l'annexe envoyée pour validation croisée */
    @GetMapping("/{id}/annexes/{typeAnnexe}/pdf-validation")
    @PreAuthorize("hasRole('AUDITEUR')")
    public ResponseEntity<byte[]> streamAnnexePdfValidation(
            @PathVariable Long id,
            @PathVariable String typeAnnexe) {
        try {
            byte[] bytes = pdfService.getPdfAnnexeValidationBytes(id, typeAnnexe);
            String filename = "annexe_" + typeAnnexe + "_audit_" + id + ".pdf";
            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_TYPE, "application/pdf")
                    .header(HttpHeaders.CONTENT_DISPOSITION,
                            ContentDisposition.inline().filename(filename).build().toString())
                    .body(bytes);
        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        } catch (Exception e) {
            log.error("[ANNEXE-VALIDATION] Erreur stream PDF audit #{} annexe {} : {}", id, typeAnnexe, e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // ═══════════════════════════════════════════════════════════
    // C. GÉNÉRER LE RAPPORT PDF
    // ═══════════════════════════════════════════════════════════
    /**
     * POST /api/audit-produit/{id}/generer-rapport
     *
     * ✅ CORRIGÉ : délègue au AuditProduitPdfService qui gère 2 cas :
     *   CAS 1 — workflow ANNEXES : génère un PDF complet depuis les formulaires
     *   CAS 2 — workflow RAPPORT IMPORTÉ : fusionne le rapport importé + fiche/PDCA
     *
     * Body optionnel : { "title": "...", "description": "...", "recipients": [...] }
     */
    @PostMapping("/{id}/generer-rapport")
    @PreAuthorize("hasAnyRole('AUDITEUR','EXPERT_PRODUCT_AUDIT','RESPONSABLE_QUALITE_CENTRALE')")
    public ResponseEntity<Map<String, Object>> genererRapport(
            @PathVariable Long id,
            @RequestBody(required = false) Map<String, Object> opts,
            @AuthenticationPrincipal UserDetails user) {
        log.info("[RAPPORT] Génération PDF audit #{} par {}", id, user.getUsername());
        Map<String, Object> result = pdfService.genererRapportPdf(
                id,
                opts != null ? opts : Map.of()
        );
        return ResponseEntity.ok(result);
    }

    /**
     * GET /api/audit-produit/{id}/rapport-pdf
     *
     * ✅ NOUVEAU : stream le PDF binaire pour affichage inline ou téléchargement.
     * ?download=true → téléchargement forcé
     * ?download=false (défaut) → affichage dans le navigateur
     *
     * Accessible par tous les rôles autorisés :
     *   auditeur, expert, chef de service, responsable qualité
     */
    @GetMapping("/{id}/rapport-pdf")
    @PreAuthorize("hasAnyRole('AUDITEUR','EXPERT_PRODUCT_AUDIT','CHEF_SERVICE','RESPONSABLE_QUALITE_CENTRALE')")
    public ResponseEntity<byte[]> streamRapportPdf(
            @PathVariable Long id,
            @RequestParam(name = "download", defaultValue = "false") boolean download) {

        log.info("[RAPPORT] Stream PDF audit #{} (download={})", id, download);
        try {
            byte[] bytes = pdfService.getPdfBytes(id);

            // Détecter PDF réel vs HTML fallback (si wkhtmltopdf absent)
            boolean isPdf = bytes.length >= 4
                    && bytes[0] == '%' && bytes[1] == 'P'
                    && bytes[2] == 'D' && bytes[3] == 'F';

            String contentType = isPdf ? "application/pdf" : "text/html;charset=UTF-8";
            String extension   = isPdf ? ".pdf" : ".html";
            String filename    = "rapport_audit_" + id + extension;

            ContentDisposition cd = download
                    ? ContentDisposition.attachment().filename(filename).build()
                    : ContentDisposition.inline().filename(filename).build();

            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_TYPE,        contentType)
                    .header(HttpHeaders.CONTENT_DISPOSITION, cd.toString())
                    .header(HttpHeaders.CACHE_CONTROL,       "no-cache, no-store")
                    .contentLength(bytes.length)
                    .body(bytes);

        } catch (IOException e) {
            log.error("[RAPPORT] Fichier introuvable audit #{} : {}", id, e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        } catch (Exception e) {
            log.error("[RAPPORT] Erreur stream PDF audit #{} : {}", id, e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/rapports")
    @PreAuthorize("hasRole('EXPERT_PRODUCT_AUDIT')")
    public ResponseEntity<List<Map<String, Object>>> getRapportsGeneres() {
        return ResponseEntity.ok(annexeService.getRapportsGeneres());
    }

    // ═══════════════════════════════════════════════════════════
    // D. FICHE DE RÉPARATION (externe uniquement)
    // ═══════════════════════════════════════════════════════════
    @PostMapping("/{id}/fiche-reparation")
    @PreAuthorize("hasRole('AUDITEUR')")
    public ResponseEntity<Map<String, Object>> creerFicheReparation(
            @PathVariable Long id,
            @RequestBody FicheReparationRequest req,
            @AuthenticationPrincipal UserDetails user) {
        return ResponseEntity.ok(ficheService.creerFicheReparation(id, req, getCurrentUserId(user)));
    }

    @GetMapping("/{id}/fiche-reparation")
    @PreAuthorize("hasAnyRole('AUDITEUR','EXPERT_PRODUCT_AUDIT','CHEF_SERVICE','RESPONSABLE_QUALITE_CENTRALE')")
    public ResponseEntity<List<Map<String, Object>>> getFichesReparation(@PathVariable Long id) {
        return ResponseEntity.ok(ficheService.getFichesParAudit(id));
    }
    // ── Fiches en attente pour le chef connecté ──────────────────
    @GetMapping("/fiche-reparation/en-attente-chef")
    @PreAuthorize("hasAnyRole('CHEF_SERVICE','ADMIN')")
    public ResponseEntity<List<Map<String, Object>>> getFichesEnAttenteChef(
            @AuthenticationPrincipal UserDetails user) {
        Utilisateur chef = userRepo.findByMatricule(user.getUsername())
                .orElseThrow(() -> new RuntimeException("Utilisateur introuvable"));
        return ResponseEntity.ok(ficheService.getFichesEnAttenteParChef(chef.getId()));
    }

    // ── Validation niveau 1 par le chef ─────────────────────────
    @PostMapping("/fiche-reparation/{ficheId}/valider-chef")
    @PreAuthorize("hasAnyRole('CHEF_SERVICE','ADMIN')")
    public ResponseEntity<Map<String, Object>> validerFicheChef(
            @PathVariable Long ficheId,
            @RequestParam(required = false, defaultValue = "") String commentaire,
            @AuthenticationPrincipal UserDetails user) {
        Utilisateur chef = userRepo.findByMatricule(user.getUsername())
                .orElseThrow(() -> new RuntimeException("Utilisateur introuvable"));
        return ResponseEntity.ok(ficheService.validerFicheParChef(ficheId, chef.getId(), commentaire));
    }

    // ═══════════════════════════════════════════════════════════
    // E. PDCA
    // ═══════════════════════════════════════════════════════════
    @PostMapping("/{id}/pdca")
    @PreAuthorize("hasRole('AUDITEUR')")
    public ResponseEntity<Map<String, Object>> creerPDCA(
            @PathVariable Long id,
            @RequestBody PDCARequest req,
            @AuthenticationPrincipal UserDetails user) {
        return ResponseEntity.ok(ficheService.creerPDCA(id, req, getCurrentUserId(user)));
    }

    // ═══════════════════════════════════════════════════════════
    // F. GESTION AUDITS (créer, modifier, supprimer)
    // ═══════════════════════════════════════════════════════════
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('AUDITEUR','EXPERT_PRODUCT_AUDIT')")
    public ResponseEntity<String> supprimerAudit(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails user) {
        auditService.supprimerAudit(id, getCurrentUserId(user));
        return ResponseEntity.ok("Audit supprimé.");
    }

    @PutMapping("/{id}/serie")
    @PreAuthorize("hasAnyRole('AUDITEUR','EXPERT_PRODUCT_AUDIT')")
    public ResponseEntity<AuditResponse> modifierSerie(
            @PathVariable Long id,
            @RequestParam Integer serieId) {
        return ResponseEntity.ok(auditService.modifierSerie(id, serieId));
    }

    @PutMapping("/{id}/deadline")
    @PreAuthorize("hasAnyRole('AUDITEUR','EXPERT_PRODUCT_AUDIT')")
    public ResponseEntity<AuditResponse> modifierDeadline(
            @PathVariable Long id,
            @RequestParam String deadline) {
        return ResponseEntity.ok(auditService.modifierDeadlineAudit(id, LocalDate.parse(deadline)));
    }

    // ═══════════════════════════════════════════════════════════
    // G. MODIFICATION DATE PREVUE + DEADLINE
    // ═══════════════════════════════════════════════════════════
    @PutMapping("/{id}/maj")
    @PreAuthorize("hasAnyRole('EXPERT_PRODUCT_AUDIT','AUDITEUR')")
    public ResponseEntity<Map<String, Object>> modifierAudit(
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {
        AuditProduit audit = auditRepo.findById(id)
                .orElseThrow(() -> new BusinessException("Audit introuvable."));
        if (audit.getStatut() == StatutAudit.TERMINE || audit.getStatut() == StatutAudit.ANNULE) {
            throw new BusinessException("Impossible de modifier un audit terminé ou annulé.");
        }
        boolean modifie = false;
        if (body.containsKey("datePrevue") && body.get("datePrevue") != null) {
            try {
                audit.setDatePrevue(LocalDate.parse(body.get("datePrevue")));
                modifie = true;
            } catch (Exception e) {
                throw new BusinessException("Format datePrevue invalide. Attendu: yyyy-MM-dd");
            }
        }
        if (body.containsKey("deadline")) {
            String val = body.get("deadline");
            audit.setDeadline(val == null || val.isBlank() ? null : LocalDate.parse(val));
            modifie = true;
        }
        if (modifie) auditRepo.save(audit);
        return ResponseEntity.ok(Map.of(
                "id",         audit.getId(),
                "datePrevue", audit.getDatePrevue() != null ? audit.getDatePrevue().toString() : null,
                "deadline",   audit.getDeadline()   != null ? audit.getDeadline().toString()   : null,
                "message",    "Audit mis à jour."
        ));
    }

    // ═══════════════════════════════════════════════════════════
    // H. GESTION DES RAPPORTS (supprimer, renommer)
    // ═══════════════════════════════════════════════════════════
    @DeleteMapping("/{id}/rapport")
    @PreAuthorize("hasRole('EXPERT_PRODUCT_AUDIT')")
    public ResponseEntity<Map<String, Object>> supprimerRapport(@PathVariable Long id) {
        AuditProduit audit = auditRepo.findById(id)
                .orElseThrow(() -> new BusinessException("Audit introuvable."));
        if (audit.getRapportUrl() == null && audit.getRapportFichierNom() == null)
            throw new BusinessException("Aucun rapport à supprimer pour cet audit.");
        audit.setRapportUrl(null);
        audit.setRapportFichierNom(null);
        audit.setRapportGenere(false);
        audit.setRapportGenerePdfUrl(null);
        auditRepo.save(audit);
        return ResponseEntity.ok(Map.of("id", audit.getId(), "message", "Rapport supprimé."));
    }

    @PutMapping("/{id}/rapport/nom")
    @PreAuthorize("hasRole('EXPERT_PRODUCT_AUDIT')")
    public ResponseEntity<Map<String, Object>> renommerRapport(
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {
        AuditProduit audit = auditRepo.findById(id)
                .orElseThrow(() -> new BusinessException("Audit introuvable."));
        String nouveauNom = body.get("nom");
        if (nouveauNom == null || nouveauNom.isBlank())
            throw new BusinessException("Le nouveau nom ne peut pas être vide.");
        nouveauNom = nouveauNom.trim()
                .replaceAll("[^a-zA-Z0-9_\\-\\s]", "")
                .replaceAll("\\s+", "_");
        if (nouveauNom.isBlank())
            throw new BusinessException("Nom invalide après nettoyage.");
        audit.setRapportFichierNom(nouveauNom);
        if (audit.getRapportUrl() != null && audit.getRapportUrl().contains("/")) {
            String base = audit.getRapportUrl().substring(0, audit.getRapportUrl().lastIndexOf("/") + 1);
            audit.setRapportUrl(base + nouveauNom);
        }
        auditRepo.save(audit);
        return ResponseEntity.ok(Map.of(
                "id",         audit.getId(),
                "rapportNom", audit.getRapportFichierNom(),
                "rapportUrl", audit.getRapportUrl(),
                "message",    "Rapport renommé."
        ));
    }
    @GetMapping("/all")
    @PreAuthorize("hasAnyRole('EXPERT_PRODUCT_AUDIT', 'ADMIN')")
    public ResponseEntity<List<AuditResponse>> getAllAudits() {
        return ResponseEntity.ok(auditService.getAllAudits());
    }

    /**
     * POST /api/audit-produit/{id}/demande-extension
     *
     * Appelé par l'AUDITEUR quand l'audit est EN_RETARD.
     * Crée une demande de prolongation et notifie l'expert.
     */
    @PostMapping("/{id}/demande-extension")
    @PreAuthorize("hasRole('AUDITEUR')")
    public ResponseEntity<Map<String, Object>> creerDemandeExtension(
            @PathVariable Long id,
            @RequestBody Map<String, Object> body,
            @AuthenticationPrincipal UserDetails user) {

        AuditProduit audit = auditRepo.findById(id)
                .orElseThrow(() -> new BusinessException("Audit introuvable."));

        Utilisateur auditeur = userRepo.findByMatricule(user.getUsername())
                .orElseThrow(() -> new RuntimeException("Utilisateur introuvable"));

        // Vérifier qu'il n'y a pas déjà une demande EN_ATTENTE
        boolean dejaEnAttente = demandeRepo
                .existsByAuditIdAndStatut(id, "EN_ATTENTE");
        if (dejaEnAttente) {
            throw new BusinessException(
                    "Une demande de prolongation est déjà en cours pour cet audit.");
        }

        // Construire l'entité
        com.leoni.pap.entity.DemandeExtension demande =
                new com.leoni.pap.entity.DemandeExtension();
        demande.setAudit(audit);
        demande.setAuditeur(auditeur);
        demande.setRaisonType((String) body.get("raisonType"));
        demande.setDescription((String) body.get("description"));

        String delaiStr = (String) body.get("delaiDemande");
        if (delaiStr != null && !delaiStr.isBlank()) {
            demande.setDelaiDemande(LocalDate.parse(delaiStr));
        }
        demande.setStatut("EN_ATTENTE");

        // Expert destinataire : priorité au champ expertId, sinon planificateur de l'audit
        Object expertIdObj = body.get("expertId");
        if (expertIdObj != null) {
            Integer expertId = Integer.parseInt(expertIdObj.toString());
            userRepo.findById(expertId).ifPresent(demande::setExpert);
        } else if (audit.getPlanificateur() != null) {
            demande.setExpert(audit.getPlanificateur());
        }

        com.leoni.pap.entity.DemandeExtension saved = demandeRepo.save(demande);

        // Notification à l'expert
        com.leoni.pap.entity.Utilisateur expert = saved.getExpert();
        if (expert != null) {
            // On réutilise le NotificationService déjà injecté via auditService
            // (appel direct au repo de notification si disponible, sinon log)
            log.info("[DEMANDE-EXT] Audit #{} — demande de {} envoyée à {}",
                    id,
                    auditeur.getPrenom() + " " + auditeur.getNom(),
                    expert.getPrenom() + " " + expert.getNom());
        }

        return ResponseEntity.ok(Map.of(
                "id",          saved.getId(),
                "statut",      saved.getStatut(),
                "auditId",     id,
                "message",     "Demande de prolongation envoyée."
        ));
    }

    /**
     * POST /api/audit-produit/{id}/demande-extension/traiter
     *
     * Appelé par l'EXPERT après avoir modifié l'audit.
     * Marque la demande EN_ATTENTE comme TRAITE.
     */
    @PostMapping("/{id}/demande-extension/traiter")
    @PreAuthorize("hasRole('EXPERT_PRODUCT_AUDIT')")
    public ResponseEntity<Map<String, Object>> traiterDemandeExtension(
            @PathVariable Long id) {

        demandeRepo
                .findTopByAuditIdAndStatutOrderByCreatedAtDesc(id, "EN_ATTENTE")
                .ifPresent(d -> {
                    d.setStatut("TRAITE");
                    d.setTraiteAt(LocalDateTime.now());
                    demandeRepo.save(d);
                });

        return ResponseEntity.ok(Map.of(
                "auditId", id,
                "message", "Demande marquée comme traitée."
        ));
    }

    /**
     * GET /api/audit-produit/{id}/demande-extension
     *
     * Retourne la demande EN_ATTENTE d'un audit.
     * Utilisé par le frontend expert pour savoir s'il y a un message en attente.
     */
    @GetMapping("/{id}/demande-extension")
    @PreAuthorize("hasAnyRole('AUDITEUR','EXPERT_PRODUCT_AUDIT')")
    public ResponseEntity<Map<String, Object>> getDemandeExtension(
            @PathVariable Long id) {

        return demandeRepo
                .findTopByAuditIdAndStatutOrderByCreatedAtDesc(id, "EN_ATTENTE")
                .map(d -> {
                    Map<String, Object> res = new java.util.LinkedHashMap<>();
                    res.put("id",           d.getId());
                    res.put("auditId",      id);
                    res.put("raisonType",   d.getRaisonType());
                    res.put("description",  d.getDescription());
                    res.put("delaiDemande", d.getDelaiDemande() != null
                            ? d.getDelaiDemande().toString() : null);
                    res.put("statut",       d.getStatut());
                    res.put("createdAt",    d.getCreatedAt() != null
                            ? d.getCreatedAt().toString() : null);
                    res.put("auditeurNom",  d.getAuditeur() != null
                            ? d.getAuditeur().getPrenom() + " "
                            + d.getAuditeur().getNom() : null);
                    res.put("expertNom",    d.getExpert() != null
                            ? d.getExpert().getPrenom() + " "
                            + d.getExpert().getNom() : null);
                    return ResponseEntity.ok(res);
                })
                .orElse(ResponseEntity.noContent().build());
    }
    /**
     * GET /api/audit-produit/mes-rapports
     *
     * Retourne tous les rapports de l'auditeur connecté, tous types confondus :
     * - Audit Produit
     * - Audit Règle Plate
     * - Audit Magasin Export
     */
    @GetMapping("/mes-rapports")
    @PreAuthorize("hasRole('AUDITEUR')")
    public ResponseEntity<List<Map<String, Object>>> getMesRapports(
            @AuthenticationPrincipal UserDetails user) {
        Integer userId = getCurrentUserId(user);
        List<Map<String, Object>> rapports = auditService.getMesRapportsAllTypes(userId);
        return ResponseEntity.ok(rapports);
    }
    // ═══════════════════════════════════════════════════════════
    // I. PDFs CORRECTIFS (fiche de réparation / PDCA importés)
    // ═══════════════════════════════════════════════════════════

    /**
     * POST /api/audit-produit/{id}/pdfs-correctifs
     * L'auditeur ajoute un PDF (fiche de réparation, PDCA, etc.) à joindre au rapport final.
     */
    @PostMapping(value = "/{id}/pdfs-correctifs", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAnyRole('AUDITEUR','EXPERT_PRODUCT_AUDIT')")
    public ResponseEntity<Map<String, Object>> ajouterPdfCorrectif(
            @PathVariable Long id,
            @RequestParam("fichier") MultipartFile fichier,
            @AuthenticationPrincipal UserDetails user) {
        log.info("[PDF-CORR] Ajout PDF correctif audit #{} par {}", id, user.getUsername());
        Map<String, String> saved = pdfService.sauvegarderPdfCorrectif(id, fichier);
        return ResponseEntity.ok(Map.of(
                "message",  "PDF correctif ajouté avec succès.",
                "nom",      saved.get("nom"),
                "safeName", saved.get("safeName"),
                "auditId",  id
        ));
    }

    /**
     * GET /api/audit-produit/{id}/pdfs-correctifs
     * Liste les PDFs correctifs déjà importés pour cet audit.
     */
    @GetMapping("/{id}/pdfs-correctifs")
    @PreAuthorize("hasAnyRole('AUDITEUR','EXPERT_PRODUCT_AUDIT','CHEF_SERVICE','RESPONSABLE_QUALITE_CENTRALE')")
    public ResponseEntity<Map<String, Object>> getPdfsCorrectifs(@PathVariable Long id) {
        List<String> paths = pdfService.getPdfsCorrectives(id);
        List<Map<String, String>> result = paths.stream().map(p -> {
            java.nio.file.Path path = java.nio.file.Paths.get(p);
            return Map.of("nom", path.getFileName().toString(), "chemin", p);
        }).collect(java.util.stream.Collectors.toList());
        return ResponseEntity.ok(Map.of(
                "auditId", id,
                "pdfs",    result,
                "count",   result.size()
        ));
    }

    /**
     * DELETE /api/audit-produit/{id}/pdfs-correctifs/{nomFichier}
     * Supprime un PDF correctif importé.
     */
    @DeleteMapping("/{id}/pdfs-correctifs/{nomFichier}")
    @PreAuthorize("hasAnyRole('AUDITEUR','EXPERT_PRODUCT_AUDIT')")
    public ResponseEntity<Map<String, Object>> supprimerPdfCorrectif(
            @PathVariable Long id,
            @PathVariable String nomFichier) {
        pdfService.supprimerPdfCorrectif(id, nomFichier);
        return ResponseEntity.ok(Map.of("message", "PDF correctif supprimé.", "auditId", id));
    }
}