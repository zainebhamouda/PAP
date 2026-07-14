import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { adminAPI } from '../../services/api';

const ROLES = [
  { value:'AUDITEUR',                     label:'Auditeur'            },
  { value:'CHEF_SERVICE',                 label:'Chef de Service'      },
  { value:'RESPONSABLE_QUALITE_CENTRALE', label:'Responsable Qualité'  },
  { value:'EXPERT_PRODUCT_AUDIT',         label:'Expert Product Audit' },
  { value:'ADMIN',                        label:'Administrateur'       },
];

const ROLE_CFG = {
  ADMIN:                        { color:'#C8982A', bg:'rgba(200,152,42,.12)' },
  AUDITEUR:                     { color:'#1D4ED8', bg:'rgba(29,78,216,.1)'   },
  CHEF_SERVICE:                 { color:'#0369A1', bg:'rgba(3,105,161,.1)'   },
  RESPONSABLE_QUALITE_CENTRALE: { color:'#6D28D9', bg:'rgba(109,40,217,.1)'  },
  EXPERT_PRODUCT_AUDIT:         { color:'#B91C1C', bg:'rgba(185,28,28,.1)'   },
};

const I = {
  edit:   <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  check:  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>,
  x:      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  arrow:  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>,
  user:   <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  id:     <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>,
  mail:   <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>,
  phone:  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.4 2 2 0 0 1 3.6 1.21h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.82a16 16 0 0 0 6.29 6.29l.98-.98a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>,
  pin:    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>,
  key:    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/></svg>,
  eye:    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>,
  eyeoff: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>,
  warn:   <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
  shield: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
};

function Card({ title, icon, action, children }) {
  return (
    <div style={{ background:'#fff', borderRadius:15, border:'.5px solid #E2E8F0', overflow:'hidden', boxShadow:'0 2px 10px rgba(0,0,0,.05)', marginBottom:'1.25rem' }}>
      <div style={{ background:'#CBD5E1', borderRadius:12, margin:'10px 10px 0', padding:'10px 16px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <div style={{ width:26, height:26, borderRadius:7, background:'rgba(0,40,85,.1)', color:'#0B1E3D', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>{icon}</div>
          <span style={{ fontSize:'.82rem', fontWeight:800, color:'#0B1E3D' }}>{title}</span>
        </div>
        {action}
      </div>
      <div style={{ padding:'0 16px 14px' }}>{children}</div>
    </div>
  );
}

function InfoRow({ icon, label, value, badge, editable, editNode, last }) {
  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'11px 0', borderBottom:last?'none':'1px solid #F8FAFC' }}>
      <div style={{ display:'flex', alignItems:'center', gap:11 }}>
        <div style={{ width:34, height:34, borderRadius:10, background:'#F1F5F9', color:'#374151', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>{icon}</div>
        <div>
          {editable ? editNode : <p style={{ margin:0, fontSize:'.85rem', fontWeight:700, color:value?'#0B1E3D':'#94A3B8', fontStyle:value?'normal':'italic' }}>{value||'Non renseigné'}</p>}
          <p style={{ margin:'2px 0 0', fontSize:'.71rem', color:'#94A3B8' }}>{label}</p>
        </div>
      </div>
      {badge && <div style={{ flexShrink:0 }}>{badge}</div>}
    </div>
  );
}

function RoleModal({ user, onClose, onConfirm, saving }) {
  const { t } = useTranslation();
  const [sel, setSel] = useState(user.role);
  const changed = sel !== user.role;
  const newCfg  = ROLE_CFG[sel] || { color:'#64748b', bg:'#F1F5F9' };

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(11,30,61,.55)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, backdropFilter:'blur(4px)' }}>
      <div style={{ background:'#fff', borderRadius:20, width:'100%', maxWidth:460, overflow:'hidden', boxShadow:'0 24px 64px rgba(0,0,0,.22)' }}>
        <div style={{ background:'linear-gradient(135deg,#0B1E3D,#1D4ED8)', padding:'1.25rem 1.5rem', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ width:38, height:38, borderRadius:10, background:'rgba(255,255,255,.15)', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
            </div>
            <div>
              <p style={{ margin:0, fontWeight:800, fontSize:'.95rem', color:'#fff' }}>{t('userDetail.roleModal.title')}</p>
              <p style={{ margin:0, fontSize:'.72rem', color:'rgba(255,255,255,.45)' }}>{user.prenom} {user.nom} · {user.matricule}</p>
            </div>
          </div>
          <button onClick={onClose} style={{ width:30, height:30, borderRadius:8, background:'rgba(255,255,255,.12)', border:'none', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer' }}>{I.x}</button>
        </div>
        <div style={{ padding:'1.5rem' }}>
          <label style={{ display:'block', fontSize:'.73rem', fontWeight:700, color:'#64748b', textTransform:'uppercase', letterSpacing:'.06em', marginBottom:8 }}>{t('userDetail.roleModal.newRole')}</label>
          <select value={sel} onChange={e => setSel(e.target.value)}
            style={{ width:'100%', padding:'11px 13px', border:`2px solid ${changed?newCfg.color:'#E2E8F0'}`, borderRadius:11, fontSize:'.9rem', color:'#0B1E3D', outline:'none', fontFamily:'inherit', transition:'border-color .2s', marginBottom:'1.25rem', cursor:'pointer' }}>
            {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
          </select>
          {changed && (
            <div style={{ background:'#EFF6FF', border:'1px solid #BFDBFE', borderRadius:11, padding:'11px 14px', marginBottom:'1.25rem', display:'flex', alignItems:'center', gap:10 }}>
              <span style={{ background:(ROLE_CFG[user.role]?.bg||'#F1F5F9'), color:(ROLE_CFG[user.role]?.color||'#64748b'), padding:'3px 10px', borderRadius:20, fontSize:'.78rem', fontWeight:700 }}>
                {ROLES.find(r => r.value===user.role)?.label||user.role}
              </span>
              <span style={{ color:'#94A3B8', fontWeight:700 }}>→</span>
              <span style={{ background:newCfg.bg, color:newCfg.color, padding:'3px 10px', borderRadius:20, fontSize:'.78rem', fontWeight:700 }}>
                {ROLES.find(r => r.value===sel)?.label||sel}
              </span>
            </div>
          )}
          <div style={{ background:'#FFFBEB', border:'1px solid #413c28', borderRadius:11, padding:'10px 14px', marginBottom:'1.5rem', fontSize:'.8rem', color:'#92400E' }}>
            {t('userDetail.roleModal.warning')}
          </div>
          <div style={{ display:'flex', gap:9, justifyContent:'flex-end' }}>
            <button onClick={onClose} style={{ padding:'9px 18px', borderRadius:10, border:'1.5px solid #E2E8F0', background:'#fff', color:'#374151', fontWeight:600, fontSize:'.86rem', cursor:'pointer', fontFamily:'inherit' }}>{t('common.cancel')}</button>
            <button onClick={() => onConfirm(sel)} disabled={!changed||saving}
              style={{ padding:'9px 18px', borderRadius:10, border:'none', background:changed?'#0B1E3D':'#E2E8F0', color:changed?'#fff':'#94A3B8', fontWeight:700, fontSize:'.86rem', cursor:changed?'pointer':'not-allowed', fontFamily:'inherit', display:'flex', alignItems:'center', gap:7 }}>
              {saving && <span style={{ width:13, height:13, border:'2px solid rgba(255,255,255,.3)', borderTopColor:'#fff', borderRadius:'50%', display:'inline-block', animation:'spin .7s linear infinite' }}/>}
              {t('userDetail.roleModal.confirm')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminUserDetail() {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();

  const [user,         setUser]         = useState(null);
  const [sites,        setSites]        = useState([]);
  const [plants,       setPlants]       = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [saving,       setSaving]       = useState(false);
  const [savingCertif, setSavingCertif] = useState(false);
  const [edit,         setEdit]         = useState(false);
  const [roleModal,    setRoleModal]    = useState(false);
  const [toast,        setToast]        = useState(null);
  const [showMdp,      setShowMdp]      = useState(false);
  const [form, setForm] = useState({ nom:'', prenom:'', email:'', telephone:'', siteId:'', plantId:'', nouveauMotDePasse:'' });

  useEffect(() => {
    Promise.all([adminAPI.getUser(id), adminAPI.getSites(), adminAPI.getPlants()])
      .then(([uRes, sRes, pRes]) => {
        setUser(uRes.data); setSites(sRes.data); setPlants(pRes.data);
        setForm({ nom:uRes.data.nom||'', prenom:uRes.data.prenom||'', email:uRes.data.email||'', telephone:uRes.data.telephone||'', siteId:uRes.data.siteId||'', plantId:uRes.data.plantId||'', nouveauMotDePasse:'' });
      }).finally(() => setLoading(false));
  }, [id]);

  const toast$ = (msg, type = 'ok') => { setToast({ msg, type }); setTimeout(() => setToast(null), 4000); };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = { ...form, siteId: form.siteId ? parseInt(form.siteId) : null, plantId: form.plantId ? parseInt(form.plantId) : null };
      if (!payload.nouveauMotDePasse) delete payload.nouveauMotDePasse;
      const res = await adminAPI.updateUser(id, payload);
      setUser(res.data); setEdit(false);
      toast$(t('userDetail.toast.profileUpdated'));
    } catch (e) { toast$(e.response?.data?.message || t('common.error'), 'err'); }
    setSaving(false);
  };

  const handleToggle = async () => {
    await adminAPI.toggleActif(id);
    setUser(u => ({ ...u, actif: !u.actif }));
    toast$(user.actif ? t('userDetail.toast.deactivated') : t('userDetail.toast.activated'));
  };

  const handleConfirmRole = async nouveauRole => {
    setSaving(true);
    try {
      const res = await adminAPI.changerRole(id, nouveauRole);
      setUser(res.data); setRoleModal(false);
      toast$(`${t('userDetail.toast.roleChanged')} ${ROLES.find(r => r.value===nouveauRole)?.label}`);
    } catch (e) { toast$(e.response?.data?.message || t('common.error'), 'err'); setRoleModal(false); }
    setSaving(false);
  };

  const handleToggleCertif = async () => {
    setSavingCertif(true);
    try {
      const res = await adminAPI.toggleCertif(id);
      setUser(res.data);
      toast$(res.data.peutCreerCertif ? t('userDetail.toast.certifEnabled') : t('userDetail.toast.certifRevoked'));
    } catch (e) { toast$(e.response?.data?.message || t('common.error'), 'err'); }
    setSavingCertif(false);
  };

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'50vh', gap:10, color:'#94A3B8' }}>
      <span style={{ width:24, height:24, border:'2.5px solid #E2E8F0', borderTopColor:'#0B1E3D', borderRadius:'50%', display:'inline-block', animation:'spin .7s linear infinite' }}/>
      {t('userDetail.loading')}
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
  if (!user) return <div style={{ padding:'2rem', color:'#94A3B8' }}>{t('userDetail.notFound')}</div>;

  const cfg      = ROLE_CFG[user.role] || { color:'#64748b', bg:'#F1F5F9' };
  const initials = `${user.prenom?.[0]||''}${user.nom?.[0]||''}`.toUpperCase();
  const filteredPlants = form.siteId ? plants.filter(p => String(p.siteId) === String(form.siteId)) : plants;

  return (
    <div style={{ fontFamily:"'DM Sans',sans-serif", minHeight:'100%' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@700&family=DM+Sans:wght@400;600;700&display=swap');
        @keyframes up   { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        @keyframes spin { to{transform:rotate(360deg)} }
        @keyframes pulse{ 0%,100%{opacity:1} 50%{opacity:.35} }
      `}</style>

      {/* Breadcrumb */}
      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:'1.25rem', fontSize:'.84rem', animation:'up .3s ease' }}>
        <button onClick={() => navigate('/admin/utilisateurs')}
          style={{ display:'flex', alignItems:'center', gap:5, background:'none', border:'none', color:'#1D4ED8', fontWeight:700, cursor:'pointer', fontSize:'.84rem', fontFamily:'inherit', padding:0 }}>
          {I.arrow} {t('userDetail.breadcrumb')}
        </button>
        <span style={{ color:'#CBD5E1' }}>/</span>
        <span style={{ color:'#64748b' }}>{user.prenom} {user.nom}</span>
      </div>

      {/* Toast */}
      {toast && (
        <div style={{ background:toast.type==='ok'?'#EFF6FF':'#FEF2F2', border:`1px solid ${toast.type==='ok'?'#BFDBFE':'#FECACA'}`, color:toast.type==='ok'?'#1E40AF':'#B91C1C', padding:'10px 16px', borderRadius:11, fontSize:'.82rem', fontWeight:700, display:'flex', alignItems:'center', gap:8, marginBottom:'1.25rem' }}>
          {toast.type==='ok' ? I.check : I.warn} {toast.msg}
        </div>
      )}

      {/* HERO */}
      <div style={{ background:'linear-gradient(135deg,#0B1E3D 0%,#1D4ED8 100%)', borderRadius:16, padding:'1rem 1.5rem', marginBottom:'1.5rem', display:'flex', alignItems:'center', gap:'1.25rem', flexWrap:'wrap', position:'relative', overflow:'hidden', boxShadow:'0 4px 20px rgba(11,30,61,.22)', animation:'up .35s ease' }}>
        <div style={{ position:'absolute', right:-20, top:-20, width:120, height:120, borderRadius:'50%', border:'1px solid rgba(255,255,255,.08)', pointerEvents:'none' }}/>
        <div style={{ position:'absolute', right:40, bottom:-30, width:80, height:80, borderRadius:'50%', border:'1px solid rgba(200,152,42,.15)', pointerEvents:'none' }}/>

        <div style={{ width:52, height:52, borderRadius:'50%', flexShrink:0, zIndex:1, background:cfg.bg, border:`2.5px solid ${cfg.color}80`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.2rem', fontWeight:900, color:cfg.color, fontFamily:"'Rajdhani',sans-serif" }}>
          {initials}
        </div>

        <div style={{ flex:1, minWidth:0, zIndex:1 }}>
          <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:3 }}>
            <span style={{ width:5, height:5, borderRadius:'50%', background:user.actif?'#4ADE80':'#F87171', display:'inline-block', animation:'pulse 2s infinite', flexShrink:0 }}/>
            <span style={{ color:'rgba(255,255,255,.4)', fontSize:'.68rem', fontWeight:700, letterSpacing:'.08em', textTransform:'uppercase' }}>{user.matricule}</span>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:10, flexWrap:'wrap' }}>
            <h1 style={{ margin:0, fontSize:'1.2rem', fontWeight:900, color:'#fff', fontFamily:"'Rajdhani',sans-serif" }}>{user.prenom} {user.nom}</h1>
            <span style={{ background:cfg.bg, color:cfg.color, fontSize:'.72rem', fontWeight:700, padding:'3px 10px', borderRadius:99 }}>{ROLES.find(r => r.value===user.role)?.label||user.role}</span>
            <span style={{ background:user.actif?'rgba(74,222,128,.15)':'rgba(248,113,113,.15)', color:user.actif?'#4ADE80':'#F87171', fontSize:'.72rem', fontWeight:700, padding:'3px 10px', borderRadius:99 }}>
              {!user.inscrit ? t('users.status.notRegistered') : user.actif ? t('users.status.active') : t('users.status.inactive')}
            </span>
            {user.siteNom && (
              <span style={{ display:'flex', alignItems:'center', gap:4, background:'rgba(255,255,255,.1)', color:'rgba(255,255,255,.55)', fontSize:'.72rem', fontWeight:600, padding:'3px 10px', borderRadius:99 }}>
                {I.pin} {user.siteNom}
              </span>
            )}
            {user.role === 'EXPERT_PRODUCT_AUDIT' && user.peutCreerCertif && (
              <span style={{ display:'flex', alignItems:'center', gap:4, background:'rgba(200,152,42,.2)', color:'#C8982A', fontSize:'.72rem', fontWeight:700, padding:'3px 10px', borderRadius:99 }}>
                {I.shield} {t('userDetail.fields.qualification')}
              </span>
            )}
          </div>
        </div>

        <div style={{ display:'flex', gap:8, flexShrink:0, zIndex:1 }}>
          <button onClick={handleToggle} disabled={!user.inscrit}
            style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 16px', borderRadius:9, fontWeight:700, fontSize:'.8rem', cursor:!user.inscrit?'not-allowed':'pointer', opacity:!user.inscrit?.45:1, border:'none', whiteSpace:'nowrap', fontFamily:'inherit', background:user.actif?'rgba(248,113,113,.18)':'rgba(74,222,128,.18)', color:user.actif?'#F87171':'#4ADE80' }}>
            {user.actif
              ? <><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg> {t('userDetail.hero.deactivate')}</>
              : <><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polygon points="5 3 19 12 5 21 5 3"/></svg> {t('userDetail.hero.activate')}</>
            }
          </button>
          <button onClick={() => setRoleModal(true)}
            style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 16px', borderRadius:9, fontWeight:700, fontSize:'.8rem', cursor:'pointer', fontFamily:'inherit', border:'.5px solid rgba(255,255,255,.2)', background:'rgba(255,255,255,.1)', color:'#fff', whiteSpace:'nowrap' }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
            {t('userDetail.hero.changeRole')}
          </button>
        </div>
      </div>

      {/* BODY 2 COLONNES */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 340px', gap:'1.25rem', alignItems:'start', animation:'up .35s .1s ease both' }}>

        {/* Colonne gauche */}
        <div>
          <Card title={t('userDetail.cards.personalInfo')} icon={I.user}
            action={!edit && (
              <button onClick={() => setEdit(true)} style={{ display:'flex', alignItems:'center', gap:5, background:'rgba(0,40,85,.1)', border:'none', borderRadius:8, padding:'5px 12px', fontSize:'.78rem', fontWeight:700, color:'#0B1E3D', cursor:'pointer', fontFamily:'inherit' }}>
                {I.edit} {t('userDetail.actions.edit')}
              </button>
            )}>
            {edit ? (
              <div style={{ paddingTop:'.75rem' }}>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem', marginBottom:'1rem' }}>
                  {[
                    { k:'prenom', l:'Prénom' },
                    { k:'nom',    l:'Nom' },
                    { k:'email',  l:t('userDetail.fields.email'), full:true },
                    { k:'telephone', l:t('userDetail.fields.phone') },
                  ].map(f => (
                    <div key={f.k} style={{ gridColumn:f.full?'1/-1':'auto' }}>
                      <label style={{ display:'block', fontSize:'.73rem', fontWeight:700, color:'#64748b', textTransform:'uppercase', letterSpacing:'.06em', marginBottom:6 }}>{f.l}</label>
                      <input value={form[f.k]} onChange={e => setForm(p => ({ ...p, [f.k]: e.target.value }))}
                        style={{ width:'100%', padding:'10px 13px', border:'1.5px solid #E2E8F0', borderRadius:10, fontSize:'.87rem', fontWeight:600, color:'#0B1E3D', outline:'none', fontFamily:'inherit', boxSizing:'border-box' }}
                        onFocus={e => { e.target.style.borderColor='#0B1E3D'; e.target.style.boxShadow='0 0 0 3px rgba(11,30,61,.07)'; }}
                        onBlur={e =>  { e.target.style.borderColor='#E2E8F0'; e.target.style.boxShadow='none'; }}/>
                    </div>
                  ))}
                  <div>
                    <label style={{ display:'block', fontSize:'.73rem', fontWeight:700, color:'#64748b', textTransform:'uppercase', letterSpacing:'.06em', marginBottom:6 }}>{t('userDetail.fields.site')}</label>
                    <select value={form.siteId} onChange={e => setForm(p => ({ ...p, siteId: e.target.value }))}
                      style={{ width:'100%', padding:'10px 13px', border:'1.5px solid #E2E8F0', borderRadius:10, fontSize:'.87rem', fontWeight:600, color:'#0B1E3D', outline:'none', fontFamily:'inherit', cursor:'pointer' }}>
                      <option value="">{t('common.none')}</option>
                      {sites.map(s => <option key={s.id} value={s.id}>{s.nom} · {s.localisation}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ display:'block', fontSize:'.73rem', fontWeight:700, color:'#64748b', textTransform:'uppercase', letterSpacing:'.06em', marginBottom:6 }}>{t('userDetail.fields.plant')}</label>
                    <select value={form.plantId} onChange={e => setForm(p => ({ ...p, plantId: e.target.value }))}
                      style={{ width:'100%', padding:'10px 13px', border:'1.5px solid #E2E8F0', borderRadius:10, fontSize:'.87rem', fontWeight:600, color:'#0B1E3D', outline:'none', fontFamily:'inherit', cursor:'pointer' }}>
                      <option value="">{t('common.none')}</option>
                      {filteredPlants.map(p => <option key={p.id} value={p.id}>{p.nom}{p.clientNom ? ` · ${p.clientNom}` : ''}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ display:'block', fontSize:'.73rem', fontWeight:700, color:'#64748b', textTransform:'uppercase', letterSpacing:'.06em', marginBottom:6 }}>
                      {t('userDetail.fields.password')} <span style={{ textTransform:'none', fontWeight:400, color:'#94A3B8' }}>{t('common.optional')}</span>
                    </label>
                    <div style={{ position:'relative' }}>
                      <input type={showMdp?'text':'password'} value={form.nouveauMotDePasse}
                        onChange={e => setForm(p => ({ ...p, nouveauMotDePasse: e.target.value }))}
                        placeholder={t('userDetail.fields.passwordHint')}
                        style={{ width:'100%', padding:'10px 38px 10px 13px', border:'1.5px solid #E2E8F0', borderRadius:10, fontSize:'.87rem', fontWeight:600, color:'#0B1E3D', outline:'none', fontFamily:'inherit', boxSizing:'border-box' }}
                        onFocus={e => { e.target.style.borderColor='#0B1E3D'; e.target.style.boxShadow='0 0 0 3px rgba(11,30,61,.07)'; }}
                        onBlur={e =>  { e.target.style.borderColor='#E2E8F0'; e.target.style.boxShadow='none'; }}/>
                      <button type="button" onClick={() => setShowMdp(p => !p)} style={{ position:'absolute', right:10, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'#94A3B8', display:'flex' }}>
                        {showMdp ? I.eyeoff : I.eye}
                      </button>
                    </div>
                  </div>
                </div>
                <div style={{ display:'flex', gap:9 }}>
                  <button onClick={handleSave} disabled={saving}
                    style={{ display:'flex', alignItems:'center', gap:6, background:'#0B1E3D', color:'#fff', border:'none', borderRadius:10, padding:'9px 20px', fontWeight:700, fontSize:'.85rem', cursor:saving?'not-allowed':'pointer', opacity:saving?.7:1, fontFamily:'inherit' }}>
                    {saving ? t('userDetail.actions.saving') : <>{I.check} {t('userDetail.actions.save')}</>}
                  </button>
                  <button onClick={() => setEdit(false)} style={{ display:'flex', alignItems:'center', gap:6, background:'#F8FAFC', color:'#374151', border:'1.5px solid #E2E8F0', borderRadius:10, padding:'9px 18px', fontWeight:600, fontSize:'.85rem', cursor:'pointer', fontFamily:'inherit' }}>
                    {I.x} {t('userDetail.actions.cancel')}
                  </button>
                </div>
              </div>
            ) : (
              <>
                <InfoRow icon={I.user}  label={t('userDetail.fields.fullName')}  value={`${user.prenom||''} ${user.nom||''}`.trim()||null}/>
                <InfoRow icon={I.id}    label={t('userDetail.fields.matricule')} value={user.matricule}/>
                <InfoRow icon={I.mail}  label={t('userDetail.fields.email')}     value={user.email}/>
                <InfoRow icon={I.phone} label={t('userDetail.fields.phone')}     value={user.telephone} last/>
              </>
            )}
          </Card>

          {/* Bloc qualification — uniquement pour les experts */}
          {user.role === 'EXPERT_PRODUCT_AUDIT' && (
            <div style={{ background:'#fff', borderRadius:15, border:`0.3px solid ${user.peutCreerCertif?'#b9b5a2':'#E2E8F0'}`, overflow:'hidden', boxShadow:'0 2px 10px rgba(0,0,0,.05)', marginBottom:'1.25rem' }}>
              <div style={{ background:user.peutCreerCertif?'#dad6cf':'#CBD5E1', borderRadius:12, margin:'10px 10px 0', padding:'10px 16px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <div style={{ width:26, height:26, borderRadius:7, background:user.peutCreerCertif?'rgba(146,64,14,.12)':'rgba(0,40,85,.1)', color:user.peutCreerCertif?'#92400E':'#0B1E3D', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>{I.shield}</div>
                  <span style={{ fontSize:'.82rem', fontWeight:800, color:user.peutCreerCertif?'#92400E':'#0B1E3D' }}>{t('userDetail.certif.title')}</span>
                </div>
                <span style={{ background:user.peutCreerCertif?'#ECFDF5':'#F1F5F9', color:user.peutCreerCertif?'#065F46':'#94A3B8', fontSize:'.7rem', fontWeight:700, padding:'3px 10px', borderRadius:99 }}>
                  {user.peutCreerCertif ? t('userDetail.status.authorized') : t('userDetail.status.notAuthorized')}
                </span>
              </div>
              <div style={{ padding:'14px 16px' }}>
                <p style={{ margin:'0 0 16px', fontSize:'.84rem', fontWeight:700, color:'#0B1E3D' }}>
                  {user.peutCreerCertif ? t('userDetail.certif.authorized') : t('userDetail.certif.notAuthorized')}
                </p>
                <div style={{ display:'flex', gap:10 }}>
                  {!user.peutCreerCertif ? (
                    <button onClick={handleToggleCertif} disabled={savingCertif}
                      style={{ width:'220px', display:'flex', alignItems:'center', justifyContent:'center', gap:7, padding:'10px 0', borderRadius:12, border:'none', background:'linear-gradient(135deg,#22C55E,#16A34A)', color:'#fff', fontWeight:700, fontSize:'.84rem', cursor:savingCertif?'not-allowed':'pointer', opacity:savingCertif?.7:1, fontFamily:'inherit', boxShadow:'0 4px 14px rgba(34,197,94,.35)', transition:'all .2s' }}>
                      {savingCertif
                        ? <><span style={{ width:12, height:12, border:'2px solid rgba(255,255,255,.3)', borderTopColor:'#fff', borderRadius:'50%', display:'inline-block', animation:'spin .7s linear infinite' }}/> {t('userDetail.certif.inProgress')}</>
                        : <>{I.check} {t('userDetail.certif.authorize')}</>}
                    </button>
                  ) : (
                    <button onClick={handleToggleCertif} disabled={savingCertif}
                      style={{ width:'220px', display:'flex', alignItems:'center', justifyContent:'center', gap:7, padding:'10px 0', borderRadius:12, border:'none', background:'#fdbebe', color:'#B91C1C', fontWeight:700, fontSize:'.84rem', cursor:savingCertif?'not-allowed':'pointer', opacity:savingCertif?.7:1, fontFamily:'inherit', boxShadow:'0 4px 14px rgba(185,28,28,.12)', transition:'all .2s' }}>
                      {savingCertif
                        ? <><span style={{ width:12, height:12, border:'2px solid #B91C1C33', borderTopColor:'#B91C1C', borderRadius:'50%', display:'inline-block', animation:'spin .7s linear infinite' }}/> {t('userDetail.certif.inProgress')}</>
                        : <>{I.x} {t('userDetail.certif.revoke')}</>}
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Colonne droite */}
        <div>
          <Card title={t('userDetail.cards.accountInfo')} icon={I.id}>
            <InfoRow icon={I.id}  label={t('userDetail.fields.role')} value={ROLES.find(r => r.value===user.role)?.label||user.role}
              badge={<span style={{ background:cfg.bg, color:cfg.color, fontSize:'.7rem', fontWeight:700, padding:'4px 10px', borderRadius:99 }}>{ROLES.find(r => r.value===user.role)?.label?.split(' ')[0]}</span>}/>
            <InfoRow icon={I.pin} label={t('userDetail.fields.site')}  value={user.siteNom||null}/>
            {user.plantNom && <InfoRow icon={I.pin} label={t('userDetail.fields.plant')} value={user.plantNom}/>}
            <InfoRow icon={I.key} label={t('userDetail.fields.registration')} value={null}
              badge={user.inscrit
                ? <span style={{ background:'#F0FDF4', color:'#16A34A', fontSize:'.7rem', fontWeight:700, padding:'4px 10px', borderRadius:99 }}>{t('userDetail.status.registered')}</span>
                : <span style={{ background:'#F8FAFC', color:'#94A3B8', fontSize:'.7rem', fontWeight:700, padding:'4px 10px', borderRadius:99 }}>{t('userDetail.status.notRegistered')}</span>
              }/>
            {user.role === 'EXPERT_PRODUCT_AUDIT' && (
              <InfoRow icon={I.shield} label={t('userDetail.fields.qualification')} value={null} last
                badge={user.peutCreerCertif
                  ? <span style={{ background:'#FEF3C7', color:'#92400E', fontSize:'.7rem', fontWeight:700, padding:'4px 10px', borderRadius:99 }}>{t('userDetail.status.authorized')}</span>
                  : <span style={{ background:'#F8FAFC', color:'#94A3B8', fontSize:'.7rem', fontWeight:700, padding:'4px 10px', borderRadius:99 }}>{t('userDetail.status.notAuthorized')}</span>
                }/>
            )}
          </Card>
        </div>
      </div>

      {roleModal && <RoleModal user={user} saving={saving} onClose={() => setRoleModal(false)} onConfirm={handleConfirmRole}/>}
    </div>
  );
}