// ═══════════════════════════════════════════════════════════════════
// ParametresPage.jsx — v11 FINAL — i18n complet (langues & fuseaux)
// ═══════════════════════════════════════════════════════════════════
import { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from 'react-i18next';
import api from '../../services/api';

// ── Icônes (inchangés) ──────────────────────────────────────────
const I = {
  shield:  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  bell:    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>,
  palette: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="13.5" cy="6.5" r="1"/><circle cx="17.5" cy="10.5" r="1"/><circle cx="8.5" cy="7.5" r="1"/><circle cx="6.5" cy="12.5" r="1"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/></svg>,
  globe:   <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>,
  device:  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="5" y="2" width="14" height="20" rx="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>,
  lock:    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>,
  eye:     <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>,
  eyeoff:  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>,
  check:   <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>,
  x:       <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  warn:    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>,
  save:    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>,
  logout:  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
  settings:<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>,
  mail:    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>,
};

// Types de notifications – traduits dynamiquement
const getEmailNotifTypes = (t) => [
  { key:'CERTIF_EXPIRE_7J',    label: t('parametres.certifExpire7J'),   desc: t('parametres.emailTypeUrgent') },
  { key:'CERTIF_EXPIRE_30J',   label: t('parametres.certifExpire30J'),  desc: t('parametres.emailTypeRappel') },
  { key:'CERTIF_EXPIREE',      label: t('parametres.certifExpired'),     desc: t('parametres.emailTypeUrgent') },
  { key:'CERTIF_OBTENUE',      label: t('parametres.certifObtained'),    desc: t('parametres.emailTypeSucces') },
  { key:'CERTIF_BLOQUE',       label: t('parametres.certifBlocked'),     desc: t('parametres.emailTypeAlerte') },
  { key:'ROLE_CHANGE',         label: t('parametres.roleChange'),        desc: t('parametres.emailTypeCompte') },
  { key:'COMPTE_ACTIVE',       label: t('parametres.compteActiveDesactive'), desc: t('parametres.emailTypeCompte') },
  { key:'ALERTE',              label: t('parametres.alerteImportante'),  desc: t('parametres.emailTypeAlerte') },
];

function getTabs(role, t) {
  const base = [
    { id:'securite',      icon:I.shield,  label:t('parametres.securite')      },
    { id:'notifications', icon:I.bell,    label:t('parametres.notifications') },
    { id:'apparence',     icon:I.palette, label:t('parametres.apparence')     },
    { id:'langue',        icon:I.globe,   label:t('parametres.langue')        },
    { id:'sessions',      icon:I.device,  label:t('parametres.sessions')      },
  ];
  if (role === 'ADMIN')
    return [...base, { id:'systeme', icon:I.settings, label:t('parametres.systeme') }, { id:'examens', icon:I.lock, label:t('parametres.examens') }];
  if (role === 'EXPERT_PRODUCT_AUDIT')
    return [...base, { id:'examens', icon:I.lock, label:t('parametres.certifications') }];
  return base;
}

// ── Composants réutilisables (inchangés) ────────────────────────
function Toggle({ checked, onChange }) {
  return (
    <div onClick={() => onChange(!checked)}
      style={{ width:44, height:24, borderRadius:99, cursor:'pointer', flexShrink:0,
        background:checked?'#0B1E3D':'#CBD5E1', position:'relative', transition:'background .2s' }}>
      <div style={{ position:'absolute', top:3, left:checked?23:3, width:18, height:18,
        borderRadius:'50%', background:'#fff', boxShadow:'0 1px 4px rgba(0,0,0,.2)', transition:'left .2s' }}/>
    </div>
  );
}

function Row({ icon, iconBg, iconColor, label, sub, right, last }) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 0',
      borderBottom:last?'none':'1px solid #F8FAFC' }}>
      <div style={{ width:36, height:36, borderRadius:10, background:iconBg||'#F1F5F9',
        color:iconColor||'#374151', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
        {icon}
      </div>
      <div style={{ flex:1 }}>
        <p style={{ margin:0, fontSize:'.85rem', fontWeight:600, color:'#0B1E3D' }}>{label}</p>
        {sub && <p style={{ margin:'2px 0 0', fontSize:'.72rem', color:'#94A3B8' }}>{sub}</p>}
      </div>
      {right && <div style={{ flexShrink:0 }}>{right}</div>}
    </div>
  );
}

function Card({ title, icon, children }) {
  return (
    <div style={{ background:'#fff', borderRadius:15, border:'.5px solid #E2E8F0',
      overflow:'hidden', boxShadow:'0 2px 10px rgba(0,0,0,.05)', marginBottom:'1.25rem' }}>
      <div style={{ background:'#CBD5E1', borderRadius:12, margin:'10px 10px 0', padding:'10px 16px',
        display:'flex', alignItems:'center', gap:8 }}>
        <div style={{ width:26, height:26, borderRadius:7, background:'rgba(0,40,85,.1)',
          color:'#0B1E3D', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
          {icon}
        </div>
        <span style={{ fontSize:'.82rem', fontWeight:800, color:'#0B1E3D' }}>{title}</span>
      </div>
      <div style={{ padding:'0 16px 14px' }}>{children}</div>
    </div>
  );
}

function PwField({ label, value, onChange, show, onToggle }) {
  return (
    <div>
      <label style={{ display:'block', fontSize:'.73rem', fontWeight:700, color:'#64748b',
        textTransform:'uppercase', letterSpacing:'.06em', marginBottom:6 }}>{label}</label>
      <div style={{ position:'relative' }}>
        <input type={show?'text':'password'} value={value} onChange={onChange} placeholder="••••••••"
          style={{ width:'100%', padding:'10px 13px', paddingRight:38, border:'1.5px solid #E2E8F0',
            borderRadius:10, fontSize:'.87rem', fontWeight:600, color:'#0B1E3D', outline:'none',
            fontFamily:'inherit', transition:'border .15s', boxSizing:'border-box' }}
          onFocus={e=>{e.target.style.borderColor='#0B1E3D';e.target.style.boxShadow='0 0 0 3px rgba(11,30,61,.07)';}}
          onBlur={e=>{e.target.style.borderColor='#E2E8F0';e.target.style.boxShadow='none';}}/>
        <button type="button" onClick={onToggle}
          style={{ position:'absolute', right:10, top:'50%', transform:'translateY(-50%)',
            background:'none', border:'none', cursor:'pointer', color:'#94A3B8', display:'flex', padding:2 }}>
          {show?I.eyeoff:I.eye}
        </button>
      </div>
    </div>
  );
}

function PwForce({ pw }) {
  if (!pw) return null;
  const c = [pw.length>=8,/[A-Z]/.test(pw),/[0-9]/.test(pw),/[^A-Za-z0-9]/.test(pw)].filter(Boolean).length;
  const cols = ['#EF4444','#F97316','#1D4ED8','#0B1E3D'];
  const lbls = ['Très faible','Faible','Correct','Fort']; // Ces labels pourraient aussi être traduits si besoin
  return (
    <div style={{ marginTop:6 }}>
      <div style={{ display:'flex', gap:3 }}>
        {[0,1,2,3].map(i=><div key={i} style={{ flex:1, height:3, borderRadius:99,
          background:i<c?cols[c-1]:'#E2E8F0', transition:'background .3s' }}/>)}
      </div>
      <span style={{ fontSize:'.68rem', fontWeight:700, color:c>0?cols[c-1]:'#94A3B8', display:'block', marginTop:2 }}>
        {c>0?lbls[c-1]:'Choisissez un mot de passe'}
      </span>
    </div>
  );
}

function Toast({ data, onClose }) {
  if (!data) return null;
  const ok = data.type === 'ok';
  return (
    <div style={{ background:ok?'#EFF6FF':'#FEF2F2', border:`1px solid ${ok?'#BFDBFE':'#FECACA'}`,
      color:ok?'#1E40AF':'#B91C1C', padding:'10px 16px', borderRadius:11, fontSize:'.82rem',
      fontWeight:700, display:'flex', alignItems:'center', gap:8, marginBottom:'1.25rem',
      gridColumn:'1/-1' }}>
      {ok?I.check:I.warn} {data.msg}
      <button onClick={onClose} style={{ marginLeft:'auto', background:'none', border:'none',
        cursor:'pointer', color:'inherit', opacity:.5, fontSize:'1rem' }}>×</button>
    </div>
  );
}

function Btn({ children, onClick, disabled, variant='navy' }) {
  const v = {
    navy:  { background:'#0B1E3D', color:'#fff', border:'none' },
    ghost: { background:'#F1F5F9', color:'#374151', border:'.5px solid #E2E8F0' },
    red:   { background:'#FEF2F2', color:'#B91C1C', border:'.5px solid #FECACA' },
  };
  return (
    <button onClick={onClick} disabled={disabled}
      style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'9px 18px',
        borderRadius:10, fontSize:'.83rem', fontWeight:700, cursor:disabled?'not-allowed':'pointer',
        fontFamily:'inherit', opacity:disabled?.65:1, transition:'all .15s', ...v[variant] }}>
      {children}
    </button>
  );
}

function NumberInput({ label, value, onChange, min, max }) {
  return (
    <div>
      <label style={{ display:'block', fontSize:'.73rem', fontWeight:700, color:'#64748b',
        textTransform:'uppercase', letterSpacing:'.06em', marginBottom:7 }}>{label}</label>
      <input type="number" value={value} onChange={e => onChange(Number(e.target.value))}
        min={min} max={max}
        style={{ width:'100%', padding:'10px 13px', border:'1.5px solid #E2E8F0', borderRadius:10,
          fontSize:'.88rem', fontWeight:700, color:'#0B1E3D', outline:'none', fontFamily:'inherit',
          boxSizing:'border-box' }}
        onFocus={e=>{e.target.style.borderColor='#0B1E3D';e.target.style.boxShadow='0 0 0 3px rgba(11,30,61,.07)';}}
        onBlur={e=>{e.target.style.borderColor='#E2E8F0';e.target.style.boxShadow='none';}}/>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
export default function ParametresPage() {
  const { user, setUser, applyPreferences } = useAuth();
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const role     = user?.role || 'AUDITEUR';
  const tabs     = getTabs(role, t);

  const [active, setActive] = useState(location.state?.section || 'securite');
  const [toast,  setToast]  = useState(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const toast$ = useCallback((msg, type='ok') => {
    setToast({msg,type}); setTimeout(() => setToast(null), 4000);
  }, []);

  // États
  const [pw, setPw]         = useState({ current:'', next:'', confirm:'' });
  const [showPw, setShowPw] = useState({ current:false, next:false, confirm:false });
  const [emailActif,    setEmailActif]    = useState(false);
  const [emailTypes,    setEmailTypes]    = useState([]);
  const [pushActif,     setPushActif]     = useState(true);
  const [notifPlatform, setNotifPlatform] = useState({
    expirations: true, assignations: true, alertes: true, systeme: false,
  });
  const [theme,      setTheme]      = useState('light');
  const [compact,    setCompact]    = useState(false);
  const [animations, setAnimations] = useState(true);
  const [langue,   setLangue]   = useState(() => localStorage.getItem('lang') || 'fr');
  const [timezone, setTimezone] = useState(() => localStorage.getItem('timezone') || 'Africa/Tunis');
  const [dateFmt,  setDateFmt]  = useState(() => localStorage.getItem('dateFmt') || 'DD/MM/YYYY');
  const [sessions, setSessions] = useState([
    { id:1, device:'Chrome · Windows 11', loc:'Tunis, TN', time:'Maintenant', current:true,  ip:'192.168.1.12' },
    { id:2, device:'Safari · iPhone 15',  loc:'Tunis, TN', time:'Hier 14h30', current:false, ip:'192.168.1.15' },
  ]);
  const [examDureeTheo,  setExamDureeTheo]  = useState(30);
  const [examDureePrat,  setExamDureePrat]  = useState(30);
  const [seuilTheo,      setSeuilTheo]      = useState(70);
  const [seuilPrat,      setSeuilPrat]      = useState(70);
  const [sessionDuree,   setSessionDuree]   = useState(30);
  const [tentativesMax,  setTentativesMax]  = useState(5);

  // Chargement des préférences
  useEffect(() => {
    api.get('/commun/preferences')
      .then(r => {
        const p = r.data;
        setTheme(p.theme || 'light');
        setCompact(!!p.modeCompact);
        setAnimations(p.animations !== false);
        setLangue(localStorage.getItem('lang') || p.langue || 'fr');
        setTimezone(p.timezone || 'Africa/Tunis');
        setDateFmt(p.dateFormat || 'DD/MM/YYYY');
        setEmailActif(!!p.emailNotificationsActif);
        setEmailTypes(p.emailNotificationsTypes || []);
        setPushActif(p.push !== false);
        if (p.dureeTheorique)   setExamDureeTheo(p.dureeTheorique);
        if (p.dureePratique)    setExamDureePrat(p.dureePratique);
        if (p.seuilTheorique)   setSeuilTheo(p.seuilTheorique);
        if (p.seuilPratique)    setSeuilPrat(p.seuilPratique);
        if (p.dureeSession)     setSessionDuree(p.dureeSession);
        if (p.tentativesMax)    setTentativesMax(p.tentativesMax);
      })
      .catch(() => {
        // Fallback localStorage
        setTheme(localStorage.getItem('theme') || 'light');
        setCompact(localStorage.getItem('compact') === 'true');
        setAnimations(localStorage.getItem('animations') !== 'false');
        setLangue(localStorage.getItem('lang') || 'fr');
        setTimezone(localStorage.getItem('timezone') || 'Africa/Tunis');
        setDateFmt(localStorage.getItem('dateFmt') || 'DD/MM/YYYY');
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!langue) return;
    i18n.changeLanguage(langue);
    localStorage.setItem('lang', langue);
  }, [langue, i18n]);

  // Appliquer le thème
  useEffect(() => {
    applyPreferences({ theme, modeCompact: compact, animations });
  }, [theme, compact, animations, applyPreferences]);

  const toggleEmailType = (key) => {
    setEmailTypes(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]);
  };

  // Sauvegardes
  const savePw = async () => {
    if (!pw.current||!pw.next||!pw.confirm) return toast$(t('parametres.champsRequis'),'err');
    if (pw.next !== pw.confirm)              return toast$(t('parametres.motDePassesDifferents'),'err');
    if (pw.next.length < 8)                  return toast$(t('parametres.min8'),'err');
    setSaving(true);
    try {
      await api.put('/commun/profil/password', { ancienMotDePasse:pw.current, nouveauMotDePasse:pw.next });
      setPw({current:'',next:'',confirm:''});
      toast$(t('parametres.modifieOk'));
    } catch(e) { toast$(e.response?.data?.message||t('parametres.motDePasseIncorrect'),'err'); }
    setSaving(false);
  };

  const saveNotifs = async () => {
    setSaving(true);
    try {
      await api.put('/commun/preferences', {
        emailNotificationsActif: emailActif,
        emailNotificationsTypes: emailTypes,
        push: pushActif,
      });
      applyPreferences({ emailNotificationsActif: emailActif, emailNotificationsTypes: emailTypes, push: pushActif });
      toast$(t('parametres.notifsEnregistrees'));
    } catch { toast$(t('parametres.erreurSauvegarde'),'err'); }
    setSaving(false);
  };

  const saveTheme = async () => {
    setSaving(true);
    try {
      await api.put('/commun/preferences', { theme, modeCompact: compact, animations });
      applyPreferences({ theme, modeCompact: compact, animations });
      if (setUser) setUser(u => ({ ...u, theme, modeCompact: compact, animations }));
      toast$(t('parametres.themeApplique'));
    } catch { toast$(t('parametres.erreurSauvegarde'),'err'); }
    setSaving(false);
  };

  const saveLang = async () => {
    setSaving(true);
    try {
      await api.put('/commun/preferences', { langue, timezone, dateFormat: dateFmt });
      applyPreferences({ langue, timezone, dateFormat: dateFmt });
      if (setUser) setUser(u => ({ ...u, langue, timezone, dateFormat: dateFmt }));
      i18n.changeLanguage(langue);
      localStorage.setItem('lang', langue);
      toast$(t('parametres.langueEnregistree'));
    } catch { toast$(t('parametres.erreurSauvegarde'),'err'); }
    setSaving(false);
  };

  // ── Rendu des colonnes ─────────────────────────────────────────
  const renderColumns = () => {
    switch(active) {
      case 'securite': return {
        left: (
          <Card title={t('parametres.modifierMdpTitle')} icon={I.shield}>
            <div style={{ display:'flex', flexDirection:'column', gap:'1rem', paddingTop:'.75rem' }}>
              {[
                {k:'current', l:t('parametres.motDePasseActuel')},
                {k:'next', l:t('parametres.nouveauMotDePasse')},
                {k:'confirm', l:t('parametres.confirmerMotDePasse')}
              ].map(f => (
                <div key={f.k}>
                  <PwField label={f.l} value={pw[f.k]}
                    onChange={e=>setPw(p=>({...p,[f.k]:e.target.value}))}
                    show={showPw[f.k]} onToggle={()=>setShowPw(p=>({...p,[f.k]:!p[f.k]}))}/>
                  {f.k==='next' && pw.next && <PwForce pw={pw.next}/>}
                </div>
              ))}
              <div style={{ display:'flex', gap:8, paddingTop:1 }}>
                <Btn onClick={savePw} disabled={saving}>{I.save} {saving ? t('parametres.enregistrement') : t('parametres.enregistrer')}</Btn>
                <Btn onClick={()=>setPw({current:'',next:'',confirm:''})} variant="ghost">{I.x} {t('parametres.annuler')}</Btn>
              </div>
            </div>
          </Card>
        ),
        right: (
          <Card title={t('parametres.statutSecuriteTitle')} icon={I.lock}>
            <Row icon={I.shield} iconBg="#EFF6FF" iconColor="#1D4ED8"
              label={t('parametres.authMatricule')} sub={t('parametres.validiteJwt')}
              right={<span style={{background:'#EFF6FF',color:'#1D4ED8',fontSize:'.72rem',fontWeight:700,padding:'3px 10px',borderRadius:99}}>{t('parametres.actif')}</span>}/>
            <Row icon={I.lock} iconBg="#F0F9FF" iconColor="#0369A1"
              label={t('parametres.chiffrementAes')} sub={t('parametres.donneesProtegeesServeur')} last
              right={<span style={{background:'#F0F9FF',color:'#0369A1',fontSize:'.72rem',fontWeight:700,padding:'3px 10px',borderRadius:99}}>{t('parametres.actif')}</span>}/>
          </Card>
        ),
      };

      case 'notifications': {
        const emailNotifTypes = getEmailNotifTypes(t);
        return {
          left: (
            <>
              <Card title={t('parametres.alertesInAppTitle')} icon={I.bell}>
                {[
                  {k:'expirations', l:t('parametres.expirationsCertifsLabel'), s:t('parametres.expirationsCertifsDesc'), def:true},
                  {k:'assignations',l:t('parametres.nouvellesAssignationsLabel'), s:t('parametres.nouvellesAssignationsDesc'), def:true},
                  {k:'alertes',     l:t('parametres.alertesQualiteLabel'), s:t('parametres.alertesQualiteDesc'), def:true},
                  {k:'systeme',     l:t('parametres.notifsSystemeLabel'), s:t('parametres.notifsSystemeDesc'), def:false},
                ].map((n,i,a)=>(
                  <Row key={n.k} icon={I.bell} iconBg="#EFF6FF" iconColor="#1D4ED8"
                    label={n.l} sub={n.s} last={i===a.length-1}
                    right={<Toggle checked={notifPlatform[n.k]??n.def}
                      onChange={v=>setNotifPlatform(p=>({...p,[n.k]:v}))}/>}/>
                ))}
              </Card>

              <Card title={t('parametres.emailNotificationsTitle')} icon={I.mail}>
                <div style={{ paddingTop:8 }}>
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between',
                    padding:'10px 0', borderBottom:'1px solid #F8FAFC', marginBottom:8 }}>
                    <div>
                      <p style={{ margin:0, fontSize:'.85rem', fontWeight:700, color:'#0B1E3D' }}>
                        {t('parametres.emailActiver')}
                      </p>
                      <p style={{ margin:'2px 0 0', fontSize:'.72rem', color:'#94A3B8' }}>
                        {t('parametres.emailActiverDesc')}
                      </p>
                    </div>
                    <Toggle checked={emailActif} onChange={setEmailActif}/>
                  </div>

                  {emailActif && (
                    <div style={{ display:'flex', flexDirection:'column', gap:6, paddingTop:4 }}>
                      <p style={{ margin:'0 0 8px', fontSize:'.72rem', fontWeight:700, color:'#64748b',
                        textTransform:'uppercase', letterSpacing:'.06em' }}>
                        {t('parametres.choisirTypesEmail')}
                      </p>
                      {emailNotifTypes.map(tItem => (
                        <div key={tItem.key} onClick={() => toggleEmailType(tItem.key)}
                          style={{ display:'flex', alignItems:'center', gap:10, padding:'9px 12px',
                            borderRadius:10, border:`1.5px solid ${emailTypes.includes(tItem.key)?'#0B1E3D':'#E2E8F0'}`,
                            cursor:'pointer', background:emailTypes.includes(tItem.key)?'#F0F5FF':'#fff',
                            transition:'all .15s' }}>
                          <div style={{ width:18, height:18, borderRadius:5, border:`2px solid ${emailTypes.includes(tItem.key)?'#0B1E3D':'#CBD5E1'}`,
                            background:emailTypes.includes(tItem.key)?'#0B1E3D':'transparent',
                            display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, transition:'all .15s' }}>
                            {emailTypes.includes(tItem.key) && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>}
                          </div>
                          <div style={{ flex:1 }}>
                            <p style={{ margin:0, fontSize:'.83rem', fontWeight:600, color:'#0B1E3D' }}>{tItem.label}</p>
                          </div>
                          <span style={{ fontSize:'.65rem', fontWeight:700, padding:'2px 8px', borderRadius:99,
                            background:tItem.desc===t('parametres.emailTypeUrgent')?'#FEF2F2':tItem.desc===t('parametres.emailTypeAlerte')?'#FFFBEB':'#EFF6FF',
                            color:tItem.desc===t('parametres.emailTypeUrgent')?'#B91C1C':tItem.desc===t('parametres.emailTypeAlerte')?'#C8982A':'#1D4ED8' }}>
                            {tItem.desc}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </Card>
            </>
          ),
          right: (
            <>
              <Card title={t('parametres.livraisonCanaux')} icon={I.globe}>
                <Row icon={I.bell} iconBg="#EFF6FF" iconColor="#1652AB"
                  label={t('parametres.pushInApp')} sub={t('parametres.pushInAppDesc')}
                  right={<Toggle checked={pushActif} onChange={setPushActif}/>}/>
                <Row icon={I.mail} iconBg="#F0F9FF" iconColor="#0369A1"
                  label={t('parametres.activerEmails')} sub={user?.email || t('commun.nonRenseigne')} last
                  right={<Toggle checked={emailActif} onChange={setEmailActif}/>}/>
              </Card>

              <div style={{ background:'#EFF6FF', border:'1px solid #BFDBFE', borderRadius:12,
                padding:'12px 16px', marginBottom:'1.25rem' }}>
                <p style={{ margin:'0 0 4px', fontSize:'.82rem', fontWeight:700, color:'#1D4ED8' }}>
                  📧 {t('parametres.aProposEmails')}
                </p>
                <p style={{ margin:0, fontSize:'.76rem', color:'#374151', lineHeight:1.6 }}>
                  {t('parametres.infoConnexionEmail')}
                </p>
              </div>

              <Btn onClick={saveNotifs} disabled={saving}>{I.save} {saving ? t('parametres.enregistrement') : t('parametres.enregistrer')}</Btn>
            </>
          ),
        };
      }

      case 'apparence': return {
        left: (
          <Card title={t('parametres.themeInterface')} icon={I.palette}>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, paddingTop:'.75rem' }}>
              {[
                {id:'light', ico:'☀️', l:t('parametres.clair'), s:'Interface lumineuse'},
                {id:'dark', ico:'🌙', l:t('parametres.sombre'), s:'Moins de fatigue'}
              ].map(themeOpt=>(
                <div key={themeOpt.id} onClick={() => setTheme(themeOpt.id)}
                  style={{ border:`2px solid ${theme===themeOpt.id?'#0B1E3D':'#E2E8F0'}`, borderRadius:13,
                    padding:'1.25rem', cursor:'pointer', textAlign:'center',
                    background:theme===themeOpt.id?'#F0F5FF':'#fff', transition:'all .15s' }}>
                  <div style={{ fontSize:'2rem', marginBottom:6 }}>{themeOpt.ico}</div>
                  <p style={{ margin:0, fontWeight:800, fontSize:'.86rem', color:'#0B1E3D' }}>{themeOpt.l}</p>
                  <p style={{ margin:'3px 0 0', fontSize:'.72rem', color:'#94A3B8' }}>{themeOpt.s}</p>
                  {theme===themeOpt.id && <span style={{ display:'inline-block', marginTop:8, background:'#0B1E3D',
                    color:'#fff', fontSize:'.65rem', fontWeight:700, padding:'2px 8px', borderRadius:99 }}>{t('parametres.actif')}</span>}
                </div>
              ))}
            </div>
            <div style={{ paddingTop:'1rem' }}>
              <Btn onClick={saveTheme} disabled={saving}>{I.check} {saving ? t('parametres.application') : t('parametres.appliquer')}</Btn>
            </div>
          </Card>
        ),
        right: (
          <Card title={t('parametres.alertesInAppTitle')} icon={I.settings}>
            <Row icon={I.settings} iconBg="#EFF6FF" iconColor="#1D4ED8"
              label={t('parametres.modeCompact')} sub={t('parametres.modeCompactDesc')}
              right={<Toggle checked={compact} onChange={setCompact}/>}/>
            <Row icon={I.palette} iconBg="#F0F9FF" iconColor="#0369A1"
              label={t('parametres.animations')} sub={t('parametres.animationsDesc')} last
              right={<Toggle checked={animations} onChange={setAnimations}/>}/>
            <div style={{ paddingTop:'1rem' }}>
              <Btn onClick={saveTheme} disabled={saving}>{I.save} {saving ? t('parametres.enregistrement') : t('parametres.enregistrer')}</Btn>
            </div>
          </Card>
        ),
      };

      case 'langue': return {
        left: (
          <Card title={t('parametres.langueInterface')} icon={I.globe}>
            <div style={{ display:'flex', flexDirection:'column', gap:10, paddingTop:'.75rem' }}>
              {[
                { code: 'fr', flag: '🇫🇷' },
                { code: 'ar', flag: '🇹🇳' },
                { code: 'en', flag: '🇺🇸' },
                { code: 'it', flag: '🇮🇹' },
                { code: 'es', flag: '🇪🇸' },
                { code: 'de', flag: '🇩🇪' },
              ].map(lang => (
                <div key={lang.code} onClick={() => setLangue(lang.code)}
                  style={{ display:'flex', alignItems:'center', gap:12, padding:'11px 14px',
                    borderRadius:12, border:`2px solid ${langue===lang.code?'#0B1E3D':'#E2E8F0'}`,
                    cursor:'pointer', background:langue===lang.code?'#F0F5FF':'#fff', transition:'all .15s' }}>
                  <span style={{ fontSize:'1.5rem' }}>{lang.flag}</span>
                  <div style={{ flex:1 }}>
                    <p style={{ margin:0, fontWeight:700, fontSize:'.86rem', color:'#0B1E3D' }}>
                      {t(`parametres.langueOptions.${lang.code}`)}
                    </p>
                    <p style={{ margin:0, fontSize:'.72rem', color:'#94A3B8' }}>
                      {t(`parametres.langueOptions.${lang.code}Desc`)}
                    </p>
                  </div>
                  {langue === lang.code && <span style={{ color:'#0B1E3D' }}>{I.check}</span>}
                </div>
              ))}
            </div>
          </Card>
        ),
        right: (
          <>
            <Card title={t('parametres.configGlobale')} icon={I.settings}>
              <div style={{ padding:'10px 0', borderBottom:'1px solid #F8FAFC' }}>
                <label style={{ display:'block', fontSize:'.72rem', fontWeight:700, color:'#64748b',
                  textTransform:'uppercase', letterSpacing:'.06em', marginBottom:7 }}>
                  {t('parametres.fuseauHoraire')}
                </label>
                <select value={timezone} onChange={e => setTimezone(e.target.value)}
                  style={{ width:'100%', padding:'9px 12px', border:'1.5px solid #E2E8F0', borderRadius:10,
                    fontSize:'.86rem', fontWeight:600, color:'#0B1E3D', outline:'none', fontFamily:'inherit' }}>
                  <option value="Africa/Tunis">{t('parametres.timezoneOptions.africaTunis')}</option>
                  <option value="Europe/Paris">{t('parametres.timezoneOptions.europeParis')}</option>
                  <option value="UTC">{t('parametres.timezoneOptions.utc')}</option>
                </select>
              </div>
              <div style={{ padding:'10px 0', borderBottom:'none' }}>
                <label style={{ display:'block', fontSize:'.72rem', fontWeight:700, color:'#64748b',
                  textTransform:'uppercase', letterSpacing:'.06em', marginBottom:7 }}>
                  {t('parametres.formatDate')}
                </label>
                <select value={dateFmt} onChange={e => setDateFmt(e.target.value)}
                  style={{ width:'100%', padding:'9px 12px', border:'1.5px solid #E2E8F0', borderRadius:10,
                    fontSize:'.86rem', fontWeight:600, color:'#0B1E3D', outline:'none', fontFamily:'inherit' }}>
                  <option value="DD/MM/YYYY">{t('parametres.dateFormatOptions.ddmmyyyy')}</option>
                  <option value="MM/DD/YYYY">{t('parametres.dateFormatOptions.mmmmyyyy')}</option>
                  <option value="YYYY-MM-DD">{t('parametres.dateFormatOptions.yyyymmdd')}</option>
                </select>
              </div>
            </Card>
            <Btn onClick={saveLang} disabled={saving}>{I.save} {saving ? t('parametres.enregistrement') : t('parametres.enregistrer')}</Btn>
          </>
        ),
      };

      case 'sessions': return {
        left: (
          <Card title={t('parametres.appareilsConnectes')} icon={I.device}>
            {sessions.map((s,i)=>(
              <Row key={s.id} icon={I.device}
                iconBg={s.current?'#EFF6FF':'#F1F5F9'} iconColor={s.current?'#1D4ED8':'#64748b'}
                label={s.device} sub={`${s.loc} · ${s.ip} · ${s.time}`}
                last={i===sessions.length-1}
                right={s.current
                  ? <span style={{background:'#EFF6FF',color:'#1D4ED8',fontSize:'.72rem',fontWeight:700,padding:'3px 10px',borderRadius:99}}>{t('parametres.sessionActuelle')}</span>
                  : <button onClick={()=>{try{api.delete(`/commun/sessions/${s.id}`);}catch{}setSessions(p=>p.filter(x=>x.id!==s.id));toast$(t('parametres.sessionRevoquee'));}}
                      style={{display:'flex',alignItems:'center',gap:5,background:'#FEF2F2',border:'.5px solid #FECACA',color:'#B91C1C',borderRadius:8,padding:'5px 12px',fontSize:'.78rem',fontWeight:700,cursor:'pointer',fontFamily:'inherit'}}>
                      {I.logout} {t('parametres.revoquer')}
                    </button>}/>
            ))}
          </Card>
        ),
        right: sessions.filter(s=>!s.current).length > 0 ? (
          <Card title={t('parametres.deconnexionGlobale')} icon={I.logout}>
            <Row icon={I.logout} iconBg="#FEF2F2" iconColor="#B91C1C"
              label={t('parametres.toutRevoquer')} sub={t('parametres.deconnexionGlobaleDesc') || 'Action immédiate et irréversible'} last
              right={<button onClick={()=>{setSessions(s=>s.filter(x=>x.current));toast$(t('parametres.sessionsRevoquees'));}}
                style={{display:'flex',alignItems:'center',gap:5,background:'#FEF2F2',border:'.5px solid #FECACA',color:'#B91C1C',borderRadius:9,padding:'8px 14px',fontSize:'.82rem',fontWeight:700,cursor:'pointer',fontFamily:'inherit'}}>
                {I.logout} {t('parametres.toutRevoquer')}
              </button>}/>
          </Card>
        ) : (
          <div style={{ background:'#F8FAFC', borderRadius:14, border:'.5px solid #E2E8F0',
            padding:'2rem', textAlign:'center', color:'#94A3B8' }}>
            <div style={{ fontSize:'2rem', marginBottom:8 }}>✅</div>
            <p style={{ fontWeight:700, color:'#374151', margin:0, fontSize:'.86rem' }}>{t('parametres.aucuneSession')}</p>
          </div>
        ),
      };

      case 'systeme': return {
        left: (
          <Card title={t('parametres.configGlobale')} icon={I.settings}>
            <div style={{ display:'flex', flexDirection:'column', gap:'1rem', paddingTop:'.75rem' }}>
              <NumberInput label={t('parametres.dureeSession')} value={sessionDuree} onChange={setSessionDuree} min={5} max={480}/>
              <NumberInput label={t('parametres.tentativesMax')} value={tentativesMax} onChange={setTentativesMax} min={1} max={10}/>
              <Btn onClick={async()=>{setSaving(true);try{await api.put('/commun/preferences',{dureeSession:sessionDuree,tentativesMax});toast$(t('parametres.systemeSauvegarde'));}catch{toast$(t('parametres.erreurSauvegarde'),'err');}setSaving(false);}} disabled={saving}>{I.save} {saving?t('parametres.enregistrement'):t('parametres.enregistrer')}</Btn>
            </div>
          </Card>
        ),
        right: (
          <Card title={t('parametres.aPropos')} icon={I.lock}>
            <Row icon={I.settings} iconBg="#EFF6FF" iconColor="#1D4ED8"
              label={t('parametres.version')} sub="Leoni PAP Platform"
              right={<span style={{background:'#F1F5F9',color:'#374151',fontSize:'.73rem',fontWeight:700,padding:'3px 10px',borderRadius:99}}>v2.0.0</span>}/>
            <Row icon={I.shield} iconBg="#F0F9FF" iconColor="#0369A1"
              label={t('parametres.conformite')} sub="ISO 9001:2015" last
              right={<span style={{background:'#EFF6FF',color:'#1D4ED8',fontSize:'.73rem',fontWeight:700,padding:'3px 10px',borderRadius:99}}>{t('commun.conformite')}</span>}/>
          </Card>
        ),
      };

      case 'examens': return {
        left: (
          <Card title={t('parametres.dureeTheoLabel') || t('parametres.dureeTheo')} icon={I.lock}>
            <div style={{ display:'flex', flexDirection:'column', gap:'1rem', paddingTop:'.75rem' }}>
              <NumberInput label={t('parametres.dureeTheo')} value={examDureeTheo} onChange={setExamDureeTheo} min={15} max={300}/>
              <NumberInput label={t('parametres.dureePrat')} value={examDureePrat} onChange={setExamDureePrat} min={15} max={300}/>
            </div>
          </Card>
        ),
        right: (
          <>
            <Card title={t('parametres.seuilReussite')} icon={I.shield}>
              <div style={{ display:'flex', flexDirection:'column', gap:'1rem', paddingTop:'.75rem' }}>
                <NumberInput label={t('parametres.seuilTheo')} value={seuilTheo} onChange={setSeuilTheo} min={50} max={100}/>
                <NumberInput label={t('parametres.seuilPrat')} value={seuilPrat} onChange={setSeuilPrat} min={50} max={100}/>
              </div>
            </Card>
            <Btn onClick={async()=>{setSaving(true);try{await api.put('/commun/preferences',{dureeTheorique:examDureeTheo,dureePratique:examDureePrat,seuilTheorique:seuilTheo,seuilPratique:seuilPrat});toast$(t('parametres.examensSauvegardes'));}catch{toast$(t('parametres.erreurSauvegarde'),'err');}setSaving(false);}} disabled={saving}>{I.save} {saving?t('parametres.enregistrement'):t('parametres.enregistrer')}</Btn>
          </>
        ),
      };

      default: return { left: null, right: null };
    }
  };

  const { left, right } = renderColumns();

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'60vh' }}>
      <span style={{ width:32, height:32, border:'3px solid #E2E8F0', borderTopColor:'#0B1E3D',
        borderRadius:'50%', display:'inline-block', animation:'spin .8s linear infinite' }}/>
    </div>
  );

  return (
    <div style={{ fontFamily:"'DM Sans',sans-serif", minHeight:'100%', background:'var(--page-bg,#F4F6FA)' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@700&family=DM+Sans:wght@400;500;600;700&display=swap');
        @keyframes up   { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        @keyframes fade { from{opacity:0} to{opacity:1} }
        @keyframes spin { to{transform:rotate(360deg)} }
        .ptab { transition:all .18s; cursor:pointer; white-space:nowrap; }
        .ptab:hover { background:#F1F5F9 !important; color:#0B1E3D !important; transform:translateY(-1px); }
        .ptab.act { background:#0B1E3D !important; color:#fff !important; border-color:#0B1E3D !important; box-shadow:0 4px 14px rgba(11,30,61,.25) !important; }
      `}</style>

      <div style={{ padding:'1.75rem 2rem' }}>
        <div style={{ display:'flex', gap:8, overflowX:'auto', paddingBottom:3, marginBottom:'1.75rem', flexWrap:'wrap' }}>
          {tabs.map(tItem => (
            <button key={tItem.id} className={`ptab ${active===tItem.id?'act':''}`}
              onClick={() => setActive(tItem.id)}
              style={{ display:'flex', alignItems:'center', gap:9, padding:'11px 20px',
                borderRadius:13, border:'1.5px solid #E2E8F0', background:'#fff',
                fontSize:'.88rem', fontWeight:700, color:'#64748b', fontFamily:'inherit' }}>
              <span style={{ display:'flex', alignItems:'center', opacity:active===tItem.id?1:.6 }}>{tItem.icon}</span>
              {tItem.label}
            </button>
          ))}
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1.25rem', alignItems:'start', animation:'up .3s ease' }}>
          {toast && <Toast data={toast} onClose={() => setToast(null)}/>}
          <div>{left}</div>
          <div>{right}</div>
        </div>
      </div>
    </div>
  );
}