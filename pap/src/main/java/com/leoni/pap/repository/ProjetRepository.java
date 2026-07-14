package com.leoni.pap.repository;

import com.leoni.pap.entity.Projet;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ProjetRepository extends JpaRepository<Projet, Integer> {
    List<Projet> findBySegmentId(Integer segmentId);
}