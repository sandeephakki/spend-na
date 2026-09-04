    // ════════════════════════════════════════════════════════════════
    //  BAL — js/bal/ai-insights/parsing.js
    //  Extracted verbatim from js/app.js (batch 7 — see
    //  spend-na-restructure.md). Plain classic script, same global
    //  scope as app.js. Loaded before app.js. No logic changes.
    // ════════════════════════════════════════════════════════════════

    function aiParseOCR(text) {
      // OCR-FIX-001: Robust receipt parser — handles ₹ symbol before/after amounts,
      // Grand Total patterns, Indian receipt formats, UPI payment detection.
      if (!text) return null;
      const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
      const fullText = text;

      // ── AMOUNT: multi-strategy extraction ───────────────────────
      let amt = null;
      const amtCandidates = [];

      // Strategy 1: "Grand Total" / "Total" line — capture number on same line or next line
      // Handles: "Grand Total ₹40.00", "Grand Total  40.00", "Total: 40.00"
      const grandTotalRe = /grand\s*total[^\d₹]*(₹?\s*[0-9,]+(?:\.[0-9]{1,2})?)/gi;
      const totalRe = /(?:^|\n)[^\n]*?(?:net\s*total|sub\s*total|bill\s*total|total\s*amount|amount\s*payable|payable|total\s*due|total)[^\d₹]*(₹?\s*[0-9,]+(?:\.[0-9]{1,2})?)/gi;
      let m;
      while ((m = grandTotalRe.exec(fullText)) !== null) {
        const v = parseFloat(m[1].replace(/[₹,\s]/g, ''));
        if (v > 0 && v < MAX_AMT) amtCandidates.push({ v, priority: 10 });
      }
      while ((m = totalRe.exec(fullText)) !== null) {
        const v = parseFloat(m[1].replace(/[₹,\s]/g, ''));
        if (v > 0 && v < MAX_AMT) amtCandidates.push({ v, priority: 8 });
      }

      // Strategy 2: ₹ symbol directly followed by amount  e.g. "₹40.00" or "₹ 40.00"
      const rupeeRe = /₹\s*([0-9,]+(?:\.[0-9]{1,2})?)/g;
      while ((m = rupeeRe.exec(fullText)) !== null) {
        const v = parseFloat(m[1].replace(/,/g, ''));
        if (v > 0 && v < MAX_AMT) amtCandidates.push({ v, priority: 7 });
      }

      // Strategy 3: "Rs." / "INR" followed by amount
      const rsRe = /(?:rs\.?|inr)\s*([0-9,]+(?:\.[0-9]{1,2})?)/gi;
      while ((m = rsRe.exec(fullText)) !== null) {
        const v = parseFloat(m[1].replace(/,/g, ''));
        if (v > 0 && v < MAX_AMT) amtCandidates.push({ v, priority: 6 });
      }

      // Strategy 4: Per-line scan — last standalone number on lines containing "total"
      for (const line of lines) {
        if (/total|amount|payable/i.test(line)) {
          const nums = line.match(/[0-9,]+(?:\.[0-9]{1,2})?/g);
          if (nums) {
            const last = parseFloat(nums[nums.length - 1].replace(/,/g, ''));
            if (last > 0 && last < MAX_AMT) amtCandidates.push({ v: last, priority: 5 });
          }
        }
      }

      // Strategy 5: fallback — largest sensible number in the text
      if (amtCandidates.length === 0) {
        const anyRe = /([0-9,]{2,}(?:\.[0-9]{1,2})?)/g;
        while ((m = anyRe.exec(fullText)) !== null) {
          const v = parseFloat(m[1].replace(/,/g, ''));
          if (v >= 5 && v < MAX_AMT) amtCandidates.push({ v, priority: 1 });
        }
      }

      if (amtCandidates.length === 0) return null;
      // Pick highest priority, then largest value among tied priorities
      amtCandidates.sort((a, b) => b.priority - a.priority || b.v - a.v);
      amt = Math.round(amtCandidates[0].v * 100) / 100;
      if (!amt || amt <= 0) return null;

      // ── DATE: extract and normalise to "DD Mon" format ──────────
      let parsedDate = null;
      // Formats: 24/03/26, 24-03-2026, 2026-03-24, 24 Mar 2026, 24/03/2026
      const dateRe = /\b(\d{1,2})[\/-](\d{1,2})[\/-](\d{2,4})\b/;
      const dateMatch = fullText.match(dateRe);
      if (dateMatch) {
        const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
        let d = parseInt(dateMatch[1]), mo = parseInt(dateMatch[2]);
        // year in yy format: 26 → 2026
        const yr = parseInt(dateMatch[3]);
        const fullYr = yr < 100 ? 2000 + yr : yr;
        if (d >= 1 && d <= 31 && mo >= 1 && mo <= 12) {
          parsedDate = `${String(d).padStart(2,'0')} ${MONTHS[mo-1]}`;
        }
      }

      // ── MERCHANT: first meaningful line (not header noise) ───────
      let desc = '';
      // Skip lines that are clearly not merchant names
      const skipRe = /^(gst|gstin|fssai|invoice|receipt|tax|date:|time:|cashier|token|bill no|item|qty|price|amount|sub.?total|total|cash|change|paid|round|thank|www\.|http|@|\d{6,}|[\d\/\-]{6,})/i;
      const numberOnlyRe = /^[0-9₹%+\-\.\s,]+$/;
      for (const line of lines) {
        if (line.length >= 3 && line.length <= 60
            && !skipRe.test(line)
            && !numberOnlyRe.test(line)
            && !/^[A-Z0-9]{10,}$/.test(line)) { // skip GST numbers etc.
          desc = line;
          break;
        }
      }
      if (!desc) desc = 'Receipt';
      // Capitalise first letter
      desc = desc.charAt(0).toUpperCase() + desc.slice(1);

      // ── SOURCE: detect payment method from text ──────────────────
      let src = (S && S.addSrc) ? S.addSrc : null;
      if (!src) {
        const lct = fullText.toLowerCase();
        if (/paid\s*via\s*(other\s*\[?upi\]?|upi)|upi|gpay|phonepe|paytm|bhim|neft|imps/i.test(fullText)) src = 'upi';
        else if (/cash/i.test(fullText)) src = 'cash';
        else if (/card|visa|master|rupay|debit|credit/i.test(fullText)) src = 'others_upi';
        else src = 'upi'; // most Indian receipts default to UPI
      }

      // ── BUCKET: keyword-based detection ─────────────────────────
      const combined = (desc + ' ' + fullText).toLowerCase();
      let bkt = null;
      for (const [merchant, b] of Object.entries(AI_MERCHANT_MAP)) {
        if (combined.includes(merchant)) { bkt = b; break; }
      }
      if (!bkt) {
        const scores = { necessary: 0, committed: 0, comfortable: 0, luxury: 0 };
        for (const [b, kws] of Object.entries(AI_BKT_KEYWORDS)) {
          for (const kw of kws) { if (combined.includes(kw)) scores[b] += 1; }
        }
        const best = Object.entries(scores).sort((a, b2) => b2[1] - a[1])[0];
        if (best[1] > 0) bkt = best[0];
      }
      if (!bkt) bkt = 'comfortable'; // food/cafe receipts are mostly comfortable

      return { amt, desc, bkt, src, date: parsedDate };
    }

    function aiParseText(raw) {
      if (!raw || raw.trim().length < 2) return null;
      const text = raw.trim();

      // 1. Extract amount — look for number patterns
      let amt = null;
      const amtPatterns = [
        /(?:rs\.?|₹|inr)\s*([0-9,]+(?:\.[0-9]{1,2})?)/i,
        /([0-9,]+(?:\.[0-9]{1,2})?)\s*(?:rs\.?|₹|rupees?)/i,
        /^([0-9,]+(?:\.[0-9]{1,2})?)\s/,        // starts with number
        /\s([0-9,]+(?:\.[0-9]{1,2})?)$/,         // ends with number
        /([0-9,]+(?:\.[0-9]{1,2})?)/,             // any number
      ];
      for (const p of amtPatterns) {
        const m = text.match(p);
        if (m) { const v = parseFloat(m[1].replace(/,/g,'')); if (v > 0 && v < MAX_AMT) { amt = v; break; } }
      }
      if (!amt) return null;

      // 2. Extract description — remove amount and common filler words
      let desc = text
        .replace(/(?:rs\.?|₹|inr)\s*[0-9,]+(?:\.[0-9]{1,2})?/gi, '')
        .replace(/[0-9,]+(?:\.[0-9]{1,2})?\s*(?:rs\.?|₹|rupees?)/gi, '')
        .replace(/^[0-9,]+(?:\.[0-9]{1,2})?/, '')
        .replace(/[0-9,]+(?:\.[0-9]{1,2})?$/, '')
        .replace(/\b(spent|spend|paid|pay|on|for|at|to|towards|bought|purchase|today|yesterday|just|the|a|an)\b/gi, ' ')
        .replace(/\s+/g, ' ').trim();
      if (!desc) desc = 'Spend';
      // Title-case first letter
      desc = desc.charAt(0).toUpperCase() + desc.slice(1);

      // 3. Auto-categorize bucket — history lookup first
      const lower = text.toLowerCase();
      let bkt = null;
      let learnedFromHistory = false;
      let historyInfo = null;
      let suggestedTags = [];

      const historyMatch = _findHistoryMerchant(desc);
      if (historyMatch && historyMatch.confidence >= 2) {
        bkt = historyMatch.bkt;
        learnedFromHistory = true;
        historyInfo = historyMatch;
        // v6.13: was `historyMatch.confidence >= 2` guard on the bucket only —
        // tags were pulled in at ANY confidence including the loose word-overlap
        // tier (confidence 1), which is exactly what let an unrelated past
        // merchant's tags ride along (e.g. "coffee" overlapping a completely
        // different transaction that also happened to contain that word).
        // Tags now require the same >=2 (exact/substring) bar as the bucket.
        if (historyMatch.tags && historyMatch.tags.length > 0) {
          suggestedTags = [...new Set(historyMatch.tags)];
        }
      }

      // Fall back to merchant map
      if (!bkt) {
        for (const [merchant, b] of Object.entries(AI_MERCHANT_MAP)) {
          if (lower.includes(merchant)) { bkt = b; break; }
        }
      }
      // Then keyword scoring
      if (!bkt) {
        const scores = {necessary:0, committed:0, comfortable:0, luxury:0};
        for (const [b, kws] of Object.entries(AI_BKT_KEYWORDS)) {
          for (const kw of kws) { if (lower.includes(kw)) scores[b] += 1; }
        }
        const best = Object.entries(scores).sort((a,b)=>b[1]-a[1])[0];
        if (best[1] > 0) bkt = best[0];
      }
      if (!bkt) bkt = 'necessary'; // safe default

      // 4. Source — use last used, default to upi
      const src = (S && S.addSrc) || (D && D.lastSrc) || 'upi';

      return { amt, desc, bkt, src, suggestedTags, learnedFromHistory, historyInfo };
    }

    function aiReaction(amt, desc, bkt, transactions) {
      const txns = transactions || [];
      const lower = (desc || '').toLowerCase();
      const now = new Date();
      const hour = now.getHours();
      const currentMonth = offsetMonthStr(0);
      const monthTxns = txns.filter(t => t.month === currentMonth);

      // Pattern 0: merchant frequency alert (IMP-3)
      const freqAlert = _merchantFreqAlert(desc, txns);
      if (freqAlert) return freqAlert;

      // Pattern 1: same merchant this week
      const weekAgo = Date.now() - WEEK_MS;
      const sameRecent = txns.filter(t =>
        t.merchant && t.merchant.toLowerCase() === lower &&
        new Date(t.timestamp).getTime() > weekAgo
      ).length;
      if (sameRecent >= 2 && lower.length > 2) {
        const emoji = ico(desc);
        return `${emoji} ${desc} — ${sameRecent + 1}rd time this week!`;
      }

      // Pattern 2: biggest spend this month
      const monthAmts = monthTxns.map(t => t.amount);
      if (monthAmts.length > 0 && amt > Math.max(...monthAmts)) {
        return `Biggest spend this month — hope it was worth it! 🎯`;
      }

      // Pattern 3: late night
      if (hour >= 22 || hour < 4) {
        return `Late night ₹${amt.toLocaleString('en-IN')} logged 🌙`;
      }

      // Pattern 4: under budget
      if (bkt && D.limits && D.limits[bkt] > 0) {
        const spent = monthTxns.filter(t => t.bucket === bkt).reduce((s,t) => s + t.amount, 0);
        const lim = D.limits[bkt];
        if (spent + amt < lim * 0.5) {
          return `Nice — well within your ${BUCKETS[bkt]?.l || bkt} budget 👏`;
        }
      }

      // Pattern 5: first spend today
      const today = String(now.getDate()).padStart(2,'0') + ' ' + MONTH_ABBR[now.getMonth()];
      const todayTxns = txns.filter(t => t.date === today);
      if (todayTxns.length === 0) {
        return `First spend of the day logged ✓`;
      }

      // Pattern 6: round number
      if (amt % 500 === 0 && amt >= 500) {
        return `₹${amt.toLocaleString('en-IN')} — a satisfyingly round number 😄`;
      }

      // Default
      return `₹${amt.toLocaleString('en-IN')} saved to ${BUCKETS[bkt]?.l || bkt} ✓`;
    }

    function aiCheckMirror() {
      const txns = D.transactions || [];
      const limits = D.limits || {};
      // Check last 3 months for consecutive overruns
      for (const bk of Object.keys(BUCKETS)) {
        if (!limits[bk] || limits[bk] <= 0) continue;
        let streak = 0;
        for (let i = 1; i <= 4; i++) {
          const m = offsetMonthStr(-i);
          const spent = txns.filter(t=>t.month===m&&t.bucket===bk).reduce((s,t)=>s+t.amount,0);
          if (spent > limits[bk]) streak++; else break;
        }
        if (streak >= 2) {
          // Check we haven't shown this recently
          const shown = (() => { try { return JSON.parse(localStorage.getItem('sn_mirror_shown')||'{}'); } catch(e) { return {}; } })();
          const thisMonth = offsetMonthStr(0);
          if (shown[bk] === thisMonth) continue;
          const newLimit = Math.round(limits[bk] * 1.3 / 100) * 100; // round to nearest 100
          AI.mirrorBucket = bk;
          AI.mirrorNewLimit = newLimit;
          return {
            bk,
            text: `You've set a ${fmtF(limits[bk])} limit for ${BUCKETS[bk].l} but crossed it ${streak} months in a row. Want to set it to ${fmtF(newLimit)} and actually feel in control?`,
            newLimit
          };
        }
      }
      return null;
    }

    function aiShowConfirm(parsed) {
      // OCR-FIX-002: fill date field, call valAdd() to enable Save button
      if (!parsed) return;
      AI.parsed = parsed;
      const card = document.getElementById('aiConfirmCard');
      const saveBtn = document.getElementById('aiSaveBtn');
      if (!card) return;
      const cfAmt = document.getElementById('aiCfAmt');
      const cfDesc = document.getElementById('aiCfDesc');
      const cfBkt = document.getElementById('aiCfBkt');
      const cfSrc = document.getElementById('aiCfSrc');
      if (cfAmt) cfAmt.textContent = '₹' + parsed.amt.toLocaleString('en-IN');
      if (cfDesc) cfDesc.textContent = parsed.desc;

      // Show learned badge on bucket chip
      let bktLabel = BUCKETS[parsed.bkt] ? BUCKETS[parsed.bkt].g + ' ' + BUCKETS[parsed.bkt].l : parsed.bkt;
      if (parsed.learnedFromHistory) {
        bktLabel += ' <span style="font-size:10px;font-weight:700;color:var(--teal);background:var(--tealL);padding:2px 6px;border-radius:8px;margin-left:4px">✦ learned</span>';
        if (cfBkt) cfBkt.innerHTML = bktLabel;
      } else {
        if (cfBkt) cfBkt.textContent = bktLabel;
      }

      const srcObj = SRCS.find(s => s.k === parsed.src);
      if (cfSrc) cfSrc.textContent = srcObj ? srcObj.i + ' ' + srcObj.l : parsed.src;
      card.style.display = 'block';
      if (saveBtn) saveBtn.style.display = 'block';
      // Pre-fill manual form fields
      const amtEl = document.getElementById('addAmt');
      const descEl = document.getElementById('addDesc');
      const dateEl = document.getElementById('addDate');
      if (amtEl) amtEl.value = parsed.amt;
      if (descEl) descEl.value = parsed.desc;
      // Fill date if extracted from receipt — OCR-FIX-002
      if (dateEl && parsed.date) dateEl.value = parsed.date;
      // Show date row in confirm card if date was extracted
      const cfDateRow = document.getElementById('aiCfDateRow');
      const cfDate = document.getElementById('aiCfDate');
      if (cfDateRow && cfDate) {
        if (parsed.date) { cfDate.textContent = parsed.date; cfDateRow.style.display = 'flex'; }
        else { cfDateRow.style.display = 'none'; }
      }

      // Auto-apply learned tags from history
      if (parsed.suggestedTags && parsed.suggestedTags.length > 0) {
        for (const tag of parsed.suggestedTags) {
          if (!_addTags.includes(tag)) _addTags.push(tag);
        }
        if (APP.renderAddTagChips) APP.renderAddTagChips();
      }

      // Show history info in status (IMP-4: smart amount suggest + learned badge)
      const status = document.getElementById('aiStatus');
      const lastAmt = _getLastAmount(parsed.desc);
      if (status && parsed.learnedFromHistory && parsed.historyInfo) {
        const count = (D && D.transactions ? D.transactions.filter(t => t.merchant && t.merchant.toLowerCase() === parsed.desc.toLowerCase()).length : 0);
        const learnedMsg = count > 0
          ? `✦ Learned from your history (${count} record${count>1?'s':''})`
          : '✦ Learned from your history';
        const amtHint = lastAmt && lastAmt !== parsed.amt ? ` · Last time: ${fmtF(lastAmt)}` : '';
        status.textContent = learnedMsg + amtHint;
      } else if (status && lastAmt && lastAmt !== parsed.amt) {
        status.textContent = `Last time at ${parsed.desc}: ${fmtF(lastAmt)}`;
      }

      APP.selBkt(parsed.bkt);
      APP.selSrc(parsed.src);
      // Enable the Save button — OCR-FIX-003: valAdd() was never called after pre-fill
      if (APP.valAdd) APP.valAdd();
    }

    function aiClear() {
      AI.parsed = null;
      const card = document.getElementById('aiConfirmCard');
      const saveBtn = document.getElementById('aiSaveBtn');
      const status = document.getElementById('aiStatus');
      if (card) card.style.display = 'none';
      if (saveBtn) saveBtn.style.display = 'none';
      if (status) status.textContent = '';
    }

