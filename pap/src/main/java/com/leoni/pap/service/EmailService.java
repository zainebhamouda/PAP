package com.leoni.pap.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import com.leoni.pap.dto.request.*;
import com.leoni.pap.entity.*;
import com.leoni.pap.entity.enums.*;
import com.leoni.pap.repository.*;

import jakarta.mail.internet.MimeMessage;
import jakarta.mail.internet.MimeMessage;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.core.io.ByteArrayResource;
import java.util.List;
/**
 * EmailService — version corrigée
 *
 * Correction buildFicheReparationHtml :
 *  - Suppression des champs "Action corrective" et "Date limite" (inexistants dans le formulaire)
 *  - Ajout des vrais champs du formulaire : Zone affectée, Origine NC, Code article, Remarques
 *  - Correction "Bonjour matricule" → nom correct via nomDestinataire
 */
@Service
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${app.frontend.url:http://localhost:5173}")
    private String frontendUrl;

    @Value("${spring.mail.username:noreply@leoni.com}")
    private String fromEmail;

    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    // ═══════════════════════════════════════════════════════════
    // MÉTHODES EXISTANTES (inchangées)
    // ═══════════════════════════════════════════════════════════

    public void envoyerInvitation(String email, String matricule, String role) {
        try {
            String lienInscription = frontendUrl
                    + "/register?matricule=" + matricule
                    + "&email=" + email;

            String roleLabel = switch (role.toUpperCase()) {
                case "AUDITEUR"                     -> "Auditeur";
                case "CHEF_SERVICE"                 -> "Chef de Service";
                case "RESPONSABLE_QUALITE_CENTRALE" -> "Responsable Qualité Centrale";
                case "EXPERT_PRODUCT_AUDIT"         -> "Expert Product Audit";
                case "ADMIN"                        -> "Administrateur";
                default                             -> role;
            };

            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail, "Leoni PAP — Quality Audit Platform");
            helper.setTo(email);
            helper.setSubject("Invitation à rejoindre la plateforme Leoni PAP");
            helper.setText(buildEmailHtml(matricule, roleLabel, lienInscription), true);

            mailSender.send(message);
            System.out.println("[EMAIL] Invitation envoyée → " + email);

        } catch (Exception e) {
            System.err.println("[EMAIL] Échec envoi invitation → " + email + " : " + e.getMessage());
        }
    }

    public void envoyerEmailConnexion(String email, String nomComplet) {
        System.out.println("[EMAIL] Connexion détectée pour : "
                + nomComplet + " <" + email + ">");
    }

    public void envoyerNotification(String email,
                                    String nomComplet,
                                    String titre,
                                    String message) {
        try {
            MimeMessage mimeMessage = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, "UTF-8");

            helper.setFrom(fromEmail, "Leoni PAP — Quality Audit Platform");
            helper.setTo(email);
            helper.setSubject(titre);
            helper.setText(buildNotifHtml(nomComplet, titre, message), true);

            mailSender.send(mimeMessage);
            System.out.println("[EMAIL] Notif envoyée → " + email + " : " + titre);

        } catch (Exception e) {
            System.err.println("[EMAIL] Échec notif → " + email + " : " + e.getMessage());
        }
    }

    // ═══════════════════════════════════════════════════════════
    // FICHE DE RÉPARATION — signature INCHANGÉE (aucun refactoring nécessaire)
    // Seul buildFicheReparationHtml() est modifié
    // ═══════════════════════════════════════════════════════════

    /**
     * Les paramètres de la méthode publique sont inchangés.
     * Dans FicheReparationService.creerFicheReparation(), l'appel reste identique :
     *
     *   emailService.envoyerFicheReparationEmail(
     *       dest.getEmail(),
     *       dest.getNomAffichage(),          ← renvoie nom > matricule > email
     *       audit.getReference(),
     *       audit.getValeurQK(),
     *       req.getDescriptionNC(),          → "Problème constaté"
     *       req.getZoneAffectee(),           → "Zone affectée"    (était "" vide)
     *       req.getOrigineNC(),              → "Origine NC"       (était "" vide)
     *       lienValider,
     *       lienEnCours
     *   );
     *
     * Mais aussi ajouter codeArticle et remarques dans un 2e appel enrichi.
     * Pour ne pas changer la signature publique existante, on ajoute une surcharge.
     */
    public void envoyerFicheReparationEmail(String email,
                                            String nomDestinataire,
                                            String auditReference,
                                            Double valeurQK,
                                            String descriptionNC,
                                            String zoneAffectee,
                                            String origineNC,
                                            String lienValider,
                                            String lienEnCours) {
        // Appel la surcharge complète avec codeArticle et remarques vides
        envoyerFicheReparationEmailComplet(email, nomDestinataire, auditReference, valeurQK,
                descriptionNC, zoneAffectee, origineNC, null, null, lienValider, lienEnCours);
    }

    /**
     * Surcharge complète — à utiliser dans creerFicheReparation() pour passer
     * tous les champs du formulaire.
     *
     * Dans FicheReparationService, remplacez l'appel par :
     *
     *   emailService.envoyerFicheReparationEmailComplet(
     *       dest.getEmail(),
     *       dest.getNomAffichage(),
     *       audit.getReference(),
     *       audit.getValeurQK(),
     *       req.getDescriptionNC(),
     *       req.getZoneAffectee(),
     *       req.getOrigineNC(),
     *       req.getCodeArticle(),
     *       req.getRemarquesOptionnelles(),
     *       lienValider,
     *       lienEnCours
     *   );
     */
    public void envoyerFicheReparationEmailComplet(String email,
                                                   String nomDestinataire,
                                                   String auditReference,
                                                   Double valeurQK,
                                                   String descriptionNC,
                                                   String zoneAffectee,
                                                   String origineNC,
                                                   String codeArticle,
                                                   String remarques,
                                                   String lienValider,
                                                   String lienEnCours) {
        try {
            MimeMessage mimeMessage = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, "UTF-8");

            helper.setFrom(fromEmail, "Leoni PAP — Quality Audit Platform");
            helper.setTo(email);
            helper.setSubject("Fiche de réparation — Audit " + auditReference + " [QK=" + valeurQK + "]");
            helper.setText(buildFicheReparationHtml(
                    nomDestinataire, auditReference, valeurQK,
                    safe(descriptionNC),
                    safe(zoneAffectee),
                    safe(origineNC),
                    safe(codeArticle),
                    safe(remarques),
                    lienValider, lienEnCours), true);

            mailSender.send(mimeMessage);
            System.out.println("[EMAIL] Fiche réparation envoyée → " + email + " (audit " + auditReference + ")");

        } catch (Exception e) {
            System.err.println("[EMAIL] Échec fiche réparation → " + email + " : " + e.getMessage());
        }
    }

    // ═══════════════════════════════════════════════════════════
    // BUILDERS HTML PRIVÉS
    // ═══════════════════════════════════════════════════════════

    /**
     * HTML email fiche de réparation — corrigé.
     *
     * Champs affichés (= champs du formulaire React FicheReparationModal) :
     *   1. Problème constaté       ← descriptionNC
     *   2. Zone affectée           ← zoneAffectee      (remplace "Action corrective")
     *   3. Origine NC              ← origineNC         (remplace "Date limite")
     *   4. Code article            ← codeArticle       (nouveau, affiché si non vide)
     *   5. Remarques               ← remarques         (nouveau, affiché si non vide)
     *
     * Correction "Bonjour matricule" : nomDestinataire est maintenant le nom complet
     * car FicheReparationRequest.Destinataire.getNomAffichage() retourne
     * nom > matricule > email dans cet ordre de priorité.
     */
    private String buildFicheReparationHtml(String nom,
                                            String ref,
                                            Double qk,
                                            String descriptionNC,
                                            String zoneAffectee,
                                            String origineNC,
                                            String codeArticle,
                                            String remarques,
                                            String lienValider,
                                            String lienEnCours) {

        String qkColor = qk <= 0.5 ? "#D97706" : qk <= 1.0 ? "#9D174D" : "#C0392B";
        String qkBg    = qk <= 0.5 ? "#FFFBEB" : qk <= 1.0 ? "#FDF2F8" : "#FEF2F2";
        String qkBd    = qk <= 0.5 ? "#FCD34D" : qk <= 1.0 ? "#F9A8D4" : "#FECACA";
        String qkLabel = qk <= 0.5 ? "Non-Conformité Mineure"
                : qk <= 1.0 ? "Action Corrective Requise"
                :             "Alerte Critique";

        // Lignes optionnelles (code article + remarques) — affichées seulement si renseignées
        String ligneCodeArticle = "—".equals(codeArticle) ? "" : """
            <tr>
              <td style="background:#F8FAFC;padding:14px 22px;border-bottom:1px solid #E2E8F0;">
                <p style="margin:0 0 5px;font-size:10px;font-weight:700;color:#94A3B8;
                           text-transform:uppercase;letter-spacing:0.09em;">Code article</p>
                <p style="margin:0;font-size:14px;color:#0B1E3D;font-weight:600;line-height:1.6;">%s</p>
              </td>
            </tr>
            """.formatted(codeArticle);

        String ligneRemarques = "—".equals(remarques) ? "" : """
            <tr>
              <td style="background:#F8FAFC;padding:14px 22px;">
                <p style="margin:0 0 5px;font-size:10px;font-weight:700;color:#94A3B8;
                           text-transform:uppercase;letter-spacing:0.09em;">Remarques</p>
                <p style="margin:0;font-size:14px;color:#0B1E3D;font-weight:600;line-height:1.6;">%s</p>
              </td>
            </tr>
            """.formatted(remarques);

        return """
    <!DOCTYPE html>
    <html lang="fr">
    <head><meta charset="UTF-8"/>
    <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
    </head>
    <body style="margin:0;padding:0;background:#EEF2F8;
                 font-family:'Segoe UI',Helvetica,Arial,sans-serif;">

      <table width="100%%" cellpadding="0" cellspacing="0"
             style="background:#EEF2F8;padding:48px 16px;">
        <tr><td align="center">
          <table width="680" cellpadding="0" cellspacing="0"
                 style="max-width:680px;width:100%%;background:#ffffff;
                        border-radius:14px;overflow:hidden;
                        box-shadow:0 8px 40px rgba(0,20,60,0.13);">

            <!-- ── HEADER ── -->
            <tr>
              <td style="background:#001F4E;padding:26px 40px;">
                <table cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="background:#C8982A;border-radius:8px;
                               width:40px;height:40px;text-align:center;
                               vertical-align:middle;">
                      <span style="font-size:20px;font-weight:900;
                                   color:#001F4E;line-height:40px;">L</span>
                    </td>
                    <td style="padding-left:14px;vertical-align:middle;">
                      <p style="margin:0;font-size:16px;font-weight:800;
                                color:#ffffff;letter-spacing:0.02em;">LEONI PAP</p>
                      <p style="margin:0;font-size:10px;letter-spacing:0.12em;
                                color:rgba(255,255,255,0.45);text-transform:uppercase;">
                        Quality Audit Platform
                      </p>
                    </td>
                    <td style="text-align:right;vertical-align:middle;padding-left:40px;">
                      <span style="display:inline-block;background:rgba(200,152,42,0.18);
                                   color:#C8982A;font-size:11px;font-weight:700;
                                   padding:5px 14px;border-radius:99px;
                                   letter-spacing:0.06em;text-transform:uppercase;
                                   border:1px solid rgba(200,152,42,0.35);">
                        Fiche de réparation
                      </span>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- ── BANDE COULEUR QK ── -->
            <tr>
              <td style="background:%s;height:4px;font-size:0;">&nbsp;</td>
            </tr>

            <!-- ── CORPS ── -->
            <tr>
              <td style="padding:40px;">

                <!-- Référence audit -->
                <p style="margin:0 0 4px;font-size:11px;font-weight:700;
                           color:#94A3B8;text-transform:uppercase;
                           letter-spacing:0.1em;">Référence</p>
                <h1 style="margin:0 0 8px;font-size:22px;font-weight:800;
                           color:#0B1E3D;letter-spacing:-0.01em;">
                  Audit %s — Action requise
                </h1>
                <p style="margin:0 0 32px;font-size:14px;color:#64748B;line-height:1.7;">
                  Bonjour <strong style="color:#0B1E3D;">%s</strong>,<br/>
                  Une fiche de réparation a été créée suite à l'audit ci-dessus.
                  Merci de traiter cette demande dans les meilleurs délais.
                </p>

                <!-- Badge QK -->
                <table cellpadding="0" cellspacing="0" width="100%%"
                       style="background:%s;border:1.5px solid %s;
                              border-radius:10px;margin-bottom:28px;">
                  <tr>
                    <td style="padding:14px 20px;">
                      <table cellpadding="0" cellspacing="0" width="100%%">
                        <tr>
                          <td>
                            <p style="margin:0 0 2px;font-size:10px;font-weight:700;
                                       color:%s;text-transform:uppercase;
                                       letter-spacing:0.09em;">Indice qualité</p>
                            <p style="margin:0;font-size:15px;font-weight:800;color:%s;">%s</p>
                          </td>
                          <td align="right">
                            <span style="display:inline-block;background:%s;
                                         color:#ffffff;font-size:20px;font-weight:900;
                                         padding:6px 18px;border-radius:8px;">
                              QK = %.2f
                            </span>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>

                <!-- Détails — uniquement les champs du formulaire React -->
                <table cellpadding="0" cellspacing="0" width="100%%"
                       style="border:1px solid #E2E8F0;border-radius:10px;
                              overflow:hidden;margin-bottom:32px;">
                  <tr>
                    <td style="background:#ffffff;padding:14px 22px;
                               border-bottom:1px solid #E2E8F0;">
                      <p style="margin:0 0 5px;font-size:10px;font-weight:700;
                                 color:#94A3B8;text-transform:uppercase;
                                 letter-spacing:0.09em;">Problème constaté (Description NC)</p>
                      <p style="margin:0;font-size:14px;color:#0B1E3D;
                                font-weight:600;line-height:1.6;">%s</p>
                    </td>
                  </tr>
                  <tr>
                    <td style="background:#F8FAFC;padding:14px 22px;
                               border-bottom:1px solid #E2E8F0;">
                      <p style="margin:0 0 5px;font-size:10px;font-weight:700;
                                 color:#94A3B8;text-transform:uppercase;
                                 letter-spacing:0.09em;">Zone affectée</p>
                      <p style="margin:0;font-size:14px;color:#0B1E3D;
                                font-weight:600;line-height:1.6;">%s</p>
                    </td>
                  </tr>
                  <tr>
                    <td style="background:#ffffff;padding:14px 22px;
                               border-bottom:1px solid #E2E8F0;">
                      <p style="margin:0 0 5px;font-size:10px;font-weight:700;
                                 color:#94A3B8;text-transform:uppercase;
                                 letter-spacing:0.09em;">Origine NC</p>
                      <p style="margin:0;font-size:14px;color:#0B1E3D;
                                font-weight:600;line-height:1.6;">%s</p>
                    </td>
                  </tr>
                  %s
                  %s
                </table>

                <!-- Séparateur -->
                <div style="height:1px;background:#F1F5F9;margin-bottom:28px;"></div>

                <!-- Instructions -->
                <p style="margin:0 0 20px;font-size:13px;color:#475569;
                          line-height:1.7;font-weight:500;">
                  Veuillez indiquer l'état d'avancement en cliquant
                  sur l'un des boutons ci-dessous :
                </p>

                <!-- Boutons d'action -->
                <table cellpadding="0" cellspacing="0" width="100%%"
                       style="margin-bottom:28px;">
                  <tr>
                    <td width="50%%" style="padding-right:8px;">
                      <a href="%s"
                         style="display:block;background:#059669;color:#ffffff;
                                text-decoration:none;font-size:13px;font-weight:700;
                                padding:15px 20px;border-radius:9px;text-align:center;">
                        Valider — Problème résolu
                      </a>
                    </td>
                    <td width="50%%" style="padding-left:8px;">
                      <a href="%s"
                         style="display:block;background:#D97706;color:#ffffff;
                                text-decoration:none;font-size:13px;font-weight:700;
                                padding:15px 20px;border-radius:9px;text-align:center;">
                        En cours de traitement
                      </a>
                    </td>
                  </tr>
                </table>

                <!-- Note -->
                <table cellpadding="0" cellspacing="0" width="100%%"
                       style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:8px;">
                  <tr>
                    <td style="padding:12px 18px;">
                      <p style="margin:0;font-size:12px;color:#64748B;line-height:1.7;">
                        En cliquant sur <strong>En cours de traitement</strong>,
                        vous recevrez une relance automatique dans
                        <strong>3 jours</strong> si la fiche n'a pas encore été validée.
                        Ces liens sont à usage unique et sécurisés.
                      </p>
                    </td>
                  </tr>
                </table>

              </td>
            </tr>

            <!-- ── FOOTER ── -->
            <tr>
              <td style="background:#F8FAFC;border-top:1px solid #E2E8F0;padding:20px 40px;">
                <table cellpadding="0" cellspacing="0" width="100%%">
                  <tr>
                    <td>
                      <p style="margin:0;font-size:12px;color:#0B1E3D;font-weight:700;">
                        LEONI PAP — Quality Audit Platform
                      </p>
                      <p style="margin:4px 0 0;font-size:11px;color:#94A3B8;">
                        Cet email est généré automatiquement — merci de ne pas y répondre.
                      </p>
                    </td>
                    <td align="right" style="vertical-align:middle;">
                      <span style="font-size:10px;color:#CBD5E1;">© 2026 LEONI</span>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

          </table>
        </td></tr>
      </table>

    </body>
    </html>
    """.formatted(
                qkColor,                         // bande couleur top
                ref,                             // h1 référence
                nom,                             // "Bonjour NOM" — jamais le matricule
                qkBg, qkBd,                      // badge bg + border
                qkColor, qkColor, qkLabel,       // badge texte label
                qkColor, qk,                     // badge QK valeur
                descriptionNC,                   // ligne 1 : description NC
                zoneAffectee,                    // ligne 2 : zone affectée
                origineNC,                       // ligne 3 : origine NC
                ligneCodeArticle,                // ligne 4 optionnelle : code article
                ligneRemarques,                  // ligne 5 optionnelle : remarques
                lienValider,                     // bouton vert
                lienEnCours                      // bouton orange
        );
    }

    // ── PDCA, buildNotifHtml, buildEmailHtml INCHANGÉS ci-dessous ──────────

    private String buildPDCAHtml(String nom, String ref, Double qk,
                                 String planifier, String do_, String check, String act,
                                 String lienValider, String lienEnCours) {
        return """
        <!DOCTYPE html>
        <html lang="fr">
        <head><meta charset="UTF-8"/></head>
        <body style="margin:0;padding:0;background:#F1F5F9;font-family:'Segoe UI',Arial,sans-serif;">
          <table width="100%%" cellpadding="0" cellspacing="0" style="background:#F1F5F9;padding:40px 16px;">
            <tr><td align="center">
              <table width="580" cellpadding="0" cellspacing="0"
                     style="max-width:580px;width:100%%;background:#ffffff;border-radius:12px;
                            overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.10);">
                <tr>
                  <td style="background:#001F4E;padding:22px 32px;">
                    <table cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="background:#C8982A;border-radius:7px;width:36px;height:36px;
                                   text-align:center;vertical-align:middle;">
                          <span style="font-size:18px;font-weight:900;color:#001F4E;line-height:36px;">L</span>
                        </td>
                        <td style="padding-left:12px;vertical-align:middle;">
                          <p style="margin:0;font-size:15px;font-weight:800;color:#fff;">LEONI PAP</p>
                          <p style="margin:0;font-size:10px;color:rgba(255,255,255,0.5);letter-spacing:0.1em;">
                            QUALITY AUDIT PLATFORM
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr><td style="background:#9D174D;height:4px;font-size:0;">&nbsp;</td></tr>
                <tr>
                  <td style="padding:32px;">
                    <p style="margin:0 0 6px;font-size:11px;font-weight:700;color:#94A3B8;
                               text-transform:uppercase;letter-spacing:0.1em;">Plan d'action PDCA</p>
                    <h1 style="margin:0 0 6px;font-size:20px;font-weight:800;color:#0B1E3D;">
                      PDCA à traiter — Audit %s
                    </h1>
                    <p style="margin:0 0 24px;font-size:13px;color:#64748B;">
                      Bonjour <strong>%s</strong>, un plan d'action corrective (PDCA) vous a été assigné.
                      QK = <strong>%.2f</strong>
                    </p>
                    <table cellpadding="0" cellspacing="0" width="100%%"
                           style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:10px;
                                  margin-bottom:24px;">
                      %s
                      %s
                      %s
                      %s
                    </table>
                    <p style="margin:0 0 14px;font-size:13px;color:#475569;font-weight:600;">
                      Merci de répondre en cliquant sur l'un des boutons ci-dessous :
                    </p>
                    <table cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding-right:12px;">
                          <a href="%s"
                             style="display:inline-block;background:#00ad57;color:#fff;
                                    text-decoration:none;font-size:14px;font-weight:700;
                                    padding:14px 28px;border-radius:9px;">
                            Valider — PDCA résolu
                          </a>
                        </td>
                        <td>
                          <a href="%s"
                             style="display:inline-block;background:#9D174D;color:#fff;
                                    text-decoration:none;font-size:14px;font-weight:700;
                                    padding:14px 28px;border-radius:9px;">
                            En cours de traitement
                          </a>
                        </td>
                      </tr>
                    </table>
                    <p style="margin:20px 0 0;font-size:11px;color:#94A3B8;line-height:1.6;">
                      Si vous cliquez sur "En cours", vous recevrez une relance automatique
                      dans <strong>3 jours</strong> si le PDCA n'a pas encore été validé.
                    </p>
                  </td>
                </tr>
                <tr>
                  <td style="background:#F8FAFC;border-top:1px solid #E2E8F0;
                             padding:16px 32px;text-align:center;">
                    <p style="margin:0;font-size:11px;color:#CBD5E1;">
                      © 2026 LEONI PAP — Email automatique, merci de ne pas y répondre.
                    </p>
                  </td>
                </tr>
              </table>
            </td></tr>
          </table>
        </body>
        </html>
        """.formatted(
                ref,
                nom, qk,
                buildPDCASection("P — Plan",  planifier, "#0057B8", "#E8F0FB"),
                buildPDCASection("D — Do",    do_,       "#00875A", "#E6F5EE"),
                buildPDCASection("C — Check", check,     "#7C3AED", "#EDE9FE"),
                buildPDCASection("A — Act",   act,       "#C8982A", "#FFF4D6"),
                lienValider,
                lienEnCours
        );
    }

    public void envoyerPDCAEmail(String email,
                                 String nomDestinataire,
                                 String auditReference,
                                 Double valeurQK,
                                 String planifier,
                                 String do_,
                                 String check,
                                 String act,
                                 String lienValider,
                                 String lienEnCours) {
        try {
            MimeMessage mimeMessage = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, "UTF-8");
            helper.setFrom(fromEmail, "Leoni PAP — Quality Audit Platform");
            helper.setTo(email);
            helper.setSubject("Plan d'action PDCA — Audit " + auditReference + " [QK=" + valeurQK + "]");
            helper.setText(buildPDCAHtml(
                    nomDestinataire, auditReference, valeurQK,
                    safe(planifier), safe(do_), safe(check), safe(act),
                    lienValider, lienEnCours), true);
            mailSender.send(mimeMessage);
        } catch (Exception e) {
            System.err.println("[EMAIL] Échec PDCA → " + email + " : " + e.getMessage());
        }
    }
// ═══════════════════════════════════════════════════════════
// AUDIT EXPORT — EMAIL RESPONSABLE MAGASIN (EXTERNE)
// ═══════════════════════════════════════════════════════════

    /**
     * Email envoyé au responsable magasin externe quand il y a
     * des non-conformités dans l'audit export.
     * Contient l'annexe des critères + 2 boutons tokenisés.
     */
    public void envoyerAuditExportEmail(String email,
                                        String nomDestinataire,
                                        String auditReference,
                                        int resultat,
                                        String criteresHtml,
                                        String remarques,
                                        String lienValider,
                                        String lienEnCours) {
        try {
            MimeMessage mimeMessage = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, "UTF-8");
            helper.setFrom(fromEmail, "Leoni PAP — Quality Audit Platform");
            helper.setTo(email);
            helper.setSubject("Audit Magasin Export — Non-conformité détectée [" + auditReference + "]");
            helper.setText(buildAuditExportHtml(
                    nomDestinataire, auditReference, resultat,
                    criteresHtml, safe(remarques),
                    lienValider, lienEnCours), true);
            mailSender.send(mimeMessage);
            System.out.println("[EMAIL] Audit export envoyé → " + email);
        } catch (Exception e) {
            System.err.println("[EMAIL] Échec audit export → " + email + " : " + e.getMessage());
        }
    }

    private String buildAuditExportHtml(String nom,
                                        String ref,
                                        int resultat,
                                        String criteresHtml,
                                        String remarques,
                                        String lienValider,
                                        String lienEnCours) {
        String scoreColor  = resultat >= 80 ? "#059669" : resultat >= 60 ? "#D97706" : "#DC2626";
        String scoreBg     = resultat >= 80 ? "#ECFDF5" : resultat >= 60 ? "#FFFBEB" : "#FEF2F2";
        String scoreBd     = resultat >= 80 ? "#A7F3D0" : resultat >= 60 ? "#FCD34D" : "#FECACA";
        String scoreLabel  = resultat >= 80 ? "Audit conforme" : resultat >= 60 ? "Non-conformités mineures" : "Non-conformités critiques";

        return """
    <!DOCTYPE html>
    <html lang="fr">
    <head><meta charset="UTF-8"/>
    <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
    </head>
    <body style="margin:0;padding:0;background:#EEF2F8;
                 font-family:'Segoe UI',Helvetica,Arial,sans-serif;">
      <table width="100%%" cellpadding="0" cellspacing="0"
             style="background:#EEF2F8;padding:48px 16px;">
        <tr><td align="center">
          <table width="700" cellpadding="0" cellspacing="0"
                 style="max-width:700px;width:100%%;background:#ffffff;
                        border-radius:14px;overflow:hidden;
                        box-shadow:0 8px 40px rgba(0,20,60,0.13);">

            <!-- HEADER -->
            <tr>
              <td style="background:#001F4E;padding:26px 40px;">
                <table cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="background:#C8982A;border-radius:8px;
                               width:40px;height:40px;text-align:center;
                               vertical-align:middle;">
                      <span style="font-size:20px;font-weight:900;
                                   color:#001F4E;line-height:40px;">L</span>
                    </td>
                    <td style="padding-left:14px;vertical-align:middle;">
                      <p style="margin:0;font-size:16px;font-weight:800;
                                color:#ffffff;">LEONI PAP</p>
                      <p style="margin:0;font-size:10px;letter-spacing:0.12em;
                                color:rgba(255,255,255,0.45);text-transform:uppercase;">
                        Quality Audit Platform
                      </p>
                    </td>
                    <td style="text-align:right;vertical-align:middle;padding-left:40px;">
                      <span style="display:inline-block;background:rgba(124,58,237,0.18);
                                   color:#A78BFA;font-size:11px;font-weight:700;
                                   padding:5px 14px;border-radius:99px;
                                   letter-spacing:0.06em;text-transform:uppercase;
                                   border:1px solid rgba(124,58,237,0.35);">
                        Audit Magasin Export
                      </span>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- BANDE COULEUR -->
            <tr><td style="background:%s;height:4px;font-size:0;">&nbsp;</td></tr>

            <!-- CORPS -->
            <tr>
              <td style="padding:40px;">
                <p style="margin:0 0 4px;font-size:11px;font-weight:700;
                           color:#94A3B8;text-transform:uppercase;letter-spacing:0.1em;">Référence</p>
                <h1 style="margin:0 0 8px;font-size:22px;font-weight:800;color:#0B1E3D;">
                  Audit %s — Validation requise
                </h1>
                <p style="margin:0 0 32px;font-size:14px;color:#64748B;line-height:1.7;">
                  Bonjour <strong style="color:#0B1E3D;">%s</strong>,<br/>
                  Une non-conformité a été détectée lors de l'audit du magasin export.
                  Merci d'examiner les résultats ci-dessous et d'indiquer l'état de traitement.
                </p>

                <!-- Badge score -->
                <table cellpadding="0" cellspacing="0" width="100%%"
                       style="background:%s;border:1.5px solid %s;
                              border-radius:10px;margin-bottom:28px;">
                  <tr>
                    <td style="padding:14px 20px;">
                      <table cellpadding="0" cellspacing="0" width="100%%">
                        <tr>
                          <td>
                            <p style="margin:0 0 2px;font-size:10px;font-weight:700;
                                       color:%s;text-transform:uppercase;letter-spacing:0.09em;">
                              Score de conformité
                            </p>
                            <p style="margin:0;font-size:15px;font-weight:800;color:%s;">%s</p>
                          </td>
                          <td align="right">
                            <span style="display:inline-block;background:%s;
                                         color:#ffffff;font-size:22px;font-weight:900;
                                         padding:6px 18px;border-radius:8px;">
                              %d%%
                            </span>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>

                <!-- Annexe critères -->
                <p style="margin:0 0 12px;font-size:12px;font-weight:700;
                           color:#94A3B8;text-transform:uppercase;letter-spacing:0.08em;">
                  Détail des critères évalués
                </p>
                %s

                <!-- Remarques -->
                %s

                <!-- Séparateur -->
                <div style="height:1px;background:#F1F5F9;margin:28px 0;"></div>

                <!-- Instructions -->
                <p style="margin:0 0 20px;font-size:13px;color:#475569;
                          line-height:1.7;font-weight:500;">
                  Veuillez indiquer l'état d'avancement en cliquant sur l'un des boutons :
                </p>

                <!-- Boutons -->
                <table cellpadding="0" cellspacing="0" width="100%%"
                       style="margin-bottom:28px;">
                  <tr>
                    <td width="50%%" style="padding-right:8px;">
                      <a href="%s"
                         style="display:block;background:#059669;color:#ffffff;
                                text-decoration:none;font-size:13px;font-weight:700;
                                padding:15px 20px;border-radius:9px;text-align:center;">
                        ✓ Valider — Problème résolu
                      </a>
                    </td>
                    <td width="50%%" style="padding-left:8px;">
                      <a href="%s"
                         style="display:block;background:#7C3AED;color:#ffffff;
                                text-decoration:none;font-size:13px;font-weight:700;
                                padding:15px 20px;border-radius:9px;text-align:center;">
                        ⏳ En cours de traitement
                      </a>
                    </td>
                  </tr>
                </table>

                <!-- Note relance -->
                <table cellpadding="0" cellspacing="0" width="100%%"
                       style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:8px;">
                  <tr>
                    <td style="padding:12px 18px;">
                      <p style="margin:0;font-size:12px;color:#64748B;line-height:1.7;">
                        En cliquant sur <strong>En cours de traitement</strong>, vous
                        recevrez une relance automatique dans <strong>3 jours</strong>
                        si l'audit n'a pas encore été validé.
                        Ces liens sont à usage unique et sécurisés.
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- FOOTER -->
            <tr>
              <td style="background:#F8FAFC;border-top:1px solid #E2E8F0;padding:20px 40px;">
                <table cellpadding="0" cellspacing="0" width="100%%">
                  <tr>
                    <td>
                      <p style="margin:0;font-size:12px;color:#0B1E3D;font-weight:700;">
                        LEONI PAP — Quality Audit Platform
                      </p>
                      <p style="margin:4px 0 0;font-size:11px;color:#94A3B8;">
                        Cet email est généré automatiquement — merci de ne pas y répondre.
                      </p>
                    </td>
                    <td align="right">
                      <span style="font-size:10px;color:#CBD5E1;">© 2026 LEONI</span>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

          </table>
        </td></tr>
      </table>
    </body>
    </html>
    """.formatted(
                scoreColor,                          // bande top
                ref,                                 // h1 référence
                nom,                                 // bonjour
                scoreBg, scoreBd,                    // badge bg/bd
                scoreColor, scoreColor, scoreLabel,  // badge texte
                scoreColor, resultat,                // badge score %
                criteresHtml,                        // tableau critères
                "—".equals(remarques) ? "" :
                        "<table cellpadding='0' cellspacing='0' width='100%' style='background:#F8FAFC;border:1px solid #E2E8F0;border-radius:10px;margin-bottom:28px;'>" +
                                "<tr><td style='padding:14px 22px;'>" +
                                "<p style='margin:0 0 5px;font-size:10px;font-weight:700;color:#94A3B8;text-transform:uppercase;letter-spacing:.09em;'>Remarques</p>" +
                                "<p style='margin:0;font-size:14px;color:#0B1E3D;font-weight:600;line-height:1.6;'>" + remarques + "</p>" +
                                "</td></tr></table>",
                lienValider,
                lienEnCours
        );
    }

// ═══════════════════════════════════════════════════════════
// PDCA RÈGLE PLATE — EMAIL EXTERNE
// ═══════════════════════════════════════════════════════════
    /**
     * Envoie le rapport PDF d'un audit spécial (Règle Plate ou Magasin Export)
     * à une liste de destinataires — envoi informatif simple, sans token de validation.
     */
    public void envoyerRapportAuditSpecialMultiEmail(
            List<String> emails,
            String typeAudit,
            String reference,
            String datePrevue,
            String nomAuditeur,
            String nomPlant,
            byte[] pdfBytes) {

        if (emails == null || emails.isEmpty() || pdfBytes == null) return;

        String subject = "[LEONI PAP] Rapport d'audit " + typeAudit + " — " + reference;

        String htmlBody = """
    <!DOCTYPE html>
    <html lang="fr">
    <head><meta charset="UTF-8"/></head>
    <body style="font-family:'Segoe UI',Arial,sans-serif;background:#F1F5F9;margin:0;padding:24px;">
      <div style="max-width:580px;margin:0 auto;background:#fff;border-radius:14px;
                  box-shadow:0 4px 24px rgba(0,30,80,.10);overflow:hidden;">
        <div style="background:linear-gradient(135deg,#0B1E3D,#1D4ED8);padding:28px 32px;">
          <div style="color:#fff;font-size:1.2rem;font-weight:800;">LEONI PAP</div>
          <div style="color:rgba(255,255,255,.75);font-size:.85rem;margin-top:4px;">
            Rapport d'audit %s
          </div>
        </div>
        <div style="padding:28px 32px;">
          <p style="color:#1E293B;font-size:.95rem;margin:0 0 20px;">Bonjour,</p>
          <p style="color:#475569;font-size:.9rem;line-height:1.6;margin:0 0 24px;">
            Veuillez trouver ci-joint le rapport de l'audit <strong>%s</strong>
            réalisé le <strong>%s</strong> par <strong>%s</strong>
            sur le plant <strong>%s</strong>.
          </p>
          <div style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:10px;
                      padding:16px 20px;margin-bottom:24px;">
            <div style="font-size:.75rem;font-weight:700;color:#94A3B8;
                        text-transform:uppercase;letter-spacing:.06em;margin-bottom:10px;">
              Détails de l'audit
            </div>
            <table style="width:100%%;border-collapse:collapse;font-size:.85rem;">
              <tr>
                <td style="padding:5px 0;color:#64748B;width:140px;">Type</td>
                <td style="padding:5px 0;color:#1E293B;font-weight:600;">%s</td>
              </tr>
              <tr>
                <td style="padding:5px 0;color:#64748B;">Référence</td>
                <td style="padding:5px 0;color:#1E293B;font-weight:600;">%s</td>
              </tr>
              <tr>
                <td style="padding:5px 0;color:#64748B;">Auditeur</td>
                <td style="padding:5px 0;color:#1E293B;font-weight:600;">%s</td>
              </tr>
              <tr>
                <td style="padding:5px 0;color:#64748B;">Plant</td>
                <td style="padding:5px 0;color:#1E293B;font-weight:600;">%s</td>
              </tr>
              <tr>
                <td style="padding:5px 0;color:#64748B;">Date</td>
                <td style="padding:5px 0;color:#1E293B;font-weight:600;">%s</td>
              </tr>
            </table>
          </div>
          <p style="color:#94A3B8;font-size:.8rem;margin:0;">
            Ce message est généré automatiquement par LEONI PAP.
          </p>
        </div>
        <div style="background:#F8FAFC;border-top:1px solid #E2E8F0;
                    padding:14px 32px;text-align:center;">
          <span style="font-size:.75rem;color:#94A3B8;">
            LEONI Tunisie — Quality Audit Platform
          </span>
        </div>
      </div>
    </body>
    </html>
    """.formatted(
                typeAudit, reference, datePrevue, nomAuditeur, nomPlant,
                typeAudit, reference, nomAuditeur, nomPlant, datePrevue
        );

        for (String email : emails) {
            if (email == null || email.isBlank()) continue;
            try {
                MimeMessage message = mailSender.createMimeMessage();
                MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

                // ⚠️ AJOUTEZ CETTE LIGNE (c'est ce qui manque !)
                helper.setFrom(fromEmail, "LEONI PAP — Quality Audit Platform");

                helper.setTo(email.trim());
                helper.setSubject(subject);
                helper.setText(htmlBody, true);
                helper.addAttachment(
                        "rapport_" + reference.replaceAll("[^a-zA-Z0-9_-]", "_") + ".pdf",
                        new ByteArrayResource(pdfBytes),
                        "application/pdf"
                );
                mailSender.send(message);
                System.out.println("[EMAIL] Rapport envoyé à " + email);
            } catch (Exception e) {
                System.err.println("[EMAIL] Erreur envoi rapport audit à " + email + " : " + e.getMessage());
                e.printStackTrace();
            }
        }
    }
    /**
     * Email PDCA pour audit règle plate vers un destinataire externe.
     * Contient la liste des non-conformités avec détails de chaque instrument.
     */
    public void envoyerPDCAReglePlateEmail(String email,
                                           String nomDestinataire,
                                           String auditReference,
                                           String nonConformitesHtml,
                                           String remarques,
                                           String lienValider,
                                           String lienEnCours) {
        try {
            MimeMessage mimeMessage = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, "UTF-8");
            helper.setFrom(fromEmail, "Leoni PAP — Quality Audit Platform");
            helper.setTo(email);
            helper.setSubject("PDCA Règle Plate — Non-conformité [" + auditReference + "]");
            helper.setText(buildPDCAReglePlateHtml(
                    nomDestinataire, auditReference,
                    nonConformitesHtml, safe(remarques),
                    lienValider, lienEnCours), true);
            mailSender.send(mimeMessage);
            System.out.println("[EMAIL] PDCA règle plate → " + email);
        } catch (Exception e) {
            System.err.println("[EMAIL] Échec PDCA règle plate → " + email + " : " + e.getMessage());
        }
    }

    private String buildPDCAReglePlateHtml(String nom,
                                           String ref,
                                           String nonConformitesHtml,
                                           String remarques,
                                           String lienValider,
                                           String lienEnCours) {
        return """
    <!DOCTYPE html>
    <html lang="fr">
    <head><meta charset="UTF-8"/>
    <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
    </head>
    <body style="margin:0;padding:0;background:#EEF2F8;
                 font-family:'Segoe UI',Helvetica,Arial,sans-serif;">
      <table width="100%%" cellpadding="0" cellspacing="0"
             style="background:#EEF2F8;padding:48px 16px;">
        <tr><td align="center">
          <table width="700" cellpadding="0" cellspacing="0"
                 style="max-width:700px;width:100%%;background:#ffffff;
                        border-radius:14px;overflow:hidden;
                        box-shadow:0 8px 40px rgba(0,20,60,0.13);">

            <!-- HEADER -->
            <tr>
              <td style="background:#001F4E;padding:26px 40px;">
                <table cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="background:#C8982A;border-radius:8px;
                               width:40px;height:40px;text-align:center;
                               vertical-align:middle;">
                      <span style="font-size:20px;font-weight:900;
                                   color:#001F4E;line-height:40px;">L</span>
                    </td>
                    <td style="padding-left:14px;vertical-align:middle;">
                      <p style="margin:0;font-size:16px;font-weight:800;color:#ffffff;">LEONI PAP</p>
                      <p style="margin:0;font-size:10px;letter-spacing:0.12em;
                                color:rgba(255,255,255,0.45);text-transform:uppercase;">
                        Quality Audit Platform
                      </p>
                    </td>
                    <td style="text-align:right;vertical-align:middle;padding-left:40px;">
                      <span style="display:inline-block;background:rgba(220,38,38,0.18);
                                   color:#FCA5A5;font-size:11px;font-weight:700;
                                   padding:5px 14px;border-radius:99px;
                                   letter-spacing:0.06em;text-transform:uppercase;
                                   border:1px solid rgba(220,38,38,0.35);">
                        PDCA — Règle Plate
                      </span>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr><td style="background:#DC2626;height:4px;font-size:0;">&nbsp;</td></tr>

            <!-- CORPS -->
            <tr>
              <td style="padding:40px;">
                <p style="margin:0 0 4px;font-size:11px;font-weight:700;
                           color:#94A3B8;text-transform:uppercase;letter-spacing:0.1em;">
                  Plan d'action corrective
                </p>
                <h1 style="margin:0 0 8px;font-size:22px;font-weight:800;color:#0B1E3D;">
                  Audit %s — Action corrective requise
                </h1>
                <p style="margin:0 0 28px;font-size:14px;color:#64748B;line-height:1.7;">
                  Bonjour <strong style="color:#0B1E3D;">%s</strong>,<br/>
                  Des non-conformités ont été relevées lors du contrôle des règles plates
                  et mètres ruban. Merci de traiter les points suivants dans les meilleurs délais.
                </p>

                <!-- Alerte NC -->
                <table cellpadding="0" cellspacing="0" width="100%%"
                       style="background:#FEF2F2;border:1.5px solid #FECACA;
                              border-radius:10px;margin-bottom:24px;">
                  <tr>
                    <td style="padding:14px 20px;display:flex;align-items:center;gap:12px;">
                      <p style="margin:0;font-size:13px;font-weight:700;color:#DC2626;">
                        ⚠ Non-conformités détectées — intervention requise
                      </p>
                    </td>
                  </tr>
                </table>

                <!-- Tableau NC -->
                <p style="margin:0 0 10px;font-size:12px;font-weight:700;
                           color:#94A3B8;text-transform:uppercase;letter-spacing:0.08em;">
                  Détail des non-conformités
                </p>
                %s

                <!-- Remarques -->
                %s

                <!-- Séparateur -->
                <div style="height:1px;background:#F1F5F9;margin:28px 0;"></div>

                <p style="margin:0 0 20px;font-size:13px;color:#475569;
                          line-height:1.7;font-weight:500;">
                  Veuillez indiquer l'état d'avancement :
                </p>

                <!-- Boutons -->
                <table cellpadding="0" cellspacing="0" width="100%%"
                       style="margin-bottom:28px;">
                  <tr>
                    <td width="50%%" style="padding-right:8px;">
                      <a href="%s"
                         style="display:block;background:#059669;color:#ffffff;
                                text-decoration:none;font-size:13px;font-weight:700;
                                padding:15px 20px;border-radius:9px;text-align:center;">
                        ✓ Valider — Non-conformité corrigée
                      </a>
                    </td>
                    <td width="50%%" style="padding-left:8px;">
                      <a href="%s"
                         style="display:block;background:#D97706;color:#ffffff;
                                text-decoration:none;font-size:13px;font-weight:700;
                                padding:15px 20px;border-radius:9px;text-align:center;">
                        ⏳ En cours de traitement
                      </a>
                    </td>
                  </tr>
                </table>

                <!-- Note -->
                <table cellpadding="0" cellspacing="0" width="100%%"
                       style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:8px;">
                  <tr>
                    <td style="padding:12px 18px;">
                      <p style="margin:0;font-size:12px;color:#64748B;line-height:1.7;">
                        En cliquant sur <strong>En cours de traitement</strong>, une relance
                        automatique sera envoyée dans <strong>3 jours</strong> si aucune
                        action n'a été confirmée. Ces liens sont à usage unique et sécurisés.
                      </p>
                    </td>
                  </tr>
                </table>

              </td>
            </tr>

            <!-- FOOTER -->
            <tr>
              <td style="background:#F8FAFC;border-top:1px solid #E2E8F0;padding:20px 40px;">
                <table cellpadding="0" cellspacing="0" width="100%%">
                  <tr>
                    <td>
                      <p style="margin:0;font-size:12px;color:#0B1E3D;font-weight:700;">
                        LEONI PAP — Quality Audit Platform
                      </p>
                      <p style="margin:4px 0 0;font-size:11px;color:#94A3B8;">
                        Email automatique — merci de ne pas y répondre.
                      </p>
                    </td>
                    <td align="right">
                      <span style="font-size:10px;color:#CBD5E1;">© 2026 LEONI</span>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

          </table>
        </td></tr>
      </table>
    </body>
    </html>
    """.formatted(
                ref, nom,
                nonConformitesHtml,
                "—".equals(remarques) ? "" :
                        "<table cellpadding='0' cellspacing='0' width='100%' style='background:#F8FAFC;" +
                                "border:1px solid #E2E8F0;border-radius:10px;margin-bottom:24px;'>" +
                                "<tr><td style='padding:14px 22px;'>" +
                                "<p style='margin:0 0 5px;font-size:10px;font-weight:700;color:#94A3B8;" +
                                "text-transform:uppercase;letter-spacing:.09em;'>Remarques</p>" +
                                "<p style='margin:0;font-size:14px;color:#0B1E3D;font-weight:600;line-height:1.6;'>"
                                + remarques + "</p></td></tr></table>",
                lienValider, lienEnCours
        );
    }

    /**
     * Construit le HTML du tableau des non-conformités pour l'email PDCA règle plate.
     * Appelé par AuditSpecialService.
     */
    public static String buildNonConformitesTableHtml(
            java.util.List<CreerPDCAReglePlateRequest.NonConformiteItem> items) {
        if (items == null || items.isEmpty()) return "";
        StringBuilder sb = new StringBuilder();
        sb.append("<table cellpadding='0' cellspacing='0' width='100%' style='" +
                "border:1px solid #E2E8F0;border-radius:10px;overflow:hidden;margin-bottom:24px;'>");
        sb.append("<thead><tr style='background:linear-gradient(135deg,#0B1E3D,#DC2626);'>");
        for (String h : new String[]{"N° Instrument","Type","Emplacement","Date","Contrôleur","Résultat","Remarques"}) {
            sb.append("<th style='padding:9px 10px;text-align:left;color:#fff;font-size:11px;")
                    .append("font-weight:700;white-space:nowrap;'>").append(h).append("</th>");
        }
        sb.append("</tr></thead><tbody>");
        for (int i = 0; i < items.size(); i++) {
            var nc = items.get(i);
            String rowBg = i % 2 == 0 ? "#ffffff" : "#F8FAFC";
            sb.append("<tr style='background:").append(rowBg)
                    .append(";border-bottom:1px solid #E2E8F0;'>");
            sb.append(tdNC(nc.getNumeroInstrument(), false));
            sb.append(tdNC(nc.getTypeInstrument() != null
                    ? nc.getTypeInstrument().replace("_"," ") : "—", false));
            sb.append(tdNC(nc.getEmplacement(), false));
            sb.append(tdNC(nc.getDateControle(), false));
            sb.append(tdNC(nc.getNomControleur(), false));
            // Résultat coloré
            boolean isNC = "non conforme".equalsIgnoreCase(nc.getResultat());
            sb.append("<td style='padding:8px 10px;'><span style='background:")
                    .append(isNC ? "#FEF2F2" : "#ECFDF5")
                    .append(";color:").append(isNC ? "#DC2626" : "#059669")
                    .append(";font-size:11px;font-weight:700;padding:3px 10px;border-radius:99px;")
                    .append("border:1px solid ").append(isNC ? "#FECACA" : "#A7F3D0").append(";'>")
                    .append(isNC ? "Non conforme" : "Conforme").append("</span></td>");
            sb.append(tdNC(nc.getRemarques(), false));
            sb.append("</tr>");
        }
        sb.append("</tbody></table>");
        return sb.toString();
    }

    private static String tdNC(String val, boolean bold) {
        return "<td style='padding:8px 10px;font-size:12px;color:#0B1E3D;" +
                (bold ? "font-weight:700;" : "") + "'>" +
                (val != null && !val.isBlank() ? val : "—") + "</td>";
    }

    /**
     * Construit le HTML du tableau des critères export pour l'email.
     * criteresJson : JSON de la forme {"criteres":[...],"scores":{...}}
     */
    public static String buildCriteresExportTableHtml(String criteresJson, String scoresJson) {
        // Version simplifiée — le service passe directement le HTML pré-construit
        // Cette méthode est un helper statique si besoin d'un parsing JSON ici.
        // Dans AuditSpecialService on construit le HTML directement.
        return criteresJson != null ? criteresJson : "";
    }
    private String buildPDCASection(String label, String content, String color, String bg) {
        if (content == null || content.isBlank() || "—".equals(content)) return "";
        return """
            <tr>
              <td style="padding:14px 18px;border-bottom:1px solid #E2E8F0;background:%s;">
                <p style="margin:0 0 4px;font-size:10px;font-weight:800;color:%s;
                           text-transform:uppercase;letter-spacing:0.08em;">%s</p>
                <p style="margin:0;font-size:14px;color:#0B1E3D;font-weight:500;line-height:1.6;">%s</p>
              </td>
            </tr>
            """.formatted(bg, color, label, content.replace("\n", "<br/>"));
    }

    private String buildNotifHtml(String nomComplet, String titre, String message) {
        return """
        <!DOCTYPE html>
        <html lang="fr">
        <body style="margin:0;padding:0;background:#F1F5F9;font-family:'Segoe UI',Arial,sans-serif;">
          <table width="100%%" cellpadding="0" cellspacing="0" style="background:#F1F5F9;padding:40px 16px;">
            <tr><td align="center">
              <table width="560" cellpadding="0" cellspacing="0"
                     style="max-width:560px;width:100%%;background:#ffffff;
                            border-radius:10px;overflow:hidden;border:0.5px solid #E2E8F0;">
                <tr>
                  <td style="background:#001F4E;padding:20px 32px;">
                    <table cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="background:#C8982A;border-radius:6px;width:34px;height:34px;
                                   text-align:center;vertical-align:middle;">
                          <span style="font-size:15px;font-weight:500;color:#fff;line-height:34px;">L</span>
                        </td>
                        <td style="padding-left:10px;vertical-align:middle;">
                          <p style="margin:0;font-size:14px;font-weight:500;color:#fff;">LEONI PAP</p>
                          <p style="margin:0;font-size:10px;color:rgba(255,255,255,0.45);
                                    text-transform:uppercase;letter-spacing:0.8px;">Quality Audit Platform</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding:32px;">
                    <h2 style="margin:0 0 16px;font-size:18px;font-weight:500;color:#0B1E3D;">%s</h2>
                    <p style="margin:0 0 12px;font-size:14px;color:#64748B;line-height:1.7;">
                      Bonjour <strong style="color:#0B1E3D;">%s</strong>,
                    </p>
                    <p style="margin:0 0 24px;font-size:14px;color:#64748B;line-height:1.7;">%s</p>
                    <p style="margin:0;font-size:13px;color:#64748B;">
                      Cordialement,<br/>
                      <strong style="color:#0B1E3D;">L'équipe LEONI PAP</strong>
                    </p>
                  </td>
                </tr>
                <tr>
                  <td style="background:#F8FAFC;border-top:0.5px solid #E2E8F0;
                             padding:16px 32px;text-align:center;">
                    <p style="margin:0;font-size:11px;color:#CBD5E1;">
                      © 2026 LEONI PAP — Email automatique, merci de ne pas y répondre.
                    </p>
                  </td>
                </tr>
              </table>
            </td></tr>
          </table>
        </body>
        </html>
        """.formatted(titre, nomComplet, message.replace("\n", "<br/>"));
    }

    private String buildEmailHtml(String matricule, String roleLabel, String lienInscription) {
        return """
        <!DOCTYPE html>
        <html lang="fr">
        <head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/></head>
        <body style="margin:0;padding:0;background:#F1F5F9;font-family:'Segoe UI',Arial,sans-serif;">
          <table width="100%%" cellpadding="0" cellspacing="0" style="background:#F1F5F9;padding:40px 16px;">
            <tr><td align="center">
              <table width="560" cellpadding="0" cellspacing="0"
                     style="max-width:560px;width:100%%;background:#ffffff;border-radius:10px;
                            overflow:hidden;box-shadow:0 2px 16px rgba(0,0,0,0.08);">
                <tr>
                  <td style="background:#0B1E3D;padding:24px 32px;">
                    <table cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="background:#C9A84C;border-radius:8px;width:38px;height:38px;
                                   text-align:center;vertical-align:middle;">
                          <span style="font-size:20px;font-weight:900;color:#0B1E3D;line-height:38px;">L</span>
                        </td>
                        <td style="padding-left:12px;vertical-align:middle;">
                          <p style="margin:0;font-size:15px;font-weight:800;color:#ffffff;">LEONI PAP</p>
                          <p style="margin:0;font-size:10px;color:rgba(255,255,255,0.5);letter-spacing:0.1em;">
                            QUALITY AUDIT PLATFORM
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr><td style="background:#C9A84C;height:3px;font-size:0;line-height:0;">&nbsp;</td></tr>
                <tr>
                  <td style="padding:36px 32px;">
                    <p style="margin:0 0 6px;font-size:11px;font-weight:700;color:#94A3B8;
                              text-transform:uppercase;letter-spacing:0.1em;">Invitation à la plateforme</p>
                    <h1 style="margin:0 0 20px;font-size:20px;font-weight:800;color:#0B1E3D;">
                      Votre compte a été créé
                    </h1>
                    <p style="margin:0 0 24px;font-size:14px;color:#475569;line-height:1.7;">
                      Bonjour,<br/><br/>
                      Un administrateur a créé votre compte sur
                      <strong style="color:#0B1E3D;">LEONI PAP</strong>.
                      Cliquez sur le bouton ci-dessous pour finaliser votre inscription.
                    </p>
                    <table cellpadding="0" cellspacing="0" width="100%%"
                           style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:8px;margin-bottom:24px;">
                      <tr>
                        <td style="padding:14px 18px;border-bottom:1px solid #E2E8F0;">
                          <table width="100%%" cellpadding="0" cellspacing="0">
                            <tr>
                              <td style="font-size:13px;color:#64748B;font-weight:600;">Matricule</td>
                              <td align="right">
                                <code style="background:#0B1E3D;color:#93C5FD;font-size:13px;font-weight:700;
                                             padding:3px 12px;border-radius:6px;">%s</code>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:14px 18px;">
                          <table width="100%%" cellpadding="0" cellspacing="0">
                            <tr>
                              <td style="font-size:13px;color:#64748B;font-weight:600;">Rôle assigné</td>
                              <td align="right">
                                <span style="background:#FEF3C7;color:#92400E;font-size:12px;font-weight:700;
                                             padding:3px 12px;border-radius:99px;">%s</span>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                    <div style="text-align:center;margin-bottom:24px;">
                      <a href="%s"
                         style="display:inline-block;background:#0B1E3D;color:#ffffff;
                                text-decoration:none;font-size:14px;font-weight:700;
                                padding:14px 44px;border-radius:8px;">
                        S'inscrire sur la plateforme →
                      </a>
                      <p style="margin:10px 0 0;font-size:11px;color:#94A3B8;">
                        Matricule et email pré-remplis automatiquement
                      </p>
                    </div>
                    <p style="margin:0;font-size:13px;color:#64748B;line-height:1.7;
                              border-top:1px solid #F1F5F9;padding-top:20px;">
                      Cordialement,<br/>
                      <strong style="color:#0B1E3D;">L'équipe LEONI PAP</strong>
                    </p>
                  </td>
                </tr>
                <tr>
                  <td style="background:#F8FAFC;border-top:1px solid #E2E8F0;
                             padding:16px 32px;text-align:center;">
                    <p style="margin:0;font-size:11px;color:#708090;line-height:1.6;">
                      © 2025 LEONI PAP — Cet email est automatique, merci de ne pas y répondre.
                    </p>
                  </td>
                </tr>
              </table>
            </td></tr>
          </table>
        </body>
        </html>
        """.formatted(matricule, roleLabel, lienInscription);
    }

    private String safe(String s) {
        return (s != null && !s.isBlank()) ? s : "—";
    }
}























