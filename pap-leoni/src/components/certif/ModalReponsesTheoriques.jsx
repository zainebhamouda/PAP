// src/components/certif/ModalReponsesTheoriques.jsx
import { useState, useEffect } from 'react';
import api from '../../services/api';

const BASE = (import.meta.env?.VITE_API_URL || 'http://localhost:8080/api').replace('/api', '');

function fileUrl(path) {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  return `${BASE}/${path.replace(/^\//, '')}`;
}

export default function ModalReponsesTheoriques({ passageId, auditeurNom, role = 'expert', onClose, inline = false }) {
  const [reponses, setReponses] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [err, setErr]           = useState('');
  const [filtre, setFiltre]     = useState('toutes');

  useEffect(() => {
    if (!passageId) return;
    setLoading(true);
    const url = role === 'chef'
      ? `/chef-service/qualifications/${passageId}/reponses-theoriques`
      : `/expert-audit/passages/${passageId}/reponses-theoriques`;
    api.get(url)
      .then(r => setReponses(r.data || []))
      .catch(() => setErr('Impossible de charger les réponses.'))
      .finally(() => setLoading(false));
  }, [passageId, role]);

  const LETTERS = ['A', 'B', 'C', 'D', 'E'];

  const filtrées = reponses.filter(r => {
    if (filtre === 'correctes')   return r.correcte === true;
    if (filtre === 'incorrectes') return r.correcte === false || r.expiree;
    return true;
  });

  const nbCorrectes = reponses.filter(r => r.correcte).length;
  const nbTotal     = reponses.length;
  const pct         = nbTotal > 0 ? Math.round((nbCorrectes / nbTotal) * 100) : 0;

  const contenu = (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
      {/* Header — masqué en mode inline */}
      {!inline && (
        <div style={{ background: 'linear-gradient(135deg,#0B1E3D,#1D4ED8)', padding: '16px 22px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0, borderRadius: '20px 20px 0 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: 'rgba(255,255,255,.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '1.1rem' }}>📋</div>
            <div>
              <div style={{ fontWeight: 800, color: '#fff', fontSize: '.95rem' }}>Réponses du test théorique</div>
              <div style={{ fontSize: '.72rem', color: 'rgba(255,255,255,.55)', marginTop: 2 }}>{auditeurNom} — {nbCorrectes}/{nbTotal} correctes ({pct}%)</div>
            </div>
          </div>
          <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: 8, background: 'rgba(255,255,255,.12)', border: 'none', cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem' }}>✕</button>
        </div>
      )}

      {/* Stats + filtres */}
      <div style={{ padding: '10px 16px', borderBottom: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0, background: '#F8FAFC' }}>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {[
            { key: 'toutes',      label: `Toutes (${nbTotal})` },
            { key: 'correctes',   label: `✓ Correctes (${nbCorrectes})` },
            { key: 'incorrectes', label: `✗ Incorrectes (${nbTotal - nbCorrectes})` },
          ].map(f => (
            <button key={f.key} onClick={() => setFiltre(f.key)}
              style={{ padding: '5px 11px', borderRadius: 7, border: filtre === f.key ? '1.5px solid #0B1E3D' : '1px solid #E2E8F0', background: filtre === f.key ? '#0B1E3D' : '#fff', color: filtre === f.key ? '#fff' : '#64748B', fontSize: '.73rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
              {f.label}
            </button>
          ))}
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ height: 7, width: 100, background: '#E2E8F0', borderRadius: 99, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${pct}%`, background: pct >= 70 ? '#059669' : '#DC2626', borderRadius: 99 }} />
          </div>
          <span style={{ fontSize: '.75rem', fontWeight: 800, color: pct >= 70 ? '#059669' : '#DC2626' }}>{pct}%</span>
        </div>
      </div>

      {/* Liste des réponses */}
      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {loading && (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#94A3B8' }}>
            <div style={{ width: 20, height: 20, border: '2px solid #E2E8F0', borderTopColor: '#0B1E3D', borderRadius: '50%', animation: 'spin .7s linear infinite', display: 'inline-block', marginBottom: 8 }} />
            <div>Chargement des réponses…</div>
          </div>
        )}
        {err && (
          <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 10, padding: '1rem', color: '#DC2626', textAlign: 'center' }}>{err}</div>
        )}
        {!loading && !err && filtrées.length === 0 && (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#94A3B8', fontSize: '.85rem' }}>Aucune réponse dans ce filtre.</div>
        )}
        {!loading && filtrées.map((r, idx) => {
          const isImg      = r.type === 'IMAGE_DEFAUT';
          const isCorr     = r.correcte === true;
          const isExp      = r.expiree === true;
          const imgSrc     = r.imageUrl ? fileUrl(r.imageUrl) : null;
          const defauts    = r.defautsDisponibles || [];
          const bonneRep   = r.bonneReponseImage;
          const repTexte   = r.reponseTexte;
          const repIndex   = r.reponseIndex; // Integer unique
          const bonnesIdx  = r.bonnesReponsesIndexes || [];
          const options    = r.options || [];

          return (
            <div key={r.questionId || idx} style={{
              background: '#fff',
              border: `1.5px solid ${isCorr ? '#A7F3D0' : isExp ? '#FCD34D' : '#FECACA'}`,
              borderRadius: 14, overflow: 'hidden',
              flexShrink: 0,
            }}>
              {/* En-tête */}
              <div style={{ padding: '8px 14px', background: isCorr ? '#ECFDF5' : isExp ? '#FFFBEB' : '#FEF2F2', borderBottom: '1px solid #F0F0F0', display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ background: isCorr ? '#059669' : isExp ? '#D97706' : '#DC2626', color: '#fff', fontSize: '.67rem', fontWeight: 800, padding: '2px 8px', borderRadius: 99 }}>
                  {isExp ? '⏰ Temps écoulé' : isCorr ? '✓ Correcte' : '✗ Incorrecte'}
                </span>
                <span style={{ fontSize: '.7rem', color: '#64748B', fontWeight: 600 }}>
                  Q{r.numeroQuestion || (idx + 1)} · {isImg ? 'Image câblage' : 'QCM'} · {r.pointsObtenus ?? 0}/{r.points ?? 1} pts
                </span>
              </div>

              {/* Corps IMAGE */}
              {isImg && (
                <div style={{ padding: '12px', display: 'grid', gridTemplateColumns: imgSrc ? '1fr 1fr' : '1fr', gap: 12 }}>
                  {imgSrc && (
                    <div style={{ border: '1px solid #E2E8F0', borderRadius: 10, overflow: 'hidden', background: '#F8FAFC' }}>
                      <img src={imgSrc} alt="Question câblage" style={{ width: '100%', height: 150, objectFit: 'contain', display: 'block', padding: '0.5rem' }} />
                    </div>
                  )}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', borderRadius: 8, padding: '8px 12px' }}>
                      <div style={{ fontSize: '.65rem', fontWeight: 800, color: '#059669', textTransform: 'uppercase', marginBottom: 3 }}>Bonne réponse</div>
                      <div style={{ fontSize: '.85rem', fontWeight: 700, color: '#065F46' }}>{bonneRep || '—'}</div>
                    </div>
                    <div style={{ background: isCorr ? '#ECFDF5' : '#FEF2F2', border: `1px solid ${isCorr ? '#A7F3D0' : '#FECACA'}`, borderRadius: 8, padding: '8px 12px' }}>
                      <div style={{ fontSize: '.65rem', fontWeight: 800, color: isCorr ? '#059669' : '#DC2626', textTransform: 'uppercase', marginBottom: 3 }}>Réponse de l'auditeur</div>
                      <div style={{ fontSize: '.85rem', fontWeight: 700, color: isCorr ? '#065F46' : '#991B1B' }}>
                        {isExp ? '⏰ Pas de réponse (temps écoulé)' : (repTexte || '—')}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Corps QCM */}
              {!isImg && (
                <div style={{ padding: '12px 14px' }}>
                  <p style={{ fontSize: '.87rem', fontWeight: 700, color: '#0B1E3D', margin: '0 0 10px', lineHeight: 1.5 }}>{r.enonce}</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {options.map((opt, i) => {
                      const isBonne   = bonnesIdx.includes(i);
                      const isChoisie = repIndex === i;
                      const bg     = isBonne && isChoisie ? '#ECFDF5' : isBonne ? '#F0FDF4' : isChoisie ? '#FEF2F2' : '#F8FAFC';
                      const border  = isBonne && isChoisie ? '#A7F3D0' : isBonne ? '#BBF7D0' : isChoisie ? '#FECACA' : '#E2E8F0';
                      const color   = isBonne && isChoisie ? '#065F46' : isBonne ? '#166534' : isChoisie ? '#991B1B' : '#374151';
                      const letterBg = isBonne ? '#059669' : isChoisie ? '#DC2626' : '#E2E8F0';
                      const letterCol = isBonne || isChoisie ? '#fff' : '#6B7280';
                      return (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: bg, border: `1.5px solid ${border}`, borderRadius: 8 }}>
                          <span style={{ width: 22, height: 22, borderRadius: 6, background: letterBg, color: letterCol, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '.72rem', fontWeight: 800, flexShrink: 0 }}>
                            {LETTERS[i]}
                          </span>
                          <span style={{ fontSize: '.84rem', fontWeight: 600, color, flex: 1 }}>{opt}</span>
                          {isBonne  && <span style={{ fontSize: '.67rem', color: '#059669', fontWeight: 800, whiteSpace: 'nowrap' }}>✓ Correcte</span>}
                          {isChoisie && !isBonne && <span style={{ fontSize: '.67rem', color: '#DC2626', fontWeight: 800, whiteSpace: 'nowrap' }}>✗ Choisie</span>}
                          {isExp && isBonne && <span style={{ fontSize: '.67rem', color: '#D97706', fontWeight: 800, whiteSpace: 'nowrap' }}>⏰ Non répondu</span>}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer — masqué en mode inline */}
      {!inline && (
        <div style={{ padding: '12px 22px', borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'flex-end', background: '#F8FAFC', flexShrink: 0, borderRadius: '0 0 20px 20px' }}>
          <button onClick={onClose} style={{ padding: '9px 20px', background: '#0B1E3D', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 700, fontSize: '.88rem', cursor: 'pointer', fontFamily: 'inherit' }}>
            Fermer
          </button>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  // Mode inline : pas de fond modal, juste le contenu
  if (inline) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
        {contenu}
      </div>
    );
  }

  // Mode modal normal
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.55)', zIndex: 10001, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)', padding: '1rem' }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: '#fff', borderRadius: 20, width: '100%', maxWidth: 780, maxHeight: '92vh', display: 'flex', flexDirection: 'column', boxShadow: '0 32px 80px rgba(0,0,0,.22)', overflow: 'hidden', minHeight: 0 }}>
        {contenu}
      </div>
    </div>
  );
}