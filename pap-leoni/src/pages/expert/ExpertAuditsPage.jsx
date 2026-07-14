import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { auditAPI } from '../../services/auditAPI';
import { planificationAPI, auditProduitAPI, auditSpecialAPI } from '../../services/api';
import VoirDemandeExtensionModal from '../../components/VoirDemandeExtensionModal';
import { useAuth, getUserPlantScope } from '../../context/AuthContext';

/* ─── Design tokens ─── */
const T = {
  navy:'#0B1E3D', blue:'#1D4ED8', blueL:'#cedbed', blueB:'#b3ceee',
  g50:'#F8FAFC', g100:'#F1F5F9', g200:'#E2E8F0', g300:'#CBD5E1',
  g400:'#94A3B8', g500:'#64748B', g700:'#1E293B', g800:'#0F172A',
  success:'#059669', successBg:'#ECFDF5', successBd:'#A7F3D0',
  warn:'#D97706',   warnBg:'#FFFBEB',    warnBd:'#FCD34D',
  danger:'#DC2626', dangerBg:'#FEF2F2',  dangerBd:'#FECACA',
  purple:'#7C3AED', purpleBg:'#F5F3FF',  purpleBd:'#DDD6FE',
  teal:'#0D9488',   tealBg:'#F0FDFA',    tealBd:'#99F6E4',
  orange:'#EA580C', orangeBg:'#FFF7ED',  orangeBd:'#FED7AA',
  blueM: '#0057B8',
};

const apiH = () => ({ Authorization: `Bearer ${localStorage.getItem('token')}`, 'Content-Type': 'application/json' });

const fmt = d => {
  if (!d) return '—';
  try { return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }); } catch { return d; }
};
const fmtDateTime = (d) => {
  if (!d) return '—';
  try { return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(d)); } catch { return d; }
};

const isPast = d => d ? new Date(d).setHours(0,0,0,0) < new Date().setHours(0,0,0,0) : false;

const getDisplayStatut = a => {
  if (!a) return null;
  if (a.statut === 'EN_RETARD') return 'EN_RETARD';
  if (['PLANIFIE','EN_COURS'].includes(a.statut) && isPast(a.deadline)) return 'EN_RETARD';
  return a.statut || null;
};

const matchesStatusFilter = (audit, statusFilter) => {
  if (statusFilter === 'TOUS') return true;
  return getDisplayStatut(audit) === statusFilter;
};

const getQkColorFromValue = value => {
  const qk = value == null ? null : Number(value);
  if (qk == null || Number.isNaN(qk)) return null;
  if (qk === 0) return 'VERT';
  if (qk <= 0.5) return 'ORANGE';
  if (qk <= 1) return 'ROSE';
  return 'ROUGE';
};

const getQkTheme = qkColor => {
  switch (qkColor) {
    case 'VERT':   return { accent: T.success, soft: T.successBg, border: T.successBd };
    case 'ORANGE': return { accent: T.warn,    soft: T.warnBg,    border: T.warnBd };
    case 'ROSE':   return { accent: '#E11D48', soft: '#FFF1F2',   border: '#F9A8D4' };
    case 'ROUGE':  return { accent: T.danger,  soft: T.dangerBg,  border: T.dangerBd };
    default:       return { accent: T.g500,    soft: T.g100,      border: T.g200 };
  }
};

const STATUT_CFG = {
  PLANIFIE:  { bg:'#DBEAFE', text:'#1D4ED8', label:'Planifié',  dot:'#3B82F6' },
  EN_COURS:  { bg:'#FEF9C3', text:'#B45309', label:'En cours',  dot:'#F59E0B' },
  TERMINE:   { bg:'#DCFCE7', text:'#15803D', label:'Terminé',   dot:'#22C55E' },
  EN_RETARD: { bg:'#FEE2E2', text:'#B91C1C', label:'En retard', dot:'#EF4444' },
  ANNULE:    { bg:'#F3F4F6', text:'#6B7280', label:'Annulé',    dot:'#9CA3AF' },
};

/* ─── SVG Icons ─── */
const Ic = {
  edit:     <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  trash:    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>,
  eye:      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>,
  send:     <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>,
  filter:   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>,
  search:   <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  clock:    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  alert:    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
  micro:    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  box:      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>,
  ruler:    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><line x1="5" y1="12" x2="19" y2="12"/><line x1="5" y1="6" x2="19" y2="6"/><line x1="5" y1="18" x2="19" y2="18"/></svg>,
  plus:     <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  arrow:    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>,
  pdca:     <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.51"/></svg>,
  download: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>,
};

/* ─── Shared form styles ─── */
const LBL = { display:'block', fontSize:'.69rem', fontWeight:700, color:T.g500, textTransform:'uppercase', letterSpacing:'.05em', marginBottom:4 };
const INP = { width:'100%', padding:'8px 11px', border:`1px solid ${T.g300}`, borderRadius:8, fontSize:'.84rem', fontFamily:'inherit', background:'#fff', boxSizing:'border-box', outline:'none' }
/* ─── getSuiviMeta — AUDIT PRODUIT uniquement ─── */
function getSuiviMeta(audit, details = {}) {
  if (!audit) return {};
  const qk = audit.valeurQK;
  const qkColor = getQkColorFromValue(qk) || audit.couleurQK || null;
  const ficheRequired = qk != null && qk > 0;
  const pdcaRequired  = qk != null && qk > 0.5;

  const ficheMeta = details?.ficheMeta || {};
  const pdcaMeta  = details?.pdcaMeta  || {};

  const ficheCreated   = ficheMeta.dateCreation ? new Date(ficheMeta.dateCreation) : null;
  const ficheSent      = ficheMeta.dateDernierEnvoi ? new Date(ficheMeta.dateDernierEnvoi) : null;
  const ficheValidated = ficheMeta.dateValidation   ? new Date(ficheMeta.dateValidation)   : null;
  const ficheValidee   = ficheMeta.valide === true  || ficheMeta.statut === 'VALIDEE';
  const ficheSentBool  = !!ficheMeta.dateDernierEnvoi;

  const pdcaCreatedRaw   = pdcaMeta.dateCreation || pdcaMeta.createdAt || pdcaMeta.dateOuverture || null;
  const pdcaSentRaw      = pdcaMeta.dateDernierEnvoi || pdcaMeta.dateEnvoi || pdcaMeta.sentAt    || null;
  const pdcaValidatedRaw = pdcaMeta.dateCloture  || pdcaMeta.dateResolution || pdcaMeta.dateValidation || null;
  const pdcaValidee      = pdcaMeta.statut === 'RESOLU' || pdcaMeta.statut === 'FERME' || pdcaMeta.valide === true || pdcaMeta.statut === 'VALIDE' || pdcaMeta.statut === 'VALIDEE';
  const pdcaValidatedFallback = pdcaValidee ? (pdcaValidatedRaw || pdcaMeta.dateModification || pdcaMeta.updatedAt || null) : pdcaValidatedRaw;
  const pdcaCreated    = pdcaCreatedRaw       ? new Date(pdcaCreatedRaw)       : null;
  const pdcaSent       = pdcaSentRaw          ? new Date(pdcaSentRaw)          : null;
  const pdcaValidated  = pdcaValidatedFallback ? new Date(pdcaValidatedFallback) : null;
  const pdcaSentBool   = !!pdcaSentRaw;

  const rapportGenere = audit.rapportGenere || false;
  const rapportDate   = audit.rapportGenerePdfUrl ? audit.dateModification : null;
  const canGenerate   = !rapportGenere && (!ficheRequired || ficheValidee) && (!pdcaRequired || pdcaValidee);

  return {
    qkColor, ficheRequired, pdcaRequired, ficheValidee, pdcaValidee,
    ficheSent: ficheSentBool, pdcaSent: pdcaSentBool,
    rapportGenere, canGenerate, rapportDate,
    fiche: {
      required: ficheRequired,
      createdAt: ficheCreated, createdText: ficheCreated ? fmt(ficheCreated) : '—',
      sentAt: ficheSent, sentText: ficheSent ? fmtDateTime(ficheSent) : '—',
      validatedAt: ficheValidated, validatedText: ficheValidated ? fmtDateTime(ficheValidated) : '—',
      sent: ficheSentBool, validated: ficheValidee,
      statusLabel: ficheValidee ? 'Validée' : ficheSentBool ? 'Envoyée' : ficheRequired ? 'À créer' : 'Non requis',
    },
    pdca: {
      required: pdcaRequired,
      createdAt: pdcaCreated, createdText: pdcaCreated ? fmt(pdcaCreated) : '—',
      sentAt: pdcaSent, sentText: pdcaSent ? fmtDateTime(pdcaSent) : '—',
      validatedAt: pdcaValidated, validatedText: pdcaValidated ? fmtDateTime(pdcaValidated) : '—',
      sent: pdcaSentBool, validated: pdcaValidee,
      statusLabel: pdcaValidee ? 'Validé' : pdcaSentBool ? 'Envoyé' : pdcaRequired ? 'À créer' : 'Non requis',
    },
  };
}

/* ─── getSuiviMetaReglePlate — AUDIT RÈGLE PLATE ─── */
function getSuiviMetaReglePlate(audit) {
  if (!audit) return { steps: [], pct: 0, theme: getQkTheme(null) };

  const statut        = audit.statut || 'PLANIFIE';
  const estTermine    = statut === 'TERMINE';
  const rapportGenere = !!(audit.rapportGenere || audit.rapportUrl || audit.rapportGenerePdfUrl);

  // ── Recalcul instruments depuis checklistJson ──
  let instruments = [];
  try {
    if (audit.checklistJson) {
      const parsed = JSON.parse(audit.checklistJson);
      instruments = parsed.rows || [];
    }
  } catch {}

  const hasChecklist     = !!(audit.checklistJson || audit.formulaireJson);
  const nonConformes     = instruments.filter(r => r.resultat === 'non conforme');
  const conformes        = instruments.filter(r => r.resultat === 'conforme');
  const nonConformesCount = nonConformes.length;

  // hasNC = vrai SEULEMENT s'il y a des instruments réellement non conformes
  const hasNC      = nonConformesCount > 0;
  const pdcaStatut = audit.pdcaStatut || null;
  const pdcaSent   = !!(audit.pdcaEnvoyeAt || (audit.pdcaDeclenche && hasNC));
  const pdcaResolu = pdcaStatut === 'RESOLU' || pdcaStatut === 'FERME';

  const steps = [
    {
      key: 'planifie',
      label: 'Planifié',
      status: 'Fait',
      done: true,
    },
    {
      key: 'demarre',
      label: 'Démarré',
      status: ['EN_COURS','TERMINE'].includes(statut) ? 'En cours' : 'À démarrer',
      done: ['EN_COURS','TERMINE'].includes(statut),
    },
    {
      key: 'formulaire',
      label: 'Formulaire',
      // Fait si checklist renseignée OU si audit terminé/rapport généré
      status: hasChecklist ? 'Saisi' : (estTermine || rapportGenere) ? 'Complété' : 'À remplir',
      done: hasChecklist || estTermine || rapportGenere,
    },
    {
      key: 'conformite',
      label: 'Conformité',
      status: rapportGenere || estTermine ? 'Vérifiée' : hasChecklist ? 'À vérifier' : 'En attente',
      done: rapportGenere || estTermine,
    },
  ];

  // Étape PDCA uniquement si non-conformités réelles
  if (hasNC) {
    steps.push({
      key: 'pdca',
      label: 'PDCA',
      // Fait si résolu OU audit terminé
      status: pdcaResolu || estTermine ? 'Résolu' : pdcaSent ? 'Envoyé' : 'À créer',
      done: pdcaResolu || estTermine,
    });
  }

  steps.push({
    key: 'rapport',
    label: 'Rapport',
    status: rapportGenere ? 'Généré' : 'En attente',
    done: rapportGenere,
  });

  steps.push({
    key: 'termine',
    label: 'Terminé',
    status: estTermine ? 'Clôturé' : 'À finaliser',
    done: estTermine,
  });

  const done = steps.filter(s => s.done).length;
  const pct  = Math.round((done / steps.length) * 100);

  const theme = { accent: T.teal, soft: T.tealBg, border: T.tealBd };

  return { steps, pct, theme, instruments, nonConformes, conformes, hasNC, pdcaSent, pdcaResolu, rapportGenere, estTermine };
}

/* ─── getSuiviMetaExport — AUDIT MAGASIN EXPORT ─── */
function getSuiviMetaExport(audit) {
  if (!audit) return { steps: [], pct: 0, theme: getQkTheme(null) };

  const statut        = audit.statut || 'PLANIFIE';
  const estTermine    = statut === 'TERMINE';
  const rapportGenere = !!(audit.rapportGenere || audit.rapportUrl || audit.rapportGenerePdfUrl);

  const hasFormulaire = !!(audit.scoresJson || audit.criteresExportJson || audit.formulaireJson || audit.checklistJson);
  const resultatPct   = audit.resultatAuditPourcentage ?? null;
  const hasResultat   = resultatPct !== null;
  const isParfait     = resultatPct === 100;

  // hasNC uniquement si résultat réel ET < 100
  const hasNC       = hasResultat && !isParfait;
  const emailEnvoye = !!(audit.emailResponsableMagasin || audit.emailEnvoyeAt || audit.planActionEnvoyeAt);
  const valideResp  = audit.valideParResponsableMagasin === true;
  const planStatut  = audit.planActionStatut || null;
  const planResolu  = planStatut === 'RESOLU' || valideResp;

  const steps = [
    {
      key: 'planifie',
      label: 'Planifié',
      status: 'Fait',
      done: true,
    },
    {
      key: 'demarre',
      label: 'Démarré',
      status: ['EN_COURS','TERMINE'].includes(statut) ? 'En cours' : 'À démarrer',
      done: ['EN_COURS','TERMINE'].includes(statut),
    },
    {
      key: 'saisie',
      label: 'Saisie critères',
      // Fait si formulaire rempli OU audit terminé/rapport généré
      status: hasFormulaire ? 'Saisi' : (estTermine || rapportGenere) ? 'Complété' : 'À remplir',
      done: hasFormulaire || estTermine || rapportGenere,
    },
    {
      key: 'resultat',
      label: 'Résultat',
      // Fait si résultat présent OU audit terminé
      status: hasResultat ? `${resultatPct}%` : (estTermine || rapportGenere) ? 'Enregistré' : 'En attente',
      done: hasResultat || estTermine || rapportGenere,
    },
  ];

  if (hasNC) {
    steps.push({
      key: 'notif',
      label: 'Notification',
      // Fait si email envoyé OU plan résolu OU audit terminé
      status: emailEnvoye ? 'Email envoyé' : (planResolu || estTermine) ? 'Traitée' : 'À envoyer',
      done: emailEnvoye || planResolu || estTermine,
    });
    steps.push({
      key: 'validation',
      label: 'Validation resp.',
      // Fait si validé OU audit terminé
      status: planResolu || estTermine ? 'Validé ✓' : planStatut === 'EN_COURS' ? 'En cours' : 'En attente',
      done: planResolu || estTermine,
    });
  }

  steps.push({
    key: 'rapport',
    label: 'Rapport PDF',
    status: rapportGenere
      ? 'Généré'
      : hasNC
        ? (planResolu || estTermine) ? 'Prêt' : 'En attente'
        : (hasResultat || estTermine) ? 'Prêt' : 'En attente',
    done: rapportGenere,
  });

  steps.push({
    key: 'termine',
    label: 'Terminé',
    status: estTermine ? 'Clôturé' : 'À finaliser',
    done: estTermine,
  });

  const done = steps.filter(s => s.done).length;
  const pct  = Math.round((done / steps.length) * 100);

  const theme = { accent: T.purple, soft: T.purpleBg, border: T.purpleBd };

  const getResultatTheme = () => {
    if (resultatPct === null) return null;
    if (resultatPct === 100) return { color: T.success, bg: T.successBg, bd: T.successBd, label: '100% conforme' };
    if (resultatPct >= 80)   return { color: T.warn,    bg: T.warnBg,    bd: T.warnBd,    label: 'Non-conf. mineures' };
    return { color: T.danger, bg: T.dangerBg, bd: T.dangerBd, label: 'Non-conf. critiques' };
  };

  return {
    steps, pct, theme,
    hasFormulaire, resultatPct, isParfait, hasNC,
    emailEnvoye, valideResp, planResolu, planStatut,
    rapportGenere, estTermine,
    resultatTheme: getResultatTheme(),
  };
}

/* ─── Résolution URL rapport pour le suivi ─── */
const BASE_URL = (typeof window !== 'undefined' && import.meta?.env?.VITE_API_URL
  ? import.meta.env.VITE_API_URL
  : 'http://localhost:8080/api').replace('/api', '');

function resolveRapportUrl(audit) {
  if (!audit) return null;
  const candidates = [
    audit.rapportGenerePdfUrl,
    audit.rapportPdfUrl,
    audit.rapportUrl,
    audit.pdfUrl,
    audit.rapportFichierUrl,
  ].filter(Boolean);
  const rawUrl = candidates[0] || null;
  if (!rawUrl) return null;
  const url = String(rawUrl);
  return url.startsWith('http') ? url : `${BASE_URL}/${url.replace(/^\//, '')}`;
}

async function downloadRapport(url, filename) {
  try {
    const token = localStorage.getItem('token');
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const res = await fetch(url, { headers });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const blob = await res.blob();
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = blobUrl; a.download = filename || 'rapport.pdf';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(blobUrl), 8000);
  } catch { window.open(url, '_blank', 'noopener,noreferrer'); }
}

/* ─── computeSteps — AUDIT PRODUIT uniquement ─── */
function computeStepsProduit(audit, details = {}) {
  if (!audit) return [];
  const meta    = getSuiviMeta(audit, details);
  const qkColor = getQkColorFromValue(audit?.valeurQK) || meta.qkColor || audit?.couleurQK || null;
  const ficheReq      = ['ORANGE','ROSE','ROUGE'].includes(qkColor);
  const pdcaReq       = ['ROSE','ROUGE'].includes(qkColor);
  const ficheValidee  = meta.ficheValidee;
  const pdcaValidee   = meta.pdcaValidee;
  const ficheSent     = meta.ficheSent;
  const pdcaSent      = meta.pdcaSent;
  const rapportGenere = meta.rapportGenere;
  const annexesList   = details?.annexes || [];
  const hasRapportImporte = !!(audit?.rapportUrl || audit?.rapportFichierNom || audit?.rapportImporte);
  const hasAnnexes    = annexesList.length > 0;
  const allAnnexesDone = hasAnnexes && annexesList.every(a => a.importe || a.formValide);
  const workflow = hasRapportImporte ? 'RAPPORT' : hasAnnexes ? 'ANNEXES' : null;

  const steps = [];
  steps.push({ key:'start', label:'Commencer', status:'Fait', done:true });

  if (workflow === 'RAPPORT') {
    steps.push({ key:'rapport', label:'Import rapport', status:hasRapportImporte ? 'Importé' : 'À importer', done:hasRapportImporte });
  } else if (workflow === 'ANNEXES') {
    const ok = annexesList.filter(a => a.importe || a.formValide).length;
    steps.push({ key:'annexes', label:'Annexes', status:allAnnexesDone ? `${ok}/${annexesList.length} ✓` : `${ok}/${annexesList.length}`, done:allAnnexesDone });
  } else {
    steps.push({ key:'docs', label:'Documents', status:'Non commencé', done:false });
  }

  if (workflow === 'RAPPORT') {
    const qkLabel = { VERT:'Conforme', ORANGE:'Non-conf. mineure', ROSE:'Action corrective', ROUGE:'Alerte critique' };
    steps.push({ key:'qk', label:'Saisie QK', status:qkColor != null ? (qkLabel[qkColor] || 'Saisi') : 'À saisir', done:qkColor != null });
  }

  if (audit?.valeurQK != null && audit.valeurQK > 0.5 && ficheReq && pdcaReq) {
    steps.push({ key:'fiche-pdca', label:'Fiche + PDCA', status:ficheValidee && pdcaValidee ? 'Validés' : ficheSent || pdcaSent ? 'En cours' : 'À créer', done:ficheValidee && pdcaValidee });
  } else {
    if (ficheReq) steps.push({ key:'fiche', label:'Fiche', status:ficheValidee ? 'Validée' : ficheSent ? 'Envoyée' : 'À créer', done:ficheValidee });
    if (pdcaReq)  steps.push({ key:'pdca',  label:'PDCA',  status:pdcaValidee  ? 'Validé'  : pdcaSent  ? 'Envoyé'  : 'À créer', done:pdcaValidee });
  }

  steps.push({ key:'gen', label:'Rapport', status:rapportGenere ? 'Généré' : meta.canGenerate ? 'À générer' : 'En attente', done:rapportGenere });
  steps.push({ key:'fin', label:'Terminé',  status:audit?.statut === 'TERMINE' ? 'Clôturé' : 'À finaliser', done:audit?.statut === 'TERMINE' });
  return steps;
}

/* ─── StatCard ─── */
function StatCard({ title, count, desc, icon, color, bg, onClick, active }) {
  const [hov, setHov] = useState(false);
  return (
    <div onClick={onClick}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        background: active ? 'linear-gradient(145deg,#002855 0%,#003F8A 60%,#0057B8 100%)' : '#fff',
        borderRadius: 16, cursor: 'pointer', transition: 'all .2s',
        border: `2px solid ${active ? '#003F8A' : hov ? T.navy : T.g200}`,
        boxShadow: active || hov ? '0 8px 24px rgba(11,30,61,.15)' : '0 1px 4px rgba(0,0,0,.05)',
        transform: hov && !active ? 'translateY(-2px)' : 'none',
        padding: '1.25rem 1.5rem',
      }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:'.75rem', fontWeight:700, color: active ? 'rgba(255,255,255,.6)' : T.g400, textTransform:'uppercase', letterSpacing:'.06em', marginBottom:4 }}>{title}</div>
          <div style={{ fontSize:'2rem', fontWeight:900, color: active ? '#fff' : T.navy, lineHeight:1, marginBottom:4 }}>{count}</div>
          <div style={{ fontSize:'.73rem', color: active ? 'rgba(255,255,255,.55)' : T.g400, fontWeight:600 }}>{desc}</div>
        </div>
        <div style={{ width:44, height:44, borderRadius:12, background: active ? 'rgba(255,255,255,.15)' : bg, color: active ? '#fff' : color, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, marginLeft:12 }}>
          {icon}
        </div>
      </div>
    </div>
  );
}

/* ─── RapportActions — boutons Voir / Télécharger ─── */
function RapportActions({ audit, type }) {
  const [downloading, setDownloading] = useState(false);

  const getRapportUrl = () => {
    if (type === 'produit' && audit?.id) {
      return `${BASE_URL}/api/audit-produit/${audit.id}/rapport-pdf`;
    }
    return resolveRapportUrl(audit);
  };

  const rapportUrl        = getRapportUrl();
  const rapportDisponible = !!(audit?.rapportGenere || audit?.rapportUrl || audit?.rapportGenerePdfUrl);

  if (!rapportDisponible || !rapportUrl) return null;

  const handleView = () => {
    const token = localStorage.getItem('token') || '';
    const sep   = rapportUrl.includes('?') ? '&' : '?';
    window.open(`${rapportUrl}${sep}token=${token}`, '_blank', 'noopener,noreferrer');
  };

  const handleDownload = async () => {
    setDownloading(true);
    const ref = audit?.reference || `rapport-${audit?.id}`;
    await downloadRapport(rapportUrl, `${ref}.pdf`);
    setDownloading(false);
  };

  return (
    <div style={{ background:'#fff', borderRadius:16, border:`1px solid ${T.g200}`, padding:'14px 16px', borderTop:`4px solid ${T.success}` }}>
      <div style={{ fontWeight:800, fontSize:'.82rem', color:T.navy, marginBottom:10, display:'flex', alignItems:'center', gap:8 }}>
        <span style={{ color:T.success, fontSize:'1rem' }}>✓</span> Rapport PDF disponible
      </div>
      <div style={{ display:'flex', gap:10 }}>
        <button onClick={handleView}
          style={{ flex:1, display:'inline-flex', alignItems:'center', justifyContent:'center', gap:7, padding:'9px 14px', borderRadius:9, border:`1.5px solid #93C5FD`, background:'#EFF6FF', color:'#2563EB', fontWeight:700, fontSize:'.8rem', cursor:'pointer', fontFamily:"'Inter',sans-serif" }}>
          {Ic.eye} Voir le rapport
        </button>
        <button onClick={handleDownload} disabled={downloading}
          style={{ flex:1, display:'inline-flex', alignItems:'center', justifyContent:'center', gap:7, padding:'9px 14px', borderRadius:9, border:'none', background: downloading ? T.g200 : T.success, color:'#fff', fontWeight:700, fontSize:'.8rem', cursor: downloading ? 'not-allowed' : 'pointer', fontFamily:"'Inter',sans-serif", opacity: downloading ? .7 : 1, boxShadow: downloading ? 'none' : '0 4px 12px rgba(5,150,105,.25)' }}>
          {downloading ? '…' : Ic.download}
          {downloading ? 'Téléchargement…' : 'Télécharger'}
        </button>
      </div>
    </div>
  );
}

/* ─── Audit Produit Card ─── */
function ProduitCardExpert({ audit, onEdit, onDelete, onFollow, onViewMessage, loading }) {
  const [hov, setHov] = useState(false);
  const statut    = getDisplayStatut(audit);
  const stCfg     = STATUT_CFG[statut] || STATUT_CFG.PLANIFIE;
  const retard    = statut === 'EN_RETARD';
  const demandeStatut = audit.demandeExtension?.statut;

  const getQkConfig = (value) => {
    if (value === null || value === undefined || value === '') return null;
    const qk = Number(value);
    if (!Number.isFinite(qk)) return null;
    if (qk === 0) return { bg:'#DCFCE7', bd:'#86EFAC', text:'#15803D', displayValue:`${qk} (Conforme)` };
    if (qk <= 0.5) return { bg:'#FEF9C3', bd:'#FCD34D', text:'#B45309', displayValue:`${qk} (Non-conforme)` };
    if (qk <= 1)   return { bg:'#FCE7F3', bd:'#F9A8D4', text:'#9D174D', displayValue:`${qk} (Non-conforme)` };
    return { bg:'#FEE2E2', bd:'#FCA5A5', text:'#B91C1C', displayValue:`${qk} (Non-conforme)` };
  };

  const qkConfig = getQkConfig(audit.valeurQK);

  return (
    <div onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        background:'#f4f4f4', borderRadius:16,
        border:`1.5px solid ${retard ? T.dangerBd : hov ? T.g400 : T.g300}`,
        boxShadow: hov ? '0 12px 32px rgba(0,0,0,.10)' : retard ? '0 2px 8px rgba(220,38,38,.10)' : '0 2px 8px rgba(0,0,0,.05)',
        transform: hov ? 'translateY(-3px)' : 'none', transition: 'all .2s',
        padding:'1.25rem', display:'flex', flexDirection:'column', position:'relative', overflow:'hidden',
      }}>
      {retard && <div style={{ position:'absolute', top:0, left:0, right:0, height:3, background:'linear-gradient(90deg,#DC2626,#EF4444,#F87171)' }}/>}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:12 }}>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontWeight:800, fontSize:'.85rem', color:T.navy, marginBottom:2, wordBreak:'break-word', lineHeight:1.3 }}>
            {audit.reference || `AUD-${audit.id}`}
          </div>
          <div style={{ fontSize:'.68rem', color:T.g400, display:'flex', alignItems:'center', gap:5, flexWrap:'wrap', marginTop:2 }}>
            <span style={{ display:'inline-flex', alignItems:'center', gap:3 }}>{Ic.clock} {fmt(audit.datePrevue)}</span>
            {retard && <span style={{ color:T.danger, fontWeight:700, display:'inline-flex', alignItems:'center', gap:3 }}>{Ic.alert} EN RETARD</span>}
          </div>
        </div>
        <span style={{ background:stCfg.bg, color:stCfg.text, fontSize:'.62rem', fontWeight:800, padding:'2px 8px', borderRadius:99, flexShrink:0, display:'flex', alignItems:'center', gap:3 }}>
          <span style={{ width:4, height:4, borderRadius:'50%', background:stCfg.dot, display:'inline-block' }}/>
          {stCfg.label}
        </span>
      </div>
      {retard && (
        <div style={{ background:T.dangerBg, border:`1px solid ${T.dangerBd}`, borderRadius:8, padding:'6px 10px', marginBottom:10, fontSize:'.68rem', color:T.danger, fontWeight:600, display:'flex', alignItems:'center', gap:6 }}>
          {Ic.alert}<span>Audit bloqué — deadline dépassée le <strong>{fmt(audit.deadline)}</strong></span>
        </div>
      )}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6, marginBottom:10 }}>
        {[
          { l:'Plant',    v: audit.plantNom   || '—' },
          { l:'Auditeur', v: audit.auditeurNom || '—' },
          { l:'Planif.',  v: audit.planificationNom || '—' },
          { l:'Deadline', v: fmt(audit.deadline), danger: retard },
          { l:'Projet',   v: audit.projetNom  || '—' },
          { l:'Série',    v: audit.serieNom   || '—' },
        ].map(x => (
          <div key={x.l} style={{ background:T.g50, borderRadius:8, padding:'5px 8px' }}>
            <div style={{ fontSize:'.55rem', color:T.g400, fontWeight:700, textTransform:'uppercase', letterSpacing:'.05em', marginBottom:2 }}>{x.l}</div>
            <div style={{ fontSize:'.7rem', color: x.danger ? T.danger : T.g700, fontWeight: x.danger ? 800 : 600, wordBreak:'break-word', lineHeight:1.3 }}>{x.v}</div>
          </div>
        ))}
      </div>
      {qkConfig && (
        <div style={{ background:qkConfig.bg, border:`1px solid ${qkConfig.bd}`, borderRadius:8, padding:'5px 10px', marginBottom:10, display:'flex', alignItems:'center', gap:7 }}>
          <svg width="10" height="10" viewBox="0 0 24 24" fill={qkConfig.text}><circle cx="12" cy="12" r="10"/></svg>
          <span style={{ fontSize:'.72rem', fontWeight:700, color:qkConfig.text }}>QK={qkConfig.displayValue}</span>
        </div>
      )}
      <div style={{ display:'flex', gap:8, marginTop:'auto', paddingTop:8, borderTop:`1px solid ${T.g100}` }}>
        <button onClick={onFollow} style={{ flex:1, display:'inline-flex', alignItems:'center', justifyContent:'center', gap:5, padding:'7px', borderRadius:9, border:'none', background:'linear-gradient(145deg,#002855 0%,#003F8A 60%,#0057B8 100%)', color:'#fff', fontWeight:700, fontSize:'.74rem', cursor:'pointer', fontFamily:"'Inter',sans-serif", boxShadow:'0 8px 18px rgba(0,40,85,.18)' }}>
          {Ic.eye} Suivi
        </button>
        <button onClick={onEdit} style={{ flex:1, display:'inline-flex', alignItems:'center', justifyContent:'center', gap:5, padding:'7px', borderRadius:9, border:`1.5px solid ${T.g400}`, background:T.g200, color:T.g700, fontWeight:700, fontSize:'.74rem', cursor:'pointer', fontFamily:"'Inter',sans-serif" }}>
          {Ic.edit} Modifier
        </button>
        <button onClick={onDelete} disabled={loading} style={{ width:34, height:34, display:'inline-flex', alignItems:'center', justifyContent:'center', borderRadius:9, border:`2px solid ${T.dangerBd}`, background:T.dangerBg, color:T.danger, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? .6 : 1 }}>
          {loading ? '…' : Ic.trash}
        </button>
      </div>
      {demandeStatut && (
        <div style={{ marginTop:10 }}>
          {demandeStatut === 'EN_ATTENTE' ? (
            <button onClick={onViewMessage} style={{ width:'100%', display:'inline-flex', alignItems:'center', gap:8, padding:'6px 10px', borderRadius:9, background:T.orangeBg, border:`1.5px solid ${T.orangeBd}`, cursor:'pointer', fontFamily:"'Inter',sans-serif" }}>
              <div style={{ width:24, height:24, borderRadius:'50%', flexShrink:0, background:'linear-gradient(135deg,#7C2D12,#EA580C)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'.7rem' }}>⏳</div>
              <div style={{ flex:1, minWidth:0, textAlign:'left' }}>
                <div style={{ fontSize:'.68rem', fontWeight:800, color:'#7C2D12' }}>Demande de prolongation reçue</div>
                <div style={{ fontSize:'.62rem', color:'#C2410C', fontWeight:600 }}>Cliquez pour consulter et traiter</div>
              </div>
              {Ic.arrow}
            </button>
          ) : demandeStatut === 'TRAITEE' ? (
            <button onClick={onViewMessage} style={{ width:'100%', display:'inline-flex', alignItems:'center', gap:8, padding:'6px 10px', borderRadius:9, background:T.successBg, border:`1.5px solid ${T.successBd}`, cursor:'pointer', fontFamily:"'Inter',sans-serif" }}>
              <div style={{ width:24, height:24, borderRadius:'50%', flexShrink:0, background:'linear-gradient(135deg,#059669,#10B981)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'.7rem', color:'#fff', fontWeight:800 }}>✓</div>
              <div style={{ flex:1, minWidth:0, textAlign:'left' }}>
                <div style={{ fontSize:'.68rem', fontWeight:800, color:'#065F46' }}>Demande traitée</div>
                <div style={{ fontSize:'.62rem', color:T.success, fontWeight:600 }}>Cliquez pour voir le détail</div>
              </div>
              {Ic.arrow}
            </button>
          ) : null}
        </div>
      )}
    </div>
  );
}

/* ─── Règle Plate Card ─── */
function ReglePlateCardExpert({ audit, onEdit, onDelete, onFollow, loading }) {
  const [hov, setHov] = useState(false);
  const statut = getDisplayStatut(audit);
  const stCfg  = STATUT_CFG[statut] || STATUT_CFG.PLANIFIE;
  const retard = statut === 'EN_RETARD';
  return (
    <div onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ background:'#fff', borderRadius:16, border:`1.5px solid ${retard ? T.dangerBd : hov ? T.teal : T.g200}`, boxShadow: hov ? `0 12px 32px ${T.teal}20` : '0 2px 8px rgba(0,0,0,.05)', transform: hov ? 'translateY(-3px)' : 'none', transition:'all .2s', padding:'1.25rem', display:'flex', flexDirection:'column', position:'relative', overflow:'hidden' }}>
      {retard && <div style={{ position:'absolute', top:0, left:0, right:0, height:3, background:'linear-gradient(90deg,#DC2626,#EF4444,#F87171)' }}/>}
      {!retard && <div style={{ position:'absolute', top:0, left:0, right:0, height:3, background:`linear-gradient(90deg,${T.teal},${T.tealBd})` }}/>}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:12 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10, flex:1 }}>
          <div style={{ width:40, height:40, borderRadius:10, background:T.tealBg, border:`1px solid ${T.tealBd}`, display:'flex', alignItems:'center', justifyContent:'center', color:T.teal, flexShrink:0 }}>{Ic.ruler}</div>
          <div>
            <div style={{ fontWeight:800, fontSize:'.9rem', color:T.navy }}>{audit.reference || `RP-${audit.id}`}</div>
            <div style={{ fontSize:'.71rem', color:T.g400, marginTop:2, display:'flex', alignItems:'center', gap:5 }}>{Ic.clock} {fmt(audit.datePrevue)}</div>
          </div>
        </div>
        <span style={{ background:stCfg.bg, color:stCfg.text, fontSize:'.65rem', fontWeight:800, padding:'3px 9px', borderRadius:99, flexShrink:0, display:'flex', alignItems:'center', gap:4 }}>
          <span style={{ width:5, height:5, borderRadius:'50%', background:stCfg.dot, display:'inline-block' }}/>{stCfg.label}
        </span>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6, marginBottom:12 }}>
        {[
          { l:'Plant',    v: audit.plantNom    || '—' },
          { l:'Auditeur', v: audit.auditeurNom || '—' },
          { l:'Prévu le', v: fmt(audit.datePrevue) },
          { l:'Deadline', v: fmt(audit.deadline), danger: retard },
          audit.planificateurNom && { l:'Planifié par', v: audit.planificateurNom },
        ].map(x => (
          <div key={x.l} style={{ background:T.g50, borderRadius:8, padding:'6px 9px' }}>
            <div style={{ fontSize:'.6rem', color:T.g400, fontWeight:700, textTransform:'uppercase', letterSpacing:'.05em', marginBottom:2 }}>{x.l}</div>
            <div style={{ fontSize:'.75rem', color: x.danger ? T.danger : T.g700, fontWeight: x.danger ? 800 : 600 }}>{x.v}</div>
          </div>
        ))}
      </div>
      <div style={{ display:'inline-flex', alignItems:'center', gap:6, background:T.tealBg, color:T.teal, borderRadius:99, padding:'4px 10px', fontSize:'.68rem', fontWeight:700, marginBottom:12, border:`1px solid ${T.tealBd}`, alignSelf:'flex-start' }}>
        {Ic.ruler} Règle Plate
      </div>
      <div style={{ display:'flex', gap:8, marginTop:'auto', paddingTop:8, borderTop:`1px solid ${T.g100}` }}>
        <button onClick={onFollow} style={{ flex:1, display:'inline-flex', alignItems:'center', justifyContent:'center', gap:6, padding:'8px', borderRadius:9, border:'none', background:'linear-gradient(145deg,#002855 0%,#003F8A 60%,#0057B8 100%)', color:'#fff', fontWeight:700, fontSize:'.78rem', cursor:'pointer', fontFamily:"'Inter',sans-serif", boxShadow:'0 8px 18px rgba(0,40,85,.18)' }}>
          {Ic.eye} Suivi
        </button>
        <button onClick={onEdit} style={{ flex:1, display:'inline-flex', alignItems:'center', justifyContent:'center', gap:6, padding:'8px', borderRadius:9, border:`1.5px solid ${T.g300}`, background:T.g50, color:T.g700, fontWeight:700, fontSize:'.78rem', cursor:'pointer', fontFamily:"'Inter',sans-serif" }}>
          {Ic.edit} Modifier
        </button>
        <button onClick={onDelete} disabled={loading} style={{ width:36, height:36, display:'inline-flex', alignItems:'center', justifyContent:'center', borderRadius:9, border:`1.5px solid ${T.dangerBd}`, background:T.dangerBg, color:T.danger, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? .6 : 1 }}>
          {loading ? '…' : Ic.trash}
        </button>
      </div>
    </div>
  );
}

/* ─── Export Card ─── */
function ExportCardExpert({ audit, onEdit, onDelete, onFollow, loading }) {
  const [hov, setHov] = useState(false);
  const statut = getDisplayStatut(audit);
  const stCfg  = STATUT_CFG[statut] || STATUT_CFG.PLANIFIE;
  const retard = statut === 'EN_RETARD';
  return (
    <div onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ background:'#fff', borderRadius:16, border:`1.5px solid ${retard ? T.dangerBd : hov ? T.purple : T.g200}`, boxShadow: hov ? `0 12px 32px ${T.purple}20` : '0 2px 8px rgba(0,0,0,.05)', transform: hov ? 'translateY(-3px)' : 'none', transition:'all .2s', padding:'1.25rem', display:'flex', flexDirection:'column', position:'relative', overflow:'hidden' }}>
      {retard && <div style={{ position:'absolute', top:0, left:0, right:0, height:3, background:'linear-gradient(90deg,#DC2626,#EF4444,#F87171)' }}/>}
      {!retard && <div style={{ position:'absolute', top:0, left:0, right:0, height:3, background:`linear-gradient(90deg,${T.purple},${T.purpleBd})` }}/>}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:12 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10, flex:1 }}>
          <div style={{ width:40, height:40, borderRadius:10, background:T.purpleBg, border:`1px solid ${T.purpleBd}`, display:'flex', alignItems:'center', justifyContent:'center', color:T.purple, flexShrink:0 }}>{Ic.box}</div>
          <div>
            <div style={{ fontWeight:800, fontSize:'.9rem', color:T.navy }}>{audit.reference || `EX-${audit.id}`}</div>
            <div style={{ fontSize:'.71rem', color:T.g400, marginTop:2, display:'flex', alignItems:'center', gap:5 }}>{Ic.clock} {fmt(audit.datePrevue)}</div>
          </div>
        </div>
        <span style={{ background:stCfg.bg, color:stCfg.text, fontSize:'.65rem', fontWeight:800, padding:'3px 9px', borderRadius:99, flexShrink:0, display:'flex', alignItems:'center', gap:4 }}>
          <span style={{ width:5, height:5, borderRadius:'50%', background:stCfg.dot, display:'inline-block' }}/>{stCfg.label}
        </span>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6, marginBottom:12 }}>
        {[
          { l:'Auditeur', v: audit.auditeurNom || '—' },
          { l:'Zone',     v: audit.zoneExpedition || '—' },
          { l:'Semaine',  v: audit.semaineExport || '—' },
          { l:'Prévu le', v: fmt(audit.datePrevue) },
          audit.planificateurNom && { l:'Planifié par', v: audit.planificateurNom },
        ].map(x => (
          <div key={x.l} style={{ background:T.g50, borderRadius:8, padding:'6px 9px' }}>
            <div style={{ fontSize:'.6rem', color:T.g400, fontWeight:700, textTransform:'uppercase', letterSpacing:'.05em', marginBottom:2 }}>{x.l}</div>
            <div style={{ fontSize:'.75rem', color:T.g700, fontWeight:600, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{x.v}</div>
          </div>
        ))}
      </div>
      <div style={{ display:'inline-flex', alignItems:'center', gap:6, background:T.purpleBg, color:T.purple, borderRadius:99, padding:'4px 10px', fontSize:'.68rem', fontWeight:700, marginBottom:12, border:`1px solid ${T.purpleBd}`, alignSelf:'flex-start' }}>
        {Ic.box} Magasin Export
      </div>
      <div style={{ display:'flex', gap:8, marginTop:'auto', paddingTop:8, borderTop:`1px solid ${T.g100}` }}>
        <button onClick={onFollow} style={{ flex:1, display:'inline-flex', alignItems:'center', justifyContent:'center', gap:6, padding:'8px', borderRadius:9, border:'none', background:'linear-gradient(145deg,#002855 0%,#003F8A 60%,#0057B8 100%)', color:'#fff', fontWeight:700, fontSize:'.78rem', cursor:'pointer', fontFamily:"'Inter',sans-serif", boxShadow:'0 8px 18px rgba(0,40,85,.18)' }}>
          {Ic.eye} Suivi
        </button>
        <button onClick={onEdit} style={{ flex:1, display:'inline-flex', alignItems:'center', justifyContent:'center', gap:6, padding:'8px', borderRadius:9, border:`1.5px solid ${T.g300}`, background:T.g50, color:T.g700, fontWeight:700, fontSize:'.78rem', cursor:'pointer', fontFamily:"'Inter',sans-serif" }}>
          {Ic.edit} Modifier
        </button>
        <button onClick={onDelete} disabled={loading} style={{ width:36, height:36, display:'inline-flex', alignItems:'center', justifyContent:'center', borderRadius:9, border:`1.5px solid ${T.dangerBd}`, background:T.dangerBg, color:T.danger, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? .6 : 1 }}>
          {loading ? '…' : Ic.trash}
        </button>
      </div>
    </div>
  );
}

/* ─── Modal Créer Règle Plate ─── */
function CreerReglePlateModal({ onClose, onSuccess, plantScope }) {
  const [auditeurs, setAuditeurs] = useState([]);
  const [plants,    setPlants]    = useState([]);
  const [plantId,   setPlantId]   = useState('');
  const [auditeurId,setAuditeur]  = useState('');
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState('');
  const [success,   setSuccess]   = useState('');
  const lockedPlantId = plantScope?.plantId || '';

  const today    = () => new Date().toISOString().split('T')[0];
  const in1Month = () => { const d = new Date(); d.setMonth(d.getMonth() + 1); return d.toISOString().split('T')[0]; };

  useEffect(() => {
    const h = apiH();
    fetch('http://localhost:8080/api/utilisateurs/auditeurs', { headers: h }).then(r => r.json()).then(d => {
      const list = Array.isArray(d) ? d : (d.content || []);
      setAuditeurs(list.filter(u => u.actif !== false).map(u => ({ value: String(u.id), label: `${u.prenom||''} ${u.nom||''}`.trim() })));
    }).catch(() => {});
    fetch('http://localhost:8080/api/sites/plants', { headers: h }).then(r => r.json()).then(d => {
      setPlants((Array.isArray(d) ? d : []).map(p => ({ value: String(p.id), label: p.nom || `Plant ${p.id}` })));
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (lockedPlantId) setPlantId(lockedPlantId);
  }, [lockedPlantId]);

  const datePrevue = today();
  const deadline   = in1Month();

  const submit = async () => {
    if (!plantId || !auditeurId) { setError('Plant et auditeur requis'); return; }
    setLoading(true); setError('');
    try {
      await auditSpecialAPI.creerReglePlate({ plantId: parseInt(plantId), auditeurId: parseInt(auditeurId), datePrevue, deadline, observations: '', instruments: [] });
      setSuccess('Audit créé avec succès !');
      setTimeout(() => { onSuccess && onSuccess(); onClose(); }, 1200);
    } catch (e) { setError(e?.response?.data?.message || 'Erreur lors de la création'); }
    setLoading(false);
  };

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.5)', zIndex:1200, display:'flex', alignItems:'center', justifyContent:'center' }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background:'#fff', borderRadius:18, width:'100%', maxWidth:480, boxShadow:'0 24px 64px rgba(0,40,85,.22)', padding:28 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24, paddingBottom:18, borderBottom:`2px solid ${T.tealBg}` }}>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <div style={{ width:44, height:44, background:T.tealBg, borderRadius:12, display:'flex', alignItems:'center', justifyContent:'center', color:T.teal }}>{Ic.ruler}</div>
            <div>
              <div style={{ fontSize:'.7rem', fontWeight:700, color:T.teal, textTransform:'uppercase', letterSpacing:1 }}>Règle Plate</div>
              <h2 style={{ margin:'4px 0 0', color:T.navy, fontSize:'1.1rem', fontWeight:800 }}>Nouvelle planification</h2>
            </div>
          </div>
          <button onClick={onClose} style={{ background:'transparent', border:'none', borderRadius:50, width:36, height:36, cursor:'pointer', color:T.g400, fontSize:'1.4rem', display:'flex', alignItems:'center', justifyContent:'center' }}>✕</button>
        </div>
        {error   && <div style={{ background:T.dangerBg, border:`1px solid ${T.dangerBd}`, borderRadius:8, padding:'9px 13px', marginBottom:14, color:T.danger, fontSize:'.82rem' }}>{error}</div>}
        {success && <div style={{ background:T.successBg, border:`1px solid ${T.successBd}`, borderRadius:8, padding:'9px 13px', marginBottom:14, color:T.success, fontSize:'.82rem' }}>{success}</div>}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:12 }}>
          <div>
            <label style={LBL}>Plant *</label>
            <select style={INP} value={lockedPlantId || plantId} onChange={e => setPlantId(e.target.value)} disabled={!!lockedPlantId}>
              {lockedPlantId
                ? <option value={lockedPlantId}>{plantScope?.plantNom || plants.find(p => String(p.value) === lockedPlantId)?.label || 'Plant'}</option>
                : (
                  <>
                    <option value="">Sélectionner</option>
                    {plants.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                  </>
                )}
            </select>
          </div>
          <div>
            <label style={LBL}>Auditeur *</label>
            <select style={INP} value={auditeurId} onChange={e => setAuditeur(e.target.value)}>
              <option value="">Sélectionner</option>
              {auditeurs.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
            </select>
          </div>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:20 }}>
          <div>
            <label style={LBL}>Date planifiée</label>
            <input style={{ ...INP, background:T.g50, color:T.g400 }} value={fmt(datePrevue)} readOnly />
          </div>
          <div>
            <label style={LBL}>Deadline</label>
            <input style={{ ...INP, background:T.g50, color:T.g400 }} value={fmt(deadline)} readOnly />
            <div style={{ fontSize:'.67rem', color:T.g400, marginTop:2 }}>+1 mois automatique</div>
          </div>
        </div>
        <button disabled={!plantId || !auditeurId || loading} onClick={submit}
          style={{ width:'100%', display:'flex', alignItems:'center', justifyContent:'center', gap:8, padding:'13px 22px', fontSize:'.95rem', fontWeight:700, fontFamily:"'Inter',sans-serif", borderRadius:10, border:'none', background: !plantId || !auditeurId || loading ? T.g200 : T.teal, color:'#fff', cursor: !plantId || !auditeurId || loading ? 'not-allowed' : 'pointer', opacity: !plantId || !auditeurId || loading ? 0.7 : 1 }}>
          {Ic.send} {loading ? 'Création…' : "Créer l'audit"}
        </button>
      </div>
    </div>
  );
}

/* ─── Modal Créer Export ─── */
function CreerExportModal({ onClose, onSuccess, plantScope }) {
  const [auditeurs,   setAuditeurs]   = useState([]);
  const [plants,      setPlants]      = useState([]);
  const [plantId,     setPlantId]     = useState('');
  const [auditeurId,  setAuditeur]    = useState('');
  const [salleExport, setSalleExport] = useState('');
  const [semaine,     setSemaine]     = useState('');
  const [obs,         setObs]         = useState('');
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState('');
  const [success,     setSuccess]     = useState('');
  const lockedPlantId = plantScope?.plantId || '';

  const today = () => new Date().toISOString().split('T')[0];
  const datePrevue = today();

  useEffect(() => {
    const h = apiH();
    fetch('http://localhost:8080/api/utilisateurs/auditeurs', { headers: h }).then(r => r.json()).then(d => {
      const list = Array.isArray(d) ? d : (d.content || []);
      setAuditeurs(list.filter(u => u.actif !== false).map(u => ({ value: String(u.id), label: `${u.prenom||''} ${u.nom||''}`.trim() })));
    }).catch(() => {});
    fetch('http://localhost:8080/api/sites/plants', { headers: h }).then(r => r.json()).then(d => {
      setPlants((Array.isArray(d) ? d : []).map(p => ({ value: String(p.id), label: p.nom || `Plant ${p.id}` })));
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (lockedPlantId) setPlantId(lockedPlantId);
  }, [lockedPlantId]);

  const canSubmit = plantId && auditeurId && salleExport.trim() && semaine.trim();

  const submit = async () => {
    if (!canSubmit) return;
    setLoading(true); setError('');
    try {
      await auditSpecialAPI.creerExport({ plantId: parseInt(plantId), auditeurId: parseInt(auditeurId), datePrevue, salleExport: salleExport.trim(), semaineExport: semaine.trim(), observations: obs });
      setSuccess('Export créé avec succès !');
      setTimeout(() => { onSuccess && onSuccess(); onClose(); }, 1200);
    } catch (e) { setError(e?.response?.data?.message || 'Erreur'); }
    setLoading(false);
  };

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.5)', zIndex:1200, display:'flex', alignItems:'center', justifyContent:'center' }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background:'#fff', borderRadius:18, width:'100%', maxWidth:460, maxHeight:'90vh', overflow:'auto', boxShadow:'0 24px 64px rgba(0,40,85,.22)', padding:28 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24, paddingBottom:18, borderBottom:`2px solid ${T.purpleBg}` }}>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <div style={{ width:44, height:44, background:T.purpleBg, borderRadius:12, display:'flex', alignItems:'center', justifyContent:'center', color:T.purple }}>{Ic.box}</div>
            <div>
              <div style={{ fontSize:'.7rem', fontWeight:700, color:T.purple, textTransform:'uppercase', letterSpacing:1 }}>Magasin Export</div>
              <h2 style={{ margin:'4px 0 0', color:T.navy, fontSize:'1.1rem', fontWeight:800 }}>Nouvelle planification</h2>
            </div>
          </div>
          <button onClick={onClose} style={{ background:'transparent', border:'none', borderRadius:50, width:36, height:36, cursor:'pointer', color:T.g400, fontSize:'1.4rem', display:'flex', alignItems:'center', justifyContent:'center' }}>✕</button>
        </div>
        {error   && <div style={{ background:T.dangerBg, border:`1px solid ${T.dangerBd}`, borderRadius:8, padding:'9px 13px', marginBottom:14, color:T.danger, fontSize:'.82rem' }}>{error}</div>}
        {success && <div style={{ background:T.successBg, border:`1px solid ${T.successBd}`, borderRadius:8, padding:'9px 13px', marginBottom:14, color:T.success, fontSize:'.82rem' }}>{success}</div>}
        <div style={{ display:'grid', gridTemplateColumns:'1fr', gap:10, marginBottom:12 }}>
          <div><label style={LBL}>Plant *</label>
            <select style={INP} value={lockedPlantId || plantId} onChange={e => setPlantId(e.target.value)} disabled={!!lockedPlantId}>
              {lockedPlantId
                ? <option value={lockedPlantId}>{plantScope?.plantNom || plants.find(p => String(p.value) === lockedPlantId)?.label || 'Plant'}</option>
                : (
                  <>
                    <option value="">Sélectionner</option>
                    {plants.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                  </>
                )}
            </select>
          </div>
          <div><label style={LBL}>Auditeur *</label>
            <select style={INP} value={auditeurId} onChange={e => setAuditeur(e.target.value)}>
              <option value="">Sélectionner</option>
              {auditeurs.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
            </select>
          </div>
          <div><label style={LBL}>Salle d'export *</label>
            <input style={INP} value={salleExport} onChange={e => setSalleExport(e.target.value)} placeholder="Ex: Zone A, Salle 12…" />
          </div>
          <div><label style={LBL}>Semaine *</label>
            <input style={INP} value={semaine} onChange={e => setSemaine(e.target.value)} placeholder="Ex: S22-2025" />
          </div>
          <div><label style={LBL}>Date planifiée</label>
            <input style={{ ...INP, background:T.g50, color:T.g400 }} value={fmt(datePrevue)} readOnly />
          </div>
          <div><label style={LBL}>Observations (optionnel)</label>
            <textarea style={{ ...INP, minHeight:55, resize:'vertical' }} value={obs} onChange={e => setObs(e.target.value)} placeholder="Remarques éventuelles…" />
          </div>
        </div>
        <button disabled={!canSubmit || loading} onClick={submit}
          style={{ width:'100%', display:'flex', alignItems:'center', justifyContent:'center', gap:8, padding:'13px 22px', fontSize:'.95rem', fontWeight:700, fontFamily:"'Inter',sans-serif", borderRadius:10, border:'none', background: !canSubmit || loading ? T.g200 : T.purple, color:'#fff', cursor: !canSubmit || loading ? 'not-allowed' : 'pointer', opacity: !canSubmit || loading ? 0.7 : 1 }}>
          {Ic.send} {loading ? 'Création…' : "Créer l'export"}
        </button>
      </div>
    </div>
  );
}

/* ─── SuiviStepBar ─── */
function SuiviStepBar({ steps, pct, theme }) {
  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:'0.8rem', padding:'.85rem 0 .8rem', flexWrap:'nowrap', overflowX:'auto' }}>
      {steps.map((step, index) => {
        const isDone   = step.done;
        const isActive = !isDone && (index === 0 || steps[index-1]?.done);
        return (
          <div key={step.key||index} style={{ display:'flex', alignItems:'center', gap:7, flexShrink:0 }}>
            {index > 0 && <div style={{ width:18, height:1.5, background:isDone ? `${theme.accent}66` : 'rgba(255,255,255,.18)', flexShrink:0, borderRadius:99 }}/>}
            <div style={{ width:32, height:32, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:800, fontSize:12, flexShrink:0, background:isDone?theme.accent:isActive?theme.soft:'rgba(152,152,152,.4)', color:isDone?'#fff':isActive?theme.accent:'rgba(255,255,255,.4)', border:isDone?`2px solid ${theme.accent}`:isActive?`2px solid ${theme.accent}`:'2px solid rgba(255,255,255,.18)', boxShadow:isDone?`0 0 0 3px ${theme.accent}33,0 2px 8px ${theme.accent}44`:isActive?`0 2px 10px ${theme.accent}22`:'none', transition:'all .3s' }}>
              {isDone ? '✓' : index + 1}
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:1 }}>
              <span style={{ fontSize:'.74rem', fontWeight:isDone||isActive?700:500, color:isDone?'rgba(255,255,255,.95)':isActive?'#fff':'rgba(255,255,255,.38)', whiteSpace:'nowrap' }}>{step.label}</span>
              <span style={{ fontSize:'.62rem', color:isDone?'rgba(255,255,255,.78)':isActive?'rgba(255,255,255,.7)':'rgba(255,255,255,.28)', whiteSpace:'nowrap' }}>{step.status}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ─── InfoRow ─── */
function InfoRow({ label, value, color }) {
  return (
    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', fontSize:'.73rem', padding:'6px 10px', borderRadius:8, background:'#EEF2F8', marginBottom:6 }}>
      <span style={{ color:T.g500 }}>{label}</span>
      <strong style={{ color: color || T.g700 }}>{value || '—'}</strong>
    </div>
  );
}

/* ─── SuiviBodyReglePlate ─── */
function SuiviBodyReglePlate({ audit, meta }) {
  const { instruments, nonConformes, conformes, hasNC, pdcaSent, pdcaResolu, rapportGenere, estTermine, pct, theme } = meta;

  return (
    <div style={{ padding:'20px 24px', display:'grid', gap:16, background:'#e3e3e3' }}>
      <div style={{ display:'grid', gridTemplateColumns:'minmax(190px,220px) 1fr', gap:16, alignItems:'start' }}>
        {/* Gauge */}
        <div style={{ background:`linear-gradient(180deg,${theme.soft} 0%,#fff 100%)`, border:`1.5px solid ${theme.border}`, borderRadius:18, padding:'20px 16px', display:'flex', flexDirection:'column', alignItems:'center', gap:8 }}>
          <svg width="150" height="88" viewBox="0 0 160 92">
            <g transform="translate(20,10)">
              <circle cx="60" cy="36" r="36" fill="none" stroke="#E6EAF2" strokeWidth="8"/>
              <circle cx="60" cy="36" r="36" fill="none" stroke={theme.accent} strokeWidth="8"
                strokeDasharray={`${Math.round(2*Math.PI*36*pct/100)} ${2*Math.PI*36}`}
                strokeLinecap="round" transform="rotate(-90 60 36)"/>
              <text x="60" y="42" textAnchor="middle" fontSize="14" fontWeight="800" fill={T.navy}>{pct}%</text>
            </g>
          </svg>
          <div style={{ fontSize:'.73rem', color:T.g500 }}>{meta.steps.filter(s=>s.done).length}/{meta.steps.length} étapes</div>
          <div style={{ width:'100%', height:1, background:T.g100, margin:'4px 0' }}/>
          <div style={{ width:'100%', background: hasNC ? T.dangerBg : T.successBg, borderRadius:12, padding:'10px 14px', textAlign:'center', border:`1.5px solid ${hasNC ? T.dangerBd : T.successBd}` }}>
            <div style={{ fontSize:'.65rem', fontWeight:800, color:T.g500, textTransform:'uppercase', letterSpacing:'.08em', marginBottom:4 }}>Résultat</div>
            <div style={{ fontSize:'1rem', fontWeight:900, color: hasNC ? T.danger : T.success, lineHeight:1 }}>
              {hasNC ? `${nonConformes.length} NC` : '✓ Conforme'}
            </div>
          </div>
          <div style={{ width:'100%', display:'flex', justifyContent:'space-between', fontSize:'.72rem', marginTop:2, padding:'5px 8px', background:'#D6DFEE', borderRadius:8 }}>
            <span style={{ color:T.g500 }}>Statut</span>
            <strong style={{ color:T.navy }}>{audit?.statut || '—'}</strong>
          </div>
        </div>

        {/* Colonne droite */}
        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          {/* Infos audit */}
          <div style={{ background:'#fff', borderRadius:16, border:`1px solid ${T.g200}`, padding:'14px 16px' }}>
            <div style={{ fontWeight:800, fontSize:'.82rem', color:T.navy, marginBottom:10 }}>Informations audit</div>
            <InfoRow label="Référence norme" value="IT TN 3627" />
            <InfoRow label="Plant" value={audit?.plantNom} />
            <InfoRow label="Auditeur" value={audit?.auditeurNom} />
            <InfoRow label="Date prévue" value={fmt(audit?.datePrevue)} />
            <InfoRow label="Date réalisation" value={fmt(audit?.dateRealisation)} />
            <InfoRow label="Prochain contrôle" value={fmt(audit?.deadline)} />
          </div>

          {/* Instruments (si formulaire rempli) */}
          {instruments.length > 0 && (
            <div style={{ background:'#fff', borderRadius:16, border:`1px solid ${T.g200}`, padding:'14px 16px' }}>
              <div style={{ fontWeight:800, fontSize:'.82rem', color:T.navy, marginBottom:10 }}>
                Instruments contrôlés ({instruments.length})
              </div>
              <div style={{ display:'flex', gap:8, marginBottom:10 }}>
                <div style={{ flex:1, background:T.successBg, border:`1px solid ${T.successBd}`, borderRadius:8, padding:'8px 12px', textAlign:'center' }}>
                  <div style={{ fontSize:'1.2rem', fontWeight:900, color:T.success }}>{conformes.length}</div>
                  <div style={{ fontSize:'.65rem', color:T.success, fontWeight:700, textTransform:'uppercase' }}>Conformes</div>
                </div>
                <div style={{ flex:1, background: hasNC ? T.dangerBg : T.g50, border:`1px solid ${hasNC ? T.dangerBd : T.g200}`, borderRadius:8, padding:'8px 12px', textAlign:'center' }}>
                  <div style={{ fontSize:'1.2rem', fontWeight:900, color: hasNC ? T.danger : T.g400 }}>{nonConformes.length}</div>
                  <div style={{ fontSize:'.65rem', color: hasNC ? T.danger : T.g400, fontWeight:700, textTransform:'uppercase' }}>Non conformes</div>
                </div>
              </div>
              {nonConformes.length > 0 && (
                <div style={{ background:T.dangerBg, border:`1px solid ${T.dangerBd}`, borderRadius:8, padding:'8px 12px' }}>
                  <div style={{ fontSize:'.72rem', fontWeight:800, color:T.danger, marginBottom:6 }}>Non-conformités :</div>
                  {nonConformes.map((nc, i) => (
                    <div key={i} style={{ fontSize:'.72rem', color:T.g700, padding:'3px 0', borderTop: i > 0 ? `1px solid ${T.dangerBd}` : 'none', display:'flex', gap:8 }}>
                      <span style={{ fontWeight:800, color:T.danger }}>#{i+1}</span>
                      <span style={{ fontWeight:700 }}>{nc.numeroInstrument || '—'}</span>
                      <span style={{ color:T.g400 }}>·</span>
                      <span>{nc.typeInstrument?.replace('_',' ') || '—'}</span>
                      <span style={{ color:T.g400 }}>·</span>
                      <span style={{ color:T.g500 }}>{nc.emplacement || '—'}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* PDCA (si NC réelles uniquement) */}
          {hasNC && (
            <div style={{ background:'#fff', borderRadius:16, border:`1px solid ${T.g200}`, padding:'14px 16px', borderTop:`4px solid ${pdcaResolu ? T.success : T.warn}` }}>
              <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
                <div style={{ width:36, height:36, borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center', background: pdcaResolu ? T.successBg : T.warnBg, color: pdcaResolu ? T.success : T.warn, fontSize:'1.1rem', fontWeight:900, flexShrink:0 }}>
                  {pdcaResolu ? '✓' : Ic.pdca}
                </div>
                <div>
                  <div style={{ fontWeight:800, color:T.navy, fontSize:'.85rem' }}>Plan d'action PDCA</div>
                  <div style={{ fontSize:'.7rem', color: pdcaResolu ? T.success : pdcaSent ? T.warn : T.g400, fontWeight:700, marginTop:2 }}>
                    {pdcaResolu ? 'Résolu' : pdcaSent ? 'Envoyé — en attente' : 'À créer'}
                  </div>
                </div>
              </div>
              <InfoRow label="Statut PDCA" value={audit?.pdcaStatut || '—'} color={pdcaResolu ? T.success : T.warn} />
              <InfoRow label="Envoyé le" value={fmt(audit?.pdcaEnvoyeAt)} />
              <InfoRow label="Résolu le" value={fmt(audit?.pdcaResolusAt)} />
              <div style={{ marginTop:10, padding:'5px 10px', borderRadius:8, textAlign:'center', fontSize:'.72rem', fontWeight:700, background: pdcaResolu ? T.successBg : T.warnBg, color: pdcaResolu ? T.success : T.warn }}>
                {pdcaResolu ? 'PDCA clôturé ✓' : pdcaSent ? 'En attente de résolution' : 'PDCA non déclenché'}
              </div>
            </div>
          )}

          {/* Rapport */}
          <div style={{ background:'#fff', borderRadius:16, border:`1px solid ${T.g200}`, padding:'14px 16px', borderTop:`4px solid ${rapportGenere ? T.teal : T.g300}` }}>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
              <div style={{ width:36, height:36, borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center', background: rapportGenere ? T.tealBg : T.g50, color: rapportGenere ? T.teal : T.g400, fontSize:'1.1rem', fontWeight:900, flexShrink:0 }}>
                {rapportGenere ? '✓' : '…'}
              </div>
              <div>
                <div style={{ fontWeight:800, color:T.navy, fontSize:'.85rem' }}>Rapport final PDF</div>
                <div style={{ fontSize:'.7rem', color: rapportGenere ? T.teal : T.g400, fontWeight:700, marginTop:2 }}>
                  {rapportGenere ? 'Disponible' : 'En attente'}
                </div>
              </div>
            </div>
            <div style={{ marginTop:6, padding:'5px 10px', borderRadius:8, textAlign:'center', fontSize:'.72rem', fontWeight:700, background: rapportGenere ? T.tealBg : T.g50, color: rapportGenere ? T.teal : T.g400 }}>
              {rapportGenere ? 'Rapport généré ✓' : 'Rapport non encore généré'}
            </div>
          </div>

          {/* ── Boutons Voir / Télécharger ── */}
          <RapportActions audit={audit} type="regle" />
        </div>
      </div>
    </div>
  );
}

/* ─── SuiviBodyExport ─── */
function SuiviBodyExport({ audit, meta }) {
  const { hasFormulaire, resultatPct, isParfait, hasNC, emailEnvoye, valideResp, planResolu, planStatut, rapportGenere, estTermine, pct, theme, resultatTheme } = meta;

  return (
    <div style={{ padding:'20px 24px', display:'grid', gap:16, background:'#e3e3e3' }}>
      <div style={{ display:'grid', gridTemplateColumns:'minmax(190px,220px) 1fr', gap:16, alignItems:'start' }}>
        {/* Gauge */}
        <div style={{ background:`linear-gradient(180deg,${theme.soft} 0%,#fff 100%)`, border:`1.5px solid ${theme.border}`, borderRadius:18, padding:'20px 16px', display:'flex', flexDirection:'column', alignItems:'center', gap:8 }}>
          <svg width="150" height="88" viewBox="0 0 160 92">
            <g transform="translate(20,10)">
              <circle cx="60" cy="36" r="36" fill="none" stroke="#E6EAF2" strokeWidth="8"/>
              <circle cx="60" cy="36" r="36" fill="none" stroke={theme.accent} strokeWidth="8"
                strokeDasharray={`${Math.round(2*Math.PI*36*pct/100)} ${2*Math.PI*36}`}
                strokeLinecap="round" transform="rotate(-90 60 36)"/>
              <text x="60" y="42" textAnchor="middle" fontSize="14" fontWeight="800" fill={T.navy}>{pct}%</text>
            </g>
          </svg>
          <div style={{ fontSize:'.73rem', color:T.g500 }}>{meta.steps.filter(s=>s.done).length}/{meta.steps.length} étapes</div>
          <div style={{ width:'100%', height:1, background:T.g100, margin:'4px 0' }}/>
          <div style={{ width:'100%', background: resultatTheme ? resultatTheme.bg : T.g50, borderRadius:12, padding:'10px 14px', textAlign:'center', border:`1.5px solid ${resultatTheme ? resultatTheme.bd : T.g200}` }}>
            <div style={{ fontSize:'.65rem', fontWeight:800, color:T.g500, textTransform:'uppercase', letterSpacing:'.08em', marginBottom:4 }}>Score audit</div>
            <div style={{ fontSize:'1.5rem', fontWeight:900, color: resultatTheme ? resultatTheme.color : T.g400, lineHeight:1 }}>
              {resultatPct !== null ? `${resultatPct}%` : '—'}
            </div>
            {resultatTheme && <div style={{ fontSize:'.65rem', color: resultatTheme.color, fontWeight:700, marginTop:4 }}>{resultatTheme.label}</div>}
          </div>
          <div style={{ width:'100%', display:'flex', justifyContent:'space-between', fontSize:'.72rem', marginTop:2, padding:'5px 8px', background:'#D6DFEE', borderRadius:8 }}>
            <span style={{ color:T.g500 }}>Statut</span>
            <strong style={{ color:T.navy }}>{audit?.statut || '—'}</strong>
          </div>
        </div>

        {/* Colonne droite */}
        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          <div style={{ background:'#fff', borderRadius:16, border:`1px solid ${T.g200}`, padding:'14px 16px' }}>
            <div style={{ fontWeight:800, fontSize:'.82rem', color:T.navy, marginBottom:10 }}>Informations audit</div>
            <InfoRow label="Référence norme" value="IT 3600-05" />
            <InfoRow label="Auditeur" value={audit?.auditeurNom} />
            <InfoRow label="Salle d'export" value={audit?.zoneExpedition} />
            <InfoRow label="Semaine" value={audit?.semaineExport} />
            <InfoRow label="Date prévue" value={fmt(audit?.datePrevue)} />
            <InfoRow label="Résultat (%)" value={resultatPct !== null ? `${resultatPct}%` : '—'} color={resultatTheme?.color} />
          </div>

          {hasNC && (
            <div style={{ background:'#fff', borderRadius:16, border:`1px solid ${T.g200}`, padding:'14px 16px', borderTop:`4px solid ${planResolu ? T.success : emailEnvoye ? T.purple : T.warn}` }}>
              <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
                <div style={{ width:36, height:36, borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center', background: planResolu ? T.successBg : emailEnvoye ? T.purpleBg : T.warnBg, color: planResolu ? T.success : emailEnvoye ? T.purple : T.warn, fontSize:'1.1rem', fontWeight:900, flexShrink:0 }}>
                  {planResolu ? '✓' : emailEnvoye ? '→' : '!'}
                </div>
                <div>
                  <div style={{ fontWeight:800, color:T.navy, fontSize:'.85rem' }}>Validation responsable magasin</div>
                  <div style={{ fontSize:'.7rem', color: planResolu ? T.success : emailEnvoye ? T.purple : T.warn, fontWeight:700, marginTop:2 }}>
                    {planResolu ? 'Validé ✓' : planStatut === 'EN_COURS' ? 'En cours de traitement' : emailEnvoye ? 'Email envoyé — en attente' : 'En attente d\'envoi'}
                  </div>
                </div>
              </div>
              <InfoRow label="Email envoyé à" value={audit?.emailResponsableMagasin || audit?.nomResponsableMagasin || '—'} />
              <InfoRow label="Statut plan d'action" value={planStatut || '—'} color={planResolu ? T.success : T.purple} />
              <InfoRow label="Validé par resp." value={valideResp ? 'Oui ✓' : 'Non'} color={valideResp ? T.success : T.danger} />
              <div style={{ marginTop:10, padding:'5px 10px', borderRadius:8, textAlign:'center', fontSize:'.72rem', fontWeight:700, background: planResolu ? T.successBg : emailEnvoye ? T.purpleBg : T.warnBg, color: planResolu ? T.success : emailEnvoye ? T.purple : T.warn }}>
                {planResolu ? 'Plan d\'action résolu ✓' : planStatut === 'EN_COURS' ? 'Traitement en cours…' : emailEnvoye ? 'En attente de confirmation' : 'Notification non encore envoyée'}
              </div>
            </div>
          )}

          <div style={{ background:'#fff', borderRadius:16, border:`1px solid ${T.g200}`, padding:'14px 16px', borderTop:`4px solid ${rapportGenere ? T.purple : T.g300}` }}>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
              <div style={{ width:36, height:36, borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center', background: rapportGenere ? T.purpleBg : T.g50, color: rapportGenere ? T.purple : T.g400, fontSize:'1.1rem', fontWeight:900, flexShrink:0 }}>
                {rapportGenere ? '✓' : '…'}
              </div>
              <div>
                <div style={{ fontWeight:800, color:T.navy, fontSize:'.85rem' }}>Rapport final PDF</div>
                <div style={{ fontSize:'.7rem', color: rapportGenere ? T.purple : (hasNC && !planResolu) ? T.warn : resultatPct !== null ? T.success : T.g400, fontWeight:700, marginTop:2 }}>
                  {rapportGenere ? 'Disponible' : hasNC && !planResolu ? 'En attente validation' : resultatPct !== null && !hasNC ? 'Prêt à générer' : 'En attente'}
                </div>
              </div>
            </div>
            <div style={{ marginTop:6, padding:'5px 10px', borderRadius:8, textAlign:'center', fontSize:'.72rem', fontWeight:700, background: rapportGenere ? T.purpleBg : T.g50, color: rapportGenere ? T.purple : T.g400 }}>
              {rapportGenere ? 'Rapport généré ✓' : 'Rapport non encore généré'}
            </div>
          </div>

          {/* ── Boutons Voir / Télécharger ── */}
          <RapportActions audit={audit} type="export" />
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   PAGE PRINCIPALE
═══════════════════════════════════════════════════════════ */
export default function ExpertAuditsPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const plantScope = getUserPlantScope(user);

  const [audits,      setAudits]      = useState([]);
  const [reglePlates, setReglePlates] = useState([]);
  const [exports,     setExports]     = useState([]);
  const [planifs,     setPlanifs]     = useState([]);
  const [auditeurs,   setAuditeurs]   = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [view,        setView]        = useState('produit');

  const [selectedPlanifId,     setSelectedPlanifId]     = useState('TOUS');
  const [selectedYear,         setSelectedYear]         = useState('TOUS');
  const [selectedStatus,       setSelectedStatus]       = useState('TOUS');
  const [filterAuditeurName,   setFilterAuditeurName]   = useState('');
  const [filterAnneeSp,        setFilterAnneeSp]        = useState('TOUS');
  const [filterPlantRp,        setFilterPlantRp]        = useState('TOUS');
  const [filterAuditeurExport, setFilterAuditeurExport] = useState('');
  const [search,               setSearch]               = useState('');

  const [showReglePlateModal, setShowReglePlateModal] = useState(false);
  const [showExportModal,     setShowExportModal]     = useState(false);
  const [actionLoadingId,     setActionLoadingId]     = useState(null);

  const [openEdit,   setOpenEdit]   = useState(false);
  const [editAudit,  setEditAudit]  = useState(null);
  const [editSaving, setEditSaving] = useState(false);
  const [editError,  setEditError]  = useState('');
  const [editForm,   setEditForm]   = useState({ datePrevue:'', deadline:'', auditeurId:'', observations:'' });

  const [demandeModalOpen, setDemandeModalOpen] = useState(false);
  const [selectedAudit,    setSelectedAudit]    = useState(null);
  const [selectedDemande,  setSelectedDemande]  = useState(null);

  /* ── Suivi state ── */
  const [suiviOpen,    setSuiviOpen]    = useState(false);
  const [suiviType,    setSuiviType]    = useState('produit');
  const [suiviAudit,   setSuiviAudit]   = useState(null);
  const [suiviDetails, setSuiviDetails] = useState({ loading:false, error:'', ficheMeta:null, pdcaMeta:null, annexes:[] });
  const suiviPollRef = useRef(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const headers = apiH();
      const auditsRes  = await fetch('http://localhost:8080/api/audit-produit/all', { headers }).then(r => r.ok ? r.json() : []).catch(() => []);
      const planifsRes = await planificationAPI.getMesPlanifications().catch(() => ({ data:[] }));
      const regleRes   = await auditSpecialAPI.listerReglePlates().catch(() => ({ data:[] }));
      const exportRes  = await auditSpecialAPI.listerExports().catch(() => ({ data:[] }));
      setAudits(Array.isArray(auditsRes) ? auditsRes : []);
      setPlanifs(Array.isArray(planifsRes.data) ? planifsRes.data : []);
      setReglePlates(Array.isArray(regleRes.data) ? regleRes.data : []);
      setExports(Array.isArray(exportRes.data) ? exportRes.data : []);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => {
    loadData();
    fetch('http://localhost:8080/api/utilisateurs/auditeurs', { headers: apiH() })
      .then(r => r.ok ? r.json() : []).then(d => setAuditeurs(Array.isArray(d) ? d : [])).catch(() => {});
  }, [loadData]);

  const handleOpenDemande = async (audit) => {
    try {
      const res = await fetch(`http://localhost:8080/api/audit-produit/${audit.id}/demande-extension`, { headers: apiH() });
      if (!res.ok) { alert(res.status === 404 ? 'Aucune demande trouvée.' : 'Erreur.'); return; }
      const demande = await res.json();
      setSelectedAudit(audit); setSelectedDemande(demande); setDemandeModalOpen(true);
    } catch { alert('Impossible de récupérer la demande.'); }
  };

  /* Memos */
  const counts = useMemo(() => ({
    produit: audits.filter(a => a.typeAudit === 'AUDIT_PRODUIT').length,
    regles:  reglePlates.length,
    magasin: exports.length,
  }), [audits, reglePlates, exports]);

  const produitAuditsBase = useMemo(() => {
    let list = audits.filter(a => a.typeAudit === 'AUDIT_PRODUIT').sort((a,b) => new Date(b.datePrevue||0) - new Date(a.datePrevue||0));
    if (selectedPlanifId !== 'TOUS') list = list.filter(a => String(a.planificationId) === selectedPlanifId);
    if (selectedYear     !== 'TOUS') list = list.filter(a => new Date(a.datePrevue||'').getFullYear() === Number(selectedYear));
    return list;
  }, [audits, selectedPlanifId, selectedYear]);

  const produitAudits = useMemo(() => {
    let list = produitAuditsBase;
    if (filterAuditeurName.trim()) list = list.filter(a => (a.auditeurNom||'') === filterAuditeurName);
    if (search.trim()) list = list.filter(a => [a.reference, a.serieNom, a.projetNom, a.auditeurNom].some(v => (v||'').toLowerCase().includes(search.toLowerCase())));
    return list;
  }, [produitAuditsBase, filterAuditeurName, search]);

  const produitByStatus  = useMemo(() => produitAudits.filter(a => matchesStatusFilter(a, selectedStatus)), [produitAudits, selectedStatus]);
  const reglePlatesFilt  = useMemo(() => reglePlates.filter(a => {
    const mAn = filterAnneeSp === 'TOUS' || String(new Date(a.datePrevue||'').getFullYear()) === filterAnneeSp;
    const mPl = filterPlantRp === 'TOUS' || String(a.plantId) === filterPlantRp;
    const mSt = matchesStatusFilter(a, selectedStatus);
    const mTx = !search || [a.reference, a.plantNom, a.auditeurNom].some(v => (v||'').toLowerCase().includes(search.toLowerCase()));
    return mAn && mPl && mSt && mTx;
  }), [reglePlates, filterAnneeSp, filterPlantRp, selectedStatus, search]);

  const exportsFilt = useMemo(() => exports.filter(a => {
    const mAn = filterAnneeSp === 'TOUS' || String(new Date(a.datePrevue||'').getFullYear()) === filterAnneeSp;
    const mAu = filterAuditeurExport === '' || a.auditeurNom === filterAuditeurExport;
    const mSt = matchesStatusFilter(a, selectedStatus);
    const mTx = !search || [a.reference, a.auditeurNom, a.zoneExpedition].some(v => (v||'').toLowerCase().includes(search.toLowerCase()));
    return mAn && mAu && mSt && mTx;
  }), [exports, filterAnneeSp, filterAuditeurExport, selectedStatus, search]);

  const planifOptions   = useMemo(() => { const m = new Map(); planifs.forEach(p => m.set(String(p.id), p.nom||`Planif #${p.id}`)); return [...m.entries()].map(([id,nom]) => ({id,nom})); }, [planifs]);
  const yearOptions     = useMemo(() => [...new Set(audits.filter(a => a.typeAudit==='AUDIT_PRODUIT').map(a => new Date(a.datePrevue||'').getFullYear()).filter(Boolean))].sort((a,b)=>b-a).map(String), [audits]);
  const anneesSpeciales = useMemo(() => [...new Set([...reglePlates,...exports].map(a => new Date(a.datePrevue||'').getFullYear()).filter(Boolean))].sort((a,b)=>b-a).map(String), [reglePlates,exports]);
  const plantsReglePlate = useMemo(() => [...new Map(reglePlates.filter(a=>a.plantId).map(a=>[String(a.plantId), a.plantNom||`Plant ${a.plantId}`])).entries()].map(([id,nom])=>({id,nom})), [reglePlates]);

  const statusOptions = [
    { value:'TOUS',      label:'Tous les statuts' },
    { value:'PLANIFIE',  label:'Planifié' },
    { value:'EN_COURS',  label:'En cours' },
    { value:'EN_RETARD', label:'En retard' },
    { value:'TERMINE',   label:'Terminé' },
    { value:'ANNULE',    label:'Annulé' },
  ];

  const currentCount = view === 'produit' ? produitByStatus.length : view === 'regles' ? reglePlatesFilt.length : exportsFilt.length;

  const openEditModal = (a) => {
    setEditAudit(a); setEditError('');
    setEditForm({ datePrevue: a.datePrevue?.slice(0,10)||'', deadline: a.deadline?.slice(0,10)||'', auditeurId: a.auditeurId ? String(a.auditeurId) : '', observations: a.observations||'' });
    setOpenEdit(true);
  };

  const toDateTime = (dateStr) => dateStr ? `${dateStr}T00:00:00` : null;

  const submitEdit = async () => {
    if (!editAudit?.id || !editForm.datePrevue) { setEditError('Date planifiée requise'); return; }
    setEditSaving(true); setEditError('');
    try {
      const isReglePlate = editAudit.plantId && !editAudit.zoneExpedition;
      const isExport     = !!editAudit.zoneExpedition;
      const payload = {
        datePrevue:   toDateTime(editForm.datePrevue),
        deadline:     toDateTime(editForm.deadline) || null,
        auditeurId:   editForm.auditeurId ? Number(editForm.auditeurId) : null,
        observations: editForm.observations || null,
      };
      if (isReglePlate || isExport) {
        const endpoint = isReglePlate
          ? `http://localhost:8080/api/audit-special/regle-plate/${editAudit.id}`
          : `http://localhost:8080/api/audit-special/export/${editAudit.id}`;
        const res = await fetch(endpoint, { method:'PUT', headers:apiH(), body:JSON.stringify(payload) });
        if (!res.ok) {
          let msg = res.statusText;
          try { const err = await res.json(); msg = err.message || err.error || JSON.stringify(err); } catch {}
          throw new Error(msg);
        }
      } else {
        await auditAPI.update(editAudit.id, payload);
      }
      await loadData(); setOpenEdit(false);
    } catch (e) { setEditError(e?.response?.data?.message || e?.message || 'Erreur'); }
    setEditSaving(false);
  };

  const handleDeleteProduit = async (a) => {
    if (!window.confirm(`Supprimer l'audit ${a.reference || a.id} ?`)) return;
    setActionLoadingId(a.id);
    try { await auditProduitAPI.supprimer(a.id); await loadData(); }
    catch (e) { alert(e?.response?.data?.message || 'Erreur'); }
    setActionLoadingId(null);
  };

  const handleDeleteSpecial = async (a) => {
    if (!window.confirm(`Supprimer l'audit ${a.reference || a.id} ?`)) return;
    setActionLoadingId(a.id);
    try {
      const isReglePlate = a.plantId && !a.zoneExpedition;
      const endpoint = isReglePlate ? `http://localhost:8080/api/audit-special/regle-plate/${a.id}` : `http://localhost:8080/api/audit-special/export/${a.id}`;
      const resp = await fetch(endpoint, { method:'DELETE', headers:apiH() });
      if (!resp.ok) throw new Error(resp.statusText);
      await loadData();
    } catch (e) { alert(e?.message || 'Erreur'); }
    setActionLoadingId(null);
  };

  /* ── Suivi handlers ── */
  const fetchSuiviDataProduit = async (auditId) => {
    const h = apiH();
    const safeGet = async url => { try { const r = await fetch(url, {headers:h}); return r.ok ? r.json() : null; } catch { return null; } };
    const [auditFrais, ficheData, pdcaData, annexesData] = await Promise.all([
      safeGet(`http://localhost:8080/api/audit-produit/${auditId}`),
      safeGet(`http://localhost:8080/api/audit-produit/${auditId}/fiche-reparation`),
      safeGet(`http://localhost:8080/api/audit-produit/${auditId}/pdca`),
      safeGet(`http://localhost:8080/api/audit-produit/${auditId}/annexes`),
    ]);
    return { audit: auditFrais||null, ficheMeta: Array.isArray(ficheData)?ficheData[0]||null:ficheData, pdcaMeta: Array.isArray(pdcaData)?pdcaData[0]||null:pdcaData, annexes: Array.isArray(annexesData)?annexesData:(annexesData?.content||[]) };
  };

  const fetchSuiviDataRegle = async (auditId) => {
    const h = apiH();
    try { const r = await fetch(`http://localhost:8080/api/audit-special/regle-plate/${auditId}`, { headers: h }); return r.ok ? await r.json() : null; } catch { return null; }
  };

  const fetchSuiviDataExport = async (auditId) => {
    const h = apiH();
    try { const r = await fetch(`http://localhost:8080/api/audit-special/export/${auditId}`, { headers: h }); return r.ok ? await r.json() : null; } catch { return null; }
  };

  const openSuiviProduit = (a) => {
    setSuiviAudit(a); setSuiviType('produit'); setSuiviOpen(true);
    setSuiviDetails(prev => ({ ...prev, loading:true, error:'' }));
    fetchSuiviDataProduit(a.id).then(data => {
      if (data.audit) setSuiviAudit(data.audit);
      setSuiviDetails({ loading:false, error:'', ficheMeta:data.ficheMeta, pdcaMeta:data.pdcaMeta, annexes:data.annexes||[] });
    }).catch(() => setSuiviDetails(prev => ({ ...prev, loading:false, error:'Erreur de chargement' })));
    suiviPollRef.current = setInterval(async () => {
      try { const data = await fetchSuiviDataProduit(a.id); if (data.audit) setSuiviAudit(data.audit); setSuiviDetails(prev => ({ ...prev, ficheMeta:data.ficheMeta, pdcaMeta:data.pdcaMeta, annexes:data.annexes||[] })); } catch {}
    }, 30000);
  };

  const openSuiviRegle = (a) => {
    setSuiviAudit(a); setSuiviType('regle'); setSuiviOpen(true);
    setSuiviDetails({ loading:true, error:'', ficheMeta:null, pdcaMeta:null, annexes:[] });
    fetchSuiviDataRegle(a.id).then(fresh => {
      if (fresh) setSuiviAudit(fresh);
      setSuiviDetails({ loading:false, error:'', ficheMeta:null, pdcaMeta:null, annexes:[] });
    }).catch(() => setSuiviDetails(prev => ({ ...prev, loading:false, error:'Erreur de chargement' })));
    suiviPollRef.current = setInterval(async () => {
      try { const fresh = await fetchSuiviDataRegle(a.id); if (fresh) setSuiviAudit(fresh); } catch {}
    }, 30000);
  };

  const openSuiviExport = (a) => {
    setSuiviAudit(a); setSuiviType('export'); setSuiviOpen(true);
    setSuiviDetails({ loading:true, error:'', ficheMeta:null, pdcaMeta:null, annexes:[] });
    fetchSuiviDataExport(a.id).then(fresh => {
      if (fresh) setSuiviAudit(fresh);
      setSuiviDetails({ loading:false, error:'', ficheMeta:null, pdcaMeta:null, annexes:[] });
    }).catch(() => setSuiviDetails(prev => ({ ...prev, loading:false, error:'Erreur de chargement' })));
    suiviPollRef.current = setInterval(async () => {
      try { const fresh = await fetchSuiviDataExport(a.id); if (fresh) setSuiviAudit(fresh); } catch {}
    }, 30000);
  };

  const closeSuivi = () => {
    setSuiviOpen(false); setSuiviAudit(null); setSuiviType('produit');
    setSuiviDetails({ loading:false, error:'', ficheMeta:null, pdcaMeta:null, annexes:[] });
    if (suiviPollRef.current) { clearInterval(suiviPollRef.current); suiviPollRef.current = null; }
  };

  /* Calcul suivi */
  const suiviMetaProduit   = getSuiviMeta(suiviAudit, suiviDetails);
  const suiviStepsProduit  = computeStepsProduit(suiviAudit, suiviDetails);
  const suiviMetaRegle     = getSuiviMetaReglePlate(suiviAudit);
  const suiviMetaExport    = getSuiviMetaExport(suiviAudit);

  const activeMeta   = suiviType === 'regle' ? suiviMetaRegle : suiviType === 'export' ? suiviMetaExport : null;
  const activeSteps  = suiviType === 'produit' ? suiviStepsProduit : activeMeta?.steps || [];
  const activePct    = suiviType === 'produit' ? (suiviStepsProduit.length === 0 ? 0 : Math.round(suiviStepsProduit.filter(s=>s.done).length / suiviStepsProduit.length * 100)) : (activeMeta?.pct || 0);
  const activeTheme  = suiviType === 'produit' ? getQkTheme(suiviMetaProduit.qkColor) : activeMeta?.theme || getQkTheme(null);

  const headerGradient = suiviType === 'regle'
    ? `linear-gradient(135deg,#001F4E 0%,${T.teal} 100%)`
    : suiviType === 'export'
    ? `linear-gradient(135deg,#001F4E 0%,${T.purple} 100%)`
    : 'linear-gradient(135deg,#001F4E 0%,#003F8A 58%,#0B4D8C 100%)';

  return (
    <div style={{ fontFamily:"'Inter','DM Sans',sans-serif", background:'#ffffff', minHeight:'100vh', padding:'1.5rem 2rem' }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}} @keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}`}</style>

      {/* ── Stat Cards ── */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:14, marginBottom:20, marginTop:-30 }}>
        <StatCard title="Audit Produit" count={counts.produit}
          desc={`${audits.filter(a=>a.statut==='EN_COURS').length} en cours · ${audits.filter(a=>a.statut==='TERMINE').length} terminés`}
          icon={Ic.micro} color={T.blue} bg={T.blueL} active={view==='produit'} onClick={() => setView('produit')} />
        <StatCard title="Règles Plates" count={counts.regles}
          desc={`${reglePlates.filter(a=>a.statut==='PLANIFIE').length} planifiés · contrôle instruments`}
          icon={Ic.ruler} color={T.teal} bg={T.tealBg} active={view==='regles'} onClick={() => setView('regles')} />
        <StatCard title="Magasin Export" count={counts.magasin}
          desc={`${exports.filter(a=>a.statut==='PLANIFIE').length} planifiés · contrôle avant expédition`}
          icon={Ic.box} color={T.purple} bg={T.purpleBg} active={view==='magasin'} onClick={() => setView('magasin')} />
      </div>

      {/* ── Barre filtres ── */}
      <div style={{ background:'#fff', borderRadius:12, border:`1px solid ${T.g200}`, padding:'12px 16px', marginBottom:16, display:'flex', gap:12, alignItems:'center', flexWrap:'wrap', boxShadow:'0 1px 4px rgba(0,0,0,.04)' }}>
        <div style={{ flex:2, minWidth:200, display:'flex', alignItems:'center', gap:8, background:T.g50, borderRadius:8, padding:'8px 12px', border:`1px solid ${T.g300}` }}>
          <span style={{ color:T.g400 }}>{Ic.search}</span>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher par référence, série, projet…"
            style={{ flex:1, border:'none', background:'transparent', outline:'none', fontSize:'.83rem', fontFamily:'inherit', color:T.g700 }} />
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:6, color:T.g400 }}>{Ic.filter}</div>

        {view === 'produit' && (<>
          <select value={selectedPlanifId} onChange={e => setSelectedPlanifId(e.target.value)} style={{ border:`1px solid ${T.g300}`, borderRadius:8, padding:'7px 10px', fontSize:'.8rem', fontFamily:'inherit', color:T.g700, background:'#fff', cursor:'pointer' ,maxWidth:'180px'}}>
            <option value="TOUS">Toutes les planifications</option>
            {planifOptions.map(p => <option key={p.id} value={p.id}>{p.nom}</option>)}
          </select>
          <select value={selectedYear} onChange={e => setSelectedYear(e.target.value)} style={{ border:`1px solid ${T.g300}`, borderRadius:8, padding:'7px 10px', fontSize:'.8rem', fontFamily:'inherit', color:T.g700, background:'#fff', cursor:'pointer' }}>
            <option value="TOUS">Toutes les années</option>
            {yearOptions.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <select value={filterAuditeurName} onChange={e => setFilterAuditeurName(e.target.value)} style={{ border:`1px solid ${T.g300}`, borderRadius:8, padding:'7px 10px', fontSize:'.8rem', fontFamily:'inherit', color:T.g700, background:'#fff', cursor:'pointer' }}>
            <option value="">Tous les auditeurs</option>
            {[...new Set(produitAuditsBase.map(a => a.auditeurNom).filter(Boolean))].sort().map(n => <option key={n} value={n}>{n}</option>)}
          </select>
        </>)}

        {view === 'regles' && (<>
          <select value={filterAnneeSp} onChange={e => setFilterAnneeSp(e.target.value)} style={{ border:`1px solid ${T.g300}`, borderRadius:8, padding:'7px 10px', fontSize:'.8rem', fontFamily:'inherit', color:T.g700, background:'#fff', cursor:'pointer' }}>
            <option value="TOUS">Toutes les années</option>
            {anneesSpeciales.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <select value={filterPlantRp} onChange={e => setFilterPlantRp(e.target.value)} style={{ border:`1px solid ${T.g300}`, borderRadius:8, padding:'7px 10px', fontSize:'.8rem', fontFamily:'inherit', color:T.g700, background:'#fff', cursor:'pointer' }}>
            <option value="TOUS">Tous les plants</option>
            {plantsReglePlate.map(p => <option key={p.id} value={p.id}>{p.nom}</option>)}
          </select>
        </>)}

        {view === 'magasin' && (<>
          <select value={filterAnneeSp} onChange={e => setFilterAnneeSp(e.target.value)} style={{ border:`1px solid ${T.g300}`, borderRadius:8, padding:'7px 10px', fontSize:'.8rem', fontFamily:'inherit', color:T.g700, background:'#fff', cursor:'pointer' }}>
            <option value="TOUS">Toutes les années</option>
            {anneesSpeciales.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <select value={filterAuditeurExport} onChange={e => setFilterAuditeurExport(e.target.value)} style={{ border:`1px solid ${T.g300}`, borderRadius:8, padding:'7px 10px', fontSize:'.8rem', fontFamily:'inherit', color:T.g700, background:'#fff', cursor:'pointer' }}>
            <option value="">Tous les auditeurs</option>
            {[...new Set(exports.map(a => a.auditeurNom).filter(Boolean))].sort().map(n => <option key={n} value={n}>{n}</option>)}
          </select>
        </>)}

        <select value={selectedStatus} onChange={e => setSelectedStatus(e.target.value)} style={{ border:`1px solid ${T.g300}`, borderRadius:8, padding:'7px 10px', fontSize:'.8rem', fontFamily:'inherit', color:T.g700, background:'#fff', cursor:'pointer' }}>
          {statusOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>

        {view === 'regles' && (
          <button onClick={() => setShowReglePlateModal(true)} style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'8px 14px', borderRadius:9, border:'none', background:'linear-gradient(135deg,#0D9488,#0F766E)', color:'#fff', fontWeight:700, fontSize:'.8rem', cursor:'pointer', fontFamily:"'Inter',sans-serif", boxShadow:'0 4px 12px rgba(13,148,136,.3)', whiteSpace:'nowrap' }}>
            {Ic.plus} Nouvelle planification
          </button>
        )}
        {view === 'magasin' && (
          <button onClick={() => setShowExportModal(true)} style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'8px 14px', borderRadius:9, border:'none', background:'linear-gradient(135deg,#7C3AED,#6D28D9)', color:'#fff', fontWeight:700, fontSize:'.8rem', cursor:'pointer', fontFamily:"'Inter',sans-serif", boxShadow:'0 4px 12px rgba(124,58,237,.3)', whiteSpace:'nowrap' }}>
            {Ic.plus} Nouvelle planification
          </button>
        )}

        <span style={{ fontSize:'.73rem', color:T.g400, fontWeight:600, flexShrink:0 }}>{currentCount} résultat(s)</span>
      </div>

      {/* ── Contenu ── */}
      {loading ? (
        <div style={{ textAlign:'center', padding:'4rem', color:T.g400 }}>
          <div style={{ width:32, height:32, border:`3px solid ${T.g200}`, borderTopColor:T.navy, borderRadius:'50%', animation:'spin .8s linear infinite', margin:'0 auto 12px' }}/>
          Chargement…
        </div>
      ) : (
        <div style={{ animation:'fadeUp .3s ease' }}>
          {view === 'produit' && (
            produitByStatus.length === 0
              ? <div style={{ textAlign:'center', padding:'4rem 2rem', background:'#fff', borderRadius:16, border:`1.5px dashed ${T.g200}` }}>
                  <div style={{ width:56, height:56, borderRadius:16, background:T.g50, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 14px', color:T.g300 }}>{Ic.micro}</div>
                  <div style={{ fontWeight:700, color:T.g500, marginBottom:6 }}>Aucun audit trouvé</div>
                  <div style={{ fontSize:'.8rem', color:T.g400 }}>Modifiez vos filtres pour afficher des résultats.</div>
                </div>
              : <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(340px,1fr))', gap:20 }}>
                  {produitByStatus.map(a => (
                    <ProduitCardExpert key={a.id} audit={a} loading={actionLoadingId === a.id}
                      onEdit={() => openEditModal(a)} onDelete={() => handleDeleteProduit(a)}
                      onFollow={() => openSuiviProduit(a)} onViewMessage={() => handleOpenDemande(a)} />
                  ))}
                </div>
          )}

          {view === 'regles' && (
            reglePlatesFilt.length === 0
              ? <div style={{ textAlign:'center', padding:'4rem 2rem', background:'#fff', borderRadius:16, border:`1.5px dashed ${T.g200}` }}>
                  <div style={{ width:56, height:56, borderRadius:16, background:T.tealBg, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 14px', color:T.teal }}>{Ic.ruler}</div>
                  <div style={{ fontWeight:700, color:T.g500, marginBottom:6 }}>Aucun audit règle plate</div>
                  <div style={{ fontSize:'.8rem', color:T.g400 }}>Créez votre première planification via le bouton ci-dessus.</div>
                </div>
              : <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(340px,1fr))', gap:20 }}>
                  {reglePlatesFilt.map(a => (
                    <ReglePlateCardExpert key={a.id} audit={a} loading={actionLoadingId === a.id}
                      onEdit={() => openEditModal(a)} onDelete={() => handleDeleteSpecial(a)}
                      onFollow={() => openSuiviRegle(a)} />
                  ))}
                </div>
          )}

          {view === 'magasin' && (
            exportsFilt.length === 0
              ? <div style={{ textAlign:'center', padding:'4rem 2rem', background:'#fff', borderRadius:16, border:`1.5px dashed ${T.g200}` }}>
                  <div style={{ width:56, height:56, borderRadius:16, background:T.purpleBg, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 14px', color:T.purple }}>{Ic.box}</div>
                  <div style={{ fontWeight:700, color:T.g500, marginBottom:6 }}>Aucun audit magasin export</div>
                  <div style={{ fontSize:'.8rem', color:T.g400 }}>Créez votre première planification export.</div>
                </div>
              : <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(340px,1fr))', gap:20 }}>
                  {exportsFilt.map(a => (
                    <ExportCardExpert key={a.id} audit={a} loading={actionLoadingId === a.id}
                      onEdit={() => openEditModal(a)} onDelete={() => handleDeleteSpecial(a)}
                      onFollow={() => openSuiviExport(a)} />
                  ))}
                </div>
          )}
        </div>
      )}

      {/* ── Modals création ── */}
      {showReglePlateModal && <CreerReglePlateModal onClose={() => setShowReglePlateModal(false)} onSuccess={loadData} plantScope={plantScope} />}
      {showExportModal     && <CreerExportModal     onClose={() => setShowExportModal(false)}     onSuccess={loadData} plantScope={plantScope} />}

      {/* ── Modal Modifier ── */}
      {openEdit && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1100 }}>
          <div style={{ width:'100%', maxWidth:560, background:'#fff', borderRadius:16, overflow:'hidden', boxShadow:'0 24px 64px rgba(0,0,0,.2)' }}>
            <div style={{ background:'linear-gradient(145deg,#002855 0%,#003F8A 60%,#0057B8 100%)', color:'#fff', padding:'18px 20px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <div>
                <div style={{ fontSize:'.68rem', fontWeight:700, textTransform:'uppercase', letterSpacing:'.12em', opacity:.7, marginBottom:4 }}>Modifier l'audit</div>
                <strong style={{ fontSize:'1rem', fontWeight:800 }}>{editAudit?.reference || `AUD-${editAudit?.id}`}</strong>
              </div>
              <button onClick={() => setOpenEdit(false)} style={{ background:'rgba(255,255,255,.15)', border:'1px solid rgba(255,255,255,.25)', color:'#fff', width:36, height:36, borderRadius:9, cursor:'pointer', fontSize:'1rem', display:'flex', alignItems:'center', justifyContent:'center' }}>✕</button>
            </div>
            <div style={{ padding:24 }}>
              {editError && <div style={{ marginBottom:12, background:T.dangerBg, border:`1px solid ${T.dangerBd}`, borderRadius:8, padding:'9px 13px', color:T.danger, fontSize:'.82rem' }}>{editError}</div>}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                <div>
                  <label style={LBL}>Date planifiée *</label>
                  <input type="date" style={INP} value={editForm.datePrevue} onChange={e => setEditForm(p => ({ ...p, datePrevue:e.target.value }))} />
                </div>
                <div>
                  <label style={LBL}>Deadline</label>
                  <input type="date" style={INP} value={editForm.deadline} onChange={e => setEditForm(p => ({ ...p, deadline:e.target.value }))} />
                </div>
                <div style={{ gridColumn:'1/-1' }}>
                  <label style={LBL}>Auditeur assigné</label>
                  <select style={INP} value={editForm.auditeurId} onChange={e => setEditForm(p => ({ ...p, auditeurId:e.target.value }))}>
                    <option value="">Sélectionner…</option>
                    {auditeurs.map(a => <option key={a.id} value={a.id}>{a.prenom} {a.nom}</option>)}
                  </select>
                </div>
                <div style={{ gridColumn:'1/-1' }}>
                  <label style={LBL}>Observations</label>
                  <textarea style={{ ...INP, minHeight:70, resize:'vertical' }}
                    value={editForm.observations} onChange={e => setEditForm(p => ({ ...p, observations:e.target.value }))} />
                </div>
              </div>
              <div style={{ marginTop:16, display:'flex', gap:10, justifyContent:'flex-end' }}>
                <button onClick={() => setOpenEdit(false)} style={{ border:`1px solid ${T.g500}`, borderRadius:9, padding:'9px 22px', background:T.g300, cursor:'pointer', fontFamily:'inherit', fontWeight:600, color:T.g600, fontSize:'.85rem' }}>Annuler</button>
                <button onClick={submitEdit} disabled={editSaving} style={{ border:'none', borderRadius:9, padding:'9px 22px', background:'linear-gradient(145deg,#002855 0%,#003F8A 60%,#0057B8 100%)', color:'#fff', cursor:'pointer', fontFamily:'inherit', fontWeight:700, opacity:editSaving?.7:1, fontSize:'.85rem', boxShadow:'0 4px 14px rgba(0,40,85,.25)' }}>
                  {editSaving ? 'Enregistrement…' : 'Enregistrer'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal demande extension ── */}
      <VoirDemandeExtensionModal open={demandeModalOpen} audit={selectedAudit} demande={selectedDemande} auditeurs={auditeurs} onClose={() => setDemandeModalOpen(false)} onSuccess={() => loadData()} />

      {/* ── Modal Suivi ── */}
      {suiviOpen && (
        <div style={{ position:'fixed', inset:0, background:'rgba(3,12,28,.55)', zIndex:1200, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}
          onClick={e => e.target === e.currentTarget && closeSuivi()}>
          <div style={{ width:'100%', maxWidth:1100, maxHeight:'90vh', overflow:'auto', background:'#fff', borderRadius:22, boxShadow:'0 28px 80px rgba(0,40,85,.28)', border:`1px solid ${activeTheme.border}` }}>

            {/* Header */}
            <div style={{ background: headerGradient, color:'#fff', borderRadius:'22px 22px 0 0', padding:'18px 24px 0' }}>
              <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:16, marginBottom:18 }}>
                <div>
                  <div style={{ fontSize:'.67rem', fontWeight:800, textTransform:'uppercase', letterSpacing:'.14em', opacity:.65, marginBottom:5 }}>
                    {suiviType === 'regle' ? 'Suivi — Audit Règle Plate' : suiviType === 'export' ? 'Suivi — Audit Magasin Export' : 'Suivi audit produit'}
                  </div>
                  <div style={{ fontWeight:900, fontSize:'1.12rem', marginBottom:3 }}>{suiviAudit?.reference || `AUD-${suiviAudit?.id}`}</div>
                  <div style={{ fontSize:'.84rem', opacity:.82 }}>
                    {suiviType === 'regle'
                      ? `${suiviAudit?.plantNom||'—'} · ${suiviAudit?.auditeurNom||'—'} · IT TN 3627`
                      : suiviType === 'export'
                      ? `${suiviAudit?.zoneExpedition||'—'} · Sem. ${suiviAudit?.semaineExport||'—'} · ${suiviAudit?.auditeurNom||'—'} · IT 3600-05`
                      : `${suiviAudit?.plantNom||'—'} · ${suiviAudit?.serieNom||'—'} · ${suiviAudit?.auditeurNom||'—'}`
                    }
                  </div>
                </div>
                <button onClick={closeSuivi} style={{ border:'1px solid rgba(255,255,255,.25)', background:'rgba(255,255,255,.1)', color:'#fff', width:36, height:36, borderRadius:10, cursor:'pointer', fontWeight:800, fontSize:'1rem', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center' }}>✕</button>
              </div>

              <SuiviStepBar steps={activeSteps} pct={activePct} theme={activeTheme} />

              <div style={{ height:3, background:'rgba(255,255,255,.18)', margin:'0 -24px', overflow:'hidden' }}>
                <div style={{ height:'100%', width:`${activePct}%`, background:`linear-gradient(90deg,${activeTheme.accent}99,${activeTheme.accent})`, transition:'width .5s ease' }}/>
              </div>
            </div>

            {/* Corps suivi */}
            {suiviDetails.loading && (
              <div style={{ padding:'20px 24px', color:T.g400, fontSize:'.82rem' }}>Chargement…</div>
            )}
            {suiviDetails.error && (
              <div style={{ padding:'10px 24px', color:T.danger, fontSize:'.8rem', fontWeight:600 }}>{suiviDetails.error}</div>
            )}

            {!suiviDetails.loading && suiviType === 'regle' && (
              <SuiviBodyReglePlate audit={suiviAudit} meta={suiviMetaRegle} />
            )}

            {!suiviDetails.loading && suiviType === 'export' && (
              <SuiviBodyExport audit={suiviAudit} meta={suiviMetaExport} />
            )}

            {!suiviDetails.loading && suiviType === 'produit' && (
              <div style={{ padding:'20px 24px', display:'grid', gap:16, background:'#e3e3e3' }}>
                <div style={{ display:'grid', gridTemplateColumns:'minmax(190px,220px) 1fr', gap:16, alignItems:'start' }}>
                  <div style={{ background:`linear-gradient(180deg,${activeTheme.soft} 0%,#fff 100%)`, border:`1.5px solid ${activeTheme.border}`, borderRadius:18, padding:'20px 16px', display:'flex', flexDirection:'column', alignItems:'center', gap:8 }}>
                    <svg width="150" height="88" viewBox="0 0 160 92">
                      <g transform="translate(20,10)">
                        <circle cx="60" cy="36" r="36" fill="none" stroke="#E6EAF2" strokeWidth="8"/>
                        <circle cx="60" cy="36" r="36" fill="none" stroke={activeTheme.accent} strokeWidth="8"
                          strokeDasharray={`${Math.round(2*Math.PI*36*activePct/100)} ${2*Math.PI*36}`}
                          strokeLinecap="round" transform="rotate(-90 60 36)"/>
                        <text x="60" y="42" textAnchor="middle" fontSize="14" fontWeight="800" fill={T.navy}>{activePct}%</text>
                      </g>
                    </svg>
                    <div style={{ fontSize:'.73rem', color:T.g500 }}>{suiviStepsProduit.filter(s=>s.done).length}/{suiviStepsProduit.length} étapes validées</div>
                    <div style={{ width:'100%', height:1, background:T.g100, margin:'4px 0' }}/>
                    <div style={{ width:'100%', background:suiviAudit?.valeurQK!=null?activeTheme.soft:'#E5E9F0', borderRadius:12, padding:'10px 14px', textAlign:'center', border:`1.5px solid ${suiviAudit?.valeurQK!=null?activeTheme.border:'#B0BAC8'}` }}>
                      <div style={{ fontSize:'.65rem', fontWeight:800, color:T.g500, textTransform:'uppercase', letterSpacing:'.08em', marginBottom:4 }}>Valeur QK</div>
                      <div style={{ fontSize:'1.5rem', fontWeight:900, color:suiviAudit?.valeurQK!=null?activeTheme.accent:T.g400, lineHeight:1 }}>{suiviAudit?.valeurQK??'—'}</div>
                    </div>
                    <div style={{ width:'100%', display:'flex', justifyContent:'space-between', fontSize:'.72rem', marginTop:2, padding:'5px 8px', background:'#D6DFEE', borderRadius:8 }}>
                      <span style={{ color:T.g500 }}>Statut</span>
                      <strong style={{ color:T.navy }}>{suiviAudit?.statut||'—'}</strong>
                    </div>
                  </div>

                  <div style={{ display:'grid', gridTemplateColumns:`repeat(${[suiviMetaProduit.ficheSent||suiviMetaProduit.ficheValidee, suiviMetaProduit.pdcaSent||suiviMetaProduit.pdcaValidee, true].filter(Boolean).length},minmax(0,1fr))`, gap:14 }}>
                    {(suiviMetaProduit.ficheSent || suiviMetaProduit.ficheValidee) && (() => {
                      const done = suiviMetaProduit.ficheValidee;
                      return (
                        <div style={{ background:'#fff', borderRadius:16, overflow:'hidden', boxShadow:'0 4px 18px rgba(0,40,85,.10)', border:'1px solid #DBEAFE', borderTop:`4px solid ${T.blue}` }}>
                          <div style={{ padding:'14px 14px 16px' }}>
                            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:14 }}>
                              <div style={{ width:36, height:36, borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center', background:done?T.successBg:'#DBEAFE', color:done?T.success:T.blue, fontWeight:900, fontSize:'1.1rem', flexShrink:0 }}>{done?'✓':'→'}</div>
                              <div>
                                <div style={{ fontWeight:800, color:T.navy, fontSize:'.85rem' }}>Fiche de réparation</div>
                                <div style={{ fontSize:'.7rem', color:done?T.success:T.blue, fontWeight:700, marginTop:2 }}>{done?'Validée':'Envoyée'}</div>
                              </div>
                            </div>
                            {[{label:'Création',val:suiviMetaProduit.fiche.createdText,color:suiviMetaProduit.fiche.createdAt?T.g700:T.g400},{label:'Envoi email',val:suiviMetaProduit.fiche.sentText,color:suiviMetaProduit.fiche.sentAt?T.blue:T.g400},{label:'Validation',val:suiviMetaProduit.fiche.validatedText,color:done?T.success:T.g400}].map(r => (
                              <InfoRow key={r.label} label={r.label} value={r.val} color={r.color} />
                            ))}
                            <div style={{ marginTop:10, padding:'5px 10px', borderRadius:8, textAlign:'center', fontSize:'.72rem', fontWeight:700, background:done?T.successBg:'#DBEAFE', color:done?T.success:T.blue }}>{suiviMetaProduit.fiche.statusLabel}</div>
                          </div>
                        </div>
                      );
                    })()}

                    {(suiviMetaProduit.pdcaSent || suiviMetaProduit.pdcaValidee) && (() => {
                      const done = suiviMetaProduit.pdcaValidee;
                      return (
                        <div style={{ background:'#fff', borderRadius:16, overflow:'hidden', boxShadow:'0 4px 18px rgba(0,40,85,.10)', border:'1px solid #DBEAFE', borderTop:`4px solid ${T.blue}` }}>
                          <div style={{ padding:'14px 14px 16px' }}>
                            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:14 }}>
                              <div style={{ width:36, height:36, borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center', background:done?T.successBg:'#E0E7FF', color:done?T.success:T.blue, fontWeight:900, fontSize:'1.1rem', flexShrink:0 }}>{done?'✓':'→'}</div>
                              <div>
                                <div style={{ fontWeight:800, color:T.navy, fontSize:'.85rem' }}>Plan d'action PDCA</div>
                                <div style={{ fontSize:'.7rem', color:done?T.success:T.blue, fontWeight:700, marginTop:2 }}>{done?'Validé':'Envoyé'}</div>
                              </div>
                            </div>
                            {[{label:'Création',val:suiviMetaProduit.pdca.createdText,color:suiviMetaProduit.pdca.createdAt?T.g700:T.g400},{label:'Envoi email',val:suiviMetaProduit.pdca.sentText,color:suiviMetaProduit.pdca.sentAt?T.blue:T.g400},{label:'Validation',val:suiviMetaProduit.pdca.validatedText,color:done?T.success:T.g400}].map(r => (
                              <InfoRow key={r.label} label={r.label} value={r.val} color={r.color} />
                            ))}
                            <div style={{ marginTop:10, padding:'5px 10px', borderRadius:8, textAlign:'center', fontSize:'.72rem', fontWeight:700, background:done?T.successBg:'#DDE4FF', color:done?T.success:T.blue }}>{suiviMetaProduit.pdca.statusLabel}</div>
                          </div>
                        </div>
                      );
                    })()}

                    {(() => {
                      const done = suiviMetaProduit.rapportGenere, ready = suiviMetaProduit.canGenerate;
                      const accentColor = done ? T.teal : ready ? T.success : T.warn;
                      return (
                        <div style={{ background:'#fff', borderRadius:16, overflow:'hidden', boxShadow:'0 4px 18px rgba(0,40,85,.10)', border:'1px solid #DBEAFE', borderTop:`4px solid ${T.blue}` }}>
                          <div style={{ padding:'14px 14px 16px' }}>
                            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:14 }}>
                              <div style={{ width:36, height:36, borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center', background:done?'#E7F7F4':ready?T.successBg:T.warnBg, color:accentColor, fontWeight:900, fontSize:'1.1rem', flexShrink:0 }}>{done?'✓':ready?'▶':'!'}</div>
                              <div>
                                <div style={{ fontWeight:800, color:T.navy, fontSize:'.85rem' }}>Rapport final</div>
                                <div style={{ fontSize:'.7rem', color:accentColor, fontWeight:700, marginTop:2 }}>{done?'PDF disponible':ready?'Prêt à générer':'En attente'}</div>
                              </div>
                            </div>
                            {[
                              {label:'Génération', val:done&&suiviMetaProduit.rapportDate?fmtDateTime(suiviMetaProduit.rapportDate):'—', color:done?T.teal:T.g400},
                              ...(suiviMetaProduit.ficheRequired?[{label:'Fiche validée', val:suiviMetaProduit.ficheValidee?'Oui ✓':'Non', color:suiviMetaProduit.ficheValidee?T.success:T.danger}]:[]),
                              ...(suiviMetaProduit.pdcaRequired ?[{label:'PDCA validé',   val:suiviMetaProduit.pdcaValidee ?'Oui ✓':'Non', color:suiviMetaProduit.pdcaValidee ?T.success:T.danger}]:[]),
                            ].map(r => <InfoRow key={r.label} label={r.label} value={r.val} color={r.color} />)}
                            <div style={{ marginTop:10, padding:'5px 10px', borderRadius:8, textAlign:'center', fontSize:'.72rem', fontWeight:700, background:done?'#C6F0E8':ready?'#C6EED9':'#FDE8A0', color:done?T.teal:ready?T.success:T.warn }}>
                              {done?'Rapport généré':ready?'Génération possible':'En attente des validations'}
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>

                {/* ── Boutons Voir / Télécharger pour audit produit ── */}
                <RapportActions audit={suiviAudit} type="produit" />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}