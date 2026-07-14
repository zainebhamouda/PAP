package com.leoni.pap.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.leoni.pap.dto.request.CreerTestPratiqueRequest;
import com.leoni.pap.dto.request.DefautPratiqueRequest;
import com.leoni.pap.dto.request.SaisirCablageRequest;
import com.leoni.pap.dto.request.SoumettreRapportRequest;
import com.leoni.pap.dto.response.ComparaisonPratiqueResponse;
import com.leoni.pap.dto.response.TestPratiqueResponse;
import com.leoni.pap.entity.*;
import java.util.Optional;

import com.leoni.pap.entity.enums.*;
import com.leoni.pap.exception.BusinessException;
import com.leoni.pap.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class TestPratiqueService {

    private final CertificationRepository   certifRepo;
    private final CablageDefautRepository   cablageRepo;
    private final RapportPratiqueRepository rapportRepo;
    private final HistoriqueRepository      historiqueRepo;
    private final UtilisateurRepository     utilisateurRepo;
    private final NotificationService       notifService;
    private final CertificatService         certificatService;
    private final ObjectMapper              objectMapper;
    private final TestPratiqueRepository    testPratiqueRepo;
    private final TestTheoriqueRepository   testTheoriqueRepo;

    // ═════════════════════════════════════════════════════════
    // CRUD TEST PRATIQUE
    // ═════════════════════════════════════════════════════════

    // Dans TestPratiqueService.java — modifier creerTestPratique()
    public TestPratiqueResponse creerTestPratique(CreerTestPratiqueRequest req, String matricule) {
        Utilisateur expert = getExpert(matricule);

        if (req.getSeuilReussite() == null)
            throw new BusinessException("Le seuil de réussite est obligatoire.");
        if (req.getTitre() == null || req.getTitre().isBlank())
            throw new BusinessException("Le titre est obligatoire.");

        // ── PROTECTION : bloquer la création d'un doublon du test générique ──
        if (req.getTitre().trim().equalsIgnoreCase(TITRE_GENERIQUE)) {
            // Retourner l'existant au lieu d'en créer un nouveau
            List<TestPratique> existants = testPratiqueRepo.findAllByTitreAndActifTrue(TITRE_GENERIQUE);
            if (!existants.isEmpty()) {
                return toResponse(existants.get(0));
            }
        }

        TestPratique tp = TestPratique.builder()
                .titre(req.getTitre())
                .description(req.getDescription())
                .expert(expert)
                .actif(false)
                .seuilReussite(req.getSeuilReussite())
                .dateCreation(LocalDateTime.now())
                .build();

        return toResponse(testPratiqueRepo.save(tp));
    }

    public TestPratiqueResponse activerTestPratique(Long testId) {
        // SPRINT 2+ : plusieurs tests pratiques actifs autorisés — on ne désactive plus l'ancien

        // ← CORRECTION : utilise findTestPratiqueById (public) au lieu de getTestPratique (anciennement private)
        TestPratique tp = findTestPratiqueById(testId);

        // SPRINT 2 : l'activation est permise même sans défauts (défauts optionnels)
        // L'expert note manuellement via score si pas de défauts
        tp.setActif(true);
        tp.setDateActivation(LocalDateTime.now());
        return toResponse(testPratiqueRepo.save(tp));
    }

    public TestPratiqueResponse modifierTestPratique(Long testId,
                                                     CreerTestPratiqueRequest req) {
        TestPratique tp = findTestPratiqueById(testId);

        if (Boolean.TRUE.equals(tp.getActif()))
            throw new BusinessException("Impossible de modifier un test pratique actif.");

        if (req.getTitre()         != null) tp.setTitre(req.getTitre());
        if (req.getDescription()   != null) tp.setDescription(req.getDescription());
        if (req.getSeuilReussite() != null) tp.setSeuilReussite(req.getSeuilReussite());

        return toResponse(testPratiqueRepo.save(tp));
    }

    public void supprimerTestPratique(Long testId) {
        TestPratique tp = findTestPratiqueById(testId);
        if (Boolean.TRUE.equals(tp.getActif()))
            throw new BusinessException("Impossible de supprimer un test pratique actif.");
        testPratiqueRepo.delete(tp);
    }

    // ═════════════════════════════════════════════════════════
    // GESTION DES DÉFAUTS
    // ═════════════════════════════════════════════════════════

    public TestPratiqueResponse ajouterDefaut(Long testId, DefautPratiqueRequest req) {
        TestPratique tp = findTestPratiqueById(testId);

        if (Boolean.TRUE.equals(tp.getActif()))
            throw new BusinessException(
                    "Impossible d'ajouter un défaut à un test pratique actif.");

        Integer numero = req.getNumero();
        if (numero == null)
            numero = cablageRepo.findByTestPratiqueIdOrderByNumero(testId).size() + 1;

        CablageDefaut defaut = CablageDefaut.builder()
                .testPratique(tp)
                .numero(numero)
                .typeDefaut(req.getTypeDefaut())
                .localisation(req.getLocalisation())
                .mesureReelle(req.getMesureReelle())
                .valeurAcceptable(req.getValeurAcceptable())
                .observations(req.getObservations())
                .build();

        cablageRepo.save(defaut);
        return toResponse(testPratiqueRepo.findById(testId).orElseThrow());
    }

    public void supprimerDefaut(Long defautId) {
        CablageDefaut defaut = cablageRepo.findById(defautId)
                .orElseThrow(() -> new BusinessException("Défaut introuvable."));

        if (defaut.getTestPratique() != null
                && Boolean.TRUE.equals(defaut.getTestPratique().getActif()))
            throw new BusinessException(
                    "Impossible de supprimer un défaut d'un test pratique actif.");

        cablageRepo.delete(defaut);
    }

    // ═════════════════════════════════════════════════════════
    // LECTURE
    // ═════════════════════════════════════════════════════════

    @Transactional(readOnly = true)
    public TestPratiqueResponse getTestPratiqueActif() {
        return testPratiqueRepo.findByActifTrue()
                .map(this::toResponse)
                .orElseThrow(() -> new BusinessException("Aucun test pratique actif."));
    }

    // Pour l'AUDITEUR uniquement — sans les défauts (cachés)
    @Transactional(readOnly = true)
    public com.leoni.pap.dto.response.TestPratiqueAuditeurResponse getTestPratiqueAuditeur() {
        TestPratique tp = testPratiqueRepo.findByActifTrue()
                .orElseThrow(() -> new BusinessException("Aucun test pratique actif."));
        com.leoni.pap.dto.response.TestPratiqueAuditeurResponse r =
                new com.leoni.pap.dto.response.TestPratiqueAuditeurResponse();
        r.setId(tp.getId());
        r.setTitre(tp.getTitre());
        r.setDescription(tp.getDescription());
        int nb = cablageRepo.findByTestPratiqueIdOrderByNumero(tp.getId()).size();
        r.setNbDefauts(nb);
        r.setInstructions(nb > 0
                ? "Inspectez le câblage et identifiez les " + nb + " défaut(s). Soumettez votre rapport."
                : "Réalisez l'audit du câblage et soumettez votre rapport PDF à l'expert.");
        r.setDateActivation(tp.getDateActivation());
        return r;
    }

    @Transactional(readOnly = true)
    public TestPratiqueResponse getTestPratique(Long id) {
        return toResponse(findTestPratiqueById(id));
    }

    @Transactional(readOnly = true)
    public List<TestPratiqueResponse> getMesTestsPratiques(String matricule) {
        Utilisateur expert = getExpert(matricule);
        return testPratiqueRepo
                .findByExpertIdOrderByDateCreationDesc(expert.getId())
                .stream().map(this::toResponse).collect(Collectors.toList());
    }
    private static final String TITRE_GENERIQUE = "Test pratique sans d\u00E9fauts";
    @Transactional
    public TestPratique getOrCreateTestSansDefauts(Utilisateur expert) {
        // 1. Chercher un test actif avec ce titre (prend le premier si doublons)
        Optional<TestPratique> actif = testPratiqueRepo
                .findFirstByTitreAndActifTrue(TITRE_GENERIQUE);

        if (actif.isPresent()) {
            return actif.get();
        }

        // 2. Aucun actif → chercher un inactif et l'activer plutôt que d'en recréer un
        Optional<TestPratique> inactif = testPratiqueRepo
                .findFirstByTitreOrderByDateCreationDesc(TITRE_GENERIQUE);

        if (inactif.isPresent()) {
            TestPratique tp = inactif.get();
            tp.setActif(true);
            tp.setDateActivation(LocalDateTime.now());
            return testPratiqueRepo.save(tp);
        }

        // 3. Vraiment aucun → créer
        TestPratique tp = TestPratique.builder()
                .titre(TITRE_GENERIQUE)
                .description("Test noté manuellement par l'expert. "
                        + "Aucun défaut prédéfini — le score est saisi directement lors de la validation.")
                .expert(expert)
                .actif(true)
                .seuilReussite(70)
                .dateCreation(LocalDateTime.now())
                .dateActivation(LocalDateTime.now())
                .build();

        return testPratiqueRepo.save(tp);
    }
    @Transactional(readOnly = true)
    public List<TestPratiqueResponse> getAllTestsPratiques() {
        return testPratiqueRepo
                .findAllByOrderByDateCreationDesc()
                .stream()
                // Test générique toujours en premier
                .sorted((a, b) -> {
                    boolean aGen = TITRE_GENERIQUE.equals(a.getTitre());
                    boolean bGen = TITRE_GENERIQUE.equals(b.getTitre());
                    if (aGen && !bGen) return -1;
                    if (!aGen && bGen) return 1;
                    return 0;
                })
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    // ═════════════════════════════════════════════════════════
    // AUDITEUR — SOUMETTRE RAPPORT
    // ═════════════════════════════════════════════════════════

    public ComparaisonPratiqueResponse soumettreRapport(Long certifId,
                                                        SoumettreRapportRequest req,
                                                        String matricule) {
        Certification certif = getCertif(certifId);

        if (certif.getStatut() != StatutCertification.PRATIQUE_EN_COURS)
            throw new BusinessException("Le test pratique n'est pas encore disponible.");

        List<CablageDefaut> defautsExpert =
                cablageRepo.findByCertificationIdOrderByNumero(certifId);
        if (defautsExpert.isEmpty())
            throw new BusinessException("L'expert n'a pas encore saisi les défauts du câblage.");

        String lignesJson;
        try { lignesJson = objectMapper.writeValueAsString(req.getLignes()); }
        catch (Exception e) { lignesJson = "[]"; }

        RapportPratique rapport = rapportRepo.findByCertificationId(certifId)
                .orElse(RapportPratique.builder().certification(certif).build());
        rapport.setLignesJson(lignesJson);
        rapport.setSoumis(true);
        rapport.setDateSoumission(LocalDateTime.now());
        rapport.setTotalDefauts(defautsExpert.size());

        // Seuil lu depuis testPratique (valeur saisie par l'expert)
        double seuil = 70.0;
        if (certif.getTestPratique() != null
                && certif.getTestPratique().getSeuilReussite() != null) {
            seuil = certif.getTestPratique().getSeuilReussite();
        }

        ComparaisonPratiqueResponse comparaison =
                comparer(defautsExpert, req.getLignes(), seuil);

        rapport.setScore(comparaison.getScore());
        rapport.setDefautsCorrectementIdentifies(comparaison.getDefautsCorrects());
        rapportRepo.save(rapport);

        certif.setScorePratique(comparaison.getScore());

        if (comparaison.getReussi()) {
            double scoreFinal = Math.round(
                    (certif.getScoreTheorique() * 0.4 + comparaison.getScore() * 0.6) * 10) / 10.0;
            certif.setScoreFinal(scoreFinal);
            certif.setNiveauBadge(calculerBadge(scoreFinal));
            certif.setStatut(StatutCertification.SIGNATURE_EXPERT);
            certif.setDateObtention(LocalDateTime.now());
            certif.setDateExpiration(LocalDateTime.now().plusYears(1));
            certif.setNumeroCertificat(genererNumero());
            certifRepo.save(certif);

            envoyerNotificationsReussite(certif);
            certificatService.genererCertificat(certif);

            logHistorique(certif.getAuditeur(), TypeHistorique.PRATIQUE_REUSSI,
                    certif, "Score pratique : " + comparaison.getScore() + "/100",
                    comparaison.getScore());
        } else {
            certif.setStatut(StatutCertification.PRATIQUE_ECHOUE);
            certifRepo.save(certif);

            notifService.creer(
                    certif.getAuditeur(),
                    TypeNotification.CERTIF_PRATIQUE_ECHOUE,
                    "❌ Test pratique échoué. Score : " + comparaison.getScore()
                            + "/100. Contactez votre chef de service."
            );

            logHistorique(certif.getAuditeur(), TypeHistorique.PRATIQUE_ECHOUE,
                    certif, "Score insuffisant : " + comparaison.getScore() + "/100",
                    comparaison.getScore());
        }

        return comparaison;
    }

    // ═════════════════════════════════════════════════════════
    // EXPERT — SAISIR DÉFAUTS CABLAGE
    // ═════════════════════════════════════════════════════════
    public void saisirDefautsCablage(Long certifId,
                                     SaisirCablageRequest req,
                                     String matricule) {
        Certification certif = getCertif(certifId);

        if (certif.getStatut() != StatutCertification.THEORIQUE_VALIDE)
            throw new BusinessException("L'auditeur doit d'abord réussir le test théorique.");

        List<CablageDefaut> anciens = cablageRepo.findByCertificationIdOrderByNumero(certifId);
        cablageRepo.deleteAll(anciens);

        List<CablageDefaut> defauts = req.getDefauts().stream().map(d ->
                CablageDefaut.builder()
                        .certification(certif)
                        .numero(d.getNumero())
                        .typeDefaut(d.getTypeDefaut())
                        .localisation(d.getLocalisation())
                        .mesureReelle(d.getMesureReelle())
                        .valeurAcceptable(d.getValeurAcceptable())
                        .observations(d.getObservations())
                        .build()
        ).collect(Collectors.toList());

        cablageRepo.saveAll(defauts);

        certif.setStatut(StatutCertification.PRATIQUE_EN_COURS);
        certifRepo.save(certif);

        notifService.creer(
                certif.getAuditeur(),
                TypeNotification.CERTIF_PRATIQUE_PRET,
                "📋 Votre test pratique est prêt. Inspectez le câblage et soumettez votre rapport."
        );

        logHistorique(certif.getAuditeur(), TypeHistorique.CABLAGE_SAISI,
                certif, "Expert " + matricule + " a saisi les défauts du câblage", null);
    }

    // ═════════════════════════════════════════════════════════
    // COMPARAISON EXPERT vs AUDITEUR
    // ═════════════════════════════════════════════════════════
    private ComparaisonPratiqueResponse comparer(
            List<CablageDefaut> expert,
            List<SoumettreRapportRequest.LigneRapportRequest> auditeur,
            double seuil) {

        Map<Integer, SoumettreRapportRequest.LigneRapportRequest> mapAuditeur = auditeur.stream()
                .collect(Collectors.toMap(
                        SoumettreRapportRequest.LigneRapportRequest::getNumero,
                        l -> l, (a, b) -> a));

        List<ComparaisonPratiqueResponse.LigneComparaison> lignes = new ArrayList<>();
        int corrects = 0;

        for (CablageDefaut d : expert) {
            ComparaisonPratiqueResponse.LigneComparaison ligne =
                    new ComparaisonPratiqueResponse.LigneComparaison();
            ligne.setNumero(d.getNumero());
            ligne.setDefautExpert(d.getTypeDefaut());
            ligne.setLocalisationExpert(d.getLocalisation());
            ligne.setMesureExpert(d.getMesureReelle());

            SoumettreRapportRequest.LigneRapportRequest rep = mapAuditeur.get(d.getNumero());
            if (rep != null) {
                ligne.setDefautAuditeur(rep.getTypeDefaut());
                ligne.setLocalisationAuditeur(rep.getLocalisation());
                ligne.setMesureAuditeur(rep.getMesure());

                boolean typeOk = d.getTypeDefaut() != null && rep.getTypeDefaut() != null
                        && d.getTypeDefaut().trim().equalsIgnoreCase(rep.getTypeDefaut().trim());
                ligne.setCorrect(typeOk);
                if (typeOk) {
                    corrects++;
                    ligne.setCommentaire("✅ Défaut correctement identifié");
                } else {
                    ligne.setCommentaire("❌ Type de défaut incorrect");
                }
            } else {
                ligne.setDefautAuditeur(null);
                ligne.setCorrect(false);
                ligne.setCommentaire("❌ Défaut non rapporté");
            }
            lignes.add(ligne);
        }

        double score = expert.isEmpty() ? 0.0
                : Math.round((corrects * 100.0 / expert.size()) * 10) / 10.0;

        ComparaisonPratiqueResponse result = new ComparaisonPratiqueResponse();
        result.setScore(score);
        result.setDefautsCorrects(corrects);
        result.setTotalDefauts(expert.size());
        result.setReussi(score >= seuil);
        result.setComparaison(lignes);
        return result;
    }

    // ═════════════════════════════════════════════════════════
    // HELPERS PRIVÉS
    // ═════════════════════════════════════════════════════════

    private void envoyerNotificationsReussite(Certification certif) {
        String msg = String.format(
                "🏆 %s %s (matricule %s) a obtenu sa certification ! " +
                        "Score final : %.1f/100 — Badge : %s — Valide jusqu'au %s.",
                certif.getAuditeur().getNom(),
                certif.getAuditeur().getPrenom(),
                certif.getAuditeur().getMatricule(),
                certif.getScoreFinal(),
                certif.getNiveauBadge(),
                certif.getDateExpiration().toLocalDate()
        );
        notifService.creerComplete(certif.getAuditeur(), TypeNotification.CERTIF_OBTENUE,
                "🎓 Certification obtenue !", msg, "/auditeur/mon-certificat", certif);
        notifService.notifierTousExperts(TypeNotification.CERTIF_OBTENUE, msg, certif);
        notifService.notifierEncadrement(TypeNotification.CERTIF_OBTENUE, msg, certif);
    }

    private String calculerBadge(Double score) {
        if (score >= 90) return "OR";
        if (score >= 80) return "ARGENT";
        return "BRONZE";
    }

    private String genererNumero() {
        return String.format("CERT-%d-%05d",
                LocalDateTime.now().getYear(),
                certifRepo.countByStatut(StatutCertification.CERTIFIE) + 1);
    }

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

    private Certification getCertif(Long id) {
        return certifRepo.findById(id)
                .orElseThrow(() -> new BusinessException("Certification introuvable."));
    }

    /**
     * Helper interne — PUBLIC pour permettre l'accès depuis CertificationService
     * (Spring proxy ne peut pas accéder aux méthodes private inter-services)
     */
    public TestPratique findTestPratiqueById(Long id) {
        return testPratiqueRepo.findById(id)
                .orElseThrow(() -> new BusinessException("Test pratique introuvable."));
    }

    private Utilisateur getExpert(String matricule) {
        return utilisateurRepo.findByMatricule(matricule)
                .orElseThrow(() -> new BusinessException("Expert introuvable."));
    }

    // ═════════════════════════════════════════════════════════
    // MAPPING
    // ═════════════════════════════════════════════════════════
    public TestPratiqueResponse toResponse(TestPratique tp) {
        TestPratiqueResponse r = new TestPratiqueResponse();
        r.setId(tp.getId());
        r.setTitre(tp.getTitre());
        r.setDescription(tp.getDescription());
        r.setActif(tp.getActif());
        r.setSeuilReussite(tp.getSeuilReussite());
        r.setDateCreation(tp.getDateCreation());
        r.setDateActivation(tp.getDateActivation());

        if (tp.getExpert() != null)
            r.setExpertNom(tp.getExpert().getNom() + " " + tp.getExpert().getPrenom());

        List<CablageDefaut> defauts = cablageRepo.findByTestPratiqueIdOrderByNumero(tp.getId());
        r.setNbDefauts(defauts.size());

        r.setDefauts(defauts.stream().map(d -> {
            TestPratiqueResponse.DefautPratiqueResponse dr =
                    new TestPratiqueResponse.DefautPratiqueResponse();
            dr.setId(d.getId());
            dr.setNumero(d.getNumero());
            dr.setTypeDefaut(d.getTypeDefaut());
            dr.setLocalisation(d.getLocalisation());
            dr.setMesureReelle(d.getMesureReelle());
            dr.setValeurAcceptable(d.getValeurAcceptable());
            dr.setObservations(d.getObservations());
            return dr;
        }).collect(Collectors.toList()));

        return r;
    }
}