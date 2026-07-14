import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import api, { auditSpecialAPI } from '../../services/api';
import { Chart, registerables } from 'chart.js';
Chart.register(...registerables);

/* ══ COUNTER ══════════════════════════════════════════════════════ */
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
        if (p < 1) requestAnimationFrame(step);
        else setVal(target);
      };
      requestAnimationFrame(step);
    }, delay);
    return () => clearTimeout(t);
  }, [target, delay]);
  return val;
}

/* ══ ICONS ════════════════════════════════════════════════════════ */
const IC = {
  shield:   <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  award:    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/></svg>,
  check:    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>,
  users:    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  activity: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>,
  chart:    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
  cal:      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  lock:     <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>,
  clock:    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  tool:     <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>,
  layers:   <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>,
  warn:     <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/></svg>,
  arrow:    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>,
  pie:      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M21.21 15.89A10 10 0 1 1 8 2.83"/><path d="M22 12A10 10 0 0 0 12 2v10z"/></svg>,
  target:   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>,
  report:   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>,
  plus:     <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  list:     <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/></svg>,
  bell:     <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>,
  certif:   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/></svg>,
  book:     <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>,
  percent:  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><line x1="19" y1="5" x2="5" y2="19"/><circle cx="6.5" cy="6.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/></svg>,
};

/* ══ STYLES ═══════════════════════════════════════════════════════ */
const CARD_SHD  = '0 8px 28px rgba(11,30,61,.18), 0 2px 8px rgba(0,0,0,.06)';
const cardStyle = { background:'#fff', borderRadius:14, padding:'1.1rem 1.3rem', boxShadow:CARD_SHD };

/* ══ KPI CARD ═════════════════════════════════════════════════════ */
function KpiCard({ icon, label, value, sub, accent, onClick, delay=0 }) {
  const n = useCountUp(value || 0, delay * 60);
  return (
    <div onClick={onClick}
      style={{ background:'#fff', borderRadius:12, padding:'.6rem .8rem',
        borderLeft:`3px solid ${accent}`, boxShadow:CARD_SHD,
        cursor:onClick?'pointer':'default', transition:'transform .18s, box-shadow .18s' }}
      onMouseEnter={e => { if(onClick){e.currentTarget.style.transform='translateY(-2px)';e.currentTarget.style.boxShadow='0 6px 20px rgba(0,0,0,.12)';}}}
      onMouseLeave={e => { e.currentTarget.style.transform=''; e.currentTarget.style.boxShadow=CARD_SHD; }}> 
      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
        <div style={{ width:44, height:36, borderRadius:8, background:accent+'22',
          color:accent, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, fontWeight:900, fontSize:'1.05rem', fontFamily:"'Rajdhani',sans-serif" }}>
          {n}
        </div>
        <div style={{ minWidth:0 }}>
          <div style={{ fontSize:'.78rem', fontWeight:800, color:'#1E3A5F', lineHeight:1 }}>{label}</div>
          {sub && <div style={{ fontSize:'.66rem', color:'#4B5563', lineHeight:1.2, marginTop:4 }}>{sub}</div>}
        </div>
      </div>
    </div>
  );
}

/* ══ SECTION TITLE ════════════════════════════════════════════════ */
function SectionTitle({ icon, title, sub, action, onAction }) {
  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'1rem' }}>
      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
        <div style={{ width:28, height:28, borderRadius:8, background:'#DBEAFE', color:'#1D4ED8',
          display:'flex', alignItems:'center', justifyContent:'center' }}>{icon}</div>
        <div>
          <h3 style={{ margin:0, fontSize:'.84rem', fontWeight:800, color:'#0B1E3D' }}>{title}</h3>
          {sub && <p style={{ margin:0, fontSize:'.67rem', color:'#4B5563' }}>{sub}</p>}
        </div>
      </div>
      {action && (
        <button onClick={onAction}
          style={{ background:'#EEF2F8', border:'1.5px solid #8A9BBC', borderRadius:8, padding:'3px 9px',
            fontSize:'.69rem', fontWeight:700, color:'#1D4ED8', cursor:'pointer',
            display:'flex', alignItems:'center', gap:3, fontFamily:'inherit' }}>
          {action} {IC.arrow}
        </button>
      )}
    </div>
  );
}

/* ══ HEALTH GAUGE ═════════════════════════════════════════════════ */
function HealthGauge({ pct }) {
  const color = pct>70?'#4ADE80':pct>40?'#FCD34D':'#f87171';
  return (
    <div style={{ textAlign:'center', margin:'0 auto .4rem', position:'relative', width:110, height:60 }}>
      <svg viewBox="0 0 140 76" width="110" height="60">
        <path d="M14,72 A52,52 0 0,1 126,72" fill="none" stroke="rgba(255,255,255,.15)" strokeWidth="9" strokeLinecap="round"/>
        <path d="M14,72 A52,52 0 0,1 126,72" fill="none" stroke={color} strokeWidth="9" strokeLinecap="round"
          strokeDasharray={`${pct*1.79} 179`} style={{ transition:'stroke-dasharray 1.2s ease' }}/>
      </svg>
      <div style={{ position:'absolute', bottom:0, left:0, right:0, textAlign:'center' }}>
        <span style={{ fontSize:'1.4rem', fontWeight:900, color:'#fff', fontFamily:"'Rajdhani',sans-serif" }}>{pct}%</span>
      </div>
    </div>
  );
}

/* ══ BADGE PASSAGE ════════════════════════════════════════════════ */
function PassageBadge({ statut }) {
  const { t } = useTranslation();
  const MAP = {
    EN_ATTENTE:            { c:'#C8982A', bg:'#FFFBEB' },
    FORMATION_OBLIGATOIRE: { c:'#7C3AED', bg:'#F5F3FF' },
    THEORIQUE_EN_COURS:    { c:'#2563EB', bg:'#EFF6FF' },
    THEORIQUE_ECHOUE:      { c:'#DC2626', bg:'#FEF2F2' },
    PRATIQUE_EN_COURS:     { c:'#7C3AED', bg:'#F5F3FF' },
    PRATIQUE_ECHOUE:       { c:'#DC2626', bg:'#FEF2F2' },
    RAPPORT_VALIDE:        { c:'#059669', bg:'#ECFDF5' },
    CERTIFIE:              { c:'#059669', bg:'#ECFDF5' },
    BLOQUE:                { c:'#6B7280', bg:'#F3F4F6' },
    ANNULE:                { c:'#9CA3AF', bg:'#F9FAFB' },
  };
  const label = t(`expert.badges.${statut}`, statut);
  const cfg = MAP[statut] || { c:'#6B7280', bg:'#F3F4F6' };
  return (
    <span style={{ background:cfg.bg, color:cfg.c, fontSize:'.65rem', fontWeight:700,
      padding:'2px 8px', borderRadius:99, whiteSpace:'nowrap' }}>
      {label}
    </span>
  );
}

/* ══ FMT DATE ═════════════════════════════════════════════════════ */
function fmt(d, locale = 'fr-FR') {
  if (!d) return '—';
  return new Date(d).toLocaleDateString(locale, { day:'2-digit', month:'short' });
}

/* ══════════════════════════════════════════════════════════════════
   COMPOSANT PRINCIPAL
══════════════════════════════════════════════════════════════════ */
export default function ExpertDashboard() {
  const { user }   = useAuth();
  const navigate   = useNavigate();
  const { t, i18n } = useTranslation();
  const locale = i18n.language || 'fr-FR';
  const plural = (base, count) => t(`${base}.${count > 1 ? 'other' : 'one'}`, { count });

  /* ── State ── */
  const [certifs,        setCertifs]        = useState([]);
  const [passages,       setPassages]       = useState([]);
  const [testsTheo,      setTestsTheo]      = useState([]);
  const [testsPrat,      setTestsPrat]      = useState([]);
  const [planifications, setPlanifications] = useState([]);
  const [audits,         setAudits]         = useState([]);
  const [auditsRegle,    setAuditsRegle]    = useState([]);
  const [auditsExport,   setAuditsExport]   = useState([]);
  const [fichesAttente,  setFichesAttente]  = useState([]);
  const [loading,        setLoading]        = useState(true);

  /* ── Chart refs ── */
  const passageRef = useRef(null);
  const auditRef   = useRef(null);
  const scoreRef   = useRef(null);
  const planifRef  = useRef(null);
  
  const passageChart = useRef(null);
  const auditChart   = useRef(null);
  const scoreChart   = useRef(null);
  const planifChart  = useRef(null);
  
  // ── Graphes chef (4 nouveaux) ──
  const repartitionRef = useRef(null);
  const repartitionChartRef = useRef(null);
  const statutRef = useRef(null);
  const statutChartRef = useRef(null);
  const qkRef = useRef(null);
  const qkChartRef = useRef(null);
  const pdcaRef = useRef(null);
  const pdcaChartRef = useRef(null);

  /* ── Load data ── */
  useEffect(() => {
    Promise.allSettled([
      api.get('/expert-audit/certifications/all'),
      api.get('/expert-audit/passages/all').catch(() => api.get('/expert-audit/passages/reussis')),
      api.get('/expert-audit/tests/all'),
      api.get('/expert-audit/tests-pratiques/all'),
      api.get('/planification/mes-planifications').catch(() => ({ data:[] })),
      api.get('/audits').catch(() => ({ data:[] })),
      auditSpecialAPI.listerReglePlates().catch(() => ({ data:[] })),
      auditSpecialAPI.listerExports().catch(() => ({ data:[] })),
      api.get('/audit-produit/fiche-reparation/en-attente-expert').catch(() => ({ data:[] })),
    ]).then(([rC,rP,rTT,rTP,rPL,rA,rR,rE,rF]) => {
      setCertifs       (rC.status  === 'fulfilled' ? (rC.value.data   || []) : []);
      setPassages      (rP.status  === 'fulfilled' ? (rP.value.data   || []) : []);
      setTestsTheo     (rTT.status === 'fulfilled' ? (rTT.value.data  || []) : []);
      setTestsPrat     (rTP.status === 'fulfilled' ? (rTP.value.data  || []) : []);
      setPlanifications(rPL.status === 'fulfilled' ? (rPL.value.data  || []) : []);
      setAudits        (rA.status  === 'fulfilled' ? (rA.value.data   || []) : []);
      setAuditsRegle   (rR.status  === 'fulfilled' ? (rR.value.data   || []) : []);
      setAuditsExport  (rE.status  === 'fulfilled' ? (rE.value.data   || []) : []);
      setFichesAttente (rF.status  === 'fulfilled' ? (rF.value.data   || []) : []);
    }).finally(() => setLoading(false));
  }, []);

  /* ══ CALCULS ══════════════════════════════════════════════════ */

  /* Certifications */
  const certifActives    = certifs.filter(c => c.actif && !c.brouillon);
  const certifConfirmees = certifs.filter(c => !c.brouillon);
  const brouillons       = certifs.filter(c => c.brouillon);
  const certifBientot    = certifs.filter(c => c.joursAvantExpiration != null && c.joursAvantExpiration >= 0 && c.joursAvantExpiration < 30);
  const totalQuestions   = testsTheo.reduce((s,t) => s+(t.nbQuestionsImage||0)+(t.nbQuestionsQCMPool||0), 0);

  /* Passages */
  const totalPassages     = passages.length;
  const certifies         = passages.filter(p => ['CERTIFIE','RAPPORT_VALIDE'].includes(p.statut));
  const bloques           = passages.filter(p => p.statut === 'BLOQUE');
  const enCoursCertif     = passages.filter(p => ['THEORIQUE_EN_COURS','PRATIQUE_EN_COURS'].includes(p.statut));
  const enAttente         = passages.filter(p => ['EN_ATTENTE','FORMATION_OBLIGATOIRE'].includes(p.statut));
  const rapportsAValider  = passages.filter(p => p.rapportPratiqueJson && p.statut === 'PRATIQUE_EN_COURS');
  const certifsAGenerer   = passages.filter(p => p.statut === 'RAPPORT_VALIDE' && (!p.statutCertificat || p.statutCertificat === 'NON_GENERE'));
  const tauxReussite      = totalPassages > 0 ? Math.round(certifies.length / totalPassages * 100) : 0;

  const scoresTheo = passages.filter(p => p.scoreTheorique != null)
    .map(p => p.scoreTheoriquePct ?? Math.round((p.scoreTheorique / 20) * 100));
  const scoreTheoMoyen = scoresTheo.length > 0 ? Math.round(scoresTheo.reduce((a,b) => a+b,0) / scoresTheo.length) : 0;
  const scoresPrat = passages.filter(p => p.scorePratique != null).map(p => Math.round(p.scorePratique));
  const scorePratMoyen = scoresPrat.length > 0 ? Math.round(scoresPrat.reduce((a,b) => a+b,0) / scoresPrat.length) : 0;

  /* Audits */
  const auditsPlanif   = audits.filter(a => a.statut === 'PLANIFIE').length;
  const auditsEnCours  = audits.filter(a => a.statut === 'EN_COURS').length;
  const auditsTermines = audits.filter(a => a.statut === 'TERMINE').length;
  const auditsRetard   = audits.filter(a => a.statut === 'EN_RETARD').length;
  const totalAudits    = audits.length;

  const allAuditsBI = [...audits, ...auditsRegle, ...auditsExport];
  const auditsProduitBI = audits.filter(a => a.typeAudit === 'AUDIT_PRODUIT');
  const auditsRegleBI = auditsRegle;
  const auditsExportBI = auditsExport;
  const qkAuditsBI = auditsProduitBI.filter(a => a.valeurQK != null || a.couleurQK != null);
  const ficheValideeCount = auditsProduitBI.filter(a => a.ficheValidee || a.ficheReparationValidee).length;
  const pdcaValideeCount = auditsProduitBI.filter(a => a.pdcaValidee || a.pdcaComplete).length;

  /* Planifications */
  const planifEnCours       = planifications.filter(p => p.statut === 'EN_COURS').length;
  const totalPlanifAudits   = planifications.reduce((s,p) => s+(p.nombreAuditsTotal||0), 0);
  const totalPlanifTermines = planifications.reduce((s,p) => s+(p.nombreAuditsTermines||0), 0);
  const totalRetard         = planifications.reduce((s,p) => s+(p.nombreAuditsEnRetard||0), 0);
  const completionPct       = totalPlanifAudits > 0 ? Math.round(totalPlanifTermines/totalPlanifAudits*100) : 0;

  /* Passages par mois (6 derniers) */
  const moisMap = {};
  passages.forEach(p => {
    const d = new Date(p.dateDebut || p.datePassage || Date.now());
    const key = `${d.getMonth()+1}/${String(d.getFullYear()).slice(-2)}`;
    if (!moisMap[key]) moisMap[key] = { ok:0, fail:0, bloc:0 };
    if (['CERTIFIE','RAPPORT_VALIDE'].includes(p.statut)) moisMap[key].ok++;
    else if (p.statut?.includes('ECHOUE')) moisMap[key].fail++;
    else if (p.statut === 'BLOQUE') moisMap[key].bloc++;
  });
  const moisKeys = Object.keys(moisMap).sort((a, b) => {
    // Trier chronologiquement : "M/YY" → convertir en valeur comparable
    const [mA, yA] = a.split('/').map(Number);
    const [mB, yB] = b.split('/').map(Number);
    return (yA * 12 + mA) - (yB * 12 + mB);
  }).slice(-6);

  /* Passages récents */
  const derniersPassages = [...passages]
    .sort((a,b) => new Date(b.dateDebut||0) - new Date(a.dateDebut||0))
    .slice(0,8);

  /* ══ CHARTS ═══════════════════════════════════════════════════ */
  /* ══ CHARTS ═══════════════════════════════════════════════════ */
  useEffect(() => {
    if (loading) return;
    
    // Destroy previous charts
    if (passageChart.current) passageChart.current.destroy();
    if (auditChart.current) auditChart.current.destroy();
    if (scoreChart.current) scoreChart.current.destroy();
    if (planifChart.current) planifChart.current.destroy();
    
    const GRID = 'rgba(15,23,42,.14)';
    const TXT  = '#1E293B';
    const AXIS = 'rgba(15,23,42,.28)';
    const scalesBase = {
      x:{ grid:{display:false}, ticks:{color:TXT,font:{size:11,weight:'600'}}, border:{color:AXIS} },
      y:{ grid:{color:GRID,lineWidth:1.2}, ticks:{color:TXT,font:{size:11,weight:'600'},precision:0}, border:{color:AXIS} },
    };

    /* Chart 1 – Passages par mois (courbe area BI) */
    if (passageRef.current && moisKeys.length > 0) {
      passageChart.current = new Chart(passageRef.current, {
        type:'line',
        data:{
          labels: moisKeys,
          datasets:[
            { label:t('expert.dashboard.charts.certified'), data:moisKeys.map(k => moisMap[k].ok),
              borderColor:'#10B981', backgroundColor:'rgba(16,185,129,.15)',
              fill:true, tension:.55, pointRadius:6, borderWidth:3.5,
              pointBackgroundColor:'#10B981', pointBorderColor:'#fff', pointBorderWidth:3,
              pointHoverRadius:8, hoverBorderWidth:4, cubicInterpolationMode:'monotone' },
            { label:t('expert.dashboard.charts.failed'), data:moisKeys.map(k => moisMap[k].fail),
              borderColor:'#EF4444', backgroundColor:'rgba(239,68,68,.12)',
              fill:true, tension:.55, pointRadius:6, borderWidth:3.5,
              pointBackgroundColor:'#EF4444', pointBorderColor:'#fff', pointBorderWidth:3,
              pointHoverRadius:8, hoverBorderWidth:4, cubicInterpolationMode:'monotone' },
            { label:t('expert.dashboard.charts.blocked'), data:moisKeys.map(k => moisMap[k].bloc),
              borderColor:'#9CA3AF', backgroundColor:'rgba(156,163,175,.1)',
              fill:true, tension:.55, pointRadius:5, borderWidth:2.5,
              pointBackgroundColor:'#9CA3AF', pointBorderColor:'#fff', pointBorderWidth:2.5,
              pointHoverRadius:7, hoverBorderWidth:3, cubicInterpolationMode:'monotone' },
          ],
        },
        options:{
          responsive:true, maintainAspectRatio:false,
          plugins:{
            filler:{ propagate:true },
            legend:{
              position:'top',
              labels:{
                color:'#0B1E3D', font:{size:12,weight:'600'}, usePointStyle:true, boxWidth:12,
                padding:14, fontFamily:"'DM Sans',sans-serif",
              }
            },
            tooltip:{
              mode:'index', intersect:false, padding:14, borderRadius:10,
              backgroundColor:'rgba(11,30,61,.95)', titleColor:'#fff', bodyColor:'rgba(255,255,255,.9)',
              callbacks:{
                label: ctx => ` ${ctx.dataset.label}: ${ctx.raw} passage${ctx.raw!==1?'s':''}`,
              }
            }
          },
          scales: {
            x:{ grid:{display:false}, ticks:{color:TXT,font:{size:11,weight:'600'}}, border:{color:AXIS,lineWidth:1.2} },
            y:{ grid:{color:GRID,lineWidth:1.2}, ticks:{color:TXT,font:{size:11,weight:'600'},precision:0}, border:{color:AXIS,lineWidth:1.2} },
          },
        },
      });
    }



    /* Chart 3 – Scores moyens (radar / barres horizontales) */
    if (scoreRef.current) {
      scoreChart.current = new Chart(scoreRef.current, {
        type:'bar',
        data:{
          labels:[
            t('expert.dashboard.charts.scoreTheoAvg'),
            t('expert.dashboard.charts.scorePratAvg'),
            t('expert.dashboard.charts.successRate'),
          ],
          datasets:[{
            data:[scoreTheoMoyen, scorePratMoyen, tauxReussite],
            backgroundColor:['rgba(37,99,235,.75)','rgba(5,150,105,.75)','rgba(200,152,42,.75)'],
            borderRadius:6,
          }],
        },
        options:{
          indexAxis:'y', responsive:true, maintainAspectRatio:false,
          plugins:{ legend:{display:false} },
          scales:{
            x:{ min:0, max:100, grid:{color:GRID}, ticks:{color:TXT,font:{size:11,weight:'600'},callback:v=>`${v}%`}, border:{color:AXIS} },
            y:{ grid:{display:false}, ticks:{color:TXT,font:{size:11,weight:'600'}}, border:{color:AXIS} },
          },
        },
      });
    }

    /* Chart 4 – Planifications (doughnut) */
    if (planifRef.current) {
      const pl = [
        { label:t('expert.dashboard.charts.planifCompleted'), v:totalPlanifTermines, c:'#059669' },
        { label:t('expert.dashboard.charts.planifLate'), v:totalRetard, c:'#DC2626' },
        { label:t('expert.dashboard.charts.planifRemaining'), v:Math.max((totalPlanifAudits-totalPlanifTermines-totalRetard),0), c:'#CBD5E1' },
      ].filter(d => d.v > 0);
      if (pl.length === 0) pl.push({ label:t('expert.dashboard.charts.planifNone'), v:1, c:'#E2E8F0' });
      planifChart.current = new Chart(planifRef.current, {
        type:'doughnut',
        data:{
          labels: pl.map(d => d.label),
          datasets:[{ data:pl.map(d => d.v), backgroundColor:pl.map(d => d.c), borderWidth:2, borderColor:'#fff', hoverOffset:6 }],
        },
        options:{
          responsive:true, maintainAspectRatio:false, cutout:'62%',
          plugins:{ legend:{display:false}, tooltip:{callbacks:{label:ctx=>` ${ctx.label}: ${ctx.raw}`}} },
        },
      });
    }
  }, [loading, moisKeys, totalAudits, scoreTheoMoyen, scorePratMoyen, tauxReussite, totalPlanifTermines, totalRetard, totalPlanifAudits, t, auditsPlanif, auditsEnCours, auditsTermines, auditsRetard, moisMap]);

  /* ══ 4 GRAPHES SUPPLÉMENTAIRES (du chef) ══════════════════════ */
  useEffect(() => {
    if (loading) return;
    
    // Destroy previous charts
    if (repartitionChartRef.current) repartitionChartRef.current.destroy();
    if (statutChartRef.current) statutChartRef.current.destroy();
    if (qkChartRef.current) qkChartRef.current.destroy();
    if (pdcaChartRef.current) pdcaChartRef.current.destroy();
    
    const GRID = 'rgba(15,23,42,.14)';
    const AXIS = 'rgba(15,23,42,.28)';
    const TXT = '#1E293B';
    const BI_COLORS = {
      produit: '#1D4ED8', export: '#7C3AED', regles: '#F97316',
      planifie: '#FBBF24', enCours: '#2563EB', termine: '#10B981', retard: '#EF4444',
    };

    const countByStatut = (items, statutList) => items.filter(a => statutList.includes(String(a?.statut || '').toUpperCase())).length;
    const getQkBucket = (audit) => {
      const rawValue = audit?.valeurQK ?? audit?.valeurQkExtraite ?? audit?.qk;
      const couleur = String(audit?.couleurQK || '').toUpperCase();
      if (couleur) return couleur;
      const value = rawValue != null && rawValue !== '' ? Number(rawValue) : NaN;
      if (Number.isNaN(value)) return null;
      if (value === 0) return 'VERT';
      if (value <= 1) return 'ORANGE';
      if (value <= 2) return 'ROSE';
      return 'ROUGE';
    };

    const productForQk = qkAuditsBI.length > 0 ? qkAuditsBI : auditsProduitBI;

    // Chart 1: Répartition des audits (Produit/Export/Règles)
    if (repartitionRef.current && allAuditsBI.length > 0) {
      const auditTypes = ['Produit', 'Export', 'Règles plates'];
      const typeCounts = [auditsProduitBI.length, auditsExportBI.length, auditsRegleBI.length];
      repartitionChartRef.current = new Chart(repartitionRef.current, {
        type: 'doughnut',
        data: {
          labels: auditTypes,
          datasets: [{
            data: typeCounts,
            backgroundColor: [BI_COLORS.produit, BI_COLORS.export, BI_COLORS.regles],
            borderColor: '#fff',
            borderWidth: 2.5,
          }],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          cutout: '65%',
          plugins: {
            legend: { position: 'bottom', labels: { font: { size: 11, weight: '600' }, color: TXT, padding: 12, usePointStyle: true, boxWidth: 10 } },
            tooltip: { backgroundColor: 'rgba(11,30,61,.95)', padding: 10, borderRadius: 8, titleFont: { size: 13, weight: '700' }, bodyFont: { size: 12 }, displayColors: true, callbacks: { label: (c) => `${c.label}: ${c.raw ?? c.parsed ?? 0}` } },
          },
        },
      });
    }

    // Chart 2: Statut des audits (Bar chart horizontal)
    if (statutRef.current && allAuditsBI.length > 0) {
      const statutData = [
        countByStatut(allAuditsBI, ['PLANIFIE']),
        countByStatut(allAuditsBI, ['EN_COURS']),
        countByStatut(allAuditsBI, ['TERMINE', 'TERMINEE', 'CLOTURE', 'CLOTUREE', 'VALIDE']),
        countByStatut(allAuditsBI, ['EN_RETARD']),
      ];
      statutChartRef.current = new Chart(statutRef.current, {
        type: 'bar',
        data: {
          labels: ['Planifié', 'En cours', 'Terminé', 'Retard'],
          datasets: [{
            label: 'Nombre d\'audits',
            data: statutData,
            backgroundColor: [BI_COLORS.planifie, BI_COLORS.enCours, BI_COLORS.termine, BI_COLORS.retard],
            borderColor: [BI_COLORS.planifie, BI_COLORS.enCours, BI_COLORS.termine, BI_COLORS.retard],
            borderWidth: 2,
            borderRadius: 6,
            barThickness: 28,
          }],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: { backgroundColor: 'rgba(11,30,61,.95)', padding: 10, borderRadius: 8, titleFont: { size: 13, weight: '700' }, bodyFont: { size: 12 }, callbacks: { label: (c) => `${c.label}: ${c.raw ?? c.parsed ?? 0}` } },
          },
          scales: {
            x: { grid: { display: false }, ticks: { color: TXT, font: { size: 11, weight: '600' } }, border: { color: AXIS } },
            y: { grid: { color: GRID, lineWidth: 1.2 }, ticks: { color: TXT, font: { size: 11, weight: '600' }, precision: 0 }, border: { color: AXIS } },
          },
        },
      });
    }

    // Chart 3: Distribution QK
    if (qkRef.current && productForQk.length > 0) {
      const qkValues = productForQk
        .map(a => getQkBucket(a))
        .filter(Boolean);
      const qkCounts = [
        qkValues.filter(v => v === 'VERT').length,
        qkValues.filter(v => v === 'ORANGE').length,
        qkValues.filter(v => v === 'ROSE').length,
        qkValues.filter(v => v === 'ROUGE').length,
      ];
      qkChartRef.current = new Chart(qkRef.current, {
        type: 'polarArea',
        data: {
          labels: ['Conforme', 'Non-conformité', 'Corrective', 'Critique'],
          datasets: [{
            data: qkCounts,
            backgroundColor: ['rgba(16,185,129,.72)', 'rgba(251,191,36,.72)', 'rgba(249,115,22,.72)', 'rgba(239,68,68,.72)'],
            borderColor: ['#10B981', '#FBBF24', '#F97316', '#EF4444'],
            borderWidth: 1.5,
          }],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: 'bottom', labels: { font: { size: 11, weight: '600' }, color: TXT, padding: 12, usePointStyle: true, boxWidth: 10 } },
            tooltip: { backgroundColor: 'rgba(11,30,61,.95)', padding: 10, borderRadius: 8, titleFont: { size: 13, weight: '700' }, bodyFont: { size: 12 }, callbacks: { label: (c) => ` ${c.label}: ${c.raw ?? c.parsed ?? 0}` } },
          },
          scales: { r: { grid: { color: AXIS, lineWidth: 1.4 }, angleLines: { color: AXIS, lineWidth: 1.2 }, ticks: { display: false }, pointLabels: { color: TXT, font: { size: 10, weight: '700' } } } },
        },
      });
    }

    // Chart 4: Fiches réparation & PDCA
    if (pdcaRef.current) {
      const fichesEnAttente = fichesAttente.length;
      const fichesValidees = ficheValideeCount;
      const pdcasRequis = productForQk.filter(a => {
        const bucket = getQkBucket(a);
        return bucket === 'ORANGE' || bucket === 'ROSE' || bucket === 'ROUGE';
      }).length;
      const pdcasValides = pdcaValideeCount;
      pdcaChartRef.current = new Chart(pdcaRef.current, {
        type: 'radar',
        data: {
          labels: ['En attente', 'Fiches validées', 'PDCA requis', 'PDCA validés'],
          datasets: [{
            label: 'Suivi des fiches',
            data: [fichesEnAttente, fichesValidees, pdcasRequis, pdcasValides],
            borderColor: '#1D4ED8',
            backgroundColor: 'rgba(37,99,235,.18)',
            pointBackgroundColor: '#1D4ED8',
            pointRadius: 3,
            borderWidth: 2,
          }],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: 'bottom', labels: { font: { size: 11, weight: '600' }, color: TXT, padding: 12, usePointStyle: true, boxWidth: 10 } },
            tooltip: { backgroundColor: 'rgba(11,30,61,.95)', padding: 10, borderRadius: 8, titleFont: { size: 13, weight: '700' }, bodyFont: { size: 12 }, callbacks: { label: (c) => `${c.label}: ${c.raw ?? c.parsed ?? 0}` } },
          },
          scales: {
            r: { grid: { color: AXIS, lineWidth: 1.4 }, angleLines: { color: AXIS, lineWidth: 1.2 }, pointLabels: { color: TXT, font: { size: 10, weight: '600' } }, ticks: { backdropColor: 'transparent', color: '#64748B', precision: 0 } },
          },
        },
      });
    }

    return () => {
      if (repartitionChartRef.current) repartitionChartRef.current.destroy();
      if (statutChartRef.current) statutChartRef.current.destroy();
      if (qkChartRef.current) qkChartRef.current.destroy();
      if (pdcaChartRef.current) pdcaChartRef.current.destroy();
    };
  }, [loading, audits, auditsRegle, auditsExport, fichesAttente, qkAuditsBI, ficheValideeCount, pdcaValideeCount, auditsProduitBI, allAuditsBI]);

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'55vh', gap:14, color:'#4B5563', fontFamily:"'DM Sans',sans-serif" }}>
      <span style={{ width:28, height:28, border:'3px solid #8A9BBC', borderTopColor:'#0057B8', borderRadius:'50%', animation:'spin .8s linear infinite', display:'inline-block' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      {t('expert.dashboard.loading')}
    </div>
  );

  /* ══ RENDER ══════════════════════════════════════════════════ */
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'1.1rem', fontFamily:"'DM Sans',sans-serif" }}>
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
      `}</style>

      {/* ══ HERO ══════════════════════════════════════════════════ */}
      <div style={{
        background:'linear-gradient(135deg,#0070BB 0%,#0D2B54 55%,#0070BB 100%)',
        borderRadius:16, padding:'1.2rem 1.8rem',
        display:'grid', gridTemplateColumns:'1fr auto',
        alignItems:'center', gap:'1.5rem',
        position:'relative', overflow:'hidden',
        boxShadow:'0 4px 20px rgba(11,30,61,.2)',
        animation:'fade .4s ease', marginTop:-10,
      }}>
        {/* déco */}
        <div style={{ position:'absolute', right:'-5%', top:'-30%', width:220, height:220, background:'rgba(255,255,255,.03)', borderRadius:'50%' }}/>
        <div style={{ position:'absolute', right:'12%', bottom:'-40%', width:130, height:130, border:'2px solid rgba(255,255,255,.05)', borderRadius:'50%' }}/>

        <div style={{ position:'relative', zIndex:1 }}>
          
          <h1 style={{ margin:'0 0 8px', fontSize:'1.5rem', fontWeight:900, color:'#fff', letterSpacing:'-.02em', fontFamily:"'Rajdhani',sans-serif" }}>
            {t('expert.dashboard.hero.greeting')} <span style={{ color:'#FCD34D' }}>{user?.prenom} {user?.nom}</span>
          </h1>
          <div style={{ marginTop:6, color:'#E5E7EB', fontSize:'.78rem', fontWeight:400, opacity:0.9 }}>
            Gérer les qualifications, suivre les passages, analyser les performances et piloter les audits.
          </div>
        </div>

        {/* Boutons hero */}
        <div style={{ position:'relative', zIndex:1, display:'flex', flexDirection:'column', gap:8 }}>
          {rapportsAValider.length > 0 && (
            <button onClick={() => navigate('/expert/certif?tab=en_cours')} className="act-btn"
              style={{ display:'flex', alignItems:'center', gap:6, background:'rgba(5,150,105,.2)',
                color:'#4ADE80', border:'1px solid rgba(5,150,105,.4)', borderRadius:10,
                padding:'9px 14px', cursor:'pointer', fontFamily:'inherit', fontSize:'.78rem',
                fontWeight:700, whiteSpace:'nowrap' }}>
              {IC.bell} {plural('expert.dashboard.hero.actions.reportsToGrade', rapportsAValider.length)}
            </button>
          )}
          {certifsAGenerer.length > 0 && (
            <button onClick={() => navigate('/expert/certif?tab=rapport_valide')} className="act-btn"
              style={{ display:'flex', alignItems:'center', gap:6, background:'rgba(37,99,235,.2)',
                color:'#93C5FD', border:'1px solid rgba(37,99,235,.4)', borderRadius:10,
                padding:'9px 14px', cursor:'pointer', fontFamily:'inherit', fontSize:'.78rem',
                fontWeight:700, whiteSpace:'nowrap' }}>
              {IC.certif} {plural('expert.dashboard.hero.actions.certificatesToGenerate', certifsAGenerer.length)}
            </button>
          )}
        </div>
      </div>

      {/* ══ ALERTES ════════════════════════════════════════════════ */}
      {(certifBientot.length > 0 || auditsRetard > 0) && (
        <div style={{ display:'flex', flexDirection:'column', gap:8, animation:'up .4s .05s ease both' }}>
          {certifBientot.length > 0 && (
            <div style={{ background:'#FFFBEB', border:'1px solid #FDE68A', borderRadius:12,
              padding:'.7rem 1.2rem', display:'flex', alignItems:'center', gap:10 }}>
              {IC.warn}
              <span style={{ flex:1, fontSize:'.82rem', fontWeight:700, color:'#92400E' }}>
                {plural('expert.dashboard.alerts.expiringQualifications', certifBientot.length)}
              </span>
              <button onClick={() => navigate('/expert/certif')} className="act-btn"
                style={{ background:'#D97706', border:'none', borderRadius:7, padding:'5px 11px',
                  color:'#fff', fontWeight:700, fontSize:'.76rem', cursor:'pointer', fontFamily:'inherit' }}>
                {t('expert.dashboard.alerts.manage')} {IC.arrow}
              </button>
            </div>
          )}
        </div>
      )}

      {/* ══ KPI LIGNE 1 — Certifications ══════════════════════════ */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:'.85rem', animation:'up .4s .05s ease both' }}>
        <KpiCard icon={IC.shield}   label={t('expert.dashboard.kpis.qualifications')}      value={certifConfirmees.length} sub={plural('expert.dashboard.kpis.activeSub', certifActives.length)}             accent='#0B1E3D' delay={0} onClick={() => navigate('/expert/certif')} />
        <KpiCard icon={IC.award}    label={t('expert.dashboard.kpis.certifiedAuditors')}    value={certifies.length}         sub={t('expert.dashboard.kpis.certifiedAuditorsSub', { count: totalPassages })}   accent='#059669' delay={1} onClick={() => navigate('/expert/certif?tab=certifiees')} />
        <KpiCard icon={IC.users}    label={t('expert.dashboard.kpis.inExam')}               value={enCoursCertif.length}     sub={t('expert.dashboard.kpis.inExamSub', { count: enAttente.length })}           accent='#2563EB' delay={2} onClick={() => navigate('/expert/certif?tab=en_cours')} />
        <KpiCard icon={IC.lock}     label={t('expert.dashboard.kpis.blockedAuditors')}      value={bloques.length}           sub={t('expert.dashboard.kpis.blockedAuditorsSub')}                                accent='#6B7280' delay={3} onClick={() => navigate('/expert/certif?tab=bloques')} />
        <KpiCard icon={IC.book}     label={t('expert.dashboard.kpis.theoreticalTests')}     value={testsTheo.length}         sub={t('expert.dashboard.kpis.theoreticalTestsSub', { count: totalQuestions })}   accent='#7C3AED' delay={4} onClick={() => navigate('/expert/certif?tab=theoriques')} />
      </div>

      {/* ══ KPI LIGNE 2 — Audits & Planifications ════════════════ */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:'.85rem', animation:'up .4s .1s ease both' }}>
        <KpiCard icon={IC.tool}     label={t('expert.dashboard.kpis.productAudits')}   value={totalAudits}           sub={t('expert.dashboard.kpis.productAuditsSub', { count: auditsTermines })}           accent='#0D9488' delay={0} onClick={() => navigate('/expert/audits')} />
        <KpiCard icon={IC.check}    label={t('expert.dashboard.kpis.completedAudits')} value={auditsTermines}        sub={t('expert.dashboard.kpis.completedAuditsSub', { rate: totalAudits > 0 ? Math.round(auditsTermines / totalAudits * 100) : 0 })} accent='#059669' delay={1} />
        <KpiCard icon={IC.warn}     label={t('expert.dashboard.kpis.lateAudits')}      value={auditsRetard}          sub={auditsRetard > 0 ? t('expert.dashboard.kpis.lateAuditsSubAction') : t('expert.dashboard.kpis.lateAuditsSubOk')} accent={auditsRetard>0?'#DC2626':'#6B7280'} delay={2} onClick={auditsRetard>0?()=>navigate('/expert/audits?statut=EN_RETARD'):undefined} />
        <KpiCard icon={IC.cal}      label={t('expert.dashboard.kpis.planifications')} value={planifications.length} sub={t('expert.dashboard.kpis.planificationsSub', { count: planifEnCours })}           accent='#C8982A' delay={3} onClick={() => navigate('/expert/mes-planifications')} />
        <KpiCard icon={IC.activity} label={t('expert.dashboard.kpis.completionRate')} value={completionPct}         sub={t('expert.dashboard.kpis.completionRateSub', { done: totalPlanifTermines, total: totalPlanifAudits })} accent='#1D4ED8' delay={4} />
      </div>

      {/* ══ GRAPHES PRINCIPAUX ════════════════════════════════════ */}
     {/* ══ ÉVOLUTION DES PASSAGES + CARTE CLASSEMENT ═════════════════ */}
<div style={{ display:'grid', gridTemplateColumns:'1fr', gap:'1rem', animation:'up .4s .15s ease both' }}>
  
  {/* Graphique Évolution des passages */}
  <div style={cardStyle}>
    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'1rem' }}>
      <SectionTitle icon={IC.activity} title={t('expert.dashboard.sections.passagesEvolution')} sub={t('expert.dashboard.sections.lastSixMonths')} />
      <div style={{ display:'flex', gap:12, fontSize:'.66rem', fontWeight:700, color:'#1E293B', flexShrink:0 }}>
        {[
          ['#059669', t('expert.dashboard.charts.certified')],
          ['#DC2626', t('expert.dashboard.charts.failed')],
          ['#6B7280', t('expert.dashboard.charts.blocked')],
        ].map(([c,l]) => (
          <span key={l} style={{ display:'flex', alignItems:'center', gap:4 }}>
            <span style={{ width:14, height:3, background:c, display:'inline-block', borderRadius:2 }} />{l}
          </span>
        ))}
      </div>
    </div>
    <div style={{ position:'relative', height:220 }}>
      {moisKeys.length > 0 ? <canvas ref={passageRef}/> : <div style={{ height:'100%', display:'flex', alignItems:'center', justifyContent:'center', color:'#CBD5E1', fontSize:'.85rem', fontWeight:600 }}>{t('expert.dashboard.charts.noData')}</div>}
    </div>
  </div>

  {/* Nouvelle Carte : Classement des Auditeurs */}
  <div 
    onClick={() => navigate('/expert/classement-auditeurs')}
    className="act-btn cursor-pointer"
    style={{
      background: 'linear-gradient(135deg,#C1E8FF,#94A3B8)',
      color: '#0B1E3D',
      borderRadius: 12,
      padding: '0.9rem 1rem',
      display: 'flex',
      alignItems: 'center',
      gap: '1rem',
      boxShadow: '0 6px 18px rgba(11,30,61,0.08)',
      transition: 'all 0.24s ease',
      minHeight: 56,
    }}
  >
    <div style={{ fontSize: '2.4rem', lineHeight: 1 }}>🏆</div>
    <div style={{ flex: 1 }}>
      <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800 }}>Classement des Auditeurs</h3>
      <p style={{ margin: '6px 0 0', opacity: 0.9, fontSize: '0.85rem', marginBottom: 0 }}>
        Voir le podium, scores composites et performance détaillée
      </p>
    </div>
    <div style={{ fontSize: '1.6rem', opacity: 0.8 }}>→</div>
  </div>

</div>

      {/* ══ SCORES + PLANIFS ══════════════════════════════════════ */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem', animation:'up .4s .2s ease both' }}>

        {/* Scores moyens */}
        <div style={cardStyle}>
          <SectionTitle icon={IC.percent} title={t('expert.dashboard.sections.scoresRates')} sub={t('expert.dashboard.sections.overallPerformance')} />
          <div style={{ position:'relative', height:160, marginBottom:'1rem' }}>
            <canvas ref={scoreRef}/>
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
            {[
              { l:t('expert.dashboard.charts.scoreTheoAvg'),  v:`${scoreTheoMoyen}%`,  c:'#2563EB' },
              { l:t('expert.dashboard.charts.scorePratAvg'),  v:`${scorePratMoyen}%`,  c:'#059669' },
              { l:t('expert.dashboard.charts.successRate'),   v:`${tauxReussite}%`,    c:'#C8982A' },
            ].map(m => (
              <div key={m.l} style={{ display:'flex', justifyContent:'space-between', padding:'4px 0', borderTop:'1px solid #F0F4FA' }}>
                <span style={{ fontSize:'.72rem', color:'#4B5563' }}>{m.l}</span>
                <span style={{ fontSize:'.84rem', fontWeight:900, color:m.c, fontFamily:"'Rajdhani',sans-serif" }}>{m.v}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Planifications donut */}
        <div style={cardStyle}>
          <SectionTitle icon={IC.pie} title={t('expert.dashboard.sections.planifications')} sub={t('expert.dashboard.sections.planificationsSub', { count: planifications.length })} action={t('expert.dashboard.sections.manage')} onAction={() => navigate('/expert/mes-planifications')} />
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem', alignItems:'center' }}>
            <div style={{ position:'relative', height:170 }}>
              <canvas ref={planifRef}/>
              <div style={{ position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)', textAlign:'center', pointerEvents:'none' }}>
                <div style={{ fontFamily:"'Rajdhani',sans-serif", fontSize:'1.5rem', fontWeight:900, color:'#0B1E3D', lineHeight:1 }}>{completionPct}%</div>
                <div style={{ fontSize:'.6rem', color:'#94A3B8', fontWeight:700 }}>{t('expert.dashboard.charts.completionLabel')}</div>
              </div>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {[
                { l:t('expert.dashboard.planifTotals.totalPlanifs'),  v:planifications.length,    c:'#0B1E3D' },
                { l:t('expert.dashboard.planifTotals.inProgress'),   v:planifEnCours,            c:'#2563EB' },
                { l:t('expert.dashboard.planifTotals.auditsTotal'),  v:totalPlanifAudits,        c:'#64748B' },
                { l:t('expert.dashboard.planifTotals.completed'),    v:totalPlanifTermines,      c:'#059669' },
                { l:t('expert.dashboard.planifTotals.late'),         v:totalRetard,              c:'#DC2626' },
              ].map(m => (
                <div key={m.l} style={{ display:'flex', justifyContent:'space-between', padding:'4px 0', borderTop:'1px solid #F0F4FA' }}>
                  <span style={{ fontSize:'.72rem', color:'#4B5563' }}>{m.l}</span>
                  <span style={{ fontFamily:"'Rajdhani',sans-serif", fontWeight:900, color:m.c, fontSize:'.88rem' }}>{m.v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ══ SANTÉ + DERNIERS PASSAGES ═════════════════════════════ */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 2fr', gap:'1rem', animation:'up .4s .3s ease both' }}>

        {/* Santé certifications */}
        <div style={{ background:'#1a3a6b', borderRadius:14, padding:'1.1rem 1.3rem',
          boxShadow:'0 4px 18px rgba(11,30,61,.25)', border:'1.5px solid #2a4a8b' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'.9rem' }}>
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <div style={{ width:28, height:28, borderRadius:8, background:'rgba(255,255,255,.15)',
                color:'#fff', display:'flex', alignItems:'center', justifyContent:'center' }}>{IC.shield}</div>
              <div>
                <h3 style={{ margin:0, fontSize:'.83rem', fontWeight:800, color:'#fff' }}>{t('expert.dashboard.health.title')}</h3>
                <p style={{ margin:0, fontSize:'.67rem', color:'rgba(255,255,255,.6)' }}>{t('expert.dashboard.health.subtitle')}</p>
              </div>
            </div>
            <span style={{ display:'flex', alignItems:'center', gap:5 }}>
              <span style={{ width:6, height:6, borderRadius:'50%', background:'#4ADE80', animation:'pulse 2s infinite', display:'inline-block' }} />
              <span style={{ fontSize:'.66rem', color:'#4ADE80', fontWeight:700 }}>{t('expert.dashboard.health.active')}</span>
            </span>
          </div>
          <HealthGauge pct={tauxReussite} />
          <p style={{ textAlign:'center', margin:'0 0 .7rem', color:'rgba(255,255,255,.65)', fontSize:'.67rem' }}>
            {t('expert.dashboard.health.successRateGlobal')}
          </p>
          {[
            { l:t('expert.dashboard.health.items.confirmedQualifications'), v:certifConfirmees.length, c:'#93C5FD' },
            { l:t('expert.dashboard.health.items.activeQualifications'),    v:certifActives.length,    c:'#4ADE80' },
            { l:t('expert.dashboard.health.items.drafts'),                  v:brouillons.length,       c:'#FCD34D' },
            { l:t('expert.dashboard.health.items.reportsToValidate'),       v:rapportsAValider.length, c:'#FDA4AF' },
            { l:t('expert.dashboard.health.items.certificatesToGenerate'),  v:certifsAGenerer.length,  c:'#C4B5FD' },
            { l:t('expert.dashboard.health.items.blockedAuditors'),         v:bloques.length,          c:'#F87171' },
            { l:t('expert.dashboard.health.items.theoreticalTests'),        v:testsTheo.length,        c:'#A5B4FC' },
            { l:t('expert.dashboard.health.items.practicalTests'),          v:testsPrat.length,        c:'#86EFAC' },
          ].map((m,i) => (
            <div key={i} style={{ display:'flex', justifyContent:'space-between', padding:'5px 0', borderTop:'1px solid rgba(255,255,255,.1)' }}>
              <span style={{ fontSize:'.71rem', color:'rgba(255,255,255,.7)' }}>{m.l}</span>
              <span style={{ fontFamily:"'Rajdhani',sans-serif", fontSize:'.82rem', fontWeight:800, color:m.c }}>{m.v}</span>
            </div>
          ))}
        </div>

        {/* Derniers passages */}
        <div style={cardStyle}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'1rem' }}>
            <SectionTitle icon={IC.list} title={t('expert.dashboard.latest.title')} sub={t('expert.dashboard.latest.sub', { count: derniersPassages.length })} />
            <button onClick={() => navigate('/expert/certif?tab=en_cours')}
              style={{ background:'#EEF2F8', border:'1.5px solid #8A9BBC', borderRadius:8,
                padding:'3px 9px', fontSize:'.69rem', fontWeight:700, color:'#1D4ED8',
                cursor:'pointer', display:'flex', alignItems:'center', gap:3,
                fontFamily:'inherit', marginTop:'-1rem' }}>
              {t('expert.dashboard.latest.viewAll')} {IC.arrow}
            </button>
          </div>
          {derniersPassages.length === 0 ? (
            <p style={{ color:'#94A3B8', fontSize:'.84rem', textAlign:'center', padding:'2rem 0' }}>{t('expert.dashboard.latest.none')}</p>
          ) : (
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:4 }}>
              {derniersPassages.map((p,i) => (
                <div key={p.id||i} className="row-h" style={{ display:'flex', alignItems:'center', gap:8, padding:'7px 8px' }}>
                  <div style={{ width:32, height:32, borderRadius:9, background:'#0B1E3D', color:'#fff',
                    display:'flex', alignItems:'center', justifyContent:'center',
                    fontSize:'.72rem', fontWeight:800, flexShrink:0, fontFamily:"'Rajdhani',sans-serif" }}>
                    {(p.auditeurNom||'?').charAt(0).toUpperCase()}
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <p style={{ margin:0, fontSize:'.79rem', fontWeight:700, color:'#0B1E3D',
                      whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
                      {p.auditeurNom||'—'}
                    </p>
                    <p style={{ margin:0, fontSize:'.67rem', color:'#4B5563' }}>
                      {p.auditeurMatricule||'—'} · {fmt(p.dateDebut, locale)}
                    </p>
                  </div>
                  <PassageBadge statut={p.statut} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ══ TABLE PLANIFICATIONS ══════════════════════════════════ */}
      {/* ══ 4 GRAPHES SUPPLÉMENTAIRES (Chef) ═════════════════════ */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem', animation:'up .4s .25s ease both' }}>
        {/* Chart 1: Répartition des audits */}
        <div style={cardStyle}>
          <SectionTitle icon={IC.pie} title="Répartition des audits" sub="Produit vs Export vs Règles plates" />
          <div style={{ position:'relative', height:200 }}>
            {allAuditsBI.length > 0 ? <canvas ref={repartitionRef}/> : <div style={{ height:'100%', display:'flex', alignItems:'center', justifyContent:'center', color:'#CBD5E1', fontSize:'.85rem', fontWeight:600 }}>Aucun audit</div>}
          </div>
        </div>

        {/* Chart 2: Statut des audits */}
        <div style={cardStyle}>
          <SectionTitle icon={IC.chart} title="Statut des audits" sub="Planifié, en cours, terminé, retard" />
          <div style={{ position:'relative', height:200 }}>
            {allAuditsBI.length > 0 ? <canvas ref={statutRef}/> : <div style={{ height:'100%', display:'flex', alignItems:'center', justifyContent:'center', color:'#CBD5E1', fontSize:'.85rem', fontWeight:600 }}>Aucun audit</div>}
          </div>
        </div>
      </div>

      {/* ══ 4 GRAPHES SUITE ═══════════════════════════════════════ */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem', animation:'up .4s .3s ease both' }}>
        {/* Chart 3: Distribution QK */}
        <div style={cardStyle}>
          <SectionTitle icon={IC.target} title="Distribution QK (audit produit)" sub="Conforme, non-conformité, corrective, critique" />
          <div style={{ position:'relative', height:200 }}>
            {auditsProduitBI.length > 0 ? <canvas ref={qkRef}/> : <div style={{ height:'100%', display:'flex', alignItems:'center', justifyContent:'center', color:'#CBD5E1', fontSize:'.85rem', fontWeight:600 }}>Aucun audit produit</div>}
          </div>
        </div>

        {/* Chart 4: Fiches réparation & PDCA */}
        <div style={cardStyle}>
          <SectionTitle icon={IC.tool} title="Fiches réparation & PDCA" sub="Suivi des actions correctives" />
          <div style={{ position:'relative', height:200 }}>
            <canvas ref={pdcaRef}/>
          </div>
        </div>
      </div>

      {/* ══ TABLE PLANIFICATIONS ══════════════════════════════════ */}
      {planifications.length > 0 && (
        <div style={{ ...cardStyle, animation:'up .4s .35s ease both' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'1rem' }}>
            <div>
              <h3 style={{ margin:0, fontSize:'.95rem', fontWeight:800, color:'#0B1E3D' }}>{t('expert.dashboard.planifs.title')}</h3>
              <p style={{ margin:'2px 0 0', fontSize:'.8rem', color:'#013d91' }}>{t('expert.dashboard.planifs.subtitle')}</p>
            </div>
            <span style={{ background:'#BFDBFE', color:'#1E40AF', fontSize:'.69rem', fontWeight:700,
              padding:'3px 10px', borderRadius:99, border:'1.5px solid #93C5FD' }}>
              {plural('expert.dashboard.planifs.count', planifications.length)}
            </span>
          </div>
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse', minWidth:700 }}>
              <thead>
                <tr style={{ background:'#D5DCE8' }}>
                  {[t('audit.planification'), t('commun.statut'), t('commun.total'), t('commun.termines'), t('commun.enRetard'), t('expert.dashboard.planifs.progress')].map((h, idx) => (
                    <th key={h + '-' + idx} style={{ padding:'8px 10px', fontSize:'.63rem', fontWeight:700,
                      textTransform:'uppercase', letterSpacing:'.06em', color:'#1E293B',
                      textAlign:idx === 0 ? 'left' : 'center',
                      borderBottom:'2px solid #8A9BBC', whiteSpace:'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {planifications.slice(0,6).map((p,i) => {
                  const pct = p.nombreAuditsTotal ? Math.round((p.nombreAuditsTermines||0)/p.nombreAuditsTotal*100) : 0;
                  const sMap = {
                    EN_COURS:  { l:t('commun.enCours'),  c:'#2563EB', bg:'#EFF6FF' },
                    TERMINEE:  { l:t('expert.dashboard.planifs.status.completed'),  c:'#059669', bg:'#ECFDF5' },
                    BROUILLON: { l:t('commun.brouillon'), c:'#6B7280', bg:'#F3F4F6' },
                    ANNULEE:   { l:t('expert.dashboard.planifs.status.cancelled'),  c:'#DC2626', bg:'#FEF2F2' },
                  };
                  const s = sMap[p.statut] || sMap.EN_COURS;
                  return (
                    <tr key={p.id} className="row-h" style={{ borderBottom:'1px solid #A0AABB' }}>
                      <td style={{ padding:'9px 10px' }}>
                        <div style={{ display:'flex', alignItems:'center', gap:7 }}>
                          <div style={{ width:26, height:26, borderRadius:7,
                            background:'linear-gradient(135deg,#0B1E3D,#1D4ED8)', color:'#fff',
                            display:'flex', alignItems:'center', justifyContent:'center',
                            fontSize:'.7rem', fontWeight:900, flexShrink:0 }}>
                            {(p.nom||'P')[0]}
                          </div>
                          <p style={{ margin:0, fontSize:'.8rem', fontWeight:700, color:'#0B1E3D' }}>{p.nom}</p>
                        </div>
                      </td>
                      <td style={{ padding:'9px 10px', textAlign:'center' }}>
                        <span style={{ background:s.bg, color:s.c, fontSize:'.67rem', fontWeight:700, padding:'2px 8px', borderRadius:99 }}>{s.l}</span>
                      </td>
                      <td style={{ padding:'9px 10px', textAlign:'center', fontWeight:800, color:'#0B1E3D', fontFamily:"'Rajdhani',sans-serif" }}>{p.nombreAuditsTotal||0}</td>
                      <td style={{ padding:'9px 10px', textAlign:'center', fontWeight:800, color:'#059669', fontFamily:"'Rajdhani',sans-serif" }}>{p.nombreAuditsTermines||0}</td>
                      <td style={{ padding:'9px 10px', textAlign:'center', fontWeight:800, color:(p.nombreAuditsEnRetard||0)>0?'#DC2626':'#8A9BBC', fontFamily:"'Rajdhani',sans-serif" }}>{p.nombreAuditsEnRetard||0}</td>
                      <td style={{ padding:'9px 10px', minWidth:140 }}>
                        <div style={{ display:'flex', alignItems:'center', gap:7 }}>
                          <div style={{ flex:1, height:6, background:'#E2E8F0', borderRadius:99, overflow:'hidden' }}>
                            <div style={{ height:'100%', width:`${pct}%`, borderRadius:99, transition:'width .8s ease',
                              background:pct===100?'#059669':pct>50?'#1D4ED8':'#C8982A' }}/>
                          </div>
                          <span style={{ fontFamily:"'Rajdhani',sans-serif", fontWeight:800, fontSize:'.78rem', color:'#0B1E3D', minWidth:32 }}>{pct}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ══ ACTIONS RAPIDES ═══════════════════════════════════════ */}
  {/* ══ ACTIONS RAPIDES ═══════════════════════════════════════ */}
<div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(220px, 1fr))', gap:'.85rem', animation:'up .4s .4s ease both' }}>
    {[
      { icon:IC.shield,  label:t('expert.dashboard.quickActions.qualifications.label'),  sub:t('expert.dashboard.quickActions.qualifications.sub'),  path:'/expert/certif',              color:'#0B1E3D' },
      { icon:IC.tool,    label:t('expert.dashboard.quickActions.productAudits.label'),    sub:t('expert.dashboard.quickActions.productAudits.sub'),    path:'/expert/audits',              color:'#0D9488' },
      { icon:IC.cal,     label:t('expert.dashboard.quickActions.newPlanif.label'),        sub:t('expert.dashboard.quickActions.newPlanif.sub'),        path:'/expert/planification',       color:'#C8982A' },
      { icon:IC.layers,  label:t('expert.dashboard.quickActions.planifications.label'),   sub:t('expert.dashboard.quickActions.planifications.sub'),   path:'/expert/mes-planifications',  color:'#2563EB' },
      { icon:IC.report,  label:t('expert.dashboard.quickActions.practiceReports.label'),  sub:t('expert.dashboard.quickActions.practiceReports.sub'),  path:'/expert/certif?tab=en_cours', color:'#7C3AED' },
    ].map((a,i) => (
      <button key={i} className="act-btn" onClick={() => navigate(a.path)}
        style={{ background:'#EEF0F3', border:'none', borderRadius:12, padding:'.9rem 1.1rem',
          display:'flex', alignItems:'center', gap:10, cursor:'pointer',
          textAlign:'left', boxShadow:CARD_SHD, fontFamily:'inherit' }}>
        <div style={{ width:34, height:34, borderRadius:9, background:a.color+'20',
          color:a.color, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
          {a.icon}
        </div>
        <div style={{ flex:1 }}>
          <p style={{ margin:0, fontSize:'.82rem', fontWeight:800, color:'#0B1E3D' }}>{a.label}</p>
          <p style={{ margin:'1px 0 0', fontSize:'.68rem', color:'#4B5563' }}>{a.sub}</p>
        </div>
        <span style={{ color:'#4B5563' }}>{IC.arrow}</span>
      </button>
    ))}
</div>
    </div>
  );
}