package com.leoni.pap.repository;

import com.leoni.pap.entity.AnnexeConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

/**
 * AnnexeConfigRepository — NOUVEAU Sprint 3
 */
public interface AnnexeConfigRepository extends JpaRepository<AnnexeConfig, Integer> {

    /** Annexes spécifiques à un plant */
    List<AnnexeConfig> findByPlantIdOrderByOrdreAffichageAsc(Integer plantId);

    /** Annexes communes à tous les plants (plant_id IS NULL) */
    List<AnnexeConfig> findByCommuneTousPlantsTrueOrderByOrdreAffichageAsc();

    /**
     * Toutes les annexes applicables à un plant :
     * annexes spécifiques + annexes communes
     */
    @Query("""
        SELECT ac FROM AnnexeConfig ac
        WHERE ac.plant.id = :plantId
           OR ac.communeTousPlants = true
        ORDER BY ac.ordreAffichage ASC
        """)
    List<AnnexeConfig> findByPlantIdOrCommune(@Param("plantId") Integer plantId);

    /** Annexes portant le QK pour un plant */
    @Query("""
        SELECT ac FROM AnnexeConfig ac
        WHERE (ac.plant.id = :plantId OR ac.communeTousPlants = true)
          AND ac.porteurQK = true
        ORDER BY ac.prioriteQK DESC
        """)
    List<AnnexeConfig> findPorteursQKByPlant(@Param("plantId") Integer plantId);
}