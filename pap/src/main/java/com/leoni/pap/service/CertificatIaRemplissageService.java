package com.leoni.pap.service;

import com.leoni.pap.entity.PassageCertification;
import com.leoni.pap.entity.Utilisateur;
import com.leoni.pap.entity.Certification;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.font.PDType1Font;
// ✅ SUPPRIMÉ : import org.apache.pdfbox.Loader;               → PDFBox 3.x uniquement
// ✅ SUPPRIMÉ : import org.apache.pdfbox.pdmodel.font.Standard14Fonts; → PDFBox 3.x uniquement
// Dans PDFBox 2.x :
//   Loader.loadPDF(bytes)  → PDDocument.load(bytes)
//   new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD) → PDType1Font.HELVETICA_BOLD
import org.apache.pdfbox.text.PDFTextStripper;
import org.apache.pdfbox.text.TextPosition;
import org.springframework.stereotype.Service;

import java.io.*;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

/**
 * CertificatIaRemplissageService — v8 UNIVERSAL (corrigé PDFBox 2.x)
 *
 * 4 niveaux :
 *   1. AcroForm
 *   2. Détection : label + points sur même ligne → texte sur les points
 *   3. Détection : label seul → texte sur la ligne suivante / centrée (VW)
 *   4. Fallback LEONI calibré manuellement (positions parfaites conservées)
 *
 * ✅ AJOUT VW : remplirCertificatVW() — méthode séparée appelée uniquement
 *    quand cert.getClient().getCode() == "VW".
 *    Le reste du code est 100% intact.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class CertificatIaRemplissageService {

    private static final DateTimeFormatter FMT_DATE =
            DateTimeFormatter.ofPattern("dd/MM/yyyy");

    private static final Map<String, String[]> LABEL_KEYWORDS = new LinkedHashMap<>();
    static {
        LABEL_KEYWORDS.put("DATE_EXPIRATION", new String[]{
                "valable", "jusqu", "expir", "valid until", "valid through",
                "gultig bis", "validite", "fin de validite"
        });
        LABEL_KEYWORDS.put("DATE_CERTIF", new String[]{
                "date de certif", "date certif", "obtenu le", "delivre le",
                "date passage", "issued", "date of issue", "wolfsburg",
                "germany", "datum", "ausstellungsdatum"
        });
        LABEL_KEYWORDS.put("MATRICULE", new String[]{
                "matricule", "badge", "identifiant", "employee id", "personaln"
        });
        LABEL_KEYWORDS.put("NOM_PRENOM", new String[]{
                "mr/mme", "mr mme", "nom et prenom", "nom prenom",
                "confirms that", "confirms", "awarded to", "presented to",
                "bescheinigt", "hiermit",
                "auditeur", "stagiaire", "candidat", "titulaire",
                "operateur", "employe", "participant"
        });
        LABEL_KEYWORDS.put("PRENOM", new String[]{"prenom", "first name", "vorname"});
        LABEL_KEYWORDS.put("NOM",    new String[]{"nom de famille", "last name", "nachname"});
    }

    // ═══════════════════════════════════════════════════════
    //  MÉTHODE PRINCIPALE
    // ═══════════════════════════════════════════════════════
    public byte[] remplirCertificat(byte[] pdfVide, PassageCertification passage) {
        try {
            // ✅ AJOUT VW : si le client est VW, on utilise la méthode dédiée
            //    qui écrit uniquement le nom centré sur la ligne de points.
            //    Tout le reste du code ci-dessous est inchangé.
            Certification cert = passage.getCertification();
            if (cert.getClient() != null
                    && "VW".equalsIgnoreCase(cert.getClient().getCode())) {
                log.info("[Certif v8] Client VW détecté → remplirCertificatVW");
                return remplirCertificatVW(pdfVide, passage);
            }

            // ── CODE ORIGINAL v8 inchangé ──────────────────────────────────
            ChampsCertificat champs = extraireChamps(passage);

            byte[] acro = essayerAcroForm(pdfVide, champs);
            if (acro != null) { log.info("[Certif v8] AcroForm ✓"); return acro; }

            List<ZoneFill> zones = detecterIntelligent(pdfVide, champs);

            if (zones.isEmpty()) {
                log.warn("[Certif v8] Aucun label → fallback LEONI");
                zones = fallbackLeoni(champs);
            }

            log.info("[Certif v8] {} zone(s) : {}", zones.size(),
                    zones.stream().map(z -> z.champ + "@(" + (int)z.x + "," + (int)z.y + ")")
                            .collect(Collectors.joining(" | ")));

            return ecrireSurPdf(pdfVide, zones);

        } catch (Exception e) {
            log.error("[Certif v8] Erreur : {}", e.getMessage(), e);
            return pdfVide;
        }
    }

    // ═══════════════════════════════════════════════════════
    //  ✅ AJOUT VW : méthode dédiée au certificat Volkswagen
    //
    //  Le template VW a une seule zone à remplir : le nom complet
    //  centré sur la ligne de points (..............................).
    //
    //  Coordonnées calibrées depuis le fichier template_vw_vide.pdf :
    //    - Ligne de points : pdfplumber top = 192.9 pt (depuis le haut)
    //    - Page height     : 842 pt (A4)
    //    - PDFBox y        : 842 - 192.9 - 10 = 639  (origin bas-gauche)
    //    - Centre horizontal : (pageWidth - textWidth) / 2
    //      où textWidth = font.getStringWidth(nom) / 1000 * fontSize
    // ═══════════════════════════════════════════════════════
    private byte[] remplirCertificatVW(byte[] pdfVide, PassageCertification passage) {
        try {
            Utilisateur aud = passage.getAuditeur();
            String prenom   = aud.getPrenom() != null ? aud.getPrenom().trim() : "";
            String nom      = aud.getNom()    != null ? aud.getNom().trim()    : "";
            String nomComplet = ascii((prenom + " " + nom).trim());

            if (nomComplet.isEmpty()) {
                log.warn("[Certif VW] Nom vide, retour PDF vide");
                return pdfVide;
            }

            try (PDDocument doc = PDDocument.load(pdfVide)) {
                PDPage      page = doc.getPage(0);
                float       W    = page.getMediaBox().getWidth();   // 595 pt

                // Police Helvetica-Bold 12pt (même rendu que le reste du certificat)
                PDType1Font font     = PDType1Font.HELVETICA_BOLD;
                float       fontSize = 12f;

                // Centrage horizontal exact via la largeur réelle PDFBox
                float textWidth = font.getStringWidth(nomComplet) / 1000f * fontSize;
                float x         = (W - textWidth) / 2f;

                // y = 639 : baseline sur la ligne de points (PDFBox origin bas-gauche)
                float y = 639f;

                log.info("[Certif VW] Écriture '{}' x={} y={}", nomComplet, (int)x, (int)y);

                try (PDPageContentStream cs = new PDPageContentStream(
                        doc, page, PDPageContentStream.AppendMode.APPEND, true, true)) {
                    cs.setNonStrokingColor(0f, 0f, 0f);
                    cs.beginText();
                    cs.setFont(font, fontSize);
                    cs.newLineAtOffset(x, y);
                    cs.showText(nomComplet);
                    cs.endText();
                }

                ByteArrayOutputStream out = new ByteArrayOutputStream();
                doc.save(out);
                return out.toByteArray();
            }
        } catch (Exception e) {
            log.error("[Certif VW] Erreur : {}", e.getMessage(), e);
            return pdfVide;
        }
    }

    // ═══════════════════════════════════════════════════════
    //  EXTRACTION DONNÉES
    // ═══════════════════════════════════════════════════════
    private ChampsCertificat extraireChamps(PassageCertification passage) {
        Utilisateur   aud  = passage.getAuditeur();
        Certification cert = passage.getCertification();
        ChampsCertificat c = new ChampsCertificat();
        c.prenom     = s(aud.getPrenom());
        c.nom        = s(aud.getNom());
        c.nomComplet = (c.prenom + " " + c.nom).trim();
        c.matricule  = s(aud.getMatricule());
        c.titre      = s(cert.getTitre());
        if (passage.getDateFin() != null)
            c.dateCertif = passage.getDateFin().format(FMT_DATE);
        if (cert.getDateExpiration() != null)
            c.dateExpiration = cert.getDateExpiration().toLocalDate()
                    .format(DateTimeFormatter.ofPattern("dd/MM/yyyy"));
        if (passage.getScoreTheorique() != null)
            c.scoreTheorique = String.valueOf(passage.getScoreTheorique());
        if (passage.getNbDefautsIdentifies() != null && passage.getNbDefautsTotal() != null)
            c.scorePratique = passage.getNbDefautsIdentifies() + "/" + passage.getNbDefautsTotal();
        c.statut = "QUALIFIE(E)";
        c.numeroCertif = cert.getNumeroCertificat();
        return c;
    }

    private String s(String v) { return v != null ? v.trim() : ""; }

    // ═══════════════════════════════════════════════════════
    //  NIVEAU 1 : ACROFORM
    // ═══════════════════════════════════════════════════════
    private byte[] essayerAcroForm(byte[] pdfVide, ChampsCertificat champs) {
        // ✅ PDFBox 2.x : PDDocument.load(byte[]) au lieu de Loader.loadPDF(byte[])
        try (PDDocument doc = PDDocument.load(pdfVide)) {
            if (doc.getDocumentCatalog().getAcroForm() == null) return null;
            var acroForm = doc.getDocumentCatalog().getAcroForm();
            if (acroForm.getFields().isEmpty()) return null;
            int filled = 0;
            for (var field : acroForm.getFields()) {
                String name = field.getFullyQualifiedName();
                if (name == null) continue;
                String champ = identifierChamp(name.replace("_"," ").replace("-"," "));
                if (champ == null) continue;
                String val = champs.getValeur(champ);
                if (val == null || val.isEmpty()) continue;
                try { field.setValue(ascii(val)); filled++; } catch (Exception ignored) {}
            }
            if (filled == 0) return null;
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            doc.save(out);
            return out.toByteArray();
        } catch (Exception e) { return null; }
    }

    // ═══════════════════════════════════════════════════════
    //  NIVEAUX 2+3 : DÉTECTION INTELLIGENTE
    // ═══════════════════════════════════════════════════════
    private List<ZoneFill> detecterIntelligent(byte[] pdfVide, ChampsCertificat champs)
            throws Exception {
        List<ZoneFill> result = new ArrayList<>();
        // ✅ PDFBox 2.x : PDDocument.load(byte[])
        try (PDDocument doc = PDDocument.load(pdfVide)) {
            for (int pi = 0; pi < doc.getNumberOfPages(); pi++)
                result.addAll(detecterPage(doc, pi, champs));
        }
        return result;
    }

    private List<ZoneFill> detecterPage(PDDocument doc, int pi, ChampsCertificat champs)
            throws IOException {

        List<CharInfo> allChars = new ArrayList<>();
        PDFTextStripper stripper = new PDFTextStripper() {
            @Override
            protected void writeString(String text, List<TextPosition> tps) throws IOException {
                for (TextPosition tp : tps) {
                    String uni = tp.getUnicode();
                    if (uni == null || uni.isEmpty()) continue;
                    for (char c : uni.toCharArray()) {
                        if (c == '\n' || c == '\r') continue;
                        allChars.add(new CharInfo(c, tp.getXDirAdj(), tp.getYDirAdj(),
                                tp.getHeightDir(), tp.getWidthDirAdj()));
                    }
                }
                super.writeString(text, tps);
            }
        };
        stripper.setStartPage(pi + 1);
        stripper.setEndPage(pi + 1);
        stripper.setSortByPosition(true);
        try { stripper.getText(doc); } catch (Exception ignored) {}
        if (allChars.isEmpty()) return Collections.emptyList();

        PDPage page = doc.getPage(pi);
        float pdfW  = page.getMediaBox().getWidth();

        List<Ligne> lignes = construireLignes(allChars);
        List<ZoneFill> result = new ArrayList<>();
        Set<String> champsFilled = new HashSet<>();

        for (int i = 0; i < lignes.size(); i++) {
            Ligne ligne = lignes.get(i);
            String champ = identifierChamp(ligne.texte);
            if (champ == null || champsFilled.contains(champ)) continue;

            String valeur = champs.getValeur(champ);
            if (valeur == null || valeur.isEmpty()) continue;

            log.debug("[Certif v8] Label '{}' → {}", ligne.texte.trim(), champ);

            ZoneFill zone = null;

            // CAS A : points sur la même ligne → placer sur les points
            float dotsX = trouverDebutPoints(ligne);
            if (dotsX > 0) {
                zone = new ZoneFill(pi, dotsX + 1f, ligne.yMoy,
                        ascii(valeur), champ, taillePolice(champ));
                log.debug("[Certif v8] A: points meme ligne x={} y={}", (int)dotsX, (int)ligne.yMoy);
            }

            // CAS B : ligne suivante avec points ou vide
            if (zone == null && i + 1 < lignes.size()) {
                Ligne suiv = lignes.get(i + 1);
                float dotsNext = trouverDebutPoints(suiv);
                boolean suiVide = suiv.texte.trim().isEmpty()
                        || suiv.texte.matches(".*[\\.\\-_…]{3,}.*");
                if (suiVide || dotsNext > 0) {
                    float xP = dotsNext > 0 ? dotsNext + 1f : Math.max(suiv.xMin, 30f);
                    zone = new ZoneFill(pi, xP, suiv.yMoy, ascii(valeur), champ, taillePolice(champ));
                    log.debug("[Certif v8] B: ligne suivante x={} y={}", (int)xP, (int)suiv.yMoy);
                }
            }

            // CAS C : style VW — chercher dans les 3 lignes suivantes
            if (zone == null && "NOM_PRENOM".equals(champ)) {
                for (int j = i + 1; j < Math.min(i + 4, lignes.size()); j++) {
                    Ligne cand = lignes.get(j);
                    if (cand.texte.trim().length() < 50) {
                        float dotsC = trouverDebutPoints(cand);
                        if (estCentre(cand, pdfW)) {
                            float nomW = ascii(valeur).length() * 18f * 0.55f;
                            float xC   = Math.max(10f, (pdfW - nomW) / 2f);
                            zone = new ZoneFill(pi, xC, cand.yMoy, ascii(valeur), champ, 18f);
                            log.debug("[Certif v8] C: VW centré x={} y={}", (int)xC, (int)cand.yMoy);
                        } else {
                            float xC = dotsC > 0 ? dotsC + 1f : Math.max(cand.xMin, 30f);
                            zone = new ZoneFill(pi, xC, cand.yMoy, ascii(valeur), champ, taillePolice(champ));
                            log.debug("[Certif v8] C: multi-ligne x={} y={}", (int)xC, (int)cand.yMoy);
                        }
                        break;
                    }
                }
            }

            // CAS D : juste après le label sur la même ligne
            if (zone == null) {
                CharInfo last = ligne.chars.get(ligne.chars.size() - 1);
                float xAp = last.x + last.width + 4f;
                zone = new ZoneFill(pi, xAp, ligne.yMoy, ascii(valeur), champ, taillePolice(champ));
                log.debug("[Certif v8] D: apres label x={} y={}", (int)xAp, (int)ligne.yMoy);
            }

            result.add(zone);
            champsFilled.add(champ);
        }
        return result;
    }

    private float trouverDebutPoints(Ligne ligne) {
        int seq = 0;
        for (int i = 0; i < ligne.chars.size(); i++) {
            char ch = ligne.chars.get(i).ch;
            if (ch == '.' || ch == '_' || ch == '-' || ch == '–' || ch == '—' || ch == '…') {
                seq++;
                if (seq >= 3) return ligne.chars.get(i - seq + 1).x;
            } else { seq = 0; }
        }
        return -1f;
    }

    private boolean estCentre(Ligne ligne, float pdfW) {
        if (ligne.chars.isEmpty()) return false;
        float xMin = (float) ligne.chars.stream().mapToDouble(c -> c.x).min().orElse(0);
        float xMax = (float) ligne.chars.stream().mapToDouble(c -> c.x + c.width).max().orElse(pdfW);
        return Math.abs((xMin + xMax) / 2f - pdfW / 2f) < pdfW * 0.15f;
    }

    private List<Ligne> construireLignes(List<CharInfo> chars) {
        chars.sort(Comparator.comparingDouble((CharInfo c) -> c.y).thenComparingDouble(c -> c.x));
        List<Ligne> lignes = new ArrayList<>();
        List<CharInfo> cur = new ArrayList<>();
        float lastY = Float.MIN_VALUE;
        for (CharInfo c : chars) {
            if (cur.isEmpty() || Math.abs(c.y - lastY) <= 3.5f) { cur.add(c); lastY = c.y; }
            else { lignes.add(new Ligne(cur)); cur = new ArrayList<>(); cur.add(c); lastY = c.y; }
        }
        if (!cur.isEmpty()) lignes.add(new Ligne(cur));
        return lignes;
    }

    private String identifierChamp(String txt) {
        if (txt == null || txt.trim().length() < 2) return null;
        String norm = normaliser(txt);
        for (Map.Entry<String, String[]> e : LABEL_KEYWORDS.entrySet())
            for (String kw : e.getValue())
                if (norm.contains(kw)) return e.getKey();
        return null;
    }

    private float taillePolice(String champ) {
        return "NOM_PRENOM".equals(champ) || "NOM".equals(champ) || "PRENOM".equals(champ)
                ? 11f : 10f;
    }

    private String normaliser(String t) {
        if (t == null) return "";
        return t.toLowerCase()
                .replace("é","e").replace("è","e").replace("ê","e").replace("ë","e")
                .replace("à","a").replace("â","a").replace("î","i").replace("ï","i")
                .replace("ô","o").replace("ù","u").replace("û","u").replace("ç","c")
                .replaceAll("[^a-z0-9/ ]"," ").replaceAll(" +"," ").trim();
    }

    // ═══════════════════════════════════════════════════════
    //  NIVEAU 4 : FALLBACK LEONI (positions calibrées manuellement)
    // ═══════════════════════════════════════════════════════
    private List<ZoneFill> fallbackLeoni(ChampsCertificat c) {
        List<ZoneFill> z = new ArrayList<>();
        if (!c.nomComplet.isEmpty())
            z.add(new ZoneFill(0, 163f, 488f, ascii(c.nomComplet), "NOM_PRENOM", 11f));
        if (c.dateCertif != null)
            z.add(new ZoneFill(0, 217f, 233f, ascii(c.dateCertif), "DATE_CERTIF", 10f));
        if (c.dateExpiration != null)
            z.add(new ZoneFill(0, 190f, 202f, ascii(c.dateExpiration), "DATE_EXPIRATION", 10f));
        return z;
    }

    // ═══════════════════════════════════════════════════════
    //  ÉCRITURE PDF
    // ═══════════════════════════════════════════════════════
    private byte[] ecrireSurPdf(byte[] pdfVide, List<ZoneFill> zones) throws Exception {
        // ✅ PDFBox 2.x : PDDocument.load(byte[])
        try (PDDocument doc = PDDocument.load(pdfVide)) {
            for (ZoneFill z : zones) {
                if (z.page >= doc.getNumberOfPages()) continue;
                PDPage page = doc.getPage(z.page);
                float W = page.getMediaBox().getWidth();
                float H = page.getMediaBox().getHeight();
                if (z.x < 3 || z.x > W - 3 || z.y < 3 || z.y > H - 3) {
                    log.warn("[Certif v8] Hors page {} ({},{})", z.champ, (int)z.x, (int)z.y);
                    continue;
                }
                try (PDPageContentStream cs = new PDPageContentStream(
                        doc, page, PDPageContentStream.AppendMode.APPEND, true, true)) {

                    // ✅ PDFBox 2.x : constantes statiques PDType1Font.HELVETICA_BOLD / HELVETICA
                    //    au lieu de new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD)
                    boolean bold = "NOM_PRENOM".equals(z.champ)
                            || "NOM".equals(z.champ)
                            || "PRENOM".equals(z.champ);
                    PDType1Font font = bold
                            ? PDType1Font.HELVETICA_BOLD   // ✅ PDFBox 2.x
                            : PDType1Font.HELVETICA;        // ✅ PDFBox 2.x

                    cs.setNonStrokingColor(0f, 0f, 0f);
                    cs.beginText();
                    cs.setFont(font, z.fontSize);
                    cs.newLineAtOffset(z.x, z.y);
                    cs.showText(z.valeur);
                    cs.endText();
                    log.info("[Certif v8] ✓ '{}' x={} y={}", z.valeur, (int)z.x, (int)z.y);

                } catch (Exception ex) {
                    log.warn("[Certif v8] Écriture {} : {}", z.champ, ex.getMessage());
                }
            }
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            doc.save(out);
            return out.toByteArray();
        }
    }

    private String ascii(String t) {
        if (t == null) return "";
        return t.replace("é","e").replace("è","e").replace("ê","e").replace("ë","e")
                .replace("à","a").replace("â","a").replace("ä","a")
                .replace("î","i").replace("ï","i").replace("ô","o").replace("ö","o")
                .replace("ù","u").replace("û","u").replace("ü","u").replace("ç","c")
                .replace("É","E").replace("È","E").replace("Ê","E").replace("À","A")
                .replace("Â","A").replace("Î","I").replace("Ô","O").replace("Û","U")
                .replace("Ü","U").replace("Ç","C").replace("œ","oe").replace("æ","ae")
                .replaceAll("[^\\x20-\\x7E]","");
    }

    // ═══════════════════════════════════════════════════════
    //  CLASSES INTERNES
    // ═══════════════════════════════════════════════════════
    private static class CharInfo {
        final char ch; final float x, y, height, width;
        CharInfo(char ch, float x, float y, float h, float w) {
            this.ch=ch; this.x=x; this.y=y; this.height=h; this.width=w;
        }
    }

    private static class Ligne {
        final List<CharInfo> chars;
        final String texte;
        final float yMoy, xMin;
        Ligne(List<CharInfo> src) {
            this.chars = src.stream().sorted(Comparator.comparingDouble(c -> c.x))
                    .collect(Collectors.toList());
            this.texte = chars.stream().map(c -> String.valueOf(c.ch)).collect(Collectors.joining());
            this.yMoy  = (float) src.stream().mapToDouble(c -> c.y).average().orElse(0);
            this.xMin  = (float) src.stream().mapToDouble(c -> c.x).min().orElse(0);
        }
    }

    private static class ZoneFill {
        final int page; final float x, y, fontSize; final String valeur, champ;
        ZoneFill(int p, float x, float y, String v, String c, float fs) {
            page=p; this.x=x; this.y=y; valeur=v; champ=c; fontSize=fs;
        }
    }

    public static class ChampsCertificat {
        public String prenom="", nom="", nomComplet="", matricule="", titre="";
        public String dateCertif=null, dateExpiration=null;
        public String scoreTheorique=null, scorePratique=null;
        public String statut="QUALIFIE(E)", numeroCertif=null;

        public String getValeur(String champ) {
            if (champ == null) return null;
            return switch (champ) {
                case "NOM_PRENOM"      -> nomComplet;
                case "NOM"             -> nom;
                case "PRENOM"          -> prenom;
                case "DATE_CERTIF"     -> dateCertif;
                case "DATE_EXPIRATION" -> dateExpiration;
                case "SCORE_THEO"      -> scoreTheorique;
                case "SCORE_PRAT"      -> scorePratique;
                case "STATUT"          -> statut;
                case "MATRICULE"       -> matricule;
                case "TITRE_CERTIF"    -> titre;
                case "NUMERO_CERTIF"   -> numeroCertif;
                default -> {
                    String low = champ.toLowerCase();
                    if (low.contains("nom") || low.contains("name")) yield nomComplet;
                    if (low.contains("expir") || low.contains("jusqu")) yield dateExpiration;
                    if (low.contains("date")) yield dateCertif;
                    if (low.contains("mat")) yield matricule;
                    yield null;
                }
            };
        }
    }
}