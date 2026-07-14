package com.leoni.pap.service;

import com.leoni.pap.dto.request.*;
import com.leoni.pap.dto.response.AuditResponse;
import com.leoni.pap.entity.*;
import com.leoni.pap.entity.enums.*;
import com.leoni.pap.exception.BusinessException;
import com.leoni.pap.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.beans.factory.annotation.Value;

import java.io.IOException;
import java.nio.file.*;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class AuditSpecialService {

    private static final String UPLOAD_DIR = "uploads/rapports-audit/";
    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("dd-MM-yyyy");

    @Value("${app.frontend.url}")
    private String frontendUrl;

    @Value("${app.backend.url:http://localhost:8080}")
    private String backendUrl;

    private final AuditProduitRepository  auditRepo;
    private final UtilisateurRepository   userRepo;
    private final PlantRepository         plantRepo;
    private final NotificationService     notifService;
    private final HistoriqueService       historiqueService;
    private final PlanActionRepository    planActionRepo;
    private final EmailService            emailService;
    private final RapportPdfService       rapportPdfService;
    // ══════════════════════════════════════════════════════════
    // 1. CRÉER AUDIT RÈGLES PLATES
    // ══════════════════════════════════════════════════════════

    public AuditResponse creerAuditReglePlate(CreerAuditReglePlateRequest req, Integer expertId) {
        Plant plant = plantRepo.findById(req.getPlantId())
                .orElseThrow(() -> new BusinessException("Plant introuvable"));
        Utilisateur auditeur = userRepo.findById(req.getAuditeurId())
                .orElseThrow(() -> new BusinessException("Auditeur introuvable"));
        Utilisateur expert = userRepo.findById(expertId)
                .orElseThrow(() -> new BusinessException("Expert introuvable"));

        LocalDate datePrevue  = LocalDate.now();
        LocalDate dateProchain = req.getDateProchaineVerification() != null
                ? req.getDateProchaineVerification()
                : datePrevue.plusMonths(3);

        String nomAuditeur = buildNom(auditeur);
        String nomAudit    = "audit regle plat_" + nomAuditeur + "_" + datePrevue.format(DATE_FMT);

        AuditProduit audit = AuditProduit.builder()
                .typeAudit(TypeAudit.AUDIT_REGLES_PLATES)
                .statut(StatutAudit.PLANIFIE)
                .reference(nomAudit)
                .datePrevue(datePrevue)
                .deadline(dateProchain)
                .dateProchaineVerification(dateProchain)
                .plant(plant)
                .site(plant.getSite())
                .auditeur(auditeur)
                .planificateur(expert)
                .observations(req.getObservations())
                .pdcaDeclenche(false)
                .qkDepasseSeuil(false)
                .rapportGenere(false)
                .dateCreation(LocalDateTime.now())
                .build();

        AuditProduit saved = auditRepo.save(audit);

        notifService.creer(auditeur, TypeNotification.AUDIT_ASSIGNE,
                "Audit règle plate assigné : " + nomAudit
                        + " | Plant : " + plant.getNom()
                        + " | Prochain contrôle : " + dateProchain.format(DATE_FMT));

        historiqueService.logAudit(expert, TypeHistorique.AUDIT_REGLE_PLATE, saved,
                "Audit règle plate créé : " + nomAudit + " — Plant : " + plant.getNom());
        return AuditResponse.from(saved);
    }

    // ══════════════════════════════════════════════════════════
    // 2. CRÉER AUDIT MAGASIN EXPORT
    // ══════════════════════════════════════════════════════════

    public AuditResponse creerAuditExport(CreerAuditExportRequest req, Integer expertId) {
        Integer plantId = req.getPlantId();

        Utilisateur auditeur = userRepo.findById(req.getAuditeurId())
                .orElseThrow(() -> new BusinessException("Auditeur introuvable"));
        Utilisateur expert = userRepo.findById(expertId)
                .orElseThrow(() -> new BusinessException("Expert introuvable"));

        Utilisateur respMagasin = null;
        if (req.getResponsableMagasinId() != null)
            respMagasin = userRepo.findById(req.getResponsableMagasinId()).orElse(null);

        Plant plant = null;
        if (plantId != null)
            plant = plantRepo.findById(plantId)
                    .orElseThrow(() -> new BusinessException("Plant introuvable : " + plantId));

        LocalDate datePrevue = LocalDate.now();
        String nomAudit = "audit export_" + buildNom(auditeur) + "_" + datePrevue.format(DATE_FMT);

        AuditProduit audit = AuditProduit.builder()
                .typeAudit(TypeAudit.AUDIT_MAGASIN_EXPORT)
                .statut(StatutAudit.PLANIFIE)
                .reference(nomAudit)
                .datePrevue(datePrevue)
                .auditeur(auditeur)
                .planificateur(expert)
                .responsableMagasin(respMagasin)
                .plant(plant)
                .observations(req.getObservations())
                .semaineExport(req.getSemaineExport())
                .zoneExpedition(req.getSalleExport())
                .pdcaDeclenche(false)
                .qkDepasseSeuil(false)
                .rapportGenere(false)
                .valideParResponsableMagasin(false)
                .dateCreation(LocalDateTime.now())
                .build();

        AuditProduit saved = auditRepo.save(audit);

        notifService.creer(auditeur, TypeNotification.AUDIT_ASSIGNE,
                "Audit magasin export assigné : " + nomAudit
                        + " | Salle : " + req.getSalleExport()
                        + " | Semaine : " + req.getSemaineExport());

        historiqueService.logAudit(expert, TypeHistorique.AUDIT_MAGASIN_EXPORT, saved,
                "Audit export créé : " + nomAudit);
        return AuditResponse.from(saved);
    }

    // ══════════════════════════════════════════════════════════
    // 3. DÉMARRER (auditeur)
    // ══════════════════════════════════════════════════════════

    public AuditResponse demarrerAuditSpecial(Long auditId, Integer auditeurId) {
        AuditProduit audit = getChecked(auditId, auditeurId);
        if (audit.getStatut() == StatutAudit.TERMINE)
            throw new BusinessException("Audit déjà terminé.");
        audit.setStatut(StatutAudit.EN_COURS);
        audit.setDateModification(LocalDateTime.now());
        return AuditResponse.from(auditRepo.save(audit));
    }

    // ══════════════════════════════════════════════════════════
    // 4. VALIDER RAPPORT — IMPORT (auditeur)
    // ══════════════════════════════════════════════════════════

    public AuditResponse validerRapportImport(Long auditId,
                                              MultipartFile fichier,
                                              Integer auditeurId) throws IOException {
        AuditProduit audit = getChecked(auditId, auditeurId);

        String nomFichier = "rapport_"
                + audit.getReference().replaceAll("[^a-zA-Z0-9_-]", "_")
                + "_" + System.currentTimeMillis()
                + ext(fichier.getOriginalFilename());

        Path dir = Paths.get(UPLOAD_DIR);
        Files.createDirectories(dir);
        Files.copy(fichier.getInputStream(), dir.resolve(nomFichier),
                StandardCopyOption.REPLACE_EXISTING);

        audit.setRapportUrl(UPLOAD_DIR + nomFichier);
        audit.setRapportFichierNom(fichier.getOriginalFilename());
        audit.setRapportGenere(true);
        audit.setRapportGenerePdfUrl(UPLOAD_DIR + nomFichier);
        audit.setDateEnvoi(LocalDateTime.now());
        audit.setStatut(StatutAudit.EN_COURS);
        audit.setDateModification(LocalDateTime.now());

        if (audit.getTypeAudit() == TypeAudit.AUDIT_MAGASIN_EXPORT)
            notifierRespMagasin(audit);
        notifierExpert(audit, "a importé le rapport de");

        return AuditResponse.from(auditRepo.save(audit));
    }

    // ══════════════════════════════════════════════════════════
    // 5. VALIDER RAPPORT — FORMULAIRE (auditeur)
    // ══════════════════════════════════════════════════════════

    public AuditResponse validerRapportFormulaire(Long auditId,
                                                  ValiderRapportAuditSpecialRequest req,
                                                  Integer auditeurId) {
        AuditProduit audit = getChecked(auditId, auditeurId);

        if (req.getChecklistJson() != null) audit.setChecklistJson(req.getChecklistJson());
        if (req.getScoresJson()    != null) audit.setScoresJson(req.getScoresJson());
        if (req.getRemarques()     != null) audit.setObservations(req.getRemarques());
        if (req.getResultatAuditPourcentage() != null)
            audit.setActionImmediate("Résultat : " + req.getResultatAuditPourcentage() + "%");

        audit.setRapportGenere(true);
        audit.setDateModification(LocalDateTime.now());
        audit.setStatut(StatutAudit.TERMINE);
        audit.setDateRealisation(LocalDate.now());
        if (audit.getTypeAudit() == TypeAudit.AUDIT_MAGASIN_EXPORT) {
            audit.setValideParResponsableMagasin(true);
            audit.setDateValidationMagasin(LocalDateTime.now());
        }

        AuditProduit saved = auditRepo.save(audit);

        // === CORRECTION : Envoi immédiat des emails ===
        if (req.getEmailsDestinataires() != null && !req.getEmailsDestinataires().isEmpty()) {
            try {
                // Générer le PDF
                String rapportUrl = rapportPdfService.genererEtSauvegarder(saved.getId(), false);
                String relativePath = rapportUrl.startsWith("/") ? rapportUrl.substring(1) : rapportUrl;
                byte[] pdf = Files.readAllBytes(Paths.get(relativePath));

                String typeLabel = saved.getTypeAudit() == TypeAudit.AUDIT_REGLES_PLATES
                        ? "Règle Plate" : "Magasin Export";
                String datePrevueStr = saved.getDatePrevue() != null
                        ? saved.getDatePrevue().format(DateTimeFormatter.ofPattern("dd-MM-yyyy")) : "—";

                // Envoyer à tous les destinataires
                emailService.envoyerRapportAuditSpecialMultiEmail(
                        req.getEmailsDestinataires(),
                        typeLabel,
                        saved.getReference(),
                        datePrevueStr,
                        buildNom(saved.getAuditeur()),
                        saved.getPlant() != null ? saved.getPlant().getNom() : "—",
                        pdf);

                System.out.println("[AUDIT] Rapport envoyé à " + req.getEmailsDestinataires().size() + " destinataires");

            } catch (Exception e) {
                System.err.println("[AUDIT] Erreur envoi email : " + e.getMessage());
                // Ne pas bloquer la validation si l'email échoue
            }
        }

        notifierExpert(saved, "a terminé");
        return AuditResponse.from(saved);
    }
    /**
     * Génère le rapport PDF et l'envoie par email à tous les destinataires
     * fournis par l'auditeur, avec les infos de l'audit. Aucune validation
     * n'est attendue en retour — c'est un envoi informatif simple.
     */
    private void envoyerRapportMultiEmail(AuditProduit audit, List<String> emails) {
        if (emails == null || emails.isEmpty()) return;
        try {
            String rapportUrl = rapportPdfService.genererEtSauvegarder(audit.getId(), false);
            String relativePath = rapportUrl.startsWith("/") ? rapportUrl.substring(1) : rapportUrl;
            byte[] pdf = Files.readAllBytes(Paths.get(relativePath));

            String typeLabel = audit.getTypeAudit() == TypeAudit.AUDIT_REGLES_PLATES
                    ? "Règle Plate" : "Magasin Export";
            String datePrevueStr = audit.getDatePrevue() != null
                    ? audit.getDatePrevue().format(DATE_FMT) : "—";

            emailService.envoyerRapportAuditSpecialMultiEmail(
                    emails,
                    typeLabel,
                    audit.getReference(),
                    datePrevueStr,
                    buildNom(audit.getAuditeur()),
                    audit.getPlant() != null ? audit.getPlant().getNom() : "—",
                    pdf);
        } catch (Exception e) {
            System.err.println("[AUDIT SPECIAL] Erreur envoi rapport multi-email : " + e.getMessage());
        }

    }
    // ══════════════════════════════════════════════════════════
    // 6. PDCA RÈGLE PLATE (auditeur → responsable qualité ou externe)
    // ══════════════════════════════════════════════════════════

    public AuditResponse creerPDCAReglePlate(Long auditId,
                                             CreerPDCAReglePlateRequest req,
                                             Integer auditeurId) {
        AuditProduit audit = getChecked(auditId, auditeurId);

        audit.setPdcaDeclenche(true);
        audit.setDatePdca(LocalDateTime.now());
        audit.setStatut(StatutAudit.EN_COURS);
        audit.setDateModification(LocalDateTime.now());

        List<CreerPDCAReglePlateRequest.NonConformiteItem> ncItems = req.getNonConformites();

        // ── Responsable plateforme ─────────────────────────────
        if (req.getResponsableQualiteId() != null) {
            Utilisateur resp = userRepo.findById(req.getResponsableQualiteId())
                    .orElseThrow(() -> new BusinessException("Responsable introuvable"));
            audit.setResponsablePdca(resp);
            auditRepo.save(audit);

            String instr = req.getNumeroInstrument() != null
                    ? " | Instrument : " + req.getNumeroInstrument() : "";
            notifService.creer(resp, TypeNotification.AUDIT_PDCA_REQUIS,
                    "PDCA règle plate : " + audit.getReference() + instr
                            + (req.getRemarques() != null ? " | " + req.getRemarques() : ""));

            // ── Email externe ──────────────────────────────────────
        } else if (req.getEmailExterne() != null && !req.getEmailExterne().isBlank()) {
            auditRepo.save(audit);

            if (req.isEnvoyerSepare() && ncItems != null && !ncItems.isEmpty()) {
                // Un email par NC avec son propre destinataire
                for (CreerPDCAReglePlateRequest.NonConformiteItem nc : ncItems) {
                    String dest = nc.getEmailDestinataire() != null
                            && !nc.getEmailDestinataire().isBlank()
                            ? nc.getEmailDestinataire() : req.getEmailExterne();
                    String nomDest = nc.getNomDestinataire() != null
                            && !nc.getNomDestinataire().isBlank()
                            ? nc.getNomDestinataire()
                            : (req.getNomDestinataire() != null
                            ? req.getNomDestinataire() : "Responsable");

                    PlanAction plan = PlanAction.builder()
                            .audit(audit)
                            .titre("PDCA règle plate — " + safe(nc.getNumeroInstrument()))
                            .description(safe(nc.getRemarques()))
                            .emailExterne(dest)
                            .tokenValider(java.util.UUID.randomUUID().toString())
                            .tokenEnCours(java.util.UUID.randomUUID().toString())
                            .statut(PlanAction.StatutPlanAction.OUVERT)
                            .dateDernierEnvoi(LocalDateTime.now())
                            .dateEcheance(LocalDate.now().plusDays(3))
                            .build();
                    planActionRepo.save(plan);

                    String lienV = backendUrl + "/api/audit-special/action/valider/"
                            + plan.getTokenValider();
                    String lienE = backendUrl + "/api/audit-special/action/en-cours/"
                            + plan.getTokenEnCours();

                    String ncHtml = EmailService.buildNonConformitesTableHtml(
                            java.util.List.of(nc));
                    emailService.envoyerPDCAReglePlateEmail(
                            dest, nomDest, audit.getReference(),
                            ncHtml, nc.getRemarques(), lienV, lienE);
                }

            } else {
                // Toutes les NC dans un seul email
                String nomDest = req.getNomDestinataire() != null
                        ? req.getNomDestinataire() : "Responsable";

                PlanAction plan = PlanAction.builder()
                        .audit(audit)
                        .titre("PDCA règle plate — " + audit.getReference())
                        .description(req.getRemarques())
                        .emailExterne(req.getEmailExterne())
                        .tokenValider(java.util.UUID.randomUUID().toString())
                        .tokenEnCours(java.util.UUID.randomUUID().toString())
                        .statut(PlanAction.StatutPlanAction.OUVERT)
                        .dateDernierEnvoi(LocalDateTime.now())
                        .dateEcheance(LocalDate.now().plusDays(3))
                        .build();
                planActionRepo.save(plan);

                String lienV = backendUrl + "/api/audit-special/action/valider/"
                        + plan.getTokenValider();
                String lienE = backendUrl + "/api/audit-special/action/en-cours/"
                        + plan.getTokenEnCours();

                String ncHtml = ncItems != null
                        ? EmailService.buildNonConformitesTableHtml(ncItems) : "";
                emailService.envoyerPDCAReglePlateEmail(
                        req.getEmailExterne(), nomDest, audit.getReference(),
                        ncHtml, req.getRemarques(), lienV, lienE);
            }

        } else {
            // Aucun destinataire → juste sauvegarder
            auditRepo.save(audit);
        }

        return AuditResponse.from(audit);
    }

    // ══════════════════════════════════════════════════════════
    // 7. TRAITER TOKEN ACTION (clic bouton email)
    // ══════════════════════════════════════════════════════════

    /**
     * Traite le clic sur un bouton tokenisé depuis un email.
     * Retourne une page HTML de confirmation affichée directement dans le navigateur.
     *
     * - valider = true  → plan RESOLU, audit TERMINE
     * - valider = false → plan EN_COURS, relance dans 3 jours
     */
    public String traiterTokenAction(String token, boolean valider) {
        // Chercher par token valider OU token en cours
        Optional<PlanAction> optPlan = planActionRepo.findByTokenValider(token);
        if (optPlan.isEmpty())
            optPlan = planActionRepo.findByTokenEnCours(token);

        if (optPlan.isEmpty())
            return buildPageConfirmation(
                    "Lien invalide",
                    "Ce lien est invalide ou a déjà été utilisé.",
                    "#DC2626");

        PlanAction plan = optPlan.get();

        // Si déjà résolu → page info
        if (plan.getStatut() == PlanAction.StatutPlanAction.RESOLU) {
            return buildPageConfirmation(
                    "Déjà validé",
                    "Cette non-conformité a déjà été marquée comme résolue. Merci !",
                    "#059669");
        }

        if (valider) {
            // ── Valider ───────────────────────────────────────
            plan.setStatut(PlanAction.StatutPlanAction.RESOLU);
            plan.setDateCloture(LocalDate.now());
            plan.setDateModification(LocalDateTime.now());
            planActionRepo.save(plan);

            AuditProduit audit = plan.getAudit();
            if (audit != null) {
                // Audit export → TERMINE + validé par resp. magasin
                if (audit.getTypeAudit() == TypeAudit.AUDIT_MAGASIN_EXPORT) {
                    audit.setStatut(StatutAudit.TERMINE);
                    audit.setDateRealisation(LocalDate.now());
                    audit.setValideParResponsableMagasin(true);
                    audit.setDateValidationMagasin(LocalDateTime.now());
                    audit.setDateModification(LocalDateTime.now());
                    auditRepo.save(audit);

                    if (audit.getAuditeur() != null)
                        notifService.creer(audit.getAuditeur(),
                                TypeNotification.AUDIT_TERMINE_NOTIF,
                                "Audit export validé par le responsable magasin : "
                                        + audit.getReference());
                    notifierExpert(audit, "validé (email) pour");
                }

                // Audit règle plate → TERMINE
                if (audit.getTypeAudit() == TypeAudit.AUDIT_REGLES_PLATES) {
                    audit.setStatut(StatutAudit.TERMINE);
                    audit.setDateRealisation(LocalDate.now());
                    audit.setDateModification(LocalDateTime.now());
                    auditRepo.save(audit);

                    if (audit.getAuditeur() != null)
                        notifService.creer(audit.getAuditeur(),
                                TypeNotification.AUDIT_TERMINE_NOTIF,
                                "PDCA validé — Audit terminé : " + audit.getReference());
                    notifierExpert(audit, "PDCA validé (email) pour");
                }
            }

            return buildPageConfirmation(
                    "✓ Validé avec succès",
                    "La non-conformité a été marquée comme résolue. Merci pour votre retour !",
                    "#059669");

        } else {
            // ── En cours ──────────────────────────────────────
            plan.setStatut(PlanAction.StatutPlanAction.EN_COURS);
            plan.setDateDernierEnvoi(LocalDateTime.now());
            plan.setDateModification(LocalDateTime.now());
            planActionRepo.save(plan);

            return buildPageConfirmation(
                    "⏳ Pris en compte",
                    "Votre réponse a bien été enregistrée. "
                            + "Une relance automatique sera envoyée dans 3 jours "
                            + "si aucune validation n'a été effectuée.",
                    "#D97706");
        }
    }
    public AuditResponse modifierAuditSpecial(Long id, Map<String, Object> body, Integer userId) {
        AuditProduit audit = auditRepo.findById(id)
                .orElseThrow(() -> new BusinessException("Audit introuvable."));

        if (body.get("datePrevue") != null) {
            String dp = body.get("datePrevue").toString();
            // accepte "2025-06-20" ou "2025-06-20T00:00:00"
            audit.setDatePrevue(LocalDate.parse(dp.length() > 10 ? dp.substring(0, 10) : dp));
        }
        if (body.containsKey("deadline")) {
            Object dl = body.get("deadline");
            if (dl == null || dl.toString().isBlank()) {
                audit.setDeadline(null);
            } else {
                String dlStr = dl.toString();
                audit.setDeadline(LocalDate.parse(dlStr.length() > 10 ? dlStr.substring(0, 10) : dlStr));
            }
        }
        if (body.containsKey("auditeurId") && body.get("auditeurId") != null) {
            Integer auditeurId = Integer.parseInt(body.get("auditeurId").toString());
            userRepo.findById(auditeurId).ifPresent(audit::setAuditeur);

        }
        if (body.containsKey("observations")) {
            audit.setObservations(body.get("observations") != null ? body.get("observations").toString() : null);
        }

        if (audit.getStatut() == StatutAudit.EN_RETARD && audit.getDeadline() != null && !audit.getDeadline().isBefore(LocalDate.now())) {
            audit.setStatut(StatutAudit.EN_COURS);
        }
        AuditProduit savedSpecial = auditRepo.save(audit);

        // ── Historique : modification d'un audit spécial (tracée sur le plant) ──
        userRepo.findById(userId).ifPresent(acteur ->
                historiqueService.logAudit(acteur, TypeHistorique.AUDIT_MODIFIE, savedSpecial,
                        "Audit spécial modifié — Réf: " + savedSpecial.getReference()));

        return AuditResponse.from(savedSpecial);
    }
    // ══════════════════════════════════════════════════════════
    // 8. STATUT DU PLAN D'ACTION (polling frontend)
    // ══════════════════════════════════════════════════════════

    @Transactional(readOnly = true)
    public Map<String, String> getPlanActionStatut(Long auditId) {
        return planActionRepo
                .findTopByAuditIdOrderByDateCreationDesc(auditId)
                .map(p -> Map.of("statut", p.getStatut().name()))
                .orElse(Map.of("statut", "AUCUN"));
    }

    // ══════════════════════════════════════════════════════════
    // 9. TERMINER AUDIT (appelé après génération rapport)
    // ══════════════════════════════════════════════════════════

    public AuditResponse terminerAudit(Long auditId, Integer auditeurId) {
        AuditProduit audit = getChecked(auditId, auditeurId);
        audit.setStatut(StatutAudit.TERMINE);
        audit.setDateRealisation(LocalDate.now());
        audit.setDateModification(LocalDateTime.now());
        notifierExpert(audit, "a terminé");
        return AuditResponse.from(auditRepo.save(audit));
    }

    // ══════════════════════════════════════════════════════════
    // 10. VALIDER PDCA (responsable qualité plateforme)
    // ══════════════════════════════════════════════════════════

    public AuditResponse validerPDCAReglePlate(Long auditId, Integer responsableId) {
        AuditProduit audit = auditRepo.findById(auditId)
                .orElseThrow(() -> new BusinessException("Audit introuvable"));
        audit.setStatut(StatutAudit.TERMINE);
        audit.setDateRealisation(LocalDate.now());
        audit.setDateModification(LocalDateTime.now());
        auditRepo.save(audit);

        if (audit.getAuditeur() != null)
            notifService.creer(audit.getAuditeur(),
                    TypeNotification.AUDIT_TERMINE_NOTIF,
                    "PDCA validé — Audit terminé : " + audit.getReference());
        notifierExpert(audit, "PDCA validé pour");
        return AuditResponse.from(audit);
    }

    // ══════════════════════════════════════════════════════════
    // 11. VALIDER EXPORT (responsable magasin plateforme — legacy)
    // ══════════════════════════════════════════════════════════

    public AuditResponse validerAuditExport(Long auditId,
                                            Integer responsableMagasinId,
                                            String commentaires) {
        AuditProduit audit = auditRepo.findById(auditId)
                .orElseThrow(() -> new BusinessException("Audit introuvable"));
        if (audit.getTypeAudit() != TypeAudit.AUDIT_MAGASIN_EXPORT)
            throw new BusinessException("Pas un audit export.");

        audit.setValideParResponsableMagasin(true);
        audit.setDateValidationMagasin(LocalDateTime.now());
        audit.setStatut(StatutAudit.TERMINE);
        audit.setDateRealisation(LocalDate.now());
        if (commentaires != null) audit.setActionImmediate(commentaires);
        audit.setDateModification(LocalDateTime.now());
        auditRepo.save(audit);

        if (audit.getAuditeur() != null)
            notifService.creer(audit.getAuditeur(),
                    TypeNotification.AUDIT_TERMINE_NOTIF,
                    "Audit export validé : " + audit.getReference());
        notifierExpert(audit, "validé par resp. magasin");
        return AuditResponse.from(audit);
    }

    // ══════════════════════════════════════════════════════════
    // 12. RÉCUPÉRER UN AUDIT PAR ID
    // ══════════════════════════════════════════════════════════

    @Transactional(readOnly = true)
    public AuditProduit getAuditById(Long auditId) {
        return auditRepo.findById(auditId)
                .orElseThrow(() -> new BusinessException("Audit introuvable"));
    }

    // ══════════════════════════════════════════════════════════
    // 13. LISTES
    // ══════════════════════════════════════════════════════════

    @Transactional(readOnly = true)
    public List<AuditResponse> getAuditsReglePlates(Integer annee, Integer plantId) {
        return auditRepo.findByTypeAuditOrderByDatePrevueDesc(TypeAudit.AUDIT_REGLES_PLATES)
                .stream()
                .filter(a -> annee == null
                        || (a.getDatePrevue() != null
                        && a.getDatePrevue().getYear() == annee))
                .filter(a -> plantId == null
                        || (a.getPlant() != null
                        && a.getPlant().getId().equals(plantId)))
                .map(AuditResponse::from)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<AuditResponse> getAuditsExport(Integer annee) {
        return auditRepo.findByTypeAuditOrderByDatePrevueDesc(TypeAudit.AUDIT_MAGASIN_EXPORT)
                .stream()
                .filter(a -> annee == null
                        || (a.getDatePrevue() != null
                        && a.getDatePrevue().getYear() == annee))
                .map(AuditResponse::from)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<AuditResponse> getMesAuditsReglePlates(Integer auditeurId) {
        return auditRepo.findByAuditeurIdAndTypeAuditOrderByDatePrevueDesc(
                        auditeurId, TypeAudit.AUDIT_REGLES_PLATES)
                .stream()
                .map(AuditResponse::from)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<AuditResponse> getMesAuditsExport(Integer auditeurId) {
        return auditRepo.findByAuditeurIdAndTypeAuditOrderByDatePrevueDesc(
                        auditeurId, TypeAudit.AUDIT_MAGASIN_EXPORT)
                .stream()
                .map(AuditResponse::from)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<AuditResponse> getAuditsExportResponsable(Integer responsableId) {
        return auditRepo.findByTypeAuditOrderByDatePrevueDesc(TypeAudit.AUDIT_MAGASIN_EXPORT)
                .stream()
                .filter(a -> a.getResponsableMagasin() == null
                        || a.getResponsableMagasin().getId().equals(responsableId))
                .map(AuditResponse::from)
                .collect(Collectors.toList());
    }

    // ══════════════════════════════════════════════════════════
    // HELPERS PRIVÉS
    // ══════════════════════════════════════════════════════════

    private AuditProduit getChecked(Long auditId, Integer auditeurId) {
        AuditProduit a = auditRepo.findById(auditId)
                .orElseThrow(() -> new BusinessException("Audit introuvable."));
        if (a.getAuditeur() == null || !a.getAuditeur().getId().equals(auditeurId))
            throw new BusinessException("Vous n'êtes pas l'auditeur de cet audit.");
        return a;
    }

    private String buildNom(Utilisateur u) {
        if (u == null) return "INCONNU";
        return ((u.getNom()    != null ? u.getNom().toUpperCase() : "") + " "
                + (u.getPrenom() != null ? u.getPrenom()            : "")).trim();
    }

    private String ext(String filename) {
        if (filename == null || !filename.contains(".")) return ".pdf";
        return filename.substring(filename.lastIndexOf('.'));
    }

    private void notifierExpert(AuditProduit audit, String action) {
        if (audit.getPlanificateur() != null)
            notifService.creer(audit.getPlanificateur(),
                    TypeNotification.AUDIT_TERMINE_NOTIF,
                    buildNom(audit.getAuditeur()) + " " + action + " : "
                            + audit.getReference());
    }

    private void notifierRespMagasin(AuditProduit audit) {
        if (audit.getResponsableMagasin() != null)
            notifService.creer(audit.getResponsableMagasin(),
                    TypeNotification.AUDIT_ASSIGNE,
                    "Audit export à valider : " + audit.getReference()
                            + " | " + audit.getZoneExpedition()
                            + " | Sem. " + audit.getSemaineExport());
    }

    private String safe(String s) {
        return (s != null && !s.isBlank()) ? s : "—";
    }

    // ══════════════════════════════════════════════════════════
    // PAGE HTML DE CONFIRMATION (retournée au navigateur)
    // ══════════════════════════════════════════════════════════

    private String buildPageConfirmation(String titre, String message, String color) {
        String emoji = "#059669".equals(color) ? "✓"
                : "#D97706".equals(color) ? "⏳" : "✗";
        return """
        <!DOCTYPE html>
        <html lang="fr">
        <head>
          <meta charset="UTF-8"/>
          <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
          <title>LEONI PAP</title>
          <style>
            *{box-sizing:border-box;margin:0;padding:0}
            body{background:#EEF2F8;font-family:'Segoe UI',Helvetica,Arial,sans-serif;
                 min-height:100vh;display:flex;align-items:center;justify-content:center;
                 padding:20px}
            .card{background:#fff;border-radius:16px;padding:48px 40px;
                  max-width:480px;width:100%%;text-align:center;
                  box-shadow:0 8px 40px rgba(0,20,60,0.13)}
            .icon{width:72px;height:72px;border-radius:50%%;margin:0 auto 24px;
                  display:flex;align-items:center;justify-content:center;font-size:2rem;
                  background:%s22;border:2px solid %s44}
            h1{font-size:1.4rem;font-weight:800;color:#0B1E3D;margin-bottom:12px}
            p{font-size:.95rem;color:#64748B;line-height:1.6;margin-bottom:32px}
            .footer{background:#F8FAFC;border-radius:10px;padding:14px 20px;
                    border:1px solid #E2E8F0;font-size:.8rem;color:#94A3B8}
          </style>
        </head>
        <body>
          <div class="card">
            <div class="icon" style="background:%s22;border-color:%s44">%s</div>
            <h1 style="color:%s">%s</h1>
            <p>%s</p>
            <div class="footer">LEONI PAP — Quality Audit Platform</div>
          </div>
        </body>
        </html>
        """.formatted(color, color, color, color, emoji, color, titre, message);
    }

    // ══════════════════════════════════════════════════════════
    // BUILDER HTML CRITÈRES EXPORT
    // ══════════════════════════════════════════════════════════

    private String buildCriteresHtmlFromJson(String criteresJson, String scoresJson) {
        if (criteresJson == null || criteresJson.isBlank()) return "";

        Map<String, String> labels = Map.of(
                "identification", "Identification / Contrôle de l'identité",
                "generation",     "Generation Stand/index",
                "etiquette",      "Etiquette de contrôle électrique",
                "emballage",      "Emballage (méthode et quantité)",
                "papier",         "Papier d'export (label)",
                "autresSeries",   "Existence d'autres séries selon label",
                "proprete",       "Propreté",
                "endommagements", "Endommagements",
                "dateProduction", "Date de production",
                "autres",         "Autres"
        );

        try {
            com.fasterxml.jackson.databind.ObjectMapper mapper =
                    new com.fasterxml.jackson.databind.ObjectMapper();
            Map<String, String> scores = mapper.readValue(
                    scoresJson != null ? scoresJson : "{}",
                    new com.fasterxml.jackson.core.type.TypeReference<>() {});

            StringBuilder sb = new StringBuilder();
            sb.append("<table cellpadding='0' cellspacing='0' width='100%' style='"
                    + "border:1px solid #E2E8F0;border-radius:10px;overflow:hidden;"
                    + "margin-bottom:28px;font-size:12px;'>");
            sb.append("<thead><tr style='background:linear-gradient(135deg,#0B1E3D,#7C3AED);'>");
            sb.append("<th style='padding:9px 14px;text-align:left;color:#fff;font-weight:700;'>Critère</th>");
            for (int n = 1; n <= 3; n++)
                sb.append("<th style='padding:9px 10px;text-align:center;color:#fff;font-weight:700;'>Cont. ")
                        .append(n).append("</th>");
            sb.append("</tr></thead><tbody>");

            String[] criteres = {
                    "identification","generation","etiquette","emballage","papier",
                    "autresSeries","proprete","endommagements","dateProduction","autres"
            };
            int i = 0;
            for (String key : criteres) {
                String rowBg = i++ % 2 == 0 ? "#ffffff" : "#F8FAFC";
                sb.append("<tr style='background:").append(rowBg)
                        .append(";border-bottom:1px solid #E2E8F0;'>");
                sb.append("<td style='padding:9px 14px;font-weight:600;color:#0B1E3D;'>")
                        .append(labels.getOrDefault(key, key)).append("</td>");
                for (int c = 0; c < 3; c++) {
                    String val = scores.getOrDefault(key + "_" + c, "NA");
                    String bg, col;
                    if ("NA".equals(val)) {
                        bg = "#F1F5F9"; col = "#94A3B8";
                    } else if ("10".equals(val)) {
                        bg = "#ECFDF5"; col = "#059669";
                    } else if (Integer.parseInt(val) < 5) {
                        bg = "#FEF2F2"; col = "#DC2626";
                    } else {
                        bg = "#FFFBEB"; col = "#D97706";
                    }
                    sb.append("<td style='padding:9px 10px;text-align:center;'>")
                            .append("<span style='background:").append(bg)
                            .append(";color:").append(col)
                            .append(";font-weight:700;padding:3px 10px;border-radius:6px;'>")
                            .append("NA".equals(val) ? "N/A" : val + "/10")
                            .append("</span></td>");
                }
                sb.append("</tr>");
            }
            sb.append("</tbody></table>");
            return sb.toString();

        } catch (Exception e) {
            return "<p style='color:#DC2626;'>Erreur lors du rendu des critères.</p>";
        }
    }
}