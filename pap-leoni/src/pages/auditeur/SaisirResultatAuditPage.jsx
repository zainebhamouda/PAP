// ═══════════════════════════════════════════════════════════════
// SaisirResultatAuditSpecial.jsx
// Page de saisie des résultats pour :
//   - Audit Règle Plate  (/auditeur/audits-special/regle-plate/:id)
//   - Audit Magasin Export (/auditeur/audits-special/export/:id)
// ═══════════════════════════════════════════════════════════════
import { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { auditSpecialAPI } from '../../services/api';

const T = {
  navy: '#002855', blue: '#003F8A', blueM: '#0057B8',
  g50: '#F7F9FC', g100: '#EEF2F8', g200: '#DAE2EF',
  g400: '#8A9BBC', g500: '#5C6F8A', g700: '#273347', g800: '#182030',
  success: '#1A7A4A', successBg: '#E6F5EE', successBd: '#86EFAC',
  warn: '#C8982A', warnBg: '#FFF4D6', warnBd: '#FCD34D',
  danger: '#C0392B', dangerBg: '#FDECEA', dangerBd: '#FCA5A5',
  info: '#0057B8', infoBg: '#E8F0FB',
  purple: '#7C3AED', purpleBg: '#F5F3FF',
  teal: '#0D9488', tealBg: '#F0FDFA',
};

const fmt = (d) => d ? new Date(d).toLocaleDateString('fr-FR', { day:'2-digit', month:'short', year:'numeric' }) : '—';

/* ── UI atoms ── */
function Card({ children, style:sx={} }) {
  return <div style={{ background:'#fff', borderRadius:14, border:`1px solid ${T.g100}`, boxShadow:'0 2px 10px rgba(0,40,85,.06)', overflow:'hidden', ...sx }}>{children}</div>;
}

function SectionTitle({ icon, children }) {
  return (
    <div style={{ fontWeight:800, fontSize:'.8rem', color:T.navy, textTransform:'uppercase', letterSpacing:'.06em',
      padding:'10px 16px', borderBottom:`1px solid ${T.g100}`, display:'flex', alignItems:'center', gap:7, background:T.g50 }}>
      {icon && <span>{icon}</span>}{children}
    </div>
  );
}

function Toast({ msg, type, onHide }) {
  useEffect(() => { const t = setTimeout(onHide, 3500); return ()=>clearTimeout(t); }, [msg]);
  const colors = {
    success: { bg:T.successBg, color:T.success, bd:T.successBd },
    error:   { bg:T.dangerBg,  color:T.danger,  bd:T.dangerBd },
    info:    { bg:T.infoBg,    color:T.info,    bd:'#BFD7FF' },
  };
  const c = colors[type]||colors.info;
  return (
    <div style={{ position:'fixed', top:16, right:16, zIndex:2000, padding:'12px 18px', borderRadius:12,
      background:c.bg, color:c.color, border:`1.5px solid ${c.bd}`, fontWeight:700, fontSize:'.83rem',
      boxShadow:'0 8px 28px rgba(0,0,0,.15)', animation:'slideIn .3s ease', maxWidth:340 }}>
      <style>{`@keyframes slideIn{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)}}`}</style>
      {msg}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   SECTION RÈGLE PLATE
══════════════════════════════════════════════════════════════ */
function FormReglePlate({ audit, onSubmit, saving }) {
  const items = audit.checklistItems || audit.instruments || [];
  const CRITERES = [
    { key:'lisibiliteGraduations', label:'Lisibilité des graduations' },
    { key:'etatPhysique',          label:'État physique' },
    { key:'precisionMesure',       label:'Précision de mesure' },
    { key:'etiquetteValidite',     label:'Étiquette de validité' },
    { key:'proprete',              label:'Propreté' },
  ];

  const [resultats, setResultats] = useState(
    items.map(it=>({
      ligneId: it.id,
      numInstrument: it.numeroInstrument||it.numInstrument||'',
      typeInstrument: it.typeInstrument||'REGLE_PLATE',
      localisation: it.localisation||'',
      lisibiliteGraduations:'', etatPhysique:'', precisionMesure:'', etiquetteValidite:'', proprete:'',
      valeurMesuree:'', valeurReference:'', toleranceMax:'', observations:'',
    }))
  );
  const [dateRealisation, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [obsGen, setObsGen] = useState('');

  const set = (i,k,v) => setResultats(p=>p.map((x,j)=>j===i?{...x,[k]:v}:x));

  const allOk = resultats.every(r=>CRITERES.every(c=>r[c.key]));

  const handleSubmit = () => {
    onSubmit({
      type: 'FORMULAIRE',
      dateRealisation,
      observationsGenerales: obsGen,
      checklistItems: resultats.map(r=>({
        ligneId: r.ligneId,
        lisibiliteGraduations: r.lisibiliteGraduations||'NON_VERIFIE',
        etatPhysique: r.etatPhysique||'NON_VERIFIE',
        precisionMesure: r.precisionMesure||'NON_VERIFIE',
        etiquetteValidite: r.etiquetteValidite||'NON_VERIFIE',
        proprete: r.proprete||'NON_VERIFIE',
        valeurMesuree: r.valeurMesuree ? parseFloat(r.valeurMesuree) : null,
        valeurReference: r.valeurReference ? parseFloat(r.valeurReference) : null,
        toleranceMax: r.toleranceMax ? parseFloat(r.toleranceMax) : null,
        observations: r.observations||null,
      })),
    });
  };

  return (
    <div>
      {/* Infos générales */}
      <Card style={{ marginBottom:14 }}>
        <SectionTitle icon="ℹ️">Informations générales</SectionTitle>
        <div style={{ padding:'14px 16px', display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
          <div>
            <label style={lbl}>Date de réalisation *</label>
            <input type="date" style={inp} value={dateRealisation} onChange={e=>setDate(e.target.value)}/>
          </div>
          <div/>
          <div style={{ gridColumn:'1/-1' }}>
            <label style={lbl}>Observations générales</label>
            <textarea style={{ ...inp, minHeight:60, resize:'vertical' }} value={obsGen} onChange={e=>setObsGen(e.target.value)} placeholder="Observations générales sur l'audit…"/>
          </div>
        </div>
      </Card>

      {/* Instruments */}
      {resultats.length===0 ? (
        <Card><div style={{ padding:'2rem', textAlign:'center', color:T.g400, fontSize:'.88rem' }}>Aucun instrument défini pour cet audit.</div></Card>
      ) : resultats.map((r,i)=>(
        <Card key={i} style={{ marginBottom:12 }}>
          <div style={{ padding:'10px 16px', background:T.g50, borderBottom:`1px solid ${T.g100}`, display:'flex', alignItems:'center', gap:10 }}>
            <span style={{ fontWeight:800, color:T.navy, fontSize:'.88rem' }}>{r.numInstrument||`Instrument ${i+1}`}</span>
            <span style={{ background:T.tealBg, color:T.teal, fontSize:'.65rem', fontWeight:800, padding:'2px 8px', borderRadius:99 }}>
              {r.typeInstrument==='REGLE_PLATE'?'Règle plate':'Mètre ruban'}
            </span>
            {r.localisation && <span style={{ fontSize:'.72rem', color:T.g400 }}>{r.localisation}</span>}
            {/* Indicateur complétude */}
            {CRITERES.every(c=>r[c.key]) ? (
              <span style={{ marginLeft:'auto', background:T.successBg, color:T.success, fontSize:'.65rem', fontWeight:800, padding:'2px 8px', borderRadius:99, border:`1px solid ${T.successBd}` }}>✓ COMPLÉTÉ</span>
            ) : (
              <span style={{ marginLeft:'auto', background:T.g100, color:T.g400, fontSize:'.65rem', fontWeight:800, padding:'2px 8px', borderRadius:99 }}>À COMPLÉTER</span>
            )}
          </div>
          <div style={{ padding:'12px 16px' }}>
            {/* Critères */}
            <div style={{ marginBottom:12 }}>
              <div style={{ fontSize:'.68rem', fontWeight:700, color:T.g400, textTransform:'uppercase', letterSpacing:'.05em', marginBottom:8 }}>Critères de contrôle</div>
              {CRITERES.map(c=>(
                <div key={c.key} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'7px 0', borderBottom:`1px solid ${T.g50}` }}>
                  <span style={{ fontSize:'.82rem', color:T.g700 }}>{c.label}</span>
                  <div style={{ display:'flex', gap:7 }}>
                    {['CONFORME','NON_CONFORME','NON_VERIFIE'].map(val=>{
                      const colors = {
                        CONFORME: { bg:T.success, color:'#fff', bd:T.success },
                        NON_CONFORME: { bg:T.danger, color:'#fff', bd:T.danger },
                        NON_VERIFIE: { bg:T.g100, color:T.g500, bd:T.g200 },
                      };
                      const isSelected = r[c.key]===val;
                      const co = colors[val];
                      const labels = { CONFORME:'✓ Conforme', NON_CONFORME:'✗ Non conforme', NON_VERIFIE:'— N/V' };
                      return (
                        <button key={val} onClick={()=>set(i,c.key,val)}
                          style={{ padding:'.25rem .65rem', borderRadius:7, fontSize:'.69rem', fontWeight:700, cursor:'pointer', fontFamily:'inherit',
                            border:`1.5px solid ${isSelected?co.bd:T.g200}`,
                            background:isSelected?co.bg:'transparent',
                            color:isSelected?co.color:T.g400, transition:'all .12s' }}>
                          {labels[val]}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
            {/* Mesures */}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr) 1fr', gap:10 }}>
              <div>
                <label style={lbl}>Valeur mesurée (mm)</label>
                <input type="number" step="0.1" style={inp} value={r.valeurMesuree} onChange={e=>set(i,'valeurMesuree',e.target.value)} placeholder="Ex: 299.8"/>
              </div>
              <div>
                <label style={lbl}>Valeur référence (mm)</label>
                <input type="number" step="0.1" style={inp} value={r.valeurReference} onChange={e=>set(i,'valeurReference',e.target.value)} placeholder="Ex: 300.0"/>
              </div>
              <div>
                <label style={lbl}>Tolérance max (mm)</label>
                <input type="number" step="0.1" style={inp} value={r.toleranceMax} onChange={e=>set(i,'toleranceMax',e.target.value)} placeholder="Ex: 0.5"/>
              </div>
              <div>
                <label style={lbl}>Écart calculé</label>
                <div style={{ padding:'8px 10px', background:
                  r.valeurMesuree&&r.valeurReference&&r.toleranceMax?
                    (Math.abs(parseFloat(r.valeurMesuree)-parseFloat(r.valeurReference))<=parseFloat(r.toleranceMax)?T.successBg:T.dangerBg)
                    :T.g50,
                  borderRadius:8, border:`1px solid ${T.g200}`, fontSize:'.82rem', fontWeight:700,
                  color: r.valeurMesuree&&r.valeurReference&&r.toleranceMax?
                    (Math.abs(parseFloat(r.valeurMesuree)-parseFloat(r.valeurReference))<=parseFloat(r.toleranceMax)?T.success:T.danger)
                    :T.g400 }}>
                  {r.valeurMesuree&&r.valeurReference ? `${Math.abs(parseFloat(r.valeurMesuree)-parseFloat(r.valeurReference)).toFixed(2)} mm` : '—'}
                </div>
              </div>
            </div>
            <div style={{ marginTop:9 }}>
              <label style={lbl}>Observations</label>
              <input style={inp} value={r.observations} onChange={e=>set(i,'observations',e.target.value)} placeholder="Observations particulières…"/>
            </div>
          </div>
        </Card>
      ))}

      {/* Récapitulatif */}
      {resultats.length>0 && (
        <Card style={{ marginBottom:14, border:`1.5px solid ${allOk?T.successBd:T.warnBd}` }}>
          <div style={{ padding:'12px 16px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <div>
              <div style={{ fontWeight:700, fontSize:'.82rem', color:T.navy }}>Récapitulatif</div>
              <div style={{ fontSize:'.74rem', color:T.g400, marginTop:3 }}>
                {resultats.filter(r=>CRITERES.every(c=>r[c.key])).length} / {resultats.length} instruments complétés
              </div>
            </div>
            <div style={{ display:'flex', gap:10, fontSize:'.78rem', fontWeight:700 }}>
              <span style={{ color:T.success }}>✓ {resultats.filter(r=>CRITERES.some(c=>r[c.key]==='CONFORME')).length} conformes</span>
              <span style={{ color:T.danger }}>✗ {resultats.filter(r=>CRITERES.some(c=>r[c.key]==='NON_CONFORME')).length} non conformes</span>
            </div>
          </div>
        </Card>
      )}

      <button onClick={handleSubmit} disabled={saving||!dateRealisation}
        style={{ width:'100%', padding:'13px', borderRadius:12, border:'none', background:`linear-gradient(135deg,${T.teal},#0F766E)`, color:'#fff', fontSize:'.9rem', fontWeight:800, cursor:saving?'not-allowed':'pointer', opacity:saving?.7:1, fontFamily:'inherit' }}>
        {saving ? '⏳ Enregistrement…' : '✓ Valider l\'audit règle plate'}
      </button>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   SECTION MAGASIN EXPORT
══════════════════════════════════════════════════════════════ */
function FormExport({ audit, onSubmit, saving }) {
  const details = audit.details || [];
  const [dateRealisation, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [obsGen, setObsGen] = useState('');
  const [resultats, setResultats] = useState(
    details.map(d=>({
      detailId: d.id,
      numeroSerie: d.numeroSerie||'',
      numeroCaisse: d.numeroCaisse||'',
      // Critères de contrôle export
      emballageConforme:'', etiquetteConforme:'', quantiteConforme:'', etatProduitConforme:'', documentConforme:'',
      observations:'', poids:'', remarques:'',
    }))
  );

  const CRITERES_EXPORT = [
    { key:'emballageConforme',     label:'Emballage conforme' },
    { key:'etiquetteConforme',     label:'Étiquette CE conforme' },
    { key:'quantiteConforme',      label:'Quantité conforme' },
    { key:'etatProduitConforme',   label:'État du produit conforme' },
    { key:'documentConforme',      label:'Documentation conforme' },
  ];

  const set = (i,k,v) => setResultats(p=>p.map((x,j)=>j===i?{...x,[k]:v}:x));

  const allOk = resultats.every(r=>CRITERES_EXPORT.every(c=>r[c.key]));

  const handleSubmit = () => {
    onSubmit({
      type: 'FORMULAIRE',
      dateRealisation,
      observationsGenerales: obsGen,
      details: resultats.map(r=>({
        detailId: r.detailId,
        emballageConforme: r.emballageConforme==='OUI',
        etiquetteConforme: r.etiquetteConforme==='OUI',
        quantiteConforme: r.quantiteConforme==='OUI',
        etatProduitConforme: r.etatProduitConforme==='OUI',
        documentConforme: r.documentConforme==='OUI',
        poids: r.poids?parseFloat(r.poids):null,
        observations: r.observations||r.remarques||null,
      })),
    });
  };

  return (
    <div>
      <Card style={{ marginBottom:14 }}>
        <SectionTitle icon="ℹ️">Informations générales</SectionTitle>
        <div style={{ padding:'14px 16px', display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
          <div>
            <label style={lbl}>Date de réalisation *</label>
            <input type="date" style={inp} value={dateRealisation} onChange={e=>setDate(e.target.value)}/>
          </div>
          <div>
            <label style={lbl}>Semaine export</label>
            <input style={{ ...inp, background:T.g50, color:T.g500 }} value={audit.semaineExport||'—'} readOnly/>
          </div>
          <div style={{ gridColumn:'1/-1' }}>
            <label style={lbl}>Observations générales</label>
            <textarea style={{ ...inp, minHeight:55, resize:'vertical' }} value={obsGen} onChange={e=>setObsGen(e.target.value)} placeholder="Observations générales…"/>
          </div>
        </div>
      </Card>

      {resultats.length===0 ? (
        <Card><div style={{ padding:'2rem', textAlign:'center', color:T.g400 }}>Aucune série/caisse définie.</div></Card>
      ) : resultats.map((r,i)=>(
        <Card key={i} style={{ marginBottom:12 }}>
          <div style={{ padding:'10px 16px', background:T.g50, borderBottom:`1px solid ${T.g100}`, display:'flex', alignItems:'center', gap:10 }}>
            <span style={{ fontSize:'1.1rem' }}>📦</span>
            <div>
              <span style={{ fontWeight:800, color:T.navy, fontSize:'.88rem' }}>Série : {r.numeroSerie||`Série ${i+1}`}</span>
              {r.numeroCaisse && <span style={{ fontSize:'.73rem', color:T.g400, marginLeft:8 }}>Caisse : {r.numeroCaisse}</span>}
            </div>
            {CRITERES_EXPORT.every(c=>r[c.key]) ? (
              <span style={{ marginLeft:'auto', background:T.successBg, color:T.success, fontSize:'.65rem', fontWeight:800, padding:'2px 8px', borderRadius:99, border:`1px solid ${T.successBd}` }}>✓ COMPLÉTÉ</span>
            ) : (
              <span style={{ marginLeft:'auto', background:T.g100, color:T.g400, fontSize:'.65rem', fontWeight:800, padding:'2px 8px', borderRadius:99 }}>À COMPLÉTER</span>
            )}
          </div>
          <div style={{ padding:'12px 16px' }}>
            <div style={{ marginBottom:12 }}>
              <div style={{ fontSize:'.68rem', fontWeight:700, color:T.g400, textTransform:'uppercase', letterSpacing:'.05em', marginBottom:8 }}>Critères de contrôle</div>
              {CRITERES_EXPORT.map(c=>(
                <div key={c.key} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'7px 0', borderBottom:`1px solid ${T.g50}` }}>
                  <span style={{ fontSize:'.82rem', color:T.g700 }}>{c.label}</span>
                  <div style={{ display:'flex', gap:7 }}>
                    {['OUI','NON','N/A'].map(val=>{
                      const isSelected = r[c.key]===val;
                      const color = val==='OUI'?T.success:val==='NON'?T.danger:T.g400;
                      const bg = val==='OUI'?T.successBg:val==='NON'?T.dangerBg:T.g100;
                      return (
                        <button key={val} onClick={()=>set(i,c.key,val)}
                          style={{ padding:'.25rem .65rem', borderRadius:7, fontSize:'.7rem', fontWeight:700, cursor:'pointer', fontFamily:'inherit',
                            border:`1.5px solid ${isSelected?color:T.g200}`,
                            background:isSelected?bg:'transparent',
                            color:isSelected?color:T.g400 }}>
                          {val==='OUI'?'✓ Oui':val==='NON'?'✗ Non':'—'}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
              <div>
                <label style={lbl}>Poids mesuré (kg)</label>
                <input type="number" step="0.01" style={inp} value={r.poids} onChange={e=>set(i,'poids',e.target.value)} placeholder="Ex: 12.5"/>
              </div>
              <div>
                <label style={lbl}>Observations</label>
                <input style={inp} value={r.observations} onChange={e=>set(i,'observations',e.target.value)} placeholder="Anomalies détectées…"/>
              </div>
            </div>
          </div>
        </Card>
      ))}

      {resultats.length>0 && (
        <Card style={{ marginBottom:14, border:`1.5px solid ${allOk?T.successBd:T.warnBd}` }}>
          <div style={{ padding:'12px 16px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <div>
              <div style={{ fontWeight:700, fontSize:'.82rem', color:T.navy }}>Récapitulatif</div>
              <div style={{ fontSize:'.74rem', color:T.g400, marginTop:3 }}>
                {resultats.filter(r=>CRITERES_EXPORT.every(c=>r[c.key])).length} / {resultats.length} séries complétées
              </div>
            </div>
            <div style={{ display:'flex', gap:10, fontSize:'.78rem', fontWeight:700 }}>
              <span style={{ color:T.success }}>✓ {resultats.filter(r=>r.emballageConforme==='OUI').length} ok</span>
              <span style={{ color:T.danger }}>✗ {resultats.filter(r=>Object.values(r).includes('NON')).length} non-conformes</span>
            </div>
          </div>
        </Card>
      )}

      <button onClick={handleSubmit} disabled={saving||!dateRealisation}
        style={{ width:'100%', padding:'13px', borderRadius:12, border:'none', background:`linear-gradient(135deg,${T.purple},#6D28D9)`, color:'#fff', fontSize:'.9rem', fontWeight:800, cursor:saving?'not-allowed':'pointer', opacity:saving?.7:1, fontFamily:'inherit' }}>
        {saving ? '⏳ Enregistrement…' : '✓ Valider l\'audit magasin export'}
      </button>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   PAGE PRINCIPALE — routeur regle-plate / export
══════════════════════════════════════════════════════════════ */
export default function SaisirResultatAuditSpecial() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const isExport = location.pathname.includes('/export/');
  const isRegle  = location.pathname.includes('/regle-plate/');

  const [audit, setAudit] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [mode, setMode] = useState('form'); // 'form' | 'import'
  const [importFile, setImportFile] = useState(null);
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    const fetch_ = isExport
      ? auditSpecialAPI.mesDetailsExport(id)
      : auditSpecialAPI.mesAuditsReglePlates().then(r=>({ data:(r.data||[]).find(a=>String(a.id)===String(id))||null }));

    fetch_.then(r=>setAudit(r.data)).catch(()=>setAudit(null)).finally(()=>setLoading(false));
  }, [id, isExport]);

  const handleImport = async () => {
    if (!importFile) return;
    setImporting(true);
    try {
      await auditSpecialAPI.validerImport(id, importFile);
      setToast({ msg:'Rapport importé avec succès ✓', type:'success' });
      setTimeout(()=>navigate(-1), 1600);
    } catch(e) { setToast({ msg:e?.response?.data?.message||'Erreur import', type:'error' }); }
    setImporting(false);
  };

  const handleSubmitForm = async (data) => {
    setSaving(true);
    try {
      await auditSpecialAPI.validerFormulaire(id, data);
      setToast({ msg:'Résultats enregistrés — Audit terminé ✓', type:'success' });
      setTimeout(()=>navigate(-1), 1600);
    } catch(e) { setToast({ msg:e?.response?.data?.message||'Erreur enregistrement', type:'error' }); }
    setSaving(false);
  };

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:400, fontFamily:"'DM Sans',sans-serif" }}>
      <div style={{ textAlign:'center' }}>
        <div style={{ width:36, height:36, border:`3px solid ${T.g100}`, borderTopColor:T.navy, borderRadius:'50%', animation:'spin .8s linear infinite', margin:'0 auto 10px' }}/>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        <p style={{ color:T.g400 }}>Chargement…</p>
      </div>
    </div>
  );

  if (!audit) return (
    <div style={{ textAlign:'center', padding:'4rem', fontFamily:"'DM Sans',sans-serif", color:T.g400 }}>
      Audit introuvable.
      <br/><button onClick={()=>navigate(-1)} style={{ marginTop:14, background:T.navy, color:'#fff', border:'none', borderRadius:10, padding:'9px 20px', cursor:'pointer', fontFamily:'inherit', fontWeight:700 }}>Retour</button>
    </div>
  );

  const accentColor = isExport ? T.purple : T.teal;
  const icon = isExport ? '📦' : '📏';
  const typeLabel = isExport ? 'Audit Magasin Export' : 'Audit Règle Plate';

  return (
    <div style={{ fontFamily:"'DM Sans',sans-serif", background:T.g50, minHeight:'100vh', padding:'1.5rem' }}>
      {toast && <Toast msg={toast.msg} type={toast.type} onHide={()=>setToast(null)}/>}

      {/* Retour */}
      <button onClick={()=>navigate(-1)} style={{ background:T.infoBg, border:`1px solid #D6E5FB`, color:T.blueM, cursor:'pointer', fontSize:'.81rem', fontWeight:700, padding:'6px 12px', fontFamily:'inherit', marginBottom:14, borderRadius:9 }}>
        ← Retour à mes audits
      </button>

      {/* Header */}
      <div style={{ background:`linear-gradient(135deg, ${T.navy}, ${accentColor})`, borderRadius:16, padding:'16px 20px', marginBottom:18, display:'flex', alignItems:'center', gap:14 }}>
        <div style={{ fontSize:'2rem' }}>{icon}</div>
        <div>
          <div style={{ fontWeight:900, color:'#fff', fontSize:'1.2rem' }}>{audit.reference||audit.nom||`Audit #${id}`}</div>
          <div style={{ fontSize:'.78rem', color:'rgba(255,255,255,.7)', marginTop:3 }}>
            {typeLabel} · {audit.plantNom||''} · {fmt(audit.datePrevue)}
          </div>
        </div>
        <div style={{ marginLeft:'auto' }}>
          <span style={{ background:'rgba(255,255,255,.2)', color:'#fff', fontSize:'.72rem', fontWeight:800, padding:'5px 12px', borderRadius:99 }}>
            {(audit.statut||'').replace('_',' ')}
          </span>
        </div>
      </div>

      {/* Infos audit */}
      <Card style={{ marginBottom:16 }}>
        <SectionTitle icon="📋">Détails de l'audit</SectionTitle>
        <div style={{ padding:'12px 16px', display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(150px,1fr))', gap:12 }}>
          {[
            { l:'Référence', v:audit.reference||`#${id}` },
            { l:'Plant', v:audit.plantNom||'—' },
            { l:'Auditeur', v:audit.auditeurNom||'—' },
            { l:'Date prévue', v:fmt(audit.datePrevue) },
            isExport && { l:'Semaine export', v:audit.semaineExport||'—' },
            !isExport && { l:'Nb instruments', v:audit.nbInstruments||(audit.checklistItems?.length||audit.instruments?.length)||'—' },
          ].filter(Boolean).map(x=>(
            <div key={x.l}>
              <div style={{ fontSize:'.67rem', fontWeight:700, color:T.g400, textTransform:'uppercase', letterSpacing:'.05em', marginBottom:3 }}>{x.l}</div>
              <div style={{ fontSize:'.85rem', fontWeight:700, color:T.navy }}>{x.v}</div>
            </div>
          ))}
        </div>
      </Card>

      {/* Tabs : Formulaire / Importer PDF */}
      <div style={{ display:'flex', gap:0, background:T.g50, borderRadius:11, padding:3, marginBottom:16, border:`1px solid ${T.g100}`, width:'fit-content' }}>
        {[{key:'form',label:'📝 Remplir le formulaire'},{key:'import',label:'📁 Importer un rapport PDF'}].map(t=>(
          <button key={t.key} onClick={()=>setMode(t.key)}
            style={{ padding:'8px 18px', borderRadius:9, border:'none', fontFamily:'inherit', fontSize:'.8rem', fontWeight:700, cursor:'pointer', transition:'all .2s',
              background:mode===t.key?'#fff':'transparent', color:mode===t.key?T.navy:T.g400,
              boxShadow:mode===t.key?'0 1px 4px rgba(0,0,0,.1)':'none' }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Mode import */}
      {mode==='import' && (
        <Card style={{ marginBottom:14 }}>
          <SectionTitle icon="📁">Importer le rapport</SectionTitle>
          <div style={{ padding:'16px' }}>
            <div style={{ border:`2px dashed ${T.g200}`, borderRadius:10, padding:'2rem', textAlign:'center', marginBottom:14, background:importFile?T.successBg:T.g50 }}>
              {importFile ? (
                <div>
                  <div style={{ fontSize:'2rem', marginBottom:8 }}>✅</div>
                  <div style={{ fontWeight:700, color:T.success }}>{importFile.name}</div>
                  <button onClick={()=>setImportFile(null)} style={{ marginTop:8, background:'none', border:'none', color:T.danger, cursor:'pointer', fontSize:'.8rem', fontWeight:700 }}>Supprimer</button>
                </div>
              ) : (
                <div>
                  <div style={{ fontSize:'2.5rem', marginBottom:10 }}>📁</div>
                  <div style={{ color:T.g400, fontSize:'.85rem', marginBottom:10 }}>Glissez votre rapport PDF ici ou cliquez pour sélectionner</div>
                  <label style={{ cursor:'pointer' }}>
                    <input type="file" hidden accept=".pdf,.xlsx,.xls" onChange={e=>setImportFile(e.target.files[0])}/>
                    <span style={{ background:T.navy, color:'#fff', padding:'8px 18px', borderRadius:9, fontSize:'.82rem', fontWeight:700 }}>Choisir un fichier</span>
                  </label>
                </div>
              )}
            </div>
            <button onClick={handleImport} disabled={!importFile||importing}
              style={{ width:'100%', padding:'12px', borderRadius:11, border:'none', background:importFile?accentColor:T.g200, color:importFile?'#fff':T.g400, fontSize:'.88rem', fontWeight:800, cursor:importFile&&!importing?'pointer':'not-allowed', fontFamily:'inherit' }}>
              {importing?'⏳ Import en cours…':'📤 Valider l\'import du rapport'}
            </button>
          </div>
        </Card>
      )}

      {/* Mode formulaire */}
      {mode==='form' && (
        isExport
          ? <FormExport audit={audit} onSubmit={handleSubmitForm} saving={saving}/>
          : <FormReglePlate audit={audit} onSubmit={handleSubmitForm} saving={saving}/>
      )}
    </div>
  );
}

/* Styles partagés */
const lbl = { display:'block', fontSize:'.69rem', fontWeight:700, color:T.g500, textTransform:'uppercase', letterSpacing:'.05em', marginBottom:4 };
const inp = { width:'100%', padding:'8px 11px', border:`1.5px solid ${T.g200}`, borderRadius:8, fontSize:'.83rem', fontFamily:'inherit', background:'#fff', boxSizing:'border-box', outline:'none' };