// ═══════════════════════════════════════════════════════════════
// AuditDetailPage.jsx — Détail d'un audit (partagé tous rôles)
// ═══════════════════════════════════════════════════════════════
import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { auditAPI } from '../../services/auditAPI';
import styles from '../Audit.module.css';

const IC = {
  back:  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>,
  play:  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="5 3 19 12 5 21 5 3"/></svg>,
  edit:  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  pdca:  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
  check: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><polyline points="20 6 9 17 4 12"/></svg>,
  info:  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>,
};

const STATUT_CFG = {
  PLANIFIE:  { label: 'Planifié',  cl: styles.badgePlanifie },
  EN_COURS:  { label: 'En cours',  cl: styles.badgeEnCours  },
  TERMINE:   { label: 'Terminé',   cl: styles.badgeTermine  },
  ANNULE:    { label: 'Annulé',    cl: styles.badgeAnnule   },
  EN_RETARD: { label: 'En retard', cl: styles.badgeEnRetard },
};
const TYPE_CFG = {
  AUDIT_PRODUIT:       { label: 'Audit Produit',  cl: styles.badgeProduit  },
  AUDIT_REGLES_PLATES: { label: 'Règles Plates',  cl: styles.badgeRegle    },
  AUDIT_MAGASIN_EXPORT:{ label: 'Magasin Export', cl: styles.badgeMagasin  },
};

const CRITERES_LABELS = {
  lisibiliteGraduations: 'Lisibilité graduations',
  etatPhysique:          'État physique',
  precisionMesure:       'Précision mesure',
  etiquetteValidite:     'Étiquette validité',
  proprete:              'Propreté',
};

export default function AuditDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [audit,  setAudit]  = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast,   setToast]   = useState(null);
  const autoStartedRef = useRef(false);

  const role = user?.role;

  useEffect(() => {
    auditAPI.getById(id)
      .then(async r => {
        const data = r.data;
        setAudit(data);
        if (role === 'AUDITEUR' && data?.statut === 'PLANIFIE' && !autoStartedRef.current) {
          autoStartedRef.current = true;
          try {
            const started = await auditAPI.demarrer(id);
            setAudit(started.data);
          } catch {
          }
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id, role]);

  const handleDemarrer = async () => {
    try {
      const r = await auditAPI.demarrer(id);
      setAudit(r.data);
      showToast('Audit démarré !', 'success');
    } catch { showToast('Erreur', 'error'); }
  };

  const handlePdca = async () => {
    try {
      const r = await auditAPI.declencherPdca(id);
      setAudit(r.data);
      showToast('PDCA déclenché — Le responsable qualité a été notifié', 'success');
    } catch { showToast('Erreur lors du déclenchement PDCA', 'error'); }
  };

  const handleAnnuler = async () => {
    if (!window.confirm('Confirmer l\'annulation de cet audit ?')) return;
    try {
      const r = await auditAPI.annuler(id);
      setAudit(r.data);
      showToast('Audit annulé', 'info');
    } catch { showToast('Erreur', 'error'); }
  };

  const showToast = (msg, type='info') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000); };

  const prefix = { AUDITEUR: 'auditeur', CHEF_SERVICE: 'chef-service', EXPERT_PRODUCT_AUDIT: 'expert', RESPONSABLE_QUALITE_CENTRALE: 'responsable', ADMIN: 'admin' }[role] || 'admin';

  if (loading) return <div className={styles.loading}><div className={styles.spinner}/> Chargement…</div>;
  if (!audit) return <div className={styles.empty}><div className={styles.emptyText}>Audit introuvable</div></div>;

  const s = STATUT_CFG[audit.statut] || {};
  const t = TYPE_CFG[audit.typeAudit] || {};
  const isProduit   = audit.typeAudit === 'AUDIT_PRODUIT';
  const isChecklist = audit.typeAudit === 'AUDIT_REGLES_PLATES';

  return (
    <div className={styles.page}>
      {/* ── HEADER ──────────────────────────────────────────── */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <button className={`${styles.btn} ${styles.btnOutline} ${styles.btnSm}`}
            style={{ marginBottom: '.5rem' }} onClick={() => navigate(-1)}>{IC.back} Retour</button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem', flexWrap: 'wrap' }}>
            <h1 className={styles.headerTitle}>{audit.reference}</h1>
            <span className={`${styles.badge} ${t.cl}`}>{t.label}</span>
            <span className={`${styles.badge} ${s.cl}`}>{s.label}</span>
          </div>
          <p className={styles.headerSub}>
            {audit.familleCablage || audit.zoneExpedition || audit.plantNom}
            {audit.domaine && <> — <strong>{audit.domaine}</strong></>}
          </p>
        </div>
        <div className={styles.headerActions}>
          {role === 'AUDITEUR' && audit.statut === 'PLANIFIE' && (
            <button className={`${styles.btn} ${styles.btnGold}`} onClick={handleDemarrer}>{IC.play} Démarrer</button>
          )}
          {role === 'AUDITEUR' && audit.statut === 'EN_COURS' && (
            <button className={`${styles.btn} ${styles.btnPrimary}`}
              onClick={() => navigate(`/auditeur/audits/${id}/saisir`)}>
              {IC.edit} Saisir les résultats
            </button>
          )}
          {role === 'AUDITEUR' && audit.statut === 'TERMINE' && audit.qkDepasseSeuil && !audit.pdcaDeclenche && (
            <button className={`${styles.btn} ${styles.btnDanger}`} onClick={handlePdca}>{IC.pdca} Déclencher PDCA</button>
          )}
          {(role === 'CHEF_SERVICE' || role === 'EXPERT_PRODUCT_AUDIT') && audit.statut === 'PLANIFIE' && (
            <button className={`${styles.btn} ${styles.btnDanger}`} onClick={handleAnnuler}>Annuler l'audit</button>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '1.5rem', alignItems: 'start' }}>
        <div>
          {/* ── INFOS GÉNÉRALES ─────────────────────────────── */}
          <div className={styles.card} style={{ marginBottom: '1.25rem' }}>
            <div className={styles.cardHeader}><span className={styles.cardTitle}>{IC.info} Informations générales</span></div>
            <div className={styles.cardBody}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.25rem' }}>
                {[
                  { l: 'Plant',           v: audit.plantNom || '—' },
                  { l: 'Segment',         v: audit.segmentNom || '—' },
                  { l: 'Projet',          v: audit.projetNom || '—' },
                  { l: 'Auditeur',        v: audit.auditeurNom || 'Non assigné' },
                  { l: 'Planificateur',   v: audit.planificateurNom || '—' },
                  { l: 'Date prévue',     v: audit.datePrevue ? new Date(audit.datePrevue).toLocaleDateString('fr-FR') : '—' },
                  { l: 'Date réalisation',v: audit.dateRealisation ? new Date(audit.dateRealisation).toLocaleDateString('fr-FR') : '—' },
                  { l: 'Nature',          v: audit.natureAudit === 'DESTRUCTIF' ? 'Destructif' : audit.natureAudit === 'NON_DESTRUCTIF' ? 'Non destructif' : '—' },
                  { l: 'Domaine client',  v: audit.domaine || '—' },
                ].map((row, i) => (
                  <div key={i}>
                    <div style={{ fontSize: '.7rem', fontWeight: 700, color: 'var(--gray-400)', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: '.3rem' }}>{row.l}</div>
                    <div style={{ fontWeight: 600, color: 'var(--leoni-navy)' }}>{row.v}</div>
                  </div>
                ))}
              </div>
              {audit.observations && (
                <div style={{ marginTop: '1rem', padding: '.85rem', background: 'var(--gray-50)', borderRadius: 10, border: '1px solid var(--gray-200)', fontSize: '.84rem', color: 'var(--gray-600)' }}>
                  <strong style={{ display: 'block', marginBottom: '.25rem', color: 'var(--leoni-navy)' }}>Observations</strong>
                  {audit.observations}
                </div>
              )}
            </div>
          </div>

          {/* ── NON-CONFORMITÉS ─────────────────────────────── */}
          {audit.nonConformites?.length > 0 && (
            <div className={styles.card} style={{ marginBottom: '1.25rem' }}>
              <div className={styles.cardHeader}><span className={styles.cardTitle}>Non-conformités détectées ({audit.nonConformites.length})</span></div>
              <div className={styles.cardBodyNoPad}>
                <div className={styles.tableWrap}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Description</th>
                        <th>Type</th>
                        <th>Zone</th>
                        <th>Points</th>
                        <th>Qté</th>
                        <th>Total</th>
                        <th>Action corrective</th>
                      </tr>
                    </thead>
                    <tbody>
                      {audit.nonConformites.map((nc, i) => (
                        <tr key={nc.id}>
                          <td style={{ color: 'var(--gray-400)', fontSize: '.78rem' }}>{i+1}</td>
                          <td style={{ fontWeight: 600, color: 'var(--leoni-navy)', fontSize: '.84rem' }}>{nc.description}</td>
                          <td style={{ fontSize: '.78rem', color: 'var(--gray-500)' }}>{nc.typeDefaut || '—'}</td>
                          <td style={{ fontSize: '.78rem', color: 'var(--gray-500)' }}>{nc.zone || '—'}</td>
                          <td>
                            <span style={{ background: nc.points >= 100 ? 'var(--danger-bg)' : nc.points >= 75 ? '#FFF7ED' : '#EFF6FF',
                              color: nc.points >= 100 ? 'var(--danger)' : nc.points >= 75 ? '#D97706' : '#0057B8',
                              borderRadius: 6, padding: '2px 7px', fontWeight: 700, fontSize: '.75rem' }}>
                              {nc.points}
                            </span>
                          </td>
                          <td style={{ textAlign: 'center', fontWeight: 700 }}>{nc.quantite}</td>
                          <td>
                            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, color: 'var(--leoni-navy)' }}>
                              {nc.totalPoints} pts
                            </span>
                          </td>
                          <td style={{ fontSize: '.78rem', color: 'var(--gray-500)', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {nc.actionCorrective || '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ── CHECKLIST RÈGLES PLATES ──────────────────────── */}
          {isChecklist && audit.checklistItems?.length > 0 && (
            <div className={styles.card}>
              <div className={styles.cardHeader}><span className={styles.cardTitle}>Résultats checklist instruments</span></div>
              <div className={styles.cardBodyNoPad}>
                <div className={styles.tableWrap}>
                  <table className={styles.checklistTable}>
                    <thead>
                      <tr>
                        <th>Instrument</th>
                        <th>Type</th>
                        <th>Localisation</th>
                        <th>Lisibilité</th>
                        <th>État physique</th>
                        <th>Précision</th>
                        <th>Étiquette</th>
                        <th>Propreté</th>
                        <th>Statut</th>
                        <th>Prochaine vérif.</th>
                      </tr>
                    </thead>
                    <tbody>
                      {audit.checklistItems.map(cl => {
                        const ok = cl.statut === 'CONFORME';
                        const nok = cl.statut === 'NON_CONFORME';
                        return (
                          <tr key={cl.id}>
                            <td style={{ fontWeight: 700, color: 'var(--leoni-navy)' }}>{cl.numeroInstrument}</td>
                            <td style={{ fontSize: '.78rem' }}>{cl.typeInstrument}</td>
                            <td style={{ fontSize: '.78rem', color: 'var(--gray-500)' }}>{cl.localisation || '—'}</td>
                            {['lisibiliteGraduations','etatPhysique','precisionMesure','etiquetteValidite','proprete'].map(k => (
                              <td key={k}>
                                {cl[k] === 'CONFORME' ? (
                                  <span style={{ color: 'var(--success)', fontWeight: 700, fontSize: '.78rem' }}>✓</span>
                                ) : cl[k] === 'NON_CONFORME' ? (
                                  <span style={{ color: 'var(--danger)', fontWeight: 700, fontSize: '.78rem' }}>✗</span>
                                ) : <span style={{ color: 'var(--gray-300)' }}>—</span>}
                              </td>
                            ))}
                            <td>
                              <span className={`${styles.badge} ${ok ? styles.badgeTermine : nok ? styles.badgeEnRetard : styles.badgePlanifie}`}>
                                {ok ? 'Conforme' : nok ? 'Non conforme' : 'Non vérifié'}
                              </span>
                            </td>
                            <td style={{ fontSize: '.78rem', color: 'var(--gray-500)' }}>
                              {cl.prochaineVerification ? new Date(cl.prochaineVerification).toLocaleDateString('fr-FR') : '—'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── PANNEAU LATÉRAL ──────────────────────────────────── */}
        <div style={{ position: 'sticky', top: '80px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* QK */}
          {isProduit && audit.statut === 'TERMINE' && (
            <div className={styles.card}>
              <div className={styles.cardHeader}><span className={styles.cardTitle}>Indicateur QK</span></div>
              <div className={styles.cardBody}>
                <div style={{ textAlign: 'center', padding: '1rem' }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: '3.5rem', fontWeight: 900, lineHeight: 1,
                    color: audit.valeurQK === 0 ? 'var(--success)' : audit.qkDepasseSeuil ? 'var(--danger)' : 'var(--warning)' }}>
                    {audit.valeurQK?.toFixed(1) ?? '—'}
                  </div>
                  <div style={{ fontSize: '.75rem', fontWeight: 700, marginTop: '.35rem',
                    color: audit.valeurQK === 0 ? 'var(--success)' : audit.qkDepasseSeuil ? 'var(--danger)' : 'var(--warning)' }}>
                    {audit.valeurQK === 0 ? 'Excellent' : audit.qkDepasseSeuil ? '⚠️ Seuil dépassé' : 'Acceptable'}
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '.5rem', marginTop: '.5rem', fontSize: '.8rem' }}>
                  {[
                    { l: 'Total points bruts', v: `${audit.totalPoints?.toFixed(0) ?? '—'} pts` },
                    { l: 'Facteur',             v: audit.facteur ?? '—' },
                    { l: 'Nb composants',       v: audit.nombreComposants ?? '—' },
                  ].map((r, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--gray-100)', paddingBottom: '.4rem' }}>
                      <span style={{ color: 'var(--gray-500)' }}>{r.l}</span>
                      <span style={{ fontWeight: 700, color: 'var(--leoni-navy)' }}>{r.v}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* PDCA */}
          {audit.pdcaDeclenche && (
            <div style={{ background: 'var(--danger-bg)', border: '1px solid #FECACA', borderRadius: 12, padding: '1rem', fontSize: '.82rem' }}>
              <div style={{ fontWeight: 700, color: 'var(--danger)', marginBottom: '.35rem', display: 'flex', alignItems: 'center', gap: '.4rem' }}>
                {IC.pdca} PDCA déclenché
              </div>
              <div style={{ color: 'var(--gray-600)' }}>
                Le {audit.datePdca ? new Date(audit.datePdca).toLocaleDateString('fr-FR') : '—'}
              </div>
            </div>
          )}

          {/* Action immédiate */}
          {audit.actionImmediate && (
            <div style={{ background: 'var(--warning-bg)', border: '1px solid #FDE68A', borderRadius: 12, padding: '1rem', fontSize: '.82rem' }}>
              <div style={{ fontWeight: 700, color: 'var(--warning)', marginBottom: '.35rem' }}>Action immédiate</div>
              <div style={{ color: 'var(--gray-600)' }}>{audit.actionImmediate}</div>
            </div>
          )}
        </div>
      </div>

      {toast && (
        <div className={`${styles.toast} ${toast.type === 'success' ? styles.toastSuccess : toast.type === 'error' ? styles.toastError : styles.toastInfo}`}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}
