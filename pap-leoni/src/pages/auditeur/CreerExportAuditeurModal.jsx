import { useState, useEffect } from 'react';

const T = {
  navy:'#0B1E3D', g50:'#F8FAFC', g100:'#F1F5F9', g200:'#E2E8F0', g300:'#CBD5E1',
  g400:'#94A3B8', g700:'#1E293B',
  success:'#059669', successBg:'#ECFDF5', successBd:'#A7F3D0',
  danger:'#DC2626', dangerBg:'#FEF2F2', dangerBd:'#FECACA',
  purple:'#7C3AED', purpleBg:'#F5F3FF', purpleBd:'#DDD6FE',
};

const apiH = () => ({ Authorization:`Bearer ${localStorage.getItem('token')}`, 'Content-Type':'application/json' });
const fmt = d => { if(!d) return '—'; try { return new Date(d).toLocaleDateString('fr-FR',{day:'2-digit',month:'short',year:'numeric'}); } catch { return d; } };

const LBL = { display:'block', fontSize:'.69rem', fontWeight:700, color:T.g700, textTransform:'uppercase', letterSpacing:'.05em', marginBottom:4 };
const INP = { width:'100%', padding:'8px 11px', border:`1px solid ${T.g300}`, borderRadius:8, fontSize:'.84rem', fontFamily:'inherit', background:'#fff', boxSizing:'border-box', outline:'none' };

const Ic = {
  box: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>,
  send: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>,
};

/* ─── Modal Créer Export (Auditeur — auto-assigné) ─── */
export default function CreerExportAuditeurModal({ onClose, onSuccess, plantScope }) {
  const [plants,      setPlants]      = useState([]);
  const [plantId,     setPlantId]     = useState('');
  const [salleExport, setSalleExport] = useState('');
  const [semaine,     setSemaine]     = useState('');
  const [obs,         setObs]         = useState('');
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState('');
  const [success,     setSuccess]     = useState('');
  const lockedPlantId = plantScope?.plantId || '';

  const today = () => new Date().toISOString().split('T')[0];
  const datePrevue = today();

  useEffect(() => {
    fetch('http://localhost:8080/api/sites/plants', { headers: apiH() }).then(r => r.json()).then(d => {
      setPlants((Array.isArray(d) ? d : []).map(p => ({ value: String(p.id), label: p.nom || `Plant ${p.id}` })));
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (lockedPlantId) setPlantId(lockedPlantId);
  }, [lockedPlantId]);

  const canSubmit = salleExport.trim() && semaine.trim();

  const submit = async () => {
    if (!canSubmit) return;
    setLoading(true); setError('');
    try {
      const res = await fetch('http://localhost:8080/api/auditeur/audit-special/export', {
        method: 'POST', headers: apiH(),
        body: JSON.stringify({
          plantId: plantId ? parseInt(plantId) : null,
          salleExport: salleExport.trim(),
          semaineExport: semaine.trim(),
          observations: obs,
        }),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message || 'Erreur lors de la création');
      setSuccess('Export planifié avec succès !');
      setTimeout(() => { onSuccess && onSuccess(); onClose(); }, 1200);
    } catch (e) { setError(e.message || 'Erreur'); }
    setLoading(false);
  };

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.5)', zIndex:1200, display:'flex', alignItems:'center', justifyContent:'center' }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background:'#fff', borderRadius:18, width:'100%', maxWidth:460, maxHeight:'90vh', overflow:'auto', boxShadow:'0 24px 64px rgba(0,40,85,.22)', padding:28 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24, paddingBottom:18, borderBottom:`2px solid ${T.purpleBg}` }}>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <div style={{ width:44, height:44, background:T.purpleBg, borderRadius:12, display:'flex', alignItems:'center', justifyContent:'center', color:T.purple }}>{Ic.box}</div>
            <div>
              <div style={{ fontSize:'.7rem', fontWeight:700, color:T.purple, textTransform:'uppercase', letterSpacing:1 }}>Magasin Export</div>
              <h2 style={{ margin:'4px 0 0', color:T.navy, fontSize:'1.1rem', fontWeight:800 }}>Planifier mon audit</h2>
            </div>
          </div>
          <button onClick={onClose} style={{ background:'transparent', border:'none', borderRadius:50, width:36, height:36, cursor:'pointer', color:T.g400, fontSize:'1.4rem', display:'flex', alignItems:'center', justifyContent:'center' }}>✕</button>
        </div>
        {error   && <div style={{ background:T.dangerBg, border:`1px solid ${T.dangerBd}`, borderRadius:8, padding:'9px 13px', marginBottom:14, color:T.danger, fontSize:'.82rem' }}>{error}</div>}
        {success && <div style={{ background:T.successBg, border:`1px solid ${T.successBd}`, borderRadius:8, padding:'9px 13px', marginBottom:14, color:T.success, fontSize:'.82rem' }}>{success}</div>}

        <div style={{ display:'grid', gridTemplateColumns:'1fr', gap:10, marginBottom:12 }}>
          <div>
            <label style={LBL}>Plant</label>
            <select style={INP} value={lockedPlantId || plantId} onChange={e => setPlantId(e.target.value)} disabled={!!lockedPlantId}>
              {lockedPlantId
                ? <option value={lockedPlantId}>{plantScope?.plantNom || plants.find(p => String(p.value) === lockedPlantId)?.label || 'Plant'}</option>
                : (
                  <>
                    <option value="">Sélectionner (optionnel)</option>
                    {plants.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                  </>
                )}
            </select>
          </div>
          <div>
            <label style={LBL}>Salle d'export *</label>
            <input style={INP} value={salleExport} onChange={e => setSalleExport(e.target.value)} placeholder="Ex: Zone A, Salle 12…" />
          </div>
          <div>
            <label style={LBL}>Semaine *</label>
            <input style={INP} value={semaine} onChange={e => setSemaine(e.target.value)} placeholder="Ex: LTN01/KW13" />
          </div>
          <div>
            <label style={LBL}>Date planifiée</label>
            <input style={{ ...INP, background:T.g50, color:T.g400 }} value={fmt(datePrevue)} readOnly />
          </div>
          <div>
            <label style={LBL}>Observations (optionnel)</label>
            <textarea style={{ ...INP, minHeight:55, resize:'vertical' }} value={obs} onChange={e => setObs(e.target.value)} placeholder="Remarques éventuelles…" />
          </div>
        </div>

        <button disabled={!canSubmit || loading} onClick={submit}
          style={{ width:'100%', display:'flex', alignItems:'center', justifyContent:'center', gap:8, padding:'13px 22px', fontSize:'.95rem', fontWeight:700, fontFamily:"'Inter',sans-serif", borderRadius:10, border:'none', background: !canSubmit || loading ? T.g200 : T.purple, color:'#fff', cursor: !canSubmit || loading ? 'not-allowed' : 'pointer', opacity: !canSubmit || loading ? 0.7 : 1 }}>
          {Ic.send} {loading ? 'Création…' : "Planifier l'export"}
        </button>
      </div>
    </div>
  );
}