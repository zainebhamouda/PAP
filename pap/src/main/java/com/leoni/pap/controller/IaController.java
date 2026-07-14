package com.leoni.pap.controller;

import com.leoni.pap.service.IaService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * IaController — Endpoints REST pour les modèles IA
 *
 * Préfixe : /api/ia
 *
 * Modèle 1 (QK) :
 *   POST /api/ia/audits/{auditId}/predire-qk
 *
 * Modèle 2 (RH) :
 *   GET  /api/ia/classement
 *   GET  /api/ia/recommandations-promotion
 *   POST /api/ia/auditeurs/{auditeurId}/evaluer
 *   GET  /api/ia/status
 */
@RestController
@RequestMapping("/api/ia")
@RequiredArgsConstructor
public class IaController {

    private final IaService iaService;

    // ═══════════════════════════════════════════════════════════
    // MODÈLE 1 — Prédiction QK
    // ═══════════════════════════════════════════════════════════

    /**
     * Prédit le QK d'un audit à partir de ses annexes remplies.
     * Appelé depuis le frontend quand l'auditeur finit ses annexes.
     *
     * Accès : AUDITEUR (pour son propre audit) + EXPERT + ADMIN
     */
    @PostMapping("/audits/{auditId}/predire-qk")
    //@PreAuthorize("hasAnyRole('AUDITEUR','EXPERT_PRODUCT_AUDIT','ADMIN')")
    public ResponseEntity<Map<String, Object>> predireQK(@PathVariable Long auditId) {
        Map<String, Object> result = iaService.predireQK(auditId);
        if (result.containsKey("erreur")) {
            return ResponseEntity.internalServerError().body(result);
        }
        return ResponseEntity.ok(result);
    }

    // ═══════════════════════════════════════════════════════════
    // MODÈLE 2 — Classement RH
    // ═══════════════════════════════════════════════════════════

    /**
     * Retourne le classement des auditeurs.
     *
     * Paramètres optionnels :
     *   ?niveau=TOP|BON|MOYEN|A_RISQUE
     *   ?siteNom=Sousse
     *   ?recommandes=true
     *   ?top=10
     *
     * Accès : EXPERT + ADMIN + CHEF_SERVICE
     */
    @GetMapping("/classement")
    @PreAuthorize("hasAnyRole('EXPERT_PRODUCT_AUDIT','ADMIN','CHEF_SERVICE')")
    public ResponseEntity<Map<String, Object>> getClassement(
            @RequestParam(required = false) String niveau,
            @RequestParam(required = false) String siteNom,
            @RequestParam(defaultValue = "false") boolean recommandes,
            @RequestParam(required = false) Integer top) {

        Map<String, Object> result = iaService.getClassementAuditeurs(niveau, siteNom, recommandes, top);
        return ResponseEntity.ok(result);
    }

    /**
     * Retourne les meilleurs candidats pour une promotion au poste Expert.
     *
     * Paramètres :
     *   ?siteNom=Sousse  (optionnel)
     *   ?n=3             (nombre de candidats, défaut 3)
     *
     * Accès : ADMIN uniquement (décision RH sensible)
     */
    @GetMapping("/recommandations-promotion")
    @PreAuthorize("hasAnyRole('ADMIN','CHEF_SERVICE')")
    public ResponseEntity<Map<String, Object>> getRecommandationsPromotion(
            @RequestParam(required = false) String siteNom,
            @RequestParam(defaultValue = "3") int n) {

        Map<String, Object> result = iaService.getRecommandationsPromotion(siteNom, n);
        return ResponseEntity.ok(result);
    }

    /**
     * Évalue un auditeur spécifique et retourne son score détaillé.
     * Appelé après la clôture d'un audit pour mise à jour temps réel.
     *
     * Accès : EXPERT + ADMIN
     */
    @PostMapping("/auditeurs/{auditeurId}/evaluer")
    @PreAuthorize("hasAnyRole('EXPERT_PRODUCT_AUDIT','ADMIN','CHEF_SERVICE')")
    public ResponseEntity<Map<String, Object>> evaluerAuditeur(@PathVariable Integer auditeurId) {
        Map<String, Object> result = iaService.evaluerAuditeur(auditeurId);
        return ResponseEntity.ok(result);
    }

    /**
     * Vérifie si le serveur IA Python est disponible.
     * Utilisé par le frontend pour afficher un badge "IA disponible / indisponible".
     */
    @GetMapping("/status")
    @PreAuthorize("hasAnyRole('EXPERT_PRODUCT_AUDIT','ADMIN','AUDITEUR')")
    public ResponseEntity<Map<String, Object>> getStatus() {
        boolean dispo = iaService.isIaDisponible();
        return ResponseEntity.ok(Map.of(
                "iaDisponible", dispo,
                "message", dispo ? "Modèles IA opérationnels" : "Service IA non démarré"
        ));
    }
}