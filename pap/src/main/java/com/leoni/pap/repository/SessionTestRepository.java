package com.leoni.pap.repository;

import com.leoni.pap.entity.SessionTest;
import com.leoni.pap.entity.enums.StatutTestSession;
import com.leoni.pap.entity.Utilisateur;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface SessionTestRepository extends JpaRepository<SessionTest, Long> {

    Optional<SessionTest> findByAuditeurAndStatut(Utilisateur auditeur, StatutTestSession statut);

    List<SessionTest> findByAuditeurOrderByDateDebutDesc(Utilisateur auditeur);

    long countByAuditeurAndReussiTrue(Utilisateur auditeur);
    @Modifying
    @Query(value = "DELETE FROM reponse_session WHERE session_id IN " +
            "(SELECT id FROM session_test WHERE auditeur_id = :id)",
            nativeQuery = true)
    void deleteReponsesSession(@Param("id") Integer id);

    @Modifying
    @Query(value = "UPDATE passage_certification SET session_test_id = NULL " +
            "WHERE session_test_id IN " +
            "(SELECT id FROM session_test WHERE auditeur_id = :id)",
            nativeQuery = true)
    void detacherPassageCertification(@Param("id") Integer id);

    @Modifying
    @Query(value = "DELETE FROM session_test WHERE auditeur_id = :id",
            nativeQuery = true)
    void deleteByUtilisateurId(@Param("id") Integer id);
}