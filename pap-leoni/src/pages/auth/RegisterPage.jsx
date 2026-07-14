import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom'; // ← useSearchParams ajouté
import { useTranslation } from 'react-i18next';
import { authAPI, sitesPublicAPI } from '../../services/api';
import { FaExclamationTriangle, FaCheck, FaSearch, FaClipboardCheck, FaBuilding, FaMicroscope, FaArrowLeft, FaEye, FaEyeSlash, FaEnvelope } from 'react-icons/fa'; // ← FaEnvelope ajouté
import styles from './Auth.module.css';

export default function RegisterPage() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  const roles = [
    { value: 'AUDITEUR',                     label: t('profil.roles.AUDITEUR'),                     icon: <FaSearch /> },
    { value: 'CHEF_SERVICE',                 label: t('profil.roles.CHEF_SERVICE'),                 icon: <FaClipboardCheck /> },
    { value: 'RESPONSABLE_QUALITE_CENTRALE', label: t('profil.roles.RESPONSABLE_QUALITE_CENTRALE'), icon: <FaBuilding /> },
    { value: 'EXPERT_PRODUCT_AUDIT',         label: t('profil.roles.EXPERT_PRODUCT_AUDIT'),         icon: <FaMicroscope /> },
  ];

  // ── Lecture des paramètres URL (?matricule=...&email=...) ──────────────
  const [searchParams] = useSearchParams();
  const matriculeUrl   = searchParams.get('matricule') || '';
  const emailUrl       = searchParams.get('email')     || '';
  const venantInvitation = !!(matriculeUrl && emailUrl); // true si lien d'invitation

  const [step,    setStep]    = useState(1);
  const [sites,   setSites]   = useState([]);
  const [plants,  setPlants]  = useState([]);
  const [loadingPlants, setLoadingPlants] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');
  const [success, setSuccess] = useState('');
  const [showPassword,        setShowPassword]        = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // ── État initial : pré-rempli si invitation ────────────────────────────
  const [form, setForm] = useState({
    nom: '', prenom: '',
    email:     emailUrl,     // ← pré-rempli depuis l'URL
    matricule: matriculeUrl, // ← pré-rempli depuis l'URL
    motDePasse: '', confirmerMotDePasse: '',
    roleChoisi: '', siteId: '', plantId: '',
    telephone: '', accepterConditions: false, recevoirNotifications: true,
  });

  useEffect(() => {
    sitesPublicAPI.getAll().then(res => setSites(res.data)).catch(() => {});
  }, []);

  useEffect(() => {
    if (!form.siteId) { setPlants([]); setForm(f => ({ ...f, plantId: '' })); return; }
    setLoadingPlants(true);
    setForm(f => ({ ...f, plantId: '' }));
    sitesPublicAPI.getPlantsBySite(form.siteId)
      .then(res => setPlants(res.data))
      .catch(() => setPlants([]))
      .finally(() => setLoadingPlants(false));
  }, [form.siteId]);

  const handleChange = e => {
    const { name, value, type, checked } = e.target;
    if (error) setError('');
    setForm(f => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
  };

  const isValidEmail = (email) => {
    const normalized = (email || '').trim().toLowerCase();
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized);
  };

  const isValidName = (value) => {
    const normalized = (value || '').trim();
    return /^[A-Za-zÀ-ÖØ-öø-ÿ' -]+$/.test(normalized);
  };

  const handleStep1 = async e => {
    e.preventDefault();

    const erreurs = [];
    if (!form.nom.trim()) erreurs.push(t('auth.nomRequired'));
    else if (!isValidName(form.nom)) erreurs.push(t('auth.nomInvalid'));

    if (!form.prenom.trim()) erreurs.push(t('auth.prenomRequired'));
    else if (!isValidName(form.prenom)) erreurs.push(t('auth.prenomInvalid'));

    if (!form.matricule.trim()) erreurs.push(t('auth.matriculeRequired'));

    if (!form.email.trim()) erreurs.push(t('auth.emailRequired'));
    else if (!isValidEmail(form.email)) erreurs.push(t('auth.emailInvalid'));

    if (!form.motDePasse) erreurs.push(t('auth.passwordRequired'));
    if (!form.confirmerMotDePasse) erreurs.push(t('auth.confirmPasswordRequired'));
    if (form.motDePasse && form.confirmerMotDePasse && form.motDePasse !== form.confirmerMotDePasse) {
      erreurs.push(t('auth.passwordMismatch'));
    }

    if (erreurs.length) { setError(erreurs.join(' ')); return; }

    setLoading(true); setError('');
    try {
      await authAPI.step1({
        nom: form.nom, prenom: form.prenom, email: form.email,
        matricule: form.matricule, motDePasse: form.motDePasse,
        confirmerMotDePasse: form.confirmerMotDePasse,
      });
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.message || t('auth.errorStep1'));
    } finally { setLoading(false); }
  };

  const handleStep2 = async e => {
    e.preventDefault();
    if (!form.plantId) { setError(t('auth.selectPlantRequired')); return; }
    setLoading(true); setError('');
    try {
      await authAPI.step2({
        matricule:  form.matricule,
        roleChoisi: form.roleChoisi,
        siteId:     parseInt(form.siteId),
        plantId:    parseInt(form.plantId),
      });
      setStep(3);
    } catch (err) {
      setError(err.response?.data?.message || t('auth.errorStep2'));
    } finally { setLoading(false); }
  };

  const handleStep3 = async e => {
    e.preventDefault();
    if (!form.accepterConditions) { setError(t('auth.acceptConditionsRequired')); return; }
    setLoading(true); setError('');
    try {
      await authAPI.confirm({
        matricule:             form.matricule,
        telephone:             form.telephone,
        accepterConditions:    form.accepterConditions,
        recevoirNotifications: form.recevoirNotifications,
      });
      setSuccess(t('auth.compteCreatedSuccess'));
      setTimeout(() => navigate('/login'), 2500);
    } catch (err) {
      setError(err.response?.data?.message || t('auth.errorStep3'));
    } finally { setLoading(false); }
  };

  const STEPS = [t('auth.etape1Title'), t('auth.etape2Title'), t('auth.etape3Title')];

  return (
    <div className={styles.authPage} dir={isRTL ? 'rtl' : 'ltr'}>
      <div className={styles.leftPanel}>
        <img src="/wiring.jpg" alt="" className={styles.leftPanelImage} />
        <div className={styles.leftPanelOverlay} />
        <div className={styles.leftContent}>
        <div className={styles.brandLogo}>
  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
    {/* Carré bleu avec le L */}
    <div style={{
      width: 52, height: 52,
      background: '#1a56db',
      borderRadius: 20,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexShrink: 0,
    }}>
      <span style={{ fontSize: '2rem', fontWeight: 900, color: '#fff', lineHeight: 1 }}>L</span>
    </div>

    {/* Texte à droite du carré */}
    <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <span style={{
        fontSize: '1.6rem', fontWeight: 800,
        color: '#fff', letterSpacing: '0.02em', lineHeight: 1,
      }}>
        Leoni PAP
      </span>
      <span style={{
        fontSize: '0.7rem', fontWeight: 300,
        color: 'rgba(255,255,255,0.5)', letterSpacing: '0.12em',
        textTransform: 'uppercase', lineHeight: 1,
      }}>
        Product Audit Platform
      </span>
    </div>
  </div>
</div>
          <button className={styles.homeBtn} onClick={() => navigate('/')} title={t('nav.dashboard')}>
            <FaArrowLeft />
          </button>
          <h1 className={styles.leftTitle}>
            {t('auth.creerVotreCompte')}<br />
            <span className={styles.goldText}>{t('auth.compteTitle')}</span>
          </h1>
          <p className={styles.leftSub}>{t('auth.inscriptionSecurisee')}</p>
          <div className={styles.stepsIndicator}>
            {STEPS.map((s, i) => (
              <div key={i} className={`${styles.stepDot} ${step > i ? styles.stepDone : ''} ${step === i + 1 ? styles.stepActive : ''}`}>
                <div className={styles.stepCircle}>{step > i + 1 ? <FaCheck /> : i + 1}</div>
                <span>{s}</span>
              </div>
            ))}
          </div>
        </div>
        <div className={styles.leftDecor} />
      </div>

      <div className={styles.rightPanel}>
        <div className={styles.formCard}>
          <div className={styles.formHeader}>
            <div className={styles.stepBadge}>{t('auth.etape')} {step} / 3</div>
            <h2>{STEPS[step - 1]}</h2>
            <p>
              {step === 1 && t('auth.etape1Desc')}
              {step === 2 && t('auth.etape2Desc')}
              {step === 3 && t('auth.etape3Desc')}
            </p>
          </div>

          {/* ── Bandeau invitation ─────────────────────────────────────────── */}
          {venantInvitation && step === 1 && (
            <div style={{
              display: 'flex', alignItems: 'flex-start', gap: 10,
              background: '#F0FDF4', border: '1.5px solid #BBF7D0',
              borderRadius: 12, padding: '12px 16px', marginBottom: '1.25rem',
            }}>
              <FaEnvelope style={{ color: '#15803D', marginTop: 2, flexShrink: 0 }} />
              <div>
                <p style={{ margin: 0, fontSize: '.83rem', fontWeight: 700, color: '#15803D' }}>
                  {t('auth.invitationRecue')}
                </p>
                <p style={{ margin: '3px 0 0', fontSize: '.78rem', color: '#166534', lineHeight: 1.5 }}>
                  {t('auth.completezChamps')}
                </p>
              </div>
            </div>
          )}

          {error   && <div className={styles.alertError}><FaExclamationTriangle /> {error}</div>}
          {success && <div className={styles.alertSuccess}><FaCheck /> {success}</div>}

          {/* ── ÉTAPE 1 ── */}
          {step === 1 && (
            <form onSubmit={handleStep1} className={styles.form}>
              <div className={styles.row2}>
                <div className={styles.field}>
                  <label>{t('auth.nom')}</label>
                  <input
                    name="nom"
                    value={form.nom}
                    onChange={handleChange}
                    placeholder="Ben Salem"
                    required
                  />
                </div>
                <div className={styles.field}>
                  <label>{t('auth.prenom')}</label>
                  <input
                    name="prenom"
                    value={form.prenom}
                    onChange={handleChange}
                    placeholder="Ahmed"
                    required
                  />
                </div>
              </div>

              {/* Matricule — verrouillé si invitation */}
              <div className={styles.field}>
                <label>
                  {t('auth.matricule')}
                  {venantInvitation && (
                    <span style={{ marginLeft: 8, fontSize: '.72rem', fontWeight: 700,
                                   background: '#DCFCE7', color: '#15803D',
                                   padding: '2px 8px', borderRadius: 99 }}>
                      {t('auth.preRempli')}
                    </span>
                  )}
                </label>
                <input
                  name="matricule"
                  value={form.matricule}
                  onChange={handleChange}
                  placeholder="278001"
                  required
                  readOnly={venantInvitation}
                  style={venantInvitation ? {
                    background: '#F1F5F9',
                    color: '#64748B',
                    cursor: 'not-allowed',
                    border: '1.5px solid #E2E8F0',
                  } : {}}
                />
              </div>

              {/* Email — verrouillé si invitation */}
              <div className={styles.field}>
                <label>
                  {t('auth.emailProfessionnel')}
                  {venantInvitation && (
                    <span style={{ marginLeft: 8, fontSize: '.72rem', fontWeight: 700,
                                   background: '#DCFCE7', color: '#15803D',
                                   padding: '2px 8px', borderRadius: 99 }}>
                      {t('auth.preRempli')}
                    </span>
                  )}
                </label>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="ahmed@leoni.com"
                  required
                  readOnly={venantInvitation}
                  style={venantInvitation ? {
                    background: '#F1F5F9',
                    color: '#64748B',
                    cursor: 'not-allowed',
                    border: '1.5px solid #E2E8F0',
                  } : {}}
                />
                {venantInvitation && (
                  <p style={{ margin: '4px 0 0', fontSize: '.72rem', color: '#94A3B8' }}>
                    {t('auth.emailEnregistreAdmin')}
                  </p>
                )}
              </div>

              <div className={styles.row2}>
                <div className={styles.field}>
                  <label>{t('auth.motDePasse')}</label>
                  <div className={styles.inputWrap}>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="motDePasse"
                      value={form.motDePasse}
                      onChange={handleChange}
                      placeholder="••••••••"
                      required
                    />
                    <button
                      type="button"
                      className={styles.eyeBtn}
                      onClick={() => setShowPassword(v => !v)}
                      aria-label={showPassword ? t('auth.masquerMotDePasse') : t('auth.afficherMotDePasse')}
                    >
                      {showPassword ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>
                </div>
                <div className={styles.field}>
                  <label>{t('auth.confirmerMotDePasse')}</label>
                  <div className={styles.inputWrap}>
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      name="confirmerMotDePasse"
                      value={form.confirmerMotDePasse}
                      onChange={handleChange}
                      placeholder="••••••••"
                      required
                    />
                    <button
                      type="button"
                      className={styles.eyeBtn}
                      onClick={() => setShowConfirmPassword(v => !v)}
                      aria-label={showConfirmPassword ? t('auth.masquer') : t('auth.afficher')}
                    >
                      {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>
                </div>
              </div>

              <button type="submit" className={styles.btnPrimary} disabled={loading}>
                {loading ? <span className={styles.spinner} /> : t('auth.continuer')}
              </button>
            </form>
          )}

          {/* ── ÉTAPE 2 ── */}
          {step === 2 && (
            <form onSubmit={handleStep2} className={styles.form}>
              <div className={styles.field}>
                <label>{t('auth.votrRole')}</label>
                <div className={styles.roleGrid}>
                  {roles.map(r => (
                    <label key={r.value} className={`${styles.roleCard} ${form.roleChoisi === r.value ? styles.roleCardActive : ''}`}>
                      <input type="radio" name="roleChoisi" value={r.value} onChange={handleChange} hidden />
                      <span className={styles.roleIcon}>{r.icon}</span>
                      <span className={styles.roleLabel}>{r.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className={styles.field}>
                <label>{t('auth.siteAffectation')}</label>
                <select name="siteId" value={form.siteId} onChange={handleChange} required className={styles.select}>
                  <option value="">{t('auth.selectSite')}</option>
                  {sites.map(s => (
                    <option key={s.id} value={s.id}>{s.libelle || `${s.nom} — ${s.localisation}`}</option>
                  ))}
                </select>
              </div>

              {form.siteId && (
                <div className={styles.field}>
                  <label>
                    {t('auth.plantAffectation')}
                    {loadingPlants && (
                      <span style={{ marginLeft: 8, fontSize: '.75rem', color: '#94A3B8' }}>{t('commun.chargement')}</span>
                    )}
                  </label>
                  {plants.length === 0 && !loadingPlants ? (
                    <div style={{ padding: '10px 13px', borderRadius: 10, border: '1.5px solid #FDE68A',
                                  background: '#FFFBEB', fontSize: '.84rem', color: '#92400E' }}>
                      {t('auth.aucunPlantDisponible')}
                    </div>
                  ) : (
                    <select
                      name="plantId"
                      value={form.plantId}
                      onChange={handleChange}
                      required
                      className={styles.select}
                      disabled={loadingPlants}
                    >
                      <option value="">{t('auth.selectPlant')}</option>
                      {plants.map(p => (
                        <option key={p.id} value={p.id}>{p.nom}</option>
                      ))}
                    </select>
                  )}
                </div>
              )}

              <div className={styles.btnRow}>
                <button type="button" className={styles.btnOutline} onClick={() => setStep(1)}>← {t('auth.retour')}</button>
                <button
                  type="submit"
                  className={styles.btnPrimary}
                  disabled={loading || !form.roleChoisi || !form.siteId || !form.plantId}
                >
                  {loading ? <span className={styles.spinner} /> : t('auth.continuer')}
                </button>
              </div>
            </form>
          )}

          {/* ── ÉTAPE 3 ── */}
          {step === 3 && (
            <form onSubmit={handleStep3} className={styles.form}>
              <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 12,
                            padding: '12px 16px', marginBottom: '1.25rem' }}>
                <p style={{ margin: '0 0 6px', fontSize: '.75rem', fontWeight: 700, color: '#94A3B8',
                            textTransform: 'uppercase', letterSpacing: '.06em' }}>{t('auth.recapitulatif')}</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 12px',
                              fontSize: '.82rem', color: '#374151' }}>
                  <span style={{ color: '#94A3B8' }}>{t('auth.matricule')}</span>
                  <span style={{ fontWeight: 700 }}>{form.matricule}</span>
                  <span style={{ color: '#94A3B8' }}>{t('auth.email')}</span>
                  <span style={{ fontWeight: 700 }}>{form.email}</span>
                  <span style={{ color: '#94A3B8' }}>{t('auth.role')}</span>
                  <span style={{ fontWeight: 700 }}>{roles.find(r => r.value === form.roleChoisi)?.label || form.roleChoisi}</span>
                  <span style={{ color: '#94A3B8' }}>{t('auth.site')}</span>
                  <span style={{ fontWeight: 700 }}>{sites.find(s => String(s.id) === String(form.siteId))?.nom || '—'}</span>
                  <span style={{ color: '#94A3B8' }}>{t('auth.plant')}</span>
                  <span style={{ fontWeight: 700 }}>{plants.find(p => String(p.id) === String(form.plantId))?.nom || '—'}</span>
                </div>
              </div>

              <div className={styles.field}>
                <label>{t('auth.telephone')}</label>
                <input
                  name="telephone"
                  value={form.telephone}
                  onChange={handleChange}
                  placeholder="+216 22 000 000"
                  required
                />
              </div>
              <div className={styles.checkField}>
                <label className={styles.checkLabel}>
                  <input type="checkbox" name="accepterConditions" checked={form.accepterConditions} onChange={handleChange} />
                  <span>{t('auth.acceptConditionsLabel')}</span>
                </label>
              </div>
              <div className={styles.checkField}>
                <label className={styles.checkLabel}>
                  <input type="checkbox" name="recevoirNotifications" checked={form.recevoirNotifications} onChange={handleChange} />
                  <span>{t('auth.receiveNotificationsLabel')}</span>
                </label>
              </div>
              <div className={styles.btnRow}>
                <button type="button" className={styles.btnOutline} onClick={() => setStep(2)}>← {t('auth.retour')}</button>
                <button type="submit" className={styles.btnPrimary} disabled={loading}>
                  {loading ? <span className={styles.spinner} /> : <><FaCheck /> {t('auth.createAccountBtn')}</>}
                </button>
              </div>
            </form>
          )}

          <p className={styles.formFooter}>
            {t('auth.alreadyRegistered')} <button className={styles.linkBtn} onClick={() => navigate('/login')}>{t('auth.signInLink')}</button>
          </p>
        </div>
      </div>
    </div>
  );
}