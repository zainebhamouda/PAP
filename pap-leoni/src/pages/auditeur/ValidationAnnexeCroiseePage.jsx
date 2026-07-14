import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const API = 'http://localhost:8080/api';
const apiH = () => ({ Authorization: `Bearer ${localStorage.getItem('token')}`, 'Content-Type': 'application/json' });

/**
 * Fenêtre affichée à l'auditeur désigné lorsqu'il clique sur la notification
 * "Annexe à valider". Affiche le PDF de l'annexe remplie par son collègue,
 * puis permet de Valider ou Rejeter (l'annexe devient alors "Complète").
 */
export default function ValidationAnnexeCroiseePage() {
  const { auditId, typeAnnexe } = useParams();
  const navigate = useNavigate();

  const [annexe, setAnnexe]     = useState(null);
  const [pdfUrl, setPdfUrl]     = useState(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [commentaire, setCommentaire] = useState('');
  const [submitting, setSubmitting]   = useState(false);
  const [done, setDone] = useState(null); // 'VALIDEE' | 'REJETEE'

  useEffect(() => {
    let objectUrl = null;

    async function load() {
      try {
        const res = await fetch(`${API}/audit-produit/${auditId}/annexes/${typeAnnexe}/validation-croisee`, { headers: apiH() });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.message || "Impossible de charger l'annexe.");
        }
        const data = await res.json();
        setAnnexe(data);

        const pdfRes = await fetch(`${API}/audit-produit/${auditId}/annexes/${typeAnnexe}/pdf-validation`, { headers: apiH() });
        if (pdfRes.ok) {
          const blob = await pdfRes.blob();
          objectUrl = URL.createObjectURL(blob);
          setPdfUrl(objectUrl);
        }
      } catch (e) {
        setError(e.message || "Erreur de chargement.");
      } finally {
        setLoading(false);
      }
    }
    load();

    return () => { if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [auditId, typeAnnexe]);

  const handleDecision = async (valide) => {
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch(`${API}/audit-produit/${auditId}/annexes/${typeAnnexe}/valider-croisee`, {
        method: 'PUT', headers: apiH(),
        body: JSON.stringify({ valide, commentaire }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message || "Erreur lors de l'envoi de votre décision.");
      }
      setDone(valide ? 'VALIDEE' : 'REJETEE');
    } catch (e) {
      setError(e.message || "Erreur lors de l'envoi de votre décision.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={styles.backdrop}>
        <div style={styles.modalShell}>
          <div style={styles.loadingState}>Chargement de l'annexe…</div>
        </div>
      </div>
    );
  }

  if (error && !annexe) {
    return (
      <div style={styles.backdrop}>
        <div style={styles.modalShell}>
          <div style={styles.headerBar}>
            <div>
              <div style={styles.title}>Validation de l'Annexe {typeAnnexe}</div>
              <div style={styles.subtitle}>Impossible de charger l'annexe pour le moment.</div>
            </div>
            <button onClick={() => navigate('/auditeur/dashboard')} style={styles.iconButton} aria-label="Fermer la fenêtre">
              ✕
            </button>
          </div>
          <div style={styles.errorState}>
            <div style={styles.errorText}>{error}</div>
            <button onClick={() => navigate('/auditeur/dashboard')} style={styles.primaryButton}>
              Retour au tableau de bord
            </button>
          </div>
        </div>
      </div>
    );
  }

  const dejaTraitee = annexe?.statutValidationCroisee && annexe.statutValidationCroisee !== 'EN_ATTENTE';

  return (
    <div style={styles.backdrop}>
      <div style={styles.modalShell}>
        <div style={styles.headerBar}>
          <div>
            <div style={styles.title}>Validation de l'Annexe {typeAnnexe}</div>
            <div style={styles.subtitle}>Vérifiez le contenu ci-dessous puis validez ou rejetez cette annexe.</div>
          </div>
          <button onClick={() => navigate('/auditeur/dashboard')} style={styles.iconButton} aria-label="Fermer la fenêtre">
            ✕
          </button>
        </div>

        {(done || dejaTraitee) ? (
          <div style={styles.completedState}>
            <div style={{ ...styles.completedText, color: (done || annexe.statutValidationCroisee) === 'VALIDEE' ? '#22C55E' : '#FB7185' }}>
              {(done || annexe.statutValidationCroisee) === 'VALIDEE' ? 'Annexe validée' : 'Annexe rejetée'}
            </div>
            <button onClick={() => navigate('/auditeur/dashboard')} style={styles.primaryButton}>
              Retour au tableau de bord
            </button>
          </div>
        ) : (
          <div style={styles.body}>
            <div style={styles.pdfFrame}>
              {pdfUrl ? (
                <iframe title={`Annexe ${typeAnnexe}`} src={pdfUrl} style={styles.iframe} />
              ) : (
                <div style={styles.loadingState}>Le PDF de cette annexe n'est pas encore disponible.</div>
              )}
            </div>

            <textarea
              placeholder="Commentaire (optionnel — obligatoire en cas de rejet)"
              value={commentaire}
              onChange={e => setCommentaire(e.target.value)}
              rows={3}
              style={styles.textarea}
            />

            {error && <div style={styles.inlineError}>{error}</div>}

            <div style={styles.actions}>
              <button
                disabled={submitting}
                onClick={() => {
                  if (!commentaire.trim()) { setError('Merci de préciser un motif de rejet.'); return; }
                  handleDecision(false);
                }}
                style={styles.rejectButton}
              >
                Rejeter
              </button>
              <button
                disabled={submitting}
                onClick={() => handleDecision(true)}
                style={styles.primaryButton}
              >
                Valider ✓
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  backdrop: {
    position: 'fixed',
    inset: 0,
    zIndex: 1200,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px',
    background: 'rgba(15, 23, 42, 0.55)',   // ← fond assombri plus léger
    backdropFilter: 'blur(8px)',
  },
  modalShell: {
    width: 'min(1040px, 100%)',
    maxHeight: '92vh',
    overflow: 'hidden',
    borderRadius: '24px',
    border: '1px solid #E2E8F0',             // ← bordure claire
    background: '#ffffff',                    // ← FOND BLANC
    boxShadow: '0 30px 90px rgba(0,0,0,0.20)',
    color: '#1E293B',                          // ← texte foncé par défaut
    display: 'flex',
    flexDirection: 'column',
  },
  headerBar: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: '16px',
    padding: '20px 24px',
    borderBottom: '1px solid #E2E8F0',
    background: 'linear-gradient(135deg, #001F4E, #003F8A)',   // header reste coloré
  },
  title: {
    fontWeight: 900,
    fontSize: '18px',
    lineHeight: 1.2,
    color: '#fff',
  },
  subtitle: {
    marginTop: '6px',
    fontSize: '13px',
    color: 'rgba(255,255,255,0.8)',
  },
  iconButton: {
    width: '38px',
    height: '38px',
    borderRadius: '12px',
    border: '1px solid rgba(255,255,255,0.25)',
    background: 'rgba(255,255,255,0.12)',
    color: '#fff',
    fontSize: '16px',
    cursor: 'pointer',
    flex: '0 0 auto',
  },
  body: {
    padding: '20px 24px 24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
    overflow: 'auto',
    background: '#ffffff',                    // ← fond blanc du corps
  },
  pdfFrame: {
    borderRadius: '18px',
    overflow: 'hidden',
    border: '1px solid #E2E8F0',
    background: '#F8FAFC',
    boxShadow: 'inset 0 1px 0 rgba(0,0,0,0.03)',
  },
  iframe: {
    width: '100%',
    height: '62vh',
    border: 'none',
    display: 'block',
    background: '#fff',
  },
  textarea: {
    width: '100%',
    padding: '14px 16px',
    borderRadius: '14px',
    border: '1.5px solid #CBD5E1',
    background: '#F7F9FC',                     // ← fond clair
    color: '#1E293B',                            // ← texte foncé
    fontSize: '14px',
    resize: 'vertical',
    outline: 'none',
  },
  inlineError: {
    color: '#DC2626',
    fontSize: '12px',
    marginTop: '-4px',
  },
  actions: {
    display: 'flex',
    gap: '10px',
    justifyContent: 'flex-end',
    flexWrap: 'wrap',
  },
  primaryButton: {
    padding: '11px 18px',
    borderRadius: '12px',
    border: 'none',
    background: 'linear-gradient(135deg, #0EA5E9, #2563EB)',
    color: '#fff',
    fontWeight: 800,
    cursor: 'pointer',
    boxShadow: '0 12px 24px rgba(37,99,235,0.25)',
  },
  rejectButton: {
    padding: '11px 18px',
    borderRadius: '12px',
    border: '1.5px solid #FECACA',
    background: '#FEF2F2',                      // ← fond clair
    color: '#DC2626',                             // ← texte rouge foncé
    fontWeight: 800,
    cursor: 'pointer',
  },
  completedState: {
    padding: '28px 24px 30px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '14px',
    background: '#ffffff',
  },
  completedText: {
    fontSize: '18px',
    fontWeight: 900,
  },
  loadingState: {
    padding: '34px 24px',
    textAlign: 'center',
    color: '#6B7280',
    background: '#F8FAFC',
  },
  errorState: {
    padding: '28px 24px 30px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '14px',
    background: '#ffffff',
  },
  errorText: {
    color: '#DC2626',
    fontWeight: 700,
    textAlign: 'center',
  },
};