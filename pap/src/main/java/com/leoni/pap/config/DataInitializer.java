package com.leoni.pap.config;

import com.leoni.pap.entity.*;
import com.leoni.pap.entity.RoleUser;
import com.leoni.pap.repository.*;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Set;
import java.util.stream.Collectors;

@Configuration
public class DataInitializer {

    @Bean
    CommandLineRunner initData(
            SiteRepository        siteRepo,
            PlantRepository       plantRepo,
            SegmentRepository     segmentRepo,
            ProjetRepository      projetRepo,
            UtilisateurRepository utilisateurRepo,
            PasswordEncoder       passwordEncoder
    ) {
        return args -> {

            System.out.println("================================================");
            System.out.println("🚀 DataInitializer — démarrage...");
            System.out.println("================================================");

            // ── SITES + PLANTS + SEGMENTS + PROJETS ───────────────
            if (siteRepo.count() == 0) {
                System.out.println("📦 Création des sites, plants, segments, projets...");

                Site mateur_south = creerSite(siteRepo, "Mateur South",  "Mateur, Bizerte",         48265, 19381, 1, 7346, 6273, 1073);
                Site mateur_north = creerSite(siteRepo, "Mateur North",  "Mateur, Bizerte",         30740, 12357, 1, 3697, 2999,  698);
                Site sidi_bouali  = creerSite(siteRepo, "Sidi Bouali",   "Sidi Bouali, Sousse",     37700,  8600, 1, 2690, 2278,  412);
                Site sousse       = creerSite(siteRepo, "Sousse",        "Sousse",                 141055, 70900, 5, 9109, 6488, 2621);
                Site menzel_hayet = creerSite(siteRepo, "Menzel Hayet",  "Menzel Hayet, Kairouan", 102000, 38040, 2, 5849, 4639, 1210);

                System.out.println("  ✔ 5 sites créés");

                // Plants
                Plant bmw        = creerPlant(plantRepo, "BMW Sousse",              "BMW-SOU",  "BMW",               sousse);
                Plant vw         = creerPlant(plantRepo, "VW Sousse",               "VW-SOU",   "Volkswagen",        sousse);
                Plant audi       = creerPlant(plantRepo, "Audi Sousse",             "AUDI-SOU", "Audi",              sousse);
                Plant mercedes   = creerPlant(plantRepo, "Mercedes Sousse",         "MB-SOU",   "Mercedes",          sousse);
                Plant porsche    = creerPlant(plantRepo, "Porsche Sousse",          "POR-SOU",  "Porsche",           sousse);
                Plant stellantis = creerPlant(plantRepo, "Stellantis Mateur South", "STEL-MS",  "Stellantis",        mateur_south);
                Plant ford       = creerPlant(plantRepo, "Ford Mateur North",       "FORD-MN",  "Ford",              mateur_north);
                Plant skoda      = creerPlant(plantRepo, "Skoda Sidi Bouali",       "SKODA-SB", "Skoda",             sidi_bouali);
                Plant lamborghini= creerPlant(plantRepo, "Lamborghini Menzel Hayet","LAMB-MH",  "Lamborghini",       menzel_hayet);
                Plant forvia     = creerPlant(plantRepo, "Forvia Menzel Hayet",     "FORV-MH",  "Forvia / Faurecia", menzel_hayet);

                System.out.println("  ✔ 10 plants créés");

                // Segments BMW
                Segment bmw31 = creerSegment(segmentRepo, "Segment 31", bmw);
                Segment bmw32 = creerSegment(segmentRepo, "Segment 32", bmw);
                Segment bmw33 = creerSegment(segmentRepo, "Segment 33", bmw);
                // Segments VW
                Segment vw31  = creerSegment(segmentRepo, "Segment 31", vw);
                Segment vw32  = creerSegment(segmentRepo, "Segment 32", vw);
                Segment vw33  = creerSegment(segmentRepo, "Segment 33", vw);
                // Segments Audi
                Segment au31  = creerSegment(segmentRepo, "Segment 31", audi);
                Segment au32  = creerSegment(segmentRepo, "Segment 32", audi);
                // Segments Mercedes
                Segment mb31  = creerSegment(segmentRepo, "Segment 31", mercedes);
                Segment mb32  = creerSegment(segmentRepo, "Segment 32", mercedes);
                // Segments Porsche
                Segment po31  = creerSegment(segmentRepo, "Segment 31", porsche);
                Segment po32  = creerSegment(segmentRepo, "Segment 32", porsche);
                // Segments autres
                Segment st31  = creerSegment(segmentRepo, "Segment 31", stellantis);
                Segment st32  = creerSegment(segmentRepo, "Segment 32", stellantis);
                Segment fo31  = creerSegment(segmentRepo, "Segment 31", ford);
                Segment fo32  = creerSegment(segmentRepo, "Segment 32", ford);
                Segment sk31  = creerSegment(segmentRepo, "Segment 31", skoda);
                Segment la31  = creerSegment(segmentRepo, "Segment 31", lamborghini);
                Segment fv31  = creerSegment(segmentRepo, "Segment 31", forvia);

                System.out.println("  ✔ 19 segments créés");

                // Projets
                creerProjet(projetRepo, "BMW G2X",            "Projet BMW Série 3/4 (G20 G21 G22 G23 G26 G28 G29 G80 G82 G83) — Seg 32", bmw32);
                creerProjet(projetRepo, "BMW G0X",            "Projet BMW Série X (G05 G06 G07) — Seg 31",                                bmw31);
                creerProjet(projetRepo, "BMW G4X",            "Projet BMW Série M (M3 M4 M5) — Seg 33",                                   bmw33);
                creerProjet(projetRepo, "VW MQB",             "Projet VW Plateforme MQB (Golf Passat Tiguan) — Seg 32",                   vw32);
                creerProjet(projetRepo, "VW PPE",             "Projet VW Plateforme Premium Electric (ID.4 ID.7) — Seg 31",               vw31);
                creerProjet(projetRepo, "Audi MLB",           "Projet Audi MLB (A4 A5 A6 Q5 Q7) — Seg 32",                               au32);
                creerProjet(projetRepo, "Audi MEB",           "Projet Audi MEB (e-tron Q4) — Seg 31",                                    au31);
                creerProjet(projetRepo, "Mercedes MFA2",      "Projet Mercedes MFA2 (Classe A B CLA GLB) — Seg 32",                      mb32);
                creerProjet(projetRepo, "Porsche MSB",        "Projet Porsche MSB (Panamera Cayenne) — Seg 32",                          po32);
                creerProjet(projetRepo, "Stellantis STLA Med","Projet Stellantis STLA Medium (308 C5X) — Seg 32",                        st32);
                creerProjet(projetRepo, "Ford C2",            "Projet Ford C2 (Focus Kuga) — Seg 32",                                    fo32);
                creerProjet(projetRepo, "Skoda MQB",          "Projet Skoda MQB (Octavia Kodiaq) — Seg 31",                              sk31);
                creerProjet(projetRepo, "Lamborghini LP",     "Projet Lamborghini Urus Huracan — Seg 31",                                la31);
                creerProjet(projetRepo, "Forvia Acoustic",    "Projet Forvia Modules Acoustiques — Seg 31",                              fv31);

                System.out.println("  ✔ 14 projets créés");
                System.out.println("✅ Sites / Plants / Segments / Projets — OK");

            } else {
                System.out.println("ℹ️  Sites déjà présents (" + siteRepo.count() + ") — init ignorée");
            }

            // ── UTILISATEURS ──────────────────────────────────────
            Set<String> existants = utilisateurRepo.findAll()
                    .stream().map(Utilisateur::getMatricule).collect(Collectors.toSet());

            int ajoutes = 0;

            String[] auditeurs = {
                    "278001","278002","278003","278004","278005",
                    "278006","278007","278008","278009","278010",
                    "278011","278012","278013","278014","278015",
                    "278016","278017","278018","278019","278020"
            };
            for (String m : auditeurs) {
                if (!existants.contains(m)) {
                    utilisateurRepo.save(preCreate(m, RoleUser.AUDITEUR, passwordEncoder));
                    ajoutes++;
                }
            }

            String[] chefs = {
                    "278021","278022","278023","278024","278025",
                    "278026","278027","278028","278029","278030"
            };
            for (String m : chefs) {
                if (!existants.contains(m)) {
                    utilisateurRepo.save(preCreate(m, RoleUser.CHEF_SERVICE, passwordEncoder));
                    ajoutes++;
                }
            }

            String[] experts = {"278031","278032","278033","278034","278035"};
            for (String m : experts) {
                if (!existants.contains(m)) {
                    utilisateurRepo.save(preCreate(m, RoleUser.EXPERT_PRODUCT_AUDIT, passwordEncoder));
                    ajoutes++;
                }
            }

            String[] responsables = {"278041","278042"};
            for (String m : responsables) {
                if (!existants.contains(m)) {
                    utilisateurRepo.save(preCreate(m, RoleUser.RESPONSABLE_QUALITE_CENTRALE, passwordEncoder));
                    ajoutes++;
                }
            }

            if (!existants.contains("278000")) {
                Utilisateur admin = preCreate("278000", RoleUser.ADMIN, passwordEncoder);
                admin.setActif(true); // admin toujours actif
                utilisateurRepo.save(admin);
                ajoutes++;
            }

            if (ajoutes > 0) {
                System.out.println("✅ " + ajoutes + " utilisateur(s) créé(s)");
            } else {
                System.out.println("ℹ️  Utilisateurs déjà présents — init ignorée");
            }

            System.out.println("================================================");
            System.out.println("✅ BACKEND DÉMARRÉ SANS ERREUR — port 8080");
            System.out.println("================================================");
        };
    }

    // ── Helpers ───────────────────────────────────────────────

    private Site creerSite(SiteRepository repo, String nom, String loc,
                           int total, int prod, int nbPlants,
                           int totalHc, int direct, int indirect) {
        Site s = new Site();
        s.setNom(nom);
        s.setLocalisation(loc);
        s.setTotalSpaceM2(total);
        s.setProductionSpaceM2(prod);
        s.setNumberOfPlants(nbPlants);
        s.setTotalHc(totalHc);
        s.setDirectHc(direct);
        s.setIndirectHc(indirect);
        return repo.save(s);
    }

    private Plant creerPlant(PlantRepository repo, String nom, String code,
                             String client, Site site) {
        Plant p = new Plant();
        p.setNom(nom);
        p.setCode(code);
        p.setClientNom(client);
        p.setActif(true);
        p.setSite(site);
        return repo.save(p);
    }

    private Segment creerSegment(SegmentRepository repo, String nom, Plant plant) {
        Segment s = new Segment();
        s.setNom(nom);
        s.setPlant(plant);
        return repo.save(s);
    }

    private Projet creerProjet(ProjetRepository repo, String nom,
                               String desc, Segment segment) {
        Projet p = new Projet();
        p.setNom(nom);
        p.setDescription(desc);
        p.setSegment(segment);
        return repo.save(p);
    }

    private Utilisateur preCreate(String matricule, RoleUser role,
                                  PasswordEncoder enc) {
        Utilisateur u = new Utilisateur();
        u.setMatricule(matricule);
        u.setRole(role);
        u.setActif(false);
        u.setMotDePasse(enc.encode("Leoni@2026"));
        u.setEmailNotificationsActif(false);
        u.setRecevoirNotifications(false);
        return u;
    }
}