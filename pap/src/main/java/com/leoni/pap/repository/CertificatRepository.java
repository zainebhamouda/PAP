package com.leoni.pap.repository;

import com.leoni.pap.entity.Certificat;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface CertificatRepository extends JpaRepository<Certificat, Long> {
    Optional<Certificat> findByCertificationId(Long certifId);
}