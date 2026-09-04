    // ════════════════════════════════════════════════════════════════
    //  UTILS — js/utils/utils.js
    //  Cross-cutting helpers used by UI, BAL, and DAL alike — doesn't
    //  belong to any single layer, per spend-na-restructure.md's
    //  "Use judgment, document the choice" guidance. Extracted
    //  verbatim from js/app.js (batch 10). Plain classic script, same
    //  global scope as app.js. Loaded before app.js (and before every
    //  other extracted file — genuinely foundational, zero deps other
    //  than window.ENV which env-config.js already sets first).
    //  No logic changes, no renamed functions.
    // ════════════════════════════════════════════════════════════════

    // ── XSS ESCAPE — every user string must pass through this before innerHTML ──
    function esc(s) { return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#x27;'); }

    // ── DEBUG LOGGING ────────────────────────────────────────────
    const DEBUG = (window.ENV && window.ENV.debug) || false; // v5.8: set by env-config.js per environment; NEW-003
    function log() { if (DEBUG) console.log.apply(console, arguments); } // NEW-003

    // ── SAFE LOCALSTORAGE READ ───────────────────────────────────
    function _safeGet(key, fallback) { if (!key) return fallback; try { const r = localStorage.getItem(key); if (!r) return fallback; const p = JSON.parse(r); return (p !== null && p !== undefined) ? p : fallback; } catch(e) { console.warn('[_safeGet]', key, e); return fallback; } } // CR-03

    // ── APP METHOD ERROR GUARD ────────────────────────────────────
    // Wraps every APP method: uncaught errors show a toast + log,
    // never crash the UI silently. Applied after APP object is defined
    // (called as _guardAPP(APP) from app.js, at top-level script time —
    // this file must load before app.js for that call to resolve).
    function _guardAPP(obj) {
      Object.keys(obj).forEach(key => {
        if (typeof obj[key] !== 'function') return;
        const orig = obj[key].bind(obj);
        obj[key] = function(...args) {
          try {
            return orig(...args);
          } catch(err) {
            console.error('[APP.' + key + ']', err);
            try { toast('⚠️ Something went wrong — please retry'); } catch(_) { /* intentionally silent */ }
          }
        };
      });
      return obj;
    }
