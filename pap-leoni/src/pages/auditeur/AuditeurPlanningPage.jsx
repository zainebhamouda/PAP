// AuditeurPlanningPage.jsx — v2 PRO
// - Fetch planifications via /api/planification (toutes du plant)
// - Fetch audits séparément via /api/audits?planificationId=X
// - Calendrier international (Intl.DateTimeFormat)
// - Navigation mois par mois (pas année entière)
// - Panneau gauche : liste planifications (toutes statuts)
// - Panneau droite : calendrier mensuel + liste audits du mois
// ═══════════════════════════════════════════════════════════════════
import { useEffect, useMemo, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

// ── Palette ───────────────────────────────────────────────────────
const C = {
  navy:    '#001E45',
  blue:    '#0057B8',
  blueL:   '#EBF3FF',
  gold:    '#C8982A',
  goldL:   '#FDF6E3',
  green:   '#1A7A4A',
  greenL:  '#E6F4EC',
  red:     '#C0392B',
  redL:    '#FDECEA',
  orange:  '#D97706',
  orangeL: '#FFF7ED',
  gray50:  '#F8F9FB',
  gray100: '#EEF0F4',
  gray200: '#D8DCE5',
  gray400: '#9299A8',
  gray600: '#515C6E',
};

// ── Helpers dates ─────────────────────────────────────────────────
const parseD = (v) => {
  if (!v) return null;
  if (v instanceof Date) return isNaN(v) ? null : v;
  const s = String(v).trim();
  const iso = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (iso) return new Date(+iso[1], +iso[2] - 1, +iso[3]);
  const ym  = s.match(/^(\d{4})-(\d{2})$/);
  if (ym)  return new Date(+ym[1], +ym[2] - 1, 1);
  const fr  = s.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (fr)  return new Date(+fr[3], +fr[2] - 1, +fr[1]);
  const d = new Date(s);
  return isNaN(d) ? null : d;
};

const dKey = (d) => {
  const p = parseD(d);
  if (!p) return '';
  return `${p.getFullYear()}-${String(p.getMonth()+1).padStart(2,'0')}-${String(p.getDate()).padStart(2,'0')}`;
};

const fmtDate = (v, opts = { day:'2-digit', month:'short', year:'numeric' }) => {
  const d = parseD(v);
  if (!d) return '—';
  return new Intl.DateTimeFormat(navigator.language || 'fr-FR', opts).format(d);
};

const monthName = (year, month) =>
  new Intl.DateTimeFormat(navigator.language || 'fr-FR', { month:'long', year:'numeric' })
    .format(new Date(year, month, 1));

// Jours de la semaine (lundi en premier, internationalisation)
const weekDays = () => {
  const base = new Date(2024, 0, 1); // lundi 1er jan 2024
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(base);
    d.setDate(base.getDate() + i);
    return new Intl.DateTimeFormat(navigator.language || 'fr-FR', { weekday: 'short' }).format(d);
  });
};

// Cellules calendrier (lundi = col 0)
const buildCells = (year, month) => {
  const first   = new Date(year, month, 1);
  const startCol = (first.getDay() + 6) % 7; // 0=lun
  const daysInM  = new Date(year, month + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < startCol; i++) {
    const d = new Date(year, month, 1 - startCol + i);
    cells.push({ cur: false, date: d });
  }
  for (let day = 1; day <= daysInM; day++) {
    cells.push({ cur: true, date: new Date(year, month, day) });
  }
  while (cells.length % 7 !== 0) {
    const last = cells[cells.length - 1].date;
    const nxt  = new Date(last); nxt.setDate(last.getDate() + 1);
    cells.push({ cur: false, date: nxt });
  }
  return cells;
};

const todayKey = dKey(new Date());

// ── Config statuts planification ──────────────────────────────────
const PLAN_STAT = {
  BROUILLON:  { label: 'Brouillon',  color: C.gray400,  bg: C.gray100  },
  EN_COURS:   { label: 'En cours',   color: C.blue,     bg: C.blueL    },
  TERMINEE:   { label: 'Terminée',   color: C.green,    bg: C.greenL   },
  LANCE:      { label: 'Lancée',     color: C.blue,     bg: C.blueL    },
  ANNULEE:    { label: 'Annulée',    color: C.red,      bg: C.redL     },
};
const getPlanStat = (s) => PLAN_STAT[(s||'').toUpperCase()] || PLAN_STAT.BROUILLON;

// ── Config statuts audit ──────────────────────────────────────────
const AUDIT_STAT = {
  PLANIFIE:   { label: 'Planifié',  color: C.blue,   bg: C.blueL   },
  EN_COURS:   { label: 'En cours',  color: C.gold,   bg: C.goldL   },
  TERMINE:    { label: 'Terminé',   color: C.green,  bg: C.greenL  },
  EN_RETARD:  { label: 'Retard',    color: C.red,    bg: C.redL    },
  ANNULE:     { label: 'Annulé',    color: C.gray400,bg: C.gray100 },
};
const getAuditStat = (s) => AUDIT_STAT[(s||'').toUpperCase()] || AUDIT_STAT.PLANIFIE;

// ── Composants UI ─────────────────────────────────────────────────
function Badge({ label, color, bg, size = 'sm' }) {
  return (
    <span style={{
      display: 'inline-block',
      background: bg, color,
      fontSize: size === 'xs' ? '.6rem' : '.68rem',
      fontWeight: 800,
      padding: size === 'xs' ? '1px 6px' : '3px 9px',
      borderRadius: 999,
      whiteSpace: 'nowrap',
      letterSpacing: .2,
    }}>{label}</span>
  );
}

function Spinner() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '3rem', gap: 12, color: C.gray400 }}>
      <div style={{ width: 28, height: 28, border: `3px solid ${C.gray200}`, borderTopColor: C.blue, borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
      <span style={{ fontSize: '.9rem', fontWeight: 600 }}>Chargement…</span>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// COMPOSANT PRINCIPAL
// ═══════════════════════════════════════════════════════════════════
export default function AuditeurPlanningPage() {
  const navigate = useNavigate();
  const { user }  = useAuth();
  const token     = localStorage.getItem('token');
  const apiH      = { Authorization: `Bearer ${token}` };

  // ── State ────────────────────────────────────────────────────────
  const [planifications, setPlanifications] = useState([]);
  const [loadingPlanifs, setLoadingPlanifs] = useState(true);
  const [selectedId,     setSelectedId]     = useState(null);
  const [auditsMap,      setAuditsMap]      = useState({}); // planifId → AuditResponse[]
  const [loadingAudits,  setLoadingAudits]  = useState(false);
  const [curYear,        setCurYear]        = useState(new Date().getFullYear());
  const [curMonth,       setCurMonth]       = useState(new Date().getMonth());
  const [search,         setSearch]         = useState('');
  const [statFilter,     setStatFilter]     = useState('TOUS');

  // ── Fetch toutes planifications (plant de l'auditeur) ────────────
  useEffect(() => {
    setLoadingPlanifs(true);
    fetch('http://localhost:8080/api/planification', { headers: apiH })
      .then(r => r.ok ? r.json() : [])
      .then(data => {
        const list = Array.isArray(data) ? data : [];
        // Filtrer par plant de l'auditeur connecté
        const plantId = user?.plantId;
        const filtered = (plantId
          ? list.filter(p =>
              String(p.plantId) === String(plantId) ||
              p.createurId === user?.id
            )
          : list)
          .filter(p => {
            const statut = (p.statut || '').toUpperCase();
            if (statut !== 'BROUILLON') return true;
            return String(p.createurId) === String(user?.id);
          });
        setPlanifications(filtered);
        // Sélectionner automatiquement la première EN_COURS ou LANCE
        const pref = filtered.find(p => ['EN_COURS','LANCE','LANCEE'].includes((p.statut||'').toUpperCase()))
                  || filtered[0];
        if (pref) setSelectedId(pref.id);
      })
      .catch(() => setPlanifications([]))
      .finally(() => setLoadingPlanifs(false));
  }, [user?.plantId, user?.id]);

  // ── Fetch audits quand on sélectionne une planification ──────────
  useEffect(() => {
    if (!selectedId) return;
    if (auditsMap[selectedId]) return; // déjà chargé
    setLoadingAudits(true);
    fetch(`http://localhost:8080/api/audits?planificationId=${selectedId}`, { headers: apiH })
      .then(r => r.ok ? r.json() : [])
      .then(data => {
        setAuditsMap(prev => ({ ...prev, [selectedId]: Array.isArray(data) ? data : [] }));
      })
      .catch(() => setAuditsMap(prev => ({ ...prev, [selectedId]: [] })))
      .finally(() => setLoadingAudits(false));
  }, [selectedId]);

  // ── Navigation mois ───────────────────────────────────────────────
  const prevMonth = () => {
    if (curMonth === 0) { setCurYear(y => y - 1); setCurMonth(11); }
    else setCurMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (curMonth === 11) { setCurYear(y => y + 1); setCurMonth(0); }
    else setCurMonth(m => m + 1);
  };
  const goToday = () => { setCurYear(new Date().getFullYear()); setCurMonth(new Date().getMonth()); };

  // Quand on sélectionne une planification, naviguer vers sa date de début
  const selectPlanif = (planif) => {
    setSelectedId(planif.id);
    const d = parseD(planif.dateDebut) || parseD(planif.dateCreation) || new Date();
    setCurYear(d.getFullYear());
    setCurMonth(d.getMonth());
  };

  // ── Données dérivées ──────────────────────────────────────────────
  const selectedPlanif = useMemo(
    () => planifications.find(p => p.id === selectedId) || null,
    [planifications, selectedId]
  );

  const allAudits = useMemo(
    () => auditsMap[selectedId] || [],
    [auditsMap, selectedId]
  );

  const monthAudits = useMemo(
    () => allAudits.filter(a => {
      const d = parseD(a.datePrevue);
      return d && d.getFullYear() === curYear && d.getMonth() === curMonth;
    }),
    [allAudits, curYear, curMonth]
  );

  const auditsByDate = useMemo(() => {
    const map = new Map();
    monthAudits.forEach(a => {
      const k = dKey(a.datePrevue);
      if (!map.has(k)) map.set(k, []);
      map.get(k).push(a);
    });
    return map;
  }, [monthAudits]);

  const cells     = useMemo(() => buildCells(curYear, curMonth), [curYear, curMonth]);
  const wDays     = useMemo(() => weekDays(), []);

  // ── Filtrage liste planifications (panneau gauche) ────────────────
  const filteredPlanifs = useMemo(() => {
    const q = search.toLowerCase();
    return planifications.filter(p => {
      if (statFilter !== 'TOUS' && (p.statut||'').toUpperCase() !== statFilter) return false;
      if (!q) return true;
      return [p.nom, p.plantNom, p.segmentNom, p.siteNom, p.createurNom]
        .some(v => (v||'').toLowerCase().includes(q));
    });
  }, [planifications, search, statFilter]);

  // ── Stats du mois ─────────────────────────────────────────────────
  const statsMonth = useMemo(() => ({
    total:    monthAudits.length,
    planifie: monthAudits.filter(a => (a.statut||'').toUpperCase() === 'PLANIFIE').length,
    enCours:  monthAudits.filter(a => (a.statut||'').toUpperCase() === 'EN_COURS').length,
    termine:  monthAudits.filter(a => (a.statut||'').toUpperCase() === 'TERMINE').length,
    retard:   monthAudits.filter(a => (a.statut||'').toUpperCase() === 'EN_RETARD').length,
  }), [monthAudits]);

  // ── Render ────────────────────────────────────────────────────────
  return (
    <div style={{ fontFamily: "'Inter','DM Sans',system-ui,sans-serif", background: '#f2f2f4', minHeight: '100vh', padding: '1rem 1.2rem', boxSizing: 'border-box' }}>

      {/* ── Header ── */}
      <div style={{ background: 'linear-gradient(135deg,#001E45 0%,#0057B8 100%)', borderRadius: 18, padding: '1rem 1.2rem', color: '#fff', marginBottom: 10, boxShadow: '0 8px 32px rgba(0,30,69,.25)',marginTop:'-29px'}}>
        <div style={{ fontSize: '.72rem', textTransform: 'uppercase', letterSpacing: '.1em', opacity: .7, fontWeight: 700 }}>Auditeur · Planning</div>
        <h1 style={{ margin: '4px 0 4px', fontSize: '1.6rem', fontWeight: 900, color: C.blue }}>Planning des audits</h1>

      </div>

      {/* ── Layout 2 colonnes ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 18, alignItems: 'start' }}>

        {/* ════════════════════════════════════════════════════════
            PANNEAU GAUCHE — Liste planifications
        ════════════════════════════════════════════════════════ */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

          {/* Recherche + Filtre */}
          <div style={{ background: '#fff', borderRadius: 14, padding: '12px', border: `1px solid ${C.gray200}`, boxShadow: '0 1px 6px rgba(0,0,0,.04)' }}>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher…"
              style={{ width: '100%', border: `1px solid ${C.gray200}`, borderRadius: 9, padding: '9px 12px', fontSize: '.84rem', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box', marginBottom: 8 }}
            />
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {[['TOUS','Tous'],['BROUILLON','Brouillon'],['EN_COURS','En cours'],['LANCE','Lancée'],['TERMINEE','Terminée']].map(([val, lbl]) => (
                <button key={val} onClick={() => setStatFilter(val)} style={{
                  border: 'none', borderRadius: 7, padding: '4px 10px', fontSize: '.72rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                  background: statFilter === val ? C.navy : C.gray100,
                  color:      statFilter === val ? '#fff'  : C.gray600,
                }}>{lbl}</button>
              ))}
            </div>
          </div>

          {/* Liste */}
          {loadingPlanifs ? <Spinner /> : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 'calc(100vh - 260px)', overflowY: 'auto', paddingRight: 2 }}>
              {filteredPlanifs.length === 0 ? (
                <div style={{ background: '#fff', borderRadius: 14, padding: '2rem', textAlign: 'center', color: C.gray400, fontSize: '.86rem', border: `1px dashed ${C.gray200}` }}>
                  Aucune planification trouvée
                </div>
              ) : filteredPlanifs.map(p => {
                const stat   = getPlanStat(p.statut);
                const active = p.id === selectedId;
                return (
                  <div
                    key={p.id}
                    onClick={() => selectPlanif(p)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        selectPlanif(p);
                      }
                    }}
                    style={{
                      background: active ? C.navy  : '#fff',
                      color:      active ? '#fff'  : C.navy,
                      border:     active ? `2px solid ${C.blue}` : `1px solid ${C.gray200}`,
                      borderRadius: 14, padding: '12px 14px', cursor: 'pointer',
                      textAlign: 'left', fontFamily: 'inherit',
                      boxShadow: active ? '0 4px 16px rgba(0,87,184,.2)' : '0 1px 4px rgba(0,0,0,.04)',
                      transition: 'all .18s',
                    }}
                  >
                    {/* Nom */}
                    <div style={{ fontWeight: 800, fontSize: '.87rem', marginBottom: 5, lineHeight: 1.3, color: active ? '#fff' : C.navy }}>
                      {p.nom || `Planification #${p.id}`}
                    </div>

                    {/* Badges */}
                    <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 7 }}>
                      <Badge label={stat.label} color={active ? '#fff' : stat.color} bg={active ? 'rgba(255,255,255,.2)' : stat.bg} size="xs" />
                      {p.segmentNom && <Badge label={p.segmentNom} color={active ? '#fff' : C.blue} bg={active ? 'rgba(255,255,255,.15)' : C.blueL} size="xs" />}
                    </div>

                    {/* Meta */}
                    <div style={{ fontSize: '.71rem', color: active ? 'rgba(255,255,255,.7)' : C.gray400, display: 'flex', flexDirection: 'column', gap: 2 }}>
                      {p.plantNom && <span>🏭 {p.plantNom}</span>}
                      {p.createurNom && <span>👤 Créé par {p.createurNom}</span>}
                      <span>📅 {fmtDate(p.dateDebut)} → {fmtDate(p.dateFin)}</span>
                    </div>

                    {/* Barre de progression */}
                    {(p.nombreAuditsTotal || 0) > 0 && (
                      <div style={{ marginTop: 8 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.67rem', color: active ? 'rgba(255,255,255,.7)' : C.gray400, marginBottom: 3 }}>
                          <span>{p.nombreAuditsTermines || 0} / {p.nombreAuditsTotal} terminés</span>
                          <span>{p.progressionPct || 0}%</span>
                        </div>
                        <div style={{ height: 4, background: active ? 'rgba(255,255,255,.25)' : C.gray200, borderRadius: 99, overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${p.progressionPct || 0}%`, background: active ? '#fff' : C.green, borderRadius: 99, transition: 'width .4s' }} />
                        </div>
                      </div>
                    )}

                    {((p.statut || '').toUpperCase() === 'BROUILLON' && String(p.createurId) === String(user?.id)) && (
                      <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/auditeur/planification?draftId=${p.id}`);
                          }}
                          style={{
                            border: 'none',
                            borderRadius: 8,
                            padding: '6px 10px',
                            background: active ? 'rgba(255,255,255,.16)' : C.blueL,
                            color: active ? '#fff' : C.blue,
                            cursor: 'pointer',
                            fontFamily: 'inherit',
                            fontSize: '.72rem',
                            fontWeight: 800,
                          }}
                        >
                          Continuer
                        </button>
                        <button
                          onClick={async (e) => {
                            e.stopPropagation();
                            if (!window.confirm('Supprimer ce brouillon ?')) return;
                            try {
                              const res = await fetch(`http://localhost:8080/api/planification/${p.id}`, { method: 'DELETE', headers: apiH });
                              if (!res.ok) throw new Error(await res.text());
                              setPlanifications(prev => prev.filter(item => item.id !== p.id));
                              setAuditsMap(prev => {
                                const next = { ...prev };
                                delete next[p.id];
                                return next;
                              });
                              if (selectedId === p.id) {
                                const remaining = planifications.filter(item => item.id !== p.id);
                                const nextSelected = remaining.find(item => ['EN_COURS', 'LANCE', 'LANCEE'].includes((item.statut || '').toUpperCase())) || remaining[0] || null;
                                setSelectedId(nextSelected ? nextSelected.id : null);
                              }
                            } catch {
                              alert('Impossible de supprimer ce brouillon.');
                            }
                          }}
                          style={{
                            border: 'none',
                            borderRadius: 8,
                            padding: '6px 10px',
                            background: active ? 'rgba(255,255,255,.12)' : C.redL,
                            color: active ? '#fff' : C.red,
                            cursor: 'pointer',
                            fontFamily: 'inherit',
                            fontSize: '.72rem',
                            fontWeight: 800,
                          }}
                        >
                          Supprimer
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ════════════════════════════════════════════════════════
            PANNEAU DROIT — Calendrier + Liste audits du mois
        ════════════════════════════════════════════════════════ */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {!selectedPlanif ? (
            <div style={{ background: '#fff', borderRadius: 18, padding: '4rem 2rem', textAlign: 'center', color: C.gray400, border: `1px dashed ${C.gray200}`, fontSize: '.9rem' }}>
              👈 Sélectionnez une planification pour afficher son calendrier
            </div>
          ) : (
            <>
              {/* ── En-tête planification sélectionnée ── */}
              <div style={{ background: '#fff', borderRadius: 18, border: `1px solid ${C.gray200}`, overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,.05)' }}>
                <div style={{ background: 'linear-gradient(135deg,#F0F5FF 0%,#EAF1FF 100%)', padding: '16px 18px', borderBottom: `1px solid ${C.gray200}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 10 }}>
                    <div>
                      <div style={{ fontSize: '.72rem', color: C.blue, fontWeight: 800, textTransform: 'uppercase', letterSpacing: .3, marginBottom: 4 }}>
                        Planification sélectionnée
                      </div>
                      <h2 style={{ margin: '0 0 4px', fontSize: '1.15rem', fontWeight: 900, color: C.navy }}>
                        {selectedPlanif.nom || `#${selectedPlanif.id}`}
                      </h2>
                      <div style={{ fontSize: '.78rem', color: C.gray600, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                        {selectedPlanif.plantNom && <span>🏭 {selectedPlanif.plantNom}</span>}
                        {selectedPlanif.segmentNom && <span>📂 {selectedPlanif.segmentNom}</span>}
                        {selectedPlanif.createurNom && <span>👤 {selectedPlanif.createurNom}</span>}
                        <span>📅 {fmtDate(selectedPlanif.dateDebut)} → {fmtDate(selectedPlanif.dateFin)}</span>
                      </div>
                    </div>
                    <Badge {...getPlanStat(selectedPlanif.statut)} />
                  </div>

                  {/* KPI globaux */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8, marginTop: 14 }}>
                    {[
                      { v: selectedPlanif.nombreAuditsTotal   || 0, l: 'Total',    c: C.navy   },
                      { v: selectedPlanif.nombreAuditsPlanifies|| 0, l: 'Planifiés',c: C.blue   },
                      { v: selectedPlanif.nombreAuditsEnCours  || 0, l: 'En cours', c: C.gold   },
                      { v: selectedPlanif.nombreAuditsTermines || 0, l: 'Terminés', c: C.green  },
                      { v: selectedPlanif.nombreAuditsEnRetard || 0, l: 'Retard',   c: C.red    },
                    ].map(({ v, l, c }) => (
                      <div key={l} style={{ background: '#fff', borderRadius: 10, padding: '8px 10px', border: `1px solid ${C.gray200}`, textAlign: 'center' }}>
                        <div style={{ fontSize: '1.3rem', fontWeight: 900, color: c, lineHeight: 1 }}>{v}</div>
                        <div style={{ fontSize: '.62rem', color: C.gray400, fontWeight: 700, textTransform: 'uppercase', letterSpacing: .3, marginTop: 2 }}>{l}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* ── Navigation mois ── */}
                <div style={{ padding: '14px 18px', borderBottom: `1px solid ${C.gray200}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <button onClick={prevMonth} style={{ width: 36, height: 36, borderRadius: 9, border: `1px solid ${C.gray200}`, background: '#fff', cursor: 'pointer', fontSize: '1rem', fontWeight: 900, color: C.navy, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>‹</button>
                    <span style={{ fontWeight: 900, fontSize: '1.05rem', color: C.navy, minWidth: 200, textAlign: 'center', textTransform: 'capitalize' }}>
                      {monthName(curYear, curMonth)}
                    </span>
                    <button onClick={nextMonth} style={{ width: 36, height: 36, borderRadius: 9, border: `1px solid ${C.gray200}`, background: '#fff', cursor: 'pointer', fontSize: '1rem', fontWeight: 900, color: C.navy, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>›</button>
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    {/* Stats du mois */}
                    {[
                      { v: statsMonth.total,    l: 'ce mois',   c: C.navy  },
                      { v: statsMonth.retard,   l: 'en retard', c: C.red   },
                      { v: statsMonth.termine,  l: 'terminés',  c: C.green },
                    ].map(({ v, l, c }) => (
                      <div key={l} style={{ background: C.gray50, borderRadius: 8, padding: '4px 10px', textAlign: 'center' }}>
                        <span style={{ fontWeight: 900, fontSize: '.9rem', color: c }}>{v}</span>
                        <span style={{ fontSize: '.67rem', color: C.gray400, fontWeight: 600, marginLeft: 4 }}>{l}</span>
                      </div>
                    ))}
                    <button onClick={goToday} style={{ border: `1px solid ${C.blue}`, borderRadius: 9, padding: '6px 14px', background: '#fff', color: C.blue, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 700, fontSize: '.78rem' }}>
                      Aujourd'hui
                    </button>
                  </div>
                </div>

                {/* ── Calendrier mensuel ── */}
                <div style={{ padding: '16px 18px' }}>
                  {loadingAudits ? <Spinner /> : (
                    <>
                      {/* Jours de la semaine */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 6 }}>
                        {wDays.map((d, i) => (
                          <div key={i} style={{ textAlign: 'center', fontSize: '.67rem', fontWeight: 800, color: C.gray400, textTransform: 'uppercase', letterSpacing: .3, padding: '4px 0' }}>
                            {d}
                          </div>
                        ))}
                      </div>

                      {/* Grille jours */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
                        {cells.map((cell, idx) => {
                          const key     = dKey(cell.date);
                          const items   = auditsByDate.get(key) || [];
                          const isToday = key === todayKey;

                          return (
                            <div key={idx} style={{
                              minHeight: 80,
                              borderRadius: 10,
                              border: `1px solid ${isToday ? C.blue : cell.cur ? C.gray200 : '#F0F2F6'}`,
                              background: isToday ? C.blueL : cell.cur ? '#fff' : C.gray50,
                              padding: '5px 5px 4px',
                              opacity: cell.cur ? 1 : 0.45,
                              boxShadow: isToday ? `0 0 0 2px ${C.blue}33 inset` : 'none',
                            }}>
                              {/* Numéro du jour */}
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                                <div style={{
                                  width: 22, height: 22, borderRadius: '50%',
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  fontSize: '.72rem', fontWeight: 900,
                                  background: isToday ? C.blue : 'transparent',
                                  color:      isToday ? '#fff' : cell.cur ? C.navy : C.gray400,
                                }}>
                                  {cell.date.getDate()}
                                </div>
                                {items.length > 0 && (
                                  <span style={{ fontSize: '.58rem', fontWeight: 800, color: C.gray400 }}>{items.length}</span>
                                )}
                              </div>

                              {/* Audits du jour */}
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                                {items.slice(0, 2).map(audit => {
                                  const st = getAuditStat(audit.statut);
                                  return (
                                    <button
                                      key={audit.id}
                                      onClick={() => navigate(`/auditeur/audits/${audit.id}`)}
                                      style={{
                                        border: 'none',
                                        borderLeft: `3px solid ${st.color}`,
                                        borderRadius: 6,
                                        padding: '3px 5px',
                                        background: st.bg,
                                        cursor: 'pointer',
                                        textAlign: 'left',
                                        fontFamily: 'inherit',
                                        width: '100%',
                                      }}
                                    >
                                      <div style={{ fontSize: '.6rem', fontWeight: 800, color: C.navy, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', lineHeight: 1.2 }}>
                                        {audit.reference || audit.serieNom || 'Audit'}
                                      </div>
                                      <div style={{ fontSize: '.57rem', color: st.color, fontWeight: 700, marginTop: 1 }}>
                                        {st.label}
                                      </div>
                                    </button>
                                  );
                                })}
                                {items.length > 2 && (
                                  <div style={{ fontSize: '.58rem', color: C.blue, fontWeight: 700, paddingLeft: 3 }}>
                                    +{items.length - 2} autre{items.length - 2 > 1 ? 's' : ''}
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* ── Liste audits du mois ── */}
              <div style={{ background: '#fff', borderRadius: 18, border: `1px solid ${C.gray200}`, overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,.05)' }}>
                <div style={{ padding: '14px 18px', borderBottom: `1px solid ${C.gray200}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ margin: 0, fontSize: '.95rem', fontWeight: 900, color: C.navy }}>
                    Audits — <span style={{ textTransform: 'capitalize' }}>{monthName(curYear, curMonth)}</span>
                  </h3>
                  <span style={{ fontSize: '.78rem', color: C.gray400, fontWeight: 700 }}>
                    {monthAudits.length} audit{monthAudits.length > 1 ? 's' : ''}
                  </span>
                </div>

                <div style={{ padding: '12px 18px' }}>
                  {loadingAudits ? <Spinner /> : monthAudits.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '2rem', color: C.gray400, background: C.gray50, borderRadius: 12, border: `1px dashed ${C.gray200}`, fontSize: '.86rem' }}>
                      Aucun audit prévu ce mois-ci
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {monthAudits
                        .slice()
                        .sort((a, b) => (parseD(a.datePrevue) || 0) - (parseD(b.datePrevue) || 0))
                        .map(audit => {
                          const st = getAuditStat(audit.statut);
                          return (
                            <button
                              key={audit.id}
                              onClick={() => navigate(`/auditeur/audits/${audit.id}`)}
                              style={{
                                display: 'grid',
                                gridTemplateColumns: '1fr auto auto auto',
                                gap: 12,
                                alignItems: 'center',
                                padding: '11px 14px',
                                borderRadius: 12,
                                border: `1px solid ${C.gray200}`,
                                borderLeft: `4px solid ${st.color}`,
                                background: '#fff',
                                cursor: 'pointer',
                                textAlign: 'left',
                                fontFamily: 'inherit',
                                transition: 'box-shadow .15s',
                              }}
                              onMouseEnter={e => e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,.08)'}
                              onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
                            >
                              {/* Référence + info */}
                              <div style={{ minWidth: 0 }}>
                                <div style={{ fontWeight: 800, color: C.navy, fontSize: '.88rem', marginBottom: 2 }}>
                                  {audit.reference || `Audit #${audit.id}`}
                                </div>
                                <div style={{ fontSize: '.72rem', color: C.gray400 }}>
                                  {[audit.serieNom, audit.projetNom, audit.familleCablage].filter(Boolean).join(' · ') || '—'}
                                </div>
                                {audit.auditeurNom && (
                                  <div style={{ fontSize: '.71rem', color: C.gray600, marginTop: 2 }}>
                                    👤 {audit.auditeurNom}
                                  </div>
                                )}
                              </div>

                              {/* Deadline */}
                              {audit.deadline && (
                                <div style={{ textAlign: 'right', minWidth: 80 }}>
                                  <div style={{ fontSize: '.62rem', color: C.gray400, fontWeight: 700, textTransform: 'uppercase', letterSpacing: .2 }}>Deadline</div>
                                  <div style={{ fontSize: '.78rem', fontWeight: 800, color: C.orange }}>{fmtDate(audit.deadline)}</div>
                                </div>
                              )}

                              {/* Date prévue */}
                              <div style={{ textAlign: 'right', minWidth: 80 }}>
                                <div style={{ fontSize: '.62rem', color: C.gray400, fontWeight: 700, textTransform: 'uppercase', letterSpacing: .2 }}>Prévu le</div>
                                <div style={{ fontSize: '.78rem', fontWeight: 800, color: C.navy }}>{fmtDate(audit.datePrevue)}</div>
                              </div>

                              {/* Statut */}
                              <Badge label={st.label} color={st.color} bg={st.bg} />
                            </button>
                          );
                        })}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
