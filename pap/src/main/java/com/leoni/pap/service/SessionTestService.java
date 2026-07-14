package com.leoni.pap.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.leoni.pap.dto.request.EnregistrerReponseRequest;
import com.leoni.pap.dto.response.*;
import com.leoni.pap.entity.*;
import com.leoni.pap.entity.enums.*;
import com.leoni.pap.exception.BusinessException;
import com.leoni.pap.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class SessionTestService {

    private final SessionTestRepository    sessionRepo;
    private final TestTheoriqueRepository  testRepo;
    private final QuestionTestRepository   questionRepo;
    private final ReponseSessionRepository reponseRepo;
    private final HistoriqueRepository     historiqueRepo;
    private final UtilisateurRepository    utilisateurRepo;
    private final NotificationService      notifService;
    private final ObjectMapper             objectMapper;
    private final CertificationRepository  certifRepo;

    // =====================================================
    // DEMARRER SESSION
    // =====================================================
    public SessionResponse demarrerSession(String matricule, Long certificationId) {
        Utilisateur auditeur = getAuditeur(matricule);
        sessionRepo.findByAuditeurAndStatut(auditeur, StatutTestSession.EN_COURS)
                .ifPresent(s -> {
                    s.setStatut(StatutTestSession.ABANDONNE);
                    sessionRepo.save(s);
                });
        sessionRepo.findByAuditeurAndStatut(auditeur, StatutTestSession.PARTIE1_TERMINEE)
                .ifPresent(s -> {
                    s.setStatut(StatutTestSession.ABANDONNE);
                    sessionRepo.save(s);
                });

        Certification certif = certifRepo.findById(certificationId)
                .orElseThrow(() -> new BusinessException("Qualification introuvable."));
        TestTheorique test = certif.getTestTheorique();
        if (test == null)
            throw new BusinessException("Aucun test théorique associé à cette qualification.");
        sessionRepo.findByAuditeurAndStatut(auditeur, StatutTestSession.EN_COURS)
                .ifPresent(s -> {
                    throw new BusinessException("Une session est deja en cours. Reprenez-la.");
                });



        List<SessionTest> sessions = sessionRepo.findByAuditeurOrderByDateDebutDesc(auditeur);
        int tentative = (int) sessions.stream()
                .filter(s -> s.getTestTheorique().getId().equals(test.getId()))
                .count() + 1;

        List<QuestionTest> questionsImage = questionRepo.findRandomImage(test.getId(), 10);
        if (questionsImage.size() < 10)
            throw new BusinessException(
                    "Pas assez de questions IMAGE (" + questionsImage.size() + "/10 minimum).");

        List<QuestionTest> questionsQCM = questionRepo.findRandomQCM(test.getId(), 10);
        if (questionsQCM.size() < 10)
            throw new BusinessException(
                    "Pas assez de questions QCM (" + questionsQCM.size() + "/10 minimum).");

        String imageIdsJson;
        String qcmIdsJson;
        try {
            imageIdsJson = objectMapper.writeValueAsString(
                    questionsImage.stream().map(QuestionTest::getId).collect(Collectors.toList()));
            qcmIdsJson = objectMapper.writeValueAsString(
                    questionsQCM.stream().map(QuestionTest::getId).collect(Collectors.toList()));
        } catch (Exception e) {
            imageIdsJson = "[]";
            qcmIdsJson   = "[]";
        }

        SessionTest session = SessionTest.builder()
                .auditeur(auditeur)
                .testTheorique(test)
                .statut(StatutTestSession.EN_COURS)
                .numeroTentative(tentative)
                .dateDebut(LocalDateTime.now())
                .questionActuelle(0)
                .partieActuelle(1)
                .questionsPart1IdsJson(imageIdsJson)
                .questionsPart2IdsJson(qcmIdsJson)
                .reussi(false)
                .build();

        sessionRepo.save(session);
        test.setNbSessions(test.getNbSessions() + 1);
        testRepo.save(test);

        logHistorique(auditeur, TypeHistorique.SESSION_DEMARREE, null,
                "Session démarrée — Qualification : " + test.getTitre()
                        + " — Tentative #" + tentative, null);

        return toSessionResponse(session);
    }

    // =====================================================
    // Surcharge rétro-compatible (sans certificationId)
    // =====================================================
    public SessionResponse demarrerSession(String matricule) {
        Utilisateur auditeur = getAuditeur(matricule);
        TestTheorique test = testRepo.findAllByActifTrue().stream().findFirst()
                .orElseThrow(() -> new BusinessException("Aucun test actif. Contactez l'expert."));
        List<com.leoni.pap.entity.Certification> certifs =
                certifRepo.findByTestTheoriqueIdOrderByDateCreationDesc(test.getId());
        if (certifs.isEmpty())
            throw new BusinessException("Aucune qualification associée à ce test.");
        return demarrerSession(matricule, certifs.get(0).getId());
    }

    // =====================================================
    // QUESTION ACTUELLE
    // =====================================================
    @Transactional(readOnly = true)
    public QuestionSessionResponse getQuestionActuelle(Long sessionId) {
        return buildQuestionResponse(getSession(sessionId));
    }

    // =====================================================
    // ENREGISTRER UNE RÉPONSE
    // =====================================================
    public ReponseEnregistreeResponse enregistrerReponse(Long sessionId,
                                                         EnregistrerReponseRequest req) {
        SessionTest session = getSession(sessionId);

        if (session.getStatut() != StatutTestSession.EN_COURS
                && session.getStatut() != StatutTestSession.PARTIE1_TERMINEE)
            throw new BusinessException("Session deja terminee.");

        QuestionTest question = questionRepo.findById(req.getQuestionId())
                .orElseThrow(() -> new BusinessException("Question introuvable."));

        reponseRepo.findBySessionIdAndQuestionId(sessionId, question.getId())
                .ifPresent(r -> { throw new BusinessException("Deja repondu a cette question."); });

        boolean expiree       = Boolean.TRUE.equals(req.getExpiree());
        boolean correcte      = false;
        int     pointsObtenus = 0;

        if (!expiree) {
            if (question.getType() == TypeQuestionTest.IMAGE_DEFAUT) {
                // ── Partie 1 IMAGE — inchangée ──────────────────────
                correcte = question.getBonneReponseImage() != null
                        && req.getReponseTexte() != null
                        && question.getBonneReponseImage().trim()
                        .equalsIgnoreCase(req.getReponseTexte().trim());
            } else {
                // ── Partie 2 QCM — logique multi-réponses ───────────
                List<Integer> bonnes  = question.getBonnesReponsesIndexes();
                List<Integer> donnees = req.getReponsesIndexes();

                if (bonnes != null && !bonnes.isEmpty() && donnees != null) {
                    // Tout-ou-rien strict :
                    // toutes les bonnes cochées ET aucune mauvaise cochée
                    correcte = new HashSet<>(bonnes).equals(new HashSet<>(donnees));
                } else if ((bonnes == null || bonnes.isEmpty())
                        && question.getBonneReponseIndex() != null) {
                    // Rétro-compat : ancienne question avec un seul index
                    correcte = question.getBonneReponseIndex().equals(req.getReponseIndex());
                }
            }
            if (correcte) pointsObtenus = question.getPoints();
        }

        // Pour stockage : garder le premier index pour rétro-compat affichage
        Integer premiereReponse = req.getReponseIndex();
        if (premiereReponse == null && req.getReponsesIndexes() != null
                && !req.getReponsesIndexes().isEmpty()) {
            premiereReponse = req.getReponsesIndexes().get(0);
        }

        reponseRepo.save(ReponseSession.builder()
                .session(session)
                .question(question)
                .numeroQuestion(session.getQuestionActuelle() + 1)
                .reponseTexte(req.getReponseTexte())
                .reponseIndex(premiereReponse)
                .correcte(correcte)
                .expiree(expiree)
                .pointsObtenus(pointsObtenus)
                .tempsUtilise(req.getTempsUtilise())
                .dateReponse(LocalDateTime.now())
                .build());

        int nouvIndex = session.getQuestionActuelle() + 1;
        session.setQuestionActuelle(nouvIndex);

        ReponseEnregistreeResponse result = new ReponseEnregistreeResponse();
        result.setQuestionId(req.getQuestionId());
        result.setEnregistree(true);

        if (nouvIndex == 10) {
            session.setPartieActuelle(2);
            session.setStatut(StatutTestSession.PARTIE1_TERMINEE);
            result.setPartieTerminee(true);
            result.setTestTermine(false);
        } else if (nouvIndex == 20) {
            result.setTestTermine(true);
            result.setPartieTerminee(false);
        } else {
            session.setPartieActuelle(nouvIndex < 10 ? 1 : 2);
            result.setTestTermine(false);
            result.setPartieTerminee(false);
        }

        result.setQuestionSuivante(nouvIndex < 20 ? nouvIndex : -1);
        sessionRepo.save(session);
        return result;
    }

    // =====================================================
    // TERMINER ET CALCULER LE SCORE
    // =====================================================
    public ResultatTestResponse terminerSession(Long sessionId) {
        SessionTest   session  = getSession(sessionId);
        Utilisateur   auditeur = session.getAuditeur();
        TestTheorique test     = session.getTestTheorique();

        List<ReponseSession> reponses =
                reponseRepo.findBySessionIdOrderByNumeroQuestionAsc(sessionId);

        List<QuestionTest> questionsP1 = questionRepo.findAllById(getImageIds(session));
        int ptsTotalP1   = questionsP1.stream().mapToInt(QuestionTest::getPoints).sum();
        int ptsObtenusP1 = reponses.stream()
                .filter(r -> r.getQuestion().getType() == TypeQuestionTest.IMAGE_DEFAUT)
                .mapToInt(ReponseSession::getPointsObtenus).sum();

        List<QuestionTest> questionsP2 = questionRepo.findAllById(getQcmIds(session));
        int ptsTotalP2   = questionsP2.stream().mapToInt(QuestionTest::getPoints).sum();
        int ptsObtenusP2 = reponses.stream()
                .filter(r -> r.getQuestion().getType() == TypeQuestionTest.QCM)
                .mapToInt(ReponseSession::getPointsObtenus).sum();

        int    totalPoints  = ptsTotalP1 + ptsTotalP2;
        int    totalObtenus = ptsObtenusP1 + ptsObtenusP2;
        double scoreTotal   = totalPoints > 0
                ? Math.round((totalObtenus * 100.0 / totalPoints) * 10) / 10.0 : 0;
        double scoreP1      = ptsTotalP1 > 0
                ? Math.round((ptsObtenusP1 * 100.0 / ptsTotalP1) * 10) / 10.0 : 0;
        double scoreP2      = ptsTotalP2 > 0
                ? Math.round((ptsObtenusP2 * 100.0 / ptsTotalP2) * 10) / 10.0 : 0;

        boolean reussi = scoreTotal >= test.getSeuilReussite();

        session.setScoreTotal(scoreTotal);
        session.setScorePart1(scoreP1);
        session.setScorePart2(scoreP2);
        session.setPointsObtenus(totalObtenus);
        session.setPointsTotal(totalPoints);
        session.setReussi(reussi);
        session.setStatut(StatutTestSession.TERMINE);
        session.setDateFin(LocalDateTime.now());
        sessionRepo.save(session);

        logHistorique(auditeur,
                reussi ? TypeHistorique.THEORIQUE_REUSSI : TypeHistorique.THEORIQUE_ECHOUE,
                null, "Score : " + scoreTotal + "/100 — Qualification : " + test.getTitre(),
                scoreTotal);

        ResultatTestResponse result = new ResultatTestResponse();
        result.setScoreTotal(scoreTotal);
        result.setScorePart1(scoreP1);
        result.setScorePart2(scoreP2);
        result.setPointsObtenus(totalObtenus);
        result.setPointsTotal(totalPoints);
        result.setReussi(reussi);
        result.setNumeroTentative(session.getNumeroTentative());

        if (reussi) {
            result.setMessage("Felicitations ! Score : " + scoreTotal
                    + "/100. Passez au test pratique.");
        } else {
            result.setBloque(false);
            result.setMessage("Score insuffisant : " + scoreTotal + "/100 (minimum "
                    + test.getSeuilReussite() + "%).");
        }

        result.setCorrections(buildCorrections(reponses, questionsP1, questionsP2));
        return result;
    }

    // =====================================================
    // REPRENDRE SESSION EN COURS
    // =====================================================
    @Transactional(readOnly = true)
    public SessionResponse getSessionEnCours(String matricule) {
        Utilisateur auditeur = getAuditeur(matricule);
        SessionTest session = sessionRepo
                .findByAuditeurAndStatut(auditeur, StatutTestSession.EN_COURS)
                .orElse(sessionRepo
                        .findByAuditeurAndStatut(auditeur, StatutTestSession.PARTIE1_TERMINEE)
                        .orElseThrow(() -> new BusinessException("Aucune session en cours.")));
        return toSessionResponse(session);
    }

    // =====================================================
    // HELPERS PRIVÉS
    // =====================================================
    private QuestionSessionResponse buildQuestionResponse(SessionTest session) {
        int idx           = session.getQuestionActuelle();
        int partie        = idx < 10 ? 1 : 2;
        int idxDansPartie = idx < 10 ? idx : idx - 10;

        if (session.getPartieActuelle() != partie) {
            session.setPartieActuelle(partie);
            sessionRepo.save(session);
        }

        List<Long> ids = partie == 1 ? getImageIds(session) : getQcmIds(session);

        if (!ids.isEmpty()) {
            List<QuestionTest> questions = new ArrayList<>(questionRepo.findAllById(ids));
            Map<Long, Integer> ordreMap  = new HashMap<>();
            for (int i = 0; i < ids.size(); i++) ordreMap.put(ids.get(i), i);
            questions.sort(Comparator.comparingInt(q -> ordreMap.getOrDefault(q.getId(), 0)));
            if (idxDansPartie >= questions.size()) return null;
            return toQuestionResponse(questions.get(idxDansPartie), idx, partie);
        }

        TypeQuestionTest type = partie == 1
                ? TypeQuestionTest.IMAGE_DEFAUT : TypeQuestionTest.QCM;
        List<QuestionTest> all = questionRepo
                .findByTestTheoriqueIdAndTypeOrderByOrdreAsc(
                        session.getTestTheorique().getId(), type);
        if (all.isEmpty())
            throw new BusinessException("Aucune question " + type.name() + " disponible.");
        if (idxDansPartie >= all.size()) return null;
        return toQuestionResponse(all.get(idxDansPartie), idx, partie);
    }

    private QuestionSessionResponse toQuestionResponse(QuestionTest q, int idx, int partie) {
        QuestionSessionResponse r = new QuestionSessionResponse();
        r.setId(q.getId());
        r.setType(q.getType().name());
        r.setNumero(partie == 1 ? idx + 1 : idx - 9);
        r.setPartie(partie);
        r.setChronoSecondes(q.getChronoSecondes());
        r.setPoints(q.getPoints());

        if (q.getType() == TypeQuestionTest.IMAGE_DEFAUT) {
            // ── Partie 1 IMAGE — inchangée ──────────────────────────
            r.setImageUrl(q.getImageUrl());
            try {
                r.setDefautsDisponibles(objectMapper.readValue(
                        q.getDefautsDisponiblesJson(),
                        new TypeReference<List<String>>() {}));
            } catch (Exception e) {
                r.setDefautsDisponibles(new ArrayList<>());
            }
        } else {
            // ── Partie 2 QCM ────────────────────────────────────────
            r.setEnonce(q.getEnonce());
            r.setOptions(q.getOptions());
            // Indique à l'UI combien de bonnes réponses sont attendues
            int nb = (q.getBonnesReponsesIndexes() != null
                    && !q.getBonnesReponsesIndexes().isEmpty())
                    ? q.getBonnesReponsesIndexes().size()
                    : 1;
            r.setNbBonnesReponses(nb);
        }
        return r;
    }

    private List<Long> getImageIds(SessionTest session) {
        try {
            return objectMapper.readValue(
                    session.getQuestionsPart1IdsJson(),
                    new TypeReference<List<Long>>() {});
        } catch (Exception e) { return new ArrayList<>(); }
    }

    private List<Long> getQcmIds(SessionTest session) {
        try {
            return objectMapper.readValue(
                    session.getQuestionsPart2IdsJson(),
                    new TypeReference<List<Long>>() {});
        } catch (Exception e) { return new ArrayList<>(); }
    }

    private List<ResultatTestResponse.CorrectionResponse> buildCorrections(
            List<ReponseSession> reponses,
            List<QuestionTest> questionsP1,
            List<QuestionTest> questionsP2) {

        List<ResultatTestResponse.CorrectionResponse> corrections = new ArrayList<>();
        Map<Long, ReponseSession> repMap = reponses.stream()
                .collect(Collectors.toMap(
                        r -> r.getQuestion().getId(), r -> r, (a, b) -> a));

        // ── Partie 1 IMAGE — inchangée ──────────────────────────────
        for (QuestionTest q : questionsP1) {
            ResultatTestResponse.CorrectionResponse c =
                    new ResultatTestResponse.CorrectionResponse();
            c.setQuestionId(q.getId());
            c.setType("IMAGE_DEFAUT");
            c.setImageUrl(q.getImageUrl());
            c.setBonneReponse(q.getBonneReponseImage());
            ReponseSession rep = repMap.get(q.getId());
            if (rep != null) {
                c.setReponseDonnee(rep.getReponseTexte());
                c.setCorrecte(rep.getCorrecte());
                c.setExpiree(rep.getExpiree());
                c.setPointsObtenus(rep.getPointsObtenus());
            }
            c.setPoints(q.getPoints());
            corrections.add(c);
        }

        // ── Partie 2 QCM — affiche toutes les bonnes réponses ───────
        for (QuestionTest q : questionsP2) {
            ResultatTestResponse.CorrectionResponse c =
                    new ResultatTestResponse.CorrectionResponse();
            c.setQuestionId(q.getId());
            c.setType("QCM");
            c.setEnonce(q.getEnonce());

            // Libellé de toutes les bonnes réponses (ex: "Option A, Option C")
            List<Integer> bonnes = q.getBonnesReponsesIndexes();
            if (bonnes != null && !bonnes.isEmpty() && q.getOptions() != null) {
                String bonnesLabel = bonnes.stream()
                        .filter(i -> i < q.getOptions().size())
                        .map(i -> q.getOptions().get(i))
                        .collect(Collectors.joining(", "));
                c.setBonneReponse(bonnesLabel);
            } else if (q.getBonneReponseIndex() != null && q.getOptions() != null) {
                // Rétro-compat
                c.setBonneReponse(q.getOptions().get(q.getBonneReponseIndex()));
            }

            ReponseSession rep = repMap.get(q.getId());
            if (rep != null) {
                c.setReponseDonnee(rep.getReponseIndex() != null && q.getOptions() != null
                        ? q.getOptions().get(rep.getReponseIndex()) : null);
                c.setCorrecte(rep.getCorrecte());
                c.setExpiree(rep.getExpiree());
                c.setPointsObtenus(rep.getPointsObtenus());
            }
            c.setPoints(q.getPoints());
            corrections.add(c);
        }

        return corrections;
    }

    private void logHistorique(Utilisateur acteur, TypeHistorique type,
                               Certification certif, String details, Double score) {
        historiqueRepo.save(Historique.builder()
                .utilisateur(acteur).type(type).certification(certif)
                .details(details).scoreSnapshot(score)
                .dateAction(LocalDateTime.now()).build());
    }

    private Utilisateur getAuditeur(String matricule) {
        return utilisateurRepo.findByMatricule(matricule)
                .orElseThrow(() -> new BusinessException("Auditeur introuvable."));
    }

    private SessionTest getSession(Long id) {
        return sessionRepo.findById(id)
                .orElseThrow(() -> new BusinessException("Session introuvable."));
    }

    private SessionResponse toSessionResponse(SessionTest s) {
        SessionResponse r = new SessionResponse();
        r.setId(s.getId());
        r.setTestTheoriqueId(s.getTestTheorique().getId());
        r.setStatut(s.getStatut().name());
        r.setNumeroTentative(s.getNumeroTentative());
        r.setDateDebut(s.getDateDebut());
        r.setQuestionActuelle(s.getQuestionActuelle());
        r.setPartieActuelle(s.getPartieActuelle());
        r.setTotalQuestions(20);
        r.setChronoSecondesParQuestion(30);
        return r;
    }
}