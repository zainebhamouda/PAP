import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auditSpecialAPI } from '../../services/api';

const T = {
  navy:'#002855', blue:'#003F8A', blueM:'#0057B8',
  g50:'#F7F9FC', g100:'#EEF2F8', g200:'#DAE2EF',
  g400:'#8A9BBC', g500:'#5C6F8A', g700:'#273347',
  success:'#1A7A4A', successBg:'#E6F5EE', successBd:'#86EFAC',
  warn:'#C8982A', warnBg:'#FFF4D6',
  danger:'#C0392B', dangerBg:'#FDECEA', dangerBd:'#FCA5A5',
  purple:'#7C3AED', purpleBg:'#F5F3FF',
};
const apiH = () => ({ Authorization: `Bearer ${localStorage.getItem('token')}`, 'Content-Type': 'application/json' });
const fmt = d => d ? new Date(d).toLocaleDateString('fr-FR', { day:'2-digit', month:'short', year:'numeric' }) : '—';

function DetailModal({ audit, onClose, onValider, loading }) {
  const [commentaires, setCommentaires] = useState('');
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.5)', zIndex:1200, display:'flex', alignItems:'center', justifyContent:'center' }}
      onClick={e => e.target===e.currentTarget && onClose()}>
      <div style={{ background:'#fff', borderRadius:18, width:'100%', maxWidth:520, padding:28, boxShadow:'0 24px 64px rgba(0,0,0,.22)' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:18 }}>
          <h3 style={{ margin:0, color:T.navy }}>📦 Détail de l'audit export</h3>
          <button onClick={onClose} style={{ background:T.g100, border:'none', borderRadius:8, width:34, height:34, cursor:'pointer' }}>✕</button>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:18, background:T.g50, borderRadius:10, padding:'12px 14px' }}>
          {[
            { label:'Référence', value:audit.reference },
            { label:'Auditeur', value:audit.auditeurNom||'—' },
            { label:'Salle export', value:audit.zoneExpedition||'—' },
            { label:'Semaine', value:audit.semaineExport||'—' },
            { label:'Date', value:fmt(audit.datePrevue) },
            { label:'Statut', value:audit.statut?.replace('_',' ') },
          ].map(x => (
            <div key={x.label}>
              <div style={{ fontSize:'.67rem', color:T.g400, fontWeight:700, textTransform:'uppercase', marginBottom:2 }}>{x.label}</div>
              <div style={{ fontSize:'.83rem', fontWeight:700, color:T.navy }}>{x.value}</div>
            </div>
          ))}
        </div>

        {audit.observations && (
          <div style={{ marginBottom:14, padding:'10px 14px', background:T.g50, borderRadius:8, fontSize:'.8rem', color:T.g700 }}>
            <strong>Observations :</strong> {audit.observations}
          </div>
        )}

        {audit.rapportUrl && (
          <div style={{ marginBottom:16 }}>
            <a href={audit.rapportUrl} target="_blank" rel="noopener noreferrer"
              style={{ display:'inline-flex', alignItems:'center', gap:6, background:T.successBg, color:T.success, border:`1px solid ${T.successBd}`, padding:'8px 16px', borderRadius:9, textDecoration:'none', fontWeight:700, fontSize:'.82rem' }}>
              📥 Voir le rapport importé
            </a>
          </div>
        )}

        {audit.statut !== 'TERMINE' && (
          <>
            <div style={{ marginBottom:14 }}>
              <label style={{ display:'block', fontSize:'.72rem', fontWeight:700, color:T.g500, textTransform:'uppercase', marginBottom:4 }}>Commentaires (optionnel)</label>
              <textarea value={commentaires} onChange={e=>setCommentaires(e.target.value)} rows={3}
                style={{ width:'100%', padding:'8px 12px', border:`1.5px solid ${T.g200}`, borderRadius:8, fontSize:'.83rem', fontFamily:'inherit', resize:'vertical', boxSizing:'border-box' }}
                placeholder="Commentaires sur la validation…"/>
            </div>
            <button onClick={() => onValider(audit.id, commentaires)} disabled={loading}
              style={{ width:'100%', padding:'12px', borderRadius:11, border:'none', background:`linear-gradient(135deg,${T.success},#15803D)`, color:'#fff', fontSize:'.9rem', fontWeight:800, cursor:loading?'not-allowed':'pointer', fontFamily:'inherit', opacity:loading?.7:1 }}>
              {loading ? '⏳ Validation…' : '✅ Valider l\'audit export'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default function ResponsableMagasinAudits() {
  const navigate = useNavigate();
  const [audits, setAudits]       = useState([]);
  const [loading, setLoading]     = useState(true);
  const [selected, setSelected]   = useState(null);
  const [validating, setValidating] = useState(false);
  const [toast, setToast]         = useState(null);
  const [filterStatut, setFilter] = useState('TOUS');

  const showToast = (msg, type='success') => { setToast({msg,type}); setTimeout(()=>setToast(null),4000); };

  const load = async () => {
    setLoading(true);
    try {
      const res = await auditSpecialAPI.auditsExportResponsable();
      setAudits(res.data || []);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleValider = async (id, commentaires) => {
    setValidating(true);
    try {
      await fetch(`http://localhost:8080/api/audit-special/${id}/export/valider${commentaires?`?commentaires=${encodeURIComponent(commentaires)}`:''}`
        , { method:'PUT', headers:apiH() });
      showToast('Audit validé avec succès ✓');
      setSelected(null);
      load();
    } catch(e) { showToast('Erreur : ' + e.message, 'error'); }
    setValidating(false);
  };

  const filtered = audits.filter(a => filterStatut==='TOUS' || (filterStatut==='A_VALIDER' ? a.statut!=='TERMINE' : a.statut==='TERMINE'));

  return (
    <div style={{ fontFamily:"'DM Sans',sans-serif", background:T.g50, minHeight:'100vh', padding:'2rem' }}>
      {toast && (
        <div style={{ position:'fixed', top:16, right:16, zIndex:2000, padding:'12px 18px', borderRadius:12,
          background:toast.type==='success'?T.successBg:T.dangerBg, color:toast.type==='success'?T.success:T.danger,
          border:`1.5px solid ${toast.type==='success'?T.successBd:T.dangerBd}`,
          fontWeight:700, fontSize:'.83rem', boxShadow:'0 8px 28px rgba(0,0,0,.15)' }}>
          {toast.msg}
        </div>
      )}

      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:22, marginTop:-18 }}>
        <div>
          <h1 style={{ fontSize:'1.5rem', fontWeight:800, color:T.navy, margin:'0 0 5px' }}>Audits Magasin Export</h1>
          <p style={{ color:T.g400, fontSize:'.85rem', margin:0 }}>Validez les audits soumis par les auditeurs</p>
        </div>
        <button onClick={() => navigate('/responsable-magasin/dashboard')}
          style={{ background:T.g100, border:`1px solid ${T.g200}`, color:T.g700, padding:'8px 16px', borderRadius:9, cursor:'pointer', fontFamily:'inherit', fontWeight:700, fontSize:'.81rem' }}>
          ← Dashboard
        </button>
      </div>

      {/* Filtres */}
      <div style={{ display:'flex', gap:10, marginBottom:16 }}>
        {[
          { key:'TOUS', label:`Tous (${audits.length})` },
          { key:'A_VALIDER', label:`À valider (${audits.filter(a=>a.statut!=='TERMINE').length})` },
          { key:'VALIDES', label:`Validés (${audits.filter(a=>a.statut==='TERMINE').length})` },
        ].map(f => (
          <button key={f.key} onClick={() => setFilter(f.key)}
            style={{ padding:'7px 16px', borderRadius:99, border:'none', cursor:'pointer', fontSize:'.78rem', fontWeight:700, fontFamily:'inherit',
              background:filterStatut===f.key?T.navy:T.g100, color:filterStatut===f.key?'#fff':T.g500 }}>
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign:'center', padding:'3rem', color:T.g400 }}>
          <div style={{ width:34, height:34, border:`3px solid ${T.g100}`, borderTopColor:T.navy, borderRadius:'50%', animation:'spin .8s linear infinite', margin:'0 auto 10px' }}/>
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
          Chargement…
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign:'center', padding:'3rem', color:T.g300, background:'#fff', borderRadius:14, border:`1px solid ${T.g100}` }}>
          <div style={{ fontSize:'2.5rem', marginBottom:12 }}>📦</div>
          <div style={{ fontSize:'.9rem' }}>Aucun audit export</div>
        </div>
      ) : (
        <div style={{ background:'#fff', borderRadius:14, border:`1px solid ${T.g100}`, boxShadow:'0 2px 10px rgba(0,40,85,.06)', overflow:'hidden' }}>
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead>
              <tr style={{ background:'#D3DBE9' }}>
                {['Référence','Auditeur','Salle','Semaine','Date','Statut','Actions'].map(h => (
                  <th key={h} style={{ textAlign:'left', padding:'10px 14px', fontSize:'.7rem', fontWeight:800, color:T.g500, textTransform:'uppercase', letterSpacing:'.07em', whiteSpace:'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((a, i) => (
                <tr key={a.id} style={{ background:i%2===0?'#fff':'#EEF4FF', borderBottom:`1px solid ${T.g100}` }}>
                  <td style={{ padding:'11px 14px', fontWeight:800, color:T.navy, fontSize:'.84rem' }}>{a.reference}</td>
                  <td style={{ padding:'11px 14px', color:T.g700, fontSize:'.82rem' }}>{a.auditeurNom||'—'}</td>
                  <td style={{ padding:'11px 14px', color:T.g700, fontSize:'.82rem' }}>{a.zoneExpedition||'—'}</td>
                  <td style={{ padding:'11px 14px', color:T.g700, fontSize:'.82rem' }}>{a.semaineExport||'—'}</td>
                  <td style={{ padding:'11px 14px', color:T.g400, fontSize:'.8rem' }}>{fmt(a.datePrevue)}</td>
                  <td style={{ padding:'11px 14px' }}>
                    <span style={{ background:a.statut==='TERMINE'?T.successBg:T.warnBg, color:a.statut==='TERMINE'?T.success:T.warn, fontSize:'.67rem', fontWeight:800, padding:'3px 9px', borderRadius:99 }}>
                      {a.statut==='TERMINE'?'VALIDÉ':'EN ATTENTE'}
                    </span>
                  </td>
                  <td style={{ padding:'11px 14px' }}>
                    <div style={{ display:'flex', gap:6 }}>
                      <button onClick={() => setSelected(a)}
                        style={{ padding:'6px 13px', borderRadius:18, border:'none', background:T.infoBg, color:T.info, fontSize:'.75rem', fontWeight:700, cursor:'pointer' }}>
                        Voir détail
                      </button>
                      {a.statut !== 'TERMINE' && (
                        <button onClick={() => setSelected(a)}
                          style={{ padding:'6px 13px', borderRadius:18, border:'none', background:T.successBg, color:T.success, fontSize:'.75rem', fontWeight:700, cursor:'pointer' }}>
                          ✅ Valider
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selected && (
        <DetailModal
          audit={selected}
          onClose={() => setSelected(null)}
          onValider={handleValider}
          loading={validating}
        />
      )}
    </div>
  );
}
