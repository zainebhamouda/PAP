// src/hooks/useExamLock.js
import { useEffect, useRef, useState, useCallback } from 'react';

const HAS_KB_LOCK = typeof navigator !== 'undefined'
  && 'keyboard' in navigator
  && typeof navigator.keyboard.lock === 'function';

// ── Fullscreen ──────────────────────────────────────────────────
function enterFs() {
  const el = document.documentElement;
  const fn = el.requestFullscreen || el.webkitRequestFullscreen
           || el.mozRequestFullScreen || el.msRequestFullscreen;
  if (fn) return fn.call(el).catch(() => {});
  return Promise.resolve();
}
function exitFs() {
  const fn = document.exitFullscreen || document.webkitExitFullscreen
           || document.mozCancelFullScreen || document.msExitFullscreen;
  if (fn) return fn.call(document).catch(() => {});
  return Promise.resolve();
}
function inFs() {
  return !!(document.fullscreenElement || document.webkitFullscreenElement
          || document.mozFullScreenElement || document.msFullscreenElement);
}
function addFsChange(fn) {
  ['fullscreenchange','webkitfullscreenchange','mozfullscreenchange','MSFullscreenChange']
    .forEach(ev => document.addEventListener(ev, fn));
}
function removeFsChange(fn) {
  ['fullscreenchange','webkitfullscreenchange','mozfullscreenchange','MSFullscreenChange']
    .forEach(ev => document.removeEventListener(ev, fn));
}

// ── Keyboard Lock ───────────────────────────────────────────────
async function lockKb() {
  if (!HAS_KB_LOCK) return false;
  try {
    await navigator.keyboard.lock([
      'Escape','MetaLeft','MetaRight',
      'F1','F2','F3','F4','F5','F6',
      'F8','F9','F10','F11','F12',
    ]);
    return true;
  } catch { return false; }
}
function unlockKb() {
  if (HAS_KB_LOCK) try { navigator.keyboard.unlock(); } catch {}
}

// ══════════════════════════════════════════════════════════════════
//  BANDE TRANSPARENTE + BLOCAGE SOURIS
//
//  La souris reste LIBRE partout sauf dans la bande en haut.
//  Quand elle approche de la bande → elle s'arrête à la limite.
//  Technique : on surveille mousemove, si Y < BAND_H on force
//  le curseur à rester à Y = BAND_H en simulant un scroll/offset.
//
//  En pratique : on cache le curseur dans la bande (cursor:none)
//  et on bloque tous les events — l'auditeur sent que sa souris
//  "disparaît" en haut → il s'arrête.
//  En dehors de la bande : curseur 100% normal.
// ══════════════════════════════════════════════════════════════════
const B_ID   = '__exam_band__';
const BAND_H = 60; // hauteur bande en px

let _bandGuard = null;
let _obs       = null;

function showBand() {
  document.getElementById(B_ID)?.remove();

  // Div transparente — bloque les clics et interactions dans la zone
  const band = document.createElement('div');
  band.id = B_ID;
  band.style.cssText = `
    position: fixed !important;
    top: 0 !important;
    left: 0 !important;
    width: 100vw !important;
    height: ${BAND_H}px !important;
    background: transparent !important;
    z-index: 2147483647 !important;
    pointer-events: all !important;
    cursor: none !important;
    user-select: none !important;
  `;

  // Bloquer tous les events sur la bande
  const stop = (e) => {
    e.stopImmediatePropagation();
    e.preventDefault();
  };
  ['click','dblclick','mousedown','mouseup','mousemove','mouseover',
   'mouseenter','mouseleave','pointerdown','pointerup','pointermove',
   'pointerover','pointerenter','contextmenu','wheel']
    .forEach(ev => band.addEventListener(ev, stop, { capture: true, passive: false }));

  document.body.insertBefore(band, document.body.firstChild);

  // Guard global sur le document entier
  // → surveille Y de la souris
  // → dans la bande : curseur none (souris "disparaît")
  // → hors de la bande : curseur normal
  if (_bandGuard) {
    document.removeEventListener('mousemove',   _bandGuard, { capture: true });
    document.removeEventListener('pointermove', _bandGuard, { capture: true });
  }

  // Le guard intercepte AVANT que la div bande ne reçoive l'événement.
  // Si la souris tente d'entrer dans la bande (clientY < BAND_H) :
  // → on bloque l'événement immédiatement
  // → on déplace visuellement le curseur CSS à la limite (Y = BAND_H)
  // → la souris physique peut bouger mais le curseur s'arrête au bord
  _bandGuard = (e) => {
    const y = e.clientY ?? 0;
    if (y < BAND_H) {
      // Stopper l'événement — la souris ne "passe" pas dans la bande
      e.stopImmediatePropagation();
      e.preventDefault();
      // Positionner un curseur factice à Y=BAND_H (limite basse de la bande)
      // pour donner l'impression que la souris s'est arrêtée
      document.documentElement.style.setProperty('cursor', 'none', 'important');
      // Déplacer le focus sur l'élément à Y=BAND_H pour que le navigateur
      // considère que la souris est là et non dans sa zone de contrôle
      const elAtLimit = document.elementFromPoint(e.clientX, BAND_H + 1);
      if (elAtLimit && elAtLimit !== document.getElementById(B_ID)) {
        // Simuler mouseenter sur cet élément pour "ancrer" la position
        elAtLimit.dispatchEvent(new MouseEvent('mousemove', {
          bubbles: false, cancelable: false,
          clientX: e.clientX, clientY: BAND_H + 1,
        }));
      }
    } else {
      // Zone libre → curseur 100% normal
      document.documentElement.style.removeProperty('cursor');
    }
  };

  document.addEventListener('mousemove',   _bandGuard, { capture: true, passive: false });
  document.addEventListener('pointermove', _bandGuard, { capture: true, passive: false });

  // Observer — recrée la bande si React la supprime lors d'une navigation
  _obs?.disconnect();
  _obs = new MutationObserver(() => {
    if (inFs() && !document.getElementById(B_ID)) showBand();
  });
  _obs.observe(document.body, { childList: true });
}

function hideBand() {
  document.getElementById(B_ID)?.remove();

  if (_bandGuard) {
    document.removeEventListener('mousemove',   _bandGuard, { capture: true });
    document.removeEventListener('pointermove', _bandGuard, { capture: true });
    _bandGuard = null;
  }

  _obs?.disconnect();
  _obs = null;

  // Restaurer le curseur normal
  document.documentElement.style.removeProperty('cursor');
}

// ══════════════════════════════════════════════════════════════════
//  HOOK PRINCIPAL
// ══════════════════════════════════════════════════════════════════
export function useExamLock(active, examName = 'examen', onViolation = null) {
  const violationsRef = useRef(0);
  const reentryRef    = useRef(false);
  const [devPaused, setDevPaused] = useState(false);
  const [kbLocked,  setKbLocked]  = useState(false);

  const isLocked = active && !devPaused;

  const logViolation = useCallback((type) => {
    if (!isLocked) return;
    violationsRef.current += 1;
    onViolation?.({ type, count: violationsRef.current });
  }, [isLocked, onViolation]);

  // ── Ctrl+F7 — combinaison secrète (dev ET prod) ─────────────
  useEffect(() => {
    if (!active) return;
    const h = (e) => {
      if (!(e.ctrlKey && e.key === 'F7')) return;
      e.preventDefault();
      e.stopPropagation();
      setDevPaused(prev => {
        const next = !prev;
        if (next) {
          unlockKb(); setKbLocked(false);
          hideBand();
          exitFs();
          showToast('🛠️ Verrou suspendu — Ctrl+F7 pour réactiver');
        } else {
          enterFs().then(async () => {
            showBand();
            const ok = await lockKb();
            setKbLocked(ok);
          });
          showToast('🔒 Verrou réactivé');
        }
        return next;
      });
    };
    document.addEventListener('keydown', h, { capture: true });
    return () => document.removeEventListener('keydown', h, { capture: true });
  }, [active]);

  // ── Activer verrou ─────────────────────────────────────────────
  useEffect(() => {
    if (isLocked) {
      setTimeout(async () => {
        await enterFs();
        await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
        showBand();
        const ok = await lockKb();
        setKbLocked(ok);
      }, 100);
    } else {
      unlockKb(); setKbLocked(false);
      hideBand();
      if (inFs()) exitFs();
    }
  }, [isLocked]);

  // ── Réentrée FS ────────────────────────────────────────────────
  useEffect(() => {
    if (!isLocked) return;
    const h = () => {
      if (!isLocked || reentryRef.current || kbLocked) return;
      if (!inFs()) {
        reentryRef.current = true;
        logViolation('fullscreen-exit');
        enterFs().then(() => {
          showBand();
          reentryRef.current = false;
        });
      }
    };
    addFsChange(h);
    return () => removeFsChange(h);
  }, [isLocked, kbLocked, logViolation]);

  // ── Blocage clavier ────────────────────────────────────────────
  useEffect(() => {
    if (!isLocked) return;
    const h = (e) => {
      const key   = e.key || '';
      const low   = key.toLowerCase();
      const ctrl  = e.ctrlKey || e.metaKey;
      const shift = e.shiftKey;
      const alt   = e.altKey;

      if (ctrl && key === 'F7') return; // secret

      const toBlock = [
        key === 'F5', ctrl && low === 'r',
        ctrl && low === 't', ctrl && low === 'n',
        ctrl && low === 'w', alt && key === 'F4',
        ctrl && shift && low === 'i',
        ctrl && shift && low === 'j',
        ctrl && shift && low === 'c',
        ctrl && low === 'u',
      ];
      if (toBlock.some(Boolean)) {
        e.preventDefault();
        e.stopImmediatePropagation();
        logViolation(key);
      }
    };
    const blockCtx = (e) => e.preventDefault();
    document.addEventListener('keydown',     h,        { capture: true });
    document.addEventListener('contextmenu', blockCtx, { capture: true });
    return () => {
      document.removeEventListener('keydown',     h,        { capture: true });
      document.removeEventListener('contextmenu', blockCtx, { capture: true });
    };
  }, [isLocked, logViolation]);

  // ── Fermeture navigateur ───────────────────────────────────────
  useEffect(() => {
    if (!isLocked) return;
    const h = (e) => {
      e.preventDefault();
      e.returnValue = 'Un examen est en cours.';
      return e.returnValue;
    };
    window.addEventListener('beforeunload', h);
    return () => window.removeEventListener('beforeunload', h);
  }, [isLocked]);

  // ── Alt+Tab ───────────────────────────────────────────────────
  useEffect(() => {
    if (!isLocked) return;
    const h = () => { if (document.hidden) logViolation('alt-tab'); };
    document.addEventListener('visibilitychange', h);
    return () => document.removeEventListener('visibilitychange', h);
  }, [isLocked, logViolation]);

  // ── window.open ───────────────────────────────────────────────
  useEffect(() => {
    if (!isLocked) return;
    const orig = window.open;
    window.open = () => null;
    return () => { window.open = orig; };
  }, [isLocked]);

  return { violations: violationsRef.current, isLocked, devPaused, kbLocked };
}

// ── Toast secret discret ───────────────────────────────────────
const TID = '__exam_toast__';
function showToast(msg) {
  document.getElementById(TID)?.remove();
  const el = document.createElement('div');
  el.id = TID;
  el.style.cssText = `
    position: fixed; bottom: 16px; right: 16px;
    background: #1e293b; color: #94a3b8;
    padding: 7px 12px; border-radius: 7px;
    font-size: 11px; font-weight: 600;
    font-family: monospace; z-index: 999999;
    pointer-events: none;
  `;
  el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 3000);
}