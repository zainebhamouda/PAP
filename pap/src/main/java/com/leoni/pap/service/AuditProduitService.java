package com.leoni.pap.service;

import com.leoni.pap.dto.request.PlanifierAuditRequest;
import com.leoni.pap.dto.request.UpdateAuditRequest;
import com.leoni.pap.dto.request.SaisirResultatAuditRequest;
import com.leoni.pap.dto.response.AuditResponse;
import com.leoni.pap.entity.*;
import com.leoni.pap.entity.enums.*;
import com.leoni.pap.exception.BusinessException;
import com.leoni.pap.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class AuditProduitService {

    private final AuditProduitRepository              auditRepo;
    private final NonConformiteAuditRepository        ncRepo;
    private final LigneChecklistReglePlateRepository  checklistRepo;
    private final UtilisateurRepository               userRepo;
    private final PlantRepository                     plantRepo;
    private final SegmentRepository                   segmentRepo;
    private final ProjetRepository                    projetRepo;
    private final SiteRepository                      siteRepo;
    private final SerieRepository                     serieRepo;
    private final PlanificationRepository             planifRepo;
    private final NotificationService                 notifService;
    private final HistoriqueService                   historiqueService;
    // ✅ AJOUTÉ Sprint 3+
    private final DemandeExtensionRepository          demandeRepo;
    private final AuditProduitAnnexeService annexeService;
    private final RapportMensuelService rapportMensuelService;

    // ── TABLE FACTEUR QK (IP3010 page 4) ─────────────────────
    private static final int[]    SEUILS_COMPOSANTS = {50, 100, 200, 350, 500, 750, 1000, Integer.MAX_VALUE};
    private static final double[] FACTEURS           = {3.0, 2.0, 1.5, 1.2, 1.0, 0.8, 0.7, 0.5};

    // ── TABLE QK (IP3010 page 6) ──────────────────────────────
    private static final int[]    SEUILS_POINTS = {0, 50, 100, 200, 300, 500, 750, 1000, 1500, 2000, Integer.MAX_VALUE};
    private static final double[] VALEURS_QK    = {0, 0.3, 0.7, 1.0, 1.7, 2.1, 2.5, 3.0, 3.5, 4.0, 5.0};

    private static final DateTimeFormatter REF_FMT = DateTimeFormatter.ofPattern("yyyy");

    @org.springframework.beans.factory.annotation.Value("${upload.rapport.path:C:/Users/zaine/OneDrive/Bureau/PFE/dev/pap/uploads/rapports-audit}")
    private String UPLOAD_DIR;

    // ═══════════════════════════════════════════════════════════
    // MES AUDITS (auditeur)
    // ═══════════════════════════════════════════════════════════

    @Transactional(readOnly = true)
    public List<AuditResponse> getMesAudits(Integer auditeurId) {
        return auditRepo.findByAuditeurIdOrderByDatePrevueDesc(auditeurId)
                .stream().map(AuditResponse::from).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<AuditResponse> getMesAuditsByType(Integer auditeurId, TypeAudit type) {
        return auditRepo.findByAuditeurIdAndTypeAuditOrderByDatePrevueDesc(auditeurId, type)
                .stream().map(AuditResponse::from).collect(Collectors.toList());
    }

    /**
     * Audits produit filtrés par planification (appelé par AuditeurController Sprint 3).
     * ✅ MODIFIÉ Sprint 3+ : enrichi avec demandeExtension
     */
    @Transactional(readOnly = true)
    public List<AuditResponse> getMesAuditsProduit(Integer auditeurId, Long planificationId) {
        List<AuditProduit> audits;
        if (planificationId != null) {
            audits = auditRepo.findByAuditeurIdAndTypeAuditAndPlanificationId(
                    auditeurId, TypeAudit.AUDIT_PRODUIT, planificationId);
        } else {
            audits = auditRepo.findByAuditeurIdAndTypeAuditOrderByDatePrevueDesc(
                    auditeurId, TypeAudit.AUDIT_PRODUIT);
        }
        // ✅ enrichirAvecDemande remplace le simple .map(AuditResponse::from)
        return audits.stream()
                .map(a -> {
                    AuditResponse r = AuditResponse.from(a);
                    enrichirAvecDemande(r, a.getId());
                    return r;
                })
                .collect(Collectors.toList());
    }

    // ═══════════════════════════════════════════════════════════
    // LECTURE UNIQUE
    // ═══════════════════════════════════════════════════════════

    @Transactional(readOnly = true)
    public AuditResponse getById(Long id) {
        return AuditResponse.from(auditRepo.findById(id)
                .orElseThrow(() -> new BusinessException("Audit introuvable.")));
    }

    @Transactional(readOnly = true)
    public AuditResponse getAuditById(Long id) {
        return getById(id);
    }

    // ═══════════════════════════════════════════════════════════
    // TOUS LES AUDITS
    // ✅ MODIFIÉ Sprint 3+ : enrichi avec demandeExtension
    // ═══════════════════════════════════════════════════════════

    @Transactional(readOnly = true)
    public List<AuditResponse> getAllAudits() {
        return auditRepo.findAll().stream()
                .sorted(Comparator.comparing(AuditProduit::getDatePrevue, Comparator.reverseOrder()))
                .map(a -> {
                    AuditResponse r = AuditResponse.from(a);
                    enrichirAvecDemande(r, a.getId());
                    return r;
                })
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<AuditResponse> getByPlanification(Long planificationId) {
        return auditRepo.findByPlanificationIdOrderByDatePrevueAsc(planificationId)
                .stream()
                .map(AuditResponse::from)
                .collect(Collectors.toList());
    }

    @Transactional
    public AuditResponse updateStatutAudit(Long id, String statutStr) {
        AuditProduit audit = getAudit(id);
        if (statutStr == null) throw new BusinessException("Statut manquant");
        StatutAudit newStatut;
        try {
            newStatut = StatutAudit.valueOf(statutStr);
        } catch (Exception e) {
            throw new BusinessException("Statut invalide: " + statutStr);
        }
        audit.setStatut(newStatut);
        audit.setDateModification(java.time.LocalDateTime.now());

        // ✅ CORRIGÉ — le bouton "Terminer" (front) passe par cet endpoint
        // générique et pas par saisirResultats()/terminerParAuditeur(). Sans
        // ça, dateRealisation restait null pour tout audit terminé par ce
        // chemin, ce qui le rendait invisible dans le Rapport Mensuel
        // (Annexe 1A), qui filtre justement sur dateRealisation.
        if (newStatut == StatutAudit.TERMINE && audit.getDateRealisation() == null) {
            audit.setDateRealisation(LocalDate.now());
        }

        AuditProduit saved = auditRepo.save(audit);

        if (newStatut == StatutAudit.TERMINE) {
            try {
                rapportMensuelService.regenererPourAudit(saved, null);
            } catch (Exception e) {
                log.error("Régénération du rapport mensuel impossible pour l'audit {} (plant={}, {}/{})",
                        saved.getId(),
                        saved.getPlant() != null ? saved.getPlant().getNom() : null,
                        saved.getDateRealisation() != null ? saved.getDateRealisation().getMonthValue() : null,
                        saved.getDateRealisation() != null ? saved.getDateRealisation().getYear() : null,
                        e);
            }
        }

        return AuditResponse.from(saved);
    }

    @Transactional(readOnly = true)
    public List<AuditResponse> getByType(TypeAudit type) {
        return auditRepo.findByTypeAuditOrderByDatePrevueDesc(type)
                .stream().map(AuditResponse::from).collect(Collectors.toList());
    }

    // ═══════════════════════════════════════════════════════════
    // PAR PLANT / SÉRIE
    // ═══════════════════════════════════════════════════════════

    @Transactional(readOnly = true)
    public List<AuditResponse> getByPlant(Integer plantId) {
        return auditRepo.findByPlantIdOrderByDatePrevueDesc(plantId)
                .stream().map(AuditResponse::from).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<AuditResponse> getBySerie(Integer serieId) {
        return auditRepo.findBySerieIdOrderByDatePrevueDesc(serieId)
                .stream().map(AuditResponse::from).collect(Collectors.toList());
    }

    // ═══════════════════════════════════════════════════════════
    // PLANNING MENSUEL
    // ═══════════════════════════════════════════════════════════

    @Transactional(readOnly = true)
    public List<AuditResponse> getPlanningMois(Integer plantId, int annee, int mois) {
        LocalDate debut = LocalDate.of(annee, mois, 1);
        LocalDate fin   = debut.withDayOfMonth(debut.lengthOfMonth());
        List<AuditProduit> audits = plantId != null
                ? auditRepo.findByPlantAndMois(plantId, debut, fin)
                : auditRepo.findByMois(debut, fin);
        return audits.stream().map(AuditResponse::from).collect(Collectors.toList());
    }

    // ═══════════════════════════════════════════════════════════
    // DASHBOARD STATS
    // ═══════════════════════════════════════════════════════════

    @Transactional(readOnly = true)
    public Map<String, Object> getDashboardStats(Integer plantId) {
        Map<String, Object> stats = new LinkedHashMap<>();
        stats.put("totalAudits",       auditRepo.count());
        stats.put("planifies",         auditRepo.countByStatut(StatutAudit.PLANIFIE));
        stats.put("enCours",           auditRepo.countByStatut(StatutAudit.EN_COURS));
        stats.put("termines",          auditRepo.countByStatut(StatutAudit.TERMINE));
        stats.put("enRetard",          auditRepo.findEnRetard(LocalDate.now()).size());
        stats.put("qkDepasses",        auditRepo.countQkDepasses());
        stats.put("auditsProduit",     auditRepo.countByTypeAudit(TypeAudit.AUDIT_PRODUIT));
        stats.put("auditsReglePlates", auditRepo.countByTypeAudit(TypeAudit.AUDIT_REGLES_PLATES));
        stats.put("auditsMagasin",     auditRepo.countByTypeAudit(TypeAudit.AUDIT_MAGASIN_EXPORT));
        stats.put("auditsAujourdhui",  auditRepo.findAujourdhui(LocalDate.now()).size());

        LocalDate debutMois = LocalDate.now().withDayOfMonth(1);
        LocalDate finMois   = LocalDate.now().withDayOfMonth(LocalDate.now().lengthOfMonth());
        List<AuditProduit> terminesMois = auditRepo.findByMois(debutMois, finMois).stream()
                .filter(a -> a.getStatut() == StatutAudit.TERMINE && a.getValeurQK() != null)
                .collect(Collectors.toList());
        double qkMoyen = terminesMois.stream().mapToDouble(AuditProduit::getValeurQK).average().orElse(0);
        stats.put("qkMoyenMois", Math.round(qkMoyen * 100.0) / 100.0);

        return stats;
    }

    // ═══════════════════════════════════════════════════════════
    // 1. PLANIFICATION
    // ═══════════════════════════════════════════════════════════

    public AuditResponse planifierAudit(PlanifierAuditRequest req, Integer planificateurId) {
        Plant plant = plantRepo.findById(req.getPlantId())
                .orElseThrow(() -> new RuntimeException("Plant introuvable"));

        AuditProduit audit = new AuditProduit();
        audit.setTypeAudit(req.getTypeAudit());
        audit.setNatureAudit(req.getNatureAudit());
        audit.setStatut(StatutAudit.PLANIFIE);
        audit.setDatePrevue(req.getDatePrevue());
        audit.setDeadline(req.getDeadline());
        audit.setPlant(plant);
        audit.setSite(plant.getSite());
        audit.setFamilleCablage(req.getFamilleCablage());
        audit.setDomaine(req.getDomaine());
        audit.setObservations(req.getObservations());
        audit.setZoneExpedition(req.getZoneExpedition());
        audit.setDestinationExport(req.getDestinationExport());
        audit.setPdcaDeclenche(false);
        audit.setQkDepasseSeuil(false);
        audit.setRapportGenere(false);

        if (req.getSegmentId()  != null) segmentRepo.findById(req.getSegmentId()).ifPresent(audit::setSegment);
        if (req.getProjetId()   != null) projetRepo.findById(req.getProjetId()).ifPresent(audit::setProjet);
        if (req.getSerieId()    != null) serieRepo.findById(req.getSerieId()).ifPresent(audit::setSerie);
        if (req.getAuditeurId() != null) userRepo.findById(req.getAuditeurId()).ifPresent(audit::setAuditeur);
        if (req.getPlanificationId() != null) {
            planifRepo.findById(req.getPlanificationId()).ifPresent(audit::setPlanification);
        }

        userRepo.findById(planificateurId).ifPresent(audit::setPlanificateur);
        audit.setReference(genererReference(req.getTypeAudit()));

        AuditProduit saved = auditRepo.save(audit);

        // ── NOUVEAU : pré-remplit le brouillon Annexe 1A depuis le dernier audit
        //              du même auditeur + même plant + même mois (convenance UX,
        //              l'auditeur peut ensuite juste ajouter sa propre ligne via 1B) ──
        if (saved.getTypeAudit() == TypeAudit.AUDIT_PRODUIT) {
            annexeService.preRemplirAnnexe1ADepuisPrecedent(saved);
        }

        if (req.getTypeAudit() == TypeAudit.AUDIT_REGLES_PLATES
                && req.getInstruments() != null && !req.getInstruments().isEmpty()) {
            List<LigneChecklistReglePlate> lignes = req.getInstruments().stream().map(i -> {
                LigneChecklistReglePlate l = new LigneChecklistReglePlate();
                l.setAudit(saved);
                l.setNumeroInstrument(i.getNumeroInstrument());
                l.setTypeInstrument(i.getTypeInstrument());
                l.setLocalisation(i.getLocalisation());
                l.setPlageMesure(i.getPlageMesure());
                l.setPeriodiciteEnMois(i.getPeriodiciteEnMois() != null ? i.getPeriodiciteEnMois() : 3);
                l.setStatut(StatutChecklistItem.NON_VERIFIE);
                l.setProchaineVerification(req.getDatePrevue());
                return l;
            }).collect(Collectors.toList());
            checklistRepo.saveAll(lignes);
        }

        if (audit.getAuditeur() != null) {
            notifService.creer(audit.getAuditeur(), TypeNotification.AUDIT_ASSIGNE,
                    "Un audit " + labelType(req.getTypeAudit()) + " vous a été assigné pour le "
                            + req.getDatePrevue() + " — Réf: " + saved.getReference());
        }

        userRepo.findById(planificateurId).ifPresent(u ->
                historiqueService.log(u, TypeHistorique.AUDIT_PLANIFIE,
                        "Audit planifié : " + saved.getReference()));

        return AuditResponse.from(saved);
    }

    // ═══════════════════════════════════════════════════════════
    // 1.b MODIFIER AUDIT (expert)
    // ═══════════════════════════════════════════════════════════

    public AuditResponse modifierAudit(Long auditId, UpdateAuditRequest req, Integer expertId) {
        AuditProduit audit = auditRepo.findById(auditId)
                .orElseThrow(() -> new BusinessException("Audit introuvable."));

        LocalDate oldDatePrevue  = audit.getDatePrevue();
        LocalDate oldDeadline    = audit.getDeadline();
        NatureAudit oldNature    = audit.getNatureAudit();
        String oldDomaine        = audit.getDomaine();
        String oldFamille        = audit.getFamilleCablage();
        Integer oldAuditeurId    = audit.getAuditeur()  != null ? audit.getAuditeur().getId()  : null;
        Integer oldSerieId       = audit.getSerie()     != null ? audit.getSerie().getId()     : null;
        Integer oldProjetId      = audit.getProjet()    != null ? audit.getProjet().getId()    : null;
        Integer oldSegmentId     = audit.getSegment()   != null ? audit.getSegment().getId()   : null;
        Integer oldPlantId       = audit.getPlant()     != null ? audit.getPlant().getId()     : null;

        if (req.getDatePrevue() != null) audit.setDatePrevue(req.getDatePrevue());
        if (req.getDeadline()   != null) audit.setDeadline(req.getDeadline());

        if (req.getDeadline() != null) {
            audit.setDeadline(req.getDeadline());
            LocalDate today = LocalDate.now();

            if (req.getDeadline().isBefore(today)) {
                // Deadline dans le passé → EN_RETARD
                if (audit.getStatut() != StatutAudit.EN_RETARD)
                    audit.setStatutAvantRetard(audit.getStatut());
                audit.setStatut(StatutAudit.EN_RETARD);

            } else {
                // Deadline dans le futur → remettre au statut précédent
                if (audit.getStatut() == StatutAudit.EN_RETARD || audit.getStatutAvantRetard() != null) {
                    StatutAudit previous = audit.getStatutAvantRetard();
                    // ✅ statutAvantRetard fiable car sauvegardé au moment du passage EN_RETARD
                    audit.setStatut(previous != null ? previous : StatutAudit.PLANIFIE);
                    audit.setStatutAvantRetard(null);
                }
            }
        }


        if (req.getNatureAudit()    != null) audit.setNatureAudit(req.getNatureAudit());
        if (req.getFamilleCablage() != null) audit.setFamilleCablage(req.getFamilleCablage());
        if (req.getDomaine()        != null) audit.setDomaine(req.getDomaine());
        if (req.getObservations()   != null) audit.setObservations(req.getObservations());

        if (req.getPlantId() != null) {
            Plant plant = plantRepo.findById(req.getPlantId())
                    .orElseThrow(() -> new BusinessException("Plant introuvable."));
            audit.setPlant(plant);
            audit.setSite(plant.getSite());
        }

        if (req.getSegmentId() != null) segmentRepo.findById(req.getSegmentId()).ifPresent(audit::setSegment);
        if (req.getProjetId()  != null) projetRepo.findById(req.getProjetId()).ifPresent(audit::setProjet);
        if (req.getSerieId()   != null) serieRepo.findById(req.getSerieId()).ifPresent(audit::setSerie);

        Utilisateur oldAuditeur = audit.getAuditeur();
        if (req.getAuditeurId() != null)
            userRepo.findById(req.getAuditeurId()).ifPresent(audit::setAuditeur);

        AuditProduit saved = auditRepo.save(audit);

        List<String> changements = new ArrayList<>();
        if (req.getDatePrevue()    != null && !Objects.equals(oldDatePrevue, saved.getDatePrevue()))   changements.add("date prevue");
        if (req.getDeadline()      != null && !Objects.equals(oldDeadline,   saved.getDeadline()))     changements.add("deadline");
        if (req.getNatureAudit()   != null && !Objects.equals(oldNature,     saved.getNatureAudit()))  changements.add("nature");
        if (req.getDomaine()       != null && !Objects.equals(oldDomaine,    saved.getDomaine()))      changements.add("domaine");
        if (req.getFamilleCablage()!= null && !Objects.equals(oldFamille,    saved.getFamilleCablage()))changements.add("famille cablage");
        if (req.getAuditeurId()    != null && !Objects.equals(oldAuditeurId, saved.getAuditeur() != null ? saved.getAuditeur().getId() : null)) changements.add("auditeur");
        if (req.getSerieId()       != null && !Objects.equals(oldSerieId,    saved.getSerie()    != null ? saved.getSerie().getId()    : null)) changements.add("serie");
        if (req.getProjetId()      != null && !Objects.equals(oldProjetId,   saved.getProjet()   != null ? saved.getProjet().getId()   : null)) changements.add("projet");
        if (req.getSegmentId()     != null && !Objects.equals(oldSegmentId,  saved.getSegment()  != null ? saved.getSegment().getId()  : null)) changements.add("segment");
        if (req.getPlantId()       != null && !Objects.equals(oldPlantId,    saved.getPlant()    != null ? saved.getPlant().getId()    : null)) changements.add("plant");

        if (saved.getAuditeur() != null) {
            boolean auditeurChanged = oldAuditeur == null
                    || !oldAuditeur.getId().equals(saved.getAuditeur().getId());
            if (auditeurChanged) {
                notifService.creer(saved.getAuditeur(), TypeNotification.AUDIT_ASSIGNE,
                        "Un audit produit a ete modifie et vous a ete reassigne — Ref: " + saved.getReference());
            }
            if (!changements.isEmpty()) {
                notifService.creerComplete(
                        saved.getAuditeur(),
                        TypeNotification.INFORMATION,
                        "Audit modifie",
                        "L'expert a modifie : " + String.join(", ", changements) + " — Ref: " + saved.getReference(),
                        "/auditeur/audits/" + saved.getId(),
                        null);
            }
        }

        if (req.getDeadline() != null && !req.getDeadline().isBefore(LocalDate.now())) {
            demandeRepo.findTopByAuditIdAndStatutOrderByCreatedAtDesc(auditId, "EN_ATTENTE")
                    .ifPresent(d -> {
                        d.setStatut("TRAITEE");
                        demandeRepo.save(d);
                    });
        }

        // ── Historique : modification par l'expert (tracée sur le plant) ──
        userRepo.findById(expertId).ifPresent(expert -> {
            String detail = changements.isEmpty()
                    ? "Audit consulté/modifié sans changement : " + saved.getReference()
                    : "Audit modifié par l'expert (" + String.join(", ", changements) + ") — Réf: " + saved.getReference();
            historiqueService.logAudit(expert, TypeHistorique.AUDIT_MODIFIE, saved, detail);
        });

        return AuditResponse.from(saved);
    }
// ═══════════════════════════════════════════════════════════
    // 1.c MODIFIER AUDIT (par l'auditeur lui-même — ses propres audits,
    //     qu'ils aient été auto-planifiés ou assignés par l'expert)
    // ═══════════════════════════════════════════════════════════

    public AuditResponse modifierAuditParAuditeur(Long auditId, UpdateAuditRequest req, Integer auditeurConnecteId) {
        AuditProduit audit = auditRepo.findById(auditId)
                .orElseThrow(() -> new BusinessException("Audit introuvable."));

        Utilisateur auditeurConnecte = userRepo.findById(auditeurConnecteId)
                .orElseThrow(() -> new BusinessException("Utilisateur introuvable."));

        if (audit.getAuditeur() == null
                || !audit.getAuditeur().getId().equals(auditeurConnecteId)) {
            throw new BusinessException("Vous ne pouvez modifier que vos propres audits.");
        }

        LocalDate oldDatePrevue  = audit.getDatePrevue();
        LocalDate oldDeadline    = audit.getDeadline();
        NatureAudit oldNature    = audit.getNatureAudit();
        String oldDomaine        = audit.getDomaine();
        String oldFamille        = audit.getFamilleCablage();
        Utilisateur oldAuditeur  = audit.getAuditeur();

        if (req.getDatePrevue() != null) audit.setDatePrevue(req.getDatePrevue());

        if (req.getDeadline() != null) {
            audit.setDeadline(req.getDeadline());
            LocalDate today = LocalDate.now();
            if (req.getDeadline().isBefore(today)) {
                if (audit.getStatut() != StatutAudit.EN_RETARD)
                    audit.setStatutAvantRetard(audit.getStatut());
                audit.setStatut(StatutAudit.EN_RETARD);
            } else if (audit.getStatut() == StatutAudit.EN_RETARD || audit.getStatutAvantRetard() != null) {
                StatutAudit previous = audit.getStatutAvantRetard();
                audit.setStatut(previous != null ? previous : StatutAudit.PLANIFIE);
                audit.setStatutAvantRetard(null);
            }
        }

        if (req.getNatureAudit()    != null) audit.setNatureAudit(req.getNatureAudit());
        if (req.getFamilleCablage() != null) audit.setFamilleCablage(req.getFamilleCablage());
        if (req.getDomaine()        != null) audit.setDomaine(req.getDomaine());
        if (req.getObservations()   != null) audit.setObservations(req.getObservations());

        // ── Réassignation à un autre auditeur du MÊME plant uniquement ──
        boolean auditeurChange = false;
        if (req.getAuditeurId() != null && !req.getAuditeurId().equals(auditeurConnecteId)) {
            Utilisateur nouvelAuditeur = userRepo.findById(req.getAuditeurId())
                    .orElseThrow(() -> new BusinessException("Auditeur introuvable."));

            if (nouvelAuditeur.getRole() != RoleUser.AUDITEUR) {
                throw new BusinessException("La personne choisie doit avoir le rôle Auditeur.");
            }
            if (nouvelAuditeur.getPlant() == null || audit.getPlant() == null
                    || !nouvelAuditeur.getPlant().getId().equals(audit.getPlant().getId())) {
                throw new BusinessException("Vous ne pouvez réassigner l'audit qu'à un auditeur de votre plant.");
            }
            audit.setAuditeur(nouvelAuditeur);
            auditeurChange = true;
        }

        AuditProduit saved = auditRepo.save(audit);

        List<String> changements = new ArrayList<>();
        if (req.getDatePrevue()     != null && !Objects.equals(oldDatePrevue, saved.getDatePrevue()))    changements.add("date prévue");
        if (req.getDeadline()       != null && !Objects.equals(oldDeadline,   saved.getDeadline()))      changements.add("deadline");
        if (req.getNatureAudit()    != null && !Objects.equals(oldNature,     saved.getNatureAudit()))   changements.add("nature");
        if (req.getDomaine()        != null && !Objects.equals(oldDomaine,    saved.getDomaine()))       changements.add("domaine");
        if (req.getFamilleCablage() != null && !Objects.equals(oldFamille,    saved.getFamilleCablage())) changements.add("famille câblage");
        if (auditeurChange) changements.add("auditeur assigné");

        if (!changements.isEmpty()) {
            notifierPlantApresModifParAuditeur(saved, auditeurConnecte, changements);
        }

        // Si réassigné, prévenir en plus le nouvel auditeur directement
        if (auditeurChange && saved.getAuditeur() != null
                && !saved.getAuditeur().getId().equals(oldAuditeur.getId())) {
            notifService.creer(saved.getAuditeur(), TypeNotification.AUDIT_ASSIGNE,
                    "L'audit " + saved.getReference() + " vous a été réassigné par "
                            + auditeurConnecte.getPrenom() + " " + auditeurConnecte.getNom());
        }

        // ── Historique : modification/réassignation par l'auditeur ────────
        if (auditeurChange) {
            historiqueService.logAudit(auditeurConnecte, TypeHistorique.AUDIT_REASSIGNE, saved,
                    "Audit réassigné à " + saved.getAuditeur().getPrenom() + " " + saved.getAuditeur().getNom()
                            + " — Réf: " + saved.getReference());
        } else if (!changements.isEmpty()) {
            historiqueService.logAudit(auditeurConnecte, TypeHistorique.AUDIT_MODIFIE, saved,
                    "Audit modifié par l'auditeur (" + String.join(", ", changements) + ") — Réf: " + saved.getReference());
        }

        return AuditResponse.from(saved);
    }

    private void notifierPlantApresModifParAuditeur(AuditProduit audit, Utilisateur auteur, List<String> changements) {
        if (audit.getPlant() == null) return;
        Integer plantId = audit.getPlant().getId();
        String nomAuteur = auteur.getPrenom() + " " + auteur.getNom();
        String message = "L'auditeur " + nomAuteur + " a modifié : " + String.join(", ", changements)
                + " sur l'audit " + audit.getReference();

        userRepo.findAll().stream()
                .filter(u -> u.getPlant() != null && plantId.equals(u.getPlant().getId()))
                .filter(u -> u.getRole() == RoleUser.AUDITEUR || u.getRole() == RoleUser.EXPERT_PRODUCT_AUDIT)
                .filter(u -> !u.getId().equals(auteur.getId()))
                .forEach(u -> notifService.creerComplete(
                        u,
                        TypeNotification.INFORMATION,
                        "Audit modifié",
                        message,
                        "/auditeur/audits/" + audit.getId(),
                        null));
    }
    // ═══════════════════════════════════════════════════════════
    // 2. DÉMARRAGE
    // ═══════════════════════════════════════════════════════════

    public AuditResponse demarrerAudit(Long auditId, Integer auditeurId) {
        AuditProduit audit = getAudit(auditId);
        if (audit.getStatut() == StatutAudit.TERMINE)
            throw new BusinessException("Cet audit est deja termine.");
        if (audit.getStatut() == StatutAudit.ANNULE)
            throw new BusinessException("Un audit annule ne peut pas etre demarre.");

        if (audit.getStatut() == StatutAudit.PLANIFIE) {
            audit.setStatut(StatutAudit.EN_COURS);
            auditRepo.save(audit);
        }
        userRepo.findById(auditeurId).ifPresent(u -> {
            try {
                historiqueService.log(u, TypeHistorique.AUDIT_DEMARRE,
                        "Audit démarré : " + audit.getReference());
            } catch (Exception e) { /* best-effort */ }
        });
        return AuditResponse.from(audit);
    }

    // ═══════════════════════════════════════════════════════════
    // 3. SAISIE RÉSULTATS + CALCUL QK
    // ═══════════════════════════════════════════════════════════

    public AuditResponse saisirResultats(Long auditId, SaisirResultatAuditRequest req,
                                         Integer auditeurId) {
        AuditProduit audit = getAudit(auditId);
        audit.setDateRealisation(req.getDateRealisation() != null ? req.getDateRealisation() : LocalDate.now());
        audit.setObservations(req.getObservations());
        audit.setActionImmediate(req.getActionImmediate());
        if (req.getNombreComposants() != null) audit.setNombreComposants(req.getNombreComposants());

        if (req.getNombreComposants() != null && req.getNonConformites() != null) {
            calculerQK(audit, req);
            audit.calculerCouleurQK();
        }

        audit.setStatut(StatutAudit.TERMINE);
        audit.setTermineParAuditeur(true);
        AuditProduit saved = auditRepo.save(audit);

        // ── Régénère le rapport mensuel (Annexe 1A) du plant/mois maintenant que
        // dateRealisation + statut TERMINE sont réellement fixés. Le hook posé sur
        // la validation de l'Annexe 1B ne suffit pas : à ce stade-là, dateRealisation
        // est encore souvent null, donc il ne se déclenche pas. C'est ICI que
        // l'audit doit rejoindre les autres audits (autres auditeurs compris) du
        // même mois dans la même Annexe 1A.
        try {
            rapportMensuelService.regenererPourAudit(saved, auditeurId);
        } catch (Exception e) {
            // ✅ CORRIGÉ — on ne bloque toujours pas la fin de l'audit si la
            // régénération du rapport mensuel échoue, MAIS on logue désormais
            // en ERROR avec la stack trace complète (au lieu d'un simple WARN
            // avec e.getMessage()). Avant, un échec silencieux ici pouvait
            // laisser le rapport mensuel (PDF + compteur "Nombre d'audits")
            // bloqué à son ancien état pendant des mois sans qu'aucune trace
            // exploitable n'apparaisse dans les logs serveur.
            log.error("Régénération du rapport mensuel impossible pour l'audit {} (plant={}, {}/{})",
                    saved.getId(),
                    saved.getPlant() != null ? saved.getPlant().getNom() : null,
                    saved.getDateRealisation() != null ? saved.getDateRealisation().getMonthValue() : null,
                    saved.getDateRealisation() != null ? saved.getDateRealisation().getYear() : null,
                    e);
        }

        if (Boolean.TRUE.equals(saved.getQkDepasseSeuil()))
            envoyerNotifQKDepasse(saved);

        userRepo.findById(auditeurId).ifPresent(u ->
                historiqueService.log(u, TypeHistorique.AUDIT_TERMINE,
                        "Résultats saisis — Audit : " + audit.getReference()
                                + " — QK : " + audit.getValeurQK()));

        return AuditResponse.from(saved);
    }

    // ═══════════════════════════════════════════════════════════
    // 4. UPLOAD RAPPORT
    // ═══════════════════════════════════════════════════════════

    public AuditResponse uploadRapport(Long auditId, MultipartFile fichier, Integer userId) {
        AuditProduit audit = getAudit(auditId);
        try {
            java.nio.file.Path uploadPath = java.nio.file.Paths.get(UPLOAD_DIR);
            if (!java.nio.file.Files.exists(uploadPath))
                java.nio.file.Files.createDirectories(uploadPath);
            String ext     = getExtension(fichier.getOriginalFilename());
            String nomFich = "rapport_" + auditId + "_" + System.currentTimeMillis() + ext;
            java.nio.file.Path filePath = uploadPath.resolve(nomFich);
            fichier.transferTo(filePath.toFile());
            audit.setRapportFichierNom(nomFich);
            audit.setRapportUrl("/uploads/rapports-audit/" + nomFich);
            audit.setDateEnvoi(LocalDateTime.now());
        } catch (IOException e) {
            throw new BusinessException("Erreur lors de l'upload du rapport : " + e.getMessage());
        }
        AuditProduit saved = auditRepo.save(audit);
        userRepo.findById(userId).ifPresent(u ->
                historiqueService.log(u, TypeHistorique.AUDIT_RAPPORT_UPLOADE,
                        "Rapport uploadé pour l'audit : " + audit.getReference()));
        return AuditResponse.from(saved);
    }

    // ═══════════════════════════════════════════════════════════
    // 5. TERMINER PAR AUDITEUR
    // ═══════════════════════════════════════════════════════════

    public AuditResponse terminerParAuditeur(Long auditId, Integer auditeurId) {
        AuditProduit audit = getAudit(auditId);
        if (audit.getStatut() == StatutAudit.TERMINE)
            throw new BusinessException("Cet audit est déjà terminé.");
        if (audit.getStatut() == StatutAudit.ANNULE)
            throw new BusinessException("Un audit annulé ne peut pas être terminé.");
        audit.setStatut(StatutAudit.TERMINE);
        audit.setTermineParAuditeur(true);
        audit.setDateRealisation(LocalDate.now());
        AuditProduit saved = auditRepo.save(audit);

        // ── Même raison qu'au-dessus : c'est ici que dateRealisation est fixée,
        // donc c'est ici qu'il faut régénérer le rapport mensuel du mois.
        try {
            rapportMensuelService.regenererPourAudit(saved, auditeurId);
        } catch (Exception e) {
            // ✅ CORRIGÉ — voir commentaire équivalent dans saisirResultats() plus haut.
            log.error("Régénération du rapport mensuel impossible pour l'audit {} (plant={}, {}/{})",
                    saved.getId(),
                    saved.getPlant() != null ? saved.getPlant().getNom() : null,
                    saved.getDateRealisation() != null ? saved.getDateRealisation().getMonthValue() : null,
                    saved.getDateRealisation() != null ? saved.getDateRealisation().getYear() : null,
                    e);
        }

        if (audit.getPlanificateur() != null) {
            notifService.creer(audit.getPlanificateur(), TypeNotification.AUDIT_TERMINE_NOTIF,
                    "L'audit " + audit.getReference() + " a été marqué terminé par l'auditeur "
                            + (audit.getAuditeur() != null
                            ? audit.getAuditeur().getPrenom() + " " + audit.getAuditeur().getNom() : ""));
        }
        userRepo.findById(auditeurId).ifPresent(u ->
                historiqueService.log(u, TypeHistorique.AUDIT_TERMINE,
                        "Audit terminé par auditeur : " + audit.getReference()));
        return AuditResponse.from(saved);
    }

    // ═══════════════════════════════════════════════════════════
    // 6. DÉCLENCHER PDCA
    // ═══════════════════════════════════════════════════════════

    public AuditResponse declencherPdca(Long auditId, Integer userId) {
        AuditProduit audit = getAudit(auditId);
        audit.setPdcaDeclenche(true);
        audit.setDatePdca(LocalDateTime.now());
        userRepo.findById(userId).ifPresent(audit::setResponsablePdca);
        auditRepo.save(audit);
        userRepo.findAll().stream()
                .filter(u -> u.getRole() == RoleUser.RESPONSABLE_QUALITE_CENTRALE)
                .forEach(resp -> notifService.creer(resp, TypeNotification.AUDIT_PDCA_REQUIS,
                        "PDCA déclenché suite à l'audit " + audit.getReference()
                                + " (QK=" + (audit.getValeurQK() != null
                                ? String.format("%.1f", audit.getValeurQK()) : "N/A") + ")"));
        userRepo.findById(userId).ifPresent(u ->
                historiqueService.log(u, TypeHistorique.AUDIT_PDCA_DECLENCHE,
                        "PDCA déclenché pour audit : " + audit.getReference()));
        return AuditResponse.from(audit);
    }

    // ═══════════════════════════════════════════════════════════
    // 7. ANNULATION
    // ═══════════════════════════════════════════════════════════

    public AuditResponse annulerAudit(Long auditId, Integer userId) {
        AuditProduit audit = getAudit(auditId);
        if (audit.getStatut() == StatutAudit.TERMINE)
            throw new BusinessException("Un audit terminé ne peut pas être annulé.");
        audit.setStatut(StatutAudit.ANNULE);
        auditRepo.save(audit);
        userRepo.findById(userId).ifPresent(u ->
                historiqueService.log(u, TypeHistorique.AUDIT_ANNULE,
                        "Audit annulé : " + audit.getReference()));
        return AuditResponse.from(audit);
    }

    // ═══════════════════════════════════════════════════════════
    // 8. SUPPRIMER
    // ═══════════════════════════════════════════════════════════

    public void supprimerAudit(Long auditId, Integer userId) {
        AuditProduit audit = getAudit(auditId);
        if (audit.getAuditeur() != null && !audit.getAuditeur().getId().equals(userId)) {
            Utilisateur u = getUser(userId);
            if (u.getRole() != RoleUser.EXPERT_PRODUCT_AUDIT && u.getRole() != RoleUser.ADMIN)
                throw new BusinessException("Vous ne pouvez supprimer que vos propres audits.");
        }
        auditRepo.deleteById(auditId);
    }

    // ═══════════════════════════════════════════════════════════
    // 9. MODIFIER SÉRIE / DEADLINE
    // ═══════════════════════════════════════════════════════════

    public AuditResponse modifierSerie(Long auditId, Integer serieId) {
        AuditProduit audit = getAudit(auditId);
        Serie serie = serieRepo.findById(serieId)
                .orElseThrow(() -> new BusinessException("Série introuvable."));
        audit.setSerie(serie);
        return AuditResponse.from(auditRepo.save(audit));
    }

    public AuditResponse modifierDeadlineAudit(Long auditId, LocalDate deadline) {
        AuditProduit audit = getAudit(auditId);
        audit.setDeadline(deadline);
        if (deadline != null) {
            LocalDate today = LocalDate.now();
            if (deadline.isBefore(today)) {
                if (audit.getStatut() != StatutAudit.EN_RETARD)
                    audit.setStatutAvantRetard(audit.getStatut());
                audit.setStatut(StatutAudit.EN_RETARD);
            } else if (audit.getStatut() == StatutAudit.EN_RETARD) {
                StatutAudit previous = audit.getStatutAvantRetard();
                audit.setStatut(previous != null ? previous : StatutAudit.PLANIFIE);
                audit.setStatutAvantRetard(null);
            }
        }
        AuditProduit saved = auditRepo.save(audit);
        if (audit.getAuditeur() != null) {
            notifService.creer(audit.getAuditeur(), TypeNotification.INFORMATION,
                    "Deadline modifié pour l'audit " + audit.getReference()
                            + " — nouvelle date : " + deadline);
        }
        return AuditResponse.from(saved);
    }

    // ═══════════════════════════════════════════════════════════
    // SCHEDULER — marquer en retard
    // ═══════════════════════════════════════════════════════════

    public void marquerAuditsEnRetard() {

        // ✅ 1. Débloquer les audits EN_RETARD dont la deadline est repassée dans le futur
        List<AuditProduit> aDebloquer = auditRepo.findEnRetardAvecDeadlineFuture(LocalDate.now());
        aDebloquer.forEach(a -> {
            StatutAudit previous = a.getStatutAvantRetard();
            // ✅ Pas de dateDemarrage — on se base sur statutAvantRetard ou PLANIFIE par défaut
            a.setStatut(previous != null ? previous : StatutAudit.PLANIFIE);
            a.setStatutAvantRetard(null);
            auditRepo.save(a);
        });

        // ✅ 2. Marquer EN_RETARD les audits dont la deadline est dépassée
        List<AuditProduit> enRetard = auditRepo.findEnRetard(LocalDate.now());
        enRetard.forEach(a -> {
            if (a.getStatut() != StatutAudit.EN_RETARD)
                a.setStatutAvantRetard(a.getStatut());
            a.setStatut(StatutAudit.EN_RETARD);
            if (a.getAuditeur() != null) {
                notifService.creer(a.getAuditeur(), TypeNotification.AUDIT_EN_RETARD,
                        "L'audit " + a.getReference() + " prévu le "
                                + a.getDatePrevue() + " est en retard");
            }
            auditRepo.save(a);
        });
    }

    /**
     * Récupère tous les rapports de l'auditeur connecté, tous types d'audit confondus.
     */
    @Transactional(readOnly = true)
    public List<Map<String, Object>> getMesRapportsAllTypes(Integer auditeurId) {
        List<AuditProduit> audits = auditRepo.findByAuditeurId(auditeurId);

        return audits.stream()
                .filter(a -> a.getRapportGenerePdfUrl() != null || a.getRapportUrl() != null)
                .map(a -> {
                    Map<String, Object> map = new LinkedHashMap<>();
                    map.put("id", a.getId());
                    map.put("reference", a.getReference());

                    // Nom du rapport
                    String rapportNom = a.getRapportFichierNom();
                    if (rapportNom == null || rapportNom.isBlank()) {
                        rapportNom = "rapport_" + a.getReference();
                    }
                    map.put("rapportNom", rapportNom);

                    // URL du PDF
                    String pdfUrl = a.getRapportGenerePdfUrl();
                    if (pdfUrl == null || pdfUrl.isBlank()) {
                        pdfUrl = a.getRapportUrl();
                    }
                    map.put("rapportUrl", pdfUrl);
                    map.put("rapportGenerePdfUrl", pdfUrl);

                    // Type d'audit
                    String typeAudit = "";
                    if (a.getTypeAudit() == TypeAudit.AUDIT_PRODUIT) {
                        typeAudit = "produit";
                    } else if (a.getTypeAudit() == TypeAudit.AUDIT_REGLES_PLATES) {
                        typeAudit = "regle";
                    } else if (a.getTypeAudit() == TypeAudit.AUDIT_MAGASIN_EXPORT) {
                        typeAudit = "export";
                    }
                    map.put("typeAudit", typeAudit);
                    map.put("typeAuditLabel", labelType(a.getTypeAudit()));

                    map.put("statut", a.getStatut().name());
                    map.put("deadline", a.getDeadline() != null ? a.getDeadline().toString() : null);
                    map.put("datePrevue", a.getDatePrevue() != null ? a.getDatePrevue().toString() : null);
                    map.put("dateRealisation", a.getDateRealisation() != null ? a.getDateRealisation().toString() : null);
                    map.put("valeurQK", a.getValeurQK());

                    // Informations spécifiques
                    map.put("serieNom", a.getSerie() != null ? a.getSerie().getNom() : null);
                    map.put("projetNom", a.getProjet() != null ? a.getProjet().getNom() : null);
                    map.put("planificationNom", a.getPlanification() != null ? a.getPlanification().getNom() : null);
                    map.put("auditeurNom", a.getAuditeur() != null
                            ? a.getAuditeur().getPrenom() + " " + a.getAuditeur().getNom()
                            : null);
                    map.put("plantNom", a.getPlant() != null ? a.getPlant().getNom() : null);

                    // Spécifique export
                    map.put("semaineExport", a.getSemaineExport());
                    map.put("zoneExpedition", a.getZoneExpedition());

                    // Spécifique règle plate
                    map.put("dateProchaineVerification", a.getDateProchaineVerification() != null
                            ? a.getDateProchaineVerification().toString() : null);

                    map.put("dateEnvoi", a.getDateEnvoi());
                    return map;
                })
                .collect(Collectors.toList());
    }
    // ═══════════════════════════════════════════════════════════
    // UTILITAIRES PRIVÉS
    // ═══════════════════════════════════════════════════════════

    private void calculerQK(AuditProduit audit, SaisirResultatAuditRequest req) {
        double facteur = getFacteur(req.getNombreComposants());
        audit.setFacteur(facteur);
        if (req.getNonConformites() != null && !req.getNonConformites().isEmpty()) {
            double totalPts = req.getNonConformites().stream()
                    .mapToDouble(nc -> nc.getPoints() != null ? nc.getPoints() : 0.0)
                    .sum();
            audit.setTotalPoints(totalPts);
            double qk = getValeurQK(totalPts * facteur);
            audit.setValeurQK(qk);
            audit.setQkDepasseSeuil(qk > 0.5);
        } else {
            audit.setTotalPoints(0.0);
            audit.setValeurQK(0.0);
            audit.setQkDepasseSeuil(false);
        }
    }

    private double getFacteur(int composants) {
        for (int i = 0; i < SEUILS_COMPOSANTS.length; i++)
            if (composants <= SEUILS_COMPOSANTS[i]) return FACTEURS[i];
        return 0.5;
    }

    private double getValeurQK(double points) {
        for (int i = 0; i < SEUILS_POINTS.length - 1; i++)
            if (points >= SEUILS_POINTS[i] && points < SEUILS_POINTS[i + 1])
                return VALEURS_QK[i];
        return VALEURS_QK[VALEURS_QK.length - 1];
    }

    private void envoyerNotifQKDepasse(AuditProduit audit) {
        if (audit.getPlanificateur() != null) {
            notifService.creer(audit.getPlanificateur(), TypeNotification.ALERTE_QK,
                    "ALERTE QK : L'audit " + audit.getReference()
                            + " a un QK de " + audit.getValeurQK()
                            + " — Couleur : " + audit.getCouleurQK());
        }
        userRepo.findAll().stream()
                .filter(u -> {
                    if (u.getRole() == RoleUser.RESPONSABLE_QUALITE_CENTRALE) return true;
                    if (u.getRole() == RoleUser.CHEF_SERVICE
                            && u.getPlant() != null
                            && audit.getPlant() != null
                            && u.getPlant().getId().equals(audit.getPlant().getId())) return true;
                    return false;
                })
                .forEach(u -> notifService.creer(u, TypeNotification.AUDIT_QK_DEPASSE,
                        "QK dépassé pour l'audit " + audit.getReference()
                                + " (QK=" + String.format("%.1f", audit.getValeurQK()) + ")"));
    }

    private AuditProduit getAudit(Long id) {
        return auditRepo.findById(id)
                .orElseThrow(() -> new BusinessException("Audit introuvable."));
    }

    private Utilisateur getUser(Integer id) {
        return userRepo.findById(id)
                .orElseThrow(() -> new BusinessException("Utilisateur introuvable."));
    }

    private synchronized String genererReference(TypeAudit type) {
        String prefix = switch (type) {
            case AUDIT_PRODUIT        -> "AP";
            case AUDIT_REGLES_PLATES  -> "ARP";
            case AUDIT_MAGASIN_EXPORT -> "AME";
        };
        String datePart = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        char randomLetter = (char) ('A' + new Random().nextInt(26));
        String ref = prefix + "-" + datePart + "-" + randomLetter;
        int attempt = 0;
        while (auditRepo.existsByReference(ref) && attempt < 10) {
            randomLetter = (char) ('A' + new Random().nextInt(26));
            char secondChar = (char) ('A' + new Random().nextInt(26));
            ref = prefix + "-" + datePart + "-" + randomLetter + secondChar;
            attempt++;
        }
        if (auditRepo.existsByReference(ref))
            ref = prefix + "-" + datePart + "-" + System.currentTimeMillis();
        return ref;
    }

    private String labelType(TypeAudit type) {
        return switch (type) {
            case AUDIT_PRODUIT        -> "Produit";
            case AUDIT_REGLES_PLATES  -> "Règles plates";
            case AUDIT_MAGASIN_EXPORT -> "Magasin Export";
        };
    }

    private String getExtension(String filename) {
        if (filename == null || !filename.contains(".")) return ".pdf";
        return filename.substring(filename.lastIndexOf("."));
    }

    // ═══════════════════════════════════════════════════════════
    // ✅ AJOUTÉ Sprint 3+ — Enrichir AuditResponse avec la demande
    //    d'extension EN_ATTENTE si elle existe pour cet audit
    // ═══════════════════════════════════════════════════════════

    private void enrichirAvecDemande(AuditResponse r, Long auditId) {
        // ✅ Chercher la dernière demande peu importe son statut (EN_ATTENTE ou TRAITEE)
        demandeRepo.findTopByAuditIdOrderByCreatedAtDesc(auditId)
                .ifPresent(d -> {
                    AuditResponse.DemandeExtensionInfo info =
                            new AuditResponse.DemandeExtensionInfo();
                    info.setId(d.getId());
                    info.setRaisonType(d.getRaisonType());
                    info.setDescription(d.getDescription());
                    info.setDelaiDemande(
                            d.getDelaiDemande() != null
                                    ? d.getDelaiDemande().toString() : null);
                    info.setStatut(d.getStatut());
                    info.setCreatedAt(
                            d.getCreatedAt() != null
                                    ? d.getCreatedAt().toString() : null);
                    info.setAuditeurNom(
                            d.getAuditeur() != null
                                    ? d.getAuditeur().getPrenom() + " " + d.getAuditeur().getNom()
                                    : null);
                    r.setDemandeExtension(info);
                });
    }
}