import { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, Cell } from 'recharts';
import { rapportMensuelAPI } from '../../services/rapportMensuelAPI';
import { sitesPublicAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

// ──────────────────────────────────────────────────────────────
// Design tokens — palette corporate LEONI (navy/ardoise)
// ──────────────────────────────────────────────────────────────
const T = {
  navy: '#0B1E3D', navySoft: '#13294D', ink: '#16233B',
  blue: '#1E3A5F', blueM: '#1D4ED8', blueBg: '#EEF3FC',
  teal: '#0E7C7B', tealDeep: '#0A5654', tealBg: '#ECF8F7', tealBd: '#BFE6E4',
  g50: '#F7F9FC', g100: '#EEF2F8', g200: '#E4E9F2', g300: '#CBD5E1',
  g400: '#94A3B8', g500: '#64748B', g600: '#475569', g700: '#334155',
  success: '#15803D', successBg: '#F0FDF4', successBd: '#86EFAC',
  warn: '#B4790C', warnBg: '#FFFBEB', warnBd: '#FCD34D',
  danger: '#B91C1C', dangerBg: '#FEF2F2', dangerBd: '#FECACA',
  shadow: '0 1px 2px rgba(11,30,61,.05), 0 10px 28px -8px rgba(11,30,61,.14)',
  shadowSoft: '0 1px 2px rgba(11,30,61,.04), 0 4px 14px -4px rgba(11,30,61,.08)',
};

const MOIS = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
];
const MOIS_COURT = ['Jan','Fév','Mar','Avr','Mai','Juin','Juil','Août','Sep','Oct','Nov','Déc'];

const Icon = {
  search:   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  download: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>,
  calendar: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  file:     <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>,
  plus:     <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  building: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M3 21h18M6 21V5a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v16M18 21V10a1 1 0 0 0-1-1h-4"/><path d="M9 7h1M9 11h1M9 15h1"/></svg>,
  stack:    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 3 2 8l10 5 10-5-10-5Z"/><path d="m2 13 10 5 10-5"/></svg>,
  spark:    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M13 3 4 14h7l-1 7 9-11h-7l1-7Z"/></svg>,
  trend:    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><polyline points="3 17 9 11 13 15 21 6"/><polyline points="15 6 21 6 21 12"/></svg>,
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

  const containerRef = useRef(null);
  useEffect(() => {
    const parent = containerRef.current?.parentElement;
    if (parent) {
      const originalBg = parent.style.backgroundColor;
      parent.style.backgroundColor = '#ffffff';
      return () => {
        parent.style.backgroundColor = originalBg || '';
      };
    }
  }, []);

  const [rapports, setRapports] = useState([]);
  const [annees, setAnnees] = useState([]);
  const [annee, setAnnee] = useState('');
  const [recherche, setRecherche] = useState('');
  const [loading, setLoading] = useState(true);
  const [erreur, setErreur] = useState(null);

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
    const t = setTimeout(charger, 250);
    return () => clearTimeout(t);
  }, [charger]);

  const stats = useMemo(() => {
    const totalRapports = rapports.length;
    const totalAudits = rapports.reduce((s, r) => s + (r.nombreAudits || 0), 0);
    const plantsDistincts = new Set(rapports.map((r) => r.plantNom)).size;

    const parMois = MOIS.map((label, i) => ({
      mois: MOIS_COURT[i],
      moisComplet: label,
      audits: rapports.filter((r) => r.mois === i + 1).reduce((s, r) => s + (r.nombreAudits || 0), 0),
    }));
    const moisPic = parMois.reduce((best, cur) => (cur.audits > best.audits ? cur : best), parMois[0]);
    const moyenneParRapport = totalRapports > 0 ? (totalAudits / totalRapports) : 0;

    return { totalRapports, totalAudits, plantsDistincts, parMois, moisPic, moyenneParRapport };
  }, [rapports]);

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
        setAnnee(genAnnee);
        charger();
        rapportMensuelAPI.anneesDisponibles().then((res) => setAnnees(res.data || [])).catch(() => {});
      })
      .catch((e) => {
        const msg = e?.response?.data?.message || "Échec de la génération du rapport.";
        setGenMessage({ type: 'error', texte: msg });
      })
      .finally(() => setGeneration(false));
  };

  const handleGenererAnnee = async () => {
    if (!genPlantId) { setGenMessage({ type: 'error', texte: 'Sélectionnez un établissement.' }); return; }
    setGeneration(true);
    setGenMessage({ type: 'info', texte: 'Génération en cours…' });
    let ok = 0, vides = 0, echecs = 0;
    for (let m = 1; m <= 12; m++) {
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
    <div
      ref={containerRef}
      style={{
        padding: '28px 32px 48px',
        fontFamily: "'Inter', 'Segoe UI', Arial, sans-serif",
        background: '#ffffff',
        minHeight: '100vh',
        width: '100%',
        boxSizing: 'border-box',
      }}
    >
      <div style={{ marginBottom: 26 }}>
        <h1 style={{ fontSize: 27, fontWeight: 800, color: T.navy, marginTop: -40, letterSpacing: '-0.01em',marginBottom: -26 }}>
          Rapports mensuels
        </h1>
      </div>

      {/* ===== CARTES STATISTIQUES : 4 colonnes égales ===== */}
      <div style={{
        background: '#fff',
        border: `1px solid ${T.g200}`,
        borderRadius: 16,
        padding: '20px 22px',
        marginBottom: 20,
        boxShadow: T.shadowSoft,
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: 14,
      }}>
        <StatTile icon={Icon.stack} label="Rapports" value={stats.totalRapports} />
        <StatTile icon={Icon.spark} label="Audits clôturés" value={stats.totalAudits} accent />
        <StatTile icon={Icon.building} label="Établissements" value={stats.plantsDistincts} />
        <StatTile icon={Icon.trend} label="Moy. / rapport" value={stats.moyenneParRapport.toFixed(1)} />
      </div>

      {/* Graphique */}
      <div style={{
        background: '#fff', border: `1px solid ${T.g200}`, borderRadius: 16,
        padding: '20px 22px 8px', marginBottom: 20, boxShadow: T.shadowSoft,
      }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 4 }}>
          <h2 style={{ fontSize: 14.5, fontWeight: 700, color: T.navy, margin: 0 }}>Audits clôturés par mois</h2>
          <span style={{ fontSize: 11.5, color: T.g400 }}>{annee ? `Année ${annee}` : 'Toutes années confondues'}</span>
        </div>
        {stats.totalAudits === 0 ? (
          <div style={{ padding: '28px 0 20px', textAlign: 'center', color: T.g400, fontSize: 13 }}>
            Pas encore de données à visualiser pour ces filtres.
          </div>
        ) : (
          <div style={{ width: '100%', height: 190 }}>
            <ResponsiveContainer>
              <BarChart data={stats.parMois} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke={T.g100} />
                <XAxis dataKey="mois" tick={{ fontSize: 11.5, fill: T.g500 }} axisLine={{ stroke: T.g200 }} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: T.g400 }} axisLine={false} tickLine={false} width={28} />
                <Tooltip
                  cursor={{ fill: T.tealBg }}
                  contentStyle={{ borderRadius: 10, border: `1px solid ${T.g200}`, fontSize: 12.5, boxShadow: T.shadow }}
                  formatter={(v) => [`${v} audit${v > 1 ? 's' : ''}`, 'Clôturés']}
                  labelFormatter={(l, p) => p?.[0]?.payload?.moisComplet || l}
                />
                <Bar dataKey="audits" radius={[5, 5, 0, 0]} maxBarSize={34}>
                  {stats.parMois.map((entry, i) => (
                    <Cell key={i} fill={entry.moisComplet === stats.moisPic?.moisComplet && entry.audits > 0 ? T.tealDeep : T.teal} fillOpacity={entry.audits > 0 ? 1 : 0.18} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Génération */}
      <div style={{
        background: '#fff', border: `1px solid ${T.g200}`, borderRadius: 16,
        padding: 18, marginBottom: 8, boxShadow: T.shadowSoft,
        display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap',
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
            padding: '10px 18px', borderRadius: 9, border: 'none', background: T.navy, color: '#fff',
            fontWeight: 700, fontSize: 13, cursor: generation ? 'not-allowed' : 'pointer',
            display: 'inline-flex', alignItems: 'center', gap: 6, opacity: generation ? 0.7 : 1,
            boxShadow: '0 4px 10px -3px rgba(11,30,61,.35)',
          }}
        >
          {generation ? 'Génération…' : <>{Icon.plus} Générer / régénérer</>}
        </button>
        <button
          onClick={handleGenererAnnee}
          disabled={generation}
          title="Génère un rapport pour chaque mois de l'année sélectionnée où des audits ont déjà été réalisés"
          style={{
            padding: '10px 18px', borderRadius: 9, border: `1px solid ${T.blueM}`, background: '#fff', color: T.blueM,
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

      {/* ===== PARAGRAPHE RÉSUMÉ (largeur totale du parent) ===== */}
      <p style={{
        fontSize: 11.5,
        color: T.g400,
        margin: '8px 0 22px 0',
        lineHeight: 1.5,
        width: '100%',
        wordWrap: 'break-word',
      }}>
        Sélectionnez un établissement, un mois et une année, puis cliquez sur « Générer / régénérer ».
        Le système génère automatiquement le PDF et l'Excel à partir des audits clôturés.
        Vous pouvez générer le mois en cours pour un aperçu et régénérer plus tard ; chaque nouvelle génération remplace la précédente.
      </p>

      {/* Filtres */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 14, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative' }}>
          <span style={{ position: 'absolute', left: 12, top: 11, color: T.g400 }}>{Icon.search}</span>
          <input
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
            placeholder="Rechercher un établissement (plant)…"
            style={{
              padding: '9px 12px 9px 34px', borderRadius: 9, border: `1px solid ${T.g300}`,
              minWidth: 270, fontSize: 13, outline: 'none', background: '#fff',
            }}
          />
        </div>

        <select
          value={annee}
          onChange={(e) => setAnnee(e.target.value)}
          style={{ padding: '9px 12px', borderRadius: 9, border: `1px solid ${T.g300}`, fontSize: 13, background: '#fff' }}
        >
          <option value="">Toutes les années</option>
          {annees.map((a) => <option key={a} value={a}>{a}</option>)}
        </select>
      </div>

      {/* Tableau */}
      <div style={{ background: '#fff', borderRadius: 16, border: `1px solid ${T.g200}`, overflow: 'hidden', boxShadow: T.shadowSoft }}>
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
              <tr><td colSpan={6} style={{ ...td, textAlign: 'center', color: T.g500, padding: '22px 14px' }}>Chargement…</td></tr>
            )}
            {!loading && erreur && (
              <tr><td colSpan={6} style={{ ...td, textAlign: 'center', color: T.danger, padding: '22px 14px' }}>{erreur}</td></tr>
            )}
            {!loading && !erreur && rapports.length === 0 && (
              <tr><td colSpan={6} style={{ ...td, textAlign: 'center', color: T.g500, padding: '22px 14px' }}>Aucun rapport mensuel pour ces filtres.</td></tr>
            )}
            {!loading && rapports.map((r, i) => (
              <tr key={r.id} style={{ borderTop: `1px solid ${T.g100}`, background: i % 2 ? T.g50 : '#fff' }}>
                <td style={td}><b style={{ color: T.navy }}>{r.plantNom}</b></td>
                <td style={td}>{r.moisLabel}</td>
                <td style={td}>{r.annee}</td>
                <td style={td}>
                  <span style={{
                    padding: '2px 10px', borderRadius: 999, fontSize: 12, fontWeight: 700,
                    background: r.nombreAudits > 0 ? T.tealBg : T.g100,
                    color: r.nombreAudits > 0 ? T.tealDeep : T.g500,
                    border: `1px solid ${r.nombreAudits > 0 ? T.tealBd : T.g200}`,
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
                  <button
                    disabled={!r.excelDisponible}
                    onClick={() => telechargerBlob(rapportMensuelAPI.telechargerExcel(r.id), `rapport-mensuel-${r.plantNom}-${r.moisLabel}-${r.annee}.xlsx`)}
                    style={btn(T.successBg, T.success, T.successBd)}
                  >{Icon.download}&nbsp;Excel</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatTile({ icon, label, value, accent }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10, padding: '8px 14px 8px 10px',
      borderRadius: 12, background: accent ? T.tealBg : T.g50,
      border: `1px solid ${accent ? T.tealBd : T.g200}`,
    }}>
      <div style={{
        width: 30, height: 30, borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: accent ? T.tealDeep : T.navy, color: '#fff', flexShrink: 0,
      }}>{icon}</div>
      <div>
        <div style={{ fontSize: 18, fontWeight: 800, color: accent ? T.tealDeep : T.navy, lineHeight: 1.1 }}>{value}</div>
        <div style={{ fontSize: 10.5, fontWeight: 700, color: T.g500, textTransform: 'uppercase', letterSpacing: '.04em' }}>{label}</div>
      </div>
    </div>
  );
}

const th = { padding: '11px 14px', fontSize: 11.5, fontWeight: 700, color: T.g600, textTransform: 'uppercase', letterSpacing: 0.5 };
const td = { padding: '11px 14px', color: T.navy };
const lbl = { fontSize: 11, fontWeight: 700, color: T.g500, textTransform: 'uppercase', letterSpacing: 0.3 };
const inp = { padding: '9px 10px', borderRadius: 8, border: `1px solid ${T.g300}`, fontSize: 13, background: '#fff', minWidth: 150 };
const btn = (bg, color, bd) => ({
  marginLeft: 8, padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 700,
  background: bg, color, border: `1px solid ${bd}`, cursor: 'pointer', display: 'inline-flex',
  alignItems: 'center', gap: 4,
});