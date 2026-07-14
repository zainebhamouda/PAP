package com.leoni.pap.service;

import com.leoni.pap.dto.request.CreerCertificatVWRequest;
import com.leoni.pap.dto.response.CertificatVWResponse;
import com.leoni.pap.entity.CertificatVW;
import com.leoni.pap.entity.Plant;
import com.leoni.pap.entity.Utilisateur;
import com.leoni.pap.exception.BusinessException;
import com.leoni.pap.repository.CertificatVWRepository;
import com.leoni.pap.repository.PlantRepository;
import com.leoni.pap.repository.UtilisateurRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDate;
import java.util.Base64;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CertificatVWService {

    private static final int    VALIDITE_ANNEES = 4;
    private static final String UPLOAD_DIR      = "uploads/certificats-vw/";

    private final CertificatVWRepository certifVWRepo;
    private final UtilisateurRepository  utilisateurRepo;
    private final PlantRepository        plantRepo;

    // ─────────────────────────────────────────────────────────
    // LECTURE
    // ─────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<CertificatVWResponse> getByPlant(Integer plantId) {
        return certifVWRepo.findByPlantIdOrderByDateObtentionDesc(plantId)
                .stream().map(CertificatVWResponse::from).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<CertificatVWResponse> getByAuditeur(Integer auditeurId) {
        return certifVWRepo.findByAuditeurIdOrderByDateObtentionDesc(auditeurId)
                .stream().map(CertificatVWResponse::from).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<CertificatVWResponse> getByAuditeurEmail(String email) {
        Utilisateur u = utilisateurRepo.findByEmail(email)
                .orElseThrow(() -> new BusinessException("Utilisateur introuvable."));
        return certifVWRepo.findByAuditeurIdOrderByDateObtentionDesc(u.getId())
                .stream().map(CertificatVWResponse::from).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public CertificatVWResponse infoParMatricule(String matricule) {
        Utilisateur u = utilisateurRepo.findByMatricule(matricule)
                .orElseThrow(() -> new BusinessException("Aucun utilisateur avec le matricule : " + matricule));
        CertificatVWResponse r = new CertificatVWResponse();
        r.setAuditeurNom(u.getNom());
        r.setAuditeurPrenom(u.getPrenom());
        r.setAuditeurMatricule(u.getMatricule());
        r.setAuditeurId(u.getId());
        if (u.getPlant() != null) {
            r.setPlantId(u.getPlant().getId());
            r.setPlantNom(u.getPlant().getNom());
        }
        if (u.getSite() != null) {
            r.setSiteNom(u.getSite().getNom());
        }
        return r;
    }

    // ─────────────────────────────────────────────────────────
    // CRÉATION
    // ─────────────────────────────────────────────────────────

    @Transactional
    public CertificatVWResponse creer(CreerCertificatVWRequest req, String emailExpert) {
        Utilisateur expert = trouverUtilisateurParEmailOuMatricule(emailExpert);

        if (!Boolean.TRUE.equals(expert.getPeutCreerCertif())) {
            throw new BusinessException("Vous n'êtes pas autorisé à saisir des certifications VW.");
        }
        if (expert.getPlant() == null) {
            throw new BusinessException("Votre compte n'est pas associé à un plant.");
        }

        Utilisateur auditeur = utilisateurRepo.findByMatricule(req.getMatriculeAuditeur())
                .orElseThrow(() -> new BusinessException(
                        "Aucun auditeur trouvé avec le matricule : " + req.getMatriculeAuditeur()));

        Plant plant = expert.getPlant();
        LocalDate dateExpiration = req.getDateObtention().plusYears(VALIDITE_ANNEES);

        String pdfPath = null;
        String pdfNom  = null;
        if (req.getPdfBase64() != null && !req.getPdfBase64().isBlank()) {
            pdfPath = sauvegarderPdf(req.getPdfBase64(), req.getPdfNom(), auditeur.getMatricule());
            pdfNom  = req.getPdfNom();
        }

        CertificatVW certif = CertificatVW.builder()
                .auditeur(auditeur)
                .plant(plant)
                .expertSaisi(expert)
                .auditeurNom(auditeur.getNom())
                .auditeurMatricule(auditeur.getMatricule())
                .plantNom(plant.getNom())
                .siteNom(plant.getSite() != null ? plant.getSite().getNom() : null)
                .dateObtention(req.getDateObtention())
                .dateExpiration(dateExpiration)
                .pdfPath(pdfPath)
                .pdfNom(pdfNom)
                .statut("ACTIF")
                .build();

        return CertificatVWResponse.from(certifVWRepo.save(certif));
    }

    // ─────────────────────────────────────────────────────────
    // MODIFICATION
    // ─────────────────────────────────────────────────────────

    @Transactional
    public CertificatVWResponse modifier(Long id, CreerCertificatVWRequest req, String emailExpert) {
        CertificatVW certif = certifVWRepo.findById(id)
                .orElseThrow(() -> new BusinessException("Certification introuvable : " + id));
        verifierDroitExpert(certif, emailExpert);

        if (req.getDateObtention() != null) {
            certif.setDateObtention(req.getDateObtention());
            certif.setDateExpiration(req.getDateObtention().plusYears(VALIDITE_ANNEES));
        }
        if (req.getPdfBase64() != null && !req.getPdfBase64().isBlank()) {
            certif.setPdfPath(sauvegarderPdf(req.getPdfBase64(), req.getPdfNom(), certif.getAuditeurMatricule()));
            certif.setPdfNom(req.getPdfNom());
        }
        return CertificatVWResponse.from(certifVWRepo.save(certif));
    }

    // ─────────────────────────────────────────────────────────
    // SUPPRESSION
    // ─────────────────────────────────────────────────────────

    @Transactional
    public void supprimer(Long id, String emailExpert) {
        CertificatVW certif = certifVWRepo.findById(id)
                .orElseThrow(() -> new BusinessException("Certification introuvable : " + id));
        verifierDroitExpert(certif, emailExpert);
        certifVWRepo.delete(certif);
    }

    // ─────────────────────────────────────────────────────────
    // TÉLÉCHARGEMENT PDF
    // ─────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public byte[] getPdf(Long id) {
        CertificatVW certif = certifVWRepo.findById(id)
                .orElseThrow(() -> new BusinessException("Certification introuvable."));
        if (certif.getPdfPath() == null) {
            throw new BusinessException("Aucun PDF disponible pour cette certification.");
        }
        try {
            return Files.readAllBytes(Paths.get(certif.getPdfPath()));
        } catch (Exception e) {
            throw new BusinessException("Impossible de lire le PDF : " + e.getMessage());
        }
    }

    // ─────────────────────────────────────────────────────────
    // CONTRÔLE D'ACCÈS AUDIT
    // ─────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public boolean auditeurEstCertifieVW(Integer auditeurId, Integer plantId) {
        return certifVWRepo.existsCertifValide(auditeurId, plantId, LocalDate.now());
    }

    public static boolean estPlantVW(Plant plant) {
        if (plant == null) return false;
        String clientNom = plant.getClientNom() != null ? plant.getClientNom().toUpperCase() : "";
        String nom       = plant.getNom()       != null ? plant.getNom().toUpperCase()       : "";
        return clientNom.contains("VW") || clientNom.contains("VOLKSWAGEN")
                || nom.contains("VW")       || nom.contains("VOLKSWAGEN");
    }

    // ─────────────────────────────────────────────────────────
    // PRIVÉ
    // ─────────────────────────────────────────────────────────

    private void verifierDroitExpert(CertificatVW certif, String emailExpert) {
        Utilisateur expert = trouverUtilisateurParEmailOuMatricule(emailExpert);
        if (!Boolean.TRUE.equals(expert.getPeutCreerCertif())) {
            throw new BusinessException("Accès non autorisé.");
        }
        if (expert.getPlant() == null
                || !expert.getPlant().getId().equals(certif.getPlant().getId())) {
            throw new BusinessException("Vous ne pouvez modifier que les certifs de votre plant.");
        }
    }

    private Utilisateur trouverUtilisateurParEmailOuMatricule(String identifiant) {
        return utilisateurRepo.findByEmail(identifiant)
                .or(() -> utilisateurRepo.findByMatricule(identifiant))
                .orElseThrow(() -> new BusinessException("Utilisateur introuvable : " + identifiant));
    }

    private String sauvegarderPdf(String base64Raw, String nomOriginal, String matricule) {
        try {
            String base64 = base64Raw.contains(",") ? base64Raw.split(",", 2)[1] : base64Raw;
            Path dir = Paths.get(UPLOAD_DIR);
            if (!Files.exists(dir)) Files.createDirectories(dir);
            String nomFichier = System.currentTimeMillis()
                    + "_VW_" + matricule + "_"
                    + (nomOriginal != null ? nomOriginal.replaceAll("[^a-zA-Z0-9._-]", "_") : "certif.pdf");
            byte[] bytes = Base64.getDecoder().decode(base64);
            Files.write(dir.resolve(nomFichier), bytes);
            return UPLOAD_DIR + nomFichier;
        } catch (Exception e) {
            throw new BusinessException("Erreur sauvegarde PDF : " + e.getMessage());
        }
    }
}