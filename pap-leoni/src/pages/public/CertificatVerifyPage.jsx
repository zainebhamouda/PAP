import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

export default function CertificatVerifyPage() {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError(null);

    // Appelle l'endpoint public qui retourne le PDF (attachment)
    fetch(`${window.location.protocol}//${window.location.hostname}:8080/api/certificats/public/verify/${id}`)
      .then(async res => {
        if (!res.ok) throw new Error('Certificat introuvable');
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        if (mounted) setPdfUrl(url);
      })
      .catch(e => { if (mounted) setError(e.message || 'Erreur'); })
      .finally(() => { if (mounted) setLoading(false); });

    return () => { mounted = false; if (pdfUrl) { URL.revokeObjectURL(pdfUrl); } };
  }, [id]);

  if (loading) return (
    <div style={{padding:20,display:'flex',alignItems:'center',justifyContent:'center',height:'100vh'}}>
      <div style={{width:40,height:40,border:'3px solid #E2E8F0',borderTopColor:'#002855',borderRadius:'50%',animation:'spin .8s linear infinite'}} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  if (error) return (
    <div style={{padding:20,textAlign:'center'}}>
      <h3>Certificat non disponible</h3>
      <p style={{color:'#6B7280'}}>{error}</p>
    </div>
  );

  return (
    <div style={{height:'100vh',display:'flex',flexDirection:'column'}}>
      <div style={{padding:12,background:'#F8FAFC',borderBottom:'1px solid #E2E8F0'}}>
        <strong>Vérification certificat</strong>
      </div>
      <div style={{flex:1}}>
        {pdfUrl ? (
          <iframe title="certificat" src={pdfUrl} style={{width:'100%',height:'100%',border:0}} />
        ) : (
          <div style={{padding:20}}>Aucun contenu PDF disponible.</div>
        )}
      </div>
    </div>
  );
}
