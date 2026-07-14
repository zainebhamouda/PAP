export function resolveNotificationLink(notification, user) {
  if (!notification) return '/notifications';

  if (notification.lienAction && String(notification.lienAction).trim()) {
    return notification.lienAction;
  }

  const role = user?.role;
  const type = String(notification.type || '').toUpperCase();
  const txt = `${notification.titre || ''} ${notification.message || ''}`.toLowerCase();
  const auditMatch = txt.match(/audit\s*#?\s*(\d+)/i);
  const annexeMatch = txt.match(/annexe\s*([0-9]+[a-z]?)/i);

  const roleRoutes = {
    AUDITEUR: {
      certif: '/auditeur/certif',
      audits: '/auditeur/audits',
      dashboard: '/auditeur/dashboard',
    },
    EXPERT_PRODUCT_AUDIT: {
      certif: '/expert/certif',
      audits: '/expert/audits',
      fiches: '/expert/fiches-reparation',
      dashboard: '/expert/dashboard',
    },
    CHEF_SERVICE: {
      certif: '/chef-service/qualifications',
      audits: '/chef-service/audits',
      fiches: '/chef-service/fiches-reparation',
      dashboard: '/chef-service/dashboard',
    },
    RESPONSABLE_QUALITE_CENTRALE: {
      certif: '/responsable/qualifications',
      audits: '/responsable/audits',
      nonConformites: '/responsable/non-conformites',
      dashboard: '/responsable/dashboard',
    },
    ADMIN: {
      dashboard: '/admin/dashboard',
    },
    RESPONSABLE_MAGASIN: {
      audits: '/responsable-magasin/audits',
      dashboard: '/responsable-magasin/dashboard',
    },
  };

  const rr = roleRoutes[role] || {};

  if (type.startsWith('CERTIF_')) {
    return rr.certif || '/notifications';
  }

  if (type === 'FICHE_REPARATION_CREEE' || type === 'FICHE_REPARATION_VALIDEE_CHEF' || type === 'FICHE_REPARATION_VALIDEE_EXPERT') {
    return rr.fiches || rr.audits || '/notifications';
  }

  if (type === 'AUDIT_PDCA_REQUIS') {
    return rr.nonConformites || rr.audits || '/notifications';
  }

  if (type === 'AUDIT_ASSIGNE' || type === 'AUDIT_EN_RETARD' || type === 'AUDIT_QK_DEPASSE' || type === 'ALERTE_QK' || type === 'RAPPEL_DEADLINE' || type === 'AUDIT_TERMINE_NOTIF') {
    return rr.audits || rr.dashboard || '/notifications';
  }

  if ((txt.includes('validation') || txt.includes('valider')) && annexeMatch && auditMatch && role === 'AUDITEUR') {
    return `/auditeur/annexes/${auditMatch[1]}/${annexeMatch[1].toUpperCase()}/validation-croisee`;
  }

  if (txt.includes('pdca')) {
    return rr.nonConformites || rr.audits || '/notifications';
  }

  if (txt.includes('fiche de r') || txt.includes('fiche réparation') || txt.includes('fiche reparation')) {
    return rr.fiches || rr.audits || '/notifications';
  }

  if (txt.includes('audit')) {
    return rr.audits || rr.dashboard || '/notifications';
  }

  return rr.dashboard || '/notifications';
}
