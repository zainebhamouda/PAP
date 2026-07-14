/**
 * FormAnnexes_LEONI_Complete.jsx
 * ══════════════════════════════════════════════════════════════════
 * TOUS LES FORMULAIRES D'ANNEXES LEONI (IT TN 3625)
 * CORRECTIONS SPRINT 4 :
 *  ✓ Header annexe uniforme : fond #E8F0FB (bleu clair), bordure noire
 *  ✓ Annexe 5 : Oui / Non uniquement (PAS de NA)
 *  ✓ Question 2.12 : champ texte libre (plan de surveillance)
 *  ✓ Checklist style pro : checkbox carré, pas de cercle rose
 *  ✓ Champs pré-remplis depuis auditInfo (auditeur, série, plant, tab)
 *  ✓ Toutes les lignes affichées même vides
 * 
 *  CORRECTIONS SPRINT 6 : Pré-remplissage des dates UNE SEULE FOIS
 *  - Date pré-remplie une seule fois (brouillon persistant)
 *  - Drawing date pré-remplie une seule fois (brouillon persistant)
 *  - Si l'utilisateur modifie, la nouvelle valeur est sauvegardée
 * ══════════════════════════════════════════════════════════════════
 */

import { useState, useEffect, useRef } from 'react';
import { FormAnnexe1A, FormAnnexe1B, useDefautInjector, AnnexeHeader } from './FormAnnexe1A_1B_LEONI';
export { FormAnnexe1A, FormAnnexe1B, useDefautInjector };

// ─── Couleurs LEONI ───────────────────────────────────────────────
const LEONI_NAVY = '#001F4E';
const HDR_BG     = '#E8F0FB';
const HDR_BORDER = '#001F4E';
const TH_BG      = '#1a56a0';

// ─── CSS global ───────────────────────────────────────────────────
const CSS = `
* { box-sizing: border-box; }
.lf { font-family: Arial, Helvetica, sans-serif; font-size: 11px; color: #000; }
.lf table { width: 100%; border-collapse: collapse; }
.lf th {
  background: #1a56a0; color: #fff; padding: 5px 4px;
  font-size: 9px; font-weight: 700; text-align: center;
  border: 1px solid #000; white-space: nowrap;
}
.lf td { padding: 3px 4px; border: 1px solid #000; vertical-align: middle; font-size: 10px; }
.lf tr:nth-child(even) td { background: #f5f5f5; }
.lf .nok td { background: #ffe0e0 !important; }
.lf input[type=text], .lf input[type=number], .lf input[type=date] {
  width: 100%; border: none; outline: none;
  font-family: Arial; font-size: 10px; background: transparent; padding: 1px 2px;
}
.lf select {
  width: 100%; border: none; outline: none;
  font-family: Arial; font-size: 10px; background: transparent; cursor: pointer;
}
.lf input[type=radio] { width: auto; cursor: pointer; }
.lf input[type=checkbox] {
  width: 14px; height: 14px; cursor: pointer;
  accent-color: #001F4E;
}
.lf .sec {
  background: #1a56a0; color: #fff; padding: 5px 8px;
  font-weight: 900; font-size: 10px; margin: 10px 0 6px;
}
.lf .subhdr td { background: #d0d8e8 !important; font-weight: 800; font-size: 10px; padding: 4px 6px; }
.radio-group { display: flex; gap: 10px; justify-content: center; }
.radio-label { display: flex; align-items: center; gap: 3px; font-size: 9px; cursor: pointer; font-weight: 700; }
.radio-label.io  { color: #059669; }
.radio-label.nio { color: #DC2626; }
.radio-label.na  { color: #6B7280; }
.radio-label.oui  { color: #059669; }
.radio-label.non  { color: #DC2626; }
`;

function AnnexeHeaderLocal({ numero, titre }) {
  return (
    <table style={{ width:'100%', borderCollapse:'collapse',
      border:`2px solid ${HDR_BORDER}`, marginBottom:0 }}>
      <tbody>
        <tr>
          <td style={{ width:'22%', border:`1px solid ${HDR_BORDER}`,
            background: HDR_BG, padding:'6px 10px', fontWeight:900, fontSize:11,
            color: LEONI_NAVY, fontFamily:'Arial,sans-serif', verticalAlign:'middle' }}>
            {numero}
          </td>
          <td style={{ border:`1px solid ${HDR_BORDER}`, background: HDR_BG,
            padding:'6px 10px', fontWeight:800, fontSize:11, color:'#000',
            fontFamily:'Arial,sans-serif', verticalAlign:'middle', textAlign:'center' }}>
            {titre}
          </td>
          <td style={{ width:'18%', border:`1px solid ${HDR_BORDER}`, background: HDR_BG,
            padding:'6px 10px', fontWeight:900, fontSize:18, color: LEONI_NAVY,
            fontFamily:'Arial,sans-serif', verticalAlign:'middle', textAlign:'right', letterSpacing:2 }}>
            LEONI
          </td>
        </tr>
      </tbody>
    </table>
  );
}

function Inp({ value, onChange, type='text', w, placeholder='' }) {
  return (
    <input type={type} value={value||''} onChange={e=>onChange(e.target.value)}
      placeholder={placeholder}
      style={{ width:w||'100%', border:'none', outline:'none', fontSize:10,
        fontFamily:'Arial', background:'transparent', padding:'1px 2px' }}
    />
  );
}

function InfoLine({ label, value, onChange, type='text', readOnly=false }) {
  return (
    <span style={{ marginRight:12, fontSize:10 }}>
      <b>{label} :</b>{' '}
      <input type={type} value={value||''} onChange={e=>onChange&&onChange(e.target.value)}
        readOnly={readOnly}
        style={{ borderBottom:'1px solid #999', outline:'none', fontSize:10,
          fontFamily:'Arial', width:110, borderTop:'none', borderLeft:'none',
          borderRight:'none', background: readOnly?'#f5f5f5':'transparent',
          fontWeight: readOnly&&value ? 700 : 400 }}
      />
    </span>
  );
}

function IoNioNa({ value, onChange, name }) {
  return (
    <div className="radio-group">
      <label className="radio-label io">
        <input type="radio" name={name} value="I.O" checked={value==='I.O'} onChange={()=>onChange('I.O')} />
        I.O
      </label>
      <label className="radio-label nio">
        <input type="radio" name={name} value="N.I.O" checked={value==='N.I.O'} onChange={()=>onChange('N.I.O')} />
        N.I.O
      </label>
      <label className="radio-label na">
        <input type="radio" name={name} value="NA" checked={value==='NA'} onChange={()=>onChange('NA')} />
        NA
      </label>
    </div>
  );
}

function OkNok({ value, onChange, name }) {
  return (
    <div className="radio-group">
      <label className="radio-label io">
        <input type="radio" name={name} value="Ok" checked={value==='Ok'} onChange={()=>onChange('Ok')} />
        Ok
      </label>
      <label className="radio-label nio">
        <input type="radio" name={name} value="NOK" checked={value==='NOK'} onChange={()=>onChange('NOK')} />
        NOK
      </label>
    </div>
  );
}

function OuiNon({ value, onChange, name }) {
  return (
    <div className="radio-group">
      <label className="radio-label oui">
        <input type="radio" name={name} value="Oui" checked={value==='Oui'} onChange={()=>onChange('Oui')} />
        Oui
      </label>
      <label className="radio-label non">
        <input type="radio" name={name} value="Non" checked={value==='Non'} onChange={()=>onChange('Non')} />
        Non
      </label>
    </div>
  );
}

function Btn({ children, onClick, variant }) {
  const bg = variant==='del'?'#DC2626':variant==='add'?'#1a56a0':'#001F4E';
  return (
    <button onClick={onClick} style={{ padding:'3px 10px', background:bg, color:'#fff',
      border:'none', cursor:'pointer', fontSize:9, fontWeight:700, borderRadius:3, fontFamily:'Arial' }}>
      {children}
    </button>
  );
}

function updArr(arr, i, k, v) { const r=[...arr]; r[i]={...r[i],[k]:v}; return r; }

// ─── extractDefautsFromAnnexe ─────────────────────────────────────
export function extractDefautsFromAnnexe(typeAnnexe, formData) {
  if (!formData) return [];
  const defauts = [];

  const normalizeStatus = value => String(value ?? '').trim().toUpperCase().replace(/[\s._-]+/g, '');
  const isDefectStatus = value => {
    const normalized = normalizeStatus(value);
    return normalized === 'NC'
      || normalized === 'NIO'
      || normalized === 'NOK'
      || normalized === 'NON'
      || normalized === 'ECY'
      || normalized.startsWith('NONCONFORME');
  };
 
  if (typeAnnexe === '4') {
    (formData.rows || []).forEach((row, i) => {
      if (isDefectStatus(row?.res))
        defauts.push({ code:'400', description:`Étape ${i+1} non conforme`, type:'F', freq:1, pointsDefect:25 });
    });
  }
 
  if (typeAnnexe === '5') {
    const q = formData.questions || {};
    const map = {
      q11:{c:'500',d:'Instruction emballage NC'}, q12:{c:'500',d:'Emballage intérieur NC'},
      q13:{c:'1301',d:'Identification NC'}, q21:{c:'1700',d:'Dessin/étiquette NC'},
      q22:{c:'400',d:'Paramètres production NC'}, q23:{c:'400',d:'Planche montage NC'},
      q24:{c:'400',d:'Équipement NC'}, q25:{c:'400',d:'Carte enregistrement NC'},
      q26:{c:'400',d:'Ouvriers non qualifiés'}, q27:{c:'400',d:'Documents NC'},
      q28:{c:'400',d:'Surfaces/caisses NC'}, q29a:{c:'400',d:'Table contrôle NC'},
      q29b:{c:'400',d:'Table contrôle composants NC'}, q210:{c:'400',d:'Plan contrôle NC'},
      q211:{c:'400',d:'AMDEC NC'}, q212:{c:'400',d:'Plan surveillance NC'},
    };
    Object.entries(q).forEach(([k, v]) => {
      if (isDefectStatus(v) && map[k])
        defauts.push({ code:map[k].c, description:map[k].d, type:'F', freq:1, pointsDefect:25 });
    });
  }
 
  if (typeAnnexe === '6') {
    (formData.rows || []).forEach((r, i) => {
      if (isDefectStatus(r?.resultat))
        defauts.push({ code:'105', description:`Sertissage NC — fil ${r.nrFil||i+1}`, type:'F', freq:1, pointsDefect:50 });
    });
    (formData.ussRows || []).forEach((r, i) => {
      if (isDefectStatus(r?.resultat))
        defauts.push({ code:'106', description:`Force pelage USS NC — fil ${r.nrFil||i+1}`, type:'F', freq:1, pointsDefect:75 });
    });
  }
 
  if (typeAnnexe === '7') {
    (formData.rows || []).forEach((r, i) => {
      if (isDefectStatus(r?.resultat))
        defauts.push({ code:'1200', description:`Dimension NC — pos ${r.pos||i+1}`, type:'F', freq:1, pointsDefect:50 });
      if (isDefectStatus(r?.resultatBandage))
        defauts.push({ code:'800', description:`Bandage NC — pos ${r.pos||i+1}`, type:'F', freq:1, pointsDefect:25 });
      if (isDefectStatus(r?.resultatClip))
        defauts.push({ code:'700', description:`Clip NC — pos ${r.pos||i+1}`, type:'F', freq:1, pointsDefect:25 });
    });
  }
 
  if (typeAnnexe === '7A') {
    (formData.rows || []).forEach((r, i) => {
      if (isDefectStatus(r?.io))
        defauts.push({ code:'1201', description:`Mesure NC — ligne ${r.lfdNr||i+1}`, type:'F', freq:1, pointsDefect:50 });
    });
  }
 
  if (typeAnnexe === '8') {
    (formData.rows || []).forEach((r, i) => {
      if (isDefectStatus(r?.resultat))
        defauts.push({ code:'001', description:`Section fil NC — pos ${r.pos||i+1}`, type:'F', freq:1, pointsDefect:50 });
    });
    (formData.ussRows || []).forEach((r, i) => {
      if (isDefectStatus(r?.resultat))
        defauts.push({ code:'020', description:`Torsadage NC — pos ${r.pos||i+1}`, type:'F', freq:1, pointsDefect:50 });
    });
  }
 
  if (typeAnnexe === '10') {
    (formData.rows || []).forEach((r, i) => {
      if (isDefectStatus(r?.resultat))
        defauts.push({ code:'106', description:`Force traction NC — pos ${r.position||i+1}`, type:'F', freq:1, pointsDefect:75 });
    });
  }
 
  if (typeAnnexe === '11A') {
    (formData.rows || []).forEach((r, i) => {
      if (isDefectStatus(r?.resultat))
        defauts.push({ code:'106', description:`Pelage USS NC — ${r.adresseUSS||'addr '+(i+1)}`, type:'F', freq:1, pointsDefect:75 });
    });
  }
 
  if (typeAnnexe === '11B') {
    (formData.rows || []).forEach((r, i) => {
      if (isDefectStatus(r?.resultat))
        defauts.push({ code:'020', description:`Torsadage NC — ${r.adresse||'addr '+(i+1)}`, type:'F', freq:1, pointsDefect:50 });
    });
  }
 
  if (typeAnnexe === '11C') {
    (formData.rows || []).forEach((r, i) => {
      if (isDefectStatus(r?.resultat))
        defauts.push({ code:'020', description:`Torsadage C-BEV NC — pos ${r.position||i+1}`, type:'F', freq:1, pointsDefect:50 });
    });
  }
 
  if (['13A','13B','13C','13D'].includes(typeAnnexe)) {
    Object.entries(formData.attributChecks || {}).forEach(([k, v]) => {
      if (isDefectStatus(v))
        defauts.push({ code:'110', description:`Audit destructif ${typeAnnexe} — ${k} NOK`, type:'F', freq:1, pointsDefect:75 });
    });
    (formData.dimRows || []).forEach((r, i) => {
      if (isDefectStatus(r?.decision))
        defauts.push({ code:'1200', description:`Dimension NC — ${typeAnnexe} critère ${i+1}`, type:'F', freq:1, pointsDefect:50 });
    });
    if (isDefectStatus(formData.decisionGlobale))
      defauts.push({ code:'400', description:`Décision globale NOK — ${typeAnnexe}`, type:'F', freq:1, pointsDefect:100 });
  }
 
  if (typeAnnexe === 'PSA') {
    (formData.colonnes || []).forEach((col, i) => {
      if (isDefectStatus(col?.jugement) || isDefectStatus(col?.accordConformite))
        defauts.push({ code:'1200', description:`PSA NC — ${col.nom||'Cotation '+(i+1)}`, type:'F', freq:1, pointsDefect:50 });
    });
  }
 
  if (typeAnnexe === 'DPE') {
    (formData.rows || []).forEach((r, i) => {
      if (isDefectStatus(r?.jugement) || isDefectStatus(r?.accordConformite))
        defauts.push({ code:'1200', description:`DPE NC — ${r.identification||'Ligne '+(i+1)}`, type:'F', freq:1, pointsDefect:50 });
    });
  }
 
  return defauts;
}

// ═══════════════════════════════════════════════════════════════════
// ANNEXE 4
// ═══════════════════════════════════════════════════════════════════
const ETAPES_4 = [
  { g:'Spécifications dessin' },
  { el:'Spéc. dessin', e:"Prendre un dessin/plan de faisceau", d:'Dessin/plan de faisceau' },
  { el:'', e:"Vérification de tous les messages mentionnées dans le dessin", d:'Selon dessin' },
  { el:'', e:"Vérification des marquages", d:'Selon dessin' },
  { g:'Contrôle électrique' },
  { el:'Ctrl électrique', e:"Refaire le contrôle électrique", d:"Étiquette CE" },
  { g:'Document' },
  { el:'Document', e:"Prendre une copie du plan de contrôle", d:'Plan de contrôle' },
  { g:'Mesure' },
  { el:'Mesure', e:"Contrôle des dimensions selon dessin", d:'Annexe 7/7a' },
  { el:'', e:"Mesure des hauteurs de sertissage", d:'B2B/Leo Parts' },
  { el:'', e:"Mesure des hauteurs de sertissage des contacts/USS", d:'IT 3117/IT 3092' },
  { g:'Composants' },
  { el:'Composants', e:"Contrôler si les contacts sont bien encliquetés", d:'Visuellement' },
  { el:'', e:"Contrôler si les contacts sont justes et non déformés", d:'Classeur des contactes' },
  { el:'', e:"Contrôle de la soudure", d:'IC 3026' },
  { el:'', e:"Contrôler si les douilles/boitiers sont correctes", d:'Visuellement/Dessin' },
  { el:'', e:"Contrôle des couvercles des douilles", d:'Visuellement' },
  { el:'', e:"Contrôler les joints et bouchons", d:'Classeur des joints' },
  { el:'', e:"Contrôle des traces de l'amboss", d:'Microscope USB' },
  { el:'', e:"Contrôle du montage des tubes", d:'IC 3016' },
  { el:'', e:"Contrôle du serrage des agrafes", d:'IT 3 455-05' },
  { el:'', e:"Contrôle visuel du point de soudure", d:'IC 3026' },
  { g:'Image de coupe' },
  { el:'Image coupe', e:"Image de coupe pour client AVW", d:'VW 603 30' },
  { g:'Étanchéité' },
  { el:'Étanchéité', e:"Contrôle de l'étanchéité", d:'Annexe 1 IC TN3600' },
  { el:'', e:"Contrôle Schaum", d:'Annexe 1 IC TN3600' },
  { g:'Poids' },
  { el:'Poids', e:"Peser le faisceau", d:'Spécifications clients' },
  { g:'Étiquette' },
  { el:'Étiquette', e:"Vérifier le contenu de l'étiquette CE", d:'Spécifications clients' },
  { g:'Vissage' },
  { el:'Vissage', e:"Vérifier les paramètres de vissage", d:'Spécifications clients' },
];

export function FormAnnexe4({ data={}, onChange, auditInfo={}, annexeMeta={}, auditeurs=[] }) {
  const upd = (k,v) => onChange({ ...data, [k]:v });
  const rows = data.rows || Array(30).fill(null).map(()=>({}));
  const updRow = (i,v) => upd('rows', updArr(rows, i, 'res', v));

  // ✅ Pré-remplissage des dates UNE SEULE FOIS
  const initialDateRef = useRef(null);
  const today = new Date().toISOString().split('T')[0];
  const dateDessinValue = data.dateDessin || (initialDateRef.current || auditInfo.date || today);
  if (!data.dateDessin && !initialDateRef.current) {
    initialDateRef.current = dateDessinValue;
  }

  const statutCroisee = annexeMeta.statutValidationCroisee;
  const enAttente = statutCroisee === 'EN_ATTENTE';
  const todayFr = new Date().toLocaleDateString('fr-FR');

  useEffect(() => {
    if (auditInfo.auditorName && !data.validateur1) {
      upd('validateur1', `${auditInfo.auditorName} — ${todayFr}`);
    }
  }, [auditInfo.auditorName]);

  let ri = 0;
  return (
    <div className="lf">
      <style>{CSS}</style>
      <AnnexeHeaderLocal numero="Annexe 4" titre="Etapes de travail de l'audit produit" />
      <div style={{ fontSize:7, color:'#666', padding:'2px 4px', marginBottom:4 }}>IT TN 3625 — Annexe 4 Etat 09.2025</div>

      <div style={{ marginBottom:6, fontSize:10 }}>
        <InfoLine label="Série / TAB*" value={data.serie||auditInfo.tab||''} onChange={v=>upd('serie',v)} />
        <InfoLine label="Index" value={data.index||''} onChange={v=>upd('index',v)} />
        <InfoLine label="Date de dessin" value={dateDessinValue} onChange={v=>upd('dateDessin',v)} type="date" />
        {auditInfo.auditorName && (
          <InfoLine label="Auditeur" value={auditInfo.auditorName} readOnly={true} />
        )}
      </div>

      <div style={{ background:'#1a56a0', color:'#fff', padding:'8px', textAlign:'center', fontWeight:900, fontSize:13, marginBottom:8 }}>
        Tampon audit produit
      </div>

      <table>
        <thead>
          <tr>
            <th style={{ width:100 }}>Élément</th>
            <th>Étape de travail</th>
            <th style={{ width:180 }}>Base de contrôle / Documentation</th>
            <th style={{ width:70 }}>I.O</th>
            <th style={{ width:75 }}>N.I.O</th>
            <th style={{ width:55 }}>NA</th>
          </tr>
        </thead>
        <tbody>
          {ETAPES_4.map((e, idx) => {
            if (e.g) {
              return (<tr key={idx} className="subhdr"><td colSpan={6}>{e.g}</td></tr>);
            }
            const r = rows[ri] || {};
            const rn = `e4r_${ri}`;
            const nok = r.res==='N.I.O';
            const curRi = ri;
            ri++;
            return (
              <tr key={idx} className={nok?'nok':''}>
                <td style={{ fontSize:9, fontWeight:600, background:'#f7f9fc' }}>{e.el||''}</td>
                <td style={{ fontSize:10 }}>{e.e}</td>
                <td style={{ fontSize:9, color:'#666' }}>{e.d}</td>
                <td style={{ textAlign:'center' }}>
                  <input type="radio" name={rn} checked={r.res==='I.O'} onChange={()=>updRow(curRi,'I.O')} />
                </td>
                <td style={{ textAlign:'center' }}>
                  <input type="radio" name={rn} checked={r.res==='N.I.O'} onChange={()=>updRow(curRi,'N.I.O')} />
                </td>
                <td style={{ textAlign:'center' }}>
                  <input type="radio" name={rn} checked={r.res==='NA'} onChange={()=>updRow(curRi,'NA')} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginTop:12 }}>
        <div>
          <label style={{ fontSize:9, fontWeight:700, color:'#666' }}>Validation Sampling Auditor 1 :</label><br/>
          <input type="text" value={data.validateur1||''} readOnly
            style={{ width:'100%', padding:'5px 8px', border:'1px solid #ccc', marginTop:3, fontSize:11,
              fontFamily:'Arial', outline:'none', background:'#f5f5f5', fontWeight:700, color:'#001F4E' }} />
        </div>
        <div>
          <label style={{ fontSize:9, fontWeight:700, color:'#666' }}>Validation Sampling Auditor 2 :</label><br/>
          {enAttente ? (
            <div style={{ padding:'6px 8px', border:'1px solid #F0C36D', background:'#FFF8E8', borderRadius:4, fontSize:11, color:'#92620A', fontWeight:700 }}>
              En attente de signature de {annexeMeta.auditeurValidateurNom || "l'auditeur désigné"}
            </div>
          ) : statutCroisee === 'VALIDEE' ? (
            <div style={{ padding:'6px 8px', border:'1px solid #A7E3C3', background:'#EEFBF4', borderRadius:4, fontSize:11, color:'#0F7A48', fontWeight:700 }}>
              Signé par {annexeMeta.auditeurValidateurNom} — {annexeMeta.dateValidationCroisee ? new Date(annexeMeta.dateValidationCroisee).toLocaleDateString('fr-FR') : ''}
            </div>
          ) : (
            <>
              <div style={{ display:'flex', gap:6 }}>
                <select value={data.validateur2Id||''}
                  onChange={e => {
                    const id = e.target.value;
                    const a = auditeurs.find(x => String(x.id) === String(id));
                    onChange({ ...data, validateur2Id: id, validateur2: a ? `${a.prenom} ${a.nom}` : '' });
                  }}
                  style={{ flex:1, padding:'5px 8px', border:'1px solid #ccc', marginTop:3, fontSize:11, fontFamily:'Arial', outline:'none' }}>
                  <option value="">— Choisir un auditeur —</option>
                  {auditeurs.map(a => (
                    <option key={a.id} value={a.id}>{a.prenom} {a.nom} ({a.matricule})</option>
                  ))}
                </select>
              </div>
              {statutCroisee === 'REJETEE' && annexeMeta.commentaireValidationCroisee && (
                <div style={{ fontSize:10, color:'#DC2626', fontWeight:600, marginTop:4 }}>
                  Rejetée — {annexeMeta.commentaireValidationCroisee}
                </div>
              )}
              <div style={{ fontSize:10, color:'#5C6F8A', marginTop:6, fontStyle:'italic' }}>
                Choisissez l'auditeur puis cliquez sur « Valider l'annexe » ci-dessous.
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// ANNEXE 5
// ═══════════════════════════════════════════════════════════════════
const QUESTIONS_5 = [
  { s:'1. Audit de processus – Emballage et Identification' },
  { id:'q11', l:"1.1. Instruction d'emballage existe et respectée?" },
  { id:'q12', l:"1.2. Emballage intérieur selon l'instruction interne." },
  { id:'q13', l:"1.3. Est-ce que les instructions internes d'identification sont respectées?" },
  { s:'2.0. Audit de processus - Process assemblage' },
  { id:'q21', l:"2.1. Dessin lisible et étiquette en ordre?" },
  { id:'q22', l:"2.2. Paramètres de production fixés et respectés?" },
  { id:'q23', l:"2.3. Planche de montage homologuée?" },
  { id:'q24', l:"2.4. Équipement / machines en ordre?" },
  { id:'q25', l:"2.5. Carte d'enregistrement en ordre?" },
  { id:'q26', l:"2.6. Ouvriers qualifiés?" },
  { id:'q27', l:"2.7. Documents de production en ordre?" },
  { id:'q28', l:"2.8. Surfaces et caisses identifiées?" },
  { id:'q29a', l:"2.9. Table de contrôle : entretien documenté?" },
  { id:'q29b', l:"2.9. Table de contrôle : tous les composants sont demandés?" },
  { id:'q210', l:"2.10. Plan de contrôle actuel?" },
  { id:'q211', l:"2.11. AMDEC processus montage existante?" },
  { id:'q212', l:"2.12. Plan de surveillance du processus montage existant?", hasText:true },
];

export function FormAnnexe5({ data={}, onChange, auditInfo={} }) {
  const upd = (k,v) => onChange({ ...data, [k]:v });
  const updQ = (k,v) => upd('questions', { ...(data.questions||{}), [k]:v });
  const q = data.questions||{};

  // ✅ Pré-remplissage des dates UNE SEULE FOIS
  const initialDateRef = useRef(null);
  const today = new Date().toISOString().split('T')[0];
  const indexDateValue = data.indexDate || (initialDateRef.current || auditInfo.date || today);
  if (!data.indexDate && !initialDateRef.current) {
    initialDateRef.current = indexDateValue;
  }

  return (
    <div className="lf">
      <style>{CSS}</style>
      <AnnexeHeaderLocal numero="Annexe 5" titre="Audit court du Processus Assemblage" />
      <div style={{ fontSize:7, color:'#666', padding:'2px 4px', marginBottom:4 }}>IT TN 3625 — Annexe 5 Etat 11.2023</div>

      <div style={{ marginBottom:6, fontSize:10 }}>
        <InfoLine label="Série / TAB (VW)" value={data.serie||auditInfo.tab||''} onChange={v=>upd('serie',v)} />
        <InfoLine label="Index / Date dessin" value={indexDateValue} onChange={v=>upd('indexDate',v)} type="date" />
        {auditInfo.auditorName && (
          <InfoLine label="Auditeur" value={auditInfo.auditorName} readOnly={true} />
        )}
      </div>

      <table>
        <thead>
          <tr>
            <th>Question</th>
            <th style={{ width:60 }}>Oui</th>
            <th style={{ width:60 }}>Non</th>
          </tr>
        </thead>
        <tbody>
          {QUESTIONS_5.map((item, i) => {
            if (item.s) return (
              <tr key={i} className="subhdr"><td colSpan={3}>{item.s}</td></tr>
            );
            const isNon = q[item.id]==='Non';
            const isOui = q[item.id]==='Oui';
            return (
              <tr key={i} className={isNon?'nok':''}>
                <td style={{ fontSize:10 }}>
                  {item.l}
                  {item.hasText && (
                    <div style={{ marginTop:4 }}>
                      <input type="text"
                        value={q[item.id+'_texte']||''}
                        onChange={e=>updQ(item.id+'_texte', e.target.value)}
                        placeholder="Préciser le plan de surveillance..."
                        style={{ width:'100%', border:'none', borderBottom:'1px dashed #999',
                          outline:'none', fontSize:9, fontFamily:'Arial', background:'transparent',
                          padding:'2px 0', color:'#374151' }}
                      />
                    </div>
                  )}
                </td>
                <td style={{ textAlign:'center' }}>
                  <input type="radio" name={`q5_${item.id}`} value="Oui"
                    checked={isOui} onChange={()=>updQ(item.id,'Oui')}
                    style={{ width:'auto', cursor:'pointer', accentColor:'#059669' }} />
                </td>
                <td style={{ textAlign:'center' }}>
                  <input type="radio" name={`q5_${item.id}`} value="Non"
                    checked={isNon} onChange={()=>updQ(item.id,'Non')}
                    style={{ width:'auto', cursor:'pointer', accentColor:'#DC2626' }} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <div style={{ background:'#fffbeb', border:'1px solid #F59E0B', padding:'6px 8px', fontSize:10, margin:'8px 0' }}>
        <b>Dans le cas de NON,</b> les déviations doivent être documentées et traitées dans le PDCA.
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginTop:8 }}>
        {['validateur1','validateur2'].map((k,i) => (
          <div key={k}>
            <label style={{ fontSize:9, fontWeight:700, color:'#666' }}>Validation « Sampling Auditor » {i+1} :</label><br/>
            <input type="text" value={data[k]||''} onChange={e=>upd(k,e.target.value)}
              placeholder="Nom et prénom / Date"
              style={{ width:'100%', padding:'5px 8px', border:'1px solid #ccc', marginTop:3, fontSize:11, fontFamily:'Arial', outline:'none' }} />
          </div>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// ANNEXE 6
// ═══════════════════════════════════════════════════════════════════
export function FormAnnexe6({ data={}, onChange, auditInfo={} }) {
  const upd = (k,v) => onChange({ ...data, [k]:v });
  const MIN_ROWS = 15;
  const rows = data.rows || Array(MIN_ROWS).fill(null).map(()=>({
    nrFil:'', section:'', couleur:'', pin:'', type:'', contact:'',
    ch:'', chm:'', cw:'', cwm:'', pf:'', pfm:'', resultat:''
  }));
  const ussRows = data.ussRows || Array(4).fill(null).map(()=>({
    nrFil:'', section:'', couleur:'', type:'', forcePelage:'', forceMesuree:'', resultat:''
  }));

  // ✅ Pré-remplissage des dates UNE SEULE FOIS
  const initialDateRef = useRef(null);
  const today = new Date().toISOString().split('T')[0];
  const dateValue = data.date || (initialDateRef.current || auditInfo.date || today);
  if (!data.date && !initialDateRef.current) {
    initialDateRef.current = dateValue;
  }

  const updRow = (arr, i, k, v) => {
    const a=[...(data[arr]||[])]; a[i]={...a[i],[k]:v};
    if (arr==='rows' && (k==='ch'||k==='chm')) {
      const ch=parseFloat(a[i].ch||0), chm=parseFloat(a[i].chm||0);
      if (chm>0) a[i].resultat=(chm>=ch*0.9&&chm<=ch*1.1)?'Ok':'NOK';
    }
    onChange({ ...data, [arr]:a });
  };

  return (
    <div className="lf">
      <style>{CSS}</style>
      <AnnexeHeaderLocal numero="Annexe 6" titre="Rapport de l'Audit produit BMW / MN / OEM Supplier MB" />
      <div style={{ fontSize:7, color:'#666', padding:'2px 4px', marginBottom:4 }}>IT TN 3625 — Annexe 6 Etat 09/2025</div>

      <div style={{ marginBottom:6, fontSize:10 }}>
        <InfoLine label="N° dessin" value={data.numDessin||''} onChange={v=>upd('numDessin',v)} />
        <InfoLine label="Famille" value={data.famille||''} onChange={v=>upd('famille',v)} />
        <InfoLine label="N° BMW/MN/OEM" value={data.numBMW||''} onChange={v=>upd('numBMW',v)} />
        <InfoLine label="Adresse" value={data.adresse||''} onChange={v=>upd('adresse',v)} />
        <InfoLine label="Date" value={dateValue} onChange={v=>upd('date',v)} type="date" />
        {auditInfo.auditorName && (
          <InfoLine label="Auditeur" value={auditInfo.auditorName} readOnly={true} />
        )}
      </div>

      <div className="sec">Mesures des fils (Sertissage)</div>
      <div style={{ overflowX:'auto' }}>
        <table style={{ minWidth:900 }}>
          <thead>
            <tr>
              {['Nr fil','Section','Couleur','Pin','Type','Contact','CH','CHm','CW','CWm','PF','PFm','Résultat'].map(h=><th key={h}>{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} className={row.resultat==='NOK'?'nok':''}>
                {['nrFil','section','couleur','pin','type','contact','ch','chm','cw','cwm','pf','pfm'].map(k=>(
                  <td key={k}><Inp value={row[k]} onChange={v=>updRow('rows',i,k,v)} /></td>
                ))}
                <td><OkNok value={row.resultat} onChange={v=>updRow('rows',i,'resultat',v)} name={`r6_${i}`} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="sec" style={{ marginTop:10 }}>Adresse du USS — Force de pelage</div>
      <table>
        <thead>
          <tr>
            {['Nr fil','Section','Couleur','Type','Force pelage (spec.)','Force pelage mesurée','Résultat'].map(h=><th key={h}>{h}</th>)}
          </tr>
        </thead>
        <tbody>
          {ussRows.map((row, i) => (
            <tr key={i} className={row.resultat==='NOK'?'nok':''}>
              {['nrFil','section','couleur','type','forcePelage','forceMesuree'].map(k=>(
                <td key={k}><Inp value={row[k]} onChange={v=>updRow('ussRows',i,k,v)} /></td>
              ))}
              <td><OkNok value={row.resultat} onChange={v=>updRow('ussRows',i,'resultat',v)} name={`uss6_${i}`} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// ANNEXE 7
// ═══════════════════════════════════════════════════════════════════
export function FormAnnexe7({ data={}, onChange, auditInfo={} }) {
  const upd = (k,v) => onChange({ ...data, [k]:v });
  const MIN_ROWS = 33;
  const rows = data.rows || Array(MIN_ROWS).fill(null).map((_,i)=>({
    pos:i+1, adresseBranche:'', mesure:'', toleranceNeg:'', tolerancePos:'',
    valeurMesuree:'', resultat:'', typeBandage:'', resultatBandage:'',
    clipTie:'', resultatClip:'', exigenceClient:''
  }));

  // ✅ Pré-remplissage des dates UNE SEULE FOIS
  const initialDateRef = useRef(null);
  const today = new Date().toISOString().split('T')[0];
  const dateValue = data.date || (initialDateRef.current || auditInfo.date || today);
  if (!data.date && !initialDateRef.current) {
    initialDateRef.current = dateValue;
  }

  const updRow = (i,k,v) => {
    const a=[...rows]; a[i]={...a[i],[k]:v};
    if (k==='valeurMesuree') {
      const val=parseFloat(v), ref=parseFloat(a[i].mesure||0);
      const tolP=parseFloat(a[i].tolerancePos||0), tolN=parseFloat(a[i].toleranceNeg||0);
      if (!isNaN(val)&&ref) a[i].resultat=(val>=ref-Math.abs(tolN)&&val<=ref+tolP)?'Ok':'NOK';
    }
    upd('rows',a);
  };

  return (
    <div className="lf">
      <style>{CSS}</style>
      <AnnexeHeaderLocal numero="Annexe 7" titre="Rapport de l'Audit produit BMW / AVW / MB" />
      <div style={{ fontSize:7, color:'#666', padding:'2px 4px', marginBottom:4 }}>IT TN 3625 — Annexe 7 Etat 09.2022</div>

      <div style={{ marginBottom:6, fontSize:10 }}>
        <InfoLine label="N° dessin câblage" value={data.numDessin||''} onChange={v=>upd('numDessin',v)} />
        <InfoLine label="Famille / TAB" value={data.famille||auditInfo.tab||''} onChange={v=>upd('famille',v)} />
        <InfoLine label="N° BMW/Série" value={data.numBMW||auditInfo.serie||''} onChange={v=>upd('numBMW',v)} />
        <InfoLine label="Date" value={dateValue} onChange={v=>upd('date',v)} type="date" />
        <InfoLine label="Auditeur" value={data.auditeur||auditInfo.auditorName||''} onChange={v=>upd('auditeur',v)} />
        <InfoLine label="Index" value={data.index||''} onChange={v=>upd('index',v)} />
      </div>

      <div style={{ overflowX:'auto' }}>
        <table style={{ minWidth:1000 }}>
          <thead>
            <tr>
              <th style={{ width:35 }}>Pos.</th>
              <th>Adresse Branche</th>
              <th style={{ width:70 }}>Mesure (mm)</th>
              <th style={{ width:55 }}>Tol. -</th>
              <th style={{ width:55 }}>Tol. +</th>
              <th style={{ width:80 }}>Valeur mesurée</th>
              <th style={{ width:65 }}>Résultat</th>
              <th style={{ width:90 }}>Type bandage</th>
              <th style={{ width:65 }}>Résultat</th>
              <th style={{ width:90 }}>Clip tie</th>
              <th style={{ width:65 }}>Résultat</th>
              <th>Exigence client</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} className={row.resultat==='NOK'?'nok':''}>
                <td style={{ textAlign:'center', fontWeight:700, background:'#EEF2F8' }}>{row.pos}</td>
                <td><Inp value={row.adresseBranche} onChange={v=>updRow(i,'adresseBranche',v)} /></td>
                <td><Inp value={row.mesure} onChange={v=>updRow(i,'mesure',v)} type="number" /></td>
                <td><Inp value={row.toleranceNeg} onChange={v=>updRow(i,'toleranceNeg',v)} /></td>
                <td><Inp value={row.tolerancePos} onChange={v=>updRow(i,'tolerancePos',v)} /></td>
                <td><Inp value={row.valeurMesuree} onChange={v=>updRow(i,'valeurMesuree',v)} type="number" /></td>
                <td><OkNok value={row.resultat} onChange={v=>updRow(i,'resultat',v)} name={`r7_${i}`} /></td>
                <td><Inp value={row.typeBandage} onChange={v=>updRow(i,'typeBandage',v)} /></td>
                <td><OkNok value={row.resultatBandage} onChange={v=>updRow(i,'resultatBandage',v)} name={`rb7_${i}`} /></td>
                <td><Inp value={row.clipTie} onChange={v=>updRow(i,'clipTie',v)} /></td>
                <td><OkNok value={row.resultatClip} onChange={v=>updRow(i,'resultatClip',v)} name={`rc7_${i}`} /></td>
                <td><Inp value={row.exigenceClient} onChange={v=>updRow(i,'exigenceClient',v)} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// ANNEXE 7A
// ═══════════════════════════════════════════════════════════════════
export function FormAnnexe7A({ data={}, onChange, auditInfo={} }) {
  const upd = (k,v) => onChange({ ...data, [k]:v });
  const rows = data.rows || Array(18).fill(null).map((_,i)=>({
    lfdNr:i+1, vonMBP:'', vonVOBIS:'', xy:'', nachMBP:'', nachVOBIS:'', xy2:'',
    fzgDerivate:'', mesures:Array(19).fill(''), lSoll:'', lIst:'', io:'',
    diff:'', abweichungen:'', tolerances:'', bemerkungen:'', utg:'', otg:'', ug:'', og:''
  }));

  // ✅ Pré-remplissage des dates UNE SEULE FOIS
  const initialDateRef = useRef(null);
  const today = new Date().toISOString().split('T')[0];
  const datumValue = data.datum || (initialDateRef.current || auditInfo.date || today);
  if (!data.datum && !initialDateRef.current) {
    initialDateRef.current = datumValue;
  }

  const updRow = (i,k,v) => { const a=[...rows]; a[i]={...a[i],[k]:v}; upd('rows',a); };

  return (
    <div className="lf">
      <style>{CSS}</style>
      <AnnexeHeaderLocal numero="Annexe 7(a)" titre="Rapport de mesure d'Audit de Produit (Audi C-BEV)" />
      <div style={{ fontSize:7, color:'#666', padding:'2px 4px', marginBottom:4 }}>IT TN 3625 — Annexe 7a Etat 01.2020</div>

      <div style={{ marginBottom:6, fontSize:10 }}>
        <InfoLine label="Datum" value={datumValue} onChange={v=>upd('datum',v)} type="date" />
        <InfoLine label="Projekt" value={data.projekt||auditInfo.serie||''} onChange={v=>upd('projekt',v)} />
        <InfoLine label="KSK Nr." value={data.kskNr||''} onChange={v=>upd('kskNr',v)} />
        <InfoLine label="TAB Nr." value={data.tabNr||auditInfo.tab||''} onChange={v=>upd('tabNr',v)} />
        <InfoLine label="Auditor(en)" value={data.auditoren||auditInfo.auditorName||''} onChange={v=>upd('auditoren',v)} />
      </div>

      <div style={{ overflowX:'auto' }}>
        <table style={{ minWidth:1200 }}>
          <thead>
            <tr>
              <th>Nr.</th><th>von MBP</th><th>VOBIS</th><th>XY</th>
              <th>nach MBP</th><th>VOBIS</th><th>XY</th><th>Fzg. Derivate</th>
              {Array(19).fill(0).map((_,j)=><th key={j} style={{ width:28 }}>{j+1}</th>)}
              <th>L Soll</th><th>L Ist</th><th>IO</th><th>Diff</th>
              <th>Abw.</th><th>Toler.</th><th>Bem.</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} className={row.io==='niO'?'nok':''}>
                <td style={{ textAlign:'center', fontWeight:700, background:'#EEF2F8' }}>{row.lfdNr}</td>
                {['vonMBP','vonVOBIS','xy','nachMBP','nachVOBIS','xy2','fzgDerivate'].map(k=>(
                  <td key={k}><Inp value={row[k]} onChange={v=>updRow(i,k,v)} /></td>
                ))}
                {Array(19).fill(0).map((_,j)=>(
                  <td key={j}>
                    <input type="text" value={row.mesures?.[j]||''} onChange={e=>{
                      const m=[...(row.mesures||Array(19).fill(''))]; m[j]=e.target.value; updRow(i,'mesures',m);
                    }} style={{ width:26, border:'none', outline:'none', fontSize:9, fontFamily:'Arial', background:'transparent', textAlign:'center' }} />
                  </td>
                ))}
                {['lSoll','lIst'].map(k=>(<td key={k}><Inp value={row[k]} onChange={v=>updRow(i,k,v)} type="number" /></td>))}
                <td>
                  <select value={row.io||''} onChange={e=>updRow(i,'io',e.target.value)}
                    style={{ border:'none', outline:'none', fontSize:9, fontFamily:'Arial', background:'transparent', width:'auto' }}>
                    <option value="">—</option><option value="iO">iO</option><option value="niO">niO</option>
                  </select>
                </td>
                {['diff','abweichungen','tolerances','bemerkungen'].map(k=>(
                  <td key={k}><Inp value={row[k]} onChange={v=>updRow(i,k,v)} /></td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// ANNEXE 8
// ═══════════════════════════════════════════════════════════════════
export function FormAnnexe8({ data={}, onChange, auditInfo={} }) {
  const upd = (k,v) => onChange({ ...data, [k]:v });
  const rows = data.rows || Array(28).fill(null).map((_,i)=>({
    pos:i+1, nrFil:'', couleur:'', section:'', type:'', nbrFibres:'',
    sectionFibre:'', formule:'0.00000', sectionAvecIsolation:'', resultat:''
  }));
  const ussRows = data.ussRows || Array(7).fill(null).map((_,i)=>({
    pos:i+1, nrFil:'', couleur:'', section:'', nbrFils:'',
    pasTorsadage:'', tolerance:'', pasTorsadageMesure:'', mesureC1:'', mesureC2:'', resultat:''
  }));

  // ✅ Pré-remplissage des dates UNE SEULE FOIS
  const initialDateRef = useRef(null);
  const today = new Date().toISOString().split('T')[0];
  const dateValue = data.date || (initialDateRef.current || auditInfo.date || today);
  if (!data.date && !initialDateRef.current) {
    initialDateRef.current = dateValue;
  }

  const updRow = (arr,i,k,v) => { const a=[...(data[arr]||[])]; a[i]={...a[i],[k]:v}; onChange({ ...data, [arr]:a }); };

  return (
    <div className="lf">
      <style>{CSS}</style>
      <AnnexeHeaderLocal numero="Annexe 8" titre="Rapport de l'Audit produit BMW" />
      <div style={{ fontSize:7, color:'#666', padding:'2px 4px', marginBottom:4 }}>IT TN 3625 — Annexe 8 Etat 07.2017</div>

      <div style={{ marginBottom:6, fontSize:10 }}>
        <InfoLine label="N° dessin" value={data.numDessin||''} onChange={v=>upd('numDessin',v)} />
        <InfoLine label="Famille" value={data.famille||''} onChange={v=>upd('famille',v)} />
        <InfoLine label="N° BMW" value={data.numBMW||auditInfo.serie||''} onChange={v=>upd('numBMW',v)} />
        <InfoLine label="Index" value={data.index||''} onChange={v=>upd('index',v)} />
        <InfoLine label="Date" value={dateValue} onChange={v=>upd('date',v)} type="date" />
        {auditInfo.auditorName && (<InfoLine label="Auditeur" value={auditInfo.auditorName} readOnly={true} />)}
      </div>

      <div className="sec">Mesure section des fils</div>
      <div style={{ overflowX:'auto' }}>
        <table>
          <thead>
            <tr>
              {['Pos','Nr fil','Couleur','Section','Type','Nb Fibres','Section fibre','Formule','Section isolation','Résultat'].map(h=><th key={h}>{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} className={row.resultat==='NOK'?'nok':''}>
                <td style={{ textAlign:'center', fontWeight:700, background:'#EEF2F8' }}>{row.pos}</td>
                {['nrFil','couleur','section','type','nbrFibres','sectionFibre','formule','sectionAvecIsolation'].map(k=>(
                  <td key={k}><Inp value={row[k]} onChange={v=>updRow('rows',i,k,v)} /></td>
                ))}
                <td><OkNok value={row.resultat} onChange={v=>updRow('rows',i,'resultat',v)} name={`r8_${i}`} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="sec" style={{ marginTop:10 }}>Fils Torsadés</div>
      <table>
        <thead>
          <tr>
            {['Pos','Nr fil','Couleur','Section','Nb fils','Pas (spec.)','Tolérance','Pas mesuré','Mesure C1','Mesure C2','Résultat'].map(h=><th key={h}>{h}</th>)}
          </tr>
        </thead>
        <tbody>
          {ussRows.map((row, i) => (
            <tr key={i} className={row.resultat==='NOK'?'nok':''}>
              <td style={{ textAlign:'center', fontWeight:700, background:'#EEF2F8' }}>{row.pos}</td>
              {['nrFil','couleur','section','nbrFils','pasTorsadage','tolerance','pasTorsadageMesure','mesureC1','mesureC2'].map(k=>(
                <td key={k}><Inp value={row[k]} onChange={v=>updRow('ussRows',i,k,v)} /></td>
              ))}
              <td><OkNok value={row.resultat} onChange={v=>updRow('ussRows',i,'resultat',v)} name={`t8_${i}`} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// ANNEXE 10
// ═══════════════════════════════════════════════════════════════════
export function FormAnnexe10({ data={}, onChange, auditInfo={} }) {
  const upd = (k,v) => onChange({ ...data, [k]:v });
  const rows = data.rows || Array(20).fill(null).map((_,i)=>({
    position:i+1, pin:'', nrFil:'', couleur:'', section:'', type:'',
    nbrFibres:'', sectionFibre:'', sectionAvecIso:'', contact:'', ch:'',
    cbm:'', joint:'', chISO:'', cbISO:'', fournisseur:'', forceTraction:'', forceMesuree:'', resultat:''
  }));

  // ✅ Pré-remplissage des dates UNE SEULE FOIS
  const initialDateRef = useRef(null);
  const today = new Date().toISOString().split('T')[0];
  const dateDessinValue = data.dateDessin || (initialDateRef.current || auditInfo.date || today);
  if (!data.dateDessin && !initialDateRef.current) {
    initialDateRef.current = dateDessinValue;
  }

  const updRow = (i,k,v) => {
    const a=[...rows]; a[i]={...a[i],[k]:v};
    if (k==='forceMesuree') {
      const ft=parseFloat(a[i].forceTraction||0), fm=parseFloat(v||0);
      if (ft>0&&fm>0) a[i].resultat=fm>=ft?'Ok':'NOK';
    }
    upd('rows',a);
  };
  const COLS=['pin','nrFil','couleur','section','type','nbrFibres','sectionFibre','sectionAvecIso','contact','ch','cbm','joint','chISO','cbISO','fournisseur','forceTraction','forceMesuree'];

  return (
    <div className="lf">
      <style>{CSS}</style>
      <AnnexeHeaderLocal numero="Annexe 10" titre="Rapport d'Audit Produit (Spécifique Audi / VW)" />
      <div style={{ fontSize:7, color:'#666', padding:'2px 4px', marginBottom:4 }}>IT TN 3625 — Annexe 10 Etat 06.2022</div>

      <div style={{ marginBottom:6, fontSize:10 }}>
        <InfoLine label="TAB" value={data.tab||auditInfo.tab||''} onChange={v=>upd('tab',v)} />
        <InfoLine label="Var" value={data.var||''} onChange={v=>upd('var',v)} />
        <InfoLine label="Date de dessin" value={dateDessinValue} onChange={v=>upd('dateDessin',v)} type="date" />
        <InfoLine label="Index" value={data.index||''} onChange={v=>upd('index',v)} />
        {auditInfo.auditorName && (<InfoLine label="Auditeur" value={auditInfo.auditorName} readOnly={true} />)}
      </div>

      <div style={{ overflowX:'auto' }}>
        <table style={{ minWidth:1100 }}>
          <thead>
            <tr>
              <th>Position</th><th>Pin</th><th>Nr fil</th><th>Couleur</th>
              <th>Section</th><th>Type</th><th>Nb fibres</th><th>Section fibre</th>
              <th>Section ISO</th><th>Contact</th><th>CH</th><th>CBm</th>
              <th>Joint</th><th>CH ISO</th><th>CB ISO</th><th>Fournisseur</th>
              <th>Force exigée</th><th>Force mesurée</th><th>Résultat</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} className={row.resultat==='NOK'?'nok':''}>
                <td style={{ textAlign:'center', fontWeight:700, background:'#EEF2F8' }}>{row.position}</td>
                {COLS.map(k=><td key={k}><Inp value={row[k]} onChange={v=>updRow(i,k,v)} /></td>)}
                <td><OkNok value={row.resultat} onChange={v=>updRow(i,'resultat',v)} name={`r10_${i}`} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// ANNEXES 11A / 11B / 11C
// ═══════════════════════════════════════════════════════════════════
export function FormAnnexe11A({ data={}, onChange, auditInfo={} }) {
  const upd = (k,v) => onChange({ ...data, [k]:v });
  const rows = data.rows || Array(20).fill(null).map(()=>({
    adresseUSS:'', nrFil:'', section:'', couleur:'', type:'',
    forcePelageMin:'', forcePelageMesuree:'', resultat:''
  }));

  // ✅ Pré-remplissage des dates UNE SEULE FOIS
  const initialDateRef = useRef(null);
  const today = new Date().toISOString().split('T')[0];
  const dateValue = data.date || (initialDateRef.current || auditInfo.date || today);
  if (!data.date && !initialDateRef.current) {
    initialDateRef.current = dateValue;
  }

  const updRow = (i,k,v) => {
    const a=[...rows]; a[i]={...a[i],[k]:v};
    if (k==='forcePelageMesuree') {
      const min=parseFloat(a[i].forcePelageMin||0), mes=parseFloat(v||0);
      if (min>0&&mes>0) a[i].resultat=mes>=min?'Ok':'NOK';
    }
    upd('rows',a);
  };
  return (
    <div className="lf">
      <style>{CSS}</style>
      <AnnexeHeaderLocal numero="Annexe 11(a)" titre="Rapport d'Audit Produit USS (spécifique Audi / VW)" />
      <div style={{ fontSize:7, color:'#666', padding:'2px 4px', marginBottom:4 }}>IT TN 3625 — Annexe 11a Etat 09/2025</div>
      <div style={{ marginBottom:6, fontSize:10 }}>
        <InfoLine label="TAB" value={data.tab||auditInfo.tab||''} onChange={v=>upd('tab',v)} />
        <InfoLine label="Var" value={data.var||''} onChange={v=>upd('var',v)} />
        <InfoLine label="Index" value={data.index||''} onChange={v=>upd('index',v)} />
        <InfoLine label="Date" value={dateValue} onChange={v=>upd('date',v)} type="date" />
        {auditInfo.auditorName && (<InfoLine label="Auditeur" value={auditInfo.auditorName} readOnly={true} />)}
      </div>
      <table>
        <thead>
          <tr>
            {['Adresse USS','Nr Fil','Section','Couleur','Type','Force min.','Force mesurée','Résultat'].map(h=><th key={h}>{h}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className={row.resultat==='NOK'?'nok':''}>
              {['adresseUSS','nrFil','section','couleur','type','forcePelageMin','forcePelageMesuree'].map(k=>(
                <td key={k}><Inp value={row[k]} onChange={v=>updRow(i,k,v)} /></td>
              ))}
              <td><OkNok value={row.resultat} onChange={v=>updRow(i,'resultat',v)} name={`r11a_${i}`} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function FormAnnexe11B({ data={}, onChange, auditInfo={} }) {
  const upd = (k,v) => onChange({ ...data, [k]:v });
  const rows = data.rows || Array(18).fill(null).map(()=>({
    adresse:'', nrFil:'', section:'', couleur:'', nbrFils:'',
    pasTorsadage:'', pasMesure:'', tolerance:'', mesureC1:'', mesureC2:'', resultat:''
  }));

  // ✅ Pré-remplissage des dates UNE SEULE FOIS
  const initialDateRef = useRef(null);
  const today = new Date().toISOString().split('T')[0];
  const dateValue = data.date || (initialDateRef.current || auditInfo.date || today);
  if (!data.date && !initialDateRef.current) {
    initialDateRef.current = dateValue;
  }

  const updRow = (i,k,v) => {
    const a=[...rows]; a[i]={...a[i],[k]:v};
    if (k==='mesureC1'||k==='mesureC2') {
      const pas=parseFloat(a[i].pasTorsadage||0), tol=parseFloat(a[i].tolerance||0);
      const mes=(parseFloat(a[i].mesureC1||0)+parseFloat(a[i].mesureC2||0))/2;
      if (pas>0&&mes>0) a[i].resultat=(mes>=pas-tol&&mes<=pas+tol)?'Ok':'NOK';
    }
    upd('rows',a);
  };
  return (
    <div className="lf">
      <style>{CSS}</style>
      <AnnexeHeaderLocal numero="Annexe 11(b)" titre="Rapport d'Audit de Produit torsadage (Audi / VW / MN)" />
      <div style={{ fontSize:7, color:'#666', padding:'2px 4px', marginBottom:4 }}>IT TN 3625 — Annexe 11b Etat 09/2025</div>
      <div style={{ marginBottom:6, fontSize:10 }}>
        <InfoLine label="TAB" value={data.tab||auditInfo.tab||''} onChange={v=>upd('tab',v)} />
        <InfoLine label="Var" value={data.var||''} onChange={v=>upd('var',v)} />
        <InfoLine label="Index" value={data.index||''} onChange={v=>upd('index',v)} />
        <InfoLine label="Date" value={dateValue} onChange={v=>upd('date',v)} type="date" />
      </div>
      <table>
        <thead>
          <tr>
            {['Adresse','Nr Fil','Section','Couleur','Nb fils','Pas exigé','Pas mesuré','Tolérance','Mesure C1','Mesure C2','Résultat'].map(h=><th key={h}>{h}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className={row.resultat==='NOK'?'nok':''}>
              {['adresse','nrFil','section','couleur','nbrFils','pasTorsadage','pasMesure','tolerance','mesureC1','mesureC2'].map(k=>(
                <td key={k}><Inp value={row[k]} onChange={v=>updRow(i,k,v)} /></td>
              ))}
              <td><OkNok value={row.resultat} onChange={v=>updRow(i,'resultat',v)} name={`r11b_${i}`} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function FormAnnexe11C({ data={}, onChange, auditInfo={} }) {
  const upd = (k,v) => onChange({ ...data, [k]:v });
  const rows = data.rows || Array(20).fill(null).map((_,i)=>({
    position:i+1, nrFil:'', couleur:'', section:'', nbreFils:'',
    pasTorsadageExige:'', pasTorsadageMesure:'', mesureC1:'', mesureC2:'',
    boutTorsadageC1:'', boutTorsadageC2:'', resultat:''
  }));

  // ✅ Pré-remplissage des dates UNE SEULE FOIS
  const initialDateRef = useRef(null);
  const today = new Date().toISOString().split('T')[0];
  const dateValue = data.date || (initialDateRef.current || auditInfo.date || today);
  if (!data.date && !initialDateRef.current) {
    initialDateRef.current = dateValue;
  }

  const updRow = (i,k,v) => { const a=[...rows]; a[i]={...a[i],[k]:v}; upd('rows',a); };
  return (
    <div className="lf">
      <style>{CSS}</style>
      <AnnexeHeaderLocal numero="Annexe 11(c)" titre="Rapport d'audit Produit Torsadage (Audi C-BEV)" />
      <div style={{ fontSize:7, color:'#666', padding:'2px 4px', marginBottom:4 }}>IT TN 3625 — Annexe 11c Etat 01.2020</div>
      <div style={{ marginBottom:6, fontSize:10 }}>
        <InfoLine label="TAB" value={data.tab||auditInfo.tab||''} onChange={v=>upd('tab',v)} />
        <InfoLine label="Var" value={data.var||''} onChange={v=>upd('var',v)} />
        <InfoLine label="Index" value={data.index||''} onChange={v=>upd('index',v)} />
        <InfoLine label="Date" value={dateValue} onChange={v=>upd('date',v)} type="date" />
      </div>
      <div style={{ overflowX:'auto' }}>
        <table style={{ minWidth:900 }}>
          <thead>
            <tr>
              {['Position','Nr Fil','Couleur','Section','Nb fils','Pas exigé','Pas mesuré','Mesure C1','Mesure C2','Bout C1','Bout C2','Résultat'].map(h=><th key={h}>{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} className={row.resultat==='NOK'?'nok':''}>
                <td style={{ textAlign:'center', fontWeight:700, background:'#EEF2F8' }}>{row.position}</td>
                {['nrFil','couleur','section','nbreFils','pasTorsadageExige','pasTorsadageMesure','mesureC1','mesureC2','boutTorsadageC1','boutTorsadageC2'].map(k=>(
                  <td key={k}><Inp value={row[k]} onChange={v=>updRow(i,k,v)} /></td>
                ))}
                <td><OkNok value={row.resultat} onChange={v=>updRow(i,'resultat',v)} name={`r11c_${i}`} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// ANNEXE 13 BASE
// ═══════════════════════════════════════════════════════════════════
function FormAnnexe13Base({ numero, title, refTxt, data={}, onChange, attributChecks, auditInfo={} }) {
  const upd = (k,v) => onChange({ ...data, [k]:v });
  const updCheck = (k,v) => upd('attributChecks', { ...(data.attributChecks||{}), [k]:v });
  const checks = data.attributChecks||{};
  const dimRows = data.dimRows || Array(7).fill(null).map((_,i)=>({
    nr:i+1, critere:'', specification:'', echantillon:'', decision:''
  }));

  // ✅ Pré-remplissage des dates UNE SEULE FOIS
  const initialDateRef = useRef(null);
  const today = new Date().toISOString().split('T')[0];
  const dateValue = data.date || (initialDateRef.current || auditInfo.date || today);
  if (!data.date && !initialDateRef.current) {
    initialDateRef.current = dateValue;
  }

  const updDim = (i,k,v) => { const a=[...dimRows]; a[i]={...a[i],[k]:v}; upd('dimRows',a); };

  return (
    <div className="lf">
      <style>{CSS}</style>
      <AnnexeHeaderLocal numero={numero} titre={title} />
      <div style={{ fontSize:7, color:'#666', padding:'2px 4px', marginBottom:4 }}>{refTxt}</div>

      <div style={{ marginBottom:6, fontSize:10 }}>
        <InfoLine label="Auditeur" value={data.auditeur||auditInfo.auditorName||''} onChange={v=>upd('auditeur',v)} />
        <InfoLine label="Série / TAB" value={data.serie||auditInfo.serie||auditInfo.tab||''} onChange={v=>upd('serie',v)} />
        <InfoLine label="Plant" value={data.plant||auditInfo.plant||''} onChange={v=>upd('plant',v)} />
        <InfoLine label="N° article LEONI" value={data.numArticleLEONI||''} onChange={v=>upd('numArticleLEONI',v)} />
        <InfoLine label="N° article BMW" value={data.numArticleBMW||''} onChange={v=>upd('numArticleBMW',v)} />
        <InfoLine label="Fournisseur" value={data.fournisseur||''} onChange={v=>upd('fournisseur',v)} />
        <InfoLine label="Index" value={data.index||''} onChange={v=>upd('index',v)} />
        <InfoLine label="Date" value={dateValue} onChange={v=>upd('date',v)} type="date" />
      </div>

      <div style={{ border:'1px solid #000', padding:'5px', marginBottom:6, fontSize:10 }}>
        <label style={{ marginRight:16 }}>
          <input type="checkbox" checked={!!data.auditPlanifie} onChange={e=>upd('auditPlanifie',e.target.checked)} style={{ width:'auto' }} />
          {' '}Audit Produit Destructif Planifié
        </label>
        <label>
          <input type="checkbox" checked={!!data.auditNonPlanifie} onChange={e=>upd('auditNonPlanifie',e.target.checked)} style={{ width:'auto' }} />
          {' '}Audit Produit Destructif Non planifié
        </label>
      </div>

      <div className="sec">Résultat du contrôle (Attributif Check Results) (IC 3040)</div>
      <div style={{ overflowX:'auto' }}>
        <table>
          <thead>
            <tr>
              {attributChecks.map(ac=>(
                <th key={ac.key} style={{ fontSize:8, maxWidth:80 }}>{ac.label}</th>
              ))}
              <th style={{ width:70 }}>Décision*</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              {attributChecks.map(ac=>(
                <td key={ac.key} style={{ textAlign:'center' }}>
                  <OkNok value={checks[ac.key]||''} onChange={v=>updCheck(ac.key,v)} name={`ac_${ac.key}`} />
                </td>
              ))}
              <td style={{ textAlign:'center' }}>
                <select value={data.decisionGlobale||''} onChange={e=>upd('decisionGlobale',e.target.value)}
                  style={{ border:'1px solid #ccc', fontSize:10, fontFamily:'Arial', outline:'none', width:'auto' }}>
                  <option value="">—</option><option value="Ok">Ok</option><option value="NOK">NOK</option>
                </select>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="sec" style={{ marginTop:8 }}>Rapport Dimensionnel selon Dessin</div>
      <table>
        <thead>
          <tr>
            <th style={{ width:35 }}>Nr.</th>
            <th>Critère / Criteria</th>
            <th style={{ width:160 }}>Spécification / Specification</th>
            <th style={{ width:100 }}>Échantillon / Sample</th>
            <th style={{ width:80 }}>Décision*</th>
          </tr>
        </thead>
        <tbody>
          {dimRows.map((row, i) => (
            <tr key={i} className={row.decision==='NOK'?'nok':''}>
              <td style={{ textAlign:'center', fontWeight:700, background:'#EEF2F8' }}>{i+1}</td>
              {['critere','specification','echantillon'].map(k=>(
                <td key={k}><Inp value={row[k]} onChange={v=>updDim(i,k,v)} /></td>
              ))}
              <td><OkNok value={row.decision} onChange={v=>updDim(i,'decision',v)} name={`dim_${i}`} /></td>
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{ marginTop:6, fontSize:8 }}>
        <b>*Décision: OK/NOK (Non mesuré: mentionner la raison)</b>
      </div>
    </div>
  );
}

export function FormAnnexe13A({ data={}, onChange, auditInfo={} }) {
  return <FormAnnexe13Base numero="Annexe 13(a)" title="Audit Produit Destructif — Résultat de Contrôle Des Tubes"
    refTxt="IT TN 3625 — Annexe 13-a Etat 09.22" data={data} onChange={onChange}
    auditInfo={auditInfo}
    attributChecks={[
      { key:'productionIndex', label:'Index de Production' },
      { key:'geometrie', label:'Géométrie / Geometry' },
      { key:'couleur', label:'Couleur / Color' },
      { key:'aspectExterieur', label:'Aspect Externe (Pores and Cracks)' },
      { key:'marquage', label:'Marquage / Marking' },
      { key:'etatCoupe', label:'Etat de coupe / Cut Sides' },
    ]} />;
}

export function FormAnnexe13B({ data={}, onChange, auditInfo={} }) {
  return <FormAnnexe13Base numero="Annexe 13(b)" title="Audit Produit Destructif — Résultat de Contrôle Des douilles et couvercles"
    refTxt="IT TN 3625 — Annexe 13-b Etat 09.22" data={data} onChange={onChange}
    auditInfo={auditInfo}
    attributChecks={[
      { key:'productionIndex', label:'Index de Production' },
      { key:'geometrieCouleurCodage', label:'Géométrie/Couleur/Codage' },
      { key:'couleurJoint', label:'Couleur du joint' },
      { key:'marquagePins', label:'Marquage des Pins' },
      { key:'aspectExterieur', label:'Aspect Extérieur' },
      { key:'entierementMoule', label:'Entièrement Moulés?' },
      { key:'verrouillageSecondaire', label:'Verrouillage secondaire' },
      { key:'assemblageSousEnsembles', label:'Assemblage sous-ensembles' },
    ]} />;
}

export function FormAnnexe13C({ data={}, onChange, auditInfo={} }) {
  return <FormAnnexe13Base numero="Annexe 13(c)" title="Audit Produit Destructif — Résultat de Contrôle Des joints"
    refTxt="IT TN 3625 — Annexe 13-c Etat 09.22" data={data} onChange={onChange}
    auditInfo={auditInfo}
    attributChecks={[
      { key:'geometrie', label:'Géométrie' },
      { key:'couleur', label:'Couleur' },
      { key:'aspectExterieur', label:'Aspect Extérieur' },
      { key:'totalementMoule', label:'Totalement moulé?' },
      { key:'excessMatiere', label:'Excès de Matière?' },
    ]} />;
}

export function FormAnnexe13D({ data={}, onChange, auditInfo={} }) {
  return <FormAnnexe13Base numero="Annexe 13(d)" title="Audit Produit Destructif — Résultat de Contrôle Des Contacts"
    refTxt="IT TN 3625 — Annexe 13-d Etat 09.22" data={data} onChange={onChange}
    auditInfo={auditInfo}
    attributChecks={[
      { key:'index', label:'Index' },
      { key:'empreinte', label:'Empreinte / Stamp' },
      { key:'geometrie', label:'Géométrie' },
      { key:'aspectSurface', label:'Aspect surface matière' },
      { key:'gel', label:'Gel (si applicable)' },
      { key:'surfaceSansFissures', label:'Surface sans fissures' },
    ]} />;
}

// ═══════════════════════════════════════════════════════════════════
// ANNEXE PSA
// ═══════════════════════════════════════════════════════════════════
export function FormAnnexePSA({ data={}, onChange, auditInfo={} }) {
  const upd = (k,v) => onChange({ ...data, [k]:v });
  const colonnes = data.colonnes || Array(13).fill(null).map((_,i)=>({
    nom:`Cotation N°${i+1}`, typCaracteristique:'', classif:'', cgu:'',
    nominal:'', borneSup:'', borneInf:'', jugement:'', accordConformite:'', commentaire:'',
    mesures:Array(5).fill(null).map(()=>({ valeur:'', conforme:null }))
  }));

  // ✅ Pré-remplissage des dates UNE SEULE FOIS
  const initialDateRef = useRef(null);
  const today = new Date().toISOString().split('T')[0];
  const dateValue = data.date || (initialDateRef.current || auditInfo.date || today);
  if (!data.date && !initialDateRef.current) {
    initialDateRef.current = dateValue;
  }

  const updCol = (ci,k,v) => { const a=[...colonnes]; a[ci]={...a[ci],[k]:v}; upd('colonnes',a); };
  const updMesure = (ci,mi,v) => {
    const a=[...colonnes]; const m=[...(a[ci].mesures||[])];
    const val=parseFloat(v), nom=parseFloat(a[ci].nominal||0);
    const bs=parseFloat(a[ci].borneSup||0), bi=parseFloat(a[ci].borneInf||0);
    m[mi]={ valeur:v, conforme:!isNaN(val)?(val>=nom-Math.abs(bi)&&val<=nom+bs):null };
    a[ci].mesures=m; upd('colonnes',a);
  };

  return (
    <div className="lf">
      <style>{CSS}</style>
      <AnnexeHeaderLocal numero="Annexe PSA" titre='Rapport de contrôle et de mesure des pièces "PSA" (Spécifique Moteur Sud)' />
      <div style={{ fontSize:7, color:'#666', padding:'2px 4px', marginBottom:4 }}>IT TN 3625 — Spécifique Moteur Sud</div>

      <div style={{ marginBottom:6, fontSize:10 }}>
        <InfoLine label="Auditeur" value={data.auditeur||auditInfo.auditorName||''} onChange={v=>upd('auditeur',v)} />
        <InfoLine label="Série / TAB" value={data.serie||auditInfo.serie||auditInfo.tab||''} onChange={v=>upd('serie',v)} />
        <InfoLine label="Plant" value={data.plant||auditInfo.plant||''} onChange={v=>upd('plant',v)} />
        <InfoLine label="Fournisseur" value={data.fournisseur||''} onChange={v=>upd('fournisseur',v)} />
        <InfoLine label="Désignation" value={data.designation||''} onChange={v=>upd('designation',v)} />
        <InfoLine label="N° audit" value={data.numAudit||''} onChange={v=>upd('numAudit',v)} />
        <InfoLine label="Index" value={data.index||''} onChange={v=>upd('index',v)} />
        <InfoLine label="Date" value={dateValue} onChange={v=>upd('date',v)} type="date" />
      </div>

      <div style={{ overflowX:'auto' }}>
        <table style={{ minWidth:1000 }}>
          <thead>
            <tr>
              <th>N°</th><th>Identification</th><th>Type car.</th><th>Classif.</th><th>CGU</th>
              <th>Nominal</th><th>Borne Sup.</th><th>Borne Inf.</th><th>Jugement</th>
              {Array(5).fill(0).map((_,i)=><th key={i} style={{ width:40 }}>R.{i+1}</th>)}
              <th>Accord</th><th>Commentaire</th>
            </tr>
          </thead>
          <tbody>
            {colonnes.map((col, ci) => (
              <tr key={ci}>
                <td style={{ textAlign:'center', fontWeight:700 }}>{ci+1}</td>
                <td><Inp value={col.nom} onChange={v=>updCol(ci,'nom',v)} /></td>
                <td>
                  <select value={col.typCaracteristique||''} onChange={e=>updCol(ci,'typCaracteristique',e.target.value)}>
                    <option value="">—</option><option>Dimensionnelle</option><option>Fonctionnelle</option><option>Visuelle</option>
                  </select>
                </td>
                <td><Inp value={col.classif} onChange={v=>updCol(ci,'classif',v)} /></td>
                <td><Inp value={col.cgu} onChange={v=>updCol(ci,'cgu',v)} /></td>
                <td><Inp value={col.nominal} onChange={v=>updCol(ci,'nominal',v)} type="number" /></td>
                <td><Inp value={col.borneSup} onChange={v=>updCol(ci,'borneSup',v)} type="number" /></td>
                <td><Inp value={col.borneInf} onChange={v=>updCol(ci,'borneInf',v)} type="number" /></td>
                <td>
                  <select value={col.jugement||''} onChange={e=>updCol(ci,'jugement',e.target.value)}>
                    <option value="">—</option><option>Conforme</option><option>Non conforme</option><option>mise à Jour</option>
                  </select>
                </td>
                {(col.mesures||[]).map((m,mi)=>(
                  <td key={mi}>
                    <input type="number" value={m.valeur||''} onChange={e=>updMesure(ci,mi,e.target.value)}
                      style={{ width:36, border:`1px solid ${m.conforme===false?'#DC2626':m.conforme===true?'#059669':'#ccc'}`,
                        outline:'none', fontSize:9, fontFamily:'Arial', textAlign:'center', background:'transparent' }} />
                  </td>
                ))}
                <td>
                  <select value={col.accordConformite||''} onChange={e=>updCol(ci,'accordConformite',e.target.value)}>
                    <option value="">—</option><option>Conforme</option><option>Conditionnelle</option><option>Non conforme</option>
                  </select>
                </td>
                <td><Inp value={col.commentaire} onChange={v=>updCol(ci,'commentaire',v)} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// ANNEXE DPE
// ═══════════════════════════════════════════════════════════════════
export function FormAnnexeDPE({ data={}, onChange, auditInfo={} }) {
  const upd = (k,v) => onChange({ ...data, [k]:v });
  const rows = data.rows || Array(15).fill(null).map((_,i)=>({
    nr:i+1, typCaracteristique:'', identification:'', classif:'',
    nbFoisParCaract:'', objetParCaract:'', normal:'', tol1:'', tol2:'',
    referenceNumeraire:'', mesures:Array(5).fill(''),
    identificationResultat:'', jugement:'', accordConformite:'', commentaire:''
  }));

  // ✅ Pré-remplissage des dates UNE SEULE FOIS
  const initialDateRef = useRef(null);
  const today = new Date().toISOString().split('T')[0];
  const dateValue = data.date || (initialDateRef.current || auditInfo.date || today);
  if (!data.date && !initialDateRef.current) {
    initialDateRef.current = dateValue;
  }

  const updRow = (i,k,v) => { const a=[...rows]; a[i]={...a[i],[k]:v}; upd('rows',a); };

  return (
    <div className="lf">
      <style>{CSS}</style>
      <AnnexeHeaderLocal numero="Annexe DPE" titre='Rapport de contrôle et de mesure des pièces "DPE" (Spécifique Moteur Sud)' />
      <div style={{ fontSize:7, color:'#666', padding:'2px 4px', marginBottom:4 }}>IT TN 3625 — Spécifique Moteur Sud</div>

      <div style={{ marginBottom:6, fontSize:10 }}>
        <InfoLine label="Auditeur" value={data.auditeur||auditInfo.auditorName||''} onChange={v=>upd('auditeur',v)} />
        <InfoLine label="Série / TAB" value={data.serie||auditInfo.serie||auditInfo.tab||''} onChange={v=>upd('serie',v)} />
        <InfoLine label="Plant" value={data.plant||auditInfo.plant||''} onChange={v=>upd('plant',v)} />
        <InfoLine label="Fournisseur" value={data.fournisseur||''} onChange={v=>upd('fournisseur',v)} />
        <InfoLine label="Désignation" value={data.designation||''} onChange={v=>upd('designation',v)} />
        <InfoLine label="N° audit" value={data.numAudit||''} onChange={v=>upd('numAudit',v)} />
        <InfoLine label="Index" value={data.index||''} onChange={v=>upd('index',v)} />
        <InfoLine label="Date" value={dateValue} onChange={v=>upd('date',v)} type="date" />
      </div>

      <div style={{ overflowX:'auto' }}>
        <table style={{ minWidth:1000 }}>
          <thead>
            <tr>
              <th>N°</th><th>Type car.</th><th>Identification</th><th>Classif.</th>
              <th>Nb fois</th><th>Objet</th><th>Normal</th><th>Tol.+</th><th>Tol.-</th>
              <th>Réf. Num.</th>
              {Array(5).fill(0).map((_,j)=><th key={j}>M.{j+1}</th>)}
              <th>Id Rés.</th><th>Jugement</th><th>Accord</th><th>Commentaire</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} className={row.jugement==='Non conforme'?'nok':''}>
                <td style={{ textAlign:'center', fontWeight:700, background:'#EEF2F8' }}>{i+1}</td>
                <td>
                  <select value={row.typCaracteristique||''} onChange={e=>updRow(i,'typCaracteristique',e.target.value)}>
                    <option value="">—</option><option>Dimensionnelle</option><option>Fonctionnelle</option><option>Visuelle</option>
                  </select>
                </td>
                {['identification','classif','nbFoisParCaract','objetParCaract','normal','tol1','tol2','referenceNumeraire'].map(k=>(
                  <td key={k}><Inp value={row[k]} onChange={v=>updRow(i,k,v)} /></td>
                ))}
                {(row.mesures||[]).map((m,mi)=>(
                  <td key={mi}>
                    <input type="number" value={m||''} onChange={e=>{
                      const ms=[...(row.mesures||[])]; ms[mi]=e.target.value; updRow(i,'mesures',ms);
                    }} style={{ width:38, border:'none', outline:'none', fontSize:9, fontFamily:'Arial', background:'transparent' }} />
                  </td>
                ))}
                <td><Inp value={row.identificationResultat} onChange={v=>updRow(i,'identificationResultat',v)} /></td>
                <td>
                  <select value={row.jugement||''} onChange={e=>updRow(i,'jugement',e.target.value)}>
                    <option value="">—</option><option>Conforme</option><option>Non conforme</option><option>A Adapter</option><option>mise à Jour</option>
                  </select>
                </td>
                <td>
                  <select value={row.accordConformite||''} onChange={e=>updRow(i,'accordConformite',e.target.value)}>
                    <option value="">—</option><option>Conforme</option><option>Conditionnelle</option><option>Non conforme</option>
                  </select>
                </td>
                <td><Inp value={row.commentaire} onChange={v=>updRow(i,'commentaire',v)} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default FormAnnexe5;