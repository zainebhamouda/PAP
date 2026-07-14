// CreerCertification.jsx — Sprint 2 — avec étape 4 bibliothèque certificats
import { useState, useEffect, useRef } from 'react';
import LogoImage from '../../components/common/LogoImage';
import { useNavigate, useLocation } from 'react-router-dom';
import { expertTestAPI, expertPratiqueAPI, expertCertifAPI } from '../../services/certifAPI';
import api from '../../services/api';
import s from './CreerCertif.module.css';

const Ic = {
  back:    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>,
  arrow:   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>,
  check:   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
  plus:    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  x:       <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  upload:  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/></svg>,
  img:     <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>,
  qcm:     <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>,
  tool:    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>,
  warn:    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
  hist:    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.51"/></svg>,
  send:    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>,
  pdf:     <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>,
  ppt:     <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><circle cx="10" cy="13" r="2"/><path d="M10 15v3"/></svg>,
  book:    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>,
  info:    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>,
  cloud:   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/></svg>,
  client:  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>,
  certif:  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/></svg>,
  rocket:  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/></svg>,
};

const TITRE_GENERIQUE_PRATIQUE = 'Test pratique sans défauts';

const STEPS = [
  { label: 'Client' },
  { label: 'Formation' },
  { label: 'Test théorique' },
  { label: 'Test pratique' },
  { label: 'Certificat' },
  { label: 'Publication' },
];

const DEFAULT_COLORS = ['#0B1E3D','#1D4ED8','#7C3AED','#059669','#D97706','#DC2626','#0891B2','#4338CA'];

function Desc({ children }) {
  return (
    <p style={{ fontSize:'.88rem', color:'#64748B', lineHeight:1.8, margin:'0.5rem 0 0', fontWeight:400, maxWidth:1040, marginBottom:'-30px' }}>
      {children}
    </p>
  );
}

function F({ label, hint, children }) {
  return (
    <div className={s.field}>
      {label && <div className={s.lbl}>{label}</div>}
      {hint  && <div className={s.hint}>{hint}</div>}
      {children}
    </div>
  );
}

function CountBadge({ label, icon, n, min }) {
  const ok  = n >= min;
  const pct = Math.min(100, Math.round((n / min) * 100));
  return (
    <div style={{ background:ok?'#ECFDF5':'#fff', border:`1.5px solid ${ok?'rgba(5,150,105,.3)':'#E5E7EB'}`, borderRadius:14, padding:'1.1rem 1.25rem', transition:'all .25s' }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
        <div style={{ display:'flex', alignItems:'center', gap:6, fontSize:'.7rem', fontWeight:700, textTransform:'uppercase', letterSpacing:'.08em', color:ok?'#059669':'#9CA3AF' }}>
          <span style={{ width:14, height:14 }}>{icon}</span> {label}
        </div>
        <div style={{ display:'flex', alignItems:'baseline', gap:3 }}>
          <span style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", fontSize:'2.1rem', fontWeight:800, color:ok?'#059669':'#111827', lineHeight:1 }}>{n}</span>
          <span style={{ fontSize:'.8rem', color:'#9CA3AF' }}>/{min} min.</span>
        </div>
      </div>
      <div style={{ height:5, background:ok?'rgba(5,150,105,.15)':'#E5E7EB', borderRadius:99, overflow:'hidden' }}>
        <div style={{ height:'100%', width:pct+'%', background:ok?'linear-gradient(90deg,#059669,#10B981)':'linear-gradient(90deg,#2563EB,#60A5FA)', borderRadius:99, transition:'width .5s ease' }} />
      </div>
      {ok && <div style={{ marginTop:6, fontSize:'.72rem', color:'#059669', fontWeight:700, display:'flex', alignItems:'center', gap:4 }}><svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="#059669" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg> Minimum atteint</div>}
    </div>
  );
}

function ClientCard({ client, selected, onSelect, index }) {
  const color = client.couleur || DEFAULT_COLORS[index % DEFAULT_COLORS.length];
  return (
    <div
      onClick={() => onSelect(client.id)}
      style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
        padding: '20px 16px',
        background: selected ? `${color}15` : '#fff',
        border: `2px solid ${selected ? color : '#E8EDF7'}`,
        borderRadius: 16, cursor: 'pointer', transition: 'all .2s',
        boxShadow: selected ? `0 4px 16px ${color}30` : '0 1px 4px rgba(0,0,0,.04)',
        transform: selected ? 'translateY(-2px)' : 'none',
        minWidth: 130, position: 'relative',
      }}
      onMouseEnter={e => { if (!selected) { e.currentTarget.style.borderColor=color; e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.boxShadow=`0 4px 12px ${color}20`; } }}
      onMouseLeave={e => { if (!selected) { e.currentTarget.style.borderColor='#E8EDF7'; e.currentTarget.style.transform='none'; e.currentTarget.style.boxShadow='0 1px 4px rgba(0,0,0,.04)'; } }}
    >
      {selected && (
        <div style={{ position:'absolute', top:8, right:8, width:20, height:20, borderRadius:'50%', background:color, display:'flex', alignItems:'center', justifyContent:'center', color:'#fff' }}>
          <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
        </div>
      )}
      <LogoImage type="client" nom={client.nom} code={client.code} imageUrl={client.logoUrl} size={48} radius={8} style={{ background: color }}/>
      <div style={{ textAlign:'center' }}>
        <div style={{ fontWeight:800, fontSize:'.88rem', color:'#0B1E3D', marginBottom:2 }}>{client.nom}</div>
        {client.paysOrigine && <div style={{ fontSize:'.72rem', color:'#9CA3AF' }}>{client.paysOrigine}</div>}
      </div>
    </div>
  );
}

function FormationCard({ c, selected, onSelect, index }) {
  const isEven = index % 2 === 0;
  const isPdf = c.formationNom?.toLowerCase().endsWith('.pdf');
  return (
    <div
      onClick={() => onSelect(c.formationNom)}
      style={{
        display:'flex', alignItems:'center', gap:14, padding:'14px 16px',
        background: selected ? 'linear-gradient(135deg,#EFF6FF,#DBEAFE)' : isEven ? '#fff' : '#F8FAFC',
        border: `1.5px solid ${selected?'#2563EB':isEven?'#E8EDF7':'#F0F4FA'}`,
        borderRadius:12, cursor:'pointer', transition:'all .2s',
        boxShadow: selected ? '0 0 0 3px rgba(37,99,235,.12)' : '0 1px 3px rgba(0,0,0,.04)',
        transform: selected ? 'translateY(-1px)' : 'none',
      }}
      onMouseEnter={e => { if(!selected){e.currentTarget.style.borderColor='#93C5FD';e.currentTarget.style.transform='translateY(-1px)'; } }}
      onMouseLeave={e => { if(!selected){e.currentTarget.style.borderColor=isEven?'#E8EDF7':'#F0F4FA';e.currentTarget.style.transform='none'; } }}
    >
      <div style={{ width:46, height:46, borderRadius:12, flexShrink:0, background:selected?'#DBEAFE':isPdf?'#FEF2F2':'#FFF7ED', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.4rem', border:`1px solid ${selected?'#BFDBFE':isPdf?'#FECACA':'#FED7AA'}` }}>
        <div style={{width:20,height:20,display:'flex',alignItems:'center',justifyContent:'center'}}>{isPdf ? Ic.pdf : Ic.ppt}</div>
      </div>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
          <span style={{ fontWeight:700, fontSize:'.9rem', color:selected?'#1E40AF':'#0B1E3D', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{c.formationNom}</span>
        </div>
        <div style={{ fontSize:'.76rem', color:'#64748B' }}>{isPdf?'PDF':'PowerPoint'}</div>
      </div>
      <div style={{ width:22, height:22, borderRadius:'50%', flexShrink:0, background:selected?'#2563EB':'#F1F5F9', border:`2px solid ${selected?'#2563EB':'#E2E8F0'}`, display:'flex', alignItems:'center', justifyContent:'center' }}>
        {selected && <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>}
      </div>
    </div>
  );
}

// ── Card pour les modèles de certificat (bibliothèque) ──
function CertifCard({ c, selected, onSelect, index }) {
  const isEven = index % 2 === 0;
  return (
    <div
      onClick={() => onSelect(c.certifNom)}
      style={{
        display:'flex', alignItems:'center', gap:14, padding:'14px 16px',
        background: selected ? 'linear-gradient(135deg,#F0FDF4,#DCFCE7)' : isEven ? '#fff' : '#F8FAFC',
        border: `1.5px solid ${selected?'#059669':isEven?'#E8EDF7':'#F0F4FA'}`,
        borderRadius:12, cursor:'pointer', transition:'all .2s',
        boxShadow: selected ? '0 0 0 3px rgba(5,150,105,.12)' : '0 1px 3px rgba(0,0,0,.04)',
        transform: selected ? 'translateY(-1px)' : 'none',
      }}
      onMouseEnter={e => { if(!selected){e.currentTarget.style.borderColor='#6EE7B7';e.currentTarget.style.transform='translateY(-1px)'; } }}
      onMouseLeave={e => { if(!selected){e.currentTarget.style.borderColor=isEven?'#E8EDF7':'#F0F4FA';e.currentTarget.style.transform='none'; } }}
    >
      <div style={{ width:46, height:46, borderRadius:12, flexShrink:0, background:selected?'#DCFCE7':'#FEF2F2', display:'flex', alignItems:'center', justifyContent:'center', border:`1px solid ${selected?'#A7F3D0':'#FECACA'}` }}>
        <div style={{width:20,height:20,display:'flex',alignItems:'center',justifyContent:'center',color:selected?'#059669':'#DC2626'}}>{Ic.certif}</div>
      </div>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
          <span style={{ fontWeight:700, fontSize:'.9rem', color:selected?'#065F46':'#0B1E3D', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{c.certifNom}</span>
        </div>
        <div style={{ fontSize:'.76rem', color:'#64748B' }}>Modèle PDF · Remplissage automatique</div>
      </div>
      <div style={{ width:22, height:22, borderRadius:'50%', flexShrink:0, background:selected?'#059669':'#F1F5F9', border:`2px solid ${selected?'#059669':'#E2E8F0'}`, display:'flex', alignItems:'center', justifyContent:'center' }}>
        {selected && <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>}
      </div>
    </div>
  );
}

export default function CreerCertification() {
  const navigate = useNavigate();
  const location = useLocation();
  const fileRef   = useRef();
  const pdfRef    = useRef();
  const certifRef = useRef();

  const modeNouveau         = location.state?.nouveau === true;
  const brouillonIdViaState = location.state?.brouillonId || null;

  const [step,    setStep]    = useState(0);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  const [clients,        setClients]        = useState([]);
  const [clientSel,      setClientSel]      = useState(null);
  const [loadingClients, setLoadingClients] = useState(true);

  // ── Formation ──
  const [formationMode,     setFormationMode]     = useState('nouveau');
  const [formationFile,     setFormationFile]     = useState(null);
  const [formationsExist,   setFormationsExist]   = useState([]);
  const [formationExistSel, setFormationExistSel] = useState(null);
  const [formationExistSrc, setFormationExistSrc] = useState(null);

  // ── Certificat (NOUVEAU) ──
  const [certifMode,     setCertifMode]     = useState('nouveau');
  const [certifPdf,      setCertifPdf]      = useState(null);
  const [certifsExist,   setCertifsExist]   = useState([]);
  const [certifExistSel, setCertifExistSel] = useState(null);
  const [certifExistSrc, setCertifExistSrc] = useState(null);

  const [brouillonId, setBrouillonId] = useState(null);

  const [testTheoId,     setTestTheoId]     = useState(null);
  const [testPratiqueId, setTestPratiqueId] = useState(null);
  const [testTheoActif,  setTestTheoActif]  = useState(false);
  const [anciensTT,      setAnciensTT]      = useState([]);
  const [anciensTP,      setAnciensTP]      = useState([]);
  const [modeTheo,       setModeTheo]       = useState('nouveau');
  const [modePrat,       setModePrat]       = useState('existant');

  const [testTheo, setTestTheo] = useState({ seuilReussite: 75 });
  const [testPrat, setTestPrat] = useState({ seuilReussite: 80 });
  const [qcms,     setQcms]     = useState([]);
  const [images,   setImages]   = useState([]);

  const [qcmForm, setQcmForm] = useState({
    enonce: '', options: ['', '', '', ''], bonnesReponsesIndexes: [],
  });
  const [imgForm, setImgForm] = useState({ bonneReponse:'', imageName:'', imageBase64:'' });
  const [tab,     setTab]     = useState('image');

  const [afficherDefauts, setAfficherDefauts] = useState(false);
  const [defauts,         setDefauts]         = useState([]);
  const [defautForm,      setDefautForm]       = useState({ typeDefaut:'', localisation:'', mesureReelle:'', valeurAcceptable:'', observations:'' });

  const errFn = m => { setError(m); setLoading(false); };
  const ok    = () => setError('');

  // ── Chargement initial ──
 // ══════════════════════════════════════════════════════════
// CreerCertification.jsx — les 2 useEffect complets corrigés
// Remplacer les 2 useEffect existants par ceux-ci
// ══════════════════════════════════════════════════════════

  // ── useEffect 1 : Chargement initial ──
  useEffect(() => {
    let cancelled = false;

    setLoadingClients(true);
  api.get('/clients/groupes')
  .then(r => { if (!cancelled) setClients(r.data || []); })
      .catch(() => { if (!cancelled) setClients([]); })
      .finally(() => { if (!cancelled) setLoadingClients(false); });

    api.get('/expert-audit/tests/all')
      .then(r => { if (!cancelled) setAnciensTT(r.data || []); })
      .catch(() => {});

    api.get('/expert-audit/formations/all')
      .then(r => { if (!cancelled) setFormationsExist(r.data || []); })
      .catch(() => {});

    // Charger la bibliothèque des modèles de certificats
    api.get('/expert-audit/certifications/modeles-certif/all')
      .then(r => { if (!cancelled) setCertifsExist(r.data || []); })
      .catch(() => { if (!cancelled) setCertifsExist([]); });

    // Init test générique puis charger tous les tests pratiques
    api.post('/expert-audit/tests-pratiques/init-generique')
      .catch(() => {}) // non bloquant
      .finally(() => {
        if (!cancelled) {
          api.get('/expert-audit/tests-pratiques/all')
            .then(r => { if (!cancelled) setAnciensTP(r.data || []); })
            .catch(() => {});
        }
      });

    return () => { cancelled = true; };
  }, []);


  // ── useEffect 2 : Reprise brouillon ──
  useEffect(() => {
    if (modeNouveau || !brouillonIdViaState) return;

    let cancelled = false;

    api.get(`/expert-audit/certifications/${brouillonIdViaState}`)
      .then(res => {
        if (cancelled || !res.data) return;
        const b = res.data;

        setBrouillonId(b.id);
        if (b.clientId) setClientSel(b.clientId);

        // Formation
        if (b.formationUrl && b.formationNom) {
          setFormationExistSrc({ formationUrl: b.formationUrl, formationNom: b.formationNom });
          setFormationMode('existant');
          setFormationExistSel(b.formationNom);
          setFormationFile({ name: b.formationNom });
        } else if (b.formationNom) {
          setFormationFile({ name: b.formationNom });
        }

        // Certificat
        if (b.certificatVideUrl && b.certificatVideNom) {
          setCertifExistSrc({ certifUrl: b.certificatVideUrl, certifNom: b.certificatVideNom });
          setCertifMode('existant');
          setCertifExistSel(b.certificatVideNom);
          setCertifPdf({ name: b.certificatVideNom });
        } else if (b.certificatVideNom) {
          setCertifPdf({ name: b.certificatVideNom });
        }

        // Test pratique
        if (b.testPratiqueId) {
          setTestPratiqueId(b.testPratiqueId);
          setModePrat('existant');
        }

        // Test théorique + navigation vers la bonne étape
        if (b.testTheoriqueId) {
          setTestTheoId(b.testTheoriqueId);
          setModeTheo('nouveau');

          api.get(`/expert-audit/tests/${b.testTheoriqueId}/questions`)
            .then(rQ => {
              if (cancelled) return;
              const qs      = rQ.data || [];
              const imgs    = qs.filter(q => q.type === 'IMAGE_DEFAUT');
              const qcmList = qs.filter(q => q.type === 'QCM');

              setImages(imgs.map(q => ({ imageName: q.imageUrl, bonneReponse: q.bonneReponseImage })));
              setQcms(qcmList.map(q => ({ enonce: q.enonce })));

              if (imgs.length >= 10 && qcmList.length < 10) setTab('qcm');
              else if (imgs.length < 10) setTab('image');

              // Naviguer vers la première étape incomplète
              if (!b.clientId)                              { setStep(0); return; }
              if (!b.formationNom)                          { setStep(1); return; }
              if (imgs.length < 10 || qcmList.length < 10) { setStep(2); return; }
              if (!b.testPratiqueId)                        { setStep(3); return; }
              if (!b.certificatVideNom)                     { setStep(4); return; }
              setStep(5);
            })
            .catch(() => {
              if (cancelled) return;
              // Fallback si les questions ne se chargent pas
              const nbImg = b.nbQuestionsImage || 0;
              const nbQcm = b.nbQuestionsQCM   || 0;
              if (!b.clientId)               { setStep(0); return; }
              if (!b.formationNom)           { setStep(1); return; }
              if (nbImg < 10 || nbQcm < 10)  { setStep(2); return; }
              if (!b.testPratiqueId)         { setStep(3); return; }
              if (!b.certificatVideNom)      { setStep(4); return; }
              setStep(5);
            });

        } else {
          // Pas de test théorique → naviguer vers étape 0 ou 1
          if (!b.clientId)     { setStep(0); return; }
          if (!b.formationNom) { setStep(1); return; }
          setStep(2);
        }
      })
      .catch(e => {
        // 400 / 404 = brouillon supprimé (ex: après une publication réussie)
        // Ignorer silencieusement — rester à l'étape 0
        if (!cancelled) {
          console.info(
            'Brouillon introuvable ou supprimé (id=%d) — démarrage à l\'étape 0.',
            brouillonIdViaState
          );
        }
      });

    return () => { cancelled = true; }; // annule les setState si le composant est démonté (StrictMode)
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const handleFormationFile = e => {
    const file = e.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setFormationFile({ name:file.name, base64:reader.result.split(',')[1], type:file.type });
    reader.readAsDataURL(file);
  };

  const handleCertifPdf = e => {
    const file = e.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setCertifPdf({ name:file.name, base64:reader.result.split(',')[1] });
    reader.readAsDataURL(file);
  };

  const dateAuto = new Date().toLocaleDateString('fr-FR', { day:'2-digit', month:'2-digit', year:'numeric' });

  // ── ÉTAPE 0 : client ──
  const go0 = async () => {
    if (!clientSel) return errFn('Veuillez sélectionner un client constructeur.');
    setLoading(true); ok();
    try {
      let bid = brouillonId;
      if (!bid) {
        const res = await expertCertifAPI.sauvegarderBrouillon({ forcerNouveau: modeNouveau, clientId: clientSel });
        bid = res.data.id; setBrouillonId(bid);
      } else {
        await expertCertifAPI.sauvegarderBrouillon({ clientId: clientSel });
      }
    } catch {}
    setLoading(false); setStep(1);
  };

  // ── ÉTAPE 1 : formation ──
  const go1 = async () => {
    if (formationMode === 'nouveau' && !formationFile) return errFn('Veuillez importer un fichier de formation.');
    if (formationMode === 'existant' && !formationExistSel) return errFn('Veuillez sélectionner une formation existante.');
    setLoading(true); ok();
    try {
      let bid = brouillonId;
      if (!bid) {
        const res = await expertCertifAPI.sauvegarderBrouillon({ forcerNouveau: modeNouveau, clientId: clientSel });
        bid = res.data.id; setBrouillonId(bid);
      }
      if (formationMode === 'nouveau' && formationFile?.base64) {
        await expertCertifAPI.uploadFormation(bid, formationFile.base64, formationFile.name);
        setFormationExistSrc(null);
      } else if (formationMode === 'existant' && formationExistSel) {
        const src = formationsExist.find(c => c.formationNom === formationExistSel);
        if (src?.formationUrl) {
          await expertCertifAPI.copierFormation(bid, src.formationUrl, src.formationNom).catch(() => {});
          setFormationFile({ name: src.formationNom });
          setFormationExistSrc({ formationUrl: src.formationUrl, formationNom: src.formationNom });
        }
      }
    } catch {}
    setLoading(false); setStep(2);
  };

  // ── ÉTAPE 2 : test théorique ──
  const go2_existant = async () => {
    if (!testTheoId) return errFn('Sélectionnez un test existant.');
    setLoading(true); ok();
    try {
      const rQ = await api.get(`/expert-audit/tests/${testTheoId}/questions`);
      const qs = rQ.data || [];
      setImages(qs.filter(q => q.type==='IMAGE_DEFAUT').map(q => ({ imageName:q.imageUrl, bonneReponse:q.bonneReponseImage })));
      setQcms(qs.filter(q => q.type==='QCM').map(q => ({ enonce:q.enonce })));
      setTestTheoActif(anciensTT.find(t => t.id===testTheoId)?.actif || false);
      if (brouillonId) await api.post('/expert-audit/certifications/brouillon', { testTheoriqueId:testTheoId, clientId:clientSel }).catch(() => {});
      setStep(3);
    } catch { errFn('Impossible de charger les questions.'); }
    setLoading(false);
  };

  const go2_nouveau = async () => {
    setLoading(true); ok();
    try {
      const r = await expertTestAPI.creerTest({ titre:`Test Théorique ${dateAuto}`, seuilReussite:Number(testTheo.seuilReussite) });
      const newId = r.data.id;
      setTestTheoId(newId); setTestTheoActif(false); setImages([]); setQcms([]);
      if (brouillonId) await api.post('/expert-audit/certifications/brouillon', { testTheoriqueId:newId, clientId:clientSel }).catch(() => {});
    } catch (e) { errFn(e.response?.data?.message || 'Erreur création test.'); }
    setLoading(false);
  };

  const handleFile = e => {
    const file = e.target.files[0]; if (!file) return;
    setImgForm(f => ({ ...f, imageName:file.name }));
    const reader = new FileReader();
    reader.onload = () => setImgForm(f => ({ ...f, imageBase64:reader.result.split(',')[1] }));
    reader.readAsDataURL(file);
  };

  const addQCM = async () => {
    if (!qcmForm.enonce.trim()) return errFn('Énoncé obligatoire.');
    if (qcmForm.options.some(o => !o.trim())) return errFn('Remplissez les 4 options.');
    if (qcmForm.bonnesReponsesIndexes.length === 0) return errFn('Sélectionnez au moins une bonne réponse.');
    setLoading(true); ok();
    try {
      await expertTestAPI.ajouterQCM(testTheoId, { enonce:qcmForm.enonce, options:qcmForm.options, bonnesReponsesIndexes:qcmForm.bonnesReponsesIndexes, points:1, dansPool:true });
      setQcms(q => [...q, { enonce: qcmForm.enonce }]);
      setQcmForm({ enonce:'', options:['','','',''], bonnesReponsesIndexes:[] });
    } catch (e) { errFn(e.response?.data?.message || 'Erreur ajout QCM.'); }
    setLoading(false);
  };

  const addImg = async () => {
    if (!imgForm.imageBase64) return errFn('Image obligatoire.');
    if (!imgForm.bonneReponse.trim()) return errFn('Bonne réponse obligatoire.');
    setLoading(true); ok();
    try {
      await expertTestAPI.ajouterImage(testTheoId, { ordre:images.length+1, imageBase64:imgForm.imageBase64, imageName:imgForm.imageName, bonneReponse:imgForm.bonneReponse, defautsDisponibles:[], typeReponseImage:'LIBRE', points:1 });
      setImages(i => [...i, { imageName:imgForm.imageName, bonneReponse:imgForm.bonneReponse }]);
      setImgForm({ bonneReponse:'', imageName:'', imageBase64:'' });
      if (fileRef.current) fileRef.current.value = '';
    } catch (e) { errFn(e.response?.data?.message || 'Erreur ajout image.'); }
    setLoading(false);
  };

  const canNext2 = images.length >= 10 && qcms.length >= 10;

  const goToStep3 = async () => {
    if (images.length < 10) return errFn(`Minimum 10 questions image (${images.length}/10).`);
    if (qcms.length < 10)   return errFn(`Minimum 10 QCM (${qcms.length}/10).`);
    if (testTheoActif) { ok(); setStep(3); return; }
    setLoading(true); ok();
    try { await expertTestAPI.activerTest(testTheoId); setStep(3); }
    catch (e) { errFn(e.response?.data?.message || 'Erreur activation.'); }
    setLoading(false);
  };

  // ── ÉTAPE 3 : test pratique ──
  const go3_existant = async () => {
    if (!testPratiqueId) return errFn('Sélectionnez un test.');
    setDefauts(anciensTP.find(t => t.id===testPratiqueId)?.defauts || []);
    if (brouillonId) await api.post('/expert-audit/certifications/brouillon', { testTheoriqueId:testTheoId, testPratiqueId, clientId:clientSel }).catch(() => {});
    ok(); setStep(4);
  };

  const go3_nouveau = async () => {
    setLoading(true); ok();
    try {
      const r = await expertPratiqueAPI.creerTest({ titre:`Test Pratique ${dateAuto}`, seuilReussite:Number(testPrat.seuilReussite) });
      const newId = r.data.id;
      setTestPratiqueId(newId); setDefauts([]);
      if (brouillonId) await api.post('/expert-audit/certifications/brouillon', { testTheoriqueId:testTheoId, testPratiqueId:newId, clientId:clientSel }).catch(() => {});
    } catch (e) { errFn(e.response?.data?.message || 'Erreur création.'); setLoading(false); return; }
    setLoading(false); ok();
  };

  const addDefaut = async () => {
    if (!defautForm.typeDefaut.trim()) return errFn('Type de défaut obligatoire.');
    setLoading(true); ok();
    try {
      await expertPratiqueAPI.ajouterDefaut(testPratiqueId, defautForm);
      setDefauts(d => [...d, { ...defautForm }]);
      setDefautForm({ typeDefaut:'', localisation:'', mesureReelle:'', valeurAcceptable:'', observations:'' });
    } catch (e) { errFn(e.response?.data?.message || 'Erreur ajout défaut.'); }
    setLoading(false);
  };

  const goToStep4 = async () => {
    setLoading(true); ok();
    try {
      if (testPratiqueId && !anciensTP.find(t => t.id===testPratiqueId)?.actif)
        await api.post(`/expert-audit/tests-pratiques/${testPratiqueId}/activer`).catch(() => {});
      setStep(4);
    } catch (e) { errFn(e.response?.data?.message || 'Erreur activation.'); }
    setLoading(false);
  };

  // ── ÉTAPE 4 : certificat — MODIFIÉ avec deux modes ──
  const goToStep5 = async () => {
    if (certifMode === 'nouveau' && !certifPdf)
      return errFn('Veuillez importer le modèle de certificat PDF.');
    if (certifMode === 'existant' && !certifExistSel)
      return errFn('Veuillez sélectionner un modèle de certificat.');
    setLoading(true); ok();
    try {
      if (brouillonId) {
        if (certifMode === 'nouveau' && certifPdf?.base64) {
          await api.post(`/expert-audit/certifications/${brouillonId}/upload-certificat`, {
            base64: certifPdf.base64,
            nom: certifPdf.name,
          }).catch(() => {});
        } else if (certifMode === 'existant' && certifExistSrc) {
          // Sauvegarder aussi sur le brouillon pour la reprise
          await expertCertifAPI.copierCertificat(
            brouillonId,
            certifExistSrc.certifUrl,
            certifExistSrc.certifNom
          ).catch(() => {});
        }
      }
    } catch {}
    setLoading(false); ok(); setStep(5);
  };
 

  // ── ÉTAPE 5 : publication ──
   const publier = async () => {
    if (!testTheoId)     return errFn('Test théorique manquant.');
    if (!testPratiqueId) return errFn('Test pratique manquant.');
 
    const hasCertif = (certifMode === 'nouveau' && certifPdf) ||
                      (certifMode === 'existant' && certifExistSrc);
    if (!hasCertif) return errFn('Modèle de certificat manquant.');
 
    setLoading(true); ok();
    let certifId = null;
 
    try {
      const clientObj = clients.find(c => c.id === clientSel);
      const titreAuto = clientObj
        ? `Qualification ${clientObj.nom} ${dateAuto}`
        : `Qualification ${dateAuto}`;
 
      // ── Étape 1 : confirmer la certification (bloquant) ──
      const res = await expertCertifAPI.confirmer({
        testTheoriqueId: testTheoId,
        testPratiqueId,
        clientId: clientSel,
        titre: titreAuto,
      });
      certifId = res.data.id;
 
    } catch (e) {
      errFn(e.response?.data?.message || 'Erreur lors de la création de la qualification.');
      setLoading(false);
      return;
    }
 
    // ── Étapes 2+ : uploads — erreurs non-bloquantes ──
 
    // ── Formation ──
    try {
      if (formationFile?.base64) {
        await expertCertifAPI.uploadFormation(certifId, formationFile.base64, formationFile.name);
      } else if (formationExistSrc?.formationUrl) {
        await expertCertifAPI.copierFormation(
          certifId, formationExistSrc.formationUrl, formationExistSrc.formationNom
        );
      } else if (brouillonId) {
        try {
          const b = await api.get(`/expert-audit/certifications/${brouillonId}`);
          if (b.data?.formationUrl)
            await expertCertifAPI.copierFormation(certifId, b.data.formationUrl, b.data.formationNom);
        } catch (_) {}
      }
    } catch (e) {
      console.warn('Upload formation échoué (non bloquant):', e.message);
    }
 
    // ── Certificat PDF ──
    try {
      if (certifMode === 'nouveau' && certifPdf?.base64) {
        // CAS 1 : nouveau fichier uploadé
        await api.post(`/expert-audit/certifications/${certifId}/upload-certificat`, {
          base64: certifPdf.base64,
          nom: certifPdf.name,
        });
      } else if (certifMode === 'existant' && certifExistSrc?.certifUrl) {
        // CAS 2 : modèle existant — copier l'URL vers la certification confirmée
        // C'est ce qui permet à la page détail d'afficher le certificat vidéo
        await expertCertifAPI.copierCertificat(
          certifId,
          certifExistSrc.certifUrl,
          certifExistSrc.certifNom
        );
      }
    } catch (e) {
      console.warn('Upload certificat échoué (non bloquant):', e.message);
    }
 
    // ── Terminé ──
    setBrouillonId(null);
    setLoading(false);
    navigate('/expert/certif');
  };
  const globalPct    = Math.round((step / (STEPS.length - 1)) * 100);
  const ttSel        = anciensTT.find(t => t.id === testTheoId);
  const tpSel        = anciensTP.find(t => t.id === testPratiqueId);
  const clientSelObj = clients.find(c => c.id === clientSel);

  return (
    <div className={s.page}>
      {/* Barre d'étapes */}
      <div className={s.stepsTopbar}>
        <div className={s.stepsContainer}>
          {STEPS.map((st, i) => (
            <div key={i} className={s.stepItemTopbar}>
              <div className={`${s.stepBulletTopbar} ${i < step ? s.stepBulletDone : i === step ? s.stepBulletAct : s.stepBulletPend}`}>
                {i < step ? Ic.check : <span style={{ fontFamily:"'Inter',sans-serif", fontSize:'.82rem', fontWeight:700 }}>{i+1}</span>}
              </div>
              <span className={s.stepNameTopbar}>{st.label}</span>
            </div>
          ))}
        </div>
        <div className={s.progressBarOuter}>
          <div className={s.progressBarInner} style={{ width: globalPct + '%' }} />
        </div>
      </div>

      <div className={s.layout}>
        <aside className={s.leftPanel} />
        <main className={s.main}>
          <div className={s.mainInner} key={step}>

            {error && (
              <div className={s.errBar}>
                {Ic.warn} {error}
                <button className={s.errX} onClick={() => setError('')}>{Ic.x}</button>
              </div>
            )}

            {/* ÉTAPES 0, 1, 2, 3 — identiques à l'original */}

            {/* ══ ÉTAPE 0 — CLIENT ══ */}
            {step === 0 && (
              <>
                <div className={s.sHead}>
                  <div className={s.sTitle}>Choisir le client constructeur</div>
                  <Desc>Chaque qualification est spécifique à un client. Sélectionnez le client pour lequel vous créez cette qualification.</Desc>
                </div>
                <div style={{ height:'1px', background:'var(--border)', margin:'1.75rem 0' }} />
                {loadingClients ? (
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:200, gap:10, color:'#94A3B8' }}>
                    <span style={{ width:22, height:22, border:'2.5px solid #E2E8F0', borderTopColor:'#0B1E3D', borderRadius:'50%', display:'inline-block', animation:'spin .7s linear infinite' }} /> Chargement des clients…
                  </div>
                ) : clients.length === 0 ? (
                  <div style={{ background:'#FFF7ED', border:'1px solid #FED7AA', borderRadius:14, padding:'2rem', textAlign:'center' }}>
                    <div style={{ fontWeight:700, color:'#0B1E3D', marginBottom:8 }}>Aucun client disponible</div>
                    <button onClick={() => navigate('/expert/certif')} style={{ padding:'9px 20px', borderRadius:10, border:'none', background:'#0B1E3D', color:'#fff', fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>Retour</button>
                  </div>
                ) : (
                  <>
                    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
                      <div style={{ fontSize:'.76rem', fontWeight:700, color:'#9CA3AF', textTransform:'uppercase', letterSpacing:'.08em' }}>
                        {clients.length} client{clients.length>1?'s':''} disponible{clients.length>1?'s':''}
                      </div>
                      {clientSel && (
                        <div style={{ fontSize:'.78rem', color:'#059669', fontWeight:700, display:'flex', alignItems:'center', gap:5 }}>
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                          {clientSelObj?.nom} sélectionné
                        </div>
                      )}
                    </div>
                    <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(140px, 1fr))', gap:12, marginBottom:'1.5rem' }}>
                      {clients.map((c, idx) => <ClientCard key={c.id} client={c} selected={clientSel===c.id} onSelect={setClientSel} index={idx}/>)}
                    </div>
                    {clientSel && (
                      <div style={{ background:'#EFF6FF', border:'1px solid #BFDBFE', borderRadius:12, padding:'.875rem 1.1rem', fontSize:'.83rem', color:'#1E40AF', display:'flex', gap:8 }}>
                        <span style={{ flexShrink:0, width:16, height:16, display:'inline-flex', alignItems:'center', color:'#1D4ED8' }}>{Ic.info}</span>
                        La qualification sera associée à <strong>{clientSelObj?.nom}</strong>.
                      </div>
                    )}
                  </>
                )}
                <div className={s.navRow}>
                  <div className={s.navL}><button className={s.btnBack} onClick={() => navigate('/expert/certif')}>{Ic.back} Retour</button></div>
                  <button className={s.btnNext} onClick={go0} disabled={loading || !clientSel}>
                    {loading ? <span className={s.spin}/> : null}
                    {loading ? 'Sauvegarde…' : <>Configurer la formation {Ic.arrow}</>}
                  </button>
                </div>
              </>
            )}

            {/* ══ ÉTAPE 1 — FORMATION ══ */}
            {step === 1 && (
              <>
                <div className={s.sHead}>
                  <div className={s.sTitle}>Support de formation</div>
                  <Desc>Choisissez une <strong style={{ color:'#374151' }}>formation existante</strong> ou importez un <strong style={{ color:'#374151' }}>nouveau fichier</strong>.</Desc>
                </div>
                <div style={{ height:'1px', background:'var(--border)', margin:'1.75rem 0' }} />
                <div style={{ display:'flex', gap:8, marginBottom:'1.75rem' }}>
                  <button className={`${s.modeBtn} ${formationMode==='existant'?s.modeBtnOn:''}`} onClick={() => { setFormationMode('existant'); setFormationExistSrc(null); }}>{Ic.hist} Utiliser une formation existante</button>
                  <button className={`${s.modeBtn} ${formationMode==='nouveau'?s.modeBtnOn:''}`} onClick={() => { setFormationMode('nouveau'); setFormationExistSrc(null); }}>{Ic.upload} Importer un nouveau fichier</button>
                </div>
                {formationMode === 'existant' && (
                  formationsExist.length === 0 ? (
                    <div style={{ background:'#F8FAFC', border:'1.5px dashed #E2E8F0', borderRadius:14, padding:'3rem 2rem', textAlign:'center' }}>
                      <div style={{ fontWeight:700, color:'#374151', marginBottom:6 }}>Aucune formation disponible</div>
                      <button onClick={() => setFormationMode('nouveau')} style={{ padding:'9px 18px', borderRadius:9, border:'none', background:'#0B1E3D', color:'#fff', fontWeight:700, fontSize:'.84rem', cursor:'pointer', fontFamily:'inherit' }}>
                        {Ic.upload} Importer un fichier →
                      </button>
                    </div>
                  ) : (
                    <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                      {formationsExist.map((c, idx) => (
                        <FormationCard key={c.formationNom} c={c} selected={formationExistSel===c.formationNom} onSelect={setFormationExistSel} index={idx}/>
                      ))}
                    </div>
                  )
                )}
                {formationMode === 'nouveau' && (
                  <div style={{ display:'flex', flexDirection:'column', gap:'1.5rem' }}>
                    <div onClick={() => pdfRef.current?.click()}
                      style={{ border:`2px dashed ${formationFile?.base64?'#2563EB':'#D1D5DB'}`, borderRadius:16, minHeight:200, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:14, cursor:'pointer', background:formationFile?.base64?'#EFF6FF':'#FAFBFC', padding:'2rem' }}>
                      <div style={{ width:56, height:56, borderRadius:16, background:formationFile?.base64?'#DBEAFE':'#F1F5F9', display:'flex', alignItems:'center', justifyContent:'center' }}>
                        {formationFile?.base64 ? (formationFile.name?.endsWith('.pdf') ? Ic.pdf : Ic.ppt) : Ic.cloud}
                      </div>
                      {formationFile?.base64 ? (
                        <div style={{ textAlign:'center' }}>
                          <div style={{ fontWeight:800, color:'#1E40AF', fontSize:'1rem', marginBottom:4, display:'flex', alignItems:'center', gap:6 }}><span style={{color:'#059669',width:16,height:16,display:'inline-flex'}}>{Ic.check}</span> Fichier importé</div>
                          <div style={{ fontSize:'.88rem', color:'#3B82F6', fontWeight:600 }}>{formationFile.name}</div>
                          <div style={{ fontSize:'.76rem', color:'#6B7280', marginTop:6 }}>Cliquez pour changer</div>
                        </div>
                      ) : (
                        <div style={{ textAlign:'center' }}>
                          <div style={{ fontWeight:700, color:'#374151', fontSize:'1rem', marginBottom:6 }}>Cliquez pour importer</div>
                          <div style={{ fontSize:'.82rem', color:'#9CA3AF' }}>PDF ou PowerPoint (.pdf, .ppt, .pptx)</div>
                        </div>
                      )}
                    </div>
                    <input ref={pdfRef} type="file" accept=".pdf,.ppt,.pptx" onChange={handleFormationFile} style={{ display:'none' }} />
                  </div>
                )}
                <div className={s.navRow}>
                  <div className={s.navL}><button className={s.btnBack} onClick={() => setStep(0)}>{Ic.back} Retour</button></div>
                  <button className={s.btnNext} onClick={go1}
                    disabled={loading||(formationMode==='nouveau'&&!formationFile?.base64)||(formationMode==='existant'&&!formationExistSel)}>
                    {loading?<span className={s.spin}/>:null}
                    {loading?'Sauvegarde…':<>Configurer le test théorique {Ic.arrow}</>}
                  </button>
                </div>
              </>
            )}

            {/* ══ ÉTAPE 2 — TEST THÉORIQUE ══ */}
            {step === 2 && (
              <>
                <div className={s.sHead}>
                  <div className={s.sTitle}>Test théorique</div>
                  <Desc>Définissez le seuil de réussite puis ajoutez <strong style={{ color:'#374151' }}>10 questions image</strong> et <strong style={{ color:'#374151' }}>10 questions QCM</strong>.</Desc>
                </div>
                <div style={{ height:'1px', background:'var(--border)', margin:'1.75rem 0' }} />
                <div style={{ display:'flex', gap:8, marginBottom:'1.25rem' }}>
                  <button className={`${s.modeBtn} ${modeTheo==='nouveau'?s.modeBtnOn:''}`} onClick={() => setModeTheo('nouveau')}>{Ic.plus} Créer un nouveau test</button>
                  <button className={`${s.modeBtn} ${modeTheo==='existant'?s.modeBtnOn:''}`} onClick={() => { setModeTheo('existant'); setTestTheoId(null); }}>{Ic.hist} Choisir dans la bibliothèque</button>
                </div>
                {modeTheo === 'nouveau' && !testTheoId && (
                  <>
                    <F>
                      <div className={s.seuilCard}>
                        <div style={{ fontSize:17, fontWeight:700, marginBottom:-20 }}>Seuil de réussite</div>
                        <div className={s.seuilTop}><div className={s.seuilInfo}/><div className={s.seuilNum}>{testTheo.seuilReussite}<span>%</span></div></div>
                        <div className={s.seuilTrack}><div className={s.seuilFill} style={{ width:((testTheo.seuilReussite-50)/50)*100+'%' }}/></div>
                        <input type="range" min={50} max={100} step={5} value={testTheo.seuilReussite} className={s.seuilSlider} onChange={e => setTestTheo(f => ({ ...f, seuilReussite:+e.target.value }))} />
                        <div className={s.seuilTicks}>{['50%','60%','70%','80%','90%','100%'].map(v => <span key={v}>{v}</span>)}</div>
                      </div>
                    </F>
                    <button className={s.btnNext} onClick={go2_nouveau} disabled={loading} style={{ alignSelf:'flex-start', marginTop:'1rem' }}>
                      {loading?<span className={s.spin}/>:Ic.plus} {loading?'Création...':'Créer et saisir les questions →'}
                    </button>
                  </>
                )}
                {modeTheo === 'existant' && (
                  <F label="Tests théoriques disponibles">
                    <div className={s.exList}>
                      {anciensTT.length===0
                        ? <div className={s.exEmpty}>Aucun test dans votre bibliothèque.</div>
                        : anciensTT.map(tt => (
                          <div key={tt.id} className={`${s.exCard} ${testTheoId===tt.id?s.exSel:''}`} onClick={() => setTestTheoId(tt.id)}>
                            <div className={`${s.exDot} ${testTheoId===tt.id?s.exDotOn:''}`}>{testTheoId===tt.id&&Ic.check}</div>
                            <div>
                              <div className={s.exName}>{tt.titre}</div>
                              <div className={s.exMeta}><span>Seuil {tt.seuilReussite}%</span>·<span>{tt.nbQuestionsImage||0} images</span>·<span>{tt.nbQuestionsQCMPool||0} QCM</span>{tt.actif&&<span className={s.exOk}>● Actif</span>}</div>
                            </div>
                          </div>
                        ))}
                    </div>
                  </F>
                )}
                {testTheoId && modeTheo === 'nouveau' && (
                  <>
                    <div style={{ display:'flex', alignItems:'center', gap:12, margin:'2rem 0 1.5rem' }}>
                      <div style={{ flex:1, height:2, background:'linear-gradient(90deg,#2563EB,#0B2347)', borderRadius:99 }} />
                      <div style={{ background:'#0B2347', color:'#fff', borderRadius:10, padding:'6px 16px', fontSize:'.8rem', fontWeight:800 }}>Saisie des questions</div>
                      <div style={{ flex:1, height:2, background:'linear-gradient(90deg,#0B2347,#2563EB)', borderRadius:99 }} />
                    </div>
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'.875rem', marginBottom:'1.5rem' }}>
                      <CountBadge label="Questions image" icon={Ic.img} n={images.length} min={10} />
                      <CountBadge label="Questions QCM" icon={Ic.qcm} n={qcms.length} min={10} />
                    </div>
                    <div style={{ display:'flex', gap:8, marginBottom:'1.25rem' }}>
                      {[{ id:'image', lbl:'Partie 1 — Questions image' },{ id:'qcm', lbl:'Partie 2 — Questions QCM' }].map(t => (
                        <button key={t.id} onClick={() => setTab(t.id)}
                          style={{ display:'flex', alignItems:'center', gap:6, padding:'.7rem 5rem', border:tab===t.id?'none':'1.5px solid #D1D5DB', borderRadius:10, cursor:'pointer', fontFamily:"'Inter',sans-serif", fontSize:'.83rem', fontWeight:700, background:tab===t.id?'#0B2347':'#fff', color:tab===t.id?'#fff':'#6B7280' }}>
                          {t.lbl}
                        </button>
                      ))}
                    </div>
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 220px', gap:'1.25rem', alignItems:'start' }}>
                      <div>
                        {tab === 'image' && (
                          <div className={s.qForm}>
                            <div className={s.qFormTitle}>{Ic.img} Question image #{images.length+1}</div>
                            <F label="Image du défaut *">
                              <div className={`${s.uploadZone} ${imgForm.imageBase64?s.uploadZoneFull:''}`} onClick={() => fileRef.current?.click()}>
                                {imgForm.imageBase64 ? <img src={`data:image/jpeg;base64,${imgForm.imageBase64}`} alt="prev" className={s.uploadPrev}/> : <><div className={s.uploadIco}>{Ic.upload}</div><div className={s.uploadTxt}>Cliquer pour importer</div><div className={s.uploadSub}>JPG ou PNG</div></>}
                              </div>
                              <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} style={{ display:'none' }} />
                            </F>
                            <F label="Bonne réponse *">
                              <input className={s.inp} value={imgForm.bonneReponse} onChange={e => setImgForm(f => ({ ...f, bonneReponse:e.target.value }))} placeholder="ex : Dénudage excessif" />
                            </F>
                            <button className={s.btnAdd} onClick={addImg} disabled={loading}>
                              {loading?<span className={s.spinD}/>:Ic.plus} {loading?'Ajout...':'Ajouter cette question image'}
                            </button>
                          </div>
                        )}
                        {tab === 'qcm' && (
                          <div className={s.qForm}>
                            <div className={s.qFormTitle}>{Ic.qcm} Question QCM #{qcms.length+1}</div>
                            <F label="Énoncé *">
                              <textarea className={s.tarea} value={qcmForm.enonce} rows={3} onChange={e => setQcmForm(f => ({ ...f, enonce:e.target.value }))} placeholder="ex : Quelle est la tolérance maximale de dénudage ?" />
                            </F>
                            <F label="4 réponses" hint="Cliquez sur une ou plusieurs lignes pour les marquer comme bonnes réponses">
                              <div className={s.qcmList}>
                                {[0,1,2,3].map(i => {
                                  const isSel = qcmForm.bonnesReponsesIndexes.includes(i);
                                  return (
                                    <div key={i} className={`${s.qcmRow} ${isSel?s.qcmRowOn:''}`}
                                      onClick={() => setQcmForm(f => {
                                        const curr = f.bonnesReponsesIndexes;
                                        return { ...f, bonnesReponsesIndexes: curr.includes(i) ? curr.filter(x=>x!==i) : [...curr,i] };
                                      })}>
                                      <div className={`${s.qcmCircle} ${isSel?s.qcmCircleOn:''}`} style={{ borderRadius:isSel?4:'50%' }} />
                                      <span className={s.qcmLtr}>{String.fromCharCode(65+i)}</span>
                                      <input className={s.qcmInp} value={qcmForm.options[i]}
                                        onChange={e => { const o=[...qcmForm.options]; o[i]=e.target.value; setQcmForm(f=>({...f,options:o})); }}
                                        placeholder={`Réponse ${String.fromCharCode(65+i)}`} onClick={e=>e.stopPropagation()} />
                                    </div>
                                  );
                                })}
                              </div>
                            </F>
                            <button className={s.btnAdd} onClick={addQCM} disabled={loading}>
                              {loading?<span className={s.spinD}/>:Ic.plus} {loading?'Ajout...':'Ajouter ce QCM'}
                            </button>
                          </div>
                        )}
                      </div>
                      <div style={{ position:'sticky', top:16 }}>
                        {tab==='image' && images.length>0 && (
                          <div className={s.addedPanel}>
                            <div className={s.addedHead}><span className={s.addedHeadTitle}>{images.length} image{images.length>1?'s':''}</span></div>
                            <div className={s.addedBar}><div className={s.addedBarFill} style={{ width:Math.min(100,images.length*10)+'%' }}/></div>
                            {images.map((img,i) => (<div key={i} className={s.addedItem}><div className={s.addedN}>{i+1}</div><div className={s.addedTitle}>{img.bonneReponse}</div><div className={s.addedChk}>{Ic.check}</div></div>))}
                          </div>
                        )}
                        {tab==='qcm' && qcms.length>0 && (
                          <div className={s.addedPanel}>
                            <div className={s.addedHead}><span className={s.addedHeadTitle}>{qcms.length} QCM</span></div>
                            <div className={s.addedBar}><div className={s.addedBarFill} style={{ width:Math.min(100,qcms.length*10)+'%' }}/></div>
                            {qcms.map((q,i) => (<div key={i} className={s.addedItem}><div className={s.addedN}>{i+1}</div><div className={s.addedTitle}>{q.enonce?.length>55?q.enonce.slice(0,55)+'...':q.enonce}</div><div className={s.addedChk}>{Ic.check}</div></div>))}
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}
                <div className={s.navRow}>
                  <div className={s.navL}>
                    <button className={s.btnBack} onClick={() => setStep(1)}>{Ic.back} Retour</button>
                    {testTheoId&&!canNext2&&modeTheo==='nouveau'&&(<div className={s.btnNextNote}>{Ic.warn} {Math.max(0,10-images.length)} img + {Math.max(0,10-qcms.length)} QCM manquants</div>)}
                  </div>
                  {modeTheo === 'existant' ? (
                    <button className={s.btnNext} onClick={go2_existant} disabled={loading||!testTheoId}>
                      {loading?<span className={s.spin}/>:null} {loading?'Chargement...':<>Test pratique {Ic.arrow}</>}
                    </button>
                  ) : (
                    <button className={s.btnNext} onClick={goToStep3} disabled={loading||!canNext2}>
                      {loading?<span className={s.spin}/>:null} {loading?'Activation...':canNext2?<>Test pratique {Ic.arrow}</>:'Questions insuffisantes'}
                    </button>
                  )}
                </div>
              </>
            )}

            {/* ══ ÉTAPE 3 — TEST PRATIQUE ══ */}
            {step === 3 && (
              <>
                <div className={s.sHead}>
                  <div className={s.sTitle}>Test pratique</div>
                  <Desc>Choisissez <strong style={{ color:'#374151' }}>un test existant</strong> (recommandé) ou créez-en un nouveau.</Desc>
                </div>
                <div style={{ height:'1px', background:'var(--border)', margin:'1.75rem 0' }} />
                <div style={{ display:'flex', gap:8, marginBottom:'1.25rem' }}>
                  <button className={`${s.modeBtn} ${modePrat==='existant'?s.modeBtnOn:''}`} onClick={() => { setModePrat('existant'); setTestPratiqueId(null); }}>{Ic.hist} Choisir dans la bibliothèque</button>
                  <button className={`${s.modeBtn} ${modePrat==='nouveau'?s.modeBtnOn:''}`} onClick={() => setModePrat('nouveau')}>{Ic.plus} Créer un nouveau test</button>
                </div>
                {modePrat === 'existant' && (
                  <F label="Tests pratiques disponibles">
                    <div className={s.exList}>
                      {anciensTP.length === 0 ? (
                        <div style={{ background:'#F8FAFC', border:'1.5px dashed #E2E8F0', borderRadius:12, padding:'2rem', textAlign:'center', color:'#94A3B8', fontSize:'.86rem', fontWeight:600 }}>Chargement…</div>
                      ) : anciensTP.map(tp => {
                        const isGenerique = tp.titre === TITRE_GENERIQUE_PRATIQUE;
                        return (
                          <div key={tp.id} className={`${s.exCard} ${testPratiqueId===tp.id?s.exSel:''}`} onClick={() => setTestPratiqueId(tp.id)}
                            style={isGenerique&&testPratiqueId!==tp.id?{borderColor:'#A7F3D0',background:'#F0FDF4'}:{}}>
                            <div className={`${s.exDot} ${testPratiqueId===tp.id?s.exDotOn:''}`}>{testPratiqueId===tp.id&&Ic.check}</div>
                            <div style={{ flex:1 }}>
                              <div className={s.exName} style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
                                {tp.titre}
                                {isGenerique && <span style={{ background:'#ECFDF5', color:'#059669', fontSize:'.65rem', fontWeight:800, padding:'2px 8px', borderRadius:99, border:'1px solid #A7F3D0' }}>⭐ Recommandé</span>}
                              </div>
                              <div className={s.exMeta}>
                                <span>Seuil {tp.seuilReussite}%</span>·<span>{tp.nbDefauts||0} défaut{tp.nbDefauts>1?'s':''}</span>
                                {tp.actif&&<span className={s.exOk}>● Actif</span>}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </F>
                )}
                {modePrat === 'nouveau' && !testPratiqueId && (
                  <>
                    <div className={s.seuilCard}>
                      <div style={{ fontSize:17, fontWeight:700, marginBottom:-20 }}>Seuil de réussite</div>
                      <div className={s.seuilTop}><div className={s.seuilInfo}/><div className={s.seuilNum}>{testPrat.seuilReussite}<span>%</span></div></div>
                      <div className={s.seuilTrack}><div className={s.seuilFill} style={{ width:((testPrat.seuilReussite-50)/50)*100+'%' }}/></div>
                      <input type="range" min={50} max={100} step={5} value={testPrat.seuilReussite} className={s.seuilSlider} onChange={e => setTestPrat(f=>({...f,seuilReussite:+e.target.value}))} />
                      <div className={s.seuilTicks}>{['50%','60%','70%','80%','90%','100%'].map(v=><span key={v}>{v}</span>)}</div>
                    </div>
                    <button className={s.btnNext} onClick={go3_nouveau} disabled={loading} style={{ alignSelf:'flex-start', marginTop:'1rem', display:'inline-flex', alignItems:'center', gap:8 }}>
                      {loading?<span className={s.spin}/>:Ic.plus} {loading?'Création…':'Valider le seuil →'}
                    </button>
                  </>
                )}
                {testPratiqueId && modePrat === 'nouveau' && (
                  <div style={{ background:'#EFF6FF', border:'1.5px solid #BFDBFE', borderRadius:14, padding:'1rem 1.25rem', display:'flex', alignItems:'center', justifyContent:'space-between', gap:16, margin:'1.5rem 0' }}>
                    <div>
                      <div style={{ fontWeight:700, fontSize:'.88rem', color:'#0B1E3D', marginBottom:3 }}>Saisir les défauts physiques (optionnel)</div>
                      <div style={{ fontSize:'.77rem', color:'#3B82F6' }}>Vous pouvez saisir les défauts ou passer directement à l'import du certificat.</div>
                    </div>
                    <button onClick={() => setAfficherDefauts(v=>!v)}
                      style={{ width:48, height:28, borderRadius:99, border:'none', cursor:'pointer', background:afficherDefauts?'#0B1E3D':'#D1D5DB', flexShrink:0, position:'relative' }}>
                      <span style={{ position:'absolute', top:4, left:afficherDefauts?'24px':'4px', width:20, height:20, borderRadius:'50%', background:'#fff', transition:'left .2s' }} />
                    </button>
                  </div>
                )}
                {afficherDefauts && testPratiqueId && modePrat === 'nouveau' && (
                  <div className={s.qForm}>
                    <div className={s.qFormTitle}>{Ic.tool} Défaut #{defauts.length+1}</div>
                    <div className={s.defGrid}>
                      <F label="Type de défaut *"><input className={s.inp} value={defautForm.typeDefaut} onChange={e => setDefautForm(f=>({...f,typeDefaut:e.target.value}))} placeholder="ex : Dénudage excessif" /></F>
                      <F label="Localisation"><input className={s.inp} value={defautForm.localisation} onChange={e => setDefautForm(f=>({...f,localisation:e.target.value}))} /></F>
                    </div>
                    <button className={s.btnAdd} onClick={addDefaut} disabled={loading}>
                      {loading?<span className={s.spinD}/>:Ic.plus} Ajouter ce défaut
                    </button>
                  </div>
                )}
                <div className={s.navRow}>
                  <div className={s.navL}><button className={s.btnBack} onClick={() => setStep(2)}>{Ic.back} Retour</button></div>
                  {modePrat === 'existant' ? (
                    <button className={s.btnNext} onClick={go3_existant} disabled={loading||!testPratiqueId}>
                      {loading?<span className={s.spin}/>:null} {loading?'Chargement...':<>Importer le certificat {Ic.arrow}</>}
                    </button>
                  ) : (
                    <button className={s.btnNext} onClick={goToStep4} disabled={loading||!testPratiqueId}>
                      {loading?<span className={s.spin}/>:null} {loading?'Activation...':<>Importer le certificat {Ic.arrow}</>}
                    </button>
                  )}
                </div>
              </>
            )}

            {/* ══════════════════════════════════════════════════════
                ÉTAPE 4 — CERTIFICAT PDF  ← VERSION AVEC BIBLIOTHÈQUE
            ══════════════════════════════════════════════════════ */}
            {step === 4 && (
              <>
                <div className={s.sHead}>
                  <div className={s.sTitle}>Modèle de certificat PDF</div>
                  <Desc>
                    Choisissez un <strong style={{ color:'#374151' }}>modèle existant</strong> dans la bibliothèque ou importez un <strong style={{ color:'#374151' }}>nouveau fichier PDF</strong>. Les informations de l'auditeur seront remplies automatiquement à l'obtention.
                  </Desc>
                </div>
                <div style={{ height:'1px', background:'var(--border)', margin:'2rem 0' }} />

                {/* ── Sélecteur de mode ── */}
                <div style={{ display:'flex', gap:8, marginBottom:'1.75rem' }}>
                  <button
                    className={`${s.modeBtn} ${certifMode==='existant'?s.modeBtnOn:''}`}
                    onClick={() => { setCertifMode('existant'); setCertifExistSrc(null); }}>
                    {Ic.hist} Utiliser un modèle existant
                    {certifsExist.length > 0 && (
                      <span style={{ marginLeft:6, background:'rgba(255,255,255,.25)', borderRadius:99, padding:'1px 7px', fontSize:'.68rem', fontWeight:800 }}>
                        {certifsExist.length}
                      </span>
                    )}
                  </button>
                  <button
                    className={`${s.modeBtn} ${certifMode==='nouveau'?s.modeBtnOn:''}`}
                    onClick={() => { setCertifMode('nouveau'); setCertifExistSrc(null); }}>
                    {Ic.upload} Importer un nouveau fichier
                  </button>
                </div>

                {/* ── Mode bibliothèque ── */}
                {certifMode === 'existant' && (
                  certifsExist.length === 0 ? (
                    <div style={{ background:'#F8FAFC', border:'1.5px dashed #E2E8F0', borderRadius:14, padding:'3rem 2rem', textAlign:'center' }}>
                      <div style={{ fontSize:'2rem', marginBottom:12 }}>📄</div>
                      <div style={{ fontWeight:700, color:'#374151', marginBottom:6 }}>Aucun modèle de certificat disponible</div>
                      <div style={{ fontSize:'.82rem', color:'#94A3B8', marginBottom:16 }}>Importez votre premier modèle PDF</div>
                      <button onClick={() => setCertifMode('nouveau')}
                        style={{ padding:'9px 18px', borderRadius:9, border:'none', background:'#0B1E3D', color:'#fff', fontWeight:700, fontSize:'.84rem', cursor:'pointer', fontFamily:'inherit', display:'inline-flex', alignItems:'center', gap:6 }}>
                        {Ic.upload} Importer un fichier →
                      </button>
                    </div>
                  ) : (
                    <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                      {certifsExist.map((c, idx) => (
                        <CertifCard
                          key={c.certifNom} c={c}
                          selected={certifExistSel === c.certifNom}
                          onSelect={nom => {
                            setCertifExistSel(nom);
                            const src = certifsExist.find(x => x.certifNom === nom);
                            if (src) {
                              setCertifExistSrc({ certifUrl: src.certifUrl, certifNom: src.certifNom });
                              setCertifPdf({ name: src.certifNom }); // pour le récapitulatif étape 5
                            }
                          }}
                          index={idx}
                        />
                      ))}
                    </div>
                  )
                )}

                {/* ── Mode nouveau fichier ── */}
                {certifMode === 'nouveau' && (
                  <div style={{ display:'flex', flexDirection:'column', gap:'1.5rem' }}>
                    <div onClick={() => certifRef.current?.click()}
                      style={{ border:`2px dashed ${certifPdf?.base64?'#059669':'#D1D5DB'}`, borderRadius:15, minHeight:220, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:14, cursor:'pointer', background:certifPdf?.base64?'#ECFDF5':'#FAFBFC', padding:'2rem', transition:'all .2s' }}>
                      <div style={{ width:56, height:56, borderRadius:16, background:certifPdf?.base64?'#D1FAE5':'#FEE2E2', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.6rem', border:`2px solid ${certifPdf?.base64?'#A7F3D0':'#FECACA'}` }}>
                        {certifPdf?.base64
                          ? <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="#059669" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                          : <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="#DC2626" strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/></svg>}
                      </div>
                      {certifPdf?.base64 ? (
                        <div style={{ textAlign:'center' }}>
                          <div style={{ fontWeight:800, color:'#065F46', fontSize:'1rem', marginBottom:4, display:'flex', alignItems:'center', gap:6 }}>
                            <span style={{ color:'#059669', width:16, height:16, display:'inline-flex' }}>{Ic.check}</span> Modèle importé
                          </div>
                          <div style={{ fontSize:'.88rem', color:'#059669', fontWeight:600 }}>{certifPdf.name}</div>
                          <div style={{ fontSize:'.76rem', color:'#6B7280', marginTop:6 }}>Cliquez pour changer</div>
                        </div>
                      ) : (
                        <div style={{ textAlign:'center' }}>
                          <div style={{ fontWeight:700, color:'#374151', fontSize:'1rem', marginBottom:6 }}>Cliquez pour importer le modèle PDF</div>
                          <div style={{ fontSize:'.82rem', color:'#9CA3AF' }}>Fichier PDF uniquement (.pdf)</div>
                          <div style={{ fontSize:'.76rem', color:'#B0B8C8', marginTop:6, fontStyle:'italic' }}>Les données de l'auditeur seront remplies automatiquement par l'IA</div>
                        </div>
                      )}
                    </div>
                    <input ref={certifRef} type="file" accept=".pdf,application/pdf" onChange={handleCertifPdf} style={{ display:'none' }} />

                    {certifPdf?.base64 && (
                      <div style={{ background:'#F0FDF4', border:'1px solid #A7F3D0', borderRadius:10, padding:'10px 14px', fontSize:'.81rem', color:'#065F46', display:'flex', alignItems:'center', gap:8 }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                        Ce fichier sera ajouté à la bibliothèque et réutilisable pour les prochaines qualifications.
                      </div>
                    )}
                  </div>
                )}

                <div className={s.navRow}>
                  <div className={s.navL}><button className={s.btnBack} onClick={() => setStep(3)}>{Ic.back} Retour</button></div>
                  <button className={s.btnNext} onClick={goToStep5}
                    disabled={
                      loading ||
                      (certifMode === 'nouveau'  && !certifPdf?.base64) ||
                      (certifMode === 'existant' && !certifExistSel)
                    }>
                    {loading?<span className={s.spin}/>:null}
                    {loading?'Sauvegarde...':<>Réviser et publier {Ic.arrow}</>}
                  </button>
                </div>
              </>
            )}

            {/* ══ ÉTAPE 5 — PUBLICATION ══ */}
            {step === 5 && (
              <>
                <div className={s.sHead}>
                  <div className={s.sTitle}>Prêt à publier</div>
                  <Desc>Vérifiez le récapitulatif. La qualification sera créée avec le statut <strong style={{ color:'#374151' }}>inactif</strong>.</Desc>
                </div>
                <div style={{ height:'1px', background:'var(--border)', margin:'1.5rem 0' }} />

                <div style={{ background:'linear-gradient(135deg,#0B2347,#1D4ED8)', borderRadius:16, padding:'1.5rem 1.75rem', marginBottom:'1.5rem', position:'relative', overflow:'hidden' }}>
                  {clientSelObj && (
                    <div style={{ position:'absolute', top:12, right:20, display:'flex', alignItems:'center', gap:8 }}>
                      <div style={{ width:28, height:28, borderRadius:8, background:clientSelObj.couleur||'rgba(255,255,255,.2)', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:800, fontSize:'.75rem', color:'#fff' }}>
                        {clientSelObj.code||clientSelObj.nom.slice(0,2)}
                      </div>
                      <span style={{ fontSize:'.8rem', color:'rgba(255,255,255,.6)', fontWeight:600 }}>{clientSelObj.nom}</span>
                    </div>
                  )}
                  <div style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", fontSize:'1.6rem', fontWeight:800, color:'#fff', letterSpacing:'-.02em', marginBottom:6 }}>
                    Qualification {clientSelObj ? clientSelObj.nom + ' ' : ''}{dateAuto}
                  </div>
                  <div style={{ fontSize:'.82rem', color:'rgba(255,255,255,.45)' }}>
                    Valable 2 ans · Expire le {new Date(Date.now()+2*365.25*24*3600*1000).toLocaleDateString('fr-FR',{day:'2-digit',month:'long',year:'numeric'})}
                  </div>
                </div>

                <div style={{ display:'flex', flexDirection:'column', gap:'.625rem', marginBottom:'1.5rem' }}>
                  {[
                    {
                      lbl:'Client',
                      ico:<svg viewBox='0 0 24 24' width='18' height='18' fill='none' stroke='currentColor' strokeWidth='1.8' strokeLinecap='round'><rect x='2' y='7' width='20' height='14' rx='2'/><path d='M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16'/></svg>,
                      name:clientSelObj?.nom||'—', meta:clientSelObj?.paysOrigine||'', ok:!!clientSel
                    },
                    {
                      lbl:'Formation',
                      ico:<svg viewBox='0 0 24 24' width='18' height='18' fill='none' stroke='currentColor' strokeWidth='1.8' strokeLinecap='round'><path d='M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z'/><path d='M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z'/></svg>,
                      name: formationExistSrc?.formationNom || formationFile?.name || '—',
                      meta: formationMode==='existant' ? 'Formation existante réutilisée' : 'Nouveau fichier importé',
                      ok: !!(formationFile?.base64 || formationExistSrc?.formationUrl)
                    },
                    {
                      lbl:'Test théorique',
                      ico:<svg viewBox='0 0 24 24' width='18' height='18' fill='none' stroke='currentColor' strokeWidth='1.8' strokeLinecap='round'><path d='M9 11l3 3L22 4'/><path d='M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11'/></svg>,
                      name:ttSel?.titre||`Test Théorique ${dateAuto}`,
                      meta:`${images.length} questions image · ${qcms.length} QCM · seuil ${ttSel?.seuilReussite||testTheo.seuilReussite}%`,
                      ok:!!testTheoId
                    },
                    {
                      lbl:'Test pratique',
                      ico:<svg viewBox='0 0 24 24' width='18' height='18' fill='none' stroke='currentColor' strokeWidth='1.8' strokeLinecap='round'><path d='M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z'/></svg>,
                      name:tpSel?.titre||`Test Pratique ${dateAuto}`,
                      meta:`Seuil ${tpSel?.seuilReussite||testPrat.seuilReussite}%${tpSel?.titre===TITRE_GENERIQUE_PRATIQUE?' · Score noté manuellement':''}`,
                      ok:!!testPratiqueId
                    },
                    {
                      lbl:'Modèle certificat',
                      ico:<svg viewBox='0 0 24 24' width='18' height='18' fill='none' stroke='currentColor' strokeWidth='1.8' strokeLinecap='round'><circle cx='12' cy='8' r='6'/><path d='M15.477 12.89L17 22l-5-3-5 3 1.523-9.11'/></svg>,
                      name: certifExistSrc?.certifNom || certifPdf?.name || '—',
                      // ── MODIFIÉ : meta selon le mode ──
                      meta: certifMode==='existant'
                        ? 'Modèle existant réutilisé · Remplissage auto à l\'obtention'
                        : 'Nouveau fichier · Remplissage auto à l\'obtention',
                      ok: !!(certifPdf?.base64 || certifExistSrc?.certifUrl)
                    },
                  ].map((rc, i) => (
                    <div key={i} style={{ display:'flex', alignItems:'center', gap:14, background:'#fff', border:'1px solid #E8EDF7', borderRadius:14, padding:'1rem 1.25rem', position:'relative', overflow:'hidden' }}>
                      <div style={{ position:'absolute', left:0, top:0, bottom:0, width:4, background:rc.ok?'#059669':'#E5E7EB', borderRadius:'0 3px 3px 0' }} />
                      <div style={{ width:40, height:40, borderRadius:10, background:'#F8FAFC', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>{rc.ico}</div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontSize:'.63rem', fontWeight:700, textTransform:'uppercase', letterSpacing:'.1em', color:'#9CA3AF' }}>{rc.lbl}</div>
                        <div style={{ fontSize:'.9rem', fontWeight:700, color:'#111827', margin:'2px 0', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{rc.name}</div>
                        <div style={{ fontSize:'.74rem', color:'#6B7280' }}>{rc.meta}</div>
                      </div>
                      <div style={{ color:rc.ok?'#059669':'#E5E7EB', flexShrink:0 }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                      </div>
                    </div>
                  ))}
                </div>

                <div className={s.navRow}>
                  <div className={s.navL}><button className={s.btnBack} onClick={() => setStep(4)}>{Ic.back} Retour</button></div>
                  <button className={s.btnPublish} onClick={publier} disabled={loading}>
                    {loading ? <span className={s.spin}/> : <span style={{width:18,height:18,display:'inline-flex',alignItems:'center',justifyContent:'center'}}>{Ic.rocket}</span>}
                    {loading?'Publication en cours…':`Publier — Qualification ${clientSelObj?.nom||''} ${dateAuto}`}
                  </button>
                </div>
              </>
            )}

          </div>
        </main>
      </div>
    </div>
  );
}