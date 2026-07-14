package com.leoni.pap.service;

import com.leoni.pap.dto.request.SignerCertificatRequest;
import com.leoni.pap.dto.response.CertificatResponse;
import com.leoni.pap.entity.*;
import com.leoni.pap.entity.enums.*;
import com.leoni.pap.exception.BusinessException;
import com.leoni.pap.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class CertificatService {

    private final CertificatRepository      certifRepo;
    private final CertificationRepository   certificationRepo;
    private final HistoriqueRepository      historiqueRepo;   // ✅ Historique unifié
    private final UtilisateurRepository     utilisateurRepo;
    private final NotificationService       notifService;
    private final PassageCertificationRepository passageRepo;

    @Value("${app.frontend.url:http://localhost:5173}")
    private String frontendUrl;

    // ── GÉNÉRER LE CERTIFICAT ──────────────────────────────────
    public Certificat genererCertificat(Certification certification) {

        Utilisateur expert = utilisateurRepo
                .findByRoleAndActifTrue(RoleUser.EXPERT_PRODUCT_AUDIT)
                .stream().findFirst()
                .orElseThrow(() -> new BusinessException("Aucun expert disponible."));

        Certificat cert = Certificat.builder()
                .certification(certification)
                .numeroCertificat(certification.getNumeroCertificat())
                .expert(expert)
                .signatureExpert(false)
                .signatureChef(false)
                .statut("EN_ATTENTE_EXPERT")
                .dateGeneration(LocalDateTime.now())
                .dansHistoriqueExpert(false)
                .dansHistoriqueChef(false)
                .build();

        certifRepo.save(cert);

        // ✅ notifService.creer() — méthode correcte de NotificationService
        notifService.creer(
                expert,
                TypeNotification.CERTIF_A_SIGNER_EXPERT,
                "📝 Le certificat de " + certification.getAuditeur().getNom() + " "
                        + certification.getAuditeur().getPrenom()
                        + " (" + certification.getNumeroCertificat() + ") attend votre signature."
        );

        // ✅ Historique unifié avec Historique.builder()
        logHistorique(certification.getAuditeur(), TypeHistorique.CERTIFICAT_GENERE,
                certification, "Certificat " + certification.getNumeroCertificat() + " généré", null);

        return cert;
    }

    // ── SIGNATURE EXPERT ───────────────────────────────────────
    public CertificatResponse signerExpert(Long certificatId,
                                           SignerCertificatRequest req,
                                           String expertMatricule) {
        Certificat cert = getCertif(certificatId);

        if (!"EN_ATTENTE_EXPERT".equals(cert.getStatut()))
            throw new BusinessException("Ce certificat n'attend pas la signature de l'expert.");

        Utilisateur chef = utilisateurRepo.findById(req.getChefServiceId())
                .orElseThrow(() -> new BusinessException("Chef de service introuvable."));

        if (chef.getRole() != RoleUser.CHEF_SERVICE)
            throw new BusinessException("L'utilisateur sélectionné n'est pas un Chef de Service.");

        cert.setSignatureExpert(true);
        cert.setDateSignatureExpert(LocalDateTime.now());
        cert.setChefService(chef);
        cert.setStatut("EN_ATTENTE_CHEF");
        cert.setDansHistoriqueExpert(true);
        certifRepo.save(cert);

        // ✅ Notifier le chef
        notifService.creer(
                chef,
                TypeNotification.CERTIF_A_SIGNER_CHEF,
                "📝 Le certificat de " + cert.getCertification().getAuditeur().getNom()
                        + " " + cert.getCertification().getAuditeur().getPrenom()
                        + " (" + cert.getNumeroCertificat() + ") attend votre signature."
        );

        logHistorique(cert.getCertification().getAuditeur(), TypeHistorique.CERTIFICAT_SIGNE_EXPERT,
                cert.getCertification(), "Signé par l'expert " + expertMatricule, null);

        return toResponse(cert);
    }

    // ── SIGNATURE CHEF DE SERVICE ──────────────────────────────
    public CertificatResponse signerChef(Long certificatId, String chefMatricule) {
        Certificat cert = getCertif(certificatId);

        if (!"EN_ATTENTE_CHEF".equals(cert.getStatut()))
            throw new BusinessException("Ce certificat n'attend pas la signature du chef de service.");

        cert.setSignatureChef(true);
        cert.setDateSignatureChef(LocalDateTime.now());
        cert.setStatut("SIGNE");
        cert.setDansHistoriqueChef(true);
        certifRepo.save(cert);

        // Mettre à jour la certification
        Certification certification = cert.getCertification();
        certification.setStatut(StatutCertification.CERTIFIE);
        certificationRepo.save(certification);

        // Générer le PDF
        String cheminPdf = genererPDF(cert);
        cert.setCheminPdf(cheminPdf);
        cert.setStatut("ENVOYE");
        cert.setDateEnvoi(LocalDateTime.now());
        certifRepo.save(cert);

        // ✅ Notifier l'auditeur
        notifService.creerComplete(
                certification.getAuditeur(),
                TypeNotification.CERTIF_PDF_DISPONIBLE,
                "🎓 Votre certificat est prêt !",
                "Votre certificat " + cert.getNumeroCertificat()
                        + " est signé et disponible. Téléchargez-le depuis votre espace.",
                "/auditeur/mon-certificat",
                certification
        );

        logHistorique(certification.getAuditeur(), TypeHistorique.CERTIFICAT_SIGNE_CHEF,
                certification, "Certificat signé et envoyé à l'auditeur", null);

        return toResponse(cert);
    }

    // ── TÉLÉCHARGER LE PDF ─────────────────────────────────────
    @Transactional(readOnly = true)
    public String getCheminPdf(Long certifId) {
        return certifRepo.findByCertificationId(certifId)
                .map(Certificat::getCheminPdf)
                .orElseThrow(() -> new BusinessException("Certificat PDF non disponible."));
    }

    // ── LISTES EN ATTENTE ──────────────────────────────────────
    @Transactional(readOnly = true)
    public List<CertificatResponse> getCertificatsEnAttenteExpert() {
        return certifRepo.findAll().stream()
                .filter(c -> "EN_ATTENTE_EXPERT".equals(c.getStatut()))
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<CertificatResponse> getCertificatsEnAttenteChef(String chefMatricule) {
        Utilisateur chef = utilisateurRepo.findByMatricule(chefMatricule)
                .orElseThrow(() -> new BusinessException("Chef introuvable."));
        return certifRepo.findAll().stream()
                .filter(c -> "EN_ATTENTE_CHEF".equals(c.getStatut())
                        && c.getChefService() != null
                        && c.getChefService().getId().equals(chef.getId()))
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public String getCheminPdfByPassageId(Long passageId) {
        // Cherche directement dans PassageCertification par l'ID du passage
        PassageCertification passage = passageRepo.findById(passageId)
                .orElseThrow(() -> new BusinessException("Passage introuvable."));

        String nomFichier = passage.getCertificatPdfPath();
        if (nomFichier == null || nomFichier.isBlank())
            throw new BusinessException("Aucun PDF disponible pour ce passage.");

        // Cherche dans les mêmes dossiers que PassageService
        for (String dir : new String[]{
                "uploads/certifiact-auditeur/",
                "uploads/certificat-auditeur/",
                "uploads/certificats/" }) {
            java.io.File f = new java.io.File(dir + nomFichier);
            if (f.exists()) return dir + nomFichier;
        }

        throw new BusinessException("Fichier PDF introuvable : " + nomFichier);
    }
    // ── HELPERS PRIVÉS ─────────────────────────────────────────

    private String genererPDF(Certificat cert) {
        try {
            Certification certif = cert.getCertification();
            Utilisateur auditeur = certif.getAuditeur();

            // Chercher le modèle PDF de la certification
            String modeleUrl = certif.getFormationUrl(); // utilise le modèle certif uploadé
            // En réalité c'est certifModeleUrl — voir endpoint upload-certificat

            String outputDir = "uploads/certificats/";
            java.nio.file.Files.createDirectories(java.nio.file.Paths.get(outputDir));

            String fileName = "certificat_" + cert.getNumeroCertificat()
                    .replace("-", "_") + ".pdf";
            String outputPath = outputDir + fileName;

            // Si un modèle PDF a été uploadé, l'utiliser comme base
            // Sinon créer un PDF de zéro
            creerPdfAvecDonnees(outputPath, cert, certif, auditeur);

            return outputPath;
        } catch (Exception e) {
            throw new BusinessException("Erreur génération PDF : " + e.getMessage());
        }
    }
    private void creerPdfAvecDonnees(String outputPath, Certificat cert,
                                     Certification certif, Utilisateur auditeur) throws Exception {
        com.itextpdf.kernel.pdf.PdfWriter writer =
                new com.itextpdf.kernel.pdf.PdfWriter(outputPath);
        com.itextpdf.kernel.pdf.PdfDocument pdf =
                new com.itextpdf.kernel.pdf.PdfDocument(writer);
        com.itextpdf.layout.Document document =
                new com.itextpdf.layout.Document(pdf);

        // Couleurs
        com.itextpdf.kernel.colors.Color navy =
                new com.itextpdf.kernel.colors.DeviceRgb(11, 35, 71);
        com.itextpdf.kernel.colors.Color gold =
                new com.itextpdf.kernel.colors.DeviceRgb(212, 175, 55);
        com.itextpdf.kernel.colors.Color white =
                com.itextpdf.kernel.colors.ColorConstants.WHITE;

        // Polices
        com.itextpdf.kernel.font.PdfFont bold =
                com.itextpdf.kernel.font.PdfFontFactory.createFont(
                        com.itextpdf.io.font.constants.StandardFonts.HELVETICA_BOLD);
        com.itextpdf.kernel.font.PdfFont regular =
                com.itextpdf.kernel.font.PdfFontFactory.createFont(
                        com.itextpdf.io.font.constants.StandardFonts.HELVETICA);

        pdf.setDefaultPageSize(com.itextpdf.kernel.geom.PageSize.A4.rotate());
        document.setMargins(20, 40, 20, 40);

        // ── Fond navy ──
        com.itextpdf.kernel.pdf.canvas.PdfCanvas canvas =
                new com.itextpdf.kernel.pdf.canvas.PdfCanvas(pdf.getFirstPage());
        com.itextpdf.kernel.geom.PageSize ps = pdf.getDefaultPageSize();
        canvas.setFillColor(navy);
        canvas.rectangle(0, 0, ps.getWidth(), ps.getHeight());
        canvas.fill();

        // Bordure dorée
        canvas.setStrokeColor(gold);
        canvas.setLineWidth(3);
        canvas.rectangle(20, 20, ps.getWidth() - 40, ps.getHeight() - 40);
        canvas.stroke();
        canvas.rectangle(25, 25, ps.getWidth() - 50, ps.getHeight() - 50);
        canvas.stroke();

        // ── Contenu ──
        // Titre
        document.add(new com.itextpdf.layout.element.Paragraph("\n\n")
                .setMarginBottom(0));

        document.add(new com.itextpdf.layout.element.Paragraph("CERTIFICAT DE QUALIFICATION")
                .setFont(bold).setFontSize(28).setFontColor(gold)
                .setTextAlignment(com.itextpdf.layout.properties.TextAlignment.CENTER)
                .setMarginBottom(5));

        document.add(new com.itextpdf.layout.element.Paragraph("LEONI PAP — Product Audit Professional")
                .setFont(regular).setFontSize(14).setFontColor(white)
                .setTextAlignment(com.itextpdf.layout.properties.TextAlignment.CENTER)
                .setMarginBottom(30));

        // Ligne dorée décorative
        com.itextpdf.layout.element.LineSeparator ls =
                new com.itextpdf.layout.element.LineSeparator(
                        new com.itextpdf.kernel.pdf.canvas.draw.SolidLine(1f));
        ls.setStrokeColor(gold);
        ls.setWidth(300);
        ls.setMarginBottom(25);
        document.add(ls);

        // Texte certifie
        document.add(new com.itextpdf.layout.element.Paragraph("Ce certificat est décerné à")
                .setFont(regular).setFontSize(13).setFontColor(white)
                .setTextAlignment(com.itextpdf.layout.properties.TextAlignment.CENTER)
                .setMarginBottom(8));

        // Nom auditeur
        document.add(new com.itextpdf.layout.element.Paragraph(
                auditeur.getNom().toUpperCase() + " " + auditeur.getPrenom())
                .setFont(bold).setFontSize(32).setFontColor(gold)
                .setTextAlignment(com.itextpdf.layout.properties.TextAlignment.CENTER)
                .setMarginBottom(5));

        // Matricule
        document.add(new com.itextpdf.layout.element.Paragraph(
                "Matricule : " + auditeur.getMatricule())
                .setFont(regular).setFontSize(12).setFontColor(white)
                .setTextAlignment(com.itextpdf.layout.properties.TextAlignment.CENTER)
                .setMarginBottom(20));

        document.add(new com.itextpdf.layout.element.Paragraph(
                "Pour avoir réussi la qualification : " + certif.getTitre())
                .setFont(regular).setFontSize(13).setFontColor(white)
                .setTextAlignment(com.itextpdf.layout.properties.TextAlignment.CENTER)
                .setMarginBottom(25));

        // Infos scores en grille
        com.itextpdf.layout.element.Table table =
                new com.itextpdf.layout.element.Table(3);
        table.setWidth(com.itextpdf.layout.properties.UnitValue.createPercentValue(80));
        table.setHorizontalAlignment(
                com.itextpdf.layout.properties.HorizontalAlignment.CENTER);
        table.setMarginBottom(25);

        String[][] infos = {
                {"Score Théorique", certif.getScoreTheorique() != null ?
                        String.format("%.0f%%", certif.getScoreTheorique()) : "—"},
                {"Score Pratique", certif.getScorePratique() != null ?
                        String.format("%.0f%%", certif.getScorePratique()) : "—"},
                {"Score Final", certif.getScoreFinal() != null ?
                        String.format("%.1f/100", certif.getScoreFinal()) : "—"},
                {"Mention", certif.getNiveauBadge() != null ? certif.getNiveauBadge() : "—"},
                {"Date", certif.getDateObtention() != null ?
                        certif.getDateObtention().toLocalDate().format(
                                java.time.format.DateTimeFormatter.ofPattern("dd/MM/yyyy")) : "—"},
                {"Expire", certif.getDateExpiration() != null ?
                        certif.getDateExpiration().toLocalDate().format(
                                java.time.format.DateTimeFormatter.ofPattern("dd/MM/yyyy")) : "—"},
        };

        for (String[] info : infos) {
            com.itextpdf.layout.element.Cell cell = new com.itextpdf.layout.element.Cell();
            cell.add(new com.itextpdf.layout.element.Paragraph(info[0])
                    .setFont(regular).setFontSize(9).setFontColor(gold));
            cell.add(new com.itextpdf.layout.element.Paragraph(info[1])
                    .setFont(bold).setFontSize(13).setFontColor(white));
            cell.setBorder(com.itextpdf.layout.borders.Border.NO_BORDER);
            cell.setBackgroundColor(
                    new com.itextpdf.kernel.colors.DeviceRgb(255,255,255), 0.05f);
            cell.setPadding(10);
            cell.setTextAlignment(com.itextpdf.layout.properties.TextAlignment.CENTER);
            table.addCell(cell);
        }
        document.add(table);

        // Numéro certificat
        document.add(new com.itextpdf.layout.element.Paragraph(
                "N° " + cert.getNumeroCertificat())
                .setFont(bold).setFontSize(11).setFontColor(gold)
                .setTextAlignment(com.itextpdf.layout.properties.TextAlignment.CENTER)
                .setMarginBottom(15));

        // Signatures
        com.itextpdf.layout.element.Table sigTable =
                new com.itextpdf.layout.element.Table(2);
        sigTable.setWidth(com.itextpdf.layout.properties.UnitValue.createPercentValue(70));
        sigTable.setHorizontalAlignment(
                com.itextpdf.layout.properties.HorizontalAlignment.CENTER);

        for (String[] sig : new String[][]{
                {"Expert Product Audit", cert.getExpert() != null ?
                        cert.getExpert().getNom() + " " + cert.getExpert().getPrenom() : "—"},
                {"Chef de Service", cert.getChefService() != null ?
                        cert.getChefService().getNom() + " " + cert.getChefService().getPrenom() : "—"}
        }) {
            com.itextpdf.layout.element.Cell c = new com.itextpdf.layout.element.Cell();
            c.add(new com.itextpdf.layout.element.Paragraph("_________________")
                    .setFontColor(gold).setFont(regular).setFontSize(10));
            c.add(new com.itextpdf.layout.element.Paragraph(sig[0])
                    .setFont(bold).setFontSize(9).setFontColor(white));
            c.add(new com.itextpdf.layout.element.Paragraph(sig[1])
                    .setFont(regular).setFontSize(9).setFontColor(gold));
            c.setBorder(com.itextpdf.layout.borders.Border.NO_BORDER);
            c.setTextAlignment(com.itextpdf.layout.properties.TextAlignment.CENTER);
            c.setPadding(8);
            sigTable.addCell(c);
        }
        document.add(sigTable);

        document.close();
    }
    public String genererPdfDirect(Certificat cert) {
        return genererPDF(cert);
    }
    // ✅ Utilise Historique unifié — plus de HistoriqueCertification
    private void logHistorique(Utilisateur acteur, TypeHistorique type,
                               Certification certif, String details, Double score) {
        historiqueRepo.save(Historique.builder()
                .utilisateur(acteur)
                .type(type)
                .certification(certif)
                .details(details)
                .scoreSnapshot(score)
                .dateAction(LocalDateTime.now())
                .build());
    }

    private Certificat getCertif(Long id) {
        return certifRepo.findById(id)
                .orElseThrow(() -> new BusinessException("Certificat introuvable."));
    }




    /**
     * Génère un QR code PNG pointant vers l'URL publique du certificat.
     * L'URL encode : frontendUrl/certificat/verify/{passageId}
     */
    public byte[] genererQrCode(Long passageId) {
        try {
            String url = frontendUrl + "/certificat/verify/" + passageId;

            com.google.zxing.qrcode.QRCodeWriter writer =
                    new com.google.zxing.qrcode.QRCodeWriter();
            com.google.zxing.common.BitMatrix bitMatrix =
                    writer.encode(url, com.google.zxing.BarcodeFormat.QR_CODE, 300, 300);

            java.awt.image.BufferedImage image =
                    new java.awt.image.BufferedImage(300, 300,
                            java.awt.image.BufferedImage.TYPE_INT_RGB);

            for (int x = 0; x < 300; x++) {
                for (int y = 0; y < 300; y++) {
                    image.setRGB(x, y, bitMatrix.get(x, y) ? 0x0B1E3D : 0xFFFFFF);
                }
            }

            java.io.ByteArrayOutputStream baos = new java.io.ByteArrayOutputStream();
            javax.imageio.ImageIO.write(image, "PNG", baos);
            return baos.toByteArray();

        } catch (Exception e) {
            throw new BusinessException("Erreur génération QR code : " + e.getMessage());
        }
    }

    public CertificatResponse toResponse(Certificat c) {
        CertificatResponse r = new CertificatResponse();
        r.setId(c.getId());
        r.setNumeroCertificat(c.getNumeroCertificat());
        r.setStatut(c.getStatut());
        Certification certif = c.getCertification();
        r.setAuditeurNom(certif.getAuditeur().getNom());
        r.setAuditeurPrenom(certif.getAuditeur().getPrenom());
        r.setAuditeurMatricule(certif.getAuditeur().getMatricule());
        r.setScoreFinal(certif.getScoreFinal());
        r.setNiveauBadge(certif.getNiveauBadge());
        r.setDateObtention(certif.getDateObtention());
        r.setDateExpiration(certif.getDateExpiration());
        r.setSignatureExpert(c.getSignatureExpert());
        r.setSignatureChef(c.getSignatureChef());
        if (c.getExpert() != null)
            r.setExpertNom(c.getExpert().getNom() + " " + c.getExpert().getPrenom());
        if (c.getChefService() != null)
            r.setChefNom(c.getChefService().getNom() + " " + c.getChefService().getPrenom());
        r.setCheminPdf(c.getCheminPdf());
        r.setDateGeneration(c.getDateGeneration());
        if (certif.getAuditeur().getSite() != null)
            r.setSiteNom(certif.getAuditeur().getSite().getNom());
        return r;
    }
}