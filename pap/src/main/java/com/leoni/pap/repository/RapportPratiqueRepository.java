package com.leoni.pap.repository;

import com.leoni.pap.entity.RapportPratique;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface RapportPratiqueRepository extends JpaRepository<RapportPratique, Long> {
    Optional<RapportPratique> findByCertificationId(Long certifId);
}