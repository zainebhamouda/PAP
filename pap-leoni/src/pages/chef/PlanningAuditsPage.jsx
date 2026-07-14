// ═══════════════════════════════════════════════════════════════
// PlanningCalendrierChef.jsx — Calendrier mensuel (Chef)
// Design: International standard calendar — clean, data-dense
// ═══════════════════════════════════════════════════════════════
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auditAPI } from '../../services/auditAPI';
import { useAuth, getUserPlantScope } from '../../context/AuthContext';

// ── Design tokens ─────────────────────────────────────────────
const T = {
  navy:    '#0A1628',
  blue:    '#0057B8',
  blueL:   '#E8F0FB',
  blueM:   '#B5D4F4',
  gold:    '#C8982A',
  goldL:   '#FDF6E3',
  green:   '#1A7A4A',
  greenL:  '#E6F4EC',
  red:     '#C0392B',
  redL:    '#FDECEA',
  purple:  '#5B21B6',
  purpleL: '#EDE9FE',
  gray50:  '#F8F9FB',
  gray100: '#EEF0F4',
  gray200: '#D8DCE5',
  gray300: '#B0B8C8',
  gray400: '#9299A8',
  gray600: '#515C6E',
};

const MONTHS_FR = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
const DAYS_SHORT = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
const DAYS_LONG  = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];

const TYPE_META = {
  AUDIT_PRODUIT:        { label: 'Audit Produit',  color: T.purple, bg: T.purpleL, dot: '#5B21B6', icon: 'ti-package'         },
  AUDIT_REGLES_PLATES:  { label: 'Règles Plates',  color: T.green,  bg: T.greenL,  dot: '#1A7A4A', icon: 'ti-ruler'           },
  AUDIT_MAGASIN_EXPORT: { label: 'Magasin Export', color: T.gold,   bg: T.goldL,   dot: '#C8982A', icon: 'ti-truck-delivery'  },
};

const STATUT_META = {
  PLANIFIE:  { label: 'Planifié',  color: T.blue,  bg: T.blueL  },
  EN_COURS:  { label: 'En cours',  color: T.gold,  bg: T.goldL  },
  TERMINE:   { label: 'Terminé',   color: T.green, bg: T.greenL },
  EN_RETARD: { label: 'En retard', color: T.red,   bg: T.redL   },
  ANNULE:    { label: 'Annulé',    color: T.gray400, bg: T.gray100 },
};

// ─────────────────────────────────────────────────────────────
export default function PlanningCalendrierChef() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const now      = new Date();
  const plantScope = getUserPlantScope(user);
  const lockedPlantId = plantScope.plantId || '';

  const [annee,     setAnnee]     = useState(now.getFullYear());
  const [mois,      setMois]      = useState(now.getMonth() + 1);
  const [audits,    setAudits]    = useState([]);
  const [typeFilter, setTypeFilter] = useState('');
  const [loading,   setLoading]   = useState(true);
  const [selected,  setSelected]  = useState(null); // { date, audits }
  const [hoveredDay, setHoveredDay] = useState(null);

  useEffect(() => {
    setLoading(true);
    auditAPI.getPlanning(annee, mois, lockedPlantId || undefined)
      .then(r => setAudits(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [annee, mois, lockedPlantId]);

  // ── Navigation mois ───────────────────────────────────────
  const prevMois = () => mois === 1  ? (setAnnee(a => a - 1), setMois(12))  : setMois(m => m - 1);
  const nextMois = () => mois === 12 ? (setAnnee(a => a + 1), setMois(1))   : setMois(m => m + 1);
  const goToday  = () => { setAnnee(now.getFullYear()); setMois(now.getMonth() + 1); };

  // ── Construction grille calendrier (ISO: lundi=0) ─────────
  const buildGrid = () => {
    const premier    = new Date(annee, mois - 1, 1);
    let   startDay   = premier.getDay(); // 0=dim
    startDay = startDay === 0 ? 6 : startDay - 1;
    const nbJours    = new Date(annee, mois, 0).getDate();
    const cells      = [];

    // Jours mois précédent
    for (let i = 0; i < startDay; i++) {
      const d = new Date(annee, mois - 1, -startDay + 1 + i);
      cells.push({ date: d, currentMonth: false });
    }
    // Jours du mois
    for (let j = 1; j <= nbJours; j++)
      cells.push({ date: new Date(annee, mois - 1, j), currentMonth: true });
    // Compléter à 42
    while (cells.length < 42) {
      const last = cells[cells.length - 1].date;
      const d    = new Date(last); d.setDate(d.getDate() + 1);
      cells.push({ date: d, currentMonth: false });
    }
    return cells;
  };

  const cells   = buildGrid();
  const today   = new Date(); today.setHours(0, 0, 0, 0);

  const dateKey = d => d.toISOString().split('T')[0];

  const auditsForDay = date => {
    const key = dateKey(date);
    return audits.filter(a => a.datePrevue === key && (!typeFilter || a.typeAudit === typeFilter));
  };

  const isWeekend = date => date.getDay() === 0 || date.getDay() === 6;

  // ── Statistiques mois ─────────────────────────────────────
  const stats = {
    total:     audits.length,
    planifies: audits.filter(a => a.statut === 'PLANIFIE').length,
    enCours:   audits.filter(a => a.statut === 'EN_COURS').length,
    termines:  audits.filter(a => a.statut === 'TERMINE').length,
    retard:    audits.filter(a => a.statut === 'EN_RETARD').length,
    produit:   audits.filter(a => a.typeAudit === 'AUDIT_PRODUIT').length,
    regles:    audits.filter(a => a.typeAudit === 'AUDIT_REGLES_PLATES').length,
    export_:   audits.filter(a => a.typeAudit === 'AUDIT_MAGASIN_EXPORT').length,
  };

  // ── Ouverture modal journée ───────────────────────────────
  const openDay = (date, dayAudits) => {
    setSelected({ date, audits: dayAudits });
  };

  return (
    <div style={{
      minHeight: '100vh', background: '#ffffff',
      fontFamily: '"DM Sans", "Inter", system-ui, sans-serif',
      color: T.navy, padding: '2rem',
    }}>

      {/* ── HEADER ──────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.75rem' }}>
        <div>
         
          <h1 style={{
            fontFamily: '"DM Serif Display", Georgia, serif',
            fontSize: '2.1rem', fontWeight: 400, marginTop:-25, color: T.navy, lineHeight: 1.15,
          }}>
            Planning des audits
          </h1>
          <p style={{ fontSize: 13, color: T.gray400, margin: '4px 0 0' }}>
            Vue calendrier mensuelle — {MONTHS_FR[mois - 1]} {annee}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <button onClick={() => navigate('/chef-service/audits')} style={outlineBtn}>
            <i className="ti ti-list" style={{fontSize:14}} aria-hidden="true"/>
            Liste des audits
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gap: '1rem' }}>
        <div style={{
          background: '#eef1f5', borderRadius: 18,
          border: '1px solid #1a1a1a',
          boxShadow: '0 2px 12px rgba(0,0,0,.05)',
          padding: '1rem 1.25rem',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem' }}>
              <button onClick={prevMois} style={navBtn} aria-label="Mois précédent">
                <i className="ti ti-chevron-left" style={{fontSize:16}} aria-hidden="true"/>
              </button>
              <div style={{ textAlign: 'center', minWidth: 180 }}>
                <div style={{
                  fontFamily: '"DM Serif Display", Georgia, serif',
                  fontSize: '1.35rem', color: T.navy, fontWeight: 400,
                }}>
                  {MONTHS_FR[mois - 1]}
                </div>
                <div style={{ fontSize: 11, color: T.gray400, fontWeight: 600, letterSpacing: .5 }}>
                  {annee}
                </div>
              </div>
              <button onClick={nextMois} style={navBtn} aria-label="Mois suivant">
                <i className="ti ti-chevron-right" style={{fontSize:16}} aria-hidden="true"/>
              </button>
            </div>

            <div style={{ display: 'flex', gap: '.65rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <button onClick={goToday} style={{ ...outlineBtn, gap: 6 }}>
                <i className="ti ti-calendar-today" style={{fontSize:13}} aria-hidden="true"/>
                Aujourd'hui
              </button>
              <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} style={filterSelect}>
                <option value="">Tous les types</option>
                {Object.entries(TYPE_META).map(([k, m]) => (
                  <option key={k} value={k}>{m.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div style={{
            display: 'flex', gap: '1rem', marginTop: '.9rem', flexWrap: 'wrap',
            borderTop: '1px solid #1a1a1a', paddingTop: '.85rem',
          }}>
            {Object.entries(TYPE_META).map(([k, m]) => (
              <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 7, cursor: 'pointer' }}
                onClick={() => setTypeFilter(typeFilter === k ? '' : k)}>
                <div style={{
                  width: 10, height: 10, borderRadius: 2,
                  background: typeFilter === '' || typeFilter === k ? m.dot : T.gray200,
                  transition: 'background .15s',
                }}/>
                <span style={{
                  fontSize: 11, fontWeight: 600, letterSpacing: .3,
                  color: typeFilter === '' || typeFilter === k ? m.color : T.gray400,
                  transition: 'color .15s',
                }}>
                  {m.label}
                </span>
              </div>
            ))}
            <div style={{ marginLeft: 'auto', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              {Object.entries(STATUT_META).slice(0, 4).map(([k, m]) => (
                <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <div style={{ width: 7, height: 7, borderRadius: '50%', background: m.color }}/>
                  <span style={{ fontSize: 10, color: T.gray400, fontWeight: 600, letterSpacing: .3 }}>{m.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={{
          background: '#eaecf0', borderRadius: 18,
          border: '1px solid #1a1a1a',
          boxShadow: '0 2px 12px rgba(0,0,0,.06)',
          overflow: 'hidden',
        }}>
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)',
            borderBottom: '1px solid #1a1a1a',
          }}>
            {DAYS_SHORT.map((j, i) => (
              <div key={j} style={{
                padding: '12px 0', textAlign: 'center',
                fontSize: 11, fontWeight: 800, letterSpacing: .9,
                color: '#fff',
                textTransform: 'uppercase',
                background: i >= 5 ? '#1d4ed8' : '#2563eb',
                borderRight: i === 6 ? 'none' : '1px solid #1a1a1a',
              }}>
                {j}
              </div>
            ))}
          </div>

          {/* ── Grille calendrier ────────────────────────────── */}
          {loading ? (
            <div style={{ padding: '5rem', textAlign: 'center', color: T.gray400, background: '#eef1f5' }}>
              <i className="ti ti-loader-2 ti-spin" style={{fontSize:28, color: T.blue}} aria-hidden="true"/>
              <div style={{ fontSize: 13, marginTop: 12 }}>Chargement du planning…</div>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', gridAutoRows: '180px' }}>
              {cells.map((cell, i) => {
                const dayAudits = cell.currentMonth ? auditsForDay(cell.date) : [];
                const isToday = cell.date.getTime() === today.getTime();
                const isWeekd = isWeekend(cell.date);
                const isHovered = hoveredDay === i;
                const hasAudits = dayAudits.length > 0;
                const col = i % 7;
                const row = Math.floor(i / 7);
                const isLastCol = col === 6;
                const isLastRow = row === 5;

                return (
                  <div key={i}
                    style={{
                      height: '100%',
                      minWidth: 0,
                      padding: '8px',
                      borderRight: isLastCol ? 'none' : '1px solid #1a1a1a',
                      borderBottom: isLastRow ? 'none' : '1px solid #1a1a1a',
                      background: !cell.currentMonth
                        ? '#cfd4dc'
                        : isToday
                          ? '#eef4fc'
                          : isWeekd
                            ? '#d7dbe3'
                            : isHovered && hasAudits
                              ? '#eef2f8'
                              : '#e5e8ee',
                      cursor: 'pointer',
                      transition: 'background .1s',
                      position: 'relative',
                    }}
                    onClick={() => openDay(cell.date, dayAudits)}
                    onMouseEnter={() => setHoveredDay(i)}
                    onMouseLeave={() => setHoveredDay(null)}>

                    <div style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      marginBottom: 4,
                    }}>
                      <div style={{
                        width: 28, height: 28,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        borderRadius: '50%',
                        background: isToday ? T.blue : 'transparent',
                        fontSize: 12, fontWeight: isToday ? 700 : cell.currentMonth ? 600 : 400,
                        color: isToday ? '#fff'
                          : !cell.currentMonth ? T.gray300
                          : isWeekd ? T.red + 'AA'
                          : T.navy,
                      }}>
                        {cell.date.getDate()}
                      </div>
                      {dayAudits.length > 0 && (
                        <span style={{
                          fontSize: 10, fontWeight: 700, color: T.gray400,
                          background: T.gray100, borderRadius: 99, padding: '1px 6px',
                        }}>
                          {dayAudits.length}
                        </span>
                      )}
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 3, minWidth: 0 }}>
                      {dayAudits.slice(0, 3).map((a, j) => {
                        const tm = TYPE_META[a.typeAudit] || { color: T.gray600, bg: T.gray100 };
                        const sm = STATUT_META[a.statut] || STATUT_META.ANNULE;
                        return (
                          <div key={j}
                            style={{
                              display: 'flex', alignItems: 'center', gap: 4,
                              padding: '3px 6px', borderRadius: 5,
                              background: tm.bg, border: `1px solid ${tm.color}25`,
                              fontSize: 10, fontWeight: 600, lineHeight: 1.3,
                              overflow: 'hidden', cursor: 'pointer',
                              minWidth: 0,
                            }}
                            onClick={e => { e.stopPropagation(); navigate(`/chef-service/audits/${a.id}`); }}
                            title={`${a.reference} — ${a.statut}`}>
                            <div style={{
                              width: 5, height: 5, borderRadius: '50%',
                              background: sm.color, flexShrink: 0,
                            }}/>
                            <span style={{ color: tm.color, minWidth: 0, whiteSpace: 'normal', overflowWrap: 'anywhere' }}>
                              {a.reference}
                            </span>
                            {a.familleCablage && (
                              <span style={{ color: T.gray400, minWidth: 0, whiteSpace: 'normal', overflowWrap: 'anywhere', marginLeft: 2 }}>
                                {a.familleCablage}
                              </span>
                            )}
                          </div>
                        );
                      })}
                      {dayAudits.length > 3 && (
                        <div style={{
                          fontSize: 10, fontWeight: 700, color: T.blue,
                          padding: '2px 6px', borderRadius: 4,
                          background: T.blueL, textAlign: 'center',
                        }}>
                          + {dayAudits.length - 3} autre{dayAudits.length - 3 > 1 ? 's' : ''}
                        </div>
                      )}
                    </div>

                    {!hasAudits && cell.currentMonth && (
                      <div style={{
                        position: 'absolute', inset: 'auto 8px 8px 8px',
                        fontSize: 10, color: T.gray400,
                      }}>
                        Aucun audit
                      </div>
                    )}

                    {isToday && (
                      <div style={{
                        position: 'absolute', top: 0, left: 0, right: 0,
                        height: 2, background: T.blue, borderRadius: '0 0 2px 2px',
                      }}/>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <WeekSummary audits={audits} navigate={navigate} />

      {selected && (
        <div
          style={{
            position: 'fixed', inset: 0, background: 'rgba(10,22,40,.45)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 999, backdropFilter: 'blur(2px)',
          }}
          onClick={() => setSelected(null)}>
          <div
            style={{
              background: '#fff', borderRadius: 18,
              width: '100%', maxWidth: 520, maxHeight: '80vh',
              boxShadow: '0 24px 64px rgba(0,0,0,.22)',
              overflow: 'hidden', display: 'flex', flexDirection: 'column',
            }}
            onClick={e => e.stopPropagation()}>

            <div style={{
              padding: '1.25rem 1.5rem', background: T.navy, color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, opacity: .7, marginBottom: 2 }}>
                  {DAYS_LONG[selected.date.getDay() === 0 ? 6 : selected.date.getDay() - 1].toUpperCase()}
                </div>
                <div style={{ fontFamily: '"DM Serif Display", Georgia, serif', fontSize: '1.3rem' }}>
                  {selected.date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                </div>
                <div style={{ fontSize: 12, opacity: .6, marginTop: 2 }}>
                  {selected.audits.length} audit{selected.audits.length > 1 ? 's' : ''} prévu{selected.audits.length > 1 ? 's' : ''}
                </div>
              </div>
              <button
                onClick={() => setSelected(null)}
                style={{
                  background: 'rgba(255,255,255,.12)', border: 'none',
                  color: '#fff', width: 32, height: 32, borderRadius: 8,
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                <i className="ti ti-x" style={{fontSize:15}} aria-hidden="true"/>
              </button>
            </div>

            <div style={{ overflowY: 'auto', padding: '1.25rem', flex: 1 }}>
              {selected.audits.length === 0 ? (
                <div style={{ padding: '1rem', background: '#f6f7fa', border: '1px solid #d7dbe3', borderRadius: 12, color: T.gray600, fontSize: 13 }}>
                  Aucun audit prévu sur ce jour.
                </div>
              ) : selected.audits.map(a => {
                const tm = TYPE_META[a.typeAudit] || { color: T.gray600, bg: T.gray100, icon: 'ti-file', label: a.typeAudit };
                const sm = STATUT_META[a.statut] || STATUT_META.ANNULE;
                return (
                  <div key={a.id}
                    style={{
                      border: `1.5px solid ${tm.color}25`,
                      borderLeft: `4px solid ${tm.color}`,
                      borderRadius: 12, padding: '1rem 1.1rem',
                      marginBottom: '.75rem', cursor: 'pointer',
                      background: tm.bg + '50', transition: 'transform .1s',
                    }}
                    onClick={() => { setSelected(null); navigate(`/chef-service/audits/${a.id}`); }}
                    onMouseEnter={e => e.currentTarget.style.transform = 'translateX(3px)'}
                    onMouseLeave={e => e.currentTarget.style.transform = 'translateX(0)'}>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <i className={`ti ${tm.icon}`} style={{ fontSize: 15, color: tm.color }} aria-hidden="true"/>
                        <span style={{
                          fontFamily: '"DM Mono", "Courier New", monospace',
                          fontSize: 12, fontWeight: 600, color: tm.color,
                          background: '#fff', padding: '2px 8px', borderRadius: 5,
                          border: `1px solid ${tm.color}30`,
                        }}>
                          {a.reference}
                        </span>
                      </div>
                      <span style={{
                        fontSize: 10, fontWeight: 700, letterSpacing: .4,
                        padding: '3px 9px', borderRadius: 999,
                        background: sm.bg, color: sm.color,
                        border: `1px solid ${sm.color}30`,
                      }}>
                        {sm.label.toUpperCase()}
                      </span>
                    </div>

                    <div style={{ fontSize: 12, color: T.navy, fontWeight: 600, marginBottom: 4 }}>
                      {tm.label}
                      {a.natureAudit && (
                        <span style={{ fontWeight: 400, color: T.gray600 }}> · {a.natureAudit === 'DESTRUCTIF' ? 'Destructif' : 'Non destructif'}</span>
                      )}
                    </div>

                    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                      {a.plantNom && (
                        <span style={{ fontSize: 11, color: T.gray600, display: 'flex', alignItems: 'center', gap: 4 }}>
                          <i className="ti ti-building-factory" style={{fontSize:11, color: T.gray400}} aria-hidden="true"/>
                          {a.plantNom}
                        </span>
                      )}
                      {a.auditeurNom && (
                        <span style={{ fontSize: 11, color: T.gray600, display: 'flex', alignItems: 'center', gap: 4 }}>
                          <i className="ti ti-user" style={{fontSize:11, color: T.gray400}} aria-hidden="true"/>
                          {a.auditeurNom}
                        </span>
                      )}
                      {a.domaine && (
                        <span style={{
                          fontSize: 10, fontWeight: 700, padding: '2px 7px',
                          borderRadius: 4, background: T.navy, color: '#fff',
                        }}>
                          {a.domaine}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=DM+Sans:wght@400;500;600;700&family=DM+Mono:wght@500&display=swap');
        @import url('https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@3.3.0/dist/tabler-icons.min.css');
        * { box-sizing: border-box; }
        .ti-spin { animation: spin 1s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

// ── Composant résumé semaine courante ─────────────────────────
function WeekSummary({ audits, navigate }) {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - (today.getDay() === 0 ? 6 : today.getDay() - 1));
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);

  const weekAudits = audits.filter(a => {
    const d = new Date(a.datePrevue);
    return d >= startOfWeek && d <= endOfWeek;
  });

  if (weekAudits.length === 0) return null;

  return (
    <div style={{ marginTop: '1.5rem' }}>
      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.5, color: T.gray400, textTransform: 'uppercase', marginBottom: '1rem' }}>
        Semaine en cours — {weekAudits.length} audit{weekAudits.length > 1 ? 's' : ''}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '.65rem' }}>
        {weekAudits.map(a => {
          const tm = TYPE_META[a.typeAudit] || { color: T.gray600, bg: T.gray100, icon: 'ti-file', label: '' };
          const sm = STATUT_META[a.statut]  || STATUT_META.ANNULE;
          return (
            <div key={a.id}
              style={{
                background: '#fff', borderRadius: 12, padding: '1rem',
                border: `1px solid ${T.gray100}`, borderLeft: `4px solid ${tm.color}`,
                cursor: 'pointer', transition: 'box-shadow .12s',
              }}
              onClick={() => navigate(`/chef-service/audits/${a.id}`)}
              onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,.08)'}
              onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: T.gray400 }}>
                  {new Date(a.datePrevue).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' }).toUpperCase()}
                </span>
                <span style={{
                  fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 99,
                  background: sm.bg, color: sm.color, border: `1px solid ${sm.color}25`,
                }}>
                  {sm.label}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 5 }}>
                <i className={`ti ${tm.icon}`} style={{ fontSize: 14, color: tm.color }} aria-hidden="true"/>
                <span style={{
                  fontFamily: '"DM Mono", "Courier New", monospace',
                  fontSize: 11, fontWeight: 600, color: tm.color,
                }}>
                  {a.reference}
                </span>
                <span style={{ fontSize: 11, color: T.gray400 }}>—</span>
                <span style={{ fontSize: 11, fontWeight: 600, color: T.navy }}>{tm.label}</span>
              </div>
              {(a.plantNom || a.auditeurNom) && (
                <div style={{ fontSize: 11, color: T.gray600 }}>
                  {a.plantNom && <><i className="ti ti-building-factory" style={{fontSize:11}} aria-hidden="true"/> {a.plantNom}</>}
                  {a.auditeurNom && <span style={{ marginLeft: 8 }}><i className="ti ti-user" style={{fontSize:11}} aria-hidden="true"/> {a.auditeurNom}</span>}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Helpers styles ────────────────────────────────────────────
const T_local = {
  gray100: '#EEF0F4', gray200: '#D8DCE5', gray400: '#9299A8', gray600: '#515C6E',
  blue: '#0057B8', navy: '#0A1628',
};
const navBtn = {
  width: 34, height: 34, border: `1px solid ${T_local.gray200}`,
  borderRadius: 9, background: '#fff', cursor: 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  color: T_local.gray600, transition: 'all .12s',
};
const outlineBtn = {
  display: 'inline-flex', alignItems: 'center', gap: 6,
  padding: '7px 14px', borderRadius: 9,
  border: `1px solid ${T_local.gray200}`, background: '#fff',
  color: T_local.gray600, fontSize: 12, fontWeight: 600, cursor: 'pointer',
  fontFamily: 'inherit',
};
const filterSelect = {
  padding: '7px 12px', borderRadius: 8,
  border: '1px solid #1a1a1a', background: '#eef1f5',
  fontSize: 12, color: T_local.gray600, cursor: 'pointer',
  fontFamily: 'inherit', outline: 'none',
};