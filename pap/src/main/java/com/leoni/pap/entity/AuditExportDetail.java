package com.leoni.pap.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

/**
 * AuditExportDetail — Sprint 4
 *
 * Représente une ligne d'audit magasin export :
 *  - un numéro de série (ex: 3SE 971 694 CJ)
 *  - un numéro de caisse (ex: S510110641)
 * associés à un AuditProduit de type AUDIT_MAGASIN_EXPORT.
 */
@Entity
@Table(name = "audit_export_detail",
        indexes = {
                @Index(name = "idx_aed_audit", columnList = "audit_id")
        })
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class AuditExportDetail {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "audit_id", nullable = false)
    private AuditProduit audit;

    /** Ex: 3SE 971 694 CJ */
    @Column(nullable = false, length = 100)
    private String numeroSerie;

    /** Ex: S510110641 */
    @Column(nullable = false, length = 100)
    private String numeroCaisse;

    /** Semaine de l'export (ex: LTN01/KW13) */
    @Column(length = 50)
    private String semaineExport;

    @Column(nullable = false, updatable = false)
    private LocalDateTime dateCreation = LocalDateTime.now();
}
