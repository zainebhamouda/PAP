import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { chefQualifAPI } from '../../services/certifAPI';
import api from '../../services/api';
import ModalQrCode from '../../components/certif/ModalQrCode';
import ModalReponsesTheoriques from '../../components/certif/ModalReponsesTheoriques';
/* ─── Icons (même style que AuditeurQualifications) ─── */
const Ico = {
  shield:  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  check:   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>,
  x:       <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  eye:     <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>,
  dl:      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>,
  warn:    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
  clock:   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  lock:    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>,
  trophy:  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><polyline points="8 21 12 17 16 21"/><line x1="12" y1="17" x2="12" y2="11"/><path d="M7 4H17a2 2 0 0 1 2 2v1a6 6 0 0 1-6 6 6 6 0 0 1-6-6V6a2 2 0 0 1 2-2z"/></svg>,
  pdf:     <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>,
  filter:  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>,
  bell:    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>,
  theo:    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>,
  prat:    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>,
  inprog:  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  bloque:  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>,
  arrow:   <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>,
  cal:     <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
};

/* ─── Même palette que AuditeurQualifications ─── */
const ST = {
  EN_ATTENTE:            { label:'Non commencé',  color:'#1D4ED8', bg:'#DBEAFE', border:'#afcdf1' },
  FORMATION_OBLIGATOIRE: { label:'Formation',      color:'#6D28D9', bg:'#F3E8FF', border:'#d3bbed' },
  THEORIQUE_EN_COURS:    { label:'Théorique',      color:'#0369A1', bg:'#d0e0eb', border:'#add6ec' },
  THEORIQUE_ECHOUE:      { label:'Échoué théo.',   color:'#B91C1C', bg:'#f9d4d4', border:'#eca9a9' },
  PRATIQUE_EN_COURS:     { label:'Pratique',       color:'#4338CA', bg:'#EDE9FE', border:'#c0b5f3' },
  PRATIQUE_ECHOUE:       { label:'Échoué prat.',   color:'#991B1B', bg:'#FECACA', border:'#f29c9c' },
  RAPPORT_VALIDE:        { label:'Rapport validé', color:'#BE185D', bg:'#f0dce8', border:'#f6bbdb' },
  CERTIFIE:              { label:'Qualifié ✓',     color:'#15803D', bg:'#cdf8dc', border:'#BBF7D0' },
  BLOQUE:                { label:'Bloqué',         color:'#C2410C', bg:'#ffdfd5', border:'#feabaa' },
  ANNULE:                { label:'Annulé',         color:'#475569', bg:'#d8dfe5', border:'#b0c6e2' },
};

const STATUT_CERTIF_MAP = {
  NON_GENERE:      { label: null },
  GENERE:          { label:'Certif. généré',     color:'#1D4ED8', bg:'#DBEAFE', border:'#afcdf1' },
  EN_ATTENTE_CHEF: { label:'En attente de moi',  color:'#C8982A', bg:'#FEF3C7', border:'#FDE68A' },
  VALIDE_CHEF:     { label:'Validé par moi ✓',   color:'#15803D', bg:'#cdf8dc', border:'#BBF7D0' },
  INVALIDE_CHEF:   { label:'Invalidé ✗',         color:'#B91C1C', bg:'#f9d4d4', border:'#eca9a9' },
};

const TABS = [
  { key:'tous',           label:'Tous' },
  { key:'en_cours',       label:'En cours' },
  { key:'certif_attente', label:'Certif. à valider' },
  { key:'certifies',      label:'Qualifiés' },
  { key:'bloques',        label:'Bloqués' },
  { key:'historique',     label:'Historique certif.' },
];

const STATUTS_EN_COURS = ['FORMATION_OBLIGATOIRE','THEORIQUE_EN_COURS','PRATIQUE_EN_COURS'];

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

function ScoreBadge({ icon, label, value, seuil }) {
  return (
    <span style={{ display:'inline-flex',alignItems:'center',gap:5,background:'#F8FAFC',borderRadius:8,padding:'3px 11px',fontSize:'.73rem',fontWeight:700,color:'#64748B' }}>
      <span style={{ opacity:.6,display:'flex',alignItems:'center',color:'#94A3B8' }}>{icon}</span>
      {label} <strong>{Math.round(value)}%</strong>
      <span style={{ opacity:.55,fontWeight:500 }}>/ {seuil}%</span>
    </span>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   MODAL VALIDATION CERTIFICAT
═══════════════════════════════════════════════════════════════════ */
function ModalValidation({ passage, onClose, onDecision }) {
  const [commentaire, setCommentaire] = useState('');
  const [confirmer, setConfirmer]     = useState(false);
  const [saving, setSaving]           = useState(false);
  const [err, setErr]                 = useState('');
  const [pdfBlobUrl, setPdfBlobUrl]   = useState(null);
  const [loadingPdf, setLoadingPdf]   = useState(false);
  const [pdfRapportUrl, setPdfRapportUrl] = useState(null);
 
  // ── NOUVEAU : onglets ──
  const [activeTab, setActiveTab] = useState('certificat'); // 'certificat' | 'theorique' | 'pratique'
 
  if (!passage) return null;
 
  // Charger le PDF certificat quand on arrive sur l'onglet certificat
  useEffect(() => {
    if (activeTab !== 'certificat') return;
    setLoadingPdf(true);
    api.get(`/chef-service/qualifications/${passage.id}/certificat/view`, { responseType: 'blob' })
      .then(r => { setPdfBlobUrl(window.URL.createObjectURL(r.data)); })
      .catch(() => setPdfBlobUrl(null))
      .finally(() => setLoadingPdf(false));
    return () => { if (pdfBlobUrl) window.URL.revokeObjectURL(pdfBlobUrl); };
  }, [activeTab, passage.id]);
 
  // Charger l'URL du rapport pratique quand on passe sur cet onglet
  useEffect(() => {
    if (activeTab !== 'pratique') return;
    const baseUrl = (import.meta.env?.VITE_API_URL || 'http://localhost:8080/api').replace('/api', '');
    if (passage.rapportPdfNom) {
      setPdfRapportUrl(`${baseUrl}/uploads/rapports-pratiques/${passage.rapportPdfNom}`);
    }
  }, [activeTab, passage.rapportPdfNom]);
 
  const handleDecision = async (valide) => {
    if (!valide && !confirmer) { setConfirmer(true); return; }
    setSaving(true); setErr('');
    try {
      await chefQualifAPI.validerCertificat(passage.id, valide, commentaire);
      onDecision(valide);
      onClose();
    } catch (e) { setErr(e.response?.data?.message || 'Erreur lors de la validation.'); }
    setSaving(false);
  };
 
  const handleDownload = async () => {
    try {
      const r = await api.get(`/chef-service/qualifications/${passage.id}/certificat/download`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(r.data);
      const a = document.createElement('a');
      a.href = url; a.download = `certificat_${passage.auditeurNom || passage.id}.pdf`;
      document.body.appendChild(a); a.click(); a.remove();
      window.URL.revokeObjectURL(url);
    } catch {}
  };
 
  const theoPct = passage.scoreTheoriquePct ?? null;
  const pratPct = passage.scorePratique != null ? Math.round(passage.scorePratique) : null;
 
  const TABS = [
    { key: 'certificat', label: '🎓 Certificat',         desc: 'Valider ou invalider' },
    { key: 'theorique',  label: '📋 Test théorique',     desc: 'Réponses auditeur' },
    { key: 'pratique',   label: '📄 Rapport pratique',   desc: 'PDF envoyé' },
  ];
 
  return (
    <div style={{ position:'fixed',inset:0,background:'rgba(0,0,0,.55)',zIndex:9999,display:'flex',alignItems:'center',justifyContent:'center',backdropFilter:'blur(4px)',animation:'fadeIn .18s ease',padding:'1rem' }}
      onClick={e => e.target===e.currentTarget && !saving && onClose()}>
      <div style={{ background:'#fff',borderRadius:20,width:'100%',maxWidth:700,maxHeight:'92vh',overflowY:'auto',boxShadow:'0 32px 80px rgba(0,0,0,.22)',animation:'popIn .2s ease',display:'flex',flexDirection:'column' }}>
 
        {/* Header */}
        <div style={{ background:'linear-gradient(135deg,#0B1E3D,#059669)',borderRadius:'20px 20px 0 0',padding:'18px 22px',display:'flex',alignItems:'center',justifyContent:'space-between',flexShrink:0 }}>
          <div style={{ display:'flex',alignItems:'center',gap:12 }}>
            <div style={{ width:40,height:40,borderRadius:11,background:'rgba(255,255,255,.15)',display:'flex',alignItems:'center',justifyContent:'center',color:'#fff' }}>
              {Ico.shield}
            </div>
            <div>
              <div style={{ fontWeight:800,color:'#fff',fontSize:'1rem' }}>Validation du Certificat</div>
              <div style={{ fontSize:'.72rem',color:'rgba(255,255,255,.55)',marginTop:2 }}>
                {passage.certificationTitre} · {passage.expertGenerateurNom || 'Expert'}
              </div>
            </div>
          </div>
          <button onClick={onClose} disabled={saving}
            style={{ width:30,height:30,borderRadius:8,background:'rgba(255,255,255,.12)',border:'none',cursor:'pointer',color:'#fff',display:'flex',alignItems:'center',justifyContent:'center' }}>
            {Ico.x}
          </button>
        </div>
 
        {/* ── NOUVEAU : onglets de navigation ── */}
        <div style={{ display:'flex', gap:4, padding:'10px 16px', borderBottom:'1px solid #E2E8F0', background:'#F8FAFC', flexShrink:0 }}>
          {TABS.map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              style={{ flex:1, padding:'8px 6px', borderRadius:9, border: activeTab === tab.key ? '1.5px solid #0B1E3D' : '1px solid #E2E8F0', background: activeTab === tab.key ? '#0B1E3D' : '#fff', color: activeTab === tab.key ? '#fff' : '#64748B', fontSize:'.78rem', fontWeight:700, cursor:'pointer', fontFamily:'inherit', textAlign:'center' }}>
              {tab.label}
            </button>
          ))}
        </div>
 
        {/* ══ ONGLET : RÉPONSES THÉORIQUES ══ */}
        {activeTab === 'theorique' && (
          <div style={{ flex:1, display:'flex', flexDirection:'column', minHeight:500 }}>
            <ModalReponsesTheoriques
              passageId={passage.id}
              auditeurNom={passage.auditeurNom}
              role="chef"
              onClose={() => setActiveTab('certificat')}
              inline={true}
            />
          </div>
        )}
 
        {/* ══ ONGLET : RAPPORT PRATIQUE ══ */}
        {activeTab === 'pratique' && (
          <div style={{ flex:1, padding:'1rem', display:'flex', flexDirection:'column', gap:10, minHeight:400 }}>
            <div style={{ fontSize:'.82rem', fontWeight:700, color:'#374151', display:'flex', alignItems:'center', gap:6 }}>
              📄 Rapport pratique de {passage.auditeurNom}
            </div>
            {pdfRapportUrl ? (
              <>
                <iframe
                  src={`${pdfRapportUrl}#toolbar=1`}
                  style={{ flex:1, minHeight:380, border:'none', borderRadius:10, width:'100%', display:'block' }}
                  title="Rapport pratique"
                />
                <div style={{ display:'flex', gap:8 }}>
                  <a href={pdfRapportUrl} target="_blank" rel="noopener noreferrer"
                    style={{ display:'inline-flex',alignItems:'center',gap:6,padding:'8px 16px',background:'#0B1E3D',color:'#fff',borderRadius:9,textDecoration:'none',fontSize:'.8rem',fontWeight:700 }}>
                    ↗ Ouvrir dans un nouvel onglet
                  </a>
                  <a href={pdfRapportUrl} download
                    style={{ display:'inline-flex',alignItems:'center',gap:6,padding:'8px 16px',background:'#EFF6FF',color:'#2563EB',border:'1px solid #BFDBFE',borderRadius:9,textDecoration:'none',fontSize:'.8rem',fontWeight:700 }}>
                    ⬇ Télécharger
                  </a>
                </div>
              </>
            ) : (
              <div style={{ textAlign:'center',padding:'3rem',color:'#94A3B8',fontSize:'.84rem' }}>
                Aucun rapport PDF disponible pour ce passage.
              </div>
            )}
          </div>
        )}
 
        {/* ══ ONGLET : CERTIFICAT (logique originale inchangée) ══ */}
        {activeTab === 'certificat' && (
          <div style={{ padding:'1.5rem',display:'flex',flexDirection:'column',gap:'1rem' }}>
 
            {/* Infos auditeur */}
            <div style={{ background:'#F8FAFC',borderRadius:12,padding:'14px 16px',border:'1px solid #E2E8F0',display:'flex',alignItems:'center',gap:14 }}>
              <div style={{ width:46,height:46,borderRadius:12,background:'#0B1E3D',color:'#fff',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:800,fontSize:'1.1rem',flexShrink:0 }}>
                {(passage.auditeurNom||'A').charAt(0).toUpperCase()}
              </div>
              <div style={{ flex:1,minWidth:0 }}>
                <div style={{ fontWeight:800,fontSize:'.95rem',color:'#0B1E3D' }}>{passage.auditeurNom}</div>
                <div style={{ fontSize:'.75rem',color:'#64748B',marginTop:3,display:'flex',gap:8,flexWrap:'wrap' }}>
                  <span style={{ background:'#F1F5F9',border:'1px solid #E2E8F0',borderRadius:5,padding:'1px 7px',fontWeight:600 }}>{passage.auditeurMatricule}</span>
                  <span>{passage.certificationTitre}</span>
                  {passage.certificationClientNom && <span style={{ color:'#C8982A',fontWeight:700 }}>· {passage.certificationClientNom}</span>}
                </div>
              </div>
            </div>
 
            {/* Scores */}
            {(theoPct != null || pratPct != null) && (
              <div style={{ display:'flex',gap:8,flexWrap:'wrap' }}>
                {theoPct != null && (
                  <ScoreBadge icon={Ico.theo} label="Théo :" value={theoPct} seuil={passage.seuilTheorique||70} />
                )}
                {pratPct != null && (
                  <ScoreBadge icon={Ico.prat} label="Pratique :" value={pratPct} seuil={passage.seuilPratique||70} />
                )}
              </div>
            )}
 
            {/* Remarque expert */}
            {passage.remarqueExpert && (
              <div style={{ background:'#FFFBEB',border:'1px solid #FED7AA',borderRadius:10,padding:'10px 14px',fontSize:'.82rem',color:'#92400E',display:'flex',gap:8 }}>
                <span style={{ flexShrink:0,marginTop:1 }}>{Ico.warn}</span>
                <span><strong>Remarque de l'expert :</strong> {passage.remarqueExpert}</span>
              </div>
            )}
 
            {/* Aperçu PDF certificat */}
            <div style={{ background:'#F8FAFC',border:'1px solid #E2E8F0',borderRadius:12,overflow:'hidden' }}>
              <div style={{ padding:'10px 14px',borderBottom:'1px solid #E2E8F0',display:'flex',alignItems:'center',justifyContent:'space-between' }}>
                <span style={{ fontSize:'.82rem',fontWeight:700,color:'#374151',display:'flex',alignItems:'center',gap:6 }}>
                  {Ico.pdf} Certificat PDF
                </span>
                <button onClick={handleDownload}
                  style={{ display:'flex',alignItems:'center',gap:5,padding:'5px 11px',background:'#059669',color:'#fff',border:'none',borderRadius:7,cursor:'pointer',fontSize:'.75rem',fontWeight:700,fontFamily:'inherit' }}>
                  {Ico.dl} Télécharger
                </button>
              </div>
              <div style={{ padding:'12px' }}>
                {loadingPdf ? (
                  <div style={{ textAlign:'center',padding:'2rem',color:'#94A3B8' }}>Chargement du PDF…</div>
                ) : pdfBlobUrl ? (
                  <iframe src={pdfBlobUrl+'#toolbar=0'} style={{ width:'100%',height:350,border:'none',borderRadius:8 }} title="Certificat"/>
                ) : (
                  <div style={{ background:'#FEF2F2',border:'1px solid #FECACA',borderRadius:8,padding:'1rem',textAlign:'center',color:'#DC2626' }}>
                    Impossible de charger. <button onClick={handleDownload} style={{ background:'none',border:'none',cursor:'pointer',color:'#2563EB',textDecoration:'underline',fontFamily:'inherit' }}>Télécharger</button>
                  </div>
                )}
              </div>
            </div>
 
            <div style={{ fontSize:'.78rem',color:'#94A3B8',textAlign:'center' }}>
              Généré le {passage.dateGenerationCertif ? new Date(passage.dateGenerationCertif).toLocaleDateString('fr-FR') : '—'} · Expert : {passage.expertGenerateurNom||'—'}
            </div>
 
            {/* Commentaire */}
            <div>
              <label style={{ display:'block',fontSize:'.72rem',fontWeight:700,color:'#374151',textTransform:'uppercase',letterSpacing:'.06em',marginBottom:7 }}>
                Commentaire <span style={{ textTransform:'none',fontWeight:400,color:'#9CA3AF' }}>(optionnel)</span>
              </label>
              <textarea value={commentaire} onChange={e => setCommentaire(e.target.value)} rows={3}
                placeholder="Votre commentaire sur la validation ou l'invalidation du certificat…"
                style={{ width:'100%',padding:'10px 14px',border:'1.5px solid #D1D5DB',borderRadius:10,fontSize:'.84rem',fontFamily:'inherit',outline:'none',resize:'vertical',boxSizing:'border-box',color:'#111827',lineHeight:1.6 }}/>
            </div>
 
            {err && (
              <div style={{ background:'#FEF2F2',border:'1px solid #FECACA',borderRadius:8,padding:'.6rem .9rem',fontSize:'.82rem',color:'#DC2626' }}>{err}</div>
            )}
 
            {confirmer && (
              <div style={{ background:'#FFF7ED',border:'1.5px solid #FED7AA',borderRadius:12,padding:'1rem',fontSize:'.85rem',color:'#92400E',fontWeight:600,display:'flex',gap:8 }}>
                <span>{Ico.warn}</span>
                <span>Invalider ce certificat bloquera l'auditeur pendant 6 mois. Confirmez-vous ?</span>
              </div>
            )}
 
            {/* Boutons décision */}
            <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginTop:4 }}>
              <button onClick={() => handleDecision(false)} disabled={saving}
                style={{ padding:'14px',borderRadius:12,border:confirmer?'2px solid #DC2626':'1.5px solid #FECACA',background:confirmer?'#DC2626':'#FEF2F2',color:confirmer?'#fff':'#DC2626',fontWeight:800,fontSize:'.9rem',cursor:saving?'not-allowed':'pointer',opacity:saving?.5:1,fontFamily:'inherit',display:'flex',alignItems:'center',justifyContent:'center',gap:8,transition:'all .15s' }}>
                {saving?<Spinner/>:<>{Ico.x} {confirmer?'Confirmer':'Invalider'}</>}
              </button>
              <button onClick={() => handleDecision(true)} disabled={saving}
                style={{ padding:'14px',borderRadius:12,border:'none',background:'#059669',color:'#fff',fontWeight:800,fontSize:'.9rem',cursor:saving?'not-allowed':'pointer',opacity:saving?.5:1,fontFamily:'inherit',display:'flex',alignItems:'center',justifyContent:'center',gap:8,boxShadow:'0 4px 12px rgba(5,150,105,.3)',transition:'all .15s' }}>
                {saving?<><Spinner/> En cours…</>:<>{Ico.check} Valider</>}
              </button>
            </div>
 
            <div style={{ fontSize:'.73rem',color:'#94A3B8',textAlign:'center' }}>
              ✓ <strong>Valider</strong> → L'auditeur devient qualifié &nbsp;·&nbsp; ✗ <strong>Invalider</strong> → Bloqué 6 mois
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   LIGNE PASSAGE — même structure que AuditeurQualifications
═══════════════════════════════════════════════════════════════════ */
function PassageLigne({ p, idx, total, onValider }) {
  const [pdfBlobUrl, setPdfBlobUrl] = useState(null);
  const [showModal, setShowModal]   = useState(false);
  const [showQr, setShowQr]         = useState(false);
  const [loadingPdf, setLoadingPdf] = useState(false);

  const st      = ST[p.statut] || { label:p.statut, color:'#6B7280', bg:'#F9FAFB', border:'#E5E7EB' };
  const certifSt = STATUT_CERTIF_MAP[p.statutCertificat];
  const hasAction = p.statutCertificat === 'EN_ATTENTE_CHEF';
  const isCertifie = p.statut === 'CERTIFIE' || p.statutCertificat === 'VALIDE_CHEF';
  const isBloque   = p.statut === 'BLOQUE';
  const isAct      = STATUTS_EN_COURS.includes(p.statut);
  const theoPct    = p.scoreTheoriquePct ?? (p.scoreTheorique!=null ? Math.round(p.scoreTheorique*100/20) : null);
  const seuil      = p.seuilTheorique || 70;

  const openCertif = () => {
    setShowModal(true);
    setLoadingPdf(true);
    api.get(`/chef-service/qualifications/${p.id}/certificat/view`, { responseType:'blob' })
      .then(r => { setPdfBlobUrl(window.URL.createObjectURL(r.data)); })
      .catch(() => setPdfBlobUrl(null))
      .finally(() => setLoadingPdf(false));
  };

  const closeModal = () => {
    if (pdfBlobUrl) window.URL.revokeObjectURL(pdfBlobUrl);
    setShowModal(false); setPdfBlobUrl(null);
  };

  const handleDownload = async () => {
    try {
      const r = await api.get(`/chef-service/qualifications/${p.id}/certificat/download`, { responseType:'blob' });
      const url = window.URL.createObjectURL(r.data);
      const a = document.createElement('a');
      a.href = url; a.download = `certificat_${p.auditeurNom||p.id}.pdf`;
      document.body.appendChild(a); a.click(); a.remove();
      window.URL.revokeObjectURL(url);
    } catch {}
  };

  return (
    <>
      <div className="qrow"
        style={{ display:'flex',alignItems:'center',gap:16,padding:'16px 20px',borderBottom:idx<total-1?'1px solid #CBD5E1':'none',animation:`up .3s ${idx*.04}s ease both`,background:hasAction?'linear-gradient(90deg,#FFFBEB,#fff)':undefined }}>

        {/* Icône statut — même style */}
        <div style={{ width:44,height:44,borderRadius:12,flexShrink:0,background:isCertifie?'#d5efe3':isAct?'#ced8e6':isBloque?'#e4cfcf':'#d8dee3',color:isCertifie?'#059669':isAct?'#2563EB':isBloque?'#DC2626':'#9CA3AF',display:'flex',alignItems:'center',justifyContent:'center',border:`1px solid ${isCertifie?'#A7F3D0':isAct?'#BFDBFE':isBloque?'#FECACA':'#E2E8F0'}` }}>
          {isCertifie?Ico.trophy:isAct?Ico.inprog:isBloque?Ico.bloque:Ico.lock}
        </div>

        {/* Contenu */}
        <div style={{ flex:1,minWidth:0 }}>
          <div style={{ display:'flex',alignItems:'center',gap:8,marginBottom:7,flexWrap:'wrap' }}>
            <p style={{ margin:0,fontWeight:700,fontSize:'.9rem',color:'#0B1E3D',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis' }}>
              {p.auditeurNom}
            </p>
            {p.auditeurMatricule && (
              <span style={{ fontSize:'.7rem',color:'#94A3B8',fontWeight:600,background:'#F8FAFC',border:'1px solid #E8EDF7',borderRadius:5,padding:'1px 6px' }}>
                {p.auditeurMatricule}
              </span>
            )}
            <span style={{ background:st.bg,color:st.color,fontSize:'.7rem',fontWeight:600,padding:'3px 10px',borderRadius:99,flexShrink:0,border:st.border?`1px solid ${st.border}`:'none',letterSpacing:'.01em' }}>
              {st.label}
            </span>
            {certifSt?.label && (
              <span style={{ background:certifSt.bg,color:certifSt.color,fontSize:'.7rem',fontWeight:600,padding:'3px 10px',borderRadius:99,flexShrink:0,border:`1px solid ${certifSt.border}`,letterSpacing:'.01em' }}>
                {certifSt.label}
              </span>
            )}
          </div>

          <div style={{ display:'flex',alignItems:'center',gap:7,flexWrap:'wrap' }}>
            <span style={{ fontSize:'.73rem',color:'#64748B' }}>{p.certificationTitre}</span>
            {p.certificationClientNom && (
              <span style={{ fontSize:'.7rem',color:'#C8982A',fontWeight:700 }}>· {p.certificationClientNom}</span>
            )}
            {theoPct != null && (
              <ScoreBadge icon={Ico.theo} label="Théo :" value={theoPct} seuil={seuil} />
            )}
            {p.scorePratique != null && (
              <ScoreBadge icon={Ico.prat} label="Pratique :" value={p.scorePratique} seuil={p.seuilPratique||70} />
            )}
            {(p.dateValidationChef||p.dateDebut) && (
              <span style={{ display:'flex',alignItems:'center',gap:4,fontSize:'.72rem',color:'#94A3B8' }}>
                {Ico.cal} {fmt(p.dateValidationChef||p.dateGenerationCertif||p.dateDebut)}
              </span>
            )}
          </div>
        </div>

        {/* Boutons — même style que AuditeurQualifications */}
        <div style={{ flexShrink:0,display:'flex',gap:7 }}>
          {hasAction && (
            <button onClick={() => onValider(p)}
              style={{ display:'flex',alignItems:'center',gap:6,background:'linear-gradient(135deg,#0B1E3D,#059669)',color:'#fff',border:'none',borderRadius:9,padding:'7px 13px',fontSize:'.82rem',fontWeight:700,cursor:'pointer',fontFamily:'inherit',boxShadow:'0 2px 8px rgba(5,150,105,.25)',whiteSpace:'nowrap' }}>
              {Ico.shield} Valider {Ico.arrow}
            </button>
          )}
          {(isCertifie || p.statutCertificat==='VALIDE_CHEF' || p.statutCertificat==='GENERE') && (
            <>
              <button onClick={openCertif}
                style={{ display:'flex',alignItems:'center',gap:6,background:'#EFF6FF',color:'#2563EB',border:'1px solid #abc5e4',borderRadius:9,padding:'7px 13px',fontSize:'.82rem',fontWeight:700,cursor:'pointer',fontFamily:'inherit',transition:'all .14s',whiteSpace:'nowrap' }}
                onMouseEnter={e => { e.currentTarget.style.background='#DBEAFE'; e.currentTarget.style.transform='translateY(-1px)'; }}
                onMouseLeave={e => { e.currentTarget.style.background='#EFF6FF'; e.currentTarget.style.transform='none'; }}>
                {Ico.eye} Voir certificat
              </button>
              <button onClick={handleDownload}
                style={{ display:'flex',alignItems:'center',gap:6,background:'#059669',color:'#fff',border:'none',borderRadius:9,padding:'7px 13px',fontSize:'.82rem',fontWeight:700,cursor:'pointer',fontFamily:'inherit',transition:'all .14s',whiteSpace:'nowrap',boxShadow:'0 2px 8px rgba(5,150,105,.2)' }}
                onMouseEnter={e => { e.currentTarget.style.background='#047857'; e.currentTarget.style.transform='translateY(-1px)'; }}
                onMouseLeave={e => { e.currentTarget.style.background='#059669'; e.currentTarget.style.transform='none'; }}>
                {Ico.dl} Exporter
              </button>

              {/* QR Code button */}
              <button
                type="button"
                onClick={() => setShowQr(true)}
                style={{
                  display:'inline-flex', alignItems:'center', gap:8,
                  padding:'7px 12px',
                  background:'linear-gradient(135deg,#FAF5FF,#F3E8FF)',
                  color:'#6D28D9',
                  border:'1px solid #c5bcef', borderRadius:10,
                  fontSize:'.8rem', fontWeight:800,
                  cursor:'pointer', fontFamily:'inherit', whiteSpace:'nowrap',
                  boxShadow:'0 2px 8px rgba(124,58,237,.10)',
                  transition:'all .14s ease',
                }}>
                <span style={{ display:'inline-flex', alignItems:'center', justifyContent:'center', width:18, height:18, borderRadius:6, background:'#fff', border:'1px solid #E9D5FF', color:'#7C3AED', flexShrink:0 }}>
                  <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h3v3h-3zM19 14h1v1h-1zM17 17h2v2h-2zM19 19h1v1h-1z" />
                  </svg>
                </span>
                QR Code
              </button>
            </>
          )}
        </div>
      </div>

      {/* Modal certificat — même style que ModalVoirCertificat de l'auditeur */}
      {showModal && (
        <div style={{ position:'fixed',inset:0,background:'rgba(0,0,0,.6)',zIndex:10000,display:'flex',alignItems:'center',justifyContent:'center',backdropFilter:'blur(4px)',padding:'1rem',animation:'fadeIn .18s ease' }}
          onClick={closeModal}>
          <div style={{ background:'#fff',borderRadius:20,width:'100%',maxWidth:780,maxHeight:'93vh',display:'flex',flexDirection:'column',boxShadow:'0 32px 80px rgba(0,0,0,.25)',animation:'popIn .2s ease',overflow:'hidden' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ background:'linear-gradient(135deg,#0B1E3D,#059669)',padding:'16px 22px',display:'flex',alignItems:'center',justifyContent:'space-between',flexShrink:0 }}>
              <div style={{ display:'flex',alignItems:'center',gap:12 }}>
                <div style={{ width:38,height:38,borderRadius:10,background:'rgba(255,255,255,.15)',display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontSize:'1.1rem' }}>🎓</div>
                <div>
                  <div style={{ fontWeight:800,color:'#fff',fontSize:'.95rem' }}>Certificat de Qualification</div>
                  <div style={{ fontSize:'.72rem',color:'rgba(255,255,255,.55)',marginTop:2 }}>
                    {p.certificationTitre} · {p.auditeurNom}
                  </div>
                </div>
              </div>
              <div style={{ display:'flex',gap:8,alignItems:'center' }}>
                <button onClick={handleDownload}
                  style={{ display:'flex',alignItems:'center',gap:6,padding:'8px 14px',background:'rgba(255,255,255,.15)',border:'1px solid rgba(255,255,255,.3)',borderRadius:9,color:'#fff',cursor:'pointer',fontSize:'.8rem',fontWeight:700,fontFamily:'inherit' }}>
                  {Ico.dl} Exporter
                </button>
                <button onClick={closeModal}
                  style={{ width:32,height:32,borderRadius:8,background:'rgba(255,255,255,.12)',border:'none',cursor:'pointer',color:'#fff',display:'flex',alignItems:'center',justifyContent:'center' }}>
                  {Ico.x}
                </button>
              </div>
            </div>
            <div style={{ flex:1,overflow:'hidden',minHeight:0 }}>
              {loadingPdf ? (
                <div style={{ display:'flex',alignItems:'center',justifyContent:'center',height:400,gap:12,color:'#94A3B8',flexDirection:'column' }}>
                  <SpinnerDark/><span style={{ fontSize:'.85rem' }}>Chargement du certificat…</span>
                </div>
              ) : pdfBlobUrl ? (
                <iframe src={pdfBlobUrl+'#toolbar=1&navpanes=0&scrollbar=1'} style={{ width:'100%',height:'100%',border:'none',display:'block',minHeight:500 }} title="Certificat"/>
              ) : (
                <div style={{ display:'flex',alignItems:'center',justifyContent:'center',height:300,flexDirection:'column',gap:14,padding:'2rem' }}>
                  <div style={{ fontSize:'2rem' }}>⚠️</div>
                  <p style={{ color:'#DC2626',fontWeight:600,fontSize:'.88rem',textAlign:'center',margin:0 }}>Impossible de charger le certificat.</p>
                  <button onClick={handleDownload}
                    style={{ display:'flex',alignItems:'center',gap:7,padding:'10px 20px',background:'#0B1E3D',color:'#fff',border:'none',borderRadius:10,cursor:'pointer',fontSize:'.88rem',fontWeight:700,fontFamily:'inherit' }}>
                    {Ico.dl} Télécharger le PDF
                  </button>
                </div>
              )}
            </div>
            <div style={{ padding:'12px 22px',borderTop:'1px solid #E2E8F0',display:'flex',alignItems:'center',justifyContent:'space-between',flexShrink:0,background:'#F8FAFC' }}>
              <span style={{ fontSize:'.72rem',color:'#94A3B8' }}>
                {p.auditeurNom} · {p.certificationTitre}
              </span>
              <div style={{ display:'flex',gap:8 }}>
                <button onClick={handleDownload}
                  style={{ display:'flex',alignItems:'center',gap:6,padding:'8px 16px',background:'#059669',color:'#fff',border:'none',borderRadius:9,cursor:'pointer',fontSize:'.82rem',fontWeight:700,fontFamily:'inherit',boxShadow:'0 2px 8px rgba(5,150,105,.25)' }}>
                  {Ico.dl} Exporter certificat
                </button>
                <button onClick={closeModal}
                  style={{ padding:'8px 16px',background:'#fff',color:'#374151',border:'1.5px solid #E2E8F0',borderRadius:9,cursor:'pointer',fontSize:'.82rem',fontWeight:700,fontFamily:'inherit' }}>
                  Fermer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showQr && (
        <ModalQrCode
          passageId={p.id}
          auditeurNom={p.auditeurNom}
          certificationTitre={p.certificationTitre}
          onClose={() => setShowQr(false)}
        />
      )}
    </>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   COMPOSANT PRINCIPAL
═══════════════════════════════════════════════════════════════════ */
export default function ChefQualificationsPage() {
  const [passages,     setPassages]     = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [tab,          setTab]          = useState('tous');
  const [filterSearch, setFilterSearch] = useState('');
  const [validerTarget, setValiderTarget] = useState(null);
  const [notification,  setNotification]  = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await chefQualifAPI.getAllQualifications();
      setPassages(r.data || []);
    } catch { setPassages([]); }
    finally  { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleDecision = (valide) => {
    setNotification({
      type: valide?'success':'error',
      msg:  valide?'✅ Certificat validé ! L\'auditeur est maintenant qualifié.':'❌ Certificat invalidé. L\'auditeur est bloqué 6 mois.',
    });
    load();
    setTimeout(() => setNotification(null), 4000);
  };

  const filtered = passages.filter(p => {
    if (tab==='en_cours')       { if (!STATUTS_EN_COURS.includes(p.statut)) return false; }
    if (tab==='certif_attente') { if (p.statutCertificat!=='EN_ATTENTE_CHEF') return false; }
    if (tab==='certifies')      { if (p.statut!=='CERTIFIE') return false; }
    if (tab==='bloques')        { if (p.statut!=='BLOQUE') return false; }
    if (tab==='historique')     { if (!['EN_ATTENTE_CHEF','VALIDE_CHEF','INVALIDE_CHEF'].includes(p.statutCertificat)) return false; }
    if (filterSearch) {
      const q = filterSearch.toLowerCase();
      if (!(p.auditeurNom||'').toLowerCase().includes(q) &&
          !(p.auditeurMatricule||'').toLowerCase().includes(q) &&
          !(p.certificationTitre||'').toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const counts = {
    tous:          passages.length,
    en_cours:      passages.filter(p => STATUTS_EN_COURS.includes(p.statut)).length,
    certif_attente:passages.filter(p => p.statutCertificat==='EN_ATTENTE_CHEF').length,
    certifies:     passages.filter(p => p.statut==='CERTIFIE').length,
    bloques:       passages.filter(p => p.statut==='BLOQUE').length,
    historique:    passages.filter(p => ['EN_ATTENTE_CHEF','VALIDE_CHEF','INVALIDE_CHEF'].includes(p.statutCertificat)).length,
  };

  return (
    <div style={{ fontFamily:"'Inter','DM Sans',sans-serif",display:'flex',flexDirection:'column',gap:'1.25rem' }}>
      <style>{`
        @keyframes up    { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:none} }
        @keyframes fadeIn{ from{opacity:0} to{opacity:1} }
        @keyframes popIn { from{opacity:0;transform:scale(.94)} to{opacity:1;transform:scale(1)} }
        @keyframes spin  { to{transform:rotate(360deg)} }
        .qrow { transition:background .15s ease; }
        .qrow:hover { background:#F8FAFC !important; }
        .qfil { transition:all .14s; cursor:pointer; border:none; font-family:inherit; }
        .qfil:hover { background:#EEF2F8 !important; }
        .qfil.on { background:#0B1E3D !important; color:#fff !important; }
      `}</style>

      {/* Toast notification */}
      {notification && (
        <div style={{ position:'fixed',top:20,right:20,zIndex:10001,background:notification.type==='success'?'#ECFDF5':'#FEF2F2',border:`1.5px solid ${notification.type==='success'?'#A7F3D0':'#FECACA'}`,borderRadius:12,padding:'12px 20px',fontSize:'.88rem',fontWeight:700,color:notification.type==='success'?'#065F46':'#DC2626',boxShadow:'0 8px 24px rgba(0,0,0,.12)',animation:'fadeIn .2s ease' }}>
          {notification.msg}
        </div>
      )}

    

      {/* ── BANDEAU ALERTE certifs en attente — en BLEU comme AuditeurQualifications ── */}
      {counts.certif_attente > 0 && (
        <div style={{ background:'linear-gradient(135deg,#0B1E3D,#1D4ED8)',borderRadius:14,padding:'1.1rem 1.5rem',display:'flex',alignItems:'center',justifyContent:'space-between',gap:16,boxShadow:'0 4px 16px rgba(11,30,61,.2)',animation:'up .3s ease' }}>
          <div style={{ display:'flex',alignItems:'center',gap:12 }}>
            <div style={{ width:38,height:38,borderRadius:10,background:'rgba(255,255,255,.12)',display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',flexShrink:0 }}>
              {Ico.bell}
            </div>
            <div>
              <p style={{ margin:0,fontSize:'.67rem',fontWeight:700,color:'rgba(255,255,255,.5)',textTransform:'uppercase',letterSpacing:'.1em',marginBottom:3 }}>
                Action requise
              </p>
              <p style={{ margin:0,fontWeight:800,fontSize:'1rem',color:'#fff' }}>
                {counts.certif_attente} certificat{counts.certif_attente>1?'s':''} en attente de votre validation
              </p>
            </div>
          </div>
          <button onClick={() => setTab('certif_attente')}
            style={{ display:'flex',alignItems:'center',gap:7,background:'rgba(255,255,255,.12)',border:'1px solid rgba(255,255,255,.2)',borderRadius:10,padding:'9px 18px',color:'#fff',fontWeight:700,fontSize:'.86rem',cursor:'pointer',fontFamily:'inherit',flexShrink:0 }}>
            Voir les certificats {Ico.arrow}
          </button>
        </div>
      )}

      {/* ── ONGLETS — même style que AuditeurQualifications ── */}
      <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',gap:12,flexWrap:'wrap' }}>
        <div style={{ display:'flex',gap:6,flexWrap:'wrap',alignItems:'center' }}>
          {TABS.map(t => {
            const isActive = tab === t.key;
            const cnt = counts[t.key];
            const isAlert = t.key==='certif_attente' && counts.certif_attente>0 && !isActive;
            return (
              <button key={t.key} className={`qfil ${isActive?'on':''}`} onClick={() => setTab(t.key)}
                style={{ position:'relative',padding:'6px 15px',borderRadius:8,background:isActive?'#0B1E3D':'#fff',color:isActive?'#fff':'#64748B',fontSize:'.8rem',fontWeight:700,border:'1.5px solid #E2E8F0' }}>
                {t.label}
                {cnt>0 && (
                  <span style={{ marginLeft:5,background:isActive?'rgba(255,255,255,.2)':'#F1F5F9',padding:'1px 7px',borderRadius:99,fontSize:'.7rem',color:isActive?'#fff':'#6B7280' }}>{cnt}</span>
                )}
                {isAlert && (
                  <span style={{ position:'absolute',top:4,right:4,width:7,height:7,background:'#2563EB',borderRadius:'50%',boxShadow:'0 0 0 2px #fff' }}/>
                )}
              </button>
            );
          })}
        </div>

        <div style={{ position:'relative', minWidth:240, flex:'1 1 280px', maxWidth:380 }}>
          <span style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'#94A3B8', display:'flex', alignItems:'center', pointerEvents:'none' }}>
            {Ico.filter}
          </span>
          <input
            value={filterSearch}
            onChange={e => setFilterSearch(e.target.value)}
            placeholder="Rechercher un auditeur…"
            style={{ width:'100%', padding:'8px 12px 8px 34px', border:'1.5px solid #E2E8F0', borderRadius:10, fontSize:'.82rem', fontFamily:'inherit', outline:'none', background:'#fff', boxSizing:'border-box' }}
          />
        </div>
      </div>

      {/* ── LISTE — même card que AuditeurQualifications ── */}
      {loading ? (
        <div style={{ display:'flex',alignItems:'center',justifyContent:'center',height:200,gap:10,color:'#94A3B8' }}>
          <SpinnerDark/> Chargement…
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign:'center',padding:'3rem 1rem',background:'#fff',borderRadius:14,border:'1.5px dashed #E2E8F0' }}>
          <div style={{ width:52,height:52,borderRadius:14,background:'#F1F5F9',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 12px',color:'#94A3B8',fontSize:'1.5rem' }}>🏆</div>
          <p style={{ fontWeight:700,color:'#374151',margin:'0 0 6px' }}>Aucun résultat</p>
          <p style={{ fontSize:'.84rem',color:'#94A3B8',margin:0 }}>
            {tab==='certif_attente'?'Aucun certificat en attente de validation.':'Aucun passage dans cette catégorie.'}
          </p>
        </div>
      ) : (
        <div style={{ background:'#fff',borderRadius:14,border:'1px solid #E2E8F0',overflow:'hidden',boxShadow:'0 2px 8px rgba(0,0,0,.04)' }}>
          {/* Header de liste */}
          <div style={{ padding:'12px 20px',background:'#cfd9e8',borderBottom:'0.8px solid #9cb6d7',display:'flex',alignItems:'center',justifyContent:'space-between' }}>
            <div style={{ display:'flex',alignItems:'center',gap:8 }}>
              <div style={{ width:6,height:6,borderRadius:'50%',background:'#0B1E3D' }}/>
              <span style={{ fontSize:'.75rem',fontWeight:700,color:'#374151',textTransform:'uppercase',letterSpacing:'.08em' }}>
                {filtered.length} auditeur{filtered.length>1?'s':''}
              </span>
            </div>
            {tab==='certif_attente' && (
              <span style={{ fontSize:'.72rem',color:'#2563EB',fontWeight:700 }}>
                En attente de votre validation
              </span>
            )}
          </div>
          {filtered.map((p, i) => (
            <PassageLigne key={p.id} p={p} idx={i} total={filtered.length} onValider={setValiderTarget}/>
          ))}
        </div>
      )}

      {/* Modal validation */}
      {validerTarget && (
        <ModalValidation
          passage={validerTarget}
          onClose={() => setValiderTarget(null)}
          onDecision={handleDecision}
        />
      )}
    </div>
  );
}