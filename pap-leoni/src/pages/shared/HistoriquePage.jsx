// ═══════════════════════════════════════════════════════════════════
// HistoriquePage.jsx — PRO VERSION v3
// Icônes SVG · timeline élégante · design industriel raffiné
// + Vue "Activité de mon plant" (chef de service / expert / responsable)
// + Auteur (acteur), rôle et plant affichés sur chaque entrée
// + Suivi complet des audits (planifié, modifié, réassigné, terminé…)
// + FILTRAGE PAR RÔLE : auditeurs ne voient que leur historique + audits
// + FILTRAGE PAR PLANT : responsable qualité peut filtrer par plant
// ═══════════════════════════════════════════════════════════════════
import { useState, useEffect, useCallback, useMemo } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

// ── Icônes SVG pro (toutes inline) ────────────────────────────────
const IC = {
  clock:    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  trash:    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6M9 6V4h6v2"/></svg>,
  eye:      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>,
  x:        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  search:   <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  filter:   <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>,
  login:    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>,
  logout:   <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
  user:     <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  userPlus: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>,
  userX:    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="17" y1="8" x2="23" y2="14"/><line x1="23" y1="8" x2="17" y2="14"/></svg>,
  edit:     <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  key:      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/></svg>,
  shield:   <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  shieldOff:<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M19.69 14a6.9 6.9 0 0 0 .31-2V5l-8-3-3.16 1.18"/><path d="M4.73 4.73L4 5v7c0 6 8 10 8 10a20.29 20.29 0 0 0 5.62-4.38"/><line x1="1" y1="1" x2="23" y2="23"/></svg>,
  refresh:  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>,
  unlock:   <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/></svg>,
  lock:     <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>,
  clipboard:<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1"/></svg>,
  checkCirc:<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>,
  xCircle:  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>,
  play:     <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>,
  flag:     <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg>,
  file:     <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>,
  award:    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/></svg>,
  alertTri: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
  calendar: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  download: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>,
  tool:     <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>,
  bell:     <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>,
  settings: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>,
  building: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6 22V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v18"/><path d="M2 22h20"/><path d="M9 8h1M14 8h1M9 12h1M14 12h1M9 16h1M14 16h1"/></svg>,
  users:    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
};

// ── Config rôles (badge acteur) ────────────────────────────────────
const ROLE_CFG = {
  ADMIN:                         { label:'Admin',              color:'#6D28D9', bg:'#F5F3FF' },
  EXPERT_PRODUCT_AUDIT:          { label:'Expert',              color:'#C8982A', bg:'#FFFBEB' },
  CHEF_SERVICE:                  { label:'Chef de service',     color:'#0B1E3D', bg:'#EEF2F8' },
  RESPONSABLE_QUALITE_CENTRALE:  { label:'Responsable qualité', color:'#0369A1', bg:'#F0F9FF' },
  AUDITEUR:                      { label:'Auditeur',            color:'#1652AB', bg:'#EFF6FF' },
};
const getRoleCfg = r => ROLE_CFG[r] || { label:r || 'Utilisateur', color:'#64748b', bg:'#F8FAFC' };

// ── Définir quels types d'historique chaque rôle peut voir ──────────
const ROLE_HISTORIQUE_CONFIG = {
  AUDITEUR: {
    canViewPlant: true,   // ← était false : l'auditeur peut maintenant voir "Activité de mon plant"
    canViewAll: false,
    showConnexionsAutres: false,
    showOnlyAuditActions: true,
    allowedGroups: ['audit', 'examen', 'certif'],
    allowedTypes: [
      'AUDIT_PLANIFIE', 'AUDIT_DEMARRE', 'AUDIT_TERMINE', 'AUDIT_MODIFIE',
      'AUDIT_REASSIGNE', 'AUDIT_ANNULE',
      'ANNEXE_ENVOYEE_VALIDATION', 'ANNEXE_VALIDEE_CROISEE', 'ANNEXE_REJETEE_CROISEE',
    ]
  },
  EXPERT_PRODUCT_AUDIT: {
    canViewPlant: true,
    canViewAll: false,
    showConnexionsAutres: false,
    showOnlyAuditActions: true,
    allowedGroups: ['audit', 'admin', 'examen', 'certif'],
    allowedTypes: [
      'AUDIT_PLANIFIE', 'AUDIT_DEMARRE', 'AUDIT_TERMINE', 'AUDIT_MODIFIE',
      'AUDIT_REASSIGNE', 'AUDIT_ANNULE', 'AUDIT_PDCA_DECLENCHE',
      'ANNEXE_ENVOYEE_VALIDATION', 'ANNEXE_VALIDEE_CROISEE', 'ANNEXE_REJETEE_CROISEE',
    ]
  },
  CHEF_SERVICE: {
    canViewPlant: true,
    canViewAll: false,
    showConnexionsAutres: false,
    showOnlyAuditActions: true,
    allowedGroups: ['audit', 'admin', 'certif'],
    allowedTypes: ['AUDIT_PLANIFIE', 'AUDIT_TERMINE', 'AUDIT_MODIFIE', 'AUDIT_REASSIGNE']
  },
  RESPONSABLE_QUALITE_CENTRALE: {
    canViewPlant: true,
    canViewAll: true,
    showConnexionsAutres: false,
    showOnlyAuditActions: false,
    allowedGroups: ['audit', 'admin', 'examen', 'certif', 'expire'],
    allowedTypes: null
  },
  ADMIN: {
    canViewPlant: true,
    canViewAll: true,
    showConnexionsAutres: true,
    showOnlyAuditActions: false,
    allowedGroups: ['audit', 'admin', 'examen', 'certif', 'expire', 'auth'],
    allowedTypes: null
  }
};

// ── Config types avec icônes SVG ───────────────────────────────────
const TYPE_CFG = {
  CONNEXION:                { icon:'login',     color:'#1D4ED8', bg:'#d4ddea', label:'Connexion',           groupe:'auth'   },
  DECONNEXION:              { icon:'logout',    color:'#64748b', bg:'#fbd1d1', label:'Déconnexion',          groupe:'auth'   },
  INSCRIPTION:              { icon:'userPlus',  color:'#0369A1', bg:'#d5eede', label:'Inscription',          groupe:'auth'   },
  MOT_DE_PASSE_CHANGE:      { icon:'key',       color:'#C8982A', bg:'#FFFBEB', label:'Mot de passe',         groupe:'auth'   },
  COMPTE_ACTIVE:            { icon:'unlock',    color:'#16A34A', bg:'#F0FDF4', label:'Compte activé',        groupe:'auth'   },
  COMPTE_DESACTIVE:         { icon:'shieldOff', color:'#64748b', bg:'#F8FAFC', label:'Compte désactivé',     groupe:'auth'   },
  UTILISATEUR_CREE:         { icon:'userPlus',  color:'#6D28D9', bg:'#F5F3FF', label:'Utilisateur créé',     groupe:'admin'  },
  UTILISATEUR_MODIFIE:      { icon:'edit',      color:'#0369A1', bg:'#F0F9FF', label:'Utilisateur modifié',  groupe:'admin'  },
  UTILISATEUR_SUPPRIME:     { icon:'userX',     color:'#B91C1C', bg:'#FEF2F2', label:'Utilisateur supprimé', groupe:'admin'  },
  ROLE_CHANGE:              { icon:'refresh',   color:'#1652AB', bg:'#EFF6FF', label:'Rôle changé',          groupe:'admin'  },
  TEST_CREE:                { icon:'clipboard', color:'#6D28D9', bg:'#F5F3FF', label:'Test créé',            groupe:'test'   },
  TEST_MODIFIE:             { icon:'edit',      color:'#6D28D9', bg:'#F5F3FF', label:'Test modifié',         groupe:'test'   },
  TEST_ACTIVE:              { icon:'play',      color:'#1D4ED8', bg:'#EFF6FF', label:'Test activé',          groupe:'test'   },
  TEST_DESACTIVE:           { icon:'lock',      color:'#64748b', bg:'#F8FAFC', label:'Test désactivé',       groupe:'test'   },
  QUESTION_AJOUTEE:         { icon:'file',      color:'#6D28D9', bg:'#F5F3FF', label:'Question ajoutée',     groupe:'test'   },
  QUESTION_MODIFIEE:        { icon:'edit',      color:'#6D28D9', bg:'#F5F3FF', label:'Question modifiée',    groupe:'test'   },
  SESSION_DEMARREE:         { icon:'play',      color:'#1652AB', bg:'#EFF6FF', label:'Examen démarré',       groupe:'examen' },
  SESSION_TERMINEE:         { icon:'flag',      color:'#0369A1', bg:'#F0F9FF', label:'Examen terminé',       groupe:'examen' },
  SESSION_PARTIE1_TERMINEE: { icon:'checkCirc', color:'#0369A1', bg:'#F0F9FF', label:'Partie 1 terminée',    groupe:'examen' },
  QUESTION_REPONDUE:        { icon:'clipboard', color:'#1652AB', bg:'#EFF6FF', label:'Réponse enregistrée',  groupe:'examen' },
  QUESTION_EXPIREE:         { icon:'alertTri',  color:'#C8982A', bg:'#FFFBEB', label:'Question expirée',     groupe:'examen' },
  THEORIQUE_REUSSI:         { icon:'award',     color:'#0B1E3D', bg:'#F0F5FF', label:'Théorique réussi',     groupe:'certif' },
  THEORIQUE_ECHOUE:         { icon:'xCircle',   color:'#B91C1C', bg:'#FEF2F2', label:'Théorique échoué',     groupe:'certif' },
  BLOQUE:                   { icon:'lock',      color:'#B91C1C', bg:'#FEF2F2', label:'Bloqué',               groupe:'certif' },
  DEBLOQUE:                 { icon:'unlock',    color:'#1D4ED8', bg:'#EFF6FF', label:'Débloqué',             groupe:'certif' },
  RAPPORT_SOUMIS:           { icon:'file',      color:'#0369A1', bg:'#F0F9FF', label:'Rapport soumis',       groupe:'certif' },
  PRATIQUE_REUSSI:          { icon:'award',     color:'#0B1E3D', bg:'#F0F5FF', label:'Pratique réussi',      groupe:'certif' },
  PRATIQUE_ECHOUE:          { icon:'xCircle',   color:'#B91C1C', bg:'#FEF2F2', label:'Pratique échoué',      groupe:'certif' },
  CABLAGE_SAISI:            { icon:'tool',      color:'#C8982A', bg:'#FFFBEB', label:'Câblage saisi',        groupe:'certif' },
  CERTIF_SCORE_CALCULE:     { icon:'checkCirc', color:'#1652AB', bg:'#EFF6FF', label:'Score calculé',        groupe:'certif' },
  CERTIFICAT_GENERE:        { icon:'file',      color:'#C8982A', bg:'#FFFBEB', label:'Certificat généré',    groupe:'certif' },
  CERTIFICAT_SIGNE_EXPERT:  { icon:'edit',      color:'#C8982A', bg:'#FFFBEB', label:'Signé (expert)',       groupe:'certif' },
  CERTIFICAT_SIGNE_CHEF:    { icon:'edit',      color:'#0369A1', bg:'#F0F9FF', label:'Signé (chef)',         groupe:'certif' },
  CERTIFICAT_TELECHARGE:    { icon:'download',  color:'#1D4ED8', bg:'#EFF6FF', label:'Téléchargé',           groupe:'certif' },
  // ── Audits (tout le cycle de vie, tous acteurs) ──────────────────
  AUDIT_PLANIFIE:                     { icon:'calendar',  color:'#0057B8', bg:'#EFF6FF', label:'Audit planifié',        groupe:'audit' },
  PLANIFICATION_LANCEE_PAR_AUDITEUR:  { icon:'calendar',  color:'#0057B8', bg:'#EFF6FF', label:'Planification (auditeur)', groupe:'audit' },
  AUDIT_DEMARRE:                      { icon:'play',      color:'#1652AB', bg:'#EFF6FF', label:'Audit démarré',         groupe:'audit' },
  AUDIT_TERMINE:                      { icon:'checkCirc', color:'#059669', bg:'#ECFDF5', label:'Audit terminé',         groupe:'audit' },
  AUDIT_MODIFIE:                      { icon:'edit',      color:'#C8982A', bg:'#FFFBEB', label:'Audit modifié',         groupe:'audit' },
  AUDIT_REASSIGNE:                    { icon:'refresh',   color:'#6D28D9', bg:'#F5F3FF', label:'Audit réassigné',       groupe:'audit' },
  AUDIT_ANNULE:                       { icon:'xCircle',   color:'#B91C1C', bg:'#FEF2F2', label:'Audit annulé',          groupe:'audit' },
  AUDIT_PDCA_DECLENCHE:               { icon:'alertTri',  color:'#C8982A', bg:'#FFFBEB', label:'PDCA déclenché',        groupe:'audit' },
  AUDIT_REGLE_PLATE:                  { icon:'tool',      color:'#6D28D9', bg:'#F5F3FF', label:'Contrôle règle plate',  groupe:'audit' },
  AUDIT_MAGASIN_EXPORT:               { icon:'file',      color:'#0369A1', bg:'#F0F9FF', label:'Audit magasin export',  groupe:'audit' },
  AUDIT_RAPPORT_UPLOADE:              { icon:'download',  color:'#1D4ED8', bg:'#EFF6FF', label:'Rapport audit uploadé', groupe:'audit' },
  ANNEXE_ENVOYEE_VALIDATION:          { icon:'file',      color:'#0369A1', bg:'#F0F9FF', label:'Annexe envoyée pour signature', groupe:'audit' },
  ANNEXE_VALIDEE_CROISEE:             { icon:'checkCirc', color:'#059669', bg:'#ECFDF5', label:'Annexe signée / validée',       groupe:'audit' },
  ANNEXE_REJETEE_CROISEE:             { icon:'xCircle',   color:'#B91C1C', bg:'#FEF2F2', label:'Annexe rejetée',                groupe:'audit' },
  AUDIT:                              { icon:'clipboard', color:'#64748b', bg:'#F8FAFC', label:'Audit',                 groupe:'audit' },
  EXPIRATION_NOTIF_30J:     { icon:'bell',      color:'#C8982A', bg:'#FFFBEB', label:'Alerte 30 jours',      groupe:'expire' },
  EXPIRATION_NOTIF_7J:      { icon:'alertTri',  color:'#B91C1C', bg:'#FEF2F2', label:'Alerte 7 jours',       groupe:'expire' },
  CERTIFICATION_EXPIREE:    { icon:'xCircle',   color:'#B91C1C', bg:'#FEF2F2', label:'Expirée',              groupe:'expire' },
  RECERTIFICATION_DEMARREE: { icon:'refresh',   color:'#1D4ED8', bg:'#EFF6FF', label:'Recertification',      groupe:'expire' },
  DEFAULT:                  { icon:'settings',  color:'#64748b', bg:'#F8FAFC', label:'Action',               groupe:'autre'  },
};

const getCfg = t => TYPE_CFG[t] || TYPE_CFG.DEFAULT;

const FILTRES = [
  { id:'all',    label:'Tout'           },
  { id:'audit',  label:'Audits'         },
  { id:'auth',   label:'Connexions'     },
  { id:'examen', label:'Examens'        },
  { id:'certif', label:'Certifications' },
  { id:'admin',  label:'Administration' },
  { id:'expire', label:'Expirations'    },
];

// Rôles pouvant consulter l'historique complet de leur plant (isolation
// stricte : chaque plant — auditeurs + expert + chef de service — reste
// indépendant des autres plants).
const PLANT_VIEW_ROLES = ['CHEF_SERVICE', 'EXPERT_PRODUCT_AUDIT', 'RESPONSABLE_QUALITE_CENTRALE'];

function timeAgo(d) {
  if (!d) return '';
  const diff = Date.now() - new Date(d).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return 'À l\'instant';
  if (m < 60) return `${m}min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const j = Math.floor(h / 24);
  return j < 7 ? `${j}j` : new Date(d).toLocaleDateString('fr-FR', {day:'2-digit', month:'short'});
}

function initiales(nomPrenom) {
  if (!nomPrenom) return '?';
  const parts = nomPrenom.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  return (parts[0][0] + (parts[1] ? parts[1][0] : '')).toUpperCase();
}

function groupByDay(items) {
  return items.reduce((acc, item) => {
    const key = item.dateAction
      ? new Date(item.dateAction).toLocaleDateString('fr-FR',
          {weekday:'long', day:'numeric', month:'long', year:'numeric'})
      : 'Date inconnue';
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {});
}

// ── Modale détail ─────────────────────────────────────────────────
function DetailModal({ item, onClose, showActeur }) {
  const cfg = getCfg(item.type);
  const roleCfg = getRoleCfg(item.acteurRole);
  const d   = item.dateAction ? new Date(item.dateAction) : null;
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(11,30,61,.6)',
      display:'flex', alignItems:'center', justifyContent:'center',
      zIndex:1000, backdropFilter:'blur(6px)' }}
      onClick={e => { if(e.target === e.currentTarget) onClose(); }}>
      <div style={{ background:'#fff', borderRadius:20, width:'100%', maxWidth:500,
        overflow:'hidden', boxShadow:'0 32px 80px rgba(0,0,0,.25)', animation:'up .2s ease' }}>
        {/* Header */}
        <div style={{ background:'#0B1E3D', padding:'1.25rem 1.5rem',
          display:'flex', alignItems:'center', justifyContent:'space-between'}}>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <div style={{ width:42, height:42, borderRadius:12, background:cfg.bg,
              color:cfg.color, display:'flex', alignItems:'center', justifyContent:'center' }}>
              {IC[cfg.icon]}
            </div>
            <div>
              <p style={{ margin:0, fontWeight:800, fontSize:'.95rem', color:'#fff' }}>{cfg.label}</p>
              <p style={{ margin:0, fontSize:'.72rem', color:'rgba(255,255,255,.4)' }}>{timeAgo(item.dateAction)}</p>
            </div>
          </div>
          <button onClick={onClose} style={{ width:30, height:30, borderRadius:8,
            background:'rgba(255,255,255,.1)', border:'none', color:'rgba(255,255,255,.7)',
            display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer' }}>
            {IC.x}
          </button>
        </div>
        {/* Body */}
        <div style={{ padding:'1.5rem' }}>

          {showActeur && item.acteurNomPrenom && (
            <div style={{ background:roleCfg.bg, borderRadius:10, padding:'10px 14px', marginBottom:'1rem',
              display:'flex', alignItems:'center', gap:10, border:`.5px solid ${roleCfg.color}30` }}>
              <div style={{ width:32, height:32, borderRadius:99, background:roleCfg.color, color:'#fff',
                display:'flex', alignItems:'center', justifyContent:'center', fontSize:'.7rem', fontWeight:800, flexShrink:0 }}>
                {initiales(item.acteurNomPrenom)}
              </div>
              <div style={{ minWidth:0 }}>
                <p style={{ margin:0, fontSize:'.86rem', fontWeight:700, color:'#0B1E3D' }}>
                  {item.acteurNomPrenom.trim()} <span style={{ fontWeight:500, color:'#94A3B8' }}>· {item.acteurMatricule}</span>
                </p>
                <p style={{ margin:0, fontSize:'.68rem', color:roleCfg.color, fontWeight:700, textTransform:'uppercase', letterSpacing:'.04em' }}>
                  {roleCfg.label}{item.plantNom ? ` · ${item.plantNom}` : ''}
                </p>
              </div>
            </div>
          )}

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem', marginBottom:'1.25rem' }}>
            {[
              { l:'Type',  v:cfg.label },
              { l:'Date',  v:d ? d.toLocaleDateString('fr-FR',{day:'2-digit',month:'long',year:'numeric'}) : '—' },
              { l:'Heure', v:d ? d.toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'}) : '—' },
              { l:'Score', v:item.scoreSnapshot != null ? `${item.scoreSnapshot}%` : '—' },
            ].map((r,i) => (
              <div key={i} style={{ background:'#F8FAFC', borderRadius:10, padding:'10px 14px',
                border:'.5px solid #E2E8F0' }}>
                <p style={{ margin:0, fontSize:'.67rem', color:'#94A3B8', fontWeight:700,
                  textTransform:'uppercase', letterSpacing:'.07em' }}>{r.l}</p>
                <p style={{ margin:'4px 0 0', fontSize:'.88rem', fontWeight:800, color:'#0B1E3D' }}>{r.v}</p>
              </div>
            ))}
          </div>
          {item.auditReference && (
            <div style={{ background:'#EFF6FF', borderRadius:10, padding:'10px 14px', marginBottom:'1rem',
              display:'flex', alignItems:'center', gap:10, border:'.5px solid #BFDBFE' }}>
              <div style={{ color:'#1D4ED8', flexShrink:0 }}>{IC.clipboard}</div>
              <div>
                <p style={{ margin:0, fontSize:'.68rem', color:'#1D4ED8', fontWeight:700, textTransform:'uppercase', letterSpacing:'.06em' }}>Audit concerné</p>
                <p style={{ margin:0, fontSize:'.86rem', fontWeight:700, color:'#0B1E3D' }}>{item.auditReference}</p>
              </div>
            </div>
          )}
          {item.certificationNom && (
            <div style={{ background:'#FFFBEB', borderRadius:10, padding:'10px 14px', marginBottom:'1rem',
              display:'flex', alignItems:'center', gap:10, border:'.5px solid #FDE68A' }}>
              <div style={{ color:'#C8982A', flexShrink:0 }}>{IC.award}</div>
              <div>
                <p style={{ margin:0, fontSize:'.68rem', color:'#C8982A', fontWeight:700, textTransform:'uppercase', letterSpacing:'.06em' }}>Certification</p>
                <p style={{ margin:0, fontSize:'.86rem', fontWeight:700, color:'#0B1E3D' }}>{item.certificationNom}</p>
              </div>
            </div>
          )}
          {item.cibleNomPrenom && (
            <div style={{ background:'#F5F3FF', borderRadius:10, padding:'10px 14px', marginBottom:'1rem',
              display:'flex', alignItems:'center', gap:10, border:'.5px solid #DDD6FE' }}>
              <div style={{ color:'#6D28D9', flexShrink:0 }}>{IC.user}</div>
              <div>
                <p style={{ margin:0, fontSize:'.68rem', color:'#6D28D9', fontWeight:700, textTransform:'uppercase', letterSpacing:'.06em' }}>Utilisateur concerné</p>
                <p style={{ margin:0, fontSize:'.86rem', fontWeight:700, color:'#0B1E3D' }}>{item.cibleNomPrenom} · {item.cibleMatricule}</p>
              </div>
            </div>
          )}
          <div style={{ background:'#F8FAFC', borderRadius:10, padding:'12px 16px', border:'.5px solid #E2E8F0' }}>
            <p style={{ margin:'0 0 6px', fontSize:'.67rem', color:'#94A3B8', fontWeight:700,
              textTransform:'uppercase', letterSpacing:'.07em' }}>Description</p>
            <p style={{ margin:0, fontSize:'.87rem', fontWeight:600, color:'#0B1E3D', lineHeight:1.6 }}>
              {item.details || '—'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
export default function HistoriquePage() {
  const { user } = useAuth();
  const role = user?.role;
  const roleConfig = ROLE_HISTORIQUE_CONFIG[role] || ROLE_HISTORIQUE_CONFIG.AUDITEUR;

  const canViewPlant = roleConfig?.canViewPlant || false;
  const canViewAll   = roleConfig?.canViewAll || false;
  const showConnexionsAutres = roleConfig?.showConnexionsAutres || false;
  const showOnlyAuditActions = roleConfig?.showOnlyAuditActions || false;
  const allowedGroups = roleConfig?.allowedGroups || ['audit'];
  const allowedTypes = roleConfig?.allowedTypes || null;

  // mode : 'mine' (mes actions) · 'plant' (tout mon plant) · 'all' (admin, tous plants)
  const [mode,    setMode]    = useState('mine');
  const [items,   setItems]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter,  setFilter]  = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');
  const [search,  setSearch]  = useState('');
  const [detail,  setDetail]  = useState(null);
  
  // ── Filtre plant pour responsable qualité ──────────────────────
  const [selectedPlantId, setSelectedPlantId] = useState('');
  const [plants, setPlants] = useState([]);

  // ── Charger la liste des plants ─────────────────────────────────
  useEffect(() => {
    if (canViewAll && role === 'RESPONSABLE_QUALITE_CENTRALE') {
      api.get('/historique/plants')
        .then(r => setPlants(r.data || []))
        .catch(() => {
          // Fallback : essayer un autre endpoint
          api.get('/plants')
            .then(r => setPlants(r.data || []))
            .catch(() => {});
        });
    }
  }, [canViewAll, role]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      let url = '/historique';
      if (mode === 'plant' && canViewPlant) {
        url = '/historique/plant';
      }
      if (mode === 'all' && canViewAll) {
        url = '/historique/all';
        // Ajouter le filtre plantId si sélectionné
        if (selectedPlantId) {
          url += `?plantId=${selectedPlantId}`;
        }
      }

      console.log('[Historique] Chargement depuis:', url);
      const response = await api.get(url);
      console.log('[Historique] Données reçues:', response.data?.length || 0);
      
      let data = Array.isArray(response?.data) ? response.data : [];
      
      // ── FILTRAGE côté frontend selon le rôle ──
      if (mode !== 'mine') {
        // En mode plant ou all, on filtre selon les permissions du rôle
        data = data.filter(item => {
          const cfg = getCfg(item.type);
          const isAuth = cfg.groupe === 'auth';
          
          // 1. Si c'est une connexion/déconnexion et que ce n'est PAS l'utilisateur courant
          if (isAuth && item.acteurId !== user?.id) {
            if (!showConnexionsAutres) {
              return false; // Ne pas montrer les connexions des autres
            }
          }
          
          // 2. Si le rôle ne voit que certaines actions spécifiques
          if (allowedTypes && item.acteurId !== user?.id) {
            if (!allowedTypes.includes(item.type)) {
              return false;
            }
          }
          
          // 3. Si le rôle ne voit que les actions d'audit pour les autres
          if (showOnlyAuditActions && mode !== 'mine') {
            if (item.acteurId !== user?.id) {
              // Ne montrer que les groupes autorisés
              return allowedGroups.includes(cfg.groupe);
            }
          }
          
          return true;
        });
      }
      
      setItems(data);
    } catch (error) {
      console.error('[Historique] Erreur:', error);
      setItems([]);
    }
    setLoading(false);
  }, [mode, canViewPlant, canViewAll, selectedPlantId, user?.id, showConnexionsAutres, showOnlyAuditActions, allowedGroups, allowedTypes]);

  useEffect(() => { load(); }, [load]);

  const deleteItem = async (id, e) => {
    e?.stopPropagation();
    try { await api.delete(`/historique/${id}`); } catch {}
    setItems(p => p.filter(i => i.id !== id));
    if (detail?.id === id) setDetail(null);
  };

  const deleteAll = async () => {
    if (mode !== 'mine') return;
    if (!window.confirm('Effacer tout votre historique personnel ?')) return;
    try { await api.delete('/historique'); } catch {}
    setItems([]); setDetail(null);
  };

  const rolesPresents = useMemo(() => {
    const set = new Set(items.map(i => i.acteurRole).filter(Boolean));
    return Array.from(set);
  }, [items]);

  // Filtrer les options du filtre selon le rôle
  const availableFilters = FILTRES.filter(f => {
    if (f.id === 'auth' && !showConnexionsAutres && mode !== 'mine') return false;
    if (mode !== 'mine' && showOnlyAuditActions) {
      return f.id === 'all' || f.id === 'audit';
    }
    return true;
  });

  const filtered = items.filter(i => {
    const cfg = getCfg(i.type);
    const mf = filter === 'all' || cfg.groupe === filter;
    const mr = roleFilter === 'all' || i.acteurRole === roleFilter;
    const ms = !search
      || (i.details||'').toLowerCase().includes(search.toLowerCase())
      || cfg.label.toLowerCase().includes(search.toLowerCase())
      || (i.acteurNomPrenom||'').toLowerCase().includes(search.toLowerCase())
      || (i.auditReference||'').toLowerCase().includes(search.toLowerCase())
      || (i.certificationNom||'').toLowerCase().includes(search.toLowerCase());
    return mf && mr && ms;
  });

  const grouped = groupByDay(filtered);
  const showActeur = mode !== 'mine';

  const stats = [
    { label:'Total',          v:items.length,                                                 c:'#0B1E3D', icon:'clock'    },
    { label:'Audits',         v:items.filter(i=>getCfg(i.type).groupe==='audit').length,       c:'#0057B8', icon:'clipboard'},
    { label:'Examens',        v:items.filter(i=>getCfg(i.type).groupe==='examen').length,      c:'#1652AB', icon:'play'     },
    { label:'Certifications', v:items.filter(i=>getCfg(i.type).groupe==='certif').length,      c:'#C8982A', icon:'award'    },
  ];

  return (
    <div style={{ fontFamily:"'DM Sans',sans-serif", minHeight:'100%', background:'#FFFFFF' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@700;900&family=DM+Sans:wght@400;500;600;700;800&display=swap');
        @keyframes up     { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        @keyframes fade   { from{opacity:0} to{opacity:1} }
        @keyframes shimmer{ 0%{background-position:-200% 0} 100%{background-position:200% 0} }
        .hrow  { transition:background .12s, transform .1s; cursor:pointer; }
        .hrow:hover { background:#F8FAFC !important; }
        .hfil  { transition:all .15s; cursor:pointer; border:1.5px solid #E2E8F0; }
        .hfil:hover { background:#F1F5F9 !important; border-color:#CBD5E1 !important; }
        .hfil.act { background:#0B1E3D !important; color:#fff !important; border-color:#0B1E3D !important; box-shadow:0 3px 10px rgba(11,30,61,.2); }
        .hmode { transition:all .15s; cursor:pointer; border:1.5px solid #E2E8F0; }
        .hmode:hover { background:#F1F5F9 !important; }
        .hmode.act { background:#0057B8 !important; color:#fff !important; border-color:#0057B8 !important; box-shadow:0 3px 10px rgba(0,87,184,.25); }
        .hact-btn { transition:all .14s; }
        .hact-btn:hover { opacity:.75 !important; }
        .skel { background:linear-gradient(90deg,#F1F5F9 25%,#E8EDF7 50%,#F1F5F9 75%);
                background-size:200% 100%; animation:shimmer 1.4s infinite; border-radius:8px; }
        .ic-btn { transition:all .15s; cursor:pointer; }
        .ic-btn:hover { transform:scale(1.1); }
        .hsel { font-family:inherit; }
        .hstat { transition: transform .15s, box-shadow .15s; }
.hstat:hover { transform: translateY(-2px); box-shadow: 0 6px 16px rgba(11,30,61,.08); }
      `}</style>

      <div style={{ padding:'0.75rem 2rem 1.7rem', display:'flex', flexDirection:'column', gap:'1.25rem', animation:'fade .3s ease',background:'#FFFFFF' }}>

        {/* ── Header ── */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:12 }}>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <div style={{ width:44, height:44, borderRadius:12, background:'#0B1E3D', color:'#fff',
              display:'flex', alignItems:'center', justifyContent:'center',
              boxShadow:'0 4px 14px rgba(11,30,61,.25)' }}>
              {IC.clock}
            </div>
            <div>
              <h1 style={{ fontSize:'1.3rem', fontWeight:900, color:'#0B1E3D',
                fontFamily:"'Rajdhani',sans-serif", letterSpacing:'-.02em', margin:0 }}>Journal d'activité</h1>
              <p style={{ margin:0, fontSize:'.75rem', color:'#94A3B8' }}>
                {loading ? 'Chargement…' : `${items.length} action${items.length!==1?'s':''} enregistrée${items.length!==1?'s':''}`}
                {mode==='plant' && items[0]?.plantNom ? ` · Plant ${items[0].plantNom}` : ''}
                {mode==='all' ? ' · Tous les plants' : ''}
              </p>
            </div>
          </div>
          {items.length > 0 && mode === 'mine' && (
            <button className="hact-btn" onClick={deleteAll}
              style={{ display:'flex', alignItems:'center', gap:7, background:'#f6e2e2',
                border:'.5px solid #FECACA', borderRadius:10, padding:'8px 15px',
                fontSize:'.81rem', fontWeight:700, color:'#B91C1C', cursor:'pointer', fontFamily:'inherit' }}>
              {IC.trash} Tout effacer
            </button>
          )}
        </div>

        {/* ── Sélecteur de vue (mon activité / mon plant / tous les plants) ── */}
        {(canViewPlant || canViewAll) && (
          <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
            <button className={`hmode ${mode==='mine'?'act':''}`} onClick={()=>{setMode('mine'); setRoleFilter('all');}}
              style={{ display:'flex', alignItems:'center', gap:7, padding:'8px 16px', borderRadius:10,
                background:'#fff', fontSize:'.82rem', fontWeight:700, color:'#64748b' }}>
              {IC.user} Mon activité
            </button>
            {canViewPlant && (
              <button className={`hmode ${mode==='plant'?'act':''}`} onClick={()=>{setMode('plant'); setRoleFilter('all');}}
                style={{ display:'flex', alignItems:'center', gap:7, padding:'8px 16px', borderRadius:10,
                  background:'#fff', fontSize:'.82rem', fontWeight:700, color:'#64748b' }}>
                {IC.building} Activité de mon plant
              </button>
            )}
            {canViewAll && (
              <button className={`hmode ${mode==='all'?'act':''}`} onClick={()=>{setMode('all'); setRoleFilter('all');
                // Réinitialiser le filtre plant quand on change de mode
                setSelectedPlantId('');
              }}
                style={{ display:'flex', alignItems:'center', gap:7, padding:'8px 16px', borderRadius:10,
                  background:'#fff', fontSize:'.82rem', fontWeight:700, color:'#64748b' }}>
                {IC.users} Tous les plants
              </button>
            )}
          </div>
        )}

        {/* ── Stats ── */}
<div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'1rem' }}>
  {stats.map((s,i) => (
    <div key={i} className="hstat" style={{
      background:'#fff', borderRadius:14, padding:'1.1rem 1.25rem',
      border:'.5px solid #c9d6e6', boxShadow:'0 1px 4px rgba(11,30,61,.05)',
      position:'relative', overflow:'hidden',
      display:'flex', alignItems:'center', gap:14,
      animation:`up .4s ${i*.07}s ease both` }}>

      {/* liseré coloré à gauche */}
      <div style={{ position:'absolute', top:0, left:0, bottom:0, width:3, background:s.c }}/>

      <div style={{ width:42, height:42, borderRadius:11, background:s.c+'12',
        color:s.c, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
        {IC[s.icon]}
      </div>

      <div style={{ minWidth:0 }}>
        <div style={{ fontSize:'1.65rem', fontWeight:900, color:'#0B1E3D',
          fontFamily:"'Rajdhani',sans-serif", lineHeight:1 }}>{loading ? '—' : s.v}</div>
        <div style={{ fontSize:'.7rem', color:'#94A3B8', fontWeight:700,
          textTransform:'uppercase', letterSpacing:'.06em', marginTop:4 }}>{s.label}</div>
      </div>
    </div>
  ))}
</div>

        {/* ── Filtres + Recherche ── */}
        <div style={{ display:'flex', alignItems:'center', gap:7, flexWrap:'wrap' }}>
          <div style={{ display:'flex', alignItems:'center', gap:5, color:'#94A3B8', flexShrink:0 }}>
            {IC.filter}
          </div>
          {availableFilters.map(f => (
            <button key={f.id} className={`hfil ${filter===f.id?'act':''}`}
              onClick={() => setFilter(f.id)}
              style={{ padding:'6px 14px', borderRadius:9,
                background:'#fff', fontSize:'.79rem', fontWeight:700,
                color:'#64748b', fontFamily:'inherit', cursor:'pointer' ,border:'1.5px solid #b9bec5' }}>
              {f.label}
            </button>
          ))}

          {/* ── Filtre par plant (responsable qualité) ── */}
          {mode === 'all' && canViewAll && role === 'RESPONSABLE_QUALITE_CENTRALE' && plants.length > 0 && (
            <select 
              className="hsel" 
              value={selectedPlantId} 
              onChange={e => setSelectedPlantId(e.target.value)}
              style={{ 
                padding:'6px 12px', borderRadius:9, border:'1.5px solid #b9bec5', 
                background: selectedPlantId ? '#EFF6FF' : '#fff',
                fontSize:'.79rem', fontWeight:700, color: selectedPlantId ? '#1D4ED8' : '#64748b', 
                cursor:'pointer', minWidth:140
              }}
            >
              <option value=""> Tous les plants</option>
              {plants.map(p => (
                <option key={p.id} value={p.id}>
                   {p.nom} {p.code ? `(${p.code})` : ''}
                </option>
              ))}
            </select>
          )}

          {showActeur && rolesPresents.length > 0 && (
            <select className="hsel" value={roleFilter} onChange={e=>setRoleFilter(e.target.value)}
              style={{ padding:'6px 12px', borderRadius:9, border:'1.5px solid #b9bec5', background:'#fff',
                fontSize:'.79rem', fontWeight:700, color:'#64748b', cursor:'pointer' }}>
              <option value="all">Tous les acteurs</option>
              {rolesPresents.map(r => (
                <option key={r} value={r}>{getRoleCfg(r).label}</option>
              ))}
            </select>
          )}

          <div style={{ marginLeft:'auto', position:'relative' ,border:'1.5px solid #e3e4e6', borderRadius:10, background:'#fff' }}>
            <span style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', color:'#94A3B8', display:'flex' }}>{IC.search}</span>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Rechercher…"
              style={{ padding:'7px 12px 7px 32px', borderRadius:10, border:'1.5px solid #9caec6',
                fontSize:'.8rem', outline:'none', fontFamily:'inherit', width:190, background:'#fff' }}
              onFocus={e=>{ e.target.style.borderColor='#0B1E3D'; e.target.style.boxShadow='0 0 0 3px rgba(11,30,61,.07)'; }}
              onBlur={e=>{ e.target.style.borderColor='#a7b2c0'; e.target.style.boxShadow='none'; }}/>
          </div>
        </div>

        {/* ── Timeline ── */}
        <div>
          {loading ? (
            [1,2,3,4].map(i=>(
              <div key={i} style={{ display:'flex', gap:14, marginBottom:10, alignItems:'center',
                background:'#fff', borderRadius:12, padding:'12px 16px', border:'.5px solid #E2E8F0' }}>
                <div className="skel" style={{ width:42, height:42, borderRadius:11, flexShrink:0 }}/>
                <div style={{ flex:1, display:'flex', flexDirection:'column', gap:7 }}>
                  <div className="skel" style={{ height:11, width:'28%' }}/>
                  <div className="skel" style={{ height:9, width:'55%' }}/>
                </div>
                <div className="skel" style={{ width:36, height:9, borderRadius:99 }}/>
              </div>
            ))
          ) : items.length === 0 ? (
            <div style={{ background:'#fff', borderRadius:14, border:'.5px solid #b2c3d9',
              padding:'4rem', textAlign:'center', animation:'up .4s ease' }}>
              <div style={{ width:56, height:56, borderRadius:14, background:'#F1F5F9',
                display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px', color:'#CBD5E1' }}>
                {IC.clock}
              </div>
              <p style={{ fontWeight:800, color:'#374151', margin:'0 0 6px', fontSize:'.95rem' }}>Aucune activité</p>
              <p style={{ fontSize:'.8rem', margin:0, color:'#94A3B8' }}>
                {mode === 'mine' ? 'Vos actions sur la plateforme apparaîtront ici' : 'Aucune action enregistrée pour le moment'}
              </p>
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ background:'#fff', borderRadius:14, border:'.5px solid #E2E8F0',
              padding:'3rem', textAlign:'center' }}>
              <div style={{ color:'#e4e9f0', display:'flex', justifyContent:'center', marginBottom:10 }}>{IC.search}</div>
              <p style={{ fontWeight:700, color:'#374151', margin:0 }}>Aucun résultat</p>
            </div>
          ) : (
            Object.entries(grouped).map(([day, dayItems]) => (
              <div key={day} style={{ marginBottom:'1.5rem' }}>
                {/* Séparateur jour */}
                <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:'.75rem' }}>
                  <div style={{ flex:1, height:1, background:'#E8EDF7' }}/>
                  <div style={{ display:'flex', alignItems:'center', gap:6, background:'#fff',
                    border:'.5px solid #E2E8F0', borderRadius:99, padding:'4px 12px' }}>
                    <span style={{ color:'#CBD5E1', display:'flex' }}>{IC.calendar}</span>
                    <span style={{ fontSize:'.72rem', fontWeight:700, color:'#64748b', textTransform:'capitalize', whiteSpace:'nowrap' }}>
                      {day}
                    </span>
                  </div>
                  <div style={{ flex:1, height:1, background:'#E8EDF7' }}/>
                </div>

                {/* Liste du jour */}
                <div style={{ background:'#d8dee67b', borderRadius:18, border:'.5px solid #E2E8F0',
                  overflow:'hidden', boxShadow:'0 1px 8px rgba(0,0,0,.05)' }}>
                  {dayItems.map((item, idx) => {
                    const cfg = getCfg(item.type);
                    const roleCfg = getRoleCfg(item.acteurRole);
                    return (
                      <div key={item.id} className="hrow"
                        onClick={() => setDetail(item)}
                        style={{ display:'flex', alignItems:'center', gap:14, padding:'12px 16px',
                          borderBottom: idx < dayItems.length-1 ? '1px solid #F8FAFC' : 'none' }}>

                        {/* Icône SVG colorée */}
                        <div style={{ width:40, height:40, borderRadius:11, background:cfg.bg,
                          color:cfg.color, display:'flex', alignItems:'center', justifyContent:'center',
                          flexShrink:0, border:`.5px solid ${cfg.color}20` }}>
                          {IC[cfg.icon]}
                        </div>

                        {/* Avatar acteur (vue plant / tous plants uniquement) */}
                        {showActeur && (
                          <div title={`${item.acteurNomPrenom || ''} · ${roleCfg.label}`}
                            style={{ width:30, height:30, borderRadius:99, background:roleCfg.color, color:'#fff',
                              display:'flex', alignItems:'center', justifyContent:'center', fontSize:'.62rem',
                              fontWeight:800, flexShrink:0 }}>
                            {initiales(item.acteurNomPrenom)}
                          </div>
                        )}

                        {/* Contenu */}
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ display:'flex', alignItems:'center', gap:7, marginBottom:3, flexWrap:'wrap' }}>
                            <span style={{ background:cfg.bg, color:cfg.color, fontSize:'.67rem',
                              fontWeight:800, padding:'2px 9px', borderRadius:99,
                              border:`.5px solid ${cfg.color}20`, flexShrink:0 }}>
                              {cfg.label}
                            </span>
                            {showActeur && item.acteurNomPrenom && (
                              <span style={{ fontSize:'.67rem', color:roleCfg.color, fontWeight:700,
                                background:roleCfg.bg, padding:'2px 8px', borderRadius:99,
                                border:`.5px solid ${roleCfg.color}30` }}>
                                {item.acteurNomPrenom.trim()} · {roleCfg.label}
                              </span>
                            )}
                            {mode === 'all' && item.plantNom && (
                              <span style={{ fontSize:'.67rem', color:'#0057B8', fontWeight:700,
                                background:'#EFF6FF', padding:'2px 8px', borderRadius:99,
                                border:'.5px solid #BFDBFE' }}>
                                {item.plantNom}
                              </span>
                            )}
                            {item.auditReference && (
                              <span style={{ fontSize:'.67rem', color:'#0057B8', fontWeight:700,
                                background:'#EFF6FF', padding:'2px 8px', borderRadius:99,
                                border:'.5px solid #BFDBFE' }}>
                                Réf: {item.auditReference}
                              </span>
                            )}
                            {item.certificationNom && (
                              <span style={{ fontSize:'.67rem', color:'#C8982A', fontWeight:700,
                                background:'#FFFBEB', padding:'2px 8px', borderRadius:99,
                                border:'.5px solid #FDE68A' }}>
                                {item.certificationNom}
                              </span>
                            )}
                            {item.scoreSnapshot != null && (
                              <span style={{ fontSize:'.67rem', color:'#1D4ED8', fontWeight:800,
                                background:'#EFF6FF', padding:'2px 8px', borderRadius:99 }}>
                                {item.scoreSnapshot}%
                              </span>
                            )}
                          </div>
                          <p style={{ margin:0, fontSize:'.84rem', fontWeight:600, color:'#374151',
                            whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
                            {item.details || cfg.label}
                          </p>
                          {item.cibleNomPrenom && (
                            <p style={{ margin:'2px 0 0', fontSize:'.71rem', color:'#94A3B8', display:'flex', alignItems:'center', gap:4 }}>
                              <span style={{ color:'#CBD5E1', display:'flex' }}>{IC.user}</span>
                              {item.cibleNomPrenom}
                            </p>
                          )}
                        </div>

                        {/* Temps */}
                        <span style={{ fontSize:'.72rem', color:'#b7c3d2', fontWeight:700,
                          background:'#F8FAFC', padding:'3px 9px', borderRadius:99,
                          flexShrink:0, border:'.5px solid #E8EDF7' }}>
                          {timeAgo(item.dateAction)}
                        </span>

                        {/* Boutons */}
                        <div style={{ display:'flex', gap:5, flexShrink:0 }} onClick={e=>e.stopPropagation()}>
                          <button className="ic-btn" onClick={()=>setDetail(item)}
                            style={{ width:30, height:30, borderRadius:8, border:'.5px solid #E2E8F0',
                              background:'#F8FAFC', color:'#94A3B8', display:'flex', alignItems:'center',
                              justifyContent:'center' }}
                            onMouseEnter={e=>{ e.currentTarget.style.background='#EFF6FF'; e.currentTarget.style.color='#1D4ED8'; e.currentTarget.style.borderColor='#BFDBFE'; }}
                            onMouseLeave={e=>{ e.currentTarget.style.background='#F8FAFC'; e.currentTarget.style.color='#94A3B8'; e.currentTarget.style.borderColor='#E2E8F0'; }}>
                            {IC.eye}
                          </button>
                          {mode === 'mine' && (
                            <button className="ic-btn" onClick={e=>deleteItem(item.id, e)}
                              style={{ width:30, height:30, borderRadius:8, border:'.5px solid #E2E8F0',
                                background:'#F8FAFC', color:'#94A3B8', display:'flex', alignItems:'center',
                                justifyContent:'center' }}
                              onMouseEnter={e=>{ e.currentTarget.style.background='#FEF2F2'; e.currentTarget.style.color='#B91C1C'; e.currentTarget.style.borderColor='#FECACA'; }}
                              onMouseLeave={e=>{ e.currentTarget.style.background='#F8FAFC'; e.currentTarget.style.color='#94A3B8'; e.currentTarget.style.borderColor='#E2E8F0'; }}>
                              {IC.trash}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {detail && <DetailModal item={detail} onClose={()=>setDetail(null)} showActeur={showActeur}/>}
    </div>
  );
}