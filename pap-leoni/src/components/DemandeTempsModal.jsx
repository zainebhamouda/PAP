/**
 * DemandeTempsModal.jsx — LEONI PAP
 * ─────────────────────────────────
 * Modal côté AUDITEUR : demander une extension de temps pour un audit EN RETARD
 * 
 * Props :
 *   audit       — objet audit (avec id, reference, planificateurNom, planificateurId, etc.)
 *   open        — boolean
 *   onClose     — () => void
 *   onSuccess   — () => void  (après envoi réussi)
 */

import { useState, useEffect } from 'react';

const T = {
  navy:'#0B1E3D', blue:'#1D4ED8',
  g50:'#F8FAFC', g100:'#F1F5F9', g200:'#E2E8F0', g300:'#CBD5E1',
  g400:'#94A3B8', g500:'#64748B', g700:'#1E293B',
  danger:'#DC2626', dangerBg:'#FEF2F2', dangerBd:'#FECACA',
  warn:'#D97706', warnBg:'#FFFBEB', warnBd:'#FCD34D',
  success:'#059669', successBg:'#ECFDF5', successBd:'#A7F3D0',
  orange:'#EA580C', orangeBg:'#FFF7ED', orangeBd:'#FED7AA',
};

const RAISONS = [
  { value: 'CHARGE_TRAVAIL',    label: ' Surcharge de travail' },
  { value: 'PROBLEME_ACCES',    label: ' Problème d\'accès au site' },
  { value: 'ABSENCE_MATERIEL',  label: ' Matériel ou ressources indisponibles' },
  { value: 'MALADIE',           label: ' Absence maladie / congé' },
  { value: 'PROBLEME_TECHNIQUE',label: ' Problème technique' },
  { value: 'ATTENTE_VALIDATION',label: ' En attente de validation préalable' },
  { value: 'AUTRE',             label: ' Autre raison' },
];

const apiH = () => ({
  Authorization: `Bearer ${localStorage.getItem('token')}`,
  'Content-Type': 'application/json',
});

export default function DemandeTempsModal({ audit, open, onClose, onSuccess }) {
  const [raisonType,   setRaisonType]   = useState('');
  const [description,  setDescription]  = useState('');
  const [delaiDemande, setDelaiDemande] = useState('');
  const [sending,      setSending]      = useState(false);
  const [error,        setError]        = useState('');
  const [success,      setSuccess]      = useState(false);

  // Reset à chaque ouverture
  useEffect(() => {
    if (open) {
      setRaisonType(''); setDescription(''); setDelaiDemande('');
      setError(''); setSuccess(false); setSending(false);
    }
  }, [open]);

  if (!open || !audit) return null;

  const expertNom = audit.planificateurNom || audit.expertNom || '—';
  const expertId  = audit.planificateurId  || audit.expertId  || null;

  const handleSend = async () => {
    if (!raisonType) { setError('Veuillez sélectionner une raison.'); return; }
    if (!description.trim()) { setError('Veuillez décrire la situation.'); return; }
    if (!delaiDemande) { setError('Veuillez indiquer un délai souhaité.'); return; }

    setSending(true); setError('');
    try {
      const payload = {
        auditId:     audit.id,
        auditRef:    audit.reference,
        raisonType,
        description: description.trim(),
        delaiDemande,
        expertId,
      };

      const res = await fetch(
        `http://localhost:8080/api/audit-produit/${audit.id}/demande-extension`,
        { method: 'POST', headers: apiH(), body: JSON.stringify(payload) }
      );

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'Erreur lors de l\'envoi.');
      }

      setSuccess(true);
      setTimeout(() => { onSuccess?.(); onClose(); }, 1800);
    } catch (e) {
      setError(e.message || 'Erreur réseau.');
    }
    setSending(false);
  };

  return (
    <div
      onClick={e => e.target === e.currentTarget && !sending && onClose()}
      style={{
        position:'fixed', inset:0, zIndex:2000,
        background:'rgba(11,30,61,.55)',
        backdropFilter:'blur(4px)',
        display:'flex', alignItems:'center', justifyContent:'center',
        padding:'1rem',
        animation:'fadeIn .18s ease',
      }}>
      <style>{`
        @keyframes fadeIn  { from{opacity:0} to{opacity:1} }
        @keyframes slideUp { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:none} }
      `}</style>

      <div style={{
        background:'#fff', borderRadius:20, width:'100%', maxWidth:520,
        maxHeight:'90vh', overflowY:'auto',
        boxShadow:'0 32px 80px rgba(11,30,61,.28)',
        animation:'slideUp .22s ease',
        fontFamily:"'Inter','DM Sans',sans-serif",
      }}>
        {/* ── Header ── */}
        <div style={{
          background:'linear-gradient(135deg,#7C2D12 0%,#C2410C 60%,#EA580C 100%)',
          borderRadius:'20px 20px 0 0',
          padding:'1.4rem 1.5rem',
          display:'flex', justifyContent:'space-between', alignItems:'flex-start',
        }}>
          <div>
            <div style={{ fontSize:'.7rem', fontWeight:700, color:'rgba(255,255,255,.65)', textTransform:'uppercase', letterSpacing:'.08em', marginBottom:4 }}>
              ⏱ Demande d'extension
            </div>
            <h2 style={{ margin:0, color:'#fff', fontSize:'1.05rem', fontWeight:800 }}>
              Prolonger le délai d'audit
            </h2>
            <div style={{ marginTop:5, fontSize:'.76rem', color:'rgba(255,255,255,.7)', display:'flex', alignItems:'center', gap:6 }}>
              <span style={{ background:'rgba(255,255,255,.15)', borderRadius:6, padding:'2px 8px' }}>
                {audit.reference || `Audit #${audit.id}`}
              </span>
            </div>
          </div>
          <button
            onClick={onClose} disabled={sending}
            style={{ background:'rgba(255,255,255,.15)', border:'none', borderRadius:8, width:32, height:32, color:'#fff', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1rem', flexShrink:0 }}>
            ✕
          </button>
        </div>

        <div style={{ padding:'1.4rem 1.5rem' }}>

          {/* ── Alerte retard ── */}
          <div style={{
            background:T.dangerBg, border:`1.5px solid ${T.dangerBd}`,
            borderRadius:10, padding:'10px 14px', marginBottom:16,
            display:'flex', alignItems:'flex-start', gap:10,
          }}>
            <span style={{ fontSize:'1rem', flexShrink:0 }}>🔴</span>
            <div>
              <div style={{ fontSize:'.78rem', fontWeight:700, color:T.danger, marginBottom:2 }}>
                Cet audit est en retard
              </div>
              <div style={{ fontSize:'.73rem', color:'#9B1C1C' }}>
                La deadline est dépassée. Pour continuer, vous devez d'abord envoyer une demande de prolongation à votre expert.
              </div>
            </div>
          </div>

          {/* ── Expert destinataire ── */}
          <div style={{
            background:T.g50, border:`1px solid ${T.g200}`,
            borderRadius:10, padding:'10px 14px', marginBottom:18,
            display:'flex', alignItems:'center', gap:12,
          }}>
            <div style={{
              width:38, height:38, borderRadius:10,
              background:'linear-gradient(135deg,#002855,#0057B8)',
              color:'#fff', display:'flex', alignItems:'center', justifyContent:'center',
              fontSize:'.85rem', fontWeight:800, flexShrink:0,
            }}>
              {expertNom?.charAt(0)?.toUpperCase() || 'E'}
            </div>
            <div>
              <div style={{ fontSize:'.68rem', fontWeight:700, color:T.g400, textTransform:'uppercase', letterSpacing:'.05em' }}>Expert destinataire</div>
              <div style={{ fontSize:'.85rem', fontWeight:700, color:T.navy }}>{expertNom}</div>
            </div>
          </div>

          {/* ── Raison (select) ── */}
          <div style={{ marginBottom:14 }}>
            <label style={{ display:'block', fontSize:'.69rem', fontWeight:700, color:T.g500, textTransform:'uppercase', letterSpacing:'.05em', marginBottom:5 }}>
              Raison du retard *
            </label>
            <select
              value={raisonType}
              onChange={e => setRaisonType(e.target.value)}
              style={{
                width:'100%', padding:'9px 12px',
                border:`1.5px solid ${raisonType ? T.g300 : T.g200}`,
                borderRadius:9, fontSize:'.83rem', fontFamily:'inherit',
                background:'#fff', color: raisonType ? T.g700 : T.g400,
                outline:'none', cursor:'pointer', boxSizing:'border-box',
              }}>
              <option value="">Sélectionner une raison…</option>
              {RAISONS.map(r => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </div>

          {/* ── Description ── */}
          <div style={{ marginBottom:14 }}>
            <label style={{ display:'block', fontSize:'.69rem', fontWeight:700, color:T.g500, textTransform:'uppercase', letterSpacing:'.05em', marginBottom:5 }}>
              Description détaillée *
            </label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Expliquez la situation en détail pour aider l'expert à prendre une décision…"
              rows={4}
              style={{
                width:'100%', padding:'9px 12px',
                border:`1.5px solid ${description.trim() ? T.g300 : T.g200}`,
                borderRadius:9, fontSize:'.83rem', fontFamily:'inherit',
                outline:'none', resize:'vertical', boxSizing:'border-box',
                lineHeight:1.5, color:T.g700,
              }}
            />
            <div style={{ fontSize:'.67rem', color:T.g400, marginTop:3, textAlign:'right' }}>
              {description.length} / 500 caractères
            </div>
          </div>

          {/* ── Délai demandé ── */}
          <div style={{ marginBottom:18 }}>
            <label style={{ display:'block', fontSize:'.69rem', fontWeight:700, color:T.g500, textTransform:'uppercase', letterSpacing:'.05em', marginBottom:5 }}>
              Nouveau délai souhaité *
            </label>
            <input
              type="date"
              value={delaiDemande}
              min={new Date().toISOString().split('T')[0]}
              onChange={e => setDelaiDemande(e.target.value)}
              style={{
                width:'100%', padding:'9px 12px',
                border:`1.5px solid ${delaiDemande ? T.g300 : T.g200}`,
                borderRadius:9, fontSize:'.83rem', fontFamily:'inherit',
                outline:'none', boxSizing:'border-box', color:T.g700,
              }}
            />
          </div>

          {/* ── Erreur / Succès ── */}
          {error && (
            <div style={{ background:T.dangerBg, border:`1px solid ${T.dangerBd}`, borderRadius:8, padding:'9px 13px', marginBottom:14, fontSize:'.8rem', color:T.danger, fontWeight:600 }}>
              ⚠ {error}
            </div>
          )}
          {success && (
            <div style={{ background:T.successBg, border:`1px solid ${T.successBd}`, borderRadius:8, padding:'9px 13px', marginBottom:14, fontSize:'.8rem', color:T.success, fontWeight:700 }}>
              ✓ Demande envoyée avec succès à l'expert !
            </div>
          )}

          {/* ── Actions ── */}
          <div style={{ display:'flex', gap:10 }}>
            <button
              onClick={onClose} disabled={sending}
              style={{
                flex:1, padding:'10px', borderRadius:10,
                border:`1.5px solid ${T.g300}`, background:'#fff',
                color:T.g700, fontWeight:700, fontSize:'.83rem',
                cursor:'pointer', fontFamily:'inherit',
              }}>
              Annuler
            </button>
            <button
              onClick={handleSend}
              disabled={sending || success || !raisonType || !description.trim() || !delaiDemande}
              style={{
                flex:2, padding:'10px', borderRadius:10, border:'none',
                background: (sending || success || !raisonType || !description.trim() || !delaiDemande)
                  ? T.g200
                  : 'linear-gradient(135deg,#7C2D12 0%,#EA580C 100%)',
                color: (sending || success || !raisonType || !description.trim() || !delaiDemande)
                  ? T.g400 : '#fff',
                fontWeight:800, fontSize:'.83rem',
                cursor:(sending || !raisonType || !description.trim() || !delaiDemande) ? 'not-allowed' : 'pointer',
                fontFamily:'inherit', transition:'all .2s',
                display:'flex', alignItems:'center', justifyContent:'center', gap:8,
              }}>
              {sending ? (
                <>
                  <div style={{ width:14, height:14, border:'2px solid rgba(255,255,255,.3)', borderTopColor:'#fff', borderRadius:'50%', animation:'spin .7s linear infinite' }}/>
                  Envoi…
                </>
              ) : success ? '✓ Envoyé !' : ' Envoyer la demande'}
            </button>
          </div>

          <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
        </div>
      </div>
    </div>
  );
}