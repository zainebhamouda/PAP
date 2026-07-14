package com.leoni.pap.repository;

import com.leoni.pap.entity.Plant;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface PlantRepository extends JpaRepository<Plant, Integer> {
    List<Plant> findBySiteId(Integer siteId);

    List<Plant> findAllByOrderByNomAsc();
}