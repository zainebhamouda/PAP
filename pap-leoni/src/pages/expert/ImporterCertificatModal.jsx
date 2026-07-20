import { useState, useEffect, useMemo } from 'react';
import { certificatAuditeurAPI } from '../../services/api';

export default function ImporterCertificatModal({ onClose, onSuccess }) {
  const [auditeurs, setAuditeurs] = useState([]);
  const [loadingList, setLoadingList] = useState(true);
  const [auditeurId, setAuditeurId] = useState('');
  const [dateObtention, setDateObtention] = useState(() => new Date().toISOString().slice(0, 10));
  const [fichier, setFichier] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    certificatAuditeurAPI.getAuditeursDeMonPlant()
      .then(r => setAuditeurs(Array.isArray(r.data) ? r.data : []))
      .catch(() => setError('Impossible de charger les auditeurs de votre plant.'))
      .finally(() => setLoadingList(false));
  }, []);

  const dateExpirationPreview = useMemo(() => {
    if (!dateObtention) return '—';
    try {
      const d = new Date(dateObtention);
      d.setFullYear(d.getFullYear() + 2);
      return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
    } catch { return '—'; }
  }, [dateObtention]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!auditeurId) { setError('Sélectionnez un auditeur.'); return; }
    if (!dateObtention) { setError('Indiquez la date d\'obtention.'); return; }
    if (!fichier) { setError('Veuillez sélectionner un fichier PDF.'); return; }
    if (fichier.type !== 'application/pdf') { setError('Le fichier doit être un PDF.'); return; }
    if (fichier.size > 5 * 1024 * 1024) { setError('Le fichier ne doit pas dépasser 5 Mo.'); return; }

    setSubmitting(true);
    try {
      const isoDateTime = `${dateObtention}T00:00:00`;
      await certificatAuditeurAPI.importer(auditeurId, isoDateTime, fichier);
      onSuccess?.();
    } catch (e2) {
      // Interprétation des erreurs serveur pour un affichage plus clair
      const msg = e2?.response?.data?.message || e2.message || 'Erreur lors de l\'import.';
      if (msg.includes('FileNotFoundException') || msg.includes('chemin d’accès')) {
        setError('Le serveur n’a pas pu enregistrer le fichier. Contactez l’administrateur (dossier d’upload inaccessible).');
      } else {
        setError(msg);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(3,12,28,.55)', zIndex:1300, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <form onSubmit={handleSubmit}
        style={{ width:'100%', maxWidth:460, background:'#fff', borderRadius:18, boxShadow:'0 28px 80px rgba(0,40,85,.28)', overflow:'hidden' }}>

        <div style={{ background:'linear-gradient(135deg,#0B1E3D,#132A52)', color:'#fff', padding:'18px 22px' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <div>
              <div style={{ fontSize:'.67rem', fontWeight:800, textTransform:'uppercase', letterSpacing:'.12em', opacity:.65, marginBottom:4 }}>
                Auditeur déjà certifié
              </div>
              <div style={{ fontWeight:900, fontSize:'1.05rem' }}> Importer un certificat</div>
            </div>
            <button type="button" onClick={onClose}
              style={{ border:'1px solid rgba(255,255,255,.25)', background:'rgba(255,255,255,.1)', color:'#fff', width:32, height:32, borderRadius:9, cursor:'pointer', fontWeight:800 }}>✕</button>
          </div>
        </div>

        <div style={{ padding:'20px 22px', display:'grid', gap:14 }}>
          <div style={{ fontSize:'.78rem', color:'#64748B', lineHeight:1.5 }}>
            Pour un auditeur possédant déjà un certificat obtenu en dehors de l'application
            (formation antérieure, entreprise déjà en activité), importez directement le PDF
            au lieu de lui faire repasser les tests.
          </div>

          <div>
            <label style={LBL}>Auditeur (de votre plant) *</label>
            <select required value={auditeurId} onChange={e => setAuditeurId(e.target.value)} style={INP} disabled={loadingList}>
              <option value="">{loadingList ? 'Chargement…' : 'Sélectionner un auditeur'}</option>
              {auditeurs.map(a => (
                <option key={a.id} value={a.id}>{a.prenom} {a.nom} {a.matricule ? `(${a.matricule})` : ''}</option>
              ))}
            </select>
            {!loadingList && auditeurs.length === 0 && (
              <div style={{ fontSize:'.72rem', color:'#DC2626', marginTop:4 }}>Aucun auditeur trouvé dans votre plant.</div>
            )}
          </div>

          <div>
            <label style={LBL}>Date d'obtention *</label>
            <input required type="date" value={dateObtention} max={new Date().toISOString().slice(0,10)}
              onChange={e => setDateObtention(e.target.value)} style={INP} />
          </div>

          <div style={{ background:'#F0FDF4', border:'1px solid #BBF7D0', borderRadius:10, padding:'9px 12px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <span style={{ fontSize:'.75rem', color:'#166534', fontWeight:600 }}>Date d'expiration (auto, +2 ans)</span>
            <strong style={{ fontSize:'.8rem', color:'#15803D' }}>{dateExpirationPreview}</strong>
          </div>

          <div>
            <label style={LBL}>Certificat (PDF) *</label>
            <input type="file" accept="application/pdf" onChange={e => setFichier(e.target.files?.[0] || null)} style={INP} />
            {fichier && <div style={{ fontSize:'.7rem', color:'#475569', marginTop:2 }}>{fichier.name} ({(fichier.size / 1024).toFixed(0)} Ko)</div>}
          </div>

          {error && (
            <div style={{ background:'#FEF2F2', border:'1px solid #FECACA', color:'#DC2626', borderRadius:9, padding:'8px 12px', fontSize:'.78rem', fontWeight:600 }}>{error}</div>
          )}
        </div>

        <div style={{ padding:'14px 22px', borderTop:'1px solid #F1F5F9', display:'flex', justifyContent:'flex-end', gap:10 }}>
          <button type="button" onClick={onClose}
            style={{ padding:'9px 16px', borderRadius:9, border:'1px solid #E2E8F0', background:'#fff', color:'#475569', fontWeight:700, fontSize:'.8rem', cursor:'pointer', fontFamily:'inherit' }}>
            Annuler
          </button>
          <button type="submit" disabled={submitting}
            style={{ padding:'9px 18px', borderRadius:9, border:'none', background: submitting ? '#94A3B8' : 'linear-gradient(135deg,#0D9488,#0F766E)', color:'#fff', fontWeight:700, fontSize:'.8rem', cursor: submitting ? 'default' : 'pointer', fontFamily:'inherit', boxShadow: submitting ? 'none' : '0 4px 12px rgba(13,148,136,.3)' }}>
            {submitting ? 'Import…' : 'Importer'}
          </button>
        </div>
      </form>
    </div>
  );
}

const LBL = { display:'block', fontSize:'.69rem', fontWeight:700, color:'#64748B', textTransform:'uppercase', letterSpacing:'.05em', marginBottom:4 };
const INP = { width:'100%', padding:'8px 11px', border:'1px solid #CBD5E1', borderRadius:8, fontSize:'.84rem', fontFamily:'inherit', background:'#fff', boxSizing:'border-box', outline:'none' };