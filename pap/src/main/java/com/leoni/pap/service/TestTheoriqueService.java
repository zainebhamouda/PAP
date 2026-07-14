package com.leoni.pap.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.leoni.pap.dto.request.CreerTestRequest;
import com.leoni.pap.dto.request.QuestionImageRequest;
import com.leoni.pap.dto.request.QuestionQCMRequest;
import com.leoni.pap.dto.response.TestTheoriqueResponse;
import com.leoni.pap.entity.QuestionTest;
import com.leoni.pap.entity.TestTheorique;
import com.leoni.pap.entity.Utilisateur;
import com.leoni.pap.entity.enums.TypeQuestionTest;
import com.leoni.pap.exception.BusinessException;
import com.leoni.pap.repository.QuestionTestRepository;
import com.leoni.pap.repository.TestTheoriqueRepository;
import com.leoni.pap.repository.UtilisateurRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.FileOutputStream;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class TestTheoriqueService {

    private final TestTheoriqueRepository testRepo;
    private final QuestionTestRepository  questionRepo;
    private final UtilisateurRepository   utilisateurRepo;
    private final ObjectMapper            objectMapper;

    @Value("${upload.path:./uploads/defauts}")
    private String uploadPath;

    private static final int CHRONO_FIXE = 30;

    // ═════════════════════════════════════════════════════════
    // CRUD TESTS
    // ═════════════════════════════════════════════════════════

    public TestTheoriqueResponse creerTest(CreerTestRequest req, String matricule) {
        Utilisateur expert = getExpert(matricule);

        if (req.getSeuilReussite() == null)
            throw new BusinessException("Le seuil de réussite est obligatoire.");
        if (req.getTitre() == null || req.getTitre().isBlank())
            throw new BusinessException("Le titre est obligatoire.");

        TestTheorique test = TestTheorique.builder()
                .titre(req.getTitre())
                .description(req.getDescription())
                .seuilReussite(req.getSeuilReussite())
                .actif(false)
                .expert(expert)
                .dateCreation(LocalDateTime.now())
                .nbSessions(0)
                .build();

        return toResponse(testRepo.save(test));
    }

    public TestTheoriqueResponse activerTest(Long testId) {
        TestTheorique test = getTest(testId);

        long nbImage = questionRepo
                .findByTestTheoriqueIdAndTypeOrderByOrdreAsc(testId, TypeQuestionTest.IMAGE_DEFAUT)
                .size();
        long nbQCM = questionRepo
                .countByTestTheoriqueIdAndTypeAndDansPoolTrue(testId, TypeQuestionTest.QCM);

        if (nbImage < 10)
            throw new BusinessException(
                    "Minimum 10 questions IMAGE pour activer. Actuellement : " + nbImage);
        if (nbQCM < 10)
            throw new BusinessException(
                    "Minimum 10 questions QCM dans le pool. Actuellement : " + nbQCM);

        test.setActif(true);
        test.setDateActivation(LocalDateTime.now());
        return toResponse(testRepo.save(test));
    }

    public TestTheoriqueResponse modifierTest(Long testId, CreerTestRequest req) {
        TestTheorique test = getTest(testId);

        if (Boolean.TRUE.equals(test.getActif()))
            throw new BusinessException("Impossible de modifier un test actif.");

        if (req.getTitre()         != null) test.setTitre(req.getTitre());
        if (req.getDescription()   != null) test.setDescription(req.getDescription());
        if (req.getSeuilReussite() != null) test.setSeuilReussite(req.getSeuilReussite());

        return toResponse(testRepo.save(test));
    }

    public void supprimerTest(Long testId) {
        TestTheorique test = getTest(testId);
        if (Boolean.TRUE.equals(test.getActif()))
            throw new BusinessException("Impossible de supprimer un test actif.");
        testRepo.delete(test);
    }

    // ═════════════════════════════════════════════════════════
    // LECTURE
    // ═════════════════════════════════════════════════════════

    @Transactional(readOnly = true)
    public List<TestTheoriqueResponse> getMesTests(String matricule) {
        Utilisateur expert = getExpert(matricule);
        return testRepo.findAll().stream()
                .filter(t -> t.getExpert() != null &&
                        t.getExpert().getId().equals(expert.getId()))
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<TestTheoriqueResponse> getAllTests() {
        return testRepo.findAllByOrderByDateCreationDesc()
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public TestTheoriqueResponse getTestActif() {
        return testRepo.findByActifTrue()
                .map(this::toResponse)
                .orElseThrow(() -> new BusinessException("Aucun test actif pour le moment."));
    }

    // ═════════════════════════════════════════════════════════
    // CRUD QUESTIONS
    // ═════════════════════════════════════════════════════════

    public void ajouterQuestionImage(Long testId, QuestionImageRequest req) {
        TestTheorique test = getTest(testId);

        long nbActuel = questionRepo
                .findByTestTheoriqueIdAndTypeOrderByOrdreAsc(testId, TypeQuestionTest.IMAGE_DEFAUT)
                .size();

        String imageUrl = sauvegarderImage(req.getImageBase64(), req.getImageName());
        String defautsJson;
        try {
            defautsJson = objectMapper.writeValueAsString(req.getDefautsDisponibles());
        } catch (Exception e) {
            defautsJson = "[]";
        }

        QuestionTest q = QuestionTest.builder()
                .testTheorique(test)
                .type(TypeQuestionTest.IMAGE_DEFAUT)
                .ordre(req.getOrdre() != null ? req.getOrdre() : (int)(nbActuel + 1))
                .imageUrl(imageUrl)
                .bonneReponseImage(req.getBonneReponse())
                .defautsDisponiblesJson(defautsJson)
                .points(req.getPoints() != null ? req.getPoints() : 1)
                .chronoSecondes(CHRONO_FIXE)
                .dansPool(false)
                .build();

        questionRepo.save(q);
    }

    // ── QCM Partie 2 — multi-réponses ────────────────────────
    public void ajouterQuestionQCM(Long testId, QuestionQCMRequest req) {
        TestTheorique test = getTest(testId);

        if (req.getBonnesReponsesIndexes() == null || req.getBonnesReponsesIndexes().isEmpty())
            throw new BusinessException("Au moins une bonne réponse est obligatoire.");

        QuestionTest q = QuestionTest.builder()
                .testTheorique(test)
                .type(TypeQuestionTest.QCM)
                .ordre(0)
                .enonce(req.getEnonce())
                .options(req.getOptions())
                .bonnesReponsesIndexes(req.getBonnesReponsesIndexes()) // ← liste
                .bonneReponseIndex(null)                               // déprécié
                .points(req.getPoints() != null ? req.getPoints() : 1)
                .chronoSecondes(CHRONO_FIXE)
                .dansPool(req.getDansPool() != null ? req.getDansPool() : true)
                .build();

        questionRepo.save(q);
    }

    public void modifierQuestion(Long questionId, QuestionQCMRequest req) {
        QuestionTest q = questionRepo.findById(questionId)
                .orElseThrow(() -> new BusinessException("Question introuvable."));
        if (req.getEnonce()  != null) q.setEnonce(req.getEnonce());
        if (req.getOptions() != null) q.setOptions(req.getOptions());
        if (req.getBonnesReponsesIndexes() != null && !req.getBonnesReponsesIndexes().isEmpty())
            q.setBonnesReponsesIndexes(req.getBonnesReponsesIndexes());
        if (req.getPoints()  != null) q.setPoints(req.getPoints());
        questionRepo.save(q);
    }

    public void supprimerQuestion(Long questionId) {
        if (!questionRepo.existsById(questionId))
            throw new BusinessException("Question introuvable.");
        questionRepo.deleteById(questionId);
    }

    @Transactional(readOnly = true)
    public List<QuestionTest> getQuestionsTest(Long testId) {
        return questionRepo.findByTestTheoriqueIdOrderByOrdreAsc(testId);
    }

    // ═════════════════════════════════════════════════════════
    // HELPERS
    // ═════════════════════════════════════════════════════════

    private String sauvegarderImage(String base64, String nomFichier) {
        if (base64 == null || base64.isEmpty()) return null;
        try {
            Files.createDirectories(Paths.get(uploadPath));
            String data = base64.contains(",") ? base64.split(",")[1] : base64;
            byte[] bytes = Base64.getDecoder().decode(data);
            String fileName = System.currentTimeMillis() + "_" +
                    (nomFichier != null ? nomFichier : "image.jpg");
            try (FileOutputStream fos = new FileOutputStream(uploadPath + "/" + fileName)) {
                fos.write(bytes);
            }
            return "/uploads/defauts/" + fileName;
        } catch (Exception e) {
            throw new BusinessException("Erreur sauvegarde image : " + e.getMessage());
        }
    }

    private Utilisateur getExpert(String matricule) {
        return utilisateurRepo.findByMatricule(matricule)
                .orElseThrow(() -> new BusinessException("Expert introuvable."));
    }

    private TestTheorique getTest(Long id) {
        return testRepo.findById(id)
                .orElseThrow(() -> new BusinessException("Test introuvable."));
    }

    // ═════════════════════════════════════════════════════════
    // MAPPING
    // ═════════════════════════════════════════════════════════
    public TestTheoriqueResponse toResponse(TestTheorique t) {
        TestTheoriqueResponse r = new TestTheoriqueResponse();
        r.setId(t.getId());
        r.setTitre(t.getTitre());
        r.setDescription(t.getDescription());
        r.setActif(t.getActif());
        r.setSeuilReussite(t.getSeuilReussite());
        r.setChronoSecondesParQuestion(CHRONO_FIXE);
        r.setDateCreation(t.getDateCreation());
        r.setDateActivation(t.getDateActivation());
        r.setNbSessions(t.getNbSessions());

        if (t.getExpert() != null)
            r.setExpertNom(t.getExpert().getNom() + " " + t.getExpert().getPrenom());

        if (t.getId() != null) {
            r.setNbQuestionsImage((int) questionRepo
                    .findByTestTheoriqueIdAndTypeOrderByOrdreAsc(
                            t.getId(), TypeQuestionTest.IMAGE_DEFAUT)
                    .size());
            r.setNbQuestionsQCMPool((int) questionRepo
                    .countByTestTheoriqueIdAndTypeAndDansPoolTrue(
                            t.getId(), TypeQuestionTest.QCM));
        }

        return r;
    }
}