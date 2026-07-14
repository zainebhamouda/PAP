// ═══════════════════════════════════════════════════════════════
// ResponsableAuditsListe.jsx
// Tous les audits — supervision complète — style AdminUtilisateurs
// Route: /responsable/audits
// ═══════════════════════════════════════════════════════════════
import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { auditAPI } from '../../services/auditAPI';

const IC = {
  audit:  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>,
  search: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  close:  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  eye:    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>,
  alert:  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
  tool:   <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>,
  store:  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
  bar:    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
  pdca:   <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>,
};

function fmt(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('fr-FR', { day:'2-digit', month:'short', year:'numeric' });
}

const STATUT_CFG = {
  PLANIFIE:  { label:'Planifié',  color:'#0057B8', bg:'#EFF6FF' },
  EN_COURS:  { label:'En cours',  color:'#C8982A', bg:'#FFF4D6' },
  TERMINE:   { label:'Terminé',   color:'#1A7A4A', bg:'#E6F5EE' },
  ANNULE:    { label:'Annulé',    color:'#6B7280', bg:'#F3F4F6' },
  EN_RETARD: { label:'En retard', color:'#C0392B', bg:'#FDECEA' },
};
const TYPE_CFG = {
  AUDIT_PRODUIT:        { label:'Audit Produit',  color:'#6D28D9', bg:'#EDE9FE', icon:null },
  AUDIT_REGLES_PLATES:  { label:'Règles Plates',  color:'#059669', bg:'#DCFCE7', icon:null },
  AUDIT_MAGASIN_EXPORT: { label:'Magasin Export', color:'#D97706', bg:'#FEF3C7', icon:null },
};
const NATURE_CFG = {
  DESTRUCTIF:     { label:'Destructif',     color:'#DC2626', bg:'#FEE2E2' },
  NON_DESTRUCTIF: { label:'Non destructif', color:'#16A34A', bg:'#DCFCE7' },
};

const STATUT_FILTERS = [
  { key:'TOUS',      label:'Tous'      },
  { key:'PLANIFIE',  label:'Planifiés' },
  { key:'EN_COURS',  label:'En cours'  },
  { key:'TERMINE',   label:'Terminés'  },
  { key:'EN_RETARD', label:'En retard' },
  { key:'ANNULE',    label:'Annulés'   },
];
const TYPE_FILTERS = [
  { key:'TOUS',                 label:'Tous types'     },
  { key:'AUDIT_PRODUIT',        label:'Audit Produit'  },
  { key:'AUDIT_REGLES_PLATES',  label:'Règles Plates'  },
  { key:'AUDIT_MAGASIN_EXPORT', label:'Magasin Export' },
];

function Chip({ item, active, onClick }) {
  return (
    <button onClick={onClick}
      style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'7px 14px', borderRadius:9, border:`1.5px solid ${active?'#082b55':'transparent'}`, fontSize:'.8rem', fontWeight:active?700:600, cursor:'pointer', background:active?'#EFF6FF':'transparent', color:active?'#1D4ED8':'#64748B', fontFamily:'inherit', transition:'all .14s' }}>
      {item.label}
    </button>
  );
}

export default function ResponsableAuditsListe() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [audits,    setAudits]    = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [search,    setSearch]    = useState('');
  const [statut,    setStatut]    = useState(searchParams.get('statut') || 'TOUS');
  const [type,      setType]      = useState('TOUS');
  const [domaine,   setDomaine]   = useState('');
  const [sortField, setSortField] = useState('date');
  const [sortDir,   setSortDir]   = useState('desc');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await auditAPI.getAll();
      setAudits(r.data || []);
    } catch(e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const toggleSort = (f) => {
    if (sortField === f) setSortDir(d => d==='asc'?'desc':'asc');
    else { setSortField(f); setSortDir('desc'); }
  };

  const domaines = [...new Set(audits.map(a => a.domaine).filter(Boolean))];

  const filtered = audits
    .filter(a => statut === 'TOUS' || a.statut === statut)
    .filter(a => type === 'TOUS' || a.typeAudit === type)
    .filter(a => !domaine || a.domaine === domaine)
    .filter(a => {
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        a.reference?.toLowerCase().includes(q) ||
        a.familleCablage?.toLowerCase().includes(q) ||
        a.auditeurNom?.toLowerCase().includes(q) ||
        a.plantNom?.toLowerCase().includes(q) ||
        a.siteNom?.toLowerCase().includes(q) ||
        a.domaine?.toLowerCase().includes(q)
      );
    })
    .sort((a, b) => {
      let va, vb;
      if (sortField === 'date')     { va = a.datePrevue||''; vb = b.datePrevue||''; }
      else if (sortField === 'ref') { va = a.reference||''; vb = b.reference||''; }
      else if (sortField === 'qk')  { va = a.valeurQK??-1; vb = b.valeurQK??-1;
        return sortDir==='asc'?va-vb:vb-va; }
      else if (sortField === 'site') { va = a.siteNom||''; vb = b.siteNom||''; }
      else { va = ''; vb = ''; }
      return sortDir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va);
    });

  const counts = {
    TOUS:      audits.length,
    PLANIFIE:  audits.filter(a=>a.statut==='PLANIFIE').length,
    EN_COURS:  audits.filter(a=>a.statut==='EN_COURS').length,
    TERMINE:   audits.filter(a=>a.statut==='TERMINE').length,
    EN_RETARD: audits.filter(a=>a.statut==='EN_RETARD').length,
    ANNULE:    audits.filter(a=>a.statut==='ANNULE').length,
  };

  const SortTh = ({ field, children, center }) => (
    <th onClick={() => toggleSort(field)} style={{ textAlign:center?'center':'left', padding:'11px 16px', fontSize:'.68rem', fontWeight:800, color:'#64748B', textTransform:'uppercase', letterSpacing:'.08em', whiteSpace:'nowrap', cursor:'pointer', borderBottom:'2px solid #E8EDF7', background:'#d3dbe9', userSelect:'none' }}>
      <span style={{ display:'flex', alignItems:'center', gap:4, justifyContent:center?'center':'flex-start' }}>
        {children}{sortField===field&&<span style={{ color:'#0057B8' }}>{sortDir==='asc'?'↑':'↓'}</span>}
      </span>
    </th>
  );
  const StaticTh = ({ children, center }) => (
    <th style={{ textAlign:center?'center':'left', padding:'11px 16px', fontSize:'.68rem', fontWeight:800, color:'#64748B', textTransform:'uppercase', letterSpacing:'.08em', whiteSpace:'nowrap', borderBottom:'2px solid #E8EDF7', background:'#d3dbe9' }}>{children}</th>
  );

  return (
    <div style={{ fontFamily:"'DM Sans',system-ui,sans-serif", display:'flex', flexDirection:'column', gap:'1.25rem' }}>
      <style>{`
        @keyframes spin    { to{ transform:rotate(360deg) } }
        @keyframes fadeUp  { from{opacity:0;transform:translateY(5px)} to{opacity:1;transform:none} }
        @keyframes slideIn { from{opacity:0;transform:translateX(14px)} to{opacity:1;transform:none} }
        .a-row { transition: background .1s; }
        .a-row:hover { background: #EBF4FF !important; cursor:pointer; }
        .a-row:hover .a-act { opacity:1 !important; }
        .sw3 input:focus { border-color:#0B1E3D!important; box-shadow:0 0 0 3px rgba(11,30,61,.08)!important; }
      `}</style>

      {/* ── HEADER ───────────────────────────────────────────── */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:12 }}>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <div style={{ width:44, height:44, borderRadius:13, background:'linear-gradient(135deg,#0B1E3D,#1E3A5F)', display:'flex', alignItems:'center', justifyContent:'center', color:'#C8982A', boxShadow:'0 4px 16px rgba(11,30,61,.25)' }}>
            {IC.audit}
          </div>
          <div>
            <h2 style={{ margin:0, fontSize:'1.1rem', fontWeight:800, color:'#0B1E3D', letterSpacing:'-.02em' }}>Tous les audits</h2>
            <p style={{ margin:'2px 0 0', fontSize:'.75rem', color:'#94A3B8', fontWeight:500 }}>
              {audits.length} audit{audits.length!==1?'s':''} · {counts.EN_RETARD} en retard · {audits.filter(a=>a.qkDepasseSeuil).length} QK dépassés
            </p>
          </div>
        </div>
        {/* Alertes rapides */}
        <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
          {counts.EN_RETARD > 0 && (
            <div onClick={() => setStatut('EN_RETARD')} style={{ display:'flex', alignItems:'center', gap:6, background:'#FDECEA', border:'1px solid #FECACA', borderRadius:10, padding:'7px 13px', fontSize:'.78rem', fontWeight:700, color:'#C0392B', cursor:'pointer' }}>
              {IC.alert} {counts.EN_RETARD} en retard
            </div>
          )}
          {audits.filter(a=>a.qkDepasseSeuil&&a.statut==='TERMINE').length > 0 && (
            <div style={{ display:'flex', alignItems:'center', gap:6, background:'#EDE9FE', border:'1px solid #C4B5FD', borderRadius:10, padding:'7px 13px', fontSize:'.78rem', fontWeight:700, color:'#6D28D9' }}>
              {IC.bar} {audits.filter(a=>a.qkDepasseSeuil&&a.statut==='TERMINE').length} QK dépassés
            </div>
          )}
          {audits.filter(a=>a.pdcaDeclenche).length > 0 && (
            <div style={{ display:'flex', alignItems:'center', gap:6, background:'#FFF7ED', border:'1px solid #FED7AA', borderRadius:10, padding:'7px 13px', fontSize:'.78rem', fontWeight:700, color:'#D97706' }}>
              {IC.pdca} {audits.filter(a=>a.pdcaDeclenche).length} PDCA ouverts
            </div>
          )}
        </div>
      </div>

      {/* ── TOOLBAR ──────────────────────────────────────────── */}
      <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap', background:'#fff', borderRadius:14, border:'1px solid #E8EDF7', padding:'12px 14px', boxShadow:'0 2px 8px rgba(0,0,0,.04)' }}>
        <div className="sw3" style={{ position:'relative', flex:1, minWidth:220 }}>
          <span style={{ position:'absolute', left:11, top:'50%', transform:'translateY(-50%)', color:'#8998ac', pointerEvents:'none' }}>{IC.search}</span>
          <input type="text" placeholder="Référence, famille, auditeur, site…" value={search} onChange={e=>setSearch(e.target.value)}
            style={{ width:'100%', padding:'9px 36px 9px 35px', borderRadius:9, border:'1.5px solid #888b90', fontSize:'.84rem', outline:'none', boxSizing:'border-box', background:'#F8FAFC', color:'#0B1E3D', fontFamily:'inherit', transition:'border .15s' }} />
          {search && <button onClick={()=>setSearch('')} style={{ position:'absolute', right:10, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', color:'#94A3B8', cursor:'pointer', padding:2 }}>{IC.close}</button>}
        </div>
        <div style={{ width:1, height:28, background:'#E8EDF7', flexShrink:0 }}/>
        {STATUT_FILTERS.map(f => (
          <button key={f.key} onClick={() => setStatut(f.key)}
            style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'7px 13px', borderRadius:9, border:`1.5px solid ${statut===f.key?'#082b55':'transparent'}`, fontSize:'.78rem', fontWeight:statut===f.key?700:600, cursor:'pointer', background:statut===f.key?'#EFF6FF':'transparent', color:statut===f.key?'#1D4ED8':'#64748B', fontFamily:'inherit', transition:'all .14s' }}>
            {f.label}
            <span style={{ background:statut===f.key?'#1D4ED8':'#E2E8F0', color:statut===f.key?'#fff':'#94A3B8', fontSize:'.65rem', fontWeight:800, padding:'1px 6px', borderRadius:99 }}>
              {counts[f.key]}
            </span>
          </button>
        ))}
        <div style={{ width:1, height:28, background:'#E8EDF7', flexShrink:0 }}/>
        {/* Type */}
        <select value={type} onChange={e=>setType(e.target.value)}
          style={{ padding:'8px 12px', borderRadius:9, border:'1.5px solid #E2E8F0', fontSize:'.8rem', color:'#374151', background:'#fff', cursor:'pointer', outline:'none', fontFamily:'inherit' }}>
          {TYPE_FILTERS.map(f=><option key={f.key} value={f.key}>{f.label}</option>)}
        </select>
        {/* Domaine */}
        {domaines.length>0 && (
          <select value={domaine} onChange={e=>setDomaine(e.target.value)}
            style={{ padding:'8px 12px', borderRadius:9, border:'1.5px solid #E2E8F0', fontSize:'.8rem', color:'#374151', background:'#fff', cursor:'pointer', outline:'none', fontFamily:'inherit' }}>
            <option value="">Tous domaines</option>
            {domaines.map(d=><option key={d} value={d}>{d}</option>)}
          </select>
        )}
      </div>

      {/* ── TABLE ────────────────────────────────────────────── */}
      <div style={{ background:'#fff', borderRadius:16, border:'1px solid #E8EDF7', overflow:'hidden', boxShadow:'0 2px 16px rgba(0,0,0,.06)' }}>
        {loading ? (
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'4rem', gap:12, color:'#818fa3' }}>
            <span style={{ width:28, height:28, border:'3px solid #E8EDF7', borderTopColor:'#0B1E3D', borderRadius:'50%', display:'inline-block', animation:'spin .8s linear infinite' }}/>
            <span style={{ fontSize:'.84rem', fontWeight:600 }}>Chargement…</span>
          </div>
        ) : (
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse' }}>
              <thead>
                <tr>
                  <SortTh field="ref">Référence</SortTh>
                  <StaticTh>Type</StaticTh>
                  <StaticTh>Nature</StaticTh>
                  <StaticTh>Famille / Zone</StaticTh>
                  <SortTh field="site">Site / Plant</SortTh>
                  <StaticTh>Auditeur</StaticTh>
                  <StaticTh>Domaine</StaticTh>
                  <SortTh field="date">Date prévue</SortTh>
                  <StaticTh>Statut</StaticTh>
                  <SortTh field="qk" center>QK</SortTh>
                  <StaticTh>PDCA</StaticTh>
                  <StaticTh center>Actions</StaticTh>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={12} style={{ textAlign:'center', padding:'4rem 1rem', color:'#94A3B8', fontSize:'.875rem', fontStyle:'italic' }}>Aucun audit trouvé</td></tr>
                ) : filtered.map((a, i) => {
                  const sc  = STATUT_CFG[a.statut] || { label:a.statut, color:'#6B7280', bg:'#F3F4F6' };
                  const tc  = TYPE_CFG[a.typeAudit] || {};
                  const nc  = NATURE_CFG[a.natureAudit] || null;
                  const isLate = a.statut === 'EN_RETARD';
                  const rowBg  = i%2===0 ? '#FFFFFF' : '#dae1eb';
                  return (
                    <tr key={a.id} className="a-row" style={{ background:rowBg, borderBottom:'1px solid #EEF2F8', animation:`fadeUp .18s ease ${i*.015}s both` }}
                      onClick={() => navigate(`/responsable/audits/${a.id}`)}>
                      {/* Référence */}
                      <td style={{ padding:'13px 16px' }}>
                        <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                          {isLate && <span style={{ color:'#C0392B' }}>{IC.alert}</span>}
                          <span style={{ fontFamily:"'Rajdhani',sans-serif", fontWeight:800, fontSize:'.92rem', color:isLate?'#C0392B':'#0B1E3D' }}>{a.reference}</span>
                        </div>
                      </td>
                      {/* Type */}
                      <td style={{ padding:'13px 16px' }}>
                        <span style={{ background:tc.bg, color:tc.color, fontSize:'.68rem', fontWeight:700, padding:'3px 9px', borderRadius:8, whiteSpace:'nowrap' }}>{tc.label||'—'}</span>
                      </td>
                      {/* Nature */}
                      <td style={{ padding:'13px 16px' }}>
                        {nc ? <span style={{ background:nc.bg, color:nc.color, fontSize:'.68rem', fontWeight:700, padding:'3px 9px', borderRadius:8 }}>{nc.label}</span>
                          : <span style={{ color:'#D1D5DB' }}>—</span>}
                      </td>
                      {/* Famille/Zone */}
                      <td style={{ padding:'13px 16px', maxWidth:130, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', fontSize:'.82rem', color:'#334155', fontWeight:600 }}>
                        {a.familleCablage || a.zoneExpedition || '—'}
                      </td>
                      {/* Site/Plant */}
                      <td style={{ padding:'13px 16px' }}>
                        <div style={{ fontSize:'.82rem', fontWeight:600, color:'#334155' }}>{a.siteNom||'—'}</div>
                        {a.plantNom && <div style={{ fontSize:'.72rem', color:'#9CA3AF', marginTop:1 }}>{a.plantNom}</div>}
                      </td>
                      {/* Auditeur */}
                      <td style={{ padding:'13px 16px', fontSize:'.82rem' }}>
                        {a.auditeurNom
                          ? <span style={{ fontWeight:600, color:'#334155' }}>{a.auditeurNom}</span>
                          : <span style={{ color:'#CBD5E1', fontStyle:'italic' }}>Non assigné</span>}
                      </td>
                      {/* Domaine */}
                      <td style={{ padding:'13px 16px' }}>
                        {a.domaine
                          ? <span style={{ background:'#0B1E3D', color:'#fff', borderRadius:5, padding:'2px 8px', fontSize:'.68rem', fontWeight:700 }}>{a.domaine}</span>
                          : <span style={{ color:'#D1D5DB' }}>—</span>}
                      </td>
                      {/* Date */}
                      <td style={{ padding:'13px 16px', fontSize:'.8rem', color:isLate?'#C0392B':'#374151', fontWeight:isLate?700:400, whiteSpace:'nowrap' }}>
                        {fmt(a.datePrevue)}
                        {a.dateRealisation && <div style={{ fontSize:'.68rem', color:'#9CA3AF', marginTop:1 }}>Réalisé : {fmt(a.dateRealisation)}</div>}
                      </td>
                      {/* Statut */}
                      <td style={{ padding:'13px 16px' }}>
                        <span style={{ background:sc.bg, color:sc.color, fontSize:'.68rem', fontWeight:700, padding:'4px 9px', borderRadius:8, display:'inline-flex', alignItems:'center', gap:4, whiteSpace:'nowrap' }}>
                          <span style={{ width:5, height:5, borderRadius:'50%', background:sc.color }}/>
                          {sc.label}
                        </span>
                      </td>
                      {/* QK */}
                      <td style={{ padding:'13px 16px', textAlign:'center' }}>
                        {a.valeurQK != null ? (() => {
                          let color, bg;
                          if (a.valeurQK === 0) {
                            color = '#059669';
                            bg = '#ECFDF5';
                          } else if (a.valeurQK <= 0.5) {
                            color = '#C8982A';
                            bg = '#FFFBEB';
                          } else if (a.valeurQK <= 1.0) {
                            color = '#9D174D';
                            bg = '#FDF2F8';
                          } else {
                            color = '#DC2626';
                            bg = '#FEF2F2';
                          }
                          return <span style={{ fontFamily:"'Rajdhani',sans-serif", fontSize:'1.1rem', fontWeight:900, color, background:bg, borderRadius:8, padding:'3px 10px', display:'inline-block' }}>
                            {a.valeurQK.toFixed(1)}
                          </span>;
                        })() : <span style={{ color:'#D1D5DB' }}>—</span>}
                      </td>
                      {/* PDCA */}
                      <td style={{ padding:'13px 16px', textAlign:'center' }}>
                        {a.pdcaDeclenche
                          ? <span style={{ background:'#FFF7ED', color:'#D97706', borderRadius:8, padding:'3px 8px', fontSize:'.68rem', fontWeight:700 }}>Ouvert</span>
                          : <span style={{ color:'#D1D5DB', fontSize:'.8rem' }}>—</span>}
                      </td>
                      {/* Actions */}
                      <td style={{ padding:'13px 16px' }}>
                        <div className="a-act" style={{ display:'flex', gap:5, justifyContent:'center', opacity:.7, transition:'opacity .15s' }} onClick={e=>e.stopPropagation()}>
                          <button onClick={() => navigate(`/responsable/audits/${a.id}`)} title="Voir détail"
                            style={{ display:'flex', alignItems:'center', gap:4, padding:'6px 11px', borderRadius:8, background:'#7cc6e0', color:'#1D4ED8', border:'none', cursor:'pointer', fontSize:'.73rem', fontWeight:700, fontFamily:'inherit' }}>
                            {IC.eye} Voir
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {filtered.length > 0 && (
              <div style={{ padding:'10px 20px', borderTop:'1px solid #EEF2F8', background:'#F7F9FC', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                <span style={{ fontSize:'.73rem', color:'#94A3B8', fontWeight:600 }}>{filtered.length} audit{filtered.length!==1?'s':''}{statut!=='TOUS'||type!=='TOUS'?' · filtres actifs':''}</span>
                {(search||statut!=='TOUS'||type!=='TOUS') && (
                  <button onClick={()=>{setSearch('');setStatut('TOUS');setType('TOUS');setDomaine('');}} style={{ fontSize:'.73rem', color:'#60A5FA', fontWeight:700, background:'none', border:'none', cursor:'pointer' }}>
                    Réinitialiser les filtres
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
