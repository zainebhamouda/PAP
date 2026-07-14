import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth, getDashboardRoute } from '../../context/AuthContext';

/* ─── Palette & tokens ─── */
const C = {
  navy:    '#0A1628',
  blue:    '#1B4FBF',
  blueL:   '#2563EB',
  blueXL:  '#DBEAFE',
  gold:    '#D97706',
  goldL:   '#FEF3C7',
  teal:    '#0D9488',
  tealL:   '#CCFBF1',
  rose:    '#E11D48',
  roseL:   '#FFE4E6',
  green:   '#15803D',
  greenL:  '#DCFCE7',
  slate:   '#475569',
  slateL:  '#F1F5F9',
  border:  '#E2E8F0',
  text:    '#1E293B',
  muted:   '#64748B',
  bg:      '#F8FAFC',
};

const apiH = () => ({
  Authorization: `Bearer ${localStorage.getItem('token')}`,
  'Content-Type': 'application/json',
});

/* ════════════════════════════════════════════════════════
   NORMALISEUR — mappe TOUS les formats possibles de l'API
   Spring camelCase · Python snake_case · Flask ML output
════════════════════════════════════════════════════════ */
function pick(...vals) {
  for (const v of vals) {
    if (v !== undefined && v !== null && v !== '' && !Number.isNaN(v)) {
      if (typeof v === 'boolean') return v;
      const n = Number(v);
      if (!Number.isNaN(n)) return n;
    }
  }
  return 0;
}

function norm(a) {
  // --- ACTIVITÉ ---
  const nbTotal       = pick(a.nbAuditsTotal,    a.nb_audits_total,    a.nbAuditsMois,   a.nbAudits);
  const nbTermine     = pick(a.nbAuditsTermines, a.nb_audits_termines, a.auditsTermines, a.nbAuditsValides);
  const nbRetard      = pick(a.nbAuditsEnRetard, a.nb_audits_en_retard, a.nbRetards,     a.retards);
  const nbEnCours     = pick(a.nbAuditsEnCours,  a.nb_audits_en_cours, a.enCours);
  const tauxRetard    = pick(a.tauxRetardPct,    a.taux_retard_pct,   a.tauxRetard,
    nbTotal > 0 ? (nbRetard / nbTotal) * 100 : 0);
  const delaiMoyen    = pick(a.delaiMoyenJours,  a.delai_moyen_jours, a.delaiMoyen);
  const tauxCompletion = nbTotal > 0 ? Math.min(100, (nbTermine / nbTotal) * 100) : 0;

  // --- QUALITÉ ---
  // qkMoyenGlobal prioritaire sur qkMoyen (mois courant souvent 0)
  const qkRaw  = a.qkMoyenGlobal !== undefined && a.qkMoyenGlobal !== null
    ? a.qkMoyenGlobal
    : (a.qkMoyen !== 0 ? pick(a.qkMoyen, a.qk_moyen) : pick(a.qk_moyen, a.valeurQK));
  const qkMoyen    = pick(qkRaw, 0);
  const tauxConf   = pick(a.tauxConformite, a.taux_conformite, a.taux_vert, 100);
  const nbVert     = pick(a.nbQkVert,         a.nb_qk_vert,      a.nbVert);
  const nbPdca     = pick(a.nbPdcaDeclenches, a.nb_pdca_declenches, a.nbPdca);
  const nbCritique = pick(a.nbQkCritique,     a.nb_qk_critique,  a.nbCritiques);

  // --- CERTIFICATION ---
  const nbCertTente  = pick(a.nbCertTentees, a.nb_certifications_tentees, a.nbCertificationsTentees, 1);
  const nbCertReussi = pick(a.nbCertReussies, a.nbCertificationsReussies, a.nb_certifications_reussies);
  const scoreTheo = pick(
    a.scoreTheoMoyen,   // camelCase normal Spring
    a.scoretheoMoyen,   // typo Spring IaService
    a.score_theo_moyen, // snake_case Python/Flask
    a.scoreTheorique,
    a.noteTheorique
  );
  const scorePrat = pick(
    a.scorePratMoyen,
    a.score_prat_moyen,
    a.scorePratique,
    a.notePratique,
    (a.nbDefautsIdentifies != null && a.nbDefautsTotal > 0
      ? (a.nbDefautsIdentifies / a.nbDefautsTotal) * 100 : undefined)
  );
  const estBloque = !!(a.estBloqueCertif || a.est_bloque_certif || a.bloque || false);
  const nbQualif  = pick(a.nbQualifications, a.nb_qualifications, nbCertReussi);

  return {
    nbTotal, nbTermine, nbRetard, nbEnCours, tauxRetard, delaiMoyen, tauxCompletion,
    qkMoyen, nbVert, nbPdca, nbCritique, tauxConf,
    nbCertTente, nbCertReussi, scoreTheo, scorePrat, estBloque, nbQualif,
  };
}

/* ════════════════════════════════════════════════════
   MOTEUR SCORE — deux chemins :
   1) Données venant du modèle ML Flask (scoreFinal + niveau + confiance présents)
      → on utilise le scoreFinal ML directement, on recalcule les sous-scores visuels
   2) Données brutes Spring Boot (pas de scoreFinal ML)
      → calcul JS classique (formule métier)
════════════════════════════════════════════════════ */
function computeAIScore(raw) {
  const a = norm(raw);
  const { nbTotal, nbTermine, tauxRetard, delaiMoyen, tauxCompletion,
          qkMoyen, nbVert, nbPdca, nbCritique, tauxConf,
          nbCertTente, nbCertReussi, scoreTheo, scorePrat, estBloque, nbQualif } = a;

  // ── Sous-scores communs (utilisés dans les deux chemins) ──────────
  const scoreVolume      = Math.min(100, (nbTotal / 30) * 100);
  const scorePonctualite = Math.max(0, 100 - tauxRetard);
  const scoreDelai       = Math.max(0, 100 - (delaiMoyen / 30) * 100);
  const scoreActivite    = Math.round(
    scoreVolume * 0.30 + scorePonctualite * 0.40 + scoreDelai * 0.15 + tauxCompletion * 0.15
  );

  const scoreQK        = (1 - Math.min(1, qkMoyen)) * 100;
  const tauxVert       = nbTermine > 0
    ? Math.min(100, (nbVert / nbTermine) * 100)
    : tauxConf;
  const penalitePdca   = Math.max(70, 100 - (Math.min(10, nbPdca) / 10) * 30);
  const penaliteCrit   = Math.max(80, 100 - (Math.min(10, nbCritique) / 10) * 20);
  const scoreQualite   = Math.round(
    scoreQK * 0.40 + tauxVert * 0.35 + penalitePdca * 0.15 + penaliteCrit * 0.10
  );

  const scoreTheoNorm  = Math.min(100, (scoreTheo / 20) * 100);
  const scorePratNorm  = Math.min(100, scorePrat);
  const bonusReussite  = Math.min(100, (nbCertReussi / Math.max(1, nbCertTente)) * 100);
  const malusBlocage   = estBloque ? 30 : 0;
  const scoreCertif    = Math.round(
    Math.max(0, scoreTheoNorm * 0.35 + scorePratNorm * 0.35 + bonusReussite * 0.30 - malusBlocage)
  );

  // ── CHEMIN 1 : Score ML reçu depuis Flask via Spring ─────────────
  // Flask retourne : scoreFinal, niveau, confiance (nombre 0-100)
  const hasML = (
    raw.scoreFinal !== undefined && raw.scoreFinal !== null &&
    raw.niveau     !== undefined && raw.niveau     !== null &&
    raw.confiance  !== undefined && raw.confiance  !== null
  );

  const scoreFinal = hasML
    ? Math.round(Number(raw.scoreFinal))
    : Math.round(scoreActivite * 0.30 + scoreQualite * 0.40 + scoreCertif * 0.30);

  let niveau = hasML ? raw.niveau : 'A_RISQUE';
  if (!hasML) {
    if (scoreFinal >= 80)      niveau = 'TOP';
    else if (scoreFinal >= 65) niveau = 'BON';
    else if (scoreFinal >= 45) niveau = 'MOYEN';
  }

  const seuilTermines = Math.max(3, Math.round(nbTotal * 0.6));
  const recommande = (
    scoreFinal  >= 75 &&
    nbTermine   >= seuilTermines &&
    scoreCertif >= 70 &&
    !estBloque  &&
    tauxRetard  < 15
  );

  return {
    scoreActivite, scoreQualite, scoreCertif,
    scoreFinal,    niveau,       recommande,
    seuilTermines,
    tauxVert:       Math.round(tauxVert),
    tauxRetard:     Math.round(tauxRetard),
    tauxCompletion: Math.round(tauxCompletion),
    nbQualif,
    qkMoyen,
    nbTermine,
    nbTotal,
    scoreTheoNorm:  Math.round(scoreTheoNorm),
    scorePratNorm:  Math.round(scorePratNorm),
    // Infos ML (undefined si fallback JS)
    confiance:      hasML ? Number(raw.confiance) : undefined,
    sourceML:       hasML,
    modele:         raw.modele || (hasML ? 'ML' : 'JS'),
    // Probabilités détaillées si disponibles (Flask evaluer-auditeur)
    probabilites:   raw.probabilites || null,
  };
}

/* ── Avatar ─────────────────────────────────── */
const AVPAL = [
  ['#EEF2FF','#3730A3'],['#F0FDF4','#166534'],['#FFF7ED','#92400E'],
  ['#FFF1F2','#9F1239'],['#F0F9FF','#0C4A6E'],['#F5F3FF','#5B21B6'],
  ['#ECFDF5','#065F46'],['#FFFBEB','#78350F'],
];
function Avatar({ name, idx, size = 38 }) {
  const [bg, fg] = AVPAL[idx % AVPAL.length];
  const ini = (name || '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', background: bg, color: fg,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size > 40 ? 15 : 12, fontWeight: 700, flexShrink: 0,
      border: `2px solid ${fg}22` }}>
      {ini}
    </div>
  );
}

/* ── Niveau badge ───────────────────────────── */
const NIV = {
  TOP:      { bg: C.greenL, color: C.green, label: 'TOP',      icon: '◆' },
  BON:      { bg: C.blueXL, color: C.blue,  label: 'BON',      icon: '◉' },
  MOYEN:    { bg: C.goldL,  color: C.gold,  label: 'MOYEN',    icon: '◈' },
  A_RISQUE: { bg: C.roseL,  color: C.rose,  label: 'À RISQUE', icon: '◇' },
};
function NiveauBadge({ niveau }) {
  const s = NIV[niveau] || NIV.MOYEN;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 10,
      fontWeight: 700, padding: '3px 8px', borderRadius: 99,
      background: s.bg, color: s.color, letterSpacing: '.06em' }}>
      <span style={{ fontSize: 9 }}>{s.icon}</span>{s.label}
    </span>
  );
}

/* ── Score ring ─────────────────────────────── */
function ScoreRing({ score, size = 42 }) {
  const r = size / 2 - 4;
  const circ = 2 * Math.PI * r;
  const dash = (Math.min(100, Math.max(0, score)) / 100) * circ;
  const col = score >= 80 ? C.green : score >= 65 ? C.blue : score >= 45 ? C.gold : C.rose;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={col+'22'} strokeWidth={4} />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={col} strokeWidth={4}
        strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
        transform={`rotate(-90 ${size/2} ${size/2})`} />
      <text x={size/2} y={size/2 + 4} textAnchor="middle" fontSize="10"
        fontWeight="700" fill={col}>{score}</text>
    </svg>
  );
}

/* ── Mini bar ───────────────────────────────── */
function MiniBar({ val, max = 100, color }) {
  const pct = Math.min(100, Math.max(0, (val / max) * 100));
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <div style={{ flex: 1, height: 4, borderRadius: 99, background: color + '22', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: color,
          borderRadius: 99, transition: 'width .6s ease' }} />
      </div>
      <span style={{ fontSize: 10, color: C.muted, minWidth: 28, textAlign: 'right' }}>{Math.round(val)}%</span>
    </div>
  );
}

/* ── Radar hexagonal SVG ────────────────────── */
function RadarMini({ scores, size = 64 }) {
  const vals = scores.map(s => Math.max(0, Math.min(100, s || 0)));
  const cx = size / 2, cy = size / 2, r = size / 2 - 8;
  const angles = vals.map((_, i) => (i * 2 * Math.PI / vals.length) - Math.PI / 2);
  const pts = vals.map((v, i) => ({
    x: cx + (v / 100) * r * Math.cos(angles[i]),
    y: cy + (v / 100) * r * Math.sin(angles[i]),
  }));
  const poly = pts.map(p => `${p.x},${p.y}`).join(' ');
  const gridPts = angles.map(a => ({ x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) }));
  const gridPoly = gridPts.map(p => `${p.x},${p.y}`).join(' ');
  const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
  const col = avg >= 80 ? C.green : avg >= 65 ? C.blue : avg >= 45 ? C.gold : C.rose;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <polygon points={gridPoly} fill="none" stroke={C.border} strokeWidth="1" />
      <polygon points={poly} fill={col + '28'} stroke={col} strokeWidth="1.5" />
      {pts.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r={2} fill={col} />)}
    </svg>
  );
}

/* ── Rank icon ──────────────────────────────── */
function RankIcon({ rank }) {
  if (rank === 1) return <span style={{ fontSize: 20 }}>🥇</span>;
  if (rank === 2) return <span style={{ fontSize: 18 }}>🥈</span>;
  if (rank === 3) return <span style={{ fontSize: 16 }}>🥉</span>;
  return (
    <span style={{ fontSize: 12, color: C.muted, fontWeight: 700, fontFamily: 'monospace',
      minWidth: 20, textAlign: 'center', display: 'block' }}>#{rank}</span>
  );
}

/* ── Metric card ────────────────────────────── */
function MetCard({ label, value, color, sub }) {
  return (
    <div style={{ background: '#fff', border: `1px solid ${C.border}`, borderRadius: 12,
      padding: '14px 18px', borderTop: `3px solid ${color || C.blue}` }}>
      <div style={{ fontSize: 22, fontWeight: 800, color: color || C.navy,
        fontVariantNumeric: 'tabular-nums' }}>{value}</div>
      <div style={{ fontSize: 11, color: C.muted, marginTop: 3, fontWeight: 500 }}>{label}</div>
      {sub && <div style={{ fontSize: 10, color: color || C.blue, marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

/* ── Barre de probabilités ML ───────────────── */
function ProbaBar({ probabilites }) {
  if (!probabilites) return null;
  const items = [
    { label: 'TOP',      val: probabilites.TOP      || 0, color: C.green },
    { label: 'BON',      val: probabilites.BON      || 0, color: C.blue  },
    { label: 'MOYEN',    val: probabilites.MOYEN    || 0, color: C.gold  },
    { label: 'À RISQUE', val: probabilites.A_RISQUE || 0, color: C.rose  },
  ];
  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ fontSize: 9, fontWeight: 700, color: C.muted, letterSpacing: '.08em',
        textTransform: 'uppercase', marginBottom: 6 }}>Probabilités ML</div>
      {items.map(it => (
        <div key={it.label} style={{ display: 'grid', gridTemplateColumns: '60px 1fr 32px',
          gap: 6, alignItems: 'center', marginBottom: 4 }}>
          <span style={{ fontSize: 10, color: C.slate }}>{it.label}</span>
          <div style={{ height: 4, borderRadius: 99, background: it.color + '22', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${it.val}%`, background: it.color, borderRadius: 99 }} />
          </div>
          <span style={{ fontSize: 9, color: it.color, fontWeight: 700, textAlign: 'right' }}>
            {it.val.toFixed(1)}%
          </span>
        </div>
      ))}
    </div>
  );
}

/* ── Detail panel (ligne expandée) ─────────── */
function DetailPanel({ a, scores, onNavigate }) {
  const bars = [
    { label: 'Activité',    val: scores.scoreActivite,       color: C.teal  },
    { label: 'Qualité',     val: scores.scoreQualite,        color: C.blue  },
    { label: 'Certification', val: scores.scoreCertif,       color: C.gold  },
    { label: 'Taux vert',   val: scores.tauxVert,            color: C.green },
    { label: 'Complétion',  val: scores.tauxCompletion,      color: C.blue  },
    { label: 'Ponctualité', val: 100 - scores.tauxRetard,
      color: scores.tauxRetard > 15 ? C.rose : C.green },
  ];
  return (
    <tr>
      <td colSpan={9} style={{ padding: 0, borderBottom: `1px solid ${C.border}` }}>
        <div style={{ background: '#F8FAFC', padding: '16px 24px',
          display: 'flex', gap: 28, flexWrap: 'wrap' }}>

          {/* Barres de décomposition */}
          <div style={{ minWidth: 200, flex: 1 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: C.muted,
              letterSpacing: '.08em', marginBottom: 10, textTransform: 'uppercase' }}>
              Décomposition IA
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {bars.map(b => (
                <div key={b.label} style={{ display: 'grid',
                  gridTemplateColumns: '90px 1fr', gap: 8, alignItems: 'center' }}>
                  <span style={{ fontSize: 11, color: C.slate }}>{b.label}</span>
                  <MiniBar val={b.val} color={b.color} />
                </div>
              ))}
            </div>
          </div>

          {/* Métriques clés */}
          <div style={{ minWidth: 160, flex: 1 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: C.muted,
              letterSpacing: '.08em', marginBottom: 10, textTransform: 'uppercase' }}>
              Métriques clés
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {[
                ['Audits terminés', `${scores.nbTermine} / ${scores.nbTotal}`],
                ['QK moyen',        (scores.qkMoyen || 0).toFixed(3)],
                ['Score théorique', `${scores.scoreTheoNorm}%`],
                ['Score pratique',  `${scores.scorePratNorm}%`],
                ['Qualifications',  scores.nbQualif],
                ['Taux retard',     `${scores.tauxRetard}%`],
              ].map(([k, v]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                  <span style={{ color: C.muted }}>{k}</span>
                  <span style={{ fontWeight: 600, color: C.text }}>{v}</span>
                </div>
              ))}
            </div>

            {/* Badge source ML/JS */}
            <div style={{ marginTop: 10, display: 'inline-flex', alignItems: 'center', gap: 5,
              fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 99,
              background: scores.sourceML ? '#EEF2FF' : '#F1F5F9',
              color: scores.sourceML ? C.blue : C.muted,
              border: `1px solid ${scores.sourceML ? '#BFDBFE' : C.border}` }}>
              {scores.sourceML ? '✦ Gradient Boosting ML 97.5%' : '⚙ Calcul JS (fallback)'}
              {scores.confiance !== undefined && (
                <span style={{ marginLeft: 4, color: scores.confiance >= 80 ? C.green : C.gold }}>
                  · confiance {scores.confiance.toFixed(1)}%
                </span>
              )}
            </div>

            {/* Probabilités si disponibles */}
            {scores.probabilites && <ProbaBar probabilites={scores.probabilites} />}
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, justifyContent: 'flex-end' }}>
            {scores.recommande && (
              <div style={{ background: C.greenL, border: `1px solid ${C.green}44`,
                borderRadius: 8, padding: '8px 12px', fontSize: 11, color: C.green,
                fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                ✦ Recommandé pour promotion Expert
              </div>
            )}
            <button onClick={() => onNavigate && onNavigate(a.id || a.auditeurId)}
              style={{ background: C.blue, color: '#fff', border: 'none', borderRadius: 8,
                padding: '8px 16px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
              Voir profil complet →
            </button>
          </div>
        </div>
      </td>
    </tr>
  );
}

/* ══════════════════════════════════════════════════
   PAGE PRINCIPALE
══════════════════════════════════════════════════ */
const REFRESH_INTERVAL_MS = 30 * 60 * 1000;

export default function AuditeurRankingIAPage() {
  const { user } = useAuth();
  const [enriched,      setEnriched]      = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [iaStatus,      setIaStatus]      = useState('unknown'); // 'ml' | 'fallback' | 'unknown'
  const [lastSync,      setLastSync]      = useState(null);
  const [nextSync,      setNextSync]      = useState(null);
  const [countdown,     setCountdown]     = useState('');
  const [search,        setSearch]        = useState('');
  const [filterNiveau,  setFilterNiveau]  = useState('');
  const [filterPlant,   setFilterPlant]   = useState('');
  const [sortKey,       setSortKey]       = useState('scoreFinal');
  const [expanded,      setExpanded]      = useState(null);
  const [plants,        setPlants]        = useState([]);
  const [flashUp,       setFlashUp]       = useState(new Set());
  const [flashDown,     setFlashDown]     = useState(new Set());
  const [scoreDiff,     setScoreDiff]     = useState({});
  const [rankDiff,      setRankDiff]      = useState({});
  const [refreshing,    setRefreshing]    = useState(false);

  const timerRef     = useRef(null);
  const countdownRef = useRef(null);
  const prevScores   = useRef({});
  const prevRanks    = useRef({});

  const routerNavigate = useNavigate();
  const handleViewProfile = (id) => {
    if (id) {
      const isDashboardRole = ['ADMIN', 'CHEF_SERVICE', 'RESPONSABLE_QUALITE_CENTRALE'].includes(user?.role);
      routerNavigate(isDashboardRole ? getDashboardRoute(user?.role) : `/expert/auditeur/${id}`);
    }
  };
  const goBack   = () => window.history.back();

  /* ── Enrichissement d'une liste brute ──────────── */
  const buildEnriched = useCallback((raw, source) => {
    return raw.map(a => {
      // Normaliser le champ id (Flask retourne auditeurId, Spring retourne id)
      const id = a.id || a.auditeurId;
      return {
        ...a,
        id,
        nom:     `${a.prenom || ''} ${a.nom || ''}`.trim() || `Auditeur ${id}`,
        plant:   a.plantNom || a.plant?.nom || a.site_nom || a.siteName || '—',
        segment: a.segmentNom || a.segment?.nom || '—',
        certs:   a.certifications || a.certs || [],
        histQK:  a.historiqueQK   || a.histQK || [],
        aiScores: computeAIScore(a),
      };
    });
  }, []);

  /* ── Calcul diffs de scores et rangs (effet bourse) ── */
  const applyDiffs = (built) => {
    const newUp = new Set(), newDown = new Set(), diffs = {}, rdiffs = {};
    const sorted = [...built].sort((a, b) => b.aiScores.scoreFinal - a.aiScores.scoreFinal);
    sorted.forEach((a, i) => {
      const prevScore = prevScores.current[a.id];
      const prevRank  = prevRanks.current[a.id];
      const curRank   = i + 1;
      if (prevScore !== undefined) {
        const delta = a.aiScores.scoreFinal - prevScore;
        if (Math.abs(delta) >= 1) {
          diffs[a.id] = delta;
          delta > 0 ? newUp.add(a.id) : newDown.add(a.id);
        }
      }
      if (prevRank !== undefined && prevRank !== curRank) {
        rdiffs[a.id] = prevRank - curRank;
      }
      prevScores.current[a.id] = a.aiScores.scoreFinal;
      prevRanks.current[a.id]  = curRank;
    });
    setScoreDiff(diffs);
    setRankDiff(rdiffs);
    if (newUp.size + newDown.size > 0) {
      setFlashUp(newUp); setFlashDown(newDown);
      setTimeout(() => { setFlashUp(new Set()); setFlashDown(new Set()); }, 2500);
    }
  };

  /* ════════════════════════════════════════════════
     FETCH PRINCIPAL
     Stratégie :
       1) Appelle Spring /api/ia/classement
          → Spring appelle Flask POST /api/ia/classement (batch ML)
          → Retourne { total, auditeurs: [{scoreFinal, niveau, confiance, ...}] }
       2) Si échec → fallback Spring /api/admin/utilisateurs/auditeurs?withStats=true
          → Calcul JS local (computeAIScore sans ML)
  ════════════════════════════════════════════════ */
 const fetchData = useCallback(async (silent = false) => {
  if (!silent) setLoading(true);
  setRefreshing(true);

  let built = null;
  let source = 'unknown';

  try {
    // ── Appel 1 : données complètes Spring (plant, QK, certif, stats) ──
    const resStats = await fetch(
      'http://localhost:8080/api/admin/utilisateurs/auditeurs?withStats=true',
      { headers: apiH() }
    );

    // ── Appel 2 : scores ML Flask via Spring ──
    const resML = await fetch(
      'http://localhost:8080/api/ia/classement',
      { headers: apiH() }
    );

    if (resStats.ok && resML.ok) {
      const statsData = await resStats.json();
      const mlData    = await resML.json();

      const statsRaw = Array.isArray(statsData) ? statsData : [];
      const mlRaw    = Array.isArray(mlData.auditeurs) ? mlData.auditeurs : [];

      // ── Créer un index ML par auditeurId pour lookup rapide ──
      const mlIndex = {};
      mlRaw.forEach(m => {
        const id = m.auditeurId || m.id;
        mlIndex[id] = m;
      });

      // ── Fusionner : données Spring + score ML ──
      const merged = statsRaw.map(s => {
        const mlEntry = mlIndex[s.id] || {};
        return {
          ...s,                              // toutes les données Spring (plant, QK, certif...)
          // Injecter les champs ML si disponibles
          scoreFinal: mlEntry.scoreFinal,    // score du Gradient Boosting
          niveau:     mlEntry.niveau,        // niveau ML
          confiance:  mlEntry.confiance,     // confiance ML
          rang:       mlEntry.rang,          // rang ML
          modele:     mlEntry.modele || 'Gradient Boosting',
        };
      });

      console.log(`[PAP IA] ✦ Fusion ML+Stats — ${merged.length} auditeurs:`, 
  merged.map(a => ({ id: a.id, nom: `${a.prenom} ${a.nom}`, scoreFinal: a.scoreFinal }))
);

      built  = buildEnriched(merged, 'ml');
      source = mlRaw.length > 0 ? 'ml' : 'fallback';

    } else if (resStats.ok) {
      // Flask indisponible → calcul JS depuis données Spring
      const statsData = await resStats.json();
      const statsRaw  = Array.isArray(statsData) ? statsData : [];
      built  = buildEnriched(statsRaw, 'js');
      source = 'fallback';
      console.warn('[PAP IA] ⚙ Fallback JS — Flask indisponible');
    }

  } catch (e) {
    console.warn('[PAP IA] Erreur fetch:', e.message);
  }

  // ── Fallback démo si tout échoue ──
  if (!built || built.length === 0) {
    built  = buildEnriched(DEMO_EXTENDED, 'demo');
    source = 'demo';
    console.warn('[PAP IA] ⚠ Données DÉMO');
  }

  setIaStatus(source);
  applyDiffs(built);
  setEnriched(built);
  setPlants([...new Set(built.map(a => a.plant).filter(p => p && p !== '—'))]);
  setLoading(false);
  setRefreshing(false);
  const now  = new Date();
  const next = new Date(now.getTime() + REFRESH_INTERVAL_MS);
  setLastSync(now);
  setNextSync(next);
}, [buildEnriched]);

  /* ── Compte à rebours ───────────────────────── */
  useEffect(() => {
    countdownRef.current = setInterval(() => {
      if (!nextSync) return;
      const diff = Math.max(0, nextSync.getTime() - Date.now());
      const m = Math.floor(diff / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setCountdown(`${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`);
    }, 1000);
    return () => clearInterval(countdownRef.current);
  }, [nextSync]);

  useEffect(() => {
    fetchData();
    timerRef.current = setInterval(() => fetchData(true), REFRESH_INTERVAL_MS);
    return () => { clearInterval(timerRef.current); clearInterval(countdownRef.current); };
  }, [fetchData]);

  /* ── Filtrage + tri ─────────────────────────── */
  const filtered = enriched
    .filter(a => {
      const q   = search.toLowerCase();
      const txt = !q || (a.nom + a.plant + a.segment).toLowerCase().includes(q);
      const niv = !filterNiveau || a.aiScores.niveau === filterNiveau;
      const pl  = !filterPlant  || a.plant === filterPlant;
      return txt && niv && pl;
    })
    .sort((a, b) => {
      if (sortKey === 'activite') return b.aiScores.scoreActivite - a.aiScores.scoreActivite;
      if (sortKey === 'qualite')  return b.aiScores.scoreQualite  - a.aiScores.scoreQualite;
      if (sortKey === 'certif')   return b.aiScores.scoreCertif   - a.aiScores.scoreCertif;
      if (sortKey === 'audits')   return b.aiScores.nbTotal       - a.aiScores.nbTotal;
      return b.aiScores.scoreFinal - a.aiScores.scoreFinal;
    });

  /* ── KPIs globaux ───────────────────────────── */
  const topCount    = enriched.filter(a => a.aiScores.niveau === 'TOP').length;
  const promoCount  = enriched.filter(a => a.aiScores.recommande).length;
  const avgScore    = enriched.length
    ? Math.round(enriched.reduce((s, a) => s + a.aiScores.scoreFinal, 0) / enriched.length)
    : 0;
  const risqueCount = enriched.filter(a => a.aiScores.niveau === 'A_RISQUE').length;
  const mlCount     = enriched.filter(a => a.aiScores.sourceML).length;

  const sel = {
    border: `1px solid ${C.border}`, borderRadius: 8, padding: '8px 11px',
    fontSize: 12, background: '#fff', color: C.text, outline: 'none', cursor: 'pointer',
  };

  /* ── Badge statut IA ────────────────────────── */
  const statusBadge = {
    ml:       { bg: C.greenL,  color: C.green, label: '✦ Modèle ML actif · Gradient Boosting 97.5%' },
    fallback: { bg: C.goldL,   color: C.gold,  label: '⚙ Calcul JS (API Flask indisponible)'        },
    demo:     { bg: C.roseL,   color: C.rose,  label: '⚠ Données DÉMO — API Spring indisponible'    },
    unknown:  { bg: C.slateL,  color: C.slate, label: '… Chargement'                                },
  }[iaStatus] || { bg: C.slateL, color: C.slate, label: '…' };

  return (
    <div style={{ fontFamily: "'DM Sans', 'Segoe UI', sans-serif", minHeight: '100vh',
      background: '#ffffff', padding: '1.5rem 2rem', color: C.text }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700;800&display=swap');
        @keyframes pulse       { 0%,100%{opacity:1}  50%{opacity:.4} }
        @keyframes flashGreen  { 0%{background:#DCFCE7} 60%{background:#DCFCE7} 100%{background:transparent} }
        @keyframes flashRed    { 0%{background:#FFE4E6} 60%{background:#FFE4E6} 100%{background:transparent} }
        @keyframes tickerScroll{ 0%{transform:translateX(100%)} 100%{transform:translateX(-100%)} }
        @keyframes spin        { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes countPulse  { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.7;transform:scale(.97)} }
        .row-hover:hover { background: #F1F5F9 !important; }
        .row-hover       { transition: background .15s; cursor: pointer; }
        .flash-up   { animation: flashGreen 2.5s ease forwards !important; }
        .flash-down { animation: flashRed   2.5s ease forwards !important; }
        input:focus, select:focus { border-color: ${C.blue} !important; box-shadow: 0 0 0 2px ${C.blue}22 !important; }
        .ai-tag { display:inline-flex;align-items:center;gap:4px;font-size:10px;font-weight:700;
          background:linear-gradient(135deg,#EEF2FF,#E0F2FE);color:#2563EB;
          padding:3px 8px;border-radius:99px;border:1px solid #BFDBFE;letter-spacing:.04em; }
        .countdown  { font-variant-numeric:tabular-nums; animation:countPulse 1s infinite; }
        .refreshing { animation:spin 1s linear infinite; }
      `}</style>

      {/* ── Ticker NYSE ─────────────────────────────── */}
      <div style={{ background: C.navy, color: '#fff', overflow: 'hidden', height: 28,
        display: 'flex', alignItems: 'center', borderRadius: 8, marginBottom: 16,
        position: 'relative', marginTop: -30 }}>
        <div style={{ background: C.blue, padding: '0 12px', height: '100%',
          display: 'flex', alignItems: 'center', flexShrink: 0,
          fontSize: 10, fontWeight: 800, letterSpacing: '.08em', zIndex: 2 }}>
          LEONI PAP
        </div>
        <div style={{ overflow: 'hidden', flex: 1, height: '100%', position: 'relative' }}>
          <div style={{ display: 'flex', gap: 32, alignItems: 'center', height: '100%',
            whiteSpace: 'nowrap', animation: 'tickerScroll 45s linear infinite',
            position: 'absolute', left: 0, top: 0 }}>
            {[...enriched, ...enriched]
              .sort((a, b) => b.aiScores.scoreFinal - a.aiScores.scoreFinal)
              .map((a, idx) => {
                const d   = scoreDiff[a.id];
                const col = d > 0 ? '#4ADE80' : d < 0 ? '#F87171' : '#94A3B8';
                const arr = d > 0 ? '▲' : d < 0 ? '▼' : '—';
                return (
                  <span key={`t-${idx}-${a.id}`} style={{ fontSize: 11,
                    display: 'inline-flex', gap: 6, alignItems: 'center', fontFamily: 'monospace' }}>
                    <span style={{ color: '#CBD5E1', fontWeight: 600 }}>
                      {(a.nom || '').split(' ').map(w => w[0]).join('')}
                    </span>
                    <span style={{ color: '#fff', fontWeight: 700 }}>{a.aiScores.scoreFinal}</span>
                    <span style={{ color: col, fontSize: 10 }}>{arr}{d ? Math.abs(d) : ''}</span>
                    <span style={{ color: '#475569', fontSize: 9 }}>|</span>
                  </span>
                );
              })}
          </div>
        </div>
        <div style={{ background: '#0F2447', padding: '0 12px', height: '100%',
          display: 'flex', alignItems: 'center', flexShrink: 0, gap: 6,
          borderLeft: '1px solid #1e3a5f' }}>
          <span style={{ fontSize: 9, color: '#64748B' }}>PROCH. MÀJ</span>
          <span className="countdown" style={{ fontSize: 11, fontWeight: 800,
            color: countdown < '05:00' ? '#F87171' : '#4ADE80', fontFamily: 'monospace' }}>
            {countdown || '30:00'}
          </span>
        </div>
      </div>

      {/* ── Header ──────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
        marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <button onClick={goBack} style={{ background: 'none', border: 'none', color: C.blueL,
            cursor: 'pointer', fontSize: 12, fontWeight: 600, marginBottom: 10,
            display: 'flex', alignItems: 'center', gap: 4, padding: 0 }}>
            ← Retour
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <h1 style={{ fontSize: '1.45rem', fontWeight: 800, color: C.navy, margin: 0 }}>
              Classement IA — Auditeurs Produit
            </h1>
            <span className="ai-tag">✦ IA</span>
          </div>
          <p style={{ fontSize: 12, color: C.muted, margin: 0 }}>
            Gradient Boosting 97.5% · Qualité 40% · Activité 30% · Certification 30%
          </p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
          {/* Badge statut IA */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11,
            fontWeight: 600, padding: '5px 12px', borderRadius: 99,
            background: statusBadge.bg, color: statusBadge.color,
            border: `1px solid ${statusBadge.color}44` }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%',
              background: statusBadge.color, display: 'inline-block',
              animation: 'pulse 1.5s infinite' }} />
            {statusBadge.label}
          </div>
          {lastSync && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
              <span style={{ fontSize: 10, color: C.muted }}>
                Dernière MÀJ : <strong>
                  {lastSync.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </strong>
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10 }}>
                <span style={{ color: C.muted }}>Prochaine dans</span>
                <span className="countdown" style={{ fontWeight: 800,
                  color: countdown < '05:00' ? C.rose : C.blue,
                  fontFamily: 'monospace', fontSize: 13 }}>{countdown || '30:00'}</span>
              </div>
            </div>
          )}
          <button onClick={() => fetchData()} style={{ ...sel, fontSize: 11,
            display: 'flex', alignItems: 'center', gap: 6 }}>
            <span className={refreshing ? 'refreshing' : ''} style={{ display: 'inline-block' }}>↻</span>
            Forcer MÀJ
          </button>
        </div>
      </div>

      {/* ── KPIs ────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
        gap: 10, marginBottom: 16 }}>
        <MetCard label="Auditeurs total"   value={enriched.length}   color={C.navy} />
        <MetCard label="Niveau TOP"        value={topCount}           color={C.green} sub="Score ≥ 80/100" />
        <MetCard label="Score IA moyen"    value={`${avgScore}/100`}  color={avgScore >= 65 ? C.blue : C.gold} />
        <MetCard label="Promos suggérées"  value={promoCount}         color={C.teal}  sub="par l'IA" />
        <MetCard label="À risque"          value={risqueCount}        color={risqueCount > 0 ? C.rose : C.green} sub="Score < 45" />
        <MetCard label="Scores ML réels"   value={`${mlCount}/${enriched.length}`}
          color={mlCount === enriched.length ? C.green : C.gold}
          sub={mlCount === enriched.length ? 'Gradient Boosting' : 'Partiels'} />
      </div>

      {/* ── Filtres ─────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginBottom: 12 }}>
        <input style={{ ...sel, flex: 1, minWidth: 200 }}
          placeholder="Rechercher nom, plant, segment…"
          value={search} onChange={e => setSearch(e.target.value)} />
        <select style={{ ...sel, minWidth: 150 }} value={filterPlant} onChange={e => setFilterPlant(e.target.value)}>
          <option value="">Tous les plants</option>
          {plants.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
        <select style={{ ...sel, minWidth: 140 }} value={filterNiveau} onChange={e => setFilterNiveau(e.target.value)}>
          <option value="">Tous niveaux IA</option>
          <option value="TOP">◆ TOP (≥80)</option>
          <option value="BON">◉ BON (65-79)</option>
          <option value="MOYEN">◈ MOYEN (45-64)</option>
          <option value="A_RISQUE">◇ À RISQUE (&lt;45)</option>
        </select>
        <select style={{ ...sel, minWidth: 170 }} value={sortKey} onChange={e => setSortKey(e.target.value)}>
          <option value="scoreFinal">Trier : Score IA global</option>
          <option value="qualite">Trier : Score qualité</option>
          <option value="activite">Trier : Score activité</option>
          <option value="certif">Trier : Score certification</option>
          <option value="audits">Trier : Nb audits</option>
        </select>
        <span style={{ fontSize: 11, color: C.muted, fontWeight: 500 }}>{filtered.length} auditeur(s)</span>
      </div>

      {/* ── Légende ─────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 14, fontSize: 11, color: C.muted }}>
        {Object.entries(NIV).map(([k, v]) => (
          <span key={k} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 8, height: 8, borderRadius: 2, background: v.color }} />
            {v.label}
          </span>
        ))}
        <span style={{ color: C.blue }}>· Cliquer pour le détail IA</span>
      </div>

      {/* ── Tableau ─────────────────────────────────── */}
      {loading ? (
        <div style={{ background: '#fff', borderRadius: 16, border: `1px solid ${C.border}`,
          padding: '3rem', textAlign: 'center', color: C.muted }}>
          <div style={{ fontSize: 24, marginBottom: 8 }}>⟳</div>
          Appel du modèle Gradient Boosting en cours…
        </div>
      ) : (
        <div style={{ background: '#fff', borderRadius: 16, border: `1px solid ${C.border}`,
          overflow: 'hidden', boxShadow: '0 1px 16px rgba(10,22,40,.06)' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ background: '#EEF2FF', borderBottom: `2px solid ${C.border}` }}>
                  {[['#','40px'],['Auditeur',''],['Plant',''],['Niveau IA','100px'],
                    ['Score ML','110px'],['Activité','80px'],['Qualité','80px'],
                    ['Certif.','80px'],['Radar','80px']
                  ].map(([h, w]) => (
                    <th key={h} style={{ padding: '10px 12px', textAlign: 'left',
                      fontSize: 10, fontWeight: 700, color: C.muted,
                      textTransform: 'uppercase', letterSpacing: '.06em',
                      width: w || 'auto', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((a, i) => {
                  const sc     = a.aiScores;
                  const isOpen = expanded === a.id;
                  const isUp   = flashUp.has(a.id);
                  const isDown = flashDown.has(a.id);
                  const diff   = scoreDiff[a.id];
                  const rDiff  = rankDiff[a.id];
                  const rowCls = `row-hover${isUp ? ' flash-up' : isDown ? ' flash-down' : ''}`;
                  return [
                    <tr key={a.id} className={rowCls}
                      onClick={() => setExpanded(isOpen ? null : a.id)}
                      style={{ borderBottom: isOpen ? 'none' : `1px solid ${C.border}`,
                        background: isOpen ? '#F1F5F9' : 'transparent' }}>

                      {/* Rang */}
                      <td style={{ padding: '10px 12px', width: 40 }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                          <RankIcon rank={i + 1} />
                          {rDiff !== undefined && rDiff !== 0 && (
                            <span style={{ fontSize: 8, fontWeight: 700,
                              color: rDiff > 0 ? C.green : C.rose }}>
                              {rDiff > 0 ? `▲${rDiff}` : `▼${Math.abs(rDiff)}`}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Auditeur */}
                      <td style={{ padding: '10px 12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <Avatar name={a.nom} idx={i} />
                          <div>
                            <div style={{ fontWeight: 700, color: C.navy, fontSize: 13 }}>{a.nom}</div>
                            <div style={{ fontSize: 10, color: C.muted, marginTop: 1 }}>
                              {a.matricule || `ID ${a.id}`}
                              {sc.recommande && (
                                <span style={{ marginLeft: 6, color: C.green, fontWeight: 700 }}>✦ PROMO</span>
                              )}
                              {sc.sourceML && (
                                <span style={{ marginLeft: 6, color: C.blue, fontWeight: 700, fontSize: 9 }}>ML</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Plant */}
                      <td style={{ padding: '10px 12px' }}>
                        <div style={{ fontWeight: 600, fontSize: 12, color: C.text }}>{a.plant}</div>
                        <div style={{ fontSize: 10, color: C.muted }}>{a.segment}</div>
                      </td>

                      {/* Niveau */}
                      <td style={{ padding: '10px 12px' }}><NiveauBadge niveau={sc.niveau} /></td>

                      {/* Score ML */}
                      <td style={{ padding: '10px 14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <ScoreRing score={sc.scoreFinal} />
                          <div style={{ flex: 1 }}>
                            <div style={{ height: 4, borderRadius: 99, background: C.border, overflow: 'hidden' }}>
                              <div style={{ height: '100%', width: `${sc.scoreFinal}%`,
                                borderRadius: 99, transition: 'width .6s',
                                background: sc.scoreFinal >= 80 ? C.green
                                  : sc.scoreFinal >= 65 ? C.blue
                                  : sc.scoreFinal >= 45 ? C.gold : C.rose }} />
                            </div>
                            {/* ✅ Badge confiance ML */}
                            {sc.confiance && (
                              <div style={{ fontSize: 9, color: C.muted, marginTop: 2 }}>
                                ML · confiance{' '}
                                <strong style={{ color: sc.confiance >= 80 ? C.green : C.gold }}>
                                  {sc.confiance}%
                                </strong>
                              </div>
                            )}
                            {/* Delta score */}
                            {diff !== undefined && (
                              <div style={{ fontSize: 9, fontWeight: 700, marginTop: 1,
                                color: diff > 0 ? C.green : C.rose }}>
                                {diff > 0 ? '▲' : '▼'} {Math.abs(diff)} pt
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Activité */}
                      <td style={{ padding: '10px 12px' }}>
                        <div style={{ fontWeight: 700, fontSize: 14, color: C.teal }}>{sc.scoreActivite}</div>
                        <div style={{ fontSize: 9, color: C.muted }}>/100</div>
                      </td>

                      {/* Qualité */}
                      <td style={{ padding: '10px 12px' }}>
                        <div style={{ fontWeight: 700, fontSize: 14, color: C.blue }}>{sc.scoreQualite}</div>
                        <div style={{ fontSize: 9, color: C.muted }}>/100</div>
                      </td>

                      {/* Certif */}
                      <td style={{ padding: '10px 12px' }}>
                        <div style={{ fontWeight: 700, fontSize: 14, color: C.gold }}>{sc.scoreCertif}</div>
                        <div style={{ fontSize: 9, color: C.muted }}>/100</div>
                      </td>

                      {/* Radar */}
                      <td style={{ padding: '10px 12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <RadarMini scores={[sc.scoreActivite, sc.scoreQualite, sc.scoreCertif]} />
                          <span style={{ fontSize: 10, color: C.muted }}>{isOpen ? '▲' : '▼'}</span>
                        </div>
                      </td>
                    </tr>,

                    isOpen && (
                      <DetailPanel key={`detail-${a.id}`} a={a} scores={sc} onNavigate={handleViewProfile} />
                    ),
                  ];
                })}
                {filtered.length === 0 && (
                  <tr><td colSpan={9} style={{ textAlign: 'center', padding: '2.5rem', color: C.muted }}>
                    Aucun auditeur trouvé
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Footer */}
          <div style={{ padding: '12px 20px', borderTop: `1px solid ${C.border}`,
            background: '#FAFBFD', display: 'flex', gap: 20, flexWrap: 'wrap',
            fontSize: 10, color: C.muted, alignItems: 'center' }}>
            <span style={{ fontWeight: 700, color: C.navy }}>Modèle ML v2.0</span>
            <span>Qualité <strong style={{ color: C.blue }}>40%</strong> — QK, taux vert, PDCA</span>
            <span>Activité <strong style={{ color: C.teal }}>30%</strong> — volume, ponctualité, délai</span>
            <span>Certification <strong style={{ color: C.gold }}>30%</strong> — théorie, pratique, réussite</span>
            <span style={{ marginLeft: 'auto', color: iaStatus === 'ml' ? C.green : C.gold, fontWeight: 700 }}>
              {iaStatus === 'ml'       ? '✦ Gradient Boosting — 97.5% accuracy'
               : iaStatus === 'fallback' ? '⚙ Fallback JS'
               : iaStatus === 'demo'     ? '⚠ Données démo'
               : '…'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Données DÉMO (fallback si API complètement indisponible) ── */
const DEMO_EXTENDED = [
  {
    id: 1, prenom: 'Karim', nom: 'Mansouri', matricule: 'MAT0001',
    plantNom: 'BMW G2X — Nabeul', segmentNom: 'Seg 32',
    nbAuditsTotal: 28, nbAuditsTermines: 26, nbAuditsEnRetard: 1, nbAuditsEnCours: 1,
    delaiMoyenJours: 3, qkMoyenGlobal: 0.08, nbQkVert: 22, nbPdcaDeclenches: 0, nbQkCritique: 1,
    tauxRetardPct: 3.6, tauxConformite: 88,
    nbCertificationsTentees: 3, nbCertificationsReussies: 3,
    scoreTheoMoyen: 18.5, scorePratMoyen: 92, estBloqueCertif: false, nbQualifications: 3,
  },
  {
    id: 2, prenom: 'Inès', nom: 'Haddad', matricule: 'MAT0002',
    plantNom: 'VW MQB — Mateur', segmentNom: 'Seg 15',
    nbAuditsTotal: 24, nbAuditsTermines: 22, nbAuditsEnRetard: 2, nbAuditsEnCours: 0,
    delaiMoyenJours: 5, qkMoyenGlobal: 0.12, nbQkVert: 19, nbPdcaDeclenches: 1, nbQkCritique: 2,
    tauxRetardPct: 8.3, tauxConformite: 74,
    nbCertificationsTentees: 2, nbCertificationsReussies: 2,
    scoreTheoMoyen: 17, scorePratMoyen: 88, estBloqueCertif: false, nbQualifications: 2,
  },
  {
    id: 3, prenom: 'Youssef', nom: 'Trabelsi', matricule: 'MAT0003',
    plantNom: 'MB S-Class — Sousse', segmentNom: 'Seg 8',
    nbAuditsTotal: 20, nbAuditsTermines: 18, nbAuditsEnRetard: 2, nbAuditsEnCours: 0,
    delaiMoyenJours: 7, qkMoyenGlobal: 0.18, nbQkVert: 14, nbPdcaDeclenches: 1, nbQkCritique: 2,
    tauxRetardPct: 10, tauxConformite: 70,
    nbCertificationsTentees: 3, nbCertificationsReussies: 2,
    scoreTheoMoyen: 16, scorePratMoyen: 84, estBloqueCertif: false, nbQualifications: 2,
  },
  {
    id: 4, prenom: 'Salma', nom: 'Belhaj', matricule: 'MAT0004',
    plantNom: 'BMW G2X — Nabeul', segmentNom: 'Seg 31',
    nbAuditsTotal: 18, nbAuditsTermines: 15, nbAuditsEnRetard: 3, nbAuditsEnCours: 0,
    delaiMoyenJours: 9, qkMoyenGlobal: 0.22, nbQkVert: 11, nbPdcaDeclenches: 2, nbQkCritique: 3,
    tauxRetardPct: 16.7, tauxConformite: 61,
    nbCertificationsTentees: 2, nbCertificationsReussies: 1,
    scoreTheoMoyen: 15, scorePratMoyen: 78, estBloqueCertif: false, nbQualifications: 1,
  },
  {
    id: 5, prenom: 'Mohamed', nom: 'Aziz', matricule: 'MAT0005',
    plantNom: 'Audi MLB — Monastir', segmentNom: 'Seg 22',
    nbAuditsTotal: 15, nbAuditsTermines: 12, nbAuditsEnRetard: 3, nbAuditsEnCours: 0,
    delaiMoyenJours: 12, qkMoyenGlobal: 0.30, nbQkVert: 8, nbPdcaDeclenches: 2, nbQkCritique: 3,
    tauxRetardPct: 20, tauxConformite: 58,
    nbCertificationsTentees: 2, nbCertificationsReussies: 1,
    scoreTheoMoyen: 13, scorePratMoyen: 70, estBloqueCertif: false, nbQualifications: 1,
  },
  {
    id: 6, prenom: 'Hamza', nom: 'Chouchane', matricule: 'MAT0006',
    plantNom: 'MB S-Class — Sousse', segmentNom: 'Seg 4',
    nbAuditsTotal: 10, nbAuditsTermines: 7, nbAuditsEnRetard: 4, nbAuditsEnCours: 0,
    delaiMoyenJours: 20, qkMoyenGlobal: 0.50, nbQkVert: 4, nbPdcaDeclenches: 4, nbQkCritique: 5,
    tauxRetardPct: 40, tauxConformite: 35,
    nbCertificationsTentees: 2, nbCertificationsReussies: 0,
    scoreTheoMoyen: 10, scorePratMoyen: 48, estBloqueCertif: true, nbQualifications: 0,
  },
  {
    id: 7, prenom: 'Nadia', nom: 'Khelifi', matricule: 'MAT0007',
    plantNom: 'BMW G2X — Nabeul', segmentNom: 'Seg 33',
    nbAuditsTotal: 7, nbAuditsTermines: 4, nbAuditsEnRetard: 4, nbAuditsEnCours: 0,
    delaiMoyenJours: 25, qkMoyenGlobal: 0.65, nbQkVert: 2, nbPdcaDeclenches: 5, nbQkCritique: 6,
    tauxRetardPct: 57, tauxConformite: 28,
    nbCertificationsTentees: 1, nbCertificationsReussies: 0,
    scoreTheoMoyen: 8, scorePratMoyen: 35, estBloqueCertif: true, nbQualifications: 0,
  },
];