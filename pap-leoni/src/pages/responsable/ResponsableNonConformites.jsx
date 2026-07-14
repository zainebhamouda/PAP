import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const API = 'http://localhost:8080/api';

const T = {
  navy: '#002855',
  blue: '#1D4ED8',
  g50: '#F8FAFC',
  g100: '#F1F5F9',
  g200: '#E2E8F0',
  g300: '#CBD5E1',
  g400: '#64748B',
  g500: '#334155',
  success: '#16A34A',
  successBg: '#F0FDF4',
  successBd: '#BBF7D0',
  warn: '#D97706',
  warnBg: '#FFFBEB',
  warnBd: '#FCD34D',
};

const CSS = `
@keyframes spin { to { transform: rotate(360deg); } }
.pdca-btn {
  border: 1px solid ${T.g200};
  background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
  color: ${T.g500};
  border-radius: 12px;
  padding: 9px 14px;
  font-size: .78rem;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 1px 2px rgba(15,23,42,.04);
  transition: transform .15s ease, box-shadow .15s ease, border-color .15s ease, color .15s ease, background .15s ease;
}
.pdca-btn:hover {
  border-color: ${T.blue};
  color: ${T.navy};
  box-shadow: 0 6px 16px rgba(29,78,216,.12);
  transform: translateY(-1px);
}
.pdca-btn--outline {
  border: 2px solid ${T.blue};
  color: ${T.blue};
  background: #fff;
}
.pdca-btn:disabled { opacity: .75; cursor: not-allowed; transform: none; box-shadow: none; }
.pdca-tab { border:none; cursor:pointer; }
.pdca-tab.on { background:#fff !important; color:${T.navy} !important; }
.pdca-card {
  box-shadow: 0 4px 18px rgba(15,23,42,.05);
}
.pdca-card:hover {
  box-shadow: 0 10px 28px rgba(15,23,42,.08);
  transform: translateY(-1px);
}
`;

const apiH = () => {
  const token = localStorage.getItem('token');
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
};

const fmtDate = (d) => {
  if (!d) return '-';
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return '-';
  return dt.toLocaleDateString('fr-FR');
};

const fmtDateTime = (d) => {
  if (!d) return '-';
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return '-';
  return dt.toLocaleString('fr-FR');
};

const normalizeStatus = (s) => String(s || '').trim().toUpperCase();

const isResolvedStatus = (status) => {
  const st = normalizeStatus(status);
  return ['RESOLU', 'RESOLUE', 'FERME', 'FERMEE', 'VALIDE', 'VALIDEE', 'CLOTURE', 'CLOTUREE', 'TERMINE', 'TERMINEE'].includes(st);
};

const statusMeta = (status) => {
  if (isResolvedStatus(status)) return { label: 'Valide', color: T.success, bg: T.successBg, bd: T.successBd };
  return { label: status || 'En cours', color: T.warn, bg: T.warnBg, bd: T.warnBd };
};

function Spin() {
  return <span style={{ width: 16, height: 16, borderRadius: '50%', border: `2px solid ${T.g300}`, borderTopColor: T.blue, display: 'inline-block', animation: 'spin .8s linear infinite' }} />;
}

function PDCACard({ item, onOpenAudit, onValidate, validating }) {
  const [open, setOpen] = useState(false);
  const meta = statusMeta(item.statut);
  const canValidate = !isResolvedStatus(item.statut);

  return (
    <div className="pdca-card" style={{ background:'#fff', border:`1px solid ${T.g200}`, borderRadius:14, padding:'1rem 1.1rem', marginBottom:12, transition:'transform .15s ease, box-shadow .15s ease' }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:10, flexWrap:'wrap' }}>
        <div>
          <div style={{ fontWeight:800, color:T.navy, fontSize:'.95rem' }}>PDCA #{item.id || '-'} - Audit #{item.auditId || '-'}</div>
          <div style={{ marginTop:4, fontSize:'.75rem', color:T.g400 }}>Site: {item.siteNom || '-'} | Auditeur: {item.auditeurNom || '-'}</div>
        </div>

        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <span style={{ background:meta.bg, border:`1px solid ${meta.bd}`, color:meta.color, borderRadius:999, padding:'3px 10px', fontSize:'.7rem', fontWeight:700 }}>{meta.label}</span>
          {canValidate && (
            <button className="pdca-btn" onClick={() => onValidate(item.id)} disabled={validating} style={{ background:T.blue, color:'#fff', borderColor:T.blue, opacity:validating?0.75:1 }}>
              {validating ? 'Validation...' : 'Valider'}
            </button>
          )}
          <button className="pdca-btn pdca-btn--outline" onClick={() => setOpen(v => !v)}>{open ? 'Masquer' : 'Details'}</button>
          <button className="pdca-btn pdca-btn--outline" onClick={() => onOpenAudit(item.auditId)}>Ouvrir audit</button>
        </div>
      </div>

      <div style={{ marginTop:10, display:'flex', gap:8, flexWrap:'wrap', fontSize:'.72rem', color:T.g500 }}>
        <span style={{ background:T.g50, border:`1px solid ${T.g300}`, borderRadius:8, padding:'3px 8px' }}>Echeance: {fmtDate(item.dateEcheance)}</span>
        <span style={{ background:T.g50, border:`1px solid ${T.g300}`, borderRadius:8, padding:'3px 8px' }}>Creation: {fmtDateTime(item.dateCreation)}</span>
        <span style={{ background:T.g50, border:`1px solid ${T.g300}`, borderRadius:8, padding:'3px 8px' }}>QK: {item.valeurQK ?? '-'}</span>
      </div>

      {open && (
        <div style={{ marginTop:12, display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
          <Section title="Plan" value={item.planifier} outlined />
          <Section title="Do" value={item.do_ || item.do} outlined />
          <Section title="Check" value={item.check} outlined />
          <Section title="Act" value={item.act} outlined />
        </div>
      )}
    </div>
  );
}

function Section({ title, value, outlined = false }) {
  const borderStyle = outlined ? `2px solid ${T.g300}` : `1px solid ${T.g200}`;
  return (
    <div style={{ border: borderStyle, borderRadius:12, padding:'.8rem .9rem', background:'#fff' }}>
      <div style={{ fontSize:'.68rem', fontWeight:800, letterSpacing:'.04em', color:T.g400, marginBottom:6 }}>{title}</div>
      <div style={{ fontSize:'.79rem', color:T.g500, whiteSpace:'pre-wrap' }}>{value || '-'}</div>
    </div>
  );
}

export default function ResponsableNonConformites() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tab, setTab] = useState('resolus');
  const [pdcaRows, setPdcaRows] = useState([]);
  const [validatingId, setValidatingId] = useState(null);

const load = useCallback(async (silent = false) => {
    if (silent) setRefreshing(true); else setLoading(true);
    
    try {
        const [enAttenteRes, validesRes] = await Promise.all([
            fetch(`${API}/pdca/mes-pdcas/en-attente`, { headers: apiH() }),
            fetch(`${API}/pdca/mes-pdcas/valides`, { headers: apiH() })
        ]);
        
        const enAttente = enAttenteRes.ok ? await enAttenteRes.json() : [];
        const valides = validesRes.ok ? await validesRes.json() : [];

    setPdcaRows([...enAttente, ...valides]);
    } catch (err) {
        console.error('Erreur chargement PDCA:', err);
        setPdcaRows([]);
    }
    
    if (silent) setRefreshing(false); else setLoading(false);
}, []);

  useEffect(() => { load(); }, [load]);

  const enCours = useMemo(() => pdcaRows.filter((r) => !isResolvedStatus(r.statut)), [pdcaRows]);
  const resolus = useMemo(() => pdcaRows.filter((r) => isResolvedStatus(r.statut)), [pdcaRows]);
  const displayed = tab === 'encours' ? enCours : resolus;

  const openAudit = (auditId) => {
    if (!auditId) return;
    navigate(`/responsable/audits/${auditId}`);
  };

 const handleValiderPDCA = async (pdcaId) => {
    if (!pdcaId || validatingId) return;
    setValidatingId(pdcaId);
    try {
        const res = await fetch(`${API}/pdca/${pdcaId}/valider`, { method: 'POST', headers: apiH() });
        if (!res.ok) throw new Error('Validation impossible');
        
        // Recharger les données après validation
        await load(true);
    } catch (e) {
        console.error(e);
        alert('Erreur lors de la validation');
    } finally {
        setValidatingId(null);
    }
};

  return (
    <div style={{ padding:'1.25rem', background:'#dfe1e6', minHeight:'100vh' }}>
      <style>{CSS}</style>

      <div style={{ background:T.navy, borderRadius:16, padding:'1.1rem 1.4rem', marginBottom:18, color:'#fff',marginTop:-20 }}>
        <div style={{ fontSize:'.64rem', opacity:0.72, textTransform:'uppercase', letterSpacing:'.1em' }}>Responsable Qualite Centrale</div>
        <div style={{ marginTop:3, fontWeight:800, fontSize:'1.08rem' }}>PDCA envoyes par auditeur</div>
        <div style={{ marginTop:8 }}>
         
        </div>
      </div>

      <div style={{ display:'flex', gap:5, marginBottom:12, background:T.g100, padding:4, borderRadius:11, width:'fit-content', border:`1px solid ${T.g200}` }}>
        <button className={`pdca-tab ${tab === 'encours' ? 'on' : ''}`} onClick={() => setTab('encours')} style={{ padding:'7px 16px', borderRadius:8, background:'transparent', color:T.g400, fontSize:'.8rem', fontWeight:700 }}>
          En cours ({enCours.length})
        </button>
        <button className={`pdca-tab ${tab === 'resolus' ? 'on' : ''}`} onClick={() => setTab('resolus')} style={{ padding:'7px 16px', borderRadius:8, background:'transparent', color:T.g400, fontSize:'.8rem', fontWeight:700 }}>
          Valides ({resolus.length})
        </button>
      </div>

      {loading ? (
        <div style={{ height:220, display:'flex', alignItems:'center', justifyContent:'center', gap:10, background:'#fff', borderRadius:14, border:`1px solid ${T.g200}`, color:T.g400 }}>
          <Spin /> Chargement des PDCA...
        </div>
      ) : displayed.length === 0 ? (
        <div style={{ textAlign:'center', background:'#fff', border:`1.5px dashed ${T.g200}`, borderRadius:14, padding:'3.2rem 1rem', color:T.g400 }}>
          Aucun PDCA dans cet onglet.
        </div>
      ) : (
        <div>
          {displayed.map((item, idx) => (
            <PDCACard key={`${item.auditId}-${item.id || idx}`} item={item} onOpenAudit={openAudit} onValidate={handleValiderPDCA} validating={validatingId === item.id} />
          ))}
        </div>
      )}
    </div>
  );
}
