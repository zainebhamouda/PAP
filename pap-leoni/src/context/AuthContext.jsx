// ═══════════════════════════════════════════════════════════════
// context/AuthContext.jsx — v4 FINAL
// + applyPreferences : thème, langue, compact, animations, notifs
// ═══════════════════════════════════════════════════════════════
import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { authAPI } from '../services/api';
import i18n from '../i18n/index.js';

const AuthContext = createContext(null);

export const getDashboardRoute = (role) => ({
  ADMIN:                        '/admin/dashboard',
  AUDITEUR:                     '/auditeur/dashboard',
  CHEF_SERVICE:                 '/chef-service/dashboard',
  RESPONSABLE_QUALITE_CENTRALE: '/responsable/dashboard',
  EXPERT_PRODUCT_AUDIT:         '/expert/dashboard',
}[role] || '/login');

export const getRoleLabel = (role) => ({
  ADMIN:                        'Administrateur',
  AUDITEUR:                     'Auditeur',
  CHEF_SERVICE:                 'Chef de Service',
  RESPONSABLE_QUALITE_CENTRALE: 'Responsable Qualité Centrale',
  EXPERT_PRODUCT_AUDIT:         'Expert Product Audit',
}[role] || role);

export function getUserPlantScope(user) {
  const plantId = user?.plantId ?? user?.plant?.id ?? user?.plant?.plantId ?? user?.plant?.value ?? '';
  const plantNom = user?.plantNom || user?.plant?.nom || user?.plant?.name || user?.plant?.label || '';

  return {
    plantId: plantId === null || plantId === undefined ? '' : String(plantId),
    plantNom: String(plantNom || '').trim(),
  };
}

// ── Applique les préférences au DOM + localStorage ───────────────
// Appelée après login ET au chargement initial (token existant)
// ── Applique toutes les préférences au DOM ────────────────────────
export function applyPreferences(prefs = {}) {
  // Thème → data-theme sur <html> → CSS variables actives partout
  const theme = prefs.theme || localStorage.getItem('theme') || 'light';
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('theme', theme);

  // ── Injection directe des couleurs CSS pour overrider les inline styles ──
  const root = document.documentElement;
  const dark = theme === 'dark';
  // Ces variables sont lues par le CSS via var(--dm-*)
  root.style.setProperty('--dm-bg',         dark ? '#0D1117'                    : '#F4F6FA');
  root.style.setProperty('--dm-card',       dark ? '#161B27'                    : '#FFFFFF');
  root.style.setProperty('--dm-card2',      dark ? '#1A2030'                    : '#F8FAFC');
  root.style.setProperty('--dm-border',     dark ? 'rgba(255,255,255,0.09)'     : '#E2E8F0');
  root.style.setProperty('--dm-border2',    dark ? 'rgba(255,255,255,0.07)'     : '#E8EDF7');
  root.style.setProperty('--dm-text',       dark ? '#E2E8F0'                    : '#0B1E3D');
  root.style.setProperty('--dm-text2',      dark ? '#94A3B8'                    : '#374151');
  root.style.setProperty('--dm-text3',      dark ? '#64748B'                    : '#64748B');
  root.style.setProperty('--dm-text4',      dark ? '#475569'                    : '#94A3B8');
  root.style.setProperty('--dm-input',      dark ? '#131929'                    : '#FFFFFF');
  root.style.setProperty('--dm-input-b',    dark ? 'rgba(255,255,255,0.12)'     : '#E2E8F0');
  root.style.setProperty('--dm-input-t',    dark ? '#E2E8F0'                    : '#0B1E3D');
  root.style.setProperty('--dm-section-hd', dark ? 'rgba(255,255,255,0.05)'     : '#CBD5E1');
  root.style.setProperty('--dm-row-hover',  dark ? 'rgba(255,255,255,0.04)'     : 'rgba(0,0,0,0.03)');
  root.style.setProperty('--dm-badge',      dark ? 'rgba(255,255,255,0.07)'     : '#F1F5F9');
  root.style.setProperty('--dm-topbar',     dark ? '#10151F'                    : '#FFFFFF');
  root.style.setProperty('--dm-topbar-b',   dark ? 'rgba(255,255,255,0.07)'     : '#F1F4FB');
  root.style.setProperty('--page-bg',       dark ? '#0D1117'                    : '#F4F6FA');
  root.style.setProperty('--card-bg',       dark ? '#161B27'                    : '#FFFFFF');
  root.style.setProperty('--card-border',   dark ? 'rgba(255,255,255,0.09)'     : '#E2E8F0');
  root.style.setProperty('--text-main',     dark ? '#E2E8F0'                    : '#0B1E3D');
  root.style.setProperty('--text-sub',      dark ? '#94A3B8'                    : '#374151');
  root.style.setProperty('--input-bg',      dark ? '#131929'                    : '#FFFFFF');
  root.style.setProperty('--input-border',  dark ? 'rgba(255,255,255,0.12)'     : '#E2E8F0');
  root.style.setProperty('--input-text',    dark ? '#E2E8F0'                    : '#0B1E3D');

  // Compact
  const compact = prefs.modeCompact ?? (localStorage.getItem('compact') === 'true');
  document.documentElement.setAttribute('data-compact', compact ? 'true' : 'false');
  localStorage.setItem('compact', String(compact));

  // Animations
  const anim = prefs.animations ?? (localStorage.getItem('animations') !== 'false');
  document.documentElement.style.setProperty('--transition-speed', anim ? '0.18s' : '0s');
  localStorage.setItem('animations', String(anim));

  // Langue + direction RTL
  const storedLang = localStorage.getItem('lang');
  const lang = storedLang || prefs.langue || 'fr';
  document.documentElement.setAttribute('lang', lang);
  document.documentElement.setAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr');
  localStorage.setItem('lang', lang);
  if (i18n.language !== lang) i18n.changeLanguage(lang);

  // Timezone + format date
  if (prefs.timezone)   localStorage.setItem('timezone', prefs.timezone);
  if (prefs.dateFormat) localStorage.setItem('dateFmt',  prefs.dateFormat);

  // Préférences notifs
  localStorage.setItem('notif_prefs', JSON.stringify({
    emailNotificationsActif: prefs.emailNotificationsActif ?? false,
    emailNotificationsTypes: prefs.emailNotificationsTypes ?? [],
    push: prefs.push ?? true,
  }));
}

// ════════════════════════════════════════════════════════════════
export function AuthProvider({ children }) {
  const [user,       setUser]       = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [roleChange, setRoleChange] = useState(null);

  const userRef = useRef(null);
  const pollRef = useRef(null);

  useEffect(() => { userRef.current = user; }, [user]);

  // ── Init : token existant → charger user + appliquer prefs ───
  useEffect(() => {
    // Appliquer prefs localStorage immédiatement (avant le fetch)
    applyPreferences({});

    const token = localStorage.getItem('token');
    if (token) {
      authAPI.me()
        .then(res => { setUser(res.data); applyPreferences(res.data); })
        .catch(() => localStorage.removeItem('token'))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  // ── Vérifier si le rôle a changé côté serveur ───────────────
  const verifierRole = useCallback(async () => {
    const current = userRef.current;
    if (!current || !localStorage.getItem('token')) return;
    try {
      const res = await authAPI.me();
      const serverRole = res.data?.role;
      if (serverRole && serverRole !== current.role) {
        setRoleChange({ ancienRole: current.role, nouveauRole: serverRole });
      }
    } catch { /* silencieux */ }
  }, []);

  // ── Polling adaptatif ────────────────────────────────────────
  useEffect(() => {
    if (!user) return;

    const getDelai = () =>
      document.visibilityState === 'visible' ? 30_000 : 120_000;

    const programmer = () => {
      pollRef.current = setTimeout(async () => {
        await verifierRole();
        programmer();
      }, getDelai());
    };

    programmer();

    const onVisibility = () => {
      clearTimeout(pollRef.current);
      programmer();
    };
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      clearTimeout(pollRef.current);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [user, verifierRole]);

  // ── Vérification immédiate au retour de focus ────────────────
  useEffect(() => {
    if (!user) return;
    window.addEventListener('focus', verifierRole);
    return () => window.removeEventListener('focus', verifierRole);
  }, [user, verifierRole]);

  // ── Login ────────────────────────────────────────────────────
  const login = async (matricule, motDePasse) => {
    const res = await authAPI.login({ matricule, motDePasse });
    localStorage.setItem('token', res.data.token);
    const me = await authAPI.me();
    setUser(me.data);
    applyPreferences(me.data);   // ← ICI : prefs après login
    setRoleChange(null);
    return me.data;
  };

  // ── Logout ───────────────────────────────────────────────────
  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setRoleChange(null);
    clearTimeout(pollRef.current);
    // Réinitialiser le DOM au thème light
    applyPreferences({ theme:'light', modeCompact:false, animations:true, langue:'fr' });
  };

  // ── Refresh user (après modif profil ou paramètres) ──────────
  const refreshUser = useCallback(async () => {
    try {
      const res = await authAPI.me();
      setUser(res.data);
      applyPreferences(res.data);   // ← ICI : prefs après refresh
      return res.data;
    } catch { return null; }
  }, []);

  // ── Appliquer changement de rôle (clic bannière) ─────────────
  const appliquerChangementRole = async () => {
    try {
      const res = await authAPI.me();
      setUser(res.data);
      applyPreferences(res.data);   // ← ICI : prefs après changement rôle
      setRoleChange(null);
      return res.data;
    } catch {
      logout();
      return null;
    }
  };

  return (
    <AuthContext.Provider value={{
      user, setUser, loading,
      login, logout, refreshUser,
      roleChange, appliquerChangementRole,
      applyPreferences,   // ← exposé pour ParametresPage
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);