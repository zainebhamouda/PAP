package com.leoni.pap.repository;

import com.leoni.pap.entity.Segment;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface SegmentRepository extends JpaRepository<Segment, Integer> {
    List<Segment> findByPlantId(Integer plantId);
}