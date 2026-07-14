package com.leoni.pap.repository;

import com.leoni.pap.entity.TestPratique;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TestPratiqueRepository extends JpaRepository<TestPratique, Long> {

    Optional<TestPratique> findByActifTrue();

    List<TestPratique> findByExpertIdOrderByDateCreationDesc(Integer expertId);

    List<TestPratique> findAllByOrderByDateCreationDesc();

    // Utilisé pour getOrCreateTestSansDefauts
    List<TestPratique> findAllByTitreAndActifTrue(String titre);

    // Utile si on veut chercher le générique même inactif
    Optional<TestPratique> findFirstByTitreOrderByDateCreationDesc(String titre);
    Optional<TestPratique> findFirstByTitreAndActifTrue(String titre);
}