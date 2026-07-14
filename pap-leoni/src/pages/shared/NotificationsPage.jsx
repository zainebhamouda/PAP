// ═══════════════════════════════════════════════════════════════════
// NotificationsPage.jsx — v5 FINAL PRO
// Branché sur le vrai back · design pro unifié
// ═══════════════════════════════════════════════════════════════════
import { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { notifAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { resolveNotificationLink } from '../../utils/notificationNavigation';

// ── Icons ────────────────────────────────────────────────────────
const I = {
  bell:   <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>,
  trophy: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><polyline points="8 21 12 17 16 21"/><line x1="12" y1="17" x2="12" y2="11"/><path d="M7 4H17a2 2 0 0 1 2 2v1a6 6 0 0 1-6 6 6 6 0 0 1-6-6V6a2 2 0 0 1 2-2z"/></svg>,
  warn:   <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
  clock:  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  check:  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>,
  checks: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="1 12 5 16 13 8"/><polyline points="9 12 13 16 21 8"/></svg>,
  trash:  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6M9 6V4h6v2"/></svg>,
  x:      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  shield: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  user:   <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  info:   <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>,
  arrow:  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>,
  filter: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>,
  search: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
};

// ── Config type notification ──────────────────────────────────────
const TYPE_CFG = {
  CERTIF_TEST_REUSSI:        { ico:I.trophy, label:'Examen réussi',    color:'#1D4ED8', bg:'#c9d4e3'  },
  CERTIF_TEST_ECHOUE:        { ico:I.warn,   label:'Échec examen',     color:'#B91C1C', bg:'#e7d7d7'  },
  CERTIF_OBTENUE:            { ico:I.trophy, label:'Certification',     color:'#0B1E3D', bg:'#cfd3db'  },
  CERTIF_BLOQUE:             { ico:I.warn,   label:'Bloquée',           color:'#B91C1C', bg:'#ebdada'  },
  CERTIF_DEBLOQUE:           { ico:I.check,  label:'Débloquée',         color:'#1D4ED8', bg:'#ced7e1'  },
  CERTIF_PRATIQUE_PRET:      { ico:I.arrow,  label:'Test pratique',     color:'#1652AB', bg:'#cfd6de'  },
  CERTIF_PRATIQUE_REUSSI:    { ico:I.trophy, label:'Pratique réussi',   color:'#0B1E3D', bg:'#d1d8e5'  },
  CERTIF_PRATIQUE_ECHOUE:    { ico:I.warn,   label:'Pratique échoué',   color:'#B91C1C', bg:'#eadada'  },
  CERTIF_A_SIGNER_EXPERT:    { ico:I.shield, label:'Signature requise', color:'#C8982A', bg:'#e8e3d0'  },
  CERTIF_A_SIGNER_CHEF:      { ico:I.shield, label:'Signature chef',    color:'#C8982A', bg:'#f1eee2'  },
  CERTIF_PDF_DISPONIBLE:     { ico:I.info,   label:'PDF disponible',    color:'#1D4ED8', bg:'#d0d5da'  },
  CERTIF_EXPIRE_30J:         { ico:I.clock,  label:'Expire dans 30j',   color:'#C8982A', bg:'#dedacb'  },
  CERTIF_EXPIRE_7J:          { ico:I.clock,  label:'Expire dans 7j',    color:'#B91C1C', bg:'#dfcaca'  },
  CERTIF_EXPIREE:            { ico:I.warn,   label:'Expirée',           color:'#B91C1C', bg:'#d7c6c6'  },
  COMPTE_ACTIVE:             { ico:I.user,   label:'Compte activé',     color:'#1D4ED8', bg:'#c4c6c8'  },
  COMPTE_DESACTIVE:          { ico:I.user,   label:'Compte désactivé',  color:'#64748b', bg:'#cdd4db'  },
  ROLE_CHANGE:               { ico:I.user,   label:'Changement de rôle',color:'#1652AB', bg:'#d7dde5'  },
  SYSTEME:                   { ico:I.info,   label:'Système',           color:'#64748b', bg:'#d8d6d6'  },
  INFORMATION:               { ico:I.info,   label:'Information',       color:'#1D4ED8', bg:'#d7e0eb'  },
  PLANIFICATION_LANCEE_PAR_AUDITEUR: { ico:I.info, label: 'Planification lancée (auditeur)', color:'#0057B8', bg:'#d7e0eb' },
  ALERTE:                    { ico:I.warn,   label:'Alerte',            color:'#B91C1C', bg:'#e9d9d9'  },
  DEFAULT:                   { ico:I.bell,   label:'Notification',      color:'#64748b', bg:'#d5e1ec'  },
};

const getCfg = t => TYPE_CFG[t] || TYPE_CFG.DEFAULT;

function timeAgo(d) {
  if (!d) return '';
  const diff = Date.now() - new Date(d).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return 'À l\'instant';
  if (m < 60) return `${m}min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const j = Math.floor(h / 24);
  if (j < 7)  return `${j}j`;
  return new Date(d).toLocaleDateString('fr-FR', { day:'2-digit', month:'short' });
}

const TABS = [
  { id:'all',    label:'Toutes'       },
  { id:'unread', label:'Non lues'     },
  { id:'certif', label:'Certifications'},
  { id:'alert',  label:'Alertes'      },
  { id:'system', label:'Système'      },
];

function matchTab(n, tab) {
  if (tab === 'all')    return true;
  if (tab === 'unread') return !n.lue;
  if (tab === 'certif') return n.type?.startsWith('CERTIF');
  if (tab === 'alert')  return ['ALERTE','CERTIF_EXPIRE_7J','CERTIF_EXPIRE_30J','CERTIF_EXPIREE'].includes(n.type);
  if (tab === 'system') return ['SYSTEME','INFORMATION','COMPTE_ACTIVE','COMPTE_DESACTIVE','ROLE_CHANGE'].includes(n.type);
  return true;
}

// Données démo si le back ne répond pas encore
const DEMO = [
  { id:1, type:'CERTIF_TEST_REUSSI',  titre:'Examen théorique réussi',    message:'Vous avez réussi l\'examen théorique Câblage Basse Tension avec un score de 80%. Passez maintenant au test pratique.', lue:false, dateCreation:new Date(Date.now()-2*3600000).toISOString(), lienAction:'/auditeur/certif' },
  { id:2, type:'CERTIF_EXPIRE_7J',    titre:'Certification expire dans 7j',message:'Votre certification Étanchéité Connecteur expire dans 7 jours. Renouvelez-la rapidement.', lue:false, dateCreation:new Date(Date.now()-86400000).toISOString(), lienAction:'/auditeur/certif' },
  { id:3, type:'CERTIF_EXPIRE_30J',   titre:'Expiration dans 30 jours',    message:'La certification Soudure Faisceau arrive à expiration dans 30 jours.', lue:false, dateCreation:new Date(Date.now()-2*86400000).toISOString(), lienAction:'/auditeur/certif' },
  { id:4, type:'CERTIF_OBTENUE',      titre:'Certification obtenue',       message:'Félicitations ! Vous êtes certifié(e) Câblage Basse Tension. Votre certificat est disponible.', lue:true, dateCreation:new Date(Date.now()-4*86400000).toISOString(), lienAction:'/auditeur/certif' },
  { id:5, type:'ROLE_CHANGE',         titre:'Votre rôle a été mis à jour', message:'Votre rôle a été mis à jour : Auditeur → Expert Product Audit. Reconnectez-vous pour accéder à votre nouvel espace.', lue:true, dateCreation:new Date(Date.now()-5*86400000).toISOString() },
  { id:6, type:'SYSTEME',             titre:'Bienvenue sur Leoni PAP',     message:'Votre compte a été activé. Consultez vos certifications disponibles pour démarrer.', lue:true, dateCreation:new Date(Date.now()-30*86400000).toISOString() },
];

export default function NotificationsPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [notifs,   setNotifs]   = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [tab,      setTab]      = useState('all');
  const [search,   setSearch]   = useState('');
  const [selected, setSelected] = useState(null);
  const [deleting, setDeleting] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await notifAPI.getAll();
      setNotifs(r.data || DEMO);
    } catch { setNotifs(DEMO); }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const focusNotifId = location.state?.focusNotifId;
    if (!focusNotifId || notifs.length === 0) return;
    const target = notifs.find(n => String(n.id) === String(focusNotifId));
    if (!target || selected?.id === target.id) return;
    setSelected(target);
    if (!target.lue) markRead(target.id);
  }, [location.state, notifs, selected?.id]);

  const markRead = async (id) => {
    try { await notifAPI.marquerLue(id); } catch {}
    setNotifs(ns => ns.map(n => n.id === id ? {...n, lue:true} : n));
    if (selected?.id === id) setSelected(s => ({...s, lue:true}));
  };

  const markAllRead = async () => {
    try { await notifAPI.marquerTout(); } catch {}
    setNotifs(ns => ns.map(n => ({...n, lue:true})));
  };

  const del = async (id, e) => {
    e?.stopPropagation();
    setDeleting(id);
    try { await notifAPI.supprimer(id); } catch {}
    setNotifs(ns => ns.filter(n => n.id !== id));
    if (selected?.id === id) setSelected(null);
    setDeleting(null);
  };

  const handleSelect = (n) => {
    setSelected(n);
    if (!n.lue) markRead(n.id);
  };

  const filtered = notifs.filter(n =>
    matchTab(n, tab) &&
    (!search || n.titre?.toLowerCase().includes(search.toLowerCase()) || n.message?.toLowerCase().includes(search.toLowerCase()))
  );

  const unread = notifs.filter(n => !n.lue).length;
  const tabCount = t => {
    if (t === 'all')    return notifs.length;
    if (t === 'unread') return unread;
    return notifs.filter(n => matchTab(n, t)).length;
  };

  return (
    <div style={{ fontFamily:"'DM Sans',sans-serif", minHeight:'100%' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@700&family=DM+Sans:wght@400;500;600;700&display=swap');
        @keyframes up   { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        @keyframes fade { from{opacity:0} to{opacity:1} }
        @keyframes spin { to{transform:rotate(360deg)} }
        .nitem { transition:background .12s, border-color .12s; cursor:pointer; }
        .nitem:hover { background:#F8FAFC !important; }
        .nitem.sel { background:#EFF6FF !important; border-left:3px solid #0B1E3D !important; }
        .ntab { transition:all .15s; cursor:pointer; }
        .ntab:hover { background:#F1F5F9 !important; }
        .ntab.active { background:#0B1E3D !important; color:#fff !important; border-color:#0B1E3D !important; }
        .ntab.active .nbadge { background:rgba(255,255,255,.2) !important; color:#fff !important; }
        .ndel { transition:all .14s; }
        .ndel:hover { background:#FEF2F2 !important; color:#B91C1C !important; border-color:#FECACA !important; }
        .nmark { transition:all .14s; }
        .nmark:hover { background:#EFF6FF !important; }
      `}</style>

      <div style={{ padding:'1.75rem 2rem', display:'flex', flexDirection:'column', gap:'1.25rem', animation:'fade .3s ease' }}>

        {/* ── Header ── */}
        <div style={{ display:'flex',marginTop:-40, alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:12 }}>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <div style={{ width:46, height:46, borderRadius:13, background:'#0B1E3D', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 4px 14px rgba(11,30,61,.25)' }}>
              {I.bell}
            </div>
            <div>
              <h1 style={{ marginTop:0, fontSize:'1.35rem', fontWeight:900, color:'#0B1E3D', fontFamily:"'Rajdhani',sans-serif", letterSpacing:'-.02em' }}>
                Notifications
              </h1>
              <p style={{ margin:0, fontSize:'.76rem', color:'#94A3B8' }}>
                {notifs.length} notification{notifs.length !== 1 ? 's' : ''} · <span style={{ color: unread > 0 ? '#B91C1C' : '#94A3B8', fontWeight: unread > 0 ? 700 : 400 }}>{unread} non lue{unread !== 1 ? 's' : ''}</span>
              </p>
            </div>
          </div>
          {unread > 0 && (
            <button onClick={markAllRead} style={{ display:'flex', alignItems:'center', gap:7, background:'#f0f4f9', border:'.5px solid #c5ced9', borderRadius:11, padding:'8px 16px', fontSize:'.82rem', fontWeight:700, color:'#0B1E3D', cursor:'pointer', fontFamily:'inherit' }}>
              {I.checks} Tout marquer lu
            </button>
          )}
        </div>

        {/* ── Tabs ── */}
        <div style={{ display:'flex', gap:5, overflowX:'auto', paddingBottom:2 }}>
          {TABS.map(t => {
            const cnt = tabCount(t.id);
            return (
              <button key={t.id} className={`ntab ${tab === t.id ? 'active' : ''}`}
                onClick={() => setTab(t.id)}
                style={{ padding:'6px 14px', borderRadius:10, border:'1.5px solid #E2E8F0', background:'#fff', fontSize:'.8rem', fontWeight:700, color:'#64748b', whiteSpace:'nowrap', fontFamily:'inherit', display:'flex', alignItems:'center', gap:5 }}
              >
                {t.label}
                {cnt > 0 && (
                  <span className="nbadge" style={{ background:'#F1F5F9', color:'#64748b', fontSize:'.65rem', fontWeight:800, padding:'1px 6px', borderRadius:99 }}>
                    {cnt}
                  </span>
                )}
              </button>
            );
          })}
          {/* Recherche */}
          <div style={{ marginLeft:'auto', position:'relative', flexShrink:0 }}>
            <span style={{ position:'absolute', left:11, top:'50%', transform:'translateY(-50%)', color:'#94A3B8' }}>{I.search}</span>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher…"
              style={{ padding:'7px 12px 7px 34px', borderRadius:10, border:'1.5px solid #c9c8c8bd', fontSize:'.8rem', outline:'none', fontFamily:'inherit', width:180 }}
              onFocus={e => e.target.style.borderColor='#0B1E3D'}
              onBlur={e  => e.target.style.borderColor='#acb5c0'}
            />
          </div>
        </div>

        {/* ── Layout 2 colonnes ── */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 380px', gap:'1.25rem', alignItems:'start' }}>

          {/* Liste */}
          <div style={{ background:'#fff', borderRadius:16, border:'.5px solid #E2E8F0', overflow:'hidden', boxShadow:'0 2px 12px rgba(0,0,0,.05)' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 18px', borderBottom:'1px solid #F8FAFC', background:'#FAFBFE' }}>
              <span style={{ fontSize:'.82rem', fontWeight:700, color:'#0B1E3D' }}>
                
                {filtered.length} résultat{filtered.length !== 1 ? 's' : ''}
              </span>
              
              {loading && <span style={{ width:16, height:16, border:'2px solid #E2E8F0', borderTopColor:'#0B1E3D', borderRadius:'50%', display:'inline-block', animation:'spin .7s linear infinite' }}/>}
            </div>

            {loading && notifs.length === 0 ? (
              <div style={{ padding:'3rem', textAlign:'center', color:'#94A3B8' }}>
                <span style={{ width:28, height:28, border:'3px solid #E2E8F0', borderTopColor:'#0B1E3D', borderRadius:'50%', display:'inline-block', animation:'spin .8s linear infinite' }}/>
                <p style={{ marginTop:12 }}>Chargement…</p>
              </div>
            ) : filtered.length === 0 ? (
              <div style={{ padding:'3rem', textAlign:'center', color:'#94A3B8' }}>
                <div style={{ fontSize:'2.5rem', marginBottom:10 }}>🔔</div>
                <p style={{ fontWeight:600 }}>Aucune notification</p>
              </div>
            ) : (
              filtered.map(n => {
                const cfg = getCfg(n.type);
                const isSel = selected?.id === n.id;
                return (
                  <div key={n.id} className={`nitem ${isSel ? 'sel' : ''}`}
                    onClick={() => handleSelect(n)}
                    style={{ display:'flex', gap:12, padding:'13px 18px', borderBottom:'1px solid #F8FAFC', position:'relative', borderLeft: isSel ? '3px solid #0B1E3D' : '3px solid transparent' }}
                  >
                    {/* Point non lu */}
                    {!n.lue && <span style={{ position:'absolute', top:14, right:14, width:7, height:7, borderRadius:'50%', background:'#cd0202' }}/>}

                    {/* Icône type */}
                    <div style={{ width:40, height:40, borderRadius:11, background:cfg.bg, color:cfg.color, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                      {cfg.ico}
                    </div>

                    {/* Contenu */}
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:6, marginBottom:3 }}>
                        <p style={{ margin:0, fontSize:'.84rem', fontWeight: n.lue ? 600 : 800, color:'#0B1E3D', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', maxWidth:260 }}>
                          {n.titre || cfg.label}
                        </p>
                        <span style={{ fontSize:'.7rem', color:'#94A3B8', fontWeight:600, flexShrink:0 }}>{timeAgo(n.dateCreation)}</span>
                      </div>
                      <span style={{ background:cfg.bg, color:cfg.color, fontSize:'.65rem', fontWeight:700, padding:'2px 8px', borderRadius:99, display:'inline-block', marginBottom:4 }}>
                        {cfg.label}
                      </span>
                      <p style={{ margin:0, fontSize:'.78rem', color:'#64748b', lineHeight:1.45, display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden' }}>
                        {n.message}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Panneau détail */}
          <div>
            {selected ? (() => {
              const cfg = getCfg(selected.type);
              return (
                <div style={{ background:'#fff', borderRadius:16, border:'.5px solid #E2E8F0', overflow:'hidden', boxShadow:'0 2px 12px rgba(0,0,0,.05)', position:'sticky', top:80, animation:'up .2s ease' }}>
                  {/* Header detail */}
                  <div style={{ background:'linear-gradient(135deg,#0B1E3D,#1D4ED8)', padding:'1.25rem 1.5rem', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                      <div style={{ width:38, height:38, borderRadius:10, background:'rgba(255,255,255,.15)', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center' }}>
                        {cfg.ico}
                      </div>
                      <span style={{ background:cfg.bg, color:cfg.color, fontSize:'.7rem', fontWeight:700, padding:'3px 10px', borderRadius:99 }}>{cfg.label}</span>
                    </div>
                    <button onClick={() => setSelected(null)}
                      style={{ width:30, height:30, borderRadius:8, background:'rgba(255,255,255,.12)', border:'none', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer' }}>
                      {I.x}
                    </button>
                  </div>

                  {/* Body detail */}
                  <div style={{ padding:'2rem',border:'1px solid #9dbac9' }}>
                    <h3 style={{ margin:'0 0 6px', fontSize:'1rem', fontWeight:800, color:'#0B1E3D', fontFamily:"'Rajdhani',sans-serif" }}>
                      {selected.titre || cfg.label}
                    </h3>
                    <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:'1.25rem', flexWrap:'wrap' }}>
                      <span style={{ fontSize:'.72rem', color:'#94A3B8', fontWeight:600 }}>{timeAgo(selected.dateCreation)}</span>
                      {selected.lue
                        ? <span style={{ background:'#F1F5F9', color:'#64748b', fontSize:'.7rem', fontWeight:700, padding:'2px 8px', borderRadius:99 }}>Lu</span>
                        : <span style={{ background:'#FEF2F2', color:'#B91C1C', fontSize:'.7rem', fontWeight:700, padding:'2px 8px', borderRadius:99 }}>Non lu</span>
                      }
                    </div>

                    <p style={{ margin:'0 0 1.5rem', fontSize:'.87rem', color:'#374151', lineHeight:1.7 }}>
                      {selected.message}
                    </p>

                    <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                      {resolveNotificationLink(selected, user) !== '/notifications' && (
                        <button
                          onClick={() => {
                            markRead(selected.id);
                            const target = resolveNotificationLink(selected, user);
                            if (target) navigate(target, { state: { focusNotifId: selected.id } });
                          }}
                          style={{ display:'flex', alignItems:'center', gap:6, background:'#0B1E3D', color:'#fff', border:'none', borderRadius:10, padding:'8px 16px', fontSize:'.82rem', fontWeight:700, cursor:'pointer' }}>
                          {I.arrow} Ouvrir
                        </button>
                      )}
                      {!selected.lue && (
                        <button className="nmark" onClick={() => markRead(selected.id)}
                          style={{ display:'flex', alignItems:'center', gap:6, background:'#F1F5F9', border:'.5px solid #E2E8F0', color:'#0B1E3D', borderRadius:10, padding:'8px 14px', fontSize:'.82rem', fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>
                          {I.check} Marquer lu
                        </button>
                      )}
                      <button className="ndel" onClick={e => del(selected.id, e)}
                        disabled={deleting === selected.id}
                        style={{ display:'flex', alignItems:'center', gap:6, background:'#c7d3e7', border:'.5px solid #cbcdd0', color:'#64748b', borderRadius:10, padding:'8px 14px', fontSize:'.82rem', fontWeight:700, cursor:'pointer', fontFamily:'inherit', marginLeft:'auto' }}>
                        {I.trash}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })() : (
              <div style={{ background:'#ffffff', borderRadius:16, border:'.5px solid #E2E8F0', padding:'3rem 2rem', textAlign:'center', color:'#94A3B8' }}>
                <div style={{ width:48, height:48, borderRadius:14, background:'#F1F5F9', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 12px', color:'#CBD5E1' }}>{I.bell}</div>
                <p style={{ fontWeight:700, color:'#374151', fontSize:'.9rem', margin:'0 0 6px' }}>Sélectionnez une notification</p>
                <p style={{ fontSize:'.78rem', margin:0 }}>Cliquez sur un élément pour voir les détails</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}