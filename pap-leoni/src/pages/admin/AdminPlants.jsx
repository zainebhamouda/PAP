import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { adminAPI } from '../../services/api';

const IC = {
  plus:   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  edit:   <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  trash:  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>,
  arrow:  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>,
  back:   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>,
  search: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  close:  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
};

function PlantModal({ plant, sites, onClose, onSave }) {
  const { t } = useTranslation();
  const isEdit = !!plant?.id;
  const [form, setForm] = useState({
    nom:         plant?.nom         || '',
    siteId:      plant?.siteId      ? String(plant.siteId) : '',
    code:        plant?.code        || '',
    clientNom:   plant?.clientNom   || '',
    description: plant?.description || '',
    actif:       plant?.actif !== false,
  });
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState('');
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const save = async () => {
    if (!form.nom.trim() || !form.siteId) { setError(t('plants.modal.errors.nameAndSiteRequired')); return; }
    setSaving(true); setError('');
    try {
      const payload = { ...form, siteId: parseInt(form.siteId) };
      isEdit ? await adminAPI.updatePlant(plant.id, payload) : await adminAPI.createPlant(payload);
      onSave();
    } catch (e) {
      const data = e.response?.data;
      setError(data?.message ?? data?.error ?? (typeof data === 'string' ? data : null) ?? t('common.error'));
    } finally { setSaving(false); }
  };

  const inp = (style = {}) => ({
    width:'100%', padding:'10px 13px', borderRadius:10, border:'1.5px solid #DAE2EF',
    fontSize:'.87rem', outline:'none', boxSizing:'border-box', fontFamily:'inherit',
    background:'#FAFBFD', ...style,
  });
  const lbl = { display:'block', fontSize:'.72rem', fontWeight:700, color:'#5C6F8A', marginBottom:5, textTransform:'uppercase', letterSpacing:'.07em' };

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,28,60,.48)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, backdropFilter:'blur(6px)' }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}@keyframes slideUp{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:translateY(0)}}`}</style>
      <div style={{ background:'#fff', borderRadius:20, width:'100%', maxWidth:500, overflow:'hidden', boxShadow:'0 32px 80px rgba(0,28,60,.22)', animation:'slideUp .22s ease' }}>
        <div style={{ background:'linear-gradient(135deg,#1A3A6B,#2563EB)', padding:'1.3rem 1.6rem', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div>
            <p style={{ margin:0, fontSize:'.92rem', fontWeight:800, color:'#fff' }}>{isEdit ? t('plants.modal.editTitle') : t('plants.modal.createTitle')}</p>
            <p style={{ margin:0, fontSize:'.7rem', color:'rgba(255,255,255,.45)' }}>{t('plants.modal.subtitle')}</p>
          </div>
          <button onClick={onClose} style={{ background:'rgba(255,255,255,.1)', border:'none', borderRadius:8, width:30, height:30, display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', cursor:'pointer' }}>✕</button>
        </div>

        <div style={{ padding:'1.4rem 1.6rem', maxHeight:'70vh', overflowY:'auto' }}>
          {error && (
            <div style={{ background:'#FDECEA', border:'1px solid #F5C6C0', borderRadius:10, padding:'9px 13px', marginBottom:14, fontSize:'.8rem', color:'#C0392B', fontWeight:600 }}>⚠ {error}</div>
          )}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0 14px' }}>

            <div style={{ gridColumn:'1/-1', marginBottom:14 }}>
              <label style={lbl}>{t('plants.fields.name')} <span style={{ color:'#C0392B' }}>*</span></label>
              <input value={form.nom} onChange={e => set('nom', e.target.value)} style={inp()} placeholder={t('plants.fields.namePlaceholder')}
                onFocus={e => { e.target.style.borderColor='#2563EB'; e.target.style.boxShadow='0 0 0 3px rgba(37,99,235,.1)'; }}
                onBlur={e =>  { e.target.style.borderColor='#DAE2EF'; e.target.style.boxShadow='none'; }} />
            </div>

            <div style={{ marginBottom:14 }}>
              <label style={lbl}>{t('plants.fields.site')} <span style={{ color:'#C0392B' }}>*</span></label>
              <select value={form.siteId} onChange={e => set('siteId', e.target.value)} style={inp()}>
                <option value="">{t('plants.fields.siteDefault')}</option>
                {sites.map(s => <option key={s.id} value={s.id}>{s.nom}</option>)}
              </select>
            </div>

            <div style={{ marginBottom:14 }}>
              <label style={lbl}>{t('plants.fields.code')}</label>
              <input value={form.code} onChange={e => set('code', e.target.value)} style={inp()} placeholder={t('plants.fields.codePlaceholder')}
                onFocus={e => e.target.style.borderColor='#2563EB'} onBlur={e => e.target.style.borderColor='#DAE2EF'} />
            </div>

            <div style={{ gridColumn:'1/-1', marginBottom:14 }}>
              <label style={lbl}>{t('plants.fields.client')}</label>
              <select value={form.clientNom} onChange={e => set('clientNom', e.target.value)} style={inp()}>
                <option value="">{t('plants.fields.clientDefault')}</option>
                {['BMW','Volkswagen','Audi','Mercedes','Porsche','Stellantis','Ford','Skoda','Lamborghini','Forvia / Faurecia','Bentley','Continental','Jaguar','Peugeot','Citroën','Fiat','Autre'].map(c =>
                  <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div style={{ gridColumn:'1/-1', marginBottom:14 }}>
              <label style={lbl}>{t('plants.fields.description')}</label>
              <textarea value={form.description} onChange={e => set('description', e.target.value)} rows={2}
                placeholder={t('plants.fields.descriptionPlaceholder')} style={{ ...inp(), resize:'vertical' }}
                onFocus={e => e.target.style.borderColor='#2563EB'} onBlur={e => e.target.style.borderColor='#DAE2EF'} />
            </div>

            <div style={{ gridColumn:'1/-1', marginBottom:8 }}>
              <label style={{ ...lbl, display:'flex', alignItems:'center', gap:10, cursor:'pointer' }}>
                <input type="checkbox" checked={form.actif} onChange={e => set('actif', e.target.checked)}
                  style={{ width:16, height:16, accentColor:'#2563EB', cursor:'pointer' }} />
                {t('plants.fields.active')}
              </label>
            </div>
          </div>

          <div style={{ display:'flex', gap:9, justifyContent:'flex-end', marginTop:'1.2rem' }}>
            <button onClick={onClose} style={{ padding:'9px 20px', borderRadius:10, border:'1.5px solid #DAE2EF', background:'#F7F9FC', color:'#374151', fontWeight:600, fontSize:'.85rem', cursor:'pointer' }}>{t('common.cancel')}</button>
            <button onClick={save} disabled={saving} style={{ padding:'9px 22px', borderRadius:10, border:'none', background:'linear-gradient(135deg,#1A3A6B,#2563EB)', color:'#fff', fontWeight:700, fontSize:'.85rem', cursor:saving?'not-allowed':'pointer', opacity:saving?0.7:1, display:'flex', alignItems:'center', gap:8 }}>
              {saving && <span style={{ width:13, height:13, border:'2px solid rgba(255,255,255,.3)', borderTopColor:'#fff', borderRadius:'50%', display:'inline-block', animation:'spin .7s linear infinite' }} />}
              {saving ? t('common.inProgress') : isEdit ? t('common.save') : t('plants.createButton')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminPlants() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const siteId  = searchParams.get('siteId');
  const siteNom = searchParams.get('siteNom');

  const [plants,     setPlants]     = useState([]);
  const [sites,      setSites]      = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [modal,      setModal]      = useState(null);
  const [search,     setSearch]     = useState('');
  const [filterSite, setFilterSite] = useState(siteId || '');
  const [toast,      setToast]      = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([adminAPI.getPlants(), adminAPI.getSites()])
      .then(([p, s]) => { setPlants(p.data); setSites(s.data); })
      .finally(() => setLoading(false));
  }, []);
  useEffect(() => { load(); }, [load]);

  const toast$ = (msg, ok = true) => { setToast({ msg, ok }); setTimeout(() => setToast(null), 3000); };

  const del = async p => {
    if (!window.confirm(t('plants.toast.confirmDelete', { name: p.nom }))) return;
    try { await adminAPI.deletePlant(p.id); load(); toast$(`"${p.nom}" ${t('plants.toast.deleted')}`); }
    catch { toast$(t('plants.toast.deleteError'), false); }
  };

  const saved = () => {
    setModal(null); load();
    toast$(modal?.id ? t('plants.toast.updated') : t('plants.toast.created'));
  };

  const filtered = plants.filter(p => {
    const matchSearch = p.nom?.toLowerCase().includes(search.toLowerCase());
    const matchSite   = filterSite ? String(p.siteId) === String(filterSite) : true;
    return matchSearch && matchSite;
  });

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'1.4rem' }}>
      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes up{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
        @keyframes tin{from{opacity:0;transform:translateX(16px)}to{opacity:1;transform:translateX(0)}}
        .sc{transition:transform .18s,box-shadow .18s}.sc:hover{transform:translateY(-3px)!important;box-shadow:0 8px 22px rgba(0,0,0,.1)!important}
        .ib{transition:opacity .14s}.ib:hover{opacity:.8}
      `}</style>

      {toast && (
        <div style={{ position:'fixed', top:22, right:22, zIndex:2000, background:toast.ok?'#0B1E3D':'#FEF2F2', color:toast.ok?'#fff':'#B91C1C', padding:'11px 18px', borderRadius:12, fontSize:'.83rem', fontWeight:700, animation:'tin .25s ease', display:'flex', alignItems:'center', gap:8 }}>
          {toast.ok ? '✓' : '⚠'} {toast.msg}
        </div>
      )}

      {/* Toolbar */}
      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
        {siteId && (
          <button onClick={() => navigate('/admin/sites')}
            style={{ display:'flex', alignItems:'center', gap:6, background:'#F1F5F9', border:'none', borderRadius:10, padding:'8px 14px', color:'#374151', fontWeight:600, fontSize:'.83rem', cursor:'pointer', whiteSpace:'nowrap' }}>
            {IC.back} {t('plants.backToSites')}
          </button>
        )}
        <div style={{ position:'relative', flex:1 }}>
          <span style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'#94A3B8' }}>{IC.search}</span>
          <input type="text" placeholder={siteNom ? `${t('plants.search.placeholder').replace('…','')} ${siteNom}…` : t('plants.search.placeholder')}
            value={search} onChange={e => setSearch(e.target.value)}
            style={{ width:'100%', padding:'10px 13px 10px 38px', borderRadius:12, border:'1px solid #D1D5DB', fontSize:'.86rem', outline:'none', boxSizing:'border-box', background:'#fff' }}
            onFocus={e => e.target.style.borderColor='#6B7280'} onBlur={e => e.target.style.borderColor='#D1D5DB'}
          />
          {search && (
            <button onClick={() => setSearch('')} style={{ position:'absolute', right:10, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', color:'#94A3B8', cursor:'pointer' }}>{IC.close}</button>
          )}
        </div>
        <select value={filterSite} onChange={e => setFilterSite(e.target.value)}
          style={{ padding:'10px 13px', borderRadius:12, border:'1px solid #D1D5DB', fontSize:'.84rem', outline:'none', background:'#fff', color:'#374151', cursor:'pointer' }}>
         <option value="">{t('filtrage.sites')}</option>
          {sites.map(s => <option key={s.id} value={s.id}>{s.nom}</option>)}
        </select>
        <button onClick={() => setModal(siteId ? { siteId: parseInt(siteId) } : {})}
          style={{ display:'flex', alignItems:'center', gap:7, background:'linear-gradient(135deg,#1A3A6B,#2563EB)', color:'#fff', border:'none', borderRadius:12, padding:'10px 20px', fontWeight:700, fontSize:'.85rem', cursor:'pointer', boxShadow:'0 4px 14px rgba(26,58,107,.28)', whiteSpace:'nowrap' }}>
          {IC.plus} {t('plants.newButton')}
        </button>
      </div>

      {loading ? (
        <div style={{ display:'flex', alignItems:'center', justifyContent:'center', padding:'3.5rem', gap:12, color:'#94A3B8' }}>
          <span style={{ width:26, height:26, border:'3px solid #E2E8F0', borderTopColor:'#1D4ED8', borderRadius:'50%', animation:'spin .8s linear infinite', display:'inline-block' }} />
          {t('common.loading')}
        </div>
      ) : (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'1rem' }}>
          {filtered.map((p, i) => (
            <div key={p.id} className="sc"
              style={{ background:'#fff', borderRadius:18, boxShadow:'0 2px 16px rgba(0,0,0,.07)', border:'.5px solid #BFDBFE', animation:`up .4s ${i*.05}s ease both`, padding:'1.4rem' }}>
              <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:'1rem' }}>
                <div style={{ width:48, height:48, borderRadius:14, background:'linear-gradient(135deg,#1D4ED8,#3B82F6)', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.2rem', fontWeight:900 }}>
                  {p.nom?.[0]?.toUpperCase()}
                </div>
                <div>
                  <p style={{ margin:0, fontWeight:800, fontSize:'.92rem', color:'#0B1E3D' }}>{p.nom}</p>
                  <p style={{ margin:'3px 0 0', fontSize:'.74rem', color:'#94A3B8' }}>{p.siteNom} · {p.nombreSegments || 0} segment(s)</p>
                </div>
              </div>
              <div style={{ display:'flex', gap:8 }}>
                <button className="ib"
                  onClick={() => navigate(`/admin/segments?plantId=${p.id}&plantNom=${encodeURIComponent(p.nom)}`)}
                  style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:5, padding:'8px 0', borderRadius:12, border:'none', background:'#CBD5E1', color:'#1E293B', fontSize:'.78rem', fontWeight:700, cursor:'pointer' }}>
                  {t('plants.segments')} {IC.arrow}
                </button>
                <button className="ib" onClick={() => setModal(p)}
                  style={{ width:36, display:'flex', alignItems:'center', justifyContent:'center', padding:'8px', borderRadius:15, border:'none', background:'#A7F3D0', color:'#065F46', cursor:'pointer' }}>{IC.edit}</button>
                <button className="ib" onClick={() => del(p)}
                  style={{ width:36, display:'flex', alignItems:'center', justifyContent:'center', padding:'8px', borderRadius:15, border:'none', background:'#FECACA', color:'#991B1B', cursor:'pointer' }}>{IC.trash}</button>
              </div>
            </div>
          ))}
          {!filtered.length && (
            <div style={{ gridColumn:'1/-1', textAlign:'center', padding:'3.5rem', color:'#94A3B8' }}>
              <div style={{ fontSize:'2.5rem' }}>🏭</div>
              <p style={{ fontWeight:600 }}>{t('plants.notFound')}</p>
            </div>
          )}
        </div>
      )}

      {modal !== null && (
        <PlantModal plant={modal?.id ? modal : null} sites={sites} onClose={() => setModal(null)} onSave={saved} />
      )}
    </div>
  );
}