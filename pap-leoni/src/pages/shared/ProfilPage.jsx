// ═══════════════════════════════════════════════════════════════════
// ProfilPage.jsx — v10 FINAL — dates i18n, rôles traduits
// ═══════════════════════════════════════════════════════════════════
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

// ── Icons (inchangés) ────────────────────────────────────────────
const Ic = {
  user:   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="15" height="15"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  mail:   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="15" height="15"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>,
  phone:  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="15" height="15"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.4 2 2 0 0 1 3.6 1.21h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.82a16 16 0 0 0 6.29 6.29l.98-.98a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>,
  id:     <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="15" height="15"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>,
  pin:    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="15" height="15"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>,
  key:    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="15" height="15"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/></svg>,
  shield: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="15" height="15"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  edit:   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="13" height="13"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  check:  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="13" height="13"><polyline points="20 6 9 17 4 12"/></svg>,
  x:      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  eye:    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="14" height="14"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>,
  eyeoff: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="14" height="14"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>,
  warn:   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="13" height="13"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
  trophy: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="17" height="17"><polyline points="8 21 12 17 16 21"/><line x1="12" y1="17" x2="12" y2="11"/><path d="M7 4H17a2 2 0 0 1 2 2v1a6 6 0 0 1-6 6 6 6 0 0 1-6-6V6a2 2 0 0 1 2-2z"/></svg>,
  cal:    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="17" height="17"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  users:  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="17" height="17"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  bar:    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="17" height="17"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
  factory:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="17" height="17"><path d="M2 20a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8l-7 5V8l-7 5V4a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2z"/></svg>,
  clock:  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="17" height="17"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
};

// ── Rôles traduits dynamiquement ─────────────────────────────────
function getRoleMeta(role, t) {
  const roles = {
    ADMIN:                        { label: t('profil.roles.ADMIN'),         color: '#C8982A' },
    AUDITEUR:                     { label: t('profil.roles.AUDITEUR'),      color: '#2563EB' },
    CHEF_SERVICE:                 { label: t('profil.roles.CHEF_SERVICE'),  color: '#0369A1' },
    RESPONSABLE_QUALITE_CENTRALE: { label: t('profil.roles.RESPONSABLE_QUALITE_CENTRALE'), color: '#6D28D9' },
    EXPERT_PRODUCT_AUDIT:         { label: t('profil.roles.EXPERT_PRODUCT_AUDIT'), color: '#C8982A' },
  };
  return roles[role] || { label: role, color: '#64748B' };
}

// ── Bandeau de statistiques selon le rôle (traduit) ──────────────
function getStatsStrip(role, stats, user, t, i18n) {
  const dateLabel = user?.dateCreation
    ? new Date(user.dateCreation).toLocaleDateString(i18n.language, { month:'short', year:'numeric' })
    : '—';
  const statut = user?.actif ? t('profil.actif') : t('profil.inactif');

  switch(role) {
    case 'AUDITEUR':
      return [
        { ico:Ic.trophy,  label: t('profil.certificationsObtenues'), val: stats.certifs??'—'  },
        { ico:Ic.bar,     label: t('profil.examensPasses'),           val: stats.examens??'—'  },
        { ico:Ic.cal,     label: t('profil.membreDepuis'),            val: dateLabel           },
        { ico:Ic.shield,  label: t('profil.statut'),                  val: statut              },
      ];
    case 'EXPERT_PRODUCT_AUDIT':
      return [
        { ico:Ic.trophy,  label: t('profil.certificationsCrees'),     val: stats.certifsCreees??'—'  },
        { ico:Ic.users,   label: t('profil.auditeursSupervises'),     val: stats.auditeursSupervises??'—' },
        { ico:Ic.cal,     label: t('profil.membreDepuis'),            val: dateLabel                  },
        { ico:Ic.shield,  label: t('profil.statut'),                  val: statut                     },
      ];
    case 'CHEF_SERVICE':
      return [
        { ico:Ic.users,   label: t('profil.equipe'),                  val: stats.equipe??'—'    },
        { ico:Ic.bar,     label: t('profil.rapportsTraites'),        val: stats.rapports??'—'  },
        { ico:Ic.cal,     label: t('profil.membreDepuis'),            val: dateLabel            },
        { ico:Ic.shield,  label: t('profil.statut'),                  val: statut               },
      ];
    case 'RESPONSABLE_QUALITE_CENTRALE':
      return [
        { ico:Ic.factory, label: t('profil.sitesSupervises'),        val: stats.sites??'—'     },
        { ico:Ic.bar,     label: t('profil.nonConformites'),         val: stats.nonConf??'—'   },
        { ico:Ic.cal,     label: t('profil.membreDepuis'),            val: dateLabel            },
        { ico:Ic.shield,  label: t('profil.statut'),                  val: statut               },
      ];
    case 'ADMIN':
    default:
      return [
        { ico:Ic.users,   label: t('profil.utilisateursGerés'),      val: stats.totalUsers??'—'   },
        { ico:Ic.factory, label: t('profil.sitesActifs'),             val: stats.totalSites??'—'   },
        { ico:Ic.cal,     label: t('profil.membreDepuis'),            val: dateLabel               },
        { ico:Ic.shield,  label: t('profil.statut'),                  val: statut                  },
      ];
  }
}

// ── Composant force mot de passe traduit ─────────────────────────
function PwForce({ pw, t }) {
  if (!pw) return null;
  const c = [pw.length>=8,/[A-Z]/.test(pw),/[0-9]/.test(pw),/[^A-Za-z0-9]/.test(pw)].filter(Boolean).length;
  const cols = ['#EF4444','#F97316','#2563EB','#002855'];
  const strengthLabels = [
    t('profil.passwordStrength.veryWeak'),
    t('profil.passwordStrength.weak'),
    t('profil.passwordStrength.correct'),
    t('profil.passwordStrength.strong')
  ];
  return (
    <div style={{marginTop:5}}>
      <div style={{display:'flex',gap:3}}>
        {[0,1,2,3].map(i=><div key={i} style={{flex:1,height:3,borderRadius:99,background:i<c?cols[c-1]:'#E2E8F0',transition:'background .3s'}}/>)}
      </div>
      <span style={{fontSize:'.67rem',fontWeight:700,color:c>0?cols[c-1]:'#94A3B8',marginTop:2,display:'block'}}>
        {c>0 ? strengthLabels[c-1] : t('profil.passwordStrength.choose')}
      </span>
    </div>
  );
}

// ── Inline editable (les labels sont déjà traduits en props) ─────
function InlineRow({ ico, icoBg, icoColor, label, value, onSave, last, t }) {
  const [editing, setEditing] = useState(false);
  const [val,     setVal]     = useState(value);
  const [saving,  setSaving]  = useState(false);
  useEffect(()=>{ setVal(value); },[value]);

  const save = async () => {
    setSaving(true);
    await onSave(val);
    setSaving(false);
    setEditing(false);
  };

  return (
    <div className="pp-row" style={{borderBottom:last?'none':'1px solid #F8FAFC'}}>
      <div className="pp-row-left" style={{flex:1,minWidth:0}}>
        <div className="pp-row-ico" style={{background:icoBg,color:icoColor}}>{ico}</div>
        <div style={{flex:1,minWidth:0}}>
          {editing ? (
            <div style={{display:'flex',alignItems:'center',gap:6}}>
              <input autoFocus value={val} onChange={e=>setVal(e.target.value)}
                onKeyDown={e=>{if(e.key==='Enter')save();if(e.key==='Escape'){setEditing(false);setVal(value);}}}
                className="pp-input" style={{padding:'5px 9px',fontSize:'.84rem',flex:1}}
              />
              <button onClick={save} disabled={saving}
                style={{width:26,height:26,borderRadius:7,border:'none',background:'#002855',color:'#fff',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',flexShrink:0}}>
                {saving
                  ? <span style={{width:9,height:9,border:'2px solid rgba(255,255,255,.3)',borderTopColor:'#fff',borderRadius:'50%',display:'inline-block',animation:'spin .7s linear infinite'}}/>
                  : Ic.check}
              </button>
              <button onClick={()=>{setEditing(false);setVal(value);}}
                style={{width:26,height:26,borderRadius:7,border:'1px solid #E2E8F0',background:'#F8FAFC',color:'#64748b',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',flexShrink:0}}>
                {Ic.x}
              </button>
            </div>
          ) : (
            <div>
              <p className="pp-row-val" style={{color:val?'#0B1E3D':'#95a8c2',fontStyle:val?'normal':'italic'}}>
                {val || t('profil.nonRenseigne')}
              </p>
              <p className="pp-row-lbl">{label}</p>
            </div>
          )}
        </div>
      </div>
      {!editing && (
        <button className="pp-btn pp-sm" style={{marginLeft:10,flexShrink:0,padding:'4px 10px',fontSize:'.73rem'}}
          onClick={()=>setEditing(true)}>{Ic.edit} {t('profil.modifier')}</button>
      )}
    </div>
  );
}

// ── Row lecture seule (labels traduits) ──────────────────────────
function ReadRow({ ico, icoBg, icoColor, label, value, badge, last }) {
  return (
    <div className="pp-row" style={{borderBottom:last?'none':'1px solid #F8FAFC'}}>
      <div className="pp-row-left">
        <div className="pp-row-ico" style={{background:icoBg,color:icoColor}}>{ico}</div>
        <div>
          <p className="pp-row-val">{value || <span style={{color:'#94A3B8',fontStyle:'italic',fontWeight:400}}>—</span>}</p>
          <p className="pp-row-lbl">{label}</p>
        </div>
      </div>
      {badge && <div style={{flexShrink:0}}>{badge}</div>}
    </div>
  );
}

// ── CSS complet (inchangé) ───────────────────────────────────────
const css = `
@import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@600;700&family=DM+Sans:wght@400;500;600;700&display=swap');
*,*::before,*::after{box-sizing:border-box}
.pp{font-family:'DM Sans',sans-serif;min-height:100%;background:var(--dm-bg,#F4F6FA)}
@keyframes ppFade{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
@keyframes spin{to{transform:rotate(360deg)}}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.35}}

/* Hero */
.pp-hero-wrap{padding:1.75rem 2.25rem 0}
.pp-hero{background:linear-gradient(135deg,#002855 0%,#003F8A 55%,#0057B8 100%);
  position:relative;overflow:hidden;border-radius:20px;
  box-shadow:0 8px 32px rgba(0,40,85,.22)}
.pp-hero::before{content:'';position:absolute;width:300px;height:300px;border-radius:50%;
  border:1px solid rgba(200,152,42,.12);bottom:-90px;right:-70px;pointer-events:none}
.pp-hero::after{content:'';position:absolute;width:160px;height:160px;border-radius:50%;
  border:1px solid rgba(255,255,255,.05);top:15px;right:160px;pointer-events:none}
.pp-hero-inner{display:flex;align-items:flex-end;gap:1.25rem;
  padding:2.25rem 2.25rem 1.5rem;position:relative;z-index:1;flex-wrap:wrap}
.pp-avatar{width:80px;height:80px;border-radius:50%;flex-shrink:0;
  background:linear-gradient(135deg,rgba(200,152,42,.28),rgba(200,152,42,.1));
  border:3px solid rgba(200,152,42,.4);
  display:flex;align-items:center;justify-content:center;
  font-family:'Rajdhani',sans-serif;font-size:1.9rem;font-weight:700;color:#E8B84B}
.pp-hero-info{flex:1;min-width:0}
.pp-matricule{font-size:.74rem;font-weight:700;color:rgba(255,255,255,.42);
  letter-spacing:.1em;text-transform:uppercase;margin-bottom:6px}
.pp-name{font-family:'Rajdhani',sans-serif;font-size:1.65rem;font-weight:700;
  color:#fff;margin:0 0 8px;line-height:1.1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.pp-role{display:inline-block;padding:4px 13px;border-radius:99px;
  font-size:.72rem;font-weight:700;letter-spacing:.04em}
.pp-strip{display:flex;gap:0;border-top:1px solid rgba(255,255,255,.08);position:relative;z-index:1}
.pp-stat{flex:1;padding:.9rem 1.25rem;border-right:1px solid rgba(255,255,255,.07)}
.pp-stat:last-child{border-right:none}
.pp-stat-v{font-family:'Rajdhani',sans-serif;font-size:1.25rem;font-weight:700;
  color:#fff;display:block;line-height:1.2}
.pp-stat-l{font-size:.65rem;font-weight:600;color:rgba(255,255,255,.38);
  text-transform:uppercase;letter-spacing:.06em;margin-top:2px;display:block}

/* Body 2 colonnes */
.pp-body{padding:1.5rem 2.25rem;display:grid;grid-template-columns:1fr 1fr;gap:1.25rem;align-items:start}
@media(max-width:768px){.pp-body{grid-template-columns:1fr}}

/* Sections */
.pp-section{background:#fff;border-radius:15px;border:.5px solid #E2E8F0;
  overflow:hidden;box-shadow:0 2px 10px rgba(0,0,0,.05);animation:ppFade .3s ease}
.pp-section-hd{display:flex;align-items:center;justify-content:space-between;
  padding:11px 18px;border-bottom:1px solid #F4F6FA;
  background:#CBD5E1;
  border-radius:12px;margin:10px 10px 0}
.pp-section-hd-left{display:flex;align-items:center;gap:9px}
.pp-section-ico{width:30px;height:30px;border-radius:8px;
  background:rgba(0,40,85,.1);color:#0B1E3D;
  display:flex;align-items:center;justify-content:center;flex-shrink:0}
.pp-section-title{font-size:.84rem;font-weight:800;color:#0B1E3D;letter-spacing:-.01em}

.pp-section-hd-plain{display:flex;align-items:center;justify-content:space-between;
  padding:11px 18px;border-bottom:1px solid #F4F6FA;
  background:#F8FAFC;border-radius:12px;margin:10px 10px 0}
.pp-section-ico-plain{width:30px;height:30px;border-radius:8px;
  background:rgba(0,40,85,.07);color:#0B1E3D;
  display:flex;align-items:center;justify-content:center;flex-shrink:0}
.pp-section-title-plain{font-size:.84rem;font-weight:800;color:#0B1E3D;letter-spacing:-.01em}

/* Rows */
.pp-row{display:flex;align-items:center;justify-content:space-between;
  padding:12px 18px;border-bottom:1px solid #F8FAFC;transition:background .12s}
.pp-row:last-child{border-bottom:none}
.pp-row:hover{background:#FAFBFF}
.pp-row-left{display:flex;align-items:center;gap:11px}
.pp-row-ico{width:35px;height:35px;border-radius:10px;flex-shrink:0;
  display:flex;align-items:center;justify-content:center}
.pp-row-val{font-size:.85rem;font-weight:700;color:#0B1E3D}
.pp-row-lbl{font-size:.7rem;color:#94A3B8;margin-top:1px}

/* Boutons */
.pp-btn{display:inline-flex;align-items:center;gap:6px;padding:.55rem 1rem;
  border-radius:9px;font-size:.82rem;font-weight:700;cursor:pointer;border:none;
  font-family:'DM Sans',sans-serif;transition:all .15s}
.pp-navy{background:#002855;color:#fff}.pp-navy:hover{background:#003F8A}
.pp-navy:disabled{background:#8A9BBC;cursor:not-allowed}
.pp-ghost{background:#F4F6FA;color:#374151;border:1.5px solid #E2E8F0}
.pp-ghost:hover{background:#E8EDF7}
.pp-sm{background:rgba(255,255,255,.15);color:#fff;border:.5px solid rgba(255,255,255,.25)}
.pp-sm:hover{background:rgba(255,255,255,.25)}

/* Inputs */
.pp-input{width:100%;padding:.6rem .875rem;border:1.5px solid #E2E8F0;border-radius:9px;
  color:#0C1A30;font-family:'DM Sans',sans-serif;font-weight:600;font-size:.87rem;
  outline:none;background:#fff;transition:border .15s,box-shadow .15s}
.pp-input:focus{border-color:#002855;box-shadow:0 0 0 3px rgba(0,40,85,.07)}
.pp-input-wrap{position:relative}
.pp-eye{position:absolute;right:10px;top:50%;transform:translateY(-50%);
  background:none;border:none;cursor:pointer;color:#8A9BBC;display:flex;padding:2px}
.pp-label{font-size:.7rem;font-weight:700;color:#64748b;text-transform:uppercase;
  letter-spacing:.07em;margin-bottom:5px;display:block}

/* Alertes */
.pp-ok{background:#EEF5FF;border:1px solid #BFDBFE;color:#1E40AF;
  padding:.65rem 1rem;border-radius:9px;font-size:.82rem;font-weight:700;
  display:flex;align-items:center;gap:7px;margin-bottom:1rem;animation:ppFade .2s ease}
.pp-err{background:#FEF2F2;border:1px solid #FECACA;color:#DC2626;
  padding:.65rem 1rem;border-radius:9px;font-size:.82rem;font-weight:700;
  display:flex;align-items:center;gap:7px;margin-bottom:1rem;animation:ppFade .2s ease}
`;

// ══════════════════════════════════════════════════════════════════
export default function ProfilPage() {
  const { t, i18n } = useTranslation(); // ← i18n ajouté pour la date
  const { user, setUser } = useAuth();
  const meta = getRoleMeta(user?.role, t);

  const [editPw,   setEditPw]   = useState(false);
  const [info,     setInfo]     = useState({nom:'',prenom:'',email:'',telephone:''});
  const [pw,       setPw]       = useState({current:'',next:'',confirm:''});
  const [showPw,   setShowPw]   = useState({current:false,next:false,confirm:false});
  const [saving,   setSaving]   = useState(false);
  const [toast,    setToast]    = useState(null);
  const [stats,    setStats]    = useState({});

  useEffect(()=>{
    if(user) setInfo({nom:user.nom||'',prenom:user.prenom||'',email:user.email||'',telephone:user.telephone||''});
  },[user]);

  useEffect(()=>{
    api.get('/commun/stats-profil').then(r=>setStats(r.data)).catch(()=>{});
  },[]);

  const toast$ = (msg,type='ok')=>{ setToast({msg,type}); setTimeout(()=>setToast(null),4000); };

  const savePw = async () => {
    if(!pw.current||!pw.next||!pw.confirm) return toast$(t('profil.tousChampsRequis'),'err');
    if(pw.next!==pw.confirm)               return toast$(t('profil.motDePassesDifferents'),'err');
    if(pw.next.length<8)                   return toast$(t('profil.min8Caracteres'),'err');
    setSaving(true);
    try {
      await api.put('/commun/profil/password',{ancienMotDePasse:pw.current,nouveauMotDePasse:pw.next});
      setPw({current:'',next:'',confirm:''}); setEditPw(false);
      toast$(t('profil.motDePasseModifie'));
    } catch(e){ toast$(e.response?.data?.message||t('profil.motDePasseIncorrect'),'err'); }
    setSaving(false);
  };

  const saveField = async (field, val) => {
    try {
      const newInfo = {...info,[field]:val};
      const r = await api.put('/commun/profil', newInfo);
      if(setUser) setUser(u=>({...u,...r.data}));
      setInfo(newInfo);
      toast$(field==='email' ? t('profil.emailMisAJour') : t('profil.telephoneMisAJour'));
    } catch(e){ toast$(e.response?.data?.message||t('profil.erreur'),'err'); }
  };

  // Correction de la date : utilisation de i18n.language
  const fmtDate = d => d ? new Date(d).toLocaleDateString(i18n.language, { day:'2-digit', month:'long', year:'numeric' }) : '—';
  const initials = `${user?.prenom?.[0]||''}${user?.nom?.[0]||''}`.toUpperCase();
  const strip = getStatsStrip(user?.role, stats, user, t, i18n);

  return (
    <>
      <style>{css}</style>
      <div className="pp">

        {/* HERO */}
        <div className="pp-hero-wrap">
          <div className="pp-hero">
            <div className="pp-hero-inner">
              <div className="pp-avatar">{initials}</div>
              <div className="pp-hero-info">
                <div className="pp-matricule">{user?.matricule}</div>
                <h1 className="pp-name">{user?.prenom} {user?.nom}</h1>
                <span className="pp-role" style={{background:`${meta.color}22`,color:meta.color}}>
                  {meta.label}
                </span>
              </div>
            </div>
            <div className="pp-strip">
              {strip.map((s,i)=>(
                <div key={i} className="pp-stat">
                  <span className="pp-stat-v">{s.val}</span>
                  <span className="pp-stat-l">{s.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* BODY 2 COLONNES */}
        <div className="pp-body">

          {toast && (
            <div className={toast.type==='ok'?'pp-ok':'pp-err'} style={{gridColumn:'1/-1'}}>
              {toast.type==='ok'?Ic.check:Ic.warn} {toast.msg}
            </div>
          )}

          {/* COLONNE 1 : Informations personnelles */}
          <div className="pp-section">
            <div className="pp-section-hd">
              <div className="pp-section-hd-left">
                <div className="pp-section-ico">{Ic.user}</div>
                <span className="pp-section-title">{t('profil.informationsPersonnelles')}</span>
              </div>
            </div>

            <ReadRow ico={Ic.user} icoBg="rgba(0,40,85,.07)" icoColor="#002855"
              label={t('profil.nomComplet')}
              value={`${user?.prenom||''} ${user?.nom||''}`.trim()||null}/>

            <ReadRow ico={Ic.id} icoBg="rgba(0,63,138,.07)" icoColor="#003F8A"
              label={t('profil.matricule')} value={user?.matricule}/>

            <ReadRow ico={Ic.pin} icoBg="rgba(0,87,184,.07)" icoColor="#0057B8"
              label={t('profil.site')} value={user?.siteNom || t('profil.nonAffecte')}/>

            <ReadRow ico={Ic.factory} icoBg="rgba(0,40,85,.06)" icoColor="#002855"
              label={t('profil.plant')} value={user?.plantNom || t('profil.nonAffecte')}/>

            <InlineRow ico={Ic.mail} icoBg="rgba(0,87,184,.06)" icoColor="#0057B8"
              label={t('profil.email')} value={user?.email||''}
              onSave={v=>saveField('email',v)} t={t}/>

            <InlineRow ico={Ic.phone} icoBg="rgba(107,131,168,.07)" icoColor="#6B83A8"
              label={t('profil.telephone')} value={user?.telephone||''}
              onSave={v=>saveField('telephone',v)} t={t} last/>
          </div>

          {/* COLONNE 2 : Compte + Sécurité */}
          <div style={{display:'flex',flexDirection:'column',gap:'1.25rem'}}>

            <div className="pp-section">
              <div className="pp-section-hd">
                <div className="pp-section-hd-left">
                  <div className="pp-section-ico">{Ic.shield}</div>
                  <span className="pp-section-title">{t('profil.informationsCompte')}</span>
                </div>
              </div>

              <ReadRow ico={Ic.id} icoBg="rgba(0,40,85,.07)" icoColor="#002855"
                label={t('profil.role')} value={meta.label}
                badge={<span style={{background:`${meta.color}18`,color:meta.color,fontSize:'.7rem',fontWeight:700,padding:'3px 10px',borderRadius:99}}>{meta.label?.split(' ')[0]}</span>}/>

              <ReadRow ico={Ic.cal} icoBg="rgba(0,63,138,.07)" icoColor="#003F8A"
                label={t('profil.dateCreation')} value={fmtDate(user?.dateCreation)}/>

              <ReadRow ico={Ic.clock} icoBg="rgba(0,87,184,.07)" icoColor="#0057B8"
                label={t('profil.statutCompte')} value={user?.actif ? t('profil.actif') : t('profil.inactif')}
                badge={<span style={{background:user?.actif?'#F0FDF4':'#FEF2F2',color:user?.actif?'#16A34A':'#B91C1C',fontSize:'.7rem',fontWeight:700,padding:'3px 10px',borderRadius:99}}>
                  {user?.actif ? t('profil.actif') : t('profil.inactif')}
                </span>}
                last/>
            </div>

            <div className="pp-section">
              <div className="pp-section-hd-plain">
                <div className="pp-section-hd-left">
                  <div className="pp-section-ico-plain">{Ic.key}</div>
                  <span className="pp-section-title-plain">{t('profil.securite')}</span>
                </div>
                {!editPw && (
                  <button className="pp-btn" style={{background:'#F1F5F9',color:'#0B1E3D',border:'.5px solid #E2E8F0',fontSize:'.8rem'}} onClick={()=>setEditPw(true)}>
                    {Ic.edit} {t('profil.modifier')}
                  </button>
                )}
              </div>

              {editPw ? (
                <div style={{padding:'14px 18px'}}>
                  {[
                    {k:'current', l:t('profil.motDePasseActuel')},
                    {k:'next',   l:t('profil.nouveauMotDePasse'), hint:true},
                    {k:'confirm',l:t('profil.confirmerMotDePasse')},
                  ].map(f=>(
                    <div key={f.k} style={{marginBottom:'1rem'}}>
                      <label className="pp-label">{f.l}</label>
                      <div className="pp-input-wrap">
                        <input type={showPw[f.k]?'text':'password'} className="pp-input"
                          value={pw[f.k]} placeholder="••••••••"
                          onChange={e=>setPw(p=>({...p,[f.k]:e.target.value}))}
                          style={{paddingRight:'2.25rem'}}/>
                        <button type="button" className="pp-eye"
                          onClick={()=>setShowPw(p=>({...p,[f.k]:!p[f.k]}))}>
                          {showPw[f.k]?Ic.eyeoff:Ic.eye}
                        </button>
                      </div>
                      {f.hint && <PwForce pw={pw.next} t={t}/>}
                    </div>
                  ))}
                  <div style={{display:'flex',gap:8,marginTop:'1rem'}}>
                    <button className="pp-btn pp-navy" onClick={savePw} disabled={saving}>
                      {saving ? t('profil.miseAJour') : <>{Ic.check} {t('profil.changer')}</>}
                    </button>
                    <button className="pp-btn pp-ghost" onClick={()=>{setEditPw(false);setPw({current:'',next:'',confirm:''});}}>
                      {Ic.x} {t('profil.annuler')}
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <ReadRow ico={Ic.shield} icoBg="rgba(0,40,85,.07)" icoColor="#002855"
                    label={t('profil.modeAuthentification')} value={t('profil.modeAuthentificationValue')}
                    badge={<span style={{background:'rgba(0,87,184,.1)',color:'#0057B8',fontSize:'.7rem',fontWeight:700,padding:'3px 10px',borderRadius:99}}>{t('commun.actif')}</span>}/>
                  <ReadRow ico={Ic.key} icoBg="rgba(0,63,138,.07)" icoColor="#003F8A"
                    label={t('profil.motDePasse')} value="••••••••••" last/>
                </>
              )}
            </div>

          </div>
        </div>
      </div>
    </>
  );
}