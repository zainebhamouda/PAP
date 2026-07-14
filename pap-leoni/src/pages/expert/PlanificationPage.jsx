import { useState, useEffect, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useAuth, getUserPlantScope } from '../../context/AuthContext';

// ── Palette ──────────────────────────────────────────────────────
const T = {
  navy:'#002855',blue:'#003F8A',blueM:'#0057B8',gold:'#C8982A',goldP:'#b3cde2',
  g50:'#F7F9FC',g100:'#d9dde4',g200:'#DAE2EF',g300:'#BCC8DC',g400:'#8A9BBC',
  g500:'#3e71ba',g700:'#273347',g800:'#182030',
  success:'#1A7A4A',successBg:'#E6F5EE',warn:'#C8982A',warnBg:'#FFF4D6',
  danger:'#C0392B',dangerBg:'#FDECEA',info:'#0057B8',infoBg:'#E8F0FB',
};

// ── Couleurs groupes clients ──────────────────────────────────────
const CLIENT_COLORS = {
  'BMW Group':           '#1C69D4',
  'VW Group':            '#1B3A6B',
  'Mercedes-Benz Group': '#00A19C',
  'OEM Supplier':        '#6B7280',
  'MS':                  '#4A90D9',
  'MN':                  '#5BA85A',
  'MH':                  '#E8A020',
  'MEB-Autark':          '#7B5EA7',
  'RBA':                 '#D9534F',
};

const apiH   = () => ({ Authorization:`Bearer ${localStorage.getItem('token')}`,'Content-Type':'application/json' });
const multiH = () => ({ Authorization:`Bearer ${localStorage.getItem('token')}` });
const NC = {
  NON_DESTRUCTIF:  { bg:'#E8F0FB', text:'#0057B8', label:'ND' },
  DESTRUCTIF:      { bg:'#FDECEA', text:'#C0392B', label:'D'  },
  REQUALIFICATION: { bg:'#b3cde2', text:'#C8982A', label:'R'  },
};

const normalizeClientLabel = (value) => String(value || '')
  .trim()
  .toLowerCase()
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/\bgroup\b/g, '')
  .replace(/\s+/g, ' ')
  .trim();

const clientMatches = (left, right) => {
  const a = normalizeClientLabel(left);
  const b = normalizeClientLabel(right);
  if (!a || !b) return false;
  return a === b || a.includes(b) || b.includes(a);
};

const isQualifiedPassage = (passage) => {
  const statut = String(passage?.statut || '').toUpperCase();
  const statutCertificat = String(passage?.statutCertificat || '').toUpperCase();
  return ['CERTIFIE', 'REUSSI'].includes(statut)
    || ['VALIDE_CHEF', 'CERTIFIE', 'VALIDE'].includes(statutCertificat);
};

// ── Composants UI ─────────────────────────────────────────────────
function Pill({children,bg=T.g100,color=T.g700}){
  return <span style={{background:bg,color,fontSize:'.68rem',fontWeight:700,padding:'3px 9px',borderRadius:99,whiteSpace:'nowrap'}}>{children}</span>;
}
function Btn({children,onClick,disabled,variant='primary',small=false,style:ex={}}){
  const[h,sH]=useState(false);
  const b={border:'none',cursor:disabled?'not-allowed':'pointer',fontFamily:'inherit',fontWeight:700,transition:'all .2s',padding:small?'7px 16px':'11px 24px',fontSize:small?'.78rem':'.86rem',borderRadius:10,opacity:disabled?.5:1,display:'inline-flex',alignItems:'center',gap:6};
  const s={
    primary:  {background:h&&!disabled?T.blue:T.navy,color:'#fff'},
    gold:     {background:h&&!disabled?'#b8880a':T.gold,color:'#fff'},
    secondary:{background:T.g100,color:T.g700,border:`1px solid ${T.g200}`},
    danger:   {background:T.dangerBg,color:T.danger,border:'1px solid #FCA5A5'},
  };
  return <button onClick={disabled?undefined:onClick} style={{...b,...s[variant],...ex}} onMouseEnter={()=>sH(true)} onMouseLeave={()=>sH(false)} disabled={disabled}>{children}</button>;
}
function Card({children,style:ex={}}){
  return <div style={{background:'#fff',borderRadius:16,border:`1px solid ${T.g100}`,boxShadow:'0 2px 12px rgba(0,40,85,.07)',padding:'1.5rem',...ex}}>{children}</div>;
}

// ── Stepper ───────────────────────────────────────────────────────
function Stepper({step}){
  const items=[{id:1,label:'Méthode'},{id:2,label:'Contexte'},{id:3,label:'Import'},{id:4,label:'Affectation'},{id:5,label:'Succès'}];
  return (
    <div style={{width:'100%',background:'linear-gradient(135deg,#0B1E3D 0%,#1D4ED8 100%)',borderRadius:16,padding:'16px 20px',display:'flex',gap:14,alignItems:'center',justifyContent:'center',boxShadow:'0 8px 24px rgba(0,40,85,.18)'}}>
      <div style={{display:'flex',gap:14,alignItems:'center',flexWrap:'wrap'}}>
        {items.map((it,idx)=>(
          <div key={it.id} style={{display:'flex',alignItems:'center',gap:8}}>
            <div style={{width:36,height:36,borderRadius:'50%',background:step>=it.id?'#fff':'rgba(255,255,255,.2)',color:step>=it.id?T.navy:'#fff',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'.9rem',fontWeight:900}}>{it.id}</div>
            <span style={{fontSize:'.84rem',color:'#fff',fontWeight:step>=it.id?800:600,opacity:step>=it.id?1:0.65}}>{it.label}</span>
            {idx<items.length-1&&<span style={{width:22,height:2,background:'rgba(255,255,255,.35)',borderRadius:2}}/>}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Select Client enrichi ─────────────────────────────────────────
function ClientSelector({ value, onChange, clients, loading }) {
  const couleur = value ? (CLIENT_COLORS[value] || T.blueM) : null;
  return (
    <div>
      <label style={{ display:'block', fontSize:'.78rem', fontWeight:800, marginBottom:8,
        color:T.g700, textTransform:'uppercase', letterSpacing:'.04em' }}>
        Client
      </label>
      <div style={{ position:'relative' }}>
        <select
          value={value}
          onChange={e => onChange(e.target.value)}
          style={{
            width:'100%', padding:'14px 40px 14px 44px',
            border:`1.5px solid ${couleur || T.g300}`,
            borderRadius:12, fontSize:'.92rem',
            background: couleur ? `${couleur}12` : '#fff',
            color: couleur || T.g500,
            fontWeight: value ? 700 : 400,
            cursor:'pointer', fontFamily:'inherit', outline:'none',
            appearance:'none', transition:'all .2s',
          }}
        >
          <option value="">— Choisir un client —</option>
          {loading && <option disabled>Chargement…</option>}
          {clients.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        {/* Pastille couleur à gauche */}
        <div style={{
          position:'absolute', left:14, top:'50%', transform:'translateY(-50%)',
          width:18, height:18, borderRadius:'50%',
          background: couleur || T.g200,
          border:'2px solid rgba(255,255,255,.7)',
          boxShadow:'0 1px 4px rgba(0,0,0,.15)',
          transition:'background .2s',
        }} />
        {/* Chevron à droite */}
        <div style={{ position:'absolute', right:13, top:'50%', transform:'translateY(-50%)', pointerEvents:'none', color:T.g400 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </div>
      </div>
      {/* Badge confirmation */}
      {value && (
        <div style={{
          marginTop:7, padding:'6px 12px', borderRadius:8,
          background:`${couleur}14`, border:`1px solid ${couleur}38`,
          display:'flex', alignItems:'center', gap:7,
          fontSize:'.75rem', color:couleur, fontWeight:700,
        }}>
          <div style={{ width:7, height:7, borderRadius:'50%', background:couleur, flexShrink:0 }} />
          {value}
        </div>
      )}
    </div>
  );
}

/* ─── ÉTAPE 1 — Choix méthode ─────────────────────────────────── */
function EtapeChoix({onChoose}){
  const[h1,sh1]=useState(false),[h2,sh2]=useState(false);
  return (
    <div style={{width:'100%'}}>
      <div style={{display:'flex',flexDirection:'column',gap:28}}>
        <Card style={{borderTop:`4px solid ${T.gold}`,padding:'1.8rem 2rem',boxShadow:'0 8px 24px rgba(0,40,85,0.08)'}}>
          <div style={{display:'flex',alignItems:'center',gap:16,flexWrap:'wrap'}}>
            <div style={{width:48,height:48,background:T.goldP,borderRadius:12,display:'flex',alignItems:'center',justifyContent:'center'}}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                <path d="M19 4H5C3.9 4 3 4.9 3 6v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2z" stroke={T.navy} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M16 2v4M8 2v4M3 10h18" stroke={T.navy} strokeWidth="1.5" strokeLinecap="round"/>
                <circle cx="12" cy="15" r="1.5" fill={T.gold}/>
                <circle cx="16" cy="15" r="1.5" fill={T.gold}/>
                <circle cx="8" cy="15" r="1.5" fill={T.gold}/>
              </svg>
            </div>
            <div>
              <h2 style={{fontSize:'1.3rem',fontWeight:700,color:T.navy,margin:0}}>Création d'une planification d'audits produit</h2>
              <p style={{fontSize:'.91rem',color:T.g500,marginTop:6,marginBottom:0}}>Choisissez la méthode. La durée sera déterminée automatiquement depuis le fichier Excel.</p>
            </div>
          </div>
          <div style={{fontSize:'.85rem',lineHeight:1.5,color:T.g700,marginTop:14,paddingTop:14,borderTop:`1px solid ${T.g100}`}}>
            <div style={{display:'flex',alignItems:'flex-start',gap:10,marginBottom:10}}>
              <span style={{width:8,height:8,borderRadius:'50%',background:T.gold,marginTop:6,flexShrink:0}}/>
              <div><strong>Import Excel :</strong> Importez votre fichier. Le client est détecté automatiquement → durée calculée (BMW/Mercedes=12 mois, VW/Audi/autres=6 mois).</div>
            </div>
            <div style={{display:'flex',alignItems:'flex-start',gap:10}}>
              <span style={{width:8,height:8,borderRadius:'50%',background:T.gold,marginTop:6,flexShrink:0}}/>
              <div><strong>Intelligence Artificielle :</strong> Génération optimisée depuis 3 fichiers sources.</div>
            </div>
          </div>
        </Card>

        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))',gap:24}}>
          {/* Carte Import Excel */}
          <div onClick={()=>onChoose('excel')} onMouseEnter={()=>sh1(true)} onMouseLeave={()=>sh1(false)}
            style={{background:'#eaeef4e7',borderRadius:18,border:`2px solid ${T.g300}`,padding:'1.7rem',minHeight:300,cursor:'pointer',transition:'all .2s',boxShadow:h1?'0 20px 48px rgba(0,40,85,.16)':'0 8px 28px rgba(0,40,85,.10)',transform:h1?'translateY(-3px)':'none'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:14}}>
              <span style={{fontSize:'3.8rem',fontWeight:900,lineHeight:1,color:T.blueM,marginTop:17,marginLeft:10}}>01</span>
              <Pill bg={T.successBg} color={T.success}>DISPONIBLE</Pill>
            </div>
            <h2 style={{fontSize:'1.02rem',fontWeight:800,color:T.navy,margin:'15px 0 8px'}}>Import Excel (recommandé)</h2>
            <p style={{fontSize:'.82rem',color:T.g400,lineHeight:1.65,margin:'0 0 16px'}}>Importez votre fichier de planification. La durée est calculée automatiquement depuis le client détecté dans le fichier.</p>
            <div style={{display:'flex',gap:8,flexWrap:'wrap',justifyContent:'center'}}>
              {['Format standard','D/ND/R','Durée auto'].map(tag=>(
                <span key={tag} style={{background:'#b6cdeb',color:T.blueM,fontSize:'.78rem',fontWeight:700,padding:'6px 12px',borderRadius:999,border:'1px solid #C9DBFF',minWidth:110,textAlign:'center',marginTop:6}}>{tag}</span>
              ))}
            </div>
          </div>

          {/* Carte IA */}
          <div onMouseEnter={()=>sh2(true)} onMouseLeave={()=>sh2(false)}
            style={{background:'#eaeef4e7',borderRadius:18,border:`2px solid ${T.g300}`,padding:'1.7rem',minHeight:300,cursor:'default',transition:'all .2s',opacity:.6,boxShadow:'0 8px 28px rgba(0,40,85,.10)'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:14}}>
              <span style={{fontSize:'3.8rem',fontWeight:900,lineHeight:1,color:T.blueM,marginTop:17,marginLeft:10}}>02</span>
              <Pill bg={T.g100} color={T.g400}>SPRINT 4</Pill>
            </div>
            <h2 style={{fontSize:'1.02rem',fontWeight:800,color:T.navy,margin:'15px 0 8px'}}>Intelligence Artificielle</h2>
            <p style={{fontSize:'.82rem',color:T.g400,lineHeight:1.65,margin:'0 0 16px'}}>Analyse de 3 fichiers pour un planning optimisé et prédictif.</p>
            <div style={{display:'flex',gap:8,flexWrap:'wrap',justifyContent:'center'}}>
              {['Planification','Réclamations','Changements techniques'].map(tag=>(
                <span key={tag} style={{background:'#b6cdeb',color:T.blueM,fontSize:'.78rem',fontWeight:700,padding:'6px 12px',borderRadius:999,border:'1px solid #C9DBFF',minWidth:110,textAlign:'center',marginTop:6}}>{tag}</span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── ÉTAPE 2 — Contexte ──────────────────────────────────────── */
function EtapeContexte({ onBack, onNext }) {
  const { user } = useAuth();
  const plantScope    = getUserPlantScope(user);
  const lockedPlantId = plantScope?.plantId ? String(plantScope.plantId) : '';

  const [sites,     setSites]     = useState([]);
  const [plants,    setPlants]    = useState([]);
  const [segments,  setSegments]  = useState([]);
  const [clientsDB, setClientsDB] = useState([]);
  const [siteId,    setSiteId]    = useState('');
  const [plantId,   setPlantId]   = useState('');
  const [segmentId, setSegmentId] = useState('');
  const [client,    setClient]    = useState('');
  const [lS,        setLS]        = useState(false);
  const [lP,        setLP]        = useState(false);
  const [lSeg,      setLSeg]      = useState(false);
  const [lC,        setLC]        = useState(false);
  const [err,       setErr]       = useState('');

  // Résoudre le site du plant verrouillé
  useEffect(() => {
    if (!lockedPlantId) return;
    fetch('http://localhost:8080/api/sites/plants', { headers: apiH() })
      .then(r => r.json())
      .then(d => {
        const list    = Array.isArray(d) ? d : [];
        const matched = list.find(p =>
          String(p.id) === lockedPlantId ||
          String(p.nom||'').trim().toLowerCase() === String(plantScope?.plantNom||'').trim().toLowerCase()
        );
        if (matched) {
          if (matched.siteId != null)        setSiteId(String(matched.siteId));
          else if (matched.site?.id != null) setSiteId(String(matched.site.id));
          setPlantId(String(matched.id));
        } else {
          setPlantId(lockedPlantId);
        }
      })
      .catch(() => setPlantId(lockedPlantId));
  }, [lockedPlantId, plantScope?.plantNom]);

  // Charger les sites
  useEffect(() => {
    setLS(true);
    fetch('http://localhost:8080/api/sites', { headers: apiH() })
      .then(r => r.json())
      .then(d => setSites(Array.isArray(d) ? d : []))
      .catch(() => setErr('Impossible de charger les sites.'))
      .finally(() => setLS(false));
  }, []);

  // Charger les groupes clients (endpoint corrigé → groupes seulement)
  useEffect(() => {
    setLC(true);
    fetch('http://localhost:8080/api/planification/clients-distincts', { headers: apiH() })
      .then(r => r.ok ? r.json() : [])
      .then(d => setClientsDB(Array.isArray(d) ? d.filter(Boolean) : []))
      .catch(() => setClientsDB([]))
      .finally(() => setLC(false));
  }, []);

  // Charger les plants du site
  useEffect(() => {
    if (!siteId) { setPlants([]); setPlantId(''); setSegments([]); setSegmentId(''); return; }
    setLP(true);
    fetch(`http://localhost:8080/api/sites/${siteId}/plants`, { headers: apiH() })
      .then(r => r.json())
      .then(d => setPlants(Array.isArray(d) ? d : []))
      .catch(() => setErr('Impossible de charger les plants.'))
      .finally(() => setLP(false));
  }, [siteId]);

  // Charger les segments du plant
  useEffect(() => {
    if (!plantId) { setSegments([]); setSegmentId(''); return; }
    setLSeg(true);
    fetch(`http://localhost:8080/api/planification/sites/plants/${plantId}/segments`, { headers: apiH() })
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(d => setSegments(Array.isArray(d) ? d : []))
      .catch(() => setErr('Impossible de charger les segments.'))
      .finally(() => setLSeg(false));
  }, [plantId]);

  const sC   = sites.find(s    => String(s.id)    === String(siteId));
  const pC   = plants.find(p   => String(p.id)    === String(plantId));
  const segC = segments.find(s => String(s.id)    === String(segmentId));
  const isValid = !!siteId && !!plantId && !!segmentId;

  const sel = { width:'100%', padding:'14px 16px', border:`1.5px solid ${T.g300}`, borderRadius:12, fontSize:'.95rem', background:'#fff', fontFamily:'inherit', outline:'none', cursor:'pointer' };
  const lbl = { display:'block', fontSize:'.78rem', fontWeight:800, marginBottom:8, color:T.g700, textTransform:'uppercase', letterSpacing:'.04em' };

  return (
    <div style={{ width:'100%', maxWidth:1300, margin:'0 auto', padding:'2rem' }}>
      <div style={{ marginBottom:30, marginTop:-30 }}>
        <h1 style={h1}>Définir le contexte de la planification</h1>
        <p style={{ fontSize:'.95rem', color:T.g400 }}>
          Sélectionnez le site, le plant et le segment. Ces informations filtrent les auditeurs disponibles et préremplissent la planification.
        </p>
      </div>

      {err && (
        <div style={{ background:T.dangerBg, color:T.danger, padding:'14px', borderRadius:12, marginBottom:20 }}>
          {err}
        </div>
      )}

      <Card style={{ padding:'2rem' }}>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:24 }}>

          {/* Site */}
          <div>
            <label style={lbl}>Site *</label>
            <select
              style={{ ...sel, background:lockedPlantId?'#F7F9FC':'#fff', cursor:lockedPlantId?'not-allowed':'pointer' }}
              value={siteId} onChange={e=>setSiteId(e.target.value)} disabled={!!lockedPlantId}
            >
              <option value="">Sélectionner un site…</option>
              {sites.map(s => <option key={s.id} value={s.id}>{s.nom}</option>)}
            </select>
          </div>

          {/* Plant */}
          <div>
            <label style={lbl}>Plant *</label>
            <select
              style={{ ...sel, background:lockedPlantId?'#F7F9FC':'#fff', cursor:lockedPlantId?'not-allowed':'pointer' }}
              value={plantId} onChange={e=>setPlantId(e.target.value)} disabled={!!lockedPlantId}
            >
              <option value="">Sélectionner un plant…</option>
              {plants.map(p => <option key={p.id} value={p.id}>{p.nom}</option>)}
            </select>
          </div>

          {/* Segment */}
          <div>
            <label style={lbl}>Segment *</label>
            <select style={sel} value={segmentId} onChange={e=>setSegmentId(e.target.value)}>
              <option value="">Sélectionner un segment…</option>
              {segments.map(s => <option key={s.id} value={s.id}>{s.nom||s.libelle}</option>)}
            </select>
          </div>

          {/* Client — select enrichi avec couleur */}
          <ClientSelector
            value={client}
            onChange={setClient}
            clients={clientsDB}
            loading={lC}
          />

        </div>
      </Card>

      <div style={{ display:'flex', justifyContent:'space-between', marginTop:30 }}>
        <Btn variant="secondary" onClick={onBack}>← Retour</Btn>
        <Btn
          onClick={() => onNext({
            siteId:     parseInt(siteId),
            siteNom:    sC?.nom || '',
            plantId:    parseInt(plantId),
            plantNom:   pC?.nom || '',
            segmentId:  parseInt(segmentId),
            segmentNom: segC?.nom || segC?.libelle || '',
            client:     client || null,
          })}
          disabled={!isValid}
        >
          Continuer →
        </Btn>
      </div>
    </div>
  );
}

/* ─── ÉTAPE 3 — Import Excel ──────────────────────────────────── */
function EtapeImport({onBack,onImported,contexte}){
  const[fichier,setF]=useState(null),[loading,setL]=useState(false),[drag,setD]=useState(false);
  const ref=useRef();
  const hF=f=>{if(!f)return;if(!f.name.match(/\.xlsx?$/i)){alert('Fichier .xlsx requis');return;}setF(f);};
  const doImport=async()=>{
    if(!fichier)return;setL(true);
    const form=new FormData();form.append('fichier',fichier);
    if(contexte?.siteId)   form.append('siteId',   contexte.siteId);
    if(contexte?.plantId)  form.append('plantId',  contexte.plantId);
    if(contexte?.segmentId)form.append('segmentId',contexte.segmentId);
    if(contexte?.client)   form.append('client',   contexte.client);
    try{
      const res=await fetch('http://localhost:8080/api/planification/import-excel',{method:'POST',headers:multiH(),body:form});
      if(!res.ok)throw new Error(await res.text());
      const data=await res.json();
      onImported({
        ...data,
        plantId:    data.plantId    || contexte?.plantId,
        plantNom:   data.plantNom   || contexte?.plantNom,
        segmentId:  data.segmentId  || contexte?.segmentId,
        segmentNom: data.segmentNom || contexte?.segmentNom,
        siteId:     data.siteId     || contexte?.siteId,
        siteNom:    data.siteNom    || contexte?.siteNom,
        client:     data.clientDetecte || contexte?.client,
        dureeMois:  data.dureeMois,
      });
    }catch(e){alert('Erreur import : '+e.message);}
    setL(false);
  };

  const clientColor = contexte?.client ? (CLIENT_COLORS[contexte.client] || T.blueM) : null;

  return (
    <div style={{maxWidth:1200,margin:'10px auto'}}>
      {contexte && (
        <div style={{marginBottom:0,padding:'12px 18px',background:'linear-gradient(135deg,#0B1E3D,#1D4ED8)',borderRadius:12,display:'flex',alignItems:'center',gap:12,flexWrap:'wrap',marginTop:-30}}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#93C5FD" strokeWidth="2" strokeLinecap="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
          <span style={{color:'#fff',fontSize:'.83rem',fontWeight:700}}>
            {[contexte.siteNom,contexte.plantNom,contexte.segmentNom].filter(Boolean).join(' › ')}
          </span>
          {contexte.client && (
            <span style={{background:clientColor?`${clientColor}33`:'rgba(255,255,255,.15)',color:'#fff',border:`1px solid ${clientColor?`${clientColor}66`:'rgba(255,255,255,.3)'}`,padding:'3px 12px',borderRadius:99,fontSize:'.76rem',fontWeight:700,display:'flex',alignItems:'center',gap:6}}>
              <span style={{width:8,height:8,borderRadius:'50%',background:clientColor||'#fff',display:'inline-block'}}/>
              {contexte.client}
            </span>
          )}
          <span style={{color:'rgba(255,255,255,.55)',fontSize:'.73rem'}}>· Durée déterminée depuis le fichier</span>
        </div>
      )}

      <h1 style={{...h1,marginBottom:4,marginTop:0}}>Importation de planification</h1>
      <div style={{fontSize:'.78rem',color:T.g400,marginBottom:18}}>Format standard multi-plant. Les audits D/ND/R et la durée sont détectés automatiquement.</div>

      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:20,alignItems:'center',justifyItems:'center'}}>
        <Card style={{width:'100%',maxWidth:600,minHeight:360}}>
          <div style={{fontWeight:800,fontSize:'.86rem',color:T.g700,marginBottom:12,marginTop:15}}>Structure attendue :</div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
            {['Col A : Projet / Client','Col B : Produit / Variante','Col C : Référence technique','Col D : Variant No.','Col E : Référence interne','Col G : Année (YYYY)','Col I–T : Mois 1 à 12 (D/ND/R)','1 feuille = 1 série'].map(c=>(
              <div key={c} style={{background:T.g50,padding:'8px 10px',borderRadius:10,fontSize:'.74rem',color:T.g500}}>{c}</div>
            ))}
          </div>
          <div style={{marginTop:14,padding:'10px 12px',background:T.infoBg,border:'1px solid #BFDBFE',borderRadius:10,fontSize:'.76rem',color:T.info}}>
            <strong>Segment :</strong> {contexte?.segmentNom?<span style={{color:T.success,fontWeight:700}}>✓ {contexte.segmentNom}</span>:'Extrait du nom de fichier.'}<br/>
            <strong>Durée :</strong> Calculée automatiquement (BMW/Mercedes=12 mois, VW/Audi/autres=6 mois).
          </div>
        </Card>

        <Card style={{width:'100%',maxWidth:600,minHeight:360}}>
          <div
            onClick={()=>ref.current?.click()}
            onDrop={e=>{e.preventDefault();setD(false);hF(e.dataTransfer.files[0]);}}
            onDragOver={e=>{e.preventDefault();setD(true);}}
            onDragLeave={()=>setD(false)}
            style={{border:`2.5px dashed ${drag?T.blueM:fichier?'#86EFAC':T.g300}`,borderRadius:20,padding:'2.6rem 2rem',textAlign:'center',minHeight:240,background:drag?T.infoBg:fichier?T.successBg:'#F8FAFF',cursor:'pointer',transition:'all .2s',marginBottom:12}}
          >
            <input ref={ref} type="file" accept=".xlsx,.xls" hidden onChange={e=>hF(e.target.files[0])}/>
            <div style={{fontSize:'2rem',marginBottom:8}}>{fichier?'✓':'↑'}</div>
            <div style={{fontWeight:800,fontSize:'.92rem',color:fichier?T.success:T.g700,marginBottom:6}}>
              {fichier?fichier.name:'Glissez votre fichier Excel ou cliquez'}
            </div>
            <div style={{fontSize:'.74rem',color:T.g400}}>
              {fichier?`${(fichier.size/1024).toFixed(1)} KB`:'Format .xlsx — Standard multi-plant'}
            </div>
            {fichier&&<button onClick={e=>{e.stopPropagation();setF(null);}} style={{marginTop:8,background:'none',border:'none',color:T.g400,cursor:'pointer',fontSize:'.74rem'}}>Changer de fichier</button>}
          </div>
          <div style={{display:'flex',justifyContent:'space-between',gap:10}}>
            <Btn variant="secondary" onClick={onBack}>← Retour</Btn>
            <Btn onClick={doImport} disabled={!fichier||loading}>
              {loading?'Analyse en cours…':'Importer et analyser'}
            </Btn>
          </div>
        </Card>
      </div>
    </div>
  );
}

/* ─── ÉTAPE 4 — Compléter ─────────────────────────────────────── */
/* ─── ÉTAPE 4 — Compléter ─────────────────────────────────────── */
function EtapeCompleter({planificationId,auditsRaw,onBack,onLanced,info}){
  const[audits,setAudits]=useState(()=>auditsRaw.map(a=>({...a,auditeurId:'',deadline:''})));
  const[auditeurs,setAuditeurs]=useState([]);
  const[selPlant,setSelPlant]=useState('');
  const[draftAt,setDA]=useState(null);
  const[search,setSearch]=useState('');
  const[fNat,setFN]=useState('TOUS');
  const[fMois,setFM]=useState('TOUS');
  const[loading,setL]=useState(false);
  const[confirm,setConfirm]=useState(false);
  const planifPlantId=info?.plantId??info?.plant?.id??null;
  const planifSegId=info?.segmentId??info?.segment?.id??null;

  const pOpts=(()=>{
    const m=new Map();
    const add=(id,name)=>{const n=(name||'').toString().trim();if(!id&&!n)return;const k=id?`id:${id}`:`name:${n.toLowerCase()}`;if(!m.has(k))m.set(k,{value:k,label:n||`Plant ${id}`,id});};
    add(planifPlantId,info?.plantNom||info?.plant?.nom);
    auditsRaw.forEach(a=>add(a.plantId||a?.plant?.id,a.plantNom||a?.plant?.nom||a.domaine));
    return Array.from(m.values());
  })();

  useEffect(()=>{
    if(selPlant)return;
    if(pOpts.length===1){setSelPlant(pOpts[0].value);return;}
    if(planifPlantId){const b=pOpts.find(p=>p.id===planifPlantId);if(b)setSelPlant(b.value);}
  },[pOpts,selPlant,planifPlantId]);

 useEffect(()=>{
    let active = true;

    const loadAuditeurs = async () => {
      try {
        const [auditeursRes, passagesRes] = await Promise.all([
          fetch('http://localhost:8080/api/utilisateurs/auditeurs', { headers: apiH() }),
          info?.client
            ? fetch('http://localhost:8080/api/expert-audit/passages/all', { headers: apiH() })
            : Promise.resolve({ ok: false, json: async () => [] }),
        ]);

        const auditeursData = auditeursRes.ok ? await auditeursRes.json() : [];
        const list = Array.isArray(auditeursData) ? auditeursData : [];
        const sid = selPlant.startsWith?.('id:') ? parseInt(selPlant.slice(3), 10) : null;
        const plantFiltered = sid
          ? list.filter(a => a.plantId === sid || a?.plant?.id === sid)
          : planifPlantId
          ? list.filter(a => a.plantId === planifPlantId || a?.plant?.id === planifPlantId)
          : list;

        console.log('[DEBUG] plantFiltered:', plantFiltered.map(a => ({ id: a.id, nom: `${a.prenom||''} ${a.nom||''}`, matricule: a.matricule })));

        let filtered = plantFiltered;

        if (info?.client && passagesRes.ok) {
          const passagesData = await passagesRes.json();
          const passages = Array.isArray(passagesData) ? passagesData : [];

          // Index des auditeurs du plant par matricule (normalisé en string, trim)
          const auditeurParMatricule = new Map(
            plantFiltered
              .filter(a => a.matricule != null)
              .map(a => [String(a.matricule).trim(), a])
          );

          console.log('[DEBUG] matricules disponibles dans plantFiltered:', Array.from(auditeurParMatricule.keys()));

          const idAuditeursQualifies = new Set();

          passages.forEach(p => {
            if (!isQualifiedPassage(p)) return;
            if (!clientMatches(p.certificationTitre, info.client)) return;

            // 1) id direct si jamais l'API le fournit un jour
            const idDirect = p.auditeurId || p.auditeur?.id;
            if (idDirect) {
              idAuditeursQualifies.add(String(idDirect));
              return;
            }
            // 2) fallback par matricule (cas réel actuel de l'API)
            const matricule = String(p.auditeurMatricule || '').trim();
            const auditeurTrouve = auditeurParMatricule.get(matricule);
            if (auditeurTrouve) {
              idAuditeursQualifies.add(String(auditeurTrouve.id));
            }
          });

          console.log('[DEBUG] idAuditeursQualifies pour', info.client, ':', Array.from(idAuditeursQualifies));

          filtered = plantFiltered.filter(a => idAuditeursQualifies.has(String(a.id)));
        }

        if (active) setAuditeurs(filtered);
      } catch (e) {
        console.error('[DEBUG] Erreur loadAuditeurs:', e);
        if (active) setAuditeurs([]);
      }
    };

    loadAuditeurs();
    return () => { active = false; };
  },[planifPlantId,auditsRaw,selPlant,info?.client]);

  useEffect(()=>{
    if(!planificationId)return;
    try{const r=localStorage.getItem(`planif-draft-${planificationId}`);if(!r)return;const p=JSON.parse(r);if(Array.isArray(p?.audits)){setAudits(p.audits);setDA(p.savedAt||null);}}catch{}
  },[planificationId]);

  useEffect(()=>{
    if(!planificationId)return;
    const t=setTimeout(()=>{
      const p={audits,savedAt:new Date().toISOString()};
      try{localStorage.setItem(`planif-draft-${planificationId}`,JSON.stringify(p));}catch{}
      setDA(p.savedAt);
    },500);
    return()=>clearTimeout(t);
  },[audits,planificationId]);

  const upd=(i,f,v)=>setAudits(p=>p.map((a,idx)=>idx===i?{...a,[f]:v}:a));
  const cnt=audits.filter(a=>a.auditeurId&&a.deadline).length;
  const pct=audits.length?Math.round(cnt/audits.length*100):0;

  const gMN=v=>{if(!v)return'';const s=v.toString().trim();const m1=s.match(/^(\d{4})-(\d{2})-(\d{2})$/);if(m1)return String(parseInt(m1[2],10));const m2=s.match(/^(\d{2})\/(\d{2})\/(\d{1,4})$/);if(m2)return String(parseInt(m2[2],10));const m3=s.match(/^(\d{4})-(\d{2})$/);if(m3)return String(parseInt(m3[2],10));const d=new Date(s.length===7?`${s}-01`:s);return Number.isNaN(d.getTime())?'':String(d.getMonth()+1);};
  const toISO=v=>{if(!v)return null;const s=v.toString().trim();if(s.match(/^\d{4}-\d{2}-\d{2}$/))return s;const fr=s.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);if(fr)return`${fr[3]}-${fr[2]}-${fr[1]}`;const ym=s.match(/^(\d{4})-(\d{2})$/);if(ym)return`${ym[1]}-${ym[2]}-01`;const d=new Date(s);if(Number.isNaN(d.getTime()))return null;return`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;};

  const mois=[...new Set(audits.map(a=>gMN(a.datePrevue)).filter(Boolean))].sort((a,b)=>parseInt(a)-parseInt(b));
  const filt=audits.filter(a=>{const t=search.toLowerCase();const mT=!t||[a.serieNom,a.projetNom,a.variantNo,a.bmwNo].some(v=>(v||'').toLowerCase().includes(t));return mT&&(fNat==='TOUS'||a.natureAudit===fNat)&&(fMois==='TOUS'||gMN(a.datePrevue)===fMois);});

  const lancer=async()=>{
    setL(true);
    const sP=selPlant.startsWith?.('id:')?parseInt(selPlant.slice(3),10):null;
    const fP=planifPlantId||sP;
    try{
      const res=await fetch('http://localhost:8080/api/planification/lancer',{method:'POST',headers:apiH(),body:JSON.stringify({
        planificationId,
        audits:audits.map(a=>({
          auditId:a.auditId||null,reference:a.tempId,
          auditeurId:parseInt(a.auditeurId),deadline:a.deadline,
          typeAudit:a.typeAudit||'AUDIT_PRODUIT',natureAudit:a.natureAudit||'NON_DESTRUCTIF',
          datePrevue:toISO(a.datePrevue),
          projetId:a.projetId?parseInt(a.projetId):null,
          serieId:a.serieId?parseInt(a.serieId):null,
          segmentId:planifSegId?planifSegId:a.segmentId?parseInt(a.segmentId):null,
          plantId:a.plantId?parseInt(a.plantId):fP,
          siteId:a.siteId?parseInt(a.siteId):info?.siteId?parseInt(info.siteId):null,
          familleCablage:a.familleCablage,domaine:a.domaine,
          variantNo:a.variantNo,bmwNo:a.bmwNo,
          serieNom:a.serieNom||a.familleCablage||null,
          projetNom:a.projetNom||a.domaine||null,
        })),
      })});
      if(!res.ok)throw new Error(await res.text());
      try{localStorage.removeItem(`planif-draft-${planificationId}`);}catch{}
      onLanced(await res.json(),audits);
    }catch(e){alert('Erreur lancement : '+(e.message||'Erreur inconnue'));}
    setL(false);setConfirm(false);
  };

  const clientColor = info?.client ? (CLIENT_COLORS[info.client] || T.blueM) : null;

  return (
    <div style={{maxWidth:1500,margin:'15px auto'}}>
      {(info?.plantNom||info?.segmentNom)&&(
        <div style={{marginBottom:16,padding:'10px 16px',background:'linear-gradient(135deg,#0B1E3D,#1D4ED8)',borderRadius:10,display:'flex',alignItems:'center',gap:10,flexWrap:'wrap',marginTop:'-40px'}}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#93C5FD" strokeWidth="2" strokeLinecap="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
          <span style={{color:'#fff',fontSize:'.8rem',fontWeight:700}}>{[info?.siteNom,info?.plantNom,info?.segmentNom].filter(Boolean).join(' › ')}</span>
          {info?.client&&(
            <span style={{background:clientColor?`${clientColor}33`:'rgba(255,255,255,.15)',color:'#fff',border:`1px solid ${clientColor?`${clientColor}55`:'rgba(255,255,255,.3)'}`,padding:'2px 10px',borderRadius:99,fontSize:'.73rem',fontWeight:700,display:'flex',alignItems:'center',gap:5}}>
              <span style={{width:7,height:7,borderRadius:'50%',background:clientColor||'#fff',display:'inline-block'}}/>
              {info.client}
            </span>
          )}
          {info?.dureeMois&&<span style={{background:'rgba(255,255,255,.1)',color:'rgba(255,255,255,.8)',padding:'2px 10px',borderRadius:99,fontSize:'.73rem'}}>{info.dureeMois} mois</span>}
        </div>
      )}

      <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:20,flexWrap:'wrap',gap:12}}>
        <div>
          <h1 style={h1}>Compléter la planification</h1>
          {draftAt&&<p style={{margin:'-5px 0 0',fontSize:'.78rem',color:T.g400}}>Brouillon enregistré — {new Date(draftAt).toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'})}</p>}
        </div>
        <Btn variant="secondary" onClick={onBack} style={{border:'1.5px solid #c7c7c7',borderRadius:25,padding:'9px 28px'}}>← Retour</Btn>
      </div>

      <div style={{display:'flex',gap:10,marginBottom:14,flexWrap:'wrap',alignItems:'center'}}>
        <input style={{...inputStyle,flex:1,minWidth:180,border:'1.5px solid #BCC8DC'}} placeholder="Rechercher série, projet, variant, BMW N°…" value={search} onChange={e=>setSearch(e.target.value)}/>
        <select style={{...selectStyle,width:160,border:'1.5px solid #BCC8DC'}} value={fNat} onChange={e=>setFN(e.target.value)}>
          <option value="TOUS">Toutes natures</option>
          <option value="NON_DESTRUCTIF">Non-Destructif</option>
          <option value="DESTRUCTIF">Destructif</option>
          <option value="REQUALIFICATION">Requalification</option>
        </select>
        <select style={{...selectStyle,width:140,border:'1.5px solid #BCC8DC'}} value={fMois} onChange={e=>setFM(e.target.value)}>
          <option value="TOUS">Tous les mois</option>
          {mois.map(m=><option key={m} value={m}>{m}</option>)}
        </select>
        <span style={{fontSize:'.76rem',color:T.g400}}>{filt.length} audit(s)</span>
      </div>

      <Card style={{padding:0,borderRadius:16,overflow:'hidden'}}>
        <div style={{overflowX:'auto'}}>
          <table style={{width:'100%',borderCollapse:'collapse',fontSize:'.8rem'}}>
            <thead>
              <tr style={{background:'#c8d6ee'}}>
                {['#','Nature','Série / Variant','Projet','Variant No.','Mois','Auditeur *','Deadline *','Statut'].map(h=>(
                  <th key={h} style={{padding:'10px 12px',textAlign:'left',fontWeight:700,color:T.g500,fontSize:'.7rem',textTransform:'uppercase',letterSpacing:'.05em',borderBottom:`2px solid ${T.g100}`,whiteSpace:'nowrap'}}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filt.map(audit=>{
                const ri=audits.indexOf(audit);
                const ok=audit.auditeurId&&audit.deadline;
                const nc=NC[audit.natureAudit]||NC.NON_DESTRUCTIF;
                return (
                  <tr key={ri} style={{background:!ok?'#FFFBEB':ri%2===0?'#fff':T.g50,borderBottom:`1px solid ${T.g100}`}}>
                    <td style={td}><span style={{color:T.g300,fontWeight:700}}>{ri+1}</span></td>
                    <td style={td}><Pill bg={nc.bg} color={nc.text}>{nc.label}</Pill></td>
                    <td style={td}>
                      <div style={{fontWeight:700,color:T.navy,fontSize:'.8rem'}}>{audit.serieNom||'—'}</div>
                      {audit.variantNo&&<div style={{fontSize:'.68rem',color:T.g400}}>{audit.variantNo}</div>}
                    </td>
                    <td style={td}><span style={{color:T.g700}}>{audit.projetNom||'—'}</span></td>
                    <td style={td}><span style={{fontFamily:'monospace',fontSize:'.73rem',color:T.g500}}>{audit.bmwNo||audit.variantNo||'—'}</span></td>
                    <td style={td}><span style={{fontWeight:600,color:T.blueM,fontSize:'.75rem'}}>{gMN(audit.datePrevue)||'—'}</span></td>
                    <td style={td}>
                      <select
                        style={audit.auditeurId?{...selectMini,borderColor:'#86EFAC',background:T.successBg}:{...selectMini,borderColor:'#FCA5A5',background:T.dangerBg}}
                        value={audit.auditeurId||''} onChange={e=>upd(ri,'auditeurId',e.target.value)}
                      >
                        <option value="">-- Choisir --</option>
                        {auditeurs.length===0&&<option disabled>Aucun auditeur qualifié pour ce client</option>}
                        {auditeurs.map(a=><option key={a.id} value={a.id}>{a.prenom} {a.nom}</option>)}
                      </select>
                    </td>
                    <td style={td}>
                      <input type="date"
                        style={audit.deadline?{...inputMini,borderColor:'#86EFAC',background:T.successBg}:{...inputMini,borderColor:'#FCA5A5',background:T.dangerBg}}
                        value={audit.deadline||''} onChange={e=>upd(ri,'deadline',e.target.value)}
                      />
                    </td>
                    <td style={td}>
                      {ok?<span style={{color:T.success,fontWeight:700,fontSize:'.7rem'}}>✓ OK</span>
                         :<span style={{color:T.danger,fontWeight:700,fontSize:'.7rem'}}>Incomplet</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div style={{position:'sticky',bottom:0,background:'#fff',borderTop:`1px solid ${T.g200}`,padding:'12px 20px',display:'flex',justifyContent:'space-between',alignItems:'center',zIndex:10,borderRadius:'0 0 16px 16px',boxShadow:'0 -2px 8px rgba(0,0,0,.05)'}}>
          <div style={{fontSize:'.83rem',marginRight:20}}>
            {pct<100
              ?<span style={{color:T.danger,fontWeight:600}}>{audits.length-cnt} audit(s) à compléter</span>
              :<span style={{color:T.success,fontWeight:600}}>Tous complétés — Prêt pour le lancement</span>}
          </div>
          <Btn onClick={()=>setConfirm(true)} disabled={pct<100} variant="gold">
            Valider le planning ({audits.length} audits)
          </Btn>
        </div>
      </Card>

      {confirm&&(
        <div style={{position:'fixed',inset:0,background:'rgba(0,28,60,.6)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1100,backdropFilter:'blur(6px)'}}>
          <div style={{background:'#fff',borderRadius:28,padding:'2rem',width:'100%',maxWidth:480,boxShadow:'0 32px 64px rgba(0,0,0,.25)'}}>
            <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:20}}>
              <div style={{width:48,height:48,background:T.warnBg,borderRadius:30,display:'flex',alignItems:'center',justifyContent:'center'}}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none"><path d="M12 16V12M12 8H12.01M22 12C22 17.52 17.52 22 12 22C6.48 22 2 17.52 2 12C2 6.48 6.48 2 12 2C17.52 2 22 6.48 22 12Z" stroke={T.warn} strokeWidth="1.5" strokeLinecap="round"/></svg>
              </div>
              <h3 style={{fontSize:'1.3rem',fontWeight:800,color:T.navy,margin:0}}>Confirmation du lancement</h3>
            </div>
            <p style={{fontSize:'.9rem',color:T.g700,lineHeight:1.5,marginBottom:24}}>
              Lancement de <strong>{audits.length} audits</strong> pour le segment <strong>{info?.segmentNom||'ce segment'}</strong> (Plant : <strong style={{color:T.navy}}>{info?.plantNom||'—'}</strong>). Chaque auditeur recevra une notification.
            </p>
            <div style={{background:T.g100,borderRadius:16,padding:'1rem 1.2rem',marginBottom:24,display:'flex',justifyContent:'space-around',alignItems:'center'}}>
              <div style={{textAlign:'center'}}><div style={{fontSize:'2rem',fontWeight:900,color:T.navy}}>{audits.length}</div><div style={{fontSize:'.72rem',color:T.g400,fontWeight:600}}>Audits</div></div>
              <div style={{width:1,height:40,background:T.g400}}/>
              <div style={{textAlign:'center'}}><div style={{fontSize:'2rem',fontWeight:900,color:T.blue}}>{[...new Set(audits.map(a=>a.auditeurId).filter(Boolean))].length}</div><div style={{fontSize:'.72rem',color:T.g400,fontWeight:600}}>Auditeurs</div></div>
              {info?.dureeMois&&(<><div style={{width:1,height:40,background:T.g400}}/><div style={{textAlign:'center'}}><div style={{fontSize:'2rem',fontWeight:900,color:T.gold}}>{info.dureeMois}</div><div style={{fontSize:'.72rem',color:T.g400,fontWeight:600}}>Mois</div></div></>)}
            </div>
            <div style={{display:'flex',gap:12,justifyContent:'center'}}>
              <Btn variant="secondary" onClick={()=>setConfirm(false)} style={{borderRadius:40,padding:'10px 24px',border:`1.5px solid ${T.g400}`}}>Annuler</Btn>
              <Btn onClick={lancer} disabled={loading} variant="gold" style={{borderRadius:40,padding:'10px 28px',minWidth:180}}>
                {loading
                  ?<span style={{display:'flex',alignItems:'center',gap:8}}><span style={{width:16,height:16,border:'2px solid #fff',borderTopColor:'transparent',borderRadius:'50%',animation:'spin 0.8s linear infinite'}}/> Lancement…</span>
                  :'Confirmer et lancer'}
              </Btn>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── ÉTAPE 5 — Succès ────────────────────────────────────────── */
function EtapeSucces({planif,audits,onNewPlanif,onViewPlanifs}){
  const auditsCount    = planif?.nombreAuditsTotal || (audits||[]).length || 0;
  const auditeursCount = [...new Set((audits||[]).map(a=>a.auditeurId).filter(Boolean))].length;
  const duree          = planif?.dureeMois ?? '?';
  const planifName     = planif?.nom || 'Nouvelle planification';
  return (
    <div style={{maxWidth:1200,margin:'12px auto',padding:'0 16px',textAlign:'center'}}>
      <div style={{width:'100%',background:'#fff',borderRadius:16,padding:'28px',boxShadow:'0 20px 40px rgba(2,18,54,0.08)'}}>
        <div style={{width:96,height:96,background:'linear-gradient(135deg,#E6F5EE,#DFF7EA)',borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 18px',fontSize:'2.25rem',color:T.success,fontWeight:900}}>✓</div>
        <h2 style={{fontSize:'1.5rem',fontWeight:800,color:T.navy,margin:'6px 0 8px'}}>Planification lancée avec succès</h2>
        <p style={{color:T.g700,fontSize:'.95rem',lineHeight:1.5,marginBottom:20}}>
          La planification <strong style={{color:T.navy}}>{planifName}</strong> a été créée.
        </p>
        <div style={{display:'flex',gap:14,justifyContent:'center',marginBottom:24,flexWrap:'wrap'}}>
          {[{v:auditsCount,l:'Audits planifiés',c:T.navy},{v:auditeursCount,l:'Auditeurs notifiés',c:T.navy},{v:duree,l:'Durée (mois)',c:T.gold}].map(({v,l,c})=>(
            <div key={l} style={{minWidth:140,flex:'1 1 140px',background:T.g100,borderRadius:12,padding:'14px 16px',textAlign:'center'}}>
              <div style={{fontSize:'1.4rem',fontWeight:900,color:c}}>{v}</div>
              <div style={{fontSize:'.78rem',color:T.g400,fontWeight:800}}>{l}</div>
            </div>
          ))}
        </div>
        <div style={{display:'flex',gap:12,justifyContent:'center',flexWrap:'wrap'}}>
          <Btn variant="secondary" onClick={onNewPlanif} style={{borderRadius:40,padding:'10px 22px'}}>Nouvelle planification</Btn>
          <Btn onClick={onViewPlanifs} style={{borderRadius:40,padding:'10px 22px'}}>Voir le planning</Btn>
        </div>
      </div>
    </div>
  );
}

/* ─── PAGE PRINCIPALE ─────────────────────────────────────────── */
export default function PlanificationPage(){
  const[searchParams,setSearchParams]=useSearchParams();
  const navigate=useNavigate();
  const[etape,setEtape]=useState(1);
  const[mode,setMode]=useState(null);
  const[contexte,setContexte]=useState(null);
  const[importedData,setImportedData]=useState(null);
  const[planifLancee,setPlanifLancee]=useState(null);
  const[auditsLances,setAuditsLances]=useState([]);
  const[draftError,setDE]=useState(null);

  const hChoose  = m  => { setMode(m); if(m==='ia')return; setEtape(2); };
  const hContexte= ctx=> { setContexte(ctx); setEtape(3); };
  const hImported= data=> { setImportedData(data); setEtape(4); };
  const hLanced  = (p,a)=> { setPlanifLancee(p); setAuditsLances(a); setEtape(5); };
  const reset    = ()=> { setEtape(1);setMode(null);setContexte(null);setImportedData(null);setPlanifLancee(null);setAuditsLances([]);setDE(null); };

  useEffect(()=>{
    const draftId=searchParams.get('draftId'); if(!draftId)return;
    const clear=()=>{const n=new URLSearchParams(searchParams);n.delete('draftId');setSearchParams(n,{replace:true});};
    const num=parseInt(draftId,10); if(Number.isNaN(num)){clear();setDE('Identifiant de brouillon invalide.');return;}
    let saved=null; try{saved=JSON.parse(localStorage.getItem(`planif-draft-${draftId}`));}catch{}
    fetch(`http://localhost:8080/api/planification/${draftId}`,{headers:apiH()})
      .then(r=>r.ok?r.json():null)
      .then(info=>{
        const a=(saved?.audits&&Array.isArray(saved.audits)?saved.audits:null)||(Array.isArray(info?.audits)?info.audits:[]);
        setDE(null);setMode('excel');setEtape(4);
        setImportedData({...(info||{}),planificationId:info?.id||num,audits:a});
      })
      .catch(()=>{
        if(Array.isArray(saved?.audits)&&saved.audits.length>0){
          setDE(null);setMode('excel');setEtape(4);
          setImportedData({planificationId:num,audits:saved.audits});return;
        }
        clear();setDE('Erreur lors du chargement du brouillon.');
      });
  },[searchParams,setSearchParams]);

  return (
    <div style={{fontFamily:"'DM Sans',sans-serif",background:'#ffffff',minHeight:'auto',overflowX:'hidden'}}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{padding:'1.5rem 2rem'}}>

        {etape>1&&(
          <div style={{position:'sticky',top:10,zIndex:1000,backgroundColor:'#ffffff',padding:'0.5rem 0',marginTop:'-30px',marginBottom:'1.5rem'}}>
            <div style={{maxWidth:1200,margin:'0 auto',display:'flex',alignItems:'center',justifyContent:'center'}}>
              <Stepper step={etape}/>
            </div>
          </div>
        )}

        <div style={{paddingTop:etape>1?'1rem':'0'}}>
          {etape===1&&(
            <>
              {draftError&&<div style={{background:T.dangerBg,color:T.danger,padding:'10px 14px',borderRadius:10,marginBottom:16,fontWeight:700,fontSize:'.8rem'}}>{draftError}</div>}
              <EtapeChoix onChoose={hChoose}/>
            </>
          )}
          {etape===2&&<EtapeContexte onBack={()=>setEtape(1)} onNext={hContexte}/>}
          {etape===3&&<EtapeImport   onBack={()=>setEtape(2)} onImported={hImported} contexte={contexte}/>}
          {etape===4&&importedData&&(
            <EtapeCompleter
              planificationId={importedData.planificationId}
              auditsRaw={importedData.audits||[]}
              info={{...contexte,...importedData}}
              onBack={()=>setEtape(3)}
              onLanced={hLanced}
            />
          )}
          {etape===5&&(
            <EtapeSucces
              planif={planifLancee}
              audits={auditsLances}
              onNewPlanif={reset}
              onViewPlanifs={()=>window.location.href=`/expert/planning?planifId=${planifLancee?.id||''}&view=calendar`}
            />
          )}
        </div>
      </div>
    </div>
  );
}

// ── Styles partagés ───────────────────────────────────────────────
const h1         = { fontSize:'1.5rem', fontWeight:800, color:'#002855', margin:'0 0 6px' };
const selectStyle= { padding:'8px 10px', border:`1.5px solid #DAE2EF`, borderRadius:8, fontSize:'.82rem', background:'#fff', fontFamily:'inherit', color:'#182030', outline:'none' };
const inputStyle = { padding:'8px 10px', border:`1.5px solid #DAE2EF`, borderRadius:8, fontSize:'.82rem', background:'#fff', fontFamily:'inherit', color:'#182030', outline:'none', boxSizing:'border-box' };
const selectMini = { width:160, padding:'5px 6px', borderRadius:6, fontSize:'.76rem', border:'1.5px solid', fontFamily:'inherit' };
const inputMini  = { width:130, padding:'5px 6px', borderRadius:6, fontSize:'.76rem', border:'1.5px solid', fontFamily:'inherit' };
const td         = { padding:'9px 12px', verticalAlign:'middle' };