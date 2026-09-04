    // ════════════════════════════════════════════════════════════════
    //  BAL — js/bal/ai-insights/digest-and-alerts.js
    //  Extracted verbatim from js/app.js (batch 7 — see
    //  spend-na-restructure.md). Plain classic script, same global
    //  scope as app.js. Loaded before app.js. No logic changes.
    // ════════════════════════════════════════════════════════════════

    function getWeeklyDigest() {
      if (!getAIConfig().weeklyDigest) return null;
      const now = new Date();
      if (now.getDay() !== 1) return null;
      const weekKey = now.getFullYear() + '-W' + Math.ceil(now.getDate()/7);
      try { const saved=JSON.parse(localStorage.getItem('sn_weekly_digest')||'{}'); if(saved.week===weekKey) return saved.text; } catch(e) { console.warn("[catch]", e); }
      const lastWeekStart = new Date(now-WEEK_MS).toISOString().slice(0,10);
      const lastWeekEnd = new Date(now-MS_PER_DAY).toISOString().slice(0,10);
      const txns = (D?.transactions||[]).filter(t=>t.date>=lastWeekStart&&t.date<=lastWeekEnd);
      if (txns.length===0) return null;
      const total = txns.reduce((s,t)=>s+t.amount,0);
      const topBktKey = Object.keys(BUCKETS).reduce((best,k)=>{
        const a=txns.filter(t=>t.bucket===k).reduce((s,t)=>s+t.amount,0);
        return a>(txns.filter(t=>t.bucket===best).reduce((s,t)=>s+t.amount,0))?k:best;
      },Object.keys(BUCKETS)[0]);
      const days=[...new Set(txns.map(t=>t.date))];
      const hvy=days.reduce((b,d)=>{const a=txns.filter(t=>t.date===d).reduce((s,t)=>s+t.amount,0);return a>(b.amt||0)?{d,amt:a}:b;},{});
      const heavyDay = hvy.d ? new Date(hvy.d+'T12:00:00').toLocaleDateString('en-IN',{weekday:'long'}) : '';
      const text = 'Last week: '+fmtF(total)+' \u00b7 '+txns.length+' spends \u00b7 Heaviest: '+heavyDay+' \u00b7 Top: '+(BUCKETS[topBktKey]?.l||'Mixed');
      try { localStorage.setItem('sn_weekly_digest',JSON.stringify({week:weekKey,text})); } catch(e) { console.warn("[catch]", e); }
      return text;
    }

    function getLateNightWarning() {
      const hour = new Date().getHours();
      if (hour < 6 || hour > 10) return null;
      const yesterday = new Date(Date.now()-MS_PER_DAY).toISOString().slice(0,10);
      const lateNight = (D.transactions||[]).filter(t => {
        if (!t.date || t.date !== yesterday) return false;
        const h = t.time ? parseInt(t.time.split(':')[0]) : 12;
        return h >= 22 || h <= 4;
      });
      if (lateNight.length === 0) return null;
      const total = lateNight.reduce((s,t) => s+t.amount,0);
      const merchants = [...new Set(lateNight.map(t=>t.merchant))].slice(0,2).join(', ');
      return `🌙 Last night: ${fmtF(total)} spent after 10pm — ${merchants}`;
    }

    function getSalaryDayIntelligence() {
      const src = SRC_DB.load();
      const salaryEntries = (src.sources||[]).filter(s =>
        (s.name||'').toLowerCase().includes('salary') ||
        (s.name||'').toLowerCase().includes('income')
      );
      if (salaryEntries.length === 0) return null;
      const days = salaryEntries.map(s => new Date(s.timestamp||s.date).getDate());
      const salaryDay = days.sort((a,b) =>
        days.filter(d=>d===b).length - days.filter(d=>d===a).length
      )[0];
      if (!salaryDay) return null;
      const today = new Date().getDate();
      const daysUntil = salaryDay > today ? salaryDay - today :
        (new Date(new Date().getFullYear(), new Date().getMonth()+1, salaryDay).getDate()
         + (30 - today));
      if (daysUntil > 3 || daysUntil <= 0) return null;
      const currentSpend = (D.transactions||[])
        .filter(t => t.month === offsetMonthStr(0))
        .reduce((s,t) => s+t.amount,0);
      const lastSalary = salaryEntries
        .filter(s => s.month === offsetMonthStr(-1))
        .reduce((s,e) => s+(e.amount||0), 0) ||
        salaryEntries.reduce((s,e) => s+(e.amount||0), 0) / salaryEntries.length;
      const remaining = lastSalary - currentSpend;
      const dayWord = daysUntil === 1 ? 'tomorrow' : `in ${daysUntil} days`;
      return `💰 Salary expected ${dayWord}. You have ${fmtF(Math.max(0,remaining))} left this month.`;
    }

    function _getMonthEndWarnings() {
      const now = new Date();
      const day = now.getDate();
      if (day < 22) return []; // only last ~9 days of month
      const sm = summary(offsetMonthStr(0)); // BUG-1
      const lim = D.limits || {};
      const warnings = [];
      for (const [bk, cfg] of Object.entries(BUCKETS)) {
        const spent = sm[bk] || 0;
        const limit = lim[bk] || 0;
        if (limit <= 0) continue;
        const pct = spent / limit;
        if (pct >= BUDGET_WARN_PCT && pct < 1) warnings.push({ bk, cfg, spent, limit, pct, over: false });
        else if (pct >= 1) warnings.push({ bk, cfg, spent, limit, pct, over: true });
      }
      return warnings;
    }

    function _getGuiltFreeStreak() {
      const txns = D.transactions || [];
      if (txns.length === 0) return 0;
      const now = new Date();
      let streak = 0;
      // Walk back from yesterday
      for (let i = 1; i <= 30; i++) {
        const d = new Date(now); d.setDate(d.getDate() - i);
        const dateStr = String(d.getDate()).padStart(2,'0') + ' ' + MONTH_ABBR[d.getMonth()];
        const hasSpend = txns.some(t => t.date === dateStr);
        if (hasSpend) break;
        streak++;
      }
      return streak;
    }

    function _getPaydayInfo() {
      const txns = D.transactions || [];
      if (txns.length < 5) return null;
      // Infer payday: find the day-of-month that appears most as a high-spend spike start
      // Simpler heuristic: look at income sources for this month
      const sd = SRC_DB.load();
      const curMon = offsetMonthStr(0);
      const curSrc = (sd.sources || []).filter(s => s.month === curMon);
      const totalIncome = curSrc.reduce((s, x) => s + (Number(x.amount) || 0), 0);
      if (totalIncome <= 0) return null;
      const sm = summary(curMon); // BUG-1: scope to current month
      const spent = sm.total || 0;
      const left = totalIncome - spent;
      const pct = Math.round((spent / totalIncome) * 100);
      const now = new Date();
      const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
      const daysLeft = daysInMonth - now.getDate();
      const dailyBudget = left > 0 && daysLeft > 0 ? Math.round(left / daysLeft) : 0;
      return { totalIncome, spent, left, pct, daysLeft, dailyBudget };
    }

    function _aiWeekKey() {
      return 'w' + Math.floor(Date.now() / (WEEK_MS));
    }

