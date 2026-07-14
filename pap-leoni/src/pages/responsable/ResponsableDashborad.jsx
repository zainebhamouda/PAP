// ═══════════════════════════════════════════════════════════════
// ResponsableDashboard.jsx — Style unifié AdminDashboard
// Données : multi-sites, audits, qualifications, déblocages,
//           QK, non-conformités, graphiques Chart.js pro
// ═══════════════════════════════════════════════════════════════
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { Chart, registerables } from 'chart.js';
Chart.register(...registerables);

// ── CountUp ──────────────────────────────────────────────────
function useCountUp(target, delay = 0) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!target && target !== 0) return;
    const t = setTimeout(() => {
      let start = null;
      const step = ts => {
        if (!start) start = ts;
        const p = Math.min((ts - start) / 900, 1);
        const e = p < .5 ? 2*p*p : -1+(4-2*p)*p;
        setVal(Math.floor(e * target));
        if (p < 1) requestAnimationFrame(step); else setVal(target);
      };
      requestAnimationFrame(step);
    }, delay);
    return () => clearTimeout(t);
  }, [target, delay]);
  return val;
}

// ── Clock ─────────────────────────────────────────────────────
function Clock() {
  const [d, setD] = useState(new Date());
  const { i18n } = useTranslation();
  useEffect(() => { const t = setInterval(() => setD(new Date()), 1000); return () => clearInterval(t); }, []);
  const p = n => String(n).padStart(2, '0');
  const localeMap = { fr:'fr-FR', en:'en-US', ar:'ar-TN', de:'de-DE', it:'it-IT' };
  return (
    <div>
      <div style={{ fontSize:'1.6rem', fontWeight:900, color:'#fff', letterSpacing:'.04em', fontFamily:"'Rajdhani',sans-serif", lineHeight:1 }}>
        {p(d.getHours())}<span style={{ opacity:.35 }}>:</span>{p(d.getMinutes())}
        <span style={{ fontSize:'.95rem', opacity:.3 }}>:{p(d.getSeconds())}</span>
      </div>
      <div style={{ fontSize:'.7rem', color:'rgba(255,255,255,.35)', marginTop:3, textTransform:'capitalize' }}>
        {d.toLocaleDateString(localeMap[i18n.language]||'fr-FR', { weekday:'long', day:'numeric', month:'long', year:'numeric' })}
      </div>
    </div>
  );
}

// ── Icons ────────────────────────────────────────────────────
const IC = {
  pin:     <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>,
  users:   <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  audit:   <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/></svg>,
  check:   <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>,
  alert:   <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
  shield:  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  trophy:  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><polyline points="8 21 12 17 16 21"/><line x1="12" y1="17" x2="12" y2="11"/><path d="M7 4H17a2 2 0 0 1 2 2v1a6 6 0 0 1-6 6 6 6 0 0 1-6-6V6a2 2 0 0 1 2-2z"/></svg>,
  unlock:  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 0 9.9-1"/></svg>,
  chart:   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
  activity:<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>,
  layers:  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>,
  list:    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>,
  qk:      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>,
  nc:      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/></svg>,
  globe:   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>,
  tool:    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>,
  store:   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M3 9l1.5-5h15L21 9"/><path d="M4 9h16v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V9z"/><path d="M9 21v-7h6v7"/></svg>,
  powerbi: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="11" width="4" height="10" rx="1"/><rect x="10" y="7" width="4" height="14" rx="1"/><rect x="17" y="3" width="4" height="18" rx="1"/></svg>,
  building:<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M6 22V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v18"/><path d="M2 22h20"/><path d="M9 7h1M14 7h1M9 11h1M14 11h1M9 15h1M14 15h1"/></svg>,
  segment: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>,
};

const CARD_SHD = '0 10px 28px rgba(11,30,61,.12)';
const cardStyle = { background:'#fff', borderRadius:16, padding:'1.1rem 1.3rem', boxShadow:CARD_SHD, border:'1px solid #E2E8F0' };

// ── KPI Card ──────────────────────────────────────────────────
function KpiCard({ icon, label, value, sub, accent, onClick, delay }) {
  const n = useCountUp(typeof value === 'number' ? value : 0, (delay||0) * 60);
  return (
    <div onClick={onClick}
      style={{ background:'#fff', borderRadius:12, padding:'.85rem 1rem', borderLeft:`3px solid ${accent}`, boxShadow:CARD_SHD, cursor:onClick?'pointer':'default', transition:'transform .18s, box-shadow .18s' }}
      onMouseEnter={e => { if (onClick) { e.currentTarget.style.transform='translateY(-3px)'; e.currentTarget.style.boxShadow='0 6px 20px rgba(0,0,0,.15)'; }}}
      onMouseLeave={e => { e.currentTarget.style.transform=''; e.currentTarget.style.boxShadow=CARD_SHD; }}>
      <div style={{ fontSize:'1.6rem', fontWeight:900, color:'#0B1E3D', letterSpacing:'-.04em', lineHeight:1, fontFamily:"'Rajdhani',sans-serif", marginBottom:6 }}>{typeof value === 'number' ? n : value}</div>
      <div style={{ display:'flex', alignItems:'center', gap:6 }}>
        <div style={{ width:22, height:22, borderRadius:6, background:accent+'22', color:accent, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>{icon}</div>
        <div>
          <div style={{ fontSize:'.74rem', fontWeight:700, color:'#1E3A5F', lineHeight:1.2 }}>{label}</div>
          {sub && <div style={{ fontSize:'.65rem', color:'#4B5563', lineHeight:1.2 }}>{sub}</div>}
        </div>
      </div>
    </div>
  );
}

function SectionTitle({ icon, title, sub }) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:'1rem' }}>
      <div style={{ width:28, height:28, borderRadius:8, background:'#DBEAFE', color:'#1D4ED8', display:'flex', alignItems:'center', justifyContent:'center' }}>{icon}</div>
      <div>
        <h3 style={{ margin:0, fontSize:'.84rem', fontWeight:800, color:'#0B1E3D' }}>{title}</h3>
        {sub && <p style={{ margin:0, fontSize:'.67rem', color:'#4B5563' }}>{sub}</p>}
      </div>
    </div>
  );
}

const toNumber = (value, fallback = 0) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

const pickNumber = (...values) => {
  for (const value of values) {
    const n = Number(value);
    if (Number.isFinite(n)) return n;
  }
  return 0;
};

const normalizeSiteSummary = (site, qkLookup = new Map(), fallbackQkLookup = new Map()) => {
  const auditeurs = pickNumber(site?.auditeurs, site?.nbAuditeurs, site?.totalAuditeurs, site?.auditeurCount, site?.nombreAuditeurs);
  const certifies = pickNumber(site?.certifies, site?.nbCertifies, site?.nbCertifie, site?.qualifies, site?.qualifie);
  const bloques = pickNumber(site?.bloques, site?.nbBloques, site?.bloque, site?.nbBloque);
  const enCours = pickNumber(site?.enCours, site?.nbEnCours, site?.enCoursCertification);
  const nombreAudits = pickNumber(site?.nombreAudits, site?.nbAudits, site?.audits);
  const nbNonConformites = pickNumber(site?.nbNonConformites, site?.nonConformites, site?.nc, site?.nombreNonConformites);
  const nombrePlants = pickNumber(site?.nombrePlants, Array.isArray(site?.plants) ? site.plants.length : undefined);
  const nombreSegments = Array.isArray(site?.plants)
    ? site.plants.reduce((sum, p) => sum + pickNumber(p?.nombreSegments), 0)
    : pickNumber(site?.nombreSegments);
  const siteKey = siteKeyOf(site);
  const qkAgg = qkLookup.get(siteKey) || fallbackQkLookup.get(siteKey);
  const qkMoyenFromValues = qkAgg && qkAgg.count > 0 ? qkAgg.sum / qkAgg.count : null;
  const tauxCertif = toNumber(site?.tauxCertif ?? site?.taux ?? site?.tauxQualification, auditeurs > 0 ? Math.round((certifies / auditeurs) * 100) : 0);
  const qkMoyen = qkMoyenFromValues ?? pickNumber(site?.qkMoyen, site?.qkMoyenGlobal, site?.qk, site?.moyenne, site?.valeurQK);
  const qkMax = pickNumber(site?.qkMax, site?.qkMaximale, site?.maxQK);

  return {
    ...site,
    auditeurs,
    certifies,
    bloques,
    enCours,
    nombreAudits,
    nbNonConformites,
    nombrePlants,
    nombreSegments,
    tauxCertif,
    qkMoyen,
    qkMax,
  };
};

const pickStatut = item => {
  const raw = String(item?.statut?.name || item?.statut || item?.etat || item?.status || '').trim();
  // remove diacritics (é, è, î ...) to normalize labels like "Planifié" -> "PLANIFIE"
  const normalized = raw.normalize ? raw.normalize('NFD').replace(/[\u0300-\u036f]/g, '') : raw;
  return String(normalized).toUpperCase();
};

const canonicalAuditStatus = s => {
  if (!s) return '';
  const str = String(s).replace(/[^A-Z0-9_ ]/g, '').toUpperCase();
  if (str.includes('PLANIF')) return 'PLANIFIE';
  if (str.includes('ENCOUR') || str.includes('EN_COURS') || str.includes('EN COURS') || str.includes('ENC')) return 'EN_COURS';
  if (str.includes('TERM') || str.includes('CLOTUR') || str.includes('CLOT')) return 'TERMINE';
  if (str.includes('RETARD') || str.includes('EN_RETARD')) return 'EN_RETARD';
  if (str.includes('ANNU') || str.includes('CANCEL')) return 'ANNULE';
  return str;
};

const getNcPoints = item => toNumber(
  item?.points,
  item?.pointsDefect,
  item?.totalDefectPoints,
  item?.gravite,
  item?.score,
  item?.valeurQK
);

const parseDateValue = (...values) => {
  for (const value of values) {
    if (!value) continue;
    const date = new Date(value);
    if (!Number.isNaN(date.getTime())) return date;
  }
  return null;
};

const normalizeKey = value => {
  const text = String(value || '').trim();
  const normalized = text.normalize ? text.normalize('NFD').replace(/[\u0300-\u036f]/g, '') : text;
  return normalized
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

const extractQkValue = item => {
  const candidates = [item?.valeurQK, item?.valeurQkExtraite, item?.qk, item?.qkMoyen, item?.qkMoyenGlobal, item?.moyenne];
  for (const candidate of candidates) {
    const value = Number(candidate);
    if (Number.isFinite(value)) return value;
  }
  return null;
};

const siteKeyOf = item => normalizeKey(
  item?.id ?? item?.siteId ?? item?.siteCode ?? item?.codeSite ?? item?.nom ?? item?.siteNom ?? item?.site ?? item?.plantNom ?? item?.segmentNom ?? item?.projetNom ?? '—'
);

const buildSiteQkLookup = (rows = []) => {
  const lookup = new Map();
  rows.forEach(row => {
    const qk = extractQkValue(row);
    const key = siteKeyOf(row);
    if (qk == null || !key) return;
    const current = lookup.get(key) || { sum: 0, count: 0 };
    current.sum += qk;
    current.count += 1;
    lookup.set(key, current);
  });
  return lookup;
};

// ── Fusion des deux sources "sites" ────────────────────────────
// L'endpoint /responsable-centrale/dashboard renvoie un "parSite" ALLÉGÉ
// (id, nom, localisation, auditeurs, certifies, audits, taux) — SANS
// plants / nombrePlants / nombreSegments.
// L'endpoint /responsable-centrale/sites renvoie lui la version COMPLÈTE
// avec plants[], nombrePlants, bloques, enCours, tauxCertif, nombreNonConformites...
// Avant, le code prenait `dash.parSite` en priorité dès qu'il existait,
// ce qui écrasait les données complètes de `sites` → plants/segments à 0
// dans les cartes ET dans le graphique BI. On fusionne les deux ici,
// en donnant la priorité aux champs les plus complets (sites).
const mergeSiteSources = (parSite = [], sites = []) => {
  const byKey = new Map();
  (Array.isArray(parSite) ? parSite : []).forEach(s => {
    const key = siteKeyOf(s);
    byKey.set(key, { ...(byKey.get(key) || {}), ...s });
  });
  (Array.isArray(sites) ? sites : []).forEach(s => {
    const key = siteKeyOf(s);
    // "sites" est la source la plus complète (plants, nombrePlants, nombreSegments,
    // bloques, enCours, nombreNonConformites...) : elle doit gagner sur parSite.
    byKey.set(key, { ...(byKey.get(key) || {}), ...s });
  });
  return Array.from(byKey.values());
};

function buildActivity7Days(dash, audits = [], passages = [], days = 7) {
  if (Array.isArray(dash?.activite7Jours) && dash.activite7Jours.length >= days) {
    return dash.activite7Jours.map((item, index) => ({
      jour: item.jour || item.label || item.date || `J${index + 1}`,
      audits: toNumber(item.audits ?? item.auditsTermines ?? item.auditsRealises ?? 0),
      qualifications: toNumber(item.qualifications ?? item.passages ?? item.certifications ?? 0),
      nc: toNumber(item.nonConformites ?? item.nc ?? 0),
    }));
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const formatter = new Intl.DateTimeFormat('fr-FR', { weekday:'short', day:'2-digit', month:'2-digit' });

  const series = Array.from({ length: days }, (_, offset) => {
    const date = new Date(today);
    date.setDate(today.getDate() - ((days - 1) - offset));
    const key = date.toISOString().slice(0, 10);
    return { key, jour: formatter.format(date), audits: 0, qualifications: 0, nc: 0 };
  });

  const byDay = new Map(series.map(item => [item.key, item]));

  audits.forEach(audit => {
    const date = parseDateValue(audit?.dateFin, audit?.dateValidationChef, audit?.dateCreation, audit?.dateDebut);
    if (!date) return;
    date.setHours(0, 0, 0, 0);
    const bucket = byDay.get(date.toISOString().slice(0, 10));
    if (!bucket) return;
    if (pickStatut(audit) === 'TERMINE' || audit?.dateFin || audit?.dateValidationChef) bucket.audits += 1;
  });

  passages.forEach(passage => {
    const date = parseDateValue(passage?.dateValidationChef, passage?.dateGenerationCertif, passage?.dateDebut, passage?.dateCreation);
    if (!date) return;
    date.setHours(0, 0, 0, 0);
    const bucket = byDay.get(date.toISOString().slice(0, 10));
    if (!bucket) return;
    if (['REUSSI', 'CERTIFIE'].includes(pickStatut(passage)) || passage?.dateValidationChef || passage?.dateGenerationCertif) {
      bucket.qualifications += 1;
    }
  });

  return series.map(({ key, ...rest }) => rest);
}

// ═══════════════════════════════════════════════════════════════
//  COMPOSANT PRINCIPAL
// ═══════════════════════════════════════════════════════════════
export default function ResponsableDashboard() {
  const { user } = useAuth();
  const { i18n } = useTranslation();
  const nav = useNavigate();

  const [dash,     setDash]     = useState({});
  const [sites,    setSites]    = useState([]);
  const [passages, setPassages] = useState([]);
  const [audits,   setAudits]   = useState([]);
  const [qkData,   setQkData]   = useState([]);
  const [ncData,   setNcData]   = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [apiErrors, setApiErrors] = useState({ audits:false, qk:false, nc:false });
  const [biMetric, setBiMetric] = useState('certifies');

  // Chart refs
  const qualifDonutRef   = useRef(null);
  const auditStatutRef   = useRef(null);
  const auditStatutRef2  = useRef(null);
  const sitesBarRef      = useRef(null);
  const qkLineRef        = useRef(null);
  const activityRef      = useRef(null);
  const deblocageBarRef  = useRef(null);
  const ncGraviteRef     = useRef(null);
  const biChartRef       = useRef(null);
  const chartsOk         = useRef(false);
  const biChartInstance  = useRef(null);

  // ── Chargement ─────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;

    const fetchData = async () => {
      setLoading(true);
      setApiErrors({ audits:false, qk:false, nc:false });

      try {
        const [d, s, p, a] = await Promise.allSettled([
          api.get('/responsable-centrale/dashboard'),
          api.get('/responsable-centrale/sites'),
          api.get('/responsable-centrale/passages'),
          api.get('/audits'),
        ]);

        if (cancelled) return;

        if (d.status === 'fulfilled') setDash(d.value.data || {});
        if (s.status === 'fulfilled') setSites(s.value.data || []);
        if (p.status === 'fulfilled') setPassages(p.value.data || []);
        if (a.status === 'fulfilled') setAudits(a.value.data || []);

        // Try to enrich from dashboard aggregates when present.
        const dashData = d.status === 'fulfilled' ? (d.value.data || {}) : {};
        const rawAudits = a.status === 'fulfilled' ? (a.value.data || []) : [];
        const fallbackAudits = dashData.audits || dashData.listeAudits || dashData.auditsList || rawAudits;
        const fallbackQk = dashData.qkParSite || dashData.qk || dashData.qkData || dashData.qkChart || [];
        const fallbackNc = dashData.nonConformites || dashData.nc || dashData.ncList || [];

        setAudits(Array.isArray(fallbackAudits) ? fallbackAudits : []);
        setQkData(Array.isArray(fallbackQk) ? fallbackQk : []);
        setNcData(Array.isArray(fallbackNc) ? fallbackNc : []);

        // Mark missing sections if dashboard did not provide aggregates.
        setApiErrors({
          audits: !Array.isArray(fallbackAudits) || fallbackAudits.length === 0,
          qk: !Array.isArray(fallbackQk) || fallbackQk.length === 0,
          nc: !Array.isArray(fallbackNc) || fallbackNc.length === 0,
        });
      } catch (err) {
        if (!cancelled) {
          // eslint-disable-next-line no-console
          console.error('[RESP-DASH] fetch error', err);
          setApiErrors({ audits:true, qk:true, nc:true });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchData();

    return () => { cancelled = true; };
  }, []);

  // ── Charts ──────────────────────────────────────────────────
  useEffect(() => {
    if (loading || chartsOk.current) return;
    chartsOk.current = true;

    const GRID = 'rgba(0,0,0,0.08)';
    const TXT  = '#1E293B';
    const AXIS = 'rgba(0,0,0,0.20)';

    // Chart 1 : Qualifications donut
    if (qualifDonutRef.current && passages.length > 0) {
      const cfg = [
        { k:['CERTIFIE','REUSSI'], l:'Qualifiés',  c:'#15803D' },
        { k:['THEORIQUE_EN_COURS'], l:'Théo.',     c:'#0369A1' },
        { k:['PRATIQUE_EN_COURS'],  l:'Pratique',  c:'#4338CA' },
        { k:['BLOQUE'],             l:'Bloqués',   c:'#B91C1C' },
        { k:['EN_ATTENTE','FORMATION_OBLIGATOIRE'], l:'Attente', c:'#6B7280' },
      ];
      const getS = p => pickStatut(p);
      new Chart(qualifDonutRef.current, {
        type:'doughnut',
        data:{ labels:cfg.map(c=>c.l), datasets:[{ data:cfg.map(c=>passages.filter(p=>c.k.includes(getS(p))).length), backgroundColor:cfg.map(c=>c.c), borderWidth:2, borderColor:'#fff', hoverOffset:6 }] },
        options:{ responsive:true, maintainAspectRatio:false, cutout:'62%', plugins:{ legend:{ display:false } } }
      });
    }

    // Chart 2 : Statuts audits donut
    if (auditStatutRef.current && audits.length > 0) {
      const statuts = ['PLANIFIE','EN_COURS','TERMINE','EN_RETARD','ANNULE'];
      const labels  = ['Planifié','En cours','Terminé','En retard','Annulé'];
      const colors  = ['#0057B8','#C8982A','#1A7A4A','#C0392B','#6B7280'];
      const counts = statuts.map(s => auditStatusCounts[s] ?? 0);
      new Chart(auditStatutRef.current, {
        type:'doughnut',
        data:{ labels, datasets:[{ data:counts, backgroundColor:colors, borderWidth:2, borderColor:'#fff', hoverOffset:6 }] },
        options:{ responsive:true, maintainAspectRatio:false, cutout:'62%', plugins:{ legend:{ display:false } } }
      });
    }

    // Duplicate the Statuts audits donut for the secondary slot (if present)
    if (auditStatutRef2.current && audits.length > 0) {
      const statuts2 = ['PLANIFIE','EN_COURS','TERMINE','EN_RETARD','ANNULE'];
      const labels2  = ['Planifié','En cours','Terminé','En retard','Annulé'];
      const colors2  = ['#0057B8','#C8982A','#1A7A4A','#C0392B','#6B7280'];
      const counts2 = statuts2.map(s => auditStatusCounts[s] ?? 0);
      new Chart(auditStatutRef2.current, {
        type:'doughnut',
        data:{ labels:labels2, datasets:[{ data:counts2, backgroundColor:colors2, borderWidth:2, borderColor:'#fff', hoverOffset:6 }] },
        options:{ responsive:true, maintainAspectRatio:false, cutout:'62%', plugins:{ legend:{ display:false } } }
      });
    }

    // Chart 3 : Auditeurs par site (bar horizontal)
    if (sitesBarRef.current && siteSummaryData.length > 0) {
      const topSites = siteSummaryData.slice(0, 8);
      new Chart(sitesBarRef.current, {
        type:'bar',
        data:{
          labels:topSites.map(s => s.nom || s.siteNom || s.plantNom || '—'),
          datasets:[
            { label:'Qualifiés', data:topSites.map(s => s.certifies), backgroundColor:'#15803D', stack:'a', borderRadius:2 },
            { label:'En cours', data:topSites.map(s => s.enCours), backgroundColor:'#0369A1', stack:'a', borderRadius:2 },
            { label:'Bloqués', data:topSites.map(s => s.bloques), backgroundColor:'#B91C1C', stack:'a', borderRadius:2 },
          ]
        },
        options:{ responsive:true, maintainAspectRatio:false, indexAxis:'y',
          plugins:{ legend:{ display:false }, tooltip:{ mode:'index', intersect:false } },
          scales:{ x:{ stacked:true, grid:{ color:GRID }, ticks:{ color:TXT, font:{ size:11 } }, border:{ color:AXIS } }, y:{ stacked:true, grid:{ display:false }, ticks:{ color:TXT, font:{ size:10, weight:'600' } }, border:{ color:AXIS } } }
        }
      });
    }

    // Chart 4 : QK par site (bar)
    if (qkLineRef.current && qkChartData.length > 0) {
      const topQk = qkChartData.slice(0, 10);
      new Chart(qkLineRef.current, {
        type:'bar',
        data:{
          labels:topQk.map(q => q.siteNom || q.plantNom || q.segmentNom || '—'),
          datasets:[{
            label:'QK moyen',
            data:topQk.map(q => toNumber(q.qkMoyen ?? q.qkMoyenGlobal ?? q.valeurQK ?? q.qk ?? q.moyenne ?? 0)),
            backgroundColor:topQk.map(q => toNumber(q.qkMoyen ?? q.qkMoyenGlobal ?? q.valeurQK ?? q.qk ?? q.moyenne ?? 0) > 0.5 ? '#C0392B' : '#1A7A4A'),
            borderRadius:5,
          }]
        },
        options:{ responsive:true, maintainAspectRatio:false,
          plugins:{ legend:{ display:false } },
          scales:{ x:{ grid:{ display:false }, ticks:{ color:TXT, font:{ size:10, weight:'600' } }, border:{ color:AXIS } }, y:{ grid:{ color:GRID }, ticks:{ color:TXT, font:{ size:11 } }, border:{ color:AXIS } } }
        }
      });
    }

    if (activityRef.current && activitySeries.length > 0) {
      new Chart(activityRef.current, {
        type:'line',
        data:{
          labels: activitySeries.map(d => d.jour),
          datasets:[
            { label:'Audits terminés', data: activitySeries.map(d => d.audits), borderColor:'#1a56db', backgroundColor:'rgba(26,86,219,0.10)', fill:true, tension:0.35, pointRadius:4, pointBackgroundColor:'#1a56db', borderWidth:2 },
            { label:'Qualifications',  data: activitySeries.map(d => d.qualifications), borderColor:'#15803D', backgroundColor:'transparent', fill:false, tension:0.35, pointRadius:4, pointBackgroundColor:'#15803D', borderWidth:2, borderDash:[5,3] },
            { label:'NC',              data: activitySeries.map(d => d.nc), borderColor:'#D97706', backgroundColor:'transparent', fill:false, tension:0.35, pointRadius:3, pointBackgroundColor:'#D97706', borderWidth:2, borderDash:[2,2] },
          ]
        },
        options:{ responsive:true, maintainAspectRatio:false, plugins:{ legend:{ display:false }, tooltip:{ mode:'index', intersect:false } }, scales:{ x:{ grid:{ display:false }, ticks:{ color:TXT, font:{ size:10, weight:'600' } }, border:{ color:AXIS } }, y:{ grid:{ color:GRID }, ticks:{ color:TXT, font:{ size:11, weight:'600' }, precision:0 }, border:{ color:AXIS } } } }
      });
    }

    // Chart 5 : Déblocages par site (bar)
    if (deblocageBarRef.current && passages.length > 0) {
      const deblocages = passages.filter(p => p.causeDeblocage || p.deblocage || p.motifDeblocage);
      const bySite = {};
      deblocages.forEach(p => {
        const s = p.siteNom || 'Inconnu';
        bySite[s] = (bySite[s]||0) + 1;
      });
      const entries = Object.entries(bySite).slice(0,8);
      if (entries.length > 0) {
        new Chart(deblocageBarRef.current, {
          type:'bar',
          data:{
            labels:entries.map(([s])=>s),
            datasets:[{ data:entries.map(([,v])=>v), backgroundColor:'#C0392B', borderRadius:5 }]
          },
          options:{ responsive:true, maintainAspectRatio:false,
            plugins:{ legend:{ display:false } },
            scales:{ x:{ grid:{ display:false }, ticks:{ color:TXT, font:{ size:10 } }, border:{ color:AXIS } }, y:{ grid:{ color:GRID }, ticks:{ color:TXT, precision:0, font:{ size:11 } }, border:{ color:AXIS } } }
          }
        });
      }
    }

    // Chart 6 : NC par gravité (donut)
    if (ncGraviteRef.current && ncData.length > 0) {
      const gravites = [25,50,75,100];
      const labels   = ['Mineurs (25)','Moyens (50)','Graves (75)','Critiques (100)'];
      const colors   = ['#0057B8','#C8982A','#D97706','#C0392B'];
      new Chart(ncGraviteRef.current, {
        type:'doughnut',
        data:{ labels, datasets:[{ data:gravites.map(g=>ncData.filter(nc=>getNcPoints(nc) === g).length), backgroundColor:colors, borderWidth:2, borderColor:'#fff', hoverOffset:6 }] },
        options:{ responsive:true, maintainAspectRatio:false, cutout:'62%', plugins:{ legend:{ display:false } } }
      });
    }
  }, [loading, dash, passages, audits, sites, qkData, ncData]);

  // ── Chart BI (Power BI interne) : reconstruit à chaque changement d'indicateur ──
  useEffect(() => {
    if (loading || !biChartRef.current) return;
    if (siteSummaryData.length === 0) return;

    if (biChartInstance.current) {
      biChartInstance.current.destroy();
      biChartInstance.current = null;
    }

    const metricConfig = {
      certifies:        { label:'Qualifiés',              color:'#15803D' },
      nombreAudits:      { label:'Audits',                 color:'#0057B8' },
      qkMoyen:           { label:'QK moyen',                color:'#C0392B' },
      nbNonConformites:  { label:'Non-conformités',         color:'#D97706' },
      tauxCertif:        { label:'Taux de qualification %', color:'#6D28D9' },
      nombrePlants:      { label:'Plants',                  color:'#0369A1' },
      nombreSegments:    { label:'Segments',                color:'#059669' },
    };
    const cfg = metricConfig[biMetric] || metricConfig.certifies;
    const sorted = [...siteSummaryData].sort((a, b) => toNumber(b[biMetric]) - toNumber(a[biMetric]));

    biChartInstance.current = new Chart(biChartRef.current, {
      type:'bar',
      data:{
        labels: sorted.map(s => s.nom || s.siteNom || s.plantNom || '—'),
        datasets:[{ label:cfg.label, data: sorted.map(s => toNumber(s[biMetric])), backgroundColor:cfg.color, borderRadius:6, maxBarThickness:34 }]
      },
      options:{
        responsive:true, maintainAspectRatio:false, indexAxis:'y',
        plugins:{ legend:{ display:false }, tooltip:{ mode:'index', intersect:false } },
        scales:{
          x:{ grid:{ color:'rgba(0,0,0,0.06)' }, ticks:{ color:'#1E293B', font:{ size:11 } }, border:{ color:'rgba(0,0,0,0.15)' } },
          y:{ grid:{ display:false }, ticks:{ color:'#1E293B', font:{ size:11, weight:'600' } }, border:{ color:'rgba(0,0,0,0.15)' } }
        }
      }
    });

    return () => {
      if (biChartInstance.current) { biChartInstance.current.destroy(); biChartInstance.current = null; }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, biMetric, dash, sites, audits, qkData]);

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'55vh', gap:14, color:'#4B5563' }}>
      <span style={{ width:28, height:28, border:'3px solid #8A9BBC', borderTopColor:'#0057B8', borderRadius:'50%', animation:'spin .8s linear infinite', display:'inline-block' }}/>
      Chargement du tableau de bord…
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  // ── Calculs dérivés ─────────────────────────────────────────
  const getS = p => pickStatut(p);
  const siteAuditQkLookup = buildSiteQkLookup(audits);
  const siteFallbackQkLookup = buildSiteQkLookup(qkData);
  // ⚠️ FIX : on fusionne dash.parSite (léger) avec sites (complet : plants,
  // nombrePlants, nombreSegments, bloques, enCours...) au lieu de laisser
  // parSite écraser silencieusement les vraies données de /sites.
  const mergedSites = mergeSiteSources(dash?.parSite, sites);
  const siteSummaryData = (mergedSites.length > 0 ? mergedSites : sites).map(site => normalizeSiteSummary(site, siteAuditQkLookup, siteFallbackQkLookup));
  const totalPass = toNumber(dash?.totalPassages ?? dash?.totalPass ?? dash?.passagesTotal, passages.length);
  const certifies = toNumber(dash?.certifies, passages.filter(p => ['CERTIFIE','REUSSI','VALIDE'].includes(getS(p))).length || siteSummaryData.reduce((sum, site) => sum + site.certifies, 0));
  const bloques = toNumber(dash?.bloques, passages.filter(p => getS(p) === 'BLOQUE').length || siteSummaryData.reduce((sum, site) => sum + site.bloques, 0));
  const enCours = toNumber(dash?.enCours, passages.filter(p => ['THEORIQUE_EN_COURS','PRATIQUE_EN_COURS','FORMATION_OBLIGATOIRE','EN_COURS'].includes(getS(p))).length || siteSummaryData.reduce((sum, site) => sum + site.enCours, 0));
  const deblocages = passages.filter(p => p.causeDeblocage || p.deblocage || p.motifDeblocage);
  const tauxCertif = totalPass > 0 ? Math.round((certifies / totalPass) * 100) : toNumber(dash?.tauxCertif, 0);

  const auditsWithQk = audits.filter(a => a.qkDepasseSeuil || a.valeurQK != null || a.valeurQkExtraite != null || a.qk != null);
  const totalAudits = toNumber(dash?.totalAudits ?? dash?.auditsTotal, audits.length);
  const isAuditTermine = a => canonicalAuditStatus(getS(a)) === 'TERMINE';
  const isAuditLate = a => {
    if (canonicalAuditStatus(getS(a)) === 'EN_RETARD') return true;
    const due = parseDateValue(a?.datePrevue, a?.dateEcheance, a?.deadline, a?.datePlanifiee);
    if (!due) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    due.setHours(0, 0, 0, 0);
    const finished = Boolean(a?.dateRealisation || a?.dateFin || a?.dateValidationChef || isAuditTermine(a));
    return !finished && due < today;
  };
  const auditsRetard = toNumber(dash?.auditsRetard ?? dash?.auditsEnRetard, audits.filter(isAuditLate).length);
  const auditsTermine = toNumber(dash?.auditsTermine ?? dash?.auditsTermines, audits.filter(a => canonicalAuditStatus(getS(a)) === 'TERMINE').length);
  const qkDep = toNumber(dash?.auditsQkDepasses, audits.filter(a => a.qkDepasseSeuil || ((a.valeurQK ?? a.valeurQkExtraite ?? a.qk) != null && Number(a.valeurQK ?? a.valeurQkExtraite ?? a.qk) > 0.5)).length);
  const typeOfAudit = a => String(a?.typeAudit || '').toUpperCase();
  const auditsReglesPlates = audits.filter(a => typeOfAudit(a) === 'AUDIT_REGLES_PLATES').length;
  const auditsMagasinExport = audits.filter(a => typeOfAudit(a) === 'AUDIT_MAGASIN_EXPORT').length;
  const auditStatusCounts = {
    PLANIFIE: audits.filter(a => canonicalAuditStatus(getS(a)) === 'PLANIFIE').length,
    EN_COURS: audits.filter(a => canonicalAuditStatus(getS(a)) === 'EN_COURS').length,
    TERMINE: auditsTermine,
    EN_RETARD: auditsRetard,
    ANNULE: audits.filter(a => canonicalAuditStatus(getS(a)) === 'ANNULE').length,
  };
  const qualificationGroups = (() => {
    const groups = new Map();
    passages.forEach((passage, index) => {
      const title = String(
        passage?.certificationTitre ||
        passage?.certificationNom ||
        passage?.qualificationTitre ||
        passage?.titreQualification ||
        passage?.titre ||
        'Qualification'
      ).trim() || 'Qualification';
      const key = title.toLowerCase();
      const auditeurKey = [passage?.auditeurId, passage?.auditeurMatricule, passage?.auditeurNom, passage?.auditeurPrenom]
        .filter(Boolean)
        .join('|') || `row-${index}`;
      const current = groups.get(key) || { title, auditeurs: new Set(), certifies: 0, enCours: 0, bloques: 0, lastDate: 0 };
      current.auditeurs.add(auditeurKey);
      const statut = getS(passage);
      if (['REUSSI', 'CERTIFIE', 'VALIDE'].includes(statut)) current.certifies += 1;
      if (['THEORIQUE_EN_COURS', 'PRATIQUE_EN_COURS', 'FORMATION_OBLIGATOIRE'].includes(statut)) current.enCours += 1;
      if (statut === 'BLOQUE') current.bloques += 1;
      const passedDate = parseDateValue(passage?.dateValidationChef, passage?.dateGenerationCertif, passage?.dateDebut, passage?.dateCreation);
      const passedTime = passedDate ? passedDate.getTime() : 0;
      if (passedTime > current.lastDate) current.lastDate = passedTime;
      groups.set(key, current);
    });
    return Array.from(groups.values())
      .map(item => ({
        ...item,
        auditeursCount: item.auditeurs.size,
      }))
      .sort((a, b) => b.lastDate - a.lastDate || b.auditeursCount - a.auditeursCount || b.certifies - a.certifies || a.title.localeCompare(b.title))
      .slice(0, 8);
  })();
  const maxQualificationAuditeurs = qualificationGroups[0]?.auditeursCount || 0;
  const qualificationAuditeursEnCours = passages.filter(p => ['THEORIQUE_EN_COURS', 'PRATIQUE_EN_COURS', 'FORMATION_OBLIGATOIRE'].includes(getS(p))).length;
  const qualificationAuditeursBloques = passages.filter(p => getS(p) === 'BLOQUE').length;
  const qualificationAuditeursCertifies = passages.filter(p => ['REUSSI', 'CERTIFIE', 'VALIDE'].includes(getS(p))).length;

  const totalNc = toNumber(dash?.totalNc ?? dash?.nbNonConformites, ncData.length || audits.reduce((sum, a) => sum + (Array.isArray(a.nonConformites) ? a.nonConformites.length : 0), 0));
  const ncCrit = toNumber(dash?.ncCritiques ?? dash?.nbNcCritiques, ncData.filter(nc => getNcPoints(nc) >= 75).length);
  const qkChartData = (Array.isArray(qkData) && qkData.length > 0 ? qkData : auditsWithQk.map(a => ({
    siteNom: a.siteNom || a.site || a.plantNom || a.plant || a.projetNom || a.segmentNom || '—',
    plantNom: a.plantNom,
    segmentNom: a.segmentNom,
    qkMoyen: a.qkMoyenGlobal ?? a.qkMoyen ?? a.valeurQK ?? a.valeurQkExtraite ?? a.qk ?? 0,
  })).concat(siteSummaryData.map(site => ({
    siteNom: site.nom || site.siteNom || site.plantNom || '—',
    plantNom: site.plantNom,
    segmentNom: site.segmentNom,
    qkMoyen: site.qkMoyen ?? (site.tauxCertif != null ? site.tauxCertif / 100 : 0),
  })))).slice(0, 10);
  const qkMoyGlob = dash?.qkMoyenGlobal != null
    ? Number(dash.qkMoyenGlobal).toFixed(2)
    : (qkChartData.length > 0 ? (qkChartData.reduce((sum, item) => sum + toNumber(item.qkMoyen ?? item.qkMoyenGlobal ?? item.valeurQK ?? item.qk ?? item.moyenne ?? 0), 0) / qkChartData.length).toFixed(2) : '—');
  const activitySeries = buildActivity7Days(dash, audits, passages, 14);
  const powerBiUrlFromApi =
    dash?.powerBiUrl ||
    dash?.powerBIUrl ||
    dash?.powerBiEmbedUrl ||
    dash?.powerbiUrl ||
    '';
  const powerBiUrlFromEnv = (import.meta.env.VITE_POWER_BI_URL || '').trim();
  const powerBiUrl = powerBiUrlFromApi || powerBiUrlFromEnv;
  const hasPowerBi = Boolean(powerBiUrl);

  const totalPlants = siteSummaryData.reduce((sum, s) => sum + toNumber(s.nombrePlants), 0);
  const totalSegments = siteSummaryData.reduce((sum, s) => sum + toNumber(s.nombreSegments), 0);

  const BI_METRICS = [
    { key:'certifies',       label:'Qualifiés' },
    { key:'nombreAudits',    label:'Audits' },
    { key:'qkMoyen',         label:'QK moyen' },
    { key:'nbNonConformites',label:'Non-conformités' },
    { key:'tauxCertif',      label:'Taux qualif. %' },
    { key:'nombrePlants',    label:'Plants' },
    { key:'nombreSegments',  label:'Segments' },
  ];

  const STAT_AUD_COLORS = ['#0057B8','#C8982A','#1A7A4A','#C0392B','#6B7280'];
  const STAT_AUD_LABELS = { PLANIFIE:'Planifié', EN_COURS:'En cours', TERMINE:'Terminé', EN_RETARD:'En retard', ANNULE:'Annulé' };

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'1.1rem', padding:'0.35rem 0 1rem' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@700;900&display=swap');
        @keyframes spin  { to{transform:rotate(360deg)} }
        @keyframes up    { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:none} }
        @keyframes fade  { from{opacity:0} to{opacity:1} }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.3} }
        .row-h { transition:background .12s; cursor:pointer; border-radius:9px; }
        .row-h:hover { background:#DDE3EE !important; }
        .act-btn { transition:transform .18s, box-shadow .18s; }
        .act-btn:hover { transform:translateY(-3px) !important; box-shadow:0 8px 22px rgba(11,30,61,.18) !important; }
        .bi-pill { transition:background .15s, color .15s, border-color .15s; }
        .bi-pill:hover { border-color:#1D4ED8 !important; }
        @media (max-width: 900px) {
          .site-cards-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
        @media (max-width: 600px) {
          .site-cards-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      {/* ══════════════════════ HERO ══════════════════════ */}
      <div style={{ background:'linear-gradient(130deg,#0B1E3D 0%,#1a3a6b 52%,#059669 100%)', borderRadius:18, padding:'1.1rem 1.6rem', display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(260px, 1fr))', alignItems:'center', gap:'1rem', boxShadow:'0 14px 34px rgba(11,30,61,.28)', border:'1px solid rgba(255,255,255,.12)', animation:'fade .4s ease', marginTop:-6 }}>
        <div>
          <div style={{ display:'flex', alignItems:'center', gap:7, marginBottom:4 }}>
            <span style={{ width:6, height:6, borderRadius:'50%', background:'#4ADE80', boxShadow:'0 0 6px #4ADE80', display:'inline-block', animation:'pulse 2s infinite' }}/>
            <h1 style={{ margin:'0 0 7px', fontSize:'1.4rem', fontWeight:900, color:'#fff', letterSpacing:'-.03em', fontFamily:"'Rajdhani',sans-serif" }}>
              Supervision totale des qualifications et audits
            </h1>
          </div>
          <div style={{ display:'flex', gap:7, flexWrap:'wrap' }}>
            {[
              { dot:'#93C5FD', txt:`${siteSummaryData.length} sites` },
              { dot:'#7DD3FC', txt:`${totalPlants} plants` },
              { dot:'#A7F3D0', txt:`${totalSegments} segments` },
              { dot:'#4ADE80', txt:`${certifies} qualifiés / ${totalPass}` },
              { dot:'#FCD34D', txt:`${tauxCertif}% taux qualification` },
              { dot:'#F87171', txt:`${auditsRetard} audits en retard` },
              { dot:'#FDA4AF', txt:`${deblocages.length} déblocages` },
            ].map((b, i) => (
              <span key={i} style={{ display:'flex', alignItems:'center', gap:5, background:'rgba(255,255,255,.1)', borderRadius:99, padding:'3px 9px', border:'1px solid rgba(255,255,255,.15)' }}>
                <span style={{ width:5, height:5, borderRadius:'50%', background:b.dot, display:'inline-block' }}/>
                <span style={{ color:'rgba(255,255,255,.8)', fontSize:'.69rem', fontWeight:600 }}>{b.txt}</span>
              </span>
            ))}
          </div>
        </div>
        <div style={{ background:'rgba(255,255,255,.14)', borderRadius:11, padding:'.8rem 1.5rem', border:'1px solid rgba(255,255,255,.2)', flexShrink:0, minWidth:200, textAlign:'right' }}>
          <Clock/>
        </div>
      </div>

      {/* ══════════════════════ KPI QUALIFICATIONS ══════════════════════ */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(180px, 1fr))', gap:'.85rem', animation:'up .4s .1s ease both' }}>
        {[
          { icon:IC.users,   label:'Total passages',   value:totalPass,       sub:'Tous sites confondus',     accent:'#0B1E3D', onClick:() => nav('/responsable/qualifications') },
          { icon:IC.trophy,  label:'Qualifiés',        value:certifies,       sub:`Taux ${tauxCertif}%`,      accent:'#15803D', onClick:() => nav('/responsable/qualifications') },
          { icon:IC.shield,  label:'En formation',     value:enCours,         sub:'Théo. ou pratique',        accent:'#0369A1' },
          { icon:IC.alert,   label:'Bloqués',          value:bloques,         sub:'Accès refusé 6 mois',      accent:'#B91C1C' },
          { icon:IC.unlock,  label:'Déblocages',       value:deblocages.length, sub:'Déblocages manuels',     accent:'#D97706', onClick:() => nav('/responsable/qualifications') },
        ].map((k, i) => <KpiCard key={i} {...k} delay={i}/>)}
      </div>

      {/* ══════════════════════ KPI AUDITS + INFRASTRUCTURE ══════════════════════ */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(180px, 1fr))', gap:'.85rem', animation:'up .4s .1s ease both' }}>
        {[
          { icon:IC.audit,   label:'Total audits',     value:totalAudits,     sub:'Tous sites',               accent:'#0B1E3D', onClick:() => nav('/responsable/multi-site') },
          { icon:IC.check,   label:'Audits terminés',  value:auditsTermine,   sub:'Audits clôturés',          accent:'#1A7A4A' },
          { icon:IC.alert,   label:'En retard',        value:auditsRetard,    sub:'Nécessitent attention',    accent:'#C0392B' },
          { icon:IC.tool,    label:'Règles plates',    value:auditsReglesPlates, sub:'Audit checklist',      accent:'#059669', onClick:() => nav('/responsable/audits') },
          { icon:IC.store,   label:'Magasin export',   value:auditsMagasinExport, sub:'Audit magasin',        accent:'#D97706', onClick:() => nav('/responsable/audits') },
        ].map((k, i) => <KpiCard key={i} {...k} delay={i}/>)}
      </div>

      {/* ══════════════════════ INFRASTRUCTURE : SITES → PLANTS → SEGMENTS ══════════════════════ */}
      <div style={{ ...cardStyle, animation:'up .4s .13s ease both' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:12, flexWrap:'wrap', marginBottom:'1rem' }}>
          <SectionTitle icon={IC.building} title="Infrastructure multi-sites" sub={`${siteSummaryData.length} sites · ${totalPlants} plants · ${totalSegments} segments`} />
        </div>
        <div className="site-cards-grid" style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:10 }}>
          {siteSummaryData.length > 0 ? siteSummaryData.map((s, i) => (
            <div key={i} onClick={() => nav('/responsable/multi-site')} className="row-h"
              style={{ background:'#F8FAFC', border:'1px solid #E8EDF7', borderRadius:14, padding:'12px 14px' }}>
              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
                <div style={{ width:30, height:30, borderRadius:9, background:'linear-gradient(135deg,#0B1E3D,#1D4ED8)', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'.72rem', fontWeight:900, flexShrink:0 }}>
                  {(s.nom||s.siteNom||'?')[0]}
                </div>
                <div style={{ minWidth:0 }}>
                  <div style={{ fontSize:'.82rem', fontWeight:800, color:'#0B1E3D', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{s.nom || s.siteNom || '—'}</div>
                  <div style={{ fontSize:'.65rem', color:'#64748B', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{s.localisation || 'Localisation —'}</div>
                </div>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:6 }}>
                {[
                  { icon:IC.building, v:s.nombrePlants||0,  l:'Plants',   c:'#0369A1' },
                  { icon:IC.segment,  v:s.nombreSegments||0, l:'Segments', c:'#059669' },
                  { icon:IC.trophy,   v:s.certifies||0,     l:'Qualifiés',c:'#15803D' },
                  { icon:IC.qk,       v:s.qkMoyen != null ? Number(s.qkMoyen).toFixed(2) : '—', l:'QK moy.', c:'#C0392B' },
                ].map((m, j) => (
                  <div key={j} style={{ background:'#fff', border:'1px solid #E2E8F0', borderRadius:9, padding:'6px 4px', textAlign:'center' }}>
                    <div style={{ color:m.c, display:'flex', justifyContent:'center', marginBottom:2 }}>{m.icon}</div>
                    <div style={{ fontSize:'.78rem', fontWeight:900, color:'#0B1E3D', fontFamily:"'Rajdhani',sans-serif" }}>{m.v}</div>
                    <div style={{ fontSize:'.58rem', color:'#64748B' }}>{m.l}</div>
                  </div>
                ))}
              </div>
            </div>
          )) : (
            <div style={{ padding:'1.5rem', border:'1px dashed #E2E8F0', borderRadius:12, color:'#94A3B8', textAlign:'center', gridColumn:'1 / -1' }}>
              Aucun site disponible pour le moment
            </div>
          )}
        </div>
      </div>

      {/* ══════════════════════ POWER BI — ANALYSE COMPARATIVE MULTI-SITES ══════════════════════ */}
      <div style={{ ...cardStyle, animation:'up .4s .16s ease both', background:'linear-gradient(180deg,#FFFFFF 0%,#F8FAFC 100%)' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'0.8rem', gap:12, flexWrap:'wrap' }}>
          <SectionTitle icon={IC.powerbi} title="Power BI — Analyse comparative multi-sites" sub="Indicateur au choix, classé site par site" />
          {hasPowerBi && (
            <button
              onClick={() => window.open(powerBiUrl, '_blank', 'noopener,noreferrer')}
              className="act-btn"
              style={{ background:'#0B1E3D', color:'#fff', border:'none', borderRadius:10, padding:'7px 12px', fontSize:'.74rem', fontWeight:800, cursor:'pointer', fontFamily:'inherit', display:'flex', alignItems:'center', gap:6 }}>
              {IC.powerbi} Ouvrir le rapport Power BI complet
            </button>
          )}
        </div>

        {hasPowerBi && (
          <div style={{ borderRadius:12, overflow:'hidden', border:'1px solid #DCE3EE', boxShadow:'0 10px 22px rgba(11,30,61,.12)', marginBottom:'1rem' }}>
            <iframe
              title="Power BI Responsable"
              src={powerBiUrl}
              style={{ width:'100%', height:380, border:'none', background:'#fff' }}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        )}

        {!hasPowerBi && (
          <p style={{ margin:'0 0 .8rem', fontSize:'.7rem', color:'#94A3B8' }}>
            Aucun rapport Power BI externe configuré — vue analytique construite en direct depuis les données PAP en attendant.
          </p>
        )}

        <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:'.9rem' }}>
          {BI_METRICS.map(m => (
            <button key={m.key} onClick={() => setBiMetric(m.key)} className="bi-pill"
              style={{
                background: biMetric === m.key ? '#0B1E3D' : '#fff',
                color: biMetric === m.key ? '#fff' : '#1E293B',
                border: `1.5px solid ${biMetric === m.key ? '#0B1E3D' : '#DCE3EE'}`,
                borderRadius:99, padding:'5px 12px', fontSize:'.7rem', fontWeight:700, cursor:'pointer', fontFamily:'inherit',
              }}>
              {m.label}
            </button>
          ))}
        </div>

        <div style={{ position:'relative', height:Math.max(siteSummaryData.length * 32, 160), background:'#fff', borderRadius:12, border:'1px solid #E2E8F0', padding:'.75rem' }}>
          <canvas ref={biChartRef}/>
        </div>
        {siteSummaryData.length === 0 && <p style={{ textAlign:'center', color:'#4B5563', fontSize:'.78rem', margin:'1rem 0 0' }}>Aucune donnée site disponible</p>}
      </div>

      {/* ══════════════════════ CHARTS ROW 1 : Qualif + Sites ══════════════════════ */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(320px, 1fr))', gap:'1rem', animation:'up .4s .18s ease both' }}>

        {/* Donut qualifications */}
        <div style={cardStyle}>
          <SectionTitle icon={IC.trophy} title="Qualifications" sub={`${totalPass} passages`}/>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem', alignItems:'center' }}>
            <div style={{ position:'relative', height:150 }}><canvas ref={qualifDonutRef}/></div>
            <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
              {[
                { l:'Qualifiés', v:certifies, c:'#15803D' },
                { l:'Théo.', v:passages.filter(p=>getS(p)==='THEORIQUE_EN_COURS').length, c:'#0369A1' },
                { l:'Pratique', v:passages.filter(p=>getS(p)==='PRATIQUE_EN_COURS').length, c:'#4338CA' },
                { l:'Bloqués', v:bloques, c:'#B91C1C' },
                { l:'Attente', v:passages.filter(p=>['EN_ATTENTE','FORMATION_OBLIGATOIRE'].includes(getS(p))).length, c:'#6B7280' },
              ].map(({ l, v, c }) => (
                <div key={l} style={{ display:'flex', alignItems:'center', gap:6 }}>
                  <span style={{ width:9, height:9, borderRadius:3, background:c, flexShrink:0 }}/>
                  <span style={{ fontSize:'.69rem', color:'#1E293B', flex:1 }}>{l}</span>
                  <span style={{ fontSize:'.8rem', fontWeight:900, color:'#0B1E3D', fontFamily:"'Rajdhani',sans-serif" }}>{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Qualifications par site (bar horizontal) */}
        <div style={cardStyle}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'1rem' }}>
            <SectionTitle icon={IC.pin} title="Qualifications par site" sub={`${sites.length} sites`}/>
            <div style={{ display:'flex', gap:8, fontSize:'.66rem', color:'#1E293B', fontWeight:600 }}>
              {[['#15803D','Qualifiés'],['#0369A1','En cours'],['#B91C1C','Bloqués']].map(([c,l]) => (
                <span key={l} style={{ display:'flex', alignItems:'center', gap:3 }}>
                  <span style={{ width:8, height:8, borderRadius:2, background:c, display:'inline-block' }}/>{l}
                </span>
              ))}
            </div>
          </div>
          <div style={{ position:'relative', height:Math.max((Math.min(sites.length,8))*30, 120) }}>
            <canvas ref={sitesBarRef}/>
          </div>
        </div>
      </div>

      {/* ══════════════════════ CLASSIFICATION QUALIFICATIONS ══════════════════════ */}
      <div style={{ ...cardStyle, animation:'up .4s .2s ease both' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:12, flexWrap:'wrap', marginBottom:'1rem' }}>
          <SectionTitle icon={IC.trophy} title="Classification des qualifications" sub="8 dernières qualifications actives" />
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(2, minmax(0, 1fr))', gap:10 }}>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(2, minmax(0, 1fr))', gap:10, gridColumn:'1 / -1' }}>
            {qualificationGroups.length > 0 ? qualificationGroups.map((item, index) => {
              const width = maxQualificationAuditeurs > 0 ? Math.max(6, (item.auditeursCount / maxQualificationAuditeurs) * 100) : 0;
              const accent = index === 0 ? '#0B1E3D' : index === 1 ? '#1D4ED8' : index === 2 ? '#059669' : index === 3 ? '#D97706' : '#64748B';
              return (
                <div key={item.title} style={{ background:'#F8FAFC', border:'1px solid #E8EDF7', borderRadius:12, padding:'10px 12px', minHeight:92 }}>
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:12, marginBottom:7 }}>
                    <div style={{ minWidth:0 }}>
                      <div style={{ fontSize:'.82rem', fontWeight:800, color:'#0B1E3D', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                        {index + 1}. {item.title}
                      </div>
                      <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginTop:4, fontSize:'.66rem', fontWeight:700, color:'#64748B' }}>
                        <span>{item.enCours} en cours</span>
                        <span>•</span>
                        <span>{item.bloques} bloqués</span>
                        <span>•</span>
                        <span>{item.certifies} certifiés</span>
                      </div>
                    </div>
                    <div style={{ display:'flex', alignItems:'center', gap:10, flexShrink:0, fontSize:'.76rem', fontWeight:800, color:'#0B1E3D', fontFamily:"'Rajdhani',sans-serif" }}>
                      <span>{item.auditeursCount} auditeur{item.auditeursCount > 1 ? 's' : ''}</span>
                    </div>
                  </div>
                  <div style={{ height:8, background:'#E2E8F0', borderRadius:99, overflow:'hidden' }}>
                    <div style={{ width:`${width}%`, height:'100%', background:accent, borderRadius:99 }} />
                  </div>
                </div>
              );
            }) : (
              <div style={{ padding:'1.5rem', border:'1px dashed #E2E8F0', borderRadius:12, color:'#94A3B8', textAlign:'center' }}>
                Aucune qualification disponible pour le moment
              </div>
            )}
          </div>
          <div
            onClick={() => nav('/responsable/classement-auditeurs')}
            className="act-btn"
            style={{
              background:'linear-gradient(135deg,#0B1E3D 0%,#1D4ED8 100%)',
              borderRadius:14,
              padding:'0.8rem 1rem',
              color:'#fff',
              boxShadow:'0 6px 18px rgba(11,30,61,.18)',
              cursor:'pointer',
              minHeight: 74,
              gridColumn:'1 / -1',
              display:'flex',
              flexDirection:'row',
              alignItems:'center',
              justifyContent:'space-between',
              gap:12,
            }}
          >
            <div style={{ display:'flex', alignItems:'center', gap:12, minWidth:0 }}>
              <div style={{ width:40, height:40, borderRadius:12, background:'rgba(255,255,255,.14)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.25rem', flexShrink:0 }}>
                🏆
              </div>
              <div style={{ minWidth:0 }}>
                <div style={{ fontSize:'.68rem', fontWeight:800, letterSpacing:'.08em', textTransform:'uppercase', color:'rgba(255,255,255,.7)', marginBottom:3 }}>
                  Classement par qualification
                </div>
                <div style={{ fontSize:'.95rem', fontWeight:900, lineHeight:1.15 }}>Ouvrir le classement des auditeurs</div>
                <div style={{ fontSize:'.72rem', color:'rgba(255,255,255,.78)', marginTop:3 }}>
                  Voir chaque qualification et ses auditeurs classés
                </div>
              </div>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8 }}>
              {[
                { label:'En cours', value:qualificationAuditeursEnCours },
                { label:'Bloqués', value:qualificationAuditeursBloques },
                { label:'Certifiés', value:qualificationAuditeursCertifies },
              ].map(entry => (
                <div key={entry.label} style={{ background:'rgba(255,255,255,.1)', border:'1px solid rgba(255,255,255,.12)', borderRadius:12, padding:'8px 10px', textAlign:'center' }}>
                  <div style={{ fontSize:'.64rem', color:'rgba(255,255,255,.7)', marginBottom:2 }}>{entry.label}</div>
                  <div style={{ fontSize:'1rem', fontWeight:900, fontFamily:"'Rajdhani',sans-serif" }}>{entry.value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ══════════════════════ SANTÉ GLOBALE + QK + NC ══════════════════════ */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(300px, 1fr))', gap:'1rem', animation:'up .4s .22s ease both' }}>

        {/* Santé globale */}
        <div style={{ background:'#1a3a6b', borderRadius:14, padding:'1.1rem 1.3rem', boxShadow:'0 4px 18px rgba(11,30,61,.25)', border:'1.5px solid #2a4a8b' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'.9rem' }}>
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <div style={{ width:28, height:28, borderRadius:8, background:'rgba(255,255,255,.15)', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center' }}>{IC.shield}</div>
              <div>
                <h3 style={{ margin:0, fontSize:'.83rem', fontWeight:800, color:'#fff' }}>Santé globale</h3>
                <p style={{ margin:0, fontSize:'.67rem', color:'rgba(255,255,255,.6)' }}>Tous sites confondus</p>
              </div>
            </div>
            <span style={{ display:'flex', alignItems:'center', gap:5 }}>
              <span style={{ width:6, height:6, borderRadius:'50%', background:'#4ADE80', animation:'pulse 2s infinite', display:'inline-block' }}/>
              <span style={{ fontSize:'.66rem', color:'#4ADE80', fontWeight:700 }}>Nominal</span>
            </span>
          </div>
          <div style={{ textAlign:'center', margin:'0 auto .4rem', position:'relative', width:110, height:60 }}>
            <svg viewBox="0 0 140 76" width="110" height="60">
              <path d="M14,72 A52,52 0 0,1 126,72" fill="none" stroke="rgba(255,255,255,.15)" strokeWidth="9" strokeLinecap="round"/>
              <path d="M14,72 A52,52 0 0,1 126,72" fill="none" stroke={tauxCertif>70?'#4ADE80':tauxCertif>40?'#FCD34D':'#f87171'} strokeWidth="9" strokeLinecap="round" strokeDasharray={`${tauxCertif*1.79} 179`}/>
            </svg>
            <div style={{ position:'absolute', bottom:0, left:0, right:0, textAlign:'center' }}>
              <span style={{ fontSize:'1.4rem', fontWeight:900, color:'#fff', fontFamily:"'Rajdhani',sans-serif" }}>{tauxCertif}%</span>
            </div>
          </div>
          <p style={{ textAlign:'center', margin:'0 0 .7rem', color:'rgba(255,255,255,.65)', fontSize:'.67rem' }}>Taux de qualification global</p>
          {[
            { lbl:'Qualifiés',          val:certifies,           c:'#4ADE80' },
            { lbl:'Bloqués',            val:bloques,             c:'#FCA5A5' },
            { lbl:'Déblocages',         val:deblocages.length,   c:'#FCD34D' },
            { lbl:'Audits en retard',   val:auditsRetard,        c:'#FDA4AF' },
            { lbl:'NC critiques',       val:ncCrit,              c:'#F87171' },
            { lbl:'QK moyen global',    val:qkMoyGlob,           c:'#C4B5FD' },
          ].map((m, i) => (
            <div key={i} style={{ display:'flex', justifyContent:'space-between', padding:'5px 0', borderTop:'1px solid rgba(255,255,255,.1)' }}>
              <span style={{ fontSize:'.71rem', color:'rgba(255,255,255,.7)' }}>{m.lbl}</span>
              <span style={{ fontSize:'.82rem', fontWeight:800, color:m.c, fontFamily:"'Rajdhani',sans-serif" }}>{m.val}</span>
            </div>
          ))}
        </div>

        {/* QK par entité */}
        <div style={cardStyle}>
          <SectionTitle icon={IC.qk} title="Indicateur QK" sub="Par entité (barre rouge = dépassement)"/>
          <div style={{ position:'relative', height:200 }}><canvas ref={qkLineRef}/></div>
          {!qkChartData.length && <p style={{ textAlign:'center', color:'#4B5563', fontSize:'.78rem', margin:'2rem 0' }}>Aucune donnée QK</p>}
        </div>

        {/* Statuts audits (remplacé à la place des Non-conformités) */}
        <div style={cardStyle}>
          <SectionTitle icon={IC.audit} title="Statuts audits" sub={`${totalAudits} audits`}/>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem', alignItems:'center' }}>
            <div style={{ position:'relative', height:150 }}><canvas ref={auditStatutRef2}/></div>
            <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
              {['PLANIFIE','EN_COURS','TERMINE','EN_RETARD','ANNULE'].map((s, i) => (
                <div key={s} style={{ display:'flex', alignItems:'center', gap:6 }}>
                  <span style={{ width:9, height:9, borderRadius:3, background:STAT_AUD_COLORS[i], flexShrink:0 }}/>
                  <span style={{ fontSize:'.69rem', color:'#1E293B', flex:1 }}>{STAT_AUD_LABELS[s]}</span>
                  <span style={{ fontSize:'.8rem', fontWeight:900, color:'#0B1E3D', fontFamily:"'Rajdhani',sans-serif" }}>{auditStatusCounts[s] ?? 0}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ══════════════════════ ACTIVITÉ 14 JOURS ══════════════════════ */}
      <div style={{ ...cardStyle, animation:'up .4s .25s ease both' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'1rem', gap:12, flexWrap:'wrap' }}>
          <SectionTitle icon={IC.activity} title="Activité 14 derniers jours" sub="Audits, qualifications et non-conformités" />
          <div style={{ display:'flex', gap:12, fontSize:'.66rem', color:'#1E293B', fontWeight:700, flexWrap:'wrap' }}>
            {[{ c:'#1a56db', l:'Audits terminés' }, { c:'#15803D', l:'Qualifications' }, { c:'#D97706', l:'NC' }].map(({ c, l }) => (
              <span key={l} style={{ display:'flex', alignItems:'center', gap:5 }}>
                <span style={{ width:16, height:3, background:c, display:'inline-block', borderRadius:2 }}/>{l}
              </span>
            ))}
          </div>
        </div>
        <div style={{ position:'relative', height:230 }}><canvas ref={activityRef}/></div>
        {!activitySeries.length && <p style={{ textAlign:'center', color:'#4B5563', fontSize:'.78rem', margin:'1.25rem 0 0' }}>Aucune donnée d'activité</p>}
      </div>

      {/* ══════════════════════ DÉBLOCAGES BAR + SITES TABLE ══════════════════════ */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(320px, 1fr))', gap:'1rem', animation:'up .4s .28s ease both' }}>

        {/* Déblocages par site */}
        <div style={cardStyle}>
          <SectionTitle icon={IC.unlock} title="Déblocages par site" sub={`${deblocages.length} déblocages`}/>
          {deblocages.length > 0 ? (
            <div style={{ position:'relative', height:180 }}><canvas ref={deblocageBarRef}/></div>
          ) : (
            <p style={{ textAlign:'center', color:'#4B5563', fontSize:'.78rem', margin:'2rem 0' }}>Aucun déblocage</p>
          )}
          {deblocages.length > 0 && (
            <div style={{ marginTop:'.75rem', display:'flex', flexDirection:'column', gap:4 }}>
              {deblocages.slice(0,3).map((p, i) => (
                <div key={i} style={{ display:'flex', alignItems:'center', gap:8, padding:'6px 8px', background:'#FFF5F5', borderRadius:8, border:'1px solid #FECACA' }}>
                  <div style={{ width:26, height:26, borderRadius:7, background:'#DC2626', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'.65rem', fontWeight:800, flexShrink:0 }}>
                    {(p.auditeurNom||'A').charAt(0)}
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:'.76rem', fontWeight:700, color:'#0B1E3D', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{p.auditeurNom}</div>
                    <div style={{ fontSize:'.63rem', color:'#DC2626', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{p.causeDeblocage}</div>
                  </div>
                </div>
              ))}
              {deblocages.length > 3 && (
                <p style={{ textAlign:'center', fontSize:'.72rem', color:'#94A3B8', margin:'.25rem 0 0', cursor:'pointer' }} onClick={() => nav('/responsable/qualifications')}>
                  + {deblocages.length-3} autres → Voir tout
                </p>
              )}
            </div>
          )}
        </div>

        {/* Tableau sites */}
        <div style={cardStyle}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'1rem' }}>
            <SectionTitle icon={IC.pin} title="Vue par site" sub={`${siteSummaryData.length} sites supervisés`}/>
            <button onClick={() => nav('/responsable/multi-site')}
              style={{ background:'#EEF2F8', border:'1.5px solid #8A9BBC', borderRadius:8, padding:'3px 9px', fontSize:'.69rem', fontWeight:700, color:'#1D4ED8', cursor:'pointer', display:'flex', alignItems:'center', gap:3, fontFamily:'inherit', marginTop:'-1rem' }}>
              Vue détaillée {IC.arrow}
            </button>
          </div>
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse' }}>
              <thead>
                <tr style={{ background:'#D5DCE8' }}>
                  {['Site','Plants','Segments','Qualifiés','Bloqués','Audits','NC'].map(h => (
                    <th key={h} style={{ padding:'7px 10px', fontSize:'.63rem', fontWeight:700, textTransform:'uppercase', letterSpacing:'.06em', color:'#1E293B', textAlign:h==='Site'?'left':'center', borderBottom:'2px solid #8A9BBC', whiteSpace:'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {siteSummaryData.slice(0,8).map((s, i) => (
                  <tr key={i} className="row-h" style={{ borderBottom:'1px solid #A0AABB' }} onClick={() => nav('/responsable/multi-site')}>
                    <td style={{ padding:'8px 10px' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:7 }}>
                        <div style={{ width:24, height:24, borderRadius:6, background:'linear-gradient(135deg,#0B1E3D,#1D4ED8)', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'.65rem', fontWeight:900, flexShrink:0 }}>{(s.nom||s.siteNom||s.plantNom||'?')[0]}</div>
                        <span style={{ fontSize:'.79rem', fontWeight:700, color:'#0B1E3D' }}>{s.nom || s.siteNom || s.plantNom || '—'}</span>
                      </div>
                    </td>
                    {[
                      { v:s.nombrePlants,     c:'#0369A1' },
                      { v:s.nombreSegments,   c:'#059669' },
                      { v:s.certifies,        c:'#15803D' },
                      { v:s.bloques,          c:'#B91C1C' },
                      { v:s.nombreAudits,     c:'#0057B8' },
                      { v:s.nbNonConformites, c:'#D97706' },
                    ].map((cell, j) => (
                      <td key={j} style={{ padding:'8px 10px', textAlign:'center' }}>
                        {(cell.v||0) > 0
                          ? <span style={{ background:cell.c+'25', color:cell.c, fontWeight:800, fontSize:'.76rem', padding:'2px 7px', borderRadius:99, border:`1.5px solid ${cell.c}` }}>{cell.v}</span>
                          : <span style={{ color:'#8A9BBC', fontSize:'.73rem' }}>—</span>}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ══════════════════════ ACTIONS RAPIDES ══════════════════════ */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(180px, 1fr))', gap:'.85rem', animation:'up .4s .35s ease both' }}>
        {[
          { icon:IC.globe,   label:'Multi-sites',      sub:'Navigation par site',           path:'/responsable/multi-site',         color:'#0B1E3D' },
          { icon:IC.trophy,  label:'Qualifications',   sub:'Tous les passages',             path:'/responsable/qualifications',     color:'#15803D' },
          { icon:IC.audit,   label:'Audits',           sub:'Tous les audits',               path:'/responsable/audits',             color:'#0057B8' },
          { icon:IC.nc,      label:'Non-conformités',  sub:'Défauts & PDCA',                path:'/responsable/multi-site',         color:'#D97706' },
          { icon:IC.qk,      label:'Indicateur QK',    sub:'Valeurs par entité',            path:'/responsable/multi-site',         color:'#6D28D9' },
          { icon:IC.list,    label:'Rapports',         sub:'Audits terminés',               path:'/responsable/multi-site',         color:'#0369A1' },
        ].map((a, i) => (
          <button key={i} className="act-btn" onClick={() => nav(a.path)}
            style={{ background:'#EEF0F3', border:'none', borderRadius:12, padding:'.9rem 1.1rem', display:'flex', alignItems:'center', gap:10, cursor:'pointer', textAlign:'left', boxShadow:CARD_SHD, fontFamily:'inherit' }}>
            <div style={{ width:34, height:34, borderRadius:9, background:a.color+'20', color:a.color, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>{a.icon}</div>
            <div style={{ flex:1 }}>
              <p style={{ margin:0, fontSize:'.79rem', fontWeight:800, color:'#0B1E3D' }}>{a.label}</p>
              <p style={{ margin:'1px 0 0', fontSize:'.65rem', color:'#4B5563' }}>{a.sub}</p>
            </div>
            <span style={{ color:'#4B5563' }}>{IC.arrow}</span>
          </button>
        ))}
      </div>
    </div>
  );
}