import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../../services/api';
import s from './CertifDetail.module.css';

const I = {
  x:       <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  shield:  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  book:    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>,
  tool:    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>,
  image:   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>,
  qcm:     <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>,
  chevron: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>,
  back:    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>,
  cal:     <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  pct:     <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="5" x2="5" y2="19"/><circle cx="6.5" cy="6.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/></svg>,
  list:    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>,
  clock:   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  pin:     <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>,
  warn:    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
  check:   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
  download:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>,
  pdf:     <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>,
  client:  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>,
};

function buildUrl(path) {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  const base = window.location.hostname === 'localhost'
    ? 'http://localhost:8080'
    : window.location.origin;
  return `${base}/${path.replace(/^\/+/, '')}`;
}

function fmtDate(d, locale = 'fr-FR') {
  if (!d) return '—';
  return new Date(d).toLocaleDateString(locale, { day:'2-digit', month:'short', year:'numeric' });
}

function Spin() { return <div className={s.spin}/>; }

const STATUT_CFG = {
  EN_ATTENTE:         'expert.certif.status.enAttente',
  THEORIQUE_EN_COURS: 'expert.certif.status.theoriqueEnCours',
  THEORIQUE_VALIDE:   'expert.certif.status.theoriqueValide',
  THEORIQUE_ECHOUE_1: 'expert.certif.status.theoriqueEchoue',
  PRATIQUE_EN_COURS:  'expert.certif.status.pratiqueEnCours',
  REUSSI:             'expert.certif.status.certifie',
  BLOQUE:             'expert.certif.status.bloque',
  EXPIRE:             'expert.certif.status.expire',
};

/* ══════════════════════════════════════════════
   VIEWER PDF INLINE — plein écran dans la modal
══════════════════════════════════════════════ */
function PdfViewer({ url, nom, onClose }) {
  const { t } = useTranslation();
  if (!url) return null;
  const isPdf = nom?.toLowerCase().endsWith('.pdf');

  // Fermer avec Échap
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,.75)',
        zIndex: 99999,
        display: 'flex', flexDirection: 'column',
        backdropFilter: 'blur(6px)',
        animation: 'fadeIn .18s ease',
      }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      {/* ── Header ── */}
      <div style={{
        background: '#0B1E3D',
        padding: '.875rem 1.25rem',
        display: 'flex', alignItems: 'center',
        justifyContent: 'space-between',
        flexShrink: 0,
        boxShadow: '0 2px 12px rgba(0,0,0,.3)',
      }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ fontSize:'1.2rem' }}>{isPdf ? '📄' : '📊'}</div>
          <div style={{ color:'#fff', fontWeight:700, fontSize:'.9rem',
            maxWidth:400, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
            {nom}
          </div>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          {/* Bouton télécharger */}
          <a href={url} download={nom} target="_blank" rel="noopener noreferrer"
            style={{ display:'flex', alignItems:'center', gap:6,
              background:'rgba(255,255,255,.12)', border:'1px solid rgba(255,255,255,.2)',
              borderRadius:8, padding:'6px 12px', color:'#fff', textDecoration:'none',
              fontSize:'.78rem', fontWeight:700, cursor:'pointer' }}>
            {I.download} <span>{t('commun.telecharger')}</span>
          </a>
          {/* Bouton fermer */}
          <button onClick={onClose}
            style={{ background:'rgba(255,255,255,.12)', border:'none',
              borderRadius:8, width:34, height:34, cursor:'pointer',
              color:'#fff', display:'flex', alignItems:'center',
              justifyContent:'center', fontSize:'1.1rem' }}>
            ✕
          </button>
        </div>
      </div>

      {/* ── Contenu ── */}
      {isPdf ? (
        <iframe
          src={`${url}#toolbar=1&navpanes=0&scrollbar=1`}
          style={{ flex:1, border:'none', display:'block', background:'#525659' }}
          title={nom}
        />
      ) : (
        /* PowerPoint → téléchargement uniquement */
        <div style={{
          flex:1, display:'flex', flexDirection:'column',
          alignItems:'center', justifyContent:'center', gap:24,
          background:'#1e2432',
        }}>
          <div style={{ fontSize:'5rem' }}>📊</div>
          <div style={{ color:'#fff', fontWeight:800, fontSize:'1.2rem',
            textAlign:'center', maxWidth:400 }}>
            {nom}
          </div>
          <div style={{ color:'rgba(255,255,255,.45)', fontSize:'.88rem',
            textAlign:'center', maxWidth:360, lineHeight:1.6 }}>
            {t('expert.certif.viewer.pptNotPreviewable')}
          </div>
          <a href={url} download={nom}
            style={{ background:'#2563EB', color:'#fff', borderRadius:12,
              padding:'13px 30px', fontWeight:700, textDecoration:'none',
              display:'inline-flex', alignItems:'center', gap:10, fontSize:'.92rem',
              boxShadow:'0 4px 16px rgba(37,99,235,.4)' }}>
            {I.download} {t('expert.certif.viewer.downloadPresentation')}
          </a>
        </div>
      )}
    </div>
  );
}

/* ── Carte fichier générique ─────────────────── */
function FichierCard({ label, nom, url, icon, accent }) {
  const { t } = useTranslation();
  const [showViewer, setShowViewer] = useState(false);
  const fullUrl = buildUrl(url);

  return (
    <>
      <div style={{
        display:'flex', alignItems:'center', gap:12,
        background:'#fff', border:`1px solid ${accent}33`,
        borderLeft:`3px solid ${accent}`,
        borderRadius:10, padding:'.875rem 1rem',
      }}>
        <div style={{ width:36, height:36, borderRadius:9, background:`${accent}15`,
          display:'flex', alignItems:'center', justifyContent:'center',
          flexShrink:0, color:accent }}>
          {icon}
        </div>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontSize:'.68rem', fontWeight:700, textTransform:'uppercase',
            letterSpacing:'.08em', color:'#8A9BBC', marginBottom:2 }}>{label}</div>
          <div style={{ fontSize:'.875rem', fontWeight:700, color:'#002855',
            overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
            {nom || (
              <span style={{ color:'#C5CDD8', fontStyle:'italic', fontWeight:400 }}>
                {t('expert.certif.files.notImported')}
              </span>
            )}
          </div>
        </div>
        {fullUrl && nom ? (
          <button onClick={() => setShowViewer(true)}
            style={{ display:'flex', alignItems:'center', gap:5,
              background:`${accent}15`, border:`1px solid ${accent}33`,
              borderRadius:7, padding:'5px 10px', cursor:'pointer',
              fontSize:'.75rem', fontWeight:700, color:accent, flexShrink:0 }}>
            {I.download} <span>{t('commun.voir')}</span>
          </button>
        ) : (
          <span style={{ fontSize:'.73rem', color:'#C5CDD8', fontStyle:'italic' }}>
            {t('expert.certif.files.notAvailable')}
          </span>
        )}
      </div>

      {showViewer && (
        <PdfViewer url={fullUrl} nom={nom} onClose={() => setShowViewer(false)} />
      )}
    </>
  );
}

/* ── Carte formation avec bouton Lier ────────── */
function FormationFichierCard({ certif, onFix, fixing }) {
  const { t } = useTranslation();
  const [showViewer, setShowViewer] = useState(false);
  const fullUrl = buildUrl(certif.formationUrl);
  const accent  = '#0066CC';

  return (
    <>
      <div style={{
        display:'flex', alignItems:'center', gap:12,
        background:'#fff', border:`1px solid ${accent}33`,
        borderLeft:`3px solid ${accent}`,
        borderRadius:10, padding:'.875rem 1rem',
      }}>
        <div style={{ width:36, height:36, borderRadius:9, background:`${accent}15`,
          display:'flex', alignItems:'center', justifyContent:'center',
          flexShrink:0, color:accent }}>
          {I.book}
        </div>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontSize:'.68rem', fontWeight:700, textTransform:'uppercase',
            letterSpacing:'.08em', color:'#8A9BBC', marginBottom:2 }}>
            {t('expert.certif.files.trainingSupport')}
          </div>
          <div style={{ fontSize:'.875rem', fontWeight:700, color:'#002855',
            overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
            {certif.formationNom || (
              <span style={{ color:'#C5CDD8', fontStyle:'italic', fontWeight:400 }}>
                {t('expert.certif.files.notImported')}
              </span>
            )}
          </div>
        </div>

        {fullUrl && certif.formationNom ? (
          /* Cas 1 : tout présent → Voir (viewer inline) */
          <button onClick={() => setShowViewer(true)}
            style={{ display:'flex', alignItems:'center', gap:5,
              background:`${accent}15`, border:`1px solid ${accent}33`,
              borderRadius:7, padding:'5px 10px', cursor:'pointer',
              fontSize:'.75rem', fontWeight:700, color:accent, flexShrink:0 }}>
            {I.download} <span>Voir</span>
          </button>

        ) : certif.formationNom && !certif.formationUrl ? (
          /* Cas 2 : nom sans url → bouton Lier */
          <button onClick={onFix} disabled={fixing}
            style={{ display:'flex', alignItems:'center', gap:5,
              background:'#FFF7ED', border:'1px solid #FED7AA',
              borderRadius:7, padding:'5px 10px', cursor:'pointer',
              fontSize:'.75rem', fontWeight:700, color:'#C05621',
              flexShrink:0, opacity: fixing ? .6 : 1 }}>
            {fixing ? <Spin/> : '🔗'} <span>{fixing ? '…' : t('expert.certif.files.link')}</span>
          </button>

        ) : (
          /* Cas 3 : rien */
          <span style={{ fontSize:'.73rem', color:'#C5CDD8', fontStyle:'italic' }}>
            {t('expert.certif.files.notAvailable')}
          </span>
        )}
      </div>

      {showViewer && (
        <PdfViewer
          url={fullUrl}
          nom={certif.formationNom}
          onClose={() => setShowViewer(false)}
        />
      )}
    </>
  );
}

/* ── Ligne info ──────────────────────────────── */
function InfoRow({ icon, label, value, warn }) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:10,
      padding:'.6rem .875rem', background:'#F8FAFC',
      borderRadius:8, border:'1px solid #F0F4FA' }}>
      <span style={{ width:16, height:16, color:'#8A9BBC', flexShrink:0,
        display:'flex', alignItems:'center' }}>{icon}</span>
      <span style={{ fontSize:'.78rem', color:'#6B7280', flex:1 }}>{label}</span>
      <span style={{ fontSize:'.82rem', fontWeight:700,
        color: warn ? '#DC2626' : '#0B1E3D' }}>{value || '—'}</span>
    </div>
  );
}

/* ══════════════════════════════════════════════
   VUE GENERALE
══════════════════════════════════════════════ */
function VueGenerale({ certifId, onGoTheo, onGoPrat }) {
  const { t, i18n } = useTranslation();
  const locale = i18n.language || 'fr-FR';
  const [certif,  setCertif]  = useState(null);
  const [loading, setLoading] = useState(true);
  const [fixingF, setFixingF] = useState(false);

  useEffect(() => {
    if (!certifId) return;
    setLoading(true);
    api.get(`/expert-audit/certifications/${certifId}`)
      .then(r => setCertif(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [certifId]);

  const rechercherFormationManquante = async () => {
    if (!certif || certif.formationUrl) return;
    setFixingF(true);
    try {
      const r = await api.get('/expert-audit/formations/all');
      const formations = r.data || [];
      const match = certif.formationNom
        ? formations.find(f => f.formationNom === certif.formationNom)
        : null;
      const cible = match || formations[0];
      if (cible) {
        const res = await api.post(
          `/expert-audit/certifications/${certifId}/fix-formation`,
          { formationUrl: cible.formationUrl, formationNom: cible.formationNom }
        );
        setCertif(res.data);
      }
    } catch {}
    setFixingF(false);
  };

  if (loading) return <div className={s.centerLoad}><Spin/> {t('commun.chargement')}</div>;
  if (!certif)  return null;
  const statutLabel = t(STATUT_CFG[certif.statut] || 'expert.certif.status.unknown', certif.statut || '—');
  const defectCount = certif.nbDefautsPratique || 0;
  const defectLabel = defectCount > 1
    ? t('expert.certif.composition.defectsOther', { count: defectCount })
    : t('expert.certif.composition.defectsOne', { count: defectCount });

  return (
    <div className={s.vueWrap}>

      {/* ── Hero ── */}
      <div className={s.heroCard}>
        <div className={s.heroLeft}>
          <div className={s.heroIconWrap}>{I.shield}</div>
          <div>
            <div className={s.heroTitle}>{certif.titre}</div>
            {certif.description && <div className={s.heroDesc}>{certif.description}</div>}
            <div className={s.heroBadgeRow}>
              <span className={s.statutBadge}>{statutLabel}</span>
              {certif.actif && <span className={s.activeBadge}>● {t('commun.actif')}</span>}
            </div>
          </div>
        </div>
      </div>

      {/* ── Stats ── */}
      <div className={s.statsGrid}>
        <div className={s.statBox}>
          <div className={s.statNum}>{certif.seuilTheorique}%</div>
          <div className={s.statLbl}>{t('expert.certif.stats.theoreticalThreshold')}</div>
        </div>
        <div className={s.statBox}>
          <div className={s.statNum}>{(certif.nbQuestionsQCM||0)+(certif.nbQuestionsImage||0)}</div>
          <div className={s.statLbl}>{t('expert.certif.stats.totalQuestions')}</div>
        </div>
        <div className={s.statBox}>
          <div className={s.statNum}>{certif.nbQuestionsImage||0}</div>
          <div className={s.statLbl}>{t('expert.certif.stats.imageQuestions')}</div>
        </div>
        <div className={s.statBox}>
          <div className={s.statNum}>{certif.nbQuestionsQCM||0}</div>
          <div className={s.statLbl}>{t('expert.certif.stats.qcmQuestions')}</div>
        </div>
      </div>

      {/* ── Client ── */}
      {(certif.clientNom || certif.clientId) && (
        <>
          <div className={s.infoBlockTitle} style={{ marginTop:'1rem' }}>
            {t('expert.certif.client.title')}
          </div>
          <div style={{
            display:'flex', alignItems:'center', gap:14,
            background:'#fff', border:'1px solid #E8EDF7',
            borderLeft:`3px solid ${certif.clientCouleur || '#0B1E3D'}`,
            borderRadius:10, padding:'1rem 1.125rem',
          }}>
            {certif.clientLogoUrl ? (
              <img src={buildUrl(certif.clientLogoUrl)} alt={certif.clientNom}
                style={{ width:40, height:40, borderRadius:8,
                  objectFit:'contain', flexShrink:0 }}
                onError={e => { e.target.style.display='none'; }}/>
            ) : (
              <div style={{
                width:40, height:40, borderRadius:8, flexShrink:0,
                background: certif.clientCouleur || '#0B1E3D',
                display:'flex', alignItems:'center', justifyContent:'center',
                color:'#fff', fontWeight:800, fontSize:'.9rem',
              }}>
                {(certif.clientCode || (certif.clientNom||'').slice(0,2)).toUpperCase()}
              </div>
            )}
            <div style={{ flex:1 }}>
              <div style={{ fontSize:'.9rem', fontWeight:800, color:'#0B1E3D' }}>
                {certif.clientNom || '—'}
              </div>
              {certif.clientCode && (
                <div style={{ fontSize:'.74rem', color:'#8A9BBC', marginTop:2 }}>
                  {t('expert.certif.client.code')} {certif.clientCode}
                </div>
              )}
            </div>
            <div style={{
              width:10, height:10, borderRadius:'50%',
              background: certif.clientCouleur || '#E5E7EB',
            }}/>
          </div>
        </>
      )}

      {/* ── Dates & Validité ── */}
      <div className={s.infoBlock} style={{ marginTop:'1rem' }}>
        <div className={s.infoBlockTitle}>{t('expert.certif.dates.title')}</div>
        <div style={{ display:'flex', flexDirection:'column', gap:'.375rem' }}>
          <InfoRow icon={I.cal}   label={t('expert.certif.dates.createdAt')}   value={fmtDate(certif.dateCreation, locale)} />
          {certif.dateActivation && (
            <InfoRow icon={I.check} label={t('expert.certif.dates.activatedAt')} value={fmtDate(certif.dateActivation, locale)} />
          )}
          {certif.actif && certif.dateExpiration && (
            <InfoRow icon={I.cal} label={t('expert.certif.dates.expiresAt')} value={fmtDate(certif.dateExpiration, locale)} />
          )}
          {certif.actif && certif.joursAvantExpiration != null && (
            <InfoRow icon={I.clock} label={t('expert.certif.dates.daysRemaining')}
              value={t('expert.certif.dates.daysValue', { count: certif.joursAvantExpiration })}
              warn={certif.joursAvantExpiration < 60} />
          )}
          {!certif.actif && (
            <InfoRow icon={I.clock} label={t('expert.certif.dates.expiresAt')} value={t('expert.certif.dates.fixedOnActivation')} />
          )}
          {certif.expertNom && (
            <InfoRow icon={I.shield} label={t('expert.certif.dates.expert')} value={certif.expertNom} />
          )}
        </div>
      </div>

      {/* ── Fichiers associés ── */}
      <div className={s.infoBlockTitle} style={{ marginTop:'1rem' }}>{t('expert.certif.files.title')}</div>
      <div style={{ display:'flex', flexDirection:'column', gap:'.625rem' }}>
        <FormationFichierCard
          certif={certif}
          onFix={rechercherFormationManquante}
          fixing={fixingF}
        />
        <FichierCard
          label={t('expert.certif.files.emptyCertificateModel')}
          nom={certif.certificatVideNom}
          url={certif.certificatVideUrl}
          icon={I.pdf}
          accent="#059669"
        />
      </div>

      {/* ── Composition ── */}
      <div className={s.infoBlockTitle} style={{ marginTop:'1rem' }}>{t('expert.certif.composition.title')}</div>
      <div className={s.testNavCards}>
        <button className={s.testNavCard} onClick={onGoTheo}>
          <div className={s.testNavIcon} style={{ background:'#EEF2F8' }}>{I.book}</div>
          <div className={s.testNavContent}>
            <div className={s.testNavLabel}>{t('expert.certif.composition.theoretical')}</div>
            <div className={s.testNavName}>{certif.testTheoriqueNom || '—'}</div>
            <div className={s.testNavMeta}>
              {t('expert.certif.composition.theoreticalMeta', {
                images: certif.nbQuestionsImage || 0,
                qcm: certif.nbQuestionsQCM || 0,
                threshold: certif.seuilTheorique,
              })}
            </div>
          </div>
          <div className={s.testNavArrow}>{I.chevron}</div>
        </button>
        <button className={s.testNavCard} onClick={onGoPrat}>
          <div className={s.testNavIcon} style={{ background:'#EEF2F8' }}>{I.tool}</div>
          <div className={s.testNavContent}>
            <div className={s.testNavLabel}>{t('expert.certif.composition.practical')}</div>
            <div className={s.testNavName}>{certif.testPratiqueNom || '—'}</div>
            <div className={s.testNavMeta}>
              {defectLabel}
            </div>
          </div>
          <div className={s.testNavArrow}>{I.chevron}</div>
        </button>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════
   VUE TEST THÉORIQUE
══════════════════════════════════════════════ */
function VueTheorique({ testId, onBack }) {
  const { t } = useTranslation();
  const [test,      setTest]      = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [errMsg,    setErrMsg]    = useState('');
  const [partie,    setPartie]    = useState(null);
  const [activeQ,   setActiveQ]   = useState(null);
  const [viewer,    setViewer]    = useState(null); // { url, nom }

  useEffect(() => {
    setLoading(true); setErrMsg(''); setTest(null); setQuestions([]);
    if (!testId) { setErrMsg(t('expert.certif.theoretical.noTest')); setLoading(false); return; }
    Promise.all([
      api.get('/expert-audit/tests/all'),
      api.get(`/expert-audit/tests/${testId}/questions`),
    ]).then(([rAll, rQ]) => {
      const found = (rAll.data || []).find(t => t.id === testId || t.id === Number(testId));
      if (!found) { setErrMsg(t('expert.certif.theoretical.notFound', { id: testId })); }
      else { setTest(found); setQuestions(Array.isArray(rQ.data) ? rQ.data : []); }
    }).catch(e => {
      setErrMsg(t('expert.certif.theoretical.loadError', { message: e.response?.data?.message || e.message }));
    }).finally(() => setLoading(false));
  }, [testId]);

  if (loading) return <div className={s.centerLoad}><Spin/> {t('expert.certif.theoretical.loading')}</div>;
  if (errMsg)  return (
    <div className={s.vueWrap}>
      <div className={s.subNav}>
        <button className={s.backBtn} onClick={onBack}>{I.back} {t('expert.certif.common.overview')}</button>
      </div>
      <div style={{ background:'#FEF2F2', border:'1px solid #FECACA',
        borderRadius:12, padding:'1rem 1.25rem', fontSize:'.84rem', color:'#DC2626' }}>
        {errMsg}
      </div>
    </div>
  );

  const images = questions.filter(q => q.type === 'IMAGE_DEFAUT');
  const qcms   = questions.filter(q => q.type === 'QCM');

  if (partie === 1) {
    return (
      <div className={s.vueWrap}>
        {viewer && (
          <PdfViewer url={viewer.url} nom={viewer.nom} onClose={() => setViewer(null)} />
        )}
        <div className={s.subNav}>
          <button className={s.backBtn} onClick={() => { setPartie(null); setActiveQ(null); }}>
            {I.back} {t('expert.certif.theoretical.title')}
          </button>
          <span className={s.subNavTitle}>
            {I.image} {t('expert.certif.theoretical.part1Title', { count: images.length })}
          </span>
        </div>
        <div className={s.qList}>
          {images.map((q, i) => (
            <div key={q.id} className={`${s.qCard} ${activeQ===q.id ? s.qCardOpen : ''}`}>
              <button className={s.qCardHeader}
                onClick={() => setActiveQ(activeQ===q.id ? null : q.id)}>
                <div className={s.qCardNum}>
                  <span className={s.qNumBadge} style={{ background:'#EEF2F8', color:'#002855' }}>
                    {I.image}
                  </span>
                  <span className={s.qNumLabel}>Q{i+1}</span>
                </div>
                <div className={s.qCardPreview}>
                  {q.bonneReponseImage
                    ? <><span className={s.qCorrect}>{I.check}</span> {t('expert.certif.theoretical.correctAnswer')}: <strong>{q.bonneReponseImage}</strong></>
                    : <span className={s.qNone}>{t('expert.certif.theoretical.noAnswer')}</span>}
                </div>
                <div className={s.qMeta}>
                  <span>{I.clock} {q.chronoSecondes||30}s</span>
                  <span>{q.points||1} pt</span>
                  <span className={`${s.qChevron} ${activeQ===q.id ? s.qChevronOpen:''}`}>
                    {I.chevron}
                  </span>
                </div>
              </button>
              {activeQ===q.id && (
                <div className={s.qCardBody}>
                  {q.imageUrl ? (
                    <div className={s.qImgWrap}>
                      <img
                        src={buildUrl(q.imageUrl)} alt={`Q${i+1}`}
                        className={s.qImg}
                        style={{ cursor:'pointer' }}
                        onClick={() => setViewer({ url: buildUrl(q.imageUrl), nom: `Question ${i+1}` })}
                        onError={e => { e.target.style.display='none'; }}
                      />
                    </div>
                  ) : (
                    <div className={s.qImgPlaceholder}>
                      {I.image}<span>{t('expert.certif.theoretical.imageUnavailable')}</span>
                    </div>
                  )}
                  <div className={s.qSection}>
                    <div className={s.qSectionTitle}>{t('expert.certif.theoretical.correctAnswer')}</div>
                    <div className={s.qAnswerCorrect}>
                      {I.check} {q.bonneReponseImage || '—'}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (partie === 2) {
    return (
      <div className={s.vueWrap}>
        <div className={s.subNav}>
          <button className={s.backBtn} onClick={() => { setPartie(null); setActiveQ(null); }}>
            {I.back} {t('expert.certif.theoretical.title')}
          </button>
          <span className={s.subNavTitle}>
            {I.qcm} {t('expert.certif.theoretical.part2Title', { count: qcms.length })}
          </span>
        </div>
        <div className={s.qList}>
          {qcms.map((q, i) => (
            <div key={q.id} className={`${s.qCard} ${activeQ===q.id ? s.qCardOpen : ''}`}>
              <button className={s.qCardHeader}
                onClick={() => setActiveQ(activeQ===q.id ? null : q.id)}>
                <div className={s.qCardNum}>
                  <span className={s.qNumBadge} style={{ background:'#EEF2F8', color:'#002855' }}>
                    {I.qcm}
                  </span>
                  <span className={s.qNumLabel}>Q{i+1}</span>
                </div>
                <div className={s.qCardPreview}>
                  {q.enonce
                    ? <span className={s.qEnonce}>
                        {q.enonce.length>70 ? q.enonce.slice(0,70)+'…' : q.enonce}
                      </span>
                    : <span className={s.qNone}>{t('expert.certif.theoretical.statementMissing')}</span>}
                </div>
                <div className={s.qMeta}>
                  <span>{I.clock} {q.chronoSecondes||30}s</span>
                  <span>{q.points||1} pt</span>
                  <span className={`${s.qChevron} ${activeQ===q.id ? s.qChevronOpen:''}`}>
                    {I.chevron}
                  </span>
                </div>
              </button>
              {activeQ===q.id && (
                <div className={s.qCardBody}>
                  <div className={s.qSection}>
                    <div className={s.qSectionTitle}>{t('expert.certif.theoretical.statement')}</div>
                    <div className={s.qEnonceText}>{q.enonce}</div>
                  </div>
                  {q.options && q.options.length > 0 && (
                    <div className={s.qSection}>
                      <div className={s.qSectionTitle}>
                        {t('expert.certif.theoretical.options')}
                        {q.bonnesReponsesIndexes?.length > 1 && (
                          <span style={{ marginLeft:8, fontSize:'.7rem',
                            background:'#DBEAFE', color:'#1E40AF',
                            borderRadius:99, padding:'2px 8px', fontWeight:700 }}>
                            {t('expert.certif.theoretical.correctAnswersCount', { count: q.bonnesReponsesIndexes.length })}
                          </span>
                        )}
                      </div>
                      <div className={s.qOptions}>
                        {q.options.map((o, oi) => {
                          const bonnes = q.bonnesReponsesIndexes?.length > 0
                            ? q.bonnesReponsesIndexes
                            : (q.bonneReponseIndex != null ? [q.bonneReponseIndex] : []);
                          const isCorrect = bonnes.includes(oi);
                          return (
                            <span key={oi}
                              className={`${s.qOption} ${isCorrect ? s.qOptionCorrect : ''}`}>
                              <span className={s.qOptIdx}>{String.fromCharCode(65+oi)}</span>
                              {isCorrect && <span className={s.qOptCheck}>{I.check}</span>}
                              {o}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={s.vueWrap}>
      <div className={s.subNav}>
        <button className={s.backBtn} onClick={onBack}>{I.back} {t('expert.certif.common.overview')}</button>
      </div>
      <div className={s.heroCard} style={{ marginBottom:'1rem' }}>
        <div className={s.heroLeft}>
          <div className={s.heroIconWrap} style={{ background:'#EEF2F8', color:'#002855' }}>
            {I.book}
          </div>
          <div>
            <div className={s.heroTitle}>{test.titre}</div>
            {test.description && <div className={s.heroDesc}>{test.description}</div>}
            <div className={s.heroBadgeRow}>
              <span className={s.statutBadge}>{test.actif ? t('commun.actif') : t('commun.inactif')}</span>
              <span className={s.infoPill}>{I.clock} {t('expert.certif.theoretical.timePerQuestion')}</span>
              <span className={s.infoPill}>{I.pct} {t('expert.certif.common.threshold', { value: test.seuilReussite })}</span>
            </div>
          </div>
        </div>
      </div>
      <div className={s.infoBlockTitle}>{t('expert.certif.theoretical.contentTitle')}</div>
      <div className={s.testNavCards}>
        <button className={s.testNavCard} onClick={() => setPartie(1)}>
          <div className={s.testNavIcon} style={{ background:'#EEF2F8' }}>{I.image}</div>
          <div className={s.testNavContent}>
            <div className={s.testNavLabel}>{t('expert.certif.theoretical.part1')}</div>
            <div className={s.testNavName}>{t('expert.certif.theoretical.part1Name')}</div>
            <div className={s.testNavMeta}>
              <span className={`${s.partieCount} ${images.length>=10?s.partieOk:s.partieWarn}`}>
                {t('expert.certif.theoretical.part1Count', { count: images.length })}
              </span>
              {images.length >= 10
                ? <span className={s.partieOkTxt}>{I.check} {t('expert.certif.common.ready')}</span>
                : <span className={s.partieWarnTxt}>{I.warn} {t('expert.certif.common.incomplete')}</span>}
            </div>
          </div>
          <div className={s.testNavArrow}>{I.chevron}</div>
        </button>
        <button className={s.testNavCard} onClick={() => setPartie(2)}>
          <div className={s.testNavIcon} style={{ background:'#EEF2F8' }}>{I.qcm}</div>
          <div className={s.testNavContent}>
            <div className={s.testNavLabel}>{t('expert.certif.theoretical.part2')}</div>
            <div className={s.testNavName}>{t('expert.certif.theoretical.part2Name')}</div>
            <div className={s.testNavMeta}>
              <span className={`${s.partieCount} ${qcms.length>=10?s.partieOk:s.partieWarn}`}>
                {t('expert.certif.theoretical.part2Count', { count: qcms.length })}
              </span>
              {qcms.length >= 10
                ? <span className={s.partieOkTxt}>{I.check} {t('expert.certif.common.ready')}</span>
                : <span className={s.partieWarnTxt}>{I.warn} {t('expert.certif.theoretical.minRequired')}</span>}
            </div>
          </div>
          <div className={s.testNavArrow}>{I.chevron}</div>
        </button>
      </div>
      <div className={s.statsGrid} style={{ marginTop:'1rem' }}>
        <div className={s.statBox}>
          <div className={s.statNum}>{images.length}</div>
          <div className={s.statLbl}>{t('expert.certif.stats.imageQuestions')}</div>
        </div>
        <div className={s.statBox}>
          <div className={s.statNum}>{qcms.length}</div>
          <div className={s.statLbl}>{t('expert.certif.theoretical.qcmPool')}</div>
        </div>
        <div className={s.statBox}>
          <div className={s.statNum}>{test.seuilReussite}%</div>
          <div className={s.statLbl}>{t('expert.certif.common.successThreshold')}</div>
        </div>
        <div className={s.statBox}>
          <div className={s.statNum}>{test.nbSessions||0}</div>
          <div className={s.statLbl}>{t('expert.certif.theoretical.sessions')}</div>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════
   VUE TEST PRATIQUE
══════════════════════════════════════════════ */
function VuePratique({ testId, onBack }) {
  const { t, i18n } = useTranslation();
  const locale = i18n.language || 'fr-FR';
  const [test,    setTest]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [errMsg,  setErrMsg]  = useState('');
  const [activeD, setActiveD] = useState(null);

  useEffect(() => {
    setLoading(true); setErrMsg(''); setTest(null);
    if (!testId) { setErrMsg(t('expert.certif.practical.noTest')); setLoading(false); return; }
    api.get(`/expert-audit/tests-pratiques/${testId}`)
      .then(r => setTest(r.data))
      .catch(e => setErrMsg(
        t('expert.certif.practical.loadError', { id: testId, message: e.response?.data?.message || e.message })
      ))
      .finally(() => setLoading(false));
  }, [testId]);

  if (loading) return <div className={s.centerLoad}><Spin/> {t('expert.certif.practical.loading')}</div>;
  if (errMsg)  return (
    <div className={s.vueWrap}>
      <div className={s.subNav}>
        <button className={s.backBtn} onClick={onBack}>{I.back} {t('expert.certif.common.overview')}</button>
      </div>
      <div style={{ background:'#FEF2F2', border:'1px solid #FECACA',
        borderRadius:12, padding:'1rem 1.25rem', fontSize:'.84rem', color:'#DC2626' }}>
        {errMsg}
      </div>
    </div>
  );

  const defauts = test.defauts || [];

  return (
    <div className={s.vueWrap}>
      <div className={s.subNav}>
        <button className={s.backBtn} onClick={onBack}>{I.back} {t('expert.certif.common.overview')}</button>
      </div>
      <div className={s.heroCard} style={{ marginBottom:'1rem' }}>
        <div className={s.heroLeft}>
          <div className={s.heroIconWrap} style={{ background:'#EEF2F8', color:'#002855' }}>
            {I.tool}
          </div>
          <div>
            <div className={s.heroTitle}>{test.titre}</div>
            {test.description && <div className={s.heroDesc}>{test.description}</div>}
            <div className={s.heroBadgeRow}>
              <span className={s.statutBadge}>{test.actif ? t('commun.actif') : t('commun.inactif')}</span>
              <span className={s.infoPill}>{I.pct} {t('expert.certif.common.threshold', { value: test.seuilReussite })}</span>
              <span className={s.infoPill}>{I.list} {t('expert.certif.practical.defectsCount', { count: defauts.length })}</span>
            </div>
          </div>
        </div>
      </div>
      <div className={s.statsGrid} style={{ marginBottom:'1.25rem' }}>
        <div className={s.statBox}>
          <div className={s.statNum}>{defauts.length}</div>
          <div className={s.statLbl}>{t('expert.certif.practical.hiddenDefects')}</div>
        </div>
        <div className={s.statBox}>
          <div className={s.statNum}>{test.seuilReussite}%</div>
          <div className={s.statLbl}>{t('expert.certif.common.successThreshold')}</div>
        </div>
        <div className={s.statBox}>
          <div className={s.statNum}>{test.actif ? '✓' : '—'}</div>
          <div className={s.statLbl}>{t('commun.statut')}</div>
        </div>
        <div className={s.statBox}>
          <div className={s.statNum}>{fmtDate(test.dateCreation, locale).split(' ')[2]||'—'}</div>
          <div className={s.statLbl}>{t('expert.certif.practical.creationYear')}</div>
        </div>
      </div>
      <div className={s.infoBlockTitle}>
        {t('expert.certif.practical.preparedDefects')}
      </div>
      <div className={s.qList}>
        {defauts.length === 0 && (
          <div className={s.emptyDefauts}>
            {I.warn} {t('expert.certif.practical.noDefects')}
          </div>
        )}
        {defauts.map((d, i) => (
          <div key={d.id} className={`${s.dCard} ${activeD===d.id?s.dCardOpen:''}`}>
            <button className={s.dCardHeader}
              onClick={() => setActiveD(activeD===d.id?null:d.id)}>
              <div className={s.dNum}>{d.numero || i+1}</div>
              <div className={s.dMain}>
                <span className={s.dType}>{d.typeDefaut}</span>
                {d.localisation && (
                  <span className={s.dLoc}>{I.pin} {d.localisation}</span>
                )}
              </div>
              <span className={`${s.qChevron} ${activeD===d.id?s.qChevronOpen:''}`}>
                {I.chevron}
              </span>
            </button>
            {activeD===d.id && (
              <div className={s.dCardBody}>
                {d.localisation && (
                  <div className={s.dRow}>
                    <span className={s.dRowLabel}>{I.pin} {t('commun.localisation')}</span>
                    <span className={s.dRowVal}>{d.localisation}</span>
                  </div>
                )}
                {d.mesureReelle && (
                  <div className={s.dRow}>
                    <span className={s.dRowLabel}>{I.pct} {t('expert.certif.practical.actualMeasure')}</span>
                    <span className={s.dRowVal}>{d.mesureReelle}</span>
                  </div>
                )}
                {d.valeurAcceptable && (
                  <div className={s.dRow}>
                    <span className={s.dRowLabel}>{I.check} {t('expert.certif.practical.acceptableValue')}</span>
                    <span className={s.dRowVal}>{d.valeurAcceptable}</span>
                  </div>
                )}
                {d.observations && (
                  <div className={s.dObservations}>{d.observations}</div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════
   COMPOSANT PRINCIPAL
══════════════════════════════════════════════ */
export default function CertifDetail({ certif, onClose }) {
  const { t } = useTranslation();
  const [vue, setVue] = useState('general');
  useEffect(() => { setVue('general'); }, [certif?.id]);
  if (!certif) return null;

  const TABS = [
    { id:'general',   label:t('expert.certif.common.overview'),   icon:I.shield },
    { id:'theorique', label:t('expert.certif.composition.theoretical'),  icon:I.book   },
    { id:'pratique',  label:t('expert.certif.composition.practical'),   icon:I.tool   },
  ];

  return (
    <div className={s.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={s.modal}>
        <div className={s.modalHead}>
          <div className={s.modalHeadLeft}>
            <div className={s.modalHeadIcon}>{I.shield}</div>
            <div>
              <div className={s.modalHeadTitle}>{certif.titre}</div>
              <div className={s.modalHeadSub}>{t('expert.certif.detail.title')}</div>
            </div>
          </div>
          <button className={s.closeBtn} onClick={onClose}>{I.x}</button>
        </div>

        <div className={s.tabs}>
          {TABS.map(t => (
            <button key={t.id}
              className={`${s.tab} ${vue===t.id ? s.tabActive : ''}`}
              onClick={() => setVue(t.id)}>
              <span className={s.tabIcon}>{t.icon}</span>
              {t.label}
            </button>
          ))}
        </div>

        <div className={s.modalBody}>
          {vue === 'general'   && (
            <VueGenerale
              certifId={certif.id}
              onGoTheo={() => setVue('theorique')}
              onGoPrat={() => setVue('pratique')}
            />
          )}
          {vue === 'theorique' && (
            <VueTheorique testId={certif.testTheoriqueId} onBack={() => setVue('general')} />
          )}
          {vue === 'pratique'  && (
            <VuePratique  testId={certif.testPratiqueId}  onBack={() => setVue('general')} />
          )}
        </div>
      </div>
    </div>
  );
}