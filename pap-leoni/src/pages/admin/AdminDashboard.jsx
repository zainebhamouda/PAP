import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { adminAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Chart, registerables } from 'chart.js';
Chart.register(...registerables);

function useCountUp(target, delay = 0) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!target) return;
    const t = setTimeout(() => {
      let start = null;
      const step = ts => {
        if (!start) start = ts;
        const p = Math.min((ts - start) / 900, 1);
        const e = p < .5 ? 2 * p * p : -1 + (4 - 2 * p) * p;
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
const DAYS_MAP = {
  fr: ['dim', 'lun', 'mar', 'mer', 'jeu', 'ven', 'sam'],
  en: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
  it: ['dom', 'lun', 'mar', 'mer', 'gio', 'ven', 'sab'],
  de: ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'],
  ar: ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت']
};
function translateDay(day, lang) {
  const index = DAYS_MAP.fr.findIndex(d => day.toLowerCase().startsWith(d));
  if (index === -1) return day;
  return DAYS_MAP[lang]?.[index] || day;
}
function Clock() {
  const [d, setD] = useState(new Date());
  const { i18n } = useTranslation(); // ✅ AJOUT IMPORTANT

  useEffect(() => {
    const t = setInterval(() => setD(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const p = n => String(n).padStart(2, '0');

  return (
    <div>
      <div style={{ fontSize:'1.6rem', fontWeight:900, color:'#fff', letterSpacing:'.04em', fontFamily:"'Rajdhani',sans-serif", lineHeight:1 }}>
        {p(d.getHours())}<span style={{ opacity:.35 }}>:</span>{p(d.getMinutes())}
        <span style={{ fontSize:'.95rem', opacity:.3 }}>:{p(d.getSeconds())}</span>
      </div>

      <div style={{ fontSize:'.7rem', color:'rgba(255,255,255,.35)', marginTop:3, textTransform:'capitalize' }}>
        {d.toLocaleDateString(localeMap[i18n.language] || 'en-US', {
          weekday:'long',
          day:'numeric',
          month:'long',
          year:'numeric'
        })}
      </div>
    </div>
  );
}
const localeMap = {
  fr: 'fr-FR',
  en: 'en-US',
  ar: 'ar-TN',
  es: 'es-ES',
  it: 'it-IT',
  de: 'de-DE'
};
const IC = {
  users:   <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  check:   <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>,
  pause:   <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="10"/><line x1="10" y1="15" x2="10" y2="9"/><line x1="14" y1="15" x2="14" y2="9"/></svg>,
  clock:   <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  pin:     <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>,
  factory: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M2 20a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8l-7 5V8l-7 5V4a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2z"/></svg>,
  segment: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>,
  folder:  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>,
  layers:  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>,
  activity:<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>,
  arrow:   <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>,
  shield:  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  list:    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>,
  chart:   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
};

const ROLES = {
  ADMIN: {
    labelKey: 'roles.admin.plural',
    shortKey: 'roles.admin.short',
    color: '#a45c2e'
  },
  AUDITEUR: {
    labelKey: 'roles.auditeur.plural',
    shortKey: 'roles.auditeur.short',
    color: '#0b772f'
  },
  CHEF_SERVICE: {
    labelKey: 'roles.chef.plural',
    shortKey: 'roles.chef.short',
    color: '#1e77af'
  },
  RESPONSABLE_QUALITE_CENTRALE: {
    labelKey: 'roles.respQualite.plural',
    shortKey: 'roles.respQualite.short',
    color: '#5B21B6'
  },
  EXPERT_PRODUCT_AUDIT: {
    labelKey: 'roles.expert.plural',
    shortKey: 'roles.expert.short',
    color: '#c81414'
  },
  RESPONSABLE_MAGASIN: {
    labelKey: 'roles.magasin.plural',
    shortKey: 'roles.magasin.short',
    color: '#0F766E'
  },
};

const ROLE_COLORS = ['#1a56db','#0b772f','#1e77af','#5B21B6','#c81414','#0F766E'];
const CARD_SHD = '0 2px 10px rgba(11,30,61,.10)';

function KpiCard({ icon, label, value, sub, accent, onClick, delay }) {
  const n = useCountUp(value || 0, delay * 60);
  return (
    <div onClick={onClick}
      style={{ background:'#fff', borderRadius:12, padding:'.85rem 1rem', borderLeft:`3px solid ${accent}`, boxShadow:CARD_SHD, cursor:onClick?'pointer':'default', transition:'transform .18s, box-shadow .18s' }}
      onMouseEnter={e => { if (onClick) { e.currentTarget.style.transform='translateY(-3px)'; e.currentTarget.style.boxShadow='0 6px 20px rgba(0,0,0,.15)'; } }}
      onMouseLeave={e => { e.currentTarget.style.transform=''; e.currentTarget.style.boxShadow=CARD_SHD; }}>
      <div style={{ fontSize:'1.6rem', fontWeight:900, color:'#0B1E3D', letterSpacing:'-.04em', lineHeight:1, fontFamily:"'Rajdhani',sans-serif", marginBottom:6 }}>{n}</div>
      <div style={{ display:'flex', alignItems:'center', gap:6 }}>
        <div style={{ width:22, height:22, borderRadius:6, background:accent+'22', color:accent, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>{icon}</div>
        <div>
          <div style={{ fontSize:'.74rem', fontWeight:700, color:'#1E3A5F', lineHeight:1.2 }}>{label}</div>
          <div style={{ fontSize:'.65rem', color:'#4B5563', lineHeight:1.2 }}>{sub}</div>
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

const cardStyle = { background:'#fff', borderRadius:14, padding:'1.1rem 1.3rem', boxShadow:CARD_SHD };

export default function AdminDashboard() {
const { t, i18n } = useTranslation();
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const nav      = useNavigate();

  const roleRef   = useRef(null);
  const siteRef   = useRef(null);
  const statutRef = useRef(null);
  const infraRef  = useRef(null);
  const actifRef  = useRef(null);
  const chartsOk  = useRef(false);

  useEffect(() => {
    adminAPI.dashboard()
      .then(r => setData(r.data))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!data || chartsOk.current) return;
    chartsOk.current = true;
    const parRole  = Object.entries(data.utilisateursParRole || {});
    const parSite  = (data.statsParSite || []).slice(0, 7);
    const activite = data.activite7Jours || [];
    const GRID = 'rgba(0,0,0,0.18)';
    const TXT  = '#1E293B';
    const AXIS = 'rgba(0,0,0,0.30)';
    const scalesXY = {
      x: { grid:{ color:GRID, lineWidth:1 }, ticks:{ color:TXT, font:{ size:11, weight:'600' } }, border:{ color:AXIS } },
      y: { grid:{ color:GRID, lineWidth:1 }, ticks:{ color:TXT, font:{ size:11, weight:'600' } }, border:{ color:AXIS } },
    };
    const scalesXnoGrid = {
      x: { grid:{ display:false }, ticks:{ color:TXT, font:{ size:11, weight:'600' } }, border:{ color:AXIS } },
      y: { grid:{ color:GRID, lineWidth:1 }, ticks:{ color:TXT, font:{ size:11, weight:'600' }, precision:0 }, border:{ color:AXIS } },
    };
    if (roleRef.current && parRole.length > 0) {
      new Chart(roleRef.current, { type:'doughnut', data:{ labels:parRole.map(([r]) => ROLES[r]?.label||r), datasets:[{ data:parRole.map(([,v]) => Number(v)), backgroundColor:ROLE_COLORS, borderWidth:2, borderColor:'#fff', hoverOffset:6 }] }, options:{ responsive:true, maintainAspectRatio:false, cutout:'62%', plugins:{ legend:{ display:false }, tooltip:{ callbacks:{ label:ctx => ` ${ctx.label} : ${ctx.raw}` } } } } });
    }
    if (siteRef.current && parSite.length > 0) {
      new Chart(siteRef.current, { type:'bar', data:{ labels:parSite.map(s => s.siteNom||'—'), datasets:[
        { label:t('dashboard.activity.connections'),  data:parSite.map(s => s.auditeurs||0),   backgroundColor:'#0b772f', borderRadius:2, stack:'a' },
        { label:'Chefs',     data:parSite.map(s => s.chefs||0),        backgroundColor:'#1e77af', borderRadius:2, stack:'a' },
        { label:'Experts',   data:parSite.map(s => s.experts||0),      backgroundColor:'#c81414', borderRadius:2, stack:'a' },
        { label:'Resp.',     data:parSite.map(s => s.responsables||0), backgroundColor:'#5B21B6', borderRadius:2, stack:'a' },
      ] }, options:{ responsive:true, maintainAspectRatio:false, indexAxis:'y', plugins:{ legend:{ display:false }, tooltip:{ mode:'index', intersect:false } }, scales:{ x:{ stacked:true, grid:{ color:GRID, lineWidth:1 }, ticks:{ color:TXT, font:{ size:11, weight:'600' } }, border:{ color:AXIS } }, y:{ stacked:true, grid:{ display:false }, ticks:{ color:TXT, font:{ size:11, weight:'600' } }, border:{ color:AXIS } } } } });
    }
    if (statutRef.current) {
      new Chart(statutRef.current, { type:'bar', data:{ labels:[t('users.filters.active'), t('users.filters.inactive'), t('users.filters.notRegistered')], datasets:[{ data:[data.utilisateursActifs||0, data.utilisateursInactifs||0, data.utilisateursNonInscrits||0], backgroundColor:['#0b772f','#6b7280','#d97706'], borderRadius:5 }] }, options:{ responsive:true, maintainAspectRatio:false, plugins:{ legend:{ display:false } }, scales:scalesXnoGrid } });
    }
    if (infraRef.current) {
      new Chart(infraRef.current, { type:'bar', data:{ labels:[t('dashboard.kpi.sites'), t('dashboard.kpi.plants'), t('dashboard.kpi.segments'), t('dashboard.kpi.projects'), t('dashboard.kpi.series')], datasets:[{ data:[data.totalSites||0, data.totalPlants||0, data.totalSegments||0, data.totalProjets||0, data.totalSeries||0], backgroundColor:['#1a56db','#0b772f','#1e77af','#5B21B6','#d97706'], borderRadius:5 }] }, options:{ responsive:true, maintainAspectRatio:false, plugins:{ legend:{ display:false } }, scales:scalesXnoGrid } });
    }
    if (actifRef.current && activite.length > 0) {
      new Chart(actifRef.current, { type:'line', data:{ labels: activite.map(j => translateDay(j.jour, i18n.language)), datasets:[
        { label:t('dashboard.activity.connections'),   data:activite.map(j => j.connexions||0),   borderColor:'#1a56db', backgroundColor:'rgba(26,86,219,0.10)', fill:true,  tension:0.4, pointRadius:4, pointBackgroundColor:'#1a56db', borderWidth:2 },
        { label:t('dashboard.activity.registrations'), data:activite.map(j => j.inscriptions||0), borderColor:'#0b772f', backgroundColor:'transparent',           fill:false, tension:0.4, pointRadius:4, pointBackgroundColor:'#0b772f', borderWidth:2, borderDash:[5,3] },
        { label:t('dashboard.activity.adminActions'),  data:activite.map(j => j.actionsAdmin||0), borderColor:'#d90606', backgroundColor:'transparent',           fill:false, tension:0.4, pointRadius:4, pointBackgroundColor:'#d90606', borderWidth:2, borderDash:[2,2] },
      ] }, options:{ responsive:true, maintainAspectRatio:false, plugins:{ legend:{ display:false }, tooltip:{ mode:'index', intersect:false } }, scales:scalesXY } });
    }
  }, [data, t]);

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'55vh', gap:14, color:'#4B5563' }}>
      <span style={{ width:28, height:28, border:'3px solid #8A9BBC', borderTopColor:'#0057B8', borderRadius:'50%', animation:'spin .8s linear infinite', display:'inline-block' }} />
      {t('dashboard.loading')}
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  const total       = Math.max(data?.totalUtilisateurs || 1, 1);
  const taux        = Math.round(((data?.utilisateursActifs || 0) / total) * 100);
  const inscritsPct = Math.round(((total - (data?.utilisateursNonInscrits || 0)) / total) * 100);
  const parRole     = Object.entries(data?.utilisateursParRole || {});
  const inscrits    = data?.derniersInscrits || [];
  const parSite     = data?.statsParSite || [];
  const activite    = data?.activite7Jours || [];
  const totalConnexions   = activite.reduce((s, j) => s + (j.connexions || 0), 0);
  const totalInscriptions = activite.reduce((s, j) => s + (j.inscriptions || 0), 0);
  const totalActionsAdmin = activite.reduce((s, j) => s + (j.actionsAdmin || 0), 0);

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'1.1rem' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@700;900&display=swap');
        @keyframes spin  { to { transform:rotate(360deg) } }
        @keyframes up    { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:none} }
        @keyframes fade  { from{opacity:0} to{opacity:1} }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.3} }
        .row-h { transition:background .12s; cursor:pointer; border-radius:9px; }
        .row-h:hover { background:#DDE3EE !important; }
        .act-btn { transition:transform .18s, box-shadow .18s; }
        .act-btn:hover { transform:translateY(-3px) !important; box-shadow:0 8px 22px rgba(11,30,61,.18) !important; }
      `}</style>

      {/* HERO */}
      <div style={{ background:'linear-gradient(135deg,#0070BB 0%,#0D2B54 55%,#0070BB 100%)', borderRadius:16, padding:'1.1rem 1.6rem', display:'grid', gridTemplateColumns:'1fr auto', alignItems:'center', gap:'1.5rem', position:'relative', overflow:'hidden', boxShadow:'0 4px 20px rgba(11,30,61,.2)', animation:'fade .4s ease', marginTop:-10 }}>
        <div>
          <div style={{ display:'flex', alignItems:'center', gap:7, marginBottom:4 }}>
            <span style={{ width:6, height:6, borderRadius:'50%', background:'#4ADE80', boxShadow:'0 0 6px #4ADE80', display:'inline-block', animation:'pulse 2s infinite' }} />
            <h1 style={{ margin:'0 0 7px', fontSize:'1.4rem', fontWeight:900, color:'#fff', letterSpacing:'-.03em', fontFamily:"'Rajdhani',sans-serif" }}>
              {t('dashboard.greeting')} <span style={{ color:'#FCD34D' }}>{user?.prenom} {user?.nom}</span>
            </h1>
          </div>
          <div style={{ display:'flex', gap:7, flexWrap:'wrap' }}>
            {[
              { dot:'#4ADE80', txt:`${data?.utilisateursActifs||0} ${t('dashboard.hero.active')}` },
              { dot:'#FCD34D', txt:`${data?.utilisateursNonInscrits||0} ${t('dashboard.hero.pending')}` },
              { dot:'#93C5FD', txt:`${data?.totalSites||0} ${t('dashboard.hero.sites')} · ${data?.totalPlants||0} ${t('dashboard.hero.plants')}` },
              { dot:'#C4B5FD', txt:`${data?.totalSeries||0} ${t('dashboard.hero.series')}` },
              { dot:'#FDA4AF', txt:`${totalConnexions} ${t('dashboard.hero.connectionsWeek')}` },
            ].map((b, i) => (
              <span key={i} style={{ display:'flex', alignItems:'center', gap:5, background:'rgba(255,255,255,.1)', borderRadius:99, padding:'3px 9px', border:'1px solid rgba(255,255,255,.15)' }}>
                <span style={{ width:5, height:5, borderRadius:'50%', background:b.dot, display:'inline-block' }} />
                <span style={{ color:'rgba(255,255,255,.8)', fontSize:'.69rem', fontWeight:600 }}>{b.txt}</span>
              </span>
            ))}
          </div>
        </div>
        <div style={{ background:'rgba(255,255,255,.14)', borderRadius:11, padding:'.8rem 1.2rem', border:'1px solid rgba(255,255,255,.2)', flexShrink:0, textAlign:'right' }}>
          <Clock />
        </div>
      </div>

      {/* KPI UTILISATEURS */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:'.85rem', animation:'up .4s .05s ease both' }}>
        {[
          { icon:IC.users,   label:t('dashboard.kpi.totalUsers'),    value:data?.totalUtilisateurs||0,      sub:t('dashboard.kpi.totalUsersSub'),                                   accent:'#0B1E3D', onClick:() => nav('/admin/utilisateurs', { state:{ filter:'TOUS' } }) },
          { icon:IC.check,   label:t('dashboard.kpi.active'),        value:data?.utilisateursActifs||0,      sub:`${taux}% ${t('dashboard.kpi.totalUsersSub')}`,                     accent:'#0b772f', onClick:() => nav('/admin/utilisateurs', { state:{ filter:'ACTIF' } }) },
          { icon:IC.pause,   label:t('dashboard.kpi.inactive'),      value:data?.utilisateursInactifs||0,    sub:t('dashboard.kpi.inactiveSub'),                                     accent:'#6b7280', onClick:() => nav('/admin/utilisateurs', { state:{ filter:'INACTIF' } }) },
          { icon:IC.clock,   label:t('dashboard.kpi.notRegistered'), value:data?.utilisateursNonInscrits||0, sub:t('dashboard.kpi.notRegisteredSub'),                                accent:'#d97706', onClick:() => nav('/admin/utilisateurs', { state:{ filter:'NON_INSCRIT' } }) },
          { icon:IC.pin,     label:t('dashboard.kpi.sites'),         value:data?.totalSites||0,              sub:t('dashboard.kpi.sitesSub'),                                        accent:'#1a56db', onClick:() => nav('/admin/sites') },
        ].map((k, i) => <KpiCard key={i} {...k} delay={i} />)}
      </div>

      {/* KPI INFRASTRUCTURE */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:'.85rem', animation:'up .4s .1s ease both' }}>
        {[
          { icon:IC.factory, label:t('dashboard.kpi.plants'),      value:data?.totalPlants||0,       sub:`${data?.totalPlantsActifs||0} ${t('common.active').toLowerCase()}`, accent:'#1e77af', onClick:() => nav('/admin/plants') },
          { icon:IC.segment, label:t('dashboard.kpi.segments'),    value:data?.totalSegments||0,     sub:t('dashboard.kpi.segmentsSub'),                                      accent:'#1e77af', onClick:() => nav('/admin/segments') },
          { icon:IC.folder,  label:t('dashboard.kpi.projects'),    value:data?.totalProjets||0,      sub:t('dashboard.kpi.projectsSub'),                                      accent:'#5B21B6', onClick:() => nav('/admin/projets') },
          { icon:IC.layers,  label:t('dashboard.kpi.series'),      value:data?.totalSeries||0,       sub:`${data?.totalSeriesActives||0} ${t('common.active').toLowerCase()}`, accent:'#d97706', onClick:() => nav('/admin/series') },
          { icon:IC.factory, label:t('dashboard.kpi.activePlants'),value:data?.totalPlantsActifs||0, sub:`/ ${data?.totalPlants||0} total`,                                   accent:'#0b772f', onClick:() => nav('/admin/plants') },
        ].map((k, i) => <KpiCard key={i} {...k} delay={i} />)}
      </div>

      {/* Donut rôles + Statut */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem', animation:'up .4s .15s ease both' }}>
        <div style={cardStyle}>
          <SectionTitle icon={IC.chart} title={t('dashboard.sections.roleDistribution')} sub={`${parRole.length} ${t('dashboard.sections.roleDistributionSub', { total })}`} />
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem', alignItems:'center' }}>
            <div style={{ position:'relative', height:180 }}><canvas ref={roleRef}/></div>
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {parRole.map(([role, count], i) => (
                <div key={role} style={{ display:'flex', alignItems:'center', gap:7 }}>
                  <span style={{ width:10, height:10, borderRadius:3, background:ROLE_COLORS[i]||'#ccc', flexShrink:0, border:`1.5px solid ${ROLE_COLORS[i]||'#ccc'}` }} />
                  <span style={{ fontSize:'.71rem', color:'#1E293B', flex:1 }}>{t(ROLES[role]?.labelKey)||role}</span>
                  <span style={{ fontSize:'.8rem', fontWeight:900, color:'#0B1E3D', fontFamily:"'Rajdhani',sans-serif" }}>{count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div style={cardStyle}>
          <SectionTitle icon={IC.users} title={t('dashboard.sections.accountStatus')} sub={t('dashboard.sections.accountStatusSub')} />
          <div style={{ position:'relative', height:180 }}><canvas ref={statutRef}/></div>
        </div>
      </div>

      {/* Par site + Infrastructure */}
      <div style={{ display:'grid', gridTemplateColumns:'3fr 2fr', gap:'1rem', animation:'up .4s .2s ease both' }}>
        <div style={cardStyle}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'1rem' }}>
            <SectionTitle icon={IC.pin} title={t('dashboard.sections.usersPerSite')} sub={t('dashboard.sections.usersPerSiteSub')} />
            <div style={{ display:'flex', gap:8, fontSize:'.66rem', color:'#1E293B', fontWeight:600 }}>
              {[['#0b772f','Aud.'],['#1e77af','Chefs'],['#c81414','Exp.'],['#5B21B6','Resp.']].map(([c,l]) => (
                <span key={l} style={{ display:'flex', alignItems:'center', gap:3 }}>
                  <span style={{ width:8, height:8, borderRadius:2, background:c, display:'inline-block' }}/>{l}
                </span>
              ))}
            </div>
          </div>
          <div style={{ position:'relative', height:Math.max((parSite.length||1)*36, 120) }}><canvas ref={siteRef}/></div>
          {parSite.length === 0 && <p style={{ textAlign:'center', color:'#4B5563', fontSize:'.8rem', margin:'2rem 0' }}>{t('dashboard.noSite')}</p>}
        </div>
        <div style={cardStyle}>
          <SectionTitle icon={IC.layers} title={t('dashboard.sections.globalInfra')} sub={t('dashboard.sections.globalInfraSub')} />
          <div style={{ position:'relative', height:180 }}><canvas ref={infraRef}/></div>
        </div>
      </div>

      {/* Activité 7 jours */}
      <div style={cardStyle}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'1rem' }}>
          <SectionTitle icon={IC.activity} title={t('dashboard.sections.activity')} sub={t('dashboard.sections.activitySub')} />
          <div style={{ display:'flex', gap:12, fontSize:'.66rem', color:'#1E293B', fontWeight:700, flexShrink:0 }}>
            {[
              { c:'#1a56db', l:`${t('dashboard.activity.connections')} (${totalConnexions})` },
              { c:'#0b772f', l:`${t('dashboard.activity.registrations')} (${totalInscriptions})` },
              { c:'#d97706', l:`${t('dashboard.activity.adminActions')} (${totalActionsAdmin})` },
            ].map(({ c, l }) => (
              <span key={l} style={{ display:'flex', alignItems:'center', gap:5 }}>
                <span style={{ width:16, height:3, background:c, display:'inline-block', borderRadius:2 }}/>{l}
              </span>
            ))}
          </div>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8, marginBottom:'1rem' }}>
          {[
            { label:t('dashboard.activity.connections'),   value:totalConnexions,   color:'#1a56db' },
            { label:t('dashboard.activity.registrations'), value:totalInscriptions, color:'#0b772f' },
            { label:t('dashboard.activity.adminActions'),  value:totalActionsAdmin, color:'#d97706' },
          ].map((s, i) => (
            <div key={i} style={{ background:'#fff', borderRadius:8, padding:'8px 12px', borderLeft:`4px solid ${s.color}`, boxShadow:`0 2px 8px ${s.color}25` }}>
              <p style={{ margin:0, fontSize:'.69rem', color:'#1E293B', fontWeight:600 }}>{s.label}</p>
              <p style={{ margin:0, fontSize:'1.4rem', fontWeight:900, color:s.color, fontFamily:"'Rajdhani',sans-serif", lineHeight:1.2 }}>{s.value}</p>
            </div>
          ))}
        </div>
        <div style={{ position:'relative', height:180 }}><canvas ref={actifRef}/></div>
        {activite.length === 0 && <p style={{ textAlign:'center', color:'#4B5563', fontSize:'.8rem', margin:'2rem 0' }}>{t('dashboard.noActivity')}</p>}
      </div>

      {/* Santé + Derniers inscrits */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 2fr', gap:'1rem', animation:'up .4s .3s ease both' }}>
        <div style={{ background:'#1a3a6b', borderRadius:14, padding:'1.1rem 1.3rem', boxShadow:'0 4px 18px rgba(11,30,61,.25)', border:'1.5px solid #2a4a8b' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'.9rem' }}>
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <div style={{ width:28, height:28, borderRadius:8, background:'rgba(255,255,255,.15)', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center' }}>{IC.shield}</div>
              <div>
                <h3 style={{ margin:0, fontSize:'.83rem', fontWeight:800, color:'#fff' }}>{t('dashboard.sections.platformHealth')}</h3>
                <p style={{ margin:0, fontSize:'.67rem', color:'rgba(255,255,255,.6)' }}>{t('dashboard.sections.platformHealthSub')}</p>
              </div>
            </div>
            <span style={{ display:'flex', alignItems:'center', gap:5 }}>
              <span style={{ width:6, height:6, borderRadius:'50%', background:'#4ADE80', animation:'pulse 2s infinite', display:'inline-block' }} />
              <span style={{ fontSize:'.66rem', color:'#4ADE80', fontWeight:700 }}>{t('dashboard.health.nominal')}</span>
            </span>
          </div>
          <div style={{ textAlign:'center', margin:'0 auto .4rem', position:'relative', width:110, height:60 }}>
            <svg viewBox="0 0 140 76" width="110" height="60">
              <path d="M14,72 A52,52 0 0,1 126,72" fill="none" stroke="rgba(255,255,255,.15)" strokeWidth="9" strokeLinecap="round"/>
              <path d="M14,72 A52,52 0 0,1 126,72" fill="none" stroke={taux>70?'#4ADE80':taux>40?'#FCD34D':'#f87171'} strokeWidth="9" strokeLinecap="round" strokeDasharray={`${taux*1.79} 179`}/>
            </svg>
            <div style={{ position:'absolute', bottom:0, left:0, right:0, textAlign:'center' }}>
              <span style={{ fontSize:'1.4rem', fontWeight:900, color:'#fff', fontFamily:"'Rajdhani',sans-serif" }}>{taux}%</span>
            </div>
          </div>
          <p style={{ textAlign:'center', margin:'0 0 .7rem', color:'rgba(255,255,255,.65)', fontSize:'.67rem' }}>{t('dashboard.health.activationRate')}</p>
          {[
            { lbl:t('dashboard.health.completeRegistrations'), val:`${inscritsPct}%`,                                          c:'#93C5FD' },
            { lbl:t('dashboard.health.activeAccounts'),        val:data?.utilisateursActifs||0,                                 c:'#4ADE80' },
            { lbl:t('dashboard.health.pending'),               val:data?.utilisateursNonInscrits||0,                            c:'#FCD34D' },
            { lbl:t('dashboard.health.activePlants'),          val:`${data?.totalPlantsActifs||0}/${data?.totalPlants||0}`,     c:'#A5B4FC' },
            { lbl:t('dashboard.health.activeSeries'),          val:`${data?.totalSeriesActives||0}/${data?.totalSeries||0}`,    c:'#86EFAC' },
            { lbl:t('dashboard.health.weekConnections'),       val:totalConnexions,                                            c:'#FDA4AF' },
          ].map((m, i) => (
            <div key={i} style={{ display:'flex', justifyContent:'space-between', padding:'5px 0', borderTop:'1px solid rgba(255,255,255,.1)' }}>
              <span style={{ fontSize:'.71rem', color:'rgba(255,255,255,.7)' }}>{m.lbl}</span>
              <span style={{ fontSize:'.82rem', fontWeight:800, color:m.c, fontFamily:"'Rajdhani',sans-serif" }}>{m.val}</span>
            </div>
          ))}
        </div>

        <div style={cardStyle}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'1rem' }}>
            <SectionTitle icon={IC.list} title={t('dashboard.sections.recentUsers')} sub={`${inscrits.length} ${t('dashboard.sections.recentUsersSub')}`} />
            <button onClick={() => nav('/admin/utilisateurs')}
              style={{ background:'#EEF2F8', border:'1.5px solid #8A9BBC', borderRadius:8, padding:'3px 9px', fontSize:'.69rem', fontWeight:700, color:'#1D4ED8', cursor:'pointer', display:'flex', alignItems:'center', gap:3, fontFamily:'inherit', marginTop:'-1rem' }}>
              {t('common.seeAll')} {IC.arrow}
            </button>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:4 }}>
            {inscrits.slice(0, 8).map((u, i) => (
              <div key={u.id||i} className="row-h" onClick={() => nav(`/admin/utilisateurs/${u.id}`)} style={{ display:'flex', alignItems:'center', gap:8, padding:'6px 8px' }}>
                <div style={{ width:30, height:30, borderRadius:8, background:'#0B1E3D', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'.7rem', fontWeight:800, flexShrink:0, fontFamily:"'Rajdhani',sans-serif" }}>
                  {(u.prenom?.[0]||'').toUpperCase()}{(u.nom?.[0]||'').toUpperCase()}
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <p style={{ margin:0, fontSize:'.79rem', fontWeight:700, color:'#0B1E3D', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{u.prenom} {u.nom}</p>
                  <p style={{ margin:0, fontSize:'.67rem', color:'#4B5563' }}>{u.matricule} · {u.site||'—'}</p>
                </div>
                <span style={{ background:(ROLES[u.role]?.color||'#374151')+'30', color:ROLES[u.role]?.color||'#374151', fontSize:'.62rem', fontWeight:700, padding:'2px 6px', borderRadius:99, flexShrink:0, border:`1px solid ${ROLES[u.role]?.color||'#374151'}60` }}>
                  {t(ROLES[u.role]?.shortKey)||u.role}
                </span>
              </div>
            ))}
            {!inscrits.length && <p style={{ color:'#4B5563', fontSize:'.78rem', textAlign:'center', padding:'1.5rem 0', margin:0, gridColumn:'span 2' }}>{t('dashboard.noRecentUsers')}</p>}
          </div>
        </div>
      </div>

      {/* Table infrastructure par site */}
      {parSite.length > 0 && (
        <div style={{ ...cardStyle, animation:'up .4s .35s ease both' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'1rem' }}>
            <div>
              <h3 style={{ margin:0, fontSize:'.95rem', fontWeight:800, color:'#0B1E3D' }}>{t('dashboard.sections.infraTable')}</h3>
              <p style={{ margin:'2px 0 0', fontSize:'.8rem', color:'#013d91' }}>{t('dashboard.sections.infraTableSub')}</p>
            </div>
            <span style={{ background:'#BFDBFE', color:'#1E40AF', fontSize:'.69rem', fontWeight:700, padding:'3px 10px', borderRadius:99, border:'1.5px solid #93C5FD' }}>
              {parSite.length} {t('sites.counter')}{parSite.length > 1 ? 's' : ''}
            </span>
          </div>
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse', minWidth:700 }}>
              <thead>
                <tr style={{ background:'#D5DCE8' }}>
                  {[t('dashboard.infraTable.site'), t('dashboard.infraTable.location'), t('dashboard.infraTable.plants'), t('dashboard.infraTable.segments'), t('dashboard.infraTable.projects'), t('dashboard.infraTable.series'), t('dashboard.infraTable.auditors'), t('dashboard.infraTable.chiefs'), t('dashboard.infraTable.experts'), t('dashboard.infraTable.resp'), t('dashboard.infraTable.total')].map(h => (
                    <th key={h} style={{ padding:'8px 10px', fontSize:'.63rem', fontWeight:700, textTransform:'uppercase', letterSpacing:'.06em', color:'#1E293B', textAlign:['Site','Localisation',t('dashboard.infraTable.site'),t('dashboard.infraTable.location')].includes(h)?'left':'center', borderBottom:'2px solid #8A9BBC', whiteSpace:'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {parSite.map((s, i) => (
                  <tr key={i} className="row-h" style={{ borderBottom:'1px solid #A0AABB' }}>
                    <td style={{ padding:'9px 10px' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:7 }}>
                        <div style={{ width:26, height:26, borderRadius:7, background:'linear-gradient(135deg,#0B1E3D,#1D4ED8)', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'.7rem', fontWeight:900, flexShrink:0 }}>{(s.siteNom||'?')[0]}</div>
                        <p style={{ margin:0, fontSize:'.8rem', fontWeight:700, color:'#0B1E3D' }}>{s.siteNom}</p>
                      </div>
                    </td>
                    <td style={{ padding:'9px 10px', fontSize:'.77rem', color:'#1E293B' }}>{s.siteLocalisation||'—'}</td>
                    {[
                      { val:s.totalPlants,   color:'#1e77af' },
                      { val:s.totalSegments, color:'#1e77af' },
                      { val:s.totalProjets,  color:'#5B21B6' },
                      { val:s.totalSeries,   color:'#d97706' },
                      { val:s.auditeurs,     color:'#0b772f' },
                      { val:s.chefs,         color:'#1e77af' },
                      { val:s.experts,       color:'#c81414' },
                      { val:s.responsables,  color:'#5B21B6' },
                    ].map((cell, j) => (
                      <td key={j} style={{ padding:'9px 10px', textAlign:'center' }}>
                        {(cell.val||0) > 0
                          ? <span style={{ background:cell.color+'35', color:cell.color, fontWeight:800, fontSize:'.78rem', padding:'2px 8px', borderRadius:99, display:'inline-block', minWidth:22, fontFamily:"'Rajdhani',sans-serif", border:`1.5px solid ${cell.color}` }}>{cell.val}</span>
                          : <span style={{ color:'#8A9BBC', fontSize:'.75rem' }}>—</span>}
                      </td>
                    ))}
                    <td style={{ padding:'9px 10px', textAlign:'center' }}>
                      <span style={{ background:'#0B1E3D', color:'#fff', fontWeight:800, fontSize:'.78rem', padding:'2px 8px', borderRadius:99, display:'inline-block', fontFamily:"'Rajdhani',sans-serif" }}>{s.totalUtilisateurs||0}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Actions rapides */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:'.85rem', animation:'up .4s .4s ease both' }}>
        {[
          { icon:IC.users,   label:t('dashboard.quickActions.users'),    sub:t('dashboard.quickActions.usersSub'),    path:'/admin/utilisateurs', color:'#0B1E3D' },
          { icon:IC.pin,     label:t('dashboard.quickActions.sites'),    sub:t('dashboard.quickActions.sitesSub'),    path:'/admin/sites',        color:'#1a56db' },
          { icon:IC.factory, label:t('dashboard.quickActions.plants'),   sub:t('dashboard.quickActions.plantsSub'),   path:'/admin/plants',       color:'#1e77af' },
          { icon:IC.segment, label:t('dashboard.quickActions.segments'), sub:t('dashboard.quickActions.segmentsSub'), path:'/admin/segments',     color:'#5B21B6' },
          { icon:IC.folder,  label:t('dashboard.quickActions.projects'), sub:t('dashboard.quickActions.projectsSub'), path:'/admin/projets',      color:'#d97706' },
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