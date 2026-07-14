// ═══════════════════════════════════════════════════════════════
// ChefServiceDashboard.jsx — Style unifié AdminDashboard
// ═══════════════════════════════════════════════════════════════
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { auditAPI } from '../../services/auditAPI';
import { chefQualifAPI } from '../../services/certifAPI';
import { Chart, registerables } from 'chart.js';
Chart.register(...registerables);

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

const IC = {
  audit:   <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>,
  check:   <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>,
  clock:   <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  alert:   <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
  shield:  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  unlock:  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 0 9.9-1"/></svg>,
  plan:    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  trophy:  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><polyline points="8 21 12 17 16 21"/><line x1="12" y1="17" x2="12" y2="11"/><path d="M7 4H17a2 2 0 0 1 2 2v1a6 6 0 0 1-6 6 6 6 0 0 1-6-6V6a2 2 0 0 1 2-2z"/></svg>,
  activity:<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>,
  chart:   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
  layers:  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>,
  list:    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>,
  arrow:   <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>,
  tool:    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>,
  store:   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
};

const CARD_SHD = '0 2px 10px rgba(11,30,61,.10)';
const STATUT_AUDIT_COLORS = { PLANIFIE:'#0057B8', EN_COURS:'#C8982A', TERMINE:'#1A7A4A', EN_RETARD:'#C0392B', ANNULE:'#6B7280' };
const STATUT_AUDIT_LABELS = { PLANIFIE:'Planifié', EN_COURS:'En cours', TERMINE:'Terminé', EN_RETARD:'En retard', ANNULE:'Annulé' };
const TYPE_COLORS = {
  AUDIT_PRODUIT:        { bg:'#EDE9FE', color:'#6D28D9', label:'Audit Produit' },
  AUDIT_REGLES_PLATES:  { bg:'#DCFCE7', color:'#16A34A', label:'Règles Plates' },
  AUDIT_MAGASIN_EXPORT: { bg:'#FEF3C7', color:'#D97706', label:'Magasin Export' },
};

function parseDateValue(...values) {
  for (const value of values) {
    if (!value) continue;
    const date = new Date(value);
    if (!Number.isNaN(date.getTime())) return date;
  }
  return null;
}

function buildActivity7Days(audits = [], passages = [], stats = {}) {
  if (Array.isArray(stats?.activite7Jours) && stats.activite7Jours.length > 0) {
    return stats.activite7Jours.map((item, index) => ({
      jour: item.jour || item.label || item.date || new Intl.DateTimeFormat('fr-FR', { weekday: 'short' }).format(new Date(Date.now() - (6 - index) * 86400000)),
      auditsTermines: Number(item.auditsTermines ?? item.auditsRealises ?? item.audits ?? 0) || 0,
      qualifications: Number(item.qualifications ?? item.certifications ?? item.passages ?? 0) || 0,
    }));
  }
  const formatter = new Intl.DateTimeFormat('fr-FR', { weekday: 'short' });
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const series = Array.from({ length: 7 }, (_, offset) => {
    const date = new Date(today);
    date.setDate(today.getDate() - (6 - offset));
    const key = date.toISOString().slice(0, 10);
    return { key, jour: formatter.format(date), auditsTermines: 0, qualifications: 0 };
  });
  const byDay = new Map(series.map(entry => [entry.key, entry]));
  audits.forEach(audit => {
    const date = parseDateValue(audit?.dateFin, audit?.dateCloture, audit?.dateValidationChef, audit?.dateCreation, audit?.dateDebut);
    if (!date) return;
    date.setHours(0, 0, 0, 0);
    const bucket = byDay.get(date.toISOString().slice(0, 10));
    if (!bucket) return;
    if (audit?.statut === 'TERMINE' || audit?.dateFin || audit?.dateCloture) bucket.auditsTermines += 1;
  });
  passages.forEach(passage => {
    const date = parseDateValue(passage?.dateValidationChef, passage?.dateGenerationCertif, passage?.dateDebut, passage?.dateCreation);
    if (!date) return;
    date.setHours(0, 0, 0, 0);
    const bucket = byDay.get(date.toISOString().slice(0, 10));
    if (!bucket) return;
    bucket.qualifications += 1;
  });
  return series;
}

function KpiCard({ icon, label, value, sub, accent, onClick, delay=0 }) {
  const n = useCountUp(value || 0, delay * 60);
  return (
    <div onClick={onClick}
      className="kpi-card"
      style={{ 
        background:'#fff', 
        borderRadius:12, 
        padding:'.6rem .8rem',
        borderLeft:`3px solid ${accent}`,
        border: '1px solid #cacaca',
        boxShadow:CARD_SHD,
        cursor:onClick?'pointer':'default', 
        transition:'transform .18s, box-shadow .18s, border-color .2s' 
      }}
      onMouseEnter={e => { 
        if(onClick){
          e.currentTarget.style.transform='translateY(-2px)';
          e.currentTarget.style.boxShadow='0 6px 20px rgba(0,0,0,.12)';
          e.currentTarget.style.borderColor = accent;
        }
      }}
      onMouseLeave={e => { 
        e.currentTarget.style.transform=''; 
        e.currentTarget.style.boxShadow=CARD_SHD;
        e.currentTarget.style.borderColor = '#cacaca';
      }}> 
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

const cardStyle = { 
  background:'#fff', 
  borderRadius:14, 
  padding:'1.1rem 1.3rem', 
  boxShadow:CARD_SHD,
  border: '1px solid #cacaca',  // ✅ BORDURE NOIRE
  transition: 'border-color .2s, box-shadow .2s, transform .2s',
};
function StatutBadge({ statut, type = 'audit' }) {
  if (type === 'audit') {
    const c = STATUT_AUDIT_COLORS[statut] || '#6B7280';
    const l = STATUT_AUDIT_LABELS[statut] || statut;
    return <span style={{ background:c+'18', color:c, fontSize:'.68rem', fontWeight:700, padding:'2px 8px', borderRadius:99, border:`1px solid ${c}40` }}>{l}</span>;
  }
  const QUALIF = {
    CERTIFIE:{ bg:'#DCFCE7', c:'#15803D' }, REUSSI:{ bg:'#DCFCE7', c:'#15803D' },
    BLOQUE:{ bg:'#FEF2F2', c:'#B91C1C' }, EN_ATTENTE:{ bg:'#DBEAFE', c:'#1D4ED8' },
    THEORIQUE_EN_COURS:{ bg:'#EFF6FF', c:'#0369A1' }, PRATIQUE_EN_COURS:{ bg:'#EDE9FE', c:'#4338CA' },
  };
  const cfg = QUALIF[statut] || { bg:'#F3F4F6', c:'#6B7280' };
  return <span style={{ background:cfg.bg, color:cfg.c, fontSize:'.68rem', fontWeight:700, padding:'2px 8px', borderRadius:99 }}>{statut?.replace(/_/g,' ')}</span>;
}

export default function ChefServiceDashboard() {
  const { user } = useAuth();
  const { t, i18n } = useTranslation();
  const nav = useNavigate();

  const [stats,    setStats]    = useState({});
  const [audits,   setAudits]   = useState([]);
  const [passages, setPassages] = useState([]);
  const [loading,  setLoading]  = useState(true);

  const statutAuditRef = useRef(null);
  const typeAuditRef   = useRef(null);
  const qualifRef      = useRef(null);
  const activiteRef    = useRef(null);
  const chartsOk       = useRef(false);

  useEffect(() => {
    Promise.allSettled([
      auditAPI.getDashboard(),
      auditAPI.getAll(),
      chefQualifAPI.getAllQualifications(),
    ]).then(([s, a, q]) => {
      if (s.status === 'fulfilled') setStats(s.value.data || {});
      if (a.status === 'fulfilled') {
        const sorted = [...(a.value.data||[])].sort((x,y) => {
          const o = { EN_RETARD:0, EN_COURS:1, PLANIFIE:2, TERMINE:3, ANNULE:4 };
          return (o[x.statut]??5)-(o[y.statut]??5);
        });
        setAudits(sorted);
      }
      if (q.status === 'fulfilled') setPassages(q.value.data || []);
    }).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (loading || chartsOk.current) return;
    chartsOk.current = true;
    const GRID = 'rgba(0,0,0,0.08)', TXT = '#1E293B', AXIS = 'rgba(0,0,0,0.20)';
    const scalesBase = {
      x:{ grid:{ color:GRID }, ticks:{ color:TXT, font:{ size:11, weight:'600' } }, border:{ color:AXIS } },
      y:{ grid:{ color:GRID }, ticks:{ color:TXT, font:{ size:11, weight:'600' }, precision:0 }, border:{ color:AXIS } },
    };
    if (statutAuditRef.current && audits.length > 0) {
      const statuts = ['PLANIFIE','EN_COURS','TERMINE','EN_RETARD','ANNULE'];
      const counts  = statuts.map(s => audits.filter(a => a.statut === s).length);
      const colors  = ['#0057B8','#C8982A','#1A7A4A','#C0392B','#6B7280'];
      new Chart(statutAuditRef.current, {
        type:'doughnut',
        data:{ labels:statuts.map(s => STATUT_AUDIT_LABELS[s]), datasets:[{ data:counts, backgroundColor:colors, borderWidth:2, borderColor:'#fff', hoverOffset:6 }] },
        options:{ responsive:true, maintainAspectRatio:false, cutout:'62%', plugins:{ legend:{ display:false } } }
      });
    }
    if (typeAuditRef.current && audits.length > 0) {
      const types = ['AUDIT_PRODUIT','AUDIT_REGLES_PLATES','AUDIT_MAGASIN_EXPORT'];
      new Chart(typeAuditRef.current, {
        type:'bar',
        data:{ labels:['Produit','Règles Plates','Magasin Export'], datasets:[{ data:types.map(t => audits.filter(a => a.typeAudit === t).length), backgroundColor:['#6D28D9','#16A34A','#D97706'], borderRadius:5 }] },
        options:{ responsive:true, maintainAspectRatio:false, indexAxis:'y', plugins:{ legend:{ display:false } }, scales:{ x:{ grid:{ color:GRID }, ticks:{ color:TXT, font:{ size:11 } }, border:{ color:AXIS } }, y:{ grid:{ display:false }, ticks:{ color:TXT, font:{ size:11, weight:'600' } }, border:{ color:AXIS } } } }
      });
    }
    if (qualifRef.current && passages.length > 0) {
      const qStatuts = ['CERTIFIE','THEORIQUE_EN_COURS','PRATIQUE_EN_COURS','BLOQUE','EN_ATTENTE'];
      const qLabels  = ['Qualifiés','Théo. en cours','Pratique','Bloqués','En attente'];
      const qColors  = ['#15803D','#0369A1','#4338CA','#B91C1C','#6B7280'];
      const qCounts  = qStatuts.map(s => passages.filter(p => (p.statut?.name||p.statut) === s).length);
      new Chart(qualifRef.current, {
        type:'doughnut',
        data:{ labels:qLabels, datasets:[{ data:qCounts, backgroundColor:qColors, borderWidth:2, borderColor:'#fff', hoverOffset:6 }] },
        options:{ responsive:true, maintainAspectRatio:false, cutout:'62%', plugins:{ legend:{ display:false } } }
      });
    }
    const act = buildActivity7Days(audits, passages, stats);
    if (activiteRef.current && act.length > 0) {
      new Chart(activiteRef.current, {
        type:'line',
        data:{
          labels:act.map(j => j.jour),
          datasets:[
            { label:'Audits réalisés', data:act.map(j => j.auditsTermines||0), borderColor:'#1a56db', backgroundColor:'rgba(26,86,219,0.10)', fill:true, tension:0.4, pointRadius:4, borderWidth:2, pointBackgroundColor:'#1a56db' },
            { label:'Qualifications', data:act.map(j => j.qualifications||0), borderColor:'#15803D', backgroundColor:'transparent', fill:false, tension:0.4, pointRadius:4, borderWidth:2, borderDash:[5,3], pointBackgroundColor:'#15803D' },
          ]
        },
        options:{ responsive:true, maintainAspectRatio:false, plugins:{ legend:{ display:false }, tooltip:{ mode:'index', intersect:false } }, scales:scalesBase }
      });
    }
  }, [loading, audits, passages, stats]);

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'55vh', gap:14, color:'#4B5563' }}>
      <span style={{ width:28, height:28, border:'3px solid #8A9BBC', borderTopColor:'#0057B8', borderRadius:'50%', animation:'spin .8s linear infinite', display:'inline-block' }}/>
      Chargement du tableau de bord…
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  const totalAudits   = audits.length;
  const planifies     = audits.filter(a => a.statut === 'PLANIFIE').length;
  const enCours       = audits.filter(a => a.statut === 'EN_COURS').length;
  const termines      = audits.filter(a => a.statut === 'TERMINE').length;
  const enRetard      = audits.filter(a => a.statut === 'EN_RETARD').length;

  const getStatut     = p => p.statut?.name || p.statut || '';
  const totalQualif   = passages.length;
  const certifies     = passages.filter(p => ['CERTIFIE','REUSSI'].includes(getStatut(p))).length;
  const bloques       = passages.filter(p => getStatut(p) === 'BLOQUE').length;
  const enCoursQualif = passages.filter(p => ['THEORIQUE_EN_COURS','PRATIQUE_EN_COURS','FORMATION_OBLIGATOIRE'].includes(getStatut(p))).length;
  const deblocages    = passages.filter(p => p.causeDeblocage);
  const certifAttente = passages.filter(p => p.statutCertificat === 'EN_ATTENTE_CHEF').length;
  const tauxCertif    = totalQualif > 0 ? Math.round((certifies / totalQualif) * 100) : 0;
  const qkMoyen       = stats.qkMoyenMois ?? null;
  const auditsRecents = audits.slice(0, 8);
  const passagesRecents = passages.slice(0, 6);
  const activite7Jours = buildActivity7Days(audits, passages, stats);
  const STATUT_COLORS_DOUGHNUT = ['#0057B8','#C8982A','#1A7A4A','#C0392B','#6B7280'];

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'1.1rem' }}>
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
      <div style={{ background:'linear-gradient(135deg,#0070BB 0%,#0D2B54 55%,#059669 100%)', borderRadius:16, padding:'1.1rem 1.6rem', display:'grid', gridTemplateColumns:'1fr auto', alignItems:'center', gap:'1.5rem', position:'relative', overflow:'hidden', boxShadow:'0 4px 20px rgba(11,30,61,.2)', animation:'fade .4s ease', marginTop:-10 }}>
        <div>
          <div style={{ display:'flex', alignItems:'center', gap:7, marginBottom:4 }}>
            <span style={{ width:6, height:6, borderRadius:'50%', background:'#4ADE80', boxShadow:'0 0 6px #4ADE80', display:'inline-block', animation:'pulse 2s infinite' }}/>
            <h1 style={{ margin:'0 0 7px', fontSize:'1.4rem', fontWeight:900, color:'#fff', letterSpacing:'-.03em', fontFamily:"'Rajdhani',sans-serif" }}>
              Bonjour <span style={{ color:'#FCD34D' }}>{user?.prenom} {user?.nom}</span>
            </h1>
          </div>
          <div style={{ display:'flex', gap:7, flexWrap:'wrap' }}>
            {[
              { dot:'#FCD34D', txt:`${totalAudits} audits total` },
              { dot:'#F87171', txt:`${enRetard} en retard` },
              { dot:'#4ADE80', txt:`${certifies} qualifiés / ${totalQualif}` },
              { dot:'#FDA4AF', txt:`${certifAttente} certif. à valider` },
              { dot:'#C4B5FD', txt:`${deblocages.length} déblocages` },
            ].map((b, i) => (
              <span key={i} style={{ display:'flex', alignItems:'center', gap:5, background:'rgba(255,255,255,.1)', borderRadius:99, padding:'3px 9px', border:'1px solid rgba(255,255,255,.15)' }}>
                <span style={{ width:5, height:5, borderRadius:'50%', background:b.dot, display:'inline-block' }}/>
                <span style={{ color:'rgba(255,255,255,.8)', fontSize:'.69rem', fontWeight:600 }}>{b.txt}</span>
              </span>
            ))}
          </div>
        </div>
        <div style={{ background:'rgba(255,255,255,.14)', borderRadius:11, padding:'.8rem 1.2rem', border:'1px solid rgba(255,255,255,.2)', flexShrink:0, textAlign:'right' }}>
          <Clock/>
        </div>
      </div>

      {/* ══ KPI AUDITS ════════════════════════════════════════════ */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(180px, 1fr))', gap:'.85rem', animation:'up .4s .1s ease both' }}>
        {[
          { icon:IC.audit,    label:'Total audits',    value:totalAudits, sub:'Tous types confondus',     accent:'#0B1E3D', onClick:() => nav('/chef-service/audits') },
          { icon:IC.clock,    label:'Planifiés',       value:planifies,   sub:'À réaliser',               accent:'#0057B8', onClick:() => nav('/chef-service/audits?statut=PLANIFIE') },
          { icon:IC.activity, label:'En cours',        value:enCours,     sub:'En cours de réalisation',  accent:'#C8982A' },
          { icon:IC.check,    label:'Terminés',        value:termines,    sub:'Audits clôturés',           accent:'#1A7A4A', onClick:() => nav('/chef-service/audits?statut=TERMINE') },
          { icon:IC.alert,    label:'En retard',       value:enRetard,    sub:'Nécessitent attention',     accent:'#C0392B', onClick:() => nav('/chef-service/audits?statut=EN_RETARD') },
        ].map((k, i) => <KpiCard key={i} {...k} delay={i}/>)}
      </div>

      {/* ══ KPI QUALIFICATIONS ════════════════════════════════════ */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:'.85rem', animation:'up .4s .1s ease both' }}>
        {[
          { icon:IC.trophy,   label:'Total passages',    value:totalQualif,    sub:'Tous statuts',            accent:'#0B1E3D' },
          { icon:IC.shield,   label:'Qualifiés',         value:certifies,      sub:`Taux ${tauxCertif}%`,     accent:'#15803D', onClick:() => nav('/chef-service/qualifications') },
          { icon:IC.clock,    label:'En formation',      value:enCoursQualif,  sub:'Théo. ou pratique',        accent:'#0369A1' },
          { icon:IC.alert,    label:'Bloqués',           value:bloques,        sub:'Accès refusé 6 mois',      accent:'#B91C1C' },
          { icon:IC.unlock,   label:'Déblocages',        value:deblocages.length, sub:'Déblocages manuels',   accent:'#D97706', onClick:() => nav('/chef-service/qualifications') },
        ].map((k, i) => <KpiCard key={i} {...k} delay={i}/>)}
      </div>

      {/* ══ CHARTS ROW 1 ══════════════════════════════════════════ */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3, minmax(0, 1fr))', gap:'1rem', alignItems:'stretch', width:'100%', animation:'up .4s .15s ease both' }}>
        {/* Donut statuts audits */}
        <div style={{ ...cardStyle, height:'100%', display:'flex', flexDirection:'column' }}>
          <SectionTitle icon={IC.chart} title="Statuts des audits" sub={`${totalAudits} audits`}/>
          <div style={{ display:'grid', gridTemplateColumns:'minmax(0,1fr) minmax(0,1fr)', gap:'1rem', alignItems:'center', flex:1, minHeight:0 }}>
            <div style={{ position:'relative', height:160 }}><canvas ref={statutAuditRef}/></div>
            <div style={{ display:'flex', flexDirection:'column', gap:6, minWidth:0, width:'100%' }}>
              {['PLANIFIE','EN_COURS','TERMINE','EN_RETARD','ANNULE'].map((s, i) => (
                <div key={s} style={{ display:'flex', alignItems:'center', gap:7, minWidth:0 }}>
                  <span style={{ width:10, height:10, borderRadius:3, background:STATUT_COLORS_DOUGHNUT[i], flexShrink:0 }}/>
                  <span style={{ fontSize:'.7rem', color:'#1E293B', flex:1, minWidth:0, whiteSpace:'normal', overflowWrap:'anywhere' }}>{STATUT_AUDIT_LABELS[s]}</span>
                  <span style={{ fontSize:'.82rem', fontWeight:900, color:'#0B1E3D', fontFamily:"'Rajdhani',sans-serif" }}>
                    {audits.filter(a => a.statut === s).length}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Types d'audits */}
        <div style={{ ...cardStyle, height:'100%', display:'flex', flexDirection:'column' }}>
          <SectionTitle icon={IC.layers} title="Types d'audits" sub="Répartition par type"/>
          <div style={{ position:'relative', height:160, flex:1, minHeight:0 }}><canvas ref={typeAuditRef}/></div>
          <div style={{ display:'flex', gap:8, marginTop:8, justifyContent:'center', flexWrap:'wrap' }}>
            {[['#6D28D9','Produit'],['#16A34A','Règles'],['#D97706','Magasin']].map(([c,l]) => (
              <span key={l} style={{ display:'flex', alignItems:'center', gap:4, fontSize:'.67rem', fontWeight:600 }}>
                <span style={{ width:8, height:8, borderRadius:2, background:c, display:'inline-block' }}/>{l}
              </span>
            ))}
          </div>
        </div>

        {/* Donut qualifications */}
        <div style={{ ...cardStyle, height:'100%', display:'flex', flexDirection:'column' }}>
          <SectionTitle icon={IC.trophy} title="Qualifications" sub={`${totalQualif} passages · ${tauxCertif}% qualifiés`}/>
          <div style={{ display:'grid', gridTemplateColumns:'minmax(0,1fr) minmax(0,1fr)', gap:'1rem', alignItems:'center', flex:1, minHeight:0 }}>
            <div style={{ position:'relative', height:170 }}><canvas ref={qualifRef}/></div>
            <div style={{ display:'flex', flexDirection:'column', gap:6, minWidth:0, width:'100%' }}>
              {[
                { l:'Qualifiés', v:certifies, c:'#15803D' },
                { l:'En cours', v:enCoursQualif, c:'#0369A1' },
                { l:'Bloqués', v:bloques, c:'#B91C1C' },
                { l:'Déblocages', v:deblocages.length, c:'#D97706' },
                { l:'En attente', v:passages.filter(p => getStatut(p) === 'EN_ATTENTE').length, c:'#6B7280' },
              ].map(({ l, v, c }) => (
                <div key={l} style={{ display:'flex', alignItems:'center', gap:7, minWidth:0 }}>
                  <span style={{ width:10, height:10, borderRadius:3, background:c, flexShrink:0 }}/>
                  <span style={{ fontSize:'.7rem', color:'#1E293B', flex:1, minWidth:0, whiteSpace:'normal', overflowWrap:'anywhere' }}>{l}</span>
                  <span style={{ fontSize:'.82rem', fontWeight:900, color:'#0B1E3D', fontFamily:"'Rajdhani',sans-serif" }}>{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ══ SANTÉ + ACTIVITÉ ══════════════════════════════════════ */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 2fr', gap:'1rem', animation:'up .4s .2s ease both' }}>
        {/* Santé plateforme */}
        <div style={{ background:'#1a3a6b', borderRadius:14, padding:'1.1rem 1.3rem', boxShadow:'0 4px 18px rgba(11,30,61,.25)', border:'1.5px solid #2a4a8b' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'.9rem' }}>
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <div style={{ width:28, height:28, borderRadius:8, background:'rgba(255,255,255,.15)', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center' }}>{IC.shield}</div>
              <div>
                <h3 style={{ margin:0, fontSize:'.83rem', fontWeight:800, color:'#fff' }}>Santé de l'équipe</h3>
                <p style={{ margin:0, fontSize:'.67rem', color:'rgba(255,255,255,.6)' }}>Indicateurs temps réel</p>
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
          <p style={{ textAlign:'center', margin:'0 0 .7rem', color:'rgba(255,255,255,.65)', fontSize:'.67rem' }}>Taux de qualification</p>
          {[
            { lbl:'Qualifiés actifs',   val:certifies,       c:'#4ADE80' },
            { lbl:'En cours formation', val:enCoursQualif,   c:'#93C5FD' },
            { lbl:'Bloqués',            val:bloques,         c:'#FCA5A5' },
            { lbl:'Certif. à valider',  val:certifAttente,   c:'#FCD34D' },
            { lbl:'QK moyen mois',      val:qkMoyen != null ? Number(qkMoyen).toFixed(2) : '—', c:'#C4B5FD' },
            { lbl:'Audits en retard',   val:enRetard,        c:'#FDA4AF' },
          ].map((m, i) => (
            <div key={i} style={{ display:'flex', justifyContent:'space-between', padding:'5px 0', borderTop:'1px solid rgba(255,255,255,.1)' }}>
              <span style={{ fontSize:'.71rem', color:'rgba(255,255,255,.7)' }}>{m.lbl}</span>
              <span style={{ fontSize:'.82rem', fontWeight:800, color:m.c, fontFamily:"'Rajdhani',sans-serif" }}>{m.val}</span>
            </div>
          ))}
        </div>

        {/* Activité 7 jours */}
        <div style={cardStyle}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'1rem' }}>
            <SectionTitle icon={IC.activity} title="Activité 7 derniers jours" sub="Audits réalisés & qualifications"/>
            <div style={{ display:'flex', gap:12, fontSize:'.66rem', color:'#4c6183b7', fontWeight:700 }}>
              {[{ c:'#1a56db', l:'Audits réalisés' },{ c:'#15803D', l:'Qualifications' }].map(({ c, l }) => (
                <span key={l} style={{ display:'flex', alignItems:'center', gap:5 }}>
                  <span style={{ width:16, height:3, background:c, display:'inline-block', borderRadius:2 }}/>{l}
                </span>
              ))}
            </div>
          </div>
          <div style={{ position:'relative', height:200 }}><canvas ref={activiteRef}/></div>
        </div>
      </div>

      {/* ══ CARTE CLASSEMENT DES AUDITEURS ════════════════════════ */}
      {/* Identique à celle de l'ExpertDashboard — navigation vers la page partagée */}
      <div style={{ animation:'up .4s .25s ease both' }}>
        <div
        onClick={() => nav('/chef-service/classement-auditeurs')}
          className="act-btn"
          style={{
            background: 'linear-gradient(135deg,#C1E8FF,#94A3B8)',
            color: '#0B1E3D',
            borderRadius: 12,
            padding: '0.9rem 1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            boxShadow: '0 6px 18px rgba(11,30,61,0.08)',
            cursor: 'pointer',
            transition: 'all 0.24s ease',
            minHeight: 56,
          }}
        >
          <div style={{ fontSize: '2.4rem', lineHeight: 1 }}>🏆</div>
          <div style={{ flex: 1 }}>
            <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800 }}>Classement des Auditeurs</h3>
            <p style={{ margin: '6px 0 0', opacity: 0.9, fontSize: '0.85rem', marginBottom: 0 }}>
              Voir le podium, scores composites et performance détaillée · filtrage par qualification, site et plant
            </p>
          </div>
          <div style={{ fontSize: '1.6rem', opacity: 0.8 }}>→</div>
        </div>
      </div>

      {/* ══ AUDITS RÉCENTS + QUALIFICATIONS ══════════════════════ */}
      <div style={{ display:'grid', gridTemplateColumns:'3fr 2fr', gap:'1rem', animation:'up .4s .3s ease both' }}>
        {/* Audits récents */}
        <div style={cardStyle}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'1rem' }}>
            <SectionTitle icon={IC.audit} title="Audits récents" sub={`${auditsRecents.length} sur ${totalAudits}`}/>
            <button onClick={() => nav('/chef-service/audits')}
              style={{ background:'#EEF2F8', border:'1.5px solid #8A9BBC', borderRadius:8, padding:'3px 9px', fontSize:'.69rem', fontWeight:700, color:'#1D4ED8', cursor:'pointer', display:'flex', alignItems:'center', gap:3, fontFamily:'inherit', marginTop:'-1rem' }}>
              Voir tout {IC.arrow}
            </button>
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:2 }}>
            {auditsRecents.map((a, i) => {
              const tc = TYPE_COLORS[a.typeAudit] || { bg:'#F3F4F6', color:'#6B7280' };
              return (
                <div key={a.id||i} className="row-h" onClick={() => nav(`/chef-service/audits/${a.id}`)}
                  style={{ display:'grid', gridTemplateColumns:'auto 1fr auto auto', alignItems:'center', gap:10, padding:'8px 10px', background: i%2===0?'#FAFBFC':'#fff' }}>
                  <div style={{ width:8, height:8, borderRadius:'50%', background:STATUT_AUDIT_COLORS[a.statut]||'#ccc', flexShrink:0 }}/>
                  <div>
                    <div style={{ fontSize:'.8rem', fontWeight:700, color:'#0B1E3D' }}>{a.reference}</div>
                    <div style={{ fontSize:'.67rem', color:'#4B5563' }}>{a.auditeurNom||'Non assigné'} · {a.familleCablage||a.zoneExpedition||'—'}</div>
                  </div>
                  <span style={{ background:tc.bg, color:tc.color, fontSize:'.63rem', fontWeight:700, padding:'2px 7px', borderRadius:99, whiteSpace:'nowrap' }}>{tc.label}</span>
                  <StatutBadge statut={a.statut}/>
                </div>
              );
            })}
            {!auditsRecents.length && <p style={{ textAlign:'center', color:'#4B5563', fontSize:'.8rem', margin:'2rem 0' }}>Aucun audit</p>}
          </div>
        </div>

        {/* Qualifications récentes */}
        <div style={cardStyle}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'1rem' }}>
            <SectionTitle icon={IC.trophy} title="Qualifications" sub={`${passagesRecents.length} passages`}/>
            <button onClick={() => nav('/chef-service/qualifications')}
              style={{ background:'#EEF2F8', border:'1.5px solid #8A9BBC', borderRadius:8, padding:'3px 9px', fontSize:'.69rem', fontWeight:700, color:'#1D4ED8', cursor:'pointer', display:'flex', alignItems:'center', gap:3, fontFamily:'inherit', marginTop:'-1rem' }}>
              Voir tout {IC.arrow}
            </button>
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:2 }}>
            {passagesRecents.map((p, i) => {
              const st = getStatut(p);
              return (
                <div key={p.id||i} className="row-h" onClick={() => nav('/chef-service/qualifications')}
                  style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 10px' }}>
                  <div style={{ width:30, height:30, borderRadius:8, background:'#0B1E3D', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'.7rem', fontWeight:800, flexShrink:0 }}>
                    {(p.auditeurNom||'A').charAt(0).toUpperCase()}
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <p style={{ margin:0, fontSize:'.79rem', fontWeight:700, color:'#0B1E3D', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{p.auditeurNom}</p>
                    <p style={{ margin:0, fontSize:'.65rem', color:'#4B5563', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{p.certificationTitre||'—'}</p>
                  </div>
                  <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:3 }}>
                    <StatutBadge statut={st} type="qualif"/>
                    {p.causeDeblocage && <span style={{ fontSize:'.6rem', background:'#FEF2F2', color:'#DC2626', borderRadius:5, padding:'1px 5px', fontWeight:700 }}>Débloqué</span>}
                  </div>
                </div>
              );
            })}
            {!passagesRecents.length && <p style={{ textAlign:'center', color:'#4B5563', fontSize:'.8rem', margin:'2rem 0' }}>Aucun passage</p>}
          </div>
        </div>
      </div>

      {/* ══ DÉBLOCAGES ════════════════════════════════════════════ */}
      {deblocages.length > 0 && (
        <div style={{ ...cardStyle, animation:'up .4s .35s ease both' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'1rem' }}>
            <SectionTitle icon={IC.unlock} title="Déblocages manuels" sub={`${deblocages.length} déblocage${deblocages.length>1?'s':''} enregistré${deblocages.length>1?'s':''}`}/>
            <span style={{ background:'#FEF2F2', color:'#DC2626', border:'1px solid #FECACA', fontSize:'.69rem', fontWeight:700, padding:'3px 10px', borderRadius:99 }}>Lecture seule — traçabilité</span>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:8 }}>
            {deblocages.slice(0,4).map((p, i) => (
              <div key={p.id||i} style={{ background:'#FFF5F5', border:'1px solid #FECACA', borderRadius:10, padding:'10px 14px' }}>
                <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
                  <div style={{ width:30, height:30, borderRadius:8, background:'#DC2626', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'.7rem', fontWeight:800, flexShrink:0 }}>
                    {(p.auditeurNom||'A').charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontSize:'.79rem', fontWeight:700, color:'#0B1E3D' }}>{p.auditeurNom}</div>
                    <div style={{ fontSize:'.65rem', color:'#4B5563' }}>{p.certificationTitre||'—'}</div>
                  </div>
                </div>
                <div style={{ fontSize:'.75rem', color:'#7F1D1D', background:'#FEF2F2', borderRadius:7, padding:'6px 10px', lineHeight:1.5 }}>
                  <span style={{ fontWeight:700, color:'#DC2626' }}>Cause : </span>{p.causeDeblocage}
                </div>
              </div>
            ))}
          </div>
          {deblocages.length > 4 && (
            <p style={{ textAlign:'center', fontSize:'.75rem', color:'#94A3B8', margin:'.75rem 0 0', cursor:'pointer' }} onClick={() => nav('/chef-service/qualifications')}>
              + {deblocages.length - 4} autre{deblocages.length-4>1?'s':''} déblocage{deblocages.length-4>1?'s':''} — Voir tout →
            </p>
          )}
        </div>
      )}

      {/* ══ ACTIONS RAPIDES ═══════════════════════════════════════ */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:'.85rem', animation:'up .4s .4s ease both' }}>
        {[
          { icon:IC.audit,   label:'Audits Produit',  sub:'Planifier & suivre',         path:'/chef-service/audits/produit',         color:'#6D28D9' },
          { icon:IC.tool,    label:'Règles Plates',   sub:'Contrôle périodique',         path:'/chef-service/audits/regles-plates',   color:'#059669' },
          { icon:IC.store,   label:'Magasin Export',  sub:"Audit d'expédition",          path:'/chef-service/audits/magasin-export',  color:'#D97706' },
          { icon:IC.plan,    label:'Planning',         sub:'Vue calendrier mensuel',      path:'/chef-service/planning',               color:'#0057B8' },
          { icon:IC.shield,  label:'Qualifications',  sub:'Suivi & validation certif.', path:'/chef-service/qualifications',         color:'#C0392B' },
        ].map((a, i) => (
          <button key={i} className="act-btn" onClick={() => nav(a.path)}
            style={{ background:'#EEF0F3', border:'none', borderRadius:12, padding:'.9rem 1.1rem', display:'flex', alignItems:'center', gap:10, cursor:'pointer', textAlign:'left', boxShadow:CARD_SHD, fontFamily:'inherit' }}>
            <div style={{ width:34, height:34, borderRadius:9, background:a.color+'20', color:a.color, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>{a.icon}</div>
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