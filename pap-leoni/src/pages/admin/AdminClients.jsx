// ═══════════════════════════════════════════════════════════════════════
// AdminClients.jsx — v3 CORRIGÉE
// • Groupes corrects : VW, BMW, MS, Stellantis, Ford, Jaguar Land Rover, OEM Supplier
// • Marques correctes : 22 vraies marques
// • Suppression de MH, MN, MEB-Autark, RBA
// ═══════════════════════════════════════════════════════════════════════
import { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import LogoImage from '../../components/common/LogoImage';

const IC = {
  plus:   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  edit:   <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  trash:  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6M9 6V4h6v2"/></svg>,
  search: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  close:  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  tag:    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>,
  check:  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>,
  init:   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.49"/></svg>,
  reset:  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>,
};

const FLAGS = {
  'Allemagne':'🇩🇪','France':'🇫🇷','Italie':'🇮🇹','Tchéquie':'🇨🇿',
  'États-Unis':'🇺🇸','Royaume-Uni':'🇬🇧','Tunisie':'🇹🇳','International':'🌐','Suède':'🇸🇪',
};

// ── Liaisons par défaut client → marques (CORRIGÉES) ───
const LIAISONS_DEFAUT = {
  'VW':           ['Volkswagen', 'Audi', 'Porsche', 'Bentley', 'Lamborghini', 'Skoda'],
  'BMW':          ['BMW', 'Mini', 'Rolls-Royce'],
  'MS':           ['Mercedes', 'Smart'],
  'Stellantis':   ['Peugeot', 'Citroën', 'Fiat', 'Alfa Romeo', 'Jeep'],
  'Ford':         ['Ford', 'Lincoln'],
  'Jaguar Land Rover': ['Jaguar', 'Land Rover'],
  'OEM Supplier': [],
};

const LS_KEY = 'pap_client_membres';
const loadMembres = () => { try { return JSON.parse(localStorage.getItem(LS_KEY)||'{}'); } catch { return {}; } };
const saveMembres = (m) => localStorage.setItem(LS_KEY, JSON.stringify(m));

/** Après init backend, construit le localStorage à partir des IDs réels */
function buildDefaultMembres(groupes, marques) {
  const marqueByNom = {};
  marques.forEach(m => { marqueByNom[m.nom] = m; });
  const result = {};
  groupes.forEach(g => {
    const nomsMarques = LIAISONS_DEFAUT[g.nom] || [];
    result[g.id] = nomsMarques
      .map(n => marqueByNom[n]?.id)
      .filter(Boolean);
  });
  return result;
}

/* ══════════════════════════════════════════════════════════════════════
   PANEL MARQUES
══════════════════════════════════════════════════════════════════════ */
function PanelMarques({ groupe, toutesMarques, onClose }) {
  const [membres, setMembres] = useState([]);
  const [search,  setSearch]  = useState('');
  const [saving,  setSaving]  = useState(null);

  useEffect(() => {
    const ids = new Set((loadMembres()[groupe.id] || []).map(Number));
    setMembres(toutesMarques.filter(m => ids.has(m.id)));
  }, [groupe.id, toutesMarques]);

  const membresIds = new Set(membres.map(m => m.id));

  const toggle = (marque) => {
    setSaving(marque.id);
    const all = loadMembres();
    const ids = new Set((all[groupe.id] || []).map(Number));
    if (ids.has(marque.id)) ids.delete(marque.id); else ids.add(marque.id);
    all[groupe.id] = [...ids];
    saveMembres(all);
    setMembres(toutesMarques.filter(m => ids.has(m.id)));
    setTimeout(() => setSaving(null), 300);
  };

  const filtered   = toutesMarques.filter(m =>
    !search || m.nom.toLowerCase().includes(search.toLowerCase()) ||
    (m.code||'').toLowerCase().includes(search.toLowerCase())
  );
  const liees      = filtered.filter(m =>  membresIds.has(m.id));
  const nonLiees   = filtered.filter(m => !membresIds.has(m.id));
  const couleur    = groupe.couleur || '#0B1E3D';

  const RowM = ({ m, estLiee, idx }) => (
    <div onClick={() => toggle(m)}
      style={{ display:'flex',alignItems:'center',gap:10,padding:'10px 12px',borderRadius:12,cursor:'pointer',
        background:estLiee?'#F0FDF4':'#fff', border:`1.5px solid ${estLiee?'#A7F3D0':'#E8EDF7'}`,
        transition:'all .15s', animation:`fadeUp .2s ${idx*.04}s ease both`, opacity:0 }}
      onMouseEnter={e=>e.currentTarget.style.background=estLiee?'#DCFCE7':'#F8FAFC'}
      onMouseLeave={e=>e.currentTarget.style.background=estLiee?'#F0FDF4':'#fff'}>
      <div style={{ width:4,height:36,borderRadius:99,background:m.couleur||'#E2E8F0',flexShrink:0 }} />
      <LogoImage type="client" nom={m.nom} code={m.code} size={38} radius={9} />
      <div style={{ flex:1,minWidth:0 }}>
        <div style={{ fontWeight:800,fontSize:'.85rem',color:estLiee?'#065F46':'#374151' }}>{m.nom}</div>
        <div style={{ fontSize:'.7rem',color:'#94A3B8' }}>{FLAGS[m.paysOrigine]||'🌍'} {m.paysOrigine||'—'} · {m.code||'—'}</div>
      </div>
      {saving===m.id
        ? <span style={{ width:18,height:18,border:'2.5px solid #E2E8F0',borderTopColor:estLiee?'#059669':'#0B1E3D',borderRadius:'50%',display:'inline-block',animation:'spin .7s linear infinite',flexShrink:0 }} />
        : estLiee
          ? <div style={{ width:26,height:26,borderRadius:7,background:'#059669',display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',flexShrink:0 }}>{IC.check}</div>
          : <div style={{ width:26,height:26,borderRadius:7,background:'#F1F5F9',border:'1.5px dashed #CBD5E1',display:'flex',alignItems:'center',justifyContent:'center',color:'#CBD5E1',flexShrink:0 }}>{IC.plus}</div>
      }
    </div>
  );

  return (
    <>
      <div onClick={onClose} style={{ position:'fixed',inset:0,background:'rgba(11,30,61,.32)',zIndex:900,backdropFilter:'blur(3px)' }} />
      <div style={{ position:'fixed',top:0,right:0,bottom:0,width:440,background:'#fff',zIndex:901,
        boxShadow:'-12px 0 48px rgba(11,30,61,.18)',display:'flex',flexDirection:'column',
        overflow:'hidden',animation:'panelIn .28s cubic-bezier(.22,1,.36,1)' }}>
        <style>{`
          @keyframes panelIn{from{transform:translateX(100%)}to{transform:translateX(0)}}
          @keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
          @keyframes spin{to{transform:rotate(360deg)}}
        `}</style>
        <div style={{ background:`linear-gradient(135deg,${couleur},${couleur}BB)`,padding:'1.4rem',flexShrink:0 }}>
          <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:10 }}>
            <div style={{ display:'flex',alignItems:'center',gap:12 }}>
              <LogoImage type="client" nom={groupe.nom} code={groupe.code} size={48} radius={13} />
              <div>
                <div style={{ fontWeight:900,fontSize:'1.1rem',color:'#fff' }}>{groupe.nom}</div>
                <div style={{ fontSize:'.73rem',color:'rgba(255,255,255,.65)',marginTop:2 }}>
                  {FLAGS[groupe.paysOrigine]||'🌍'} {groupe.paysOrigine||'—'} · {groupe.code||'—'}
                </div>
              </div>
            </div>
            <button onClick={onClose} style={{ background:'rgba(255,255,255,.18)',border:'none',borderRadius:10,
              width:34,height:34,display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',cursor:'pointer' }}>
              {IC.close}
            </button>
          </div>
          {membres.length > 0 && (
            <div style={{ display:'flex',gap:6,flexWrap:'wrap',marginTop:6 }}>
              {membres.map(m => (
                <div key={m.id} style={{ background:'rgba(255,255,255,.15)',borderRadius:8,padding:'3px 6px',
                  display:'flex',alignItems:'center',gap:5 }}>
                  <LogoImage type="client" nom={m.nom} code={m.code} size={22} radius={5} />
                  <span style={{ fontSize:'.68rem',color:'#fff',fontWeight:700 }}>{m.nom}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ flex:1,overflowY:'auto',padding:'1.2rem' }}>
          <div style={{ position:'relative',marginBottom:'1rem' }}>
            <span style={{ position:'absolute',left:11,top:'50%',transform:'translateY(-50%)',color:'#94A3B8' }}>{IC.search}</span>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Rechercher une marque…"
              style={{ width:'100%',padding:'9px 13px 9px 36px',borderRadius:11,border:'1.5px solid #E2E8F0',
                fontSize:'.83rem',outline:'none',boxSizing:'border-box',fontFamily:'inherit',background:'#F8FAFC' }}
              onFocus={e=>e.target.style.borderColor='#0B1E3D'}
              onBlur={e=>e.target.style.borderColor='#E2E8F0'} />
          </div>
          <div style={{ background:'#EFF6FF',border:'1px solid #BFDBFE',borderRadius:10,padding:'9px 12px',
            fontSize:'.76rem',color:'#1E40AF',marginBottom:'1rem',lineHeight:1.6 }}>
            💡 Cliquez pour associer ou dissocier une marque à <strong>{groupe.nom}</strong>.
          </div>
          {liees.length > 0 && (
            <div style={{ marginBottom:'1.4rem' }}>
              <div style={{ fontSize:'.68rem',fontWeight:700,color:'#059669',textTransform:'uppercase',letterSpacing:'.08em',marginBottom:7 }}>
                ● Marques associées ({liees.length})
              </div>
              <div style={{ display:'flex',flexDirection:'column',gap:6 }}>
                {liees.map((m,i) => <RowM key={m.id} m={m} estLiee idx={i} />)}
              </div>
            </div>
          )}
          {nonLiees.length > 0 && (
            <div>
              <div style={{ fontSize:'.68rem',fontWeight:700,color:'#9CA3AF',textTransform:'uppercase',letterSpacing:'.08em',marginBottom:7 }}>
                ○ Autres marques ({nonLiees.length})
              </div>
              <div style={{ display:'flex',flexDirection:'column',gap:6 }}>
                {nonLiees.map((m,i) => <RowM key={m.id} m={m} estLiee={false} idx={i} />)}
              </div>
            </div>
          )}
          {filtered.length === 0 && (
            <div style={{ textAlign:'center',padding:'2rem',color:'#94A3B8',fontSize:'.84rem' }}>Aucune marque trouvée</div>
          )}
        </div>
      </div>
    </>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   MODAL
══════════════════════════════════════════════════════════════════════ */
function Field({ label, fieldKey, placeholder, required, form, set }) {
  return (
    <div style={{ marginBottom:14 }}>
      <label style={{ display:'block',fontSize:'.71rem',fontWeight:700,color:'#374151',marginBottom:5,
        textTransform:'uppercase',letterSpacing:'.06em' }}>
        {label}{required && <span style={{ color:'#C0392B',marginLeft:2 }}>*</span>}
      </label>
      <input value={form[fieldKey]||''} placeholder={placeholder} onChange={e=>set(fieldKey,e.target.value)}
        style={{ width:'100%',padding:'10px 13px',borderRadius:10,border:'1.5px solid #E2E8F0',fontSize:'.87rem',
          outline:'none',boxSizing:'border-box',fontFamily:'inherit',background:'#FAFBFD',color:'#0B1E3D' }}
        onFocus={e=>{e.target.style.borderColor='#0B1E3D';e.target.style.boxShadow='0 0 0 3px rgba(11,30,61,.07)';}}
        onBlur={e=>{e.target.style.borderColor='#E2E8F0';e.target.style.boxShadow='none';}} />
    </div>
  );
}

function Modal({ client, onClose, onSave }) {
  const isEdit = !!client?.id;
  const [form, setForm] = useState({
    nom:         client?.nom         || '',
    code:        client?.code        || '',
    couleur:     client?.couleur     || '#1C69D4',
    paysOrigine: client?.paysOrigine || '',
    description: client?.description || '',
    actif:       client?.actif !== false,
    estGroupe:   client?.estGroupe   ?? true,
  });
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState('');
  const set = useCallback((k,v) => setForm(p=>({...p,[k]:v})), []);

  const save = async () => {
    if (!form.nom.trim()) { setError('Le nom est obligatoire.'); return; }
    setSaving(true); setError('');
    try {
      const payload = { ...form, nom:form.nom.trim(), code:(form.code||'').toUpperCase().trim() };
      isEdit ? await api.put(`/clients/${client.id}`, payload)
             : await api.post('/clients', payload);
      onSave();
    } catch(e) { setError(e.response?.data?.message || 'Erreur de sauvegarde.'); }
    setSaving(false);
  };

  return (
    <div style={{ position:'fixed',inset:0,background:'rgba(11,30,61,.5)',display:'flex',alignItems:'center',
      justifyContent:'center',zIndex:1000,backdropFilter:'blur(4px)' }}>
      <style>{`@keyframes slideUp{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:translateY(0)}}
               @keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ background:'#fff',borderRadius:20,width:'100%',maxWidth:500,overflow:'hidden',
        boxShadow:'0 24px 64px rgba(0,0,0,.22)',animation:'slideUp .22s ease' }}>
        <div style={{ background:'#0B1E3D',padding:'1.25rem 1.5rem',display:'flex',alignItems:'center',justifyContent:'space-between' }}>
          <div>
            <p style={{ margin:0,fontSize:'.9rem',fontWeight:800,color:'#fff' }}>
              {isEdit ? 'Modifier le client' : 'Nouveau client'}
            </p>
            <p style={{ margin:0,fontSize:'.71rem',color:'rgba(255,255,255,.4)' }}>
              {form.estGroupe ? 'Groupe/client principal' : 'Marque automobile'}
            </p>
          </div>
          <button onClick={onClose} style={{ background:'rgba(255,255,255,.1)',border:'none',borderRadius:8,
            width:32,height:32,display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',cursor:'pointer' }}>
            {IC.close}
          </button>
        </div>
        <div style={{ padding:'1.4rem 1.5rem',maxHeight:'72vh',overflowY:'auto' }}>
          {error && (
            <div style={{ background:'#FEF2F2',border:'1px solid rgba(192,57,43,.3)',borderRadius:10,
              padding:'9px 13px',marginBottom:14,fontSize:'.8rem',color:'#B91C1C',fontWeight:600 }}>
              ⚠ {error}
            </div>
          )}
          <div style={{ display:'grid',gridTemplateColumns:'2fr 1fr',gap:'0 14px' }}>
            <Field label="Nom" fieldKey="nom" placeholder="BMW…" required form={form} set={set} />
            <Field label="Code" fieldKey="code" placeholder="BMW" form={form} set={set} />
          </div>
          <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0 14px' }}>
            <Field label="Pays" fieldKey="paysOrigine" placeholder="Allemagne…" form={form} set={set} />
            <div style={{ marginBottom:14 }}>
              <label style={{ display:'block',fontSize:'.71rem',fontWeight:700,color:'#374151',marginBottom:5,
                textTransform:'uppercase',letterSpacing:'.06em' }}>Couleur</label>
              <div style={{ display:'flex',alignItems:'center',gap:8 }}>
                <input type="color" value={form.couleur} onChange={e=>set('couleur',e.target.value)}
                  style={{ width:38,height:38,borderRadius:8,border:'1.5px solid #E2E8F0',cursor:'pointer',padding:2,boxSizing:'border-box' }} />
                <input value={form.couleur} onChange={e=>set('couleur',e.target.value)}
                  style={{ flex:1,padding:'10px',borderRadius:10,border:'1.5px solid #E2E8F0',
                    fontSize:'.82rem',fontFamily:'monospace',outline:'none',background:'#FAFBFD' }} />
              </div>
            </div>
          </div>
          <Field label="Description" fieldKey="description" placeholder="Description…" form={form} set={set} />
          <div style={{ display:'flex',gap:16,marginBottom:14 }}>
            <label style={{ display:'flex',alignItems:'center',gap:8,cursor:'pointer',fontSize:'.84rem',color:'#374151',fontWeight:600 }}>
              <input type="checkbox" checked={form.actif} onChange={e=>set('actif',e.target.checked)}
                style={{ width:16,height:16,accentColor:'#0B1E3D' }} />
              Actif
            </label>
            {!isEdit && (
              <label style={{ display:'flex',alignItems:'center',gap:8,cursor:'pointer',fontSize:'.84rem',color:'#374151',fontWeight:600 }}>
                <input type="checkbox" checked={form.estGroupe} onChange={e=>set('estGroupe',e.target.checked)}
                  style={{ width:16,height:16,accentColor:'#0B1E3D' }} />
                Est un client/groupe
              </label>
            )}
          </div>
          <div style={{ display:'flex',gap:9,justifyContent:'flex-end',marginTop:'1.3rem' }}>
            <button onClick={onClose}
              style={{ padding:'9px 20px',borderRadius:10,border:'1.5px solid #E2E8F0',background:'#F8FAFC',
                color:'#374151',fontWeight:600,fontSize:'.85rem',cursor:'pointer',fontFamily:'inherit' }}>
              Annuler
            </button>
            <button onClick={save} disabled={saving}
              style={{ padding:'9px 22px',borderRadius:10,border:'none',background:'#0B1E3D',color:'#fff',
                fontWeight:700,fontSize:'.85rem',cursor:saving?'not-allowed':'pointer',opacity:saving?.7:1,
                display:'flex',alignItems:'center',gap:7,fontFamily:'inherit' }}>
              {saving && <span style={{ width:12,height:12,border:'2px solid rgba(255,255,255,.3)',
                borderTopColor:'#fff',borderRadius:'50%',display:'inline-block',animation:'spin .7s linear infinite' }} />}
              {saving?'Enregistrement…':isEdit?'Enregistrer':'Créer'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   PAGE PRINCIPALE
══════════════════════════════════════════════════════════════════════ */
export default function AdminClients() {
  const [groupes,     setGroupes]     = useState([]);
  const [marques,     setMarques]     = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [modal,       setModal]       = useState(null);
  const [panelGroupe, setPanelGroupe] = useState(null);
  const [search,      setSearch]      = useState('');
  const [filtre,      setFiltre]      = useState('tous');
  const [toast,       setToast]       = useState(null);
  const [initLoading, setInitLoading] = useState(false);
  const [membres,     setMembres]     = useState(loadMembres);

  const nbMarques = (gid) => (membres[gid] || []).length;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [rg, rm] = await Promise.all([
        api.get('/clients'),
        api.get('/clients/marques'),
      ]);
      const g = Array.isArray(rg.data) ? rg.data.filter(client => client.estGroupe) : [];
      const m = Array.isArray(rm.data) ? rm.data : [];
      setGroupes(g);
      setMarques(m);
      return { groupes: g, marques: m };
    } catch {
      setGroupes([]); setMarques([]);
      return { groupes: [], marques: [] };
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const showToast = (msg, ok=true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3200);
  };

  const supprimer = async (g) => {
    if (!window.confirm(`Supprimer "${g.nom}" ?`)) return;
    try {
      await api.delete(`/clients/${g.id}`);
      const all = loadMembres();
      delete all[g.id];
      saveMembres(all);
      setMembres({ ...all });
      load();
      showToast(`"${g.nom}" supprimé.`);
    } catch { showToast('Erreur lors de la suppression.', false); }
  };

  const toggleActif = async (g) => {
    try {
      await api.patch(`/clients/${g.id}/toggle`);
      load();
      showToast(g.actif ? `${g.nom} désactivé.` : `${g.nom} activé.`);
    } catch { showToast('Erreur.', false); }
  };

  const groupesFiltres = groupes.filter(g => {
    const ms = !search ||
      g.nom.toLowerCase().includes(search.toLowerCase()) ||
      (g.code||'').toLowerCase().includes(search.toLowerCase());
    const mf = filtre==='tous' ||
      (filtre==='actifs'   && g.actif) ||
      (filtre==='inactifs' && !g.actif);
    return ms && mf;
  });

  const handlePanelClose = () => { setMembres(loadMembres()); setPanelGroupe(null); };

  return (
    <div style={{ display:'flex',flexDirection:'column',gap:'1.4rem' }}>
      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes cardIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
        @keyframes tin{from{opacity:0;transform:translateX(16px)}to{opacity:1;transform:translateX(0)}}
        .gc{transition:transform .18s,box-shadow .18s;}
        .gc:hover{transform:translateY(-3px)!important;box-shadow:0 8px 28px rgba(0,0,0,.14)!important;}
        .ib:hover{opacity:.82;}
      `}</style>

      {toast && (
        <div style={{ position:'fixed',top:22,right:22,zIndex:2000,
          background:toast.ok?'#0B1E3D':'#FEF2F2',color:toast.ok?'#fff':'#B91C1C',
          padding:'11px 18px',borderRadius:12,fontSize:'.83rem',fontWeight:700,
          boxShadow:'0 6px 24px rgba(0,0,0,.18)',animation:'tin .25s ease' }}>
          {toast.ok?'✓':'⚠'} {toast.msg}
        </div>
      )}

      {/* Toolbar */}
      <div style={{ display:'flex',alignItems:'center',gap:10,flexWrap:'wrap' }}>
        <div style={{ position:'relative',flex:1,minWidth:200 }}>
          <span style={{ position:'absolute',left:12,top:'50%',transform:'translateY(-50%)',color:'#94A3B8' }}>{IC.search}</span>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Rechercher un client…"
            style={{ width:'100%',padding:'10px 13px 10px 38px',borderRadius:12,border:'1px solid #CBD5E1',
              fontSize:'.86rem',outline:'none',boxSizing:'border-box',background:'#fff' }}
            onFocus={e=>e.target.style.borderColor='#6B7280'}
            onBlur={e=>e.target.style.borderColor='#CBD5E1'} />
          {search && (
            <button onClick={()=>setSearch('')}
              style={{ position:'absolute',right:10,top:'50%',transform:'translateY(-50%)',
                background:'none',border:'none',color:'#94A3B8',cursor:'pointer' }}>
              {IC.close}
            </button>
          )}
        </div>

        {[['tous','Tous'],['actifs','Actifs'],['inactifs','Inactifs']].map(([id,lbl]) => (
          <button key={id} onClick={()=>setFiltre(id)}
            style={{ padding:'8px 14px',borderRadius:10,border:'1.5px solid #CBD5E1',
              background:filtre===id?'#0B1E3D':'#fff',color:filtre===id?'#fff':'#374151',
              fontSize:'.8rem',fontWeight:700,cursor:'pointer',fontFamily:'inherit',transition:'all .15s' }}>
            {lbl}
          </button>
        ))}

        <span style={{ fontSize:'.82rem',color:'#94A3B8',fontWeight:600,whiteSpace:'nowrap' }}>
          {groupesFiltres.length} client{groupesFiltres.length>1?'s':''}
          {marques.length>0 && ` · ${marques.length} marque${marques.length>1?'s':''}`}
        </span>
        <button onClick={()=>setModal({})}
          style={{ display:'flex',alignItems:'center',gap:7,background:'#0B1E3D',color:'#fff',border:'none',
            borderRadius:12,padding:'10px 20px',fontWeight:700,fontSize:'.85rem',cursor:'pointer',
            whiteSpace:'nowrap',boxShadow:'0 4px 14px rgba(11,30,61,.25)',fontFamily:'inherit' }}>
          {IC.plus} Nouveau client
        </button>
      </div>

      {/* Grille */}
      {loading ? (
        <div style={{ display:'flex',alignItems:'center',justifyContent:'center',padding:'3.5rem',gap:12,color:'#94A3B8' }}>
          <span style={{ width:26,height:26,border:'3px solid #E2E8F0',borderTopColor:'#0B1E3D',
            borderRadius:'50%',animation:'spin .8s linear infinite',display:'inline-block' }} />
          Chargement…
        </div>
      ) : (
        <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(290px,1fr))',gap:'1rem' }}>
          {groupesFiltres.map((g, i) => {
            const nb = nbMarques(g.id);
            const couleur = g.couleur || '#0B1E3D';
            return (
              <div key={g.id} className="gc"
                style={{ background:'#fff',borderRadius:18,overflow:'hidden',
                  boxShadow:'0 2px 16px rgba(0,0,0,.07)',border:'1px solid #E8EDF7',
                  animation:`cardIn .4s ${i*.05}s ease both`,opacity:0 }}>
                <div style={{ height:5,background:`linear-gradient(90deg,${couleur},${couleur}99)` }} />
                <div style={{ padding:'1.2rem 1.3rem' }}>
                  <div style={{ display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:'1rem' }}>
                    <div style={{ display:'flex',alignItems:'center',gap:11 }}>
                      <LogoImage type="client" nom={g.nom} code={g.code} size={48} radius={13} />
                      <div>
                        <p style={{ margin:0,fontWeight:800,fontSize:'.92rem',color:'#0B1E3D' }}>{g.nom}</p>
                        <p style={{ margin:'3px 0 0',fontSize:'.73rem',color:'#94A3B8' }}>
                          {FLAGS[g.paysOrigine]||'🌍'} {g.paysOrigine||'—'}
                        </p>
                      </div>
                    </div>
                    <span style={{ background:g.actif?'#EFF6FF':'#F1F5F9',color:g.actif?'#1D4ED8':'#64748B',
                      fontSize:'.65rem',fontWeight:800,padding:'3px 9px',borderRadius:99 }}>
                      {g.actif?'Actif':'Inactif'}
                    </span>
                  </div>

                  <div style={{ marginBottom:8 }}>
                    <span style={{ background:'#EFF6FF',color:'#1D4ED8',fontSize:'.67rem',fontWeight:800,padding:'2px 8px',borderRadius:99 }}>
                      {g.code||'—'}
                    </span>
                  </div>

                  {g.description && (
                    <p style={{ margin:'0 0 10px',fontSize:'.75rem',color:'#64748B',lineHeight:1.5,
                      overflow:'hidden',display:'-webkit-box',WebkitLineClamp:2,WebkitBoxOrient:'vertical' }}>
                      {g.description}
                    </p>
                  )}

                  <button onClick={()=>setPanelGroupe(g)}
                    style={{ width:'100%',marginTop:4,padding:'9px 14px',borderRadius:11,
                      border:`1.5px solid ${nb>0?'#A7F3D0':'#CBD5E1'}`,
                      background:nb>0?'#F0FDF4':'#F8FAFC',
                      color:nb>0?'#059669':'#374151',
                      fontSize:'.78rem',fontWeight:700,cursor:'pointer',fontFamily:'inherit',
                      display:'flex',alignItems:'center',justifyContent:'center',gap:8,transition:'all .15s' }}
                    onMouseEnter={e=>e.currentTarget.style.background=nb>0?'#DCFCE7':'#EEF2FF'}
                    onMouseLeave={e=>e.currentTarget.style.background=nb>0?'#F0FDF4':'#F8FAFC'}>
                    {IC.tag}
                    {nb>0 ? `${nb} marque${nb>1?'s':''} associée${nb>1?'s':''}` : 'Associer des marques'}
                    {nb>0 && (
                      <span style={{ background:couleur,color:'#fff',borderRadius:99,padding:'1px 9px',fontSize:'.64rem',fontWeight:900 }}>{nb}</span>
                    )}
                  </button>

                  <div style={{ display:'flex',gap:8,marginTop:9 }}>
                    <button className="ib" onClick={()=>toggleActif(g)}
                      style={{ flex:1,display:'flex',alignItems:'center',justifyContent:'center',gap:5,
                        padding:'8px 0',borderRadius:15,border:'none',background:'#BFDBFE',color:'#1E40AF',
                        fontSize:'.77rem',fontWeight:700,cursor:'pointer',fontFamily:'inherit' }}>
                      {g.actif?'Désactiver':'Activer'}
                    </button>
                    <button className="ib" onClick={()=>setModal(g)}
                      style={{ width:36,display:'flex',alignItems:'center',justifyContent:'center',
                        padding:'8px',borderRadius:15,border:'none',background:'#A7F3D0',color:'#065F46',cursor:'pointer' }}>
                      {IC.edit}
                    </button>
                    <button className="ib" onClick={()=>supprimer(g)}
                      style={{ width:36,display:'flex',alignItems:'center',justifyContent:'center',
                        padding:'8px',borderRadius:15,border:'none',background:'#FECACA',color:'#991B1B',cursor:'pointer' }}>
                      {IC.trash}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
          {groupesFiltres.length===0 && (
            <div style={{ gridColumn:'1/-1',textAlign:'center',padding:'3.5rem',color:'#94A3B8' }}>
              <p style={{ fontWeight:700,color:'#5C6F8A',fontSize:'.95rem' }}>Aucun client trouvé</p>
              <p style={{ fontSize:'.82rem',marginTop:4 }}>Essayez de changer le filtre ou le texte de recherche.</p>
            </div>
          )}
        </div>
      )}

      {panelGroupe && (
        <PanelMarques groupe={panelGroupe} toutesMarques={marques} onClose={handlePanelClose} />
      )}
      {modal!==null && (
        <Modal
          client={modal?.id ? modal : null}
          onClose={()=>setModal(null)}
          onSave={()=>{ setModal(null); load(); showToast(modal?.id?'Client modifié.':'Client créé.'); }}
        />
      )}
    </div>
  );
}