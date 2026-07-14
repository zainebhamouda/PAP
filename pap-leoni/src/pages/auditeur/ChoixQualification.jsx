// ChoixQualification.jsx — Sprint 2
// Modal de sélection de qualification pour l'auditeur
// ⚠️  NE crée PLUS de passage — retourne uniquement les métadonnées
//     { certificationId, titre, formationUrl, formationNom }
//     C'est ExamenPage qui créera le passage au clic "Commencer l'examen"

import { useState, useEffect } from 'react';
import { auditeurCertifAPI } from '../../services/certifAPI';

const CSS = `
@keyframes fadeIn  { from{opacity:0} to{opacity:1} }
@keyframes slideUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:none} }
@keyframes spin    { to{transform:rotate(360deg)} }
.cq-card { transition:all .18s; cursor:pointer; }
.cq-card:hover { transform:translateY(-2px) !important; }
`;

const DEFAULT_COLORS = ['#0B1E3D','#1D4ED8','#7C3AED','#059669','#D97706','#0891B2'];

export default function ChoixQualification({ onSelect, onClose }) {
  const [certifs,  setCertifs]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    auditeurCertifAPI.getCertificationsDisponibles()
      .then(r => setCertifs(r.data || []))
      .catch(() => setCertifs([]))
      .finally(() => setLoading(false));
  }, []);

  // Confirmer = transmettre les métadonnées SANS créer de passage
  const handleConfirm = () => {
    if (!selected) return;
    const certif = certifs.find(c => c.id === selected);
    if (!certif) return;
    onSelect({
      certificationId: certif.id,
      titre:           certif.titre,
      formationUrl:    certif.formationUrl || null,
      formationNom:    certif.formationNom || null,
    });
  };

  const selectedCertif = certifs.find(c => c.id === selected);

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)',
      zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '1.5rem', animation: 'fadeIn .2s ease'
    }} onClick={e => e.target === e.currentTarget && onClose()}>
      <style>{CSS}</style>
      <div style={{
        background: '#fff', borderRadius: 20, width: '100%', maxWidth: 600,
        maxHeight: '85vh', overflow: 'hidden', display: 'flex', flexDirection: 'column',
        boxShadow: '0 24px 80px rgba(0,0,0,.25)', animation: 'slideUp .25s cubic-bezier(.34,1.4,.64,1)',
        fontFamily: "'DM Sans', sans-serif"
      }}>

        {/* Header */}
        <div style={{ background: '#0B1E3D', padding: '1.5rem 1.75rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h2 style={{ margin: 0, fontWeight: 800, color: '#fff', fontSize: '1.1rem' }}>
              Choisir votre qualification
            </h2>
            <p style={{ margin: '4px 0 0', fontSize: '.78rem', color: 'rgba(255,255,255,.5)' }}>
              {loading ? 'Chargement…' : `${certifs.length} qualification${certifs.length !== 1 ? 's' : ''} disponible${certifs.length !== 1 ? 's' : ''}`}
            </p>
          </div>
          <button onClick={onClose} style={{ width: 34, height: 34, borderRadius: 8, background: 'rgba(255,255,255,.15)', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem' }}>
            ✕
          </button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem' }}>
          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200, gap: 10, color: '#94A3B8' }}>
              <span style={{ width: 22, height: 22, border: '2.5px solid #E2E8F0', borderTopColor: '#0B1E3D', borderRadius: '50%', display: 'inline-block', animation: 'spin .7s linear infinite' }} />
              Chargement…
            </div>
          ) : certifs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#94A3B8' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>🎯</div>
              <p style={{ fontWeight: 700, color: '#374151', margin: '0 0 8px' }}>Aucune qualification disponible</p>
              <p style={{ fontSize: '.84rem', margin: 0 }}>
                Vous avez déjà passé toutes les qualifications actives, ou aucune n'est disponible pour le moment.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {certifs.map((c, idx) => {
                const color = c.clientCouleur || DEFAULT_COLORS[idx % DEFAULT_COLORS.length];
                const isSelected = selected === c.id;
                return (
                  <div key={c.id}
                    className="cq-card"
                    onClick={() => setSelected(c.id)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 16,
                      padding: '1rem 1.25rem',
                      border: `2px solid ${isSelected ? color : '#E8EDF7'}`,
                      borderRadius: 14,
                      background: isSelected ? `${color}0a` : '#fff',
                      boxShadow: isSelected ? `0 4px 16px ${color}25` : '0 1px 4px rgba(0,0,0,.04)',
                      transform: isSelected ? 'translateY(-2px)' : 'none',
                      position: 'relative', overflow: 'hidden',
                    }}>

                    {/* Barre couleur client */}
                    <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, background: color, borderRadius: '0 3px 3px 0' }} />

                    {/* Icône client */}
                    {c.clientLogoUrl ? (
                      <img src={c.clientLogoUrl} alt={c.clientNom} style={{ width: 48, height: 48, objectFit: 'contain', borderRadius: 10, flexShrink: 0, border: '1px solid #F0F4FA' }} />
                    ) : (
                      <div style={{
                        width: 50, height: 50, borderRadius: 12, flexShrink: 0,
                        background: color, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: '#fff', fontWeight: 800, fontSize: '1.1rem',
                      }}>
                        {c.clientCode || (c.clientNom ? c.clientNom.slice(0, 2).toUpperCase() : '🛡')}
                      </div>
                    )}

                    {/* Contenu */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5, flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: 800, fontSize: '.92rem', color: '#0B1E3D' }}>{c.titre}</span>
                        {c.clientNom && (
                          <span style={{ background: `${color}20`, color: color, fontSize: '.68rem', fontWeight: 700, padding: '2px 9px', borderRadius: 99 }}>
                            {c.clientNom}
                          </span>
                        )}
                      </div>
                      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', fontSize: '.75rem', color: '#64748B' }}>
                        <span>📝 {(c.nbQuestionsImage || 0) + (c.nbQuestionsQCM || 0)} questions</span>
                        <span>· Seuil théo. {c.seuilTheorique}%</span>
                        {c.seuilPratique && <span>· Seuil prat. {c.seuilPratique}%</span>}
                        {c.formationUrl && <span style={{ color: '#059669', fontWeight: 700 }}>· 📄 Formation disponible</span>}
                      </div>
                    </div>

                    {/* Indicateur sélection */}
                    <div style={{
                      width: 24, height: 24, borderRadius: '50%', flexShrink: 0,
                      background: isSelected ? color : '#F1F5F9',
                      border: `2px solid ${isSelected ? color : '#E2E8F0'}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      transition: 'all .15s',
                    }}>
                      {isSelected && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        {certifs.length > 0 && (
          <div style={{ padding: '1.25rem 1.5rem', borderTop: '1px solid #F1F5F9', display: 'flex', gap: 10, background: '#FAFBFD' }}>
            <button onClick={onClose} style={{ flex: 1, padding: '11px', borderRadius: 10, border: '1.5px solid #E2E8F0', background: '#fff', fontWeight: 700, fontSize: '.88rem', cursor: 'pointer', color: '#374151', fontFamily: 'inherit' }}>
              Annuler
            </button>
            <button
              onClick={handleConfirm}
              disabled={!selected}
              style={{
                flex: 2, padding: '11px', borderRadius: 10, border: 'none',
                background: selectedCertif?.clientCouleur || '#0B1E3D',
                color: '#fff', fontWeight: 700, fontSize: '.88rem',
                cursor: !selected ? 'not-allowed' : 'pointer',
                opacity: !selected ? .5 : 1,
                fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                transition: 'all .15s',
              }}>
              {selected
                ? <>Voir la formation — {selectedCertif?.titre} →</>
                : 'Sélectionnez une qualification'
              }
            </button>
          </div>
        )}
      </div>
    </div>
  );
}