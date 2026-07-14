package com.leoni.pap.dto.response;

import com.leoni.pap.entity.AuditProduit;
import com.leoni.pap.entity.PlanificationAudit;
import com.leoni.pap.entity.enums.StatutAudit;
import com.leoni.pap.entity.enums.StatutPlanification;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Data
public class PlanificationResponse {

    private Long                id;
    private String              nom;
    private String              description;
    private LocalDate           dateDebut;
    private LocalDate           dateFin;
    private String              mode;
    private StatutPlanification statut;
    private LocalDateTime       dateLancement;
    private LocalDateTime       dateCreation;

    // Créateur
    private Integer createurId;
    private String  createurNom;

    // Segment
    private Integer segmentId;
    private String  segmentNom;

    // Plant
    private Integer plantId;
    private String  plantNom;

    // Site
    private Integer siteId;
    private String  siteNom;

    // Stats dynamiques calculées depuis les audits réels
    private Integer nombreAuditsTotal;
    private Integer nombreAuditsTermines;
    private Integer nombreAuditsEnCours;
    private Integer nombreAuditsEnRetard;
    private Integer nombreAuditsPlanifies;
    private Integer progressionPct;

    private String fichierPlanificationNom;

    public static PlanificationResponse from(PlanificationAudit p) {
        PlanificationResponse r = new PlanificationResponse();
        r.setId(p.getId());
        r.setNom(p.getNom());
        r.setDescription(p.getDescription());
        r.setDateDebut(p.getDateDebut());
        r.setDateFin(p.getDateFin());
        r.setMode(p.getMode() != null ? p.getMode().name() : null);
        r.setStatut(p.getStatut());
        r.setDateLancement(p.getDateLancement());
        r.setDateCreation(p.getDateCreation());
        r.setFichierPlanificationNom(p.getFichierPlanificationNom());

        // Créateur
        if (p.getCreateur() != null) {
            r.setCreateurId(p.getCreateur().getId());
            r.setCreateurNom(p.getCreateur().getPrenom() + " " + p.getCreateur().getNom());
        }

        // Segment → Plant → Site
        if (p.getSegment() != null) {
            r.setSegmentId(p.getSegment().getId());
            r.setSegmentNom(p.getSegment().getNom());
            if (p.getSegment().getPlant() != null) {
                r.setPlantId(p.getSegment().getPlant().getId());
                r.setPlantNom(p.getSegment().getPlant().getNom());
                if (p.getSegment().getPlant().getSite() != null) {
                    r.setSiteId(p.getSegment().getPlant().getSite().getId());
                    r.setSiteNom(p.getSegment().getPlant().getSite().getNom());
                }
            }
        }

        // ── Compteurs dynamiques calculés depuis les audits réels ──
        List<AuditProduit> audits = p.getAudits();
        if (audits == null) audits = new ArrayList<>();

        LocalDate today = LocalDate.now();

        int total = audits.size();
        int termines = 0, enCours = 0, enRetard = 0, planifies = 0;

        for (AuditProduit a : audits) {
            StatutAudit st = a.getStatut();

            if (st == null) {
                planifies++;
                continue;
            }

            // Vérifier si deadline dépassée
            boolean deadlineDepassee = a.getDeadline() != null
                    && a.getDeadline().isBefore(today);

            switch (st) {
                case TERMINE -> termines++;
                case EN_RETARD -> enRetard++;
                case EN_COURS -> {
                    if (deadlineDepassee) enRetard++;
                    else                  enCours++;
                }
                case PLANIFIE -> {
                    if (deadlineDepassee) enRetard++;
                    else                  planifies++;
                }
                default -> planifies++;
            }
        }

        // Si aucun audit chargé (lazy), fallback sur les champs stockés en base
        if (total == 0 && p.getNombreAuditsTotal() != null && p.getNombreAuditsTotal() > 0) {
            total    = p.getNombreAuditsTotal();
            termines = p.getNombreAuditsTermines() != null ? p.getNombreAuditsTermines() : 0;
            enRetard = p.getNombreAuditsEnRetard()  != null ? p.getNombreAuditsEnRetard()  : 0;
            enCours  = 0;
            planifies = Math.max(0, total - termines - enRetard);
        }

        int pct = total > 0 ? Math.round(termines * 100f / total) : 0;

        r.setNombreAuditsTotal(total);
        r.setNombreAuditsTermines(termines);
        r.setNombreAuditsEnCours(enCours);
        r.setNombreAuditsEnRetard(enRetard);
        r.setNombreAuditsPlanifies(planifies);
        r.setProgressionPct(pct);

        return r;
    }
}