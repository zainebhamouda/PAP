package com.leoni.pap.service;

import com.leoni.pap.entity.*;
import com.leoni.pap.entity.enums.CouleurQK;
import com.leoni.pap.exception.BusinessException;
import com.leoni.pap.repository.*;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.openhtmltopdf.pdfboxout.PdfRendererBuilder;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.io.*;
import java.nio.file.*;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

/**
 * AuditProduitPdfService — Version CORRIGÉE Sprint 4 v3
 * ═══════════════════════════════════════════════════════════════════
 *
 * CORRECTIONS v3 :
 *  ✓ Logo LEONI : texte bleu (#003F8A) gras comme image officielle
 *  ✓ Statut QK corrigé :
 *       QK = 0          → "Produit Conforme"
 *       0 < QK ≤ 0.5    → "Non-Conforme"
 *       0.5 < QK ≤ 1    → "Non-Conforme"
 *       QK > 1          → "Non-Conforme"
 *  ✓ Import PDFs correctifs : l'auditeur importe ses propres PDFs
 *    (fiche de réparation, PDCA...) qui sont fusionnés dans le rapport
 *    à la place des formulaires générés automatiquement
 *  ✓ Fusion multi-PDFs avec PDFBox
 *  ✓ Toutes corrections v2 conservées
 *
 * ═══════════════════════════════════════════════════════════════════
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class AuditProduitPdfService {

    private final AuditProduitRepository       auditRepo;
    private final AuditProduitAnnexeRepository annexeRepo;
    private final FicheReparationRepository    ficheRepo;
    private final PlanActionRepository         planActionRepo;
    private final ObjectMapper                 objectMapper;

    @Value("${leoni.upload.rapport-final:uploads/rapport}")
    private String rapportFinalDir;

    @Value("${leoni.upload.rapport-importe:uploads/rapports-audit}")
    private String rapportImporteDir;

    @Value("${leoni.upload.pdf-correctifs:uploads/pdfs-correctifs}")
    private String pdfCorrectifDir;

    private static final DateTimeFormatter FMT_TOKEN = DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss");
    private static final DateTimeFormatter FMT_DATE  = DateTimeFormatter.ofPattern("dd/MM/yyyy");
    private static final DateTimeFormatter FMT_DT    = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");

    // ─── Constantes CSS ───────────────────────────────────────────────
    private static final String BORDER     = "1px solid #000000";
    private static final String TH_BG      = "#EEEEEE";
    private static final String TH_FG      = "#000000";
    private static final String NAVY       = "#001F4E";
    private static final String LEONI_BLUE = "#003F8A";   // ← couleur logo LEONI officielle
    private static final String ANN_HDR_BG = "#E8F0FB";

    // ════════════════════════════════════════════════════════════════
    //  POINT D'ENTRÉE
    // ════════════════════════════════════════════════════════════════

    public Map<String, Object> genererRapportPdf(Long auditId, Map<String, Object> opts) {

        AuditProduit audit = auditRepo.findById(auditId)
                .orElseThrow(() -> new BusinessException("Audit introuvable : " + auditId));
        if (audit.getValeurQK() != null) {
            audit.calculerCouleurQK();
        }
        List<AuditProduitAnnexe> annexes =
                annexeRepo.findByAuditIdOrderByOrdreAffichageAsc(auditId);

        FicheReparation fiche = ficheRepo
                .findFirstByAuditIdOrderByDateCreationDesc(auditId)
                .orElse(null);

        PlanAction pdca = planActionRepo.findByAuditId(auditId).stream()
                .max(Comparator.comparing(PlanAction::getDateCreation))
                .orElse(null);

        // ── Récupérer les PDFs correctifs importés par l'auditeur ──
        List<String> pdfsCorrectives = getPdfsCorrectives(auditId);
        boolean hasPdfsCorrectives = !pdfsCorrectives.isEmpty();

        Path outDir = Paths.get(rapportFinalDir);
        try { Files.createDirectories(outDir); }
        catch (IOException e) { throw new BusinessException("Impossible de créer le dossier rapport : " + e.getMessage()); }

        if (audit.getRapportGenerePdfUrl() != null) {
            try { Files.deleteIfExists(Paths.get(audit.getRapportGenerePdfUrl())); }
            catch (IOException ignored) {}
        }

        String serieToken = sanitize(audit.getSerie() != null ? audit.getSerie().getNom() : "audit");
        String dateToken  = LocalDateTime.now().format(FMT_TOKEN);
        String pdfName    = "rapport_audit_" + serieToken + "_" + dateToken + ".pdf";
        String pdfPath    = outDir.resolve(pdfName).toString();

        boolean hasRapportImporte  = audit.getRapportUrl() != null || audit.getRapportFichierNom() != null;
        boolean hasAnnexesRemplies = annexes.stream()
                .anyMatch(a -> Boolean.TRUE.equals(a.getFormValide()) || Boolean.TRUE.equals(a.getImporte()));

        try {
            if (hasRapportImporte && !hasAnnexesRemplies) {
                // CAS 2 : rapport importé sans annexes formulaires
                // → fusion rapport_importé + complément HTML (fiche/PDCA si nécessaire)
                genererPdfDepuisRapportImporte(audit, annexes, fiche, pdca, pdfPath, hasPdfsCorrectives);
            } else if (hasRapportImporte && hasAnnexesRemplies) {
                // CAS MIXTE : rapport importé ET annexes formulaires remplies
                // → générer le PDF complet depuis les formulaires, puis fusionner avec le rapport importé
                String htmlPdfPath = pdfPath.replace(".pdf", "_formulaires.pdf");
                String html = buildHtmlComplet(audit, annexes, fiche, pdca, hasPdfsCorrectives);
                htmlToPdf(html, htmlPdfPath);
                String importedFilePath = trouverFichierImporte(audit);
                boolean fusionOk = false;
                if (importedFilePath != null) {
                    fusionOk = fusionnerPdfs(importedFilePath, htmlPdfPath, pdfPath);
                }
                if (!fusionOk) {
                    Files.copy(Paths.get(htmlPdfPath), Paths.get(pdfPath), StandardCopyOption.REPLACE_EXISTING);
                }
                try { Files.deleteIfExists(Paths.get(htmlPdfPath)); } catch (IOException ignored) {}
            } else {
                // CAS 1 : pas de rapport importé → génération complète depuis formulaires
                String html = buildHtmlComplet(audit, annexes, fiche, pdca, hasPdfsCorrectives);
                htmlToPdf(html, pdfPath);
            }

            // ── Fusionner les PDFs correctifs (CAS 1 et CAS MIXTE seulement) ──
            // Pour le CAS 2 (rapport importé), la fusion est déjà faite dans genererPdfDepuisRapportImporte
            if (hasPdfsCorrectives && !hasRapportImporte) {
                fusionnerAvecPdfsCorrectives(pdfPath, pdfsCorrectives);
            }

            log.info("[PDF] Rapport généré : {}", pdfPath);
        } catch (Exception e) {
            log.error("[PDF] Erreur génération rapport #{} : {}", auditId, e.getMessage(), e);
            throw new BusinessException("Erreur génération PDF : " + e.getMessage());
        }

        audit.setRapportGenere(true);
        audit.setRapportGenerePdfUrl(pdfPath);
        audit.setRapportFichierNom(pdfName);
        audit.setDateEnvoi(LocalDateTime.now());
        auditRepo.save(audit);

        CouleurQK couleur = audit.getCouleurQK();
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("auditId",    auditId);
        result.put("rapportUrl", pdfPath);
        result.put("rapportNom", pdfName);
        result.put("isPdf",      true);
        result.put("valeurQK",   audit.getValeurQK());
        result.put("couleurQK",  couleur != null ? couleur.name() : null);
        result.put("message",    "Rapport PDF généré avec succès.");
        result.put("afficherFicheReparation", couleur != null && couleur != CouleurQK.VERT);
        result.put("afficherPDCA", couleur == CouleurQK.ROSE || couleur == CouleurQK.ROUGE);
        result.put("hasPdfsCorrectives", hasPdfsCorrectives);
        result.put("nbPdfsCorrectives", pdfsCorrectives.size());
        return result;
    }

    // ════════════════════════════════════════════════════════════════
    //  GESTION DES PDFs CORRECTIFS
    // ════════════════════════════════════════════════════════════════

    /**
     * Retourne la liste des chemins des PDFs correctifs pour un audit.
     */
    public List<String> getPdfsCorrectives(Long auditId) {
        Path dir = Paths.get(pdfCorrectifDir, String.valueOf(auditId));
        if (!Files.exists(dir)) return Collections.emptyList();
        try {
            return Files.list(dir)
                    .filter(p -> p.toString().toLowerCase().endsWith(".pdf"))
                    .sorted()
                    .map(Path::toString)
                    .collect(Collectors.toList());
        } catch (IOException e) {
            log.warn("[PDF-CORR] Lecture dossier correctifs #{} : {}", auditId, e.getMessage());
            return Collections.emptyList();
        }
    }

    // ════════════════════════════════════════════════════════════════
    //  NOUVEAU : PDF D'UNE SEULE ANNEXE (validation croisée entre auditeurs)
    // ════════════════════════════════════════════════════════════════

    /**
     * Génère un PDF contenant uniquement l'annexe demandée (ex: Annexe 4),
     * utilisé pour l'envoi vers un autre auditeur du même plant pour validation
     * (signature numérique via bouton Valider/Rejeter).
     *
     * @return le chemin du fichier PDF généré sur disque
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public String genererPdfAnnexeSeule(Long auditId, String typeAnnexe) throws Exception {
        AuditProduit audit = auditRepo.findById(auditId)
                .orElseThrow(() -> new BusinessException("Audit introuvable."));
        AuditProduitAnnexe annexe = annexeRepo.findByAuditIdAndTypeAnnexe(auditId, typeAnnexe)
                .orElseThrow(() -> new BusinessException("Annexe introuvable pour cet audit."));

        String numeroAnnexe = "Annexe " + esc(typeAnnexe);
        String titreAnnexe  = annexe.getLibelle() != null && !annexe.getLibelle().isBlank()
                ? esc(annexe.getLibelle()) : numeroAnnexe;

        StringBuilder sb = new StringBuilder();
        sb.append(htmlHead("Annexe " + esc(typeAnnexe) + " - Audit #" + auditId));
        sb.append(buildAnnexeHeader(numeroAnnexe, titreAnnexe));
        sb.append(buildAnnexePageFidele(annexe));
        sb.append("</body>\n</html>");

        Path dir = Paths.get("uploads/annexes-validation", String.valueOf(auditId));
        Files.createDirectories(dir);
        String nomFichier = "annexe_" + sanitize(typeAnnexe) + "_" + LocalDateTime.now().format(FMT_TOKEN) + ".pdf";
        String outputPath = dir.resolve(nomFichier).toString();

        htmlToPdf(sb.toString(), outputPath);
        log.info("[ANNEXE-VALIDATION] PDF généré pour Annexe {} de l'audit #{} : {}", typeAnnexe, auditId, outputPath);
        return outputPath;
    }

    /**
     * Lit les octets du PDF de validation croisée d'une annexe pour le streamer.
     */
    public byte[] getPdfAnnexeValidationBytes(Long auditId, String typeAnnexe) throws IOException {
        AuditProduitAnnexe annexe = annexeRepo.findByAuditIdAndTypeAnnexe(auditId, typeAnnexe)
                .orElseThrow(() -> new BusinessException("Annexe introuvable pour cet audit."));
        if (annexe.getPdfValidationPath() == null) {
            throw new FileNotFoundException("Aucun PDF de validation généré pour cette annexe.");
        }
        return Files.readAllBytes(Paths.get(annexe.getPdfValidationPath()));
    }

    /**
     * Sauvegarde un PDF correctif importé par l'auditeur.
     */
    public Map<String, String> sauvegarderPdfCorrectif(Long auditId, org.springframework.web.multipart.MultipartFile file) {
        try {
            Path dir = Paths.get(pdfCorrectifDir, String.valueOf(auditId));
            Files.createDirectories(dir);
            String token    = LocalDateTime.now().format(FMT_TOKEN);
            String safeName = sanitize(file.getOriginalFilename().replace(".pdf","")) + "_" + token + ".pdf";
            Path   dest     = dir.resolve(safeName);
            file.transferTo(dest.toFile());
            log.info("[PDF-CORR] PDF correctif sauvegardé : {}", dest);
            return Map.of("path", dest.toString(), "nom", file.getOriginalFilename(), "safeName", safeName);
        } catch (IOException e) {
            throw new BusinessException("Erreur sauvegarde PDF correctif : " + e.getMessage());
        }
    }

    /**
     * Supprime un PDF correctif.
     */
    public void supprimerPdfCorrectif(Long auditId, String nomFichier) {
        try {
            Path p = Paths.get(pdfCorrectifDir, String.valueOf(auditId), nomFichier);
            Files.deleteIfExists(p);
        } catch (IOException e) {
            log.warn("[PDF-CORR] Suppression échouée : {}", e.getMessage());
        }
    }

    /**
     * Fusionne le rapport principal avec les PDFs correctifs.
     * Les PDFs correctifs sont ajoutés APRÈS le rapport principal.
     */
    private void fusionnerAvecPdfsCorrectives(String rapportPath, List<String> pdfsCorrectives) {
        if (pdfsCorrectives.isEmpty()) return;
        String tempPath = rapportPath.replace(".pdf", "_main.pdf");
        try {
            Files.copy(Paths.get(rapportPath), Paths.get(tempPath), StandardCopyOption.REPLACE_EXISTING);
            List<String> allPdfs = new ArrayList<>();
            allPdfs.add(tempPath);
            allPdfs.addAll(pdfsCorrectives.stream()
                    .filter(p -> Files.exists(Paths.get(p)))
                    .collect(Collectors.toList()));
            if (allPdfs.size() > 1) {
                fusionnerMultiplesPdfs(allPdfs, rapportPath);
                log.info("[PDF-CORR] Fusion de {} PDFs correctifs dans le rapport", pdfsCorrectives.size());
            }
        } catch (IOException e) {
            log.warn("[PDF-CORR] Erreur fusion : {}", e.getMessage());
        } finally {
            try { Files.deleteIfExists(Paths.get(tempPath)); } catch (IOException ignored) {}
        }
    }

    // ════════════════════════════════════════════════════════════════
    //  CAS RAPPORT IMPORTÉ
    // ════════════════════════════════════════════════════════════════

    /**
     * Génère le rapport final pour le CAS "rapport importé".
     *
     * Structure du PDF final :
     *   Page 1       → Page de garde HTML (identique au CAS 1)
     *   Pages 2+     → Le fichier PDF importé par l'auditeur (intégré tel quel)
     *   Suite        → Fiche de réparation créée dans l'appli (si QK non-conforme + fiche existe)
     *   Suite        → PDCA créé dans l'appli (si QK non-conforme + pdca existe)
     *   Fin          → PDFs additionnels importés par l'auditeur (pdfs-correctifs)
     *
     * Tous les PDFs additionnels sont fusionnés ICI ; genererRapportPdf() ne refusionne pas.
     */
    private void genererPdfDepuisRapportImporte(AuditProduit audit,
                                                List<AuditProduitAnnexe> annexes,
                                                FicheReparation fiche,
                                                PlanAction pdca,
                                                String outputPath,
                                                boolean hasPdfsCorrectives) throws Exception {
        double    qkNum        = audit.getValeurQK() != null ? audit.getValeurQK() : 0.0;
        CouleurQK c            = audit.getCouleurQK();
        boolean   nonConforme  = qkNum > 0.0;
        String    importedPath = trouverFichierImporte(audit);

        // 1) Page de garde (temporaire)
        String pageGardePath = outputPath.replace(".pdf", "_garde.pdf");
        htmlToPdf(buildHtmlPageGardeSeule(audit, annexes), pageGardePath);

        // 2) Liste ordonnée de PDFs à fusionner
        List<String> parts = new ArrayList<>();
        parts.add(pageGardePath);

        if (importedPath != null && Files.exists(Paths.get(importedPath))
                && importedPath.toLowerCase().endsWith(".pdf")) {
            parts.add(importedPath);
        }

        if (nonConforme && fiche != null) {
            String fichePath = outputPath.replace(".pdf", "_fiche.pdf");
            htmlToPdf(buildHtmlFicheSeule(audit, fiche, qkNum, c), fichePath);
            parts.add(fichePath);
        }

        if (nonConforme && pdca != null) {
            String pdcaPath = outputPath.replace(".pdf", "_pdca.pdf");
            htmlToPdf(buildHtmlPdcaSeul(audit, pdca, qkNum, c), pdcaPath);
            parts.add(pdcaPath);
        }

        if (hasPdfsCorrectives) {
            for (String cp : getPdfsCorrectives(audit.getId())) {
                if (Files.exists(Paths.get(cp))) parts.add(cp);
            }
        }

        // 3) Fusion finale
        if (parts.size() == 1) {
            Files.copy(Paths.get(parts.get(0)), Paths.get(outputPath), StandardCopyOption.REPLACE_EXISTING);
        } else {
            fusionnerMultiplesPdfs(parts, outputPath);
        }

        // 4) Nettoyage des fichiers temporaires générés
        for (String tmp : List.of(pageGardePath,
                outputPath.replace(".pdf", "_fiche.pdf"),
                outputPath.replace(".pdf", "_pdca.pdf"))) {
            try { Files.deleteIfExists(Paths.get(tmp)); } catch (IOException ignored) {}
        }
    }

    private String trouverFichierImporte(AuditProduit audit) {
        // 1. Essayer d'abord via le nom de fichier dans le répertoire d'import (chemin absolu)
        if (audit.getRapportFichierNom() != null) {
            Path p = Paths.get(rapportImporteDir).resolve(audit.getRapportFichierNom());
            if (Files.exists(p)) return p.toString();
        }
        // 2. Essayer rapportUrl comme chemin absolu direct (si déjà absolu)
        if (audit.getRapportUrl() != null) {
            Path p = Paths.get(audit.getRapportUrl());
            if (p.isAbsolute() && Files.exists(p)) return p.toString();
            // 3. rapportUrl peut être une URL relative type "/uploads/rapports-audit/xxx.pdf"
            //    → extraire le nom de fichier et le résoudre dans rapportImporteDir
            String urlPath = audit.getRapportUrl();
            String nom = urlPath.contains("/") ? urlPath.substring(urlPath.lastIndexOf('/') + 1) : urlPath;
            if (!nom.isBlank()) {
                Path resolved = Paths.get(rapportImporteDir).resolve(nom);
                if (Files.exists(resolved)) return resolved.toString();
            }
        }
        return null;
    }

    private boolean fusionnerPdfs(String pdf1, String pdf2, String out) {
        return fusionnerMultiplesPdfs(Arrays.asList(pdf1, pdf2), out);
    }

    private boolean fusionnerMultiplesPdfs(List<String> pdfs, String out) {
        try {
            org.apache.pdfbox.multipdf.PDFMergerUtility merger =
                    new org.apache.pdfbox.multipdf.PDFMergerUtility();
            for (String pdf : pdfs) {
                if (Files.exists(Paths.get(pdf))) merger.addSource(pdf);
            }
            merger.setDestinationFileName(out);
            merger.mergeDocuments(null);
            return true;
        } catch (Exception e) {
            log.warn("[PDF] Fusion échouée : {}", e.getMessage());
            return false;
        }
    }

    public Double extraireQKDepuisPdfAnnexe1B(String pdfPath) {
        try {
            org.apache.pdfbox.pdmodel.PDDocument doc =
                    org.apache.pdfbox.pdmodel.PDDocument.load(new java.io.File(pdfPath));
            org.apache.pdfbox.text.PDFTextStripper stripper =
                    new org.apache.pdfbox.text.PDFTextStripper();
            String text = stripper.getText(doc);
            doc.close();
            java.util.regex.Pattern[] patterns = {
                    java.util.regex.Pattern.compile("(?i)QK\\s*[=:]?\\s*([0-9]+[.,][0-9]+)"),
                    java.util.regex.Pattern.compile("(?i)Quality\\s+Class\\s*[=:]?\\s*([0-9]+[.,][0-9]+)"),
            };
            for (java.util.regex.Pattern p : patterns) {
                java.util.regex.Matcher m = p.matcher(text);
                if (m.find()) {
                    String val = m.group(1).replace(",", ".");
                    return Double.parseDouble(val);
                }
            }
        } catch (Exception e) {
            log.warn("[PDF-QK] Extraction QK depuis PDF échouée : {}", e.getMessage());
        }
        return null;
    }

    // ════════════════════════════════════════════════════════════════
    //  CONSTRUCTION HTML COMPLET
    // ════════════════════════════════════════════════════════════════

    private String buildHtmlComplet(AuditProduit audit,
                                    List<AuditProduitAnnexe> annexes,
                                    FicheReparation fiche,
                                    PlanAction pdca,
                                    boolean hasPdfsCorrectives) {

        double    qkNum  = audit.getValeurQK() != null ? audit.getValeurQK() : 0.0;
        String    qkVal  = String.format(Locale.FRENCH, "%.2f", qkNum);
        CouleurQK c      = audit.getCouleurQK();
        String    now    = LocalDateTime.now().format(FMT_DT);
        String    dateAudit = audit.getDatePrevue() != null ? audit.getDatePrevue().format(FMT_DATE) : "—";

        List<AuditProduitAnnexe> annexesRemplies = annexes.stream()
                .filter(a -> Boolean.TRUE.equals(a.getFormValide()) || Boolean.TRUE.equals(a.getImporte()))
                .collect(Collectors.toList());

        StringBuilder sb = new StringBuilder();
        sb.append(htmlHead(audit.getReference()));

        // ── PAGE 1 : PAGE DE GARDE PRO ──
        sb.append("<div class=\"page\">\n");
        sb.append(buildPageGardePro(audit, qkVal, qkNum, c, now, dateAudit, annexes, annexesRemplies));
        sb.append(pageFooter("Document confidentiel LEONI — IT TN 3625 / PI3010 — " + now, "Page 1"));
        sb.append("</div>\n");

        // ── PAGE 2 : SOMMAIRE ──
        sb.append("<div class=\"page pb\">\n");
        sb.append(buildSommaire(annexesRemplies, c, fiche, pdca, hasPdfsCorrectives));
        sb.append(pageFooter("Rapport d'Audit Produit LEONI — IT TN 3625", "Page 2"));
        sb.append("</div>\n");

        // ── PAGE 3 : RÉSUMÉ EXÉCUTIF ──
        sb.append("<div class=\"page pb\">\n");
        sb.append(annexePageHeader("SECTION 1", "R&#233;sum&#233; Ex&#233;cutif de l'Audit", "IT TN 3625 / PI3010"));
        sb.append(buildResumeExecutif(audit, annexes, annexesRemplies, qkVal, c, now, dateAudit, fiche, pdca, hasPdfsCorrectives));
        sb.append(pageFooter("IT TN 3625 — Section 1", "Page 3"));
        sb.append("</div>\n");

        // ── PAGES ANNEXES ──
        int pageNum = 4;
        for (AuditProduitAnnexe ann : annexesRemplies) {
            sb.append("<div class=\"page pb\">\n");
            String numeroAnnexe = "Annexe " + esc(ann.getTypeAnnexe());
            String titreAnnexe  = ann.getLibelle() != null && !ann.getLibelle().isBlank()
                    ? esc(ann.getLibelle()) : esc(ann.getTypeAnnexe());
            sb.append(buildAnnexeHeader(numeroAnnexe, titreAnnexe));
            sb.append(buildAnnexePageFidele(ann));
            sb.append(pageFooter("IT TN 3625 — " + numeroAnnexe, "Page " + pageNum));
            sb.append("</div>\n");
            pageNum++;
        }

        // ── NON-CONFORMITÉS ──
        sb.append("<div class=\"page pb\">\n");
        sb.append(annexePageHeader("SECTION 3", "R&#233;capitulatif des Non-Conformit&#233;s", "IT TN 3625"));
        sb.append(buildSectionNonConformites(annexes, c));
        sb.append(pageFooter("IT TN 3625 — Section 3", "Page " + pageNum));
        sb.append("</div>\n");
        pageNum++;

        // ── SECTION 4 : ACTIONS CORRECTIVES ──
        // Si PDFs correctifs importés : section de référence seulement (les PDFs sont fusionnés après)
        sb.append("<div class=\"page pb\">\n");
        sb.append(annexePageHeader("SECTION 4", "Actions Correctives", "IT TN 3625"));
        if (hasPdfsCorrectives) {
            sb.append(buildSectionActionsPdfCorrectives(audit, qkVal, qkNum, c));
        } else {
            sb.append(buildSectionActions(audit, fiche, pdca, qkVal, qkNum, c));
        }
        sb.append(pageFooter("IT TN 3625 — Section 4", "Page " + pageNum));
        sb.append("</div>\n");
        pageNum++;

        // ── CALCUL QK ──
        sb.append("<div class=\"page pb\">\n");
        sb.append(annexePageHeader("SECTION 5", "Calcul QK D&#233;taill&#233; (Table PI3010)", "PI3010"));
        sb.append(buildSectionQK(annexes, qkVal, qkNum, c));
        sb.append(pageFooter("IT TN 3625 — Section 5", "Page " + pageNum));
        sb.append("</div>\n");
        pageNum++;

        // ── SIGNATURES ──
        sb.append("<div class=\"page pb\">\n");
        sb.append(annexePageHeader("SECTION 6", "Signatures &#38; Validation", "IT TN 3625"));
        sb.append(buildSectionSignatures(audit, now));
        sb.append(pageFooter("IT TN 3625 — Document Final", "Page " + pageNum + " / " + pageNum));
        sb.append("</div>\n");

        sb.append("</body>\n</html>");
        return sb.toString();
    }

    /**
     * Version simplifiée sans section actions (quand PDFs correctifs remplacent tout).
     */
    private String buildHtmlCompletSansActions(AuditProduit audit, List<AuditProduitAnnexe> annexes) {
        double    qkNum   = audit.getValeurQK() != null ? audit.getValeurQK() : 0.0;
        String    qkVal   = String.format(Locale.FRENCH, "%.2f", qkNum);
        CouleurQK c       = audit.getCouleurQK();
        String    now     = LocalDateTime.now().format(FMT_DT);
        String    dateAudit = audit.getDatePrevue() != null ? audit.getDatePrevue().format(FMT_DATE) : "—";
        List<AuditProduitAnnexe> annexesRemplies = annexes.stream()
                .filter(a -> Boolean.TRUE.equals(a.getFormValide()) || Boolean.TRUE.equals(a.getImporte()))
                .collect(Collectors.toList());

        StringBuilder sb = new StringBuilder();
        sb.append(htmlHead(audit.getReference()));
        sb.append("<div class=\"page\">\n");
        sb.append(buildPageGardePro(audit, qkVal, qkNum, c, now, dateAudit, annexes, annexesRemplies));
        sb.append(pageFooter("Document confidentiel LEONI — IT TN 3625 / PI3010 — " + now, "Page 1"));
        sb.append("</div>\n");
        sb.append("</body>\n</html>");
        return sb.toString();
    }

    // ════════════════════════════════════════════════════════════════
    //  PAGE DE GARDE PRO
    //  ✓ Logo LEONI : bleu (#003F8A) gras comme l'image officielle
    //  ✓ QK = 0 → "Produit Conforme" / QK > 0 → "Non-Conforme"
    // ════════════════════════════════════════════════════════════════

    private String buildPageGardePro(AuditProduit audit, String qkVal, double qkNum,
                                     CouleurQK c, String now, String dateAudit,
                                     List<AuditProduitAnnexe> annexes,
                                     List<AuditProduitAnnexe> annexesRemplies) {
        int nbDefauts = compterDefauts(annexes);
        String qkLabel = qkLabel(c);

        StringBuilder sb = new StringBuilder();

        // ── HEADER : références à gauche, LOGO LEONI à droite ──
        sb.append("<table style=\"width:100%;border:none;border-bottom:3px solid #000;margin-bottom:0;padding-bottom:10px;\">\n");
        sb.append("<tbody><tr>\n");
        sb.append("<td style=\"border:none;vertical-align:top;width:70%;\">\n");
        sb.append("  <p style=\"font-size:8pt;font-weight:800;color:#555;margin:0 0 2px;\">R&#233;f&#233;rences normatives</p>\n");
        sb.append("  <p style=\"font-size:9pt;font-weight:700;color:#000;margin:0 0 1px;\">IT TN 3625 &#8212; Audit Produit C&#226;blage</p>\n");
        sb.append("  <p style=\"font-size:9pt;font-weight:700;color:#000;margin:0;\">PI3010 &#8212; Indice de Qualit&#233; (QK)</p>\n");
        sb.append("</td>\n");
        // ── LOGO LEONI : bleu officiel #003F8A, gras, Arial Black ──
        sb.append("<td style=\"border:none;text-align:right;vertical-align:top;\">\n");
        sb.append("  <p style=\"font-size:34pt;font-weight:900;color:").append(LEONI_BLUE).append(";\n");
        sb.append("     letter-spacing:5px;margin:0;line-height:1;\n");
        sb.append("     font-family:'Arial Black',Arial,Helvetica,sans-serif;\">LEONI</p>\n");
        sb.append("  <p style=\"font-size:7pt;color:#888;margin:2px 0 0;font-family:Arial,sans-serif;\">PAP Qualit&#233; v3</p>\n");
        sb.append("</td>\n</tr></tbody></table>\n");

        // ── TITRE CENTRÉ ──
        sb.append("<div style=\"text-align:center;margin:18px 0 14px;\">\n");
        sb.append("  <p style=\"font-size:7pt;font-weight:700;color:#555;text-transform:uppercase;letter-spacing:2px;margin:0 0 6px;\">IT TN 3625 &#8212; Conforme LEONI</p>\n");
        sb.append("  <p style=\"font-size:26pt;font-weight:900;color:#000;margin:0 0 4px;letter-spacing:1px;\">Rapport d'Audit Produit</p>\n");
        sb.append("  <p style=\"font-size:11pt;font-weight:700;color:#333;margin:0;\">Faisceau C&#226;blage &#8212; Wire Harness</p>\n");
        sb.append("</div>\n");
        sb.append("<div style=\"border-top:1px solid #ccc;border-bottom:1px solid #ccc;margin-bottom:16px;\"></div>\n");

        // ── TABLEAU INFORMATIONS AUDIT ──
        sb.append("<table style=\"margin-bottom:14px;border-collapse:collapse;\">\n");
        sb.append("<thead><tr>");
        sb.append("<th style=\"width:25%;\">Champ</th><th style=\"width:25%;\">Valeur</th>");
        sb.append("<th style=\"width:25%;\">Champ</th><th style=\"width:25%;\">Valeur</th>");
        sb.append("</tr></thead>\n<tbody>\n");
        sb.append("<tr>").append(tdLabel("R&#233;f&#233;rence")).append(tdVal(esc(audit.getReference())));
        sb.append(tdLabel("S&#233;rie / TAB")).append(tdVal(audit.getSerie()!=null?esc(audit.getSerie().getNom()):"&#8212;")).append("</tr>\n");
        sb.append("<tr style=\"background:#F4F4F4;\">").append(tdLabel("Plant / Site")).append(tdVal(audit.getPlant()!=null?esc(audit.getPlant().getNom()):"&#8212;"));
        sb.append(tdLabel("Auditeur")).append(tdVal(audit.getAuditeur()!=null?esc(audit.getAuditeur().getPrenom()+" "+audit.getAuditeur().getNom()):"&#8212;")).append("</tr>\n");
        sb.append("<tr>").append(tdLabel("Date d'audit")).append(tdVal(esc(dateAudit)));
        sb.append(tdLabel("G&#233;n&#233;r&#233; le")).append(tdVal(esc(now))).append("</tr>\n");
        sb.append("<tr style=\"background:#F4F4F4;\">").append(tdLabel("Statut")).append(tdVal(audit.getStatut()!=null?esc(audit.getStatut().toString()):"&#8212;"));
        sb.append(tdLabel("Nature")).append(tdVal(audit.getNatureAudit()!=null?esc(audit.getNatureAudit().toString()):"&#8212;")).append("</tr>\n");
        sb.append("<tr>").append(tdLabel("Annexes compl&#232;tes")).append(tdVal(annexesRemplies.size()+" / "+annexes.size()));
        sb.append(tdLabel("Nb d&#233;fauts")).append("<td style=\"font-weight:900;padding:5px 8px;border:1px solid #ccc;\">")
                .append(nbDefauts > 0 ? "<span style=\"color:#CC0000;\">"+nbDefauts+"</span>" : "0").append("</td></tr>\n");
        sb.append("</tbody></table>\n");

        // ── RÉSULTAT QK ──
        // ✓ CORRECTION : QK=0 → fond vert "Produit Conforme" / QK>0 → fond selon couleur "Non-Conforme"
        String qkBg = c == CouleurQK.VERT ? "#E8F5E9"
                : c == CouleurQK.ORANGE   ? "#FFF8E1"
                : c == CouleurQK.ROSE     ? "#FDF2F8"
                : c == CouleurQK.ROUGE    ? "#FEF2F2" : "#F4F4F4";
        String qkBd = c == CouleurQK.VERT ? "#059669"
                : c == CouleurQK.ORANGE   ? "#D97706"
                : c == CouleurQK.ROSE     ? "#9D174D"
                : c == CouleurQK.ROUGE    ? "#DC2626" : "#000";
        String qkTxtColor = c == CouleurQK.VERT ? "#059669"
                : c == CouleurQK.ORANGE          ? "#D97706"
                : c == CouleurQK.ROSE            ? "#9D174D"
                : "#DC2626";

        sb.append("<div style=\"border:2px solid ").append(qkBd)
                .append(";background:").append(qkBg)
                .append(";padding:14px 18px;\">\n");
        sb.append("<table style=\"border:none;\"><tbody><tr>\n");

        // Cercle QK SVG
        double pct   = Math.min(100.0, (qkNum / 5.0) * 100.0);
        double r     = 40;
        double circ  = 2 * Math.PI * r;
        double dash  = circ - (pct / 100.0) * circ;
        sb.append("<td style=\"border:none;width:110px;text-align:center;vertical-align:middle;\">\n");
        sb.append(String.format(
                "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"88\" height=\"88\" viewBox=\"0 0 88 88\">"
                        + "<circle cx=\"44\" cy=\"44\" r=\"%.0f\" fill=\"none\" stroke=\"#CCCCCC\" stroke-width=\"7\"/>"
                        + "<circle cx=\"44\" cy=\"44\" r=\"%.0f\" fill=\"none\" stroke=\"%s\" stroke-width=\"7\""
                        + " stroke-dasharray=\"%.2f\" stroke-dashoffset=\"%.2f\""
                        + " stroke-linecap=\"round\" transform=\"rotate(-90 44 44)\"/>"
                        + "<text x=\"44\" y=\"40\" text-anchor=\"middle\" fill=\"#000\" font-size=\"15\" font-weight=\"900\">%s</text>"
                        + "<text x=\"44\" y=\"55\" text-anchor=\"middle\" fill=\"#555\" font-size=\"9\" font-weight=\"700\">QK</text>"
                        + "</svg>\n",
                r, r, qkBd, circ, dash, qkVal));
        sb.append("</td>\n");

        sb.append("<td style=\"border:none;vertical-align:middle;padding-left:18px;\">\n");
        sb.append("<p style=\"font-size:7pt;font-weight:800;color:#555;text-transform:uppercase;letter-spacing:1px;margin:0 0 4px;\">R&#233;sultat QK &#8212; Table PI3010</p>\n");
        // ✓ CORRECTION statut QK : label corrigé
        sb.append("<p style=\"font-size:18pt;font-weight:900;color:").append(qkTxtColor).append(";margin:0 0 4px;\">")
                .append(esc(qkLabel)).append("</p>\n");
        sb.append("<p style=\"font-size:9pt;color:#555;margin:0;\">").append(qkSousLabel(c, qkNum)).append("</p>\n");
        sb.append("</td>\n");

        sb.append("<td style=\"border:none;text-align:center;vertical-align:middle;width:100px;\">\n");
        sb.append("<div style=\"background:").append(qkBd).append(";padding:10px 12px;\">\n");
        sb.append("<p style=\"color:#fff;font-size:7pt;font-weight:700;opacity:.9;margin:0 0 2px;\">QK INDEX</p>\n");
        sb.append("<p style=\"color:#fff;font-size:26pt;font-weight:900;margin:0;\">").append(qkVal).append("</p>\n");
        sb.append("</div>\n</td>\n</tr></tbody></table>\n</div>\n");

        return sb.toString();
    }

    // ════════════════════════════════════════════════════════════════
    //  HEADER D'ANNEXE — Logo LEONI bleu #003F8A
    // ════════════════════════════════════════════════════════════════

    private String buildAnnexeHeader(String numeroAnnexe, String titreAnnexe) {
        return "<table style=\"width:100%;border-collapse:collapse;border:2px solid #000;margin-bottom:4px;\">\n"
                + "<tbody><tr>\n"
                + "<td style=\"width:22%;background:" + ANN_HDR_BG + ";border:1px solid #000;"
                + "padding:7px 10px;font-weight:900;font-size:10pt;color:#000;"
                + "vertical-align:middle;\">" + numeroAnnexe + "</td>\n"
                + "<td style=\"background:" + ANN_HDR_BG + ";border:1px solid #000;"
                + "padding:7px 10px;font-weight:800;font-size:10pt;color:#000;"
                + "vertical-align:middle;text-align:center;\">" + titreAnnexe + "</td>\n"
                // ✓ LOGO LEONI bleu #003F8A gras comme image
                + "<td style=\"width:20%;background:" + ANN_HDR_BG + ";border:1px solid #000;"
                + "padding:7px 10px;font-weight:900;font-size:20pt;color:" + LEONI_BLUE + ";"
                + "font-family:'Arial Black',Arial,Helvetica,sans-serif;"
                + "vertical-align:middle;text-align:right;letter-spacing:4px;\">LEONI</td>\n"
                + "</tr></tbody></table>\n";
    }

    private String annexePageHeader(String numero, String title, String ref) {
        return "<table style=\"width:100%;border-collapse:collapse;border:2px solid #000;margin-bottom:12px;\">\n"
                + "<tbody><tr>\n"
                + "<td style=\"width:22%;background:#333;border:1px solid #000;"
                + "padding:7px 10px;font-weight:900;font-size:10pt;color:#fff;"
                + "vertical-align:middle;\">" + numero + "</td>\n"
                + "<td style=\"background:#333;border:1px solid #000;"
                + "padding:7px 10px;font-weight:800;font-size:11pt;color:#fff;"
                + "vertical-align:middle;text-align:center;\">" + title + "</td>\n"
                // ✓ LOGO LEONI bleu #003F8A sur fond foncé → blanc pour contraste
                + "<td style=\"width:20%;background:#333;border:1px solid #000;"
                + "padding:7px 10px;font-weight:900;font-size:16pt;color:#fff;"
                + "font-family:'Arial Black',Arial,Helvetica,sans-serif;"
                + "vertical-align:middle;text-align:right;letter-spacing:4px;\">LEONI</td>\n"
                + "</tr></tbody></table>\n";
    }

    // ════════════════════════════════════════════════════════════════
    //  SOMMAIRE
    // ════════════════════════════════════════════════════════════════

    private String buildSommaire(List<AuditProduitAnnexe> annexesRemplies,
                                 CouleurQK c, FicheReparation fiche, PlanAction pdca,
                                 boolean hasPdfsCorrectives) {
        StringBuilder sb = new StringBuilder();
        sb.append("<p style=\"font-size:18pt;font-weight:900;color:#000;margin:0 0 10px;\">Sommaire</p>\n");
        sb.append("<div style=\"border-top:2px solid #000;margin-bottom:14px;\"></div>\n");
        sb.append("<table>\n<thead><tr>");
        sb.append("<th style=\"width:50px;text-align:center;\">#</th>");
        sb.append("<th>Section</th>");
        sb.append("<th style=\"width:120px;text-align:center;\">Statut</th>");
        sb.append("</tr></thead>\n<tbody>\n");
        sb.append(sommaireRow(1, "R&#233;sum&#233; Ex&#233;cutif", true));
        for (int i = 0; i < annexesRemplies.size(); i++) {
            AuditProduitAnnexe a = annexesRemplies.get(i);
            String label = "Annexe " + esc(a.getTypeAnnexe())
                    + (a.getLibelle()!=null&&!a.getLibelle().isBlank()?" &#8212; "+esc(a.getLibelle()):"");
            sb.append(sommaireRow(2, label, true));
        }
        sb.append(sommaireRow(3, "R&#233;capitulatif des Non-Conformit&#233;s", true));
        // Section 4 : PDFs correctifs OU formulaires fiche/PDCA
        String sect4Label = hasPdfsCorrectives
                ? "Actions Correctives (PDFs import&#233;s par l'auditeur)"
                : "Actions Correctives (Fiche + PDCA)";
        sb.append(sommaireRow(4, sect4Label, true));
        sb.append(sommaireRow(5, "Calcul QK D&#233;taill&#233; (Table PI3010)", true));
        sb.append(sommaireRow(6, "Signatures &#38; Validation", true));
        if (hasPdfsCorrectives) {
            sb.append(sommaireRow(7, "Annexes PDF correctifs (pages suivantes)", true));
        }
        sb.append("</tbody>\n</table>\n");

        // Note si PDFs correctifs
        if (hasPdfsCorrectives) {
            sb.append("<div style=\"border:2px solid ").append(LEONI_BLUE)
                    .append(";background:#EFF6FF;padding:12px 16px;margin-top:12px;\">\n");
            sb.append("<p style=\"font-weight:900;font-size:10pt;margin:0 0 4px;color:").append(LEONI_BLUE).append(";\">")
                    .append("Documents correctifs import&#233;s par l'auditeur</p>\n");
            sb.append("<p style=\"font-size:9pt;color:#374151;margin:0;\">")
                    .append("Les fiches de r&#233;paration et plans PDCA ont &#233;t&#233; fournis sous forme de PDFs ")
                    .append("par l'auditeur. Ils sont int&#233;gr&#233;s en fin de ce rapport.</p>\n");
            sb.append("</div>\n");
        }
        return sb.toString();
    }

    private String sommaireRow(int num, String label, boolean ok) {
        String bg = (num % 2 == 0) ? " style=\"background:#F4F4F4;\"" : "";
        return "<tr" + bg + ">\n"
                + "<td style=\"text-align:center;font-weight:800;font-size:10pt;\">" + num + "</td>\n"
                + "<td style=\"font-size:10pt;padding:7px 10px;\">" + label + "</td>\n"
                + "<td style=\"text-align:center;font-weight:700;\">"
                + (ok ? "Inclus" : "&#8212;") + "</td>\n</tr>\n";
    }

    // ════════════════════════════════════════════════════════════════
    //  SECTION 1 — RÉSUMÉ EXÉCUTIF
    // ════════════════════════════════════════════════════════════════

    private String buildResumeExecutif(AuditProduit audit,
                                       List<AuditProduitAnnexe> annexes,
                                       List<AuditProduitAnnexe> annexesRemplies,
                                       String qkVal, CouleurQK c,
                                       String now, String dateAudit,
                                       FicheReparation fiche, PlanAction pdca,
                                       boolean hasPdfsCorrectives) {
        int nbDefauts = compterDefauts(annexes);
        int nbNok     = compterNok(annexes);
        long nbManq   = annexes.stream()
                .filter(a -> !Boolean.TRUE.equals(a.getImporte()) && !Boolean.TRUE.equals(a.getFormValide()))
                .count();
        StringBuilder sb = new StringBuilder();
        sb.append("<table style=\"margin-bottom:14px;\">\n");
        sb.append("<thead><tr><th style=\"width:44%;\">Param&#232;tre</th><th>Valeur</th></tr></thead>\n<tbody>\n");
        sb.append(tr2e("R&#233;f&#233;rence audit", esc(audit.getReference())));
        sb.append(tr2e("Auditeur", audit.getAuditeur()!=null?esc(audit.getAuditeur().getPrenom()+" "+audit.getAuditeur().getNom()):"&#8212;"));
        sb.append(tr2e("S&#233;rie / Programme", audit.getSerie()!=null?esc(audit.getSerie().getNom()):"&#8212;"));
        sb.append(tr2e("Plant / Site", audit.getPlant()!=null?esc(audit.getPlant().getNom()):"&#8212;"));
        sb.append(tr2e("Date d'audit", esc(dateAudit)));
        sb.append(tr2e("Date de g&#233;n&#233;ration", esc(now)));
        sb.append(tr2e("Statut", audit.getStatut()!=null?esc(audit.getStatut().toString()):"&#8212;"));
        sb.append(tr2e("Nature", audit.getNatureAudit()!=null?esc(audit.getNatureAudit().toString()):"&#8212;"));
        sb.append(tr2e("Annexes totales / compl&#232;tes", annexes.size()+" / "+annexesRemplies.size()));
        sb.append(tr2e("Annexes manquantes", nbManq==0?"Aucune":String.valueOf(nbManq)));
        sb.append(tr2e("Non-conformit&#233;s (NOK)", nbNok==0?"Aucune":String.valueOf(nbNok)));
        sb.append(tr2e("D&#233;fauts Annexe 1B", nbDefauts==0?"Aucun":String.valueOf(nbDefauts)));
        sb.append(tr2e("Valeur QK calcul&#233;e", qkVal+" (Table PI3010)"));
        // ✓ Statut QK corrigé dans le résumé
        sb.append(tr2e("Verdict QK", esc(qkLabel(c))));
        sb.append(tr2e("D&#233;tail QK", esc(qkSousLabelTexte(c, Double.parseDouble(qkVal.replace(",", "."))))));
        sb.append(tr2e("Actions correctives", esc(qkActionsLabel(c))));


        if (hasPdfsCorrectives) {
            sb.append(tr2e("Fiche de r&#233;paration", "PDF import&#233; par l'auditeur (voir pages suivantes)"));
            sb.append(tr2e("PDCA", "PDF import&#233; par l'auditeur (voir pages suivantes)"));
        } else {
            sb.append(tr2e("Fiche de r&#233;paration",
                    fiche!=null?(Boolean.TRUE.equals(fiche.getValide())?"Valid&#233;e":"En attente"):(c==CouleurQK.VERT?"Non requise":"Requise")));
            sb.append(tr2e("PDCA",
                    pdca!=null?(pdca.getStatut()!=null?esc(pdca.getStatut().toString()):"Envoy&#233;"):(c==CouleurQK.ROSE||c==CouleurQK.ROUGE?"Requis":"Non requis")));
        }
        sb.append("</tbody>\n</table>\n");

        // Bloc récapitulatif QK coloré
        String qkBd = c == CouleurQK.VERT ? "#059669" : c == CouleurQK.ORANGE ? "#D97706"
                : c == CouleurQK.ROSE ? "#9D174D" : "#DC2626";
        String qkBg = c == CouleurQK.VERT ? "#E8F5E9" : c == CouleurQK.ORANGE ? "#FFF8E1"
                : c == CouleurQK.ROSE ? "#FDF2F8" : "#FEF2F2";
        sb.append("<div style=\"border:2px solid ").append(qkBd).append(";background:").append(qkBg).append(";padding:12px 16px;\">\n");
        sb.append("<p style=\"font-size:12pt;font-weight:900;margin:0;color:").append(qkBd).append(";\">")
                .append(esc(qkLabel(c))).append(" &#8212; QK = ").append(qkVal).append("</p>\n");
        sb.append("<p style=\"font-size:9pt;color:#555;margin:4px 0 0;\">").append(esc(qkActionsLabel(c))).append("</p>\n</div>\n");
        return sb.toString();
    }

    // ════════════════════════════════════════════════════════════════
    //  SECTION 4 — ACTIONS CORRECTIVES (PDFs importés)
    // ════════════════════════════════════════════════════════════════

    private String buildSectionActionsPdfCorrectives(AuditProduit audit,
                                                     String qkVal, double qkNum, CouleurQK c) {
        StringBuilder sb = new StringBuilder();

        // Bloc statut QK
        String qkBd = c == CouleurQK.VERT ? "#059669" : c == CouleurQK.ORANGE ? "#D97706"
                : c == CouleurQK.ROSE ? "#9D174D" : "#DC2626";
        String qkBg = c == CouleurQK.VERT ? "#E8F5E9" : c == CouleurQK.ORANGE ? "#FFF8E1"
                : c == CouleurQK.ROSE ? "#FDF2F8" : "#FEF2F2";

        sb.append("<div style=\"border:2px solid ").append(qkBd).append(";background:").append(qkBg)
                .append(";padding:12px 16px;margin-bottom:16px;\">\n");
        sb.append("<p style=\"font-size:12pt;font-weight:900;margin:0;color:").append(qkBd).append(";\">")
                .append(esc(qkLabel(c))).append(" &#8212; QK = ").append(qkVal).append("</p>\n");
        sb.append("<p style=\"color:#555;font-size:9pt;margin:3px 0 0;\">").append(esc(qkActionsLabel(c))).append("</p>\n</div>\n");

        // Message sur les PDFs correctifs
        sb.append("<div style=\"border:2px solid ").append(LEONI_BLUE)
                .append(";background:#EFF6FF;padding:18px 20px;\">\n");
        sb.append("<p style=\"font-size:16pt;margin:0 0 6px;\">\uD83D\uDCC4</p>\n");
        sb.append("<p style=\"font-weight:900;font-size:11pt;margin:0 0 8px;color:").append(LEONI_BLUE).append(";\">")
                .append("Documents Correctifs Import&#233;s par l'Auditeur</p>\n");
        sb.append("<p style=\"font-size:9pt;color:#374151;margin:0 0 8px;line-height:1.6;\">\n");
        sb.append("L'auditeur a import&#233; ses propres documents PDF pour les actions correctives<br/>\n");
        sb.append("(fiche de r&#233;paration et/ou plan PDCA). Ces documents sont int&#233;gr&#233;s<br/>\n");
        sb.append("directement dans ce rapport &#8212; voir les pages suivantes.</p>\n");
        sb.append("<div style=\"background:#fff;border:1px solid #BFDBFE;padding:10px 14px;border-radius:4px;\">\n");
        sb.append("<p style=\"font-size:8.5pt;font-weight:800;color:").append(LEONI_BLUE)
                .append(";margin:0 0 4px;\">R&#233;f&#233;rence :</p>\n");
        sb.append("<p style=\"font-size:8.5pt;color:#374151;margin:0;\">IT TN 3625 / PI3010 &#8212; ")
                .append(esc(qkActionsLabel(c))).append("</p>\n");
        sb.append("</div>\n</div>\n");

        return sb.toString();
    }

    // ════════════════════════════════════════════════════════════════
    //  RENDU FIDÈLE DE L'ANNEXE
    // ════════════════════════════════════════════════════════════════

    @SuppressWarnings("unchecked")
    private String buildAnnexePageFidele(AuditProduitAnnexe ann) {
        StringBuilder sb = new StringBuilder();
        String type = ann.getTypeAnnexe();

        sb.append("<table style=\"margin-bottom:6px;font-size:8pt;\">\n<tbody>\n");
        sb.append("<tr>");
        sb.append(tdLabel("Type")).append("<td style=\"font-weight:700;border:1px solid #ccc;padding:4px 8px;\">").append(esc(type)).append("</td>");
        sb.append(tdLabel("Libell&#233;")).append("<td style=\"border:1px solid #ccc;padding:4px 8px;\">").append(esc(ann.getLibelle()!=null?ann.getLibelle():"&#8212;")).append("</td>");
        sb.append("</tr>\n");
        sb.append("<tr style=\"background:#F4F4F4;\">");
        sb.append(tdLabel("Statut")).append("<td style=\"border:1px solid #ccc;padding:4px 8px;\">")
                .append(Boolean.TRUE.equals(ann.getFormValide())?"Formulaire valid&#233;":"Fichier import&#233;").append("</td>");
        sb.append(tdLabel("Date")).append("<td style=\"border:1px solid #ccc;padding:4px 8px;\">")
                .append(ann.getDateImport()!=null?ann.getDateImport().format(FMT_DATE):"&#8212;").append("</td>");
        sb.append("</tr>\n</tbody>\n</table>\n");

        if (Boolean.TRUE.equals(ann.getImporte()) && !Boolean.TRUE.equals(ann.getFormValide())) {
            sb.append("<div style=\"border:1px solid #000;background:#F9F9F9;padding:10px 14px;\">\n");
            sb.append("<p style=\"font-weight:700;margin:0;\">Fichier import&#233; : ");
            sb.append(esc(ann.getFichierNom()!=null?ann.getFichierNom():"&#8212;")).append("</p>\n</div>\n");
            return sb.toString();
        }

        if (ann.getFormDataJson() == null) {
            sb.append("<p style=\"color:#777;font-style:italic;\">Aucune donn&#233;e disponible.</p>\n");
            return sb.toString();
        }

        Map<String, Object> fd = readJson(ann.getFormDataJson());
        if (fd == null || fd.isEmpty()) {
            sb.append("<p style=\"color:#777;font-style:italic;\">Donn&#233;es non lisibles.</p>\n");
            return sb.toString();
        }

        sb.append(buildAnnexeFidele(type, fd));
        return sb.toString();
    }

    @SuppressWarnings({"unchecked","rawtypes"})
    private String buildAnnexeFidele(String type, Map<String, Object> fd) {
        return switch (type) {
            case "1A"  -> renderAnnexe1A(fd);
            case "1B"  -> renderAnnexe1B(fd);
            case "4"   -> renderAnnexe4(fd);
            case "5"   -> renderAnnexe5(fd);
            case "6"   -> renderAnnexe6(fd);
            case "7"   -> renderAnnexe7(fd);
            case "7A"  -> renderAnnexe7A(fd);
            case "8"   -> renderAnnexe8(fd);
            case "10"  -> renderAnnexe10(fd);
            case "11A" -> renderAnnexeXXRows(fd, "11A",
                    new String[]{"adresseUSS","nrFil","section","couleur","type","forcePelageMin","forcePelageMesuree"},
                    new String[]{"Adresse USS","Nr Fil","Section","Couleur","Type","Force pelage min.","Force mesur&#233;e"},
                    "resultat");
            case "11B" -> renderAnnexeXXRows(fd, "11B",
                    new String[]{"adresse","nrFil","section","couleur","nbrFils","pasTorsadage","pasMesure","tolerance","mesureC1","mesureC2"},
                    new String[]{"Adresse","Nr Fil","Section","Couleur","Nb fils","Pas exig&#233;","Pas mesur&#233;","Tol&#233;rance","Mesure C1","Mesure C2"},
                    "resultat");
            case "11C" -> renderAnnexeXXRows(fd, "11C",
                    new String[]{"nrFil","couleur","section","nbreFils","pasTorsadageExige","pasTorsadageMesure","mesureC1","mesureC2","boutTorsadageC1","boutTorsadageC2"},
                    new String[]{"Nr Fil","Couleur","Section","Nb fils","Pas exig&#233;","Pas mesur&#233;","Mesure C1","Mesure C2","Bout C1","Bout C2"},
                    "resultat");
            case "13A","13B","13C","13D" -> renderAnnexe13(fd, type);
            case "PSA" -> renderAnnexePSA(fd);
            case "DPE" -> renderAnnexeDPE(fd);
            default    -> renderAnnexeGenerique(fd);
        };
    }

    // ════════════════════════════════════════════════════════════════
    //  HELPERS CSS
    // ════════════════════════════════════════════════════════════════

    private String th(String content, String extraStyle) {
        return "<th style=\"background:#1a56a0;color:#fff;border:" + BORDER
                + ";padding:4px 5px;font-size:8pt;font-weight:700;"
                + (extraStyle != null ? extraStyle : "") + "\">" + content + "</th>";
    }

    private String td(String content, String extraStyle) {
        return "<td style=\"border:" + BORDER + ";padding:3px 5px;font-size:8pt;"
                + (extraStyle != null ? extraStyle : "") + "\">" + content + "</td>";
    }

    private String tdNok(String content) {
        return "<td style=\"border:" + BORDER + ";padding:3px 5px;font-size:8pt;"
                + "background:#FFE0E0;font-weight:700;color:#CC0000;\">" + content + "</td>";
    }

    private String tdOk(String content) {
        return "<td style=\"border:" + BORDER + ";padding:3px 5px;font-size:8pt;"
                + "background:#E8F5E9;\">" + content + "</td>";
    }

    private String checkbox(boolean checked) {
        if (checked) {
            return "<span style=\"display:inline-block;width:14px;height:14px;border:1.5px solid #059669;"
                    + "background:#E8F5E9;text-align:center;font-size:8pt;font-weight:900;color:#059669;"
                    + "line-height:14px;\">X</span>";
        } else {
            return "<span style=\"display:inline-block;width:14px;height:14px;border:1.5px solid #999;"
                    + "background:#fff;text-align:center;font-size:8pt;line-height:14px;\">&nbsp;</span>";
        }
    }

    private String radio(boolean selected) {
        if (selected) {
            return "<span style=\"display:inline-block;width:14px;height:14px;border:1.5px solid #2563EB;"
                    + "border-radius:50%;background:#2563EB;text-align:center;font-size:6pt;color:#fff;"
                    + "line-height:14px;\">O</span>";
        } else {
            return "<span style=\"display:inline-block;width:14px;height:14px;border:1.5px solid #999;"
                    + "border-radius:50%;background:#fff;text-align:center;font-size:8pt;line-height:14px;\">&nbsp;</span>";
        }
    }

    private String statutCell(String val) {
        if (val == null || val.isBlank()) return td("&#8212;", "text-align:center;");
        boolean isNok = val.equalsIgnoreCase("NOK") || val.contains("N.I.O") || val.equals("niO") || val.equals("Non");
        boolean isOk  = val.equalsIgnoreCase("Ok") || val.equalsIgnoreCase("I.O")
                || val.equalsIgnoreCase("iO") || val.equalsIgnoreCase("Oui")
                || val.equalsIgnoreCase("Conforme");
        if (isNok) return "<td style=\"border:" + BORDER + ";background:#FFE0E0;"
                + "text-align:center;font-weight:800;font-size:8pt;color:#CC0000;\">"
                + esc(val) + "</td>";
        if (isOk)  return "<td style=\"border:" + BORDER + ";background:#E8F5E9;"
                + "text-align:center;font-size:8pt;color:#059669;font-weight:700;\">"
                + esc(val) + "</td>";
        return td(esc(val), "text-align:center;");
    }

    private String radioIoNioNa(String val, String choice) {
        boolean sel = choice.equalsIgnoreCase(val != null ? val : "");
        String color = "N.I.O".equalsIgnoreCase(choice) ? "#CC0000" : "I.O".equalsIgnoreCase(choice) ? "#059669" : "#666";
        if (sel) {
            return "<span style=\"display:inline-block;padding:1px 6px;border:1.5px solid " + color
                    + ";background:" + (color.equals("#CC0000")?"#FFE0E0":color.equals("#059669")?"#E8F5E9":"#F5F5F5")
                    + ";font-weight:900;font-size:8pt;color:" + color + ";border-radius:3px;\">" + choice + "</span>";
        }
        return "<span style=\"display:inline-block;padding:1px 6px;border:1px solid #ccc;"
                + "background:#F9F9F9;font-size:8pt;color:#bbb;border-radius:3px;\">" + choice + "</span>";
    }

    private String radioOuiNon(String val, String choice) {
        boolean sel = choice.equalsIgnoreCase(val != null ? val : "");
        String color = "Non".equalsIgnoreCase(choice) ? "#CC0000" : "#059669";
        if (sel) {
            return "<span style=\"display:inline-block;padding:2px 8px;border:1.5px solid " + color
                    + ";background:" + ("Non".equalsIgnoreCase(choice)?"#FFE0E0":"#E8F5E9")
                    + ";font-weight:900;font-size:8pt;color:" + color + ";border-radius:3px;\">" + choice + "</span>";
        }
        return "<span style=\"display:inline-block;padding:2px 8px;border:1px solid #ddd;"
                + "background:#f9f9f9;font-size:8pt;color:#ccc;border-radius:3px;\">" + choice + "</span>";
    }

    private String metaTable(Map<String, Object> fd, String[][] fields) {
        StringBuilder sb = new StringBuilder();
        sb.append("<table style=\"margin-bottom:6px;font-size:8pt;\">\n<tbody>\n");
        for (String[] row : fields) {
            sb.append("<tr>");
            for (int i = 0; i < row.length; i += 2) {
                String lbl = row[i];
                String key = i + 1 < row.length ? row[i+1] : null;
                String val = key != null ? str(fd, key) : "";
                sb.append(tdLabel(lbl));
                sb.append(td(isEmpty(val) ? "&#8212;" : esc(val), "font-size:8pt;"));
            }
            sb.append("</tr>\n");
        }
        sb.append("</tbody>\n</table>\n");
        return sb.toString();
    }

    // ════════════════════════════════════════════════════════════════
    //  ANNEXE 1A
    // ════════════════════════════════════════════════════════════════

    private String renderAnnexe1A(Map<String, Object> fd) {
        StringBuilder sb = new StringBuilder();
        sb.append("<p style=\"font-size:7pt;color:#666;margin:2px 0 6px;\">PI3010 Enclosure 1(a) / 09.24</p>\n");

        sb.append("<table style=\"margin-bottom:4px;border-collapse:collapse;border:" + BORDER + ";font-size:8pt;\">\n");
        sb.append("<tbody><tr><td style=\"border:" + BORDER + ";padding:4px 8px;\">\n");
        sb.append("<b>Month / Year :</b> " + esc(str(fd,"monthYear")) + "&nbsp;&nbsp;&nbsp;");
        sb.append("<b>Vehicle type(s) :</b> " + esc(str(fd,"vehicleType")) + "&nbsp;&nbsp;&nbsp;");
        sb.append("<b>Manufacturing Plant :</b> " + esc(str(fd,"plant")) + "\n");
        sb.append("</td></tr></tbody></table>\n");

        List<Map<String,Object>> rows = getRows(fd, "rows");
        int MINIMUM_ROWS = 8;
        List<Map<String,Object>> allRows = new ArrayList<>(rows);
        while (allRows.size() < MINIMUM_ROWS) allRows.add(new LinkedHashMap<>());

        sb.append("<div style=\"overflow:auto;\">\n");
        sb.append("<table style=\"font-size:8pt;\">\n<thead><tr>\n");
        sb.append(th("Part Description / Drawing / Date / Auditor",""));
        sb.append(th("Quality Class (QK)","width:55px;text-align:center;"));
        sb.append(th("Nb defects","width:55px;text-align:center;"));
        sb.append(th("Total Points","width:65px;text-align:center;"));
        sb.append(th("Rating Factor","width:65px;text-align:center;"));
        sb.append(th("D","width:35px;text-align:center;"));
        sb.append(th("N","width:35px;text-align:center;"));
        sb.append("</tr></thead>\n<tbody>\n");

        for (int i = 0; i < allRows.size(); i++) {
            Map<String,Object> r = allRows.get(i);
            double qk = parseDouble(r.get("qk"), -1);
            boolean isNokQk = qk > 0.0 && qk >= 0; // ✓ QK > 0 = Non-Conforme
            String rowBg = isNokQk ? "background:#FFE0E0;" : i%2==0?"background:#fff;":"background:#f5f5f5;";
            sb.append("<tr style=\"").append(rowBg).append("height:40px;\">");

            sb.append("<td style=\"border:").append(BORDER).append(";padding:3px 5px;font-size:7.5pt;vertical-align:top;min-height:36px;\">");
            if (!isEmpty(str(r,"partDesc")) || !isEmpty(str(r,"drawingNo"))) {
                sb.append(esc(str(r,"partDesc")));
                if (!isEmpty(str(r,"drawingNo"))) sb.append("<br/><span style=\"color:#555;font-size:7pt;\">").append(esc(str(r,"drawingNo")));
                if (!isEmpty(str(r,"productionDate"))) sb.append(" &#8212; ").append(esc(str(r,"productionDate")));
                if (!isEmpty(str(r,"productAuditor"))) sb.append(" &#8212; ").append(esc(str(r,"productAuditor")));
                sb.append("</span>");
            }
            sb.append("</td>");

            String qkStr = !isEmpty(str(r,"qk")) ? str(r,"qk") : "";
            sb.append("<td style=\"border:").append(BORDER).append(";text-align:center;font-weight:900;")
                    .append(isNokQk?"color:#CC0000;background:#FFE0E0;":"").append("\">").append(esc(qkStr)).append("</td>");

            sb.append(td(!isEmpty(str(r,"nbDefects"))?esc(str(r,"nbDefects")):"", "text-align:center;border:"+BORDER+";"));
            sb.append(td(!isEmpty(str(r,"totalPoints"))?esc(str(r,"totalPoints")):"", "text-align:center;border:"+BORDER+";"));
            sb.append(td(!isEmpty(str(r,"ratingFactor"))?esc(str(r,"ratingFactor")):"", "text-align:center;border:"+BORDER+";"));

            boolean dest = Boolean.TRUE.equals(r.get("destructive"));
            boolean nonDest = Boolean.TRUE.equals(r.get("nonDestructive"));
            sb.append("<td style=\"border:").append(BORDER).append(";text-align:center;\">").append(checkbox(dest)).append("</td>");
            sb.append("<td style=\"border:").append(BORDER).append(";text-align:center;\">").append(checkbox(nonDest)).append("</td>");
            sb.append("</tr>\n");
        }
        sb.append("</tbody>\n</table>\n</div>\n");

        List<Double> qkValues = allRows.stream()
                .map(r -> { try { return Double.parseDouble(str(r,"qk")); } catch (Exception e) { return Double.NaN; } })
                .filter(d -> !Double.isNaN(d)).collect(Collectors.toList());
        double qkMin = qkValues.stream().mapToDouble(d->d).min().orElse(0);
        double qkMax = qkValues.stream().mapToDouble(d->d).max().orElse(0);
        double qkAvg = qkValues.stream().mapToDouble(d->d).average().orElse(0);
        long nbAudited = allRows.stream().filter(r -> !isEmpty(str(r,"drawingNo"))||!isEmpty(str(r,"partDesc"))).count();
        long nbExceed  = qkValues.stream().filter(v -> v > 0.0).count(); // ✓ QK > 0 = Non-Conforme

        sb.append("<table style=\"margin-top:4px;font-size:8pt;\">\n<tbody><tr>");
        sb.append("<td style=\"border:").append(BORDER).append(";padding:4px 8px;\">");
        sb.append("<b>QK min : </b><b>" + (qkValues.isEmpty()?"—":String.format("%.1f",qkMin)) + "</b>&nbsp;&nbsp;");
        sb.append("<b>QK avg : </b><b>" + (qkValues.isEmpty()?"—":String.format("%.2f",qkAvg)) + "</b>&nbsp;&nbsp;");
        sb.append("<b>QK max : </b><b style=\"color:" + (qkMax>0?"#CC0000":"#000") + "\">" + (qkValues.isEmpty()?"—":String.format("%.1f",qkMax)) + "</b>");
        sb.append("</td>");
        sb.append("<td style=\"border:").append(BORDER).append(";padding:4px 8px;\">");
        sb.append("<b>Harnesses audited : (").append(nbAudited).append(")</b>&nbsp;&nbsp;");
        sb.append("In <b style=\"color:").append(nbExceed>0?"#CC0000":"#059669").append(";\">").append(nbExceed).append("</b> cases Non-Conforme.");
        sb.append("</td></tr></tbody></table>\n");

        return sb.toString();
    }

    // ════════════════════════════════════════════════════════════════
    //  ANNEXE 1B
    // ════════════════════════════════════════════════════════════════

    private String renderAnnexe1B(Map<String, Object> fd) {
        StringBuilder sb = new StringBuilder();
        sb.append("<p style=\"font-size:7pt;color:#666;margin:2px 0 4px;\">PI3010 Enclosure 1(b) / 09.24 &nbsp;|&nbsp; Target: QC &lt;= 0 &nbsp;|&nbsp; Threshold: QC = 0</p>\n");

        sb.append(metaTable(fd, new String[][]{
                {"Part Description","partDesc","D&#233;partement","department"},
                {"V&#233;hicule / Type","vehicleType","Plant","plant"},
                {"TAB","tab","Auditeur","auditor"},
                {"Date","date","Type (D/N)","auditType"},
        }));

        double tp = parseDouble(fd.get("totalPoints"), 0);
        double rf = parseDouble(fd.get("ratingFactor"), 0);
        double wp = parseDouble(fd.get("weightedPoints"), tp*rf);
        double qk = parseDouble(fd.get("valeurQK"), 0);
        String nbComp = str(fd,"nbComposants");

        sb.append("<table style=\"margin-bottom:8px;font-size:8pt;\">\n<thead><tr>");
        sb.append(th("Total Points","width:90px;text-align:center;"));
        sb.append(th("Nb Composants","width:90px;text-align:center;"));
        sb.append(th("Rating Factor","width:90px;text-align:center;"));
        sb.append(th("Weighted Points","width:90px;text-align:center;"));
        sb.append(th("QK","width:70px;text-align:center;"));
        sb.append("</tr></thead><tbody><tr>");
        sb.append(td(String.format("%.1f",tp), "text-align:center;font-weight:700;"));
        sb.append(td(isEmpty(nbComp)?"&#8212;":esc(nbComp), "text-align:center;"));
        sb.append(td(rf>0?String.format("%.1f",rf):"&#8212;", "text-align:center;"));
        sb.append(td(wp>0?String.format("%.1f",wp):"&#8212;", "text-align:center;"));
        // ✓ QK > 0 = Non-Conforme (rouge), QK = 0 = Conforme (vert)
        boolean qkNonConforme = qk > 0.0;
        sb.append("<td style=\"border:").append(BORDER).append(";text-align:center;font-weight:900;font-size:12pt;")
                .append(qkNonConforme?"background:#FFE0E0;color:#CC0000;":"background:#E8F5E9;color:#059669;").append("\">")
                .append(String.format("%.1f",qk)).append("</td>");
        sb.append("</tr></tbody></table>\n");

        List<Map<String,Object>> defauts = getRows(fd,"defauts");
        if (defauts.isEmpty()) {
            sb.append("<p style=\"font-style:italic;color:#555;font-size:8pt;\">Aucun d&#233;faut enregistr&#233;.</p>\n");
            return sb.toString();
        }

        sb.append("<table style=\"font-size:8pt;\">\n<thead><tr>");
        sb.append(th("#","width:25px;text-align:center;"));
        sb.append(th("Code","width:45px;text-align:center;"));
        sb.append(th("Type","width:35px;text-align:center;"));
        sb.append(th("Description / Action corrective",""));
        sb.append(th("Fr&#233;q.","width:40px;text-align:center;"));
        sb.append(th("Pts/d&#233;f.","width:50px;text-align:center;"));
        sb.append(th("Total","width:50px;text-align:center;"));
        sb.append(th("Pilote","width:70px;"));
        sb.append(th("&#201;ch&#233;ance","width:75px;"));
        sb.append(th("OK?","width:40px;text-align:center;"));
        sb.append("</tr></thead>\n<tbody>\n");

        double grandTotal = 0;
        for (int i = 0; i < defauts.size(); i++) {
            Map<String,Object> d = defauts.get(i);
            double tot = parseDouble(d.get("totalDefectPoints"),
                    parseDouble(d.get("freq"),1)*parseDouble(d.get("pointsDefect"),25));
            grandTotal += tot;
            boolean rowNok = tot > 0;
            String rowBg = rowNok ? "background:#FFE0E0;" : i%2==0?"":"background:#F4F4F4;";
            sb.append("<tr style=\"").append(rowBg).append("\">");
            sb.append(td(String.valueOf(i+1), "text-align:center;font-weight:700;"));
            sb.append(td("<b>"+esc(str(d,"code"))+"</b>", "text-align:center;"));
            sb.append(td(esc(str(d,"type")), "text-align:center;"));
            String desc = esc(str(d,"description"));
            String action = str(d,"action");
            String cellDesc = desc + (isEmpty(action)?"":"<br/><span style=\"color:#555;font-size:7pt;\">Corr: "+esc(action)+"</span>");
            sb.append(td(cellDesc, null));
            sb.append(td(esc(str(d,"freq")), "text-align:center;"));
            sb.append(td(esc(str(d,"pointsDefect")), "text-align:center;"));
            sb.append("<td style=\"border:").append(BORDER).append(";text-align:center;font-weight:900;")
                    .append(tot>=100?"background:#FFE0E0;color:#CC0000;":tot>=50?"background:#FFF3E0;color:#D97706;":"background:#E8F5E9;color:#059669;")
                    .append(";\">").append(String.format("%.0f",tot)).append("</td>");
            sb.append(td(esc(str(d,"pilot")), null));
            sb.append(td(esc(str(d,"deadline")), null));
            sb.append("<td style=\"border:").append(BORDER).append(";text-align:center;\">")
                    .append(checkbox(Boolean.TRUE.equals(d.get("checked")))).append("</td>");
            sb.append("</tr>\n");
        }
        sb.append("<tr style=\"background:#EEEEEE;\"><td colspan=\"6\" style=\"border:").append(BORDER)
                .append(";text-align:right;font-weight:900;padding:5px 8px;\">TOTAL POINTS :</td>");
        sb.append("<td style=\"border:").append(BORDER).append(";text-align:center;font-weight:900;font-size:11pt;color:#CC0000;\">")
                .append(String.format("%.0f",grandTotal)).append("</td><td colspan=\"3\" style=\"border:").append(BORDER).append(";\"></td></tr>\n");
        sb.append("</tbody>\n</table>\n");
        return sb.toString();
    }

    // ════════════════════════════════════════════════════════════════
    //  ANNEXE 4
    // ════════════════════════════════════════════════════════════════

    private static final String[][] ETAPES_4 = {
            {null, "Spécifications dessin", null},
            {"Spéc. dessin", "Prendre un dessin/plan de faisceau spécialement pour l'audit de produit", "Dessin/plan de faisceau"},
            {null, "Vérification de tous les messages mentionnées dans le dessin", "Selon dessin/plan de faisceau"},
            {null, "Vérification des marquages (Farbmarkierung et Zipper)", "Selon dessin/plan de faisceau"},
            {null, "Contrôle électrique", null},
            {"Ctrl électrique", "Refaire le contrôle électrique de nouveau du câblage/faisceau", "Étiquette CE"},
            {null, "Document", null},
            {"Document", "Prendre une copie du plan de contrôle et vérifier les points inscrits", "Plan de contrôle / Annexe 1 IC TN 3052"},
            {null, "Mesure", null},
            {"Mesure", "Contrôle des dimensions selon dessin/plan de faisceau", "Annexe 7 / Annexe 7a"},
            {null, "Mesure des hauteurs de sertissage par un échantillon de chaque type de contact", "Paramètre sertissage selon B2B / Leo Parts"},
            {null, "Mesure des hauteurs de sertissage des contacts/USS", "IT 3117 / IT 3092 / IC3030 / Annexe 10 / Annexe 11a"},
            {null, "Composants", null},
            {"Composants", "Contrôler si les contacts sont bien encliquetés", "Visuellement"},
            {null, "Contrôler si les contacts/Connecteurs sont justes et non déformés", "Classeur des contactes"},
            {null, "Contrôle de la soudure des contacts/USS/Commutateur", "IC 3026, IC TN 3403"},
            {null, "Contrôler si les douilles/boitiers sont correctes, fermées et non endommagées", "Visuellement/Dessin"},
            {null, "Contrôle de la présence, la direction et la fermeture des couvercles des douilles", "Visuellement/selon symbole"},
            {null, "Contrôler la présence, le montage et les couleurs des joints (Seals) et bouchons", "Classeur joints et bouchons"},
            {null, "Contrôle des traces de l'amboss dans la zone de sertissage (AVW)", "Microscope USB"},
            {null, "Contrôle du montage des tubes gorge, schlauch et monofil", "Selon message dessin / IC 3016"},
            {null, "Contrôle du serrage et de la fixation des agrafes (Kabelbinder/Clips)", "Visuellement/manuel/IT 3 455-05"},
            {null, "Contrôle visuel du point de soudure (nœud étamé)", "IC 3026"},
            {null, "Image de coupe", null},
            {"Image coupe", "Image de coupe par un échantillon de chaque type de contact (AVW)", "VW 603 30, AA VWP 3009 / IT3117"},
            {null, "Étanchéité", null},
            {"Étanchéité", "Contrôle de l'étanchéité des passes câbles/Schrumpfschlauch", "Annexe 1 IC TN3600"},
            {null, "Poids", null},
            {"Poids", "Peser le faisceau et comparer son poids par rapport aux spécifications", "Spécifications clients / Données IMDS"},
            {null, "Étiquette", null},
            {"Étiquette", "Vérifier le contenu de l'étiquette CE (si applicable)", "Spécifications clients"},
            {null, "Vissage", null},
            {"Vissage", "Vérifier les paramètres de vissage (si applicable)", "Spécifications clients"},
    };

    private String renderAnnexe4(Map<String, Object> fd) {
        StringBuilder sb = new StringBuilder();
        sb.append("<p style=\"font-size:7pt;color:#666;margin:2px 0 4px;\">IT TN 3625 — Annexe 4 Etat 09.2025</p>\n");

        sb.append(metaTable(fd, new String[][]{{"S&#233;rie / TAB","serie","Index","index"},{"Date de dessin","dateDessin",null,null}}));

        List<Map<String,Object>> rows = getRows(fd,"rows");
        if (rows.isEmpty()) rows = getRows(fd,"etapes");

        sb.append("<div style=\"background:#1a56a0;color:#fff;padding:7px 10px;text-align:center;font-weight:900;font-size:10pt;margin-bottom:6px;\">")
                .append("Tampon audit produit</div>\n");

        sb.append("<table style=\"font-size:8pt;\">\n<thead><tr>\n");
        sb.append(th("&#201;l&#233;ment","width:90px;"));
        sb.append(th("&#201;tape de travail",""));
        sb.append(th("Documentation","width:150px;"));
        sb.append(th("I.O","width:45px;text-align:center;"));
        sb.append(th("N.I.O","width:45px;text-align:center;"));
        sb.append(th("NA","width:40px;text-align:center;"));
        sb.append("</tr></thead>\n<tbody>\n");

        int rowIdx = 0;
        for (String[] etape : ETAPES_4) {
            boolean isGroupHeader = etape[0] == null && etape[2] == null;
            if (isGroupHeader) {
                sb.append("<tr><td colspan=\"6\" style=\"border:").append(BORDER)
                        .append(";background:#DDDDDD;font-weight:900;padding:4px 8px;font-size:8.5pt;\">")
                        .append(esc(etape[1])).append("</td></tr>\n");
                continue;
            }

            String res = "";
            if (rowIdx < rows.size()) {
                Map<String,Object> r = rows.get(rowIdx);
                res = str(r,"res");
                if (isEmpty(res)) res = str(r,"resultat");
                if (isEmpty(res)) res = str(r,"result");
            }
            rowIdx++;

            boolean isNio = "N.I.O".equalsIgnoreCase(res);
            boolean isIo  = "I.O".equalsIgnoreCase(res);
            boolean isNA  = "NA".equalsIgnoreCase(res);
            String rowBg  = isNio ? "background:#FFE0E0;" : rowIdx%2==0?"background:#f5f5f5;":"";

            sb.append("<tr style=\"").append(rowBg).append("\">");
            sb.append(td(etape[0]!=null?"<b>"+esc(etape[0])+"</b>":"", "background:#F4F4F4;font-size:7.5pt;"));
            sb.append(td(esc(etape[1]), "font-size:8pt;"));
            sb.append(td(etape[2]!=null?esc(etape[2]):"", "font-size:7pt;color:#555;"));
            sb.append("<td style=\"border:").append(BORDER).append(";text-align:center;padding:3px;\">")
                    .append(radioIoNioNa(res,"I.O")).append("</td>");
            sb.append("<td style=\"border:").append(BORDER).append(";text-align:center;padding:3px;\">")
                    .append(radioIoNioNa(res,"N.I.O")).append("</td>");
            sb.append("<td style=\"border:").append(BORDER).append(";text-align:center;padding:3px;\">")
                    .append(radioIoNioNa(res,"NA")).append("</td>");
            sb.append("</tr>\n");
        }
        sb.append("</tbody>\n</table>\n");

        sb.append("<div style=\"display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:10px;\">\n");
        for (String k : new String[]{"validateur1","validateur2"}) {
            String v = str(fd,k);
            sb.append("<div style=\"border:1px solid #000;padding:5px 10px;\">");
            sb.append("<span style=\"font-size:8pt;font-weight:700;\">Validation Sampling Auditor : </span>");
            sb.append("<span style=\"font-size:9pt;\">").append(isEmpty(v)?"__________________________":esc(v)).append("</span>");
            sb.append("</div>\n");
        }
        sb.append("</div>\n");
        return sb.toString();
    }

    // ════════════════════════════════════════════════════════════════
    //  ANNEXE 5
    // ════════════════════════════════════════════════════════════════

    private static final String[][] QUESTIONS_5 = {
            {null, "1. Audit de processus – Emballage et Identification"},
            {"q11", "1.1. Instruction d'emballage existe et respectée?"},
            {"q12", "1.2. Emballage intérieur selon l'instruction interne."},
            {"q13", "1.3. Instructions internes d'identification respectées?"},
            {null, "2.0. Audit de processus - Process assemblage"},
            {"q21", "2.1. Dessin lisible et en état actuel et étiquette en ordre?"},
            {"q22", "2.2. Paramètres de production fixés et respectés?"},
            {"q23", "2.3. Planche de montage homologuée et en ordre?"},
            {"q24", "2.4. Équipement / machines en ordre, entretien documenté?"},
            {"q25", "2.5. Carte d'enregistrement des données de procédé en ordre?"},
            {"q26", "2.6. Ouvriers qualifiés?"},
            {"q27", "2.7. Documents de production en état actuel et homologués?"},
            {"q28", "2.8. Surfaces et caisses identifiées / homologuées et en ordre?"},
            {"q29a", "2.9. Table de contrôle : entretien documenté?"},
            {"q29b", "2.9. Table de contrôle : tous les composants demandés?"},
            {"q210", "2.10. Plan de contrôle actuel?"},
            {"q211", "2.11. AMDEC processus montage existante et actuelle."},
            {"q212", "2.12. Plan de surveillance du processus montage existant et actuel(le)."},
    };

    private String renderAnnexe5(Map<String, Object> fd) {
        StringBuilder sb = new StringBuilder();
        sb.append("<p style=\"font-size:7pt;color:#666;margin:2px 0 4px;\">IT TN 3625 — Annexe 5 Etat 11.2023</p>\n");

        sb.append(metaTable(fd, new String[][]{{"S&#233;rie / TAB","serie","Index / Date","indexDate"}}));

        Map<String,Object> q = getMap(fd,"questions");

        sb.append("<table style=\"font-size:8pt;\">\n<thead><tr>");
        sb.append(th("Question",""));
        sb.append(th("Oui","width:60px;text-align:center;"));
        sb.append(th("Non","width:60px;text-align:center;"));
        sb.append("</tr></thead>\n<tbody>\n");

        int i = 0;
        for (String[] item : QUESTIONS_5) {
            if (item[0] == null) {
                sb.append("<tr><td colspan=\"3\" style=\"border:").append(BORDER)
                        .append(";background:#DDDDDD;font-weight:900;padding:5px 8px;font-size:8.5pt;\">")
                        .append(esc(item[1])).append("</td></tr>\n");
                continue;
            }
            String val = str(q, item[0]);
            boolean isNon = "Non".equalsIgnoreCase(val);
            boolean isOui = "Oui".equalsIgnoreCase(val);
            String rowBg = isNon ? "background:#FFE0E0;" : i%2==0?"":"background:#F4F4F4;";

            sb.append("<tr style=\"").append(rowBg).append("\">");
            sb.append(td(esc(item[1]), "font-size:8pt;"));
            sb.append("<td style=\"border:").append(BORDER).append(";text-align:center;padding:3px;\">")
                    .append(radioOuiNon(val,"Oui")).append("</td>");
            sb.append("<td style=\"border:").append(BORDER).append(";text-align:center;padding:3px;\">")
                    .append(radioOuiNon(val,"Non")).append("</td>");
            sb.append("</tr>\n");
            i++;
        }
        sb.append("</tbody>\n</table>\n");

        sb.append("<div style=\"background:#FFFBEB;border:1px solid #FCD34D;padding:6px 10px;margin:8px 0;font-size:9pt;\">");
        sb.append("<b>Dans le cas de NON,</b> les d&#233;viations doivent &#234;tre document&#233;es et trait&#233;es dans le PDCA l'annexe 4 de l'IP 3023");
        sb.append("</div>\n");

        sb.append("<div style=\"display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:8px;\">\n");
        for (String k : new String[]{"validateur1","validateur2"}) {
            String v = str(fd,k);
            sb.append("<div style=\"border:1px solid #000;padding:5px 10px;font-size:8pt;\">")
                    .append("<b>Validation Sampling Auditor : </b>")
                    .append(isEmpty(v)?"__________________________":esc(v)).append("</div>\n");
        }
        sb.append("</div>\n");
        return sb.toString();
    }

    // ════════════════════════════════════════════════════════════════
    //  ANNEXES 6, 7, 7A, 8, 10, 11A/B/C, 13, PSA, DPE — INCHANGÉES
    // ════════════════════════════════════════════════════════════════

    private String renderAnnexe6(Map<String, Object> fd) {
        StringBuilder sb = new StringBuilder();
        sb.append(metaTable(fd, new String[][]{
                {"N&#176; dessin","numDessin","Famille","famille"},
                {"N&#176; BMW/MN/OEM","numBMW","Adresse","adresse"},
        }));
        List<Map<String,Object>> rows = getRows(fd,"rows");
        if (!rows.isEmpty()) {
            sb.append("<p style=\"font-weight:700;font-size:8.5pt;margin:8px 0 3px;\">Mesures des fils (Sertissage)</p>\n");
            sb.append("<div style=\"overflow:auto;\">\n");
            sb.append("<table style=\"font-size:7.5pt;min-width:700px;\">\n<thead><tr>");
            for (String h : new String[]{"Nr fil","Section","Couleur","Pin","Type","Contact","CH","CHm","CW","CWm","PF","PFm","R&#233;sultat"})
                sb.append(th(h,""));
            sb.append("</tr></thead>\n<tbody>\n");
            for (int i = 0; i < rows.size(); i++) {
                Map<String,Object> r = rows.get(i);
                if (isEmpty(str(r,"nrFil"))) continue;
                String res = str(r,"resultat");
                boolean nok = "NOK".equalsIgnoreCase(res);
                String bg = nok?"background:#FFE0E0;":i%2==0?"":"background:#F4F4F4;";
                sb.append("<tr style=\"").append(bg).append("\">");
                for (String k : new String[]{"nrFil","section","couleur","pin","type","contact","ch","chm","cw","cwm","pf","pfm"})
                    sb.append(td(esc(str(r,k)), null));
                sb.append(statutCell(res));
                sb.append("</tr>\n");
            }
            sb.append("</tbody>\n</table>\n</div>\n");
        }
        List<Map<String,Object>> ussRows = getRows(fd,"ussRows");
        if (!ussRows.isEmpty()) {
            sb.append("<p style=\"font-weight:700;font-size:8.5pt;margin:8px 0 3px;\">USS — Force de pelage</p>\n");
            sb.append("<table style=\"font-size:7.5pt;\">\n<thead><tr>");
            for (String h : new String[]{"Nr fil","Section","Couleur","Type","Force pelage (spec.)","Force mesur&#233;e","R&#233;sultat"})
                sb.append(th(h,""));
            sb.append("</tr></thead>\n<tbody>\n");
            for (int i = 0; i < ussRows.size(); i++) {
                Map<String,Object> r = ussRows.get(i);
                if (isEmpty(str(r,"nrFil"))) continue;
                String res = str(r,"resultat");
                boolean nok = "NOK".equalsIgnoreCase(res);
                String bg = nok?"background:#FFE0E0;":i%2==0?"":"background:#F4F4F4;";
                sb.append("<tr style=\"").append(bg).append("\">");
                for (String k : new String[]{"nrFil","section","couleur","type","forcePelage","forceMesuree"})
                    sb.append(td(esc(str(r,k)), null));
                sb.append(statutCell(res));
                sb.append("</tr>\n");
            }
            sb.append("</tbody>\n</table>\n");
        }
        return sb.toString();
    }

    private String renderAnnexe7(Map<String, Object> fd) {
        StringBuilder sb = new StringBuilder();
        sb.append(metaTable(fd, new String[][]{
                {"N&#176; dessin","numDessin","Famille / TAB","famille"},
                {"N&#176; BMW","numBMW","Auditeur","auditeur"},
        }));
        List<Map<String,Object>> rows = getRows(fd,"rows");
        if (rows.isEmpty()) { sb.append("<p style=\"color:#777;font-style:italic;\">Aucune donn&#233;e.</p>\n"); return sb.toString(); }
        sb.append("<div style=\"overflow:auto;\">\n");
        sb.append("<table style=\"font-size:7.5pt;min-width:800px;\">\n<thead><tr>");
        for (String h : new String[]{"Pos.","Adresse Branche","Mesure (mm)","Tol. -","Tol. +","Valeur mesur&#233;e","R&#233;sultat","Type bandage","R&#233;s. band.","Clip tie","R&#233;s. clip","Exigence"})
            sb.append(th(h,""));
        sb.append("</tr></thead>\n<tbody>\n");
        for (int i = 0; i < rows.size(); i++) {
            Map<String,Object> r = rows.get(i);
            if (isEmpty(str(r,"adresseBranche")) && isEmpty(str(r,"mesure"))) continue;
            String res = str(r,"resultat");
            boolean nok = "NOK".equalsIgnoreCase(res);
            String bg = nok?"background:#FFE0E0;":i%2==0?"":"background:#F4F4F4;";
            sb.append("<tr style=\"").append(bg).append("\">");
            sb.append(td(esc(str(r,"pos")),"text-align:center;font-weight:700;background:#EEEEEE;"));
            sb.append(td(esc(str(r,"adresseBranche")),null));
            sb.append(td(esc(str(r,"mesure")),"text-align:center;"));
            sb.append(td(esc(str(r,"toleranceNeg")),"text-align:center;"));
            sb.append(td(esc(str(r,"tolerancePos")),"text-align:center;"));
            sb.append(td(esc(str(r,"valeurMesuree")),"text-align:center;font-weight:700;"));
            sb.append(statutCell(res));
            sb.append(td(esc(str(r,"typeBandage")),null));
            sb.append(statutCell(str(r,"resultatBandage")));
            sb.append(td(esc(str(r,"clipTie")),null));
            sb.append(statutCell(str(r,"resultatClip")));
            sb.append(td(esc(str(r,"exigenceClient")),"font-size:7pt;"));
            sb.append("</tr>\n");
        }
        sb.append("</tbody>\n</table>\n</div>\n");
        return sb.toString();
    }

    private String renderAnnexe7A(Map<String, Object> fd) {
        StringBuilder sb = new StringBuilder();
        sb.append(metaTable(fd, new String[][]{{"Datum","datum","Projekt","projekt"},{"KSK Nr.","kskNr","TAB Nr.","tabNr"}}));
        List<Map<String,Object>> rows = getRows(fd,"rows");
        if (rows.isEmpty()) { sb.append("<p style=\"color:#777;font-style:italic;\">Aucune donn&#233;e.</p>\n"); return sb.toString(); }
        sb.append("<div style=\"overflow:auto;\">\n");
        sb.append("<table style=\"font-size:7pt;min-width:1000px;\">\n<thead><tr>");
        for (String h : new String[]{"Nr.","von MBP","VOBIS","XY","nach MBP","VOBIS","XY","Fzg.","L Soll","L Ist","IO","Diff","Abw.","Toler.","Bem."})
            sb.append(th(h,""));
        sb.append("</tr></thead>\n<tbody>\n");
        for (int i = 0; i < rows.size(); i++) {
            Map<String,Object> r = rows.get(i);
            if (isEmpty(str(r,"vonMBP")) && isEmpty(str(r,"lfdNr"))) continue;
            String io = str(r,"io");
            boolean nok = "niO".equals(io);
            String bg = nok?"background:#FFE0E0;":i%2==0?"":"background:#F4F4F4;";
            sb.append("<tr style=\"").append(bg).append("\">");
            sb.append(td(esc(str(r,"lfdNr")), "text-align:center;font-weight:700;background:#EEEEEE;"));
            for (String k : new String[]{"vonMBP","vonVOBIS","xy","nachMBP","nachVOBIS","xy2","fzgDerivate","lSoll","lIst"})
                sb.append(td(esc(str(r,k)), "text-align:center;"));
            sb.append(statutCell(io));
            for (String k : new String[]{"diff","abweichungen","tolerances","bemerkungen"})
                sb.append(td(esc(str(r,k)), "text-align:center;"));
            sb.append("</tr>\n");
        }
        sb.append("</tbody>\n</table>\n</div>\n");
        return sb.toString();
    }

    private String renderAnnexe8(Map<String, Object> fd) {
        StringBuilder sb = new StringBuilder();
        sb.append(metaTable(fd, new String[][]{{"N&#176; dessin","numDessin","Famille","famille"},{"N&#176; BMW","numBMW","Index","index"}}));
        List<Map<String,Object>> rows = getRows(fd,"rows");
        if (!rows.isEmpty()) {
            sb.append("<p style=\"font-weight:700;font-size:8.5pt;margin:6px 0 3px;\">Mesure section des fils</p>\n");
            sb.append("<table style=\"font-size:7.5pt;\">\n<thead><tr>");
            for (String h : new String[]{"Pos","Nr fil","Couleur","Section","Type","Nb Fibres","Section fibre","Formule","Section ISO","R&#233;sultat"})
                sb.append(th(h,""));
            sb.append("</tr></thead>\n<tbody>\n");
            for (int i = 0; i < rows.size(); i++) {
                Map<String,Object> r = rows.get(i);
                if (isEmpty(str(r,"nrFil"))) continue;
                String res = str(r,"resultat");
                boolean nok = "NOK".equalsIgnoreCase(res);
                String bg = nok?"background:#FFE0E0;":i%2==0?"":"background:#F4F4F4;";
                sb.append("<tr style=\"").append(bg).append("\">");
                sb.append(td(esc(str(r,"pos")), "text-align:center;font-weight:700;background:#EEEEEE;"));
                for (String k : new String[]{"nrFil","couleur","section","type","nbrFibres","sectionFibre","formule","sectionAvecIsolation"})
                    sb.append(td(esc(str(r,k)), null));
                sb.append(statutCell(res));
                sb.append("</tr>\n");
            }
            sb.append("</tbody>\n</table>\n");
        }
        List<Map<String,Object>> ussRows = getRows(fd,"ussRows");
        if (!ussRows.isEmpty()) {
            sb.append("<p style=\"font-weight:700;font-size:8.5pt;margin:8px 0 3px;\">Fils Torsad&#233;s</p>\n");
            sb.append("<table style=\"font-size:7.5pt;\">\n<thead><tr>");
            for (String h : new String[]{"Pos","Nr fil","Couleur","Section","Nb fils","Pas exig&#233;","Tol.","Pas mesur&#233;","Mesure C1","Mesure C2","R&#233;sultat"})
                sb.append(th(h,""));
            sb.append("</tr></thead>\n<tbody>\n");
            for (int i = 0; i < ussRows.size(); i++) {
                Map<String,Object> r = ussRows.get(i);
                if (isEmpty(str(r,"nrFil"))) continue;
                String res = str(r,"resultat");
                boolean nok = "NOK".equalsIgnoreCase(res);
                String bg = nok?"background:#FFE0E0;":i%2==0?"":"background:#F4F4F4;";
                sb.append("<tr style=\"").append(bg).append("\">");
                sb.append(td(esc(str(r,"pos")), "text-align:center;font-weight:700;background:#EEEEEE;"));
                for (String k : new String[]{"nrFil","couleur","section","nbrFils","pasTorsadage","tolerance","pasTorsadageMesure","mesureC1","mesureC2"})
                    sb.append(td(esc(str(r,k)), null));
                sb.append(statutCell(res));
                sb.append("</tr>\n");
            }
            sb.append("</tbody>\n</table>\n");
        }
        return sb.toString();
    }

    private String renderAnnexe10(Map<String, Object> fd) {
        StringBuilder sb = new StringBuilder();
        sb.append(metaTable(fd, new String[][]{{"TAB","tab","Var","var"},{"Index","index","Date dessin","dateDessin"}}));
        List<Map<String,Object>> rows = getRows(fd,"rows");
        if (rows.isEmpty()) { sb.append("<p style=\"color:#777;font-style:italic;\">Aucune donn&#233;e.</p>\n"); return sb.toString(); }
        sb.append("<div style=\"overflow:auto;\">\n");
        sb.append("<table style=\"font-size:7pt;min-width:900px;\">\n<thead><tr>");
        for (String h : new String[]{"Pos","Pin","Nr fil","Couleur","Section","Type","Nb fibres","Section fibre","Section ISO","Contact","CH","CBm","Joint","Force exig&#233;e","Force mesur&#233;e","R&#233;sultat"})
            sb.append(th(h,""));
        sb.append("</tr></thead>\n<tbody>\n");
        for (int i = 0; i < rows.size(); i++) {
            Map<String,Object> r = rows.get(i);
            if (isEmpty(str(r,"pin")) && isEmpty(str(r,"nrFil"))) continue;
            String res = str(r,"resultat");
            boolean nok = "NOK".equalsIgnoreCase(res);
            String bg = nok?"background:#FFE0E0;":i%2==0?"":"background:#F4F4F4;";
            sb.append("<tr style=\"").append(bg).append("\">");
            sb.append(td(esc(str(r,"position")),"text-align:center;font-weight:700;background:#EEEEEE;"));
            for (String k : new String[]{"pin","nrFil","couleur","section","type","nbrFibres","sectionFibre","sectionAvecIso","contact","ch","cbm","joint","forceTraction","forceMesuree"})
                sb.append(td(esc(str(r,k)),"text-align:center;"));
            sb.append(statutCell(res));
            sb.append("</tr>\n");
        }
        sb.append("</tbody>\n</table>\n</div>\n");
        return sb.toString();
    }

    private String renderAnnexeXXRows(Map<String,Object> fd, String type,
                                      String[] keys, String[] headers, String resKey) {
        StringBuilder sb = new StringBuilder();
        sb.append(metaTable(fd, new String[][]{{"TAB","tab","Var","var"},{"Index","index",null,null}}));
        List<Map<String,Object>> rows = getRows(fd,"rows");
        if (rows.isEmpty()) { sb.append("<p style=\"color:#777;font-style:italic;\">Aucune donn&#233;e.</p>\n"); return sb.toString(); }
        sb.append("<table style=\"font-size:7.5pt;\">\n<thead><tr>");
        for (String h : headers) sb.append(th(h,""));
        sb.append(th("R&#233;sultat","width:55px;text-align:center;"));
        sb.append("</tr></thead>\n<tbody>\n");
        for (int i = 0; i < rows.size(); i++) {
            Map<String,Object> r = rows.get(i);
            if (isEmpty(str(r,keys[0]))) continue;
            String res = str(r,resKey);
            boolean nok = "NOK".equalsIgnoreCase(res)||"niO".equals(res);
            String bg = nok?"background:#FFE0E0;":i%2==0?"":"background:#F4F4F4;";
            sb.append("<tr style=\"").append(bg).append("\">");
            for (String k : keys) sb.append(td(esc(str(r,k)), "text-align:center;"));
            sb.append(statutCell(res));
            sb.append("</tr>\n");
        }
        sb.append("</tbody>\n</table>\n");
        return sb.toString();
    }

    private String renderAnnexe13(Map<String, Object> fd, String type) {
        StringBuilder sb = new StringBuilder();
        sb.append(metaTable(fd, new String[][]{
                {"N&#176; article LEONI","numArticleLEONI","N&#176; article BMW","numArticleBMW"},
                {"Fournisseur","fournisseur","Index","index"},
                {"Date contr&#244;le","dateControle",null,null},
        }));
        sb.append("<p style=\"font-size:8pt;margin:4px 0;\">\n");
        sb.append(checkbox(Boolean.TRUE.equals(fd.get("auditPlanifie"))));
        sb.append(" Audit Destructif Planifi&#233; &nbsp;&nbsp; ");
        sb.append(checkbox(Boolean.TRUE.equals(fd.get("auditNonPlanifie"))));
        sb.append(" Non planifi&#233;</p>\n");
        Map<String,Object> checks = getMap(fd,"attributChecks");
        if (!checks.isEmpty()) {
            sb.append("<p style=\"font-weight:700;font-size:8.5pt;margin:8px 0 3px;\">Contr&#244;le attributif (IC 3040)</p>\n");
            sb.append("<table style=\"font-size:7.5pt;\">\n<thead><tr>");
            sb.append(th("Crit&#232;re",""));
            sb.append(th("Ok","width:50px;text-align:center;"));
            sb.append(th("NOK","width:50px;text-align:center;"));
            sb.append("</tr></thead>\n<tbody>\n");
            int i = 0;
            for (Map.Entry<String,Object> e : checks.entrySet()) {
                String val = Objects.toString(e.getValue(),"");
                boolean nok = "NOK".equalsIgnoreCase(val);
                boolean ok  = "Ok".equalsIgnoreCase(val);
                String bg = nok?"background:#FFE0E0;":i%2==0?"":"background:#F4F4F4;";
                sb.append("<tr style=\"").append(bg).append("\">");
                sb.append(td(esc(e.getKey()),null));
                sb.append("<td style=\"border:").append(BORDER).append(";text-align:center;").append(ok?"background:#E8F5E9;":"").append("\">").append(ok?"<b style=\"color:#059669;\">OK</b>":"&#8212;").append("</td>");
                sb.append("<td style=\"border:").append(BORDER).append(";text-align:center;").append(nok?"background:#FFE0E0;":"").append("\">").append(nok?"<b style=\"color:#CC0000;\">NOK</b>":"&#8212;").append("</td>");
                sb.append("</tr>\n"); i++;
            }
            String dec = str(fd,"decisionGlobale");
            sb.append("<tr style=\"background:#EEEEEE;\"><td style=\"border:").append(BORDER)
                    .append(";font-weight:900;padding:5px 8px;\">D&#233;cision globale</td><td colspan=\"2\" style=\"border:")
                    .append(BORDER).append(";text-align:center;font-weight:900;")
                    .append("NOK".equalsIgnoreCase(dec)?"background:#FFE0E0;color:#CC0000;":"background:#E8F5E9;color:#059669;")
                    .append("\">").append(isEmpty(dec)?"&#8212;":esc(dec)).append("</td></tr>\n");
            sb.append("</tbody>\n</table>\n");
        }
        List<Map<String,Object>> dimRows = getRows(fd,"dimRows");
        if (!dimRows.isEmpty()) {
            sb.append("<p style=\"font-weight:700;font-size:8.5pt;margin:8px 0 3px;\">Rapport Dimensionnel</p>\n");
            sb.append("<table style=\"font-size:7.5pt;\">\n<thead><tr>");
            for (String h : new String[]{"Nr.","Crit&#232;re","Sp&#233;cification","&#201;chantillon","D&#233;cision"})
                sb.append(th(h,""));
            sb.append("</tr></thead>\n<tbody>\n");
            for (int i = 0; i < dimRows.size(); i++) {
                Map<String,Object> r = dimRows.get(i);
                String dec = str(r,"decision");
                boolean nok = "NOK".equalsIgnoreCase(dec);
                String bg = nok?"background:#FFE0E0;":i%2==0?"":"background:#F4F4F4;";
                sb.append("<tr style=\"").append(bg).append("\">");
                sb.append(td(esc(str(r,"nr")), "text-align:center;font-weight:700;background:#EEEEEE;"));
                for (String k : new String[]{"critere","specification","echantillon"})
                    sb.append(td(esc(str(r,k)), null));
                sb.append(statutCell(dec));
                sb.append("</tr>\n");
            }
            sb.append("</tbody>\n</table>\n");
        }
        return sb.toString();
    }

    private String renderAnnexePSA(Map<String, Object> fd) {
        StringBuilder sb = new StringBuilder();
        sb.append(metaTable(fd, new String[][]{{"Fournisseur","fournisseur","D&#233;signation","designation"},{"N&#176; audit","numAudit","Index","index"}}));
        List<Map<String,Object>> colonnes = getRows(fd,"colonnes");
        if (colonnes.isEmpty()) { sb.append("<p style=\"color:#777;font-style:italic;\">Aucune donn&#233;e.</p>\n"); return sb.toString(); }
        sb.append("<div style=\"overflow:auto;\">\n");
        sb.append("<table style=\"font-size:7pt;min-width:900px;\">\n<thead><tr>");
        sb.append(th("N&#176;","width:25px;text-align:center;"));
        sb.append(th("Identification",""));
        sb.append(th("Type car.","width:80px;"));
        sb.append(th("Nominal","width:55px;text-align:center;"));
        sb.append(th("Borne+","width:45px;text-align:center;"));
        sb.append(th("Borne-","width:45px;text-align:center;"));
        sb.append(th("Jugement","width:80px;text-align:center;"));
        for (int j = 1; j <= 5; j++) sb.append(th("R."+j,"width:35px;text-align:center;"));
        sb.append(th("Accord","width:75px;"));
        sb.append(th("Commentaire",""));
        sb.append("</tr></thead>\n<tbody>\n");
        for (int i = 0; i < colonnes.size(); i++) {
            Map<String,Object> col = colonnes.get(i);
            if (isEmpty(str(col,"nom"))) continue;
            String jug = str(col,"jugement");
            boolean nok = "Non conforme".equalsIgnoreCase(jug);
            String bg = nok?"background:#FFE0E0;":i%2==0?"":"background:#F4F4F4;";
            sb.append("<tr style=\"").append(bg).append("\">");
            sb.append(td(String.valueOf(i+1), "text-align:center;font-weight:700;background:#EEEEEE;"));
            sb.append(td(esc(str(col,"nom")), null));
            sb.append(td(esc(str(col,"typCaracteristique")), null));
            sb.append(td(esc(str(col,"nominal")), "text-align:center;"));
            sb.append(td(esc(str(col,"borneSup")), "text-align:center;"));
            sb.append(td(esc(str(col,"borneInf")), "text-align:center;"));
            sb.append(statutCell(jug));
            List<Map<String,Object>> mesures = getRows(col,"mesures");
            for (int j = 0; j < 5; j++) {
                if (j < mesures.size()) {
                    Map<String,Object> m = mesures.get(j);
                    String val = str(m,"valeur");
                    boolean conf = !Boolean.FALSE.equals(m.get("conforme"));
                    sb.append("<td style=\"border:").append(BORDER).append(";text-align:center;font-size:7pt;").append(!conf?"background:#FFE0E0;color:#CC0000;":"").append("\">").append(isEmpty(val)?"&#8212;":esc(val)).append("</td>");
                } else {
                    sb.append(td("&#8212;","text-align:center;"));
                }
            }
            sb.append(td(esc(str(col,"accordConformite")), null));
            sb.append(td(esc(str(col,"commentaire")), null));
            sb.append("</tr>\n");
        }
        sb.append("</tbody>\n</table>\n</div>\n");
        return sb.toString();
    }

    private String renderAnnexeDPE(Map<String, Object> fd) {
        StringBuilder sb = new StringBuilder();
        sb.append(metaTable(fd, new String[][]{{"Fournisseur","fournisseur","D&#233;signation","designation"},{"N&#176; audit","numAudit","Index","index"}}));
        List<Map<String,Object>> rows = getRows(fd,"rows");
        if (rows.isEmpty()) { sb.append("<p style=\"color:#777;font-style:italic;\">Aucune donn&#233;e.</p>\n"); return sb.toString(); }
        sb.append("<div style=\"overflow:auto;\">\n");
        sb.append("<table style=\"font-size:7pt;min-width:900px;\">\n<thead><tr>");
        for (String h : new String[]{"N&#176;","Type car.","Identification","Classif.","Normal","Tol.+","Tol.-","Jugement","M.1","M.2","M.3","M.4","M.5","Id R&#233;s.","Accord","Commentaire"})
            sb.append(th(h,""));
        sb.append("</tr></thead>\n<tbody>\n");
        for (int i = 0; i < rows.size(); i++) {
            Map<String,Object> r = rows.get(i);
            if (isEmpty(str(r,"identification"))) continue;
            String jug = str(r,"jugement");
            boolean nok = "Non conforme".equalsIgnoreCase(jug)||"A Adapter".equalsIgnoreCase(jug);
            String bg = nok?"background:#FFE0E0;":i%2==0?"":"background:#F4F4F4;";
            sb.append("<tr style=\"").append(bg).append("\">");
            sb.append(td(String.valueOf(i+1), "text-align:center;font-weight:700;background:#EEEEEE;"));
            sb.append(td(esc(str(r,"typCaracteristique")), null));
            sb.append(td(esc(str(r,"identification")), null));
            sb.append(td(esc(str(r,"classif")), "text-align:center;"));
            sb.append(td(esc(str(r,"normal")), "text-align:center;"));
            sb.append(td(esc(str(r,"tol1")), "text-align:center;"));
            sb.append(td(esc(str(r,"tol2")), "text-align:center;"));
            sb.append(statutCell(jug));
            List<Object> mesures = getList(r,"mesures");
            for (int j = 0; j < 5; j++) {
                String v = j < mesures.size() ? Objects.toString(mesures.get(j),"") : "";
                sb.append(td(isEmpty(v)?"&#8212;":esc(v), "text-align:center;"));
            }
            sb.append(td(esc(str(r,"identificationResultat")), null));
            sb.append(td(esc(str(r,"accordConformite")), null));
            sb.append(td(esc(str(r,"commentaire")), null));
            sb.append("</tr>\n");
        }
        sb.append("</tbody>\n</table>\n</div>\n");
        return sb.toString();
    }

    private String renderAnnexeGenerique(Map<String, Object> fd) {
        StringBuilder sb = new StringBuilder();
        sb.append("<p style=\"font-style:italic;color:#555;font-size:8pt;margin-bottom:6px;\">Donn&#233;es du formulaire :</p>\n");
        sb.append("<table>\n<tbody>\n");
        int i = 0;
        for (Map.Entry<String,Object> e : fd.entrySet()) {
            if (e.getValue() == null || e.getValue().toString().isBlank()) continue;
            if (e.getValue() instanceof List || e.getValue() instanceof Map) continue;
            String bg = i%2==0?"":"background:#F4F4F4;";
            sb.append("<tr style=\"").append(bg).append("\">");
            sb.append(tdLabel(esc(e.getKey())));
            sb.append("<td style=\"border:").append(BORDER).append(";font-size:9pt;padding:4px 8px;\">").append(esc(Objects.toString(e.getValue()))).append("</td>");
            sb.append("</tr>\n"); i++;
        }
        sb.append("</tbody>\n</table>\n");
        return sb.toString();
    }

    // ════════════════════════════════════════════════════════════════
    //  SECTION 3 — NON-CONFORMITÉS
    // ════════════════════════════════════════════════════════════════

    private String buildSectionNonConformites(List<AuditProduitAnnexe> annexes, CouleurQK c) {
        StringBuilder sb = new StringBuilder();
        List<String[]> nonConformes = new ArrayList<>();
        for (AuditProduitAnnexe ann : annexes) {
            if (ann.getFormDataJson() == null) continue;
            Map<String,Object> fd = readJson(ann.getFormDataJson());
            if (fd != null) extractNokDetails(ann.getTypeAnnexe(), fd, nonConformes);
        }

        if (nonConformes.isEmpty()) {
            sb.append("<div style=\"border:2px solid #059669;background:#E8F5E9;padding:20px;text-align:center;\">\n");
            sb.append("<p style=\"font-size:18pt;margin:0;color:#059669;\">OK</p>\n");
            sb.append("<p style=\"font-weight:800;font-size:13pt;margin:6px 0 0;color:#059669;\">Aucune non-conformit&#233; d&#233;tect&#233;e</p>\n");
            sb.append("<p style=\"color:#555;font-size:9pt;margin:4px 0 0;\">Toutes les mesures et contr&#244;les sont conformes.</p>\n");
            sb.append("</div>\n");
            return sb.toString();
        }

        sb.append("<div style=\"border:2px solid #CC0000;background:#FFE0E0;padding:10px 14px;margin-bottom:12px;\">\n");
        sb.append("<p style=\"font-weight:900;font-size:11pt;margin:0;color:#CC0000;\">ATTENTION : ")
                .append(nonConformes.size()).append(" non-conformit&#233;(s) d&#233;tect&#233;e(s)</p>\n</div>\n");

        sb.append("<table>\n<thead><tr>");
        sb.append(th("#","width:30px;text-align:center;"));
        sb.append(th("Annexe","width:70px;text-align:center;"));
        sb.append(th("Description de la non-conformit&#233;",""));
        sb.append("</tr></thead>\n<tbody>\n");
        for (int i = 0; i < nonConformes.size(); i++) {
            String[] nc = nonConformes.get(i);
            String bg = i%2==0?"background:#FFF8F8;":"background:#FFE0E0;";
            sb.append("<tr style=\"").append(bg).append("\">");
            sb.append(td("<b style=\"color:#CC0000;\">"+(i+1)+"</b>","text-align:center;"));
            sb.append(td("<b>"+esc(nc[0])+"</b>","text-align:center;"));
            sb.append(td(esc(nc[1]),null));
            sb.append("</tr>\n");
        }
        sb.append("</tbody>\n</table>\n");
        return sb.toString();
    }

    @SuppressWarnings("unchecked")
    private void extractNokDetails(String type, Map<String,Object> fd, List<String[]> out) {
        if ("1B".equals(type)) {
            List<Map<String,Object>> defauts = getRows(fd,"defauts");
            for (Map<String,Object> d : defauts) {
                String desc = str(d,"description");
                if (!isEmpty(desc)) out.add(new String[]{type, desc});
            }
            return;
        }
        if ("4".equals(type)) {
            List<Map<String,Object>> etapes = getRows(fd,"rows");
            if (etapes.isEmpty()) etapes = getRows(fd,"etapes");
            for (Map<String,Object> e : etapes) {
                String res = str(e,"res");
                if (isEmpty(res)) res = str(e,"resultat");
                if ("N.I.O".equalsIgnoreCase(res))
                    out.add(new String[]{type,"Non en ordre : "+str(e,"etape")});
            }
            return;
        }
        if ("5".equals(type)) {
            Map<String,Object> q = getMap(fd,"questions");
            q.forEach((k,v)->{ if("Non".equalsIgnoreCase(Objects.toString(v,""))) out.add(new String[]{type,"Question "+k+" : Non"}); });
            return;
        }
        List<Map<String,Object>> rows = getRows(fd,"rows");
        for (Map<String,Object> r : rows) {
            String res = str(r,"resultat"); String dec = str(r,"decision"); String io = str(r,"io");
            if ("NOK".equalsIgnoreCase(res)||"NOK".equalsIgnoreCase(dec)||"niO".equals(io)) {
                String pos = str(r,"adresseBranche"); if(isEmpty(pos)) pos=str(r,"adresse");
                if(isEmpty(pos)) pos=str(r,"position"); if(isEmpty(pos)) pos=str(r,"pos");
                if(isEmpty(pos)) pos=str(r,"lfdNr");
                out.add(new String[]{type,"Non-conforme — "+pos});
            }
        }
        Map<String,Object> checks = getMap(fd,"attributChecks");
        checks.forEach((k,v)->{ if("NOK".equalsIgnoreCase(Objects.toString(v,""))) out.add(new String[]{type,k+" : NOK"}); });
        List<Map<String,Object>> colonnes = getRows(fd,"colonnes");
        for (Map<String,Object> col : colonnes)
            if("Non conforme".equalsIgnoreCase(str(col,"jugement")))
                out.add(new String[]{type,"Non conforme — "+str(col,"nom")});
    }

    // ════════════════════════════════════════════════════════════════
    //  SECTION 4 — ACTIONS CORRECTIVES (formulaires standard)
    // ════════════════════════════════════════════════════════════════

    private String buildSectionActions(AuditProduit audit, FicheReparation fiche,
                                       PlanAction pdca, String qkVal, double qkNum, CouleurQK c) {
        StringBuilder sb = new StringBuilder();
        String qkBd = c == CouleurQK.VERT ? "#059669" : c == CouleurQK.ORANGE ? "#D97706"
                : c == CouleurQK.ROSE ? "#9D174D" : "#DC2626";
        String qkBg = c == CouleurQK.VERT ? "#E8F5E9" : c == CouleurQK.ORANGE ? "#FFF8E1"
                : c == CouleurQK.ROSE ? "#FDF2F8" : "#FEF2F2";

        sb.append("<div style=\"border:2px solid ").append(qkBd).append(";background:").append(qkBg)
                .append(";padding:12px 16px;margin-bottom:14px;\">\n");
        sb.append("<p style=\"font-size:12pt;font-weight:900;margin:0;color:").append(qkBd).append(";\">")
                .append(esc(qkLabel(c))).append(" &#8212; QK = ").append(qkVal).append("</p>\n");
        sb.append("<p style=\"color:#555;font-size:9pt;margin:3px 0 0;\">").append(esc(qkActionsLabel(c))).append("</p>\n</div>\n");

        if (c == CouleurQK.VERT) {
            sb.append("<div style=\"border:2px solid #059669;background:#E8F5E9;padding:18px;text-align:center;\">\n");
            sb.append("<p style=\"font-weight:800;font-size:13pt;margin:6px 0 0;color:#059669;\">Produit Conforme &#8212; Aucune Action Requise</p>\n");
            sb.append("</div>\n");
            return sb.toString();
        }

        sb.append("<h3 style=\"font-size:10pt;font-weight:900;margin:0 0 8px;padding:7px 10px;background:#EEEEEE;border:1px solid #000;\">Fiche de R&#233;paration</h3>\n");
        if (fiche != null) {
            sb.append("<table style=\"margin-bottom:14px;\">\n<tbody>\n");
            sb.append(tr2e("Zone affect&#233;e", esc(fiche.getZoneAffectee())));
            sb.append(tr2e("Origine NC", esc(fiche.getOrigineNC())));
            sb.append(tr2e("Code article", esc(fiche.getCodeArticle())));
            sb.append(tr2e("Description NC", esc(fiche.getDescriptionNC())));
            if (fiche.getRemarquesOptionnelles()!=null&&!fiche.getRemarquesOptionnelles().isBlank())
                sb.append(tr2e("Remarques", esc(fiche.getRemarquesOptionnelles())));
            sb.append(tr2e("Statut", Boolean.TRUE.equals(fiche.getValide())
                    ?"Valid&#233;e" : (fiche.getStatut()!=null?esc(fiche.getStatut().name()):"En attente")));
            sb.append("</tbody>\n</table>\n");
        } else {
            sb.append("<div style=\"border:1px solid #000;background:#F9F9F9;padding:10px 14px;margin-bottom:12px;\">\n");
            sb.append("<p style=\"font-size:9pt;margin:0;\">Fiche de r&#233;paration requise &#8212; non encore cr&#233;&#233;e.</p>\n</div>\n");
        }

        if (c == CouleurQK.ROSE || c == CouleurQK.ROUGE) {
            sb.append("<h3 style=\"font-size:10pt;font-weight:900;margin:12px 0 8px;padding:7px 10px;background:#EEEEEE;border:1px solid #000;\">Plan d'Action PDCA</h3>\n");
            if (pdca != null) {
                String[][] pdcaItems = {
                        {"P &#8212; Plan (Planifier)", pdca.getPlanifier()},
                        {"D &#8212; Do (R&#233;aliser)", pdca.getDo_()},
                        {"C &#8212; Check (V&#233;rifier)", pdca.getCheck()},
                        {"A &#8212; Act (Standardiser)", pdca.getAct()},
                };
                sb.append("<table style=\"border-collapse:separate;border-spacing:4px;\">\n<tbody>\n<tr>\n");
                for (String[] item : pdcaItems) {
                    sb.append("<td style=\"border:1px solid #000;background:#F4F4F4;padding:10px 12px;vertical-align:top;width:25%;\">\n");
                    sb.append("<p style=\"font-size:8pt;font-weight:900;margin:0 0 4px;\">").append(item[0]).append("</p>\n");
                    sb.append("<p style=\"font-size:9pt;margin:0;min-height:40px;\">")
                            .append(isEmpty(item[1])?"<span style=\"color:#999;font-style:italic;\">A compl&#233;ter</span>":esc(item[1]))
                            .append("</p>\n</td>\n");
                }
                sb.append("</tr>\n");
                if (pdca.getDateEcheance()!=null) {
                    sb.append("<tr><td colspan=\"4\" style=\"border:none;font-size:8.5pt;\"><b>Ech&#233;ance :</b> ").append(pdca.getDateEcheance()).append("</td></tr>\n");
                }
                sb.append("</tbody>\n</table>\n");
            } else {
                sb.append("<div style=\"border:1px solid #000;background:#F9F9F9;padding:10px 14px;\">\n");
                sb.append("<p style=\"font-size:9pt;margin:0;\">PDCA requis &#8212; non encore cr&#233;&#233;.</p>\n</div>\n");
            }
        }
        return sb.toString();
    }

    // ════════════════════════════════════════════════════════════════
    //  SECTION 5 — CALCUL QK
    // ════════════════════════════════════════════════════════════════

    private String buildSectionQK(List<AuditProduitAnnexe> annexes, String qkVal, double qkNum, CouleurQK c) {
        StringBuilder sb = new StringBuilder();
        sb.append("<div style=\"border:1px solid #000;background:#F4F4F4;padding:12px 16px;margin-bottom:12px;\">\n");
        sb.append("<p style=\"font-weight:800;font-size:10pt;margin:0 0 8px;\">Formule PI3010 :</p>\n");
        sb.append("<p style=\"font-size:9pt;margin:2px 0;\"><b>1.</b> Total Points = Somme (Frequence x Points par defaut)</p>\n");
        sb.append("<p style=\"font-size:9pt;margin:2px 0;\"><b>2.</b> Rating Factor f(n) = Facteur selon nombre de composants</p>\n");
        sb.append("<p style=\"font-size:9pt;margin:2px 0;\"><b>3.</b> Weighted Points = Total Points x Rating Factor</p>\n");
        sb.append("<p style=\"font-size:9pt;margin:2px 0;\"><b>4.</b> QK = Table PI3010 (WP) -> valeur tabulee</p>\n");
        sb.append("<p style=\"font-size:9pt;margin:6px 0 0;font-weight:800;\">Seuil : QK = 0 (Conforme) / QK &gt; 0 (Non-Conforme)</p>\n");
        sb.append("</div>\n");

        sb.append("<p style=\"font-weight:700;font-size:9pt;margin:0 0 4px;\">Table Rating Factor :</p>\n");
        sb.append("<table style=\"font-size:8pt;width:auto;margin-bottom:12px;\">\n<thead><tr>");
        for (String h : new String[]{"n &lt; 50","50-100","101-200","201-400","401-800","801-1600","1601-2600","2601-4700","&gt; 4700"})
            sb.append(th(h,""));
        sb.append("</tr></thead>\n<tbody><tr>");
        for (String f : new String[]{"4.0","2.0","1.0","0.9","0.8","0.7","0.6","0.5","0.4"})
            sb.append(td("<b>"+f+"</b>","text-align:center;"));
        sb.append("</tr></tbody>\n</table>\n");

        AuditProduitAnnexe ann1B = annexes.stream()
                .filter(a->"1B".equals(a.getTypeAnnexe())&&a.getFormDataJson()!=null)
                .findFirst().orElse(null);
        if (ann1B != null) {
            Map<String,Object> fd = readJson(ann1B.getFormDataJson());
            if (fd != null) {
                double tp = parseDouble(fd.get("totalPoints"), 0);
                double rf = parseDouble(fd.get("ratingFactor"), 0);
                double wp = parseDouble(fd.get("weightedPoints"), tp*rf);
                int nbComp = (int) parseDouble(fd.get("nbComposants"), 0);
                List<Map<String,Object>> defauts = getRows(fd,"defauts");

                if (!defauts.isEmpty()) {
                    sb.append("<p style=\"font-weight:700;font-size:9pt;margin:0 0 4px;\">Detail des defauts (Annexe 1B) :</p>\n");
                    sb.append("<table style=\"font-size:8pt;\">\n<thead><tr>");
                    for (String h : new String[]{"#","Code","Type","Description","Freq.","Pts/def.","Total pts"})
                        sb.append(th(h,""));
                    sb.append("</tr></thead>\n<tbody>\n");
                    double grand = 0;
                    for (int i = 0; i < defauts.size(); i++) {
                        Map<String,Object> d = defauts.get(i);
                        double tot = parseDouble(d.get("totalDefectPoints"),
                                parseDouble(d.get("freq"),1)*parseDouble(d.get("pointsDefect"),25));
                        grand += tot;
                        boolean nok = tot > 0;
                        String bg = nok?"background:#FFE0E0;":i%2==0?"":"background:#F4F4F4;";
                        sb.append("<tr style=\"").append(bg).append("\">");
                        sb.append(td(String.valueOf(i+1),"text-align:center;"));
                        sb.append(td("<b>"+esc(str(d,"code"))+"</b>","text-align:center;"));
                        sb.append(td(esc(str(d,"type")),"text-align:center;"));
                        sb.append(td(esc(str(d,"description")),null));
                        sb.append(td(esc(str(d,"freq")),"text-align:center;"));
                        sb.append(td(esc(str(d,"pointsDefect")),"text-align:center;"));
                        sb.append("<td style=\"border:").append(BORDER).append(";text-align:center;font-weight:900;")
                                .append(nok?"background:#FFE0E0;color:#CC0000;":"background:#E8F5E9;color:#059669;").append("\">")
                                .append(String.format("%.0f",tot)).append("</td>");
                        sb.append("</tr>\n");
                    }
                    sb.append("<tr style=\"background:#EEEEEE;\"><td colspan=\"6\" style=\"border:").append(BORDER)
                            .append(";text-align:right;font-weight:900;padding:5px;\">Total Points :</td>");
                    sb.append("<td style=\"border:").append(BORDER).append(";text-align:center;font-weight:900;\">")
                            .append(String.format("%.0f",grand)).append("</td></tr>\n");
                    sb.append("</tbody>\n</table>\n");
                }

                sb.append("<div style=\"border:1px solid #000;background:#EEEEEE;padding:10px 14px;margin-top:10px;\">\n");
                sb.append("<table style=\"border:none;\">\n<tbody>\n");
                String[][] recap = {
                        {"Nb composants (n)", String.valueOf(nbComp)},
                        {"Total Points", String.format("%.2f",tp)},
                        {"Rating Factor f("+nbComp+")", String.format("%.1f",rf)},
                        {"Weighted Points (WP)", String.format("%.2f",wp)},
                };
                for (String[] row : recap) {
                    sb.append("<tr><td style=\"border:none;font-weight:700;width:220px;font-size:9pt;\">").append(row[0])
                            .append(" :</td><td style=\"border:none;font-weight:900;font-size:11pt;\">").append(row[1])
                            .append("</td></tr>\n");
                }
                sb.append("</tbody>\n</table>\n</div>\n");
            }
        }

        // ✓ Résultat QK final avec label corrigé
        String qkBd = c == CouleurQK.VERT ? "#059669" : c == CouleurQK.ORANGE ? "#D97706"
                : c == CouleurQK.ROSE ? "#9D174D" : "#DC2626";
        sb.append("<div style=\"border:2px solid ").append(qkBd)
                .append(";background:#F4F4F4;padding:14px 18px;margin-top:14px;text-align:center;\">\n");
        sb.append("<p style=\"font-size:8pt;font-weight:700;text-transform:uppercase;letter-spacing:1px;margin:0 0 4px;\">Valeur QK Finale</p>\n");
        sb.append("<p style=\"font-size:32pt;font-weight:900;margin:0;line-height:1;color:").append(qkBd).append(";\">").append(qkVal).append("</p>\n");
        sb.append("<p style=\"font-size:10pt;font-weight:700;margin:4px 0 0;color:").append(qkBd).append(";\">").append(esc(qkLabel(c))).append("</p>\n");
        sb.append("<p style=\"font-size:9pt;color:#555;margin:4px 0 0;\">").append(esc(qkActionsLabel(c))).append("</p>\n</div>\n");
        return sb.toString();
    }

    // ════════════════════════════════════════════════════════════════
    //  SECTION 6 — SIGNATURES
    // ════════════════════════════════════════════════════════════════

    private String buildSectionSignatures(AuditProduit audit, String now) {
        StringBuilder sb = new StringBuilder();
        sb.append("<table style=\"margin-bottom:16px;\">\n<thead><tr>");
        sb.append(th("R&#244;le","")).append(th("Nom &#38; Pr&#233;nom","width:180px;")).append(th("Date","width:100px;")).append(th("Signature","width:160px;"));
        sb.append("</tr></thead>\n<tbody>\n");
        String[][] sigs = {
                {"Auditeur Produit", audit.getAuditeur()!=null?esc(audit.getAuditeur().getPrenom()+" "+audit.getAuditeur().getNom()):""},
                {"Responsable Qualit&#233; Plant",""},
                {"Responsable Qualit&#233; Centrale",""},
                {"Approbateur",""},
        };
        for (int i = 0; i < sigs.length; i++) {
            String bg = i%2==0?"":"background:#F4F4F4;";
            sb.append("<tr style=\"").append(bg).append("\">");
            sb.append(td("<b>"+sigs[i][0]+"</b>",null));
            sb.append(td(sigs[i][1],null));
            sb.append(td("","background:#F9F9F9;height:46px;"));
            sb.append(td("","background:#F9F9F9;"));
            sb.append("</tr>\n");
        }
        sb.append("</tbody>\n</table>\n");
        sb.append("<div style=\"border:1px solid #000;background:#F4F4F4;padding:12px 16px;\">\n");
        sb.append("<p style=\"font-weight:800;margin:0 0 4px;\">Document Confidentiel LEONI</p>\n");
        sb.append("<p style=\"font-size:9pt;color:#555;margin:0;\">G&#233;n&#233;r&#233; automatiquement par la plateforme PAP LEONI.<br/>");
        sb.append("R&#233;f&#233;rence normative : IT TN 3625 / PI3010 &#8212; Mise &#224; jour : 09/2025<br/>");
        sb.append("Date de g&#233;n&#233;ration : ").append(now).append("</p>\n</div>\n");
        return sb.toString();
    }

    // ════════════════════════════════════════════════════════════════
    //  BUILDERS POUR RAPPORT IMPORTÉ (page de garde, fiche, PDCA séparés)
    // ════════════════════════════════════════════════════════════════

    /**
     * Génère uniquement la page de garde (page 1) pour le mode rapport importé.
     * Structure identique à buildHtmlComplet page 1 + page résumé minimaliste.
     */
    private String buildHtmlPageGardeSeule(AuditProduit audit, List<AuditProduitAnnexe> annexes) {
        double    qkNum    = audit.getValeurQK() != null ? audit.getValeurQK() : 0.0;
        String    qkVal    = String.format(Locale.FRENCH, "%.2f", qkNum);
        CouleurQK c        = audit.getCouleurQK();
        String    now      = LocalDateTime.now().format(FMT_DT);
        String    dateAudit = audit.getDatePrevue() != null ? audit.getDatePrevue().format(FMT_DATE) : "\u2014";
        List<AuditProduitAnnexe> annexesRemplies = annexes.stream()
                .filter(a -> Boolean.TRUE.equals(a.getFormValide()) || Boolean.TRUE.equals(a.getImporte()))
                .collect(Collectors.toList());
        StringBuilder sb = new StringBuilder();
        sb.append(htmlHead(audit.getReference()));
        sb.append("<div class=\"page\">\n");
        sb.append(buildPageGardePro(audit, qkVal, qkNum, c, now, dateAudit, annexes, annexesRemplies));
        sb.append(pageFooter("Document confidentiel LEONI \u2014 IT TN 3625 / PI3010 \u2014 " + now, "Page 1"));
        sb.append("</div>\n");
        sb.append("</body>\n</html>");
        return sb.toString();
    }

    /**
     * Génère un PDF d'une page contenant uniquement la fiche de réparation.
     */
    private String buildHtmlFicheSeule(AuditProduit audit, FicheReparation fiche,
                                       double qkNum, CouleurQK c) {
        String qkVal = String.format(Locale.FRENCH, "%.2f", qkNum);
        String now   = LocalDateTime.now().format(FMT_DT);
        StringBuilder sb = new StringBuilder();
        sb.append(htmlHead(audit.getReference()));
        sb.append("<div class=\"page\">\n");
        sb.append(annexePageHeader("ACTIONS CORRECTIVES", "Fiche de R\u00e9paration", "IT TN 3625"));
        sb.append(buildSectionActions(audit, fiche, null, qkVal, qkNum, c));
        sb.append(pageFooter("IT TN 3625 \u2014 Fiche de R\u00e9paration \u2014 " + now, "Annexe"));
        sb.append("</div>\n");
        sb.append("</body>\n</html>");
        return sb.toString();
    }

    /**
     * Génère un PDF d'une page contenant uniquement le PDCA.
     */
    private String buildHtmlPdcaSeul(AuditProduit audit, PlanAction pdca,
                                     double qkNum, CouleurQK c) {
        String qkVal = String.format(Locale.FRENCH, "%.2f", qkNum);
        String now   = LocalDateTime.now().format(FMT_DT);
        StringBuilder sb = new StringBuilder();
        sb.append(htmlHead(audit.getReference()));
        sb.append("<div class=\"page\">\n");
        sb.append(annexePageHeader("ACTIONS CORRECTIVES", "Plan d'Action Corrective (PDCA)", "IT TN 3625"));
        sb.append(buildSectionActions(audit, null, pdca, qkVal, qkNum, c));
        sb.append(pageFooter("IT TN 3625 \u2014 PDCA \u2014 " + now, "Annexe"));
        sb.append("</div>\n");
        sb.append("</body>\n</html>");
        return sb.toString();
    }

    // ════════════════════════════════════════════════════════════════
    //  HTML COMPLÉMENT
    // ════════════════════════════════════════════════════════════════

    private String buildHtmlComplement(AuditProduit audit, FicheReparation fiche,
                                       PlanAction pdca, double qkNum, CouleurQK couleur) {
        String qkVal = String.format(Locale.FRENCH, "%.2f", qkNum);
        String now   = LocalDateTime.now().format(FMT_DT);
        return htmlHead(audit.getReference())
                + "<div class=\"page\">\n"
                + "<p style=\"font-size:16pt;font-weight:900;margin:0 0 4px;\">Annexe au Rapport &#8212; Actions Correctives</p>\n"
                + "<p style=\"font-size:8pt;color:#555;margin:0 0 12px;\">IT TN 3625 &#8212; Compl&#233;ment rapport import&#233;</p>\n"
                + "<div style=\"border-top:2px solid #000;margin-bottom:14px;\"></div>\n"
                + buildSectionActions(audit, fiche, pdca, qkVal, qkNum, couleur)
                + pageFooter("IT TN 3625 &#8212; Compl&#233;ment &#8212; " + now, "Annexe 1")
                + "</div>\n</body>\n</html>";
    }

    // ════════════════════════════════════════════════════════════════
    //  HTML → PDF
    // ════════════════════════════════════════════════════════════════

    private void htmlToPdf(String html, String outputPath) throws Exception {
        try (OutputStream os = new FileOutputStream(outputPath)) {
            PdfRendererBuilder builder = new PdfRendererBuilder();
            builder.withHtmlContent(html, null);
            builder.toStream(os);
            builder.useFastMode();
            builder.withProducer("LEONI PAP Qualite v3");
            builder.run();
        }
    }

    public byte[] getPdfBytes(Long auditId) throws IOException {
        AuditProduit audit = auditRepo.findById(auditId)
                .orElseThrow(() -> new BusinessException("Audit introuvable : " + auditId));
        if (audit.getRapportGenerePdfUrl() == null)
            throw new BusinessException("Aucun rapport généré pour cet audit.");
        Path path = Paths.get(audit.getRapportGenerePdfUrl());
        if (!Files.exists(path))
            throw new BusinessException("Fichier rapport introuvable : " + path);
        return Files.readAllBytes(path);
    }

    // ════════════════════════════════════════════════════════════════
    //  FRAGMENTS HTML
    // ════════════════════════════════════════════════════════════════

    private String htmlHead(String ref) {
        return "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n"
                + "<!DOCTYPE html PUBLIC \"-//W3C//DTD XHTML 1.0 Strict//EN\"\n"
                + "  \"http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd\">\n"
                + "<html xmlns=\"http://www.w3.org/1999/xhtml\" lang=\"fr\">\n"
                + "<head>\n"
                + "<meta http-equiv=\"Content-Type\" content=\"text/html; charset=UTF-8\" />\n"
                + "<title>Rapport Audit " + esc(ref) + "</title>\n"
                + "<style type=\"text/css\">\n" + buildCss() + "\n</style>\n"
                + "</head>\n<body>\n";
    }

    private String buildCss() {
        return "@page { size: A4; margin: 12mm 10mm; }\n"
                + "* { box-sizing: border-box; }\n"
                + "body { font-family: Arial, Helvetica, sans-serif; font-size: 10pt; color: #000; background: #fff; line-height: 1.35; }\n"
                + ".page { width: 100%; position: relative; min-height: 240mm; padding-bottom: 22mm; }\n"
                + ".pb  { page-break-before: always; padding-top: 5mm; }\n"
                + "table { width: 100%; border-collapse: collapse; margin-bottom: 6px; }\n"
                + "th { background: #EEEEEE; color: #000; padding: 5px 6px; text-align: left;"
                + " font-size: 8.5pt; font-weight: 700; border: 1px solid #000; }\n"
                + "td { padding: 4px 6px; border-bottom: 1px solid #CCCCCC; font-size: 9pt; }\n"
                + ".page-footer { position: absolute; bottom: 0; left: 0; right: 0;"
                + " border-top: 1px solid #000; padding-top: 3px; overflow: hidden; }\n"
                + ".page-footer-left { float: left; font-size: 7pt; color: #555; }\n"
                + ".page-footer-right { float: right; font-size: 7pt; color: #000; font-weight: 700; }\n";
    }

    private String pageFooter(String left, String right) {
        return "<div class=\"page-footer\">\n"
                + "<span class=\"page-footer-left\">" + left + "</span>\n"
                + "<span class=\"page-footer-right\">" + right + "</span>\n"
                + "</div>\n";
    }

    private String tr2e(String label, String value) {
        return "<tr><td style=\"font-weight:700;color:#333;width:44%;border:1px solid #CCCCCC;padding:4px 8px;\">" + label + "</td>"
                + "<td style=\"border:1px solid #CCCCCC;padding:4px 8px;\">" + (isEmpty(value)?"&#8212;":value) + "</td></tr>\n";
    }

    private String tdLabel(String t) {
        return "<td style=\"font-weight:700;color:#333;font-size:8pt;background:#F4F4F4;padding:5px 8px;border:1px solid #CCCCCC;\">" + t + "</td>\n";
    }

    private String tdVal(String v) {
        return "<td style=\"padding:5px 8px;border:1px solid #CCCCCC;\">" + v + "</td>\n";
    }

    // ════════════════════════════════════════════════════════════════
    //  ✓ HELPERS QK — CORRIGÉS
    //  QK = 0 → "Produit Conforme"
    //  QK > 0 (toute valeur) → "Non-Conforme"
    // ════════════════════════════════════════════════════════════════

    /**
     * Label principal QK corrigé :
     * VERT (QK=0)   → "Produit Conforme"
     * Tout autre    → "Non-Conforme"
     */
    private String qkLabel(CouleurQK c) {
        if (c == null) return "&#8212;";
        return switch (c) {
            case VERT   -> "Produit Conforme";
            case ORANGE -> "Non-Conforme (Orange)";
            case ROSE   -> "Non-Conforme (Rose)";
            case ROUGE  -> "Non-Conforme (Rouge)";
        };
    }

    /**
     * Sous-label contextuel avec fourchette QK.
     */
    private String qkSousLabel(CouleurQK c, double qkNum) {
        if (c == null) return "&#8212;";
        return switch (c) {
            case VERT   -> "QK = 0 &#8212; Aucune non-conformit&#233; d&#233;tect&#233;e.";
            case ORANGE -> "0 &lt; QK &le; 0,5 &#8212; Non-conformit&#233; d&#233;tect&#233;e.";
            case ROSE   -> "0,5 &lt; QK &le; 1 &#8212; Non-conformit&#233; d&#233;tect&#233;e.";
            case ROUGE  -> "QK &gt; 1 &#8212; Non-conformit&#233; critique.";
        };
    }

    private String qkSousLabelTexte(CouleurQK c, double qkNum) {
        if (c == null) return "—";
        return switch (c) {
            case VERT   -> "QK = 0 — Aucune non-conformité détectée.";
            case ORANGE -> "0 < QK ≤ 0,5 — Non-conformité détectée.";
            case ROSE   -> "0,5 < QK ≤ 1 — Non-conformité détectée.";
            case ROUGE  -> "QK > 1 — Non-conformité critique.";
        };
    }

    /**
     * Label actions correctives avec fourchette QK.
     */
    private String qkActionsLabel(CouleurQK c) {
        if (c == null) return "&#8212;";
        return switch (c) {
            case VERT   -> "QK = 0 &#8212; Aucune action requise";
            case ORANGE -> "0 &lt; QK &le; 0,5 &#8212; Fiche de r&#233;paration requise";
            case ROSE   -> "0,5 &lt; QK &le; 1 &#8212; Fiche de r&#233;paration + PDCA requis";
            case ROUGE  -> "QK &gt; 1 &#8212; Fiche + PDCA + Action imm&#233;diate";
        };
    }

    // ════════════════════════════════════════════════════════════════
    //  HELPERS JSON / DONNÉES
    // ════════════════════════════════════════════════════════════════

    private Map<String,Object> readJson(String json) {
        if (json == null || json.isBlank()) return null;
        try { return objectMapper.readValue(json, new TypeReference<Map<String,Object>>(){}); }
        catch (Exception e) { return null; }
    }

    @SuppressWarnings("unchecked")
    private List<Map<String,Object>> getRows(Map<String,Object> fd, String key) {
        if (fd == null) return Collections.emptyList();
        Object val = fd.get(key);
        if (!(val instanceof List)) return Collections.emptyList();
        return ((List<?>)val).stream()
                .filter(i -> i instanceof Map)
                .map(i -> (Map<String,Object>)i)
                .collect(Collectors.toList());
    }

    @SuppressWarnings("unchecked")
    private List<Object> getList(Map<String,Object> fd, String key) {
        if (fd == null) return Collections.emptyList();
        Object val = fd.get(key);
        if (!(val instanceof List)) return Collections.emptyList();
        return (List<Object>)val;
    }

    @SuppressWarnings("unchecked")
    private Map<String,Object> getMap(Map<String,Object> fd, String key) {
        if (fd == null) return Collections.emptyMap();
        Object val = fd.get(key);
        if (!(val instanceof Map)) return Collections.emptyMap();
        return (Map<String,Object>)val;
    }

    private String str(Map<?,?> m, String key) {
        if (m == null) return "";
        Object v = m.get(key);
        return v == null ? "" : Objects.toString(v);
    }

    private boolean isEmpty(String s) { return s==null||s.isBlank()||s.equals("null"); }

    private double parseDouble(Object obj, double def) {
        if (obj == null) return def;
        try { return Double.parseDouble(Objects.toString(obj)); } catch (Exception e) { return def; }
    }

    private int compterDefauts(List<AuditProduitAnnexe> annexes) {
        return annexes.stream()
                .filter(a -> "1B".equals(a.getTypeAnnexe()) && a.getFormDataJson()!=null)
                .mapToInt(a -> { Map<String,Object> fd = readJson(a.getFormDataJson()); return fd==null?0:getRows(fd,"defauts").size(); })
                .sum();
    }

    private int compterNok(List<AuditProduitAnnexe> annexes) {
        List<String[]> list = new ArrayList<>();
        for (AuditProduitAnnexe a : annexes) {
            if (a.getFormDataJson()!=null) {
                Map<String,Object> fd = readJson(a.getFormDataJson());
                if (fd!=null) extractNokDetails(a.getTypeAnnexe(), fd, list);
            }
        }
        return list.size();
    }

    private String esc(String s) {
        if (s==null||s.isBlank()) return "&#8212;";
        return s.replace("&","&amp;").replace("<","&lt;").replace(">","&gt;")
                .replace("\"","&quot;").replace("'","&#39;");
    }

    private String sanitize(String s) {
        if (s==null||s.isBlank()) return "audit";
        return s.trim().replaceAll("[^a-zA-Z0-9_\\-]","_")
                .substring(0, Math.min(s.length(),40));
    }
}