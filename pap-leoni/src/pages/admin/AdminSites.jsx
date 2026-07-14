import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { adminAPI } from '../../services/api';
import LogoImage from '../../components/common/LogoImage';

const IC = {
  plus:   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  edit:   <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  trash:  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>,
  arrow:  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>,
  search: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  close:  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  pin:    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>,
  users:  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  area:   <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18M15 3v18M3 9h18M3 15h18"/></svg>,
};

function ModalField({ label, k, placeholder, type = 'text', required, value, onChange }) {
  return (
    <div style={{ marginBottom:14 }}>
      <label style={{ display:'block', fontSize:'.72rem', fontWeight:700, color:'#374151', marginBottom:5, textTransform:'uppercase', letterSpacing:'.06em' }}>
        {label}{required && <span style={{ color:'#C0392B', marginLeft:2 }}>*</span>}
      </label>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={onChange}
        style={{ width:'100%', padding:'10px 13px', borderRadius:10, border:'1.5px solid #E2E8F0', fontSize:'.87rem', outline:'none', boxSizing:'border-box', fontFamily:'inherit', background:'#FAFBFD', transition:'border .15s, box-shadow .15s' }}
        onFocus={e => { e.target.style.borderColor='#0B1E3D'; e.target.style.boxShadow='0 0 0 3px rgba(11,30,61,.08)'; e.target.style.background='#fff'; }}
        onBlur={e  => { e.target.style.borderColor='#E2E8F0'; e.target.style.boxShadow='none'; e.target.style.background='#FAFBFD'; }}
      />
    </div>
  );
}

function Modal({ site, onClose, onSave }) {
  const { t } = useTranslation();
  const isEdit = !!site?.id;
  const [form, setForm] = useState({
    nom:               site?.nom               || '',
    localisation:      site?.localisation      || '',
    totalSpaceM2:      site?.totalSpaceM2      || '',
    productionSpaceM2: site?.productionSpaceM2 || '',
    numberOfPlants:    site?.numberOfPlants    || '',
    totalHc:           site?.totalHc           || '',
    directHc:          site?.directHc          || '',
    indirectHc:        site?.indirectHc        || '',
  });
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState('');
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const save = async () => {
    if (!form.nom.trim())          { setError(t('sites.modal.errors.nameRequired'));     return; }
    if (!form.localisation.trim()) { setError(t('sites.modal.errors.locationRequired')); return; }
    setSaving(true); setError('');
    try {
      const payload = {
        nom: form.nom.trim(), localisation: form.localisation.trim(),
        totalSpaceM2:      form.totalSpaceM2      ? parseInt(form.totalSpaceM2)      : null,
        productionSpaceM2: form.productionSpaceM2 ? parseInt(form.productionSpaceM2) : null,
        numberOfPlants:    form.numberOfPlants    ? parseInt(form.numberOfPlants)    : null,
        totalHc:           form.totalHc           ? parseInt(form.totalHc)           : null,
        directHc:          form.directHc          ? parseInt(form.directHc)          : null,
        indirectHc:        form.indirectHc        ? parseInt(form.indirectHc)        : null,
      };
      isEdit ? await adminAPI.updateSite(site.id, payload) : await adminAPI.createSite(payload);
      onSave();
    } catch (e) {
      const data = e.response?.data;
      setError(data?.message ?? data?.error ?? (typeof data === 'string' ? data : null) ?? t('sites.modal.errors.saveError'));
    } finally { setSaving(false); }
  };

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(11,30,61,.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, backdropFilter:'blur(4px)' }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}} @keyframes slideUp{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:translateY(0)}}`}</style>
      <div style={{ background:'#fff', borderRadius:20, width:'100%', maxWidth:500, overflow:'hidden', boxShadow:'0 24px 64px rgba(0,0,0,.22)', animation:'slideUp .22s ease' }}>
        <div style={{ background:'#0B1E3D', padding:'1.3rem 1.6rem', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div style={{ display:'flex', alignItems:'center', gap:11 }}>
            <div style={{ width:38, height:38, borderRadius:10, background:'rgba(255,255,255,.12)', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center' }}>{IC.pin}</div>
            <div>
              <p style={{ margin:0, fontSize:'.92rem', fontWeight:800, color:'#fff' }}>{isEdit ? t('sites.modal.editTitle') : t('sites.modal.createTitle')}</p>
              <p style={{ margin:0, fontSize:'.72rem', color:'rgba(255,255,255,.4)' }}>{t('sites.modal.subtitle')}</p>
            </div>
          </div>
          <button onClick={onClose} style={{ background:'rgba(255,255,255,.1)', border:'none', borderRadius:8, width:32, height:32, display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', cursor:'pointer' }}>{IC.close}</button>
        </div>
        <div style={{ padding:'1.5rem 1.6rem', maxHeight:'72vh', overflowY:'auto' }}>
          {error && <div style={{ background:'#FEF2F2', border:'1px solid #FECACA', borderRadius:10, padding:'9px 13px', marginBottom:14, fontSize:'.8rem', color:'#B91C1C', fontWeight:600 }}>⚠ {error}</div>}
          <ModalField label={t('sites.fields.name')}     k="nom"          value={form.nom}          placeholder={t('sites.fields.namePlaceholder')}     required onChange={e => set('nom', e.target.value)} />
          <ModalField label={t('sites.fields.location')} k="localisation" value={form.localisation} placeholder={t('sites.fields.locationPlaceholder')} required onChange={e => set('localisation', e.target.value)} />
          <div style={{ display:'flex', alignItems:'center', gap:10, margin:'4px 0 16px' }}>
            <div style={{ flex:1, height:1, background:'#EEF2F8' }} />
            <span style={{ fontSize:'.7rem', fontWeight:700, color:'#9CA3AF', textTransform:'uppercase', letterSpacing:'.08em' }}>{t('sites.modal.optional')}</span>
            <div style={{ flex:1, height:1, background:'#EEF2F8' }} />
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0 14px' }}>
            <ModalField label={t('sites.fields.totalSpace')}      k="totalSpaceM2"      value={form.totalSpaceM2}      placeholder={t('sites.fields.totalSpacePlaceholder')}      type="number" onChange={e => set('totalSpaceM2', e.target.value)} />
            <ModalField label={t('sites.fields.productionSpace')} k="productionSpaceM2" value={form.productionSpaceM2} placeholder={t('sites.fields.productionSpacePlaceholder')} type="number" onChange={e => set('productionSpaceM2', e.target.value)} />
            <ModalField label={t('sites.fields.numberOfPlants')}  k="numberOfPlants"    value={form.numberOfPlants}    placeholder={t('sites.fields.numberOfPlantPlaceholder')}   type="number" onChange={e => set('numberOfPlants', e.target.value)} />
            <ModalField label={t('sites.fields.totalHc')}         k="totalHc"           value={form.totalHc}           placeholder={t('sites.fields.totalHcPlaceholder')}         type="number" onChange={e => set('totalHc', e.target.value)} />
            <ModalField label={t('sites.fields.directHc')}        k="directHc"          value={form.directHc}          placeholder={t('sites.fields.directHcPlaceholder')}        type="number" onChange={e => set('directHc', e.target.value)} />
            <ModalField label={t('sites.fields.indirectHc')}      k="indirectHc"        value={form.indirectHc}        placeholder={t('sites.fields.indirectHcPlaceholder')}      type="number" onChange={e => set('indirectHc', e.target.value)} />
          </div>
          <div style={{ display:'flex', gap:9, justifyContent:'flex-end', marginTop:'1.2rem' }}>
            <button onClick={onClose} style={{ padding:'9px 20px', borderRadius:10, border:'1.5px solid #E2E8F0', background:'#F8FAFC', color:'#374151', fontWeight:600, fontSize:'.85rem', cursor:'pointer' }}>{t('common.cancel')}</button>
            <button onClick={save} disabled={saving} style={{ padding:'9px 22px', borderRadius:10, border:'none', background:'#0B1E3D', color:'#fff', fontWeight:700, fontSize:'.85rem', cursor:saving?'not-allowed':'pointer', opacity:saving?0.7:1, display:'flex', alignItems:'center', gap:7 }}>
              {saving && <span style={{ width:12, height:12, border:'2px solid rgba(255,255,255,.3)', borderTopColor:'#fff', borderRadius:'50%', display:'inline-block', animation:'spin .7s linear infinite' }}/>}
              {saving ? t('common.inProgress') : isEdit ? t('common.save') : t('sites.newButton')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminSites() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [sites,   setSites]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal,   setModal]   = useState(null);
  const [search,  setSearch]  = useState('');
  const [toast,   setToast]   = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    adminAPI.getSites().then(r => setSites(r.data)).finally(() => setLoading(false));
  }, []);
  useEffect(() => { load(); }, [load]);

  const toast$ = (msg, ok = true) => { setToast({ msg, ok }); setTimeout(() => setToast(null), 3000); };

  const del = async s => {
    if (!window.confirm(t('sites.toast.confirmDelete', { name: s.nom }))) return;
    try { await adminAPI.deleteSite(s.id); load(); toast$(`"${s.nom}" ${t('sites.toast.deleted')}`); }
    catch { toast$(t('sites.toast.deleteError'), false); }
  };

  const saved = () => {
    setModal(null); load();
    toast$(modal?.id ? t('sites.toast.updated') : t('sites.toast.created'));
  };

  const filtered = sites.filter(s =>
    s.nom?.toLowerCase().includes(search.toLowerCase()) ||
    s.localisation?.toLowerCase().includes(search.toLowerCase())
  );
  const fmt = n => n ? Number(n).toLocaleString('fr-FR') : '—';

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'1.4rem' }}>
      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes up{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
        @keyframes tin{from{opacity:0;transform:translateX(16px)}to{opacity:1;transform:translateX(0)}}
        .sc{transition:transform .18s,box-shadow .18s}.sc:hover{transform:translateY(-3px)!important;box-shadow:0 8px 24px rgba(0,0,0,.12)!important}
        .ib{transition:opacity .14s,transform .14s}.ib:hover{opacity:.82;transform:scale(1.05)}
      `}</style>

      {toast && (
        <div style={{ position:'fixed', top:22, right:22, zIndex:2000, background:toast.ok?'#0B1E3D':'#FEF2F2', color:toast.ok?'#fff':'#B91C1C', padding:'11px 18px', borderRadius:12, fontSize:'.83rem', fontWeight:700, boxShadow:'0 6px 24px rgba(0,0,0,.18)', animation:'tin .25s ease', display:'flex', alignItems:'center', gap:8 }}>
          {toast.ok ? '✓' : '⚠'} {toast.msg}
        </div>
      )}

      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
        <div style={{ position:'relative', flex:1 }}>
          <span style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'#94A3B8' }}>{IC.search}</span>
          <input type="text" placeholder={t('sites.search.placeholder')} value={search} onChange={e => setSearch(e.target.value)}
            style={{ width:'100%', padding:'10px 13px 10px 38px', borderRadius:12, border:'1px solid #D1D5DB', fontSize:'.86rem', outline:'none', boxSizing:'border-box', background:'#fff' }}
            onFocus={e => e.target.style.borderColor='#6B7280'} onBlur={e => e.target.style.borderColor='#D1D5DB'} />
          {search && <button onClick={() => setSearch('')} style={{ position:'absolute', right:10, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', color:'#94A3B8', cursor:'pointer' }}>{IC.close}</button>}
        </div>
        <span style={{ fontSize:'.82rem', color:'#94A3B8', fontWeight:600, whiteSpace:'nowrap' }}>
          {filtered.length} {filtered.length !== 1 ? t('sites.counter_plural') : t('sites.counter')}
        </span>
        <button onClick={() => setModal({})}
          style={{ display:'flex', alignItems:'center', gap:7, background:'#0B1E3D', color:'#fff', border:'none', borderRadius:12, padding:'10px 20px', fontWeight:700, fontSize:'.85rem', cursor:'pointer', whiteSpace:'nowrap', boxShadow:'0 4px 14px rgba(11,30,61,.25)' }}>
          {IC.plus} {t('sites.newButton')}
        </button>
      </div>

      {loading ? (
        <div style={{ display:'flex', alignItems:'center', justifyContent:'center', padding:'3.5rem', gap:12, color:'#94A3B8' }}>
          <span style={{ width:26, height:26, border:'3px solid #E2E8F0', borderTopColor:'#0B1E3D', borderRadius:'50%', animation:'spin .8s linear infinite', display:'inline-block' }}/>
          {t('common.loading')}
        </div>
      ) : (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(300px, 1fr))', gap:'1rem' }}>
          {filtered.map((s, i) => (
            <div key={s.id} className="sc"
              style={{ background:'#fff', borderRadius:18, overflow:'hidden', boxShadow:'0 2px 16px rgba(0,0,0,.07)', border:'.5px solid #BFDBFE', animation:`up .4s ${i*.05}s ease both`, opacity:0 }}>
              <div style={{ height:4, background:'linear-gradient(90deg,#0B1E3D,#1D4ED8)' }} />
              <div style={{ padding:'1.25rem 1.4rem' }}>
                <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:'1rem' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                    <LogoImage type="site" nom={s.nom} size={48} radius={14} />
                    <div>
                      <p style={{ margin:0, fontWeight:800, fontSize:'.92rem', color:'#0B1E3D' }}>{s.nom}</p>
                      <p style={{ margin:'3px 0 0', fontSize:'.74rem', color:'#94A3B8', display:'flex', alignItems:'center', gap:4 }}>
                        {IC.pin} {s.localisation || '—'}
                      </p>
                    </div>
                  </div>
                  <span style={{ background:'#EFF6FF', color:'#1D4ED8', fontSize:'.66rem', fontWeight:800, padding:'3px 9px', borderRadius:99, whiteSpace:'nowrap' }}>
                    {s.numberOfPlants ?? s.nombrePlants ?? 0} {t('sites.fields.numberOfPlantsSub')}
                  </span>
                </div>

                {(s.totalSpaceM2 || s.totalHc) && (
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:'1rem' }}>
                    {s.totalSpaceM2 && (
                      <div style={{ background:'#F8FAFC', borderRadius:10, padding:'7px 10px' }}>
                        <p style={{ margin:0, fontSize:'.65rem', color:'#94A3B8', fontWeight:600, display:'flex', alignItems:'center', gap:3, marginBottom:1 }}>{IC.area} {t('sites.fields.totalSurface')}</p>
                        <p style={{ margin:0, fontSize:'.82rem', fontWeight:700, color:'#0B1E3D' }}>{fmt(s.totalSpaceM2)} m²</p>
                      </div>
                    )}
                    {s.productionSpaceM2 && (
                      <div style={{ background:'#F8FAFC', borderRadius:10, padding:'7px 10px' }}>
                        <p style={{ margin:0, fontSize:'.65rem', color:'#94A3B8', fontWeight:600, display:'flex', alignItems:'center', gap:3, marginBottom:1 }}>{IC.area} {t('sites.fields.productionSurface')}</p>
                        <p style={{ margin:0, fontSize:'.82rem', fontWeight:700, color:'#0B1E3D' }}>{fmt(s.productionSpaceM2)} m²</p>
                      </div>
                    )}
                    {s.totalHc && (
                      <div style={{ background:'#F8FAFC', borderRadius:10, padding:'7px 10px' }}>
                        <p style={{ margin:0, fontSize:'.65rem', color:'#94A3B8', fontWeight:600, display:'flex', alignItems:'center', gap:3, marginBottom:1 }}>{IC.users} {t('sites.fields.totalHc')}</p>
                        <p style={{ margin:0, fontSize:'.82rem', fontWeight:700, color:'#0B1E3D' }}>{fmt(s.totalHc)}</p>
                      </div>
                    )}
                    {(s.directHc || s.indirectHc) && (
                      <div style={{ background:'#F8FAFC', borderRadius:10, padding:'7px 10px' }}>
                        <p style={{ margin:0, fontSize:'.65rem', color:'#94A3B8', fontWeight:600, display:'flex', alignItems:'center', gap:3, marginBottom:1 }}>{IC.users} {t('sites.fields.directIndirect')}</p>
                        <p style={{ margin:0, fontSize:'.82rem', fontWeight:700, color:'#0B1E3D' }}>{fmt(s.directHc)} / {fmt(s.indirectHc)}</p>
                      </div>
                    )}
                  </div>
                )}

                <div style={{ display:'flex', gap:8 }}>
                  <button className="ib" onClick={() => navigate(`/admin/plants?siteId=${s.id}&siteNom=${encodeURIComponent(s.nom)}`)}
                    style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:5, padding:'8px 0', borderRadius:15, border:'none', background:'#BFDBFE', color:'#1E40AF', fontSize:'.78rem', fontWeight:700, cursor:'pointer' }}>
                    {t('sites.plants')} {IC.arrow}
                  </button>
                  <button className="ib" onClick={() => setModal(s)} title={t('common.edit')}
                    style={{ width:36, display:'flex', alignItems:'center', justifyContent:'center', padding:'8px', borderRadius:15, border:'none', background:'#A7F3D0', color:'#065F46', cursor:'pointer' }}>{IC.edit}</button>
                  <button className="ib" onClick={() => del(s)} title={t('common.delete')}
                    style={{ width:36, display:'flex', alignItems:'center', justifyContent:'center', padding:'8px', borderRadius:15, border:'none', background:'#FECACA', color:'#991B1B', cursor:'pointer' }}>{IC.trash}</button>
                </div>
              </div>
            </div>
          ))}
          {!filtered.length && (
            <div style={{ gridColumn:'1/-1', textAlign:'center', padding:'3.5rem', color:'#94A3B8' }}>
              <div style={{ fontSize:'2.5rem', marginBottom:10 }}>📍</div>
              <p style={{ fontWeight:700, color:'#5C6F8A', fontSize:'.95rem' }}>{t('sites.notFound')}</p>
              <p style={{ fontSize:'.82rem', marginTop:4 }}>{search ? t('sites.notFoundSearch') : t('sites.notFoundCreate')}</p>
            </div>
          )}
        </div>
      )}

      {modal !== null && <Modal site={modal?.id ? modal : null} onClose={() => setModal(null)} onSave={saved} />}
    </div>
  );
}