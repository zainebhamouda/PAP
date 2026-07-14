package com.leoni.pap.entity.enums;

import com.leoni.pap.entity.Historique;

public enum TypeHistorique {

    // ── AUTHENTIFICATION ──────────────────────────────────────
    CONNEXION,                  // l'utilisateur s'est connecté
    DECONNEXION,                // l'utilisateur s'est déconnecté
    INSCRIPTION,                // nouveau compte créé
    MOT_DE_PASSE_CHANGE,        // mot de passe modifié
    COMPTE_ACTIVE,              // admin a activé le compte
    COMPTE_DESACTIVE,           // admin a désactivé le compte

    // ── GESTION UTILISATEURS (Admin) ─────────────────────────
    UTILISATEUR_CREE,           // admin a créé un utilisateur
    UTILISATEUR_MODIFIE,        // admin a modifié un utilisateur
    UTILISATEUR_SUPPRIME,       // admin a supprimé un utilisateur
    ROLE_CHANGE,                // rôle d'un utilisateur changé

    // ── TESTS THÉORIQUES (Expert) ────────────────────────────
    TEST_CREE,                  // expert a créé un nouveau test
    TEST_MODIFIE,               // expert a modifié un test
    TEST_ACTIVE,                // expert a activé un test (désactive l'ancien)
    TEST_DESACTIVE,             // test désactivé (remplacé par un nouveau)
    TEST_SUPPRIME,              // expert a supprimé un test
    QUESTION_AJOUTEE,           // question ajoutée à un test
    QUESTION_MODIFIEE,          // question modifiée
    QUESTION_SUPPRIMEE,         // question supprimée

    // ── SESSIONS EXAMEN (Auditeur) ───────────────────────────
    SESSION_DEMARREE,           // auditeur a démarré une session d'examen
    QUESTION_REPONDUE,          // réponse enregistrée (correcte ou non)
    QUESTION_EXPIREE,           // temps écoulé sur une question
    SESSION_PARTIE1_TERMINEE,   // partie 1 (images) terminée
    SESSION_TERMINEE,           // session complète terminée

    // ── CERTIFICATION ────────────────────────────────────────
    THEORIQUE_REUSSI,           // test théorique réussi (score ≥ 70)
    THEORIQUE_ECHOUE,           // test théorique échoué
    BLOQUE,                     // 2ème échec → bloqué 6 mois
    DEBLOQUE,                   // période de blocage terminée
    CABLAGE_SAISI,              // expert a saisi les défauts du cablage
    RAPPORT_SOUMIS,             // auditeur a soumis son rapport pratique
    PRATIQUE_REUSSI,            // test pratique réussi
    PRATIQUE_ECHOUE,            // test pratique échoué
    CERTIF_SCORE_CALCULE,       // score final calculé

    // ── CERTIFICAT ───────────────────────────────────────────
    CERTIFICAT_GENERE,          // certificat PDF généré
    CERTIFICAT_SIGNE_EXPERT,    // expert a signé
    CERTIFICAT_SIGNE_CHEF,      // chef de service a signé
    CERTIFICAT_ENVOYE,          // PDF envoyé à l'auditeur
    CERTIFICAT_TELECHARGE,      // auditeur a téléchargé son PDF

    // ── EXPIRATION ───────────────────────────────────────────
    EXPIRATION_NOTIF_30J,       // notification d'expiration à 30 jours envoyée
    EXPIRATION_NOTIF_7J,        // notification d'expiration à 7 jours envoyée
    CERTIFICATION_EXPIREE,      // certification marquée expirée
    RECERTIFICATION_DEMARREE,   // nouvel cycle de certification lancé
    // ── AUDITS (Sprint 3) ─────────────────────────────────────
    AUDIT_PLANIFIE,        // chef de service a planifié un audit
    AUDIT_DEMARRE,          // auditeur a démarré l'audit
    AUDIT_TERMINE,          // auditeur a terminé l'audit + saisi résultats
    AUDIT_ANNULE,           // audit annulé par chef ou expert
    AUDIT_PDCA_DECLENCHE,   // PDCA déclenché suite à QK dépassé
    AUDIT_REGLE_PLATE,      // contrôle règles plates réalisé
    AUDIT_MAGASIN_EXPORT ,   // audit magasin export réalisé
    AUDIT_RAPPORT_UPLOADE,
    AUDIT,
    AUDIT_MODIFIE,          // audit modifié par un expert ou un auditeur (champ(s) changé(s))
    AUDIT_REASSIGNE,        // audit réassigné à un autre auditeur du même plant
    PLANIFICATION_LANCEE_PAR_AUDITEUR,



}