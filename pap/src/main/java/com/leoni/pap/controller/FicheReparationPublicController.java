package com.leoni.pap.controller;

import com.leoni.pap.exception.BusinessException;
import com.leoni.pap.service.FicheReparationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * FicheReparationPublicController — Sprint 3
 *
 * Endpoints PUBLICS (sans JWT) accessibles depuis les boutons dans les emails
 * envoyés aux destinataires externes (hors plateforme).
 *
 * Sécurité :
 *  - Pas d'authentification requise (permitAll dans SecurityConfig)
 *  - Chaque action est protégée par un token UUID unique stocké en base
 *  - Le token est généré à la création de la fiche/PDCA et ne peut être réutilisé
 *    qu'une fois (statut mis à jour en base après traitement)
 *
 * À configurer dans SecurityConfig.java :
 *   .requestMatchers("/api/public/**").permitAll()
 *
 * Mapping :
 *   GET /api/public/fiche-reparation/action?ficheId=&action=VALIDER|EN_COURS&token=
 *   GET /api/public/pdca/action?pdcaId=&action=VALIDER|EN_COURS&token=
 */
@RestController
@RequestMapping("/api/public")
@RequiredArgsConstructor
@Tag(name = "Public — Actions Email", description = "Endpoints sans authentification pour les actions depuis email externe")
public class FicheReparationPublicController {

    private final FicheReparationService ficheService;

    // ═══════════════════════════════════════════════════════════
    // FICHE DE RÉPARATION — Action email externe
    // ═══════════════════════════════════════════════════════════

    /**
     * GET /api/public/fiche-reparation/action
     *
     * Traite l'action du destinataire externe sur une fiche de réparation.
     * Appelé automatiquement au clic sur un bouton dans l'email.
     *
     * @param ficheId  ID de la fiche de réparation
     * @param action   "VALIDER" ou "EN_COURS"
     * @param token    Token UUID de sécurité (généré à la création de la fiche)
     *
     * Retourne une page HTML de confirmation lisible dans un navigateur.
     */
    @GetMapping("/fiche-reparation/action")
    @Operation(
            summary = "Action email externe — Fiche de réparation",
            description = "Endpoint public appelé depuis les boutons de l'email envoyé au destinataire externe. "
                    + "Action VALIDER → marque la fiche comme validée. "
                    + "Action EN_COURS → marque En cours de traitement et planifie une relance dans 3 jours."
    )
    public ResponseEntity<String> traiterActionFiche(
            @RequestParam Long ficheId,
            @RequestParam String action,
            @RequestParam String token) {

        try {
            String message = ficheService.traiterActionFicheEmail(ficheId, action, token);
            return ResponseEntity.ok()
                    .header("Content-Type", "text/html;charset=UTF-8")
                    .body(buildConfirmationPage(message, "Fiche de Réparation", false));

        } catch (BusinessException e) {
            return ResponseEntity.badRequest()
                    .header("Content-Type", "text/html;charset=UTF-8")
                    .body(buildConfirmationPage("❌ " + e.getMessage(), "Erreur", true));

        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .header("Content-Type", "text/html;charset=UTF-8")
                    .body(buildConfirmationPage(
                            "❌ Une erreur inattendue s'est produite. Veuillez contacter l'administrateur.",
                            "Erreur", true));
        }
    }

    // ═══════════════════════════════════════════════════════════
    // PDCA — Action email externe
    // ═══════════════════════════════════════════════════════════

    /**
     * GET /api/public/pdca/action
     *
     * Traite l'action du destinataire externe sur un PDCA.
     * Appelé automatiquement au clic sur un bouton dans l'email.
     *
     * @param pdcaId  ID du plan d'action PDCA
     * @param action  "VALIDER" ou "EN_COURS"
     * @param token   Token UUID de sécurité (généré à la création du PDCA)
     */
    @GetMapping("/pdca/action")
    @Operation(
            summary = "Action email externe — PDCA",
            description = "Endpoint public appelé depuis les boutons de l'email envoyé au destinataire externe du PDCA. "
                    + "Action VALIDER → marque le PDCA RESOLU. "
                    + "Action EN_COURS → marque En cours et planifie une relance dans 3 jours."
    )
    public ResponseEntity<String> traiterActionPDCA(
            @RequestParam Long pdcaId,
            @RequestParam String action,
            @RequestParam String token) {

        try {
            String message = ficheService.traiterActionPDCAEmail(pdcaId, action, token);
            return ResponseEntity.ok()
                    .header("Content-Type", "text/html;charset=UTF-8")
                    .body(buildConfirmationPage(message, "Plan d'Action PDCA", false));

        } catch (BusinessException e) {
            return ResponseEntity.badRequest()
                    .header("Content-Type", "text/html;charset=UTF-8")
                    .body(buildConfirmationPage("❌ " + e.getMessage(), "Erreur", true));

        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .header("Content-Type", "text/html;charset=UTF-8")
                    .body(buildConfirmationPage(
                            "❌ Une erreur inattendue s'est produite. Veuillez contacter l'administrateur.",
                            "Erreur", true));
        }
    }

    // ═══════════════════════════════════════════════════════════
    // PAGE HTML DE CONFIRMATION
    // ═══════════════════════════════════════════════════════════

    /**
     * Génère une page HTML minimaliste et professionnelle affichée dans le navigateur
     * du destinataire après avoir cliqué sur un bouton dans son email.
     */
    private String buildConfirmationPage(String message, String titre, boolean isError) {
        String bgColor    = isError ? "#FEF2F2" : "#F0FDF4";
        String borderColor = isError ? "#FCA5A5" : "#86EFAC";
        String iconColor  = isError ? "#C0392B" : "#00ad57";
        String icon       = isError ? "⚠️" : "✅";

        return """
        <!DOCTYPE html>
        <html lang="fr">
        <head>
          <meta charset="UTF-8"/>
          <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
          <title>LEONI PAP — %s</title>
          <style>
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body {
              font-family: 'Segoe UI', Arial, sans-serif;
              background: #F1F5F9;
              min-height: 100vh;
              display: flex;
              align-items: center;
              justify-content: center;
              padding: 20px;
            }
            .card {
              background: #fff;
              border-radius: 16px;
              box-shadow: 0 8px 32px rgba(0,0,0,0.10);
              max-width: 480px;
              width: 100%%;
              overflow: hidden;
            }
            .header {
              background: #001F4E;
              padding: 20px 28px;
              display: flex;
              align-items: center;
              gap: 12px;
            }
            .logo {
              background: #C8982A;
              border-radius: 8px;
              width: 36px;
              height: 36px;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 18px;
              font-weight: 900;
              color: #001F4E;
              flex-shrink: 0;
            }
            .brand-name { color: #fff; font-size: 15px; font-weight: 800; }
            .brand-sub  { color: rgba(255,255,255,0.5); font-size: 10px; letter-spacing: 0.1em; }
            .stripe { height: 4px; background: linear-gradient(90deg, #C8982A, #001F4E); }
            .body { padding: 36px 28px; text-align: center; }
            .result-box {
              background: %s;
              border: 2px solid %s;
              border-radius: 12px;
              padding: 20px 24px;
              margin-bottom: 20px;
            }
            .result-icon  { font-size: 42px; margin-bottom: 12px; }
            .result-title { font-size: 18px; font-weight: 800; color: %s; margin-bottom: 8px; }
            .result-msg   { font-size: 14px; color: #475569; line-height: 1.6; }
            .footer {
              background: #F8FAFC;
              border-top: 1px solid #E2E8F0;
              padding: 14px 28px;
              text-align: center;
              font-size: 11px;
              color: #CBD5E1;
            }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="header">
              <div class="logo">L</div>
              <div>
                <div class="brand-name">LEONI PAP</div>
                <div class="brand-sub">QUALITY AUDIT PLATFORM</div>
              </div>
            </div>
            <div class="stripe"></div>
            <div class="body">
              <div class="result-box">
                <div class="result-icon">%s</div>
                <div class="result-title">%s</div>
                <div class="result-msg">%s</div>
              </div>
              <p style="font-size:13px;color:#94A3B8;line-height:1.6;">
                Vous pouvez fermer cette fenêtre.<br/>
                L'équipe LEONI PAP a été notifiée automatiquement.
              </p>
            </div>
            <div class="footer">
              © 2025 LEONI PAP — Quality Audit Platform
            </div>
          </div>
        </body>
        </html>
        """.formatted(
                titre,        // <title>
                bgColor, borderColor, iconColor,  // result-box styles
                icon,         // icône
                titre,        // result-title
                message       // result-msg
        );
    }
}