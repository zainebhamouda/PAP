package com.leoni.pap.repository;

import com.leoni.pap.entity.Serie;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface SerieRepository extends JpaRepository<Serie, Integer> {

    List<Serie> findByProjetId(Integer projetId);

    List<Serie> findByProjetIdAndActifTrue(Integer projetId);

    boolean existsByNomAndProjetId(String nom, Integer projetId);

    @Query("SELECT s FROM Serie s JOIN s.projet p JOIN p.segment seg JOIN seg.plant pl WHERE pl.id = :plantId AND s.actif = true")
    List<Serie> findByPlantId(@Param("plantId") Integer plantId);

    @Query("SELECT s FROM Serie s JOIN s.projet p JOIN p.segment seg WHERE seg.id = :segmentId AND s.actif = true")
    List<Serie> findBySegmentId(@Param("segmentId") Integer segmentId);
}