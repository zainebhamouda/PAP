// ═══════════════════════════════════════════════════════════════
// SuiviAuditsChef.jsx — Suivi & rapports audits (Chef service)
// Design: Luxury industrial — Leoni Wire Harness
// ═══════════════════════════════════════════════════════════════
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auditAPI } from '../../services/auditAPI';
import { adminAPI } from '../../services/api';
import { useAuth, getUserPlantScope } from '../../context/AuthContext';

// ── Palette & tokens ──────────────────────────────────────────
const C = {
  navy:    '#0A1628',
  blue:    '#0057B8',
  blueL:   '#E8F0FB',
  gold:    '#C8982A',
  goldL:   '#FDF6E3',
  green:   '#1A7A4A',
  greenL:  '#E6F4EC',
  red:     '#C0392B',
  redL:    '#FDECEA',
  purple:  '#6D28D9',
  purpleL: '#EDE9FE',
  gray50:  '#F8F9FB',
  gray100: '#EEF0F4',
  gray200: '#D8DCE5',
  gray400: '#9299A8',
  gray600: '#515C6E',
};

const TYPE_META = {
  AUDIT_PRODUIT:        { label: 'Audit Produit',   color: C.purple, bg: C.purpleL, icon: 'ti-package' },
  AUDIT_REGLES_PLATES:  { label: 'Règles Plates',   color: C.green,  bg: C.greenL,  icon: 'ti-ruler' },
  AUDIT_MAGASIN_EXPORT: { label: 'Magasin Export',  color: C.gold,   bg: C.goldL,   icon: 'ti-truck-delivery' },
};

const STATUT_META = {
  PLANIFIE:  { label: 'Planifié',   color: C.blue,   bg: C.blueL  },
  EN_COURS:  { label: 'En cours',   color: C.gold,   bg: C.goldL  },
  TERMINE:   { label: 'Terminé',    color: C.green,  bg: C.greenL },
  EN_RETARD: { label: 'En retard',  color: C.red,    bg: C.redL   },
  ANNULE:    { label: 'Annulé',     color: C.gray400, bg: C.gray100 },
};

// ── Icônes SVG pro (Tabler-like) ──────────────────────────────
const IC = {
  filter:   <i className="ti ti-adjustments-horizontal" style={{fontSize:16}} aria-hidden="true"/>,
  search:   <i className="ti ti-search" style={{fontSize:15}} aria-hidden="true"/>,
  eye:      <i className="ti ti-eye" style={{fontSize:14}} aria-hidden="true"/>,
  report:   <i className="ti ti-file-report" style={{fontSize:14}} aria-hidden="true"/>,
  calendar: <i className="ti ti-calendar-event" style={{fontSize:14}} aria-hidden="true"/>,
  refresh:  <i className="ti ti-refresh" style={{fontSize:14}} aria-hidden="true"/>,
  export:   <i className="ti ti-file-spreadsheet" style={{fontSize:14}} aria-hidden="true"/>,
  chevronD: <i className="ti ti-chevron-down" style={{fontSize:13}} aria-hidden="true"/>,
  chevronR: <i className="ti ti-chevron-right" style={{fontSize:12}} aria-hidden="true"/>,
  check:    <i className="ti ti-circle-check-filled" style={{fontSize:14}} aria-hidden="true"/>,
  clock:    <i className="ti ti-clock" style={{fontSize:14}} aria-hidden="true"/>,
  alert:    <i className="ti ti-alert-triangle" style={{fontSize:14}} aria-hidden="true"/>,
  xmark:    <i className="ti ti-x" style={{fontSize:13}} aria-hidden="true"/>,
  planning: <i className="ti ti-calendar-month" style={{fontSize:14}} aria-hidden="true"/>,
};

// ── Composant Badge statut ────────────────────────────────────
function Badge({ statut }) {
  const m = STATUT_META[statut] || STATUT_META.ANNULE;
  const icons = { PLANIFIE: IC.clock, EN_COURS: IC.clock, TERMINE: IC.check, EN_RETARD: IC.alert, ANNULE: IC.xmark };
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '3px 10px', borderRadius: 999, fontSize: 11, fontWeight: 700,
      letterSpacing: .4, background: m.bg, color: m.color,
      border: `1px solid ${m.color}30`,
    }}>
      <span style={{ color: m.color }}>{icons[statut]}</span>
      {m.label}
    </span>
  );
}

// ── Composant TypeTag ─────────────────────────────────────────
function TypeTag({ type }) {
  const m = TYPE_META[type] || { label: type, color: C.gray600, bg: C.gray100, icon: 'ti-file' };
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600,
      background: m.bg, color: m.color, border: `1px solid ${m.color}20`,
    }}>
      <i className={`ti ${m.icon}`} style={{fontSize:12}} aria-hidden="true"/>
      {m.label}
    </span>
  );
}

// ── Composant KPI Card ────────────────────────────────────────
function KpiCard({ value, label, color, delta, icon }) {
  return (
    <div style={{
      background: '#fff', border: `1px solid ${C.gray100}`,
      borderRadius: 14, padding: '1.1rem 1.4rem',
      borderLeft: `3px solid ${color}`,
      boxShadow: '0 1px 4px rgba(0,0,0,.04)',
      display: 'flex', alignItems: 'flex-start', gap: '1rem',
    }}>
      <div style={{
        width: 40, height: 40, borderRadius: 10, background: color + '14',
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        <i className={`ti ${icon}`} style={{ fontSize: 20, color }} aria-hidden="true"/>
      </div>
      <div>
        <div style={{ fontFamily: '"DM Serif Display", Georgia, serif', fontSize: '1.9rem', fontWeight: 400, color: C.navy, lineHeight: 1 }}>
          {value}
        </div>
        <div style={{ fontSize: 11, fontWeight: 600, color: C.gray400, marginTop: 3, letterSpacing: .3 }}>
          {label.toUpperCase()}
        </div>
        {delta !== undefined && (
          <div style={{ fontSize: 11, color: delta >= 0 ? C.green : C.red, marginTop: 4, fontWeight: 600 }}>
            {delta >= 0 ? '↑' : '↓'} {Math.abs(delta)} ce mois
          </div>
        )}
      </div>
    </div>
  );
}

// ── Composant Progress bar taux conformité ────────────────────
function TauxBar({ value, label }) {
  const color = value >= 80 ? C.green : value >= 60 ? C.gold : C.red;
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: C.gray600 }}>{label}</span>
        <span style={{ fontSize: 12, fontWeight: 700, color }}>{value}%</span>
      </div>
      <div style={{ height: 6, background: C.gray100, borderRadius: 99, overflow: 'hidden' }}>
        <div style={{
          height: '100%', width: `${value}%`,
          background: `linear-gradient(90deg, ${color}CC, ${color})`,
          borderRadius: 99, transition: 'width .6s ease',
        }}/>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
export default function SuiviAuditsChef() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const plantScope = getUserPlantScope(user);
  const lockedPlantId = plantScope.plantId || '';

  // ── État ──────────────────────────────────────────────────
  const [audits,    setAudits]    = useState([]);
  const [plants,    setPlants]    = useState([]);
  const [auditeurs, setAuditeurs] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [toast,     setToast]     = useState(null);

  const [filters, setFilters] = useState({
    search: '', statut: '', typeAudit: '', plantId: '', auditeurId: '', period: '30',
  });
  const [sortField, setSortField] = useState('datePrevue');
  const [sortDir,   setSortDir]   = useState('desc');
  const [page,      setPage]      = useState(1);
  const PER_PAGE = 12;

  // ── Chargement ────────────────────────────────────────────
  useEffect(() => {
    Promise.all([
      auditAPI.getAll(),
      adminAPI.getPlants(),
      adminAPI.getUsers(),
    ]).then(([a, p, u]) => {
      setAudits(a.data);
      setPlants(p.data);
      setAuditeurs(u.data.filter(x => x.role === 'AUDITEUR' && x.actif));
    }).catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (lockedPlantId) {
      setFilters(f => ({ ...f, plantId: lockedPlantId }));
    }
  }, [lockedPlantId]);

  const refresh = () => {
    setLoading(true);
    auditAPI.getAll().then(r => setAudits(r.data)).finally(() => setLoading(false));
    showToast('Données actualisées', 'success');
  };

  const showToast = (msg, type = 'info') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const setFilter = (k, v) => { setFilters(f => ({ ...f, [k]: v })); setPage(1); };

  // ── Filtrage + tri ────────────────────────────────────────
  const now = new Date();
  const filtered = audits
    .filter(a => {
      if (filters.statut    && a.statut    !== filters.statut)    return false;
      if (filters.typeAudit && a.typeAudit !== filters.typeAudit) return false;
      if (filters.plantId   && String(a.plantId) !== filters.plantId) return false;
      if (filters.auditeurId && String(a.auditeurId) !== filters.auditeurId) return false;
      if (filters.search) {
        const q = filters.search.toLowerCase();
        if (!a.reference?.toLowerCase().includes(q) &&
            !a.familleCablage?.toLowerCase().includes(q) &&
            !a.auditeurNom?.toLowerCase().includes(q)) return false;
      }
      if (filters.period) {
        const d = new Date(a.datePrevue);
        const days = parseInt(filters.period);
        const diff = (now - d) / 86400000;
        if (diff > days || diff < -days) return false;
      }
      return true;
    })
    .sort((a, b) => {
      let va = a[sortField] ?? '';
      let vb = b[sortField] ?? '';
      if (va < vb) return sortDir === 'asc' ? -1 : 1;
      if (va > vb) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paginated  = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  // ── KPIs ─────────────────────────────────────────────────
  const kpi = {
    total:     audits.length,
    planifies: audits.filter(a => a.statut === 'PLANIFIE').length,
    enCours:   audits.filter(a => a.statut === 'EN_COURS').length,
    termines:  audits.filter(a => a.statut === 'TERMINE').length,
    retard:    audits.filter(a => a.statut === 'EN_RETARD').length,
    tauxConf:  audits.length ? Math.round(audits.filter(a => a.statut === 'TERMINE').length / audits.length * 100) : 0,
  };

  // ── Tri colonnes ──────────────────────────────────────────
  const toggleSort = field => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('asc'); }
  };
  const sortIcon = field => sortField === field
    ? (sortDir === 'asc' ? ' ↑' : ' ↓') : '';

  // ── Rendu ─────────────────────────────────────────────────
  return (
    <div style={{
      minHeight: '100vh', background: C.gray50,
      fontFamily: '"DM Sans", "Inter", system-ui, sans-serif',
      color: C.navy, padding: '2rem',
    }}>

      {/* ── HEADER ──────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '2rem' }}>
        <div>
         
          <h1 style={{
            fontFamily: '"DM Serif Display", Georgia, serif',
            fontSize: '2.1rem', fontWeight: 400, margin: 0, color: C.navy, lineHeight: 1.15,
          }}>
            Suivi des audits
          </h1>
          <p style={{ fontSize: 13, color: C.gray400, margin: '4px 0 0', fontWeight: 400 }}>
            Tableau de bord qualité — vue consolidée de votre périmètre
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={refresh} style={btnStyle(C.gray200)}>
            {IC.refresh} <span style={{ color: C.gray600 }}>Actualiser</span>
          </button>
          <button style={btnStyle(C.gray200)}>
            {IC.export} <span style={{ color: C.gray600 }}>Exporter</span>
          </button>
        </div>
      </div>

      {/* ── KPI GRID ─────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '.75rem', marginBottom: '1.75rem' }}>
        <KpiCard value={kpi.total}     label="Total audits"  color={C.navy}   icon="ti-clipboard-list"     />
        <KpiCard value={kpi.planifies} label="Planifiés"     color={C.blue}   icon="ti-calendar-event"     delta={2} />
        <KpiCard value={kpi.enCours}   label="En cours"      color={C.gold}   icon="ti-loader"             />
        <KpiCard value={kpi.termines}  label="Terminés"      color={C.green}  icon="ti-circle-check"       delta={5} />
        <KpiCard value={kpi.retard}    label="En retard"     color={C.red}    icon="ti-alert-triangle"     delta={-1} />
      </div>

      {/* ── LIGNE: TAUX CONFORMITÉ + RÉPARTITION TYPE ─────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.75rem', marginBottom: '1.75rem' }}>
        {/* Taux conformité */}
        <div style={cardStyle}>
          <div style={cardHeaderStyle}>
            <span style={cardTitleStyle}>Taux de conformité par type</span>
          </div>
          <div style={{ padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
            <TauxBar value={82} label="Audit Produit" />
            <TauxBar value={95} label="Règles Plates" />
            <TauxBar value={67} label="Magasin Export" />
          </div>
        </div>
        {/* Répartition statuts */}
        <div style={cardStyle}>
          <div style={cardHeaderStyle}>
            <span style={cardTitleStyle}>Répartition des statuts</span>
          </div>
          <div style={{ padding: '1.25rem 1.5rem' }}>
            <div style={{ display: 'flex', gap: '.75rem', flexWrap: 'wrap' }}>
              {Object.entries(STATUT_META).map(([k, m]) => {
                const count = audits.filter(a => a.statut === k).length;
                const pct   = audits.length ? Math.round(count / audits.length * 100) : 0;
                return (
                  <div key={k} style={{
                    flex: '1 1 calc(33% - .75rem)', background: m.bg,
                    borderRadius: 10, padding: '.75rem', border: `1px solid ${m.color}20`,
                  }}>
                    <div style={{ fontSize: '1.35rem', fontFamily: '"DM Serif Display", Georgia, serif', color: m.color }}>{count}</div>
                    <div style={{ fontSize: 11, fontWeight: 600, color: m.color, marginTop: 2 }}>{m.label}</div>
                    <div style={{ height: 3, background: m.color + '30', borderRadius: 99, marginTop: 6 }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: m.color, borderRadius: 99 }}/>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ── FILTRES ──────────────────────────────────────────── */}
      <div style={{ ...cardStyle, marginBottom: '1rem' }}>
        <div style={{ padding: '1rem 1.5rem', display: 'flex', gap: '.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Recherche */}
          <div style={{ position: 'relative', flex: '1 1 220px' }}>
            <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: C.gray400 }}>
              {IC.search}
            </span>
            <input
              style={{ ...inputStyle, paddingLeft: 36 }}
              placeholder="Référence, famille, auditeur…"
              value={filters.search}
              onChange={e => setFilter('search', e.target.value)}
            />
          </div>
          {/* Statut */}
          <select style={selectStyle} value={filters.statut} onChange={e => setFilter('statut', e.target.value)}>
            <option value="">Tous les statuts</option>
            {Object.entries(STATUT_META).map(([k, m]) => <option key={k} value={k}>{m.label}</option>)}
          </select>
          {/* Type */}
          <select style={selectStyle} value={filters.typeAudit} onChange={e => setFilter('typeAudit', e.target.value)}>
            <option value="">Tous les types</option>
            {Object.entries(TYPE_META).map(([k, m]) => <option key={k} value={k}>{m.label}</option>)}
          </select>
          {/* Plant */}
          <select
            style={selectStyle}
            value={lockedPlantId || filters.plantId}
            onChange={e => setFilter('plantId', e.target.value)}
            disabled={!!lockedPlantId}
          >
            {lockedPlantId
              ? <option value={lockedPlantId}>{plantScope.plantNom || plants.find(p => String(p.id) === lockedPlantId)?.nom || 'Plant'}</option>
              : (
                <>
                  <option value="">Tous les plants</option>
                  {plants.map(p => <option key={p.id} value={p.id}>{p.nom}</option>)}
                </>
              )}
          </select>
          {/* Période */}
          <select style={selectStyle} value={filters.period} onChange={e => setFilter('period', e.target.value)}>
            <option value="">Toutes périodes</option>
            <option value="7">7 derniers jours</option>
            <option value="30">30 derniers jours</option>
            <option value="90">90 jours</option>
            <option value="180">6 mois</option>
          </select>
          {/* Reset */}
          {(!lockedPlantId && (filters.search || filters.statut || filters.typeAudit || filters.plantId)) && (
            <button
              onClick={() => setFilters({ search: '', statut: '', typeAudit: '', plantId: '', auditeurId: '', period: '30' })}
              style={{ padding: '7px 12px', borderRadius: 8, border: `1px solid ${C.red}40`, background: C.redL, color: C.red, fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
              {IC.xmark} Réinitialiser
            </button>
          )}
          <span style={{ fontSize: 12, color: C.gray400, marginLeft: 'auto', whiteSpace: 'nowrap' }}>
            <strong style={{ color: C.navy }}>{filtered.length}</strong> résultat{filtered.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* ── TABLEAU ──────────────────────────────────────────── */}
      <div style={cardStyle}>
        {loading ? (
          <div style={{ padding: '4rem', textAlign: 'center', color: C.gray400 }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>⟳</div>
            <div style={{ fontSize: 14 }}>Chargement des données…</div>
          </div>
        ) : paginated.length === 0 ? (
          <div style={{ padding: '4rem', textAlign: 'center' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🔍</div>
            <div style={{ fontSize: 15, fontWeight: 600, color: C.navy }}>Aucun audit trouvé</div>
            <div style={{ fontSize: 13, color: C.gray400, marginTop: 4 }}>Modifiez vos filtres de recherche</div>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: `2px solid ${C.gray100}` }}>
                  {[
                    { f: 'reference',   l: 'Référence' },
                    { f: 'typeAudit',   l: 'Type' },
                    { f: 'datePrevue',  l: 'Date prévue' },
                    { f: 'plantNom',    l: 'Plant' },
                    { f: 'auditeurNom', l: 'Auditeur' },
                    { f: 'statut',      l: 'Statut' },
                    { f: null,          l: 'Actions' },
                  ].map((col, i) => (
                    <th key={i} onClick={col.f ? () => toggleSort(col.f) : undefined}
                      style={{
                        padding: '12px 16px', textAlign: 'left', fontSize: 11,
                        fontWeight: 700, letterSpacing: .8, textTransform: 'uppercase',
                        color: col.f === sortField ? C.blue : C.gray400,
                        cursor: col.f ? 'pointer' : 'default',
                        whiteSpace: 'nowrap', background: C.gray50,
                        userSelect: 'none',
                      }}>
                      {col.l}{col.f ? sortIcon(col.f) : ''}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginated.map((a, i) => (
                  <tr key={a.id}
                    style={{
                      borderBottom: `1px solid ${C.gray100}`,
                      background: i % 2 === 0 ? '#fff' : C.gray50,
                      transition: 'background .12s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = C.blueL + '60'}
                    onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? '#fff' : C.gray50}>
                    {/* Référence */}
                    <td style={{ padding: '13px 16px' }}>
                      <span style={{
                        fontFamily: '"DM Mono", "Courier New", monospace',
                        fontSize: 12, fontWeight: 600, color: C.blue,
                        background: C.blueL, padding: '3px 8px', borderRadius: 6,
                        letterSpacing: .5,
                      }}>
                        {a.reference}
                      </span>
                    </td>
                    {/* Type */}
                    <td style={{ padding: '13px 16px' }}><TypeTag type={a.typeAudit}/></td>
                    {/* Date */}
                    <td style={{ padding: '13px 16px', fontSize: 13, color: C.gray600, whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        <i className="ti ti-calendar" style={{ fontSize: 13, color: C.gray400 }} aria-hidden="true"/>
                        {a.datePrevue ? new Date(a.datePrevue).toLocaleDateString('fr-FR') : '—'}
                      </div>
                    </td>
                    {/* Plant */}
                    <td style={{ padding: '13px 16px', fontSize: 13, fontWeight: 600, color: C.navy }}>
                      {a.plantNom || '—'}
                    </td>
                    {/* Auditeur */}
                    <td style={{ padding: '13px 16px' }}>
                      {a.auditeurNom ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                          <div style={{
                            width: 26, height: 26, borderRadius: '50%',
                            background: C.blue + '20', color: C.blue,
                            fontSize: 10, fontWeight: 700,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}>
                            {a.auditeurNom.split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase()}
                          </div>
                          <span style={{ fontSize: 13, color: C.navy, fontWeight: 500 }}>{a.auditeurNom}</span>
                        </div>
                      ) : (
                        <span style={{ fontSize: 12, color: C.gray400, fontStyle: 'italic' }}>Non assigné</span>
                      )}
                    </td>
                    {/* Statut */}
                    <td style={{ padding: '13px 16px' }}><Badge statut={a.statut}/></td>
                    {/* Actions */}
                    <td style={{ padding: '13px 16px' }}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button
                          title="Voir le détail"
                          onClick={() => navigate(`/chef-service/audits/${a.id}`)}
                          style={actionBtnStyle(C.blue)}>
                          {IC.eye}
                        </button>
                        <button
                          title="Rapport d'audit"
                          onClick={() => navigate(`/chef-service/audits/${a.id}/rapport`)}
                          style={actionBtnStyle(C.green)}>
                          {IC.report}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ── PAGINATION ──────────────────────────────────────── */}
        {totalPages > 1 && (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '1rem 1.5rem', borderTop: `1px solid ${C.gray100}`,
          }}>
            <span style={{ fontSize: 12, color: C.gray400 }}>
              Page <strong style={{ color: C.navy }}>{page}</strong> / {totalPages} —{' '}
              {filtered.length} résultats
            </span>
            <div style={{ display: 'flex', gap: 4 }}>
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)} style={pageBtnStyle(page === 1)}>
                <i className="ti ti-chevron-left" style={{fontSize:14}} aria-hidden="true"/>
              </button>
              {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                const p = i + 1;
                return (
                  <button key={p} onClick={() => setPage(p)}
                    style={pageBtnStyle(false, p === page)}>
                    {p}
                  </button>
                );
              })}
              <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)} style={pageBtnStyle(page === totalPages)}>
                <i className="ti ti-chevron-right" style={{fontSize:14}} aria-hidden="true"/>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── TOAST ────────────────────────────────────────────── */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: 24, right: 24,
          background: toast.type === 'success' ? C.green : toast.type === 'error' ? C.red : C.navy,
          color: '#fff', padding: '12px 20px', borderRadius: 12,
          fontSize: 13, fontWeight: 600,
          boxShadow: '0 8px 24px rgba(0,0,0,.18)',
          display: 'flex', alignItems: 'center', gap: 8,
          zIndex: 9999, animation: 'slideUp .25s ease',
        }}>
          {toast.type === 'success' ? IC.check : IC.alert}
          {toast.msg}
        </div>
      )}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=DM+Sans:wght@400;500;600;700&family=DM+Mono:wght@500&display=swap');
        @import url('https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@3.3.0/dist/tabler-icons.min.css');
        * { box-sizing: border-box; }
        @keyframes slideUp { from { transform: translateY(10px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
      `}</style>
    </div>
  );
}

// ── Helpers styles ────────────────────────────────────────────
const cardStyle = {
  background: '#fff', borderRadius: 14,
  border: '1px solid #EEF0F4',
  boxShadow: '0 1px 4px rgba(0,0,0,.04)',
  overflow: 'hidden',
};
const cardHeaderStyle = {
  padding: '1rem 1.5rem', borderBottom: '1px solid #EEF0F4',
  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
};
const cardTitleStyle = {
  fontSize: 13, fontWeight: 700, color: '#0A1628', letterSpacing: .2,
};
const inputStyle = {
  width: '100%', padding: '8px 12px',
  border: '1px solid #D8DCE5', borderRadius: 8,
  fontSize: 13, color: '#0A1628', background: '#fff',
  outline: 'none', fontFamily: 'inherit',
};
const selectStyle = {
  padding: '8px 32px 8px 12px',
  border: '1px solid #D8DCE5', borderRadius: 8,
  fontSize: 13, color: '#515C6E', background: '#fff',
  outline: 'none', cursor: 'pointer', fontFamily: 'inherit',
  flex: '0 0 auto',
};
const btnStyle = (bg, primary = false) => ({
  display: 'inline-flex', alignItems: 'center', gap: 7,
  padding: '8px 16px', borderRadius: 9,
  border: primary ? 'none' : `1px solid ${bg}`,
  background: primary ? bg : '#fff',
  color: primary ? '#fff' : '#515C6E',
  fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
});
const actionBtnStyle = (color) => ({
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
  width: 30, height: 30, borderRadius: 8, cursor: 'pointer',
  border: `1px solid ${color}25`, background: color + '10',
  color: color, fontSize: 14, transition: 'all .12s',
});
const pageBtnStyle = (disabled, active = false) => ({
  minWidth: 32, height: 32, padding: '0 6px',
  borderRadius: 7, border: active ? 'none' : '1px solid #EEF0F4',
  background: active ? '#0057B8' : disabled ? '#F8F9FB' : '#fff',
  color: active ? '#fff' : disabled ? '#D8DCE5' : '#515C6E',
  fontSize: 12, fontWeight: 600, cursor: disabled ? 'not-allowed' : 'pointer',
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
  fontFamily: 'inherit',
});