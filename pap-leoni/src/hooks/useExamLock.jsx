// src/hooks/ExamLockBanner.jsx
// ✅ JSX dans un fichier .jsx — pas d'erreur Vite
import { useExamLock } from './useExamLock';

const IS_DEV = typeof import.meta !== 'undefined' && import.meta.env?.DEV === true;

// ══════════════════════════════════════════════════════════════
//  BANNIÈRE — à placer dans ExamenPage pendant le test
// ══════════════════════════════════════════════════════════════
export function ExamLockBanner({ examName = 'Test Théorique', onLeave, devPaused = false }) {

  // Bannière bleue dev (verrou suspendu via F7)
  if (IS_DEV && devPaused) {
    return (
      <div style={{
        position: 'sticky', top: 0, zIndex: 9000,
        background: '#1D4ED8',
        padding: '8px 20px',
        display: 'flex', alignItems: 'center', gap: 12,
        fontFamily: 'inherit',
        boxShadow: '0 2px 8px rgba(29,78,216,.3)',
      }}>
        <span style={{ fontSize: '1rem' }}>🛠️</span>
        <span style={{ fontWeight: 700, color: '#fff', fontSize: '.84rem' }}>
          [DEV] Verrou suspendu
        </span>
        <span style={{ color: 'rgba(255,255,255,.7)', fontSize: '.78rem' }}>
          Appuyez sur{' '}
          <kbd style={{
            background: 'rgba(255,255,255,.2)',
            padding: '1px 7px', borderRadius: 4,
            fontFamily: 'monospace', fontSize: '.75rem',
          }}>F7</kbd>
          {' '}pour réactiver le verrou
        </span>
      </div>
    );
  }

  // Bannière rouge normale (verrou actif)
  return (
    <div style={{
      position: 'sticky', top: 0, zIndex: 9000,
      background: 'linear-gradient(135deg,#7F1D1D,#DC2626)',
      padding: '10px 20px',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
      boxShadow: '0 4px 16px rgba(220,38,38,.35)',
      fontFamily: 'inherit',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1 }}>
        <span style={{
          width: 10, height: 10,
          background: '#FCA5A5', borderRadius: '50%',
          flexShrink: 0,
          animation: '_ep 1.5s ease-in-out infinite',
        }} />
        <style>{`@keyframes _ep{0%,100%{opacity:1}50%{opacity:.3}}`}</style>
        <span style={{ fontWeight: 800, color: '#fff', fontSize: '.88rem' }}>
          🔒 Examen en cours — {examName}
        </span>
        <span style={{ fontSize: '.75rem', color: 'rgba(255,255,255,.55)', fontWeight: 500 }}>
          Navigation externe bloquée · La plateforme reste accessible
          {IS_DEV && (
            <>
              {' '}·{' '}
              <kbd style={{
                background: 'rgba(255,255,255,.15)',
                padding: '1px 5px', borderRadius: 3,
                fontFamily: 'monospace', fontSize: '.7rem',
              }}>F7</kbd>
              {' '}= suspendre (dev)
            </>
          )}
        </span>
      </div>
      {onLeave && (
        <button
          onClick={onLeave}
          style={{
            background: 'rgba(255,255,255,.15)',
            border: '1px solid rgba(255,255,255,.3)',
            color: '#fff', borderRadius: 8, padding: '6px 14px',
            fontSize: '.78rem', fontWeight: 700,
            cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0,
          }}>
          Quitter l'examen
        </button>
      )}
    </div>
  );
}