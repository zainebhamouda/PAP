import { useState, useEffect, useMemo, useCallback } from 'react';
import { planificationAPI } from '../../services/api';

const IC = {
  search: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  export: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>,
  eye:    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>,
  clock:  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  close:  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
};

const STATUT_CFG = {
  BROUILLON: { bg:'#F3F4F6', text:'#6B7280', label:'Brouillon' },
  LANCE:     { bg:'#E6F5EE', text:'#1A7A4A', label:'Lancée'   },
  TERMINE:   { bg:'#EFF6FF', text:'#1D4ED8', label:'Terminée' },
  ANNULE:    { bg:'#FDECEA', text:'#C0392B', label:'Annulée'  },
};

function fmt(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('fr-FR', { day:'2-digit', month:'short', year:'numeric' });
}

/* ── Barre de progression ────────────────────────────────────────── */
function ProgressBar({ done, total, color }) {
  const pct = total ? Math.round((done/total)*100) : 0;
  return (
    <div>
      <div style={{ height:5,background:'#EEF2F8',borderRadius:99,overflow:'hidden',marginBottom:3 }}>
        <div style={{ height:'100%',width:`${pct}%`,background:color,borderRadius:99,transition:'width .5s' }}/>
      </div>
      <p style={{ margin:0,fontSize:'.67rem',color:'#8A9BBC' }}>{done}/{total} terminé{done!==1?'s':''}</p>
    </div>
  );
}

/* ── Vue détail planification ────────────────────────────────────── */
function DetailModal({ planif, onClose }) {
  const exportCSV = () => {
    const header = ['Référence','Série','Projet','Segment','Plant','Site','Date prévue','Auditeur','Deadline','Statut'];
    const rows = (planif.audits || []).map(a => [
      a.reference, a.serieNom, a.projetNom, a.segmentNom, a.plantNom, a.siteNom,
      fmt(a.datePrevue), a.auditeurNom, fmt(a.deadline), a.statut
    ]);
    const csv = [header, ...rows].map(r => r.map(c=>`"${c||''}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type:'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `${planif.nom}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ position:'fixed',inset:0,background:'rgba(0,28,60,.5)',display:'flex',
      alignItems:'center',justifyContent:'center',zIndex:1100,backdropFilter:'blur(5px)' }}>
      <div style={{ background:'#fff',borderRadius:20,width:'100%',maxWidth:900,overflow:'hidden',
        boxShadow:'0 32px 80px rgba(0,0,0,.2)',maxHeight:'90vh',display:'flex',flexDirection:'column' }}>

        <div style={{ background:'linear-gradient(135deg,#002855,#003F8A)',padding:'1.2rem 1.5rem',
          display:'flex',alignItems:'center',justifyContent:'space-between',flexShrink:0 }}>
          <div>
            <p style={{ margin:0,fontWeight:800,color:'#fff',fontSize:'.92rem' }}>{planif.nom}</p>
            <p style={{ margin:0,fontSize:'.7rem',color:'rgba(255,255,255,.5)' }}>
              {fmt(planif.dateDebut)} → {fmt(planif.dateFin)} · {planif.nombreAuditsTotal} audits
            </p>
          </div>
          <div style={{ display:'flex',gap:8 }}>
            <button onClick={exportCSV}
              style={{ display:'flex',alignItems:'center',gap:6,padding:'7px 14px',borderRadius:9,
                border:'none',background:'rgba(200,152,42,.25)',color:'#E8B84B',
                fontWeight:700,fontSize:'.78rem',cursor:'pointer' }}>
              {IC.export} Exporter CSV
            </button>
            <button onClick={onClose}
              style={{ background:'rgba(255,255,255,.15)',border:'none',borderRadius:8,
                width:30,height:30,display:'flex',alignItems:'center',justifyContent:'center',
                color:'#fff',cursor:'pointer' }}>✕</button>
          </div>
        </div>

        <div style={{ overflowY:'auto',flex:1 }}>
          <table style={{ width:'100%',borderCollapse:'collapse',fontSize:'.8rem' }}>
            <thead>
              <tr style={{ background:'#F7F9FC',position:'sticky',top:0 }}>
                {['Réf.','Série','Projet','Segment','Plant','Site','Date prévue','Auditeur','Deadline','Statut'].map(h => (
                  <th key={h} style={{ padding:'10px 12px',textAlign:'left',fontWeight:700,
                    color:'#5C6F8A',borderBottom:'2px solid #EEF2F8',whiteSpace:'nowrap',
                    fontSize:'.72rem',textTransform:'uppercase',letterSpacing:'.05em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(planif.audits || []).map((a, i) => {
                const st = { PLANIFIE:{bg:'#EFF6FF',text:'#1D4ED8'}, EN_COURS:{bg:'#FEF3C7',text:'#92400E'},
                  TERMINE:{bg:'#E6F5EE',text:'#1A7A4A'}, EN_RETARD:{bg:'#FDECEA',text:'#C0392B'} };
                const c = st[a.statut] || { bg:'#F3F4F6',text:'#6B7280' };
                return (
                  <tr key={a.id} style={{ background: i%2===0?'#fff':'#FAFBFD' }}>
                    <td style={{ padding:'9px 12px',fontWeight:700,color:'#182030' }}>{a.reference}</td>
                    <td style={{ padding:'9px 12px',color:'#273347' }}>{a.serieNom||'—'}</td>
                    <td style={{ padding:'9px 12px',color:'#273347' }}>{a.projetNom||'—'}</td>
                    <td style={{ padding:'9px 12px',color:'#8A9BBC' }}>{a.segmentNom||'—'}</td>
                    <td style={{ padding:'9px 12px',color:'#8A9BBC' }}>{a.plantNom||'—'}</td>
                    <td style={{ padding:'9px 12px',color:'#8A9BBC' }}>{a.siteNom||'—'}</td>
                    <td style={{ padding:'9px 12px',color:'#5C6F8A' }}>{fmt(a.datePrevue)}</td>
                    <td style={{ padding:'9px 12px',color:'#273347' }}>{a.auditeurNom||'—'}</td>
                    <td style={{ padding:'9px 12px',color:'#5C6F8A' }}>{fmt(a.deadline)}</td>
                    <td style={{ padding:'9px 12px' }}>
                      <span style={{ background:c.bg,color:c.text,fontSize:'.65rem',
                        fontWeight:800,padding:'2px 8px',borderRadius:99 }}>
                        {a.statut?.replace('_',' ')}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {(!planif.audits || planif.audits.length === 0) && (
            <div style={{ textAlign:'center',padding:'3rem',color:'#8A9BBC' }}>
              Aucun audit dans cette planification.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════ */
export default function ResponsablePlanifications() {
  const [planifications, setPlanifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState('');
  const [detail,  setDetail]  = useState(null);
  const [openingDetail, setOpeningDetail] = useState(false);

  useEffect(() => {
    planificationAPI.getAll()
      .then(r => setPlanifications(Array.isArray(r.data) ? r.data : []))
      .finally(() => setLoading(false));
  }, []);

  const visiblePlanifs = useMemo(
    () => planifications.filter(p => String(p?.statut || '').toUpperCase() !== 'BROUILLON'),
    [planifications]
  );

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return visiblePlanifs.filter(p =>
      p.nom?.toLowerCase().includes(q)
      || p.statut?.toLowerCase().includes(q)
      || p.createurNom?.toLowerCase().includes(q)
    );
  }, [visiblePlanifs, search]);

  const openDetail = useCallback(async (planif) => {
    if (!planif?.id) return;
    setOpeningDetail(true);
    try {
      const detailRes = await planificationAPI.getById(planif.id).catch(() => ({ data: planif }));
      const auditsRes = await fetch(`http://localhost:8080/api/audits?planificationId=${planif.id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      const audits = auditsRes.ok ? await auditsRes.json() : [];
      const merged = { ...(detailRes.data || planif), audits: Array.isArray(audits) ? audits : [] };
      setDetail(merged);
    } catch {
      setDetail({ ...planif, audits: [] });
    }
    setOpeningDetail(false);
  }, []);

  return (
    <div style={{ display:'flex',flexDirection:'column',gap:'1.4rem' }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}@keyframes upcard{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}`}</style>

      {/* Header */}
      <div style={{ background:'linear-gradient(135deg,#1E1B4B,#4338CA)',borderRadius:20,
        padding:'1.6rem 2rem',color:'#fff' }}>
        <h1 style={{ margin:0,fontSize:'2.05rem',fontWeight:990,color:'#fff' }}>Planifications Audits</h1>
        <p style={{ margin:'6px 0 0',color:'rgba(255,255,255,.6)',fontSize:'.84rem' }}>
          Vue globale — {visiblePlanifs.length} planification{visiblePlanifs.length!==1?'s':''}
        </p>
      </div>

      {/* Toolbar */}
      <div style={{ display:'flex',alignItems:'center',gap:10 }}>
        <div style={{ position:'relative',flex:1 }}>
          <span style={{ position:'absolute',left:12,top:'50%',transform:'translateY(-50%)',color:'#8A9BBC' }}>
            {IC.search}
          </span>
          <input type="text" placeholder="Rechercher une planification…" value={search}
            onChange={e=>setSearch(e.target.value)}
            style={{ width:'100%',padding:'10px 13px 10px 38px',borderRadius:12,
              border:'1.5px solid #DAE2EF',fontSize:'.86rem',outline:'none',
              boxSizing:'border-box',background:'#fff' }}
            onFocus={e=>e.target.style.borderColor='#4338CA'}
            onBlur={e=>e.target.style.borderColor='#DAE2EF'}
          />
          {search && <button onClick={()=>setSearch('')}
            style={{ position:'absolute',right:10,top:'50%',transform:'translateY(-50%)',background:'none',border:'none',color:'#8A9BBC',cursor:'pointer' }}>{IC.close}</button>}
        </div>
        <span style={{ fontSize:'.82rem',color:'#8A9BBC',fontWeight:600,whiteSpace:'nowrap' }}>
          {filtered.length} résultat{filtered.length!==1?'s':''}
        </span>
      </div>

      {loading ? (
        <div style={{ display:'flex',justifyContent:'center',padding:'3rem',gap:12,color:'#8A9BBC',alignItems:'center' }}>
          <span style={{ width:26,height:26,border:'3px solid #EEF2F8',borderTopColor:'#4338CA',borderRadius:'50%',animation:'spin .8s linear infinite',display:'inline-block' }}/>
          Chargement…
        </div>
      ) : openingDetail ? (
        <div style={{ display:'flex',justifyContent:'center',padding:'2rem',color:'#8A9BBC',fontWeight:700 }}>
          Chargement du tableau de planning…
        </div>
      ) : (
        <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(340px,1fr))',gap:'1rem' }}>
          {filtered.map((p, i) => {
            const st = STATUT_CFG[p.statut] || STATUT_CFG.BROUILLON;
            const pct = p.nombreAuditsTotal ? Math.round((p.nombreAuditsTermines/p.nombreAuditsTotal)*100) : 0;
            return (
              <div key={p.id}
                style={{ background:'#fff',borderRadius:18,border:'1px solid #EEF2F8',
                  padding:'1.2rem 1.3rem',boxShadow:'0 2px 12px rgba(0,40,85,.06)',
                  animation:`upcard .3s ${i*.05}s ease both`,opacity:0 }}>

                <div style={{ display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:12 }}>
                  <div>
                    <p style={{ margin:0,fontWeight:800,fontSize:'.9rem',color:'#182030' }}>{p.nom}</p>
                    <p style={{ margin:'3px 0 0',fontSize:'.73rem',color:'#8A9BBC',
                      display:'flex',alignItems:'center',gap:5 }}>
                      {IC.clock} {fmt(p.dateDebut)} → {fmt(p.dateFin)}
                    </p>
                    <p style={{ margin:'3px 0 0',fontSize:'.72rem',color:'#5C6F8A',fontWeight:600 }}>
                      Planifiée par : {p.createurNom || '—'}
                    </p>
                  </div>
                  <span style={{ background:st.bg,color:st.text,fontSize:'.67rem',
                    fontWeight:800,padding:'3px 9px',borderRadius:99,whiteSpace:'nowrap' }}>
                    {st.label}
                  </span>
                </div>

                {/* Progression */}
                <div style={{ marginBottom:12 }}>
                  <ProgressBar done={p.nombreAuditsTermines||0} total={p.nombreAuditsTotal||0} color="#4338CA" />
                </div>

                {/* Stats */}
                <div style={{ display:'flex',gap:6,marginBottom:12 }}>
                  {[
                    { label:'Total',    val:p.nombreAuditsTotal||0,   color:'#273347' },
                    { label:'Terminés', val:p.nombreAuditsTermines||0, color:'#1A7A4A' },
                    { label:'En retard',val:p.nombreAuditsEnRetard||0, color:'#C0392B' },
                  ].map(s=>(
                    <div key={s.label} style={{ flex:1,textAlign:'center',background:'#F7F9FC',
                      borderRadius:9,padding:'6px 4px' }}>
                      <p style={{ margin:0,fontSize:'.85rem',fontWeight:800,color:s.color }}>{s.val}</p>
                      <p style={{ margin:0,fontSize:'.65rem',color:'#8A9BBC' }}>{s.label}</p>
                    </div>
                  ))}
                </div>

                <div style={{ display:'flex',gap:7 }}>
                  <button onClick={()=>openDetail(p)}
                    style={{ flex:1,display:'flex',alignItems:'center',justifyContent:'center',gap:6,
                      padding:'8px 0',borderRadius:12,border:'none',
                      background:'linear-gradient(135deg,#1E1B4B,#4338CA)',color:'#fff',
                      fontSize:'.78rem',fontWeight:700,cursor:'pointer' }}>
                    {IC.eye} Voir le planning
                  </button>
                </div>
              </div>
            );
          })}
          {!filtered.length && (
            <div style={{ gridColumn:'1/-1',textAlign:'center',padding:'4rem',color:'#8A9BBC' }}>
              <div style={{ fontSize:'2.5rem',marginBottom:10 }}>📅</div>
              <p style={{ fontWeight:700,color:'#5C6F8A' }}>Aucune planification trouvée</p>
            </div>
          )}
        </div>
      )}

      {detail && <DetailModal planif={detail} onClose={()=>setDetail(null)} />}
    </div>
  );
}