import { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';

/* ─── Icônes SVG pro ─── */
const IC = {
  certif:  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/></svg>,
  search:  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  close:   <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  refresh: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>,
  check:   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>,
  lock:    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>,
  unlock:  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 0 9.9-1"/></svg>,
  users:   <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  chart:   <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
  sortUp:  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="18 15 12 9 6 15"/></svg>,
  sortDn:  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="6 9 12 15 18 9"/></svg>,
  cal:     <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  warn:    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
  theo:    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>,
  prat:    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>,
};

const STATUTS = {
  FORMATION_OBLIGATOIRE: { label:'Formation',      bg:'#F5F3FF', c:'#7C3AED', dot:'#7C3AED' },
  THEORIQUE_EN_COURS:    { label:'Théo. en cours', bg:'#EFF6FF', c:'#1D4ED8', dot:'#3B82F6' },
  THEORIQUE_ECHOUE:      { label:'Théo. échoué',   bg:'#FEF2F2', c:'#DC2626', dot:'#EF4444' },
  PRATIQUE_EN_COURS:     { label:'Pratique',        bg:'#F5F3FF', c:'#7C3AED', dot:'#7C3AED' },
  PRATIQUE_ECHOUE:       { label:'Prat. échoué',   bg:'#FEF2F2', c:'#DC2626', dot:'#EF4444' },
  REUSSI:                { label:'Qualifié',        bg:'#ECFDF5', c:'#059669', dot:'#10B981' },
  CERTIFIE:              { label:'Certifié',        bg:'#ECFDF5', c:'#059669', dot:'#10B981' },
  BLOQUE:                { label:'Bloqué',          bg:'#FEF2F2', c:'#DC2626', dot:'#EF4444' },
  ANNULE:                { label:'Annulé',          bg:'#F9FAFB', c:'#9CA3AF', dot:'#9CA3AF' },
};

const AVATARS     = ['#0B1E3D','#1D4ED8','#0369A1','#059669','#7C3AED','#D97706','#DC2626','#0891B2'];
const AVATAR_ACC  = { '#0B1E3D':'#FCD34D','#1D4ED8':'#BFDBFE','#0369A1':'#7DD3FC','#059669':'#6EE7B7','#7C3AED':'#C4B5FD','#D97706':'#FDE68A','#DC2626':'#FCA5A5','#0891B2':'#A5F3FC' };

const fmtDate = d => d ? new Date(d).toLocaleDateString('fr-FR', { day:'2-digit', month:'short', year:'numeric' }) : '—';

function Avatar({ nom, idx = 0 }) {
  const bg = AVATARS[idx % AVATARS.length];
  return (
    <div style={{ width:38, height:38, borderRadius:11, background:bg, color:AVATAR_ACC[bg]||'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'.85rem', fontWeight:800, flexShrink:0 }}>
      {(nom||'?').charAt(0).toUpperCase()}
    </div>
  );
}

function StatutBadge({ statut }) {
  const s = STATUTS[statut] || { label:statut||'—', bg:'#F3F4F6', c:'#6B7280', dot:'#9CA3AF' };
  return (
    <span style={{ display:'inline-flex', alignItems:'center', gap:5, background:s.bg, color:s.c, fontSize:'.68rem', fontWeight:700, padding:'3px 9px', borderRadius:99, whiteSpace:'nowrap', border:`1px solid ${s.c}25` }}>
      <span style={{ width:5, height:5, borderRadius:'50%', background:s.dot, flexShrink:0 }}/>
      {s.label}
    </span>
  );
}

function ScoreChip({ value, max = 100, icon }) {
  if (value == null) return <span style={{ color:'#CBD5E1', fontSize:'.75rem' }}>—</span>;
  const pct   = max === 20 ? Math.round(value * 100 / 20) : Math.round(value);
  const color = pct >= 80 ? '#059669' : pct >= 60 ? '#D97706' : '#DC2626';
  const bg    = pct >= 80 ? '#ECFDF5' : pct >= 60 ? '#FFFBEB' : '#FEF2F2';
  return (
    <span style={{ display:'inline-flex', alignItems:'center', gap:4, background:bg, border:`1px solid ${color}30`, borderRadius:7, padding:'3px 9px', fontSize:'.73rem', fontWeight:700, color }}>
      <span style={{ opacity:.7 }}>{icon}</span>
      {max === 20 ? `${value}/20` : `${value}%`}
    </span>
  );
}

function KpiCard({ label, value, icon, color, bg, onClick, active }) {
  return (
    <div onClick={onClick}
      style={{ background: active ? color : '#fff', borderRadius:14, padding:'1rem 1.1rem', border:`1.5px solid ${active ? color : '#E8EDF7'}`, cursor: onClick ? 'pointer' : 'default', transition:'all .18s', boxShadow: active ? `0 4px 16px ${color}30` : '0 1px 3px rgba(0,0,0,.04)' }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8 }}>
        <div style={{ width:34, height:34, borderRadius:9, background: active ? 'rgba(255,255,255,.2)' : bg, display:'flex', alignItems:'center', justifyContent:'center', color: active ? '#fff' : color }}>
          {icon}
        </div>
      </div>
      <div style={{ fontSize:'1.6rem', fontWeight:900, color: active ? '#fff' : color, lineHeight:1, marginBottom:3 }}>{value}</div>
      <div style={{ fontSize:'.68rem', fontWeight:700, color: active ? 'rgba(255,255,255,.8)' : '#64748B', textTransform:'uppercase', letterSpacing:'.06em' }}>{label}</div>
    </div>
  );
}

export default function ResponsableQualifications() {
  const [passages,      setPassages]      = useState([]);
  const [kpis,          setKpis]          = useState({});
  const [loading,       setLoading]       = useState(true);
  const [filter,        setFilter]        = useState('all');
  const [search,        setSearch]        = useState('');
  const [sortField,     setSortField]     = useState('date');
  const [sortDir,       setSortDir]       = useState('desc');
  const [modeDeblocage, setModeDeblocage] = useState(false);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [rp, rk] = await Promise.allSettled([
        api.get('/responsable-centrale/passages'),
        api.get('/responsable-centrale/dashboard'),
      ]);
      if (rp.status === 'fulfilled') setPassages(rp.value.data || []);
      if (rk.status === 'fulfilled') setKpis(rk.value.data || {});
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  const getStatut = p => {
    if (!p.statut) return '';
    if (typeof p.statut === 'string') return p.statut;
    if (typeof p.statut === 'object' && p.statut.name) return p.statut.name;
    return String(p.statut);
  };

  const toggleSort = f => {
    if (sortField === f) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(f); setSortDir('desc'); }
  };

  const counts = {
    all:      passages.length,
    certifie: passages.filter(p => ['REUSSI','CERTIFIE'].includes(getStatut(p))).length,
    en_cours: passages.filter(p => ['THEORIQUE_EN_COURS','PRATIQUE_EN_COURS','FORMATION_OBLIGATOIRE'].includes(getStatut(p))).length,
    bloque:   passages.filter(p => getStatut(p) === 'BLOQUE').length,
    debloque: passages.filter(p => p.causeDeblocage).length,
  };

  const tauxCertif = passages.length > 0 ? Math.round((counts.certifie / passages.length) * 100) : 0;

  const deblocages = passages
    .filter(p => p.causeDeblocage)
    .sort((a, b) => (b.dateDebut||'').localeCompare(a.dateDebut||''));

  const passFiltres = passages
    .filter(p => {
      const st = getStatut(p);
      if (filter === 'certifie') return ['REUSSI','CERTIFIE'].includes(st);
      if (filter === 'en_cours') return ['THEORIQUE_EN_COURS','PRATIQUE_EN_COURS','FORMATION_OBLIGATOIRE'].includes(st);
      if (filter === 'bloque')   return st === 'BLOQUE';
      return true;
    })
    .filter(p => {
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return [p.auditeurNom, p.auditeurMatricule, p.certificationTitre].some(v => v?.toLowerCase().includes(q));
    })
    .sort((a, b) => {
      if (sortField === 'date') {
        const da = a.dateDebut||''; const db = b.dateDebut||'';
        return sortDir === 'asc' ? da.localeCompare(db) : db.localeCompare(da);
      }
      if (sortField === 'nom') {
        const na = a.auditeurNom||''; const nb = b.auditeurNom||'';
        return sortDir === 'asc' ? na.localeCompare(nb) : nb.localeCompare(na);
      }
      if (sortField === 'score') {
        const sa = a.scoreTheorique??-1; const sb = b.scoreTheorique??-1;
        return sortDir === 'asc' ? sa - sb : sb - sa;
      }
      return 0;
    });

  const SortTh = ({ field, children, center }) => (
    <th onClick={() => toggleSort(field)}
      style={{ textAlign:center?'center':'left', padding:'11px 16px', fontSize:'.67rem', fontWeight:800, color:'#475569', textTransform:'uppercase', letterSpacing:'.08em', whiteSpace:'nowrap', cursor:'pointer', borderBottom:'1.5px solid #E2E8F0', background:'#F8FAFC', userSelect:'none' }}>
      <span style={{ display:'inline-flex', alignItems:'center', gap:4, justifyContent:center?'center':'flex-start' }}>
        {children}
        <span style={{ color: sortField===field?'#1D4ED8':'#CBD5E1', display:'flex' }}>
          {sortField===field ? (sortDir==='asc' ? IC.sortUp : IC.sortDn) : IC.sortDn}
        </span>
      </span>
    </th>
  );
  const StaticTh = ({ children, center }) => (
    <th style={{ textAlign:center?'center':'left', padding:'11px 16px', fontSize:'.67rem', fontWeight:800, color:'#475569', textTransform:'uppercase', letterSpacing:'.08em', borderBottom:'1.5px solid #E2E8F0', background:'#F8FAFC', whiteSpace:'nowrap' }}>
      {children}
    </th>
  );

  return (
    <div style={{ fontFamily:"'Inter','DM Sans',sans-serif", display:'flex', flexDirection:'column', gap:'1.25rem' }}>
      <style>{`
        @keyframes spin   { to{ transform:rotate(360deg) } }
        @keyframes fadeUp { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:none} }
        @keyframes rowIn  { from{opacity:0;transform:translateX(-4px)} to{opacity:1;transform:none} }
        .q-row { transition:background .1s; }
        .q-row:hover { background:#F0F7FF !important; }
      `}</style>

      {/* ── HEADER ── */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:12 }}>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <div style={{ width:46, height:46, borderRadius:13, background:'linear-gradient(135deg,#0B1E3D,#1D4ED8)', display:'flex', alignItems:'center', justifyContent:'center', color:'#FCD34D', boxShadow:'0 4px 16px rgba(11,30,61,.25)' }}>
            {IC.certif}
          </div>
          <div>
            <h2 style={{ margin:0, fontSize:'1.15rem', fontWeight:800, color:'#0B1E3D' }}>Suivi des qualifications</h2>
            <p style={{ margin:'2px 0 0', fontSize:'.75rem', color:'#94A3B8' }}>
              {passages.length} passage{passages.length!==1?'s':''} · {counts.certifie} qualifié{counts.certifie!==1?'s':''} · taux {tauxCertif}%
            </p>
          </div>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          {/* Bouton Déblocages */}
          <button onClick={() => setModeDeblocage(v => !v)}
            style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 14px', borderRadius:9, border:`1.5px solid ${modeDeblocage?'#DC2626':'#E2E8F0'}`, background:modeDeblocage?'#FEF2F2':'#fff', fontSize:'.8rem', fontWeight:700, cursor:'pointer', color:modeDeblocage?'#DC2626':'#374151', fontFamily:'inherit', transition:'all .15s' }}>
            {IC.unlock} Déblocages
            {counts.debloque > 0 && (
              <span style={{ background:modeDeblocage?'#DC2626':'#FEF2F2', color:modeDeblocage?'#fff':'#DC2626', fontSize:'.62rem', fontWeight:800, padding:'1px 7px', borderRadius:99, border:'1px solid #FECACA' }}>
                {counts.debloque}
              </span>
            )}
          </button>
          <button onClick={loadAll}
            style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 14px', borderRadius:9, border:'1.5px solid #E2E8F0', background:'#fff', fontSize:'.8rem', fontWeight:700, cursor:'pointer', color:'#374151', fontFamily:'inherit' }}>
            {IC.refresh} Actualiser
          </button>
        </div>
      </div>

      
      {/* ════ VUE DÉBLOCAGES ════ */}
      {modeDeblocage && (
        <div style={{ animation:'fadeUp .3s ease' }}>
          <div style={{ background:'#FEF2F2', border:'1.5px solid #FECACA', borderRadius:12, padding:'12px 18px', marginBottom:14, display:'flex', alignItems:'center', gap:10 }}>
            <span style={{ color:'#DC2626' }}>{IC.warn}</span>
            <span style={{ fontSize:'.83rem', color:'#991B1B', fontWeight:600 }}>
              Déblocages manuels — lecture seule. Chaque cause est enregistrée et tracée par l'expert.
            </span>
          </div>

          {deblocages.length === 0 ? (
            <div style={{ background:'#fff', borderRadius:14, border:'1.5px dashed #E2E8F0', padding:'3rem', textAlign:'center' }}>
              <div style={{ width:48, height:48, borderRadius:13, background:'#F1F5F9', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 12px', color:'#94A3B8' }}>{IC.unlock}</div>
              <p style={{ fontWeight:700, color:'#374151', margin:'0 0 5px' }}>Aucun déblocage enregistré</p>
              <p style={{ fontSize:'.82rem', color:'#94A3B8', margin:0 }}>Les déblocages manuels effectués par les experts apparaîtront ici.</p>
            </div>
          ) : (
            <div style={{ background:'#fff', borderRadius:16, border:'1px solid #E8EDF7', overflow:'hidden', boxShadow:'0 2px 10px rgba(11,30,61,.06)' }}>
              <div style={{ padding:'12px 20px', background:'linear-gradient(135deg,#FEF2F2,#FFF5F5)', borderBottom:'1px solid #FECACA', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <div style={{ width:6, height:6, borderRadius:'50%', background:'#DC2626' }}/>
                  <span style={{ fontSize:'.75rem', fontWeight:700, color:'#991B1B', textTransform:'uppercase', letterSpacing:'.08em' }}>
                    {deblocages.length} déblocage{deblocages.length!==1?'s':''} manuel{deblocages.length!==1?'s':''}
                  </span>
                </div>
                <span style={{ fontSize:'.7rem', color:'#94A3B8' }}>Trié par date décroissante</span>
              </div>

              {deblocages.map((p, idx) => (
                <div key={p.id||idx} className="q-row"
                  style={{ display:'grid', gridTemplateColumns:'44px 1fr 1fr 2fr 130px', alignItems:'start', gap:16, padding:'16px 20px', borderBottom:idx<deblocages.length-1?'1px solid #FEF2F2':'none', animation:`rowIn .2s ${idx*.04}s ease both` }}>

                  <Avatar nom={p.auditeurNom} idx={idx}/>

                  <div>
                    <div style={{ fontWeight:700, fontSize:'.86rem', color:'#0B1E3D', marginBottom:3 }}>{p.auditeurNom||'—'}</div>
                    <code style={{ background:'#F1F5F9', color:'#475569', padding:'2px 7px', borderRadius:5, fontSize:'.7rem', fontWeight:700, border:'1px solid #E2E8F0' }}>
                      {p.auditeurMatricule||'—'}
                    </code>
                  </div>

                  <div>
                    <div style={{ fontSize:'.8rem', color:'#374151', fontWeight:600, marginBottom:5 }}>{p.certificationTitre||'—'}</div>
                    <StatutBadge statut={getStatut(p)}/>
                    <div style={{ display:'flex', alignItems:'center', gap:4, fontSize:'.7rem', color:'#94A3B8', marginTop:5 }}>
                      {IC.cal} Débloqué le {fmtDate(p.dateDebut)}
                    </div>
                  </div>

                  <div style={{ background:'#FFF5F5', border:'1px solid #FECACA', borderRadius:10, padding:'10px 14px' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:5, marginBottom:6 }}>
                      <span style={{ color:'#DC2626' }}>{IC.warn}</span>
                      <span style={{ fontSize:'.62rem', fontWeight:800, color:'#DC2626', textTransform:'uppercase', letterSpacing:'.06em' }}>Cause du déblocage</span>
                    </div>
                    <div style={{ fontSize:'.8rem', color:'#7F1D1D', lineHeight:1.6 }}>{p.causeDeblocage}</div>
                  </div>

                  <div style={{ display:'flex', flexDirection:'column', gap:5, alignItems:'flex-end' }}>
                    {p.scoreTheorique != null && <ScoreChip value={p.scoreTheorique} max={20} icon={IC.theo}/>}
                    {p.scorePratique  != null && <ScoreChip value={Math.round(p.scorePratique)} max={100} icon={IC.prat}/>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ════ VUE PRINCIPALE ════ */}
      {!modeDeblocage && (
        <>
          {/* Toolbar filtres + recherche */}
          <div style={{ background:'#fff', borderRadius:12, border:'1px solid #E8EDF7', padding:'10px 14px', display:'flex', alignItems:'center', gap:8, flexWrap:'wrap', boxShadow:'0 1px 4px rgba(11,30,61,.04)' }}>
            {[
              { k:'all',      l:'Tous',       n:counts.all,      c:'#0B1E3D' },
              { k:'certifie', l:'Qualifiés',  n:counts.certifie, c:'#059669' },
              { k:'en_cours', l:'En cours',   n:counts.en_cours, c:'#D97706' },
              { k:'bloque',   l:'Bloqués',    n:counts.bloque,   c:'#DC2626' },
            ].map(f => {
              const isOn = filter === f.k;
              return (
                <button key={f.k} onClick={() => setFilter(f.k)}
                  style={{ display:'inline-flex', alignItems:'center', gap:5, padding:'6px 12px', borderRadius:8, border:`1.5px solid ${isOn?f.c:'#E2E8F0'}`, fontSize:'.77rem', fontWeight:700, fontFamily:'inherit', color:isOn?'#fff':'#64748B', background:isOn?f.c:'transparent', cursor:'pointer', transition:'all .14s' }}>
                  {f.l}
                  <span style={{ background:isOn?'rgba(255,255,255,.22)':'#F1F5F9', color:isOn?'#fff':'#94A3B8', fontSize:'.62rem', fontWeight:800, padding:'1px 6px', borderRadius:99 }}>{f.n}</span>
                </button>
              );
            })}

            <div style={{ marginLeft:'auto', position:'relative' }}>
              <span style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', color:'#94A3B8', pointerEvents:'none' }}>{IC.search}</span>
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Nom, matricule, certification…"
                style={{ padding:'7px 30px 7px 30px', borderRadius:9, border:'1.5px solid #E2E8F0', fontSize:'.77rem', outline:'none', fontFamily:'inherit', width:220, boxSizing:'border-box', transition:'border .15s' }}
                onFocus={e => e.target.style.borderColor='#0B1E3D'}
                onBlur={e => e.target.style.borderColor='#E2E8F0'}/>
              {search && (
                <button onClick={() => setSearch('')}
                  style={{ position:'absolute', right:8, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'#94A3B8', padding:2, display:'flex' }}>
                  {IC.close}
                </button>
              )}
            </div>
            <span style={{ fontSize:'.7rem', color:'#94A3B8', fontWeight:600, flexShrink:0 }}>
              {passFiltres.length} résultat{passFiltres.length!==1?'s':''}
            </span>
          </div>

          {/* Table */}
          <div style={{ background:'#fff', borderRadius:16, border:'1px solid #E8EDF7', overflow:'hidden', boxShadow:'0 2px 10px rgba(11,30,61,.06)' }}>
            {loading ? (
              <div style={{ display:'flex', alignItems:'center', justifyContent:'center', padding:'4rem', gap:10, color:'#94A3B8' }}>
                <div style={{ width:24, height:24, border:'2.5px solid #E2E8F0', borderTopColor:'#0B1E3D', borderRadius:'50%', animation:'spin .7s linear infinite' }}/>
                Chargement…
              </div>
            ) : (
              <div style={{ overflowX:'auto' }}>
                <table style={{ width:'100%', borderCollapse:'collapse', minWidth:720 }}>
                  <thead>
                    <tr>
                      <SortTh field="nom">Auditeur</SortTh>
                      <StaticTh>Certification</StaticTh>
                      <StaticTh>Statut</StaticTh>
                      <StaticTh center>Score théorique</StaticTh>
                      <StaticTh center>Score pratique</StaticTh>
                      <StaticTh center>Tentatives</StaticTh>
                      <SortTh field="date">Début</SortTh>
                    </tr>
                  </thead>
                  <tbody>
                    {passFiltres.length === 0 ? (
                      <tr>
                        <td colSpan={7} style={{ textAlign:'center', padding:'3.5rem', color:'#94A3B8', fontSize:'.88rem' }}>
                          {passages.length === 0 ? 'Aucune donnée disponible' : 'Aucun résultat pour ce filtre'}
                        </td>
                      </tr>
                    ) : passFiltres.map((p, idx) => {
                      const st         = getStatut(p);
                      const isBloque   = st === 'BLOQUE';
                      const isCertif   = ['REUSSI','CERTIFIE'].includes(st);
                      const rowBg      = isBloque ? '#FFFBFB' : isCertif ? '#F0FDF4' : idx%2===1 ? '#FAFBFC' : '#fff';
                      const tentatives = (p.nbTentativesTheorique||0) + (p.nbTentativesPratique||0);
                      return (
                        <tr key={p.id||idx} className="q-row"
                          style={{ background:rowBg, borderBottom:'1px solid #F1F5F9', animation:`rowIn .2s ${idx*.018}s ease both` }}>

                          <td style={{ padding:'13px 16px' }}>
                            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                              <Avatar nom={p.auditeurNom} idx={idx}/>
                              <div>
                                <div style={{ fontSize:'.84rem', fontWeight:700, color:'#0B1E3D' }}>{p.auditeurNom||'—'}</div>
                                <code style={{ background:'#F1F5F9', color:'#475569', padding:'1px 6px', borderRadius:5, fontSize:'.68rem', fontWeight:700, border:'1px solid #E2E8F0' }}>
                                  {p.auditeurMatricule||'—'}
                                </code>
                              </div>
                            </div>
                          </td>

                          <td style={{ padding:'13px 16px' }}>
                            <div style={{ fontSize:'.8rem', color:'#374151', fontWeight:600, marginBottom: p.causeDeblocage?4:0 }}>
                              {p.certificationTitre||'—'}
                            </div>
                            {p.causeDeblocage && (
                              <span style={{ display:'inline-flex', alignItems:'center', gap:4, background:'#FEF2F2', border:'1px solid #FECACA', borderRadius:6, padding:'1px 7px', fontSize:'.63rem', fontWeight:700, color:'#DC2626' }}>
                                {IC.unlock} Débloqué
                              </span>
                            )}
                          </td>

                          <td style={{ padding:'13px 16px' }}><StatutBadge statut={st}/></td>

                          <td style={{ padding:'13px 16px', textAlign:'center' }}>
                            <ScoreChip value={p.scoreTheorique} max={20} icon={IC.theo}/>
                          </td>

                          <td style={{ padding:'13px 16px', textAlign:'center' }}>
                            {p.scorePratique != null
                              ? <ScoreChip value={Math.round(p.scorePratique)} max={100} icon={IC.prat}/>
                              : <span style={{ color:'#CBD5E1', fontSize:'.75rem' }}>—</span>}
                          </td>

                          <td style={{ padding:'13px 16px', textAlign:'center' }}>
                            {tentatives > 0
                              ? <span style={{ fontWeight:700, color:tentatives>=3?'#DC2626':tentatives>=2?'#D97706':'#374151', background:tentatives>=3?'#FEF2F2':tentatives>=2?'#FFFBEB':'#F8FAFC', padding:'2px 9px', borderRadius:6, fontSize:'.75rem', border:`1px solid ${tentatives>=3?'#FECACA':tentatives>=2?'#FDE68A':'#E2E8F0'}` }}>
                                {tentatives}
                              </span>
                              : <span style={{ color:'#CBD5E1' }}>—</span>}
                          </td>

                          <td style={{ padding:'13px 16px' }}>
                            <div style={{ display:'flex', alignItems:'center', gap:4, fontSize:'.75rem', color:'#64748B', whiteSpace:'nowrap' }}>
                              <span style={{ color:'#94A3B8' }}>{IC.cal}</span>
                              {fmtDate(p.dateDebut)}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                {passFiltres.length > 0 && (
                  <div style={{ padding:'9px 18px', borderTop:'1px solid #EEF2F8', background:'#F8FAFC', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                    <span style={{ fontSize:'.71rem', color:'#94A3B8', fontWeight:600 }}>
                      {passFiltres.length} passage{passFiltres.length!==1?'s':''}{filter!=='all'?' · filtre actif':''}
                    </span>
                    {(search || filter !== 'all') && (
                      <button onClick={() => { setSearch(''); setFilter('all'); }}
                        style={{ fontSize:'.71rem', color:'#60A5FA', fontWeight:700, background:'none', border:'none', cursor:'pointer', fontFamily:'inherit' }}>
                        Réinitialiser
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}