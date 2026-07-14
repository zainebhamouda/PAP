import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { auditeurCertifAPI } from '../../services/certifAPI';
import { auditProduitAPI, auditSpecialAPI } from '../../services/api';
import { Chart, registerables } from 'chart.js';
Chart.register(...registerables);

/* ══════════════════════════════════════════════════════════════
   DESIGN TOKENS
══════════════════════════════════════════════════════════════ */
const T = {
  navy:'#0B1E3D', blue:'#1D4ED8', blueM:'#2563EB', blueL:'#EFF6FF', blueB:'#BFDBFE',
  gold:'#C8982A', goldL:'#FFF4D6',
  g50:'#F8FAFC', g100:'#F1F5F9', g200:'#E2E8F0', g300:'#CBD5E1',
  g400:'#94A3B8', g500:'#64748B', g700:'#1E293B', g800:'#0F172A',
  success:'#059669', successBg:'#ECFDF5', successBd:'#A7F3D0',
  warn:'#D97706',   warnBg:'#FFFBEB',    warnBd:'#FCD34D',
  danger:'#DC2626', dangerBg:'#FEF2F2',  dangerBd:'#FECACA',
  purple:'#7C3AED', purpleBg:'#F5F3FF',
  rose:'#DB2777',
};

const CARD_SHD = '0 2px 10px rgba(11,30,61,.08)';

const fmt = d => {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('fr-FR', { day:'2-digit', month:'short', year:'numeric' });
};

/* ── CountUp ── */
function CountUp({ target, duration = 900, suffix = '' }) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (target === undefined || target === null) return;
    let start = null;
    const step = ts => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / duration, 1);
      const e = p < .5 ? 2 * p * p : -1 + (4 - 2 * p) * p;
      setVal(Math.floor(e * target));
      if (p < 1) requestAnimationFrame(step);
      else setVal(target);
    };
    requestAnimationFrame(step);
  }, [target, duration]);
  return <>{val}{suffix}</>;
}

/* ── Icônes SVG ── */
const Ic = {
  award:   <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/></svg>,
  chart:   <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
  layers:  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>,
  calendar:<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  lock:    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>,
  clock:   <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  play:    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>,
  arrow:   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>,
  check:   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>,
  shield:  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  activity:<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>,
  pie:     <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M21.21 15.89A10 10 0 1 1 8 2.83"/><path d="M22 12A10 10 0 0 0 12 2v10z"/></svg>,
  target:  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>,
  audit:   <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>,
  theo:    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>,
  prat:    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>,
};

/* ── KPI Card ── */
function KpiCard({ icon, label, value, sub, accent, suffix='', delay=0, onClick }) {
  return (
    <div onClick={onClick}
      style={{ background:'#fff', borderRadius:12, padding:'.9rem 1rem', borderLeft:`3px solid ${accent}`, boxShadow:CARD_SHD, cursor:onClick?'pointer':'default', transition:'transform .18s, box-shadow .18s', animationDelay:`${delay}ms` }}
      onMouseEnter={e => { if(onClick){e.currentTarget.style.transform='translateY(-3px)';e.currentTarget.style.boxShadow='0 6px 20px rgba(0,0,0,.13)';} }}
      onMouseLeave={e => { e.currentTarget.style.transform='';e.currentTarget.style.boxShadow=CARD_SHD; }}>
      <div style={{ fontSize:'1.7rem', fontWeight:900, color:T.g800, letterSpacing:'-.04em', lineHeight:1, fontFamily:"'Rajdhani','Inter',sans-serif", marginBottom:6 }}>
        {typeof value === 'number' ? <CountUp target={value} suffix={suffix}/> : value}
      </div>
      <div style={{ display:'flex', alignItems:'center', gap:6 }}>
        <div style={{ width:24, height:24, borderRadius:6, background:`${accent}22`, color:accent, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>{icon}</div>
        <div>
          <div style={{ fontSize:'.75rem', fontWeight:700, color:T.g700, lineHeight:1.2 }}>{label}</div>
          {sub && <div style={{ fontSize:'.66rem', color:T.g400, lineHeight:1.2, marginTop:1 }}>{sub}</div>}
        </div>
      </div>
    </div>
  );
}

/* ── Section Title ── */
function SectionTitle({ icon, title, sub }) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:'1rem' }}>
      <div style={{ width:28, height:28, borderRadius:8, background:T.blueL, color:T.blue, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>{icon}</div>
      <div>
        <h3 style={{ margin:0, fontSize:'.85rem', fontWeight:800, color:T.navy }}>{title}</h3>
        {sub && <p style={{ margin:0, fontSize:'.68rem', color:T.g400 }}>{sub}</p>}
      </div>
    </div>
  );
}

const cardStyle = { 
  background:'#fff', 
  borderRadius:14, 
  padding:'1.1rem 1.3rem', 
  boxShadow:CARD_SHD,
  border: '1px solid #cacaca',  // ✅ BORDURE NOIRE
  transition: 'border-color .2s, box-shadow .2s, transform .2s',
};
const ST_MAP = {
  THEORIQUE_EN_COURS: { label:'Théorique',  color:T.blueM,   bg:T.blueL },
  PRATIQUE_EN_COURS:  { label:'Pratique',   color:T.purple,  bg:T.purpleBg },
  RAPPORT_VALIDE:             { label:'Réussi',     color:T.success, bg:T.successBg },
  CERTIFIE:           { label:'Qualifié',   color:T.success, bg:T.successBg },
  BLOQUE:             { label:'Bloqué',     color:T.danger,  bg:T.dangerBg },
  THEORIQUE_ECHOUE:   { label:'Échoué',     color:T.danger,  bg:T.dangerBg },
  PRATIQUE_ECHOUE:    { label:'Échoué',     color:T.danger,  bg:T.dangerBg },
};

/* ══════════════════════════════════════════════════════════════
   COMPOSANT PRINCIPAL
══════════════════════════════════════════════════════════════ */
export default function AuditeurDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [passage,    setPassage]    = useState(null);
  const [historique, setHistorique] = useState([]);
  const [auditsProduit, setAuditsProduit] = useState([]);
  const [auditsExport, setAuditsExport] = useState([]);
  const [auditsRegle, setAuditsRegle] = useState([]);
  const [auditMeta, setAuditMeta] = useState({
    fichesTotal: 0,
    fichesValidees: 0,
    pdcaTotal: 0,
    pdcaClotures: 0,
  });
  const [loading,    setLoading]    = useState(true);

  const scoreRef  = useRef(null);
  const pieRef    = useRef(null);
  const radRef    = useRef(null);
  const auditTypeRef = useRef(null);
  const auditStatusRef = useRef(null);
  const auditQkRef = useRef(null);
  const auditActionRef = useRef(null);
  const chartInstances = useRef({
    score: null,
    pie: null,
    rad: null,
    auditType: null,
    auditStatus: null,
    auditQk: null,
    auditAction: null,
  });

  useEffect(() => {
    let alive = true;

    const toArray = (v) => {
      if (Array.isArray(v)) return v;
      if (Array.isArray(v?.data)) return v.data;
      if (Array.isArray(v?.data?.content)) return v.data.content;
      if (Array.isArray(v?.content)) return v.content;
      return [];
    };

    const loadAuditMeta = async (produits) => {
      const ids = produits.map(a => a?.id).filter(Boolean);
      if (ids.length === 0) return { fichesTotal: 0, fichesValidees: 0, pdcaTotal: 0, pdcaClotures: 0 };

      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const pdcaStatusesClosed = ['VALIDE', 'VALIDEE', 'CLOTURE', 'CLOTUREE', 'TERMINE', 'TERMINEE'];

      const rows = await Promise.allSettled(ids.map(async (id) => {
        const [fichesRes, pdcaRes] = await Promise.allSettled([
          auditProduitAPI.getFiches(id),
          fetch(`http://localhost:8080/api/audit-produit/${id}/pdca`, { headers }).then(r => r.ok ? r.json() : null),
        ]);

        const fiches = fichesRes.status === 'fulfilled'
          ? (Array.isArray(fichesRes.value?.data) ? fichesRes.value.data : Array.isArray(fichesRes.value) ? fichesRes.value : [])
          : [];

        const pdcaRaw = pdcaRes.status === 'fulfilled' ? pdcaRes.value : null;
        const pdcaList = Array.isArray(pdcaRaw) ? pdcaRaw : pdcaRaw ? [pdcaRaw] : [];

        const fichesValidees = fiches.filter(f => f?.valide === true || String(f?.statut || '').toUpperCase().includes('VALIDE')).length;
        const pdcaClotures = pdcaList.filter(p => pdcaStatusesClosed.includes(String(p?.statut || '').toUpperCase())).length;

        return {
          fichesTotal: fiches.length,
          fichesValidees,
          pdcaTotal: pdcaList.length,
          pdcaClotures,
        };
      }));

      return rows.reduce((acc, r) => {
        if (r.status !== 'fulfilled') return acc;
        acc.fichesTotal += r.value.fichesTotal;
        acc.fichesValidees += r.value.fichesValidees;
        acc.pdcaTotal += r.value.pdcaTotal;
        acc.pdcaClotures += r.value.pdcaClotures;
        return acc;
      }, { fichesTotal: 0, fichesValidees: 0, pdcaTotal: 0, pdcaClotures: 0 });
    };

    const load = async () => {
      try {
        const [enc, hist, prod, exp, reg] = await Promise.all([
          auditeurCertifAPI.getEnCours().catch(() => null),
          auditeurCertifAPI.getHistorique().catch(() => ({ data: [] })),
          auditProduitAPI.getMesAudits().catch(() => ({ data: [] })),
          auditSpecialAPI.mesAuditsExport().catch(() => ({ data: [] })),
          auditSpecialAPI.mesAuditsReglePlates().catch(() => ({ data: [] })),
        ]);

        const p = toArray(prod);
        const e = toArray(exp);
        const r = toArray(reg);
        const meta = await loadAuditMeta(p);

        if (!alive) return;
        setPassage(enc?.data || null);
        setHistorique(Array.isArray(hist?.data) ? hist.data : []);
        setAuditsProduit(p);
        setAuditsExport(e);
        setAuditsRegle(r);
        setAuditMeta(meta);
      } finally {
        if (alive) setLoading(false);
      }
    };

    load();
    const id = setInterval(load, 30000);
    return () => { alive = false; clearInterval(id); };
  }, [user?.id]);

  /* ── Métriques dérivées avec conversion des scores en pourcentage ── */
  const certifReussies  = historique.filter(h => ['RAPPORT_VALIDE','CERTIFIE'].includes(h.statut));
  const certifEchouees  = historique.filter(h => h.statut?.includes('ECHOUE'));
  const certifBloquees  = historique.filter(h => h.statut === 'BLOQUE');
  const totalPassages   = historique.length;

  // Conversion des scores théoriques (sur 20) en pourcentage
  const scoresTheoPct = certifReussies
    .filter(h => h.scoreTheorique != null)
    .map(h => h.scoreTheoriquePct ?? Math.round((h.scoreTheorique / 20) * 100));
  const scoreTheoMoyen = scoresTheoPct.length > 0
    ? Math.round(scoresTheoPct.reduce((a,b) => a+b, 0) / scoresTheoPct.length)
    : 0;

  // Scores pratiques (déjà en pourcentage selon le backend)
  const scoresPratPct = certifReussies
    .filter(h => h.scorePratique != null)
    .map(h => h.scorePratique);
  const scorePratMoyen = scoresPratPct.length > 0
    ? Math.round(scoresPratPct.reduce((a,b) => a+b, 0) / scoresPratPct.length)
    : 0;

  const tauxReussite = totalPassages > 0 ? Math.round((certifReussies.length / totalPassages) * 100) : 0;

  const prochExpir = certifReussies
    .filter(h => h.dateExpiration && new Date(h.dateExpiration) > new Date())
    .sort((a,b) => new Date(a.dateExpiration) - new Date(b.dateExpiration))[0];
  const joursExpir = prochExpir?.joursAvantExpiration ?? (
    prochExpir?.dateExpiration ? Math.ceil((new Date(prochExpir.dateExpiration) - new Date()) / 86400000) : null
  );

  const isEnCours = ['THEORIQUE_EN_COURS','PRATIQUE_EN_COURS'].includes(passage?.statut);
  const isBloque  = passage?.statut === 'BLOQUE';

  // Données pour le graphique d'évolution (score théorique en pourcentage)
  const chartScores = [...certifReussies, ...certifEchouees]
    .sort((a,b) => new Date(a.dateDebut||a.datePassage) - new Date(b.dateDebut||b.datePassage))
    .map(h => {
      const scoreTheoPct = h.scoreTheoriquePct ?? (h.scoreTheorique != null ? Math.round((h.scoreTheorique / 20) * 100) : null);
      const scorePratPct = h.scorePratique != null ? Math.round(h.scorePratique) : null;
      const clientName = h.certificationTitre || h.certificationNom || 'Qualification';
      return {
        id: h.id,
        label: clientName,
        datePassage: fmt(h.dateDebut || h.datePassage),
        scoreTheo: scoreTheoPct,
        scorePrat: scorePratPct,
        seuilTheo: h.seuilTheorique || 70,
        seuilPrat: h.seuilPratique || 70,
        statut: h.statut,
      };
    });

      const getQkCategory = (audit) => {
        const raw = audit?.valeurQK ?? audit?.valeurQkExtraite ?? audit?.qk;
        const num = raw != null && raw !== '' && !Number.isNaN(Number(raw)) ? Number(raw) : null;

        if (num != null) {
          if (num <= 0) return 'conforme';
          if (num <= 1) return 'nonConformite';
          if (num <= 2) return 'corrective';
          return 'critique';
        }

        const c = String(audit?.couleurQK || '').toUpperCase();
        if (c === 'VERT') return 'conforme';
        if (c === 'ORANGE') return 'nonConformite';
        if (c === 'ROSE') return 'corrective';
        if (c === 'ROUGE') return 'critique';
        return 'conforme';
      };

      const qkProduit = auditsProduit.reduce((acc, a) => {
        const category = getQkCategory(a);
        acc[category] += 1;
        return acc;
      }, { conforme: 0, nonConformite: 0, corrective: 0, critique: 0 });

      const totalAuditsOps = auditsProduit.length + auditsExport.length + auditsRegle.length;

      const statusBuckets = {
        PLANIFIE: 0,
        EN_COURS: 0,
        TERMINE: 0,
        EN_RETARD: 0,
        AUTRE: 0,
      };

      [...auditsProduit, ...auditsExport, ...auditsRegle].forEach((a) => {
        const s = String(a?.statut || '').toUpperCase();
        if (s === 'PLANIFIE') statusBuckets.PLANIFIE += 1;
        else if (s === 'EN_COURS') statusBuckets.EN_COURS += 1;
        else if (s === 'TERMINE') statusBuckets.TERMINE += 1;
        else if (s === 'EN_RETARD') statusBuckets.EN_RETARD += 1;
        else statusBuckets.AUTRE += 1;
      });

  /* ── Créer les charts après chargement ── */
  useEffect(() => {
        if (loading) return;

    const GRID = 'rgba(15,23,42,.14)';
    const TXT  = '#1E293B';
    const AXIS = 'rgba(15,23,42,.28)';

        Object.keys(chartInstances.current).forEach((k) => {
          if (chartInstances.current[k]) {
            chartInstances.current[k].destroy();
            chartInstances.current[k] = null;
          }
        });

    if (scoreRef.current && chartScores.length > 0) {
      const scoresWithData = chartScores.filter(d => d.scoreTheo != null || d.scorePrat != null);
      chartInstances.current.score = new Chart(scoreRef.current, {
        type:'bar',
        data:{
          labels: scoresWithData.map(d => d.label),
          datasets:[
            {
              label:'Score théorique',
              data: scoresWithData.map(d => d.scoreTheo),
              backgroundColor: '#93C5FD',
              borderColor: '#3B82F6',
              borderWidth: 1.2,
              borderRadius: 6,
              barThickness: 16,
              categoryPercentage: 0.5,
              barPercentage: 0.75,
            },
            {
              label:'Score pratique',
              data: scoresWithData.map(d => d.scorePrat),
              backgroundColor: '#86EFAC',
              borderColor: '#10B981',
              borderWidth: 1.2,
              borderRadius: 6,
              barThickness: 16,
              categoryPercentage: 0.5,
              barPercentage: 0.75,
            },
          ],
        },
        options:{
          responsive:true, maintainAspectRatio:false, indexAxis: undefined,
          plugins:{
            legend:{ position:'top', labels:{ color:TXT, font:{ size:11, weight:'600' }, usePointStyle:true, boxWidth:10, padding:12 } },
            tooltip:{
              mode:'index', intersect:false, padding:12,
              callbacks:{
                title: ctx => {
                  if(!ctx || !ctx[0]) return '';
                  const idx = ctx[0].dataIndex;
                  const item = scoresWithData[idx];
                  return item ? `${item.label} (${item.datePassage})` : '';
                },
                label: ctx => {
                  const label = ctx.dataset.label || '';
                  const value = ctx.raw != null ? `${ctx.raw}%` : 'N/A';
                  return ` ${label}: ${value}`;
                },
                afterLabel: ctx => {
                  const idx = ctx.dataIndex;
                  const item = scoresWithData[idx];
                  if(!item) return '';
                  const seuilLabel = ctx.dataset.label?.includes('théorique') ? item.seuilTheo : item.seuilPrat;
                  return ` Seuil: ${seuilLabel}%`;
                },
              },
            },
          },
          scales:{
            x:{ grid:{ display:false }, ticks:{ color:TXT, font:{ size:9, weight:'500' }, maxRotation:45, minRotation:0 }, border:{ color:AXIS } },
            y:{ min:0, max:100, grid:{ color:GRID }, ticks:{ color:TXT, font:{ size:11, weight:'600' }, callback: v => `${v}%` }, border:{ color:AXIS } },
          },
        },
      });
    }

    if (pieRef.current) {
      const pieData = [
        { label:'Rapport validé', value: certifReussies.length, color:'#059669' },
        { label:'Échouées', value: certifEchouees.length, color:T.danger },
        { label:'Bloquées', value: certifBloquees.length, color:T.warn },
      ].filter(d => d.value > 0);
      if (pieData.length === 0) pieData.push({ label:'Aucune', value:1, color:T.g200 });

      chartInstances.current.pie = new Chart(pieRef.current, {
        type:'doughnut',
        data:{
          labels: pieData.map(d => d.label),
          datasets:[{ data: pieData.map(d => d.value), backgroundColor: pieData.map(d => d.color), borderWidth:2, borderColor:'#fff', hoverOffset:6 }],
        },
        options:{
          responsive:true, maintainAspectRatio:false, cutout:'65%',
          plugins:{
            legend:{ position:'bottom', labels:{ color:TXT, font:{ size:11, weight:'600' }, usePointStyle:true, boxWidth:10 } },
            tooltip:{ callbacks:{ label: ctx => ` ${ctx.label}: ${ctx.raw}` } },
          },
        },
      });
    }

    if (radRef.current && historique.length > 0) {
      const moisMap = {};
      historique.forEach(h => {
        const d = new Date(h.dateDebut || h.datePassage || Date.now());
        const key = `${d.getMonth()+1}/${d.getFullYear()}`;
        if (!moisMap[key]) moisMap[key] = { ok:0, fail:0 };
        if (['RAPPORT_VALIDE','CERTIFIE'].includes(h.statut)) moisMap[key].ok++;
        else if (h.statut?.includes('ECHOUE')) moisMap[key].fail++;
      });
      const moisKeys = Object.keys(moisMap).slice(-6);
      chartInstances.current.rad = new Chart(radRef.current, {
        type:'bar',
        data:{
          labels: moisKeys,
          datasets:[
            { label:'Rapport validé', data: moisKeys.map(k => moisMap[k].ok),   backgroundColor:'#059669', borderRadius:4, stack:'s' },
            { label:'Échouées', data: moisKeys.map(k => moisMap[k].fail), backgroundColor:T.danger,  borderRadius:4, stack:'s' },
          ],
        },
        options:{
          responsive:true, maintainAspectRatio:false,
          plugins:{
            legend:{ position:'bottom', labels:{ color:TXT, font:{ size:11, weight:'600' }, usePointStyle:true, boxWidth:10 } },
            tooltip:{ mode:'index', intersect:false },
          },
          scales:{
            x:{ stacked:true, grid:{ display:false }, ticks:{ color:TXT, font:{ size:11, weight:'600' } }, border:{ color:AXIS } },
            y:{ stacked:true, grid:{ color:GRID }, ticks:{ color:TXT, font:{ size:11, weight:'600' }, precision:0 }, border:{ color:AXIS } },
          },
        },
      });
    }

    if (auditTypeRef.current) {
      const byType = [auditsProduit.length, auditsExport.length, auditsRegle.length];
      chartInstances.current.auditType = new Chart(auditTypeRef.current, {
        type: 'doughnut',
        data: {
          labels: ['Produit', 'Magasin Export', 'Règles Plates'],
          datasets: [{
            data: byType.some(v => v > 0) ? byType : [1, 0, 0],
            backgroundColor: ['#2563EB', '#7C3AED', '#0D9488'],
            borderColor: '#fff',
            borderWidth: 2,
            hoverOffset: 8,
          }],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          cutout: '62%',
          plugins: {
            legend: { position: 'bottom', labels: { color: TXT, font: { size: 11, weight: '600' }, usePointStyle: true, boxWidth: 10 } },
          },
        },
      });
    }

    if (auditStatusRef.current) {
      chartInstances.current.auditStatus = new Chart(auditStatusRef.current, {
        type: 'bar',
        data: {
          labels: ['Planifié', 'En cours', 'Terminé', 'Retard', 'Autre'],
          datasets: [{
            label: 'Nombre audits',
            data: [statusBuckets.PLANIFIE, statusBuckets.EN_COURS, statusBuckets.TERMINE, statusBuckets.EN_RETARD, statusBuckets.AUTRE],
            backgroundColor: ['#93C5FD', '#FCD34D', '#86EFAC', '#FCA5A5', '#CBD5E1'],
            borderRadius: 8,
          }],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            x: { grid: { display: false }, ticks: { color: TXT, font: { size: 11, weight: '600' } }, border: { color: AXIS } },
            y: { grid: { color: GRID }, ticks: { color: TXT, precision: 0, font: { size: 11, weight: '600' } }, border: { color: AXIS } },
          },
        },
      });
    }

    if (auditQkRef.current) {
      const qkData = [qkProduit.conforme, qkProduit.nonConformite, qkProduit.corrective, qkProduit.critique];
      chartInstances.current.auditQk = new Chart(auditQkRef.current, {
        type: 'polarArea',
        data: {
          labels: ['Conforme (QK=0)', 'Non-conformité (0<QK<=1)', 'Action corrective (1<QK<=2)', 'Alerte critique (QK>2)'],
          datasets: [{
            data: qkData.some(v => v > 0) ? qkData : [1, 0, 0, 0],
            backgroundColor: ['rgba(5,150,105,.72)', 'rgba(217,119,6,.72)', 'rgba(219,39,119,.72)', 'rgba(220,38,38,.72)'],
            borderColor: ['#059669', '#D97706', '#DB2777', '#DC2626'],
            borderWidth: 1.5,
          }],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { position: 'bottom', labels: { color: TXT, font: { size: 11, weight: '600' }, usePointStyle: true, boxWidth: 10 } } },
          scales: { r: { grid: { color: AXIS, lineWidth: 1.4 }, angleLines: { color: AXIS, lineWidth: 1.2 }, ticks: { display: false }, pointLabels: { color: TXT, font: { size: 10, weight: '700' } } } },
        },
      });
    }

    if (auditActionRef.current) {
      const actionData = [
        auditMeta.fichesTotal,
        auditMeta.fichesValidees,
        auditMeta.pdcaTotal,
        auditMeta.pdcaClotures,
      ];
      chartInstances.current.auditAction = new Chart(auditActionRef.current, {
        type: 'radar',
        data: {
          labels: ['Fiches créées', 'Fiches validées', 'PDCA créés', 'PDCA clôturés'],
          datasets: [{
            label: 'Actions correctives',
            data: actionData.some(v => v > 0) ? actionData : [1, 0, 0, 0],
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
          plugins: { legend: { position: 'bottom', labels: { color: TXT, font: { size: 11, weight: '600' }, usePointStyle: true, boxWidth: 10 } } },
          scales: { r: { grid: { color: AXIS, lineWidth: 1.4 }, angleLines: { color: AXIS, lineWidth: 1.2 }, pointLabels: { color: TXT, font: { size: 10, weight: '600' } }, ticks: { backdropColor: 'transparent', color: T.g500, precision: 0 } } },
        },
      });
    }

    return () => {
      Object.keys(chartInstances.current).forEach((k) => {
        if (chartInstances.current[k]) {
          chartInstances.current[k].destroy();
          chartInstances.current[k] = null;
        }
      });
    };
  }, [
    loading,
    historique,
    chartScores.length,
    certifReussies.length,
    certifEchouees.length,
    certifBloquees.length,
    auditsProduit,
    auditsExport,
    auditsRegle,
    auditMeta,
  ]);

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'55vh', gap:12, color:T.g400, fontFamily:"'Inter',sans-serif" }}>
      <div style={{ width:32, height:32, border:`3px solid ${T.g200}`, borderTopColor:T.navy, borderRadius:'50%', animation:'spin .8s linear infinite' }}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      Chargement du tableau de bord…
    </div>
  );

  return (
    <div style={{ fontFamily:"'Inter','DM Sans',sans-serif", display:'flex', flexDirection:'column', gap:'1.1rem' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@700;900&display=swap');
        @keyframes spin  { to{transform:rotate(360deg)} }
        @keyframes up    { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:none} }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.3} }
        .kpi-hover { transition:transform .18s,box-shadow .18s; }
        .kpi-hover:hover { transform:translateY(-3px); box-shadow:0 8px 22px rgba(11,30,61,.14)!important; }
        .row-h { transition:background .12s; border-radius:8px; cursor:pointer; }
        .row-h:hover { background:#EEF2F8!important; }
      `}</style>

      {/* HERO */}
      <div style={{
        background:'linear-gradient(135deg,#0070BB 0%,#0D2B54 55%,#0070BB 100%)',
        borderRadius:16, padding:'1.2rem 1.8rem',
        display:'grid', gridTemplateColumns:'1fr auto',
        alignItems:'center', gap:'1.5rem',
        position:'relative', overflow:'hidden',
        boxShadow:'0 4px 20px rgba(11,30,61,.2)', animation:'up .4s ease',
      }}>
        <div style={{ position:'absolute', right:'-5%', top:'-30%', width:220, height:220, background:'rgba(255,255,255,.03)', borderRadius:'50%' }}/>
        <div style={{ position:'absolute', right:'12%', bottom:'-40%', width:130, height:130, border:'2px solid rgba(255,255,255,.05)', borderRadius:'50%' }}/>
        <div style={{ position:'relative', zIndex:1 }}>
          <div style={{ display:'flex', alignItems:'center', gap:7, marginBottom:6 }}>
            <span style={{ width:7, height:7, borderRadius:'50%', background:'#4ADE80', boxShadow:'0 0 8px #4ADE80', display:'inline-block', animation:'pulse 2s infinite' }}/>
            <span style={{ fontSize:'.7rem', fontWeight:800, letterSpacing:'2px', color:'rgba(255,255,255,.5)', textTransform:'uppercase' }}>PAP Leoni · Auditeur Produit</span>
          </div>
          <h1 style={{ margin:'0 0 6px', fontSize:'1.7rem', fontWeight:900, color:'#fff', letterSpacing:'-.02em' }}>
            Bonjour, <span style={{ color:T.gold }}>{user?.prenom}</span> 
          </h1>
          <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
            {[
              { dot:'#4ADE80', txt:`${certifReussies.length} qualification${certifReussies.length > 1 ? 's' : ''} réussie${certifReussies.length > 1 ? 's' : ''}` },
              { dot:'#93C5FD', txt:`${totalPassages} passage${totalPassages > 1 ? 's' : ''} au total` },
              { dot:'#FCD34D', txt: scoreTheoMoyen > 0 ? `Moyenne théorique ${scoreTheoMoyen}%` : 'Aucun score' },
              { dot:isBloque?'#FCA5A5':isEnCours?'#FCD34D':'#86EFAC', txt: isBloque?'Accès bloqué':isEnCours?'Examen en cours':'Aucun examen actif' },
            ].map((b,i) => (
              <span key={i} style={{ display:'flex', alignItems:'center', gap:5, background:'rgba(255,255,255,.1)', borderRadius:99, padding:'3px 10px', border:'1px solid rgba(255,255,255,.15)' }}>
                <span style={{ width:5, height:5, borderRadius:'50%', background:b.dot, display:'inline-block' }}/>
                <span style={{ color:'rgba(255,255,255,.8)', fontSize:'.7rem', fontWeight:600 }}>{b.txt}</span>
              </span>
            ))}
          </div>
        </div>
        <div style={{ position:'relative', zIndex:1 }}>
          {!isBloque && (
            <button onClick={() => navigate('/auditeur/certif/examen')}
              style={{ display:'flex', alignItems:'center', gap:8, background:T.gold, color:T.navy, border:'none', padding:'12px 24px', borderRadius:12, fontSize:'.88rem', fontWeight:800, cursor:'pointer', fontFamily:'inherit', boxShadow:'0 4px 12px rgba(200,152,42,.35)', transition:'all .18s' }}
              onMouseEnter={e => e.currentTarget.style.transform='translateY(-2px)'}
              onMouseLeave={e => e.currentTarget.style.transform='none'}>
              {Ic.play} {isEnCours ? "Continuer l'examen" : "Passer l'examen"}
            </button>
          )}
          {isBloque && (
            <div style={{ display:'flex', alignItems:'center', gap:8, background:'rgba(220,38,38,.2)', color:'#FCA5A5', border:'1px solid rgba(220,38,38,.3)', padding:'12px 20px', borderRadius:12, fontSize:'.82rem', fontWeight:700 }}>
              {Ic.lock} Accès temporairement bloqué
            </div>
          )}
        </div>
      </div>

      {/* KPI LIGNE 1 — 4 cartes (théorie + pratique) */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'.85rem', animation:'up .4s .05s ease both' }}>
        <div className="kpi-hover">
          <KpiCard icon={Ic.award} label="Qualifications réussies" value={certifReussies.length} sub="Certifications validées" accent="#059669" delay={0}/>
        </div>
        <div className="kpi-hover">
          <KpiCard icon={Ic.theo} label="Score moyen théorique" value={scoreTheoMoyen} suffix="%" sub="Moyenne des meilleurs passages" accent={scoreTheoMoyen >= 70 ? '#059669' : T.danger} delay={60}/>
        </div>
        <div className="kpi-hover">
          <KpiCard icon={Ic.prat} label="Score moyen pratique" value={scorePratMoyen} suffix="%" sub="Moyenne des meilleurs passages" accent={scorePratMoyen >= 70 ? '#059669' : T.danger} delay={120}/>
        </div>
        <div className="kpi-hover">
          <KpiCard icon={Ic.layers} label="Total passages" value={totalPassages} sub={`${tauxReussite}% de taux de réussite`} accent={T.blueM} delay={180}/>
        </div>
      </div>

      {/* SECTION GRAPHES PRINCIPALE */}
      <div style={{ display:'grid', gridTemplateColumns:'minmax(0,2fr) minmax(0,1fr)', gap:'1rem', animation:'up .4s .1s ease both' }}>
        <div style={cardStyle}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'1rem' }}>
            <SectionTitle icon={Ic.activity} title="Comparaison des scores" sub="Tous les passages · Théorique vs Pratique"/>
            <div style={{ display:'flex', gap:14, fontSize:'.68rem', fontWeight:700, color:T.g500 }}>
              <span style={{ display:'flex', alignItems:'center', gap:5 }}><span style={{ width:14, height:3, background:'#93C5FD', display:'inline-block', borderRadius:2 }}/> Théorique</span>
              <span style={{ display:'flex', alignItems:'center', gap:5 }}><span style={{ width:14, height:3, background:'#86EFAC', display:'inline-block', borderRadius:2 }}/> Pratique</span>
            </div>
          </div>
          <div style={{ position:'relative', height:230 }}>
            {chartScores.length > 0
              ? <canvas ref={scoreRef}/>
              : <div style={{ height:'100%', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', color:T.g300, gap:10 }}>
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke={T.g300} strokeWidth="1.5"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
                  <span style={{ fontSize:'.85rem', fontWeight:600 }}>Aucun score disponible</span>
                </div>
            }
          </div>
        </div>

        <div style={cardStyle}>
          <SectionTitle icon={Ic.pie} title="Répartition des résultats" sub={`${totalPassages} passages au total`}/>
          <div style={{ position:'relative', height:180, marginBottom:16 }}>
            <canvas ref={pieRef}/>
            <div style={{ position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)', textAlign:'center', pointerEvents:'none' }}>
              <div style={{ fontSize:'1.5rem', fontWeight:900, color:T.navy, fontFamily:"'Rajdhani',sans-serif", lineHeight:1 }}>{tauxReussite}%</div>
              <div style={{ fontSize:'.6rem', color:T.g400, fontWeight:700 }}>réussite</div>
            </div>
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:7 }}>
            {[
              { label:'Réussies', value: certifReussies.length, color:'#059669' },
              { label:'Échouées', value: certifEchouees.length, color:T.danger },
              { label:'Bloquées', value: certifBloquees.length, color:T.warn },
            ].map(d => (
              <div key={d.label} style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                <div style={{ display:'flex', alignItems:'center', gap:7 }}>
                  <span style={{ width:10, height:10, borderRadius:3, background:d.color, display:'inline-block' }}/>
                  <span style={{ fontSize:'.76rem', color:T.g500, fontWeight:600 }}>{d.label}</span>
                </div>
                <span style={{ fontSize:'.84rem', fontWeight:800, color:T.navy, fontFamily:"'Rajdhani',sans-serif" }}>{d.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* SECTION CHARTS 2 + STATUT EN COURS */}
      <div style={{ display:'grid', gridTemplateColumns:'minmax(0,1fr) minmax(0,1fr)', gap:'1rem', animation:'up .4s .15s ease both' }}>
        <div style={cardStyle}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'1rem' }}>
            <SectionTitle icon={Ic.chart} title="Passages par mois" sub="6 derniers mois · réussies vs échouées"/>
            <div style={{ display:'flex', gap:10, fontSize:'.68rem', fontWeight:700, color:T.g500 }}>
              <span style={{ display:'flex', alignItems:'center', gap:5 }}><span style={{ width:10, height:10, borderRadius:3, background:'#059669', display:'inline-block' }}/> Réussies</span>
              <span style={{ display:'flex', alignItems:'center', gap:5 }}><span style={{ width:10, height:10, borderRadius:3, background:T.danger, display:'inline-block' }}/> Échouées</span>
            </div>
          </div>
          <div style={{ position:'relative', height:200 }}>
            {historique.length > 0
              ? <canvas ref={radRef}/>
              : <div style={{ height:'100%', display:'flex', alignItems:'center', justifyContent:'center', color:T.g300, fontSize:'.85rem', fontWeight:600 }}>Aucune donnée</div>
            }
          </div>
        </div>

        <div style={cardStyle}>
          <SectionTitle icon={Ic.target} title={isBloque ? 'Accès bloqué' : isEnCours ? 'Qualification en cours' : 'Derniers passages'} sub={isEnCours ? `Tentative ${passage?.tentativeNumero || 1}/${passage?.tentativesMax || 3}` : 'Les derniers passages de qualification'}/>
          {(isEnCours || isBloque) && passage ? (
            <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
              <div style={{ background: isBloque ? T.dangerBg : T.blueL, borderRadius:10, padding:'12px 14px', border:`1px solid ${isBloque ? T.dangerBd : T.blueB}` }}>
                <div style={{ fontWeight:800, fontSize:'.88rem', color: isBloque ? T.danger : T.navy, marginBottom:4 }}>
                  {passage.certificationNom || passage.certificationTitre || 'Qualification'}
                </div>
                <span style={{ fontSize:'.7rem', fontWeight:800, padding:'3px 10px', borderRadius:99, background: ST_MAP[passage.statut]?.bg, color: ST_MAP[passage.statut]?.color }}>
                  {ST_MAP[passage.statut]?.label || passage.statut}
                </span>
              </div>
              {isEnCours && (
                <div>
                  <div style={{ display:'flex', justifyContent:'space-between', fontSize:'.72rem', fontWeight:700, color:T.g500, marginBottom:6 }}>
                    <span>Progression test théorique</span>
                    <span>{passage.questionActuelle || 0}/20</span>
                  </div>
                  <div style={{ height:8, background:T.g200, borderRadius:99, overflow:'hidden', marginBottom:8 }}>
                    <div style={{ height:'100%', background:`linear-gradient(90deg,${T.blueM},#60A5FA)`, borderRadius:99, width:`${((passage.questionActuelle||0)/20)*100}%`, transition:'width .8s ease' }}/>
                  </div>
                  <button onClick={() => navigate('/auditeur/certif/examen')}
                    style={{ width:'100%', display:'flex', alignItems:'center', justifyContent:'center', gap:8, padding:'11px', background:T.navy, color:'#fff', border:'none', borderRadius:10, fontWeight:700, fontSize:'.83rem', cursor:'pointer', fontFamily:'inherit' }}>
                    {Ic.play} Continuer l'évaluation
                  </button>
                </div>
              )}
              {isBloque && passage.dateDeblocage && (
                <div style={{ background:T.dangerBg, borderRadius:9, padding:'10px 12px', border:`1px solid ${T.dangerBd}`, fontSize:'.78rem', color:T.danger, fontWeight:600, display:'flex', alignItems:'center', gap:8 }}>
                  {Ic.calendar} Déblocage prévu le {fmt(passage.dateDeblocage)}
                </div>
              )}
            </div>
          ) : (
            <div style={{ background:'linear-gradient(135deg,#0B1E3D,#1e1b4b)', borderRadius:12, padding:'1.2rem', color:'#fff', position:'relative', overflow:'hidden' }}>
              <div style={{ position:'absolute', right:-30, top:-30, width:120, height:120, background:'rgba(255,255,255,.04)', borderRadius:'50%' }}/>
              <div style={{ width:40, height:40, background:'rgba(255,255,255,.1)', borderRadius:11, display:'flex', alignItems:'center', justifyContent:'center', marginBottom:12, color:'#a5b4fc' }}>{Ic.award}</div>
              <div style={{ fontWeight:800, fontSize:'.95rem', marginBottom:6 }}>Prêt à vous certifier ?</div>
              <div style={{ fontSize:'.78rem', color:'rgba(255,255,255,.65)', marginBottom:16, lineHeight:1.5 }}>20 questions + test pratique en atelier. Durée de validité 2 ans.</div>
              <button onClick={() => navigate('/auditeur/certif/examen')}
                style={{ width:'100%', display:'flex', alignItems:'center', justifyContent:'center', gap:8, padding:'11px', background:'#fff', color:T.navy, border:'none', borderRadius:10, fontWeight:800, fontSize:'.83rem', cursor:'pointer', fontFamily:'inherit' }}>
                Démarrer l'évaluation {Ic.arrow}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* SANTÉ + HISTORIQUE TABLE */}
      <div style={{ display:'grid', gridTemplateColumns:'minmax(0,1fr) minmax(0,2.5fr)', gap:'1rem', animation:'up .4s .2s ease both' }}>
        <div style={{ background:'#1a3a6b', borderRadius:14, padding:'1.1rem 1.3rem', boxShadow:'0 4px 18px rgba(11,30,61,.25)', border:'1.5px solid #2a4a8b' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'1rem' }}>
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <div style={{ width:28, height:28, borderRadius:8, background:'rgba(255,255,255,.15)', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center' }}>{Ic.shield}</div>
              <div>
                <h3 style={{ margin:0, fontSize:'.83rem', fontWeight:800, color:'#fff' }}>Profil de performance</h3>
                <p style={{ margin:0, fontSize:'.67rem', color:'rgba(255,255,255,.5)' }}>Synthèse de vos résultats</p>
              </div>
            </div>
            <span style={{ display:'flex', alignItems:'center', gap:5 }}>
              <span style={{ width:6, height:6, borderRadius:'50%', background:'#4ADE80', animation:'pulse 2s infinite', display:'inline-block' }}/>
              <span style={{ fontSize:'.66rem', color:'#4ADE80', fontWeight:700 }}>Actif</span>
            </span>
          </div>

          <div style={{ textAlign:'center', margin:'0 auto .4rem', position:'relative', width:120, height:64 }}>
            <svg viewBox="0 0 140 76" width="120" height="64">
              <path d="M14,72 A52,52 0 0,1 126,72" fill="none" stroke="rgba(255,255,255,.15)" strokeWidth="9" strokeLinecap="round"/>
              <path d="M14,72 A52,52 0 0,1 126,72" fill="none"
                stroke={tauxReussite > 70 ? '#4ADE80' : tauxReussite > 40 ? '#FCD34D' : '#f87171'}
                strokeWidth="9" strokeLinecap="round"
                strokeDasharray={`${tauxReussite * 1.79} 179`}/>
            </svg>
            <div style={{ position:'absolute', bottom:0, left:0, right:0, textAlign:'center' }}>
              <span style={{ fontSize:'1.4rem', fontWeight:900, color:'#fff', fontFamily:"'Rajdhani','Inter',sans-serif" }}>{tauxReussite}%</span>
            </div>
          </div>
          <p style={{ textAlign:'center', margin:'0 0 .8rem', color:'rgba(255,255,255,.6)', fontSize:'.68rem' }}>Taux de réussite global</p>

          {[
            { lbl:'Qualifications réussies', val: certifReussies.length,        c:'#4ADE80' },
            { lbl:'Passages échoués',         val: certifEchouees.length,        c:'#FCA5A5' },
            { lbl:'Score moyen théorique',    val: scoreTheoMoyen > 0 ? `${scoreTheoMoyen}%` : '—', c:'#93C5FD' },
            { lbl:'Score moyen pratique',     val: scorePratMoyen > 0 ? `${scorePratMoyen}%` : '—', c:'#A5B4FC' },
            { lbl:'Jours avant expiration',   val: joursExpir != null ? `${joursExpir}j` : '—', c:'#FCD34D' },
            { lbl:'Total passages',           val: totalPassages,                c:'#E2E8F0' },
          ].map((m,i) => (
            <div key={i} style={{ display:'flex', justifyContent:'space-between', padding:'5px 0', borderTop:'1px solid rgba(255,255,255,.1)' }}>
              <span style={{ fontSize:'.72rem', color:'rgba(255,255,255,.65)' }}>{m.lbl}</span>
              <span style={{ fontSize:'.84rem', fontWeight:800, color:m.c, fontFamily:"'Rajdhani','Inter',sans-serif" }}>{m.val}</span>
            </div>
          ))}
        </div>

        <div style={cardStyle}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'1rem' }}>
            <SectionTitle icon={Ic.layers} title="Derniers passages" sub={`${historique.length} passage${historique.length > 1 ? 's' : ''} au total`}/>
            <button onClick={() => navigate('/auditeur/certif')}
              style={{ background:T.blueL, border:`1.5px solid ${T.blueB}`, borderRadius:8, padding:'4px 10px', fontSize:'.7rem', fontWeight:700, color:T.blueM, cursor:'pointer', display:'flex', alignItems:'center', gap:4, fontFamily:'inherit' }}>
              Voir tout {Ic.arrow}
            </button>
          </div>

          {historique.length === 0 ? (
            <div style={{ height:200, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', color:T.g300, gap:10 }}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke={T.g300} strokeWidth="1.5"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>
              <span style={{ fontWeight:600, fontSize:'.88rem' }}>Aucun historique trouvé</span>
            </div>
          ) : (
            <div style={{ overflowX:'auto' }}>
              <table style={{ width:'100%', textAlign:'left', borderCollapse:'collapse' }}>
                <thead>
                  <tr style={{ background:T.g50, color:T.g400, textTransform:'uppercase', fontSize:'.68rem', fontWeight:800 }}>
                    {['Qualification','Date','Score Théorique','Score Pratique','Tentative','Statut'].map(h => (
                      <th key={h} style={{ padding:'10px 12px', whiteSpace:'nowrap', borderBottom:`2px solid ${T.g200}` }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {historique.slice(0, 8).map((h,i) => {
                    const st = ST_MAP[h.statut] || { label:h.statut, color:T.g500, bg:T.g100 };
                    // Calcul du pourcentage théorique
                    let scoreTheoPct = null;
                    if (h.scoreTheoriquePct != null) {
                      scoreTheoPct = Math.round(h.scoreTheoriquePct);
                    } else if (h.scoreTheorique != null) {
                      scoreTheoPct = Math.round((h.scoreTheorique / 20) * 100);
                    }
                    const scorePrat = h.scorePratique != null ? Math.round(h.scorePratique) : null;
                    const seuilTheo = h.seuilTheorique || 70;
                    const seuilPrat = h.seuilPratique || 70;
                    return (
                      <tr key={h.id||i} className="row-h" style={{ borderBottom:`1px solid ${T.g100}` }}>
                        <td style={{ padding:'12px', fontWeight:700, color:T.navy, maxWidth:180, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', fontSize:'.82rem' }}>
                          {h.certificationTitre || h.certificationNom || 'Qualification'}
                        </td>
                        <td style={{ padding:'12px', color:T.g500, fontSize:'.78rem', fontWeight:600, whiteSpace:'nowrap' }}>
                          {fmt(h.dateDebut || h.datePassage)}
                        </td>
                        <td style={{ padding:'12px', minWidth:100 }}>
                          {scoreTheoPct != null ? (
                            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                              <div style={{ flex:1, height:5, background:T.g200, borderRadius:99, overflow:'hidden', minWidth:50 }}>
                                <div style={{ height:'100%', background: scoreTheoPct >= seuilTheo ? '#059669' : T.danger, borderRadius:99, width:`${scoreTheoPct}%` }}/>
                              </div>
                              <span style={{ fontSize:'.76rem', fontWeight:800, color: scoreTheoPct >= seuilTheo ? '#059669' : T.danger, flexShrink:0 }}>{scoreTheoPct}%</span>
                            </div>
                          ) : <span style={{ color:T.g300, fontSize:'.78rem' }}>—</span>}
                        </td>
                        <td style={{ padding:'12px', minWidth:100 }}>
                          {scorePrat != null ? (
                            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                              <div style={{ flex:1, height:5, background:T.g200, borderRadius:99, overflow:'hidden', minWidth:50 }}>
                                <div style={{ height:'100%', background: scorePrat >= seuilPrat ? '#059669' : T.danger, borderRadius:99, width:`${scorePrat}%` }}/>
                              </div>
                              <span style={{ fontSize:'.76rem', fontWeight:800, color: scorePrat >= seuilPrat ? '#059669' : T.danger, flexShrink:0 }}>{scorePrat}%</span>
                            </div>
                          ) : <span style={{ color:T.g300, fontSize:'.78rem' }}>—</span>}
                        </td>
                        <td style={{ padding:'12px', fontSize:'.78rem', color:T.g500, fontWeight:600 }}>
                          {h.tentativeNumero ? `N° ${h.tentativeNumero}` : '—'}
                        </td>
                        <td style={{ padding:'12px' }}>
                          <span style={{ padding:'3px 10px', borderRadius:99, fontSize:'.68rem', fontWeight:800, background:st.bg, color:st.color, whiteSpace:'nowrap' }}>
                            {st.label}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* BI AUDITS PRODUIT / EXPORT / MAGASIN + FICHES / PDCA */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,minmax(0,1fr))', gap:'.8rem', animation:'up .4s .23s ease both' }}>
        {[
          { l:'Audits produit', v: auditsProduit.length, c:'#2563EB' },
          { l:'Audits magasin export', v: auditsExport.length, c:'#7C3AED' },
          { l:'Audits règles plates', v: auditsRegle.length, c:'#0D9488' },
          { l:'Total audits opérationnels', v: totalAuditsOps, c:'#0B1E3D' },
        ].map((k, i) => (
          <div key={i} style={{ background:'#fff', borderRadius:12, border:`1.5px solid ${T.g200}`, padding:'.8rem .95rem', boxShadow:CARD_SHD }}>
            <p style={{ margin:0, color:T.g500, fontSize:'.7rem', fontWeight:700, textTransform:'uppercase', letterSpacing:'.05em' }}>{k.l}</p>
            <p style={{ margin:0, fontSize:'1.55rem', lineHeight:1.15, fontWeight:900, color:k.c, fontFamily:"'Rajdhani','Inter',sans-serif" }}>{k.v}</p>
          </div>
        ))}
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'minmax(0,1fr) minmax(0,1fr)', gap:'1rem', animation:'up .4s .26s ease both' }}>
        <div style={cardStyle}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'1rem', gap:12, flexWrap:'wrap' }}>
            <SectionTitle icon={Ic.pie} title="Répartition des audits" sub="Produit vs Export vs Règles plates" />
            <div style={{ display:'flex', gap:10, fontSize:'.68rem', fontWeight:700, color:T.g500, flexWrap:'wrap', justifyContent:'flex-end' }}>
              <span style={{ display:'flex', alignItems:'center', gap:5 }}><span style={{ width:10, height:10, borderRadius:3, background:'#2563EB', display:'inline-block' }}/> Produit</span>
              <span style={{ display:'flex', alignItems:'center', gap:5 }}><span style={{ width:10, height:10, borderRadius:3, background:'#7C3AED', display:'inline-block' }}/> Export</span>
              <span style={{ display:'flex', alignItems:'center', gap:5 }}><span style={{ width:10, height:10, borderRadius:3, background:'#0D9488', display:'inline-block' }}/> Règles plates</span>
            </div>
          </div>
          <div style={{ position:'relative', height:230 }}>
            <canvas ref={auditTypeRef} />
          </div>
        </div>

        <div style={cardStyle}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'1rem', gap:12, flexWrap:'wrap' }}>
            <SectionTitle icon={Ic.layers} title="Statut des audits" sub="Planifié, en cours, terminé, retard" />
            <div style={{ display:'flex', gap:10, fontSize:'.68rem', fontWeight:700, color:T.g500, flexWrap:'wrap', justifyContent:'flex-end' }}>
              <span style={{ display:'flex', alignItems:'center', gap:5 }}><span style={{ width:10, height:10, borderRadius:3, background:'#93C5FD', display:'inline-block' }}/> Planifié</span>
              <span style={{ display:'flex', alignItems:'center', gap:5 }}><span style={{ width:10, height:10, borderRadius:3, background:'#FCD34D', display:'inline-block' }}/> En cours</span>
              <span style={{ display:'flex', alignItems:'center', gap:5 }}><span style={{ width:10, height:10, borderRadius:3, background:'#86EFAC', display:'inline-block' }}/> Terminé</span>
              <span style={{ display:'flex', alignItems:'center', gap:5 }}><span style={{ width:10, height:10, borderRadius:3, background:'#FCA5A5', display:'inline-block' }}/> Retard</span>
            </div>
          </div>
          <div style={{ position:'relative', height:230 }}>
            <canvas ref={auditStatusRef} />
          </div>
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'minmax(0,1fr) minmax(0,1fr)', gap:'1rem', animation:'up .4s .29s ease both' }}>
        <div style={cardStyle}>
          <SectionTitle icon={Ic.target} title="Distribution QK (audit produit)" sub="Conforme, non-conformité, corrective, critique" />
          <div style={{ position:'relative', height:230 }}>
            <canvas ref={auditQkRef} />
          </div>
        </div>

        <div style={cardStyle}>
          <SectionTitle icon={Ic.activity} title="Fiches réparation & PDCA" sub="Suivi des actions correctives" />
          <div style={{ position:'relative', height:230 }}>
            <canvas ref={auditActionRef} />
          </div>
        </div>
      </div>

      {/* ACTIONS RAPIDES */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'.85rem', animation:'up .4s .25s ease both' }}>
        {[
          { icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>, label:'Mes audits', sub:'Voir tous mes audits assignés', path:'/auditeur/audits', color:'#1D4ED8' },
          { icon: Ic.award, label:'Mes certifications', sub:'Qualifications et certifications', path:'/auditeur/certif', color:'#059669' },
          { icon: Ic.play, label:'Passer l\'examen', sub:'Démarrer ou continuer', path:'/auditeur/certif/examen', color:T.gold },
          { icon: Ic.layers, label:'Mes rapports', sub:'Historique et documents', path:'/auditeur/rapports', color:T.purple },
        ].map((a,i) => (
          <button key={i} onClick={() => navigate(a.path)}
            style={{ background:T.g100, border:'none', borderRadius:12, padding:'.9rem 1rem', display:'flex', alignItems:'center', gap:10, cursor:'pointer', textAlign:'left', boxShadow:CARD_SHD, fontFamily:'inherit', transition:'transform .18s, box-shadow .18s' }}
            onMouseEnter={e => { e.currentTarget.style.transform='translateY(-3px)'; e.currentTarget.style.boxShadow='0 8px 22px rgba(11,30,61,.14)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform=''; e.currentTarget.style.boxShadow=CARD_SHD; }}>
            <div style={{ width:34, height:34, borderRadius:9, background:`${a.color}20`, color:a.color, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>{a.icon}</div>
            <div style={{ flex:1, minWidth:0 }}>
              <p style={{ margin:0, fontSize:'.82rem', fontWeight:800, color:T.navy }}>{a.label}</p>
              <p style={{ margin:'1px 0 0', fontSize:'.68rem', color:T.g500 }}>{a.sub}</p>
            </div>
            <span style={{ color:T.g400 }}>{Ic.arrow}</span>
          </button>
        ))}
      </div>
    </div>
  );
}