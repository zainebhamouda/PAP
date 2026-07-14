package com.leoni.pap.repository;

import com.leoni.pap.entity.TestTheorique;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TestTheoriqueRepository extends JpaRepository<TestTheorique, Long> {

    Optional<TestTheorique> findByActifTrue();

    boolean existsByActifTrue();

    // ✅ AJOUTÉ — pour getTestsTheoriquesPourChoix()
    List<TestTheorique> findAllByOrderByDateCreationDesc();

    // ✅ AJOUTÉ — pour getMesTests()
    List<TestTheorique> findByExpertIdOrderByDateCreationDesc(Integer expertId);
    // Ajouter dans TestTheoriqueRepository.java
    List<TestTheorique> findAllByActifTrue();
}