package com.leoni.pap.scheduler;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.leoni.pap.dto.request.FicheReparationRequest;
import com.leoni.pap.entity.FicheReparation;
import com.leoni.pap.entity.PlanAction;
import com.leoni.pap.repository.FicheReparationRepository;
import com.leoni.pap.repository.PlanActionRepository;
import com.leoni.pap.service.EmailService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;

@Component
@RequiredArgsConstructor
public class FicheReparationScheduler {

    private final FicheReparationRepository ficheRepo;
    private final PlanActionRepository      planActionRepo;
    private final EmailService              emailService;
    private final ObjectMapper              objectMapper;

    @Value("${app.backend.url:http://localhost:8080}")
    private String backendUrl;

    // =================================================================
    // RELANCE FICHES DE RÉPARATION – tous les jours à 08h00
    // =================================================================
    @Scheduled(cron = "0 0 8 * * *")
    public void relancerFichesEnCours() {
        LocalDateTime limite = LocalDateTime.now().minusDays(3);
        List<FicheReparation> fichesARelancer;
        try {
            fichesARelancer = ficheRepo.findFichesEnCoursARelancer(limite);
        } catch (Exception e) {
            System.err.println("[SCHEDULER-FICHE] Erreur récupération fiches : " + e.getMessage());
            return;
        }

        System.out.println("[SCHEDULER-FICHE] " + fichesARelancer.size() + " fiche(s) à relancer.");

        for (FicheReparation fiche : fichesARelancer) {
            try {
                // Récupérer la liste des destinataires depuis le JSON
                List<FicheReparationRequest.Destinataire> destinataires = parseDestinataires(fiche.getDestinatairesJson());
                if (destinataires == null || destinataires.isEmpty()) {
                    System.err.println("[SCHEDULER-FICHE] Fiche #" + fiche.getId() + " sans destinataire – ignorée");
                    continue;
                }
                if (fiche.getTokenValider() == null || fiche.getTokenEnCours() == null) continue;

                String lienValider = backendUrl + "/api/public/fiche-reparation/action"
                        + "?ficheId=" + fiche.getId()
                        + "&action=VALIDER&token=" + fiche.getTokenValider();
                String lienEnCours = backendUrl + "/api/public/fiche-reparation/action"
                        + "?ficheId=" + fiche.getId()
                        + "&action=EN_COURS&token=" + fiche.getTokenEnCours();

                String auditRef = fiche.getAudit() != null ? fiche.getAudit().getReference() : "—";
                Double qk = fiche.getAudit() != null ? fiche.getAudit().getValeurQK() : 0.0;

                // Envoyer un email à chaque destinataire
                for (FicheReparationRequest.Destinataire dest : destinataires) {
                    try {
                        emailService.envoyerFicheReparationEmail(
                                dest.getEmail(),
                                dest.getMatricule(),   // utilisé comme "nom" dans l'email
                                auditRef,
                                qk,
                                fiche.getDescriptionNC(),  // description de la NC
                                "",     // action corrective (non utilisée)
                                "",     // délai (non utilisé)
                                lienValider,
                                lienEnCours
                        );
                        System.out.println("[SCHEDULER-FICHE] Relance envoyée → fiche #"
                                + fiche.getId() + " → " + dest.getEmail());
                    } catch (Exception mailEx) {
                        System.err.println("[SCHEDULER-FICHE] Erreur envoi à " + dest.getEmail() + " : " + mailEx.getMessage());
                    }
                }

                // Mettre à jour la date du dernier envoi
                fiche.setDateDernierEnvoi(LocalDateTime.now());
                ficheRepo.save(fiche);

            } catch (Exception e) {
                System.err.println("[SCHEDULER-FICHE] Erreur relance fiche #"
                        + fiche.getId() + " : " + e.getMessage());
            }
        }
    }

    // =================================================================
    // RELANCE PDCA – tous les jours à 09h00 (inchangé)
    // =================================================================
    @Scheduled(cron = "0 0 9 * * *")
    public void relancerPDCAsEnCours() {
        LocalDateTime limite = LocalDateTime.now().minusDays(3);
        List<PlanAction> pdcasARelancer;
        try {
            pdcasARelancer = planActionRepo.findPDCAsEnCoursARelancer(limite);
        } catch (Exception e) {
            System.err.println("[SCHEDULER-PDCA] Erreur récupération PDCA : " + e.getMessage());
            return;
        }

        System.out.println("[SCHEDULER-PDCA] " + pdcasARelancer.size() + " PDCA à relancer.");

        for (PlanAction pdca : pdcasARelancer) {
            try {
                if (pdca.getEmailExterne() == null || pdca.getEmailExterne().isBlank()) continue;
                if (pdca.getTokenValider() == null || pdca.getTokenEnCours() == null) continue;

                String lienValider = backendUrl + "/api/public/pdca/action"
                        + "?pdcaId=" + pdca.getId()
                        + "&action=VALIDER&token=" + pdca.getTokenValider();
                String lienEnCours = backendUrl + "/api/public/pdca/action"
                        + "?pdcaId=" + pdca.getId()
                        + "&action=EN_COURS&token=" + pdca.getTokenEnCours();

                String auditRef = pdca.getAudit() != null ? pdca.getAudit().getReference() : "—";
                Double qk = pdca.getAudit() != null ? pdca.getAudit().getValeurQK() : 0.0;

                emailService.envoyerPDCAEmail(
                        pdca.getEmailExterne(),
                        "Responsable",
                        auditRef,
                        qk,
                        pdca.getPlanifier(),
                        pdca.getDo_(),
                        pdca.getCheck(),
                        pdca.getAct(),
                        lienValider,
                        lienEnCours
                );

                pdca.setDateDernierEnvoi(LocalDateTime.now());
                planActionRepo.save(pdca);

                System.out.println("[SCHEDULER-PDCA] Relance envoyée → PDCA #"
                        + pdca.getId() + " → " + pdca.getEmailExterne());
            } catch (Exception e) {
                System.err.println("[SCHEDULER-PDCA] Erreur relance PDCA #"
                        + pdca.getId() + " : " + e.getMessage());
            }
        }
    }

    // -----------------------------------------------------------------
    // Utilitaire pour parser le JSON des destinataires
    // -----------------------------------------------------------------
    private List<FicheReparationRequest.Destinataire> parseDestinataires(String json) {
        if (json == null || json.isBlank()) return List.of();
        try {
            return objectMapper.readValue(json, new TypeReference<>() {});
        } catch (Exception e) {
            System.err.println("Erreur parsing destinataires JSON : " + e.getMessage());
            return List.of();
        }
    }
}