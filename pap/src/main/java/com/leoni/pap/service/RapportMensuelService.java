package com.leoni.pap.service;

import com.leoni.pap.entity.*;
import com.leoni.pap.entity.enums.StatutAudit;
import com.leoni.pap.entity.enums.TypeAudit;
import com.leoni.pap.exception.BusinessException;
import com.leoni.pap.repository.*;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.openhtmltopdf.pdfboxout.PdfRendererBuilder;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.*;
import java.nio.file.*;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.format.TextStyle;
import java.util.*;
import java.util.stream.Collectors;

/**
 * RapportMensuelService
 * ══════════════════════════════════════════════════════════════
 * Génère le "Rapport Mensuel" (Annexe 1A — Monthly Report Product Audit
 * Wire Harnesses) pour un plant / mois / année donné, en agrégeant tous
 * les audits produit TERMINÉS de ce mois.
 *
 * ✅ CORRIGÉ — Avant, chaque ligne du rapport dépendait presque
 * entièrement de l'Annexe "1B" (formulaire séparé, rempli et validé
 * manuellement par l'auditeur APRÈS avoir terminé l'audit). Si cette
 * annexe n'était jamais remplie, la ligne ressortait vide (Drawing
 * Number, QK, défauts, points, facteur tous null) même si l'audit était
 * bien TERMINE — ce qui donnait l'impression d'un rapport "vide".
 *
 * Désormais, chaque ligne est construite EN PRIORITÉ à partir des
 * données déjà enregistrées sur l'audit lui-même (AuditProduit), qui
 * sont TOUJOURS présentes dès que l'audit est marqué TERMINE :
 *   - valeurQK, totalPoints, facteur (calculés par saisirResultats)
 *   - nonConformites (liste liée à l'audit) → nombre de défauts
 *   - natureAudit (DESTRUCTIF / NON_DESTRUCTIF) → colonnes D / N
 * L'Annexe 1B (puis 1A en second recours) ne sert plus qu'à
 * SURCHARGER ces valeurs quand elle existe et contient des données
 * plus précises — jamais à les remplacer par du vide.
 *
 * Règle de couleur QK (identique à la mise en forme conditionnelle du
 * modèle Excel officiel) :
 *   QK = 0          → VERT
 *   0 < QK <= 0.5    → ORANGE
 *   QK > 0.5         → ROUGE
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class RapportMensuelService {

    private final AuditProduitRepository       auditRepo;
    private final AuditProduitAnnexeRepository  annexeRepo;
    private final PlantRepository               plantRepo;
    private final RapportMensuelRepository      rapportRepo;
    private final UtilisateurRepository         userRepo;

    private final ObjectMapper mapper = new ObjectMapper();

    /** Dossier où sont stockés les rapports générés (Excel + PDF) */
    @Value("${app.upload.dir:./uploads}")
    private String uploadDir;

    /** Chemin du modèle Excel officiel (à placer dans src/main/resources/templates/) */
    private static final String TEMPLATE_CLASSPATH = "/templates/PI3010_Enclosure_1a.xlsx";

    /** Noms d'onglets EXACTS du modèle officiel (index 0 = Janvier ... 11 = Décembre) */
    private static final String[] ONGLETS_MOIS = {
            "Janvier", "Fevrier", "Mars", "Avril", "Mai", "Juin",
            "Juillet", "Aout", "Septembre", "Octobre", "Novembre", "Décembre"
    };

    // ⚠️ Apache POI est 0-indexé : POI row 14 = ligne Excel 15 (1ère ligne du 1er bloc).
    private static final int LIGNE_DEPART_BLOC = 14;
    private static final int HAUTEUR_BLOC       = 4;  // chaque audit occupe 4 lignes fusionnées

    // Le modèle officiel réel (PI3010_Enclosure_1a.xlsx) prévoit 8 blocs
    // (lignes Excel 15 à 46) avant la zone de résumé (QK min/moyen/max, lignes 48-50)
    private static final int NB_BLOCS_TEMPLATE = 8;

    // Indices des lignes de résumé dans le modèle original (avant insertion)
    // Ces lignes contiennent les formules MIN, MOYENNE, MAX pour la colonne QK.
    // Elles seront décalées automatiquement si on insère des lignes avant.
    private static final int LIGNE_RESUME_MIN_ORIG = 47;   // ligne Excel 48
    private static final int LIGNE_RESUME_MOY_ORIG = 48;   // ligne Excel 49
    private static final int LIGNE_RESUME_MAX_ORIG = 49;   // ligne Excel 50
    private static final int COLONNE_QK = 3;                // colonne D (0-index)

    // ═══════════════════════════════════════════════════════════
    // 1. GÉNÉRATION / RÉGÉNÉRATION
    // ═══════════════════════════════════════════════════════════

    /**
     * Régénère le rapport mensuel d'un plant pour un mois/année donnés.
     * Appelée automatiquement après la validation d'une Annexe 1B (voir hook
     * dans AuditProduitAnnexeService), ou manuellement via le contrôleur.
     */
    public RapportMensuel genererRapportMensuel(Integer plantId, int annee, int mois, Integer utilisateurId) {
        if (mois < 1 || mois > 12) throw new BusinessException("Mois invalide : " + mois);

        Plant plant = plantRepo.findById(plantId)
                .orElseThrow(() -> new BusinessException("Plant introuvable."));

        LocalDate debut = LocalDate.of(annee, mois, 1);
        LocalDate fin   = debut.withDayOfMonth(debut.lengthOfMonth());

        List<AuditProduit> auditsBruts = auditRepo.findByPlantAndMoisRealisation(plantId, debut, fin);

        List<AuditProduit> auditsTypeOk = auditsBruts.stream()
                .filter(a -> a.getTypeAudit() == TypeAudit.AUDIT_PRODUIT)
                .collect(Collectors.toList());

        List<AuditProduit> audits = auditsTypeOk.stream()
                .filter(a -> a.getStatut() == StatutAudit.TERMINE)
                .filter(a -> a.getDateRealisation() != null
                        && !a.getDateRealisation().isBefore(debut)
                        && !a.getDateRealisation().isAfter(fin))
                .sorted(Comparator.comparing(AuditProduit::getDateRealisation))
                .collect(Collectors.toList());

        log.info("[RapportMensuel] Plant={} {}/{} — audits avec dateRealisation dans le mois : {} | "
                        + "dont typeAudit=AUDIT_PRODUIT : {} | dont statut=TERMINE : {}",
                plant.getNom(), mois, annee, auditsBruts.size(), auditsTypeOk.size(), audits.size());
        if (audits.isEmpty() && !auditsBruts.isEmpty()) {
            auditsBruts.forEach(a -> log.info(
                    "[RapportMensuel]   -> audit #{} ref={} type={} statut={} dateRealisation={}",
                    a.getId(), a.getReference(), a.getTypeAudit(), a.getStatut(), a.getDateRealisation()));
        }

        List<LigneRapport> lignes = audits.stream()
                .map(this::construireLigne)
                .collect(Collectors.toList());

        try {
            Path dossier = Paths.get(uploadDir, "rapports-mensuels");
            Files.createDirectories(dossier);

            String base = String.format("Rapport_1A_%s_%04d-%02d", slug(plant.getNom()), annee, mois);
            Path fichierExcel = dossier.resolve(base + ".xlsx");
            Path fichierPdf   = dossier.resolve(base + ".pdf");

            // Écriture "tout ou rien" : fichiers temporaires
            Path tmpExcel = dossier.resolve(base + ".xlsx.tmp");
            Path tmpPdf   = dossier.resolve(base + ".pdf.tmp");

            genererExcel(plant, annee, mois, lignes, tmpExcel);
            genererPdf(plant, annee, mois, lignes, tmpPdf);

            Files.move(tmpExcel, fichierExcel, StandardCopyOption.REPLACE_EXISTING);
            Files.move(tmpPdf, fichierPdf, StandardCopyOption.REPLACE_EXISTING);

            RapportMensuel rapport = rapportRepo.findByPlantIdAndAnneeAndMois(plantId, annee, mois)
                    .orElseGet(() -> RapportMensuel.builder()
                            .plant(plant).annee(annee).mois(mois).build());
            rapport.setNombreAudits(lignes.size());
            rapport.setDateGeneration(java.time.LocalDateTime.now());
            rapport.setExcelUrl(fichierExcel.toString());
            rapport.setPdfUrl(fichierPdf.toString());
            if (utilisateurId != null) userRepo.findById(utilisateurId).ifPresent(rapport::setGenerePar);

            return rapportRepo.save(rapport);
        } catch (IOException e) {
            log.error("Erreur génération rapport mensuel — le rapport précédent (Excel+PDF+compteur) "
                    + "est conservé tel quel, rien n'a été modifié à moitié.", e);
            throw new BusinessException("Impossible de générer le rapport mensuel : " + e.getMessage());
        }
    }

    /** Raccourci utilisé par le hook de validation d'Annexe 1B : régénère le rapport du mois concerné. */
    public void regenererPourAudit(AuditProduit audit, Integer utilisateurId) {
        if (audit == null || audit.getPlant() == null || audit.getDateRealisation() == null) return;
        LocalDate d = audit.getDateRealisation();
        genererRapportMensuel(audit.getPlant().getId(), d.getYear(), d.getMonthValue(), utilisateurId);
    }

    // ═══════════════════════════════════════════════════════════
    // 2. LISTE / RECHERCHE (bouton "Rapport Mensuel" sidebar)
    // ═══════════════════════════════════════════════════════════

    @Transactional(readOnly = true)
    public List<Map<String, Object>> listerRapports(Integer annee, String recherche, Integer plantId) {
        String rechercheTrim = (recherche == null || recherche.isBlank()) ? null : recherche.trim();

        List<RapportMensuel> rapports = (rechercheTrim != null)
                ? rapportRepo.rechercherParTexte(annee, rechercheTrim, plantId)
                : rapportRepo.rechercherSansTexte(annee, plantId);

        return rapports.stream().map(r -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id", r.getId());
            m.put("plantId", r.getPlant().getId());
            m.put("plantNom", r.getPlant().getNom());
            m.put("annee", r.getAnnee());
            m.put("mois", r.getMois());
            m.put("moisLabel", libelleMois(r.getMois()));
            m.put("nombreAudits", r.getNombreAudits());
            m.put("dateGeneration", r.getDateGeneration());
            m.put("pdfDisponible", r.getPdfUrl() != null);
            m.put("excelDisponible", r.getExcelUrl() != null);
            return m;
        }).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<Integer> listerAnneesDisponibles(Integer plantId) {
        return rapportRepo.findAnneesDisponibles(plantId);
    }

    @Transactional(readOnly = true)
    public RapportMensuel getRapport(Long id) {
        return rapportRepo.findById(id).orElseThrow(() -> new BusinessException("Rapport introuvable."));
    }

    public void verifierAccesPlant(RapportMensuel rapport, Integer plantIdUtilisateur) {
        if (plantIdUtilisateur != null
                && (rapport.getPlant() == null || !plantIdUtilisateur.equals(rapport.getPlant().getId()))) {
            throw new BusinessException("Vous n'avez pas accès aux rapports d'un autre établissement.");
        }
    }

    // ═══════════════════════════════════════════════════════════
    // 3. CONSTRUCTION D'UNE LIGNE À PARTIR D'UN AUDIT
    // ═══════════════════════════════════════════════════════════

    private LigneRapport construireLigne(AuditProduit audit) {
        Map<String, Object> d1b = annexeRepo.findByAuditIdAndTypeAnnexe(audit.getId(), "1B")
                .map(a -> readJson(a.getFormDataJson())).orElseGet(HashMap::new);
        Map<String, Object> d1a = annexeRepo.findByAuditIdAndTypeAnnexe(audit.getId(), "1A")
                .map(a -> readJson(a.getFormDataJson())).orElseGet(HashMap::new);

        LigneRapport l = new LigneRapport();

        l.partDesc = premierNonVide(
                str(d1b.get("partDesc")), str(d1a.get("partDesc")),
                audit.getSerie() != null ? audit.getSerie().getNom() : null,
                audit.getSerieLabel(), audit.getFamilleCablage());

        l.drawingNo = premierNonVide(
                str(d1b.get("drawingNo")), str(d1a.get("drawingNo")),
                audit.getVariantNo(), audit.getBmwNo(), audit.getReference());

        l.productionDate = premierNonVide(
                str(d1b.get("date")), str(d1a.get("date")),
                audit.getDateRealisation() != null
                        ? audit.getDateRealisation().format(DateTimeFormatter.ofPattern("dd/MM/yyyy")) : null);

        l.productAuditor = premierNonVide(
                str(d1b.get("auditor")), str(d1a.get("auditor")),
                nomComplet(audit.getAuditeur()));

        l.qk = doubleOrNull(d1b.get("valeurQK"), doubleOrNull(d1a.get("valeurQK"), audit.getValeurQK()));

        Integer nbDefectsAudit = (audit.getNonConformites() != null && !audit.getNonConformites().isEmpty())
                ? audit.getNonConformites().size() : null;
        l.nbDefects = premierNonNull(intOrNull(d1b.get("nbDefects")), intOrNull(d1a.get("nbDefects")), nbDefectsAudit);

        l.totalPoints = premierNonNull(intOrNull(d1b.get("totalPoints")), intOrNull(d1a.get("totalPoints")),
                audit.getTotalPoints() != null ? (int) Math.round(audit.getTotalPoints()) : null);

        l.ratingFactor = doubleOrNull(d1b.get("ratingFactor"), doubleOrNull(d1a.get("ratingFactor"), audit.getFacteur()));

        String auditType = premierNonVide(str(d1b.get("auditType")), str(d1a.get("auditType")));
        if (auditType == null && audit.getNatureAudit() != null) {
            auditType = switch (audit.getNatureAudit()) {
                case DESTRUCTIF -> "D";
                case NON_DESTRUCTIF -> "N";
                default -> null;
            };
        }
        l.destructive    = "D".equalsIgnoreCase(auditType);
        l.nonDestructive = "N".equalsIgnoreCase(auditType);

        return l;
    }

    private static class LigneRapport {
        String partDesc, drawingNo, productionDate, productAuditor;
        Double qk, ratingFactor;
        Integer nbDefects, totalPoints;
        boolean destructive, nonDestructive;
    }

    // ═══════════════════════════════════════════════════════════
    // 4. GÉNÉRATION EXCEL (Apache POI, à partir du modèle officiel)
    // ═══════════════════════════════════════════════════════════

    private void genererExcel(Plant plant, int annee, int mois, List<LigneRapport> lignes, Path destination)
            throws IOException {
        try (InputStream in = getClass().getResourceAsStream(TEMPLATE_CLASSPATH)) {
            if (in == null) {
                throw new BusinessException("Modèle Excel introuvable dans le classpath : " + TEMPLATE_CLASSPATH
                        + " (placer PI3010_Enclosure_1a.xlsx dans src/main/resources/templates/)");
            }
            try (Workbook wb = new XSSFWorkbook(in)) {
                Sheet sheet = wb.getSheet(ONGLETS_MOIS[mois - 1]);
                if (sheet == null) {
                    throw new BusinessException("Onglet du mois introuvable dans le modèle : " + ONGLETS_MOIS[mois - 1]);
                }

                // En-tête : "Month / Year" et "Manufacturing Plant"
                setCellIfFound(sheet, 0, "Month / Year", String.format("%02d/%04d", mois, annee));
                setCellIfFound(sheet, 7, "Manufacturing Plant", plant.getNom());

                CellStyle vert   = coloredStyle(wb, IndexedColors.BRIGHT_GREEN1.getIndex());
                CellStyle orange = coloredStyle(wb, IndexedColors.LIGHT_ORANGE.getIndex());
                CellStyle rouge  = coloredStyle(wb, IndexedColors.RED.getIndex());

                // --- Calcul du nombre de blocs disponibles dans le modèle ---
                int nbBlocsModel = (sheet.getLastRowNum() - LIGNE_DEPART_BLOC) / HAUTEUR_BLOC;
                int nbAudits = lignes.size();

                // --- Si plus d'audits que de blocs modèle, insérer des lignes avant la zone de résumé ---
                if (nbAudits > nbBlocsModel) {
                    int lignesASupprimer = (nbAudits - nbBlocsModel) * HAUTEUR_BLOC;
                    int debutResume = LIGNE_DEPART_BLOC + nbBlocsModel * HAUTEUR_BLOC;
                    // Décaler les lignes à partir du début de la zone de résumé
                    sheet.shiftRows(debutResume, sheet.getLastRowNum(), lignesASupprimer, true, false);

                    // Copier le style du premier bloc pour les nouveaux blocs
                    for (int i = nbBlocsModel; i < nbAudits; i++) {
                        int rowBase = LIGNE_DEPART_BLOC + i * HAUTEUR_BLOC;
                        for (int offset = 0; offset < HAUTEUR_BLOC; offset++) {
                            Row srcRow = sheet.getRow(LIGNE_DEPART_BLOC + offset);
                            Row destRow = sheet.getRow(rowBase + offset);
                            if (destRow == null) destRow = sheet.createRow(rowBase + offset);
                            if (srcRow != null) {
                                for (int c = 0; c < srcRow.getLastCellNum(); c++) {
                                    Cell srcCell = srcRow.getCell(c);
                                    if (srcCell != null) {
                                        Cell destCell = destRow.getCell(c);
                                        if (destCell == null) destCell = destRow.createCell(c);
                                        destCell.setCellStyle(srcCell.getCellStyle());
                                    }
                                }
                            }
                        }
                    }
                }

                // --- Écrire les données dans tous les blocs (y compris les nouveaux) ---
                int nbBlocsEffectifs = Math.max(nbAudits, nbBlocsModel);
                for (int i = 0; i < nbBlocsEffectifs; i++) {
                    int rowBase = LIGNE_DEPART_BLOC + i * HAUTEUR_BLOC;
                    if (i < nbAudits) {
                        LigneRapport l = lignes.get(i);

                        setCell(sheet, rowBase,     0, l.partDesc);
                        setCell(sheet, rowBase + 1, 0, l.drawingNo);
                        setCell(sheet, rowBase + 2, 0, l.productionDate);
                        setCell(sheet, rowBase + 3, 0, l.productAuditor);

                        Cell qkCell = setCell(sheet, rowBase, 3, l.qk);
                        if (l.qk != null) {
                            if (l.qk == 0.0)      qkCell.setCellStyle(vert);
                            else if (l.qk <= 0.5) qkCell.setCellStyle(orange);
                            else                  qkCell.setCellStyle(rouge);
                        }
                        setCell(sheet, rowBase, 5, l.nbDefects);
                        setCell(sheet, rowBase, 6, l.totalPoints);
                        setCell(sheet, rowBase, 7, l.ratingFactor);
                        if (l.destructive) setCell(sheet, rowBase, 9, "D"); else viderCell(sheet, rowBase, 9);
                        if (l.nonDestructive) setCell(sheet, rowBase, 11, "N"); else viderCell(sheet, rowBase, 11);
                    } else {
                        // Bloc vide : effacer toutes les cellules
                        viderCell(sheet, rowBase,     0);
                        viderCell(sheet, rowBase + 1, 0);
                        viderCell(sheet, rowBase + 2, 0);
                        viderCell(sheet, rowBase + 3, 0);
                        viderCell(sheet, rowBase, 3);
                        viderCell(sheet, rowBase, 5);
                        viderCell(sheet, rowBase, 6);
                        viderCell(sheet, rowBase, 7);
                        viderCell(sheet, rowBase, 9);
                        viderCell(sheet, rowBase, 11);
                    }
                }

                // --- Mettre à jour les formules de synthèse (QK min/moyen/max) ---
                // Les lignes de résumé sont décalées si on a inséré des lignes.
                int decalage = Math.max(0, (nbAudits - nbBlocsModel) * HAUTEUR_BLOC);
                int ligneMin = LIGNE_RESUME_MIN_ORIG + decalage;
                int ligneMoy = LIGNE_RESUME_MOY_ORIG + decalage;
                int ligneMax = LIGNE_RESUME_MAX_ORIG + decalage;

                // Plage des cellules QK : de la première ligne du premier bloc à la dernière ligne du dernier bloc
                int premiereLigne = LIGNE_DEPART_BLOC;
                int derniereLigne = LIGNE_DEPART_BLOC + nbAudits * HAUTEUR_BLOC - 1;
                // Les colonnes sont 0-indexées, Excel utilise 1-indexé
                String plageQK = "D" + (premiereLigne + 1) + ":D" + (derniereLigne + 1);

                Row rowMin = sheet.getRow(ligneMin);
                if (rowMin != null) {
                    Cell cellMin = rowMin.getCell(COLONNE_QK);
                    if (cellMin != null) {
                        cellMin.setCellFormula("MIN(" + plageQK + ")");
                    }
                }
                Row rowMoy = sheet.getRow(ligneMoy);
                if (rowMoy != null) {
                    Cell cellMoy = rowMoy.getCell(COLONNE_QK);
                    if (cellMoy != null) {
                        cellMoy.setCellFormula("AVERAGE(" + plageQK + ")");
                    }
                }
                Row rowMax = sheet.getRow(ligneMax);
                if (rowMax != null) {
                    Cell cellMax = rowMax.getCell(COLONNE_QK);
                    if (cellMax != null) {
                        cellMax.setCellFormula("MAX(" + plageQK + ")");
                    }
                }

                try (OutputStream out = Files.newOutputStream(destination)) {
                    wb.write(out);
                }
            }
        }
    }

    private CellStyle coloredStyle(Workbook wb, short colorIndex) {
        CellStyle style = wb.createCellStyle();
        style.setFillForegroundColor(colorIndex);
        style.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        return style;
    }

    /** Écrit une valeur dans la cellule d'ancrage (haut-gauche) d'une zone potentiellement fusionnée. */
    private Cell setCell(Sheet sheet, int rowIdx, int colIdx, Object value) {
        Row row = sheet.getRow(rowIdx);
        if (row == null) row = sheet.createRow(rowIdx);
        Cell cell = row.getCell(colIdx);
        if (cell == null) cell = row.createCell(colIdx);
        if (value == null) {
            // ne rien écrire
        } else if (value instanceof Number) {
            cell.setCellValue(((Number) value).doubleValue());
        } else {
            cell.setCellValue(value.toString());
        }
        return cell;
    }

    /** Vide complètement une cellule (contenu ET mise en forme conditionnelle style QK) pour un bloc sans audit. */
    private void viderCell(Sheet sheet, int rowIdx, int colIdx) {
        Row row = sheet.getRow(rowIdx);
        if (row == null) return;
        Cell cell = row.getCell(colIdx);
        if (cell == null) return;
        cell.setBlank();
        cell.setCellStyle(sheet.getWorkbook().createCellStyle()); // retire vert/orange/rouge résiduel
    }

    /** Recherche la première ligne 0..12 contenant `contientTexte` et écrit dans la cellule voisine / la même cellule. */
    private void setCellIfFound(Sheet sheet, int ligneApprox, String contientTexte, String valeur) {
        for (int r = 0; r <= 12; r++) {
            Row row = sheet.getRow(r);
            if (row == null) continue;
            for (Cell c : row) {
                if (c.getCellType() == CellType.STRING && c.getStringCellValue() != null
                        && c.getStringCellValue().contains(contientTexte)) {
                    c.setCellValue(contientTexte + " : " + valeur);
                    return;
                }
            }
        }
    }

    // ═══════════════════════════════════════════════════════════
    // 5. GÉNÉRATION PDF (HTML → PDF, cohérent avec AuditProduitPdfService)
    // ═══════════════════════════════════════════════════════════

    private static final String LEONI_BLUE = "#003F8A";

    private void genererPdf(Plant plant, int annee, int mois, List<LigneRapport> lignes, Path destination)
            throws IOException {
        String genereLe = java.time.LocalDateTime.now()
                .format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm"));

        StringBuilder html = new StringBuilder();

        html.append("<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n")
                .append("<!DOCTYPE html PUBLIC \"-//W3C//DTD XHTML 1.0 Strict//EN\"\n")
                .append("  \"http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd\">\n")
                .append("<html xmlns=\"http://www.w3.org/1999/xhtml\" lang=\"fr\">\n<head>\n")
                .append("<meta http-equiv=\"Content-Type\" content=\"text/html; charset=UTF-8\" />\n")
                .append("<title>Rapport Mensuel - ").append(escape(plant.getNom())).append("</title>\n")
                .append("<style type=\"text/css\">\n")
                .append("@page { size: A4 landscape; margin: 12mm 10mm; }\n")
                .append("* { box-sizing: border-box; }\n")
                .append("body { font-family: Arial, Helvetica, sans-serif; font-size: 10pt; color: #000; background: #fff; line-height: 1.35; }\n")
                .append(".page { width: 100%; position: relative; min-height: 160mm; padding-bottom: 22mm; }\n")
                .append("table { width: 100%; border-collapse: collapse; margin-bottom: 6px; }\n")
                .append("th { background: #EEEEEE; color: #000; padding: 5px 6px; text-align: left;")
                .append(" font-size: 8.5pt; font-weight: 700; border: 1px solid #000; }\n")
                .append("td { padding: 4px 6px; border: 1px solid #CCCCCC; font-size: 9pt; }\n")
                .append(".vert   { background: #00FF00; }\n")
                .append(".orange { background: #FFC000; }\n")
                .append(".rouge  { background: #FF0000; color: #fff; }\n")
                .append(".page-footer { position: absolute; bottom: 0; left: 0; right: 0;")
                .append(" border-top: 1px solid #000; padding-top: 3px; overflow: hidden; }\n")
                .append(".page-footer-left { float: left; font-size: 7pt; color: #555; }\n")
                .append(".page-footer-right { float: right; font-size: 7pt; color: #000; font-weight: 700; }\n")
                .append("</style>\n</head>\n<body>\n<div class=\"page\">\n");

        html.append("<table style=\"width:100%;border:none;border-bottom:3px solid #000;margin-bottom:10px;padding-bottom:8px;\">\n")
                .append("<tbody><tr>\n")
                .append("<td style=\"border:none;vertical-align:top;width:70%;\">\n")
                .append("  <p style=\"font-size:8pt;font-weight:800;color:#555;margin:0 0 2px;\">PI3010 &#8212; Annexe 1A</p>\n")
                .append("  <p style=\"font-size:20pt;font-weight:900;color:#000;margin:0;\">Monthly Report &#8212; Product Audit Wire Harnesses</p>\n")
                .append("</td>\n")
                .append("<td style=\"border:none;text-align:right;vertical-align:top;\">\n")
                .append("  <p style=\"font-size:26pt;font-weight:900;color:").append(LEONI_BLUE).append(";margin:0;\">LEONI</p>\n")
                .append("  <p style=\"font-size:7pt;color:#888;margin:2px 0 0;\">PAP Qualit&#233; v3</p>\n")
                .append("</td>\n</tr></tbody></table>\n");

        html.append("<table style=\"margin-bottom:14px;\">\n<tbody>\n<tr>")
                .append("<td style=\"font-weight:700;color:#333;background:#F4F4F4;width:20%;\">Plant / Site</td>")
                .append("<td style=\"width:30%;\">").append(escape(plant.getNom())).append("</td>")
                .append("<td style=\"font-weight:700;color:#333;background:#F4F4F4;width:20%;\">Mois / Ann&#233;e</td>")
                .append("<td style=\"width:30%;\">").append(libelleMois(mois)).append(" ").append(annee).append("</td>")
                .append("</tr>\n<tr>")
                .append("<td style=\"font-weight:700;color:#333;background:#F4F4F4;\">Nombre d'audits</td>")
                .append("<td>").append(lignes.size()).append("</td>")
                .append("<td style=\"font-weight:700;color:#333;background:#F4F4F4;\">G&#233;n&#233;r&#233; le</td>")
                .append("<td>").append(genereLe).append("</td>")
                .append("</tr>\n</tbody></table>\n");

        html.append("<table>\n<thead><tr>")
                .append("<th>Part Description</th><th>Drawing Number</th><th>Production Date</th>")
                .append("<th>Product Auditor</th><th>QK</th><th>Nb defects</th><th>Total points</th>")
                .append("<th>Rating Factor</th><th>D</th><th>N</th></tr></thead>\n<tbody>\n");

        if (lignes.isEmpty()) {
            html.append("<tr><td colspan=\"10\" style=\"text-align:center;color:#888;padding:14px;\">")
                    .append("Aucun audit produit termin&#233; pour ce mois.</td></tr>\n");
        }

        for (LigneRapport l : lignes) {
            String classeQk = l.qk == null ? "" : (l.qk == 0.0 ? "vert" : (l.qk <= 0.5 ? "orange" : "rouge"));
            html.append("<tr>")
                    .append("<td>").append(escape(l.partDesc)).append("</td>")
                    .append("<td>").append(escape(l.drawingNo)).append("</td>")
                    .append("<td>").append(escape(l.productionDate)).append("</td>")
                    .append("<td>").append(escape(l.productAuditor)).append("</td>")
                    .append("<td class=\"").append(classeQk).append("\" style=\"font-weight:700;text-align:center;\">")
                    .append(l.qk == null ? "" : l.qk).append("</td>")
                    .append("<td style=\"text-align:center;\">").append(l.nbDefects == null ? "" : l.nbDefects).append("</td>")
                    .append("<td style=\"text-align:center;\">").append(l.totalPoints == null ? "" : l.totalPoints).append("</td>")
                    .append("<td style=\"text-align:center;\">").append(l.ratingFactor == null ? "" : l.ratingFactor).append("</td>")
                    .append("<td style=\"text-align:center;\">").append(l.destructive ? "D" : "").append("</td>")
                    .append("<td style=\"text-align:center;\">").append(l.nonDestructive ? "N" : "").append("</td>")
                    .append("</tr>\n");
        }
        html.append("</tbody></table>\n");

        html.append("<div class=\"page-footer\">\n")
                .append("<span class=\"page-footer-left\">Rapport Mensuel &#8212; ").append(escape(plant.getNom())).append("</span>\n")
                .append("<span class=\"page-footer-right\">").append(libelleMois(mois)).append(" ").append(annee).append("</span>\n")
                .append("</div>\n</div>\n</body>\n</html>");

        try (OutputStream os = Files.newOutputStream(destination)) {
            PdfRendererBuilder builder = new PdfRendererBuilder();
            builder.useFastMode();
            builder.withHtmlContent(html.toString(), null);
            builder.toStream(os);
            builder.run();
        }
    }

    // ═══════════════════════════════════════════════════════════
    // HELPERS
    // ═══════════════════════════════════════════════════════════

    private Map<String, Object> readJson(String json) {
        if (json == null || json.isBlank()) return new HashMap<>();
        try {
            return mapper.readValue(json, new TypeReference<Map<String, Object>>() {});
        } catch (Exception e) {
            return new HashMap<>();
        }
    }

    private String str(Object o) { return o == null ? null : o.toString(); }

    private String premierNonVide(String... valeurs) {
        for (String v : valeurs) if (v != null && !v.isBlank()) return v;
        return null;
    }

    @SafeVarargs
    private final <T> T premierNonNull(T... valeurs) {
        for (T v : valeurs) if (v != null) return v;
        return null;
    }

    private Double doubleOrNull(Object o, Double fallback) {
        if (o == null || o.toString().isBlank()) return fallback;
        try { return Double.parseDouble(o.toString()); } catch (NumberFormatException e) { return fallback; }
    }

    private Integer intOrNull(Object o) {
        if (o == null || o.toString().isBlank()) return null;
        try { return (int) Double.parseDouble(o.toString()); } catch (NumberFormatException e) { return null; }
    }

    private String nomComplet(Utilisateur u) {
        if (u == null) return null;
        return (u.getPrenom() != null ? u.getPrenom() + " " : "") + (u.getNom() != null ? u.getNom() : "");
    }

    private String libelleMois(int mois) {
        return LocalDate.of(2000, mois, 1).getMonth().getDisplayName(TextStyle.FULL, Locale.FRENCH);
    }

    private String slug(String s) {
        return s == null ? "plant" : s.trim().replaceAll("[^A-Za-z0-9]+", "_");
    }

    private String escape(String s) {
        return s == null ? "" : s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;");
    }
}