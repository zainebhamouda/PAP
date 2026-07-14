import api from './api';

// ═══════════════════════════════════════════════════════════════
// AUDITS SPÉCIAUX (règles plates + magasin export)
// ═══════════════════════════════════════════════════════════════

// ── AUDITS SPÉCIAUX (règles plates + magasin export) ──────────
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
};
