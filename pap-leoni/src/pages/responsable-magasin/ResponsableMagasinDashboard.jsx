import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auditSpecialAPI } from '../../services/api';

const T = {
  navy:'#002855', blue:'#003F8A', blueM:'#0057B8',
  g50:'#F7F9FC', g100:'#EEF2F8', g200:'#DAE2EF',
  g400:'#8A9BBC', g500:'#5C6F8A', g700:'#273347',
  success:'#1A7A4A', successBg:'#E6F5EE', successBd:'#86EFAC',
  warn:'#C8982A', warnBg:'#FFF4D6',
  danger:'#C0392B', dangerBg:'#FDECEA', dangerBd:'#FCA5A5',
  purple:'#7C3AED', purpleBg:'#F5F3FF',
};

const apiH = () => ({ Authorization: `Bearer ${localStorage.getItem('token')}`, 'Content-Type': 'application/json' });
const fmt = d => d ? new Date(d).toLocaleDateString('fr-FR', { day:'2-digit', month:'short', year:'numeric' }) : '—';

export default function ResponsableMagasinDashboard() {
  const navigate = useNavigate();
  const [audits, setAudits]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats]     = useState({ total:0, aValider:0, valides:0 });

  const load = async () => {
    setLoading(true);
    try {
      const res = await auditSpecialAPI.auditsExportResponsable();
      const list = res.data || [];
      setAudits(list);
      setStats({
        total: list.length,
        aValider: list.filter(a => a.statut !== 'TERMINE').length,
        valides:  list.filter(a => a.statut === 'TERMINE').length,
      });
    } catch {}
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  return (
    <div style={{ fontFamily:"'DM Sans',sans-serif", background:T.g50, minHeight:'100vh', padding:'2rem' }}>
      <div style={{ marginBottom:24, marginTop:-18 }}>
        <h1 style={{ fontSize:'1.5rem', fontWeight:800, color:T.navy, margin:'0 0 5px' }}>Tableau de bord</h1>
        <p style={{ color:T.g400, fontSize:'.85rem', margin:0 }}>Responsable Magasin Export</p>
      </div>

      {/* Stats */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:14, marginBottom:24 }}>
        {[
          { label:'Total audits', value:stats.total, color:T.navy, bg:T.g50 },
          { label:'À valider', value:stats.aValider, color:T.warn, bg:T.warnBg },
          { label:'Validés', value:stats.valides, color:T.success, bg:T.successBg },
        ].map(s => (
          <div key={s.label} style={{ background:'#fff', borderRadius:14, border:`1px solid ${T.g100}`, padding:'1.2rem', boxShadow:'0 2px 8px rgba(0,40,85,.06)' }}>
            <div style={{ fontSize:'1.8rem', fontWeight:900, color:s.color }}>{s.value}</div>
            <div style={{ fontSize:'.75rem', color:T.g400, marginTop:4 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Lien vers les audits */}
      <button onClick={() => navigate('/responsable-magasin/audits')}
        style={{ background:`linear-gradient(135deg,${T.navy},${T.purple})`, color:'#fff', border:'none', borderRadius:12, padding:'14px 28px', fontSize:'.9rem', fontWeight:700, cursor:'pointer', fontFamily:'inherit', marginBottom:8 }}>
        📦 Voir les audits export à valider ({stats.aValider})
      </button>
    </div>
  );
}
