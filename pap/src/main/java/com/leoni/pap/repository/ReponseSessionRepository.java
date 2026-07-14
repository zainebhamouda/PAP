package com.leoni.pap.repository;

import com.leoni.pap.entity.ReponseSession;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface ReponseSessionRepository extends JpaRepository<ReponseSession, Long> {

    List<ReponseSession> findBySessionIdOrderByNumeroQuestionAsc(Long sessionId);

    Optional<ReponseSession> findBySessionIdAndQuestionId(Long sessionId, Long questionId);
}