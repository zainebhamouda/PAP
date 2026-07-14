// ExamenPage.jsx — avec QCM multi-réponses Partie 2 + useExamLock
import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../../services/api';
import { useExamLock } from '../../hooks/useExamLock';

const A = {
  getEnCours:         ()          => api.get('/auditeur/certification/en-cours'),
  getDashboard:       ()          => api.get('/auditeur/dashboard'),
  demarrer:           ()          => api.post('/auditeur/certification/demarrer'),
  passerAuTest:       ()          => api.post('/auditeur/certification/passer-au-test'),
  getQuestion:        (sid)       => api.get(`/auditeur/session/${sid}/question`),
  repondre:           (sid, body) => api.post(`/auditeur/session/${sid}/repondre`, body),
  terminer:           (sid)       => api.post(`/auditeur/session/${sid}/terminer`),
  getTestPratique:    ()          => api.get('/auditeur/certification/pratique'),
  getCertificat:      (pid)       => api.get(`/auditeur/certification/${pid}/certificat`, { responseType:'blob' }),
  getDefautsRef:      ()          => api.get('/auditeur/defauts-reference'),
  getExpertsDispo:    ()          => api.get('/auditeur/experts-disponibles'),
  envoyerRapportPdf:  (pid, fd)   => api.post(`/auditeur/certification/${pid}/rapport-pdf`, fd, { headers:{'Content-Type':'multipart/form-data'} }),
};

function fileUrl(path) {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  const base = (import.meta.env?.VITE_API_URL || 'http://localhost:8080/api').replace('/api', '');
  return `${base}/${path.replace(/^\//, '')}`;
}

function fmtChrono(sec) {
  const m = Math.floor(sec / 60), s = sec % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function scorePct(s) { return s == null ? 0 : Math.round((s / 20) * 100); }

function Confetti({ active }) {
  const ref = useRef();
  useEffect(() => {
    if (!active || !ref.current) return;
    const c = ref.current, ctx = c.getContext('2d');
    c.width = window.innerWidth; c.height = window.innerHeight;
    const COLS = ['#002855','#2563EB','#FCD34D','#4ADE80','#F472B6'];
    const pts = Array.from({ length: 90 }, () => ({
      x: Math.random() * c.width, y: Math.random() * -c.height,
      r: Math.random() * 6 + 3, d: Math.random() * 100 + 10,
      col: COLS[~~(Math.random() * COLS.length)], tilt: 0, ts: Math.random() * .1 + .04,
    }));
    let raf;
    const draw = () => {
      ctx.clearRect(0, 0, c.width, c.height);
      pts.forEach(p => {
        ctx.beginPath(); ctx.fillStyle = p.col;
        ctx.ellipse(p.x, p.y, p.r, p.r * .4, p.tilt, 0, Math.PI * 2); ctx.fill();
        p.y += Math.cos(p.d) + 2; p.x += Math.sin(p.d) * .5; p.tilt += p.ts;
        if (p.y > c.height) { p.y = -10; p.x = Math.random() * c.width; }
      });
      raf = requestAnimationFrame(draw);
    };
    draw();
    const t = setTimeout(() => cancelAnimationFrame(raf), 5000);
    return () => { cancelAnimationFrame(raf); clearTimeout(t); };
  }, [active]);
  if (!active) return null;
  return <canvas ref={ref} style={{ position:'fixed', inset:0, zIndex:9999, pointerEvents:'none' }}/>;
}

function AutocompleteInput({ value, onChange, defautsRef, placeholder, disabled }) {
  const [suggestions, setSuggestions] = useState([]);
  const [open, setOpen] = useState(false);
  const ref = useRef();

  const handleChange = (v) => {
    onChange(v);
    if (v.length >= 1 && defautsRef.length > 0) {
      const q = v.toLowerCase();
      const filtered = defautsRef.filter(d =>
        d.code?.toLowerCase().startsWith(q) || d.descriptionFr?.toLowerCase().includes(q)
      ).slice(0, 10);
      setSuggestions(filtered); setOpen(filtered.length > 0);
    } else { setSuggestions([]); setOpen(false); }
  };

  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  return (
    <div ref={ref} style={{ position:'relative' }}>
      <input value={value} onChange={e => handleChange(e.target.value)}
        placeholder={placeholder || 'Tapez le code ou la description…'} disabled={disabled}
        style={{ width:'100%', background:'#F8FAFC', border:'1px solid #a5adba', borderRadius:'6px', padding:'.65rem .95rem', color:'#0C1A30', fontFamily:"'Sora',sans-serif", fontWeight:600, fontSize:'.88rem', outline:'none', boxSizing:'border-box' }}
        onFocus={() => { if (suggestions.length > 0) setOpen(true); }} />
      {open && suggestions.length > 0 && (
        <div style={{ position:'absolute', top:'100%', left:0, right:0, zIndex:500, background:'#fff', border:'1.5px solid #E2E8F0', borderRadius:10, boxShadow:'0 8px 24px rgba(0,0,0,.12)', overflow:'hidden', marginTop:4 }}>
          {suggestions.map((d, i) => (
            <button key={i} onMouseDown={() => { onChange(d.descriptionFr); setOpen(false); }}
              style={{ width:'100%', textAlign:'left', padding:'9px 14px', border:'none', background:'transparent', cursor:'pointer', fontFamily:"'Sora',sans-serif", fontSize:'.85rem', fontWeight:600, color:'#0C1A30', borderBottom:i<suggestions.length-1?'1px solid #F8FAFC':'none', display:'flex', flexDirection:'column', gap:2 }}
              onMouseEnter={e => e.currentTarget.style.background='#F0F5FF'}
              onMouseLeave={e => e.currentTarget.style.background='transparent'}>
              <span>
                <span style={{ background:'#EFF6FF', padding:'2px 6px', borderRadius:4, marginRight:8, fontSize:'.7rem', fontFamily:'monospace' }}>{d.code}</span>
                {d.descriptionFr}
              </span>
              {d.descriptionEng && <span style={{ fontSize:'.7rem', color:'#9CA3AF' }}>{d.descriptionEng}</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

const STEPS = [
  { id:'FORMATION', label:'Formation',      num:1 },
  { id:'THEO',      label:'Test théorique', num:2 },
  { id:'PRATIQUE',  label:'Test pratique',  num:3 },
  { id:'CERTIF',    label:'Certification',  num:4 },
];
const LETTERS = ['A','B','C','D','E'];

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&display=swap');
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
body{background:transparent}
.ex{font-family:'Sora',sans-serif;min-height:100%;display:flex;flex-direction:column;color:#0C1A30;background:#ffffff;}
@keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}
@keyframes slideIn{from{opacity:0;transform:translateX(20px)}to{opacity:1;transform:none}}
@keyframes pop{from{opacity:0;transform:scale(.7)}to{opacity:1;transform:scale(1)}}
@keyframes spin{to{transform:rotate(360deg)}}
@keyframes fadeIn{from{opacity:0}to{opacity:1}}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}
@keyframes chronoPulse{0%,100%{transform:scale(1)}50%{transform:scale(1.04)}}
.ex-bar{background:linear-gradient(135deg,#4676bf 0%,#1A3C6E 50%,#5597e8 100%);padding:.85rem 0 .65rem;position:sticky;top:0;z-index:100;border-bottom:2px solid rgba(37,99,235,.3);border-radius:20px;overflow:hidden;box-shadow:0 12px 40px rgba(11,35,71,.2),inset 0 1px 0 rgba(255,255,255,.08);margin:12px 12px 0;}
.ex-bar-question{background:rgba(255,255,255,.12);padding:4px 12px;border-radius:20px;font-size:.8rem;font-weight:700;color:white;letter-spacing:.3px;font-family:'Inter',sans-serif;}
.ex-bar-steps{display:flex;align-items:center;justify-content:center;gap:0;padding:0 2rem;max-width:900px;margin:0 auto;flex-wrap:nowrap;}
.ex-bar-connector{flex:1;max-width:80px;height:2px;background:rgba(255,255,255,.18);border-radius:99px;margin:0 8px;position:relative;overflow:hidden;}
.ex-bar-connector-fill{position:absolute;inset:0;background:linear-gradient(90deg,#60A5FA,#fff);border-radius:99px;transition:width .5s ease;}
.ex-bar-step-item{display:flex;align-items:center;gap:.55rem;flex-shrink:0;}
.ex-bar-bullet{width:40px;height:40px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;z-index:2;transition:all .3s cubic-bezier(.34,1.4,.64,1);box-shadow:0 2px 8px rgba(0,0,0,.15);}
.ex-bar-bullet-pend{background:rgba(255,255,255,.1);border:2px solid rgba(255,255,255,.22);}
.ex-bar-bullet-act{background:#fff;border:2px solid #fff;box-shadow:0 0 0 4px rgba(255,255,255,.2),0 4px 12px rgba(0,0,0,.2);}
.ex-bar-bullet-done{background:#059669;border:2px solid #059669;box-shadow:0 0 0 4px rgba(5,150,105,.22),0 4px 12px rgba(5,150,105,.3);}
.ex-bar-label{font-size:.76rem;font-weight:600;color:rgba(255,255,255,.7);white-space:nowrap;font-family:'Inter',sans-serif;letter-spacing:.2px;}
.ex-bar-label-act{color:#fff;font-weight:700;text-shadow:0 1px 6px rgba(0,0,0,.2);}
.ex-bar-label-done{color:rgba(255,255,255,.85);}
.ex-bar-timer{display:flex;align-items:center;gap:7px;font-size:.82rem;font-weight:800;padding:4px 14px;border-radius:10px;white-space:nowrap;font-family:'Inter',sans-serif;}
.ex-bar-timer-ok{background:rgba(59,130,246,.25);color:#93C5FD;}
.ex-bar-timer-mid{background:rgba(251,191,36,.25);color:#FCD34D;animation:chronoPulse 1.5s ease-in-out infinite;}
.ex-bar-timer-low{background:rgba(239,68,68,.3);color:#FCA5A5;animation:chronoPulse .7s ease-in-out infinite;}
.ex-bar-progress-outer{position:absolute;bottom:0;left:0;right:0;height:3px;background:rgba(0,0,0,.2);}
.ex-bar-progress-inner{height:100%;background:linear-gradient(90deg,#60A5FA 0%,#fff 100%);transition:width .5s cubic-bezier(.4,0,.2,1);}
.ex-main{flex:1;display:flex;justify-content:center;align-items:stretch;padding:22px 24px;overflow-y:auto}
.ex-wrap{width:100%;max-width:1100px;animation:fadeUp .35s ease;display:flex;flex-direction:column}
.ex-center{flex:1;display:flex;align-items:flex-start;justify-content:center;padding:2rem;overflow-y:auto}
.ex-big{background:#fff;border-radius:22px;border:1px solid #E8EDF7;box-shadow:0 5px 0 #D6DFED;padding:2.5rem 2.25rem;max-width:500px;width:100%;text-align:center;animation:fadeUp .4s ease}
.ex-big-ico{font-size:3.5rem;margin-bottom:.875rem;display:block;animation:pop .6s cubic-bezier(.34,1.56,.64,1)}
.ex-big-title{font-size:1.55rem;font-weight:800;color:#0C1A30;margin-bottom:.4rem}
.ex-big-sub{font-size:.87rem;color:#64748B;margin-bottom:1.5rem;line-height:1.6}
.ex-card{background:#fff;border-radius:22px;border:1px solid #EDF1F7;box-shadow:0 2px 0 #E8EDF5,0 6px 32px rgba(0,40,85,.04);padding:2.25rem 2.5rem;animation:slideIn .3s cubic-bezier(.34,1.15,.64,1);flex:1;display:flex;flex-direction:column}
.ex-card-tag{display:inline-flex;align-items:center;gap:7px;padding:5px 13px;border-radius:99px;font-size:.68rem;font-weight:800;text-transform:uppercase;letter-spacing:.08em;margin-bottom:.875rem}
.ex-q-text{font-size:1.05rem;font-weight:700;color:#0C1A30;line-height:1.65;margin-bottom:.6rem}
.ex-img-layout{display:grid;grid-template-columns:55% 45%;gap:0;align-items:stretch;margin-bottom:1rem;border-radius:16px;overflow:hidden;border:1.5px solid #b0bccc;flex:1;min-height:0}
.ex-img-col{background:#F4F7FB;border-right:1.5px solid #b0bccc;display:flex;flex-direction:column;height:100%}
.ex-ans-col{padding:.75rem 1rem;display:flex;flex-direction:column;gap:6px;background:#fff;overflow-y:auto}
.ex-img-wrap{width:85%;flex:1;border-radius:0;overflow:hidden;display:flex;align-items:center;justify-content:center;min-height:0}
.ex-img-wrap img{width:100%;height:100%;display:block;object-fit:contain;background:#F4F7FB;padding:1rem}
.ex-img-ph{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;color:#94A3B8;font-size:.9rem;font-weight:600;padding:3rem}
.ex-defauts{display:flex;flex-direction:column;gap:8px}
.ex-defaut{display:flex;align-items:center;gap:13px;padding:14px 16px;border-radius:12px;border:2px solid #D0D9E8;background:#fff;cursor:pointer;transition:all .13s;font-family:'Sora',sans-serif;font-size:.88rem;font-weight:600;color:#1A2F50;text-align:left;width:100%}
.ex-defaut:hover:not(:disabled){border-color:#93C5FD;background:#EFF6FF;transform:translateY(-1px)}
.ex-defaut.sel{border-color:#0B1E3D;background:#F0F5FF}
.ex-defaut.skip{border-color:#F1F5F9;background:#FAFBFD;color:#D1D5DB}
.ex-defaut-dot{width:13px;height:13px;border-radius:50%;border:2px solid currentColor;flex-shrink:0}
.ex-defaut.sel .ex-defaut-dot{background:#0B1E3D;border-color:#0B1E3D}
.ex-opts{display:flex;flex-direction:column;gap:9px;margin-bottom:1.25rem}
.ex-opt{display:flex;align-items:center;gap:12px;padding:12px 15px;border-radius:14px;border:2px solid #E8EDF7;background:#fff;cursor:pointer;transition:all .13s;font-family:'Sora',sans-serif;font-size:.88rem;font-weight:600;color:#1A2F50;text-align:left;width:100%}
.ex-opt:hover:not(:disabled){border-color:#93C5FD;background:#EFF6FF;transform:translateY(-1px)}
.ex-opt.sel{border-color:#0B1E3D;background:#F0F5FF}
.ex-opt.skip{border-color:#F1F5F9;background:#FAFBFD;color:#D1D5DB}
.ex-opt-letter{width:29px;height:29px;border:2px solid #D1D9E8;display:flex;align-items:center;justify-content:center;font-size:.72rem;font-weight:800;color:#A8B8D8;flex-shrink:0;transition:all .13s}
.ex-opt.sel .ex-opt-letter{background:#0B1E3D;border-color:#0B1E3D;color:#fff}
.ex-correction{display:flex;align-items:flex-start;gap:10px;padding:.875rem 1rem;border-radius:12px;margin-top:.875rem;animation:fadeUp .2s ease;font-size:.82rem;font-weight:600}
.ex-correction.ok{background:#ECFDF5;border:1.5px solid #A7F3D0;color:#065F46}
.ex-correction.exp{background:#FFF7ED;border:1.5px solid #FED7AA;color:#92400E}
.ex-foot{display:flex;justify-content:space-between;align-items:center;margin-top:0;padding-top:0;border-top:none}
.btn{padding:11px 26px;border-radius:12px;font-size:.9rem;font-weight:700;border:none;cursor:pointer;transition:all .14s;font-family:'Sora',sans-serif;display:inline-flex;align-items:center;gap:8px;}
.btn-navy{background:#0B1E3D;color:#fff;box-shadow:0 4px 0 #071529}
.btn-navy:hover{background:#122B56;transform:translateY(-1px)}
.btn-navy:disabled{background:#9CA3AF;box-shadow:0 3px 0 #6B7280;cursor:not-allowed;transform:none}
.btn-blue{background:#2563EB;color:#fff;box-shadow:0 4px 0 #1A4EC0}
.btn-blue:hover{background:#3B82F6;transform:translateY(-1px)}
.btn-blue:disabled{opacity:.5;cursor:not-allowed}
.btn-green{background:#059669;color:#fff;box-shadow:0 4px 0 #047857}
.btn-green:hover{background:#10B981;transform:translateY(-1px)}
.btn-purple{background:#7C3AED;color:#fff;box-shadow:0 4px 0 #5B21B6}
.btn-purple:hover{background:#8B5CF6;transform:translateY(-1px)}
.btn-purple:disabled{opacity:.5;cursor:not-allowed;transform:none}
.btn-ghost{background:#c6ceda;color:#4A5568;border:2px solid #a4aebc}
.btn-ghost:hover{background:#E8EDF7}
.ex-info-grid{display:flex;flex-direction:column;gap:7px;margin-bottom:1.5rem;text-align:left}
.ex-info-row{display:flex;align-items:center;justify-content:space-between;padding:9px 14px;background:#F8FAFC;border-radius:10px;border:1px solid #F0F4FA}
.ex-ik{font-size:.78rem;font-weight:600;color:#64748B}
.ex-iv{font-size:.78rem;font-weight:800;color:#1A2F50}
.ex-score-compare{background:#F8FAFC;border:1.5px solid #E2E8F0;border-radius:14px;padding:1.25rem;margin-bottom:1.25rem}
.ex-score-cols{display:flex;gap:1rem;margin-bottom:12px}
.ex-score-col{flex:1;text-align:center}
.ex-score-big{font-size:2.2rem;font-weight:800;line-height:1}
.ex-score-lbl{font-size:.7rem;font-weight:700;color:#9CA3AF;text-transform:uppercase;margin-top:4px}
.ex-score-divider{width:1px;background:#E2E8F0;margin:0 .5rem}
.ex-bar-h{height:8px;background:#EEF2F8;border-radius:99px;overflow:hidden;margin-bottom:6px}
.ex-bar-h-fill{height:100%;border-radius:99px;transition:width .8s ease}
.ex-result-badge{display:inline-flex;align-items:center;gap:5px;padding:4px 12px;border-radius:99px;font-size:.72rem;font-weight:800}
.certif-card{background:linear-gradient(135deg,#0B1E3D 0%,#163561 60%,#1A4A8A 100%);border-radius:20px;padding:2rem;position:relative;overflow:hidden;margin-bottom:1.25rem}
.ex-err{background:#FEF2F2;border:1.5px solid #FECACA;border-radius:11px;padding:.7rem 1rem;font-size:.82rem;font-weight:700;color:#DC2626;margin-bottom:1rem;display:flex;align-items:center;gap:8px}
.spin{width:22px;height:22px;border:3px solid #E2E8F0;border-top-color:#0B1E3D;border-radius:50%;animation:spin .7s linear infinite;display:inline-block}
.spin-sm{width:16px;height:16px;border-width:2px}
.spin-w{border-color:rgba(255,255,255,.3);border-top-color:#fff}
.warn-box{background:#FFF7ED;border:1px solid #FED7AA;border-radius:10px;padding:.75rem 1rem;font-size:.82rem;color:#92400E;margin-bottom:1rem;text-align:center}
.info-box{background:#EFF6FF;border:1px solid #BFDBFE;border-radius:10px;padding:.75rem 1rem;font-size:.82rem;color:#1E40AF;margin-bottom:1rem}
.pdf-zone{border:2px dashed #CBD5E1;border-radius:14px;padding:2rem;cursor:pointer;transition:all .2s;background:#F8FAFC;display:flex;flex-direction:column;align-items:center;gap:12px;text-align:center}
.pdf-zone:hover{border-color:#2563EB;background:#EFF6FF}
.pdf-zone.active{border-color:#059669;background:#ECFDF5;border-style:solid}
.expert-card{display:flex;align-items:center;gap:10px;padding:10px 14px;border:2px solid #E2E8F0;border-radius:12px;cursor:pointer;transition:all .13s;background:#fff}
.expert-card:hover{border-color:#93C5FD;background:#EFF6FF}
.expert-card.sel{border-color:#0B1E3D;background:#F0F5FF}
.attente-pulse{animation:pulse 2s ease-in-out infinite}
.pratique-layout{display:grid;grid-template-columns:1fr 1fr;gap:20px;width:100%;max-width:1100px;animation:fadeUp .35s ease;}
.pratique-left{display:flex;flex-direction:column;gap:16px;}
.pratique-right{display:flex;flex-direction:column;gap:16px;}
.prat-section{background:#fff;border-radius:18px;border:1px solid #EDF1F7;box-shadow:0 2px 0 #E8EDF5,0 4px 20px rgba(0,40,85,.04);overflow:hidden;}
.prat-section-header{padding:.875rem 1.25rem;border-bottom:1px solid #EDF1F7;display:flex;align-items:center;gap:10px;}
.prat-section-title{font-weight:800;font-size:.9rem;color:#0B1E3D;}
.prat-section-sub{font-size:.72rem;color:#94A3B8;margin-top:1px;}
.prat-section-body{padding:1.25rem;}
.prat-banner{background:linear-gradient(135deg,#0B1E3D 0%,#163561 60%,#1A4A8A 100%);border-radius:18px;padding:1.25rem 1.5rem;display:flex;align-items:center;gap:14px;box-shadow:0 4px 16px rgba(11,30,61,.2);}
.prat-ico{width:38px;height:38px;border-radius:10px;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
.proc-steps{display:flex;flex-direction:column;gap:0;}
.proc-step{display:flex;align-items:flex-start;gap:12px;padding:10px 0;border-bottom:1px solid #F1F5F9;}
.proc-step:last-child{border-bottom:none;}
.proc-step-num{width:24px;height:24px;border-radius:50%;background:#EFF6FF;border:2px solid #BFDBFE;display:flex;align-items:center;justify-content:center;font-size:.7rem;font-weight:800;color:#2563EB;flex-shrink:0;margin-top:1px;}
.proc-step-txt{font-size:.83rem;font-weight:600;color:#374151;line-height:1.5;}
.proc-step-txt strong{color:#0B1E3D;}
@media(max-width:860px){
  .pratique-layout{grid-template-columns:1fr;}
  .ex-img-layout{grid-template-columns:1fr;min-height:auto}
  .ex-img-col{border-right:none;border-bottom:1.5px solid #E2E8F0}
  .ex-bar{margin:8px 8px 0;padding:.7rem 0 .5rem}
  .ex-bar-steps{padding:0 1rem;gap:.5rem}
}
@media(max-width:540px){
  .ex-bar-label{display:none}
  .pratique-layout{grid-template-columns:1fr;}
}
`;

function FormationViewer({ formationUrl, formationNom }) {
  const isPdf = !!formationNom?.toLowerCase().endsWith('.pdf');
  const base  = (import.meta.env?.VITE_API_URL || 'http://localhost:8080/api').replace('/api', '');
  const fUrl  = formationUrl?.startsWith('http') ? formationUrl : `${base}/${formationUrl?.replace(/^\//, '')}`;
  if (!formationUrl) return null;
  return (
    <div style={{ borderRadius:16, overflow:'hidden', border:'1px solid #E5E7EB', marginBottom:'1.5rem' }}>
      <div style={{ background:'#0B2347', padding:'.875rem 1.25rem', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <div style={{ color:'#fff', fontWeight:700, fontSize:'.9rem', display:'flex', gap:8, alignItems:'center' }}>
          <span>{isPdf ? '📄' : '📊'}</span>{formationNom || 'Formation'}
        </div>
      </div>
      {isPdf
        ? <iframe src={fUrl} title="Formation" style={{ width:'100%', height:520, border:'none', display:'block' }}/>
        : <div style={{ background:'#F8FAFC', padding:'2.5rem', display:'flex', flexDirection:'column', alignItems:'center', gap:16, textAlign:'center' }}>
            <div style={{ fontWeight:800, color:'#0B2347', fontSize:'1.1rem' }}>Présentation PowerPoint</div>
            <a href={fUrl} download target="_blank" rel="noopener noreferrer"
              style={{ background:'#0B2347', color:'#fff', borderRadius:12, padding:'12px 28px', fontWeight:700, textDecoration:'none', display:'inline-flex', alignItems:'center', gap:8 }}>
              ⬇ Télécharger la présentation
            </a>
          </div>
      }
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
//  COMPOSANT PRINCIPAL
// ════════════════════════════════════════════════════════════════
export default function ExamenPage() {
  const { t: translate } = useTranslation();
  const location  = useLocation();
  const navigate  = useNavigate();

  const certificationIdFromState    = location.state?.certificationId    || null;
  const formationUrlFromState       = location.state?.formationUrl       || null;
  const formationNomFromState       = location.state?.formationNom       || null;
  const certificationTitreFromState = location.state?.certificationTitre || null;

  // ── États principaux ──
  const [phase,       setPhase]      = useState('LOADING');
  const [passage,     setPassage]    = useState(null);
  const [sessionId,   setSessionId]  = useState(null);
  const [question,    setQuestion]   = useState(null);
  const [qNum,        setQNum]       = useState(1);
  const [partie,      setPartie]     = useState(1);
  const [reponse,     setReponse]    = useState(null);
  const [submitted,   setSubmitted]  = useState(false);
  const [correction,  setCorrection] = useState(null);
  const [chrono,      setChrono]     = useState(120);
  const [chronoStop,  setChronoStop] = useState(false);
  const [examPrefs,   setExamPrefs]  = useState({ dureeTheorique:120, dureePratique:120, seuilTheorique:70, seuilPratique:70 });
  const [scoreResult, setScoreResult]= useState(null);
  const [loading,     setLoading]    = useState(false);
  const [error,       setError]      = useState('');
  const [confetti,    setConfetti]   = useState(false);
  const [formation,   setFormation]  = useState(null);
  const [testPrat,    setTestPrat]   = useState(null);
  const [defautsRef,  setDefautsRef] = useState([]);
  const [pdfFile,     setPdfFile]    = useState(null);
  const [experts,     setExperts]    = useState([]);
  const [expertSel,   setExpertSel]  = useState(null);
  const [sendingPdf,  setSendingPdf] = useState(false);
  const pdfInputRef = useRef();

  // ══════════════════════════════════════════════════════════════
  //  VERROU EXAMEN
  //  examStarted = true dès que l'auditeur clique "Commencer"
  //  → le verrou s'active IMMÉDIATEMENT, avant même que phase='THEO'
  //  → reste actif pendant THEO et RESUME_P1
  //  → se désactive après terminerTest()
  // ══════════════════════════════════════════════════════════════
  const [examStarted, setExamStarted] = useState(false);
  const examActif = examStarted;

  // Verrou plein écran + Keyboard Lock (Chrome/Edge)
  // Bloque Échap, touche Windows, F5, Ctrl+T etc.
  useExamLock(examActif, 'Test Théorique');

  // ── Préférences exam ──
  useEffect(() => {
    api.get('/commun/preferences')
      .then(r => setExamPrefs({
        dureeTheorique: r.data.dureeTheorique || 120,
        dureePratique:  r.data.dureePratique  || 120,
        seuilTheorique: r.data.seuilTheorique || 70,
        seuilPratique:  r.data.seuilPratique  || 70,
      }))
      .catch(() => {});
  }, []);

  useEffect(() => {
    A.getDefautsRef().then(r => setDefautsRef(r.data || [])).catch(() => {});
  }, []);

  // ── Chronomètre ──
  useEffect(() => {
    if (phase !== 'THEO' || !question || submitted || chronoStop) return;
    if (chrono <= 0) { expirer(); return; }
    const iv = setInterval(() => setChrono(c => {
      if (c <= 1) { clearInterval(iv); expirer(); return 0; }
      return c - 1;
    }), 1000);
    return () => clearInterval(iv);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [question?.id, phase, submitted, chronoStop]);

  // ── Charger la formation ──
  const chargerFormation = async () => {
    if (formationUrlFromState) {
      setFormation({ url: fileUrl(formationUrlFromState), nom: formationNomFromState || 'Formation', titre: certificationTitreFromState });
      return;
    }
    try {
      const r = await A.getEnCours().catch(() => null);
      const p = r?.data;
      if (p?.formationUrl) { setFormation({ url: fileUrl(p.formationUrl), nom: p.formationNom || 'Formation', titre: p.certificationTitre }); return; }
      const dash = await A.getDashboard();
      const d = dash?.data?.certificationActive || dash?.data;
      if (d?.formationUrl) setFormation({ url: fileUrl(d.formationUrl), nom: d.formationNom || 'Formation', seuilTheo: d.seuilTheorique, titre: d.titre });
    } catch {}
  };

  // ── Initialisation ──
  useEffect(() => {
    (async () => {
      try {
        await chargerFormation();
        const r = await A.getEnCours().catch(() => null);
        const p = r?.data;
        if (!p || p.statut === 'ANNULE') { setPhase(certificationIdFromState ? 'PRE_INIT' : 'INIT'); return; }
        if (['FORMATION_OBLIGATOIRE','THEORIQUE_ECHOUE','PRATIQUE_ECHOUE'].includes(p.statut)) { setPassage(p); setPhase('INIT'); return; }
        if (p.statut === 'THEORIQUE_EN_COURS') {
          setPassage(p); setSessionId(p.sessionTestId);
          const qr = await A.getQuestion(p.sessionTestId).catch(() => null);
          if (qr?.data) {
            const q = qr.data;
            setQuestion(q);
            setQNum(q.partie === 1 ? q.numero : q.numero + 10);
            setPartie(q.partie);
            setChrono(q.chronoSecondes || examPrefs.dureeTheorique);
            setReponse(q.type === 'QCM' ? [] : null);
            // ← Reprendre → verrou actif
            setExamStarted(true);
            setPhase('THEO');
          } else { setPhase('INIT'); }
          return;
        }
        if (p.statut === 'PRATIQUE_EN_COURS') {
          setPassage(p); await chargerTestPratique();
          setPhase(p.rapportPratiqueJson ? 'ATTENTE_NOTATION' : 'ENVOI_RAPPORT_PDF');
          return;
        }
        setPhase('INIT');
      } catch { setPhase('INIT'); }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const chargerTestPratique = async () => {
    try {
      const r = await A.getTestPratique();
      setTestPrat(r.data);
      A.getExpertsDispo().then(r => setExperts(r.data || [])).catch(() => {});
    } catch (e) { console.error('Erreur chargement test pratique', e); }
  };

  const chargerQuestion = async (sid) => {
    const r = await A.getQuestion(sid || sessionId);
    const q = r.data;
    if (!q) return false;
    setQuestion(q);
    setChrono(q.chronoSecondes || examPrefs.dureeTheorique);
    setReponse(q.type === 'QCM' ? [] : null);
    setSubmitted(false); setCorrection(null); setChronoStop(false);
    return true;
  };

  // ════════════════════════════════════════════════════════════════
  //  DÉMARRER — verrou actif IMMÉDIATEMENT au clic du bouton
  // ════════════════════════════════════════════════════════════════
  const demarrer = async () => {
    setLoading(true); setError('');
    setExamStarted(true); // ← VERROU IMMÉDIAT dès le clic

    try {
      let p;
      try {
        if (certificationIdFromState) {
          const r = await api.post(`/auditeur/certification/demarrer/${certificationIdFromState}`);
          p = r.data;
        } else {
          const r = await A.demarrer();
          p = r.data;
        }
      } catch (e) {
        const msg = (e.response?.data?.message || '').toLowerCase();
        const st  = e.response?.status;
        if ((st === 400 || st === 409) && (msg.includes('deja') || msg.includes('cours'))) {
          const r2 = await A.getEnCours();
          p = r2.data;
        } else throw e;
      }
      setPassage(p);
      if (['FORMATION_OBLIGATOIRE','THEORIQUE_ECHOUE','PRATIQUE_ECHOUE'].includes(p.statut)) {
        setExamStarted(false); // pas de test → désactiver
        setPhase('INIT');
      } else {
        setSessionId(p.sessionTestId);
        setQNum(1); setPartie(1);
        await chargerQuestion(p.sessionTestId);
        setPhase('THEO');
      }
    } catch (e) {
      setExamStarted(false); // erreur → désactiver
      setError(e.response?.data?.message || 'Erreur au démarrage.');
    }
    setLoading(false);
  };

  // ════════════════════════════════════════════════════════════════
  //  LANCER TEST — verrou actif IMMÉDIATEMENT au clic
  // ════════════════════════════════════════════════════════════════
  const lancerTest = async () => {
    setLoading(true); setError('');
    setExamStarted(true); // ← VERROU IMMÉDIAT dès le clic

    try {
      const r = await A.passerAuTest();
      const p = r.data;
      setPassage(p); setSessionId(p.sessionTestId); setQNum(1); setPartie(1);
      await chargerQuestion(p.sessionTestId);
      setPhase('THEO');
    } catch (e) {
      const st     = e.response?.status;
      const msgRaw = e.response?.data;
      const msg    = typeof msgRaw === 'string' ? msgRaw.toLowerCase() : (msgRaw?.message || '').toLowerCase();

      if (st === 400 && (msg.includes('session') || msg.includes('en cours') || msg.includes('deja') || msg.includes('reprenez'))) {
        try {
          const r2 = await A.getEnCours();
          const p  = r2?.data;
          if (p?.sessionTestId && p?.statut === 'THEORIQUE_EN_COURS') {
            setPassage(p); setSessionId(p.sessionTestId); setQNum(1); setPartie(1);
            await chargerQuestion(p.sessionTestId);
            setPhase('THEO');
            setLoading(false);
            return;
          }
        } catch {}
      }
      setExamStarted(false); // erreur → désactiver
      setError(typeof msgRaw === 'string' ? msgRaw : (msgRaw?.message || 'Erreur au lancement du test.'));
    }
    setLoading(false);
  };

  const expirer = () => {
    if (submitted) return;
    setChronoStop(true); setSubmitted(true);
    A.repondre(sessionId, { questionId: question.id, expiree: true, reponseIndex: null, reponsesIndexes: [], reponseTexte: null, tempsUtilise: question.chronoSecondes || examPrefs.dureeTheorique })
      .then(async r => { setCorrection({ type: 'exp' }); if (r.data?.testTermine) await terminerTest(); })
      .catch(() => {});
  };

  const valider = async () => {
    if (loading) return;
    const isImg   = question?.type === 'IMAGE_DEFAUT';
    const isLibre = question?.typeReponseImage === 'LIBRE' || !question?.defautsDisponibles?.length;
    if (isImg && isLibre && (!reponse || !String(reponse).trim())) return;
    if (isImg && !isLibre && reponse === null) return;
    if (!isImg && (!Array.isArray(reponse) || reponse.length === 0)) return;

    setLoading(true); setChronoStop(true);
    try {
      let reponseTexte = null, reponseIndex = null, reponsesIndexes = [];
      if (isImg) {
        reponseTexte = isLibre
          ? String(reponse).trim()
          : (typeof reponse === 'string' ? reponse : (reponse !== null ? question.defautsDisponibles?.[reponse] : ''));
      } else {
        reponsesIndexes = Array.isArray(reponse) ? reponse : [];
        reponseIndex    = reponsesIndexes.length > 0 ? reponsesIndexes[0] : null;
      }
      const body = { questionId: question.id, expiree: false, tempsUtilise: (question.chronoSecondes || examPrefs.dureeTheorique) - chrono, reponseTexte, reponseIndex, reponsesIndexes };
      const r  = await A.repondre(sessionId, body);
      const fb = r.data;
      setSubmitted(true); setCorrection({ type: 'ok' });
      if (fb.testTermine) await terminerTest();
    } catch (e) { setError(e.response?.data?.message || 'Erreur enregistrement.'); }
    setLoading(false);
  };

  // ════════════════════════════════════════════════════════════════
  //  TERMINER TEST — désactiver le verrou après le test
  // ════════════════════════════════════════════════════════════════
  const terminerTest = async () => {
    try {
      const r1  = await A.terminer(sessionId);
      const res = r1.data;
      setPassage(res);
      setExamStarted(false); // ← VERROU DÉSACTIVÉ après le test
      const reussi = res.statut === 'PRATIQUE_EN_COURS';
      const pct    = res.scoreTheoriquePct ?? scorePct(res.scoreTheorique);
      const seuil  = res.seuilTheorique ?? 70;
      setScoreResult({ reussi, score: res.scoreTheorique ?? 0, scorePct: pct, seuil, bloque: res.statut === 'BLOQUE', peutReessayer: false, nbTentatives: res.nbTentativesTheorique ?? 1 });
      setPhase('RESULTAT_THEO');
    } catch (e) { setError(e.response?.data?.message || 'Erreur fin de test.'); }
  };

  const suivante = async () => {
    if (qNum === 10) { setPhase('RESUME_P1'); return; }
    setQNum(qNum + 1); setPartie(qNum + 1 <= 10 ? 1 : 2);
    await chargerQuestion();
  };

  const debuterP2 = async () => { setQNum(11); setPartie(2); await chargerQuestion(); setPhase('THEO'); };

  const envoyerRapportPdf = async () => {
    if (!pdfFile)   { setError('Veuillez sélectionner votre rapport PDF.'); return; }
    if (!expertSel) { setError('Veuillez choisir un expert pour valider votre rapport.'); return; }
    setSendingPdf(true); setError('');
    try {
      const fd = new FormData();
      fd.append('rapport', pdfFile); fd.append('expertId', expertSel);
      const r = await A.envoyerRapportPdf(passage.id, fd);
      setPassage(r.data); setPhase('ATTENTE_NOTATION');
    } catch (e) { setError(e.response?.data?.message || "Erreur lors de l'envoi du rapport."); }
    setSendingPdf(false);
  };

  const telechargerCertificat = async () => {
    try {
      const r   = await A.getCertificat(passage.id);
      const url = window.URL.createObjectURL(new Blob([r.data], { type:'application/pdf' }));
      const a   = document.createElement('a');
      a.href = url; a.download = `qualification_${passage.certificationTitre || passage.id}.pdf`;
      document.body.appendChild(a); a.click(); a.remove();
      window.URL.revokeObjectURL(url);
    } catch { alert('Certificat non encore disponible.'); }
  };
  // ── Variables dérivées ──
  const stepId = phase === 'PRE_INIT' || phase === 'INIT' ? 'FORMATION'
    : (phase === 'THEO' || phase === 'RESUME_P1' || phase === 'RESULTAT_THEO') ? 'THEO'
    : (['ENVOI_RAPPORT_PDF','ATTENTE_NOTATION'].includes(phase)) ? 'PRATIQUE'
    : 'CERTIF';
  const stepIdx   = STEPS.findIndex(s => s.id === stepId);
  const chronoCls = chrono > 90 ? 'ok' : chrono > 45 ? 'mid' : 'low';

  // ── Barre de progression en haut ──
  const TopBar = ({ showChrono = false }) => {
    const sIdx = STEPS.findIndex(s => s.id === stepId);
    const gPct = Math.round((sIdx / (STEPS.length - 1)) * 100);
    const questionDisplay = phase !== 'THEO' || !question ? null
      : partie === 1 ? `Question ${qNum}/10` : `Question ${qNum - 10}/10`;
    return (
      <div className="ex-bar">
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 2rem' }}>
          <div className="ex-bar-steps" style={{ display:'flex', alignItems:'center', gap:0, flexWrap:'nowrap' }}>
            {STEPS.map((step, i) => {
              const isDone = i < sIdx, isActive = i === sIdx;
              return (
                <div key={step.id} style={{ display:'flex', alignItems:'center' }}>
                  <div className="ex-bar-step-item">
                    <div className={`ex-bar-bullet ${isDone?'ex-bar-bullet-done':isActive?'ex-bar-bullet-act':'ex-bar-bullet-pend'}`}>
                      <span style={{ fontSize:'.9rem', fontWeight:800, color:isActive?'#0B2347':'rgba(255,255,255,.8)' }}>{step.num}</span>
                    </div>
                    <span className={`ex-bar-label ${isDone?'ex-bar-label-done':isActive?'ex-bar-label-act':''}`}>{step.label}</span>
                  </div>
                  {i < STEPS.length - 1 && (
                    <div className="ex-bar-connector">
                      <div className="ex-bar-connector-fill" style={{ width: i < sIdx ? '100%' : '0%' }}/>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:'1rem' }}>
            {showChrono && !submitted && (
              <div className={`ex-bar-timer ex-bar-timer-${chronoCls}`}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{ width:13, height:13 }}>
                  <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                </svg>
                {fmtChrono(chrono)}
              </div>
            )}
            {questionDisplay && <div className="ex-bar-question">{questionDisplay}</div>}
          </div>
        </div>
        <div className="ex-bar-progress-outer">
          <div className="ex-bar-progress-inner" style={{ width:`${gPct}%` }}/>
        </div>
      </div>
    );
  };

  // ══════════════════════════════════════════════════════════════════
  //  PRE_INIT
  // ══════════════════════════════════════════════════════════════════
  if (phase === 'PRE_INIT') return (
    <div className="ex"><style>{CSS}</style><TopBar/>
      <div className="ex-main" style={{ paddingTop:20, alignItems:'flex-start' }}>
        <div className="ex-wrap" style={{ maxWidth:1120 }}>
          <div style={{ marginBottom:'1.25rem' }}>
            <h2 style={{ margin:0, fontSize:'1.15rem', fontWeight:800, color:'#0B1E3D' }}>Prêt pour l'examen ?</h2>
            {certificationTitreFromState && <p style={{ margin:'4px 0 0', fontSize:'.84rem', color:'#64748B' }}>{certificationTitreFromState}</p>}
          </div>
          {formation?.url && <FormationViewer formationUrl={formation.url} formationNom={formation.nom}/>}
          <div className="ex-card">
            <div className="ex-info-grid">
              {[
                ['Partie A','10 questions · Analyse image câblage'],
                ['Partie B','10 questions · QCM (réponses multiples possibles)'],
                ['Chrono','2 minutes par question'],
                ['Tentatives','1 max · blocage 6 mois si échec'],
              ].map(([k, v]) => (
                <div key={k} className="ex-info-row">
                  <span className="ex-ik">{k}</span>
                  <span className="ex-iv">{v}</span>
                </div>
              ))}
            </div>
            {error && <div className="ex-err">⚠ {error}</div>}
            <div className="ex-foot">
              <button className="btn btn-ghost" onClick={() => navigate('/auditeur/certif')}>← Retour</button>
              <button className="btn btn-navy" onClick={demarrer} disabled={loading}>
                {loading ? <span className="spin spin-sm spin-w"/> : '▶ Commencer l\'examen'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // ══════════════════════════════════════════════════════════════════
  //  INIT
  // ══════════════════════════════════════════════════════════════════
  if (phase === 'INIT') {
    const isEchoueTheo = passage?.statut === 'THEORIQUE_ECHOUE';
    const isEchouePrat = passage?.statut === 'PRATIQUE_ECHOUE';
    return (
      <div className="ex"><style>{CSS}</style><TopBar/>
        <div className="ex-main" style={{ paddingTop:20, alignItems:'flex-start' }}>
          <div className="ex-wrap" style={{ maxWidth:1120 }}>
            <div style={{ marginBottom:'1.25rem' }}>
              <h2 style={{ margin:0, fontSize:'1.15rem', fontWeight:800, color:'#0B1E3D' }}>
                {isEchoueTheo ? 'Retenter le test théorique' : isEchouePrat ? 'Retenter le test pratique' : 'Prêt pour l\'examen ?'}
              </h2>
            </div>
            {(isEchoueTheo || isEchouePrat) && (
              <div className="warn-box">⚠️ <strong>Attention :</strong> Un nouvel échec bloquera votre accès <strong>6 mois</strong>.</div>
            )}
            {formation?.url && !isEchouePrat && <FormationViewer formationUrl={formation.url} formationNom={formation.nom}/>}
            <div className="ex-card">
              <div className="ex-info-grid">
                {[
                  ['Partie A','10 questions · Analyse image câblage'],
                  ['Partie B','10 questions · QCM (réponses multiples possibles)'],
                  ['Chrono','2 minutes par question'],
                  ['Tentatives','1 max · blocage 6 mois si échec'],
                ].map(([k, v]) => (
                  <div key={k} className="ex-info-row">
                    <span className="ex-ik">{k}</span>
                    <span className="ex-iv">{v}</span>
                  </div>
                ))}
              </div>
              {error && <div className="ex-err">⚠ {error}</div>}
              <div className="ex-foot">
                <button className="btn btn-ghost" onClick={() => navigate('/auditeur/certif')}>← Retour</button>
                {isEchouePrat ? (
                  <button className="btn btn-navy" onClick={async () => { await chargerTestPratique(); setPhase('ENVOI_RAPPORT_PDF'); }} disabled={loading}>
                    {loading ? <span className="spin spin-sm spin-w"/> : 'Retenter le test pratique'}
                  </button>
                ) : passage?.statut === 'FORMATION_OBLIGATOIRE' || isEchoueTheo ? (
                  <button className="btn btn-navy" onClick={lancerTest} disabled={loading}>
                    {loading ? <span className="spin spin-sm spin-w"/> : isEchoueTheo ? '↺ Retenter' : '▶ Commencer le test théorique'}
                  </button>
                ) : (
                  <button className="btn btn-navy" onClick={demarrer} disabled={loading}>
                    {loading ? <span className="spin spin-sm spin-w"/> : formation?.url ? "Accéder à l'examen" : '▶ Commencer l\'examen'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════
  //  THÉORIQUE
  // ══════════════════════════════════════════════════════════════════
  if (phase === 'THEO' && question) {
    const isImg    = question.type === 'IMAGE_DEFAUT';
    const isLibre  = question.typeReponseImage === 'LIBRE' || !question.defautsDisponibles?.length;
    const opts     = question.options || [];
    const defauts  = question.defautsDisponibles || [];
    const tagBg    = partie === 1 ? 'rgba(200,153,42,.3)' : 'rgba(37,100,235,.22)';
    const tagCl    = partie === 1 ? '#92691A' : '#32406c';
    const imgSrc   = question.imageUrl ? fileUrl(question.imageUrl) : null;
    const nbBonnes = question.nbBonnesReponses || 1;
    return (
      <div className="ex"><style>{CSS}</style><TopBar showChrono/>
        <div className="ex-main">
          <div className="ex-wrap" style={{ maxWidth: isImg ? 1100 : 700 }}>
            <div className="ex-card" key={question.id}>
              <div className="ex-card-tag" style={{ background: tagBg, color: tagCl }}>
                {partie === 1 ? 'Partie A — Analyse image câblage' : 'Partie B — QCM'}
              </div>
              <div className="ex-q-text">
                {isImg ? 'Identifiez le défaut présent sur ce schéma de câblage :' : question.enonce}
              </div>
              {!isImg && (
                <div style={{ fontSize:'.75rem', color:'#61799c', marginBottom:10, fontWeight:600, display:'flex', alignItems:'center', gap:6 }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ width:13, height:13 }}>
                    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                  {nbBonnes > 1 ? `Sélectionnez les ${nbBonnes} bonnes réponses` : 'Sélectionnez la bonne réponse'}
                </div>
              )}
              {error && <div className="ex-err">⚠ {error}</div>}
              {isImg && (
                <div className="ex-img-layout">
                  <div className="ex-img-col">
                    <div className="ex-img-wrap">
                      {imgSrc
                        ? <img src={imgSrc} alt="Câblage" onError={e => { e.target.style.display='none'; e.target.parentElement.innerHTML='<div class="ex-img-ph"><span style="font-size:2rem">🔌</span><span>Image non disponible</span></div>'; }}/>
                        : <div className="ex-img-ph"><span style={{ fontSize:'2rem' }}>🔌</span><span>Schéma câblage</span></div>
                      }
                    </div>
                  </div>
                  <div className="ex-ans-col">
                    <div style={{ fontSize:'.9rem', fontWeight:700, color:'#374151', marginBottom:10, marginTop:30 }}>Identifiez le défaut :</div>
                    {isLibre ? (
                      <div>
                        <AutocompleteInput value={typeof reponse === 'string' ? reponse : ''} onChange={v => !submitted && setReponse(v)} defautsRef={defautsRef} disabled={submitted} placeholder="Tapez les premières lettres…"/>
                        {defautsRef.length > 0 && <div style={{ fontSize:'.7rem', color:'#5999f3', marginTop:6 }}>💡 {defautsRef.length} défauts disponibles</div>}
                      </div>
                    ) : defauts.length > 0 ? (
                      <div className="ex-defauts">
                        {defauts.map((d, i) => (
                          <button key={i} className={`ex-defaut ${submitted ? (reponse === i ? 'sel' : 'skip') : reponse === i ? 'sel' : ''}`} onClick={() => !submitted && setReponse(i)} disabled={submitted}>
                            <div className="ex-defaut-dot"/><span>{d}</span>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <AutocompleteInput value={typeof reponse === 'string' ? reponse : ''} onChange={v => !submitted && setReponse(v)} defautsRef={defautsRef} disabled={submitted}/>
                    )}
                    {submitted && correction && (
                      <div className={`ex-correction ${correction.type === 'exp' ? 'exp' : 'ok'}`} style={{ marginBottom:'10px', marginTop:'160px' }}>
                        <span style={{ fontSize:'1.1rem', flexShrink:0 }}>{correction.type === 'exp' ? '⏰' : '✓'}</span>
                        <div>
                          <div style={{ fontWeight:800, marginBottom:2 }}>{correction.type === 'exp' ? 'Temps écoulé' : 'Réponse enregistrée'}</div>
                          <div style={{ fontSize:'.78rem', opacity:.8 }}>Le résultat sera affiché à la fin du test.</div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
              {!isImg && (
                <div className="ex-opts">
                  {opts.map((opt, i) => {
                    const isSel = Array.isArray(reponse) && reponse.includes(i);
                    return (
                      <button key={i}
                        className={`ex-opt ${submitted ? (isSel ? 'sel' : 'skip') : isSel ? 'sel' : ''}`}
                        onClick={() => {
                          if (submitted) return;
                          setReponse(prev => {
                            const arr = Array.isArray(prev) ? prev : [];
                            return arr.includes(i) ? arr.filter(x => x !== i) : [...arr, i];
                          });
                        }}
                        disabled={submitted}>
                        <div className="ex-opt-letter" style={{ borderRadius: isSel ? 4 : '50%' }}>{LETTERS[i]}</div>
                        <span>{opt}</span>
                      </button>
                    );
                  })}
                </div>
              )}
              <div className="ex-foot">
                <div>{!submitted && isImg && <button className="btn btn-ghost" onClick={() => { setChronoStop(true); expirer(); }}>Passer →</button>}</div>
                {!submitted ? (
                  <button className="btn btn-navy" onClick={valider}
                    disabled={loading || (isImg && isLibre && !reponse) || (isImg && !isLibre && defauts.length > 0 && reponse === null) || (!isImg && (!Array.isArray(reponse) || reponse.length === 0))}>
                    {loading ? <span className="spin spin-sm spin-w"/> : '✓ Valider'}
                  </button>
                ) : (
                  <button className="btn btn-blue" onClick={suivante} disabled={loading}>
                    {qNum === 10 ? 'Résumé Partie A →' : qNum === 20 ? 'Terminer le test →' : 'Question suivante →'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════
  //  RÉSUMÉ PARTIE 1
  // ══════════════════════════════════════════════════════════════════
  if (phase === 'RESUME_P1') return (
    <div className="ex"><style>{CSS}</style><TopBar/>
      <div className="ex-center">
        <div className="ex-big" style={{ minWidth:'520px', maxWidth:'620px', padding:'42px 38px' }}>
          <span className="ex-big-ico" style={{ fontSize:'3.2rem', color:'#0f172a' }}>✔</span>
          <h2 className="ex-big-title">Partie A terminée</h2>
          <p className="ex-big-sub">10 questions répondues. Résultats disponibles à la fin du test complet.</p>
          <button className="btn btn-navy" style={{ width:'100%', justifyContent:'center' }} onClick={debuterP2}>
            Démarrer la Partie B — QCM →
          </button>
        </div>
      </div>
    </div>
  );

  // ══════════════════════════════════════════════════════════════════
  //  RÉSULTAT THÉORIQUE
  // ══════════════════════════════════════════════════════════════════
  if (phase === 'RESULTAT_THEO') {
    const sr = scoreResult;
    const reussi = sr?.reussi, pct = sr?.scorePct ?? 0, seuil = sr?.seuil ?? 70;
    const bloque = sr?.bloque, peutReessayer = sr?.peutReessayer, nbTent = sr?.nbTentatives ?? 1;
    return (
      <div className="ex"><style>{CSS}</style><TopBar/>
        <div className="ex-center">
          <div className="ex-big" style={{ maxWidth:520 }}>
            <span className="ex-big-ico">{reussi ? '🎯' : bloque ? '🔒' : '📘'}</span>
            <h2 className="ex-big-title">{reussi ? 'Test théorique réussi !' : bloque ? 'Accès bloqué (6 mois)' : 'Test non réussi'}</h2>
            <p className="ex-big-sub">{reussi ? 'Passez maintenant au test pratique.' : bloque ? `Accès bloqué 6 mois.${passage?.dateDeblocage ? ' Déblocage le ' + new Date(passage.dateDeblocage).toLocaleDateString('fr-FR') + '.' : ''}` : peutReessayer ? `Score insuffisant (${pct}%, seuil ${seuil}%). Dernière tentative.` : `Score insuffisant (${pct}%, seuil ${seuil}%).`}</p>
            <div className="ex-score-compare">
              <div className="ex-score-cols">
                <div className="ex-score-col"><div className="ex-score-big" style={{ color: reussi ? '#059669' : '#DC2626' }}>{pct}%</div><div className="ex-score-lbl">Votre score</div></div>
                <div className="ex-score-divider"/>
                <div className="ex-score-col"><div className="ex-score-big" style={{ color:'#374151' }}>{seuil}%</div><div className="ex-score-lbl">Seuil requis</div></div>
              </div>
              <div className="ex-bar-h"><div className="ex-bar-h-fill" style={{ width:`${Math.min(pct,100)}%`, background: reussi ? '#059669' : '#DC2626' }}/></div>
              <div style={{ display:'flex', justifyContent:'space-between', marginTop:8, alignItems:'center' }}>
                <span style={{ fontSize:'.72rem', color:'#9CA3AF' }}>Tentative {nbTent}</span>
                <span className="ex-result-badge" style={{ background: reussi?'#ECFDF5':'#FEF2F2', color: reussi?'#065F46':'#991B1B' }}>{reussi ? '✓ Réussi' : '✗ Non atteint'}</span>
              </div>
            </div>
            {reussi ? (
              <button className="btn btn-navy" style={{ width:'100%', justifyContent:'center' }} onClick={async () => { await chargerTestPratique(); setPhase('ENVOI_RAPPORT_PDF'); }}>→ Passer au test pratique</button>
            ) : bloque ? (
              <button className="btn btn-ghost" style={{ width:'100%', justifyContent:'center' }} onClick={() => navigate('/auditeur/certif')}>Retour à mes qualifications</button>
            ) : (
              <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                {peutReessayer && <div className="warn-box">⚠️ <strong>Dernière chance :</strong> Un nouvel échec bloquera votre accès 6 mois.</div>}
                <button className="btn btn-navy" style={{ width:'100%', justifyContent:'center' }} onClick={lancerTest}>↺ Retenter le test théorique</button>
                <button className="btn btn-ghost" style={{ width:'100%', justifyContent:'center' }} onClick={() => navigate('/auditeur/certif')}>{translate('commun.retour')}</button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════
  //  ENVOI RAPPORT PDF
  // ══════════════════════════════════════════════════════════════════
  if (phase === 'ENVOI_RAPPORT_PDF') {
    const IcClipboard = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{width:20,height:20}}><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1"/></svg>;
    const IcUpload    = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{width:20,height:20}}><polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/></svg>;
    const IcUser      = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{width:20,height:20}}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>;
    const IcInfo      = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{width:20,height:20}}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>;
    const procStepIcons = [
      <svg key="1" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" style={{width:13,height:13}}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>,
      <svg key="2" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" style={{width:13,height:13}}><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>,
      <svg key="3" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" style={{width:13,height:13}}><polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/></svg>,
      <svg key="4" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" style={{width:13,height:13}}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
      <svg key="5" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" style={{width:13,height:13}}><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>,
    ];
    const procSteps = [
      { txt: <>Réalisez votre <strong>audit sur câblage physique</strong></> },
      { txt: <>Remplissez le rapport (<strong>mQuest</strong> ou papier → PDF)</> },
      { txt: <>Importez votre <strong>rapport PDF</strong> ci-contre</> },
      { txt: <>Choisissez l'<strong>expert validateur</strong> dans la liste</> },
      { txt: <>Cliquez <strong>Envoyer</strong> — notification immédiate</> },
    ];
    return (
      <div className="ex"><style>{CSS}</style><TopBar/>
        <div className="ex-main" style={{ paddingTop:20 }}>
          <div className="pratique-layout">
            <div className="pratique-left">
              <div className="prat-banner">
                <div className="prat-ico" style={{ background:'rgba(255,255,255,.15)' }}>{IcClipboard}</div>
                <div style={{ flex:1 }}>
                  <div style={{ color:'#fff', fontWeight:800, fontSize:'1rem', lineHeight:1.3 }}>Test Pratique — Rapport d'audit</div>
                  <div style={{ color:'rgba(255,255,255,.5)', fontSize:'.76rem', marginTop:3 }}>{testPrat?.titre || 'Qualification'}</div>
                </div>
              </div>
              <div className="prat-section">
                <div className="prat-section-header">
                  <div className="prat-ico" style={{ background:'#EFF6FF', width:34, height:34, borderRadius:8 }}>{IcInfo}</div>
                  <div><div className="prat-section-title">Comment procéder</div><div className="prat-section-sub">Suivez ces étapes dans l'ordre</div></div>
                </div>
                <div className="prat-section-body" style={{ padding:'0 1.25rem .5rem' }}>
                  <div className="proc-steps">
                    {procSteps.map((s, i) => (
                      <div key={i} className="proc-step">
                        <div className="proc-step-num">{procStepIcons[i]}</div>
                        <div className="proc-step-txt">{s.txt}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              {pdfFile && expertSel && (
                <div style={{ background:'#ECFDF5', border:'1.5px solid #A7F3D0', borderRadius:14, padding:'1rem 1.25rem', fontSize:'.83rem', color:'#065F46', fontWeight:600, display:'flex', flexDirection:'column', gap:6 }}>
                  <div style={{ fontWeight:800, fontSize:'.86rem', marginBottom:2, display:'flex', alignItems:'center', gap:7 }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{ width:15, height:15 }}><polyline points="20 6 9 17 4 12"/></svg>
                    Prêt à envoyer
                  </div>
                  <div style={{ display:'flex', alignItems:'center', gap:8, color:'#374151' }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" style={{ width:13, height:13 }}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                    {pdfFile.name}
                  </div>
                  <div style={{ display:'flex', alignItems:'center', gap:8, color:'#374151' }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" style={{ width:13, height:13 }}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                    {experts.find(e => e.id === expertSel)?.prenom} {experts.find(e => e.id === expertSel)?.nom}
                  </div>
                </div>
              )}
            </div>
            <div className="pratique-right">
              <div className="prat-section">
                <div className="prat-section-header">
                  <div className="prat-ico" style={{ background:'#F5F3FF', width:34, height:34, borderRadius:8 }}>{IcUpload}</div>
                  <div><div className="prat-section-title">Votre rapport PDF</div><div className="prat-section-sub">Fichier PDF uniquement · max. 20 MB</div></div>
                </div>
                <div className="prat-section-body">
                  <div className={`pdf-zone ${pdfFile ? 'active' : ''}`} onClick={() => pdfInputRef.current?.click()}>
                    <input ref={pdfInputRef} type="file" accept=".pdf,application/pdf" style={{ display:'none' }} onChange={e => { const f = e.target.files[0]; if (f) setPdfFile(f); }}/>
                    {pdfFile ? (
                      <>
                        <svg viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2" strokeLinecap="round" style={{ width:40, height:40 }}><polyline points="20 6 9 17 4 12"/></svg>
                        <div style={{ textAlign:'center' }}>
                          <div style={{ fontWeight:700, color:'#059669', fontSize:'.9rem' }}>{pdfFile.name}</div>
                          <div style={{ fontSize:'.74rem', color:'#6B7280', marginTop:4 }}>{(pdfFile.size/1024/1024).toFixed(2)} MB · Cliquez pour changer</div>
                        </div>
                      </>
                    ) : (
                      <>
                        <svg viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="1.5" strokeLinecap="round" style={{ width:40, height:40 }}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/></svg>
                        <div style={{ textAlign:'center' }}>
                          <div style={{ fontWeight:700, color:'#374151', fontSize:'.88rem' }}>Cliquez pour importer votre rapport PDF</div>
                          <div style={{ fontSize:'.74rem', color:'#9CA3AF', marginTop:4 }}>Glissez-déposez ou cliquez</div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <div className="prat-section">
                <div className="prat-section-header">
                  <div className="prat-ico" style={{ background:'#F0FDF4', width:34, height:34, borderRadius:8 }}>{IcUser}</div>
                  <div><div className="prat-section-title">Expert validateur</div><div className="prat-section-sub">Choisissez qui examinera votre rapport</div></div>
                </div>
                <div className="prat-section-body">
                  {experts.length === 0 ? (
                    <div style={{ background:'#FEF2F2', border:'1px solid #FECACA', borderRadius:10, padding:'1rem', fontSize:'.84rem', color:'#DC2626', textAlign:'center', display:'flex', alignItems:'center', gap:8, justifyContent:'center' }}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ width:16, height:16 }}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                      Aucun expert disponible pour le moment.
                    </div>
                  ) : (
                    <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                      {experts.map(e => (
                        <div key={e.id} className={`expert-card ${expertSel === e.id ? 'sel' : ''}`} onClick={() => setExpertSel(e.id)}>
                          <div style={{ width:38, height:38, borderRadius:10, background:expertSel===e.id?'#0B1E3D':'#F0F4FA', color:expertSel===e.id?'#fff':'#0B1E3D', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:800, fontSize:'.85rem', flexShrink:0 }}>
                            {(e.prenom||'E').charAt(0)}{(e.nom||'').charAt(0)}
                          </div>
                          <div style={{ flex:1 }}>
                            <div style={{ fontWeight:700, color:'#0B1E3D', fontSize:'.88rem' }}>{e.prenom} {e.nom}</div>
                            <div style={{ fontSize:'.73rem', color:'#64748B' }}>{e.matricule}{e.siteNom && ` · ${e.siteNom}`}</div>
                          </div>
                          {expertSel === e.id && <svg viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" style={{ width:18, height:18 }}><polyline points="20 6 9 17 4 12"/></svg>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              {error && (
                <div className="ex-err">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ width:16, height:16, flexShrink:0 }}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                  {error}
                </div>
              )}
              <div style={{ display:'flex', gap:10 }}>
                <button className="btn btn-ghost" onClick={() => navigate('/auditeur/certif')}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ width:15, height:15 }}><polyline points="15 18 9 12 15 6"/></svg>
                  Retour
                </button>
                <button className="btn btn-purple" style={{ flex:1, justifyContent:'center' }} onClick={envoyerRapportPdf} disabled={sendingPdf || !pdfFile || !expertSel}>
                  {sendingPdf
                    ? <><span className="spin spin-sm spin-w"/> Envoi en cours…</>
                    : <><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ width:16, height:16 }}><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg> Envoyer à l'expert</>
                  }
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════
  //  ATTENTE NOTATION
  // ══════════════════════════════════════════════════════════════════
  if (phase === 'ATTENTE_NOTATION') return (
    <div className="ex"><style>{CSS}</style><TopBar/>
      <div className="ex-center">
        <div className="ex-big" style={{ maxWidth:520 }}>
          <span className="ex-big-ico attente-pulse">⏳</span>
          <h2 className="ex-big-title">Rapport envoyé à l'expert</h2>
          <p className="ex-big-sub">Votre rapport PDF a été transmis. L'expert va l'examiner et vous recevrez une notification dès sa décision.</p>
          <div style={{ background:'#F0F5FF', borderRadius:12, padding:'1rem', marginBottom:'1.5rem', fontSize:'.84rem', color:'#1E40AF', fontWeight:600, textAlign:'left' }}>
            {[
              { icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{width:14,height:14,flexShrink:0}}><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>, text: "L'expert a reçu une notification avec votre rapport." },
              { icon: <svg viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" style={{width:14,height:14,flexShrink:0}}><polyline points="20 6 9 17 4 12"/></svg>, text: <span>Si <strong>Validé</strong> → vous êtes qualifié(e) et pouvez télécharger votre certificat.</span> },
              { icon: <svg viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2.5" strokeLinecap="round" style={{width:14,height:14,flexShrink:0}}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>, text: <span>Si <strong>Invalidé</strong> → accès bloqué 6 mois.</span> },
            ].map((item, i) => (
              <div key={i} style={{ display:'flex', alignItems:'center', gap:8, marginBottom: i < 2 ? 6 : 0 }}>
                {item.icon}{item.text}
              </div>
            ))}
          </div>
          <button className="btn btn-navy" style={{ width:'100%', justifyContent:'center' }} onClick={() => navigate('/auditeur/certif')}>
            Voir mes qualifications
          </button>
        </div>
      </div>
    </div>
  );

  // ══════════════════════════════════════════════════════════════════
  //  RÉSULTAT FINAL
  // ══════════════════════════════════════════════════════════════════
  if (phase === 'RESULTAT') {
    const reussi = passage?.statut === 'REUSSI';
    const bloque = passage?.statut === 'BLOQUE';
    return (
      <div className="ex"><style>{CSS}</style><TopBar/><Confetti active={confetti}/>
        <div className="ex-center">
          <div style={{ width:'100%', maxWidth:500 }}>
            {reussi && (
              <div className="certif-card">
                <div style={{ display:'flex', alignItems:'center', gap:12, paddingBottom:'1.25rem', borderBottom:'1px solid rgba(255,255,255,.12)', marginBottom:'1.25rem' }}>
                  <div style={{ fontSize:'2rem' }}>🏆</div>
                  <div>
                    <div style={{ fontSize:'.62rem', fontWeight:800, textTransform:'uppercase', letterSpacing:'.15em', color:'rgba(255,255,255,.4)', marginBottom:3 }}>Qualification</div>
                    <div style={{ fontSize:'1.1rem', fontWeight:800, color:'#fff' }}>{passage.certificationTitre || 'Qualification Produit'}</div>
                  </div>
                </div>
                <button className="btn btn-green" style={{ width:'100%', justifyContent:'center' }} onClick={telechargerCertificat}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ width:16, height:16 }}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                  Télécharger mon certificat PDF
                </button>
              </div>
            )}
            <div className="ex-big">
              <span className="ex-big-ico">{reussi ? '🎉' : bloque ? '🔒' : '⏳'}</span>
              <h2 className="ex-big-title">{reussi ? 'Félicitations !' : bloque ? 'Accès bloqué' : 'Résultat en attente'}</h2>
              <p className="ex-big-sub">{reussi ? 'Vous êtes qualifié(e).' : bloque ? `Accès bloqué 6 mois.${passage?.dateDeblocage ? ' Déblocage le ' + new Date(passage.dateDeblocage).toLocaleDateString('fr-FR') + '.' : ''}` : ''}</p>
              <button className="btn btn-ghost" style={{ width:'100%', justifyContent:'center' }} onClick={() => navigate('/auditeur/certif')}>
                Voir mes qualifications
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <div className="ex"><style>{CSS}</style><TopBar/></div>;
}