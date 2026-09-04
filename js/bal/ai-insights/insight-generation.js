    // ════════════════════════════════════════════════════════════════
    //  BAL — js/bal/ai-insights/insight-generation.js
    //  Extracted verbatim from js/app.js (batch 7 — see
    //  spend-na-restructure.md). Plain classic script, same global
    //  scope as app.js. Loaded before app.js. No logic changes.
    // ════════════════════════════════════════════════════════════════

    function aiGenerateInsight() {
      const txns = D.transactions || [];
      if (txns.length < 5) return null;

      const currentMonth = offsetMonthStr(0);
      const prevMonth = offsetMonthStr(-1);
      const monthTxns = txns.filter(t => t.month === currentMonth);
      const prevTxns = txns.filter(t => t.month === prevMonth);

      const insights = [];

      // Weekend vs weekday spending
      const weekendTxns = monthTxns.filter(t => { const d = new Date(t.timestamp); return d.getDay() === 0 || d.getDay() === 6; });
      const weekdayTxns = monthTxns.filter(t => { const d = new Date(t.timestamp); return d.getDay() > 0 && d.getDay() < 6; });
      if (weekendTxns.length > 2 && weekdayTxns.length > 2) {
        const wkndAvg = weekendTxns.reduce((s,t)=>s+t.amount,0) / weekendTxns.length;
        const wkdayAvg = weekdayTxns.reduce((s,t)=>s+t.amount,0) / weekdayTxns.length;
        if (wkndAvg > wkdayAvg * 1.3) {
          insights.push(`You spend ${Math.round((wkndAvg/wkdayAvg-1)*100)}% more on weekends — ₹${Math.round(wkndAvg).toLocaleString('en-IN')} avg vs ₹${Math.round(wkdayAvg).toLocaleString('en-IN')} weekdays`);
        }
      }

      // Fastest growing bucket vs last month
      if (prevTxns.length > 0) {
        let biggestGrowth = null, biggestPct = 0;
        for (const bk of Object.keys(BUCKETS)) {
          const cur = monthTxns.filter(t=>t.bucket===bk).reduce((s,t)=>s+t.amount,0);
          const prev = prevTxns.filter(t=>t.bucket===bk).reduce((s,t)=>s+t.amount,0);
          if (prev > 0 && cur > prev) {
            const pct = ((cur - prev) / prev) * 100;
            if (pct > biggestPct) { biggestPct = pct; biggestGrowth = bk; }
          }
        }
        if (biggestGrowth && biggestPct > 20) {
          insights.push(`${BUCKETS[biggestGrowth].l} is your fastest growing spend — up ${Math.round(biggestPct)}% from last month`);
        }
      }

      // Logging streak
      const daySet = new Set(monthTxns.map(t => t.date));
      const today = new Date().getDate();
      if (daySet.size >= today * 0.7 && daySet.size >= 5) {
        insights.push(`${daySet.size} days logged this month — you're building a solid habit 🔥`);
      }

      // Best month ever
      const monthTotals = {};
      txns.forEach(t => { if (t.month) monthTotals[t.month] = (monthTotals[t.month]||0) + t.amount; });
      const sortedMonths = Object.entries(monthTotals).sort((a,b)=>a[1]-b[1]);
      if (sortedMonths.length >= 3) {
        const [bestMonth, bestAmt] = sortedMonths[0];
        if (bestMonth !== currentMonth) {
          insights.push(`Your most disciplined month was ${bestMonth} — ₹${Math.round(bestAmt).toLocaleString('en-IN')} total. Can you beat it?`);
        }
      }

      // Most frequent merchant
      const merchantCount = {};
      monthTxns.forEach(t => { if (t.merchant && t.merchant !== 'Manual Entry') merchantCount[t.merchant] = (merchantCount[t.merchant]||0)+1; });
      const topMerchant = Object.entries(merchantCount).sort((a,b)=>b[1]-a[1])[0];
      if (topMerchant && topMerchant[1] >= 3) {
        insights.push(`${topMerchant[0]} appears ${topMerchant[1]} times this month — your most frequent spend`);
      }

      if (insights.length === 0) return null;
      // Pick one insight — rotate by week number
      const weekNum = Math.floor(Date.now() / (WEEK_MS));
      return insights[weekNum % insights.length];
    }

    function aiGenerateStory(monthStr) {
      const txns = (D.transactions || []).filter(t => t.month === monthStr);
      if (txns.length < 3) return null;

      const total = txns.reduce((s,t)=>s+t.amount,0);
      const prevMonth = offsetMonthStr(-1);
      const prevTxns = (D.transactions||[]).filter(t=>t.month===prevMonth);
      const prevTotal = prevTxns.reduce((s,t)=>s+t.amount,0);

      // Top bucket
      let topBkt = null, topAmt = 0;
      for (const bk of Object.keys(BUCKETS)) {
        const a = txns.filter(t=>t.bucket===bk).reduce((s,t)=>s+t.amount,0);
        if (a > topAmt) { topAmt = a; topBkt = bk; }
      }

      // Biggest single spend
      const biggestTxn = txns.reduce((best,t) => t.amount > (best ? best.amount : 0) ? t : best, null);

      // Weekend concentration
      const weekendAmt = txns.filter(t=>{const d=new Date(t.timestamp);return d.getDay()===0||d.getDay()===6;}).reduce((s,t)=>s+t.amount,0);
      const weekendPct = total > 0 ? Math.round((weekendAmt/total)*100) : 0;

      // Budget check
      const overBuckets = Object.keys(BUCKETS).filter(bk => {
        const spent = txns.filter(t=>t.bucket===bk).reduce((s,t)=>s+t.amount,0);
        return D.limits && D.limits[bk] > 0 && spent <= D.limits[bk];
      });

      // Build story sentences
      const sentences = [];
      const vsLast = prevTotal > 0 ? Math.round(((total-prevTotal)/prevTotal)*100) : null;
      if (vsLast !== null) {
        sentences.push(vsLast > 10 ? `${monthStr} was a heavier month — up ${vsLast}% from last month.` :
                       vsLast < -10 ? `${monthStr} was a lean month — down ${Math.abs(vsLast)}% from last month.` :
                       `${monthStr} was steady — spending stayed close to last month.`);
      } else {
        sentences.push(`${monthStr} had ${txns.length} recorded spends totalling ${fmtF(total)}.`);
      }

      if (topBkt) {
        const topPct = Math.round((topAmt/total)*100);
        sentences.push(`${BUCKETS[topBkt].l} was your biggest category at ${topPct}% of total spend.`);
      }

      if (biggestTxn && biggestTxn.amount > total * 0.15) {
        sentences.push(`Biggest single spend: ${fmtF(biggestTxn.amount)} on ${biggestTxn.merchant}.`);
      }

      if (weekendPct > 40) {
        sentences.push(`${weekendPct}% of spending happened on weekends.`);
      }

      if (overBuckets.length === 4) {
        sentences.push(`You stayed within budget in all buckets — that's a win.`);
      } else if (overBuckets.length >= 2) {
        sentences.push(`You stayed within budget in ${overBuckets.length} out of 4 buckets.`);
      }

      // v5.0: Honest Comparison paragraph
      try {
        const comparison = generateHonestComparison(monthStr);
        if (comparison) sentences.push(comparison);
      } catch(e) { console.warn("[catch]", e); }

      return sentences.join(' ');
    }

    function generateHonestComparison(monthStr) {
      const txns = D.transactions || [];
      const current = txns.filter(t=>t.month===monthStr).reduce((s,t)=>s+t.amount,0);
      const pastMonths = [...new Set(txns.map(t=>t.month))].filter(m => m !== monthStr);
      if (pastMonths.length < 2) return null;
      const avg = pastMonths.reduce((s,m) => {
        return s + txns.filter(t=>t.month===m).reduce((sum,t)=>sum+t.amount,0);
      }, 0) / pastMonths.length;
      if (avg === 0) return null;
      const diff = current - avg;
      const pct = Math.round(Math.abs(diff/avg)*100);
      if (pct < 5) return `This month's total is almost identical to your personal average of ${fmtF(Math.round(avg))}.`;
      return diff > 0
        ? `Compared to your own average, this month you spent ${pct}% more than usual — ${fmtF(Math.abs(diff))} above your typical ${fmtF(Math.round(avg))}.`
        : `Compared to your own average, this month you spent ${pct}% less than usual — ${fmtF(Math.abs(diff))} below your typical ${fmtF(Math.round(avg))}. Strong month.`;
    }

    function generateSpendTwin(currentMonthStr) {
      if (!getAIConfig().spendTwin) return null;
      const txns = D.transactions || [];
      // single grouped pass instead of a filter() per month-per-bucket (was
      // O(months x buckets x n), unbounded as account age grows — a 2-year
      // history could mean 24 months x 4 buckets = 96 full-array scans here alone)
      const byMonth = {};
      txns.forEach(t => {
        if (!byMonth[t.month]) byMonth[t.month] = {};
        byMonth[t.month][t.bucket] = (byMonth[t.month][t.bucket] || 0) + t.amount;
      });
      const currentTxnsCount = txns.reduce((c,t) => c + (t.month === currentMonthStr ? 1 : 0), 0);
      if (currentTxnsCount < 3) return null;
      const current = byMonth[currentMonthStr] || {};
      const currentTotal = Object.values(current).reduce((s,v)=>s+v,0);
      if (currentTotal === 0) return null;
      const pastMonths = Object.keys(byMonth).filter(m => m !== currentMonthStr);
      if (pastMonths.length < 2) return null;
      let bestMatch = null, bestScore = Infinity;
      pastMonths.forEach(m => {
        const past = byMonth[m];
        const pastTotal = Object.values(past).reduce((s,v)=>s+v,0);
        if (pastTotal === 0) return;
        const score = Object.keys(BUCKETS).reduce((s,k)=>s+Math.abs((currentTotal>0?(current[k]||0)/currentTotal:0)-(pastTotal>0?(past[k]||0)/pastTotal:0)),0);
        if (score < bestScore) { bestScore=score; bestMatch={month:m,total:pastTotal}; }
      });
      if (!bestMatch || bestScore > 0.45) return null;
      return { ...bestMatch, similarity: Math.round((1-bestScore/2)*100) };
    }

