package com.leoni.pap.service;

import com.leoni.pap.entity.*;
import com.leoni.pap.entity.enums.*;
import com.leoni.pap.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.client.ResourceAccessException;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

/**
 * IaService — Intégration des modèles IA Python dans Spring Boot
 *
 * Ce service appelle l'API Flask (app_ia.py) via HTTP.
 * Si l'API est indisponible, il retourne un fallback calculé localement.
 *
 * Modèle 1 : Prédiction QK depuis données des annexes
 * Modèle 2 : Classement RH et recommandation de promotion
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class IaService {

    private final AuditProduitRepository       auditRepo;
    private final AuditProduitAnnexeRepository annexeRepo;
    private final UtilisateurRepository        userRepo;
    private final PassageCertificationRepository passageRepo;
    private final RestTemplate                 restTemplate;

    @Value("${ia.api.url:http://localhost:5000}")
    private String IA_API_URL;

    // ═══════════════════════════════════════════════════════════
    // MODÈLE 1 — Prédiction QK depuis les annexes d'un audit
    // ═══════════════════════════════════════════════════════════

    /**
     * Appelle le modèle IA pour prédire le QK d'un audit
     * à partir des données de ses annexes.
     *
     * Appelé depuis AuditDetailAuditeur.jsx quand l'auditeur
     * finalise ses annexes (avant de saisir le QK manuellement).
     *
     * @param auditId identifiant de l'audit
     * @return Map avec qkPredit, couleurPredite, confiance, message
     */
    public Map<String, Object> predireQK(Long auditId) {
        try {
            AuditProduit audit = auditRepo.findById(auditId)
                    .orElseThrow(() -> new RuntimeException("Audit introuvable: " + auditId));

            // Construire le body pour l'API IA
            Map<String, Object> body = construireBodyQK(audit);

            // Appel HTTP vers Flask
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);

            ResponseEntity<Map> response = restTemplate.postForEntity(
                    IA_API_URL + "/api/ia/predire-qk",
                    entity, Map.class
            );

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                log.info("IA QK prédit pour audit {}: QK={}", auditId,
                        response.getBody().get("qkPredit"));
                return response.getBody();
            }

        } catch (ResourceAccessException e) {
            log.warn("API IA non disponible (Flask arrêté?): {}", e.getMessage());
        } catch (Exception e) {
            log.error("Erreur appel IA pour audit {}: {}", auditId, e.getMessage());
        }

        // Fallback local si l'API est indisponible
        return fallbackCalculQK(auditId);
    }

    /**
     * Construit le body JSON pour l'endpoint /api/ia/predire-qk
     * en extrayant les données réelles des annexes de l'audit.
     */
    private Map<String, Object> construireBodyQK(AuditProduit audit) {
        List<AuditProduitAnnexe> annexes = annexeRepo.findByAuditId(audit.getId());

        int nbNonConf      = 0;
        int nbCriteresKo   = 0;
        int nbCriteresTotal = 0;
        int nbFormsValides  = 0;

        // ── NOUVEAU : calculer le total des points depuis les défauts ──
        // Si l'Annexe 1B est remplie, on lit directement ses totalPoints
        // Sinon, on extrait depuis les formDataJson des autres annexes
        double nbPointsTotal = 0.0;

        for (AuditProduitAnnexe annexe : annexes) {
            if (Boolean.TRUE.equals(annexe.getFormValide())) nbFormsValides++;

            String json = annexe.getFormDataJson();
            if (json == null || json.isEmpty()) continue;

            Map<String, Integer> analyse = analyserFormDataJson(json);
            nbNonConf       += analyse.getOrDefault("nbNonConf", 0);
            nbCriteresKo    += analyse.getOrDefault("nbKo",      0);
            nbCriteresTotal += analyse.getOrDefault("nbTotal",   30);

            // Lire totalPoints depuis Annexe 1B si disponible
            if ("1B".equals(annexe.getTypeAnnexe())) {
                try {
                    com.fasterxml.jackson.databind.ObjectMapper mapper =
                            new com.fasterxml.jackson.databind.ObjectMapper();
                    java.util.Map<String, Object> formData = mapper.readValue(json,
                            new com.fasterxml.jackson.core.type.TypeReference<>() {});

                    // Lire totalPoints (calculé côté React = Σ freq × pondération)
                    Object tp = formData.get("totalPoints");
                    if (tp != null) {
                        nbPointsTotal = Double.parseDouble(tp.toString());
                    }

                    // Lire aussi depuis les défauts individuels (fallback)
                    if (nbPointsTotal == 0) {
                        Object defautsObj = formData.get("defauts");
                        if (defautsObj instanceof java.util.List<?> defauts) {
                            for (Object d : defauts) {
                                if (d instanceof java.util.Map<?, ?> dm) {
                                    Object freq  = dm.get("freq");
                                    Object pts   = dm.get("pointsDefect");
                                    Object total = dm.get("totalDefectPoints");
                                    if (total != null) {
                                        nbPointsTotal += Double.parseDouble(total.toString());
                                    } else if (freq != null && pts != null) {
                                        nbPointsTotal += Double.parseDouble(freq.toString())
                                                * Double.parseDouble(pts.toString());
                                    }
                                }
                            }
                        }
                    }
                } catch (Exception e) {
                    log.debug("Impossible de lire totalPoints depuis 1B: {}", e.getMessage());
                }
            }
        }

        double pctConformite = nbCriteresTotal > 0
                ? 100.0 - ((double) nbCriteresKo / nbCriteresTotal * 100)
                : 100.0;

        String nature = audit.getNatureAudit() != null
                ? audit.getNatureAudit().name()
                : "NON_DESTRUCTIF";

        Map<String, Object> body = new java.util.HashMap<>();
        body.put("auditId",              audit.getId());
        body.put("nbComposants",         audit.getNombreComposants() != null
                ? audit.getNombreComposants() : 50);
        // ← NOUVEAU : envoyer le total des points pour le calcul classique
        body.put("nbPointsTotal",        nbPointsTotal);
        body.put("natureAudit",          nature);
        body.put("nbNonConformites",     nbNonConf);
        body.put("nbCriteresKo",         nbCriteresKo);
        body.put("nbCriteresTotal",      nbCriteresTotal);
        body.put("pctConformite",        pctConformite);
        body.put("nbAnnexesImportees",   annexes.stream()
                .filter(a -> Boolean.TRUE.equals(a.getImporte())).count());
        body.put("nbFormsValides",       nbFormsValides);

        return body;
    }

    /**
     * Analyse un formDataJson pour extraire le nb de KO, non-conformités, total.
     * Supporte les formats : {rows: [{resultat: 'conforme'/'non conforme'}]},
     *                         {criteres: {k: 'ok'/'ko'}}
     */
    private Map<String, Integer> analyserFormDataJson(String json) {
        Map<String, Integer> result = new HashMap<>();
        result.put("nbNonConf", 0);
        result.put("nbKo",      0);
        result.put("nbTotal",   30);

        try {
            com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
            Map<String, Object> data = mapper.readValue(json, new com.fasterxml.jackson.core.type.TypeReference<>() {});

            int ko    = 0;
            int total = 0;

            // Format 1 : {rows: [{resultat: 'non conforme'}]}
            Object rowsObj = data.get("rows");
            if (rowsObj instanceof List<?> rows) {
                for (Object rowObj : rows) {
                    if (rowObj instanceof Map<?, ?> row) {
                        total++;
                        Object res = row.get("resultat");
                        if (res != null && res.toString().toLowerCase().contains("non")) ko++;
                    }
                }
            }

            // Format 2 : {criteres: {key: 'ko'/'ok'}}
            Object criteObj = data.get("criteres");
            if (criteObj instanceof Map<?, ?> criteres) {
                for (Object val : criteres.values()) {
                    total++;
                    if (val != null && val.toString().toLowerCase().contains("ko")) ko++;
                }
            }

            // Format 3 : {scores: {k: 10/8/6/4/2/0}}
            Object scoresObj = data.get("scores");
            if (scoresObj instanceof Map<?, ?> scores) {
                for (Object val : scores.values()) {
                    if (!"NA".equals(val)) {
                        total++;
                        try {
                            double v = Double.parseDouble(val.toString());
                            if (v < 6) ko++;
                        } catch (Exception ignored) {}
                    }
                }
            }

            result.put("nbKo",      ko);
            result.put("nbNonConf", ko);
            result.put("nbTotal",   Math.max(total, 1));

        } catch (Exception e) {
            log.debug("Impossible de parser formDataJson: {}", e.getMessage());
        }

        return result;
    }

    /**
     * Fallback si l'API Python n'est pas disponible.
     * Utilise la formule métier LEONI directement en Java.
     */
    private Map<String, Object> fallbackCalculQK(Long auditId) {
        try {
            AuditProduit audit = auditRepo.findById(auditId).orElse(null);
            if (audit == null) return Map.of("erreur", "Audit introuvable");

            List<AuditProduitAnnexe> annexes = annexeRepo.findByAuditId(auditId);

            int nbNonConf  = 0;
            int nbComposants = audit.getNombreComposants() != null ? audit.getNombreComposants() : 50;

            for (AuditProduitAnnexe a : annexes) {
                if (a.getFormDataJson() != null) {
                    Map<String, Integer> analyse = analyserFormDataJson(a.getFormDataJson());
                    nbNonConf += analyse.getOrDefault("nbKo", 0);
                }
            }

            double facteur = 1.0;
            if (audit.getNatureAudit() == NatureAudit.DESTRUCTIF) facteur = 1.5;
            if (audit.getNatureAudit() == NatureAudit.REQUALIFICATION) facteur = 0.8;

            double qk = (nbComposants > 0) ? (double) nbNonConf / nbComposants * facteur : 0.0;
            qk = Math.max(0, qk);

            String couleur = qk == 0 ? "VERT" : qk <= 0.5 ? "ORANGE" : qk <= 1.0 ? "ROSE" : "ROUGE";

            Map<String, Object> res = new HashMap<>();
            res.put("auditId",        auditId);
            res.put("qkPredit",       Math.round(qk * 10000.0) / 10000.0);
            res.put("couleurPredite", couleur);
            res.put("confiance",      0.7);
            res.put("message",        "QK calculé par formule métier (API IA indisponible)");
            return res;

        } catch (Exception e) {
            return Map.of("erreur", "Calcul QK impossible: " + e.getMessage());
        }
    }

    // ═══════════════════════════════════════════════════════════
    // MODÈLE 2 — Classement RH des auditeurs
    // ═══════════════════════════════════════════════════════════

    /**
     * Retourne le classement complet des auditeurs.
     * Utilisé par le dashboard Expert / Admin.
     */
    public Map<String, Object> getClassementAuditeurs(
            String niveau, String siteNom, boolean recommandesOnly, Integer top) {

        try {
            // 1. Récupérer tous les auditeurs avec leurs stats depuis la DB
            List<Utilisateur> auditeurs = userRepo.findByRoleAndActifTrue(RoleUser.AUDITEUR);

            List<Map<String, Object>> bodies = auditeurs.stream().map(u -> {
                Map<String, Object> body = construireBodyRH(u.getId());
                // Ajouter identité pour que Flask puisse retourner nom/prénom
                body.put("id",        u.getId());
                body.put("prenom",    u.getPrenom());
                body.put("nom",       u.getNom());
                body.put("matricule", u.getMatricule());
                body.put("plantNom",  u.getPlant() != null ? u.getPlant().getNom() : "—");
                return body;
            }).collect(Collectors.toList());

            // 2. Envoyer en batch à Flask (POST /api/ia/classement)
            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("auditeurs", bodies);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

            ResponseEntity<Map> response = restTemplate.postForEntity(
                    IA_API_URL + "/api/ia/classement",
                    entity, Map.class
            );

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                Map<String, Object> result = new HashMap<>(response.getBody());

                // 3. Appliquer les filtres côté Java si demandés
                List<Map<String, Object>> list = (List<Map<String, Object>>) result.get("auditeurs");
                if (list != null) {
                    if (niveau != null) {
                        list = list.stream()
                                .filter(a -> niveau.equalsIgnoreCase((String) a.get("niveau")))
                                .collect(Collectors.toList());
                    }
                    if (top != null) {
                        list = list.stream().limit(top).collect(Collectors.toList());
                    }
                    result.put("auditeurs", list);
                    result.put("total", list.size());
                }
                return result;
            }

        } catch (ResourceAccessException e) {
            log.warn("API IA indisponible pour classement: {}", e.getMessage());
        } catch (Exception e) {
            log.error("Erreur classement IA: {}", e.getMessage());
        }

        return fallbackClassement();
    }

    /**
     * Retourne le/les meilleur(s) candidat(s) pour promotion Expert.
     * Utilisé par la page RH / Admin.
     */
    public Map<String, Object> getRecommandationsPromotion(String siteNom, int n) {
        try {
            String url = IA_API_URL + "/api/ia/recommander-expert?n=" + n;
            if (siteNom != null) url += "&siteNom=" + siteNom;

            ResponseEntity<Map> response = restTemplate.getForEntity(url, Map.class);

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                return response.getBody();
            }

        } catch (ResourceAccessException e) {
            log.warn("API IA indisponible pour recommandations: {}", e.getMessage());
        } catch (Exception e) {
            log.error("Erreur recommandations IA: {}", e.getMessage());
        }

        return Map.of("candidats", List.of(),
                "message",   "Service IA indisponible — recalcul manuel requis");
    }

    /**
     * Évalue un auditeur spécifique en temps réel.
     * Appelé après la clôture d'un audit pour mettre à jour son score.
     */
    public Map<String, Object> evaluerAuditeur(Integer auditeurId) {
        try {
            Map<String, Object> body = construireBodyRH(auditeurId);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);

            ResponseEntity<Map> response = restTemplate.postForEntity(
                    IA_API_URL + "/api/ia/evaluer-auditeur",
                    entity, Map.class
            );

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                return response.getBody();
            }

        } catch (Exception e) {
            log.warn("Évaluation IA auditeur {} échouée: {}", auditeurId, e.getMessage());
        }

        return Map.of("auditeurId", auditeurId, "message", "Évaluation IA indisponible");
    }

    /**
     * Construit le body pour /api/ia/evaluer-auditeur
     * en agrégeant toutes les données de l'auditeur depuis la base.
     */
    private Map<String, Object> construireBodyRH(Integer auditeurId) {
        List<AuditProduit> audits = auditRepo.findByAuditeurIdOrderByDatePrevueDesc(auditeurId);

        long total   = audits.size();
        long termine = audits.stream().filter(a -> a.getStatut() == StatutAudit.TERMINE).count();
        long retard  = audits.stream().filter(a -> a.getStatut() == StatutAudit.EN_RETARD).count();
        long enCours = audits.stream().filter(a -> a.getStatut() == StatutAudit.EN_COURS).count();

        double tauxRetard    = total > 0 ? retard * 100.0 / total : 0.0;
        double tauxCompletion = total > 0 ? termine * 100.0 / total : 0.0; // ← AJOUTER

        double delaiMoyen = audits.stream()
                .filter(a -> a.getStatut() == StatutAudit.TERMINE
                        && a.getDateRealisation() != null && a.getDatePrevue() != null)
                .mapToLong(a -> ChronoUnit.DAYS.between(a.getDatePrevue(), a.getDateRealisation()))
                .average().orElse(0);

        double qkMoyen = audits.stream()
                .filter(a -> a.getStatut() == StatutAudit.TERMINE && a.getValeurQK() != null)
                .mapToDouble(AuditProduit::getValeurQK)
                .average().orElse(0);

        long nbVert = audits.stream()
                .filter(a -> CouleurQK.VERT.equals(a.getCouleurQK())).count();

        // ← AJOUTER : taux_vert = nbVert / nbTermine * 100
        double tauxVert = termine > 0 ? nbVert * 100.0 / termine : 0.0;

        long nbPdca     = audits.stream()
                .filter(a -> Boolean.TRUE.equals(a.getPdcaDeclenche())).count();
        long nbCritique = audits.stream()
                .filter(a -> CouleurQK.ROUGE.equals(a.getCouleurQK())
                        || CouleurQK.ROSE.equals(a.getCouleurQK())).count(); // ← AJOUTER

        List<PassageCertification> passages =
                passageRepo.findByAuditeurIdOrderByDateDebutDesc(auditeurId);

        double scoretheo = passages.stream()
                .filter(p -> p.getScoreTheorique() != null)
                .mapToInt(PassageCertification::getScoreTheorique).average().orElse(0);

        double scorePrat = passages.stream()
                .filter(p -> p.getNbDefautsIdentifies() != null
                        && p.getNbDefautsTotal() != null && p.getNbDefautsTotal() > 0)
                .mapToDouble(p -> p.getNbDefautsIdentifies() * 100.0 / p.getNbDefautsTotal())
                .average().orElse(0);

        int nbCertTentees = passages.size();
        long reussies = passages.stream()
                .filter(p -> StatutPassage.RAPPORT_VALIDE.equals(p.getStatut())
                        || StatutPassage.CERTIFIE.equals(p.getStatut())).count();
        boolean estBloque = passages.stream()
                .anyMatch(p -> StatutPassage.BLOQUE.equals(p.getStatut()));

        // taux_reussite_certif — feature importante du modèle
        double tauxReussiteCertif = nbCertTentees > 0
                ? reussies * 100.0 / nbCertTentees : 0.0; // ← AJOUTER

        Map<String, Object> body = new HashMap<>();
        body.put("auditeurId",               auditeurId);
        body.put("nbAuditsTotal",            total);
        body.put("nbAuditsTermines",         termine);
        body.put("nbAuditsEnRetard",         retard);
        body.put("nbAuditsEnCours",          enCours);
        body.put("tauxRetardPct",            tauxRetard);
        body.put("delaiMoyenJours",          delaiMoyen);
        body.put("taux_completion",          tauxCompletion);   // ← NOUVEAU
        body.put("qkMoyen",                  qkMoyen);
        body.put("taux_vert",                tauxVert);         // ← NOUVEAU (feature directe)
        body.put("nbQkVert",                 nbVert);
        body.put("nbPdcaDeclenches",         nbPdca);
        body.put("nb_qk_critique",           nbCritique);       // ← NOUVEAU
        body.put("scoretheoMoyen",           scoretheo);
        body.put("scorePratMoyen",           scorePrat);
        body.put("nbCertificationsReussies", reussies);
        body.put("nbCertificationsTentees",  nbCertTentees);    // ← NOUVEAU
        body.put("taux_reussite_certif",     tauxReussiteCertif); // ← NOUVEAU (feature importante)
        body.put("estBloqueCertif",          estBloque);

        return body;
    }
    /**
     * Fallback Java si l'API est indisponible.
     * Calcule un classement simplifié directement depuis la base.
     */
    private Map<String, Object> fallbackClassement() {
        try {
            List<Utilisateur> auditeurs = userRepo.findByRoleAndActifTrue(RoleUser.AUDITEUR);

            List<Map<String, Object>> classement = auditeurs.stream().map(u -> {
                long termine = auditRepo.countByAuditeurIdAndStatut(u.getId(), StatutAudit.TERMINE);
                Map<String, Object> m = new HashMap<>();
                m.put("auditeurId",    u.getId());
                m.put("nom",           u.getNom());
                m.put("prenom",        u.getPrenom());
                m.put("matricule",     u.getMatricule());
                m.put("nbAuditsTermines", termine);
                m.put("scoreFinal",    Math.min(100, termine * 4.0));
                m.put("niveau",        termine >= 15 ? "TOP" : termine >= 8 ? "BON" : "MOYEN");
                return m;
            }).sorted((a, b) ->
                    Double.compare((Double)b.get("scoreFinal"), (Double)a.get("scoreFinal"))
            ).collect(Collectors.toList());

            // Ajouter rang
            for (int i = 0; i < classement.size(); i++) {
                classement.get(i).put("rang", i + 1);
            }

            return Map.of(
                    "total",     classement.size(),
                    "auditeurs", classement,
                    "message",   "Classement simplifié (API IA indisponible)"
            );

        } catch (Exception e) {
            return Map.of("erreur", "Classement impossible: " + e.getMessage());
        }
    }

    /**
     * Vérifie si l'API IA est disponible.
     */
    public boolean isIaDisponible() {
        try {
            ResponseEntity<Map> r = restTemplate.getForEntity(
                    IA_API_URL + "/api/ia/health", Map.class);
            return r.getStatusCode().is2xxSuccessful();
        } catch (Exception e) {
            return false;
        }
    }
}