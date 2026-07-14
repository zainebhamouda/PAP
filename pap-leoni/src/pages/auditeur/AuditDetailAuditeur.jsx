/**
 * AuditDetailAuditeur.jsx — Sprint 3/4 LEONI PAP
 * ─────────────────────────────────────────────
 * AMÉLIORATIONS v3 :
 *  ✓ Fond blanc page principale
 *  ✓ Ombres sur toutes les div internes (Card)
 *  ✓ Page GÉNÉRATION : ajout PDF supplémentaires toujours visible
 *  ✓ Reprise exacte de l'étape (workflow + page) persistée dans localStorage
 *    indépendamment du brouillon (expiration supprimée)
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { auditProduitAPI } from '../../services/api';
import {
  FormAnnexe1A, FormAnnexe1B, useDefautInjector, extractDefautsFromAnnexe,
  FormAnnexe4, FormAnnexe5, FormAnnexe6, FormAnnexe7, FormAnnexe7A,
  FormAnnexe8, FormAnnexe10, FormAnnexe11A, FormAnnexe11B, FormAnnexe11C,
  FormAnnexe13A, FormAnnexe13B, FormAnnexe13C, FormAnnexe13D,
  FormAnnexePSA, FormAnnexeDPE,
} from './FormAnnexes_LEONI_Complete';

import { ReportGenerationModal, AuditIdentityCard } from './AuditReportSystem';

/* ═══════════════════════════════════════════════════════════════
   DESIGN TOKENS
═══════════════════════════════════════════════════════════════ */
const T = {
  navy:'#001F4E', blue:'#003F8A', blueM:'#0057B8',
  gold:'#C8982A', goldL:'#FBF5E8',
  g50:'#F7F9FC', g100:'#EEF2F8', g200:'#d0d5df', g300:'#BCC8DC',
  g400:'#8A9BBC', g500:'#5C6F8A', g700:'#273347',
  success:'#059669', successBg:'#d4e4dd', successBd:'#A7F3D0',
  warn:'#C8982A', warnBg:'#f3ecd0', warnBd:'#FCD34D',
  danger:'#DC2626', dangerBg:'#f7dfdf', dangerBd:'#FECACA',
  info:'#2563EB', infoBg:'#d8e0ec', infoBd:'#BFDBFE',
  rose:'#9D174D', roseBg:'#f5dcea', roseBd:'#F9A8D4',
  orange:'#D97706', orangeBg:'#ebdece', orangeBd:'#FED7AA',
  purple:'#7C3AED', purpleBg:'#d7d4e8', purpleBd:'#DDD6FE',
  teal:'#0D9488', tealBg:'#F0FDFA', tealBd:'#99F6E4',
};

const API = 'http://localhost:8080/api';
const apiH   = () => ({ Authorization:`Bearer ${localStorage.getItem('token')}`, 'Content-Type':'application/json' });
const multiH = () => ({ Authorization:`Bearer ${localStorage.getItem('token')}` });

// ⚠️ /rapport-pdf est protégé par @PreAuthorize côté backend (rôles requis).
// Un <a href> ou window.open() classique fait une navigation brute du
// navigateur SANS le header Authorization (le token JWT n'est jamais envoyé
// automatiquement) → Spring Security refuse la requête → 403 "HTTP ERROR 403".
// On récupère donc le PDF en fetch (avec le token), puis on l'ouvre depuis un
// blob local — c'est le même schéma déjà utilisé dans AuditReportSystem.jsx.
async function ouvrirRapportPdf(id) {
  try {
    const res = await fetch(`${API}/audit-produit/${id}/rapport-pdf`, { headers: multiH() });
    if (!res.ok) throw new Error('PDF non disponible (' + res.status + ')');
    const blob = await res.blob();
    const objectUrl = window.URL.createObjectURL(blob);
    window.open(objectUrl, '_blank', 'noopener,noreferrer');
    setTimeout(() => window.URL.revokeObjectURL(objectUrl), 60_000);
  } catch (e) {
    console.error('Erreur ouverture rapport PDF:', e);
    alert("Impossible d'ouvrir le rapport PDF pour le moment.");
  }
}

// ── Clés de localStorage ──────────────────────────────────────
const draftKey = id => `pap:aud-draft:${id}`;
const modalKey = (id,k) => `pap:aud-modal:${id}:${k}`;
const workflowKey = id => `pap:aud-workflow:${id}`;   // persistant
const pageKey = id => `pap:aud-page:${id}`;           // persistant

const fetchJson = async (url, opts) => {
  const r = await fetch(url, opts);
  const t = await r.text();
  if (!r.ok) throw new Error(t || r.statusText);
  if (!t) return null;
  try { return JSON.parse(t); } catch { throw new Error(t); }
};

const isFicheValidated = fiche => (
  fiche?.valide === true
  || fiche?.valideChef === true && fiche?.valideExpert === true
  || fiche?.valideParChef === true && fiche?.valideParExpert === true
  || fiche?.statut === 'VALIDEE'
);
const isPdcaResolved = pdca => pdca?.statut === 'RESOLU' || pdca?.statut === 'FERME';
const pickActiveRecord = (records, predicate) => {
  if (!Array.isArray(records) || records.length === 0) return null;
  return records.find(predicate) || records[0];
};

const getCorrectionTriggerLabel = (kind, qkColor) => {
  if (kind === 'fiche') {
    if (qkColor === 'ORANGE') return 'Déclenchée dès 0 < QK ≤ 0.5';
    if (qkColor === 'ROSE') return 'Déclenchée dès 0.5 < QK ≤ 1';
    if (qkColor === 'ROUGE') return 'Déclenchée dès QK > 1';
  }
  if (kind === 'pdca') {
    if (qkColor === 'ROSE') return 'Déclenché dès 0.5 < QK ≤ 1';
    if (qkColor === 'ROUGE') return 'Déclenché dès QK > 1';
  }
  return 'Déclenchée selon le niveau de criticité';
};

const getRecordDate = record => fmt(
  record?.dateValidation
  || record?.validatedAt
  || record?.dateResolution
  || record?.resolvedAt
  || record?.dateSoumission
  || record?.submittedAt
  || record?.dateEnvoi
  || record?.sentAt
  || record?.updatedAt
  || record?.createdAt
);

const fmt = d => {
  if (!d) return '—';
  try { return new Date(d).toLocaleDateString('fr-FR',{day:'2-digit',month:'short',year:'numeric'}); }
  catch { return d; }
};

/* ═══════════════════════════════════════════════════════════════
   QK LOGIC
═══════════════════════════════════════════════════════════════ */
function getRatingFactor(n) {
  if (!n || n < 50) return 4.0;
  if (n <= 100) return 2.0; if (n <= 200) return 1.0;
  if (n <= 400) return 0.9; if (n <= 800) return 0.8;
  if (n <= 1600) return 0.7; if (n <= 2600) return 0.6;
  if (n <= 4700) return 0.5; return 0.4;
}

function calculateQK(wp) {
  if (wp === 0) return 0.0;
  if (wp <= 13) return 0.1; if (wp <= 26) return 0.2; if (wp <= 40) return 0.3;
  if (wp <= 55) return 0.4; if (wp <= 71) return 0.5; if (wp <= 87) return 0.6;
  if (wp <= 104) return 0.7; if (wp <= 122) return 0.8; if (wp <= 140) return 0.9;
  if (wp <= 159) return 1.0; if (wp <= 179) return 1.1; if (wp <= 199) return 1.2;
  if (wp <= 220) return 1.3; if (wp <= 242) return 1.4; if (wp <= 265) return 1.5;
  if (wp <= 288) return 1.6; if (wp <= 312) return 1.7; if (wp <= 337) return 1.8;
  if (wp <= 362) return 1.9; if (wp <= 388) return 2.0; if (wp <= 415) return 2.1;
  if (wp <= 442) return 2.2; if (wp <= 470) return 2.3; if (wp <= 499) return 2.4;
  if (wp <= 528) return 2.5; if (wp <= 557) return 2.6; if (wp <= 586) return 2.7;
  if (wp <= 616) return 2.8; if (wp <= 646) return 2.9; if (wp <= 676) return 3.0;
  if (wp <= 706) return 3.1; if (wp <= 736) return 3.2; if (wp <= 767) return 3.3;
  if (wp <= 798) return 3.4; if (wp <= 829) return 3.5; if (wp <= 860) return 3.6;
  if (wp <= 891) return 3.7; if (wp <= 923) return 3.8; if (wp <= 955) return 3.9;
  if (wp <= 987) return 4.0; if (wp <= 1019) return 4.1; if (wp <= 1051) return 4.2;
  if (wp <= 1084) return 4.3; if (wp <= 1117) return 4.4; if (wp <= 1150) return 4.5;
  if (wp <= 1183) return 4.6; if (wp <= 1216) return 4.7; if (wp <= 1250) return 4.8;
  if (wp <= 1284) return 4.9; return 5.0;
}

function computeQKColor(val) {
  const n = Number(val);
  if (val === '' || val === null || val === undefined || isNaN(n)) return null;
  if (n === 0) return 'VERT';
  if (n <= 0.5) return 'ORANGE';
  if (n <= 1.0) return 'ROSE';
  return 'ROUGE';
}

const QK_META = {
  VERT:   { color:T.success, bg:T.successBg, bd:T.successBd, label:'Produit Conforme',          sub:'QK = 0 — Aucune non-conformité.' },
  ORANGE: { color:T.orange,  bg:T.orangeBg,  bd:T.orangeBd,  label:'Non-Conformité Mineure',    sub:'Fiche de réparation requise (0 < QK ≤ 0.5).' },
  ROSE:   { color:T.rose,    bg:T.roseBg,    bd:T.roseBd,    label:'Action Corrective Requise', sub:'Fiche + PDCA requis (0.5 < QK ≤ 1).' },
  ROUGE:  { color:T.danger,  bg:T.dangerBg,  bd:T.dangerBd,  label:'ALERTE CRITIQUE',           sub:'Fiche + PDCA + action immédiate (QK > 1).' },
};

/* ═══════════════════════════════════════════════════════════════
   CATALOGUE ANNEXES
═══════════════════════════════════════════════════════════════ */
const ALL_ANNEXES = {
  COMMUN:[
    {id:'4',  name:'Annexe 4',  desc:"Étapes de travail de l'audit produit",  tag:'Commun'},
    {id:'5',  name:'Annexe 5',  desc:'Audit court du Processus Assemblage',    tag:'Commun'},
    {id:'7',  name:'Annexe 7',  desc:'Dimensions & bandage BMW/AVW/MB',        tag:'Commun'},
    {id:'1A', name:'Annexe 1A', desc:'Monthly Report — Overview of Results',   tag:'Commun'},
    {id:'1B', name:'Annexe 1B', desc:'Fiche individuelle + Calcul QK auto',    tag:'Commun'},
  ],
  BMW:[
    {id:'6',   name:'Annexe 6',   desc:'Fils & USS — BMW/MN/OEM SupplierMB',       tag:'BMW'},
    {id:'8',   name:'Annexe 8',   desc:'Fils & Fils torsadés — BMW',                tag:'BMW'},
    {id:'13A', name:'Annexe 13A', desc:'Audit Destructif — Tubes (BMW Motorrad)',   tag:'BMW'},
    {id:'13B', name:'Annexe 13B', desc:'Audit Destructif — Douilles & Couvercles', tag:'BMW'},
    {id:'13C', name:'Annexe 13C', desc:'Audit Destructif — Joints (BMW Motorrad)', tag:'BMW'},
    {id:'13D', name:'Annexe 13D', desc:'Audit Destructif — Contacts (BMW Motorrad)',tag:'BMW'},
  ],
  VW:[
    {id:'7A',  name:'Annexe 7A',  desc:'Mesure Audi C-BEV',          tag:'VW/Audi'},
    {id:'10',  name:'Annexe 10',  desc:'Traction Audi/VW',            tag:'VW/Audi'},
    {id:'11A', name:'Annexe 11A', desc:'USS Audit Produit (Audi/VW)', tag:'VW/Audi'},
    {id:'11B', name:'Annexe 11B', desc:'Torsadage Audi/VW/MN',        tag:'VW/Audi'},
    {id:'11C', name:'Annexe 11C', desc:'Torsadage Audi C-BEV',        tag:'VW/Audi'},
  ],
  MOTEUR_SUD:[
    {id:'PSA', name:'Annexe PSA', desc:'Contrôle pièces PSA (Moteur Sud)', tag:'Moteur Sud'},
    {id:'DPE', name:'Annexe DPE', desc:'Contrôle pièces DPE (Moteur Sud)', tag:'Moteur Sud'},
  ],
};
const ANNEXE_IDX = Object.values(ALL_ANNEXES).flat().reduce((a,x)=>({...a,[x.id]:x}),{});

const TAG_COLOR = {
  'Commun':    {color:'#2563EB',bg:'#EFF6FF'},
  'BMW':       {color:'#059669',bg:'#ECFDF5'},
  'VW/Audi':   {color:'#9D174D',bg:'#FDF2F8'},
  'Moteur Sud':{color:'#C8982A',bg:'#FFFBEB'},
};

/* ═══════════════════════════════════════════════════════════════
   CSS GLOBAL
═══════════════════════════════════════════════════════════════ */
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&family=DM+Sans:wght@300;400;500;600;700&display=swap');
  * { box-sizing: border-box; }

  /* ── Layout racine ── */
  .leoni-root {
    display: flex;
    flex-direction: column;
    height: 100vh;
    overflow: hidden;
    background: #ffffff;
    font-family: 'DM Sans','Plus Jakarta Sans',sans-serif;
  }
  .leoni-topbar {
    flex-shrink: 0;
    position: relative;
    z-index: 100;
  }
  .leoni-body {
    flex: 1;
    overflow-y: auto;
    overflow-x: hidden;
    padding: 1.25rem 1.5rem 3rem;
  }
  .leoni-body-inner {
    max-width: 1260px;
    margin: 0 auto;
  }

  /* ── QK Result layout ── */
  .qk-result-layout {
    display: grid;
    grid-template-columns: 1fr 320px;
    gap: 14px;
    align-items: start;
  }
  .qk-sticky-col {
    position: sticky;
    top: 0;
  }
  @media (max-width: 900px) {
    .qk-result-layout { grid-template-columns: 1fr; }
    .qk-sticky-col { position: static; }
  }

  /* ── Keyframes ── */
  @keyframes fadeUp    { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:none} }
  @keyframes fadeIn    { from{opacity:0} to{opacity:1} }
  @keyframes popIn     { from{opacity:0;transform:scale(.96)} to{opacity:1;transform:scale(1)} }
  @keyframes spin      { to{transform:rotate(360deg)} }
  @keyframes slideDown { from{opacity:0;transform:translateY(-8px)} to{opacity:1;transform:none} }
  @keyframes pulse     { 0%,100%{opacity:1} 50%{opacity:.5} }

  .leoni-spin { width:16px;height:16px;border:2px solid rgba(255,255,255,.3);border-top-color:#fff;border-radius:50%;animation:spin .65s linear infinite;display:inline-block; }
  .leoni-spin-dark { border-color:#E2E8F0;border-top-color:#2563EB; }
  .card-animate { animation: fadeUp .3s ease both; }
  input:focus, textarea:focus, select:focus { outline:none; border-color:#2563EB !important; box-shadow:0 0 0 3px rgba(37,99,235,.12); }

  /* ── Annexe row ── */
  .ann-row { transition:background .12s,box-shadow .12s; box-shadow: 0 1px 4px rgba(0,40,85,.06); border-radius: 10px; }
  .ann-row:hover { background:#F0F4FF !important; box-shadow: 0 4px 14px rgba(0,40,85,.10) !important; }

  /* ── QK Scale rows ── */
  .qk-scale-row { transition: background .15s, box-shadow .15s; }
  .qk-scale-row.active { box-shadow: 0 2px 12px rgba(0,0,0,.08); }

  /* ── Corrective cards ── */
  .corr-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
  @media (max-width: 680px) { .corr-grid { grid-template-columns: 1fr; } }

  .corr-card {
    border-radius: 16px;
    border: 1.5px solid;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    transition: box-shadow .2s, transform .15s;
    background: #fff;
  }
  .corr-card:hover { box-shadow: 0 8px 28px rgba(0,0,0,.1); transform: translateY(-2px); }

  /* ── Generate bar ── */
  .gen-bar {
    border-radius: 14px;
    border: 1.5px solid;
    padding: 16px 20px;
    display: flex;
    align-items: center;
    gap: 16px;
    flex-wrap: wrap;
    margin-top: 4px;
  }

  /* ── Terminer btn ── */
  .terminer-btn {
    width: 100%; padding: 13px; border-radius: 13px; border: none;
    font-size: .92rem; font-weight: 800; cursor: pointer; font-family: inherit;
    display: flex; align-items: center; justify-content: center; gap: 9px;
    background: linear-gradient(135deg, #059669, #065F46);
    color: #fff; box-shadow: 0 4px 16px rgba(5,150,105,.28);
    transition: filter .15s, transform .15s; margin-top: 4px;
  }
  .terminer-btn:hover { filter: brightness(.92); transform: translateY(-1px); }

  /* ── QK inline edit bar ── */
  .qk-edit-bar {
    background: #fff;
    border: 1px solid #E2E8F0;
    border-radius: 14px;
    padding: 14px 18px;
    display: flex;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;
    margin-top: 14px;
  }
`;

function Spin({ dark }) {
  return <span className={`leoni-spin${dark?' leoni-spin-dark':''}`}/>;
}

/* ═══════════════════════════════════════════════════════════════
   ICÔNES SVG
═══════════════════════════════════════════════════════════════ */
const Icon = {
  upload:  (c='currentColor') => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>,
  edit:    (c='currentColor') => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  check:   (c='currentColor') => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>,
  trash:   (c='currentColor') => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/></svg>,
  file:    (c='currentColor') => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>,
  plus:    (c='currentColor') => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  target:  (c='currentColor') => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>,
  chart:   (c='currentColor') => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
  tool:    (c='currentColor') => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12h6m6 0h6M9 5v14m6-14v14"/><rect x="5" y="8" width="14" height="8" rx="1"/></svg>,
  clipboardCheck: (c='currentColor') => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 3h6a2 2 0 0 1 2 2v1H7V5a2 2 0 0 1 2-2z"/><rect x="7" y="4" width="10" height="18" rx="2"/><path d="M9 12l2 2 4-4"/></svg>,
  pdf:     (c='currentColor') => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>,
  cycle:   (c='currentColor') => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"/><path d="M7 12a5 5 0 0 1 5-5m0 10a5 5 0 0 1-5-5"/><path d="M12 7v10M9 12h6"/></svg>,
  shield:  (c='currentColor') => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  eye:     (c='currentColor') => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>,
  arrow:   (c='currentColor') => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.5" strokeLinecap="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>,
  replace: (c='currentColor') => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round"><polyline points="1 4 1 10 7 10"/><polyline points="23 20 23 14 17 14"/><path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4-4.64 4.36A9 9 0 0 1 3.51 15"/></svg>,
  download:(c='currentColor') => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>,
  lock:    (c='currentColor') => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>,
};

/* ═══════════════════════════════════════════════════════════════
   TOPBAR
═══════════════════════════════════════════════════════════════ */
function StepBar({ steps, qkColor, onSelect, auditRef, auditPlant, auditDate }) {
  const navigate = useNavigate();
  const [backingOut, setBackingOut] = useState(false);
  const done   = steps.filter(s => s.done).length;
  const pct    = Math.round(done / steps.length * 100);
  const doneClr = qkColor === 'ORANGE' ? T.orange
    : qkColor === 'ROSE'   ? T.rose
    : qkColor === 'ROUGE'  ? T.danger
    : T.success;

  return (
    <div className="leoni-topbar" style={{
      background: '#002855',
      boxShadow: '0 8px 32px rgba(0,40,85,.16)',
      borderRadius: '30px',
      transition: 'all .4s ease',
      margin: '12px',
      position: 'relative',
      overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute', bottom: 0, left: 0, height: 3,
        width: `${pct}%`,
        background: doneClr,
        transition: 'width .6s cubic-bezier(0.34, 1.56, 0.64, 1)',
        boxShadow: `0 0 12px ${doneClr}88`,
      }}/>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        gap: 12, padding: '1rem 1.5rem',
        overflowX: 'auto', maxWidth: 1260, margin: '0 auto',
        flexWrap: 'nowrap',
      }}>
        <button
          onClick={() => {
            setBackingOut(true);
            window.setTimeout(() => navigate('/auditeur/audits'), 120);
          }}
          title="Retour à la liste des audits"
          aria-label="Retour à la liste des audits"
          style={{
            width: 42, height: 42, borderRadius: '50%',
            background: 'rgba(255,255,255,.12)',
            border: '1.5px solid rgba(255,255,255,.25)',
            color: '#fff',
            cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
            transition: 'all .25s ease',
            boxShadow: '0 4px 14px rgba(0,0,0,.12)',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = 'rgba(255,255,255,.2)';
            e.currentTarget.style.transform = 'translateY(-1px)';
            e.currentTarget.style.boxShadow = '0 8px 22px rgba(0,0,0,.18)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'rgba(255,255,255,.12)';
            e.currentTarget.style.transform = 'none';
            e.currentTarget.style.boxShadow = '0 4px 14px rgba(0,0,0,.12)';
          }}
        >
          <span style={{ display: 'inline-flex', transform: 'rotate(180deg)' }}>
            {Icon.arrow('#fff')}
          </span>
        </button>

        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          gap: 0, flex: 1,
          flexWrap: 'nowrap',
        }}>
        {steps.map((step, i) => {
          const isDone   = step.done;
          const isActive = !isDone && (i === 0 || steps[i-1]?.done);
          return (
            <div key={step.key} style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
            <div
              onClick={() => !step.disabled && onSelect && onSelect(step.key)}
              title={step.label}
              style={{
                display: 'flex', alignItems: 'center', gap: 9,
                padding: '.4rem .85rem', borderRadius: 10,
                cursor: step.disabled ? 'not-allowed' : 'pointer',
                opacity: step.disabled ? 0.5 : 1,
                transition: 'all .25s cubic-bezier(0.34, 1.56, 0.64, 1)',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,.08)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <div style={{
                width: 32, height: 32, borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 800, fontSize: 12, flexShrink: 0,
                background: isDone ? doneClr : isActive ? '#fff' : 'rgba(152,152,152,.35)',
                color:      isDone ? '#fff'  : isActive ? '#002855' : 'rgba(255,255,255,.4)',
                border:     isDone ? `2px solid ${doneClr}` : isActive ? '2px solid #fff' : '2px solid rgba(255,255,255,.18)',
                boxShadow:  isDone ? `0 0 0 3px ${doneClr}33` : isActive ? '0 3px 12px rgba(255,255,255,.25)' : 'none',
                transition: 'all .3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                transform: isActive ? 'scale(1.1)' : 'scale(1)',
              }}>
                {isDone ? Icon.check('#fff') : <span>{i + 1}</span>}
              </div>
              <span style={{
                fontSize: '.74rem', fontWeight: isDone || isActive ? 700 : 500,
                color: isDone ? 'rgba(255,255,255,.88)' : isActive ? '#fff' : 'rgba(255,255,255,.38)',
                whiteSpace: 'nowrap', letterSpacing: '.2px',
                transition: 'all .25s ease',
              }}>
                {step.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div style={{ width: 1, height: 20, background: 'rgba(255,255,255,.13)', flexShrink: 0 }}/>
            )}
            </div>
          );
        })}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   COMPOSANTS GÉNÉRAUX
═══════════════════════════════════════════════════════════════ */
const overlay = {
  position: 'fixed', inset: 0, background: 'rgba(0,10,30,.65)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  zIndex: 1200, backdropFilter: 'blur(8px)',
};

function Card({ children, style: sx = {} }) {
  return (
    <div style={{
      background: '#fff', borderRadius: 16,
      border: '1px solid #E2E8F0',
      boxShadow: '0 4px 18px rgba(0,40,85,.13), 0 1.5px 5px rgba(0,0,0,.07)',
      padding: '1.5rem',
      ...sx,
    }}>
      {children}
    </div>
  );
}

function Badge({ children, color, bg, bd }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '3px 10px', borderRadius: 99,
      background: bg, color, border: `1px solid ${bd}`,
      fontSize: '.7rem', fontWeight: 700, letterSpacing: '.04em',
    }}>
      {children}
    </span>
  );
}

function ActionButton({ children, onClick, disabled, variant = 'primary', size = 'md', full = false, loading: isLoading = false, style: sx = {} }) {
  const [hov, setHov] = useState(false);
  const styles = {
    primary: { bg: '#001F4E', bgH: '#002d72', color: '#fff' },
    success: { bg: '#059669', bgH: '#047857', color: '#fff' },
    danger:  { bg: '#DC2626', bgH: '#B91C1C', color: '#fff' },
    ghost:   { bg: 'transparent', bgH: '#F1F5F9', color: '#374151', border: '1.5px solid #D1D5DB' },
    orange:  { bg: T.orange, bgH: '#b45309', color: '#fff' },
    rose:    { bg: T.rose, bgH: '#831843', color: '#fff' },
    info:    { bg: T.info, bgH: '#1d4ed8', color: '#fff' },
    teal:    { bg: T.teal, bgH: '#0f766e', color: '#fff' },
    purple:  { bg: T.purple, bgH: '#6D28D9', color: '#fff' },
  };
  const s   = styles[variant] || styles.primary;
  const pad = size === 'sm' ? '7px 14px' : size === 'lg' ? '13px 28px' : '9px 20px';
  const fs  = size === 'sm' ? '.76rem' : size === 'lg' ? '.95rem' : '.83rem';
  return (
    <button
      onClick={disabled || isLoading ? undefined : onClick}
      disabled={disabled || isLoading}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 7,
        padding: pad, fontSize: fs, fontWeight: 700,
        fontFamily: "'Plus Jakarta Sans','DM Sans',sans-serif",
        borderRadius: 10, cursor: disabled || isLoading ? 'not-allowed' : 'pointer',
        border: s.border || 'none',
        background: disabled ? '#E5E7EB' : hov ? s.bgH : s.bg,
        color: disabled ? '#9CA3AF' : s.color,
        boxShadow: disabled ? 'none' : `0 2px 8px ${s.bg}40`,
        transform: hov && !disabled ? 'translateY(-1px)' : 'none',
        transition: 'all .15s', width: full ? '100%' : 'auto',
        ...sx,
      }}
    >
      {isLoading ? <Spin/> : null}
      {children}
    </button>
  );
}

/* ═══════════════════════════════════════════════════════════════
   QK GAUGE
═══════════════════════════════════════════════════════════════ */
function QKGauge({ value, color, size = 140 }) {
  const meta     = QK_META[color];
  if (!meta) return null;
  const numValue = typeof value === 'number' ? value : parseFloat(value) || 0;
  const pct      = Math.min(100, (numValue / 5) * 100);
  const r        = 52, circ = 2 * Math.PI * r;
  const sd       = circ - (pct / 100) * circ;
  const display  = Number.isInteger(numValue) ? numValue.toString() : numValue.toFixed(1);
  return (
    <svg width={size} height={size} viewBox="0 0 140 140">
      <circle cx="70" cy="70" r={r} fill="none" stroke="#ccdced" strokeWidth="10"/>
      <circle cx="70" cy="70" r={r} fill="none" stroke={meta.color} strokeWidth="10"
        strokeDasharray={circ} strokeDashoffset={sd} strokeLinecap="round"
        style={{ transform: 'rotate(-90deg)', transformOrigin: '70px 70px', transition: 'stroke-dashoffset .8s ease' }}/>
      <text x="70" y="65" textAnchor="middle" fill={meta.color} fontSize="28" fontWeight="900" fontFamily="'Plus Jakarta Sans',sans-serif">{display}</text>
      <text x="70" y="85" textAnchor="middle" fill="#9CA3AF" fontSize="10" fontWeight="600">QK</text>
    </svg>
  );
}

/* ═══════════════════════════════════════════════════════════════
   ANNEXE CARD
═══════════════════════════════════════════════════════════════ */
function AnnexeCard({ ann, onFill, onImport, onReplace, onRemove, readOnly, actionsLocked = false }) {
  const [hov, setHov] = useState(false);
  const tc    = TAG_COLOR[ann.tag] || TAG_COLOR['Commun'];
  const isOk  = ann.importe || ann.formValide;
  const hasDraft = ann.formData && Object.keys(ann.formData).length > 0 && !ann.formValide;

  const statusCfg = isOk
    ? { color: T.success, bg: T.successBg, bd: T.successBd, label: 'Complète',    dot: '#059669' }
    : hasDraft
    ? { color: T.warn,    bg: T.warnBg,    bd: T.warnBd,    label: 'Brouillon',   dot: '#C8982A' }
    : { color: '#9CA3AF', bg: '#F3F4F6',   bd: '#E5E7EB',   label: 'À compléter', dot: '#D1D5DB' };

  return (
    <div
      className="ann-row"
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: isOk ? '#FAFFFE' : hasDraft ? '#FFFDF5' : '#fff',
        border: `1.5px solid ${hov ? (isOk ? T.successBd : '#CBD5E1') : (isOk ? '#D1FAE5' : '#E2E8F0')}`,
        borderRadius: 14, padding: '1rem 1.25rem',
        display: 'flex', alignItems: 'center', gap: 14,
        boxShadow: hov ? '0 6px 20px rgba(0,0,0,.08)' : '0 2px 8px rgba(0,40,85,.08)',
        transition: 'all .18s',
      }}
    >
      <div style={{ width: 4, height: 48, borderRadius: 99, background: isOk ? T.success : hasDraft ? T.warn : '#E2E8F0', flexShrink: 0 }}/>
      <div style={{ width: 44, height: 44, borderRadius: 12, background: tc.bg, color: tc.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 900, flexShrink: 0, border: `1px solid ${tc.color}30`, letterSpacing: '.03em' }}>
        {ann.typeAnnexe}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
          <div style={{ fontWeight: 700, fontSize: '.87rem', color: '#001F4E' }}>{ann.name}</div>
          <Badge color={statusCfg.color} bg={statusCfg.bg} bd={statusCfg.bd}>
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: statusCfg.dot, display: 'inline-block' }}/>
            {statusCfg.label}
          </Badge>
          {ann.valeurQkExtraite != null && (
            <Badge color={T.rose} bg={T.roseBg} bd={T.roseBd}>QK: {ann.valeurQkExtraite}</Badge>
          )}
        </div>
        <div style={{ fontSize: '.73rem', color: '#9CA3AF', lineHeight: 1.4 }}>{ann.desc}</div>
        {ann.fichierNom && (
          <div style={{ fontSize: '.7rem', color: T.success, fontWeight: 600, marginTop: 3, display: 'flex', alignItems: 'center', gap: 4 }}>
            {Icon.file(T.success)} {ann.fichierNom}
          </div>
        )}
      </div>
      {!readOnly && (
        <div style={{ display: 'flex', gap: 6, flexShrink: 0, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          {!ann.importe && (!actionsLocked || !ann.formValide) ? (
            <ActionButton variant={ann.formValide ? 'ghost' : 'success'} size="sm" onClick={() => onFill(ann)}>
              {Icon.edit(ann.formValide ? '#374151' : '#fff')}
              {ann.formValide ? 'Modifier' : 'Remplir'}
            </ActionButton>
          ) : null}
          {!ann.formValide && !ann.importe && (
            <label style={{ cursor: 'pointer' }}>
              <input type="file" hidden accept=".pdf,.xlsx,.xls,.jpg,.png,.jpeg,.doc,.docx"
                onChange={e => e.target.files[0] && onImport(ann.typeAnnexe, e.target.files[0])}/>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '7px 14px', borderRadius: 10, fontSize: '.76rem', fontWeight: 700, background: T.infoBg, color: T.info, border: `1.5px solid ${T.infoBd}`, cursor: 'pointer' }}>
                {Icon.upload(T.info)} Importer
              </span>
            </label>
          )}
          {ann.importe && (
            <label style={{ cursor: 'pointer' }}>
              <input type="file" hidden accept=".pdf,.xlsx,.xls,.jpg,.png,.jpeg"
                onChange={e => e.target.files[0] && onReplace(ann.typeAnnexe, e.target.files[0])}/>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '7px 14px', borderRadius: 10, fontSize: '.76rem', fontWeight: 700, background: '#F8FAFC', color: '#64748B', border: '1.5px solid #CBD5E1', cursor: 'pointer' }}>
                {Icon.replace('#64748B')} Remplacer
              </span>
            </label>
          )}
          <button onClick={() => onRemove(ann.typeAnnexe)}
            style={{ width: 34, height: 34, borderRadius: 9, border: `1.5px solid ${T.dangerBd}`, background: T.dangerBg, color: T.danger, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {Icon.trash(T.danger)}
          </button>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MODAL FILL ANNEXE
═══════════════════════════════════════════════════════════════ */
const FORM_MAP_LAZY = {
  '1A': FormAnnexe1A, '1B': FormAnnexe1B, '4': FormAnnexe4, '5': FormAnnexe5,
  '6': FormAnnexe6, '7': FormAnnexe7, '7A': FormAnnexe7A, '8': FormAnnexe8,
  '10': FormAnnexe10, '11A': FormAnnexe11A, '11B': FormAnnexe11B, '11C': FormAnnexe11C,
  '13A': FormAnnexe13A, '13B': FormAnnexe13B, '13C': FormAnnexe13C, '13D': FormAnnexe13D,
  'PSA': FormAnnexePSA, 'DPE': FormAnnexeDPE,
};

function FillAnnexeModal({ annexe, onClose, onSave, injectedDefauts, auditInfo, onDraftChange }) {
  const [local, setLocal] = useState(annexe?.formData || {});
  const type     = annexe?.typeAnnexe;
  const FormComp = FORM_MAP_LAZY[type] || null;

  useEffect(() => {
    onDraftChange?.(local);
  }, [local, onDraftChange]);

  return (
    <div style={overlay}>
      <div style={{ background: '#fff', borderRadius: 20, width: '98vw', maxWidth: 1020, maxHeight: '95vh', display: 'flex', flexDirection: 'column', boxShadow: '0 40px 100px rgba(0,0,0,.35)', overflow: 'hidden', animation: 'popIn .22s ease' }}>
        <div style={{ background: 'linear-gradient(135deg,#001F4E,#003F8A)', padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div>
            <div style={{ fontWeight: 900, color: '#fff', fontSize: 14, display: 'flex', alignItems: 'center', gap: 8 }}>{Icon.file('#fff')} {annexe?.name}</div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,.5)', marginTop: 2 }}>{annexe?.desc}</div>
          </div>
          <button onClick={() => onClose(local)} style={{ background: 'rgba(255,255,255,.1)', border: '1px solid rgba(255,255,255,.2)', borderRadius: 9, width: 32, height: 32, cursor: 'pointer', color: '#fff', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
        </div>
        <div style={{ padding: '18px 22px', overflowY: 'auto', flex: 1 }}>
          {type === '1B' ? <FormAnnexe1B data={local} onChange={setLocal} injectedDefauts={injectedDefauts || []} auditInfo={auditInfo || {}}/>
            : type === '1A' ? <FormAnnexe1A data={local} onChange={setLocal} auditInfo={auditInfo || {}}/>
            : FormComp ? <FormComp data={local} onChange={setLocal} auditInfo={auditInfo || {}}/>
            : (
              <div style={{ textAlign: 'center', padding: '3rem', color: '#9CA3AF' }}>
                <div style={{ fontWeight: 700, marginBottom: 6 }}>Formulaire non disponible</div>
                <div style={{ fontSize: 12 }}>Utilisez le bouton Importer pour téléverser le fichier.</div>
              </div>
            )}
        </div>
        <div style={{ padding: '12px 22px', borderTop: '1px solid #E2E8F0', display: 'flex', gap: 8, justifyContent: 'flex-end', background: '#F8FAFC', flexShrink: 0 }}>
          <ActionButton variant="ghost" onClick={() => onClose(local)}>Sauvegarder brouillon</ActionButton>
          <ActionButton variant="success" onClick={() => onSave(local)}>{Icon.check('#fff')} Valider l'annexe</ActionButton>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MODAL ADD ANNEXE
═══════════════════════════════════════════════════════════════ */
function AddAnnexeModal({ existing, onClose, onAdd }) {
  const [tab, setTab] = useState('COMMUN');
  const [sel, setSel] = useState(new Set());

  const existIds = new Set(existing.map(a => a.typeAnnexe || a.id));

  const tabs = [
    { k: 'COMMUN',     l: 'Communes'   },
    { k: 'BMW',        l: 'BMW'        },
    { k: 'VW',         l: 'VW/Audi'   },
    { k: 'MOTEUR_SUD', l: 'Moteur Sud' },
  ];

  const availableInTab = (ALL_ANNEXES[tab] || []).filter(a => !existIds.has(a.id));

  const available = Array.from(
    new Map(
      [...(ALL_ANNEXES.COMMUN || []), ...(ALL_ANNEXES[tab] || [])]
        .map(a => [a.id, a])
    ).values()
  ).filter(a => !existIds.has(a.id));

  const toggle = id => {
    const n = new Set(sel);
    n.has(id) ? n.delete(id) : n.add(id);
    setSel(n);
  };

  const allTabSelected = availableInTab.length > 0 && availableInTab.every(a => sel.has(a.id));

  const toggleAllTab = () => {
    const n = new Set(sel);
    if (allTabSelected) {
      availableInTab.forEach(a => n.delete(a.id));
    } else {
      availableInTab.forEach(a => n.add(a.id));
    }
    setSel(n);
  };

  const clearAll = () => setSel(new Set());

  const countByTab = k => (ALL_ANNEXES[k] || []).filter(a => !existIds.has(a.id)).length;

  return (
    <div style={overlay}>
      <div style={{
        background: '#fff', borderRadius: 20, width: '100%', maxWidth: 580,
        maxHeight: '86vh', display: 'flex', flexDirection: 'column',
        boxShadow: '0 32px 80px rgba(0,0,0,.28)', overflow: 'hidden',
        animation: 'popIn .2s ease', border: '1px solid #CBD5E1',
      }}>
        <div style={{
          background: 'linear-gradient(135deg,#001F4E,#003F8A)',
          padding: '14px 18px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexShrink: 0,
        }}>
          <div style={{ fontWeight: 800, color: '#F8FAFC', fontSize: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
            {Icon.plus('#fff')} Ajouter des annexes
          </div>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,.1)', border: 'none', borderRadius: 8, width: 28, height: 28, cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
        </div>

        <div style={{ padding: '14px 18px', overflowY: 'auto', flex: 1 }}>
          <div style={{ display: 'flex', gap: 6, marginBottom: 12, background: '#E2E8F0', padding: 4, borderRadius: 10, border: '1px solid #CBD5E1' }}>
            {tabs.map(t => {
              const count = countByTab(t.k);
              const isActive = tab === t.k;
              return (
                <button key={t.k} onClick={() => setTab(t.k)} style={{
                  flex: 1, padding: '6px 6px', borderRadius: 7, border: 'none',
                  fontSize: 11, fontWeight: 700, cursor: 'pointer',
                  background: isActive ? '#FFFFFF' : 'transparent',
                  color: isActive ? '#001F4E' : '#334155',
                  boxShadow: isActive ? '0 2px 8px rgba(15,23,42,.12)' : 'none',
                  transition: 'all .15s',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                }}>
                  {t.l}
                  {count > 0 && (
                    <span style={{ fontSize: 9, fontWeight: 900, padding: '1px 5px', borderRadius: 99, lineHeight: 1.5, background: isActive ? '#001F4E' : '#CBD5E1', color: isActive ? '#fff' : '#334155', minWidth: 16, textAlign: 'center' }}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {availableInTab.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, padding: '8px 12px', background: allTabSelected ? '#EAF2FF' : '#F8FAFC', border: `1.5px solid ${allTabSelected ? T.info : '#E2E8F0'}`, borderRadius: 10, transition: 'all .2s' }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: allTabSelected ? T.info : '#475569' }}>
                {allTabSelected ? `✓ Tout sélectionné (${availableInTab.length})` : `${availableInTab.length} annexe${availableInTab.length > 1 ? 's' : ''} disponible${availableInTab.length > 1 ? 's' : ''} dans ce groupe`}
              </span>
              <button onClick={toggleAllTab} style={{ padding: '5px 12px', borderRadius: 7, border: 'none', fontSize: 11, fontWeight: 800, cursor: 'pointer', background: allTabSelected ? T.dangerBg : T.infoBg, color: allTabSelected ? T.danger : T.info, border: `1px solid ${allTabSelected ? T.dangerBd : T.infoBd}`, transition: 'all .15s', display: 'flex', alignItems: 'center', gap: 5 }}>
                {allTabSelected ? <>{Icon.trash(T.danger)} Tout désélectionner</> : <>{Icon.check(T.info)} Tout sélectionner</>}
              </button>
            </div>
          )}

          {available.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#334155', fontSize: 13 }}>
              Toutes les annexes disponibles sont déjà ajoutées.
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {available.map(a => {
                const tc  = TAG_COLOR[a.tag] || TAG_COLOR['Commun'];
                const isS = sel.has(a.id);
                return (
                  <div key={a.id} onClick={() => toggle(a.id)} style={{ padding: '12px 14px', borderRadius: 12, border: `2px solid ${isS ? T.info : '#CBD5E1'}`, cursor: 'pointer', background: isS ? '#EAF2FF' : '#FFFFFF', transition: 'all .15s', boxShadow: isS ? `0 0 0 3px ${T.info}20` : '0 1px 3px rgba(15,23,42,.04)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
                      <div style={{ width: 32, height: 32, borderRadius: 8, background: '#FFFFFF', color: tc.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, fontWeight: 900, border: `1px solid ${tc.color}30` }}>
                        {a.id}
                      </div>
                      <div style={{ fontWeight: 800, fontSize: 12, color: '#0F172A', flex: 1 }}>{a.name}</div>
                      {isS && (
                        <div style={{ width: 20, height: 20, borderRadius: '50%', background: T.info, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          {Icon.check('#fff')}
                        </div>
                      )}
                    </div>
                    <div style={{ fontSize: 10, color: '#475569', lineHeight: 1.4 }}>{a.desc}</div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div style={{ padding: '12px 18px', borderTop: '1px solid #CBD5E1', display: 'flex', gap: 8, justifyContent: 'space-between', background: '#F8FAFC', flexShrink: 0, alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ fontSize: '.78rem', color: '#0F172A', fontWeight: 600 }}>{sel.size} sélectionnée(s)</div>
            {sel.size > 0 && (
              <button onClick={clearAll} style={{ padding: '4px 10px', borderRadius: 7, border: `1px solid ${T.dangerBd}`, background: T.dangerBg, color: T.danger, fontSize: 11, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                {Icon.trash(T.danger)} Tout effacer
              </button>
            )}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <ActionButton variant="ghost" onClick={onClose}>Annuler</ActionButton>
            <ActionButton variant="primary" onClick={() => { if (sel.size) onAdd([...sel]); else alert('Sélectionnez au moins une annexe'); }}>
              {Icon.plus('#fff')} Ajouter {sel.size > 0 ? `(${sel.size})` : ''}
            </ActionButton>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MODAL FICHE DE RÉPARATION
═══════════════════════════════════════════════════════════════ */
const isBlankValue = v => v === undefined || v === null || v === '';

function buildFicheInitialForm(source = null) {
  const s = source || {};
  const emailsExternes = Array.isArray(s.emailsExternesListe)
    ? s.emailsExternesListe
    : typeof s.emailsExternesListe === 'string'
      ? s.emailsExternesListe.split(',').map(v => v.trim()).filter(Boolean)
      : [];

  return {
    zoneAffectee:  s.zoneAffectee  ?? s.zone       ?? '',
    origineNC:     s.origineNC     ?? s.origine     ?? s.causeRacine ?? '',
    codeArticle:   s.codeArticle   ?? s.article     ?? '',
    descriptionNC: s.descriptionNC ?? s.description ?? s.probleme   ?? '',
    remarques:     s.remarques     ?? s.commentaires ?? '',
    destinataires:
      Array.isArray(s.destinataires) && s.destinataires.length > 0
        ? s.destinataires.map(d => ({
            utilisateurId: d.utilisateurId ?? null,
            email: d.email ?? '',
            nom: d.nom ?? '',
          }))
        : emailsExternes.length > 0
          ? emailsExternes.map(email => ({ utilisateurId: null, email, nom: '' }))
          : [{ utilisateurId: null, email: s.emailExterne ?? '', nom: '' }],
  };
}

function mergeFicheForm(base, draft) {
  if (!draft) return base;
  const merged = { ...base };
  ['zoneAffectee', 'origineNC', 'codeArticle', 'descriptionNC', 'remarques'].forEach(key => {
    if (!isBlankValue(draft[key])) merged[key] = draft[key];
  });
  if (Array.isArray(draft.destinataires) && draft.destinataires.length > 0) {
    merged.destinataires = draft.destinataires.map((item, index) => {
      const fallback = base.destinataires[index] || { utilisateurId: null, email: '', nom: '' };
      return {
        utilisateurId: item?.utilisateurId ?? fallback.utilisateurId ?? null,
        email: !isBlankValue(item?.email) ? item.email : (fallback.email ?? ''),
        nom: !isBlankValue(item?.nom) ? item.nom : (fallback.nom ?? ''),
      };
    });
  }
  return merged;
}

function FicheReparationModal({ auditId, qkValue, initialData, onClose, onSent }) {
  const [chefServices, setChefServices] = useState([]);
  const [form, setForm] = useState(() => {
    const baseForm = buildFicheInitialForm(initialData ?? null);
    try {
      const draft = JSON.parse(localStorage.getItem(modalKey(auditId, 'fiche')) || 'null');
      return draft ? mergeFicheForm(baseForm, draft) : baseForm;
    } catch {
      return baseForm;
    }
  });
  const [sending, setSending] = useState(false);
  const [err, setErr] = useState('');
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  useEffect(() => {
    fetchJson(`${API}/utilisateurs/roles/chefs-service`, { headers: apiH() })
      .then(r => setChefServices(Array.isArray(r) ? r : [])).catch(() => setChefServices([]));
  }, []);

  useEffect(() => { try { localStorage.setItem(modalKey(auditId, 'fiche'), JSON.stringify(form)); } catch {} }, [auditId, form]);

  const updDest = (i, field, value) => {
    const next = form.destinataires.map((d, j) => {
      if (j !== i) return d;
      if (field === 'utilisateurId') {
        const u = chefServices.find(c => String(c.id) === String(value));
        return { utilisateurId: value ? parseInt(value) : null, email: u ? u.email : '', nom: u ? `${u.prenom} ${u.nom}` : '' };
      }
      if (field === 'email') return { ...d, utilisateurId: null, email: value };
      return { ...d, [field]: value };
    });
    set('destinataires', next);
  };

  const addDest = () => set('destinataires', [...form.destinataires, { utilisateurId: null, email: '', nom: '' }]);
  const remDest = i  => set('destinataires', form.destinataires.filter((_, j) => j !== i));

  const send = async () => {
    setSending(true); setErr('');
    try {
      const destinataires = form.destinataires
        .filter(d => d.utilisateurId || d.email?.trim())
        .map(d => d.utilisateurId ? { utilisateurId: d.utilisateurId } : { email: d.email.trim(), nom: d.nom?.trim() || '' });
      if (destinataires.length === 0) { setErr('Ajoutez au moins un destinataire.'); setSending(false); return; }
      const res = await fetch(`${API}/audit-produit/${auditId}/fiche-reparation`, {
        method: 'POST', headers: apiH(),
        body: JSON.stringify({ zoneAffectee: form.zoneAffectee || '', origineNC: form.origineNC || '', codeArticle: form.codeArticle || '', descriptionNC: form.descriptionNC || '', remarquesOptionnelles: form.remarques || '', destinataires }),
      });
      if (!res.ok) throw new Error(await res.text());
      try { localStorage.removeItem(modalKey(auditId, 'fiche')); } catch {}
      onSent();
    } catch (e) { setErr(e.message || 'Erreur envoi'); }
    setSending(false);
  };

  const inp = { width: '100%', padding: '9px 12px', borderRadius: 9, border: '1.5px solid #CBD5E1', fontSize: 13, fontFamily: 'inherit', background: '#F3F4F6', outline: 'none', boxSizing: 'border-box', color: '#0F172A' };
  const lbl = { display: 'block', fontSize: 9, fontWeight: 800, color: '#374151', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '.07em' };

  return (
    <div style={overlay}>
      <div style={{ background: '#EEF2F6', borderRadius: 20, width: '100%', maxWidth: 680, overflow: 'hidden', boxShadow: '0 32px 80px rgba(0,0,0,.28)', maxHeight: '92vh', display: 'flex', flexDirection: 'column', animation: 'popIn .2s ease' }}>
        <div style={{ background: `linear-gradient(135deg,${T.orange},#b45309)`, padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div>
            <div style={{ fontWeight: 900, color: '#fff', fontSize: 14, display: 'flex', alignItems: 'center', gap: 8 }}>{Icon.tool('#fff')} Fiche de Réparation</div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,.7)', marginTop: 2 }}>QK = {qkValue}</div>
          </div>
          <button onClick={onClose} style={{ background: 'rgba(0,0,0,.18)', border: '1px solid rgba(255,255,255,.28)', borderRadius: 8, width: 28, height: 28, cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
        </div>
        <div style={{ padding: '18px 22px', overflowY: 'auto', flex: 1 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
            <div>
              <label style={lbl}>Zone affectée</label>
              <select style={inp} value={form.zoneAffectee} onChange={e => set('zoneAffectee', e.target.value)}>
                <option value="">-- Sélectionner --</option>
                {['réception','production','magasin','expéditions','autre plant','magasin avance','client'].map(z => <option key={z}>{z}</option>)}
              </select>
            </div>
            <div>
              <label style={lbl}>Origine NC</label>
              <input style={inp} value={form.origineNC} onChange={e => set('origineNC', e.target.value)} placeholder="audit produit"/>
            </div>
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={lbl}>Code article</label>
            <input style={inp} value={form.codeArticle} onChange={e => set('codeArticle', e.target.value)}/>
          </div>
          <div style={{ marginBottom: 14 }}>
            <label style={lbl}>Description NC *</label>
            <textarea rows={3} style={{ ...inp, resize: 'vertical' }} value={form.descriptionNC} onChange={e => set('descriptionNC', e.target.value)}/>
          </div>
          <div style={{ marginBottom: 14 }}>
            <label style={lbl}>Destinataires</label>
            <div style={{ background: T.infoBg, border: `1px solid ${T.infoBd}`, borderRadius: 8, padding: '8px 12px', marginBottom: 10, fontSize: 11, color: '#1D4ED8' }}>
              Sélectionnez un chef de service <strong>et/ou</strong> ajoutez des emails externes.
            </div>
            {form.destinataires.map((d, i) => (
              <div key={i} style={{ background: '#fff', border: '1.5px solid #E2E8F0', borderRadius: 12, padding: '12px 14px', marginBottom: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <div style={{ fontSize: 10, fontWeight: 800, color: '#5C6F8A', textTransform: 'uppercase', letterSpacing: '.06em' }}>Destinataire {i + 1}</div>
                  {form.destinataires.length > 1 && (
                    <button onClick={() => remDest(i)} style={{ width: 26, height: 26, borderRadius: 7, border: `1px solid ${T.dangerBd}`, background: T.dangerBg, color: T.danger, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12 }}>✕</button>
                  )}
                </div>
                <div style={{ marginBottom: 8 }}>
                  <label style={{ ...lbl, color: T.info }}>Chef de service (plateforme)</label>
                  <select style={{ ...inp, background: d.utilisateurId ? T.infoBg : '#F3F4F6', borderColor: d.utilisateurId ? T.info : '#CBD5E1' }} value={d.utilisateurId || ''} onChange={e => updDest(i, 'utilisateurId', e.target.value)}>
                    <option value="">-- Aucun (saisie email libre) --</option>
                    {chefServices.map(c => <option key={c.id} value={c.id}>{c.prenom} {c.nom} — {c.email}</option>)}
                  </select>
                </div>
                {!d.utilisateurId && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    <div><label style={lbl}>Email externe *</label><input style={inp} type="email" placeholder="resp@entreprise.com" value={d.email} onChange={e => updDest(i, 'email', e.target.value)}/></div>
                    <div><label style={lbl}>Nom (facultatif)</label><input style={inp} placeholder="Nom libre" value={d.nom} onChange={e => updDest(i, 'nom', e.target.value)}/></div>
                  </div>
                )}
                {d.utilisateurId && (
                  <div style={{ fontSize: 12, color: T.info, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                    {Icon.check(T.info)} {d.nom} — {d.email}
                  </div>
                )}
              </div>
            ))}
            <button onClick={addDest} style={{ background: T.infoBg, border: `1px solid ${T.infoBd}`, borderRadius: 8, padding: '7px 14px', fontSize: 12, cursor: 'pointer', color: T.info, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
              {Icon.plus(T.info)} Ajouter un destinataire
            </button>
          </div>
          <div style={{ marginBottom: 14 }}>
            <label style={lbl}>Remarques (facultatif)</label>
            <textarea rows={2} style={{ ...inp, resize: 'vertical' }} value={form.remarques} onChange={e => set('remarques', e.target.value)}/>
          </div>
          {err && <div style={{ background: T.dangerBg, border: `1px solid ${T.dangerBd}`, borderRadius: 8, padding: '8px 12px', fontSize: 12, color: T.danger, marginBottom: 10 }}>{err}</div>}
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <ActionButton variant="ghost" onClick={onClose}>Annuler</ActionButton>
            <ActionButton variant="orange" onClick={send} loading={sending}>Envoyer la fiche</ActionButton>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MODAL PDCA
═══════════════════════════════════════════════════════════════ */
function buildPdcaInitialForm(source = null) {
  const s = source || {};
  return {
    planifier:     s.planifier     ?? '',
    do_:           s.do_           ?? '',
    check:         s.check         ?? '',
    act:           s.act           ?? '',
    responsableId: s.responsableId ?? s.responsableQualiteCentraleId ?? '',
    echeance:      s.echeance      ?? s.dateEcheance ?? '',
    emailExterne:  s.emailExterne  ?? '',
    nomExterne:    s.nomExterne     ?? '',
  };
}

function mergePdcaForm(base, draft) {
  if (!draft) return base;
  const merged = { ...base };
  ['planifier', 'do_', 'check', 'act', 'responsableId', 'echeance', 'emailExterne', 'nomExterne'].forEach(key => {
    if (!isBlankValue(draft[key])) merged[key] = draft[key];
  });
  return merged;
}

function PDCAModal({ auditId, qkValue, initialData, responsables, onClose, onSent }) {
  const [form, setForm] = useState(() => {
    const baseForm = buildPdcaInitialForm(initialData ?? null);
    try {
      const draft = JSON.parse(localStorage.getItem(modalKey(auditId, 'pdca')) || 'null');
      return draft ? mergePdcaForm(baseForm, draft) : baseForm;
    } catch {
      return baseForm;
    }
  });
  const [sending, setSending] = useState(false);
  const [err, setErr] = useState('');
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  useEffect(() => {
    setForm(current => mergePdcaForm(buildPdcaInitialForm(initialData ?? null), current));
  }, [initialData]);

  useEffect(() => { try { localStorage.setItem(modalKey(auditId, 'pdca'), JSON.stringify(form)); } catch {} }, [auditId, form]);

  const send = async () => {
    if (!form.planifier?.trim()) { setErr('Le champ "P — Plan" est obligatoire.'); return; }
    setSending(true); setErr('');
    try {
      const res = await fetch(`${API}/audit-produit/${auditId}/pdca`, {
        method: 'POST', headers: apiH(),
        body: JSON.stringify({ titre: `PDCA - Audit ${auditId}`, description: "PDCA créé depuis l'interface auditeur", planifier: form.planifier.trim(), do_: form.do_?.trim() || '', check: form.check?.trim() || '', act: form.act?.trim() || '', responsableQualiteCentraleId: form.responsableId ? parseInt(form.responsableId) : null, emailExterne: form.emailExterne?.trim() || null, dateEcheance: form.echeance || null, nomDestinataire: 'Responsable Qualité' }),
      });
      if (!res.ok) throw new Error(await res.text());
      try { localStorage.removeItem(modalKey(auditId, 'pdca')); } catch {}
      onSent();
    } catch (e) { setErr(e.message || 'Erreur PDCA'); }
    setSending(false);
  };

  const pdcaItems = [{ k: 'planifier', l: 'P — Plan', c: '#2563EB', bg: '#EFF6FF' }, { k: 'do_', l: 'D — Do', c: '#059669', bg: '#ECFDF5' }, { k: 'check', l: 'C — Check', c: '#7C3AED', bg: '#F5F3FF' }, { k: 'act', l: 'A — Act', c: '#C8982A', bg: '#FFFBEB' }];
  const ta  = { width: '100%', padding: '8px 11px', borderRadius: 8, border: '1.5px solid #CBD5E1', fontSize: 12, fontFamily: 'inherit', background: '#F7FAFC', outline: 'none', boxSizing: 'border-box', resize: 'vertical', color: '#0F172A' };
  const lbl = { display: 'block', fontSize: 9, fontWeight: 800, color: '#374151', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '.07em' };

  return (
    <div style={overlay}>
      <div style={{ background: '#EEF2F6', borderRadius: 20, width: '100%', maxWidth: 620, overflow: 'hidden', boxShadow: '0 32px 80px rgba(0,0,0,.28)', maxHeight: '92vh', display: 'flex', flexDirection: 'column', animation: 'popIn .2s ease' }}>
        <div style={{ background: `linear-gradient(135deg,${T.purple},#6D28D9)`, padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div>
            <div style={{ fontWeight: 900, color: '#fff', fontSize: 14, display: 'flex', alignItems: 'center', gap: 8 }}>{Icon.cycle('#fff')} Plan d'Action PDCA</div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,.7)', marginTop: 2 }}>QK = {qkValue}</div>
          </div>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,.08)', border: 'none', borderRadius: 8, width: 28, height: 28, cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
        </div>
        <div style={{ padding: '18px 22px', overflowY: 'auto', flex: 1 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
            {pdcaItems.map(f => (
              <div key={f.k} style={{ background: f.bg, borderRadius: 10, padding: '10px 12px', border: `1px solid ${f.c}30` }}>
                <label style={{ ...lbl, color: f.c }}>{f.l}</label>
                <textarea rows={3} style={{ ...ta, background: '#fff' }} value={form[f.k]} onChange={e => set(f.k, e.target.value)}/>
              </div>
            ))}
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={lbl}>Responsable Qualité Centrale (plateforme)</label>
            <select style={{ ...ta, resize: 'none', appearance: 'auto', fontSize: 13 }} value={form.responsableId} onChange={e => set('responsableId', e.target.value)}>
              <option value="">-- Sélectionner --</option>
              {responsables.map(r => <option key={r.id} value={r.id}>{r.prenom} {r.nom}</option>)}
            </select>
          </div>
          <div style={{ marginBottom: 12, padding: '10px 12px', background: T.roseBg, border: `1px solid ${T.roseBd}`, borderRadius: 9 }}>
            <label style={{ ...lbl, color: T.rose, marginBottom: 8 }}>OU — Responsable qualité externe</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <input style={{ ...ta, resize: 'none' }} placeholder="Matricule" value={form.nomExterne} onChange={e => set('nomExterne', e.target.value)}/>
              <input style={{ ...ta, resize: 'none' }} placeholder="email@leoni.com" value={form.emailExterne} onChange={e => set('emailExterne', e.target.value)}/>
            </div>
          </div>
          <div style={{ marginBottom: 14 }}>
            <label style={lbl}>Échéance</label>
            <input type="date" style={{ ...ta, resize: 'none', fontSize: 13 }} value={form.echeance} onChange={e => set('echeance', e.target.value)}/>
          </div>
          {err && <div style={{ background: T.dangerBg, border: `1px solid ${T.dangerBd}`, borderRadius: 8, padding: '8px 12px', fontSize: 12, color: T.danger, marginBottom: 10 }}>{err}</div>}
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <ActionButton variant="ghost" onClick={onClose}>Annuler</ActionButton>
            <ActionButton variant="rose" onClick={send} loading={sending}>Envoyer le PDCA</ActionButton>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   CORRECTIVE CARD
═══════════════════════════════════════════════════════════════ */
function CorrCard({ color, bg, bd, iconEmoji, iconNode, title, subtitle, desc, validated, sent, timeline, onAction, actionLabel, actionVariant = 'orange' }) {
  const [hov, setHov] = useState(false);
  const variantMap = {
    orange: { bg: T.navy, bgH: '#002d72', color: '#fff' },
    rose:   { bg: T.navy, bgH: '#002d72', color: '#fff' },
    purple: { bg: T.navy, bgH: '#002d72', color: '#fff' },
    ghost:  { bg: 'transparent', bgH: '#F1F5F9', color: '#374151', border: '1.5px solid #D1D5DB' },
  };
  const v = variantMap[actionVariant] || variantMap.orange;

  return (
    <div className="corr-card" style={{ borderColor: bd }}>
      <div style={{ background: bg, padding: '16px 18px 12px', display: 'flex', alignItems: 'flex-start', gap: 14 }}>
        <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(255,255,255,.65)', border: `1px solid rgba(255,255,255,.8)`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 20 }}>
          {iconNode || iconEmoji}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 800, color: T.navy, fontSize: '.9rem', marginBottom: 4 }}>{title}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', flexShrink: 0, background: validated ? T.success : color, boxShadow: `0 0 0 2px ${validated ? T.success : color}28`, display: 'inline-block' }}/>
            <span style={{ fontSize: '.72rem', fontWeight: 700, color: T.navy }}>{subtitle}</span>
          </div>
        </div>
        <div style={{ padding: '3px 10px', borderRadius: 99, fontSize: '.65rem', fontWeight: 800, background: validated ? T.successBg : sent ? '#EFF6FF' : bg, color: T.navy, border: `1px solid ${validated ? T.successBd : sent ? T.infoBd : bd}`, whiteSpace: 'nowrap', flexShrink: 0 }}>
          {validated ? '✓ Validé' : sent ? 'En attente' : 'Requis'}
        </div>
      </div>

      <div style={{ padding: validated ? '0' : '12px 18px 14px', fontSize: '.76rem', color: T.navy, lineHeight: 1.65, flex: 1, background: '#fff' }}>
        {!validated && desc}
        {timeline && (
          <div style={{ marginTop: 12, padding: '10px 12px', borderRadius: 10, border: '1px solid #E8EDF7', background: '#FAFBFD', display: 'grid', gap: 6 }}>
            <div style={{ fontSize: '.67rem', fontWeight: 800, color: T.g500, textTransform: 'uppercase', letterSpacing: '.06em' }}>{timeline.triggerLabel}</div>
            <div style={{ fontSize: '.72rem', color: T.g700, display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
              <span>Déclenchement</span>
              <strong>{timeline.triggerValue}</strong>
            </div>
          </div>
        )}
      </div>

      <div style={{ padding: '12px 18px', borderTop: '1px solid #cfd8e0', background: '#FAFBFD', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
        <span style={{ flex: 1, minWidth: 0, fontSize: '.72rem', color: T.navy, fontStyle: 'italic', textAlign: 'left' }}>
          {validated ? desc : sent ? 'Soumis, en attente du responsable' : ' '}
        </span>
        {onAction && (
          <button
            onMouseEnter={() => setHov(true)}
            onMouseLeave={() => setHov(false)}
            onClick={onAction}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '8px 16px', fontSize: '.78rem', fontWeight: 700, borderRadius: 9, border: v.border || 'none', cursor: 'pointer', background: hov ? v.bgH : v.bg, color: v.color, fontFamily: 'inherit', transition: 'all .15s', boxShadow: actionVariant !== 'ghost' ? `0 2px 8px ${T.navy}30` : 'none', transform: hov ? 'translateY(-1px)' : 'none' }}>
            {Icon.edit('#fff')}
            {validated || sent ? actionLabel.replace('Créer', 'Modifier') : actionLabel}
          </button>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   QK RESULT CARD
═══════════════════════════════════════════════════════════════ */
function QKResultCard({ qkValue, qkColor, ficheRequired, pdcaRequired, ficheSent, ficheValidee, ficheMeta, pdcaSent, pdcaValidee, pdcaMeta, auditTermine, onOpenFiche, onOpenPDCA, onGenerate, onTerminer, readOnly, auditStatut, canGenerate, rapportGenere, qkInput, onQkInputChange, onQkUpdate, qkLoading, pdfsCorrectives = [], onImportPdfCorrectif, onRemovePdfCorrectif, uploadingPdfCorr }) {
  const meta = QK_META[qkColor];
  if (!meta) return null;

  const numVal          = parseFloat(qkValue) || 0;
  const ficheDone       = ficheValidee || auditTermine;
  const pdcaDone        = pdcaValidee || auditTermine;
  const correctiveDone  = (!ficheRequired || ficheDone) && (!pdcaRequired || pdcaDone);
  const showBoth        = ficheRequired && pdcaRequired;

  const ficheTimeline = ficheRequired ? {
    triggerLabel: 'Fiche de réparation',
    triggerValue: getCorrectionTriggerLabel('fiche', qkColor),
    triggeredAt: getRecordDate(ficheMeta),
    validatedAt: ficheDone ? getRecordDate(ficheMeta) : 'En attente',
  } : null;
  const pdcaTimeline = pdcaRequired ? {
    triggerLabel: 'Plan PDCA',
    triggerValue: getCorrectionTriggerLabel('pdca', qkColor),
    triggeredAt: getRecordDate(pdcaMeta),
    validatedAt: pdcaDone ? getRecordDate(pdcaMeta) : 'En attente',
  } : null;

  return (
    <div className="qk-result-layout">

      {/* ── COLONNE GAUCHE ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

        {/* Bloc Scale QK */}
        <div style={{ background: meta.bg, border: `2px solid ${meta.bd}`, borderRadius: 18, padding: '18px 20px', boxShadow: `0 8px 28px ${meta.color}10` }}>
          <div style={{ fontWeight: 900, fontSize: '.72rem', color: meta.color, textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 12 }}>
            Niveau de criticité
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
            {[
              { label: 'QK = 0',        value: 'Conforme',   key: 'VERT'   },
              { label: '0 < QK ≤ 0.5',  value: 'Mineure',    key: 'ORANGE' },
              { label: '0.5 < QK ≤ 1',  value: 'Corrective', key: 'ROSE'   },
              { label: 'QK > 1',         value: 'Critique',   key: 'ROUGE'  },
            ].map(item => {
              const isActive = item.key === qkColor;
              const im       = QK_META[item.key];
              return (
                <div key={item.label} className={`qk-scale-row${isActive ? ' active' : ''}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '9px 14px', borderRadius: 10, background: isActive ? '#FFFFFF' : 'rgba(255,255,255,.45)', border: `1px solid ${isActive ? im.bd : 'rgba(255,255,255,.75)'}` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', flexShrink: 0, background: isActive ? im.color : '#D1D5DB', boxShadow: isActive ? `0 0 0 3px ${im.color}25` : 'none', transition: 'all .25s' }}/>
                    <span style={{ fontSize: '.8rem', fontWeight: isActive ? 800 : 600, color: isActive ? '#111827' : '#6B7280' }}>{item.label}</span>
                  </div>
                  <span style={{ fontSize: '.72rem', fontWeight: 800, padding: '2px 10px', borderRadius: 99, background: isActive ? `${im.color}18` : 'transparent', color: isActive ? im.color : '#9CA3AF', border: `1px solid ${isActive ? `${im.color}28` : 'transparent'}`, transition: 'all .25s' }}>
                    {item.value}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Cartes correctives */}
        {(ficheRequired || pdcaRequired) && (
          <div className={showBoth ? 'corr-grid' : ''}>
            {ficheRequired && (
              <CorrCard
                color={ficheValidee ? T.success : T.orange}
                bg={ficheValidee ? T.successBg : T.orangeBg}
                bd={ficheValidee ? T.successBd : T.orangeBd}
                iconEmoji="🔧"
                iconNode={Icon.clipboardCheck(ficheValidee ? T.success : T.orange)}
                title="Fiche de Réparation"
                subtitle={ficheDone ? 'Validée par le responsable ✓' : ficheSent ? 'Envoyée — En attente de validation' : 'Requise — Non-conformité détectée'}
                desc={ficheDone ? 'La fiche est validée par le responsable et archivée.' : ficheSent ? 'La fiche a été soumise. Le responsable doit la valider avant de continuer.' : 'Une fiche de réparation est obligatoire pour ce niveau de QK. Remplissez-la et transmettez-la au chef de service.'}
                validated={ficheDone}
                sent={ficheSent}
                timeline={{ triggerLabel: ficheTimeline.triggerLabel, triggerValue: ficheTimeline.triggerValue, triggeredAt: ficheTimeline.triggeredAt, validatedAt: ficheDone ? (ficheMeta?.dateValidation || ficheMeta?.validatedAt || ficheMeta?.updatedAt || ficheMeta?.createdAt || ficheTimeline.validatedAt) : 'En attente' }}
                onAction={readOnly ? null : onOpenFiche}
                actionLabel={ficheSent || ficheDone ? 'Modifier la fiche' : 'Créer la fiche'}
                actionVariant={ficheDone ? 'success' : ficheSent ? 'info' : 'orange'}
              />
            )}
            {pdcaRequired && (
              <CorrCard
                color={pdcaDone ? T.success : T.purple}
                bg={pdcaDone ? T.successBg : T.purpleBg}
                bd={pdcaDone ? T.successBd : T.purpleBd}
                iconEmoji="🔄"
                iconNode={Icon.cycle(pdcaDone ? T.success : T.purple)}
                title="Plan d'Action PDCA"
                subtitle={pdcaDone ? 'Résolu et clôturé ✓' : pdcaSent ? 'Envoyé — En attente de résolution' : 'Requis — Criticité élevée (QK > 0.5)'}
                desc={pdcaDone ? "Le plan PDCA a été exécuté et validé. Le cycle est clôturé." : pdcaSent ? 'Le PDCA est en cours de traitement. Attendez la validation du responsable qualité centrale.' : "Un plan PDCA est requis. Définissez les étapes Plan / Do / Check / Act et assignez un responsable qualité."}
                validated={pdcaDone}
                sent={pdcaSent}
                timeline={{ triggerLabel: pdcaTimeline.triggerLabel, triggerValue: pdcaTimeline.triggerValue, triggeredAt: pdcaTimeline.triggeredAt, validatedAt: pdcaDone ? (pdcaMeta?.dateValidation || pdcaMeta?.validatedAt || pdcaMeta?.updatedAt || pdcaMeta?.createdAt || pdcaTimeline.validatedAt) : 'En attente' }}
                onAction={readOnly ? null : onOpenPDCA}
                actionLabel={pdcaSent || pdcaDone ? 'Modifier le PDCA' : 'Créer le PDCA'}
                actionVariant={pdcaDone ? 'success' : pdcaSent ? 'info' : 'rose'}
              />
            )}
          </div>
        )}

        {/* Barre générer rapport */}
        {!readOnly && correctiveDone && auditStatut !== 'TERMINE' && (
          <div className="gen-bar" style={{ background: rapportGenere ? T.successBg : T.tealBg, borderColor: rapportGenere ? T.successBd : T.tealBd }}>
            <div style={{ flex: 1, minWidth: 180 }}>
              <div style={{ fontWeight: 800, color: rapportGenere ? T.success : T.teal, fontSize: '.88rem', marginBottom: 3, display: 'flex', alignItems: 'center', gap: 8 }}>
                {Icon.pdf(rapportGenere ? T.success : T.teal)}
                {rapportGenere ? 'Rapport généré' : 'Rapport Final'}
              </div>
              <div style={{ fontSize: '.74rem', color: '#6B7280', lineHeight: 1.5 }}>
                {rapportGenere ? "Le rapport PDF a été compilé. Vous pouvez le télécharger ou terminer l'audit." : 'Toutes les étapes sont complètes. Générez le rapport PDF officiel.'}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
              {rapportGenere && <ActionButton variant="ghost" size="sm" onClick={onGenerate}>{Icon.cycle('#374151')} Régénérer</ActionButton>}
              <ActionButton variant="teal" onClick={onGenerate}>
                {Icon.pdf('#fff')} {rapportGenere ? 'Voir le rapport' : 'Générer le rapport'}
              </ActionButton>
            </div>
          </div>
        )}

        {/* Terminer l'audit */}
        {!readOnly && rapportGenere && auditStatut !== 'TERMINE' && (
          <button className="terminer-btn" onClick={onTerminer}>
            {Icon.check('#fff')} Terminer l'audit
          </button>
        )}
      </div>

      {/* ── COLONNE DROITE sticky ── */}
      <div className="qk-sticky-col">
        <div style={{ background: '#fff', border: `2px solid ${meta.bd}`, borderRadius: 18, padding: '20px 18px', boxShadow: `0 10px 30px ${meta.color}12`, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
          <QKGauge value={numVal} color={qkColor} size={150}/>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontWeight: 800, color: meta.color, fontSize: '.9rem' }}>{meta.label}</div>
            <div style={{ fontSize: '.72rem', color: '#6B7280', marginTop: 3 }}>{meta.sub}</div>
          </div>

          <div style={{ width: '100%', height: 1, background: '#F1F5F9' }}/>

          {!readOnly && (
            <div style={{ width: '100%' }}>
              <div style={{ fontSize: '.7rem', fontWeight: 800, color: '#5C6F8A', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 8 }}>
                Modifier la valeur QK
              </div>
              <input
                type="number" step="0.01" min="0"
                value={qkInput}
                onChange={e => onQkInputChange(e.target.value)}
                placeholder="0.00"
                style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #E2E8F0', borderRadius: 10, fontSize: '1.3rem', fontWeight: 900, fontFamily: 'inherit', background: '#F7F9FC', outline: 'none', color: '#001F4E', textAlign: 'center', marginBottom: 8 }}
              />
              <ActionButton variant="info" full onClick={onQkUpdate} loading={qkLoading} size="sm">
                Mettre à jour le QK
              </ActionButton>
            </div>
          )}

          <div style={{ width: '100%', borderRadius: 10, background: '#F7F9FC', border: '1px solid #E8EDF7', padding: '10px 14px' }}>
            <div style={{ fontSize: '.68rem', fontWeight: 800, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 6 }}>Rappel</div>
            <div style={{ fontSize: '.72rem', color: '#374151', lineHeight: 1.6 }}>
              <div style={{ marginBottom: 3 }}><b>QK = 0</b> → Aucune action</div>
              <div style={{ marginBottom: 3 }}><b>0 &lt; QK ≤ 0.5</b> → Fiche réparation</div>
              <div style={{ marginBottom: 3 }}><b>0.5 &lt; QK ≤ 1</b> → Fiche + PDCA</div>
              <div><b>QK &gt; 1</b> → Fiche + PDCA + urgence</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   WORKFLOW CARD
═══════════════════════════════════════════════════════════════ */
function WorkflowCard({ iconTitle, color, title, desc, features, btnLabel, onClick }) {
  const [hov, setHov] = useState(false);
  return (
    <div
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ borderRadius: 16, border: `2px solid ${hov ? color : '#D1D5DB'}`, padding: '2rem 2rem 1.75rem', background: hov ? `linear-gradient(135deg,#FAFCFF,${color}08)` : '#fff', cursor: 'pointer', transition: 'all .2s ease', boxShadow: hov ? `0 12px 40px ${color}20` : '0 4px 18px rgba(0,40,85,.10)', transform: hov ? 'translateY(-4px)' : 'none', display: 'flex', flexDirection: 'column', gap: 16 }}
      onClick={onClick}
    >
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 800, fontSize: '1.05rem', color: '#001F4E', marginBottom: 8 }}>
          <span style={{ width: 26, height: 26, borderRadius: 8, background: `${color}12`, border: `1px solid ${color}24`, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{iconTitle}</span>
          <span>{title}</span>
        </div>
        <div style={{ fontSize: '.85rem', color: '#6B7280', lineHeight: 1.6, marginBottom: 14 }}>{desc}</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {features.map(f => (
            <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '.78rem', color: '#374151' }}>
              <div style={{ width: 18, height: 18, borderRadius: '50%', background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{Icon.check(color)}</div>
              {f}
            </div>
          ))}
        </div>
      </div>
      <div style={{ marginTop: 'auto', display: 'inline-flex', alignItems: 'center', gap: 8, background: color, color: '#fff', borderRadius: 10, padding: '11px 22px', fontWeight: 800, fontSize: '.88rem', boxShadow: `0 4px 14px ${color}40`, alignSelf: 'flex-start' }}>
        {btnLabel} {Icon.arrow('#fff')}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   PAGE PRINCIPALE
═══════════════════════════════════════════════════════════════ */
export default function AuditDetailAuditeur() {
  const { id }   = useParams();
  const navigate = useNavigate();
  const rapportRef       = useRef();
  const draftHydratedRef = useRef(false);
  const ficheOpenRef     = useRef(false);
  const pdcaOpenRef      = useRef(false);

  const isReadOnly = (() => { try { return new URLSearchParams(window.location.search).get('readonly') === '1'; } catch { return false; } })();

  const [audit,        setAudit]    = useState(null);
  const [annexes,      setAnnexes]  = useState([]);
  const [loading,      setLoading]  = useState(true);
  const [notif,        setNotif]    = useState(null);
  const [responsables, setResp]     = useState([]);

  const [workflow,  setWorkflow] = useState(null);
  const [page,      setPage]     = useState('ACCUEIL');

  const [pdfsCorrectives,   setPdfsCorrectives]   = useState([]);
  const [uploadingPdfCorr,  setUploadingPdfCorr]  = useState(false);

  const [qkValue,          setQkValue]          = useState(null);
  const [qkColor,          setQkColor]          = useState(null);
  const [qkInput,          setQkInput]          = useState('');
  const [qkLoading,        setQkLoading]        = useState(false);
  const [qkErr,            setQkErr]            = useState('');
  const [qkDecisionTaken,  setQkDecisionTaken]  = useState(false);

  const [rapportImporte,   setRapportImporte]   = useState(false);
  const [rapportNom,       setRapportNom]       = useState('');
  const [importingRapport, setImportingRapport] = useState(false);
  const [importDone,       setImportDone]       = useState(false);

  const [ficheSent,    setFicheSent]    = useState(false);
  const [ficheValidee, setFicheValidee] = useState(false);
  const [ficheMeta,    setFicheMeta]    = useState(null);
  const [pdcaSent,     setPdcaSent]    = useState(false);
  const [pdcaValidee,  setPdcaValidee] = useState(false);
  const [pdcaMeta,     setPdcaMeta]    = useState(null);
  const [showFiche,    setShowFiche]   = useState(false);
  const [showPdca,     setShowPdca]    = useState(false);

  const [rapportGenere,     setRapportGenere]     = useState(false);
  const [rapportPdfUrl,     setRapportPdfUrl]     = useState('');
  const [showReportModal,   setShowReportModal]   = useState(false);
  const [addingPdfToReport, setAddingPdfToReport] = useState(false);

  const [showAddAnnexe, setShowAddAnnexe] = useState(false);
  const [fillingAnnexe, setFillingAnnexe] = useState(null);

  const { injectedDefauts, notifyMultiple } = useDefautInjector();

  /* ── Load ── */
  const load = useCallback(async () => {
    draftHydratedRef.current = false;
    setLoading(true);
    try {
      const [auditData, annexesData] = await Promise.all([
        fetchJson(`${API}/audit-produit/${id}`, { headers: apiH() }),
        fetchJson(`${API}/audit-produit/${id}/annexes`, { headers: apiH() }).catch(() => []),
      ]);
      setAudit(auditData);
      const raw = Array.isArray(annexesData) ? annexesData : Array.isArray(annexesData?.content) ? annexesData.content : [];
      const mapped = raw.map(a => {
        const type = a?.typeAnnexe || a?.type || a?.id;
        const m    = ANNEXE_IDX[type] || {};
        let formData = a?.formData || a?.formDataJson || null;
        if (typeof formData === 'string') {
          try { formData = JSON.parse(formData); } catch { formData = {}; }
        }
        return { ...a, typeAnnexe: type, name: m.name || a?.libelle || `Annexe ${type}`, tag: m.tag || 'Commun', desc: m.desc || '', formData: formData || {} };
      });
      setAnnexes(mapped);

      // ── Déduire workflow et page depuis les données serveur ──
      const hasRapportImporte = !!(auditData?.rapportUrl || auditData?.rapportFichierNom);
      const annexesTouchees   = mapped.some(a => a.importe || a.formValide || (a.formData && Object.keys(a.formData).length > 0));
      const allAnnexesDone    = mapped.length > 0 && mapped.every(a => a.importe || a.formValide);
      const qkDone            = auditData?.valeurQK != null;

      let derivedWorkflow = null;
      if (hasRapportImporte) derivedWorkflow = 'RAPPORT';
      else if (annexesTouchees) derivedWorkflow = 'ANNEXES';

      let derivedPage = 'ACCUEIL';
      if (auditData?.statut === 'TERMINE') {
        derivedPage = 'TERMIN';
      } else if (derivedWorkflow === 'RAPPORT') {
        if (!hasRapportImporte)            derivedPage = 'IMPORT_RAPPORT';
        else if (!qkDone)                  derivedPage = 'QK_RAPPORT';
        else if (!auditData?.rapportGenere) derivedPage = 'QK_RESULT';
        else                                derivedPage = 'GENERATION';
      } else if (derivedWorkflow === 'ANNEXES') {
        if (!allAnnexesDone || !qkDone)    derivedPage = 'ANNEXES';
        else if (!auditData?.rapportGenere) derivedPage = 'QK_RESULT';
        else                                derivedPage = 'GENERATION';
      }

      // ── Si rien n'est déduit, restaurer depuis localStorage ──
      if (!derivedWorkflow) {
        const storedWorkflow = localStorage.getItem(workflowKey(id));
        if (storedWorkflow && auditData?.statut !== 'TERMINE' && auditData?.statut !== 'ANNULE') {
          derivedWorkflow = storedWorkflow;
          const storedPage = localStorage.getItem(pageKey(id));
          if (storedPage && ['ACCUEIL','IMPORT_RAPPORT','QK_RAPPORT','ANNEXES','QK_RESULT','GENERATION'].includes(storedPage)) {
            derivedPage = storedPage;
          } else if (derivedWorkflow === 'ANNEXES') {
            derivedPage = 'ANNEXES';
          } else if (derivedWorkflow === 'RAPPORT') {
            derivedPage = 'IMPORT_RAPPORT';
          }
        }
      }

      // ── Si workflow 'ANNEXES' mais pas de page, forcer ANNEXES ──
      if (derivedWorkflow === 'ANNEXES' && !derivedPage) {
        derivedPage = 'ANNEXES';
      }

      // ── Mise à jour des states ──
      setWorkflow(derivedWorkflow);
      setPage(derivedPage);

      // ── Charger les données QK, fiches, PDCA ──
      if (auditData?.valeurQK != null) {
        const v = auditData.valeurQK;
        setQkValue(v); setQkInput(String(v));
        setQkColor(auditData.couleurQK || computeQKColor(v));
        setQkDecisionTaken(true);
      }
      if (auditData?.rapportUrl || auditData?.rapportFichierNom) { setRapportImporte(true); setRapportNom(auditData.rapportFichierNom || ''); }
      if (auditData?.rapportGenere) { setRapportGenere(true); setRapportPdfUrl(auditData.rapportGenerePdfUrl || ''); }

      if (auditData?.valeurQK != null && Number(auditData.valeurQK) > 0 && auditData?.couleurQK && auditData.couleurQK !== 'VERT') {
        const [fiches, pdcas] = await Promise.all([
          fetchJson(`${API}/audit-produit/${id}/fiche-reparation`, { headers: apiH() }).catch(() => []),
          fetchJson(`${API}/audit-produit/${id}/pdca`, { headers: apiH() }).catch(() => []),
        ]);
        if (Array.isArray(fiches) && fiches.length > 0) {
          const activeFiche = pickActiveRecord(fiches, isFicheValidated);
          setFicheSent(true);
          setFicheValidee(!!activeFiche && isFicheValidated(activeFiche));
          setFicheMeta(activeFiche || fiches[0]);
        }
        if (Array.isArray(pdcas) && pdcas.length > 0) {
          const activePdca = pickActiveRecord(pdcas, isPdcaResolved);
          setPdcaSent(true);
          setPdcaValidee(!!activePdca && isPdcaResolved(activePdca));
          setPdcaMeta(activePdca || pdcas[0]);
        }
      }

      // ── Nettoyer le brouillon mais garder workflow/page ──
      try { localStorage.removeItem(draftKey(id)); } catch {}
    } catch (e) { console.error(e); }
    draftHydratedRef.current = true;
    setLoading(false);
  }, [id]);

  // ── Sauvegarde persistante du workflow et de la page ──
  useEffect(() => {
    if (workflow) localStorage.setItem(workflowKey(id), workflow);
  }, [workflow, id]);

  useEffect(() => {
    if (page) localStorage.setItem(pageKey(id), page);
  }, [page, id]);

  // ── Chargement initial ──
  useEffect(() => { load(); }, [load]);

  // ── Charger responsables ──
  useEffect(() => {
    fetch(`${API}/utilisateurs/roles/responsables-qualite`, { headers: apiH() })
      .then(r => r.json()).then(r => setResp(r || [])).catch(() => {});
  }, []);

  // ── Polling fiche/PDCA ──
  useEffect(() => {
    if (isReadOnly || audit?.statut === 'TERMINE' || audit?.statut === 'ANNULE') return;
    const refresh = async () => {
      try {
        const fiches = await fetchJson(`${API}/audit-produit/${id}/fiche-reparation`, { headers: apiH() }).catch(() => []);
        if (Array.isArray(fiches) && fiches.length > 0) {
          const activeFiche = pickActiveRecord(fiches, isFicheValidated);
          setFicheSent(true);
          setFicheValidee(!!activeFiche && isFicheValidated(activeFiche));
          setFicheMeta(activeFiche || fiches[0]);
        } else { setFicheSent(false); setFicheValidee(false); setFicheMeta(null); }
        const pdcas = await fetchJson(`${API}/audit-produit/${id}/pdca`, { headers: apiH() }).catch(() => []);
        if (Array.isArray(pdcas) && pdcas.length > 0) {
          const activePdca = pickActiveRecord(pdcas, isPdcaResolved);
          setPdcaSent(true);
          setPdcaValidee(!!activePdca && isPdcaResolved(activePdca));
          setPdcaMeta(activePdca || pdcas[0]);
        } else { setPdcaSent(false); setPdcaValidee(false); setPdcaMeta(null); }
      } catch {}
    };
    const hasPending = (ficheSent && !ficheValidee) || (pdcaSent && !pdcaValidee);
    const interval   = (page === 'QK_RESULT' || hasPending) ? 5000 : 30000;
    refresh();
    const t = setInterval(refresh, interval);
    return () => clearInterval(t);
  }, [id, isReadOnly, audit?.statut, page, ficheSent, ficheValidee, pdcaSent, pdcaValidee]);

  const showNotif = (msg, type = 'success') => { setNotif({ msg, type }); setTimeout(() => setNotif(null), 4500); };

  /* ── Import rapport ── */
  const handleImportRapport = async (file) => {
    if (!file || importDone) return;
    setImportingRapport(true);
    const formData = new FormData(); formData.append('fichier', file);
    try {
      const res = await fetch(`${API}/audits/${id}/rapport`, { method: 'POST', headers: multiH(), body: formData });
      if (!res.ok) throw new Error(await res.text());
      setRapportImporte(true); setRapportNom(file.name); setImportDone(true);
      showNotif('Rapport importé avec succès ✓');
    } catch (e) { showNotif('Erreur import : ' + e.message, 'error'); }
    setImportingRapport(false);
  };

  const handleImportPdfCorrectif = async (file) => {
    if (!file || uploadingPdfCorr) return;
    setUploadingPdfCorr(true);
    const formData = new FormData();
    formData.append('fichier', file);
    try {
      const res = await fetch(`${API}/audit-produit/${id}/pdfs-correctifs`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        body: formData,
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setPdfsCorrectives(prev => [...prev, { nom: file.name, url: data.url || '', path: data.path || '' }]);
      showNotif(`PDF "${file.name}" ajouté ✓`);
    } catch (e) {
      showNotif('Erreur : ' + e.message, 'error');
    }
    setUploadingPdfCorr(false);
  };

  const handleRemovePdfCorrectif = (index) => {
    setPdfsCorrectives(prev => prev.filter((_, i) => i !== index));
  };

  /* ── Actions annexes ── */
  const handleImportAnnexe = async (annexeId, file) => {
    const form = new FormData(); form.append('fichier', file);
    try {
      const res = await fetch(`${API}/audit-produit/${id}/annexes/${annexeId}/import`, { method: 'POST', headers: multiH(), body: form });
      if (!res.ok) throw new Error(await res.text());
      showNotif(`Annexe ${annexeId} importée ✓`); load();
    } catch (e) { showNotif('Erreur : ' + e.message, 'error'); }
  };

  const handleFillSave = async (formData) => {
    const annexeId = fillingAnnexe?.typeAnnexe;
    setFillingAnnexe(null);
    setAnnexes(prev => prev.map(a =>
      a.typeAnnexe === annexeId ? { ...a, formData, formValide: true } : a
    ));
    showNotif(`Annexe ${annexeId} validée ✓`);

    const defautsDetectes = extractDefautsFromAnnexe(annexeId, formData);
    if (defautsDetectes.length > 0) {
      notifyMultiple(defautsDetectes);
      showNotif(`${defautsDetectes.length} défaut(s) → Annexe 1B ✓`);
      setAnnexes(prev => {
        const ann1B  = prev.find(a => a.typeAnnexe === '1B');
        const fd1B   = ann1B?.formData || {};
        const existants = Array.isArray(fd1B.defauts) ? fd1B.defauts : [];
        const fusion = [...existants];
        for (const d of defautsDetectes) {
          if (!d.code) continue;
          const idx = fusion.findIndex(x => x.code === d.code && x.sourceAnnexe === annexeId);
          if (idx !== -1) {
            fusion[idx] = { ...fusion[idx], freq: (parseInt(fusion[idx].freq) || 1) + (d.freq || 1), totalDefectPoints: ((parseInt(fusion[idx].freq) || 1) + (d.freq || 1)) * (parseInt(fusion[idx].pointsDefect) || 25) };
          } else {
            fusion.push({ code: d.code, description: d.description || '', type: d.type || 'F', freq: d.freq || 1, pointsDefect: d.pointsDefect || 25, totalDefectPoints: (d.freq || 1) * (d.pointsDefect || 25), auto: true, sourceAnnexe: annexeId });
          }
        }
        const nouveau1B = { ...fd1B, defauts: fusion };
        fetch(`${API}/audit-produit/${id}/annexes/1B/form-draft`, { method: 'PUT', headers: apiH(), body: JSON.stringify(nouveau1B) }).catch(() => {});
        return prev.map(a => a.typeAnnexe === '1B' ? { ...a, formData: nouveau1B } : a);
      });
    }

    try {
      await fetch(`${API}/audit-produit/${id}/annexes/${annexeId}/form-validate`, { method: 'PUT', headers: apiH(), body: JSON.stringify(formData) });
      if (annexeId === '1B' && formData?.valeurQK != null) {
        const qkVal = parseFloat(formData.valeurQK);
        if (!isNaN(qkVal)) {
          try {
            const annexesResp    = await fetch(`${API}/audit-produit/${id}/annexes`, { headers: apiH() });
            const annexesPayload = await annexesResp.json();
            const annexesList    = Array.isArray(annexesPayload) ? annexesPayload : Array.isArray(annexesPayload?.content) ? annexesPayload.content : [];
            const annexe1A = annexesList.find(a => a.typeAnnexe === '1A');
            if (annexe1A) {
              const data1A = annexe1A.formData || {};
              const newRow = { partDesc: formData.partDesc || 'Câblage', drawingNo: formData.identification || formData.partDesc || '—', productionDate: formData.date || new Date().toISOString().slice(0,10), productAuditor: formData.auditor || '—', qk: qkVal.toFixed(1), nbDefects: Array.isArray(formData.defauts) ? formData.defauts.length : 0, totalPoints: formData.totalPoints || 0, ratingFactor: formData.ratingFactor || '', destructive: formData.auditType === 'D', nonDestructive: formData.auditType !== 'D' };
              const currentRows = Array.isArray(data1A.rows) ? data1A.rows : [];
              await fetch(`${API}/audit-produit/${id}/annexes/1A/form-validate`, { method: 'PUT', headers: apiH(), body: JSON.stringify({ ...data1A, monthYear: data1A.monthYear || '', vehicleType: data1A.vehicleType || '', plant: data1A.plant || '', rows: currentRows.length > 0 ? [newRow, ...currentRows.slice(1)] : [newRow] }) });
            }
          } catch (err) { console.error('Erreur sync 1A:', err); }
        }
      }
      load();
    } catch {
      setAnnexes(prev => prev.map(a => a.typeAnnexe === annexeId ? { ...a, formValide: false } : a));
      showNotif(`Erreur validation annexe ${annexeId}`, 'error');
    }
  };

  const handleDraftSave = (formData) => {
    const annexeId = fillingAnnexe?.typeAnnexe;
    setFillingAnnexe(null);
    if (!formData || !Object.keys(formData).length) return;
    fetch(`${API}/audit-produit/${id}/annexes/${annexeId}/form-draft`, { method: 'PUT', headers: apiH(), body: JSON.stringify(formData) }).then(() => { load(); }).catch(() => {});
  };

  const handleRemoveAnnexe = async (annexeId) => {
    if (!window.confirm(`Retirer l'annexe ${annexeId} ?`)) return;
    try { await fetch(`${API}/audit-produit/${id}/annexes/${annexeId}`, { method: 'DELETE', headers: apiH() }); showNotif('Annexe retirée', 'warn'); load(); } catch {}
  };

  const handleAddAnnexes = async (ids) => {
    const all   = Object.values(ALL_ANNEXES).flat();
    const toAdd = ids.map(i => all.find(a => a.id === i)).filter(Boolean);
    try {
      await Promise.all(toAdd.map(a => fetch(`${API}/audit-produit/${id}/annexes/${a.id}`, { method: 'POST', headers: apiH(), body: JSON.stringify({ libelle: a.name }) })));
      setShowAddAnnexe(false); showNotif(`${toAdd.length} annexe(s) ajoutée(s) ✓`); load();
    } catch {}
  };

  const handleFillDraftChange = useCallback((formData) => {
    setFillingAnnexe(prev => (prev ? { ...prev, formData } : prev));
  }, []);

  const handleAddPdfToReport = async (file) => {
    if (!file || addingPdfToReport) return;
    if (!rapportGenere && !rapportPdfUrl) {
      showNotif("Générez d'abord le rapport avant d'y ajouter un PDF.", 'warn');
      return;
    }
    setAddingPdfToReport(true);
    try {
      await auditProduitAPI.ajouterPdfAuRapport(id, file);
      showNotif('PDF ajouté au rapport ✓');
      await load();
    } catch (e) {
      showNotif('Erreur ajout PDF : ' + (e?.response?.data?.message || e.message || 'inconnue'), 'error');
    }
    setAddingPdfToReport(false);
  };

  /* ── Calcul QK depuis 1B ── */
  const handleCalculerQK = async () => {
    if (!canAdvanceFromAnnexes) {
      showNotif(`Complétez toutes les annexes d'abord (${pct}% — ${doneCount}/${annexes.length})`, 'warn');
      return;
    }
    setQkLoading(true); setQkErr('');
    try {
      const anns     = await fetchJson(`${API}/audit-produit/${id}/annexes`, { headers: apiH() }).catch(() => []);
      const annexe1B = (anns || []).find(a => a.typeAnnexe === '1B');
      const annexe1A = (anns || []).find(a => a.typeAnnexe === '1A');

      const getQK = (ann) => {
        if (!ann) return null;
        const direct = ann.valeurQkExtraite ?? ann.valeurQK ?? ann.valeurQk;
        if (direct != null && !isNaN(Number(direct))) return Number(direct);
        const fd   = ann.formData || {};
        const inFd = fd.valeurQK ?? fd.valeurQkExtraite ?? fd.qkValue ?? fd.qk;
        if (inFd != null && !isNaN(Number(inFd))) return Number(inFd);
        const w = Number(fd.weightedPoints);
        if (!isNaN(w)) return Number(calculateQK(w).toFixed(1));
        const t = Number(fd.totalPoints), r = Number(fd.ratingFactor);
        if (!isNaN(t) && !isNaN(r)) return Number(calculateQK(t * r).toFixed(1));
        return null;
      };

      const val = getQK(annexe1B) ?? getQK(annexe1A);
      if (val != null) {
        setQkInput(String(val));
        const res = await fetch(`${API}/audit-produit/${id}/qk?valeurQK=${val}`, { method: 'PUT', headers: apiH() });
        if (!res.ok) throw new Error(await res.text());
        const data  = await res.json();
        const color = data.couleurQK || computeQKColor(val);
        setQkValue(val); setQkColor(color); setQkDecisionTaken(true);
        showNotif(`QK = ${val} calculé depuis l'annexe 1B ✓`);
        await load();
        setPage('QK_RESULT');
      } else {
        showNotif("Annexe 1B incomplète — saisissez les défauts d'abord.", 'warn');
      }
    } catch (e) { setQkErr('Erreur : ' + e.message); }
    setQkLoading(false);
  };

  /* ── Valider QK manuel ── */
  const handleValiderQK = async () => {
    if (workflow === 'ANNEXES') {
      const localAllDone = annexes.length > 0 && annexes.every(a => a.importe || a.formValide);
      const localDoneCount = annexes.filter(a => a.importe || a.formValide).length;
      const localPct = annexes.length > 0 ? Math.round(localDoneCount / annexes.length * 100) : 0;
      if (!(localAllDone && localPct === 100)) {
        showNotif('Complétez toutes les annexes pour passer à la saisie QK.', 'warn');
        return;
      }
    }
    const n = Number(qkInput);
    if (qkInput === '' || isNaN(n) || n < 0) { setQkErr('Valeur QK invalide (≥ 0).'); return; }
    setQkLoading(true); setQkErr('');
    try {
      const res = await fetch(`${API}/audit-produit/${id}/qk?valeurQK=${n}`, { method: 'PUT', headers: apiH() });
      if (!res.ok) throw new Error(await res.text());
      const data  = await res.json();
      const color = data.couleurQK || computeQKColor(n);
      setQkValue(n); setQkColor(color); setQkDecisionTaken(true); setPage('QK_RESULT');
      showNotif(`QK = ${n} enregistré ✓`); load();
    } catch (e) { setQkErr('Erreur : ' + e.message); }
    setQkLoading(false);
  };

  /* ── Génération rapport ── */
  const handleReportValidated = async (data) => {
    setShowReportModal(false);
    setRapportGenere(true);
    setRapportPdfUrl(data?.rapportUrl || data?.rapportGenerePdfUrl || '');
    showNotif('Rapport généré avec succès ✓');
    setPage('GENERATION');
    await load();
  };

  /* ── Terminer ── */
  const terminerAudit = async () => {
    try {
      const res = await fetch(`${API}/audit-produit/${id}/statut`, { method: 'PUT', headers: apiH(), body: JSON.stringify({ statut: 'TERMINE' }) });
      if (!res.ok) throw new Error(await res.text());
      try {
        localStorage.removeItem(draftKey(id));
        localStorage.removeItem(workflowKey(id));
        localStorage.removeItem(pageKey(id));
      } catch {}
      showNotif('Audit terminé avec succès ✓');
      setAudit(prev => ({ ...(prev || {}), statut: 'TERMINE' }));
      setPage('TERMIN');
    } catch (e) { showNotif('Erreur : ' + e.message, 'error'); }
  };

  /* ── Navigation topbar ── */
  const handleStepSelect = (key) => {
    if (key === 'start')      return setPage('ACCUEIL');
    if (key === 'rapport')    return setPage('IMPORT_RAPPORT');
    if (key === 'annexes')    return setPage('ANNEXES');
    if (key === 'qk') {
      if (workflow === 'ANNEXES') {
        showNotif("Pour accéder à la saisie QK, veuillez d'abord cliquer sur \"Prendre QK 1B et décider\" lorsque toutes les annexes sont complètes (100%).", 'warn');
        return;
      }
      return setPage(workflow === 'RAPPORT' ? 'QK_RAPPORT' : 'QK_RESULT');
    }
    if (key === 'corrective') return setPage('QK_RESULT');
    if (key === 'gen') {
      if (rapportGenere) {
        return setPage('GENERATION');
      }
      if (workflow === 'ANNEXES' && !canAdvanceFromAnnexes) {
        showNotif('Complétez toutes les annexes avant d\'accéder au rapport.', 'warn');
        return;
      }
      const ficheOk = !ficheReq || displayFicheValidee;
      const pdcaOk = !pdcaReq || displayPdcaValidee;
      if (!ficheOk) {
        showNotif('La fiche de réparation doit être validée avant de générer le rapport.', 'warn');
        return;
      }
      if (!pdcaOk) {
        showNotif('Le PDCA doit être résolu avant de générer le rapport.', 'warn');
        return;
      }
      return setPage('GENERATION');
    }
    if (key === 'fin') return setPage('TERMIN');
  };

  /* ── Dérivés ── */
  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 400, fontFamily: "'DM Sans',sans-serif", gap: 12, color: '#9CA3AF' }}>
      <style>{CSS}</style>
      <span style={{ width: 36, height: 36, border: '3px solid #E2E8F0', borderTopColor: '#001F4E', borderRadius: '50%', animation: 'spin .8s linear infinite', display: 'inline-block' }}/>
      <span style={{ fontWeight: 600 }}>Chargement de l'audit…</span>
    </div>
  );

  if (!audit) return (
    <div style={{ textAlign: 'center', padding: '4rem', color: '#9CA3AF', fontFamily: "'DM Sans',sans-serif" }}>
      <style>{CSS}</style>
      Audit introuvable.
    </div>
  );

  const allDone    = annexes.length > 0 && annexes.every(a => a.importe || a.formValide);
  const doneCount  = annexes.filter(a => a.importe || a.formValide).length;
  const pct        = annexes.length > 0 ? Math.round(doneCount / annexes.length * 100) : 0;
  const canAdvanceFromAnnexes = allDone && pct === 100;
  const readOnly   = isReadOnly || audit?.statut === 'TERMINE' || audit?.statut === 'ANNULE';
  const auditInfo = {
    auditorName: audit?.auditeurNom || audit?.auditeur?.nomComplet || ((audit?.auditeur?.prenom && audit?.auditeur?.nom) ? `${audit.auditeur.prenom} ${audit.auditeur.nom}` : ''),
    serie: audit?.serieNom || audit?.serie || '',
    plant: audit?.plantNom || audit?.plant || '',
    tab: audit?.tab || audit?.serieNom || '',
    date: audit?.datePrevue || audit?.dateRealisation || '',
  };

  const effectiveQkColor = qkValue != null ? computeQKColor(qkValue) || qkColor : qkColor || computeQKColor(qkValue);
  const ficheReq   = ['ORANGE', 'ROSE', 'ROUGE'].includes(effectiveQkColor);
  const pdcaReq    = ['ROSE', 'ROUGE'].includes(effectiveQkColor);
  const auditTermine = audit?.statut === 'TERMINE';
  const displayFicheValidee = ficheValidee || auditTermine;
  const displayPdcaValidee = pdcaValidee || auditTermine;
  const canGenerate = qkValue != null
    && (!ficheReq || displayFicheValidee)
    && (!pdcaReq || displayPdcaValidee)
    && (workflow !== 'ANNEXES' || canAdvanceFromAnnexes);

  const steps = [
    { key: 'start',      label: 'Commencer',       done: true },
    ...(workflow === 'RAPPORT'
      ? [{ key: 'rapport', label: 'Import Rapport', done: rapportImporte }]
      : workflow === 'ANNEXES'
      ? [{ key: 'annexes', label: 'Annexes',         done: allDone }]
      : [{ key: 'docs',   label: 'Documents',        done: false }]),
    ...(workflow === 'RAPPORT'
      ? [{ key: 'qk', label: 'Saisie QK', done: qkColor != null }]
      : []),
    ...(ficheReq && pdcaReq
      ? [{ key: 'corrective', label: 'Fiche + PDCA', done: displayFicheValidee && displayPdcaValidee }]
      : [...(ficheReq ? [{ key: 'corrective', label: 'Fiche', done: displayFicheValidee }] : []),
         ...(pdcaReq  ? [{ key: 'corrective', label: 'PDCA',  done: displayPdcaValidee  }] : [])]),
    { key: 'gen', label: 'Rapport', done: rapportGenere || auditTermine, disabled: workflow === 'ANNEXES' && !canAdvanceFromAnnexes },
    { key: 'fin', label: 'Terminé', done: auditTermine },
  ];

  return (
    <div className="leoni-root">
      <style>{CSS}</style>

      {/* Toast */}
      {notif && (
        <div style={{
          position: 'fixed', top: 16, right: 16, zIndex: 3000,
          background: notif.type === 'success' ? T.successBg : notif.type === 'warn' ? T.warnBg : T.dangerBg,
          border: `1.5px solid ${notif.type === 'success' ? T.successBd : notif.type === 'warn' ? T.warnBd : T.dangerBd}`,
          color: notif.type === 'success' ? T.success : notif.type === 'warn' ? T.warn : T.danger,
          padding: '11px 20px', borderRadius: 12, fontWeight: 700, fontSize: 13,
          boxShadow: '0 8px 30px rgba(0,0,0,.15)', animation: 'slideDown .25s ease', maxWidth: 360,
        }}>
          {notif.msg}
        </div>
      )}

      {/* ── TOPBAR STICKY ── */}
      <StepBar
        steps={steps}
        qkColor={effectiveQkColor}
        onSelect={handleStepSelect}
        auditRef={audit.reference}
        auditPlant={audit.plantNom}
        auditDate={fmt(audit.datePrevue)}
      />

      {/* ── CONTENU SCROLLABLE ── */}
      <div className="leoni-body">
        <div className="leoni-body-inner">

          {/* ═══════ PAGE ACCUEIL ═══════ */}
          {page === 'ACCUEIL' && !workflow && (
            <div className="card-animate">
              <Card style={{ margin: '0 -1.5rem 14px -1.5rem', padding: '1.5rem', background: 'linear-gradient(135deg,#001F4E,#003F8A)', color: '#fff', border: 'none', borderRadius: '16px' }}>
                <div style={{ fontSize: '.62rem', opacity: .55, textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 4 }}>Audit Produit LEONI</div>
                <div style={{ fontWeight: 900, fontSize: '1.2rem', marginBottom: 6 }}>{audit.reference}</div>
                <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', fontSize: '.78rem' }}>
                  {[{ l: 'Série', v: audit.serieNom || '—' }, { l: 'Plant', v: audit.plantNom || '—' }, { l: 'Auditeur', v: audit.auditeurNom || '—' }, { l: 'Date', v: fmt(audit.datePrevue) }].map(x => (
                    <div key={x.l}><span style={{ opacity: .55 }}>{x.l} : </span><span style={{ fontWeight: 700 }}>{x.v}</span></div>
                  ))}
                </div>
              </Card>
              <Card>
                <div style={{ fontWeight: 900, fontSize: '1.05rem', color: '#001F4E', marginBottom: 6 }}>Comment souhaitez-vous réaliser cet audit ?</div>
                <div style={{ fontSize: '.82rem', color: '#6B7280', lineHeight: 1.6, marginBottom: 20 }}>Choisissez votre méthode de travail.</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
                  <WorkflowCard iconTitle={Icon.upload(T.info)} color={T.info} title="Importer le rapport existant" desc="Vous avez déjà rempli les annexes papier. Importez le PDF/Excel, saisissez le QK, puis gérez les validations correctives." features={['Import PDF / Excel / Word / Image', 'Saisie QK manuelle ou depuis Annexe 1B', 'Génération rapport final avec aperçu PDF']} btnLabel="Importer un fichier" onClick={() => { setWorkflow('RAPPORT'); setPage('IMPORT_RAPPORT'); }}/>
                  <WorkflowCard iconTitle={Icon.edit(T.success)} color={T.success} title="Remplir les annexes en ligne" desc="Remplissez chaque annexe directement sur la plateforme. Les défauts sont automatiquement collectés." features={['Formulaires conformes aux annexes LEONI', 'Injection auto des défauts vers Annexe 1B', 'Calcul QK automatique (table PI3010)']} btnLabel="Remplir en ligne" onClick={() => { setWorkflow('ANNEXES'); setPage('ANNEXES'); }}/>
                </div>
              </Card>
            </div>
          )}

          {/* ═══════ PAGE IMPORT RAPPORT ═══════ */}
          {page === 'IMPORT_RAPPORT' && (
            <div className="card-animate">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
                <Card style={{ border: '1.5px solid #CBD5E1' }}>
                  <div style={{ fontWeight: 800, fontSize: '.95rem', color: '#001F4E', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 8 }}>{Icon.upload('#001F4E')} Import du Rapport d'Audit</div>
                  <div style={{ fontSize: '.8rem', color: '#6B7280', marginBottom: 18, lineHeight: 1.6 }}>Téléversez votre rapport PDF ou Excel.</div>
                  {rapportImporte && rapportNom && (
                    <div style={{ marginBottom: 14, padding: '12px 16px', background: T.successBg, border: `1.5px solid ${T.successBd}`, borderRadius: 10, display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 32, height: 32, borderRadius: '50%', background: T.successBg, border: `1.5px solid ${T.successBd}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{Icon.check(T.success)}</div>
                      <div style={{ flex: 1 }}><div style={{ fontWeight: 800, color: T.success, fontSize: '.84rem' }}>Rapport importé</div><div style={{ fontSize: '.72rem', color: '#6B7280' }}>{rapportNom}</div></div>
                      {audit?.rapportUrl && <a href={audit.rapportUrl} target="_blank" rel="noopener noreferrer" style={{ padding: '6px 12px', background: T.successBg, color: T.success, border: `1px solid ${T.successBd}`, borderRadius: 8, textDecoration: 'none', fontWeight: 700, fontSize: '.76rem', display: 'flex', alignItems: 'center', gap: 4 }}>{Icon.eye(T.success)} Voir</a>}
                    </div>
                  )}
                  {!rapportImporte ? (
                    <div style={{ border: '2px dashed #93C5FD', borderRadius: 14, padding: '32px 20px', textAlign: 'center', background: '#F0F6FF', cursor: 'pointer' }}
                      onClick={() => rapportRef.current?.click()}
                      onDragOver={e => e.preventDefault()}
                      onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleImportRapport(f); }}>
                      <div style={{ width: 56, height: 56, borderRadius: 16, background: T.infoBg, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px', border: `1.5px solid ${T.infoBd}` }}>{Icon.upload(T.info)}</div>
                      <div style={{ fontWeight: 700, color: '#001F4E', fontSize: '.9rem', marginBottom: 5 }}>Cliquez ou glissez votre rapport ici</div>
                      <div style={{ fontSize: '.75rem', color: '#9CA3AF', marginBottom: 16 }}>PDF, Excel, Word, Image — Max 50 MB</div>
                      <input ref={rapportRef} type="file" accept=".pdf,.xlsx,.xls,.jpg,.jpeg,.png,.doc,.docx" style={{ display: 'none' }} onChange={e => e.target.files[0] && handleImportRapport(e.target.files[0])}/>
                      <ActionButton variant="info" onClick={e => { e.stopPropagation(); rapportRef.current?.click(); }} loading={importingRapport}>
                        {importingRapport ? 'Import en cours…' : 'Choisir le fichier'}
                      </ActionButton>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                      <label style={{ cursor: 'pointer', flex: 1 }}>
                        <input type="file" hidden accept=".pdf,.xlsx,.xls,.jpg,.jpeg,.png" onChange={e => { setImportDone(false); e.target.files[0] && handleImportRapport(e.target.files[0]); }}/>
                        <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '9px', borderRadius: 10, border: '1.5px solid #CBD5E1', background: '#F8FAFC', color: '#64748B', fontSize: '.8rem', fontWeight: 700, cursor: 'pointer' }}>{Icon.replace('#64748B')} Remplacer</span>
                      </label>
                      <ActionButton variant="info" full onClick={() => setPage('QK_RAPPORT')}>Passer à la saisie QK {Icon.arrow('#fff')}</ActionButton>
                    </div>
                  )}
                </Card>
                <Card style={{ background: 'linear-gradient(135deg,#E8F0FB,#DBEAFE)', border: '1.5px solid #93C5FD' }}>
                  <div style={{ fontWeight: 800, fontSize: '.9rem', color: '#001F4E', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>{Icon.shield(T.info)} Workflow Import Rapport</div>
                  {[{ n: 1, t: 'Importer le rapport', d: 'PDF, Excel ou image' }, { n: 2, t: 'Saisir le QK', d: 'Manuellement ou depuis Annexe 1B' }, { n: 3, t: 'Validations correctives', d: 'Fiche et/ou PDCA si QK > 0' }, { n: 4, t: 'Générer le rapport final', d: 'Aperçu PDF + validation + envoi' }].map(s => (
                    <div key={s.n} style={{ display: 'flex', gap: 12, marginBottom: 12, alignItems: 'flex-start' }}>
                      <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#001F4E', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, flexShrink: 0 }}>{s.n}</div>
                      <div><div style={{ fontWeight: 700, fontSize: '.83rem', color: '#001F4E' }}>{s.t}</div><div style={{ fontSize: '.73rem', color: '#6B7280', marginTop: 2 }}>{s.d}</div></div>
                    </div>
                  ))}
                </Card>
              </div>
            </div>
          )}

          {/* ═══════ PAGE SAISIE QK ═══════ */}
          {page === 'QK_RAPPORT' && (
            <div className="card-animate">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
                <Card style={{ border: '1.5px solid #CBD5E1' }}>
                  <div style={{ fontWeight: 800, fontSize: '.95rem', color: '#001F4E', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 8 }}>{Icon.target('#001F4E')} Valeur QK</div>
                  <div style={{ fontSize: '.8rem', color: '#6B7280', marginBottom: 20, lineHeight: 1.6 }}>Reportez la valeur QK calculée depuis votre rapport papier.</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 20 }}>
                    {[
                      { label: 'QK = 0', sub: 'Conforme', color: T.success, bg: T.successBg, bd: T.successBd },
                      { label: '0 < QK ≤ 0.5', sub: 'Mineure', color: T.orange, bg: T.orangeBg, bd: T.orangeBd },
                      { label: '0.5 < QK ≤ 1', sub: 'Corrective', color: T.rose, bg: T.roseBg, bd: T.roseBd },
                      { label: 'QK > 1', sub: 'Critique', color: T.danger, bg: T.dangerBg, bd: T.dangerBd },
                    ].map(c => (
                      <div key={c.label} style={{ background: c.bg, border: `1.5px solid ${c.bd}`, borderRadius: 10, padding: '10px 12px', textAlign: 'center' }}>
                        <div style={{ fontWeight: 900, color: c.color, fontSize: '.88rem' }}>{c.label}</div>
                        <div style={{ fontSize: '.7rem', color: c.color, opacity: .8, marginTop: 2 }}>{c.sub}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ marginBottom: 14 }}>
                    <label style={{ display: 'block', fontSize: '.72rem', fontWeight: 800, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 8 }}>Valeur QK *</label>
                    <input type="number" step="0.01" min="0" value={qkInput} onChange={e => setQkInput(e.target.value)} disabled={qkLoading} placeholder="0.00"
                      style={{ width: '100%', padding: '14px 16px', border: `2.5px solid ${qkInput && computeQKColor(qkInput) ? QK_META[computeQKColor(qkInput)]?.bd || '#D1D5DB' : '#D1D5DB'}`, borderRadius: 12, fontSize: '1.6rem', fontWeight: 900, fontFamily: 'inherit', background: '#fff', outline: 'none', color: '#001F4E', textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,.06)' }}/>
                  </div>
                  {qkErr && <div style={{ background: T.dangerBg, border: `1px solid ${T.dangerBd}`, borderRadius: 8, padding: '8px 12px', fontSize: 12, color: T.danger, marginBottom: 12 }}>{qkErr}</div>}
                  <ActionButton variant="primary" full onClick={handleValiderQK} loading={qkLoading}>Valider le QK {Icon.arrow('#fff')}</ActionButton>
                </Card>
                <Card style={{ background: 'linear-gradient(135deg,#ECFDF5,#D1FAE5)', border: '1.5px solid #6EE7B7' }}>
                  <div style={{ fontWeight: 800, fontSize: '.9rem', color: '#065F46', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>{Icon.chart(T.success)} Prendre le QK depuis l'Annexe 1B</div>
                  <div style={{ fontSize: '.8rem', color: '#6B7280', marginBottom: 16, lineHeight: 1.6 }}>Si vous avez rempli l'Annexe 1B avec les défauts, le QK est calculé automatiquement selon la table PI3010.</div>
                  <div style={{ padding: '16px', background: 'rgba(255,255,255,.7)', borderRadius: 12, marginBottom: 16, border: '1px solid #D1FAE5' }}>
                    <div style={{ fontSize: '.78rem', color: '#374151', lineHeight: 1.6 }}>
                      <strong>Formule PI3010 :</strong><br/>
                      1. Total = Σ (Fréq × Points)<br/>
                      2. Weighted = Total × Rating Factor<br/>
                      3. QK = table PI3010(Weighted Points)
                    </div>
                  </div>
                  <ActionButton variant="success" full onClick={handleCalculerQK} loading={qkLoading} disabled={!canAdvanceFromAnnexes}>{Icon.chart('#fff')} Calculer QK depuis Annexe 1B</ActionButton>
                  <div style={{ marginTop: 12, fontSize: '.73rem', color: '#9CA3AF', textAlign: 'center' }}>Nécessite que toutes les annexes soient complètes (100%)</div>
                </Card>
              </div>
            </div>
          )}

          {/* ═══════ PAGE ANNEXES ═══════ */}
          {page === 'ANNEXES' && (
            <div className="card-animate" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ background: '#fff', borderRadius: 16, padding: '1.25rem 1.5rem', border: '1.5px solid #CBD5E1', boxShadow: '0 4px 18px rgba(0,40,85,.13), 0 1.5px 5px rgba(0,0,0,.07)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '1rem', color: '#001F4E' }}>Annexes de l'Audit Produit</div>
                    <div style={{ fontSize: '.78rem', color: '#334155', marginTop: 2, fontWeight: 600 }}>{doneCount}/{annexes.length} complètes · IT TN 3625</div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <div style={{ fontWeight: 900, fontSize: '1.5rem', color: pct === 100 ? T.success : '#334155' }}>{pct}%</div>
                    {!readOnly && <ActionButton variant="primary" onClick={() => setShowAddAnnexe(true)}>{Icon.plus('#fff')} Ajouter</ActionButton>}
                  </div>
                </div>
                <div style={{ height: 8, borderRadius: 99, background: '#d5dde5', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${pct}%`, background: pct === 100 ? `linear-gradient(90deg,${T.success},#047857)` : `linear-gradient(90deg,${T.info},#1d4ed8)`, borderRadius: 99, transition: 'width .6s ease' }}/>
                </div>
                {allDone && (
                  <div style={{ marginTop: 8, fontSize: '.75rem', fontWeight: 700, color: T.success }}>{Icon.check(T.success)} Toutes les annexes sont complètes</div>
                )}
              </div>

              {annexes.length === 0 ? (
                <Card style={{ textAlign: 'center', padding: '3rem' }}>
                  <div style={{ width: 64, height: 64, borderRadius: 18, background: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px', color: '#CBD5E1' }}>{Icon.file('#CBD5E1')}</div>
                  <div style={{ fontSize: '.9rem', fontWeight: 700, color: '#6B7280', marginBottom: 6 }}>Aucune annexe configurée</div>
                  <div style={{ fontSize: '.8rem', color: '#9CA3AF' }}>Cliquez sur "Ajouter" pour commencer.</div>
                </Card>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {annexes.map(ann => (
                    <AnnexeCard key={ann.typeAnnexe} ann={ann} onFill={() => setFillingAnnexe(ann)} onImport={(aid, f) => handleImportAnnexe(aid, f)} onReplace={(aid, f) => handleImportAnnexe(aid, f)} onRemove={handleRemoveAnnexe} readOnly={readOnly} actionsLocked={ficheValidee || pdcaValidee}/>
                  ))}
                </div>
              )}

              {!readOnly && (
                <div style={{ background: 'linear-gradient(135deg,#ECFDF5,#D1FAE5)', borderRadius: 16, padding: '1.25rem 1.5rem', border: `1.5px solid ${T.successBd}`, boxShadow: '0 4px 18px rgba(5,150,105,.10)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: 200 }}>
                      <div style={{ fontWeight: 800, color: '#065F46', fontSize: '.92rem', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 8 }}>{Icon.chart(T.success)} Prendre le QK de l'annexe 1B</div>
                      <div style={{ fontSize: '.78rem', color: '#6B7280', lineHeight: 1.5 }}>Récupère le QK calculé dans l'Annexe 1B et décide des actions correctives.</div>
                      {qkErr && <div style={{ marginTop: 6, fontSize: '.74rem', color: T.danger, fontWeight: 600 }}>{qkErr}</div>}
                    </div>
                    <ActionButton variant="success" size="lg" onClick={handleCalculerQK} loading={qkLoading} disabled={!canAdvanceFromAnnexes}>{Icon.chart('#fff')} Prendre QK 1B et décider</ActionButton>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ═══════ PAGE QK RESULT ═══════ */}
          {page === 'QK_RESULT' && effectiveQkColor && (
            <div className="card-animate">
              <QKResultCard
                qkValue={qkValue}
                qkColor={effectiveQkColor}
                ficheRequired={ficheReq}
                pdcaRequired={pdcaReq}
                ficheSent={ficheSent}
                ficheValidee={ficheValidee}
                pdcaSent={pdcaSent}
                pdcaValidee={pdcaValidee}
                ficheMeta={ficheMeta}
                pdcaMeta={pdcaMeta}
                auditTermine={audit?.statut === 'TERMINE'}
                onOpenFiche={() => { if (ficheOpenRef.current) return; ficheOpenRef.current = true; setShowFiche(true); }}
                onOpenPDCA={() => { if (pdcaOpenRef.current) return; pdcaOpenRef.current = true; setShowPdca(true); }}
                onGenerate={() => setShowReportModal(true)}
                onTerminer={terminerAudit}
                readOnly={readOnly}
                auditStatut={audit?.statut}
                canGenerate={canGenerate}
                rapportGenere={rapportGenere}
                qkInput={qkInput}
                onQkInputChange={setQkInput}
                onQkUpdate={handleValiderQK}
                qkLoading={qkLoading}
                pdfsCorrectives={pdfsCorrectives}
                onImportPdfCorrectif={handleImportPdfCorrectif}
                onRemovePdfCorrectif={handleRemovePdfCorrectif}
                uploadingPdfCorr={uploadingPdfCorr}
              />
            </div>
          )}

          {/* ═══════ PAGE GÉNÉRATION ═══════ */}
          {page === 'GENERATION' && (
            <div className="card-animate" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <Card style={{ background: 'linear-gradient(135deg,#F0FDFA,#CCFBF1)', border: '1.5px solid #5EEAD4' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
                  <div style={{ width: 56, height: 56, borderRadius: 16, background: T.tealBg, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1.5px solid ${T.tealBd}`, flexShrink: 0 }}>{Icon.pdf(T.teal)}</div>
                  <div>
                    <div style={{ fontWeight: 900, fontSize: '1.1rem', color: '#0D4D4B' }}>Rapport Final Généré</div>
                    <div style={{ fontSize: '.8rem', color: '#6B7280', marginTop: 2 }}>Le rapport PDF a été compilé avec toutes les annexes, fiches et PDCA.</div>
                  </div>
                </div>

                {rapportPdfUrl && (
                  <div style={{ marginBottom: 18, padding: '14px 18px', background: 'rgba(255,255,255,.85)', borderRadius: 12, border: `1px solid ${T.tealBd}`, display: 'flex', alignItems: 'center', gap: 12, boxShadow: '0 2px 10px rgba(13,148,136,.08)' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, color: T.teal, fontSize: '.85rem' }}>Rapport disponible</div>
                      <div style={{ fontSize: '.73rem', color: '#6B7280', marginTop: 2 }}>{rapportPdfUrl.split(/[\\/]/).pop()}</div>
                    </div>
                    <ActionButton variant="teal" onClick={() => ouvrirRapportPdf(id)}>{Icon.eye('#fff')} Voir le PDF</ActionButton>
                  </div>
                )}

                <div style={{ display: 'flex', gap: 8, marginBottom: 18 }}>
                  <ActionButton variant="ghost" onClick={() => setShowReportModal(true)}>{Icon.pdf('#374151')} Régénérer / Ré-ouvrir le rapport</ActionButton>
                </div>

                {/* ── Bloc ajout PDF supplémentaires — toujours visible ── */}
                <div style={{ background: '#fff', border: '1.5px solid #CBD5E1', borderRadius: 14, padding: '18px 20px', marginBottom: 18, boxShadow: '0 4px 18px rgba(0,40,85,.10)' }}>
                  <div style={{ fontWeight: 800, fontSize: '.88rem', color: '#001F4E', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
                    {Icon.upload(T.info)} Ajouter des PDF au rapport
                  </div>
                  <div style={{ fontSize: '.75rem', color: '#6B7280', marginBottom: 14, lineHeight: 1.5 }}>
                    Joignez des documents PDF supplémentaires (fiches, photos, preuves) qui seront fusionnés au rapport final.
                  </div>

                  {/* Liste des PDF déjà ajoutés */}
                  {pdfsCorrectives.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
                      {pdfsCorrectives.map((pdf, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: T.successBg, border: `1px solid ${T.successBd}`, borderRadius: 10, boxShadow: '0 2px 8px rgba(5,150,105,.08)' }}>
                          <div style={{ width: 32, height: 32, borderRadius: 8, background: '#fff', border: `1px solid ${T.successBd}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            {Icon.file(T.success)}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontWeight: 700, fontSize: '.82rem', color: T.success, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{pdf.nom}</div>
                            <div style={{ fontSize: '.69rem', color: '#6B7280', marginTop: 1 }}>PDF ajouté au rapport</div>
                          </div>
                          <button
                            onClick={() => handleRemovePdfCorrectif(i)}
                            style={{ width: 28, height: 28, borderRadius: 7, border: `1px solid ${T.dangerBd}`, background: T.dangerBg, color: T.danger, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            {Icon.trash(T.danger)}
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <label style={{ cursor: uploadingPdfCorr ? 'wait' : 'pointer', display: 'inline-block' }}>
                    <input
                      type="file"
                      hidden
                      accept=".pdf"
                      disabled={uploadingPdfCorr}
                      onChange={e => {
                        const file = e.target.files?.[0];
                        e.target.value = '';
                        if (file) handleImportPdfCorrectif(file);
                      }}
                    />
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: 7,
                      padding: '9px 18px', borderRadius: 10,
                      background: uploadingPdfCorr ? '#E5E7EB' : T.infoBg,
                      color: uploadingPdfCorr ? '#9CA3AF' : T.info,
                      border: `1.5px solid ${uploadingPdfCorr ? '#E5E7EB' : T.infoBd}`,
                      fontWeight: 700, fontSize: '.8rem', cursor: uploadingPdfCorr ? 'wait' : 'pointer',
                      boxShadow: '0 2px 8px rgba(37,99,235,.10)',
                    }}>
                      {uploadingPdfCorr ? <Spin dark /> : Icon.upload(T.info)}
                      {uploadingPdfCorr ? 'Envoi en cours…' : 'Choisir un PDF à ajouter'}
                    </span>
                  </label>

                  {pdfsCorrectives.length > 0 && (
                    <div style={{ marginTop: 10, fontSize: '.72rem', color: '#6B7280' }}>
                      {pdfsCorrectives.length} fichier(s) PDF ajouté(s) au rapport
                    </div>
                  )}
                </div>

                <ActionButton variant="success" full size="lg" onClick={terminerAudit}>{Icon.check('#fff')} Valider et Terminer l'Audit</ActionButton>
                <div style={{ marginTop: 10, fontSize: '.73rem', color: '#9CA3AF', textAlign: 'center' }}>Une fois terminé, l'audit sera verrouillé en lecture seule.</div>
              </Card>
            </div>
          )}

          {/* ═══════ PAGE TERMINÉ ═══════ */}
          {page === 'TERMIN' && (
            <div className="card-animate" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <AuditIdentityCard
                audit={audit}
                annexes={annexes}
                qkValue={qkValue ?? 0}
                qkColor={effectiveQkColor || 'VERT'}
                ficheMeta={ficheMeta}
                pdcaMeta={pdcaMeta}
                rapportGenere={rapportGenere}
                rapportNom={rapportNom}
                rapportDate={audit?.rapportGenereDate || audit?.dateRealisation || audit?.datePrevue}
                onDownload={() => {
                  if (rapportPdfUrl) ouvrirRapportPdf(id);
                  else setShowReportModal(true);
                }}
                onViewReport={rapportGenere ? () => ouvrirRapportPdf(id) : undefined}
                onClose={() => navigate('/auditeur/audits')}
              />
              <Card style={{ border: '1.5px solid #CBD5E1' }}>
                <div style={{ fontWeight: 800, color: '#001F4E', marginBottom: 10, fontSize: '.95rem' }}>Annexes de l'audit</div>
                <div style={{ display: 'grid', gap: 10 }}>
                  {annexes.map(a => (
                    <AnnexeCard key={a.typeAnnexe} ann={a} readOnly actionsLocked onFill={() => {}} onImport={() => {}} onReplace={() => {}} onRemove={() => {}}/>
                  ))}
                </div>
              </Card>
            </div>
          )}

        </div>
      </div>

      {/* ── MODAUX ── */}
      {fillingAnnexe && (
        <FillAnnexeModal
          annexe={{ ...fillingAnnexe, formData: fillingAnnexe.formData || {} }}
          onClose={handleDraftSave}
          onSave={handleFillSave}
          injectedDefauts={injectedDefauts}
          onDraftChange={handleFillDraftChange}
          auditInfo={auditInfo}
        />
      )}
      {showAddAnnexe && (
        <AddAnnexeModal existing={annexes} onClose={() => setShowAddAnnexe(false)} onAdd={handleAddAnnexes}/>
      )}
      {showFiche && (
        <FicheReparationModal auditId={id} qkValue={qkValue} initialData={ficheMeta}
          onClose={() => { setShowFiche(false); ficheOpenRef.current = false; }}
          onSent={() => { setShowFiche(false); ficheOpenRef.current = false; setFicheSent(true); setFicheValidee(false); showNotif('Fiche de réparation envoyée ✓'); }}
        />
      )}
      {showPdca && (
        <PDCAModal auditId={id} qkValue={qkValue} initialData={pdcaMeta} responsables={responsables}
          onClose={() => { setShowPdca(false); pdcaOpenRef.current = false; }}
          onSent={() => { setShowPdca(false); pdcaOpenRef.current = false; setPdcaSent(true); setPdcaValidee(false); showNotif('PDCA envoyé ✓'); }}
        />
      )}
      <ReportGenerationModal
        open={showReportModal}
        audit={audit}
        annexes={annexes}
        qkValue={qkValue ?? 0}
        qkColor={effectiveQkColor || 'VERT'}
        ficheMeta={ficheMeta}
        pdcaMeta={pdcaMeta}
        auditId={id}
        responsables={responsables}
        onClose={() => setShowReportModal(false)}
        onValidate={handleReportValidated}
      />
    </div>
  );
}