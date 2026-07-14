/**
 * AuditReportSystem.jsx — LEONI PAP
 * ════════════════════════════════════════════════════════════
 * CORRECTIONS FINALES :
 *  ✓ Header navy + logo LEONI blanc (comme version originale)
 *  ✓ Rendu annexe = snapshot fidèle : TOUTES les lignes et colonnes
 *    affichées même si vides — exactement comme l'écran auditeur
 *  ✓ Rendu récursif universel : rows, defauts, etapes, colonnes…
 * ════════════════════════════════════════════════════════════
 */
import { useState, useEffect, useRef, useCallback } from 'react';

const NAVY   = '#001F4E';
const SLATE  = '#334155';
const MUTED  = '#64748B';
const BORDER = '#CBD5E1';

const API  = 'http://localhost:8080/api';
const apiH = () => ({ Authorization:`Bearer ${localStorage.getItem('token')}`, 'Content-Type':'application/json' });
const fmt  = d => { if(!d) return '—'; try { return new Date(d).toLocaleDateString('fr-FR',{day:'2-digit',month:'long',year:'numeric'}); } catch { return d; } };
const fmtS = d => { if(!d) return '—'; try { return new Date(d).toLocaleDateString('fr-FR',{day:'2-digit',month:'short',year:'numeric'}); } catch { return d; } };

const downloadPdfWithAuth = async (url, filename) => {
  try {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    });
    if (!res.ok) throw new Error('Erreur ' + res.status);
    const blob = await res.blob();
    const objectUrl = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = objectUrl;
    a.download = filename || 'rapport.pdf';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(objectUrl);
  } catch (e) {
    alert('Erreur : ' + e.message);
  }
};

const viewPdfWithAuth = async (url) => {
  try {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    });
    if (!res.ok) throw new Error('Erreur ' + res.status);
    const blob = await res.blob();
    const objectUrl = window.URL.createObjectURL(
      new Blob([blob], { type: 'application/pdf' })
    );
    window.open(objectUrl, '_blank');
  } catch (e) {
    alert('Erreur : ' + e.message);
  }
};

const QK_META = {
  VERT:  {color:'#059669',bg:'#ECFDF5',bd:'#A7F3D0',label:'Produit Conforme',      emoji:'✅',action:'Aucune action corrective requise.'},
  ORANGE:{color:'#C8982A',bg:'#FFFBEB',bd:'#FCD34D',label:'Non-Conformité Mineure',emoji:'⚠️',action:'Fiche de réparation obligatoire.'},
  ROSE:  {color:'#9D174D',bg:'#FDF2F8',bd:'#F9A8D4',label:'Action Corrective',     emoji:'⚡',action:'Fiche de réparation + PDCA obligatoires.'},
  ROUGE: {color:'#DC2626',bg:'#FEF2F2',bd:'#FECACA',label:'ALERTE CRITIQUE',       emoji:'🚨',action:'Fiche + PDCA + Action immédiate.'},
};

const overlay = {position:'fixed',inset:0,background:'rgba(0,10,30,.72)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:3200,backdropFilter:'blur(10px)'};
const CSS = `
  @keyframes popIn  {from{opacity:0;transform:scale(.95)}to{opacity:1;transform:none}}
  @keyframes fadeUp {from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
  @keyframes spin   {to{transform:rotate(360deg)}}
`;

/* ══════════════════════════════════════════════════════════
   NORMALISATION ANNEXE
══════════════════════════════════════════════════════════ */
function normalizeAnnexe(a) {
  let formData = null;
  try {
    if (a.formDataJson && typeof a.formDataJson === 'string') {
      const s = a.formDataJson.trim();
      if (s !== '{}' && s !== 'null' && s !== '') formData = JSON.parse(s);
    }
    if (!formData && a.formData && typeof a.formData === 'object' && Object.keys(a.formData||{}).length > 0) {
      formData = a.formData;
    }
  } catch { /* ignore */ }
  const hasFormData = formData != null && Object.keys(formData).length > 0;
  const complete = !!a.importe || !!a.formValide || hasFormData;
  let valeurQkExtraite = a.valeurQkExtraite ?? null;
  if (valeurQkExtraite == null && hasFormData) {
    for (const k of ['valeurQK','valeurQkExtraite','qkValue','qk']) {
      if (formData[k] != null && !isNaN(Number(formData[k]))) { valeurQkExtraite = Number(formData[k]); break; }
    }
  }
  return { ...a, formData, hasFormData, complete, valeurQkExtraite,
    typeLabel: a.typeAnnexe || '—',
    displayName: a.libelle || a.name || `Annexe ${a.typeAnnexe}` };
}

/* ══════════════════════════════════════════════════════════
   SNAPSHOT COMPLET D'UNE ANNEXE
   Rendu type-aware : connaît la structure exacte de chaque
   formulaire (1A, 1B, 4, 5, 6, 7, 7A, 8, 10, 11A/B/C,
   13A/B/C/D, PSA, DPE).
   Affiche TOUTES les lignes et colonnes, même vides —
   exactement comme l'auditeur les voit à l'écran.
══════════════════════════════════════════════════════════ */
function snapshotAnnexe(annexe) {
  const { formData, typeLabel } = annexe;

  if (!formData || Object.keys(formData).length === 0) {
    return `<div style="padding:14px;border:1px dashed #CBD5E1;color:#94A3B8;
      font-style:italic;font-size:9pt;text-align:center">
      Aucune donnée disponible pour cette annexe.
    </div>`;
  }

  /* ── Constantes de style ─────────────────────────────── */
  const TH  = `background:#001F4E;color:#fff;padding:5px 7px;font-size:7.5pt;font-weight:700;border:1px solid #00295F;white-space:nowrap;text-align:center`;
  const THL = `background:#001F4E;color:#fff;padding:5px 7px;font-size:7.5pt;font-weight:700;border:1px solid #00295F;white-space:nowrap;text-align:left`;
  const TD  = (bg='#fff',extra='') => `padding:5px 7px;border:1px solid #E2E8F0;font-size:8pt;background:${bg};${extra}`;
  const NOK_SET = new Set(['NOK','N.I.O','niO','Non conforme','A Adapter','Non']);
  const OK_SET  = new Set(['OK','I.O','iO','Oui','Conforme']);

  /* Valeur colorée résultat */
  const resSpan = s => {
    if (!s && s !== 0) return '';
    const str = String(s);
    const c = NOK_SET.has(str) ? '#DC2626' : OK_SET.has(str) ? '#059669' : '#334155';
    const w = (NOK_SET.has(str)||OK_SET.has(str)) ? '700' : '400';
    return `<span style="color:${c};font-weight:${w}">${str}</span>`;
  };

  /* Valeur safe */
  const v = (val, isRes=false) => {
    if (val === null || val === undefined || val === '') return '';
    if (typeof val === 'boolean') return val ? '<b style="color:#059669">✓</b>' : '<span style="color:#94A3B8">✗</span>';
    if (isRes) return resSpan(String(val));
    const s = String(val);
    return s.length > 150 ? s.substring(0,150)+'…' : s;
  };

  /* Info-grille champs scalaires d'en-tête */
  const infoGrid = (fields) => {
    if (!fields || fields.length === 0) return '';
    const pairs = [];
    for (let i = 0; i < fields.length; i += 2) pairs.push(fields.slice(i,i+2));
    return `<table style="border-collapse:collapse;width:100%;margin-bottom:12px">
      <tbody>${pairs.map(pair => `<tr>
        <td style="padding:5px 10px;border:1px solid #E2E8F0;font-weight:600;color:#475569;background:#F8FAFC;width:18%;font-size:8pt;white-space:nowrap">${pair[0].l}</td>
        <td style="padding:5px 10px;border:1px solid #E2E8F0;width:32%;font-size:8.5pt">${v(pair[0].val)}</td>
        ${pair[1]
          ? `<td style="padding:5px 10px;border:1px solid #E2E8F0;font-weight:600;color:#475569;background:#F8FAFC;width:18%;font-size:8pt;white-space:nowrap">${pair[1].l}</td>
             <td style="padding:5px 10px;border:1px solid #E2E8F0;font-size:8.5pt">${v(pair[1].val)}</td>`
          : '<td style="border:1px solid #E2E8F0;background:#F8FAFC"></td><td style="border:1px solid #E2E8F0"></td>'
        }
      </tr>`).join('')}
      </tbody>
    </table>`;
  };

  /* Section titre */
  const secTitle = (txt, count='') =>
    `<div style="font-size:7.5pt;font-weight:700;color:#001F4E;text-transform:uppercase;
      letter-spacing:.08em;padding:5px 10px;background:#EEF2F8;
      border-left:3px solid #001F4E;margin:12px 0 6px">
      ${txt}${count ? `<span style="font-weight:400;color:#64748B;text-transform:none;margin-left:6px">(${count})</span>` : ''}
    </div>`;

  /* Table générique avec colonnes définies et TOUTES les lignes */
  const dataTable = (rows, cols, resKey=null) => {
    if (!rows || rows.length === 0)
      return `<p style="color:#94A3B8;font-style:italic;font-size:8pt;padding:4px 8px">Aucune ligne.</p>`;

    const thead = cols.map(c => `<th style="${c.align==='left'?THL:TH};min-width:${c.w||40}px">${c.h}</th>`).join('');
    const tbody = rows.map((row, ri) => {
      const rk = resKey || cols.find(c => ['resultat','io','decision','jugement'].includes(c.k))?.k;
      const rval = rk ? String(row[rk] ?? '') : '';
      const isNok = NOK_SET.has(rval);
      const bg = isNok ? '#FFF0F0' : ri%2===0 ? '#fff' : '#F8FAFC';
      const lb = isNok ? 'border-left:3px solid #DC2626;' : '';
      const cells = cols.map(c => {
        const val = row[c.k];
        let cell = '';
        if (c.k === '_idx') cell = String(ri+1);
        else if (c.isRes) cell = resSpan(String(val??''));
        else if (typeof val === 'boolean') cell = val ? '<b style="color:#059669">✓</b>' : '<span style="color:#94A3B8">✗</span>';
        else cell = v(val);
        const align = c.align==='left' ? 'text-align:left' : 'text-align:center';
        return `<td style="${TD(bg,lb+align)}">${cell}</td>`;
      }).join('');
      return `<tr>${cells}</tr>`;
    }).join('');

    const nbNok = rows.filter(r => {
      const rk = resKey || cols.find(c=>['resultat','io','decision','jugement'].includes(c.k))?.k;
      return rk && NOK_SET.has(String(r[rk]??''));
    }).length;
    const nokTag = nbNok > 0
      ? `<p style="margin:4px 0 0;font-size:8pt;font-weight:700;color:#DC2626">⚠ ${nbNok} ligne${nbNok>1?'s':''} non conforme${nbNok>1?'s':''}</p>` : '';

    return `<div style="overflow-x:auto">
      <table style="border-collapse:collapse;width:100%;font-size:8pt">
        <thead><tr>${thead}</tr></thead>
        <tbody>${tbody}</tbody>
      </table>${nokTag}
    </div>`;
  };

  const fd = formData;
  let html = '';

  /* ══════════════════════════════════════════════════════
     ANNEXE 1A — Monthly Report Overview
  ══════════════════════════════════════════════════════ */
  if (typeLabel === '1A') {
    html += infoGrid([
      {l:'Mois / Année', val:fd.monthYear},
      {l:'Type véhicule', val:fd.vehicleType},
      {l:'Plant', val:fd.plant},
    ]);
    html += secTitle('Résultats mensuels', `${(fd.rows||[]).filter(r=>r.drawingNo||r.partDesc).length} câblages`);
    html += dataTable(fd.rows||[], [
      {k:'partDesc',       h:'Part Description',     align:'left', w:120},
      {k:'drawingNo',      h:'N° dessin',             align:'left', w:80},
      {k:'productionDate', h:'Date production',       w:80},
      {k:'productAuditor', h:'Auditeur',              align:'left', w:80},
      {k:'qk',             h:'QK',                    w:40, isRes:false},
      {k:'nbDefects',      h:'Nb défauts',            w:50},
      {k:'totalPoints',    h:'Total pts',             w:55},
      {k:'ratingFactor',   h:'Rating Factor',         w:60},
      {k:'destructive',    h:'D',                     w:30},
      {k:'nonDestructive', h:'N',                     w:30},
    ], null);
    return html;
  }

  /* ══════════════════════════════════════════════════════
     ANNEXE 1B — Fiche individuelle + Calcul QK
  ══════════════════════════════════════════════════════ */
  if (typeLabel === '1B') {
    html += infoGrid([
      {l:'Part Description', val:fd.partDesc},      {l:'Département', val:fd.department},
      {l:'Type véhicule',    val:fd.vehicleType},   {l:'Plant',       val:fd.plant},
      {l:'TAB',              val:fd.tab},            {l:'Identification', val:fd.identification},
      {l:'Auditeur',         val:fd.auditor},        {l:'Date',        val:fd.date},
      {l:'Mois / Année',     val:fd.monthYear},      {l:'Type (D/N)',  val:fd.auditType},
    ]);
    /* Calcul QK résumé */
    const qkNum = parseFloat(fd.valeurQK)||0;
    const qkC = qkNum===0?'#059669':qkNum<=0.5?'#C8982A':qkNum<=1?'#9D174D':'#DC2626';
    html += `<div style="display:flex;gap:16px;align-items:center;padding:10px 14px;
      border:1.5px solid ${qkC}44;background:${qkC}10;border-radius:6px;margin-bottom:12px;flex-wrap:wrap">
      <div style="text-align:center">
        <div style="font-size:7.5pt;color:#64748B;font-weight:600">Total pts</div>
        <div style="font-size:18pt;font-weight:900;color:#001F4E">${fd.totalPoints||0}</div>
      </div>
      <div style="font-size:14pt;color:#94A3B8">×</div>
      <div style="text-align:center">
        <div style="font-size:7.5pt;color:#64748B;font-weight:600">Rating Factor</div>
        <div style="font-size:18pt;font-weight:900;color:#001F4E">${fd.ratingFactor||'—'}</div>
        <div style="font-size:7pt;color:#94A3B8">n=${fd.nbComposants||'?'} composants</div>
      </div>
      <div style="font-size:14pt;color:#94A3B8">=</div>
      <div style="text-align:center">
        <div style="font-size:7.5pt;color:#64748B;font-weight:600">Weighted Points</div>
        <div style="font-size:18pt;font-weight:900;color:#001F4E">${fd.weightedPoints||0}</div>
      </div>
      <div style="font-size:18pt;color:#94A3B8">→</div>
      <div style="text-align:center;background:${qkC};padding:8px 14px;border-radius:6px">
        <div style="font-size:7pt;color:#fff;opacity:.8;font-weight:600">QK</div>
        <div style="font-size:26pt;font-weight:900;color:#fff;line-height:1">${qkNum.toFixed(1)}</div>
      </div>
    </div>`;
    html += secTitle('Défauts détectés', `${(fd.defauts||[]).length} défauts — Total ${fd.totalPoints||0} pts`);
    html += dataTable(fd.defauts||[], [
      {k:'code',              h:'Code',         w:45},
      {k:'type',              h:'Type (F/S/K/L)',w:50},
      {k:'description',       h:'Description',  align:'left', w:160},
      {k:'action',            h:'Action corrective', align:'left', w:120},
      {k:'freq',              h:'Fréq.',        w:40},
      {k:'pointsDefect',      h:'Pts/défaut',   w:55},
      {k:'totalDefectPoints', h:'Total pts',    w:55},
      {k:'pilot',             h:'Responsable',  w:70},
      {k:'deadline',          h:'Échéance',     w:70},
      {k:'checked',           h:'OK',           w:35},
    ], null);
    return html;
  }

  /* ══════════════════════════════════════════════════════
     ANNEXE 4 — Étapes de travail
  ══════════════════════════════════════════════════════ */
  if (typeLabel === '4') {
    html += infoGrid([
      {l:'Série / TAB', val:fd.serie}, {l:'Index', val:fd.index},
      {l:'Validateur 1', val:fd.validateur1}, {l:'Validateur 2', val:fd.validateur2},
    ]);
    html += secTitle('Étapes de travail');
    const etapes = fd.etapes || [];
    if (etapes.length === 0) {
      html += `<p style="color:#94A3B8;font-style:italic;font-size:8pt;padding:4px 8px">Aucune étape saisie.</p>`;
    } else {
      const tbody = etapes.map((e, ri) => {
        if (e.isGroupHeader) {
          return `<tr><td colspan="4" style="background:#EEF2F8;font-weight:800;color:#001F4E;padding:6px 10px;font-size:8.5pt;border:1px solid #E2E8F0">${v(e.element)}</td></tr>`;
        }
        const isNok = e.resultat === 'N.I.O';
        const bg = isNok ? '#FFF0F0' : ri%2===0 ? '#fff' : '#F8FAFC';
        const lb = isNok ? 'border-left:3px solid #DC2626;' : '';
        const resC = e.resultat==='I.O'?'#059669':e.resultat==='N.I.O'?'#DC2626':'#94A3B8';
        return `<tr>
          <td style="${TD('#F8FAFC',lb)}font-weight:600;font-size:8pt">${v(e.element)}</td>
          <td style="${TD(bg,lb)}font-size:8pt">${v(e.etape)}</td>
          <td style="${TD(bg,lb)}font-size:7.5pt;color:#64748B">${v(e.documentation)}</td>
          <td style="${TD(bg,lb)}text-align:center;font-weight:700;color:${resC}">${e.resultat||''}</td>
        </tr>`;
      }).join('');
      html += `<div style="overflow-x:auto"><table style="border-collapse:collapse;width:100%;font-size:8pt">
        <thead><tr>
          <th style="${THL};width:120px">Élément</th>
          <th style="${THL}">Étape de travail</th>
          <th style="${THL};width:200px">Documentation</th>
          <th style="${TH};width:70px">Résultat</th>
        </tr></thead>
        <tbody>${tbody}</tbody>
      </table></div>`;
      const nbNio = etapes.filter(e=>e.resultat==='N.I.O').length;
      if (nbNio > 0) html += `<p style="margin:4px 0 0;font-size:8pt;font-weight:700;color:#DC2626">⚠ ${nbNio} étape${nbNio>1?'s':''} N.I.O</p>`;
    }
    return html;
  }

  /* ══════════════════════════════════════════════════════
     ANNEXE 5 — Audit processus assemblage
  ══════════════════════════════════════════════════════ */
  if (typeLabel === '5') {
    html += infoGrid([
      {l:'Série / TAB', val:fd.serie}, {l:'Index / Date', val:fd.indexDate},
      {l:'Validateur 1', val:fd.validateur1}, {l:'Validateur 2', val:fd.validateur2},
    ]);
    html += secTitle('Questions audit processus');
    const q = fd.questions || {};
    const QLABELS = {
      q11:'1.1 Instruction emballage existe et respectée?',
      q12:'1.2 Emballage intérieur selon instruction interne',
      q13:'1.3 Instructions internes d\'identification respectées?',
      q21:'2.1 Dessin lisible, étiquette en ordre?',
      q22:'2.2 Paramètres de production fixés et respectés?',
      q23:'2.3 Planche de montage homologuée?',
      q24:'2.4 Équipement / machines en ordre?',
      q25:'2.5 Carte d\'enregistrement des données en ordre?',
      q26:'2.6 Ouvriers qualifiés?',
      q27:'2.7 Documents de production homologués?',
      q28:'2.8 Surfaces et caisses identifiées?',
      q29a:'2.9 Table de contrôle — entretien documenté?',
      q29b:'2.9 Table de contrôle — composants demandés?',
      q210:'2.10 Plan de contrôle actuel?',
      q211:'2.11 AMDEC processus existante et actuelle?',
      q212:'2.12 Plan de surveillance existant et actuel?',
    };
    const sections = {
      'q11':'1. Emballage et Identification',
      'q21':'2.0 Process assemblage',
    };
    let rows5 = '';
    let ri = 0;
    Object.entries(QLABELS).forEach(([key, label]) => {
      if (sections[key]) {
        rows5 += `<tr><td colspan="2" style="background:#EEF2F8;font-weight:800;color:#001F4E;padding:5px 10px;border:1px solid #E2E8F0;font-size:8pt">${sections[key]}</td></tr>`;
      }
      const val = q[key] || '';
      const isNok = val === 'Non';
      const bg = isNok ? '#FFF0F0' : ri%2===0 ? '#fff' : '#F8FAFC';
      const vc = val==='Oui'?'#059669':val==='Non'?'#DC2626':'#64748B';
      rows5 += `<tr style="background:${bg}">
        <td style="padding:5px 10px;border:1px solid #E2E8F0;font-size:8pt${isNok?';border-left:3px solid #DC2626':''}">${label}</td>
        <td style="padding:5px 10px;border:1px solid #E2E8F0;font-weight:700;color:${vc};text-align:center;width:80px">${val||''}</td>
      </tr>`;
      ri++;
    });
    html += `<table style="border-collapse:collapse;width:100%;font-size:8pt">
      <thead><tr><th style="${THL}">Question</th><th style="${TH};width:80px">Réponse</th></tr></thead>
      <tbody>${rows5}</tbody>
    </table>`;
    const nbNon = Object.values(q).filter(x=>x==='Non').length;
    if (nbNon > 0) html += `<p style="margin:6px 0 0;font-size:8pt;font-weight:700;color:#DC2626">⚠ ${nbNon} question${nbNon>1?'s':''} NON</p>`;
    return html;
  }

  /* ══════════════════════════════════════════════════════
     ANNEXE 6 — Fils & USS BMW/MN/OEM
  ══════════════════════════════════════════════════════ */
  if (typeLabel === '6') {
    html += infoGrid([
      {l:'N° dessin', val:fd.numDessin}, {l:'Famille', val:fd.famille},
      {l:'N° BMW/OEM', val:fd.numBMW},   {l:'Index', val:fd.index},
      {l:'Adresse', val:fd.adresse},     {l:'Bloc', val:fd.bloc},
    ]);
    html += secTitle('Mesures des fils — Sertissage');
    html += dataTable(fd.rows||[], [
      {k:'nrFil',   h:'Nr Fil',   w:45}, {k:'section', h:'Section', w:50},
      {k:'couleur', h:'Couleur',  w:50}, {k:'pin',     h:'Pin',     w:40},
      {k:'type',    h:'Type',     w:45}, {k:'contact', h:'Contact', w:55},
      {k:'ch',      h:'CH',       w:40}, {k:'chm',     h:'CHm',     w:40},
      {k:'cw',      h:'CW',       w:40}, {k:'cwm',     h:'CWm',     w:40},
      {k:'pf',      h:'PF',       w:40}, {k:'pfm',     h:'PFm',     w:40},
      {k:'resultat',h:'Résultat', w:60, isRes:true},
    ]);
    html += secTitle('Mesures USS — Force de pelage');
    html += dataTable(fd.ussRows||[], [
      {k:'nrFil',       h:'Nr Fil',          w:45},
      {k:'section',     h:'Section',         w:50},
      {k:'couleur',     h:'Couleur',         w:50},
      {k:'type',        h:'Type',            w:45},
      {k:'forcePelage', h:'Force pelage (N)',w:80},
      {k:'forceMesuree',h:'Force mesurée (N)',w:80},
      {k:'resultat',    h:'Résultat',        w:60, isRes:true},
    ]);
    return html;
  }

  /* ══════════════════════════════════════════════════════
     ANNEXE 7 — Dimensions & bandage BMW/AVW/MB
  ══════════════════════════════════════════════════════ */
  if (typeLabel === '7') {
    html += infoGrid([
      {l:'N° dessin', val:fd.numDessin}, {l:'Famille / TAB', val:fd.famille},
      {l:'N° BMW',    val:fd.numBMW},    {l:'Date', val:fd.date},
      {l:'Auditeur',  val:fd.auditeur},  {l:'Index', val:fd.index},
    ]);
    html += secTitle('Mesures dimensions & bandage', `${(fd.rows||[]).length} lignes`);
    html += dataTable(fd.rows||[], [
      {k:'pos',            h:'Pos.',              w:35},
      {k:'adresseBranche', h:'Adresse Branche',   align:'left', w:100},
      {k:'mesure',         h:'Mesure (mm)',        w:65},
      {k:'toleranceNeg',   h:'Tol. −',            w:45},
      {k:'tolerancePos',   h:'Tol. +',            w:45},
      {k:'valeurMesuree',  h:'Valeur mesurée',    w:75},
      {k:'resultat',       h:'Résultat',          w:60, isRes:true},
      {k:'typeBandage',    h:'Type bandage',      align:'left', w:80},
      {k:'resultatBandage',h:'Rés. bandage',      w:65, isRes:true},
      {k:'clipTie',        h:'Clip tie',          align:'left', w:60},
      {k:'resultatClip',   h:'Rés. clip',         w:55, isRes:true},
      {k:'exigenceClient', h:'Exigence client',   align:'left', w:90},
    ]);
    return html;
  }

  /* ══════════════════════════════════════════════════════
     ANNEXE 7A — Mesure Audi C-BEV
  ══════════════════════════════════════════════════════ */
  if (typeLabel === '7A') {
    html += infoGrid([
      {l:'Datum', val:fd.datum},      {l:'Projekt', val:fd.projekt},
      {l:'KSK Nr.', val:fd.kskNr},   {l:'TAB Nr.', val:fd.tabNr},
      {l:'Auditeur', val:fd.auditoren},
    ]);
    html += secTitle('Rapport de mesure', `${(fd.rows||[]).length} lignes`);
    const cols7A = [
      {k:'lfdNr',       h:'Nr.',    w:35},
      {k:'vonMBP',      h:'Von MBP',w:55}, {k:'vonVOBIS',  h:'Von VOBIS',w:55},
      {k:'xy',          h:'XY',     w:35},
      {k:'nachMBP',     h:'Nach MBP',w:55},{k:'nachVOBIS', h:'Nach VOBIS',w:55},
      {k:'xy2',         h:'XY',     w:35},
      {k:'fzgDerivate', h:'Fzg. Derivate',align:'left',w:80},
      {k:'lSoll',       h:'L Soll', w:50}, {k:'lIst',      h:'L Ist',    w:50},
      {k:'io',          h:'IO',     w:40, isRes:true},
      {k:'diff',        h:'Diff.',  w:40}, {k:'abweichungen',h:'Abw.',w:40},
      {k:'tolerances',  h:'Tol.',   w:40}, {k:'bemerkungen', h:'Bem.',align:'left',w:80},
    ];
    /* Ajouter colonnes mesures 1-19 dynamiquement */
    const rows7A = (fd.rows||[]).map(r => {
      const out = {...r};
      (r.mesures||[]).forEach((m,i) => { out[`m${i+1}`] = m; });
      return out;
    });
    const mesuresCols = Array.from({length:19},(_,i)=>({k:`m${i+1}`,h:`${i+1}`,w:28}));
    html += dataTable(rows7A, [...cols7A.slice(0,8), ...mesuresCols, ...cols7A.slice(8)], 'io');
    return html;
  }

  /* ══════════════════════════════════════════════════════
     ANNEXE 8 — Fils & Fils torsadés BMW
  ══════════════════════════════════════════════════════ */
  if (typeLabel === '8') {
    html += infoGrid([
      {l:'N° dessin', val:fd.numDessin}, {l:'Famille', val:fd.famille},
      {l:'N° BMW',    val:fd.numBMW},   {l:'Index', val:fd.index},
    ]);
    html += secTitle('Mesure section des fils');
    html += dataTable(fd.rows||[], [
      {k:'pos',                 h:'Pos',   w:35},
      {k:'nrFil',               h:'Nr Fil',w:45},
      {k:'couleur',             h:'Couleur',w:50},
      {k:'section',             h:'Section',w:50},
      {k:'type',                h:'Type',  w:45},
      {k:'nbrFibres',           h:'Nb fibres',w:55},
      {k:'sectionFibre',        h:'Section fibre',w:65},
      {k:'formule',             h:'Formule (d²·π/4)',w:80},
      {k:'sectionAvecIsolation',h:'Section avec ISO',w:80},
      {k:'resultat',            h:'Résultat',w:60, isRes:true},
    ]);
    html += secTitle('Fils torsadés');
    html += dataTable(fd.ussRows||[], [
      {k:'pos',              h:'Pos',     w:35},
      {k:'nrFil',            h:'Nr Fil',  w:45},
      {k:'couleur',          h:'Couleur', w:50},
      {k:'section',          h:'Section', w:50},
      {k:'nbrFils',          h:'Nb fils', w:50},
      {k:'pasTorsadage',     h:'Pas exigé',w:65},
      {k:'tolerance',        h:'Tolérance',w:60},
      {k:'pasTorsadageMesure',h:'Pas mesuré',w:65},
      {k:'mesureC1',         h:'Mesure C1',w:60},
      {k:'mesureC2',         h:'Mesure C2',w:60},
      {k:'resultat',         h:'Résultat', w:60, isRes:true},
    ]);
    return html;
  }

  /* ══════════════════════════════════════════════════════
     ANNEXE 10 — Traction Audi/VW
  ══════════════════════════════════════════════════════ */
  if (typeLabel === '10') {
    html += infoGrid([
      {l:'TAB', val:fd.tab}, {l:'Var', val:fd.var},
      {l:'Date dessin', val:fd.dateDessin}, {l:'Index', val:fd.index},
    ]);
    html += secTitle('Mesures de traction', `${(fd.rows||[]).length} lignes`);
    html += dataTable(fd.rows||[], [
      {k:'position',      h:'Pos.',        w:35},
      {k:'pin',           h:'Pin',         w:35},
      {k:'nrFil',         h:'Nr Fil',      w:45},
      {k:'couleur',       h:'Couleur',     w:50},
      {k:'section',       h:'Section',     w:50},
      {k:'type',          h:'Type',        w:45},
      {k:'nbrFibres',     h:'Nb fibres',   w:55},
      {k:'sectionFibre',  h:'Sect. fibre', w:60},
      {k:'sectionAvecIso',h:'Sect. ISO',   w:55},
      {k:'contact',       h:'Contact',     w:55},
      {k:'ch',            h:'CH',          w:35},
      {k:'cbm',           h:'CBm',         w:35},
      {k:'joint',         h:'Joint',       w:35},
      {k:'chISO',         h:'CH ISO',      w:45},
      {k:'cbISO',         h:'CB ISO',      w:45},
      {k:'fournisseur',   h:'Fournisseur', align:'left', w:70},
      {k:'forceTraction', h:'Ft exigée',   w:65},
      {k:'forceMesuree',  h:'Ft mesurée',  w:65},
      {k:'resultat',      h:'Résultat',    w:60, isRes:true},
    ]);
    return html;
  }

  /* ══════════════════════════════════════════════════════
     ANNEXE 11A — USS Pelage Audi/VW
  ══════════════════════════════════════════════════════ */
  if (typeLabel === '11A') {
    html += infoGrid([
      {l:'TAB', val:fd.tab}, {l:'Var', val:fd.var}, {l:'Index', val:fd.index},
    ]);
    html += secTitle('Mesures USS — Force de pelage', `${(fd.rows||[]).length} lignes`);
    html += dataTable(fd.rows||[], [
      {k:'adresseUSS',      h:'Adresse USS',       align:'left', w:90},
      {k:'nrFil',           h:'Nr Fil',            w:45},
      {k:'section',         h:'Section',           w:50},
      {k:'couleur',         h:'Couleur',           w:50},
      {k:'type',            h:'Type',              w:45},
      {k:'forcePelageMin',  h:'Force pelage min.',w:90},
      {k:'forcePelageMesuree',h:'Force mesurée', w:80},
      {k:'resultat',        h:'Résultat',          w:60, isRes:true},
    ]);
    return html;
  }

  /* ══════════════════════════════════════════════════════
     ANNEXE 11B — Torsadage Audi/VW/MN
  ══════════════════════════════════════════════════════ */
  if (typeLabel === '11B') {
    html += infoGrid([
      {l:'TAB', val:fd.tab}, {l:'Var', val:fd.var}, {l:'Index', val:fd.index},
    ]);
    html += secTitle('Mesures torsadage', `${(fd.rows||[]).length} lignes`);
    html += dataTable(fd.rows||[], [
      {k:'adresse',        h:'Adresse',       align:'left', w:80},
      {k:'nrFil',          h:'Nr Fil',        w:45},
      {k:'section',        h:'Section',       w:50},
      {k:'couleur',        h:'Couleur',       w:50},
      {k:'nbrFils',        h:'Nb fils',       w:45},
      {k:'pasTorsadage',   h:'Pas exigé',     w:65},
      {k:'pasMesure',      h:'Pas mesuré',    w:65},
      {k:'tolerance',      h:'Tolérance',     w:60},
      {k:'mesureC1',       h:'Mesure C1',     w:60},
      {k:'mesureC2',       h:'Mesure C2',     w:60},
      {k:'resultat',       h:'Résultat',      w:60, isRes:true},
    ]);
    return html;
  }

  /* ══════════════════════════════════════════════════════
     ANNEXE 11C — Torsadage Audi C-BEV
  ══════════════════════════════════════════════════════ */
  if (typeLabel === '11C') {
    html += infoGrid([
      {l:'TAB', val:fd.tab}, {l:'Var', val:fd.var}, {l:'Index', val:fd.index},
    ]);
    html += secTitle('Mesures torsadage C-BEV', `${(fd.rows||[]).length} lignes`);
    html += dataTable(fd.rows||[], [
      {k:'position',              h:'Pos.',       w:35},
      {k:'nrFil',                 h:'Nr Fil',     w:45},
      {k:'couleur',               h:'Couleur',    w:50},
      {k:'section',               h:'Section',    w:50},
      {k:'nbreFils',              h:'Nb fils',    w:45},
      {k:'pasTorsadageExige',     h:'Pas exigé',  w:65},
      {k:'pasTorsadageMesure',    h:'Pas mesuré', w:65},
      {k:'mesureC1',              h:'Mesure C1',  w:60},
      {k:'mesureC2',              h:'Mesure C2',  w:60},
      {k:'boutTorsadageC1',       h:'Bout C1',    w:55},
      {k:'boutTorsadageC2',       h:'Bout C2',    w:55},
      {k:'resultat',              h:'Résultat',   w:60, isRes:true},
    ]);
    return html;
  }

  /* ══════════════════════════════════════════════════════
     ANNEXES 13A/B/C/D — Audit Destructif
  ══════════════════════════════════════════════════════ */
  if (['13A','13B','13C','13D'].includes(typeLabel)) {
    html += infoGrid([
      {l:'N° article LEONI', val:fd.numArticleLEONI}, {l:'N° article BMW', val:fd.numArticleBMW},
      {l:'Fournisseur',      val:fd.fournisseur},     {l:'Index', val:fd.index},
      {l:'Audit planifié',   val:fd.auditPlanifie ? '✓ Oui' : ''},
      {l:'Audit non planifié',val:fd.auditNonPlanifie ? '✓ Oui' : ''},
    ]);
    /* Contrôles attributifs */
    const checks = fd.attributChecks || {};
    if (Object.keys(checks).length > 0) {
      html += secTitle('Résultats attributifs (IC 3040)');
      const checkEntries = Object.entries(checks);
      const tbody13 = checkEntries.map(([k,vv], ri) => {
        const s = String(vv||'');
        const isNok = s === 'NOK';
        const bg = isNok ? '#FFF0F0' : ri%2===0 ? '#fff' : '#F8FAFC';
        const vc = s==='Ok'?'#059669':s==='NOK'?'#DC2626':'#64748B';
        return `<tr style="background:${bg}">
          <td style="padding:5px 10px;border:1px solid #E2E8F0;font-size:8pt;font-weight:600;background:#F8FAFC;width:60%">${k.replace(/([A-Z])/g,' $1').trim()}</td>
          <td style="padding:5px 10px;border:1px solid #E2E8F0;font-weight:700;color:${vc};text-align:center">${s}</td>
        </tr>`;
      }).join('');
      html += `<table style="border-collapse:collapse;width:100%;font-size:8pt">
        <thead><tr><th style="${THL}">Critère</th><th style="${TH};width:80px">Résultat</th></tr></thead>
        <tbody>${tbody13}</tbody>
      </table>`;
    }
    if (fd.decisionGlobale) {
      const isNok = fd.decisionGlobale === 'NOK';
      html += `<div style="margin:8px 0;padding:7px 12px;background:${isNok?'#FFF0F0':'#ECFDF5'};
        border:1.5px solid ${isNok?'#DC2626':'#059669'};border-radius:5px;
        font-weight:700;font-size:9pt;color:${isNok?'#DC2626':'#059669'}">
        Décision globale : ${fd.decisionGlobale}</div>`;
    }
    html += secTitle('Rapport dimensionnel');
    html += dataTable(fd.dimRows||[], [
      {k:'nr',           h:'Nr.',          w:35},
      {k:'critere',      h:'Critère',      align:'left', w:120},
      {k:'specification',h:'Spécification',align:'left', w:100},
      {k:'echantillon',  h:'Échantillon',  w:70},
      {k:'decision',     h:'Décision',     w:65, isRes:true},
    ]);
    return html;
  }

  /* ══════════════════════════════════════════════════════
     ANNEXE PSA — Contrôle pièces PSA
  ══════════════════════════════════════════════════════ */
  if (typeLabel === 'PSA') {
    html += infoGrid([
      {l:'Fournisseur', val:fd.fournisseur}, {l:'Désignation', val:fd.designation},
      {l:'N° audit',    val:fd.numAudit},   {l:'Index', val:fd.index},
    ]);
    html += secTitle('Contrôle dimensionnel PSA', `${(fd.colonnes||[]).length} colonnes`);
    const colsPSA = fd.colonnes || [];
    if (colsPSA.length === 0) {
      html += `<p style="color:#94A3B8;font-style:italic;font-size:8pt">Aucune cotation saisie.</p>`;
    } else {
      const tbody_psa = colsPSA.map((col, ri) => {
        const isNok = col.jugement === 'Non conforme';
        const bg = isNok ? '#FFF0F0' : ri%2===0 ? '#fff' : '#F8FAFC';
        const jC = col.jugement==='Conforme'?'#059669':col.jugement==='Non conforme'?'#DC2626':'#C8982A';
        const messCells = (col.mesures||[]).slice(0,10).map(m => {
          const conf = m?.conforme;
          const mc = conf===false?'#DC2626':conf===true?'#059669':'#334155';
          return `<td style="padding:4px 5px;border:1px solid #E2E8F0;text-align:center;font-size:7.5pt;background:${bg};color:${mc}">${m?.valeur||''}</td>`;
        }).join('');
        return `<tr>
          <td style="padding:5px 7px;border:1px solid #E2E8F0;font-size:8pt;background:${bg};font-weight:600">${v(col.nom)}</td>
          <td style="padding:5px 7px;border:1px solid #E2E8F0;font-size:7.5pt;background:${bg}">${v(col.typCaracteristique)}</td>
          <td style="padding:5px 7px;border:1px solid #E2E8F0;font-size:8pt;background:${bg};text-align:center">${v(col.nominal)}</td>
          <td style="padding:5px 7px;border:1px solid #E2E8F0;font-size:8pt;background:${bg};text-align:center">${v(col.borneSup)}</td>
          <td style="padding:5px 7px;border:1px solid #E2E8F0;font-size:8pt;background:${bg};text-align:center">${v(col.borneInf)}</td>
          ${messCells}
          <td style="padding:5px 7px;border:1px solid #E2E8F0;font-size:8pt;font-weight:700;color:${jC};text-align:center">${col.jugement||''}</td>
          <td style="padding:5px 7px;border:1px solid #E2E8F0;font-size:7.5pt;background:${bg}">${v(col.commentaire)}</td>
        </tr>`;
      }).join('');
      const mesHeaders = Array.from({length:10},(_,i)=>`<th style="${TH};width:40px">R.${i+1}</th>`).join('');
      html += `<div style="overflow-x:auto"><table style="border-collapse:collapse;width:100%;font-size:8pt">
        <thead><tr>
          <th style="${THL}">Identification</th>
          <th style="${TH}">Type car.</th>
          <th style="${TH}">Nominal</th>
          <th style="${TH}">Borne+</th>
          <th style="${TH}">Borne−</th>
          ${mesHeaders}
          <th style="${TH};width:90px">Jugement</th>
          <th style="${THL}">Commentaire</th>
        </tr></thead>
        <tbody>${tbody_psa}</tbody>
      </table></div>`;
    }
    return html;
  }

  /* ══════════════════════════════════════════════════════
     ANNEXE DPE — Contrôle pièces DPE
  ══════════════════════════════════════════════════════ */
  if (typeLabel === 'DPE') {
    html += infoGrid([
      {l:'Fournisseur', val:fd.fournisseur}, {l:'Désignation', val:fd.designation},
      {l:'N° audit',    val:fd.numAudit},   {l:'Index', val:fd.index},
    ]);
    html += secTitle('Contrôle DPE', `${(fd.rows||[]).length} lignes`);
    const rowsDPE = fd.rows || [];
    if (rowsDPE.length === 0) {
      html += `<p style="color:#94A3B8;font-style:italic;font-size:8pt">Aucune ligne saisie.</p>`;
    } else {
      const tbody_dpe = rowsDPE.map((row, ri) => {
        const isNok = ['Non conforme','A Adapter'].includes(row.jugement);
        const bg = isNok ? '#FFF0F0' : ri%2===0 ? '#fff' : '#F8FAFC';
        const jC = row.jugement==='Conforme'?'#059669':isNok?'#DC2626':'#C8982A';
        const messCells = (row.mesures||[]).slice(0,5).map(m =>
          `<td style="padding:4px 5px;border:1px solid #E2E8F0;text-align:center;font-size:8pt;background:${bg}">${m||''}</td>`
        ).join('');
        return `<tr>
          <td style="padding:5px 7px;border:1px solid #E2E8F0;text-align:center;font-weight:700;background:#F8FAFC;font-size:8pt">${ri+1}</td>
          <td style="padding:5px 7px;border:1px solid #E2E8F0;font-size:7.5pt;background:${bg}">${v(row.typCaracteristique)}</td>
          <td style="padding:5px 7px;border:1px solid #E2E8F0;align:'left';font-size:8pt;background:${bg}">${v(row.identification)}</td>
          <td style="padding:5px 7px;border:1px solid #E2E8F0;text-align:center;font-size:8pt;background:${bg}">${v(row.normal)}</td>
          <td style="padding:5px 7px;border:1px solid #E2E8F0;text-align:center;font-size:8pt;background:${bg}">${v(row.tol1)}</td>
          <td style="padding:5px 7px;border:1px solid #E2E8F0;text-align:center;font-size:8pt;background:${bg}">${v(row.tol2)}</td>
          ${messCells}
          <td style="padding:5px 7px;border:1px solid #E2E8F0;font-weight:700;color:${jC};text-align:center;font-size:8pt">${row.jugement||''}</td>
          <td style="padding:5px 7px;border:1px solid #E2E8F0;font-size:7.5pt;background:${bg}">${v(row.commentaire)}</td>
        </tr>`;
      }).join('');
      const mesHeaders5 = Array.from({length:5},(_,i)=>`<th style="${TH};width:45px">M.${i+1}</th>`).join('');
      html += `<div style="overflow-x:auto"><table style="border-collapse:collapse;width:100%;font-size:8pt">
        <thead><tr>
          <th style="${TH};width:35px">N°</th>
          <th style="${TH}">Type car.</th>
          <th style="${THL}">Identification</th>
          <th style="${TH}">Normal</th>
          <th style="${TH}">Tol.+</th>
          <th style="${TH}">Tol.−</th>
          ${mesHeaders5}
          <th style="${TH};width:90px">Jugement</th>
          <th style="${THL}">Commentaire</th>
        </tr></thead>
        <tbody>${tbody_dpe}</tbody>
      </table></div>`;
    }
    return html;
  }

  /* ══════════════════════════════════════════════════════
     FALLBACK GÉNÉRIQUE — pour tout autre type d'annexe
     Affiche TOUS les champs scalaires + tous les tableaux
  ══════════════════════════════════════════════════════ */
  const SKIP = new Set(['id','annexeId','auditProduitId','typeAnnexe',
    'formValide','importe','ordreAffichage','fichierNom','fichierUrl',
    'createdAt','updatedAt','createdBy','updatedBy','__typename']);
  const fK = k => {
    const L = {tab:'TAB',serie:'Série',index:'Index',vehicleType:'Type véhicule',auditeur:'Auditeur',
      date:'Date',partDesc:'Part Description',identification:'Identification',drawingNo:'N° dessin',
      nbDefects:'Nb défauts',totalPoints:'Total pts',ratingFactor:'Rating factor',
      weightedPoints:'Weighted pts',nbComposants:'Nb composants',valeurQK:'Valeur QK',
      validateur1:'Validateur 1',validateur2:'Validateur 2',monthYear:'Mois/Année'};
    return L[k] || k.replace(/([A-Z])/g,' $1').replace(/_/g,' ').replace(/\b\w/g,c=>c.toUpperCase()).trim();
  };

  const entries = Object.entries(fd).filter(([k])=>!SKIP.has(k));
  const scalars = entries.filter(([,val])=>val===null||typeof val!=='object');
  const complex = entries.filter(([,val])=>val!==null&&typeof val==='object');

  if (scalars.length > 0) {
    const pairs = [];
    for (let i=0;i<scalars.length;i+=2) pairs.push(scalars.slice(i,i+2));
    html += `<table style="border-collapse:collapse;width:100%;margin-bottom:14px"><tbody>
      ${pairs.map(pair=>`<tr>
        <td style="padding:5px 10px;border:1px solid #E2E8F0;font-weight:600;color:#475569;background:#F8FAFC;width:20%;font-size:8.5pt">${fK(pair[0][0])}</td>
        <td style="padding:5px 10px;border:1px solid #E2E8F0;width:30%;font-size:8.5pt">${v(pair[0][1])}</td>
        ${pair[1]
          ? `<td style="padding:5px 10px;border:1px solid #E2E8F0;font-weight:600;color:#475569;background:#F8FAFC;width:20%;font-size:8.5pt">${fK(pair[1][0])}</td>
             <td style="padding:5px 10px;border:1px solid #E2E8F0;font-size:8.5pt">${v(pair[1][1])}</td>`
          : '<td style="border:1px solid #E2E8F0;background:#F8FAFC"></td><td style="border:1px solid #E2E8F0"></td>'}
      </tr>`).join('')}
    </tbody></table>`;
  }

  complex.forEach(([key, val]) => {
    const count = Array.isArray(val) ? `${val.length} ligne${val.length>1?'s':''}` : '';
    html += secTitle(fK(key), count);
    if (Array.isArray(val)) {
      if (val.length === 0) {
        html += `<p style="color:#94A3B8;font-style:italic;font-size:8pt;padding:4px 8px">Aucune ligne saisie.</p>`;
      } else if (val.every(r=>r===null||typeof r!=='object'||Array.isArray(r))) {
        html += val.map(vv=>`<span style="display:inline-block;margin:2px 3px;padding:2px 8px;background:#F1F5F9;border:1px solid #E2E8F0;font-size:8pt">${vv==null?'':String(vv)}</span>`).join('');
      } else {
        const objs = val.filter(r=>r&&typeof r==='object'&&!Array.isArray(r));
        const allKeys = [...new Set(objs.flatMap(r=>Object.keys(r)))].filter(k=>!SKIP.has(k));
        const thead = allKeys.map(k=>`<th style="${THL};min-width:50px">${fK(k)}</th>`).join('');
        const tbody = val.map((row,ri)=>{
          if (!row||typeof row!=='object'||Array.isArray(row))
            return `<tr><td colspan="${allKeys.length}" style="padding:4px 7px;border:1px solid #E2E8F0;font-size:8pt;color:#64748B;font-style:italic">${row==null?'':String(row)}</td></tr>`;
          const rk = allKeys.find(k=>['resultat','io','decision','jugement'].includes(k));
          const rval2 = rk?String(row[rk]??''):'';
          const isNok2 = NOK_SET.has(rval2);
          const bg2 = isNok2?'#FFF0F0':ri%2===0?'#fff':'#F8FAFC';
          const lb2 = isNok2?'border-left:3px solid #DC2626;':'';
          const cells = allKeys.map(k=>{
            const cv = row[k];
            let cell = '';
            if (cv===null||cv===undefined||cv==='') cell='';
            else if (typeof cv==='boolean') cell=cv?'<b style="color:#059669">✓</b>':'<span style="color:#94A3B8">✗</span>';
            else if (Array.isArray(cv)) cell=cv.filter(x=>x!=null).join(', ');
            else if (typeof cv==='object') cell=`<em style="font-size:7pt;color:#64748B">[obj]</em>`;
            else cell=['resultat','io','decision','jugement'].includes(k)?resSpan(String(cv)):String(cv).length>100?String(cv).substring(0,100)+'…':String(cv);
            return `<td style="padding:4px 7px;border:1px solid #E2E8F0;font-size:8pt;background:${bg2};${lb2}">${cell}</td>`;
          }).join('');
          return `<tr>${cells}</tr>`;
        }).join('');
        html += `<div style="overflow-x:auto"><table style="border-collapse:collapse;width:100%;font-size:8pt">
          <thead><tr>${thead}</tr></thead><tbody>${tbody}</tbody></table></div>`;
      }
    } else if (val&&typeof val==='object') {
      const ents = Object.entries(val).filter(([k])=>!SKIP.has(k));
      if (ents.every(([,vv])=>vv===null||typeof vv!=='object')) {
        html += `<table style="border-collapse:collapse;width:100%;font-size:8.5pt"><tbody>
          ${ents.map(([k,vv],i)=>{
            const s=vv==null?'':String(vv);
            const isNok2=NOK_SET.has(s);
            const bg=isNok2?'#FFF0F0':i%2===0?'#fff':'#F8FAFC';
            const vc=s==='Ok'||s==='Oui'?'#059669':isNok2?'#DC2626':'#1E293B';
            return `<tr style="background:${bg}">
              <td style="padding:5px 10px;border:1px solid #E2E8F0;font-weight:600;color:#475569;background:#F8FAFC;width:40%;font-size:8pt">${fK(k)}</td>
              <td style="padding:5px 10px;border:1px solid #E2E8F0;font-weight:${isNok2||OK_SET.has(s)?'700':'400'};color:${vc}">${s}</td>
            </tr>`;
          }).join('')}
        </tbody></table>`;
      }
    }
  });

  return html || `<p style="color:#94A3B8;font-style:italic;font-size:9pt">Aucune donnée affichable.</p>`;
}

/* ══════════════════════════════════════════════════════════
   GÉNÉRATEUR HTML DU RAPPORT
   Header : fond navy, logo LEONI blanc (comme original)
══════════════════════════════════════════════════════════ */
function buildReportHTML({ audit, annexes, qkValue, qkColor, ficheMeta, pdcaMeta, workflow, rapportImporteNom }) {
  const meta   = QK_META[qkColor] || QK_META.VERT;
  const now    = fmt(new Date().toISOString());
  const qkNum  = parseFloat(qkValue) || 0;
  const qkPct  = Math.min(100, (qkNum / 5) * 100);
  const normAnn = (annexes||[]).map(normalizeAnnexe);
  const okAnn  = normAnn.filter(a => a.complete);
  const r = 46, circ = +(2*Math.PI*r).toFixed(2), dash = +(circ-(qkPct/100)*circ).toFixed(2);

  const infoItems = [
    {l:'Référence audit',   v: audit?.reference   || '—'},
    {l:'Série / TAB',       v: audit?.serieNom     || '—'},
    {l:'Plant / Site',      v: audit?.plantNom     || '—'},
    {l:'Auditeur',          v: audit?.auditeurNom  || '—'},
    {l:"Date d'audit",      v: fmt(audit?.datePrevue)},
    {l:'Deadline',          v: fmt(audit?.deadline)},
    {l:'Nature',            v: audit?.natureAudit === 'DESTRUCTIF' ? 'Destructif' : 'Non-destructif'},
    {l:'Workflow',          v: workflow === 'RAPPORT' ? 'Import de rapport' : 'Remplissage des annexes en ligne'},
    ...(workflow==='RAPPORT'&&rapportImporteNom ? [{l:'Rapport importé', v: rapportImporteNom}] : []),
    {l:'Date de génération',v: now},
  ];
  const seen = new Set();
  const filtered = infoItems.filter(({v}) => {
    const k=(v||'').trim();
    if(!k||k==='—') return true;
    if(seen.has(k)) return false;
    seen.add(k); return true;
  });

  const totalPages = 2 + okAnn.length + (ficheMeta?1:0) + (pdcaMeta?1:0) + 1;

  const secs = [
    {n:1, t:'Page de garde',   d:"Identification de l'audit, résultat QK"},
    {n:2, t:'Sommaire',        d:'Table des matières du rapport'},
    ...okAnn.map((a,i) => ({n:3+i, t:`Annexe ${a.typeLabel}`, d:a.displayName})),
    ...(ficheMeta ? [{n:2+okAnn.length+1, t:'Fiche de Réparation', d:'Correction de non-conformité'}] : []),
    ...(pdcaMeta  ? [{n:2+okAnn.length+(ficheMeta?1:0)+1, t:"Plan d'Action PDCA", d:'Amélioration continue'}] : []),
    {n:totalPages, t:'Signatures & Visa', d:'Validation et approbation du rapport'},
  ];

  /* En-tête de page interne : bandeau navy + LEONI blanc */
  const pageHeader = (titre) => `
    <div style="background:#001F4E;margin:0 -13mm;padding:10px 18px;margin-bottom:16px;
      display:flex;align-items:center;justify-content:space-between">
      <div style="font-size:12pt;font-weight:700;color:#ffffff;
        font-family:Arial,sans-serif">${titre}</div>
      <div style="font-size:17pt;font-weight:900;color:#ffffff;
        letter-spacing:3px;font-family:Arial,sans-serif">LEONI</div>
    </div>`;

  const pageFooter = (section, pageNum) => `
    <div style="position:absolute;bottom:10mm;left:13mm;right:13mm;
      border-top:1px solid #CBD5E1;padding-top:5px;
      display:flex;justify-content:space-between;
      font-size:7pt;color:#94A3B8;font-family:Arial,sans-serif">
      <span>Audit Produit LEONI · Réf. ${audit?.reference||'—'}</span>
      <span>${section}</span>
      <span>Page ${pageNum} / ${totalPages}</span>
    </div>`;

  return `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"/>
<title>Rapport Audit ${audit?.reference||''}</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:'Segoe UI',Arial,sans-serif;font-size:10pt;color:#1E293B;background:#e5e7eb}
  .page{width:210mm;min-height:297mm;margin:0 auto 12px;
    padding:0 13mm 22mm;position:relative;background:#fff;overflow:hidden}
  .pb{page-break-before:always}
  @media print{
    body{background:#fff}
    .pb{page-break-before:always}
    body{-webkit-print-color-adjust:exact;print-color-adjust:exact}
  }
  table{border-collapse:collapse;width:100%}
  th,td{border:1px solid #CBD5E1;padding:5px 8px;font-size:8.5pt}
  th{background:#001F4E;color:#fff;font-weight:600;text-align:left}
</style></head><body>

<!-- PAGE 1 : GARDE — bandeau navy + logo LEONI blanc -->
<div class="page">
  <div style="background:#001F4E;margin:0 -13mm;padding:18px 22px;
    display:flex;align-items:center;justify-content:space-between;margin-bottom:20px">
    <div>
      <div style="font-size:28pt;font-weight:900;color:#ffffff;
        letter-spacing:3px;line-height:1;font-family:Arial,sans-serif">LEONI</div>
      <div style="font-size:8pt;color:rgba(255,255,255,.5);margin-top:3px">
        Rapport d'Audit Produit · Document Confidentiel</div>
    </div>
    <div style="text-align:right">
      <div style="font-size:8pt;color:rgba(255,255,255,.5)">${now}</div>
      <div style="font-size:8pt;color:rgba(255,255,255,.4)">IT TN 3625</div>
    </div>
  </div>

  <!-- Titre -->
  <div style="text-align:center;padding:14px 0 16px;border-bottom:1px solid ${BORDER};margin-bottom:18px">
    <div style="font-size:20pt;font-weight:800;color:${NAVY};line-height:1.2">
      Rapport d'Audit Produit</div>
    <div style="font-size:12pt;font-weight:600;color:${MUTED};margin-top:5px">
      ${audit?.reference||''}</div>
  </div>

  <!-- QK -->
  <div style="border:1.5px solid ${meta.bd};border-radius:6px;padding:14px 18px;
    display:flex;align-items:center;gap:18px;margin-bottom:18px;background:#fff">
    <svg width="100" height="100" viewBox="0 0 100 100" style="flex-shrink:0">
      <circle cx="50" cy="50" r="${r}" fill="none" stroke="#E2E8F0" stroke-width="8"/>
      <circle cx="50" cy="50" r="${r}" fill="none" stroke="${meta.color}" stroke-width="8"
        stroke-dasharray="${circ}" stroke-dashoffset="${dash}"
        stroke-linecap="round" transform="rotate(-90 50 50)"/>
      <text x="50" y="46" text-anchor="middle" fill="${meta.color}"
        font-size="20" font-weight="900" font-family="Arial">${qkNum.toFixed(1)}</text>
      <text x="50" y="60" text-anchor="middle" fill="#94A3B8"
        font-size="9" font-weight="700">QK</text>
    </svg>
    <div style="flex:1">
      <div style="font-size:7pt;font-weight:700;color:${meta.color};text-transform:uppercase;
        letter-spacing:.1em;margin-bottom:3px">Résultat Qualité · Table PI3010</div>
      <div style="font-size:15pt;font-weight:900;color:${meta.color};line-height:1.2">
        ${meta.emoji} ${meta.label}</div>
      <div style="font-size:9pt;color:${MUTED};margin-top:4px">${meta.action}</div>
    </div>
    <div style="background:${meta.color};color:#fff;border-radius:6px;
      padding:10px 16px;text-align:center;flex-shrink:0">
      <div style="font-size:7pt;opacity:.8;font-weight:600">QK INDEX</div>
      <div style="font-size:24pt;font-weight:900;line-height:1">${qkNum.toFixed(1)}</div>
    </div>
  </div>

  <!-- Identification -->
  <div style="border:1px solid ${BORDER};border-radius:6px;overflow:hidden">
    <div style="background:${NAVY};padding:8px 14px">
      <span style="font-size:9pt;font-weight:700;color:#fff;text-transform:uppercase;
        letter-spacing:.08em">Identification de l'Audit</span>
    </div>
    <table style="margin:0;border:none">
      <tbody>
        ${filtered.map(({l,v},i)=>`
          <tr style="background:${i%2===0?'#fff':'#F8FAFC'}">
            <td style="border:none;border-bottom:1px solid ${BORDER};
              border-right:1px solid ${BORDER};padding:7px 12px;
              font-weight:600;color:${SLATE};width:40%;font-size:8.5pt">${l}</td>
            <td style="border:none;border-bottom:1px solid ${BORDER};
              padding:7px 12px;color:#1E293B;font-size:8.5pt">${v}</td>
          </tr>`).join('')}
      </tbody>
    </table>
  </div>
  ${pageFooter('Page de garde', 1)}
</div>

<!-- PAGE 2 : SOMMAIRE -->
<div class="page pb">
  ${pageHeader('Sommaire')}
  <table style="margin-bottom:16px">
    <thead>
      <tr>
        <th style="width:35px;text-align:center">#</th>
        <th>Section</th>
        <th>Contenu</th>
        <th style="width:50px;text-align:center">Page</th>
      </tr>
    </thead>
    <tbody>
      ${secs.map((s,i)=>`
        <tr style="background:${i%2===0?'#fff':'#F8FAFC'}">
          <td style="text-align:center;font-weight:700;color:${NAVY}">${s.n}</td>
          <td style="font-weight:600">${s.t}</td>
          <td style="color:${MUTED};font-size:8pt">${s.d}</td>
          <td style="text-align:center;font-weight:700;color:${NAVY}">${s.n}</td>
        </tr>`).join('')}
    </tbody>
  </table>
  <div style="border:1px solid ${BORDER};border-radius:6px;padding:10px 14px;
    background:#F8FAFC;font-size:9pt;color:${SLATE};line-height:1.7">
    Ce rapport contient <strong>${okAnn.length} annexe(s)</strong> renseignée(s)
    avec l'intégralité des données saisies par l'auditeur.
    ${ficheMeta ? 'Fiche de réparation incluse. ' : ''}
    ${pdcaMeta  ? 'Plan PDCA inclus. ' : ''}
    Document confidentiel à usage interne LEONI.
  </div>
  ${pageFooter('Sommaire', 2)}
</div>

<!-- PAGES ANNEXES — snapshot complet : toutes lignes + colonnes -->
${okAnn.map((a, i) => {
  const pageNum = 3 + i;
  const snap = a.importe && !a.hasFormData
    ? `<div style="border:1px solid ${BORDER};border-radius:6px;padding:14px;
         background:#F8FAFC;color:${SLATE};font-size:9.5pt">
         <strong>Fichier importé :</strong> ${a.fichierNom||'—'}<br/>
         <span style="font-size:8.5pt;color:${MUTED}">
           Consultez le fichier original pour le contenu de cette annexe.</span>
       </div>`
    : snapshotAnnexe(a);
  return `
<div class="page pb">
  ${pageHeader(`Annexe ${a.typeLabel} — ${a.displayName}`)}
  ${snap}
  ${pageFooter(`Annexe ${a.typeLabel}`, pageNum)}
</div>`;
}).join('')}

<!-- FICHE DE RÉPARATION -->
${ficheMeta ? `
<div class="page pb">
  ${pageHeader('Fiche de Réparation')}
  <div style="border-left:4px solid #C8982A;padding:9px 14px;background:#FFFBEB;margin-bottom:14px">
    <div style="font-size:9pt;font-weight:700;color:#92400E">
      Correction de non-conformité · QK = ${qkNum.toFixed(2)}</div>
  </div>
  <table style="margin-bottom:14px">
    <tbody>
      ${[
        ['Zone affectée',  ficheMeta.zone||ficheMeta.zoneAffectee||'—'],
        ['Origine NC',     ficheMeta.origine||ficheMeta.origineNC||'—'],
        ['Code article',   ficheMeta.codeArticle||'—'],
        ['Description NC', ficheMeta.description||ficheMeta.descriptionNC||'—'],
        ['Remarques',      ficheMeta.remarques||ficheMeta.remarquesOptionnelles||'—'],
        ['Statut',         ficheMeta.valide ? '✓ Validée' : (ficheMeta.statut||'En attente')],
      ].map(([l,v],i)=>`
        <tr style="background:${i%2===0?'#fff':'#FFFBEB'}">
          <td style="font-weight:600;color:${SLATE};width:36%;border-right:2px solid #FED7AA">${l}</td>
          <td>${v}</td>
        </tr>`).join('')}
    </tbody>
  </table>
  ${pageFooter('Fiche de Réparation', 3 + okAnn.length)}
</div>` : ''}

<!-- PDCA -->
${pdcaMeta ? `
<div class="page pb">
  ${pageHeader("Plan d'Action PDCA")}
  <div style="border-left:4px solid #7C3AED;padding:9px 14px;background:#F5F3FF;margin-bottom:14px">
    <div style="font-size:9pt;font-weight:700;color:#6D28D9">
      Plan d'amélioration continue · QK = ${qkNum.toFixed(2)}
      ${pdcaMeta.dateEcheance?` · Échéance : ${fmtS(pdcaMeta.dateEcheance)}`:''}
    </div>
  </div>
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:14px">
    ${[
      {l:'P — Plan : Planifier',   c:'#1D4ED8',bg:'#EFF6FF',bd:'#BFDBFE',v:pdcaMeta.planifier},
      {l:'D — Do : Réaliser',      c:'#059669',bg:'#ECFDF5',bd:'#A7F3D0',v:pdcaMeta.do_},
      {l:'C — Check : Vérifier',   c:'#7C3AED',bg:'#F5F3FF',bd:'#DDD6FE',v:pdcaMeta.check},
      {l:'A — Act : Standardiser', c:'#C8982A',bg:'#FFFBEB',bd:'#FCD34D',v:pdcaMeta.act},
    ].map(p=>`
      <div style="border:1px solid ${p.bd};border-radius:5px;padding:11px;background:${p.bg}">
        <div style="font-size:7.5pt;font-weight:700;color:${p.c};
          text-transform:uppercase;letter-spacing:.07em;margin-bottom:5px">${p.l}</div>
        <div style="font-size:9pt;color:#1E293B;min-height:44px;line-height:1.6">
          ${p.v||'<em style="color:#94A3B8">Non renseigné</em>'}</div>
      </div>`).join('')}
  </div>
  ${pdcaMeta.statut
    ? `<div style="background:#F8FAFC;border:1px solid ${BORDER};border-radius:5px;
         padding:7px 12px;font-size:8.5pt"><strong>Statut :</strong> ${pdcaMeta.statut}</div>` : ''}
  ${pageFooter("Plan d'Action PDCA", 3 + okAnn.length + (ficheMeta?1:0))}
</div>` : ''}

<!-- SIGNATURES -->
<div class="page pb">
  ${pageHeader('Signatures & Visa de Validation')}
  <table style="margin-bottom:18px">
    <thead>
      <tr>
        <th>Rôle</th>
        <th>Nom & Prénom</th>
        <th style="width:90px;text-align:center">Date</th>
        <th style="width:150px;text-align:center">Signature</th>
      </tr>
    </thead>
    <tbody>
      ${[
        ['Auditeur Produit',             audit?.auditeurNom||''],
        ['Chef de Service',              ''],
        ['Responsable Qualité Plant',    ''],
        ['Responsable Qualité Centrale', ''],
        ['Approbateur Final',            ''],
      ].map(([role,nom],i)=>`
        <tr style="background:${i%2===0?'#fff':'#F8FAFC'}">
          <td style="font-weight:600;color:${SLATE}">${role}</td>
          <td>${nom}</td>
          <td style="background:#F8FAFC;height:44px"></td>
          <td style="background:#F8FAFC;border-left:1px solid ${BORDER}"></td>
        </tr>`).join('')}
    </tbody>
  </table>
  <div style="border:1px solid ${BORDER};border-radius:6px;padding:12px 16px;
    background:#F8FAFC;font-size:8.5pt;color:${MUTED};line-height:1.8">
    <strong style="color:#1E293B">Document Confidentiel — Usage Interne LEONI</strong><br/>
    Rapport généré automatiquement par la Plateforme d'Audit Produit LEONI.<br/>
    Généré le ${now} · Référence : ${audit?.reference||'—'}
  </div>
  ${pageFooter('Signatures & Visa — Document Final', totalPages)}
</div>

</body></html>`;
}

/* ══════════════════════════════════════════════════════════
   MODAL GÉNÉRATION RAPPORT
══════════════════════════════════════════════════════════ */
export function ReportGenerationModal({
  open, audit, annexes, qkValue, qkColor,
  ficheMeta, pdcaMeta, auditId, workflow, rapportImporteNom,
  onClose, onValidate,
}) {
  const [phase,    setPhase]   = useState('form');
  const [progress, setProgress]= useState(0);
  const [html,     setHtml]    = useState('');
  const [title,    setTitle]   = useState('');
  const [pdfUrlState, setPdfUrlState] = useState(null);
  const [pdfFileName, setPdfFileName] = useState(null);
  const iframeRef = useRef();
  const meta = QK_META[qkColor] || QK_META.VERT;

  useEffect(() => {
    if (open) { setPhase('form'); setProgress(0); setHtml('');
      setTitle(`Rapport Audit ${audit?.reference||auditId}`); setPdfUrlState(null); }
  }, [open, audit, auditId]);

  useEffect(() => {
    return () => {
      if (pdfUrlState) { try { window.URL.revokeObjectURL(pdfUrlState); } catch (e) { /* ignore */ } }
    };
  }, [pdfUrlState]);

  if (!open) return null;

  const handleGenerate = async () => {
    setPhase('generating'); setProgress(10);
    let ann = annexes || [];
    try {
      const res = await fetch(`${API}/audit-produit/${auditId}/annexes`, { headers: apiH() });
      if (res.ok) { const d = await res.json(); ann = Array.isArray(d)?d:(d?.content||ann); }
    } catch { /* utiliser props */ }
    setProgress(40);
    let ficheData = ficheMeta, pdcaData = pdcaMeta;
    try {
      if (!ficheData) {
        const fr = await fetch(`${API}/audit-produit/${auditId}/fiche-reparation`, { headers: apiH() });
        if (fr.ok) { const fd = await fr.json(); ficheData = Array.isArray(fd)&&fd.length?fd[0]:fd; }
      }
      if (!pdcaData) {
        const pr = await fetch(`${API}/audit-produit/${auditId}/pdca`, { headers: apiH() });
        if (pr.ok) { const pd = await pr.json(); pdcaData = Array.isArray(pd)&&pd.length?pd[0]:pd; }
      }
    } catch { /* ignorer */ }
    setProgress(70);
    const h = buildReportHTML({ audit, annexes: ann, qkValue, qkColor,
      ficheMeta: ficheData, pdcaMeta: pdcaData, workflow, rapportImporteNom });
    setHtml(h); setProgress(85);
    // Ask backend to generate PDF (returns stored PDF at /rapport-pdf)
    try {
      const genRes = await fetch(`${API}/audit-produit/${auditId}/generer-rapport`, {
        method: 'POST', headers: apiH(), body: JSON.stringify({ title, htmlContent: h }),
      });
      if (!genRes.ok) throw new Error(await genRes.text());
      // fetch the generated PDF and create object URL for preview
      const pdfRes = await fetch(`${API}/audit-produit/${auditId}/rapport-pdf`, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
      if (!pdfRes.ok) throw new Error('PDF non disponible (' + pdfRes.status + ')');
      const blob = await pdfRes.blob();
      const objectUrl = window.URL.createObjectURL(blob);
      setPdfUrlState(objectUrl);
      setProgress(100);
      setTimeout(() => setPhase('preview'), 200);
    } catch (e) {
      console.error('Erreur génération PDF preview:', e);
      // fallback to HTML preview
      setProgress(100);
      setTimeout(() => setPhase('preview'), 200);
    }
  };

  const handlePrint = () => {
    const w = window.open('', '_blank', 'width=940,height=720');
    w.document.write(html); w.document.close();
    setTimeout(() => { w.focus(); w.print(); }, 600);
  };

  const handleValidate = async () => {
    setPhase('generating'); setProgress(30);
    try {
      setProgress(65);
      const res = await fetch(`${API}/audit-produit/${auditId}/generer-rapport`, {
        method: 'POST', headers: apiH(), body: JSON.stringify({ title, htmlContent: html }),
      });
      setProgress(100);
      if (!res.ok) throw new Error(await res.text());
      setPhase('validated'); onValidate && onValidate(await res.json());
    } catch(e) { setPhase('preview'); alert('Erreur : ' + e.message); }
  };

  return (
    <div style={overlay}>
      <style>{CSS}</style>
      <div style={{ background:'#fff', borderRadius:16, width:'97vw',
        maxWidth: phase==='preview' ? 1150 : 540,
        maxHeight:'94vh', display:'flex', flexDirection:'column',
        boxShadow:'0 40px 100px rgba(0,0,0,.4)', overflow:'hidden',
        animation:'popIn .22s ease', transition:'max-width .3s ease' }}>

        {/* Header navy + LEONI blanc */}
        <div style={{ background:NAVY, padding:'13px 20px', display:'flex',
          alignItems:'center', justifyContent:'space-between', flexShrink:0 }}>
          <div style={{display:'flex', alignItems:'center', gap:14}}>
            <div style={{fontSize:18, fontWeight:900, color:'#fff', letterSpacing:'2px',
              fontFamily:'Arial,sans-serif'}}>LEONI</div>
            <div style={{borderLeft:'1px solid rgba(255,255,255,.2)', paddingLeft:12}}>
              <div style={{fontWeight:700, color:'#fff', fontSize:13}}>
                {phase==='form'       ? 'Préparer le Rapport'   :
                 phase==='generating' ? 'Génération en cours…'  :
                 phase==='preview'    ? 'Aperçu du Rapport PDF'  : '✓ Rapport Enregistré'}
              </div>
              <div style={{fontSize:11, color:'rgba(255,255,255,.5)', marginTop:1}}>
                {audit?.reference}</div>
            </div>
          </div>
          {phase !== 'generating' && (
            <button onClick={onClose} style={{ background:'rgba(255,255,255,.12)',
              border:'1px solid rgba(255,255,255,.2)', borderRadius:7,
              width:30, height:30, cursor:'pointer', color:'#fff',
              display:'flex', alignItems:'center', justifyContent:'center', fontSize:15 }}>✕</button>
          )}
        </div>

        {/* FORM */}
        {phase === 'form' && (
          <div style={{padding:'20px 24px', overflowY:'auto', flex:1}}>
            <div style={{border:`1.5px solid ${meta.bd}`, borderRadius:9,
              padding:'11px 16px', marginBottom:16,
              display:'flex', alignItems:'center', gap:12}}>
              <div style={{width:40, height:40, borderRadius:8, background:meta.color,
                display:'flex', alignItems:'center', justifyContent:'center',
                color:'#fff', fontWeight:900, fontSize:15, flexShrink:0}}>
                {parseFloat(qkValue||0).toFixed(1)}</div>
              <div>
                <div style={{fontWeight:700, color:meta.color, fontSize:13}}>{meta.label}</div>
                <div style={{fontSize:11, color:MUTED, marginTop:2}}>
                  {(annexes||[]).map(normalizeAnnexe).filter(a=>a.complete).length} / {(annexes||[]).length} annexes
                  {ficheMeta?' · Fiche':''}{pdcaMeta?' · PDCA':''}
                </div>
              </div>
            </div>
            <div style={{marginBottom:14}}>
              <label style={{display:'block', fontSize:11, fontWeight:600, color:MUTED,
                textTransform:'uppercase', letterSpacing:'.07em', marginBottom:5}}>
                Titre du rapport</label>
              <input value={title} onChange={e=>setTitle(e.target.value)}
                style={{width:'100%', padding:'9px 12px', borderRadius:7,
                  border:`1.5px solid ${BORDER}`, fontSize:13, fontFamily:'inherit', outline:'none'}}/>
            </div>
            <div style={{border:`1px solid ${BORDER}`, borderRadius:7, padding:'10px 14px',
              marginBottom:18, background:'#F8FAFC', fontSize:11, color:SLATE, lineHeight:1.6}}>
              Chaque annexe est reproduite intégralement : toutes les lignes et toutes les colonnes
              du formulaire, exactement comme l'auditeur les a remplies.
            </div>
            <div style={{display:'flex', gap:10}}>
              <button onClick={onClose} style={{padding:'9px 14px', borderRadius:7,
                border:`1.5px solid ${BORDER}`, background:'#fff', cursor:'pointer',
                fontWeight:600, fontSize:13, flex:1}}>Annuler</button>
              <button onClick={handleGenerate} style={{padding:'9px 18px', borderRadius:7,
                border:'none', background:NAVY, color:'#fff',
                fontWeight:700, fontSize:13, cursor:'pointer', flex:2}}>
                Générer le Rapport PDF
              </button>
            </div>
          </div>
        )}

        {/* GENERATING */}
        {phase === 'generating' && (
          <div style={{padding:'44px 30px', display:'flex', flexDirection:'column',
            alignItems:'center', justifyContent:'center', flex:1, gap:20}}>
            <div style={{width:52, height:52, borderRadius:14, background:'#F0F4FF',
              border:'2px solid #BFDBFE', display:'flex', alignItems:'center', justifyContent:'center'}}>
              <div style={{width:26, height:26, border:'3px solid #BFDBFE',
                borderTopColor:NAVY, borderRadius:'50%', animation:'spin .7s linear infinite'}}/>
            </div>
            <div style={{textAlign:'center'}}>
              <div style={{fontWeight:700, fontSize:14, color:'#1E293B', marginBottom:4}}>
                {progress < 50 ? 'Chargement des données…' : progress < 80 ? 'Construction du rapport…' : 'Finalisation…'}
              </div>
              <div style={{fontSize:11, color:MUTED}}>Snapshot complet des annexes…</div>
            </div>
            <div style={{width:'100%', maxWidth:280}}>
              <div style={{height:4, borderRadius:99, background:'#E2E8F0', overflow:'hidden'}}>
                <div style={{height:'100%', width:`${progress}%`, background:NAVY,
                  borderRadius:99, transition:'width .3s ease'}}/>
              </div>
              <div style={{textAlign:'center', fontSize:11, fontWeight:600, color:NAVY, marginTop:5}}>
                {progress}%</div>
            </div>
          </div>
        )}

        {/* PREVIEW */}
        {phase === 'preview' && html && (
          <div style={{display:'flex', flex:1, overflow:'hidden', flexDirection:'column'}}>
            <div style={{background:'#F8FAFC', borderBottom:`1px solid ${BORDER}`,
              padding:'8px 14px', display:'flex', alignItems:'center', gap:8, flexShrink:0}}>
              <div style={{flex:1, fontSize:12, fontWeight:600, color:'#1E293B'}}>📄 {title}</div>
              <button onClick={handlePrint} style={{padding:'5px 11px', borderRadius:6,
                border:`1px solid ${BORDER}`, background:'#fff', color:SLATE,
                fontWeight:600, fontSize:11, cursor:'pointer'}}>🖨 Imprimer / PDF</button>
              <button onClick={()=>setPhase('form')} style={{padding:'5px 11px', borderRadius:6,
                border:`1px solid ${BORDER}`, background:'#fff', color:MUTED,
                fontWeight:600, fontSize:11, cursor:'pointer'}}>← Modifier</button>
              <button onClick={handleValidate} style={{padding:'5px 14px', borderRadius:6,
                border:'none', background:'#059669', color:'#fff',
                fontWeight:700, fontSize:11, cursor:'pointer'}}>✓ Valider</button>
            </div>
            <div style={{flex:1, overflow:'hidden', background:'#9CA3AF',
              padding:8, display:'flex', justifyContent:'center'}}>
              {pdfUrlState ? (
                <iframe ref={iframeRef} src={pdfUrlState}
                  style={{width:'100%', height:'100%', border:'none', borderRadius:5, boxShadow:'0 4px 20px rgba(0,0,0,.15)', minHeight:540}}
                  title="Aperçu PDF"/>
              ) : (
                <iframe ref={iframeRef} srcDoc={html}
                  style={{width:'100%', height:'100%', border:'none', borderRadius:5, boxShadow:'0 4px 20px rgba(0,0,0,.15)', minHeight:540}}
                  title="Aperçu"/>
              )}
            </div>
          </div>
        )}

        {/* VALIDATED */}
        {phase === 'validated' && (
          <div style={{padding:'44px 30px', display:'flex', flexDirection:'column',
            alignItems:'center', justifyContent:'center', flex:1, gap:16,
            animation:'fadeUp .3s ease'}}>
            <div style={{width:60, height:60, borderRadius:'50%', background:'#ECFDF5',
              border:'3px solid #A7F3D0', display:'flex', alignItems:'center', justifyContent:'center'}}>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none"
                stroke="#059669" strokeWidth="2.5" strokeLinecap="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </div>
            <div style={{textAlign:'center'}}>
              <div style={{fontWeight:800, fontSize:18, color:'#059669', marginBottom:6}}>
                Rapport Enregistré !</div>
              <div style={{fontSize:12, color:MUTED, lineHeight:1.7}}>
                Le rapport avec le snapshot complet de toutes les annexes est enregistré.</div>
            </div>
            <button onClick={onClose} style={{padding:'11px 28px', borderRadius:10,
              border:'none', background:NAVY, color:'#fff', fontWeight:700,
              fontSize:14, cursor:'pointer'}}>Fermer & Terminer</button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   CARTE D'IDENTITÉ AUDIT
══════════════════════════════════════════════════════════ */
export function AuditIdentityCard({ audit, annexes, qkValue, qkColor, ficheMeta, pdcaMeta, rapportGenere, auditId, rapportNom, rapportDate, onClose, fullBleed=false }) {
  const derivedQkColor = (() => {
    const n = parseFloat(qkValue);
    if (!Number.isFinite(n)) return qkColor || 'VERT';
    if (n === 0) return 'VERT';
    if (n <= 0.5) return 'ORANGE';
    if (n <= 1) return 'ROSE';
    return 'ROUGE';
  })();
  const meta    = QK_META[derivedQkColor] || QK_META.VERT;
  const qkNum   = parseFloat(qkValue) || 0;
  const ficheRequired = ['ORANGE', 'ROSE', 'ROUGE'].includes(derivedQkColor);
  const pdcaRequired  = ['ROSE', 'ROUGE'].includes(derivedQkColor);
  const normAnn = (annexes||[]).map(normalizeAnnexe);
  const okCount = normAnn.filter(a=>a.complete).length;
  const r = 36, circ = +(2*Math.PI*r).toFixed(2),
    dash = +(circ-(Math.min(100,(qkNum/5)*100)/100)*circ).toFixed(2);
  const stMap = {
    PLANIFIE:{l:'Planifié',c:'#1D4ED8',bg:'#DBEAFE'},
    EN_COURS:{l:'En cours',c:'#B45309',bg:'#FEF9C3'},
    TERMINE: {l:'Terminé', c:'#15803D',bg:'#DCFCE7'},
    ANNULE:  {l:'Annulé',  c:'#6B7280',bg:'#F3F4F6'},
  };
  const stCfg = stMap[audit?.statut] || stMap.PLANIFIE;
  const id = auditId || audit?.id;
  const pdfUrl = id ? `${API}/audit-produit/${id}/rapport-pdf` : '';
  const reportDateValue = rapportDate || audit?.rapportGenereDate || audit?.dateRealisation || audit?.datePrevue || null;
  const audNomRaw = (audit?.auditeurNom || 'auditeur').toString().trim();
  const refRaw = (audit?.reference || id || 'ref').toString().trim();
  const audNom = audNomRaw.replace(/[^a-zA-Z0-9]+/g, '_');
  const refNom = refRaw.replace(/[^a-zA-Z0-9]+/g, '_');
  const dateNom = reportDateValue ? new Date(reportDateValue).toISOString().slice(0,10) : new Date().toISOString().slice(0,10);
  let reportFileName = `Rapport_Auditproduit_${audNom}_${refNom}_${dateNom}.pdf`;
  const handleView = () => { if (pdfUrl) viewPdfWithAuth(pdfUrl); };
  const handleDl   = () => {
    if (!pdfUrl) return;
    downloadPdfWithAuth(`${pdfUrl}?download=true`, reportFileName);
  };

  const ficheValid = !!ficheMeta?.valide || ficheMeta?.statut === 'VALIDEE';
  const pdcaResolved = pdcaMeta?.statut === 'RESOLU' || pdcaMeta?.statut === 'FERME';

  return (
    <div style={{position:'relative', background:'#fff', borderRadius: fullBleed ? 0 : 14, overflow:'hidden',
      border:`1px solid ${BORDER}`, boxShadow:'0 4px 24px rgba(0,0,0,.09)',
      width:'100%', height:'100%', display:'flex', flexDirection:'column', fontFamily:"'Segoe UI',Arial,sans-serif"}}>
      <style>{CSS}</style>

      {onClose && (
        <button onClick={onClose} aria-label="Fermer" style={{position:'absolute', top:12, right:12, zIndex:10, width:36, height:36, borderRadius:99, border:'none', background:'rgba(0,0,0,.6)', color:'#fff', cursor:'pointer', fontSize:16, fontWeight:800}}>✕</button>
      )}

      <div style={{background:NAVY, color:'#fff', padding:'12px 16px', display:'flex', alignItems:'center', gap:12}}>
        <div style={{fontWeight:900, fontSize:26, letterSpacing:1, marginLeft:0}}>LEONI</div>
        <div style={{opacity:0.95, fontWeight:700, marginLeft:12, fontSize:14}}>{audit?.reference || id || ''}</div>
      </div>

      <div style={{padding:'16px 22px', display:'grid',
        gridTemplateColumns:'1fr auto', gap:18, alignItems:'start', flex:1, overflow:'auto'}}>
        <div>
          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8, marginBottom:14}}>
            {[
              {l:'Série / TAB',  v:audit?.serieNom||'—'},
              {l:'Plant / Site', v:audit?.plantNom||'—'},
              {l:'Auditeur',     v:audit?.auditeurNom||'—'},
              {l:"Date d'audit", v:fmtS(audit?.datePrevue)},
              {l:'Deadline',     v:fmtS(audit?.deadline)},
              {l:'Nature',       v:audit?.natureAudit==='DESTRUCTIF'?'Destructif':'Non-destructif'},
            ].map(({l,v})=>(
              <div key={l} style={{background:'#F8FAFC', borderRadius:8,
                padding:'8px 10px', border:`1px solid ${BORDER}`}}>
                <div style={{fontSize:7, fontWeight:700, color:MUTED,
                  textTransform:'uppercase', letterSpacing:'.07em', marginBottom:2}}>{l}</div>
                <div style={{fontSize:11, fontWeight:700, color:NAVY,
                  overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>{v}</div>
              </div>
            ))}
          </div>
          <div style={{marginBottom:12}}>
            <div style={{display:'flex', justifyContent:'space-between', marginBottom:4}}>
              <span style={{fontSize:10, fontWeight:600, color:MUTED}}>Annexes renseignées</span>
              <span style={{fontSize:10, fontWeight:700,
                color:okCount===normAnn.length?'#059669':'#C8982A'}}>
                {okCount} / {normAnn.length}</span>
            </div>
            <div style={{height:5, borderRadius:99, background:'#E2E8F0', overflow:'hidden'}}>
              <div style={{height:'100%',
                width:`${normAnn.length?(okCount/normAnn.length)*100:0}%`,
                background:okCount===normAnn.length?'#059669':'#C8982A', borderRadius:99}}/>
            </div>
          </div>
          <div style={{display:'flex', flexWrap:'wrap', gap:6}}>
            <span style={{padding:'4px 10px', borderRadius:99, background:meta.bg,
              border:`1px solid ${meta.bd}`, fontSize:10, fontWeight:600, color:meta.color}}>
              {meta.emoji} {meta.label}</span>
            {ficheMeta && <span style={{padding:'4px 10px', borderRadius:99,
              background:ficheMeta.valide?'#ECFDF5':'#FFFBEB',
              border:`1px solid ${ficheMeta.valide?'#A7F3D0':'#FCD34D'}`,
              fontSize:10, fontWeight:600, color:ficheMeta.valide?'#059669':'#C8982A'}}>
              🔧 Fiche {ficheMeta.valide?'validée':'en attente'}</span>}
            {pdcaMeta && <span style={{padding:'4px 10px', borderRadius:99,
              background:'#F5F3FF', border:'1px solid #DDD6FE',
              fontSize:10, fontWeight:600, color:'#7C3AED'}}>
              🔄 PDCA {pdcaMeta.statut||'envoyé'}</span>}
          </div>
        </div>
        <div style={{display:'flex', flexDirection:'column', alignItems:'center',
          gap:10, minWidth:130}}>
          <svg width="96" height="96" viewBox="0 0 84 84">
            <circle cx="42" cy="42" r={r} fill="none" stroke="#E2E8F0" strokeWidth="7"/>
            <circle cx="42" cy="42" r={r} fill="none" stroke={meta.color} strokeWidth="7"
              strokeDasharray={circ} strokeDashoffset={dash}
              strokeLinecap="round" transform="rotate(-90 42 42)"/>
            <text x="42" y="39" textAnchor="middle" fill={meta.color}
              fontSize="15" fontWeight="900" fontFamily="Arial">{qkNum.toFixed(1)}</text>
            <text x="42" y="52" textAnchor="middle" fill="#94A3B8"
              fontSize="8" fontWeight="600">QK</text>
          </svg>
          <div style={{textAlign:'center', padding:'7px 10px', background:meta.bg,
            borderRadius:8, border:`1px solid ${meta.bd}`, width:'100%'}}>
            <div style={{fontSize:7, fontWeight:700, color:meta.color,
              textTransform:'uppercase', letterSpacing:'.06em', marginBottom:2}}>Verdict</div>
            <div style={{fontSize:10, fontWeight:700, color:meta.color}}>{meta.label}</div>
          </div>
        </div>
      </div>

      {(ficheRequired || pdcaRequired || ficheMeta || pdcaMeta) && (
        <div style={{padding:'0 22px 18px'}}>
          <div style={{fontSize:11, fontWeight:800, color:'#334155', textTransform:'uppercase', letterSpacing:'.08em', marginBottom:8}}>
            Validation corrective
          </div>
          <div style={{display:'grid', gridTemplateColumns: ficheRequired && pdcaRequired ? '1fr 1fr' : '1fr', gap:10}}>
            {ficheRequired && (
              <div style={{background: ficheValid ? '#ECFDF5' : '#FFFBEB', border:`1px solid ${ficheValid ? '#A7F3D0' : '#FCD34D'}`,
                borderRadius:12, padding:'10px 12px', minWidth:0}}>
                <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', gap:8, marginBottom:6}}>
                  <div style={{fontSize:11, fontWeight:800, color: ficheValid ? '#059669' : '#B45309'}}>Fiche de réparation</div>
                  <span style={{fontSize:10, fontWeight:700, color: ficheValid ? '#059669' : '#B45309'}}>
                    {ficheValid ? 'Validée' : 'En attente'}
                  </span>
                </div>
                <div style={{fontSize:11, color:'#334155', lineHeight:1.5}}>
                  {ficheValid
                    ? 'La fiche a été validée par le responsable.'
                    : 'La fiche est requise pour ce niveau de QK et attend la validation.'}
                </div>
              </div>
            )}
            {pdcaRequired && (
              <div style={{background: pdcaResolved ? '#F0FDF4' : '#F5F3FF', border:`1px solid ${pdcaResolved ? '#BBF7D0' : '#DDD6FE'}`,
                borderRadius:12, padding:'10px 12px', minWidth:0}}>
                <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', gap:8, marginBottom:6}}>
                  <div style={{fontSize:11, fontWeight:800, color: pdcaResolved ? '#059669' : '#7C3AED'}}>Plan d'action PDCA</div>
                  <span style={{fontSize:10, fontWeight:700, color: pdcaResolved ? '#059669' : '#7C3AED'}}>
                    {pdcaResolved ? 'Résolu' : 'En attente'}
                  </span>
                </div>
                <div style={{fontSize:11, color:'#334155', lineHeight:1.5}}>
                  {pdcaResolved
                    ? 'Le PDCA est clôturé.'
                    : 'Le PDCA est requis pour cette criticité et attend la résolution.'}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <div style={{borderTop:`1px solid ${BORDER}`, padding:'12px 22px', background:'#F8FAFC', display:'flex', gap:12, alignItems:'center', justifyContent:'space-between', flexWrap:'wrap'}}>
        <div style={{display:'flex', flexDirection:'column', gap:2, minWidth:0}}>
          <div style={{fontWeight:900, color:'#2563EB', fontSize:13, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>{reportFileName}</div>
          <div style={{fontSize:11, color:'#6B7280'}}>{reportDateValue ? fmtS(reportDateValue) : '—'}</div>
        </div>

        <div style={{display:'flex', gap:8, marginLeft:'auto'}}>
          <button onClick={handleView} style={{display:'inline-flex', alignItems:'center', gap:8, padding:'7px 14px', borderRadius:7, border:'2px solid #BFDBFE', background:'#EFF6FF', color:'#2563EB', cursor:'pointer', fontWeight:600, fontSize:12}}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0}}>
              <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
            Voir le rapport
          </button>
          <button onClick={handleDl} style={{padding:'7px 14px', borderRadius:7, border:'none', background:NAVY, color:'#fff', cursor:'pointer', fontWeight:600, fontSize:12}}>⬇ Télécharger PDF</button>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   DRAWER DÉTAIL
══════════════════════════════════════════════════════════ */
export function AuditDetailDrawer({ auditId, open, onClose }) {
  const [audit,setAudit]=useState(null);
  const [annexes,setAnnexes]=useState([]);
  const [fiche,setFiche]=useState(null);
  const [pdca,setPdca]=useState(null);
  const [loading,setLoading]=useState(false);

  const load = useCallback(async () => {
    if(!auditId||!open) return; setLoading(true);
    try {
      const [a,ann,f,p] = await Promise.all([
        fetch(`${API}/audit-produit/${auditId}`,{headers:apiH()}).then(r=>r.json()),
        fetch(`${API}/audit-produit/${auditId}/annexes`,{headers:apiH()}).then(r=>r.json()).catch(()=>[]),
        fetch(`${API}/audit-produit/${auditId}/fiche-reparation`,{headers:apiH()}).then(r=>r.json()).catch(()=>[]),
        fetch(`${API}/audit-produit/${auditId}/pdca`,{headers:apiH()}).then(r=>r.json()).catch(()=>[]),
      ]);
      setAudit(a); setAnnexes(Array.isArray(ann)?ann:[]);
      // pick active record: prefer validated / resolved entries when present
      const pickActive = (arr, predicate) => {
        if (!Array.isArray(arr) || arr.length === 0) return null;
        return arr.find(predicate) || arr[0];
      };
      const isFicheValidated = fiche => (
        fiche?.valide === true
        || fiche?.valideChef === true && fiche?.valideExpert === true
        || fiche?.valideParChef === true && fiche?.valideParExpert === true
        || fiche?.statut === 'VALIDEE'
      );
      const isPdcaResolved = pdca => pdca?.statut === 'RESOLU' || pdca?.statut === 'FERME';
      setFiche(pickActive(f, isFicheValidated));
      setPdca(pickActive(p, isPdcaResolved));
    } catch(e){ console.error(e); }
    setLoading(false);
  },[auditId,open]);

  useEffect(()=>{ load(); },[load]);
  if(!open) return null;

  return (
    <div style={overlay}>
      <style>{CSS}</style>
      <div style={{background:'#fff', borderRadius:16, width:'96vw', maxWidth:860,
        maxHeight:'93vh', display:'flex', flexDirection:'column',
        boxShadow:'0 32px 80px rgba(0,0,0,.3)', overflow:'hidden', animation:'popIn .22s ease'}}>
        <div style={{overflowY:'auto', flex:1, padding:0}}>
          {loading
            ? <div style={{display:'flex', alignItems:'center', justifyContent:'center',
                minHeight:260, gap:12, color:MUTED}}>
                <div style={{width:24, height:24, border:'3px solid #E2E8F0',
                  borderTopColor:NAVY, borderRadius:'50%', animation:'spin .7s linear infinite'}}/>
                Chargement…
              </div>
            : audit
                ? <AuditIdentityCard audit={audit} annexes={annexes}
                  qkValue={audit.valeurQK??0} qkColor={audit.couleurQK||'VERT'}
                  ficheMeta={fiche} pdcaMeta={pdca}
                  rapportGenere={audit.rapportGenere} auditId={auditId} onClose={onClose} fullBleed={true} />
              : <div style={{textAlign:'center', padding:'3rem', color:MUTED}}>
                  Audit introuvable.</div>
          }
        </div>
      </div>
    </div>
  );
}

export default function AuditReportSystemDemo() { return null; }