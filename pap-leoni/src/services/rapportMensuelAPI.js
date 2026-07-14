import api from './api';

// ── RAPPORT MENSUEL (Annexe 1A) ─────────────────────────────────────
// Correspond aux endpoints RapportMensuelController côté backend.
export const rapportMensuelAPI = {
  lister:            (annee, recherche) =>
    api.get('/rapports-mensuels', { params: { annee, recherche } }),

  anneesDisponibles: () => api.get('/rapports-mensuels/annees'),

  // Génère (ou régénère) le rapport d'un plant/mois/année donné.
  // Fonctionne aussi pour un mois déjà passé : relit simplement l'historique
  // des audits produit déjà terminés ce mois-là.
  genererManuellement: (plantId, annee, mois) =>
    api.post('/rapports-mensuels/generer', null, { params: { plantId, annee, mois } }),

  telechargerPdf:    (id) => api.get(`/rapports-mensuels/${id}/pdf`, {
    responseType: 'blob',
    headers: { Accept: 'application/pdf' },
  }),

  telechargerExcel:  (id) => api.get(`/rapports-mensuels/${id}/excel`, {
    responseType: 'blob',
    headers: { Accept: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' },
  }),
};

export default rapportMensuelAPI;