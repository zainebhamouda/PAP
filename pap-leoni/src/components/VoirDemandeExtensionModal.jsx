/**
 * VoirDemandeExtensionModal.jsx — LEONI PAP
 * ──────────────────────────────────────────
 * Modal côté EXPERT : voir la demande de prolongation + modifier l'audit
 */

import { useState } from 'react';

const T = {
  navy:'#002855', blue:'#003F8A', blueM:'#0057B8',
  g50:'#F7F9FC', g100:'#EEF2F8', g200:'#DAE2EF',
  g300:'#B8C6DA', g400:'#8A9BBC', g500:'#5C6F8A', g700:'#273347',
  danger:'#C0392B', dangerBg:'#FEF2F2', dangerBd:'#FECACA',
  warn:'#C8982A', warnBg:'#FFF4D6', warnBd:'#FCD34D',
  success:'#1A7A4A', successBg:'#E6F5EE', successBd:'#86EFAC',
  orange:'#EA580C', orangeBg:'#FFF7ED', orangeBd:'#FED7AA',
};

const RAISON_LABELS = {
  CHARGE_TRAVAIL:     '📋 Surcharge de travail',
  PROBLEME_ACCES:     '🔒 Problème d\'accès au site',
  ABSENCE_MATERIEL:   '🔧 Matériel ou ressources indisponibles',
  MALADIE:            '🏥 Absence maladie / congé',
  PROBLEME_TECHNIQUE: '💻 Problème technique',
  ATTENTE_VALIDATION: '⏳ En attente de validation préalable',
  AUTRE:              '📝 Autre raison',
};

const apiH = () => ({
  Authorization: `Bearer ${localStorage.getItem('token')}`,
  'Content-Type': 'application/json',
});

const INP = {
  width:'100%', padding:'8px 11px',
  border:`1.5px solid ${T.g200}`, borderRadius:8,
  fontSize:'.84rem', fontFamily:'inherit',
  background:'#fff', boxSizing:'border-box', outline:'none', color:T.g700,
};

const INP_READONLY = {
  ...INP,
  background:'#F1F5F9',
  color:T.g500,
  cursor:'not-allowed',
  border:`1.5px solid ${T.g200}`,
};

const fmtDate = d => {
  if (!d) return '—';
  try {
    return new Date(d).toLocaleDateString('fr-FR', {
      day:'2-digit', month:'short', year:'numeric',
    });
  } catch { return d; }
};

export default function VoirDemandeExtensionModal({
  audit,
  demande,
  open,
  onClose,
  auditeurs = [],
  onSuccess,
}) {
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState('');
  const [saveOk,  setSaveOk]  = useState(false);

  // ── Pré-remplissage intelligent ──────────────────────────────
  // datePrevue : date déjà enregistrée sur l'audit (non modifiable)
  // deadline   : pré-remplie avec le délai demandé par l'auditeur
  // auditeurId : pré-rempli depuis l'audit
  const [deadline,     setDeadline]     = useState(
    demande?.delaiDemande?.slice(0,10) || audit?.deadline?.slice(0,10) || ''
  );
  const [observations, setObservations] = useState(audit?.observations || '');
  const [auditeurId,   setAuditeurId]   = useState(
    audit?.auditeurId ? String(audit.auditeurId) : ''
  );

  if (!open || !audit) return null;

  const auditeurNom   = demande?.auditeurNom || audit?.auditeurNom || '—';
  const raisonLabel   = RAISON_LABELS[demande?.raisonType] || demande?.raisonType || '—';
  const datePrevueFmt = fmtDate(audit?.datePrevue);
  const demandeDejaTraitee = demande?.statut === 'TRAITEE';

  const handleSave = async () => {
    if (!deadline) { setError('Veuillez indiquer la nouvelle deadline.'); return; }
    setSaving(true); setError('');
    try {
      const body = {
        // datePrevue intentionnellement NON modifiée — on garde celle de l'audit
        datePrevue:   audit.datePrevue,
        deadline:     deadline,
        auditeurId:   auditeurId ? Number(auditeurId) : null,
        observations: observations || null,
      };

      const res = await fetch(
        `http://localhost:8080/api/audit-produit/${audit.id}/maj`,
        { method:'PUT', headers:apiH(), body:JSON.stringify(body) }
      );
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'Erreur lors de la modification.');
      }

      // Marquer la demande comme traitée
      await fetch(
        `http://localhost:8080/api/audit-produit/${audit.id}/demande-extension/traiter`,
        { method:'POST', headers:apiH() }
      ).catch(() => {});

      setSaveOk(true);
      setTimeout(() => { onSuccess?.(); onClose(); }, 1600);
    } catch (e) {
      setError(e.message || 'Erreur réseau.');
    }
    setSaving(false);
  };

  return (
    <div
      onClick={e => e.target === e.currentTarget && !saving && onClose()}
      style={{
        position:'fixed', inset:0, zIndex:2100,
        background:'rgba(0,15,40,.55)', backdropFilter:'blur(5px)',
        display:'flex', alignItems:'center', justifyContent:'center',
        padding:'1rem',
      }}>
      <style>{`
        @keyframes modalIn { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:none} }
        @keyframes spin    { to{transform:rotate(360deg)} }
      `}</style>

      <div style={{
        background:'#fff', borderRadius:20, width:'100%', maxWidth:560,
        maxHeight:'92vh', overflowY:'auto',
        boxShadow:'0 40px 100px rgba(0,20,60,.3)',
        animation:'modalIn .22s ease',
        fontFamily:"'DM Sans','Inter',sans-serif",
      }}>

        {/* ── Header ── */}
        <div style={{
          background:'linear-gradient(135deg,#1C1917 0%,#44403C 60%,#78716C 100%)',
          borderRadius:'20px 20px 0 0',
          padding:'1.4rem 1.5rem',
          display:'flex', justifyContent:'space-between', alignItems:'flex-start',
        }}>
          <div>
            <div style={{ fontSize:'.68rem', fontWeight:700, color:'rgba(255,255,255,.6)', textTransform:'uppercase', letterSpacing:'.08em', marginBottom:4 }}>
              Message de l'auditeur
            </div>
            <h2 style={{ margin:0, color:'#fff', fontSize:'1.05rem', fontWeight:800 }}>
              Demande de prolongation
            </h2>
            <div style={{ marginTop:5, display:'flex', alignItems:'center', gap:8 }}>
              <span style={{ background:'rgba(255,255,255,.15)', borderRadius:6, padding:'2px 9px', fontSize:'.73rem', color:'rgba(255,255,255,.8)', fontWeight:600 }}>
                {audit.reference || `Audit #${audit.id}`}
              </span>
              {demandeDejaTraitee && (
                <span style={{ background:'rgba(16,185,129,.25)', borderRadius:6, padding:'2px 9px', fontSize:'.7rem', color:'#6EE7B7', fontWeight:700 }}>
                  ✓ Déjà traitée
                </span>
              )}
            </div>
          </div>
          <button
            onClick={onClose} disabled={saving}
            style={{ background:'rgba(255,255,255,.15)', border:'none', borderRadius:8, width:32, height:32, color:'#fff', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'.9rem', flexShrink:0 }}>
            ✕
          </button>
        </div>

        <div style={{ padding:'1.5rem' }}>

          {/* ── Bloc infos demande ── */}
          <div style={{ background:T.g50, border:`1px solid ${T.g200}`, borderRadius:12, padding:'1rem', marginBottom:18 }}>

            {/* Auditeur + date envoi */}
            <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:14, paddingBottom:14, borderBottom:`1px solid ${T.g200}` }}>
              <div style={{
                width:42, height:42, borderRadius:11,
                background:'linear-gradient(135deg,#002855,#0057B8)',
                color:'#fff', display:'flex', alignItems:'center', justifyContent:'center',
                fontSize:'.9rem', fontWeight:800, flexShrink:0,
              }}>
                {auditeurNom?.charAt(0)?.toUpperCase() || 'A'}
              </div>
              <div>
                <div style={{ fontSize:'.68rem', fontWeight:700, color:T.g400, textTransform:'uppercase', letterSpacing:'.05em' }}>Auditeur</div>
                <div style={{ fontSize:'.9rem', fontWeight:800, color:T.navy }}>{auditeurNom}</div>
              </div>
              {demande?.createdAt && (
                <div style={{ marginLeft:'auto', fontSize:'.7rem', color:T.g400, fontWeight:600, textAlign:'right' }}>
                  Envoyé le<br/>
                  <span style={{ color:T.g700 }}>{fmtDate(demande.createdAt)}</span>
                </div>
              )}
            </div>

            {/* Raison */}
            <div style={{ marginBottom:12 }}>
              <div style={{ fontSize:'.68rem', fontWeight:700, color:T.g400, textTransform:'uppercase', letterSpacing:'.05em', marginBottom:5 }}>Raison du retard</div>
              <div style={{
                display:'inline-flex', alignItems:'center', gap:6,
                background:T.orangeBg, border:`1px solid ${T.orangeBd}`,
                borderRadius:8, padding:'6px 12px',
                fontSize:'.8rem', fontWeight:700, color:T.orange,
              }}>
                {raisonLabel}
              </div>
            </div>

            {/* Description */}
            <div style={{ marginBottom:12 }}>
              <div style={{ fontSize:'.68rem', fontWeight:700, color:T.g400, textTransform:'uppercase', letterSpacing:'.05em', marginBottom:5 }}>Description</div>
              <div style={{
                background:'#fff', border:`1px solid ${T.g200}`,
                borderRadius:8, padding:'10px 12px',
                fontSize:'.83rem', color:T.g700, lineHeight:1.6,
              }}>
                {demande?.description || '—'}
              </div>
            </div>

            {/* Délai demandé */}
            <div>
              <div style={{ fontSize:'.68rem', fontWeight:700, color:T.g400, textTransform:'uppercase', letterSpacing:'.05em', marginBottom:5 }}>Nouveau délai souhaité par l'auditeur</div>
              <div style={{
                display:'inline-flex', alignItems:'center', gap:6,
                background:T.warnBg, border:`1px solid ${T.warnBd}`,
                borderRadius:8, padding:'6px 12px',
                fontSize:'.8rem', fontWeight:700, color:T.warn,
              }}>
                📅 {fmtDate(demande?.delaiDemande)}
              </div>
            </div>
          </div>

          {/* ── Séparateur ── */}
          <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:18 }}>
            <div style={{ flex:1, height:1, background:T.g200 }}/>
            <span style={{ fontSize:'.72rem', fontWeight:700, color:T.g400, textTransform:'uppercase', letterSpacing:'.06em', whiteSpace:'nowrap' }}>
              Modifier l'audit
            </span>
            <div style={{ flex:1, height:1, background:T.g200 }}/>
          </div>

          {/* ── Formulaire ── */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:12 }}>

            {/* Auditeur assigné — readonly, pré-rempli */}
            <div style={{ gridColumn:'1/-1' }}>
              <label style={{ display:'block', fontSize:'.68rem', fontWeight:700, color:T.g500, textTransform:'uppercase', letterSpacing:'.05em', marginBottom:4 }}>
                Auditeur assigné
              </label>
              <div style={{
                display:'flex', alignItems:'center', gap:10,
                background:T.g50, border:`1.5px solid ${T.g200}`,
                borderRadius:8, padding:'8px 12px',
              }}>
                <div style={{
                  width:30, height:30, borderRadius:8, flexShrink:0,
                  background:'linear-gradient(135deg,#002855,#0057B8)',
                  color:'#fff', display:'flex', alignItems:'center', justifyContent:'center',
                  fontSize:'.75rem', fontWeight:800,
                }}>
                  {auditeurNom?.charAt(0)?.toUpperCase() || 'A'}
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:'.84rem', fontWeight:700, color:T.navy }}>{auditeurNom}</div>
                  <div style={{ fontSize:'.68rem', color:T.g400, marginTop:1 }}>Auditeur assigné à cet audit</div>
                </div>
                {/* Select caché pour changer si besoin */}
                <select
                  value={auditeurId}
                  onChange={e => setAuditeurId(e.target.value)}
                  style={{ border:`1px solid ${T.g300}`, borderRadius:6, padding:'4px 8px', fontSize:'.72rem', fontFamily:'inherit', color:T.g700, background:'#fff', cursor:'pointer' }}>
                  <option value="">— changer —</option>
                  {auditeurs.map(a => (
                    <option key={a.id} value={String(a.id)}>
                      {a.prenom} {a.nom}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Date prévue — readonly, non modifiable */}
            <div>
              <label style={{ display:'block', fontSize:'.68rem', fontWeight:700, color:T.g500, textTransform:'uppercase', letterSpacing:'.05em', marginBottom:4 }}>
                Date prévue
                <span style={{ marginLeft:6, fontSize:'.62rem', fontWeight:600, color:T.g400, textTransform:'none' }}>(non modifiable)</span>
              </label>
              <div style={{
                ...INP_READONLY,
                display:'flex', alignItems:'center', gap:8,
                borderRadius:8, padding:'8px 11px',
              }}>
                <span style={{ fontSize:'.75rem', color:T.g400 }}>📅</span>
                <span style={{ fontSize:'.84rem', fontWeight:700, color:T.g500 }}>{datePrevueFmt}</span>
              </div>
              <div style={{ fontSize:'.64rem', color:T.g400, marginTop:3 }}>
                Date d'origine enregistrée dans la planification
              </div>
            </div>

            {/* Nouvelle deadline — pré-remplie avec délai demandé */}
            <div>
              <label style={{ display:'block', fontSize:'.68rem', fontWeight:700, color:T.g500, textTransform:'uppercase', letterSpacing:'.05em', marginBottom:4 }}>
                Nouvelle deadline *
              </label>
              <input
                type="date"
                value={deadline}
                onChange={e => setDeadline(e.target.value)}
                style={{
                  ...INP,
                  border:`1.5px solid ${deadline ? T.g300 : T.g200}`,
                }}
              />
              {demande?.delaiDemande && (
                <div style={{ fontSize:'.64rem', color:T.warn, marginTop:3, fontWeight:600 }}>
                  ← Délai demandé par l'auditeur : {fmtDate(demande.delaiDemande)}
                </div>
              )}
            </div>

            {/* Observations */}
            <div style={{ gridColumn:'1/-1' }}>
              <label style={{ display:'block', fontSize:'.68rem', fontWeight:700, color:T.g500, textTransform:'uppercase', letterSpacing:'.05em', marginBottom:4 }}>
                Observations
              </label>
              <textarea
                rows={3}
                style={{ ...INP, resize:'vertical', minHeight:65 }}
                value={observations}
                onChange={e => setObservations(e.target.value)}
                placeholder="Ajouter une note ou instruction pour l'auditeur…"
              />
            </div>
          </div>

          {/* ── Erreur / Succès ── */}
          {error && (
            <div style={{ background:T.dangerBg, border:`1px solid ${T.dangerBd}`, borderRadius:8, padding:'9px 13px', marginBottom:12, fontSize:'.8rem', color:T.danger, fontWeight:600 }}>
              ⚠ {error}
            </div>
          )}
          {saveOk && (
            <div style={{ background:T.successBg, border:`1px solid ${T.successBd}`, borderRadius:8, padding:'9px 13px', marginBottom:12, fontSize:'.8rem', color:T.success, fontWeight:700 }}>
              ✓ Audit modifié avec succès !
            </div>
          )}

          {/* ── Boutons ── */}
          <div style={{ display:'flex', gap:10, marginTop:4 }}>
            <button
              onClick={onClose} disabled={saving}
              style={{
                flex:1, padding:'10px', borderRadius:10,
                border:`1.5px solid ${T.g200}`, background:'#fff',
                color:T.g700, fontWeight:700, fontSize:'.82rem',
                cursor:'pointer', fontFamily:'inherit',
              }}>
              Fermer
            </button>
            <button
              onClick={handleSave}
              disabled={saving || saveOk || !deadline || demandeDejaTraitee}
              style={{
                flex:2, padding:'10px', borderRadius:10, border:'none',
                background: (saving || saveOk || !deadline || demandeDejaTraitee)
                  ? T.g200
                  : 'linear-gradient(145deg,#002855,#003F8A,#0057B8)',
                color: (saving || saveOk || !deadline || demandeDejaTraitee)
                  ? T.g400 : '#fff',
                fontWeight:800, fontSize:'.82rem',
                cursor: (saving || !deadline || demandeDejaTraitee) ? 'not-allowed' : 'pointer',
                fontFamily:'inherit',
                display:'flex', alignItems:'center', justifyContent:'center', gap:8,
                boxShadow: (saving || saveOk || !deadline || demandeDejaTraitee)
                  ? 'none' : '0 6px 18px rgba(0,40,85,.22)',
              }}>
              {saving ? (
                <>
                  <div style={{ width:13, height:13, border:'2px solid rgba(255,255,255,.3)', borderTopColor:'#fff', borderRadius:'50%', animation:'spin .7s linear infinite' }}/>
                  Enregistrement…
                </>
              ) : saveOk ? '✓ Modifié !'
                : demandeDejaTraitee ? '✓ Demande déjà traitée'
                : '✏ Valider la nouvelle deadline'}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}