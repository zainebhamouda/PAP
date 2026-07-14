import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { auditeurCertifAPI } from '../../services/certifAPI';
import api from '../../services/api';
import ChoixQualification from './ChoixQualification';
import ModalQrCode from '../../components/certif/ModalQrCode';

/* ─── Icônes SVG ─── */
const IC = {
  shield:   <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  play:     <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>,
  resume:   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="10 8 16 12 10 16 10 8"/></svg>,
  download: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>,
  eye:      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>,
  lock:     <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>,
  trophy:   <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><polyline points="8 21 12 17 16 21"/><line x1="12" y1="17" x2="12" y2="11"/><path d="M7 4H17a2 2 0 0 1 2 2v1a6 6 0 0 1-6 6 6 6 0 0 1-6-6V6a2 2 0 0 1 2-2z"/></svg>,
  clock:    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  cal:      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  arrow:    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>,
  theo:     <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>,
  prat:     <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>,
  check:    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>,
  info:     <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>,
  x:        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  inprog:   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  bloque:   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>,
  book:     <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>,
  pdf:      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>,
};

const ST = {
  EN_ATTENTE:              { label:'Non commencé',  color:'#1D4ED8', bg:'#DBEAFE', border:'#afcdf1' },
  FORMATION_OBLIGATOIRE:   { label:'Formation',     color:'#6D28D9', bg:'#F3E8FF', border:'#d3bbed' },
  THEORIQUE_EN_COURS:      { label:'Théorique',     color:'#0369A1', bg:'#d0e0eb', border:'#add6ec' },
  PRATIQUE_EN_COURS:       { label:'Pratique',      color:'#4338CA', bg:'#EDE9FE', border:'#c0b5f3' },
  RAPPORT_VALIDE:          { label:'Rapport validé',color:'#BE185D', bg:'#f0dce8', border:'#f6bbdb' },
  CERTIFIE:                { label:'Qualifié ✓',    color:'#15803D', bg:'#cdf8dc', border:'#BBF7D0' },
  BLOQUE:                  { label:'Bloqué',        color:'#C2410C', bg:'#FFEDD5', border:'#FED7AA' },
  ANNULE:                  { label:'Annulé',        color:'#475569', bg:'#d8dfe5', border:'#b0c6e2' },
  THEORIQUE_ECHOUE_1:      { label:'Échoué',        color:'#B91C1C', bg:'#f9d4d4', border:'#eca9a9' },
  THEORIQUE_ECHOUE:        { label:'Échoué',        color:'#991B1B', bg:'#FECACA', border:'#f29c9c' },
};

const STATUTS_EN_COURS = [
  'FORMATION_OBLIGATOIRE', 'THEORIQUE_EN_COURS', 'PRATIQUE_EN_COURS',
];

const FILTERS = [
  { k:'TOUS',       l:'Tous' },
  { k:'COURS',      l:'En cours' },
  { k:'RAPPORT_VALIDE', l:'Rapport validé' },
  { k:'ATTENTE_CHEF', l:'En attente chef' },
  { k:'REUSSI',     l:'Qualifiés' },
  { k:'BLOQUE',     l:'Bloqués' },
  { k:'ANNULE',     l:'Annulés' },
];

function fmt(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('fr-FR', { day:'2-digit', month:'short', year:'numeric' });
}

function Spinner() {
  return <span style={{ width:14,height:14,border:'2px solid rgba(255,255,255,.3)',borderTopColor:'#fff',borderRadius:'50%',animation:'spin .6s linear infinite',display:'inline-block' }}/>;
}

function SpinnerDark() {
  return <span style={{ width:16,height:16,border:'2px solid #E2E8F0',borderTopColor:'#0B1E3D',borderRadius:'50%',animation:'spin .7s linear infinite',display:'inline-block' }}/>;
}

function ScoreBadge({ icon, label, value, seuil, suffix='%' }) {
  const pass = value >= seuil;
  return (
    <span style={{ display:'inline-flex',alignItems:'center',gap:5,background:pass?'#EFF6FF':'#FEF2F2',borderRadius:8,padding:'4px 11px',fontSize:'.73rem',fontWeight:700,color:pass?'#1D4ED8':'#DC2626' }}>
      <span style={{ opacity:.75,display:'flex',alignItems:'center' }}>{icon}</span>
      {label} <strong>{Math.round(value)}{suffix}</strong>
      <span style={{ opacity:.45,fontWeight:500 }}>/ {seuil}{suffix}</span>
    </span>
  );
}

function getEtapeLabel(statut) {
  switch (statut) {
    case 'FORMATION_OBLIGATOIRE': return 'Formation';
    case 'THEORIQUE_EN_COURS':    return 'Test théorique';
    case 'PRATIQUE_EN_COURS':     return 'Test pratique';
    default:                      return 'En cours';
  }
}

/* ═══════════════════════════════════════════════════════════════════
   MODAL : Voir le certificat (iframe PDF)
═══════════════════════════════════════════════════════════════════ */
function ModalVoirCertificat({ passage, onClose }) {
  const [pdfUrl, setPdfUrl]     = useState(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [dlLoading, setDlLoading] = useState(false);

  useEffect(() => {
    if (!passage) return;
    let objectUrl = null;
    setLoading(true); setError('');

    auditeurCertifAPI.voirCertificat(passage.id)
      .then(r => {
        objectUrl = window.URL.createObjectURL(
          new Blob([r.data], { type: 'application/pdf' })
        );
        setPdfUrl(objectUrl);
      })
      .catch(() => setError('Impossible de charger le certificat. Réessayez ou utilisez "Exporter".'))
      .finally(() => setLoading(false));

    return () => { if (objectUrl) window.URL.revokeObjectURL(objectUrl); };
  }, [passage?.id]);

  const handleExporter = async () => {
    setDlLoading(true);
    try {
      const r = await auditeurCertifAPI.exporterCertificat(passage.id);
      const url = window.URL.createObjectURL(new Blob([r.data], { type: 'application/pdf' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `certificat_${passage.certificationTitre || passage.id}.pdf`;
      document.body.appendChild(a); a.click(); a.remove();
      window.URL.revokeObjectURL(url);
    } catch { alert('Erreur lors de l\'export.'); }
    setDlLoading(false);
  };

  if (!passage) return null;

  const isCertifie = passage.statut === 'CERTIFIE' || passage.statutCertificat === 'VALIDE_CHEF';

  return (
    <div style={{ position:'fixed',inset:0,background:'rgba(0,0,0,.6)',zIndex:9999,display:'flex',alignItems:'center',justifyContent:'center',backdropFilter:'blur(4px)',padding:'1rem',animation:'fadeIn .18s ease' }}
      onClick={e => e.target===e.currentTarget && onClose()}>
      <div style={{ background:'#fff',borderRadius:20,width:'100%',maxWidth:780,maxHeight:'93vh',display:'flex',flexDirection:'column',boxShadow:'0 32px 80px rgba(0,0,0,.25)',animation:'popIn .2s ease',overflow:'hidden' }}>

        {/* Header */}
        <div style={{ background:'linear-gradient(135deg,#0B1E3D,#059669)',padding:'16px 22px',display:'flex',alignItems:'center',justifyContent:'space-between',flexShrink:0 }}>
          <div style={{ display:'flex',alignItems:'center',gap:12 }}>
            <div style={{ width:38,height:38,borderRadius:10,background:'rgba(255,255,255,.15)',display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontSize:'1.1rem' }}>
              🎓
            </div>
            <div>
              <div style={{ fontWeight:800,color:'#fff',fontSize:'.95rem' }}>
                Certificat de Qualification
              </div>
              <div style={{ fontSize:'.72rem',color:'rgba(255,255,255,.55)',marginTop:2 }}>
                {passage.certificationTitre} · {passage.certificationClientNom || 'LEONI'}
              </div>
            </div>
          </div>
          <div style={{ display:'flex',gap:8,alignItems:'center' }}>
            {isCertifie && (
              <button onClick={handleExporter} disabled={dlLoading}
                style={{ display:'flex',alignItems:'center',gap:6,padding:'8px 14px',background:'rgba(255,255,255,.15)',border:'1px solid rgba(255,255,255,.3)',borderRadius:9,color:'#fff',cursor:'pointer',fontSize:'.8rem',fontWeight:700,fontFamily:'inherit' }}>
                {dlLoading ? <Spinner/> : IC.download}
                {dlLoading ? 'Export…' : 'Exporter'}
              </button>
            )}
            <button onClick={onClose}
              style={{ width:32,height:32,borderRadius:8,background:'rgba(255,255,255,.12)',border:'none',cursor:'pointer',color:'#fff',display:'flex',alignItems:'center',justifyContent:'center' }}>
              {IC.x}
            </button>
          </div>
        </div>

        {/* Badge statut */}
        {isCertifie && (
          <div style={{ background:'#d3eadf',borderBottom:'1px solid #A7F3D0',padding:'10px 22px',display:'flex',alignItems:'center',gap:10,flexShrink:0 }}>
            <span style={{ color:'#059669',display:'flex' }}>{IC.check}</span>
            <span style={{ fontSize:'.82rem',fontWeight:700,color:'#065F46' }}>
              Certifié ✓ · Validé le {fmt(passage.dateValidationChef)} par {passage.chefValidateurNom || 'le chef de service'}
            </span>
            {passage.scoreTheoriquePct != null && (
              <span style={{ marginLeft:'auto',fontSize:'.72rem',color:'#059669',fontWeight:600 }}>
                Théo : {passage.scoreTheoriquePct}% · Prat : {passage.scorePratique != null ? Math.round(passage.scorePratique) : '—'}%
              </span>
            )}
          </div>
        )}

        {/* Contenu PDF */}
        <div style={{ flex:1,overflow:'hidden',minHeight:0 }}>
          {loading ? (
            <div style={{ display:'flex',alignItems:'center',justifyContent:'center',height:400,gap:12,color:'#94A3B8',flexDirection:'column' }}>
              <SpinnerDark/>
              <span style={{ fontSize:'.85rem' }}>Chargement du certificat…</span>
            </div>
          ) : error ? (
            <div style={{ display:'flex',alignItems:'center',justifyContent:'center',height:300,flexDirection:'column',gap:14,padding:'2rem' }}>
              <div style={{ fontSize:'2rem' }}>⚠️</div>
              <p style={{ color:'#DC2626',fontWeight:600,fontSize:'.88rem',textAlign:'center',margin:0 }}>{error}</p>
              <button onClick={handleExporter} disabled={dlLoading}
                style={{ display:'flex',alignItems:'center',gap:7,padding:'10px 20px',background:'#0B1E3D',color:'#fff',border:'none',borderRadius:10,cursor:'pointer',fontSize:'.88rem',fontWeight:700,fontFamily:'inherit' }}>
                {dlLoading ? <><Spinner/> Export…</> : <>{IC.download} Exporter le PDF</>}
              </button>
            </div>
          ) : pdfUrl ? (
            <iframe
              src={pdfUrl + '#toolbar=1&navpanes=0&scrollbar=1'}
              style={{ width:'100%',height:'100%',border:'none',display:'block',minHeight:500 }}
              title="Certificat de qualification"
            />
          ) : null}
        </div>

        {/* Footer */}
        <div style={{ padding:'12px 22px',borderTop:'1px solid #E2E8F0',display:'flex',alignItems:'center',justifyContent:'space-between',flexShrink:0,background:'#F8FAFC' }}>
          <span style={{ fontSize:'.72rem',color:'#94A3B8' }}>
            Fichier : {passage.certificatPdfPath || 'certificat_qualification.pdf'}
          </span>
          <div style={{ display:'flex',gap:8 }}>
            {isCertifie && (
              <button onClick={handleExporter} disabled={dlLoading}
                style={{ display:'flex',alignItems:'center',gap:6,padding:'8px 16px',background:'#059669',color:'#fff',border:'none',borderRadius:9,cursor:'pointer',fontSize:'.82rem',fontWeight:700,fontFamily:'inherit',boxShadow:'0 2px 8px rgba(5,150,105,.25)' }}>
                {dlLoading ? <><Spinner/> Export…</> : <>{IC.download} Exporter certificat</>}
              </button>
            )}
            <button onClick={onClose}
              style={{ padding:'8px 16px',background:'#fff',color:'#374151',border:'1.5px solid #E2E8F0',borderRadius:9,cursor:'pointer',fontSize:'.82rem',fontWeight:700,fontFamily:'inherit' }}>
              Fermer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   COMPOSANT PRINCIPAL AuditeurQualifications
═══════════════════════════════════════════════════════════════════ */
export default function AuditeurQualifications() {
  const navigate = useNavigate();
  const [passages,       setPassages]       = useState([]);
  const [enCours,        setEnCours]        = useState(null);
  const [loading,        setLoading]        = useState(true);
  const [filter,         setFilter]         = useState('TOUS');
  const [dlId,           setDlId]           = useState(null);   // export en cours
  const [showChoix,      setShowChoix]      = useState(false);
  const [nbDisponibles,  setNbDisponibles]  = useState(0);
  const [showResume,     setShowResume]     = useState(false);
  // ── NOUVEAU : modal voir certificat ──
  const [voirCertifTarget, setVoirCertifTarget] = useState(null);
  const [qrTarget, setQrTarget] = useState(null);   // ← AJOUTER

  const load = useCallback(async () => {
    setLoading(true);
    const [hist, ec, dispo] = await Promise.allSettled([
      auditeurCertifAPI.getHistorique(),
      auditeurCertifAPI.getEnCours(),
      auditeurCertifAPI.getCertificationsDisponibles(),
    ]);
    if (hist.status  === 'fulfilled') setPassages(hist.value.data || []);
    if (ec.status    === 'fulfilled') setEnCours(ec.value.data);
    if (dispo.status === 'fulfilled') setNbDisponibles((dispo.value.data || []).length);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  // ── Exporter le certificat (téléchargement) ─────────────────────
  const handleExporter = async (p) => {
    setDlId(p.id);
    try {
      const r = await auditeurCertifAPI.exporterCertificat(p.id);
      const url = window.URL.createObjectURL(new Blob([r.data], { type: 'application/pdf' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `certificat_${p.certificationTitre || p.id}.pdf`;
      document.body.appendChild(a); a.click(); a.remove();
      window.URL.revokeObjectURL(url);
    } catch { alert('Certificat non disponible.'); }
    setDlId(null);
  };

  const isEnCours = enCours && STATUTS_EN_COURS.includes(enCours.statut);
  const isBloque  = enCours?.statut === 'BLOQUE';

  const lancerExamen = () => {
    if (isEnCours) { setShowResume(true); }
    else           { setShowChoix(true); }
  };

  const onQualifChoisie = (meta) => {
    setShowChoix(false);
    navigate('/auditeur/certif/examen', {
      state: {
        certificationId:    meta.certificationId,
        certificationTitre: meta.titre,
        formationUrl:       meta.formationUrl  || null,
        formationNom:       meta.formationNom  || null,
      },
    });
  };

  const reprendrePassage = () => {
    setShowResume(false);
    navigate('/auditeur/certif/examen');
  };

  // Passage qualifié = CERTIFIE ou (RAPPORT_VALIDE + VALIDE_CHEF)
  const estQualifie = (p) =>
    p.statut === 'CERTIFIE' ||
    (p.statut === 'RAPPORT_VALIDE' && p.statutCertificat === 'VALIDE_CHEF');

  const filtered = passages.filter(p => {
    if (filter === 'ATTENTE') return p.statut === 'EN_ATTENTE';
    if (filter === 'COURS')  return STATUTS_EN_COURS.includes(p.statut);
    if (filter === 'VALIDATION') return p.statut === 'PRATIQUE_EN_COURS' && p.rapportPratiqueJson;
    if (filter === 'RAPPORT_VALIDE') return p.statut === 'RAPPORT_VALIDE' && (!p.statutCertificat || p.statutCertificat === 'NON_GENERE' || p.statutCertificat === 'GENERE');
    if (filter === 'ATTENTE_CHEF') return p.statutCertificat === 'EN_ATTENTE_CHEF';
    if (filter === 'REUSSI') return estQualifie(p);
    if (filter === 'ECHOUE') return p.statut?.includes('ECHOUE');
    if (filter === 'BLOQUE') return p.statut === 'BLOQUE';
    if (filter === 'ANNULE') return p.statut === 'ANNULE';
    return true;
  });

  const btnLabel = isEnCours
    ? <>{IC.resume} Continuer le passage</>
    : <>{IC.play} Passer l'examen</>;
  const btnBg = isEnCours ? 'linear-gradient(135deg,#1D4ED8,#2563EB)' : '#0B1E3D';

  return (
    <div style={{ fontFamily:"'Inter','DM Sans',sans-serif",display:'flex',flexDirection:'column',gap:'1.25rem' }}>
      <style>{`
        @keyframes up   { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:none} }
        @keyframes fadeIn { from{opacity:0} to{opacity:1} }
        @keyframes popIn  { from{opacity:0;transform:scale(.94)} to{opacity:1;transform:scale(1)} }
        @keyframes spin { to{transform:rotate(360deg)} }
        .qrow { transition: background .15s ease; }
        .qrow:hover { background: #F8FAFC; }
        .qfil { transition: all .14s; cursor: pointer; border: none; font-family: inherit; }
        .qfil:hover { background: #EEF2F8 !important; }
        .qfil.on { background: #0B1E3D !important; color: #fff !important; border-color: #0B1E3D !important; }
      `}</style>

      {/* ── HEADER ── */}
      <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',gap:16 }}>
        <div style={{ display:'flex',alignItems:'center',gap:12 }}>
          <div style={{ width:44,height:44,borderRadius:12,background:'#0B1E3D',color:'#fff',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 }}>
            {IC.shield}
          </div>
          <div>
            <h1 style={{ margin:0,fontWeight:800,fontSize:'1.25rem',color:'#0B1E3D',lineHeight:1.2 }}>
              Mes Qualifications
            </h1>
            <p style={{ margin:0,fontSize:'.78rem',color:'#9CA3AF',marginTop:3 }}>
              {passages.length} passage{passages.length!==1?'s':''} · {passages.filter(estQualifie).length} qualifié{passages.filter(estQualifie).length!==1?'s':''}
            </p>
          </div>
        </div>
        {!isBloque && (isEnCours || nbDisponibles > 0) && (
          <button onClick={lancerExamen}
            style={{ display:'flex',alignItems:'center',gap:7,background:btnBg,border:'none',borderRadius:10,padding:'10px 20px',color:'#fff',fontWeight:700,fontSize:'.88rem',cursor:'pointer',fontFamily:'inherit',boxShadow:'0 2px 10px rgba(11,30,61,.2)' }}>
            {btnLabel} {IC.arrow}
          </button>
        )}
      </div>

      {/* ── BANDEAU EN COURS ── */}
      {isEnCours && enCours && (
        <div style={{ background:'linear-gradient(135deg,#0B1E3D,#1D4ED8)',borderRadius:14,padding:'1.1rem 1.5rem',display:'flex',alignItems:'center',justifyContent:'space-between',gap:16,boxShadow:'0 4px 16px rgba(11,30,61,.2)',animation:'up .3s ease' }}>
          <div style={{ display:'flex',alignItems:'center',gap:12 }}>
            <div style={{ width:38,height:38,borderRadius:10,background:'rgba(255,255,255,.12)',display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',flexShrink:0 }}>
              {enCours.statut==='FORMATION_OBLIGATOIRE'?IC.book:IC.clock}
            </div>
            <div>
              <p style={{ margin:0,fontSize:'.67rem',fontWeight:700,color:'rgba(255,255,255,.5)',textTransform:'uppercase',letterSpacing:'.1em',marginBottom:3 }}>
                {getEtapeLabel(enCours.statut)} en cours
              </p>
              <p style={{ margin:0,fontWeight:800,fontSize:'1rem',color:'#fff' }}>
                {enCours.certificationNom||enCours.certificationTitre||'Qualification en cours'}
              </p>
            </div>
          </div>
          <button onClick={() => setShowResume(true)}
            style={{ display:'flex',alignItems:'center',gap:7,background:'rgba(255,255,255,.12)',border:'1px solid rgba(255,255,255,.2)',borderRadius:10,padding:'9px 18px',color:'#fff',fontWeight:700,fontSize:'.86rem',cursor:'pointer',fontFamily:'inherit',flexShrink:0 }}>
            {IC.resume} Reprendre {IC.arrow}
          </button>
        </div>
      )}

      {/* ── BLOQUÉ ── */}
      {isBloque && enCours && (
        <div style={{ background:'#F9FAFB',border:'1.5px solid #E5E7EB',borderRadius:12,padding:'1rem 1.25rem',display:'flex',alignItems:'center',gap:12 }}>
          <div style={{ width:38,height:38,borderRadius:9,background:'#F3F4F6',color:'#9CA3AF',display:'flex',alignItems:'center',justifyContent:'center' }}>{IC.lock}</div>
          <div>
            <p style={{ margin:0,fontWeight:700,fontSize:'.88rem',color:'#1A2F50' }}>Accès bloqué</p>
            <p style={{ margin:'2px 0 0',fontSize:'.76rem',color:'#9CA3AF' }}>
              {enCours.certificationNom||'Qualification'} · {enCours.dateDeblocage?`Déblocage le ${fmt(enCours.dateDeblocage)}`:'Blocage 6 mois'}
            </p>
          </div>
        </div>
      )}

      {/* ── FILTRES ── */}
      <div style={{ display:'flex',gap:6,flexWrap:'wrap' }}>
        {FILTERS.map(f => {
          const cnt = passages.filter(p => {
            if (f.k==='ATTENTE') return p.statut === 'EN_ATTENTE';
            if (f.k==='COURS')  return STATUTS_EN_COURS.includes(p.statut);
            if (f.k==='VALIDATION') return p.statut === 'PRATIQUE_EN_COURS' && p.rapportPratiqueJson;
            if (f.k==='RAPPORT_VALIDE') return p.statut === 'RAPPORT_VALIDE' && (!p.statutCertificat || p.statutCertificat === 'NON_GENERE' || p.statutCertificat === 'GENERE');
            if (f.k==='ATTENTE_CHEF') return p.statutCertificat === 'EN_ATTENTE_CHEF';
            if (f.k==='REUSSI') return estQualifie(p);
            if (f.k==='ECHOUE') return p.statut?.includes('ECHOUE');
            if (f.k==='BLOQUE') return p.statut==='BLOQUE';
            if (f.k==='ANNULE') return p.statut==='ANNULE';
            
            return true;
          }).length;
          return (
            <button key={f.k} className={`qfil ${filter===f.k?'on':''}`} onClick={() => setFilter(f.k)}
              style={{ padding:'6px 15px',borderRadius:8,background:'#fff',color:'#64748B',fontSize:'.8rem',fontWeight:700,border:'1.5px solid #E2E8F0' }}>
              {f.l}
              {cnt>0 && (
                <span style={{ marginLeft:5,background:filter===f.k?'rgba(255,255,255,.2)':'#F1F5F9',padding:'1px 7px',borderRadius:99,fontSize:'.7rem' }}>{cnt}</span>
              )}
            </button>
            
          );
          
        })}
      </div>

      {/* ── LISTE PASSAGES ── */}
      {loading ? (
        <div style={{ display:'flex',alignItems:'center',justifyContent:'center',height:200,gap:10,color:'#94A3B8' }}>
          <SpinnerDark/> Chargement…
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign:'center',padding:'3rem 1rem',background:'#fff',borderRadius:14,border:'1.5px dashed #E2E8F0' }}>
          <div style={{ width:52,height:52,borderRadius:14,background:'#F1F5F9',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 12px',color:'#94A3B8' }}>{IC.info}</div>
          <p style={{ fontWeight:700,color:'#374151',margin:'0 0 6px' }}>Aucun résultat</p>
          <p style={{ fontSize:'.84rem',color:'#94A3B8',margin:'0 0 1.25rem' }}>
            {filter==='TOUS'?'Passez votre premier examen pour voir vos résultats ici.':'Aucune qualification dans ce filtre.'}
          </p>
          {filter==='TOUS' && !isBloque && (isEnCours||nbDisponibles>0) && (
            <button onClick={lancerExamen}
              style={{ display:'inline-flex',alignItems:'center',gap:7,background:'#0B1E3D',border:'none',borderRadius:10,padding:'10px 22px',color:'#fff',fontWeight:700,fontSize:'.88rem',cursor:'pointer',fontFamily:'inherit' }}>
              {isEnCours?<>{IC.resume} Continuer le passage</>:<>{IC.play} Passer l'examen</>}
            </button>
          )}
        </div>
      ) : (
        <div style={{ background:'#fff',borderRadius:14,border:'1px solid #E2E8F0',overflow:'hidden',boxShadow:'0 2px 8px rgba(0,0,0,.04)' }}>
          {filtered.map((p, idx) => {
            const st    = ST[p.statut] || { label:p.statut, color:'#6B7280', bg:'#F9FAFB' };
            const isOk  = estQualifie(p);
            const isAct = STATUTS_EN_COURS.includes(p.statut);
            const spPct = p.scoreTheoriquePct ?? (p.scoreTheorique!=null ? Math.round(p.scoreTheorique*100/20) : null);
            const seuil = p.seuilTheorique || 70;

            return (
              <div key={p.id} className="qrow"
                style={{ display:'flex',alignItems:'center',gap:16,padding:'16px 20px',borderBottom:idx<filtered.length-1?'1px solid #CBD5E1':'none',animation:`up .3s ${idx*.04}s ease both` }}>

                {/* Icône statut */}
                <div style={{ width:44,height:44,borderRadius:12,flexShrink:0,background:isOk?'#d5efe3':isAct?'#ced8e6':p.statut==='BLOQUE'?'#e4cfcf':'#d8dee3',color:isOk?'#059669':isAct?'#2563EB':p.statut==='BLOQUE'?'#DC2626':'#9CA3AF',display:'flex',alignItems:'center',justifyContent:'center',border:`1px solid ${isOk?'#A7F3D0':isAct?'#BFDBFE':p.statut==='BLOQUE'?'#FECACA':'#E2E8F0'}` }}>
                  {isOk?IC.trophy:isAct?IC.inprog:p.statut==='BLOQUE'?IC.bloque:IC.lock}
                </div>

                {/* Contenu */}
                <div style={{ flex:1,minWidth:0 }}>
                  <div style={{ display:'flex',alignItems:'center',gap:8,marginBottom:7,flexWrap:'wrap' }}>
                    <p style={{ margin:0,fontWeight:700,fontSize:'.9rem',color:'#0B1E3D',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis' }}>
                      {p.certificationTitre||p.certificationNom||'Qualification'}
                    </p>
                    <span style={{ background:st.bg,color:st.color,fontSize:'.7rem',fontWeight:600,padding:'3px 10px',borderRadius:99,flexShrink:0,border:st.border?`1px solid ${st.border}`:'none',letterSpacing:'.01em',boxShadow:'0 1px 2px rgba(0,0,0,.03)' }}>
                      {st.label}
                    </span>
                    {/* Badge statut certificat */}
                    {p.statutCertificat === 'EN_ATTENTE_CHEF' && (
                      <span style={{ background:'#FEF3C7',color:'#ac5c01',fontSize:'.7rem',fontWeight:600,padding:'3px 10px',borderRadius:99,border:'1px solid #f2ce3f',letterSpacing:'.01em',boxShadow:'0 1px 2px rgba(0,0,0,.03)' }}>
                         En attente validation
                      </span>
                    )}
                  </div>

                  <div style={{ display:'flex',alignItems:'center',gap:7,flexWrap:'wrap' }}>
                    {spPct != null && (
                      <ScoreBadge icon={IC.theo} label="Théo :" value={spPct} seuil={seuil} />
                    )}
                    {p.scorePratique != null && (
                      <ScoreBadge icon={IC.prat} label="Pratique :" value={p.scorePratique} seuil={p.seuilPratique||70} />
                    )}
                    {(p.datePassage||p.dateDebut) && (
                      <span style={{ display:'flex',alignItems:'center',gap:4,fontSize:'.72rem',color:'#94A3B8' }}>
                        {IC.cal} {fmt(p.datePassage||p.dateDebut)}
                      </span>
                    )}
                    {isOk && p.dateExpiration && (
                      <span style={{ display:'flex',alignItems:'center',gap:4,fontSize:'.72rem',color:'#D97706',fontWeight:600 }}>
                        {IC.cal} Expire : {fmt(p.dateExpiration)}
                      </span>
                    )}
                    {p.statut==='BLOQUE' && p.dateDeblocage && (
                      <span style={{ fontSize:'.72rem',color:'#9CA3AF',fontWeight:600 }}>
                        Déblocage : {fmt(p.dateDeblocage)}
                      </span>
                    )}
                  </div>
                </div>

                {/* ── BOUTONS CERTIFICAT (remplacent l'ancien bouton PDF) ── */}
                <div style={{ flexShrink:0,display:'flex',gap:7 }}>
                  {isOk && (
                    <>
                      {/* Bouton VOIR CERTIFICAT */}
                      <button onClick={() => setVoirCertifTarget(p)}
                        style={{ display:'flex',alignItems:'center',gap:6,background:'#EFF6FF',color:'#2563EB',border:'1px solid #a1bdde',borderRadius:9,padding:'7px 13px',fontSize:'.82rem',fontWeight:700,cursor:'pointer',fontFamily:'inherit',transition:'all .14s',whiteSpace:'nowrap' }}
                        onMouseEnter={e => { e.currentTarget.style.background='#DBEAFE'; e.currentTarget.style.transform='translateY(-1px)'; }}
                        onMouseLeave={e => { e.currentTarget.style.background='#EFF6FF'; e.currentTarget.style.transform='none'; }}>
                        {IC.eye} Voir certificat
                      </button>

                      {/* Bouton EXPORTER CERTIFICAT */}
                      <button onClick={() => handleExporter(p)} disabled={dlId===p.id}
                        style={{ display:'flex',alignItems:'center',gap:6,background:'#059669',color:'#fff',border:'none',borderRadius:9,padding:'7px 13px',fontSize:'.82rem',fontWeight:700,cursor:dlId===p.id?'not-allowed':'pointer',fontFamily:'inherit',transition:'all .14s',opacity:dlId===p.id?.7:1,whiteSpace:'nowrap',boxShadow:'0 2px 8px rgba(5,150,105,.2)' }}
                        onMouseEnter={e => { if(dlId!==p.id){ e.currentTarget.style.background='#047857'; e.currentTarget.style.transform='translateY(-1px)'; }}}
                        onMouseLeave={e => { e.currentTarget.style.background='#059669'; e.currentTarget.style.transform='none'; }}>
                        {dlId===p.id
                          ? <><span style={{ width:12,height:12,border:'2px solid rgba(255,255,255,.3)',borderTopColor:'#fff',borderRadius:'50%',display:'inline-block',animation:'spin .7s linear infinite' }}/> Export…</>
                          : <>{IC.download} Exporter</>}
                      </button>
                      {/* Bouton QR Code */}
<button
  onClick={() => {
    console.log('p =', JSON.stringify(p));
    setQrTarget(p);
  }}
  style={{
    display:'flex', alignItems:'center', gap:6,
    background:'#F5F3FF', color:'#7C3AED',
    border:'1px solid #beb4e8', borderRadius:9,
    padding:'7px 13px', fontSize:'.82rem',
    fontWeight:700, cursor:'pointer', fontFamily:'inherit',
    transition:'all .14s', whiteSpace:'nowrap',
  }}
  onMouseEnter={e => { e.currentTarget.style.background='#EDE9FE'; e.currentTarget.style.transform='translateY(-1px)'; }}
  onMouseLeave={e => { e.currentTarget.style.background='#F5F3FF'; e.currentTarget.style.transform='none'; }}>
  QR Code
</button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Modal Voir Certificat ── */}
      {voirCertifTarget && (
        <ModalVoirCertificat
          passage={voirCertifTarget}
          onClose={() => setVoirCertifTarget(null)}
        />
      )}
       {/* ── Modal QR Code ── */}
{qrTarget && (
 <ModalQrCode
  passageId={qrTarget.id}   // ✅ c'est bien l'id=26
  certificationId={qrTarget.certificationId}
  auditeurNom={qrTarget.auditeurNom || 'Auditeur'}
  certificationTitre={qrTarget.certificationTitre}
  onClose={() => setQrTarget(null)}
/>
)}
      {/* ── Modal Reprendre ── */}
      {showResume && enCours && (
        <div style={{ position:'fixed',inset:0,background:'rgba(0,0,0,.5)',zIndex:1200,display:'flex',alignItems:'center',justifyContent:'center',backdropFilter:'blur(4px)' }}
          onClick={e => e.target===e.currentTarget && setShowResume(false)}>
          <div style={{ background:'#fff',borderRadius:20,width:'100%',maxWidth:460,overflow:'hidden',boxShadow:'0 32px 80px rgba(0,0,0,.22)',animation:'up .2s ease' }}>
            <div style={{ background:'linear-gradient(135deg,#0B1E3D,#1D4ED8)',padding:'18px 22px',display:'flex',alignItems:'center',justifyContent:'space-between' }}>
              <div style={{ display:'flex',alignItems:'center',gap:10 }}>
                <div style={{ width:36,height:36,borderRadius:9,background:'rgba(255,255,255,.15)',display:'flex',alignItems:'center',justifyContent:'center',color:'#fff' }}>{IC.resume}</div>
                <div>
                  <div style={{ fontWeight:800,color:'#fff',fontSize:'.95rem' }}>Reprendre votre passage</div>
                  <div style={{ fontSize:'.72rem',color:'rgba(255,255,255,.55)',marginTop:2 }}>Continuez là où vous vous étiez arrêté</div>
                </div>
              </div>
              <button onClick={() => setShowResume(false)}
                style={{ width:30,height:30,borderRadius:8,background:'rgba(255,255,255,.12)',border:'none',cursor:'pointer',color:'#fff',display:'flex',alignItems:'center',justifyContent:'center' }}>
                {IC.x}
              </button>
            </div>
            <div style={{ padding:'22px 24px' }}>
              <div style={{ background:'#F8FAFC',borderRadius:12,padding:'14px 16px',marginBottom:18,border:'1px solid #E2E8F0' }}>
                <div style={{ fontSize:'.62rem',fontWeight:700,color:'#94A3B8',textTransform:'uppercase',letterSpacing:'.08em',marginBottom:4 }}>Qualification</div>
                <div style={{ fontWeight:800,fontSize:'1rem',color:'#0B1E3D' }}>
                  {enCours.certificationNom||enCours.certificationTitre||'Qualification en cours'}
                </div>
              </div>
              <div style={{ background:'#EFF6FF',border:'1px solid #BFDBFE',borderRadius:10,padding:'10px 14px',marginBottom:18,display:'flex',alignItems:'center',gap:10 }}>
                <div style={{ width:8,height:8,borderRadius:'50%',background:'#2563EB',flexShrink:0,boxShadow:'0 0 0 3px rgba(37,99,235,.2)' }}/>
                <div style={{ fontSize:'.82rem',fontWeight:700,color:'#1E40AF' }}>
                  Étape actuelle : <strong>{getEtapeLabel(enCours.statut)}</strong>
                </div>
              </div>
              <button onClick={reprendrePassage}
                style={{ width:'100%',padding:'13px',borderRadius:12,border:'none',background:'linear-gradient(135deg,#0B1E3D,#1D4ED8)',color:'#fff',fontWeight:800,fontSize:'.92rem',cursor:'pointer',fontFamily:'inherit',display:'flex',alignItems:'center',justifyContent:'center',gap:8,boxShadow:'0 4px 16px rgba(11,30,61,.25)' }}>
                {IC.resume} Continuer l'examen {IC.arrow}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal choix qualification ── */}
      {showChoix && (
        <ChoixQualification onSelect={onQualifChoisie} onClose={() => setShowChoix(false)} />
      )}
    </div>
  );
}
