/**
 * AuditeurAuditsPage.jsx — LEONI PAP
 * ────────────────────────────────────
 * MODIFICATIONS Sprint 3+ :
 *  ✓ Audit EN_RETARD → bouton "Commencer/Continuer" ACTIF (rouge pour indiquer l'urgence)
 *  ✓ Bouton "⏱ Demander du temps" reste disponible pour les audits EN_RETARD
 *  ✓ Clic "Demander du temps" → ouvre DemandeTempsModal
 *  ✓ Clic "Voir détail" sur audit TERMINÉ → ouvre AuditDetailDrawer
 *  ✓ NOUVEAU : Auto-planification Règle Plate / Mètre Ruban / Magasin Export par l'auditeur
 */
import CreerReglePlateAuditeurModal from './CreerReglePlateAuditeurModal';
import CreerExportAuditeurModal from './CreerExportAuditeurModal';
import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { auditProduitAPI, auditSpecialAPI, auditeurAPI } from '../../services/api';
import { AuditDetailDrawer } from './AuditReportSystem';
import DemandeTempsModal from '../../components/DemandeTempsModal';

/* ─── Design tokens ─── */
const T = {
  navy:'#0B1E3D', blue:'#1D4ED8', blueL:'#cedbed', blueB:'#b3ceee',
  g50:'#F8FAFC', g100:'#F1F5F9', g200:'#E2E8F0', g300:'#CBD5E1',
  g400:'#94A3B8', g500:'#64748B', g700:'#1E293B', g800:'#0F172A',
  success:'#059669', successBg:'#ECFDF5', successBd:'#A7F3D0',
  warn:'#D97706',   warnBg:'#FFFBEB',    warnBd:'#FCD34D',
  danger:'#DC2626', dangerBg:'#FEF2F2',  dangerBd:'#FECACA',
  purple:'#7C3AED', purpleBg:'#F5F3FF',  purpleBd:'#DDD6FE',
  teal:'#0D9488',   tealBg:'#F0FDFA',    tealBd:'#99F6E4',
  orange:'#EA580C', orangeBg:'#FFF7ED',  orangeBd:'#FED7AA',
};

const apiH = () => ({ Authorization:`Bearer ${localStorage.getItem('token')}`, 'Content-Type':'application/json' });
const STORAGE_NEW='auditeur_nouveaux_ids', STORAGE_KNOWN='auditeur_known_ids', STORAGE_STARTED='auditeur_started_ids';
const STORAGE_BANNER = 'auditeur_banner_dismissed_session';

const fmt = d => { if(!d) return '—'; try { return new Date(d).toLocaleDateString('fr-FR',{day:'2-digit',month:'short',year:'numeric'}); } catch { return d; } };

const isOverdue = a => {
  if (!a.deadline) return false;
  if (['TERMINE','ANNULE','EN_RETARD'].includes(a.statut)) return false;
  return new Date(a.deadline) < new Date();
};

const isEnRetard = a => a.statut === 'EN_RETARD' || isOverdue(a);

const getAuditHeaderDate = (audit) => {
  if (!audit) return null;
  if (audit.statut === 'TERMINE') {
    return audit.rapportGenereDate || audit.dateRealisation || audit.dateTerminaison || audit.dateFin || audit.dateCloture || null;
  }
  return audit.datePrevue || audit.dateRealisation || audit.dateTerminaison || audit.dateFin || audit.dateCloture || null;
};

const loadSet = k => { try { const r=localStorage.getItem(k); return new Set(r?JSON.parse(r):[]); } catch { return new Set(); } };
const saveSet = (k,s) => localStorage.setItem(k,JSON.stringify([...s]));

/* ─── Icônes SVG ─── */
const Ic = {
  search:   <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  filter:   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>,
  clock:    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  check:    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>,
  alert:    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
  eye:      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>,
  play:     <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>,
  trash:    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>,
  arrow:    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>,
  bell:     <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>,
  micro:    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  card:     <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>,
  lock:     <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>,
  timer:    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/><line x1="12" y1="2" x2="12" y2="4"/><line x1="20" y1="12" x2="22" y2="12"/></svg>,
  plus:     <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  edit:     <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z"/></svg>,
};

const STATUT_CFG = {
  PLANIFIE:  { bg:'#DBEAFE', text:'#1D4ED8', label:'Planifié',   dot:'#3B82F6' },
  EN_COURS:  { bg:'#FEF9C3', text:'#B45309', label:'En cours',   dot:'#F59E0B' },
  TERMINE:   { bg:'#DCFCE7', text:'#15803D', label:'Terminé',    dot:'#22C55E' },
  EN_RETARD: { bg:'#FEE2E2', text:'#B91C1C', label:'En retard',  dot:'#EF4444' },
  ANNULE:    { bg:'#F3F4F6', text:'#6B7280', label:'Annulé',     dot:'#9CA3AF' },
};

const QK_CFG = {
  VERT:   { bg:'#DCFCE7', bd:'#86EFAC', text:'#15803D', label:'Conforme' },
  ORANGE: { bg:'#FEF9C3', bd:'#FCD34D', text:'#B45309', label:'Non-conformité' },
  ROSE:   { bg:'#FCE7F3', bd:'#F9A8D4', text:'#9D174D', label:'Action requise' },
  ROUGE:  { bg:'#FEE2E2', bd:'#FCA5A5', text:'#B91C1C', label:'Alerte critique' },
};

/* ─── Stat Card ─── */
function StatCard({ title, count, desc, icon, color, bg, onClick, active, badge }) {
  const [hov, setHov] = useState(false);
  return (
    <div onClick={onClick}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        background: active ? 'linear-gradient(145deg, #002855 0%, #003F8A 60%, #0057B8 100%)' : '#fff',
        borderRadius: 16, cursor: 'pointer', transition: 'all .2s',
        border: `2px solid ${active ? '#003F8A' : hov ? T.navy : T.g200}`,
        boxShadow: active || hov ? '0 8px 24px rgba(11,30,61,.15)' : '0 1px 4px rgba(0,0,0,.05)',
        transform: hov && !active ? 'translateY(-2px)' : 'none',
        padding: '1.25rem 1.5rem', position: 'relative', overflow: 'visible',
      }}>
      {badge > 0 && (
        <div style={{
          position:'absolute', top:0, right:12, transform:'translateY(-50%)',
          display:'inline-flex', alignItems:'center', gap:6,
          background:'linear-gradient(135deg,#DC2626,#B91C1C)', color:'#fff',
          fontSize:'.62rem', fontWeight:800, padding:'3px 10px', borderRadius:999,
          boxShadow:'0 4px 12px rgba(185,28,28,.35)', border:'1px solid rgba(255,255,255,.22)',
          zIndex:2,
        }}>
          <span style={{width:14,height:14,borderRadius:'50%',background:'rgba(255,255,255,.22)',display:'inline-flex',alignItems:'center',justifyContent:'center',fontSize:'.5rem'}}>•</span>
          <span>{badge} nouveau{badge > 1 ? 'x' : ''}</span>
        </div>
      )}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:'.75rem', fontWeight:700, color: active ? 'rgba(255,255,255,.6)' : T.g400, textTransform:'uppercase', letterSpacing:'.06em', marginBottom:4 }}>{title}</div>
          <div style={{ fontSize:'2rem', fontWeight:900, color: active ? '#fff' : T.navy, lineHeight:1, marginBottom:4, fontFamily:"'Plus Jakarta Sans','Inter',sans-serif" }}>{count}</div>
          <div style={{ fontSize:'.73rem', color: active ? 'rgba(255,255,255,.55)' : T.g400, fontWeight:600 }}>{desc}</div>
        </div>
        <div style={{ width:44, height:44, borderRadius:12, background: active ? 'rgba(255,255,255,.15)' : bg, color: active ? '#fff' : color, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, marginLeft:12 }}>
          {icon}
        </div>
      </div>
    </div>
  );
}

/* ─── Audit Produit Card ─── */
function ProduitCard({ audit, nouveau, onView, onViewDetail, onDelete, onDemandeTemps, onModifier }) {
  const [hov, setHov] = useState(false);
  const retard = isEnRetard(audit);
  const qkValue = Number(audit.valeurQK);
  const qk = Number.isFinite(qkValue)
    ? (qkValue === 0
      ? QK_CFG.VERT
      : qkValue <= 0.5
        ? QK_CFG.ORANGE
        : qkValue <= 1
          ? QK_CFG.ROSE
          : QK_CFG.ROUGE)
    : null;
  const stCfg = retard ? STATUT_CFG.EN_RETARD : (STATUT_CFG[audit.statut] || STATUT_CFG.PLANIFIE);
  const isTermine = audit.statut === 'TERMINE';
  const isAnnule  = audit.statut === 'ANNULE';
  const dateFinAudit = audit.dateRealisation || audit.dateTerminaison || audit.dateFin || audit.dateCloture;

  const demandeStatut = audit.demandeExtension?.statut;

  return (
    <div onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        background: '#fff', borderRadius: 16,
        border: `1.5px solid ${retard && !isTermine ? T.dangerBd : hov ? T.g300 : T.g200}`,
        boxShadow: hov ? '0 12px 32px rgba(0,0,0,.10)' : retard && !isTermine ? '0 2px 8px rgba(220,38,38,.10)' : '0 2px 8px rgba(0,0,0,.05)',
        transform: hov ? 'translateY(-3px)' : 'none', transition: 'all .2s',
        padding: '1.25rem', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden',
      }}>

      {/* Bandeau rouge EN RETARD */}
      {retard && !isTermine && !isAnnule && (
        <div style={{
          position:'absolute', top:0, left:0, right:0, height:3,
          background:'linear-gradient(90deg,#DC2626,#EF4444,#F87171)',
        }}/>
      )}
      {nouveau && !retard && (
        <div style={{ position:'absolute', top:0, left:0, right:0, height:3, background:'linear-gradient(90deg,#DC2626,#EF4444)' }}/>
      )}

      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:12 }}>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontWeight:800, fontSize:'.9rem', color:T.navy, marginBottom:2, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
            {audit.reference}
          </div>
          <div style={{ fontSize:'.72rem', color:T.g400, display:'flex', alignItems:'center', gap:5 }}>
            {Ic.clock} {fmt(getAuditHeaderDate(audit))}
            {retard && !isTermine && (
              <span style={{ color:T.danger, fontWeight:700, marginLeft:4, display:'flex', alignItems:'center', gap:3 }}>
                {Ic.alert} EN RETARD
              </span>
            )}
          </div>
        </div>
        <span style={{ background:stCfg.bg, color:stCfg.text, fontSize:'.66rem', fontWeight:800, padding:'3px 10px', borderRadius:99, flexShrink:0, display:'flex', alignItems:'center', gap:4 }}>
          <span style={{ width:5, height:5, borderRadius:'50%', background:stCfg.dot, display:'inline-block' }}/>
          {stCfg.label}
        </span>
      </div>

      {/* Alerte retard inline */}
      {retard && !isTermine && !isAnnule && (
        <div style={{
          background:T.dangerBg, border:`1px solid ${T.dangerBd}`,
          borderRadius:8, padding:'7px 10px', marginBottom:10,
          fontSize:'.72rem', color:T.danger, fontWeight:600,
          display:'flex', alignItems:'center', gap:7,
        }}>
          {Ic.lock}
          <span>En retard — deadline dépassée le <strong>{fmt(audit.deadline)}</strong>.</span>
        </div>
      )}

      {/* Grille infos */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6, marginBottom:10 }}>
        {[
          { l:'Plant',       v: audit.plantNom||'—' },
          { l:'Série',       v: audit.serieNom||'—' },
          { l:'Projet',      v: audit.projetNom||'—' },
          { l:'Date prévue', v: fmt(audit.datePrevue) },
          { l:'Nature',      v: audit.natureAudit==='DESTRUCTIF'?'Destructif':'Non-destructif' },
          { l: isTermine ? 'Date de fin' : 'Deadline', v: isTermine ? fmt(dateFinAudit || audit.datePrevue) : fmt(audit.deadline) },
        ].map(x => (
          <div key={x.l} style={{ background:T.g50, borderRadius:8, padding:'6px 9px' }}>
            <div style={{ fontSize:'.6rem', color:T.g400, fontWeight:700, textTransform:'uppercase', letterSpacing:'.05em', marginBottom:2 }}>{x.l}</div>
            <div style={{ fontSize:'.75rem', color: x.l==='Deadline' && retard && !isTermine ? T.danger : T.g700, fontWeight: x.l==='Deadline' && retard ? 800 : 600 }}>{x.v}</div>
          </div>
        ))}
      </div>

      {/* Badge QK (shown on started or finished audits) */}
      {qk && (audit.started || isTermine) && (
        <div style={{ background:qk.bg, border:`1px solid ${qk.bd}`, borderRadius:8, padding:'5px 10px', marginBottom:10, display:'flex', alignItems:'center', gap:7 }}>
          <svg width="10" height="10" viewBox="0 0 24 24" fill={qk.text}><circle cx="12" cy="12" r="10"/></svg>
          <span style={{ fontSize:'.72rem', fontWeight:700, color:qk.text }}>
            {audit.valeurQK != null
              ? `QK ${audit.valeurQK}${qkValue === 0 ? ' — Conforme' : ''}`
              : 'QK —'}
          </span>
        </div>
      )}

      {/* ── Actions ── */}
      <div style={{ display:'flex', gap:8, marginTop:'auto', paddingTop:8, borderTop:`1px solid ${T.g100}` }}>

        {isTermine ? (
          /* Terminé : Aperçu + Carte d'identité */
          <>
            <button onClick={() => onView(audit, true)}
              style={{ flex:1, display:'inline-flex', alignItems:'center', justifyContent:'center', gap:6, padding:'8px', borderRadius:9, border:`1.5px solid ${T.g300}`, background:T.g50, color:T.g700, fontWeight:700, fontSize:'.78rem', cursor:'pointer', fontFamily:"'Inter',sans-serif" }}>
              {Ic.eye} Aperçu
            </button>
            <button onClick={() => onViewDetail(audit.id)}
              style={{ flex:2, display:'inline-flex', alignItems:'center', justifyContent:'center', gap:6, padding:'8px', borderRadius:9, border:'none', background:'linear-gradient(145deg,#002855 0%,#003F8A 60%,#0057B8 100%)', color:'#fff', fontWeight:700, fontSize:'.78rem', cursor:'pointer', fontFamily:"'Inter',sans-serif", boxShadow:'0 8px 18px rgba(0,40,85,.18)' }}>
              {Ic.card} Voir la carte d'identité
            </button>
            <button onClick={() => onModifier?.(audit)}
              style={{ width:36, height:36, display:'inline-flex', alignItems:'center', justifyContent:'center', borderRadius:9, border:`1.5px solid ${T.blueL}`, background:'#EFF6FF', color:T.blue, cursor:'pointer' }}>
              {Ic.edit}
            </button>
            <button onClick={() => onDelete(audit.id)}
              style={{ width:36, height:36, display:'inline-flex', alignItems:'center', justifyContent:'center', borderRadius:9, border:`1.5px solid #FECACA`, background:'#FEF2F2', color:'#DC2626', cursor:'pointer' }}>
              {Ic.trash}
            </button>
          </>

        ) : retard && !isAnnule ? (
          /* EN RETARD — L'auditeur peut continuer, bouton rouge pour indiquer l'urgence */
          <>
            <button onClick={() => onView(audit, false)}
              style={{ 
                flex:1, 
                display:'inline-flex', 
                alignItems:'center', 
                justifyContent:'center', 
                gap:6, 
                padding:'8px', 
                borderRadius:9, 
                border:'none',
                background:'linear-gradient(135deg,#DC2626 0%,#EF4444 60%,#F87171 100%)',
                color:'#fff',
                fontWeight:700, 
                fontSize:'.78rem',
                cursor:'pointer',
                fontFamily:"'Inter',sans-serif",
                boxShadow:'0 4px 12px rgba(220,38,38,.3)',
                transition:'all .15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 8px 20px rgba(220,38,38,.4)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(220,38,38,.3)'; }}
            >
              {Ic.play} {audit.started ? 'Continuer ' : 'Commencer '}
            </button>

            <button onClick={() => onDemandeTemps(audit)}
              style={{
                flex:1, display:'inline-flex', alignItems:'center', justifyContent:'center', gap:6, padding:'8px', borderRadius:9,
                border:'none',
                background:'linear-gradient(135deg,#7C2D12 0%,#C2410C 60%,#EA580C 100%)',
                color:'#fff', fontWeight:700, fontSize:'.78rem', cursor:'pointer', fontFamily:"'Inter',sans-serif",
                boxShadow:'0 6px 16px rgba(194,65,12,.30)'
              }}>
              Demander du temps
            </button>

            <button onClick={() => onModifier?.(audit)}
              style={{ width:36, height:36, display:'inline-flex', alignItems:'center', justifyContent:'center', borderRadius:9, border:`1.5px solid ${T.blueL}`, background:'#EFF6FF', color:T.blue, cursor:'pointer' }}>
              {Ic.edit}
            </button>
            <button onClick={() => onDelete(audit.id)}
              style={{ width:36, height:36, display:'inline-flex', alignItems:'center', justifyContent:'center', borderRadius:9, border:`1.5px solid #FECACA`, background:'#FEF2F2', color:'#DC2626', cursor:'pointer' }}>
              {Ic.trash}
            </button>
          </>

        ) : (
          /* Normal (PLANIFIE / EN_COURS) : Commencer/Continuer + supprimer */
          <>
            <button onClick={() => onView(audit, false)}
              style={{ flex:1, display:'inline-flex', alignItems:'center', justifyContent:'center', gap:6, padding:'8px', borderRadius:9, border:'none', background:'linear-gradient(145deg,#002855 0%,#003F8A 60%,#0057B8 100%)', color:'#fff', fontWeight:700, fontSize:'.78rem', cursor:'pointer', fontFamily:"'Inter',sans-serif", boxShadow:'0 8px 18px rgba(0,40,85,.18)' }}>
              {Ic.play} {audit.started ? 'Continuer' : 'Commencer'}
            </button>
            <button onClick={() => onModifier?.(audit)}
              style={{ width:36, height:36, display:'inline-flex', alignItems:'center', justifyContent:'center', borderRadius:9, border:`1.5px solid ${T.blueL}`, background:'#EFF6FF', color:T.blue, cursor:'pointer' }}>
              {Ic.edit}
            </button>
            <button onClick={() => onDelete(audit.id)}
              style={{ width:36, height:36, display:'inline-flex', alignItems:'center', justifyContent:'center', borderRadius:9, border:`1.5px solid #FECACA`, background:'#FEF2F2', color:'#DC2626', cursor:'pointer' }}>
              {Ic.trash}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

/* ─── Audit Spécial Card ─── */
function SpecialCard({ audit, type, onStart, onViewDetail, onModifier }) {
  const [hov, setHov] = useState(false);
  const isDone = audit.statut === 'TERMINE';
  const inProg = audit.statut === 'EN_COURS';
  const isNew  = audit.statut === 'PLANIFIE';
  const isRetard = audit.statut === 'EN_RETARD';
  const reportUrl = audit.rapportUrl || audit.rapportGenerePdfUrl || '';
  const reportHref = reportUrl
    ? (reportUrl.startsWith('http') ? reportUrl : `http://localhost:8080${reportUrl}`)
    : '';

  const cfg = type === 'export'
    ? { color:T.purple, bg:T.purpleBg, bd:T.purpleBd, icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={T.purple} strokeWidth="1.8" strokeLinecap="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>, label:'Export' }
    : { color:T.teal,   bg:T.tealBg,   bd:T.tealBd,   icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={T.teal} strokeWidth="1.8" strokeLinecap="round"><line x1="5" y1="12" x2="19" y2="12"/><line x1="5" y1="6" x2="19" y2="6"/><line x1="5" y1="18" x2="19" y2="18"/></svg>, label:'Règle Plate' };

  const stCfg = isDone ? STATUT_CFG.TERMINE : inProg ? STATUT_CFG.EN_COURS : isRetard ? STATUT_CFG.EN_RETARD : isNew
    ? { bg: type === 'export' ? T.purpleBg : T.tealBg, text: type === 'export' ? T.purple : T.teal, dot: type === 'export' ? T.purple : T.teal, label:'Nouveau' }
    : STATUT_CFG.PLANIFIE;

  return (
    <div onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        background: '#fff', borderRadius: 16, border: `1.5px solid ${hov ? cfg.color : T.g200}`,
        boxShadow: hov ? `0 12px 32px ${cfg.color}20` : '0 2px 8px rgba(0,0,0,.05)',
        transform: hov ? 'translateY(-3px)' : 'none', transition: 'all .2s',
        padding: '1.25rem', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden',
      }}>
      {isNew && <div style={{ position:'absolute', top:0, left:0, right:0, height:3, background:`linear-gradient(90deg,${cfg.color},${cfg.bd})` }}/>}

      {/* Bandeau rouge si EN_RETARD */}
      {isRetard && !isDone && (
        <div style={{
          position:'absolute', top:0, left:0, right:0, height:3,
          background:'linear-gradient(90deg,#DC2626,#EF4444,#F87171)',
        }}/>
      )}

      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:12 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10, flex:1 }}>
          <div style={{ width:40, height:40, borderRadius:10, background:cfg.bg, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>{cfg.icon}</div>
          <div>
            <div style={{ fontWeight:800, fontSize:'.88rem', color:T.navy }}>{audit.reference || `Audit #${audit.id}`}</div>
            <div style={{ fontSize:'.71rem', color:T.g400, marginTop:2, display:'flex', alignItems:'center', gap:5 }}>{Ic.clock} {fmt(getAuditHeaderDate(audit))}</div>
          </div>
        </div>
        <span style={{ background:stCfg.bg, color:stCfg.text, fontSize:'.65rem', fontWeight:800, padding:'3px 9px', borderRadius:99, flexShrink:0, display:'flex', alignItems:'center', gap:4 }}>
          <span style={{ width:5, height:5, borderRadius:'50%', background:stCfg.dot, display:'inline-block' }}/>{stCfg.label}
        </span>
      </div>

      {/* Alerte retard inline */}
      {isRetard && !isDone && (
        <div style={{
          background:T.dangerBg, border:`1px solid ${T.dangerBd}`,
          borderRadius:8, padding:'5px 10px', marginBottom:10,
          fontSize:'.68rem', color:T.danger, fontWeight:600,
          display:'flex', alignItems:'center', gap:7,
        }}>
          {Ic.lock}
          <span>En retard — deadline dépassée.</span>
        </div>
      )}

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6, marginBottom:12 }}>
        {[
          audit.plantNom && { l:'Plant', v: audit.plantNom },
          audit.zoneExpedition && { l:'Zone', v: audit.zoneExpedition },
          audit.semaineExport && { l:'Semaine', v: audit.semaineExport },
          audit.deadline && { l:'Prochain contrôle', v: fmt(audit.deadline) },
        ].filter(Boolean).map(x => (
          <div key={x.l} style={{ background:T.g50, borderRadius:8, padding:'6px 9px' }}>
            <div style={{ fontSize:'.6rem', color:T.g400, fontWeight:700, textTransform:'uppercase', letterSpacing:'.05em', marginBottom:2 }}>{x.l}</div>
            <div style={{ fontSize:'.75rem', color:T.g700, fontWeight:600 }}>{x.v}</div>
          </div>
        ))}
      </div>

      <div style={{ display:'inline-flex', alignItems:'center', gap:6, background:cfg.bg, color:cfg.color, borderRadius:99, padding:'4px 10px', fontSize:'.68rem', fontWeight:700, marginBottom:12, border:`1px solid ${cfg.bd}`, alignSelf:'flex-start' }}>
        {cfg.icon} Audit {cfg.label}
      </div>

      <div style={{ marginTop:'auto', paddingTop:8, borderTop:`1px solid ${T.g100}` }}>
        {isDone ? (
          /* Terminé : Voir le rapport + Voir la carte d'identité */
          <div style={{ display:'flex', gap:8 }}>
            <button onClick={() => onModifier?.(audit)}
              style={{ width:36, height:36, display:'inline-flex', alignItems:'center', justifyContent:'center', borderRadius:9, border:`1.5px solid ${T.blueL}`, background:'#EFF6FF', color:T.blue, cursor:'pointer' }}>
              {Ic.edit}
            </button>
            {reportHref ? (
              <a href={reportHref} target="_blank" rel="noopener noreferrer" style={{ flex:1, textDecoration:'none' }}>
                <button
                  style={{ width:'100%', display:'inline-flex', alignItems:'center', justifyContent:'center', gap:6, padding:'8px', borderRadius:9, border:`1.5px solid ${T.g300}`, background:T.g50, color:T.g700, fontWeight:700, fontSize:'.78rem', cursor:'pointer', fontFamily:"'Inter',sans-serif" }}>
                  {Ic.eye} Rapport
                </button>
              </a>
            ) : (
              <button onClick={() => onStart(audit)}
                style={{ flex:1, display:'inline-flex', alignItems:'center', justifyContent:'center', gap:6, padding:'8px', borderRadius:9, border:`1.5px solid ${T.g300}`, background:T.g50, color:T.g700, fontWeight:700, fontSize:'.78rem', cursor:'pointer', fontFamily:"'Inter',sans-serif" }}>
                {Ic.eye} Rapport
              </button>
            )}
            <button onClick={() => onViewDetail(audit.id, type)}
              style={{ flex:1.2, display:'inline-flex', alignItems:'center', justifyContent:'center', gap:6, padding:'8px', borderRadius:9, border:'none', background:'linear-gradient(145deg,#002855 0%,#003F8A 60%,#0057B8 100%)', color:'#fff', fontWeight:700, fontSize:'.78rem', cursor:'pointer', fontFamily:"'Inter',sans-serif", boxShadow:'0 8px 18px rgba(0,40,85,.18)' }}>
              {Ic.card} Détail
            </button>
          </div>
        ) : isRetard ? (
          /* EN RETARD - l'auditeur peut continuer, bouton rouge */
          <div style={{ display:'flex', gap:8 }}>
            <button onClick={() => onModifier?.(audit)}
              style={{ width:36, height:36, display:'inline-flex', alignItems:'center', justifyContent:'center', borderRadius:9, border:`1.5px solid ${T.blueL}`, background:'#EFF6FF', color:T.blue, cursor:'pointer' }}>
              {Ic.edit}
            </button>
            <button onClick={() => onStart(audit)}
              style={{ 
                flex:1, 
                display:'inline-flex', 
                alignItems:'center', 
                justifyContent:'center', 
                gap:6, 
                padding:'9px', 
                borderRadius:9, 
                border:'none',
                background:'linear-gradient(135deg,#DC2626 0%,#EF4444 60%,#F87171 100%)',
                color:'#fff',
                fontWeight:700, 
                fontSize:'.78rem',
                cursor:'pointer',
                fontFamily:"'Inter',sans-serif",
                boxShadow:'0 4px 12px rgba(220,38,38,.3)',
                transition:'all .15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 8px 20px rgba(220,38,38,.4)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(220,38,38,.3)'; }}
            >
              {Ic.play} {inProg ? 'Continuer (retard)' : "Commencer l'audit (retard)"}
            </button>
          </div>
        ) : (
          <div style={{ display:'flex', gap:8 }}>
            <button onClick={() => onModifier?.(audit)}
              style={{ width:36, height:36, display:'inline-flex', alignItems:'center', justifyContent:'center', borderRadius:9, border:`1.5px solid ${T.blueL}`, background:'#EFF6FF', color:T.blue, cursor:'pointer' }}>
              {Ic.edit}
            </button>
            <button onClick={() => onStart(audit)}
              style={{ flex:1, display:'inline-flex', alignItems:'center', justifyContent:'center', gap:6, padding:'9px', borderRadius:9, border:'none', background:'linear-gradient(145deg, #002855 0%, #003F8A 60%, #0057B8 100%)', color:'#fff', fontWeight:700, fontSize:'.78rem', cursor:'pointer', fontFamily:"'Inter',sans-serif", boxShadow:'0 8px 18px rgba(0,40,85,.18)' }}>
              {Ic.play}
              {inProg ? 'Continuer' : "Commencer l'audit"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Special Audit Detail Modal (Carte d'Identité) ─── */
function SpecialAuditDetailModal({ detail, open, onClose }) {
  if (!open || !detail) return null;
  
  const { audit, type } = detail;
  const isReglePlate = type === 'regle';
  
  const fmt = d => { if(!d) return '—'; try { return new Date(d).toLocaleDateString('fr-FR',{day:'2-digit',month:'short',year:'numeric'}); } catch { return d; } };
  
  const fields = [
    { l:'Référence', v:audit.reference },
    { l:'Type d\'audit', v:isReglePlate ? 'Audit Règle Plate (IT TN 3627)' : 'Audit Magasin Export (IT 3600-05)' },
    { l:'Plant', v:audit.plantNom||'—' },
    { l:'Auditeur', v:audit.auditeurNom||(audit.auditeur ? `${audit.auditeur.prenom} ${audit.auditeur.nom}` : '—') },
    { l:'Expert / Planificateur', v:audit.planificateurNom||(audit.planificateur ? `${audit.planificateur.prenom} ${audit.planificateur.nom}` : '—') },
    { l:'Date prévue', v:fmt(audit.datePrevue) },
    { l:'Date de réalisation', v:fmt(audit.dateRealisation||new Date()) },
    ...(isReglePlate ? [
      { l:'Prochain contrôle', v:fmt(audit.deadline) },
      { l:'PDCA déclenché', v:audit.pdcaDeclenche ? 'Oui' : 'Non' },
    ] : [
      { l:'Salle d\'export', v:audit.zoneExpedition||'—' },
      { l:'Semaine', v:audit.semaineExport||'—' },
      { l:'Résultat (%)', v:audit.actionImmediate?.includes('%') ? audit.actionImmediate : '—' },
      { l:'Validé par resp. magasin', v:audit.valideParResponsableMagasin ? 'Oui' : 'En attente' },
    ]),
    { l:'Statut final', v:'TERMINÉ' },
  ];

  const reportUrl = audit.rapportUrl || audit.rapportGenerePdfUrl || '';
  const reportHref = reportUrl ? (String(reportUrl).startsWith('http') ? reportUrl : `http://localhost:8080${reportUrl}`) : '';
  let reportFileName = audit.rapportFichierNom || (reportUrl ? String(reportUrl).split('/').pop() : 'rapport.pdf');
  if (reportFileName && !reportFileName.toLowerCase().endsWith('.pdf')) reportFileName = reportFileName + '.pdf';
  const reportDate = audit.rapportGenereDate || audit.dateRealisation || audit.datePrevue || null;

  return (
    <div style={{
      position:'fixed', top:0, left:0, right:0, bottom:0,
      background:'rgba(0,0,0,.5)', display:'flex', alignItems:'center', justifyContent:'center',
      zIndex:9999, padding:'1rem'
    }}>
      <div style={{
        background:'#fff', borderRadius:14, maxWidth:800, width:'100%',
        maxHeight:'70vh', height:'auto', display:'flex', flexDirection:'column',
        boxShadow:'0 18px 48px rgba(0,0,0,.22)',
        border:'1px solid #9eafd399', position:'relative'
      }}>
        {/* Croix de fermeture en haut à droite */}
        <button onClick={onClose}
          style={{
            position:'absolute', top:12, right:12, zIndex:10,
            width:36, height:36, borderRadius:50, border:'none',
            background:'rgba(0,0,0,.6)', color:'#fff', cursor:'pointer',
            display:'flex', alignItems:'center', justifyContent:'center',
            fontSize:'1.2rem', fontWeight:'800',
            transition:'all .12s', padding:0, lineHeight:1
          }}
          onMouseEnter={e => { e.currentTarget.style.transform='translateY(-2px) scale(1.03)'; }}
          onMouseLeave={e => { e.currentTarget.style.transform='none'; }}>
          ✕
        </button>

        {/* Header */}
        <div style={{
          background:'#c4d7ed', padding:'12px 16px',
          borderBottom:`1px solid ${T.g200}`, display:'flex',
          alignItems:'center', gap:12, flexWrap:'wrap'
        }}>
          <div style={{ display:'flex', alignItems:'center', gap:14 }}>
            <div style={{
              width:44, height:44, borderRadius:12,
              background: isReglePlate ? T.tealBg : T.purpleBg,
              border: `1px solid ${isReglePlate ? T.tealBd : T.purpleBd}`,
              display:'flex', alignItems:'center', justifyContent:'center',
              color: isReglePlate ? T.teal : T.purple, fontSize:'1.3rem'
            }}>
              {isReglePlate ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="5" y1="12" x2="19" y2="12"/><line x1="5" y1="6" x2="19" y2="6"/><line x1="5" y1="18" x2="19" y2="18"/></svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>
              )}
            </div>
            <div>
              <div style={{ fontWeight:800, fontSize:'.98rem', color:T.navy }}>
                Carte d'identité de l'audit
              </div>
              <div style={{ fontSize:'.68rem', color:T.g500, marginTop:2 }}>
                {audit.reference} · Audit terminé
              </div>
            </div>
          </div>
          <div style={{
            background:T.successBg, borderRadius:24, padding:'4px 14px',
            border:`1px solid ${T.successBd}`, marginLeft:'auto',marginRight:'35px'
          }}>
            <span style={{ fontSize:'.7rem', fontWeight:700, color:T.success,
              textTransform:'uppercase', letterSpacing:'.05em' }}>
              TERMINÉ
            </span>
          </div>
        </div>

        {/* Grid */}
        <div style={{ padding:'12px 16px', flex:1, overflow:'auto' }}>
          <div style={{
            display:'grid', gridTemplateColumns:'repeat(5, 1fr)',
            gap:12
          }}>
            {fields.map((f, idx) => (
              <div key={idx} style={{ padding:'8px 10px', background:'#c8c8c88d', borderRadius:10 }}>
                <div style={{
                  fontSize:'.62rem', fontWeight:700, color:T.g400,
                  textTransform:'uppercase', letterSpacing:'.06em', marginBottom:4
                }}>
                  {f.l}
                </div>
                <div style={{
                  fontSize:'.85rem', fontWeight:600, color:T.navy,
                  wordBreak:'break-word', lineHeight:1.2
                }}>
                  {f.v}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div style={{
          background:'#becbd498', borderTop:`1px solid ${T.g300}`,
          padding:'10px 16px', display:'flex', gap:12,
          justifyContent:'space-between', alignItems:'center'
        }}>
          {reportHref ? (
            <>
              <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
                <div style={{ fontWeight:900, color:T.blue, fontSize:14 }}>{reportFileName}</div>
                <div style={{ fontSize:12, color:T.g500 }}>{reportDate ? fmt(reportDate) : '—'}</div>
              </div>

              <div style={{ display:'flex', gap:10 }}>
                <button onClick={async () => {
                  try {
                    const res = await fetch(reportHref, { headers: apiH() }); if (!res.ok) throw new Error(res.status);
                    const blob = await res.blob(); const objectUrl = window.URL.createObjectURL(new Blob([blob], { type:'application/pdf' })); window.open(objectUrl, '_blank');
                  } catch(e) { alert('Erreur : ' + e.message); }
                }}
                  style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'10px 18px', borderRadius:10, border:`2px solid ${T.blue}`, background:'#EFF6FF', color:T.blue, fontWeight:700, cursor:'pointer' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0}}><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z"/><circle cx="12" cy="12" r="3"/></svg>
                  Voir le rapport
                </button>

                <button onClick={async () => {
                  try {
                    const dlUrl = reportHref + (reportHref.includes('?') ? '&download=true' : '?download=true');
                    const res = await fetch(dlUrl, { headers: apiH() }); if (!res.ok) throw new Error(res.status);
                    const blob = await res.blob(); const a = document.createElement('a'); const u = window.URL.createObjectURL(blob); a.href = u; a.download = reportFileName || `rapport_${audit.reference||audit.id}.pdf`; document.body.appendChild(a); a.click(); document.body.removeChild(a); window.URL.revokeObjectURL(u);
                  } catch(e) { alert('Erreur : ' + e.message); }
                }}
                  style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'10px 18px', borderRadius:10, border:'none', background:T.navy, color:'#fff', fontWeight:700, cursor:'pointer' }}>
                  ⬇ Télécharger
                </button>
              </div>
            </>
          ) : (
            <div style={{ color:T.g500 }}>Aucun rapport disponible</div>
          )}
        </div>
      </div>
    </div>
  );
}

function ModifierAuditModal({ audit, open, onClose, onSuccess }) {
  const [deadline, setDeadline] = useState('');
  const [observations, setObservations] = useState('');
  const [auditeurId, setAuditeurId] = useState('');
  const [collegues, setCollegues] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (audit) {
      setDeadline(audit.deadline || '');
      setObservations(audit.observations || '');
      setAuditeurId(audit.auditeurId || '');
      setError('');
      auditeurAPI.getAuditeursMonPlant()
        .then(r => setCollegues(r.data || []))
        .catch(() => setCollegues([]));
    }
  }, [audit]);

  if (!open || !audit) return null;

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      await auditProduitAPI.modifierParAuditeur(audit.id, {
        deadline: deadline || null,
        observations: observations || null,
        auditeurId: auditeurId || null,
      });
      onSuccess();
    } catch (e) {
      setError(e?.response?.data?.message || 'Erreur lors de la modification.');
    }
    setSaving(false);
  };

  return (
    <div style={{ position:'fixed', inset:0, zIndex:1000, background:'rgba(0,0,0,.45)', display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
      <div style={{ background:'#fff', borderRadius:16, padding:24, width:'100%', maxWidth:440 }}>
        <h3 style={{ margin:'0 0 16px', fontSize:'1rem', fontWeight:800, color:T.navy }}>
          Modifier l'audit {audit.reference}
        </h3>

        {error && (
          <div style={{ background:T.dangerBg, border:`1px solid ${T.dangerBd}`, borderRadius:8, padding:'8px 12px', marginBottom:12, fontSize:'.8rem', color:T.danger }}>
            {error}
          </div>
        )}

        <label style={{ display:'block', fontSize:'.72rem', fontWeight:700, color:T.g500, marginBottom:4, textTransform:'uppercase' }}>
          Deadline
        </label>
        <input type="date" value={deadline} onChange={e => setDeadline(e.target.value)}
          style={{ width:'100%', height:38, borderRadius:9, border:`1.5px solid ${T.g300}`, padding:'0 10px', marginBottom:14, boxSizing:'border-box' }}/>

        <label style={{ display:'block', fontSize:'.72rem', fontWeight:700, color:T.g500, marginBottom:4, textTransform:'uppercase' }}>
          Observations
        </label>
        <textarea value={observations} onChange={e => setObservations(e.target.value)} rows={3}
          style={{ width:'100%', borderRadius:9, border:`1.5px solid ${T.g300}`, padding:10, marginBottom:14, boxSizing:'border-box', fontFamily:'inherit', resize:'vertical' }}/>

        <label style={{ display:'block', fontSize:'.72rem', fontWeight:700, color:T.g500, marginBottom:4, textTransform:'uppercase' }}>
          Réaliser par (auditeur de votre plant)
        </label>
        <select value={auditeurId} onChange={e => setAuditeurId(e.target.value)}
          style={{ width:'100%', height:38, borderRadius:9, border:`1.5px solid ${T.g300}`, padding:'0 10px', marginBottom:16, boxSizing:'border-box', background:'#fff' }}>
          <option value="">— Ne pas changer —</option>
          {collegues.map(c => (
            <option key={c.id} value={c.id}>
              {c.prenom} {c.nom} ({c.matricule})
            </option>
          ))}
        </select>

        <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
          <button onClick={onClose} style={{ padding:'9px 18px', borderRadius:9, border:`1.5px solid ${T.g300}`, background:'#fff', cursor:'pointer', fontWeight:700, fontSize:'.82rem' }}>
            Annuler
          </button>
          <button onClick={handleSave} disabled={saving}
            style={{ padding:'9px 20px', borderRadius:9, border:'none', background:'linear-gradient(135deg,#1C3FAA,#2563EB)', color:'#fff', cursor:'pointer', fontWeight:700, fontSize:'.82rem', opacity: saving?.7:1 }}>
            {saving ? 'Enregistrement…' : 'Enregistrer'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Composant principal ─── */
export default function AuditeurAuditsPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [activeCard,      setActiveCard]      = useState('produit');
  const [auditsProduit,   setAuditsProduit]   = useState([]);
  const [auditsRegle,     setAuditsRegle]     = useState([]);
  const [auditsExport,    setAuditsExport]    = useState([]);
  const [planifs,         setPlanifs]         = useState([]);
  const [filterPlanif,    setFilterPlanif]    = useState(() => searchParams.get('planificationId') || '');
  const [filterStatut, setFilterStatut] = useState('PLANIFIE');
  const [loading,         setLoading]         = useState(true);
  const [nouveauxIds,     setNouveauxIds]     = useState(new Set());
  const [bannerDismissed, setBannerDismissed] = useState(() => !!sessionStorage.getItem(STORAGE_BANNER));
  const [search,          setSearch]          = useState('');
  const [startedIds,      setStartedIds]      = useState(loadSet(STORAGE_STARTED));
  const [produitPage,     setProduitPage]     = useState(1);

  // ── AuditDetailDrawer ──────────────────────────────────────
  const [drawerAuditId, setDrawerAuditId] = useState(null);
  const [showDrawer,    setShowDrawer]    = useState(false);

  // ── Special Audit Detail Modal (for Carte d'Identité) ────────
  const [specialAuditDetail, setSpecialAuditDetail] = useState(null);
  const [showSpecialDetail,  setShowSpecialDetail]  = useState(false);

  // ── DemandeTempsModal ──────────────────────────────────────
  const [demandeAudit,  setDemandeAudit]  = useState(null);
  const [showDemande,   setShowDemande]   = useState(false);

  // ── ModifierAuditModal ─────────────────────────────────────
  const [modifAudit, setModifAudit] = useState(null);
  const [showModifModal, setShowModifModal] = useState(false);

  // ── Modal Auto-planification (auditeur) ─────────────────────
  const [showCreerRegle,  setShowCreerRegle]  = useState(false);
  const [showCreerExport, setShowCreerExport] = useState(false);

  useEffect(() => {
    const planificationId = searchParams.get('planificationId') || '';
    if (planificationId !== filterPlanif) {
      setFilterPlanif(planificationId);
    }
  }, [searchParams, filterPlanif]);

  useEffect(() => {
    const current = searchParams.get('planificationId') || '';
    if (current === filterPlanif) return;
    const next = new URLSearchParams(searchParams);
    if (filterPlanif) next.set('planificationId', filterPlanif);
    else next.delete('planificationId');
    setSearchParams(next, { replace: true });
  }, [filterPlanif, searchParams, setSearchParams]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [ar, pr, rr, er] = await Promise.all([
        fetch(`http://localhost:8080/api/audit-produit/mes-audits${filterPlanif ? `?planificationId=${filterPlanif}` : ''}`, { headers: apiH() }),
        fetch('http://localhost:8080/api/planification', { headers: apiH() }),
        auditSpecialAPI.mesAuditsReglePlates().catch(() => ({ data: [] })),
        auditSpecialAPI.mesAuditsExport().catch(() => ({ data: [] })),
      ]);
      const audits = await ar.json(); const planif = await pr.json();
      const list = Array.isArray(audits) ? audits : [];
      const cur = new Set(list.map(a => a.id));
      const known = loadSet(STORAGE_KNOWN), nouv = loadSet(STORAGE_NEW);
      list.forEach(a => {
        if (a.statut !== 'PLANIFIE') {
          nouv.delete(a.id);
          return;
        }
        if (!known.has(a.id)) nouv.add(a.id);
      });
      const trim = new Set([...nouv].filter(id => cur.has(id)));
      saveSet(STORAGE_NEW, trim); saveSet(STORAGE_KNOWN, new Set([...known, ...cur]));
      setNouveauxIds(trim);
      if (trim.size > 0 && !sessionStorage.getItem(STORAGE_BANNER)) setBannerDismissed(false);
      setAuditsProduit(list); setPlanifs(Array.isArray(planif) ? planif : []);
      setAuditsRegle(Array.isArray(rr.data) ? rr.data : []);
      setAuditsExport(Array.isArray(er.data) ? er.data : []);
    } catch(e) { console.error(e); }
    setLoading(false);
  }, [filterPlanif]);

  useEffect(() => { load(); const t = setInterval(load, 30000); return () => clearInterval(t); }, [load]);

  // ── Check saved audit context on page arrival ──
  useEffect(() => {
    if (!loading) {
      try {
        const ctx = JSON.parse(localStorage.getItem('pap:last-audit-context') || '{}');
        if (ctx.auditType === 'regle-plate' && auditsRegle.length > 0) {
          setActiveCard('regles');
        } else if (ctx.auditType === 'export' && auditsExport.length > 0) {
          setActiveCard('magasin');
        }
        localStorage.removeItem('pap:last-audit-context');
      } catch {}
    }
  }, [loading, auditsRegle.length, auditsExport.length]);

  const deleteAudit = async id => {
    if (!window.confirm('Voulez-vous supprimer cet audit ?')) return;
    try {
      await fetch(`http://localhost:8080/api/audit-produit/${id}`, { method:'DELETE', headers:apiH() });
      setAuditsProduit(p => p.filter(a => a.id !== id));
    } catch(e) { alert(e.message); }
  };

  const markAllRead = useCallback(() => {
    setNouveauxIds(() => { const n = new Set(); saveSet(STORAGE_NEW, n); return n; });
    setBannerDismissed(true);
    sessionStorage.setItem(STORAGE_BANNER, '1');
  }, []);

  const markAuditSeen = useCallback((auditId) => {
    if (!auditId) return;
    setNouveauxIds(prev => {
      if (!prev.has(auditId)) return prev;
      const next = new Set(prev);
      next.delete(auditId);
      saveSet(STORAGE_NEW, next);
      return next;
    });
  }, []);

  const handleStartProduit = useCallback(async (audit, ro = false) => {
    markAuditSeen(audit.id);
    
    // ✅ L'auditeur peut continuer même en retard (pas de blocage)
    
    if (ro) { navigate(`/auditeur/audits/${audit.id}?readonly=1`); return; }
    setStartedIds(p => { const n = new Set(p); n.add(audit.id); saveSet(STORAGE_STARTED, n); return n; });
    navigate(`/auditeur/audits/${audit.id}`);
    if (audit.statut === 'PLANIFIE') auditProduitAPI.demarrer(audit.id).then(() => setAuditsProduit(p => p.map(a => a.id === audit.id ? { ...a, statut:'EN_COURS' } : a))).catch(() => {});
  }, [navigate, markAuditSeen]);

  const handleViewDetail = useCallback((auditId, type = null) => {
    if (type && ['regle', 'export'].includes(type)) {
      const sourceList = type === 'regle' ? auditsRegle : auditsExport;
      const audit = sourceList.find(a => a.id === auditId);
      if (audit) {
        if (audit.statut !== 'PLANIFIE') markAuditSeen(audit.id);
        setSpecialAuditDetail({ audit, type });
        setShowSpecialDetail(true);
      }
    } else {
      markAuditSeen(auditId);
      setDrawerAuditId(auditId);
      setShowDrawer(true);
    }
  }, [auditsRegle, auditsExport, markAuditSeen]);

  const handleModifierAudit = useCallback((audit) => {
    setModifAudit(audit);
    setShowModifModal(true);
  }, []);

  const handleDemandeTemps = useCallback((audit) => {
    setDemandeAudit(audit);
    setShowDemande(true);
  }, []);

  const handleStartSpecial = useCallback(audit => {
    // ✅ L'auditeur peut continuer même en retard (pas de blocage)
    
    const type = audit.typeAudit === 'AUDIT_REGLES_PLATES' ? 'regle-plate' : 'export';
    const sourceList = audit.typeAudit === 'AUDIT_REGLES_PLATES' ? auditsRegle : auditsExport;
    const restNv = sourceList.filter(a => a.id !== audit.id && a.statut === 'PLANIFIE').length;
    if (audit.statut !== 'PLANIFIE') markAuditSeen(audit.id);
    if (restNv === 0 && nouveauxIds.size === 0) {
      setBannerDismissed(true);
      sessionStorage.setItem(STORAGE_BANNER, '1');
    }
    navigate(`/auditeur/audits-special/${type}/${audit.id}`);
  }, [navigate, auditsRegle, auditsExport, nouveauxIds, markAuditSeen]);

  const nvProduit = nouveauxIds.size;
  const nvExport  = auditsExport.filter(a => a.statut === 'PLANIFIE').length;
  const nvRegle   = auditsRegle.filter(a => a.statut === 'PLANIFIE').length;
  const nbRetard  = auditsProduit.filter(a => isEnRetard(a) && a.statut !== 'TERMINE').length;

  const filtAudits = auditsProduit.filter(a => {
    const mSt  = filterStatut === 'TOUS' || a.statut === filterStatut || (filterStatut === 'EN_RETARD' && isEnRetard(a));
    const mTxt = !search || [a.reference, a.serieNom, a.projetNom].some(v => (v||'').toLowerCase().includes(search.toLowerCase()));
    return mSt && mTxt;
  });
  const filtRegle  = auditsRegle.filter(a => !search || [a.reference, a.plantNom].some(v => (v||'').toLowerCase().includes(search.toLowerCase())));
  const filtExport = auditsExport.filter(a => !search || [a.reference, a.zoneExpedition, a.semaineExport].some(v => (v||'').toLowerCase().includes(search.toLowerCase())));
  const sortedProduitAudits = [...filtAudits].sort((a, b) => {
    const aTime = a.deadline ? new Date(a.deadline).getTime() : Number.POSITIVE_INFINITY;
    const bTime = b.deadline ? new Date(b.deadline).getTime() : Number.POSITIVE_INFINITY;
    if (aTime !== bTime) return aTime - bTime;

    const aRetard = isEnRetard(a) ? 0 : 1;
    const bRetard = isEnRetard(b) ? 0 : 1;
    if (aRetard !== bRetard) return aRetard - bRetard;

    return String(a.reference || '').localeCompare(String(b.reference || ''));
  });
  const PRODUIT_PAGE_SIZE = 15;
  const produitTotalPages = Math.max(1, Math.ceil(sortedProduitAudits.length / PRODUIT_PAGE_SIZE));
  const produitPageSafe = Math.min(produitPage, produitTotalPages);
  const produitPageItems = sortedProduitAudits.slice((produitPageSafe - 1) * PRODUIT_PAGE_SIZE, produitPageSafe * PRODUIT_PAGE_SIZE);

  useEffect(() => {
    setProduitPage(1);
  }, [activeCard, filterPlanif, filterStatut, search]);

  useEffect(() => {
    setProduitPage(prev => Math.min(prev, produitTotalPages));
  }, [produitTotalPages]);

  return (
    <div style={{ fontFamily:"'Inter','DM Sans',sans-serif", background:'#ffffff', minHeight:'100vh', padding:'1.5rem 2rem' }}>
      <style>{`
        @keyframes fadeUp { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:none} }
        @keyframes pulse  { 0%,100%{opacity:1} 50%{opacity:.4} }
        @keyframes spin   { to{transform:rotate(360deg)} }
      `}</style>

      {/* ── Header / Banner ── */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20, flexWrap:'wrap', gap:12 }}>

        {/* Banner audits en retard */}
        {nbRetard > 0 && (
          <div style={{
            display:'flex', alignItems:'center', justifyContent:'space-between', gap:12,
            background:'#fff', border:`1px solid ${T.dangerBd}`, borderLeft:`3px solid ${T.danger}`,
            borderRadius:10, padding:'10px 16px', marginBottom:22, width:'100%',marginTop:-30,
            boxShadow:'0 1px 6px rgba(220,38,38,.08)',
          }}>
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <span style={{ color:T.danger, animation:'pulse 2s infinite', display:'flex', alignItems:'center' }}>{Ic.alert}</span>
              <span style={{ fontSize:'.82rem', fontWeight:600, color:T.danger }}>
                <strong>{nbRetard}</strong> audit{nbRetard > 1 ? 's' : ''} en retard — Vous pouvez continuer l'audit, mais la deadline est dépassée.
              </span>
            </div>
          </div>
        )}

        {/* Banner nouveaux audits */}
        {(nvProduit > 0 || nvExport > 0 || nvRegle > 0) && !bannerDismissed && (
          <div style={{
            display:'flex', alignItems:'center', justifyContent:'space-between', gap:12,
            background:'#fff', border:`1px solid ${T.g300}`, borderLeft:`3px solid ${T.navy}`,
            borderRadius:10, padding:'10px 16px', marginBottom:23,marginTop:-20,
            boxShadow:'0 1px 6px rgba(0,0,0,.06)', width:'100%',
          }}>
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <span style={{ color:T.navy, animation:'pulse 2s infinite', display:'flex', alignItems:'center' }}>{Ic.bell}</span>
              <span style={{ fontSize:'.82rem', fontWeight:600, color:T.navy, display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
                {nvProduit > 0 && <span style={{ background:T.blueL, color:T.blue, borderRadius:99, padding:'2px 9px', fontSize:'.72rem', fontWeight:700 }}>{nvProduit} produit{nvProduit>1?'s':''}</span>}
                {nvExport > 0 && <span style={{ background:T.purpleBg, color:T.purple, borderRadius:99, padding:'2px 9px', fontSize:'.72rem', fontWeight:700 }}>{nvExport} export{nvExport>1?'s':''}</span>}
                {nvRegle > 0 && <span style={{ background:T.tealBg, color:T.teal, borderRadius:99, padding:'2px 9px', fontSize:'.72rem', fontWeight:700 }}>{nvRegle} règle{nvRegle>1?'s':''} plate{nvRegle>1?'s':''}</span>}
                <span style={{ color:T.g400, fontWeight:400 }}>nouvel{(nvProduit+nvExport+nvRegle)>1?'les':''} audit{(nvProduit+nvExport+nvRegle)>1?'s':''} assigné{(nvProduit+nvExport+nvRegle)>1?'s':''}</span>
              </span>
            </div>
            <button onClick={markAllRead} style={{ background:'none', border:`1px solid ${T.g200}`, borderRadius:7, padding:'4px 12px', fontSize:'.75rem', color:T.g500, cursor:'pointer', fontFamily:'inherit', fontWeight:600, flexShrink:0, transition:'all .15s' }}
              onMouseEnter={e => { e.currentTarget.style.background=T.g50; e.currentTarget.style.borderColor=T.g300; }}
              onMouseLeave={e => { e.currentTarget.style.background='none'; e.currentTarget.style.borderColor=T.g200; }}>
              Marquer comme lu
            </button>
          </div>
        )}
      </div>

      {/* ── Stat Cards ── */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:14, marginBottom:20, marginTop:-30 }}>
        <StatCard
          title="Audit Produit" count={auditsProduit.length}
          desc={`${auditsProduit.filter(a=>a.statut==='EN_COURS').length} en cours · ${auditsProduit.filter(a=>a.statut==='TERMINE').length} terminés${nbRetard>0?` · ${nbRetard} en retard`:''}`}
          icon={Ic.micro} color={T.blue} bg={T.blueL}
          active={activeCard==='produit'} onClick={() => setActiveCard('produit')} badge={nvProduit}
        />
        <StatCard
          title="Magasin Export" count={auditsExport.length}
          desc={`${nvExport} nouveau${nvExport>1?'x':''} · contrôle avant expédition`}
          icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={T.purple} strokeWidth="2" strokeLinecap="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>}
          color={T.purple} bg={T.purpleBg}
          active={activeCard==='magasin'} onClick={() => setActiveCard('magasin')} badge={nvExport}
        />
        <StatCard
          title="Règles Plates" count={auditsRegle.length}
          desc={`${nvRegle} nouveau${nvRegle>1?'x':''} · contrôle instruments`}
          icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={T.teal} strokeWidth="2" strokeLinecap="round"><line x1="5" y1="12" x2="19" y2="12"/><line x1="5" y1="6" x2="19" y2="6"/><line x1="5" y1="18" x2="19" y2="18"/></svg>}
          color={T.teal} bg={T.tealBg}
          active={activeCard==='regles'} onClick={() => setActiveCard('regles')} badge={nvRegle}
        />
      </div>

      {/* ── Barre recherche + filtres ── */}
      <div style={{ background:'#fff', borderRadius:12, border:`1px solid ${T.g200}`, padding:'12px 16px', marginBottom:16, display:'flex', gap:12, alignItems:'center', flexWrap:'wrap', boxShadow:'0 1px 4px rgba(0,0,0,.04)' }}>
        <div style={{ flex:1, minWidth:200, display:'flex', alignItems:'center', gap:8, background:T.g50, borderRadius:8, padding:'8px 12px', border:`1px solid ${T.g300}` }}>
          <span style={{ color:T.g400 }}>{Ic.search}</span>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher par référence, série, projet…"
            style={{ flex:1, border:'none', background:'transparent', outline:'none', fontSize:'.83rem', fontFamily:'inherit', color:T.g700 }}/>
        </div>
        {activeCard === 'produit' && (
          <>
            <div style={{ display:'flex', alignItems:'center', gap:6, color:T.g400 }}>
              {Ic.filter}
              <select value={filterPlanif} onChange={e => setFilterPlanif(e.target.value)}
                style={{ border:`1px solid ${T.g300}`, borderRadius:8, padding:'7px 10px', fontSize:'.8rem', fontFamily:'inherit', color:T.g700, background:'#fff', cursor:'pointer' }}>
                <option value="">Toutes les planifications</option>
                {planifs.map(p => <option key={p.id} value={p.id}>{p.nom}</option>)}
              </select>
            </div>
            <select value={filterStatut} onChange={e => setFilterStatut(e.target.value)}
              style={{ border:`1px solid ${T.g300}`, borderRadius:8, padding:'7px 10px', fontSize:'.8rem', fontFamily:'inherit', color:T.g700, background:'#fff', cursor:'pointer' }}>
              <option value="TOUS">Tous les statuts</option>
              {Object.entries(STATUT_CFG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          </>
        )}

        {activeCard === 'regles' && (
          <button onClick={() => setShowCreerRegle(true)}
            style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'0 14px', height:'38px', boxSizing:'border-box', borderRadius:9, border:'none', background:'linear-gradient(135deg,#0D9488,#0F766E)', color:'#fff', fontWeight:700, fontSize:'.8rem', cursor:'pointer', fontFamily:"'Inter',sans-serif", boxShadow:'0 4px 12px rgba(13,148,136,.3)', whiteSpace:'nowrap' }}>
            {Ic.plus} Nouvelle planification
          </button>
        )}
        {activeCard === 'magasin' && (
          <button onClick={() => setShowCreerExport(true)}
            style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'0 14px', height:'38px', boxSizing:'border-box', borderRadius:9, border:'none', background:'linear-gradient(135deg,#7C3AED,#6D28D9)', color:'#fff', fontWeight:700, fontSize:'.8rem', cursor:'pointer', fontFamily:"'Inter',sans-serif", boxShadow:'0 4px 12px rgba(124,58,237,.3)', whiteSpace:'nowrap' }}>
            {Ic.plus} Nouvelle planification
          </button>
        )}

        <span style={{ fontSize:'.73rem', color:T.g400, fontWeight:600, flexShrink:0 }}>
          {activeCard==='produit' ? filtAudits.length : activeCard==='magasin' ? filtExport.length : filtRegle.length} résultat(s)
        </span>
      </div>

      {/* ── Contenu ── */}
      <div style={{ animation:'fadeUp .3s ease' }}>

        {/* PRODUIT */}
        {activeCard === 'produit' && (
          loading ? (
            <div style={{ textAlign:'center', padding:'4rem', color:T.g400 }}>
              <div style={{ width:32, height:32, border:`3px solid ${T.g200}`, borderTopColor:T.navy, borderRadius:'50%', animation:'spin .8s linear infinite', margin:'0 auto 12px' }}/>
              Chargement…
            </div>
          ) : sortedProduitAudits.length === 0 ? (
            <div style={{ textAlign:'center', padding:'4rem 2rem', background:'#fff', borderRadius:16, border:`1.5px dashed ${T.g200}` }}>
              <div style={{ width:56, height:56, borderRadius:16, background:T.g50, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 14px', color:T.g300 }}>{Ic.micro}</div>
              <div style={{ fontWeight:700, color:T.g500, marginBottom:6 }}>Aucun audit trouvé</div>
              <div style={{ fontSize:'.8rem', color:T.g400 }}>Modifiez vos filtres ou attendez qu'un expert vous assigne un audit.</div>
            </div>
          ) : (
            <>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(340px,1fr))', gap:20 }}>
              {produitPageItems.map(a => (
                <ProduitCard
                  key={a.id}
                  audit={{ ...a, started: startedIds.has(a.id) }}
                  nouveau={nouveauxIds.has(a.id)}
                  onView={handleStartProduit}
                  onViewDetail={handleViewDetail}
                  onDelete={deleteAudit}
                  onDemandeTemps={handleDemandeTemps}
                  onModifier={handleModifierAudit}
                />
              ))}
            </div>
            {produitTotalPages > 1 && (
              <div style={{ display:'flex', justifyContent:'center', marginTop:18, width:'100%' }}>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8, flexWrap:'wrap', width:'fit-content', maxWidth:'100%' }}>
                  <button
                    onClick={() => setProduitPage(p => Math.max(1, p - 1))}
                    disabled={produitPageSafe === 1}
                    style={{
                      padding:'8px 12px', borderRadius:8, border:`1px solid ${T.g300}`,
                      background: produitPageSafe === 1 ? T.g100 : '#fff', color: produitPageSafe === 1 ? T.g400 : T.g700,
                      cursor: produitPageSafe === 1 ? 'not-allowed' : 'pointer', fontSize:'.8rem', fontWeight:700,
                    }}
                  >
                    Précédent
                  </button>
                  {Array.from({ length: produitTotalPages }, (_, idx) => idx + 1).map(page => (
                    <button
                      key={page}
                      onClick={() => setProduitPage(page)}
                      style={{
                        width:36, height:36, borderRadius:8, border:`1px solid ${page === produitPageSafe ? T.navy : T.g300}`,
                        background: page === produitPageSafe ? T.navy : '#fff',
                        color: page === produitPageSafe ? '#fff' : T.g700,
                        cursor:'pointer', fontSize:'.8rem', fontWeight:800,
                        flexShrink:0,
                      }}
                    >
                      {page}
                    </button>
                  ))}
                  <button
                    onClick={() => setProduitPage(p => Math.min(produitTotalPages, p + 1))}
                    disabled={produitPageSafe === produitTotalPages}
                    style={{
                      padding:'8px 12px', borderRadius:8, border:`1px solid ${T.g300}`,
                      background: produitPageSafe === produitTotalPages ? T.g100 : '#fff', color: produitPageSafe === produitTotalPages ? T.g400 : T.g700,
                      cursor: produitPageSafe === produitTotalPages ? 'not-allowed' : 'pointer', fontSize:'.8rem', fontWeight:700,
                    }}
                  >
                    Suivant
                  </button>
                </div>
              </div>
            )}
            </>
          )
        )}

        {/* MAGASIN EXPORT */}
        {activeCard === 'magasin' && (
          loading ? <div style={{ textAlign:'center', padding:'4rem', color:T.g400 }}>Chargement…</div> :
          filtExport.length === 0 ? (
            <div style={{ textAlign:'center', padding:'4rem 2rem', background:'#fff', borderRadius:16, border:`1.5px dashed ${T.g200}` }}>
              <div style={{ width:56, height:56, borderRadius:16, background:T.purpleBg, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 14px', color:T.purple }}>
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={T.purple} strokeWidth="1.8" strokeLinecap="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>
              </div>
              <div style={{ fontWeight:700, color:T.g500, marginBottom:6 }}>Aucun audit magasin export assigné</div>
              <div style={{ fontSize:'.8rem', color:T.g400 }}>Les audits export vous seront assignés par votre expert, ou planifiez-en un vous-même.</div>
            </div>
          ) : (
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(340px,1fr))', gap:20 }}>
              {filtExport.map(a => <SpecialCard key={a.id} audit={a} type="export" onStart={handleStartSpecial} onViewDetail={handleViewDetail} onModifier={handleModifierAudit}/>)}
            </div>
          )
        )}

        {/* RÈGLES PLATES */}
        {activeCard === 'regles' && (
          loading ? <div style={{ textAlign:'center', padding:'4rem', color:T.g400 }}>Chargement…</div> :
          filtRegle.length === 0 ? (
            <div style={{ textAlign:'center', padding:'4rem 2rem', background:'#fff', borderRadius:16, border:`1.5px dashed ${T.g200}` }}>
              <div style={{ width:56, height:56, borderRadius:16, background:T.tealBg, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 14px', color:T.teal }}>
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={T.teal} strokeWidth="1.8" strokeLinecap="round"><line x1="5" y1="12" x2="19" y2="12"/><line x1="5" y1="6" x2="19" y2="6"/><line x1="5" y1="18" x2="19" y2="18"/></svg>
              </div>
              <div style={{ fontWeight:700, color:T.g500, marginBottom:6 }}>Aucun audit règle plate assigné</div>
              <div style={{ fontSize:'.8rem', color:T.g400 }}>Les audits règle plate vous seront assignés par votre expert, ou planifiez-en un vous-même.</div>
            </div>
          ) : (
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(340px,1fr))', gap:20 }}>
              {filtRegle.map(a => <SpecialCard key={a.id} audit={a} type="regle" onStart={handleStartSpecial} onViewDetail={handleViewDetail} onModifier={handleModifierAudit}/>)}
            </div>
          )
        )}
      </div>

      {/* ── AuditDetailDrawer ── */}
      <AuditDetailDrawer
        auditId={drawerAuditId}
        open={showDrawer}
        onClose={() => { setShowDrawer(false); setDrawerAuditId(null); }}
      />

      {/* ── SpecialAuditDetailModal ── */}
      <SpecialAuditDetailModal
        detail={specialAuditDetail}
        open={showSpecialDetail}
        onClose={() => { setShowSpecialDetail(false); setSpecialAuditDetail(null); }}
      />

      {/* ── ModifierAuditModal ── */}
      <ModifierAuditModal
        audit={modifAudit}
        open={showModifModal}
        onClose={() => { setShowModifModal(false); setModifAudit(null); }}
        onSuccess={() => { setShowModifModal(false); setModifAudit(null); load(); }}
      />

      {/* ── DemandeTempsModal ── */}
      <DemandeTempsModal
        audit={demandeAudit}
        open={showDemande}
        onClose={() => { setShowDemande(false); setDemandeAudit(null); }}
        onSuccess={() => { setShowDemande(false); setDemandeAudit(null); load(); }}
      />
      {/* ── Modal Créer Règle Plate (auditeur) ── */}
      {showCreerRegle && (
        <CreerReglePlateAuditeurModal
          onClose={() => setShowCreerRegle(false)}
          onSuccess={() => load()}
        />
      )}

      {/* ── Modal Créer Export (auditeur) ── */}
      {showCreerExport && (
        <CreerExportAuditeurModal
          onClose={() => setShowCreerExport(false)}
          onSuccess={() => load()}
        />
      )}
    </div>
  );
}