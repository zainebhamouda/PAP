package com.leoni.pap.entity.enums;

public enum TypeNotification {

    // ── CERTIFICATION ────────────────────────────────────────
    CERTIF_TEST_REUSSI,         // auditeur a réussi le test théorique
    CERTIF_TEST_ECHOUE,         // auditeur a échoué au test théorique
    CERTIF_BLOQUE,              // auditeur est bloqué 6 mois
    CERTIF_DEBLOQUE,            // auditeur est débloqué
    CERTIF_PRATIQUE_PRET,       // expert a préparé le test pratique
    CERTIF_PRATIQUE_REUSSI,     // test pratique réussi
    CERTIF_PRATIQUE_ECHOUE,     // test pratique échoué
    CERTIF_OBTENUE,             // certification complète obtenue

    // ── ✅ NOUVEAU — Import direct par l'expert (auditeur déjà certifié) ──
    CERTIF_IMPORTEE,            // un expert a importé votre certificat existant


    // ── CERTIFICAT ───────────────────────────────────────────
    CERTIF_A_SIGNER_EXPERT,     // expert doit signer un certificat
    CERTIF_A_SIGNER_CHEF,       // chef doit signer un certificat
    CERTIF_PDF_DISPONIBLE,      // PDF signé disponible pour l'auditeur

    // ── EXPIRATION ───────────────────────────────────────────
    CERTIF_EXPIRE_30J,          // certification expire dans 30 jours
    CERTIF_EXPIRE_7J,           // certification expire dans 7 jours (urgent)
    CERTIF_EXPIREE,             // certification expirée

    // ── COMPTE & ADMIN ───────────────────────────────────────
    COMPTE_ACTIVE,              // compte activé par l'admin
    COMPTE_DESACTIVE,           // compte désactivé
    ROLE_CHANGE,                // rôle modifié

    // ── SYSTÈME ──────────────────────────────────────────────
    SYSTEME,                    // message système générique
    INFORMATION,                // information générale
    ALERTE     ,                 // alerte importante
    // ── AUDITS (Sprint 3) ─────────────────────────────────────
    AUDIT_ASSIGNE,          // auditeur : un audit vous a été assigné
    AUDIT_EN_RETARD,        // audit dépassé sans réalisation
    AUDIT_QK_DEPASSE,       // QK > seuil → action immédiate
    AUDIT_PDCA_REQUIS,      // responsable : PDCA à valider
    AUDIT_TERMINE_NOTIF ,    // audit terminé, rapport disponible
    RAPPEL_DEADLINE,
    ALERTE_QK,

    // ── NOUVEAU : Workflow Certificat Expert→Chef ────────────────────

    /** Chef a validé le certificat → auditeur est CERTIFIÉ */
    CERTIF_VALIDE_CHEF,

    /** Chef a invalidé le certificat → auditeur est BLOQUÉ */
    CERTIF_INVALIDE_CHEF,



    // ── Fiches réparation ────────────────────────────────────────────
    FICHE_REPARATION_CREEE,
    FICHE_REPARATION_VALIDEE_CHEF,
    FICHE_REPARATION_VALIDEE_EXPERT,

    // ── Planification ────────────────────────────────────────────────
    PLANIFICATION_IMPORTEE,
    PLANIFICATION_LANCEE,

    // ── Audit spécial ────────────────────────────────────────────────
    AUDIT_SPECIAL_ASSIGNE,
    AUDIT_EXPORT_VALIDE,
    PLANIFICATION_LANCEE_PAR_AUDITEUR,

    // ── Validation croisée d'annexe entre auditeurs (ex: Annexe 4) ────
    ANNEXE_A_VALIDER_AUDITEUR,   // un auditeur doit valider l'annexe d'un collègue du même plant
    ANNEXE_VALIDEE_AUDITEUR,    // l'annexe envoyée a été validée par l'auditeur désigné
    ANNEXE_REJETEE_AUDITEUR,    // l'annexe envoyée a été rejetée par l'auditeur désigné

}