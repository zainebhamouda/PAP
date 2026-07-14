package com.leoni.pap.service;

import com.leoni.pap.entity.*;
import com.leoni.pap.entity.enums.CouleurQK;
import com.leoni.pap.entity.enums.TypeNotification;
import com.leoni.pap.exception.BusinessException;
import com.leoni.pap.repository.*;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.*;
import java.nio.file.*;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;
import lombok.extern.slf4j.Slf4j;

@Slf4j
/**
 * AuditProduitAnnexeService — Sprint 3/4 LEONI PAP
 * ══════════════════════════════════════════════════
 * AMÉLIORATIONS :
 *  ✓ Génération PDF LEONI structuré (HTML → PDF via iText / flying-saucer)
 *  ✓ Rapport inclut : en-tête, résumé, annexes, fiches réparation, PDCA
 *  ✓ Conforme aux normes LEONI IT TN 3625
 *  ✓ Correction : initialisation des annexes sans supprimer les existantes
 */
@Service
@RequiredArgsConstructor
@Transactional
public class AuditProduitAnnexeService {

    private final AuditProduitRepository            auditRepo;
    private final AuditProduitAnnexeRepository      annexeRepo;
    private final AnnexeConfigRepository            annexeCfgRepo;
    private final UtilisateurRepository             userRepo;
    private final NotificationService               notifService;
    private final EmailService                      emailService;
    private final ObjectMapper                      objectMapper;
    private final RapportMensuelService rapportMensuelService;
    private final AuditProduitPdfService pdfService;
    private static final String UPLOAD_DIR = "uploads/annexes/";
    private static final String REPORT_DIR = "uploads/rapport/";

    private static final DateTimeFormatter FMT_DATE  = DateTimeFormatter.ofPattern("dd/MM/yyyy");
    private static final DateTimeFormatter FMT_TOKEN = DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss");

    // ═══════════════════════════════════════════════════════════
    // 1. INITIALISER LES ANNEXES
    // ═══════════════════════════════════════════════════════════

    public void initialiserAnnexes(Long auditId) {
        AuditProduit audit = getAudit(auditId);
        if (audit.getPlant() == null)
            throw new BusinessException("L'audit n'a pas de plant associé.");

        // Ne supprimer QUE si aucune annexe n'a été importée / remplie
        List<AuditProduitAnnexe> existing = annexeRepo.findByAuditId(auditId);
        boolean hasData = existing.stream().anyMatch(
                a -> Boolean.TRUE.equals(a.getImporte()) || Boolean.TRUE.equals(a.getFormValide()));
        if (!hasData) {
            annexeRepo.deleteByAuditId(auditId);
        }

        List<AnnexeConfig> configs =
                annexeCfgRepo.findByPlantIdOrCommune(audit.getPlant().getId());
        if (configs.isEmpty()) configs = getConfigParDefaut();

        Set<String> existingTypes = existing.stream()
                .map(AuditProduitAnnexe::getTypeAnnexe)
                .collect(Collectors.toSet());

        List<AuditProduitAnnexe> toSave = configs.stream()
                .filter(cfg -> !existingTypes.contains(cfg.getTypeAnnexe()))
                .map(cfg -> {
                    AuditProduitAnnexe a = new AuditProduitAnnexe();
                    a.setAudit(audit);
                    a.setTypeAnnexe(cfg.getTypeAnnexe());
                    a.setLibelle(cfg.getLibelle());
                    a.setImporte(false);
                    a.setOrdreAffichage(cfg.getOrdreAffichage());
                    a.setCommuneTousPlants(cfg.getCommuneTousPlants());
                    return a;
                }).collect(Collectors.toList());

        if (!toSave.isEmpty()) annexeRepo.saveAll(toSave);
    }

    // ═══════════════════════════════════════════════════════════
    // 2. IMPORTER UN FICHIER ANNEXE
    // ═══════════════════════════════════════════════════════════

    public Map<String, Object> importerFichierAnnexe(Long auditId,
                                                     String typeAnnexe,
                                                     MultipartFile fichier,
                                                     Integer auditeurId) {
        AuditProduit audit    = getAudit(auditId);
        Utilisateur  auditeur = getUser(auditeurId);

        AuditProduitAnnexe annexe = annexeRepo
                .findByAuditIdAndTypeAnnexe(auditId, typeAnnexe)
                .orElseGet(() -> {
                    AuditProduitAnnexe a = new AuditProduitAnnexe();
                    a.setAudit(audit);
                    a.setTypeAnnexe(typeAnnexe);
                    a.setLibelle("Annexe " + typeAnnexe);
                    a.setOrdreAffichage(99);
                    return a;
                });

        // Supprimer l'ancien fichier si remplacement
        if (annexe.getFichierUrl() != null) {
            try { Files.deleteIfExists(Paths.get(annexe.getFichierUrl())); }
            catch (IOException ignored) {}
        }

        String fileName = "audit_" + auditId + "_annexe_" + typeAnnexe
                + "_" + System.currentTimeMillis()
                + getExtension(fichier.getOriginalFilename());
        String filePath = UPLOAD_DIR + fileName;

        try {
            Path path = Paths.get(filePath);
            Files.createDirectories(path.getParent());
            Files.write(path, fichier.getBytes());
        } catch (IOException e) {
            throw new BusinessException("Erreur stockage fichier : " + e.getMessage());
        }

        annexe.setFichierNom(fichier.getOriginalFilename());
        annexe.setFichierUrl(filePath);
        annexe.setMimeType(fichier.getContentType());
        annexe.setImporte(true);
        annexe.setFormValide(false);
        annexe.setDateImport(LocalDateTime.now());
        annexe.setImportePar(auditeur);
        annexeRepo.save(annexe);

        boolean toutesImportees = verifierToutesImportees(auditId);

        Map<String, Object> result = new HashMap<>();
        result.put("annexeId",       annexe.getId());
        result.put("typeAnnexe",     typeAnnexe);
        result.put("fichierNom",     annexe.getFichierNom());
        result.put("importe",        true);
        result.put("toutesImportees",toutesImportees);
        result.put("message",        "Annexe " + typeAnnexe + " importée avec succès.");
        return result;
    }

    // ═══════════════════════════════════════════════════════════
    // 3. SAISIR / METTRE À JOUR LE QK
    // ═══════════════════════════════════════════════════════════

    public Map<String, Object> saisirValeurQK(Long auditId,
                                              Double valeurQK,
                                              Integer auditeurId) {
        AuditProduit audit = getAudit(auditId);
        audit.setValeurQK(valeurQK);
        audit.calculerCouleurQK();
        auditRepo.save(audit);

        if (valeurQK != null && valeurQK > 0 && audit.getPlanificateur() != null) {
            String msg = "Audit " + audit.getReference()
                    + " — QK = " + valeurQK + " (" + audit.getCouleurQK() + "). Action requise.";
            notifService.creer(audit.getPlanificateur(), TypeNotification.INFORMATION, msg);
        }

        Map<String, Object> result = new HashMap<>();
        result.put("auditId",   auditId);
        result.put("valeurQK",  valeurQK);
        result.put("couleurQK", audit.getCouleurQK() != null ? audit.getCouleurQK().name() : null);
        return result;
    }

    // ═══════════════════════════════════════════════════════════
    // 4. LISTER / GÉRER LES ANNEXES
    // ═══════════════════════════════════════════════════════════

    @Transactional(readOnly = true)
    public List<Map<String, Object>> getAnnexesAudit(Long auditId) {
        List<AuditProduitAnnexe> annexes =
                annexeRepo.findByAuditIdOrderByOrdreAffichageAsc(auditId);
        if (annexes.isEmpty()) {
            initialiserAnnexes(auditId);
            annexes = annexeRepo.findByAuditIdOrderByOrdreAffichageAsc(auditId);
        }
        return annexes.stream().map(this::toMap).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public boolean verifierToutesImportees(Long auditId) {
        List<AuditProduitAnnexe> annexes =
                annexeRepo.findByAuditIdOrderByOrdreAffichageAsc(auditId);
        if (annexes.isEmpty()) return false;
        return annexes.stream().allMatch(
                a -> Boolean.TRUE.equals(a.getImporte()) || Boolean.TRUE.equals(a.getFormValide()));
    }

    public Map<String, Object> sauvegarderBrouillonFormulaire(Long auditId,
                                                              String typeAnnexe,
                                                              Map<String, Object> formData) {
        AuditProduitAnnexe annexe = getOrCreateAnnexe(auditId, typeAnnexe);
        annexe.setFormDataJson(writeJson(formData));
        annexe.setFormValide(false);
        annexeRepo.save(annexe);
        return toMap(annexe);
    }

    public Map<String, Object> validerFormulaireAnnexe(Long auditId,
                                                       String typeAnnexe,
                                                       Map<String, Object> formData) {
        AuditProduitAnnexe annexe = getOrCreateAnnexe(auditId, typeAnnexe);
        annexe.setFormDataJson(writeJson(formData));
        annexe.setFormValide(true);
        annexeRepo.save(annexe);

        // Si c'est l'Annexe 1B, synchroniser le QK
        if ("1B".equals(typeAnnexe) && formData.containsKey("valeurQK")) {
            Object qkObj = formData.get("valeurQK");
            if (qkObj != null) {
                try {
                    double qkVal = Double.parseDouble(qkObj.toString());
                    saisirValeurQK(auditId, qkVal, null);
                } catch (NumberFormatException ignored) {}
            }
        }

        // ── NOUVEAU : régénère le rapport mensuel (Annexe 1A) du plant/mois ──
        if ("1B".equals(typeAnnexe)) {
            try {
                AuditProduit audit = getAudit(auditId);
                rapportMensuelService.regenererPourAudit(audit, null);
            } catch (Exception e) {
                // Ne bloque jamais la validation de l'audit si la génération du
                // rapport mensuel échoue (ex: modèle Excel absent du classpath).
                // ✅ CORRIGÉ — ERROR + stack trace complète au lieu d'un simple
                // WARN silencieux, pour pouvoir enfin diagnostiquer la vraie
                // cause quand le rapport reste bloqué à "0 audit" pendant des mois.
                log.error("Régénération du rapport mensuel impossible pour l'audit {}", auditId, e);
            }
        }

        return toMap(annexe);
    }

    // ═══════════════════════════════════════════════════════════
    // NOUVEAU : VALIDATION CROISÉE ENTRE AUDITEURS (ex: Annexe 4)
    // ═══════════════════════════════════════════════════════════

    /**
     * Liste les auditeurs actifs du même plant que l'audit, pour permettre
     * à l'auditeur en cours de désigner un collègue qui validera l'annexe.
     */
    @Transactional(readOnly = true)
    public List<Map<String, Object>> getAuditeursMemePlant(Long auditId, Integer excludeUserId) {
        AuditProduit audit = getAudit(auditId);
        if (audit.getPlant() == null) return Collections.emptyList();
        return userRepo.findByRoleAndActifTrue(RoleUser.AUDITEUR).stream()
                .filter(u -> u.getPlant() != null && u.getPlant().getId().equals(audit.getPlant().getId()))
                .filter(u -> excludeUserId == null || !u.getId().equals(excludeUserId))
                .map(u -> {
                    Map<String, Object> m = new LinkedHashMap<>();
                    m.put("id", u.getId());
                    m.put("nom", u.getNom());
                    m.put("prenom", u.getPrenom());
                    m.put("matricule", u.getMatricule());
                    return m;
                })
                .collect(Collectors.toList());
    }

    /**
     * L'auditeur ayant rempli l'annexe (ex: Annexe 4) l'envoie à un collègue
     * du même plant pour validation/signature numérique. L'annexe ne sera
     * considérée comme complète qu'après validation par ce collègue.
     */
    public Map<String, Object> envoyerAnnexePourValidation(Long auditId,
                                                           String typeAnnexe,
                                                           Long auditeurValidateurId,
                                                           Integer expediteurId) {
        if (auditeurValidateurId == null)
            throw new BusinessException("Veuillez sélectionner un auditeur.");

        AuditProduitAnnexe annexe = getOrCreateAnnexe(auditId, typeAnnexe);
        if (annexe.getFormDataJson() == null || annexe.getFormDataJson().isBlank())
            throw new BusinessException("Veuillez d'abord remplir l'annexe avant de l'envoyer en validation.");

        Utilisateur validateur = userRepo.findById(auditeurValidateurId.intValue())
                .orElseThrow(() -> new BusinessException("Auditeur introuvable."));
        if (validateur.getRole() != RoleUser.AUDITEUR)
            throw new BusinessException("L'utilisateur sélectionné n'est pas un auditeur.");

        AuditProduit audit = getAudit(auditId);
        if (audit.getPlant() == null || validateur.getPlant() == null
                || !validateur.getPlant().getId().equals(audit.getPlant().getId()))
            throw new BusinessException("L'auditeur choisi doit appartenir au même plant que l'audit.");

        Utilisateur expediteur = expediteurId != null ? getUser(expediteurId) : null;
        if (expediteur != null && expediteur.getId().equals(validateur.getId()))
            throw new BusinessException("Vous ne pouvez pas vous désigner vous-même comme validateur.");

        annexe.setAuditeurValidateur(validateur);
        annexe.setStatutValidationCroisee("EN_ATTENTE");
        annexe.setDateEnvoiValidation(LocalDateTime.now());
        annexe.setDateValidationCroisee(null);
        annexe.setCommentaireValidationCroisee(null);
        // L'annexe n'est plus considérée comme complète tant que le collègue n'a pas validé
        annexe.setFormValide(false);
        annexeRepo.save(annexe);

        try {
            String pdfPath = pdfService.genererPdfAnnexeSeule(auditId, typeAnnexe);
            annexe.setPdfValidationPath(pdfPath);
            annexeRepo.save(annexe);
        } catch (Exception e) {
            log.warn("Génération du PDF de l'annexe {} (audit #{}) impossible : {}", typeAnnexe, auditId, e.getMessage());
        }

        String expNom = expediteur != null ? expediteur.getNom() + " " + expediteur.getPrenom() : "un collègue";
        notifService.creerComplete(
                validateur,
                TypeNotification.ANNEXE_A_VALIDER_AUDITEUR,
                "Annexe à valider",
                "L'Annexe " + typeAnnexe + " de l'audit "
                        + (audit.getReference() != null ? audit.getReference() : ("#" + auditId))
                        + ", remplie par " + expNom + ", attend votre validation.",
                "/auditeur/validation-annexe/" + auditId + "/" + typeAnnexe,
                null
        );

        return toMap(annexe);
    }

    /**
     * L'auditeur désigné valide ou rejette l'annexe qui lui a été envoyée.
     * En cas de validation, l'annexe devient "complète" (formValide = true).
     * En cas de rejet, l'expéditeur est notifié et peut corriger puis renvoyer.
     */
    public Map<String, Object> validerAnnexeCroisee(Long auditId,
                                                    String typeAnnexe,
                                                    Boolean valide,
                                                    String commentaire,
                                                    Integer validateurId) {
        AuditProduitAnnexe annexe = annexeRepo.findByAuditIdAndTypeAnnexe(auditId, typeAnnexe)
                .orElseThrow(() -> new BusinessException("Annexe introuvable."));

        if (annexe.getAuditeurValidateur() == null
                || !annexe.getAuditeurValidateur().getId().equals(validateurId))
            throw new BusinessException("Vous n'êtes pas désigné pour valider cette annexe.");
        if (!"EN_ATTENTE".equals(annexe.getStatutValidationCroisee()))
            throw new BusinessException("Cette annexe n'est plus en attente de validation.");

        AuditProduit audit = getAudit(auditId);
        Utilisateur expediteur = audit.getAuditeur();
        Utilisateur validateur = annexe.getAuditeurValidateur();

        annexe.setDateValidationCroisee(LocalDateTime.now());
        annexe.setCommentaireValidationCroisee(commentaire);

        if (Boolean.TRUE.equals(valide)) {
            annexe.setStatutValidationCroisee("VALIDEE");
            annexe.setFormValide(true);
            if (expediteur != null) {
                notifService.creerComplete(expediteur, TypeNotification.ANNEXE_VALIDEE_AUDITEUR,
                        "Annexe validée",
                        "Votre Annexe " + typeAnnexe + " a été validée par "
                                + validateur.getNom() + " " + validateur.getPrenom() + "."
                                + (commentaire != null && !commentaire.isBlank() ? " Commentaire : " + commentaire : ""),
                        "/auditeur/audits/" + auditId, null);
            }
        } else {
            annexe.setStatutValidationCroisee("REJETEE");
            annexe.setFormValide(false);
            if (expediteur != null) {
                notifService.creerComplete(expediteur, TypeNotification.ANNEXE_REJETEE_AUDITEUR,
                        "Annexe rejetée",
                        "Votre Annexe " + typeAnnexe + " a été rejetée par "
                                + validateur.getNom() + " " + validateur.getPrenom()
                                + ". Merci de corriger puis de la renvoyer."
                                + (commentaire != null && !commentaire.isBlank() ? " Raison : " + commentaire : ""),
                        "/auditeur/audits/" + auditId, null);
            }
        }
        annexeRepo.save(annexe);
        return toMap(annexe);
    }

    /**
     * Récupère l'annexe pour affichage dans la fenêtre de validation croisée —
     * uniquement accessible à l'auditeur désigné comme validateur.
     */
    @Transactional(readOnly = true)
    public Map<String, Object> getAnnexePourValidateur(Long auditId, String typeAnnexe, Integer validateurId) {
        AuditProduitAnnexe annexe = annexeRepo.findByAuditIdAndTypeAnnexe(auditId, typeAnnexe)
                .orElseThrow(() -> new BusinessException("Annexe introuvable."));
        if (annexe.getAuditeurValidateur() == null
                || !annexe.getAuditeurValidateur().getId().equals(validateurId))
            throw new BusinessException("Accès non autorisé à cette annexe.");
        return toMap(annexe);
    }

    // ── NOUVEAU : pré-remplissage du brouillon Annexe 1A depuis le précédent ──

    /**
     * Pré-remplit le brouillon Annexe 1A d'un nouvel audit en copiant celui du
     * dernier audit (même auditeur + même plant + même mois/année) — la
     * saisie de l'Annexe 1B de ce nouvel audit viendra ensuite s'ajouter par
     * dessus, comme demandé : "ajouter audit sur audit".
     */
    public void preRemplirAnnexe1ADepuisPrecedent(AuditProduit nouvelAudit) {
        if (nouvelAudit.getAuditeur() == null || nouvelAudit.getPlant() == null
                || nouvelAudit.getDatePrevue() == null) return;

        Optional<AuditProduit> precedent = auditRepo
                .findByAuditeurIdAndTypeAuditOrderByDatePrevueDesc(
                        nouvelAudit.getAuditeur().getId(), nouvelAudit.getTypeAudit())
                .stream()
                .filter(a -> !a.getId().equals(nouvelAudit.getId()))
                .filter(a -> a.getPlant() != null && a.getPlant().getId().equals(nouvelAudit.getPlant().getId()))
                .filter(a -> a.getDatePrevue() != null
                        && a.getDatePrevue().getYear()  == nouvelAudit.getDatePrevue().getYear()
                        && a.getDatePrevue().getMonthValue() == nouvelAudit.getDatePrevue().getMonthValue())
                .findFirst();

        precedent.flatMap(p -> annexeRepo.findByAuditIdAndTypeAnnexe(p.getId(), "1A"))
                .ifPresent(annexePrecedente -> {
                    AuditProduitAnnexe brouillon = getOrCreateAnnexe(nouvelAudit.getId(), "1A");
                    brouillon.setFormDataJson(annexePrecedente.getFormDataJson());
                    brouillon.setFormValide(false); // reste un brouillon tant que l'auditeur ne le valide pas
                    annexeRepo.save(brouillon);
                });
    }

    public Map<String, Object> ajouterAnnexe(Long auditId, String typeAnnexe,
                                             String libelle, Integer ordreAffichage) {
        AuditProduit audit = getAudit(auditId);
        Optional<AuditProduitAnnexe> existing =
                annexeRepo.findByAuditIdAndTypeAnnexe(auditId, typeAnnexe);
        if (existing.isPresent()) return toMap(existing.get());

        AuditProduitAnnexe annexe = new AuditProduitAnnexe();
        annexe.setAudit(audit);
        annexe.setTypeAnnexe(typeAnnexe);
        annexe.setLibelle(libelle != null && !libelle.isBlank() ? libelle : "Annexe " + typeAnnexe);
        annexe.setImporte(false);
        annexe.setFormValide(false);
        annexe.setOrdreAffichage(ordreAffichage != null ? ordreAffichage : 99);
        annexeRepo.save(annexe);
        return toMap(annexe);
    }

    public void retirerAnnexe(Long auditId, String typeAnnexe) {
        annexeRepo.deleteByAuditIdAndTypeAnnexe(auditId, typeAnnexe);
    }

    // ═══════════════════════════════════════════════════════════
    // 5. GÉNÉRATION RAPPORT PDF LEONI PROFESSIONNEL
    //    Structure conforme IT TN 3625 + normes LEONI
    // ═══════════════════════════════════════════════════════════

    public Map<String, Object> genererRapport(Long auditId, Integer auditeurId) {
        AuditProduit audit = getAudit(auditId);

        List<AuditProduitAnnexe> annexes =
                annexeRepo.findByAuditIdOrderByOrdreAffichageAsc(auditId);

        // Supprimer l'ancien rapport si remplacement
        if (audit.getRapportGenerePdfUrl() != null) {
            try { Files.deleteIfExists(Paths.get(audit.getRapportGenerePdfUrl())); }
            catch (IOException ignored) {}
        }

        // Nom du fichier
        String serieNom       = audit.getSerie() != null ? audit.getSerie().getNom() : "inconnue";
        String safeSerieNom   = sanitizeFileToken(serieNom);
        String dateToken      = LocalDateTime.now().format(FMT_TOKEN);
        String rapportNom     = "rapport_auditProduit_" + safeSerieNom + "_" + dateToken + ".html";
        String rapportPath    = REPORT_DIR + rapportNom;

        // Générer le HTML du rapport
        String htmlContent = buildRapportHTML(audit, annexes);

        try {
            Path path = Paths.get(rapportPath);
            Files.createDirectories(path.getParent());
            Files.writeString(path, htmlContent, java.nio.charset.StandardCharsets.UTF_8);
        } catch (IOException e) {
            throw new BusinessException("Erreur génération rapport : " + e.getMessage());
        }

        // Mettre à jour l'audit
        audit.setRapportGenere(true);
        audit.setRapportGenerePdfUrl(rapportPath);
        audit.setRapportFichierNom(rapportNom);
        audit.setDateEnvoi(LocalDateTime.now());
        auditRepo.save(audit);

        // Notifications
        if (audit.getPlanificateur() != null) {
            notifService.creer(
                    audit.getPlanificateur(),
                    TypeNotification.INFORMATION,
                    "Rapport soumis — " + audit.getReference()
                            + " — QK=" + audit.getValeurQK()
                            + " (" + audit.getCouleurQK() + ")"
            );
            if (audit.getPlanificateur().getEmail() != null) {
                emailService.envoyerNotification(
                        audit.getPlanificateur().getEmail(),
                        audit.getPlanificateur().getPrenom() + " " + audit.getPlanificateur().getNom(),
                        "Rapport soumis — " + audit.getReference(),
                        buildEmailBody(audit)
                );
            }
        }

        CouleurQK couleur = audit.getCouleurQK();
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("auditId",    auditId);
        result.put("rapportUrl", rapportPath);
        result.put("rapportNom", rapportNom);
        result.put("valeurQK",   audit.getValeurQK());
        result.put("couleurQK",  couleur != null ? couleur.name() : null);
        result.put("message",    "Rapport généré avec succès.");
        result.put("afficherFicheReparation", couleur != null && couleur != CouleurQK.VERT);
        result.put("afficherPDCA",    couleur == CouleurQK.ROSE || couleur == CouleurQK.ROUGE);
        result.put("afficherAction",  couleur == CouleurQK.ROUGE);
        return result;
    }

    // ── Construction du HTML du rapport LEONI ─────────────────

    private String buildRapportHTML(AuditProduit audit,
                                    List<AuditProduitAnnexe> annexes) {
        StringBuilder sb = new StringBuilder();
        String dateStr    = audit.getDatePrevue() != null
                ? audit.getDatePrevue().format(FMT_DATE) : "—";
        String dateEnvoi  = LocalDateTime.now().format(FMT_DATE);
        String qkVal      = audit.getValeurQK() != null
                ? String.format("%.2f", audit.getValeurQK()) : "—";
        String couleurQK  = audit.getCouleurQK() != null ? audit.getCouleurQK().name() : "—";
        String qkColor    = getQkHexColor(audit.getCouleurQK());
        String qkLabel    = getQkLabel(audit.getCouleurQK());

        // ── Page de garde ──
        sb.append("""
            <!DOCTYPE html>
            <html lang="fr">
            <head>
              <meta charset="UTF-8"/>
              <title>Rapport Audit Produit LEONI — %s</title>
              <style>
                @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;600;700&family=Plus+Jakarta+Sans:wght@700;800;900&display=swap');
                * { box-sizing: border-box; margin: 0; padding: 0; }
                body { font-family: 'DM Sans', Arial, sans-serif; font-size: 11pt; color: #1E2A3A; background: #fff; }
                .page { width: 210mm; min-height: 297mm; margin: 0 auto; padding: 18mm 16mm; }
                .page-break { page-break-before: always; }
                h1 { font-family: 'Plus Jakarta Sans', sans-serif; font-size: 22pt; color: #001F4E; }
                h2 { font-family: 'Plus Jakarta Sans', sans-serif; font-size: 14pt; color: #001F4E; margin: 14px 0 8px; }
                h3 { font-size: 11pt; font-weight: 700; color: #001F4E; margin: 10px 0 6px; }
                table { width: 100%%; border-collapse: collapse; margin-bottom: 12px; }
                th { background: #001F4E; color: #fff; padding: 6px 8px; font-size: 9pt; text-align: left; border: 1px solid #001F4E; }
                td { padding: 5px 8px; border: 1px solid #BCC8DC; font-size: 9pt; }
                tr:nth-child(even) td { background: #F7F9FC; }
                .nok td { background: #FEF2F2 !important; color: #DC2626; font-weight: 700; }
                .ok-badge  { display: inline-block; padding: 2px 8px; border-radius: 4px; background: #ECFDF5; color: #059669; font-weight: 700; font-size: 9pt; border: 1px solid #A7F3D0; }
                .nok-badge { display: inline-block; padding: 2px 8px; border-radius: 4px; background: #FEF2F2; color: #DC2626; font-weight: 700; font-size: 9pt; border: 1px solid #FECACA; }
                .header-leoni { display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid #001F4E; padding-bottom: 14px; margin-bottom: 20px; }
                .leoni-logo { font-family: 'Plus Jakarta Sans', sans-serif; font-size: 28pt; font-weight: 900; color: #001F4E; letter-spacing: 2px; }
                .ref-box { background: #F0F4FF; border: 1.5px solid #BCC8DC; border-radius: 6px; padding: 10px 14px; margin-bottom: 16px; }
                .ref-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; }
                .ref-item { font-size: 9pt; }
                .ref-label { font-weight: 700; color: #6B7280; }
                .qk-box { border-radius: 8px; padding: 16px 20px; margin: 16px 0; border: 2px solid %s; background: %s; }
                .qk-title { font-size: 16pt; font-weight: 900; color: %s; font-family: 'Plus Jakarta Sans', sans-serif; }
                .section-header { background: linear-gradient(135deg, #001F4E, #003F8A); color: #fff; padding: 8px 14px; border-radius: 6px; margin: 20px 0 10px; font-weight: 800; font-size: 11pt; }
                .footer { margin-top: 30px; padding-top: 10px; border-top: 1px solid #BCC8DC; font-size: 8pt; color: #9CA3AF; display: flex; justify-content: space-between; }
                .annexe-card { border: 1px solid #BCC8DC; border-radius: 6px; padding: 10px 14px; margin-bottom: 8px; }
                .annexe-ok { border-color: #A7F3D0; background: #F0FDF4; }
                .annexe-nok { border-color: #FECACA; background: #FEF2F2; }
                .warn-box { background: #FFFBEB; border: 1.5px solid #FCD34D; border-radius: 6px; padding: 10px 14px; margin: 10px 0; font-size: 9pt; }
                .danger-box { background: #FEF2F2; border: 1.5px solid #FECACA; border-radius: 6px; padding: 10px 14px; margin: 10px 0; }
                .pdca-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin: 10px 0; }
                .pdca-cell { padding: 10px; border-radius: 6px; }
                .pdca-P { background: #EFF6FF; border: 1px solid #BFDBFE; }
                .pdca-D { background: #ECFDF5; border: 1px solid #A7F3D0; }
                .pdca-C { background: #F5F3FF; border: 1px solid #DDD6FE; }
                .pdca-A { background: #FFFBEB; border: 1px solid #FCD34D; }
                .pdca-label { font-size: 8pt; font-weight: 800; color: #6B7280; text-transform: uppercase; margin-bottom: 4px; }
              </style>
            </head>
            <body>
            """.formatted(
                audit.getReference(),
                qkColor, qkColor + "20", qkColor,
                qkColor, qkColor + "15", qkColor
        ));

        // ── Page de garde principale ──
        sb.append("""
            <div class="page">
              <div class="header-leoni">
                <div>
                  <div style="font-size:8pt;color:#9CA3AF;font-weight:700;letter-spacing:.1em;text-transform:uppercase;">IT TN 3625 — RAPPORT D'AUDIT PRODUIT</div>
                  <h1 style="margin-top:4px;">Rapport d'Audit Produit</h1>
                  <div style="font-size:10pt;color:#5C6F8A;margin-top:4px;">Conforme LEONI IT TN 3625</div>
                </div>
                <div class="leoni-logo">LEONI</div>
              </div>

              <div class="ref-box">
                <div class="ref-grid">
                  <div class="ref-item"><span class="ref-label">Référence :</span> %s</div>
                  <div class="ref-item"><span class="ref-label">Date d'audit :</span> %s</div>
                  <div class="ref-item"><span class="ref-label">Série / TAB :</span> %s</div>
                  <div class="ref-item"><span class="ref-label">Plant :</span> %s</div>
                  <div class="ref-item"><span class="ref-label">Auditeur :</span> %s</div>
                  <div class="ref-item"><span class="ref-label">Date de génération :</span> %s</div>
                  <div class="ref-item"><span class="ref-label">Statut :</span> %s</div>
                  <div class="ref-item"><span class="ref-label">Nb annexes :</span> %d</div>
                </div>
              </div>

              <div class="qk-box">
                <div style="display:flex;justify-content:space-between;align-items:center;">
                  <div>
                    <div style="font-size:8pt;font-weight:700;color:%s;text-transform:uppercase;letter-spacing:.1em;margin-bottom:4px;">Résultat QK — Indice de Qualité</div>
                    <div class="qk-title">QK = %s</div>
                    <div style="font-size:10pt;color:%s;font-weight:600;margin-top:4px;">%s</div>
                  </div>
                  <div style="text-align:center;">
                    %s
                  </div>
                </div>
              </div>
            """.formatted(
                audit.getReference(),
                dateStr,
                audit.getSerie() != null ? audit.getSerie().getNom() : "—",
                audit.getPlant() != null ? audit.getPlant().getNom() : "—",
                audit.getAuditeur() != null ? audit.getAuditeur().getPrenom() + " " + audit.getAuditeur().getNom() : "—",
                dateEnvoi,
                audit.getStatut() != null ? audit.getStatut().toString() : "—",
                annexes.size(),
                qkColor, qkVal, qkColor, qkLabel,
                buildQkActionHTML(audit.getCouleurQK())
        ));

        // Table des matières
        sb.append("""
              <div class="section-header">📋 Table des matières</div>
              <table>
                <thead><tr><th>#</th><th>Section</th><th>Description</th><th>Statut</th></tr></thead>
                <tbody>
                  <tr><td>1</td><td>Résumé exécutif</td><td>Synthèse de l'audit produit</td><td><span class="ok-badge">Inclus</span></td></tr>
                  <tr><td>2</td><td>Annexes de l'audit</td><td>%d annexe(s) renseignées</td><td><span class="ok-badge">Inclus</span></td></tr>
                  <tr><td>3</td><td>Récapitulatif des non-conformités</td><td>Défauts détectés et mesures</td><td><span class="ok-badge">Inclus</span></td></tr>
                  <tr><td>4</td><td>Actions correctives</td><td>Fiches de réparation, PDCA</td><td><span class="ok-badge">Inclus</span></td></tr>
                  <tr><td>5</td><td>Calcul QK détaillé</td><td>Table PI3010 — Pondération</td><td><span class="ok-badge">Inclus</span></td></tr>
                  <tr><td>6</td><td>Signatures & Validation</td><td>Auditeur, Responsable QM</td><td>À signer</td></tr>
                </tbody>
              </table>
              <div class="footer">
                <span>Document généré automatiquement — LEONI PAP v3</span>
                <span>IT TN 3625 — Confidentiel Interne</span>
                <span>Page 1</span>
              </div>
            </div>
            """.formatted(annexes.size()));

        // ── Section 1 : Résumé exécutif ──
        sb.append(buildResumePage(audit, annexes, qkVal, qkColor, qkLabel));

        // ── Section 2 : Détail des annexes ──
        sb.append(buildAnnexesPage(audit, annexes));

        // ── Section 3 : Non-conformités ──
        sb.append(buildNonConformitesPage(audit, annexes));

        // ── Section 4 : Actions correctives (Fiche + PDCA) ──
        sb.append(buildActionsPage(audit));

        // ── Section 5 : Calcul QK ──
        sb.append(buildQKPage(audit, annexes));

        // ── Section 6 : Signatures ──
        sb.append(buildSignaturesPage(audit, dateEnvoi));

        sb.append("</body></html>");
        return sb.toString();
    }

    // ── Résumé exécutif ────────────────────────────────────────

    private String buildResumePage(AuditProduit audit,
                                   List<AuditProduitAnnexe> annexes,
                                   String qkVal, String qkColor, String qkLabel) {
        long nbCompletes  = annexes.stream().filter(a -> Boolean.TRUE.equals(a.getImporte()) || Boolean.TRUE.equals(a.getFormValide())).count();
        long nbImportees  = annexes.stream().filter(a -> Boolean.TRUE.equals(a.getImporte())).count();
        long nbFormulaires= annexes.stream().filter(a -> Boolean.TRUE.equals(a.getFormValide())).count();
        long nbNok = comptageNokFromAnnexes(annexes);

        return """
            <div class="page page-break">
              <div class="header-leoni">
                <div><h2>Section 1 — Résumé Exécutif</h2></div>
                <div class="leoni-logo" style="font-size:18pt;">LEONI</div>
              </div>
              <table>
                <thead><tr><th colspan="2">Récapitulatif de l'audit — %s</th></tr></thead>
                <tbody>
                  <tr><td><b>Référence audit</b></td><td>%s</td></tr>
                  <tr><td><b>Auditeur</b></td><td>%s</td></tr>
                  <tr><td><b>Série / TAB</b></td><td>%s</td></tr>
                  <tr><td><b>Plant</b></td><td>%s</td></tr>
                  <tr><td><b>Date d'audit</b></td><td>%s</td></tr>
                  <tr><td><b>Nb total annexes</b></td><td>%d</td></tr>
                  <tr><td><b>Annexes complètes</b></td><td>%d (%d importées / %d formulaires)</td></tr>
                  <tr><td><b>Non-conformités détectées</b></td><td style="color:%s;font-weight:700;">%d</td></tr>
                  <tr><td><b>QK calculé</b></td><td style="color:%s;font-weight:900;font-size:14pt;">%s</td></tr>
                  <tr><td><b>Verdict</b></td><td style="color:%s;font-weight:700;">%s</td></tr>
                  <tr><td><b>Actions requises</b></td><td>%s</td></tr>
                </tbody>
              </table>
              <div class="footer">
                <span>Audit Produit LEONI — IT TN 3625</span>
                <span>Section 1 / 6</span>
                <span>Page 2</span>
              </div>
            </div>
            """.formatted(
                audit.getReference(),
                audit.getReference(),
                audit.getAuditeur() != null ? audit.getAuditeur().getPrenom() + " " + audit.getAuditeur().getNom() : "—",
                audit.getSerie() != null ? audit.getSerie().getNom() : "—",
                audit.getPlant() != null ? audit.getPlant().getNom() : "—",
                audit.getDatePrevue() != null ? audit.getDatePrevue().format(FMT_DATE) : "—",
                annexes.size(),
                nbCompletes, nbImportees, nbFormulaires,
                nbNok > 0 ? "#DC2626" : "#059669", nbNok,
                qkColor, qkVal,
                qkColor, qkLabel,
                buildActionsRequises(audit.getCouleurQK())
        );
    }

    // ── Détail des annexes ─────────────────────────────────────

    private String buildAnnexesPage(AuditProduit audit, List<AuditProduitAnnexe> annexes) {
        StringBuilder sb = new StringBuilder();
        sb.append("""
            <div class="page page-break">
              <div class="header-leoni">
                <div><h2>Section 2 — Détail des Annexes</h2></div>
                <div class="leoni-logo" style="font-size:18pt;">LEONI</div>
              </div>
            """);

        sb.append("""
            <table>
              <thead><tr>
                <th style="width:60px">Annexe</th>
                <th>Libellé</th>
                <th style="width:90px">Type</th>
                <th style="width:100px">Statut</th>
                <th style="width:80px">QK Extrait</th>
                <th style="width:110px">Date</th>
                <th>Fichier</th>
              </tr></thead>
              <tbody>
            """);

        for (AuditProduitAnnexe a : annexes) {
            boolean done = Boolean.TRUE.equals(a.getImporte()) || Boolean.TRUE.equals(a.getFormValide());
            String statusBadge = done
                    ? "<span class=\"ok-badge\">✓ Complète</span>"
                    : "<span class=\"nok-badge\">⚠ À compléter</span>";
            String qkExtrait = a.getValeurQkExtraite() != null ? String.valueOf(a.getValeurQkExtraite()) : "—";
            String dateImport = a.getDateImport() != null ? a.getDateImport().format(FMT_DATE) : "—";
            String fichier   = a.getFichierNom() != null ? a.getFichierNom() : (Boolean.TRUE.equals(a.getFormValide()) ? "Formulaire numérique" : "—");

            sb.append("<tr class=\"%s\"><td><b>%s</b></td><td>%s</td><td>%s</td><td>%s</td><td>%s</td><td>%s</td><td style=\"font-size:8pt\">%s</td></tr>"
                    .formatted(
                            done ? "" : "nok",
                            a.getTypeAnnexe(), a.getLibelle() != null ? a.getLibelle() : "—",
                            Boolean.TRUE.equals(a.getFormValide()) ? "Formulaire" : "Fichier",
                            statusBadge, qkExtrait, dateImport, fichier
                    ));
        }

        sb.append("""
              </tbody>
            </table>
            """);

        // Si annexe 1B a des données de défauts, les afficher
        annexes.stream()
                .filter(a -> "1B".equals(a.getTypeAnnexe()) && a.getFormDataJson() != null)
                .findFirst()
                .ifPresent(a1b -> {
                    Map<String, Object> formData = readJson(a1b.getFormDataJson());
                    if (formData != null && formData.containsKey("defauts")) {
                        sb.append(buildDefautsTable1B(formData));
                    }
                });

        sb.append("""
              <div class="footer">
                <span>Audit Produit LEONI — IT TN 3625</span>
                <span>Section 2 / 6</span>
                <span>Page 3</span>
              </div>
            </div>
            """);

        return sb.toString();
    }

    private String buildDefautsTable1B(Map<String, Object> formData) {
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> defauts = (List<Map<String, Object>>) formData.get("defauts");
        if (defauts == null || defauts.isEmpty()) return "";

        StringBuilder sb = new StringBuilder();
        sb.append("""
        <table>
          <thead><tr>
            <th>#</th><th>Défaut</th><th>Catégorie</th>
            <th>Fréq.</th><th>Pts/défaut</th><th>Total</th>
          </tr></thead>
          <tbody>
        """);

        double grandTotal = 0;
        int i = 1;
        for (Map<String, Object> d : defauts) {
            double total = parseDouble(d.get("total"), 0.0);
            grandTotal += total;

            String desc = Objects.toString(d.get("description"), "—");
            String cat  = Objects.toString(d.get("categorie"), "—");
            String freq = Objects.toString(d.get("frequence"), "—");
            String pts  = Objects.toString(d.get("pointsDefaut"), "—");

            sb.append(String.format(
                    "<tr class=\"%s\"><td>%d</td><td>%s</td><td>%s</td><td>%s</td><td>%s</td><td style=\"font-weight:700;\">%.1f</td></tr>",
                    total > 0 ? "nok" : "",
                    i++,
                    desc,
                    cat,
                    freq,
                    pts,
                    total
            ));
        }

        sb.append("</tbody></table>");
        return sb.toString();
    }

    // ── Non-conformités ────────────────────────────────────────

    private String buildNonConformitesPage(AuditProduit audit,
                                           List<AuditProduitAnnexe> annexes) {
        List<String> nonConformes = new ArrayList<>();
        for (AuditProduitAnnexe ann : annexes) {
            if (ann.getFormDataJson() == null) continue;
            Map<String, Object> fd = readJson(ann.getFormDataJson());
            if (fd == null) continue;
            extractNokStrings(ann.getTypeAnnexe(), fd, nonConformes);
        }

        StringBuilder sb = new StringBuilder();
        sb.append("""
            <div class="page page-break">
              <div class="header-leoni">
                <div><h2>Section 3 — Récapitulatif des Non-Conformités</h2></div>
                <div class="leoni-logo" style="font-size:18pt;">LEONI</div>
              </div>
            """);

        if (nonConformes.isEmpty()) {
            sb.append("""
                <div style="background:#ECFDF5;border:2px solid #A7F3D0;border-radius:8px;padding:20px;text-align:center;">
                  <div style="font-size:28pt;">✅</div>
                  <div style="font-weight:800;color:#059669;font-size:14pt;margin-top:8px;">Aucune non-conformité détectée</div>
                  <div style="color:#6B7280;margin-top:4px;">Toutes les mesures et contrôles sont dans les tolérances.</div>
                </div>
                """);
        } else {
            sb.append("<div class=\"danger-box\"><b>⚠ %d non-conformité(s) détectée(s)</b></div>".formatted(nonConformes.size()));
            sb.append("""
                <table>
                  <thead><tr><th>#</th><th>Non-conformité</th><th>Origine</th></tr></thead>
                  <tbody>
                """);
            for (int i = 0; i < nonConformes.size(); i++) {
                sb.append("<tr class=\"nok\"><td>%d</td><td>%s</td><td>Annexe</td></tr>"
                        .formatted(i + 1, nonConformes.get(i)));
            }
            sb.append("</tbody></table>");
        }

        sb.append("""
              <div class="footer">
                <span>Audit Produit LEONI — IT TN 3625</span>
                <span>Section 3 / 6</span>
                <span>Page 4</span>
              </div>
            </div>
            """);
        return sb.toString();
    }

    // ── Actions correctives ────────────────────────────────────

    private String buildActionsPage(AuditProduit audit) {
        CouleurQK couleur = audit.getCouleurQK();
        String qkVal = audit.getValeurQK() != null ? String.format("%.2f", audit.getValeurQK()) : "—";

        return """
            <div class="page page-break">
              <div class="header-leoni">
                <div><h2>Section 4 — Actions Correctives</h2></div>
                <div class="leoni-logo" style="font-size:18pt;">LEONI</div>
              </div>
              %s
              <h3 style="margin-top:20px">4.1 — Fiche de Réparation</h3>
              <table>
                <thead><tr><th>Champ</th><th>Valeur</th></tr></thead>
                <tbody>
                  <tr><td>Audit de référence</td><td>%s</td></tr>
                  <tr><td>Valeur QK</td><td style="font-weight:700;color:%s;">%s</td></tr>
                  <tr><td>Date de génération</td><td>%s</td></tr>
                  <tr><td>Fiche de réparation</td><td>%s</td></tr>
                </tbody>
              </table>
              %s
              <div class="footer">
                <span>Audit Produit LEONI — IT TN 3625</span>
                <span>Section 4 / 6</span>
                <span>Page 5</span>
              </div>
            </div>
            """.formatted(
                buildQkActionHTML(couleur),
                audit.getReference(),
                getQkHexColor(couleur), qkVal,
                LocalDateTime.now().format(FMT_DATE),
                couleur == CouleurQK.VERT ? "Non requise (QK = 0)" : "Requise — À joindre",
                buildPDCASection(couleur)
        );
    }

    private String buildPDCASection(CouleurQK couleur) {
        if (couleur != CouleurQK.ROSE && couleur != CouleurQK.ROUGE) return "";
        return """
            <h3 style="margin-top:20px">4.2 — Plan d'Action PDCA</h3>
            <div class="pdca-grid">
              <div class="pdca-cell pdca-P">
                <div class="pdca-label">P — Plan : Planifier</div>
                <div style="min-height:60px;color:#9CA3AF;font-style:italic;font-size:9pt;">À renseigner par le responsable qualité</div>
              </div>
              <div class="pdca-cell pdca-D">
                <div class="pdca-label">D — Do : Réaliser</div>
                <div style="min-height:60px;color:#9CA3AF;font-style:italic;font-size:9pt;">Actions correctives à mettre en œuvre</div>
              </div>
              <div class="pdca-cell pdca-C">
                <div class="pdca-label">C — Check : Vérifier</div>
                <div style="min-height:60px;color:#9CA3AF;font-style:italic;font-size:9pt;">Vérification de l'efficacité des actions</div>
              </div>
              <div class="pdca-cell pdca-A">
                <div class="pdca-label">A — Act : Standardiser</div>
                <div style="min-height:60px;color:#9CA3AF;font-style:italic;font-size:9pt;">Standardisation et pérennisation</div>
              </div>
            </div>
            """;
    }

    // ── Calcul QK détaillé ─────────────────────────────────────

    private String buildQKPage(AuditProduit audit, List<AuditProduitAnnexe> annexes) {
        String qkVal = audit.getValeurQK() != null ? String.format("%.2f", audit.getValeurQK()) : "—";
        String qkColor = getQkHexColor(audit.getCouleurQK());

        // Chercher les données de l'Annexe 1B
        String tableDefauts = "";
        for (AuditProduitAnnexe a : annexes) {
            if ("1B".equals(a.getTypeAnnexe()) && a.getFormDataJson() != null) {
                Map<String, Object> fd = readJson(a.getFormDataJson());
                if (fd != null) tableDefauts = buildQKDetailTable(fd);
                break;
            }
        }

        return """
            <div class="page page-break">
              <div class="header-leoni">
                <div><h2>Section 5 — Calcul QK Détaillé (Table PI3010)</h2></div>
                <div class="leoni-logo" style="font-size:18pt;">LEONI</div>
              </div>
              <div style="background:#F7F9FC;border:1.5px solid #BCC8DC;border-radius:8px;padding:14px 18px;margin-bottom:16px;">
                <h3>Formule de calcul :</h3>
                <ol style="margin-left:20px;font-size:10pt;line-height:1.8;">
                  <li><b>Total Points</b> = Σ (Fréquence × Points par défaut)</li>
                  <li><b>Rating Factor f(n)</b> = Facteur correctif selon nombre de composants</li>
                  <li><b>Weighted Points (WP)</b> = Total Points × Rating Factor</li>
                  <li><b>QK</b> = Table PI3010 (WP) → Valeur tabulée</li>
                </ol>
              </div>
              %s
              <div style="margin-top:16px;text-align:center;background:%s15;border:2px solid %s;border-radius:10px;padding:14px;">
                <div style="font-size:9pt;font-weight:700;color:%s;text-transform:uppercase;letter-spacing:.1em;">Valeur QK finale</div>
                <div style="font-size:32pt;font-weight:900;color:%s;font-family:'Plus Jakarta Sans',sans-serif;">%s</div>
                <div style="font-size:10pt;color:%s;">%s</div>
              </div>
              <div class="footer">
                <span>Audit Produit LEONI — IT TN 3625</span>
                <span>Section 5 / 6</span>
                <span>Page 6</span>
              </div>
            </div>
            """.formatted(
                tableDefauts,
                qkColor, qkColor, qkColor, qkColor, qkVal, qkColor,
                getQkLabel(audit.getCouleurQK())
        );
    }

    private String buildQKDetailTable(Map<String, Object> formData) {
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> defauts = (List<Map<String, Object>>) formData.get("defauts");
        if (defauts == null || defauts.isEmpty()) return "";

        StringBuilder sb = new StringBuilder();
        sb.append("""
            <table>
              <thead><tr>
                <th>#</th><th>Défaut</th><th>Catégorie</th>
                <th>Fréq.</th><th>Pts/défaut</th><th>Total</th>
              </tr></thead>
              <tbody>
            """);

        double grandTotal = 0;
        int i = 1;
        for (Map<String, Object> d : defauts) {
            double total = parseDouble(d.get("total"), 0.0);
            grandTotal += total;
            sb.append("<tr><td>%d</td><td>%s</td><td>%s</td><td>%s</td><td>%s</td><td style=\"font-weight:700;\">%.1f</td></tr>"
                    .formatted(i++, d.getOrDefault("description", ""), d.getOrDefault("categorie", ""),
                            d.getOrDefault("frequence", ""), d.getOrDefault("pointsDefaut", ""), total));
        }

        double nbComp = parseDouble(formData.get("nbComposants"), 0.0);
        double rf     = getRatingFactor((int) nbComp);
        double wp     = grandTotal * rf;

        sb.append("<tr style=\"background:#EEF2F8;\"><td colspan=\"5\"><b>Total Points</b></td><td><b>%.2f</b></td></tr>".formatted(grandTotal));
        sb.append("<tr style=\"background:#EEF2F8;\"><td colspan=\"5\"><b>Rating Factor (n=%d)</b></td><td><b>%.1f</b></td></tr>".formatted((int)nbComp, rf));
        sb.append("<tr style=\"background:#F0F4FF;\"><td colspan=\"5\"><b>Weighted Points (WP)</b></td><td><b>%.2f</b></td></tr>".formatted(wp));
        sb.append("</tbody></table>");
        return sb.toString();
    }

    // ── Signatures ─────────────────────────────────────────────

    private String buildSignaturesPage(AuditProduit audit, String dateEnvoi) {
        return """
            <div class="page page-break">
              <div class="header-leoni">
                <div><h2>Section 6 — Signatures &amp; Validation</h2></div>
                <div class="leoni-logo" style="font-size:18pt;">LEONI</div>
              </div>
              <table>
                <thead><tr><th>Rôle</th><th>Nom &amp; Prénom</th><th>Date</th><th>Signature</th></tr></thead>
                <tbody>
                  <tr>
                    <td><b>Auditeur Produit</b></td>
                    <td>%s</td>
                    <td>%s</td>
                    <td style="min-height:40px;background:#F7F9FC;"></td>
                  </tr>
                  <tr>
                    <td><b>Responsable Qualité Plant</b></td>
                    <td></td>
                    <td></td>
                    <td style="min-height:40px;background:#F7F9FC;"></td>
                  </tr>
                  <tr>
                    <td><b>Responsable Qualité Centrale</b></td>
                    <td></td>
                    <td></td>
                    <td style="min-height:40px;background:#F7F9FC;"></td>
                  </tr>
                </tbody>
              </table>
              <div class="warn-box" style="margin-top:20px;">
                <b>🔒 Document confidentiel LEONI</b><br/>
                Ce rapport est généré automatiquement par la plateforme PAP LEONI.<br/>
                Référence : IT TN 3625 — Mise à jour : 09/2025
              </div>
              <div class="footer">
                <span>Audit Produit LEONI — IT TN 3625</span>
                <span>Section 6 / 6 — Document Final</span>
                <span>Page 7</span>
              </div>
            </div>
            """.formatted(
                audit.getAuditeur() != null
                        ? audit.getAuditeur().getPrenom() + " " + audit.getAuditeur().getNom() : "—",
                dateEnvoi
        );
    }

    // ── HTML helpers QK ────────────────────────────────────────

    private String buildQkActionHTML(CouleurQK couleur) {
        if (couleur == null) return "";
        return switch (couleur) {
            case VERT   -> "<div style=\"background:#ECFDF5;border:2px solid #A7F3D0;border-radius:8px;padding:12px 16px;color:#059669;\"><b>✅ Produit Conforme — QK = 0.</b> Aucune action requise.</div>";
            case ORANGE -> "<div style=\"background:#FFF7ED;border:2px solid #FED7AA;border-radius:8px;padding:12px 16px;color:#D97706;\"><b>⚠ Non-Conformité Mineure — 0 &lt; QK ≤ 0.5.</b> Fiche de réparation requise.</div>";
            case ROSE   -> "<div style=\"background:#FDF2F8;border:2px solid #F9A8D4;border-radius:8px;padding:12px 16px;color:#9D174D;\"><b>⚡ Action Corrective Requise — 0.5 &lt; QK ≤ 1.</b> Fiche + PDCA requis.</div>";
            case ROUGE  -> "<div style=\"background:#FEF2F2;border:2px solid #FECACA;border-radius:8px;padding:12px 16px;color:#DC2626;\"><b>🚨 ALERTE CRITIQUE — QK &gt; 1.</b> Fiche + PDCA + Action immédiate requise.</div>";
        };
    }

    private String buildActionsRequises(CouleurQK couleur) {
        if (couleur == null) return "—";
        return switch (couleur) {
            case VERT   -> "Aucune action requise";
            case ORANGE -> "Fiche de réparation";
            case ROSE   -> "Fiche de réparation + PDCA";
            case ROUGE  -> "Fiche de réparation + PDCA + Action immédiate";
        };
    }

    private String getQkHexColor(CouleurQK c) {
        if (c == null) return "#6B7280";
        return switch (c) {
            case VERT  -> "#059669";
            case ORANGE-> "#D97706";
            case ROSE  -> "#9D174D";
            case ROUGE -> "#DC2626";
        };
    }

    private String getQkLabel(CouleurQK c) {
        if (c == null) return "—";
        return switch (c) {
            case VERT   -> "Produit Conforme";
            case ORANGE -> "Non-Conformité Mineure";
            case ROSE   -> "Action Corrective Requise";
            case ROUGE  -> "ALERTE CRITIQUE";
        };
    }

    // ── Extraction NOK depuis les formulaires ──────────────────

    private long comptageNokFromAnnexes(List<AuditProduitAnnexe> annexes) {
        List<String> list = new ArrayList<>();
        for (AuditProduitAnnexe a : annexes) {
            if (a.getFormDataJson() != null) {
                Map<String, Object> fd = readJson(a.getFormDataJson());
                if (fd != null) extractNokStrings(a.getTypeAnnexe(), fd, list);
            }
        }
        return list.size();
    }

    @SuppressWarnings("unchecked")
    private void extractNokStrings(String type, Map<String, Object> fd, List<String> out) {
        // Défauts Annexe 1B
        if ("1B".equals(type)) {
            Object defautsObj = fd.get("defauts");
            if (defautsObj instanceof List<?> defautsList) {
                for (Object d : defautsList) {
                    if (d instanceof Map<?, ?> dm) {
                        Object desc = dm.get("description");
                        if (desc != null) {
                            out.add("[1B] " + desc);
                        }
                    }
                }
            }
            return;
        }

        // Rows avec résultat NOK
        Object rowsObj = fd.get("rows");
        if (rowsObj instanceof List<?> rows) {
            for (Object r : rows) {
                if (r instanceof Map<?, ?> rm) {
                    Object res = rm.get("resultat");
                    Object dec = rm.get("decision");

                    if ("NOK".equals(res) || "NOK".equals(dec)) {
                        // Extraction sécurisée avec cast explicite
                        String positionInfo = getStringValue(rm, "adresseBranche");
                        if (positionInfo == null) positionInfo = getStringValue(rm, "adresse");
                        if (positionInfo == null) positionInfo = getStringValue(rm, "position");
                        if (positionInfo == null) positionInfo = "—";

                        out.add("[Ann." + type + "] NOK - " + positionInfo);
                    }
                }
            }
        }

        // Annexe 5 : questions Non
        if ("5".equals(type)) {
            Object qObj = fd.get("questions");
            if (qObj instanceof Map<?, ?> qs) {
                qs.forEach((k, v) -> {
                    if ("Non".equals(v)) {
                        out.add("[Ann.5] Question " + k + " : Non");
                    }
                });
            }
        }
    }

    // ── Email body ─────────────────────────────────────────────

    private String buildEmailBody(AuditProduit audit) {
        String qk   = audit.getValeurQK() != null ? String.format("%.2f", audit.getValeurQK()) : "—";
        String couleur = audit.getCouleurQK() != null ? audit.getCouleurQK().name() : "—";
        return "L'auditeur " + (audit.getAuditeur() != null ? audit.getAuditeur().getPrenom() + " " + audit.getAuditeur().getNom() : "")
                + " a soumis le rapport pour l'audit " + audit.getReference()
                + ".\n\nQK = " + qk + " — Statut : " + couleur
                + "\n\nVeuillez vous connecter à la plateforme PAP pour valider ce rapport.";
    }

    // ═══════════════════════════════════════════════════════════
    // 6. RAPPORTS GÉNÉRÉS (liste pour expert)
    // ═══════════════════════════════════════════════════════════

    @Transactional(readOnly = true)
    public List<Map<String, Object>> getRapportsGeneres() {
        return auditRepo.findByRapportGenereTrueOrderByDateEnvoiDesc().stream()
                .map(audit -> {
                    Map<String, Object> m = new LinkedHashMap<>();
                    m.put("auditId",    audit.getId());
                    m.put("reference",  audit.getReference());
                    m.put("serieNom",   audit.getSerie() != null ? audit.getSerie().getNom() : null);
                    m.put("dateEnvoi",  audit.getDateEnvoi());
                    m.put("rapportNom", audit.getRapportFichierNom());
                    m.put("rapportUrl", audit.getRapportGenerePdfUrl());
                    m.put("valeurQK",   audit.getValeurQK());
                    m.put("couleurQK",  audit.getCouleurQK() != null ? audit.getCouleurQK().name() : null);
                    return m;
                })
                .collect(Collectors.toList());
    }

    // ═══════════════════════════════════════════════════════════
    // HELPERS PRIVÉS
    // ═══════════════════════════════════════════════════════════

    private List<AnnexeConfig> getConfigParDefaut() {
        return annexeCfgRepo.findByCommuneTousPlantsTrueOrderByOrdreAffichageAsc();
    }

    private AuditProduit getAudit(Long id) {
        return auditRepo.findById(id)
                .orElseThrow(() -> new BusinessException("Audit introuvable."));
    }

    private Utilisateur getUser(Integer id) {
        if (id == null) return null;
        return userRepo.findById(id).orElse(null);
    }


    private String getStringValue(Map<?, ?> map, String key) {
        if (map == null) return null;
        Object value = map.get(key);
        return value != null ? value.toString() : null;
    }

    private String getStringValue(Map<?, ?> map, String key, String defaultValue) {
        String value = getStringValue(map, key);
        return value != null ? value : defaultValue;
    }

    private String getExtension(String filename) {
        if (filename == null || !filename.contains(".")) return ".bin";
        return filename.substring(filename.lastIndexOf("."));
    }

    private AuditProduitAnnexe getOrCreateAnnexe(Long auditId, String typeAnnexe) {
        AuditProduit audit = getAudit(auditId);
        return annexeRepo.findByAuditIdAndTypeAnnexe(auditId, typeAnnexe)
                .orElseGet(() -> {
                    AuditProduitAnnexe a = new AuditProduitAnnexe();
                    a.setAudit(audit);
                    a.setTypeAnnexe(typeAnnexe);
                    a.setLibelle("Annexe " + typeAnnexe);
                    a.setOrdreAffichage(99);
                    return a;
                });
    }

    private String writeJson(Map<String, Object> data) {
        try {
            return data == null ? null : objectMapper.writeValueAsString(data);
        } catch (Exception e) {
            throw new BusinessException("Erreur sérialisation JSON.");
        }
    }

    private Map<String, Object> readJson(String json) {
        if (json == null || json.isBlank()) return null;
        try {
            return objectMapper.readValue(json, new TypeReference<Map<String, Object>>() {});
        } catch (Exception e) {
            return null;
        }
    }

    private String sanitizeFileToken(String input) {
        if (input == null || input.isBlank()) return "inconnue";
        return input.trim().replaceAll("[^a-zA-Z0-9_-]", "_");
    }

    private double parseDouble(Object obj, double def) {
        if (obj == null) return def;
        try { return Double.parseDouble(obj.toString()); }
        catch (NumberFormatException e) { return def; }
    }

    private static double getRatingFactor(int n) {
        if (n < 50)   return 4.0; if (n <= 100) return 2.0; if (n <= 200) return 1.0;
        if (n <= 400) return 0.9; if (n <= 800) return 0.8; if (n <= 1600) return 0.7;
        if (n <= 2600)return 0.6; if (n <= 4700)return 0.5; return 0.4;
    }

    private Map<String, Object> toMap(AuditProduitAnnexe a) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id",             a.getId());
        m.put("typeAnnexe",     a.getTypeAnnexe());
        m.put("libelle",        a.getLibelle());
        m.put("importe",        a.getImporte());
        m.put("fichierNom",     a.getFichierNom());
        m.put("fichierUrl",     a.getFichierUrl());
        m.put("valeurQkExtraite", a.getValeurQkExtraite());
        m.put("dateImport",     a.getDateImport());
        m.put("formValide",     a.getFormValide());
        m.put("formData",       readJson(a.getFormDataJson()));
        m.put("ordreAffichage", a.getOrdreAffichage());
        m.put("auditeurValidateurId",   a.getAuditeurValidateur() != null ? a.getAuditeurValidateur().getId() : null);
        m.put("auditeurValidateurNom",  a.getAuditeurValidateur() != null
                ? a.getAuditeurValidateur().getNom() + " " + a.getAuditeurValidateur().getPrenom() : null);
        m.put("statutValidationCroisee", a.getStatutValidationCroisee());
        m.put("dateEnvoiValidation",      a.getDateEnvoiValidation());
        m.put("dateValidationCroisee",    a.getDateValidationCroisee());
        m.put("commentaireValidationCroisee", a.getCommentaireValidationCroisee());
        m.put("pdfValidationDisponible", a.getPdfValidationPath() != null);
        return m;
    }
}