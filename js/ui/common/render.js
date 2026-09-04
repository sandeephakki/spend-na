    // ════════════════════════════════════════════════════════════════
    //  UI — js/ui/common/render.js
    //  DOM rendering / event handling helpers. Extracted verbatim from
    //  js/app.js (batch 8 — see spend-na-restructure.md). Plain classic
    //  script, same global scope as app.js. Loaded before app.js. No
    //  logic changes. safeModal/userModal included alongside modal —
    //  not in the doc's named list, but they're 2-line pass-throughs
    //  directly wrapping modal() with zero other logic; splitting them
    //  from modal() would separate a function from its only two call
    //  wrappers for no benefit. rHist/rHistDebounced (+ their
    //  _rHistTimer timer var) appended below — also render-triggering.
    // ════════════════════════════════════════════════════════════════

    function fmtHero(n) {
      const v = isFinite(+n) ? Math.abs(+n) : 0;
      const formatted = '₹' + v.toLocaleString('en-IN');
      let badge = '';
      if (v >= 10000000)      badge = (v / 10000000).toFixed(2).replace(/\.?0+$/, '') + ' Cr';
      else if (v >= 100000)   badge = (v / 100000).toFixed(2).replace(/\.?0+$/, '') + ' L';
      else if (v >= 1000)     badge = (v / 1000).toFixed(1).replace(/\.?0+$/, '') + 'K';
      return { formatted, badge };
    }

    function avHTML(p, sz) {
      const s = sz || 44, lt = ((p && p.name && p.name[0]) || 'S').toUpperCase();
      if (p?.photo && String(p.photo).startsWith('data:image/')) return `<img src="${p.photo}" style="width:100%;height:100%;object-fit:cover;border-radius:inherit">`;
      return `<span style="font-size:${Math.round(s * .38)}px;font-weight:800;color:#fff">${lt}</span>`;
    }

    function ico(m) { if (!m) return '💸'; const lo = m.toLowerCase(); for (const r of ICONS) if (r.kw.some(k => lo.includes(k))) return r.i; return '💸'; }

    function modal(title, body, btns) {
      document.getElementById('mT').textContent = title;
      document.getElementById('mB').innerHTML = body;
      document.getElementById('mBs').innerHTML = btns.map((b, i) => `<button class="mb ${esc(b.c || '')}" id="mb${i}">${esc(b.l)}</button>`).join(''); // CR-01: escape class+label to prevent XSS
      btns.forEach((b, i) => { document.getElementById('mb' + i).onclick = b.a; });
      document.getElementById('modal').classList.add('on');
    }

    function safeModal(title, safeBodyHtml, btns) {
      // safeBodyHtml must be a static string / trusted HTML — never raw user input
      modal(title, safeBodyHtml, btns);
    }

    function userModal(title, userText, btns) {
      // Wraps and escapes user-derived text (merchant names, amounts, tags, notes, etc.)
      modal(title, `<p>${esc(userText)}</p>`, btns);
    }

    // BUG-7: rHist + rHistDebounced — called from HTML oninput but were never defined
    function rHist() { if (APP && APP.r_history) APP.r_history(); }
    let _rHistTimer; // LW-02: let not var
    function rHistDebounced() {
      clearTimeout(_rHistTimer);
      _rHistTimer = setTimeout(() => {
        rHist();
        // BUG-027: record real free-text searches (merchant/amount) so
        // showTagSuggest can offer them back on next focus — search had no
        // memory at all before this, only the separate tag-suggest list.
        try {
          const q = (document.getElementById('srchIn')?.value || '').trim();
          if (q.length >= 2) {
            let recent = JSON.parse(localStorage.getItem('sn_recent_search') || '[]');
            recent = [q, ...recent.filter(r => r.toLowerCase() !== q.toLowerCase())].slice(0, 5);
            localStorage.setItem('sn_recent_search', JSON.stringify(recent));
          }
        } catch(e) {}
      }, 200);
    }
