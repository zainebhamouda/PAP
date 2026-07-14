import { useEffect, useMemo, useState, useCallback } from 'react';
import { rapportMensuelAPI } from '../../services/rapportMensuelAPI';
import { sitesPublicAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

// ──────────────────────────────────────────────────────────────
// Design tokens (cohérent avec AuditeurRapportsPage / ExpertRapports)
// ──────────────────────────────────────────────────────────────
const T = {
  navy: '#0B1E3D', blue: '#1E3A5F', blueM: '#1D4ED8',
  g50: '#F7F9FC', g100: '#EEF2F8', g200: '#E8EDF7', g300: '#CBD5E1',
  g400: '#94A3B8', g500: '#64748B', g700: '#334155',
  success: '#15803D', successBg: '#F0FDF4', successBd: '#86EFAC',
  warn: '#C8982A', warnBg: '#FFFBEB', warnBd: '#FCD34D',
  danger: '#B91C1C', dangerBg: '#FEF2F2', dangerBd: '#FECACA',
};

const MOIS = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
];

const Icon = {
  search:   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  download: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>,
  calendar: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  file:     <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>,
  plus:     <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
};

function telechargerBlob(promise, filename) {
  promise.then((res) => {
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const a = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click(); a.remove();
    window.URL.revokeObjectURL(url);
  }).catch(() => alert("Le fichier n'a pas pu être téléchargé."));
}

export default function RapportsMensuelsPage() {
  const { user } = useAuth();

  const [rapports, setRapports] = useState([]);
  const [annees, setAnnees] = useState([]);
  const [annee, setAnnee] = useState('');
  const [recherche, setRecherche] = useState('');
  const [loading, setLoading] = useState(true);
  const [erreur, setErreur] = useState(null);

  // ── Panneau "Générer un rapport" (backfill des mois passés) ────
  const [plants, setPlants] = useState([]);
  const anneeCourante = new Date().getFullYear();
  const moisCourant = new Date().getMonth() + 1;
  const [genPlantId, setGenPlantId] = useState('');
  const [genAnnee, setGenAnnee] = useState(anneeCourante);
  const [genMois, setGenMois] = useState(moisCourant);
  const [generation, setGeneration] = useState(false);
  const [genMessage, setGenMessage] = useState(null);

  const charger = useCallback(() => {
    setLoading(true);
    setErreur(null);
    rapportMensuelAPI.lister(annee || undefined, recherche || undefined)
      .then((res) => setRapports(res.data || []))
      .catch(() => setErreur("Impossible de charger les rapports mensuels."))
      .finally(() => setLoading(false));
  }, [annee, recherche]);

  useEffect(() => {
    rapportMensuelAPI.anneesDisponibles().then((res) => setAnnees(res.data || [])).catch(() => {});
  }, []);

  useEffect(() => {
    sitesPublicAPI.getAllPlants()
      .then((res) => {
        const list = res.data || [];
        // ✅ CORRIGÉ — un utilisateur rattaché à un plant (auditeur, chef de
        // service, expert de plant) ne doit pouvoir générer/voir que le
        // rapport de SON établissement : on restreint la liste déroulante
        // à ce seul plant au lieu de proposer tous les plants existants.
        // (Le backend refuse de toute façon toute autre valeur, mais on
        // évite ici de laisser l'utilisateur croire qu'il peut en choisir un autre.)
        if (user?.plantId) {
          const monPlant = list.find((p) => String(p.id) === String(user.plantId));
          setPlants(monPlant ? [monPlant] : list);
          setGenPlantId(String(user.plantId));
        } else {
          setPlants(list);
          if (list.length === 1) setGenPlantId(String(list[0].id));
        }
      })
      .catch(() => {});
  }, [user]);

  useEffect(() => {
    const t = setTimeout(charger, 250); // debounce sur la recherche
    return () => clearTimeout(t);
  }, [charger]);

  const totalAudits = useMemo(() => rapports.reduce((s, r) => s + (r.nombreAudits || 0), 0), [rapports]);

  // Les 6 dernières années + celles qui ont déjà des rapports, pour le sélecteur de génération
  const anneesGenerables = useMemo(() => {
    const set = new Set(annees);
    for (let i = 0; i < 6; i++) set.add(anneeCourante - i);
    return Array.from(set).sort((a, b) => b - a);
  }, [annees, anneeCourante]);

  const handleGenerer = () => {
    if (!genPlantId) { setGenMessage({ type: 'error', texte: 'Sélectionnez un établissement.' }); return; }
    setGeneration(true);
    setGenMessage(null);
    rapportMensuelAPI.genererManuellement(genPlantId, genAnnee, genMois)
      .then(() => {
        setGenMessage({ type: 'success', texte: `Rapport de ${MOIS[genMois - 1]} ${genAnnee} généré.` });
        setAnnee(genAnnee); // bascule le filtre sur l'année qu'on vient de générer
        charger();
        rapportMensuelAPI.anneesDisponibles().then((res) => setAnnees(res.data || [])).catch(() => {});
      })
      .catch((e) => {
        const msg = e?.response?.data?.message || "Échec de la génération du rapport.";
        setGenMessage({ type: 'error', texte: msg });
      })
      .finally(() => setGeneration(false));
  };

  // Parcourt les 12 mois de l'année choisie pour ce plant : crée un rapport
  // pour chaque mois où des audits ont déjà été réalisés (les mois sans audit
  // sont simplement ignorés — rien à générer, rien de cassé).
  const handleGenererAnnee = async () => {
    if (!genPlantId) { setGenMessage({ type: 'error', texte: 'Sélectionnez un établissement.' }); return; }
    setGeneration(true);
    setGenMessage({ type: 'info', texte: 'Génération en cours…' });
    let ok = 0, vides = 0, echecs = 0;
    for (let m = 1; m <= 12; m++) {
      // pas la peine d'essayer les mois futurs de l'année en cours
      if (genAnnee === anneeCourante && m > moisCourant) continue;
      setGenMessage({ type: 'info', texte: `Génération en cours… ${MOIS[m - 1]} (${m}/12)` });
      try {
        const res = await rapportMensuelAPI.genererManuellement(genPlantId, genAnnee, m);
        if ((res.data?.nombreAudits ?? 0) > 0) ok++; else vides++;
      } catch {
        echecs++;
      }
    }
    setGenMessage({
      type: echecs ? 'error' : 'success',
      texte: `Terminé : ${ok} rapport(s) généré(s), ${vides} mois sans audit, ${echecs} échec(s).`,
    });
    setAnnee(genAnnee);
    charger();
    rapportMensuelAPI.anneesDisponibles().then((res) => setAnnees(res.data || [])).catch(() => {});
    setGeneration(false);
  };

  return (
    <div style={{ padding: 24, fontFamily: 'Inter, Arial, sans-serif' }}>
     
      {/* ── Panneau génération (backfill mois passés) ─────────── */}
      <div style={{
        background: '#fff', border: `1px solid ${T.g200}`, borderRadius: 12,
        padding: 16, marginBottom: 20, display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap',
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <label style={lbl}>Établissement</label>
          <select
            value={genPlantId}
            onChange={(e) => setGenPlantId(e.target.value)}
            disabled={!!user?.plantId}
            style={{ ...inp, opacity: user?.plantId ? 0.75 : 1, cursor: user?.plantId ? 'not-allowed' : 'auto' }}
          >
            <option value="">— Choisir —</option>
            {plants.map((p) => <option key={p.id} value={p.id}>{p.nom || p.code || `Plant ${p.id}`}</option>)}
          </select>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <label style={lbl}>Mois</label>
          <select value={genMois} onChange={(e) => setGenMois(parseInt(e.target.value, 10))} style={inp}>
            {MOIS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
          </select>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <label style={lbl}>Année</label>
          <select value={genAnnee} onChange={(e) => setGenAnnee(parseInt(e.target.value, 10))} style={inp}>
            {anneesGenerables.map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>
        <button
          onClick={handleGenerer}
          disabled={generation}
          style={{
            padding: '9px 16px', borderRadius: 8, border: 'none', background: T.navy, color: '#fff',
            fontWeight: 700, fontSize: 13, cursor: generation ? 'not-allowed' : 'pointer',
            display: 'inline-flex', alignItems: 'center', gap: 6, opacity: generation ? 0.7 : 1,
          }}
        >
          {generation ? 'Génération…' : <>{Icon.plus} Générer / régénérer</>}
        </button>
        <button
          onClick={handleGenererAnnee}
          disabled={generation}
          title="Génère un rapport pour chaque mois de l'année sélectionnée où des audits ont déjà été réalisés"
          style={{
            padding: '9px 16px', borderRadius: 8, border: `1px solid ${T.blueM}`, background: '#fff', color: T.blueM,
            fontWeight: 700, fontSize: 13, cursor: generation ? 'not-allowed' : 'pointer',
            display: 'inline-flex', alignItems: 'center', gap: 6, opacity: generation ? 0.7 : 1,
          }}
        >
          {Icon.calendar} Générer toute l'année {genAnnee}
        </button>
        {genMessage && (
          <span style={{
            fontSize: 12.5, fontWeight: 600, marginLeft: 4,
            color: genMessage.type === 'success' ? T.success : genMessage.type === 'error' ? T.danger : T.g500,
          }}>
            {genMessage.texte}
          </span>
        )}
      </div>
      <p style={{ fontSize: 11.5, color: T.g400, marginTop: -10, marginBottom: 20 }}>
        Choisissez l'établissement, le mois et l'année, puis cliquez sur « Générer / régénérer ».
        Les données des audits produit déjà terminés à ce jour pour ce mois-là sont relues
        automatiquement pour produire le PDF (aucun modèle Excel requis). Vous pouvez générer
        le rapport du <b>mois en cours</b> à tout moment pour avoir un aperçu des audits déjà
        réalisés — puis cliquer de nouveau sur « Générer / régénérer » plus tard (ou en fin de
        mois) pour le mettre à jour avec les audits terminés entre-temps : chaque génération
        remplace la précédente pour ce plant/mois.
      </p>

      {/* ── Filtres ────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 18, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative' }}>
          <span style={{ position: 'absolute', left: 10, top: 10, color: T.g400 }}>{Icon.search}</span>
          <input
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
            placeholder="Rechercher un établissement (plant)…"
            style={{
              padding: '9px 12px 9px 32px', borderRadius: 8, border: `1px solid ${T.g300}`,
              minWidth: 260, fontSize: 13, outline: 'none',
            }}
          />
        </div>

        <select
          value={annee}
          onChange={(e) => setAnnee(e.target.value)}
          style={{ padding: '9px 12px', borderRadius: 8, border: `1px solid ${T.g300}`, fontSize: 13, background: '#fff' }}
        >
          <option value="">Toutes les années</option>
          {annees.map((a) => <option key={a} value={a}>{a}</option>)}
        </select>
      </div>

      {/* ── Tableau ────────────────────────────────────────── */}
      <div style={{ background: '#fff', borderRadius: 12, border: `1px solid ${T.g200}`, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: T.g50, textAlign: 'left' }}>
              <th style={th}>Établissement (Plant)</th>
              <th style={th}>Mois</th>
              <th style={th}>Année</th>
              <th style={th}>Nb audits</th>
              <th style={th}>Généré le</th>
              <th style={{ ...th, textAlign: 'right' }}>Télécharger</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={6} style={{ ...td, textAlign: 'center', color: T.g500 }}>Chargement…</td></tr>
            )}
            {!loading && erreur && (
              <tr><td colSpan={6} style={{ ...td, textAlign: 'center', color: T.danger }}>{erreur}</td></tr>
            )}
            {!loading && !erreur && rapports.length === 0 && (
              <tr><td colSpan={6} style={{ ...td, textAlign: 'center', color: T.g500 }}>Aucun rapport mensuel pour ces filtres.</td></tr>
            )}
            {!loading && rapports.map((r) => (
              <tr key={r.id} style={{ borderTop: `1px solid ${T.g100}` }}>
                <td style={td}><b>{r.plantNom}</b></td>
                <td style={td}>{r.moisLabel}</td>
                <td style={td}>{r.annee}</td>
                <td style={td}>
                  <span style={{
                    padding: '2px 10px', borderRadius: 999, fontSize: 12, fontWeight: 700,
                    background: T.successBg, color: T.success, border: `1px solid ${T.successBd}`,
                  }}>{r.nombreAudits}</span>
                </td>
                <td style={{ ...td, color: T.g500 }}>
                  {r.dateGeneration ? new Date(r.dateGeneration).toLocaleString('fr-FR') : '—'}
                </td>
                <td style={{ ...td, textAlign: 'right', whiteSpace: 'nowrap' }}>
                  <button
                    disabled={!r.pdfDisponible}
                    onClick={() => telechargerBlob(rapportMensuelAPI.telechargerPdf(r.id), `rapport-mensuel-${r.plantNom}-${r.moisLabel}-${r.annee}.pdf`)}
                    style={btn(T.dangerBg, T.danger, T.dangerBd)}
                  >{Icon.file}&nbsp;PDF</button>
                  
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const th = { padding: '10px 14px', fontSize: 12, fontWeight: 700, color: T.g700, textTransform: 'uppercase', letterSpacing: 0.4 };
const td = { padding: '10px 14px', color: T.navy };
const lbl = { fontSize: 11, fontWeight: 700, color: T.g500, textTransform: 'uppercase', letterSpacing: 0.3 };
const inp = { padding: '8px 10px', borderRadius: 7, border: `1px solid ${T.g300}`, fontSize: 13, background: '#fff', minWidth: 150 };
const btn = (bg, color, bd) => ({
  marginLeft: 8, padding: '6px 12px', borderRadius: 7, fontSize: 12, fontWeight: 700,
  background: bg, color, border: `1px solid ${bd}`, cursor: 'pointer', display: 'inline-flex',
  alignItems: 'center', gap: 4,
});