package com.leoni.pap.controller;

import com.leoni.pap.service.ExpirationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * ⚠️ CONTROLLER TEMPORAIRE — à retirer avant mise en prod (ou protéger avec @PreAuthorize("hasRole('ADMIN')")).
 * Permet de déclencher manuellement le job d'expiration des certifications
 * sans attendre le cron de 8h00, pour faciliter les tests.
 */
@RestController
@RequestMapping("/api/test")
@RequiredArgsConstructor
public class TestExpirationController {

    private final ExpirationService expirationService;

    @PostMapping("/trigger-expiration")
    public ResponseEntity<String> triggerExpiration() {
        expirationService.verifierExpirations();
        return ResponseEntity.ok("Job d'expiration exécuté avec succès.");
    }
}