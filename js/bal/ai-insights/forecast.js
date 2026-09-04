    // ════════════════════════════════════════════════════════════════
    //  BAL — js/bal/ai-insights/forecast.js
    //  Extracted verbatim from js/app.js (batch 7 — see
    //  spend-na-restructure.md). Plain classic script, same global
    //  scope as app.js. Loaded before app.js. No logic changes.
    // ════════════════════════════════════════════════════════════════

    function aiGenerateForecast() {
      const txns = D.transactions || [];
      const currentMonth = offsetMonthStr(0);
      const now = new Date();
      const dayOfMonth = now.getDate();
      const daysInMonth = new Date(now.getFullYear(), now.getMonth()+1, 0).getDate();
      if (dayOfMonth < 5) return null; // not enough data

      const monthTxns = txns.filter(t => t.month === currentMonth);
      if (monthTxns.length < 3) return null;

      const spent = monthTxns.reduce((s,t)=>s+t.amount,0);
      const projected = Math.round((spent / dayOfMonth) * daysInMonth);

      // Comfortable range from last 3 months
      const ranges = [];
      for (let i = 1; i <= 3; i++) {
        const m = offsetMonthStr(-i);
        const mTotal = txns.filter(t=>t.month===m).reduce((s,t)=>s+t.amount,0);
        if (mTotal > 0) ranges.push(mTotal);
      }
      const avgRange = ranges.length > 0 ? ranges.reduce((s,v)=>s+v,0)/ranges.length : 0;
      const breathing = avgRange > 0 ? Math.round(avgRange * 1.1 - projected) : null;

      let text = `₹${spent.toLocaleString('en-IN')} in ${dayOfMonth} days → projected ₹${projected.toLocaleString('en-IN')} by month end.`;
      if (breathing !== null) {
        if (breathing > 0) text += ` ~₹${breathing.toLocaleString('en-IN')} breathing room.`;
        else text += ` ₹${Math.abs(breathing).toLocaleString('en-IN')} over your usual pace.`;
      }

      const pct = avgRange > 0 ? Math.min((projected / avgRange) * 100, 100) : Math.min((spent / (projected||1)) * 100, 100);
      return { text, pct: Math.round(pct) };
    }

