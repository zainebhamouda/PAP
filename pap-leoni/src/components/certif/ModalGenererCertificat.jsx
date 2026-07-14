import { useState, useEffect } from 'react';
import api from '../../services/api';
import { expertPassageAPI } from '../../services/certifAPI';

/* ─── Icons ─── */
const Ico = {
  cert:   <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/></svg>,
  send:   <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>,
  eye:    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>,
  dl:     <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>,
  check:  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>,
  warn:   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
  x:      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  pdf:    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>,
  arrow:  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>,
  refresh:<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>,
};

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
  @keyframes modalIn  { from { opacity:0; transform:scale(.96) translateY(8px) } to { opacity:1; transform:scale(1) translateY(0) } }
  @keyframes fadeIn   { from { opacity:0 } to { opacity:1 } }
  @keyframes spin     { to { transform:rotate(360deg) } }
  @keyframes pulse    { 0%,100%{opacity:1} 50%{opacity:.5} }

  .mcg-modal     { font-family:'DM Sans',sans-serif; animation:modalIn .22s cubic-bezier(.34,1.56,.64,1) both; }
  .mcg-overlay   { animation:fadeIn .18s ease both; }
  .mcg-btn       { transition:all .15s ease; font-family:'DM Sans',sans-serif; }
  .mcg-btn:hover:not(:disabled) { filter:brightness(1.08); transform:translateY(-1px); }
  .mcg-btn:active:not(:disabled){ transform:translateY(0); }
  .mcg-select:focus { outline:none; border-color:#3B82F6 !important; box-shadow:0 0 0 3px rgba(59,130,246,.15); }
  .mcg-textarea:focus { outline:none; border-color:#3B82F6 !important; box-shadow:0 0 0 3px rgba(59,130,246,.15); }
`;

function Spinner({ size = 14, color = '#fff' }) {
  return (
    <span style={{
      width: size, height: size, flexShrink: 0,
      border: `2px solid ${color}40`,
      borderTopColor: color,
      borderRadius: '50%',
      animation: 'spin .65s linear infinite',
      display: 'inline-block',
    }} />
  );
}

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
}

/* ─── Stepper centré ─── */
function Stepper({ etapes, etapeIdx }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '20px 32px 0',
    }}>
      {etapes.map((e, i) => (
        <div key={e.key} style={{ display: 'flex', alignItems: 'center' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            <div style={{
              width: 34, height: 34, borderRadius: '50%',
              background: i < etapeIdx
                ? '#10B981'
                : i === etapeIdx
                  ? 'linear-gradient(135deg,#3B82F6,#1D4ED8)'
                  : '#F1F5F9',
              color: i <= etapeIdx ? '#fff' : '#94A3B8',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '.8rem', fontWeight: 800,
              boxShadow: i === etapeIdx ? '0 4px 14px rgba(59,130,246,.35)' : 'none',
              transition: 'all .3s ease',
            }}>
              {i < etapeIdx
                ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                : i + 1}
            </div>
            <span style={{
              fontSize: '.68rem', fontWeight: i === etapeIdx ? 700 : 500,
              color: i === etapeIdx ? '#1D4ED8' : i < etapeIdx ? '#10B981' : '#94A3B8',
              letterSpacing: '.04em', textTransform: 'uppercase',
            }}>
              {e.label}
            </span>
          </div>
          {i < etapes.length - 1 && (
            <div style={{
              width: 64, height: 2, margin: '0 8px',
              marginBottom: 20,
              background: i < etapeIdx
                ? 'linear-gradient(90deg,#10B981,#10B981)'
                : '#E2E8F0',
              borderRadius: 99,
              transition: 'background .3s ease',
            }} />
          )}
        </div>
      ))}
    </div>
  );
}

/* ─── Info auditeur compacte ─── */
function AuditeurCard({ passage }) {
  const initiale = (passage.auditeurNom || 'A').charAt(0).toUpperCase();
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 14,
      background: '#F8FAFC', border: '1px solid #E8EDF7',
      borderRadius: 14, padding: '14px 18px',
    }}>
      <div style={{
        width: 44, height: 44, borderRadius: 12, flexShrink: 0,
        background: 'linear-gradient(135deg,#0B1E3D,#1D4ED8)',
        color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontWeight: 800, fontSize: '1.15rem',
      }}>
        {initiale}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 800, fontSize: '.95rem', color: '#0B1E3D' }}>
          {passage.auditeurNom}
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 3 }}>
          {passage.auditeurMatricule && (
            <span style={{
              background: '#EFF6FF', border: '1px solid #BFDBFE',
              borderRadius: 6, padding: '1px 8px',
              fontSize: '.72rem', fontWeight: 700, color: '#1D4ED8',
            }}>
              {passage.auditeurMatricule}
            </span>
          )}
          {passage.certificationClientNom && (
            <span style={{
              background: '#FFF7ED', border: '1px solid #FED7AA',
              borderRadius: 6, padding: '1px 8px',
              fontSize: '.72rem', fontWeight: 700, color: '#C2410C',
            }}>
              {passage.certificationClientNom}
            </span>
          )}
          <span style={{ fontSize: '.72rem', color: '#64748B', fontWeight: 500, alignSelf: 'center' }}>
            {passage.certificationTitre}
          </span>
        </div>
      </div>
    </div>
  );
}

/* ─── Scores ─── */
function ScoresBadges({ passage }) {
  const scoreTheoPct = passage.scoreTheoriquePct
    ?? (passage.scoreTheorique != null ? Math.round(passage.scoreTheorique * 100 / 20) : null);
  const scorePrat = passage.scorePratique != null ? Math.round(passage.scorePratique) : null;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
      {[
        { label: 'Score théorique', val: scoreTheoPct != null ? scoreTheoPct + '%' : '—', color: '#059669', bg: '#F0FDF4', border: '#BBF7D0' },
        { label: 'Score pratique',  val: scorePrat != null ? scorePrat + '%' : '—',       color: '#1D4ED8', bg: '#EFF6FF', border: '#BFDBFE' },
      ].map(({ label, val, color, bg, border }) => (
        <div key={label} style={{ background: bg, border: `1.5px solid ${border}`, borderRadius: 12, padding: '12px 16px', textAlign: 'center' }}>
          <div style={{ fontSize: '.68rem', fontWeight: 700, color, textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 4 }}>{label}</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color }}>{val}</div>
        </div>
      ))}
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   ÉTAPE 1 — Génération
══════════════════════════════════════════════════════ */
function EtapeGeneration({ passage, onGenere }) {
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  const handleGenerer = async () => {
    setLoading(true); setErr('');
    try {
      const res = await expertPassageAPI.genererCertificat(passage.id);
      onGenere(res.data);           // passe à étape 2, SANS fermer
    } catch (e) {
      setErr(e.response?.data?.message || 'Erreur lors de la génération.');
    }
    setLoading(false);
  };

  return (
    <div style={{ padding: '24px 28px 28px', display: 'flex', flexDirection: 'column', gap: 16 }}>
      <AuditeurCard passage={passage} />
      <ScoresBadges passage={passage} />

      <div style={{
        background: '#EFF6FF', border: '1px solid #BFDBFE',
        borderRadius: 12, padding: '12px 16px',
        fontSize: '.82rem', color: '#1E40AF',
        display: 'flex', alignItems: 'flex-start', gap: 10,
      }}>
        <span style={{ flexShrink: 0, marginTop: 1 }}>{Ico.warn}</span>
        <span>Le certificat sera généré au format <strong>PDF</strong> et sauvegardé. Vous pourrez ensuite le visualiser puis l'envoyer au chef de service.</span>
      </div>

      {err && (
        <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 10, padding: '10px 14px', fontSize: '.82rem', color: '#DC2626' }}>
          {err}
        </div>
      )}

      <button
        className="mcg-btn"
        onClick={handleGenerer}
        disabled={loading}
        style={{
          padding: '13px', borderRadius: 12, border: 'none',
          background: loading ? '#E2E8F0' : 'linear-gradient(135deg,#0B1E3D,#1D4ED8)',
          color: loading ? '#94A3B8' : '#fff',
          fontWeight: 700, fontSize: '.9rem', cursor: loading ? 'not-allowed' : 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          boxShadow: loading ? 'none' : '0 4px 16px rgba(11,30,61,.25)',
        }}>
        {loading ? <><Spinner /> Génération en cours…</> : <>{Ico.cert} Générer le certificat</>}
      </button>
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   ÉTAPE 2 — Aperçu + Envoi
══════════════════════════════════════════════════════ */
function EtapeEnvoi({ passage, setPassageState, onEnvoye }) {
  const [chefs, setChefs]             = useState([]);
  const [chefId, setChefId]           = useState('');
  const [remarque, setRemarque]       = useState('');
  const [sending, setSending]         = useState(false);
  const [regenerating, setRegen]      = useState(false);
  const [loadingChefs, setLdChefs]    = useState(true);
  const [err, setErr]                 = useState('');
  const [previewOpen, setPreview]     = useState(false);
  const [pdfUrl, setPdfUrl]           = useState(null);
  const [loadingPdf, setLdPdf]        = useState(false);

  useEffect(() => {
    api.get('/expert-audit/chefs-service')
      .then(r => setChefs(r.data || []))
      .catch(() => setChefs([]))
      .finally(() => setLdChefs(false));
  }, []);

  const loadPdf = async () => {
    setLdPdf(true);
    try {
      const res = await api.get(`/expert-audit/passages/${passage.id}/certificat/download`, { responseType: 'blob' });
      if (pdfUrl) window.URL.revokeObjectURL(pdfUrl);
      setPdfUrl(window.URL.createObjectURL(res.data));
    } catch { setPdfUrl(null); }
    setLdPdf(false);
  };

  useEffect(() => {
    if (previewOpen) loadPdf();
    return () => { if (pdfUrl) window.URL.revokeObjectURL(pdfUrl); };
  }, [previewOpen]);

  const handleDownload = async () => {
    try {
      const res = await api.get(`/expert-audit/passages/${passage.id}/certificat/download`, { responseType: 'blob' });
      const a = Object.assign(document.createElement('a'), {
        href: window.URL.createObjectURL(res.data),
        download: passage.certificatPdfPath || `certificat_${passage.id}.pdf`,
      });
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
    } catch (e) { console.error(e); }
  };

  const handleRegenerate = async () => {
    setRegen(true); setErr('');
    try {
      const res = await expertPassageAPI.genererCertificat(passage.id);
      setPassageState(res.data);                // met à jour sans changer d'étape
      if (previewOpen) await loadPdf();         // recharger le PDF affiché
    } catch (e) {
      setErr(e.response?.data?.message || 'Erreur lors de la régénération.');
    }
    setRegen(false);
  };

  const handleEnvoyer = async () => {
    if (!chefId) { setErr('Veuillez sélectionner un chef de service.'); return; }
    setSending(true); setErr('');
    try {
      const res = await expertPassageAPI.envoyerAuChef(passage.id, parseInt(chefId), remarque);
      onEnvoye(res.data);                       // passe à étape 3
    } catch (e) {
      setErr(e.response?.data?.message || 'Erreur lors de l\'envoi.');
    }
    setSending(false);
  };

  const btnSm = (onClick, bg, color, children, disabled = false) => (
    <button
      className="mcg-btn"
      onClick={onClick}
      disabled={disabled}
      style={{
        display: 'flex', alignItems: 'center', gap: 6,
        padding: '6px 13px', borderRadius: 8, border: 'none',
        background: disabled ? '#E2E8F0' : bg,
        color: disabled ? '#94A3B8' : color,
        fontWeight: 700, fontSize: '.75rem', cursor: disabled ? 'not-allowed' : 'pointer',
      }}>
      {children}
    </button>
  );

  return (
    <div style={{ padding: '24px 28px 28px', display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Succès génération */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12,
        background: '#F0FDF4', border: '1.5px solid #A7F3D0',
        borderRadius: 14, padding: '13px 18px',
      }}>
        <div style={{
          width: 36, height: 36, borderRadius: 10, flexShrink: 0,
          background: '#10B981', color: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {Ico.check}
        </div>
        <div>
          <div style={{ fontWeight: 800, fontSize: '.88rem', color: '#065F46' }}>Certificat généré avec succès</div>
          <div style={{ fontSize: '.72rem', color: '#059669', marginTop: 2, fontWeight: 600 }}>
            {passage.certificatPdfPath || '—'}
          </div>
        </div>
      </div>

      {/* Zone PDF */}
      <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 14, overflow: 'hidden' }}>
        <div style={{
          padding: '10px 14px', display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', background: '#fff',
          borderBottom: previewOpen ? '1px solid #E2E8F0' : 'none',
        }}>
          <span style={{ fontSize: '.8rem', fontWeight: 700, color: '#374151', display: 'flex', alignItems: 'center', gap: 6 }}>
            {Ico.pdf} Aperçu du certificat
          </span>
          <div style={{ display: 'flex', gap: 7 }}>
            {btnSm(() => setPreview(v => !v), previewOpen ? '#F1F5F9' : '#EFF6FF', previewOpen ? '#374151' : '#2563EB',
              <>{Ico.eye} {previewOpen ? 'Masquer' : 'Aperçu'}</>)}
            {btnSm(handleRegenerate, '#FEF3C7', '#92400E', regenerating ? <><Spinner size={12} color="#92400E" /> Régénération…</> : <>{Ico.refresh} Régénérer</>, regenerating)}
            {btnSm(handleDownload, '#0B1E3D', '#fff', <>{Ico.dl} Télécharger</>)}
          </div>
        </div>
        {previewOpen && (
          <div style={{ padding: 12 }}>
            {loadingPdf ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: '#94A3B8', fontSize: '.82rem' }}>
                <Spinner size={18} color="#94A3B8" /><br /><span style={{ marginTop: 8, display: 'block' }}>Chargement du PDF…</span>
              </div>
            ) : pdfUrl ? (
              <iframe src={pdfUrl + '#toolbar=0'} style={{ width: '100%', height: 360, border: 'none', borderRadius: 10 }} title="Aperçu" />
            ) : (
              <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 10, padding: '1rem', textAlign: 'center', color: '#DC2626', fontSize: '.82rem' }}>
                Impossible d'afficher l'aperçu.{' '}
                <button onClick={handleDownload} style={{ background: 'none', border: 'none', color: '#2563EB', textDecoration: 'underline', cursor: 'pointer', fontFamily: 'inherit' }}>Télécharger</button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Chef de service */}
      <div>
        <label style={{ display: 'block', fontSize: '.72rem', fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 8 }}>
          Chef de service <span style={{ color: '#DC2626' }}>*</span>
          <span style={{ textTransform: 'none', fontWeight: 500, color: '#9CA3AF', marginLeft: 6 }}>doit valider le certificat</span>
        </label>
        {loadingChefs ? (
          <div style={{ padding: '10px', color: '#94A3B8', fontSize: '.82rem' }}>Chargement…</div>
        ) : (
          <select
            className="mcg-select"
            value={chefId}
            onChange={e => { setChefId(e.target.value); setErr(''); }}
            style={{
              width: '100%', padding: '10px 14px',
              border: `1.5px solid ${err && !chefId ? '#FECACA' : chefId ? '#A7F3D0' : '#D1D5DB'}`,
              borderRadius: 10, fontSize: '.88rem', fontFamily: 'inherit',
              background: '#fff', color: '#111827', cursor: 'pointer',
              boxSizing: 'border-box',
            }}>
            <option value="">— Sélectionner un chef de service —</option>
            {chefs.map(c => (
              <option key={c.id} value={c.id}>
                {c.nom} {c.prenom}{c.matricule ? ` (${c.matricule})` : ''}{c.siteNom ? ` · ${c.siteNom}` : ''}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Remarque */}
      <div>
        <label style={{ display: 'block', fontSize: '.72rem', fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 8 }}>
          Remarque <span style={{ textTransform: 'none', fontWeight: 400, color: '#9CA3AF' }}>(optionnelle)</span>
        </label>
        <textarea
          className="mcg-textarea"
          value={remarque}
          onChange={e => setRemarque(e.target.value)}
          rows={3}
          placeholder="Ex : Auditeur particulièrement performant, score excellent…"
          style={{
            width: '100%', padding: '10px 14px',
            border: '1.5px solid #D1D5DB', borderRadius: 10,
            fontSize: '.84rem', fontFamily: 'inherit',
            resize: 'vertical', boxSizing: 'border-box',
            color: '#111827', lineHeight: 1.6,
          }}
        />
      </div>

      {err && (
        <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 10, padding: '10px 14px', fontSize: '.82rem', color: '#DC2626' }}>
          {Ico.warn} {err}
        </div>
      )}

      <button
        className="mcg-btn"
        onClick={handleEnvoyer}
        disabled={sending || !chefId}
        style={{
          padding: '13px', borderRadius: 12, border: 'none',
          background: chefId && !sending ? 'linear-gradient(135deg,#059669,#10B981)' : '#E2E8F0',
          color: chefId && !sending ? '#fff' : '#94A3B8',
          fontWeight: 700, fontSize: '.9rem',
          cursor: chefId && !sending ? 'pointer' : 'not-allowed',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          boxShadow: chefId ? '0 4px 16px rgba(5,150,105,.28)' : 'none',
        }}>
        {sending ? <><Spinner /> Envoi en cours…</> : <>{Ico.send} Envoyer au chef de service {Ico.arrow}</>}
      </button>
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   ÉTAPE 3 — Confirmation
══════════════════════════════════════════════════════ */
function EtapeConfirmation({ passage, onClose }) {
  return (
    <div style={{ padding: '32px 28px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18, textAlign: 'center' }}>
      <div style={{
        width: 72, height: 72, borderRadius: 20,
        background: 'linear-gradient(135deg,#ECFDF5,#D1FAE5)',
        border: '2px solid #A7F3D0',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '2.4rem',
      }}>📨</div>

      <div>
        <div style={{ fontWeight: 800, fontSize: '1.15rem', color: '#0B1E3D', marginBottom: 8 }}>
          Certificat envoyé avec succès !
        </div>
        <div style={{ fontSize: '.87rem', color: '#64748B', lineHeight: 1.7, maxWidth: 380 }}>
          Le certificat de <strong style={{ color: '#0B1E3D' }}>{passage.auditeurNom}</strong> a été transmis
          {passage.chefValidateurNom ? <> à <strong style={{ color: '#0B1E3D' }}>{passage.chefValidateurNom}</strong></> : ' au chef de service'}.
          <br />L'auditeur sera notifié automatiquement dès validation.
        </div>
      </div>

      <div style={{
        width: '100%', background: '#FFF7ED', border: '1px solid #FED7AA',
        borderRadius: 12, padding: '12px 16px',
        fontSize: '.8rem', color: '#92400E', textAlign: 'left',
      }}>
         <strong>En attente de validation.</strong> Le chef recevra une notification et pourra statuer sur le certificat.
      </div>

      <button
        className="mcg-btn"
        onClick={onClose}
        style={{
          width: '100%', padding: '13px', borderRadius: 12, border: 'none',
          background: 'linear-gradient(135deg,#0B1E3D,#1D4ED8)',
          color: '#fff', fontWeight: 700, fontSize: '.9rem', cursor: 'pointer',
          boxShadow: '0 4px 16px rgba(11,30,61,.25)',
        }}>
        Fermer
      </button>
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   COMPOSANT PRINCIPAL
══════════════════════════════════════════════════════ */
const ETAPES = [
  { key: 'generation',   label: 'Générer'  },
  { key: 'envoi',        label: 'Envoyer'  },
  { key: 'confirmation', label: 'Confirmé' },
];

export default function ModalGenererCertificat({ passage, onClose, onUpdated }) {
  const [etape, setEtape]                 = useState('generation');
  const [passageState, setPassageState]   = useState(passage);

  useEffect(() => {
    const s = passage.statutCertificat || 'NON_GENERE';
    setEtape(s === 'EN_ATTENTE_CHEF' ? 'confirmation' : s === 'GENERE' ? 'envoi' : 'generation');
  }, [passage.statutCertificat]);

  const handleGenere = (updated) => {
    setPassageState(updated);
    setEtape('envoi');
  };

  const handleEnvoye = (updated) => {
    setPassageState(updated);
    setEtape('confirmation');
  };

  const etapeIdx = ETAPES.findIndex(e => e.key === etape);

  if (!passage) return null;

  return (
    <>
      <style>{CSS}</style>
      <div
        className="mcg-overlay"
        style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          background: 'rgba(10,20,40,.6)',
          backdropFilter: 'blur(6px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '1rem',
        }}
        onClick={e => e.target === e.currentTarget && (onUpdated?.(passageState), onClose?.())}
      >
        <div
          className="mcg-modal"
          style={{
            background: '#fff',
            borderRadius: 22,
            width: '100%',
            maxWidth: 620,           // plus large
            maxHeight: '92vh',
            overflowY: 'auto',
            boxShadow: '0 40px 100px rgba(0,0,0,.28), 0 8px 24px rgba(0,0,0,.12)',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* ── Header ── */}
          <div style={{
            background: 'linear-gradient(135deg,#0B1E3D 0%,#1D4ED8 100%)',
            borderRadius: '22px 22px 0 0',
            padding: '22px 26px 0',
          }}>
            {/* Titre + fermer */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 13,
                  background: 'rgba(255,255,255,.15)',
                  backdropFilter: 'blur(4px)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#fff',
                }}>
                  {Ico.cert}
                </div>
                <div>
                  <div style={{ fontWeight: 800, color: '#fff', fontSize: '1.05rem', letterSpacing: '-.01em' }}>
                    Génération du Certificat
                  </div>
                  <div style={{ fontSize: '.75rem', color: 'rgba(255,255,255,.55)', marginTop: 3 }}>
                    {passageState.certificationTitre}
                    {passageState.auditeurNom ? ` · ${passageState.auditeurNom}` : ''}
                  </div>
                </div>
              </div>
              <button
                className="mcg-btn"
                onClick={() => { onUpdated?.(passageState); onClose?.(); }}
                style={{
                  width: 32, height: 32, borderRadius: 9,
                  background: 'rgba(255,255,255,.12)', border: 'none',
                  cursor: 'pointer', color: '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}>
                {Ico.x}
              </button>
            </div>

            {/* Stepper dans le header */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              paddingBottom: 22, gap: 0,
            }}>
              {ETAPES.map((e, i) => (
                <div key={e.key} style={{ display: 'flex', alignItems: 'center' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                      background: i < etapeIdx
                        ? '#10B981'
                        : i === etapeIdx
                          ? '#fff'
                          : 'rgba(255,255,255,.15)',
                      color: i < etapeIdx
                        ? '#fff'
                        : i === etapeIdx
                          ? '#1D4ED8'
                          : 'rgba(255,255,255,.45)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '.8rem', fontWeight: 800,
                      boxShadow: i === etapeIdx ? '0 4px 16px rgba(255,255,255,.25)' : 'none',
                      transition: 'all .3s',
                    }}>
                      {i < etapeIdx
                        ? <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                        : i + 1}
                    </div>
                    <span style={{
                      fontSize: '.65rem', fontWeight: i === etapeIdx ? 700 : 500,
                      color: i === etapeIdx ? '#fff' : i < etapeIdx ? '#6EE7B7' : 'rgba(255,255,255,.4)',
                      letterSpacing: '.05em', textTransform: 'uppercase',
                    }}>
                      {e.label}
                    </span>
                  </div>
                  {i < ETAPES.length - 1 && (
                    <div style={{
                      width: 72, height: 2, margin: '0 10px', marginBottom: 20,
                      background: i < etapeIdx ? '#10B981' : 'rgba(255,255,255,.2)',
                      borderRadius: 99, transition: 'background .3s',
                    }} />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* ── Contenu ── */}
          {etape === 'generation' && (
            <EtapeGeneration passage={passageState} onGenere={handleGenere} />
          )}
          {etape === 'envoi' && (
            <EtapeEnvoi
              passage={passageState}
              setPassageState={p => { setPassageState(p); }}
              onEnvoye={handleEnvoye}
            />
          )}
          {etape === 'confirmation' && (
            <EtapeConfirmation passage={passageState} onClose={() => { onUpdated?.(passageState); onClose?.(); }} />
          )}
        </div>
      </div>
    </>
  );
}