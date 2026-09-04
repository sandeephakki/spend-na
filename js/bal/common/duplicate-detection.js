    // ════════════════════════════════════════════════════════════════
    //  BAL — js/bal/common/duplicate-detection.js
    //  Extracted verbatim from js/app.js (batch 6 — see
    //  spend-na-restructure.md). Plain classic script, same global
    //  scope as app.js. Loaded before app.js. No logic changes.
    // ════════════════════════════════════════════════════════════════

    function checkDuplicate(amount, merchant) {
      if (!getAIConfig().duplicate) return null;
      const cutoff = Date.now() - (15 * 60 * 1000);
      return (D.transactions||[]).find(t => {
        const tTime = new Date(t.timestamp||0).getTime();
        return tTime > cutoff && Math.abs(t.amount - amount) < 2
          && (t.merchant||'').toLowerCase() === (merchant||'').toLowerCase();
      }) || null;
    }
