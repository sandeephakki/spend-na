    // ════════════════════════════════════════════════════════════════
    //  CORE — js/core/state.js
    //  The app's central in-memory state. Not feature-specific.
    //  Extracted verbatim from js/app.js (batch 2 of restructure — see
    //  spend-na-restructure.md). Plain classic script, same global
    //  scope as app.js — NOT an ES module (module conversion is its
    //  own deferred batch, see batch 1's report). Loaded before
    //  app.js. Pure declaration relocation: D and S keep the exact
    //  same names, shapes, and initial values. Every read/write of
    //  D/S elsewhere in app.js is unchanged — classic <script> tags
    //  share one global lexical scope, so `let D`/`let S` declared
    //  here are visible (and reassignable) from app.js exactly as if
    //  they'd never moved.
    // ════════════════════════════════════════════════════════════════

    let D = null;
    let S = { tab: 'home', sliceBk: null, histF: null, addSrc: null, addBkt: null, limVals: {}, setRole: null, setToggles: {}, unsaved: false, obRole: null, obPhoto: null, install: null, saveBusy: false, loginAttempts: 0, loginLockUntil: 0, monthOffset: 0, monthExpanded: null, _autoSaveTimer: null };
