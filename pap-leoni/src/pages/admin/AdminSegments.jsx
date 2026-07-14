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

function Modal({ segment, plants, onClose, onSave }) {
  const { t } = useTranslation();
  const isEdit = !!segment?.id;
  const [form, setForm]     = useState({ nom: segment?.nom || '', plantId: segment?.plantId || '' });
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState('');

  const save = async () => {
    if (!form.nom.trim() || !form.plantId) { setError(t('segments.modal.errors.nameAndPlantRequired')); return; }
    setSaving(true); setError('');
    try {
      isEdit ? await adminAPI.updateSegment(segment.id, form) : await adminAPI.createSegment(form);
      onSave();
    } catch (e) {
      const data = e.response?.data;
      setError(data?.message ?? data?.error ?? (typeof data === 'string' ? data : null) ?? t('common.error'));
    } finally { setSaving(false); }
  };

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(11,30,61,.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, backdropFilter:'blur(4px)' }}>
      <div style={{ background:'#fff', borderRadius:18, width:'100%', maxWidth:440, overflow:'hidden', boxShadow:'0 24px 64px rgba(0,0,0,.2)' }}>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        <div style={{ background:'#312E81', padding:'1.4rem 1.75rem', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <p style={{ margin:0, fontSize:'.92rem', fontWeight:800, color:'#fff' }}>{isEdit ? t('segments.modal.editTitle') : t('segments.modal.createTitle')}</p>
          <button onClick={onClose} style={{ background:'rgba(255,255,255,.1)', border:'none', borderRadius:8, width:32, height:32, display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', cursor:'pointer' }}>{IC.close}</button>
        </div>
        <div style={{ padding:'1.75rem' }}>
          {error && <div style={{ background:'#FEF2F2', border:'1px solid #FECACA', borderRadius:10, padding:'9px 13px', marginBottom:14, fontSize:'.8rem', color:'#B91C1C', fontWeight:600 }}>⚠ {error}</div>}

          <div style={{ marginBottom:'1.1rem' }}>
            <label style={{ display:'block', fontSize:'.75rem', fontWeight:700, color:'#374151', marginBottom:6, textTransform:'uppercase', letterSpacing:'.06em' }}>
              {t('segments.fields.name')}
            </label>
            <input type="text" value={form.nom} placeholder={t('segments.fields.namePlaceholder')}
              onChange={e => setForm(p => ({ ...p, nom: e.target.value }))}
              style={{ width:'100%', padding:'10px 13px', borderRadius:10, border:'1.5px solid #E2E8F0', fontSize:'.88rem', outline:'none', boxSizing:'border-box' }}
              onFocus={e => { e.target.style.borderColor='#312E81'; e.target.style.boxShadow='0 0 0 3px rgba(49,46,129,.08)'; }}
              onBlur={e =>  { e.target.style.borderColor='#E2E8F0'; e.target.style.boxShadow='none'; }}
            />
          </div>

          <div style={{ marginBottom:'1.1rem' }}>
            <label style={{ display:'block', fontSize:'.75rem', fontWeight:700, color:'#374151', marginBottom:6, textTransform:'uppercase', letterSpacing:'.06em' }}>
              {t('segments.fields.plant')}
            </label>
            <select value={form.plantId} onChange={e => setForm(p => ({ ...p, plantId: e.target.value }))}
              style={{ width:'100%', padding:'10px 13px', borderRadius:10, border:'1.5px solid #E2E8F0', fontSize:'.88rem', outline:'none', background:'#fff', boxSizing:'border-box' }}>
              <option value="">{t('segments.fields.plantDefault')}</option>
              {plants.map(p => <option key={p.id} value={p.id}>{p.nom} {p.siteNom ? `(${p.siteNom})` : ''}</option>)}
            </select>
          </div>

          <div style={{ display:'flex', gap:9, justifyContent:'flex-end', marginTop:'1.4rem' }}>
            <button onClick={onClose} style={{ padding:'9px 20px', borderRadius:10, border:'1.5px solid #E2E8F0', background:'#F8FAFC', color:'#374151', fontWeight:600, fontSize:'.85rem', cursor:'pointer' }}>{t('common.cancel')}</button>
            <button onClick={save} disabled={saving} style={{ padding:'9px 22px', borderRadius:10, border:'none', background:'#312E81', color:'#fff', fontWeight:700, fontSize:'.85rem', cursor:saving?'not-allowed':'pointer', opacity:saving?0.7:1, display:'flex', alignItems:'center', gap:7 }}>
              {saving && <span style={{ width:12, height:12, border:'2px solid rgba(255,255,255,.3)', borderTopColor:'#fff', borderRadius:'50%', display:'inline-block', animation:'spin .7s linear infinite' }}/>}
              {saving ? t('common.inProgress') : isEdit ? t('common.save') : t('common.create')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminSegments() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const plantId  = searchParams.get('plantId');
  const plantNom = searchParams.get('plantNom');

  const [segments,    setSegments]    = useState([]);
  const [plants,      setPlants]      = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [modal,       setModal]       = useState(null);
  const [search,      setSearch]      = useState('');
  const [filterPlant, setFilterPlant] = useState(plantId || '');
  const [toast,       setToast]       = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([adminAPI.getSegments(), adminAPI.getPlants()])
      .then(([s, p]) => { setSegments(s.data); setPlants(p.data); })
      .finally(() => setLoading(false));
  }, []);
  useEffect(() => { load(); }, [load]);

  const toast$ = (msg, ok = true) => { setToast({ msg, ok }); setTimeout(() => setToast(null), 3000); };

  const del = async s => {
    if (!window.confirm(t('segments.toast.confirmDelete', { name: s.nom }))) return;
    try { await adminAPI.deleteSegment(s.id); load(); toast$(`"${s.nom}" ${t('segments.toast.deleted')}`); }
    catch { toast$(t('segments.toast.deleteError'), false); }
  };

  const saved = () => {
    setModal(null); load();
    toast$(modal?.id ? t('segments.toast.updated') : t('segments.toast.created'));
  };

  const filtered = segments.filter(s => {
    const matchSearch = s.nom?.toLowerCase().includes(search.toLowerCase());
    const matchPlant  = filterPlant ? String(s.plantId) === String(filterPlant) : true;
    return matchSearch && matchPlant;
  });

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'1.4rem' }}>
      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes up{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
        @keyframes tin{from{opacity:0;transform:translateX(16px)}to{opacity:1;transform:translateX(0)}}
        .sc{transition:transform .18s,box-shadow .18s}.sc:hover{transform:translateY(-3px)!important;box-shadow:0 8px 22px rgba(0,0,0,.1)!important}
        .ib{transition:opacity .14s}.ib:hover{opacity:.8}
        .nav-btn{transition:background .15s}.nav-btn:hover{background:#C4B5FD!important}
      `}</style>

      {toast && (
        <div style={{ position:'fixed', top:22, right:22, zIndex:2000, background:toast.ok?'#0B1E3D':'#FEF2F2', color:toast.ok?'#fff':'#B91C1C', padding:'11px 18px', borderRadius:12, fontSize:'.83rem', fontWeight:700, animation:'tin .25s ease', display:'flex', alignItems:'center', gap:8 }}>
          {toast.ok ? '✓' : '⚠'} {toast.msg}
        </div>
      )}

      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
        {plantId && (
          <button onClick={() => navigate('/admin/plants')}
            style={{ display:'flex', alignItems:'center', gap:6, background:'#F8FAFC', border:'1.5px solid #CBD5E1', borderRadius:10, padding:'8px 14px', color:'#374151', fontWeight:600, fontSize:'.83rem', cursor:'pointer', whiteSpace:'nowrap' }}>
            {IC.back} {t('segments.backToPlants')}
          </button>
        )}
        <div style={{ position:'relative', flex:1 }}>
          <span style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'#94A3B8' }}>{IC.search}</span>
          <input type="text" placeholder={plantNom ? `${t('segments.search.placeholder').replace('…','')} ${plantNom}…` : t('segments.search.placeholder')}
            value={search} onChange={e => setSearch(e.target.value)}
            style={{ width:'100%', padding:'10px 13px 10px 38px', borderRadius:12, border:'1px solid #D1D5DB', fontSize:'.86rem', outline:'none', boxSizing:'border-box', background:'#fff' }}
            onFocus={e => e.target.style.borderColor='#6B7280'} onBlur={e => e.target.style.borderColor='#D1D5DB'}
          />
          {search && <button onClick={() => setSearch('')} style={{ position:'absolute', right:10, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', color:'#94A3B8', cursor:'pointer' }}>{IC.close}</button>}
        </div>
        <select value={filterPlant} onChange={e => setFilterPlant(e.target.value)}
          style={{ padding:'10px 13px', borderRadius:12, border:'1px solid #D1D5DB', fontSize:'.84rem', outline:'none', background:'#fff', color:'#374151', cursor:'pointer' }}>
<option value="">{t('filtrage.plants')}</option>
          {plants.map(p => <option key={p.id} value={p.id}>{p.nom}</option>)}
        </select>
        <button onClick={() => setModal(plantId ? { plantId: parseInt(plantId) } : {})}
          style={{ display:'flex', alignItems:'center', gap:7, background:'#312E81', color:'#fff', border:'none', borderRadius:12, padding:'10px 20px', fontWeight:700, fontSize:'.85rem', cursor:'pointer', whiteSpace:'nowrap' }}>
          {IC.plus} {t('segments.newButton')}
        </button>
      </div>

      {loading ? (
        <div style={{ display:'flex', alignItems:'center', justifyContent:'center', padding:'3.5rem', gap:12, color:'#94A3B8' }}>
          <span style={{ width:26, height:26, border:'3px solid #E2E8F0', borderTopColor:'#312E81', borderRadius:'50%', animation:'spin .8s linear infinite', display:'inline-block' }}/> {t('common.loading')}
        </div>
      ) : (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'1rem' }}>
          {filtered.map((s, i) => (
            <div key={s.id} className="sc" style={{ background:'#fff', borderRadius:18, boxShadow:'0 2px 16px rgba(0,0,0,.07)', border:'.5px solid #C7D2FE', animation:`up .4s ${i*.05}s ease both`, padding:'1.4rem' }}>
              <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:'1rem' }}>
                <div style={{ width:48, height:48, borderRadius:14, background:'linear-gradient(135deg,#312E81,#6366F1)', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.2rem', fontWeight:900 }}>
                  {s.nom?.[0]?.toUpperCase()}
                </div>
                <div>
                  <p style={{ margin:0, fontWeight:800, fontSize:'.92rem', color:'#0B1E3D' }}>{s.nom}</p>
                  <p style={{ margin:'3px 0 0', fontSize:'.74rem', color:'#94A3B8' }}>{s.plantNom} · {s.nombreProjets || 0} projet(s)</p>
                </div>
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:4, background:'#F8FAFC', borderRadius:8, padding:'6px 10px', marginBottom:'1rem', fontSize:'.72rem', color:'#64748b', fontWeight:600 }}>
                <span>{s.siteNom||'—'}</span><span style={{ color:'#CBD5E1' }}>›</span>
                <span>{s.plantNom||'—'}</span><span style={{ color:'#CBD5E1' }}>›</span>
                <span style={{ color:'#4338CA' }}>{s.nom}</span>
              </div>
              <div style={{ display:'flex', gap:8 }}>
                <button className="nav-btn ib"
                  onClick={() => navigate(`/admin/projets?segmentId=${s.id}&segmentNom=${encodeURIComponent(s.nom)}`)}
                  style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:5, padding:'8px 0', borderRadius:15, border:'none', background:'#DDD6FE', color:'#5B21B6', fontSize:'.78rem', fontWeight:700, cursor:'pointer' }}>
                  {t('segments.projects')} {IC.arrow}
                </button>
                <button className="ib" onClick={() => setModal(s)}
                  style={{ width:36, display:'flex', alignItems:'center', justifyContent:'center', padding:'8px', borderRadius:15, border:'none', background:'#A7F3D0', color:'#065F46', cursor:'pointer' }}>{IC.edit}</button>
                <button className="ib" onClick={() => del(s)}
                  style={{ width:36, display:'flex', alignItems:'center', justifyContent:'center', padding:'8px', borderRadius:15, border:'none', background:'#FECACA', color:'#991B1B', cursor:'pointer' }}>{IC.trash}</button>
              </div>
            </div>
          ))}
          {!filtered.length && (
            <div style={{ gridColumn:'1/-1', textAlign:'center', padding:'3.5rem', color:'#94A3B8' }}>
              <div style={{ fontSize:'2.5rem' }}>🗂</div>
              <p style={{ fontWeight:600 }}>{t('segments.notFound')}</p>
            </div>
          )}
        </div>
      )}
      {modal !== null && <Modal segment={modal?.id ? modal : null} plants={plants} onClose={() => setModal(null)} onSave={saved} />}
    </div>
  );
}