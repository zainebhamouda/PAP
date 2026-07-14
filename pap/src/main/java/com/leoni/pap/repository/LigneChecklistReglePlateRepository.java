package com.leoni.pap.repository;

import com.leoni.pap.entity.LigneChecklistReglePlate;
import com.leoni.pap.entity.enums.StatutChecklistItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface LigneChecklistReglePlateRepository extends JpaRepository<LigneChecklistReglePlate, Long> {

    List<LigneChecklistReglePlate> findByAuditId(Long auditId);

    @Query("SELECT l FROM LigneChecklistReglePlate l WHERE l.audit.plant.id = :plantId AND l.prochaineVerification <= :date")
    List<LigneChecklistReglePlate> findInstrumentsAVerifier(@Param("plantId") Integer plantId, @Param("date") LocalDate date);

    @Query("SELECT COUNT(l) FROM LigneChecklistReglePlate l WHERE l.audit.plant.id = :plantId AND l.statut = :statut")
    long countByPlantAndStatut(@Param("plantId") Integer plantId, @Param("statut") StatutChecklistItem statut);
}
