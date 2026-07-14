// ═══════════════════════════════════════════════════════════════
// ExpertCertifVW.jsx — Gestion des certifications VW externes
//
// Accessible uniquement à l'expert d'un plant VW (peutCreerCertif = true)
// À la place du menu Qualification habituel dans la sidebar.
//
// Fonctionnalités :
//  - Liste des certifications VW de son plant
//  - Ajout d'une nouvelle certif (formulaire avec auto-complétion matricule)
//  - Modification / Suppression
//  - Voir / Télécharger le PDF
// ═══════════════════════════════════════════════════════════════

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

// ── Icônes SVG ────────────────────────────────────────────────
const IC = {
  plus:    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  edit:    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  trash:   <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>,
  eye:     <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>,
  upload:  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/></svg>,
  close:   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  award:   <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/></svg>,
  search:  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  pdf:     <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>,
  check:   <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>,
  warn:    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
};

// ── Helpers ───────────────────────────────────────────────────
const fmtDate = (d) => {
  if (!d) return '—';
  const dt = new Date(d);
  return dt.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
};

const joursLabel = (jours) => {
  if (jours < 0)   return { txt: `Expirée (${Math.abs(jours)}j)`, color: '#EF4444', bg: '#FEF2F2' };
  if (jours < 90)  return { txt: `Expire dans ${jours}j`,         color: '#F59E0B', bg: '#FFFBEB' };
  return               { txt: `${jours}j restants`,               color: '#059669', bg: '#F0FDF4' };
};

const EMPTY_FORM = { matriculeAuditeur: '', dateObtention: '', pdfBase64: '', pdfNom: '' };

// ── Composant principal ───────────────────────────────────────
export default function ExpertCertifVW() {
  const { user } = useAuth();
  const plantId  = user?.plantId;
  const plantNom = user?.plantNom || 'VW';

  const [certifs,  setCertifs]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing,  setEditing]  = useState(null);   // certif en cours de modif
  const [saving,   setSaving]   = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [toast,    setToast]    = useState(null);

  // ── Chargement ────────────────────────────────────────────
  const charger = useCallback(async () => {
    if (!plantId) return;
    setLoading(true);
    try {
      const r = await api.get(`/certif-vw/plant/${plantId}`);
      setCertifs(r.data || []);
    } catch { setCertifs([]); }
    setLoading(false);
  }, [plantId]);

  useEffect(() => { charger(); }, [charger]);

  // ── Toast ─────────────────────────────────────────────────
  const showToast = (msg, type = 'ok') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  // ── Filtrage ──────────────────────────────────────────────
  const filtered = certifs.filter(c => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (c.auditeurNom    || '').toLowerCase().includes(q)
        || (c.auditeurPrenom || '').toLowerCase().includes(q)
        || (c.auditeurMatricule || '').toLowerCase().includes(q);
  });

  // ── Formulaire ────────────────────────────────────────────
  const [form,       setForm]       = useState(EMPTY_FORM);
  const [autoInfo,   setAutoInfo]   = useState(null);  // infos auto-complétées
  const [autoLoading,setAutoLoad]   = useState(false);
  const timerRef = useRef(null);

  const openAdd = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setAutoInfo(null);
    setShowForm(true);
  };

  const openEdit = (c) => {
    setEditing(c);
    setForm({
      matriculeAuditeur: c.auditeurMatricule || '',
      dateObtention:     c.dateObtention     || '',
      pdfBase64: '',
      pdfNom: '',
    });
    setAutoInfo({
      auditeurNom:    c.auditeurNom,
      auditeurPrenom: c.auditeurPrenom,
      plantNom:       c.plantNom,
      siteNom:        c.siteNom,
    });
    setShowForm(true);
  };

  // Auto-complétion matricule
  const onMatriculeChange = (val) => {
    setForm(f => ({ ...f, matriculeAuditeur: val }));
    setAutoInfo(null);
    clearTimeout(timerRef.current);
    if (val.length < 4) return;
    timerRef.current = setTimeout(async () => {
      setAutoLoad(true);
      try {
        const r = await api.get(`/certif-vw/auditeur/matricule/${val}`);
        setAutoInfo(r.data);
      } catch { setAutoInfo(null); }
      setAutoLoad(false);
    }, 600);
  };

  // Calcul date expiration automatique (affichage uniquement)
  const dateExpAuto = form.dateObtention
    ? (() => {
        const d = new Date(form.dateObtention);
        d.setFullYear(d.getFullYear() + 4);
        return d.toISOString().split('T')[0];
      })()
    : '';

  // Upload PDF
  const onPdfChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setForm(f => ({ ...f, pdfBase64: ev.target.result, pdfNom: file.name }));
    };
    reader.readAsDataURL(file);
  };

  // Soumission formulaire
  const handleSubmit = async () => {
    if (!form.matriculeAuditeur || !form.dateObtention) {
      showToast('Matricule et date d\'obtention sont obligatoires.', 'err');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        matriculeAuditeur: form.matriculeAuditeur,
        dateObtention:     form.dateObtention,
        pdfBase64:         form.pdfBase64 || null,
        pdfNom:            form.pdfNom    || null,
      };
      if (editing) {
        await api.put(`/certif-vw/${editing.id}`, payload);
        showToast('Certification modifiée avec succès.');
      } else {
        await api.post('/certif-vw', payload);
        showToast('Certification ajoutée avec succès.');
      }
      setShowForm(false);
      await charger();
    } catch (e) {
      const backendMsg = e?.response?.data?.message || e?.response?.data?.error || e?.response?.data?.detail;
      showToast(backendMsg || 'Erreur lors de la sauvegarde.', 'err');
    }
    setSaving(false);
  };

  // Suppression
  const handleDelete = async (id) => {
    if (!window.confirm('Supprimer cette certification ? Cette action est irréversible.')) return;
    setDeleting(id);
    try {
      await api.delete(`/certif-vw/${id}`);
      showToast('Certification supprimée.');
      await charger();
    } catch { showToast('Erreur lors de la suppression.', 'err'); }
    setDeleting(null);
  };

  // ── Voir PDF ──────────────────────────────────────────────
  const voirPdf = (id) => {
    window.open(`/api/certif-vw/${id}/pdf`, '_blank');
  };

  // ── Rendu ─────────────────────────────────────────────────
  return (
    <div style={{ padding: '28px 32px', minHeight: '100vh', width: '100%', boxSizing: 'border-box', background: '#ffffff' }}>

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', top: 24, right: 24, zIndex: 9999,
          background: toast.type === 'err' ? '#FEF2F2' : '#F0FDF4',
          border:     `1.5px solid ${toast.type === 'err' ? '#FCA5A5' : '#A7F3D0'}`,
          color:      toast.type === 'err' ? '#991B1B' : '#065F46',
          borderRadius: 14, padding: '12px 20px', fontWeight: 700,
          fontSize: '.83rem', boxShadow: '0 4px 20px rgba(0,0,0,.12)',
          animation: 'fadeUp .25s ease both',
        }}>
          {toast.msg}
        </div>
      )}

      {/* En-tête */}
      <div style={{ marginBottom: 28, marginTop: -30 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
          <div style={{
            width: 42, height: 42, borderRadius: 13, display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            background: 'linear-gradient(135deg,#1C3FAA,#2563EB)', color: '#fff',
          }}>
            {IC.award}
          </div>
          <div>
            <h1 style={{ marginTop: 5, fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-main, #0B1E3D)' }}>
              Certifications VW 
            </h1>
            <p style={{ margin: 0, fontSize: '.78rem', color: '#64748B' }}>
              Certifications externes délivrées directement par VW
            </p>
          </div>
        </div>

        {/* Bandeau info */}
        <div style={{
          background: '#EFF6FF', border: '1.5px solid #BFDBFE',
          borderRadius: 12, padding: '10px 16px',
          display: 'flex', alignItems: 'flex-start', gap: 10, marginTop: 14,
        }}>
          <span style={{ color: '#2563EB', flexShrink: 0, marginTop: 1 }}>{IC.warn}</span>
          <p style={{ margin: 0, fontSize: '.78rem', color: '#1E40AF', lineHeight: 1.6 }}>
            Les auditeurs de ce plant sont certifiés <strong>directement par VW</strong>.
            Ils ne passent pas d'examens internes. L'auditeur ne peut démarrer ou planifier
            un audit que si une certification valide est enregistrée ici.
            La certification est valable <strong>4 ans</strong> à partir de la date d'obtention.
          </p>
        </div>
      </div>

      {/* Barre d'actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }}>
            {IC.search}
          </span>
          <input
            placeholder="Rechercher par nom, prénom ou matricule…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              width: '100%', paddingLeft: 36, paddingRight: 14,
              height: 40, borderRadius: 11, border: '1.5px solid #b4c1d1',
              background: 'var(--input-bg, #fff)', color: 'var(--text-main, #0B1E3D)',
              fontSize: '.83rem', outline: 'none', boxSizing: 'border-box',
            }}
          />
        </div>
        <button
          onClick={openAdd}
          style={{
            display: 'flex', alignItems: 'center', gap: 7,
            height: 40, padding: '0 18px', borderRadius: 11,
            background: 'linear-gradient(135deg,#1C3FAA,#2563EB)', color: '#fff',
            border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '.83rem',
            boxShadow: '0 3px 12px rgba(37,99,235,.3)',
          }}
        >
          {IC.plus} Ajouter une certification auditeur
        </button>
      </div>

      {/* Table */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: '#94A3B8', fontSize: '.85rem' }}>
          Chargement…
        </div>
      ) : filtered.length === 0 ? (
        <div style={{
          background: 'var(--card-bg, #fff)', borderRadius: 16,
          border: '1.5px solid var(--card-border, #E2E8F0)',
          padding: '48px 32px', textAlign: 'center',
        }}>
          <p style={{ color: '#94A3B8', fontSize: '.9rem', margin: 0 }}>
            {search ? 'Aucun résultat pour cette recherche.' : 'Aucune certification VW enregistrée pour ce plant.'}
          </p>
        </div>
      ) : (
        <div style={{
          background: 'var(--card-bg, #fff)', borderRadius: 16,
          border: '1.5px solid var(--card-border, #E2E8F0)',
          overflow: 'hidden', boxShadow: '0 2px 10px rgba(0,0,0,.04)',
        }}>
          {/* Header table */}
          <div style={{
            display: 'grid', gridTemplateColumns: '2fr 1fr 1.2fr 1.2fr 1fr 110px',
            padding: '10px 20px', background: 'linear-gradient(135deg, #96abe3, #4078f1)',
            borderBottom: '1.5px solid #93a4dc', fontSize: '.7rem',
            fontWeight: 800, color: '#FFFFFF', textTransform: 'uppercase', letterSpacing: '.06em',
          }}>
            <span>Auditeur</span>
            <span>Matricule</span>
            <span>Date obtention</span>
            <span>Expiration</span>
            <span>Statut</span>
            <span>Actions</span>
          </div>

          {filtered.map((c, i) => {
            const jl = joursLabel(c.joursAvantExpiration);
            const rowBg = i % 2 === 0 ? '#EFF6FF' : '#FFFFFF';
            return (
              <div
                key={c.id}
                style={{
                  display: 'grid', gridTemplateColumns: '2fr 1fr 1.2fr 1.2fr 1fr 110px',
                  padding: '13px 20px', alignItems: 'center',
                  borderBottom: i < filtered.length - 1 ? '1px solid #F1F5F9' : 'none',
                  background: rowBg, transition: 'background .15s',
                  animation: `fadeUp .2s ${i * .04}s ease both`, opacity: 0,
                }}
                onMouseEnter={e => e.currentTarget.style.background = '#DBEAFE'}
                onMouseLeave={e => e.currentTarget.style.background = rowBg}
              >
                {/* Nom */}
                <div>
                  <div style={{ fontWeight: 700, fontSize: '.85rem', color: 'var(--text-main, #0B1E3D)' }}>
                    {c.auditeurPrenom} {c.auditeurNom}
                  </div>
                  <div style={{ fontSize: '.72rem', color: '#94A3B8' }}>
                    {c.plantNom} · {c.siteNom || '—'}
                  </div>
                </div>

                {/* Matricule */}
                <span style={{
                  fontFamily: 'monospace', fontSize: '.8rem',
                  background: '#DBEAFE', padding: '3px 3px', borderRadius: 7,
                  color: '#374151', fontWeight: 600,
                }}>
                  {c.auditeurMatricule}
                </span>

                {/* Date obtention */}
                <span style={{ fontSize: '.82rem', color: '#374151' }}>
                  {fmtDate(c.dateObtention)}
                </span>

                {/* Expiration */}
                <div>
                  <div style={{ fontSize: '.82rem', color: '#374151' }}>{fmtDate(c.dateExpiration)}</div>
                  <span style={{
                    fontSize: '.68rem', fontWeight: 700, padding: '2px 8px', borderRadius: 99,
                    background: jl.bg, color: jl.color,
                  }}>
                    {jl.txt}
                  </span>
                </div>
<span
  style={{
    display: 'inline-block', // ou inline-flex
    width: 'fit-content',
    fontSize: '.72rem',
    fontWeight: 700,
    padding: '3px 7px',
    borderRadius: 99,
    background: c.valide ? '#d4dfec' : '#DBEAFE',
    color: c.valide ? '#065F46' : '#991B1B',
  }}
>
  {c.valide ? '✓ Valide' : '✗ Expirée'}
</span>

                {/* Actions */}
                <div style={{ display: 'flex', gap: 5 }}>
                  {c.pdfPath && (
                    <button onClick={() => voirPdf(c.id)} title="Voir le PDF" style={btnStyle('#EFF6FF','#2563EB')}>
                      {IC.eye}
                    </button>
                  )}
                  <button onClick={() => openEdit(c)} title="Modifier" style={btnStyle('#F8FAFC','#374151')}>
                    {IC.edit}
                  </button>
                  <button
                    onClick={() => handleDelete(c.id)}
                    title="Supprimer"
                    disabled={deleting === c.id}
                    style={btnStyle('#FEF2F2','#DC2626')}
                  >
                    {deleting === c.id
                      ? <span style={{ width:11,height:11,border:'2px solid #FCA5A5',borderTopColor:'#DC2626',borderRadius:'50%',display:'inline-block',animation:'spin .7s linear infinite' }}/>
                      : IC.trash}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── MODAL FORMULAIRE ─────────────────────────────────── */}
      {showForm && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          background: 'rgba(0,0,0,.45)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
        }}>
          <div style={{
            background: 'var(--card-bg, #fff)', borderRadius: 20,
            padding: '28px 30px', width: '100%', maxWidth: 520,
            boxShadow: '0 20px 60px rgba(0,0,0,.2)',
            animation: 'fadeUp .2s ease both',
          }}>
            {/* Header modal */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
              <h2 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-main, #0B1E3D)' }}>
                {editing ? 'Modifier la certification VW' : 'Ajouter une certification auditeur'}
              </h2>
              <button onClick={() => setShowForm(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8', padding: 4 }}>
                {IC.close}
              </button>
            </div>

            {/* Champ matricule */}
            <Field label="Matricule de l'auditeur *">
              <div style={{ position: 'relative' }}>
                <input
                  value={form.matriculeAuditeur}
                  onChange={e => onMatriculeChange(e.target.value)}
                  placeholder="Ex: MAT-12345"
                  disabled={!!editing}
                  style={inputStyle(!!editing)}
                />
                {autoLoading && (
                  <span style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', width:14,height:14,border:'2px solid #E2E8F0',borderTopColor:'#2563EB',borderRadius:'50%',display:'inline-block',animation:'spin .7s linear infinite' }}/>
                )}
              </div>
            </Field>

            {/* Auto-complétion plant / site */}
            {autoInfo && (
              <div style={{
                background: '#EFF6FF', border: '1.5px solid #BFDBFE',
                borderRadius: 11, padding: '10px 14px', marginBottom: 16,
                display: 'flex', alignItems: 'center', gap: 10,
              }}>
                <span style={{ color: '#2563EB' }}>{IC.check}</span>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '.82rem', color: '#1E40AF' }}>
                    {autoInfo.auditeurPrenom} {autoInfo.auditeurNom}
                  </div>
                  <div style={{ fontSize: '.72rem', color: '#3B82F6' }}>
                    Plant : <strong>{autoInfo.plantNom || '—'}</strong>
                    {autoInfo.siteNom ? ` · Site : ${autoInfo.siteNom}` : ''}
                  </div>
                </div>
              </div>
            )}

            {/* Date obtention */}
            <Field label="Date d'obtention de la certification VW *">
              <input
                type="date"
                value={form.dateObtention}
                onChange={e => setForm(f => ({ ...f, dateObtention: e.target.value }))}
                style={inputStyle()}
              />
            </Field>

            {/* Date expiration (calculée automatiquement) */}
            {dateExpAuto && (
              <Field label="Date d'expiration (calculée automatiquement — 4 ans)">
                <input
                  type="date"
                  value={dateExpAuto}
                  disabled
                  style={inputStyle(true)}
                />
              </Field>
            )}

            {/* Import PDF */}
            <Field label="Importer la certification PDF (optionnel)">
              <label style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 14px', borderRadius: 11,
                border: '1.5px dashed var(--input-border, #E2E8F0)',
                background: form.pdfNom ? '#F0FDF4' : 'var(--input-bg,#F8FAFC)',
                cursor: 'pointer', fontSize: '.8rem',
                color: form.pdfNom ? '#065F46' : '#94A3B8', fontWeight: 600,
              }}>
                {IC.upload}
                {form.pdfNom || 'Choisir un fichier PDF…'}
                <input type="file" accept=".pdf" onChange={onPdfChange} style={{ display: 'none' }} />
              </label>
              {editing && editing.pdfNom && !form.pdfNom && (
                <p style={{ margin: '6px 0 0', fontSize: '.72rem', color: '#94A3B8' }}>
                  Fichier actuel : {editing.pdfNom} · Laissez vide pour conserver.
                </p>
              )}
            </Field>

            {/* Boutons */}
            <div style={{ display: 'flex', gap: 10, marginTop: 24, justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowForm(false)}
                style={{ padding: '10px 20px', borderRadius: 11, border: '1.5px solid #E2E8F0', background: '#fff', cursor: 'pointer', fontWeight: 700, fontSize: '.83rem', color: '#374151' }}
              >
                Annuler
              </button>
              <button
                onClick={handleSubmit}
                disabled={saving}
                style={{
                  padding: '10px 24px', borderRadius: 11, border: 'none',
                  background: 'linear-gradient(135deg,#1C3FAA,#2563EB)', color: '#fff',
                  cursor: saving ? 'not-allowed' : 'pointer', fontWeight: 700,
                  fontSize: '.83rem', opacity: saving ? .7 : 1,
                  display: 'flex', alignItems: 'center', gap: 8,
                }}
              >
                {saving ? (
                  <><span style={{ width:13,height:13,border:'2px solid rgba(255,255,255,.3)',borderTopColor:'#fff',borderRadius:'50%',display:'inline-block',animation:'spin .7s linear infinite' }}/> Enregistrement…</>
                ) : editing ? 'Enregistrer les modifications' : 'Ajouter la certification'}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:none; } }
        @keyframes spin   { to { transform:rotate(360deg); } }
      `}</style>
    </div>
  );
}

// ── Composants utilitaires ─────────────────────────────────────
function Field({ label, children }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: 'block', fontSize: '.72rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 6 }}>
        {label}
      </label>
      {children}
    </div>
  );
}

function inputStyle(disabled = false) {
  return {
    width: '100%', height: 40, borderRadius: 11, boxSizing: 'border-box',
    border: '1.5px solid var(--input-border, #E2E8F0)',
    background: disabled ? '#F8FAFC' : 'var(--input-bg, #fff)',
    color: 'var(--input-text, #0B1E3D)', fontSize: '.83rem',
    padding: '0 12px', outline: 'none',
    opacity: disabled ? .7 : 1,
  };
}

function btnStyle(bg, color) {
  return {
    width: 30, height: 30, borderRadius: 8, border: `1.5px solid ${bg === '#fff' ? '#E2E8F0' : bg}`,
    background: bg, color, cursor: 'pointer', display: 'flex',
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  };
}
