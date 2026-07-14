/**
 * ClassificationAuditeurs.jsx — Corrigé multi-rôles
 *
 * Routes :
 *   /expert/classement-auditeurs           → rôle EXPERT
 *   /chef-service/classement-certification → rôle CHEF_SERVICE
 *   /responsable/classement-auditeurs      → rôle RESPONSABLE
 *
 * Corrections :
 *  - Détection du rôle via useAuth()
 *  - Endpoints certifications et classement adaptés par rôle
 *  - Filtre site/plant affiché uniquement pour le RESPONSABLE
 */

import { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import { useNavigate } from 'react-router-dom';
import { useAuth, getUserPlantScope } from '../../context/AuthContext';

/* ── Helpers ─────────────────────────────────────────────────── */
const fmt = (n, unit = '%') => (n != null ? `${Math.round(n)}${unit}` : '—');

function computeScore(a) {
  const theoPct = a.scoreTheoriquePct ?? 0;
  const pratPct = a.scorePratique     ?? 0;
  const nbTheo  = a.nbTentativesTheorique ?? 0;
  const nbPrat  = a.nbTentativesPratique  ?? 0;
  const bloque  = !!a.bloque;
  const premier = nbTheo === 1 && nbPrat <= 1;

  const score =
    theoPct * 0.40 +
    pratPct * 0.40 +
    (premier ? 20 : 0) -
    (Math.max(0, nbTheo - 1) * 5) -
    (Math.max(0, nbPrat - 1) * 5) -
    (bloque ? 20 : 0);

  return Math.max(0, Math.min(100, score));
}

function ScoreBar({ value, color, bg }) {
  const pct = Math.min(100, Math.max(0, value ?? 0));
  return (
    <div style={{ height: 6, borderRadius: 99, background: bg || '#E2E8F0', overflow: 'hidden', width: '100%' }}>
      <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 99, transition: 'width .5s cubic-bezier(.4,0,.2,1)' }} />
    </div>
  );
}

const MEDAL = {
  OR:     { icon: '🥇', color: '#D97706', bg: '#FEF3C7', border: '#FDE68A' },
  ARGENT: { icon: '🥈', color: '#64748B', bg: '#F1F5F9', border: '#CBD5E1' },
  BRONZE: { icon: '🥉', color: '#92400E', bg: '#FEF9F0', border: '#FDE68A' },
};

const STATUT_CFG = {
  CERTIFIE:              { label: 'Certifié',           color: '#059669', bg: '#ECFDF5', border: '#A7F3D0' },
  RAPPORT_VALIDE:        { label: 'Rapport validé',     color: '#2563EB', bg: '#EFF6FF', border: '#BFDBFE' },
  PRATIQUE_EN_COURS:     { label: 'Pratique en cours',  color: '#7C3AED', bg: '#F5F3FF', border: '#DDD6FE' },
  PRATIQUE_ECHOUE:       { label: 'Pratique échoué',    color: '#DC2626', bg: '#FEF2F2', border: '#FECACA' },
  THEORIQUE_EN_COURS:    { label: 'Théorique en cours', color: '#0284C7', bg: '#F0F9FF', border: '#BAE6FD' },
  THEORIQUE_ECHOUE:      { label: 'Théorique échoué',   color: '#DC2626', bg: '#FEF2F2', border: '#FECACA' },
  BLOQUE:                { label: 'Bloqué',              color: '#9CA3AF', bg: '#F9FAFB', border: '#E5E7EB' },
  FORMATION_OBLIGATOIRE: { label: 'Formation',          color: '#6D28D9', bg: '#EDE9FE', border: '#C4B5FD' },
};

function StatutBadge({ statut }) {
  const c = STATUT_CFG[statut] || { label: statut, color: '#64748B', bg: '#F8FAFC', border: '#E2E8F0' };
  return (
    <span style={{
      background: c.bg, color: c.color, border: `1px solid ${c.border}`,
      borderRadius: 99, fontSize: '.68rem', fontWeight: 700,
      padding: '2px 10px', whiteSpace: 'nowrap',
    }}>
      {c.label}
    </span>
  );
}

function scoreColor(s) {
  if (s >= 85) return '#059669';
  if (s >= 70) return '#0284C7';
  if (s >= 50) return '#D97706';
  return '#DC2626';
}

function StatCard({ icon, label, value, sub, color }) {
  return (
    <div style={{
      background: '#fff', borderRadius: 14, border: '1.5px solid #E8EDF7',
      padding: '1rem 1.25rem', display: 'flex', flexDirection: 'column', gap: 4,
      boxShadow: '0 1px 4px rgba(0,0,0,.04)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
        <span style={{ fontSize: '1.2rem' }}>{icon}</span>
        <span style={{ fontSize: '.72rem', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '.07em' }}>{label}</span>
      </div>
      <div style={{ fontSize: '1.6rem', fontWeight: 900, color: color || '#0B1E3D', lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: '.75rem', color: '#64748B', fontWeight: 500 }}>{sub}</div>}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   HELPERS RÔLE
════════════════════════════════════════════════════════════════ */

/**
 * Normalise le rôle retourné par useAuth().
 * user.role peut être "ROLE_EXPERT_AUDIT", "EXPERT_AUDIT", "EXPERT", etc.
 */
function detectRole(user) {
  const raw = String(
    user?.role || user?.roles?.[0] || user?.authorities?.[0] || ''
  ).toUpperCase();

  if (raw.includes('RESPONSABLE')) return 'RESPONSABLE';
  if (raw.includes('CHEF'))        return 'CHEF';
  if (raw.includes('EXPERT'))      return 'EXPERT';
  return 'EXPERT'; // fallback
}

/**
 * Endpoint pour récupérer toutes les certifications confirmées selon le rôle.
 */
function getCertifEndpoint(role) {
  if (role === 'CHEF')        return '/chef-service/certifications/all';
  if (role === 'RESPONSABLE') return '/responsable-centrale/certifications/all';
  return '/expert-audit/certifications/all';
}

/**
 * Endpoint pour récupérer le classement d'une certification selon le rôle.
 */
function getClassementEndpoint(role, id) {
  if (role === 'CHEF')        return `/chef-service/certifications/${id}/classement-auditeurs`;
  if (role === 'RESPONSABLE') return `/responsable-centrale/certifications/${id}/classement-auditeurs`;
  return `/expert-audit/certifications/${id}/classement-auditeurs`;
}

/* ════════════════════════════════════════════════════════════════
   COMPOSANT PRINCIPAL
════════════════════════════════════════════════════════════════ */
export default function ClassificationAuditeurs() {
  const navigate    = useNavigate();
  const { user }    = useAuth();
  const role        = detectRole(user); // 'EXPERT' | 'CHEF' | 'RESPONSABLE'
  const plantScope  = getUserPlantScope(user);
  const isResponsable = role === 'RESPONSABLE';
  const hasPlantScope = !isResponsable && (plantScope.plantId || plantScope.plantNom);

  /* ── Données de référence ── */
  const [certifs,         setCertifs]         = useState([]);
  const [sites,           setSites]           = useState([]);
  const [plants,          setPlants]          = useState([]);

  /* ── Sélections ── */
  const [selectedId,      setSelectedId]      = useState(null);
  const [selectedSiteId,  setSelectedSiteId]  = useState('');
  const [selectedPlantId, setSelectedPlantId] = useState('');

  /* ── Données classement ── */
  const [classement,      setClassement]      = useState([]);

  /* ── États UI ── */
  const [loadingCertifs,  setLoadingCertifs]  = useState(true);
  const [loadingClass,    setLoadingClass]    = useState(false);
  const [loadingSites,    setLoadingSites]    = useState(true);
  const [loadingPlants,   setLoadingPlants]   = useState(false);

  /* ── Filtres locaux ── */
  const [searchTerm,      setSearchTerm]      = useState('');
  const [filterStatut,    setFilterStatut]    = useState('TOUS');
  const [sortBy,          setSortBy]          = useState('rang');

  const normalizeText = value => String(value || '').trim().toLowerCase();
  const matchesPlantScope = useCallback((a) => {
    if (!hasPlantScope) return true;

    if (plantScope.plantId) {
      if (!a.plantId) {
        if (!plantScope.plantNom) return false;
      } else if (String(a.plantId) === plantScope.plantId) {
        return true;
      } else {
        return false;
      }
    }

    if (plantScope.plantNom) {
      const rowPlant = normalizeText(a.plantNom);
      const scopePlant = normalizeText(plantScope.plantNom);
      if (!rowPlant) return false;
      return rowPlant.includes(scopePlant);
    }

    return true;
  }, [hasPlantScope, plantScope.plantId, plantScope.plantNom]);

  /* ════════════════════════════════
     CHARGEMENT CERTIFICATIONS
     Endpoint adapté selon le rôle
  ════════════════════════════════ */
  useEffect(() => {
    const endpoint = getCertifEndpoint(role);

    api.get(endpoint)
      .then(r => {
        const confirmed = (r.data || []).filter(c => !c.brouillon);
        setCertifs(confirmed);
        if (confirmed.length > 0) setSelectedId(confirmed[0].id);
      })
      .catch(() => {
        setCertifs([]);
      })
      .finally(() => setLoadingCertifs(false));
  }, [role]);

  /* ════════════════════════════════
     CHARGEMENT SITES
     Uniquement pour RESPONSABLE
  ════════════════════════════════ */
  useEffect(() => {
    // Le chef ne voit pas les filtres site/plant
    if (role !== 'RESPONSABLE') {
      setLoadingSites(false);
      return;
    }

    api.get('/responsable-centrale/sites')
      .then(r => {
        const data = r.data || [];
        const normalized = data.map(s => ({
          id:  s.id,
          nom: s.nom || s.siteNom || s.name || `Site ${s.id}`,
        }));
        setSites(normalized);
      })
      .catch(() => setSites([]))
      .finally(() => setLoadingSites(false));
  }, [role]);

  /* ════════════════════════════════
     CHARGEMENT PLANTS
     Uniquement pour RESPONSABLE, quand un site est sélectionné
  ════════════════════════════════ */
  useEffect(() => {
    setSelectedPlantId('');
    setPlants([]);
    if (!selectedSiteId || role !== 'RESPONSABLE') return;

    setLoadingPlants(true);
    api.get(`/responsable-centrale/sites/${selectedSiteId}/plants`)
      .then(r => {
        const data = r.data || [];
        const normalized = data.map(p => ({
          id:  p.id,
          nom: p.nom || p.plantNom || p.name || `Plant ${p.id}`,
        }));
        setPlants(normalized);
      })
      .catch(() => setPlants([]))
      .finally(() => setLoadingPlants(false));
  }, [selectedSiteId, role]);

  /* ════════════════════════════════
     CHARGEMENT CLASSEMENT
     Endpoint adapté selon le rôle
  ════════════════════════════════ */
  const fetchClassement = useCallback(async (id) => {
    if (!id) return;
    setLoadingClass(true);
    try {
      const endpoint = getClassementEndpoint(role, id);
      const r = await api.get(endpoint);
      const data = (r.data || []).map(a => ({
        ...a,
        scoreComposite: computeScore(a),
      }));
      setClassement(data);
    } catch {
      setClassement([]);
    } finally {
      setLoadingClass(false);
    }
  }, [role]);

  useEffect(() => {
    if (selectedId) fetchClassement(selectedId);
  }, [selectedId, fetchClassement]);

  /* ════════════════════════════════
     FILTRAGE + TRI LOCAL
  ════════════════════════════════ */
  const scopedClassement = classement.filter(matchesPlantScope);

  const filtered = scopedClassement
    .filter(a => {
      if (filterStatut !== 'TOUS' && a.statut !== filterStatut) return false;

      // Filtre site (RESPONSABLE uniquement)
      if (selectedSiteId && isResponsable) {
        if (a.siteId && String(a.siteId) !== String(selectedSiteId)) return false;
        if (!a.siteId && a.siteNom) {
          const siteNom = sites.find(s => String(s.id) === String(selectedSiteId))?.nom;
          if (siteNom && !a.siteNom.toLowerCase().includes(siteNom.toLowerCase())) return false;
        }
      }

      // Filtre plant (RESPONSABLE uniquement)
      if (selectedPlantId && isResponsable) {
        if (a.plantId && String(a.plantId) !== String(selectedPlantId)) return false;
        if (!a.plantId && a.plantNom) {
          const plantNom = plants.find(p => String(p.id) === String(selectedPlantId))?.nom;
          if (plantNom && !a.plantNom.toLowerCase().includes(plantNom.toLowerCase())) return false;
        }
      }

      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        return (
          (a.auditeurNom      || '').toLowerCase().includes(q) ||
          (a.auditeurPrenom   || '').toLowerCase().includes(q) ||
          (a.auditeurMatricule|| '').toLowerCase().includes(q) ||
          (a.siteNom          || '').toLowerCase().includes(q) ||
          (a.plantNom         || '').toLowerCase().includes(q)
        );
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'rang')       return (a.rang ?? 999) - (b.rang ?? 999);
      if (sortBy === 'theo')       return (b.scoreTheoriquePct || 0) - (a.scoreTheoriquePct || 0);
      if (sortBy === 'prat')       return (b.scorePratique     || 0) - (a.scorePratique     || 0);
      if (sortBy === 'tentatives') return (
        (a.nbTentativesTheorique ?? 0) + (a.nbTentativesPratique ?? 0)
      ) - (
        (b.nbTentativesTheorique ?? 0) + (b.nbTentativesPratique ?? 0)
      );
      return 0;
    });

  const filteredRanked = filtered.map((a, idx) => ({
    ...a,
    rangFiltré:     idx + 1,
    medailleFiltré: idx === 0 ? 'OR' : idx === 1 ? 'ARGENT' : idx === 2 ? 'BRONZE' : null,
  }));

  /* Stats synthèse */
  const stats = {
    total:      scopedClassement.length,
    certifies:  scopedClassement.filter(a => a.certifie).length,
    bloques:    scopedClassement.filter(a => a.bloque).length,
    moyTheo:    scopedClassement.length > 0
      ? Math.round(scopedClassement.reduce((s, a) => s + (a.scoreTheoriquePct || 0), 0) / scopedClassement.length)
      : 0,
    moyPrat: (() => {
      const withPrat = scopedClassement.filter(a => a.scorePratique != null);
      return withPrat.length > 0
        ? Math.round(withPrat.reduce((s, a) => s + a.scorePratique, 0) / withPrat.length)
        : null;
    })(),
    premierEssai: scopedClassement.filter(a => a.premierEssai).length,
  };

  const selectedCertif = certifs.find(c => c.id === selectedId);

  const Spinner = () => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '3rem', gap: 12, color: '#94A3B8' }}>
      <span style={{ width: 18, height: 18, border: '2px solid #E2E8F0', borderTopColor: '#0B1E3D', borderRadius: '50%', animation: 'spin .7s linear infinite', display: 'inline-block' }} />
      Chargement du classement…
    </div>
  );

  const selStyle = {
    padding: '7px 10px', border: '1.5px solid #E2E8F0', borderRadius: 9,
    fontSize: '.82rem', fontFamily: 'inherit', color: '#374151',
    background: '#dde0e6', outline: 'none', cursor: 'pointer',
  };

  /* ════════════════════════════════════════════════════════════
     RENDER
  ════════════════════════════════════════════════════════════ */
  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", display: 'flex', flexDirection: 'column', gap: '1.25rem', padding: '1.5rem' }}>
      <style>{`
        @keyframes spin   { to { transform: rotate(360deg) } }
        @keyframes fadeUp { from { opacity:0; transform:translateY(8px) } to { opacity:1; transform:none } }
        @keyframes rowIn  { from { opacity:0; transform:translateX(-5px) } to { opacity:1; transform:none } }
        .cls-row:hover    { background: #F8FAFC !important; }
        .cls-row          { transition: background .12s; }
        .sel-btn          { transition: all .15s; border: none; cursor: pointer; font-family: inherit; }
        .sel-btn:hover    { opacity: .85; }
      `}</style>

      {/* ── En-tête ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <div>
          <h2 style={{ marginTop: -10, fontWeight: 900, fontSize: '1.35rem', color: '#0B1E3D', letterSpacing: '-.02em' }}>
            🏆 Classification des auditeurs
          </h2>
          <p style={{ margin: '4px 0 0', color: '#64748B', fontSize: '.85rem' }}>
            Sélectionnez une qualification
            {isResponsable ? ' · filtrez par site ou plant' : plantScope.plantNom ? ` · plant ${plantScope.plantNom}` : ''}
          </p>
        </div>
        <button
          onClick={() => navigate(-1)}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '10px 20px', background: '#F1F5F9',
            border: '1.5px solid #E2E8F0', borderRadius: 12,
            color: '#374151', fontWeight: 700, fontSize: '.9rem',
            cursor: 'pointer',
          }}
        >
          ← Retour
        </button>
      </div>

      {/* ── Contenu principal ── */}
      {selectedId && (
        <div style={{ animation: 'fadeUp .3s ease' }}>

          {selectedCertif && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '1rem', flexWrap: 'wrap' }}>
              <div style={{ width: 4, height: 28, borderRadius: 99, background: '#0B1E3D' }} />
              <span style={{ fontWeight: 800, fontSize: '1rem', color: '#0B1E3D' }}>{selectedCertif.titre}</span>
              {selectedCertif.actif && (
                <span style={{ background: '#ECFDF5', color: '#059669', border: '1px solid #A7F3D0', borderRadius: 99, padding: '2px 10px', fontSize: '.72rem', fontWeight: 700 }}>
                  ● Actif
                </span>
              )}
            </div>
          )}

          {!isResponsable && plantScope.plantNom && (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: '1rem', padding: '10px 14px', borderRadius: 12, border: '1px solid #BFDBFE', background: '#EFF6FF', color: '#1D4ED8', fontSize: '.8rem', fontWeight: 700 }}>
              <span style={{ width: 8, height: 8, borderRadius: 99, background: '#1D4ED8' }} />
              Scope actif: {plantScope.plantNom}
            </div>
          )}

          {loadingClass ? <Spinner /> : (
            <>
              {/* ── Cartes stats ── */}
              {classement.length > 0 && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12, marginBottom: '1.25rem' }}>
                  <StatCard label="Total auditeurs"  value={stats.total}        sub="ayant tenté la qualif" />
                  <StatCard label="Certifiés"        value={stats.certifies}    sub={`${stats.total > 0 ? Math.round(stats.certifies / stats.total * 100) : 0}% de réussite`} color="#059669" />
                  <StatCard label="Moy. théorique"   value={fmt(stats.moyTheo)} sub="score moyen théorique" color={scoreColor(stats.moyTheo)} />
                  <StatCard label="Moy. pratique"    value={stats.moyPrat != null ? fmt(stats.moyPrat) : '—'} sub="score moyen pratique" color={stats.moyPrat != null ? scoreColor(stats.moyPrat) : '#94A3B8'} />
                  <StatCard label="1er essai"         value={stats.premierEssai} sub="réussi du premier coup" color="#D97706" />
                  <StatCard label="Bloqués"           value={stats.bloques}      sub="blocage 6 mois actif" color="#DC2626" />
                </div>
              )}

              {/* ── Barre de filtres ── */}
              <div style={{
                background: '#F3F4F6', borderRadius: 12, border: '1px solid #E8EDF7',
                padding: '.75rem 1rem', marginBottom: '1rem',
                display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap',
              }}>
                {/* Recherche */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 200, background: '#dde0e6', border: '1.5px solid #E2E8F0', borderRadius: 9, padding: '7px 12px' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                  <input
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    placeholder="Nom, matricule, site…"
                    style={{ border: 'none', background: 'transparent', outline: 'none', fontFamily: 'inherit', fontSize: '.84rem', color: '#0B1E3D', width: '100%' }}
                  />
                </div>

                {/* Filtre Qualification */}
                <select
                  value={selectedId ?? ''}
                  onChange={e => {
                    const v = e.target.value;
                    const id = /^\d+$/.test(v) ? Number(v) : (v === '' ? null : v);
                    setSelectedId(id);
                  }}
                  style={selStyle}
                >
                  {certifs.length === 0
                    ? <option value="">Aucune qualification</option>
                    : certifs.map(c => <option key={c.id} value={c.id}>{c.titre}</option>)
                  }
                </select>

                {/* Filtre Site — RESPONSABLE uniquement */}
                {role === 'RESPONSABLE' && !loadingSites && sites.length > 0 && (
                  <select value={selectedSiteId} onChange={e => setSelectedSiteId(e.target.value)} style={selStyle}>
                    <option value="">Tous les sites</option>
                    {sites.map(s => <option key={s.id} value={s.id}>{s.nom}</option>)}
                  </select>
                )}

                {/* Filtre Plant — RESPONSABLE uniquement, si site sélectionné */}
                {role === 'RESPONSABLE' && selectedSiteId && (
                  loadingPlants
                    ? <span style={{ fontSize: '.78rem', color: '#94A3B8' }}>Chargement plants…</span>
                    : plants.length > 0 && (
                      <select value={selectedPlantId} onChange={e => setSelectedPlantId(e.target.value)} style={selStyle}>
                        <option value="">Tous les plants</option>
                        {plants.map(p => <option key={p.id} value={p.id}>{p.nom}</option>)}
                      </select>
                    )
                )}

                {/* Filtre Statut */}
                <select value={filterStatut} onChange={e => setFilterStatut(e.target.value)} style={selStyle}>
                  <option value="TOUS">Tous les statuts</option>
                  {Object.entries(STATUT_CFG).map(([k, v]) => (
                    <option key={k} value={k}>{v.label}</option>
                  ))}
                </select>

                <span style={{ fontSize: '.75rem', color: '#94A3B8', fontWeight: 600, marginLeft: 'auto' }}>
                  {filteredRanked.length} / {scopedClassement.length} auditeur{filteredRanked.length > 1 ? 's' : ''}
                </span>

              </div>

              {/* ── Tableau de classement ── */}
              {filteredRanked.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem', background: '#fff', borderRadius: 14, border: '1.5px dashed #E2E8F0', color: '#94A3B8' }}>
                  {scopedClassement.length === 0
                    ? (
                      <>
                        <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>🎯</div>
                        <p style={{ fontWeight: 700, margin: 0, color: '#374151' }}>Aucun auditeur n'a encore passé cette qualification</p>
                      </>
                    ) : (
                      <>
                        <div style={{ fontSize: '2rem', marginBottom: 10 }}>🔍</div>
                        <p style={{ fontWeight: 700, margin: 0, color: '#374151' }}>Aucun résultat pour ces filtres</p>
                      </>
                    )
                  }
                </div>
              ) : (
                <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #E2E8F0', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,.04)' }}>

                  {/* En-tête tableau */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '52px 1fr 110px 86px 122px 180px 120px 120px 100px',
                    padding: '10px 20px', background: '#d4ddeb',
                    borderBottom: '1px solid #E2E8F0', gap: 10,
                  }}>
                    {['#', 'Auditeur', 'Site', 'Plant', 'Statut', 'Score composite', 'Théorique', 'Pratique', 'Tentatives'].map((h, i) => (
                      <div
                        key={i}
                        style={{
                          fontSize: '.68rem', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '.07em', display: 'flex', alignItems: 'center',
                          justifyContent: h === 'Statut' ? 'center' : 'flex-start',
                          textAlign: h === 'Statut' ? 'center' : 'left',
                        }}
                      >
                        {h}
                      </div>
                    ))}
                  </div>

                  {/* Lignes */}
                  {filteredRanked.map((a, idx) => {
                    const medal  = MEDAL[a.medailleFiltré];
                    const rang   = a.rangFiltré;
                    const nbTent = (a.nbTentativesTheorique ?? 0) + (a.nbTentativesPratique ?? 0);
                    const score  = a.scoreComposite ?? computeScore(a);
                    return (
                      <div key={a.passageId}
                        className="cls-row"
                        style={{
                          display: 'grid',
                          gridTemplateColumns: '40px 1fr 110px 86px 100px 180px 130px 130px 100px',
                          padding: '13px 20px',
                          borderBottom: idx < filteredRanked.length - 1 ? '1px solid #F1F5F9' : 'none',
                          animation: `rowIn .3s ${idx * .03}s ease both`,
                          background: medal ? `${medal.bg}55` : undefined,
                          gap: 10, alignItems: 'center',
                        }}
                      >
                        {/* Rang */}
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                          {medal ? (
                            <span style={{ fontSize: '1.4rem', lineHeight: 1 }}>{medal.icon}</span>
                          ) : (
                            <span style={{ width: 30, height: 30, borderRadius: 9, background: '#F1F5F9', border: '1.5px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '.82rem', color: '#64748B' }}>
                              {rang}
                            </span>
                          )}
                        </div>

                        {/* Auditeur */}
                        <div style={{ minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 3 }}>
                            <div>
                              <div style={{ fontWeight: 700, fontSize: '.87rem', color: '#0B1E3D', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {a.auditeurPrenom} {a.auditeurNom}
                              </div>
                              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                                <span style={{ fontSize: '.7rem', color: '#94A3B8', fontWeight: 600, background: '#F8FAFC', border: '1px solid #E8EDF7', borderRadius: 5, padding: '1px 6px' }}>
                                  {a.auditeurMatricule || '—'}
                                </span>
                                {a.premierEssai && a.certifie && (
                                  <span title="Certifié du premier essai" style={{ fontSize: '.68rem', background: '#FEF3C7', color: '#D97706', border: '1px solid #FDE68A', borderRadius: 99, padding: '1px 6px', fontWeight: 800 }}>
                                    ⭐ 1er essai
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Site */}
                        <div style={{ fontSize: '.75rem', color: '#374151', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {a.siteNom || '—'}
                        </div>

                        {/* Plant */}
                        <div style={{ fontSize: '.75rem', color: '#64748B', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {a.plantNom || '—'}
                        </div>

                        {/* Statut */}
                        <div style={{ display: 'flex', justifyContent: 'center' }}><StatutBadge statut={a.statut} /></div>

                        {/* Score composite */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                          <div style={{ display: 'flex', alignItems: 'baseline', gap: 5 }}>
                            <span style={{ fontWeight: 900, fontSize: '1.05rem', color: scoreColor(score) }}>
                              {Math.round(score)}
                            </span>
                            <span style={{ fontSize: '.72rem', color: '#94A3B8', fontWeight: 600 }}>/100</span>
                          </div>
                          <ScoreBar value={score} color={scoreColor(score)} />
                        </div>

                        {/* Théorique */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                          <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                            <span style={{ fontWeight: 700, fontSize: '.9rem', color: '#0B1E3D' }}>
                              {a.scoreTheorique != null ? a.scoreTheorique : '—'}
                            </span>
                            {a.scoreTheoriqueMax && (
                              <span style={{ fontSize: '.7rem', color: '#94A3B8' }}>/{a.scoreTheoriqueMax}</span>
                            )}
                            {a.scoreTheoriquePct != null && (
                              <span style={{ fontSize: '.72rem', color: scoreColor(a.scoreTheoriquePct), fontWeight: 700, marginLeft: 3 }}>
                                ({a.scoreTheoriquePct}%)
                              </span>
                            )}
                          </div>
                          <ScoreBar value={a.scoreTheoriquePct} color={scoreColor(a.scoreTheoriquePct || 0)} bg="#EFF6FF" />
                        </div>

                        {/* Pratique */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                          {a.scorePratique != null ? (
                            <>
                              <span style={{ fontWeight: 700, fontSize: '.9rem', color: '#0B1E3D' }}>
                                {Math.round(a.scorePratique)}%
                              </span>
                              <ScoreBar value={a.scorePratique} color={scoreColor(a.scorePratique)} bg="#F5F3FF" />
                            </>
                          ) : (
                            <span style={{ fontSize: '.78rem', color: '#CBD5E1', fontStyle: 'italic' }}>Non évalué</span>
                          )}
                        </div>

                        {/* Tentatives */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                          <div style={{ display: 'flex', gap: 5 }}>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, background: '#EFF6FF', color: '#0284C7', border: '1px solid #BAE6FD', borderRadius: 6, padding: '2px 7px', fontSize: '.7rem', fontWeight: 700 }}>
                              📖 {a.nbTentativesTheorique ?? 0}
                            </span>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, background: '#F5F3FF', color: '#7C3AED', border: '1px solid #DDD6FE', borderRadius: 6, padding: '2px 7px', fontSize: '.7rem', fontWeight: 700 }}>
                              🔧 {a.nbTentativesPratique ?? 0}
                            </span>
                          </div>
                          {nbTent === 2 && (
                            <span style={{ fontSize: '.65rem', color: '#059669', fontWeight: 700 }}>✓ 1er essai global</span>
                          )}
                          {nbTent > 4 && (
                            <span style={{ fontSize: '.65rem', color: '#DC2626', fontWeight: 600 }}>Plusieurs tentatives</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* ── Légende score composite ── */}
              {filteredRanked.length > 0 && (
                <div style={{ background: '#F8FAFC', border: '1px solid #E8EDF7', borderRadius: 12, padding: '.875rem 1.25rem', marginTop: '.5rem', fontSize: '.75rem', color: '#64748B' }}>
                  <strong style={{ color: '#374151', fontWeight: 800 }}>Score composite</strong> =
                  <span style={{ marginLeft: 6 }}>Théorique × 40%</span>
                  <span style={{ margin: '0 4px', color: '#CBD5E1' }}>+</span>
                  <span>Pratique × 40%</span>
                  <span style={{ margin: '0 4px', color: '#CBD5E1' }}>+</span>
                  <span style={{ color: '#D97706', fontWeight: 700 }}>+20 pts 1er essai global</span>
                  <span style={{ margin: '0 4px', color: '#CBD5E1' }}>−</span>
                  <span style={{ color: '#DC2626', fontWeight: 700 }}>5 pts / tentative suppl.</span>
                  <span style={{ margin: '0 4px', color: '#CBD5E1' }}>−</span>
                  <span style={{ color: '#DC2626', fontWeight: 700 }}>20 pts si bloqué</span>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ── Aucune qualification disponible ── */}
      {!loadingCertifs && certifs.length === 0 && (
        <div style={{ textAlign: 'center', padding: '3rem', background: '#fff', borderRadius: 14, border: '1.5px dashed #E2E8F0', color: '#94A3B8' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>📋</div>
          <p style={{ fontWeight: 700, margin: 0, color: '#374151' }}>Aucune qualification confirmée disponible</p>
        </div>
      )}

      {/* ── Chargement en cours ── */}
      {loadingCertifs && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '3rem', gap: 12, color: '#94A3B8' }}>
          <span style={{ width: 18, height: 18, border: '2px solid #E2E8F0', borderTopColor: '#0B1E3D', borderRadius: '50%', animation: 'spin .7s linear infinite', display: 'inline-block' }} />
          Chargement des qualifications…
        </div>
      )}
    </div>
  );
}