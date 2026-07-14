import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { adminAPI } from '../../services/api';

const IC = {
  plus:   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  edit:   <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  trash:  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>,
  search: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  close:  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  toggle: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/></svg>,
};

const ACCENT = '#4B5563';

function Modal({ serie, projets, onClose, onSave }) {
  const { t } = useTranslation();
  const isEdit = !!serie?.id;
  const [form, setForm] = useState({
    nom:           serie?.nom           || '',
    description:   serie?.description   || '',
    code:          serie?.code          || '',
    domaine:       serie?.domaine       || '',
    familleCablage:serie?.familleCablage || '',
    projetId:      serie?.projetId      ? String(serie.projetId) : '',
  });
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState('');

  const save = async () => {
    if (!form.nom.trim() || !form.projetId) { setError(t('series.modal.errors.nameAndProjectRequired')); return; }
    setSaving(true); setError('');
    try {
      const payload = { ...form, projetId: parseInt(form.projetId) };
      isEdit ? await adminAPI.updateSerie(serie.id, payload) : await adminAPI.createSerie(payload);
      onSave();
    } catch (e) {
      const data = e.response?.data;
      setError(data?.message ?? data?.error ?? (typeof data === 'string' ? data : null) ?? t('common.error'));
    } finally { setSaving(false); }
  };

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(11,30,61,.45)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, backdropFilter:'blur(4px)' }}>
      <div style={{ background:'#fff', borderRadius:18, width:'100%', maxWidth:480, overflow:'hidden', boxShadow:'0 24px 64px rgba(0,0,0,.18)' }}>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        <div style={{ background:ACCENT, padding:'1.4rem 1.75rem', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <p style={{ margin:0, fontSize:'.92rem', fontWeight:800, color:'#fff' }}>{isEdit ? t('series.modal.editTitle') : t('series.modal.createTitle')}</p>
          <button onClick={onClose} style={{ background:'rgba(255,255,255,.15)', border:'none', borderRadius:8, width:32, height:32, display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', cursor:'pointer' }}>{IC.close}</button>
        </div>
        <div style={{ padding:'1.75rem' }}>
          {error && <div style={{ background:'#FEF2F2', border:'1px solid #FECACA', borderRadius:10, padding:'9px 13px', marginBottom:14, fontSize:'.8rem', color:'#B91C1C', fontWeight:600 }}>⚠ {error}</div>}

          {[
            { key:'nom',            label:`${t('series.fields.name')} *`, placeholder:t('series.fields.namePlaceholder') },
            { key:'code',           label:t('series.fields.code'),         placeholder:t('series.fields.codePlaceholder') },
            { key:'familleCablage', label:t('series.fields.cableFamily'),  placeholder:t('series.fields.cableFamilyPlaceholder') },
          ].map(f => (
            <div key={f.key} style={{ marginBottom:'1rem' }}>
              <label style={{ display:'block', fontSize:'.75rem', fontWeight:700, color:'#374151', marginBottom:5, textTransform:'uppercase', letterSpacing:'.06em' }}>{f.label}</label>
              <input type="text" value={form[f.key]} placeholder={f.placeholder}
                onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                style={{ width:'100%', padding:'10px 13px', borderRadius:10, border:'1.5px solid #E2E8F0', fontSize:'.88rem', outline:'none', boxSizing:'border-box' }}
                onFocus={e => { e.target.style.borderColor=ACCENT; e.target.style.boxShadow=`0 0 0 3px rgba(75,85,99,.1)`; }}
                onBlur={e =>  { e.target.style.borderColor='#E2E8F0'; e.target.style.boxShadow='none'; }}
              />
            </div>
          ))}

          <div style={{ marginBottom:'1rem' }}>
            <label style={{ display:'block', fontSize:'.75rem', fontWeight:700, color:'#374151', marginBottom:5, textTransform:'uppercase', letterSpacing:'.06em' }}>{t('series.fields.project')} *</label>
            <select value={form.projetId} onChange={e => setForm(p => ({ ...p, projetId: e.target.value }))}
              style={{ width:'100%', padding:'10px 13px', borderRadius:10, border:'1.5px solid #E2E8F0', fontSize:'.88rem', outline:'none', background:'#fff', boxSizing:'border-box' }}>
              <option value="">{t('series.fields.projectDefault')}</option>
              {projets.map(p => <option key={p.id} value={p.id}>{p.nom}{p.segmentNom ? ` (${p.segmentNom})` : ''}</option>)}
            </select>
          </div>

          <div style={{ marginBottom:'1rem' }}>
            <label style={{ display:'block', fontSize:'.75rem', fontWeight:700, color:'#374151', marginBottom:5, textTransform:'uppercase', letterSpacing:'.06em' }}>{t('series.fields.domain')}</label>
            <select value={form.domaine} onChange={e => setForm(p => ({ ...p, domaine: e.target.value }))}
              style={{ width:'100%', padding:'10px 13px', borderRadius:10, border:'1.5px solid #E2E8F0', fontSize:'.88rem', outline:'none', background:'#fff', boxSizing:'border-box' }}>
              <option value="">{t('series.fields.domainDefault')}</option>
              {['VW','BMW','PSA','FCA','MB','RENAULT','STELLANTIS','FORD','AUTRE'].map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>

          <div style={{ marginBottom:'1rem' }}>
            <label style={{ display:'block', fontSize:'.75rem', fontWeight:700, color:'#374151', marginBottom:5, textTransform:'uppercase', letterSpacing:'.06em' }}>
              {t('series.fields.description')} <span style={{ color:'#94A3B8', fontWeight:400, textTransform:'none' }}>{t('common.optional')}</span>
            </label>
            <textarea value={form.description} placeholder={t('series.fields.descriptionPlaceholder')} rows={2}
              onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
              style={{ width:'100%', padding:'10px 13px', borderRadius:10, border:'1.5px solid #E2E8F0', fontSize:'.88rem', outline:'none', resize:'vertical', boxSizing:'border-box', fontFamily:'inherit' }}
              onFocus={e => e.target.style.borderColor=ACCENT}
              onBlur={e =>  e.target.style.borderColor='#E2E8F0'}
            />
          </div>

          <div style={{ display:'flex', gap:9, justifyContent:'flex-end', marginTop:'1.4rem' }}>
            <button onClick={onClose} style={{ padding:'9px 20px', borderRadius:10, border:'1.5px solid #E2E8F0', background:'#F8FAFC', color:'#374151', fontWeight:600, fontSize:'.85rem', cursor:'pointer' }}>{t('common.cancel')}</button>
            <button onClick={save} disabled={saving} style={{ padding:'9px 22px', borderRadius:10, border:'none', background:ACCENT, color:'#fff', fontWeight:700, fontSize:'.85rem', cursor:saving?'not-allowed':'pointer', opacity:saving?0.7:1, display:'flex', alignItems:'center', gap:7 }}>
              {saving && <span style={{ width:12, height:12, border:'2px solid rgba(255,255,255,.3)', borderTopColor:'#fff', borderRadius:'50%', display:'inline-block', animation:'spin .7s linear infinite' }}/>}
              {saving ? t('common.inProgress') : isEdit ? t('common.save') : t('common.create')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminSeries() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const projetIdParam  = searchParams.get('projetId');
  const projetNomParam = searchParams.get('projetNom');

  const [series,       setSeries]       = useState([]);
  const [projets,      setProjets]      = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [modal,        setModal]        = useState(null);
  const [search,       setSearch]       = useState('');
  const [filterProjet, setFilterProjet] = useState(projetIdParam || '');
  const [filtre,       setFiltre]       = useState('tous');
  const [toast,        setToast]        = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([adminAPI.getSeries(), adminAPI.getProjets()])
      .then(([s, p]) => { setSeries(s.data); setProjets(p.data); })
      .catch(() => { setSeries([]); setProjets([]); })
      .finally(() => setLoading(false));
  }, []);
  useEffect(() => { load(); }, [load]);

  const toast$ = (msg, ok = true) => { setToast({ msg, ok }); setTimeout(() => setToast(null), 3000); };

  const del = async serie => {
    if (!window.confirm(t('series.toast.confirmDelete', { name: serie.nom }))) return;
    try { await adminAPI.deleteSerie(serie.id); load(); toast$(`"${serie.nom}" ${t('series.toast.deleted')}`); }
    catch { toast$(t('series.toast.deleteError'), false); }
  };

  const toggle = async serie => {
    try {
      await adminAPI.toggleSerie(serie.id); load();
      toast$(serie.actif ? t('series.toast.deactivated') : t('series.toast.activated'));
    } catch { toast$(t('series.toast.toggleError'), false); }
  };

  const saved = () => {
    setModal(null); load();
    toast$(modal?.id ? t('series.toast.updated') : t('series.toast.created'));
  };

  const filtered = series.filter(s => {
    const matchSearch  = !search || s.nom?.toLowerCase().includes(search.toLowerCase()) || s.code?.toLowerCase().includes(search.toLowerCase());
    const matchProjet  = !filterProjet || String(s.projetId) === String(filterProjet);
    const matchFiltre  = filtre === 'tous' || (filtre === 'actifs' && s.actif) || (filtre === 'inactifs' && !s.actif);
    return matchSearch && matchProjet && matchFiltre;
  });

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'1.4rem' }}>
      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes up{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
        @keyframes tin{from{opacity:0;transform:translateX(16px)}to{opacity:1;transform:translateX(0)}}
        .sc{transition:transform .18s,box-shadow .18s}.sc:hover{transform:translateY(-3px)!important;box-shadow:0 8px 22px rgba(0,0,0,.1)!important}
        .ib{transition:opacity .14s}.ib:hover{opacity:.8}
        .fb{transition:all .15s}
      `}</style>

      {toast && (
        <div style={{ position:'fixed', top:22, right:22, zIndex:2000, background:toast.ok?'#0B1E3D':'#FEF2F2', color:toast.ok?'#fff':'#B91C1C', padding:'11px 18px', borderRadius:12, fontSize:'.83rem', fontWeight:700, animation:'tin .25s ease', display:'flex', alignItems:'center', gap:8 }}>
          {toast.ok ? '✓' : '⚠'} {toast.msg}
        </div>
      )}

      {/* Toolbar */}
      <div style={{ display:'flex', alignItems:'center', gap:10, flexWrap:'wrap' }}>
        <div style={{ position:'relative', flex:1, minWidth:200 }}>
          <span style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'#94A3B8' }}>{IC.search}</span>
          <input type="text"
            placeholder={projetNomParam ? `${t('series.search.placeholder').replace('…','')} ${projetNomParam}…` : t('series.search.placeholder')}
            value={search} onChange={e => setSearch(e.target.value)}
            style={{ width:'100%', padding:'10px 13px 10px 38px', borderRadius:12, border:'1px solid #D1D5DB', fontSize:'.86rem', outline:'none', boxSizing:'border-box', background:'#fff' }}
            onFocus={e => e.target.style.borderColor='#6B7280'} onBlur={e => e.target.style.borderColor='#D1D5DB'}
          />
          {search && <button onClick={() => setSearch('')} style={{ position:'absolute', right:10, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', color:'#94A3B8', cursor:'pointer' }}>{IC.close}</button>}
        </div>

        <select value={filterProjet} onChange={e => setFilterProjet(e.target.value)}
          style={{ padding:'10px 13px', borderRadius:12, border:'1px solid #D1D5DB', fontSize:'.84rem', outline:'none', background:'#fff', color:'#374151', cursor:'pointer' }}>
         <option value="">{t('filtrage.projects')}</option>
          {projets.map(p => <option key={p.id} value={p.id}>{p.nom}</option>)}
        </select>

        {[
          { key:'tous',     label:t('series.filters.all') },
          { key:'actifs',   label:t('series.filters.active') },
          { key:'inactifs', label:t('series.filters.inactive') },
        ].map(f => (
          <button key={f.key} className="fb" onClick={() => setFiltre(f.key)}
            style={{ padding:'8px 14px', borderRadius:10, border:'1.5px solid #E2E8F0', background:filtre===f.key?ACCENT:'#fff', color:filtre===f.key?'#fff':'#374151', fontSize:'.8rem', fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>
            {f.label}
          </button>
        ))}

        <span style={{ fontSize:'.82rem', color:'#94A3B8', fontWeight:600, whiteSpace:'nowrap' }}>
          {filtered.length} {filtered.length !== 1 ? t('series.newButton').toLowerCase().replace('nouvelle ','') : t('series.newButton').toLowerCase().replace('nouvelle ','')}
        </span>

        <button onClick={() => setModal(projetIdParam ? { projetId: parseInt(projetIdParam) } : {})}
          style={{ display:'flex', alignItems:'center', gap:7, background:ACCENT, color:'#fff', border:'none', borderRadius:12, padding:'10px 20px', fontWeight:700, fontSize:'.85rem', cursor:'pointer', whiteSpace:'nowrap' }}>
          {IC.plus} {t('series.newButton')}
        </button>
      </div>

      {loading ? (
        <div style={{ display:'flex', alignItems:'center', justifyContent:'center', padding:'3.5rem', gap:12, color:'#94A3B8' }}>
          <span style={{ width:26, height:26, border:'3px solid #E2E8F0', borderTopColor:ACCENT, borderRadius:'50%', animation:'spin .8s linear infinite', display:'inline-block' }}/> {t('common.loading')}
        </div>
      ) : (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'1rem' }}>
          {filtered.map((serie, i) => (
            <div key={serie.id} className="sc" style={{ background:'#fff', borderRadius:18, boxShadow:'0 2px 16px rgba(0,0,0,.07)', border:'1px solid #D1D5DB', animation:`up .4s ${i*.05}s ease both`, padding:'1.4rem' }}>
              <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:'1rem' }}>
                <div style={{ width:48, height:48, borderRadius:14, background:`linear-gradient(135deg,${ACCENT},#9CA3AF)`, color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.2rem', fontWeight:900 }}>
                  {serie.nom?.[0]?.toUpperCase()}
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <p style={{ margin:0, fontWeight:800, fontSize:'.92rem', color:'#0B1E3D', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{serie.nom}</p>
                  {serie.code && <p style={{ margin:'2px 0 0', fontSize:'.72rem', color:'#94A3B8', fontFamily:'monospace' }}>{serie.code}</p>}
                </div>
                <span style={{ padding:'3px 10px', borderRadius:12, fontSize:'.7rem', fontWeight:700, background:serie.actif?'#dcfce7':'#f3f4f6', color:serie.actif?'#15803d':'#6b7280', whiteSpace:'nowrap' }}>
                  {serie.actif ? t('series.status.active') : t('series.status.inactive')}
                </span>
              </div>

              <div style={{ display:'flex', alignItems:'center', gap:4, background:'#F8FAFC', borderRadius:8, padding:'6px 10px', marginBottom:'1rem', fontSize:'.72rem', color:'#64748b', fontWeight:600, flexWrap:'wrap' }}>
                <span>{serie.siteNom||'—'}</span><span style={{ color:'#CBD5E1' }}>›</span>
                <span>{serie.plantNom||'—'}</span><span style={{ color:'#CBD5E1' }}>›</span>
                <span>{serie.segmentNom||'—'}</span><span style={{ color:'#CBD5E1' }}>›</span>
                <span>{serie.projetNom||'—'}</span><span style={{ color:'#CBD5E1' }}>›</span>
                <span style={{ color:ACCENT }}>{serie.nom}</span>
              </div>

              <div style={{ display:'flex', gap:6, marginBottom:'.8rem', flexWrap:'wrap' }}>
                {serie.domaine && <span style={{ background:'#e0e7ff', color:'#3730a3', padding:'2px 8px', borderRadius:4, fontSize:'.7rem', fontWeight:700 }}>{serie.domaine}</span>}
                {serie.familleCablage && <span style={{ background:'#f1f5f9', color:'#475569', padding:'2px 8px', borderRadius:4, fontSize:'.7rem' }}>{serie.familleCablage}</span>}
              </div>

              <p style={{ margin:'0 0 1rem', fontSize:'.78rem', lineHeight:1.55, minHeight:'2.4rem' }}>
                {serie.description
                  ? <span style={{ color:'#64748b' }}>{serie.description}</span>
                  : <span style={{ color:'#CBD5E1', fontStyle:'italic' }}>{t('common.noDescription')}</span>}
              </p>

              <div style={{ display:'flex', gap:8 }}>
                <button className="ib" onClick={() => setModal(serie)}
                  style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:5, padding:'8px 0', borderRadius:15, border:'none', background:'#CBD5E1', color:'#1E293B', fontSize:'.78rem', fontWeight:700, cursor:'pointer' }}>
                  {IC.edit} {t('series.actions.edit')}
                </button>
                <button className="ib" onClick={() => toggle(serie)}
                  style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:5, padding:'8px 0', borderRadius:15, border:'none', background:serie.actif?'#FEF3C7':'#D1FAE5', color:serie.actif?'#92400E':'#065F46', fontSize:'.78rem', fontWeight:700, cursor:'pointer' }}>
                  {IC.toggle} {serie.actif ? t('series.actions.deactivate') : t('series.actions.activate')}
                </button>
                <button className="ib" onClick={() => del(serie)}
                  style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:5, padding:'8px 0', borderRadius:15, border:'none', background:'#FECACA', color:'#991B1B', fontSize:'.78rem', fontWeight:700, cursor:'pointer' }}>
                  {IC.trash} {t('series.actions.delete')}
                </button>
              </div>
            </div>
          ))}

          {!filtered.length && !loading && (
            <div style={{ gridColumn:'1/-1', textAlign:'center', padding:'3.5rem', color:'#94A3B8' }}>
              <p style={{ fontWeight:600 }}>{t('series.notFound')}</p>
              <p style={{ fontSize:'.83rem' }}>
                {search ? t('series.notFoundSearch') : filtre !== 'tous' ? `${t('series.notFound')}.` : t('series.notFoundCreate')}
              </p>
            </div>
          )}
        </div>
      )}

      {modal !== null && (
        <Modal serie={modal?.id ? modal : null} projets={projets} onClose={() => setModal(null)} onSave={saved} />
      )}
    </div>
  );
}