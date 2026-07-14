// ═══════════════════════════════════════════════════════════════
// ResponsableMultiSite.jsx  — Navigation par site complète
// Route: /responsable/multi-site
// ═══════════════════════════════════════════════════════════════
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

// ── SVG Icons ──────────────────────────────────────────────────
const Icons = {
  Globe: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/>
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
    </svg>
  ),
  MapPin: () => (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
    </svg>
  ),
  Search: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
    </svg>
  ),
  ChevronRight: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6"/>
    </svg>
  ),
  ChevronLeft: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6"/>
    </svg>
  ),
  AlertTriangle: () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
      <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  ),
  BarChart: () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/>
      <line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/>
    </svg>
  ),
  RefreshCw: () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/>
      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
    </svg>
  ),
  Shield: () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    </svg>
  ),
  Calendar: () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
      <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
      <line x1="3" y1="10" x2="21" y2="10"/>
    </svg>
  ),
  ClipboardCheck: () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/>
      <rect x="9" y="3" width="6" height="4" rx="1" ry="1"/>
      <path d="m9 12 2 2 4-4"/>
    </svg>
  ),
  XCircle: () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/>
      <line x1="9" y1="9" x2="15" y2="15"/>
    </svg>
  ),
  TrendingUp: () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
      <polyline points="17 6 23 6 23 12"/>
    </svg>
  ),
  FileText: () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
      <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
      <polyline points="10 9 9 9 8 9"/>
    </svg>
  ),
  Building: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="2" width="16" height="20" rx="2"/><path d="M9 22v-4h6v4"/>
      <path d="M8 6h.01M16 6h.01M12 6h.01M12 10h.01M8 10h.01M16 10h.01M12 14h.01M8 14h.01M16 14h.01"/>
    </svg>
  ),
  ArrowUpRight: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="7" y1="17" x2="17" y2="7"/><polyline points="7 7 17 7 17 17"/>
    </svg>
  ),
  Users: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  ),
  Activity: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
    </svg>
  ),
};

// ── Palette ──────────────────────────────────────────────────
const SITE_ACCENTS = [
  { h:'#1E40AF', g1:'#1E40AF', g2:'#3B82F6', dot:'#93C5FD', soft:'#EFF6FF', rim:'#BFDBFE' },
  { h:'#166534', g1:'#166534', g2:'#22C55E', dot:'#86EFAC', soft:'#ECFDF5', rim:'#BBF7D0' },
  { h:'#B45309', g1:'#B45309', g2:'#F59E0B', dot:'#FCD34D', soft:'#FFFBEB', rim:'#FDE68A' },
  { h:'#BE185D', g1:'#BE185D', g2:'#EC4899', dot:'#F9A8D4', soft:'#FDF2F8', rim:'#FBCFE8' },
  { h:'#0E7490', g1:'#0E7490', g2:'#06B6D4', dot:'#67E8F9', soft:'#ECFEFF', rim:'#A5F3FC' },
  { h:'#5B21B6', g1:'#5B21B6', g2:'#8B5CF6', dot:'#C4B5FD', soft:'#F5F3FF', rim:'#DDD6FE' },
];

const STATUTS_QUALIF = {
  FORMATION_OBLIGATOIRE: { label:'Formation',      bg:'#F5F3FF', c:'#7C3AED' },
  THEORIQUE_EN_COURS:    { label:'Théo. en cours', bg:'#EFF6FF', c:'#1D4ED8' },
  THEORIQUE_ECHOUE:      { label:'Théo. échoué',   bg:'#FEF2F2', c:'#DC2626' },
  PRATIQUE_EN_COURS:     { label:'Pratique',       bg:'#F5F3FF', c:'#7C3AED' },
  PRATIQUE_ECHOUE:       { label:'Prat. échoué',   bg:'#FEF2F2', c:'#DC2626' },
  REUSSI:                { label:'Qualifié',        bg:'#ECFDF5', c:'#059669' },
  CERTIFIE:              { label:'Certifié',        bg:'#ECFDF5', c:'#059669' },
  BLOQUE:                { label:'Bloqué',          bg:'#FEF2F2', c:'#DC2626' },
  ANNULE:                { label:'Annulé',          bg:'#F9FAFB', c:'#9CA3AF' },
};
const STATUTS_AUDIT = {
  PLANIFIE:  { label:'Planifié',  c:'#0057B8', bg:'#EFF6FF' },
  EN_COURS:  { label:'En cours',  c:'#C8982A', bg:'#FFF4D6' },
  TERMINE:   { label:'Terminé',   c:'#1A7A4A', bg:'#E6F5EE' },
  ANNULE:    { label:'Annulé',    c:'#6B7280', bg:'#F3F4F6' },
  EN_RETARD: { label:'En retard', c:'#C0392B', bg:'#FDECEA' },
};

const fmt = d => d ? new Date(d).toLocaleDateString('fr-FR', { day:'2-digit', month:'short', year:'numeric' }) : '—';
const fmtShort = d => d ? new Date(d).toLocaleDateString('fr-FR', { day:'2-digit', month:'short' }) : '—';
const normText = v => String(v || '').trim();

// ── Composants UI ─────────────────────────────────────────────
function Spinner() {
  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', padding:'4rem', gap:12, color:'#94A3B8', flexDirection:'column' }}>
      <div style={{ width:32, height:32, border:'2px solid #E8EDF7', borderTopColor:'#0B1E3D', borderRadius:'50%', animation:'ms_spin .8s linear infinite' }}/>
      <span style={{ fontSize:'.8rem', fontWeight:600, letterSpacing:'.05em' }}>Chargement en cours…</span>
    </div>
  );
}

function StatutBadge({ statut, map }) {
  const s = (map||STATUTS_QUALIF)[statut] || { label:statut||'—', bg:'#F3F4F6', c:'#6B7280' };
  return <span style={{ background:s.bg, color:s.c, fontSize:'.67rem', fontWeight:700, padding:'3px 8px', borderRadius:99, whiteSpace:'nowrap', border:`1px solid ${s.c}22` }}>{s.label}</span>;
}

function FilterBar({ filters, active, onChange, counts }) {
  return (
    <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:'1rem' }}>
      {filters.map(f => (
        <button key={f.k} onClick={() => onChange(f.k)}
          style={{ display:'inline-flex', alignItems:'center', gap:5, padding:'6px 14px', borderRadius:8,
            border:`1.5px solid ${active===f.k?'#0B1E3D':'#E2E8F0'}`, fontSize:'.76rem', fontWeight:700,
            cursor:'pointer', background:active===f.k?'#0B1E3D':'transparent',
            color:active===f.k?'#fff':'#64748B', fontFamily:'inherit', transition:'all .13s' }}>
          {f.l}
          {counts&&counts[f.k]!=null && (
            <span style={{ background:active===f.k?'rgba(255,255,255,.22)':'#E2E8F0', color:active===f.k?'#fff':'#94A3B8', fontSize:'.6rem', fontWeight:800, padding:'1px 5px', borderRadius:99 }}>{counts[f.k]}</span>
          )}
        </button>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// VUE : LISTE DES SITES — REDESIGN PRO
// ─────────────────────────────────────────────────────────────
function SitesList({ onSelect }) {
  const [sites,   setSites]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState('');
  const [hovered, setHovered] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const r = await api.get('/responsable-centrale/sites');
        setSites(r.data || []);
      } catch { setSites([]); }
      setLoading(false);
    })();
  }, []);

  const filtered = sites.filter(s => !search.trim()
    || s.nom?.toLowerCase().includes(search.toLowerCase())
    || s.localisation?.toLowerCase().includes(search.toLowerCase()));

  if (loading) return <Spinner/>;

  return (
    <div>
      <style>{`
        @keyframes fadeUp {
          from { opacity:0; transform:translateY(16px); }
          to   { opacity:1; transform:translateY(0); }
        }
        @keyframes shimmer {
          0%   { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        .site-card {
          animation: fadeUp .4s ease both;
        }
        .site-card:hover .card-arrow {
          transform: translateX(3px);
          opacity: 1 !important;
        }
        .site-card:hover .card-overlay {
          opacity: 1 !important;
        }
      `}</style>

      {/* Search bar */}
      <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:'1.75rem' }}>
        <div style={{ position:'relative', flex:1, maxWidth:380 }}>
          <span style={{ position:'absolute', left:13, top:'50%', transform:'translateY(-50%)', color:'#94A3B8', display:'flex' }}>
            <Icons.Search/>
          </span>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher un site ou une localisation…"
            style={{
              width:'100%', boxSizing:'border-box',
              padding:'10px 14px 10px 40px',
              borderRadius:10, border:'1.5px solid #E2E8F0',
              fontSize:'.84rem', outline:'none', fontFamily:'inherit',
              background:'#fff', color:'#0B1E3D',
              transition:'border-color .15s, box-shadow .15s',
            }}
            onFocus={e => { e.target.style.borderColor='#0B1E3D'; e.target.style.boxShadow='0 0 0 3px rgba(11,30,61,.07)'; }}
            onBlur={e => { e.target.style.borderColor='#E2E8F0'; e.target.style.boxShadow='none'; }}
          />
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:6, padding:'6px 12px', background:'#F1F5F9', borderRadius:8, border:'1px solid #E2E8F0' }}>
          <Icons.Building/>
          <span style={{ fontSize:'.78rem', fontWeight:700, color:'#64748B' }}>{filtered.length} site{filtered.length!==1?'s':''}</span>
        </div>
      </div>

      {/* Grid */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(2, 1fr)', gap:'1.25rem' }}>
        {filtered.map((site, idx) => {
          const acc = SITE_ACCENTS[idx % SITE_ACCENTS.length];
          const isHov = hovered === site.id;
          const hasAlerts = site.auditsEnRetard > 0 || site.qkDepasses > 0 || site.pdcaOuverts > 0;
          const initials = (site.nom||'?').split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2);

          return (
            <div
              key={site.id}
              className="site-card"
              style={{ animationDelay:`${idx*0.06}s` }}
              onClick={() => onSelect(site)}
              onMouseEnter={() => setHovered(site.id)}
              onMouseLeave={() => setHovered(null)}
            >
              <div style={{
                position:'relative', borderRadius:18, overflow:'hidden',
                cursor:'pointer', border:`1px solid ${isHov ? acc.rim : '#E2E8F0'}`,
                boxShadow: isHov
                  ? `0 20px 48px rgba(11,30,61,.16), 0 4px 12px rgba(11,30,61,.08)`
                  : '0 2px 12px rgba(11,30,61,.06)',
                transform: isHov ? 'translateY(-4px)' : 'translateY(0)',
                transition:'transform .22s ease, box-shadow .22s ease',
                background:'#fff',
              }}>

                {/* ── TOP BAND ─────────────────────────────── */}
                <div style={{
                  background:`linear-gradient(130deg, ${acc.g1} 0%, ${acc.g2} 100%)`,
                  padding:'1.5rem 1.6rem 1.4rem',
                  position:'relative', overflow:'hidden',
                }}>
                  {/* Decorative circles */}
                  <div style={{ position:'absolute', top:-30, right:-30, width:120, height:120, borderRadius:'50%', background:'rgba(255,255,255,.06)', pointerEvents:'none' }}/>
                  <div style={{ position:'absolute', bottom:-40, left:60, width:90, height:90, borderRadius:'50%', background:'rgba(255,255,255,.04)', pointerEvents:'none' }}/>

                  <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', position:'relative' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:14 }}>
                      {/* Logo initiales */}
                      <div style={{
                        width:50, height:50, borderRadius:14,
                        background:'rgba(255,255,255,.14)',
                        border:'1px solid rgba(255,255,255,.2)',
                        backdropFilter:'blur(8px)',
                        display:'flex', alignItems:'center', justifyContent:'center',
                        flexShrink:0,
                      }}>
                        <span style={{ fontSize:'1.1rem', fontWeight:900, color:'#fff', letterSpacing:'-.02em' }}>{initials}</span>
                      </div>

                      <div>
                        <h3 style={{ margin:'0 0 4px', fontSize:'1.05rem', fontWeight:800, color:'#fff', lineHeight:1.2, letterSpacing:'-.01em' }}>
                          {site.nom}
                        </h3>
                        {site.localisation && (
                          <div style={{ display:'flex', alignItems:'center', gap:4, fontSize:'.72rem', color:'rgba(255,255,255,.6)', fontWeight:500 }}>
                            <Icons.MapPin/>
                            {site.localisation}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Arrow indicator */}
                    <div className="card-arrow" style={{
                      width:32, height:32, borderRadius:9,
                      background:'rgba(255,255,255,.15)',
                      display:'flex', alignItems:'center', justifyContent:'center',
                      color:'rgba(255,255,255,.8)',
                      opacity: isHov ? 1 : 0.5,
                      transition:'transform .2s, opacity .2s',
                    }}>
                      <Icons.ChevronRight/>
                    </div>
                  </div>

                  {/* Status dot */}
                  <div style={{ display:'flex', alignItems:'center', gap:6, marginTop:'1rem' }}>
                    <div style={{ width:7, height:7, borderRadius:'50%', background: hasAlerts ? '#FCA5A5' : acc.dot, boxShadow:`0 0 0 2px rgba(255,255,255,.3)` }}/>
                    <span style={{ fontSize:'.68rem', fontWeight:600, color:'rgba(255,255,255,.55)', textTransform:'uppercase', letterSpacing:'.08em' }}>
                      {hasAlerts ? 'Alertes actives' : 'Opérationnel'}
                    </span>
                  </div>
                </div>

                {/* ── BOTTOM SECTION ───────────────────────── */}
                <div style={{
                  padding:'1.1rem 1.6rem',
                  background:acc.soft,
                  display:'flex', alignItems:'center', justifyContent:'space-between',
                  borderTop:`1px solid ${acc.rim}`,
                }}>
                  <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                    {hasAlerts ? (
                      <>
                        {site.auditsEnRetard > 0 && (
                          <div style={{ display:'flex', alignItems:'center', gap:4, padding:'4px 9px', borderRadius:7, background:'#FEF2F2', border:'1px solid #FECACA' }}>
                            <span style={{ color:'#DC2626', display:'flex' }}><Icons.AlertTriangle/></span>
                            <span style={{ fontSize:'.7rem', fontWeight:700, color:'#DC2626' }}>{site.auditsEnRetard} retard</span>
                          </div>
                        )}
                        {site.qkDepasses > 0 && (
                          <div style={{ display:'flex', alignItems:'center', gap:4, padding:'4px 9px', borderRadius:7, background:'#F5F3FF', border:'1px solid #DDD6FE' }}>
                            <span style={{ color:'#7C3AED', display:'flex' }}><Icons.BarChart/></span>
                            <span style={{ fontSize:'.7rem', fontWeight:700, color:'#7C3AED' }}>{site.qkDepasses} QK</span>
                          </div>
                        )}
                        {site.pdcaOuverts > 0 && (
                          <div style={{ display:'flex', alignItems:'center', gap:4, padding:'4px 9px', borderRadius:7, background:'#FFF7ED', border:'1px solid #FDE68A' }}>
                            <span style={{ color:'#D97706', display:'flex' }}><Icons.RefreshCw/></span>
                            <span style={{ fontSize:'.7rem', fontWeight:700, color:'#D97706' }}>{site.pdcaOuverts} PDCA</span>
                          </div>
                        )}
                      </>
                    ) : (
                      <span style={{ fontSize:'.74rem', color:'#94A3B8', fontStyle:'italic' }}>Aucune alerte</span>
                    )}
                  </div>

                  <div style={{
                    display:'flex', alignItems:'center', gap:5,
                    fontSize:'.74rem', fontWeight:700, color: acc.g1,
                    opacity: isHov ? 1 : 0.6,
                    transition:'opacity .2s',
                  }}>
                    Consulter
                    <Icons.ArrowUpRight/>
                  </div>
                </div>

                {/* hover shimmer overlay */}
                <div className="card-overlay" style={{
                  position:'absolute', inset:0, pointerEvents:'none',
                  background:`linear-gradient(105deg, transparent 40%, rgba(255,255,255,.06) 50%, transparent 60%)`,
                  backgroundSize:'200% 100%',
                  opacity:0, transition:'opacity .2s',
                }}/>
              </div>
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div style={{ gridColumn:'1/-1', textAlign:'center', padding:'5rem 2rem', color:'#94A3B8' }}>
            <div style={{ fontSize:'2.5rem', marginBottom:'.75rem', opacity:.4 }}>
              <Icons.Building/>
            </div>
            <div style={{ fontWeight:600, fontSize:'.9rem' }}>Aucun site trouvé</div>
            <div style={{ fontSize:'.8rem', marginTop:4 }}>Essayez un autre terme de recherche</div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// VUE : MENU SITE
// ─────────────────────────────────────────────────────────────
const MENU_OPTIONS = [
  { key:'qualifications', label:'Qualifications',   desc:'Auditeurs certifiés, bloqués, en cours',           c:'#059669', bg:'#ECFDF5', Icon: Icons.Shield },
  { key:'planifications', label:'Planifications',   desc:'Planning par segment et semestre',                 c:'#0057B8', bg:'#EFF6FF', Icon: Icons.Calendar },
  { key:'audits',         label:'Audits',           desc:'Tous les audits du site avec statuts',             c:'#7C3AED', bg:'#F5F3FF', Icon: Icons.ClipboardCheck },
  { key:'non-conformites',label:'Audits spéciaux',  desc:'Audits règle plate et audits magasin, filtrables', c:'#DC2626', bg:'#FEF2F2', Icon: Icons.ClipboardCheck },
  { key:'qk',             label:'Indicateur QK',    desc:'Valeurs QK par projet, segment ou plant',          c:'#D97706', bg:'#FFF7ED', Icon: Icons.TrendingUp },
  { key:'rapports',       label:'Rapports',         desc:"Rapports d'audit terminés, filtrables par plant",  c:'#0B1E3D', bg:'#F1F5F9', Icon: Icons.FileText },
];

function SiteMenu({ site, onSelect, pal }) {
  const [hovered, setHovered] = useState(null);
  const acc = SITE_ACCENTS[0];

  return (
    <div>
      <style>{`
        @keyframes menuFadeUp {
          from { opacity:0; transform:translateY(12px); }
          to   { opacity:1; transform:translateY(0); }
        }
        .menu-card { animation: menuFadeUp .35s ease both; }
      `}</style>

      {/* Site hero */}
      <div style={{
        background:`linear-gradient(130deg, ${acc.g1} 0%, ${acc.g2} 100%)`,
        borderRadius:18, padding:'1.5rem 2rem', marginBottom:'1.5rem',
        position:'relative', overflow:'hidden',
        boxShadow:'0 8px 32px rgba(11,30,61,.2)',
      }}>
        <div style={{ position:'absolute', top:-40, right:-40, width:160, height:160, borderRadius:'50%', background:'rgba(255,255,255,.05)', pointerEvents:'none' }}/>
        <div style={{ position:'absolute', bottom:-50, left:40, width:120, height:120, borderRadius:'50%', background:'rgba(255,255,255,.04)', pointerEvents:'none' }}/>

        <div style={{ display:'flex', alignItems:'center', gap:16, position:'relative' }}>
          <div style={{ width:56, height:56, borderRadius:16, background:'rgba(255,255,255,.15)', border:'1px solid rgba(255,255,255,.25)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
            <span style={{ fontSize:'1.3rem', fontWeight:900, color:'#fff' }}>
              {(site.nom||'?').split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2)}
            </span>
          </div>

          <div style={{ flex:1 }}>
            <h2 style={{ margin:'0 0 4px', fontSize:'1.25rem', fontWeight:800, color:'#fff', letterSpacing:'-.02em' }}>{site.nom}</h2>
            {site.localisation && (
              <div style={{ display:'flex', alignItems:'center', gap:4, fontSize:'.73rem', color:'rgba(255,255,255,.55)' }}>
                <Icons.MapPin/> {site.localisation}
              </div>
            )}
          </div>

          <div style={{ display:'flex', gap:10 }}>
            {[
              { v:`${site.tauxCertif||0}%`, l:'Certification', c:'#93C5FD' },
              { v:site.nombreAudits||0, l:'Audits', c:'#6EE7B7' },
            ].map((b, i) => (
              <div key={i} style={{ background:'rgba(255,255,255,.1)', backdropFilter:'blur(8px)', borderRadius:12, padding:'10px 16px', textAlign:'center', border:'1px solid rgba(255,255,255,.15)' }}>
                <div style={{ fontFamily:'system-ui', fontSize:'1.4rem', fontWeight:900, color:b.c, lineHeight:1 }}>{b.v}</div>
                <div style={{ fontSize:'.6rem', color:'rgba(255,255,255,.45)', fontWeight:600, marginTop:3, textTransform:'uppercase', letterSpacing:'.07em' }}>{b.l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <p style={{ margin:'0 0 1rem', fontSize:'.7rem', fontWeight:800, color:'#94A3B8', textTransform:'uppercase', letterSpacing:'.12em' }}>Modules disponibles</p>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'1rem' }}>
        {MENU_OPTIONS.map((opt, idx) => {
          const isHov = hovered === opt.key;
          return (
            <div
              key={opt.key}
              className="menu-card"
              style={{ animationDelay:`${idx*0.05}s` }}
              onClick={() => onSelect(opt.key)}
              onMouseEnter={() => setHovered(opt.key)}
              onMouseLeave={() => setHovered(null)}
            >
              <div style={{
                background:'#fff', borderRadius:16,
                border:`1px solid ${isHov ? opt.c+'44' : '#E8EDF7'}`,
                borderTop:`3px solid ${isHov ? opt.c : '#E8EDF7'}`,
                padding:'1.25rem 1.25rem 1rem',
                cursor:'pointer',
                boxShadow: isHov ? `0 12px 32px ${opt.c}18` : '0 1px 6px rgba(0,0,0,.04)',
                transform: isHov ? 'translateY(-3px)' : 'none',
                transition:'all .18s ease',
              }}>
                <div style={{
                  width:44, height:44, borderRadius:12,
                  background: isHov ? opt.c : opt.bg,
                  display:'flex', alignItems:'center', justifyContent:'center',
                  color: isHov ? '#fff' : opt.c,
                  marginBottom:'.9rem',
                  transition:'all .18s',
                }}>
                  <opt.Icon/>
                </div>
                <div style={{ fontWeight:800, color:'#0B1E3D', fontSize:'.92rem', marginBottom:5, letterSpacing:'-.01em' }}>{opt.label}</div>
                <div style={{ fontSize:'.73rem', color:'#64748B', lineHeight:1.55 }}>{opt.desc}</div>
                <div style={{ marginTop:'.9rem', display:'flex', alignItems:'center', gap:5, fontSize:'.72rem', fontWeight:700, color: isHov ? opt.c : '#94A3B8', transition:'color .18s' }}>
                  Accéder <Icons.ChevronRight/>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// VUE : QUALIFICATIONS
// ─────────────────────────────────────────────────────────────
function SiteQualifications({ site }) {
  const [data, setData]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter]   = useState('all');
  const [search, setSearch]   = useState('');

  useEffect(() => {
    (async () => {
      try {
        const r = await api.get(`/responsable-centrale/sites/${site.id}/qualifications`);
        setData(r.data || []);
      } catch { setData([]); }
      setLoading(false);
    })();
  }, [site.id]);

  const getStatut = p => typeof p.statut === 'string' ? p.statut : (p.statut?.name || String(p.statut||''));
  const counts = {
    all:      data.length,
    certifie: data.filter(p => ['REUSSI','CERTIFIE'].includes(getStatut(p))).length,
    en_cours: data.filter(p => ['THEORIQUE_EN_COURS','PRATIQUE_EN_COURS','THEORIQUE_ECHOUE','PRATIQUE_ECHOUE','FORMATION_OBLIGATOIRE'].includes(getStatut(p))).length,
    bloque:   data.filter(p => getStatut(p) === 'BLOQUE').length,
  };

  const filtered = data
    .filter(p => {
      const st = getStatut(p);
      if (filter === 'certifie') return ['REUSSI','CERTIFIE'].includes(st);
      if (filter === 'en_cours') return ['THEORIQUE_EN_COURS','PRATIQUE_EN_COURS','THEORIQUE_ECHOUE','PRATIQUE_ECHOUE','FORMATION_OBLIGATOIRE'].includes(st);
      if (filter === 'bloque')   return st === 'BLOQUE';
      return true;
    })
    .filter(p => !search || [p.auditeurNom, p.auditeurMatricule, p.certificationTitre].some(v => v?.toLowerCase().includes(search.toLowerCase())));

  if (loading) return <Spinner/>;

  return (
    <div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'.75rem', marginBottom:'1rem' }}>
        {[
          { l:'Total', v:counts.all, c:'#0B1E3D' },
          { l:'Certifiés', v:counts.certifie, c:'#059669' },
          { l:'En cours', v:counts.en_cours, c:'#D97706' },
          { l:'Bloqués', v:counts.bloque, c:'#DC2626' },
        ].map((k,i) => (
          <div key={i} style={{ background:'#fff', borderRadius:12, padding:'.85rem', border:'1px solid #E8EDF7', borderTop:`3px solid ${k.c}`, textAlign:'center', boxShadow:'0 1px 4px rgba(0,0,0,.04)' }}>
            <div style={{ fontSize:'1.6rem', fontWeight:900, color:k.c, lineHeight:1 }}>{k.v}</div>
            <div style={{ fontSize:'.68rem', fontWeight:700, color:'#64748B', marginTop:4 }}>{k.l}</div>
          </div>
        ))}
      </div>

      <FilterBar filters={[
        { k:'all', l:'Tous' }, { k:'certifie', l:'✓ Certifiés' },
        { k:'en_cours', l:'En cours' }, { k:'bloque', l:'Bloqués' },
      ]} active={filter} onChange={setFilter} counts={counts}/>

      <div style={{ marginBottom:'.75rem', position:'relative' }}>
        <span style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'#94A3B8', display:'flex' }}><Icons.Search/></span>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher…"
          style={{ padding:'8px 14px 8px 38px', borderRadius:9, border:'1.5px solid #E2E8F0', fontSize:'.8rem', outline:'none', fontFamily:'inherit', width:'100%', boxSizing:'border-box' }}
          onFocus={e => e.target.style.borderColor='#0B1E3D'} onBlur={e => e.target.style.borderColor='#E2E8F0'}/>
      </div>

      <div style={{ background:'#fff', borderRadius:14, border:'1px solid #E8EDF7', overflow:'hidden', boxShadow:'0 2px 10px rgba(0,0,0,.05)' }}>
        <table style={{ width:'100%', borderCollapse:'collapse' }}>
          <thead>
            <tr style={{ background:'#D3DBE9' }}>
              {['Auditeur','Matricule','Certification','Statut','Score Théo.','Début'].map(h => (
                <th key={h} style={{ textAlign:'left', padding:'10px 14px', fontSize:'.66rem', fontWeight:800, color:'#64748B', textTransform:'uppercase', letterSpacing:'.07em', borderBottom:'2px solid #E8EDF7', whiteSpace:'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={6} style={{ textAlign:'center', padding:'3rem', color:'#94A3B8', fontStyle:'italic' }}>Aucun résultat</td></tr>
            ) : filtered.map((p, i) => {
              const st = getStatut(p);
              return (
                <tr key={i} style={{ background:i%2===0?'#fff':'#FAFBFC', borderBottom:'1px solid #EEF2F8' }}>
                  <td style={{ padding:'11px 14px', fontWeight:700, color:'#0B1E3D', fontSize:'.84rem' }}>{p.auditeurNom||'—'}</td>
                  <td style={{ padding:'11px 14px' }}><code style={{ background:'#F1F5F9', padding:'2px 7px', borderRadius:5, fontSize:'.73rem', fontWeight:700 }}>{p.auditeurMatricule||'—'}</code></td>
                  <td style={{ padding:'11px 14px', fontSize:'.8rem', color:'#374151', maxWidth:150, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{p.certificationTitre||'—'}</td>
                  <td style={{ padding:'11px 14px' }}><StatutBadge statut={st} map={STATUTS_QUALIF}/></td>
                  <td style={{ padding:'11px 14px', textAlign:'center' }}>
                    {p.scoreTheorique != null ? <span style={{ fontWeight:800, color:p.scoreTheorique>=14?'#059669':p.scoreTheorique>=10?'#D97706':'#DC2626' }}>{p.scoreTheorique}/20</span> : <span style={{ color:'#CBD5E1' }}>—</span>}
                  </td>
                  <td style={{ padding:'11px 14px', fontSize:'.75rem', color:'#64748B' }}>{fmt(p.dateDebut)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// VUE : PLANIFICATIONS
// ─────────────────────────────────────────────────────────────
function SitePlanifications({ site }) {
  const [plants,   setPlants]   = useState([]);
  const [selPlant, setSelPlant] = useState(null);
  const [segments, setSegments] = useState([]);
  const [selSeg,   setSelSeg]   = useState(null);
  const [planifs,  setPlanifs]  = useState([]);
  const [loading,  setLoading]  = useState(false);
  const [annee,    setAnnee]    = useState(new Date().getFullYear());

  useEffect(() => {
    (async () => {
      try { const r = await api.get(`/responsable-centrale/sites/${site.id}/plants`); setPlants(r.data||[]); } catch { setPlants([]); }
    })();
  }, [site.id]);

  useEffect(() => {
    if (!selPlant) { setSegments([]); setSelSeg(null); setPlanifs([]); return; }
    (async () => {
      try { const r = await api.get(`/responsable-centrale/plants/${selPlant.id}/segments`); setSegments(r.data||[]); } catch { setSegments([]); }
    })();
  }, [selPlant]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({ annee });
        if (selPlant) params.set('plantId', selPlant.id);
        if (selSeg)   params.set('segmentId', selSeg.id);
        const r = await api.get(`/responsable-centrale/sites/${site.id}/planifications?${params}`);
        setPlanifs(r.data||[]);
      } catch { setPlanifs([]); }
      setLoading(false);
    })();
  }, [site.id, selPlant, selSeg, annee]);

  const STATUT_COLORS = { PLANIFIE:'#0057B8', EN_COURS:'#C8982A', TERMINE:'#1A7A4A', EN_RETARD:'#C0392B', ANNULE:'#6B7280' };

  const AuditRow = ({ a }) => (
    <div style={{ display:'flex', alignItems:'center', gap:10, padding:'9px 12px', borderRadius:8, background:'#F8FAFC', border:'1px solid #E8EDF7', marginBottom:6 }}>
      <div style={{ width:8, height:8, borderRadius:'50%', background:STATUT_COLORS[a.statut]||'#ccc', flexShrink:0 }}/>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontWeight:800, fontSize:'.84rem', color:'#0B1E3D' }}>{a.reference}</div>
        <div style={{ fontSize:'.7rem', color:'#94A3B8', marginTop:1 }}>{a.auditeurNom} · {a.familleCablage||a.projetNom||'—'}</div>
      </div>
      <div style={{ textAlign:'right' }}>
        <StatutBadge statut={a.statut} map={STATUTS_AUDIT}/>
        <div style={{ fontSize:'.67rem', color:'#94A3B8', marginTop:3 }}>{fmtShort(a.datePrevue)}</div>
      </div>
      {a.valeurQK != null && (
        <span style={{ fontWeight:900, fontSize:'.88rem', color:a.valeurQK>0.5?'#DC2626':'#059669', background:a.valeurQK>0.5?'#FEF2F2':'#ECFDF5', borderRadius:6, padding:'2px 7px' }}>QK {a.valeurQK.toFixed(1)}</span>
      )}
    </div>
  );

  return (
    <div>
      <div style={{ display:'flex', gap:8, alignItems:'center', marginBottom:'1rem', flexWrap:'wrap' }}>
        <select value={annee} onChange={e => setAnnee(Number(e.target.value))}
          style={{ padding:'8px 12px', borderRadius:9, border:'1.5px solid #E2E8F0', fontSize:'.82rem', cursor:'pointer', outline:'none', fontFamily:'inherit' }}>
          {[2023,2024,2025,2026].map(y => <option key={y}>{y}</option>)}
        </select>
        <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
          <button onClick={() => { setSelPlant(null); setSelSeg(null); }}
            style={{ padding:'7px 12px', borderRadius:8, border:`1.5px solid ${!selPlant?'#0B1E3D':'#E2E8F0'}`, fontSize:'.76rem', fontWeight:700, cursor:'pointer', background:!selPlant?'#0B1E3D':'transparent', color:!selPlant?'#fff':'#64748B', fontFamily:'inherit' }}>
            Tous les plants
          </button>
          {plants.map(p => (
            <button key={p.id} onClick={() => { setSelPlant(p); setSelSeg(null); }}
              style={{ padding:'7px 12px', borderRadius:8, border:`1.5px solid ${selPlant?.id===p.id?'#0B1E3D':'#E2E8F0'}`, fontSize:'.76rem', fontWeight:700, cursor:'pointer', background:selPlant?.id===p.id?'#0B1E3D':'transparent', color:selPlant?.id===p.id?'#fff':'#64748B', fontFamily:'inherit' }}>
              {p.nom}
            </button>
          ))}
        </div>
        {selPlant && segments.length > 0 && (
          <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
            <button onClick={() => setSelSeg(null)}
              style={{ padding:'6px 11px', borderRadius:7, border:`1.5px solid ${!selSeg?'#1D4ED8':'#E2E8F0'}`, fontSize:'.74rem', fontWeight:700, cursor:'pointer', background:!selSeg?'#EFF6FF':'transparent', color:!selSeg?'#1D4ED8':'#64748B', fontFamily:'inherit' }}>
              Tous segments
            </button>
            {segments.map(s => (
              <button key={s.id} onClick={() => setSelSeg(s)}
                style={{ padding:'6px 11px', borderRadius:7, border:`1.5px solid ${selSeg?.id===s.id?'#1D4ED8':'#E2E8F0'}`, fontSize:'.74rem', fontWeight:700, cursor:'pointer', background:selSeg?.id===s.id?'#EFF6FF':'transparent', color:selSeg?.id===s.id?'#1D4ED8':'#64748B', fontFamily:'inherit' }}>
                {s.nom}
              </button>
            ))}
          </div>
        )}
      </div>

      {loading ? <Spinner/> : planifs.length === 0 ? (
        <div style={{ textAlign:'center', padding:'3rem', color:'#94A3B8', fontStyle:'italic' }}>Aucune planification trouvée pour ces critères</div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
          {planifs.map((seg, i) => (
            <div key={i} style={{ background:'#fff', borderRadius:14, border:'1px solid #E8EDF7', overflow:'hidden', boxShadow:'0 1px 6px rgba(0,0,0,.04)' }}>
              <div style={{ background:'#0B1E3D', padding:'.85rem 1.25rem', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                <div>
                  <div style={{ fontWeight:800, color:'#fff', fontSize:'.92rem' }}>{seg.segmentNom}</div>
                  <div style={{ fontSize:'.7rem', color:'rgba(255,255,255,.45)', marginTop:2 }}>{seg.plantNom} · {seg.totalAudits} audit{seg.totalAudits!==1?'s':''}</div>
                </div>
                <div style={{ display:'flex', gap:8 }}>
                  <span style={{ background:'rgba(255,255,255,.1)', color:'#93C5FD', borderRadius:7, padding:'3px 10px', fontSize:'.72rem', fontWeight:700 }}>S1: {(seg.semestre1||[]).length}</span>
                  <span style={{ background:'rgba(255,255,255,.1)', color:'#6EE7B7', borderRadius:7, padding:'3px 10px', fontSize:'.72rem', fontWeight:700 }}>S2: {(seg.semestre2||[]).length}</span>
                </div>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:0 }}>
                <div style={{ padding:'1rem 1.25rem', borderRight:'1px solid #E8EDF7' }}>
                  <div style={{ fontSize:'.72rem', fontWeight:800, color:'#0057B8', textTransform:'uppercase', letterSpacing:'.06em', marginBottom:'.6rem' }}>Semestre 1 (Jan – Juin)</div>
                  {(seg.semestre1||[]).length===0 ? <div style={{ color:'#CBD5E1', fontSize:'.78rem', fontStyle:'italic' }}>Aucune planification</div> : (seg.semestre1||[]).map((a,j)=><AuditRow key={j} a={a}/>)}
                </div>
                <div style={{ padding:'1rem 1.25rem' }}>
                  <div style={{ fontSize:'.72rem', fontWeight:800, color:'#059669', textTransform:'uppercase', letterSpacing:'.06em', marginBottom:'.6rem' }}>Semestre 2 (Juil – Déc)</div>
                  {(seg.semestre2||[]).length===0 ? <div style={{ color:'#CBD5E1', fontSize:'.78rem', fontStyle:'italic' }}>Aucune planification</div> : (seg.semestre2||[]).map((a,j)=><AuditRow key={j} a={a}/>)}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// VUE : AUDITS
// ─────────────────────────────────────────────────────────────
function SiteAudits({ site }) {
  const navigate = useNavigate();
  const [data,    setData]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter,  setFilter]  = useState('TOUS');

  const normalizeAuditType = (type) => String(type || '').toUpperCase().replace(/[-\s]+/g, '_');
  const normText = (v) => String(v || '').trim();
  const isRegleType = (type) => {
    const t = normalizeAuditType(type);
    return t === 'AUDIT_REGLES_PLATES' || t === 'REGLE' || (t.includes('REGLE') && t.includes('PLATE'));
  };
  const isMagasinType = (type) => {
    const t = normalizeAuditType(type);
    return t === 'AUDIT_MAGASIN_EXPORT' || t === 'AUDIT_MAGASIN' || t === 'EXPORT' || t.includes('MAGASIN') || t.includes('EXPORT');
  };
  const isSpecialAuditType = (type) => {
    return isRegleType(type) || isMagasinType(type);
  };

  useEffect(() => {
    (async () => {
      try {
        const r = await api.get(`/responsable-centrale/sites/${site.id}/audits`);
        const all = Array.isArray(r.data) ? r.data : [];
        // Audits produit uniquement (on retire les audits spéciaux règle plate / magasin export)
        setData(all.filter(a => !isSpecialAuditType(a?.typeAudit)));
      } catch { setData([]); }
      setLoading(false);
    })();
  }, [site.id]);

  const counts = { TOUS:data.length, PLANIFIE:0, EN_COURS:0, TERMINE:0, EN_RETARD:0, ANNULE:0 };
  data.forEach(a => { if (counts[a.statut]!==undefined) counts[a.statut]++; });
  const filtered = data.filter(a => filter==='TOUS' || a.statut===filter);
  if (loading) return <Spinner/>;

  return (
    <div>
      <FilterBar filters={[
        { k:'TOUS', l:'Tous' }, { k:'PLANIFIE', l:'Planifiés' }, { k:'EN_COURS', l:'En cours' },
        { k:'TERMINE', l:'Terminés' }, { k:'EN_RETARD', l:'En retard' }, { k:'ANNULE', l:'Annulés' },
      ]} active={filter} onChange={setFilter} counts={counts}/>
      <div style={{ background:'#fff', borderRadius:14, border:'1px solid #E8EDF7', overflow:'hidden', boxShadow:'0 2px 10px rgba(0,0,0,.05)' }}>
        <div style={{ overflowX:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead>
              <tr style={{ background:'#D3DBE9' }}>
                {['Référence','Type','Plant','Auditeur','Domaine','Date prévue','Statut','QK','PDCA'].map(h => (
                  <th key={h} style={{ textAlign:'left', padding:'10px 14px', fontSize:'.66rem', fontWeight:800, color:'#64748B', textTransform:'uppercase', letterSpacing:'.07em', borderBottom:'2px solid #E8EDF7', whiteSpace:'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length===0 ? (
                <tr><td colSpan={9} style={{ textAlign:'center', padding:'3rem', color:'#94A3B8', fontStyle:'italic' }}>Aucun audit trouvé</td></tr>
              ) : filtered.map((a,i) => (
                <tr key={i} onClick={() => navigate(`/responsable/audits/${a.id}`)}
                  style={{ background:i%2===0?'#fff':'#FAFBFC', borderBottom:'1px solid #EEF2F8', cursor:'pointer' }}
                  onMouseEnter={e => e.currentTarget.style.background='#EBF4FF'}
                  onMouseLeave={e => e.currentTarget.style.background=i%2===0?'#fff':'#FAFBFC'}>
                  <td style={{ padding:'11px 14px' }}><span style={{ fontWeight:800, fontSize:'.86rem', color:'#0B1E3D' }}>{a.reference}</span></td>
                  <td style={{ padding:'11px 14px', fontSize:'.76rem', color:'#64748B' }}>{a.typeAudit?.replace('AUDIT_','').replace('_',' ')||'—'}</td>
                  <td style={{ padding:'11px 14px', fontSize:'.78rem', color:'#374151', fontWeight:600 }}>{a.plantNom||'—'}</td>
                  <td style={{ padding:'11px 14px', fontSize:'.78rem', color:'#374151' }}>{a.auditeurNom||<span style={{ color:'#CBD5E1' }}>Non assigné</span>}</td>
                  <td style={{ padding:'11px 14px' }}>{a.domaine?<span style={{ background:'#0B1E3D', color:'#fff', borderRadius:5, padding:'2px 7px', fontSize:'.66rem', fontWeight:700 }}>{a.domaine}</span>:<span style={{ color:'#CBD5E1' }}>—</span>}</td>
                  <td style={{ padding:'11px 14px', fontSize:'.76rem', color:'#64748B', whiteSpace:'nowrap' }}>{fmt(a.datePrevue)}</td>
                  <td style={{ padding:'11px 14px' }}><StatutBadge statut={a.statut} map={STATUTS_AUDIT}/></td>
                  <td style={{ padding:'11px 14px' }}>
                    {a.valeurQK!=null ? (() => {
                      const v=Number(a.valeurQK);
                      const c=v===0?'#059669':v<=0.5?'#C8982A':v<=1?'#9D174D':'#DC2626';
                      const bg=v===0?'#ECFDF5':v<=0.5?'#FFFBEB':v<=1?'#FDF2F8':'#FEF2F2';
                      return <span style={{ fontWeight:900, fontSize:'.92rem', color:c, background:bg, borderRadius:6, padding:'2px 8px' }}>{v.toFixed(1)}</span>;
                    })() : <span style={{ color:'#CBD5E1' }}>—</span>}
                  </td>
                  <td style={{ padding:'11px 14px' }}>{a.pdcaDeclenche?<span style={{ background:'#FFF7ED', color:'#D97706', borderRadius:6, padding:'2px 7px', fontSize:'.66rem', fontWeight:700 }}>Ouvert</span>:<span style={{ color:'#CBD5E1' }}>—</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ padding:'8px 16px', borderTop:'1px solid #EEF2F8', background:'#F7F9FC' }}>
          <span style={{ fontSize:'.71rem', color:'#94A3B8', fontWeight:600 }}>{filtered.length} audit{filtered.length!==1?'s':''}</span>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// VUE : AUDITS SPÉCIAUX
// ─────────────────────────────────────────────────────────────
function SiteNonConformites({ site }) {
  const navigate = useNavigate();
  const [data, setData]           = useState([]);
  const [loading, setLoading]     = useState(true);
  const [typeFilter, setTypeFilter] = useState('TOUS');
  const [plantFilter, setPlantFilter] = useState('');
  const [audFilter, setAudFilter] = useState('');
  const [yearFilter, setYearFilter] = useState('TOUS');
  const [statutFilter, setStatutFilter] = useState('TOUS');

  const normalizeAuditType = (type) => String(type || '').toUpperCase().replace(/[-\s]+/g, '_');
  const isRegleType = (type) => {
    const t = normalizeAuditType(type);
    return t === 'AUDIT_REGLES_PLATES' || (t.includes('REGLE') && t.includes('PLATE'));
  };
  const isMagasinType = (type) => {
    const t = normalizeAuditType(type);
    return t === 'AUDIT_MAGASIN_EXPORT' || t === 'AUDIT_MAGASIN' || t.includes('MAGASIN');
  };
  const isSpecialAuditType = (type) => {
    return isRegleType(type) || isMagasinType(type);
  };

  const getAuditYear = (a) => {
    const src = a?.datePrevue || a?.dateRealisation || a?.dateCreation;
    if (!src) return null;
    const d = new Date(src);
    if (Number.isNaN(d.getTime())) return null;
    return String(d.getFullYear());
  };

  useEffect(() => {
    (async () => {
      try {
        const r = await api.get(`/responsable-centrale/sites/${site.id}/audits`);
        const all = Array.isArray(r.data) ? r.data : [];
        const specialsFromSite = all.filter(a => isSpecialAuditType(a?.typeAudit));

        if (specialsFromSite.length > 0) {
          setData(specialsFromSite);
        } else {
          // Fallback: certains audits spéciaux historiques peuvent ne pas remonter via la route /sites/{id}/audits
          const [reglesRes, magasinRes] = await Promise.all([
            api.get('/audits/type/AUDIT_REGLES_PLATES'),
            api.get('/audits/type/AUDIT_MAGASIN_EXPORT'),
          ]);

          const regles = Array.isArray(reglesRes.data) ? reglesRes.data : [];
          const magasin = Array.isArray(magasinRes.data) ? magasinRes.data : [];
          const merged = [...regles, ...magasin];

          const sameSite = (a) => {
            if (a?.siteId != null) return Number(a.siteId) === Number(site.id);
            if (a?.siteNom && site?.nom) {
              return String(a.siteNom).trim().toLowerCase() === String(site.nom).trim().toLowerCase();
            }
            return false;
          };

          const dedup = new Map();
          merged.filter(sameSite).forEach((a) => {
            if (a?.id != null) dedup.set(a.id, a);
          });

          setData(Array.from(dedup.values()));
        }
      } catch {
        setData([]);
      }
      setLoading(false);
    })();
  }, [site.id]);

  const plants = Array.from(new Set(data.map(a => normText(a?.plantNom)).filter(Boolean))).sort((a, b) => a.localeCompare(b, 'fr', { sensitivity: 'base' }));
  const auditeurs = Array.from(new Set(data.map(a => normText(a?.auditeurNom)).filter(Boolean))).sort((a, b) => a.localeCompare(b, 'fr', { sensitivity: 'base' }));
  const years = Array.from(new Set(data.map(getAuditYear).filter(Boolean))).sort((a, b) => b.localeCompare(a));
  const statuts = Array.from(new Set(data.map(a => a?.statut).filter(Boolean)));

  const counts = {
    TOUS: data.length,
    REGLE: data.filter(a => isRegleType(a?.typeAudit)).length,
    MAGASIN: data.filter(a => isMagasinType(a?.typeAudit)).length,
  };

  const filtered = data
    .filter(a => {
      if (typeFilter === 'REGLE') return isRegleType(a?.typeAudit);
      if (typeFilter === 'MAGASIN') return isMagasinType(a?.typeAudit);
      return true;
    })
    .filter(a => !plantFilter || normText(a?.plantNom) === plantFilter)
    .filter(a => !audFilter || normText(a?.auditeurNom) === audFilter)
    .filter(a => yearFilter === 'TOUS' || getAuditYear(a) === yearFilter)
    .filter(a => statutFilter === 'TOUS' || a?.statut === statutFilter);

  if (loading) return <Spinner/>;

  return (
    <div>
      <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:'1rem', alignItems:'center' }}>
        <FilterBar filters={[
          { k:'TOUS', l:'Tous spéciaux' },
          { k:'REGLE', l:'Règle plate' },
          { k:'MAGASIN', l:'Audit magasin' },
        ]} active={typeFilter} onChange={setTypeFilter} counts={counts}/>

        <select value={plantFilter} onChange={e=>setPlantFilter(e.target.value)}
          style={{ padding:'7px 12px', borderRadius:9, border:'1.5px solid #E2E8F0', fontSize:'.8rem', cursor:'pointer', outline:'none', fontFamily:'inherit' }}>
          <option value="">Tous les plants</option>
          {plants.map(p=><option key={p} value={p}>{p}</option>)}
        </select>

        <select value={audFilter} onChange={e=>setAudFilter(e.target.value)}
          style={{ padding:'7px 12px', borderRadius:9, border:'1.5px solid #E2E8F0', fontSize:'.8rem', cursor:'pointer', outline:'none', fontFamily:'inherit' }}>
          <option value="">Tous les auditeurs</option>
          {auditeurs.map(a=><option key={a} value={a}>{a}</option>)}
        </select>

        <select value={yearFilter} onChange={e=>setYearFilter(e.target.value)}
          style={{ padding:'7px 12px', borderRadius:9, border:'1.5px solid #E2E8F0', fontSize:'.8rem', cursor:'pointer', outline:'none', fontFamily:'inherit' }}>
          <option value="TOUS">Toutes les années</option>
          {years.map(y=><option key={y} value={y}>{y}</option>)}
        </select>

        <select value={statutFilter} onChange={e=>setStatutFilter(e.target.value)}
          style={{ padding:'7px 12px', borderRadius:9, border:'1.5px solid #E2E8F0', fontSize:'.8rem', cursor:'pointer', outline:'none', fontFamily:'inherit' }}>
          <option value="TOUS">Tous statuts</option>
          {statuts.map(s=><option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <div style={{ background:'#fff', borderRadius:14, border:'1px solid #E8EDF7', overflow:'hidden', boxShadow:'0 2px 10px rgba(0,0,0,.05)' }}>
        <div style={{ overflowX:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead>
              <tr style={{ background:'#D3DBE9' }}>
                {['Audit','Type','Plant','Auditeur','Planificateur','Date prévue','Année','Statut','PDCA'].map(h=>(
                  <th key={h} style={{ textAlign:'left', padding:'10px 14px', fontSize:'.66rem', fontWeight:800, color:'#64748B', textTransform:'uppercase', letterSpacing:'.07em', borderBottom:'2px solid #E8EDF7', whiteSpace:'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length===0 ? (
                <tr><td colSpan={9} style={{ textAlign:'center', padding:'3rem', color:'#94A3B8', fontStyle:'italic' }}>Aucun audit spécial trouvé</td></tr>
              ) : filtered.map((a,i) => {
                const typeLabel = isMagasinType(a?.typeAudit)
                  ? 'Audit magasin'
                  : 'Règle plate';
                return (
                  <tr key={i} onClick={() => navigate(`/responsable/audits/${a.id}`)}
                    style={{ background:i%2===0?'#fff':'#FAFBFC', borderBottom:'1px solid #EEF2F8', cursor:'pointer' }}
                    onMouseEnter={e=>e.currentTarget.style.background='#EBF4FF'}
                    onMouseLeave={e=>e.currentTarget.style.background=i%2===0?'#fff':'#FAFBFC'}>
                    <td style={{ padding:'11px 14px' }}><span style={{ fontWeight:800, fontSize:'.82rem', color:'#0B1E3D' }}>{a.reference || `#${a.id}`}</span></td>
                    <td style={{ padding:'11px 14px' }}><span style={{ background:'#F1F5F9', color:'#334155', borderRadius:7, padding:'3px 8px', fontSize:'.7rem', fontWeight:700 }}>{typeLabel}</span></td>
                    <td style={{ padding:'11px 14px', fontSize:'.78rem', color:'#374151' }}>{a.plantNom||'—'}</td>
                    <td style={{ padding:'11px 14px', fontSize:'.78rem', color:'#374151' }}>{a.auditeurNom||'—'}</td>
                    <td style={{ padding:'11px 14px', fontSize:'.78rem', color:'#374151' }}>{a.planificateurNom||'—'}</td>
                    <td style={{ padding:'11px 14px', fontSize:'.75rem', color:'#64748B', whiteSpace:'nowrap' }}>{fmt(a.datePrevue)}</td>
                    <td style={{ padding:'11px 14px', fontSize:'.75rem', color:'#64748B' }}>{getAuditYear(a)||'—'}</td>
                    <td style={{ padding:'11px 14px' }}><StatutBadge statut={a.statut} map={STATUTS_AUDIT}/></td>
                    <td style={{ padding:'11px 14px' }}>{a.pdcaDeclenche?<span style={{ background:'#FFF7ED', color:'#D97706', borderRadius:6, padding:'2px 7px', fontSize:'.66rem', fontWeight:700 }}>Ouvert</span>:<span style={{ color:'#CBD5E1' }}>—</span>}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div style={{ padding:'8px 16px', borderTop:'1px solid #EEF2F8', background:'#F7F9FC' }}>
          <span style={{ fontSize:'.71rem', color:'#94A3B8', fontWeight:600 }}>{filtered.length} audit{filtered.length!==1?'s':''} spécial/spéciaux</span>
        </div>
      </div>
    </div>
  );
}

const MOIS_LABELS = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];

function getAuditDate(item) {
  const raw = item.dateRealisation || item.datePrevue || item.date || item.createdAt;
  if (!raw) return null;
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? null : d;
}

function aggregateQK(items) {
  const valid = items.filter(i => Number.isFinite(Number(i.valeurQK)));
  const nbAudits = valid.length;
  const totalQK = valid.reduce((s, i) => s + Number(i.valeurQK), 0);
  const nbDepasses = valid.filter(i => i.qkDepasseSeuil || Number(i.valeurQK) > 0.5).length;
  return { nbAudits, nbDepasses, qkMoyen: nbAudits ? totalQK / nbAudits : 0 };
}

// Palette QK unifiée : vert (0) → or (≤0.5) → magenta (≤1) → rouge (>1)
const qkColor = v => v===0 ? '#059669' : v<=0.5 ? '#C8982A' : v<=1 ? '#BE185D' : '#DC2626';
const qkBg    = v => v===0 ? '#ECFDF5' : v<=0.5 ? '#FFFBEB' : v<=1 ? '#FDF2F8' : '#FEF2F2';
const qkRim   = v => v===0 ? '#A7F3D0' : v<=0.5 ? '#FDE68A' : v<=1 ? '#FBCFE8' : '#FECACA';
const qkGrad  = v => v===0 ? 'linear-gradient(135deg,#059669,#10B981)' : v<=0.5 ? 'linear-gradient(135deg,#B45309,#F59E0B)' : v<=1 ? 'linear-gradient(135deg,#9D174D,#EC4899)' : 'linear-gradient(135deg,#B91C1C,#EF4444)';

function QkBadge({ v, size='md' }) {
  const val = Number(v);
  const big = size === 'lg';
  return (
    <span style={{
      display:'inline-flex', alignItems:'baseline', gap:2,
      fontWeight:900, fontFamily:'system-ui',
      fontSize: big ? '1.35rem' : '.92rem',
      color:'#fff', background:qkGrad(val),
      borderRadius: big ? 12 : 8,
      padding: big ? '6px 14px' : '3px 10px',
      boxShadow:`0 4px 14px ${qkColor(val)}40, 0 1px 3px ${qkColor(val)}30`,
      letterSpacing:'-.02em',
    }}>
      {val.toFixed(big ? 2 : 1)}
    </span>
  );
}

function AnimatedBar({ value, max=2, height=7 }) {
  const [w, setW] = useState(0);
  useEffect(() => { const t = setTimeout(() => setW(Math.min(100, (value/max)*100)), 60); return () => clearTimeout(t); }, [value, max]);
  return (
    <div style={{ height, background:'#EEF2F8', borderRadius:99, overflow:'hidden', position:'relative' }}>
      <div style={{
        height:'100%', width:`${w}%`, borderRadius:99,
        background:qkGrad(value),
        transition:'width 1s cubic-bezier(.16,1,.3,1)',
        boxShadow: w>0 ? `0 0 8px ${qkColor(value)}80` : 'none',
      }}/>
    </div>
  );
}

function SiteQK({ site }) {
  const [mode,      setMode]      = useState('global'); // 'global' | 'plant'
  const [data,      setData]      = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [annee,     setAnnee]     = useState('');
  const [mois,      setMois]      = useState('');

  // Liste réelle des plants du site (indépendante des audits QK)
  const [plants,        setPlants]        = useState([]);
  const [plantsLoading, setPlantsLoading]  = useState(false);

  // Drill-down plant → segments
  const [plantOuvert,     setPlantOuvert]     = useState(null); // objet plant { id, nom }
  const [segmentsParPlant, setSegmentsParPlant] = useState({}); // cache { [plantId]: SegmentResponse[] }
  const [segmentsLoading, setSegmentsLoading] = useState(false);

  const MODES = [
    { k:'global', l:'Tous les QK', Icon: Icons.BarChart },
    { k:'plant',  l:'Par plant',   Icon: Icons.Building },
  ];

  // Chargement des audits QK du site
  useEffect(() => {
    setLoading(true);
    api.get(`/responsable-centrale/sites/${site.id}/qk`)
      .then(r => setData(r.data || []))
      .catch(() => setData([]))
      .finally(() => setLoading(false));
  }, [site.id]);

  // Chargement de la liste réelle des plants du site (une seule fois, dès qu'on va en mode "plant")
  useEffect(() => {
    if (mode !== 'plant' || plants.length > 0 || plantsLoading) return;
    setPlantsLoading(true);
    api.get(`/responsable-centrale/sites/${site.id}/plants`)
      .then(r => setPlants(r.data || []))
      .catch(() => setPlants([]))
      .finally(() => setPlantsLoading(false));
  }, [mode, site.id]);

  // Réinitialise le drill-down quand on change de filtre / mode
  useEffect(() => { setPlantOuvert(null); }, [mode, annee, mois]);

  // Années disponibles dans les données (plus récentes en premier)
  const anneesDisponibles = Array.from(new Set(
    data.map(getAuditDate).filter(Boolean).map(d => d.getFullYear())
  )).sort((a, b) => b - a);

  const anneeActive = annee || (anneesDisponibles[0] ? String(anneesDisponibles[0]) : '');

  // Données QK filtrées par année + mois (utilisées pour le mode "plant")
  const donneesFiltrees = data.filter(item => {
    const d = getAuditDate(item);
    if (!d) return false;
    if (anneeActive && String(d.getFullYear()) !== anneeActive) return false;
    if (mois !== '' && d.getMonth() !== Number(mois)) return false;
    return true;
  });

  // KPIs globaux (mode "Tous les QK")
  const kpiGlobal = aggregateQK(data);

  // Liste des plants réels du site, avec leur QK agrégé (0/— si aucun audit sur la période)
  const plantsListe = plants
    .map(p => {
      const items = donneesFiltrees.filter(i => Number(i.plantId) === Number(p.id));
      return { id: p.id, nom: p.nom, items, ...aggregateQK(items) };
    })
    .sort((a, b) => {
      if (a.nbAudits === 0 && b.nbAudits === 0) return a.nom.localeCompare(b.nom, 'fr');
      if (a.nbAudits === 0) return 1;
      if (b.nbAudits === 0) return -1;
      return b.qkMoyen - a.qkMoyen;
    });

  const ouvrirPlant = (plant) => {
    if (plantOuvert?.id === plant.id) { setPlantOuvert(null); return; }
    setPlantOuvert(plant);
    if (!segmentsParPlant[plant.id]) {
      setSegmentsLoading(true);
      api.get(`/responsable-centrale/plants/${plant.id}/segments`)
        .then(r => setSegmentsParPlant(prev => ({ ...prev, [plant.id]: r.data || [] })))
        .catch(() => setSegmentsParPlant(prev => ({ ...prev, [plant.id]: [] })))
        .finally(() => setSegmentsLoading(false));
    }
  };

  return (
    <div>
      <style>{`
        @keyframes qkFadeUp { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
        @keyframes qkRowIn  { from { opacity:0; transform:translateX(-6px); } to { opacity:1; transform:translateX(0); } }
        .qk-mode-btn { transition: all .18s cubic-bezier(.16,1,.3,1); }
        .qk-kpi-card { animation: qkFadeUp .4s ease both; transition: transform .2s ease, box-shadow .2s ease; }
        .qk-kpi-card:hover { transform: translateY(-3px); }
        .qk-table-row { transition: background .15s ease; animation: qkRowIn .3s ease both; }
        .qk-plant-card { animation: qkFadeUp .35s ease both; transition: transform .2s cubic-bezier(.16,1,.3,1), box-shadow .2s ease, border-color .2s ease; }
        .qk-plant-card:hover { transform: translateY(-2px); }
        .qk-plant-card .chev { transition: transform .2s ease; }
        .qk-seg-row { animation: qkFadeUp .3s ease both; transition: transform .15s ease, box-shadow .15s ease; }
        .qk-seg-row:hover { transform: translateX(3px); }
        .qk-select { transition: border-color .15s ease, box-shadow .15s ease; }
        .qk-select:focus { border-color:#0B1E3D !important; box-shadow:0 0 0 3px rgba(11,30,61,.08); }
      `}</style>

      {/* ── Boutons de mode ─────────────────────────────────── */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(2, minmax(0, 1fr))', gap:10, marginBottom:'1.25rem' }}>
        {MODES.map(m=>{
          const active = mode===m.k;
          return (
            <button key={m.k} className="qk-mode-btn" onClick={()=>setMode(m.k)}
              style={{
                width:'100%', padding:'13px 18px', borderRadius:13,
                border:`1.5px solid ${active?'#0B1E3D':'#E2E8F0'}`,
                display:'flex', alignItems:'center', justifyContent:'center', gap:9,
                fontSize:'.86rem', fontWeight:800, cursor:'pointer',
                background: active ? 'linear-gradient(135deg,#0B1E3D,#16305C)' : '#fff',
                color: active ? '#fff' : '#374151', fontFamily:'inherit',
                boxShadow: active ? '0 8px 22px rgba(11,30,61,.28)' : '0 1px 4px rgba(0,0,0,.04)',
              }}>
              <span style={{ display:'flex', opacity: active?1:.55 }}><m.Icon/></span>
              {m.l}
            </button>
          );
        })}
      </div>

      {/* ── Filtres Année / Mois (mode "Par plant") ─────────── */}
      {mode === 'plant' && (
        <div style={{ display:'flex', gap:8, marginBottom:'1.25rem', flexWrap:'wrap' }}>
          <select className="qk-select" value={anneeActive} onChange={e=>setAnnee(e.target.value)}
            style={{ padding:'9px 16px', borderRadius:10, border:'1.5px solid #E2E8F0', fontSize:'.82rem', cursor:'pointer', outline:'none', fontFamily:'inherit', fontWeight:700, color:'#374151', background:'#fff' }}>
            {anneesDisponibles.length===0
              ? <option value="">Aucune année</option>
              : anneesDisponibles.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <select className="qk-select" value={mois} onChange={e=>setMois(e.target.value)}
            style={{ padding:'9px 16px', borderRadius:10, border:'1.5px solid #E2E8F0', fontSize:'.82rem', cursor:'pointer', outline:'none', fontFamily:'inherit', fontWeight:700, color:'#374151', background:'#fff' }}>
            <option value="">Tous les mois</option>
            {MOIS_LABELS.map((l, idx) => <option key={idx} value={idx}>{l}</option>)}
          </select>
        </div>
      )}

      {loading ? <Spinner/> : mode==='global' ? (
        data.length===0 ? (
          <div style={{ textAlign:'center', padding:'4rem 2rem', color:'#94A3B8' }}>
            <div style={{ fontSize:'2.2rem', marginBottom:'.75rem', opacity:.35 }}><Icons.BarChart/></div>
            <div style={{ fontWeight:700, fontSize:'.9rem' }}>Aucune valeur QK disponible</div>
          </div>
        ) : (
        <>
          {/* ── KPI cards ──────────────────────────────────── */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:'.9rem', marginBottom:'1.25rem' }}>
            <div className="qk-kpi-card" style={{ background:'linear-gradient(135deg,#0B1E3D,#1E3A5F)', borderRadius:16, padding:'1.2rem 1.4rem', position:'relative', overflow:'hidden', boxShadow:'0 10px 28px rgba(11,30,61,.22)' }}>
              <div style={{ position:'absolute', top:-30, right:-30, width:110, height:110, borderRadius:'50%', background:'rgba(255,255,255,.05)' }}/>
              <div style={{ display:'flex', alignItems:'center', gap:8, color:'rgba(255,255,255,.55)', fontSize:'.68rem', fontWeight:700, textTransform:'uppercase', letterSpacing:'.08em', marginBottom:'.6rem' }}>
                <Icons.Activity/> Audits QK
              </div>
              <div style={{ fontFamily:'system-ui', fontSize:'2.1rem', fontWeight:900, color:'#fff', lineHeight:1 }}>{kpiGlobal.nbAudits}</div>
            </div>

            <div className="qk-kpi-card" style={{ background:'#fff', borderRadius:16, padding:'1.2rem 1.4rem', border:`1px solid ${qkRim(kpiGlobal.qkMoyen)}`, boxShadow:`0 6px 20px ${qkColor(kpiGlobal.qkMoyen)}18`, animationDelay:'.05s' }}>
              <div style={{ display:'flex', alignItems:'center', gap:8, color:'#94A3B8', fontSize:'.68rem', fontWeight:700, textTransform:'uppercase', letterSpacing:'.08em', marginBottom:'.6rem' }}>
                <Icons.TrendingUp/> QK moyen
              </div>
              <div style={{ display:'flex', alignItems:'baseline', gap:8 }}>
                <div style={{ fontFamily:'system-ui', fontSize:'2.1rem', fontWeight:900, color:qkColor(kpiGlobal.qkMoyen), lineHeight:1 }}>{kpiGlobal.qkMoyen.toFixed(2)}</div>
              </div>
              <div style={{ marginTop:'.7rem' }}><AnimatedBar value={kpiGlobal.qkMoyen}/></div>
            </div>

            <div className="qk-kpi-card" style={{ background:'#fff', borderRadius:16, padding:'1.2rem 1.4rem', border:'1px solid #FECACA', boxShadow:'0 6px 20px rgba(220,38,38,.1)', animationDelay:'.1s' }}>
              <div style={{ display:'flex', alignItems:'center', gap:8, color:'#94A3B8', fontSize:'.68rem', fontWeight:700, textTransform:'uppercase', letterSpacing:'.08em', marginBottom:'.6rem' }}>
                <Icons.AlertTriangle/> Seuils dépassés
              </div>
              <div style={{ display:'flex', alignItems:'baseline', gap:6 }}>
                <div style={{ fontFamily:'system-ui', fontSize:'2.1rem', fontWeight:900, color:'#DC2626', lineHeight:1 }}>{kpiGlobal.nbDepasses}</div>
                <div style={{ fontSize:'.75rem', color:'#94A3B8', fontWeight:600 }}>/ {kpiGlobal.nbAudits}</div>
              </div>
            </div>
          </div>

          {/* ── Tableau détaillé ──────────────────────────────*/}
          <div style={{ background:'#fff', borderRadius:16, border:'1px solid #E8EDF7', overflow:'hidden', boxShadow:'0 4px 20px rgba(11,30,61,.06)' }}>
            <div style={{ overflowX:'auto' }}>
              <table style={{ width:'100%', borderCollapse:'collapse' }}>
                <thead>
                  <tr style={{ background:'linear-gradient(180deg,#EEF2F8,#E2E8F0)' }}>
                    {['Référence','Type','Plant','Segment','Projet','Auditeur','Date','QK','Seuil','PDCA'].map(h=>(
                      <th key={h} style={{ textAlign:'left', padding:'12px 14px', fontSize:'.65rem', fontWeight:800, color:'#475569', textTransform:'uppercase', letterSpacing:'.08em', borderBottom:'2px solid #DCE3EF', whiteSpace:'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.map((a,i)=>(
                    <tr key={i} className="qk-table-row" style={{ animationDelay:`${Math.min(i,20)*0.02}s`, background:i%2===0?'#fff':'#FAFBFC', borderBottom:'1px solid #EEF2F8' }}
                      onMouseEnter={e=>e.currentTarget.style.background='#F0F6FF'}
                      onMouseLeave={e=>e.currentTarget.style.background=i%2===0?'#fff':'#FAFBFC'}>
                      <td style={{ padding:'11px 14px' }}><span style={{ fontWeight:800, fontSize:'.84rem', color:'#0B1E3D' }}>{a.reference}</span></td>
                      <td style={{ padding:'11px 14px', fontSize:'.74rem', color:'#64748B' }}>{a.typeAudit?.replace('AUDIT_','').replace(/_/g,' ')||'—'}</td>
                      <td style={{ padding:'11px 14px', fontSize:'.78rem', color:'#374151', fontWeight:600 }}>{a.plantNom||'—'}</td>
                      <td style={{ padding:'11px 14px', fontSize:'.78rem', color:'#374151' }}>{a.segmentNom||'—'}</td>
                      <td style={{ padding:'11px 14px', fontSize:'.78rem', color:'#374151' }}>{a.projetNom||'—'}</td>
                      <td style={{ padding:'11px 14px', fontSize:'.76rem', color:'#374151' }}>{a.auditeurNom||'—'}</td>
                      <td style={{ padding:'11px 14px', fontSize:'.74rem', color:'#64748B', whiteSpace:'nowrap' }}>{fmt(a.dateRealisation||a.datePrevue)}</td>
                      <td style={{ padding:'11px 14px' }}><QkBadge v={a.valeurQK}/></td>
                      <td style={{ padding:'11px 14px' }}>{a.qkDepasseSeuil?<span style={{ background:'#FEF2F2', color:'#DC2626', borderRadius:99, padding:'3px 10px', fontSize:'.66rem', fontWeight:800, border:'1px solid #FECACA' }}>Dépassé</span>:<span style={{ background:'#ECFDF5', color:'#059669', borderRadius:99, padding:'3px 10px', fontSize:'.66rem', fontWeight:800, border:'1px solid #A7F3D0' }}>OK</span>}</td>
                      <td style={{ padding:'11px 14px' }}>{a.pdcaDeclenche?<span style={{ background:'#FFF7ED', color:'#D97706', borderRadius:99, padding:'3px 10px', fontSize:'.66rem', fontWeight:800, border:'1px solid #FDE68A' }}>Ouvert</span>:<span style={{ color:'#CBD5E1' }}>—</span>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ padding:'10px 18px', borderTop:'1px solid #EEF2F8', background:'#F7F9FC' }}>
              <span style={{ fontSize:'.71rem', color:'#94A3B8', fontWeight:700 }}>{data.length} audit{data.length!==1?'s':''} avec valeur QK</span>
            </div>
          </div>
        </>
        )
      ) : (
        // mode === 'plant'
        plantsLoading ? <Spinner/> : plants.length===0 ? (
          <div style={{ textAlign:'center', padding:'4rem 2rem', color:'#94A3B8' }}>
            <div style={{ fontSize:'2.2rem', marginBottom:'.75rem', opacity:.35 }}><Icons.Building/></div>
            <div style={{ fontWeight:700, fontSize:'.9rem' }}>Aucun plant trouvé pour ce site</div>
          </div>
        ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:'.9rem' }}>
          {plantsListe.map((plant, i) => {
            const estOuvert = plantOuvert?.id === plant.id;
            const segmentsDuPlant = segmentsParPlant[plant.id] || [];
            const segmentsListe = segmentsDuPlant
              .map(s => {
                const items = plant.items.filter(it => Number(it.segmentId) === Number(s.id));
                return { id: s.id, nom: s.nom, items, ...aggregateQK(items) };
              })
              .sort((a, b) => {
                if (a.nbAudits === 0 && b.nbAudits === 0) return a.nom.localeCompare(b.nom, 'fr');
                if (a.nbAudits === 0) return 1;
                if (b.nbAudits === 0) return -1;
                return b.qkMoyen - a.qkMoyen;
              });
            const sansQK = plant.nbAudits === 0;

            return (
              <div key={plant.id} className="qk-plant-card" style={{
                animationDelay:`${Math.min(i,10)*0.05}s`,
                background:'#fff', borderRadius:17,
                border:`1.5px solid ${estOuvert ? '#0B1E3D' : sansQK ? '#EEF2F8' : qkRim(plant.qkMoyen)}`,
                boxShadow: estOuvert
                  ? '0 14px 32px rgba(11,30,61,.16)'
                  : sansQK ? '0 2px 10px rgba(0,0,0,.04)' : `0 6px 22px ${qkColor(plant.qkMoyen)}1c`,
                overflow:'hidden',
              }}>
                <div onClick={()=>ouvrirPlant(plant)}
                  style={{ padding:'1.15rem 1.35rem', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'space-between', gap:12 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:13, flex:1, minWidth:0 }}>
                    <div style={{
                      width:38, height:38, borderRadius:11, flexShrink:0,
                      display:'flex', alignItems:'center', justifyContent:'center',
                      background: sansQK ? '#F1F5F9' : qkGrad(plant.qkMoyen),
                      color: sansQK ? '#94A3B8' : '#fff',
                      boxShadow: sansQK ? 'none' : `0 4px 12px ${qkColor(plant.qkMoyen)}45`,
                    }}>
                      <Icons.Building/>
                    </div>
                    <div style={{ minWidth:0 }}>
                      <div style={{ fontWeight:800, color:'#0B1E3D', fontSize:'.94rem' }}>{plant.nom}</div>
                      <div style={{ fontSize:'.71rem', color:'#94A3B8', marginTop:2 }}>
                        {sansQK ? 'Aucun audit sur cette période' : `${plant.nbAudits} audit${plant.nbAudits!==1?'s':''} · ${plant.nbDepasses} dépassé${plant.nbDepasses!==1?'s':''}`}
                      </div>
                    </div>
                  </div>

                  <div style={{ display:'flex', alignItems:'center', gap:14, flexShrink:0 }}>
                    {sansQK ? (
                      <span style={{ fontSize:'.72rem', color:'#CBD5E1', fontStyle:'italic', fontWeight:700, background:'#F8FAFC', padding:'6px 12px', borderRadius:99, border:'1px solid #EEF2F8' }}>Pas de QK</span>
                    ) : (
                      <QkBadge v={plant.qkMoyen} size="lg"/>
                    )}
                    <span className="chev" style={{ display:'inline-flex', transform: estOuvert ? 'rotate(90deg)' : 'rotate(0deg)', color:'#94A3B8' }}>
                      <Icons.ChevronRight/>
                    </span>
                  </div>
                </div>
                {!sansQK && <div style={{ padding:'0 1.35rem 1.1rem' }}><AnimatedBar value={plant.qkMoyen}/></div>}

                {estOuvert && (
                  <div style={{ borderTop:'1px solid #EEF2F8', background:'linear-gradient(180deg,#FAFBFC,#F7F9FC)', padding:'1rem 1.35rem 1.2rem 3.1rem', display:'flex', flexDirection:'column', gap:9 }}>
                    {segmentsLoading && !segmentsParPlant[plant.id] ? (
                      <div style={{ padding:'1rem', textAlign:'center', color:'#94A3B8', fontSize:'.78rem' }}>Chargement des segments…</div>
                    ) : segmentsListe.length === 0 ? (
                      <div style={{ padding:'1rem', textAlign:'center', color:'#94A3B8', fontSize:'.78rem', fontStyle:'italic' }}>Aucun segment pour ce plant</div>
                    ) : segmentsListe.map((seg, j) => {
                      const segSansQK = seg.nbAudits === 0;
                      return (
                        <div key={seg.id} className="qk-seg-row" style={{ animationDelay:`${j*0.04}s`, background:'#fff', borderRadius:13, padding:'.85rem 1.1rem', border:`1px solid ${segSansQK?'#EEF2F8':qkRim(seg.qkMoyen)}`, boxShadow: segSansQK ? '0 1px 4px rgba(0,0,0,.03)' : `0 3px 12px ${qkColor(seg.qkMoyen)}14` }}>
                          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:10, marginBottom: segSansQK?0:'.55rem' }}>
                            <div style={{ minWidth:0 }}>
                              <div style={{ fontWeight:750, color:'#0B1E3D', fontSize:'.83rem' }}>{seg.nom}</div>
                              <div style={{ fontSize:'.67rem', color:'#94A3B8', marginTop:1 }}>
                                {segSansQK ? 'Aucun audit sur cette période' : `${seg.nbAudits} audit${seg.nbAudits!==1?'s':''} · ${seg.nbDepasses} dépassé${seg.nbDepasses!==1?'s':''}`}
                              </div>
                            </div>
                            {segSansQK ? (
                              <span style={{ fontSize:'.68rem', color:'#CBD5E1', fontStyle:'italic', fontWeight:700, flexShrink:0 }}>Pas de QK</span>
                            ) : (
                              <span style={{ flexShrink:0 }}><QkBadge v={seg.qkMoyen}/></span>
                            )}
                          </div>
                          {!segSansQK && <AnimatedBar value={seg.qkMoyen} height={5}/>}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        )
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// VUE : RAPPORTS
// ─────────────────────────────────────────────────────────────
function SiteRapports({ site }) {
  const navigate = useNavigate();
  const [data,        setData]        = useState([]);
  const [plants,      setPlants]      = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [plantFilter, setPlantFilter] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const [rr,rp] = await Promise.all([
          api.get(`/responsable-centrale/sites/${site.id}/rapports`),
          api.get(`/responsable-centrale/sites/${site.id}/plants`),
        ]);
        setData(rr.data||[]); setPlants(rp.data||[]);
      } catch { setData([]); setPlants([]); }
      setLoading(false);
    })();
  }, [site.id]);

  const filtered=data.filter(r=>!plantFilter||r.plantNom===plantFilter);
  if (loading) return <Spinner/>;

  return (
    <div>
      {plants.length>0 && (
        <div style={{ marginBottom:'1rem' }}>
          <select value={plantFilter} onChange={e=>setPlantFilter(e.target.value)}
            style={{ padding:'8px 14px', borderRadius:9, border:'1.5px solid #E2E8F0', fontSize:'.82rem', cursor:'pointer', outline:'none', fontFamily:'inherit' }}>
            <option value="">Tous les plants ({data.length} rapports)</option>
            {plants.map(p=>{ const cnt=data.filter(r=>r.plantNom===p.nom).length; return <option key={p.id} value={p.nom}>{p.nom} ({cnt})</option>; })}
          </select>
        </div>
      )}
      <div style={{ background:'#fff', borderRadius:14, border:'1px solid #E8EDF7', overflow:'hidden', boxShadow:'0 2px 10px rgba(0,0,0,.05)' }}>
        <div style={{ overflowX:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead>
              <tr style={{ background:'#D3DBE9' }}>
                {['Référence','Type','Plant','Segment','Projet','Auditeur','Date réalisation','QK','NC','PDCA'].map(h=>(
                  <th key={h} style={{ textAlign:'left', padding:'10px 14px', fontSize:'.66rem', fontWeight:800, color:'#64748B', textTransform:'uppercase', letterSpacing:'.07em', borderBottom:'2px solid #E8EDF7', whiteSpace:'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length===0 ? (
                <tr><td colSpan={10} style={{ textAlign:'center', padding:'3rem', color:'#94A3B8', fontStyle:'italic' }}>Aucun rapport trouvé</td></tr>
              ) : filtered.map((r,i)=>(
                <tr key={i} onClick={()=>navigate(`/responsable/audits/${r.id}`)}
                  style={{ background:i%2===0?'#fff':'#FAFBFC', borderBottom:'1px solid #EEF2F8', cursor:'pointer' }}
                  onMouseEnter={e=>e.currentTarget.style.background='#EBF4FF'}
                  onMouseLeave={e=>e.currentTarget.style.background=i%2===0?'#fff':'#FAFBFC'}>
                  <td style={{ padding:'10px 14px' }}><span style={{ fontWeight:800, fontSize:'.86rem', color:'#0B1E3D' }}>{r.reference}</span></td>
                  <td style={{ padding:'10px 14px', fontSize:'.74rem', color:'#64748B' }}>{r.typeAudit?.replace('AUDIT_','').replace(/_/g,' ')||'—'}</td>
                  <td style={{ padding:'10px 14px', fontSize:'.78rem', color:'#374151', fontWeight:600 }}>{r.plantNom||'—'}</td>
                  <td style={{ padding:'10px 14px', fontSize:'.76rem', color:'#64748B' }}>{r.segmentNom||'—'}</td>
                  <td style={{ padding:'10px 14px', fontSize:'.76rem', color:'#64748B' }}>{r.projetNom||'—'}</td>
                  <td style={{ padding:'10px 14px', fontSize:'.76rem', color:'#374151' }}>{r.auditeurNom||'—'}</td>
                  <td style={{ padding:'10px 14px', fontSize:'.75rem', color:'#64748B', whiteSpace:'nowrap' }}>{fmt(r.dateRealisation)}</td>
                  <td style={{ padding:'10px 14px' }}>
                    {r.valeurQK!=null ? (() => {
                      const v=Number(r.valeurQK);
                      const c=v===0?'#059669':v<=0.5?'#C8982A':v<=1?'#9D174D':'#DC2626';
                      const bg=v===0?'#ECFDF5':v<=0.5?'#FFFBEB':v<=1?'#FDF2F8':'#FEF2F2';
                      return <span style={{ fontWeight:900, fontSize:'.92rem', color:c, background:bg, borderRadius:6, padding:'2px 7px' }}>{v.toFixed(1)}</span>;
                    })() : <span style={{ color:'#CBD5E1' }}>—</span>}
                  </td>
                  <td style={{ padding:'10px 14px', textAlign:'center' }}>
                    {r.nbNonConformites>0?<span style={{ fontWeight:800, color:r.nbNonConformites>=5?'#DC2626':'#D97706' }}>{r.nbNonConformites}</span>:<span style={{ color:'#CBD5E1' }}>0</span>}
                  </td>
                  <td style={{ padding:'10px 14px' }}>{r.pdcaDeclenche?<span style={{ background:'#FFF7ED', color:'#D97706', borderRadius:6, padding:'2px 7px', fontSize:'.66rem', fontWeight:700 }}>Ouvert</span>:<span style={{ color:'#CBD5E1' }}>—</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ padding:'8px 16px', borderTop:'1px solid #EEF2F8', background:'#F7F9FC' }}>
          <span style={{ fontSize:'.71rem', color:'#94A3B8', fontWeight:600 }}>{filtered.length} rapport{filtered.length!==1?'s':''}</span>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// COMPOSANT PRINCIPAL
// ─────────────────────────────────────────────────────────────
export default function ResponsableMultiSite() {
  const [selSite, setSelSite] = useState(null);
  const [selView, setSelView] = useState(null);
  const pal = selSite ? SITE_ACCENTS[0] : null;

  const getTitle = () => {
    if (!selSite) return 'Supervision multi-sites';
    if (!selView) return selSite.nom;
    return MENU_OPTIONS.find(o => o.key === selView)?.label || selView;
  };

  const renderView = () => {
    if (!selSite) return <SitesList onSelect={s => { setSelSite(s); setSelView(null); }}/>;
    if (!selView) return <SiteMenu site={selSite} pal={pal} onSelect={setSelView}/>;
    switch (selView) {
      case 'qualifications':  return <SiteQualifications  site={selSite}/>;
      case 'planifications':  return <SitePlanifications  site={selSite}/>;
      case 'audits':          return <SiteAudits           site={selSite}/>;
      case 'non-conformites': return <SiteNonConformites   site={selSite}/>;
      case 'qk':              return <SiteQK               site={selSite}/>;
      case 'rapports':        return <SiteRapports         site={selSite}/>;
      default:                return null;
    }
  };

  return (
    <div style={{ fontFamily:"'DM Sans', system-ui, sans-serif" }}>
      <style>{`
        @keyframes ms_spin { to { transform: rotate(360deg); } }
      `}</style>

      {/* ── HEADER ───────────────────────────────────────────── */}
      <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:'1.5rem', flexWrap:'wrap' }}>
        <div style={{ width:44, height:44, borderRadius:13, background:'linear-gradient(135deg,#0B1E3D,#1E3A5F)', display:'flex', alignItems:'center', justifyContent:'center', color:'#C8982A', boxShadow:'0 4px 16px rgba(11,30,61,.25)', flexShrink:0 }}>
          <Icons.Globe/>
        </div>
        <div>
          <h2 style={{ margin:0, fontSize:'1.1rem', fontWeight:800, color:'#0B1E3D', letterSpacing:'-.01em' }}>{getTitle()}</h2>
          <div style={{ display:'flex', alignItems:'center', gap:5, fontSize:'.72rem', color:'#94A3B8', marginTop:2 }}>
            <span onClick={() => { setSelSite(null); setSelView(null); }} style={{ cursor:'pointer', color:!selSite?'#0B1E3D':'#60A5FA', fontWeight:!selSite?700:500 }}>Sites</span>
            {selSite && <>
              <span style={{ color:'#CBD5E1' }}>›</span>
              <span onClick={() => setSelView(null)} style={{ cursor:'pointer', color:!selView?'#0B1E3D':'#60A5FA', fontWeight:!selView?700:500 }}>{selSite.nom}</span>
            </>}
            {selView && <>
              <span style={{ color:'#CBD5E1' }}>›</span>
              <span style={{ color:'#0B1E3D', fontWeight:700 }}>{MENU_OPTIONS.find(o=>o.key===selView)?.label}</span>
            </>}
          </div>
        </div>

        <div style={{ marginLeft:'auto', display:'flex', gap:8 }}>
          {selView && (
            <button onClick={() => setSelView(null)}
              style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'7px 14px', borderRadius:9, border:'1.5px solid #E2E8F0', background:'#fff', fontSize:'.78rem', fontWeight:700, cursor:'pointer', color:'#374151', fontFamily:'inherit', transition:'all .15s' }}
              onMouseEnter={e=>{e.currentTarget.style.borderColor='#0B1E3D';e.currentTarget.style.background='#F8FAFC';}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor='#E2E8F0';e.currentTarget.style.background='#fff';}}>
              <Icons.ChevronLeft/> Menu {selSite?.nom}
            </button>
          )}
          {selSite && (
            <button onClick={() => { setSelSite(null); setSelView(null); }}
              style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'7px 14px', borderRadius:9, border:'1.5px solid #b1b4b7', background:'#fff', fontSize:'.78rem', fontWeight:700, cursor:'pointer', color:'#374151', fontFamily:'inherit', transition:'all .15s' }}
              onMouseEnter={e=>{e.currentTarget.style.borderColor='#64748B';e.currentTarget.style.background='#F8FAFC';}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor='#b1b4b7';e.currentTarget.style.background='#fff';}}>
              <Icons.ChevronLeft/> Tous les sites
            </button>
          )}
        </div>
      </div>

      {renderView()}
    </div>
  );
}