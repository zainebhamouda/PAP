import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { auditProduitAPI } from '../../services/api';

/* ─── Design tokens ─── */
const T = {
  navy:  '#002855', blue: '#003F8A', blueM: '#0057B8',
  gold:  '#C8982A', goldP: '#FFF4D6',
  g50:  '#F7F9FC', g100: '#EEF2F8', g200: '#DAE2EF', g300: '#BCC8DC',
  g400: '#8A9BBC', g500: '#5C6F8A', g700: '#273347', g800: '#182030',
  success: '#1A7A4A', successBg: '#E6F5EE',
  warn:    '#C8982A', warnBg:    '#FFF4D6',
  danger:  '#C0392B', dangerBg:  '#FDECEA',
  info:    '#0057B8', infoBg:    '#E8F0FB',
  rose:    '#9D174D', roseBg:    '#FDF2F8',
};

const apiH = () => ({ Authorization: `Bearer ${localStorage.getItem('token')}`, 'Content-Type': 'application/json' });
const STORAGE_NEW = 'auditeur_nouveaux_audit_produit_ids';
const STORAGE_KNOWN = 'auditeur_known_audit_produit_ids';
const STORAGE_STARTED = 'auditeur_started_audit_produit_ids';

function fmt(d) {
  if (!d) return '—';
  try { return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }); }
  catch { return d; }
}

function isOverdue(a) {
  if (!a.deadline || ['TERMINE', 'ANNULE'].includes(a.statut)) return false;
  return new Date(a.deadline) < new Date();
}

function loadIdSet(key) {
  try {
    const raw = localStorage.getItem(key);
    const arr = raw ? JSON.parse(raw) : [];
    return new Set(Array.isArray(arr) ? arr : []);
  } catch {
    return new Set();
  }
}

function saveIdSet(key, set) {
  localStorage.setItem(key, JSON.stringify([...set]));
}

const QK_CFG = {
  VERT:   { bg: T.successBg, border: '#86EFAC', text: T.success, dot: '#22C55E', label: 'Conforme',         actions: ['export'] },
  ORANGE: { bg: T.warnBg,    border: '#FCD34D', text: T.warn,    dot: '#F59E0B', label: 'Non-conformité',   actions: ['export', 'fiche'] },
  ROSE:   { bg: T.roseBg,    border: '#F9A8D4', text: T.rose,    dot: '#EC4899', label: 'Action requise',   actions: ['export', 'fiche', 'pdca'] },
  ROUGE:  { bg: T.dangerBg,  border: '#FCA5A5', text: T.danger,  dot: '#EF4444', label: 'ALERTE CRITIQUE',  actions: ['export', 'fiche', 'pdca', 'action'] },
};

const STATUT_CFG = {
  PLANIFIE:  { bg: T.infoBg,    text: T.info,    label: 'Planifié'  },
  EN_COURS:  { bg: T.warnBg,    text: T.warn,    label: 'En cours'  },
  TERMINE:   { bg: T.successBg, text: T.success, label: 'Terminé'   },
  EN_RETARD: { bg: T.dangerBg,  text: T.danger,  label: 'En retard' },
  ANNULE:    { bg: T.g100,      text: T.g400,    label: 'Annulé'    },
};

/* ─── Composants ─── */
function Pill({ bg, color, children }) {
  return <span style={{ background: bg, color, fontSize: '.67rem', fontWeight: 800, padding: '3px 9px', borderRadius: 99 }}>{children}</span>;
}

function Btn({ children, onClick, disabled, variant = 'primary', small }) {
  const [hov, setHov] = useState(false);
  const vs = {
    primary:   { background: hov ? T.blue : T.navy, color: '#fff' },
    secondary: { background: T.g100, color: T.g700 },
    danger:    { background: T.dangerBg, color: T.danger, border: `1px solid #FCA5A5` },
    gold:      { background: T.gold, color: '#fff' },
    rose:      { background: T.roseBg, color: T.rose, border: `1px solid #F9A8D4` },
  };
  return (
    <button disabled={disabled} onClick={disabled ? undefined : onClick}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        border: 'none', cursor: disabled ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
        fontWeight: 700, padding: small ? '6px 14px' : '10px 22px', fontSize: small ? '.74rem' : '.83rem',
        borderRadius: 10, opacity: disabled ? .5 : 1, transition: 'all .2s',
        display: 'inline-flex', alignItems: 'center', gap: 6, ...vs[variant],
      }}>
      {children}
    </button>
  );
}

/* ─── Carte type d'audit (3 cartes) ─── */
function AuditTypeCard({ title, count, desc, color, bg, accent, onClick, active }) {
  const [hov, setHov] = useState(false);
  return (
    <div onClick={onClick}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        background: active ? T.navy : '#fff',
        borderRadius: 20, border: `2px solid ${active ? T.navy : hov ? T.navy : T.g100}`,
        padding: '1.6rem', cursor: 'pointer', transition: 'all .2s',
        boxShadow: hov || active ? '0 12px 32px rgba(0,40,85,.14)' : '0 2px 8px rgba(0,40,85,.06)',
        transform: hov && !active ? 'translateY(-2px)' : 'none',
      }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
        <div style={{
          width: 48, height: 48, borderRadius: 14, background: active ? 'rgba(255,255,255,.15)' : bg,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '1.4rem',
        }}>
          {title === 'Audit Produit' ? 'P' : title === 'Audit Magasin Export' ? 'M' : 'R'}
        </div>
        <div style={{
          background: active ? 'rgba(255,255,255,.2)' : bg,
          color: active ? '#fff' : color,
          fontSize: '1.4rem', fontWeight: 900,
          width: 44, height: 44, borderRadius: 12,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>{count}</div>
      </div>
      <h3 style={{ fontSize: '.95rem', fontWeight: 800, color: active ? '#fff' : T.navy, margin: '0 0 5px' }}>{title}</h3>
      <p style={{ fontSize: '.76rem', color: active ? 'rgba(255,255,255,.7)' : T.g400, margin: 0, lineHeight: 1.5 }}>{desc}</p>
    </div>
  );
}

/* ─── Carte audit produit ─── */
function AuditProduitCard({ audit, nouveau, onView, onDelete }) {
  const [hov, setHov] = useState(false);
  const retard = isOverdue(audit);
  const qk = QK_CFG[audit.couleurQK];
  // Correction : statut et couleur carte pour TERMINE
  let st, cardBg, statusBg, statusText, borderColor;
  if (retard) {
    st = STATUT_CFG.EN_RETARD;
    cardBg = T.dangerBg;
    statusBg = '#FDECEA';
    statusText = T.danger;
    borderColor = T.danger;
  } else if (audit.statut === 'TERMINE') {
    st = STATUT_CFG.TERMINE;
    cardBg = T.successBg;
    statusBg = T.successBg;
    statusText = T.success;
    borderColor = T.success;
  } else if (audit.statut === 'EN_COURS') {
    st = STATUT_CFG.EN_COURS;
    cardBg = T.warnBg;
    statusBg = T.warnBg;
    statusText = T.warn;
    borderColor = T.warn;
  } else if (audit.statut === 'PLANIFIE') {
    st = STATUT_CFG.PLANIFIE;
    cardBg = T.infoBg;
    statusBg = T.infoBg;
    statusText = T.info;
    borderColor = T.info;
  } else {
    st = STATUT_CFG[audit.statut] || STATUT_CFG.PLANIFIE;
    cardBg = st.bg;
    statusBg = st.bg;
    statusText = st.text;
    borderColor = st.text;
  }
  const startLabel = audit.statut === 'TERMINE' ? 'Voir détail' : (audit.statut === 'EN_COURS' || audit.statut === 'EN_RETARD' || audit.aDejaCommence) ? 'Continuer' : 'Commencer';

  return (
    <div onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        background: cardBg, borderRadius: 16,
        border: `1.5px solid ${borderColor}`,
        padding: '1.1rem', transition: 'all .2s', position: 'relative',
        boxShadow: hov ? '0 8px 28px rgba(0,40,85,.12)' : '0 2px 8px rgba(0,40,85,.06)',
        transform: hov ? 'translateY(-2px)' : 'none',
        display: 'flex', flexDirection: 'column', minHeight: 320, // force hauteur pour coller les boutons en bas
      }}>
      {nouveau && (
        <div style={{
          position: 'absolute', top: -10, right: 14,
          background: 'linear-gradient(135deg,#C0392B,#E53E3E)', color: '#fff',
          fontSize: '.62rem', fontWeight: 800, padding: '3px 10px', borderRadius: 99,
          boxShadow: '0 2px 8px rgba(192,57,43,.4)'
        }}>NOUVEAU</div>
      )}

      {/* En-tête */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
        <div style={{ flex: 1 }}>
          <p style={{ margin: 0, fontWeight: 800, fontSize: '.88rem', color: T.g800 }}>{audit.reference}</p>
          <p style={{ margin: '3px 0 0', fontSize: '.73rem', color: T.g400 }}>
            {fmt(audit.datePrevue)}
            {retard && <span style={{ color: T.danger, fontWeight: 700, marginLeft: 6 }}>· EN RETARD</span>}
          </p>
        </div>
        <Pill bg={statusBg} color={statusText}>{st.label}</Pill>
      </div>

      {/* Infos */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
        {[
          { label: 'Série',   val: audit.serieNom || '—'   },
          { label: 'Projet',  val: audit.projetNom || '—'  },
          { label: 'Nature',  val: audit.natureAudit === 'DESTRUCTIF' ? 'Destructif' : 'Non-Destructif' },
          { label: 'Deadline',val: fmt(audit.deadline)       },
        ].map(item => (
          <div key={item.label} style={{ background: cardBg, borderRadius: 8, padding: '6px 9px' }}>
            <div style={{ fontSize: '.63rem', color: T.g300, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 2 }}>{item.label}</div>
            <div style={{ fontSize: '.78rem', color: T.g700, fontWeight: 600 }}>{item.val}</div>
          </div>
        ))}
      </div>

      {/* QK badge */}
      {qk && (
        <div style={{ background: qk.bg, border: `1px solid ${qk.border}`, borderRadius: 8, padding: '7px 10px', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: qk.dot }} />
          <span style={{ fontSize: '.75rem', fontWeight: 700, color: qk.text }}>
            {qk.label} {audit.valeurQK !== null && audit.valeurQK !== undefined ? `(QK=${audit.valeurQK.toFixed(2)})` : ''}
          </span>
        </div>
      )}

      {/* Actions collées en bas */}
      <div style={{ marginTop: 'auto', display: 'flex', gap: 10, justifyContent: 'center', paddingTop: 10 }}>
        <button
          onClick={() => onView(audit, audit.statut === 'TERMINE')}
          style={{
            background: T.navy, color: '#fff', border: 'none',
            padding: '8px 22px', fontSize: '.82rem', fontWeight: 700,
            borderRadius: 20, cursor: 'pointer'
          }}>
          {startLabel}
        </button>
        {/* Bouton Voir rapport si statut TERMINE et rapportUrl présent */}
        {audit.statut === 'TERMINE' && audit.rapportGenerePdfUrl && (
          <a
            href={audit.rapportGenerePdfUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{ textDecoration: 'none' }}
          >
            <button
              style={{
                background: T.gold, color: '#fff', border: 'none',
                padding: '8px 22px', fontSize: '.82rem', fontWeight: 700,
                borderRadius: 20, cursor: 'pointer'
              }}
            >
              Voir rapport
            </button>
          </a>
        )}
        {audit.statut !== 'TERMINE' && (
          <button
            onClick={() => onDelete(audit.id)}
            style={{
              background: '#fff', color: T.g700, border: `1.5px solid #313131`,
              padding: '8px 22px', fontSize: '.82rem', fontWeight: 700,
              borderRadius: 20, cursor: 'pointer'
            }}>
            Annuler
          </button>
        )}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   PAGE PRINCIPALE
══════════════════════════════════════════════════════════════ */
export default function AuditeurAuditsPage() {
  const navigate = useNavigate();
  const [activeCard, setActiveCard] = useState('produit'); // 'produit' | 'magasin' | 'regles'
  const [auditsProduit, setAuditsProduit] = useState([]);
  const [planifications, setPlanifications] = useState([]);
  const [filterPlanif, setFilterPlanif] = useState('');
  const [filterStatut, setFilterStatut] = useState('TOUS');
  const [loading, setLoading] = useState(true);
  const [nouveauxIds, setNouveauxIds] = useState(new Set());
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const [search, setSearch] = useState('');
  const [startedIds, setStartedIds] = useState(loadIdSet(STORAGE_STARTED));

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [auditsRes, planifRes] = await Promise.all([
        fetch(`http://localhost:8080/api/audit-produit/mes-audits${filterPlanif ? `?planificationId=${filterPlanif}` : ''}`, { headers: apiH() }),
        fetch('http://localhost:8080/api/planification', { headers: apiH() }),
      ]);
      const audits = await auditsRes.json();
      const planifs = await planifRes.json();
      const list = Array.isArray(audits) ? audits : [];
      const currentIds = new Set(list.map(a => a.id));
      const known = loadIdSet(STORAGE_KNOWN);
      const nouveaux = loadIdSet(STORAGE_NEW);

      list.forEach(a => {
        if (!known.has(a.id)) nouveaux.add(a.id);
      });

      const trimmedNouveaux = new Set([...nouveaux].filter(id => currentIds.has(id)));
      saveIdSet(STORAGE_NEW, trimmedNouveaux);
      saveIdSet(STORAGE_KNOWN, new Set([...known, ...currentIds]));

      setNouveauxIds(trimmedNouveaux);
      if (trimmedNouveaux.size > 0) setBannerDismissed(false);
      setAuditsProduit(list);
      setPlanifications(Array.isArray(planifs) ? planifs : []);
    } catch (e) { console.error(e); }
    setLoading(false);
  }, [filterPlanif]);

  useEffect(() => { load(); const t = setInterval(load, 30000); return () => clearInterval(t); }, [load]);

  const deleteAudit = async (id) => {
    if (!window.confirm('Supprimer cet audit ?')) return;
    try {
      await fetch(`http://localhost:8080/api/audit-produit/${id}`, { method: 'DELETE', headers: apiH() });
      setAuditsProduit(prev => prev.filter(a => a.id !== id));
      setNouveauxIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        saveIdSet(STORAGE_NEW, next);
        return next;
      });
    } catch (e) { alert('Erreur : ' + e.message); }
  };

  const markAuditRead = useCallback((id) => {
    setNouveauxIds(prev => {
      if (!prev.has(id)) return prev;
      const next = new Set(prev);
      next.delete(id);
      saveIdSet(STORAGE_NEW, next);
      return next;
    });
  }, []);

  const markAllRead = useCallback(() => {
    setNouveauxIds(() => {
      const next = new Set();
      saveIdSet(STORAGE_NEW, next);
      return next;
    });
    setBannerDismissed(true);
  }, []);

  const handleStart = useCallback(async (audit, lectureSeule = false) => {
    markAuditRead(audit.id);
    if (lectureSeule) {
      navigate(`/auditeur/audits/${audit.id}?readonly=1`);
      return;
    }
    setStartedIds(prev => {
      const next = new Set(prev);
      next.add(audit.id);
      saveIdSet(STORAGE_STARTED, next);
      return next;
    });
    navigate(`/auditeur/audits/${audit.id}`);
    if (audit.statut === 'PLANIFIE' || audit.statut === 'EN_RETARD') {
      auditProduitAPI.demarrer(audit.id)
        .then(() => {
          setAuditsProduit(prev => prev.map(a => a.id === audit.id ? { ...a, statut: 'EN_COURS' } : a));
        })
        .catch((e) => {
          console.error(e);
        });
    }
  }, [markAuditRead, navigate]);

  const counts = {
    produit:  auditsProduit.length,
    magasin:  0,
    regles:   0,
  };

  const nouveauxAudits = auditsProduit.filter(a => nouveauxIds.has(a.id));

  const filteredAudits = auditsProduit.filter(a => {
    const mSt = filterStatut === 'TOUS' || a.statut === filterStatut;
    const mTxt = !search || [a.reference, a.serieNom, a.projetNom].some(v => (v || '').toLowerCase().includes(search.toLowerCase()));
    return mSt && mTxt;
  });

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", background: T.g50, minHeight: '100vh', padding: '2rem' }}>
      {/* Header */}

      <div style={{ marginBottom: 28,marginTop: -20 }}>
        <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: T.navy, margin: '0 0 6px' }}>Mes Audits</h1>
        <p style={{ color: T.g400, fontSize: '.86rem', margin: 0 }}>Gérez et réalisez vos audits assignés</p>
      </div>

      {/* Bannière nouveaux audits */}
      {nouveauxAudits.length > 0 && !bannerDismissed && (
        <div style={{
          background: 'linear-gradient(135deg, #C0392B, #E53E3E)', borderRadius: 14,
          padding: '14px 20px', marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          boxShadow: '0 4px 20px rgba(192,57,43,.3)', cursor: 'pointer',
        }} onClick={() => { setActiveCard('produit'); markAllRead(); }}>
          <div style={{ color: '#fff' }}>
            <span style={{ fontWeight: 800, fontSize: '.9rem' }}>
              {nouveauxAudits.length} nouveau(x) audit(s) produit reçu(s)
            </span>
            <span style={{ fontSize: '.78rem', opacity: .85, marginLeft: 10 }}>
              Cliquez pour les voir
            </span>
          </div>
          <button onClick={e => { e.stopPropagation(); markAllRead(); }}
            style={{ background: 'rgba(255,255,255,.2)', border: 'none', color: '#fff', borderRadius: 8, width: 28, height: 28, cursor: 'pointer', fontSize: '.9rem' }}>
            ✕
          </button>
        </div>
      )}

      {/* 3 cartes */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, marginBottom: 24 }}>
        <AuditTypeCard
          title="Audit Produit"
          count={counts.produit}
          desc="Audits produit planifiés et assignés. Importez les annexes et générez les rapports."
          color={T.info} bg={T.infoBg}
          active={activeCard === 'produit'}
          onClick={() => setActiveCard('produit')}
        />
        <AuditTypeCard
          title="Audit Magasin Export"
          count={counts.magasin}
          desc="Audits de contrôle du magasin et des produits en cours d'expédition."
          color={T.success} bg={T.successBg}
          active={activeCard === 'magasin'}
          onClick={() => setActiveCard('magasin')}
        />
        <AuditTypeCard
          title="Audit Règles Plates"
          count={counts.regles}
          desc="Audit de conformité des règles plates et gabarits de mesure."
          color={T.warn} bg={T.warnBg}
          active={activeCard === 'regles'}
          onClick={() => setActiveCard('regles')}
        />
      </div>

      {/* Contenu selon carte active */}
      {activeCard === 'produit' && (
        <div>
          {/* Filtres */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
            <select
              style={{ padding: '8px 12px', border: `1.5px solid ${T.g200}`, borderRadius: 9, fontSize: '.82rem', fontFamily: 'inherit', minWidth: 200 }}
              value={filterPlanif} onChange={e => setFilterPlanif(e.target.value)}>
              <option value="">Toutes les planifications</option>
              {planifications.map(p => <option key={p.id} value={p.id}>{p.nom}</option>)}
            </select>
            <select
              style={{ padding: '8px 12px', border: `1.5px solid ${T.g200}`, borderRadius: 9, fontSize: '.82rem', fontFamily: 'inherit' }}
              value={filterStatut} onChange={e => setFilterStatut(e.target.value)}>
              <option value="TOUS">Tous les statuts</option>
              {Object.entries(STATUT_CFG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
            <input
              style={{ flex: 1, minWidth: 180, padding: '8px 12px', border: `1.5px solid ${T.g200}`, borderRadius: 9, fontSize: '.82rem', fontFamily: 'inherit' }}
              placeholder="Rechercher référence, série, projet..."
              value={search} onChange={e => setSearch(e.target.value)}
            />
            <span style={{ fontSize: '.75rem', color: T.g400 }}>{filteredAudits.length} audit(s)</span>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: T.g400 }}>
              <div style={{ width: 36, height: 36, border: `3px solid ${T.g100}`, borderTopColor: T.navy, borderRadius: '50%', animation: 'spin .8s linear infinite', margin: '0 auto 12px' }} />
              <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
              Chargement...
            </div>
          ) : filteredAudits.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '4rem', color: T.g300, fontSize: '.9rem', background: '#fff', borderRadius: 16, border: `1px solid ${T.g100}` }}>
              Aucun audit produit trouvé
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(320px,1fr))', gap: 16 }}>
              {filteredAudits.map(audit => (
                <AuditProduitCard
                  key={audit.id}
                  audit={{ ...audit, aDejaCommence: audit.statut === 'EN_COURS' || audit.statut === 'EN_RETARD' || startedIds.has(audit.id) }}
                  nouveau={nouveauxIds.has(audit.id)}
                  onView={handleStart}
                  onDelete={deleteAudit}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {activeCard === 'magasin' && (
        <div style={{ textAlign: 'center', padding: '4rem', color: T.g300, background: '#fff', borderRadius: 16, border: `1px solid ${T.g100}` }}>
          <div style={{ fontSize: '.9rem' }}>Les audits magasin export seront disponibles prochainement.</div>
        </div>
      )}

      {activeCard === 'regles' && (
        <div style={{ textAlign: 'center', padding: '4rem', color: T.g300, background: '#fff', borderRadius: 16, border: `1px solid ${T.g100}` }}>
          <div style={{ fontSize: '.9rem' }}>Les audits règles plates seront disponibles prochainement.</div>
        </div>
      )}
    </div>
  );
}