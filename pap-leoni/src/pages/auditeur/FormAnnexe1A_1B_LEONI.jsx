/**
 * ══════════════════════════════════════════════════════════════════
 *  LEONI — Annexe 1A (PI 3010 Enclosure 1a) & Annexe 1B (PI 3010 Enclosure 1b)
 *  CORRECTIONS SPRINT 4 :
 *  1. Header annexe : fond bleu clair #E8F0FB, bordure noire
 *     - Gauche : numéro annexe (ex: Annexe 1(a))
 *     - Centre : titre de l'annexe
 *     - Droite : logo LEONI en bleu foncé #001F4E
 *  2. Champs pré-remplis depuis props auditInfo
 *  3. Checklist style professionnel (checkbox carré, pas de cercle rose)
 *  4. getRatingFactor corrigé
 *  5. Synchronisation sans boucles
 *
 *  CORRECTIONS SPRINT 5 (catalogue officiel PI3010 Enclosure 3) :
 *  - Remplacement du faux catalogue numérique par le catalogue officiel
 *    LEONI_DEFECT_CATEGORIES (composant → code lettre → points réels)
 *  - Les points/défaut ne sont plus modifiables à la main : ils viennent
 *    directement du catalogue officiel (plus d'erreur de pondération)
 *  - Ajout d'une colonne "Composant (PI3010)" dans le tableau des défauts
 *  - Modale catalogue à deux niveaux : liste des composants → ses codes
 *  - Suppression du bouton "+ Saisie manuelle" (les codes doivent venir
 *    du catalogue officiel, plus de code inventé)
 * 
 *  CORRECTIONS SPRINT 6 : Pré-remplissage des dates et type d'audit
 *  - Date pré-remplie depuis auditInfo.date
 *  - Drawing date pré-remplie depuis auditInfo.drawingDate
 *  - Type d'audit (D/N) pré-rempli depuis auditInfo.auditType
 * ══════════════════════════════════════════════════════════════════
 */

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { LEONI_DEFECT_CATEGORIES, getComponent, getDefaut } from './leoniDefectCatalog';

// ─── Couleurs LEONI ───────────────────────────────────────────────
const T = {
  navy:'#001F4E', blue:'#003F8A', blueM:'#0057B8',
  headerBg:'#E8F0FB',   // bleu clair pour header annexe
  headerBorder:'#001F4E',
  g50:'#F7F9FC', g100:'#EEF2F8', g200:'#d0d5df', g400:'#8A9BBC', g500:'#5C6F8A', g700:'#273347',
  success:'#059669', successBg:'#ECFDF5', successBd:'#A7F3D0',
  warn:'#C8982A', warnBg:'#FFFBEB', warnBd:'#FCD34D',
  danger:'#DC2626', dangerBg:'#FEF2F2', dangerBd:'#FECACA',
  info:'#2563EB', infoBg:'#EFF6FF', infoBd:'#BFDBFE',
  orange:'#D97706',
};

// ─── Header standard pour toutes les annexes ─────────────────────
// Gauche : numéro (ex "Annexe 1(a)"), Centre : titre, Droite : LEONI
export function AnnexeHeader({ numero, titre }) {
  return (
    <table style={{
      width:'100%', borderCollapse:'collapse',
      border:`2px solid ${T.headerBorder}`, marginBottom:0,
    }}>
      <tbody>
        <tr>
          {/* Gauche : numéro */}
          <td style={{
            width:'20%', border:`1px solid ${T.headerBorder}`,
            background: T.headerBg, padding:'6px 10px',
            fontWeight:900, fontSize:11, color: T.navy,
            fontFamily:'Arial,sans-serif', verticalAlign:'middle',
          }}>
            {numero}
          </td>
          {/* Centre : titre */}
          <td style={{
            border:`1px solid ${T.headerBorder}`,
            background: T.headerBg, padding:'6px 10px',
            fontWeight:800, fontSize:11, color:'#000',
            fontFamily:'Arial,sans-serif', verticalAlign:'middle',
            textAlign:'center',
          }}>
            {titre}
          </td>
          {/* Droite : LEONI */}
          <td style={{
            width:'20%', border:`1px solid ${T.headerBorder}`,
            background: T.headerBg, padding:'6px 10px',
            fontWeight:900, fontSize:18, color: T.navy,
            fontFamily:'Arial,sans-serif', verticalAlign:'middle',
            textAlign:'right', letterSpacing:2,
          }}>
            LEONI
          </td>
        </tr>
      </tbody>
    </table>
  );
}

const DEFAUT_TYPES = [
  { key:'F', label:'F', full:'Manufacturing Defects (F)', color:'#2563EB' },
  { key:'S', label:'S', full:'Damage Defects (S)',        color:'#D97706' },
  { key:'K', label:'K', full:'Design Defects (K)',         color:'#9D174D' },
  { key:'L', label:'L', full:'Supplier Defects (L)',       color:'#059669' },
];

// ─── Calculs QK ───────────────────────────────────────────────────
function getRatingFactor(n) {
  const nb = parseInt(n, 10);
  if (isNaN(nb) || nb <= 0) return null;
  if (nb < 50)    return 4.0;
  if (nb <= 100)  return 2.0;
  if (nb <= 200)  return 1.0;
  if (nb <= 400)  return 0.9;
  if (nb <= 800)  return 0.8;
  if (nb <= 1600) return 0.7;
  if (nb <= 2600) return 0.6;
  if (nb <= 4700) return 0.5;
  return 0.4;
}

function calculateQK(wp) {
  if (wp === 0) return 0.0;
  if (wp <= 13) return 0.1; if (wp <= 26)  return 0.2; if (wp <= 40)  return 0.3;
  if (wp <= 55) return 0.4; if (wp <= 71)  return 0.5; if (wp <= 87)  return 0.6;
  if (wp <= 104) return 0.7; if (wp <= 122) return 0.8; if (wp <= 140) return 0.9;
  if (wp <= 159) return 1.0; if (wp <= 179) return 1.1; if (wp <= 199) return 1.2;
  if (wp <= 220) return 1.3; if (wp <= 242) return 1.4; if (wp <= 265) return 1.5;
  if (wp <= 288) return 1.6; if (wp <= 312) return 1.7; if (wp <= 337) return 1.8;
  if (wp <= 362) return 1.9; if (wp <= 388) return 2.0; if (wp <= 415) return 2.1;
  if (wp <= 442) return 2.2; if (wp <= 470) return 2.3; if (wp <= 499) return 2.4;
  if (wp <= 528) return 2.5; if (wp <= 557) return 2.6; if (wp <= 586) return 2.7;
  if (wp <= 616) return 2.8; if (wp <= 646) return 2.9; if (wp <= 676) return 3.0;
  if (wp <= 987) return 4.0; if (wp <= 1250) return 4.8; if (wp <= 1284) return 4.9;
  return 5.0;
}

function computeQKColor(val) {
  if (val === null || val === undefined || val === '') return null;
  const n = Number(val); if (isNaN(n)) return null;
  if (n === 0)  return 'VERT';
  if (n <= 0.5) return 'ORANGE';
  if (n <= 1.0) return 'ROSE';
  return 'ROUGE';
}

// ─── Styles communs ───────────────────────────────────────────────
const cellBorder = '1px solid #000';
const headerStyle = {
  background:'#1a56a0', color:'#fff', fontWeight:800, fontSize:9,
  textAlign:'center', padding:'4px 3px', border: cellBorder,
  fontFamily:'Arial,sans-serif', lineHeight:1.3,
};
const cellStyle = {
  border: cellBorder, padding:'3px 4px', fontSize:9,
  fontFamily:'Arial,sans-serif', verticalAlign:'middle', background:'#fff',
};
const inpCell = {
  width:'100%', border:'none', outline:'none', fontSize:9,
  fontFamily:'Arial,sans-serif', background:'transparent', textAlign:'center',
  padding:0, margin:0,
};

// ════════════════════════════════════════════════════════════════════
//  ANNEXE 1A — Monthly Report Overview
//  auditInfo : { monthYear, vehicleType, plant, auditorName, serie }
// ════════════════════════════════════════════════════════════════════
export function FormAnnexe1A({ data, onChange, auditInfo = {} }) {
  const d = data || {};
  const set = (k, v) => onChange({ ...d, [k]: v });

  // Toujours au moins 8 lignes visibles (même vides) — conformément aux specs
  const MINIMUM_ROWS = 8;
  const [rows, setRows] = useState(() => {
    const saved = d.rows || [];
    const empties = Array.from({ length: Math.max(0, MINIMUM_ROWS - saved.length) }, () => ({
      partDesc:'', drawingNo:'', productionDate:'', productAuditor:'',
      qk:'', nbDefects:'', totalPoints:'', ratingFactor:'',
      destructive:false, nonDestructive:false,
    }));
    return [...saved, ...empties];
  });

  const updRow = (i, k, v) => {
    const r = [...rows]; r[i] = { ...r[i], [k]: v };
    setRows(r); set('rows', r);
  };

  // Pré-remplissage depuis auditInfo
  const monthYear   = d.monthYear   || auditInfo.monthYear   || '';
  const vehicleType = d.vehicleType || auditInfo.serie        || '';
  const plant       = d.plant       || auditInfo.plant        || '';

  const qkValues   = rows.map(r => parseFloat(r.qk)).filter(n => !isNaN(n));
  const qkMin      = qkValues.length ? Math.min(...qkValues).toFixed(1) : '';
  const qkMax      = qkValues.length ? Math.max(...qkValues).toFixed(1) : '';
  const qkAvg      = qkValues.length ? (qkValues.reduce((a,b)=>a+b,0)/qkValues.length).toFixed(2) : '';
  const nbAudited  = rows.filter(r => r.drawingNo || r.partDesc).length;
  const nbExceeded = qkValues.filter(v => v > 1.0).length;
  const avgPts     = rows.map(r => parseFloat(r.totalPoints)).filter(n=>!isNaN(n));
  const avgPointsVal = avgPts.length ? (avgPts.reduce((a,b)=>a+b,0)/avgPts.length).toFixed(1) : '';

  return (
    <div style={{ background:'#fff', fontFamily:'Arial,sans-serif' }}>
      {/* ── Header standard ── */}
      <AnnexeHeader
        numero="Annexe 1(a)"
        titre="Monthly Report — Product Audit Wire Harnesses"
      />
      <div style={{ fontSize:7, color:'#666', padding:'2px 4px', borderBottom:'1px solid #ccc', marginBottom:4 }}>
        PI3010 Enclosure 1(a) / 09.24
      </div>

      {/* ── Infos rapport ── */}
      <table style={{ width:'100%', borderCollapse:'collapse', border: cellBorder, marginBottom:2 }}>
        <tbody>
          <tr>
            <td style={{ ...cellStyle, borderRight: cellBorder }}>
              <div style={{ display:'flex', gap:20, flexWrap:'wrap' }}>
                <div>
                  <span style={{ fontWeight:800, fontSize:9 }}>Month / Year : </span>
                  <input style={{ ...inpCell, borderBottom:'1px solid #000', width:80, display:'inline', textAlign:'center', fontSize:10 }}
                    value={monthYear} onChange={e=>set('monthYear',e.target.value)} placeholder="MM/YYYY"/>
                </div>
                <div>
                  <span style={{ fontWeight:800, fontSize:9 }}>Vehicle type(s) : </span>
                  <input style={{ ...inpCell, borderBottom:'1px solid #000', width:120, display:'inline', textAlign:'left' }}
                    value={vehicleType} onChange={e=>set('vehicleType',e.target.value)}/>
                </div>
                <div style={{ marginLeft:'auto' }}>
                  <span style={{ fontWeight:800, fontSize:9 }}>Manufacturing Plant : </span>
                  <input style={{ ...inpCell, borderBottom:'1px solid #000', width:100, display:'inline', textAlign:'left' }}
                    value={plant} onChange={e=>set('plant',e.target.value)}/>
                </div>
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      {/* ── Tableau principal — TOUTES les lignes affichées même vides ── */}
      <div style={{ overflowX:'auto' }}>
        <table style={{ width:'100%', borderCollapse:'collapse', fontSize:9 }}>
          <thead>
            <tr>
              <th style={{ ...headerStyle, minWidth:160 }}>
                Part Description /<br/>Drawing Number / Identification<br/>Production Date / Product Auditor
              </th>
              <th style={{ ...headerStyle, width:55 }}>Quality Class (QK)</th>
              <th style={{ ...headerStyle, width:55 }}>Number of defects</th>
              <th style={{ ...headerStyle, width:65 }}>Total points allocated</th>
              <th style={{ ...headerStyle, width:60 }}>Rating Factor</th>
              <th style={{ ...headerStyle, width:40, background:'#1D3A6E', fontSize:8 }}>D</th>
              <th style={{ ...headerStyle, width:40, background:'#1D3A6E', fontSize:8 }}>N</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => {
              const qkNum = parseFloat(r.qk);
              const isNok = !isNaN(qkNum) && qkNum > 1.0;
              return (
                <tr key={i} style={{ height:44, background: isNok ? '#FEF2F2' : i%2===0?'#fff':'#f5f5f5' }}>
                  <td style={{ ...cellStyle, verticalAlign:'top', padding:3 }}>
                    <input style={{ ...inpCell, textAlign:'left', borderBottom:'1px solid #e2e8f0', marginBottom:1, display:'block' }}
                      placeholder="Part Description" value={r.partDesc} onChange={e=>updRow(i,'partDesc',e.target.value)}/>
                    <input style={{ ...inpCell, textAlign:'left', borderBottom:'1px solid #e2e8f0', marginBottom:1, display:'block', fontSize:8 }}
                      placeholder="Drawing Number / Identification" value={r.drawingNo} onChange={e=>updRow(i,'drawingNo',e.target.value)}/>
                    <input style={{ ...inpCell, textAlign:'left', borderBottom:'1px solid #e2e8f0', marginBottom:1, display:'block', fontSize:8 }}
                      placeholder="Production Date" value={r.productionDate} onChange={e=>updRow(i,'productionDate',e.target.value)}/>
                    <input style={{ ...inpCell, textAlign:'left', display:'block', fontSize:8 }}
                      placeholder="Product Auditor" value={r.productAuditor} onChange={e=>updRow(i,'productAuditor',e.target.value)}/>
                  </td>
                  <td style={{ ...cellStyle, textAlign:'center' }}>
                    <input style={{ ...inpCell, fontWeight:800, fontSize:11,
                      color: isNok ? T.danger : !isNaN(qkNum) && qkNum > 0 ? T.orange : '#059669' }}
                      type="number" step="0.1" value={r.qk} onChange={e=>updRow(i,'qk',e.target.value)}/>
                  </td>
                  <td style={{ ...cellStyle, textAlign:'center' }}>
                    <input style={inpCell} type="number" value={r.nbDefects} onChange={e=>updRow(i,'nbDefects',e.target.value)}/>
                  </td>
                  <td style={{ ...cellStyle, textAlign:'center' }}>
                    <input style={inpCell} type="number" value={r.totalPoints} onChange={e=>updRow(i,'totalPoints',e.target.value)}/>
                  </td>
                  <td style={{ ...cellStyle, textAlign:'center' }}>
                    <input style={inpCell} type="number" step="0.1" value={r.ratingFactor} onChange={e=>updRow(i,'ratingFactor',e.target.value)}/>
                  </td>
                  {/* Checkbox professionnel carré — PAS de cercle rose */}
                  <td style={{ ...cellStyle, textAlign:'center' }}>
                    <input type="checkbox" checked={!!r.destructive} onChange={e=>updRow(i,'destructive',e.target.checked)}
                      style={{ width:14, height:14, cursor:'pointer', accentColor: T.navy }}/>
                  </td>
                  <td style={{ ...cellStyle, textAlign:'center' }}>
                    <input type="checkbox" checked={!!r.nonDestructive} onChange={e=>updRow(i,'nonDestructive',e.target.checked)}
                      style={{ width:14, height:14, cursor:'pointer', accentColor: T.navy }}/>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ── Résumé ── */}
      <table style={{ width:'100%', borderCollapse:'collapse', border: cellBorder, marginTop:2 }}>
        <tbody>
          <tr>
            <td style={{ ...cellStyle, width:'35%', borderRight: cellBorder }}>
              <div style={{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap' }}>
                <span style={{ fontWeight:800, fontSize:9 }}>QK min. :</span>
                <div style={{ border:'1px solid #000', padding:'2px 8px', minWidth:40, fontSize:11, fontWeight:900, textAlign:'center',
                  background: qkMin&&parseFloat(qkMin)>1?T.dangerBg:'#ECFDF5' }}>{qkMin||'—'}</div>
                <span style={{ fontWeight:800, fontSize:9 }}>QK avg. :</span>
                <div style={{ border:'1px solid #000', padding:'2px 8px', minWidth:40, fontSize:11, fontWeight:900, textAlign:'center' }}>{qkAvg||'—'}</div>
                <span style={{ fontWeight:800, fontSize:9 }}>QK max. :</span>
                <div style={{ border:'1px solid #000', padding:'2px 8px', minWidth:40, fontSize:11, fontWeight:900, textAlign:'center',
                  background: qkMax&&parseFloat(qkMax)>1?T.dangerBg:'#fff' }}>{qkMax||'—'}</div>
              </div>
            </td>
            <td style={{ ...cellStyle, borderRight: cellBorder }}>
              <span style={{ fontWeight:800, fontSize:9 }}>Average Points</span>
              <div style={{ display:'inline-block', border:'1px solid #000', padding:'2px 10px', marginLeft:6, minWidth:50, fontWeight:900, fontSize:11 }}>
                {avgPointsVal||'—'}
              </div>
            </td>
            <td style={{ ...cellStyle, fontSize:9, fontWeight:700 }}>[Internal]</td>
          </tr>
          <tr>
            <td colSpan={3} style={{ ...cellStyle, fontSize:9, fontWeight:600 }}>
              <b>Harnesses audited : ({nbAudited})</b>&nbsp;&nbsp;&nbsp;
              In <b style={{ color: nbExceeded>0?T.danger:'#059669' }}>{nbExceeded}</b> cases the threshold was exceeded.
            </td>
          </tr>
        </tbody>
      </table>

      <button onClick={() => {
        const r = [...rows, { partDesc:'',drawingNo:'',productionDate:'',productAuditor:'',
          qk:'',nbDefects:'',totalPoints:'',ratingFactor:'',destructive:false,nonDestructive:false }];
        setRows(r); set('rows', r);
      }} style={{ marginTop:8, padding:'5px 14px', background:T.infoBg, color:T.info,
        border:`1px solid ${T.infoBd}`, borderRadius:4, fontSize:10, fontWeight:700, cursor:'pointer' }}>
        + Ajouter une ligne
      </button>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
//  ANNEXE 1B — Fiche individuelle QK
//  auditInfo : { auditorName, serie, plant, vehicleType, date, tab, drawingDate, auditType }
// ════════════════════════════════════════════════════════════════════
export function FormAnnexe1B({ data, onChange, injectedDefauts = [], auditInfo = {} }) {
  const d = data || {};

  const defauts = d.defauts || [];
  const nbComposants = d.nbComposants !== undefined ? String(d.nbComposants) : '';

  const [showCatalog, setShowCatalog] = useState(false);
  const [catalogSearch, setCatalogSearch] = useState('');
  const [selectedComponent, setSelectedComponent] = useState(null);

  const injectedSignature = useMemo(() => {
    return (injectedDefauts || [])
      .map(defaut => [
        defaut?.code || '',
        defaut?.description || '',
        defaut?.type || '',
        defaut?.freq || 1,
        defaut?.pointsDefect || 25,
        defaut?.sourceAnnexe || '',
      ].join('::'))
      .sort()
      .join('|');
  }, [injectedDefauts]);

  const injectedRef = useRef('');
  useEffect(() => {
    if (!injectedDefauts || injectedDefauts.length === 0) return;
    if (injectedSignature === injectedRef.current) return;
    injectedRef.current = injectedSignature;

    const newDefauts = [...defauts];
    let changed = false;

    for (const inj of injectedDefauts) {
      if (!inj.code) continue;
      const existingIndex = newDefauts.findIndex(x => x.code === inj.code && (x.sourceAnnexe || '') === (inj.sourceAnnexe || ''));
      if (existingIndex !== -1) {
        const existing = newDefauts[existingIndex];
        const nextFreq = (parseInt(existing.freq, 10) || 1) + (parseInt(inj.freq, 10) || 1);
        newDefauts[existingIndex] = {
          ...existing,
          description: existing.description || inj.description || '',
          type: existing.type || inj.type || 'F',
          freq: nextFreq,
          pointsDefect: existing.pointsDefect || inj.pointsDefect || 25,
          totalDefectPoints: nextFreq * (parseInt(existing.pointsDefect, 10) || parseInt(inj.pointsDefect, 10) || 25),
          sourceAnnexe: existing.sourceAnnexe || inj.sourceAnnexe || '',
        };
        changed = true;
      } else {
        const freq = parseInt(inj.freq, 10) || 1;
        const pointsDefect = parseInt(inj.pointsDefect, 10) || 25;
        newDefauts.push({
          code: inj.code,
          description: inj.description || '',
          componentCode: inj.componentCode || '',
          componentLabel: inj.componentLabel || '',
          type: inj.type || 'F',
          freq,
          pointsDefect,
          totalDefectPoints: freq * pointsDefect,
          sourceAnnexe: inj.sourceAnnexe || '',
        });
        changed = true;
      }
    }

    if (changed) onChange({ ...d, defauts: newDefauts });
  }, [d, defauts, injectedDefauts, injectedSignature, onChange]);

  const setNbComposants = useCallback((v) => {
    onChange({ ...d, nbComposants: v === '' ? '' : Number(v) });
  }, [d, onChange]);

  // APRÈS (pointsDefect n'est plus modifiable à la main, seule la fréquence l'est)
  const updDefaut = useCallback((i, key, value) => {
    const nd = [...defauts];
    const updated = { ...nd[i], [key]: value };
    if (key === 'freq') {
      const freq = parseInt(value, 10)||0;
      const pts  = parseInt(updated.pointsDefect, 10)||0;
      updated.totalDefectPoints = freq * pts;
    }
    nd[i] = updated;
    onChange({ ...d, defauts: nd });
  }, [d, defauts, onChange]);

  const removeDefaut = useCallback((i) => {
    onChange({ ...d, defauts: defauts.filter((_,idx) => idx !== i) });
  }, [d, defauts, onChange]);

  const addFromCatalog = useCallback((componentCode, code) => {
    const def = getDefaut(componentCode, code);
    if (!def) return;
    const comp = getComponent(componentCode);
    const existingIndex = defauts.findIndex(x => x.code === code && x.componentCode === componentCode);
    if (existingIndex !== -1) {
      const nd = [...defauts];
      const freq = (parseInt(nd[existingIndex].freq, 10)||0) + 1;
      nd[existingIndex] = { ...nd[existingIndex], freq, totalDefectPoints: freq * def.points };
      onChange({ ...d, defauts: nd });
    } else {
      onChange({ ...d, defauts: [...defauts, {
        code: def.code,
        description: def.label,
        componentCode,
        componentLabel: comp ? comp.label : '',
        type: 'F',
        freq: 1,
        pointsDefect: def.points,
        totalDefectPoints: def.points,
      }]});
    }
    setShowCatalog(false); setCatalogSearch(''); setSelectedComponent(null);
  }, [d, defauts, onChange]);

  const set = useCallback((k, v) => onChange({ ...d, [k]: v }), [d, onChange]);

  // Calculs QK
  const totalDefectPoints = defauts.reduce((s, x) => s + (parseInt(x.totalDefectPoints)||0), 0);
  const nbComp = parseInt(nbComposants, 10);
  const nbCompValide = !isNaN(nbComp) && nbComp > 0;
  const ratingFactor = nbCompValide ? getRatingFactor(nbComp) : null;
  const weightedPoints = ratingFactor !== null ? totalDefectPoints * ratingFactor : null;
  const qkValue = weightedPoints !== null ? calculateQK(weightedPoints) : null;
  const qkColor = qkValue !== null ? computeQKColor(qkValue) : null;

  const lastSyncRef = useRef('');
  useEffect(() => {
    const payload = {
      ...d, totalPoints: totalDefectPoints, weightedPoints, ratingFactor,
      nbDefects: defauts.length,
      valeurQK: qkValue === null ? '' : Number(qkValue.toFixed(1)),
      couleurQK: qkColor,
    };
    const syncKey = JSON.stringify({ totalDefectPoints, weightedPoints, ratingFactor, nbDefects: defauts.length,
      qkValue: qkValue === null ? '' : Number(qkValue.toFixed(1)), qkColor });
    if (lastSyncRef.current === syncKey) return;
    lastSyncRef.current = syncKey;
    onChange(payload);
  }, [defauts.length, qkColor, qkValue, ratingFactor, totalDefectPoints, weightedPoints]);

  const countByType = DEFAUT_TYPES.reduce((acc, t) => ({
    ...acc,
    [t.key]: defauts.filter(x => x.type === t.key).reduce((s,x) => s+(parseInt(x.totalDefectPoints)||0), 0)
  }), {});

  // APRÈS (deux niveaux : liste des composants, puis leurs codes)
  const componentsFlat = useMemo(() =>
    LEONI_DEFECT_CATEGORIES.flatMap(cat => cat.components.map(comp => ({ ...comp, categoryLabel: cat.label }))),
  []);

  const filteredComponents = useMemo(() => {
    const q = catalogSearch.toLowerCase();
    if (!q) return componentsFlat;
    return componentsFlat.filter(c =>
      c.code.toLowerCase().includes(q) ||
      c.label.toLowerCase().includes(q) ||
      c.categoryLabel.toLowerCase().includes(q));
  }, [componentsFlat, catalogSearch]);

  const qkMeta = {
    VERT:   { color:'#059669', bg:'#ECFDF5', label:'Produit Conforme — QK = 0' },
    ORANGE: { color:T.orange,  bg:'#FFFBEB', label:'Non-Conformité Mineure — Fiche réparation' },
    ROSE:   { color:'#9D174D', bg:'#FDF2F8', label:'Action Corrective — Fiche + PDCA' },
    ROUGE:  { color:T.danger,  bg:'#FEF2F2', label:'ALERTE CRITIQUE — Action immédiate' },
  }[qkColor] || {};

  // Pré-remplissage depuis auditInfo
  const auditor     = d.auditor     || auditInfo.auditorName || '';
  const plant       = d.plant       || auditInfo.plant       || '';
  const vehicleType = d.vehicleType || auditInfo.serie       || '';
  const tab         = d.tab         || auditInfo.tab         || '';
  
  // ✅ NOUVEAU : Pré-remplissage des dates et type d'audit
  const today = new Date().toISOString().split('T')[0];
  const dateValue = d.date || auditInfo.date || today;
  const drawingDateValue = d.drawingDate || auditInfo.drawingDate || today;
  
  // Pré-remplissage du type d'audit (D/N)
  const auditTypeValue = d.auditType || (auditInfo.auditType === 'DESTRUCTIF' ? 'D' : 'N');

  return (
    <div style={{ background:'#fff', fontFamily:'Arial,sans-serif' }}>
      {/* ── Header standard ── */}
      <AnnexeHeader
        numero="Annexe 1(b)"
        titre="Monthly Report — Product Audit Wiring Harness"
      />
      <div style={{ fontSize:7, color:'#666', padding:'2px 4px', borderBottom:'1px solid #ccc', marginBottom:4 }}>
        PI3010 Enclosure 1(b) / 09.24 &nbsp;|&nbsp; Target: QC ≤ 0,5 &nbsp;|&nbsp; Threshold: QC = 1,0
      </div>

      {/* ── Note VW/Audi : tableau de pondération ── */}
      {(auditInfo?.plant?.toLowerCase().includes('vw') || 
        auditInfo?.plant?.toLowerCase().includes('audi') ||
        auditInfo?.serie?.toLowerCase().includes('vw') ||
        auditInfo?.serie?.toLowerCase().includes('audi')) && (
        <details style={{ 
          margin:'0 0 8px 0', 
          border:'1.5px solid #1a56a0', 
          borderRadius:6, 
          fontSize:9,
          fontFamily:'Arial,sans-serif',
        }}>
          <summary style={{ 
            background:'#1a56a0', color:'#fff', padding:'5px 10px',
            fontWeight:800, fontSize:9, cursor:'pointer', userSelect:'none',
            listStyle:'none', display:'flex', alignItems:'center', gap:6,
          }}>
            📋 Aide — Pondération des défauts (PI3010 / VW Group)
            <span style={{ marginLeft:'auto', fontSize:10 }}>▼</span>
          </summary>
          <div style={{ padding:'8px 10px', background:'#F7F9FC' }}>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:9 }}>
              <thead>
                <tr>
                  <th style={{ background:'#1a56a0', color:'#fff', padding:'4px 8px', 
                    border:'1px solid #000', textAlign:'left' }}>
                    Type de défaut
                  </th>
                  <th style={{ background:'#1a56a0', color:'#fff', padding:'4px 8px', 
                    border:'1px solid #000', textAlign:'center', width:70 }}>
                    Points
                  </th>
                  <th style={{ background:'#1a56a0', color:'#fff', padding:'4px 8px', 
                    border:'1px solid #000', textAlign:'center', width:60 }}>
                    Classe
                  </th>
                </tr>
              </thead>
              <tbody>
                {[
                  { label:'Aspect visuel', pts:'25 points', classe:'C', bg:'#FFFF00' },
                  { label:'Défaut qui engendre une perturbation minime chez le client', pts:'50 points', classe:'C', bg:'#FFFF00' },
                  { label:'Défaut à impact significatif', pts:'75 points', classe:'B', bg:'#FFFF00' },
                  { label:'Défaut sécuritaire ou règlementaire', pts:'100 points', classe:'A', bg:'#FF0000' },
                ].map((row, i) => (
                  <tr key={i}>
                    <td style={{ border:'1px solid #000', padding:'3px 8px', 
                      background:'#fff', fontSize:9 }}>
                      {row.label}
                    </td>
                    <td style={{ border:'1px solid #000', padding:'3px 8px', 
                      textAlign:'center', background:'#fff', fontWeight:700 }}>
                      {row.pts}
                    </td>
                    <td style={{ border:'1px solid #000', padding:'3px 8px', 
                      textAlign:'center', fontWeight:900, fontSize:11,
                      background: row.bg,
                      color: row.bg === '#FF0000' ? '#fff' : '#000' }}>
                      {row.classe}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div style={{ marginTop:8, borderTop:'1px solid #E2E8F0', paddingTop:6 }}>
              <div style={{ fontWeight:800, fontSize:9, color:'#1a56a0', marginBottom:4 }}>
                Facteur de pondération selon nombre de composants (PI3010)
              </div>
              <table style={{ width:'100%', borderCollapse:'collapse', fontSize:9 }}>
                <thead>
                  <tr>
                    <th style={{ background:'#d0d8e8', border:'1px solid #000', 
                      padding:'3px 6px', textAlign:'center' }}>
                      Nb composants
                    </th>
                    <th style={{ background:'#d0d8e8', border:'1px solid #000', 
                      padding:'3px 6px', textAlign:'center' }}>
                      Facteur
                    </th>
                    <th style={{ background:'#d0d8e8', border:'1px solid #000', 
                      padding:'3px 6px', textAlign:'center' }}>
                      Nb composants
                    </th>
                    <th style={{ background:'#d0d8e8', border:'1px solid #000', 
                      padding:'3px 6px', textAlign:'center' }}>
                      Facteur
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ['< 50','4.0','201 – 400','0.9'],
                    ['51 – 100','2.0','401 – 800','0.8'],
                    ['101 – 200','1.0','801 – 1600','0.7'],
                    ['','','1601 – 2600','0.6'],
                    ['','','2601 – 4700','0.5'],
                    ['','','> 4701','0.4'],
                  ].map((row, i) => (
                    <tr key={i}>
                      {row.map((cell, j) => (
                        <td key={j} style={{ border:'1px solid #000', padding:'2px 6px',
                          textAlign:'center', background: i%2===0?'#fff':'#f5f5f5',
                          fontWeight: j===1||j===3 ? 800 : 400 }}>
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ marginTop:6, padding:'4px 8px', background:'#EFF6FF', 
              border:'1px solid #BFDBFE', borderRadius:4, fontSize:8, color:'#1E40AF' }}>
              🎯 <b>Cible :</b> QC ≤ 0,5 &nbsp;|&nbsp; 
              ⚠ <b>Seuil :</b> QC &gt; 1,0 &nbsp;|&nbsp; 
              Source : PI3010 v23 / VW Group Guideline 05/2021
            </div>
          </div>
        </details>
      )}

      {/* ── Infos câblage — champs pré-remplis ── */}
      <table style={{ width:'100%', borderCollapse:'collapse', border: cellBorder, marginBottom:2 }}>
        <tbody>
          <tr>
            <td style={{ ...cellStyle, width:'35%', borderRight: cellBorder }}>
              <div style={{ fontSize:9, fontWeight:700 }}>Part Description</div>
              <input style={{ ...inpCell, borderBottom:'1px solid #ccc', textAlign:'left', fontSize:10 }}
                value={d.partDesc||''} onChange={e=>set('partDesc',e.target.value)} placeholder="Description de la pièce" />
            </td>
            <td style={{ ...cellStyle, width:'20%', borderRight: cellBorder }}>
              <div style={{ fontSize:9, fontWeight:700 }}>Department</div>
              <input style={{ ...inpCell, borderBottom:'1px solid #ccc', textAlign:'left' }}
                value={d.department||''} onChange={e=>set('department',e.target.value)} />
            </td>
            <td style={{ ...cellStyle, width:'20%', borderRight: cellBorder }}>
              <div style={{ fontSize:9, fontWeight:700 }}>Date</div>
              <input type="date" style={{ ...inpCell, borderBottom:'1px solid #ccc', textAlign:'left' }}
                value={dateValue} onChange={e=>set('date',e.target.value)} />
            </td>
            <td style={{ ...cellStyle }}>
              <div style={{ fontSize:9, fontWeight:700 }}>Destructive / Non Destr.</div>
              <div style={{ display:'flex', gap:10, marginTop:2 }}>
                <label style={{ fontSize:9, display:'flex', alignItems:'center', gap:3, cursor:'pointer' }}>
                  <input type="radio" name="auditType1b" 
                    checked={auditTypeValue === 'D'} 
                    onChange={()=>set('auditType','D')} /> D
                </label>
                <label style={{ fontSize:9, display:'flex', alignItems:'center', gap:3, cursor:'pointer' }}>
                  <input type="radio" name="auditType1b" 
                    checked={auditTypeValue === 'N' || (auditTypeValue === undefined)} 
                    onChange={()=>set('auditType','N')} /> N
                </label>
              </div>
            </td>
          </tr>
          <tr>
            <td style={{ ...cellStyle, borderRight: cellBorder }}>
              <div style={{ fontSize:9, fontWeight:700 }}>Vehicle Type</div>
              <input style={{ ...inpCell, borderBottom:'1px solid #ccc', textAlign:'left' }}
                value={vehicleType} onChange={e=>set('vehicleType',e.target.value)} />
            </td>
            <td style={{ ...cellStyle, borderRight: cellBorder }}>
              <div style={{ fontSize:9, fontWeight:700 }}>Plant</div>
              <input style={{ ...inpCell, borderBottom:'1px solid #ccc', textAlign:'left' }}
                value={plant} onChange={e=>set('plant',e.target.value)} />
            </td>
            <td colSpan={2} style={{ ...cellStyle }}>
              <div style={{ fontSize:9, fontWeight:700 }}>Identification</div>
              <input style={{ ...inpCell, borderBottom:'1px solid #ccc', textAlign:'left' }}
                value={d.identification||''} onChange={e=>set('identification',e.target.value)} />
            </td>
          </tr>
          <tr>
            <td style={{ ...cellStyle, borderRight: cellBorder }}>
              <div style={{ fontSize:9, fontWeight:700 }}>Tab</div>
              <input style={{ ...inpCell, borderBottom:'1px solid #ccc', textAlign:'left' }}
                value={tab} onChange={e=>set('tab',e.target.value)} />
            </td>
            <td style={{ ...cellStyle, borderRight: cellBorder }}>
              <div style={{ fontSize:9, fontWeight:700 }}>Auditor</div>
              <input style={{ ...inpCell, borderBottom:'1px solid #ccc', textAlign:'left', fontWeight: auditor ? 700 : 400 }}
                value={auditor} onChange={e=>set('auditor',e.target.value)}
                placeholder={auditInfo.auditorName ? '' : 'Nom auditeur'} />
            </td>
            <td colSpan={2} style={{ ...cellStyle }}>
              <div style={{ fontSize:9, fontWeight:700 }}>Drawing date</div>
              <input type="date" style={{ ...inpCell, borderBottom:'1px solid #ccc', textAlign:'left' }}
                value={drawingDateValue} onChange={e=>set('drawingDate',e.target.value)} />
            </td>
          </tr>
        </tbody>
      </table>

      {/* ── Résumé calcul QK ── */}
      <table style={{ width:'100%', borderCollapse:'collapse', border: cellBorder, marginBottom:2 }}>
        <tbody>
          <tr>
            <td style={{ ...cellStyle, width:'55%', borderRight: cellBorder, verticalAlign:'top' }}>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6, padding:4 }}>
                <div>
                  <div style={{ fontSize:9, fontWeight:700, color:'#374151', marginBottom:2 }}>Defect Points (Total)</div>
                  <div style={{ border:'1px solid #000', padding:'3px 8px', fontWeight:900, fontSize:13, textAlign:'center', background:'#F0F0F0' }}>
                    {totalDefectPoints}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize:9, fontWeight:700, color:'#374151', marginBottom:2 }}>Nb Composants</div>
                  <input type="number" value={nbComposants} onChange={e=>setNbComposants(e.target.value)}
                    style={{ border:'1px solid #000', padding:'3px 8px', width:80, fontWeight:700, fontSize:12, textAlign:'center', outline:'none', fontFamily:'Arial' }}
                    placeholder="ex: 250" />
                </div>
                <div>
                  <div style={{ fontSize:9, fontWeight:700, color:'#374151', marginBottom:2 }}>Rating Factor</div>
                  <div style={{ border:'1px solid #000', padding:'3px 8px', fontWeight:900, fontSize:13, textAlign:'center',
                    background: ratingFactor !== null ? '#F0F0F0' : '#FFF9E6',
                    color: ratingFactor !== null ? '#000' : T.orange }}>
                    {ratingFactor !== null ? ratingFactor.toFixed(1) : '—'}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize:9, fontWeight:700, color:'#374151', marginBottom:2 }}>Weighted Points</div>
                  <div style={{ border:'1px solid #000', padding:'3px 8px', fontWeight:900, fontSize:13, textAlign:'center', background:'#F0F0F0' }}>
                    {weightedPoints !== null ? weightedPoints.toFixed(1) : '—'}
                  </div>
                </div>
                {DEFAUT_TYPES.map(t => (
                  <div key={t.key}>
                    <div style={{ fontSize:9, fontWeight:700, color:'#374151', marginBottom:2 }}>{t.full}</div>
                    <div style={{ border:'1px solid #000', padding:'3px 6px', fontSize:11, textAlign:'center', fontWeight:700 }}>
                      {countByType[t.key] || 0}
                    </div>
                  </div>
                ))}
                <div>
                  <div style={{ fontSize:9, fontWeight:700, color:'#374151', marginBottom:2 }}>Number of defects</div>
                  <div style={{ border:'1px solid #000', padding:'3px 8px', fontWeight:900, fontSize:13, textAlign:'center', background:'#F0F0F0' }}>
                    {defauts.length}
                  </div>
                </div>
              </div>
            </td>
            <td style={{ ...cellStyle, textAlign:'center', verticalAlign:'middle', padding:12 }}>
              <div style={{ fontWeight:900, fontSize:11, marginBottom:8 }}>Quality Class</div>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:10 }}>
                <span style={{ fontWeight:900, fontSize:16 }}>QK</span>
                <div style={{ border:'2px solid #000', padding:'8px 16px', minWidth:70, fontWeight:900, fontSize:28, textAlign:'center',
                  background: qkMeta.bg||'#fff', color: qkMeta.color||'#9CA3AF' }}>
                  {qkValue !== null ? qkValue.toFixed(1) : '—'}
                </div>
              </div>
              {qkColor && (
                <div style={{ marginTop:8, padding:'4px 8px', borderRadius:4, background: qkMeta.bg,
                  color: qkMeta.color, fontSize:9, fontWeight:700, border:`1px solid ${qkMeta.color}30` }}>
                  {qkMeta.label}
                </div>
              )}
            </td>
          </tr>
        </tbody>
      </table>

      {/* ── Tableau défauts — style professionnel ── */}
      <div style={{ marginBottom:4 }}>
        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6, padding:'6px 0' }}>
          <div style={{ fontWeight:800, fontSize:11, color: T.navy }}>Défauts détectés ({defauts.length})</div>
          <div style={{ marginLeft:'auto', display:'flex', gap:6 }}>
            <button onClick={()=>setShowCatalog(true)}
              style={{ padding:'7px 12px', background: T.navy, color:'#fff', border:'none',
                borderRadius:4, fontSize:9, fontWeight:700, cursor:'pointer' }}>
               Choisir un code défaut
            </button>
          </div>
        </div>

        <div style={{ overflowX:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:9, border: cellBorder }}>
            <thead>
              <tr>
                <th style={{ ...headerStyle, width:110 }}>Composant (PI3010)</th>
                <th style={{ ...headerStyle, width:50 }}>Code</th>
                <th style={{ ...headerStyle, width:40 }}>Type<br/><span style={{ fontSize:7, fontWeight:400 }}>(F/S/K/L)</span></th>
                <th style={{ ...headerStyle }}>Defect Type / Description<br/><span style={{ fontSize:7, fontWeight:400 }}>Corrective action</span></th>
                <th style={{ ...headerStyle, width:50 }}>Freq.</th>
                <th style={{ ...headerStyle, width:60 }}>Points/<br/>Defect</th>
                <th style={{ ...headerStyle, width:70 }}>Total Defect<br/>Points</th>
                <th style={{ ...headerStyle, width:30, background:'#7B0000' }}>✕</th>
              </tr>
            </thead>
            <tbody>
              {defauts.length === 0 && (
                <tr>
                  <td colSpan={8} style={{ ...cellStyle, textAlign:'center', padding:20, color:'#9CA3AF', fontStyle:'italic', fontSize:10 }}>
                    Aucun défaut enregistré. Cliquez sur "Choisir un code défaut".
                  </td>
                </tr>
              )}
              {defauts.map((df, i) => {
                const totalRow = (parseInt(df.freq)||0) * (parseInt(df.pointsDefect)||0);
                const typeColor = DEFAUT_TYPES.find(t => t.key === df.type)?.color || '#374151';
                return (
                  <tr key={i} style={{ background: i%2===0?'#fff':'#f5f5f5' }}>
                    <td style={{ ...cellStyle, fontSize:8 }}>
                      <span style={{ fontWeight:800, color:T.navy }}>{df.componentCode}</span> — {df.componentLabel}
                    </td>
                    <td style={{ ...cellStyle, textAlign:'center', fontWeight:800, color: T.navy }}>{df.code}</td>
                    <td style={{ ...cellStyle, textAlign:'center' }}>
                      <select value={df.type} onChange={e=>updDefaut(i,'type',e.target.value)}
                        style={{ ...inpCell, fontWeight:800, color: typeColor, width:32, cursor:'pointer' }}>
                        {DEFAUT_TYPES.map(t => <option key={t.key} value={t.key}>{t.key}</option>)}
                      </select>
                    </td>
                    <td style={{ ...cellStyle }}>
                      <input style={{ ...inpCell, textAlign:'left', width:'100%' }}
                        value={df.description} onChange={e=>updDefaut(i,'description',e.target.value)}
                        placeholder="Description du défaut" />
                      <div style={{ marginTop:3, borderTop:'1px dashed #e2e8f0', paddingTop:2 }}>
                        <span style={{ fontSize:8, color:'#9CA3AF', marginRight:4 }}>Action corrective :</span>
                        <input style={{ ...inpCell, textAlign:'left', fontSize:8, color:'#374151', width:'70%' }}
                          value={df.action||''} onChange={e=>updDefaut(i,'action',e.target.value)}
                          placeholder="Action introduite..." />
                      </div>
                    </td>
                    <td style={{ ...cellStyle, textAlign:'center' }}>
                      <input type="number" min={1} style={{ ...inpCell, fontWeight:700, fontSize:11 }}
                        value={df.freq} onChange={e=>updDefaut(i,'freq',parseInt(e.target.value)||1)} />
                    </td>
                    <td style={{ ...cellStyle, textAlign:'center', fontWeight:800 }}>
                      {df.pointsDefect}
                    </td>
                    <td style={{ ...cellStyle, textAlign:'center', fontWeight:900, fontSize:11,
                      background: totalRow>=100?'#FEF2F2':totalRow>=50?'#FFFBEB':'#F0FFF4',
                      color: totalRow>=100?T.danger:totalRow>=50?T.orange:'#059669' }}>
                      {totalRow}
                    </td>
                    <td style={{ ...cellStyle, textAlign:'center', cursor:'pointer' }} onClick={()=>removeDefaut(i)}>
                      <span style={{ color:'#DC2626', fontWeight:900, fontSize:12 }}>✕</span>
                    </td>
                  </tr>
                );
              })}
              {defauts.length > 0 && (
                <tr style={{ background:'#F1F5F9' }}>
                  <td colSpan={6} style={{ ...cellStyle, textAlign:'right', fontWeight:900, fontSize:10 }}>Total :</td>
                  <td style={{ ...cellStyle, textAlign:'center', fontWeight:900, fontSize:13, color: totalDefectPoints>0?T.danger:'#059669' }}>
                    {totalDefectPoints}
                  </td>
                  <td style={cellStyle} />
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Table actions correctives ── */}
      {defauts.length > 0 && (
        <table style={{ width:'100%', borderCollapse:'collapse', border: cellBorder, marginTop:4, fontSize:9 }}>
          <thead>
            <tr>
              <th style={{ ...headerStyle, width:'40%' }}>Improvement Action / Corrective action</th>
              <th style={{ ...headerStyle, width:'20%' }}>Pilot</th>
              <th style={{ ...headerStyle, width:'20%' }}>Deadline</th>
              <th style={{ ...headerStyle, width:'20%' }}>Check</th>
            </tr>
          </thead>
          <tbody>
            {defauts.map((df, i) => (
              <tr key={i} style={{ background: i%2===0?'#fff':'#f5f5f5' }}>
                <td style={{ ...cellStyle, padding:3 }}>
                  <span style={{ fontWeight:700, color: T.navy }}>{df.componentCode}/{df.code}</span>{' — '}{df.description}
                  {df.action && <div style={{ fontSize:8, color:'#6B7280', marginTop:2 }}>{df.action}</div>}
                </td>
                <td style={{ ...cellStyle }}>
                  <input style={{ ...inpCell, textAlign:'center' }}
                    value={df.pilot||''} onChange={e=>updDefaut(i,'pilot',e.target.value)} placeholder="Responsable" />
                </td>
                <td style={{ ...cellStyle }}>
                  <input type="date" style={{ ...inpCell, textAlign:'center' }}
                    value={df.deadline||''} onChange={e=>updDefaut(i,'deadline',e.target.value)} />
                </td>
                <td style={{ ...cellStyle, textAlign:'center' }}>
                  <input type="checkbox" checked={!!df.checked} onChange={e=>updDefaut(i,'checked',e.target.checked)}
                    style={{ width:14, height:14, cursor:'pointer', accentColor:'#059669' }} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* ── Bande récap QK ── */}
      <div style={{ marginTop:10, padding:'12px 16px', borderRadius:6,
        background: qkMeta.bg||'#F1F5F9', border:`2px solid ${qkMeta.color||'#CBD5E1'}`,
        display:'flex', alignItems:'center', gap:16, flexWrap:'wrap' }}>
        <div>
          <div style={{ fontSize:9, fontWeight:700, color:'#374151' }}>Total Defect Points</div>
          <div style={{ fontSize:20, fontWeight:900, color: T.navy }}>{totalDefectPoints}</div>
        </div>
        <div style={{ fontSize:18, color:'#9CA3AF' }}>×</div>
        <div>
          <div style={{ fontSize:9, fontWeight:700, color:'#374151' }}>Rating Factor</div>
          <div style={{ fontSize:20, fontWeight:900, color: ratingFactor!==null ? T.navy : T.orange }}>
            {ratingFactor !== null ? ratingFactor.toFixed(1) : '—'}
          </div>
        </div>
        <div style={{ fontSize:18, color:'#9CA3AF' }}>=</div>
        <div>
          <div style={{ fontSize:9, fontWeight:700, color:'#374151' }}>Weighted Points</div>
          <div style={{ fontSize:20, fontWeight:900, color: T.navy }}>
            {weightedPoints !== null ? weightedPoints.toFixed(1) : '—'}
          </div>
        </div>
        <div style={{ fontSize:24, color:'#9CA3AF' }}>→</div>
        <div style={{ textAlign:'center' }}>
          <div style={{ fontSize:9, fontWeight:800, color:'#374151', textTransform:'uppercase', letterSpacing:1 }}>QK</div>
          <div style={{ fontSize:36, fontWeight:900, color: qkMeta.color||'#9CA3AF', lineHeight:1,
            padding:'4px 12px', background:'rgba(255,255,255,0.7)', borderRadius:6,
            border:`1.5px solid ${qkMeta.color||'#CBD5E1'}` }}>
            {qkValue !== null ? qkValue.toFixed(1) : '—'}
          </div>
          {qkColor && <div style={{ fontSize:9, fontWeight:700, color: qkMeta.color, marginTop:4 }}>{qkMeta.label}</div>}
        </div>
      </div>

      {/* ── Modal catalogue — deux niveaux : Composants → Codes ── */}
      {showCatalog && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.6)',
          display:'flex', alignItems:'center', justifyContent:'center', zIndex:9999 }}
          onClick={() => { setShowCatalog(false); setCatalogSearch(''); setSelectedComponent(null); }}>
          <div style={{ background:'#fff', borderRadius:12, width:'92vw', maxWidth:720, maxHeight:'82vh',
            display:'flex', flexDirection:'column', boxShadow:'0 24px 60px rgba(0,0,0,0.3)', overflow:'hidden' }}
            onClick={e => e.stopPropagation()}>

            {/* En-tête */}
            <div style={{ background:'linear-gradient(135deg,#001F4E,#003F8A)', padding:'12px 16px',
              display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <div>
                <div style={{ fontWeight:900, color:'#fff', fontSize:13 }}>
                  {selectedComponent
                    ? `${selectedComponent.code} — ${selectedComponent.label}`
                    : 'Catalogue des Codes Défauts — PI3010'}
                </div>
                <div style={{ fontSize:10, color:'rgba(255,255,255,0.6)' }}>
                  {selectedComponent
                    ? `${selectedComponent.defauts.length} codes défauts disponibles`
                    : `${componentsFlat.length} composants — Enclosure 3`}
                </div>
              </div>
              <div style={{ display:'flex', gap:6 }}>
                {selectedComponent && (
                  <button onClick={()=>setSelectedComponent(null)}
                    style={{ background:'rgba(255,255,255,0.15)', border:'none', color:'#fff', borderRadius:6,
                      padding:'0 10px', height:28, cursor:'pointer', fontSize:11, fontWeight:700 }}>
                    ← Composants
                  </button>
                )}
                <button onClick={()=>{ setShowCatalog(false); setCatalogSearch(''); setSelectedComponent(null); }}
                  style={{ background:'rgba(255,255,255,0.15)', border:'none', color:'#fff', borderRadius:6, width:28, height:28, cursor:'pointer', fontSize:14 }}>✕</button>
              </div>
            </div>

            {/* Barre de recherche (uniquement niveau composants) */}
            {!selectedComponent && (
              <div style={{ padding:'10px 14px', borderBottom:'1px solid #E2E8F0' }}>
                <input value={catalogSearch} onChange={e=>setCatalogSearch(e.target.value)}
                  placeholder="Rechercher un composant (code, libellé, catégorie)…"
                  style={{ width:'100%', padding:'8px 12px', borderRadius:6, border:'1.5px solid #D1D5DB',
                    fontSize:13, outline:'none', fontFamily:'Arial,sans-serif', boxSizing:'border-box' }}
                  autoFocus />
              </div>
            )}

            {/* Niveau 1 : liste des composants */}
            {!selectedComponent && (
              <div style={{ overflowY:'auto', flex:1, padding:'8px 0' }}>
                {filteredComponents.map(comp => (
                  <div key={comp.code} onClick={()=>setSelectedComponent(comp)}
                    style={{ display:'flex', alignItems:'center', gap:12, padding:'9px 14px',
                      cursor:'pointer', background:'#fff', borderBottom:'1px solid #F1F5F9' }}>
                    <div style={{ minWidth:52, fontSize:10, fontWeight:900, color:'#fff',
                      background: T.navy, borderRadius:4, padding:'3px 6px', textAlign:'center' }}>{comp.code}</div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:12, color:'#1D2939', fontWeight:600 }}>{comp.label}</div>
                      <div style={{ fontSize:9, color:'#9CA3AF' }}>{comp.categoryLabel} — {comp.defauts.length} codes</div>
                    </div>
                    <div style={{ fontSize:14, color:'#9CA3AF' }}>›</div>
                  </div>
                ))}
                {filteredComponents.length === 0 && (
                  <div style={{ textAlign:'center', padding:24, color:'#9CA3AF', fontSize:12 }}>Aucun composant trouvé.</div>
                )}
              </div>
            )}

            {/* Niveau 2 : codes défauts du composant sélectionné */}
            {selectedComponent && (
              <div style={{ overflowY:'auto', flex:1, padding:'8px 0' }}>
                {selectedComponent.defauts.map(def => {
                  const alreadyIn = defauts.some(x => x.code === def.code && x.componentCode === selectedComponent.code);
                  const ptsColor = def.points>=100?T.danger:def.points>=75?T.orange:def.points>=50?'#B45309':'#059669';
                  return (
                    <div key={def.code} onClick={()=>addFromCatalog(selectedComponent.code, def.code)}
                      style={{ display:'flex', alignItems:'center', gap:12, padding:'8px 14px',
                        cursor:'pointer', background: alreadyIn ? '#EFF6FF' : '#fff',
                        borderBottom:'1px solid #F1F5F9' }}>
                      <div style={{ minWidth:28, fontSize:11, fontWeight:900, color:'#fff',
                        background: T.navy, borderRadius:4, padding:'3px 6px', textAlign:'center' }}>{def.code}</div>
                      <div style={{ flex:1, fontSize:12, color:'#1D2939' }}>{def.label}</div>
                      <div style={{ minWidth:44, fontSize:11, fontWeight:900, textAlign:'center',
                        color: ptsColor }}>{def.points} pts</div>
                      {alreadyIn && <div style={{ fontSize:9, color: T.info, fontWeight:700 }}>+1 →</div>}
                    </div>
                  );
                })}
                {selectedComponent.defauts.length === 0 && (
                  <div style={{ textAlign:'center', padding:24, color:'#9CA3AF', fontSize:12 }}>Aucun code défaut pour ce composant.</div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
//  HOOK useDefautInjector
// ════════════════════════════════════════════════════════════════════
export function useDefautInjector() {
  const [injectedDefauts, setInjectedDefauts] = useState([]);
  const notifyDefaut = useCallback((defaut) => {
    setInjectedDefauts(prev => {
      const exists = prev.find(d => d.code === defaut.code && d.componentCode === defaut.componentCode);
      if (exists) return prev.map(d => (d.code===defaut.code && d.componentCode===defaut.componentCode) ? {...d, freq:(d.freq||1)+1} : d);
      return [...prev, { freq:1, pointsDefect:25, type:'F', ...defaut }];
    });
  }, []);
  const notifyMultiple = useCallback((defauts) => { defauts.forEach(d=>notifyDefaut(d)); }, [notifyDefaut]);
  const clearDefauts = useCallback(() => setInjectedDefauts([]), []);
  return { injectedDefauts, notifyDefaut, notifyMultiple, clearDefauts };
}

export function extractDefautsFromAnnexe(typeAnnexe, formData) {
  if (!formData) return [];
  const defauts = [];
  // NOTE : les mappings ci-dessous doivent être ré-associés aux couples
  // (componentCode, code) du catalogue officiel LEONI_DEFECT_CATEGORIES
  // selon le contexte métier de chaque case à cocher des annexes 5 et 7.
  if (typeAnnexe === '5') {
    const codes = { s1_0:{componentCode:'8.2',code:'A'}, s1_1:{componentCode:'8.2',code:'A'}, s1_2:{componentCode:'8.1',code:'A'},
      s2_0:{componentCode:'2',code:'K'}, s2_1:{componentCode:'3.1.1',code:'F'}, s2_2:{componentCode:'3.1.1',code:'F'},
      s2_3:{componentCode:'7.1',code:'A'}, s2_4:{componentCode:'2',code:'K'}, s2_5:{componentCode:'1.1.1',code:'H'},
      s2_6:{componentCode:'2',code:'K'}, s2_7:{componentCode:'3.1.2',code:'B'}, s2_8a:{componentCode:'1.1.1',code:'H'},
      s2_8b:{componentCode:'1.1.1',code:'H'}, s2_9:{componentCode:'2',code:'K'}, s2_10:{componentCode:'2',code:'K'},
      s2_11:{componentCode:'2',code:'K'}, s2_12:{componentCode:'2',code:'K'} };
    Object.entries(codes).forEach(([key, ref]) => {
      if (formData[key]==='NON') {
        const def = getDefaut(ref.componentCode, ref.code);
        if (def) {
          const comp = getComponent(ref.componentCode);
          defauts.push({ code: def.code, description: def.label, componentCode: ref.componentCode,
            componentLabel: comp ? comp.label : '', type:'F', freq:1, pointsDefect: def.points });
        }
      }
    });
  }
  if (typeAnnexe === '7') {
    (formData.positions||[]).forEach((pos, idx) => {
      if (pos.resultat==='NOK') {
        const def = getDefaut('2', 'K');
        if (def) defauts.push({ code: def.code, description:`Dimension NC — position ${pos.pos||idx+1}`,
          componentCode:'2', componentLabel: getComponent('2')?.label||'', type:'F', freq:1, pointsDefect: def.points });
      }
      if (pos.resBandage==='NOK') {
        const def = getDefaut('6.1', 'G');
        if (def) defauts.push({ code: def.code, description:`Bandage NC — position ${pos.pos||idx+1}`,
          componentCode:'6.1', componentLabel: getComponent('6.1')?.label||'', type:'F', freq:1, pointsDefect: def.points });
      }
    });
  }
  return defauts;
}

// ════════════════════════════════════════════════════════════════════
//  DÉMO AUTONOME
// ════════════════════════════════════════════════════════════════════
export default function DemoAnnexes1A1B() {
  const [tab, setTab] = useState('1B');
  const [data1A, setData1A] = useState({});
  const [data1B, setData1B] = useState({});

  // Simulation auditInfo pré-rempli
  const auditInfo = {
    auditorName: 'Zaineb Hammouda',
    serie: 'BMW X3',
    plant: 'BMW',
    vehicleType: 'BMW X3',
    tab: 'TAB-2026-01',
    monthYear: '05/2026',
    date: '2026-07-10',
    drawingDate: '2026-07-10',
    auditType: 'DESTRUCTIF', // ou 'NON_DESTRUCTIF'
  };

  useEffect(() => {
    const qk = Number(data1B?.valeurQK);
    if (!Number.isFinite(qk)) return;
    setData1A(prev => {
      const prevRows = Array.isArray(prev?.rows) ? prev.rows : [];
      const nextRow = {
        partDesc: data1B.partDesc || 'Câblage',
        drawingNo: data1B.identification || data1B.partDesc || '—',
        productionDate: data1B.date || new Date().toISOString().slice(0,10),
        productAuditor: data1B.auditor || auditInfo.auditorName || '—',
        qk: qk.toFixed(1),
        nbDefects: data1B.nbDefects ?? 0,
        totalPoints: data1B.totalPoints ?? 0,
        ratingFactor: data1B.ratingFactor ?? '',
        destructive: data1B.auditType==='D',
        nonDestructive: data1B.auditType!=='D',
      };
      const mergedRows = prevRows.length > 0 ? [nextRow, ...prevRows.slice(1)] : [nextRow];
      return { ...prev, monthYear: prev.monthYear||data1B.monthYear||auditInfo.monthYear,
        vehicleType: prev.vehicleType||data1B.vehicleType||auditInfo.vehicleType,
        plant: prev.plant||data1B.plant||auditInfo.plant, rows: mergedRows };
    });
  }, [data1B?.valeurQK, data1B?.partDesc, data1B?.date, data1B?.auditor,
      data1B?.nbDefects, data1B?.totalPoints, data1B?.ratingFactor, data1B?.auditType]);

  return (
    <div style={{ fontFamily:'Arial,sans-serif', background:'#e8eaf0', minHeight:'100vh', padding:12 }}>
      <style>{`*{box-sizing:border-box}`}</style>
      <div style={{ display:'flex', gap:8, marginBottom:12, alignItems:'center' }}>
        {['1A','1B'].map(t => (
          <button key={t} onClick={()=>setTab(t)}
            style={{ padding:'8px 20px', borderRadius:6, fontWeight:800, fontSize:12, cursor:'pointer',
              border:'none', fontFamily:'Arial,sans-serif',
              background: tab===t ? T.navy : '#fff', color: tab===t ? '#fff' : T.navy,
              boxShadow: tab===t ? '0 4px 14px rgba(0,31,78,0.3)' : '0 1px 4px rgba(0,0,0,0.08)' }}>
            Annexe {t} {t==='1A'?'— Overview':'— Fiche QK'}
          </button>
        ))}
        <div style={{ marginLeft:'auto', fontSize:11, color:'#6B7280', fontWeight:700 }}>
          PI3010 — LEONI Product Audit Wiring Harness
        </div>
      </div>
      <div style={{ background:'#fff', borderRadius:10, padding:16, boxShadow:'0 2px 8px rgba(0,0,0,0.08)' }}>
        {tab==='1A' && <FormAnnexe1A data={data1A} onChange={setData1A} auditInfo={auditInfo} />}
        {tab==='1B' && <FormAnnexe1B data={data1B} onChange={setData1B} auditInfo={auditInfo} />}
      </div>
    </div>
  );
}