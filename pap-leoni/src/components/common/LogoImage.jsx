import { useState } from 'react';

// ── Logos via vl.imgix.net — CDN public gratuit pour logos auto ──
const CLIENT_LOGOS = {
  // Groupe BMW
  'BMW':               'https://vl.imgix.net/img/bmw-logo.png',
  'Mini':              'https://vl.imgix.net/img/mini-logo.png',
  'Rolls-Royce':       'https://vl.imgix.net/img/rolls-royce-logo.png',
  'RR':                'https://vl.imgix.net/img/rolls-royce-logo.png',
  
  // Groupe VW
  'Volkswagen':        'https://vl.imgix.net/img/volkswagen-logo.png',
  'VW':                'https://vl.imgix.net/img/volkswagen-logo.png',
  'Audi':              'https://vl.imgix.net/img/audi-logo.png',
  'Porsche':           'https://vl.imgix.net/img/porsche-logo.png',
  'Bentley':           'https://vl.imgix.net/img/bentley-logo.png',
  'Lamborghini':       'https://vl.imgix.net/img/lamborghini-logo.png',
  'Skoda':             'https://vl.imgix.net/img/skoda-logo.png',
  
  // Groupe Mercedes
  'Mercedes':          'https://vl.imgix.net/img/mercedes-benz-logo.png',
  'MS':                'https://vl.imgix.net/img/mercedes-benz-logo.png',
  'MB':                'https://vl.imgix.net/img/mercedes-benz-logo.png',
  'Smart':             'https://vl.imgix.net/img/smart-logo.png',
  'SM':                'https://vl.imgix.net/img/smart-logo.png',
  
  // Groupe Stellantis
  'Peugeot':           'https://vl.imgix.net/img/peugeot-logo.png',
  'Citroën':           'https://vl.imgix.net/img/citroen-logo.png',
  'Citroen':           'https://vl.imgix.net/img/citroen-logo.png',
  'Fiat':              'https://vl.imgix.net/img/fiat-logo.png',
  'Alfa Romeo':        'https://vl.imgix.net/img/alfa-romeo-logo.png',
  'AL':                'https://vl.imgix.net/img/alfa-romeo-logo.png',
  'Jeep':              'https://vl.imgix.net/img/jeep-logo.png',
  'JE':                'https://vl.imgix.net/img/jeep-logo.png',
  'Stellantis':        '/logos/stellantis.svg',
  
  // Groupe Ford
  'Ford':              'https://vl.imgix.net/img/ford-logo.png',
  'Lincoln':           'https://vl.imgix.net/img/lincoln-logo.png',
  'LI':                'https://vl.imgix.net/img/lincoln-logo.png',
  
  // Groupe Jaguar Land Rover
  'Jaguar':            'https://vl.imgix.net/img/jaguar-logo.png',
  'Land Rover':        'https://vl.imgix.net/img/land-rover-logo.png',
  'LR':                'https://vl.imgix.net/img/land-rover-logo.png',
  
  // Marques indépendantes
  'Volvo':             'https://vl.imgix.net/img/volvo-logo.png',
  'VO':                'https://vl.imgix.net/img/volvo-logo.png',
  'Tesla':             'https://vl.imgix.net/img/tesla-logo.png',
  'TS':                'https://vl.imgix.net/img/tesla-logo.png',
  
  // Autres
  'Continental':       '/logos/continental.svg',
  'OEM Supplier':      null,
  'OEM':               null,
  'Faurecia':          '/logos/forvia.svg',
  'Forvia':            '/logos/forvia.svg',
  'RSA / PSA':         'https://vl.imgix.net/img/citroen-logo.png'
};

const FALLBACK_COLORS = [
  '#1D4ED8','#059669','#D97706','#7C3AED',
  '#C0392B','#0F766E','#1E40AF','#065F46',
  '#DC2626','#16A34A','#EA580C','#9333EA',
];

function getLogoUrl(nom) {
  if (!nom) return null;
  if (Object.prototype.hasOwnProperty.call(CLIENT_LOGOS, nom)) {
    return CLIENT_LOGOS[nom];
  }
  
  // Match par code court (2 lettres)
  const codeMatch = Object.keys(CLIENT_LOGOS).find(key => 
    CLIENT_LOGOS[key] && (key === nom.toUpperCase() || key === nom)
  );
  if (codeMatch) return CLIENT_LOGOS[codeMatch];
  
  // Match partiel
  const partialMatch = Object.entries(CLIENT_LOGOS).find(([k]) =>
    CLIENT_LOGOS[k] &&
    nom.toLowerCase().includes(k.toLowerCase()) ||
    k.toLowerCase().includes(nom.toLowerCase())
  );
  return partialMatch ? partialMatch[1] : null;
}

function getFallbackColor(nom) {
  let hash = 0;
  for (let i = 0; i < nom.length; i++) {
    hash = ((hash << 5) - hash) + nom.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % FALLBACK_COLORS.length;
  return FALLBACK_COLORS[index];
}

export default function LogoImage({ type, nom, code, imageUrl, size = 48, radius = 14, style = {} }) {
  const [err, setErr] = useState(false);
  const letters = ((code || nom || '?').substring(0, 2)).toUpperCase();

  const containerBase = {
    width: size, height: size, borderRadius: radius,
    flexShrink: 0, overflow: 'hidden', ...style,
  };

  // ── imageUrl directe (sites) ──────────────────────────────
  if (imageUrl && !err) {
    return (
      <div style={containerBase}>
        <img src={imageUrl} alt={nom} onError={() => setErr(true)}
          style={{ width:'100%', height:'100%', objectFit:'cover' }} />
      </div>
    );
  }

  // ── CLIENT ou PLANT : logo marque auto ───────────────────
  if ((type === 'client' || type === 'plant') && !err) {
    const logoUrl = getLogoUrl(nom);
    if (logoUrl) {
      return (
        <div style={{
          ...containerBase,
          background: '#fff',
          border: '1.5px solid #E2E8F0',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: size > 40 ? 8 : 5, 
          boxSizing: 'border-box',
        }}>
          <img
            src={logoUrl}
            alt={nom}
            onError={() => setErr(true)}
            style={{ width:'100%', height:'100%', objectFit:'contain' }}
          />
        </div>
      );
    }
  }

  // ── FALLBACK : initiales colorées ────────────────────────
  const bgColor = getFallbackColor(nom);
  
  return (
    <div style={{
      ...containerBase,
      background: `linear-gradient(135deg, ${bgColor}, ${bgColor}CC)`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: '#fff', fontWeight: 900,
      fontSize: size > 40 ? '1rem' : '.75rem',
      letterSpacing: '.03em',
      textShadow: '0 1px 2px rgba(0,0,0,0.2)',
    }}>
      {letters}
    </div>
  );
}