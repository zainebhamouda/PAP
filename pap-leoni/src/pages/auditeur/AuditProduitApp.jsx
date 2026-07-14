/**
 * ══════════════════════════════════════════════════════════════════
 *  LEONI — AuditProduitApp.jsx  (exemple d'intégration complet)
 *
 *  Montre COMMENT brancher useSmartNCInjector dans l'application
 *  existante pour que les Annexes 4, 5, 7, etc. alimentent
 *  automatiquement l'Annexe 1B.
 *
 *  PRINCIPE :
 *    1. L'auditeur ouvre et remplit une annexe (4, 5, 7…)
 *    2. À chaque onChange → analyzeAnnexe(type, formData)
 *    3. Un badge "NC détectées" apparaît
 *    4. L'auditeur clique "Injecter dans 1B" (ou auto si activé)
 *    5. Les défauts arrivent dans l'Annexe 1B, modifiables
 * ══════════════════════════════════════════════════════════════════
 */

import { useState, useCallback, useEffect } from 'react';
import { useSmartNCInjector } from './useSmartNCInjector';

// Importer tous les formulaires existants
import { FormAnnexe1A, FormAnnexe1B } from './FormAnnexe1A_1B_LEONI';
import {
  FormAnnexe4, FormAnnexe5, FormAnnexe6,
  FormAnnexe7, FormAnnexe7A, FormAnnexe8,
  FormAnnexe10, FormAnnexe11A, FormAnnexe11B, FormAnnexe11C,
  FormAnnexe13A, FormAnnexe13B, FormAnnexe13C, FormAnnexe13D,
  FormAnnexePSA, FormAnnexeDPE,
} from './FormAnnexes_LEONI_Complete';

// ─── Couleurs ────────────────────────────────────────────────────
const T = {
  navy: '#001F4E', blue: '#003F8A', mid: '#0057B8',
  hdr: '#E8F0FB', border: '#001F4E',
  success: '#059669', warn: '#D97706', danger: '#DC2626',
  info: '#2563EB', infoBg: '#EFF6FF', infoBd: '#BFDBFE',
  g50: '#F7F9FC', g100: '#EEF2F8', g200: '#d0d5df', g400: '#8A9BBC',
};

// ─── Config des onglets ──────────────────────────────────────────
const TABS = [
  { key: '1A',  label: 'Annexe 1A',   title: 'Monthly Report Overview' },
  { key: '1B',  label: 'Annexe 1B',   title: 'Fiche QK individuelle' },
  { key: '4',   label: 'Annexe 4',    title: 'Étapes de travail' },
  { key: '5',   label: 'Annexe 5',    title: 'Audit Processus Assemblage' },
  { key: '6',   label: 'Annexe 6',    title: 'Fils & Sertissage BMW' },
  { key: '7',   label: 'Annexe 7',    title: 'Dimensions & Bandage' },
  { key: '7A',  label: 'Annexe 7A',   title: 'Mesure Audi C-BEV' },
  { key: '8',   label: 'Annexe 8',    title: 'Fils torsadés BMW' },
  { key: '10',  label: 'Annexe 10',   title: 'Force traction Audi/VW' },
  { key: '11A', label: 'Annexe 11(a)',title: 'Force pelage USS' },
  { key: '11B', label: 'Annexe 11(b)',title: 'Torsadage Audi/VW' },
  { key: '11C', label: 'Annexe 11(c)',title: 'Torsadage Audi C-BEV' },
  { key: '13A', label: 'Annexe 13(a)',title: 'Audit Destructif — Tubes' },
  { key: '13B', label: 'Annexe 13(b)',title: 'Audit Destructif — Douilles' },
  { key: '13C', label: 'Annexe 13(c)',title: 'Audit Destructif — Joints' },
  { key: '13D', label: 'Annexe 13(d)',title: 'Audit Destructif — Contacts' },
  { key: 'PSA', label: 'Annexe PSA',  title: 'Contrôle PSA (Moteur Sud)' },
  { key: 'DPE', label: 'Annexe DPE',  title: 'Contrôle DPE (Moteur Sud)' },
];

// Composant rendu du formulaire selon la clé
function AnnexeForm({ tabKey, data, onChange, auditInfo }) {
  const props = { data, onChange, auditInfo };
  switch (tabKey) {
    case '1A':  return <FormAnnexe1A  {...props} />;
    case '1B':  return null; // géré à part
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
    default:    return <div>Formulaire non disponible</div>;
  }
}

// ─── Composant Bannière NC détectées ─────────────────────────────
function NCBanner({ count, annexeKey, onInject, onInjectAll }) {
  if (count === 0) return null;
  return (
    <div style={{
      background: '#FFFBEB', border: '1.5px solid #FCD34D',
      borderRadius: 6, padding: '8px 12px', marginBottom: 10,
      display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap',
    }}>
      <span style={{ fontSize: 14 }}>⚠</span>
      <span style={{ fontSize: 10, fontWeight: 700, color: T.warn, flex: 1 }}>
        <strong>{count}</strong> non-conformité(s) détectée(s) automatiquement
        {annexeKey && ` dans Annexe ${annexeKey}`}
      </span>
      {onInject && (
        <button onClick={onInject} style={{
          padding: '4px 10px', background: T.navy, color: '#fff',
          border: 'none', borderRadius: 4, fontSize: 9, fontWeight: 800, cursor: 'pointer',
        }}>
          ↓ Injecter dans Annexe 1B
        </button>
      )}
      {onInjectAll && (
        <button onClick={onInjectAll} style={{
          padding: '4px 10px', background: T.danger, color: '#fff',
          border: 'none', borderRadius: 4, fontSize: 9, fontWeight: 800, cursor: 'pointer',
        }}>
          ↓ Tout injecter (toutes annexes)
        </button>
      )}
    </div>
  );
}

// ─── App principale ──────────────────────────────────────────────
export default function AuditProduitApp() {
  const [activeTab, setActiveTab] = useState('1B');
  const [formsData, setFormsData] = useState({});       // toutes les annexes
  const [autoInject, setAutoInject] = useState(false);  // injection auto activée?

  // Informations de l'audit (pré-remplissage)
  const auditInfo = {
    auditorName: 'Zaineb Hammouda',
    serie:       'BMW X3',
    plant:       'BMW',
    vehicleType: 'BMW X3',
    tab:         'TAB-2026-01',
    monthYear:   '05/2026',
  };

  // Hook Smart Injector
  const {
    analyzeAnnexe,
    injectInto1B,
    injectAnnexeInto1B,
    detectedByAnnexe,
    allDetected,
    pendingCount,
  } = useSmartNCInjector();

  // Getter / setter pour chaque annexe
  const getFormData = (key) => formsData[key] || {};
  const setFormData = useCallback((key, data) => {
    setFormsData(prev => ({ ...prev, [key]: data }));
  }, []);

  // Handler : appelé à chaque modification d'une annexe autre que 1A/1B
  const handleAnnexeChange = useCallback((key, data) => {
    setFormData(key, data);

    // Annexes sources → analyser immédiatement
    const sourcesAnnexes = ['4','5','6','7','7A','8','10','11A','11B','11C','13A','13B','13C','13D','PSA'];
    if (sourcesAnnexes.includes(key)) {
      const nc = analyzeAnnexe(key, data);

      // Injection automatique si activée
      if (autoInject && nc.length > 0) {
        setFormData('1B', prev1B => ({
          ...prev1B,
          defauts: injectAnnexeInto1B(key, prev1B?.defauts || []),
        }));
      }
    }
  }, [analyzeAnnexe, autoInject, injectAnnexeInto1B, setFormData]);

  // Injecter les NC d'UNE annexe dans 1B
  const handleInjectOne = useCallback((annexeKey) => {
    setFormData('1B', prev => ({
      ...prev,
      defauts: injectAnnexeInto1B(annexeKey, prev?.defauts || []),
    }));
  }, [injectAnnexeInto1B, setFormData]);

  // Injecter TOUTES les NC dans 1B
  const handleInjectAll = useCallback(() => {
    setFormData('1B', prev => ({
      ...prev,
      defauts: injectInto1B(prev?.defauts || []),
    }));
    setActiveTab('1B');
  }, [injectInto1B, setFormData]);

  // Synchronisation Annexe 1B → Annexe 1A (comme avant)
  useEffect(() => {
    const data1B = formsData['1B'] || {};
    const qk = Number(data1B?.valeurQK);
    if (!Number.isFinite(qk)) return;

    setFormsData(prev => {
      const prev1A = prev['1A'] || {};
      const prevRows = Array.isArray(prev1A?.rows) ? prev1A.rows : [];
      const nextRow = {
        partDesc:       data1B.partDesc || 'Câblage',
        drawingNo:      data1B.identification || data1B.partDesc || '—',
        productionDate: data1B.date || new Date().toISOString().slice(0, 10),
        productAuditor: data1B.auditor || auditInfo.auditorName || '—',
        qk:             qk.toFixed(1),
        nbDefects:      data1B.nbDefects ?? 0,
        totalPoints:    data1B.totalPoints ?? 0,
        ratingFactor:   data1B.ratingFactor ?? '',
        destructive:    data1B.auditType === 'D',
        nonDestructive: data1B.auditType !== 'D',
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

  // NC de l'onglet courant
  const currentTabNC = detectedByAnnexe[activeTab] || [];

  return (
    <div style={{ fontFamily: 'Arial,sans-serif', background: '#E8EAF0', minHeight: '100vh', padding: 12 }}>
      <style>{`* { box-sizing: border-box; }`}</style>

      {/* ── Barre du haut ── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        marginBottom: 10, padding: '8px 12px',
        background: T.navy, borderRadius: 8,
      }}>
        <span style={{ fontWeight: 900, fontSize: 18, color: '#fff', letterSpacing: 2 }}>LEONI</span>
        <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>
          Product Audit — PI3010 Smart Injector
        </span>

        {/* Badge NC globales */}
        {pendingCount > 0 && (
          <div style={{
            marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <span style={{
              background: T.warn, color: '#fff', borderRadius: 10,
              padding: '2px 8px', fontSize: 9, fontWeight: 900,
            }}>
              ⚠ {pendingCount} NC détectées
            </span>
            <button onClick={handleInjectAll} style={{
              background: T.danger, color: '#fff', border: 'none',
              borderRadius: 4, padding: '4px 10px', fontSize: 9, fontWeight: 800, cursor: 'pointer',
            }}>
              ↓ Tout injecter dans 1B
            </button>
          </div>
        )}

        {/* Toggle injection auto */}
        <label style={{
          display: 'flex', alignItems: 'center', gap: 5,
          fontSize: 9, color: '#fff', cursor: 'pointer',
          marginLeft: pendingCount > 0 ? 0 : 'auto',
        }}>
          <input
            type="checkbox"
            checked={autoInject}
            onChange={e => setAutoInject(e.target.checked)}
            style={{ width: 14, height: 14, cursor: 'pointer', accentColor: '#059669' }}
          />
          Auto-injecter
        </label>
      </div>

      {/* ── Onglets ── */}
      <div style={{
        display: 'flex', flexWrap: 'wrap', gap: 4,
        marginBottom: 10, background: '#fff',
        borderRadius: 8, padding: '6px 8px',
        boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
      }}>
        {TABS.map(t => {
          const nc = detectedByAnnexe[t.key] || [];
          const isActive = activeTab === t.key;
          return (
            <button key={t.key} onClick={() => setActiveTab(t.key)} style={{
              padding: '5px 10px', borderRadius: 5, fontSize: 9,
              fontWeight: isActive ? 900 : 600, cursor: 'pointer',
              border: 'none', fontFamily: 'Arial',
              background: isActive ? T.navy : 'transparent',
              color: isActive ? '#fff' : (nc.length > 0 ? T.warn : T.g400),
              position: 'relative',
            }}>
              {t.label}
              {/* Badge NC sur l'onglet */}
              {nc.length > 0 && (
                <span style={{
                  position: 'absolute', top: 1, right: 1,
                  background: T.danger, color: '#fff',
                  borderRadius: 8, padding: '0 4px', fontSize: 7, fontWeight: 900,
                }}>
                  {nc.length}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── Contenu de l'onglet ── */}
      <div style={{
        background: '#fff', borderRadius: 10, padding: 16,
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
      }}>

        {/* Bannière NC pour l'onglet actif (sauf 1A/1B) */}
        {activeTab !== '1A' && activeTab !== '1B' && (
          <NCBanner
            count={currentTabNC.length}
            annexeKey={activeTab}
            onInject={currentTabNC.length > 0 ? () => handleInjectOne(activeTab) : null}
            onInjectAll={pendingCount > 0 ? handleInjectAll : null}
          />
        )}

        {/* Annexe 1A */}
        {activeTab === '1A' && (
          <FormAnnexe1A
            data={getFormData('1A')}
            onChange={data => setFormData('1A', data)}
            auditInfo={auditInfo}
          />
        )}

        {/* Annexe 1B avec les défauts injectés */}
        {activeTab === '1B' && (
          <>
            {/* Info : défauts auto injectés */}
            {(getFormData('1B')?.defauts || []).filter(d => d.auto).length > 0 && (
              <div style={{
                background: T.infoBg, border: `1px solid ${T.infoBd}`,
                borderRadius: 6, padding: '6px 10px', marginBottom: 10,
                fontSize: 9, color: T.info, fontWeight: 600,
                display: 'flex', alignItems: 'center', gap: 6,
              }}>
                <span style={{ fontSize: 12 }}>ℹ</span>
                {(getFormData('1B')?.defauts || []).filter(d => d.auto).length} défaut(s) injecté(s)
                automatiquement depuis les autres annexes.
                Vous pouvez les modifier librement ci-dessous.
              </div>
            )}
            <FormAnnexe1B
              data={getFormData('1B')}
              onChange={data => setFormData('1B', data)}
              auditInfo={auditInfo}
              injectedDefauts={[]} // ne plus utiliser l'ancien système
            />
          </>
        )}

        {/* Toutes les autres annexes */}
        {activeTab !== '1A' && activeTab !== '1B' && (
          <AnnexeForm
            tabKey={activeTab}
            data={getFormData(activeTab)}
            onChange={data => handleAnnexeChange(activeTab, data)}
            auditInfo={auditInfo}
          />
        )}
      </div>

      {/* ── Panel résumé NC (bas de page) ── */}
      {allDetected.length > 0 && (
        <div style={{
          marginTop: 10, background: '#fff', borderRadius: 8,
          padding: '10px 14px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
        }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            marginBottom: 8,
          }}>
            <span style={{ fontWeight: 800, fontSize: 11, color: T.navy }}>
              Récapitulatif NC détectées ({allDetected.length})
            </span>
            <button onClick={handleInjectAll} style={{
              marginLeft: 'auto',
              padding: '4px 12px', background: T.navy, color: '#fff',
              border: 'none', borderRadius: 4, fontSize: 9, fontWeight: 800, cursor: 'pointer',
            }}>
              ↓ Tout injecter dans Annexe 1B
            </button>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 9 }}>
            <thead>
              <tr>
                {['Code', 'Description', 'Source', 'Détail', 'Points'].map(h => (
                  <th key={h} style={{
                    background: T.navy, color: '#fff', padding: '4px 6px',
                    border: '1px solid #000', fontWeight: 700, textAlign: 'left',
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {allDetected.map((nc, i) => (
                <tr key={i} style={{ background: i % 2 === 0 ? '#fff' : T.g50 }}>
                  <td style={{ border: '1px solid #000', padding: '3px 6px', fontWeight: 800, color: T.navy }}>
                    {nc.code}
                  </td>
                  <td style={{ border: '1px solid #000', padding: '3px 6px' }}>{nc.description}</td>
                  <td style={{ border: '1px solid #000', padding: '3px 6px' }}>
                    <span style={{
                      fontSize: 7, padding: '1px 5px', borderRadius: 3, fontWeight: 700,
                      background: nc.sourceAnnexe === '5' ? '#FEF3C7'
                        : nc.sourceAnnexe === '4' ? '#DBEAFE'
                          : '#D1FAE5',
                      color: nc.sourceAnnexe === '5' ? '#92400E'
                        : nc.sourceAnnexe === '4' ? '#1E40AF'
                          : '#065F46',
                    }}>
                      Annexe {nc.sourceAnnexe}
                    </span>
                  </td>
                  <td style={{ border: '1px solid #000', padding: '3px 6px', color: T.g400, fontSize: 8 }}>
                    {nc.sourceDetail}
                  </td>
                  <td style={{ border: '1px solid #000', padding: '3px 6px', fontWeight: 700, color: T.danger }}>
                    {nc.pointsDefect} pts
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}