    // ════════════════════════════════════════════════════════════════
    //  BAL — js/bal/common/formatters.js
    //  Pure functions, no DOM. Extracted verbatim from js/app.js
    //  (batch 5 of restructure — see spend-na-restructure.md). Plain
    //  classic script, same global scope as app.js. Loaded before
    //  app.js. No logic changes, no renamed functions.
    //  NOTE: fmtINR/parseINR are also called BARE (not via APP.) from
    //  inline onfocus/onblur attributes in index.html — this only
    //  works because this file stays a classic script sharing global
    //  scope with app.js, same as batches 1-4. The deferred ES-module
    //  conversion batch must re-expose these on window or those two
    //  inline handlers will break.
    // ════════════════════════════════════════════════════════════════

    // v7.1: en-IN locale's toLocaleDateString({month:'short'}) renders
    // September as "Sept" (4 letters) while all 11 other months are the
    // standard 3-letter abbreviation — confirmed by testing all 12
    // months directly. Every transaction's stored month key comes from
    // _parseDateInput's fixed 3-letter array ("Sep 2026"), so any
    // "current month" comparison generated via toLocaleDateString instead
    // silently produced "Sept 2026" and never matched — Home's bucket
    // totals, My Month, and Limits all read as empty/₹0 for the real
    // current month whenever that month is September, even though the
    // transactions were saved correctly. Fixed at the source: every
    // month-abbreviation generator below now uses the same fixed array
    // _parseDateInput already had right, instead of the locale API.
    const MONTH_ABBR = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    function _fmtDate(d) { try { return d instanceof Date && !isNaN(d) ? String(d.getDate()).padStart(2,'0') + ' ' + MONTH_ABBR[d.getMonth()] : ''; } catch(e) { return ''; } }
    function _fmtTime(d) { try { return d instanceof Date && !isNaN(d) ? d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : ''; } catch(e) { return ''; } }
    function _fmtMonth(d) { try { return d instanceof Date && !isNaN(d) ? MONTH_ABBR[d.getMonth()] + ' ' + d.getFullYear() : ''; } catch(e) { return ''; } }
    function fmt(n) { if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`; if (n >= 1000) return `₹${(n / 1000).toFixed(1)}k`; return `₹${n}`; }
    function fmtF(n) { return '₹' + (isFinite(+n) ? +n : 0).toLocaleString('en-IN'); }
    function fmtINR(n) { if (!n && n !== 0) return ''; return Number(n).toLocaleString('en-IN'); }
    function parseINR(s) { return parseFloat((String(s || '')).replace(/,/g, '')) || 0; }
    function offsetMonthStr(offset) { const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() + offset); return MONTH_ABBR[d.getMonth()] + ' ' + d.getFullYear(); }
    function offsetMonthLong(offset) { const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() + offset); return d.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }); }
