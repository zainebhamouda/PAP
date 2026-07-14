package com.leoni.pap.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.leoni.pap.dto.request.FicheReparationRequest;
import com.leoni.pap.dto.request.PDCARequest;
import com.leoni.pap.entity.*;
import com.leoni.pap.entity.FicheReparation.StatutFicheReparation;
import com.leoni.pap.entity.PlanAction.StatutPlanAction;
import com.leoni.pap.entity.enums.CouleurQK;
import com.leoni.pap.entity.enums.TypeNotification;
import com.leoni.pap.exception.BusinessException;
import com.leoni.pap.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import lombok.extern.slf4j.Slf4j;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class FicheReparationService {

    private final FicheReparationRepository ficheRepo;
    private final AuditProduitRepository    auditRepo;
    private final PlanActionRepository      planActionRepo;
    private final UtilisateurRepository     userRepo;
    private final NotificationService       notifService;
    private final EmailService              emailService;
    private final ObjectMapper              objectMapper;

    @Value("${app.backend.url:http://localhost:8080}")
    private String backendUrl;

    // =================================================================
    // 1. CRÉER ET ENVOYER LA FICHE DE RÉPARATION (externe uniquement)
    // =================================================================
    public Map<String, Object> creerFicheReparation(Long auditId,
                                                    FicheReparationRequest req,
                                                    Integer auditeurId) {
        AuditProduit audit   = getAudit(auditId);
        Utilisateur auditeur = getUser(auditeurId);

        if (audit.getValeurQK() == null || audit.getValeurQK() == 0.0)
            throw new BusinessException("La fiche de réparation n'est requise que si QK > 0.");

        if (req.getDestinataires() == null || req.getDestinataires().isEmpty())
            throw new BusinessException("Au moins un destinataire est requis.");

        // ── Résolution des destinataires ──────────────────────────
        List<FicheReparationRequest.Destinataire> destinatairesResolus = new ArrayList<>();

        for (FicheReparationRequest.Destinataire d : req.getDestinataires()) {
            if (d.getUtilisateurId() != null) {
                // Chef de service plateforme → on récupère email/nom depuis la BDD
                Utilisateur u = userRepo.findById(d.getUtilisateurId())
                        .orElseThrow(() -> new BusinessException(
                                "Utilisateur introuvable (ID: " + d.getUtilisateurId() + ")"));
                FicheReparationRequest.Destinataire resolved = new FicheReparationRequest.Destinataire();
                resolved.setUtilisateurId(u.getId());
                resolved.setEmail(u.getEmail());
                resolved.setNom(u.getPrenom() + " " + u.getNom());
                destinatairesResolus.add(resolved);
            } else {
                // Externe libre → email obligatoire
                if (d.getEmail() == null || d.getEmail().isBlank())
                    throw new BusinessException("L'email est obligatoire pour les destinataires externes.");
                destinatairesResolus.add(d);
            }
        }

        String tokenVal   = UUID.randomUUID().toString();
        String tokenEnCrs = UUID.randomUUID().toString();
        String destinatairesJson = toJson(destinatairesResolus);

        FicheReparation fiche = FicheReparation.builder()
                .audit(audit)
                .statut(StatutFicheReparation.EN_ATTENTE)
                .zoneAffectee(req.getZoneAffectee())
                .origineNC(req.getOrigineNC())
                .codeArticle(req.getCodeArticle())
                .descriptionNC(req.getDescriptionNC())
                .remarquesOptionnelles(req.getRemarquesOptionnelles())
                .destinatairesJson(destinatairesJson)
                .tokenValider(tokenVal)
                .tokenEnCours(tokenEnCrs)
                .dateDernierEnvoi(LocalDateTime.now())
                .creePar(auditeur)
                .valide(false)
                .build();

        fiche = ficheRepo.save(fiche);

        String lienValider = backendUrl + "/api/public/fiche-reparation/action?ficheId=" + fiche.getId()
                + "&action=VALIDER&token=" + tokenVal;
        String lienEnCours = backendUrl + "/api/public/fiche-reparation/action?ficheId=" + fiche.getId()
                + "&action=EN_COURS&token=" + tokenEnCrs;

        // ── Envoi email à tous ────────────────────────────────────
        for (FicheReparationRequest.Destinataire dest : destinatairesResolus) {
            try {
                emailService.envoyerFicheReparationEmailComplet(
                        dest.getEmail(), dest.getNomAffichage(),
                        audit.getReference(), audit.getValeurQK(),
                        req.getDescriptionNC(),
                        req.getZoneAffectee(),
                        req.getOrigineNC(),
                        req.getCodeArticle(),
                        req.getRemarquesOptionnelles(),
                        lienValider, lienEnCours);
            } catch (Exception ex) {
                log.warn("Erreur envoi email fiche à {} : {}", dest.getEmail(), ex.getMessage());
            }
        }

        // ── Notification interne pour chefs de service plateforme ─
        destinatairesResolus.stream()
                .filter(d -> d.getUtilisateurId() != null)
                .forEach(d -> {
                    try {
                        Utilisateur u = userRepo.findById(d.getUtilisateurId()).orElse(null);
                        if (u != null)
                            notifService.creer(u, TypeNotification.INFORMATION,
                                    "Une fiche de réparation vous a été assignée pour l'audit "
                                            + audit.getReference() + " (QK=" + audit.getValeurQK() + ").");
                    } catch (Exception ex) {
                        log.warn("Erreur notification chef service {} : {}", d.getUtilisateurId(), ex.getMessage());
                    }
                });

        Map<String, Object> result = new HashMap<>();
        result.put("ficheId",         fiche.getId());
        result.put("statut",          fiche.getStatut().name());
        result.put("nbDestinataires", destinatairesResolus.size());
        result.put("message",         "Fiche envoyée à " + destinatairesResolus.size() + " destinataire(s).");
        return result;
    }
    // =================================================================
    // 2. TRAITER ACTION DEPUIS L'EMAIL (public)
    // =================================================================
    public String traiterActionFicheEmail(Long ficheId, String action, String token) {
        FicheReparation fiche = ficheRepo.findById(ficheId)
                .orElseThrow(() -> new BusinessException("Fiche introuvable."));

        if ("VALIDER".equalsIgnoreCase(action)) {
            if (!token.equals(fiche.getTokenValider()))
                throw new BusinessException("Token invalide.");
            if (fiche.getStatut() == StatutFicheReparation.VALIDEE)
                return "Cette fiche a déjà été validée. Merci !";

            fiche.setStatut(StatutFicheReparation.VALIDEE);
            fiche.setValide(true);
            fiche.setDateValidation(LocalDateTime.now());
            ficheRepo.save(fiche);

            recalculerCouleurAudit(fiche.getAudit().getId());

            if (fiche.getAudit().getAuditeur() != null) {
                notifService.creer(fiche.getAudit().getAuditeur(), TypeNotification.INFORMATION,
                        "La fiche de réparation pour l'audit " + fiche.getAudit().getReference()
                                + " a été validée par le destinataire externe.");
            }
            return "Fiche de réparation validée avec succès. Merci !";

        } else if ("EN_COURS".equalsIgnoreCase(action)) {
            if (!token.equals(fiche.getTokenEnCours()))
                throw new BusinessException("Token invalide.");
            if (fiche.getStatut() == StatutFicheReparation.EN_COURS_TRAITEMENT)
                return "Votre réponse a déjà été enregistrée. Vous recevrez une relance dans 3 jours si nécessaire.";

            fiche.setStatut(StatutFicheReparation.EN_COURS_TRAITEMENT);
            fiche.setDateDernierEnvoi(LocalDateTime.now());
            ficheRepo.save(fiche);

            if (fiche.getAudit().getAuditeur() != null) {
                notifService.creer(fiche.getAudit().getAuditeur(), TypeNotification.INFORMATION,
                        "Le destinataire de la fiche de réparation (audit " + fiche.getAudit().getReference()
                                + ") a signalé qu'il traite le problème.");
            }
            return " Réponse enregistrée. Vous recevrez une relance dans 3 jours si la fiche n'est pas encore validée.";
        }
        throw new BusinessException("Action inconnue : " + action);
    }

    // =================================================================
    // 3. RELANCE AUTOMATIQUE (tous les jours à 8h)
    // =================================================================
    @Scheduled(cron = "0 0 8 * * *")
    public void relancerFichesEnCours() {
        LocalDateTime limite = LocalDateTime.now().minusDays(3);
        List<FicheReparation> fichesARelancer = ficheRepo.findFichesEnCoursARelancer(limite);

        for (FicheReparation fiche : fichesARelancer) {
            try {
                String lienValider = backendUrl + "/api/public/fiche-reparation/action?ficheId=" + fiche.getId()
                        + "&action=VALIDER&token=" + fiche.getTokenValider();
                String lienEnCours = backendUrl + "/api/public/fiche-reparation/action?ficheId=" + fiche.getId()
                        + "&action=EN_COURS&token=" + fiche.getTokenEnCours();

                List<FicheReparationRequest.Destinataire> destinataires = fromJson(fiche.getDestinatairesJson());
                for (FicheReparationRequest.Destinataire dest : destinataires) {
                    try {
                        emailService.envoyerFicheReparationEmailComplet(
                                dest.getEmail(),
                                dest.getMatricule(),
                                fiche.getAudit().getReference(),
                                fiche.getAudit().getValeurQK(),
                                fiche.getDescriptionNC(),
                                fiche.getZoneAffectee(),
                                fiche.getOrigineNC(),
                                fiche.getCodeArticle(),
                                fiche.getRemarquesOptionnelles(),
                                lienValider,
                                lienEnCours);
                        System.out.println("[SCHEDULER] Relance fiche #" + fiche.getId() + " → " + dest.getEmail());
                    } catch (Exception mailEx) {
                        System.err.println("[SCHEDULER] Erreur envoi à " + dest.getEmail() + " : " + mailEx.getMessage());
                    }
                }
                fiche.setDateDernierEnvoi(LocalDateTime.now());
                ficheRepo.save(fiche);
            } catch (Exception e) {
                System.err.println("[SCHEDULER] Erreur relance fiche #" + fiche.getId() + " : " + e.getMessage());
            }
        }
    }

    // =================================================================
    // 4. LECTURE (pour le front)
    // =================================================================
    @Transactional(readOnly = true)
    public List<Map<String, Object>> getFichesParAudit(Long auditId) {
        return ficheRepo.findByAuditId(auditId).stream()
                .map(this::toMap)
                .collect(Collectors.toList());
    }

    // =================================================================
    // 5. PDCA (inchangé, conservé tel quel)
    // =================================================================
    @Transactional
    public Map<String, Object> creerPDCA(Long auditId, PDCARequest req, Integer auditeurId) {
        // 1. Récupération de l'audit
        AuditProduit audit = auditRepo.findById(auditId)
                .orElseThrow(() -> new BusinessException("Audit introuvable (ID: " + auditId + ")"));

        // 2. Validation QK
        Double qk = audit.getValeurQK();
        if (qk == null || qk <= 0.5) {
            throw new BusinessException("Le PDCA n'est requis que si QK > 0.5. Valeur actuelle : " + qk);
        }

        // 3. Validation obligatoire Plan (P)
        if (req.getPlanifier() == null || req.getPlanifier().trim().isEmpty()) {
            throw new BusinessException("Le champ Plan (P) est obligatoire.");
        }

        // 4. Responsable Qualité Centrale (optionnel)
        Utilisateur responsableCentrale = null;
        if (req.getResponsableQualiteCentraleId() != null) {
            responsableCentrale = userRepo.findById(req.getResponsableQualiteCentraleId())
                    .orElseThrow(() -> new BusinessException("Responsable qualité centrale introuvable (ID: "
                            + req.getResponsableQualiteCentraleId() + ")"));
        }

        // 5. Validation email externe
        String emailExterne = req.getEmailExterne();
        if (emailExterne != null && !emailExterne.isBlank()) {
            String emailRegex = "^[A-Za-z0-9+_.-]+@(.+)$";
            if (!emailExterne.matches(emailRegex)) {
                throw new BusinessException("Format d'email externe invalide : " + emailExterne);
            }
        }

        // 6. Nettoyage des champs
        String plan = req.getPlanifier().trim();
        String doAction = req.getDo_() != null ? req.getDo_().trim() : null;
        String check = req.getCheck() != null ? req.getCheck().trim() : null;
        String act = req.getAct() != null ? req.getAct().trim() : null;

        // 7. Génération des tokens
        String tokenValider = UUID.randomUUID().toString();
        String tokenEnCours = UUID.randomUUID().toString();

        // 8. Création du PDCA
        PlanAction pdca = PlanAction.builder()
                .audit(audit)
                .titre(req.getTitre() != null ? req.getTitre() : "PDCA — " + audit.getReference())
                .description(req.getDescription() != null ? req.getDescription() : "")
                .actionCorrective(req.getActionCorrective())
                .causeRacine(req.getCauseRacine())
                .planifier(plan)
                .do_(doAction)
                .check(check)
                .act(act)
                .responsable(responsableCentrale)
                .emailExterne(emailExterne)
                .tokenValider(tokenValider)
                .tokenEnCours(tokenEnCours)
                .dateEcheance(req.getDateEcheance() != null ? req.getDateEcheance() : LocalDate.now().plusDays(3))  // ← VALEUR PAR DÉFAUT
                .dateCreation(LocalDateTime.now())
                .dateDernierEnvoi(LocalDateTime.now())
                .statut(StatutPlanAction.OUVERT)
                .build();

        // 9. Sauvegarde
        pdca = planActionRepo.save(pdca);

        // 10. Mise à jour de l'audit
        audit.setPdcaDeclenche(true);
        audit.setDatePdca(LocalDateTime.now());
        if (responsableCentrale != null) {
            audit.setResponsablePdca(responsableCentrale);
        }
        auditRepo.save(audit);

        // 11. Envoi email externe (non bloquant)
        if (emailExterne != null && !emailExterne.isBlank()) {
            try {
                String lienValider = backendUrl + "/api/public/pdca/action?pdcaId=" + pdca.getId()
                        + "&action=VALIDER&token=" + tokenValider;

                String lienEnCours = backendUrl + "/api/public/pdca/action?pdcaId=" + pdca.getId()
                        + "&action=EN_COURS&token=" + tokenEnCours;

                String nomDest = (req.getNomDestinataire() != null && !req.getNomDestinataire().isBlank())
                        ? req.getNomDestinataire() : "Responsable Qualité";

                emailService.envoyerPDCAEmail(
                        emailExterne,
                        nomDest,
                        audit.getReference(),
                        audit.getValeurQK(),
                        plan,
                        doAction,
                        check,
                        act,
                        lienValider,
                        lienEnCours
                );
            } catch (Exception e) {
                System.err.println("Erreur lors de l'envoi de l'email PDCA externe : " + e.getMessage());
            }
        }

        // 12. Notification interne
        if (responsableCentrale != null) {
            try {
                notifService.creer(responsableCentrale, TypeNotification.INFORMATION,
                        "Un PDCA vous a été assigné pour l'audit " + audit.getReference() + " — QK=" + audit.getValeurQK());

                envoyerEmailSimple(responsableCentrale,
                        "PDCA à traiter — " + audit.getReference(),
                        "Un plan d'action corrective (PDCA) vous a été assigné pour l'audit " + audit.getReference() +
                                ". QK = " + audit.getValeurQK() + ". Connectez-vous à la plateforme pour le traiter.");
            } catch (Exception e) {
                System.err.println("Erreur notification PDCA interne : " + e.getMessage());
            }
        }

        // 13. Retour
        Map<String, Object> result = new HashMap<>();
        result.put("pdcaId", pdca.getId());
        result.put("statut", pdca.getStatut().name());
        result.put("message", "PDCA créé avec succès.");
        return result;
    }
    @Transactional(readOnly = true)
    public List<Map<String, Object>> getPdcaParAudit(Long auditId) {
        AuditProduit audit = auditRepo.findById(auditId)
                .orElseThrow(() -> new BusinessException("Audit introuvable."));
        if (audit.getPlansAction() == null) return Collections.emptyList();
        return audit.getPlansAction().stream()
                .map(this::pdcaToMap)
                .collect(Collectors.toList());
    }
    @Transactional(readOnly = true)
    public List<Map<String, Object>> getFichesParChef(Integer chefId) {
        Utilisateur chef = userRepo.findById(chefId)
                .orElseThrow(() -> new BusinessException("Utilisateur introuvable."));
        String emailChef = chef.getEmail().toLowerCase().trim();

        return ficheRepo.findAll().stream()
                .filter(f -> {
                    List<FicheReparationRequest.Destinataire> dests = fromJson(f.getDestinatairesJson());
                    return dests.stream().anyMatch(d ->
                            chefId.equals(d.getUtilisateurId())
                                    || (d.getEmail() != null && d.getEmail().toLowerCase().trim().equals(emailChef))
                    );
                })
                .map(this::toMap)
                .collect(Collectors.toList());
    }
    @Transactional(readOnly = true)
    public List<Map<String, Object>> getFichesEnAttenteParChef(Integer chefId) {
        // Récupérer l'email du chef connecté
        Utilisateur chef = userRepo.findById(chefId)
                .orElseThrow(() -> new BusinessException("Utilisateur introuvable."));
        String emailChef = chef.getEmail().toLowerCase().trim();

        return ficheRepo.findByStatutIn(
                        List.of(StatutFicheReparation.EN_ATTENTE, StatutFicheReparation.EN_COURS_TRAITEMENT)
                ).stream()
                .filter(f -> {
                    List<FicheReparationRequest.Destinataire> dests = fromJson(f.getDestinatairesJson());
                    return dests.stream().anyMatch(d ->
                            // Cas 1 : sélectionné via plateforme (utilisateurId)
                            chefId.equals(d.getUtilisateurId())
                                    ||
                                    // Cas 2 : saisi via email libre mais même email que le chef connecté
                                    (d.getEmail() != null && d.getEmail().toLowerCase().trim().equals(emailChef))
                    );
                })
                .map(this::toMap)
                .collect(Collectors.toList());
    }
    private Map<String, Object> pdcaToMap(PlanAction p) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", p.getId());
        map.put("planifier", p.getPlanifier());
        map.put("do_", p.getDo_());
        map.put("check", p.getCheck());
        map.put("act", p.getAct());
        map.put("responsableQualiteCentraleId", p.getResponsable() != null ? p.getResponsable().getId() : null);
        map.put("emailExterne", p.getEmailExterne());
        map.put("dateEcheance", p.getDateEcheance());
        map.put("statut", p.getStatut().name());
        return map;
    }
    public String traiterActionPDCAEmail(Long pdcaId, String action, String token) {
        try {
            PlanAction pdca = planActionRepo.findById(pdcaId)
                    .orElseThrow(() -> new BusinessException("PDCA introuvable (ID: " + pdcaId + ")"));

            if ("VALIDER".equalsIgnoreCase(action)) {
                if (!token.equals(pdca.getTokenValider())) {
                    return "❌ Token invalide ou expiré. Veuillez contacter l'auditeur.";
                }
                if (pdca.getStatut() == StatutPlanAction.RESOLU || pdca.getStatut() == StatutPlanAction.FERME) {
                    return "✅ Ce PDCA a déjà été validé. Merci !";
                }
                pdca.setStatut(StatutPlanAction.RESOLU);
                pdca.setDateCloture(LocalDate.now());
                pdca.setDateModification(LocalDateTime.now());
                planActionRepo.save(pdca);
                if (pdca.getAudit() != null) {
                    recalculerCouleurAudit(pdca.getAudit().getId());
                    if (pdca.getAudit().getAuditeur() != null) {
                        notifService.creer(pdca.getAudit().getAuditeur(), TypeNotification.INFORMATION,
                                "Le PDCA pour l'audit " + pdca.getAudit().getReference() + " a été validé.");
                    }
                }
                return "✅ PDCA validé avec succès. Merci pour votre retour !";
            }
            else if ("EN_COURS".equalsIgnoreCase(action)) {
                if (!token.equals(pdca.getTokenEnCours())) {
                    return "❌ Token invalide ou expiré.";
                }
                if (pdca.getStatut() == StatutPlanAction.EN_COURS) {
                    return "✅ Vous avez déjà signalé que vous traitez ce PDCA.";
                }
                pdca.setStatut(StatutPlanAction.EN_COURS);
                pdca.setDateDernierEnvoi(LocalDateTime.now());
                planActionRepo.save(pdca);
                if (pdca.getAudit() != null && pdca.getAudit().getAuditeur() != null) {
                    notifService.creer(pdca.getAudit().getAuditeur(), TypeNotification.INFORMATION,
                            "Le destinataire du PDCA (audit " + pdca.getAudit().getReference()
                                    + ") a signalé qu'il est en cours de traitement.");
                }
                return "✅ Votre réponse a été enregistrée. Merci !";
            }
            return "❌ Action inconnue : " + action;
        } catch (BusinessException e) {
            return "❌ " + e.getMessage();
        } catch (Exception e) {
            // Ajoute un log détaillé dans la console du backend
            log.error("Erreur dans traiterActionPDCAEmail pour pdcaId={}, action={}", pdcaId, action, e);
            return "❌ Une erreur technique s'est produite. Détail : " + e.getMessage();
        }
    }

    @Scheduled(cron = "0 0 9 * * *")
    public void relancerPDCAsEnCours() {
        LocalDateTime limite = LocalDateTime.now().minusDays(3);
        List<PlanAction> pdcasARelancer = planActionRepo.findPDCAsEnCoursARelancer(limite);
        for (PlanAction pdca : pdcasARelancer) {
            try {
                String lienValider = backendUrl + "/api/public/pdca/action?pdcaId=" + pdca.getId()
                        + "&action=VALIDER&token=" + pdca.getTokenValider();
                String lienEnCours = backendUrl + "/api/public/pdca/action?pdcaId=" + pdca.getId()
                        + "&action=EN_COURS&token=" + pdca.getTokenEnCours();
                emailService.envoyerPDCAEmail(
                        pdca.getEmailExterne(),
                        "Responsable",
                        pdca.getAudit().getReference(),
                        pdca.getAudit().getValeurQK(),
                        pdca.getPlanifier(),
                        pdca.getDo_(),
                        pdca.getCheck(),
                        pdca.getAct(),
                        lienValider,
                        lienEnCours
                );
                pdca.setDateDernierEnvoi(LocalDateTime.now());
                planActionRepo.save(pdca);
                System.out.println("[SCHEDULER] Relance PDCA #" + pdca.getId() + " → " + pdca.getEmailExterne());
            } catch (Exception e) {
                System.err.println("[SCHEDULER] Erreur relance PDCA #" + pdca.getId() + " : " + e.getMessage());
            }
        }
    }

    // =================================================================
    // 6. RECALCUL DE LA COULEUR QK
    // =================================================================
    public void recalculerCouleurAudit(Long auditId) {
        AuditProduit audit = getAudit(auditId);
        if (audit.getValeurQK() == null || audit.getValeurQK() == 0.0) {
            audit.setCouleurQK(CouleurQK.VERT);
            auditRepo.save(audit);
            return;
        }

        boolean ficheValidee = ficheRepo.findByAuditId(auditId).stream()
                .anyMatch(f -> f.getStatut() == StatutFicheReparation.VALIDEE);

        boolean pdcaValide = audit.getPlansAction() != null &&
                audit.getPlansAction().stream()
                        .anyMatch(p -> p.getStatut() == StatutPlanAction.FERME
                                || p.getStatut() == StatutPlanAction.RESOLU);

        double qk = audit.getValeurQK();
        CouleurQK nouvelleCouleur;

        if (qk == 0.0) {
            nouvelleCouleur = CouleurQK.VERT;
        } else if (qk <= 0.5) {
            nouvelleCouleur = ficheValidee ? CouleurQK.VERT : CouleurQK.ORANGE;
        } else if (qk <= 1.0) {
            if (ficheValidee && pdcaValide) nouvelleCouleur = CouleurQK.VERT;
            else if (ficheValidee || pdcaValide) nouvelleCouleur = CouleurQK.ORANGE;
            else nouvelleCouleur = CouleurQK.ROSE;
        } else {
            if (ficheValidee && pdcaValide) nouvelleCouleur = CouleurQK.VERT;
            else if (ficheValidee || pdcaValide) nouvelleCouleur = CouleurQK.ORANGE;
            else nouvelleCouleur = CouleurQK.ROUGE;
        }
        audit.setCouleurQK(nouvelleCouleur);
        auditRepo.save(audit);
    }

    // =================================================================
    // 7. UTILITAIRES PRIVÉS
    // =================================================================
    private void envoyerEmailSimple(Utilisateur dest, String sujet, String corps) {
        if (dest != null && dest.getEmail() != null) {
            emailService.envoyerNotification(dest.getEmail(), dest.getPrenom() + " " + dest.getNom(), sujet, corps);
        }
    }

    private AuditProduit getAudit(Long id) {
        return auditRepo.findById(id)
                .orElseThrow(() -> new BusinessException("Audit introuvable."));
    }

    private Utilisateur getUser(Integer id) {
        return userRepo.findById(id)
                .orElseThrow(() -> new BusinessException("Utilisateur introuvable."));
    }

    private String toJson(List<FicheReparationRequest.Destinataire> destinataires) {
        try {
            return objectMapper.writeValueAsString(destinataires);
        } catch (JsonProcessingException e) {
            throw new BusinessException("Erreur de sérialisation des destinataires");
        }
    }

    private List<FicheReparationRequest.Destinataire> fromJson(String json) {
        if (json == null || json.isBlank()) return new ArrayList<>();
        try {
            // Tentative normale
            return objectMapper.readValue(json, new TypeReference<>() {});
        } catch (JsonProcessingException e) {
            log.error("Erreur désérialisation destinataires, json: {}", json, e);
            // Fallback : tenter de lire comme List<Map>
            try {
                List<Map<String, String>> maps = objectMapper.readValue(json, new TypeReference<>() {});
                return maps.stream().map(m -> {
                    FicheReparationRequest.Destinataire d = new FicheReparationRequest.Destinataire();
                    d.setEmail(m.get("email"));
                    d.setNom(m.getOrDefault("nom", m.getOrDefault("matricule", "")));
                    return d;
                }).collect(Collectors.toList());
            } catch (Exception ex) {
                log.error("Fallback échoué", ex);
                return new ArrayList<>();
            }
        }
    }
    @Transactional(readOnly = true)
    public List<Map<String, Object>> getFichesEnAttenteExpert() {
        return ficheRepo.findByStatut(StatutFicheReparation.EN_ATTENTE)
                .stream()
                .map(this::toMap)
                .collect(Collectors.toList());
    }
    private Map<String, Object> toMap(FicheReparation f) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", f.getId());
        m.put("auditId", f.getAudit().getId());
        m.put("auditReference", f.getAudit().getReference());
        m.put("statut", f.getStatut().name());
        m.put("zoneAffectee", f.getZoneAffectee());
        m.put("origineNC", f.getOrigineNC());
        m.put("codeArticle", f.getCodeArticle());
        m.put("descriptionNC", f.getDescriptionNC());
        m.put("remarquesOptionnelles", f.getRemarquesOptionnelles());
        m.put("destinataires", fromJson(f.getDestinatairesJson()));
        m.put("valide", f.getValide());
        m.put("valideChef", f.getStatut() == StatutFicheReparation.VALIDEE);  // ← AJOUTER CETTE LIGNE
        m.put("dateValidation", f.getDateValidation());
        m.put("dateDernierEnvoi", f.getDateDernierEnvoi());
        m.put("dateCreation", f.getDateCreation());
        return m;
    }
    @Transactional
    public Map<String, Object> validerFicheParChef(Long ficheId, Integer chefId, String commentaire) {
        FicheReparation fiche = ficheRepo.findById(ficheId)
                .orElseThrow(() -> new BusinessException("Fiche introuvable."));

        Utilisateur chef = userRepo.findById(chefId)
                .orElseThrow(() -> new BusinessException("Chef introuvable."));

        String emailChef = chef.getEmail().toLowerCase().trim();

        // Vérifier que ce chef est bien destinataire de cette fiche
        List<FicheReparationRequest.Destinataire> dests = fromJson(fiche.getDestinatairesJson());
        boolean estDestinataire = dests.stream().anyMatch(d ->
                chefId.equals(d.getUtilisateurId())
                        || (d.getEmail() != null && d.getEmail().toLowerCase().trim().equals(emailChef))
        );

        if (!estDestinataire) {
            throw new BusinessException("Vous n'êtes pas destinataire de cette fiche.");
        }

        if (fiche.getStatut() == StatutFicheReparation.VALIDEE) {
            throw new BusinessException("Cette fiche est déjà validée.");
        }

        // Marquer comme validée
        fiche.setStatut(StatutFicheReparation.VALIDEE);
        fiche.setValide(true);
        fiche.setDateValidation(LocalDateTime.now());

        // Stocker le commentaire du chef dans les remarques
        if (commentaire != null && !commentaire.isBlank()) {
            String existing = fiche.getRemarquesOptionnelles() != null ? fiche.getRemarquesOptionnelles() : "";
            fiche.setRemarquesOptionnelles(existing + "\n[Chef " + chef.getPrenom() + " " + chef.getNom() + "] : " + commentaire.trim());
        }

        ficheRepo.save(fiche);

        // Recalcul couleur audit
        recalculerCouleurAudit(fiche.getAudit().getId());

        // Notifier l'auditeur
        if (fiche.getAudit().getAuditeur() != null) {
            notifService.creer(
                    fiche.getAudit().getAuditeur(),
                    TypeNotification.INFORMATION,
                    "La fiche de réparation #" + ficheId + " (audit " + fiche.getAudit().getReference()
                            + ") a été validée par " + chef.getPrenom() + " " + chef.getNom() + "."
            );
        }

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("ficheId", ficheId);
        result.put("statut", fiche.getStatut().name());
        result.put("validePar", chef.getPrenom() + " " + chef.getNom());
        result.put("dateValidation", fiche.getDateValidation());
        result.put("message", "Fiche validée avec succès.");
        return result;
    }
}