package com.leoni.pap.repository;

import com.leoni.pap.entity.QuestionTest;
import com.leoni.pap.entity.enums.TypeQuestionTest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface QuestionTestRepository extends JpaRepository<QuestionTest, Long> {

    List<QuestionTest> findByTestTheoriqueIdOrderByOrdreAsc(Long testId);

    List<QuestionTest> findByTestTheoriqueIdAndTypeOrderByOrdreAsc(
            Long testId, TypeQuestionTest type);

    long countByTestTheoriqueId(Long testId);

    long countByTestTheoriqueIdAndType(Long testId, TypeQuestionTest type);

    long countByTestTheoriqueIdAndTypeAndDansPoolTrue(Long testId, TypeQuestionTest type);

    // ═════════════════════════════════════════════════════════
    // PARTIE 1 — 10 IMAGE aléatoires parmi toutes les IMAGE
    // Pas d'exclusion — normal que 2 auditeurs partagent
    // quelques questions en commun
    // ═════════════════════════════════════════════════════════
    @Query(value = "SELECT * FROM question_test " +
            "WHERE test_theorique_id = :testId AND type = 'IMAGE_DEFAUT' " +
            "ORDER BY RANDOM() LIMIT :n",
            nativeQuery = true)
    List<QuestionTest> findRandomImage(
            @Param("testId") Long testId,
            @Param("n") int n);

    // ═════════════════════════════════════════════════════════
    // PARTIE 2 — 10 QCM aléatoires parmi tout le pool
    // Pas d'exclusion — même logique
    // ═════════════════════════════════════════════════════════
    @Query(value = "SELECT * FROM question_test " +
            "WHERE test_theorique_id = :testId AND type = 'QCM' " +
            "AND dans_pool = true " +
            "ORDER BY RANDOM() LIMIT :n",
            nativeQuery = true)
    List<QuestionTest> findRandomQCM(
            @Param("testId") Long testId,
            @Param("n") int n);
}