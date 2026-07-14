package com.leoni.pap.repository;

import com.leoni.pap.entity.AuditExportDetail;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AuditExportDetailRepository extends JpaRepository<AuditExportDetail, Long> {
    List<AuditExportDetail> findByAuditId(Long auditId);
    void deleteByAuditId(Long auditId);
}
