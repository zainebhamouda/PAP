// services/certifAPI.js
// API qualification PAP — Sprint 2 : multi-certif, client, score validation

import api from './api';

// ── Expert ──────────────────────────────────────────────────────────
export const expertCertifAPI = {
  confirmer:            (req)              => api.post('/expert-audit/certifications/confirmer', req),
  sauvegarderBrouillon: (req)              => api.post('/expert-audit/certifications/brouillon', req),
  getMonBrouillon:      ()                 => api.get('/expert-audit/certifications/mon-brouillon'),
  getMesBrouillons:     ()                 => api.get('/expert-audit/certifications/mes-brouillons'),
  getAll:               ()                 => api.get('/expert-audit/certifications/all'),
  getActives:           ()                 => api.get('/expert-audit/certifications/actives'),
  getById:              (id)               => api.get(`/expert-audit/certifications/${id}`),
  activer:              (id)               => api.post(`/expert-audit/certifications/${id}/activer`),
  desactiver:           (id)               => api.post(`/expert-audit/certifications/${id}/desactiver`),
  modifier:             (id, req)          => api.put(`/expert-audit/certifications/${id}`, req),
  supprimer:            (id)               => api.delete(`/expert-audit/certifications/${id}`),
  uploadFormation:      (id, base64, nom)  => api.post(`/expert-audit/certifications/${id}/upload-formation`, { base64, nom }),
  uploadCertificatVide: (id, base64, nom)  => api.post(`/expert-audit/certifications/${id}/upload-certificat`, { base64, nom }),
  copierFormation:      (id, formationUrl, formationNom) => api.post(`/expert-audit/certifications/${id}/copier-formation`, { formationUrl, formationNom }),
  getClients:           ()                 => api.get('/expert-audit/clients'),
  copierCertificat: (certifId, certifUrl, certifNom) =>
  api.post(`/expert-audit/certifications/${certifId}/copier-certif`, { certifUrl, certifNom }),
};

export const expertTestAPI = {
  creerTest:         (req)           => api.post('/expert-audit/tests', req),
  getAllTests:        ()              => api.get('/expert-audit/tests/all'),
  getTestActif:      ()              => api.get('/expert-audit/tests/actif'),
  getQuestions:      (testId)        => api.get(`/expert-audit/tests/${testId}/questions`),
  ajouterImage:      (testId, req)   => api.post(`/expert-audit/tests/${testId}/questions/image`, req),
  ajouterQCM:        (testId, req)   => api.post(`/expert-audit/tests/${testId}/questions/qcm`, req),
  activerTest:       (testId)        => api.post(`/expert-audit/tests/${testId}/activer`),
  supprimerQuestion: (qId)           => api.delete(`/expert-audit/tests/questions/${qId}`),
  modifier:          (testId, req)   => api.put(`/expert-audit/tests/${testId}`, req),
  supprimer:         (testId)        => api.delete(`/expert-audit/tests/${testId}`),
};

export const expertPratiqueAPI = {
  creerTest:       (req)          => api.post('/expert-audit/tests-pratiques', req),
  getAllTests:      ()             => api.get('/expert-audit/tests-pratiques/all'),
  getTest:         (testId)       => api.get(`/expert-audit/tests-pratiques/${testId}`),
  ajouterDefaut:   (testId, req)  => api.post(`/expert-audit/tests-pratiques/${testId}/defauts`, req),
  activerTest:     (testId)       => api.post(`/expert-audit/tests-pratiques/${testId}/activer`),
  supprimerDefaut: (defautId)     => api.delete(`/expert-audit/tests-pratiques/defauts/${defautId}`),
  modifier:        (testId, req)  => api.put(`/expert-audit/tests-pratiques/${testId}`, req),
  supprimer:       (testId)       => api.delete(`/expert-audit/tests-pratiques/${testId}`),
};

// ── Passages expert ─────────────────────────────────────────────────
export const expertPassageAPI = {
  getAll:              ()                           => api.get('/expert-audit/passages/all'),
  validerPratique:     (passageId, body)            => api.post(`/expert-audit/passages/${passageId}/valider-pratique`, body),
  debloquer:           (passageId)                  => api.post(`/expert-audit/passages/${passageId}/debloquer`),

  genererCertificat:   (passageId)                  => api.post(`/expert-audit/passages/${passageId}/generer-certificat`),

    /** Envoyer le certificat généré au chef pour validation */
    envoyerAuChef:       (passageId, chefServiceId, remarqueExpert) =>
      api.post(`/expert-audit/passages/${passageId}/envoyer-certificat-chef`, { chefServiceId, remarqueExpert }),
  
    /** Lister les passages avec un certificat généré (historique expert) */
    avecCertificat:      ()                           => api.get('/expert-audit/passages/avec-certificat'),
  
    /** URL de téléchargement du certificat PDF */
    downloadCertificatUrl: (passageId)               => `/api/expert-audit/passages/${passageId}/certificat/download`,
};
export const chefQualifAPI = {
  /** Suivi complet de toutes les qualifications */
  getAllQualifications:      ()            => api.get('/chef-service/qualifications'),

  /** Certificats en attente de validation par ce chef */
  getCertificatsEnAttente:  ()            => api.get('/chef-service/qualifications/certifs-en-attente'),

  /** Historique des certificats traités par ce chef */
  getCertificatsHistorique: ()            => api.get('/chef-service/qualifications/certifs-historique'),

  /** Valider ou invalider un certificat */
  validerCertificat: (passageId, valide, commentaireChef) =>
    api.post(`/chef-service/qualifications/${passageId}/valider-certificat`, { valide, commentaireChef }),

  /** URL de téléchargement du certificat PDF */
  downloadCertificatUrl: (passageId)     => `/api/chef-service/qualifications/${passageId}/certificat/download`,
};
// ── Auditeur ─────────────────────────────────────────────────────────
export const auditeurCertifAPI = {
  // Passages
  demarrer:              ()                  => api.post('/auditeur/certification/demarrer'),
  demarrerPourCertif:    (certificationId)   => api.post(`/auditeur/certification/demarrer/${certificationId}`),
  passerAuTest:          ()                  => api.post('/auditeur/certification/passer-au-test'),
  getEnCours:            ()                  => api.get('/auditeur/certification/en-cours'),
  getHistorique:         ()                  => api.get('/auditeur/certification/historique'),

  // SPRINT 2 : qualifications disponibles et actives
  getCertificationsDisponibles: ()           => api.get('/auditeur/certifications/disponibles'),
  getCertificationsActives:     ()           => api.get('/auditeur/certifications/actives'),

  // Test pratique
  getTestPratique:       ()                  => api.get('/auditeur/certification/pratique'),
  envoyerRapportPdf:     (passageId, fd)     => api.post(`/auditeur/certification/${passageId}/rapport-pdf`, fd, {
                                                  headers: { 'Content-Type': 'multipart/form-data' }
                                                }),
  // Certificat — IMPORTANT : responseType blob pour PDF valide
  getCertificat:         (passageId)         => api.get(`/auditeur/certification/${passageId}/certificat`, {
                                                  responseType: 'blob',
                                                  headers: { 'Accept': 'application/pdf' },
                                                }),
  // Divers
  getExpertsDispo:       ()                  => api.get('/auditeur/experts-disponibles'),
  getDefautsReference:   ()                  => api.get('/auditeur/defauts-reference'),
  getDashboard:          ()                  => api.get('/auditeur/dashboard'),

    voirCertificat:    (passageId) => api.get(`/auditeur/certification/${passageId}/certificat/voir`, {
    responseType: 'blob',
    headers: { 'Accept': 'application/pdf' },
  }),
  exporterCertificat: (passageId) => api.get(`/auditeur/certification/${passageId}/certificat`, {
    responseType: 'blob',
    headers: { 'Accept': 'application/pdf' },
  }),

};
// ── Certifications VW externes ───────────────────────────────────────────────
export const certifVWAPI = {
  /** Toutes les certifs d'un plant VW (expert) */
  getByPlant:     (plantId)        => api.get(`/certif-vw/plant/${plantId}`),
 
  /** Certifications de l'auditeur connecté */
  mesCertifs:     ()               => api.get('/certif-vw/mes-certifs'),
 
  /** Auto-complétion à partir d'un matricule */
  infoMatricule:  (matricule)      => api.get(`/certif-vw/auditeur/matricule/${matricule}`),
 
  /** Créer une certif VW (expert) */
  creer:          (req)            => api.post('/certif-vw', req),
 
  /** Modifier une certif VW (expert) */
  modifier:       (id, req)        => api.put(`/certif-vw/${id}`, req),
 
  /** Supprimer une certif VW (expert) */
  supprimer:      (id)             => api.delete(`/certif-vw/${id}`),
 
  /** URL de téléchargement PDF */
  pdfUrl:         (id)             => `/api/certif-vw/${id}/pdf`,
};
 
// ── Helper : détecte si le plant connecté est un plant VW ────────────────────
/**
 * Retourne true si le nom ou le clientNom du plant contient "VW" ou "Volkswagen".
 * À utiliser côté front pour conditionner l'affichage de la sidebar.
 *
 * @param {string|undefined} plantNom  — user.plantNom ou plant.nom
 * @param {string|undefined} clientNom — plant.clientNom
 */
export function isPlantVW(plantNom, clientNom) {
  const check = (s) => {
    if (!s) return false;
    const u = s.toUpperCase();
    return u.includes('VW') || u.includes('VOLKSWAGEN');
  };
  return check(plantNom) || check(clientNom);
}