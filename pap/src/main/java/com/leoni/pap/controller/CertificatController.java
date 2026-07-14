package com.leoni.pap.controller;

import com.leoni.pap.dto.request.SignerCertificatRequest;
import com.leoni.pap.dto.response.CertificatResponse;
import com.leoni.pap.service.CertificatService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/certificats")
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "Certificats", description = "Workflow de signatures et téléchargement PDF")
@RequiredArgsConstructor
public class CertificatController {

    private final CertificatService certificatService;

    @GetMapping("/en-attente-expert")
    @Operation(summary = "Certificats en attente de signature expert")
    public ResponseEntity<List<CertificatResponse>> enAttenteExpert() {
        return ResponseEntity.ok(certificatService.getCertificatsEnAttenteExpert());
    }

    @PostMapping("/{id}/signer-expert")
    @Operation(summary = "Signer le certificat (Expert) et choisir le chef de service")
    public ResponseEntity<CertificatResponse> signerExpert(
            @PathVariable Long id,
            @RequestBody SignerCertificatRequest req,
            @AuthenticationPrincipal UserDetails user) {
        return ResponseEntity.ok(certificatService.signerExpert(id, req, user.getUsername()));
    }

    @GetMapping("/en-attente-chef")
    @Operation(summary = "Certificats en attente de ma signature (Chef)")
    public ResponseEntity<List<CertificatResponse>> enAttenteChef(
            @AuthenticationPrincipal UserDetails user) {
        return ResponseEntity.ok(certificatService.getCertificatsEnAttenteChef(user.getUsername()));
    }

    @PostMapping("/{id}/signer-chef")
    @Operation(summary = "Signer le certificat (Chef de Service) → génère le PDF final")
    public ResponseEntity<CertificatResponse> signerChef(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails user) {
        return ResponseEntity.ok(certificatService.signerChef(id, user.getUsername()));
    }

    @GetMapping("/certification/{certifId}/pdf")
    @Operation(summary = "Obtenir le chemin du PDF certif pour téléchargement")
    public ResponseEntity<String> getPdf(@PathVariable Long certifId) {
        return ResponseEntity.ok(certificatService.getCheminPdf(certifId));
    }

    @GetMapping("/passage/{passageId}/qrcode")
    @Operation(summary = "Générer le QR code du certificat (PNG)")
    public ResponseEntity<byte[]> getQrCode(@PathVariable Long passageId) {
        byte[] png = certificatService.genererQrCode(passageId);
        return ResponseEntity.ok()
                .header("Content-Type", "image/png")
                .body(png);
    }

    // ── Vérification publique (sans auth) ──────────────────────────────
    // ✅ RequestMethod.HEAD ajouté — utilisé par le fetch mobile pour vérifier l'existence
    @RequestMapping(
            value  = "/public/verify/{passageId}",
            method = { RequestMethod.GET, RequestMethod.HEAD }
    )
    public ResponseEntity<org.springframework.core.io.Resource> verifyPublic(
            @PathVariable Long passageId) {

        String chemin = certificatService.getCheminPdfByPassageId(passageId);
        java.io.File file = new java.io.File(chemin);

        if (!file.exists())
            return ResponseEntity.notFound().build();

        // ✅ HEAD : on renvoie juste les headers, pas le body
        if (org.springframework.web.context.request.RequestContextHolder
                .getRequestAttributes() != null) {
            jakarta.servlet.http.HttpServletRequest req =
                    ((org.springframework.web.context.request.ServletRequestAttributes)
                            org.springframework.web.context.request.RequestContextHolder
                                    .getRequestAttributes()).getRequest();

            if ("HEAD".equalsIgnoreCase(req.getMethod())) {
                return ResponseEntity.ok()
                        .header("Content-Type", "application/pdf")
                        .header("Access-Control-Allow-Origin", "*")
                        .header("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS")
                        .build();
            }
        }

        org.springframework.core.io.Resource resource =
                new org.springframework.core.io.FileSystemResource(file);

        return ResponseEntity.ok()
                .header("Content-Type", "application/pdf")
                .header("Content-Disposition", "inline; filename=\"" + file.getName() + "\"")
                // ✅ inline (pas attachment) — permet l'aperçu sur mobile
                .header("Access-Control-Allow-Origin", "*")
                .header("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS")
                .body(resource);
    }
}