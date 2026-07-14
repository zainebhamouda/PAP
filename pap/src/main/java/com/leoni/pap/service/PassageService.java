package com.leoni.pap.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.leoni.pap.dto.response.PassageResponse;
import com.leoni.pap.entity.*;
import com.leoni.pap.entity.enums.*;
import com.leoni.pap.exception.BusinessException;
import com.leoni.pap.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import java.time.format.DateTimeFormatter;
import com.leoni.pap.dto.request.EnvoyerCertificatChefRequest;
import com.leoni.pap.dto.request.ValiderCertificatChefRequest;

// iText imports (inchangés)
import com.itextpdf.kernel.colors.ColorConstants;
import com.itextpdf.kernel.colors.DeviceRgb;
import com.itextpdf.kernel.font.PdfFont;
import com.itextpdf.kernel.font.PdfFontFactory;
import com.itextpdf.io.font.constants.StandardFonts;
import com.itextpdf.kernel.geom.PageSize;
import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.kernel.pdf.PdfWriter;
import com.itextpdf.kernel.pdf.canvas.PdfCanvas;
import com.itextpdf.kernel.pdf.canvas.draw.SolidLine;
import com.itextpdf.layout.Document;
import com.itextpdf.layout.element.*;
import com.itextpdf.layout.element.Cell;
import com.itextpdf.layout.element.Table;
import com.itextpdf.layout.properties.HorizontalAlignment;
import com.itextpdf.layout.properties.TextAlignment;
import com.itextpdf.layout.properties.UnitValue;
import com.itextpdf.layout.borders.Border;

// PDFBox 2.x imports
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.common.PDRectangle;
import org.apache.pdfbox.pdmodel.font.PDType1Font;
// ✅ SUPPRIMÉ : import org.apache.pdfbox.pdmodel.font.Standard14Fonts;
//    Standard14Fonts n'existe que dans PDFBox 3.x
//    Dans PDFBox 2.x : PDType1Font.HELVETICA_BOLD, PDType1Font.HELVETICA (constantes statiques)

import lombok.extern.slf4j.Slf4j;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class PassageService {

    private final SessionTestService             sessionTestService;
    private final PassageCertificationRepository passageRepo;
    private final CertificationRepository        certifRepo;
    private final SessionTestRepository          sessionRepo;
    private final CablageDefautRepository        cablageRepo;
    private final UtilisateurRepository          utilisateurRepo;
    private final ObjectMapper                   objectMapper;
    private final NotificationService            notificationService;
    private final CertificatIaRemplissageService certifIaService;

    private static final int MAX_TENTATIVES = 1;
    private static final String CERTIFICATS_AUDITEUR_DIR = "uploads/certifiact-auditeur/";

    private static final List<StatutPassage> STATUTS_EN_COURS = List.of(
            StatutPassage.FORMATION_OBLIGATOIRE,
            StatutPassage.THEORIQUE_EN_COURS,
            StatutPassage.PRATIQUE_EN_COURS);

    // ═══════════════════════════════════════════════════════════════════
    // HELPER CENTRAL
    // ═══════════════════════════════════════════════════════════════════
    private Optional<PassageCertification> getPassageEnCours(Integer auditeurId) {
        return passageRepo.findTopEnCoursParAuditeur(auditeurId, STATUTS_EN_COURS);
    }

    // ═══════════════════════════════════════════════════════════════════
    // 1. DÉMARRER / REPRENDRE
    // ═══════════════════════════════════════════════════════════════════
    public PassageResponse demarrer(String matricule) {
        return demarrerPourCertif(matricule, null);
    }

    public PassageResponse demarrerPourCertif(String matricule, Long certificationId) {
        Utilisateur auditeur = getAuditeur(matricule);

        Optional<PassageCertification> bloque = passageRepo
                .findTopByAuditeurIdAndStatutOrderByDateDebutDesc(auditeur.getId(), StatutPassage.BLOQUE);
        if (bloque.isPresent()
                && bloque.get().getDateDeblocage() != null
                && bloque.get().getDateDeblocage().isAfter(LocalDateTime.now())) {
            if (certificationId == null
                    || bloque.get().getCertification().getId().equals(certificationId)) {
                throw new BusinessException(
                        "Accès bloqué jusqu'au " +
                                bloque.get().getDateDeblocage().toLocalDate() +
                                ". Vous avez échoué à l'examen.");
            }
        }

        if (certificationId != null) {
            Optional<PassageCertification> existant = passageRepo
                    .findByAuditeurIdAndCertificationIdAndStatutIn(
                            auditeur.getId(), certificationId, STATUTS_EN_COURS);
            if (existant.isPresent() && existant.get().getStatut() != StatutPassage.ANNULE) {
                return toResponse(existant.get());
            }

            Certification certif = certifRepo.findById(certificationId)
                    .orElseThrow(() -> new BusinessException("Qualification introuvable."));
            if (!Boolean.TRUE.equals(certif.getActif()))
                throw new BusinessException("Cette qualification n'est plus active.");

            List<PassageCertification> existants = passageRepo
                    .findByAuditeurIdAndCertificationId(auditeur.getId(), certificationId);

            boolean dejaPassee = existants.stream()
                    .anyMatch(p -> p.getStatut() != StatutPassage.ANNULE
                            && p.getStatut() != StatutPassage.BLOQUE);

            if (dejaPassee) {
                Optional<PassageCertification> passageBloque = existants.stream()
                        .filter(p -> p.getStatut() == StatutPassage.BLOQUE)
                        .findFirst();
                if (passageBloque.isPresent()) return toResponse(passageBloque.get());
                throw new BusinessException("Vous avez déjà passé cette qualification.");
            }

            PassageCertification passage = PassageCertification.builder()
                    .auditeur(auditeur).certification(certif)
                    .statut(StatutPassage.FORMATION_OBLIGATOIRE)
                    .nbTentativesTheorique(0).nbTentativesPratique(0)
                    .dateDebut(LocalDateTime.now()).build();
            return toResponse(passageRepo.save(passage));
        }

        Optional<PassageCertification> existant = getPassageEnCours(auditeur.getId());
        if (existant.isPresent()) return toResponse(existant.get());

        Certification certif = certifRepo.findAllActives().stream().findFirst()
                .orElseThrow(() -> new BusinessException("Aucune qualification active disponible."));

        PassageCertification passage = PassageCertification.builder()
                .auditeur(auditeur).certification(certif)
                .statut(StatutPassage.FORMATION_OBLIGATOIRE)
                .nbTentativesTheorique(0).nbTentativesPratique(0)
                .dateDebut(LocalDateTime.now()).build();
        return toResponse(passageRepo.save(passage));
    }

    // ═══════════════════════════════════════════════════════════════════
    // 2. PASSER AU TEST THÉORIQUE
    // ═══════════════════════════════════════════════════════════════════
    public PassageResponse passerAuTestTheorique(String matricule) {
        Utilisateur auditeur = getAuditeur(matricule);

        PassageCertification passage = passageRepo
                .findTopEnCoursParAuditeur(auditeur.getId(),
                        List.of(StatutPassage.FORMATION_OBLIGATOIRE))
                .orElseThrow(() -> new BusinessException(
                        "Aucun passage en attente de test théorique."));

        if (passage.getStatut() == StatutPassage.ANNULE) {
            throw new BusinessException("Ce passage a été annulé. Veuillez démarrer une nouvelle qualification.");
        }

        int tentatives = passage.getNbTentativesTheorique() != null
                ? passage.getNbTentativesTheorique() : 0;

        if (tentatives >= MAX_TENTATIVES) {
            passage.setStatut(StatutPassage.BLOQUE);
            passage.setDateDeblocage(LocalDateTime.now().plusMonths(6));
            passage.setDateFin(LocalDateTime.now());
            passageRepo.save(passage);
            throw new BusinessException("Vous avez déjà utilisé votre tentative. Accès bloqué 6 mois.");
        }

        sessionRepo.findByAuditeurAndStatut(auditeur, StatutTestSession.EN_COURS)
                .ifPresent(s -> { s.setStatut(StatutTestSession.ABANDONNE); sessionRepo.save(s); });
        sessionRepo.findByAuditeurAndStatut(auditeur, StatutTestSession.PARTIE1_TERMINEE)
                .ifPresent(s -> { s.setStatut(StatutTestSession.ABANDONNE); sessionRepo.save(s); });

        if (passage.getSessionTest() != null) {
            SessionTest ancienneSession = passage.getSessionTest();
            if (ancienneSession.getStatut() == StatutTestSession.EN_COURS
                    || ancienneSession.getStatut() == StatutTestSession.PARTIE1_TERMINEE) {
                ancienneSession.setStatut(StatutTestSession.ABANDONNE);
                sessionRepo.save(ancienneSession);
            }
            passage.setSessionTest(null);
            passageRepo.save(passage);
        }

        sessionTestService.demarrerSession(matricule, passage.getCertification().getId());

        SessionTest session = sessionRepo
                .findByAuditeurAndStatut(auditeur, StatutTestSession.EN_COURS)
                .orElseThrow(() -> new BusinessException(
                        "Erreur création session théorique. Réessayez."));

        passage.setSessionTest(session);
        passage.setStatut(StatutPassage.THEORIQUE_EN_COURS);
        passage.setNbTentativesTheorique(tentatives + 1);

        return toResponse(passageRepo.save(passage));
    }

    // ═══════════════════════════════════════════════════════════════════
    // 3. TERMINER LE THÉORIQUE
    // ═══════════════════════════════════════════════════════════════════
    public PassageResponse terminerTheorique(Long passageId) {
        PassageCertification passage = getPassage(passageId);

        if (passage.getStatut() != StatutPassage.THEORIQUE_EN_COURS)
            throw new BusinessException("Le test théorique n'est pas en cours.");

        SessionTest session = passage.getSessionTest();
        int score    = session.getPointsObtenus() != null ? session.getPointsObtenus() : 0;
        int seuil    = passage.getCertification().getSeuilTheorique();
        int scorePct = score * 100 / 20;
        boolean reussi = scorePct >= seuil;

        passage.setScoreTheorique(score);
        passage.setTheoriqueReussi(reussi);
        passage.setDateTheorique(LocalDateTime.now());

        if (reussi) {
            passage.setStatut(StatutPassage.PRATIQUE_EN_COURS);
            notificationService.creer(passage.getAuditeur(), TypeNotification.CERTIF_TEST_REUSSI,
                    "Test théorique réussi (" + score + "/20 = " + scorePct
                            + "%, seuil " + seuil + "%). Passez au test pratique.");
        } else {
            passage.setStatut(StatutPassage.BLOQUE);
            passage.setDateDeblocage(LocalDateTime.now().plusMonths(6));
            passage.setDateFin(LocalDateTime.now());
            notificationService.creer(passage.getAuditeur(), TypeNotification.CERTIF_BLOQUE,
                    "Test théorique échoué (" + score + "/20 = " + scorePct
                            + "%, seuil " + seuil + "%). Accès bloqué 6 mois.");
        }

        return toResponse(passageRepo.save(passage));
    }

    // ═══════════════════════════════════════════════════════════════════
    // 4. SOUMETTRE RAPPORT PRATIQUE (JSON)
    // ═══════════════════════════════════════════════════════════════════
    public PassageResponse soumettreRapport(Long passageId, String rapportJson) {
        PassageCertification passage = getPassage(passageId);
        if (passage.getStatut() != StatutPassage.PRATIQUE_EN_COURS)
            throw new BusinessException("Le test pratique n'est pas en cours.");

        TestPratique tp = passage.getCertification().getTestPratique();
        List<CablageDefaut> defautsAttendus = cablageRepo.findByTestPratiqueIdOrderByNumero(tp.getId());
        int nbTotal = defautsAttendus.size();
        int nbCorrects = 0;

        try {
            List<Map<String, Object>> rapport = objectMapper.readValue(
                    rapportJson, new TypeReference<>() {});
            for (Map<String, Object> ligne : rapport) {
                String typeAuditeur = normaliser(ligne.get("typeDefaut"));
                if (typeAuditeur.isEmpty()) continue;
                Object numObj = ligne.get("numero");
                if (numObj == null) continue;
                int num = Integer.parseInt(numObj.toString());
                boolean correct = defautsAttendus.stream()
                        .filter(d -> d.getNumero() != null && d.getNumero() == num)
                        .anyMatch(d -> normaliser(d.getTypeDefaut()).equals(typeAuditeur));
                if (correct) nbCorrects++;
            }
        } catch (Exception e) {
            throw new BusinessException("Format du rapport invalide : " + e.getMessage());
        }

        int seuilPratique = tp.getSeuilReussite() != null ? tp.getSeuilReussite() : 70;
        boolean reussi = nbTotal == 0 || (nbCorrects * 100 / nbTotal) >= seuilPratique;

        passage.setRapportPratiqueJson(rapportJson);
        passage.setNbDefautsIdentifies(nbCorrects);
        passage.setNbDefautsTotal(nbTotal);
        passage.setPratiqueReussi(reussi);
        passage.setDatePratique(LocalDateTime.now());
        passage.setNbTentativesPratique(
                passage.getNbTentativesPratique() != null ? passage.getNbTentativesPratique() + 1 : 1);

        if (reussi) {
            passage.setStatut(StatutPassage.RAPPORT_VALIDE);
            passage.setDateFin(LocalDateTime.now());
            notificationService.creer(passage.getAuditeur(), TypeNotification.CERTIF_PRATIQUE_REUSSI,
                    "Test pratique réussi (" + nbCorrects + "/" + nbTotal + " défauts). Certificat en préparation.");
        } else {
            passage.setStatut(StatutPassage.BLOQUE);
            passage.setDateDeblocage(LocalDateTime.now().plusMonths(6));
            passage.setDateFin(LocalDateTime.now());
            notificationService.creer(passage.getAuditeur(), TypeNotification.CERTIF_BLOQUE,
                    "Test pratique échoué (" + nbCorrects + "/" + nbTotal + ", seuil " + seuilPratique + "%). Bloqué 6 mois.");
        }

        return toResponse(passageRepo.save(passage));
    }

    private String normaliser(Object val) {
        if (val == null) return "";
        return val.toString().trim().toLowerCase();
    }

    // ═══════════════════════════════════════════════════════════════════
    // 5. ENVOYER RAPPORT PDF À L'EXPERT
    // ═══════════════════════════════════════════════════════════════════
    public PassageResponse envoyerRapportPdf(Long passageId, MultipartFile rapportPdf, Long expertId) {
        PassageCertification passage = getPassage(passageId);

        try {
            Path dir = Paths.get("uploads/rapports-pratiques");
            if (!Files.exists(dir)) Files.createDirectories(dir);
            String nomFichier = System.currentTimeMillis() + "_rapport_" + passage.getId() + ".pdf";
            Files.copy(rapportPdf.getInputStream(), dir.resolve(nomFichier));
            passage.setRapportPratiqueJson(nomFichier);
        } catch (IOException e) {
            throw new BusinessException("Erreur lors de la sauvegarde du rapport PDF.");
        }

        passageRepo.save(passage);

        Utilisateur expert = utilisateurRepo.findById(expertId.intValue())
                .orElseThrow(() -> new BusinessException("Expert introuvable."));

        notificationService.creer(expert, TypeNotification.CERTIF_PRATIQUE_PRET,
                "Nouveau rapport pratique à noter : "
                        + passage.getAuditeur().getNom() + " " + passage.getAuditeur().getPrenom()
                        + " (" + passage.getAuditeur().getMatricule() + ") · "
                        + passage.getCertification().getTitre());

        return toResponse(passage);
    }

    // ═══════════════════════════════════════════════════════════════════
    // 6. VALIDER LE RAPPORT PRATIQUE (expert)
    // ═══════════════════════════════════════════════════════════════════
    public PassageResponse validerRapportPratique(Long passageId, boolean valide, String commentaire, Double score) {
        PassageCertification passage = getPassage(passageId);
        if (passage.getStatut() != StatutPassage.PRATIQUE_EN_COURS)
            throw new BusinessException("Ce passage n'est pas en attente de validation pratique.");

        TestPratique tp = passage.getCertification().getTestPratique();
        int seuilPratique = tp != null && tp.getSeuilReussite() != null ? tp.getSeuilReussite() : 70;

        if (score == null)
            throw new BusinessException("Le score pratique est obligatoire (0 à 100%).");

        double scorePct = Math.max(0, Math.min(100, score));
        passage.setNbDefautsIdentifies((int) Math.round(scorePct));
        passage.setNbDefautsTotal(100);
        passage.setScoreExpertSaisi(scorePct);

        if (valide && scorePct < seuilPratique)
            throw new BusinessException("Score insuffisant (" + (int) scorePct + "% < seuil " + seuilPratique + "%). Veuillez cliquer sur Invalider.");

        passage.setDatePratique(LocalDateTime.now());
        passage.setPratiqueReussi(valide);
        passage.setNbTentativesPratique(
                passage.getNbTentativesPratique() != null ? passage.getNbTentativesPratique() + 1 : 1);

        if (valide) {
            passage.setStatut(StatutPassage.RAPPORT_VALIDE);
            passage.setDateFin(LocalDateTime.now());
            passage.setStatutCertificat("NON_GENERE");
            String msg = "Votre rapport pratique a été validé par l'expert ! Score : " + (int) Math.round(scorePct) + "%."
                    + (commentaire != null && !commentaire.isBlank() ? " Commentaire : " + commentaire : "")
                    + " Votre certificat est en cours de préparation.";
            notificationService.creer(passage.getAuditeur(), TypeNotification.CERTIF_PRATIQUE_REUSSI, msg);
        } else {
            passage.setStatut(StatutPassage.BLOQUE);
            passage.setDateDeblocage(LocalDateTime.now().plusMonths(6));
            passage.setDateFin(LocalDateTime.now());
            String msg = "Votre rapport pratique a été invalidé. Score : " + (int) Math.round(score) + "/100."
                    + (commentaire != null && !commentaire.isBlank() ? " Commentaire : " + commentaire : "")
                    + " Accès bloqué 6 mois.";
            notificationService.creer(passage.getAuditeur(), TypeNotification.CERTIF_BLOQUE, msg);
        }
        return toResponse(passageRepo.save(passage));
    }

    public PassageResponse validerRapportPratique(Long passageId, boolean valide, String commentaire) {
        return validerRapportPratique(passageId, valide, commentaire, null);
    }

    // ═══════════════════════════════════════════════════════════════════
    // 7. EXPERT : GÉNÉRER LE CERTIFICAT PDF
    // ═══════════════════════════════════════════════════════════════════
    public PassageResponse genererCertificat(Long passageId, String expertMatricule) {
        PassageCertification passage = getPassage(passageId);

        if (passage.getStatut() != StatutPassage.RAPPORT_VALIDE)
            throw new BusinessException("Le passage doit être au statut REUSSI pour générer le certificat.");

        Utilisateur expert   = getAuditeur(expertMatricule);
        Utilisateur auditeur = passage.getAuditeur();
        Certification certif = passage.getCertification();

        String dateStr    = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd"));
        String nomFichier = sanitize(certif.getTitre()) + "_"
                + sanitize(auditeur.getNom()) + "_"
                + sanitize(auditeur.getPrenom()) + "_"
                + dateStr + ".pdf";

        String outputDir = CERTIFICATS_AUDITEUR_DIR;
        try {
            Path dir = Paths.get(CERTIFICATS_AUDITEUR_DIR);
            if (!Files.exists(dir)) Files.createDirectories(dir);
        } catch (IOException e) {
            outputDir = "uploads/certifiact-auditeur/";
            try { Files.createDirectories(Paths.get(outputDir)); } catch (IOException ignored) {}
        }

        String outputPath = outputDir + nomFichier;

        byte[] pdfBytes = genererPdfAvecIa(passage, outputPath);

        try {
            Files.write(Paths.get(outputPath), pdfBytes);
        } catch (IOException e) {
            try {
                String fallbackDir = "uploads/certificat-auditeur/";
                Files.createDirectories(Paths.get(fallbackDir));
                Files.write(Paths.get(fallbackDir + nomFichier), pdfBytes);
                outputPath = fallbackDir + nomFichier;
            } catch (IOException e2) {
                throw new BusinessException("Erreur sauvegarde du certificat PDF : " + e2.getMessage());
            }
        }

        passage.setCertificatPdfPath(nomFichier);
        passage.setStatutCertificat("GENERE");
        passage.setDateGenerationCertif(LocalDateTime.now());
        passage.setExpertGenerateur(expert);

        passageRepo.save(passage);
        log.info("Certificat généré : {} pour auditeur {}", nomFichier, auditeur.getMatricule());

        return toResponse(passage);
    }

    private byte[] genererPdfAvecIa(PassageCertification passage, String outputPath) {
        Certification certif = passage.getCertification();

        if (certif.getCertificatVideUrl() != null && !certif.getCertificatVideUrl().isBlank()) {
            try {
                Path modelePath = Paths.get(certif.getCertificatVideUrl());
                if (Files.exists(modelePath)) {
                    byte[] pdfVide = Files.readAllBytes(modelePath);
                    return certifIaService.remplirCertificat(pdfVide, passage);
                } else {
                    log.warn("Modèle PDF introuvable : {}", modelePath);
                }
            } catch (IOException e) {
                log.error("Erreur lecture modèle PDF : {}", e.getMessage());
            }
        }

        log.info("Génération du certificat via PDFBox (fallback) pour passage {}", passage.getId());
        return genererPdfFallback(passage);
    }

    /**
     * Génération PDF fallback avec PDFBox 2.x.
     *
     * CORRECTION : utilise PDType1Font.HELVETICA_BOLD et PDType1Font.HELVETICA
     * (constantes statiques de PDFBox 2.x)
     * au lieu de new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD)
     * qui n'existe que dans PDFBox 3.x.
     */
    private byte[] genererPdfFallback(PassageCertification passage) {
        Utilisateur auditeur = passage.getAuditeur();
        Certification certif  = passage.getCertification();
        String clientNom = certif.getClient() != null ? certif.getClient().getNom() : "LEONI";

        try (PDDocument doc = new PDDocument()) {
            PDPage page = new PDPage(PDRectangle.A4);
            doc.addPage(page);

            float W = PDRectangle.A4.getWidth();
            float H = PDRectangle.A4.getHeight();

            try (PDPageContentStream cs = new PDPageContentStream(doc, page)) {

                // Fond navy
                cs.setNonStrokingColor(0.04f, 0.12f, 0.24f);
                cs.addRect(0, 0, W, H);
                cs.fill();

                // Zone blanche intérieure
                cs.setNonStrokingColor(1f, 1f, 1f);
                cs.addRect(20, 20, W - 40, H - 40);
                cs.fill();

                // Bande header navy
                cs.setNonStrokingColor(0.04f, 0.12f, 0.24f);
                cs.addRect(20, H - 120, W - 40, 100);
                cs.fill();

                // ✅ PDFBox 2.x : constantes statiques PDType1Font.HELVETICA_BOLD / HELVETICA
                //    ❌ Supprimé : new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD)
                PDType1Font fontBold = PDType1Font.HELVETICA_BOLD;
                PDType1Font fontReg  = PDType1Font.HELVETICA;

                // Titre
                cs.setNonStrokingColor(0.78f, 0.59f, 0.16f);
                drawCenteredText(cs, fontBold, 20, "CERTIFICAT DE QUALIFICATION PAP", W, H - 65);
                cs.setNonStrokingColor(1f, 1f, 1f);
                drawCenteredText(cs, fontReg, 11, "Product Audit Professional · LEONI", W, H - 85);

                // Qualification
                cs.setNonStrokingColor(0.04f, 0.12f, 0.24f);
                drawCenteredText(cs, fontBold, 13, "Qualification : " + certif.getTitre(), W, H - 155);
                drawCenteredText(cs, fontReg, 11, "Client : " + clientNom, W, H - 175);

                // Auditeur
                cs.setNonStrokingColor(0.6f, 0.6f, 0.6f);
                drawCenteredText(cs, fontReg, 10, "Ce certificat est decerne a", W, H - 220);
                cs.setNonStrokingColor(0.78f, 0.59f, 0.16f);
                String nomAuditeur = auditeur.getNom().toUpperCase() + " " + auditeur.getPrenom();
                drawCenteredText(cs, fontBold, 26, nomAuditeur, W, H - 270);
                cs.setNonStrokingColor(0.04f, 0.12f, 0.24f);
                drawCenteredText(cs, fontReg, 11, "Matricule : " + auditeur.getMatricule(), W, H - 295);

                // Scores
                int theoPct = passage.getScoreTheorique() != null
                        ? passage.getScoreTheorique() * 100 / 20 : 0;
                double pratPct = passage.getScoreExpertSaisi() != null
                        ? passage.getScoreExpertSaisi()
                        : (passage.getNbDefautsIdentifies() != null
                        && passage.getNbDefautsTotal() != null
                        && passage.getNbDefautsTotal() > 0
                        ? (double) passage.getNbDefautsIdentifies() / passage.getNbDefautsTotal() * 100
                        : 0);

                String dateObtention = (passage.getDateFin() != null
                        ? passage.getDateFin()
                        : LocalDateTime.now())
                        .format(DateTimeFormatter.ofPattern("dd/MM/yyyy"));

                String scores = "Score Theorique : " + theoPct + "%   |   Score Pratique : "
                        + (int) Math.round(pratPct) + "%   |   Date : " + dateObtention;
                cs.setNonStrokingColor(0.3f, 0.3f, 0.3f);
                drawCenteredText(cs, fontReg, 10, scores, W, H - 350);

                // Signatures
                String expertNom = passage.getExpertGenerateur() != null
                        ? passage.getExpertGenerateur().getNom() + " " + passage.getExpertGenerateur().getPrenom()
                        : "Expert PAP";
                String chefNom = passage.getChefValidateur() != null
                        ? passage.getChefValidateur().getNom() + " " + passage.getChefValidateur().getPrenom()
                        : "Chef de Service";

                float sigY = H - 430;
                cs.setNonStrokingColor(0.78f, 0.59f, 0.16f);
                drawText(cs, fontBold, 9, "Expert Product Audit", 80, sigY);
                drawText(cs, fontBold, 9, "Chef de Service", W - 200, sigY);
                cs.setNonStrokingColor(0.04f, 0.12f, 0.24f);
                drawText(cs, fontReg, 10, expertNom, 80, sigY - 20);
                drawText(cs, fontReg, 10, chefNom, W - 200, sigY - 20);
            }

            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            doc.save(baos);
            return baos.toByteArray();

        } catch (Exception e) {
            throw new BusinessException("Erreur génération PDF certificat : " + e.getMessage());
        }
    }

    private void drawCenteredText(PDPageContentStream cs, PDType1Font font,
                                  float size, String text, float pageW, float y) throws Exception {
        String safe = securiserTexte(text);
        float tw = font.getStringWidth(safe) / 1000 * size;
        cs.beginText();
        cs.setFont(font, size);
        cs.newLineAtOffset((pageW - tw) / 2, y);
        cs.showText(safe);
        cs.endText();
    }

    private void drawText(PDPageContentStream cs, PDType1Font font,
                          float size, String text, float x, float y) throws Exception {
        cs.beginText();
        cs.setFont(font, size);
        cs.newLineAtOffset(x, y);
        cs.showText(securiserTexte(text));
        cs.endText();
    }

    private String securiserTexte(String txt) {
        if (txt == null) return "";
        return txt.replace("é","e").replace("è","e").replace("ê","e").replace("ë","e")
                .replace("à","a").replace("â","a").replace("ä","a")
                .replace("î","i").replace("ï","i")
                .replace("ô","o").replace("ö","o")
                .replace("ù","u").replace("û","u").replace("ü","u")
                .replace("ç","c")
                .replace("É","E").replace("È","E").replace("Ê","E")
                .replace("À","A").replace("Â","A").replace("Î","I")
                .replace("Ô","O").replace("Û","U").replace("Ü","U").replace("Ç","C")
                .replace("œ","oe").replace("æ","ae")
                .replaceAll("[^\\x20-\\xFF]", "");
    }

    // ═══════════════════════════════════════════════════════════════════
    // 8. EXPERT : ENVOYER LE CERTIFICAT AU CHEF
    // ═══════════════════════════════════════════════════════════════════
    public PassageResponse envoyerCertificatAuChef(Long passageId,
                                                   EnvoyerCertificatChefRequest req,
                                                   String expertMatricule) {
        PassageCertification passage = getPassage(passageId);

        if (!"GENERE".equals(passage.getStatutCertificat()))
            throw new BusinessException("Le certificat doit d'abord être généré avant l'envoi.");

        Integer chefId = req.getChefServiceId().intValue();
        Utilisateur chef = utilisateurRepo.findById(chefId)
                .orElseThrow(() -> new BusinessException("Chef de service introuvable."));
        if (chef.getRole() != RoleUser.CHEF_SERVICE)
            throw new BusinessException("L'utilisateur sélectionné n'est pas un Chef de Service.");

        passage.setChefValidateur(chef);
        passage.setRemarqueExpert(req.getRemarqueExpert());
        passage.setStatutCertificat("EN_ATTENTE_CHEF");
        passage.setCertificatEnvoyeChef(true);
        passageRepo.save(passage);

        Utilisateur auditeur  = passage.getAuditeur();
        Utilisateur expertGen = passage.getExpertGenerateur();
        String expertNom = expertGen != null
                ? expertGen.getNom() + " " + expertGen.getPrenom() : expertMatricule;

        notificationService.creerComplete(
                chef,
                TypeNotification.CERTIF_A_SIGNER_CHEF,
                "Certificat d'auditeur a valider",
                "Le certificat de " + auditeur.getNom() + " " + auditeur.getPrenom()
                        + " (" + auditeur.getMatricule() + ")"
                        + " — Qualification : " + passage.getCertification().getTitre()
                        + " — envoye par l'expert " + expertNom
                        + " attend votre validation."
                        + (req.getRemarqueExpert() != null && !req.getRemarqueExpert().isBlank()
                        ? " Remarque : " + req.getRemarqueExpert() : ""),
                "/chef-service/qualifications",
                passage.getCertification()
        );
        return toResponse(passage);
    }

    // ═══════════════════════════════════════════════════════════════════
    // 9. CHEF : VALIDER OU INVALIDER LE CERTIFICAT
    // ═══════════════════════════════════════════════════════════════════
    public PassageResponse validerCertificatParChef(Long passageId,
                                                    ValiderCertificatChefRequest req,
                                                    String chefMatricule) {
        PassageCertification passage = getPassage(passageId);

        if (!"EN_ATTENTE_CHEF".equals(passage.getStatutCertificat()))
            throw new BusinessException("Ce certificat n'est pas en attente de validation chef.");

        Utilisateur chef = getAuditeur(chefMatricule);
        if (passage.getChefValidateur() == null
                || !passage.getChefValidateur().getId().equals(chef.getId()))
            throw new BusinessException("Vous n'êtes pas le chef désigné pour ce certificat.");

        passage.setDateValidationChef(LocalDateTime.now());
        passage.setCommentaireChef(req.getCommentaireChef());

        Utilisateur auditeur = passage.getAuditeur();
        Certification certif = passage.getCertification();

        if (Boolean.TRUE.equals(req.getValide())) {
            passage.setStatutCertificat("VALIDE_CHEF");
            passage.setStatut(StatutPassage.CERTIFIE);

            String dateValidation = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd"));
            String ancienNom = passage.getCertificatPdfPath();
            if (ancienNom != null) {
                String nomFinal = buildNomCertificat(certif, auditeur, dateValidation);
                for (String dir : new String[]{ CERTIFICATS_AUDITEUR_DIR, "uploads/certifiact-auditeur/" }) {
                    try {
                        Path src = Paths.get(dir + ancienNom);
                        Path dst = Paths.get(dir + nomFinal);
                        if (Files.exists(src) && !Files.exists(dst)) {
                            Files.copy(src, dst);
                            passage.setCertificatPdfPath(nomFinal);
                            break;
                        }
                    } catch (IOException ignored) {}
                }
            }

            notificationService.creerComplete(
                    auditeur, TypeNotification.CERTIF_PDF_DISPONIBLE,
                    "Vous etes qualifie !",
                    "Felicitations ! Votre certificat « " + certif.getTitre()
                            + " » a ete valide par " + chef.getNom() + " " + chef.getPrenom()
                            + ". Vous pouvez telecharger votre certificat.",
                    "/auditeur/certif",
                    certif);

            if (passage.getExpertGenerateur() != null) {
                notificationService.creer(passage.getExpertGenerateur(),
                        TypeNotification.CERTIF_OBTENUE,
                        "Certificat valide — " + auditeur.getNom() + " " + auditeur.getPrenom()
                                + " est maintenant qualifie pour « " + certif.getTitre() + " »."
                                + (req.getCommentaireChef() != null && !req.getCommentaireChef().isBlank()
                                ? " Commentaire : " + req.getCommentaireChef() : ""));
            }

        } else {
            passage.setStatutCertificat("INVALIDE_CHEF");
            passage.setStatut(StatutPassage.BLOQUE);
            passage.setDateDeblocage(LocalDateTime.now().plusMonths(6));

            notificationService.creer(auditeur, TypeNotification.CERTIF_BLOQUE,
                    "Votre certificat « " + certif.getTitre()
                            + " » a ete invalide par " + chef.getNom() + " " + chef.getPrenom() + "."
                            + (req.getCommentaireChef() != null && !req.getCommentaireChef().isBlank()
                            ? " Raison : " + req.getCommentaireChef() : "")
                            + " Acces bloque 6 mois.");

            if (passage.getExpertGenerateur() != null) {
                notificationService.creer(passage.getExpertGenerateur(),
                        TypeNotification.CERTIF_BLOQUE,
                        "Certificat invalide par le chef — " + auditeur.getNom() + " " + auditeur.getPrenom()
                                + " · « " + certif.getTitre() + " »"
                                + (req.getCommentaireChef() != null ? " · Raison : " + req.getCommentaireChef() : ""));
            }
        }
        return toResponse(passageRepo.save(passage));
    }

    // ═══════════════════════════════════════════════════════════════════
    // 10. DÉBLOQUER UN AUDITEUR
    // ═══════════════════════════════════════════════════════════════════
    public PassageResponse debloquerAuditeur(Long passageId, String cause, String expertMatricule) {
        PassageCertification passage = getPassage(passageId);
        if (passage.getStatut() != StatutPassage.BLOQUE)
            throw new BusinessException("Ce passage n'est pas bloqué.");

        Utilisateur auditeur = passage.getAuditeur();
        Certification certif = passage.getCertification();
        String nomCertif = certif != null ? certif.getTitre() : "qualification";

        passage.setCauseDeblocage(cause);
        passage.setStatut(StatutPassage.FORMATION_OBLIGATOIRE);
        passage.setDateDeblocage(null);
        passage.setDateFin(null);
        passage.setDateDebut(LocalDateTime.now());
        passage.setNbTentativesTheorique(0);
        passage.setNbTentativesPratique(0);
        passage.setScoreTheorique(null);
        passage.setTheoriqueReussi(null);
        passage.setDateTheorique(null);
        passage.setPratiqueReussi(null);
        passage.setNbDefautsIdentifies(null);
        passage.setNbDefautsTotal(null);
        passage.setDatePratique(null);
        passage.setRapportPratiqueJson(null);
        passage.setSessionTest(null);

        passageRepo.save(passage);

        notificationService.creerComplete(
                auditeur, TypeNotification.CERTIF_DEBLOQUE,
                "Votre blocage a ete leve",
                "Votre blocage sur « " + nomCertif + " » a ete leve. Vous pouvez reprendre l'examen.",
                "/auditeur/certification", certif);

        String msgSuivi = "Deblocage — " + auditeur.getNom() + " " + auditeur.getPrenom()
                + " (" + auditeur.getMatricule() + ") · " + nomCertif + " · Cause : " + cause;
        utilisateurRepo.findAll().stream()
                .filter(u -> u.getRole() == RoleUser.RESPONSABLE_QUALITE_CENTRALE
                        || u.getRole() == RoleUser.CHEF_SERVICE)
                .forEach(u -> notificationService.creer(u, TypeNotification.CERTIF_DEBLOQUE, msgSuivi));

        return toResponse(passage);
    }

    // ═══════════════════════════════════════════════════════════════════
    // LECTURE
    // ═══════════════════════════════════════════════════════════════════
    @Transactional(readOnly = true)
    public PassageResponse getMonPassageEnCours(String matricule) {
        Utilisateur auditeur = getAuditeur(matricule);
        return getPassageEnCours(auditeur.getId())
                .map(this::toResponse).orElse(null);
    }

    @Transactional(readOnly = true)
    public byte[] getCertificatPdfBytes(Long passageId) {
        PassageCertification passage = getPassage(passageId);

        boolean estQualifie = passage.getStatut() == StatutPassage.CERTIFIE
                || (passage.getStatut() == StatutPassage.RAPPORT_VALIDE
                && "VALIDE_CHEF".equals(passage.getStatutCertificat()));

        if (!estQualifie)
            throw new BusinessException(
                    "Le certificat n'est disponible qu'après validation par le chef de service.");

        String nomFichier = passage.getCertificatPdfPath();
        if (nomFichier == null || nomFichier.isBlank())
            throw new BusinessException("Aucun fichier PDF trouvé pour ce certificat.");

        for (String dir : new String[]{
                CERTIFICATS_AUDITEUR_DIR,
                "uploads/certificat-auditeur/",
                "uploads/certifiact-auditeur/" }) {
            Path filePath = Paths.get(dir + nomFichier);
            if (Files.exists(filePath)) {
                try {
                    return Files.readAllBytes(filePath);
                } catch (IOException e) {
                    throw new BusinessException("Erreur lecture fichier PDF : " + e.getMessage());
                }
            }
        }
        throw new BusinessException("Fichier PDF introuvable : " + nomFichier);
    }

    @Transactional(readOnly = true)
    public List<PassageResponse> getMesPassages(String matricule) {
        Utilisateur auditeur = getAuditeur(matricule);
        return passageRepo.findByAuditeurIdOrderByDateDebutDesc(auditeur.getId())
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<PassageResponse> getPassagesReussis() {
        return passageRepo.findByStatutOrderByDateDebutDesc(StatutPassage.RAPPORT_VALIDE)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<PassageResponse> getPassagesByCertification(Long certifId) {
        return passageRepo.findByCertificationIdOrderByDateDebutDesc(certifId)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<PassageResponse> getAllPassages() {
        return passageRepo.findAll().stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<PassageResponse> getPassagesEnAttenteNotation(String expertMatricule) {
        return passageRepo.findByStatutOrderByDateDebutDesc(StatutPassage.PRATIQUE_EN_COURS)
                .stream()
                .filter(p -> p.getRapportPratiqueJson() != null && !p.getRapportPratiqueJson().isEmpty())
                .map(this::toResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<PassageResponse> getPassagesAvecCertificat(String expertMatricule) {
        Utilisateur expert = getAuditeur(expertMatricule);
        return passageRepo.findByExpertGenerateurIdAndStatutCertificatIn(
                        expert.getId(),
                        List.of("GENERE", "EN_ATTENTE_CHEF", "VALIDE_CHEF", "INVALIDE_CHEF"))
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<PassageResponse> getCertificatsEnAttenteChef(String chefMatricule) {
        Utilisateur chef = getAuditeur(chefMatricule);
        return passageRepo.findCertificatsEnAttenteParChef(chef.getId())
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<PassageResponse> getCertificatsByChef(String chefMatricule) {
        Utilisateur chef = getAuditeur(chefMatricule);
        return passageRepo.findCertificatsByChef(chef.getId())
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<PassageResponse> getAllPassagesForChef() {
        return passageRepo.findAll().stream().map(this::toResponse).collect(Collectors.toList());
    }

    // ═══════════════════════════════════════════════════════════════════
    // GÉNÉRATION PDF (méthode iText — inchangée, utilisée ailleurs)
    // ═══════════════════════════════════════════════════════════════════
    private void genererPdfCertificat(String outputPath,
                                      PassageCertification passage,
                                      Utilisateur expert,
                                      int scoreTheoPct,
                                      double scorePratPct) {
        Utilisateur auditeur = passage.getAuditeur();
        Certification certif  = passage.getCertification();
        String clientNom = certif.getClient() != null ? certif.getClient().getNom() : "LEONI";

        try {
            Path dir = Paths.get(CERTIFICATS_AUDITEUR_DIR);
            if (!Files.exists(dir)) Files.createDirectories(dir);
        } catch (Exception e) {
            outputPath = "uploads/certificats/" + Paths.get(outputPath).getFileName();
            try { Files.createDirectories(Paths.get("uploads/certificats/")); }
            catch (IOException ignored) {}
        }

        try {
            DeviceRgb navy  = new DeviceRgb(11, 30, 61);
            DeviceRgb gold  = new DeviceRgb(200, 152, 42);
            DeviceRgb white = new DeviceRgb(255, 255, 255);

            PdfWriter   writer = new PdfWriter(outputPath);
            PdfDocument pdf    = new PdfDocument(writer);
            Document    doc    = new Document(pdf);

            PageSize ps = PageSize.A4.rotate();
            pdf.setDefaultPageSize(ps);
            doc.setMargins(30, 50, 30, 50);

            PdfCanvas canvas = new PdfCanvas(pdf.getFirstPage());
            canvas.setFillColor(navy);
            canvas.rectangle(0, 0, ps.getWidth(), ps.getHeight());
            canvas.fill();

            canvas.setStrokeColor(gold);
            canvas.setLineWidth(3);
            canvas.rectangle(15, 15, ps.getWidth() - 30, ps.getHeight() - 30);
            canvas.stroke();
            canvas.setLineWidth(1);
            canvas.rectangle(22, 22, ps.getWidth() - 44, ps.getHeight() - 44);
            canvas.stroke();

            PdfFont fontBold = PdfFontFactory.createFont(StandardFonts.HELVETICA_BOLD);
            PdfFont fontReg  = PdfFontFactory.createFont(StandardFonts.HELVETICA);

            doc.add(new Paragraph("\n").setMarginBottom(0));

            doc.add(new Paragraph("LEONI")
                    .setFont(fontBold).setFontSize(14).setFontColor(gold)
                    .setTextAlignment(TextAlignment.CENTER).setMarginBottom(2));

            doc.add(new Paragraph("CERTIFICAT DE QUALIFICATION PAP")
                    .setFont(fontBold).setFontSize(26).setFontColor(white)
                    .setTextAlignment(TextAlignment.CENTER).setMarginBottom(3));

            doc.add(new Paragraph("Product Audit Professional")
                    .setFont(fontReg).setFontSize(12).setFontColor(gold)
                    .setTextAlignment(TextAlignment.CENTER).setMarginBottom(5));

            LineSeparator ls = new LineSeparator(new SolidLine(1.5f));
            ls.setStrokeColor(gold);
            ls.setWidth(350);
            ls.setMarginBottom(15);
            doc.add(ls);

            doc.add(new Paragraph("Qualification : " + certif.getTitre())
                    .setFont(fontBold).setFontSize(15).setFontColor(gold)
                    .setTextAlignment(TextAlignment.CENTER).setMarginBottom(5));

            doc.add(new Paragraph("Client : " + clientNom)
                    .setFont(fontReg).setFontSize(11).setFontColor(white)
                    .setTextAlignment(TextAlignment.CENTER).setMarginBottom(18));

            doc.add(new Paragraph("Ce certificat est décerné à")
                    .setFont(fontReg).setFontSize(11).setFontColor(new DeviceRgb(180, 200, 230))
                    .setTextAlignment(TextAlignment.CENTER).setMarginBottom(5));

            doc.add(new Paragraph(auditeur.getNom().toUpperCase() + " " + auditeur.getPrenom())
                    .setFont(fontBold).setFontSize(30).setFontColor(gold)
                    .setTextAlignment(TextAlignment.CENTER).setMarginBottom(3));

            doc.add(new Paragraph("Matricule : " + auditeur.getMatricule())
                    .setFont(fontReg).setFontSize(11).setFontColor(white)
                    .setTextAlignment(TextAlignment.CENTER).setMarginBottom(18));

            Table table = new Table(UnitValue.createPercentArray(new float[]{1, 1, 1}));
            table.setWidth(UnitValue.createPercentValue(80));
            table.setHorizontalAlignment(HorizontalAlignment.CENTER);
            table.setMarginBottom(20);

            String dateObtention = LocalDateTime.now()
                    .format(DateTimeFormatter.ofPattern("dd/MM/yyyy"));

            String[][] infos = {
                    {"Score Théorique", scoreTheoPct + "%"},
                    {"Score Pratique",  (int) Math.round(scorePratPct) + "%"},
                    {"Date d'obtention", dateObtention},
            };

            for (String[] info : infos) {
                Cell cell = new Cell();
                cell.add(new Paragraph(info[0]).setFont(fontReg).setFontSize(9).setFontColor(gold));
                cell.add(new Paragraph(info[1]).setFont(fontBold).setFontSize(16).setFontColor(white));
                cell.setBorder(Border.NO_BORDER);
                cell.setBackgroundColor(new DeviceRgb(255, 255, 255), 0.07f);
                cell.setPadding(10);
                cell.setTextAlignment(TextAlignment.CENTER);
                table.addCell(cell);
            }
            doc.add(table);

            Table sigTable = new Table(UnitValue.createPercentArray(new float[]{1, 1}));
            sigTable.setWidth(UnitValue.createPercentValue(70));
            sigTable.setHorizontalAlignment(HorizontalAlignment.CENTER);
            sigTable.setMarginBottom(10);

            String expertNomSig = expert.getNom() + " " + expert.getPrenom();
            String chefNomSig = passage.getChefValidateur() != null
                    ? passage.getChefValidateur().getNom() + " " + passage.getChefValidateur().getPrenom()
                    : "Chef de Service";

            for (String[] sig : new String[][]{
                    {"Expert Product Audit", expertNomSig},
                    {"Chef de Service", chefNomSig}}) {
                Cell c = new Cell();
                c.add(new Paragraph("_________________________").setFontColor(gold).setFont(fontReg).setFontSize(10));
                c.add(new Paragraph(sig[0]).setFont(fontBold).setFontSize(9).setFontColor(white));
                c.add(new Paragraph(sig[1]).setFont(fontReg).setFontSize(9).setFontColor(gold));
                c.setBorder(Border.NO_BORDER);
                c.setTextAlignment(TextAlignment.CENTER);
                c.setPadding(8);
                sigTable.addCell(c);
            }
            doc.add(sigTable);
            doc.close();

        } catch (Exception e) {
            throw new BusinessException("Erreur génération PDF certificat : " + e.getMessage());
        }
    }

    // ═══════════════════════════════════════════════════════════════════
    // HELPERS
    // ═══════════════════════════════════════════════════════════════════
    private String sanitize(String s) {
        if (s == null) return "INCONNU";
        return s.trim()
                .replaceAll("[^a-zA-ZÀ-ÿ0-9_\\-]", "_")
                .replaceAll("_{2,}", "_")
                .toUpperCase();
    }

    private String buildNomCertificat(Certification certif, Utilisateur auditeur, String date) {
        return sanitize(certif.getTitre()) + "_"
                + sanitize(auditeur.getNom()) + "_"
                + sanitize(auditeur.getPrenom()) + "_"
                + date + ".pdf";
    }

    private PassageCertification getPassage(Long id) {
        return passageRepo.findById(id)
                .orElseThrow(() -> new BusinessException("Passage introuvable."));
    }

    private Utilisateur getAuditeur(String matricule) {
        return utilisateurRepo.findByMatricule(matricule)
                .orElseThrow(() -> new BusinessException("Auditeur introuvable."));
    }

    // ═══════════════════════════════════════════════════════════════════
    // MAPPING
    // ═══════════════════════════════════════════════════════════════════
    public PassageResponse toResponse(PassageCertification p) {
        PassageResponse r = new PassageResponse();
        r.setId(p.getId());
        r.setStatut(p.getStatut());
        r.setTheoriqueReussi(p.getTheoriqueReussi());
        r.setScoreTheorique(p.getScoreTheorique());
        r.setScoreTheoriqueMax(20);
        if (p.getScoreTheorique() != null)
            r.setScoreTheoriquePct((int) Math.round(p.getScoreTheorique() * 100.0 / 20));
        r.setDateTheorique(p.getDateTheorique());
        r.setNbTentativesTheorique(p.getNbTentativesTheorique() != null ? p.getNbTentativesTheorique() : 0);
        r.setPratiqueReussi(p.getPratiqueReussi());
        r.setNbDefautsIdentifies(p.getNbDefautsIdentifies());
        r.setNbDefautsTotal(p.getNbDefautsTotal());

        if (p.getScoreExpertSaisi() != null) {
            r.setScorePratique(p.getScoreExpertSaisi());
        } else if (p.getNbDefautsIdentifies() != null
                && p.getNbDefautsTotal() != null
                && p.getNbDefautsTotal() > 0
                && p.getNbDefautsTotal() != 100) {
            r.setScorePratique((double) p.getNbDefautsIdentifies() / p.getNbDefautsTotal() * 100.0);
        }

        r.setDatePratique(p.getDatePratique());
        r.setNbTentativesPratique(p.getNbTentativesPratique() != null ? p.getNbTentativesPratique() : 0);
        if (p.getRapportPratiqueJson() != null) {
            r.setRapportPratiqueJson(p.getRapportPratiqueJson());
            r.setRapportPdfNom(p.getRapportPratiqueJson());
        }
        r.setDateDebut(p.getDateDebut());
        r.setDateFin(p.getDateFin());
        r.setDateDeblocage(p.getDateDeblocage());
        r.setCauseDeblocage(p.getCauseDeblocage());
        r.setBloque(p.getStatut() == StatutPassage.BLOQUE);
        r.setAnnule(p.getStatut() == StatutPassage.ANNULE);
        r.setPeutReessayerTheorique(false);
        r.setPeutReessayerPratique(false);
        if (p.getSessionTest() != null)
            r.setSessionTestId(p.getSessionTest().getId());
        if (p.getAuditeur() != null) {
            r.setAuditeurNom(p.getAuditeur().getNom() + " " + p.getAuditeur().getPrenom());
            r.setAuditeurMatricule(p.getAuditeur().getMatricule());
        }
        if (p.getCertification() != null) {
            r.setCertificationTitre(p.getCertification().getTitre());
            r.setSeuilTheorique(p.getCertification().getSeuilTheorique());
            r.setFormationUrl(p.getCertification().getFormationUrl());
            r.setFormationNom(p.getCertification().getFormationNom());
            if (p.getCertification().getTestPratique() != null)
                r.setSeuilPratique(p.getCertification().getTestPratique().getSeuilReussite());
        }
        if (p.getCertificat() != null)
            r.setCertificatId(p.getCertificat().getId());

        r.setStatutCertificat(p.getStatutCertificat() != null ? p.getStatutCertificat() : "NON_GENERE");
        r.setCertificatPdfPath(p.getCertificatPdfPath());
        r.setCertificatEnvoyeChef(p.getCertificatEnvoyeChef());
        r.setRemarqueExpert(p.getRemarqueExpert());
        r.setDateGenerationCertif(p.getDateGenerationCertif());
        r.setDateValidationChef(p.getDateValidationChef());
        r.setCommentaireChef(p.getCommentaireChef());
        if (p.getChefValidateur() != null) {
            r.setChefValidateurNom(p.getChefValidateur().getNom() + " " + p.getChefValidateur().getPrenom());
            r.setChefValidateurId(p.getChefValidateur().getId().toString());
        }
        if (p.getExpertGenerateur() != null)
            r.setExpertGenerateurNom(p.getExpertGenerateur().getNom() + " " + p.getExpertGenerateur().getPrenom());

        return r;
    }
}