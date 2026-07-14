/**
 * ══════════════════════════════════════════════════════════════════
 *  LEONI — AuditProduitApp.jsx
 *
 *  Intégration complète de useSmartNCInjector :
 *  → Quand l'auditeur remplit une annexe (4, 5, 6, 7, etc.)
 *    et valide, les non-conformités détectées sont
 *    automatiquement injectées dans l'Annexe 1B avec
 *    les bons codes défauts PI3010.
 *  → L'auditeur peut ensuite modifier ces défauts dans 1B.
 *  → Badge rouge sur chaque onglet annexe si NC détectées.
 *  → Option "Auto-injecter" en temps réel.
 * ══════════════════════════════════════════════════════════════════
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { useSmartNCInjector, extractDefautsFromAnnexe } from './useSmartNCInjector';

// Importer tous les formulaires existants
import { FormAnnexe1A, FormAnnexe1B } from './FormAnnexe1A_1B_LEONI';
import {
  FormAnnexe4,  FormAnnexe5,   FormAnnexe6,
  FormAnnexe7,  FormAnnexe7A,  FormAnnexe8,
  FormAnnexe10, FormAnnexe11A, FormAnnexe11B, FormAnnexe11C,
  FormAnnexe13A, FormAnnexe13B, FormAnnexe13C, FormAnnexe13D,
  FormAnnexePSA, FormAnnexeDPE,
} from './FormAnnexes_LEONI_Complete';

// ─── Couleurs LEONI ────────────────────────────────────────────────
const T = {
  navy:    '#001F4E',
  blue:    '#003F8A',
  mid:     '#0057B8',
  hdr:     '#E8F0FB',
  border:  '#001F4E',
  success: '#059669',
  warn:    '#D97706',
  danger:  '#DC2626',
  info:    '#2563EB',
  infoBg:  '#EFF6FF',
  infoBd:  '#BFDBFE',
  g50:     '#F7F9FC',
  g100:    '#EEF2F8',
  g200:    '#d0d5df',
  g400:    '#8A9BBC',
};

// ─── Config des onglets ────────────────────────────────────────────
const TABS = [
  { key: '1A',  label: 'Annexe 1A',    title: 'Monthly Report Overview' },
  { key: '1B',  label: 'Annexe 1B',    title: 'Fiche QK individuelle' },
  { key: '4',   label: 'Annexe 4',     title: 'Étapes de travail' },
  { key: '5',   label: 'Annexe 5',     title: 'Audit Processus Assemblage' },
  { key: '6',   label: 'Annexe 6',     title: 'Fils & Sertissage BMW' },
  { key: '7',   label: 'Annexe 7',     title: 'Dimensions & Bandage' },
  { key: '7A',  label: 'Annexe 7A',    title: 'Mesure Audi C-BEV' },
  { key: '8',   label: 'Annexe 8',     title: 'Fils torsadés BMW' },
  { key: '10',  label: 'Annexe 10',    title: 'Force traction Audi/VW' },
  { key: '11A', label: 'Annexe 11(a)', title: 'Force pelage USS' },
  { key: '11B', label: 'Annexe 11(b)', title: 'Torsadage Audi/VW' },
  { key: '11C', label: 'Annexe 11(c)', title: 'Torsadage Audi C-BEV' },
  { key: '13A', label: 'Annexe 13(a)', title: 'Audit Destructif — Tubes' },
  { key: '13B', label: 'Annexe 13(b)', title: 'Audit Destructif — Douilles' },
  { key: '13C', label: 'Annexe 13(c)', title: 'Audit Destructif — Joints' },
  { key: '13D', label: 'Annexe 13(d)', title: 'Audit Destructif — Contacts' },
  { key: 'PSA', label: 'Annexe PSA',   title: 'Contrôle PSA (Moteur Sud)' },
  { key: 'DPE', label: 'Annexe DPE',   title: 'Contrôle DPE (Moteur Sud)' },
];

// Annexes sources (celles qui peuvent générer des NC → Annexe 1B)
const SOURCE_ANNEXES = [
  '4','5','6','7','7A','8','10','11A','11B','11C','13A','13B','13C','13D','PSA'
];

// ─── Composant : rendu du formulaire selon la clé ─────────────────
function AnnexeForm({ tabKey, data, onChange, auditInfo }) {
  const props = { data, onChange, auditInfo };
  switch (tabKey) {
    case '1A':  return <FormAnnexe1A  {...props} />;
    case '4':   return <FormAnnexe4   {...props} />;
    case '5':   return <FormAnnexe5   {...props} />;
    case '6':   return <FormAnnexe6   {...props} />;
    case '7':   return <FormAnnexe7   {...props} />;
    case '7A':  return <FormAnnexe7A  {...props} />;
    case '8':   return <FormAnnexe8   {...props} />;
    case '10':  return <FormAnnexe10  {...props} />;
    case '11A': return <FormAnnexe11A {...props} />;
    case '11B': return <FormAnnexe11B {...props} />;
    case '11C': return <FormAnnexe11C {...props} />;
    case '13A': return <FormAnnexe13A {...props} />;
    case '13B': return <FormAnnexe13B {...props} />;
    case '13C': return <FormAnnexe13C {...props} />;
    case '13D': return <FormAnnexe13D {...props} />;
    case 'PSA': return <FormAnnexePSA {...props} />;
    case 'DPE': return <FormAnnexeDPE {...props} />;
    default:    return <div style={{ padding: 20, color: '#9CA3AF' }}>Formulaire non disponible</div>;
  }
}

// ─── Composant : Bannière NC détectées ────────────────────────────
function NCBanner({ count, annexeKey, onInject, onInjectAll }) {
  if (count === 0) return null;
  return (
    <div style={{
      background: '#FFFBEB',
      border: '1.5px solid #FCD34D',
      borderRadius: 6,
      padding: '8px 12px',
      marginBottom: 10,
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      flexWrap: 'wrap',
    }}>
      <span style={{ fontSize: 16 }}>⚠</span>
      <span style={{ fontSize: 11, fontWeight: 700, color: T.warn, flex: 1 }}>
        <strong>{count}</strong> non-conformité(s) détectée(s) automatiquement
        {annexeKey && ` dans l'Annexe ${annexeKey}`}
      </span>
      {onInject && (
        <button
          onClick={onInject}
          style={{
            padding: '5px 12px',
            background: T.navy,
            color: '#fff',
            border: 'none',
            borderRadius: 4,
            fontSize: 10,
            fontWeight: 800,
            cursor: 'pointer',
            fontFamily: 'Arial, sans-serif',
          }}
        >
          ↓ Injecter dans Annexe 1B
        </button>
      )}
      {onInjectAll && pendingCount > count && (
        <button
          onClick={onInjectAll}
          style={{
            padding: '5px 12px',
            background: T.danger,
            color: '#fff',
            border: 'none',
            borderRadius: 4,
            fontSize: 10,
            fontWeight: 800,
            cursor: 'pointer',
            fontFamily: 'Arial, sans-serif',
          }}
        >
          ↓ Tout injecter (toutes annexes)
        </button>
      )}
    </div>
  );
}

// ─── Toast notification ────────────────────────────────────────────
function Toast({ message, type, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
  }, [onClose]);

  const colors = {
    success: { bg: '#ECFDF5', border: '#A7F3D0', color: '#059669' },
    warn:    { bg: '#FFFBEB', border: '#FCD34D', color: '#D97706' },
    error:   { bg: '#FEF2F2', border: '#FECACA', color: '#DC2626' },
    info:    { bg: '#EFF6FF', border: '#BFDBFE', color: '#2563EB' },
  };
  const c = colors[type] || colors.info;

  return (
    <div style={{
      position: 'fixed',
      top: 16,
      right: 16,
      zIndex: 9999,
      background: c.bg,
      border: `1.5px solid ${c.border}`,
      color: c.color,
      padding: '10px 18px',
      borderRadius: 10,
      fontWeight: 700,
      fontSize: 13,
      boxShadow: '0 8px 24px rgba(0,0,0,.14)',
      maxWidth: 380,
      fontFamily: 'Arial, sans-serif',
      animation: 'slideIn .25s ease',
    }}>
      {message}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
//  COMPOSANT PRINCIPAL
// ══════════════════════════════════════════════════════════════════
export default function AuditProduitApp() {
  const [activeTab,  setActiveTab]  = useState('1B');
  const [formsData,  setFormsData]  = useState({});
  const [autoInject, setAutoInject] = useState(true);   // ← activé par défaut
  const [toast,      setToast]      = useState(null);
  const prevNCCountRef = useRef({});

  // Informations de l'audit (à brancher sur vos props/contexte réels)
  const auditInfo = {
    auditorName: 'Zaineb Hammouda',
    serie:       'BMW X3',
    plant:       'BMW',
    vehicleType: 'BMW X3',
    tab:         'TAB-2026-01',
    monthYear:   '05/2026',
  };

  // ── Hook Smart Injector ─────────────────────────────────────────
  const {
    analyzeAnnexe,
    injectInto1B,
    injectAnnexeInto1B,
    detectedByAnnexe,
    allDetected,
    pendingCount,
  } = useSmartNCInjector();

  // ── Helpers données formulaires ─────────────────────────────────
  const getFormData = (key) => formsData[key] || {};

  const setFormData = useCallback((key, data) => {
    setFormsData(prev => ({ ...prev, [key]: data }));
  }, []);

  // ── Afficher un toast ───────────────────────────────────────────
  const showToast = useCallback((message, type = 'info') => {
    setToast({ message, type });
  }, []);

  // ── Handler principal : modification d'une annexe ───────────────
  const handleAnnexeChange = useCallback((key, data) => {
    setFormData(key, data);

    if (!SOURCE_ANNEXES.includes(key)) return;

    // Analyse immédiate des NC
    const nc = analyzeAnnexe(key, data);

    // Toast si nouvelles NC détectées
    const prevCount = prevNCCountRef.current[key] || 0;
    if (nc.length > prevCount) {
      showToast(
        `${nc.length - prevCount} nouvelle(s) NC détectée(s) dans l'Annexe ${key}`,
        'warn'
      );
    }
    prevNCCountRef.current[key] = nc.length;

    // Injection automatique si activée
    if (autoInject && nc.length > 0) {
      setFormData('1B', prev1B => {
        const currentDefauts = prev1B?.defauts || [];
        const newDefauts = injectAnnexeInto1B(key, currentDefauts);
        // Ne mettre à jour que si de nouveaux défauts ont été ajoutés
        if (newDefauts.length === currentDefauts.length) return prev1B;
        const added = newDefauts.length - currentDefauts.length;
        if (added > 0) {
          showToast(`${added} défaut(s) injecté(s) automatiquement dans l'Annexe 1B ✓`, 'success');
        }
        return { ...prev1B, defauts: newDefauts };
      });
    }
  }, [analyzeAnnexe, autoInject, injectAnnexeInto1B, setFormData, showToast]);

  // ── Injecter les NC d'UNE annexe dans 1B (bouton manuel) ────────
  const handleInjectOne = useCallback((annexeKey) => {
    setFormData('1B', prev => {
      const currentDefauts = prev?.defauts || [];
      const newDefauts     = injectAnnexeInto1B(annexeKey, currentDefauts);
      const added          = newDefauts.length - currentDefauts.length;
      if (added > 0) {
        showToast(`${added} défaut(s) de l'Annexe ${annexeKey} ajouté(s) dans 1B ✓`, 'success');
      } else {
        showToast(`Les NC de l'Annexe ${annexeKey} sont déjà dans l'Annexe 1B`, 'info');
      }
      return { ...prev, defauts: newDefauts };
    });
  }, [injectAnnexeInto1B, setFormData, showToast]);

  // ── Injecter TOUTES les NC dans 1B ──────────────────────────────
  const handleInjectAll = useCallback(() => {
    setFormData('1B', prev => {
      const currentDefauts = prev?.defauts || [];
      const newDefauts     = injectInto1B(currentDefauts);
      const added          = newDefauts.length - currentDefauts.length;
      if (added > 0) {
        showToast(`${added} défaut(s) total injecté(s) dans l'Annexe 1B ✓`, 'success');
      } else {
        showToast('Toutes les NC détectées sont déjà dans l\'Annexe 1B', 'info');
      }
      return { ...prev, defauts: newDefauts };
    });
    setActiveTab('1B');
  }, [injectInto1B, setFormData, showToast]);

  // ── Synchronisation 1B → 1A ──────────────────────────────────────
  useEffect(() => {
    const data1B = formsData['1B'] || {};
    const qk     = Number(data1B?.valeurQK);
    if (!Number.isFinite(qk)) return;

    setFormsData(prev => {
      const prev1A    = prev['1A'] || {};
      const prevRows  = Array.isArray(prev1A?.rows) ? prev1A.rows : [];
      const nextRow   = {
        partDesc:       data1B.partDesc       || 'Câblage',
        drawingNo:      data1B.identification || data1B.partDesc || '—',
        productionDate: data1B.date           || new Date().toISOString().slice(0, 10),
        productAuditor: data1B.auditor        || auditInfo.auditorName || '—',
        qk:             qk.toFixed(1),
        nbDefects:      data1B.nbDefects      ?? 0,
        totalPoints:    data1B.totalPoints    ?? 0,
        ratingFactor:   data1B.ratingFactor   ?? '',
        destructive:    data1B.auditType      === 'D',
        nonDestructive: data1B.auditType      !== 'D',
      };
      const mergedRows = prevRows.length > 0
        ? [nextRow, ...prevRows.slice(1)]
        : [nextRow];

      return {
        ...prev,
        '1A': {
          ...prev1A,
          monthYear:   prev1A.monthYear   || data1B.monthYear   || auditInfo.monthYear,
          vehicleType: prev1A.vehicleType || data1B.vehicleType || auditInfo.vehicleType,
          plant:       prev1A.plant       || data1B.plant       || auditInfo.plant,
          rows:        mergedRows,
        },
      };
    });
  }, [
    formsData['1B']?.valeurQK,
    formsData['1B']?.partDesc,
    formsData['1B']?.date,
    formsData['1B']?.auditor,
    formsData['1B']?.nbDefects,
    formsData['1B']?.totalPoints,
    formsData['1B']?.ratingFactor,
    formsData['1B']?.auditType,
  ]);

  // ── NC de l'onglet courant ───────────────────────────────────────
  const currentTabNC = detectedByAnnexe[activeTab] || [];

  // ── Nombre total de défauts auto dans 1B ────────────────────────
  const nbAutoIn1B = (getFormData('1B')?.defauts || []).filter(d => d.auto).length;

  // ────────────────────────────────────────────────────────────────
  return (
    <div style={{
      fontFamily:  'Arial, Helvetica, sans-serif',
      background:  '#E8EAF0',
      minHeight:   '100vh',
      padding:     12,
    }}>
      <style>{`
        * { box-sizing: border-box; }
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(20px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        .tab-btn:hover { opacity: .85; }
        .inject-row:hover { background: #F0F4FF !important; }
      `}</style>

      {/* Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* ══ BARRE DU HAUT ══════════════════════════════════════════ */}
      <div style={{
        display:       'flex',
        alignItems:    'center',
        gap:           10,
        marginBottom:  10,
        padding:       '8px 14px',
        background:    T.navy,
        borderRadius:  10,
        flexWrap:      'wrap',
      }}>
        {/* Logo */}
        <span style={{
          fontWeight:    900,
          fontSize:      20,
          color:         '#fff',
          letterSpacing: 3,
        }}>
          LEONI
        </span>
        <span style={{
          fontSize:   10,
          color:      'rgba(255,255,255,.55)',
          fontWeight: 600,
        }}>
          Product Audit — Smart NC Injector
        </span>

        {/* Badge NC globales */}
        {pendingCount > 0 && (
          <div style={{
            marginLeft:  'auto',
            display:     'flex',
            alignItems:  'center',
            gap:         8,
            flexWrap:    'wrap',
          }}>
            <span style={{
              background:   T.warn,
              color:        '#fff',
              borderRadius: 10,
              padding:      '2px 10px',
              fontSize:     10,
              fontWeight:   900,
            }}>
              ⚠ {pendingCount} NC détectée(s)
            </span>
            <button
              onClick={handleInjectAll}
              style={{
                background:   T.danger,
                color:        '#fff',
                border:       'none',
                borderRadius: 5,
                padding:      '5px 12px',
                fontSize:     10,
                fontWeight:   800,
                cursor:       'pointer',
              }}
            >
              ↓ Tout injecter dans 1B
            </button>
          </div>
        )}

        {/* Badge défauts déjà dans 1B */}
        {nbAutoIn1B > 0 && (
          <span style={{
            background:   'rgba(5,150,105,.25)',
            color:        '#6EE7B7',
            borderRadius: 10,
            padding:      '2px 10px',
            fontSize:     10,
            fontWeight:   700,
            marginLeft:   pendingCount > 0 ? 0 : 'auto',
          }}>
            ✓ {nbAutoIn1B} défaut(s) dans 1B
          </span>
        )}

        {/* Toggle injection auto */}
        <label style={{
          display:    'flex',
          alignItems: 'center',
          gap:        6,
          fontSize:   10,
          color:      '#fff',
          cursor:     'pointer',
          marginLeft: nbAutoIn1B > 0 || pendingCount > 0 ? 0 : 'auto',
        }}>
          <input
            type="checkbox"
            checked={autoInject}
            onChange={e => {
              setAutoInject(e.target.checked);
              showToast(
                e.target.checked
                  ? 'Injection automatique activée ✓'
                  : 'Injection automatique désactivée',
                e.target.checked ? 'success' : 'warn'
              );
            }}
            style={{ width: 15, height: 15, cursor: 'pointer', accentColor: '#059669' }}
          />
          <span>Auto-injecter</span>
        </label>
      </div>

      {/* ══ ONGLETS ════════════════════════════════════════════════ */}
      <div style={{
        display:      'flex',
        flexWrap:     'wrap',
        gap:          4,
        marginBottom: 10,
        background:   '#fff',
        borderRadius: 8,
        padding:      '6px 8px',
        boxShadow:    '0 1px 4px rgba(0,0,0,.08)',
      }}>
        {TABS.map(t => {
          const nc       = detectedByAnnexe[t.key] || [];
          const isActive = activeTab === t.key;
          const hasNC    = nc.length > 0;

          return (
            <button
              key={t.key}
              className="tab-btn"
              onClick={() => setActiveTab(t.key)}
              style={{
                position:    'relative',
                padding:     '5px 10px',
                borderRadius: 5,
                fontSize:    10,
                fontWeight:  isActive ? 900 : 600,
                cursor:      'pointer',
                border:      'none',
                fontFamily:  'Arial, sans-serif',
                background:  isActive ? T.navy : 'transparent',
                color:       isActive ? '#fff' : (hasNC ? T.warn : T.g400),
                transition:  'all .15s',
              }}
            >
              {t.label}
              {/* Badge NC rouge sur l'onglet */}
              {hasNC && (
                <span style={{
                  position:     'absolute',
                  top:          1,
                  right:        1,
                  background:   T.danger,
                  color:        '#fff',
                  borderRadius: 8,
                  padding:      '0 4px',
                  fontSize:     8,
                  fontWeight:   900,
                  lineHeight:   '14px',
                  minWidth:     14,
                  textAlign:    'center',
                }}>
                  {nc.length}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ══ CONTENU DE L'ONGLET ════════════════════════════════════ */}
      <div style={{
        background:   '#fff',
        borderRadius: 10,
        padding:      16,
        boxShadow:    '0 2px 8px rgba(0,0,0,.08)',
      }}>

        {/* Bannière NC pour l'onglet actif (sauf 1A/1B) */}
        {activeTab !== '1A' && activeTab !== '1B' && currentTabNC.length > 0 && (
          <NCBanner
            count={currentTabNC.length}
            annexeKey={activeTab}
            onInject={() => handleInjectOne(activeTab)}
            onInjectAll={pendingCount > currentTabNC.length ? handleInjectAll : null}
          />
        )}

        {/* ── ANNEXE 1A ── */}
        {activeTab === '1A' && (
          <FormAnnexe1A
            data={getFormData('1A')}
            onChange={data => setFormData('1A', data)}
            auditInfo={auditInfo}
          />
        )}

        {/* ── ANNEXE 1B avec défauts injectés ── */}
        {activeTab === '1B' && (
          <>
            {/* Info : défauts auto injectés */}
            {nbAutoIn1B > 0 && (
              <div style={{
                background:   T.infoBg,
                border:       `1px solid ${T.infoBd}`,
                borderRadius: 8,
                padding:      '8px 12px',
                marginBottom: 12,
                fontSize:     11,
                color:        T.info,
                fontWeight:   600,
                display:      'flex',
                alignItems:   'center',
                gap:          8,
              }}>
                <span style={{ fontSize: 16 }}>ℹ</span>
                <span>
                  <strong>{nbAutoIn1B}</strong> défaut(s) injecté(s) automatiquement
                  depuis les autres annexes.
                  <span style={{ fontWeight: 400 }}> Vous pouvez les modifier librement ci-dessous.</span>
                </span>
              </div>
            )}
            <FormAnnexe1B
              data={getFormData('1B')}
              onChange={data => setFormData('1B', data)}
              auditInfo={auditInfo}
              injectedDefauts={[]}
            />
          </>
        )}

        {/* ── TOUTES LES AUTRES ANNEXES ── */}
        {activeTab !== '1A' && activeTab !== '1B' && (
          <AnnexeForm
            tabKey={activeTab}
            data={getFormData(activeTab)}
            onChange={data => handleAnnexeChange(activeTab, data)}
            auditInfo={auditInfo}
          />
        )}
      </div>

      {/* ══ PANEL RÉCAPITULATIF NC (bas de page) ═══════════════════ */}
      {allDetected.length > 0 && (
        <div style={{
          marginTop:    10,
          background:   '#fff',
          borderRadius: 8,
          padding:      '12px 16px',
          boxShadow:    '0 1px 4px rgba(0,0,0,.06)',
        }}>
          {/* En-tête du panel */}
          <div style={{
            display:      'flex',
            alignItems:   'center',
            gap:          10,
            marginBottom: 10,
          }}>
            <span style={{ fontWeight: 800, fontSize: 12, color: T.navy }}>
              Récapitulatif NC détectées ({allDetected.length})
            </span>
            <span style={{ fontSize: 10, color: T.g400, flex: 1 }}>
              — par annexe source
            </span>
            <button
              onClick={handleInjectAll}
              style={{
                padding:      '5px 14px',
                background:   T.navy,
                color:        '#fff',
                border:       'none',
                borderRadius: 5,
                fontSize:     10,
                fontWeight:   800,
                cursor:       'pointer',
              }}
            >
              ↓ Tout injecter dans Annexe 1B
            </button>
          </div>

          {/* Tableau récapitulatif */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 10 }}>
              <thead>
                <tr>
                  {['Code', 'Description', 'Annexe source', 'Détail', 'Points'].map(h => (
                    <th key={h} style={{
                      background:  T.navy,
                      color:       '#fff',
                      padding:     '5px 8px',
                      border:      '1px solid #000',
                      fontWeight:  700,
                      textAlign:   'left',
                      fontSize:    10,
                    }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {allDetected.map((nc, i) => {
                  const tagColors = {
                    '5':   { bg: '#FEF3C7', color: '#92400E' },
                    '4':   { bg: '#DBEAFE', color: '#1E40AF' },
                    '7':   { bg: '#D1FAE5', color: '#065F46' },
                    '6':   { bg: '#F3E8FF', color: '#6B21A8' },
                    '7A':  { bg: '#FFF0F0', color: '#991B1B' },
                    '8':   { bg: '#FEF9C3', color: '#854D0E' },
                    '10':  { bg: '#E0F2FE', color: '#0C4A6E' },
                    '11A': { bg: '#FCE7F3', color: '#9D174D' },
                    '11B': { bg: '#F0FFF4', color: '#14532D' },
                    '11C': { bg: '#FFF7ED', color: '#7C2D12' },
                    'PSA': { bg: '#F5F3FF', color: '#4C1D95' },
                  };
                  const tag = tagColors[nc.sourceAnnexe] || { bg: '#F1F5F9', color: '#475569' };

                  return (
                    <tr
                      key={i}
                      className="inject-row"
                      style={{ background: i % 2 === 0 ? '#fff' : T.g50, cursor: 'pointer' }}
                      onClick={() => handleInjectOne(nc.sourceAnnexe)}
                      title={`Cliquer pour injecter les NC de l'Annexe ${nc.sourceAnnexe} dans 1B`}
                    >
                      <td style={{
                        border:     '1px solid #000',
                        padding:    '4px 8px',
                        fontWeight: 800,
                        color:      T.navy,
                        fontSize:   10,
                      }}>
                        {nc.code}
                      </td>
                      <td style={{ border: '1px solid #000', padding: '4px 8px', fontSize: 10 }}>
                        {nc.description}
                      </td>
                      <td style={{ border: '1px solid #000', padding: '4px 8px' }}>
                        <span style={{
                          fontSize:     9,
                          padding:      '2px 6px',
                          borderRadius: 4,
                          fontWeight:   700,
                          background:   tag.bg,
                          color:        tag.color,
                        }}>
                          Annexe {nc.sourceAnnexe}
                        </span>
                      </td>
                      <td style={{
                        border:  '1px solid #000',
                        padding: '4px 8px',
                        color:   T.g400,
                        fontSize: 9,
                      }}>
                        {nc.sourceDetail}
                      </td>
                      <td style={{
                        border:     '1px solid #000',
                        padding:    '4px 8px',
                        fontWeight: 700,
                        color:      T.danger,
                        fontSize:   10,
                        textAlign:  'center',
                      }}>
                        {nc.pointsDefect} pts
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              {/* Total */}
              <tfoot>
                <tr style={{ background: T.g100 }}>
                  <td colSpan={4} style={{
                    border:    '1px solid #000',
                    padding:   '5px 8px',
                    fontWeight: 800,
                    textAlign:  'right',
                    fontSize:   10,
                  }}>
                    Total points NC détectées :
                  </td>
                  <td style={{
                    border:     '1px solid #000',
                    padding:    '5px 8px',
                    fontWeight: 900,
                    color:      T.danger,
                    fontSize:   11,
                    textAlign:  'center',
                  }}>
                    {allDetected.reduce((s, nc) => s + (nc.pointsDefect || 0), 0)} pts
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          <div style={{
            marginTop:  8,
            fontSize:   10,
            color:      T.g400,
            fontStyle:  'italic',
          }}>
            💡 Cliquez sur une ligne pour injecter les NC de cette annexe dans l'Annexe 1B.
            L'auditeur peut ensuite modifier chaque défaut librement.
          </div>
        </div>
      )}
    </div>
  );
}