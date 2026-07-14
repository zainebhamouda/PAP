
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { adminAPI } from '../../services/api';

/* ── getRoleInfo : fonction pure qui prend t() en param ── */
/* ── getRoleInfo : fonction pure qui prend t() en param ── */
const getRoleInfo = (t, role) => {
  const key = normalizeRole(role);

  if (!key) {
    return {
      label: role,
      color: '#374151',
      bg: '#b3bac8',
    };
  }

  return {
    label: t(`roles.${key}.short`),
    plural: t(`roles.${key}.plural`),
  };
};
const normalizeRole = (role) => {
  if (!role) return null;

  const r = role.toLowerCase();

  if (r.includes("auditeur")) return "auditeur";
  if (r.includes("chef")) return "chef";
  if (r.includes("admin")) return "admin";
  if (r.includes("expert")) return "expert";
  if (r.includes("qualite")) return "respQualite";
  if (r.includes("magasin")) return "magasin";

  return null;
};

/* ── Constantes visuelles ── */
const IC = {
  plus:   <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  close:  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  user:   <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  search: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  eye:    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>,
  trash:  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>,
  toggle: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="5" width="22" height="14" rx="7"/><circle cx="8" cy="12" r="3" fill="currentColor"/></svg>,
  chevL:  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>,
  chevR:  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>,
  chevLL: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="11 18 5 12 11 6"/><polyline points="18 18 12 12 18 6"/></svg>,
  chevRR: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="13 18 19 12 13 6"/><polyline points="6 18 12 12 6 6"/></svg>,
};

const AVATAR_COLORS = {
  ADMIN:                        { bg: '#0B1E3D', text: '#FCD34D' },
  AUDITEUR:                     { bg: '#0B2347', text: '#93C5FD' },
  CHEF_SERVICE:                 { bg: '#1E3A5F', text: '#6EE7B7' },
  RESPONSABLE_QUALITE_CENTRALE: { bg: '#2D1B69', text: '#C4B5FD' },
  EXPERT_PRODUCT_AUDIT:         { bg: '#7C1D1D', text: '#FCA5A5' },
  MAGASIN:                      { bg: '#134E4A', text: '#99F6E4' },
};

function Avatar({ user }) {
  const col = AVATAR_COLORS[user.role] || { bg: '#334155', text: '#CBD5E1' };
  if (!user.inscrit) {
    return (
      <div style={{ width:38, height:38, borderRadius:12, flexShrink:0, border:'2px dashed #CBD5E1', background:'#F8FAFC', display:'flex', alignItems:'center', justifyContent:'center', color:'#CBD5E1', fontSize:'.9rem' }}>?</div>
    );
  }
  return (
    <div style={{ width:38, height:38, borderRadius:12, flexShrink:0, background:col.bg, color:col.text, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'.78rem', fontWeight:800, letterSpacing:'.04em', boxShadow:`0 2px 8px ${col.bg}55` }}>
      {(user.prenom?.[0]||'').toUpperCase()}{(user.nom?.[0]||'').toUpperCase()}
    </div>
  );
}

/* ══════════════════════════════════════════════
   PAGINATION
══════════════════════════════════════════════ */
function Pagination({ currentPage, totalPages, perPage, totalItems, onPageChange, onPerPageChange }) {
  if (totalItems === 0) return null;
  const from = (currentPage - 1) * perPage + 1;
  const to   = Math.min(currentPage * perPage, totalItems);

  const getPages = () => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const pages = [];
    pages.push(1);
    if (currentPage > 3) pages.push('...');
    for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) pages.push(i);
    if (currentPage < totalPages - 2) pages.push('...');
    pages.push(totalPages);
    return pages;
  };

  const btnStyle = (active, disabled) => ({
    minWidth:32, height:32, borderRadius:8,
    border: active ? 'none' : '1.5px solid #E2E8F0',
    background: active ? 'linear-gradient(135deg,#0B1E3D,#1E3A5F)' : '#fff',
    color: active ? '#fff' : disabled ? '#CBD5E1' : '#475569',
    fontSize:'.78rem', fontWeight:700, cursor: disabled ? 'not-allowed' : 'pointer',
    display:'flex', alignItems:'center', justifyContent:'center',
    padding:'0 6px', fontFamily:'inherit', opacity: disabled ? .4 : 1,
    transition:'all .12s', boxShadow: active ? '0 4px 12px rgba(11,30,61,.3)' : 'none',
  });

  return (
    <div style={{ padding:'10px 16px', borderTop:'1px solid #EEF2F8', background:'#F7F9FC', display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:8 }}>
      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
        <span style={{ fontSize:'.73rem', color:'#94A3B8', fontWeight:600 }}>
          {from}–{to} / {totalItems}
        </span>
        <select value={perPage} onChange={e => onPerPageChange(Number(e.target.value))}
          style={{ padding:'4px 8px', borderRadius:8, border:'1.5px solid #E2E8F0', fontSize:'.73rem', fontWeight:700, color:'#475569', background:'#fff', cursor:'pointer', fontFamily:'inherit', outline:'none' }}>
          {[10, 15, 25, 50].map(n => <option key={n} value={n}>{n} / page</option>)}
        </select>
      </div>
      <div style={{ display:'flex', alignItems:'center', gap:4 }}>
        <button style={btnStyle(false, currentPage===1)} disabled={currentPage===1} onClick={() => onPageChange(1)}>{IC.chevLL}</button>
        <button style={btnStyle(false, currentPage===1)} disabled={currentPage===1} onClick={() => onPageChange(currentPage-1)}>{IC.chevL}</button>
        {getPages().map((p, idx) =>
          p === '...'
            ? <span key={`sep-${idx}`} style={{ color:'#CBD5E1', fontSize:'.8rem', padding:'0 2px' }}>…</span>
            : <button key={p} style={btnStyle(p===currentPage, false)} onClick={() => onPageChange(p)}>{p}</button>
        )}
        <button style={btnStyle(false, currentPage===totalPages)} disabled={currentPage===totalPages} onClick={() => onPageChange(currentPage+1)}>{IC.chevR}</button>
        <button style={btnStyle(false, currentPage===totalPages)} disabled={currentPage===totalPages} onClick={() => onPageChange(totalPages)}>{IC.chevRR}</button>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════
   MODAL CRÉER UTILISATEUR
══════════════════════════════════════════════ */
function ModalCreerUser({ onClose, onSave }) {
  const { t } = useTranslation();
  const [form, setForm]     = useState({ matricule: '', email: '', role: 'AUDITEUR' });
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState('');

  /* ── ROLES défini DANS le composant via useMemo ── */
  const ROLES = useMemo(() => [
    { value: 'AUDITEUR',                     label: t('roles.auditeur.short') },
    { value: 'CHEF_SERVICE',                 label: t('roles.chef.short') },
    { value: 'RESPONSABLE_QUALITE_CENTRALE', label: t('roles.respQualite.short') },
    { value: 'EXPERT_PRODUCT_AUDIT',         label: t('roles.expert.short') },
    { value: 'ADMIN',                        label: t('roles.admin.short') },
    { value: 'MAGASIN',                      label: t('roles.magasin.short') },
  ], [t]);

  const save = async () => {
    if (!form.matricule.trim()) { setError(t('users.modal.errors.matriculeRequired')); return; }
    if (!form.email.trim())     { setError(t('users.modal.errors.emailRequired')); return; }
    if (!form.email.includes('@') || !form.email.includes('.')) { setError(t('users.modal.errors.emailInvalid')); return; }
    setSaving(true); setError('');
    try {
      await adminAPI.createUser(form);
      onSave();
    } catch (e) {
      const data = e.response?.data;
      const msg  = data?.message ?? data?.error ?? (typeof data === 'string' ? data : null) ?? t('users.modal.errors.createError');
      setError(String(msg));
    } finally { setSaving(false); }
  };

  const ri = getRoleInfo(t, form.role);

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(11,30,61,.6)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, backdropFilter:'blur(6px)' }}>
      <div style={{ background:'#fff', borderRadius:22, width:'100%', maxWidth:460, overflow:'hidden', boxShadow:'0 32px 80px rgba(0,0,0,.28)', animation:'popIn .22s cubic-bezier(.34,1.4,.64,1)' }}>
        <div style={{ background:'linear-gradient(135deg,#0B1E3D,#1E3A5F)', padding:'1.5rem 1.75rem', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <div style={{ width:40, height:40, borderRadius:12, background:'rgba(255,255,255,.12)', color:'#93C5FD', display:'flex', alignItems:'center', justifyContent:'center' }}>{IC.user}</div>
            <div>
              <p style={{ margin:0, fontSize:'.95rem', fontWeight:800, color:'#fff' }}>{t('users.modal.title')}</p>
              <p style={{ margin:0, fontSize:'.73rem', color:'rgba(255,255,255,.5)' }}>{t('users.modal.subtitle')}</p>
            </div>
          </div>
          <button onClick={onClose} style={{ background:'rgba(255,255,255,.1)', border:'none', borderRadius:9, width:34, height:34, display:'flex', alignItems:'center', justifyContent:'center', color:'rgba(255,255,255,.7)', cursor:'pointer' }}>{IC.close}</button>
        </div>

        <div style={{ padding:'1.75rem' }}>
          <div style={{ background:'#EFF6FF', border:'1px solid #BFDBFE', borderRadius:11, padding:'11px 14px', marginBottom:'1.25rem', fontSize:'.8rem', color:'#1E40AF', lineHeight:1.6 }}>
            {t('users.modal.inviteInfo')}
          </div>

          {error && (
            <div style={{ display:'flex', alignItems:'flex-start', gap:9, background:'#FEF2F2', border:'1.5px solid #FECACA', borderRadius:11, padding:'11px 14px', marginBottom:'1.1rem' }}>
              <span style={{ fontSize:'1rem', flexShrink:0 }}>⚠️</span>
              <div>
                <p style={{ margin:0, fontSize:'.82rem', fontWeight:700, color:'#B91C1C' }}>{t('users.modal.errors.cannotCreate')}</p>
                <p style={{ margin:'3px 0 0', fontSize:'.79rem', color:'#DC2626', lineHeight:1.5 }}>{error}</p>
              </div>
            </div>
          )}

          <div style={{ marginBottom:'1.1rem' }}>
            <label style={{ display:'block', fontSize:'.72rem', fontWeight:700, color:'#374151', marginBottom:6, textTransform:'uppercase', letterSpacing:'.08em' }}>
              {t('users.modal.fields.matricule')} <span style={{ color:'#EF4444' }}>*</span>
            </label>
            <input type="text" value={form.matricule} placeholder={t('users.modal.fields.matriculePlaceholder')}
              onChange={e => { setError(''); setForm(p => ({ ...p, matricule: e.target.value })); }}
              style={{ width:'100%', padding:'10px 14px', borderRadius:10, border:'1.5px solid #E2E8F0', fontSize:'.88rem', outline:'none', boxSizing:'border-box', fontFamily:'inherit' }}
              onFocus={e => { e.target.style.borderColor='#0B1E3D'; e.target.style.boxShadow='0 0 0 3px rgba(11,30,61,.08)'; }}
              onBlur={e =>  { e.target.style.borderColor='#E2E8F0'; e.target.style.boxShadow='none'; }}
            />
          </div>

          <div style={{ marginBottom:'1.1rem' }}>
            <label style={{ display:'block', fontSize:'.72rem', fontWeight:700, color:'#374151', marginBottom:6, textTransform:'uppercase', letterSpacing:'.08em' }}>
              {t('users.modal.fields.email')} <span style={{ color:'#EF4444' }}>*</span>
            </label>
            <input type="email" value={form.email} placeholder={t('users.modal.fields.emailPlaceholder')}
              onChange={e => { setError(''); setForm(p => ({ ...p, email: e.target.value })); }}
              style={{ width:'100%', padding:'10px 14px', borderRadius:10, border:'1.5px solid #E2E8F0', fontSize:'.88rem', outline:'none', boxSizing:'border-box', fontFamily:'inherit' }}
              onFocus={e => { e.target.style.borderColor='#0B1E3D'; e.target.style.boxShadow='0 0 0 3px rgba(11,30,61,.08)'; }}
              onBlur={e =>  { e.target.style.borderColor='#E2E8F0'; e.target.style.boxShadow='none'; }}
            />
            <p style={{ margin:'5px 0 0', fontSize:'.72rem', color:'#94A3B8' }}>{t('users.modal.fields.emailHint')}</p>
          </div>

          <div style={{ marginBottom:'1.4rem' }}>
            <label style={{ display:'block', fontSize:'.72rem', fontWeight:700, color:'#374151', marginBottom:6, textTransform:'uppercase', letterSpacing:'.08em' }}>
              {t('users.modal.fields.role')} <span style={{ color:'#EF4444' }}>*</span>
            </label>
            <select value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value }))}
              style={{ width:'100%', padding:'10px 14px', borderRadius:10, border:'1.5px solid #E2E8F0', fontSize:'.88rem', outline:'none', background:'#fff', boxSizing:'border-box', cursor:'pointer', fontFamily:'inherit' }}
              onFocus={e => e.target.style.borderColor='#0B1E3D'}
              onBlur={e =>  e.target.style.borderColor='#E2E8F0'}>
              {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
            <div style={{ marginTop:8 }}>
              <span style={{ background:ri.bg, color:ri.color, fontSize:'.72rem', fontWeight:700, padding:'3px 12px', borderRadius:99 }}>{ri.label}</span>
            </div>
          </div>

          <div style={{ display:'flex', gap:9, justifyContent:'flex-end' }}>
            <button onClick={onClose} style={{ padding:'10px 20px', borderRadius:10, border:'1.5px solid #E2E8F0', background:'#F8FAFC', color:'#374151', fontWeight:600, fontSize:'.85rem', cursor:'pointer', fontFamily:'inherit' }}>
              {t('common.cancel')}
            </button>
            <button onClick={save} disabled={saving}
              style={{ padding:'10px 22px', borderRadius:10, border:'none', background:'linear-gradient(135deg,#0B1E3D,#1E3A5F)', color:'#fff', fontWeight:700, fontSize:'.85rem', cursor:saving?'not-allowed':'pointer', opacity:saving?0.7:1, display:'flex', alignItems:'center', gap:8, fontFamily:'inherit', boxShadow:'0 4px 14px rgba(11,30,61,.3)' }}>
              {saving && <span style={{ width:12, height:12, border:'2px solid rgba(255,255,255,.3)', borderTopColor:'#fff', borderRadius:'50%', display:'inline-block', animation:'spin .7s linear infinite' }}/>}
              {saving ? t('users.modal.sending') : t('users.modal.createButton')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════
   PAGE PRINCIPALE
══════════════════════════════════════════════ */
export default function AdminUtilisateurs() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  const [users,       setUsers]       = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [search,      setSearch]      = useState('');
  const [filter,      setFilter]      = useState(location.state?.filter || 'TOUS');
  const [modalCreer,  setModalCreer]  = useState(false);
  const [toast,       setToast]       = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage,     setPerPage]     = useState(15);

  /* ── FILTERS & ROLES définis dans le composant ── */
  const FILTERS = useMemo(() => [
    { key: 'TOUS',        label: t('users.filters.all') },
    { key: 'ACTIF',       label: t('users.filters.active') },
    { key: 'INACTIF',     label: t('users.filters.inactive') },
    { key: 'NON_INSCRIT', label: t('users.filters.notRegistered') },
  ], [t]);

  useEffect(() => { if (location.state?.filter) setFilter(location.state.filter); }, [location.state?.filter]);
  useEffect(() => { setCurrentPage(1); }, [filter, search]);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = search.trim() ? await adminAPI.searchUsers(search) : await adminAPI.getUsers();
      setUsers(res.data);
    } finally { setLoading(false); }
  }, [search]);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  const toast$ = (msg, ok = true) => { setToast({ msg, ok }); setTimeout(() => setToast(null), 3200); };

  const handleToggle = async (id, e) => {
    e.stopPropagation();
    await adminAPI.toggleActif(id);
    loadUsers();
  };

  const handleDelete = async (id, nom, e) => {
    e.stopPropagation();
    if (!window.confirm(t('users.actions.confirmDelete', { name: nom }))) return;
    await adminAPI.deleteUser(id);
    loadUsers();
  };

  const filtered = users.filter(u => {
    if (filter === 'ACTIF')       return u.actif && u.inscrit;
    if (filter === 'INACTIF')     return !u.actif && u.inscrit;
    if (filter === 'NON_INSCRIT') return !u.inscrit;
    return true;
  });

  const counts = {
    TOUS:        users.length,
    ACTIF:       users.filter(u => u.actif && u.inscrit).length,
    INACTIF:     users.filter(u => !u.actif && u.inscrit).length,
    NON_INSCRIT: users.filter(u => !u.inscrit).length,
  };

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paginated  = filtered.slice((currentPage - 1) * perPage, currentPage * perPage);

  return (
    <div style={{ fontFamily:"'DM Sans',system-ui,sans-serif", display:'flex', flexDirection:'column', gap:'1.25rem' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
        @keyframes spin    { to{ transform:rotate(360deg) } }
        @keyframes fadeUp  { from{opacity:0;transform:translateY(5px)} to{opacity:1;transform:none} }
        @keyframes slideIn { from{opacity:0;transform:translateX(14px)} to{opacity:1;transform:none} }
        @keyframes popIn   { from{opacity:0;transform:scale(.93)} to{opacity:1;transform:scale(1)} }
        .u-row { transition: background .1s, box-shadow .1s; }
        .u-row:hover { background: #EBF4FF !important; }
        .u-row:hover .u-actions { opacity:1 !important; }
        .act-pill { display:inline-flex; align-items:center; gap:5px; padding:6px 13px; border-radius:8px; border:none; font-size:.73rem; font-weight:700; cursor:pointer; transition:filter .12s,transform .1s; font-family:inherit; }
        .act-pill:hover { filter:brightness(.92); transform:translateY(-1px); }
        .act-pill:active { transform:translateY(0); }
        .act-pill:disabled { opacity:.35; cursor:not-allowed; transform:none; }
        .filter-chip { display:inline-flex; align-items:center; gap:6px; padding:7px 14px; border-radius:9px; border:1.5px solid transparent; font-size:.8rem; font-weight:600; cursor:pointer; transition:all .14s; font-family:inherit; }
        .filter-chip:hover { border-color:#93C5FD; }
        .search-wrap input:focus { border-color:#0B1E3D !important; box-shadow:0 0 0 3px rgba(11,30,61,.08) !important; }
      `}</style>

      {toast && (
        <div style={{ position:'fixed', top:20, right:22, zIndex:3000, background:toast.ok?'#0B1E3D':'#FEF2F2', color:toast.ok?'#fff':'#B91C1C', padding:'11px 18px', borderRadius:12, fontSize:'.82rem', fontWeight:700, boxShadow:'0 8px 28px rgba(0,0,0,.2)', animation:'slideIn .22s ease', display:'flex', alignItems:'center', gap:8 }}>
          {toast.ok ? '✓' : '⚠'} {toast.msg}
        </div>
      )}

      {/* Toolbar */}
      <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap', background:'#fff', borderRadius:14, border:'1px solid #E8EDF7', padding:'12px 14px', boxShadow:'0 2px 8px rgba(0,0,0,.04)' }}>
        <div className="search-wrap" style={{ position:'relative', flex:1, minWidth:220 }}>
          <span style={{ position:'absolute', left:11, top:'50%', transform:'translateY(-50%)', color:'#8998ac', pointerEvents:'none' }}>{IC.search}</span>
          <input type="text" placeholder={t('users.search.placeholder')} value={search} onChange={e => setSearch(e.target.value)}
            style={{ width:'100%', padding:'9px 36px 9px 35px', borderRadius:9, border:'1.5px solid #888b90c2', fontSize:'.84rem', outline:'none', boxSizing:'border-box', background:'#F8FAFC', color:'#0B1E3D', fontFamily:'inherit', transition:'border .15s, box-shadow .15s' }}
          />
          {search && (
            <button onClick={() => setSearch('')} style={{ position:'absolute', right:10, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', color:'#94A3B8', cursor:'pointer', lineHeight:1, padding:2 }}>{IC.close}</button>
          )}
        </div>

        <div style={{ width:1, height:28, background:'#E8EDF7', flexShrink:0 }}/>

        {FILTERS.map(f => {
          const active = filter === f.key;
          return (
            <button key={f.key} className="filter-chip" onClick={() => setFilter(f.key)}
              style={{ background:active?'#EFF6FF':'transparent', color:active?'#1D4ED8':'#64748B', borderColor:active?'#082b55':'transparent', fontWeight:active?700:600 }}>
              {f.label}
              <span style={{ background:active?'#1D4ED8':'#E2E8F0', color:active?'#fff':'#94A3B8', fontSize:'.68rem', fontWeight:800, padding:'1px 7px', borderRadius:99, minWidth:20, textAlign:'center' }}>
                {counts[f.key]}
              </span>
            </button>
          );
        })}

        <button onClick={() => setModalCreer(true)}
          style={{ display:'flex', alignItems:'center', gap:8, background:'linear-gradient(135deg,#0B1E3D,#1E3A5F)', color:'#fff', border:'none', borderRadius:11, padding:'10px 20px', fontWeight:700, fontSize:'.84rem', cursor:'pointer', whiteSpace:'nowrap', boxShadow:'0 4px 18px rgba(11,30,61,.3)', fontFamily:'inherit' }}>
          {IC.plus} {t('users.addButton')}
        </button>
      </div>

      {/* Table */}
      <div style={{ background:'#fff', borderRadius:16, border:'1px solid #E8EDF7', overflow:'hidden', boxShadow:'0 2px 16px rgba(0,0,0,.06)' }}>
        {loading ? (
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'4rem', gap:12, color:'#818fa3' }}>
            <span style={{ width:28, height:28, border:'3px solid #E8EDF7', borderTopColor:'#0B1E3D', borderRadius:'50%', display:'inline-block', animation:'spin .8s linear infinite' }}/>
            <span style={{ fontSize:'.84rem', fontWeight:600 }}>{t('common.loading')}</span>
          </div>
        ) : (
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse' }}>
              <thead>
                <tr style={{ background:'#d3dbe9' }}>
                  {[
                    { label: t('users.table.user'),      w:'26%' },
                    { label: t('users.table.matricule'), w:'7%'  },
                    { label: t('users.table.role'),      w:'15%' },
                    { label: t('users.table.site'),      w:'13%' },
                    { label: t('users.table.plant'),     w:'17%' },
                    { label: t('users.table.status'),    w:'10%' },
                    { label: t('users.table.actions'),   w:'12%' },
                  ].map(h => (
                    <th key={h.label} style={{ textAlign:'left', padding:'11px 16px', fontSize:'.68rem', fontWeight:800, color:'#64748B', textTransform:'uppercase', letterSpacing:'.08em', whiteSpace:'nowrap', width:h.w, borderBottom:'2px solid #E8EDF7' }}>{h.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginated.length === 0 ? (
                  <tr><td colSpan={7} style={{ textAlign:'center', padding:'4rem 1rem', color:'#94A3B8', fontSize:'.875rem', fontStyle:'italic' }}>{t('users.table.empty')}</td></tr>
                ) : paginated.map((u, i) => {
                  /* ── getRoleInfo appelé ici avec t ── */
                  const ri    = getRoleInfo(t, u.role);
                  const rowBg = i % 2 === 0 ? '#FFFFFF' : '#dae1eb';
                  return (
                    <tr key={u.id} className="u-row" onClick={() => navigate(`/admin/utilisateurs/${u.id}`)}
                      style={{ background:rowBg, cursor:'pointer', borderBottom:'1px solid #EEF2F8', animation:`fadeUp .18s ease ${i*.025}s both` }}>
                      <td style={{ padding:'13px 16px' }}>
                        <div style={{ display:'flex', alignItems:'center', gap:11 }}>
                          <Avatar user={u} />
                          <div style={{ minWidth:0 }}>
                            <p style={{ margin:0, fontSize:'.84rem', fontWeight:700, color:u.inscrit?'#0B1E3D':'#8da1bc', fontStyle:u.inscrit?'normal':'italic', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
                              {u.inscrit ? `${u.prenom} ${u.nom}` : t('users.status.pending')}
                            </p>
                            <p style={{ margin:'2px 0 0', fontSize:'.72rem', color:'#677a96', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{u.email || '—'}</p>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding:'13px 16px' }}>
                        <code style={{ background:'#F1F5F9', color:'#1E293B', padding:'4px 10px', borderRadius:7, fontSize:'.78rem', fontWeight:700, letterSpacing:'.04em', border:'1px solid #E2E8F0' }}>{u.matricule}</code>
                      </td>
                      <td style={{ padding:'13px 16px' }}>
                        <span style={{ background:ri.bg, color:ri.color, fontSize:'.72rem', fontWeight:700, padding:'4px 11px', borderRadius:8, whiteSpace:'nowrap' }}>{ri.label}</span>
                      </td>
                      <td style={{ padding:'13px 16px' }}>
                        {u.siteNom ? <span style={{ fontSize:'.81rem', color:'#334155', fontWeight:600 }}>{u.siteNom}</span> : <span style={{ color:'#CBD5E1', fontSize:'.81rem' }}>—</span>}
                      </td>
                      <td style={{ padding:'13px 16px' }}>
                        {u.plantNom ? <span style={{ fontSize:'.81rem', color:'#334155', fontWeight:600 }}>{u.plantNom}</span> : <span style={{ color:'#CBD5E1', fontSize:'.81rem' }}>—</span>}
                      </td>
                      <td style={{ padding:'13px 12px' }}>
                        {!u.inscrit ? (
                          <span style={{ background:'#F8FAFC', color:'#94A3B8', fontSize:'.7rem', fontWeight:700, padding:'4px 10px', borderRadius:8, border:'1px solid #E8EDF7', whiteSpace:'nowrap' }}>{t('users.status.notRegistered')}</span>
                        ) : u.actif ? (
                          <span style={{ display:'inline-flex', alignItems:'center', gap:5, background:'#F0FDF4', color:'#15803D', fontSize:'.7rem', fontWeight:700, padding:'4px 10px', borderRadius:8, whiteSpace:'nowrap' }}>
                            <span style={{ width:6, height:6, borderRadius:'50%', background:'#22C55E', boxShadow:'0 0 0 2px #DCFCE7' }}/>{t('users.status.active')}
                          </span>
                        ) : (
                          <span style={{ display:'inline-flex', alignItems:'center', gap:5, background:'#FEF2F2', color:'#B91C1C', fontSize:'.7rem', fontWeight:700, padding:'4px 10px', borderRadius:8, whiteSpace:'nowrap' }}>
                            <span style={{ width:6, height:6, borderRadius:'50%', background:'#EF4444' }}/>{t('users.status.inactive')}
                          </span>
                        )}
                      </td>
                      <td style={{ padding:'13px 16px' }}>
                        <div className="u-actions" onClick={e => e.stopPropagation()} style={{ display:'flex', gap:5, opacity:.7, transition:'opacity .15s' }}>
                          <button className="act-pill" title={t('users.actions.view')} onClick={() => navigate(`/admin/utilisateurs/${u.id}`)} style={{ background:'#7cc6e0', color:'#1D4ED8' }}>{IC.eye}</button>
                          <button className="act-pill" title={u.actif ? t('users.actions.deactivate') : t('users.actions.activate')} onClick={e => handleToggle(u.id, e)} disabled={!u.inscrit}
                            style={{ background:u.actif?'#dad277':'#F0FDF4', color:u.actif?'#854D0E':'#15803D' }}>{IC.toggle}</button>
                          <button className="act-pill" title={t('users.actions.delete')} onClick={e => handleDelete(u.id, u.inscrit?`${u.prenom} ${u.nom}`:u.matricule, e)} style={{ background:'#e38686', color:'#e40000' }}>{IC.trash}</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <Pagination
              currentPage={currentPage} totalPages={totalPages} perPage={perPage}
              totalItems={filtered.length} onPageChange={setCurrentPage}
              onPerPageChange={v => { setPerPage(v); setCurrentPage(1); }}
            />
          </div>
        )}
      </div>

      {modalCreer && (
        <ModalCreerUser
          onClose={() => setModalCreer(false)}
          onSave={() => { setModalCreer(false); loadUsers(); toast$(t('users.modal.success')); }}
        />
      )}
    </div>
  );
}