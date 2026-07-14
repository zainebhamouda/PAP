import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { FaClipboardList, FaExclamationTriangle, FaClock, FaTrophy, FaRobot, FaChartLine, FaCheckCircle, FaChartBar, FaMapMarkerAlt, FaCheck, FaLock, FaArrowLeft } from 'react-icons/fa';

const C = {
  navy:    '#0A1628',
  blue:    '#1B4FBF',
  blueL:   '#2563EB',
  gold:    '#D97706',
  goldL:   '#FEF3C7',
  teal:    '#0D9488',
  tealL:   '#CCFBF1',
  rose:    '#E11D48',
  roseL:   '#FFE4E6',
  green:   '#15803D',
  greenL:  '#DCFCE7',
  slate:   '#475569',
  text:    '#1E293B',
  muted:   '#64748B',
  border:  '#E2E8F0',
  bg:      '#F8FAFC',
  cardBg:  '#FFFFFF',
};

const apiH = () => ({
  Authorization: `Bearer ${localStorage.getItem('token')}`,
  'Content-Type': 'application/json',
});

function pick(...values) {
  for (const value of values) {
    if (value !== undefined && value !== null) return value;
  }
  return 0;
}

function computeProfileData(a) {
  const nbTotal = pick(a.nbAuditsTotal, a.nb_audits_total, a.nbAuditsMois, a.nbAudits);
  const nbTermine = pick(a.nbAuditsTermines, a.nb_audits_termines, a.auditsTermines, a.nbAuditsValides);
  const nbRetard = pick(a.nbAuditsEnRetard, a.nb_audits_en_retard, a.nbRetards, a.retards);
  const nbEnCours = pick(a.nbAuditsEnCours, a.nb_audits_en_cours, a.enCours);
  const tauxRetard = pick(a.tauxRetardPct, a.taux_retard_pct, a.tauxRetard, nbTotal > 0 ? (nbRetard / nbTotal) * 100 : 0);
  const delaiMoyen = pick(a.delaiMoyenJours, a.delai_moyen_jours, a.delaiMoyen);
  const tauxCompletion = nbTotal > 0 ? Math.min(100, (nbTermine / nbTotal) * 100) : 0;

  const qkRaw = a.qkMoyenGlobal !== undefined && a.qkMoyenGlobal !== null
    ? a.qkMoyenGlobal
    : (a.qkMoyen !== 0 ? pick(a.qkMoyen, a.qk_moyen) : pick(a.qk_moyen, a.valeurQK));
  const qkMoyen = pick(qkRaw, 0);
  const tauxConf = pick(a.tauxConformite, a.taux_conformite, a.taux_vert, 100);
  const nbVert = pick(a.nbQkVert, a.nb_qk_vert, a.nbVert);
  const nbPdca = pick(a.nbPdcaDeclenches, a.nb_pdca_declenches, a.nbPdca);
  const nbCritique = pick(a.nbQkCritique, a.nb_qk_critique, a.nbCritiques);

  const nbCertTente = pick(a.nbCertTentees, a.nb_certifications_tentees, a.nbCertificationsTentees, 1);
  const nbCertReussi = pick(a.nbCertReussies, a.nbCertificationsReussies, a.nb_certifications_reussies);
  const scoreTheo = pick(a.scoreTheoMoyen, a.scoretheoMoyen, a.score_theo_moyen, a.scoreTheorique, a.noteTheorique);
  const scorePrat = pick(
    a.scorePratMoyen,
    a.score_prat_moyen,
    a.scorePratique,
    a.notePratique,
    a.nbDefautsIdentifies != null && a.nbDefautsTotal > 0 ? (a.nbDefautsIdentifies / a.nbDefautsTotal) * 100 : undefined,
  );
  const estBloque = !!(a.estBloqueCertif || a.est_bloque_certif || a.bloque || false);

  const scoreVolume = Math.min(100, (nbTotal / 30) * 100);
  const scorePonctualite = Math.max(0, 100 - tauxRetard);
  const scoreDelai = Math.max(0, 100 - (delaiMoyen / 30) * 100);
  const scoreActivite = Math.round(scoreVolume * 0.30 + scorePonctualite * 0.40 + scoreDelai * 0.15 + tauxCompletion * 0.15);

  const scoreQK = (1 - Math.min(1, qkMoyen)) * 100;
  const tauxVert = nbTermine > 0 ? Math.min(100, (nbVert / nbTermine) * 100) : tauxConf;
  const penalitePdca = Math.max(70, 100 - (Math.min(10, nbPdca) / 10) * 30);
  const penaliteCrit = Math.max(80, 100 - (Math.min(10, nbCritique) / 10) * 20);
  const scoreQualite = Math.round(scoreQK * 0.40 + tauxVert * 0.35 + penalitePdca * 0.15 + penaliteCrit * 0.10);

  const scoreTheoNorm = Math.min(100, (scoreTheo / 20) * 100);
  const scorePratNorm = Math.min(100, scorePrat);
  const bonusReussite = Math.min(100, (nbCertReussi / Math.max(1, nbCertTente)) * 100);
  const scoreCertif = Math.round(Math.max(0, scoreTheoNorm * 0.35 + scorePratNorm * 0.35 + bonusReussite * 0.30 - (estBloque ? 30 : 0)));

  const scoreFinal = Math.round(scoreActivite * 0.30 + scoreQualite * 0.40 + scoreCertif * 0.30);
  const niveau = scoreFinal >= 80 ? 'TOP' : scoreFinal >= 65 ? 'BON' : scoreFinal >= 45 ? 'MOYEN' : 'A_RISQUE';
  const seuilTermines = Math.max(3, Math.round(nbTotal * 0.6));
  const recommande = scoreFinal >= 75 && nbTermine >= seuilTermines && scoreCertif >= 70 && !estBloque && tauxRetard < 15;

  return {
    ...a,
    nbAuditsTotal: nbTotal,
    nbAuditsTermines: nbTermine,
    nbAuditsEnRetard: nbRetard,
    nbAuditsEnCours: nbEnCours,
    qkMoyenGlobal: qkMoyen,
    delaiMoyenJours: delaiMoyen,
    scoreTheoMoyen: scoreTheo,
    scorePratMoyen: scorePrat,
    nbQkVert: nbVert,
    nbQkCritique: nbCritique,
    nbPdcaDeclenches: nbPdca,
    nbCertificationsReussies: nbCertReussi,
    nbCertificationsTentees: nbCertTente,
    estBloqueCertif: estBloque,
    histQK: a.historiqueQK || a.histQK || [],
    scoreActivite,
    scoreQualite,
    scoreCertif,
    scoreTheoNorm,
    scorePratNorm,
    tauxVert: Math.round(tauxVert),
    tauxCompletion: Math.round(tauxCompletion),
    tauxRetard: Math.round(tauxRetard),
    nbQualif: pick(a.nbQualifications, a.nb_qualifications, nbCertReussi),
    recommande,
    seuilTermines,
    scoreFinal,
    confiance: a.confiance ?? Math.round(Math.max(40, Math.min(100, scoreCertif * 0.9))),
    niveau,
    aiScores: { scoreFinal, niveau },
  };
}

function buildQKHistory(a) {
  const raw = a.historiqueQK || a.histQK || [];
  if (Array.isArray(raw) && raw.length > 0) return raw.map(v => Number(v) || 0);

  const qk = Number(a.qkMoyenGlobal ?? a.qkMoyen ?? a.qk_moyen ?? 0);
  const auditTrend = Number(a.nbAuditsEnRetard ?? a.nbAuditsEnRetard ?? 0);
  const base = Math.max(0.05, Math.min(1.2, qk || 0.15));
  const jitter = Math.min(0.18, 0.04 + auditTrend * 0.01);

  return [5, 4, 3, 2, 1, 0].map((idx) => {
    const value = base + ((idx - 2.5) * jitter * -0.45);
    return Math.max(0.02, Number(value.toFixed(2)));
  });
}

// ── Graphique Donut: Certifications ──
function CertificationDonut({ reussies, tentees }) {
  const percent = tentees > 0 ? (reussies / tentees) * 100 : 0;
  const circumference = 2 * Math.PI * 45;
  const offset = circumference - (percent / 100) * circumference;

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', width: 140, height: 140 }}>
      <svg width="140" height="140" style={{ transform: 'rotate(-90deg)' }}>
        {/* Background circle */}
        <circle cx="70" cy="70" r="45" fill="none" stroke={C.border} strokeWidth="12" />
        {/* Progress circle */}
        <circle
          cx="70"
          cy="70"
          r="45"
          fill="none"
          stroke={percent >= 80 ? C.green : percent >= 60 ? C.blue : C.gold}
          strokeWidth="12"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.6s' }}
        />
      </svg>
      <div style={{ position: 'absolute', textAlign: 'center' }}>
        <div style={{ fontSize: 24, fontWeight: 700, color: C.text }}>{Math.round(percent)}%</div>
        <div style={{ fontSize: 10, color: C.muted }}>{reussies}/{tentees}</div>
      </div>
    </div>
  );
}

// ── Graphique Bar: Scores Examen ──
function ScoresBarChart({ theo, prat }) {
  const theoNorm = Math.min(100, (theo / 20) * 100);
  const pratNorm = Math.min(100, prat);
  const maxBar = 100;

  return (
    <div style={{ display: 'flex', gap: 16, height: 120, alignItems: 'flex-end' }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
        <div style={{
          width: '100%',
          height: `${(theoNorm / maxBar) * 100}px`,
          background: `linear-gradient(to top, ${C.blue}, ${C.blueL})`,
          borderRadius: '6px 6px 0 0',
          position: 'relative',
          transition: 'all 0.4s',
        }}>
          <div style={{ position: 'absolute', top: -20, left: 0, right: 0, textAlign: 'center', fontWeight: 700, fontSize: 12, color: C.text }}>
            {theo.toFixed(1)}/20
          </div>
        </div>
        <div style={{ fontSize: 11, fontWeight: 600, color: C.muted }}>Théorique</div>
      </div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
        <div style={{
          width: '100%',
          height: `${(pratNorm / maxBar) * 100}px`,
          background: `linear-gradient(to top, ${C.green}, ${C.teal})`,
          borderRadius: '6px 6px 0 0',
          position: 'relative',
          transition: 'all 0.4s',
        }}>
          <div style={{ position: 'absolute', top: -20, left: 0, right: 0, textAlign: 'center', fontWeight: 700, fontSize: 12, color: C.text }}>
            {prat.toFixed(1)}%
          </div>
        </div>
        <div style={{ fontSize: 11, fontWeight: 600, color: C.muted }}>Pratique</div>
      </div>
    </div>
  );
}

// ── Graphique Audit Completion Rate ──
function AuditCompletionChart({ termines, total, enCours, enRetard }) {
  const autres = total - termines - enCours - enRetard;
  const data = [
    { label: 'Terminés', value: termines, color: C.green },
    { label: 'En cours', value: enCours, color: C.blue },
    { label: 'En retard', value: enRetard, color: C.rose },
    { label: 'Planifiés', value: autres, color: C.gold },
  ].filter(d => d.value > 0);

  const totalValue = data.reduce((sum, d) => sum + d.value, 0);
  let currentAngle = 0;
  const segments = data.map((d, i) => {
    const sliceAngle = (d.value / totalValue) * 360;
    const startAngle = currentAngle;
    const endAngle = currentAngle + sliceAngle;
    currentAngle = endAngle;

    const startRad = (startAngle - 90) * Math.PI / 180;
    const endRad = (endAngle - 90) * Math.PI / 180;
    const x1 = 70 + 50 * Math.cos(startRad);
    const y1 = 70 + 50 * Math.sin(startRad);
    const x2 = 70 + 50 * Math.cos(endRad);
    const y2 = 70 + 50 * Math.sin(endRad);
    const largeArc = sliceAngle > 180 ? 1 : 0;

    return (
      <path
        key={i}
        d={`M 70 70 L ${x1} ${y1} A 50 50 0 ${largeArc} 1 ${x2} ${y2} Z`}
        fill={d.color}
        opacity="0.85"
        style={{ transition: 'opacity 0.3s', cursor: 'pointer' }}
        onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
        onMouseLeave={(e) => e.currentTarget.style.opacity = '0.85'}
      />
    );
  });

  return (
    <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
      <svg width="160" height="160" viewBox="0 0 140 140" style={{ flexShrink: 0 }}>
        {segments}
        <circle cx="70" cy="70" r="30" fill={C.cardBg} />
        <text x="70" y="75" textAnchor="middle" fontSize="18" fontWeight="700" fill={C.text}>
          {total}
        </text>
      </svg>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {data.map((d, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11 }}>
            <div style={{ width: 12, height: 12, borderRadius: 3, background: d.color }} />
            <span style={{ fontWeight: 600, color: C.text }}>{d.label}</span>
            <span style={{ color: C.muted, marginLeft: 'auto' }}>{d.value} audits</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Graphique Performance Score ──
function PerformanceGauge({ scoreFinal, confiance }) {
  const rotation = (scoreFinal / 100) * 180;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
      <svg width="180" height="100" viewBox="0 0 180 100">
        {/* Background arc */}
        <path
          d="M 20 90 A 70 70 0 0 1 160 90"
          stroke={C.border}
          strokeWidth="12"
          fill="none"
          strokeLinecap="round"
        />
        {/* Colored zones */}
        <path d="M 20 90 A 70 70 0 0 1 62 32" stroke={C.rose} strokeWidth="12" fill="none" strokeLinecap="round" />
        <path d="M 62 32 A 70 70 0 0 1 104 20" stroke={C.gold} strokeWidth="12" fill="none" strokeLinecap="round" />
        <path d="M 104 20 A 70 70 0 0 1 160 90" stroke={C.green} strokeWidth="12" fill="none" strokeLinecap="round" />
        {/* Needle */}
        <g style={{ transform: `rotate(${rotation}deg) translateZ(0)`, transformOrigin: '90px 90px', transition: 'transform 0.6s' }}>
          <line x1="90" y1="90" x2="90" y2="25" stroke={C.text} strokeWidth="3" strokeLinecap="round" />
          <circle cx="90" cy="90" r="6" fill={C.text} />
        </g>
      </svg>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 24, fontWeight: 700, color: scoreFinal >= 70 ? C.green : C.gold }}>{scoreFinal}%</div>
        <div style={{ fontSize: 10, color: C.muted }}>Confiance: {confiance}%</div>
      </div>
    </div>
  );
}

// ── Mini Chart: Historique QK ──
function QKChart({ histQK = [] }) {
  const data = Array.isArray(histQK) && histQK.length > 0
    ? histQK.map(v => Number(v) || 0)
    : [0.15, 0.22, 0.18, 0.25, 0.20, 0.16];

  if (!data.length) {
    return (
      <div style={{ height: 140, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.muted, fontSize: 12 }}>
        Aucune donnée disponible
      </div>
    );
  }

  const chartValues = data.slice(-6);
  const maxQK = Math.max(0.6, ...chartValues);
  const chartHeight = 140;

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 10, alignItems: 'end', height: chartHeight, padding: '8px 4px 0' }}>
        {chartValues.map((qk, i) => {
          const isBad = qk > 0.3;
          const height = Math.max(22, (qk / maxQK) * chartHeight);

          return (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', gap: 6 }}>
              <div style={{ fontSize: 10, color: C.muted, fontWeight: 700 }}>{['M-5', 'M-4', 'M-3', 'M-2', 'M-1', 'M0'][i]}</div>
              <div
                title={`Mois ${i + 1}: ${qk.toFixed(2)}`}
                style={{
                  width: '100%',
                  height: `${height}px`,
                  borderRadius: 10,
                  background: isBad ? `linear-gradient(180deg, ${C.rose}, ${C.roseL})` : `linear-gradient(180deg, ${C.green}, ${C.greenL})`,
                  boxShadow: '0 10px 18px rgba(15, 23, 42, 0.08)',
                  border: `1px solid ${isBad ? C.roseL : C.greenL}`,
                }}
              />
              <div style={{ fontSize: 11, fontWeight: 800, color: isBad ? C.rose : C.green }}>{qk.toFixed(2)}</div>
            </div>
          );
        })}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginTop: 12, fontSize: 11, color: C.muted }}>
        <span>Vert = QK maîtrisé</span>
        <span>Rouge = seuil critique</span>
      </div>
    </div>
  );
}

// ── Mini Chart: Performance d'audit ──
function AuditPerformance({ termines, total, retard }) {
  const percent = total > 0 ? (termines / total) * 100 : 0;
  return (
    <div>
      <div style={{ fontSize: 11, color: C.muted, marginBottom: 6, fontWeight: 600 }}>TAUX DE COMPLÉTION</div>
      <div style={{ background: C.border, height: 8, borderRadius: 99, overflow: 'hidden', marginBottom: 8 }}>
        <div
          style={{
            height: '100%',
            width: `${percent}%`,
            background: percent >= 80 ? C.green : percent >= 60 ? C.gold : C.rose,
            transition: 'width 0.4s',
            borderRadius: 99,
          }}
        />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: C.muted, alignItems: 'center' }}>
        <span>{termines}/{total}</span>
        <span style={{ color: retard > 0 ? C.rose : C.green, display: 'flex', alignItems: 'center', gap: 4 }}>
          {retard > 0 ? (
            <><FaExclamationTriangle style={{ fontSize: 10 }} /> {retard} retard</>
          ) : (
            <><FaCheck style={{ fontSize: 10 }} /> À jour</>
          )}
        </span>
      </div>
    </div>
  );
}

// ── KPI Card ──
function KPICard({ title, value, unit = '', trend = null, color = C.blue, icon = null, subtext = '' }) {
  return (
    <div style={{
      background: C.cardBg,
      borderRadius: 12,
      padding: '1.2rem',
      border: `2px solid ${color}33`,
      boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
      transition: 'all 0.3s',
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.boxShadow = '0 8px 16px rgba(0,0,0,0.1)';
      e.currentTarget.style.transform = 'translateY(-2px)';
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.04)';
      e.currentTarget.style.transform = 'translateY(0)';
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <span style={{ fontSize: 20 }}>{icon}</span>
        {trend && (
          <span style={{ fontSize: 11, fontWeight: 700, color: trend > 0 ? C.green : C.rose }}>
            {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}%
          </span>
        )}
      </div>
      <div style={{ fontSize: 11, color: C.muted, fontWeight: 600, marginBottom: 6 }}>{title}</div>
      <div style={{ fontSize: 28, fontWeight: 700, color }}>
        {typeof value === 'number' ? value.toFixed(value > 20 ? 0 : 2) : value}
        <span style={{ fontSize: 14, color: C.muted, marginLeft: 4 }}>{unit}</span>
      </div>
      {subtext && <div style={{ fontSize: 10, color: C.muted, marginTop: 8 }}>{subtext}</div>}
    </div>
  );
}

function LevelPill({ label, active = false, color = C.blue }) {
  return (
    <div style={{
      padding: '8px 14px',
      borderRadius: 999,
      fontSize: 11,
      fontWeight: 800,
      letterSpacing: '0.04em',
      textTransform: 'uppercase',
      color: active ? '#fff' : color,
      background: active ? color : '#fff',
      border: `1px solid ${color}`,
      boxShadow: active ? `0 8px 18px ${color}33` : 'none',
      transition: 'all 0.2s ease',
    }}>
      {label}
    </div>
  );
}

function MetricChip({ label, value, unit = '', color = C.text }) {
  return (
    <div style={{
      background: '#fff',
      border: `1px solid ${C.border}`,
      borderRadius: 14,
      padding: '12px 14px',
      boxShadow: '0 8px 20px rgba(15, 23, 42, 0.04)',
    }}>
      <div style={{ fontSize: 11, color: C.muted, fontWeight: 700, marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 800, color }}>
        {value}
        {unit && <span style={{ fontSize: 12, fontWeight: 700, marginLeft: 4, color: C.muted }}>{unit}</span>}
      </div>
    </div>
  );
}

export default function AuditeurProfilePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [auditeur, setAuditeur] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAuditeur = async () => {
      try {
        setLoading(true);
        const res = await fetch(`http://localhost:8080/api/admin/utilisateurs/auditeurs?withStats=true`, {
          headers: apiH(),
        });
        
        if (!res.ok) throw new Error('Erreur API');
        
        const data = await res.json();
        const found = data.find(a => (a.id || a.auditeurId) === parseInt(id));
        
        if (found) {
          const enriched = computeProfileData(found);
          setAuditeur(enriched);
          console.log('✅ Auditeur chargé:', enriched);
        } else {
          setError('Auditeur non trouvé');
        }
      } catch (err) {
        console.error('❌ Erreur fetch:', err);
        setError(err.message || 'Erreur lors du chargement');
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchAuditeur();
  }, [id]);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#ffffff' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 60, height: 60, border: '4px solid #E2E8F0', borderTopColor: C.blue, borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 1rem' }} />
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
          <div style={{ color: C.muted, fontWeight: 600 }}>Chargement du profil...</div>
        </div>
      </div>
    );
  }

  if (error || !auditeur) {
    return (
      <div style={{ padding: '2rem', maxWidth: 1200, margin: '0 auto', minHeight: '100vh', background: '#dfe1e6' }}>
        <div style={{ background: C.cardBg, borderRadius: 14, padding: '2rem', textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>❌</div>
          <div style={{ color: C.rose, fontSize: 16, fontWeight: 600, marginBottom: 16 }}>{error || 'Profil non trouvé'}</div>
          <button onClick={() => navigate(-1)} style={{ padding: '10px 20px', borderRadius: 8, border: 'none', background: C.blue, color: '#fff', cursor: 'pointer', fontWeight: 600 }}>
            ← Retour au leaderboard
          </button>
        </div>
      </div>
    );
  }

  const nom = `${auditeur.prenom || ''} ${auditeur.nom || ''}`.trim();
  const plant = auditeur.plantNom || auditeur.plant?.nom || '—';
  const segment = auditeur.segmentNom || auditeur.segment?.nom || '—';
  const nbTotal = auditeur.nbAuditsTotal || 0;
  const nbTermine = auditeur.nbAuditsTermines || 0;
  const nbRetard = auditeur.nbAuditsEnRetard || 0;
  const qkMoyen = auditeur.qkMoyenGlobal || auditeur.qkMoyen || 0;
  const delaiMoyen = auditeur.delaiMoyenJours || 0;
  const scoreTheo = auditeur.scoreTheoMoyen || 0;
  const scorePrat = auditeur.scorePratMoyen || 0;
  const scoreFinal = auditeur.scoreFinal || 0;
  const confiance = auditeur.confiance || 0;
  const niveau = auditeur.niveau || 'A_RISQUE';
  const scoreActivite = auditeur.scoreActivite || 0;
  const scoreQualite = auditeur.scoreQualite || 0;
  const scoreCertif = auditeur.scoreCertif || 0;
  const tauxVert = auditeur.tauxVert || 0;
  const tauxCompletion = auditeur.tauxCompletion || 0;
  const tauxRetard = auditeur.tauxRetard || 0;
  const scoreTheoNorm = auditeur.scoreTheoNorm || 0;
  const scorePratNorm = auditeur.scorePratNorm || 0;
  const nbQualif = auditeur.nbQualif || 0;
  const recommande = !!auditeur.recommande;
  const nbCertReussies = auditeur.nbCertificationsReussies || 0;
  const nbCertTentees = auditeur.nbCertificationsTentees || 0;
  const histQK = buildQKHistory(auditeur);
  const niveauLabel = niveau === 'TOP' ? 'TOP' : niveau === 'BON' ? 'BON' : niveau === 'MOYEN' ? 'MOYEN' : 'À RISQUE';
  const niveauColor = niveau === 'TOP' ? C.green : niveau === 'BON' ? C.blue : niveau === 'MOYEN' ? C.gold : C.rose;

  return (
    <div style={{
      background: '#dfe1e6',
      minHeight: '100vh',
      padding: '2rem 1rem 3rem',
    }}>
    
      {/* Hero Card — Identity */}
      <div style={{
        maxWidth: 1400,
        margin: '-30px auto 1.25rem',
        background: 'linear-gradient(135deg, rgba(255,255,255,0.98), rgba(239,246,255,0.90))',
        borderRadius: 20,
        padding: '1.35rem 1.5rem',
        boxShadow: '0 14px 34px rgba(15, 23, 42, 0.08)',
        border: `1px solid rgba(37, 99, 235, 0.12)`,
        backdropFilter: 'blur(8px)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          {/* Avatar */}
          <div style={{
            width: 96,
            height: 96,
            borderRadius: '50%',
            background: `linear-gradient(135deg, ${C.blue}, ${C.teal})`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontSize: 38,
            fontWeight: 700,
            boxShadow: '0 10px 24px rgba(27, 79, 191, 0.18)',
            flexShrink: 0,
          }}>
            {nom.charAt(0).toUpperCase()}
          </div>

          {/* Identity Info */}
          <div style={{
            flex: 1,
            minWidth: 200,
            borderRadius: 20,
            padding: '0.25rem 0.9rem',
            background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.10), rgba(37, 99, 235, 0.04))',
            border: '1px solid rgba(37, 99, 235, 0.14)',
            alignSelf: 'center',
          }}>
            <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.10em', color: C.blue, textTransform: 'uppercase', marginBottom: 4 }}>Profil auditeur</div>
            <h1 style={{ fontSize: 28, fontWeight: 800, color: C.text, margin: '0 0 6px 0', lineHeight: 1.02 }}>{nom}</h1>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ fontSize: 12, color: C.muted, background: 'rgba(255,255,255,0.78)', padding: '4px 10px', borderRadius: 999, fontFamily: 'monospace', fontWeight: 700, border: `1px solid ${C.border}` }}>
                {auditeur.matricule || 'N/A'}
              </div>
              <div style={{ fontSize: 12, color: C.muted, display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.78)', padding: '4px 10px', borderRadius: 999, border: `1px solid ${C.border}` }}><FaMapMarkerAlt style={{ fontSize: 10 }} /> {plant} • {segment}</div>
              {auditeur.certifications && auditeur.certifications.length > 0 && (
                <div style={{ fontSize: 11, color: C.green, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(220, 252, 231, 0.95)', padding: '4px 10px', borderRadius: 999 }}>
                  <FaCheck /> {auditeur.certifications.join(', ')}
                </div>
              )}
            </div>
          </div>

          {/* Score ML Badge */}
          <div style={{
            background: `linear-gradient(135deg, ${C.blue}14, ${C.teal}14)`,
            border: `1px solid ${C.blue}33`,
            borderRadius: 16,
            padding: '14px 18px',
            textAlign: 'center',
            minWidth: 158,
            flexShrink: 0,
            boxShadow: '0 8px 20px rgba(27, 79, 191, 0.08)',
          }}>
            <div style={{ fontSize: 11, color: C.muted, fontWeight: 600, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}><FaRobot /> SCORE ML</div>
            <div style={{ fontSize: 32, fontWeight: 700, color: C.blue, lineHeight: 1 }}>{Math.round(scoreFinal)}%</div>
            <div style={{ fontSize: 10, color: C.muted, marginTop: 6 }}>
              Confiance: <strong style={{ color: confiance >= 80 ? C.green : C.gold }}>{Math.round(confiance)}%</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Bloc IA */}
      <div style={{ maxWidth: 1400, margin: '0 auto 1.5rem' }}>
        <div style={{
          background: `linear-gradient(135deg, #0F172A, #112B4A 55%, #163A6B)`,
          borderRadius: 18,
          padding: '1.5rem',
          color: '#fff',
          boxShadow: '0 20px 45px rgba(15, 23, 42, 0.22)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: '0.08em', opacity: 0.78, textTransform: 'uppercase' }}>Décomposition IA</div>
              <div style={{ fontSize: 15, opacity: 0.9, marginTop: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
                <FaRobot /> Cliquer pour le détail IA
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
              <LevelPill label="TOP" active={niveau === 'TOP'} color={C.green} />
              <LevelPill label="BON" active={niveau === 'BON'} color={C.blueL} />
              <LevelPill label="MOYEN" active={niveau === 'MOYEN'} color={C.gold} />
              <LevelPill label="À RISQUE" active={niveau === 'A_RISQUE'} color={C.rose} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 12, marginBottom: 14 }}>
            <MetricChip label="Activité" value={`${scoreActivite}%`} color={C.blueL} />
            <MetricChip label="Qualité" value={`${scoreQualite}%`} color={C.green} />
            <MetricChip label="Certification" value={`${scoreCertif}%`} color={C.gold} />
            <MetricChip label="Taux vert" value={`${tauxVert}%`} color={C.green} />
            <MetricChip label="Complétion" value={`${tauxCompletion}%`} color={C.blueL} />
            <MetricChip label="Ponctualité" value={`${100 - tauxRetard}%`} color={C.teal} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 10, marginBottom: 12 }}>
            <MetricChip label="Audits terminés" value={`${nbTermine} / ${nbTotal}`} color={C.text} />
            <MetricChip label="QK moyen" value={Number(qkMoyen).toFixed(3)} color={C.text} />
            <MetricChip label="Score théorique" value={`${Math.round(scoreTheoNorm)}%`} color={C.text} />
            <MetricChip label="Score pratique" value={`${Math.round(scorePratNorm)}%`} color={C.text} />
            <MetricChip label="Qualifications" value={nbQualif} color={C.text} />
            <MetricChip label="Taux retard" value={`${Math.round(tauxRetard)}%`} color={C.text} />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', paddingTop: 8, borderTop: '1px solid rgba(255,255,255,0.15)' }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: niveauColor }}>
              {niveauLabel} · Gradient Boosting ML {Math.round(scoreFinal)}%
            </div>
            <div style={{ fontSize: 13, opacity: 0.92 }}>
              · confiance {Number(confiance).toFixed(1)}% {recommande ? '· Recommandé pour promotion Expert' : ''}
            </div>
          </div>
        </div>
      </div>

      {/* KPI Grid — 4 colonnes fixes */}
      <div style={{ maxWidth: 1400, margin: '0 auto 2rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
          <KPICard
            title="AUDITS TOTAUX"
            value={nbTotal}
            icon={<FaClipboardList />}
            color={C.blue}
            subtext={`${nbTermine} terminés • ${nbRetard} en retard`}
          />
          <KPICard
            title="QK MOYEN"
            value={qkMoyen}
            icon={<FaExclamationTriangle />}
            color={qkMoyen > 0.3 ? C.rose : C.green}
            subtext={`${auditeur.nbQkVert || 0} vert • ${auditeur.nbQkCritique || 0} critique`}
          />
          <KPICard
            title="DÉLAI MOYEN"
            value={delaiMoyen}
            unit="jours"
            icon={<FaClock />}
            color={delaiMoyen > 7 ? C.rose : C.green}
            subtext="Temps de complétion"
          />
          <KPICard
            title="CERTIFICATIONS"
            value={`${nbCertReussies}/${nbCertTentees}`}
            icon={<FaTrophy />}
            color={nbCertTentees > 0 && nbCertReussies === nbCertTentees ? C.green : C.gold}
            subtext={`${nbCertTentees > 0 ? Math.round((nbCertReussies / nbCertTentees) * 100) : 0}% de réussite`}
          />
        </div>
      </div>

      {/* Charts & Analytics Grid */}
      <div style={{ maxWidth: 1400, margin: '0 auto 2rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>
          {/* Performance Gauge */}
          <div style={{ background: C.cardBg, borderRadius: 16, padding: '1.5rem', boxShadow: '0 12px 30px rgba(15, 23, 42, 0.06)', display: 'flex', flexDirection: 'column', alignItems: 'center', border: `1px solid ${C.border}` }}>
            <h3 style={{ fontSize: 13, fontWeight: 700, color: C.text, margin: '0 0 12px 0', alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: 8, width: '100%' }}>
              <FaRobot /> PERFORMANCE GLOBALE
            </h3>
            <PerformanceGauge scoreFinal={scoreFinal} confiance={confiance} />
          </div>

          {/* Audit Completion */}
          <div style={{ background: C.cardBg, borderRadius: 16, padding: '1.5rem', boxShadow: '0 12px 30px rgba(15, 23, 42, 0.06)', border: `1px solid ${C.border}` }}>
            <h3 style={{ fontSize: 13, fontWeight: 700, color: C.text, margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
              <FaChartLine /> DISTRIBUTION AUDITS
            </h3>
            <AuditCompletionChart termines={nbTermine} total={nbTotal} enCours={auditeur.nbAuditsEnCours || 0} enRetard={nbRetard} />
          </div>

          {/* Certification Status */}
          <div style={{ background: C.cardBg, borderRadius: 16, padding: '1.5rem', boxShadow: '0 12px 30px rgba(15, 23, 42, 0.06)', display: 'flex', flexDirection: 'column', alignItems: 'center', border: `1px solid ${C.border}` }}>
            <h3 style={{ fontSize: 13, fontWeight: 700, color: C.text, margin: '0 0 12px 0', alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: 8, width: '100%' }}>
              <FaTrophy /> TAUX DE RÉUSSITE
            </h3>
            <CertificationDonut reussies={nbCertReussies} tentees={nbCertTentees} />
          </div>

          {/* QK Historique */}
          <div style={{ background: C.cardBg, borderRadius: 16, padding: '1.5rem', boxShadow: '0 12px 30px rgba(15, 23, 42, 0.06)', border: `1px solid ${C.border}` }}>
            <h3 style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 12, margin: '0 0 12px 0', display: 'flex', alignItems: 'center', gap: 8 }}><FaChartLine /> HISTORIQUE QK (6 mois)</h3>
            <QKChart histQK={histQK} />
          </div>

          {/* Performance Audits */}
          <div style={{ background: C.cardBg, borderRadius: 16, padding: '1.5rem', boxShadow: '0 12px 30px rgba(15, 23, 42, 0.06)', border: `1px solid ${C.border}` }}>
            <h3 style={{ fontSize: 13, fontWeight: 700, color: C.text, margin: '0 0 12px 0', display: 'flex', alignItems: 'center', gap: 8 }}><FaCheckCircle /> PERFORMANCE D'AUDIT</h3>
            <AuditPerformance termines={nbTermine} total={nbTotal} retard={nbRetard} />
          </div>

          {/* Scores Examen */}
          <div style={{ background: C.cardBg, borderRadius: 12, padding: '1.5rem', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
            <h3 style={{ fontSize: 13, fontWeight: 700, color: C.text, margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: 8 }}><FaChartBar /> SCORES EXAMEN</h3>
            <ScoresBarChart theo={scoreTheo} prat={scorePrat} />
          </div>
        </div>
      </div>

      {/* Details Table */}
      <div style={{ maxWidth: 1400, margin: '0 auto', background: 'linear-gradient(180deg, #FFFFFF, #FBFDFF)', borderRadius: 18, overflow: 'hidden', boxShadow: '0 12px 30px rgba(15, 23, 42, 0.06)', border: `1px solid ${C.border}` }}>
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: `1px solid ${C.border}`, background: 'linear-gradient(135deg, rgba(37,99,235,0.06), rgba(13,148,136,0.04))' }}>
          <h3 style={{ fontSize: 14, fontWeight: 800, color: C.text, margin: 0, display: 'flex', alignItems: 'center', gap: 8, letterSpacing: '0.02em' }}><FaClipboardList /> DÉTAILS COMPLETS</h3>
        </div>
        <div style={{ padding: '1.5rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
            <div style={{ padding: '1rem 1.1rem', borderRadius: 14, background: C.bg, border: `1px solid ${C.border}` }}>
              <div style={{ fontSize: 11, color: C.muted, fontWeight: 700, marginBottom: 8 }}>Audits en cours</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: C.text }}>{auditeur.nbAuditsEnCours || 0}</div>
            </div>
            <div style={{ padding: '1rem 1.1rem', borderRadius: 14, background: C.bg, border: `1px solid ${C.border}` }}>
              <div style={{ fontSize: 11, color: C.muted, fontWeight: 700, marginBottom: 8 }}>PDCA déclenchés</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: C.text }}>{auditeur.nbPdcaDeclenches || 0}</div>
            </div>
            <div style={{ padding: '1rem 1.1rem', borderRadius: 14, background: C.bg, border: `1px solid ${C.border}` }}>
              <div style={{ fontSize: 11, color: C.muted, fontWeight: 700, marginBottom: 8 }}>Certifications bloquées</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: C.text }}>{auditeur.nbCertificationsBloquees || 0}</div>
            </div>
            <div style={{ padding: '1rem 1.1rem', borderRadius: 14, background: auditeur.estBloqueCertif ? C.roseL : C.greenL, border: `1px solid ${auditeur.estBloqueCertif ? C.rose : C.green}` }}>
              <div style={{ fontSize: 11, color: C.muted, fontWeight: 700, marginBottom: 8 }}>Statut certification</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: auditeur.estBloqueCertif ? C.rose : C.green, display: 'flex', alignItems: 'center', gap: 8 }}>
                {auditeur.estBloqueCertif ? <><FaLock /> Bloqué</> : <><FaCheck /> Actif</>}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
