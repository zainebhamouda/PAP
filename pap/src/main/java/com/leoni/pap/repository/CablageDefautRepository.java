package com.leoni.pap.repository;

import com.leoni.pap.entity.CablageDefaut;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface CablageDefautRepository extends JpaRepository<CablageDefaut, Long> {

    // Existant — défauts liés à une certification (ancien modèle)
    List<CablageDefaut> findByCertificationIdOrderByNumero(Long certifId);

    // Nouveau Sprint 2 — défauts liés à un TestPratique (nouveau modèle)
    List<CablageDefaut> findByTestPratiqueIdOrderByNumero(Long testPratiqueId);
}