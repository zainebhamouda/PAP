// src/components/certif/ModalQrCode.jsx
import { useState, useEffect } from 'react';
import api from '../../services/api';

export default function ModalQrCode({ passageId, certificationId, auditeurNom, certificationTitre, onClose }) {
  const [qrUrl,   setQrUrl]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied,  setCopied]  = useState(false);

const verifyId = certificationId || passageId;
const verifyUrl = `${window.location.origin}/certificat/verify/${verifyId}`;

  useEffect(() => {
    api.get(`/certificats/passage/${passageId}/qrcode`, { responseType: 'blob' })
      .then(r => setQrUrl(URL.createObjectURL(r.data)))
      .catch(() => setQrUrl(null))
      .finally(() => setLoading(false));
    return () => { if (qrUrl) URL.revokeObjectURL(qrUrl); };
  }, [passageId]);

  const handleCopy = () => {
    navigator.clipboard.writeText(verifyUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleDownload = () => {
    if (!qrUrl) return;
    const a = document.createElement('a');
    a.href = qrUrl;
    a.download = `qrcode_certificat_${auditeurNom?.replace(/\s/g,'_') || passageId}.png`;
    document.body.appendChild(a); a.click(); a.remove();
  };

  return (
    <div
      onClick={e => e.target === e.currentTarget && onClose()}
      style={{
        position:'fixed', inset:0, background:'rgba(0,0,0,.55)',
        zIndex:10500, display:'flex', alignItems:'center', justifyContent:'center',
        backdropFilter:'blur(6px)', padding:'1rem',
        animation:'fadeIn .18s ease',
      }}>
      <style>{`
        @keyframes fadeIn { from{opacity:0} to{opacity:1} }
        @keyframes popIn  { from{opacity:0;transform:scale(.93)} to{opacity:1;transform:scale(1)} }
        @keyframes spin   { to{transform:rotate(360deg)} }
      `}</style>

      <div style={{
        background:'#fff', borderRadius:22, width:'100%', maxWidth:420,
        overflow:'hidden', boxShadow:'0 32px 80px rgba(0,0,0,.25)',
        animation:'popIn .22s ease', display:'flex', flexDirection:'column',
      }}>

        {/* Header */}
        <div style={{
          background:'linear-gradient(135deg,#0B1E3D,#1D4ED8)',
          padding:'16px 20px',
          display:'flex', alignItems:'center', justifyContent:'space-between',
        }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={{
              width:36, height:36, borderRadius:9,
              background:'rgba(255,255,255,.12)',
              display:'flex', alignItems:'center', justifyContent:'center',
              fontSize:'1.2rem',
            }}>
              🔲
            </div>
            <div>
              <div style={{ fontWeight:800, color:'#fff', fontSize:'.95rem' }}>
                QR Code du certificat
              </div>
              <div style={{ fontSize:'.72rem', color:'rgba(255,255,255,.55)', marginTop:2 }}>
                {certificationTitre}
              </div>
            </div>
          </div>
          <button onClick={onClose} style={{
            width:30, height:30, borderRadius:8,
            background:'rgba(255,255,255,.12)', border:'none',
            cursor:'pointer', color:'#fff',
            display:'flex', alignItems:'center', justifyContent:'center',
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Corps */}
        <div style={{ padding:'24px', display:'flex', flexDirection:'column', alignItems:'center', gap:16 }}>

          {/* Auditeur info */}
          <div style={{
            width:'100%', background:'#F8FAFC',
            borderRadius:10, padding:'10px 14px',
            border:'1px solid #E2E8F0',
            display:'flex', alignItems:'center', gap:10,
          }}>
            <div style={{
              width:36, height:36, borderRadius:9,
              background:'#0B1E3D', color:'#fff',
              display:'flex', alignItems:'center', justifyContent:'center',
              fontWeight:800, fontSize:'.95rem', flexShrink:0,
            }}>
              {(auditeurNom || 'A').charAt(0).toUpperCase()}
            </div>
            <div>
              <div style={{ fontWeight:700, fontSize:'.88rem', color:'#0B1E3D' }}>
                {auditeurNom}
              </div>
              <div style={{ fontSize:'.72rem', color:'#64748B', marginTop:2 }}>
                Certification LEONI PAP
              </div>
            </div>
            <div style={{
              marginLeft:'auto',
              background:'#ECFDF5', border:'1px solid #A7F3D0',
              borderRadius:99, padding:'3px 10px',
              fontSize:'.7rem', fontWeight:700, color:'#059669',
            }}>
              Qualifié ✓
            </div>
          </div>

          {/* QR Code image */}
          <div style={{
            width:240, height:240,
            background:'#F8FAFC', borderRadius:16,
            border:'2px solid #E2E8F0',
            display:'flex', alignItems:'center', justifyContent:'center',
            boxShadow:'0 4px 16px rgba(0,0,0,.06)',
            padding:12,
          }}>
            {loading ? (
              <div style={{
                width:28, height:28,
                border:'3px solid #E2E8F0',
                borderTopColor:'#0B1E3D',
                borderRadius:'50%',
                animation:'spin .8s linear infinite',
              }}/>
            ) : qrUrl ? (
              <img
                src={qrUrl}
                alt="QR Code certificat"
                style={{ width:'100%', height:'100%', imageRendering:'pixelated' }}
              />
            ) : (
              <div style={{ textAlign:'center', color:'#DC2626', fontSize:'.82rem', fontWeight:600 }}>
                ⚠️ Erreur de chargement
              </div>
            )}
          </div>

          {/* Info scan */}
          <div style={{
            background:'#EFF6FF', border:'1px solid #BFDBFE',
            borderRadius:10, padding:'10px 14px',
            fontSize:'.78rem', color:'#1D4ED8', fontWeight:600,
            textAlign:'center', width:'100%',
          }}>
            Scannez ce QR code pour vérifier l'authenticité du certificat
          </div>

          {/* URL copiable */}
          <div style={{
            width:'100%', display:'flex', gap:8,
            background:'#F1F5F9', borderRadius:10,
            border:'1px solid #E2E8F0', overflow:'hidden',
          }}>
            <div style={{
              flex:1, padding:'9px 12px',
              fontSize:'.72rem', color:'#64748B',
              overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap',
              fontFamily:'monospace',
            }}>
              {verifyUrl}
            </div>
            <button onClick={handleCopy} style={{
              padding:'9px 14px', background:copied?'#059669':'#0B1E3D',
              border:'none', color:'#fff', cursor:'pointer',
              fontSize:'.75rem', fontWeight:700, fontFamily:'inherit',
              transition:'background .2s', flexShrink:0,
            }}>
              {copied ? '✓ Copié' : 'Copier'}
            </button>
          </div>

          {/* Boutons bas */}
          <div style={{ display:'flex', gap:10, width:'100%' }}>
            <button onClick={handleDownload} disabled={!qrUrl} style={{
              flex:1, padding:'11px', borderRadius:11,
              border:'none',
              background: qrUrl ? '#0B1E3D' : '#D1D5DB',
              color:'#fff', fontWeight:700, fontSize:'.88rem',
              cursor: qrUrl ? 'pointer' : 'not-allowed',
              fontFamily:'inherit',
              display:'flex', alignItems:'center', justifyContent:'center', gap:7,
              boxShadow: qrUrl ? '0 2px 10px rgba(11,30,61,.2)' : 'none',
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                   stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              Télécharger QR Code
            </button>
            <button onClick={onClose} style={{
              flex:1, padding:'11px', borderRadius:11,
              border:'1.5px solid #E2E8F0',
              background:'#fff', color:'#374151',
              fontWeight:700, fontSize:'.88rem',
              cursor:'pointer', fontFamily:'inherit',
            }}>
              Fermer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}