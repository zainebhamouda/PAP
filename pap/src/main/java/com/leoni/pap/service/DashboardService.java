package com.leoni.pap.service;

import com.leoni.pap.dto.response.DashboardResponse;
import com.leoni.pap.dto.response.DashboardResponse.*;
import com.leoni.pap.entity.*;
import com.leoni.pap.entity.enums.TypeHistorique;
import com.leoni.pap.repository.*;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.TextStyle;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class DashboardService {

    private final UtilisateurRepository utilisateurRepo;
    private final SiteRepository        siteRepo;
    private final PlantRepository       plantRepo;
    private final SegmentRepository     segmentRepo;
    private final ProjetRepository      projetRepo;
    private final SerieRepository       serieRepo;
    private final HistoriqueRepository  historiqueRepo;

    public DashboardService(UtilisateurRepository utilisateurRepo,
                            SiteRepository siteRepo,
                            PlantRepository plantRepo,
                            SegmentRepository segmentRepo,
                            ProjetRepository projetRepo,
                            SerieRepository serieRepo,
                            HistoriqueRepository historiqueRepo) {
        this.utilisateurRepo = utilisateurRepo;
        this.siteRepo        = siteRepo;
        this.plantRepo       = plantRepo;
        this.segmentRepo     = segmentRepo;
        this.projetRepo      = projetRepo;
        this.serieRepo       = serieRepo;
        this.historiqueRepo  = historiqueRepo;
    }

    public DashboardResponse getDashboard() {

        List<Utilisateur> tous   = utilisateurRepo.findAll();
        List<Plant>       plants = plantRepo.findAll();
        DashboardResponse r      = new DashboardResponse();

        // ── Stats globales utilisateurs ───────────────────────────
        r.setTotalUtilisateurs(tous.size());

        long actifs = tous.stream()
                .filter(u -> Boolean.TRUE.equals(u.getActif()) && u.getMotDePasse() != null)
                .count();
        r.setUtilisateursActifs((int) actifs);

        long inactifs = tous.stream()
                .filter(u -> Boolean.FALSE.equals(u.getActif()) && u.getMotDePasse() != null)
                .count();
        r.setUtilisateursInactifs((int) inactifs);

        long nonInscrits = tous.stream()
                .filter(u -> u.getMotDePasse() == null)
                .count();
        r.setUtilisateursNonInscrits((int) nonInscrits);

        Map<String, Long> parRole = tous.stream()
                .collect(Collectors.groupingBy(u -> u.getRole().name(), Collectors.counting()));
        r.setUtilisateursParRole(parRole);

        // ── Stats infrastructure ──────────────────────────────────
        r.setTotalSites((int) siteRepo.count());
        r.setTotalPlants((int) plantRepo.count());
        r.setTotalPlantsActifs((int) plants.stream()
                .filter(p -> Boolean.TRUE.equals(p.getActif())).count());
        r.setTotalSegments((int) segmentRepo.count());
        r.setTotalProjets((int) projetRepo.count());

        List<Serie> series = serieRepo.findAll();
        r.setTotalSeries(series.size());
        r.setTotalSeriesActives((int) series.stream()
                .filter(s -> Boolean.TRUE.equals(s.getActif())).count());

        // ── Activité 7 derniers jours depuis Historique ───────────
        r.setActivite7Jours(calculerActivite7Jours());

        // ── Stats par site ─────────────────────────────────────────
        List<Site> sites = siteRepo.findAll();

        Map<Integer, List<Utilisateur>> usersParSite = tous.stream()
                .filter(u -> u.getSite() != null)
                .collect(Collectors.groupingBy(u -> u.getSite().getId()));

        Map<Integer, List<Plant>> plantsParSite = plants.stream()
                .filter(p -> p.getSite() != null)
                .collect(Collectors.groupingBy(p -> p.getSite().getId()));

        List<StatSiteResponse> statsParSite = sites.stream().map(site -> {
                    List<Utilisateur> usrs      = usersParSite.getOrDefault(site.getId(), List.of());
                    List<Plant>       sitePlants = plantsParSite.getOrDefault(site.getId(), List.of());

                    int nbSegments = sitePlants.stream()
                            .mapToInt(p -> p.getSegments() != null ? p.getSegments().size() : 0).sum();
                    int nbProjets = sitePlants.stream()
                            .flatMap(p -> p.getSegments() != null ? p.getSegments().stream() : java.util.stream.Stream.empty())
                            .mapToInt(seg -> seg.getProjets() != null ? seg.getProjets().size() : 0).sum();
                    int nbSeries = sitePlants.stream()
                            .flatMap(p -> p.getSegments() != null ? p.getSegments().stream() : java.util.stream.Stream.empty())
                            .flatMap(seg -> seg.getProjets() != null ? seg.getProjets().stream() : java.util.stream.Stream.empty())
                            .mapToInt(proj -> proj.getSeries() != null ? proj.getSeries().size() : 0).sum();

                    StatSiteResponse s = new StatSiteResponse();
                    s.setSiteNom(site.getNom());
                    s.setSiteLocalisation(site.getLocalisation());
                    s.setTotalUtilisateurs(usrs.size());
                    s.setAuditeurs((int) usrs.stream().filter(u -> u.getRole() == RoleUser.AUDITEUR).count());
                    s.setChefs((int) usrs.stream().filter(u -> u.getRole() == RoleUser.CHEF_SERVICE).count());
                    s.setResponsables((int) usrs.stream().filter(u -> u.getRole() == RoleUser.RESPONSABLE_QUALITE_CENTRALE).count());
                    s.setExperts((int) usrs.stream().filter(u -> u.getRole() == RoleUser.EXPERT_PRODUCT_AUDIT).count());
                    s.setTotalPlants(sitePlants.size());
                    s.setTotalSegments(nbSegments);
                    s.setTotalProjets(nbProjets);
                    s.setTotalSeries(nbSeries);
                    return s;
                })
                .sorted(Comparator.comparing(StatSiteResponse::getTotalUtilisateurs).reversed())
                .collect(Collectors.toList());

        r.setStatsParSite(statsParSite);

        // ── Derniers inscrits ──────────────────────────────────────
        List<DernierInscritResponse> derniers = tous.stream()
                .filter(u -> u.getMotDePasse() != null)
                .sorted(Comparator.comparing(Utilisateur::getId).reversed())
                .limit(8)
                .map(u -> {
                    DernierInscritResponse d = new DernierInscritResponse();
                    d.setId(u.getId());
                    d.setNom(u.getNom());
                    d.setPrenom(u.getPrenom());
                    d.setMatricule(u.getMatricule());
                    d.setRole(u.getRole().name());
                    d.setSite(u.getSite() != null ? u.getSite().getNom() : "—");
                    return d;
                })
                .collect(Collectors.toList());

        r.setDerniersInscrits(derniers);
        return r;
    }

    // ── Activité 7 derniers jours ─────────────────────────────────
    private List<JourActiviteResponse> calculerActivite7Jours() {

        // Récupérer tous les historiques des 7 derniers jours
        LocalDateTime debut = LocalDate.now().minusDays(6).atStartOfDay();
        List<Historique> historiques = historiqueRepo.findAll().stream()
                .filter(h -> h.getDateAction() != null && h.getDateAction().isAfter(debut))
                .collect(Collectors.toList());

        // Grouper par date (LocalDate)
        Map<LocalDate, List<Historique>> parDate = historiques.stream()
                .collect(Collectors.groupingBy(h -> h.getDateAction().toLocalDate()));

        // Construire la liste des 7 jours (du plus ancien au plus récent)
        List<JourActiviteResponse> result = new ArrayList<>();
        for (int i = 6; i >= 0; i--) {
            LocalDate date = LocalDate.now().minusDays(i);
            List<Historique> joursHistos = parDate.getOrDefault(date, List.of());

            JourActiviteResponse jour = new JourActiviteResponse();

            // Abréviation du jour en français
            String abrev = date.getDayOfWeek()
                    .getDisplayName(TextStyle.SHORT, java.util.Locale.FRENCH);
            jour.setJour(abrev.substring(0, 1).toUpperCase() + abrev.substring(1, Math.min(3, abrev.length())));
            jour.setDate(date.toString());

            // Connexions = CONNEXION
            long connexions = joursHistos.stream()
                    .filter(h -> h.getType() == TypeHistorique.CONNEXION)
                    .count();
            jour.setConnexions((int) connexions);

            // Inscriptions = INSCRIPTION
            long inscriptions = joursHistos.stream()
                    .filter(h -> h.getType() == TypeHistorique.INSCRIPTION)
                    .count();
            jour.setInscriptions((int) inscriptions);

            // Actions admin = UTILISATEUR_CREE + UTILISATEUR_MODIFIE +
            //                 UTILISATEUR_SUPPRIME + ROLE_CHANGE +
            //                 COMPTE_ACTIVE + COMPTE_DESACTIVE
            long actionsAdmin = joursHistos.stream()
                    .filter(h -> h.getType() == TypeHistorique.UTILISATEUR_CREE
                            || h.getType() == TypeHistorique.UTILISATEUR_MODIFIE
                            || h.getType() == TypeHistorique.UTILISATEUR_SUPPRIME
                            || h.getType() == TypeHistorique.ROLE_CHANGE
                            || h.getType() == TypeHistorique.COMPTE_ACTIVE
                            || h.getType() == TypeHistorique.COMPTE_DESACTIVE)
                    .count();
            jour.setActionsAdmin((int) actionsAdmin);

            result.add(jour);
        }
        return result;
    }
}