// ═══════════════════════════════════════════════════════════════
// ListeAuditsPage.jsx — Liste des audits (partagée tous rôles)
// Props optionnelles : type="AUDIT_PRODUIT" pour filtrer par type
// Accès : Chef (/chef-service/audits), Expert (/expert/audits),
//         Auditeur (/auditeur/audits), Responsable (/responsable/audits)
// ═══════════════════════════════════════════════════════════════
import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { auditAPI } from '../../services/auditAPI';
import styles from '../Audit.module.css';

// ── Icônes SVG inline ─────────────────────────────────────────
const IC = {
  plus:   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  eye:    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>,
  play:   <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="5 3 19 12 5 21 5 3"/></svg>,
  edit:   <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4z"/></svg>,
  search: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  alert:  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
  filter: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>,
  cal:    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  tool:   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>,
  store:  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
  down:   <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>,
};

// ── Configs statiques ─────────────────────────────────────────
const STATUT_CFG = {
  PLANIFIE:  { label: 'Planifié',  cl: 'badgePlanifie'  },
  EN_COURS:  { label: 'En cours',  cl: 'badgeEnCours'   },
  TERMINE:   { label: 'Terminé',   cl: 'badgeTermine'   },
  ANNULE:    { label: 'Annulé',    cl: 'badgeAnnule'    },
  EN_RETARD: { label: 'En retard', cl: 'badgeEnRetard'  },
};
const TYPE_CFG = {
  AUDIT_PRODUIT:        { label: 'Audit Produit',  cl: 'badgeProduit', icon: null },
  AUDIT_REGLES_PLATES:  { label: 'Règles Plates',  cl: 'badgeRegle',   icon: IC.tool  },
  AUDIT_MAGASIN_EXPORT: { label: 'Magasin Export', cl: 'badgeMagasin', icon: IC.store },
};
const NATURE_CFG = {
  DESTRUCTIF:     { label: 'D',  cl: 'badgeDestructif' },
  NON_DESTRUCTIF: { label: 'ND', cl: 'badgeNonDestr'   },
};

// Préfixe route selon rôle
const ROUTE_PREFIX = {
  AUDITEUR:                     'auditeur',
  CHEF_SERVICE:                 'chef-service',
  EXPERT_PRODUCT_AUDIT:         'expert',
  RESPONSABLE_QUALITE_CENTRALE: 'responsable',
  ADMIN:                        'admin',
};

const TABS_STATUT = [
  { key: 'TOUS',      label: 'Tous'      },
  { key: 'PLANIFIE',  label: 'Planifiés' },
  { key: 'EN_COURS',  label: 'En cours'  },
  { key: 'TERMINE',   label: 'Terminés'  },
  { key: 'EN_RETARD', label: 'En retard' },
  { key: 'ANNULE',    label: 'Annulés'   },
];
const TABS_TYPE = [
  { key: 'TOUS',                label: 'Tous types'     },
  { key: 'AUDIT_PRODUIT',       label: 'Audit Produit'  },
  { key: 'AUDIT_REGLES_PLATES', label: 'Règles Plates'  },
  { key: 'AUDIT_MAGASIN_EXPORT',label: 'Magasin Export' },
];

// ── Composant Badge ───────────────────────────────────────────
function Badge({ cfg, children }) {
  if (!cfg) return null;
  const map = {
    badgePlanifie:  { bg: '#EFF6FF', color: '#0057B8' },
    badgeEnCours:   { bg: '#FFF4D6', color: '#C8982A' },
    badgeTermine:   { bg: '#E6F5EE', color: '#1A7A4A' },
    badgeAnnule:    { bg: '#F3F4F6', color: '#6B7280' },
    badgeEnRetard:  { bg: '#FDECEA', color: '#C0392B' },
    badgeProduit:   { bg: '#EDE9FE', color: '#6D28D9' },
    badgeRegle:     { bg: '#DCFCE7', color: '#16A34A' },
    badgeMagasin:   { bg: '#FEF3C7', color: '#D97706' },
    badgeDestructif:{ bg: '#FEE2E2', color: '#DC2626' },
    badgeNonDestr:  { bg: '#DCFCE7', color: '#16A34A' },
  };
  const s = map[cfg.cl] || { bg: '#F3F4F6', color: '#6B7280' };
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '2px 8px', borderRadius: 999,
      background: s.bg, color: s.color,
      fontSize: '.71rem', fontWeight: 700, whiteSpace: 'nowrap',
    }}>
      {children || cfg.label}
    </span>
  );
}

// ── QK Badge ─────────────────────────────────────────────────
function QkBadge({ qk }) {
  if (qk == null) return <span style={{ color: 'var(--gray-300)', fontSize: '.78rem' }}>—</span>;
  let color, bg;
  if (qk === 0) {
    color = '#059669';
    bg = '#ECFDF5';
  } else if (qk <= 0.5) {
    color = '#C8982A';
    bg = '#FFFBEB';
  } else if (qk <= 1.0) {
    color = '#9D174D';
    bg = '#FDF2F8';
  } else {
    color = '#DC2626';
    bg = '#FEF2F2';
  }
  return (
    <span style={{ background: bg, color, borderRadius: 8, padding: '3px 8px',
      fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '.88rem' }}>
      {qk.toFixed(1)}
    </span>
  );
}

// ═══════════════════════════════════════════════════════════════
// COMPOSANT PRINCIPAL
// ═══════════════════════════════════════════════════════════════
export default function ListeAuditsPage({ type: typeProp }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const role   = user?.role || 'AUDITEUR';
  const prefix = ROUTE_PREFIX[role] || 'auditeur';

  const isAuditeur    = role === 'AUDITEUR';
  const isChef        = role === 'CHEF_SERVICE';
  const isExpert      = role === 'EXPERT_PRODUCT_AUDIT';
  const isResponsable = role === 'RESPONSABLE_QUALITE_CENTRALE';

  // ── State ─────────────────────────────────────────────────
  const [audits,  setAudits]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast,   setToast]   = useState(null);

  // Filtres
  const [tabStatut, setTabStatut] = useState(searchParams.get('statut') || 'TOUS');
  const [tabType,   setTabType]   = useState(typeProp || 'TOUS');
  const [search,    setSearch]    = useState('');
  const [domaine,   setDomaine]   = useState('');
  const isReglesPlatesView = typeProp === 'AUDIT_REGLES_PLATES' || tabType === 'AUDIT_REGLES_PLATES';
  const isMagasinExportView = typeProp === 'AUDIT_MAGASIN_EXPORT' || tabType === 'AUDIT_MAGASIN_EXPORT';
  const hideNatureColumn = isReglesPlatesView || isMagasinExportView;
  const hideFamilleColumn = isReglesPlatesView;

  // ── Chargement ────────────────────────────────────────────
  useEffect(() => {
    const fn = isAuditeur
      ? auditAPI.getMesAudits()
      : auditAPI.getAll();

    fn.then(r => setAudits(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [isAuditeur]);

  // ── Filtrage ──────────────────────────────────────────────
  const filtered = audits.filter(a => {
    if (tabStatut !== 'TOUS' && a.statut !== tabStatut) return false;
    if (tabType   !== 'TOUS' && a.typeAudit !== tabType) return false;
    if (domaine && a.domaine !== domaine) return false;
    const q = search.toLowerCase();
    if (!q) return true;
    return (
      a.reference?.toLowerCase().includes(q) ||
      a.familleCablage?.toLowerCase().includes(q) ||
      a.auditeurNom?.toLowerCase().includes(q) ||
      a.plantNom?.toLowerCase().includes(q) ||
      a.siteNom?.toLowerCase().includes(q) ||
      a.domaine?.toLowerCase().includes(q) ||
      a.zoneExpedition?.toLowerCase().includes(q)
    );
  });

  const count = (key, field = 'statut') =>
    key === 'TOUS' ? audits.length : audits.filter(a => a[field] === key).length;

  const tableColumns = [
    { f: 'reference',   l: 'Référence' },
    { f: 'typeAudit',   l: 'Type' },
    ...(hideNatureColumn ? [] : [
      { f: 'natureAudit', l: 'Nature' },
    ]),
    ...(hideFamilleColumn ? [] : [
      { f: 'zone',        l: 'Famille / Zone' },
    ]),
    { f: 'datePrevue',  l: 'Date prévue' },
    { f: 'plantNom',    l: 'Plant' },
    { f: 'auditeurNom', l: 'Auditeur' },
    { f: 'statut',      l: 'Statut' },
    { f: null,          l: 'Actions' },
  ];

  // ── Actions ───────────────────────────────────────────────
  const handleDemarrer = async (id, e) => {
    e.stopPropagation();
    try {
      await auditAPI.demarrer(id);
      setAudits(prev => prev.map(a => a.id === id ? { ...a, statut: 'EN_COURS' } : a));
      showToast('Audit démarré !', 'success');
    } catch {
      showToast('Erreur lors du démarrage', 'error');
    }
  };

  const showToast = (msg, type = 'info') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const goDetail = (a) => navigate(`/${prefix}/audits/${a.id}`);
  const goSaisir = (a, e) => { e.stopPropagation(); navigate(`/${prefix}/audits/${a.id}/saisir`); };

  // ── Titre page selon rôle/type ────────────────────────────
  const pageTitle = typeProp
    ? TYPE_CFG[typeProp]?.label || 'Audits'
    : 'Tous les audits';

  const domaines = [...new Set(audits.map(a => a.domaine).filter(Boolean))];

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', padding:'4rem', gap:'.75rem', color:'var(--gray-400)' }}>
      <div style={{ width:24, height:24, border:'3px solid var(--gray-200)', borderTopColor:'var(--leoni-navy)', borderRadius:'50%', animation:'spin .7s linear infinite' }} />
      Chargement des audits…
    </div>
  );
  return (
    <div style={{ padding: '2rem', maxWidth: 1400, animation: 'fadeUp .4s ease both' }}>

      {/* ── HEADER ────────────────────────────────────────── */}
      <div style={{ display:'flex', justifyContent:'flex-end', marginBottom:'1.5rem' }} />

      {/* ── KPI RAPIDES ───────────────────────────────────── */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(6, minmax(0, 1fr))', gap:'.75rem', marginBottom:'1.25rem' }}>
        {[
          { l:'Total',         v: audits.length,                c:'#002855' },
          { l:'Planifiés',     v: count('PLANIFIE'),           c:'#0057B8' },
          { l:'En cours',      v: count('EN_COURS'),           c:'#C8982A' },
          { l:'Terminés',      v: count('TERMINE'),            c:'#1A7A4A' },
          { l:'En retard',     v: count('EN_RETARD'),          c:'#C0392B' },
          { l:'QK dépassés',   v: audits.filter(a => a.qkDepasseSeuil).length, c:'#7C3AED' },
        ].map((k, i) => (
          <div key={i} style={{ background:'#fff', borderRadius:14, padding:'.9rem 1rem', border:'1px solid var(--gray-100)', borderTop:`3px solid ${k.c}`, boxShadow:'var(--shadow-sm)' }}>
            <div style={{ fontFamily:'var(--font-display)', fontSize:'1.9rem', fontWeight:900, color:k.c, lineHeight:1 }}>{k.v}</div>
            <div style={{ fontSize:'.75rem', fontWeight:700, color:'var(--gray-500)', marginTop:3 }}>{k.l}</div>
          </div>
        ))}
      </div>

      {/* ── CARD TABLEAU ──────────────────────────────────── */}
      <div style={{ background:'#fff', borderRadius:16, border:'1px solid var(--gray-100)', boxShadow:'var(--shadow-sm)', overflow:'hidden' }}>

        {/* Filtres ligne 1 : statuts */}
        <div style={{ display:'flex', gap:'.5rem', padding:'.85rem 1.25rem', borderBottom:'1px solid var(--gray-100)', flexWrap:'wrap', alignItems:'center', background:'var(--gray-50)' }}>
          <span style={{ fontSize:'.72rem', fontWeight:700, color:'var(--gray-400)', textTransform:'uppercase', letterSpacing:'.05em', marginRight:'.25rem' }}>Statut</span>
          {TABS_STATUT.map(t => (
            <button key={t.key}
              onClick={() => setTabStatut(t.key)}
              style={{ padding:'.3rem .8rem', borderRadius:999, fontSize:'.76rem', fontWeight:600, cursor:'pointer', border:'none', background: tabStatut === t.key ? 'var(--leoni-navy)' : 'transparent', color: tabStatut === t.key ? '#fff' : 'var(--gray-500)', transition:'all .12s' }}>
              {t.label}
              {count(t.key) > 0 && (
                <span style={{ marginLeft:5, background: tabStatut===t.key ? 'rgba(255,255,255,.25)' : 'var(--gray-200)', borderRadius:999, padding:'1px 5px', fontSize:'.66rem' }}>
                  {count(t.key)}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Filtres ligne 2 : type + search */}
        <div style={{ display:'flex', gap:'.75rem', padding:'.75rem 1.25rem', borderBottom:'1px solid var(--gray-100)', flexWrap:'wrap', alignItems:'center' }}>
          {TABS_TYPE.map(t => (
            <button key={t.key}
              onClick={() => setTabType(t.key)}
              style={{ padding:'.28rem .75rem', borderRadius:999, fontSize:'.74rem', fontWeight:600, cursor:'pointer', border:'1.5px solid', borderColor: tabType===t.key ? 'var(--leoni-navy)' : 'var(--gray-200)', background: tabType===t.key ? 'var(--leoni-navy)' : 'transparent', color: tabType===t.key ? '#fff' : 'var(--gray-500)', transition:'all .12s' }}>
              {t.label}
            </button>
          ))}

          <div style={{ marginLeft:'auto', display:'flex', gap:'.6rem', alignItems:'center', flexWrap:'wrap' }}>
            {domaines.length > 0 && (
              <select value={domaine} onChange={e => setDomaine(e.target.value)}
                style={{ padding:'.38rem .7rem', border:'1px solid var(--gray-200)', borderRadius:10, fontSize:'.8rem', color:'var(--gray-700)', background:'#fff', cursor:'pointer', outline:'none' }}>
                <option value="">Tous domaines</option>
                {domaines.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            )}
            <div style={{ display:'flex', alignItems:'center', gap:'.4rem', background:'#fff', border:'1px solid var(--gray-200)', borderRadius:10, padding:'.38rem .7rem', minWidth:200 }}>
              {IC.search}
              <input placeholder="Référence, famille, auditeur…" value={search} onChange={e => setSearch(e.target.value)}
                style={{ border:'none', outline:'none', fontSize:'.8rem', color:'var(--gray-700)', background:'transparent', width:'100%' }} />
            </div>
          </div>
        </div>

        {/* Tableau */}
        <div style={{ overflowX:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'.84rem' }}>
            <thead>
              <tr>
                {tableColumns.map(col => (
                  <th key={col.l} style={{ textAlign:'left', padding:'.65rem 1rem', fontSize:'.69rem', fontWeight:700, textTransform:'uppercase', letterSpacing:'.06em', color:'var(--gray-400)', background:'var(--gray-50)', borderBottom:'1px solid var(--gray-100)', whiteSpace:'nowrap', width: col.l === 'Référence' ? 108 : col.l === 'Actions' ? 124 : 'auto' }}>
                    {col.l}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={11 - (hideNatureColumn ? 1 : 0) - (hideFamilleColumn ? 1 : 0)}>
                  <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'3rem', gap:'.6rem', color:'var(--gray-400)', textAlign:'center' }}>
                    <div style={{ fontSize:'2.5rem' }}>📋</div>
                    <div style={{ fontWeight:700, color:'var(--gray-500)' }}>Aucun audit trouvé</div>
                    <div style={{ fontSize:'.8rem' }}>Modifiez les filtres ou planifiez un nouvel audit</div>
                  </div>
                </td></tr>
              ) : filtered.map(a => {
                const sc = STATUT_CFG[a.statut];
                const tc = TYPE_CFG[a.typeAudit];
                const nc = NATURE_CFG[a.natureAudit];
                const isLate = a.statut === 'EN_RETARD';
                return (
                  <tr key={a.id}
                    style={{ cursor:'pointer', transition:'background .1s' }}
                    onClick={() => goDetail(a)}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--gray-50)'}
                    onMouseLeave={e => e.currentTarget.style.background = ''}>

                    {/* Référence */}
                    <td style={{ padding:'.8rem 1rem', borderBottom:'1px solid var(--gray-100)', width:108, maxWidth:108 }}>
                      <div style={{ display:'flex', alignItems:'center', gap:'.4rem' }}>
                        {isLate && <span style={{ color:'#C0392B' }}>{IC.alert}</span>}
                        <span style={{ fontFamily:'var(--font-display)', fontWeight:800, fontSize:'.92rem', color: isLate ? '#C0392B' : 'var(--leoni-navy)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                          {a.reference}
                        </span>
                      </div>
                    </td>

                    {/* Type */}
                    <td style={{ padding:'.8rem 1rem', borderBottom:'1px solid var(--gray-100)' }}>
                      <Badge cfg={tc}>{tc?.icon} {tc?.label}</Badge>
                    </td>

                    {!hideNatureColumn && (
                      <>
                        {/* Nature */}
                        <td style={{ padding:'.8rem 1rem', borderBottom:'1px solid var(--gray-100)' }}>
                          {nc ? <Badge cfg={nc} /> : <span style={{ color:'var(--gray-300)' }}>—</span>}
                        </td>

                        {/* Famille / Zone */}
                        {!hideFamilleColumn && (
                          <td style={{ padding:'.8rem 1rem', borderBottom:'1px solid var(--gray-100)', color:'var(--gray-600)', maxWidth:140, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                            {a.familleCablage || a.zoneExpedition || '—'}
                          </td>
                        )}
                      </>
                    )}

                    {/* Plant */}
                    <td style={{ padding:'.8rem 1rem', borderBottom:'1px solid var(--gray-100)', color:'var(--gray-600)', fontSize:'.8rem' }}>
                      {a.plantNom || '—'}
                      {a.siteNom && <div style={{ fontSize:'.7rem', color:'var(--gray-400)' }}>{a.siteNom}</div>}
                    </td>

                    {/* Auditeur */}
                    <td style={{ padding:'.8rem 1rem', borderBottom:'1px solid var(--gray-100)', fontSize:'.8rem' }}>
                      {a.auditeurNom
                        ? <span style={{ fontWeight:600 }}>{a.auditeurNom}</span>
                        : <span style={{ color:'var(--gray-400)', fontStyle:'italic' }}>Non assigné</span>}
                    </td>

                    {/* Domaine */}
                    <td style={{ padding:'.8rem 1rem', borderBottom:'1px solid var(--gray-100)' }}>
                      {a.domaine
                        ? <span style={{ background:'var(--leoni-navy)', color:'#fff', borderRadius:5, padding:'2px 7px', fontSize:'.68rem', fontWeight:700 }}>{a.domaine}</span>
                        : <span style={{ color:'var(--gray-300)' }}>—</span>}
                    </td>

                    {/* Date prévue */}
                    <td style={{ padding:'.8rem 1rem', borderBottom:'1px solid var(--gray-100)', fontSize:'.8rem', color: isLate ? '#C0392B' : 'var(--gray-600)', fontWeight: isLate ? 700 : 400, whiteSpace:'nowrap' }}>
                      {a.datePrevue ? new Date(a.datePrevue).toLocaleDateString('fr-FR') : '—'}
                    </td>

                    {/* Statut */}
                    <td style={{ padding:'.8rem 1rem', borderBottom:'1px solid var(--gray-100)' }}>
                      <Badge cfg={sc} />
                    </td>

                    {/* QK */}
                    <td style={{ padding:'.8rem 1rem', borderBottom:'1px solid var(--gray-100)' }}>
                      <QkBadge qk={a.valeurQK} />
                    </td>

                    {/* Actions */}
                    <td style={{ padding:'.8rem 1rem', borderBottom:'1px solid var(--gray-100)' }}
                      onClick={e => e.stopPropagation()}>
                      <div style={{ display:'flex', gap:'.35rem', alignItems:'center' }}>

                        {/* Voir détail — tous les rôles */}
                        <button title="Voir détail"
                          onClick={() => goDetail(a)}
                          style={{ padding:'.35rem .6rem', borderRadius:8, background:'transparent', border:'1px solid var(--gray-200)', cursor:'pointer', color:'var(--gray-500)', display:'flex', alignItems:'center', transition:'all .12s' }}
                          onMouseEnter={e => { e.currentTarget.style.background='var(--gray-100)'; e.currentTarget.style.color='var(--leoni-navy)'; }}
                          onMouseLeave={e => { e.currentTarget.style.background='transparent'; e.currentTarget.style.color='var(--gray-500)'; }}>
                          {IC.eye}
                        </button>

                        {/* Démarrer — auditeur sur PLANIFIE */}
                        {isAuditeur && a.statut === 'PLANIFIE' && (
                          <button title="Démarrer"
                            onClick={e => handleDemarrer(a.id, e)}
                            style={{ padding:'.3rem .65rem', borderRadius:8, background:'var(--leoni-gold)', color:'#fff', border:'none', cursor:'pointer', fontSize:'.72rem', fontWeight:700, display:'flex', alignItems:'center', gap:3 }}>
                            {IC.play} Démarrer
                          </button>
                        )}

                        {/* Saisir résultats — auditeur sur EN_COURS */}
                        {isAuditeur && a.statut === 'EN_COURS' && (
                          <button title="Saisir résultats"
                            onClick={e => goSaisir(a, e)}
                            style={{ padding:'.3rem .65rem', borderRadius:8, background:'var(--leoni-navy)', color:'#fff', border:'none', cursor:'pointer', fontSize:'.72rem', fontWeight:700, display:'flex', alignItems:'center', gap:3 }}>
                            {IC.edit} Saisir
                          </button>
                        )}

                        {/* Planifier — chef / expert sur EN_COURS ou PLANIFIE */}
                        {(isChef || isExpert) && a.statut === 'EN_COURS' && (
                          <button title="Saisir résultats"
                            onClick={e => { e.stopPropagation(); navigate(`/${prefix}/audits/${a.id}/saisir`); }}
                            style={{ padding:'.3rem .65rem', borderRadius:8, background:'var(--leoni-navy)', color:'#fff', border:'none', cursor:'pointer', fontSize:'.72rem', fontWeight:700 }}>
                            {IC.edit} Saisir
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Footer compteur */}
        <div style={{ padding:'.65rem 1.25rem', borderTop:'1px solid var(--gray-100)', background:'var(--gray-50)', fontSize:'.75rem', color:'var(--gray-400)', display:'flex', justifyContent:'space-between' }}>
          <span>{filtered.length} résultat{filtered.length !== 1 ? 's' : ''}</span>
          {filtered.length < audits.length && (
            <button onClick={() => { setTabStatut('TOUS'); setTabType('TOUS'); setSearch(''); setDomaine(''); }}
              style={{ fontSize:'.75rem', color:'var(--leoni-blue-mid)', background:'none', border:'none', cursor:'pointer', fontWeight:600 }}>
              Réinitialiser les filtres
            </button>
          )}
        </div>
      </div>

      {/* ── TOAST ─────────────────────────────────────────── */}
      {toast && (
        <div style={{
          position:'fixed', bottom:'1.5rem', right:'1.5rem',
          display:'flex', alignItems:'center', gap:'.65rem',
          padding:'.85rem 1.25rem', borderRadius:12, fontSize:'.85rem', fontWeight:600,
          boxShadow:'var(--shadow-lg)', zIndex:2000,
          animation:'slideInRight .3s ease',
          background: toast.type === 'success' ? 'var(--success)' : toast.type === 'error' ? 'var(--danger)' : 'var(--leoni-navy)',
          color: '#fff',
        }}>
          {toast.msg}
        </div>
      )}

      <style>{`
        @keyframes fadeUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
        @keyframes slideInRight { from { opacity:0; transform:translateX(30px); } to { opacity:1; transform:translateX(0); } }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
