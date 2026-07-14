package com.leoni.pap.service;

import com.leoni.pap.dto.request.CreerCertificationRequest;
import com.leoni.pap.dto.response.CertificationResponse;
import com.leoni.pap.dto.response.TestPratiqueResponse;
import com.leoni.pap.dto.response.TestTheoriqueResponse;
import com.leoni.pap.entity.*;
import com.leoni.pap.entity.enums.*;
import com.leoni.pap.exception.BusinessException;
import com.leoni.pap.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.common.PDRectangle;
import org.apache.pdfbox.pdmodel.font.PDType1Font;
import com.leoni.pap.dto.response.ClassementAuditeurResponse;
import com.leoni.pap.entity.enums.StatutPassage;
import java.util.Comparator;
import java.util.List;
import com.leoni.pap.entity.enums.StatutPassage;
import java.util.stream.Collectors;
import java.util.concurrent.atomic.AtomicInteger;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.leoni.pap.dto.response.TestPratiqueAuditeurResponse;
import com.leoni.pap.dto.response.ClassementAuditeurResponse;
import java.util.LinkedHashMap;
import java.time.LocalDateTime;


import java.io.ByteArrayOutputStream;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.time.LocalDateTime;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class CertificationService {

    private final CertificationRepository        certifRepo;
    private final TestTheoriqueRepository        testTheoriqueRepo;
    private final TestPratiqueRepository         testPratiqueRepo;
    private final CablageDefautRepository        cablageRepo;
    private final QuestionTestRepository         questionRepo;
    private final UtilisateurRepository          utilisateurRepo;
    private final ClientRepository               clientRepo;
    private final TestTheoriqueService           testTheoriqueService;
    private final TestPratiqueService            testPratiqueService;
    private final PassageCertificationRepository passageRepo;
    private final NotificationService            notificationService;
    private final CertificatIaRemplissageService certifIaService;
    private final NotificationRepository         notificationRepo;

    // ═════════════════════════════════════════════════════════
    // CONFIRMER LA CERTIFICATION
    // ═════════════════════════════════════════════════════════
    public CertificationResponse confirmerCertification(CreerCertificationRequest req, String matricule) {
        Utilisateur expert = getExpert(matricule);

        String nomClient = "";
        if (req.getClientId() != null) {
            nomClient = clientRepo.findById(req.getClientId())
                    .map(c -> " " + c.getNom())
                    .orElse("");
        }
        String titreEffectif = (req.getTitre() != null && !req.getTitre().isBlank())
                ? req.getTitre()
                : "Qualification" + nomClient + " " + LocalDateTime.now().format(
                DateTimeFormatter.ofPattern("dd/MM/yyyy"));

        if (req.getTestTheoriqueId() == null)
            throw new BusinessException("Veuillez configurer le test théorique.");

        TestTheorique tt = testTheoriqueRepo.findById(req.getTestTheoriqueId())
                .orElseThrow(() -> new BusinessException("Test théorique introuvable."));

        if (!Boolean.TRUE.equals(tt.getActif())) {
            tt.setActif(true);
            tt.setDateActivation(LocalDateTime.now());
            testTheoriqueRepo.save(tt);
        }
        if (tt.getSeuilReussite() == null)
            throw new BusinessException("Le test théorique n'a pas de seuil de réussite défini.");

        long nbImage = questionRepo.findByTestTheoriqueIdAndTypeOrderByOrdreAsc(
                tt.getId(), TypeQuestionTest.IMAGE_DEFAUT).size();
        long nbQCM = questionRepo.countByTestTheoriqueIdAndTypeAndDansPoolTrue(
                tt.getId(), TypeQuestionTest.QCM);

        if (nbImage < 10)
            throw new BusinessException(
                    "Le test théorique doit avoir au moins 10 questions IMAGE (actuellement : " + nbImage + ").");
        if (nbQCM < 10)
            throw new BusinessException(
                    "Le test théorique doit avoir au moins 10 questions QCM (actuellement : " + nbQCM + ").");

        if (req.getTestPratiqueId() == null)
            throw new BusinessException("Veuillez configurer le test pratique.");

        TestPratique tp = testPratiqueRepo.findById(req.getTestPratiqueId())
                .orElseThrow(() -> new BusinessException("Test pratique introuvable."));

        if (!Boolean.TRUE.equals(tp.getActif())) {
            tp.setActif(true);
            tp.setDateActivation(LocalDateTime.now());
            testPratiqueRepo.save(tp);
        }

        if (tp.getSeuilReussite() == null)
            throw new BusinessException("Le test pratique n'a pas de seuil de réussite défini.");

        Certification certif = Certification.builder()
                .titre(titreEffectif)
                .testTheorique(tt)
                .testPratique(tp)
                .expert(expert)
                .seuilTheorique(tt.getSeuilReussite())
                .statut(StatutCertification.EN_ATTENTE)
                .actif(false)
                .brouillon(false)
                .dateExpiration(LocalDateTime.now().plusYears(2))
                .notifJ30Envoyee(false)
                .notifJ7Envoyee(false)
                .dateCreation(LocalDateTime.now())
                .build();

        if (req.getClientId() != null) {
            clientRepo.findById(req.getClientId()).ifPresent(certif::setClient);
        }

        try {
            List<Certification> brouillons = certifRepo
                    .findAllByExpertIdAndBrouillonTrue(expert.getId().longValue());
            if (!brouillons.isEmpty()) {
                for (Certification b : brouillons) {
                    List<PassageCertification> passages = passageRepo.findByCertificationId(b.getId());
                    if (!passages.isEmpty()) {
                        passageRepo.deleteAll(passages);
                    }
                }
                passageRepo.flush();
                certifRepo.deleteAll(brouillons);
                certifRepo.flush();
            }
        } catch (Exception e) {
            log.warn("Impossible de supprimer les brouillons : {}", e.getMessage());
        }

        return toResponse(certifRepo.save(certif));
    }

    public CertificationResponse fixerFormation(Long certifId, String formationUrl, String formationNom) {
        Certification certif = getCertif(certifId);
        if (formationUrl != null) certif.setFormationUrl(formationUrl);
        if (formationNom != null) certif.setFormationNom(formationNom);
        return toResponse(certifRepo.save(certif));
    }

    // ═════════════════════════════════════════════════════════
    // ACTIVER UNE CERTIFICATION
    // ═════════════════════════════════════════════════════════
    public CertificationResponse activerCertification(Long certifId) {
        Certification certif = getCertif(certifId);

        if (certif.getTestTheorique() == null)
            throw new BusinessException("Pas de test théorique associé à cette certification.");
        if (certif.getTestPratique() == null)
            throw new BusinessException("Pas de test pratique associé à cette certification.");

        long nbImage = questionRepo.findByTestTheoriqueIdAndTypeOrderByOrdreAsc(
                certif.getTestTheorique().getId(), TypeQuestionTest.IMAGE_DEFAUT).size();
        long nbQCM = questionRepo.countByTestTheoriqueIdAndTypeAndDansPoolTrue(
                certif.getTestTheorique().getId(), TypeQuestionTest.QCM);
        if (nbImage < 10 || nbQCM < 10)
            throw new BusinessException(
                    "Le test théorique doit avoir au moins 10 questions image et 10 QCM.");

        certif.setActif(true);
        certif.setDateActivation(LocalDateTime.now());
        certif.setDateExpiration(LocalDateTime.now().plusYears(2));
        return toResponse(certifRepo.save(certif));
    }

    // ═════════════════════════════════════════════════════════
    // DÉSACTIVER UNE CERTIFICATION
    // ═════════════════════════════════════════════════════════
    public CertificationResponse desactiverCertification(Long certifId) {
        Certification certif = getCertif(certifId);
        certif.setActif(false);
        certif.setDateDesactivation(LocalDateTime.now());
        certifRepo.save(certif);

        List<StatutPassage> statutsEnCours = List.of(
                StatutPassage.FORMATION_OBLIGATOIRE,
                StatutPassage.THEORIQUE_EN_COURS,
                StatutPassage.PRATIQUE_EN_COURS);

        List<PassageCertification> passagesActifs =
                passageRepo.findByCertificationIdAndStatutInOrderByDateDebutDesc(certifId, statutsEnCours);

        for (PassageCertification p : passagesActifs) {
            p.setStatut(StatutPassage.ANNULE);
            p.setDateFin(LocalDateTime.now());
            notificationService.creer(
                    p.getAuditeur(),
                    TypeNotification.CERTIF_BLOQUE,
                    "La qualification « " + certif.getTitre() + " » a été désactivée par l'expert. "
                            + "Votre passage en cours a été annulé. "
                            + "Si la qualification est réactivée, elle réapparaîtra dans votre liste.");
        }
        if (!passagesActifs.isEmpty()) passageRepo.saveAll(passagesActifs);

        return toResponse(certif);
    }

    // ═════════════════════════════════════════════════════════
    // MODIFIER
    // ═════════════════════════════════════════════════════════
    public CertificationResponse modifierCertification(Long certifId, CreerCertificationRequest req) {
        Certification certif = getCertif(certifId);

        if (req.getTitre() != null && !req.getTitre().isBlank())
            certif.setTitre(req.getTitre());

        if (req.getClientId() != null) {
            clientRepo.findById(req.getClientId()).ifPresent(certif::setClient);
        }
        if (req.getClientId() != null && req.getClientId() <= 0) {
            certif.setClient(null);
        }

        if (req.getTestTheoriqueId() != null) {
            TestTheorique tt = testTheoriqueRepo.findById(req.getTestTheoriqueId())
                    .orElseThrow(() -> new BusinessException("Test théorique introuvable."));
            certif.setTestTheorique(tt);
            if (tt.getSeuilReussite() != null)
                certif.setSeuilTheorique(tt.getSeuilReussite());
        }

        if (req.getTestPratiqueId() != null) {
            TestPratique tp = testPratiqueRepo.findById(req.getTestPratiqueId())
                    .orElseThrow(() -> new BusinessException("Test pratique introuvable."));
            certif.setTestPratique(tp);
        }

        if (req.getFormationUrl() != null)
            certif.setFormationUrl(req.getFormationUrl().isBlank() ? null : req.getFormationUrl());
        if (req.getFormationNom() != null)
            certif.setFormationNom(req.getFormationNom().isBlank() ? null : req.getFormationNom());

        return toResponse(certifRepo.save(certif));
    }

    // ═════════════════════════════════════════════════════════
    // SUPPRIMER
    // ═════════════════════════════════════════════════════════
    public void supprimerCertification(Long certifId) {
        Certification certif = getCertif(certifId);

        if (Boolean.TRUE.equals(certif.getActif()))
            throw new BusinessException("Impossible de supprimer une certification active.");

        notificationRepo.deleteByCertificationId(certifId);
        notificationRepo.flush();

        List<PassageCertification> passages = passageRepo.findByCertificationId(certifId);
        if (!passages.isEmpty()) {
            passageRepo.deleteAll(passages);
            passageRepo.flush();
        }

        certifRepo.delete(certif);
    }

    // ═════════════════════════════════════════════════════════
    // LISTES
    // ═════════════════════════════════════════════════════════
    @Transactional(readOnly = true)
    public List<TestTheoriqueResponse> getTestsTheoriquesPourChoix() {
        java.util.Set<String> seen = new java.util.LinkedHashSet<>();
        return testTheoriqueRepo.findAllByOrderByDateCreationDesc()
                .stream()
                .filter(t -> t.getTitre() != null && seen.add(t.getTitre()))
                .map(testTheoriqueService::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<TestPratiqueResponse> getTestsPratiquesPourChoix() {
        java.util.Set<String> seen = new java.util.LinkedHashSet<>();
        return testPratiqueRepo.findAllByOrderByDateCreationDesc()
                .stream()
                .filter(t -> t.getTitre() != null && seen.add(t.getTitre()))
                .map(testPratiqueService::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public CertificationResponse getCertificationActive() {
        return certifRepo.findByActifTrue()
                .map(this::toResponse)
                .orElseThrow(() -> new BusinessException("Aucune certification active."));
    }

    @Transactional(readOnly = true)
    public List<CertificationResponse> getAllCertificationsActives() {
        return certifRepo.findAllActives()
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<CertificationResponse> getCertificationsDisponiblesPourAuditeur(String matricule) {
        Utilisateur auditeur = utilisateurRepo.findByMatricule(matricule)
                .orElseThrow(() -> new BusinessException("Auditeur introuvable."));
        return certifRepo.findActivesNonPasseesPar(auditeur.getId())
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public CertificationResponse getCertificationById(Long id) {
        return toResponse(getCertif(id));
    }

    @Transactional(readOnly = true)
    public List<CertificationResponse> getAllCertifications() {
        return certifRepo.findAllConfirmees()
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<CertificationResponse> getMesCertifications(String matricule) {
        Utilisateur expert = getExpert(matricule);
        return certifRepo.findByExpertIdOrderByDateCreationDesc(expert.getId())
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    public CertificationResponse sauvegarderBrouillon(CreerCertificationRequest req, String matricule) {
        Utilisateur expert = getExpert(matricule);

        // ✅ Créer un NOUVEAU brouillon
        Certification brouillon = new Certification();
        brouillon.setTitre(req.getTitre() != null && !req.getTitre().isBlank()
                ? req.getTitre()
                : "Brouillon " + System.currentTimeMillis());
        brouillon.setExpert(expert);
        brouillon.setBrouillon(true);
        brouillon.setActif(false);
        brouillon.setDateCreation(LocalDateTime.now());

        if (req.getTestTheoriqueId() != null) {
            testTheoriqueRepo.findById(req.getTestTheoriqueId()).ifPresent(brouillon::setTestTheorique);
        }
        if (req.getTestPratiqueId() != null) {
            testPratiqueRepo.findById(req.getTestPratiqueId()).ifPresent(brouillon::setTestPratique);
        }
        if (req.getClientId() != null && req.getClientId() > 0) {
            clientRepo.findById(req.getClientId()).ifPresent(brouillon::setClient);
        }
        if (req.getFormationUrl() != null) {
            brouillon.setFormationUrl(req.getFormationUrl());
        }
        if (req.getFormationNom() != null) {
            brouillon.setFormationNom(req.getFormationNom());
        }

        // ⚠️ Sans les champs certificatVideUrl/Nom, ne pas les utiliser

        return toResponse(certifRepo.save(brouillon));
    }

    @Transactional(readOnly = true)
    public CertificationResponse getMonBrouillon(String matricule) {
        Utilisateur expert = getExpert(matricule);
        return certifRepo
                .findFirstByExpertIdAndBrouillonTrueOrderByDateCreationDesc(expert.getId().longValue())
                .map(this::toResponse).orElse(null);
    }

    // ═════════════════════════════════════════════════════════
    // FICHIERS
    // ═════════════════════════════════════════════════════════
    public CertificationResponse copierFormation(Long certifId, String formationUrl, String formationNom) {
        Certification certif = getCertif(certifId);
        certif.setFormationUrl(formationUrl);
        certif.setFormationNom(formationNom);
        return toResponse(certifRepo.save(certif));
    }

    @Transactional(readOnly = true)
    public List<java.util.Map<String, String>> listerModelesCertificats() {
        try {
            for (String dir : new String[]{"uploads/certificats", "uploads/certifiacts"}) {
                java.nio.file.Path repertoire = java.nio.file.Paths.get(dir);
                if (!java.nio.file.Files.exists(repertoire)) continue;

                java.util.Set<String> seen = new java.util.LinkedHashSet<>();
                java.util.List<java.util.Map<String, String>> result = new java.util.ArrayList<>();

                java.nio.file.Files.list(repertoire)
                        .filter(p -> p.toString().toLowerCase().endsWith(".pdf"))
                        .sorted(java.util.Comparator.reverseOrder())
                        .forEach(path -> {
                            String nomFichier = path.getFileName().toString();
                            String nomOriginal = nomFichier.replaceFirst("^[0-9]+_", "");
                            if (seen.add(nomOriginal)) {
                                java.util.Map<String, String> f = new java.util.LinkedHashMap<>();
                                f.put("certifNom", nomOriginal);
                                f.put("certifUrl", dir + "/" + nomFichier);
                                result.add(f);
                            }
                        });

                if (!result.isEmpty()) return result;
            }
            return java.util.Collections.emptyList();
        } catch (Exception e) {
            return java.util.Collections.emptyList();
        }
    }

    public CertificationResponse copierCertificatVide(Long certifId, String certifUrl, String certifNom) {
        Certification certif = getCertif(certifId);
        if (certifUrl != null) certif.setCertificatVideUrl(certifUrl);
        if (certifNom != null) certif.setCertificatVideNom(certifNom);
        return toResponse(certifRepo.save(certif));
    }

    public CertificationResponse uploadFormation(Long certifId, String base64, String nomFichier) {
        Certification certif = getCertif(certifId);
        String url = sauvegarderBase64(base64, nomFichier, "formations");
        certif.setFormationUrl(url);
        certif.setFormationNom(nomFichier);
        return toResponse(certifRepo.save(certif));
    }

    public CertificationResponse uploadCertificatVide(Long certifId, String base64, String nomFichier) {
        Certification certif = getCertif(certifId);
        String url = sauvegarderBase64(base64, nomFichier, "certificats");
        certif.setCertificatVideUrl(url);
        certif.setCertificatVideNom(nomFichier);
        return toResponse(certifRepo.save(certif));
    }

    @Transactional(readOnly = true)
    public List<java.util.Map<String, String>> listerFichiersFormations() {
        try {
            java.nio.file.Path repertoire = java.nio.file.Paths.get("uploads/formations");
            if (!java.nio.file.Files.exists(repertoire)) return java.util.Collections.emptyList();

            java.util.Set<String> seen = new java.util.LinkedHashSet<>();
            java.util.List<java.util.Map<String, String>> result = new java.util.ArrayList<>();

            java.nio.file.Files.list(repertoire)
                    .sorted(java.util.Comparator.reverseOrder())
                    .forEach(path -> {
                        String nomFichier = path.getFileName().toString();
                        String nomOriginal = nomFichier.replaceFirst("^[0-9]+_", "");
                        if (seen.add(nomOriginal)) {
                            java.util.Map<String, String> f = new java.util.LinkedHashMap<>();
                            f.put("formationNom", nomOriginal);
                            f.put("formationUrl", "uploads/formations/" + nomFichier);
                            result.add(f);
                        }
                    });

            return result;
        } catch (Exception e) {
            return java.util.Collections.emptyList();
        }
    }

    private String sauvegarderBase64(String base64, String nomOriginal, String sousRepertoire) {
        try {
            java.nio.file.Path repertoire = java.nio.file.Paths.get("uploads/" + sousRepertoire);
            if (!java.nio.file.Files.exists(repertoire))
                java.nio.file.Files.createDirectories(repertoire);
            String nomFichier = System.currentTimeMillis()
                    + "_" + nomOriginal.replaceAll("[^a-zA-Z0-9._-]", "_");
            byte[] bytes = java.util.Base64.getDecoder().decode(base64);
            java.nio.file.Files.write(repertoire.resolve(nomFichier), bytes);
            return "uploads/" + sousRepertoire + "/" + nomFichier;
        } catch (Exception e) {
            throw new BusinessException("Erreur sauvegarde fichier : " + e.getMessage());
        }
    }

    // ═════════════════════════════════════════════════════════
    // CERTIFICAT PDF — PDFBox 2.x (corrigé)
    // ═════════════════════════════════════════════════════════
    public byte[] getCertificatPdf(Long passageId) {
        PassageCertification passage = passageRepo.findById(passageId)
                .orElseThrow(() -> new BusinessException("Passage introuvable."));

        if (!StatutPassage.RAPPORT_VALIDE.equals(passage.getStatut())) {
            throw new BusinessException("Seul un passage réussi génère un certificat.");
        }

        Certification certif = passage.getCertification();
        Utilisateur auditeur = passage.getAuditeur();

        // Si un modèle PDF vide existe → IA le remplit automatiquement
        if (certif.getCertificatVideUrl() != null) {
            try {
                java.nio.file.Path pdfPath = java.nio.file.Paths.get(certif.getCertificatVideUrl());
                if (java.nio.file.Files.exists(pdfPath)) {
                    byte[] pdfVide = java.nio.file.Files.readAllBytes(pdfPath);
                    return certifIaService.remplirCertificat(pdfVide, passage);
                }
            } catch (Exception e) {
                log.warn("Remplissage IA certif echoue, fallback PDFBox: {}", e.getMessage());
            }
        }

        // ── Génération PDFBox 2.x ──────────────────────────────────────────
        // CORRECTION : PDFBox 2.x utilise des constantes statiques pour les polices
        //   ✅ PDType1Font.HELVETICA_BOLD    (PDFBox 2.x)
        //   ❌ new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD)  (PDFBox 3.x uniquement)
        try (PDDocument doc = new PDDocument()) {
            PDPage page = new PDPage(PDRectangle.A4);
            doc.addPage(page);

            try (PDPageContentStream cs = new PDPageContentStream(doc, page)) {
                float W = PDRectangle.A4.getWidth();   // 595
                float H = PDRectangle.A4.getHeight();  // 842

                // ── Fond navy ──
                cs.setNonStrokingColor(0.04f, 0.12f, 0.24f);
                cs.addRect(0, 0, W, H);
                cs.fill();

                // ── Fond blanc intérieur ──
                cs.setNonStrokingColor(1f, 1f, 1f);
                cs.addRect(20, 20, W - 40, H - 40);
                cs.fill();

                // ── Bande header navy ──
                cs.setNonStrokingColor(0.04f, 0.12f, 0.24f);
                cs.addRect(20, H - 120, W - 40, 100);
                cs.fill();

                // ── Titre header ──
                cs.beginText();
                cs.setFont(PDType1Font.HELVETICA_BOLD, 22); // ✅ PDFBox 2.x
                cs.setNonStrokingColor(1f, 1f, 1f);
                cs.newLineAtOffset(40, H - 75);
                cs.showText("CERTIFICAT DE QUALIFICATION");
                cs.endText();

                cs.beginText();
                cs.setFont(PDType1Font.HELVETICA, 11); // ✅ PDFBox 2.x
                cs.setNonStrokingColor(0.7f, 0.8f, 0.9f);
                cs.newLineAtOffset(40, H - 100);
                cs.showText("LEONI Wire Harness - Product Audit Qualification");
                cs.endText();

                DateTimeFormatter fmt = DateTimeFormatter.ofPattern("dd/MM/yyyy");

                // ── Sous-titre ──
                cs.beginText();
                cs.setFont(PDType1Font.HELVETICA, 12); // ✅ PDFBox 2.x
                cs.setNonStrokingColor(0.4f, 0.4f, 0.4f);
                cs.newLineAtOffset(40, H - 180);
                cs.showText("Ce certificat atteste que :");
                cs.endText();

                // ── Nom auditeur ──
                String nomComplet = auditeur.getPrenom() + " " + auditeur.getNom();
                cs.beginText();
                cs.setFont(PDType1Font.HELVETICA_BOLD, 26); // ✅ PDFBox 2.x
                cs.setNonStrokingColor(0.04f, 0.12f, 0.24f);
                cs.newLineAtOffset(40, H - 230);
                cs.showText(nomComplet);
                cs.endText();

                // ── Ligne de séparation ──
                cs.setStrokingColor(0.14f, 0.40f, 0.70f);
                cs.setLineWidth(2);
                cs.moveTo(40, H - 250);
                cs.lineTo(W - 40, H - 250);
                cs.stroke();

                // ── Infos ──
                float y     = H - 290;
                float lineH = 35;

                String[][] infos = {
                        {"Matricule",         auditeur.getMatricule() != null ? auditeur.getMatricule() : "—"},
                        {"Qualification",     certif.getTitre()},
                        {"Date d'obtention",  passage.getDateFin() != null ? passage.getDateFin().format(fmt) : "—"},
                        {"Valable jusqu'au",  certif.getDateExpiration() != null ? certif.getDateExpiration().format(fmt) : "—"},
                        {"Numero certificat", certif.getNumeroCertificat() != null ? certif.getNumeroCertificat() : "—"},
                };

                for (String[] info : infos) {
                    // Label (gris, petite taille)
                    cs.beginText();
                    cs.setFont(PDType1Font.HELVETICA_BOLD, 10); // ✅ PDFBox 2.x
                    cs.setNonStrokingColor(0.4f, 0.4f, 0.4f);
                    cs.newLineAtOffset(40, y);
                    cs.showText(info[0].toUpperCase());
                    cs.endText();

                    // Valeur (navy, grande taille)
                    cs.beginText();
                    cs.setFont(PDType1Font.HELVETICA_BOLD, 13); // ✅ PDFBox 2.x
                    cs.setNonStrokingColor(0.04f, 0.12f, 0.24f);
                    cs.newLineAtOffset(180, y);
                    cs.showText(info[1]);
                    cs.endText();

                    y -= lineH;
                }

                // ── Footer navy ──
                cs.setNonStrokingColor(0.04f, 0.12f, 0.24f);
                cs.addRect(20, 20, W - 40, 50);
                cs.fill();

                cs.beginText();
                cs.setFont(PDType1Font.HELVETICA, 9); // ✅ PDFBox 2.x
                cs.setNonStrokingColor(0.7f, 0.8f, 0.9f);
                cs.newLineAtOffset(40, 45);
                cs.showText("LEONI Wire Harness Tunisia - Document officiel de qualification PAP");
                cs.endText();

                cs.beginText();
                cs.setFont(PDType1Font.HELVETICA, 9); // ✅ PDFBox 2.x
                cs.setNonStrokingColor(0.7f, 0.8f, 0.9f);
                cs.newLineAtOffset(W - 200, 45);
                cs.showText("Genere le : " + LocalDateTime.now().format(fmt));
                cs.endText();
            }

            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            doc.save(baos);
            return baos.toByteArray();

        } catch (Exception e) {
            log.error("Erreur generation PDF certificat passageId={} : {}", passageId, e.getMessage(), e);
            return genererCertificatTexte(passage);
        }
    }

    private byte[] genererCertificatTexte(PassageCertification passage) {
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("dd/MM/yyyy");
        String contenu = String.format(
                "CERTIFICAT DE QUALIFICATION\n==========================\n" +
                        "Auditeur: %s %s (%s)\n" +
                        "Qualification: %s\n" +
                        "Date d'obtention: %s\n" +
                        "Valide jusqu'au: %s\n" +
                        "Numero: %s\n",
                passage.getAuditeur().getPrenom(),
                passage.getAuditeur().getNom(),
                passage.getAuditeur().getMatricule(),
                passage.getCertification().getTitre(),
                passage.getDateFin() != null ? passage.getDateFin().format(fmt) : "—",
                passage.getCertification().getDateExpiration() != null
                        ? passage.getCertification().getDateExpiration().format(fmt) : "—",
                passage.getCertification().getNumeroCertificat() != null
                        ? passage.getCertification().getNumeroCertificat() : "—"
        );
        return contenu.getBytes();
    }

    // ═════════════════════════════════════════════════════════
    // DASHBOARD AUDITEUR
    // ═════════════════════════════════════════════════════════
    @Transactional(readOnly = true)
    public Map<String, Object> getDashboardAuditeur(String matricule) {
        Utilisateur auditeur = utilisateurRepo.findByMatricule(matricule)
                .orElseThrow(() -> new BusinessException("Auditeur introuvable."));

        Map<String, Object> dashboard = new HashMap<>();

        List<CertificationResponse> actives = certifRepo.findAllActives()
                .stream().map(this::toResponse).collect(Collectors.toList());
        dashboard.put("certificationsActives", actives);
        dashboard.put("certificationActive", actives.isEmpty() ? null : actives.get(0));

        List<StatutPassage> statutsEnCours = List.of(
                StatutPassage.FORMATION_OBLIGATOIRE,
                StatutPassage.THEORIQUE_EN_COURS,
                StatutPassage.PRATIQUE_EN_COURS);
        Optional<PassageCertification> passageEnCours = passageRepo
                .findByAuditeurIdAndStatutIn(auditeur.getId(), statutsEnCours);
        dashboard.put("passageEnCoursId", passageEnCours.map(PassageCertification::getId).orElse(null));

        LocalDateTime date30j = LocalDateTime.now().minusDays(30);
        long nbPassages30j = passageRepo.findByAuditeurIdOrderByDateDebutDesc(auditeur.getId())
                .stream()
                .filter(p -> p.getDateDebut() != null && !p.getDateDebut().isBefore(date30j))
                .count();
        dashboard.put("nbPassages30j", nbPassages30j);

        return dashboard;
    }

    @Transactional(readOnly = true)
    public TestPratiqueAuditeurResponse getTestPratiqueAuditeur(Long passageId) {
        PassageCertification passage = passageRepo.findById(passageId)
                .orElseThrow(() -> new BusinessException("Passage introuvable."));

        TestPratique testPratique = passage.getCertification().getTestPratique();
        if (testPratique == null)
            throw new BusinessException("Aucun test pratique associé.");

        TestPratiqueAuditeurResponse response = new TestPratiqueAuditeurResponse();
        response.setId(testPratique.getId());
        response.setTitre(testPratique.getTitre());
        response.setDescription(testPratique.getDescription());
        response.setNbDefauts((int) cablageRepo.findByTestPratiqueIdOrderByNumero(testPratique.getId()).size());
        response.setInstructions("Inspectez le câblage et notez tous les défauts visibles.");
        response.setDateActivation(testPratique.getDateActivation());

        return response;
    }

    @Transactional(readOnly = true)
    public List<CertificationResponse> getMesBrouillons(String matricule) {
        Utilisateur expert = getExpert(matricule);
        return certifRepo.findAllByExpertIdAndBrouillonTrue(expert.getId().longValue())
                .stream()
                .sorted((a, b) -> b.getDateCreation().compareTo(a.getDateCreation()))
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    // ═════════════════════════════════════════════════════════
    // HELPERS
    // ═════════════════════════════════════════════════════════
    private Certification getCertif(Long id) {
        return certifRepo.findById(id)
                .orElseThrow(() -> new BusinessException("Certification introuvable."));
    }

    private Utilisateur getExpert(String matricule) {
        return utilisateurRepo.findByMatricule(matricule)
                .orElseThrow(() -> new BusinessException("Expert introuvable."));
    }
    private int getMaxScoreTheorique(TestTheorique test) {
        if (test == null) return 20;

        long nbImages = questionRepo.findByTestTheoriqueIdAndTypeOrderByOrdreAsc(
                test.getId(), TypeQuestionTest.IMAGE_DEFAUT).size();

        long nbQCM = questionRepo.countByTestTheoriqueIdAndTypeAndDansPoolTrue(
                test.getId(), TypeQuestionTest.QCM);

        return (int) (nbImages + nbQCM);
    }
    private int statutPriority(StatutPassage s) {
        if (s == null) return 0;

        return switch (s) {
            case CERTIFIE              -> 10;
            case RAPPORT_VALIDE        -> 8;
            case PRATIQUE_EN_COURS     -> 7;
            case PRATIQUE_ECHOUE       -> 6;
            case THEORIQUE_EN_COURS    -> 5;
            case THEORIQUE_ECHOUE      -> 4;
            case BLOQUE                -> 3;
            case FORMATION_OBLIGATOIRE -> 2;
            default                    -> 1;
        };
    }
    // ═════════════════════════════════════════════════════════
    // MAPPING
    // ═════════════════════════════════════════════════════════
    public CertificationResponse toResponse(Certification c) {
        CertificationResponse r = new CertificationResponse();
        r.setId(c.getId());
        r.setTitre(c.getTitre());
        r.setActif(c.getActif());
        r.setSeuilTheorique(c.getSeuilTheorique());
        r.setDateCreation(c.getDateCreation());
        r.setDateActivation(c.getDateActivation());
        r.setDateDesactivation(c.getDateDesactivation());
        r.setDateExpiration(c.getDateExpiration());
        r.setFormationUrl(c.getFormationUrl());
        r.setFormationNom(c.getFormationNom());
        r.setBrouillon(c.getBrouillon());

        if (c.getCertificatVideUrl() != null) r.setCertificatVideUrl(c.getCertificatVideUrl());
        if (c.getCertificatVideNom() != null) r.setCertificatVideNom(c.getCertificatVideNom());

        if (c.getDateExpiration() != null) {
            long jours = java.time.temporal.ChronoUnit.DAYS.between(
                    LocalDateTime.now(), c.getDateExpiration());
            r.setJoursAvantExpiration(jours);
        }

        if (c.getAuditeur() != null) {
            r.setAuditeurNom(c.getAuditeur().getNom());
            r.setAuditeurPrenom(c.getAuditeur().getPrenom());
            r.setAuditeurMatricule(c.getAuditeur().getMatricule());
        }
        r.setStatut(c.getStatut() != null ? c.getStatut().name() : null);
        r.setScoreTheorique(c.getScoreTheorique());
        r.setScorePratique(c.getScorePratique());
        r.setScoreFinal(c.getScoreFinal());
        r.setNumeroCertificat(c.getNumeroCertificat());
        r.setNiveauBadge(c.getNiveauBadge());
        r.setDateObtention(c.getDateObtention());
        r.setNbTentativesTheoriques(c.getNbTentativesTheoriques());

        if (c.getExpert() != null)
            r.setExpertNom(c.getExpert().getNom() + " " + c.getExpert().getPrenom());

        if (c.getClient() != null) {
            r.setClientId(c.getClient().getId());
            r.setClientNom(c.getClient().getNom());
            r.setClientCode(c.getClient().getCode());
            r.setClientCouleur(c.getClient().getCouleur());
            r.setClientLogoUrl(c.getClient().getLogoUrl());
        }

        if (c.getTestTheorique() != null) {
            r.setTestTheoriqueId(c.getTestTheorique().getId());
            r.setTestTheoriqueNom(c.getTestTheorique().getTitre());
            r.setNbQuestionsImage((int) questionRepo
                    .findByTestTheoriqueIdAndTypeOrderByOrdreAsc(
                            c.getTestTheorique().getId(), TypeQuestionTest.IMAGE_DEFAUT).size());
            r.setNbQuestionsQCM((int) questionRepo
                    .countByTestTheoriqueIdAndTypeAndDansPoolTrue(
                            c.getTestTheorique().getId(), TypeQuestionTest.QCM));
        }

        if (c.getTestPratique() != null) {
            r.setTestPratiqueId(c.getTestPratique().getId());
            r.setTestPratiqueNom(c.getTestPratique().getTitre());
            r.setNbDefautsPratique(
                    cablageRepo.findByTestPratiqueIdOrderByNumero(c.getTestPratique().getId()).size());
            r.setSeuilPratique(c.getTestPratique().getSeuilReussite());
        }

        return r;
    }

    /**
     * Classe et trie tous les auditeurs ayant passé (ou en cours de passage pour)
     * une certification donnée.
     *
     * Algorithme de score composite (sur 100) :
     *   score = (scoreTheoriquePct × 0.40)
     *           + (scorePratique   × 0.40)
     *           + bonusPremierEssai                         (+10 si tentatives theo=1 ET prat=1)
     *           - penaliteTentatives                        (-5 × (nbTentTheo-1 + nbTentPrat-1))
     *           - penaliteBloque                            (-20 si jamais bloqué)
     *  Minimum clampé à 0.
     *
     * @param certifId  identifiant de la Certification
     * @return liste triée par scoreComposite DESC, rang affecté, médailles 🥇🥈🥉
     */
    /**
     * Retourne le classement des auditeurs pour une qualification donnée.
     */
    @Transactional(readOnly = true)
    public List<ClassementAuditeurResponse> getClassementAuditeurs(Long certifId) {

        // 1) Récupérer tous les passages de la certification
        List<PassageCertification> passages = passageRepo
                .findByCertificationIdOrderByDateDebutDesc(certifId);

        // 2) Garder le meilleur passage par auditeur (priorité par statut)
        Map<Integer, PassageCertification> byAuditeur = new LinkedHashMap<>();
        for (PassageCertification p : passages) {
            Integer aid = p.getAuditeur().getId();
            if (!byAuditeur.containsKey(aid)) {
                byAuditeur.put(aid, p);
            } else {
                PassageCertification existing = byAuditeur.get(aid);
                if (statutPriority(p.getStatut()) > statutPriority(existing.getStatut())) {
                    byAuditeur.put(aid, p);
                }
            }
        }

        List<ClassementAuditeurResponse> list = byAuditeur.values().stream()
                .map(p -> {
                    Utilisateur au      = p.getAuditeur();
                    Certification certif = p.getCertification();

                    // ── Score Théorique en % ──────────────────────────────────
                    // Le test théorique est noté sur 20 (10 IMAGE + 10 QCM)
                    int theoPct = 0;
                    if (p.getScoreTheorique() != null) {
                        int maxTheo = 20;
                        theoPct = maxTheo > 0
                                ? (int) Math.round(p.getScoreTheorique() * 100.0 / 20)
                                : 0;
                    }

                    // ── Score Pratique (%) ────────────────────────────────────
                    double pratPct = 0.0;
                    if (p.getScoreExpertSaisi() != null) {
                        // L'expert a saisi directement un score en %
                        pratPct = p.getScoreExpertSaisi();
                    } else if (p.getNbDefautsTotal() != null && p.getNbDefautsTotal() > 0) {
                        int identifies = p.getNbDefautsIdentifies() != null ? p.getNbDefautsIdentifies() : 0;
                        pratPct = ((p.getNbDefautsTotal() - identifies) * 100.0) / p.getNbDefautsTotal();
                    }

                    // ── Tentatives ────────────────────────────────────────────
                    int nbTheo  = p.getNbTentativesTheorique() != null ? p.getNbTentativesTheorique() : 0;
                    int nbPrat  = p.getNbTentativesPratique()  != null ? p.getNbTentativesPratique()  : 0;
                    boolean bloque  = StatutPassage.BLOQUE.equals(p.getStatut());
                    boolean premier = (nbTheo == 1 && nbPrat <= 1);

                    // ── Calcul score composite ─────────────────────────────────
                    //
                    //  score = théorique×40%
                    //        + pratique×40%
                    //        + 20  (bonus 1er essai global : théo=1 ET prat≤1)
                    //        - 5 × (nbTheo - 1)   (−5 par tentative théorique suppl.)
                    //        - 5 × (nbPrat - 1)   (−5 par tentative pratique suppl.)
                    //        - 20 (si bloqué)
                    //  Clampé [0, 100]
                    //
                    double composite =
                            (theoPct  * 0.40)
                                    + (pratPct  * 0.40)
                                    + (premier  ? 20.0 : 0.0)
                                    - (Math.max(0, nbTheo - 1) * 5.0)
                                    - (Math.max(0, nbPrat - 1) * 5.0)
                                    - (bloque   ? 20.0 : 0.0);

                    composite = Math.max(0.0, Math.min(100.0, composite));

                    // Enrichir avec site et plant si disponibles
                    String siteNom  = au.getSite()  != null ? au.getSite().getNom()  : null;
                    String plantNom = au.getPlant() != null ? au.getPlant().getNom() : null;
                    Integer siteId  = au.getSite()  != null ? au.getSite().getId()   : null;
                    Integer plantId = au.getPlant() != null ? au.getPlant().getId()  : null;

                    return ClassementAuditeurResponse.builder()
                            .passageId(p.getId())
                            .auditeurId(au.getId())
                            .auditeurNom(au.getNom())
                            .auditeurPrenom(au.getPrenom())
                            .auditeurMatricule(au.getMatricule())
                            .siteNom(siteNom)
                            .siteId(siteId)
                            .plantNom(plantNom)
                            .plantId(plantId)
                            .statut(p.getStatut().name())
                            .certifie(StatutPassage.CERTIFIE.equals(p.getStatut()))
                            .bloque(bloque)
                            .scoreTheorique(p.getScoreTheorique())
                            .scoreTheoriqueMax(getMaxScoreTheorique(certif.getTestTheorique()))
                            .scoreTheoriquePct(theoPct)
                            .scorePratique(pratPct > 0 ? pratPct : null)
                            .nbTentativesTheorique(nbTheo)
                            .nbTentativesPratique(nbPrat)
                            .premierEssai(premier)
                            .scoreComposite(Math.round(composite * 10.0) / 10.0)
                            .dateDebut(p.getDateDebut())
                            .dateFin(p.getDateFin())
                            .build();
                })
                .sorted(Comparator
                        .comparingDouble(ClassementAuditeurResponse::getScoreComposite).reversed()
                        .thenComparing(a -> Boolean.TRUE.equals(a.getCertifie()) ? 0 : 1)
                        .thenComparing(
                                a -> a.getDateDebut() != null ? a.getDateDebut() : LocalDateTime.MIN,
                                Comparator.reverseOrder()))
                .collect(Collectors.toList());

        // 4) Attribution des rangs et médailles
        AtomicInteger rang = new AtomicInteger(1);
        for (ClassementAuditeurResponse r : list) {
            int pos = rang.getAndIncrement();
            r.setRang(pos);
            if      (pos == 1) r.setMedaille("OR");
            else if (pos == 2) r.setMedaille("ARGENT");
            else if (pos == 3) r.setMedaille("BRONZE");
        }

        return list;
    }

    /** Priorité d'un statut pour le classement par auditeur (plus haut = plus avancé). */

}