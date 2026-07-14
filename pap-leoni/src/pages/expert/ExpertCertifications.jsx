import { useState, useEffect,useRef, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../../services/api';
import CertifDetail from './CertifDetail';
import ModalGenererCertificat from '../../components/certif/ModalGenererCertificat';
import ModalQrCode from '../../components/certif/ModalQrCode';
import ModalReponsesTheoriques from '../../components/certif/ModalReponsesTheoriques';
/* ─── Icons ─── */
const Ico = {
  shield:  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  plus:    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  eye:     <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>,
  edit:    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  trash:   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>,
  check:   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>,
  warn:    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
  arrow:   <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>,
  book:    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>,
  tool:    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>,
  lock:    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>,
  unlock:  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 0 9.9-1"/></svg>,
  users:   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  pdf:     <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>,
  bell:    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>,
  play:    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>,
  pause:   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  certif:  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/></svg>,
  clock:   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  expire:  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>,
  draft:   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>,
  report:  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>,
  ok:      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>,
};

function fmtDate(d, locale = 'fr-FR') {
  if (!d) return '—';
  return new Date(d).toLocaleDateString(locale, { day: '2-digit', month: 'short', year: 'numeric' });
}

function joursRestants(dateDeblocage) {
  if (!dateDeblocage) return null;
  const diff = new Date(dateDeblocage) - new Date();
  if (diff <= 0) return 0;
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

const CSS = `
@keyframes fadeUp  { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:none} }
@keyframes rowIn   { from{opacity:0;transform:translateX(-6px)} to{opacity:1;transform:none} }
@keyframes spin    { to{transform:rotate(360deg)} }
@keyframes popIn   { from{opacity:0;transform:scale(.94)} to{opacity:1;transform:scale(1)} }
@keyframes fadeIn  { from{opacity:0} to{opacity:1} }
.ec-row { transition:background .12s; }
.ec-row:hover { background:#F8FAFC !important; }
.ec-spin { width:14px;height:14px;border:2px solid rgba(255,255,255,.3);border-top-color:#fff;border-radius:50%;animation:spin .6s linear infinite;display:inline-block }
.ec-spin-dark { border-color:#E2E8F0;border-top-color:#2563EB; }
.rapport-preview { width:100%;height:420px;border:none;border-radius:10px;display:block }
div:has(> div > button[style*="minWidth"])::-webkit-scrollbar { display:none }
`;

function Spinner({ dark }) {
  return <span className={`ec-spin${dark ? ' ec-spin-dark' : ''}`} />;
}

/* ─── Badge statut passage ─── */
function Badge({ statut }) {
  const { t } = useTranslation();
  const label = t(`expert.badges.${statut}`, statut);
  const MAP = {
    EN_ATTENTE:            { color: '#C8982A', bg: '#e9e1c1' },
    FORMATION_OBLIGATOIRE: { color: '#6D28D9', bg: '#d3cde8' },
    THEORIQUE_EN_COURS:    { color: '#0057B8', bg: '#cddbec' },
    THEORIQUE_ECHOUE:      { color: '#DC2626', bg: '#e8c6c6' },
    PRATIQUE_EN_COURS:     { color: '#7C3AED', bg: '#cbc5e5' },
    PRATIQUE_ECHOUE:       { color: '#DC2626', bg: '#ebd2d2' },
    RAPPORT_VALIDE:        { color: '#059669', bg: '#ddeae4',border:'#70c080' },
    CERTIFIE:              { color: '#059669', bg: '#cae4d7' },
    BLOQUE:                { color: '#6B7280', bg: '#F3F4F6' },
    ANNULE:                { color: '#9CA3AF', bg: '#c3d5e6' },
  };
  const cfg = MAP[statut] || { color: '#6B7280', bg: '#F3F4F6' };
  return (
    <span style={{ background: cfg.bg, color: cfg.color, fontSize: '.68rem', fontWeight: 700, padding: '2px 9px', borderRadius: 99 }}>
      {label}
    </span>
  );
}

function EmptyState({ icon, title, sub, action, onAction }) {
  return (
    <div style={{ textAlign: 'center', padding: '4rem 2rem', background: '#fff', borderRadius: 14, border: '1.5px dashed #E2E8F0' }}>
      <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>{icon}</div>
      <p style={{ fontWeight: 700, color: '#374151', margin: '0 0 6px', fontSize: '1rem' }}>{title}</p>
      {sub && <p style={{ fontSize: '.84rem', color: '#94A3B8', margin: '0 0 1rem' }}>{sub}</p>}
      {action && (
        <button onClick={onAction} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#0B1E3D', border: 'none', borderRadius: 10, padding: '10px 22px', color: '#fff', fontWeight: 700, fontSize: '.88rem', cursor: 'pointer', fontFamily: 'inherit' }}>
          {action}
        </button>
      )}
    </div>
  );
}

function ActionBtn({ title, onClick, children, danger, disabled }) {
  return (
    <button onClick={onClick} disabled={disabled} title={title}
      style={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8, border: `1.5px solid ${danger ? '#FECACA' : '#E2E8F0'}`, background: danger ? '#FEF2F2' : '#fff', color: danger ? '#DC2626' : '#374151', cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? .6 : 1, flexShrink: 0 }}>
      {children}
    </button>
  );
}

/* ─── Modal Débloquer — pro avec cause obligatoire ─── */
function ModalDebloquer({ passage, onClose, onConfirm, loading }) {
  const { t } = useTranslation();
  const [cause, setCause] = useState('');
  const [err,   setErr]   = useState('');
  if (!passage) return null;
  const jours = joursRestants(passage.dateDeblocage);
  const canSubmit = cause.trim().length >= 10;

  const handleSubmit = () => {
    if (!canSubmit) { setErr(t('expert.certif.unlock.minLengthError', { min: 10 })); return; }
    setErr('');
    onConfirm(cause.trim());
  };

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.5)', zIndex:9999, display:'flex', alignItems:'center', justifyContent:'center', backdropFilter:'blur(4px)', animation:'fadeIn .18s ease' }}
      onClick={e => e.target===e.currentTarget && !loading && onClose()}>
      <div style={{ background:'#fff', borderRadius:20, width:'100%', maxWidth:480, overflow:'hidden', boxShadow:'0 32px 80px rgba(0,0,0,.22)', animation:'popIn .2s ease' }}>
        <div style={{ background:'linear-gradient(135deg,#0B1E3D,#059669)', padding:'18px 22px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <div style={{ width:40, height:40, borderRadius:11, background:'rgba(240, 188, 188, 0.15)', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff' }}>
              {Ico.unlock}
            </div>
            <div>
              <div style={{ fontWeight:800, color:'#fafafa', fontSize:'1rem' }}>{t('expert.certif.unlock.title')}</div>
              <div style={{ fontSize:'.72rem', color:'rgba(255,255,255,.6)', marginTop:2 }}>{t('expert.certif.unlock.subtitle')}</div>
            </div>
          </div>
          <button onClick={onClose} disabled={loading}
            style={{ width:30, height:30, borderRadius:8, background:'rgba(255,255,255,.12)', border:'none', cursor:'pointer', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <div style={{ padding:'22px 24px' }}>
          <div style={{ background:'#F8FAFC', borderRadius:12, padding:'14px 16px', marginBottom:18, border:'1px solid #E2E8F0', display:'flex', alignItems:'center', gap:12 }}>
            <div style={{ width:42, height:42, borderRadius:11, background:'#FEF2F2', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:800, color:'#DC2626', fontSize:'1rem', border:'1.5px solid #FECACA', flexShrink:0 }}>
              {(passage.auditeurNom||'A').charAt(0).toUpperCase()}
            </div>
            <div>
              <div style={{ fontWeight:700, fontSize:'.9rem', color:'#0B1E3D' }}>{passage.auditeurNom}</div>
              <div style={{ fontSize:'.73rem', color:'#64748B', marginTop:2, display:'flex', alignItems:'center', gap:8 }}>
                <span style={{ background:'#F1F5F9', border:'1px solid #E2E8F0', borderRadius:5, padding:'1px 7px', fontWeight:600 }}>{passage.auditeurMatricule}</span>
                <span>{passage.certificationTitre || '—'}</span>
                {jours !== null && jours > 0 && (
                  <span style={{ color:'#DC2626', fontWeight:700 }}>{t('expert.certif.unlock.daysRemaining', { days: jours })}</span>
                )}
              </div>
            </div>
          </div>
          <div style={{ marginBottom:18 }}>
            <label style={{ display:'block', fontSize:'.72rem', fontWeight:700, color:'#374151', textTransform:'uppercase', letterSpacing:'.06em', marginBottom:7 }}>
              {t('expert.certif.unlock.causeLabel')} <span style={{ color:'#DC2626' }}>*</span>
              <span style={{ textTransform:'none', fontWeight:500, color:'#9CA3AF', marginLeft:6 }}>{t('expert.certif.unlock.causeHint', { min: 10 })}</span>
            </label>
            <textarea
              value={cause}
              onChange={e => { setCause(e.target.value); setErr(''); }}
              rows={4}
              placeholder={t('expert.certif.unlock.placeholder')}
              style={{ width:'100%', padding:'10px 14px', border:`1.5px solid ${err?'#FECACA':canSubmit?'#A7F3D0':'#D1D5DB'}`, borderRadius:10, fontSize:'.84rem', fontFamily:'inherit', outline:'none', resize:'vertical', boxSizing:'border-box', color:'#111827', lineHeight:1.6 }}
            />
            <div style={{ display:'flex', justifyContent:'space-between', marginTop:5 }}>
              {err && <span style={{ fontSize:'.72rem', color:'#DC2626', fontWeight:600 }}>{err}</span>}
              <span style={{ fontSize:'.7rem', color: canSubmit?'#059669':'#9CA3AF', fontWeight:600, marginLeft:'auto' }}>
                {t('expert.certif.unlock.minChars', { count: cause.trim().length, min: 10 })}{canSubmit && ' ✓'}
              </span>
            </div>
          </div>
          <div style={{ display:'flex', gap:10 }}>
            <button onClick={onClose} disabled={loading}
              style={{ flex:1, padding:'11px', borderRadius:10, border:'1.5px solid #E2E8F0', background:'#fff', fontWeight:700, fontSize:'.88rem', cursor:'pointer', color:'#374151', fontFamily:'inherit' }}>
              {t('commun.annuler')}
            </button>
            <button onClick={handleSubmit} disabled={loading || !canSubmit}
              style={{ flex:2, padding:'11px', borderRadius:10, border:'none', background: canSubmit&&!loading?'#059669':'#D1D5DB', color:'#fff', fontWeight:700, fontSize:'.88rem', cursor: canSubmit&&!loading?'pointer':'not-allowed', fontFamily:'inherit', display:'flex', alignItems:'center', justifyContent:'center', gap:7, boxShadow: canSubmit?'0 2px 8px rgba(5,150,105,.3)':'none', transition:'all .15s' }}>
              {loading ? <><Spinner /> {t('expert.certif.unlock.loading')}</> : <>{Ico.unlock} {t('expert.certif.unlock.confirm')}</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Modal Delete ─── */
function ModalDelete({ item, typeLabel, onClose, onConfirm, loading }) {
  const { t } = useTranslation();
  if (!item) return null;
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'fadeIn .18s ease' }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: '#fff', borderRadius: 18, padding: '2rem', maxWidth: 400, width: '90%', boxShadow: '0 20px 60px rgba(0,0,0,.2)', animation: 'popIn .2s ease' }}>
        <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
          <h3 style={{ margin: '0 0 8px', fontWeight: 800, color: '#0B1E3D', fontSize: '1.1rem' }}>
            {t('certification.confirmerSuppression')}
          </h3>
          <p style={{ margin: 0, fontSize: '.85rem', color: '#64748B' }}>
            {typeLabel} <strong>«{item.titre || item.nom || item.id}»</strong>{t('certification.actionIrreversible')}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onClose} style={{ flex: 1, padding: '11px', borderRadius: 10, border: '1.5px solid #E2E8F0', background: '#fff', fontWeight: 700, fontSize: '.88rem', cursor: 'pointer', color: '#374151', fontFamily: 'inherit' }}>
            {t('commun.annuler')}
          </button>
          <button onClick={onConfirm} disabled={loading}
            style={{ flex: 1, padding: '11px', borderRadius: 10, border: 'none', background: '#DC2626', color: '#fff', fontWeight: 700, fontSize: '.88rem', cursor: 'pointer', opacity: loading ? .5 : 1, fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            {loading ? <Spinner /> : t('commun.supprimer')}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Panel Edit Test ─── */
function PanelEditTest({ test, type, onClose, onSaved }) {
  const { t } = useTranslation();
  const [titre, setTitre] = useState('');
  const [seuil, setSeuil] = useState(70);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => {
    if (test) { setTitre(test.titre || ''); setSeuil(test.seuilReussite || 70); }
  }, [test]);

  if (!test) return null;

  const handleSave = async () => {
    if (!titre.trim()) { setErr(t('commun.obligatoire')); return; }
    setSaving(true); setErr('');
    try {
      const url = type === 'theorique' ? `/expert-audit/tests/${test.id}` : `/expert-audit/tests-pratiques/${test.id}`;
      const res = await api.put(url, { titre: titre.trim(), seuilReussite: Number(seuil) });
      onSaved(res.data); onClose();
    } catch (e) { setErr(e.response?.data?.message || t('commun.erreur')); }
    setSaving(false);
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.4)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'fadeIn .18s ease' }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: '#fff', borderRadius: 18, padding: '2rem', maxWidth: 520, width: '92%', boxShadow: '0 20px 60px rgba(0,0,0,.2)', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, fontWeight: 800, color: '#0B1E3D' }}>{t('certification.modifierTest')}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', fontSize: '1.2rem' }}>✕</button>
        </div>
        {err && <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, padding: '.6rem', fontSize: '.82rem', color: '#DC2626' }}>{err}</div>}
        <div>
          <label style={{ fontSize: '.72rem', fontWeight: 700, textTransform: 'uppercase', color: '#6B7280', display: 'block', marginBottom: 5 }}>{t('commun.nom')}</label>
          <input value={titre} onChange={e => setTitre(e.target.value)}
            style={{ width: '100%', padding: '.65rem .9rem', border: '1.5px solid #E2E8F0', borderRadius: 10, fontSize: '.9rem', fontWeight: 600, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }} />
        </div>
        <div>
          <label style={{ fontSize: '.72rem', fontWeight: 700, textTransform: 'uppercase', color: '#6B7280', display: 'block', marginBottom: 5 }}>
            {t('certification.seuil')} : <strong>{seuil}%</strong>
          </label>
          <input type="range" min={50} max={100} step={5} value={seuil} onChange={e => setSeuil(+e.target.value)} style={{ width: '100%', accentColor: '#0B1E3D' }} />
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 'auto' }}>
          <button onClick={onClose} style={{ flex: 1, padding: '10px', borderRadius: 10, border: '1.5px solid #E2E8F0', background: '#fff', fontWeight: 700, fontSize: '.88rem', cursor: 'pointer', color: '#374151', fontFamily: 'inherit' }}>
            {t('commun.annuler')}
          </button>
          <button onClick={handleSave} disabled={saving}
            style={{ flex: 1, padding: '10px', borderRadius: 10, border: 'none', background: '#0B1E3D', color: '#fff', fontWeight: 700, fontSize: '.88rem', cursor: 'pointer', opacity: saving ? .5 : 1, fontFamily: 'inherit' }}>
            {saving ? <Spinner /> : `✓ ${t('commun.enregistrer')}`}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Panel Valider Rapport ─── */
// Dans ExpertCertifications.jsx — Remplacer PanelValiderRapport
function PanelValiderRapport({ passage, onClose, onDecision }) {
  const { t, i18n } = useTranslation();
  const locale = i18n.language || 'fr-FR';
 
  const [saving, setSaving]               = useState(false);
  const [err, setErr]                     = useState('');
  const [commentaire, setCommentaire]     = useState('');
  const [score, setScore]                 = useState('');
  const [confirmInvalid, setConfirmInvalid] = useState(false);
  const [valideSuccess, setValideSuccess] = useState(null);
 
  // ── NOUVEAU : afficher les réponses théoriques ──
  const [showRepTheo, setShowRepTheo]     = useState(false);
 
  // ✅ Guard EN PREMIER
  if (!passage) return null;
 
  const seuilPratique = passage.seuilPratique ?? passage.certificationSeuilPratique ?? 80;
  const scoreNum  = parseFloat(score);
  const scoreValide = score !== '' && !isNaN(scoreNum) && scoreNum >= 0 && scoreNum <= 100;
  const scoreReussi = scoreValide && scoreNum >= seuilPratique;
  const scoreEchoue = scoreValide && scoreNum < seuilPratique;
  const baseUrl = (import.meta.env?.VITE_API_URL || 'http://localhost:8080/api').replace('/api', '');
  const pdfUrl = passage.rapportPdfNom
    ? `${baseUrl}/uploads/rapports-pratiques/${passage.rapportPdfNom}`
    : null;
 
  if (valideSuccess) {
    return (
      <ModalGenererCertificat
        passage={valideSuccess}
        onClose={() => { setValideSuccess(null); onClose(); }}
        onUpdated={(updated) => {
          setValideSuccess(null);
          onDecision(updated);
          onClose();
        }}
      />
    );
  }
 
  const handleValider = async () => {
    if (!scoreValide) { setErr(t('expert.certif.reportValidation.scoreRequired')); return; }
    setSaving(true); setErr('');
    try {
      const res = await api.post(`/expert-audit/passages/${passage.id}/valider-pratique`, {
        valide: true, commentaire: commentaire.trim(), score: scoreNum
      });
      setValideSuccess(res.data);
    } catch (e) { setErr(e.response?.data?.message || t('commun.erreur')); }
    setSaving(false);
  };
 
  const handleInvalider = async () => {
    if (!scoreValide) { setErr(t('expert.certif.reportValidation.scoreRequired')); return; }
    if (!confirmInvalid) { setConfirmInvalid(true); return; }
    setSaving(true); setErr('');
    try {
      const res = await api.post(`/expert-audit/passages/${passage.id}/valider-pratique`, {
        valide: false, commentaire: commentaire.trim(), score: scoreNum
      });
      onDecision(res.data); onClose();
    } catch (e) { setErr(e.response?.data?.message || t('commun.erreur')); }
    setSaving(false);
  };
 
  return (
    <>
      {/* ── Modal réponses théoriques (s'ouvre par-dessus) ── */}
      {showRepTheo && (
        <ModalReponsesTheoriques
          passageId={passage.id}
          auditeurNom={passage.auditeurNom}
          role="expert"
          onClose={() => setShowRepTheo(false)}
        />
      )}
 
      <div style={{
          position:'fixed', inset:0, background:'rgba(0,0,0,.55)', zIndex:9999,
          display:'flex', alignItems:'center', justifyContent:'center',
          animation:'fadeIn .18s ease', padding:'1rem'
        }}
        onClick={e => e.target===e.currentTarget && !saving && onClose()}>
        <div style={{
            background:'#fff', borderRadius:20, width:'100%',
            maxWidth:950, maxHeight:'95vh', overflowY:'auto',
            boxShadow:'0 24px 80px rgba(0,0,0,.2)', animation:'popIn .2s ease',
            display:'flex', flexDirection:'column'
          }}>
 
          {/* Header */}
          <div style={{ background:'#0B1E3D', borderRadius:'20px 20px 0 0', padding:'1.25rem 1.5rem', display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0 }}>
            <div style={{ display:'flex', alignItems:'center', gap:12 }}>
              <span style={{ display:'inline-flex',alignItems:'center',justifyContent:'center',width:28,height:28,borderRadius:8,background:'rgba(255,255,255,.15)' }}>{Ico.report}</span>
              <div>
                <div style={{ fontWeight:800, color:'#fff', fontSize:'1rem' }}>{t('expert.certif.reportValidation.title')}</div>
                <div style={{ fontSize:'.76rem', color:'rgba(255,255,255,.5)', marginTop:2 }}>
                  {passage.auditeurNom} ({passage.auditeurMatricule}) · {passage.certificationTitre}
                </div>
              </div>
            </div>
            <button onClick={onClose} disabled={saving}
              style={{ background:'rgba(255,255,255,.15)',border:'none',cursor:'pointer',color:'#fff',width:32,height:32,borderRadius:8,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'1rem' }}>✕</button>
          </div>
 
          {/* ── NOUVEAU : Barre de consultation réponses théoriques ── */}
          <div style={{ padding:'10px 16px', background:'#EFF6FF', borderBottom:'1px solid #BFDBFE', display:'flex', alignItems:'center', gap:10, flexShrink:0 }}>
            <button
              onClick={() => setShowRepTheo(true)}
              style={{ display:'flex', alignItems:'center', gap:7, padding:'7px 16px', background:'#1D4ED8', color:'#fff', border:'none', borderRadius:9, fontSize:'.8rem', fontWeight:700, cursor:'pointer', fontFamily:'inherit', boxShadow:'0 2px 8px rgba(29,78,216,.25)' }}>
               Voir réponses test théorique
            </button>
            <span style={{ fontSize:'.75rem', color:'#1E40AF', fontWeight:600 }}>
              Consultez les réponses de l'auditeur avant de noter le rapport pratique
            </span>
          </div>
 
          {/* Contenu en 2 colonnes */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 380px', flex:1, minHeight:0 }}>
 
            {/* Colonne gauche : rapport PDF */}
            <div style={{ borderRight:'1px solid #E2E8F0', display:'flex', flexDirection:'column', minHeight:0 }}>
              <div style={{ padding:'12px 16px', borderBottom:'1px solid #E2E8F0', display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0 }}>
                <span style={{ fontSize:'.85rem', fontWeight:700, color:'#374151', display:'flex', alignItems:'center', gap:6 }}>
                  {Ico.pdf} {t('expert.certif.reportValidation.reportLabel')}
                </span>
                <div style={{ display:'flex', gap:8 }}>
                  {pdfUrl && (
                    <>
                      <a href={pdfUrl} target="_blank" rel="noopener noreferrer"
                        title={t('expert.certif.reportValidation.openNewTab')}
                        aria-label={t('expert.certif.reportValidation.openNewTab')}
                        style={{ display:'flex',alignItems:'center',gap:5,padding:'5px 11px',background:'#0B1E3D',color:'#fff',border:'none',borderRadius:7,cursor:'pointer',fontSize:'.75rem',fontWeight:700,textDecoration:'none' }}>
                        <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                      </a>
                      <a href={pdfUrl} download
                        style={{ display:'flex',alignItems:'center',gap:5,padding:'5px 11px',background:'#EFF6FF',color:'#2563EB',border:'1px solid #BFDBFE',borderRadius:7,cursor:'pointer',fontSize:'.75rem',fontWeight:700,textDecoration:'none' }}>
                        {Ico.pdf} {t('commun.telecharger')}
                      </a>
                    </>
                  )}
                </div>
              </div>
              <div style={{ flex:1, padding:'12px', minHeight:0 }}>
                {pdfUrl ? (
                  <iframe
                    src={`${pdfUrl}#toolbar=1&navpanes=0`}
                    style={{ width:'100%', height:'100%', minHeight:500, border:'none', borderRadius:10, display:'block' }}
                    title="Rapport pratique"
                  />
                ) : (
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100%', flexDirection:'column', gap:12, color:'#94A3B8' }}>
                    <div style={{ fontSize:'2rem' }}>📄</div>
                    <p style={{ fontWeight:600, fontSize:'.88rem', margin:0 }}>{t('expert.certif.reportValidation.noPdf')}</p>
                  </div>
                )}
              </div>
            </div>
 
            {/* Colonne droite : formulaire notation */}
            <div style={{ padding:'1.25rem', display:'flex', flexDirection:'column', gap:'1rem', overflowY:'auto' }}>
              {/* Infos auditeur */}
              <div style={{ background:'#F8FAFC', borderRadius:10, padding:'12px 14px', border:'1px solid #E2E8F0' }}>
                <div style={{ fontSize:'.72rem', fontWeight:700, color:'#9CA3AF', textTransform:'uppercase', marginBottom:8 }}>{t('audit.auditeur')}</div>
                {[
                  [t('commun.nom'), passage.auditeurNom],
                  [t('commun.matricule'), passage.auditeurMatricule],
                  [t('expert.certif.reportValidation.qualification'), passage.certificationTitre],
                  [t('commun.date'), new Date(passage.dateDebut).toLocaleDateString(locale)],
                ].map(([k, v]) => (
                  <div key={k} style={{ display:'flex', justifyContent:'space-between', padding:'4px 0', borderBottom:'1px solid #F0F4FA' }}>
                    <span style={{ fontSize:'.75rem', color:'#64748B' }}>{k}</span>
                    <span style={{ fontSize:'.75rem', fontWeight:700, color:'#0B1E3D' }}>{v || '—'}</span>
                  </div>
                ))}
              </div>
 
              {/* Score */}
              <div style={{ background: scoreValide ? (scoreReussi?'#ECFDF5':'#FEF2F2') : '#FFF7ED',
                border: `1.5px solid ${scoreValide ? (scoreReussi?'#A7F3D0':'#FECACA') : '#FCD34D'}`,
                borderRadius: 12, padding: '1rem' }}>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8 }}>
                  <label style={{ fontSize:'.72rem', fontWeight:700, textTransform:'uppercase', color:'#374151', letterSpacing:'.06em' }}>
                    {t('expert.certif.reportValidation.scoreLabel')} <span style={{ color:'#DC2626', fontWeight:800 }}>({t('expert.certif.reportValidation.required')})</span>
                  </label>
                  <span style={{ fontSize:'.72rem', fontWeight:700, color: scoreReussi ? '#059669' : scoreEchoue ? '#DC2626' : '#9CA3AF' }}>
                    {t('expert.certif.reportValidation.requiredThreshold', { value: seuilPratique })}
                  </span>
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                  <input type="number" min="0" max="100" step="0.5" value={score}
                    onChange={e => { setScore(e.target.value); setErr(''); setConfirmInvalid(false); }}
                    placeholder={t('expert.certif.reportValidation.scorePlaceholder')}
                    style={{ width:90, padding:'10px 12px',
                             border: `1.5px solid ${scoreReussi?'#059669':scoreEchoue?'#DC2626':'#D1D5DB'}`,
                             borderRadius:9, fontSize:'1.1rem', fontWeight:700, fontFamily:'inherit',
                             outline:'none', textAlign:'center',
                             color: scoreReussi?'#059669' : scoreEchoue?'#DC2626' : '#111827' }}
                  />
                  <span style={{ fontSize:'.9rem', fontWeight:700, color:'#64748B' }}>/ 100</span>
                  {scoreReussi && (
                    <span style={{ background:'#ECFDF5', borderRadius:8, padding:'4px 10px', fontSize:'.8rem', fontWeight:700, color:'#059669' }}>
                      {t('expert.certif.reportValidation.passed', { score: scoreNum })}
                    </span>
                  )}
                  {scoreEchoue && (
                    <span style={{ background:'#FEF2F2', borderRadius:8, padding:'4px 10px', fontSize:'.8rem', fontWeight:700, color:'#DC2626' }}>
                      {t('expert.certif.reportValidation.insufficient', { score: scoreNum, threshold: seuilPratique })}
                    </span>
                  )}
                </div>
                {scoreEchoue && (
                  <div style={{ marginTop:10, background:'#FFF1F1', border:'1px solid #FECACA', borderRadius:8, padding:'8px 12px', fontSize:'.78rem', color:'#DC2626', lineHeight:1.6 }}>
                    {t('expert.certif.reportValidation.scoreBelowOnlyInvalidate')}
                  </div>
                )}
              </div>
 
              {/* Commentaire */}
              <div>
                <label style={{ fontSize:'.72rem', fontWeight:700, textTransform:'uppercase', color:'#6B7280', display:'block', marginBottom:5 }}>
                  {t('commun.commentaire')} <span style={{ textTransform:'none', fontWeight:400, color:'#9CA3AF' }}>({t('commun.optionnel')})</span>
                </label>
                <textarea value={commentaire} onChange={e => setCommentaire(e.target.value)} rows={3}
                  placeholder={t('expert.certif.reportValidation.commentPlaceholder')}
                  style={{ width:'100%', padding:'.65rem .9rem', border:'1.5px solid #E2E8F0', borderRadius:10, fontSize:'.84rem', outline:'none', fontFamily:'inherit', resize:'vertical', boxSizing:'border-box' }}
                />
              </div>
 
              {err && (
                <div style={{ background:'#FEF2F2', border:'1px solid #FECACA', borderRadius:8, padding:'.6rem', fontSize:'.82rem', color:'#DC2626' }}>{err}</div>
              )}
 
              {confirmInvalid && (
                <div style={{ background:'#FFF7ED', border:'1.5px solid #FED7AA', borderRadius:12, padding:'1rem', fontSize:'.85rem', color:'#92400E', fontWeight:600 }}>
                  {t('expert.certif.reportValidation.confirmInvalidate')}
                </div>
              )}
 
              <div style={{ display:'flex', flexDirection:'column', gap:8, marginTop:'auto' }}>
                <button onClick={handleValider} disabled={saving || !scoreReussi}
                  style={{ padding:'13px', borderRadius:12, border:'none',
                    background: scoreReussi && !saving ? '#059669' : '#D1D5DB',
                    color:'#fff', fontWeight:800, fontSize:'.92rem',
                    cursor: scoreReussi && !saving ? 'pointer' : 'not-allowed',
                    fontFamily:'inherit', display:'flex', alignItems:'center', justifyContent:'center', gap:8,
                    boxShadow: scoreReussi ? '0 4px 12px rgba(5,150,105,.3)' : 'none',
                    transition:'all .15s', opacity: scoreEchoue ? 0.4 : 1 }}>
                  {saving
                    ? <><span style={{ width:14,height:14,border:'2px solid rgba(255,255,255,.3)',borderTopColor:'#fff',borderRadius:'50%',animation:'spin .6s linear infinite',display:'inline-block' }}/> {t('expert.certif.reportValidation.loading')}</>
                    : <>✓ {t('expert.certif.reportValidation.validateAndGenerate')}</>
                  }
                </button>
 
                <button onClick={handleInvalider} disabled={saving || !scoreValide}
                  style={{ padding:'12px', borderRadius:12,
                    border: confirmInvalid ? '2px solid #DC2626' : '1.5px solid #FECACA',
                    background: confirmInvalid ? '#DC2626' : scoreEchoue ? '#FEF2F2' : '#F9FAFB',
                    color: confirmInvalid ? '#fff' : scoreEchoue ? '#DC2626' : '#D1D5DB',
                    fontWeight:700, fontSize:'.88rem',
                    cursor: saving || !scoreValide ? 'not-allowed' : 'pointer',
                    fontFamily:'inherit', display:'flex', alignItems:'center', justifyContent:'center', gap:8,
                    transition:'all .15s' }}>
                  {confirmInvalid ? t('expert.certif.reportValidation.confirmInvalidation') : t('expert.certif.reportValidation.invalidateReport')}
                </button>
              </div>
 
              <div style={{ fontSize:'.72rem', color:'#94A3B8', textAlign:'center', lineHeight:1.5 }}>
                {t('expert.certif.reportValidation.ruleSummary', { threshold: seuilPratique })}
              </div>
 
              <div style={{ fontSize:'.72rem', color:'#94A3B8', textAlign:'center', lineHeight:1.5 }}>
                {t('expert.certif.reportValidation.footerNote')}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
function PanelParams({ certif, onClose, onSaved, onActivate }) {
  const { t, i18n } = useTranslation();
  const locale = i18n.language || 'fr-FR';
 
  // ── Champs éditables ──
  const [titre,          setTitre]         = useState('');
  const [testTheoId,     setTestTheoId]    = useState('');
  const [testPratId,     setTestPratId]    = useState('');
  const [formationUrl,   setFormationUrl]  = useState('');
  const [formationNom,   setFormationNom]  = useState('');
  const [clientId,       setClientId]      = useState('');
 
  // ── Listes pour les selects ──
  const [testsTheo,      setTestsTheo]     = useState([]);
  const [testsPrat,      setTestsPrat]     = useState([]);
  const [formations,     setFormations]    = useState([]);
  const [clients,        setClients]       = useState([]);
  const [loadingData,    setLoadingData]   = useState(false);
 
  // ── Upload formation ──
  const [uploadingForm,  setUploadingForm] = useState(false);
  const fileInputRef = useRef(null);
 
  // ── Actions certif ──
  const [pendingDeactivate, setPendingDeactivate] = useState(false);
  const [saving,            setSaving]            = useState(false);
  const [err,               setErr]               = useState('');
  const [success,           setSuccess]           = useState('');
 
  // ── Onglet actif dans le panel ──
  const [activeSection, setActiveSection] = useState('general'); // general | tests | formation
 
  useEffect(() => {
    if (!certif) return;
    setTitre(certif.titre || '');
    setTestTheoId(certif.testTheoriqueId ? String(certif.testTheoriqueId) : '');
    setTestPratId(certif.testPratiqueId  ? String(certif.testPratiqueId)  : '');
    setFormationUrl(certif.formationUrl  || '');
    setFormationNom(certif.formationNom  || '');
    setClientId(certif.clientId          ? String(certif.clientId)        : '');
    setPendingDeactivate(false);
    setErr(''); setSuccess('');
 
    // Charger les listes
    setLoadingData(true);
    Promise.allSettled([
      api.get('/expert-audit/tests/all'),
      api.get('/expert-audit/tests-pratiques/all'),
      api.get('/expert-audit/certifications/formations').catch(() => ({ data: [] })),
      api.get('/expert-audit/clients').catch(() => ({ data: [] })),
    ]).then(([tt, tp, fo, cl]) => {
      setTestsTheo  (tt.status === 'fulfilled' ? (tt.value.data || []) : []);
      setTestsPrat  (tp.status === 'fulfilled' ? (tp.value.data || []) : []);
      setFormations (fo.status === 'fulfilled' ? (fo.value.data || []) : []);
      setClients    (cl.status === 'fulfilled' ? (cl.value.data || []) : []);
    }).finally(() => setLoadingData(false));
  }, [certif]);
 
  if (!certif) return null;
 
  // ── Upload fichier formation ──
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingForm(true); setErr('');
    try {
      const base64 = await new Promise((res, rej) => {
        const r = new FileReader();
        r.onload  = () => res(r.result.split(',')[1]);
        r.onerror = rej;
        r.readAsDataURL(file);
      });
      const resp = await api.post(
        `/expert-audit/certifications/${certif.id}/formation/upload`,
        { base64, nomFichier: file.name }
      );
      setFormationUrl(resp.data.formationUrl || '');
      setFormationNom(resp.data.formationNom || file.name);
      setSuccess(t('expert.certif.params.uploadSuccess'));
    } catch (e) { setErr(e.response?.data?.message || t('expert.certif.params.uploadError')); }
    setUploadingForm(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };
 
  // ── Choisir une formation existante ──
  const handlePickFormation = (fo) => {
    setFormationUrl(fo.formationUrl);
    setFormationNom(fo.formationNom);
  };
 
  // ── Sauvegarder ──
  const handleSave = async () => {
    if (!titre.trim()) { setErr(t('commun.obligatoire')); return; }
    setSaving(true); setErr(''); setSuccess('');
    try {
      // 1. Désactiver si demandé
      if (pendingDeactivate && certif.actif)
        await api.post(`/expert-audit/certifications/${certif.id}/desactiver`);
 
      // 2. Mettre à jour tous les champs
      const res = await api.put(`/expert-audit/certifications/${certif.id}`, {
        titre:          titre.trim(),
        testTheoriqueId: testTheoId  ? Number(testTheoId)  : null,
        testPratiqueId:  testPratId  ? Number(testPratId)  : null,
        formationUrl:    formationUrl || null,
        formationNom:    formationNom || null,
        clientId:        clientId    ? Number(clientId)    : null,
      });
 
      setSuccess(t('expert.certif.params.updateSuccess'));
      onSaved(res.data);
      setTimeout(onClose, 900);
    } catch (e) { setErr(e.response?.data?.message || t('commun.erreur')); }
    setSaving(false);
  };
 
  // ── Activer directement ──
  const handleActivate = async () => {
    setSaving(true); setErr('');
    try {
      await api.post(`/expert-audit/certifications/${certif.id}/activer`);
      onActivate(certif.id);
      onClose();
    } catch (e) { setErr(e.response?.data?.message || t('commun.erreur')); }
    setSaving(false);
  };
 
  /* ── Styles ── */
  const INP = {
    width: '100%', padding: '9px 12px', border: '1.5px solid #E2E8F0',
    borderRadius: 9, fontSize: '.88rem', fontFamily: 'inherit', outline: 'none',
    background: '#fff', boxSizing: 'border-box', color: '#0B1E3D',
  };
  const LBL = {
    display: 'block', fontSize: '.69rem', fontWeight: 800, color: '#64748B',
    textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 5,
  };
  const SEL_BTN = (active) => ({
    flex: 1, padding: '8px 10px', border: 'none', borderRadius: 7, cursor: 'pointer',
    fontFamily: 'inherit', fontSize: '.8rem', fontWeight: active ? 800 : 600,
    background: active ? '#0B1E3D' : 'transparent',
    color:      active ? '#fff'    : '#64748B',
    transition: 'all .15s',
  });
 
  const sections = [
    { key: 'general',   label: t('expert.certif.params.sections.general') },
    { key: 'tests',     label: t('expert.certif.params.sections.tests') },
    { key: 'formation', label: t('expert.certif.params.sections.formation') },
  ];
 
  return (
    <div
      style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.5)', zIndex:9999,
               display:'flex', alignItems:'center', justifyContent:'center',
               animation:'fadeIn .18s ease', padding:'1rem' }}
      onClick={e => e.target===e.currentTarget && !saving && onClose()}>
 
      <div style={{ background:'#fff', borderRadius:20, width:'100%', maxWidth:620,
                    maxHeight:'92vh', overflowY:'auto', boxShadow:'0 24px 80px rgba(0,0,0,.22)',
                    animation:'popIn .2s ease', display:'flex', flexDirection:'column' }}>
 
        {/* ── Header ── */}
        <div style={{ background:'linear-gradient(135deg,#0B1E3D,#1E3A5F)',
                      borderRadius:'20px 20px 0 0', padding:'18px 22px',
                      display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0 }}>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <div style={{ width:40, height:40, borderRadius:11, background:'rgba(255,255,255,.12)',
                          display:'flex', alignItems:'center', justifyContent:'center', color:'#93C5FD' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
            </div>
            <div>
              <div style={{ fontWeight:800, color:'#fff', fontSize:'1rem' }}>{t('expert.certif.params.title')}</div>
              <div style={{ fontSize:'.72rem', color:'rgba(255,255,255,.5)', marginTop:2 }}>{certif.titre}</div>
            </div>
          </div>
          <button onClick={onClose} disabled={saving}
            style={{ width:32, height:32, borderRadius:8, background:'rgba(255,255,255,.12)',
                     border:'none', cursor:'pointer', color:'#fff',
                     display:'flex', alignItems:'center', justifyContent:'center' }}>
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
 
        {/* ── Statut badge ── */}
        <div style={{ padding:'10px 22px', borderBottom:'1px solid #EEF2F8',
                      display:'flex', alignItems:'center', gap:10, flexShrink:0,
                      background:'#F8FAFC' }}>
          <span style={{ fontSize:'.75rem', color:'#64748B', fontWeight:600 }}>{t('commun.statut')} :</span>
          {certif.actif ? (
            <span style={{ display:'inline-flex', alignItems:'center', gap:5, background:'#ECFDF5',
                           color:'#059669', border:'1px solid #A7F3D0', borderRadius:99,
                           padding:'3px 10px', fontSize:'.73rem', fontWeight:700 }}>
              <span style={{ width:6, height:6, borderRadius:'50%', background:'#059669' }}/>
              {t('commun.actif')}
            </span>
          ) : (
            <span style={{ display:'inline-flex', alignItems:'center', gap:5, background:'#F1F5F9',
                           color:'#64748B', border:'1px solid #E2E8F0', borderRadius:99,
                           padding:'3px 10px', fontSize:'.73rem', fontWeight:700 }}>
              {t('commun.inactif')}
            </span>
          )}
          {certif.clientNom && (
            <span style={{ fontSize:'.73rem', color:'#C8982A', fontWeight:700,
                           background:'#FFFBEB', border:'1px solid #FCD34D',
                           borderRadius:99, padding:'3px 10px' }}>
              {certif.clientNom}
            </span>
          )}
          <span style={{ marginLeft:'auto', fontSize:'.7rem', color:'#94A3B8' }}>
            {t('expert.certif.params.idLabel', { id: certif.id })}
          </span>
        </div>
 
        {/* ── Navigation sections ── */}
        <div style={{ display:'flex', gap:4, padding:'10px 22px', borderBottom:'1px solid #EEF2F8',
                      background:'#F8FAFC', flexShrink:0 }}>
          {sections.map(s => (
            <button key={s.key} onClick={() => setActiveSection(s.key)} style={SEL_BTN(activeSection===s.key)}>
              {s.label}
            </button>
          ))}
        </div>
 
        {/* ── Contenu ── */}
        <div style={{ padding:'20px 22px', display:'flex', flexDirection:'column', gap:'1rem', flex:1 }}>
 
          {/* Messages */}
          {err     && <div style={{ background:'#FEF2F2', border:'1px solid #FECACA', borderRadius:9, padding:'9px 13px', fontSize:'.82rem', color:'#DC2626' }}>{err}</div>}
          {success && <div style={{ background:'#ECFDF5', border:'1px solid #A7F3D0', borderRadius:9, padding:'9px 13px', fontSize:'.82rem', color:'#059669' }}>✓ {success}</div>}
 
          {/* ════ SECTION : GÉNÉRAL ════ */}
          {activeSection === 'general' && (<>
 
            {/* Nom */}
            <div>
              <label style={LBL}>{t('expert.certif.params.nameLabel')} <span style={{ color:'#DC2626' }}>*</span></label>
              <input value={titre} onChange={e => { setTitre(e.target.value); setErr(''); }}
                style={INP} placeholder={t('expert.certif.params.namePlaceholder')} />
            </div>
 
            {/* Client */}
            <div>
              <label style={LBL}>{t('expert.certif.params.clientLabel')}</label>
              {loadingData ? (
                <div style={{ fontSize:'.82rem', color:'#94A3B8', padding:'8px 0' }}>{t('commun.chargement')}</div>
              ) : (
                <select value={clientId} onChange={e => setClientId(e.target.value)} style={INP}>
                  <option value="">{t('expert.certif.params.noClient')}</option>
                  {clients.map(c => (
                    <option key={c.id} value={String(c.id)}>{c.nom}{c.code ? ` (${c.code})` : ''}</option>
                  ))}
                </select>
              )}
            </div>
 
            {/* Infos en lecture seule */}
            <div style={{ background:'#F8FAFC', borderRadius:10, padding:'12px 14px', border:'1px solid #E2E8F0' }}>
              <div style={{ fontSize:'.69rem', fontWeight:800, color:'#94A3B8', textTransform:'uppercase', letterSpacing:'.07em', marginBottom:8 }}>{t('expert.certif.params.infoTitle')}</div>
              {[
                [t('expert.certif.params.info.theoreticalThreshold'),  `${certif.seuilTheorique ?? '—'}%`],
                [t('expert.certif.params.info.createdAt'),     certif.dateCreation ? new Date(certif.dateCreation).toLocaleDateString(locale) : '—'],
                [t('expert.certif.params.info.expiresAt'),   certif.dateExpiration ? new Date(certif.dateExpiration).toLocaleDateString(locale) : '—'],
                [t('expert.certif.params.info.questionCount'),     t('expert.certif.params.info.questionCountValue', {
                  total: (certif.nbQuestionsQCM||0)+(certif.nbQuestionsImage||0),
                  images: certif.nbQuestionsImage||0,
                  qcm: certif.nbQuestionsQCM||0,
                })],
              ].map(([k, v]) => (
                <div key={k} style={{ display:'flex', justifyContent:'space-between', padding:'5px 0', borderBottom:'1px solid #F0F4FA' }}>
                  <span style={{ fontSize:'.77rem', color:'#64748B' }}>{k}</span>
                  <span style={{ fontSize:'.77rem', fontWeight:700, color:'#0B1E3D' }}>{v}</span>
                </div>
              ))}
            </div>
 
            {/* Activer / Désactiver */}
            <div style={{ border:`1.5px solid ${certif.actif ? (pendingDeactivate?'#DC2626':'#FECACA') : '#A7F3D0'}`,
                          borderRadius:11, padding:'14px 16px',
                          background: certif.actif ? (pendingDeactivate?'#FEF2F2':'#FFFBFB') : '#F0FDF4' }}>
              {certif.actif ? (<>
                <div style={{ fontSize:'.82rem', fontWeight:700, color: pendingDeactivate?'#DC2626':'#374151', marginBottom:8 }}>
                  {pendingDeactivate ? t('expert.certif.params.deactivatePending') : t('expert.certif.params.deactivateTitle')}
                </div>
                <div style={{ fontSize:'.77rem', color:'#64748B', marginBottom:10 }}>
                  {pendingDeactivate
                    ? t('expert.certif.params.deactivateWarn')
                    : t('expert.certif.params.deactivateDesc')}
                </div>
                {!pendingDeactivate ? (
                  <button onClick={() => setPendingDeactivate(true)}
                    style={{ padding:'7px 14px', borderRadius:8, border:'1px solid #FECACA', background:'#FEF2F2', color:'#DC2626', fontWeight:700, fontSize:'.82rem', cursor:'pointer', fontFamily:'inherit' }}>
                    {t('expert.certif.params.markForDeactivation')}
                  </button>
                ) : (
                  <button onClick={() => setPendingDeactivate(false)}
                    style={{ padding:'7px 14px', borderRadius:8, border:'1px solid #E2E8F0', background:'#fff', color:'#64748B', fontWeight:700, fontSize:'.82rem', cursor:'pointer', fontFamily:'inherit' }}>
                    {t('expert.certif.params.cancelDeactivation')}
                  </button>
                )}
              </>) : (<>
                <div style={{ fontSize:'.82rem', fontWeight:700, color:'#059669', marginBottom:6 }}>
                  {t('expert.certif.params.activateTitle')}
                </div>
                <div style={{ fontSize:'.77rem', color:'#64748B', marginBottom:10 }}>
                  {t('expert.certif.params.activateDesc')}
                </div>
                <button onClick={handleActivate} disabled={saving}
                  style={{ padding:'7px 14px', borderRadius:8, border:'1px solid #A7F3D0', background:'#ECFDF5', color:'#059669', fontWeight:700, fontSize:'.82rem', cursor:'pointer', fontFamily:'inherit', display:'flex', alignItems:'center', gap:6 }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                  {t('expert.certif.params.activateNow')}
                </button>
              </>)}
            </div>
 
          </>)}
 
          {/* ════ SECTION : TESTS ════ */}
          {activeSection === 'tests' && (<>
 
            {/* Test Théorique */}
            <div>
              <label style={LBL}>{t('expert.certif.params.theoreticalTest')}</label>
              {loadingData ? (
                <div style={{ fontSize:'.82rem', color:'#94A3B8', padding:'8px 0' }}>{t('expert.certif.params.loadingTests')}</div>
              ) : (
                <select value={testTheoId} onChange={e => setTestTheoId(e.target.value)} style={INP}>
                  <option value="">{t('expert.certif.params.noTheoreticalTest')}</option>
                  {testsTheo.map(tt => (
                    <option key={tt.id} value={String(tt.id)}>
                      {tt.titre} {tt.actif ? '✓' : ''} · {(tt.nbQuestionsImage||0)+(tt.nbQuestionsQCM||0)} {t('expert.certif.params.questions')}
                    </option>
                  ))}
                </select>
              )}
              {testTheoId && testsTheo.find(t => String(t.id)===testTheoId) && (() => {
                const t = testsTheo.find(x => String(x.id)===testTheoId);
                return (
                  <div style={{ marginTop:6, background:'#EFF6FF', border:'1px solid #BFDBFE', borderRadius:8, padding:'8px 12px', fontSize:'.77rem', color:'#1D4ED8', display:'flex', gap:12 }}>
                    <span>{t.nbQuestionsImage||0} {t('expert.certif.params.images')}</span>
                    <span>{t.nbQuestionsQCMPool||0} {t('expert.certif.params.qcmPool')}</span>
                    <span>{t('expert.certif.params.threshold')} : {t.seuilReussite}%</span>
                    {t.actif && <span style={{ fontWeight:700 }}>✓ {t('commun.actif')}</span>}
                  </div>
                );
              })()}
            </div>
 
            {/* Test Pratique */}
            <div>
              <label style={LBL}>{t('expert.certif.params.practicalTest')}</label>
              {loadingData ? (
                <div style={{ fontSize:'.82rem', color:'#94A3B8', padding:'8px 0' }}>{t('commun.chargement')}</div>
              ) : (
                <select value={testPratId} onChange={e => setTestPratId(e.target.value)} style={INP}>
                  <option value="">{t('expert.certif.params.noPracticalTest')}</option>
                  {testsPrat.map(tp => (
                    <option key={tp.id} value={String(tp.id)}>
                      {tp.titre} {tp.actif ? '✓' : ''} · {tp.nbDefauts||0} {t('expert.certif.params.defects')}
                    </option>
                  ))}
                </select>
              )}
              {testPratId && testsPrat.find(t => String(t.id)===testPratId) && (() => {
                const t = testsPrat.find(x => String(x.id)===testPratId);
                return (
                  <div style={{ marginTop:6, background:'#F5F3FF', border:'1px solid #DDD6FE', borderRadius:8, padding:'8px 12px', fontSize:'.77rem', color:'#7C3AED', display:'flex', gap:12 }}>
                    <span>{t.nbDefauts||0} {t('expert.certif.params.hiddenDefects')}</span>
                    <span>{t('expert.certif.params.threshold')} : {t.seuilReussite}%</span>
                    {t.actif && <span style={{ fontWeight:700 }}>✓ {t('commun.actif')}</span>}
                  </div>
                );
              })()}
            </div>
 
            {/* Avertissement si tests non actifs */}
            {(testTheoId && testsTheo.find(t => String(t.id)===testTheoId && !t.actif)) && (
              <div style={{ background:'#FFFBEB', border:'1px solid #FCD34D', borderRadius:8, padding:'9px 12px', fontSize:'.8rem', color:'#92400E' }}>
                {t('expert.certif.params.theoreticalInactiveWarning')}
              </div>
            )}
 
          </>)}
 
          {/* ════ SECTION : FORMATION ════ */}
          {activeSection === 'formation' && (<>
 
            {/* Formation actuelle */}
            {formationNom && (
              <div style={{ background:'#ECFDF5', border:'1px solid #A7F3D0', borderRadius:10, padding:'10px 14px', display:'flex', alignItems:'center', gap:10 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2" strokeLinecap="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                </svg>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontWeight:700, fontSize:'.83rem', color:'#065F46', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                    {formationNom}
                  </div>
                  <div style={{ fontSize:'.7rem', color:'#059669', marginTop:2 }}>{t('expert.certif.params.currentTraining')}</div>
                </div>
                {formationUrl && (
                  <a href={`${(typeof window!=='undefined'&&window.location.origin)||''}/api/${formationUrl}`}
                     target="_blank" rel="noopener noreferrer"
                     style={{ fontSize:'.73rem', color:'#059669', fontWeight:700, textDecoration:'none', flexShrink:0 }}>
                    {t('commun.voir')} ↗
                  </a>
                )}
                <button onClick={() => { setFormationUrl(''); setFormationNom(''); }}
                  style={{ background:'none', border:'none', cursor:'pointer', color:'#DC2626', fontSize:'.82rem', flexShrink:0 }}>
                  ✕
                </button>
              </div>
            )}
 
            {/* Upload nouvelle formation */}
            <div>
              <label style={LBL}>{t('expert.certif.params.uploadNew')}</label>
              <div style={{ border:'2px dashed #E2E8F0', borderRadius:10, padding:'20px', textAlign:'center', cursor:'pointer',
                            background:'#F8FAFC', transition:'border-color .15s' }}
                onClick={() => fileInputRef.current?.click()}
                onDragOver={e => e.preventDefault()}
                onDrop={e => { e.preventDefault(); const f=e.dataTransfer.files[0]; if(f){const ev={target:{files:[f]}}; handleFileUpload(ev);} }}>
                <input type="file" ref={fileInputRef} style={{ display:'none' }}
                  accept=".pdf,.doc,.docx,.ppt,.pptx"
                  onChange={handleFileUpload} />
                {uploadingForm ? (
                  <div style={{ color:'#64748B', fontSize:'.84rem' }}>
                    <span style={{ width:14, height:14, border:'2px solid #E2E8F0', borderTopColor:'#0B1E3D', borderRadius:'50%', animation:'spin .6s linear infinite', display:'inline-block', marginRight:6 }}/>
                    {t('expert.certif.params.uploading')}
                  </div>
                ) : (
                  <>
                    <div style={{ fontSize:'1.5rem', marginBottom:6 }}>📎</div>
                    <div style={{ fontWeight:700, color:'#374151', fontSize:'.85rem' }}>{t('expert.certif.params.dropzoneTitle')}</div>
                    <div style={{ fontSize:'.75rem', color:'#94A3B8', marginTop:4 }}>{t('expert.certif.params.dropzoneTypes')}</div>
                  </>
                )}
              </div>
            </div>
 
            {/* Bibliothèque de formations */}
            {formations.length > 0 && (
              <div>
                <label style={LBL}>{t('expert.certif.params.libraryTitle', { count: formations.length })}</label>
                <div style={{ maxHeight:200, overflowY:'auto', border:'1.5px solid #E2E8F0', borderRadius:10, background:'#fff' }}>
                  {formations.map((fo, i) => (
                    <div key={i}
                      onClick={() => handlePickFormation(fo)}
                      style={{ display:'flex', alignItems:'center', gap:10, padding:'9px 14px',
                               borderBottom: i<formations.length-1?'1px solid #F8FAFC':'none',
                               cursor:'pointer', transition:'background .12s',
                               background: formationNom===fo.formationNom ? '#EFF6FF' : '#fff' }}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                        <polyline points="14 2 14 8 20 8"/>
                      </svg>
                      <span style={{ flex:1, fontSize:'.82rem', fontWeight:600, color:'#374151', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                        {fo.formationNom}
                      </span>
                      {formationNom===fo.formationNom && (
                        <span style={{ fontSize:'.7rem', color:'#2563EB', fontWeight:700 }}>✓ {t('expert.certif.params.selected')}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
 
          </>)}
        </div>
 
        {/* ── Footer actions ── */}
        <div style={{ padding:'14px 22px', borderTop:'1px solid #EEF2F8', background:'#F8FAFC',
                      display:'flex', gap:10, flexShrink:0 }}>
          <button onClick={onClose} disabled={saving}
            style={{ flex:1, padding:'11px', borderRadius:10, border:'1.5px solid #E2E8F0',
                     background:'#fff', fontWeight:700, fontSize:'.88rem', cursor:'pointer',
                     color:'#374151', fontFamily:'inherit' }}>
            {t('commun.annuler')}
          </button>
          <button onClick={handleSave} disabled={saving}
            style={{ flex:2, padding:'11px', borderRadius:10, border:'none',
                     background: pendingDeactivate ? '#DC2626' : 'linear-gradient(135deg,#0B1E3D,#1E3A5F)',
                     color:'#fff', fontWeight:700, fontSize:'.88rem',
                     cursor: saving?'not-allowed':'pointer', opacity: saving?.7:1,
                     fontFamily:'inherit', display:'flex', alignItems:'center', justifyContent:'center', gap:7,
                     boxShadow:'0 4px 14px rgba(11,30,61,.25)' }}>
            {saving
              ? <><span style={{ width:13, height:13, border:'2px solid rgba(255,255,255,.3)', borderTopColor:'#fff', borderRadius:'50%', animation:'spin .6s linear infinite', display:'inline-block' }}/> {t('parametres.enregistrement')}</>
              : pendingDeactivate ? t('expert.certif.params.saveAndDeactivate') : t('expert.certif.params.saveChanges')
            }
          </button>
        </div>
      </div>
    </div>
  );
}
/* ─── Ligne passage ─── */
function ScorePill({ label, value, icon }) {
  return (
    <div style={{ display:'inline-flex', alignItems:'center', gap:5, background:'#fff', border:'1px solid #E2E8F0', borderRadius:7, padding:'3px 10px' }}>
      <span style={{ color:'#94A3B8', display:'flex', alignItems:'center', flexShrink:0 }}>{icon}</span>
      <span style={{ fontSize:'.67rem', color:'#6B7280', fontWeight:600 }}>{label}</span>
      <span style={{ fontSize:'.8rem', fontWeight:800, color:'#0B1E3D' }}>{value}%</span>
    </div>
  );
}

function PassageRow({ p, idx, total, onValider, onDebloquer, onGenererCertif, onQr }) {
  const { t, i18n } = useTranslation();
  const locale = i18n.language || 'fr-FR';
  
  const hasRapport = p.rapportPratiqueJson && p.statut === 'PRATIQUE_EN_COURS';
  const isBloque   = p.statut === 'BLOQUE';
  const isReussi   = p.statut === 'RAPPORT_VALIDE' || p.statut === 'CERTIFIE';
  const jours      = joursRestants(p.dateDeblocage);
  const theoPct    = p.scoreTheoriquePct ?? (p.scoreTheorique != null ? Math.round(p.scoreTheorique * 100 / 20) : null);
  const avatarBg   = isReussi ? '#bae0ce' : isBloque ? '#FEF2F2' : hasRapport ? '#EFF6FF' : '#F0F4FA';
  const avatarCol  = isReussi ? '#059669' : isBloque ? '#DC2626' : hasRapport ? '#1D4ED8' : '#0B1E3D';
  const rowBg      = hasRapport ? 'linear-gradient(90deg,#F0FDF4,#fff)' : isBloque ? '#FFFBFB' : undefined;

  // Construire les URLs API du certificat (avec /api)
  const API_BASE = 'http://localhost:8080/api';
  const viewCertifUrl = p.id ? `${API_BASE}/expert-audit/passages/${p.id}/certificat/view` : '';
  const downloadCertifUrl = p.id ? `${API_BASE}/expert-audit/passages/${p.id}/certificat/download` : '';

  const fetchPdfBlob = async (url) => {
    const token = localStorage.getItem('token');
    const res = await fetch(url, {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        Accept: 'application/pdf',
      },
    });
    if (!res.ok) throw new Error('Fichier indisponible');
    const ct = res.headers.get('content-type') || '';
    if (!ct.toLowerCase().includes('pdf')) throw new Error('Le serveur a retourné un contenu non-PDF');
    return res.blob();
  };

  const handleViewCertif = async () => {
    if (!viewCertifUrl) return;
    try {
      const blob = await fetchPdfBlob(viewCertifUrl);
      const blobUrl = URL.createObjectURL(blob);
      window.open(blobUrl, '_blank', 'noopener,noreferrer');
      setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);
    } catch (e) {
      window.alert(`Impossible d'ouvrir le PDF: ${e?.message || ''}`);
    }
  };

  const handleDownloadCertif = async () => {
    if (!downloadCertifUrl) return;
    try {
      const blob = await fetchPdfBlob(downloadCertifUrl);
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `certificat_${p.id || 'auditeur'}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    } catch (e) {
      window.alert(`Impossible de télécharger le PDF: ${e?.message || ''}`);
    }
  };
  return (
    <div className="ec-row"
      style={{ display:'flex', alignItems:'center', gap:14, padding:'13px 20px', borderBottom: idx < total-1 ? '1px solid #F1F5F9' : 'none', animation:`rowIn .3s ${idx*.04}s ease both`, background:rowBg, transition:'background .15s' }}>
      <div style={{ width:40, height:40, borderRadius:11, background:avatarBg, display:'flex', alignItems:'center', justifyContent:'center', fontWeight:800, fontSize:'.95rem', color:avatarCol, border:`1.5px solid ${isReussi?'#A7F3D0':isBloque?'#FECACA':hasRapport?'#BFDBFE':'#E2E8F0'}`, flexShrink:0 }}>
        {(p.auditeurNom || 'U').charAt(0).toUpperCase()}
      </div>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ display:'flex', alignItems:'center', gap:7, marginBottom:3, flexWrap:'wrap' }}>
          <span style={{ fontWeight:700, fontSize:'.87rem', color:'#0B1E3D', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
            {p.auditeurNom || '—'}
          </span>
          {p.auditeurMatricule && (
            <span style={{ fontSize:'.7rem', color:'#94A3B8', fontWeight:600, background:'#F8FAFC', border:'1px solid #E8EDF7', borderRadius:5, padding:'1px 6px' }}>
              {p.auditeurMatricule}
            </span>
          )}
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:6 }}>
          <span style={{ fontSize:'.73rem', color:'#64748B' }}>{p.certificationTitre || '—'}</span>
          {hasRapport && (
            <span style={{ display:'inline-flex', alignItems:'center', gap:4, background:'#EFF6FF', border:'1px solid #BFDBFE', borderRadius:99, padding:'1px 7px', fontSize:'.65rem', fontWeight:700, color:'#1D4ED8' }}>
              <svg viewBox="0 0 24 24" width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
              {t('expert.certif.passages.reportBadge')}
            </span>
          )}
          {isBloque && jours !== null && (
            <span style={{ fontSize:'.67rem', color:'#EF4444', fontWeight:600 }}>
              {t('expert.certif.passages.unlockIn', { days: jours })}
            </span>
          )}
        </div>
      </div>
      <Badge statut={p.statut} />
      <div style={{ display:'flex', alignItems:'center', gap:6, flexShrink:0 }}>
        {theoPct != null && (
          <ScorePill label={t('expert.certif.passages.theoryShort')} value={theoPct}
            icon={<svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>}
          />
        )}
        {p.scorePratique != null && (
          <ScorePill label={t('expert.certif.passages.practicalShort')} value={Math.round(p.scorePratique)}
            icon={<svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>}
          />
        )}
        <span style={{ fontSize:'.7rem', color:'#64748B', display:'flex', alignItems:'center', gap:3, flexShrink:0 }}>
          <svg viewBox="0 0 24 24" width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          {fmtDate(p.dateDebut, locale)}
        </span>
      </div>
      <div style={{ display:'flex', alignItems:'center', gap:6, flexShrink:0 }}>
        {isBloque && onDebloquer && (
          <button onClick={() => onDebloquer(p)}
            style={{ display:'flex', alignItems:'center', gap:5, padding:'6px 12px', background:'#ECFDF5', color:'#059669', border:'1px solid #A7F3D0', borderRadius:8, cursor:'pointer', fontSize:'.74rem', fontWeight:700, fontFamily:'inherit', whiteSpace:'nowrap' }}>
            {Ico.unlock} {t('certification.debloquer')}
          </button>
        )}
        {hasRapport && onValider && (
          <button onClick={() => onValider(p)}
            style={{ display:'flex', alignItems:'center', gap:5, padding:'6px 12px', background:'linear-gradient(135deg,#1D4ED8,#2563EB)', color:'#fff', border:'none', borderRadius:8, cursor:'pointer', fontSize:'.74rem', fontWeight:700, fontFamily:'inherit', boxShadow:'0 2px 8px rgba(37,99,235,.25)', whiteSpace:'nowrap' }}>
            {Ico.report} {t('expert.certif.passages.grade')}
          </button>
        )}
        
        {p.statut === 'RAPPORT_VALIDE' && p.statutCertificat === 'GENERE' && onGenererCertif && (
          <button onClick={() => onGenererCertif(p)}
            style={{ display:'flex',alignItems:'center',gap:5,padding:'6px 12px',background:'#b3d2ff',color:'#2563EB',border:'1px solid #BFDBFE',borderRadius:8,cursor:'pointer',fontSize:'.74rem',fontWeight:700,fontFamily:'inherit',whiteSpace:'nowrap' }}>
             {t('expert.certif.passages.sendToChef')}
          </button>
        )}
        {(p.statutCertificat === 'EN_ATTENTE_CHEF') && (
          <span style={{ fontSize:'.72rem',color:'#906605',fontWeight:700,background:'#e3d28f',border:'1px solid #FED7AA',borderRadius:7,padding:'4px 9px',whiteSpace:'nowrap' }}>
             {t('expert.certif.passages.waitingChef')}
          </span>
        )}
      {(p.statut === 'CERTIFIE' || p.statutCertificat === 'VALIDE_CHEF') &&
 p.certificatPdfPath && (
  <>
    <button onClick={handleViewCertif}
       style={{ display:'flex', alignItems:'center', gap:5, padding:'6px 10px',
                background:'#ECFDF5', color:'#059669', border:'1px solid #A7F3D0',
                borderRadius:8, fontSize:'.74rem', fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>
      {Ico.eye} Voir
    </button>
    <button onClick={handleDownloadCertif}
       style={{ display:'flex', alignItems:'center', gap:5, padding:'6px 10px',
                background:'#F0FDF4', color:'#059669', border:'1px solid #A7F3D0',
                borderRadius:8, fontSize:'.74rem', fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>
      {Ico.pdf} Télécharger
    </button>
    {/* NOUVEAU BOUTON QR */}
    {onQr && (
      <button onClick={() => onQr(p)}
        style={{ display:'flex', alignItems:'center', gap:5, padding:'6px 10px',
                 background:'#F5F3FF', color:'#7C3AED', border:'1px solid #DDD6FE',
                 borderRadius:8, fontSize:'.74rem', fontWeight:700, cursor:'pointer' }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
          <rect x="4" y="4" width="6" height="6" rx="1"/>
          <rect x="14" y="4" width="6" height="6" rx="1"/>
          <rect x="4" y="14" width="6" height="6" rx="1"/>
          <rect x="14" y="14" width="6" height="6" rx="1"/>
          <line x1="8" y1="10" x2="8" y2="14"/>
          <line x1="10" y1="8" x2="14" y2="8"/>
          <line x1="16" y1="10" x2="16" y2="14"/>
          <line x1="10" y1="16" x2="14" y2="16"/>
        </svg>
        QR
      </button>
    )}
  </>
)}
      </div>
    </div>
  );
}

function PassageList({ passages, emptyTitle, emptyIcon, onValider, onDebloquer, onGenererCertif, onQr }) {
  const { t } = useTranslation();
  if (passages.length === 0) return <EmptyState icon={emptyIcon} title={emptyTitle} />;
  return (
    <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #E2E8F0', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,.04)' }}>
      <div style={{ padding:'12px 20px', background:'linear-gradient(135deg,#F8FAFC,#F1F5F9)', borderBottom:'1px solid #E2E8F0', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <div style={{ width:6, height:6, borderRadius:'50%', background:'#0B1E3D' }}/>
          <span style={{ fontSize:'.75rem', fontWeight:700, color:'#374151', textTransform:'uppercase', letterSpacing:'.08em' }}>
            {t('expert.certif.passages.auditorsCount', { count: passages.length })}
          </span>
        </div>
        <span style={{ fontSize:'.72rem', color:'#94A3B8', fontWeight:600 }}>
          {passages.filter(p => p.scorePratique != null).length > 0 &&
            t('expert.certif.passages.practicalScoresRecorded', { count: passages.filter(p => p.scorePratique != null).length })}
        </span>
      </div>
      {passages.map((p, i) => (
        <PassageRow key={p.id} p={p} idx={i} total={passages.length}
          onValider={onValider} onDebloquer={onDebloquer} onGenererCertif={onGenererCertif}  onQr={onQr}/>
      ))}
    </div>
  );
}

function TestList({ items, type, onEdit, onDelete, onActiver, onDesactiver, toggling, renderMeta }) {
  const { t, i18n } = useTranslation();
  const locale = i18n.language || 'fr-FR';
  if (items.length === 0) return (
    <EmptyState title={`${t('commun.aucunResultat')} (${type})`}
      sub={t('expert.certif.testsCreesViaQualification')} />
  );
  return (
    <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #E2E8F0', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,.04)' }}>
      {items.map((item, idx) => (
        <div key={item.id} className="ec-row"
          style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px', borderBottom: idx < items.length - 1 ? '1px solid #F8FAFC' : 'none', animation: `rowIn .3s ${idx * .04}s ease both` }}>
          <div style={{ width: 40, height: 40, borderRadius: 11, flexShrink: 0, background: item.actif ? '#ECFDF5' : '#F9FAFB', color: item.actif ? '#059669' : '#9CA3AF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {type === 'theorique' ? Ico.book : Ico.tool}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
              <span style={{ fontWeight: 700, fontSize: '.9rem', color: '#0B1E3D' }}>{item.titre}</span>
              {item.actif && <span style={{ background: '#cfe4da', color: '#059669', fontSize: '.68rem', fontWeight: 700, padding: '2px 9px', borderRadius: 99 }}>{t('commun.actif')}</span>}
            </div>
            <div style={{ fontSize: '.75rem', color: '#64748B', fontWeight: 600 }}>
              {renderMeta(item)}
              {item.dateCreation && <span style={{ marginLeft: 8, color: '#b8c3d3' }}>· {fmtDate(item.dateCreation, locale)}</span>}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
            {!item.actif ? (
              <button onClick={() => onActiver(item.id)} disabled={!!toggling}
                style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', background: '#EFF6FF', color: '#2563EB', border: '1px solid #BFDBFE', borderRadius: 8, cursor: 'pointer', fontSize: '.78rem', fontWeight: 700, fontFamily: 'inherit' }}>
                {toggling === item.id ? <Spinner dark /> : <>{Ico.play} {t('commun.activer')}</>}
              </button>
            ) : (
              <button onClick={() => onDesactiver?.(item.id)} disabled={!!toggling}
                style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', background: '#FEE2E2', color: '#DC2626', border: '1px solid #FECACA', borderRadius: 8, cursor: 'pointer', fontSize: '.78rem', fontWeight: 700, fontFamily: 'inherit' }}>
                {toggling === item.id ? <Spinner dark /> : <>{Ico.lock} {t('commun.desactiver')}</>}
              </button>
            )}
            <ActionBtn title={t('commun.modifier')} onClick={() => onEdit(item)}>{Ico.edit}</ActionBtn>
            {!item.actif && <ActionBtn title={t('commun.supprimer')} onClick={() => onDelete(item)} danger>{Ico.trash}</ActionBtn>}
          </div>
        </div>
      ))}
    </div>
  );
}

function QualifList({ items, onDetail, onParams, onActivate, onDesactiver, onDelete, toggling, navigate }) {
  const { t } = useTranslation();
  if (items.length === 0) return (
    <EmptyState icon={Ico.shield}
      title={t('expert.certifications.aucuneQualification')}
      sub={t('expert.certifications.creerPremiere')}
      action={`+ ${t('expert.certifications.nouvelleQualification')}`}
      onAction={() => navigate('/expert/certif/creer', { state: { nouveau: true } })} />
  );
  return (
    <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #E2E8F0', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,.04)' }}>
      {items.map((c, i) => (
        <div key={c.id} className="ec-row"
          style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px', borderBottom: i < items.length - 1 ? '1px solid #F8FAFC' : 'none', animation: `fadeUp .3s ${i * .04}s ease both`, background: c.actif ? '#FAFFFE' : undefined }}>
          <div style={{ width: 4, height: 40, borderRadius: 99, background: c.actif ? '#059669' : 'transparent', flexShrink: 0 }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5, flexWrap: 'wrap' }}>
              <span style={{ fontWeight: 700, fontSize: '.9rem', color: '#0B1E3D' }}>{c.titre}</span>
              {c.actif && <span style={{ background: '#ECFDF5', color: '#059669', fontSize: '.68rem', fontWeight: 700, padding: '2px 9px', borderRadius: 99 }}>{t('commun.actif')}</span>}
              {c.joursAvantExpiration != null && c.joursAvantExpiration < 30 && (
                <span style={{ background: '#FFFBEB', color: '#C8982A', fontSize: '.68rem', fontWeight: 700, padding: '2px 9px', borderRadius: 99, display:'inline-flex', alignItems:'center', gap:4 }}>{Ico.warn} {c.joursAvantExpiration}j</span>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', fontSize: '.75rem', color: '#64748B', fontWeight: 600 }}>
              <span>{(c.nbQuestionsQCM || 0) + (c.nbQuestionsImage || 0)} {t('expert.certifications.questions')}</span>
              <span>·</span>
              <span>{t('certification.seuil')} {c.seuilTheorique}%</span>
              {c.joursAvantExpiration != null && <>
                <span>·</span>
                <span style={{ color: c.joursAvantExpiration < 30 ? '#DC2626' : '#94A3B8' }}>{c.joursAvantExpiration}j {t('commun.enRetard')}</span>
              </>}
              {c.formationNom && <><span>·</span><span style={{display:'inline-flex',alignItems:'center',gap:4}}>{Ico.pdf} {c.formationNom.slice(0, 20)}…</span></>}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 6, flexShrink: 0 }} onClick={e => e.stopPropagation()}>
            {!c.actif && (
              <button onClick={() => onActivate(c.id)} disabled={!!toggling}
                style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', background: '#d4dde9', color: '#2563EB', border: '1px solid #BFDBFE', borderRadius: 8, cursor: 'pointer', fontSize: '.78rem', fontWeight: 700, fontFamily: 'inherit' }}>
                {toggling === c.id ? <Spinner dark /> : <>{Ico.play} {t('commun.activer')}</>}
              </button>
            )}
            {c.actif && (
              <button onClick={() => onDesactiver(c.id)} disabled={!!toggling}
                style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', background: '#eddada', color: '#DC2626', border: '1px solid #FECACA', borderRadius: 8, cursor: 'pointer', fontSize: '.78rem', fontWeight: 700, fontFamily: 'inherit' }}>
                {toggling === c.id ? <Spinner dark /> : <>{Ico.lock} {t('commun.desactiver')}</>}
              </button>
            )}
            <ActionBtn title={t('commun.voir')} onClick={() => onDetail(c)}>{Ico.eye}</ActionBtn>
            <ActionBtn title={t('commun.modifier')} onClick={() => onParams(c)}>{Ico.edit}</ActionBtn>
            {!c.actif && <ActionBtn title={t('commun.supprimer')} onClick={() => onDelete(c)} danger>{Ico.trash}</ActionBtn>}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   COMPOSANT PRINCIPAL
════════════════════════════════════════════════════════════════ */
const TABS_KEYS = ['toutes','brouillons','theoriques','pratiques','en_attente','en_cours','certifiees','bloques','expirees'];

export default function ExpertCertifications() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const locale = i18n.language || 'fr-FR';
  const [searchParams] = useSearchParams();

  const [certifs,       setCertifs]       = useState([]);
  const [brouillons,    setBrouillons]    = useState([]);
  const [testsTheo,     setTestsTheo]     = useState([]);
  const [testsPrat,     setTestsPrat]     = useState([]);
  const [passages,      setPassages]      = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [tab,           setTab]           = useState(searchParams.get('tab') || 'toutes');
  const [detail,        setDetail]        = useState(null);
  const [params,        setParams]        = useState(null);
  const [editTest,      setEditTest]      = useState(null);
  const [editTestType,  setEditTestType]  = useState(null);
  const [deleteTarget,  setDeleteTarget]  = useState(null);
  const [deleteType,    setDeleteType]    = useState(null);
  const [deleting,      setDeleting]      = useState(false);
  const [toggling,      setToggling]      = useState(null);
  const [validerPassage,   setValiderPassage]   = useState(null);
  const [debloquerTarget,  setDebloquerTarget]  = useState(null);
  const [debloquant,       setDebloquant]       = useState(false);
  const [genererCertif,    setGenererCertif]    = useState(null); // ✅ useState correctement placé
const [qrTarget, setQrTarget] = useState(null);
  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [rC, rB, rTT, rTP, rAll] = await Promise.allSettled([
        api.get('/expert-audit/certifications/all'),
        api.get('/expert-audit/certifications/mes-brouillons'),
        api.get('/expert-audit/tests/all'),
        api.get('/expert-audit/tests-pratiques/all'),
        api.get('/expert-audit/passages/all').catch(() => ({ data: [] })),
      ]);
      setCertifs   (rC.status   === 'fulfilled' ? (rC.value.data   || []) : []);
      setBrouillons(rB.status   === 'fulfilled' ? (rB.value.data   || []) : []);
      setTestsTheo (rTT.status  === 'fulfilled' ? (rTT.value.data  || []) : []);
      setTestsPrat (rTP.status  === 'fulfilled' ? (rTP.value.data  || []) : []);
      setPassages  (rAll.status === 'fulfilled' ? (rAll.value.data || []) : []);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);
  useEffect(() => { const t = searchParams.get('tab'); if (t) setTab(t); }, [searchParams]);

  const handleActivate = async (id) => {
    setToggling(id);
    try { await api.post(`/expert-audit/certifications/${id}/activer`); fetchAll(); }
    catch (e) { alert(e.response?.data?.message || t('commun.erreur')); }
    setToggling(null);
  };

  const handleDesactiver = async (id) => {
    setToggling(id);
    try { await api.post(`/expert-audit/certifications/${id}/desactiver`); fetchAll(); }
    catch (e) { alert(e.response?.data?.message || t('commun.erreur')); }
    setToggling(null);
  };

  const activerTheo = async (id) => {
    setToggling(id);
    try { await api.post(`/expert-audit/tests/${id}/activer`); fetchAll(); }
    catch (e) {
      console.error('Erreur activation test théorique', e);
      const resp = e?.response;
      let msg = e?.message || t('commun.erreur');
      if (resp) {
        const d = resp.data;
        if (d) msg = typeof d === 'string' ? d : (d.message || JSON.stringify(d));
        else msg = resp.statusText || msg;
      }
      alert(msg);
    }
    setToggling(null);
  };

  const desactiverTheo = async (id) => {
    setToggling(id);
    try { await api.post(`/expert-audit/tests/${id}/desactiver`); fetchAll(); }
    catch (e) {
      console.error('Erreur désactivation test théorique', e);
      const resp = e?.response;
      let msg = e?.message || t('commun.erreur');
      if (resp) {
        const d = resp.data;
        if (d) msg = typeof d === 'string' ? d : (d.message || JSON.stringify(d));
        else msg = resp.statusText || msg;
      }
      alert(msg);
    }
    setToggling(null);
  };

  const activerPrat = async (id) => {
    setToggling(id);
    try { await api.post(`/expert-audit/tests-pratiques/${id}/activer`); fetchAll(); }
    catch (e) {
      console.error('Erreur activation test pratique', e);
      const resp = e?.response;
      let msg = e?.message || t('commun.erreur');
      if (resp) {
        const d = resp.data;
        if (d) msg = typeof d === 'string' ? d : (d.message || JSON.stringify(d));
        else msg = resp.statusText || msg;
      }
      alert(msg);
    }
    setToggling(null);
  };

  const desactiverPrat = async (id) => {
    setToggling(id);
    try { await api.post(`/expert-audit/tests-pratiques/${id}/desactiver`); fetchAll(); }
    catch (e) {
      console.error('Erreur désactivation test pratique', e);
      const resp = e?.response;
      let msg = e?.message || t('commun.erreur');
      if (resp) {
        const d = resp.data;
        if (d) msg = typeof d === 'string' ? d : (d.message || JSON.stringify(d));
        else msg = resp.statusText || msg;
      }
      alert(msg);
    }
    setToggling(null);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      if (deleteType === 'certif') {
        await api.delete(`/expert-audit/certifications/${deleteTarget.id}`);
        setCertifs(prev => prev.filter(c => c.id !== deleteTarget.id));
        setBrouillons(prev => prev.filter(b => b.id !== deleteTarget.id));
      } else if (deleteType === 'theorique') {
        await api.delete(`/expert-audit/tests/${deleteTarget.id}`);
        setTestsTheo(prev => prev.filter(t => t.id !== deleteTarget.id));
      } else {
        await api.delete(`/expert-audit/tests-pratiques/${deleteTarget.id}`);
        setTestsPrat(prev => prev.filter(t => t.id !== deleteTarget.id));
      }
      setDeleteTarget(null); setDeleteType(null);
    } catch (e) { alert(e.response?.data?.message || t('commun.erreur')); }
    setDeleting(false);
  };

  const handleDebloquer = async (cause) => {
    if (!debloquerTarget) return;
    setDebloquant(true);
    try {
      await api.post(`/expert-audit/passages/${debloquerTarget.id}/debloquer`, { cause });
      setDebloquerTarget(null);
      fetchAll();
    }
    catch (e) { alert(e.response?.data?.message || t('commun.erreur')); }
    setDebloquant(false);
  };
const handleQr = (passage) => {
  setQrTarget(passage);
};
  const qualificationsConfirmees = certifs.filter(c => !c.brouillon);
  const passSt = (statuts) => passages.filter(p => statuts.includes(p.statut));
  const rapportsEnAttente = passages.filter(p => p.rapportPratiqueJson && p.statut === 'PRATIQUE_EN_COURS').length;
  const activeCertifs = qualificationsConfirmees.filter(c => c.actif);

const TABS = [
  { key: 'toutes',         label: t('expert.certif.tabs.toutes') },
  { key: 'brouillons',     label: t('expert.certif.tabs.brouillons') },
  { key: 'theoriques',     label: t('expert.certif.tabs.theoriques') },
  { key: 'pratiques',      label: t('expert.certif.tabs.pratiques') },
  { key: 'en_attente',     label: t('expert.certif.tabs.enAttente') },
  { key: 'en_cours',       label: t('expert.certif.tabs.enCours') },
  { key: 'rapport_valide', label: t('expert.certif.tabs.rapportValide') },
  { key: 'attente_chef',   label: t('expert.certif.tabs.attenteChef') },
  { key: 'certifiees',     label: t('expert.certif.tabs.certifiees') },
  { key: 'bloques',        label: t('expert.certif.tabs.bloques') },
  { key: 'expirees',       label: t('expert.certif.tabs.expirees') },
];

  
const counts = {
  toutes:         qualificationsConfirmees.length,
  brouillons:     brouillons.length,
  theoriques:     testsTheo.length,
  pratiques:      testsPrat.length,
  en_attente:     passSt(['EN_ATTENTE','FORMATION_OBLIGATOIRE']).length,
  en_cours:       passSt(['THEORIQUE_EN_COURS','PRATIQUE_EN_COURS']).length,
  rapport_valide: passages.filter(p =>                          // ← NOUVEAU
    p.statut === 'RAPPORT_VALIDE' &&
    (!p.statutCertificat || p.statutCertificat === 'NON_GENERE' || p.statutCertificat === 'GENERE')
  ).length,
  attente_chef:   passages.filter(p =>                          // ← NOUVEAU
    p.statutCertificat === 'EN_ATTENTE_CHEF'
  ).length,
  certifiees:     passSt(['CERTIFIE']).length,
  bloques:        passSt(['BLOQUE']).length,
  expirees:       passSt(['EXPIRE']).length,
};

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '50vh', gap: 12, color: '#94A3B8', fontFamily: "'DM Sans',sans-serif" }}>
      <Spinner dark /> {t('expert.commun.chargement')}
    </div>
  );

  return (
    <div style={{ fontFamily: "'DM Sans',sans-serif", display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <style>{CSS}</style>

      {/* Bandeau active(s) */}
      {activeCertifs.length > 0 ? (
        <div style={{ background: '#0B1E3D', borderRadius: 14, padding: '1rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1 }}>
            <span style={{ width: 8, height: 8, background: '#4ADE80', borderRadius: '50%', boxShadow: '0 0 8px #4ADE80', display: 'inline-block', flexShrink: 0 }} />
            <div>
              <div style={{ fontWeight: 800, color: '#fff', fontSize: '.95rem' }}>
                {activeCertifs.length === 1 ? activeCertifs[0].titre : `${activeCertifs.length} ${t('expert.certif.qualifActives')}`}
              </div>
              <div style={{ fontSize: '.75rem', color: 'rgba(255,255,255,.4)', marginTop: 2 }}>
                {activeCertifs.map(c => c.clientNom || c.titre).join(' · ')}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={() => activeCertifs.length === 1 ? setDetail(activeCertifs[0]) : setTab('toutes')}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 8, background: 'rgba(255,255,255,.12)', border: '1px solid rgba(255,255,255,.2)', color: '#fff', cursor: 'pointer', fontFamily: 'inherit', fontSize: '.8rem', fontWeight: 700 }}>
              {Ico.eye} {t('commun.voir')}{activeCertifs.length > 1 ? ` (${activeCertifs.length})` : ''}
            </button>
            <button onClick={() => activeCertifs.length === 1 ? setParams(activeCertifs[0]) : setTab('toutes')}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 8, background: 'rgba(255,255,255,.12)', border: '1px solid rgba(255,255,255,.2)', color: '#fff', cursor: 'pointer', fontFamily: 'inherit', fontSize: '.8rem', fontWeight: 700 }}>
              {Ico.edit} {t('commun.modifier')}{activeCertifs.length > 1 ? ` (${activeCertifs.length})` : ''}
            </button>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#FFF7ED', border: '1px solid #FED7AA', borderRadius: 12, padding: '.875rem 1.25rem', fontSize: '.84rem', color: '#92400E' }}>
          {Ico.warn} <span>{t('expert.certif.aucuneActive')}</span>
        </div>
      )}
{/* Onglets */}
      <div style={{ background:'#fff', borderRadius:12, border:'1px solid #E8EDF7', boxShadow:'0 1px 3px rgba(0,0,0,.04)', overflowX:'auto', WebkitOverflowScrolling:'touch', scrollbarWidth:'none' }}>
        <div style={{ display:'flex', gap:4, padding:'6px', minWidth:'max-content' }}>
          {TABS.map(tabItem => {
            const isActive = tab === tabItem.key;
            const cnt = counts[tabItem.key];
            const hasAlert = tabItem.key === 'en_cours' && rapportsEnAttente > 0 && !isActive;
            return (
              <button key={tabItem.key} onClick={() => setTab(tabItem.key)}
                style={{ display:'inline-flex', alignItems:'center', gap:5, padding:'7px 12px', border:'none', cursor:'pointer', fontFamily:'inherit', fontSize:'.8rem', fontWeight: isActive ? 700 : 600, borderRadius:8, transition:'all .15s', position:'relative', background: isActive ? '#0B1E3D' : 'transparent', color: isActive ? '#fff' : '#64748B', whiteSpace:'nowrap', flexShrink:0 }}>
                {tabItem.label}
                {cnt > 0 && (
                  <span style={{ background: isActive ? 'rgba(255,255,255,.2)' : '#F1F5F9', color: isActive ? '#fff' : '#6B7280', fontSize:'.63rem', fontWeight:800, padding:'1px 6px', borderRadius:99 }}>
                    {cnt}
                  </span>
                )}
                {hasAlert && (
                  <span style={{ position:'absolute', top:5, right:5, width:6, height:6, background:'#10B981', borderRadius:'50%', boxShadow:'0 0 0 2px #fff' }}/>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Contenu */}
      <div style={{ animation: 'fadeUp .3s ease' }}>
        {tab === 'toutes' && (
          <QualifList items={qualificationsConfirmees} onDetail={setDetail} onParams={setParams}
            onActivate={handleActivate}
            onDesactiver={handleDesactiver}
            onDelete={c => { setDeleteTarget(c); setDeleteType('certif'); }}
            toggling={toggling} navigate={navigate} />
        )}

        {tab === 'brouillons' && (
          brouillons.length === 0
            ? <EmptyState title={t('expert.certif.aucunBrouillon')} sub={t('expert.certif.creerNouvelleQualif')} />
            : (
              <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #E2E8F0', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,.04)' }}>
                {brouillons.map((c, i) => (
                  <div key={c.id} className="ec-row"
                    style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px', borderBottom: i < brouillons.length - 1 ? '1px solid #F8FAFC' : 'none', cursor: 'pointer', animation: `rowIn .3s ${i * .04}s ease both` }}
                    onClick={() => navigate('/expert/certif/creer', { state: { brouillonId: c.id } })}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <span style={{ fontWeight: 700, fontSize: '.9rem', color: '#6B7280' }}>{c.titre || t('expert.certif.qualificationEnCreation')}</span>
                        <span style={{ background: '#F3F4F6', color: '#a07547', fontSize: '.65rem', fontWeight: 700, padding: '2px 9px', borderRadius: 99, display:'inline-flex', alignItems:'center', gap:4 }}>{Ico.draft} {t('commun.brouillon')}</span>
                      </div>
                      <div style={{ display: 'flex', gap: 12, fontSize: '.75rem' }}>
                        <span style={{ color: c.formationNom ? '#059669' : '#9CA3AF' }}>{t('certification.formation')} {c.formationNom ? '✓' : '—'}</span>
                        <span style={{ color: c.testTheoriqueId ? '#059669' : '#9CA3AF' }}>{t('audit.testTheorique')} {c.testTheoriqueId ? '✓' : '—'}</span>
                        <span style={{ color: c.testPratiqueId ? '#059669' : '#9CA3AF' }}>{t('audit.testPratique')} {c.testPratiqueId ? '✓' : '—'}</span>
                        {c.dateCreation && <span style={{ color: '#94A3B8' }}>· {fmtDate(c.dateCreation, locale)}</span>}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 6 }} onClick={e => e.stopPropagation()}>
                      <button onClick={() => navigate('/expert/certif/creer', { state: { brouillonId: c.id } })}
                        style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', background: '#EFF6FF', color: '#2563EB', border: '1px solid #BFDBFE', borderRadius: 8, cursor: 'pointer', fontSize: '.78rem', fontWeight: 700, fontFamily: 'inherit' }}>
                        {t('commun.suivant')} {Ico.arrow}
                      </button>
                      <ActionBtn title={t('commun.supprimer')} onClick={() => { setDeleteTarget(c); setDeleteType('certif'); }} danger>{Ico.trash}</ActionBtn>
                    </div>
                  </div>
                ))}
              </div>
            )
        )}

        {tab === 'theoriques' && (
          <TestList items={testsTheo} type="theorique"
            onEdit={item => { setEditTest(item); setEditTestType('theorique'); }}
            onDelete={item => { setDeleteTarget(item); setDeleteType('theorique'); }}
            onActiver={activerTheo} onDesactiver={desactiverTheo} toggling={toggling}
            renderMeta={item => `${item.nbQuestionsImage || 0} ${t('certification.questionsImage').toLowerCase()} · ${item.nbQuestionsQCMPool || 0} QCM · ${t('certification.seuil')} ${item.seuilReussite}%`} />
        )}

        {tab === 'pratiques' && (
          <TestList items={testsPrat} type="pratique"
            onEdit={item => { setEditTest(item); setEditTestType('pratique'); }}
            onDelete={item => { setDeleteTarget(item); setDeleteType('pratique'); }}
            onActiver={activerPrat} onDesactiver={desactiverPrat} toggling={toggling}
            renderMeta={item => `${item.nbDefauts || 0} ${t('certifDetail.defautsCaches')} · ${t('certification.seuil')} ${item.seuilReussite}%`} />
        )}

        {tab === 'en_attente' && (
          <PassageList passages={passSt(['EN_ATTENTE','FORMATION_OBLIGATOIRE'])}
            emptyTitle={t('expert.certif.aucunEnAttente')} emptyIcon={Ico.clock} />
        )}

        {tab === 'en_cours' && (
          <>
            {rapportsEnAttente > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#ECFDF5', border: '1.5px solid #A7F3D0', borderRadius: 12, padding: '.875rem 1.25rem', fontSize: '.84rem', color: '#065F46', marginBottom: '1rem', fontWeight: 600 }}>
                <span style={{display:'inline-flex',alignItems:'center',gap:6}}>{Ico.report}</span> <span><strong>{rapportsEnAttente} {t('expert.certif.rapportsPratiques')}</strong> {t('expert.certif.enAttenteValidation')}</span>
              </div>
            )}
            <PassageList passages={passSt(['THEORIQUE_EN_COURS','PRATIQUE_EN_COURS'])}
              emptyTitle={t('expert.certif.aucunEnCours')} emptyIcon={Ico.play} onValider={setValiderPassage} />
          </>
        )}
        {tab === 'rapport_valide' && (
  <>
    <div style={{ display:'flex', alignItems:'center', gap:10, background:'#ECFDF5', border:'1.5px solid #A7F3D0', borderRadius:12, padding:'.875rem 1.25rem', fontSize:'.84rem', color:'#065F46', marginBottom:'1rem', fontWeight:600 }}>
      <span>✓</span>
<span>{t('expert.certif.passages.readyForChefDesc')}</span>
    </div>
    <PassageList
      passages={passages.filter(p =>
        p.statut === 'RAPPORT_VALIDE' &&
        (!p.statutCertificat || p.statutCertificat === 'NON_GENERE' || p.statutCertificat === 'GENERE')
      )}
      emptyTitle="Aucun rapport en attente de certificat"
      emptyIcon="✓"
      onGenererCertif={setGenererCertif}
      onQr={handleQr}
    />
  </>
)}

{tab === 'attente_chef' && (
  <>
    <div style={{ display:'flex', alignItems:'center', gap:10, background:'#FFFBEB', border:'1px solid #FED7AA', borderRadius:12, padding:'.875rem 1.25rem', fontSize:'.84rem', color:'#92400E', marginBottom:'1rem' }}>
<span>{t('expert.certif.passages.waitingChefDesc')}</span>
    </div>
    <PassageList
      passages={passages.filter(p => p.statutCertificat === 'EN_ATTENTE_CHEF')}
      emptyTitle="Aucun certificat en attente chef"
      
    />
  </>
)}
        {tab === 'certifiees' && (
          <PassageList passages={passages.filter(p => p.statut === 'CERTIFIE' || p.statutCertificat === 'VALIDE_CHEF')}
            emptyTitle={t('expert.certif.aucunCertifie')} emptyIcon={Ico.ok}
            onGenererCertif={setGenererCertif}
            onQr={handleQr} />
        )}

        {tab === 'bloques' && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#FFF7ED', border: '1px solid #FED7AA', borderRadius: 12, padding: '.875rem 1.25rem', fontSize: '.84rem', color: '#92400E', marginBottom: '1rem' }}>
              {Ico.warn} <span>{t('expert.certif.infoBloqués')}</span>
            </div>
            <PassageList passages={passSt(['BLOQUE'])}
              emptyTitle={t('expert.certif.aucunBloque')} emptyIcon={Ico.lock}
              onDebloquer={setDebloquerTarget} />
          </>
        )}

        {tab === 'expirees' && (
          <PassageList passages={passSt(['EXPIRE'])}
            emptyTitle={t('expert.certif.aucunExpire')} emptyIcon={Ico.expire} />
        )}
      </div>

      {/* Modales & Panels */}
      <CertifDetail certif={detail} onClose={() => setDetail(null)} />
      <PanelParams certif={params} onClose={() => setParams(null)}
        onSaved={u => setCertifs(prev => prev.map(c => c.id === u.id ? u : c))}
        onActivate={handleActivate} />
      <PanelEditTest test={editTest} type={editTestType}
        onClose={() => { setEditTest(null); setEditTestType(null); }}
        onSaved={u => {
          if (editTestType === 'theorique') setTestsTheo(prev => prev.map(tt => tt.id === u.id ? u : tt));
          else setTestsPrat(prev => prev.map(tp => tp.id === u.id ? u : tp));
        }} />
      <PanelValiderRapport passage={validerPassage} onClose={() => setValiderPassage(null)}
        onDecision={() => { setValiderPassage(null); fetchAll(); }} />
      <ModalDelete item={deleteTarget}
        typeLabel={deleteType === 'certif' ? t('expert.certif.cetteQualification') : deleteType === 'theorique' ? t('audit.testTheorique') : t('audit.testPratique')}
        onClose={() => { setDeleteTarget(null); setDeleteType(null); }}
        onConfirm={handleDelete} loading={deleting} />
      <ModalDebloquer passage={debloquerTarget} onClose={() => setDebloquerTarget(null)}
        onConfirm={handleDebloquer} loading={debloquant} />

      {/* Modal de génération de certificat */}
      {genererCertif && (
        <ModalGenererCertificat
          passage={genererCertif}
          onClose={() => setGenererCertif(null)}
          onUpdated={(updated) => {
            setGenererCertif(null);
            fetchAll(); // recharge les passages
          }}
        />
      )}
      {qrTarget && (
  <ModalQrCode
    passageId={qrTarget.id}
    auditeurNom={qrTarget.auditeurNom}
    certificationTitre={qrTarget.certificationTitre}
    onClose={() => setQrTarget(null)}
  />
)}
    </div>
  );
}