package com.leoni.pap.service;

import com.leoni.pap.entity.PlanAction;
import com.leoni.pap.entity.PlanAction.StatutPlanAction;
import com.leoni.pap.entity.Utilisateur;
import com.leoni.pap.exception.BusinessException;
import com.leoni.pap.repository.PlanActionRepository;
import com.leoni.pap.repository.UtilisateurRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
@Service
@RequiredArgsConstructor
@Transactional
public class PlanActionService {

    private final PlanActionRepository planActionRepo;
    private final UtilisateurRepository userRepo;
    private final FicheReparationService ficheService;

    @Transactional(readOnly = true)
    public List<Map<String, Object>> getMesPdcasEnAttente(Integer responsableId) {
        Utilisateur responsable = userRepo.findById(responsableId)
                .orElseThrow(() -> new BusinessException("Responsable introuvable"));

        return planActionRepo.findAll().stream()
                .filter(p -> p.getResponsable() != null
                        && p.getResponsable().getId().equals(responsableId)
                        && p.getStatut() != StatutPlanAction.RESOLU
                        && p.getStatut() != StatutPlanAction.FERME)
                .map(p -> {
                    Map<String, Object> map = new LinkedHashMap<>();
                    map.put("id", p.getId());
                    map.put("planifier", p.getPlanifier());
                    map.put("do_", p.getDo_());
                    map.put("check", p.getCheck());
                    map.put("act", p.getAct());
                    map.put("statut", p.getStatut().name());
                    map.put("dateEcheance", p.getDateEcheance());
                    map.put("dateCreation", p.getDateCreation());
                    if (p.getAudit() != null) {
                        map.put("auditId", p.getAudit().getId());
                        map.put("auditReference", p.getAudit().getReference());
                        map.put("siteNom", p.getAudit().getSite() != null ? p.getAudit().getSite().getNom() : null);
                        map.put("auditeurNom", p.getAudit().getAuditeur() != null
                                ? p.getAudit().getAuditeur().getPrenom() + " " + p.getAudit().getAuditeur().getNom()
                                : null);
                        map.put("valeurQK", p.getAudit().getValeurQK());
                    }
                    return map;
                })
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<PlanAction> getByAudit(Long auditId) {
        return planActionRepo.findByAuditId(auditId);
    }
    @Transactional(readOnly = true)
    public List<Map<String, Object>> getMesPdcasValides(Integer responsableId) {
        Utilisateur responsable = userRepo.findById(responsableId)
                .orElseThrow(() -> new BusinessException("Responsable introuvable"));

        return planActionRepo.findAll().stream()
                .filter(p -> p.getResponsable() != null
                        && p.getResponsable().getId().equals(responsableId)
                        && (p.getStatut() == StatutPlanAction.RESOLU || p.getStatut() == StatutPlanAction.FERME))
                .map(p -> {
                    Map<String, Object> map = new LinkedHashMap<>();
                    map.put("id", p.getId());
                    map.put("planifier", p.getPlanifier());
                    map.put("do_", p.getDo_());
                    map.put("check", p.getCheck());
                    map.put("act", p.getAct());
                    map.put("statut", p.getStatut().name());
                    map.put("dateEcheance", p.getDateEcheance());
                    map.put("dateCreation", p.getDateCreation());
                    if (p.getAudit() != null) {
                        map.put("auditId", p.getAudit().getId());
                        map.put("auditReference", p.getAudit().getReference());
                        map.put("siteNom", p.getAudit().getSite() != null ? p.getAudit().getSite().getNom() : null);
                        map.put("auditeurNom", p.getAudit().getAuditeur() != null
                                ? p.getAudit().getAuditeur().getPrenom() + " " + p.getAudit().getAuditeur().getNom()
                                : null);
                        map.put("valeurQK", p.getAudit().getValeurQK());
                    }
                    return map;
                })
                .collect(Collectors.toList());
    }
    public Map<String, Object> validerPdca(Long pdcaId, Integer responsableId) {
        PlanAction pdca = planActionRepo.findById(pdcaId)
                .orElseThrow(() -> new BusinessException("PDCA introuvable."));
        Utilisateur resp = userRepo.findById(responsableId)
                .orElseThrow(() -> new BusinessException("Utilisateur introuvable."));

        if (pdca.getResponsable() == null || !pdca.getResponsable().getId().equals(resp.getId())) {
            throw new BusinessException("Vous n'etes pas le responsable assigne a ce PDCA.");
        }

        pdca.setStatut(StatutPlanAction.FERME);
        pdca.setDateCloture(java.time.LocalDate.now());
        pdca.setDateModification(LocalDateTime.now());
        planActionRepo.save(pdca);

        if (pdca.getAudit() != null) {
            ficheService.recalculerCouleurAudit(pdca.getAudit().getId());
        }

        Map<String, Object> res = new LinkedHashMap<>();
        res.put("pdcaId", pdca.getId());
        res.put("statut", pdca.getStatut().name());
        res.put("message", "PDCA valide.");
        return res;
    }

}
