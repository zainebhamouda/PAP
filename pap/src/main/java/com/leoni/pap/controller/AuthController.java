package com.leoni.pap.controller;

import com.leoni.pap.dto.request.*;
import com.leoni.pap.dto.response.AuthResponse;
import com.leoni.pap.service.AuthService;
import com.leoni.pap.repository.*;
import com.leoni.pap.service.ProfilService;
import com.leoni.pap.entity.*;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import com.leoni.pap.exception.BusinessException;
/**
 * Controller d'authentification — routes PUBLIQUES (sans token).
 *
 * Processus d'inscription en 3 étapes :
 *   Étape 1 → valider infos personnelles
 *   Étape 2 → vérifier rôle
 *   Étape 3 → téléphone + conditions → compte activé
 *
 * Après login, utiliser GET /api/auth/me pour savoir vers quel
 * dashboard rediriger selon le rôle :
 *
 *   ADMIN                        → /admin/dashboard
 *   AUDITEUR                     → /auditeur/dashboard
 *   CHEF_SERVICE                 → /chef-service/dashboard
 *   RESPONSABLE_QUALITE_CENTRALE → /responsable/dashboard
 *   EXPERT_PRODUCT_AUDIT         → /expert/dashboard
 */
@RestController
@RequestMapping("/api/auth")
@Tag(name = "Authentification", description = "Inscription 3 étapes + Connexion — routes publiques")
public class AuthController {

    private final AuthService   authService;
    private final ProfilService profilService;

    public AuthController(AuthService authService, ProfilService profilService) {
        this.authService   = authService;
        this.profilService = profilService;
    }

    @PostMapping("/register/step1")
    @Operation(summary = "Étape 1 — Informations personnelles")
    public ResponseEntity<String> step1(@RequestBody RegisterStep1Request req) {
        authService.validerEtape1(req);
        return ResponseEntity.ok("Étape 1 validée.");
    }

    @PostMapping("/register/step2")
    @Operation(summary = "Étape 2 — Vérification du rôle")
    public ResponseEntity<String> step2(@RequestBody RegisterStep2Request req) {
        authService.validerEtape2(req);
        return ResponseEntity.ok("Rôle validé.");
    }

    @PostMapping("/register/confirm")
    @Operation(summary = "Étape 3 — Confirmation et activation du compte")
    public ResponseEntity<String> confirm(@RequestBody RegisterFinalRequest req) {
        authService.creerCompte(req);
        return ResponseEntity.ok("Compte créé avec succès.");
    }

    @PostMapping("/login")
    @Operation(
            summary = "Connexion",
            description = "Retourne un token JWT. Ensuite appeler GET /api/auth/me pour connaître le rôle."
    )
    public ResponseEntity<AuthResponse> login(@RequestBody LoginRequest req) {
        return ResponseEntity.ok(authService.login(req));
    }

    /**
     * GET /api/auth/me
     * FIX : guard null sur userDetails → évite NullPointerException si token absent/expiré
     */
    @GetMapping("/me")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(
            summary = "Qui suis-je ? (après login)",
            description = "Retourne le rôle et les infos. Le frontend utilise le rôle pour rediriger."
    )
    public ResponseEntity<?> whoAmI(
            @AuthenticationPrincipal UserDetails userDetails) {

        // ← FIX : token absent ou expiré → 401 propre au lieu de NullPointerException
        if (userDetails == null) {
            return ResponseEntity.status(401).body("Token manquant ou expiré.");
        }

        return ResponseEntity.ok(profilService.getMonProfil(userDetails.getUsername()));
    }
    @PostMapping("/forgot-password")
    public ResponseEntity<String> forgotPassword(@RequestBody ForgotPasswordRequest req) {
        String token = authService.generateResetToken(req.getMatricule());
        // Pour l'instant, renvoyer le token au frontend pour test
        return ResponseEntity.ok("Token généré : " + token);
    }

    @PostMapping("/reset-password")
    @Operation(summary = "Réinitialiser le mot de passe via matricule")
    public ResponseEntity<String> resetPassword(@RequestBody ResetPasswordRequest req) {
        // Vérifier que les champs sont remplis
        if (req.getMatricule() == null || req.getMatricule().isEmpty() ||
                req.getPassword() == null || req.getPassword().isEmpty() ||
                req.getConfirm() == null || req.getConfirm().isEmpty()) {
            return ResponseEntity.badRequest().body("Veuillez remplir tous les champs.");
        }

        // Vérifier que mot de passe et confirmation correspondent
        if (!req.getPassword().equals(req.getConfirm())) {
            return ResponseEntity.badRequest().body("Les mots de passe ne correspondent pas.");
        }

        try {
            // Appel du service pour mettre à jour le mot de passe
            authService.resetPasswordByMatricule(req.getMatricule(), req.getPassword());
            return ResponseEntity.ok("Mot de passe réinitialisé avec succès !");
        } catch (BusinessException ex) {
            return ResponseEntity.badRequest().body(ex.getMessage());
        }
    }
}