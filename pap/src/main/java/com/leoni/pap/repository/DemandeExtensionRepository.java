package com.leoni.pap.repository;

import com.leoni.pap.entity.DemandeExtension;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface DemandeExtensionRepository extends JpaRepository<DemandeExtension, Long> {
    List<DemandeExtension> findByAuditIdOrderByCreatedAtDesc(Long auditId);
    Optional<DemandeExtension> findTopByAuditIdAndStatutOrderByCreatedAtDesc(Long auditId, String statut);
    boolean existsByAuditIdAndStatut(Long auditId, String statut);
    Optional<DemandeExtension> findTopByAuditIdOrderByCreatedAtDesc(Long auditId);

}