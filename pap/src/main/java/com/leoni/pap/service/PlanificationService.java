package com.leoni.pap.service;

import com.leoni.pap.dto.request.LancerPlanificationRequest;
import com.leoni.pap.dto.request.LancerPlanificationRequest.AuditPlanifItem;
import com.leoni.pap.dto.response.AuditResponse;
import com.leoni.pap.dto.response.PlanificationResponse;
import com.leoni.pap.dto.response.SegmentResponse;
import com.leoni.pap.entity.*;
import com.leoni.pap.entity.PlanificationAudit.ModePlanification;
import com.leoni.pap.entity.enums.*;
import com.leoni.pap.exception.BusinessException;
import com.leoni.pap.repository.*;
import lombok.RequiredArgsConstructor;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

/**
 * PlanificationService — CORRIGÉ
 *
 * Corrections apportées :
 *
 *  1. Extraction du segment depuis le nom du fichier Excel
 *     Ex: "PI3010en4 Segment 32.xlsx" → cherche "Segment 32" en base
 *
 *  2. Durée de planification basée sur le client DÉTECTÉ dans le fichier
 *     (et non uniquement sur le plant de l'expert créateur)
 *     Ordre de priorité : client détecté dans Excel > client du plant expert > défaut 6 mois
 *
 *  3. Nature "R" correctement mappée → REQUALIFICATION
 *
 *  4. PlanificationAudit enrichie avec segment_id (champ ajouté)
 *
 *  5. Résolution segment depuis nom fichier + fallback par segment en base
 */
@Service
@RequiredArgsConstructor
@Transactional
public class PlanificationService {

    private final PlanificationRepository    planifRepo;
    private final AuditProduitRepository     auditRepo;
    private final UtilisateurRepository      userRepo;
    private final PlantRepository            plantRepo;
    private final SegmentRepository          segmentRepo;
    private final ProjetRepository           projetRepo;
    private final SerieRepository            serieRepo;
    private final SiteRepository             siteRepo;
    private final NotificationService        notifService;
    private final EmailService               emailService;
    private final AuditProduitAnnexeService  annexeService;

    private static final DateTimeFormatter REF_FMT  = DateTimeFormatter.ofPattern("yyyy");
    private static final DateTimeFormatter DATE_FMT  = DateTimeFormatter.ofPattern("dd/MM/yyyy");
    private static final DateTimeFormatter DATE_ISO  = DateTimeFormatter.ofPattern("yyyy-MM-dd");

    private static final String UPLOAD_PLANIF_DIR = "uploads/planifications";

    // ── Durée planification par client ────────────────────────────────────
    // Clé = mot-clé détecté dans le nom du projet Excel ou le client du plant
    private static final Map<String, Integer> DUREE_MOIS_PAR_CLIENT = new LinkedHashMap<>();
    static {
        // 12 mois (annuelle)
        DUREE_MOIS_PAR_CLIENT.put("BMW",         12);
        DUREE_MOIS_PAR_CLIENT.put("MERCEDES",    12);
        DUREE_MOIS_PAR_CLIENT.put("MERCEDES-BENZ", 12);
        DUREE_MOIS_PAR_CLIENT.put("MB",          12);
        DUREE_MOIS_PAR_CLIENT.put("PORSCHE",     12);
        DUREE_MOIS_PAR_CLIENT.put("LAMBORGHINI", 12);
        DUREE_MOIS_PAR_CLIENT.put("FERRARI",     12);
        // 6 mois (semestrielle)
        DUREE_MOIS_PAR_CLIENT.put("VOLKSWAGEN",   6);
        DUREE_MOIS_PAR_CLIENT.put("VW",           6);
        DUREE_MOIS_PAR_CLIENT.put("AUDI",         6);
        DUREE_MOIS_PAR_CLIENT.put("SKODA",        6);
        DUREE_MOIS_PAR_CLIENT.put("SEAT",         6);
        DUREE_MOIS_PAR_CLIENT.put("FORD",         6);
        DUREE_MOIS_PAR_CLIENT.put("STELLANTIS",   6);
        DUREE_MOIS_PAR_CLIENT.put("PSA",          6);
        DUREE_MOIS_PAR_CLIENT.put("RENAULT",      6);
        DUREE_MOIS_PAR_CLIENT.put("DACIA",        6);
    }

    // ══════════════════════════════════════════════════════════════════════
// 1. IMPORT EXCEL → PARSE → CRÉER PLANIFICATION (BROUILLON)
// ══════════════════════════════════════════════════════════════════════

    public Map<String, Object> importerExcel(MultipartFile fichier,
                                             Integer createurId,
                                             Integer segmentIdManuel,
                                             Integer plantIdManuel,
                                             Integer siteIdManuel) {

        Utilisateur createur = userRepo.findById(createurId)
                .orElseThrow(() -> new BusinessException("Utilisateur introuvable."));

        // ── Résoudre le segment : manuel (priorité) ou depuis nom fichier ──
        Segment segmentDetecte = null;

        if (segmentIdManuel != null) {
            segmentDetecte = segmentRepo.findById(segmentIdManuel).orElse(null);
            System.out.println("[PlanificationService] Segment manuel ID=" + segmentIdManuel
                    + " → " + (segmentDetecte != null ? segmentDetecte.getNom() : "introuvable"));
        }

        if (segmentDetecte == null) {
            String nomFichierOriginal = Optional.ofNullable(fichier.getOriginalFilename())
                    .orElse("planification.xlsx");
            segmentDetecte = extraireSegmentDepuisNomFichier(nomFichierOriginal);
        }

        // ── Déterminer le nom de la planification ──────────────────────────
        LocalDate maintenant = LocalDate.now();
        String nomSegment = segmentDetecte != null ? segmentDetecte.getNom()
                : (createur.getPlant() != null ? createur.getPlant().getNom() : "PLANT");

        // ── Détecter le client depuis le fichier ───────────────────────────
        String clientDetecte = detecterClientDepuisFichier(fichier);

        // Si pas détecté dans le fichier, essayer via le plant manuel
        if (clientDetecte == null && plantIdManuel != null) {
            clientDetecte = plantRepo.findById(plantIdManuel)
                    .map(p -> p.getClientNom() != null
                            ? extraireClientDuTexte(p.getClientNom().toUpperCase()) : null)
                    .orElse(null);
        }

        // ── Durée basée sur client détecté ────────────────────────────────
        int dureeMois = getDureeParClient(clientDetecte, createur);

        // ── Créer la planification ────────────────────────────────────────
        PlanificationAudit planif = PlanificationAudit.builder()
                .nom("Planification_" + nomSegment + "_" + maintenant.format(DATE_FMT))
                .dateDebut(maintenant)
                .dateFin(maintenant.plusMonths(dureeMois))
                .mode(ModePlanification.IMPORT_EXCEL)
                .statut(StatutPlanification.BROUILLON)
                .createur(createur)
                .nombreAuditsTotal(0)
                .nombreAuditsTermines(0)
                .nombreAuditsEnRetard(0)
                .build();

        if (segmentDetecte != null) {
            planif.setSegment(segmentDetecte);
        }

        String fichierNomSauve = sauvegarderFichierPlanification(fichier, planif, dureeMois);
        planif.setFichierPlanificationNom(fichierNomSauve);
        planif = planifRepo.save(planif);

        // ── Parse complet du fichier ──────────────────────────────────────
        List<Map<String, Object>> auditsParses;
        try {
            auditsParses = parseExcelPlanification(fichier, planif, segmentDetecte);
        } catch (IOException e) {
            throw new BusinessException("Impossible de lire le fichier Excel : " + e.getMessage());
        }

        // Affiner le nom si client détecté
        if (clientDetecte != null && !clientDetecte.isBlank()) {
            planif.setNom("Planification_" + clientDetecte + "_"
                    + (segmentDetecte != null ? segmentDetecte.getNom() + "_" : "")
                    + maintenant.format(DATE_FMT));
        }

        planif.setNombreAuditsTotal(auditsParses.size());
        planifRepo.save(planif);

        // ── Résoudre plantId / siteId pour la réponse ─────────────────────
        Integer plantIdReponse  = null;
        String  plantNomReponse = null;
        Integer siteIdReponse   = siteIdManuel;
        String  siteNomReponse  = null;

        if (segmentDetecte != null && segmentDetecte.getPlant() != null) {
            plantIdReponse  = segmentDetecte.getPlant().getId();
            plantNomReponse = segmentDetecte.getPlant().getNom();
            if (segmentDetecte.getPlant().getSite() != null) {
                siteIdReponse  = segmentDetecte.getPlant().getSite().getId();
                siteNomReponse = segmentDetecte.getPlant().getSite().getNom();
            }
        } else if (plantIdManuel != null) {
            final Integer pid = plantIdManuel;
            plantRepo.findById(pid).ifPresent(p -> {
                // Variables effectivement finales pour lambda
            });
            // Récupération simple sans lambda
            var plantOpt = plantRepo.findById(plantIdManuel);
            if (plantOpt.isPresent()) {
                plantIdReponse  = plantOpt.get().getId();
                plantNomReponse = plantOpt.get().getNom();
                if (plantOpt.get().getSite() != null && siteIdReponse == null) {
                    siteIdReponse  = plantOpt.get().getSite().getId();
                    siteNomReponse = plantOpt.get().getSite().getNom();
                }
            }
        }

        Map<String, Object> result = new HashMap<>();
        result.put("planificationId",         planif.getId());
        result.put("nomPlanification",        planif.getNom());
        result.put("dateDebut",               planif.getDateDebut());
        result.put("dateFin",                 planif.getDateFin());
        result.put("dureeMois",               dureeMois);
        result.put("clientDetecte",           clientDetecte);
        result.put("segmentNom",              segmentDetecte != null ? segmentDetecte.getNom() : null);
        result.put("segmentId",               segmentDetecte != null ? segmentDetecte.getId()  : null);
        result.put("plantId",                 plantIdReponse);
        result.put("plantNom",                plantNomReponse);
        result.put("siteId",                  siteIdReponse);
        result.put("siteNom",                 siteNomReponse);
        result.put("audits",                  auditsParses);
        result.put("total",                   auditsParses.size());
        result.put("fichierPlanificationNom", planif.getFichierPlanificationNom());
        return result;
    }

    // ══════════════════════════════════════════════════════════════════════
    // EXTRACTION SEGMENT DEPUIS NOM DE FICHIER
    //
    // Exemples de noms attendus :
    //   "PI3010en4 Segment 32.xlsx"   → cherche "Segment 32"
    //   "Planif_Segment32_BMW.xlsx"   → cherche "Segment32"
    //   "segment_15_VW_2025.xlsx"     → cherche "Segment 15" ou "segment_15"
    //   "Audit_S32_2025.xlsx"         → cherche par code "S32"
    // ══════════════════════════════════════════════════════════════════════

    private Segment extraireSegmentDepuisNomFichier(String nomFichier) {
        if (nomFichier == null || nomFichier.isBlank()) return null;

        // Enlever l'extension
        String base = nomFichier;
        int dot = base.lastIndexOf('.');
        if (dot > 0) base = base.substring(0, dot);

        // Normaliser les séparateurs
        String normalise = base.replace("_", " ").replace("-", " ").trim();

        // Pattern 1 : "Segment 32", "segment32", "SEGMENT 32"
        java.util.regex.Matcher m1 = java.util.regex.Pattern
                .compile("(?i)segment\\s*(\\d+)")
                .matcher(normalise);
        if (m1.find()) {
            String numStr = m1.group(1);
            // Chercher en base par nom exact "Segment 32" ou "segment32"
            Segment trouve = chercherSegmentParNomOuCode("Segment " + numStr, numStr);
            if (trouve != null) return trouve;
        }

        // Pattern 2 : "S32", "S-32" (code court)
        java.util.regex.Matcher m2 = java.util.regex.Pattern
                .compile("(?i)\\bS(\\d{1,3})\\b")
                .matcher(normalise);
        if (m2.find()) {
            String code = "S" + m2.group(1);
            Segment trouve = chercherSegmentParNomOuCode(null, code);
            if (trouve != null) return trouve;
        }

        // Pattern 3 : Chercher tout mot qui commence par "Seg"
        java.util.regex.Matcher m3 = java.util.regex.Pattern
                .compile("(?i)seg\\w+")
                .matcher(normalise);
        if (m3.find()) {
            String mot = m3.group();
            Segment trouve = chercherSegmentParNomOuCode(mot, mot);
            if (trouve != null) return trouve;
        }

        // Pattern 4 : Essayer de trouver un segment dont le nom est contenu dans le nom de fichier
        List<Segment> tous = segmentRepo.findAll();
        for (Segment s : tous) {
            if (s.getNom() != null && normalise.toLowerCase().contains(s.getNom().toLowerCase())) {
                return s;
            }
            if (s.getCode() != null && normalise.toLowerCase().contains(s.getCode().toLowerCase())) {
                return s;
            }
        }

        System.out.println("[PlanificationService] Aucun segment trouvé dans le nom de fichier: " + nomFichier);
        return null;
    }

    private Segment chercherSegmentParNomOuCode(String nom, String code) {
        // Chercher par nom exact (insensible à la casse)
        if (nom != null && !nom.isBlank()) {
            String nomLower = nom.trim().toLowerCase();
            Optional<Segment> parNom = segmentRepo.findAll().stream()
                    .filter(s -> s.getNom() != null && s.getNom().trim().toLowerCase().equals(nomLower))
                    .findFirst();
            if (parNom.isPresent()) return parNom.get();
        }

        // Chercher par code
        if (code != null && !code.isBlank()) {
            String codeLower = code.trim().toLowerCase();
            Optional<Segment> parCode = segmentRepo.findAll().stream()
                    .filter(s -> s.getCode() != null && s.getCode().trim().toLowerCase().equals(codeLower))
                    .findFirst();
            if (parCode.isPresent()) return parCode.get();
        }

        return null;
    }

    // ══════════════════════════════════════════════════════════════════════
    // DÉTECTION CLIENT DEPUIS LE CONTENU DU FICHIER EXCEL
    // Lit la première feuille pour détecter le client (colonne A = projet)
    // ══════════════════════════════════════════════════════════════════════

    private String detecterClientDepuisFichier(MultipartFile fichier) {
        try (Workbook wb = new XSSFWorkbook(fichier.getInputStream())) {
            for (int si = 0; si < wb.getNumberOfSheets(); si++) {
                Sheet sheet = wb.getSheetAt(si);
                if (sheet == null) continue;
                for (int ri = sheet.getFirstRowNum(); ri <= Math.min(sheet.getLastRowNum(), 10); ri++) {
                    Row row = sheet.getRow(ri);
                    if (row == null) continue;
                    // Colonne A = nom du projet (ex: "BMW G2X", "VW MQB", "AUDI MLB")
                    String colA = getCellStr(row, 0).toUpperCase().trim();
                    String client = extraireClientDuTexte(colA);
                    if (client != null) return client;

                    // Aussi tenter colonne B
                    String colB = getCellStr(row, 1).toUpperCase().trim();
                    client = extraireClientDuTexte(colB);
                    if (client != null) return client;
                }
            }
        } catch (IOException ignored) {}
        return null;
    }

    /**
     * Extrait le nom du client depuis un texte (nom de projet, domaine...).
     * Retourne la clé normalisée correspondant à DUREE_MOIS_PAR_CLIENT.
     */
    private String extraireClientDuTexte(String texte) {
        if (texte == null || texte.isBlank()) return null;
        String t = texte.toUpperCase().trim();
        // Ordre important : tester les plus spécifiques en premier
        if (t.startsWith("BMW"))          return "BMW";
        if (t.startsWith("MERCEDES-BENZ")|| t.startsWith("MB ")) return "MERCEDES";
        if (t.startsWith("MERCEDES"))     return "MERCEDES";
        if (t.startsWith("PORSCHE"))      return "PORSCHE";
        if (t.startsWith("LAMBORGHINI"))  return "LAMBORGHINI";
        if (t.startsWith("VOLKSWAGEN") || t.startsWith("VW ") || t.equals("VW")) return "VW";
        if (t.startsWith("AUDI"))         return "AUDI";
        if (t.startsWith("SKODA"))        return "SKODA";
        if (t.startsWith("SEAT"))         return "SEAT";
        if (t.startsWith("FORD"))         return "FORD";
        if (t.startsWith("STELLANTIS"))   return "STELLANTIS";
        if (t.startsWith("PSA"))          return "PSA";
        if (t.startsWith("RENAULT"))      return "RENAULT";
        if (t.startsWith("DACIA"))        return "DACIA";
        return null;
    }

    // ══════════════════════════════════════════════════════════════════════
    // DÉTERMINER LA DURÉE
    //
    // Priorité :
    //  1. Client détecté dans le fichier Excel (le plus fiable)
    //  2. Client du plant de l'expert créateur
    //  3. Défaut = 6 mois
    // ══════════════════════════════════════════════════════════════════════

    private int getDureeParClient(String clientDetecte, Utilisateur createur) {
        // 1. Client du fichier Excel
        if (clientDetecte != null && !clientDetecte.isBlank()) {
            Integer duree = DUREE_MOIS_PAR_CLIENT.get(clientDetecte.toUpperCase().trim());
            if (duree != null) {
                System.out.println("[PlanificationService] Durée " + duree
                        + " mois basée sur client détecté dans Excel : " + clientDetecte);
                return duree;
            }
        }

        // 2. Client du plant de l'expert
        if (createur.getPlant() != null && createur.getPlant().getClientNom() != null) {
            String client = createur.getPlant().getClientNom().toUpperCase().trim();
            Integer duree = DUREE_MOIS_PAR_CLIENT.get(client);
            if (duree != null) {
                System.out.println("[PlanificationService] Durée " + duree
                        + " mois basée sur plant expert : " + client);
                return duree;
            }
        }

        // 3. Défaut
        System.out.println("[PlanificationService] Durée par défaut : 6 mois");
        return 6;
    }

    // ══════════════════════════════════════════════════════════════════════
    // PARSE EXCEL — CORRIGÉ
    //
    // Corrections :
    //  - segmentNom extrait depuis nomFichierOriginal (param)
    //  - segmentId résolu si segment passé en paramètre
    //  - Nature "R" → REQUALIFICATION
    //  - Lecture année plus robuste (cherche dans plusieurs cellules)
    // ══════════════════════════════════════════════════════════════════════

    private List<Map<String, Object>> parseExcelPlanification(MultipartFile fichier,
                                                              PlanificationAudit planif,
                                                              Segment segmentResolu) throws IOException {
        List<Map<String, Object>> result = new ArrayList<>();

        try (Workbook wb = new XSSFWorkbook(fichier.getInputStream())) {
            for (int si = 0; si < wb.getNumberOfSheets(); si++) {
                Sheet sheet = wb.getSheetAt(si);
                if (sheet == null) continue;

                String nomFeuille = sheet.getSheetName().trim();

                // ── Lire l'année (cherche dans les premières lignes) ──────────
                int annee = extraireAnneeDepuisFeuille(sheet);

                String projet = null;

                for (int ri = sheet.getFirstRowNum(); ri <= sheet.getLastRowNum(); ri++) {
                    Row row = sheet.getRow(ri);
                    if (row == null || isRowEmpty(row)) continue;

                    String colA = getCellStr(row, 0).trim();
                    String colAUp = colA.toUpperCase();

                    // Détecter le nom du projet (ligne contenant le nom du client)
                    if (extraireClientDuTexte(colAUp) != null) {
                        projet = colA;
                    }

                    // Ignorer les lignes d'en-tête
                    String colB = getCellStr(row, 1).trim();
                    if (colB.contains("Product Group") || colB.contains("AUDIT TYPE")
                            || colB.contains("destructive") || colB.contains("Re-qualification")
                            || colB.contains("History") || colB.contains("Variant")) continue;

                    // Colonnes mois : I=col8 à T=col19
                    for (int mois = 0; mois < 12; mois++) {
                        String valMois = getCellStr(row, 8 + mois).toUpperCase().trim();
                        if (valMois.isEmpty()) continue;
                        if (!valMois.equals("D") && !valMois.equals("N")
                                && !valMois.equals("ND") && !valMois.equals("R")) continue;

                        LocalDate datePrevue = LocalDate.of(annee, mois + 1, 1);

                        String serieNomEffectif = getCellStr(row, 1).isEmpty()
                                ? nomFeuille : getCellStr(row, 1);
                        String projetNomEffectif = (projet != null && !projet.isEmpty())
                                ? projet : colA;

                        Map<String, Object> audit = new LinkedHashMap<>();
                        audit.put("tempId",        "TEMP-" + si + "-" + ri + "-" + mois);
                        audit.put("typeAudit",     "AUDIT_PRODUIT");
                        // ── CORRECTION 3 : nature R → REQUALIFICATION ────────
                        audit.put("natureAudit",   parseNature(valMois));
                        audit.put("serieNom",      serieNomEffectif);
                        audit.put("variantNo",     getCellStr(row, 3));
                        audit.put("bmwNo",         getCellStr(row, 4));
                        audit.put("projetNom",     projetNomEffectif);
                        // ── CORRECTION 1 : segment depuis fichier ─────────────
                        audit.put("segmentNom",    segmentResolu != null ? segmentResolu.getNom() : "");
                        audit.put("segmentId",     segmentResolu != null ? segmentResolu.getId()  : null);
                        audit.put("plantNom",      planif.getCreateur() != null && planif.getCreateur().getPlant() != null
                                ? planif.getCreateur().getPlant().getNom() : "");
                        audit.put("datePrevue",    datePrevue.format(DATE_FMT));
                        audit.put("mois",          mois + 1);
                        audit.put("annee",         annee);
                        audit.put("familleCablage",nomFeuille);
                        audit.put("domaine",       detecterDomaine(projetNomEffectif));
                        audit.put("nombreComposants", getCellNum(row, 5));
                        audit.put("auditeurId",    null);
                        audit.put("auditeurNom",   null);
                        audit.put("deadline",      null);
                        audit.put("projetId",      resolveProjetId(projetNomEffectif, ""));
                        audit.put("serieId",       resolveSerieId(serieNomEffectif, projetNomEffectif));
                        audit.put("planificationId", planif.getId());

                        result.add(audit);
                    }
                }
            }
        }
        return result;
    }

    /**
     * Extrait l'année depuis le contenu d'une feuille Excel.
     * Cherche dans les 5 premières lignes, dans toutes les cellules,
     * un pattern "Year:YYYY", "YYYY", ou "Année : YYYY".
     */
    private int extraireAnneeDepuisFeuille(Sheet sheet) {
        int anneeDefaut = LocalDate.now().getYear();

        for (int ri = 0; ri <= Math.min(sheet.getLastRowNum(), 5); ri++) {
            Row row = sheet.getRow(ri);
            if (row == null) continue;
            for (int ci = 0; ci < 20; ci++) {
                String val = getCellStr(row, ci).trim();
                if (val.isEmpty()) continue;

                // Pattern "Year:2025", "Year : 2025", "Année: 2025"
                java.util.regex.Matcher m1 = java.util.regex.Pattern
                        .compile("(?i)(?:year|ann[ée]e)\\s*:?\\s*(20\\d{2})")
                        .matcher(val);
                if (m1.find()) {
                    try { return Integer.parseInt(m1.group(1)); } catch (Exception ignored) {}
                }

                // Cellule contenant uniquement une année "2025"
                java.util.regex.Matcher m2 = java.util.regex.Pattern
                        .compile("^(20\\d{2})$")
                        .matcher(val.trim());
                if (m2.matches()) {
                    try { return Integer.parseInt(m2.group(1)); } catch (Exception ignored) {}
                }
            }
        }
        return anneeDefaut;
    }

    // ══════════════════════════════════════════════════════════════════════
    // 2. LANCER LA PLANIFICATION (inchangé sauf ajout segmentId)
    // ══════════════════════════════════════════════════════════════════════

    public PlanificationResponse lancerPlanification(LancerPlanificationRequest req,
                                                     Integer expertId) {
        PlanificationAudit planif = planifRepo.findById(req.getPlanificationId())
                .orElseThrow(() -> new BusinessException("Planification introuvable."));

        if (planif.getStatut() == StatutPlanification.LANCE)
            throw new BusinessException("Cette planification a déjà été lancée.");

        Utilisateur expert = userRepo.findById(expertId)
                .orElseThrow(() -> new BusinessException("Expert introuvable."));

        int compteur = 0;
        for (AuditPlanifItem item : req.getAudits()) {
            if (item.getAuditeurId() == null || item.getDeadline() == null)
                throw new BusinessException("Tous les audits doivent avoir un auditeur et un deadline.");

            Utilisateur auditeur = userRepo.findById(item.getAuditeurId())
                    .orElseThrow(() -> new BusinessException("Auditeur introuvable : " + item.getAuditeurId()));

            AuditProduit audit = new AuditProduit();
            audit.setTypeAudit(TypeAudit.valueOf(item.getTypeAudit() != null ? item.getTypeAudit() : "AUDIT_PRODUIT"));
            if (item.getNatureAudit() != null && !item.getNatureAudit().isBlank())
                audit.setNatureAudit(NatureAudit.valueOf(item.getNatureAudit()));
            audit.setStatut(StatutAudit.PLANIFIE);
            audit.setDatePrevue(item.getDatePrevue() != null
                    ? item.getDatePrevue() : planif.getDateDebut().plusWeeks(compteur));
            audit.setDeadline(item.getDeadline());
            audit.setAuditeur(auditeur);
            audit.setPlanificateur(expert);
            audit.setPlanification(planif);
            audit.setFamilleCablage(item.getFamilleCablage());
            audit.setDomaine(item.getDomaine());
            if (item.getSerieNom() != null)  audit.setSerieLabel(item.getSerieNom());
            if (item.getProjetNom() != null) audit.setProjetLabel(item.getProjetNom());
            if (item.getVariantNo() != null) audit.setVariantNo(item.getVariantNo());
            if (item.getBmwNo() != null)     audit.setBmwNo(item.getBmwNo());
            audit.setPdcaDeclenche(false);
            audit.setQkDepasseSeuil(false);
            audit.setRapportGenere(false);

            // Résoudre Plant
            if (item.getPlantId() != null) {
                plantRepo.findById(item.getPlantId())
                        .ifPresent(p -> { audit.setPlant(p); audit.setSite(p.getSite()); });
            }
            if (audit.getPlant() == null) {
                Plant fallback = auditeur.getPlant() != null ? auditeur.getPlant() : expert.getPlant();
                if (fallback != null) {
                    audit.setPlant(fallback);
                    if (audit.getSite() == null) audit.setSite(fallback.getSite());
                }
            }

            // Résoudre Segment (depuis item puis depuis planification)
            if (item.getSegmentId() != null) {
                segmentRepo.findById(item.getSegmentId()).ifPresent(audit::setSegment);
            }
            if (audit.getSegment() == null && planif.getSegment() != null) {
                audit.setSegment(planif.getSegment());
            }

            if (item.getProjetId()  != null) projetRepo.findById(item.getProjetId()).ifPresent(audit::setProjet);
            if (item.getSerieId()   != null) serieRepo.findById(item.getSerieId()).ifPresent(audit::setSerie);
            if (item.getSiteId()    != null && audit.getSite() == null)
                siteRepo.findById(item.getSiteId()).ifPresent(audit::setSite);

            audit.setReference(genererReference(audit.getTypeAudit()));
            AuditProduit saved;
            try {
                saved = auditRepo.save(audit);
            } catch (org.springframework.dao.DataIntegrityViolationException ex) {
                audit.setId(null);
                audit.setReference(genererReference(audit.getTypeAudit()));
                saved = auditRepo.save(audit);
            }

            try { annexeService.initialiserAnnexes(saved.getId()); } catch (Exception ignored) {}

            // Notification + email
            notifService.creer(auditeur, TypeNotification.AUDIT_ASSIGNE,
                    "Un audit vous a été assigné (réf: " + saved.getReference() + ") — "
                            + "Deadline : " + item.getDeadline()
                            + " — Planification : " + planif.getNom());

            if (auditeur.getEmail() != null) {
                emailService.envoyerNotification(
                        auditeur.getEmail(),
                        auditeur.getPrenom() + " " + auditeur.getNom(),
                        "Nouvel audit assigné — " + saved.getReference(),
                        "Vous avez un nouvel audit assigné dans la planification \""
                                + planif.getNom() + "\". Deadline : " + item.getDeadline()
                                + ". Connectez-vous à PAP pour le consulter."
                );
            }
            compteur++;
        }

        planif.setStatut(StatutPlanification.LANCE);
        planif.setDateLancement(LocalDateTime.now());
        planif.setNombreAuditsTotal(req.getAudits().size());
        planifRepo.save(planif);

        return PlanificationResponse.from(planifRepo.findById(planif.getId()).orElse(planif));
    }

    // ══════════════════════════════════════════════════════════════════════
    // 3. MODIFIER DEADLINE
    // ══════════════════════════════════════════════════════════════════════

    public AuditResponse modifierDeadline(Long auditId, LocalDate nouvelleDeadline) {
        AuditProduit audit = auditRepo.findById(auditId)
                .orElseThrow(() -> new BusinessException("Audit introuvable."));
        audit.setDeadline(nouvelleDeadline);
        AuditProduit saved = auditRepo.save(audit);
        if (audit.getAuditeur() != null) {
            notifService.creer(audit.getAuditeur(), TypeNotification.INFORMATION,
                    "Le deadline de votre audit " + audit.getReference()
                            + " a été modifié : nouvelle date limite le " + nouvelleDeadline);
        }
        return AuditResponse.from(saved);
    }

    // ══════════════════════════════════════════════════════════════════════
    // 4. SUPPRIMER UNE PLANIFICATION
    // ══════════════════════════════════════════════════════════════════════

    public void supprimerPlanification(Long planifId) {
        PlanificationAudit planif = planifRepo.findById(planifId)
                .orElseThrow(() -> new BusinessException("Planification introuvable."));

        Map<Utilisateur, List<String>> auditeurRefs = new LinkedHashMap<>();
        for (AuditProduit audit : planif.getAudits()) {
            if (audit.getAuditeur() == null) continue;
            auditeurRefs.computeIfAbsent(audit.getAuditeur(), k -> new ArrayList<>())
                    .add(audit.getReference());
        }

        for (Map.Entry<Utilisateur, List<String>> entry : auditeurRefs.entrySet()) {
            Utilisateur auditeur = entry.getKey();
            String refsStr = String.join(", ", entry.getValue());
            notifService.creer(auditeur, TypeNotification.ALERTE,
                    "La planification \"" + planif.getNom() + "\" a été supprimée. "
                            + "Vos audit(s) annulé(s) : " + refsStr + ".");
            if (auditeur.getEmail() != null) {
                emailService.envoyerNotification(
                        auditeur.getEmail(),
                        auditeur.getPrenom() + " " + auditeur.getNom(),
                        "Planification supprimée — " + planif.getNom(),
                        "La planification \"" + planif.getNom() + "\" a été supprimée. "
                                + "Audits annulés : " + refsStr);
            }
        }

        planifRepo.delete(planif);
    }

    // ══════════════════════════════════════════════════════════════════════
    // 5. LECTURE
    // ══════════════════════════════════════════════════════════════════════

    @Transactional(readOnly = true)
    public List<PlanificationResponse> getMesPlanifications(Integer expertId) {
        Utilisateur expert = userRepo.findById(expertId)
                .orElseThrow(() -> new BusinessException("Utilisateur introuvable."));

        Map<Long, PlanificationAudit> merged = new LinkedHashMap<>();
        planifRepo.findMesPlanifications(expertId).forEach(p -> merged.putIfAbsent(p.getId(), p));

        Integer siteId = null;
        if (expert.getSite() != null) siteId = expert.getSite().getId();
        else if (expert.getPlant() != null && expert.getPlant().getSite() != null)
            siteId = expert.getPlant().getSite().getId();

        if (siteId != null)
            planifRepo.findPlanificationsBySiteId(siteId)
                    .forEach(p -> merged.putIfAbsent(p.getId(), p));

        if (expert.getPlant() != null)
            planifRepo.findPlanificationsByPlantId(expert.getPlant().getId())
                    .forEach(p -> merged.putIfAbsent(p.getId(), p));

        return merged.values().stream()
                .sorted(Comparator.comparing(PlanificationAudit::getDateCreation,
                        Comparator.nullsLast(Comparator.reverseOrder())))
                .map(PlanificationResponse::from)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<PlanificationResponse> getAll() {
        return planifRepo.findAllByOrderByDateCreationDesc()
                .stream().map(PlanificationResponse::from).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public PlanificationResponse getById(Long id) {
        return PlanificationResponse.from(planifRepo.findById(id)
                .orElseThrow(() -> new BusinessException("Planification introuvable.")));
    }

    @Transactional(readOnly = true)
    public SegmentResponse getSegmentByPlanificationId(Long id) {
        PlanificationAudit planif = planifRepo.findById(id)
                .orElseThrow(() -> new BusinessException("Planification introuvable."));

        // ── CORRECTION : chercher d'abord le segment direct de la planification
        Segment segment = planif.getSegment();

        // Fallback : chercher dans les audits
        if (segment == null && planif.getAudits() != null) {
            segment = planif.getAudits().stream()
                    .map(this::resolveSegmentFromAudit)
                    .filter(Objects::nonNull)
                    .findFirst().orElse(null);
        }

        if (segment == null)
            throw new BusinessException("Aucun segment lié à cette planification.");

        SegmentResponse response = new SegmentResponse();
        response.setId(segment.getId());
        response.setNom(segment.getNom());
        if (segment.getPlant() != null) {
            response.setPlantId(segment.getPlant().getId());
            response.setPlantNom(segment.getPlant().getNom());
            if (segment.getPlant().getSite() != null)
                response.setSiteNom(segment.getPlant().getSite().getNom());
        }
        response.setNombreProjets(segment.getProjets() != null ? segment.getProjets().size() : 0);
        return response;
    }

    // ══════════════════════════════════════════════════════════════════════
    // EXPORT FICHIER
    // ══════════════════════════════════════════════════════════════════════

    public static class ExportFichier {
        private final Resource resource;
        private final String filename;
        public ExportFichier(Resource r, String f) { this.resource = r; this.filename = f; }
        public Resource getResource() { return resource; }
        public String getFilename()   { return filename; }
    }

    @Transactional(readOnly = true)
    public ExportFichier exporterFichierPlanification(Long planifId) {
        PlanificationAudit planif = planifRepo.findById(planifId)
                .orElseThrow(() -> new BusinessException("Planification introuvable."));
        if (planif.getFichierPlanificationNom() == null || planif.getFichierPlanificationNom().isBlank())
            throw new BusinessException("Aucun fichier de planification trouvé.");
        Path filePath = Paths.get(UPLOAD_PLANIF_DIR).resolve(planif.getFichierPlanificationNom());
        if (!Files.exists(filePath))
            throw new BusinessException("Fichier introuvable sur le serveur.");
        try {
            Resource resource = new UrlResource(filePath.toUri());
            if (!resource.exists() || !resource.isReadable())
                throw new BusinessException("Fichier non lisible.");
            return new ExportFichier(resource, planif.getFichierPlanificationNom());
        } catch (MalformedURLException e) {
            throw new BusinessException("Chemin de fichier invalide.");
        }
    }

    // ══════════════════════════════════════════════════════════════════════
    // UTILITAIRES PRIVÉS
    // ══════════════════════════════════════════════════════════════════════

    private String detecterDomaine(String projetNom) {
        if (projetNom == null) return "";
        String client = extraireClientDuTexte(projetNom.toUpperCase());
        if (client != null) return client;
        String p = projetNom.trim();
        return p.isEmpty() ? "" : p.split("\\s+")[0];
    }

    private String sauvegarderFichierPlanification(MultipartFile fichier,
                                                   PlanificationAudit planif,
                                                   int dureeMois) {
        if (fichier == null || fichier.isEmpty())
            throw new BusinessException("Fichier Excel manquant.");

        String original = Optional.ofNullable(fichier.getOriginalFilename()).orElse("planification.xlsx");
        String ext = "";
        int dot = original.lastIndexOf('.');
        if (dot >= 0) { ext = original.substring(dot); original = original.substring(0, dot); }

        String base   = original.replaceAll("[^A-Za-z0-9_\\-]", "_");
        String suffix = dureeMois >= 12
                ? "-" + planif.getDateDebut().format(DATE_ISO).substring(0, 4)
                : "-" + planif.getDateDebut().format(DATE_ISO) + "_to_" + planif.getDateFin().format(DATE_ISO);

        String filename = base + suffix + ext;
        Path dir = Paths.get(UPLOAD_PLANIF_DIR);
        try {
            Files.createDirectories(dir);
            Path target = dir.resolve(filename);
            int counter = 1;
            while (Files.exists(target)) {
                filename = base + suffix + "-" + counter + ext;
                target = dir.resolve(filename);
                counter++;
            }
            Files.copy(fichier.getInputStream(), target, StandardCopyOption.REPLACE_EXISTING);
            return filename;
        } catch (IOException e) {
            throw new BusinessException("Impossible d'enregistrer le fichier : " + e.getMessage());
        }
    }

    private String getCellStr(Row row, int col) {
        Cell cell = row.getCell(col, Row.MissingCellPolicy.RETURN_BLANK_AS_NULL);
        if (cell == null) return "";
        return switch (cell.getCellType()) {
            case STRING  -> cell.getStringCellValue().trim();
            case NUMERIC -> DateUtil.isCellDateFormatted(cell)
                    ? cell.getLocalDateTimeCellValue().toLocalDate().format(DATE_FMT)
                    : String.valueOf((long) cell.getNumericCellValue());
            case BOOLEAN -> String.valueOf(cell.getBooleanCellValue());
            default      -> "";
        };
    }

    private int getCellNum(Row row, int col) {
        Cell cell = row.getCell(col, Row.MissingCellPolicy.RETURN_BLANK_AS_NULL);
        if (cell == null) return 0;
        if (cell.getCellType() == CellType.NUMERIC) return (int) cell.getNumericCellValue();
        try { return Integer.parseInt(cell.toString().trim()); } catch (Exception e) { return 0; }
    }

    private boolean isRowEmpty(Row row) {
        for (int c = row.getFirstCellNum(); c < row.getLastCellNum(); c++) {
            Cell cell = row.getCell(c);
            if (cell != null && cell.getCellType() != CellType.BLANK
                    && !cell.toString().trim().isEmpty()) return false;
        }
        return true;
    }

    /**
     * CORRECTION 3 : Nature correctement mappée
     *   D          → DESTRUCTIF
     *   R          → REQUALIFICATION  (était NON_DESTRUCTIF — bug)
     *   N / ND     → NON_DESTRUCTIF
     */
    private String parseNature(String val) {
        if (val == null || val.isBlank()) return "NON_DESTRUCTIF";
        return switch (val.toUpperCase().trim()) {
            case "D", "DESTRUCTIF"          -> "DESTRUCTIF";
            case "R", "REQUALIFICATION"     -> "REQUALIFICATION";
            default                         -> "NON_DESTRUCTIF"; // N, ND
        };
    }

    private Integer resolveProjetId(String projetNom, String segmentNom) {
        if (projetNom == null || projetNom.isBlank()) return null;
        try {
            return projetRepo.findAll().stream()
                    .filter(p -> p.getNom() != null && p.getNom().equalsIgnoreCase(projetNom.trim()))
                    .findFirst().map(Projet::getId).orElse(null);
        } catch (Exception e) { return null; }
    }

    private Integer resolveSerieId(String serieNom, String projetNom) {
        if (serieNom == null || serieNom.isBlank()) return null;
        try {
            return serieRepo.findAll().stream()
                    .filter(s -> s.getNom() != null && s.getNom().equalsIgnoreCase(serieNom.trim()))
                    .findFirst().map(Serie::getId).orElse(null);
        } catch (Exception e) { return null; }
    }

    private Segment resolveSegmentFromAudit(AuditProduit audit) {
        if (audit == null) return null;
        if (audit.getSegment() != null) return audit.getSegment();
        if (audit.getProjet() != null && audit.getProjet().getSegment() != null)
            return audit.getProjet().getSegment();
        if (audit.getSerie() != null && audit.getSerie().getProjet() != null
                && audit.getSerie().getProjet().getSegment() != null)
            return audit.getSerie().getProjet().getSegment();
        return null;
    }

    private synchronized String genererReference(TypeAudit type) {
        String prefix = switch (type) {
            case AUDIT_PRODUIT        -> "AP";
            case AUDIT_REGLES_PLATES  -> "ARP";
            case AUDIT_MAGASIN_EXPORT -> "AME";
        };
        String annee = LocalDate.now().format(REF_FMT);
        long start   = auditRepo.countByTypeAudit(type) + 1;
        String ref;
        long offset = 0;
        do {
            ref = String.format("%s-%s-%03d", prefix, annee, start + offset);
            offset++;
        } while (auditRepo.existsByReference(ref));
        return ref;
    }

    /**
     * Planifications visibles par un auditeur :
     * - celles où il est assigné sur au moins 1 audit
     * - celles qu'il a lui-même créées (si on autorise la création)
     */
    public List<PlanificationResponse> getMesPlanificationsAuditeur(Integer auditeurId) {
        Map<Long, PlanificationAudit> merged = new LinkedHashMap<>();

        // Planifs où il est assigné
        planifRepo.findPlanificationsParAuditeurAssigne(auditeurId)
                .forEach(p -> merged.putIfAbsent(p.getId(), p));

        // Planifs qu'il a créées
        planifRepo.findPlanificationsCreesParAuditeur(auditeurId)
                .forEach(p -> merged.putIfAbsent(p.getId(), p));

        return merged.values().stream()
                .map(PlanificationResponse::from)
                .collect(Collectors.toList());
    }
}