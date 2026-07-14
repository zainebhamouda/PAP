import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth, getDashboardRoute } from '../../context/AuthContext';
import { FaUser, FaLock, FaEye, FaEyeSlash, FaExclamationTriangle, FaArrowLeft } from 'react-icons/fa';
import styles from './Auth.module.css';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  const [form,    setForm]    = useState({ matricule: '', motDePasse: '' });
  const [error,   setError]   = useState('');
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);

  const handleChange = e =>
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(form.matricule, form.motDePasse);
      navigate(getDashboardRoute(user.role));
    } catch (err) {
      setError(err.response?.data?.message || t('auth.erreur'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.authPage} dir={isRTL ? 'rtl' : 'ltr'}>

      {/* ── Panneau gauche ── */}
      <div className={styles.leftPanel}>
        <img src="/wiring.jpg" alt="" className={styles.leftPanelImage} />
        <div className={styles.leftPanelOverlay} />
        <button
          className={styles.homeBtn}
          onClick={() => navigate('/')}
          title={t('nav.dashboard')}
        >
          <FaArrowLeft />
        </button>
      </div>

      {/* ── Panneau droit ── */}
      <div className={styles.rightPanel}>
        <div className={styles.formCard}>
          <div className={styles.formHeader}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
              <div style={{
                width: 44, height: 44,
                background: '#1a56db',
                borderRadius: 16,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                <span style={{ fontSize: '1.7rem', fontWeight: 900, color: '#fff', lineHeight: 1 }}>L</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <span style={{
                  fontSize: '1.25rem', fontWeight: 800,
                  color: 'var(--leoni-navy)', letterSpacing: '0.02em', lineHeight: 1,
                }}>
                  Leoni PAP
                </span>
                <span style={{
                  fontSize: '0.62rem', fontWeight: 500,
                  color: 'var(--gray-400)', letterSpacing: '0.1em',
                  textTransform: 'uppercase', lineHeight: 1,
                }}>
                  Product Audit Platform
                </span>
              </div>
            </div>
            <h2>{t('auth.connexion')}</h2>
            <p>{t('auth.accederEspace')}</p>
          </div>

          {error && (
            <div className={styles.alertError}>
              <FaExclamationTriangle /> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className={styles.form}>

            {/* Matricule */}
            <div className={styles.field}>
              <label>{t('auth.matricule')}</label>
              <div className={styles.inputWrap}>
                <span className={styles.inputIcon}><FaUser /></span>
                <input
                  type="text"
                  name="matricule"
                  value={form.matricule}
                  onChange={handleChange}
                  placeholder="Ex: 278001"
                  required
                  dir="ltr"
                />
              </div>
            </div>

            {/* Mot de passe */}
            <div className={styles.field}>
              <label>{t('auth.motDePasse')}</label>
              <div className={styles.inputWrap}>
                <span className={styles.inputIcon}><FaLock /></span>
                <input
                  type={showPwd ? 'text' : 'password'}
                  name="motDePasse"
                  value={form.motDePasse}
                  onChange={handleChange}
                  placeholder={t('auth.motDePassePlaceholder')}
                  required
                  dir="ltr"
                />
                <button
                  type="button"
                  className={styles.eyeBtn}
                  onClick={() => setShowPwd(s => !s)}
                >
                  {showPwd ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
              <button
                type="button"
                className={styles.forgotLink}
                onClick={() => navigate('/forgot-password')}
              >
                {t('auth.motDePasseOublie')}
              </button>
            </div>

            <button type="submit" className={styles.btnPrimary} disabled={loading}>
              {loading ? <span className={styles.spinner} /> : t('auth.seConnecter')}
            </button>
          </form>

          <div className={styles.divider}>
            <span>{t('auth.pasDeCompte')}</span>
          </div>

          <button
            className={styles.btnOutline}
            onClick={() => navigate('/register')}
          >
            {t('auth.creerCompte')}
          </button>

          <p className={styles.formFooter}>
            {t('auth.copyright', { year: new Date().getFullYear() })}
          </p>
        </div>
      </div>
    </div>
  );
}