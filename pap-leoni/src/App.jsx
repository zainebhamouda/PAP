import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { useEffect } from 'react';
import LandingPage from './pages/landing/LandingPage';
import LoginPage    from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import MainLayout   from './components/layout/MainLayout';
import AdminDashboard    from './pages/admin/AdminDashboard';
import AdminUtilisateurs from './pages/admin/AdminUtilisateurs';
import AdminUserDetail   from './pages/admin/AdminUserDetail';
import AdminSites        from './pages/admin/AdminSites';
import AdminPlants       from './pages/admin/AdminPlants';
import AdminSegments     from './pages/admin/AdminSegments';
import AdminProjets      from './pages/admin/AdminProjets';
import GestionSeriesAdmin from './pages/admin/GestionSeriesAdmin';
import AdminClients      from './pages/admin/AdminClients';
import ExpertDashboard           from './pages/expert/ExpertDashboard';
import ExpertCertifications      from './pages/expert/ExpertCertifications';
import CreerCertification        from './pages/expert/CreerCertification';
import ExpertCertifVW            from './pages/expert/ExpertCertifVW';       // ← NOUVEAU
import PlanificationPage         from './pages/expert/PlanificationPage';
import ListePlanificationsExpert from './pages/expert/ListePlanificationsExpert';
import ExpertAuditsPage          from './pages/expert/ExpertAuditsPage';
import ExpertRapports            from './pages/expert/ExpertRapports';
import RapportsMensuelsPage      from './pages/shared/RapportsMensuelsPage';
import CertificatVerifyPage      from './pages/public/CertificatVerifyPage';
import AuditeurDashboard      from './pages/auditeur/AuditeurDashboard';
import AuditeurCertifications from './pages/auditeur/AuditeurCertifications';
import ExamenPage             from './pages/auditeur/ExamenPage';
import AuditeurPlanningPage   from './pages/auditeur/AuditeurPlanningPage';
import AuditeurAuditsPage     from './pages/auditeur/AuditeurAuditsPage';
import AuditDetailAuditeur    from './pages/auditeur/AuditDetailAuditeur';
import SaisirResultatAuditPage from './pages/auditeur/SaisirResultatAuditPage';
import AuditSpecialPage       from './pages/auditeur/AuditSpecialPage';
import AuditeurRapportsPage   from './pages/auditeur/AuditeurRapportsPage';
import ChefServiceDashboard  from './pages/chef/ChefServiceDashboard';
import PlanifierAuditPage    from './pages/chef/PlanifierAuditPage';
import PlanningAuditsPage    from './pages/chef/PlanningAuditsPage';
import FichesReparationChef  from './pages/chef/FichesReparationChef';
import ResponsableAuditsPage     from './pages/responsable/ResponsableAuditsPage';
import ResponsableQualifications from './pages/responsable/ResponsableQualifications';
import ResponsableAuditsListe    from './pages/responsable/ResponsableAuditsListe';
import ResponsableDashboard from './pages/responsable/ResponsableDashborad';
import ResponsableSites          from './pages/responsable/ResponsableSites';
import ResponsableNonConformites from './pages/responsable/ResponsableNonConformites';
import ResponsablePlanifications from './pages/responsable/ResponsablePlanifications';
import ResponsableMagasinDashboard from './pages/responsable-magasin/ResponsableMagasinDashboard';
import ResponsableMagasinAudits    from './pages/responsable-magasin/ResponsableMagasinAudits';
import NotificationsPage from './pages/shared/NotificationsPage';
import HistoriquePage    from './pages/shared/HistoriquePage';
import ProfilPage        from './pages/shared/ProfilPage';
import ParametresPage    from './pages/shared/ParametresPage';
import AuditDetailPage   from './pages/shared/AuditDetailPage';
import ListeAuditsPage   from './pages/shared/ListeAuditsPage';
import ChefQualificationsPage from './pages/chef/ChefQualificationsPage';
import AuditeurLeaderboardPage from './pages/expert/AuditeurLeaderboardPage';
import AuditeurProfilePage from './pages/expert/AuditeurProfilePage';
import ClassificationAuditeurs from './components/certif/ClassificationAuditeurs';
import AuditeurPlanificationPage from './pages/auditeur/AuditeurPlanificationPage';

function PrivateRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div style={{ display:'flex',alignItems:'center',justifyContent:'center',height:'100vh',flexDirection:'column',gap:16 }}>
      <div style={{ width:40,height:40,border:'3px solid #E2E8F0',borderTopColor:'#002855',borderRadius:'50%',animation:'spin .8s linear infinite' }}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) return <Navigate to="/" replace />;
  return children;
}

function HomeRedirect() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <LandingPage />;
  const routes = {
    ADMIN:                        '/admin/dashboard',
    AUDITEUR:                     '/auditeur/dashboard',
    CHEF_SERVICE:                 '/chef-service/dashboard',
    RESPONSABLE_QUALITE_CENTRALE: '/responsable/dashboard',
    EXPERT_PRODUCT_AUDIT:         '/expert/dashboard',
    RESPONSABLE_MAGASIN:          '/responsable-magasin/dashboard',
  };
  return <Navigate to={routes[user.role] || '/login'} replace />;
}

function DarkModeEnforcer() {
  useEffect(() => {
    const DARK_CARD = '#161B27';
    const DARK_PAGE = '#0D1117';

    function enforceDark() {
      const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
      if (!isDark) return;

      const elements = document.querySelectorAll('div, section, article, main, aside, span, p, button:not([data-keep-color]), a, form, li, td, th, tr');
      elements.forEach(el => {
        const style = el.getAttribute('style');
        if (!style) return;
        const computed = window.getComputedStyle(el);
        const bg = computed.backgroundColor;
        if (!bg || bg === 'transparent' || bg === 'rgba(0, 0, 0, 0)') return;
        const match = bg.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
        if (!match) return;
        const r = parseInt(match[1]);
        const g = parseInt(match[2]);
        const b = parseInt(match[3]);
        const luminance = 0.299*r + 0.587*g + 0.114*b;
        if (luminance > 220) {
          el.style.backgroundColor = DARK_CARD;
          if (!el.style.color || el.style.color === 'rgb(0, 0, 0)') el.style.color = '#E2E8F0';
        } else if (luminance > 180) {
          el.style.backgroundColor = DARK_PAGE;
          if (!el.style.color || el.style.color === 'rgb(0, 0, 0)') el.style.color = '#E2E8F0';
        }
      });

      const textElements = document.querySelectorAll('[style*="color"]');
      textElements.forEach(el => {
        const style = el.getAttribute('style');
        if (!style) return;
        const computed = window.getComputedStyle(el);
        const col = computed.color;
        const match = col.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
        if (!match) return;
        const r = parseInt(match[1]);
        const g = parseInt(match[2]);
        const b = parseInt(match[3]);
        const luminance = 0.299*r + 0.587*g + 0.114*b;
        if (luminance < 80 && document.documentElement.getAttribute('data-theme') === 'dark') {
          el.style.color = '#E2E8F0';
        }
      });
    }

    const themeObserver = new MutationObserver((mutations) => {
      mutations.forEach(m => {
        if (m.attributeName === 'data-theme') {
          setTimeout(enforceDark, 50);
          setTimeout(enforceDark, 200);
          setTimeout(enforceDark, 500);
        }
      });
    });
    themeObserver.observe(document.documentElement, { attributes: true });

    const domObserver = new MutationObserver(() => {
      if (document.documentElement.getAttribute('data-theme') === 'dark') {
        setTimeout(enforceDark, 10);
      }
    });
    domObserver.observe(document.body, { childList: true, subtree: true });

    enforceDark();

    return () => {
      themeObserver.disconnect();
      domObserver.disconnect();
    };
  }, []);

  return null;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <DarkModeEnforcer />
        <Routes>
          <Route path="/login"           element={<LoginPage />} />
          <Route path="/register"        element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/"                element={<HomeRedirect />} />
          <Route path="/certificat/verify/:id" element={<CertificatVerifyPage />} />
          <Route element={<PrivateRoute><MainLayout /></PrivateRoute>}>
            <Route path="/notifications" element={<NotificationsPage />} />
            <Route path="/historique"    element={<HistoriquePage />} />
            {['admin','expert','auditeur','chef-service','responsable','responsable-magasin'].map(r => (
              <Route key={r+'-profil'} path={`/${r}/profil`} element={<PrivateRoute><ProfilPage /></PrivateRoute>} />
            ))}
            {['admin','expert','auditeur','chef-service','responsable','responsable-magasin'].map(r => (
              <Route key={r+'-params'} path={`/${r}/parametres`} element={<PrivateRoute><ParametresPage /></PrivateRoute>} />
            ))}

            {/* ══ ADMIN ══ */}
            <Route path="/admin/dashboard"        element={<PrivateRoute allowedRoles={['ADMIN']}><AdminDashboard /></PrivateRoute>} />
            <Route path="/admin/utilisateurs"     element={<PrivateRoute allowedRoles={['ADMIN']}><AdminUtilisateurs /></PrivateRoute>} />
            <Route path="/admin/utilisateurs/:id" element={<PrivateRoute allowedRoles={['ADMIN']}><AdminUserDetail /></PrivateRoute>} />
            <Route path="/admin/sites"            element={<PrivateRoute allowedRoles={['ADMIN']}><AdminSites /></PrivateRoute>} />
            <Route path="/admin/plants"           element={<PrivateRoute allowedRoles={['ADMIN']}><AdminPlants /></PrivateRoute>} />
            <Route path="/admin/segments"         element={<PrivateRoute allowedRoles={['ADMIN']}><AdminSegments /></PrivateRoute>} />
            <Route path="/admin/projets"          element={<PrivateRoute allowedRoles={['ADMIN']}><AdminProjets /></PrivateRoute>} />
            <Route path="/admin/series"           element={<PrivateRoute allowedRoles={['ADMIN']}><GestionSeriesAdmin /></PrivateRoute>} />
            <Route path="/admin/clients"          element={<PrivateRoute allowedRoles={['ADMIN']}><AdminClients /></PrivateRoute>} />

            {/* ══ EXPERT ══ */}
            <Route path="/expert/dashboard"          element={<PrivateRoute allowedRoles={['EXPERT_PRODUCT_AUDIT']}><ExpertDashboard /></PrivateRoute>} />
            <Route path="/expert/certif"             element={<PrivateRoute allowedRoles={['EXPERT_PRODUCT_AUDIT']}><ExpertCertifications /></PrivateRoute>} />
            <Route path="/expert/certif/creer"       element={<PrivateRoute allowedRoles={['EXPERT_PRODUCT_AUDIT']}><CreerCertification /></PrivateRoute>} />
            <Route path="/expert/certif-vw"          element={<PrivateRoute allowedRoles={['EXPERT_PRODUCT_AUDIT']}><ExpertCertifVW /></PrivateRoute>} />  {/* ← NOUVEAU */}
            <Route path="/expert/planification"      element={<PrivateRoute allowedRoles={['EXPERT_PRODUCT_AUDIT']}><PlanificationPage /></PrivateRoute>} />
            <Route path="/expert/planning"           element={<PrivateRoute allowedRoles={['EXPERT_PRODUCT_AUDIT']}><ListePlanificationsExpert /></PrivateRoute>} />
            <Route path="/expert/mes-planifications" element={<PrivateRoute allowedRoles={['EXPERT_PRODUCT_AUDIT']}><ListePlanificationsExpert /></PrivateRoute>} />
            <Route path="/expert/audits"             element={<PrivateRoute allowedRoles={['EXPERT_PRODUCT_AUDIT']}><ExpertAuditsPage /></PrivateRoute>} />
            <Route path="/expert/audits/:id"         element={<PrivateRoute allowedRoles={['EXPERT_PRODUCT_AUDIT']}><AuditDetailPage /></PrivateRoute>} />
            <Route path="/expert/fiches-reparation"  element={<PrivateRoute allowedRoles={['EXPERT_PRODUCT_AUDIT']}><FichesReparationChef role="expert" /></PrivateRoute>} />
            <Route path="/expert/rapports"           element={<PrivateRoute allowedRoles={['EXPERT_PRODUCT_AUDIT']}><ExpertRapports /></PrivateRoute>} />
            <Route path="/expert/rapport-mensuel"    element={<PrivateRoute allowedRoles={['EXPERT_PRODUCT_AUDIT']}><RapportsMensuelsPage /></PrivateRoute>} />
            <Route path="/expert/auditeur/:id"       element={<PrivateRoute allowedRoles={['EXPERT_PRODUCT_AUDIT']}><AuditeurProfilePage /></PrivateRoute>} />
            <Route path="/expert/leaderboard"        element={<PrivateRoute allowedRoles={['EXPERT_PRODUCT_AUDIT','ADMIN','CHEF_SERVICE','RESPONSABLE_QUALITE_CENTRALE']}><AuditeurLeaderboardPage /></PrivateRoute>} />
            <Route path="/expert/classement-auditeurs"        element={<PrivateRoute allowedRoles={['EXPERT_PRODUCT_AUDIT','ADMIN','CHEF_SERVICE','RESPONSABLE_QUALITE_CENTRALE']}><ClassificationAuditeurs /></PrivateRoute>} />
            <Route path="/chef-service/classement-auditeurs"  element={<PrivateRoute allowedRoles={['CHEF_SERVICE','EXPERT_PRODUCT_AUDIT','ADMIN','RESPONSABLE_QUALITE_CENTRALE']}><ClassificationAuditeurs /></PrivateRoute>} />
            <Route path="/responsable/classement-auditeurs"   element={<PrivateRoute allowedRoles={['RESPONSABLE_QUALITE_CENTRALE','EXPERT_PRODUCT_AUDIT','ADMIN','CHEF_SERVICE']}><ClassificationAuditeurs /></PrivateRoute>} />

            {/* ══ AUDITEUR ══ */}
            <Route path="/auditeur/dashboard"      element={<PrivateRoute allowedRoles={['AUDITEUR']}><AuditeurDashboard /></PrivateRoute>} />
            <Route path="/auditeur/certif"         element={<PrivateRoute allowedRoles={['AUDITEUR']}><AuditeurCertifications /></PrivateRoute>} />
            <Route path="/auditeur/certif/examen"  element={<PrivateRoute allowedRoles={['AUDITEUR']}><ExamenPage /></PrivateRoute>} />
            <Route path="/auditeur/planning"       element={<PrivateRoute allowedRoles={['AUDITEUR']}><AuditeurPlanningPage /></PrivateRoute>} />
            <Route path="/auditeur/audits"         element={<PrivateRoute allowedRoles={['AUDITEUR']}><AuditeurAuditsPage /></PrivateRoute>} />
            <Route path="/auditeur/audits/:id"     element={<PrivateRoute allowedRoles={['AUDITEUR']}><AuditDetailAuditeur /></PrivateRoute>} />
            <Route path="/auditeur/audits/:id/saisir"                    element={<PrivateRoute allowedRoles={['AUDITEUR']}><SaisirResultatAuditPage /></PrivateRoute>} />
            <Route path="/auditeur/audits-special/regle-plate/:id"       element={<PrivateRoute allowedRoles={['AUDITEUR']}><AuditSpecialPage /></PrivateRoute>} />
            <Route path="/auditeur/audits-special/export/:id"            element={<PrivateRoute allowedRoles={['AUDITEUR']}><AuditSpecialPage /></PrivateRoute>} />
            <Route path="/auditeur/rapports"       element={<PrivateRoute allowedRoles={['AUDITEUR']}><AuditeurRapportsPage /></PrivateRoute>} />
            <Route path="/auditeur/rapport-mensuel" element={<PrivateRoute allowedRoles={['AUDITEUR']}><RapportsMensuelsPage /></PrivateRoute>} />
            <Route path="/auditeur/planification"  element={<PrivateRoute allowedRoles={['AUDITEUR']}><AuditeurPlanificationPage /></PrivateRoute>} />

            {/* ══ CHEF SERVICE ══ */}
            <Route path="/chef-service/dashboard"         element={<PrivateRoute allowedRoles={['CHEF_SERVICE']}><ChefServiceDashboard /></PrivateRoute>} />
            <Route path="/chef-service/audits"            element={<PrivateRoute allowedRoles={['CHEF_SERVICE']}><ListeAuditsPage /></PrivateRoute>} />
            <Route path="/chef-service/audits/planifier"  element={<PrivateRoute allowedRoles={['EXPERT_PRODUCT_AUDIT']}><PlanifierAuditPage /></PrivateRoute>} />
            <Route path="/chef-service/audits/:id"        element={<PrivateRoute allowedRoles={['CHEF_SERVICE','EXPERT_PRODUCT_AUDIT','RESPONSABLE_QUALITE_CENTRALE']}><AuditDetailPage /></PrivateRoute>} />
            <Route path="/chef-service/planning"          element={<PrivateRoute allowedRoles={['CHEF_SERVICE']}><PlanningAuditsPage /></PrivateRoute>} />
            <Route path="/chef-service/fiches-reparation" element={<PrivateRoute allowedRoles={['CHEF_SERVICE']}><FichesReparationChef role="chef" /></PrivateRoute>} />
            <Route path="/chef-service/qualifications"    element={<PrivateRoute allowedRoles={['CHEF_SERVICE']}><ChefQualificationsPage /></PrivateRoute>} />

            {/* ══ RESPONSABLE QUALITÉ ══ */}
            <Route path="/responsable/dashboard"       element={<PrivateRoute allowedRoles={['RESPONSABLE_QUALITE_CENTRALE']}><ResponsableDashboard /></PrivateRoute>} />
            <Route path="/responsable/planifications"  element={<PrivateRoute allowedRoles={['RESPONSABLE_QUALITE_CENTRALE']}><ResponsablePlanifications /></PrivateRoute>} />
            <Route path="/responsable/qualifications"  element={<PrivateRoute allowedRoles={['RESPONSABLE_QUALITE_CENTRALE']}><ResponsableQualifications /></PrivateRoute>} />
            <Route path="/responsable/audits"          element={<PrivateRoute allowedRoles={['RESPONSABLE_QUALITE_CENTRALE']}><ResponsableAuditsListe /></PrivateRoute>} />
            <Route path="/responsable/audits/:id"      element={<PrivateRoute allowedRoles={['RESPONSABLE_QUALITE_CENTRALE']}><AuditDetailPage /></PrivateRoute>} />
            <Route path="/responsable/sites"           element={<PrivateRoute allowedRoles={['RESPONSABLE_QUALITE_CENTRALE']}><ResponsableSites /></PrivateRoute>} />
            <Route path="/responsable/non-conformites" element={<PrivateRoute allowedRoles={['RESPONSABLE_QUALITE_CENTRALE']}><ResponsableNonConformites /></PrivateRoute>} />

            {/* ══ RESPONSABLE MAGASIN ══ */}
            <Route path="/responsable-magasin/dashboard" element={<PrivateRoute allowedRoles={['RESPONSABLE_MAGASIN']}><ResponsableMagasinDashboard /></PrivateRoute>} />
            <Route path="/responsable-magasin/audits"    element={<PrivateRoute allowedRoles={['RESPONSABLE_MAGASIN']}><ResponsableMagasinAudits /></PrivateRoute>} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}