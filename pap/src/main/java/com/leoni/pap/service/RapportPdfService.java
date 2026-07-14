package com.leoni.pap.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.itextpdf.io.font.constants.StandardFonts;
import com.itextpdf.kernel.colors.ColorConstants;
import com.itextpdf.kernel.colors.DeviceRgb;
import com.itextpdf.kernel.font.PdfFont;
import com.itextpdf.kernel.font.PdfFontFactory;
import com.itextpdf.kernel.geom.PageSize;
import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.kernel.pdf.PdfWriter;
import com.itextpdf.layout.Document;
import com.itextpdf.layout.borders.SolidBorder;
import com.itextpdf.layout.element.Cell;
import com.itextpdf.layout.element.Paragraph;
import com.itextpdf.layout.element.Table;
import com.itextpdf.layout.properties.HorizontalAlignment;
import com.itextpdf.layout.properties.TextAlignment;
import com.itextpdf.layout.properties.UnitValue;
import com.leoni.pap.entity.AuditProduit;
import com.leoni.pap.entity.enums.TypeAudit;
import com.leoni.pap.exception.BusinessException;
import com.leoni.pap.repository.AuditProduitRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Service
@RequiredArgsConstructor
public class RapportPdfService {

    private final AuditProduitRepository auditRepo;
    private final ObjectMapper objectMapper;

    private static final DateTimeFormatter FR = DateTimeFormatter.ofPattern("dd/MM/yyyy");
    private static final DeviceRgb NAVY       = new DeviceRgb(11, 30, 61);
    private static final DeviceRgb TEAL       = new DeviceRgb(13, 148, 136);
    private static final DeviceRgb PURPLE     = new DeviceRgb(124, 58, 237);
    private static final DeviceRgb SUCCESS    = new DeviceRgb(5, 150, 105);
    private static final DeviceRgb DANGER     = new DeviceRgb(220, 38, 38);
    private static final DeviceRgb WARN       = new DeviceRgb(217, 119, 6);
    private static final DeviceRgb LIGHT_BG   = new DeviceRgb(248, 250, 252);
    private static final DeviceRgb BORDER = new DeviceRgb(0, 0, 0);
    private static final DeviceRgb WHITE      = new DeviceRgb(255, 255, 255);



    public String genererEtSauvegarder(Long auditId, boolean includeNonConformites) {
        AuditProduit audit = auditRepo.findById(auditId)
                .orElseThrow(() -> new BusinessException("Audit introuvable"));

        try {
            byte[] pdf = genererPdf(audit, includeNonConformites);
            String filename = "rapport_final_" +
                    audit.getReference().replaceAll("[^a-zA-Z0-9_-]", "_") + ".pdf";
            Path dir = Paths.get("uploads/rapports-audit/");
            Files.createDirectories(dir);
            Files.write(dir.resolve(filename), pdf);

            audit.setRapportGenerePdfUrl("/uploads/rapports-audit/" + filename);
            audit.setRapportGenere(true);
            auditRepo.save(audit);

            return "/uploads/rapports-audit/" + filename;
        } catch (IOException e) {
            throw new BusinessException("Erreur génération PDF : " + e.getMessage());
        }
    }

    public byte[] genererPdf(AuditProduit audit, boolean includeNonConformites) throws IOException {
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        PdfWriter writer = new PdfWriter(baos);
        PdfDocument pdf = new PdfDocument(writer);
        Document doc = new Document(pdf, PageSize.A4);
        doc.setMargins(40, 40, 40, 40);

        PdfFont bold = PdfFontFactory.createFont(StandardFonts.HELVETICA_BOLD);
        PdfFont regular = PdfFontFactory.createFont(StandardFonts.HELVETICA);
        PdfFont italic = PdfFontFactory.createFont(StandardFonts.HELVETICA_OBLIQUE);

        boolean isRegle = audit.getTypeAudit() == TypeAudit.AUDIT_REGLES_PLATES;
        DeviceRgb accent = isRegle ? TEAL : PURPLE;

        // Page 1
        addHeader(doc, audit, isRegle, accent, bold, regular);
        doc.add(new Paragraph("\n").setFontSize(4));

        addInfosBlock(doc, audit, isRegle, bold, regular, accent);
        doc.add(new Paragraph("\n").setFontSize(6));

        if (isRegle) {
            addTableauReglePlate(doc, audit, bold, regular, accent);
        } else {
            addTableauExport(doc, audit, bold, regular, accent);
        }

        if (audit.getObservations() != null && !audit.getObservations().isBlank()) {
            doc.add(new Paragraph("\n").setFontSize(4));
            addSection(doc, "Observations générales", audit.getObservations(), bold, regular);
        }

        addFooterPage1(doc, audit, bold, regular, italic);

        // Page 2 : PDCA si nécessaire
        // Page 2 : PDCA si nécessaire
        boolean pdcaDeclenche = Boolean.TRUE.equals(audit.getPdcaDeclenche());
        if (includeNonConformites && pdcaDeclenche) {
            pdf.addNewPage();   // ✅ saut de page correct
            addPagePDCA(doc, audit, bold, regular, italic, accent);
        }

        doc.close();
        return baos.toByteArray();
    }

    private void addHeader(Document doc, AuditProduit audit, boolean isRegle, DeviceRgb accent,
                           PdfFont bold, PdfFont regular) {
        Table header = new Table(UnitValue.createPercentArray(new float[]{3, 1}))
                .setWidth(UnitValue.createPercentValue(100));

        // Cellule gauche : fond blanc, bordure noire, texte NAVY
        Cell left = new Cell()
                .setBorder(new SolidBorder(ColorConstants.BLACK, 1f))
                .setBackgroundColor(WHITE)
                .setPadding(16);
        left.add(new Paragraph(isRegle ? "AUDIT RÈGLE PLATE" : "AUDIT MAGASIN EXPORT")
                .setFont(bold).setFontSize(15).setFontColor(NAVY));
        left.add(new Paragraph(isRegle ? "IT TN 3627 — Suivi des instruments de mesure"
                : "IT 3600-05 — Contrôle avant expédition")
                .setFont(regular).setFontSize(8).setFontColor(NAVY));
        left.add(new Paragraph(audit.getReference())
                .setFont(bold).setFontSize(11).setFontColor(NAVY).setMarginTop(4));
        header.addCell(left);

        // Cellule droite : fond blanc, bordure noire, texte NAVY, aligné centre
        Cell right = new Cell()
                .setBorder(new SolidBorder(ColorConstants.BLACK, 1f))
                .setBackgroundColor(WHITE)
                .setPadding(16)
                .setTextAlignment(TextAlignment.CENTER);
        right.add(new Paragraph("LEONI").setFont(bold).setFontSize(18).setFontColor(NAVY));
        right.add(new Paragraph("PAP Qualité").setFont(regular).setFontSize(8).setFontColor(NAVY));
        right.add(new Paragraph(java.time.LocalDate.now().format(FR))
                .setFont(bold).setFontSize(9).setFontColor(NAVY).setMarginTop(6));
        header.addCell(right);

        doc.add(header);
    }

    private void addInfosBlock(Document doc, AuditProduit audit, boolean isRegle,
                               PdfFont bold, PdfFont regular, DeviceRgb accent) {
        Table t = new Table(UnitValue.createPercentArray(new float[]{1, 1, 1, 1}))
                .setWidth(UnitValue.createPercentValue(100));

        List<String[]> fields = new ArrayList<>();
        fields.add(new String[]{"Auditeur", nom(audit.getAuditeur())});
        fields.add(new String[]{"Plant", audit.getPlant() != null ? audit.getPlant().getNom() : "—"});
        fields.add(new String[]{"Date prévue", audit.getDatePrevue() != null ? audit.getDatePrevue().format(FR) : "—"});
        fields.add(new String[]{"Date réalisation", audit.getDateRealisation() != null ? audit.getDateRealisation().format(FR) : java.time.LocalDate.now().format(FR)});
        if (isRegle) {
            fields.add(new String[]{"Prochain contrôle", audit.getDeadline() != null ? audit.getDeadline().format(FR) : "—"});
            fields.add(new String[]{"PDCA", Boolean.TRUE.equals(audit.getPdcaDeclenche()) ? "Déclenché" : "Non requis"});
        } else {
            fields.add(new String[]{"Salle export", audit.getZoneExpedition() != null ? audit.getZoneExpedition() : "—"});
            fields.add(new String[]{"Semaine", audit.getSemaineExport() != null ? audit.getSemaineExport() : "—"});
        }
        fields.add(new String[]{"Planificateur", nom(audit.getPlanificateur())});
        fields.add(new String[]{"Statut", "TERMINÉ"});

        for (String[] f : fields) {
            Cell c = new Cell().setBackgroundColor(LIGHT_BG)
                    .setBorder(new SolidBorder(BORDER, 0.5f)).setPadding(8);
            c.add(new Paragraph(f[0]).setFont(bold).setFontSize(7).setFontColor(new DeviceRgb(100, 116, 139)));
            c.add(new Paragraph(f[1]).setFont(bold).setFontSize(9).setFontColor(NAVY));
            t.addCell(c);
        }

        int rem = 4 - (fields.size() % 4);
        if (rem < 4) {
            for (int i = 0; i < rem; i++) {
                t.addCell(new Cell().setBorder(com.itextpdf.layout.borders.Border.NO_BORDER));
            }
        }
        doc.add(t);
    }

    private void addTableauReglePlate(Document doc, AuditProduit audit, PdfFont bold, PdfFont regular, DeviceRgb accent) throws IOException {
        doc.add(new Paragraph("Résultats du contrôle").setFont(bold).setFontSize(11).setFontColor(NAVY).setMarginBottom(6));

        String checklistJson = audit.getChecklistJson();
        if (checklistJson == null || checklistJson.isBlank()) {
            doc.add(new Paragraph("Données non disponibles.").setFont(regular).setFontSize(9));
            return;
        }

        Map<String, Object> data = objectMapper.readValue(checklistJson, new TypeReference<>() {});
        List<Map<String, Object>> rows = (List<Map<String, Object>>) data.getOrDefault("rows", Collections.emptyList());

        String[] headers = {"N° Instrument", "Type", "Emplacement", "Date contrôle", "Contrôleur", "Résultat", "Proch. date", "Remarques"};
        float[] widths = {1f, 1f, 1.5f, 1f, 1.2f, 1f, 1f, 1.5f};
        Table t = new Table(UnitValue.createPercentArray(widths)).setWidth(UnitValue.createPercentValue(100));

        for (String h : headers) {
            t.addHeaderCell(new Cell()
                    .setBorder(new SolidBorder(ColorConstants.BLACK, 0.8f))
                    .setBackgroundColor(WHITE)
                    .setPadding(6)
                    .add(new Paragraph(h).setFont(bold).setFontSize(7).setFontColor(NAVY)));
        }

        int i = 0;
        for (Map<String, Object> row : rows) {
            DeviceRgb rowBg = i++ % 2 == 0 ? WHITE : LIGHT_BG;
            boolean isNC = "non conforme".equalsIgnoreCase((String) row.get("resultat"));
            DeviceRgb resultatColor = isNC ? DANGER : SUCCESS;

            String[] vals = {
                    str(row.get("numeroInstrument")),
                    str(row.get("typeInstrument")).replace("_", " "),
                    str(row.get("emplacement")),
                    str(row.get("dateControle")),
                    str(row.get("nomControleur")),
                    isNC ? "NON CONFORME" : "Conforme",
                    str(row.get("prochaineDate")),
                    str(row.get("remarques")),
            };

            for (int j = 0; j < vals.length; j++) {
                Cell c = new Cell().setBackgroundColor(j == 5 ? (isNC ? new DeviceRgb(254, 242, 242) : new DeviceRgb(236, 253, 245)) : rowBg)
                        .setBorder(new SolidBorder(BORDER, 0.5f)).setPadding(5);
                c.add(new Paragraph(vals[j]).setFont(j == 5 ? bold : regular).setFontSize(8)
                        .setFontColor(j == 5 ? resultatColor : NAVY));
                t.addCell(c);
            }
        }
        doc.add(t);

        long nbNC = rows.stream().filter(r -> "non conforme".equalsIgnoreCase((String) r.get("resultat"))).count();
        doc.add(new Paragraph("\n").setFontSize(4));
        Table summary = new Table(UnitValue.createPercentArray(new float[]{1, 1}))
                .setWidth(UnitValue.createPercentValue(50)).setHorizontalAlignment(HorizontalAlignment.RIGHT);
        summary.addCell(infoCell("Total instruments", String.valueOf(rows.size()), bold, regular));
        summary.addCell(infoCell("Non-conformités", String.valueOf(nbNC), bold, nbNC > 0 ? bold : regular));
        doc.add(summary);
    }

    private void addTableauExport(Document doc, AuditProduit audit, PdfFont bold, PdfFont regular, DeviceRgb accent) throws IOException {
        String resultatStr = audit.getActionImmediate();
        int pct = 0;
        if (resultatStr != null && resultatStr.contains("%")) {
            try { pct = Integer.parseInt(resultatStr.replaceAll("[^0-9]", "")); } catch (Exception ignored) {}
        }

        DeviceRgb scoreColor = pct == 100 ? SUCCESS : pct >= 80 ? WARN : DANGER;
        DeviceRgb scoreBg    = pct == 100 ? new DeviceRgb(236, 253, 245) : pct >= 80 ? new DeviceRgb(255, 251, 235) : new DeviceRgb(254, 242, 242);

        Table scoreBanner = new Table(UnitValue.createPercentArray(new float[]{3, 1}))
                .setWidth(UnitValue.createPercentValue(100));
        Cell scoreLeft = new Cell().setBackgroundColor(scoreBg).setBorder(new SolidBorder(scoreColor, 1.5f)).setPadding(12);
        scoreLeft.add(new Paragraph("Résultat de l'audit").setFont(bold).setFontSize(8).setFontColor(new DeviceRgb(100, 116, 139)));
        scoreLeft.add(new Paragraph(pct == 100 ? "Audit 100% conforme" : pct >= 80 ? "Non-conformités mineures détectées" : "Non-conformités critiques détectées")
                .setFont(bold).setFontSize(10).setFontColor(scoreColor));
        scoreBanner.addCell(scoreLeft);

        Cell scoreRight = new Cell().setBackgroundColor(scoreBg).setBorder(new SolidBorder(scoreColor, 1.5f))
                .setPadding(12).setTextAlignment(TextAlignment.CENTER);
        scoreRight.add(new Paragraph(pct + "%").setFont(bold).setFontSize(22).setFontColor(scoreColor));
        scoreBanner.addCell(scoreRight);
        doc.add(scoreBanner);
        doc.add(new Paragraph("\n").setFontSize(6));

        doc.add(new Paragraph("Détail des critères").setFont(bold).setFontSize(11).setFontColor(NAVY).setMarginBottom(6));

        String scoresJson = audit.getScoresJson();
        if (scoresJson == null || scoresJson.isBlank()) {
            doc.add(new Paragraph("Détail non disponible.").setFont(regular).setFontSize(9));
            return;
        }

        Map<String, String> scores = objectMapper.readValue(scoresJson, new TypeReference<>() {});
        String[][] criteres = {
                {"identification", "Identification / Contrôle de l'identité"},
                {"generation",     "Generation Stand/index"},
                {"etiquette",      "Etiquette de contrôle électrique"},
                {"emballage",      "Emballage (méthode et quantité)"},
                {"papier",         "Papier d'export (label)"},
                {"autresSeries",   "Existence d'autres séries selon label"},
                {"proprete",       "Propreté"},
                {"endommagements", "Endommagements"},
                {"dateProduction", "Date de production"},
                {"autres",         "Autres"},
        };

        Table t = new Table(UnitValue.createPercentArray(new float[]{3f, 1f, 1f, 1f}))
                .setWidth(UnitValue.createPercentValue(100));
        for (String h : new String[]{"Critère", "Cont. 1", "Cont. 2", "Cont. 3"}) {
            t.addHeaderCell(new Cell()
                    .setBorder(new SolidBorder(ColorConstants.BLACK, 0.8f))
                    .setBackgroundColor(WHITE)
                    .setPadding(6)
                    .add(new Paragraph(h).setFont(bold).setFontSize(8).setFontColor(NAVY)));
        }

        int ri = 0;
        for (String[] cr : criteres) {
            DeviceRgb rowBg = ri++ % 2 == 0 ? WHITE : LIGHT_BG;
            Cell label = new Cell().setBackgroundColor(rowBg).setBorder(new SolidBorder(BORDER, 0.5f)).setPadding(6);
            label.add(new Paragraph(cr[1]).setFont(bold).setFontSize(8).setFontColor(NAVY));
            t.addCell(label);

            for (int ci = 0; ci < 3; ci++) {
                String val = scores.getOrDefault(cr[0] + "_" + ci, "NA");
                boolean isNa = "NA".equals(val);
                boolean perfect = "10".equals(val);
                boolean bad = !isNa && !perfect && Integer.parseInt(val) < 5;
                DeviceRgb cellBg = isNa ? LIGHT_BG : perfect ? new DeviceRgb(236, 253, 245) : bad ? new DeviceRgb(254, 242, 242) : new DeviceRgb(255, 251, 235);
                DeviceRgb cellFg = isNa ? new DeviceRgb(148, 163, 184) : perfect ? SUCCESS : bad ? DANGER : WARN;
                Cell sc = new Cell().setBackgroundColor(cellBg).setBorder(new SolidBorder(BORDER, 0.5f))
                        .setPadding(6).setTextAlignment(TextAlignment.CENTER);
                sc.add(new Paragraph(isNa ? "N/A" : val + "/10").setFont(bold).setFontSize(9).setFontColor(cellFg));
                t.addCell(sc);
            }
        }
        doc.add(t);
    }

    private void addPagePDCA(Document doc, AuditProduit audit, PdfFont bold, PdfFont regular, PdfFont italic, DeviceRgb accent) {
        Table header = new Table(UnitValue.createPercentArray(new float[]{1}))
                .setWidth(UnitValue.createPercentValue(100));
        Cell h = new Cell().setBackgroundColor(DANGER).setPadding(14)
                .setBorder(com.itextpdf.layout.borders.Border.NO_BORDER);
        h.add(new Paragraph("PLAN D'ACTION CORRECTIVE (PDCA)")
                .setFont(bold).setFontSize(14).setFontColor(WHITE));
        h.add(new Paragraph("Non-conformités relevées — Audit : " + audit.getReference())
                .setFont(regular).setFontSize(9).setFontColor(new DeviceRgb(254, 202, 202)));
        header.addCell(h);
        doc.add(header);
        doc.add(new Paragraph("\n").setFontSize(8));

        Table meta = new Table(UnitValue.createPercentArray(new float[]{1, 1, 1}))
                .setWidth(UnitValue.createPercentValue(100));
        meta.addCell(infoCell("Date de déclenchement",
                audit.getDatePdca() != null ? audit.getDatePdca().toLocalDate().format(FR) : java.time.LocalDate.now().format(FR),
                bold, regular));
        meta.addCell(infoCell("Référence audit", audit.getReference(), bold, regular));
        meta.addCell(infoCell("Responsable PDCA",
                audit.getResponsablePdca() != null ? nom(audit.getResponsablePdca()) : "—", bold, regular));
        doc.add(meta);
        doc.add(new Paragraph("\n").setFontSize(6));

        String checklistJson = audit.getChecklistJson();
        if (checklistJson != null && !checklistJson.isBlank()) {
            try {
                Map<String, Object> data = objectMapper.readValue(checklistJson, new TypeReference<>() {});
                List<Map<String, Object>> rows = (List<Map<String, Object>>) data.getOrDefault("rows", Collections.emptyList());
                List<Map<String, Object>> ncRows = rows.stream()
                        .filter(r -> "non conforme".equalsIgnoreCase((String) r.get("resultat")))
                        .toList();

                if (!ncRows.isEmpty()) {
                    doc.add(new Paragraph("Non-conformités détectées (" + ncRows.size() + ")")
                            .setFont(bold).setFontSize(11).setFontColor(DANGER).setMarginBottom(6));

                    String[] hdrs = {"#", "N° Instrument", "Type", "Emplacement", "Contrôleur", "Remarques"};
                    float[] ws = {0.3f, 1f, 1f, 1.5f, 1.2f, 2f};
                    Table ncTable = new Table(UnitValue.createPercentArray(ws))
                            .setWidth(UnitValue.createPercentValue(100));
                    for (String hd : hdrs) {
                        ncTable.addHeaderCell(new Cell().setBackgroundColor(DANGER).setPadding(6)
                                .add(new Paragraph(hd).setFont(bold).setFontSize(7).setFontColor(WHITE)));
                    }
                    int idx = 1;
                    for (Map<String, Object> nc : ncRows) {
                        DeviceRgb rb = new DeviceRgb(254, 242, 242);
                        for (String v : new String[]{
                                String.valueOf(idx++),
                                str(nc.get("numeroInstrument")),
                                str(nc.get("typeInstrument")).replace("_", " "),
                                str(nc.get("emplacement")),
                                str(nc.get("nomControleur")),
                                str(nc.get("remarques")),
                        }) {
                            ncTable.addCell(new Cell().setBackgroundColor(rb)
                                    .setBorder(new SolidBorder(BORDER, 0.5f)).setPadding(5)
                                    .add(new Paragraph(v).setFont(regular).setFontSize(8).setFontColor(NAVY)));
                        }
                    }
                    doc.add(ncTable);
                }
            } catch (Exception ignored) {}
        }

        doc.add(new Paragraph("\n").setFontSize(8));
        doc.add(new Paragraph("Suivi des actions correctives")
                .setFont(bold).setFontSize(11).setFontColor(NAVY).setMarginBottom(6));

        String[] colsAction = {"N°", "Description de l'action", "Responsable", "Délai", "Statut", "Résultat"};
        float[] wsA = {0.3f, 2.5f, 1.2f, 0.8f, 0.8f, 1.2f};
        Table actionTable = new Table(UnitValue.createPercentArray(wsA))
                .setWidth(UnitValue.createPercentValue(100));
        for (String hd : colsAction) {
            actionTable.addHeaderCell(new Cell().setBackgroundColor(NAVY).setPadding(6)
                    .add(new Paragraph(hd).setFont(bold).setFontSize(7).setFontColor(WHITE)));
        }
        for (int i = 0; i < 3; i++) {
            for (int j = 0; j < 6; j++) {
                actionTable.addCell(new Cell().setHeight(25).setBorder(new SolidBorder(BORDER, 0.5f)));
            }
        }
        doc.add(actionTable);

        doc.add(new Paragraph("\n").setFontSize(10));
        Table sigBlock = new Table(UnitValue.createPercentArray(new float[]{1, 1, 1}))
                .setWidth(UnitValue.createPercentValue(100));
        for (String sig : new String[]{"Auditeur", "Responsable Qualité", "Responsable Zone"}) {
            Cell sc = new Cell().setBorder(new SolidBorder(BORDER, 1f)).setPadding(10).setHeight(60);
            sc.add(new Paragraph(sig).setFont(bold).setFontSize(8).setFontColor(NAVY));
            sc.add(new Paragraph("Nom & Signature :").setFont(italic).setFontSize(7).setFontColor(new DeviceRgb(148,163,184)).setMarginTop(6));
            sigBlock.addCell(sc);
        }
        doc.add(sigBlock);
    }

    private void addFooterPage1(Document doc, AuditProduit audit, PdfFont bold, PdfFont regular, PdfFont italic) {
        doc.add(new Paragraph("\n").setFontSize(8));
        Table footer = new Table(UnitValue.createPercentArray(new float[]{1, 1, 1}))
                .setWidth(UnitValue.createPercentValue(100));
        for (String sig : new String[]{"Auditeur", "Expert / Planificateur", "Responsable Plant"}) {
            Cell sc = new Cell().setBorder(new SolidBorder(BORDER, 1f)).setPadding(10).setHeight(55);
            sc.add(new Paragraph(sig).setFont(bold).setFontSize(8).setFontColor(NAVY));
            sc.add(new Paragraph("Nom & Signature :").setFont(italic).setFontSize(7)
                    .setFontColor(new DeviceRgb(148,163,184)).setMarginTop(8));
            footer.addCell(sc);
        }
        doc.add(footer);

        doc.add(new Paragraph("\nDocument généré automatiquement par le système PAP LEONI · " + java.time.LocalDate.now().format(FR))
                .setFont(italic).setFontSize(7).setFontColor(new DeviceRgb(148,163,184))
                .setTextAlignment(TextAlignment.CENTER).setMarginTop(4));
    }

    private void addSection(Document doc, String title, String content, PdfFont bold, PdfFont regular) {
        doc.add(new Paragraph(title).setFont(bold).setFontSize(10).setFontColor(NAVY).setMarginBottom(4));
        Table t = new Table(UnitValue.createPercentArray(new float[]{1})).setWidth(UnitValue.createPercentValue(100));
        Cell c = new Cell().setBackgroundColor(LIGHT_BG).setBorder(new SolidBorder(BORDER, 0.5f)).setPadding(10);
        c.add(new Paragraph(content).setFont(regular).setFontSize(9).setFontColor(NAVY));
        t.addCell(c);
        doc.add(t);
    }

    private Cell infoCell(String label, String value, PdfFont bold, PdfFont regular) {
        Cell c = new Cell().setBackgroundColor(LIGHT_BG).setBorder(new SolidBorder(BORDER, 0.5f)).setPadding(8);
        c.add(new Paragraph(label).setFont(bold).setFontSize(7).setFontColor(new DeviceRgb(100,116,139)));
        c.add(new Paragraph(value).setFont(bold).setFontSize(9).setFontColor(NAVY));
        return c;
    }

    private String nom(com.leoni.pap.entity.Utilisateur u) {
        if (u == null) return "—";
        return ((u.getPrenom() != null ? u.getPrenom() : "") + " " +
                (u.getNom() != null ? u.getNom().toUpperCase() : "")).trim();
    }

    private String str(Object o) {
        return o != null ? o.toString() : "—";
    }
}