package com.leoni.pap.repository;

import com.leoni.pap.entity.NonConformiteAudit;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface NonConformiteAuditRepository extends JpaRepository<NonConformiteAudit, Long> {

    List<NonConformiteAudit> findByAuditId(Long auditId);

    @Query("SELECT n FROM NonConformiteAudit n WHERE n.audit.site.id = :siteId AND n.audit.dateRealisation BETWEEN :debut AND :fin")
    List<NonConformiteAudit> findBySiteAndPeriode(@Param("siteId") Integer siteId, @Param("debut") LocalDate debut, @Param("fin") LocalDate fin);

    @Query("SELECT n.typeDefaut, COUNT(n), SUM(n.totalPoints) FROM NonConformiteAudit n WHERE n.audit.plant.id = :plantId GROUP BY n.typeDefaut ORDER BY COUNT(n) DESC")
    List<Object[]> statsParTypeDefaut(@Param("plantId") Integer plantId);

    @Query("SELECT n.typeDefaut, COUNT(n) FROM NonConformiteAudit n WHERE n.audit.site.id = :siteId GROUP BY n.typeDefaut ORDER BY COUNT(n) DESC")
    List<Object[]> statsParTypeDefautSite(@Param("siteId") Integer siteId);
}
