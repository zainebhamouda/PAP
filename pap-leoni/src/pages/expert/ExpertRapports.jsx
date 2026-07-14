import { useEffect, useMemo, useState, useCallback } from 'react';
import { auditProduitAPI, planificationAPI } from '../../services/api';
import {
  Chart as ChartJS,
  ArcElement, Tooltip, Legend,
  CategoryScale, LinearScale, BarElement,
} from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

const Icon = {
  search:   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  calendar: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  box:      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 7l9-4 9 4-9 4-9-4Z"/><path d="M3 7v10l9 4 9-4V7"/><path d="M12 11v10"/></svg>,
  ruler:    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 21l18-18"/><path d="M8 4l4 4"/><path d="M4 8l4 4"/><path d="M12 8l4 4"/><path d="M16 4l4 4"/></svg>,
  trendUp:  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 17l6-6 4 4 7-7"/><path d="M14 8h6v6"/></svg>,
  refresh:  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>,
  eye:      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>,
  download: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>,
  close:    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  tools:    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>,
  check:    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>,
};

const T = {
  navy: '#0B1E3D', blue: '#1E3A5F', blueM: '#1D4ED8',
  g50: '#F7F9FC', g100: '#EEF2F8', g200: '#E8EDF7', g300: '#CBD5E1',
  g400: '#94A3B8', g500: '#64748B', g700: '#334155',
  success: '#15803D', successBg: '#F0FDF4', successBd: '#86EFAC',
  warn: '#C8982A', warnBg: '#FFFBEB', warnBd: '#FCD34D',
  danger: '#B91C1C', dangerBg: '#FEF2F2', dangerBd: '#FECACA',
  rose: '#BE123C', roseBg: '#FFF1F2', roseBd: '#FECDD3',
  teal: '#0D9488', tealBg: '#F0FDFA', tealBd: '#99F6E4',
  purple: '#7C3AED', purpleBg: '#F5F3FF', purpleBd: '#DDD6FE',
  amber: '#B45309', amberBg: '#FFFBEB', amberBd: '#FDE68A',
};

const TABS = [
  { key: 'produit', label: 'Audit Produit',  accent: T.blueM,  icon: Icon.search },
  { key: 'regle',   label: 'Règle Plate',    accent: T.teal,   icon: Icon.ruler },
  { key: 'export',  label: 'Magasin Export', accent: T.purple, icon: Icon.box },
];

const STATUT_CFG = {
  PLANIFIE:  { color: T.blueM,   bg: '#EFF6FF',   bd: '#BFDBFE',   label: 'Planifié'  },
  EN_COURS:  { color: T.warn,    bg: T.warnBg,    bd: T.warnBd,    label: 'En cours'  },
  TERMINE:   { color: T.success, bg: T.successBg, bd: T.successBd, label: 'Terminé'   },
  EN_RETARD: { color: T.danger,  bg: T.dangerBg,  bd: T.dangerBd,  label: 'En retard' },
  ANNULE:    { color: T.g400,    bg: T.g100,      bd: T.g200,      label: 'Annulé'    },
};

const QK_FILTERS = [
  { value: 'TOUS',   label: 'Tous'         },
  { value: 'EQ_0',   label: 'QK = 0'       },
  { value: 'LT_0_5', label: '< 0.5'        },
  { value: 'LT_1',   label: '0.5 – 1'      },
  { value: 'EQ_1',   label: 'QK = 1'       },
  { value: 'GT_1',   label: '> 1'          },
];

function matchQKFilter(val, f) {
  if (f === 'TOUS') return true;
  const v = parseFloat(val);
  if (isNaN(v)) return false;
  if (f === 'EQ_0')   return v === 0;
  if (f === 'LT_0_5') return v > 0 && v < 0.5;
  if (f === 'LT_1')   return v >= 0.5 && v < 1;
  if (f === 'EQ_1')   return v === 1;
  if (f === 'GT_1')   return v > 1;
  return true;
}

function getQKStyle(val) {
  const v = parseFloat(val);
  if (isNaN(v))    return { color: T.g400,   bg: T.g100,      bd: T.g200      };
  if (v === 0)     return { color: T.success, bg: T.successBg, bd: T.successBd }; // Vert
  if (v <= 0.5)    return { color: T.warn,    bg: T.warnBg,    bd: T.warnBd    }; // Orange
  if (v <= 1.0)    return { color: T.rose,    bg: T.roseBg,    bd: T.roseBd    }; // Rose
  return                 { color: T.danger,  bg: T.dangerBg,  bd: T.dangerBd  }; // Rouge
}

function detectType(r) {
  const raw = r.rapportNom || r.reference || r.nom || '';
  const parts = raw ? raw.split('_') : [];
  const type = parts[0]?.toLowerCase() || '';
  
  if (type === 'qa' || type === 'audit_produit' || type.includes('produit')) return 'produit';
  if (type === 'rp' || type === 'regle' || type.includes('regle')) return 'regle';
  if (type === 'ex' || type === 'export' || type.includes('export')) return 'export';
  return r.typeAudit === 'produit' ? 'produit' : r.typeAudit === 'regle' ? 'regle' : r.typeAudit === 'export' ? 'export' : 'produit';
}

function parseNom(r) {
  const raw = r.rapportNom || r.reference || r.nom || '';
  const parts = raw ? raw.split('_') : [];
  const cleanParts = parts.map((part, index) => index === parts.length - 1 ? part.replace(/\.(pdf|html?)$/i, '') : part);
  let auditeurNom = r.auditeurNom || '';
  let plantNom = r.plantNom || '';
  let serieNom = r.serieNom || '';
  let semaineExport = r.semaineExport || r.semaine || '';
  let dateParsed = '';

  if (!auditeurNom && r.auditeur) {
    const a = r.auditeur;
    auditeurNom = `${a.nom || a.lastName || a.name || ''} ${a.prenom || a.firstName || ''}`.trim();
  }
  if (!plantNom && r.plant) {
    const p = r.plant;
    plantNom = p.nom || p.name || p.code || '';
  }

  const type = detectType(r);
  if (type === 'produit') {
    if (!serieNom && cleanParts.length >= 5) {
      const prefix = cleanParts[0]?.toLowerCase() === 'rapport' && cleanParts[1]?.toLowerCase() === 'auditproduit' ? 2 : 0;
      const tailStart = Math.max(prefix + 1, cleanParts.length - 2);
      const candidate = cleanParts.slice(prefix + 1, tailStart).join(' ').trim();
      if (candidate) serieNom = candidate;
    }
  } else if (type === 'regle') {
    if (!auditeurNom && parts.length >= 2) auditeurNom = parts[1]?.trim() || '';
    if (parts.length >= 3) dateParsed = parts[2]?.trim() || '';
    if (!plantNom) plantNom = r.plantNom || auditeurNom;
  } else if (type === 'export') {
    if (!semaineExport && parts.length >= 3) {
      const p1 = parts[1]?.trim() || '';
      const p2 = parts[2]?.trim() || '';
      if (/^[A-Z]+\d+$/i.test(p1)) {
        semaineExport = /^[A-Z]+\d+$/i.test(p2) ? `${p1}/${p2}` : p1;
        const idx = /^[A-Z]+\d+$/i.test(p2) ? 3 : 2;
        auditeurNom = auditeurNom || (parts[idx] ? parts[idx].trim() : '') || '';
        dateParsed = parts[parts.length - 1]?.trim() || '';
      } else {
        auditeurNom = auditeurNom || p1;
        dateParsed = p2;
      }
    } else if (!auditeurNom && parts.length >= 2) {
      auditeurNom = parts[1]?.trim() || '';
      dateParsed = parts[2]?.trim() || '';
    }
  }

  if (!auditeurNom) auditeurNom = r.auditeurNom || r.auditeurName || r.auditeurFullName || '';
  if (!plantNom) plantNom = r.plantNom || r.plantName || (r.plant ? (r.plant.nom || r.plant.name) : '') || '';
  if (!serieNom) serieNom = r.serieNom || r._serie || '';
  if (!semaineExport) semaineExport = r.semaineExport || r._semaine || r.semaine || '';
  if (!dateParsed) dateParsed = r.dateEnvoi || r.datePrevue || '';

  return { auditeurNom, plantNom, serieNom, semaineExport, dateParsed };
}

const fmtDate = (d) => {
  if (!d) return '—';
  try { return new Date(d).toLocaleDateString('fr-FR'); } catch { return d || '—'; }
};

const normalizeName = (value) => String(value || '')
  .toLowerCase()
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/[^a-z0-9]+/g, ' ')
  .trim()
  .replace(/\s+/g, ' ');

const namesMatch = (left, right) => {
  const a = normalizeName(left);
  const b = normalizeName(right);
  if (!a || !b) return false;
  if (a === b) return true;
  const aTokens = a.split(' ').filter(Boolean).sort().join(' ');
  const bTokens = b.split(' ').filter(Boolean).sort().join(' ');
  return aTokens === bTokens;
};

const labelContains = (label, needle) => {
  const a = normalizeName(label);
  const b = normalizeName(needle);
  if (!a || !b) return false;
  return a.includes(b);
};

const composeRapportLabel = (r) => {
  const type = detectType(r);
  const plant = String(r.plantNom || r._plant || '').trim();
  const segment = String(r.segmentNom || r._segment || '').trim();
  const projet = String(r.projetNom || r._projet || '').trim();
  const serie = String(r.serieNom || r._serie || '').trim();
  const aud = String(r.auditeurNom || r._auditeur || '').trim();

  const fileDate = (d) => {
    if (!d) return '';
    try { return new Date(d).toISOString().slice(0,10).replace(/-/g,''); } catch { return ''; }
  };

  if (type === 'produit') {
    const parts = [plant, segment, projet].filter(Boolean);
    if (serie) parts.push(serie);
    if (aud) parts.push(aud);
    if (!parts.length) return '';
    return `Rapport_ProductAudit_${parts.join('_')}.pdf`;
  }

  if (type === 'regle') {
    const parts = [plant, segment, projet].filter(Boolean);
    if (serie) parts.push(serie);
    if (aud) parts.push(aud);
    const d = fileDate(r.datePrevue || r.date || r.dateEnvoi || r.dateRealisation || r.dateFin);
    if (!parts.length && !d) return '';
    return `Rapport_AuditReglePlate_${parts.join('_')}${d ? `_${d}` : ''}.pdf`;
  }

  if (type === 'export') {
    const semaine = String(r.semaineExport || r.semaine || '').trim();
    const parts = [plant].filter(Boolean);
    if (semaine) parts.push(semaine);
    if (aud) parts.push(aud);
    const d = fileDate(r.datePrevue || r.date || r.dateEnvoi || r.dateRealisation || r.dateFin);
    if (!parts.length && !d) return '';
    return `Rapport_Magasin_${parts.join('_')}${d ? `_${d}` : ''}.pdf`;
  }

  // Fallback
  const parts = [plant, segment, projet].filter(Boolean);
  if (aud) parts.push(aud);
  if (!parts.length) return '';
  return `Rapport_${parts.join('_')}.pdf`;
};

async function downloadFile(url, filename) {
  try {
    const token = localStorage.getItem('token');
    const headers = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(url, { headers });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const blob = await res.blob();
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = blobUrl; a.download = filename || 'rapport';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(blobUrl), 8000);
  } catch { window.open(url, '_blank', 'noopener,noreferrer'); }
}

function StatutBadge({ statut }) {
  if (!statut) return <span style={{ color: T.g400, fontSize: '.75rem' }}>—</span>;
  const c = STATUT_CFG[statut] || { color: T.g400, bg: T.g100, bd: T.g200, label: statut };
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 9px', borderRadius: 8, background: c.bg, color: c.color, border: `1px solid ${c.bd}`, fontSize: '.68rem', fontWeight: 700, whiteSpace: 'nowrap' }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: c.color }} />{c.label}
    </span>
  );
}

function QKBadge({ valeurQK }) {
  const v = parseFloat(valeurQK);
  if (valeurQK == null || isNaN(v)) return <span style={{ color: T.g400 }}>—</span>;
  const { color, bg, bd } = getQKStyle(v);
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 9px', borderRadius: 8, background: bg, color, border: `1.5px solid ${bd}`, fontSize: '.7rem', fontWeight: 800, whiteSpace: 'nowrap' }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: color }} />{v.toFixed(2)}
    </span>
  );
}

function Mono({ children }) {
  if (!children) return <span style={{ color: T.g400 }}>—</span>;
  return (
    <code style={{ background: '#F1F5F9', color: T.navy, padding: '3px 7px', borderRadius: 6, fontSize: '.72rem', fontWeight: 700, border: `1px solid ${T.g200}`, fontFamily: 'monospace' }}>
      {children}
    </code>
  );
}

function ActBtn({ onClick, icon, label, bg = '#fff', color = T.navy, hoverBg, loading, disabled, border }) {
  const [hov, setHov] = useState(false);
  const compact = !label; // icon-only compact mode
  const baseBg = hov && !disabled && !loading ? (hoverBg || bg) : bg;
  const sharedStyle = {
    border: border || 'none',
    cursor: (disabled || loading) ? 'not-allowed' : 'pointer',
    opacity: (disabled || loading) ? 0.7 : 1,
    fontFamily: 'inherit',
    transition: 'all .14s',
    boxShadow: hov && !disabled && !loading ? `0 2px 8px ${baseBg}40` : 'none',
  };

  if (compact) {
    return (
      <button
        aria-label="Supprimer"
        title="Supprimer"
        disabled={disabled || loading}
        onClick={onClick}
        onMouseEnter={() => setHov(true)}
        onMouseLeave={() => setHov(false)}
        style={{
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          width: 36, height: 36, padding: 8, borderRadius: 10,
          background: baseBg, color, border: sharedStyle.border,
          transform: hov && !disabled && !loading ? 'translateY(-2px)' : 'none',
          ...sharedStyle,
        }}
      >
        {loading
          ? <span style={{ width: 14, height: 14, border: `2px solid ${color}44`, borderTopColor: color, borderRadius: '50%', display: 'inline-block', animation: 'rpt-spin .7s linear infinite' }} />
          : icon}
      </button>
    );
  }

  return (
    <button
      disabled={disabled || loading}
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 8,
        padding: '7px 13px', borderRadius: 9, background: baseBg, color,
        fontSize: '.82rem', fontWeight: 700, whiteSpace: 'nowrap', transform: hov && !disabled && !loading ? 'translateY(-1px)' : 'none',
        ...sharedStyle,
      }}
    >
      {loading
        ? <span style={{ width: 12, height: 12, border: `2px solid ${color}44`, borderTopColor: color, borderRadius: '50%', display: 'inline-block', animation: 'rpt-spin .7s linear infinite' }} />
        : icon}
      {label}
    </button>
  );
}

function Pagination({ currentPage, totalPages, perPage, totalItems, onPageChange, onPerPageChange }) {
  if (totalItems === 0) return null;
  const from = (currentPage - 1) * perPage + 1;
  const to   = Math.min(currentPage * perPage, totalItems);
  const getPages = () => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const pages = [1];
    if (currentPage > 3) pages.push('...');
    for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) pages.push(i);
    if (currentPage < totalPages - 2) pages.push('...');
    pages.push(totalPages);
    return pages;
  };
  const btnS = (active, dis) => ({
    minWidth: 30, height: 30, borderRadius: 7,
    border: active ? 'none' : `1.5px solid ${T.g200}`,
    background: active ? `linear-gradient(135deg,${T.navy},${T.blue})` : '#fff',
    color: active ? '#fff' : dis ? T.g300 : T.g500,
    fontSize: '.76rem', fontWeight: 700, cursor: dis ? 'not-allowed' : 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: '0 5px', fontFamily: 'inherit', opacity: dis ? 0.4 : 1,
    boxShadow: active ? `0 4px 12px ${T.navy}40` : 'none',
  });
  return (
    <div style={{ padding: '10px 16px', borderTop: `1px solid ${T.g100}`, background: T.g50, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: '.72rem', color: T.g400, fontWeight: 600 }}>{from}–{to} / {totalItems}</span>
        <select value={perPage} onChange={e => onPerPageChange(Number(e.target.value))}
          style={{ padding: '4px 8px', borderRadius: 7, border: `1.5px solid ${T.g200}`, fontSize: '.72rem', fontWeight: 700, color: T.g500, background: '#fff', cursor: 'pointer', fontFamily: 'inherit', outline: 'none' }}>
          {[10, 15, 25, 50].map(n => <option key={n} value={n}>{n} / page</option>)}
        </select>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <button style={btnS(false, currentPage === 1)} disabled={currentPage === 1} onClick={() => onPageChange(1)}>«</button>
        <button style={btnS(false, currentPage === 1)} disabled={currentPage === 1} onClick={() => onPageChange(currentPage - 1)}>‹</button>
        {getPages().map((p, idx) =>
          p === '...'
            ? <span key={`s${idx}`} style={{ color: T.g300, fontSize: '.8rem', padding: '0 2px' }}>…</span>
            : <button key={p} style={btnS(p === currentPage, false)} onClick={() => onPageChange(p)}>{p}</button>
        )}
        <button style={btnS(false, currentPage === totalPages)} disabled={currentPage === totalPages} onClick={() => onPageChange(currentPage + 1)}>›</button>
        <button style={btnS(false, currentPage === totalPages)} disabled={currentPage === totalPages} onClick={() => onPageChange(totalPages)}>»</button>
      </div>
    </div>
  );
}

function ViewModal({ rapport, onClose, onDownload, downloading, pdfUrl, pdfLoading }) {
  const fields = [
    { l: 'Rapport', v: rapport.displayNom || rapport.rapportNom || rapport.reference || 'Rapport' },
    { l: 'Série', v: rapport.serieNom },
    { l: 'Référence', v: rapport.reference },
    { l: 'Planification', v: rapport.planificationNom },
    { l: 'Date', v: rapport.date },
    { l: 'Plant', v: rapport.plantNom || rapport._plant },
    { l: 'Auditeur', v: rapport.auditeurNom || rapport._auditeur },
    { l: 'Semaine', v: rapport._semaine },
  ].filter(f => f.v);

  return (
    <div onClick={e => e.target === e.currentTarget && onClose()}
      style={{ position: 'fixed', inset: 0, zIndex: 1300, background: 'rgba(11,30,61,.6)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div style={{ background: '#fff', borderRadius: 18, width: '100%', maxWidth: 1000, maxHeight: '92vh', display: 'flex', flexDirection: 'column', boxShadow: '0 32px 80px rgba(0,0,0,.28)', overflow: 'hidden', animation: 'rpt-popIn .2s cubic-bezier(.34,1.4,.64,1)' }}>
        <div style={{ background: `linear-gradient(135deg,${T.navy},${T.blue})`, color: '#fff', padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(255,255,255,.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>📄</div>
            <div>
              <div style={{ fontSize: '.6rem', fontWeight: 700, color: 'rgba(255,255,255,.45)', textTransform: 'uppercase', letterSpacing: 1.2 }}>Aperçu du rapport</div>
              <div style={{ fontWeight: 800, fontSize: '.92rem', maxWidth: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{rapport.displayNom || rapport.rapportNom || rapport.reference || 'Rapport'}</div>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,.1)', border: 'none', borderRadius: 8, width: 32, height: 32, cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{Icon.close}</button>
        </div>
        <div style={{ display: 'flex', gap: 20, padding: '10px 20px', background: T.g50, borderBottom: `1px solid ${T.g200}`, flexWrap: 'wrap', alignItems: 'center', flexShrink: 0 }}>
          {fields.map(({ l, v }) => (
            <div key={l}>
              <div style={{ fontSize: '.58rem', fontWeight: 800, color: T.g400, textTransform: 'uppercase', letterSpacing: '.06em' }}>{l}</div>
              <div style={{ fontSize: '.8rem', fontWeight: 700, color: T.navy }}>{v}</div>
            </div>
          ))}
          {rapport.valeurQK != null && (
            <div>
              <div style={{ fontSize: '.58rem', fontWeight: 800, color: T.g400, textTransform: 'uppercase', letterSpacing: '.06em' }}>QK</div>
              <QKBadge valeurQK={rapport.valeurQK} />
            </div>
          )}
          {rapport.statut && (
            <div>
              <div style={{ fontSize: '.58rem', fontWeight: 800, color: T.g400, textTransform: 'uppercase', letterSpacing: '.06em' }}>Statut</div>
              <StatutBadge statut={rapport.statut} />
            </div>
          )}
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
            {rapport.rapportUrl && (
              <ActBtn onClick={() => onDownload(rapport)} icon={Icon.download} label="Télécharger" bg={T.success} hoverBg="#166534" color="#fff" loading={downloading} />
            )}
            <ActBtn onClick={onClose} icon={Icon.close} label="Fermer" bg={T.g100} hoverBg={T.g200} color={T.g500} />
          </div>
        </div>
        <div style={{ flex: 1, background: '#1e2330', overflow: 'hidden' }}>
          {pdfLoading ? (
            <div style={{ padding: 40, color: 'rgba(255,255,255,.6)' }}>Chargement du PDF…</div>
          ) : (pdfUrl || rapport.rapportUrl)
            ? <iframe src={pdfUrl || (rapport.rapportUrl.startsWith('http') ? rapport.rapportUrl : `${(import.meta.env?.VITE_API_URL || 'http://localhost:8080/api').replace('/api','')}/${String(rapport.rapportUrl).replace(/^\//,'')}`)} title="Aperçu" style={{ width: '100%', height: '100%', minHeight: 500, border: 'none' }} />
            : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 340, color: 'rgba(255,255,255,.3)', gap: 12 }}>
                <span style={{ fontSize: 40 }}>📄</span>
                <span style={{ fontSize: '.88rem' }}>Aucun fichier disponible</span>
              </div>
            )
          }
        </div>
      </div>
    </div>
  );
}

function RapportCharts({ rows, tab }) {
  const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];

  const byMonth = useMemo(() => {
    const counts = Array(12).fill(0);
    rows.forEach(r => {
      const d = r.rawDate ? new Date(r.rawDate) : null;
      if (d && !isNaN(d)) counts[d.getMonth()]++;
    });
    return counts;
  }, [rows]);

   const donutData = useMemo(() => {
     if (tab === 'produit') {
       // Répartition QK correcte : 0=Vert, 0-0.5=Orange, 0.5-1=Rose, >1=Rouge
       const vert     = rows.filter(r => { const v = parseFloat(r.valeurQK); return !isNaN(v) && v === 0; }).length;
       const orange   = rows.filter(r => { const v = parseFloat(r.valeurQK); return !isNaN(v) && v > 0 && v <= 0.5; }).length;
       const rose     = rows.filter(r => { const v = parseFloat(r.valeurQK); return !isNaN(v) && v > 0.5 && v <= 1.0; }).length;
       const rouge    = rows.filter(r => { const v = parseFloat(r.valeurQK); return !isNaN(v) && v > 1.0; }).length;
       const none     = rows.filter(r => r.valeurQK == null || isNaN(parseFloat(r.valeurQK))).length;
       return {
         labels: ['Conforme (QK=0)', 'Mineure (0<QK≤0.5)', 'Significative (0.5<QK≤1)', 'Critique (QK>1)', 'Non évalué'],
         datasets: [{ data: [vert, orange, rose, rouge, none], backgroundColor: ['#059669', '#C8982A', '#9D174D', '#DC2626', T.g300], borderWidth: 2, borderColor: '#fff' }],
       };
     }
     const termine   = rows.filter(r => r.statut === 'TERMINE').length;
     const enCours   = rows.filter(r => r.statut === 'EN_COURS').length;
     const enRetard  = rows.filter(r => r.statut === 'EN_RETARD').length;
     const planifie  = rows.filter(r => r.statut === 'PLANIFIE').length;
     const annule    = rows.filter(r => r.statut === 'ANNULE').length;
     return {
       labels: ['Terminé', 'En cours', 'En retard', 'Planifié', 'Annulé'],
       datasets: [{ data: [termine, enCours, enRetard, planifie, annule], backgroundColor: [T.success, T.warn, T.danger, T.blueM, T.g300], borderWidth: 2, borderColor: '#fff' }],
     };
   }, [rows, tab]);

  const barColor = tab === 'produit' ? T.blueM : tab === 'regle' ? T.teal : T.purple;

  return (
    <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
      <div style={{ flex: '2 1 0', minWidth: 260, background: '#fff', borderRadius: 12, padding: '10px 0 0 0', boxShadow: '0 1px 2px rgba(0,0,0,.04)' }}>
        <div style={{ padding: '0 8px', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: '.68rem', fontWeight: 800, color: T.navy, display: 'flex', alignItems: 'center', gap: 4 }}>{Icon.calendar} Par mois</span>
          <span style={{ marginLeft: 'auto', fontSize: '.6rem', fontWeight: 700, background: '#d0d9e6', color: T.blueM, padding: '2px 6px', borderRadius: 99 }}>2026</span>
        </div>
        <div style={{ height: 120, paddingRight: 4 }}>
          <Bar
            data={{
              labels: months,
              datasets: [{
                data: byMonth,
                backgroundColor: barColor + 'CC',
                borderColor: barColor,
                borderWidth: 1,
                borderRadius: 4,
                barPercentage: 0.7,
                categoryPercentage: 0.8,
              }],
            }}
            options={{
              responsive: true, maintainAspectRatio: false,
              plugins: { legend: { display: false }, tooltip: { callbacks: { label: ctx => `${ctx.parsed.y} rapport(s)` }, bodyFont: { size: 11 } } },
              scales: {
                x: { grid: { display: false }, ticks: { font: { size: 9 }, color: T.g400, maxRotation: 0, autoSkip: true } },
                y: { grid: { color: T.g300 }, ticks: { font: { size: 9 }, color: T.g400, stepSize: 1 }, beginAtZero: true },
              },
            }}
          />
        </div>
      </div>
      <div style={{ flex: '1 1 0', minWidth: 180, background: '#fff', borderRadius: 12, padding: '10px 8px', boxShadow: '0 1px 2px rgba(0,0,0,.04)' }}>
        <div style={{ fontSize: '.68rem', fontWeight: 800, color: T.navy, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
          {Icon.box} {tab === 'produit' ? 'Répartition QK' : 'Statuts'}
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <div style={{ flexShrink: 0, width: 80, height: 80 }}>
            <Doughnut
              data={{ labels: donutData.labels, datasets: donutData.datasets }}
              options={{ responsive: true, maintainAspectRatio: true, plugins: { legend: { display: false }, tooltip: { bodyFont: { size: 10 } } }, cutout: '70%' }}
            />
          </div>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
            {donutData.labels.map((lbl, i) => (
              <div key={lbl} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '.64rem', fontWeight: 500 }}>
                <span style={{ width: 8, height: 8, borderRadius: 2, background: donutData.datasets[0].backgroundColor[i], flexShrink: 0 }} />
                <span style={{ flex: 1, color: T.g500, whiteSpace: 'nowrap' }}>{lbl}</span>
                <span style={{ fontWeight: 700, color: T.navy }}>{donutData.datasets[0].data[i]}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function buildCols(tab) {
  if (tab === 'produit') return [
    { key: 'rapportNom', w: '62%', label: 'Rapport', render: r => (
      <div style={{ overflow: 'hidden' }}>
        <div style={{ fontWeight: 700, color: T.navy, fontSize: '.8rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={r.displayNom || r.rapportNom}>
          {r.displayNom || r.rapportNom}
        </div>
        <div style={{ fontSize: '.68rem', color: T.g500, marginTop: 2, display: 'flex', alignItems: 'center', gap: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {Icon.calendar}
          <span>{r.date || '—'}</span>
          {r.auditId && <span style={{ color: T.g300 }}>• ID : {r.auditId}</span>}
        </div>
      </div>
    ) },
    { key: 'valeurQK', w: '8%', label: 'QK', center: true, render: r => <QKBadge valeurQK={r.valeurQK} /> },
  ];
  if (tab === 'regle') return [
    { key: 'rapportNom', w: '36%', label: 'Rapport', render: r => (
      <div style={{ overflow: 'hidden' }}>
        <div style={{ fontWeight: 700, color: T.navy, fontSize: '.8rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={r.displayNom || r.rapportNom || composeRapportLabel(r)}>
          {r.displayNom || r.rapportNom || composeRapportLabel(r)}
        </div>
        <div style={{ fontSize: '.68rem', color: T.g500, marginTop: 2, display: 'flex', alignItems: 'center', gap: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {Icon.calendar}
          <span>{r.date || '—'}</span>
          {r.auditId && <span style={{ color: T.g300 }}>• ID : {r.auditId}</span>}
        </div>
      </div>
    ) },
    { key: '_plant', w: '14%', label: 'Plant', render: r => <span style={{ fontWeight: 600, color: T.navy, fontSize: '.8rem' }}>{r.plantNom || r._plant || '—'}</span> },
    { key: '_auditeur', w: '18%', label: 'Auditeur', render: r => <span style={{ fontSize: '.8rem' }}>{r.auditeurNom || r._auditeur || '—'}</span> },
    { key: 'date', w: '12%', label: 'Date prévue', render: r => (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <span style={{ fontSize: '.78rem', color: T.g500, whiteSpace: 'nowrap' }}>{Icon.calendar} {r.date || r._dateParsed || '—'}</span>
      </div>
    ) },
    { key: 'statut', w: '10%', label: 'Statut', center: true, render: r => <StatutBadge statut={r.statut} /> },
  ];
  if (tab === 'export') return [
    { key: 'rapportNom', w: '36%', label: 'Rapport', render: r => (
      <div style={{ overflow: 'hidden' }}>
        <div style={{ fontWeight: 700, color: T.navy, fontSize: '.8rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={r.displayNom || r.rapportNom || composeRapportLabel(r)}>
          {r.displayNom || r.rapportNom || composeRapportLabel(r)}
        </div>
        <div style={{ fontSize: '.68rem', color: T.g500, marginTop: 2, display: 'flex', alignItems: 'center', gap: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {Icon.calendar}
          <span>{r.date || '—'}</span>
          {r.auditId && <span style={{ color: T.g300 }}>• ID : {r.auditId}</span>}
        </div>
      </div>
    ) },
    { key: '_semaine', w: '13%', label: 'Semaine', render: r => <span style={{ fontWeight: 700, fontSize: '.8rem' }}>{r.semaineExport || r._semaine || '—'}</span> },
    { key: '_auditeur', w: '18%', label: 'Auditeur', render: r => <span style={{ fontSize: '.8rem' }}>{r.auditeurNom || r._auditeur || '—'}</span> },
    { key: 'date', w: '11%', label: 'Date prévue', render: r => <span style={{ fontSize: '.78rem', color: T.g500 }}>{r.date || '—'}</span> },
    { key: 'statut', w: '10%', label: 'Statut', center: true, render: r => <StatutBadge statut={r.statut} /> },
  ];
  return [
    { key: 'reference', w: '12%', label: 'Réf.', render: r => <Mono>{r.reference || r.id}</Mono> },
    { key: '_auditeur', w: '18%', label: 'Auditeur', render: r => <span style={{ fontSize: '.8rem' }}>{r.auditeurNom || r._auditeur || '—'}</span> },
    { key: 'date', w: '11%', label: 'Date prévue', render: r => (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <span style={{ fontSize: '.78rem', color: T.g500, whiteSpace: 'nowrap' }}>{Icon.calendar} {r.date || r._dateParsed || '—'}</span>
      </div>
    ) },
    { key: '_semaine', w: '13%', label: 'Semaine export', render: r => {
      const display = r.semaineExport || (r._semaine != null ? `KW ${r._semaine}` : '—');
      return <span style={{ fontWeight: 700, fontSize: '.8rem' }}>{display}</span>;
    } },
    { key: 'statut', w: '10%', label: 'Statut', center: true, render: r => <StatutBadge statut={r.statut} /> },
  ];
}

export default function ExpertRapports() {
  const baseUrl = (import.meta.env?.VITE_API_URL || 'http://localhost:8080/api').replace('/api', '');

  const [activeTab,   setActiveTab]   = useState('produit');
  const [allRapports, setAllRapports] = useState([]);
  const [planifs,     setPlanifs]     = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState('');
  const [viewRow,     setViewRow]     = useState(null);
  const [viewPdfUrl,  setViewPdfUrl]  = useState(null);
  const [viewPdfLoading, setViewPdfLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [deleting, setDeleting] = useState(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage,     setPerPage]     = useState(15);
  const [filters, setFilters] = useState({ search: '', planifId: 'TOUS', qk: 'TOUS', statut: 'TOUS', plant: 'TOUS', semaine: '', auditeur: 'TOUS' });
  const [auditeurs, setAuditeurs] = useState([]);
  const [showStats, setShowStats] = useState(false);

  useEffect(() => {
    let mounted = true;
    setLoading(true); setError('');
    const safe = async (fn) => { try { const r = await fn(); return Array.isArray(r?.data) ? r.data : []; } catch { return []; } };
    (async () => {
      try {
        const [raps, plans] = await Promise.all([
          safe(() => auditProduitAPI.getRapports()),
          safe(() => planificationAPI.getMesPlanifications()),
        ]);
        if (!mounted) return;
        const uniqueIds = [...new Set((Array.isArray(raps) ? raps : []).map(r => r.auditId || r.id).filter(Boolean))];
       // Remplacer ce bloc dans l'useEffect de chargement (ExpertRapports):
const details = await Promise.all(uniqueIds.map(async (id) => {
  try {
    const [res, annexRes] = await Promise.all([
      auditProduitAPI.getById(id),
      auditProduitAPI.getAnnexes(id).catch(() => ({ data: [] })),
    ]);
    const data = res?.data || null;
    let annexesList = Array.isArray(annexRes?.data) ? annexRes.data : [];

    

    if (data) data.annexes = annexesList || [];
    return { id: String(id), data };
  } catch {
    return { id: String(id), data: null };
  }
}));
        const detailsMap = new Map(details.filter(d => d.data).map(d => [String(d.id), d.data]));
        setAllRapports((Array.isArray(raps) ? raps : []).map(r => {
          const detail = detailsMap.get(String(r.auditId || r.id));
          return detail ? { ...detail, ...r, ...detail } : r;
        }));
        setPlanifs(plans);
      } catch (e) {
        if (mounted) setError(e?.response?.data?.message || String(e?.message || 'Erreur de chargement'));
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const resolveUrl = useCallback((r) => {
    if ((r.typeAudit === 'produit' || r._type === 'produit') && (r.id || r.auditId)) {
      return `${baseUrl}/api/audit-produit/${r.id || r.auditId}/rapport-pdf`;
    }
    const candidates = [r?.rapportGenerePdfUrl, r?.rapportPdfUrl, r?.rapportUrl, r?.pdfUrl, r?.rapportFichierUrl, r?.rapportFichierNom, r?.fileUrl, r?.fichierUrl, r?.fichierNom];
    if (Array.isArray(r?.annexes) && r.annexes.length) {
      const ann = r.annexes.find(a => a?.url || a?.fichierUrl || a?.fileUrl || a?.rapportUrl || a?.path || a?.chemin || a?.fichierNom);
      if (ann) candidates.push(ann.url || ann.fichierUrl || ann.fileUrl || ann.rapportUrl || ann.path || ann.chemin || ann.fichierNom);
    }
    const rawUrl = candidates.find(Boolean) || null;
    if (!rawUrl) return null;
    const url = String(rawUrl);
    return url.startsWith('http') ? url : `${baseUrl}/${url.replace(/^\//, '')}`;
  }, [baseUrl]);

  const handleDownload = useCallback(async (r) => {
    const url = resolveUrl(r);
    if (!url) return;
    setDownloading(true);
    await downloadFile(url, r.displayNom || r.rapportNom || `rapport_${r.auditId || r.id || 'export'}`);
    setDownloading(false);
  }, [resolveUrl]);

  const openViewRow = useCallback(async (r) => {
    setViewRow(r);
    setViewPdfUrl(null);
    if (!r || !r.rapportUrl) return;
    setViewPdfLoading(true);
    try {
      const token = localStorage.getItem('token');
      const headers = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const url = (r.typeAudit === 'produit' || r._type === 'produit') && (r.id || r.auditId)
        ? `${baseUrl}/api/audit-produit/${r.id || r.auditId}/rapport-pdf`
        : (r.rapportUrl.startsWith('http') ? r.rapportUrl : `${baseUrl}/${String(r.rapportUrl).replace(/^\//,'')}`);
      const res = await fetch(url, { headers });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      setViewPdfUrl(blobUrl);
    } catch (e) {
      console.error('Erreur ouverture PDF:', e);
    } finally { setViewPdfLoading(false); }
  }, [baseUrl]);

  const handleDelete = useCallback(async (r) => {
    if (!window.confirm(`Êtes-vous sûr de vouloir supprimer ce rapport ?\n\n${r.displayNom || r.rapportNom || r.reference || 'Sans nom'}`)) return;
    const rid = r.id || r.auditId;
    if (!rid) return;
    setDeleting(prev => new Set([...prev, rid]));
    try {
      const token = localStorage.getItem('token');
      const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };
      const url = (r.typeAudit === 'produit' || r._type === 'produit')
        ? `${baseUrl}/api/audit-produit/${rid}/rapport`
        : `${baseUrl}/api/rapports/${rid}`;
      const res = await fetch(url, { method: 'DELETE', headers });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setAllRapports(prev => prev.filter(rap => (rap.id || rap.auditId) !== rid));
    } catch (e) {
      console.error('Erreur suppression:', e);
      alert('Erreur lors de la suppression du rapport');
    } finally {
      setDeleting(prev => { const copy = new Set(prev); copy.delete(rid); return copy; });
    }
  }, [baseUrl]);

  const handleTab = (tab) => {
    setActiveTab(tab);
    setCurrentPage(1);
    setFilters({ search: '', planifId: 'TOUS', qk: 'TOUS', statut: 'TOUS', plant: 'TOUS', semaine: '', auditeur: 'TOUS' });
  };

  const setF = useCallback((key, val) => {
    if (key === '__reset__') {
      setFilters({ search: '', planifId: 'TOUS', qk: 'TOUS', statut: 'TOUS', plant: 'TOUS', semaine: '', auditeur: 'TOUS' });
    } else {
      setFilters(prev => ({ ...prev, [key]: val }));
    }
    setCurrentPage(1);
  }, []);

  const byType = useMemo(() => {
    const enriched = allRapports.map(r => {
      const type = detectType(r);
      const { auditeurNom, plantNom, serieNom, semaineExport, dateParsed } = parseNom(r);
      const displayNom = composeRapportLabel({
        ...r,
        auditeurNom: r.auditeurNom || auditeurNom,
        plantNom: r.plantNom || plantNom,
        serieNom: r.serieNom || serieNom,
      }) || r.rapportNom || r.reference || '';
      // helper: compute ISO week number from a Date
      const getWeekNumber = (date) => {
        const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
        const dayNum = d.getUTCDay() || 7;
        d.setUTCDate(d.getUTCDate() + 4 - dayNum);
        const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
        return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
      };

      // compute semaine fallback from dates when semaineExport is missing
      let semaine = semaineExport || null;
      if (!semaine) {
        const raw = r.dateEnvoi || r.datePrevue || dateParsed || null;
        if (raw) {
          let dt = null;
          if (typeof raw === 'string' && /^\d{2}\/\d{2}\/\d{4}$/.test(raw)) {
            const [dd, mm, yyyy] = raw.split('/');
            dt = new Date(Number(yyyy), Number(mm) - 1, Number(dd));
          } else {
            dt = new Date(raw);
          }
          if (dt && !isNaN(dt)) {
            semaine = getWeekNumber(dt);
          }
        }
      }

      return {
        ...r,
        _type:       type,
        _auditeur:   auditeurNom,
        _auditeurId: r.auditeurId || (r.auditeur && (r.auditeur.id || r.auditeurId)) || null,
        _plant:      plantNom,
        _segment:    r.segmentNom || r._segment || '',
        _projet:     r.projetNom || r._projet || '',
        _serie:      serieNom,
        serieNom:    r.serieNom || serieNom,
        _semaine:    semaine,
        _dateParsed: dateParsed,
        rawDate:     r.dateEnvoi || r.datePrevue || null,
        date:        fmtDate(r.dateEnvoi || r.datePrevue) !== '—'
                       ? fmtDate(r.dateEnvoi || r.datePrevue)
                       : dateParsed || '—',
        rapportUrl:  resolveUrl(r),
        displayNom,
      };
    });
    return {
      produit: enriched.filter(r => r._type === 'produit'),
      regle:   enriched.filter(r => r._type === 'regle'),
      export:  enriched.filter(r => r._type === 'export'),
    };
  }, [allRapports, resolveUrl]);

  // Debug: log totals and a small sample to help diagnose count mismatches
  useEffect(() => {
    try {
      console.log('Expert Rapports debug: total', allRapports.length, 'byType', { produit: byType.produit.length, regle: byType.regle.length, export: byType.export.length }, 'sample', allRapports.slice(0, 20));
    } catch (e) { /* ignore */ }
  }, [allRapports, byType]);

  const allRows = useMemo(() => {
    const search = (filters.search || '').toLowerCase();
    const base = byType[activeTab] || [];
    return base.filter(r => {
      if (search) {
        const hay = `${r.displayNom || ''} ${r.rapportNom || ''} ${r.reference || ''} ${r.serieNom || ''} ${r.planificationNom || ''} ${r._auditeur || ''} ${r._plant || ''} ${r._segment || ''} ${r._projet || ''}`.toLowerCase();
        if (!hay.includes(search)) return false;
      }

      if (filters.auditeur && filters.auditeur !== 'TOUS') {
        const selected = String(filters.auditeur);
        const audId = r._auditeurId || r.auditeurId || (r.auditeur && (r.auditeur.id || r.auditeurId)) || null;
        const reportNames = [r.auditeurNom, r._auditeur, r.auditeurName, r.auditeurFullName].filter(Boolean);
        const selectedAud = auditeurs.find(a => String(a.id) === selected);
        const selectedNames = [selectedAud?.nom, `${selectedAud?.prenom || ''} ${selectedAud?.nom || ''}`.trim(), filters.auditeur].filter(Boolean);
        let matched = false;
        if (audId != null) matched = String(audId) === selected;
        if (!matched && reportNames.length && selectedNames.length) {
          matched = selectedNames.some(selectedName => reportNames.some(reportName => namesMatch(selectedName, reportName)));
        }
        if (!matched && r.displayNom) {
          matched = selectedNames.some(selectedName => labelContains(r.displayNom, selectedName));
        }
        if (!matched) return false;
      }

      if (activeTab === 'produit') {
        const planifKey = String(r.planificationId || r.planificationNom || '').trim();
        if (filters.planifId !== 'TOUS' && planifKey !== filters.planifId) return false;
        if (!matchQKFilter(r.valeurQK, filters.qk)) return false;
      }
      if (activeTab === 'regle') {
        if (filters.statut !== 'TOUS' && r.statut !== filters.statut) return false;
        if (filters.plant !== 'TOUS' && (r._plant || r._auditeur) !== filters.plant) return false;
      }
      if (activeTab === 'export') {
        if (filters.statut !== 'TOUS' && r.statut !== filters.statut) return false;
        if (filters.semaine.trim() && !String(r.semaineExport || r._semaine || '').toLowerCase().includes(String(filters.semaine).toLowerCase())) return false;
      }
      return true;
    });
  }, [activeTab, byType, filters]);

  const totalPages = Math.max(1, Math.ceil(allRows.length / perPage));
  const pageRows   = allRows.slice((currentPage - 1) * perPage, currentPage * perPage);
  const tabCounts  = { produit: byType.produit.length, regle: byType.regle.length, export: byType.export.length };
  const activeTabCfg = TABS.find(t => t.key === activeTab);

  const planifOptions = useMemo(() => {
    return [...new Map(
      byType.produit
        .map(p => [String(p.planificationId || p.planificationNom || '').trim(), p.planificationNom || p.planificationId])
        .filter(([key]) => key)
    ).entries()].map(([key, label]) => ({ id: key, nom: label }));
  }, [byType.produit]);

  useEffect(() => {
    let mounted = true;
    const base = (import.meta.env?.VITE_API_URL || 'http://localhost:8080/api').replace('/api', '');
    const url = `${base}/api/utilisateurs/auditeurs`;
    const token = localStorage.getItem('token');
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    fetch(url, { headers })
      .then(r => r.ok ? r.json() : Promise.resolve([]))
      .then(data => {
        if (!mounted) return;
        if (!Array.isArray(data)) return setAuditeurs([]);
        setAuditeurs(data.map(u => ({ id: String(u.id), nom: `${(u.prenom || '').trim()} ${(u.nom || '').trim()}`.trim() })));
      })
      .catch(() => { if (mounted) setAuditeurs([]); });
    return () => { mounted = false; };
  }, []);

  const TH = {
    textAlign: 'left', padding: '10px 12px', fontSize: '.64rem', fontWeight: 800,
    color: T.g500, textTransform: 'uppercase', letterSpacing: '.08em',
    whiteSpace: 'nowrap', borderBottom: `2px solid ${T.g200}`,
    background: '#D3DBE9', overflow: 'hidden', textOverflow: 'ellipsis',
  };
  const TD = {
    padding: '11px 12px', color: T.g700, verticalAlign: 'middle',
    borderBottom: `1px solid ${T.g100}`, fontSize: '.82rem',
    overflow: 'hidden', textOverflow: 'ellipsis',
  };

  const cols = useMemo(() => buildCols(activeTab), [activeTab]);

  const filterBoxStyle = {
    display: 'flex', flexDirection: 'column', gap: 4, background: '#fff',
    border: '1px solid #CBD5E1', borderRadius: 10, padding: '8px 12px', minWidth: 160,
  };
  const searchBoxStyle = { ...filterBoxStyle, minWidth: 340, flex: '1 1 420px' };
  const filterInputStyle = {
    border: 'none', fontSize: '.8rem', fontFamily: 'inherit', background: 'transparent',
    outline: 'none', padding: '4px 0', width: '100%', color: T.g700
  };
  const filterSelectStyle = { ...filterInputStyle, cursor: 'pointer' };

  return (
    <div style={{ fontFamily: "'DM Sans',system-ui,sans-serif", display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&display=swap');
        @keyframes rpt-spin   { to { transform: rotate(360deg); } }
        @keyframes rpt-fadeUp { from{opacity:0;transform:translateY(5px)} to{opacity:1;transform:none} }
        @keyframes rpt-popIn  { from{opacity:0;transform:scale(.93)} to{opacity:1;transform:scale(1)} }
        .rpt-row { transition: background .1s; }
        .rpt-row:hover > td { background: #EBF4FF !important; }
        .rpt-row:hover .r-act { opacity: 1 !important; }
      `}</style>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: 7, flex: '1 1 auto' }}>
          {TABS.map(tab => {
            const active = activeTab === tab.key;
            return (
              <button key={tab.key} onClick={() => handleTab(tab.key)} style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                padding: '9px 96px', borderRadius: 10,
                border: active ? `2px solid ${tab.accent}` : '2px solid #CBD5E1',
                background: active ? tab.accent : '#fff',
                color: active ? '#fff' : T.g500,
                fontSize: '.8rem', fontWeight: active ? 800 : 600,
                cursor: 'pointer', fontFamily: 'inherit',
                boxShadow: active ? `0 4px 14px ${tab.accent}35` : 'none',
                transition: 'all .15s',
              }}>
                <span>{tab.icon}</span>{tab.label}
                <span style={{ background: active ? 'rgba(255,255,255,.25)' : T.g100, color: active ? '#fff' : T.g400, fontSize: '.67rem', fontWeight: 800, padding: '1px 7px', borderRadius: 99 }}>
                  {tabCounts[tab.key]}
                </span>
              </button>
            );
          })}
        </div>
        <button onClick={() => setShowStats(!showStats)} style={{
          display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 36px', borderRadius: 10,
          border: `1.5px solid ${T.g400}`, background: showStats ? '#bdd7ff' : '#fff', color: showStats ? '#2f2f2f' : T.navy,
          fontSize: '.8rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', transition: 'all .15s',
          boxShadow: showStats ? `0 2px 8px ${T.navy}40` : 'none',
        }}>
          {showStats ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="18 15 12 9 6 15"/></svg> : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9"/></svg>}
          Statistiques
        </button>
      </div>

      {!loading && showStats && (
        <div style={{ animation: 'rpt-fadeUp .25s ease' }}>
          <div style={{ background: '#fff', borderRadius: 14, border: `1px solid ${T.g200}`, overflow: 'hidden' }}>
            <div style={{ padding: '11px 16px', borderBottom: `1px solid ${T.g100}`, background: T.g50, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: '.78rem', fontWeight: 800, color: T.navy }}>{Icon.trendUp} Analyse des rapports</span>
              <span style={{ marginLeft: 'auto', background: activeTabCfg?.accent + '20', color: activeTabCfg?.accent, fontSize: '.65rem', fontWeight: 800, padding: '2px 9px', borderRadius: 99, border: `1px solid ${activeTabCfg?.accent}40` }}>
                {activeTabCfg?.label}
              </span>
            </div>
            <div style={{ padding: '14px 16px' }}>
              <RapportCharts rows={byType[activeTab] || []} tab={activeTab} />
            </div>
          </div>
        </div>
      )}

      {!loading && (
        <div style={{ background: '#fff', borderRadius: 20, border: `1px solid ${T.g300}`, overflowX: 'auto', padding: '12px 16px' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'flex-end' }}>
            <div style={searchBoxStyle}>
                <input style={filterInputStyle} placeholder="Référence, série…" value={filters.search || ''} onChange={e => setF('search', e.target.value)} />
              </div>
            <div style={filterBoxStyle}>
              <select style={filterSelectStyle} value={filters.auditeur} onChange={e => setF('auditeur', e.target.value)}>
                <option value="TOUS">Tous les auditeurs</option>
                {auditeurs.map(a => <option key={a.id} value={a.id}>{a.nom}</option>)}
              </select>
            </div>
            {activeTab === 'produit' && (
              <>
                <div style={filterBoxStyle}>
                  <select style={filterSelectStyle} value={filters.planifId} onChange={e => setF('planifId', e.target.value)}>
                    <option value="TOUS">Toutes</option>
                    {planifOptions.map(p => <option key={p.id} value={p.id}>{p.nom}</option>)}
                  </select>
                </div>
                <div style={filterBoxStyle}>
                  <select style={filterSelectStyle} value={filters.qk} onChange={e => setF('qk', e.target.value)}>
                    {QK_FILTERS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                  </select>
                </div>
              </>
            )}

            {activeTab === 'regle' && (
              <>
                <div style={filterBoxStyle}>
                  <select style={filterSelectStyle} value={filters.statut} onChange={e => setF('statut', e.target.value)}>
                    <option value="TOUS">Tous</option>
                    {Object.entries(STATUT_CFG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                </div>
                <div style={filterBoxStyle}>
                  <select style={filterSelectStyle} value={filters.plant} onChange={e => setF('plant', e.target.value)}>
                    <option value="TOUS">Tous</option>
                    {[...new Set(byType.regle.map(r => r._plant || r._auditeur).filter(Boolean))].map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
              </>
            )}

            {activeTab === 'export' && (
              <>
                <div style={filterBoxStyle}>
                  <select style={filterSelectStyle} value={filters.statut} onChange={e => setF('statut', e.target.value)}>
                    <option value="TOUS">Tous</option>
                    {Object.entries(STATUT_CFG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                </div>
                <div style={filterBoxStyle}>
                  <input style={filterInputStyle} placeholder="LTN01/KW13" value={filters.semaine} onChange={e => setF('semaine', e.target.value)} />
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <div style={{ background: '#fff', borderRadius: 16, border: `1px solid ${T.g200}`, borderTop: `3px solid ${activeTabCfg?.accent || T.navy}`, overflow: 'hidden', boxShadow: '0 2px 16px rgba(0,0,0,.05)' }}>

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '4rem', gap: 12, color: T.g400 }}>
            <span style={{ width: 28, height: 28, border: `3px solid ${T.g200}`, borderTopColor: T.navy, borderRadius: '50%', display: 'inline-block', animation: 'rpt-spin .8s linear infinite' }} />
            <span style={{ fontSize: '.84rem', fontWeight: 600 }}>Chargement…</span>
          </div>
        ) : error ? (
          <div style={{ margin: 16, background: T.dangerBg, border: `1px solid ${T.dangerBd}`, borderRadius: 10, padding: '11px 14px', color: T.danger, fontSize: '.85rem' }}>
            ⚠ {error}
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'auto' }}>
              <thead>
                <tr>
                  <th style={{ ...TH, width: '3%', textAlign: 'center' }}>#</th>
                  {cols.map(c => (
                    <th key={c.key} style={{ ...TH, width: c.w, textAlign: c.center ? 'center' : 'left' }}>
                      {c.label}
                    </th>
                  ))}
                  <th style={{ ...TH, width: '28%', textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pageRows.length === 0 ? (
                  <tr>
                    <td colSpan={cols.length + 2} style={{ textAlign: 'center', padding: '4rem 1rem', color: T.g400, fontStyle: 'italic', fontSize: '.875rem' }}>
                      Aucun résultat — ajustez les filtres
                    </td>
                  </tr>
                ) : pageRows.map((r, i) => {
                  const bg = i % 2 === 0 ? '#FFFFFF' : '#DAE1EB';
                  return (
                    <tr key={r.id || r.auditId || i} className="rpt-row" style={{ background: bg, animation: `rpt-fadeUp .15s ease ${i * .018}s both` }}>
                      <td style={{ ...TD, background: bg, textAlign: 'center', color: T.g300, fontWeight: 700, fontSize: '.72rem' }}>
                        {(currentPage - 1) * perPage + i + 1}
                      </td>
                      {cols.map(c => (
                        <td key={c.key} style={{ ...TD, background: bg, textAlign: c.center ? 'center' : 'left' }}>
                          {c.render ? c.render(r) : (r[c.key] || '—')}
                        </td>
                      ))}
                      <td style={{ ...TD, background: bg, textAlign: 'center' }}>
                        <div className="r-act" style={{ display: 'inline-flex', gap: 7, opacity: 0.9, transition: 'opacity .14s' }}>
                          {r.rapportUrl ? (
                            <>
                              <ActBtn onClick={() => openViewRow(r)} icon={Icon.eye} label="Voir" bg="#EFF6FF" hoverBg="#DBEAFE" color="#2563EB" border="1px solid #a1bdde" />
                              <ActBtn onClick={() => handleDownload(r)} icon={Icon.download} label="Télécharger" bg="#059669" hoverBg="#047857" color="#fff" loading={downloading} />
                              <ActBtn onClick={() => handleDelete(r)} icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M9 3v1H4v2h16V4h-5V3H9z" stroke="#DC2626" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M19 7l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 7" stroke="#DC2626" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M10 11v6" stroke="#DC2626" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M14 11v6" stroke="#DC2626" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>} bg="#fff" color="#DC2626" loading={deleting.has(r.id || r.auditId)} />
                            </>
                          ) : (
                            <span style={{ fontSize: '.68rem', color: T.g300, fontStyle: 'italic', padding: '5px 0' }}>—</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {!loading && !error && (
          <Pagination
            currentPage={currentPage} totalPages={totalPages}
            perPage={perPage} totalItems={allRows.length}
            onPageChange={setCurrentPage}
            onPerPageChange={v => { setPerPage(v); setCurrentPage(1); }}
          />
        )}
      </div>

      {viewRow && (
        <ViewModal
          rapport={viewRow}
          onClose={() => { setViewRow(null); if (viewPdfUrl) { URL.revokeObjectURL(viewPdfUrl); setViewPdfUrl(null); } }}
          onDownload={handleDownload}
          downloading={downloading}
          pdfUrl={viewPdfUrl}
          pdfLoading={viewPdfLoading}
        />
      )}
    </div>
  );
}
