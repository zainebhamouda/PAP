package com.leoni.pap.service;

import com.leoni.pap.dto.response.CertificatAuditeurResponse;
import com.leoni.pap.dto.response.UtilisateurResponse;
import com.leoni.pap.entity.CertificatAuditeur;
import com.leoni.pap.entity.RoleUser;
import com.leoni.pap.entity.Utilisateur;
import com.leoni.pap.entity.enums.TypeNotification;
import com.leoni.pap.exception.BusinessException;
import com.leoni.pap.repository.CertificatAuditeurRepository;
import com.leoni.pap.repository.UtilisateurRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class CertificatAuditeurService {

    private final CertificatAuditeurRepository certifAuditeurRepo;
    private final UtilisateurRepository        userRepo;
    private final NotificationService          notifService;

    @Value("${upload.certificat-auditeur.path:./uploads/certificats-auditeur}")
    private String UPLOAD_DIR;

    /**
     * ✅ Durée de validité d'un certificat importé, EN MINUTES.
     * Par défaut = 2 ans (2 × 365 × 24 × 60). Pour tester rapidement le
     * scheduler d'expiration, mettre temporairement une petite valeur
     * (ex: 5) dans application.properties :
     *   certificat.auditeur.duree-validite-minutes=5
     * puis remettre 1051200 (2 ans) une fois le test terminé.
     */
    @Value("${certificat.auditeur.duree-validite-minutes:1051200}")
    private long DUREE_VALIDITE_MINUTES;

    /**
     * ✅ Délai d'alerte avant expiration, EN MINUTES.
     * Par défaut = 7 jours (7 × 24 × 60 = 10080). Pour tester :
     *   certificat.auditeur.notif-avant-expiration-minutes=2
     */
    @Value("${certificat.auditeur.notif-avant-expiration-minutes:10080}")
    private long NOTIF_AVANT_EXPIRATION_MINUTES;

    public long getNotifAvantExpirationMinutes() { return NOTIF_AVANT_EXPIRATION_MINUTES; }

    // ═══════════════════════════════════════════════════════════
    // IMPORT (par l'expert du plant)
    // ═══════════════════════════════════════════════════════════

    public CertificatAuditeurResponse importer(Integer expertId, Integer auditeurId,
                                               LocalDateTime dateObtention, MultipartFile pdf) {
        Utilisateur expert = userRepo.findById(expertId)
                .orElseThrow(() -> new BusinessException("Utilisateur introuvable."));
        Utilisateur auditeur = userRepo.findById(auditeurId)
                .orElseThrow(() -> new BusinessException("Auditeur introuvable."));

        if (auditeur.getRole() != RoleUser.AUDITEUR) {
            throw new BusinessException("La personne choisie doit avoir le rôle Auditeur.");
        }
        if (expert.getPlant() == null) {
            throw new BusinessException("Votre compte expert n'est rattaché à aucun plant.");
        }
        if (auditeur.getPlant() == null || !auditeur.getPlant().getId().equals(expert.getPlant().getId())) {
            throw new BusinessException("Vous ne pouvez importer un certificat que pour un auditeur de votre propre plant.");
        }
        if (dateObtention == null) dateObtention = LocalDateTime.now();

        LocalDateTime dateExpiration = dateObtention.plusMinutes(DUREE_VALIDITE_MINUTES);

        CertificatAuditeur certif = CertificatAuditeur.builder()
                .auditeur(auditeur)
                .plant(expert.getPlant())
                .importePar(expert)
                .dateObtention(dateObtention)
                .dateExpiration(dateExpiration)
                .build();

        if (pdf != null && !pdf.isEmpty()) {
            try {
                // ⚠️ IMPORTANT : MultipartFile.transferTo() traite un chemin
                // RELATIF comme relatif au dossier temporaire interne du
                // conteneur servlet (Tomcat), pas au dossier de travail de
                // l'appli — d'où un FileNotFoundException vers un chemin
                // du type ".../Temp/tomcat.xxx/work/Tomcat/.../uploads/...".
                // On force donc un chemin ABSOLU avant d'écrire le fichier.
                Path uploadPath = Paths.get(UPLOAD_DIR).toAbsolutePath().normalize();
                if (!Files.exists(uploadPath)) Files.createDirectories(uploadPath);
                String ext = getExtension(pdf.getOriginalFilename());
                String nomFichier = "certif_auditeur_" + auditeurId + "_" + System.currentTimeMillis() + ext;
                Path filePath = uploadPath.resolve(nomFichier);
                pdf.transferTo(filePath.toFile());
                certif.setCheminPdf("/uploads/certificats-auditeur/" + nomFichier);
                certif.setNomFichierPdf(pdf.getOriginalFilename());
            } catch (IOException e) {
                throw new BusinessException("Erreur lors de l'upload du certificat : " + e.getMessage());
            }
        }

        CertificatAuditeur saved = certifAuditeurRepo.save(certif);

        notifService.creer(auditeur, TypeNotification.CERTIF_IMPORTEE,
                "📜 " + expert.getPrenom() + " " + expert.getNom()
                        + " a importé votre certificat (valide jusqu'au "
                        + saved.getDateExpiration().toLocalDate() + ").");

        // ✅ NOUVEAU — Informer l'encadrement que l'expert a importé un
        // certificat "hors circuit habituel" (auditeur déjà certifié avant
        // la mise en place de l'application) :
        //  - le chef de service DU MÊME PLANT que l'expert
        //  - le(s) responsable(s) qualité centrale, quel que soit leur plant
        String messageEncadrement = "📜 " + expert.getPrenom() + " " + expert.getNom()
                + " a importé un certificat existant pour l'auditeur "
                + auditeur.getPrenom() + " " + auditeur.getNom()
                + " (" + expert.getPlant().getNom() + ") — valide jusqu'au "
                + saved.getDateExpiration().toLocalDate() + ".";

        userRepo.findByRoleAndActifTrue(RoleUser.CHEF_SERVICE).stream()
                .filter(u -> u.getPlant() != null && u.getPlant().getId().equals(expert.getPlant().getId()))
                .forEach(u -> notifService.creer(u, TypeNotification.CERTIF_IMPORTEE, messageEncadrement));

        userRepo.findByRoleAndActifTrue(RoleUser.RESPONSABLE_QUALITE_CENTRALE)
                .forEach(u -> notifService.creer(u, TypeNotification.CERTIF_IMPORTEE, messageEncadrement));

        return CertificatAuditeurResponse.from(saved);
    }

    // ═══════════════════════════════════════════════════════════
    // CONSULTATION
    // ═══════════════════════════════════════════════════════════

    @Transactional(readOnly = true)
    public List<CertificatAuditeurResponse> getCertificatsDeMonPlant(Integer expertId) {
        Utilisateur expert = userRepo.findById(expertId)
                .orElseThrow(() -> new BusinessException("Utilisateur introuvable."));
        if (expert.getPlant() == null) return List.of();
        return certifAuditeurRepo.findByPlantIdOrderByDateImportDesc(expert.getPlant().getId())
                .stream().map(CertificatAuditeurResponse::from).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<CertificatAuditeurResponse> getMesCertificats(Integer auditeurId) {
        return certifAuditeurRepo.findByAuditeurIdOrderByDateObtentionDesc(auditeurId)
                .stream().map(CertificatAuditeurResponse::from).collect(Collectors.toList());
    }

    /**
     * ✅ Liste des IDs d'auditeurs "certifiés" (import encore valide) pour un
     * plant — consommée par la page de planification pour enrichir la liste
     * des auditeurs qualifiés proposés à l'expert.
     */
    @Transactional(readOnly = true)
    public List<UtilisateurResponse> getAuditeursCertifiesParPlant(Integer plantId) {
        return certifAuditeurRepo.findValidesParPlant(plantId, LocalDateTime.now()).stream()
                .map(CertificatAuditeur::getAuditeur)
                .filter(java.util.Objects::nonNull)
                .distinct()
                .map(u -> {
                    UtilisateurResponse dto = new UtilisateurResponse();
                    dto.setId(u.getId());
                    dto.setNom(u.getNom());
                    dto.setPrenom(u.getPrenom());
                    dto.setMatricule(u.getMatricule());
                    dto.setPlantId(u.getPlant() != null ? u.getPlant().getId() : null);
                    return dto;
                })
                .collect(Collectors.toList());
    }

    /** Liste des auditeurs du même plant que l'expert (pour le formulaire d'import) */
    @Transactional(readOnly = true)
    public List<UtilisateurResponse> getAuditeursDeMonPlant(Integer expertId) {
        Utilisateur expert = userRepo.findById(expertId)
                .orElseThrow(() -> new BusinessException("Utilisateur introuvable."));
        if (expert.getPlant() == null) return List.of();
        return userRepo.findAll().stream()
                .filter(u -> u.getRole() == RoleUser.AUDITEUR)
                .filter(u -> u.getPlant() != null && u.getPlant().getId().equals(expert.getPlant().getId()))
                .map(u -> {
                    UtilisateurResponse dto = new UtilisateurResponse();
                    dto.setId(u.getId());
                    dto.setNom(u.getNom());
                    dto.setPrenom(u.getPrenom());
                    dto.setMatricule(u.getMatricule());
                    return dto;
                })
                .collect(Collectors.toList());
    }

    // ═══════════════════════════════════════════════════════════
    // ANNULATION (import fait par erreur)
    // ═══════════════════════════════════════════════════════════

    public void annuler(Long certifId, Integer expertId) {
        CertificatAuditeur certif = certifAuditeurRepo.findById(certifId)
                .orElseThrow(() -> new BusinessException("Certificat introuvable."));
        Utilisateur expert = userRepo.findById(expertId)
                .orElseThrow(() -> new BusinessException("Utilisateur introuvable."));
        if (certif.getPlant() == null || expert.getPlant() == null
                || !certif.getPlant().getId().equals(expert.getPlant().getId())) {
            throw new BusinessException("Vous ne pouvez annuler que les certificats de votre plant.");
        }
        certif.setActif(false);
        certifAuditeurRepo.save(certif);
    }

    private String getExtension(String filename) {
        if (filename == null || !filename.contains(".")) return ".pdf";
        return filename.substring(filename.lastIndexOf("."));
    }
}