import { useState, useEffect } from 'react';
import { auditSpecialAPI } from '../../services/auditSpecialAPI';
import { sitesPublicAPI, authAPI } from '../../services/api';
import { useAuth, getUserPlantScope } from '../../context/AuthContext';

/* ─── Tokens ─── */
const T = {
  navy: '#002855', blue: '#003F8A', blueM: '#0057B8',
  g50: '#F7F9FC', g100: '#EEF2F8', g200: '#DAE2EF', g400: '#8A9BBC',
  g700: '#273347', success: '#15803D', warn: '#C8982A', danger: '#C0392B',
};

const fmt = (d) => d ? new Date(d).toLocaleDateString('fr-FR') : '—';
const today = () => new Date().toISOString().split('T')[0];

/* ─── Helpers ─── */
function Input({ label, value, onChange, type = 'text', disabled, required, placeholder }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: 'block', fontSize: '.76rem', fontWeight: 700, color: T.g700, marginBottom: 4 }}>
        {label}{required && <span style={{ color: T.danger }}> *</span>}
      </label>
      <input
        type={type} value={value} onChange={e => onChange(e.target.value)}
        disabled={disabled} placeholder={placeholder}
        style={{
          width: '100%', padding: '9px 12px', border: `1.5px solid ${T.g200}`,
          borderRadius: 8, fontSize: '.85rem', color: T.g700,
          background: disabled ? T.g50 : '#fff', boxSizing: 'border-box',
          outline: 'none',
        }}
      />
    </div>
  );
}

function Select({ label, value, onChange, options, required, placeholder, disabled }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: 'block', fontSize: '.76rem', fontWeight: 700, color: T.g700, marginBottom: 4 }}>
        {label}{required && <span style={{ color: T.danger }}> *</span>}
      </label>
      <select
        value={value} onChange={e => onChange(e.target.value)}
        disabled={disabled}
        style={{
          width: '100%', padding: '9px 12px', border: `1.5px solid ${T.g200}`,
          borderRadius: 8, fontSize: '.85rem', color: T.g700,
          background: disabled ? T.g50 : '#fff', boxSizing: 'border-box', cursor: disabled ? 'not-allowed' : 'pointer',
        }}
      >
        <option value="">{placeholder || 'Sélectionner…'}</option>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

function Btn({ children, onClick, disabled, variant = 'primary', style = {} }) {
  const vs = {
    primary: { background: T.navy, color: '#fff' },
    secondary: { background: T.g100, color: T.g700 },
    danger: { background: '#FEF2F2', color: T.danger, border: `1px solid #FCA5A5` },
    success: { background: T.success, color: '#fff' },
  };
  return (
    <button onClick={disabled ? undefined : onClick} disabled={disabled}
      style={{
        padding: '9px 20px', borderRadius: 8, border: 'none', cursor: disabled ? 'not-allowed' : 'pointer',
        fontWeight: 700, fontSize: '.84rem', opacity: disabled ? .55 : 1,
        transition: 'all .15s', ...vs[variant], ...style,
      }}>{children}</button>
  );
}

/* ─── ÉTAPE 1 : Choix du type d'audit ─── */
function StepChoixType({ onChoix }) {
  const types = [
    {
      key: 'REGLE_PLATE',
      icon: '📏',
      titre: 'Audit Règle Plate',
      sous: 'Gestion des mètres ruban et règle plate dans la production',
      ref: 'IT TN 3627',
      color: '#1D4ED8',
      bg: '#EFF6FF',
    },
    {
      key: 'EXPORT',
      icon: '📦',
      titre: 'Audit Magasin Export',
      sous: 'Audit du salle d\'export — contrôle avant expédition',
      ref: 'IT 3600-05',
      color: '#7C3AED',
      bg: '#F5F3FF',
    },
  ];

  return (
    <div>
      <h3 style={{ margin: '0 0 6px', color: T.navy, fontSize: '1.05rem' }}>Choisir le type d'audit</h3>
      <p style={{ margin: '0 0 22px', color: T.g400, fontSize: '.84rem' }}>
        Sélectionnez le type d'audit à créer et à envoyer à un auditeur.
      </p>
      <div style={{ display: 'grid', gap: 14 }}>
        {types.map(t => (
          <button key={t.key} onClick={() => onChoix(t.key)}
            style={{
              display: 'flex', alignItems: 'center', gap: 16, padding: '18px 20px',
              border: `2px solid ${t.color}20`, borderRadius: 14, cursor: 'pointer',
              background: t.bg, textAlign: 'left', transition: 'all .15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = t.color; e.currentTarget.style.transform = 'translateY(-1px)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = t.color + '20'; e.currentTarget.style.transform = 'none'; }}
          >
            <div style={{ fontSize: '2rem' }}>{t.icon}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 800, fontSize: '.95rem', color: t.color }}>{t.titre}</div>
              <div style={{ fontSize: '.78rem', color: T.g400, margin: '3px 0' }}>{t.sous}</div>
              <span style={{ fontSize: '.68rem', fontWeight: 700, background: t.color + '20', color: t.color, padding: '2px 8px', borderRadius: 99 }}>{t.ref}</span>
            </div>
            <div style={{ color: t.color, fontSize: '1.2rem' }}>→</div>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ─── ÉTAPE 2A : Formulaire Règle Plate ─── */
function FormReglePlate({ auditeurs, plants, onSubmit, loading, plantScope }) {
  const [plantId, setPlantId]     = useState('');
  const [auditeurId, setAuditeur] = useState('');
  const [datePrevue, setDate]     = useState(today());
  const [obs, setObs]             = useState('');
  const lockedPlantId = plantScope?.plantId ? String(plantScope.plantId) : '';
  // Instruments : lignes dynamiques
  const [instruments, setInstruments] = useState([
    { numeroInstrument: '', typeInstrument: 'REGLE_PLATE', localisation: '', periodiciteEnMois: 3 }
  ]);

  useEffect(() => {
    if (lockedPlantId) {
      setPlantId(lockedPlantId);
    }
  }, [lockedPlantId]);

  const addInstrument = () =>
    setInstruments(p => [...p, { numeroInstrument: '', typeInstrument: 'REGLE_PLATE', localisation: '', periodiciteEnMois: 3 }]);

  const updateInstrument = (i, field, val) =>
    setInstruments(p => p.map((item, idx) => idx === i ? { ...item, [field]: val } : item));

  const removeInstrument = (i) =>
    setInstruments(p => p.filter((_, idx) => idx !== i));

  const handleSubmit = () => {
    if (!plantId || !auditeurId) return;
    onSubmit({
      plantId: parseInt(plantId),
      auditeurId: parseInt(auditeurId),
      datePrevue,
      observations: obs,
      instruments: instruments.filter(i => i.numeroInstrument.trim()),
    });
  };

  // Calcul nom automatique
  const auditeurChoisi = auditeurs.find(a => a.value === auditeurId);
  const nomAuto = auditeurChoisi && datePrevue
    ? `audit regle plat_${auditeurChoisi.label}_${new Date(datePrevue).toLocaleDateString('fr-FR')}`
    : 'audit regle plat_…_…';

  return (
    <div>
      {/* Nom automatique preview */}
      <div style={{ background: '#EFF6FF', border: '1.5px solid #BFDBFE', borderRadius: 10, padding: '10px 14px', marginBottom: 18 }}>
        <div style={{ fontSize: '.68rem', fontWeight: 700, color: '#1D4ED8', marginBottom: 3 }}>NOM AUTOMATIQUE DE L'AUDIT</div>
        <div style={{ fontFamily: 'monospace', fontSize: '.82rem', color: T.navy, fontWeight: 700 }}>{nomAuto}</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <Select label="Plant" value={plantId} onChange={setPlantId} required
          options={lockedPlantId ? (plants.filter(p => String(p.value) === lockedPlantId).length ? plants.filter(p => String(p.value) === lockedPlantId) : [{ value: lockedPlantId, label: plantScope?.plantNom || 'Plant verrouillé' }]) : plants}
          placeholder="Sélectionner le plant…" disabled={!!lockedPlantId} />
        <Select label="Auditeur" value={auditeurId} onChange={setAuditeur} required
          options={auditeurs} placeholder="Sélectionner l'auditeur…" />
      </div>

        <div style={{ marginBottom: 14 }}>
          <label style={{ display: 'block', fontSize: '.8rem', fontWeight: 700, color: '#555', marginBottom: 4 }}>Date (automatique)</label>
          <input type="date" value={today} readOnly style={{ width: '100%', padding: '8px 10px', border: '1.5px solid #DAE2EF', borderRadius: 8, fontSize: '.84rem', background: '#F7F9FC', color: '#8A9BBC' }} />
        </div>
      <div style={{ fontSize: '.72rem', color: T.g400, marginTop: -10, marginBottom: 14 }}>
        📅 Date générée automatiquement (aujourd'hui)
      </div>

      <Input label="Observations" value={obs} onChange={setObs} placeholder="Observations libres…" />

      {/* Instruments */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: '.76rem', fontWeight: 700, color: T.g700, marginBottom: 8 }}>
          Instruments à contrôler
          <span style={{ color: T.g400, fontWeight: 400, marginLeft: 8 }}>({instruments.length} ligne{instruments.length > 1 ? 's' : ''})</span>
        </div>
        {instruments.map((inst, i) => (
          <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr 1fr auto', gap: 8, marginBottom: 8, alignItems: 'end' }}>
            <input value={inst.numeroInstrument} onChange={e => updateInstrument(i, 'numeroInstrument', e.target.value)}
              placeholder="N° instrument (ex: V69)"
              style={{ padding: '8px 10px', border: `1.5px solid ${T.g200}`, borderRadius: 8, fontSize: '.82rem' }} />
            <select value={inst.typeInstrument} onChange={e => updateInstrument(i, 'typeInstrument', e.target.value)}
              style={{ padding: '8px 10px', border: `1.5px solid ${T.g200}`, borderRadius: 8, fontSize: '.82rem' }}>
              <option value="REGLE_PLATE">Règle plate</option>
              <option value="METRE_RUBAN">Mètre ruban</option>
            </select>
            <input value={inst.localisation} onChange={e => updateInstrument(i, 'localisation', e.target.value)}
              placeholder="Utilisateur / localisation"
              style={{ padding: '8px 10px', border: `1.5px solid ${T.g200}`, borderRadius: 8, fontSize: '.82rem' }} />
            <button onClick={() => removeInstrument(i)} disabled={instruments.length === 1}
              style={{ padding: '8px 10px', background: '#FEF2F2', color: T.danger, border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 700 }}>✕</button>
          </div>
        ))}
        <button onClick={addInstrument}
          style={{ padding: '7px 14px', background: T.g100, border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: '.8rem', fontWeight: 700, color: T.g700 }}>
          + Ajouter un instrument
        </button>
      </div>

      <Btn onClick={handleSubmit} disabled={!plantId || !auditeurId || loading} variant="success" style={{ width: '100%', marginTop: 6 }}>
        {loading ? '⏳ Création en cours…' : '📤 Envoyer l\'audit à l\'auditeur'}
      </Btn>
    </div>
  );
}

/* ─── ÉTAPE 2B : Formulaire Export ─── */
function FormExport({ auditeurs, onSubmit, loading }) {
  const [auditeurId, setAuditeur] = useState('');
  const [datePrevue, setDate]     = useState(today());
  const [semaine, setSemaine]     = useState('');
  const [obs, setObs]             = useState('');
  const [details, setDetails]     = useState([
    { numeroSerie: '', numeroCaisse: '' },
  ]);

  const addDetail = () =>
    setDetails(p => [...p, { numeroSerie: '', numeroCaisse: '' }]);

  const updateDetail = (i, field, val) =>
    setDetails(p => p.map((item, idx) => idx === i ? { ...item, [field]: val } : item));

  const removeDetail = (i) =>
    setDetails(p => p.filter((_, idx) => idx !== i));

  const handleSubmit = () => {
    if (!auditeurId || details.filter(d => d.numeroSerie.trim()).length === 0) return;
    onSubmit({
      auditeurId: parseInt(auditeurId),
      datePrevue,
      semaineExport: semaine,
      observations: obs,
      details: details.filter(d => d.numeroSerie.trim()),
    });
  };

  const auditeurChoisi = auditeurs.find(a => a.value === auditeurId);
  const nomAuto = auditeurChoisi && datePrevue
    ? `audit export_${auditeurChoisi.label}_${new Date(datePrevue).toLocaleDateString('fr-FR')}`
    : 'audit export_…_…';

  return (
    <div>
      {/* Nom automatique preview */}
      <div style={{ background: '#F5F3FF', border: '1.5px solid #DDD6FE', borderRadius: 10, padding: '10px 14px', marginBottom: 18 }}>
        <div style={{ fontSize: '.68rem', fontWeight: 700, color: '#7C3AED', marginBottom: 3 }}>NOM AUTOMATIQUE DE L'AUDIT</div>
        <div style={{ fontFamily: 'monospace', fontSize: '.82rem', color: T.navy, fontWeight: 700 }}>{nomAuto}</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <Select label="Auditeur" value={auditeurId} onChange={setAuditeur} required
          options={auditeurs} placeholder="Sélectionner l'auditeur…" />
        <Input label="Semaine export (ex: LTN01/KW13)" value={semaine} onChange={setSemaine}
          placeholder="LTN01/KW13" />
      </div>

      <Input label="Date prévue" type="date" value={datePrevue} onChange={setDate} disabled />
      <div style={{ fontSize: '.72rem', color: T.g400, marginTop: -10, marginBottom: 14 }}>
        📅 Date générée automatiquement (aujourd'hui)
      </div>

      {/* Séries + Caisses */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: '.76rem', fontWeight: 700, color: T.g700, marginBottom: 8 }}>
          Séries et caisses à auditer
          <span style={{ color: T.g400, fontWeight: 400, marginLeft: 8 }}>({details.length} container{details.length > 1 ? 's' : ''})</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '3fr 3fr auto', gap: 8, marginBottom: 6 }}>
          <div style={{ fontSize: '.7rem', fontWeight: 700, color: T.g400 }}>N° de série</div>
          <div style={{ fontSize: '.7rem', fontWeight: 700, color: T.g400 }}>N° de caisse</div>
          <div></div>
        </div>
        {details.map((d, i) => (
          <div key={i} style={{ display: 'grid', gridTemplateColumns: '3fr 3fr auto', gap: 8, marginBottom: 8, alignItems: 'center' }}>
            <input value={d.numeroSerie} onChange={e => updateDetail(i, 'numeroSerie', e.target.value)}
              placeholder="Ex: 3SE 971 694 CJ"
              style={{ padding: '8px 10px', border: `1.5px solid ${T.g200}`, borderRadius: 8, fontSize: '.82rem' }} />
            <input value={d.numeroCaisse} onChange={e => updateDetail(i, 'numeroCaisse', e.target.value)}
              placeholder="Ex: S510110641"
              style={{ padding: '8px 10px', border: `1.5px solid ${T.g200}`, borderRadius: 8, fontSize: '.82rem' }} />
            <button onClick={() => removeDetail(i)} disabled={details.length === 1}
              style={{ padding: '8px 10px', background: '#FEF2F2', color: T.danger, border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 700 }}>✕</button>
          </div>
        ))}
        <button onClick={addDetail}
          style={{ padding: '7px 14px', background: T.g100, border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: '.8rem', fontWeight: 700, color: T.g700 }}>
          + Ajouter une série / caisse
        </button>
      </div>

      <Input label="Observations / remarques" value={obs} onChange={setObs} placeholder="Remarques libres…" />

      <Btn onClick={handleSubmit}
        disabled={!auditeurId || details.filter(d => d.numeroSerie.trim()).length === 0 || loading}
        variant="success" style={{ width: '100%', marginTop: 6 }}>
        {loading ? '⏳ Création en cours…' : '📤 Envoyer l\'audit à l\'auditeur'}
      </Btn>
    </div>
  );
}

/* ─── COMPOSANT PRINCIPAL ─── */
export default function CreerAuditSpecialModal({ onClose, onSuccess }) {
  const [step, setStep]       = useState('choix'); // choix | regle-plate | export
  const [auditeurs, setAuditeurs] = useState([]);
  const [plants, setPlants]   = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [success, setSuccess] = useState('');
  const { user } = useAuth();
  const plantScope = getUserPlantScope(user);

  useEffect(() => {
    // Charger la liste des auditeurs
    fetch('/api/admin/utilisateurs', { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } })
      .then(r => r.json())
      .then(data => {
        const list = Array.isArray(data) ? data : (data.content || []);
        setAuditeurs(
          list.filter(u => u.role === 'AUDITEUR' && u.actif !== false)
              .map(u => ({ value: String(u.id), label: `${u.nom || ''} ${u.prenom || ''}`.trim() }))
        );
      }).catch(() => {});

    // Charger les plants
    fetch('/api/sites/plants', { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } })
      .then(r => r.json())
      .then(data => {
        const list = Array.isArray(data) ? data : [];
        setPlants(list.map(p => ({ value: String(p.id), label: p.nom || p.code || `Plant ${p.id}` })));
      }).catch(() => {});
  }, []);

  const handleSubmitReglePlate = async (data) => {
    setLoading(true); setError('');
    try {
      await auditSpecialAPI.creerReglePlate(data);
      setSuccess('Audit règle plate créé et envoyé à l\'auditeur ✓');
      setTimeout(() => { onSuccess && onSuccess(); onClose(); }, 1500);
    } catch (e) {
      setError(e.response?.data?.message || 'Erreur lors de la création');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitExport = async (data) => {
    setLoading(true); setError('');
    try {
      await auditSpecialAPI.creerExport(data);
      setSuccess('Audit magasin export créé et envoyé à l\'auditeur ✓');
      setTimeout(() => { onSuccess && onSuccess(); onClose(); }, 1500);
    } catch (e) {
      setError(e.response?.data?.message || 'Erreur lors de la création');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', zIndex: 1000,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{
        background: '#fff', borderRadius: 18, width: '100%', maxWidth: 620,
        maxHeight: '90vh', overflow: 'auto', boxShadow: '0 24px 64px rgba(0,40,85,.22)',
        padding: 32,
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <div style={{ fontSize: '.7rem', fontWeight: 700, color: T.g400, textTransform: 'uppercase', letterSpacing: 1 }}>
              SPRINT 4 — EXPERT
            </div>
            <h2 style={{ margin: 0, color: T.navy, fontSize: '1.15rem' }}>
              {step === 'choix' ? 'Créer un nouvel audit' :
               step === 'regle-plate' ? '📏 Audit Règle Plate' : '📦 Audit Magasin Export'}
            </h2>
          </div>
          <button onClick={onClose} style={{ background: T.g100, border: 'none', borderRadius: 8, width: 36, height: 36, cursor: 'pointer', fontSize: '1.1rem', color: T.g700 }}>✕</button>
        </div>

        {/* Retour */}
        {step !== 'choix' && (
          <button onClick={() => setStep('choix')}
            style={{ marginBottom: 18, background: 'none', border: 'none', color: T.blueM, cursor: 'pointer', fontSize: '.84rem', fontWeight: 600, padding: 0 }}>
            ← Retour au choix
          </button>
        )}

        {/* Messages */}
        {error && <div style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: 8, padding: '10px 14px', marginBottom: 16, color: T.danger, fontSize: '.83rem' }}>{error}</div>}
        {success && <div style={{ background: '#F0FDF4', border: '1px solid #86EFAC', borderRadius: 8, padding: '10px 14px', marginBottom: 16, color: T.success, fontSize: '.83rem' }}>{success}</div>}

        {/* Étapes */}
        {step === 'choix' && <StepChoixType onChoix={setStep} />}
        {step === 'regle-plate' && (
          <FormReglePlate auditeurs={auditeurs} plants={plants} onSubmit={handleSubmitReglePlate} loading={loading} plantScope={plantScope} />
        )}
        {step === 'export' && (
          <FormExport auditeurs={auditeurs} onSubmit={handleSubmitExport} loading={loading} />
        )}
      </div>
    </div>
  );
}