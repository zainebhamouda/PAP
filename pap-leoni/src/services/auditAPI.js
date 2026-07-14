// ═══════════════════════════════════════════════════════════════
// auditAPI.js — Service API Sprint 3 : Audits & Planification
// À ajouter dans src/services/api.js (export) OU garder séparé
// ═══════════════════════════════════════════════════════════════
import api from './api';

export const auditAPI = {
  // ── PLANIFICATION & GESTION ─────────────────────────────────
  planifier:       (data)         => api.post('/audits/planifier', data),
  update:          (id, data)     => api.put(`/audits/${id}`, data),
  demarrer:        (id)           => api.put(`/audits/${id}/demarrer`),
  saisirResultats: (id, data)     => api.put(`/audits/${id}/resultats`, data),
  declencherPdca:  (id)           => api.put(`/audits/${id}/pdca`),
  annuler:         (id)           => api.put(`/audits/${id}/annuler`),

  // ── LECTURE ──────────────────────────────────────────────────
  getById:         (id)           => api.get(`/audits/${id}`),
  getAll:          ()             => api.get('/audits'),
  getByType:       (type)         => api.get(`/audits/type/${type}`),
  getByPlant:      (plantId)      => api.get(`/audits/plant/${plantId}`),
  getMesAudits:    ()             => api.get('/audits/mes-audits'),
  getMesAuditsByType: (type)      => api.get(`/audits/mes-audits/type/${type}`),

  // ── PLANNING MENSUEL ─────────────────────────────────────────
  getPlanning:     (annee, mois, plantId) =>
    api.get('/audits/planning', { params: { annee, mois, ...(plantId ? { plantId } : {}) } }),

  // ── STATS DASHBOARD ──────────────────────────────────────────
  getDashboard:    (plantId)      =>
    api.get('/audits/stats/dashboard', { params: plantId ? { plantId } : {} }),
};
