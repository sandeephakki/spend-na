    // ════════════════════════════════════════════════════════════════
    //  BAL — js/bal/common/merchant-matching.js
    //  Extracted verbatim from js/app.js (batch 6 — see
    //  spend-na-restructure.md). Plain classic script, same global
    //  scope as app.js. Loaded before app.js. No logic changes.
    //  DEVIATION FROM PLAN: kept _computeNormalizeConflicts here
    //  instead of duplicate-detection.js — it's tightly coupled to
    //  _levenshtein/_normMerchantKey right above it (calls both
    //  directly), and splitting a single contiguous, interdependent
    //  block across two files for a naming-convention reason alone
    //  added risk without real benefit. checkDuplicate (the actually
    //  distinct duplicate-detection concern) still went to its own
    //  file below. Flagging per restructure doc's report-back rule.
    // ════════════════════════════════════════════════════════════════

    let _merchantIndex = null;
    function _getMerchantIndex() {
      if (_merchantIndex) return _merchantIndex;
      _merchantIndex = {};
      for (const t of (D && D.transactions ? D.transactions : [])) {
        if (!t.merchant) continue;
        const k = t.merchant.toLowerCase();
        if (!_merchantIndex[k]) _merchantIndex[k] = t;
      }
      return _merchantIndex;
    }
    function _invalidateMerchantIndex() { _merchantIndex = null; }

    // ── MN-01: MERCHANT NAME NORMALISATION ────────────────────────────
    // Small Levenshtein distance — good enough for short merchant strings
    function _levenshtein(a, b) {
      a = a || ''; b = b || '';
      if (a === b) return 0;
      const m = a.length, n = b.length;
      if (m === 0) return n;
      if (n === 0) return m;
      let prev = Array.from({ length: n + 1 }, (_, i) => i);
      for (let i = 1; i <= m; i++) {
        const cur = [i];
        for (let j = 1; j <= n; j++) {
          cur[j] = a[i - 1] === b[j - 1]
            ? prev[j - 1]
            : 1 + Math.min(prev[j - 1], prev[j], cur[j - 1]);
        }
        prev = cur;
      }
      return prev[n];
    }
    // ═══════════════════════════════════════════════════
    // NORMALIZE — v6.4
    // Finds records that SHOULD be treated the same but aren't:
    // (1) same tag, different bucket (e.g. #coffee sometimes Necessary,
    //     sometimes Comfortable — the user's own example)
    // (2) same/near-identical merchant name, different bucket
    // (3) near-identical merchant spelling (e.g. "Maiyya Coffee" vs
    //     "Maiyas Coffee" — a typo, not two different places)
    // Returns a flat list of conflict groups; nothing is written to D until
    // the user reviews and confirms in r_normalize()/applyNormalize().
    // ═══════════════════════════════════════════════════
    function _normMerchantKey(s) { return (s || '').toLowerCase().trim().replace(/\s+/g, ' '); }

    function _computeNormalizeConflicts() {
      const txns = (D.transactions || []).filter(t => t.merchant);
      const conflicts = [];

      // ---- PASS 1: TAG GROUPS — same tag, different bucket ----
      const byTag = {};
      txns.forEach(t => {
        (t.tags || []).forEach(tag => {
          if (!byTag[tag]) byTag[tag] = [];
          byTag[tag].push(t);
        });
      });
      Object.entries(byTag).forEach(([tag, group]) => {
        if (group.length < 2) return;
        const bucketCounts = {};
        group.forEach(t => { const b = t.bucket || '(unsorted)'; bucketCounts[b] = (bucketCounts[b] || 0) + 1; });
        if (Object.keys(bucketCounts).length < 2) return; // all agree — not a conflict
        const sorted = Object.entries(bucketCounts).sort((a, b) => b[1] - a[1]);
        conflicts.push({
          type: 'tag-bucket',
          label: `#${tag}`,
          field: 'bucket',
          txnIds: group.map(t => t.id),
          options: sorted.map(([v, c]) => ({ value: v, count: c })),
          recommended: sorted[0][0]
        });
      });

      // ---- PASS 2: MERCHANT FUZZY CLUSTERS ----
      // Greedy clustering: same idea as _suggestMerchantName below, applied
      // across the whole dataset instead of one freshly-typed name at a time.
      const uniqueMerchants = [...new Set(txns.map(t => _normMerchantKey(t.merchant)))];
      const clusters = [];
      uniqueMerchants.forEach(name => {
        let found = null;
        for (const c of clusters) {
          if (c.some(rep => rep === name || (_levenshtein(rep, name) <= 2 && Math.min(rep.length, name.length) > 3))) {
            found = c; break;
          }
        }
        if (found) found.push(name);
        else clusters.push([name]);
      });

      clusters.forEach(reps => {
        const members = txns.filter(t => reps.includes(_normMerchantKey(t.merchant)));
        if (members.length < 2) return;

        // (2a) spelling conflict — more than one distinct spelling in this cluster
        const nameCounts = {};
        members.forEach(t => { const nm = t.merchant.trim(); nameCounts[nm] = (nameCounts[nm] || 0) + 1; });
        const distinctNames = Object.keys(nameCounts);
        if (distinctNames.length > 1) {
          const sorted = Object.entries(nameCounts).sort((a, b) => b[1] - a[1]);
          conflicts.push({
            type: 'merchant-name',
            label: distinctNames.join(' / '),
            field: 'merchant',
            txnIds: members.map(t => t.id),
            options: sorted.map(([v, c]) => ({ value: v, count: c })),
            recommended: sorted[0][0]
          });
        }

        // (2b) bucket conflict within this merchant cluster
        const bucketCounts = {};
        members.forEach(t => { const b = t.bucket || '(unsorted)'; bucketCounts[b] = (bucketCounts[b] || 0) + 1; });
        if (Object.keys(bucketCounts).length > 1) {
          const sorted = Object.entries(bucketCounts).sort((a, b) => b[1] - a[1]);
          conflicts.push({
            type: 'merchant-bucket',
            label: distinctNames[0] || reps[0],
            field: 'bucket',
            txnIds: members.map(t => t.id),
            options: sorted.map(([v, c]) => ({ value: v, count: c })),
            recommended: sorted[0][0]
          });
        }

        // (2c) tag conflict — using each record's first/primary tag as the
        // representative value (keeps this simple rather than diffing full sets)
        const tagCounts = {};
        members.forEach(t => { const tg = (t.tags && t.tags[0]) || '(none)'; tagCounts[tg] = (tagCounts[tg] || 0) + 1; });
        if (Object.keys(tagCounts).length > 1) {
          const sorted = Object.entries(tagCounts).sort((a, b) => b[1] - a[1]);
          conflicts.push({
            type: 'merchant-tag',
            label: distinctNames[0] || reps[0],
            field: 'tag',
            txnIds: members.map(t => t.id),
            options: sorted.map(([v, c]) => ({ value: v, count: c })),
            recommended: sorted[0][0]
          });
        }
      });

      return conflicts;
    }

    // Suggest a canonical merchant name for a freshly-typed one.
    // Ignores exact matches (distance 0) and merchants with < 3 uses (merchantNorm gotcha).
    function _suggestMerchantName(typed) {
      const t = (typed || '').trim();
      if (t.length < 3) return null;
      const tLower = t.toLowerCase();
      const counts = {};
      (D.transactions || []).forEach(x => {
        const m = (x.merchant || '').trim();
        if (!m) return;
        const k = m.toLowerCase();
        counts[k] = counts[k] || { name: m, count: 0 };
        counts[k].count++;
      });
      let best = null, bestDist = Infinity;
      Object.keys(counts).forEach(k => {
        if (k === tLower) return; // exact match — nothing to suggest
        if (counts[k].count < 3) return; // not established enough to trust
        const dist = _levenshtein(tLower, k);
        if (dist > 0 && dist <= 2 && dist < bestDist) { bestDist = dist; best = counts[k].name; }
      });
      return best;
    }

    function _findHistoryMerchant(desc) {
      if (!desc || !D || !D.transactions || D.transactions.length === 0) return null;
      const needle = desc.toLowerCase().trim();
      if (needle.length < 2) return null;

      let best = null;

      const txns = D.transactions;
      for (const t of txns) {
        if (!t.merchant || !t.bucket) continue;
        const hay = t.merchant.toLowerCase().trim();
        let confidence = 0;

        if (hay === needle) {
          confidence = 3; // exact match
        } else if ((hay.includes(needle) || needle.includes(hay)) && Math.min(hay.length, needle.length) >= 4) {
          // v6.13: added the length guard — without it, a short past merchant
          // name (or a short voice-transcribed desc) could substring-match
          // something completely unrelated purely by coincidence, and pull in
          // that unrelated transaction's entire tag set along with it.
          confidence = 2; // substring match
        } else {
          // word overlap
          const needleWords = needle.split(/\s+/).filter(w => w.length > 2);
          const hayWords = hay.split(/\s+/).filter(w => w.length > 2);
          const overlap = needleWords.filter(w => hayWords.includes(w)).length;
          if (overlap > 0) confidence = 1;
        }

        if (confidence > 0) {
          if (!best || confidence > best.confidence) {
            best = { bkt: t.bucket, confidence, matchedDesc: t.merchant, tags: t.tags || [] };
          }
          if (best.confidence === 3) break; // exact — no need to continue
        }
      }

      return best;
    }

    // ── SMART SEARCH SYNONYMS ──────────────────────────────────────
    const SEARCH_SYNONYMS = {
      food: ['swiggy','zomato','restaurant','cafe','lunch','dinner','breakfast','chai','coffee','meals','dhaba'],
      travel: ['uber','ola','rapido','auto','petrol','fuel','bus','train','flight','cab','taxi','toll'],
      medical: ['apollo','medical','pharmacy','chemist','hospital','doctor','clinic','medicine'],
      shopping: ['amazon','flipkart','myntra','ajio','meesho','zepto','blinkit','instamart'],
      bills: ['electricity','wifi','broadband','mobile','recharge','gas','water','society'],
      kids: ['school','fees','tuition','books','uniform','stationery'],
      entertainment: ['netflix','hotstar','prime','spotify','youtube','movie','theatre'],
      groceries: ['vegetables','fruits','kirana','supermarket','dmart','reliance','bigbazaar'],
    };
    function expandSearchQuery(q) {
      if (!getAIConfig().smartSearch || !q) return [q.toLowerCase()];
      const lower = q.toLowerCase().trim();
      const terms = new Set([lower]);
      Object.entries(SEARCH_SYNONYMS).forEach(([key, synonyms]) => {
        const allTerms = [key, ...synonyms];
        if (allTerms.some(t => t.includes(lower) || lower.includes(t)))
          allTerms.forEach(t => terms.add(t));
      });
      return [...terms];
    }

    function _merchantFreqAlert(desc, transactions) {
      if (!desc || desc.length < 2) return null;
      const lower = desc.toLowerCase();
      const weekAgo = Date.now() - WEEK_MS;
      const recent = (transactions || []).filter(t =>
        t.merchant && t.merchant.toLowerCase() === lower &&
        new Date(t.timestamp).getTime() > weekAgo
      );
      const count = recent.length + 1; // +1 = current save
      if (count >= 3) {
        const ordinal = count === 3 ? '3rd' : count === 4 ? '4th' : count === 5 ? '5th' : `${count}th`;
        return `${ico(desc)} ${ordinal} time at ${desc} this week 👀`;
      }
      return null;
    }
