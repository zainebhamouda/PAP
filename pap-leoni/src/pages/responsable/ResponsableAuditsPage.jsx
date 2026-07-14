// ═══════════════════════════════════════════════════════════════
// ResponsableDashboard.jsx
// Design : clair, aéré, graphes barres horizontales rectangles
// Palette pastel / bleu doux / blanc
// ═══════════════════════════════════════════════════════════════
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const C = {
  certifie:  '#16A34A', certifieBg:  '#F0FDF4',
  bloque:    '#DC2626', bloqueBg:    '#FEF2F2',
  enCours:   '#D97706', enCoursBg:   '#FFFBEB',
  nonCertif: '#6B7280', nonCertifBg: '#F8FAFC',
  planifie:  '#2563EB', planifieBg:  '#EFF6FF',
  termine:   '#059669', termineBg:   '#ECFDF5',
  retard:    '#DC2626', retardBg:    '#FEF2F2',
  pdca:      '#D97706', pdcaBg:      '#FFFBEB',
  navy:      '#1E3A5F',
  text:      '#1E293B',
  muted:     '#64748B',
  border:    '#E2E8F0',
  card:      '#FFFFFF',
  page:      '#F8FAFC',
};

const STATUTS_MAP = {
  FORMATION_OBLIGATOIRE: { label:'Formation',      bg:'#EDE9FE', c:'#7C3AED' },
  THEORIQUE_EN_COURS:    { label:'Théo. en cours', bg:'#DBEAFE', c:'#1D4ED8' },
  THEORIQUE_ECHOUE:      { label:'Théo. échoué',   bg:'#FEE2E2', c:'#DC2626' },
  PRATIQUE_EN_COURS:     { label:'Pratique',       bg:'#EDE9FE', c:'#7C3AED' },
  PRATIQUE_ECHOUE:       { label:'Prat. échoué',   bg:'#FEE2E2', c:'#DC2626' },
  REUSSI:                { label:'Qualifié ✓',     bg:'#DCFCE7', c:'#16A34A' },
  CERTIFIE:              { label:'Certifié ✓',     bg:'#DCFCE7', c:'#16A34A' },
  BLOQUE:                { label:'Bloqué',         bg:'#FEE2E2', c:'#DC2626' },
  ANNULE:                { label:'Annulé',         bg:'#F1F5F9', c:'#94A3B8' },
};

const fmtDate = d => d ? new Date(d).toLocaleDateString('fr-FR', { day:'2-digit', month:'short' }) : '—';

// ── Graphe barres horizontales rectangles ─────────────────────
function HBarChart({ title, rows, total }) {
  const [go, setGo] = useState(false);
  useEffect(() => { const t = setTimeout(() => setGo(true), 300); return () => clearTimeout(t); }, []);

  return (
    <div style={{ background: C.card, borderRadius: 14, border: `1px solid ${C.border}`, padding: '1rem 1.2rem', flex: 1, minWidth: 0 }}>
      <div style={{ fontSize: '.7rem', fontWeight: 800, color: C.muted, textTransform: 'uppercase', letterSpacing: '.09em', marginBottom: '.85rem' }}>{title}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '.5rem' }}>
        {rows.filter(r => r.value != null).map((row, i) => {
          const pct = total > 0 ? Math.min(100, Math.round((row.value / total) * 100)) : 0;
          return (
            <div key={i}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 8, height: 8, borderRadius: 2, background: row.color, flexShrink: 0 }} />
                  <span style={{ fontSize: '.77rem', fontWeight: 600, color: C.text }}>{row.label}</span>
                </div>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <span style={{ fontSize: '.77rem', fontWeight: 800, color: row.color }}>{row.value}</span>
                  <span style={{ fontSize: '.68rem', color: C.muted, minWidth: 32, textAlign: 'right' }}>{pct}%</span>
                </div>
              </div>
              {/* Barre rectangulaire */}
              <div style={{ height: 10, background: '#F1F5F9', borderRadius: 4, overflow: 'hidden' }}>
                <div style={{
                  height: '100%',
                  width: go ? `${pct}%` : '0%',
                  background: row.color,
                  borderRadius: 4,
                  transition: `width 1.1s cubic-bezier(.4,0,.2,1) ${i * 90}ms`,
                  opacity: .85,
                }} />
              </div>
            </div>
          );
        })}
      </div>
      <div style={{ marginTop: '.7rem', paddingTop: '.55rem', borderTop: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '.68rem', color: C.muted, fontWeight: 600 }}>Total</span>
        <span style={{ fontSize: '.82rem', fontWeight: 800, color: C.text }}>{total}</span>
      </div>
    </div>
  );
}

// ── KPI compact ───────────────────────────────────────────────
function KpiCard({ label, value, color, bg, sub, onClick }) {
  return (
    <div onClick={onClick}
      style={{ background: bg || '#fff', borderRadius: 13, padding: '.9rem 1rem', border: `1.5px solid ${color}2A`, cursor: onClick ? 'pointer' : 'default', transition: 'all .16s', boxShadow: '0 1px 3px rgba(0,0,0,.04)' }}
      onMouseEnter={e => onClick && (e.currentTarget.style.transform='translateY(-2px)', e.currentTarget.style.boxShadow=`0 6px 14px ${color}1A`)}
      onMouseLeave={e => onClick && (e.currentTarget.style.transform='none', e.currentTarget.style.boxShadow='0 1px 3px rgba(0,0,0,.04)')}>
      <div style={{ fontSize: '1.9rem', fontWeight: 900, color, lineHeight: 1 }}>{value ?? '—'}</div>
      <div style={{ fontSize: '.76rem', fontWeight: 700, color: C.text, marginTop: 5 }}>{label}</div>
      {sub && <div style={{ fontSize: '.67rem', color: C.muted, marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

export default function ResponsableDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [dash, setDash] = useState({});

  const load = useCallback(async () => {
    setLoading(true);
    try { const r = await api.get('/responsable-centrale/dashboard'); setDash(r.data || {}); }
    catch { setDash({}); }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'55vh', gap:10, color: C.muted }}>
      <div style={{ width:22, height:22, border:`2.5px solid ${C.border}`, borderTopColor: C.navy, borderRadius:'50%', animation:'dbs .7s linear infinite' }}/>
      <style>{`@keyframes dbs{to{transform:rotate(360deg)}}`}</style>
      Chargement…
    </div>
  );

  const heure = new Date().getHours();
  const salut = heure < 12 ? 'Bonjour' : heure < 18 ? 'Bon après-midi' : 'Bonsoir';

  const totalAud   = dash.totalAuditeurs || 0;
  const certifies  = dash.certifies || 0;
  const bloques    = dash.bloques || 0;
  const enCours    = dash.enCours || 0;
  const nonCertif  = dash.nonCertifies || 0;
  const totalAudits = dash.totalAudits || 0;
  const enRetard   = dash.auditsEnRetard || 0;
  const qkDep      = dash.auditsQkDepasses || 0;
  const pdcaOuv    = dash.auditsPdcaOuverts || 0;

  return (
    <div style={{ fontFamily:"'DM Sans',system-ui,sans-serif", background: C.page }}>
      <style>{`
        @keyframes dbs    { to{transform:rotate(360deg)} }
        @keyframes dbFadeUp { from{opacity:0;transform:translateY(7px)} to{opacity:1;transform:none} }
        @keyframes dbPulse  { 0%,100%{opacity:1} 50%{opacity:.4} }
        .db-hover:hover { background:#EFF6FF !important; }
      `}</style>

      {/* ── BANNIÈRE ─────────────────────────────────────────── */}
      <div style={{ background:`linear-gradient(135deg,${C.navy} 0%,#2D5A8E 100%)`, borderRadius:18, padding:'1.4rem 1.8rem', marginBottom:'1.4rem', position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', right:-30, top:-30, width:180, height:180, borderRadius:'50%', border:'1px solid rgba(255,255,255,.06)', pointerEvents:'none' }}/>
        <div style={{ position:'relative', zIndex:1, display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:10 }}>
          <div>
            <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:4 }}>
              <span style={{ width:6, height:6, borderRadius:'50%', background:'#4ADE80', boxShadow:'0 0 6px #4ADE80', animation:'dbPulse 2s infinite', display:'inline-block' }}/>
              <span style={{ color:'rgba(255,255,255,.38)', fontSize:'.65rem', fontWeight:700, letterSpacing:'.1em', textTransform:'uppercase' }}>Responsable Qualité Centrale · Leoni</span>
            </div>
            <h1 style={{ margin:0, color:'#fff', fontSize:'1.45rem', fontWeight:800, letterSpacing:'-.02em' }}>
              {salut}, <span style={{ color:'#93C5FD' }}>{user?.prenom || user?.nom}</span>
            </h1>
            <p style={{ margin:'3px 0 0', color:'rgba(255,255,255,.32)', fontSize:'.78rem' }}>
              {dash.totalSites||0} sites · {totalAud} auditeurs · {totalAudits} audits
            </p>
          </div>
          <div style={{ display:'flex', gap:7 }}>
            {[
              { v:`${dash.tauxCertif||0}%`, l:'Taux certif.', c:'#86EFAC' },
              { v:certifies,                l:'Certifiés',    c:'#93C5FD' },
              { v:bloques,                  l:'Bloqués',      c:'#FCA5A5' },
            ].map((b,i)=>(
              <div key={i} style={{ background:'rgba(255,255,255,.1)', borderRadius:11, padding:'7px 13px', textAlign:'center', border:'1px solid rgba(255,255,255,.08)' }}>
                <div style={{ fontSize:'1.15rem', fontWeight:900, color:b.c, lineHeight:1 }}>{b.v}</div>
                <div style={{ fontSize:'.58rem', color:'rgba(255,255,255,.32)', fontWeight:600, marginTop:1 }}>{b.l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── ALERTE ───────────────────────────────────────────── */}
      {bloques > 0 && (
        <div style={{ display:'flex', alignItems:'center', gap:11, background:'#FEF2F2', border:'1px solid #FECACA', borderRadius:11, padding:'9px 14px', marginBottom:'1.2rem' }}>
          <span style={{ fontSize:'1rem' }}>🔒</span>
          <div style={{ flex:1 }}>
            <p style={{ margin:0, fontWeight:800, fontSize:'.82rem', color:'#991B1B' }}>{bloques} auditeur{bloques>1?'s':''} bloqué{bloques>1?'s':''}</p>
            <p style={{ margin:'1px 0 0', fontSize:'.7rem', color:'#DC2626' }}>Blocage 6 mois — action recommandée</p>
          </div>
          <button onClick={()=>navigate('/responsable/qualifications')}
            style={{ background:'#DC2626', border:'none', borderRadius:7, padding:'5px 11px', color:'#fff', fontWeight:700, fontSize:'.74rem', cursor:'pointer', fontFamily:'inherit' }}>
            Voir →
          </button>
        </div>
      )}

      {/* ══════════════════════════════════════════════
          SECTION QUALIFICATIONS
      ══════════════════════════════════════════════ */}
      <div style={{ fontSize:'.67rem', fontWeight:800, color:C.muted, textTransform:'uppercase', letterSpacing:'.1em', marginBottom:'.5rem' }}>📋 Qualifications</div>

      {/* KPIs qualifications */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:'.7rem', marginBottom:'1rem', animation:'dbFadeUp .35s ease' }}>
        <KpiCard label="Auditeurs"     value={totalAud}  color={C.navy}      bg="#EFF6FF"         sub={`${dash.totalSites||0} sites`}          onClick={()=>navigate('/responsable/qualifications')}/>
        <KpiCard label="Certifiés"     value={certifies} color={C.certifie}  bg={C.certifieBg}    sub={`${dash.tauxCertif||0}%`}               onClick={()=>navigate('/responsable/qualifications')}/>
        <KpiCard label="En cours"      value={enCours}   color={C.enCours}   bg={C.enCoursBg}     sub="Passage actif"                          onClick={()=>navigate('/responsable/qualifications')}/>
        <KpiCard label="Bloqués"       value={bloques}   color={C.bloque}    bg={C.bloqueBg}      sub="Blocage 6 mois"                         onClick={()=>navigate('/responsable/qualifications')}/>
        <KpiCard label="Non certifiés" value={nonCertif} color={C.nonCertif} bg={C.nonCertifBg}   sub="Sans certification"                     onClick={()=>navigate('/responsable/qualifications')}/>
      </div>

      {/* GRAPHES SUR UNE LIGNE */}
      <div style={{ display:'flex', gap:'1rem', marginBottom:'1.4rem', animation:'dbFadeUp .4s ease' }}>
        <HBarChart
          title="Répartition des qualifications"
          total={totalAud}
          rows={[
            { label:'Certifiés',     value:certifies, color:C.certifie  },
            { label:'En cours',      value:enCours,   color:C.enCours   },
            { label:'Bloqués',       value:bloques,   color:C.bloque    },
            { label:'Non certifiés', value:nonCertif, color:C.nonCertif },
          ]}
        />
        <HBarChart
          title="Planification & audits"
          total={Math.max(totalAudits, 1)}
          rows={[
            { label:'Terminés',   value:Math.max(0, totalAudits - enRetard), color:C.termine  },
            { label:'En retard',  value:enRetard,                            color:C.retard   },
            { label:'QK dépassés',value:qkDep,                               color:'#7C3AED'  },
            { label:'PDCA ouverts',value:pdcaOuv,                            color:C.pdca     },
          ]}
        />
      </div>

      {/* ══════════════════════════════════════════════
          SECTION AUDITS
      ══════════════════════════════════════════════ */}
      <div style={{ fontSize:'.67rem', fontWeight:800, color:C.muted, textTransform:'uppercase', letterSpacing:'.1em', marginBottom:'.5rem' }}>🔍 Audits</div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'.7rem', marginBottom:'1.25rem', animation:'dbFadeUp .45s ease' }}>
        <KpiCard label="Total audits"  value={totalAudits} color="#2563EB" bg="#EFF6FF" onClick={()=>navigate('/responsable/audits')}/>
        <KpiCard label="En retard"     value={enRetard}    color={C.bloque}   bg={C.bloqueBg}   onClick={()=>navigate('/responsable/audits')}/>
        <KpiCard label="QK dépassés"   value={qkDep}       color="#7C3AED"    bg="#F5F3FF"       onClick={()=>navigate('/responsable/audits')}/>
        <KpiCard label="PDCA ouverts"  value={pdcaOuv}     color={C.pdca}     bg={C.pdcaBg}      onClick={()=>navigate('/responsable/audits')}/>
      </div>

      {/* ══════════════════════════════════════════════
          SECTION SITES + PASSAGES RÉCENTS
      ══════════════════════════════════════════════ */}
      <div style={{ display:'grid', gridTemplateColumns:'1.3fr 1fr', gap:'1rem', animation:'dbFadeUp .5s ease' }}>

        {/* Taux par site */}
        {(dash.parSite||[]).length > 0 && (
          <div style={{ background:C.card, borderRadius:14, border:`1px solid ${C.border}`, padding:'1rem 1.2rem' }}>
            <div style={{ fontSize:'.7rem', fontWeight:800, color:C.muted, textTransform:'uppercase', letterSpacing:'.09em', marginBottom:'.85rem' }}>Certification par site</div>
            <div style={{ display:'flex', flexDirection:'column', gap:'.6rem' }}>
              {(dash.parSite||[]).map((s,i)=>{
                const cols=['#2563EB','#059669','#7C3AED','#D97706','#DC2626','#0891B2'];
                const col=cols[i%cols.length];
                return (
                  <div key={i} onClick={()=>navigate('/responsable/multi-site')} style={{ cursor:'pointer' }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:4 }}>
                      <span style={{ fontSize:'.79rem', fontWeight:600, color:C.text }}>{s.nom}</span>
                      <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                        <span style={{ fontSize:'.69rem', color:C.muted }}>{s.certifies}/{s.auditeurs}</span>
                        <span style={{ fontWeight:800, color:col, fontSize:'.8rem' }}>{s.taux||0}%</span>
                      </div>
                    </div>
                    <div style={{ height:9, background:'#F1F5F9', borderRadius:4, overflow:'hidden' }}>
                      <div style={{ height:'100%', width:`${s.taux||0}%`, background:col, borderRadius:4, transition:'width 1s ease' }}/>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Passages récents */}
        <div style={{ background:C.card, borderRadius:14, border:`1px solid ${C.border}`, padding:'1rem 1.2rem', display:'flex', flexDirection:'column' }}>
          <div style={{ fontSize:'.7rem', fontWeight:800, color:C.muted, textTransform:'uppercase', letterSpacing:'.09em', marginBottom:'.85rem' }}>Passages récents</div>
          <div style={{ flex:1 }}>
            {!(dash.derniersPassages||[]).length
              ? <div style={{ textAlign:'center', padding:'1.5rem', color:C.muted, fontSize:'.82rem' }}>Aucun passage</div>
              : (dash.derniersPassages||[]).slice(0,5).map((p,i)=>{
                  const sc=STATUTS_MAP[p.statut]||{bg:'#F1F5F9',c:'#6B7280',label:p.statut};
                  return (
                    <div key={i} className="db-hover"
                      onClick={()=>navigate('/responsable/qualifications')}
                      style={{ display:'flex', alignItems:'center', gap:8, padding:'6px 5px', borderRadius:7, cursor:'pointer', borderBottom:i<4?`1px solid ${C.border}`:'none', transition:'background .1s' }}>
                      <div style={{ width:30, height:30, borderRadius:8, background:'#EFF6FF', color:C.navy, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'.8rem', fontWeight:800, flexShrink:0 }}>
                        {(p.auditeurNom||'?').charAt(0).toUpperCase()}
                      </div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontSize:'.78rem', fontWeight:700, color:C.text, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{p.auditeurNom||'—'}</div>
                        <div style={{ fontSize:'.65rem', color:C.muted }}>{p.auditeurMatricule} · {fmtDate(p.dateDebut)}</div>
                      </div>
                      <span style={{ background:sc.bg, color:sc.c, fontSize:'.62rem', fontWeight:700, padding:'2px 7px', borderRadius:99, whiteSpace:'nowrap', border:`1px solid ${sc.c}20` }}>{sc.label}</span>
                    </div>
                  );
                })}
          </div>
          <button onClick={()=>navigate('/responsable/qualifications')}
            style={{ marginTop:8, padding:'6px', borderRadius:8, border:`1.5px solid ${C.border}`, background:'#F8FAFC', color:'#2563EB', fontWeight:700, fontSize:'.73rem', cursor:'pointer', fontFamily:'inherit', display:'flex', alignItems:'center', justifyContent:'center', gap:5 }}>
            Voir toutes les qualifications →
          </button>
        </div>
      </div>
    </div>
  );
}