import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { auditSpecialAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

/* ─── Design tokens ─── */
const T = {
  navy:'#0B1E3D', blue:'#1D4ED8', blueL:'#EFF6FF', blueB:'#BFDBFE',
  g50:'#F8FAFC', g100:'#F1F5F9', g200:'#E2E8F0', g300:'#CBD5E1',
  g400:'#94A3B8', g500:'#64748B', g700:'#1E293B',
  success:'#059669', successBg:'#ECFDF5', successBd:'#A7F3D0',
  warn:'#D97706', warnBg:'#FFFBEB', warnBd:'#FCD34D',
  danger:'#DC2626', dangerBg:'#FEF2F2', dangerBd:'#FECACA',
  purple:'#7C3AED', purpleBg:'#F5F3FF', purpleBd:'#DDD6FE',
  teal:'#0D9488', tealBg:'#F0FDFA', tealBd:'#99F6E4',
  rose:'#DB2777', roseBg:'#FDF2F8', roseBd:'#F9A8D4',
};

const apiH = () => ({
  Authorization: `Bearer ${localStorage.getItem('token')}`,
  'Content-Type': 'application/json',
});
const fmt = d => d ? new Date(d).toLocaleDateString('fr-FR', { day:'2-digit', month:'short', year:'numeric' }) : '—';
const today = () => new Date().toISOString().split('T')[0];
const parseEmails = value => (value || '').split(/[\n,;]/).map(s => s.trim()).filter(Boolean);
const DRAFT = {
  getKey: (type, id, section) => `pap:audit-special:${type}:${id}:${section}`,
  save: (key, data) => { try { localStorage.setItem(key, JSON.stringify({ ...data, _savedAt: new Date().toISOString() })); } catch {} },
  load: (key) => { try { const r = localStorage.getItem(key); return r ? JSON.parse(r) : null; } catch { return null; } },
  clear: (key) => { try { localStorage.removeItem(key); } catch {} },
  clearAll: (type, id) => {
    ['step', 'flowMode', 'reglePlate', 'export', 'ncRows'].forEach(s => {
      try { localStorage.removeItem(DRAFT.getKey(type, id, s)); } catch {}
    });
  },
};

/* ─── Shared styles ─── */
const inp = { width:'100%', padding:'9px 12px', border:'1.5px solid #D1D5DB', borderRadius:9, fontSize:13, fontFamily:'inherit', background:'#fff', boxSizing:'border-box', outline:'none', color:'#111827', transition:'border-color .15s' };
const cinp = { padding:'6px 9px', border:'1.5px solid #D1D5DB', borderRadius:7, fontSize:12, fontFamily:'inherit', background:'#fff', boxSizing:'border-box', outline:'none', width:'100%', color:'#111827' };
const lbl = { display:'block', fontSize:10, fontWeight:700, color:'#374151', marginBottom:5, textTransform:'uppercase', letterSpacing:'.07em' };

function Field({ label, required, children, hint }) {
  return (
    <div style={{ marginBottom:14 }}>
      <label style={lbl}>{label}{required && <span style={{ color:T.danger }}> *</span>}</label>
      {children}
      {hint && <div style={{ fontSize:'.68rem', color:T.g400, marginTop:3, fontStyle:'italic' }}>{hint}</div>}
    </div>
  );
}

function PBtn({ children, onClick, disabled, color=T.navy, full, style, size='md' }) {
  const pad = size === 'sm' ? '7px 14px' : '10px 22px';
  return (
    <button onClick={disabled ? undefined : onClick} disabled={disabled}
      style={{ display:'inline-flex', alignItems:'center', justifyContent:'center', gap:7, padding:pad, borderRadius:10, border:'none', background:disabled?'#E5E7EB':color, color:disabled?'#9CA3AF':'#fff', fontWeight:700, fontSize:size==='sm'?'.78rem':'.85rem', cursor:disabled?'not-allowed':'pointer', fontFamily:"'Inter',sans-serif", width:full?'100%':'auto', boxShadow:disabled?'none':`0 2px 8px ${color}40`, transition:'all .18s', ...style }}>
      {children}
    </button>
  );
}

/* ─── SVG Icons ─── */
const Ic = {
  ruler:   <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><line x1="5" y1="12" x2="19" y2="12"/><line x1="5" y1="6" x2="19" y2="6"/><line x1="5" y1="18" x2="19" y2="18"/></svg>,
  box:     <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>,
  upload:  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/></svg>,
  edit:    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  check:   <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>,
  play:    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>,
  back:    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>,
  send:    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>,
  pdca:    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.51"/></svg>,
  warn:    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
  plus:    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  trash:   <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>,
  ok:      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>,
  arrow:   <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>,
  dl:      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>,
  eye:     <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>,
  pdf:     <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>,
  save:    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>,
  id:      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/></svg>,
};

/* ══════════════════════════════════════════
   STEP BAR
══════════════════════════════════════════ */
function StepBar({ steps, navigate }) {
  const done = steps.filter(s => s.done).length;
  const pct = Math.round((done / steps.length) * 100);
  return (
    <div style={{ background:'linear-gradient(135deg,#4676bf 0%,#1A3C6E 50%,#5597e8 100%)', padding:'1.1rem 0 1rem', position:'relative', borderRadius:20, marginBottom:0, boxShadow:'0 12px 40px rgba(11,35,71,.2)', overflowX:'auto', display:'flex', alignItems:'center', paddingLeft:0 }}>
      <button
        onClick={() => {
          window.setTimeout(() => navigate('/auditeur/audits'), 120);
        }}
        title="Retour à la liste des audits"
        style={{
          width: 42, height: 42, borderRadius: '50%',
          background: 'rgba(255,255,255,.12)',
          border: '1.5px solid rgba(255,255,255,.25)',
          color: '#fff',
          cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
          transition: 'all .25s ease',
          boxShadow: '0 4px 14px rgba(0,0,0,.12)',
          margin: '0 0 0 1rem',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.background = 'rgba(255,255,255,.2)';
          e.currentTarget.style.transform = 'translateY(-1px)';
          e.currentTarget.style.boxShadow = '0 8px 22px rgba(0,0,0,.18)';
        }}
        onMouseLeave={e => {
          e.currentTarget.style.background = 'rgba(255,255,255,.12)';
          e.currentTarget.style.transform = 'none';
          e.currentTarget.style.boxShadow = '0 4px 14px rgba(0,0,0,.12)';
        }}
      >
        <span style={{ display: 'inline-flex', transform: 'rotate(180deg)' }}>
          {Ic.arrow}
        </span>
      </button>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:'2rem', padding:'0 2rem', maxWidth:1200, margin:'0 auto', flexWrap:'nowrap', flex:1 }}>
        {steps.map((step, i) => {
          const isDone = step.done;
          const isActive = !isDone && (i === 0 || steps[i-1]?.done);
          return (
            <div key={step.key} style={{ display:'flex', alignItems:'center', gap:'.75rem', position:'relative', flexShrink:0 }}>
              <div style={{ width:40, height:40, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', background:isDone?'#059669':isActive?'#fff':'rgba(255,255,255,.12)', color:isDone?'#fff':isActive?T.navy:'rgba(255,255,255,.6)', border:isDone?'2px solid #059669':isActive?'2px solid #fff':'2px solid rgba(255,255,255,.25)', fontWeight:800, fontSize:'.78rem', flexShrink:0, transition:'all .3s', boxShadow:isDone?'0 0 0 4px rgba(5,150,105,.2)':isActive?'0 2px 8px rgba(0,0,0,.15)':'none' }}>
                {isDone ? <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg> : <span>{i+1}</span>}
              </div>
              <span style={{ fontSize:'.76rem', fontWeight:isActive?700:600, color:isDone?'rgba(255,255,255,.9)':isActive?'#fff':'rgba(255,255,255,.5)', whiteSpace:'nowrap' }}>{step.label}</span>
              {i < steps.length-1 && <div style={{ position:'absolute', right:'-1.4rem', top:'50%', transform:'translateY(-50%)', width:1, height:28, background:'rgba(255,255,255,.2)' }}/>}
            </div>
          );
        })}
      </div>
      <div style={{ background:'rgba(0,0,0,.2)', height:5, position:'absolute', bottom:0, left:0, right:0 }}>
        <div style={{ height:'100%', width:pct+'%', background:'linear-gradient(90deg,#60A5FA,#3B82F6)', transition:'width .5s ease' }}/>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════
   FORMULAIRE RÈGLE PLATE (inchangé)
══════════════════════════════════════════ */
const add3Months = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  d.setMonth(d.getMonth() + 3);
  return d.toISOString().split('T')[0];
};

function FormulaireReglePlate({ audit, draftKey, onValider, loading }) {
  const { user } = useAuth();
  const auditeurNom = user ? `${user.prenom || ''} ${user.nom || ''}`.trim() : '';

  const initRows = () => {
    const saved = DRAFT.load(draftKey);
    if (saved?.rows?.length) {
      return saved.rows.map(r => ({
        ...r,
        prochaineDate: r.prochaineDate || add3Months(r.dateControle || today())
      }));
    }
    const todayStr = today();
    return [{ numeroInstrument:'', typeInstrument:'REGLE_PLATE', emplacement:'', dateControle:todayStr, nomControleur:auditeurNom, resultat:'conforme', prochaineDate:add3Months(todayStr), remarques:'R.A.S' }];
  };

  const [rows, setRows] = useState(initRows);
  const [obsGen, setObsGen] = useState(() => DRAFT.load(draftKey)?.obsGen || '');
  const [emailsInput, setEmailsInput] = useState(() => DRAFT.load(draftKey)?.emailsInput || '');
  const [view, setView] = useState(() => DRAFT.load(draftKey)?.view || 'formulaire');
  const [emailError, setEmailError] = useState('');
  const [lastSaved, setLastSaved] = useState(null);

  useEffect(() => {
    const t = setTimeout(() => {
      DRAFT.save(draftKey, { rows, obsGen, emailsInput, view });
      setLastSaved(new Date());
    }, 800);
    return () => clearTimeout(t);
  }, [rows, obsGen, emailsInput, view, draftKey]);

  const updRow = (i, k, v) => {
    setRows(p => p.map((r, j) => {
      if (j !== i) return r;
      const updated = { ...r, [k]:v };
      if (k === 'dateControle') {
        updated.prochaineDate = add3Months(v);
      }
      return updated;
    }));
  };
  const addRow = () => {
    const todayStr = today();
    setRows(p => [...p, { numeroInstrument:'', typeInstrument:'REGLE_PLATE', emplacement:'', dateControle:todayStr, nomControleur:auditeurNom, resultat:'conforme', prochaineDate:add3Months(todayStr), remarques:'R.A.S' }]);
  };
  const delRow = i => {
    if (rows.length > 1) {
      setRows(p => p.filter((_, j) => j !== i));
    } else {
      alert('Vous devez conserver au moins une ligne.');
    }
  };
  const hasNC = rows.some(r => r.resultat === 'non conforme');

  const handleSubmit = async () => {
    if (view === 'formulaire') {
      setView('envoi');
      setEmailError('');
      return;
    }

    const recipients = parseEmails(emailsInput);
    if (!recipients.length) {
      setEmailError('Ajoutez au moins une adresse email de destinataire.');
      return;
    }

    setEmailError('');
await onValider({ 
  checklistJson: JSON.stringify({ rows }), 
  remarques: obsGen, 
  emailsDestinataires: recipients 
}, hasNC, rows.filter(r => r.resultat === 'non conforme'));
  };

  return (
    <div>
      {lastSaved && (
        <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:12, fontSize:'.7rem', color:T.success, fontWeight:600 }}>
          {Ic.save} Brouillon sauvegardé à {lastSaved.toLocaleTimeString('fr-FR', { hour:'2-digit', minute:'2-digit' })}
        </div>
      )}

      <div style={{ background:T.tealBg, border:`1.5px solid ${T.tealBd}`, borderRadius:10, padding:'10px 16px', marginBottom:18, fontSize:'.8rem', color:T.teal, display:'flex', alignItems:'center', gap:8, fontWeight:600 }}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={T.teal} strokeWidth="2" strokeLinecap="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1"/></svg>
        IT TN 3627 — Suivi des mètres ruban et règles plates (PF VW)
      </div>

      <div style={{ overflowX:'auto', marginBottom:14, borderRadius:12, border:`1px solid ${T.g200}`, boxShadow:'0 1px 4px rgba(0,0,0,.04)' }}>
        <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'.78rem' }}>
          <thead>
            <tr style={{ background:'linear-gradient(135deg,#0B1E3D,#1D4ED8)', color:'#fff' }}>
              {['N° instrument', 'Type', 'Emplacement / Utilisateur', 'Date contrôle', 'Nom contrôleur', 'Résultat', 'Prochaine date', 'Remarques', ''].map(h => (
                <th key={h} style={{ padding:'10px 10px', textAlign:'left', fontWeight:700, whiteSpace:'nowrap', fontSize:'.72rem', letterSpacing:'.04em' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} style={{ background:i%2===0?'#fff':T.g50, borderBottom:`1px solid ${T.g200}` }}>
                <td style={{ padding:'6px 8px' }}><input value={r.numeroInstrument} onChange={e => updRow(i,'numeroInstrument',e.target.value)} placeholder="V69" style={cinp}/></td>
                <td style={{ padding:'6px 8px' }}>
                  <select value={r.typeInstrument} onChange={e => updRow(i,'typeInstrument',e.target.value)} style={cinp}>
                    <option value="REGLE_PLATE">Règle plate</option>
                    <option value="METRE_RUBAN">Mètre ruban</option>
                  </select>
                </td>
                <td style={{ padding:'6px 8px' }}><input value={r.emplacement} onChange={e => updRow(i,'emplacement',e.target.value)} placeholder="Prénom NOM" style={cinp}/></td>
                <td style={{ padding:'6px 8px' }}><input type="date" value={r.dateControle} onChange={e => updRow(i,'dateControle',e.target.value)} style={cinp}/></td>
                <td style={{ padding:'6px 8px' }}><input value={r.nomControleur} onChange={e => updRow(i,'nomControleur',e.target.value)} style={cinp}/></td>
                <td style={{ padding:'6px 8px' }}>
                  <select value={r.resultat} onChange={e => updRow(i,'resultat',e.target.value)}
                    style={{ ...cinp, background:r.resultat==='conforme'?'#ECFDF5':'#FEF2F2', color:r.resultat==='conforme'?T.success:T.danger, fontWeight:700, border:`1.5px solid ${r.resultat==='conforme'?T.successBd:T.dangerBd}` }}>
                    <option value="conforme">Conforme</option>
                    <option value="non conforme">Non conforme</option>
                  </select>
                </td>
                <td style={{ padding:'6px 8px' }}><div style={{ ...cinp, background:'#E0F2FE', color:T.navy, fontWeight:600, display:'flex', alignItems:'center', height:'auto', padding:'8px' }}>
                  {r.prochaineDate ? (() => {
                    const [y, m, d] = r.prochaineDate.split('-');
                    return `${d}/${m}/${y}`;
                  })() : '—'}
                </div></td>
                <td style={{ padding:'6px 8px' }}><input value={r.remarques} onChange={e => updRow(i,'remarques',e.target.value)} placeholder="R.A.S" style={cinp}/></td>
                <td style={{ padding:'6px 8px' }}>
                  <button onClick={() => delRow(i)}
                    style={{ width:28, height:28, display:'flex', alignItems:'center', justifyContent:'center', background:'#FEE2E2', border:`1.5px solid #FECACA`, borderRadius:7, cursor:'pointer', color:T.danger, fontWeight:600, transition:'all .15s' }}
                    onMouseEnter={e => { e.currentTarget.style.background = '#FCA5A5'; e.currentTarget.style.transform = 'scale(1.1)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = '#FEE2E2'; e.currentTarget.style.transform = 'scale(1)'; }}>
                    {Ic.trash}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <button onClick={addRow} style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'7px 14px', background:T.blueL, border:`1.5px solid ${T.blueB}`, borderRadius:8, cursor:'pointer', fontSize:'.78rem', fontWeight:700, color:T.blue, fontFamily:'inherit', marginBottom:16 }}>
        {Ic.plus} Ajouter un instrument
      </button>

      {hasNC && (
        <div style={{ padding:'12px 16px', background:T.warnBg, border:`1.5px solid ${T.warnBd}`, borderRadius:10, marginBottom:16, display:'flex', alignItems:'center', gap:10 }}>
          <span style={{ color:T.warn }}>{Ic.warn}</span>
          <div style={{ fontSize:'.8rem', fontWeight:700, color:T.warn }}>Non-conformité détectée — un PDCA sera requis après validation.</div>
        </div>
      )}

      <Field label="Observations générales">
        <textarea value={obsGen} onChange={e => setObsGen(e.target.value)} rows={3}
          style={{ ...inp, resize:'vertical' }} placeholder="Observations libres…"/>
      </Field>

      {view === 'formulaire' ? (
        <div style={{ display:'flex', justifyContent:'flex-end', gap:12, marginTop:16 }}>
          <PBtn
            onClick={handleSubmit}
            disabled={loading}
            color={hasNC ? T.warn : T.success}
            style={{ minWidth:260 }}>
            {loading ? 'Validation…' : hasNC ? <>{Ic.warn} Continuer vers l'envoi</> : <>{Ic.arrow} Continuer vers l'envoi</>}
          </PBtn>
        </div>
      ) : (
        <div style={{ background:T.blueL, border:`1.5px solid ${T.blueB}`, borderRadius:12, padding:'16px 18px', marginTop:16 }}>
          <div style={{ fontWeight:800, color:T.navy, marginBottom:8 }}>Envoyer le rapport</div>
          <div style={{ fontSize:'.78rem', color:T.g500, marginBottom:12 }}>Indiquez un ou plusieurs destinataires qui recevront le rapport final.</div>
          <Field label="Destinataires du rapport *">
            <textarea
              value={emailsInput}
              onChange={e => { setEmailsInput(e.target.value); setEmailError(''); }}
              rows={3}
              placeholder="prenom.nom@leoni.com, autre@leoni.com"
              style={{ ...inp, resize:'vertical' }}
            />
          </Field>
          {emailError && <div style={{ color:T.danger, fontSize:'.72rem', marginBottom:10 }}>{emailError}</div>}
          <div style={{ display:'flex', justifyContent:'flex-end', gap:10 }}>
            <PBtn onClick={() => { setView('formulaire'); setEmailError(''); }} color={T.g500} style={{ minWidth:120 }}>
              Retour
            </PBtn>
            <PBtn onClick={handleSubmit} disabled={loading} color={hasNC ? T.warn : T.success} style={{ minWidth:220 }}>
              {loading ? 'Envoi…' : hasNC ? <>{Ic.send} Envoyer le rapport</> : <>{Ic.send} Envoyer le rapport</>}
            </PBtn>
          </div>
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════
   FORMULAIRE EXPORT (corrigé)
══════════════════════════════════════════ */
function FormulaireExport({ audit, draftKey, onValider, loading }) {
  const CRITERES = [
    { key:'identification', label:"Identification / Contrôle de l'identité" },
    { key:'generation',     label:'Generation Stand/index' },
    { key:'etiquette',      label:'Etiquette de contrôle électrique' },
    { key:'emballage',      label:'Emballage (méthode et quantité)' },
    { key:'papier',         label:"Papier d'export (label)" },
    { key:'autresSeries',   label:"Existence d'autres séries selon label" },
    { key:'proprete',       label:'Propreté' },
    { key:'endommagements', label:'Endommagements' },
    { key:'dateProduction', label:'Date de production' },
    { key:'autres',         label:'Autres' },
  ];
  const NA_KEYS = ['autresSeries', 'dateProduction'];
  const N = 3;

  const initScores = () => {
    const sc = {};
    CRITERES.forEach(c => { for (let i = 0; i < N; i++) sc[`${c.key}_${i}`] = NA_KEYS.includes(c.key) ? 'NA' : '10'; });
    return sc;
  };

  const saved = DRAFT.load(draftKey);
  const [scores,    setScores]    = useState(saved?.scores || initScores());
  const [remarques, setRemarques] = useState(saved?.remarques || '');

  const [emailsInput, setEmailsInput] = useState(saved?.emailsInput || '');
  const [view, setView] = useState(saved?.view || 'formulaire');
  const [recipientErr, setRecipientErr] = useState('');
  const [lastSaved, setLastSaved] = useState(null);

  // Correction : suppression des variables inexistantes (emailResp, matricule, nomResp)
  // qui provoquaient un ReferenceError au montage du composant.
  useEffect(() => {
    const t = setTimeout(() => {
      DRAFT.save(draftKey, { scores, remarques, emailsInput, view });
      setLastSaved(new Date());
    }, 800);
    return () => clearTimeout(t);
  }, [scores, remarques, emailsInput, view, draftKey]);

  const calcRes = () => {
    let t = 0, c = 0;
    CRITERES.forEach(cr => { for (let i = 0; i < N; i++) { const v = scores[`${cr.key}_${i}`]; if (v !== 'NA') { t += parseFloat(v)||0; c++; } } });
    return c > 0 ? Math.round((t/(c*10))*100) : 0;
  };
  const resultat = calcRes();
  const isParfait = resultat === 100;

  const scoreColor = v => v==='NA'?T.g50:parseFloat(v)===10?'#ECFDF5':parseFloat(v)<5?T.dangerBg:T.warnBg;
  const scoreBd    = v => v==='NA'?T.g200:parseFloat(v)===10?T.successBd:parseFloat(v)<5?T.dangerBd:T.warnBd;

  const handleValider = async () => {
    if (view === 'formulaire') {
      setView('envoi');
      setRecipientErr('');
      return;
    }

    const recipients = parseEmails(emailsInput);
    if (!recipients.length) {
      setRecipientErr('Ajoutez au moins une adresse email de destinataire.');
      return;
    }
    setRecipientErr('');

    await onValider({
      criteresExportJson: JSON.stringify({ criteres:CRITERES.map(c => c.key), scores }),
      scoresJson: JSON.stringify(scores),
      resultatAuditPourcentage: resultat,
      remarques,
      emailsDestinataires: recipients,
    });
    DRAFT.clear(draftKey);
  };

  return (
    <div>
      {lastSaved && (
        <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:12, fontSize:'.7rem', color:T.success, fontWeight:600 }}>
          {Ic.save} Brouillon sauvegardé à {lastSaved.toLocaleTimeString('fr-FR', { hour:'2-digit', minute:'2-digit' })}
        </div>
      )}

      <div style={{ background:T.purpleBg, border:`1.5px solid ${T.purpleBd}`, borderRadius:10, padding:'10px 16px', marginBottom:18, fontSize:'.8rem', color:T.purple, display:'flex', alignItems:'center', gap:8, fontWeight:600 }}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={T.purple} strokeWidth="2" strokeLinecap="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1"/></svg>
        IT 3600-05 — Audit de la salle d'export
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10, marginBottom:18, background:T.g50, borderRadius:10, padding:'12px 16px', border:`1px solid ${T.g200}` }}>
        {[{ l:'Salle export', v:audit.zoneExpedition||'—' }, { l:'Semaine', v:audit.semaineExport||'—' }, { l:"Date de l'audit", v:fmt(new Date()) }].map(x => (
          <div key={x.l}>
            <div style={{ fontSize:'.62rem', color:T.g400, fontWeight:700, textTransform:'uppercase', letterSpacing:'.06em', marginBottom:3 }}>{x.l}</div>
            <div style={{ fontSize:'.85rem', fontWeight:800, color:T.navy }}>{x.v}</div>
          </div>
        ))}
      </div>

      {/* Score banner */}
      <div style={{ padding:'14px 18px', background:isParfait?T.successBg:resultat>=80?T.warnBg:T.dangerBg, border:`1.5px solid ${isParfait?T.successBd:resultat>=80?T.warnBd:T.dangerBd}`, borderRadius:12, display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
        <div>
          <div style={{ fontSize:'.72rem', color:T.g500, fontWeight:700, textTransform:'uppercase', letterSpacing:'.06em', marginBottom:4 }}>Résultat de l'audit</div>
          <div style={{ fontSize:'.82rem', fontWeight:700, color:isParfait?T.success:resultat>=80?T.warn:T.danger }}>
            {isParfait ? '✓ Audit 100% conforme' : resultat>=80 ? 'Non-conformités mineures' : 'Non-conformités critiques'}
          </div>
        </div>
        <div style={{ fontSize:'2.2rem', fontWeight:900, color:isParfait?T.success:resultat>=80?T.warn:T.danger }}>
          {resultat}<span style={{ fontSize:'1rem' }}>%</span>
        </div>
      </div>

      <div style={{ overflowX:'auto', marginBottom:16, borderRadius:12, border:`1px solid ${T.g200}` }}>
        <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'.78rem' }}>
          <thead>
            <tr style={{ background:'linear-gradient(135deg,#0B1E3D,#1D4ED8)', color:'#fff' }}>
              <th style={{ padding:'10px 14px', textAlign:'left', fontWeight:700, minWidth:240, fontSize:'.72rem' }}>Critère d'évaluation</th>
              {[1,2,3].map(n => <th key={n} style={{ padding:'10px 12px', textAlign:'center', fontWeight:700, fontSize:'.72rem' }}>Container {n}</th>)}
            </tr>
          </thead>
          <tbody>
            {CRITERES.map((c, ri) => (
              <tr key={c.key} style={{ background:ri%2===0?'#fff':T.g50, borderBottom:`1px solid ${T.g200}` }}>
                <td style={{ padding:'9px 14px', fontWeight:600, color:T.g700 }}>{c.label}</td>
                {[0,1,2].map(ci => {
                  const val = scores[`${c.key}_${ci}`];
                  return (
                    <td key={ci} style={{ padding:'6px 10px', textAlign:'center' }}>
                      <select value={val} onChange={e => setScores(p => ({ ...p, [`${c.key}_${ci}`]:e.target.value }))}
                        style={{ padding:'5px 8px', border:`1.5px solid ${scoreBd(val)}`, borderRadius:7, fontSize:'.78rem', background:scoreColor(val), fontWeight:700, color:val==='NA'?T.g400:parseFloat(val)===10?T.success:parseFloat(val)<5?T.danger:T.warn, cursor:'pointer' }}>
                        <option value="10">10</option><option value="8">8</option>
                        <option value="6">6</option><option value="4">4</option>
                        <option value="2">2</option><option value="0">0</option>
                        <option value="NA">NA</option>
                      </select>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Field label="Remarques">
        <textarea value={remarques} onChange={e => setRemarques(e.target.value)} rows={3}
          style={{ ...inp, resize:'vertical' }} placeholder="Remarques libres…"/>
      </Field>

      {view === 'formulaire' ? (
        <PBtn onClick={handleValider} disabled={loading} color={isParfait?T.success:T.danger} full>
          {loading ? 'Envoi…' : <>{Ic.arrow} Continuer vers l'envoi</>}
        </PBtn>
      ) : (
        <div style={{ background:T.blueL, border:`1.5px solid ${T.blueB}`, borderRadius:12, padding:'16px 18px', marginTop:8 }}>
          <div style={{ fontWeight:800, color:T.navy, marginBottom:8 }}>Envoyer le rapport</div>
          <div style={{ fontSize:'.78rem', color:T.g500, marginBottom:12 }}>Ajoutez un ou plusieurs destinataires pour transmettre le rapport final.</div>
          <Field label="Destinataires du rapport *">
            <textarea value={emailsInput} onChange={e => { setEmailsInput(e.target.value); setRecipientErr(''); }} rows={3} placeholder="prenom.nom@leoni.com, autre@leoni.com" style={{ ...inp, resize:'vertical' }}/>
          </Field>
          {recipientErr && <div style={{ color:T.danger, fontSize:'.72rem', marginBottom:10 }}>{recipientErr}</div>}
          <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
            <PBtn onClick={() => { setView('formulaire'); setRecipientErr(''); }} color={T.g500} style={{ minWidth:120 }}>
              Retour
            </PBtn>
            <PBtn onClick={handleValider} disabled={loading} color={isParfait?T.success:T.danger} style={{ minWidth:220 }}>
              {loading ? 'Envoi…' : <>{Ic.send} Envoyer le rapport</>}
            </PBtn>
          </div>
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════
   PDCA MODAL (règle plate) - inchangé
══════════════════════════════════════════ */
function PDCAModal({ auditId, auditRef, responsables, nonConformites, onClose, onSent }) {
  const [mode,      setMode]      = useState('plateforme');
  const [respId,    setRespId]    = useState('');
  const [emailExt,  setEmailExt]  = useState('');
  const [matricule, setMatricule] = useState('');
  const [nomDest,   setNomDest]   = useState('');
  const [envSepare, setEnvSepare] = useState(false);
  const [ncEmails,  setNcEmails]  = useState(nonConformites.map(nc => ({ ...nc, emailDest:'', nomDest:'' })));
  const [sending,   setSending]   = useState(false);
  const [err,       setErr]       = useState('');
  const sent = useRef(false);

  const updNcEmail = (i, k, v) => setNcEmails(p => p.map((x, j) => j === i ? { ...x, [k]:v } : x));

  const validate = () => {
    if (mode === 'plateforme' && !respId) { setErr('Sélectionnez un responsable qualité.'); return false; }
    if (mode === 'email') {
      if (!envSepare && !emailExt.trim()) { setErr("L'email est requis."); return false; }
      if (!envSepare && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailExt)) { setErr("Format email invalide."); return false; }
      if (envSepare) {
        for (let i = 0; i < ncEmails.length; i++) {
          if (!ncEmails[i].emailDest.trim()) { setErr(`Email manquant pour NC #${i+1}.`); return false; }
        }
      }
    }
    setErr(''); return true;
  };

  const send = async () => {
    if (sent.current || !validate()) return;
    sent.current = true; setSending(true);
    try {
      const body = {
        responsableQualiteId: mode === 'plateforme' ? parseInt(respId) : null,
        emailExterne: mode === 'email' && !envSepare ? emailExt : null,
        matriculeExterne: matricule || null,
        nomDestinataire: nomDest || null,
        envoyerSepare: mode === 'email' && envSepare,
        nonConformites: nonConformites.map((nc, i) => ({
          ...nc,
          emailDestinataire: mode === 'email' && envSepare ? ncEmails[i]?.emailDest : null,
          nomDestinataire: mode === 'email' && envSepare ? ncEmails[i]?.nomDest : null,
        })),
      };
      await fetch(`http://localhost:8080/api/audit-special/${auditId}/pdca-regle-plate`, { method:'POST', headers:apiH(), body:JSON.stringify(body) });
      onSent();
    } catch(e) { setErr('Erreur : '+e.message); sent.current = false; }
    setSending(false);
  };

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.5)', zIndex:1200, display:'flex', alignItems:'center', justifyContent:'center', backdropFilter:'blur(4px)' }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background:'#fff', borderRadius:20, width:'100%', maxWidth:560, maxHeight:'88vh', overflow:'hidden', boxShadow:'0 32px 80px rgba(0,0,0,.22)', display:'flex', flexDirection:'column' }}>
        <div style={{ background:`linear-gradient(135deg,${T.navy},#DC2626)`, padding:'16px 20px', display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0 }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ width:36, height:36, borderRadius:9, background:'rgba(255,255,255,.12)', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff' }}>{Ic.pdca}</div>
            <div>
              <div style={{ fontWeight:800, color:'#fff', fontSize:'.95rem' }}>PDCA — Règle Plate</div>
              <div style={{ fontSize:'.72rem', color:'rgba(255,255,255,.6)', marginTop:2 }}>{nonConformites.length} NC — {auditRef}</div>
            </div>
          </div>
          <button onClick={onClose} style={{ width:32, height:32, borderRadius:8, background:'rgba(255,255,255,.12)', border:'none', cursor:'pointer', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <div style={{ padding:'20px 24px', overflowY:'auto', flex:1 }}>
          {/* NC summary */}
          <div style={{ background:T.dangerBg, border:`1.5px solid ${T.dangerBd}`, borderRadius:10, padding:'12px 16px', marginBottom:16 }}>
            <div style={{ fontSize:'.78rem', fontWeight:700, color:T.danger, marginBottom:8 }}>Non-conformités :</div>
            {nonConformites.map((nc, i) => (
              <div key={i} style={{ display:'flex', alignItems:'center', gap:8, fontSize:'.78rem', color:T.g700, padding:'4px 0', borderTop:i>0?`1px solid ${T.dangerBd}`:'none' }}>
                <span style={{ fontWeight:700, minWidth:24, color:T.danger }}>#{i+1}</span>
                <span style={{ fontWeight:700 }}>N° {nc.numeroInstrument||'—'}</span>
                <span style={{ color:T.g400 }}>·</span>
                <span>{nc.typeInstrument?.replace('_',' ')||'—'}</span>
                <span style={{ color:T.g400 }}>·</span>
                <span style={{ color:T.g500 }}>{nc.emplacement||'—'}</span>
              </div>
            ))}
          </div>

          {/* Mode buttons */}
          <div style={{ marginBottom:16 }}>
            <label style={lbl}>Envoyer le PDCA à</label>
            <div style={{ display:'flex', gap:8 }}>
              {[{ m:'plateforme', label:'Responsable plateforme' }, { m:'email', label:'Email externe' }].map(({ m, label }) => (
                <button key={m} onClick={() => { setMode(m); setErr(''); }}
                  style={{ flex:1, padding:'10px 14px', borderRadius:10, border:`2px solid ${mode===m?T.blue:T.g200}`, background:mode===m?T.blueL:'#fff', color:mode===m?T.blue:T.g500, fontWeight:700, fontSize:'.8rem', cursor:'pointer', fontFamily:'inherit', transition:'all .15s' }}>
                  {label}
                </button>
              ))}
            </div>
          </div>

          {mode === 'plateforme' && (
            <Field label="Responsable Qualité Centrale *">
              <select value={respId} onChange={e => setRespId(e.target.value)} style={inp}>
                <option value="">Sélectionner…</option>
                {responsables.map(r => <option key={r.id} value={r.id}>{r.prenom} {r.nom}</option>)}
              </select>
            </Field>
          )}

          {mode === 'email' && (
            <div>
              {nonConformites.length > 1 && (
                <div style={{ marginBottom:14 }}>
                  <label style={lbl}>Mode d'envoi</label>
                  <div style={{ display:'flex', gap:8 }}>
                    <button onClick={() => setEnvSepare(false)} style={{ flex:1, padding:'9px', borderRadius:9, border:`2px solid ${!envSepare?T.teal:T.g200}`, background:!envSepare?T.tealBg:'#fff', color:!envSepare?T.teal:T.g500, fontWeight:700, fontSize:'.78rem', cursor:'pointer', fontFamily:'inherit' }}>
                      Toutes NC → même responsable
                    </button>
                    <button onClick={() => setEnvSepare(true)} style={{ flex:1, padding:'9px', borderRadius:9, border:`2px solid ${envSepare?T.purple:T.g200}`, background:envSepare?T.purpleBg:'#fff', color:envSepare?T.purple:T.g500, fontWeight:700, fontSize:'.78rem', cursor:'pointer', fontFamily:'inherit' }}>
                      Un responsable par NC
                    </button>
                  </div>
                </div>
              )}

              {!envSepare && (
                <div>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:10 }}>
                    <Field label="Email responsable *">
                      <input value={emailExt} onChange={e => { setEmailExt(e.target.value); setErr(''); }} placeholder="responsable@leoni.com" type="email" style={inp}/>
                    </Field>
                    <Field label="Matricule (optionnel)">
                      <input value={matricule} onChange={e => setMatricule(e.target.value)} placeholder="L12345" style={inp}/>
                    </Field>
                  </div>
                  <Field label="Nom complet">
                    <input value={nomDest} onChange={e => setNomDest(e.target.value)} placeholder="Prénom NOM" style={inp}/>
                  </Field>
                </div>
              )}

              {envSepare && ncEmails.map((nc, i) => (
                <div key={i} style={{ background:T.g50, border:`1px solid ${T.g200}`, borderRadius:10, padding:'12px 14px', marginBottom:10 }}>
                  <div style={{ fontSize:'.78rem', fontWeight:800, color:T.danger, marginBottom:10 }}>NC #{i+1} — N° {nc.numeroInstrument||'—'}</div>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                    <Field label="Email *"><input value={nc.emailDest} onChange={e => updNcEmail(i,'emailDest',e.target.value)} placeholder="email@leoni.com" type="email" style={cinp}/></Field>
                    <Field label="Nom"><input value={nc.nomDest} onChange={e => updNcEmail(i,'nomDest',e.target.value)} placeholder="Prénom NOM" style={cinp}/></Field>
                  </div>
                </div>
              ))}
            </div>
          )}

          {err && <div style={{ color:T.danger, fontSize:'.78rem', fontWeight:700, marginBottom:10, padding:'8px 12px', background:T.dangerBg, borderRadius:8, border:`1px solid ${T.dangerBd}` }}>{err}</div>}

          <div style={{ fontSize:'.73rem', color:T.g400, marginBottom:16, fontStyle:'italic' }}>
            Email avec les non-conformités et deux boutons (Valider / En cours). Relance auto après 3 jours.
          </div>

          <div style={{ display:'flex', gap:8, justifyContent:'flex-end' }}>
            <button onClick={onClose} style={{ padding:'9px 18px', borderRadius:10, border:'1.5px solid #D1D5DB', background:'#fff', color:'#374151', cursor:'pointer', fontFamily:"'Inter',sans-serif", fontWeight:700, fontSize:'.82rem' }}>
              Annuler
            </button>
            <PBtn onClick={send} disabled={sending} color={T.danger}>
              {sending ? 'Envoi…' : <>{Ic.send} Envoyer le PDCA</>}
            </PBtn>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════
   CONFORMITÉ CHECK (avec polling pour audits export)
══════════════════════════════════════════ */
function ConformiteCheck({ isReglePlate, hasNC, ncRows, onValider, onPDCA, loading, auditRef, responsables, auditId, onPDCASent, audit, onRefresh }) {
  const [showPDCA, setShowPDCA] = useState(false);
  const [planStatut, setPlanStatut] = useState(null);
  const [checking, setChecking] = useState(false);

  // Pour les audits export avec NC, vérifier périodiquement le statut du plan d'action
  useEffect(() => {
    if (!isReglePlate && hasNC) {
      const checkStatut = async () => {
        try {
          const r = await fetch(
            `http://localhost:8080/api/audit-special/${auditId}/plan-action-statut`,
            { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
          );
          const data = await r.json();
          setPlanStatut(data.statut);
          if (data.statut === 'RESOLU') {
            // Si le plan est résolu, recharger l'audit (onRefresh)
            onRefresh && onRefresh();
          }
        } catch {}
      };
      checkStatut();
      const interval = setInterval(checkStatut, 10000);
      return () => clearInterval(interval);
    }
  }, [isReglePlate, hasNC, auditId, onRefresh]);

  // Cas audit export avec NC – afficher l'état d'attente
  if (!isReglePlate && hasNC) {
    const isResolu  = planStatut === 'RESOLU';
    const isEnCours = planStatut === 'EN_COURS';
    const isOuvert  = planStatut === 'OUVERT' || planStatut === null;

    return (
      <div style={{ textAlign:'center', padding:'2rem 1rem' }}>
        <div style={{ width:80, height:80, borderRadius:22,
                      background: isResolu ? T.successBg : isEnCours ? T.warnBg : T.purpleBg,
                      display:'flex', alignItems:'center', justifyContent:'center',
                      margin:'0 auto 22px',
                      border:`2px solid ${isResolu ? T.successBd : isEnCours ? T.warnBd : T.purpleBd}` }}>
          {isResolu
            ? <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke={T.success} strokeWidth="2" strokeLinecap="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
            : <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={isEnCours?T.warn:T.purple} strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          }
        </div>

        {isResolu ? (
          <>
            <h3 style={{ color:T.success, margin:'0 0 10px', fontSize:'1.1rem', fontWeight:800 }}>
              Validé par le responsable magasin ✓
            </h3>
            <p style={{ color:T.g500, fontSize:'.84rem', lineHeight:1.6, maxWidth:400, margin:'0 auto 28px' }}>
              La non-conformité a été résolue. Vous pouvez maintenant générer le rapport final.
            </p>
            <PBtn onClick={() => onValider(true)} disabled={loading} color={T.success} style={{ minWidth:280 }}>
              {loading ? 'Génération…' : <>{Ic.pdf} Générer le rapport final</>}
            </PBtn>
          </>
        ) : (
          <>
            <h3 style={{ color: isEnCours ? T.warn : T.purple,
                         margin:'0 0 10px', fontSize:'1.1rem', fontWeight:800 }}>
              {isEnCours ? 'En cours de traitement…' : 'En attente de validation'}
            </h3>
            <p style={{ color:T.g500, fontSize:'.84rem', lineHeight:1.6, maxWidth:440, margin:'0 auto 20px' }}>
              {isEnCours
                ? 'Le responsable magasin a indiqué être en cours de traitement. Une relance sera envoyée dans 3 jours si aucune validation.'
                : "Un email a été envoyé au responsable magasin. L'audit sera automatiquement validé dès qu'il cliquera sur le bouton de confirmation."}
            </p>

            {/* Indicateur de polling */}
            <div style={{ display:'inline-flex', alignItems:'center', gap:8,
                         background:T.g50, border:`1px solid ${T.g200}`,
                         borderRadius:10, padding:'10px 18px', marginBottom:20,
                         fontSize:'.78rem', color:T.g500, fontWeight:600 }}>
              <div style={{ width:8, height:8, borderRadius:'50%',
                           background: isEnCours ? T.warn : T.purple,
                           animation:'pulse 2s infinite' }}/>
              Vérification automatique toutes les 10 secondes…
            </div>

            <div style={{ display:'flex', gap:10, justifyContent:'center', flexWrap:'wrap' }}>
              <button onClick={async () => {
                setChecking(true);
                try {
                  const r = await fetch(
                    `http://localhost:8080/api/audit-special/${auditId}/plan-action-statut`,
                    { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
                  );
                  const data = await r.json();
                  setPlanStatut(data.statut);
                  if (data.statut === 'RESOLU') {
                    onRefresh && onRefresh();
                  }
                } catch {}
                setChecking(false);
              }} style={{ display:'inline-flex', alignItems:'center', gap:7, padding:'9px 18px',
                         borderRadius:10, border:`1.5px solid ${T.g200}`, background:'#fff',
                         color:T.g700, cursor:'pointer', fontWeight:700, fontSize:'.82rem',
                         fontFamily:'inherit' }}>
                {checking
                  ? <div style={{ width:14, height:14, border:`2px solid ${T.g200}`,
                                 borderTopColor:T.navy, borderRadius:'50%',
                                 animation:'spin .6s linear infinite' }}/>
                  : Ic.arrow}
                Vérifier maintenant
              </button>
            </div>
          </>
        )}
      </div>
    );
  }

  // Audit règle plate ou export sans NC – comportement normal
  if (!hasNC) {
    return (
      <div style={{ textAlign:'center', padding:'2.5rem 1rem' }}>
        <div style={{ width:80, height:80, borderRadius:22, background:T.successBg,
                      display:'flex', alignItems:'center', justifyContent:'center',
                      margin:'0 auto 22px', border:`2px solid ${T.successBd}` }}>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke={T.success} strokeWidth="2" strokeLinecap="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
            <polyline points="22 4 12 14.01 9 11.01"/>
          </svg>
        </div>
        <h3 style={{ color:T.success, margin:'0 0 10px', fontSize:'1.15rem', fontWeight:800 }}>Tout est conforme !</h3>
        <p style={{ color:T.g500, fontSize:'.85rem', lineHeight:1.6, maxWidth:400, margin:'0 auto 28px' }}>
          Aucune non-conformité détectée. Vous pouvez valider l'audit et générer le rapport final.
        </p>
        <PBtn onClick={() => onValider(false)} disabled={loading} color={T.success} style={{ minWidth:280 }}>
          {loading ? 'Génération du rapport…' : <>{Ic.pdf} Valider et générer le rapport final</>}
        </PBtn>
      </div>
    );
  }

  // Règle plate avec NC
  return (
    <div style={{ textAlign:'center', padding:'2rem 1rem' }}>
      <div style={{ width:80, height:80, borderRadius:22, background:T.warnBg,
                    display:'flex', alignItems:'center', justifyContent:'center',
                    margin:'0 auto 22px', border:`2px solid ${T.warnBd}` }}>
        {Ic.warn}
      </div>
      <h3 style={{ color:T.warn, margin:'0 0 10px', fontSize:'1.1rem', fontWeight:800 }}>Non-conformités détectées</h3>
      <p style={{ color:T.g500, fontSize:'.84rem', lineHeight:1.6, maxWidth:420, margin:'0 auto 20px' }}>
        {ncRows.length} non-conformité{ncRows.length>1?'s':''} relevée{ncRows.length>1?'s':''}.
        Créez un PDCA avant de valider.
      </p>
      <div style={{ background:T.dangerBg, border:`1px solid ${T.dangerBd}`, borderRadius:10,
                    padding:'12px', marginBottom:20, maxWidth:480, margin:'0 auto 20px', textAlign:'left' }}>
        {ncRows.map((nc, i) => (
          <div key={i} style={{ display:'flex', alignItems:'center', gap:8, fontSize:'.78rem',
                               color:T.g700, padding:'5px 0',
                               borderTop:i>0?`1px solid ${T.dangerBd}`:'none' }}>
            <span style={{ color:T.danger, fontWeight:800 }}>#{i+1}</span>
            <span style={{ fontWeight:700 }}>N° {nc.numeroInstrument||'—'}</span>
            <span style={{ color:T.g400 }}>·</span>
            <span>{nc.typeInstrument?.replace('_',' ')||'—'}</span>
            <span style={{ color:T.g400 }}>·</span>
            <span style={{ color:T.g500 }}>{nc.emplacement||'—'}</span>
          </div>
        ))}
      </div>
      <div style={{ display:'flex', gap:10, justifyContent:'center', flexWrap:'wrap' }}>
        <PBtn onClick={() => setShowPDCA(true)} color={T.danger}>
          {Ic.pdca} Créer PDCA ({ncRows.length} NC)
        </PBtn>
        <PBtn onClick={() => onValider(true)} disabled={loading} color={T.warn}>
          {loading ? 'Génération…' : <>{Ic.pdf} Valider sans PDCA</>}
        </PBtn>
      </div>
      {showPDCA && (
        <PDCAModal auditId={auditId} auditRef={auditRef} responsables={responsables}
          nonConformites={ncRows} onClose={() => setShowPDCA(false)}
          onSent={() => { setShowPDCA(false); onPDCASent && onPDCASent(); }}/>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════
   CARTE D'IDENTITÉ AUDIT (step finale)
══════════════════════════════════════════ */
function CarteIdentite({ audit, isReglePlate, rapportUrl, onDownload, downloadLoading }) {
  const dateTerminaison = audit.dateRealisation 
    ? fmt(audit.dateRealisation) 
    : (audit.datePrevue ? fmt(audit.datePrevue) : fmt(new Date()));

  const fields = [
    { l:'Référence', v:audit.reference },
    { l:'Type d\'audit', v:isReglePlate ? 'Audit Règle Plate (IT TN 3627)' : 'Audit Magasin Export (IT 3600-05)' },
    { l:'Plant', v:audit.plantNom||'—' },
    { l:'Auditeur', v:audit.auditeurNom||(audit.auditeur ? `${audit.auditeur.prenom} ${audit.auditeur.nom}` : '—') },
    { l:'Expert / Planificateur', v:audit.planificateurNom||(audit.planificateur ? `${audit.planificateur.prenom} ${audit.planificateur.nom}` : '—') },
    { l:'Date prévue', v:fmt(audit.datePrevue) },
    { l:'Date de réalisation', v:fmt(audit.dateRealisation||new Date()) },
    ...(isReglePlate ? [
      { l:'Prochain contrôle', v:fmt(audit.deadline) },
      { l:'PDCA déclenché', v:audit.pdcaDeclenche ? 'Oui' : 'Non' },
    ] : [
      { l:'Salle d\'export', v:audit.zoneExpedition||'—' },
      { l:'Semaine', v:audit.semaineExport||'—' },
      { l:'Résultat (%)', v:audit.actionImmediate?.includes('%') ? audit.actionImmediate : '—' },
      { l:'Validé par resp. magasin', v:audit.valideParResponsableMagasin ? 'Oui' : 'En attente' },
    ]),
    { l:'Statut final', v:'TERMINÉ' },
  ];

  return (
    <div style={{
      background:'#fff',
      borderRadius:20,
      border: '2px solid #9eafd399',
      overflow:'hidden',
      boxShadow:'0 4px 16px rgba(0,0,0,.06)'
    }}>
      <div style={{
        background:'#c4d7ed',
        padding:'16px 24px',
        borderBottom:`1px solid ${T.g200}`
      }}>
        <div style={{ display:'flex', alignItems:'center', gap:14, flexWrap:'wrap' }}>
          <div style={{
            width:44,
            height:44,
            borderRadius:12,
            background:'#d6e7f2',
            border:`1px solid ${T.g300}`,
            display:'flex',
            alignItems:'center',
            justifyContent:'center',
            color:T.navy
          }}>
            {Ic.id}
          </div>
          <div>
            <div style={{ fontWeight:800, fontSize:'1.05rem', color:T.navy }}>
              Carte d'identité de l'audit
            </div>
            <div style={{ fontSize:'.72rem', color:T.g500, marginTop:2 }}>
              {audit.reference} · Audit terminé
            </div>
          </div>
          <div style={{ marginLeft:'auto' }}>
            <div style={{
              background:T.successBg,
              borderRadius:24,
              padding:'4px 14px',
              border:`1px solid ${T.successBd}`
            }}>
              <span style={{ fontSize:'.7rem', fontWeight:700, color:T.success, textTransform:'uppercase', letterSpacing:'.05em' }}>
                TERMINÉ
              </span>
            </div>
          </div>
        </div>
      </div>

      <div style={{ padding:'24px' }}>
        <div style={{
          display:'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: 16
        }}>
          {fields.map((f, idx) => (
            <div key={idx} style={{ padding:'12px 14px', background:'#c8c8c88d', borderRadius:12 }}>
              <div style={{
                fontSize:'.68rem',
                fontWeight:700,
                color:T.g400,
                textTransform:'uppercase',
                letterSpacing:'.07em',
                marginBottom:6
              }}>
                {f.l}
              </div>
              <div style={{
                fontSize:'.9rem',
                fontWeight:600,
                color:T.navy,
                wordBreak:'break-word',
                lineHeight:1.4
              }}>
                {f.v}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{
        background:'#becbd498',
        borderTop:`1px solid ${T.g300}`,
        padding:'16px 24px',
        display:'flex',
        gap:12,
        justifyContent:'flex-start',
        alignItems:'center'
      }}>
        <PBtn onClick={onDownload} disabled={downloadLoading} color={T.navy}>
          {downloadLoading ? 'Génération…' : <>{Ic.dl} Télécharger le rapport</>}
        </PBtn>
        {rapportUrl && (
          <a href={`http://localhost:8080${rapportUrl}`} target="_blank" rel="noopener noreferrer" style={{ textDecoration:'none' }}>
            <PBtn color={T.blue}>
              {Ic.eye} Voir le rapport
            </PBtn>
          </a>
        )}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════
   PAGE PRINCIPALE
══════════════════════════════════════════ */
export default function AuditSpecialPage() {
  const { id }   = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const isReglePlate = location.pathname.includes('/regle-plate/');
  const auditType    = isReglePlate ? 'regle-plate' : 'export';

  /* ── Save navigation context ── */
  useEffect(() => {
    const ctx = {
      auditType,
      timestamp: new Date().getTime(),
    };
    localStorage.setItem('pap:last-audit-context', JSON.stringify(ctx));
  }, [auditType]);

  /* ── Draft keys ── */
  const DK = {
    step:      DRAFT.getKey(auditType, id, 'step'),
    flowMode:  DRAFT.getKey(auditType, id, 'flowMode'),
    formulaire:DRAFT.getKey(auditType, id, 'formulaire'),
    ncRows:    DRAFT.getKey(auditType, id, 'ncRows'),
    hasNC:     DRAFT.getKey(auditType, id, 'hasNC'),
    formData:  DRAFT.getKey(auditType, id, 'formData'),
  };

  /* ── State ── */
  const [audit,         setAudit]         = useState(null);
  const [loading,       setLoading]       = useState(true);
  const [step,          setStep]          = useState(() => DRAFT.load(DK.step)?.value || 'commencer');
  const [flowMode,      setFlowMode]      = useState(() => DRAFT.load(DK.flowMode)?.value || 'rapport');
  const [toast,         setToast]         = useState(null);
  const [importing,     setImporting]     = useState(false);
  const [validating,    setValidating]    = useState(false);
  const [downloadLoading, setDownloadLoading] = useState(false);
  const [responsables,  setResponsables]  = useState([]);
  const [rapportUrl,    setRapportUrl]    = useState(null);
  const [pdcaSent,      setPdcaSent]      = useState(false);
  const [planActionStatut, setPlanActionStatut] = useState(null);

  /* ── NC state (persisted) ── */
  const [ncRows,  setNcRows]  = useState(() => DRAFT.load(DK.ncRows)?.rows || []);
  const [hasNC,   setHasNC]   = useState(() => DRAFT.load(DK.hasNC)?.value ?? false);
  const [formData, setFormData] = useState(() => DRAFT.load(DK.formData) || null);

  const fileRef = useRef();

  const showToast = (msg, type='success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4500);
  };

  /* ── Persist step & flowMode ── */
  const goToStep = useCallback((newStep, newFlow) => {
    setStep(newStep);
    DRAFT.save(DK.step, { value: newStep });
    if (newFlow) {
      setFlowMode(newFlow);
      DRAFT.save(DK.flowMode, { value: newFlow });
    }
  }, [DK.step, DK.flowMode]);

  /* ── Load audit ── */
  useEffect(() => {
    const load = async () => {
      try {
        const list = isReglePlate
          ? await auditSpecialAPI.mesAuditsReglePlates().then(r => r.data || [])
          : await auditSpecialAPI.mesAuditsExport().then(r => r.data || []);
        const found = list.find(a => String(a.id) === String(id));
        setAudit(found || null);

        if (found?.statut === 'TERMINE') {
          setRapportUrl(found.rapportUrl || found.rapportGenerePdfUrl || null);
          goToStep('termine');
          setLoading(false);
          return;
        }

        if (found?.statut === 'EN_COURS') {
          const savedStep = DRAFT.load(DK.step)?.value;
          const savedFlow = DRAFT.load(DK.flowMode)?.value;
          if (savedStep && ['choix','import','formulaire','conformite','pdca_step'].includes(savedStep)) {
            setStep(savedStep);
            if (savedFlow) setFlowMode(savedFlow);
          } else {
            goToStep('choix', 'rapport');
          }
        }
      } catch { setAudit(null); }
      setLoading(false);
    };
    load();
  }, [id, isReglePlate]);

  /* ── Load responsables ── */
  useEffect(() => {
    fetch('http://localhost:8080/api/utilisateurs/roles/responsables-qualite', { headers: { Authorization:`Bearer ${localStorage.getItem('token')}` } })
      .then(r => r.json()).then(d => setResponsables(Array.isArray(d) ? d : [])).catch(() => {});
  }, []);

  /* ── Commencer ── */
  const handleCommencer = async () => {
    try {
      await auditSpecialAPI.demarrer(audit.id);
      setAudit(p => ({ ...p, statut:'EN_COURS' }));
      goToStep('choix', 'rapport');
      showToast('Audit démarré ✓');
    } catch(e) { showToast('Erreur : '+(e.message||''), 'error'); }
  };

  /* ── Import fichier ── */
  const handleImportFile = async file => {
    if (!file) return;
    setImporting(true);
    try {
      await auditSpecialAPI.validerImport(audit.id, file);
      showToast('Rapport importé ✓');
      setAudit(p => ({ ...p, rapportGenere:true }));
      goToStep('conformite', 'rapport');
    } catch(e) { showToast('Erreur import : '+(e?.message||''), 'error'); }
    setImporting(false);
  };

  /* ── Valider formulaire (avant step conformite) ── */
  const handleValiderFormulaire = async (data, hasNCFlag, ncRowsData) => {
    setValidating(true);
    try {
      await auditSpecialAPI.validerFormulaire(audit.id, data);
      setHasNC(hasNCFlag);
      setNcRows(ncRowsData || []);
      setFormData(data);
      DRAFT.save(DK.hasNC, { value: hasNCFlag });
      DRAFT.save(DK.ncRows, { rows: ncRowsData || [] });
      DRAFT.save(DK.formData, data);
      goToStep('conformite', 'formulaire');
      showToast('Formulaire enregistré — vérification de conformité');
    } catch(e) { showToast('Erreur : '+(e?.message||''), 'error'); }
    setValidating(false);
  };

  /* ── Valider depuis l'écran conformité → génère rapport final ── */
  const handleValiderConformite = async (withNC) => {
    // Pour les audits export avec NC, vérifier que le plan d'action est résolu
    if (!isReglePlate && hasNC) {
      if (planActionStatut !== 'RESOLU') {
        showToast('En attente de validation du responsable magasin par email.', 'error');
        return;
      }
    }

    setValidating(true);
    try {
      const resp = await fetch(`http://localhost:8080/api/audit-special/${audit.id}/generer-rapport`, {
        method: 'POST',
        headers: apiH(),
        body: JSON.stringify({ includeNonConformites: withNC }),
      });
      const result = await resp.json();
      setRapportUrl(result.rapportUrl || result.pdfUrl || null);
      setAudit(p => ({ ...p, statut:'TERMINE', rapportUrl: result.rapportUrl || result.pdfUrl }));
      DRAFT.clearAll(auditType, id);
      goToStep('termine');
      showToast('Rapport final généré ✓');
    } catch(e) {
      setAudit(p => ({ ...p, statut:'TERMINE' }));
      DRAFT.clearAll(auditType, id);
      goToStep('termine');
      showToast('Audit terminé ✓');
    }
    setValidating(false);
  };

  /* ── Télécharger rapport PDF ── */
  const handleDownloadRapport = async () => {
    setDownloadLoading(true);
    try {
      const resp = await fetch(`http://localhost:8080/api/audit-special/${audit.id}/rapport-pdf`, {
        headers: { Authorization:`Bearer ${localStorage.getItem('token')}` },
      });
      if (!resp.ok) throw new Error('Rapport non disponible');
      const blob = await resp.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `rapport_audit_${audit.reference?.replace(/[^a-zA-Z0-9_-]/g,'_')}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast('Rapport téléchargé ✓');
    } catch(e) { showToast('Erreur téléchargement : '+e.message, 'error'); }
    setDownloadLoading(false);
  };

  // Fonction de rafraîchissement de l'audit (pour onRefresh)
  const handleRefreshAudit = useCallback(async () => {
    try {
      const list = isReglePlate
        ? await auditSpecialAPI.mesAuditsReglePlates().then(r => r.data || [])
        : await auditSpecialAPI.mesAuditsExport().then(r => r.data || []);
      const found = list.find(a => String(a.id) === String(id));
      if (found?.statut === 'TERMINE') {
        setAudit(found);
        DRAFT.clearAll(auditType, id);
        goToStep('termine');
        showToast('Audit validé par le responsable magasin ✓');
      } else {
        setAudit(found);
      }
    } catch(e) {}
  }, [id, isReglePlate, auditType, goToStep, showToast]);

  /* ── Steps config ── */
  const accentColor = isReglePlate ? T.teal : T.purple;
  const typeLabel   = isReglePlate ? 'Audit Règle Plate' : 'Audit Magasin Export';
  const typeIcon    = isReglePlate ? Ic.ruler : Ic.box;

  const stepsDone = {
    commencer:  ['choix','import','formulaire','conformite','termine'].includes(step),
    choix:      ['import','formulaire','conformite','termine'].includes(step),
    saisie:     ['conformite','termine'].includes(step),
    conformite: step === 'termine',
    termine:    step === 'termine',
  };

  const steps = [
    { key:'commencer',  label:'Démarrer',        done: stepsDone.commencer },
    { key:'choix',      label:'Mode de saisie',   done: stepsDone.choix },
    { key:'saisie',     label: flowMode==='formulaire' ? 'Formulaire' : 'Import', done: stepsDone.saisie },
    { key:'conformite', label:'Conformité',       done: stepsDone.conformite },
    { key:'termine',    label:'Terminé',          done: stepsDone.termine },
  ];

  /* ── Loading / Not found ── */
  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'55vh', fontFamily:"'Inter',sans-serif", gap:12, color:T.g400 }}>
      <div style={{ width:28, height:28, border:`3px solid ${T.g200}`, borderTopColor:T.navy, borderRadius:'50%', animation:'spin .8s linear infinite' }}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      Chargement…
    </div>
  );

  if (!audit) return (
    <div style={{ textAlign:'center', padding:'4rem', fontFamily:"'Inter',sans-serif", color:T.g400 }}>
      Audit introuvable.
      <br/>
      <button onClick={() => navigate('/auditeur/audits')} style={{ marginTop:14, background:T.navy, color:'#fff', border:'none', borderRadius:10, padding:'9px 20px', cursor:'pointer', fontFamily:'inherit', fontWeight:700 }}>
        Retour
      </button>
    </div>
  );

  return (
    <div style={{ fontFamily:"'Inter','DM Sans',sans-serif", background:'#ffffff', padding:'0 0 3rem', minHeight:'100vh' }}>
      <style>{`
        @keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}
      `}</style>

      {/* Toast */}
      {toast && (
        <div style={{ position:'fixed', top:14, right:14, zIndex:3000, padding:'11px 18px', borderRadius:12, background:toast.type==='success'?T.successBg:T.dangerBg, border:`1.5px solid ${toast.type==='success'?T.successBd:T.dangerBd}`, color:toast.type==='success'?T.success:T.danger, fontWeight:700, fontSize:13, boxShadow:'0 8px 28px rgba(0,0,0,.15)', animation:'fadeUp .25s ease', maxWidth:360 }}>
          {toast.msg}
        </div>
      )}

      {/* Step bar */}
      <StepBar steps={steps} navigate={navigate}/>

      {/* Content */}
      <div style={{ padding:'1.5rem 2rem', animation:'fadeUp .3s ease' }}>

        {/* Audit header */}
        <div style={{ background:`linear-gradient(135deg,${T.navy},${accentColor})`, borderRadius:16, padding:'16px 22px', marginBottom:20, display:'flex', alignItems:'center', gap:16, boxShadow:'0 4px 16px rgba(0,0,0,.12)' }}>
          <div style={{ width:48, height:48, borderRadius:12, background:'rgba(255,255,255,.12)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, color:'#fff' }}>
            {typeIcon}
          </div>
          <div style={{ flex:1 }}>
            <div style={{ fontWeight:900, color:'#fff', fontSize:'1rem', marginBottom:3 }}>{audit.reference}</div>
            <div style={{ fontSize:'.76rem', color:'rgba(255,255,255,.65)', display:'flex', flexWrap:'wrap', gap:'0 12px' }}>
              <span>{typeLabel}</span>
              {audit.plantNom && <span>· {audit.plantNom}</span>}
              {audit.zoneExpedition && <span>· Salle: {audit.zoneExpedition}</span>}
              {audit.semaineExport && <span>· Sem. {audit.semaineExport}</span>}
              <span>· {fmt(audit.datePrevue)}</span>
            </div>
          </div>
          {['choix','import','formulaire','conformite'].includes(step) && (
            <div style={{ background:'rgba(255,255,255,.1)', borderRadius:8, padding:'6px 12px', border:'1px solid rgba(255,255,255,.15)', display:'flex', alignItems:'center', gap:6 }}>
              <div style={{ width:6, height:6, borderRadius:'50%', background:'#FCD34D', animation:'pulse 2s infinite' }}/>
              <span style={{ fontSize:'.7rem', color:'rgba(255,255,255,.8)', fontWeight:700 }}>Brouillon actif</span>
            </div>
          )}
          <span style={{ background:'rgba(255,255,255,.18)', color:'#fff', fontSize:'.72rem', fontWeight:800, padding:'5px 12px', borderRadius:99 }}>
            {audit.statut?.replace('_',' ')}
          </span>
        </div>

        {/* Main card */}
        <div style={{ background:'#fff', borderRadius:16, border:`1px solid ${T.g200}`, boxShadow:'0 2px 12px rgba(0,40,85,.06)', padding:'24px' }}>

          {/* Planification info */}
          {audit && (audit.plantNom || audit.salleExport || audit.semaineExport || audit.datePrevue) && (
            <div style={{ display:'flex', gap:18, alignItems:'center', marginBottom:18, flexWrap:'wrap' }}>
             
             
             
             
            </div>
          )}

          {/* ── COMMENCER ── */}
          {step === 'commencer' && (
            <div style={{ textAlign:'center', padding:'2rem 0' }}>
              <div style={{ width:72, height:72, borderRadius:20, background:isReglePlate?T.tealBg:T.purpleBg, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 20px', color:accentColor, border:`2px solid ${isReglePlate?T.tealBd:T.purpleBd}` }}>
                {typeIcon}
              </div>
              <h3 style={{ color:T.navy, marginBottom:8, fontSize:'1.1rem', fontWeight:800 }}>Prêt à commencer ?</h3>
              <p style={{ color:T.g400, fontSize:'.84rem', marginBottom:28, maxWidth:420, margin:'0 auto 28px', lineHeight:1.6 }}>
                {isReglePlate ? 'Démarrez le contrôle des règles plates et mètres ruban selon IT TN 3627.' : "Démarrez l'audit du magasin export selon IT 3600-05."}
              </p>
              <PBtn onClick={handleCommencer} color={accentColor}>
                {Ic.play} Commencer l'audit
              </PBtn>
            </div>
          )}

          {/* ── CHOIX MODE ── */}
          {step === 'choix' && (
            <div>
              <div style={{ fontWeight:900, fontSize:'1rem', color:T.navy, marginBottom:6 }}>Comment souhaitez-vous soumettre le rapport ?</div>
              <p style={{ color:T.g400, fontSize:'.82rem', marginBottom:22, lineHeight:1.5 }}>Choisissez d'importer votre fichier ou de remplir le formulaire en ligne.</p>
              <div style={{ display:'flex', gap:12, flexDirection:'row', flexWrap:'nowrap' }}>
                <div onClick={() => goToStep('import', 'rapport')}
                  style={{ flex:'0 0 50%', width:'50%', boxSizing:'border-box', padding:'1.5rem 2rem', borderRadius:16, border:`2px solid ${T.g300}`, cursor:'pointer', transition:'all .2s', background:'#fff', boxShadow:'0 2px 8px rgba(0,0,0,.05)', display:'flex', alignItems:'center', gap:20 }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor=T.blue; e.currentTarget.style.transform='translateY(-2px)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor=T.g300; e.currentTarget.style.transform='none'; }}>
                  <div style={{ width:52, height:52, borderRadius:14, background:T.blueL, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, border:`1.5px solid ${T.blueB}`, color:T.blue }}>
                    {Ic.upload}
                  </div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontWeight:800, color:T.navy, fontSize:'.95rem', marginBottom:5 }}>Importer un fichier</div>
                    <div style={{ fontSize:'.8rem', color:T.g500, lineHeight:1.5 }}>Téléversez le rapport PDF, Excel ou image depuis votre appareil.</div>
                  </div>
                  <div style={{ width:180, display:'flex', justifyContent:'center', alignItems:'center', background:T.navy, color:'#fff', borderRadius:12, padding:'10px 12px', fontSize:'.9rem', fontWeight:700, flexShrink:0 }}>
                    <span style={{ display:'inline-flex', gap:8, alignItems:'center' }}>{Ic.arrow} Choisir</span>
                  </div>
                </div>
                <div onClick={() => goToStep('formulaire', 'formulaire')}
                  style={{ flex:'0 0 50%', width:'50%', boxSizing:'border-box', padding:'1.5rem 2rem', borderRadius:16, border:`2px solid ${T.g300}`, cursor:'pointer', transition:'all .2s', background:'#fff', boxShadow:'0 2px 8px rgba(0,0,0,.05)', display:'flex', alignItems:'center', gap:20 }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor=accentColor; e.currentTarget.style.transform='translateY(-2px)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor=T.g300; e.currentTarget.style.transform='none'; }}>
                  <div style={{ width:52, height:52, borderRadius:14, background:isReglePlate?T.tealBg:T.purpleBg, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, border:`1.5px solid ${isReglePlate?T.tealBd:T.purpleBd}`, color:accentColor }}>
                    {Ic.edit}
                  </div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontWeight:800, color:T.navy, fontSize:'.95rem', marginBottom:5 }}>Remplir le formulaire</div>
                    <div style={{ fontSize:'.8rem', color:T.g500, lineHeight:1.5 }}>Saisir directement en ligne — copie fidèle de la fiche réglementaire.</div>
                  </div>
                  <div style={{ width:180, display:'flex', justifyContent:'center', alignItems:'center', background:accentColor, color:'#fff', borderRadius:12, padding:'10px 12px', fontSize:'.9rem', fontWeight:700, flexShrink:0 }}>
                    <span style={{ display:'inline-flex', gap:8, alignItems:'center' }}>{Ic.arrow} Commencer</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── IMPORT ── */}
          {step === 'import' && (
            <div>
              <button onClick={() => goToStep('choix', 'rapport')} style={{ display:'inline-flex', alignItems:'center', gap:6, marginBottom:20, background:'none',marginTop:-5, border:'none', color:T.blue, cursor:'pointer', fontSize:'.82rem', fontWeight:700, padding:0, fontFamily:'inherit' }}>
                {Ic.back} Retour au choix
              </button>
              <div style={{ border:`2px dashed ${T.g300}`, borderRadius:16, padding:'40px 24px', textAlign:'center', background:T.g50, cursor:'pointer', transition:'all .2s' }}
                onClick={() => fileRef.current?.click()}
                onMouseEnter={e => { e.currentTarget.style.borderColor=T.blue; e.currentTarget.style.background=T.blueL; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor=T.g300; e.currentTarget.style.background=T.g50; }}>
                <div style={{ width:60, height:60, borderRadius:16, background:T.blueL, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px', color:T.blue, border:`1.5px solid ${T.blueB}` }}>
                  {Ic.upload}
                </div>
                <div style={{ fontWeight:700, color:T.navy, fontSize:'.9rem', marginBottom:6 }}>Cliquez pour choisir votre rapport</div>
                <div style={{ fontSize:'.76rem', color:T.g400, marginBottom:20 }}>PDF, JPG, PNG, Excel — Max 20 MB</div>
                <input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png,.xlsx,.xls" style={{ display:'none' }}
                  onChange={e => handleImportFile(e.target.files?.[0])}/>
                <PBtn disabled={importing} color={accentColor}>
                  {importing ? 'Import en cours…' : <>{Ic.upload} Choisir un fichier</>}
                </PBtn>
              </div>
            </div>
          )}

          {/* ── FORMULAIRE ── */}
          {step === 'formulaire' && (
            <div>
              <button onClick={() => goToStep('choix', 'formulaire')} style={{ display:'inline-flex', alignItems:'center', gap:6, marginBottom:20, background:'none', border:'none', color:T.blue, cursor:'pointer', fontSize:'.82rem', fontWeight:700, padding:0, fontFamily:'inherit' }}>
                {Ic.back} Retour au choix
              </button>
              {isReglePlate
                ? <FormulaireReglePlate audit={audit} draftKey={DK.formulaire} onValider={handleValiderFormulaire} loading={validating}/>
                : <FormulaireExport audit={audit} draftKey={DK.formulaire} onValider={handleValiderFormulaire} loading={validating}/>
              }
            </div>
          )}

          {/* ── CONFORMITÉ ── */}
          {step === 'conformite' && (
            <div>
              <div style={{ fontWeight:900, fontSize:'1rem', color:T.navy, marginBottom:6 }}>Vérification de conformité</div>
              <p style={{ color:T.g400, fontSize:'.82rem', marginBottom:22, lineHeight:1.5 }}>
                Vérifiez les résultats et validez pour générer le rapport final PDF de l'audit.
              </p>
              <ConformiteCheck
                isReglePlate={isReglePlate}
                hasNC={hasNC}
                ncRows={ncRows}
                onValider={handleValiderConformite}
                loading={validating}
                auditRef={audit.reference}
                responsables={responsables}
                auditId={audit.id}
                onPDCASent={() => { setPdcaSent(true); showToast('PDCA envoyé ✓'); }}
                audit={audit}
                onRefresh={handleRefreshAudit}
              />
            </div>
          )}

          {/* ── TERMINÉ ── */}
          {step === 'termine' && (
            <div>
              <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:20 }}>
                <div style={{ width:36, height:36, borderRadius:10, background:T.successBg, display:'flex', alignItems:'center', justifyContent:'center', border:`1.5px solid ${T.successBd}` }}>
                  {Ic.ok}
                </div>
                <div>
                  <div style={{ fontWeight:900, color:T.success, fontSize:'1rem' }}>Audit terminé avec succès !</div>
                  <div style={{ fontSize:'.76rem', color:T.g400 }}>Rapport final disponible ci-dessous</div>
                </div>
              </div>

              <CarteIdentite
                audit={audit}
                isReglePlate={isReglePlate}
                rapportUrl={rapportUrl}
                onDownload={handleDownloadRapport}
                downloadLoading={downloadLoading}
              />

            </div>
          )}

        </div>
      </div>
    </div>
  );
}