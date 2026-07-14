// ═══════════════════════════════════════════════
// pages/shared/RoleDashboard.jsx
// Dashboard générique — Auditeur / Chef Service / Responsable / Expert
// ═══════════════════════════════════════════════
import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { auditeurAPI, chefServiceAPI, responsableAPI, expertAPI, profilAPI } from '../../services/api';
import styles from './Shared.module.css';

const ROLE_CONFIG = {
  AUDITEUR: {
    api: auditeurAPI.dashboard,
    gradient: ['#1A7A4A', '#2ECC71'],
    icon: '🔍',
    cards: [
      { icon: '🏆', label: 'Certifications', value: '—', sub: 'Sprint 2', color: '#C8982A' },
      { icon: '📋', label: 'Audits assignés', value: '—', sub: 'Sprint 2', color: '#0057B8' },
      { icon: '📄', label: 'Rapports soumis', value: '—', sub: 'Sprint 2', color: '#1A7A4A' },
      { icon: '🔄', label: 'PDCA en cours',  value: '—', sub: 'Sprint 2', color: '#7B2D8B' },
    ],
    fonctionnalites: [
      { icon: '🏆', label: 'Passer certification',   desc: 'Évaluez vos compétences produit',    sprint: 2 },
      { icon: '🔄', label: 'Repasser certification', desc: 'Améliorez votre score',               sprint: 2 },
      { icon: '🔍', label: 'Réaliser audits',        desc: 'Auditez les produits assignés',       sprint: 2 },
      { icon: '📎', label: 'Importer annexes',       desc: 'Joindre des fichiers aux audits',     sprint: 2 },
      { icon: '📝', label: 'Remplir rapport',        desc: 'Rédigez vos rapports d\'audit',       sprint: 2 },
      { icon: '🔄', label: 'Gérer PDCA',            desc: 'Plan d\'action correctif et préventif', sprint: 2 },
    ],
  },
  CHEF_SERVICE: {
    api: chefServiceAPI.dashboard,
    gradient: ['#003F8A', '#0057B8'],
    icon: '📋',
    cards: [
      { icon: '📋', label: 'Audits en cours', value: '—', sub: 'Sprint 2', color: '#0057B8' },
      { icon: '📄', label: 'Rapports',        value: '—', sub: 'Sprint 2', color: '#1A7A4A' },
      { icon: '🏆', label: 'Certifications',  value: '—', sub: 'Sprint 2', color: '#C8982A' },
      { icon: '📊', label: 'Indicateurs',     value: '—', sub: 'Sprint 2', color: '#7B2D8B' },
    ],
    fonctionnalites: [
      { icon: '📋', label: 'Gestion des audits',   desc: 'Planifiez et suivez les audits',       sprint: 2 },
      { icon: '📄', label: 'Gestion des rapports', desc: 'Consultez et validez les rapports',     sprint: 2 },
      { icon: '🏆', label: 'Gérer certification',  desc: 'Supervisez les certifications',         sprint: 2 },
      { icon: '📊', label: 'Indicateurs & stats',  desc: 'Tableaux de bord analytiques',         sprint: 3 },
    ],
  },
  RESPONSABLE_QUALITE_CENTRALE: {
    api: responsableAPI.dashboard,
    gradient: ['#7B2D8B', '#9B59B6'],
    icon: '🏢',
    cards: [
      { icon: '🗺', label: 'Sites supervisés',     value: '—', sub: 'Sprint 2', color: '#0057B8' },
      { icon: '⚠', label: 'Non-conformités',      value: '—', sub: 'Sprint 2', color: '#C0392B' },
      { icon: '🏆', label: 'Certifications',       value: '—', sub: 'Sprint 2', color: '#C8982A' },
      { icon: '📊', label: 'Indicateurs QK',       value: '—', sub: 'Sprint 2', color: '#1A7A4A' },
    ],
    fonctionnalites: [
      { icon: '🏆', label: 'Superviser certifications', desc: 'Vue globale des certifications',  sprint: 2 },
      { icon: '🗺', label: 'Supervision multi-sites',   desc: 'Tableau de bord de tous les sites', sprint: 2 },
      { icon: '📊', label: 'Suivi QK',                 desc: 'Indicateurs qualité centralisés',  sprint: 2 },
      { icon: '⚠', label: 'Suivi non-conformités',    desc: 'Alertes et actions correctives',    sprint: 2 },
      { icon: '📈', label: 'Statistiques',              desc: 'Rapports et KPIs avancés',         sprint: 3 },
      { icon: '📋', label: 'Règles Plates',             desc: 'Gestion des règles qualité',       sprint: 3 },
    ],
  },
  EXPERT_PRODUCT_AUDIT: {
    api: expertAPI.dashboard,
    gradient: ['#C0392B', '#E74C3C'],
    icon: '🔬',
    cards: [
      { icon: '🏆', label: 'Certifications gérées', value: '—', sub: 'Sprint 2', color: '#C8982A' },
      { icon: '❓', label: 'Questions créées',       value: '—', sub: 'Sprint 2', color: '#0057B8' },
      { icon: '📜', label: 'Historique',             value: '—', sub: 'Sprint 2', color: '#1A7A4A' },
    ],
    fonctionnalites: [
      { icon: '🏆', label: 'Gérer certifications', desc: 'Créez et gérez les niveaux de certification', sprint: 2 },
      { icon: '❓', label: 'Gérer questions',      desc: 'Banque de questions pour les évaluations',   sprint: 2 },
      { icon: '📜', label: 'Historique',           desc: 'Consultez l\'historique des actions',        sprint: 2 },
    ],
  },
};

const ROLE_LABELS = {
  AUDITEUR:                     'Auditeur',
  CHEF_SERVICE:                 'Chef de Service',
  RESPONSABLE_QUALITE_CENTRALE: 'Responsable Qualité Centrale',
  EXPERT_PRODUCT_AUDIT:         'Expert Product Audit',
};

export default function RoleDashboard() {
  const { user } = useAuth();
  const [profil,  setProfil]  = useState(null);
  const [loading, setLoading] = useState(true);

  const config = ROLE_CONFIG[user?.role];

  useEffect(() => {
    profilAPI.get()
      .then(res => setProfil(res.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className={styles.loader}>
      <span className={styles.loaderSpin} /> Chargement...
    </div>
  );

  return (
    <div className={styles.page}>
      {/* Banner */}
      <div
        className={styles.banner}
        style={{ background: `linear-gradient(135deg, ${config?.gradient[0]} 0%, ${config?.gradient[1]} 100%)` }}
      >
        <div className={styles.bannerLeft}>
          <div className={styles.bannerIcon}>{config?.icon}</div>
          <div>
            <h2>Bienvenue, {profil?.prenom} {profil?.nom} 👋</h2>
            <p>{ROLE_LABELS[user?.role]}</p>
            {profil?.siteNom && <p className={styles.bannerSite}>📍 {profil.siteNom} — {profil.siteLocalisation}</p>}
          </div>
        </div>
        <div className={styles.bannerRight}>
          <div className={styles.bannerMatricule}>
            <span>Matricule</span>
            <strong>{profil?.matricule}</strong>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className={styles.statsGrid}>
        {config?.cards.map((card, i) => (
          <div key={i} className={styles.statCard} style={{ animationDelay: `${i * 0.07}s` }}>
            <div className={styles.statIcon} style={{ background: card.color + '15', color: card.color }}>
              {card.icon}
            </div>
            <div>
              <div className={styles.statValue} style={{ color: card.color }}>{card.value}</div>
              <div className={styles.statLabel}>{card.label}</div>
              <div className={styles.statSub}>{card.sub}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Fonctionnalités */}
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <h3>Mes fonctionnalités</h3>
          <span className={styles.sprintNote}>🚀 Sprint 2 en cours de développement</span>
        </div>
        <div className={styles.featGrid}>
          {config?.fonctionnalites.map((f, i) => (
            <div key={i} className={`${styles.featCard} ${f.sprint > 1 ? styles.featDisabled : ''}`}>
              <div className={styles.featIcon}>{f.icon}</div>
              <div>
                <p className={styles.featLabel}>{f.label}</p>
                <p className={styles.featDesc}>{f.desc}</p>
              </div>
              {f.sprint > 1 && (
                <span className={styles.featBadge}>Sprint {f.sprint}</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Profil résumé */}
      <div className={styles.card}>
        <div className={styles.cardHeader}><h3>Mon profil</h3></div>
        <div className={styles.profilGrid}>
          {[
            { label: 'Nom complet',   value: `${profil?.prenom} ${profil?.nom}` },
            { label: 'Matricule',     value: profil?.matricule },
            { label: 'Email',         value: profil?.email || '—' },
            { label: 'Téléphone',     value: profil?.telephone || '—' },
            { label: 'Site',          value: profil?.siteNom ? `${profil.siteNom} — ${profil.siteLocalisation}` : '—' },
            { label: 'Plant / Client',value: profil?.plantNom || '—' },
          ].map((item, i) => (
            <div key={i} className={styles.profilItem}>
              <span className={styles.profilLabel}>{item.label}</span>
              <span className={styles.profilValue}>{item.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
