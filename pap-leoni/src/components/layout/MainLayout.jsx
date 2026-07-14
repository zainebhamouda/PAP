// ═══════════════════════════════════════════════
// components/layout/MainLayout.jsx — i18n complet
// ═══════════════════════════════════════════════
import { useState, useEffect, useRef } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import styles from './Layout.module.css';
import { notifAPI } from '../../services/api';
import { resolveNotificationLink } from '../../utils/notificationNavigation';
import { useTranslation } from 'react-i18next';
import { useAuth, getDashboardRoute, getRoleLabel } from '../../context/AuthContext';

const ROLE_CONFIG = {
  ADMIN:                        { label: 'Administrateur',       color: '#C8982A', bg: 'rgba(200,152,42,.12)' },
  AUDITEUR:                     { label: 'Auditeur',             color: '#059669', bg: 'rgba(5,150,105,.1)'  },
  CHEF_SERVICE:                 { label: 'Chef de Service',      color: '#0057B8', bg: 'rgba(0,87,184,.1)'   },
  RESPONSABLE_QUALITE_CENTRALE: { label: 'Resp. Qualité',        color: '#7B2D8B', bg: 'rgba(123,45,139,.1)' },
  EXPERT_PRODUCT_AUDIT:         { label: 'Expert Audit',         color: '#C0392B', bg: 'rgba(192,57,43,.1)'  },
};

function getInitials(user) {
  return ((user?.prenom?.[0] || '') + (user?.nom?.[0] || '')).toUpperCase() || '?';
}

function timeAgo(dateStr, t) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return t('notifications.instantane');
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}j`;
}

const NOTIF_ICONS = {
  EXPIRATION_CERTIFICATION: { icon: '🏆', color: '#C8982A', bg: 'rgba(200,152,42,.1)' },
  ASSIGNATION:              { icon: '📋', color: '#0057B8', bg: 'rgba(0,87,184,.1)' },
  ALERTE_QK:                { icon: '⚠️', color: '#D97706', bg: 'rgba(217,119,6,.1)' },
  SYSTEME:                  { icon: '🔔', color: '#6366F1', bg: 'rgba(99,102,241,.1)' },
};
const NOTIF_FALLBACK = { icon: '🔔', color: '#6366F1', bg: 'rgba(99,102,241,.1)' };

export default function MainLayout() {
  const [collapsed,     setCollapsed]   = useState(false);
  const [notifCount,    setNotifCount]  = useState(0);
  const [notifDropOpen, setNotifDrop]   = useState(false);
  const [recentNotifs,  setRecentNotifs] = useState([]);
  const [dropOpen,      setDropOpen]    = useState(false);
  const navigate  = useNavigate();
  const location  = useLocation();
  const { user, logout, roleChange, appliquerChangementRole } = useAuth();
  const { t, i18n } = useTranslation();
  const dropRef   = useRef();
  const notifRef  = useRef();
  const roleConf  = ROLE_CONFIG[user?.role] || {};
  const isRTL     = i18n.language === 'ar';
  const NOTIF_ROLES = [
  'AUDITEUR',
  'RESPONSABLE_MAGASIN',
  'CHEF_SERVICE',
  'ADMIN',
  'EXPERT_PRODUCT_AUDIT',
  'RESPONSABLE_QUALITE_CENTRALE'
];

  const isFullPage = location.pathname.endsWith('/profil')
    || location.pathname.endsWith('/parametres')
    || location.pathname === '/auditeur/certif/examen';

  const profilPath = () => {
    const r = user?.role?.toLowerCase().replace(/_/g, '-');
    const map = { 'expert-product-audit': 'expert', 'responsable-qualite-centrale': 'responsable' };
    return `/${map[r] || r}/profil`;
  };

  const parametresPath = () => {
    const r = user?.role?.toLowerCase().replace(/_/g, '-');
    const map = { 'expert-product-audit': 'expert', 'responsable-qualite-centrale': 'responsable' };
    return `/${map[r] || r}/parametres`;
  };

  const loadNotifs = () => {
    if (!NOTIF_ROLES.includes(user?.role)) return;
    notifAPI.getAll?.()
      .then(res => {
        const all = res.data || [];
        setNotifCount(all.filter(n => !n.lue).length);
        setRecentNotifs(all.slice(0, 5));
      })
      .catch(() => {});
    notifAPI.getNonLues?.()
      .then(res => setNotifCount(res.data?.count || 0))
      .catch(() => {});
  };

  useEffect(() => {
    loadNotifs();
   if (!NOTIF_ROLES.includes(user?.role)) return;
    const timer = setInterval(loadNotifs, 30000);
    return () => clearInterval(timer);
  }, [location.pathname, user?.role]);

  useEffect(() => {
    const h = (e) => {
      if (dropRef.current  && !dropRef.current.contains(e.target))  setDropOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifDrop(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);
useEffect(() => {
  const isRTL = i18n.language === 'ar';

  document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
  document.documentElement.lang = i18n.language;

}, [i18n.language]);
  const markAllRead = () => {
    notifAPI.marquerTout?.().then(() => { setNotifCount(0); loadNotifs(); }).catch(() => {});
  };

  const markRead = (id) => {
    notifAPI.marquerLue?.(id).then(() => loadNotifs()).catch(() => {});
  };

  // RTL layout: sidebar on right, content on left
  const layoutStyle = isRTL
    ? { flexDirection: 'row-reverse' }
    : {};

  // Content margin depends on RTL
  const contentClass = collapsed ? styles.mainContentCollapsed : '';

  return (
    <div className={styles.mainLayout} style={layoutStyle}>
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(c => !c)} />

      <div className={`${styles.mainContent} ${contentClass}`}
        style={isRTL ? { marginRight: collapsed ? 68 : 240, marginLeft: 0 } : {}}>

        {/* ══ BANNIÈRE CHANGEMENT DE RÔLE ══ */}
        {roleChange && (
          <div style={{
            background: 'linear-gradient(90deg, #0B2347 0%, #1A3060 100%)',
            borderBottom: '1px solid rgba(252,211,77,.25)',
            padding: '10px 24px',
            display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap',
            zIndex: 200, position: 'sticky', top: 0,
            flexDirection: isRTL ? 'row-reverse' : 'row',
          }}>
            <div style={{ fontSize: '1.1rem' }}>🔄</div>
            <div style={{ flex: 1, textAlign: isRTL ? 'right' : 'left' }}>
              <span style={{ color: '#FCD34D', fontWeight: 700, fontSize: '.85rem' }}>
                {t('nav.votrRoleMaj')}
              </span>
              <span style={{ color: 'rgba(255,255,255,.65)', fontSize: '.82rem', marginLeft: isRTL ? 0 : 8, marginRight: isRTL ? 8 : 0 }}>
                {getRoleLabel(roleChange.ancienRole)} → {getRoleLabel(roleChange.nouveauRole)}
              </span>
            </div>
            <button
              onClick={async () => {
                const newUser = await appliquerChangementRole();
                if (newUser) navigate(getDashboardRoute(newUser.role), { replace: true });
              }}
              style={{
                background: '#FCD34D', color: '#0C1A30', border: 'none',
                borderRadius: 8, padding: '7px 18px',
                fontWeight: 700, fontSize: '.82rem', cursor: 'pointer', flexShrink: 0,
              }}>
              {t('nav.accederNouvelEspace')}
            </button>
          </div>
        )}

        {/* ══ TOPBAR ══ */}
        <header style={{
          height: 62, background: 'var(--card-bg, #fff)',
          borderBottom: '1px solid var(--card-border, #F1F4FB)',
          display: 'flex', alignItems: 'center',
          justifyContent: 'space-between',
          flexDirection: isRTL ? 'row-reverse' : 'row',
          padding: '0 1.75rem', position: 'sticky', top: 0, zIndex: 99,
          boxShadow: '0 1px 0 #EEF1F8, 0 2px 8px rgba(11,30,61,.04)',
          gap: '1rem', flexShrink: 0,
        }}>

          {/* ── Titre page ── */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', minWidth: 0,
            flexDirection: isRTL ? 'row-reverse' : 'row' }}>
            <div style={{ width: 3, height: 36, borderRadius: 99, background: 'linear-gradient(180deg,#0B1E3D,#3B82F6)', flexShrink: 0 }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 5,
              flexDirection: isRTL ? 'row-reverse' : 'row' }}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"
                style={{ color: 'var(--text-main, #0B1E3D)', flexShrink: 0 }}>
                <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
              </svg>
              <span style={{ fontSize: '.75rem', color: 'var(--text-main, #0B1E3D)', fontWeight: 700 }}>
                Leoni PAP
              </span>
            </div>
          </div>

          {/* ── Droite : recherche + notifs + profil ── */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0,
            flexDirection: isRTL ? 'row-reverse' : 'row' }}>

            {/* Barre de recherche */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 9,
              background: 'var(--badge-bg, #F8FAFC)', border: '1.5px solid var(--card-border, #ced7e8)',
              borderRadius: 11, padding: '0 14px', height: 38, minWidth: 200,
              cursor: 'pointer', transition: 'all .18s',
              flexDirection: isRTL ? 'row-reverse' : 'row',
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                stroke="#94A3B8" strokeWidth="2.2" strokeLinecap="round">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <span style={{ flex: 1, fontSize: '.82rem', color: '#94A3B8', userSelect: 'none' }}>
                {t('nav.rechercherPlaceholder')}
              </span>
            </div>

            <div style={{ width: 1, height: 24, background: 'var(--card-border, #E8EDF7)' }} />

            {/* Notifications */}
            {NOTIF_ROLES.includes(user?.role) && (
              <div className={styles.notifWrap} ref={notifRef}>
                <button
                  className={`${styles.topbarIconBtn} ${notifDropOpen ? styles.topbarIconBtnActive : ''}`}
                  onClick={() => { setNotifDrop(o => !o); setDropOpen(false); }}
                  title={t('nav.notifications')}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="2">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                    <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                  </svg>
                  {notifCount > 0 && (
                    <span className={styles.notifBadge}>{notifCount > 99 ? '99+' : notifCount}</span>
                  )}
                  {notifCount > 0 && <span className={styles.notifPulse} />}
                </button>

                {notifDropOpen && (
                  <div className={styles.notifMiniDrop}
                    style={isRTL ? { right: 'auto', left: 0, textAlign: isRTL ? 'right' : 'left' } : {}}>
                    <div className={styles.notifMiniHead}
                      style={{ flexDirection: isRTL ? 'row-reverse' : 'row' }}>
                      <span>{t('nav.notifications')}</span>
                      {notifCount > 0 && (
                        <button className={styles.notifMiniMarkAll} onClick={markAllRead}>
                          {t('nav.toutMarquerLu')}
                        </button>
                      )}
                    </div>
                    <div className={styles.notifMiniList}>
                      {recentNotifs.length === 0 ? (
                        <div className={styles.notifMiniEmpty}>
                          {t('nav.aucuneNotification')}
                        </div>
                      ) : (
                        recentNotifs.map(n => {
                          const cfg = NOTIF_ICONS[n.type] || NOTIF_FALLBACK;
                          return (
                            <div key={n.id}
                              className={`${styles.notifMiniItem} ${!n.lue ? styles.notifMiniItemUnread : ''}`}
                              style={{ flexDirection: isRTL ? 'row-reverse' : 'row' }}
                              onClick={() => {
                                if (!n.lue) markRead(n.id);
                                const target = resolveNotificationLink(n, user);
                                navigate(target || '/notifications', { state: { focusNotifId: n.id } });
                                setNotifDrop(false);
                              }}>
                              <div className={styles.notifMiniIcon}
                                style={{ background: cfg.bg, color: cfg.color }}>
                                {cfg.icon}
                              </div>
                              <div className={styles.notifMiniContent}>
                                <div className={styles.notifMiniMsg}>{n.titre || n.message}</div>
                                <div className={styles.notifMiniTime}>
                                  {timeAgo(n.dateCreation, t)}
                                </div>
                              </div>
                              {!n.lue && <span className={styles.notifMiniDot} />}
                            </div>
                          );
                        })
                      )}
                    </div>
                    <button className={styles.notifMiniFooter}
                      onClick={() => { setNotifDrop(false); navigate('/notifications'); }}>
                      {t('nav.voirToutesNotifs')}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Bouton profil */}
            <div className={styles.profileWrap} ref={dropRef}>
              <button
                onClick={() => { setDropOpen(o => !o); setNotifDrop(false); }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  flexDirection: isRTL ? 'row-reverse' : 'row',
                  background: dropOpen ? '#0B1E3D' : 'var(--badge-bg, #F8FAFC)',
                  border: `1.5px solid ${dropOpen ? '#0B1E3D' : 'var(--card-border, #E8EDF7)'}`,
                  borderRadius: 12, padding: '6px 12px 6px 6px',
                  cursor: 'pointer', transition: 'all .18s',
                }}>
                <div style={{
                  width: 34, height: 34, borderRadius: 9, flexShrink: 0,
                  background: dropOpen ? 'rgba(255,255,255,.15)' : (roleConf.bg || '#F1F5F9'),
                  color: dropOpen ? '#fff' : (roleConf.color || '#64748b'),
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 900, fontSize: '.82rem',
                }}>
                  {getInitials(user)}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column',
                  textAlign: isRTL ? 'right' : 'left' }}>
                  <span style={{ fontSize: '.81rem', fontWeight: 800,
                    color: dropOpen ? '#fff' : 'var(--text-main, #0B1E3D)',
                    lineHeight: 1.2, whiteSpace: 'nowrap' }}>
                    {user?.prenom} {user?.nom}
                  </span>
                  <span style={{ fontSize: '.66rem', fontWeight: 600,
                    color: dropOpen ? 'rgba(255,255,255,.55)' : (roleConf.color || '#64748b'),
                    lineHeight: 1.2 }}>
                    {roleConf.label}
                  </span>
                </div>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none"
                  stroke={dropOpen ? 'rgba(255,255,255,.6)' : '#94A3B8'} strokeWidth="2.5"
                  style={{ transform: dropOpen ? 'rotate(180deg)' : 'none', transition: 'transform .2s', flexShrink: 0 }}>
                  <polyline points="6 9 12 15 18 9"/>
                </svg>
              </button>

              {dropOpen && (
                <div className={styles.profileDrop}
                  style={isRTL ? { right: 'auto', left: 0, textAlign: 'right' } : {}}>
                  <div className={styles.dropHead}
                    style={{ flexDirection: isRTL ? 'row-reverse' : 'row' }}>
                    <div className={styles.dropAvatarLg}
                      style={{ background: roleConf.bg, color: roleConf.color }}>
                      {getInitials(user)}
                    </div>
                    <div>
                      <div className={styles.dropName}>{user?.prenom} {user?.nom}</div>
                      <div className={styles.dropMeta}>
                        <span className={styles.dropRoleBadge}
                          style={{ color: roleConf.color, background: roleConf.bg }}>
                          {roleConf.label}
                        </span>
                      </div>
                      <div className={styles.dropMat}>#{user?.matricule}</div>
                    </div>
                  </div>
                  <div className={styles.dropSection}>
                    <div className={styles.dropSectionLabel}>{t('sidebar.compte')}</div>
                    <button className={styles.dropItem}
                      style={{ flexDirection: isRTL ? 'row-reverse' : 'row' }}
                      onClick={() => { setDropOpen(false); navigate(profilPath()); }}>
                      <span className={styles.dropItemIcon}
                        style={{ background: 'rgba(29,78,216,.1)', color: '#1D4ED8' }}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                          stroke="currentColor" strokeWidth="2">
                          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                          <circle cx="12" cy="7" r="4"/>
                        </svg>
                      </span>
                      {t('nav.monProfil')}
                    </button>
                    <button className={styles.dropItem}
                      style={{ flexDirection: isRTL ? 'row-reverse' : 'row' }}
                      onClick={() => { setDropOpen(false); navigate(parametresPath()); }}>
                      <span className={styles.dropItemIcon}
                        style={{ background: 'rgba(100,116,139,.1)', color: '#64748b' }}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                          stroke="currentColor" strokeWidth="2">
                          <circle cx="12" cy="12" r="3"/>
                          <path d="M19.07 4.93l-1.41 1.41M4.93 4.93l1.41 1.41M19.07 19.07l-1.41-1.41M4.93 19.07l1.41-1.41M20 12h2M2 12h2M12 20v2M12 2v2"/>
                        </svg>
                      </span>
                      {t('nav.parametres')}
                    </button>
                  </div>
                  <div className={styles.dropLine} />
                  <button className={`${styles.dropItem} ${styles.dropItemRed}`}
                    style={{ flexDirection: isRTL ? 'row-reverse' : 'row' }}
                    onClick={() => { logout(); navigate('/login'); }}>
                    <span className={styles.dropItemIcon}
                      style={{ background: 'rgba(239,68,68,.08)', color: '#EF4444' }}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                        stroke="currentColor" strokeWidth="2">
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                        <polyline points="16 17 21 12 16 7"/>
                        <line x1="21" y1="12" x2="9" y2="12"/>
                      </svg>
                    </span>
                    {t('sidebar.deconnexion')}
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* ══ PAGE ══ */}
        <main className={`${styles.pageContent} ${isFullPage ? styles.pageContentFull : ''}`}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}