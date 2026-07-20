// ═══════════════════════════════════════════════════════════════
// AuditeurSuiviPlanification.jsx
// Suivi des planifications CRÉÉES PAR L'AUDITEUR LUI-MÊME.
// Même principe que ListePlanificationsExpert (calendrier par série/mois,
// ajout / modification d'audits) mais restreint :
//  - Liste : uniquement les planifications créées par l'auditeur connecté
//  - Auditeur assigné : lui-même par défaut (réassignable à un collègue
//    du même plant, comme le permet le back-end)
//  - Projet / Série : modifiables uniquement à la création (le back-end
//    ne permet pas de les changer après coup pour l'auditeur)
// ═══════════════════════════════════════════════════════════════
import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const T = {
  navy: '#002855', blue: '#003F8A', blueM: '#0057B8',
  gold: '#C8982A', goldP: '#FFF4D6',
  g50: '#F7F9FC', g100: '#d6dfed', g200: '#d6deea', g300: '#BCC8DC',
  g400: '#8A9BBC', g500: '#5C6F8A', g700: '#273347', g800: '#182030',
  success: '#1A7A4A', successBg: '#cce8db',
  warn: '#C8982A', warnBg: '#fbefce',
  danger: '#C0392B', dangerBg: '#FDECEA',
  info: '#0057B8', infoBg: '#d1deef',
};

const apiH = () => ({
  Authorization: `Bearer ${localStorage.getItem('token')}`,
  'Content-Type': 'application/json',
});
const API_BASE = 'http://localhost:8080';

function fmt(d) {
  if (!d) return '—';
  try { return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }); }
  catch { return d; }
}

function toIsoDate(val) {
  if (!val) return null;
  const s = String(val).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const fr = s.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (fr) return `${fr[3]}-${fr[2]}-${fr[1]}`;
  if (/^\d{4}-\d{2}$/.test(s)) return `${s}-01`;
  const d = new Date(s);
  if (!isNaN(d.getTime())) return d.toISOString().slice(0, 10);
  return null;
}

const STATUT_CFG = {
  BROUILLON: { bg: T.g100, text: T.g500, label: 'Brouillon' },
  EN_COURS: { bg: T.infoBg, text: T.info, label: 'En cours' },
  TERMINEE: { bg: T.successBg, text: T.success, label: 'Terminée' },
  ANNULEE: { bg: T.dangerBg, text: T.danger, label: 'Annulée' },
};

const normalizeStatut = (v) => (v || '').toString().trim().toUpperCase().replace(/\s+/g, '_');
const mapStatut = (v) => {
  const s = normalizeStatut(v);
  const map = { LANCE: 'EN_COURS', TERMINE: 'TERMINEE', ANNULE: 'ANNULEE' };
  return map[s] || s;
};

function Pill({ bg, color, children }) {
  return (
    <span style={{ background: bg, color, fontSize: '.68rem', fontWeight: 700, padding: '3px 9px', borderRadius: 99 }}>
      {children}
    </span>
  );
}

function Btn({ children, onClick, disabled, variant = 'primary', small, style: styleOverride }) {
  const [hov, setHov] = useState(false);
  const styles = {
    primary: { background: hov ? T.blue : T.navy, color: '#fff' },
    blue: { background: hov ? T.blueM : T.blue, color: '#fff' },
    audit: { background: hov ? T.blue : T.blueM, color: '#fff' },
    export: { background: hov ? T.g200 : T.g100, color: T.g700, border: `1px solid ${T.g300}` },
    secondary: { background: T.g100, color: T.g700, border: `1px solid ${T.g200}` },
    danger: { background: T.dangerBg, color: T.danger, border: `1px solid #FCA5A5` },
    gold: { background: T.gold, color: '#fff' },
  };
  return (
    <button
      onClick={disabled ? undefined : onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        border: 'none', cursor: disabled ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
        fontWeight: 700, padding: small ? '6px 14px' : '10px 20px',
        fontSize: small ? '.75rem' : '.83rem',
        borderRadius: 9, opacity: disabled ? .5 : 1, transition: 'all .2s',
        display: 'inline-flex', alignItems: 'center', gap: 5,
        ...styles[variant], ...styleOverride,
      }}
      disabled={disabled}>
      {children}
    </button>
  );
}

function SuiviStepBar({ steps, theme }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.8rem', padding: '.85rem 0 .8rem', flexWrap: 'nowrap', overflowX: 'auto' }}>
      {steps.map((step, index) => {
        const isDone = step.done;
        const isActive = !isDone && (index === 0 || steps[index - 1]?.done);
        return (
          <div key={step.key || index} style={{ display: 'flex', alignItems: 'center', gap: 7, flexShrink: 0 }}>
            {index > 0 && <div style={{ width: 18, height: 1.5, background: isDone ? `${theme.accent}66` : 'rgba(255,255,255,.18)', flexShrink: 0, borderRadius: 99 }} />}
            <div style={{ width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 12, flexShrink: 0, background: isDone ? theme.accent : isActive ? theme.soft : 'rgba(152,152,152,.4)', color: isDone ? '#fff' : isActive ? theme.accent : 'rgba(255,255,255,.4)', border: isDone ? `2px solid ${theme.accent}` : isActive ? `2px solid ${theme.accent}` : '2px solid rgba(255,255,255,.18)', boxShadow: isDone ? `0 0 0 3px ${theme.accent}33,0 2px 8px ${theme.accent}44` : isActive ? `0 2px 10px ${theme.accent}22` : 'none', transition: 'all .3s' }}>
              {isDone ? '✓' : index + 1}
            </div>
            <span style={{ fontSize: '.74rem', fontWeight: isDone || isActive ? 700 : 500, color: isDone ? 'rgba(255,255,255,.95)' : isActive ? '#fff' : 'rgba(255,255,255,.38)', whiteSpace: 'nowrap' }}>{step.label}</span>
          </div>
        );
      })}
    </div>
  );
}

function ProgressBar({ value }) {
  const c = value === 100 ? T.success : value > 50 ? T.gold : T.info;
  return (
    <div style={{ height: 6, background: T.g100, borderRadius: 99, overflow: 'hidden', width: '100%' }}>
      <div style={{ height: '100%', width: `${value}%`, background: c, borderRadius: 99, transition: 'width .3s' }} />
    </div>
  );
}

function PlanifCard({ planif, onSelect, onDelete, navigate }) {
  const [hov, setHov] = useState(false);
  const sKey = mapStatut(planif.statut);
  const total = planif.nombreAuditsTotal ?? 0;
  const termines = planif.nombreAuditsTermines ?? 0;
  const effectiveKey = (total > 0 && termines === total) ? 'TERMINEE' : sKey;
  const s = STATUT_CFG[effectiveKey] || STATUT_CFG.EN_COURS;
  const isDraft = effectiveKey === 'BROUILLON';
  const enRetard = planif.nombreAuditsEnRetard ?? 0;
  const pct = planif.progressionPct ?? (total > 0 ? Math.round(termines / total * 100) : 0);

  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: '#dfe7ee', borderRadius: 16,
        border: `2px solid ${hov ? T.navy : T.g300}`,
        padding: '1.3rem', transition: 'all .2s', cursor: 'pointer',
        boxShadow: hov ? '0 10px 30px rgba(139,149,160,0.12)' : '0 2px 8px rgba(0,40,85,.06)',
        transform: hov ? 'translateY(-2px)' : 'none',
      }}
      onClick={() => {
        if (isDraft) { navigate(`/auditeur/planification?draftId=${planif.id}`); return; }
        onSelect(planif);
      }}>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ margin: 0, fontWeight: 800, fontSize: '.95rem', color: T.navy, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {planif.nom}
          </p>
          <p style={{ margin: '4px 0 0', fontSize: '.74rem', color: T.g400 }}>
            {fmt(planif.dateDebut)} — {fmt(planif.dateFin)}
          </p>
          {planif.segmentNom && (
            <p style={{ margin: '2px 0 0', fontSize: '.72rem', color: T.g500, fontWeight: 600 }}>{planif.segmentNom}</p>
          )}
        </div>
        <Pill bg={s.bg} color={s.text}>{s.label}</Pill>
      </div>

      {!isDraft && (
        <>
          <ProgressBar value={pct} />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: '.72rem', color: T.g400 }}>
            <span>{pct}% terminés</span>
            <span>{termines} / {total} audits{enRetard > 0 ? ` · ${enRetard} en retard` : ''}</span>
          </div>
        </>
      )}

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
        {isDraft && (
          <Btn small variant="danger" onClick={(e) => { e.stopPropagation(); onDelete(planif.id); }}>Supprimer</Btn>
        )}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// DÉTAIL — calendrier par série/mois + ajout / modification d'audits
// ══════════════════════════════════════════════════════════════
function DetailSuivi({ planif, currentUser, onBack, onUpdate }) {
  const [audits, setAudits] = useState(planif.audits || []);
  const [calendarFilter, setCalendarFilter] = useState('all');
  const [calendarNature, setCalendarNature] = useState('all');
  const [selectedAudit, setSelectedAudit] = useState(null);
  const [auditForm, setAuditForm] = useState(null);
  const [savingAudit, setSavingAudit] = useState(false);
  const [projectsByPlant, setProjectsByPlant] = useState([]);
  const [seriesByProject, setSeriesByProject] = useState([]);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [loadingSeries, setLoadingSeries] = useState(false);
  const [collegues, setCollegues] = useState([]);
  const [formMsg, setFormMsg] = useState(null);

  const fetchJson = async (url) => {
    const res = await fetch(`${API_BASE}${url}`, { headers: apiH() });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  };

  const planifPlantId = planif?.plantId ? String(planif.plantId) : '';
  const planifPlantNom = planif?.plantNom || (planifPlantId ? `Plant ${planifPlantId}` : '—');
  const planifSegmentId = planif?.segmentId ? String(planif.segmentId) : '';
  const planifSegmentNom = planif?.segmentNom || (planifSegmentId ? `Segment ${planifSegmentId}` : '—');

  const MONTHS_FR = ['', 'Jan', 'Fev', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aou', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthLabel = (iso) => {
    if (!iso || typeof iso !== 'string') return '—';
    const [y, m] = iso.split('-');
    return `${MONTHS_FR[parseInt(m)] || m} ${y}`;
  };

  const getMonthNumber = (val) => {
    if (!val) return null;
    const s = val.toString().trim();
    const m1 = s.match(/^(\d{4})-(\d{2})/);
    if (m1) return parseInt(m1[2], 10);
    const m2 = s.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (m2) return parseInt(m2[2], 10);
    const d = new Date(s.length === 7 ? `${s}-01` : s);
    if (Number.isNaN(d.getTime())) return null;
    return d.getMonth() + 1;
  };

  const isLate = (a) => {
    if (!a?.deadline) return false;
    const d = new Date(`${a.deadline}T00:00:00`);
    if (Number.isNaN(d.getTime())) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return d < today;
  };

  const calendarStatus = (a) => {
    const st = (a?.statut || '').toString().toUpperCase().trim();
    if (st === 'TERMINE' || st === 'TERMINEE') return 'done';
    if (st === 'EN_RETARD') return 'late';
    if (st === 'EN_COURS') return 'active';
    if (st === 'ANNULE' || st === 'ANNULEE') return 'cancelled';
    if (isLate(a)) return 'late';
    return 'wait';
  };

  const calendarNatureCode = (a) => {
    if (a?.natureAudit === 'DESTRUCTIF') return 'D';
    if (a?.natureAudit === 'REQUALIFICATION') return 'R';
    return 'ND';
  };

  function getAuditWorkflow(a) {
    const st = (a?.statut || '').toString().toUpperCase().trim();
    const cancelled = st === 'ANNULE' || st === 'ANNULEE';
    const completed = st === 'TERMINE' || st === 'TERMINEE';
    const workflow = (a?.workflow || a?.modeWorkflow || 'RAPPORT').toString().toUpperCase();
    const qkColor = (a?.qkColor || a?.couleurQK || '').toString().toUpperCase();
    const rapportImporte = !!(a?.rapportImporte || a?.rapportPdf || a?.rapportUrl || a?.rapportNom);
    const allDone = !!(a?.allDoneAnnexes || a?.annexesCompletes);
    const hasQk = a?.valeurQK != null && a?.valeurQK !== '';
    const ficheValidee = !!(a?.ficheValidee || a?.ficheReparationValidee);
    const pdcaValidee = !!(a?.pdcaValidee || a?.pdcaComplete);
    const rapportGenere = !!(a?.rapportGenere || a?.rapportFinalGenere || completed);
    const ficheReq = ['ORANGE', 'ROSE', 'ROUGE'].includes(qkColor);
    const pdcaReq = ['ROSE', 'ROUGE'].includes(qkColor);

    const steps = [
      { key: 'start', label: 'Commencer', done: true },
      ...(workflow === 'RAPPORT'
        ? [{ key: 'rapport', label: 'Import Rapport', done: rapportImporte }]
        : workflow === 'ANNEXES'
          ? [{ key: 'annexes', label: 'Annexes', done: allDone }]
          : [{ key: 'docs', label: 'Documents', done: false }]),
      ...(workflow === 'RAPPORT'
        ? [{ key: 'qk', label: 'Saisie QK', done: hasQk }]
        : [{ key: 'qk', label: 'Calcul QK', done: hasQk }]),
      ...(ficheReq ? [{ key: 'fiche', label: 'Fiche', done: ficheValidee }] : []),
      ...(pdcaReq ? [{ key: 'pdca', label: 'PDCA', done: pdcaValidee }] : []),
      { key: 'gen', label: 'Rapport', done: rapportGenere },
      { key: 'fin', label: 'Terminé', done: completed },
    ];
    const firstPending = steps.findIndex(s => !s.done);
    const current = firstPending === -1 ? steps.length : firstPending + 1;
    const action = cancelled ? "Audit annulé. Aucune action en cours."
      : completed ? "Audit terminé. Le dossier est clôturé."
        : `Étape actuelle: ${steps[current - 1]?.label || 'Suivi en cours'}.`;
    return { steps, current, cancelled, completed, action };
  }

  const calendarFiltered = audits.filter(a => {
    const status = calendarStatus(a);
    const nature = calendarNatureCode(a);
    return (calendarFilter === 'all' || calendarFilter === status)
      && (calendarNature === 'all' || calendarNature === nature);
  });

  const totalAudits = audits.length;
  const totalTermines = audits.filter(a => calendarStatus(a) === 'done').length;
  const totalEnCours = audits.filter(a => calendarStatus(a) === 'active').length;
  const totalRetard = audits.filter(a => calendarStatus(a) === 'late').length;
  const totalPlanifies = audits.filter(a => calendarStatus(a) === 'wait').length;
  const pctGlobal = totalAudits > 0 ? Math.round(totalTermines / totalAudits * 100) : 0;

  const derivedStatus = (totalAudits > 0 && totalTermines === totalAudits) ? 'TERMINEE' : mapStatut(planif.statut);
  const s = STATUT_CFG[derivedStatus] || STATUT_CFG.EN_COURS;

  const buildDateForMonth = (month) => {
    const base = planif?.dateDebut || planif?.dateFin || new Date().toISOString().slice(0, 10);
    const isoBase = toIsoDate(base);
    if (!isoBase) return new Date().toISOString().slice(0, 10);
    const year = isoBase.slice(0, 4);
    const mm = String(month).padStart(2, '0');
    return `${year}-${mm}-01`;
  };

  // ── Projets du segment (endpoints dédiés auditeur) ──
  useEffect(() => {
    if (!planifSegmentId) { setProjectsByPlant([]); return; }
    let active = true;
    (async () => {
      setLoadingProjects(true);
      try {
        const projects = await fetchJson(`/api/auditeur/segments/${planifSegmentId}/projets`);
        if (active) setProjectsByPlant(Array.isArray(projects) ? projects : []);
      } catch {
        if (active) {
          const fallback = audits.filter(a => a.projetId).map(a => ({ id: a.projetId, nom: a.projetNom || `Projet ${a.projetId}` }));
          setProjectsByPlant(Array.from(new Map(fallback.map(p => [String(p.id), p])).values()));
        }
      } finally { if (active) setLoadingProjects(false); }
    })();
    return () => { active = false; };
  }, [planifSegmentId]);

  // ── Séries du projet sélectionné ──
  useEffect(() => {
    if (!auditForm?.projetId) { setSeriesByProject([]); return; }
    let active = true;
    (async () => {
      setLoadingSeries(true);
      try {
        const series = await fetchJson(`/api/auditeur/projets/${auditForm.projetId}/series-actives`);
        if (active) setSeriesByProject(Array.isArray(series) ? series.filter(s => s?.actif !== false) : []);
      } catch { if (active) setSeriesByProject([]); }
      finally { if (active) setLoadingSeries(false); }
    })();
    return () => { active = false; };
  }, [auditForm?.projetId]);

  // ── Collègues du même plant (pour réassignation lors d'une modification) ──
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const list = await fetchJson('/api/auditeur/mon-plant/auditeurs');
        if (active) setCollegues(Array.isArray(list) ? list : []);
      } catch { if (active) setCollegues([]); }
    })();
    return () => { active = false; };
  }, []);

  const openCreateAudit = (preset = {}) => {
    setFormMsg(null);
    setAuditForm({
      mode: 'create',
      id: null,
      natureAudit: 'NON_DESTRUCTIF',
      datePrevue: preset.datePrevue || '',
      deadline: '',
      auditeurId: String(currentUser?.id || ''),
      serieId: '',
      projetId: '',
      segmentId: planifSegmentId,
      plantId: planifPlantId,
      observations: preset.observations || '',
    });
  };

  const openEditAudit = (audit) => {
    setFormMsg(null);
    setAuditForm({
      mode: 'edit',
      id: audit.id,
      natureAudit: audit.natureAudit || 'NON_DESTRUCTIF',
      datePrevue: toIsoDate(audit.datePrevue) || '',
      deadline: toIsoDate(audit.deadline) || '',
      auditeurId: audit.auditeurId ? String(audit.auditeurId) : String(currentUser?.id || ''),
      serieNomFixe: audit.serieNom || '—',
      projetNomFixe: audit.projetNom || '—',
      observations: audit.observations || '',
    });
  };

  const toInt = (v) => (v && String(v).trim() ? parseInt(v, 10) : null);

  const submitAudit = async () => {
    setFormMsg(null);
    const datePrevueIso = toIsoDate(auditForm.datePrevue);
    if (!datePrevueIso) { setFormMsg({ type: 'error', text: 'La date prévue est obligatoire.' }); return; }

    setSavingAudit(true);
    try {
      if (auditForm.mode === 'create') {
        const payload = {
          typeAudit: 'AUDIT_PRODUIT',
          natureAudit: auditForm.natureAudit || 'NON_DESTRUCTIF',
          datePrevue: datePrevueIso,
          deadline: toIsoDate(auditForm.deadline) || null,
          plantId: toInt(planifPlantId),
          segmentId: toInt(planifSegmentId) || null,
          projetId: toInt(auditForm.projetId) || null,
          serieId: toInt(auditForm.serieId) || null,
          auditeurId: toInt(auditForm.auditeurId) || currentUser?.id || null,
          planificationId: planif?.id ?? null,
          observations: auditForm.observations || null,
        };
        const res = await fetch(`${API_BASE}/api/audits/planifier`, { method: 'POST', headers: apiH(), body: JSON.stringify(payload) });
        if (!res.ok) throw new Error(await res.text());
        const created = await res.json();
        setAudits(prev => [...prev, created]);
        setFormMsg({ type: 'success', text: 'Audit créé avec succès !' });
        setTimeout(() => setAuditForm(null), 800);

      } else if (auditForm.mode === 'edit' && auditForm.id) {
        const payload = {
          natureAudit: auditForm.natureAudit,
          datePrevue: datePrevueIso,
          deadline: toIsoDate(auditForm.deadline) || null,
          auditeurId: toInt(auditForm.auditeurId) || null,
          observations: auditForm.observations || null,
        };
        const res = await fetch(`${API_BASE}/api/auditeur/audits/${auditForm.id}`, { method: 'PUT', headers: apiH(), body: JSON.stringify(payload) });
        if (!res.ok) throw new Error(await res.text());
        const updated = await res.json();
        setAudits(prev => prev.map(a => a.id === updated.id ? updated : a));
        setFormMsg({ type: 'success', text: 'Audit modifié avec succès !' });
        setTimeout(() => setAuditForm(null), 800);
      }
    } catch (e) {
      let msg = e.message || 'Erreur lors de la sauvegarde.';
      try { msg = JSON.parse(msg)?.message || msg; } catch { }
      setFormMsg({ type: 'error', text: msg });
    }
    setSavingAudit(false);
  };

  const deleteAudit = async (auditId) => {
    if (!window.confirm('Supprimer cet audit ?')) return;
    try {
      const res = await fetch(`${API_BASE}/api/auditeur/audits/${auditId}`, { method: 'DELETE', headers: apiH() });
      if (!res.ok) throw new Error(await res.text());
      setAudits(prev => prev.filter(a => a.id !== auditId));
      setSelectedAudit(null);
    } catch (e) { alert('Erreur suppression : ' + e.message); }
  };

  const exportExcel = async () => {
    if (!planif?.id) return;
    try {
      const res = await fetch(`${API_BASE}/api/planification/${planif.id}/export`, { headers: apiH() });
      if (!res.ok) throw new Error(await res.text());
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = planif.fichierPlanificationNom || `${planif.nom.replace(/\s+/g, '_')}.xlsx`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (e) { alert('Erreur export : ' + e.message); }
  };

  const chipColor = (status) => ({
    done: { bg: T.success, text: '#fff' },
    active: { bg: T.warn, text: '#fff' },
    late: { bg: T.danger, text: '#fff' },
    cancelled: { bg: T.g300, text: T.g700 },
    wait: { bg: T.blue, text: '#fff' },
  }[status] || { bg: T.blue, text: '#fff' });

  return (
    <div>
      <button onClick={onBack} style={btnBack}>← Retour à mon suivi</button>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: T.navy, margin: 0 }}>{planif.nom}</h1>
            <Pill bg={s.bg} color={s.text}>{s.label}</Pill>
          </div>
          <p style={{ margin: 0, fontSize: '.8rem', color: T.g400 }}>Du {fmt(planif.dateDebut)} au {fmt(planif.dateFin)}</p>
          {(planifPlantNom !== '—' || planifSegmentNom !== '—') && (
            <p style={{ margin: '4px 0 0', fontSize: '.75rem', color: T.g500, fontWeight: 600 }}>
              {[planif.siteNom, planifPlantNom, planifSegmentNom].filter(v => v && v !== '—').join(' › ')}
            </p>
          )}
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <Btn variant="audit" onClick={() => openCreateAudit()} style={{ padding: '12px 24px', borderRadius: 25, fontSize: '.8rem' }}>+ Ajouter un audit</Btn>
          <Btn variant="export" onClick={exportExcel} style={{ padding: '12px 24px', borderRadius: 25, fontSize: '.8rem' }}>Exporter Excel</Btn>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 10, marginBottom: 14 }}>
        {[
          { label: 'Total audits', value: totalAudits, color: T.navy },
          { label: 'Terminés', value: totalTermines, color: T.success },
          { label: 'En cours', value: totalEnCours, color: T.warn },
          { label: 'En retard', value: totalRetard, color: T.danger },
          { label: 'Planifiés', value: totalPlanifies, color: T.blue },
        ].map(st => (
          <div key={st.label} style={{ textAlign: 'center', padding: '10px 20px', borderRadius: 12, background: '#bcc8dc3d' }}>
            <div style={{ fontSize: '1.8rem', fontWeight: 900, color: st.color }}>{st.value}</div>
            <div style={{ fontSize: '.7rem', color: T.g400, fontWeight: 600, marginTop: 2 }}>{st.label}</div>
          </div>
        ))}
      </div>

      <div style={{ marginBottom: 16 }}>
        <ProgressBar value={pctGlobal} />
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, fontSize: '.72rem', color: T.g400 }}>
          <span>{pctGlobal}% terminés</span>
          <span>{totalTermines} / {totalAudits} audits</span>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
        {[{ key: 'all', label: 'Tous' }, { key: 'ND', label: 'ND' }, { key: 'D', label: 'D' }, { key: 'R', label: 'R' }].map(f => (
          <button key={f.key} onClick={() => { setCalendarNature(f.key); setCalendarFilter('all'); }}
            style={{ padding: '5px 12px', borderRadius: 999, fontSize: '.75rem', fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer', background: calendarNature === f.key ? T.g100 : 'transparent', color: calendarNature === f.key ? T.navy : T.g500, border: '1.5px solid #BCC8DC' }}>
            {f.label}
          </button>
        ))}
        {[{ key: 'done', label: 'Terminés', bg: T.success }, { key: 'active', label: 'En cours', bg: T.warn }, { key: 'late', label: 'En retard', bg: T.danger }, { key: 'wait', label: 'Planifiés', bg: T.blue }].map(f => (
          <button key={`st-${f.key}`} onClick={() => { setCalendarFilter(f.key); setCalendarNature('all'); }}
            style={{ padding: '5px 12px', borderRadius: 999, fontSize: '.75rem', fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer', background: calendarFilter === f.key ? f.bg : 'transparent', color: calendarFilter === f.key ? '#fff' : T.g500, border: '1.5px solid #BCC8DC' }}>
            {f.label}
          </button>
        ))}
      </div>

      <div style={{ background: '#fff', borderRadius: 16, border: `1px solid ${T.g300}`, overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '160px repeat(12, 1fr)', borderBottom: `1px solid ${T.g300}` }}>
          <div style={{ padding: '8px 10px', fontSize: '.78rem', fontWeight: 700, color: '#000', background: '#CBD5E1' }}>Série</div>
          {MONTHS_FR.slice(1).map(m => (
            <div key={m} style={{ textAlign: 'center', fontSize: '.72rem', color: '#000', padding: '8px 4px', borderLeft: `1px solid ${T.g300}`, background: '#CBD5E1' }}>{m}</div>
          ))}
        </div>

        {calendarFiltered.map(a => {
          const status = calendarStatus(a);
          const nature = calendarNatureCode(a);
          const m = getMonthNumber(a.datePrevue);
          const rowBg = { done: '#ECFDF3', active: '#FFF7ED', late: '#FEE2E2', wait: '#EFF6FF', cancelled: '#F9FAFB' }[status] || '#fff';
          const cc = chipColor(status);
          return (
            <div key={a.id} onClick={() => setSelectedAudit(a)} style={{ display: 'grid', gridTemplateColumns: '160px repeat(12, 1fr)', borderBottom: `1px solid ${T.g300}`, background: rowBg, cursor: 'pointer' }}>
              <div style={{ padding: '8px 10px', borderRight: `1px solid ${T.g300}`, background: '#BFDBFE' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '.8rem', color: T.navy, fontWeight: 600 }}>
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: T.navy }} />
                  <span>{a.serieNom || a.reference || '—'}</span>
                </div>
                <div style={{ fontSize: '.7rem', color: 'rgba(0,40,85,.7)' }}>{a.auditeurNom || '—'}</div>
              </div>
              {Array.from({ length: 12 }, (_, idx) => {
                const isMonth = m === idx + 1;
                return (
                  <div key={`${a.id}-${idx}`} style={{ padding: '6px 4px', borderLeft: `1px solid ${T.g300}` }}>
                    {isMonth ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                        <div onClick={() => setSelectedAudit(a)} style={{ background: cc.bg, color: cc.text, fontWeight: 800, fontSize: '.72rem', width: '100%', height: 28, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                          {nature}
                        </div>
                        <div onClick={() => setSelectedAudit(a)} style={{ width: '100%', height: 28, borderRadius: 6, border: '2.2px solid #26af6b', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '.68rem', fontWeight: 800, color: a.valeurQK != null ? '#1A7A4A' : '#BCC8DC' }}>
                          {a.valeurQK != null ? a.valeurQK : '—'}
                        </div>
                      </div>
                    ) : (
                      <button onClick={e => { e.stopPropagation(); openCreateAudit({ datePrevue: buildDateForMonth(idx + 1) }); }}
                        style={{ height: '100%', width: '100%', borderRadius: 6, border: '1px solid transparent', background: 'transparent', cursor: 'pointer' }}
                        onMouseEnter={e => { e.currentTarget.style.background = '#EEF4FF'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                        aria-label="Ajouter un audit">&nbsp;</button>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })}

        {calendarFiltered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '2rem', color: T.g300, fontSize: '.85rem' }}>Aucun audit</div>
        )}
      </div>

      {/* Modal détail audit */}
      {selectedAudit && (() => {
        const wf = getAuditWorkflow(selectedAudit);
        const statusKey = calendarStatus(selectedAudit);
        const theme = {
          accent: statusKey === 'done' ? T.success : statusKey === 'late' ? T.danger : statusKey === 'active' ? T.warn : T.blueM,
          soft: statusKey === 'done' ? T.successBg : statusKey === 'late' ? T.dangerBg : statusKey === 'active' ? T.warnBg : T.infoBg,
          border: statusKey === 'done' ? T.successBg : statusKey === 'late' ? T.dangerBg : statusKey === 'active' ? T.warnBg : T.g200,
        };
        const pct = wf.steps.length ? Math.round((wf.steps.filter(s => s.done).length / wf.steps.length) * 100) : 0;
        const reportUrl = selectedAudit?.rapportPdfUrl || selectedAudit?.rapportUrl || selectedAudit?.rapportGenerePdfUrl
          || (selectedAudit?.id ? `${API_BASE}/api/audit-produit/${selectedAudit.id}/rapport-pdf` : null);
        const openReport = () => {
          if (!reportUrl) return;
          const token = localStorage.getItem('token') || '';
          const sep = reportUrl.includes('?') ? '&' : '?';
          window.open(`${reportUrl}${sep}token=${token}`, '_blank', 'noopener,noreferrer');
        };

        return (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(3,12,28,.55)', zIndex: 1200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
            onClick={e => e.target === e.currentTarget && setSelectedAudit(null)}>
            <div style={{ width: '100%', maxWidth: 1100, maxHeight: '90vh', overflow: 'auto', background: '#fff', borderRadius: 22, boxShadow: '0 28px 80px rgba(0,40,85,.28)', border: `1px solid ${theme.border}` }}>
              <div style={{ background: 'linear-gradient(135deg,#001F4E 0%,#003F8A 58%,#0B4D8C 100%)', color: '#fff', borderRadius: '22px 22px 0 0', padding: '18px 24px 0' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 18 }}>
                  <div>
                    <div style={{ fontSize: '.67rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.14em', opacity: .65, marginBottom: 5 }}>Suivi audit produit</div>
                    <div style={{ fontWeight: 900, fontSize: '1.12rem', marginBottom: 3 }}>{selectedAudit?.reference || selectedAudit?.serieNom || `AUD-${selectedAudit?.id}`}</div>
                    <div style={{ fontSize: '.84rem', opacity: .82 }}>{selectedAudit?.projetNom || '—'} · {selectedAudit?.serieNom || '—'} · {selectedAudit?.auditeurNom || '—'}</div>
                  </div>
                  <button onClick={() => setSelectedAudit(null)} style={{ border: '1px solid rgba(255,255,255,.25)', background: 'rgba(255,255,255,.1)', color: '#fff', width: 36, height: 36, borderRadius: 10, cursor: 'pointer', fontWeight: 800, fontSize: '1rem', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
                </div>
                <SuiviStepBar steps={wf.steps} theme={theme} />
                <div style={{ height: 3, background: 'rgba(255,255,255,.18)', margin: '0 -24px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${pct}%`, background: `linear-gradient(90deg,${theme.accent}99,${theme.accent})`, transition: 'width .5s ease' }} />
                </div>
              </div>

              <div style={{ padding: '20px 24px', background: '#e3e3e3' }}>
                <div style={{ display: 'grid', gap: 16 }}>
                  <div style={{ background: '#fff', borderRadius: 16, overflow: 'hidden', boxShadow: '0 4px 18px rgba(0,40,85,.10)', border: '1px solid #DBEAFE', borderTop: `4px solid ${T.blue}` }}>
                    <div style={{ padding: '14px 14px 16px' }}>
                      <div style={{ fontWeight: 800, color: T.navy, fontSize: '.85rem', marginBottom: 10 }}>Informations audit</div>
                      {[
                        ['Référence', selectedAudit.reference],
                        ['Série', selectedAudit.serieNom],
                        ['Projet', selectedAudit.projetNom],
                        ['Auditeur', selectedAudit.auditeurNom],
                        ['Deadline', selectedAudit.deadline],
                        ['Date prévue', selectedAudit.datePrevue],
                        ['Statut', selectedAudit.statut],
                        ['Valeur QK', selectedAudit.valeurQK],
                      ].map(([label, value]) => (
                        <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '.73rem', padding: '6px 10px', borderRadius: 8, background: '#EEF2F8', marginBottom: 6 }}>
                          <span style={{ color: T.g500 }}>{label}</span>
                          <strong style={{ color: T.g700 }}>{value ?? '—'}</strong>
                        </div>
                      ))}
                      {reportUrl && (
                        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 14 }}>
                          <Btn small variant="blue" onClick={openReport}>Voir rapport</Btn>
                        </div>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                    <Btn small variant="danger" onClick={() => deleteAudit(selectedAudit.id)}>Supprimer</Btn>
                    <Btn small variant="secondary" onClick={() => { const a = selectedAudit; setSelectedAudit(null); openEditAudit(a); }}>Modifier</Btn>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Modal création / édition */}
      {auditForm && (
        <div style={overlay}>
          <div style={{ background: '#fff', borderRadius: 20, width: '100%', maxWidth: 520, overflow: 'hidden', boxShadow: '0 24px 64px rgba(0,0,0,.22)' }}>
            <div style={{ background: 'linear-gradient(135deg,#0B1E3D,#1D4ED8)', padding: '1.1rem 1.4rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: '.92rem', fontWeight: 800, color: '#fff' }}>{auditForm.mode === 'create' ? '+ Ajouter un audit' : 'Modifier un audit'}</div>
                <div style={{ fontSize: '.7rem', color: 'rgba(255,255,255,.5)' }}>Audit produit</div>
              </div>
              <button onClick={() => setAuditForm(null)} style={{ background: 'rgba(255,255,255,.1)', border: 'none', borderRadius: 8, width: 30, height: 30, color: '#fff', cursor: 'pointer' }}>✕</button>
            </div>

            <div style={{ padding: '1.4rem 1.5rem' }}>
              {formMsg && (
                <div style={{ marginBottom: 14, padding: '10px 14px', borderRadius: 9, fontSize: '.83rem', fontWeight: 600, background: formMsg.type === 'success' ? T.successBg : T.dangerBg, color: formMsg.type === 'success' ? T.success : T.danger, border: `1px solid ${formMsg.type === 'success' ? '#a5d6bf' : '#f5a5a5'}` }}>
                  {formMsg.type === 'success' ? '✓ ' : '✗ '}{formMsg.text}
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={labelMini}>Plant *</label>
                  <input value={planifPlantNom} readOnly style={{ ...inputMini, background: T.g100, color: T.g700, cursor: 'default' }} />
                </div>
                <div>
                  <label style={labelMini}>Segment</label>
                  <input value={planifSegmentNom} readOnly style={{ ...inputMini, background: T.g100, color: T.g700, cursor: 'default' }} />
                </div>

                <div>
                  <label style={labelMini}>Auditeur</label>
                  {auditForm.mode === 'create' ? (
                    <input value={`${currentUser?.prenom || ''} ${currentUser?.nom || ''}`} readOnly style={{ ...inputMini, background: T.g100, color: T.g700, cursor: 'default' }} />
                  ) : (
                    <select value={auditForm.auditeurId} onChange={e => setAuditForm(p => ({ ...p, auditeurId: e.target.value }))} style={inputMini}>
                      <option value={String(currentUser?.id || '')}>{currentUser?.prenom} {currentUser?.nom} (moi)</option>
                      {collegues.filter(c => String(c.id) !== String(currentUser?.id)).map(c => (
                        <option key={c.id} value={c.id}>{c.prenom} {c.nom}</option>
                      ))}
                    </select>
                  )}
                </div>

                {auditForm.mode === 'create' ? (
                  <>
                    <div>
                      <label style={labelMini}>Projet</label>
                      <select value={auditForm.projetId} onChange={e => setAuditForm(p => ({ ...p, projetId: e.target.value, serieId: '' }))} style={inputMini} disabled={!planifSegmentId || loadingProjects}>
                        <option value="">{loadingProjects ? 'Chargement...' : '-- Choisir --'}</option>
                        {projectsByPlant.map(p => <option key={p.id} value={p.id}>{p.nom}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={labelMini}>Série</label>
                      <select value={auditForm.serieId} onChange={e => setAuditForm(p => ({ ...p, serieId: e.target.value }))} style={inputMini} disabled={!auditForm.projetId || loadingSeries}>
                        <option value="">{loadingSeries ? 'Chargement...' : '-- Choisir --'}</option>
                        {seriesByProject.map(s => <option key={s.id} value={s.id}>{s.nom || s.code || `Série ${s.id}`}</option>)}
                      </select>
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <label style={labelMini}>Projet</label>
                      <input value={auditForm.projetNomFixe} readOnly style={{ ...inputMini, background: T.g100, color: T.g700, cursor: 'default' }} />
                    </div>
                    <div>
                      <label style={labelMini}>Série</label>
                      <input value={auditForm.serieNomFixe} readOnly style={{ ...inputMini, background: T.g100, color: T.g700, cursor: 'default' }} />
                    </div>
                  </>
                )}

                <div>
                  <label style={labelMini}>Nature</label>
                  <select value={auditForm.natureAudit} onChange={e => setAuditForm(p => ({ ...p, natureAudit: e.target.value }))} style={inputMini}>
                    <option value="NON_DESTRUCTIF">Non-Destructif (ND)</option>
                    <option value="DESTRUCTIF">Destructif (D)</option>
                    <option value="REQUALIFICATION">Requalification (R)</option>
                  </select>
                </div>
                <div>
                  <label style={labelMini}>Date prévue *</label>
                  <input type="date" value={auditForm.datePrevue} onChange={e => setAuditForm(p => ({ ...p, datePrevue: e.target.value }))} style={inputMini} />
                </div>
                <div>
                  <label style={labelMini}>Deadline</label>
                  <input type="date" value={auditForm.deadline} onChange={e => setAuditForm(p => ({ ...p, deadline: e.target.value }))} style={inputMini} />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={labelMini}>Description / Remarque</label>
                  <textarea value={auditForm.observations} onChange={e => setAuditForm(p => ({ ...p, observations: e.target.value }))} style={{ ...inputMini, minHeight: 72, resize: 'vertical' }} placeholder="Observations (optionnel)" />
                </div>
              </div>

              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 16 }}>
                <Btn small variant="secondary" onClick={() => setAuditForm(null)}>Annuler</Btn>
                <Btn small onClick={submitAudit} disabled={savingAudit}>
                  {savingAudit ? 'Enregistrement...' : auditForm.mode === 'create' ? "+ Créer l'audit" : '✓ Enregistrer'}
                </Btn>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const btnBack = {
  background: 'none', border: 'none', color: T.blueM, cursor: 'pointer',
  fontSize: '.82rem', fontWeight: 600, padding: '0 0 16px', display: 'block',
  fontFamily: 'inherit', marginTop: -10,
};
const overlay = {
  position: 'fixed', inset: 0, background: 'rgba(0,28,60,.5)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  zIndex: 1100, backdropFilter: 'blur(5px)',
};
const labelMini = {
  display: 'block', fontSize: '.7rem', fontWeight: 700, color: T.g500,
  marginBottom: 6, textTransform: 'uppercase', letterSpacing: '.06em',
};
const inputMini = {
  width: '100%', padding: '8px 10px', border: '1.5px solid #DAE2EF',
  borderRadius: 8, fontSize: '.82rem', fontFamily: 'inherit',
  boxSizing: 'border-box', background: '#FAFBFF',
};

// ══════════════════════════════════════════════════════════════
// PAGE PRINCIPALE — liste des planifications créées par l'auditeur
// ══════════════════════════════════════════════════════════════
export default function AuditeurSuiviPlanification() {
  const [planifications, setPlanifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [filter, setFilter] = useState('TOUS');
  const [search, setSearch] = useState('');
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();

  const load = () => {
    setLoading(true);
    fetch(`${API_BASE}/api/planification/mes-planifications-creees`, { headers: apiH() })
      .then(r => r.json())
      .then(data => setPlanifications(Array.isArray(data) ? data : []))
      .catch(() => setPlanifications([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const fetchPlanifDetail = async (planifId) => {
    try {
      const [planifRes, auditsRes] = await Promise.all([
        fetch(`${API_BASE}/api/planification/${planifId}`, { headers: apiH() }),
        fetch(`${API_BASE}/api/audits?planificationId=${planifId}`, { headers: apiH() }),
      ]);
      if (!planifRes.ok) throw new Error(await planifRes.text());
      const planifData = await planifRes.json();
      let auditsData = [];
      if (auditsRes.ok) {
        const raw = await auditsRes.json();
        auditsData = Array.isArray(raw) ? raw : [];
      }
      setSelected({ ...planifData, audits: auditsData });
    } catch (e) { alert('Erreur chargement planification : ' + e.message); }
  };

  useEffect(() => {
    const planifId = searchParams.get('planifId');
    if (!planifId) return;
    fetchPlanifDetail(planifId);
  }, [searchParams]);

  const deletePlanif = async (id) => {
    if (!window.confirm('Supprimer ce brouillon ? Cette action est irréversible.')) return;
    try {
      const res = await fetch(`${API_BASE}/api/planification/${id}`, { method: 'DELETE', headers: apiH() });
      if (!res.ok) { alert('Impossible de supprimer : ' + await res.text()); return; }
      setPlanifications(prev => prev.filter(p => p.id !== id));
    } catch (e) { alert('Erreur : ' + e.message); }
  };

  const countForStatus = (statusKey) => planifications.filter(p => {
    const total = p.nombreAuditsTotal ?? 0;
    const termines = p.nombreAuditsTermines ?? 0;
    const pStatut = (total > 0 && termines === total) ? 'TERMINEE' : mapStatut(p.statut);
    if (statusKey === 'TOUS') return true;
    return pStatut === statusKey;
  }).length;

  const filtered = planifications.filter(p => {
    const total = p.nombreAuditsTotal ?? 0;
    const termines = p.nombreAuditsTermines ?? 0;
    const pStatut = (total > 0 && termines === total) ? 'TERMINEE' : mapStatut(p.statut);
    if (filter !== 'TOUS' && pStatut !== filter) return false;
    const txt = search.trim().toLowerCase();
    if (txt && !(p.nom || '').toLowerCase().includes(txt)) return false;
    return true;
  });

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 400 }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 40, height: 40, border: `3px solid ${T.g100}`, borderTopColor: T.navy, borderRadius: '50%', animation: 'spin .8s linear infinite', margin: '0 auto 12px' }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        <p style={{ color: T.g400, fontSize: '.86rem' }}>Chargement de votre suivi...</p>
      </div>
    </div>
  );

  if (selected) return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", padding: '2rem', background: '#ffffff', minHeight: '100vh' }}>
      <DetailSuivi planif={selected} currentUser={user} onBack={() => setSelected(null)} onUpdate={load} />
    </div>
  );

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", padding: '2rem', background: '#ffffff', minHeight: '100vh' }}>
      <button onClick={() => navigate('/auditeur/planning')} style={btnBack}>← Retour au planning</button>

      <div style={{ marginBottom: 18 }}>
        <h1 style={{ fontSize: '1.3rem', fontWeight: 900, color: T.navy, margin: '0 0 4px' }}>Mon suivi de planification</h1>
        <p style={{ margin: 0, fontSize: '.82rem', color: T.g400 }}>Uniquement les planifications que vous avez créées vous-même.</p>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
        {['TOUS', 'EN_COURS', 'TERMINEE', 'BROUILLON', 'ANNULEE'].map(s => {
          const active = filter === s;
          const cfg = s === 'TOUS' ? { label: 'Toutes' } : { label: STATUT_CFG[s]?.label || s };
          return (
            <button key={s} onClick={() => setFilter(s)} style={{
              padding: '7px 16px', borderRadius: 99, cursor: 'pointer', fontSize: '.76rem',
              fontWeight: 700, fontFamily: 'inherit', transition: 'all .2s',
              border: active ? 'none' : '1.5px solid #BCC8DC',
              background: active ? T.navy : T.g100,
              color: active ? '#fff' : T.g500,
            }}>
              {cfg.label}<span style={{ marginLeft: 6, fontWeight: 900 }}>{countForStatus(s)}</span>
            </button>
          );
        })}
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher par nom..."
          style={{ flex: 1, minWidth: 220, padding: '9px 12px', borderRadius: 10, border: '1.5px solid #767d8987', fontFamily: 'inherit', fontSize: '.85rem' }} />
        <span style={{ fontSize: '.75rem', color: T.g400, alignSelf: 'center' }}>{filtered.length} planification(s)</span>
      </div>

      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: T.g300, fontSize: '.9rem' }}>
          Vous n'avez encore créé aucune planification.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(340px,1fr))', gap: 16 }}>
          {filtered.map(p => (
            <PlanifCard key={p.id} planif={p} navigate={navigate} onDelete={deletePlanif}
              onSelect={(planif) => fetchPlanifDetail(planif.id)} />
          ))}
        </div>
      )}
    </div>
  );
}