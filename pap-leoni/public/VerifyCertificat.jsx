import { useParams } from 'react-router-dom';

export default function VerifyCertificat() {
  const { passageId } = useParams();

  const pdfUrl = `http://192.168.1.14:5173/api/certificats/public/verify/${passageId}`;

  return (
    <div style={{ minHeight:'100vh', background:'#0B1E3D', fontFamily:'Inter,sans-serif', display:'flex', flexDirection:'column' }}>
      <style>{`
        @keyframes fadeUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
        @keyframes spin   { to { transform:rotate(360deg); } }
      `}</style>

      {/* ── Header ── */}
      <div style={s.header}>
        <div style={s.headerIcon}>🏆</div>
        <div style={{ flex:1 }}>
          <div style={{ fontWeight:800, color:'#fff', fontSize:'1rem' }}>
            Certificat LEONI PAP
          </div>
          <div style={{ fontSize:'.72rem', color:'rgba(255,255,255,.55)', marginTop:2 }}>
            Document vérifié et authentique
          </div>
        </div>
        <div style={s.verifiedBadge}>✓ Vérifié</div>
      </div>

      {/* ── Card ── */}
      <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', padding:'24px 20px' }}>
        <div style={{ ...s.card, animation:'fadeUp .35s ease' }}>

          <div style={s.seal}>🎓</div>

          <h2 style={{ color:'#0B1E3D', fontWeight:800, fontSize:'1.15rem', margin:'0 0 6px', textAlign:'center' }}>
            Certificat de Qualification
          </h2>
          <p style={{ color:'#64748B', fontSize:'.82rem', textAlign:'center', margin:'0 0 20px' }}>
            Référence #{passageId}
          </p>

          <div style={s.infoRow}>
            <span style={s.infoIcon}>🔐</span>
            <span style={{ color:'#374151', fontSize:'.83rem' }}>
              Ce document est certifié par LEONI PAP
            </span>
          </div>

          <div style={s.infoRow}>
            <span style={s.infoIcon}>📄</span>
            <span style={{ color:'#374151', fontSize:'.83rem' }}>
              Appuyez ci-dessous pour ouvrir ou télécharger le PDF
            </span>
          </div>

          {/* ✅ Ouvre dans l'app PDF native du téléphone */}
          <a href={pdfUrl} target="_blank" rel="noopener noreferrer" style={s.btnPrimary}>
            📄 Ouvrir le certificat PDF
          </a>

          <a href={pdfUrl} download style={s.btnSecondary}>
            ⬇ Télécharger
          </a>

          <p style={{ color:'#94A3B8', fontSize:'.7rem', textAlign:'center', marginTop:16 }}>
            Si le PDF ne s'ouvre pas, appuyez sur "Télécharger"
          </p>
        </div>
      </div>

      {/* ── Footer ── */}
      <div style={s.footer}>
        <span style={{ color:'rgba(255,255,255,.35)', fontSize:'.72rem' }}>
          © LEONI PAP — Système de certification qualité
        </span>
      </div>
    </div>
  );
}

const s = {
  header: {
    background:'linear-gradient(135deg,#0B1E3D,#1D4ED8)',
    padding:'16px 20px',
    display:'flex', alignItems:'center', gap:12,
    boxShadow:'0 2px 20px rgba(0,0,0,.3)',
  },
  headerIcon: {
    width:40, height:40, borderRadius:10,
    background:'rgba(255,255,255,.12)',
    display:'flex', alignItems:'center', justifyContent:'center',
    fontSize:'1.2rem',
  },
  verifiedBadge: {
    background:'#ECFDF5', border:'1px solid #A7F3D0',
    borderRadius:99, padding:'4px 12px',
    fontSize:'.72rem', fontWeight:700, color:'#059669',
  },
  card: {
    background:'#fff', borderRadius:20,
    padding:'28px 24px', width:'100%', maxWidth:380,
    boxShadow:'0 20px 60px rgba(0,0,0,.35)',
    display:'flex', flexDirection:'column', alignItems:'center',
  },
  seal: {
    width:72, height:72, borderRadius:'50%',
    background:'linear-gradient(135deg,#0B1E3D,#1D4ED8)',
    display:'flex', alignItems:'center', justifyContent:'center',
    fontSize:'2rem', marginBottom:16,
    boxShadow:'0 8px 24px rgba(11,30,61,.35)',
  },
  infoRow: {
    width:'100%', display:'flex', alignItems:'center', gap:10,
    background:'#F8FAFC', borderRadius:10, padding:'10px 14px',
    border:'1px solid #E2E8F0', marginBottom:8,
  },
  infoIcon: { fontSize:'1rem', flexShrink:0 },
  btnPrimary: {
    display:'block', width:'100%', marginTop:8,
    background:'linear-gradient(135deg,#0B1E3D,#1D4ED8)',
    color:'#fff', padding:'14px', borderRadius:12,
    fontWeight:700, fontSize:'.95rem', textAlign:'center',
    textDecoration:'none',
    boxShadow:'0 4px 16px rgba(11,30,61,.3)',
  },
  btnSecondary: {
    display:'block', width:'100%', marginTop:10,
    background:'#F1F5F9', border:'1.5px solid #E2E8F0',
    color:'#374151', padding:'12px', borderRadius:12,
    fontWeight:700, fontSize:'.9rem', textAlign:'center',
    textDecoration:'none',
  },
  footer: {
    padding:'16px', textAlign:'center',
    borderTop:'1px solid rgba(255,255,255,.06)',
  },
  page: {
    height:'100vh', display:'flex', flexDirection:'column',
    alignItems:'center', justifyContent:'center',
    background:'#0B1E3D',
  },
};