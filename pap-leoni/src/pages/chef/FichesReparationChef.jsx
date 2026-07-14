import { useState, useEffect, useCallback } from 'react';

/* ═══════════════════════════════════════════════════════════════
   DESIGN TOKENS — identiques à AuditDetailAuditeur
═══════════════════════════════════════════════════════════════ */
const T = {
  navy:'#001F4E', blue:'#003F8A', blueM:'#0057B8',
  gold:'#C8982A', goldL:'#FBF5E8',
  g50:'#F7F9FC', g100:'#EEF2F8', g200:'#d0d5df', g300:'#BCC8DC',
  g400:'#8A9BBC', g500:'#5C6F8A', g700:'#273347',
  success:'#059669', successBg:'#ECFDF5', successBd:'#A7F3D0',
  warn:'#C8982A', warnBg:'#FFFBEB', warnBd:'#FCD34D',
  danger:'#DC2626', dangerBg:'#FEF2F2', dangerBd:'#FECACA',
  info:'#2563EB', infoBg:'#EFF6FF', infoBd:'#BFDBFE',
  rose:'#9D174D', roseBg:'#FDF2F8', roseBd:'#F9A8D4',
  orange:'#D97706', orangeBg:'#FFF7ED', orangeBd:'#FED7AA',
  purple:'#7C3AED', purpleBg:'#F5F3FF', purpleBd:'#DDD6FE',
  teal:'#0D9488', tealBg:'#F0FDFA', tealBd:'#99F6E4',
};

const API = 'http://localhost:8080/api';
const apiH = () => ({ Authorization:`Bearer ${localStorage.getItem('token')}`, 'Content-Type':'application/json' });

const fmt = d => {
  if (!d) return '—';
  try { return new Date(d).toLocaleDateString('fr-FR',{day:'2-digit',month:'short',year:'numeric'}); }
  catch { return d; }
};

/* ═══════════════════════════════════════════════════════════════
   CSS GLOBAL — même style que AuditDetailAuditeur
═══════════════════════════════════════════════════════════════ */
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&family=DM+Sans:wght@300;400;500;600;700&display=swap');
  * { box-sizing: border-box; }

  .frc-root {
    font-family: 'DM Sans','Plus Jakarta Sans',sans-serif;
  }

  @keyframes fadeUp   { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:none} }
  @keyframes fadeIn   { from{opacity:0} to{opacity:1} }
  @keyframes popIn    { from{opacity:0;transform:scale(.96)} to{opacity:1;transform:scale(1)} }
  @keyframes spin     { to{transform:rotate(360deg)} }
  @keyframes slideDown{ from{opacity:0;transform:translateY(-8px)} to{opacity:1;transform:none} }
  @keyframes pulse2   { 0%,100%{opacity:1} 50%{opacity:.45} }

  .frc-card { animation: fadeUp .3s ease both; }
  .frc-row  { transition: background .14s, box-shadow .14s; }
  .frc-row:hover { background: #F8FAFC !important; box-shadow: 0 4px 16px rgba(0,0,0,.07); }
  .frc-tab  { transition: all .14s; cursor: pointer; border: none; font-family: inherit; }
  .frc-tab.on { background: #fff !important; color: #001F4E !important; box-shadow: 0 2px 8px rgba(0,0,0,.1); }
  .frc-tab:hover:not(.on) { background: #E2E8F0 !important; }
  .frc-btn  { transition: all .15s; cursor: pointer; }
  .frc-btn:hover { filter: brightness(.92); transform: translateY(-1px); }
  .frc-stat { transition: box-shadow .15s, transform .15s; }
  .frc-stat:hover { box-shadow: 0 8px 24px rgba(0,0,0,.1) !important; transform: translateY(-2px); }

  input:focus, textarea:focus, select:focus {
    outline: none;
    border-color: #2563EB !important;
    box-shadow: 0 0 0 3px rgba(37,99,235,.12);
  }
`;

/* ═══════════════════════════════════════════════════════════════
   ICÔNES SVG
═══════════════════════════════════════════════════════════════ */
const IC = {
  wrench:   <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>,
  check:    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>,
  clock:    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  alert:    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
  user:     <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  cal:      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  clip:     <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M9 3h6a2 2 0 0 1 2 2v1H7V5a2 2 0 0 1 2-2z"/><rect x="7" y="4" width="10" height="18" rx="2"/></svg>,
  arrow:    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>,
  info:     <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>,
  shield:   <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  refresh:  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="1 4 1 10 7 10"/><polyline points="23 20 23 14 17 14"/><path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4-4.64 4.36A9 9 0 0 1 3.51 15"/></svg>,
  x:        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
};

function Spin() {
  return <span style={{ width:14, height:14, border:'2px solid rgba(255,255,255,.3)', borderTopColor:'#fff', borderRadius:'50%', animation:'spin .6s linear infinite', display:'inline-block' }}/>;
}
function SpinDark() {
  return <span style={{ width:16, height:16, border:'2px solid #E2E8F0', borderTopColor:'#001F4E', borderRadius:'50%', animation:'spin .7s linear infinite', display:'inline-block' }}/>;
}

/* ═══════════════════════════════════════════════════════════════
   STAT CARD
═══════════════════════════════════════════════════════════════ */
function StatCard({ label, value, sub, accent, icon }) {
  return (
    <div className="frc-stat" style={{ background:'#fff', borderRadius:14, padding:'1.1rem 1.25rem', flex:1, minWidth:140, border:'1px solid #E8EDF7', boxShadow:'0 2px 8px rgba(0,0,0,.04)', borderTop:`3px solid ${accent}` }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8 }}>
        <span style={{ fontSize:'.72rem', fontWeight:700, color:T.g400, textTransform:'uppercase', letterSpacing:'.06em' }}>{label}</span>
        <div style={{ width:30, height:30, borderRadius:8, background:`${accent}18`, color:accent, display:'flex', alignItems:'center', justifyContent:'center' }}>{icon}</div>
      </div>
      <div style={{ fontSize:'1.75rem', fontWeight:800, color:T.navy, lineHeight:1 }}>{value}</div>
      {sub && <div style={{ fontSize:'.72rem', color:T.g400, marginTop:4 }}>{sub}</div>}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   QK BADGE
═══════════════════════════════════════════════════════════════ */
function QkBadge({ val }) {
  if (val == null) return null;
  const n = Number(val);
  let color = T.success, bg = T.successBg, bd = T.successBd, label = 'QK = 0';
  if (n > 0 && n <= 0.5) { color = T.orange; bg = T.orangeBg; bd = T.orangeBd; label = `QK ${n}`; }
  else if (n > 0.5 && n <= 1) { color = T.rose; bg = T.roseBg; bd = T.roseBd; label = `QK ${n}`; }
  else if (n > 1) { color = T.danger; bg = T.dangerBg; bd = T.dangerBd; label = `QK ${n}`; }
  return (
    <span style={{ display:'inline-flex', alignItems:'center', gap:4, background:bg, color, border:`1px solid ${bd}`, borderRadius:99, fontSize:'.68rem', fontWeight:700, padding:'2px 9px' }}>
      {IC.alert} {label}
    </span>
  );
}

/* ═══════════════════════════════════════════════════════════════
   STEP FLOW
═══════════════════════════════════════════════════════════════ */
function StepFlow({ valideChef, valideExpert }) {
  const Step = ({ done, label }) => (
    <div style={{ display:'flex', alignItems:'center', gap:6, background: done ? T.successBg : T.g50, borderRadius:8, padding:'5px 10px', border:`1px solid ${done ? T.successBd : T.g200}` }}>
      <span style={{ width:7, height:7, borderRadius:'50%', background: done ? T.success : T.g300, flexShrink:0, display:'inline-block', boxShadow: done ? `0 0 0 2px ${T.success}28` : 'none' }}/>
      <span style={{ fontSize:'.72rem', color: done ? T.success : T.g400, fontWeight: done ? 700 : 500 }}>{label} {done ? '✓' : '…'}</span>
    </div>
  );
  return (
    <div style={{ display:'flex', alignItems:'center', gap:6, flexWrap:'wrap' }}>
      <Step done={valideChef} label="Chef de service"/>
      <span style={{ color:T.g300, fontSize:12 }}>→</span>
      <Step done={valideExpert} label="Expert produit"/>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   FICHE CARD
═══════════════════════════════════════════════════════════════ */
function FicheCard({ fiche, onValider }) {
  const [commentaire, setCommentaire] = useState('');
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(!fiche.valideChef);

  const valider = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `${API}/audit-produit/fiche-reparation/${fiche.id}/valider-chef?commentaire=${encodeURIComponent(commentaire)}`,
        { method:'POST', headers:apiH() }
      );
      if (!res.ok) throw new Error(await res.text());
      onValider(fiche.id, commentaire);
    } catch(e) { alert('Erreur : ' + e.message); }
    setLoading(false);
  };

  const isValidee = fiche.valideChef;

  return (
    <div className="frc-row frc-card" style={{
      background: isValidee ? T.successBg : '#fff',
      borderRadius: 14,
      border: `1.5px solid ${isValidee ? T.successBd : T.g200}`,
      overflow: 'hidden',
      marginBottom: 10,
    }}>
      {/* Barre accent top */}
      <div style={{ height: 3, background: isValidee ? T.success : T.danger }}/>

      {/* Header cliquable */}
      <div
        onClick={() => setExpanded(e => !e)}
        style={{ padding:'1rem 1.25rem', cursor:'pointer', display:'flex', alignItems:'center', gap:14 }}
      >
        {/* Icône statut */}
        <div style={{ width:40, height:40, borderRadius:11, flexShrink:0, background: isValidee ? T.successBg : T.dangerBg, color: isValidee ? T.success : T.danger, display:'flex', alignItems:'center', justifyContent:'center', border:`1px solid ${isValidee ? T.successBd : T.dangerBd}` }}>
          {isValidee ? IC.check : IC.wrench}
        </div>

        {/* Infos principales */}
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:5, flexWrap:'wrap' }}>
            <span style={{ fontWeight:700, fontSize:'.9rem', color:T.navy }}>Fiche #{fiche.id}</span>

            {/* Badge statut */}
            <span style={{ display:'inline-flex', alignItems:'center', gap:4, padding:'2px 9px', borderRadius:99, fontSize:'.68rem', fontWeight:700, background: isValidee ? T.successBg : T.dangerBg, color: isValidee ? T.success : T.danger, border:`1px solid ${isValidee ? T.successBd : T.dangerBd}` }}>
              {isValidee ? <>{IC.check} Validée</> : <><span style={{ width:6,height:6,borderRadius:'50%',background:T.danger,display:'inline-block',animation:'pulse2 1.4s ease infinite' }}/> À valider</>}
            </span>

            <QkBadge val={fiche.valeurQK}/>

            {fiche.zoneAffectee && (
              <span style={{ background:T.infoBg, color:T.info, border:`1px solid ${T.infoBd}`, padding:'2px 9px', borderRadius:99, fontSize:'.68rem', fontWeight:600 }}>
                {fiche.zoneAffectee}
              </span>
            )}
          </div>

          <div style={{ display:'flex', alignItems:'center', gap:10, flexWrap:'wrap' }}>
            {[
              fiche.auditReference && { ic: IC.clip, v: fiche.auditReference },
              fiche.serieNom       && { ic: IC.shield, v: fiche.serieNom },
              fiche.auditeurNom    && { ic: IC.user, v: fiche.auditeurNom },
              fiche.dateCreation   && { ic: IC.cal, v: fmt(fiche.dateCreation) },
            ].filter(Boolean).map((x, i) => (
              <span key={i} style={{ display:'flex', alignItems:'center', gap:4, fontSize:'.72rem', color:T.g400, fontWeight:500 }}>
                <span style={{ opacity:.6 }}>{x.ic}</span>{x.v}
              </span>
            ))}
          </div>
        </div>

        {/* Chevron */}
        <span style={{ color:T.g300, transform: expanded ? 'rotate(90deg)' : 'none', transition:'transform .2s', flexShrink:0 }}>
          {IC.arrow}
        </span>
      </div>

      {/* Corps expandable */}
      {expanded && (
        <div style={{ borderTop:`1px solid ${isValidee ? T.successBd : T.g100}`, animation:'fadeUp .2s ease' }}>

          {/* Champs détail */}
          <div style={{ padding:'1rem 1.25rem' }}>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:12 }}>
              {[
                { l:'Zone affectée',   v: fiche.zoneAffectee },
                { l:'Code article',    v: fiche.codeArticle },
                { l:'Origine NC',      v: fiche.origineNC },
                { l:'Date création',   v: fmt(fiche.dateCreation) },
              ].map(f => (
                <div key={f.l} style={{ background: isValidee ? 'rgba(255,255,255,.7)' : T.g50, borderRadius:9, padding:'9px 12px', border:`1px solid ${isValidee ? T.successBd : T.g200}` }}>
                  <div style={{ fontSize:'.65rem', fontWeight:700, color:T.g400, textTransform:'uppercase', letterSpacing:'.06em', marginBottom:3 }}>{f.l}</div>
                  <div style={{ fontSize:'.82rem', color:T.navy, fontWeight:600 }}>{f.v || '—'}</div>
                </div>
              ))}
            </div>

            {/* Description NC */}
            {fiche.descriptionNC && (
              <div style={{ background: isValidee ? 'rgba(255,255,255,.7)' : T.g50, borderRadius:9, padding:'10px 12px', border:`1px solid ${isValidee ? T.successBd : T.g200}`, marginBottom:12 }}>
                <div style={{ fontSize:'.65rem', fontWeight:700, color:T.g400, textTransform:'uppercase', letterSpacing:'.06em', marginBottom:4 }}>Description Non-Conformité</div>
                <div style={{ fontSize:'.83rem', color:T.navy, lineHeight:1.6 }}>{fiche.descriptionNC}</div>
              </div>
            )}

            {/* Workflow */}
            <StepFlow valideChef={fiche.valideChef} valideExpert={fiche.valideExpert}/>

            {/* Commentaire chef si validé */}
            {isValidee && fiche.commentaireChef && (
              <div style={{ marginTop:10, background:'rgba(255,255,255,.7)', borderRadius:9, padding:'9px 12px', border:`1px solid ${T.successBd}` }}>
                <div style={{ fontSize:'.65rem', fontWeight:700, color:T.success, textTransform:'uppercase', letterSpacing:'.06em', marginBottom:3 }}>Commentaire Chef</div>
                <div style={{ fontSize:'.82rem', color:T.navy, fontStyle:'italic' }}>"{fiche.commentaireChef}"</div>
              </div>
            )}
          </div>

          {/* Zone validation (seulement si non validé par chef) */}
          {!isValidee && (
            <div style={{ borderTop:`1px solid ${T.g100}`, padding:'1rem 1.25rem', background:T.g50 }}>
              <div style={{ fontSize:'.68rem', fontWeight:700, color:T.g500, textTransform:'uppercase', letterSpacing:'.06em', marginBottom:6 }}>Commentaire (optionnel)</div>
              <textarea
                rows={2}
                style={{ width:'100%', padding:'9px 12px', border:`1.5px solid ${T.g200}`, borderRadius:9, fontSize:'.82rem', fontFamily:'inherit', resize:'vertical', outline:'none', background:'#fff', boxSizing:'border-box', marginBottom:10, color:T.navy, lineHeight:1.5 }}
                placeholder="Ajoutez un commentaire avant de valider…"
                value={commentaire}
                onChange={e => setCommentaire(e.target.value)}
              />
              <button
                className="frc-btn"
                onClick={valider}
                disabled={loading}
                style={{ display:'inline-flex', alignItems:'center', gap:7, background: loading ? T.g300 : T.info, color:'#fff', border:'none', cursor: loading ? 'not-allowed' : 'pointer', fontFamily:'inherit', fontSize:'.83rem', fontWeight:700, padding:'9px 20px', borderRadius:9, boxShadow:`0 2px 8px ${T.info}35` }}>
                {loading ? <><Spin/> Validation…</> : <>{IC.check} Valider </>}
              </button>
            </div>
          )}

          {/* Message "en attente expert" */}
          {isValidee && !fiche.valideExpert && (
            <div style={{ margin:'0 1.25rem 1rem', background:'rgba(255,255,255,.7)', border:`1px solid ${T.successBd}`, borderRadius:9, padding:'9px 14px', display:'flex', alignItems:'center', gap:8 }}>
              <span style={{ color:T.success, display:'flex' }}>{IC.check}</span>
              <span style={{ fontSize:'.78rem', fontWeight:700, color:'#065F46' }}>Validé par vous · En attente de la validation Expert Produit</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   BARRE STATISTIQUE ZONES
═══════════════════════════════════════════════════════════════ */
function ZoneBar({ fiches }) {
  const zones = ['Production', 'Réception', 'Expéditions', 'Magasin', 'Client', 'Autre'];
  const colors = [T.info, T.danger, T.orange, T.success, T.purple, T.g400];
  const total = fiches.length || 1;

  const data = zones.map((z, i) => ({
    label: z, color: colors[i],
    count: fiches.filter(f => f.zoneAffectee?.toLowerCase() === z.toLowerCase()).length,
  })).filter(x => x.count > 0);

  if (data.length === 0) return (
    <div style={{ fontSize:'.78rem', color:T.g400, fontStyle:'italic', textAlign:'center', padding:'1rem 0' }}>Aucune donnée de zone</div>
  );

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
      {data.map(z => (
        <div key={z.label} style={{ display:'flex', alignItems:'center', gap:10 }}>
          <span style={{ fontSize:'.72rem', color:T.g500, fontWeight:600, width:90, flexShrink:0 }}>{z.label}</span>
          <div style={{ flex:1, height:8, borderRadius:99, background:T.g100, overflow:'hidden' }}>
            <div style={{ height:'100%', width:`${Math.round(z.count/total*100)}%`, background:z.color, borderRadius:99, transition:'width .6s ease' }}/>
          </div>
          <span style={{ fontSize:'.72rem', fontWeight:700, color:z.color, width:20, textAlign:'right' }}>{z.count}</span>
        </div>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   DISTRIBUTION QK
═══════════════════════════════════════════════════════════════ */
function QkDistrib({ fiches }) {
  const items = [
    { label:'Conforme', range:'= 0', color:T.success, bg:T.successBg, bd:T.successBd, count: fiches.filter(f => Number(f.valeurQK) === 0).length },
    { label:'Mineure',  range:'≤ 0.5', color:T.orange, bg:T.orangeBg, bd:T.orangeBd, count: fiches.filter(f => { const v=Number(f.valeurQK); return v>0&&v<=0.5; }).length },
    { label:'Corrective', range:'≤ 1', color:T.rose, bg:T.roseBg, bd:T.roseBd, count: fiches.filter(f => { const v=Number(f.valeurQK); return v>0.5&&v<=1; }).length },
    { label:'Critique', range:'> 1', color:T.danger, bg:T.dangerBg, bd:T.dangerBd, count: fiches.filter(f => Number(f.valeurQK) > 1).length },
  ];
  const max = Math.max(...items.map(i => i.count), 1);

  return (
    <div style={{ display:'flex', gap:10 }}>
      {items.map(item => (
        <div key={item.label} style={{ flex:1, background:item.bg, border:`1px solid ${item.bd}`, borderRadius:12, padding:'10px 10px 8px', textAlign:'center' }}>
          <div style={{ fontSize:'1.4rem', fontWeight:800, color:item.color, marginBottom:2 }}>{item.count}</div>
          <div style={{ fontSize:'.68rem', fontWeight:700, color:item.color, marginBottom:1 }}>{item.label}</div>
          <div style={{ fontSize:'.62rem', color:item.color, opacity:.7 }}>QK {item.range}</div>
        </div>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   PAGE PRINCIPALE
═══════════════════════════════════════════════════════════════ */
export default function FichesReparationChef() {
  const [fiches, setFiches]       = useState([]);
  const [loading, setLoading]     = useState(true);
  const [tab, setTab]             = useState('attente');
  const [notif, setNotif]         = useState(null);
  const [refreshing, setRefresh]  = useState(false);

const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true); else setRefresh(true);
    try {
        // Utiliser le nouvel endpoint qui retourne TOUTES les fiches
        const res = await fetch(`${API}/audit-produit/fiche-reparation/mes-fiches`, { headers: apiH() });
        const data = await res.json();
        setFiches(Array.isArray(data) ? data : []);
    } catch (e) {
        console.error(e);
        setFiches([]);
    }
    if (!silent) setLoading(false); else setRefresh(false);
}, []);

  useEffect(() => { load(); }, [load]);

  const showNotif = (msg, type='success') => {
    setNotif({ msg, type });
    setTimeout(() => setNotif(null), 4000);
  };

  // Quand on valide : on met à jour la fiche dans la liste (statut → validée)
  // Elle reste dans la liste avec le nouveau statut
  const onValider = (id, commentaire) => {
    setFiches(prev => prev.map(f =>
      f.id === id
        ? { ...f, valideChef: true, commentaireChef: commentaire }
        : f
    ));
    showNotif('Fiche #' + id + ' validée avec succès ✓');
  };

  const enAttente = fiches.filter(f => !f.valideChef);
  const validees  = fiches.filter(f => f.valideChef);
  const total     = fiches.length;
  const taux      = total > 0 ? Math.round(validees.length / total * 100) : 0;

  const displayed = tab === 'attente' ? enAttente : validees;

  return (
    <div className="frc-root" style={{ padding:'1.25rem' }}>
      <style>{CSS}</style>

      {/* ── TOAST ── */}
      {notif && (
        <div style={{
          position:'fixed', top:16, right:16, zIndex:3000,
          background: notif.type==='success' ? T.successBg : T.dangerBg,
          border: `1.5px solid ${notif.type==='success' ? T.successBd : T.dangerBd}`,
          color: notif.type==='success' ? T.success : T.danger,
          padding:'11px 18px', borderRadius:12, fontWeight:700, fontSize:'.82rem',
          boxShadow:'0 8px 28px rgba(0,0,0,.14)', animation:'slideDown .2s ease', maxWidth:360,
          display:'flex', alignItems:'center', gap:8,
        }}>
          {notif.type==='success' ? IC.check : IC.alert} {notif.msg}
        </div>
      )}

      <div style={{ width:'100%' }}>

        {/* ── TOPBAR HEADER ── */}
        <div style={{
          background:'#002855',
          borderRadius:16,
          marginBottom:20,
          marginTop:-30,
          padding:'1.1rem 1.5rem',
          display:'flex', alignItems:'center', justifyContent:'space-between', gap:16,
          boxShadow:'0 8px 28px rgba(0,40,85,.16)',
        }}>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <div style={{ width:42, height:42, borderRadius:11, background:'rgba(255,255,255,.12)', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff' }}>
              {IC.wrench}
            </div>
            <div>
              <div style={{ fontSize:'.6rem', fontWeight:700, color:'rgba(255,255,255,.45)', textTransform:'uppercase', letterSpacing:'.1em', marginBottom:2 }}>Chef de Service — Validation Niveau 1</div>
              <div style={{ fontWeight:800, fontSize:'1.1rem', color:'#fff' }}>Fiches de Réparation</div>
            </div>
          </div>
          <button
            className="frc-btn"
            onClick={() => load(true)}
            disabled={refreshing}
            style={{ display:'flex', alignItems:'center', gap:6, background:'rgba(255,255,255,.12)', border:'1px solid rgba(255,255,255,.22)', borderRadius:9, padding:'8px 14px', color:'#fff', fontFamily:'inherit', fontSize:'.78rem', fontWeight:700, cursor:'pointer' }}>
            <span style={{ display:'inline-flex', animation: refreshing ? 'spin .7s linear infinite' : 'none' }}>{IC.refresh}</span>
            Actualiser
          </button>
        </div>

        {/* ── KPIs ── */}
        <div style={{ display:'flex', gap:12, marginBottom:20, flexWrap:'wrap' }} className="frc-card">
          <StatCard label="En attente" value={enAttente.length} sub="à valider" accent={T.danger}
            icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>}/>
          <StatCard label="Validées" value={validees.length} sub="niveau 1 ✓" accent={T.success}
            icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>}/>
          <StatCard label="Taux de traitement" value={`${taux} %`} sub={`${total} fiche${total!==1?'s':''} reçues`} accent={T.info}
            icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>}/>
        </div>

        {/* ── ANALYTICS ROW ── */}
        {total > 0 && (
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:20 }} className="frc-card">

            {/* Distribution QK */}
            <div style={{ background:'#fff', borderRadius:14, padding:'1.1rem 1.25rem', border:'1px solid #E8EDF7', boxShadow:'0 2px 8px rgba(0,0,0,.04)' }}>
              <div style={{ fontWeight:700, fontSize:'.88rem', color:T.navy, marginBottom:3 }}>Distribution QK</div>
              <div style={{ fontSize:'.72rem', color:T.g400, marginBottom:14 }}>Criticité des non-conformités</div>
              <QkDistrib fiches={fiches}/>
            </div>

            {/* Répartition par zone */}
            <div style={{ background:'#fff', borderRadius:14, padding:'1.1rem 1.25rem', border:'1px solid #E8EDF7', boxShadow:'0 2px 8px rgba(0,0,0,.04)' }}>
              <div style={{ fontWeight:700, fontSize:'.88rem', color:T.navy, marginBottom:3 }}>Répartition par zone</div>
              <div style={{ fontSize:'.72rem', color:T.g400, marginBottom:14 }}>Non-conformités par zone affectée</div>
              <ZoneBar fiches={fiches}/>
            </div>
          </div>
        )}

        {/* ── TABS ── */}
        <div style={{ display:'flex', gap:5, marginBottom:14, background:T.g100, padding:4, borderRadius:11, width:'fit-content', border:`1px solid ${T.g200}` }} className="frc-card">
          {[
            { k:'attente', l:`En attente`, count: enAttente.length, accent: T.danger },
            { k:'validees', l:`Validées`,  count: validees.length,  accent: T.success },
          ].map(t => (
            <button key={t.k} className={`frc-tab ${tab===t.k?'on':''}`} onClick={() => setTab(t.k)}
              style={{ padding:'7px 16px', borderRadius:8, background:'transparent', color:T.g400, fontSize:'.8rem', fontWeight:700 }}>
              {t.l}
              {t.count > 0 && (
                <span style={{ marginLeft:6, background: tab===t.k ? `${t.accent}18` : T.g200, color: tab===t.k ? t.accent : T.g400, padding:'1px 7px', borderRadius:99, fontSize:'.68rem', fontWeight:700 }}>
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ── CONTENU ── */}
        {loading ? (
          <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:220, gap:10, color:T.g400, background:'#fff', borderRadius:14, border:`1px solid ${T.g200}` }}>
            <SpinDark/> <span style={{ fontSize:'.88rem', fontWeight:500 }}>Chargement…</span>
          </div>
        ) : displayed.length === 0 ? (
          <div style={{ textAlign:'center', padding:'4rem 2rem', background:'#fff', borderRadius:14, border:`1.5px dashed ${T.g200}`, animation:'fadeUp .3s ease' }}>
            <div style={{ width:56, height:56, borderRadius:16, background: tab==='attente' ? T.successBg : T.g100, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 14px', color: tab==='attente' ? T.success : T.g300 }}>
              {tab==='attente' ? IC.check : IC.info}
            </div>
            <div style={{ fontWeight:700, color:T.navy, marginBottom:5, fontSize:'.95rem' }}>
              {tab==='attente' ? 'Toutes les fiches ont été traitées' : 'Aucune fiche validée'}
            </div>
            <div style={{ fontSize:'.8rem', color:T.g400 }}>
              {tab==='attente' ? 'Excellent travail ! Aucune fiche en attente.' : 'Les fiches que vous validez apparaîtront ici.'}
            </div>
          </div>
        ) : (
          <div style={{ animation:'fadeUp .3s ease' }}>
            {/* Barre progression si onglet attente */}
            {tab === 'attente' && total > 0 && (
              <div style={{ background:'#fff', borderRadius:12, padding:'10px 14px', marginBottom:12, border:`1px solid ${T.g200}`, display:'flex', alignItems:'center', gap:12 }}>
                <div style={{ flex:1, height:6, borderRadius:99, background:T.g100, overflow:'hidden' }}>
                  <div style={{ height:'100%', width:`${taux}%`, background:`linear-gradient(90deg,${T.info},${T.success})`, borderRadius:99, transition:'width .6s ease' }}/>
                </div>
                <span style={{ fontSize:'.72rem', fontWeight:700, color:T.g500, whiteSpace:'nowrap' }}>{taux}% traité ({validees.length}/{total})</span>
              </div>
            )}

            {displayed.map((f, i) => (
              <div key={f.id} style={{ animationDelay:`${i*.04}s` }}>
                <FicheCard fiche={f} onValider={onValider}/>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}