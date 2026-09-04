    // ════════════════════════════════════════════════════════════════
    //  BAL — js/bal/ai-insights/budget-suggestions.js
    //  Extracted verbatim from js/app.js (batch 7 — see
    //  spend-na-restructure.md). Plain classic script, same global
    //  scope as app.js. Loaded before app.js. No logic changes.
    // ════════════════════════════════════════════════════════════════

    function generateBudgetSuggestion() {
      if (!getAIConfig().budgetSuggest) return '';
      const txns = D.transactions || [];
      if (txns.length < 8) return '';
      if (!Object.values(D.limits||{}).every(v=>!v||v===0)) return '';
      const months = [-1,-2,-3].map(o=>offsetMonthStr(o));
      const avgs = {};
      Object.keys(BUCKETS).forEach(k => {
        const totals = months.map(m=>txns.filter(t=>t.month===m&&t.bucket===k).reduce((s,t)=>s+t.amount,0)).filter(v=>v>0);
        avgs[k] = totals.length ? Math.round(totals.reduce((s,v)=>s+v,0)/totals.length/100)*100 : 0;
      });
      if (Object.values(avgs).every(v=>v===0)) return '';
      window._aiSuggestedLimits = avgs;
      return '<div class="budget-suggest-card">'
        + '<div style="font-size:12px;font-weight:700;color:#15803d;margin-bottom:10px">Based on your last 3 months — suggested limits:</div>'
        + Object.entries(BUCKETS).map(([k,c])=>avgs[k]>0?`<div style="display:flex;justify-content:space-between;font-size:13px;padding:3px 0"><span style="color:${c.c}">${c.g} ${c.l}</span><span style="font-weight:700">${fmtF(avgs[k])}</span></div>`:'').join('')
        + '<button onclick="APP.applyBudgetSuggestion()" style="width:100%;margin-top:12px;padding:10px;background:#16a34a;color:#fff;border:none;border-radius:var(--r);font-size:13px;font-weight:700;cursor:pointer;font-family:var(--ff)">Apply these limits</button>'
        + '</div>';
    }

    function detectCategoryCreep() {
      const txns = D.transactions || [];
      const results = [];
      Object.keys(BUCKETS).forEach(k => {
        const months = [-3,-2,-1,0].map(o => ({
          month: offsetMonthStr(o),
          total: txns.filter(t=>t.month===offsetMonthStr(o)&&t.bucket===k)
                     .reduce((s,t)=>s+t.amount,0)
        }));
        const totals = months.map(m=>m.total).filter(v=>v>0);
        if (totals.length < 3) return;
        const growing = totals.every((v,i) => i===0 || v >= totals[i-1] * 1.08);
        if (growing) {
          const pct = Math.round(((totals[totals.length-1]/totals[0])-1)*100);
          results.push({k, pct, latest: totals[totals.length-1]});
        }
      });
      return results;
    }

