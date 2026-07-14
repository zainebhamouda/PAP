// src/pages/auth/ForgotPasswordPage.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaEye, FaEyeSlash, FaLock, FaArrowLeft } from 'react-icons/fa';
import { authAPI } from '../../services/api';
import styles from './Auth.module.css';

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ matricule: '', password: '', confirm: '' });
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!form.matricule || !form.password || !form.confirm) {
      setError('Veuillez remplir tous les champs.');
      return;
    }
    if (form.password !== form.confirm) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }

    try {
      await authAPI.resetPassword({
        matricule: form.matricule,
        password: form.password,
        confirm: form.confirm
      });

      setSuccess('Mot de passe réinitialisé avec succès !');

      // redirige vers login après 1.5s
      setTimeout(() => {
        navigate('/login');
      }, 1500);

    } catch (err) {
      console.log(err);
      console.log(err.response);
      setError(err.response?.data?.message || 'Erreur lors de la réinitialisation du mot de passe.');
    }
  };

  return (
    <div className={styles.authPage}>
      <div className={styles.leftPanel}>
        <img src="/wiring.jpg" alt="" className={styles.leftPanelImage} />
        <div className={styles.leftPanelOverlay} />
        <button
          className={styles.homeBtn}
          onClick={() => navigate('/login')}
          title="Retour à la connexion"
        >
          <FaArrowLeft />
        </button>
      </div>

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
            <h2>Mot de passe oublié</h2>
            <p>Renseignez votre matricule et votre nouveau mot de passe</p>
          </div>

          {error && <div className={styles.alertError}>{error}</div>}
          {success && <div className={styles.alertSuccess}>{success}</div>}

          <form onSubmit={handleSubmit} className={styles.form}>
            {/* Matricule */}
            <div className={styles.field}>
              <label>Matricule</label>
              <input
                type="text"
                name="matricule"
                placeholder="Ex: 278001"
                value={form.matricule}
                onChange={handleChange}
              />
            </div>

            {/* Nouveau mot de passe */}
            <div className={styles.field}>
              <label>Nouveau mot de passe</label>
              <div className={styles.inputWrap}>
                <span className={styles.inputIcon}><FaLock /></span>
                <input
                  type={showPwd ? 'text' : 'password'}
                  name="password"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={handleChange}
                />
                <button
                  type="button"
                  className={styles.eyeBtn}
                  onClick={() => setShowPwd(s => !s)}
                >
                  {showPwd ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>

            {/* Confirmer mot de passe */}
            <div className={styles.field}>
              <label>Confirmer mot de passe</label>
              <div className={styles.inputWrap}>
                <span className={styles.inputIcon}><FaLock /></span>
                <input
                  type={showConfirm ? 'text' : 'password'}
                  name="confirm"
                  placeholder="••••••••"
                  value={form.confirm}
                  onChange={handleChange}
                />
                <button
                  type="button"
                  className={styles.eyeBtn}
                  onClick={() => setShowConfirm(s => !s)}
                >
                  {showConfirm ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>

            <button type="submit" className={styles.btnPrimary}>Confirmer</button>
          </form>
        </div>
      </div>
    </div>
  );
}