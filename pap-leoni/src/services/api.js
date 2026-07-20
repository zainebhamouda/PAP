import axios from 'axios';

// Use your local backend by default (adjust if needed)
const BASE_URL = 'http://localhost:8080/api';
const api = axios.create({ baseURL: BASE_URL, headers: { 'Content-Type': 'application/json' } });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
api.interceptors.response.use(
  (r) => r,
  (error) => {
    if (error.response?.status === 401) { localStorage.clear(); window.location.href = '/login'; }
    return Promise.reject(error);
  }
);
export default api;

// ── AUTH ──────────────────────────────────────────────────────────
export const authAPI = {
  login:   (d) => api.post('/auth/login', d),
  step1:   (d) => api.post('/auth/register/step1', d),
  step2:   (d) => api.post('/auth/register/step2', d),
  confirm: (d) => api.post('/auth/register/confirm', d),
  me:      ()  => api.get('/auth/me'),
  resetPassword: (d) => api.post('/auth/reset-password', d),
};

// ── PROFIL & COMMUN ───────────────────────────────────────────────
export const profilAPI = {
  get:            () => api.get('/commun/profil'),
  update:         (d) => api.put('/commun/profil', d),
  updatePassword: (d) => api.put('/commun/profil/password', d),
  getStats:       () => api.get('/commun/stats-profil'),
  getPreferences: () => api.get('/commun/preferences'),
  savePreferences:(d) => api.put('/commun/preferences', d),
};

// ── NOTIFICATIONS ────────────────────────────────────────────────
export const notifAPI = {
  getAll:      () => api.get('/notifications'),
  getNonLues:  () => api.get('/notifications/non-lues'),
  getCount:    () => api.get('/notifications/non-lues'),
  marquerLue:  (id) => api.put(`/notifications/${id}/lire`),
  marquerTout: () => api.put('/notifications/lire-tout'),
  supprimer:   (id) => api.delete(`/notifications/${id}`),
  markRead:    (id) => api.put(`/notifications/${id}/lire`),
  markAllRead: () => api.put('/notifications/lire-tout'),
};

// ── HISTORIQUE ────────────────────────────────────────────────────
export const historiqueAPI = {
  get: (type) => api.get('/historique', { params: type ? { type } : {} }),
};

// ── ADMIN ─────────────────────────────────────────────────────────
export const adminAPI = {
  dashboard: () => api.get('/admin/dashboard'),

  // Utilisateurs
  getUsers:    ()         => api.get('/admin/utilisateurs'),
  searchUsers: (q)        => api.get('/admin/utilisateurs/recherche', { params: { q } }),
  getUser:     (id)       => api.get(`/admin/utilisateurs/${id}`),
  updateUser:  (id, d)    => api.put(`/admin/utilisateurs/${id}`, d),
  changerRole: (id, role) => api.put(`/admin/utilisateurs/${id}/role`, { role }),
  toggleActif: (id)       => api.put(`/admin/utilisateurs/${id}/toggle-actif`),
  deleteUser:  (id)       => api.delete(`/admin/utilisateurs/${id}`),
  createUser:  (data)     => api.post('/admin/utilisateurs', data),
  toggleCertif:(id)       => api.put(`/admin/utilisateurs/${id}/toggle-certif`),
  getAuditeurs:()         => api.get('/admin/utilisateurs', { params: { role: 'AUDITEUR' } }),
  getExperts:  ()         => api.get('/admin/utilisateurs', { params: { role: 'EXPERT_PRODUCT_AUDIT' } }),
  getChefs:    ()         => api.get('/admin/utilisateurs', { params: { role: 'CHEF_SERVICE' } }),
  getResponsables:()      => api.get('/admin/utilisateurs', { params: { role: 'RESPONSABLE_QUALITE_CENTRALE' } }),

  // Sites — Sprint 3 : nouveaux champs (totalSpaceM2, productionSpaceM2, etc.)
  getSites:    ()         => api.get('/admin/sites'),
  getSite:     (id)       => api.get(`/admin/sites/${id}`),
  createSite:  (d)        => api.post('/admin/sites', d),
  updateSite:  (id, d)    => api.put(`/admin/sites/${id}`, d),
  deleteSite:  (id)       => api.delete(`/admin/sites/${id}`),

  // Plants — Sprint 3 : nouveaux champs (code, clientNom, description, actif)
  getPlants:         ()        => api.get('/admin/plants'),
  getPlantsBySite:   (siteId)  => api.get(`/admin/plants/by-site/${siteId}`),
  getPlant:          (id)      => api.get(`/admin/plants/${id}`),
  createPlant:       (d)       => api.post('/admin/plants', d),
  updatePlant:       (id, d)   => api.put(`/admin/plants/${id}`, d),
  deletePlant:       (id)      => api.delete(`/admin/plants/${id}`),

  // Segments
  getSegments:        ()         => api.get('/admin/segments'),
  getSegmentsByPlant: (plantId)  => api.get(`/admin/segments/by-plant/${plantId}`),
  createSegment:      (d)        => api.post('/admin/segments', d),
  updateSegment:      (id, d)    => api.put(`/admin/segments/${id}`, d),
  deleteSegment:      (id)       => api.delete(`/admin/segments/${id}`),

  // Projets
  getProjets:          ()          => api.get('/admin/projets'),
  getProjetsBySegment: (segmentId) => api.get(`/admin/projets/by-segment/${segmentId}`),
  createProjet:        (d)         => api.post('/admin/projets', d),
  updateProjet:        (id, d)     => api.put(`/admin/projets/${id}`, d),
  deleteProjet:        (id)        => api.delete(`/admin/projets/${id}`),

  // Séries — Sprint 3
  getSeries:          ()         => api.get('/admin/series'),
  getSeriesByProjet:  (projetId) => api.get(`/admin/series/par-projet/${projetId}`),
  getSerie:           (id)       => api.get(`/admin/series/${id}`),
  createSerie:        (d)        => api.post('/admin/series', d),
  updateSerie:        (id, d)    => api.put(`/admin/series/${id}`, d),
  toggleSerie:        (id)       => api.put(`/admin/series/${id}/toggle`),
  deleteSerie:        (id)       => api.delete(`/admin/series/${id}`),
};

// ── SITES PUBLICS ────────────────────────────────────────────────
export const sitesPublicAPI = {
  getAll:          () => api.get('/sites'),
  getAllPlants:    () => api.get('/sites/plants'),
  getPlantsBySite: (siteId) => api.get(`/sites/${siteId}/plants`),
};

export const publicLandingAPI = {
  getStats: () => api.get('/public/landing-stats'),
};

// ── AUDIT PRODUIT — Sprint 3 ─────────────────────────────────────
export const auditProduitAPI = {
  // Mes audits (auditeur)
  getMesAudits:    (planificationId, projetId, serieId) =>
    api.get('/audit-produit/mes-audits', { params: {
      ...(planificationId ? { planificationId } : {}),
      ...(projetId ? { projetId } : {}),
      ...(serieId ? { serieId } : {}),
    } }),
  getById:         (id)  => api.get(`/audit-produit/${id}`),
  demarrer:        (id)  => api.put(`/audit-produit/${id}/demarrer`),

  // ✅ NOUVEAU — Délégation entre collègues du même plant
  getAuditsCollegues: ()   => api.get('/audit-produit/audits-collegues-plant'),
  getMesSuivis:       ()   => api.get('/audit-produit/mes-suivis'),
  suivre:             (id) => api.put(`/audit-produit/${id}/suivre`),
  neplusSuivre:       (id) => api.put(`/audit-produit/${id}/ne-plus-suivre`),

  // Annexes
  getAnnexes:      (id)                    => api.get(`/audit-produit/${id}/annexes`),
  importerAnnexe:  (id, typeAnnexe, formData) =>
    api.post(`/audit-produit/${id}/annexes/${typeAnnexe}/import`, formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }),
  ajouterPdfAuRapport: (id, file) => {
    const formData = new FormData();
    formData.append('fichier', file);
    return api.post(`/audit-produit/${id}/rapport-pdf/ajouter`, formData,
      { headers: { 'Content-Type': 'multipart/form-data' } });
  },
  saisirQK:        (id, typeAnnexe, valeurQK) =>
    api.put(`/audit-produit/${id}/annexes/${typeAnnexe}/qk`, null, { params: { valeurQK } }),
  genererRapport:  (id)  => api.post(`/audit-produit/${id}/generer-rapport`),
  getRapports:     ()    => api.get('/audit-produit/rapports'),

  // Fiche réparation
  creerFiche:      (id, data) => api.post(`/audit-produit/${id}/fiche-reparation`, data),
  getFiches:       (id)       => api.get(`/audit-produit/${id}/fiche-reparation`),
  validerChef:     (ficheId, commentaire) =>
    api.post(`/audit-produit/fiche-reparation/${ficheId}/valider-chef`, null,
      { params: commentaire ? { commentaire } : {} }),
  validerExpert:   (ficheId, commentaire) =>
    api.post(`/audit-produit/fiche-reparation/${ficheId}/valider-expert`, null,
      { params: commentaire ? { commentaire } : {} }),
  fichesEnAttenteChef:  () => api.get('/audit-produit/fiche-reparation/en-attente-chef'),
  fichesEnAttenteExpert:() => api.get('/audit-produit/fiche-reparation/en-attente-expert'),

  // PDCA
  creerPDCA:       (id, data) => api.post(`/audit-produit/${id}/pdca`, data),

  // Gestion
  supprimer:       (id)         => api.delete(`/audit-produit/${id}`),
  modifierSerie:   (id, serieId)=> api.put(`/audit-produit/${id}/serie`, null, { params: { serieId } }),
  modifierDeadline:(id, deadline)=>api.put(`/audit-produit/${id}/deadline`, null, { params: { deadline } }),
    modifierParAuditeur: (auditId, data) => api.put(`/auditeur/audits/${auditId}`, data),

};

// ── AUDIT GÉNÉRAL (ancienne API compatible) ───────────────────────
export const auditAPI = {
  planifier:       (data)      => api.post('/audits/planifier', data),
  update:          (id, data)  => api.put(`/audits/${id}`, data),
  demarrer:        (id)        => api.put(`/audits/${id}/demarrer`),
  saisirResultats: (id, data)  => api.put(`/audits/${id}/resultats`, data),
  declencherPdca:  (id)        => api.put(`/audits/${id}/pdca`),
  annuler:         (id)        => api.put(`/audits/${id}/annuler`),
  getById:         (id)        => api.get(`/audits/${id}`),
  getAll:          ()          => api.get('/audits'),
  getByType:       (type)      => api.get(`/audits/type/${type}`),
  getByPlant:      (plantId)   => api.get(`/audits/plant/${plantId}`),
  getMesAudits:    ()          => api.get('/audits/mes-audits'),
  getMesAuditsByType:(type)    => api.get(`/audits/mes-audits/type/${type}`),
  getPlanning:     (annee, mois, plantId) =>
    api.get('/audits/planning', { params: { annee, mois, ...(plantId ? { plantId } : {}) } }),
  getDashboard:    (plantId)   =>
    api.get('/audits/stats/dashboard', { params: plantId ? { plantId } : {} }),
};

// ── PLANIFICATION — Sprint 3 ─────────────────────────────────────
export const planificationAPI = {
  importerExcel:        (formData)    =>
    api.post('/planification/import-excel', formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }),
  lancer:               (data)        => api.post('/planification/lancer', data),
  modifierDeadline:     (auditId, dl) =>
    api.put(`/planification/audits/${auditId}/deadline`, null, { params: { deadline: dl } }),
  supprimer:            (id)          => api.delete(`/planification/${id}`),
  getMesPlanifications: ()            => api.get('/planification/mes-planifications'),
  getAll:               ()            => api.get('/planification'),
  getById:              (id)          => api.get(`/planification/${id}`),
    getMesAuditeurPlanifications: () =>
    api.get('/planification/mes-planifications-auditeur'),
};

// ── CHEF SERVICE ──────────────────────────────────────────────────
export const chefServiceAPI = {
  dashboard: () => api.get('/chef-service/dashboard'),
  getAudits: () => api.get('/audits'),
  fichesEnAttente: () => api.get('/audit-produit/fiche-reparation/en-attente-chef'),
};

// ── EXPERT ────────────────────────────────────────────────────────
export const expertAPI = {
  dashboard: () => api.get('/expert-audit/dashboard'),
  getPlanification: () => api.get('/expert-audit/planification'),
  getMesPlantsSite: () => api.get('/expert-audit/mes-plants-site'),
  fichesEnAttente: () => api.get('/audit-produit/fiche-reparation/en-attente-expert'),
};

// ── AUDITEUR ─────────────────────────────────────────────────────
export const auditeurAPI = {
  dashboard: () => api.get('/auditeur/dashboard'),
    getAuditeursMonPlant: () => api.get('/auditeur/mon-plant/auditeurs'),

};

// ── ✅ NOUVEAU — CERTIFICATS AUDITEUR IMPORTÉS (déjà obtenus) ────────
export const certificatAuditeurAPI = {
  // Expert : importer un certificat pour un auditeur de son plant
  importer: (auditeurId, dateObtention, fichier) => {
    const fd = new FormData();
    fd.append('auditeurId', auditeurId);
    fd.append('dateObtention', dateObtention); // format ISO: 2026-07-20T10:00:00
    if (fichier) fd.append('fichier', fichier);
    // ⚠️ L'instance axios a un header par défaut 'Content-Type: application/json'
    // (voir la déclaration de `api` en haut de ce fichier). Pour un envoi
    // FormData, il faut explicitement neutraliser ce défaut (undefined) pour
    // que le navigateur pose lui-même 'multipart/form-data; boundary=...' —
    // sinon le serveur reçoit 'application/json' et rejette la requête
    // (HttpMediaTypeNotSupportedException, endpoint déclaré consumes=multipart/form-data).
    return api.post('/certificats-auditeur/importer', fd, {
      headers: { 'Content-Type': undefined },
    });
  },
  getCertificatsDeMonPlant: () => api.get('/certificats-auditeur/mon-plant'),
  getAuditeursDeMonPlant:   () => api.get('/certificats-auditeur/auditeurs-plant'),
  getAuditeursCertifiesParPlant: (plantId) => api.get(`/certificats-auditeur/auditeurs-certifies/${plantId}`),
  getMesCertificats: () => api.get('/certificats-auditeur/mes-certificats'),
  annuler: (id) => api.put(`/certificats-auditeur/${id}/annuler`),
};

// ── RESPONSABLE ───────────────────────────────────────────────────
export const responsableAPI = {
  dashboard:         () => api.get('/responsable-centrale/dashboard'),
  getCertifications: () => api.get('/expert-audit/certifications/all'),
  getAudits:         () => api.get('/audits'),
  getDashboardAudits:(plantId) => api.get('/audits/stats/dashboard', { params: plantId ? { plantId } : {} }),
  getPlanifications: () => api.get('/planification'),
};
// ── AUDITS SPÉCIAUX (règles plates + magasin export) — Sprint 4 ──
export const auditSpecialAPI = {

  // ── EXPERT : Créer ──────────────────────────────────────────
  creerReglePlate: (data)  => api.post('/audit-special/regle-plate', data),
  creerExport:     (data)  => api.post('/audit-special/export', data),

  // ── EXPERT : Lister ─────────────────────────────────────────
  listerReglePlates: (annee, plantId) =>
    api.get('/audit-special/regle-plate', { params: { annee, plantId } }),
  listerExports:     (annee) =>
    api.get('/audit-special/export', { params: { annee } }),
  getDetailsExport: (id) =>
    api.get(`/audit-special/export/${id}/details`),

  // ── AUDITEUR : Mes audits ───────────────────────────────────
  mesAuditsReglePlates: () => api.get('/audit-special/mes-audits/regle-plate'),
  mesAuditsExport:      () => api.get('/audit-special/mes-audits/export'),
  mesDetailsExport:     (id) => api.get(`/audit-special/mes-audits/export/${id}/details`),

  // ── AUDITEUR : Actions ──────────────────────────────────────
  demarrer: (id) => api.put(`/audit-special/${id}/demarrer`),

  validerImport: (id, fichier) => {
    const fd = new FormData();
    fd.append('fichier', fichier);
    return api.post(`/audit-special/${id}/rapport/import`, fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  validerFormulaire: (id, data) =>
    api.post(`/audit-special/${id}/rapport/formulaire`, data),

  getRapportInfo: (id) =>
    api.get(`/audit-special/${id}/rapport/download`),

  // ── RESPONSABLE MAGASIN ─────────────────────────────────
  auditsExportResponsable: () =>
    api.get('/audit-special/export/mes-audits'),

  validerExport: (id, commentaires) =>
    api.put(`/audit-special/${id}/export/valider`, null,
      { params: commentaires ? { commentaires } : {} }),
};

// ── RESPONSABLE MAGASIN (audits export) ──────────────────────
// Ajout dans auditSpecialAPI — déjà présent, compléter avec :
// auditsExportResponsable: () => api.get('/audit-special/export/mes-audits'),
// validerExport: (id, commentaires) =>
//   api.put(`/audit-special/${id}/export/valider`, null, { params: commentaires ? { commentaires } : {} }),

// ── CLIENTS — ajouter à la fin de votre api.js ───────────────────
export const clientAPI = {
  getAll:       ()  => api.get('/clients'),
  getActifs:    ()  => api.get('/clients/actifs'),
  getGroupes:   ()  => api.get('/clients/groupes'),   // ← NOUVEAU : pour les selects
  getMarques:   ()  => api.get('/clients/marques'),   // ← NOUVEAU : pour le panel admin
  getById:      (id)=> api.get(`/clients/${id}`),
  creer:        (d) => api.post('/clients', d),
  modifier:     (id,d)=> api.put(`/clients/${id}`, d),
  toggle:       (id)=> api.patch(`/clients/${id}/toggle`),
  supprimer:    (id)=> api.delete(`/clients/${id}`),
  initialiser:  ()  => api.post('/clients/initialiser'),
  getMembres:   (id)=> api.get(`/clients/${id}/membres`),
  ajouterMembre:(id,marqueId)=> api.post(`/clients/${id}/membres/${marqueId}`),
  retirerMembre:(id,marqueId)=> api.delete(`/clients/${id}/membres/${marqueId}`),
};