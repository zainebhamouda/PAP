// ═══════════════════════════════════════════════════════════════
// AuditeurPlanificationPage.jsx
// Planification d'audits par l'AUDITEUR
//  - Site + Plant pré-remplis depuis le profil (lecture seule)
//  - Étape 2 : Segment (gauche) + Import Excel (droite) sur la MÊME page
//  - Étape 3 : Vérification — auditeur = soi-même (auto), deadline = datePrevue + 1 mois (auto)
// ═══════════════════════════════════════════════════════════════
import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from '../../context/AuthContext';
import { FiAlertTriangle, FiArrowLeft, FiBriefcase, FiCalendar, FiCheckCircle, FiFileText, FiFolder, FiLock, FiMapPin, FiSend, FiUpload, FiUserCheck } from 'react-icons/fi';

const T = {
  navy:'#002855',blue:'#003F8A',blueM:'#0057B8',gold:'#C8982A',goldP:'#EBF2FF',
  g50:'#F7F9FC',g100:'#d9dde4',g200:'#DAE2EF',g300:'#BCC8DC',g400:'#8A9BBC',
  g500:'#3e71ba',g700:'#273347',g800:'#182030',
  success:'#1A7A4A',successBg:'#E6F5EE',warn:'#C8982A',warnBg:'#FFF4D6',
  danger:'#C0392B',dangerBg:'#FDECEA',info:'#0057B8',infoBg:'#E8F0FB',
};
const apiH  = () => ({ Authorization: `Bearer ${localStorage.getItem('token')}`, 'Content-Type': 'application/json' });
const multiH = () => ({ Authorization: `Bearer ${localStorage.getItem('token')}` });

function addOneMonth(dateStr) {
  if (!dateStr) return '';
  const s = String(dateStr).trim();
  // handle YYYY-MM format
  const ym = s.match(/^(\d{4})-(\d{2})$/);
  const base = ym ? `${s}-01` : s;
  const d = new Date(base);
  if (isNaN(d.getTime())) return '';
  d.setMonth(d.getMonth() + 1);
  return d.toISOString().slice(0, 10);
}

// ── Composants UI ─────────────────────────────────────────────
function Pill({ children, bg = T.g100, color = T.g700 }) {
  return <span style={{ background: bg, color, fontSize: '.68rem', fontWeight: 700, padding: '3px 9px', borderRadius: 99, whiteSpace: 'nowrap' }}>{children}</span>;
}
function Btn({ children, onClick, disabled, variant = 'primary', small = false, style: ex = {} }) {
  const [h, sH] = useState(false);
  const b = { border: 'none', cursor: disabled ? 'not-allowed' : 'pointer', fontFamily: 'inherit', fontWeight: 700, transition: 'all .2s', padding: small ? '7px 16px' : '11px 24px', fontSize: small ? '.78rem' : '.86rem', borderRadius: 10, opacity: disabled ? .5 : 1, display: 'inline-flex', alignItems: 'center', gap: 6 };
  const s = {
    primary:   { background: h && !disabled ? T.blue : T.navy, color: '#fff' },
    gold:      { background: h && !disabled ? '#b8880a' : T.gold, color: '#fff' },
    secondary: { background: T.g100, color: T.g700, border: `1px solid ${T.g200}` },
    danger:    { background: T.dangerBg, color: T.danger, border: '1px solid #FCA5A5' },
  };
  return <button onClick={disabled ? undefined : onClick} style={{ ...b, ...s[variant], ...ex }} onMouseEnter={() => sH(true)} onMouseLeave={() => sH(false)} disabled={disabled}>{children}</button>;
}
function Card({ children, style: ex = {} }) {
  return <div style={{ background: '#fff', borderRadius: 16, border: `1px solid ${T.g100}`, boxShadow: '0 2px 12px rgba(0,40,85,.07)', padding: '1.5rem', ...ex }}>{children}</div>;
}

// ── Stepper (3 étapes seulement pour l'auditeur) ──────────────
function Stepper({ step }) {
  const items = [{ id: 1, label: 'Contexte & Import' }, { id: 2, label: 'Vérification' }, { id: 3, label: 'Succès' }];
  return (
    <div style={{ width: '100%', background: 'linear-gradient(135deg,#0B1E3D 0%,#1D4ED8 100%)', borderRadius: 16, padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 24px rgba(0,40,85,.18)' }}>
      <div style={{ display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap' }}>
        {items.map((it, idx) => (
          <div key={it.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: step >= it.id ? '#fff' : 'rgba(255,255,255,.2)', color: step >= it.id ? T.navy : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '.9rem', fontWeight: 900 }}>{it.id}</div>
            <span style={{ fontSize: '.84rem', color: '#fff', fontWeight: step >= it.id ? 800 : 600, opacity: step >= it.id ? 1 : 0.65 }}>{it.label}</span>
            {idx < items.length - 1 && <span style={{ width: 28, height: 2, background: 'rgba(255,255,255,.35)', borderRadius: 2 }} />}
          </div>
        ))}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// ÉTAPE 1 — Contexte & Import (fusionnés : gauche + droite)
// Site + Plant affichés en lecture seule depuis le profil
// Segment sélectionnable. Import Excel à droite.
// ══════════════════════════════════════════════════════════════
function EtapeContexteImport({ user, onImported }) {
  const plantId  = user?.plantId  ?? '';
  const plantNom = user?.plantNom ?? '';
  const siteId   = user?.siteId   ?? '';
  const siteNom  = user?.siteNom  ?? '';

  const [segments,    setSegments]    = useState([]);
  const [segmentId,   setSegmentId]   = useState('');
  const [fichier,     setFichier]     = useState(null);
  const [drag,        setDrag]        = useState(false);
  const [loading,     setLoading]     = useState(false);
  const [err,         setErr]         = useState('');
  const inpRef = useRef();

  // Charger les segments du plant de l'auditeur (au montage dès que plantId dispo)
  useEffect(() => {
    if (!plantId) return;
    fetch(`http://localhost:8080/api/planification/sites/plants/${plantId}/segments`, { headers: apiH() })
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then(data => setSegments(Array.isArray(data) ? data : []))
      .catch(e => {
        console.warn('Segments non chargés:', e.message);
        setSegments([]);
      });
  }, [plantId, user]);

  const handleFile = (f) => {
    if (!f) return;
    if (!f.name.match(/\.xlsx?$/i)) { setErr('Format .xlsx requis.'); return; }
    setErr('');
    setFichier(f);
  };

  const doImport = async () => {
    if (!fichier) { setErr('Veuillez choisir un fichier Excel.'); return; }
    if (!plantId) { setErr('Profil incomplet : aucun plant associé à votre compte.'); return; }
    setLoading(true); setErr('');
    const fd = new FormData();
    fd.append('fichier', fichier);
    fd.append('plantId', plantId);
    if (siteId)   fd.append('siteId', siteId);
    if (segmentId) fd.append('segmentId', segmentId);
    try {
      const res = await fetch('http://localhost:8080/api/planification/import-excel', { method: 'POST', headers: multiH(), body: fd });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      onImported({
        ...data,
        plantId:    data.plantId    || plantId,
        plantNom:   data.plantNom   || plantNom,
        siteId:     data.siteId     || siteId,
        siteNom:    data.siteNom    || siteNom,
        segmentId:  data.segmentId  || segmentId || null,
        segmentNom: data.segmentNom || segments.find(s => String(s.id) === String(segmentId))?.nom || '',
      });
    } catch (e) { setErr('Erreur import : ' + (e.message || 'inconnue')); }
    setLoading(false);
  };

  const sel = { width: '100%', padding: '9px 12px', borderRadius: 8, border: `1px solid ${T.g300}`, fontSize: '.87rem', background: '#fff', color: T.g800 };
  const readonlyBox = { width: '100%', padding: '9px 12px', borderRadius: 8, border: `1px solid ${T.g200}`, fontSize: '.87rem', background: T.g50, color: T.g700, display: 'flex', alignItems: 'center', gap: 8 };
  const label = { fontSize: '.78rem', fontWeight: 700, color: T.g500, marginBottom: 5, display: 'block', letterSpacing: .3 };

  return (
    <div>
      {/* Bandeau contexte profil */}
      <div style={{ background: 'linear-gradient(135deg,#0B1E3D,#1D4ED8)', borderRadius: 12, padding: '12px 18px', display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <FiMapPin size={16} color="#93C5FD" />
        <span style={{ color: '#fff', fontSize: '.83rem', fontWeight: 700 }}>
          {[siteNom, plantNom].filter(Boolean).join(' › ')}
        </span>
        <span style={{ color: 'rgba(255,255,255,.55)', fontSize: '.73rem' }}>· Votre périmètre de travail</span>
      </div>

      {/* Layout 2 colonnes */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, alignItems: 'start' }}>

        {/* ── Colonne gauche : Site / Plant / Segment ── */}
        <Card>
          <h3 style={{ color: T.navy, marginTop: 0, marginBottom: 18, fontSize: '1rem', fontWeight: 800 }}>Contexte de la planification</h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* Site — lecture seule */}
            <div>
              <span style={label}>SITE</span>
              <div style={readonlyBox}>
                <FiMapPin size={14} color={T.g400} />
                <span style={{ flex: 1 }}>{siteNom || '—'}</span>
                <FiLock size={13} color={T.g300} />
              </div>
              <span style={{ fontSize: '.73rem', color: T.g400 }}>Défini par votre profil</span>
            </div>

            {/* Plant — lecture seule */}
            <div>
              <span style={label}>PLANT</span>
              <div style={readonlyBox}>
                <FiBriefcase size={14} color={T.g400} />
                <span style={{ flex: 1 }}>{plantNom || '—'}</span>
                <FiLock size={13} color={T.g300} />
              </div>
              <span style={{ fontSize: '.73rem', color: T.g400 }}>Défini par votre profil</span>
            </div>

            {/* Segment — sélectionnable */}
            <div>
              <span style={label}>SEGMENT <span style={{ color: T.g400, fontWeight: 400 }}>(optionnel)</span></span>
              <select style={sel} value={segmentId} onChange={e => setSegmentId(e.target.value)}>
                <option value="">— Sélectionner un segment —</option>
                {segments.map(s => <option key={s.id} value={s.id}>{s.nom}</option>)}
              </select>
              {segments.length === 0 && <span style={{ fontSize: '.73rem', color: T.g400 }}>Aucun segment disponible pour ce plant</span>}
            </div>

            {/* Résumé */}
            <div style={{ background: T.infoBg, border: `1px solid #BFDBFE`, borderRadius: 10, padding: '10px 12px', fontSize: '.76rem', color: T.info, marginTop: 4 }}>
              <strong>Durée :</strong> Calculée automatiquement depuis le client détecté dans le fichier (BMW/Mercedes = 12 mois, VW/Audi/autres = 6 mois).<br />
              <strong>Assignation :</strong> Vous serez automatiquement assigné à tous les audits.
            </div>
          </div>
        </Card>

        {/* ── Colonne droite : Import Excel ── */}
        <Card style={{ minHeight: 380 }}>
          <h3 style={{ color: T.navy, marginTop: 0, marginBottom: 4, fontSize: '1rem', fontWeight: 800 }}>Fichier de planification</h3>
          <div style={{ fontSize: '.75rem', color: T.g400, marginBottom: 16 }}>Format standard multi-plant — colonnes A→T, D/ND/R</div>

          {/* Drop zone */}
          <div
            onClick={() => inpRef.current?.click()}
            onDrop={e => { e.preventDefault(); setDrag(false); handleFile(e.dataTransfer.files[0]); }}
            onDragOver={e => { e.preventDefault(); setDrag(true); }}
            onDragLeave={() => setDrag(false)}
            style={{
              border: `2.5px dashed ${drag ? T.blueM : fichier ? '#86EFAC' : T.g300}`,
              borderRadius: 16, padding: '2.4rem 1.5rem', textAlign: 'center',
              background: drag ? T.infoBg : fichier ? T.successBg : T.g50,
              cursor: 'pointer', transition: 'all .2s', marginBottom: 14, minHeight: 200,
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10,
            }}
          >
            <input ref={inpRef} type="file" accept=".xlsx,.xls" hidden onChange={e => handleFile(e.target.files[0])} />
            <div style={{ fontSize: '2.2rem', color: fichier ? T.success : T.blueM }}>{fichier ? <FiCheckCircle /> : <FiFolder />}</div>
            <div style={{ fontWeight: 800, fontSize: '.92rem', color: fichier ? T.success : T.g700 }}>
              {fichier ? fichier.name : 'Glissez votre fichier Excel ou cliquez'}
            </div>
            <div style={{ fontSize: '.73rem', color: T.g400 }}>
              {fichier ? `${(fichier.size / 1024).toFixed(1)} KB` : 'Format .xlsx requis'}
            </div>
            {fichier && (
              <button onClick={e => { e.stopPropagation(); setFichier(null); }}
                style={{ background: 'none', border: 'none', color: T.g400, cursor: 'pointer', fontSize: '.73rem', textDecoration: 'underline' }}>
                Changer de fichier
              </button>
            )}
          </div>

          {err && (
            <div style={{ background: T.dangerBg, color: T.danger, borderRadius: 8, padding: '8px 12px', fontSize: '.82rem', marginBottom: 12 }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><FiAlertTriangle />{err}</span>
            </div>
          )}

          <Btn onClick={doImport} disabled={!fichier || loading || !plantId} style={{ width: '100%', justifyContent: 'center' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}><FiUpload />{loading ? 'Analyse en cours…' : 'Importer et analyser'}</span>
          </Btn>
        </Card>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// ÉTAPE 2 — Vérification (auditeur auto, deadline auto)
// ══════════════════════════════════════════════════════════════
function EtapeVerification({ importData, currentUser, onBack, onLanced }) {
  const auditsRaw        = importData?.audits || importData?.rows || [];
  const planificationId  = importData?.planificationId;
  const planifSegId      = importData?.segmentId ?? null;
  const planifPlantId    = importData?.plantId ?? currentUser?.plantId ?? null;
  const planifSiteId     = importData?.siteId  ?? currentUser?.siteId  ?? null;

  const [audits,  setAudits]  = useState(() =>
    auditsRaw.map(a => ({
      ...a,
      auditeurId: String(currentUser?.id || ''),
      deadline:   addOneMonth(a.datePrevue),
    }))
  );
  const [loading, setLoading] = useState(false);

  const toISO = (v) => {
    if (!v) return null;
    const s = String(v).trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
    const fr = s.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (fr) return `${fr[3]}-${fr[2]}-${fr[1]}`;
    const ym = s.match(/^(\d{4})-(\d{2})$/);
    if (ym) return `${ym[1]}-${ym[2]}-01`;
    const d = new Date(s);
    return isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
  };

  const NC = {
    NON_DESTRUCTIF: { bg: '#E8F0FB', text: '#0057B8', label: 'ND' },
    DESTRUCTIF:     { bg: '#FDECEA', text: '#C0392B', label: 'D'  },
    REQUALIFICATION:{ bg: '#FFF4D6', text: '#C8982A', label: 'R'  },
  };

  const lancer = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:8080/api/planification/lancer', {
        method: 'POST',
        headers: apiH(),
        body: JSON.stringify({
          planificationId,
          audits: audits.map(a => ({
            auditId:       a.auditId  || null,
            reference:     a.tempId,
            auditeurId:    parseInt(a.auditeurId),
            deadline:      a.deadline,
            typeAudit:     a.typeAudit  || 'AUDIT_PRODUIT',
            natureAudit:   a.natureAudit || 'NON_DESTRUCTIF',
            datePrevue:    toISO(a.datePrevue),
            projetId:      a.projetId  ? parseInt(a.projetId)  : null,
            serieId:       a.serieId   ? parseInt(a.serieId)   : null,
            segmentId:     planifSegId || (a.segmentId ? parseInt(a.segmentId) : null),
            plantId:       a.plantId   ? parseInt(a.plantId)   : planifPlantId,
            siteId:        a.siteId    ? parseInt(a.siteId)    : planifSiteId,
            familleCablage: a.familleCablage,
            domaine:       a.domaine,
            variantNo:     a.variantNo,
            bmwNo:         a.bmwNo,
            serieNom:      a.serieNom  || a.familleCablage || null,
            projetNom:     a.projetNom || a.domaine        || null,
          })),
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      onLanced(await res.json());
    } catch (e) {
      alert('Erreur lancement : ' + (e.message || 'inconnue'));
    }
    setLoading(false);
  };

  const th = { fontSize: '.74rem', fontWeight: 700, color: T.g500, padding: '9px 10px', textAlign: 'left', background: T.g50, borderBottom: `1px solid ${T.g100}` };
  const td = { padding: '8px 10px', fontSize: '.82rem', color: T.g700, verticalAlign: 'middle' };

  return (
    <div>
      {/* Info résumé */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 18, flexWrap: 'wrap' }}>
        <div style={{ background: T.successBg, border: `1px solid #86EFAC`, borderRadius: 10, padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 200 }}>
          <FiUserCheck size={18} color={T.success} />
          <div>
            <div style={{ fontSize: '.72rem', color: T.success, fontWeight: 600, textTransform: 'uppercase', letterSpacing: .3 }}>Auditeur assigné</div>
            <div style={{ fontSize: '.88rem', color: T.success, fontWeight: 800 }}>{currentUser?.prenom} {currentUser?.nom}</div>
          </div>
        </div>

        <div style={{ background: T.warnBg, border: `1px solid #FDE68A`, borderRadius: 10, padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 200 }}>
          <FiCalendar size={18} color={T.warn} />
          <div>
            <div style={{ fontSize: '.72rem', color: T.warn, fontWeight: 600, textTransform: 'uppercase', letterSpacing: .3 }}>Deadline</div>
            <div style={{ fontSize: '.88rem', color: T.warn, fontWeight: 800 }}>Date prévue + 1 mois (auto)</div>
          </div>
        </div>

        <div style={{ background: T.infoBg, border: `1px solid #BFDBFE`, borderRadius: 10, padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 10, minWidth: 120 }}>
          <FiFileText size={18} color={T.info} />
          <div>
            <div style={{ fontSize: '.72rem', color: T.info, fontWeight: 600, textTransform: 'uppercase', letterSpacing: .3 }}>Audits</div>
            <div style={{ fontSize: '1.4rem', color: T.info, fontWeight: 900, lineHeight: 1 }}>{audits.length}</div>
          </div>
        </div>
      </div>

      {/* Tableau des audits */}
      <Card style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={th}>Référence</th>
                <th style={th}>Famille / Projet</th>
                        <FiUserCheck size={11} />
                <th style={th}>Date prévue</th>
                <th style={th}>Auditeur (auto)</th>
                <th style={th}>Deadline (auto)</th>
              </tr>
            </thead>
            <tbody>
              {audits.map((a, i) => {
                const nc = NC[a.natureAudit] || NC.NON_DESTRUCTIF;
                return (
                  <tr key={i} style={{ background: i % 2 === 0 ? '#fff' : T.g50, borderBottom: `1px solid ${T.g100}` }}>
                    <td style={td}>
                      <span style={{ fontFamily: 'monospace', fontSize: '.79rem', color: T.g700 }}>
                        {a.reference || a.tempId || `A-${i + 1}`}
                      </span>
                    </td>
                    <td style={td}>
                      <span style={{ fontSize: '.81rem', color: T.g700 }}>
                        {a.familleCablage || a.projetNom || a.domaine || '—'}
                      </span>
                    </td>
                    <td style={td}>
                      <Pill bg={nc.bg} color={nc.text}>{nc.label}</Pill>
                    </td>
                    <td style={td}>{a.datePrevue || '—'}</td>
                    <td style={td}>
                      <span style={{ background: T.successBg, color: T.success, fontSize: '.79rem', fontWeight: 700, padding: '3px 10px', borderRadius: 7, display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                        {currentUser?.prenom} {currentUser?.nom}
                      </span>
                    </td>
                    <td style={td}>
                      <span style={{ background: T.warnBg, color: T.warn, fontSize: '.79rem', fontWeight: 700, padding: '3px 10px', borderRadius: 7 }}>
                        {a.deadline || '—'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 20, flexWrap: 'wrap', gap: 12 }}>
        <Btn variant="secondary" onClick={onBack}><span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}><FiArrowLeft />Retour</span></Btn>
        <Btn variant="gold" onClick={lancer} disabled={loading || audits.length === 0}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}><FiSend />{loading ? 'Lancement en cours…' : `Lancer la planification (${audits.length} audits)`}</span>
        </Btn>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// ÉTAPE 3 — Succès
// ══════════════════════════════════════════════════════════════
function EtapeSucces({ navigate }) {
  return (
    <Card style={{ textAlign: 'center', padding: '3.5rem 2rem' }}>
      <div style={{ fontSize: '4rem', marginBottom: 16, color: T.success }}><FiCheckCircle /></div>
      <h2 style={{ color: T.success, marginBottom: 8, fontSize: '1.4rem' }}>Planification lancée avec succès !</h2>
      <p style={{ color: T.g500, marginBottom: 28, fontSize: '.9rem' }}>
        Tous vos audits ont été créés et vous sont assignés. Vous pouvez les suivre depuis votre planning.
      </p>
      <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
        <Btn onClick={() => navigate('/auditeur/planning')}><span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}><FiCalendar />Voir mon planning</span></Btn>
        <Btn variant="secondary" onClick={() => navigate('/auditeur/audits')}><span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}><FiFileText />Mes audits</span></Btn>
      </div>
    </Card>
  );
}

// ══════════════════════════════════════════════════════════════
// COMPOSANT PRINCIPAL
// ══════════════════════════════════════════════════════════════
export default function AuditeurPlanificationPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user }  = useAuth();
  const [step,       setStep]       = useState(1);
  const [importData, setImportData] = useState(null);

  useEffect(() => {
    const draftId = searchParams.get('draftId');
    if (!draftId) return;
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch(`http://localhost:8080/api/planification/${draftId}`, { headers: apiH() });
        if (!res.ok) return;
        const data = await res.json();
        if (cancelled) return;

        const statut = (data?.statut || '').toUpperCase();
        if (statut !== 'BROUILLON') return;
        if (user?.id && String(data?.createurId) !== String(user.id)) return;

        const audits = Array.isArray(data?.audits) ? data.audits : Array.isArray(data?.rows) ? data.rows : [];
        setImportData({
          ...data,
          planificationId: data?.id || draftId,
          audits,
          segmentId: data?.segmentId ?? null,
          plantId: data?.plantId ?? null,
          siteId: data?.siteId ?? null,
        });
        setStep(2);
      } catch {
        // ignore: the normal import flow remains available
      }
    })();

    return () => { cancelled = true; };
  }, [searchParams, user?.id]);

  return (
    <div style={{ width: '100%', padding: 0, boxSizing: 'border-box' }}>


      {/* Stepper */}
      <div style={{ marginBottom: 14, display: 'flex', justifyContent: 'center' }}>
        <Stepper step={step} />
      </div>

      {/* Étapes */}
      {step === 1 && (
        <EtapeContexteImport
          user={user}
          onImported={(data) => { setImportData(data); setStep(2); }}
        />
      )}
      {step === 2 && (
        <EtapeVerification
          importData={importData}
          currentUser={user}
          onBack={() => setStep(1)}
          onLanced={() => setStep(3)}
        />
      )}
      {step === 3 && <EtapeSucces navigate={navigate} />}
    </div>
  );
}