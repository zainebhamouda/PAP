import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from 'react-i18next';
import {
  FaHome, FaUsers, FaMapPin, FaBuilding, FaUser, FaTrophy,
  FaList, FaFileAlt, FaGlobe, FaExclamationTriangle,
  FaBell, FaClock, FaSignOutAlt, FaCog, FaLayerGroup, FaProjectDiagram,
  FaPlus, FaCalendar, FaBox, FaClipboard, FaWarehouse, FaCar,
  FaBook, FaMedal, FaChevronDown, FaChevronUp, FaCheckCircle, FaCircle, FaSearchDollar,FaRegCalendarCheck,
} from 'react-icons/fa';
import { FaChartBar } from 'react-icons/fa';
import styles from './Layout.module.css';
import { useState, useEffect } from 'react';
import api, { notifAPI } from '../../services/api';
import { chefQualifAPI, isPlantVW } from '../../services/certifAPI';

const ROLE_LABELS = {
  ADMIN:                        { labelKey: 'Administrateur',         color: '#93C5FD' },
  AUDITEUR:                     { labelKey: 'Auditeur',               color: '#93C5FD' },
  CHEF_SERVICE:                 { labelKey: 'Chef de Service',        color: '#93C5FD' },
  RESPONSABLE_QUALITE_CENTRALE: { labelKey: 'Resp. Qualité Centrale', color: '#A5B4FC' },
  EXPERT_PRODUCT_AUDIT:         { labelKey: 'Expert Product Audit',   color: '#93C5FD' },
  RESPONSABLE_MAGASIN:          { labelKey: 'Responsable Magasin',    color: '#0D9488' },
};

const ROLE_PREFIX = {
  ADMIN:                        'admin',
  AUDITEUR:                     'auditeur',
  CHEF_SERVICE:                 'chef-service',
  RESPONSABLE_QUALITE_CENTRALE: 'responsable',
  EXPERT_PRODUCT_AUDIT:         'expert',
  RESPONSABLE_MAGASIN:          'responsable-magasin',
};

const INSTRUCTIONS_URL = 'https://www.leoni.com';

const QUALIF_STEPS = [
  { labelKey: 'nav.qualif.informations',  path: '/expert/certif/step/1' },
  { labelKey: 'nav.qualif.criteres',      path: '/expert/certif/step/2' },
  { labelKey: 'nav.qualif.evaluation',    path: '/expert/certif/step/3' },
  { labelKey: 'nav.qualif.validation',    path: '/expert/certif/step/4' },
];

const STATUTS_EN_ATTENTE_EXPERT = [
  'RAPPORT_SOUMIS',
  'RAPPORT_DEPOSE',
  'EN_ATTENTE_VALIDATION_EXPERT',
  'ATTENTE_VALIDATION',
];

function DropdownMenu({ icon: Icon, label, badge, children, collapsed, isRTL, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  useEffect(() => { if (collapsed) setOpen(false); }, [collapsed]);

  return (
    <div>
      <div
        role="button" tabIndex={0}
        onClick={() => !collapsed && setOpen(o => !o)}
        onKeyDown={e => e.key === 'Enter' && !collapsed && setOpen(o => !o)}
        title={collapsed ? label : ''}
        className={styles.navItem}
        style={{ cursor: 'pointer', userSelect: 'none', justifyContent: collapsed ? 'center' : 'flex-start' }}
      >
        <span className={styles.navIcon} style={{ position: 'relative' }}>
          <Icon size={15} />
          {badge > 0 && (
            <span style={{
              position: 'absolute', top: -6, [isRTL ? 'left' : 'right']: -6,
              background: '#C8982A', color: 'white', borderRadius: '50%',
              minWidth: 16, height: 16, fontSize: 10,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: '0 3px', border: '1.5px solid #fff', fontWeight: 700,
            }}>
              {badge > 99 ? '99+' : badge}
            </span>
          )}
        </span>
        {!collapsed && (
          <>
            <span className={styles.navItemLabel} style={{ flex: 1, textAlign: isRTL ? 'right' : 'left' }}>
              {label}
            </span>
            {open
              ? <FaChevronUp size={10} style={{ opacity: .45, flexShrink: 0 }} />
              : <FaChevronDown size={10} style={{ opacity: .45, flexShrink: 0 }} />
            }
          </>
        )}
      </div>
      {open && !collapsed && (
        <div style={{
          paddingLeft: isRTL ? 0 : 18, paddingRight: isRTL ? 18 : 0,
          display: 'flex', flexDirection: 'column', gap: 1, marginBottom: 2,
          marginLeft: -5, marginRight: -5,
        }}>
          {children}
        </div>
      )}
    </div>
  );
}

function SubNavLink({ to, icon: Icon, label, disabled = false }) {
  const { t } = useTranslation();
  const displayLabel = typeof label === 'string' && label.indexOf('.') !== -1 ? t(label) : label;
  if (disabled) {
    return (
      <span className={styles.navItem} style={{ opacity: 0.35, cursor: 'not-allowed', pointerEvents: 'none' }}>
        {Icon && <span className={styles.navIcon}><Icon size={15} /></span>}
        <span className={styles.navItemLabel}>{displayLabel}</span>
      </span>
    );
  }
  return (
    <NavLink to={to} className={({ isActive }) => `${styles.navItem} ${isActive ? styles.navItemActive : ''}`}>
      {Icon && <span className={styles.navIcon}><Icon size={15} /></span>}
      <span className={styles.navItemLabel}>{displayLabel}</span>
    </NavLink>
  );
}

function QualifStepper({ currentStep, isRTL, t }) {
  return (
    <div style={{ paddingLeft: isRTL ? 0 : 28, paddingRight: isRTL ? 28 : 0, marginBottom: 4 }}>
      {QUALIF_STEPS.map((step, idx) => {
        const done   = idx < currentStep;
        const active = idx === currentStep;
        const color  = done ? '#22C55E' : active ? '#93C5FD' : 'rgba(255,255,255,0.3)';
        return (
          <div key={idx} style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '6px 10px', borderRadius: 6, marginBottom: 2,
            background: active ? 'rgba(147,197,253,0.1)' : 'transparent',
            cursor: 'not-allowed', userSelect: 'none',
          }}>
            <span style={{ color, flexShrink: 0 }}>
              {done ? <FaCheckCircle size={11} /> : <FaCircle size={11} />}
            </span>
            <span style={{ fontSize: '.78rem', color, fontWeight: active ? 700 : 400 }}>
              {t(step.labelKey)}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export default function Sidebar({ collapsed, onToggle, qualifCreationStep = null }) {
  const { user, logout } = useAuth();
  const navigate         = useNavigate();
  const location         = useLocation();
  const { t, i18n }     = useTranslation();

  // ── States ────────────────────────────────────────────────
  const [notifCount,             setNotifCount]             = useState(0);
  const [certifEnAttenteCount,   setCertifCount]            = useState(0);
  const [rapportsEnAttenteCount, setRapportsEnAttenteCount] = useState(0);
  const [nouveauxAuditsCount,    setNouveauxAuditsCount]    = useState(0);

  const isRTL = i18n.language === 'ar';

  // ── Notifications générales ───────────────────────────────
  useEffect(() => {
    if (!user?.role) return;
    const fetchNotifs = async () => {
      try { const r = await notifAPI.getCount(); setNotifCount(r.data?.count ?? 0); } catch {}
    };
    fetchNotifs();
    const timer = setInterval(fetchNotifs, 30000);
    return () => clearInterval(timer);
  }, [user?.role]);

  // ── Compteur certificats en attente (chef de service) ─────
  useEffect(() => {
    if (user?.role !== 'CHEF_SERVICE') return;
    const fetchCertifs = async () => {
      try {
        const r = await chefQualifAPI.getCertificatsEnAttente();
        setCertifCount((r.data || []).length);
      } catch {}
    };
    fetchCertifs();
    const timer = setInterval(fetchCertifs, 30000);
    return () => clearInterval(timer);
  }, [user?.role]);

  // ── Compteur rapports en attente de validation (expert) ───
  useEffect(() => {
    if (user?.role !== 'EXPERT_PRODUCT_AUDIT') return;
    let cancelled = false;
    const fetchPassages = async () => {
      try {
        const r = await api.get('/expert-audit/passages/all');
        if (cancelled) return;
        const passages = Array.isArray(r.data) ? r.data : [];
        const count = passages.filter(p => STATUTS_EN_ATTENTE_EXPERT.includes(p.statut)).length;
        setRapportsEnAttenteCount(count);
      } catch (e) {
        console.debug('[Sidebar] erreur fetch passages:', e.message);
      }
    };
    fetchPassages();
    const interval = setInterval(fetchPassages, 30000);
    return () => { cancelled = true; clearInterval(interval); };
  }, [user?.role]);

  // ── Nouveaux audits assignés non démarrés (auditeur) ─────
  useEffect(() => {
    if (user?.role !== 'AUDITEUR') return;
    let cancelled = false;
    const fetchAudits = async () => {
      try {
        const r = await api.get('/audit-produit/mes-audits');
        if (cancelled) return;
        const audits = Array.isArray(r.data) ? r.data : [];
        const count = audits.filter(a => {
          const st = (a.statut || '').toUpperCase().trim();
          return st === 'PLANIFIE';
        }).length;
        setNouveauxAuditsCount(count);
      } catch {}
    };
    fetchAudits();
    const interval = setInterval(fetchAudits, 30000);
    return () => { cancelled = true; clearInterval(interval); };
  }, [user?.role]);

  // ── Constantes ────────────────────────────────────────────
  const roleInfo = ROLE_LABELS[user?.role] || {};
  const prefix   = ROLE_PREFIX[user?.role] || 'admin';

  const isCreatingQualif  = qualifCreationStep !== null && qualifCreationStep >= 0;
  const isPlanifActive    = location.pathname.includes('/planification') || location.pathname.includes('/planning');
  const isAuditActive     = location.pathname.includes('/audits') || location.pathname.includes('/rapports');

  // ── Détection plant VW ────────────────────────────────────
  const isExpertPlantVW = isPlantVW(user?.plantNom);

  const collapseIcon = isRTL
    ? (collapsed ? '‹' : '›')
    : (collapsed ? '›' : '‹');

  const SIMPLE_MENUS = {
    ADMIN: [
      { path: '/admin/dashboard',    Icon: FaHome,           labelKey: 'nav.dashboard'    },
      { path: '/expert/leaderboard', Icon: FaTrophy,         labelText: 'LIVE Leaderboard', live: true },
      { path: '/admin/utilisateurs', Icon: FaUsers,          labelKey: 'nav.utilisateurs' },
      { path: '/admin/sites',        Icon: FaMapPin,         labelKey: 'nav.sites'        },
      { path: '/admin/plants',       Icon: FaBuilding,       labelKey: 'nav.plants'       },
      { path: '/admin/segments',     Icon: FaLayerGroup,     labelKey: 'nav.segments'     },
      { path: '/admin/projets',      Icon: FaProjectDiagram, labelKey: 'nav.projets'      },
      { path: '/admin/series',       Icon: FaList,           labelKey: 'nav.seriesLabel'  },
      { path: '/admin/clients',      Icon: FaCar,            labelKey: 'nav.clients'      },
    ],
    RESPONSABLE_QUALITE_CENTRALE: [
      { path: '/responsable/dashboard',       Icon: FaHome,                labelKey: 'nav.dashboard'      },
      { path: '/expert/leaderboard',          Icon: FaTrophy,              labelText: 'LIVE Leaderboard', live: true },
      { path: '/responsable/planifications',  Icon: FaCalendar,            labelKey: 'nav.planifications' },
      { path: '/responsable/qualifications',  Icon: FaTrophy,              labelKey: 'nav.qualifications' },
      { path: '/responsable/audits',          Icon: FaList,                labelKey: 'nav.tousLesAudits'  },
      { path: '/responsable/sites',           Icon: FaGlobe,               labelText: 'Suivi par site'    },
      { path: '/responsable/non-conformites', Icon: FaExclamationTriangle, labelText: 'PDCA'              },
    ],
    CHEF_SERVICE: [
      { path: '/chef-service/dashboard',         Icon: FaHome,    labelKey: 'nav.dashboard'      },
      { path: '/expert/leaderboard',             Icon: FaTrophy,  labelText: 'LIVE Leaderboard', live: true },
      { path: '/chef-service/qualifications',    Icon: FaMedal,   labelKey: 'nav.qualifications' },
      { path: '/chef-service/planning',          Icon: FaCalendar,labelKey: 'nav.planning'       },
      { path: '/chef-service/audits',            Icon: FaList,    labelKey: 'nav.tousLesAudits'  },
      { path: '/chef-service/fiches-reparation', Icon: FaFileAlt, labelKey: 'nav.fichesReparation' },
    ],
    RESPONSABLE_MAGASIN: [
      { path: '/responsable-magasin/dashboard', Icon: FaHome,      labelKey: 'nav.dashboard'    },
      { path: '/responsable-magasin/audits',    Icon: FaWarehouse, labelKey: 'nav.auditsExport' },
    ],
  };

  const renderMenu = () => {

    // ── EXPERT ───────────────────────────────────────────────
    if (user?.role === 'EXPERT_PRODUCT_AUDIT') {
      return (
        <>
          <NavLink to="/expert/dashboard"
            className={({ isActive }) => `${styles.navItem} ${isActive ? styles.navItemActive : ''}`}
            title={collapsed ? t('nav.dashboard') : ''}>
            <span className={styles.navIcon}><FaHome size={15} /></span>
            {!collapsed && <span className={styles.navItemLabel}>{t('nav.dashboard')}</span>}
          </NavLink>

          {user?.peutCreerCertif && (
            <>
              {isExpertPlantVW ? (
                // ── Plant VW : lien simple vers la liste des certifs externes ──
                <NavLink
                  to="/expert/certif-vw"
                  className={({ isActive }) => `${styles.navItem} ${isActive ? styles.navItemActive : ''}`}
                  title={collapsed ? 'Qualifications VW' : ''}
                >
                  <span className={styles.navIcon}><FaMedal size={15} /></span>
                  {!collapsed && <span className={styles.navItemLabel}>Qualifications VW</span>}
                </NavLink>
              ) : (
                // ── Autres plants : menu Qualification standard ──
                <>
                  <DropdownMenu
                    icon={FaTrophy}
                    label={t('nav.qualifications')}
                    badge={rapportsEnAttenteCount}
                    collapsed={collapsed}
                    isRTL={isRTL}
                    defaultOpen={location.pathname.startsWith('/expert/certif')}
                  >
                    <SubNavLink
                      to="/expert/certif/creer"
                      icon={FaPlus}
                      label={t('expert.certifications.nouvelleQualification')}
                    />
                    <SubNavLink
                      to="/expert/certif"
                      icon={FaList}
                      label={t('expert.certifications.gestion')}
                    />
                  </DropdownMenu>

                  {isCreatingQualif && !collapsed && (
                    <QualifStepper currentStep={qualifCreationStep} isRTL={isRTL} t={t} />
                  )}
                </>
              )}
            </>
          )}

          {/* Planification */}
          <DropdownMenu
            icon={FaClipboard}
            label={t('nav.planification')}
            collapsed={collapsed}
            isRTL={isRTL}
            defaultOpen={isPlanifActive}>
            <SubNavLink to="/expert/planification" icon={FaPlus} label={t('nav.creerPlanification')} />
            <SubNavLink to="/expert/planning"      icon={FaList} label={t('nav.listePlanifications')} />
          </DropdownMenu>

         <DropdownMenu
  icon={FaSearchDollar}
  label={t('nav.audits')}
  collapsed={collapsed}
  isRTL={isRTL}
  defaultOpen={isAuditActive}>
  <SubNavLink to="/expert/audits"            icon={FaList}              label={t('nav.listeAudits')} />
  <SubNavLink to="/expert/rapports"          icon={FaFileAlt}           label={t('nav.rapports')}    />
  <SubNavLink to="/expert/rapport-mensuel"   icon={FaRegCalendarCheck}  label="Rapport Mensuel"       />
</DropdownMenu>

          <NavLink
            to="/expert/leaderboard"
            className={({ isActive }) => `${styles.navItem} ${isActive ? styles.navItemActive : ''}`}
            title={collapsed ? 'Leaderboard' : ''}
          >
            <span className={styles.navIcon} style={{ position: 'relative' }}>
              <FaTrophy size={15} />
              <span style={{
                position: 'absolute', top: -6, right: -6,
                background: '#22C55E', color: 'white', borderRadius: 99,
                fontSize: 9, fontWeight: 800, padding: '1px 5px',
                border: '1.5px solid #fff',
              }}>
                LIVE
              </span>
            </span>
            {!collapsed && <span className={styles.navItemLabel}>Leaderboard</span>}
          </NavLink>
        </>
      );
    }

    // ── AUDITEUR ─────────────────────────────────────────────
    if (user?.role === 'AUDITEUR') {
      return (
        <>
          <NavLink to="/auditeur/dashboard"
            className={({ isActive }) => `${styles.navItem} ${isActive ? styles.navItemActive : ''}`}
            title={collapsed ? t('nav.dashboard') : ''}>
            <span className={styles.navIcon}><FaHome size={15} /></span>
            {!collapsed && <span className={styles.navItemLabel}>{t('nav.dashboard')}</span>}
          </NavLink>

          <NavLink to="/auditeur/certif"
            className={({ isActive }) => `${styles.navItem} ${isActive ? styles.navItemActive : ''}`}
            title={collapsed ? t('nav.qualifications') : ''}>
            <span className={styles.navIcon}><FaTrophy size={15} /></span>
            {!collapsed && <span className={styles.navItemLabel}>{t('nav.qualifications')}</span>}
          </NavLink>

        <DropdownMenu
  icon={FaCalendar}
  label={t('nav.planification')}
  badge={nouveauxAuditsCount}
  collapsed={collapsed}
  isRTL={isRTL}
  defaultOpen={isAuditActive || isPlanifActive}>
  <SubNavLink to="/auditeur/planification"      icon={FaPlus}             label="Nouvelle planification" />
  <SubNavLink to="/auditeur/planning"           icon={FaCalendar}         label={t('nav.planning')} />
  <SubNavLink to="/auditeur/audits"             icon={FaList}             label={t('nav.listeAudits')} />
  <SubNavLink to="/auditeur/rapports"           icon={FaFileAlt}          label={t('nav.rapports')} />
  <SubNavLink to="/auditeur/rapport-mensuel"  icon={FaRegCalendarCheck} label="Rapport Mensuel" />
</DropdownMenu>
        </>
      );
    }

    // ── CHEF DE SERVICE ──────────────────────────────────────
    if (user?.role === 'CHEF_SERVICE') {
      return (
        <>
          <NavLink to="/chef-service/dashboard"
            className={({ isActive }) => `${styles.navItem} ${isActive ? styles.navItemActive : ''}`}
            title={collapsed ? t('nav.dashboard') : ''}>
            <span className={styles.navIcon}><FaHome size={15} /></span>
            {!collapsed && <span className={styles.navItemLabel}>{t('nav.dashboard')}</span>}
          </NavLink>

          <NavLink
            to="/expert/leaderboard"
            className={({ isActive }) => `${styles.navItem} ${isActive ? styles.navItemActive : ''}`}
            title={collapsed ? 'LIVE Leaderboard' : ''}
          >
            <span className={styles.navIcon} style={{ position: 'relative' }}>
              <FaTrophy size={15} />
              <span style={{
                position: 'absolute', top: -6, [isRTL ? 'left' : 'right']: -6,
                background: '#22C55E', color: 'white', borderRadius: 99,
                minWidth: 28, height: 16, fontSize: 9,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: '0 4px', border: '1.5px solid #fff', fontWeight: 800,
              }}>
                LIVE
              </span>
            </span>
            {!collapsed && <span className={styles.navItemLabel}>LIVE Leaderboard</span>}
          </NavLink>

          <NavLink to="/chef-service/qualifications"
            className={({ isActive }) => `${styles.navItem} ${isActive ? styles.navItemActive : ''}`}
            title={collapsed ? t('nav.qualifications') : ''}>
            <span className={styles.navIcon} style={{ position: 'relative' }}>
              <FaMedal size={15} />
              {certifEnAttenteCount > 0 && (
                <span style={{
                  position: 'absolute', top: -6, [isRTL ? 'left' : 'right']: -6,
                  background: '#60A5FA', color: 'white', borderRadius: '50%',
                  minWidth: 16, height: 16, fontSize: 10,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  padding: '0 3px', border: '1.5px solid #fff', fontWeight: 700,
                }}>
                  {certifEnAttenteCount > 99 ? '99+' : certifEnAttenteCount}
                </span>
              )}
            </span>
            {!collapsed && (
              <span className={styles.navItemLabel} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                {t('nav.qualifications')}
                {certifEnAttenteCount > 0 && (
                  <span style={{
                    background: '#60A5FA', color: '#fff', borderRadius: 99,
                    fontSize: '.62rem', fontWeight: 800, padding: '1px 6px', lineHeight: 1.4,
                  }}>
                    {certifEnAttenteCount}
                  </span>
                )}
              </span>
            )}
          </NavLink>

          <DropdownMenu
            icon={FaCalendar}
            label={t('nav.planification')}
            collapsed={collapsed}
            isRTL={isRTL}
            defaultOpen={isPlanifActive || isAuditActive}>
            <SubNavLink to="/chef-service/planning" icon={FaCalendar} label={t('nav.planning')}      />
            <SubNavLink to="/chef-service/audits"   icon={FaList}     label={t('nav.tousLesAudits')} />
          </DropdownMenu>

          <NavLink to="/chef-service/fiches-reparation"
            className={({ isActive }) => `${styles.navItem} ${isActive ? styles.navItemActive : ''}`}
            title={collapsed ? t('nav.fichesReparation') : ''}>
            <span className={styles.navIcon}><FaFileAlt size={15} /></span>
            {!collapsed && <span className={styles.navItemLabel}>{t('nav.fichesReparation')}</span>}
          </NavLink>
        </>
      );
    }

    // ── AUTRES RÔLES (admin, responsable, magasin) ───────────
    const simpleMenu = SIMPLE_MENUS[user?.role] || [];
    return simpleMenu.map(item => (
      <NavLink key={item.path} to={item.path}
        className={({ isActive }) => `${styles.navItem} ${isActive ? styles.navItemActive : ''}`}
        title={collapsed ? (item.labelText || t(item.labelKey)) : ''}>
        <span className={styles.navIcon}><item.Icon size={15} /></span>
        {!collapsed && (
          <span className={styles.navItemLabel} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {item.labelText || t(item.labelKey)}
            {item.live && (
              <span style={{
                background: '#22C55E', color: '#fff', borderRadius: 99,
                fontSize: '.62rem', fontWeight: 800, padding: '1px 6px', lineHeight: 1.4,
              }}>
                LIVE
              </span>
            )}
          </span>
        )}
      </NavLink>
    ));
  };

  return (
    <aside
      className={`${styles.sidebar} ${collapsed ? styles.collapsed : ''}`}
      style={isRTL ? { right: 0, left: 'auto', borderRight: 'none', borderLeft: '1px solid rgba(255,255,255,0.07)' } : {}}
    >
      <div className={styles.sidebarHeader}>
        <div className={styles.sidebarLogo} style={{ direction: 'ltr', textAlign: 'left' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 40, height: 40, background: '#1a56db', borderRadius: 12,
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <span style={{ fontSize: '1.4rem', fontWeight: 900, color: '#fff', lineHeight: 1 }}>L</span>
            </div>
            {!collapsed && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <span style={{ fontSize: '1.15rem', fontWeight: 800, color: '#fff', letterSpacing: '0.02em', lineHeight: 1 }}>
                  Leoni PAP
                </span>
                <span style={{
                  fontSize: '0.5rem', fontWeight: 300, color: 'rgba(255,255,255,0.5)',
                  letterSpacing: '0.12em', textTransform: 'uppercase', lineHeight: 1,
                }}>
                  Product Audit Platform
                </span>
              </div>
            )}
          </div>
        </div>
        <button className={styles.collapseBtn} onClick={onToggle}>{collapseIcon}</button>
      </div>

      {!collapsed && (
        <div className={styles.userCard}>
          <div className={styles.userAvatar}>{user?.prenom?.[0]}{user?.nom?.[0]}</div>
          <div className={styles.userInfo}>
            <p className={styles.userName}>{user?.prenom} {user?.nom}</p>
            <span className={styles.userRole} style={{
              background: (roleInfo.color || '#93C5FD') + '22',
              color: roleInfo.color || '#93C5FD',
            }}>
              {roleInfo.labelKey}
            </span>
          </div>
        </div>
      )}

      <nav className={styles.sidebarNav}>
        <div className={styles.navSection}>
          {!collapsed && <span className={styles.navLabel}>{t('sidebar.navigation')}</span>}
          {renderMenu()}
        </div>

        <div className={styles.navSection}>
          {!collapsed && <span className={styles.navLabel}>{t('sidebar.compte')}</span>}
          <NavLink to={`/${prefix}/profil`}
            className={({ isActive }) => `${styles.navItem} ${isActive ? styles.navItemActive : ''}`}>
            <span className={styles.navIcon}><FaUser size={15} /></span>
            {!collapsed && <span className={styles.navItemLabel}>{t('nav.monProfil')}</span>}
          </NavLink>
          <NavLink to="/notifications"
            className={({ isActive }) => `${styles.navItem} ${isActive ? styles.navItemActive : ''}`}>
            <span className={styles.navIcon} style={{ position: 'relative' }}>
              <FaBell size={15} />
              {notifCount > 0 && (
                <span style={{
                  position: 'absolute', top: -6, [isRTL ? 'left' : 'right']: -6,
                  background: '#EF4444', color: 'white', borderRadius: '50%',
                  minWidth: 16, height: 16, fontSize: 10,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  padding: '0 3px', border: '1.5px solid #fff',
                }}>
                  {notifCount > 99 ? '99+' : notifCount}
                </span>
              )}
            </span>
            {!collapsed && <span className={styles.navItemLabel}>{t('nav.notifications')}</span>}
          </NavLink>
          <NavLink to="/historique"
            className={({ isActive }) => `${styles.navItem} ${isActive ? styles.navItemActive : ''}`}>
            <span className={styles.navIcon}><FaClock size={15} /></span>
            {!collapsed && <span className={styles.navItemLabel}>{t('nav.historique')}</span>}
          </NavLink>
        </div>

        <div className={styles.navSection}>
          {!collapsed && <span className={styles.navLabel}>{t('sidebar.ressources')}</span>}
          <a href={INSTRUCTIONS_URL} target="_blank" rel="noopener noreferrer"
            className={styles.navItem}
            title={collapsed ? t('sidebar.instructionsNormes') : ''}
            style={{ textDecoration: 'none' }}>
            <span className={styles.navIcon}><FaBook size={15} /></span>
            {!collapsed && <span className={styles.navItemLabel}>{t('sidebar.instructionsNormes')}</span>}
          </a>
        </div>

        <div className={styles.navSection}>
          {!collapsed && <span className={styles.navLabel}>{t('sidebar.configuration')}</span>}
          <NavLink to={`/${prefix}/parametres`}
            className={({ isActive }) => `${styles.navItem} ${isActive ? styles.navItemActive : ''}`}>
            <span className={styles.navIcon}><FaCog size={15} /></span>
            {!collapsed && <span className={styles.navItemLabel}>{t('nav.parametres')}</span>}
          </NavLink>
        </div>
      </nav>

      <div className={styles.sidebarFooter}>
        <button className={styles.logoutBtn} onClick={() => { logout(); navigate('/login'); }}>
          <FaSignOutAlt size={15} />
          {!collapsed && <span>{t('sidebar.deconnexion')}</span>}
        </button>
      </div>
    </aside>
  );
}