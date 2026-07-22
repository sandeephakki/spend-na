    // ════════════════════════════════════════════════════════════════
    //  SPEND-NA v5.1  © 2026 Sandeep Hakki · hakki.in
    //  MASTER MERGE: v5.0a UI Revolution + v5.0b Data Architecture
    //  Schema v2 · FLAGS · SHARD · SW sn-v5 · ZIP backup · Annual Wrap
    // ════════════════════════════════════════════════════════════════

    const BUCKETS = {
      necessary: { l: 'Necessary', t: 'Food · Health · Rent', c: '#10b981', cl: '#ecfdf5', cm: '#6ee7b7', g: '⌂' },
      committed: { l: 'Committed', t: 'EMI · Insurance · SIP', c: '#6366f1', cl: '#eef2ff', cm: '#a5b4fc', g: '◈' },
      comfortable: { l: 'Comfortable', t: 'Lifestyle · Shopping', c: '#f59e0b', cl: '#fffbeb', cm: '#fde68a', g: '◎' },
      luxury: { l: 'Luxury', t: 'Splurge · Dining out', c: '#f43f5e', cl: '#fff1f2', cm: '#fda4af', g: '◆' },
    };
    const ROLES = {
      student: { l: 'Student', e: '🎓', lim: { necessary: 3000, committed: 0, comfortable: 2000, luxury: 1000 } },
      home_manager: { l: 'Home Manager', e: '🏠', lim: { necessary: 15000, committed: 5000, comfortable: 5000, luxury: 2000 } },
      working: { l: 'Working Professional', e: '💼', lim: { necessary: 15000, committed: 30000, comfortable: 10000, luxury: 5000 } },
      business: { l: 'Business Owner', e: '🏢', lim: { necessary: 20000, committed: 20000, comfortable: 15000, luxury: 10000 } },
      retired: { l: 'Retired', e: '🌿', lim: { necessary: 10000, committed: 5000, comfortable: 8000, luxury: 3000 } },
    };
    const SRCS = [
      { k: 'cash', l: 'Cash', i: '₹' },
      { k: 'upi', l: 'Own UPI', i: 'U' },
      { k: 'others_upi', l: "Others'", i: 'O' },
      { k: 'hand_loan', l: 'Hand Loan', i: 'L' },
    ];
    const ICONS = [
      { kw: ['food', 'meal', 'lunch', 'dinner', 'breakfast', 'restaurant', 'cafe', 'canteen', 'hotel', 'pizza', 'burger', 'tiffin', 'dabba', 'dhaba', 'sweets', 'snack', 'zomato', 'swiggy', 'blinkit', 'mess'], i: '🍽' },
      { kw: ['grocery', 'groceries', 'vegetable', 'fruit', 'milk', 'dairy', 'kirana', 'supermarket', 'mart', 'bazaar', 'bigbasket', 'jiomart'], i: '🛒' },
      { kw: ['cab', 'taxi', 'ride', 'auto', 'rickshaw', 'bus', 'train', 'metro', 'ola', 'uber', 'rapido', 'irctc', 'flight'], i: '🚗' },
      { kw: ['fuel', 'petrol', 'diesel', 'cng', 'pump', 'bpcl', 'hp', 'shell', 'iocl'], i: '⛽' },
      { kw: ['medical', 'medicine', 'pharmacy', 'hospital', 'clinic', 'doctor', 'health', 'chemist', 'lab', 'apollo', 'medplus'], i: '💊' },
      { kw: ['shopping', 'clothes', 'shirt', 'pant', 'shoes', 'dress', 'saree', 'kurta', 'fashion', 'myntra', 'amazon', 'flipkart'], i: '🛍' },
      { kw: ['electricity', 'power', 'water', 'gas', 'bill', 'utility', 'recharge', 'mobile', 'broadband', 'internet', 'wifi', 'airtel', 'jio'], i: '⚡' },
      { kw: ['school', 'college', 'tuition', 'coaching', 'course', 'fees', 'exam', 'education'], i: '📚' },
      { kw: ['movie', 'cinema', 'theatre', 'show', 'event', 'concert', 'game', 'entertainment', 'netflix', 'hotstar'], i: '🎬' },
      { kw: ['emi', 'loan', 'insurance', 'premium', 'lic', 'sip', 'mutual', 'investment', 'fd', 'bank', 'credit'], i: '🏦' },
      { kw: ['rent', 'maintenance', 'society', 'flat', 'house', 'room', 'pg'], i: '🏠' },
      { kw: ['salon', 'spa', 'haircut', 'beauty', 'gym', 'fitness', 'yoga', 'wellness'], i: '💇' },
    ];

    // ── PRESET TAGS ───────────────────────────────────────────────
    const PRESET_TAGS = [
      'Food', 'Function', 'Travel', 'Medical',
      'Education', 'Festival', 'Vehicle', 'Gift'
    ];

    // ── TAG REGISTRY — dynamic tag persistence ────────────────────────
    const TAG_REGISTRY_KEY = 'sn_tag_registry';
    const TAG_PRUNE_DAYS = 90;
    // LW-03: named constants replacing magic numbers
    const MS_PER_DAY = 86400000;
    const TAG_PRUNE_MS = TAG_PRUNE_DAYS * MS_PER_DAY;
    const WEEK_MS = 7 * MS_PER_DAY;
    const MAX_AMT = 9999999;
    const BUDGET_WARN_PCT = 0.8;


    function _loadTagRegistry() {
      try {
        const raw = localStorage.getItem(TAG_REGISTRY_KEY);
        if (!raw) return { tags: [] };
        return JSON.parse(raw);
      } catch(e) { return { tags: [] }; }
    }

    function _saveTagRegistry(registry) {
      try { localStorage.setItem(TAG_REGISTRY_KEY, JSON.stringify(registry)); } catch(e) { console.warn("[catch]", e); }
    }

    function recordTagUsage(tagName) {
      if (!tagName || PRESET_TAGS.includes(tagName)) return; // presets don't need tracking
      const registry = _loadTagRegistry();
      const now = Date.now();
      const existing = registry.tags.find(t => t.name === tagName);
      if (existing) {
        existing.lastUsed = now;
        existing.useCount = (existing.useCount || 1) + 1;
      } else {
        registry.tags.push({ name: tagName, lastUsed: now, useCount: 1 });
      }
      _saveTagRegistry(registry);
    }

    function pruneOldTags() {
      const registry = _loadTagRegistry();
      const cutoff = Date.now() - TAG_PRUNE_MS;
      registry.tags = registry.tags.filter(t => (t.lastUsed || 0) >= cutoff);
      _saveTagRegistry(registry);
    }

    let _tagsPruned = false; // MQ-02: prune once per session
    function getDynamicTagList() {
      if (!_tagsPruned) { pruneOldTags(); _tagsPruned = true; } // MQ-02
      const registry = _loadTagRegistry();
      // Sort custom tags by recency
      const customTags = registry.tags
        .sort((a, b) => (b.lastUsed || 0) - (a.lastUsed || 0))
        .map(t => t.name)
        .filter(n => !PRESET_TAGS.includes(n));
      return [...PRESET_TAGS, ...customTags];
    }

    function migrateTagsToRegistry() {
      // Run once: scan all transactions and seed registry with existing custom tags
      const registry = _loadTagRegistry();
      if (registry._migrated) return;
      const now = Date.now();
      const txns = (D && D.transactions) ? D.transactions : [];
      for (const t of txns) {
        if (!t.tags) continue;
        for (const tag of t.tags) {
          if (PRESET_TAGS.includes(tag)) continue;
          const existing = registry.tags.find(r => r.name === tag);
          if (existing) {
            existing.useCount = (existing.useCount || 1) + 1;
          } else {
            registry.tags.push({ name: tag, lastUsed: now, useCount: 1 });
          }
        }
      }
      registry._migrated = true;
      _saveTagRegistry(registry);
    }

    const LS = 'sn_v4';

    // ── AI CONFIG SYSTEM ──────────────────────────────────────────
    const AI_CONFIG_DEFAULT = {
      insight: true, forecast: true, streak: true,
      voice: true, reactions: true, mood: true, duplicate: true,
      whyBuyThis: true, smartSearch: true,
      story: true, mirror: true, spendTwin: true,
      weeklyDigest: true, budgetSuggest: true,
      paydayMode: true, guiltFree: true, monthEndWarn: true,
      merchantNorm: true, // MN-01
    };
    function getAIConfig() {
      try {
        const saved = JSON.parse(localStorage.getItem('sn_ai_config') || 'null');
        return Object.assign({}, AI_CONFIG_DEFAULT, saved || {});
      } catch(e) { return { ...AI_CONFIG_DEFAULT }; }
    }
    function saveAIConfig(cfg) {
      try { localStorage.setItem('sn_ai_config', JSON.stringify(cfg)); } catch(e) { console.warn("[catch]", e); }
    }

    // ── STORAGE GUARD ─────────────────────────────────────────────
    function isStorageAvailable() {
      try { localStorage.setItem('_sn_test', '1'); localStorage.removeItem('_sn_test'); return true; }
      catch (e) { return false; }
    }

    // ── MD5 ────────────────────────────────────────────────────────
    function md5(s) {
      function sa(x, y) { const l = (x & 0xFFFF) + (y & 0xFFFF), m = (x >> 16) + (y >> 16) + (l >> 16); return (m << 16) | (l & 0xFFFF) }
      function rl(n, c) { return (n << c) | (n >>> (32 - c)) }
      function cm(q, a, b, x, s, t) { return sa(rl(sa(sa(a, q), sa(x, t)), s), b) }
      const ff = (a, b, c, d, x, s, t) => cm((b & c) | ((~b) & d), a, b, x, s, t);
      const gg = (a, b, c, d, x, s, t) => cm((b & d) | (c & (~d)), a, b, x, s, t);
      const hh = (a, b, c, d, x, s, t) => cm(b ^ c ^ d, a, b, x, s, t);
      const ii = (a, b, c, d, x, s, t) => cm(c ^ (b | (~d)), a, b, x, s, t);
      const str = unescape(encodeURIComponent(s));
      const by = []; for (let i = 0; i < str.length; i++)by.push(str.charCodeAt(i));
      by.push(0x80); while (by.length % 64 !== 56) by.push(0);
      const lo = str.length * 8; by.push(lo & 0xFF, (lo >> 8) & 0xFF, (lo >> 16) & 0xFF, (lo >> 24) & 0xFF, 0, 0, 0, 0);
      let a = 0x67452301, b = 0xEFCDAB89, c = 0x98BADCFE, d = 0x10325476;
      for (let i = 0; i < by.length; i += 64) {
        const M = []; for (let j = 0; j < 16; j++)M[j] = by[i + j * 4] | (by[i + j * 4 + 1] << 8) | (by[i + j * 4 + 2] << 16) | (by[i + j * 4 + 3] << 24);
        const [A, B, C, D] = [a, b, c, d];
        a = ff(a, b, c, d, M[0], 7, -680876936); d = ff(d, a, b, c, M[1], 12, -389564586); c = ff(c, d, a, b, M[2], 17, 606105819); b = ff(b, c, d, a, M[3], 22, -1044525330);
        a = ff(a, b, c, d, M[4], 7, -176418897); d = ff(d, a, b, c, M[5], 12, 1200080426); c = ff(c, d, a, b, M[6], 17, -1473231341); b = ff(b, c, d, a, M[7], 22, -45705983);
        a = ff(a, b, c, d, M[8], 7, 1770035416); d = ff(d, a, b, c, M[9], 12, -1958414417); c = ff(c, d, a, b, M[10], 17, -42063); b = ff(b, c, d, a, M[11], 22, -1990404162);
        a = ff(a, b, c, d, M[12], 7, 1804603682); d = ff(d, a, b, c, M[13], 12, -40341101); c = ff(c, d, a, b, M[14], 17, -1502002290); b = ff(b, c, d, a, M[15], 22, 1236535329);
        a = gg(a, b, c, d, M[1], 5, -165796510); d = gg(d, a, b, c, M[6], 9, -1069501632); c = gg(c, d, a, b, M[11], 14, 643717713); b = gg(b, c, d, a, M[0], 20, -373897302);
        a = gg(a, b, c, d, M[5], 5, -701558691); d = gg(d, a, b, c, M[10], 9, 38016083); c = gg(c, d, a, b, M[15], 14, -660478335); b = gg(b, c, d, a, M[4], 20, -405537848);
        a = gg(a, b, c, d, M[9], 5, 568446438); d = gg(d, a, b, c, M[14], 9, -1019803690); c = gg(c, d, a, b, M[3], 14, -187363961); b = gg(b, c, d, a, M[8], 20, 1163531501);
        a = gg(a, b, c, d, M[13], 5, -1444681467); d = gg(d, a, b, c, M[2], 9, -51403784); c = gg(c, d, a, b, M[7], 14, 1735328473); b = gg(b, c, d, a, M[12], 20, -1926607734);
        a = hh(a, b, c, d, M[5], 4, -378558); d = hh(d, a, b, c, M[8], 11, -2022574463); c = hh(c, d, a, b, M[11], 16, 1839030562); b = hh(b, c, d, a, M[14], 23, -35309556);
        a = hh(a, b, c, d, M[1], 4, -1530992060); d = hh(d, a, b, c, M[4], 11, 1272893353); c = hh(c, d, a, b, M[7], 16, -155497632); b = hh(b, c, d, a, M[10], 23, -1094730640);
        a = hh(a, b, c, d, M[13], 4, 681279174); d = hh(d, a, b, c, M[0], 11, -358537222); c = hh(c, d, a, b, M[3], 16, -722521979); b = hh(b, c, d, a, M[6], 23, 76029189);
        a = hh(a, b, c, d, M[9], 4, -640364487); d = hh(d, a, b, c, M[12], 11, -421815835); c = hh(c, d, a, b, M[15], 16, 530742520); b = hh(b, c, d, a, M[2], 23, -995338651);
        a = ii(a, b, c, d, M[0], 6, -198630844); d = ii(d, a, b, c, M[7], 10, 1126891415); c = ii(c, d, a, b, M[14], 15, -1416354905); b = ii(b, c, d, a, M[5], 21, -57434055);
        a = ii(a, b, c, d, M[12], 6, 1700485571); d = ii(d, a, b, c, M[3], 10, -1894986606); c = ii(c, d, a, b, M[10], 15, -1051523); b = ii(b, c, d, a, M[1], 21, -2054922799);
        a = ii(a, b, c, d, M[8], 6, 1873313359); d = ii(d, a, b, c, M[15], 10, -30611744); c = ii(c, d, a, b, M[6], 15, -1560198380); b = ii(b, c, d, a, M[13], 21, 1309151649);
        a = ii(a, b, c, d, M[4], 6, -145523070); d = ii(d, a, b, c, M[11], 10, -1120210379); c = ii(c, d, a, b, M[2], 15, 718787259); b = ii(b, c, d, a, M[9], 21, -343485551);
        a = sa(a, A); b = sa(b, B); c = sa(c, C); d = sa(d, D);
      }
      const h = n => [n & 0xFF, (n >> 8) & 0xFF, (n >> 16) & 0xFF, (n >> 24) & 0xFF].map(x => (x < 16 ? '0' : '') + x.toString(16)).join('');
      return [a, b, c, d].map(h).join('');
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // ITEM 1 — SCHEMA VERSION
    // v1 = prod baseline (no tags, no focusMode, no lastSrc)
    // v2 = QA/prod master (tags[], focusMode, lastSrc, sources)
    // Bump SCHEMA_VERSION whenever new required fields are added.
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    const SCHEMA_VERSION = 2;

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // ITEM 2 — v1 → v2 MIGRATION FUNCTION
    // Called on every load (localStorage + file import).
    // Only operates in memory — user must Save to persist.
    // Never renames keys. Never deletes data. Only adds defaults.
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    function migrateData(d) {
      if (!d || typeof d !== 'object') return d;
      const sv = d.schemaVersion || 1;
      if (sv >= SCHEMA_VERSION) return d;

      // settings backfill
      if (!d.settings) d.settings = {};
      if (typeof d.settings.notif     === 'undefined') d.settings.notif     = false;
      if (typeof d.settings.focusMode === 'undefined') d.settings.focusMode = false;

      // profile backfill
      if (!d.profile) d.profile = {};
      if (typeof d.profile.dob   === 'undefined') d.profile.dob   = '';
      if (typeof d.profile.city  === 'undefined') d.profile.city  = '';
      if (typeof d.profile.quote === 'undefined') d.profile.quote = '';
      if (typeof d.profile.role  === 'undefined') d.profile.role  = 'working';

      // top-level backfill
      if (typeof d.lastSrc === 'undefined') d.lastSrc = null;

      // limits backfill
      if (!d.limits) d.limits = {};
      if (typeof d.limits.necessary   === 'undefined') d.limits.necessary   = 15000;
      if (typeof d.limits.committed   === 'undefined') d.limits.committed   = 30000;
      if (typeof d.limits.comfortable === 'undefined') d.limits.comfortable = 10000;
      if (typeof d.limits.luxury      === 'undefined') d.limits.luxury      = 5000;

      // transaction-level backfill — tags is the most common v1 gap
      if (Array.isArray(d.transactions)) {
        d.transactions = d.transactions.map(t => ({
          ...t,
          tags:   Array.isArray(t.tags) ? t.tags : [],
          source: t.source || null,
          bucket: t.bucket || null,
        }));
      }

      d.schemaVersion = SCHEMA_VERSION;
      try { console.info('[Spend-na] Migrated schema v' + sv + ' → v' + SCHEMA_VERSION); } catch {}
      return d;
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // ITEM 3 — FEATURE FLAGS  (localStorage key: sn_flags)
    // All flags default ON for new users, safe defaults for old.
    // Use FLAGS.get('key') in any condition.
    // Use FLAGS.set('key', bool) to toggle.
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    const FLAG_DEFAULTS = {
      ai_features:    true,
      sources_screen: true,
      tags_system:    true,
      beta_ui:        false,
      data_sharding:  false,
    };
    const FLAGS = (() => {
      const LF = 'sn_flags';
      const _r = () => { try { return JSON.parse(localStorage.getItem(LF) || 'null') || {}; } catch { return {}; } };
      const _w = o => { try { localStorage.setItem(LF, JSON.stringify(o)); } catch {} };
      return {
        get(k)      { const s = _r(); return typeof s[k] !== 'undefined' ? s[k] : (FLAG_DEFAULTS[k] ?? false); },
        set(k, v)   { const s = _r(); s[k] = v; _w(s); },
        all()       { const s = _r(); const m = {}; Object.keys(FLAG_DEFAULTS).forEach(k => m[k] = typeof s[k] !== 'undefined' ? s[k] : FLAG_DEFAULTS[k]); return m; },
        initNew()   { _w({ ...FLAG_DEFAULTS, beta_ui: true, data_sharding: true }); },
        initExist() { const s = _r(); _w({ ...FLAG_DEFAULTS, ...s }); },
      };
    })();

    // ── DATABASE ──────────────────────────────────────────────────
    // JSON file = complete database from day one (ALL records)
    // localStorage = working copy (same full data, just in browser)
    // On every action: both are updated simultaneously

    const DB = {
      empty() {
        return {
          app: 'Spend-na', version: 4,
          created: new Date().toISOString(),
          lastSaved: new Date().toISOString(),
          passwordHash: '',
          profile: { name: '', role: 'working', photo: null, dob: '', city: '', quote: '' },
          limits: { necessary: 15000, committed: 30000, comfortable: 10000, luxury: 5000 },
          settings: { notif: false },
          transactions: [], // ← ALL records, ever, from day one
          pushToken: null,
        };
      },
      load() { try { const r = localStorage.getItem(LS); return r ? migrateData(JSON.parse(r)) : null; } catch { return null; } },
      // Saves FULL data — all transactions included, every time
      save(d) {
        try {
          d.lastSaved = new Date().toISOString();
          d.schemaVersion = SCHEMA_VERSION; // always stamp current schema version on save
          localStorage.setItem(LS, JSON.stringify(d));
          // Write current month shard if sharding flag is on
          if (typeof SHARD !== 'undefined') SHARD.writeCurrentMonthShard();
          return true;
        } catch (e) {
          // Quota exceeded or private browsing — warn the user
          if (e && (e.name === 'QuotaExceededError' || e.code === 22)) {
            setTimeout(() => toast('⚠ Storage full! Export your data to free space.'), 100);
          }
          return false;
        }
      },
      // Export ALL records as JSON — this IS the full database
      exportFile(d) {
        const payload = JSON.parse(JSON.stringify(d));
        payload.exportedAt = new Date().toISOString();
        payload.totalRecords = d.transactions.length;
        payload.schemaVersion = SCHEMA_VERSION;
        // Manifest metadata — lightweight index for future sharding
        payload.manifest = {
          schemaVersion: SCHEMA_VERSION,
          exportedAt:    payload.exportedAt,
          totalRecords:  payload.totalRecords,
          months:        [...new Set((d.transactions || []).map(t => t.month).filter(Boolean))].sort(),
          countsByMonth: (d.transactions || []).reduce((acc, t) => { if (t.month) acc[t.month] = (acc[t.month] || 0) + 1; return acc; }, {}),
          totalsByMonth: (d.transactions || []).reduce((acc, t) => { if (t.month) acc[t.month] = (acc[t.month] || 0) + (t.amount || 0); return acc; }, {}),
          buckets:       Object.keys(BUCKETS),
          app:           'Spend-na',
        };
        payload.note = 'Spend-na complete database. Import back anytime to restore everything from the beginning.';
        const json = JSON.stringify(payload, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'spend-na-data.json'; // Always same filename — easy to overwrite
        a.click();
        localStorage.setItem('sn_last_exported', new Date().toISOString());
        URL.revokeObjectURL(url);
      },
      // Try to overwrite the SAME file using File System Access API (Chrome Android + Desktop)
      async saveToSameFile(d) {
        // Check if File System Access API is available
        if (!window.showSaveFilePicker) { return false; }
        try {
          const fh = await window.showSaveFilePicker({
            suggestedName: 'spend-na-data.json',
            types: [{ description: 'JSON Data File', accept: { 'application/json': ['.json'] } }],
          });
          const ws = await fh.createWritable();
          const payload = JSON.parse(JSON.stringify(d));
          payload.lastSaved = new Date().toISOString();
          payload.totalRecords = d.transactions.length;
          await ws.write(JSON.stringify(payload, null, 2));
          await ws.close();
          return true;
        } catch (e) {
          // User cancelled or API not available
          return false;
        }
      },
      importFile() {
        return new Promise(res => {
          const inp = document.createElement('input'); inp.type = 'file'; inp.accept = '.json,application/json';
          inp.onchange = async e => {
            const f = e.target.files[0]; if (!f) { res(null); return; }
            try { const t = await f.text(); const d = JSON.parse(t); if (!Array.isArray(d.transactions)) { res(null); return; } res(migrateData(d)); }
            catch { res(null); }
          };
          inp.click();
        });
      },
    };

    // ── SOURCES DATABASE ─────────────────────────────────────────
    // Separate from sn_v4 — plug-in, never affects existing data
    const SRC_DB = {
      load() {
        try {
          const r = localStorage.getItem('sn_sources');
          if (!r) return { sources: [] };
          const parsed = JSON.parse(r);
          // Guard: ensure sources is always an array (test SEC-023)
          if (!Array.isArray(parsed.sources)) return { sources: [] };
          return parsed;
        } catch { return { sources: [] }; }
      },
      save(d) {
        try { localStorage.setItem('sn_sources', JSON.stringify(d)); return true; }
        catch { return false; }
      }
    };

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // ITEM 7 — DATA SHARDING + LAZY LOADING
    //
    // Architecture: D.transactions is the single source of truth.
    // This SHARD module adds a logical layer on top — it lets the
    // app query transactions by month without loading everything,
    // and exports individual monthly shards as separate JSON files.
    //
    // Keys used (never overlap with sn_v4):
    //   sn_shard_YYYY_Mon  → e.g. sn_shard_2026_Mar (future use)
    //
    // Phase 1 (NOW): logical sharding — queries filter in memory.
    //   All transactions still live in D.transactions (unchanged).
    //
    // Phase 2 (FUTURE): physical sharding — past months moved to
    //   separate localStorage keys, loaded on demand.
    //   Guarded by FLAGS.get('data_sharding') === true.
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    const SHARD = {
      _key(monthStr) {
        const parts = (monthStr || '').split(' ');
        return parts.length === 2 ? `sn_shard_${parts[1]}_${parts[0]}` : null;
      },
      forMonth(monthStr) {
        if (!monthStr || !D) return [];
        if (FLAGS.get('data_sharding')) {
          const key = this._key(monthStr);
          if (key) {
            try { const raw = localStorage.getItem(key); if (raw) return JSON.parse(raw); } catch { /* fall through */ }
          }
        }
        return (D.transactions || []).filter(t => t.month === monthStr);
      },
      months() {
        return [...new Set((D?.transactions || []).map(t => t.month).filter(Boolean))];
      },
      manifest() {
        const txns = D?.transactions || [];
        const months = this.months();
        return {
          schemaVersion: SCHEMA_VERSION,
          totalRecords:  txns.length,
          months,
          countsByMonth: months.reduce((acc, m) => { acc[m] = txns.filter(t => t.month === m).length; return acc; }, {}),
          totalsByMonth: months.reduce((acc, m) => { acc[m] = txns.filter(t => t.month === m).reduce((s, t) => s + (t.amount || 0), 0); return acc; }, {}),
        };
      },
      exportMonth(monthStr) {
        const txns = this.forMonth(monthStr);
        if (!txns.length) { toast('No transactions in ' + monthStr); return; }
        const payload = {
          app: 'Spend-na', type: 'monthly-shard',
          schemaVersion: SCHEMA_VERSION, month: monthStr,
          exportedAt: new Date().toISOString(),
          totalRecords: txns.length,
          total: txns.reduce((s, t) => s + (t.amount || 0), 0),
          transactions: txns,
        };
        const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
        const url  = URL.createObjectURL(blob);
        const a    = document.createElement('a');
        a.href = url;
        a.download = `spend-na-${monthStr.replace(' ', '-')}.json`;
        a.click();
        URL.revokeObjectURL(url);
        toast(`📦 ${monthStr} shard exported (${txns.length} records)`);
      },
      writeCurrentMonthShard() {
        if (!FLAGS.get('data_sharding') || !D) return;
        const monthStr = offsetMonthStr(0);
        const key = this._key(monthStr);
        if (!key) return;
        const txns = (D.transactions || []).filter(t => t.month === monthStr);
        try { localStorage.setItem(key, JSON.stringify(txns)); } catch { /* quota — skip */ }
      },
    };



    // ── GLOBAL ERROR BOUNDARY ─────────────────────────────────────
    window.onerror = function(msg, src, line, col, err) {
      console.error('[window.onerror]', msg, 'at', src, line, col, err);
      try { toast('⚠️ Unexpected error — app is still running'); } catch(_) { /* intentionally silent */ }
      return false; // don't suppress default browser logging
    };
    window.onunhandledrejection = function(e) {
      console.error('[unhandledRejection]', e.reason);
      try { toast('⚠️ Background error — please retry'); } catch(_) { /* intentionally silent */ }
    };
    // ── APP METHOD ERROR GUARD ────────────────────────────────────
    // Wraps every APP method: uncaught errors show a toast + log,
    // never crash the UI silently. Applied after APP object is defined.
    function _guardAPP(obj) {
      Object.keys(obj).forEach(key => {
        if (typeof obj[key] !== 'function') return;
        const orig = obj[key].bind(obj);
        obj[key] = function(...args) {
          try {
            return orig(...args);
          } catch(err) {
            console.error('[APP.' + key + ']', err);
            try { toast('⚠️ Something went wrong — please retry'); } catch(_) { /* intentionally silent */ }
          }
        };
      });
      return obj;
    }
    // ── STATE ─────────────────────────────────────────────────────
    let D = null;
    let S = { tab: 'home', sliceBk: null, histF: null, addSrc: null, addBkt: null, limVals: {}, setRole: null, setToggles: {}, unsaved: false, obRole: null, obPhoto: null, install: null, saveBusy: false, loginAttempts: 0, loginLockUntil: 0, monthOffset: 0, monthExpanded: null, _autoSaveTimer: null };

    // ── TAGS SESSION STATE ────────────────────────────────────────
    // Module-level — NOT on S or D. Resets on every r_add() call. Never persisted.
    let _addTags = [];

    // ── HELPERS ───────────────────────────────────────────────────
    function esc(s) { return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#x27;'); }
    function hashPw(raw) { return md5((raw || '').trim()); } // CR-02: single canonical password hasher — never call md5() directly
    const DEBUG = (window.ENV && window.ENV.debug) || false; // v5.8: set by env-config.js per environment; NEW-003
    function log() { if (DEBUG) console.log.apply(console, arguments); } // NEW-003
    function _safeGet(key, fallback) { if (!key) return fallback; try { const r = localStorage.getItem(key); if (!r) return fallback; const p = JSON.parse(r); return (p !== null && p !== undefined) ? p : fallback; } catch(e) { console.warn('[_safeGet]', key, e); return fallback; } } // CR-03
    function normTxn(t) { if (!t || typeof t !== 'object') return { merchant:'Unknown', amount:0, bucket:null, source:null, tags:[], date:'', time:'', month:'' }; const amt = parseFloat(t.amount); return { ...t, merchant: (typeof t.merchant === 'string' && t.merchant.trim()) ? t.merchant.trim() : 'Unknown', amount: isFinite(amt) && amt >= 0 ? amt : 0, bucket: t.bucket || null, source: t.source || null, tags: Array.isArray(t.tags) ? t.tags : [], date: t.date || '', time: t.time || '', month: t.month || '' }; } // HR-02: hardened
    let _saveTimer; function debouncedSave(d, ms) { if (!d) return; ms = ms || 300; clearTimeout(_saveTimer); _saveTimer = setTimeout(function(){ try { DB.save(d); } catch(e) { console.error('[debouncedSave]', e); toast('⚠️ Save failed'); } }, ms); } // HR-04
    // ── TRANSACTION MUTATION HELPERS (DRY) ──────────────────
    function _txnUpdate(id, patch) {
      if (!id || !D || !Array.isArray(D.transactions)) { console.warn('[_txnUpdate] invalid args', id); return false; }
      let found = false;
      try {
        D.transactions = D.transactions.map(t => {
          if (t.id !== id) return t;
          found = true;
          return typeof patch === 'function' ? patch(t) : { ...t, ...patch };
        });
      } catch(e) { console.error('[_txnUpdate]', e); }
      return found;
    }
    function _txnDelete(id) {
      if (!id || !D || !Array.isArray(D.transactions)) { console.warn('[_txnDelete] invalid args', id); return false; }
      const before = D.transactions.length;
      try { D.transactions = D.transactions.filter(t => t.id !== id); } catch(e) { console.error('[_txnDelete]', e); return false; }
      return D.transactions.length < before;
    }
    function _mkTxnId() { return 't_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8) + Math.random().toString(36).slice(2, 5); } // extra entropy for uniqueness
    function _fmtDate(d) { try { return d instanceof Date && !isNaN(d) ? d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : ''; } catch(e) { return ''; } }
    function _fmtTime(d) { try { return d instanceof Date && !isNaN(d) ? d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : ''; } catch(e) { return ''; } }
    function _fmtMonth(d) { try { return d instanceof Date && !isNaN(d) ? d.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }) : ''; } catch(e) { return ''; } }
    function _commitSave(msg) {
      try {
        DB.save(D);
        if (APP && APP.markUnsaved) APP.markUnsaved();
        if (msg) toast(msg);
      } catch(e) {
        console.error('[_commitSave]', e);
        toast('⚠️ Save failed — storage may be full');
      }
    }
    function _confirmDelete(onConfirm) {
      modal('Delete?', 'Cannot be undone.', [
        { l: 'Cancel', c: 'mb-nil', a: () => APP.cm() },
        { l: 'Delete', c: 'mb-err', a: onConfirm }
      ]);
    }
    function fmt(n) { if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`; if (n >= 1000) return `₹${(n / 1000).toFixed(1)}k`; return `₹${n}`; }
    function fmtF(n) { return '₹' + (isFinite(+n) ? +n : 0).toLocaleString('en-IN'); }
    // BUG-4: hero display = full comma-formatted amount + scale badge
    function fmtHero(n) {
      const v = isFinite(+n) ? Math.abs(+n) : 0;
      const formatted = '₹' + v.toLocaleString('en-IN');
      let badge = '';
      if (v >= 10000000)      badge = (v / 10000000).toFixed(2).replace(/\.?0+$/, '') + ' Cr';
      else if (v >= 100000)   badge = (v / 100000).toFixed(2).replace(/\.?0+$/, '') + ' L';
      else if (v >= 1000)     badge = (v / 1000).toFixed(1).replace(/\.?0+$/, '') + 'K';
      return { formatted, badge };
    }
    function fmtINR(n) { if (!n && n !== 0) return ''; return Number(n).toLocaleString('en-IN'); }
    function parseINR(s) { return parseFloat((String(s || '')).replace(/,/g, '')) || 0; }
    // BUG-3: live Indian-format comma insertion as-you-type
    function _fmtAmtLive(el) {
      if (!el) return;
      const raw = el.value.replace(/,/g, '');
      // Skip: empty, just a dot, mid-decimal entry, leading zeros (e.g. "0.")
      if (!raw || raw === '.' || raw.endsWith('.') || /^\./.test(raw)) return;
      const num = Number(raw);
      if (!isFinite(num) || num < 0) return;
      // Don't format if user is typing a decimal part (e.g. "100.5" mid-type)
      const dotIdx = raw.indexOf('.');
      if (dotIdx !== -1 && raw.length - dotIdx <= 3) return;
      const cursor = el.selectionStart;
      const oldLen = el.value.length;
      // Format integer part, preserve decimal part verbatim
      let formatted;
      if (dotIdx !== -1) {
        const intPart = raw.slice(0, dotIdx);
        const decPart = raw.slice(dotIdx); // includes the dot
        formatted = Number(intPart).toLocaleString('en-IN') + decPart;
      } else {
        formatted = num.toLocaleString('en-IN');
      }
      if (formatted === el.value) return; // no change — avoid cursor jump
      el.value = formatted;
      const adj = el.value.length - oldLen;
      try { el.setSelectionRange(Math.max(0, cursor + adj), Math.max(0, cursor + adj)); } catch(_) { /* intentionally silent */ }
    }
    function avHTML(p, sz) {
      const s = sz || 44, lt = ((p && p.name && p.name[0]) || 'S').toUpperCase();
      if (p?.photo && String(p.photo).startsWith('data:image/')) return `<img src="${p.photo}" style="width:100%;height:100%;object-fit:cover;border-radius:inherit">`;
      return `<span style="font-size:${Math.round(s * .38)}px;font-weight:800;color:#fff">${lt}</span>`;
    }
    function ico(m) { if (!m) return '💸'; const lo = m.toLowerCase(); for (const r of ICONS) if (r.kw.some(k => lo.includes(k))) return r.i; return '💸'; }

    // ── SHARED EXPORT HTML BUILDER ────────────────────────────────
    function _buildReportHtml({ eyebrow, title, amount, subtitle, bCards, rows, txnCount, footerYear }) {
      const css = "body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f8fafc;margin:0;padding:20px;-webkit-font-smoothing:antialiased}table{width:100%;border-collapse:collapse}td{padding:10px 12px;border-bottom:1px solid #f1f5f9;font-size:13px;color:#334155}.w{max-width:700px;margin:0 auto}";
      return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Spend-na — ${title}</title><style>${css}</style></head><body><div class="w"><div style="background:linear-gradient(135deg,#0f172a,#1e293b);border-radius:20px;padding:28px;margin-bottom:20px"><div style="font-size:11px;color:#0ea5e9;font-weight:700;letter-spacing:2px;margin-bottom:6px">SPEND-NA · ${eyebrow}</div><div style="font-size:28px;font-weight:900;color:#fff;letter-spacing:-0.5px">${title}</div><div style="font-size:40px;font-weight:800;color:#0ea5e9;margin-top:12px">₹${amount}</div><div style="font-size:13px;color:#94a3b8;margin-top:4px">${subtitle}</div></div><div style="display:flex;flex-wrap:wrap;gap:10px;margin-bottom:20px">${bCards}</div><div style="background:white;border-radius:16px;overflow:hidden;margin-bottom:16px"><div style="padding:16px 20px;border-bottom:1px solid #f1f5f9"><strong>${txnCount}</strong></div><table><tbody>${rows}</tbody></table></div><div style="text-align:center;padding:20px;color:#94a3b8;font-size:11px">Generated by Spend-na · 🔒 All data stays on your device · © Sandeep Hakki · hakki.in${footerYear ? ' · ' + footerYear : ''}</div></div></body></html>`;
    }
    // HR-01: memoized summary — cache invalidated when transaction count or lastSaved changes
    let _summaryCache = {}, _summaryCacheKey = {};
    function summary(monthStr) {
      const key = (D?.transactions||[]).length + '_' + (D?.lastSaved||'') + '_' + (monthStr||'');
      if (_summaryCacheKey[monthStr||'all'] === key && _summaryCache[monthStr||'all']) return _summaryCache[monthStr||'all'];
      const s = { total: 0 }; Object.keys(BUCKETS).forEach(k => s[k] = 0); (D?.transactions || []).forEach(t => { if (t.bucket && BUCKETS[t.bucket] && (!monthStr || t.month === monthStr)) { const a = isFinite(+t.amount) ? +t.amount : 0; s[t.bucket] += a; s.total += a; } }); // hardened: NaN-safe
      _summaryCacheKey[monthStr||'all'] = key; _summaryCache[monthStr||'all'] = s; return s;
    }
    function offsetMonthStr(offset) { const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() + offset); return d.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }); }
    function offsetMonthLong(offset) { const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() + offset); return d.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }); }
    function pending() { return (D?.transactions || []).filter(t => !t.bucket).length; }

    // ── PLATFORM DETECTION ────────────────────────────────────────
    function detectPlatform() {
      const ua = navigator.userAgent;
      const isIOS = /iPad|iPhone|iPod/.test(ua) && !window.MSStream;
      const isChromeIOS = /CriOS/.test(ua);
      const isAndroid = /Android/.test(ua);
      const isSafariIOS = isIOS && /Safari/.test(ua) && !isChromeIOS;
      const isDesktop = !isIOS && !isAndroid;
      const isStandalone = window.navigator.standalone === true ||
        window.matchMedia('(display-mode: standalone)').matches;
      const isNativeBrowser =
        (isIOS && (isSafariIOS || isStandalone)) ||
        (isAndroid && !isChromeIOS) ||
        isDesktop;
      return { isIOS, isChromeIOS, isAndroid, isSafariIOS, isDesktop, isStandalone, isNativeBrowser };
    }
    function updSaveBar() {/* save bar removed — auto-save is silent */ }
    // BUG-025: detect unsaved limit changes before navigation
    function limitsAreDirty() {
      if (!S.limVals || !D.limits) return false;
      return Object.keys(S.limVals).some(k => (S.limVals[k] || 0) !== (D.limits[k] || 0));
    }

    function toast(msg, ms = 2200) { const el = document.getElementById('toast'); el.textContent = msg; el.classList.add('on'); clearTimeout(el._t); el._t = setTimeout(() => el.classList.remove('on'), ms); }
    function modal(title, body, btns) {
      document.getElementById('mT').textContent = title;
      document.getElementById('mB').innerHTML = body;
      document.getElementById('mBs').innerHTML = btns.map((b, i) => `<button class="mb ${esc(b.c || '')}" id="mb${i}">${esc(b.l)}</button>`).join(''); // CR-01: escape class+label to prevent XSS
      btns.forEach((b, i) => { document.getElementById('mb' + i).onclick = b.a; });
      document.getElementById('modal').classList.add('on');
    }
    // P-03 / NEW-004: modal()'s body is not auto-escaped. Use these wrappers instead of
    // calling modal() directly so every call site states its intent explicitly.
    function safeModal(title, safeBodyHtml, btns) {
      // safeBodyHtml must be a static string / trusted HTML — never raw user input
      modal(title, safeBodyHtml, btns);
    }
    function userModal(title, userText, btns) {
      // Wraps and escapes user-derived text (merchant names, amounts, tags, notes, etc.)
      modal(title, `<p>${esc(userText)}</p>`, btns);
    }

    // ── PAGE VISIBILITY ───────────────────────────────────────────
    const APP = {
      show(id) {
        document.querySelectorAll('.pg').forEach(p => p.classList.remove('on'));
        document.getElementById(id).classList.add('on');
        // Auto-focus first input on lock screen
        if (id === 'pgLock') setTimeout(() => { const i = document.getElementById('lkIn'); if (i) i.focus(); }, 200);
        if (id === 'pgOb') setTimeout(() => { const i = document.getElementById('obName'); if (i) i.focus(); }, 200);
      },
      cm() { document.getElementById('modal').classList.remove('on'); },


      // ── TRUST SCREEN ──
      toggleTrustAccordion() {
        const body = document.getElementById('trustDetails');
        const icon = document.getElementById('trustToggleIcon');
        if (!body || !icon) return;
        const isHidden = body.style.display === 'none' || body.style.display === '';
        body.style.display = isHidden ? 'flex' : 'none';
        body.style.flexDirection = 'column';
        icon.textContent = isHidden ? 'collapse' : 'expand';
      },

      trustAccepted() {
        localStorage.setItem('sn_trust_seen', '1');
        const saved = DB.load();
        if (saved && saved.passwordHash) { D = saved; this.show('pgLock'); return; }
        if (saved) { D = saved; this.launch(); return; }
        // New user — check browser before onboarding
        const p = detectPlatform();
        const warned = localStorage.getItem('sn_browser_warned');
        if (!p.isNativeBrowser && !warned) {
          localStorage.setItem('sn_browser_warned', '1');
          this._showNewUserBrowserWarning();
          return;
        }
        this.buildRoles(); this.show('pgOb'); setupDobInput('obDob');
      },

      _showNewUserBrowserWarning() {
        const p = detectPlatform();
        const appUrl = window.location.href.split('?')[0].split('#')[0];
        const browserMsg = p.isChromeIOS
          ? 'You\'re opening Spend-na in <strong>Chrome on iPhone</strong>. Files you export won\'t be easy to find — they go to Chrome\'s hidden Downloads, not your Files app.'
          : 'You\'re using a non-native browser. For the best experience and easy file access, open Spend-na in your device\'s native browser.';
        const recommendedBrowser = p.isIOS ? 'Safari' : 'your default browser';
        modal(
          '🧭 One moment',
          `<div style="font-size:13px;line-height:1.7">
        <div style="background:rgba(251,191,36,.12);border-radius:var(--r);padding:12px 14px;margin-bottom:14px;border:1px solid rgba(251,191,36,.30)">
          <div style="font-size:12px;font-weight:700;color:#92400e;margin-bottom:4px">Browser recommendation</div>
          <div style="font-size:11px;color:#b45309">${browserMsg}</div>
        </div>
        <div style="font-size:12px;color:var(--slate);margin-bottom:10px">
          <strong>Recommended:</strong> Open in <strong>${recommendedBrowser}</strong> for files to save where you can always find them.
        </div>
        <div style="background:var(--paper);border-radius:var(--r);padding:11px 13px;font-size:11px;color:var(--slate)">
          App URL: <span style="color:var(--teal);font-weight:700;word-break:break-all">${esc(appUrl)}</span>
        </div>
      </div>`,
          [
            {
              l: `Switch to ${recommendedBrowser} first`, c: 'mb-ok', a: () => {
                this.cm();
                if (navigator.clipboard) {
                  navigator.clipboard.writeText(appUrl)
                    .then(() => toast('URL copied — open ' + recommendedBrowser + ' and paste it', 3500))
                    .catch(() => { });
                }
              }
            },
            {
              l: 'Continue in this browser anyway', c: 'mb-nil', a: () => {
                this.cm();
                this.buildRoles(); this.show('pgOb'); setupDobInput('obDob');
              }
            },
          ]
        );
      },

      async trustSkip() {
        // User already has an account — load their file
        localStorage.setItem('sn_trust_seen', '1');
        const data = await DB.importFile();
        if (!data) { toast('No file selected'); return; }
        if (data.passwordHash) {
          D = data; DB.save(D); this.show('pgLock');
        } else {
          D = data; DB.save(D); this.launch();
        }
      },

      // ── BOOT ──
      boot() {
        this.initTheme();
        // Check storage availability (private browsing guard — STRESS-003)
        if (!isStorageAvailable()) {
          document.body.innerHTML = `<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;padding:32px;text-align:center;font-family:-apple-system,sans-serif;background:#f8fafc"><div style="font-size:48px;margin-bottom:16px">🔒</div><div style="font-size:20px;font-weight:800;color:#1e293b;margin-bottom:8px">Storage not available</div><div style="font-size:14px;color:#64748b;max-width:300px">Spend-na needs localStorage to work. Please disable Private/Incognito mode or check your browser settings.</div></div>`;
          return;
        }
        // Service worker — served as a real same-origin /sw.js file.
        // data: and blob: URIs are opaque-origin and fail SW registration per spec
        // on modern Chrome/Firefox — NEW-001 fix. APP_VER bumped to 5.4 — NEW-002 fix.
        const APP_VER = '6.0';
        if ('serviceWorker' in navigator) {
          try {
            // v5.8: was a hardcoded absolute '/sw.js' — broke under a GitHub Pages
            // project subpath (e.g. https://account.github.io/repo/), since that
            // resolves to the wrong origin root. env-config.js computes the right
            // path per environment; './sw.js' is a safe fallback if it didn't load.
            const swPath = (window.ENV && window.ENV.swPath) || './sw.js';
            navigator.serviceWorker.register(swPath).then(reg => {
              log('SW registered:', reg.scope);
              // Version check: ask the active SW what version it is
              // If a stale SW is still serving (old cache), show a reload nudge
              setTimeout(() => {
                const sw = reg.active || reg.waiting || reg.installing;
                if (!sw || !sw.postMessage) return;
                try {
                  const mc = new MessageChannel();
                  mc.port1.onmessage = ev => {
                    const swVer = ev.data && ev.data.version;
                    if (swVer && swVer !== APP_VER) {
                      toast('🔄 App updated — tap to reload', 5000);
                      document.getElementById('toast').style.cursor = 'pointer';
                      document.getElementById('toast').onclick = () => window.location.reload();
                    }
                  };
                  sw.postMessage({ type: 'GET_VERSION' }, [mc.port2]);
                } catch (e) { /* MessageChannel not available — skip */ }
              }, 3000);
            }).catch(err => {
              log('SW registration skipped:', err.message);
            });
          } catch (e) { }
        }
        // Install banner
        window.addEventListener('beforeinstallprompt', e => {
          e.preventDefault(); S.install = e;
          document.getElementById('iBanner').classList.add('on');
        });
        document.getElementById('iBannerBtn').onclick = () => {
          if (S.install) { S.install.prompt(); S.install.userChoice.then(() => document.getElementById('iBanner').classList.remove('on')); }
        };

        this.show('pgSplash');
        setTimeout(() => {
          const saved = DB.load();
          const trustSeen = localStorage.getItem('sn_trust_seen');

          if (!trustSeen && !saved) {
            // Absolute first-timer — no trust flag, no data
            FLAGS.initNew();
            this.show('pgTrust');
          } else if (!trustSeen && saved) {
            // Edge case: has data but trust not yet marked (upgraded user)
            localStorage.setItem('sn_trust_seen', '1');
            FLAGS.initExist();
            D = saved;
            if (saved.passwordHash) { this.show('pgLock'); }
            else { this.launch(); }
          } else if (!saved) {
            // Seen trust but no data — go to onboarding
            FLAGS.initNew();
            this.buildRoles(); this.show('pgOb'); setupDobInput('obDob');
          } else if (saved.passwordHash) {
            // Has data + password — show lock
            FLAGS.initExist();
            D = saved; this.show('pgLock');
          } else {
            // Has data, no password — launch directly
            FLAGS.initExist();
            D = saved; this.launch();
          }
        }, 1500);
      },

      togglePw(inId, eyeId) {
        const inp = document.getElementById(inId), eye = document.getElementById(eyeId);
        if (!inp) return;
        const hidden = inp.type === 'password';
        inp.type = hidden ? 'text' : 'password';
        eye.textContent = hidden ? '🙈' : '👁';
      },

      // ── LOCK ──
      r_lock() {
        // INFO-003: restore lockout from sessionStorage so page reload can't bypass it
        try {
          const stored = sessionStorage.getItem('sn_lock_until');
          if (stored) {
            const until = parseInt(stored, 10);
            if (until > Date.now()) { S.loginLockUntil = until; }
            else { sessionStorage.removeItem('sn_lock_until'); }
          }
        } catch(e) { console.warn("[catch]", e); }
      },
      unlock() {
        const now = Date.now();
        if (S.loginLockUntil > now) { toast(`Too many attempts. Wait ${Math.ceil((S.loginLockUntil - now) / 1000)}s.`); return; }
        const pw = (document.getElementById('lkIn').value || '').trim();
        if (!pw) return;
        if (hashPw(pw) === D.passwordHash) {
          S.loginAttempts = 0; S.loginLockUntil = 0;
          try { sessionStorage.removeItem('sn_lock_until'); } catch(e) { console.warn("[catch]", e); }
          document.getElementById('lkErr').textContent = '';
          this.launch();
        } else {
          S.loginAttempts++;
          if (S.loginAttempts >= 5) {
            S.loginLockUntil = Date.now() + 30000;
            S.loginAttempts = 0;
            try { sessionStorage.setItem('sn_lock_until', String(S.loginLockUntil)); } catch(e) { console.warn("[catch]", e); }
            document.getElementById('lkErr').textContent = 'Too many attempts. Locked for 30s.';
          }
          else { document.getElementById('lkErr').textContent = `Wrong password. ${5 - S.loginAttempts} attempt${5 - S.loginAttempts !== 1 ? 's' : ''} left.`; }
          document.getElementById('lkIn').value = '';
          setTimeout(() => document.getElementById('lkErr').textContent = '', 3000);
        }
      },

      // ── FORGOT PASSWORD ──

      showTrustAgain() {
        this.show('pgTrust');
        // Scroll to top
        const el = document.getElementById('pgTrust');
        if (el) el.scrollTop = 0;
      },

      showForgot() { this.show('pgForgot'); },

      async forgotRecover() {
        const data = await DB.importFile();
        if (!data) { toast('No file selected or invalid file'); return; }
        if (!data.passwordHash) { toast('Invalid data file'); return; }
        // Load the data, then ask user to set new password
        modal(
          '✅ Data file found!',
          `Found ${data.transactions.length} transactions. Set a new password to unlock your data.`,
          [
            { l: 'Cancel', c: 'mb-nil', a: () => this.cm() },
            { l: 'Set new password', c: 'mb-ok', a: () => { this.cm(); this._setNewPasswordFrom(data); } },
          ]
        );
      },

      _setNewPasswordFrom(data) {
        modal(
          '🔑 Set New Password',
          `<div style="display:flex;flex-direction:column;gap:10px;margin-top:8px">
        <input id="newPw1" type="password" autocomplete="new-password" class="input-std" placeholder="New password (min 4 chars)">
        <input id="newPw2" type="password" autocomplete="new-password" class="input-std" placeholder="Confirm new password">
        <div id="newPwErr" style="font-size:11px;color:var(--err);min-height:16px"></div>
      </div>`,
          [
            { l: 'Cancel', c: 'mb-nil', a: () => this.cm() },
            {
              l: 'Restore & Unlock', c: 'mb-ok', a: () => {
                const p1 = (document.getElementById('newPw1')?.value || '').trim();
                const p2 = (document.getElementById('newPw2')?.value || '').trim();
                const er = document.getElementById('newPwErr');
                if (p1.length < 4) { er.textContent = 'Minimum 4 characters'; return; }
                if (p1 !== p2) { er.textContent = 'Passwords do not match'; return; }
                // Apply new password and restore all data
                data.passwordHash = hashPw(p1);
                D = data;
                DB.save(D);
                this.cm();
                this.launch();
                toast('Data restored! New password set ✓', 3000);
                // Prompt to save file with new password
                setTimeout(() => {
                  modal('💾 Save your data file', 'Your data is fully restored with your new password. Save your file now so you always have a backup.', [
                    { l: 'Save file now', c: 'mb-ok', a: () => { this.cm(); this.saveFile(); } },
                    { l: 'Later', c: 'mb-nil', a: () => this.cm() },
                  ]);
                }, 800);
              }
            },
          ]
        );
      },

      clearAllFresh() {
        const txnCount = (D.transactions || []).length;
        modal('⚠️ Save before clearing?',
          txnCount > 0
            ? `You have ${txnCount} transactions. Your data file must be saved before clearing — it's your only recovery option.`
            : 'Clear all data and start fresh?',
          txnCount > 0 ? [
            { l: 'Cancel', c: 'mb-nil', a: () => this.cm() },
            { l: '💾 Save file first', c: 'mb-ok', a: () => {
                this.cm();
                DB.exportFile(D);
                setTimeout(() => {
                  modal('File saved. Clear now?', 'Your data file is downloading. Once saved, you can clear the app.', [
                    { l: 'Cancel', c: 'mb-nil', a: () => this.cm() },
                    { l: 'Yes, clear everything', c: 'mb-err', a: () => { localStorage.clear(); this.cm(); location.reload(); } },
                  ]);
                }, 600);
              }
            },
          ] : [
            { l: 'Cancel', c: 'mb-nil', a: () => this.cm() },
            { l: 'Clear everything', c: 'mb-err', a: () => { localStorage.clear(); this.cm(); location.reload(); } },
          ]
        );
      },

      // ── ONBOARDING ──
      buildRoles() {
        document.getElementById('obRoles').innerHTML = Object.entries(ROLES).map(([k, r]) => `
      <div class="role-card" data-r="${k}" onclick="APP.obRole('${k}')">
        <span class="role-em">${r.e}</span><span class="role-nm">${r.l}</span><div class="role-ck">✓</div>
      </div>`).join('');
      },
      obRole(k) {
        S.obRole = k;
        document.querySelectorAll('.role-card').forEach(el => el.classList.toggle('on', el.dataset.r === k));
        this.obVal();
      },
      obVal() {
        const nm = (document.getElementById('obName')?.value || '').trim();
        const p1 = document.getElementById('obPw1')?.value || '', p2 = document.getElementById('obPw2')?.value || '';
        const err = document.getElementById('obPwErr');
        let ok = nm.length > 1 && S.obRole && p1.length >= 4;
        if (p1 && p2 && p1 !== p2) { err.textContent = 'Passwords do not match'; ok = false; }
        else if (p1 && p1.length < 4) { err.textContent = 'Minimum 4 characters'; ok = false; }
        else err.textContent = '';
        const cta = document.getElementById('obCta'); if (cta) { cta.disabled = !ok; cta.style.opacity = ok ? '1' : '.35'; }
      },
      startJourney() {
        const nm = document.getElementById('obName').value.trim();
        const pw = document.getElementById('obPw1').value.trim();
        const role = ROLES[S.obRole], fn = nm.split(' ')[0];
        D = DB.empty();
        D.passwordHash = hashPw(pw);
        D.profile = { name: nm, role: S.obRole, photo: S.obPhoto || null, dob: document.getElementById('obDob').value.trim(), city: document.getElementById('obCity').value.trim(), quote: document.getElementById('obQuote').value.trim() || `${role.e} Every rupee has a story, ${fn}. Make yours count.` };
        D.limits = { ...role.lim };
        DB.save(D);
        this.launch();
        setTimeout(() => {
          modal('🎉 Welcome to Spend-na!',
            'Your data is saved on this device. Download your data file and keep it safe — it\'s your backup and your password recovery key.',
            [
              { l: 'Download my data file', c: 'mb-ok', a: () => { this.cm(); this.saveFile(); } },
              { l: 'I\'ll do it later', c: 'mb-nil', a: () => this.cm() },
            ]
          );
        }, 600);
      },

      // ── LAUNCH ──
      launch() {
        this.show('pgApp');
        this.go('home');
        this.startBanner();
        this.initFocusMode();
        setTimeout(() => this._checkBrowserNudge(), 800);
        setTimeout(() => this._check7DayBackupWarning(), 2200);
      },

      _checkBrowserNudge() {
        const p = detectPlatform();
        if (p.isIOS && p.isChromeIOS && !p.isStandalone) {
          const el = document.getElementById('safariNudge');
          if (el) el.classList.add('on');
        }
      },

      _check7DayBackupWarning() {
        const lastExp = localStorage.getItem('sn_last_exported');
        const shownThisSession = sessionStorage.getItem('sn_backup_warned');
        if (shownThisSession) return;
        const daysSince = lastExp
          ? Math.floor((Date.now() - new Date(lastExp).getTime()) / (1000 * 60 * 60 * 24))
          : null;
        if (daysSince !== null && daysSince < 7) return;
        sessionStorage.setItem('sn_backup_warned', '1');
        const msg = daysSince === null
          ? 'You haven\'t saved your data file yet. Your data lives only in this browser — if Chrome\'s data is cleared or you switch phones, it\'s gone.'
          : `You last saved your data file ${daysSince} days ago. Save now to keep your backup fresh.`;
        modal(
          '💾 Backup reminder',
          `<div style="font-size:13px;color:var(--slate);line-height:1.7">
        <div style="background:rgba(251,191,36,.12);border-radius:var(--r);padding:12px;margin-bottom:14px;border:1px solid rgba(251,191,36,.30);color:#fbbf24;font-size:12px">${msg}</div>
        <div style="font-size:12px">Your data file is your backup AND your password recovery key. Save it regularly.</div>
      </div>`,
          [
            { l: 'Save now', c: 'mb-ok', a: () => { this.cm(); this.saveFile(); } },
            { l: 'Remind me later', c: 'mb-nil', a: () => this.cm() },
          ]
        );
      },

      // ── SMART BANNER ─────────────────────────────────────────────
      _sbnIdx: 0,
      _sbnTimer: null,

      _buildBannerMessages() {
        const msgs = [];
        const now = new Date();
        const daysLeft = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate() - now.getDate();
        const sm = summary(offsetMonthStr(0)); // BUG-1 scope
        const currentMonth = offsetMonthStr(0);

        // v5.0 AI: 3am Warning (highest priority if applicable)
        try {
          const lnWarn = getLateNightWarning();
          if (lnWarn) msgs.push({ dot: '#8b5cf6', text: lnWarn, action: 'History ›', target: 'history' });
        } catch(e) { console.warn("[catch]", e); }

        // v5.0 AI: Salary Day Intelligence
        try {
          const salMsg = getSalaryDayIntelligence();
          if (salMsg) msgs.push({ dot: '#10b981', text: salMsg, action: 'Sources ›', target: 'sources' });
        } catch(e) { console.warn("[catch]", e); }

        msgs.push({ dot: '#f59e0b', text: '💡 Tag your spends to track events like birthdays, travel and festivals separately', action: 'Add ›', target: 'add' });
        msgs.push({ dot: '#0ea5e9', text: '💾 Save your data file regularly — it\'s your backup AND your password recovery key', action: 'Settings ›', target: 'settings' });
        msgs.push({ dot: '#8b5cf6', text: '📊 Check your Insights to discover your spending personality and patterns', action: 'Insights ›', target: 'insights' });
        if (daysLeft <= 5) msgs.push({ dot: '#f43f5e', text: `📅 Only ${daysLeft} day${daysLeft !== 1 ? 's' : ''} left in ${currentMonth} — review your month before it closes`, action: 'Month ›', target: 'month' });
        const sdHome = SRC_DB.load();
        const hasSources = (sdHome.sources || []).some(s => s.month === currentMonth);
        if (!hasSources) msgs.push({ dot: '#10b981', text: '💰 Add your income to Sources to see exactly how much you have left this month', action: 'Sources ›', target: 'sources' });
        Object.entries(D.limits || {}).forEach(([k, lim]) => {
          if (lim > 0 && sm[k] >= lim * BUDGET_WARN_PCT) {
            const pct = Math.round((sm[k] / lim) * 100);
            const isOver = sm[k] > lim;
            msgs.push({ dot: isOver ? '#ef4444' : '#f59e0b', text: `${isOver ? '⚠' : '⚡'} ${BUCKETS[k]?.l || k} is ${isOver ? 'over' : 'at ' + pct + '% of'} your monthly limit`, action: 'Limits ›', target: 'limits' });
          }
        });
        const pendingCount = pending();
        if (pendingCount > 0) msgs.push({ dot: '#f43f5e', text: `🗂 You have ${pendingCount} unsorted spend${pendingCount !== 1 ? 's' : ''} waiting — sort them into buckets`, action: 'Add ›', target: 'add' });
        msgs.push({ dot: '#64748b', text: '🔒 Your data never leaves this device. No server, no cloud, no tracking. Ever.', action: '', target: '' });
        msgs.push({ dot: '#0ea5e9', text: '📈 Use the Month view to see week-by-week spending patterns', action: 'Month ›', target: 'month' });
        // Beta opt-in — shown once per session if beta_ui flag is OFF
        if (!FLAGS.get('beta_ui') && !sessionStorage.getItem('sn_beta_prompted')) {
          msgs.unshift({ dot: '#7c3aed', text: '✦ New features are available — try the updated experience', action: 'Try it ›', target: '_beta_optin' });
        }
        return msgs;
      },

      sbnTap() {
        const msgs = this._buildBannerMessages();
        const target = msgs[this._sbnIdx]?.target;
        if (target === '_beta_optin') {
          sessionStorage.setItem('sn_beta_prompted', '1');
          modal(
            '✦ New experience',
            'You\'re on the latest version of Spend-na with all new features — AI insights, income sources, tags, and more. Everything is already active for you.',
            [
              { l: 'Great, thanks!', c: 'mb-ok', a: () => { FLAGS.set('beta_ui', true); this.cm(); } },
              { l: 'Revert to classic look', c: 'mb-sec', a: () => { FLAGS.set('beta_ui', false); this.cm(); toast('Classic mode kept — you can change this in Settings'); } },
            ]
          );
        } else if (target) {
          this.go(target);
        }
      },

      startBanner() {
        const el = document.getElementById('smartBanner');
        if (!el) return;
        el.style.display = 'flex';
        document.body.classList.add('banner-visible');
        this._sbnIdx = 0;
        this._renderBanner();
        clearInterval(this._sbnTimer);
        this._sbnTimer = setInterval(() => {
          const msgs = this._buildBannerMessages();
          this._sbnIdx = (this._sbnIdx + 1) % msgs.length;
          this._renderBanner();
        }, 5000);
      },

      _renderBanner() {
        const msgs = this._buildBannerMessages();
        if (!msgs.length) return;
        const m = msgs[this._sbnIdx];
        const dot = document.getElementById('sbnDot');
        const text = document.getElementById('sbnText');
        const action = document.getElementById('sbnAction');
        const dotsEl = document.getElementById('sbnDots');
        if (!dot || !text || !action || !dotsEl) return;
        dot.style.background = m.dot;
        text.textContent = m.text;
        action.textContent = m.action;
        action.style.display = m.action ? 'block' : 'none';
        const total = Math.min(msgs.length, 5);
        dotsEl.innerHTML = Array.from({ length: total }, (_, i) =>
          `<div class="sbn-d${i === this._sbnIdx % total ? ' on' : ''}"></div>`
        ).join('');
      },

      // ── THEME (dark / light / system) ──
      // v5.7: mirrors initFocusMode/cycleFocusMode below. The actual first-paint
      // theme is set by a tiny inline script in index.html <head> (before CSS
      // is even parsed) to avoid a flash of the wrong theme — this just keeps
      // things in sync afterward and reacts live if the OS theme changes while
      // the user is on 'system'.
      initTheme() {
        let saved = 'light';
        try { saved = localStorage.getItem('sn_theme') || 'light'; } catch(e) { console.warn("[catch]", e); }
        this._applyTheme(saved);
        try {
          window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', () => {
            let mode = 'system';
            try { mode = localStorage.getItem('sn_theme') || 'system'; } catch(e) { console.warn("[catch]", e); }
            if (mode === 'system') this._applyTheme('system');
          });
        } catch(e) { console.warn("[catch]", e); }
      },

      _applyTheme(mode) {
        let resolved = mode;
        if (mode === 'system') {
          resolved = 'dark';
          try { resolved = window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'; }
          catch(e) { console.warn("[catch]", e); }
        }
        document.documentElement.dataset.theme = resolved;
        const meta = document.querySelector('meta[name="theme-color"]');
        if (meta) meta.setAttribute('content', resolved === 'light' ? '#eef1f6' : '#0f172a');
      },

      cycleTheme() {
        const order = ['light', 'dark', 'system'];
        const labels = { dark: 'Dark', light: 'Light', system: 'System' };
        const current = localStorage.getItem('sn_theme') || 'light';
        const next = order[(order.indexOf(current) + 1) % order.length];
        try { localStorage.setItem('sn_theme', next); } catch(e) { console.warn("[catch]", e); }
        this._applyTheme(next);
        const badge = document.querySelector('.theme-badge-label');
        if (badge) badge.textContent = labels[next];
        toast(`Theme: ${labels[next]}`);
      },

      // ── FOCUS MODE ──
      initFocusMode() {
        // FIX-2: 3-level focus mode restore
        try {
          const saved = parseInt(localStorage.getItem('sn_focus_level') || '0', 10);
          const levels = ['', 'focus-comfortable', 'focus-large'];
          document.body.classList.remove('focus-mode', 'focus-comfortable', 'focus-large');
          if (saved > 0) document.body.classList.add(levels[saved]);
        } catch(e) {
          // Fallback: legacy focusMode bool
          const saved = D?.settings?.focusMode;
          if (saved) document.body.classList.add('focus-comfortable');
        }
      },

      setFocusMode(on) { this.cycleFocusMode(); },

      cycleFocusMode() {
        const levels = ['', 'focus-comfortable', 'focus-large'];
        const labels = ['Default', 'Comfortable', 'Large'];
        const body = document.body;
        let current = 0;
        if (body.classList.contains('focus-large')) current = 2;
        else if (body.classList.contains('focus-comfortable')) current = 1;
        body.classList.remove('focus-mode', 'focus-comfortable', 'focus-large');
        const next = (current + 1) % 3;
        if (next > 0) body.classList.add(levels[next]);
        try { localStorage.setItem('sn_focus_level', String(next)); } catch(e) { console.warn("[catch]", e); }
        this._updateFocusBadge(next, labels[next]);
        toast(`Text size: ${labels[next]}`);
      },

      _updateFocusBadge(level, label) {
        const badge = document.querySelector('.focus-badge');
        if (!badge) return;
        const labelEl = badge.querySelector('.focus-badge-label');
        if (labelEl) labelEl.textContent = label;
      },

      // ── SAVE ──
      markUnsaved() {
        S.unsaved = true;
        // Auto-save to localStorage silently — no UI disruption
        clearTimeout(S._autoSaveTimer);
        S._autoSaveTimer = setTimeout(() => {
          DB.save(D);
          S.unsaved = false;
        }, 800);
      },


      async saveFile() {
        // iOS-safe: always use direct download (no showSaveFilePicker which triggers iOS file picker screen)
        DB.exportFile(D);
        S.unsaved = false;
        setTimeout(() => this._showExportGuidance(), 400);
      },

      // ── Export current month as a standalone shard file ──
      exportCurrentMonthShard() {
        SHARD.exportMonth(offsetMonthStr(0));
      },

      // ── FOLDER BACKUP — ZIP EXPORT ──────────────────────────────
      // Builds a Spend-na/ folder structure using JSZip, triggers .zip download.
      // ZIP: Spend-na/manifest.json, profile.json, limits.json,
      //      transactions/txn_YYYY_Mon.json, sources/sources_YYYY_Mon.json
      async exportZipFolder() {
        toast('📦 Building folder backup…');
        let JSZip;
        try {
          if (!window.JSZip) {
            await new Promise((res, rej) => {
              const s = document.createElement('script');
              s.src = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';
              s.onload = res; s.onerror = rej;
              document.head.appendChild(s);
            });
          }
          JSZip = window.JSZip;
        } catch (e) {
          toast('No internet — using single file backup instead');
          DB.exportFile(D); return;
        }
        try {
          const zip = new JSZip();
          const root = zip.folder('Spend-na');
          const now = new Date().toISOString();
          const months = SHARD.months();
          // manifest.json
          const mf = SHARD.manifest();
          mf.exportedAt = now; mf.app = 'Spend-na'; mf.backupType = 'folder'; mf.totalMonths = months.length;
          root.file('manifest.json', JSON.stringify(mf, null, 2));
          // profile.json
          root.file('profile.json', JSON.stringify({ app: 'Spend-na', schemaVersion: SCHEMA_VERSION, exportedAt: now, profile: D.profile || {}, settings: D.settings || {}, passwordHash: D.passwordHash || '', pushToken: D.pushToken || null, created: D.created || now }, null, 2));
          // limits.json
          root.file('limits.json', JSON.stringify({ app: 'Spend-na', schemaVersion: SCHEMA_VERSION, exportedAt: now, limits: D.limits || {} }, null, 2));
          // transactions/ — one file per month
          const txnFolder = root.folder('transactions');
          months.forEach(monthStr => {
            const txns = SHARD.forMonth(monthStr);
            const safe = monthStr.replace(' ', '_');
            txnFolder.file(`txn_${safe}.json`, JSON.stringify({ app: 'Spend-na', schemaVersion: SCHEMA_VERSION, type: 'monthly-shard', month: monthStr, exportedAt: now, totalRecords: txns.length, total: txns.reduce((s, t) => s + (t.amount || 0), 0), transactions: txns }, null, 2));
          });
          // sources/ — monthly source entries
          const sd = SRC_DB.load();
          if (sd.sources && sd.sources.length > 0) {
            const srcFolder = root.folder('sources');
            const byMonth = sd.sources.reduce((acc, s) => { const m = s.month || 'unknown'; if (!acc[m]) acc[m] = []; acc[m].push(s); return acc; }, {});
            Object.entries(byMonth).forEach(([monthStr, entries]) => {
              srcFolder.file(`sources_${monthStr.replace(' ', '_')}.json`, JSON.stringify({ app: 'Spend-na', type: 'sources-shard', month: monthStr, exportedAt: now, sources: entries }, null, 2));
            });
          }
          const blob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE', compressionOptions: { level: 6 } });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          const dateStr = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-');
          a.href = url; a.download = `Spend-na-backup-${dateStr}.zip`; a.click();
          URL.revokeObjectURL(url);
          localStorage.setItem('sn_last_exported', now);
          S.unsaved = false;
          toast(`✅ Folder backup saved — ${(D.transactions || []).length} records, ${months.length} months`);
        } catch (e) {
          console.error('ZIP export error:', e);
          toast('Export failed — trying single file backup');
          DB.exportFile(D);
        }
      },

      // ── FOLDER BACKUP — ZIP IMPORT ──────────────────────────────
      async importZipFolder() {
        const self = APP; // explicit reference — avoids any this-binding issues in callbacks
        let JSZip;
        try {
          if (!window.JSZip) {
            toast('Loading import library…');
            await new Promise((res, rej) => {
              const s = document.createElement('script');
              s.src = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';
              s.onload = res;
              s.onerror = () => rej(new Error('jszip_load_failed'));
              document.head.appendChild(s);
            });
          }
          JSZip = window.JSZip;
        } catch (e) {
          toast('Could not load ZIP library — are you online?');
          return;
        }

        const file = await new Promise(res => {
          const inp = document.createElement('input');
          inp.type = 'file';
          inp.accept = '.zip,application/zip,application/x-zip-compressed';
          inp.onchange = e => res(e.target.files[0] || null);
          inp.click();
        });
        if (!file) return;

        toast('📂 Reading folder backup…');
        try {
          const zip = await JSZip.loadAsync(file);

          // Validate: must have Spend-na/manifest.json
          const manifestFile = zip.file('Spend-na/manifest.json');
          if (!manifestFile) {
            toast('Not a valid Spend-na folder backup — manifest missing');
            return;
          }
          const manifest = JSON.parse(await manifestFile.async('string'));
          if (manifest.app !== 'Spend-na') {
            toast('Not a Spend-na backup file');
            return;
          }

          // Read profile + limits
          let profileData = {}, limitsData = {};
          const pf = zip.file('Spend-na/profile.json');
          if (pf) { try { profileData = JSON.parse(await pf.async('string')); } catch {} }
          const lf = zip.file('Spend-na/limits.json');
          if (lf) { try { limitsData = JSON.parse(await lf.async('string')); } catch {} }

          // Read all transaction shards
          const allTxns = [];
          const txnFiles = Object.keys(zip.files).filter(n =>
            n.startsWith('Spend-na/transactions/txn_') && n.endsWith('.json')
          );
          for (const fname of txnFiles) {
            try {
              const shard = JSON.parse(await zip.files[fname].async('string'));
              if (Array.isArray(shard.transactions)) allTxns.push(...shard.transactions);
            } catch {}
          }

          // Read sources shards
          const allSources = [];
          const srcFiles = Object.keys(zip.files).filter(n =>
            n.startsWith('Spend-na/sources/') && n.endsWith('.json')
          );
          for (const fname of srcFiles) {
            try {
              const shard = JSON.parse(await zip.files[fname].async('string'));
              if (Array.isArray(shard.sources)) allSources.push(...shard.sources);
            } catch {}
          }

          if (txnFiles.length > 0 && allTxns.length === 0) {
            toast('Backup transaction files appear empty or corrupted');
            return;
          }

          const reconstructed = migrateData({
            app: 'Spend-na', version: 4, schemaVersion: SCHEMA_VERSION,
            created:      profileData.created      || new Date().toISOString(),
            passwordHash: profileData.passwordHash || D?.passwordHash || '',
            profile:      profileData.profile      || {},
            settings:     profileData.settings     || {},
            limits:       limitsData.limits        || {},
            transactions: allTxns,
            pushToken:    profileData.pushToken    || null,
          });

          const monthCount = [...new Set(allTxns.map(t => t.month).filter(Boolean))].length;
          modal(
            '📂 Restore folder backup?',
            `Found ${allTxns.length} transactions across ${monthCount} month${monthCount !== 1 ? 's' : ''}${allSources.length ? ` + ${allSources.length} income sources` : ''}. What would you like to do?`,
            [
              { l: 'Cancel', c: 'mb-nil', a: () => self.cm() },
              { l: 'Replace all data', c: 'mb-ok', a: () => {
                const hash = D.passwordHash;
                D = reconstructed;
                D.passwordHash = hash;
                DB.save(D);
                if (allSources.length) {
                  const existing = SRC_DB.load().sources || [];
                  const map = new Map();
                  [...existing, ...allSources].forEach(s => { if (s.id) map.set(s.id, s); });
                  SRC_DB.save({ sources: Array.from(map.values()) });
                }
                self.cm(); self.r_home();
                toast(`✅ ${allTxns.length} records restored from folder backup`);
              }},
              { l: 'Merge (keep both)', c: 'mb-sec', a: () => {
                const map = new Map();
                [...(D.transactions || []), ...allTxns].forEach(t => { if (!map.has(t.id)) map.set(t.id, t); });
                D.transactions = Array.from(map.values()).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
                if (allSources.length) {
                  const sd = SRC_DB.load();
                  const srcMap = new Map();
                  [...(sd.sources || []), ...allSources].forEach(s => { if (s.id) srcMap.set(s.id, s); });
                  SRC_DB.save({ sources: Array.from(srcMap.values()) });
                }
                DB.save(D); self.cm(); self.r_home();
                toast(`✅ Merged — ${D.transactions.length} total records`);
              }},
            ]
          );
        } catch (e) {
          console.error('ZIP import error:', e);
          toast('Could not read backup — file may be corrupted or not a ZIP');
        }
      },

      _showExportGuidance() {
        const p = detectPlatform();
        let title, body;
        if (p.isIOS && p.isChromeIOS) {
          title = '💾 File saved — find it in Chrome';
          body = `<div style="font-size:13px;line-height:1.7">
        <div style="background:rgba(251,191,36,.12);border-radius:var(--r);padding:12px;margin-bottom:12px;border:1px solid rgba(251,191,36,.30)">
          <div style="font-size:12px;font-weight:700;color:#92400e;margin-bottom:3px">⚠ Chrome hides downloads from the Files app</div>
          <div style="font-size:11px;color:#b45309">Your file is saved but only visible inside Chrome.</div>
        </div>
        <div style="font-size:12px;font-weight:700;color:var(--ink);margin-bottom:8px">To find your file:</div>
        <div style="background:var(--paper);border-radius:var(--r);padding:12px;font-size:12px;line-height:2.2">
          <div>1. Tap Chrome <strong>⋮</strong> menu → <strong>Downloads</strong></div>
          <div>2. Find <strong>spend-na-data.json</strong></div>
          <div>3. Tap → Share → <strong>Save to Files</strong> → Downloads → Save</div>
        </div>
        <div style="margin-top:12px;font-size:11px;color:var(--teal);font-weight:600">💡 Switch to Safari so files always go to the Files app automatically.</div>
      </div>`;
        } else if (p.isIOS) {
          title = '💾 File saved to Files app';
          body = `<div style="font-size:13px;line-height:1.7">
        <div style="background:#f0fdf4;border-radius:var(--r);padding:12px;margin-bottom:12px;border:1px solid #a7f3d0">
          <div style="font-size:12px;font-weight:700;color:#065f46;margin-bottom:3px">✅ ${D.transactions.length} records exported</div>
          <div style="font-size:11px;color:#059669">Saved as spend-na-data.json</div>
        </div>
        <div style="font-size:12px;color:var(--slate)">Open the <strong>Files app</strong> → Downloads to find it. Consider saving to iCloud Drive for an extra backup.</div>
      </div>`;
        } else if (p.isAndroid) {
          title = '💾 File saved to Downloads';
          body = `<div style="font-size:13px;line-height:1.7">
        <div style="background:#f0fdf4;border-radius:var(--r);padding:12px;margin-bottom:12px;border:1px solid #a7f3d0">
          <div style="font-size:12px;font-weight:700;color:#065f46;margin-bottom:3px">✅ ${D.transactions.length} records exported</div>
          <div style="font-size:11px;color:#059669">Saved as spend-na-data.json</div>
        </div>
        <div style="font-size:12px;color:var(--slate)">Open <strong>Files</strong> or <strong>My Files</strong> app → Downloads folder to find it.</div>
      </div>`;
        } else {
          title = '💾 File saved';
          body = `<div style="font-size:13px;color:var(--slate);line-height:1.7">
        <div style="background:#f0fdf4;border-radius:var(--r);padding:12px;border:1px solid #a7f3d0;margin-bottom:12px">
          <div style="font-size:12px;font-weight:700;color:#065f46">✅ ${D.transactions.length} records exported</div>
        </div>
        Check your browser's <strong>Downloads folder</strong> for spend-na-data.json.
      </div>`;
        }
        modal(title, body, [{ l: 'Got it ✓', c: 'mb-ok', a: () => this.cm() }]);
      },

      // ── PHOTO ──
      pickPhoto(ctx) {
        const inp = document.createElement('input'); inp.type = 'file'; inp.accept = 'image/*';
        inp.onchange = e => {
          const f = e.target.files[0]; if (!f) return;
          // Resize before storing (BUG-022: large photos bloat localStorage)
          const reader = new FileReader();
          reader.onload = ev => {
            const img = new Image();
            img.onload = () => {
              const MAX = 200, scale = Math.min(MAX / img.width, MAX / img.height, 1);
              const canvas = document.createElement('canvas');
              canvas.width = img.width * scale; canvas.height = img.height * scale;
              canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
              const uri = canvas.toDataURL('image/jpeg', 0.82);
              if (ctx === 'ob') {
                S.obPhoto = uri;
                const el = document.getElementById('obPhoto');
                el.classList.add('has'); el.innerHTML = `<img src="${uri}" style="width:100%;height:100%;object-fit:cover;border-radius:20px">`;
              } else { D.profile.photo = uri; DB.save(D); this.markUnsaved(); this.refreshTop(); }
            };
            img.src = ev.target.result;
          };
          reader.readAsDataURL(f);
        };
        inp.click();
      },

      // ── TOPBAR ──
      refreshTop() {
        const p = D.profile, h = new Date().getHours();
        const g = h < 12 ? 'Good Morning' : h < 17 ? 'Good Afternoon' : 'Good Evening';
        const fn = p.name.split(' ')[0] || 'Friend';
        const role = ROLES[p.role] || ROLES.working;
        document.getElementById('tbGreet').textContent = g;
        document.getElementById('tbName').textContent = fn;
        document.getElementById('tbRole').textContent = `${role.e} ${role.l}`;
        document.getElementById('tbQuote').textContent = p.quote || 'Every rupee has a story. Make yours count.';
        document.getElementById('tbAv').innerHTML = avHTML(p, 44);
      },

      // ── NAVIGATION ──
      go(tab) {
        // BUG-025: intercept navigation away from limits if there are unsaved changes
        if (S.tab === 'limits' && tab !== 'limits' && limitsAreDirty()) {
          modal('Unsaved changes', 'You have unsaved limit changes. What would you like to do?', [
            { l: 'Discard', c: 'mb-nil', a: () => { this.cm(); S.limVals = { ...D.limits }; this._goNow(tab); } },
            { l: 'Save & Go', c: 'mb-ok', a: () => { this.cm(); this.saveLimits(); } },
          ]);
          return;
        }
        this._goNow(tab);
      },
      _goNow(tab) {
        S.tab = tab;
        // Track current screen on body for FAB visibility
        document.body.className = document.body.className
          .replace(/\bon-\w+-screen\b/g, '').trim();
        document.body.classList.add(`on-${tab}-screen`);
        const topbar = document.getElementById('topbar'), tabbar = document.getElementById('tabBar');
        topbar.style.display = tab === 'home' ? 'block' : 'none';
        tabbar.style.display = ['home', 'insights', 'month', 'history', 'sources', 'add'].includes(tab) ? 'flex' : 'none';
        const map = { home: 'sHome', insights: 'sInsights', month: 'sMonth', history: 'sHist', add: 'sAdd', limits: 'sLimits', settings: 'sSettings', slice: 'sSlice', sources: 'sSources' };
        document.querySelectorAll('.scr').forEach(s => s.classList.remove('on'));
        const el = document.getElementById(map[tab]); if (el) el.classList.add('on');
        document.querySelectorAll('.tab').forEach(t => t.classList.toggle('on', t.dataset.t === tab));
        const fn = 'r_' + tab; if (this[fn]) this[fn]();
      },

      // ── HOME ──
      r_home() {
        this.refreshTop();
        const _curMon = offsetMonthStr(0);
        const sm = summary(_curMon), pend = pending(), lim = D.limits; // BUG-1: scoped to current month
        const _streakHTML = '';
        // BUG-4: show full amount + scale badge on hero
        const _hero = fmtHero(sm.total);
        document.getElementById('hHero').innerHTML = sm.total > 0
          ? `<div class="h-total"><span class="h-tl">This Month</span><span class="h-tv">${_hero.formatted}${_hero.badge ? `<span class="h-badge">${_hero.badge}</span>` : ''}</span></div>`
          : '';
        // insights tab - no badge needed

        // ── Sources indicator (plug-in: only shown if user has added sources this month) ──
        const currentMonthHome = offsetMonthStr(0);
        const sdHome = SRC_DB.load();
        const homeSrcTotal = (sdHome.sources || [])
          .filter(s => s.month === currentMonthHome)
          .reduce((sum, s) => sum + (Number(s.amount) || 0), 0);
        const homeSpendTotal = sm.total;
        const homeBalance = homeSrcTotal - homeSpendTotal;
        const srcIndicatorHTML = homeSrcTotal > 0 ? (() => {
          const nearThresholdHome = homeSrcTotal * 0.1;
          const balColor = homeBalance < 0 ? '#f43f5e' : homeBalance <= nearThresholdHome ? '#f59e0b' : '#10b981';
          const dot = homeBalance < 0 ? '🔴' : homeBalance <= nearThresholdHome ? '🟡' : '🟢';
          return `<div class="dc" onclick="APP.go('sources')">
        <div class="dc-ic" style="background:var(--tealL)">↑</div>
        <div class="dc-info">
          <div class="dc-t">Sources this month: ${fmtF(homeSrcTotal)}</div>
          <div class="dc-s">Spent: ${fmtF(homeSpendTotal)} · Left: <span style="color:${balColor};font-weight:700">${homeBalance < 0 ? '-' : ''}${fmtF(Math.abs(homeBalance))}</span> ${dot}</div>
        </div>
        <div class="dc-ar">›</div>
      </div>`;
        })() : '';

        document.getElementById('hBody').innerHTML = `
      ${_streakHTML}
      ${(() => { // WD-01: was defined but never wired into a render
        try {
          const dismissed = _safeGet('sn_weekly_digest_dismissed', '');
          const wk = new Date().getFullYear() + '-W' + Math.ceil(new Date().getDate()/7);
          if (dismissed === wk) return '';
          const digest = getWeeklyDigest();
          if (!digest) return '';
          return `<button class="pend-btn" onclick="APP.go('history')" style="margin-bottom:8px;position:relative">
            <div class="p-dot" style="background:var(--teal)"></div>
            <div class="p-info"><div class="p-t">📊 Weekly digest</div><div class="p-s">${esc(digest)}</div></div>
            <span onclick="event.stopPropagation();localStorage.setItem('sn_weekly_digest_dismissed','${wk}');APP.r_home();" style="padding:2px 6px;color:var(--mist);font-size:14px">✕</span>
          </button>`;
        } catch(e) { return ''; }
      })()}
      ${pend > 0 ? `<button class="pend-btn" onclick="APP.go('add')"><div class="p-dot"></div><div class="p-info"><div class="p-t">${pend} spend${pend > 1 ? 's' : ''} waiting to sort</div><div class="p-s">Tap to classify into buckets</div></div><div class="p-arr">›</div></button>` : ''}
      <div class="sec-row"><span class="sec-lbl">THIS MONTH</span><button class="sec-lnk" onclick="APP.go('limits')">Limits ›</button></div>
      <div class="bgrid">
        ${(() => {
          const bktEntries = Object.entries(BUCKETS);
          const topBkt = bktEntries.reduce((best,[k]) => {
            return (sm[k]||0) > (sm[best]||0) ? k : best;
          }, bktEntries[0][0]);

          const renderHero = ([k, cfg]) => {
            const amt = sm[k]||0, limit = lim[k]||0;
            const isOver = limit>0 && amt>limit;
            const isNear = limit>0 && amt>=limit*.8 && !isOver;
            const pct = limit>0 ? Math.min((amt/limit)*100,100) : 0;
            const col = isOver ? '#ef4444' : isNear ? '#f59e0b' : cfg.c;
            return `<div class="bc-hero${isOver?' over':''}" onclick="APP.go('month')">
              <div class="bc-top" style="background:${col}"></div>
              <div class="bc-body">
                <div class="bc-ic" style="background:${cfg.cl};color:${cfg.c};border-color:${cfg.cm}">${cfg.g}</div>
                <div class="bc-amt" style="color:${col}">${fmtF(amt)}</div>
                <div class="bc-nm">${cfg.l} ${isOver?'<span style="color:#ef4444;font-size:8px">● OVER LIMIT</span>':''}</div>
                ${limit>0?`<div class="bc-pb" style="background:${cfg.cl}"><div class="bc-pf" style="background:${col};width:${pct}%"></div></div>`:''}
              </div>
            </div>`;
          };

          const renderCompact = ([k, cfg]) => {
            const amt = sm[k]||0, limit = lim[k]||0;
            const isOver = limit>0 && amt>limit;
            const col = isOver ? '#ef4444' : cfg.c;
            return `<div class="bc-compact${isOver?' over':''}" onclick="APP.go('month')">
              <div class="bc-top" style="background:${col}"></div>
              <div class="bc-ic" style="background:${cfg.cl};color:${cfg.c};border-color:${cfg.cm}">${cfg.g}</div>
              <div class="bc-amt" style="color:${col}">${fmt(amt)}</div>
              <div class="bc-nm">${cfg.l}</div>
            </div>`;
          };

          const heroHTML = renderHero([topBkt, BUCKETS[topBkt]]);
          const compactHTML = bktEntries.filter(([k]) => k !== topBkt).map(renderCompact).join('');
          return heroHTML + `<div class="bc-compact-row">${compactHTML}</div>`;
        })()}
      </div>
      <div class="sec-row" style="margin-top:4px"><span class="sec-lbl">MY DATA</span><button class="sec-lnk" onclick="APP.go('history')">All history ›</button></div>
      ${srcIndicatorHTML}
      <div class="foot"><div class="foot-t">🔒 All data stays only on your device</div><a href="http://www.hakki.in" target="_blank" class="foot-lk">© Sandeep Hakki · hakki.in · 2026</a></div>
    `;
      },

      async loadFile() {
        const data = await DB.importFile();
        if (!data) { toast('No file or invalid file'); return; }
        modal('Load data file?', `Found ${data.transactions.length} records from ${data.exportedAt ? esc(new Date(data.exportedAt).toLocaleDateString('en-IN')) : 'unknown date'}. Replace current data?`, [
          { l: 'Cancel', c: 'mb-nil', a: () => this.cm() },
          {
            l: 'Load & Replace', c: 'mb-ok', a: () => {
              // Keep current password, replace all records
              const hash = D.passwordHash;
              D = data;
              D.passwordHash = hash; // Keep current password
              DB.save(D); this.cm(); this.r_home();
              toast(`All ${D.transactions.length} records loaded ✓`);
            }
          },
          {
            l: 'Merge (no duplicates)', c: 'mb-sec', a: () => {
              const map = new Map();
              [...D.transactions, ...data.transactions].forEach(t => { if (!map.has(t.id)) map.set(t.id, t); });
              D.transactions = Array.from(map.values()).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
              DB.save(D); this.cm(); this.r_home();
              toast(`${D.transactions.length} total records after merge ✓`);
            }
          },
        ]);
      },

      // ── SORT ──
      r_sort() {
        const unsorted = (D.transactions || []).filter(t => !t.bucket);
        const sortRingEl = document.getElementById('sortRing');
        const sortSubEl = document.getElementById('sortSub');
        const tBadge = document.getElementById('tBadge');
        if (sortRingEl) sortRingEl.textContent = unsorted.length;
        if (sortSubEl) sortSubEl.textContent = unsorted.length > 0 ? `${unsorted.length} waiting` : 'All sorted!';
        // Hide badge when nothing pending
        if (tBadge) { if (unsorted.length > 0) { tBadge.style.display = 'flex'; document.getElementById('tBadgeN').textContent = unsorted.length; } else tBadge.style.display = 'none'; }
        const listEl = document.getElementById('sortList'), emptyEl = document.getElementById('sortEmpty');
        if (unsorted.length === 0) { listEl.style.display = 'none'; emptyEl.style.display = 'flex'; return; }
        emptyEl.style.display = 'none'; listEl.style.display = 'block';
        listEl.innerHTML = unsorted.map(t => `
      <div class="txc fade-up" id="tc_${t.id}">
        <div class="txc-top">
          <div class="txc-ic">${ico(t.merchant)}</div>
          <div style="flex:1;min-width:0"><div class="txc-nm">${esc(t.merchant)}</div><div class="txc-mt">${t.date} · ${t.time}</div></div>
          <div class="txc-am">${fmtF(t.amount)}</div>
        </div>
        <div class="bkpick">
          ${Object.entries(BUCKETS).map(([k, c]) => `
            <button class="bkp" style="border-color:${c.cl};background:${c.cl}" onclick="APP.classify('${t.id}','${k}')">
              <div class="bkp-ic" style="background:${c.cl};color:${c.c};border-color:${c.cm}">${c.g}</div>
              <span class="bkp-lbl" style="color:${c.c}">${c.l}</span>
            </button>`).join('')}
        </div>
        <div class="txc-del"><button class="txc-del-btn" onclick="APP.delTxn('${t.id}')">Delete</button></div>
      </div>`).join('');
      },
      classify(id, bkt) {
        _txnUpdate(id, { bucket: bkt });
        _commitSave();
        const card = document.getElementById('tc_' + id);
        if (card) { card.style.transition = 'all .28s ease'; card.style.opacity = '0'; card.style.transform = 'translateX(48px)'; setTimeout(() => this.r_sort(), 300); }
        const pend = pending(), badge = document.getElementById('tBadge');
        if (pend > 0) { badge.style.display = 'flex'; document.getElementById('tBadgeN').textContent = pend; } else badge.style.display = 'none';
        toast(`→ ${BUCKETS[bkt].l} ${BUCKETS[bkt].g}`);
      },
      delTxn(id) {
        modal('Delete transaction?', 'Cannot be undone.', [
          { l: 'Cancel', c: 'mb-nil', a: () => this.cm() },
          { l: 'Delete', c: 'mb-err', a: () => { _txnDelete(id); _commitSave('Deleted'); this.cm(); this.r_sort(); } },
        ]);
      },

      // ── MY MONTH ──
      r_month() {
        const off = S.monthOffset || 0;
        const mStr = offsetMonthStr(off);
        const mLong = offsetMonthLong(off);
        const sm = summary(mStr), total = sm.total;
        const isCurrentMonth = off === 0;
        // Update header subtitle with nav arrows
        const subEl = document.getElementById('mmSub');
        if (subEl) subEl.innerHTML = `<button onclick="APP._mmNav(-1)" style="background:none;border:none;cursor:pointer;padding:2px 8px;font-size:14px;color:var(--teal)" aria-label="Previous month">‹</button><span style="font-size:11px;color:var(--slate)">${mLong}</span><button onclick="APP._mmNav(1)" ${isCurrentMonth ? 'disabled aria-disabled="true"' : ''} style="background:none;border:none;padding:2px 8px;font-size:14px;color:${isCurrentMonth ? 'var(--fog)' : 'var(--teal)'};cursor:${isCurrentMonth ? 'not-allowed' : 'pointer'}" aria-label="Next month">›</button>`;
        const bodyEl = document.getElementById('mmBody');
        if (total === 0) {
          bodyEl.innerHTML = `<div class="empty-state"><div style="font-size:48px;margin-bottom:16px">📊</div><div style="font-size:22px;font-weight:800;color:var(--ink);margin-bottom:8px">${isCurrentMonth ? 'Nothing sorted yet' : 'No data for this month'}</div><div style="font-size:14px;color:var(--slate);margin-bottom:28px;line-height:1.6">${isCurrentMonth ? 'Add spends and sort them<br>to see your monthly picture.' : 'No sorted transactions found<br>for ' + mLong + '.'}</div>${isCurrentMonth ? `<button onclick="APP.go('add')" class="btn-teal">Add a spend ›</button>` : ''}</div>`;
          return;
        }
        const txns = (D.transactions || []).filter(t => t.bucket && t.month === mStr);
        const weeks = { W1: {}, W2: {}, W3: {}, W4: {} };
        txns.forEach(t => { const day = parseInt(t.date) || 1; const wk = day <= 7 ? 'W1' : day <= 14 ? 'W2' : day <= 21 ? 'W3' : 'W4'; weeks[wk][t.bucket] = (weeks[wk][t.bucket] || 0) + t.amount; });
        const wMax = Math.max(...Object.values(weeks).map(w => Object.values(w).reduce((a, b) => a + b, 0)), 1);
        bodyEl.innerHTML = `
      <div class="mm-hero">
        <div class="mm-tc"><div class="mm-tl">Total · ${mLong}</div><div class="mm-tv">${fmtF(total)}</div></div>
        <div class="mm-bar" style="margin-top:16px">${Object.entries(BUCKETS).filter(([k]) => sm[k] > 0).map(([k, c]) => `<div class="mm-bs" style="flex:${sm[k]};background:${c.c}"></div>`).join('')}</div>
      </div>
      <div class="mm-body">
        <div class="legend">${Object.entries(BUCKETS).filter(([k]) => sm[k] > 0).map(([k, c]) => `<div style="display:flex;align-items:center;gap:6px"><div class="lg-dot" style="background:${c.c}"></div><div class="lg-lbl">${c.l} ${Math.round((sm[k] / total) * 100)}%</div></div>`).join('')}</div>
        <div class="wk-card">
          <div class="wk-title">Week by Week</div>
          <div class="wk-bars">
            ${Object.entries(weeks).map(([wk, data]) => {
          const wt = Object.values(data).reduce((a, b) => a + b, 0), bh = wMax > 0 ? (wt / wMax) * 78 : 0;
          return `<div class="wk-col"><div class="wk-val">${wt > 0 ? Math.round(wt / 1000) + 'k' : ''}</div><div class="wk-bw"><div class="wk-bi" style="height:${Math.max(bh, 4)}px">${Object.entries(BUCKETS).map(([bk, c]) => { const ba = data[bk] || 0, bh2 = wt > 0 ? (ba / wt) * Math.max(bh, 4) : 0; return ba > 0 ? `<div style="height:${bh2}px;background:${c.c}"></div>` : '' }).join('')}</div></div><div class="wk-lbl">${wk}</div></div>`;
        }).join('')}
          </div>
        </div>
        ${Object.entries(BUCKETS).map(([k, c]) => {
          const amt = sm[k] || 0, pct = total > 0 ? Math.round((amt / total) * 100) : 0, limit = D.limits[k] || 0, isOver = limit > 0 && amt > limit;
          const isExp = S.monthExpanded === k;
          const bTxns = (D.transactions || []).filter(t => t.bucket === k && t.month === mStr).slice(0, 5);
          return `<div style="margin-bottom:8px">
  <div class="brow" style="border-left-color:${c.c};border-left-width:4px;border-radius:${isExp ? '14px 14px 0 0' : '14px'};margin-bottom:0" onclick="APP._toggleMonthRow('${k}')">
    <div class="bc-ic" style="background:${c.cl};color:${c.c};border-color:${c.cm};width:42px;height:42px;flex-shrink:0">${c.g}</div>
    <div class="br-info"><div class="br-nm">${c.l}</div><div class="br-bar"><div class="br-bfill" style="background:${isOver ? '#ef4444' : c.c};width:${pct}%"></div></div><div class="br-tag">${c.t}</div></div>
    <div class="br-right"><div class="br-am" style="color:${isOver ? '#ef4444' : c.c}">${fmtF(amt)}</div><div class="br-pct">${pct}%</div></div>
    <div class="br-chv" style="transform:${isExp ? 'rotate(90deg)' : 'none'};transition:transform .2s">›</div>
  </div>
  ${isExp ? `<div style="background:${c.cl};border-radius:0 0 14px 14px;padding:10px 12px;border:1.5px solid ${c.cm};border-top:none">
    <div style="font-size:9px;font-weight:700;color:${c.c};letter-spacing:1.5px;margin-bottom:8px">TRANSACTIONS · ${mLong}</div>
    ${bTxns.length === 0
                ? `<div style="font-size:12px;color:${c.c};opacity:.6;text-align:center;padding:8px">No transactions this month</div>`
                : bTxns.map(t => `<div style="display:flex;align-items:center;gap:8px;padding:7px 0;border-bottom:1px solid ${c.cm}20">
          <span style="font-size:16px">${ico(t.merchant)}</span>
          <div style="flex:1;min-width:0"><div style="font-size:12px;font-weight:700;color:${c.c};white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(t.merchant)}</div><div style="font-size:9px;color:${c.c};opacity:.7;margin-top:1px">${t.date} · ${t.time}</div></div>
          <div style="font-size:13px;font-weight:700;color:${c.c};flex-shrink:0">${fmtF(t.amount)}</div>
        </div>`).join('')}
    ${bTxns.length > 0 ? `<div onclick="APP.showSlice('${k}')" style="text-align:center;padding:8px 0 2px;font-size:11px;font-weight:700;color:${c.c};cursor:pointer">See all ${(D.transactions || []).filter(t => t.bucket === k && t.month === mStr).length} transactions ›</div>` : ''}
  </div>` : ''}
</div>`;

        }).join('')}
      </div>
      <div id="aiStoryCard" style="display:none" class="ai-story-card">
        <div class="ai-story-eyebrow">📖 YOUR MONTH IN WORDS</div>
        <div class="ai-story-text" id="aiStoryText"></div>
      </div>
      <div id="aiMirrorCard" style="display:none" class="ai-mirror-card">
        <div class="ai-mirror-text" id="aiMirrorText"></div>
        <button class="ai-mirror-btn" id="aiMirrorBtn" onclick="APP.aiMirrorAction()">Update Limit</button>
      </div>`;
      },
      _mmNav(dir) {
        const newOff = (S.monthOffset || 0) + dir;
        if (newOff > 0) return; // Can't go into the future
        S.monthOffset = newOff;
        S.monthExpanded = null; // reset expanded row on month change
        this.r_month();
      },

      _toggleMonthRow(bk) {
        S.monthExpanded = S.monthExpanded === bk ? null : bk;
        this.r_month();
      },

      showSlice(bk) { S.sliceBk = bk; this.go('slice'); },
      r_slice() {
        const k = S.sliceBk, c = BUCKETS[k]; if (!c) { this.go('month'); return; }
        const sm = summary(offsetMonthStr(0)), total = sm.tota // BUG-1l, amt = sm[k] || 0, pct = total > 0 ? Math.round((amt / total) * 100) : 0;
        const month = new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
        document.getElementById('sliceTitle').textContent = c.l;
        const refs = { luxury: { y: 'You treated yourself. Did it feel worth it?', n: 'Maybe next month will be lighter.' }, necessary: { y: 'Your essentials are covered. That\'s what matters.', n: 'Some months cost more. Life happens.' }, committed: { y: 'Obligations fully met. Real discipline.', n: 'A heavy month for commitments.' }, comfortable: { y: 'You lived well. Balance is a skill.', n: 'Small shifts add up. One swap next month.' } };
        const ref = refs[k] || refs.comfortable, btxns = (D.transactions || []).filter(t => t.bucket === k);
        document.getElementById('sliceBody').innerHTML = `
      <div class="sl-hero">
        <div class="sl-ring" style="border-color:${c.c}"><div class="sl-rp" style="color:${c.c}">${pct}%</div><div class="sl-rs">of total</div></div>
        <div class="sl-am">${fmtF(amt)}</div><div class="sl-pd">${c.l} · ${month}</div>
      </div>
      <div class="sl-body">
        <div class="yn-card" id="ynCard">
          <div class="yn-q">Was this a good month?</div><div class="yn-h">Be honest. No judgment here.</div>
          <div class="yn-btns">
            <button class="yn-btn" style="background:var(--nec)" onclick="APP.ynA(true,'${esc(ref.y)}')"><span style="font-size:22px">🙂</span>Yes</button>
            <button class="yn-btn" style="background:var(--slate)" onclick="APP.ynA(false,'${esc(ref.n)}')"><span style="font-size:22px">😕</span>No</button>
          </div>
        </div>
        <div style="margin-top:20px">
          <div style="font-size:10px;font-weight:700;color:var(--slate);letter-spacing:2.5px;margin-bottom:12px">TRANSACTIONS (${btxns.length})</div>
          ${btxns.length === 0 ? '<div style="font-size:14px;color:var(--slate);text-align:center;padding:20px">None this month</div>' : btxns.map(t => `<div style="background:var(--card);border-radius:var(--r);padding:12px;display:flex;align-items:center;gap:10px;margin-bottom:8px;border:1px solid var(--fog)"><span style="font-size:20px">${ico(t.merchant)}</span><div style="flex:1;min-width:0"><div style="font-size:13px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(t.merchant)}</div><div style="font-size:10px;color:var(--mist)">${t.date}</div></div><div style="font-size:15px;font-weight:800;color:${c.c}">${fmtF(t.amount)}</div></div>`).join('')}
        </div>
      </div>`;
      },
      ynA(yes, msg) { document.getElementById('ynCard').innerHTML = `<div style="text-align:center"><div style="font-size:40px;margin-bottom:14px">${yes ? '🙂' : '😕'}</div><div style="font-size:15px;color:var(--ink);line-height:1.7;font-weight:500">${msg}</div><button onclick="APP.r_slice()" style="margin-top:18px;font-size:12px;color:var(--teal);font-weight:700;background:none;border:none;cursor:pointer">Change answer</button></div>`; },


      // ── INSIGHTS ──
      r_insights() {
        const txns = D.transactions || [];
        const now = new Date();
        const month = now.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
        document.getElementById('insightsSub').textContent = month;
        const body = document.getElementById('insightsBody');

        if (txns.length === 0) {
          body.innerHTML = `<div class="ins-empty">
        <div style="font-size:48px;margin-bottom:16px">◈</div>
        <div style="font-size:20px;font-weight:800;color:var(--ink);margin-bottom:8px">No insights yet</div>
        <div style="font-size:14px;color:var(--slate);text-align:center;line-height:1.6;margin-bottom:24px">Add some spends and<br>insights will appear here.</div>
        <button onclick="APP.go('add')" class="btn-teal">Add first spend ›</button>
      </div>`;
          return;
        }

        // ── Summary ──
        const sorted = txns.filter(t => t.bucket);
        const total = sorted.reduce((s, t) => s + t.amount, 0);
        const bTotals = {};
        Object.keys(BUCKETS).forEach(k => bTotals[k] = 0);
        sorted.forEach(t => { bTotals[t.bucket] = (bTotals[t.bucket] || 0) + t.amount; });

        // ── Spending Personality ──
        const luxPct = total > 0 ? (bTotals.luxury / total) * 100 : 0;
        const comPct = total > 0 ? (bTotals.committed / total) * 100 : 0;
        const necPct = total > 0 ? (bTotals.necessary / total) * 100 : 0;
        const cftPct = total > 0 ? (bTotals.comfortable / total) * 100 : 0;
        let personality, pIcon, pColor, pDesc;
        if (luxPct > 30) {
          personality = 'Luxury Lover'; pIcon = '✨'; pColor = 'var(--lux)';
          pDesc = 'More than 30% goes to splurge. Every spend is a choice — make it count.';
        } else if (comPct > 50) {
          personality = 'Commitment First'; pIcon = '🏦'; pColor = 'var(--com)';
          pDesc = 'Over half your money goes to fixed obligations. Disciplined, but watch flexibility.';
        } else if (necPct > 60) {
          personality = 'Essential Spender'; pIcon = '🏠'; pColor = 'var(--nec)';
          pDesc = 'Most money covers survival needs. You keep things lean and real.';
        } else if (cftPct > 35) {
          personality = 'Comfort Seeker'; pIcon = '🛍'; pColor = 'var(--cft)';
          pDesc = 'Lifestyle spending is dominant. You enjoy life — just keep an eye on the balance.';
        } else {
          personality = 'Balanced Spender'; pIcon = '⚖️'; pColor = 'var(--teal)';
          pDesc = 'Your money is spread across buckets. No single area dominates — that is healthy.';
        }

        // ── Top bucket ──
        const topBkt = Object.entries(bTotals).sort((a, b) => b[1] - a[1])[0];
        const topCfg = BUCKETS[topBkt[0]];

        // ── Weekly breakdown ──
        const weeks = { W1: 0, W2: 0, W3: 0, W4: 0 };
        sorted.forEach(t => {
          const day = parseInt(t.date) || 1;
          const wk = day <= 7 ? 'W1' : day <= 14 ? 'W2' : day <= 21 ? 'W3' : 'W4';
          weeks[wk] += t.amount;
        });
        const wEntries = Object.entries(weeks).filter(([, v]) => v > 0);
        const bestWk = wEntries.length ? wEntries.reduce((a, b) => a[1] < b[1] ? a : b) : null;
        const worstWk = wEntries.length ? wEntries.reduce((a, b) => a[1] > b[1] ? a : b) : null;

        // ── Streak (days with at least one transaction) ──
        const days = new Set(txns.map(t => t.date));
        const streak = days.size;

        // ── Sharp insight ──
        const top2 = Object.entries(bTotals).sort((a, b) => b[1] - a[1]).slice(0, 2);
        const top2pct = total > 0 ? Math.round(((top2[0][1] + top2[1][1]) / total) * 100) : 0;
        const avgSpend = txns.length > 0 ? Math.round(total / txns.length) : 0;
        const mostFreq = {};
        txns.forEach(t => { mostFreq[t.merchant] = (mostFreq[t.merchant] || 0) + 1; });
        const topMerchant = Object.entries(mostFreq).sort((a, b) => b[1] - a[1])[0];
        let sharpText;
        if (top2pct > 80 && top2.length === 2) {
          sharpText = `${top2pct}% of your total money went to just 2 buckets — ${BUCKETS[top2[0][0]].l} and ${BUCKETS[top2[1][0]].l}.`;
        } else if (topMerchant && topMerchant[1] >= 3) {
          sharpText = `"${topMerchant[0]}" appears ${topMerchant[1]} times — your most frequent spend this month.`;
        } else if (avgSpend > 0) {
          sharpText = `Your average spend per transaction is ${fmtF(avgSpend)}. ${avgSpend > 500 ? 'Each entry carries real weight.' : 'Small amounts — but they add up fast.'}`;
        } else {
          sharpText = `You have ${txns.length} transactions recorded. Every entry is a step toward clarity.`;
        }

        // ── Monthly history (last 4 months) ──
        const mHistory = {};
        txns.forEach(t => {
          const mk = t.month || 'Unknown';
          mHistory[mk] = (mHistory[mk] || 0) + t.amount;
        });
        const mEntries = Object.entries(mHistory).slice(-4);
        const mMax = Math.max(...mEntries.map(([, v]) => v), 1);

        // ── Limits check ──
        const overLimit = Object.entries(D.limits).filter(([k, v]) => v > 0 && bTotals[k] > v);
        const nearLimit = Object.entries(D.limits).filter(([k, v]) => v > 0 && bTotals[k] >= v * BUDGET_WARN_PCT && bTotals[k] <= v);

        // ── Tag summary (lifetime totals across ALL months) ──
        const tagTotals = {};
        const tagCounts = {};
        (D.transactions || []).forEach(t => {
          if (!(Number(t.amount) > 0)) return; // skip 0-amount — no meaningful spend (F-013)
          (t.tags || []).forEach(tag => {
            tagTotals[tag] = (tagTotals[tag] || 0) + (Number(t.amount) || 0);
            tagCounts[tag] = (tagCounts[tag] || 0) + 1;
          });
        });
        // Sort by amount descending (U-015)
        const tagEntries = Object.entries(tagTotals).sort((a, b) => b[1] - a[1]);

        body.innerHTML = `
      <!-- PERSONALITY (v5.0 redesign) -->
      <div class="personality-badge">
        <div class="personality-label">YOUR SPENDING PERSONALITY</div>
        <div class="personality-title">${pIcon} ${personality}</div>
        <div class="personality-desc">${pDesc}</div>
      </div>

      <!-- SHARP INSIGHT -->
      <div class="ins-sharp">
        <div class="ins-sharp-label">◈ THIS MONTH'S INSIGHT</div>
        <div class="ins-sharp-text">${sharpText}</div>
      </div>

      <!-- STATS ROW -->
      <div class="ins-stat-row">
        <div class="ins-stat">
          <div class="ins-stat-val">${txns.length}</div>
          <div class="ins-stat-lbl">Total entries</div>
          <div class="ins-stat-sub" style="color:var(--teal)">${sorted.length} sorted</div>
        </div>
        <div class="ins-stat">
          <div class="ins-stat-val">${streak}</div>
          <div class="ins-stat-lbl">Days recorded</div>
          <div class="ins-stat-sub" style="color:var(--ok)">Keep the habit</div>
        </div>
      </div>

      <!-- BUCKET BREAKDOWN -->
      <div class="ins-card">
        <div class="ins-card-title">WHERE YOUR MONEY WENT</div>
        ${Object.entries(BUCKETS).map(([k, c]) => {
          const amt = bTotals[k] || 0;
          const pct = total > 0 ? Math.round((amt / total) * 100) : 0;
          const lim = D.limits[k] || 0;
          const isOver = lim > 0 && amt > lim;
          const isNear = lim > 0 && amt >= lim * BUDGET_WARN_PCT && !isOver;
          return `<div class="ins-bar-row">
            <div class="ins-bar-label">${c.l}</div>
            <div class="ins-bar-track">
              <div class="ins-bar-fill" style="background:${isOver ? 'var(--err)' : isNear ? 'var(--warn)' : c.c};width:${pct}%"></div>
            </div>
            <div class="ins-bar-val" style="color:${isOver ? 'var(--err)' : c.c}">${pct}%</div>
          </div>`;
        }).join('')}
        ${overLimit.length > 0 ? `<div style="background:var(--luxL);border-radius:var(--r);padding:10px 12px;margin-top:8px;font-size:12px;color:var(--err);font-weight:600">⚠️ Over budget in: ${overLimit.map(([k]) => BUCKETS[k].l).join(', ')}</div>` : ''}
        ${nearLimit.length > 0 && overLimit.length === 0 ? `<div style="background:var(--cftL);border-radius:var(--r);padding:10px 12px;margin-top:8px;font-size:12px;color:var(--cft);font-weight:600">⚡ Near limit: ${nearLimit.map(([k]) => BUCKETS[k].l).join(', ')}</div>` : ''}
      </div>

      <!-- TOP + WEEKLY STATS -->
      <div class="ins-stat-row">
        <div class="ins-stat">
          <div style="font-size:20px;margin-bottom:4px">${topCfg.g}</div>
          <div class="ins-stat-val" style="font-size:16px;color:${topCfg.c}">${topCfg.l}</div>
          <div class="ins-stat-lbl">Top bucket</div>
          <div class="ins-stat-sub" style="color:${topCfg.c}">${fmtF(topBkt[1])}</div>
        </div>
        ${worstWk ? `<div class="ins-stat">
          <div style="font-size:20px;margin-bottom:4px">📅</div>
          <div class="ins-stat-val" style="font-size:16px">${worstWk[0]}</div>
          <div class="ins-stat-lbl">Heaviest week</div>
          <div class="ins-stat-sub" style="color:var(--lux)">${fmtF(worstWk[1])}</div>
        </div>` : '<div class="ins-stat"><div class="ins-stat-lbl" style="margin-top:8px">Add more spends to see weekly patterns</div></div>'}
      </div>

      <!-- MONTHLY HISTORY -->
      ${mEntries.length > 1 ? `<div class="ins-card">
        <div class="ins-card-title">MONTH BY MONTH</div>
        <div class="mcomp-bars">
          ${mEntries.map(([mon, amt]) => {
          const h = Math.max((amt / mMax) * 70, 6);
          const isThis = mon === now.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
          return `<div class="mcomp-col">
              <div class="mcomp-val">${amt >= 1000 ? Math.round(amt / 1000) + 'k' : amt}</div>
              <div class="mcomp-bar" style="height:${h}px;background:${isThis ? 'var(--teal)' : 'var(--fog)'};border:${isThis ? 'none' : '1px solid var(--cardB)'}"></div>
              <div class="mcomp-lbl" style="color:${isThis ? 'var(--teal)' : 'var(--slate)'};font-weight:${isThis ? 700 : 500}">${mon.split(' ')[0]}</div>
            </div>`;
        }).join('')}
        </div>
      </div>` : ''}

      <!-- SPENDING BY TAG — only shown when tagged transactions exist (UI-039) -->
      ${tagEntries.length > 0 ? `
      <div class="tag-sum-card">
        <div class="ins-card-title">SPENDING BY TAG</div>
        ${tagEntries.map(([tag, amt]) => `
          <div class="tag-sum-row">
            <div>
              <div class="tag-sum-name">#${esc(tag)}</div>
              <div class="tag-sum-count">${tagCounts[tag]} transaction${tagCounts[tag] !== 1 ? 's' : ''}</div>
            </div>
            <div class="tag-sum-amt">${fmtF(amt)}</div>
          </div>`).join('')}
      </div>` : ''}

      <!-- CATEGORY CREEP (v5.0) -->
      ${(() => {
        try {
          const creepResults = detectCategoryCreep();
          if (!creepResults || creepResults.length === 0) return '';
          return creepResults.map(({k, pct, latest}) => {
            const cfg = BUCKETS[k];
            const projected = Math.round(latest * 1.08);
            return `<div class="creep-card">
              <div class="creep-title">📈 Category Creep: ${cfg.l}</div>
              <div class="creep-body">${cfg.l} spending has grown ${pct}% over 3 months. At this rate it crosses ${fmtF(projected)} by next month.</div>
            </div>`;
          }).join('');
        } catch(e) { return ''; }
      })()}

      <!-- SPEND TWIN (ST-01) — was defined but never wired into a render -->
      ${(() => {
        try {
          const twin = generateSpendTwin(offsetMonthStr(0));
          if (!twin) return '';
          const delta = total - twin.total;
          const pct = twin.total > 0 ? Math.round((delta / twin.total) * 100) : 0;
          const arrow = delta > 0 ? '▲' : delta < 0 ? '▼' : '—';
          const col = delta > 0 ? 'var(--err)' : delta < 0 ? 'var(--ok)' : 'var(--slate)';
          return `<div class="ins-card">
            <div class="ins-card-title">👫 SPEND TWIN — vs ${esc(twin.month)}</div>
            <div style="font-size:12px;color:var(--slate);line-height:1.6">
              That month had a similar spending shape (${twin.similarity}% match).
              You spent <span style="font-weight:700;color:${col}">${arrow} ${Math.abs(pct)}%</span>
              ${delta >= 0 ? 'more' : 'less'} this month — ${fmtF(total)} vs ${fmtF(twin.total)}.
            </div>
          </div>`;
        } catch(e) { return ''; }
      })()}

      <!-- DAY-OF-WEEK SPEND (DOW-01) — new, passive display, no toggle -->
      ${(() => {
        try {
          const dowTotals = [0,0,0,0,0,0,0];
          txns.forEach(t => {
            if (!t.date) return;
            const d = new Date(t.date + 'T12:00:00');
            if (isNaN(d)) return;
            dowTotals[d.getDay()] += (Number(t.amount) || 0);
          });
          const maxDow = Math.max(...dowTotals, 1);
          const dowNames = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
          if (dowTotals.every(v => v === 0)) return '';
          return `<div class="ins-card">
            <div class="ins-card-title">📅 SPEND BY DAY OF WEEK</div>
            <div style="display:flex;flex-direction:column;gap:6px;margin-top:4px">
              ${dowNames.map((nm, i) => `<div style="display:flex;align-items:center;gap:8px">
                <div style="width:30px;font-size:11px;color:var(--slate);flex-shrink:0">${nm}</div>
                <div style="flex:1;background:var(--fog);border-radius:4px;overflow:hidden;height:10px">
                  <div style="width:${Math.round((dowTotals[i]/maxDow)*100)}%;height:100%;background:var(--teal)"></div>
                </div>
                <div style="width:64px;font-size:11px;color:var(--ink);text-align:right;flex-shrink:0">${fmtF(dowTotals[i])}</div>
              </div>`).join('')}
            </div>
            <div style="font-size:11px;color:var(--mist);margin-top:8px">Heavy days may reflect recurring bills or large one-time purchases.</div>
          </div>`;
        } catch(e) { return ''; }
      })()}

      <!-- FOOTER NOTE -->
      <div style="text-align:center;padding:12px 0 4px">
        <div style="font-size:11px;color:var(--mist);line-height:1.8">Insights are based on your sorted transactions.<br>Sort more spends for sharper patterns.</div>
      </div>
    `;
      },

      shareMonth() {
        const _curMonShare = offsetMonthStr(0);
        const sm = summary(_curMonShare), month = new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }); // BUG-1
        const txns = (D.transactions || []).filter(t => t.bucket && t.month === _curMonShare); // BUG-1: current month only
        if (txns.length === 0) { toast('No sorted transactions to share yet'); return; }
        const total = sm.total;
        const bCards = Object.entries(BUCKETS).map(([k, c]) => { const amt = sm[k] || 0, pct = total > 0 ? Math.round((amt / total) * 100) : 0, lim = D.limits[k] || 0, isOver = lim > 0 && amt > lim; return `<div style="flex:1;min-width:120px;background:${c.cl};border-radius:12px;padding:14px;border:2px solid ${isOver ? '#ef4444' : c.cm}"><div style="font-size:10px;color:${c.c};font-weight:700;letter-spacing:1px">${c.l.toUpperCase()}</div><div style="font-size:20px;font-weight:800;color:${isOver ? '#ef4444' : c.c};margin-top:6px">₹${amt.toLocaleString('en-IN')}</div><div style="font-size:11px;color:rgba(255,255,255,.55);margin-top:2px">${pct}%${lim > 0 ? ` of ₹${lim.toLocaleString('en-IN')} limit` : ''}</div>${isOver ? `<div style="font-size:10px;color:#ef4444;font-weight:700;margin-top:4px">⚠ OVER LIMIT</div>` : ''}</div>`; }).join('');
        const rows = txns.map(t => { const cfg = BUCKETS[t.bucket]; return `<tr><td>${t.date}</td><td><strong>${t.merchant}</strong></td><td style="text-align:right;font-weight:700">₹${t.amount.toLocaleString('en-IN')}</td><td style="text-align:center"><span style="background:${cfg.cl};color:${cfg.c};font-size:11px;font-weight:700;padding:3px 8px;border-radius:6px">${cfg.l}</span></td></tr>`; }).join('');
        const html = _buildReportHtml({ eyebrow: 'MY MONTH', title: month, amount: total.toLocaleString('en-IN'), subtitle: `${txns.length} sorted transactions`, bCards, rows, txnCount: `Transactions this month (${txns.length})` });
        const fname = `spend-na-my-month-${month.replace(/\s+/g, '-')}.html`;
        const blob = new Blob([html], { type: 'text/html' });
        if (navigator.share && navigator.canShare && navigator.canShare({ files: [new File([html], fname, { type: 'text/html' })] })) {
          navigator.share({ files: [new File([html], fname, { type: 'text/html' })], title: `My Month — ${month}`, text: `My spending for ${month}: ₹${total.toLocaleString('en-IN')}` }).catch(() => { });
        } else {
          const u = URL.createObjectURL(blob), a = document.createElement('a'); a.href = u; a.download = fname; document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(u);
          toast('Month report saved!');
        }
      },

      // ── ANNUAL WRAP ──
      showAnnualWrap() {
        const txns = D.transactions || [];
        if (txns.length < 5) { toast('Not enough data for Annual Wrap yet'); return; }
        const total = txns.reduce((s,t)=>s+t.amount,0);
        const biggest = txns.reduce((best,t) => t.amount>(best.amount||0)?t:best, {});
        const merchants = {};
        txns.forEach(t => { if(t.merchant) merchants[t.merchant]=(merchants[t.merchant]||0)+1; });
        const topMerchant = Object.entries(merchants).sort((a,b)=>b[1]-a[1])[0];
        const monthTotals = {};
        txns.forEach(t => { monthTotals[t.month]=(monthTotals[t.month]||0)+t.amount; });
        const bestMonth = Object.entries(monthTotals).sort((a,b)=>a[1]-b[1])[0];
        const worstMonth = Object.entries(monthTotals).sort((a,b)=>b[1]-a[1])[0];
        document.getElementById('awBody').innerHTML = `
          <div class="aw-card"><div class="aw-label">Total Tracked</div>
            <div class="aw-value">${fmtF(total)}</div>
            <div class="aw-sub">${txns.length} transactions</div></div>
          <div class="aw-card"><div class="aw-label">Biggest Spend</div>
            <div class="aw-value">${fmtF(biggest.amount||0)}</div>
            <div class="aw-sub">${esc(biggest.merchant||'Unknown')}</div></div>
          <div class="aw-card"><div class="aw-label">Most Frequent</div>
            <div class="aw-value">${esc(topMerchant?.[0]||'–')}</div>
            <div class="aw-sub">${topMerchant?.[1]||0} times</div></div>
          <div class="aw-card"><div class="aw-label">Best Month</div>
            <div class="aw-value">${fmtF(bestMonth?.[1]||0)}</div>
            <div class="aw-sub">${esc(bestMonth?.[0]||'–')}</div></div>
          <div class="aw-card"><div class="aw-label">Heaviest Month</div>
            <div class="aw-value">${fmtF(worstMonth?.[1]||0)}</div>
            <div class="aw-sub">${esc(worstMonth?.[0]||'–')}</div></div>
          <div class="aw-card"><div class="aw-label">Daily Average</div>
            <div class="aw-value">${fmtF(Math.round(total/Math.max(1,txns.length)))}</div>
            <div class="aw-sub">per transaction</div></div>
        `;
        this.show('pgAnnualWrap');
      },

      shareAnnualWrap() {
        const txns = D.transactions || [];
        const total = txns.reduce((s,t)=>s+t.amount,0);
        const text = `🎉 My Year in Rupees — Spend-na\nTotal: ${fmtF(total)}\n${txns.length} transactions tracked\nTracked with Spend-na · hakki.in`;
        if (navigator.share) { navigator.share({ title: 'My Year in Rupees', text }).catch(()=>{}); }
        else { navigator.clipboard.writeText(text).then(()=>toast('Copied!')).catch(()=>toast('Share not available')); }
      },

      // ── HISTORY ──
      // ── HISTORY ──
      r_history() {
        const all = D.transactions || [];
        document.getElementById('histCnt').textContent = `${all.length} transaction${all.length !== 1 ? 's' : ''}`;
        // IMP-1: init sort + expand state
        if (!S.histSort) S.histSort = 'date';
        if (!S.histExpanded) S.histExpanded = {};

        const fbar = document.getElementById('fBar');
        if (!fbar.hasChildNodes()) {
          const allUsedTags = [...new Set((D.transactions || []).flatMap(t => t.tags || []))].sort();
          const pills = [
            { k: null, l: 'All' },
            ...Object.entries(BUCKETS).map(([k, v]) => ({ k, l: v.l })),
            ...allUsedTags.map(tag => ({ k: `tag:${tag}`, l: `#${tag}` }))
          ];
          fbar.innerHTML = pills.map(p => {
            const on = S.histF === p.k;
            const cfg = p.k && !p.k.startsWith('tag:') && BUCKETS[p.k];
            const isTag = p.k && p.k.startsWith('tag:');
            return `<button class="fp${on ? ' on' : ''}${isTag ? ' tag-fp' : ''}" style="${on ? (cfg ? `border-color:${cfg.c};background:${cfg.c}` : isTag ? `border-color:var(--teal);background:var(--teal)` : `border-color:var(--teal);background:var(--teal)`) : ''}" data-filterkey="${esc(p.k || '')}">${esc(p.l)}</button>`;
          }).join('');
        }

        const q = (document.getElementById('srchIn')?.value || '').toLowerCase();
        const _searchTerms = typeof expandSearchQuery === 'function' ? expandSearchQuery(q) : [q].filter(Boolean); // HR-05: null guard
        const filt = all.filter(t => {
          const ms = !q || _searchTerms.some(term => (t.merchant||'').toLowerCase().includes(term) || String(t.amount).includes(term));
          const mb = S.histF == null ? true
            : S.histF.startsWith('tag:') ? (t.tags || []).includes(S.histF.slice(4))
                : t.bucket === S.histF;
          return ms && mb;
        });

        const grp = {}; filt.forEach(t => { const k = t.month || 'Unknown'; if (!grp[k]) grp[k] = []; grp[k].push(t); });
        const listEl = document.getElementById('histList');

        // IMP-1: sort bar HTML
        const sortBar = `<div style="display:flex;gap:8px;padding:0 0 12px">
          <button onclick="APP.setHistSort('date')" style="padding:6px 14px;border-radius:20px;font-size:12px;font-weight:700;border:1.5px solid ${S.histSort==='date'?'var(--teal)':'var(--fog)'};background:${S.histSort==='date'?'var(--tealL)':'var(--card)'};color:${S.histSort==='date'?'var(--tealD)':'var(--slate)'};cursor:pointer;font-family:var(--ff)">Date \u2193</button>
          <button onclick="APP.setHistSort('bucket')" style="padding:6px 14px;border-radius:20px;font-size:12px;font-weight:700;border:1.5px solid ${S.histSort==='bucket'?'var(--teal)':'var(--fog)'};background:${S.histSort==='bucket'?'var(--tealL)':'var(--card)'};color:${S.histSort==='bucket'?'var(--tealD)':'var(--slate)'};cursor:pointer;font-family:var(--ff)">Bucket</button>
        </div>`;

        if (filt.length === 0) {
          const isEmpty = all.length === 0;
          listEl.innerHTML = sortBar + `<div class="empty-state"><div style="font-size:52px;margin-bottom:16px">${isEmpty ? '\u{1F4B8}' : '\u{1F50D}'}</div><div style="font-size:18px;font-weight:800;color:var(--ink);margin-bottom:8px">${isEmpty ? 'No transactions yet' : 'Nothing found'}</div><div style="font-size:14px;color:var(--slate);line-height:1.6">${isEmpty ? 'Add your first spend<br>to start tracking your money.' : 'Try a different search<br>or filter.'}</div>${isEmpty ? `<button onclick="APP.go('add')" style="margin-top:24px;background:var(--teal);border:none;border-radius:var(--r);padding:12px 24px;font-size:14px;font-weight:700;color:#fff;cursor:pointer">Add a spend \u203a</button>` : ''}</div>`;
          return;
        }

        const BUCKET_ORDER = ['necessary','committed','comfortable','luxury'];
        const nowMonKey = new Date().toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });

        const txnCard = (t) => {
          const cfg = t.bucket ? BUCKETS[t.bucket] : null;
          const tTags = t.tags || [];
          return `<div class="htxn-wrap" data-txid="${t.id}">
              <div class="htxn" id="ht_${t.id}" data-bucket="${esc(t.bucket||'')}">
                <div class="htxn-row">
                  <div class="htxn-ic">${ico(t.merchant)}</div>
                  <div class="htxn-info">
                    <div class="htxn-nm">${esc(t.merchant)}</div>
                    <div class="htxn-meta">
                      <span class="htxn-dt">${t.date} \u00b7 ${t.time}</span>
                      ${cfg ? `<span class="htxn-bkt htxn-bkt-${t.bucket}">${cfg.l}</span>` : ''}
                    </div>
                    ${tTags.length>0 ? `<div style="display:flex;flex-wrap:wrap;gap:4px;margin-top:5px">${tTags.map(tag=>`<span class="tag-pill">#${esc(tag)}</span>`).join('')}</div>` : ''}
                  </div>
                  <div class="htxn-right">
                    <div class="htxn-am">${fmtF(t.amount)}</div>
                    <div class="htxn-src">${esc(t.source||'')}</div>
                    <div class="htxn-acts">
                      <button class="h-edit" onclick="APP.tgEdit('${t.id}')">Edit</button>
                      <span style="color:var(--fog)">|</span>
                      <button class="h-del" onclick="APP.hDel('${t.id}')">Del</button>
                      <span style="color:var(--fog)">|</span>
                      <button onclick="APP.aiWhyThis('${t.id}')" title="Why did I buy this?" style="font-size:13px;background:none;border:none;cursor:pointer;padding:2px 4px;opacity:.65;font-family:var(--ff)">&#x2728;</button>
                    </div>
                  </div>
                </div>
                <div class="ie-box" id="ie_${t.id}" style="display:none">
                  <label class="ie-lbl" style="display:block;margin-bottom:4px">DATE</label>
                  <div style="display:flex;gap:8px;margin-bottom:10px">
                    <input class="s-in" style="font-size:13px;padding:8px 10px;flex:1" type="text" id="ie-date-${t.id}" value="${esc(t.date||'')}" maxlength="20" placeholder="e.g. 23 Mar" inputmode="text">
                    <button onclick="APP.hSaveDate('${t.id}')" class="btn-teal-sm">Save Date</button>
                  </div>
                  <label class="ie-lbl" style="display:block;margin-bottom:4px">DESCRIPTION</label>
                  <input class="s-in" style="font-size:13px;padding:8px 10px;margin-bottom:10px" type="text" id="ie-desc-${t.id}" value="${esc(t.merchant||'')}" maxlength="60" placeholder="e.g. Swiggy, Coffee">
                  <button onclick="APP.hSaveDesc('${t.id}')" style="margin-bottom:12px;width:100%;background:var(--teal);color:#fff;border:none;border-radius:var(--r);padding:9px;font-size:13px;font-weight:700;cursor:pointer;font-family:var(--ff)">Save Description \u2713</button>
                  <span class="ie-lbl">CHANGE BUCKET</span>
                  <div class="ie-row">${Object.entries(BUCKETS).map(([bk,bc])=>{const on=t.bucket===bk;return `<button class="ie-btn" style="${on?`border-color:${bc.c};background:${bc.cl}`:''}" onclick="APP.hClassify('${t.id}','${bk}')"><div class="ie-ic" style="background:${bc.cl};color:${bc.c};border-color:${bc.cm}">${bc.g}</div><span class="ie-lb2" style="${on?`color:${bc.c};font-weight:800`:''}"> ${bc.l}</span></button>`;}).join('')}</div>
                  <span class="ie-lbl" style="margin-top:12px;display:block">TAGS</span>
                  <div class="tag-chips" id="iet_${t.id}">${PRESET_TAGS.map(tag=>{const on=tTags.includes(tag);return `<button class="tag-chip${on?' on':''}" onclick="APP.hToggleTag('${t.id}','${esc(tag)}')">#${esc(tag)}</button>`;}).join('')}</div>
                  <div class="tag-chip-custom" style="margin-top:8px">
                    <input class="tag-custom-in" id="ietc_${t.id}" type="text" inputmode="text" maxlength="30" placeholder="Custom tag\u2026" autocorrect="off" autocapitalize="none" spellcheck="false" onkeydown="if(event.key==='Enter'){event.preventDefault();APP.hAddCustomTag('${t.id}');}">
                    <button class="tag-add-btn" onclick="APP.hAddCustomTag('${t.id}')">Add</button>
                  </div>
                  <div id="iet_sel_${t.id}" style="display:flex;flex-wrap:wrap;gap:4px;margin-top:8px">
                    ${tTags.map(tag=>`<span class="tag-pill">#${esc(tag)}<button class="tag-pill-rm" onclick="APP.hToggleTag('${t.id}','${esc(tag)}')">\u00d7</button></span>`).join('')}
                  </div>
                </div>
              </div>
              <div class="htxn-actions-reveal">
                <button class="hact-move" onclick="APP.tgEdit('${t.id}');(document.querySelector('.htxn-wrap[data-txid=&quot;${t.id}&quot;]')||{classList:{remove:()=>{}}}).classList.remove('swiped')"><span>\u2195\ufe0f</span>Move</button>
                <button class="hact-del" onclick="APP.hSwipeDel('${t.id}')"><span>\U0001f5d1\ufe0f</span>Delete</button>
              </div>
            </div>`;
        };

        listEl.innerHTML = sortBar + Object.entries(grp).map(([mon, items]) => {
          const grpTotal = items.reduce((s,t)=>s+t.amount,0);
          const safeKey = mon.replace(/\s+/g,'-');
          const isCurrentMonth = mon === nowMonKey;
          const expanded = S.histExpanded[mon] !== undefined ? S.histExpanded[mon] : isCurrentMonth;
          const arrow = expanded ? '\u25be' : '\u25b8';
          let displayItems = [...items];
          if (S.histSort === 'bucket') {
            displayItems.sort((a,b) => {
              const ai = BUCKET_ORDER.indexOf(a.bucket||''), bi = BUCKET_ORDER.indexOf(b.bucket||'');
              return (ai===-1?99:ai)-(bi===-1?99:bi);
            });
          }
          return `<div>
            <div class="mgrp-hdr" onclick="APP.toggleMonthGroup('${esc(mon)}')" style="cursor:pointer;user-select:none">
              <div class="mgrp-nm"><span id="mgrp-arrow-${safeKey}" style="margin-right:6px;font-size:12px">${arrow}</span>${esc(mon)}</div>
              <div class="mgrp-tot">${fmtF(grpTotal)}</div>
            </div>
            <div id="mgrp-body-${safeKey}" style="display:${expanded?'':'none'}">
              ${displayItems.map(txnCard).join('')}
            </div>
          </div>`;
        }).join('');

        // BUG-7: re-attach filter pill listeners
        document.getElementById('fBar').querySelectorAll('.fp').forEach(function(btn) {
          btn.addEventListener('click', function() { APP.setHF(btn.dataset.filterkey); });
        });
        // FIX-6C: swipe gestures — HR-03: cleanup old listeners before re-attaching
        if (listEl._swipeCleanup) listEl._swipeCleanup();
        (function initSwipeActions(container) {
          let startX=0,startY=0,activeWrap=null; // LW-02: let not var
          function onSwipeStart(e){startX=e.touches[0].clientX;startY=e.touches[0].clientY;activeWrap=e.target.closest('.htxn-wrap');}
          function onSwipeEnd(e){
            if(!activeWrap)return;
            const dx=e.changedTouches[0].clientX-startX,dy=Math.abs(e.changedTouches[0].clientY-startY);
            if(dy>30)return;
            if(dx<-50){container.querySelectorAll('.htxn-wrap.swiped').forEach(function(w){if(w!==activeWrap)w.classList.remove('swiped');});activeWrap.classList.add('swiped');}
            else if(dx>20){activeWrap.classList.remove('swiped');}
          }
          function onSwipeClear(e){if(!e.target.closest('.htxn-wrap.swiped'))container.querySelectorAll('.htxn-wrap.swiped').forEach(function(w){w.classList.remove('swiped');});}
          container.addEventListener('touchstart',onSwipeStart,{passive:true});
          container.addEventListener('touchend',onSwipeEnd,{passive:true});
          container.addEventListener('touchstart',onSwipeClear,{passive:true});
          container._swipeCleanup = function(){
            container.removeEventListener('touchstart',onSwipeStart);
            container.removeEventListener('touchend',onSwipeEnd);
            container.removeEventListener('touchstart',onSwipeClear);
          };
        })(listEl);
      },
      toggleMonthGroup(mon) {
        if (!S.histExpanded) S.histExpanded = {};
        S.histExpanded[mon] = !( S.histExpanded[mon] !== undefined ? S.histExpanded[mon] : (mon === new Date().toLocaleDateString('en-IN',{month:'short',year:'numeric'})) );
        const safeKey = mon.replace(/\s+/g,'-');
        const body = document.getElementById('mgrp-body-' + safeKey);
        const arrow = document.getElementById('mgrp-arrow-' + safeKey);
        if (body) body.style.display = S.histExpanded[mon] ? '' : 'none';
        if (arrow) arrow.textContent = S.histExpanded[mon] ? '\u25be' : '\u25b8';
      },
      setHistSort(s) { S.histSort = s; this.r_history(); },
      tgEdit(id) { const el = document.getElementById('ie_' + id); if (el) el.style.display = el.style.display === 'none' ? 'block' : 'none'; },
      hClassify(id, bkt) { _txnUpdate(id, { bucket: bkt }); debouncedSave(D); this.markUnsaved(); document.getElementById('fBar').innerHTML = ''; this.r_history(); toast(`→ ${BUCKETS[bkt].l}`); }, // HR-04
      hSaveDesc(id) {
        // FIX-7: save edited description from inline edit panel
        const inp = document.getElementById('ie-desc-' + id);
        if (!inp) return;
        const val = inp.value.trim();
        if (!val) return;
        _txnUpdate(id, { merchant: val });
        _commitSave();
        document.getElementById('fBar').innerHTML = '';
        this.r_history(); toast('Description updated ✓');
      },
      hSwipeDel(id) {
        // FIX-6C: delete from swipe action
        modal('Delete this spend?', 'This cannot be undone.', [
          { l: 'Cancel', c: 'mb-nil', a: () => this.cm() },
          { l: 'Delete', c: 'mb-err', a: () => {
            _txnDelete(id); _commitSave('Deleted'); this.cm();
            document.getElementById('fBar').innerHTML = '';
            this.r_history();
          }}
        ]);
      },
      aiRedoVoice() {
        // FIX-8: redo voice input from confirmation card
        const card = document.getElementById('aiConfirmCard');
        if (card) card.style.display = 'none';
        const saveBtn = document.getElementById('aiSaveBtn');
        if (saveBtn) saveBtn.style.display = 'none';
        const inp = document.getElementById('aiAddInput');
        if (inp) inp.value = '';
        if (typeof AI !== 'undefined') { AI.parsed = null; AI.voiceActive = false; }
        APP.aiVoiceToggle();
      },
      hDel(id) { _confirmDelete(() => { _txnDelete(id); _commitSave('Deleted'); this.cm(); document.getElementById('fBar').innerHTML = ''; this.r_history(); }); },

      exportHTML() {
        const txns = D.transactions || [];
        if (txns.length === 0) { toast('No transactions to export yet'); return; }
        const total = txns.filter(t => t.bucket).reduce((s, t) => s + t.amount, 0), month = new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }), sm = summary(offsetMonthStr(0)); // BUG-1
        const rows = txns.map(t => { const cfg = t.bucket ? BUCKETS[t.bucket] : null; return `<tr><td>${t.date}</td><td><strong>${t.merchant}</strong></td><td style="text-align:right;font-weight:700">₹${t.amount.toLocaleString('en-IN')}</td><td style="text-align:center"><span style="background:${cfg ? cfg.cl : '#f1f5f9'};color:${cfg ? cfg.c : '#94a3b8'};font-size:11px;font-weight:700;padding:3px 8px;border-radius:6px">${cfg ? cfg.l : '—'}</span></td></tr>`; }).join('');
        const bCards = Object.entries(BUCKETS).map(([k, c]) => { const amt = sm[k] || 0, pct = total > 0 ? Math.round((amt / total) * 100) : 0; return `<div style="flex:1;min-width:120px;background:${c.cl};border-radius:12px;padding:14px"><div style="font-size:10px;color:${c.c};font-weight:700">${c.l.toUpperCase()}</div><div style="font-size:20px;font-weight:800;color:${c.c};margin-top:6px">₹${amt.toLocaleString('en-IN')}</div><div style="font-size:11px;color:rgba(255,255,255,.55);margin-top:4px">${pct}%</div></div>`; }).join('');
        const html = _buildReportHtml({ eyebrow: 'HISTORY', title: month, amount: total.toLocaleString('en-IN'), subtitle: `${txns.length} total records`, bCards, rows, txnCount: `All Transactions (${txns.length} total records)`, footerYear: '2026' });
        const fname = `spend-na-history-${month.replace(/\s+/g, '-')}.html`;
        const blob = new Blob([html], { type: 'text/html' });
        // BUG-8: use direct download only — navigator.share causes two files on iOS
        const u = URL.createObjectURL(blob), a = document.createElement('a');
        a.href = u; a.download = fname;
        document.body.appendChild(a); a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(u);
        toast('History exported — beautiful HTML file saved ✓');
      },

      shareMonth() {
        const sm = summary(offsetMonthStr(0)), month = new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }); // BUG-1
        const txns = (D.transactions || []).filter(t => t.bucket && t.month === offsetMonthStr(0)); // BUG-1
        if (txns.length === 0) { toast('No sorted transactions to share yet'); return; }
        const total = sm.total;
        const text = [`📊 My Month — ${month}`, `Total: ${fmtF(total)}`, '',
        ...Object.entries(BUCKETS).map(([k, c]) => { const amt = sm[k] || 0, lim = D.limits[k] || 0, over = lim > 0 && amt > lim; return `${c.g} ${c.l}: ${fmtF(amt)}${over ? ' ⚠ Over limit' : ''}`; }),
          '', 'Tracked with Spend-na · hakki.in'].join('\n');
        if (navigator.share) { navigator.share({ title: `My Month — ${month}`, text }).catch(() => { }); }
        else { navigator.clipboard.writeText(text).then(() => toast('Copied to clipboard!')).catch(() => toast('Share not available')); }
      },
      r_add() {
        S.addSrc = null; S.addBkt = null;
        _addTags = []; // reset tag session on every Add Spend open (U-007, U-008)
        const ai = document.getElementById('addAmt'); if (ai) ai.value = '';
        const di = document.getElementById('addDesc'); if (di) di.value = '';
        // BUG-15: pre-fill today's date, user can edit
        const dateEl = document.getElementById('addDate');
        if (dateEl) dateEl.value = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
        document.getElementById('srcGrid').innerHTML = SRCS.map(s =>
          `<div class="src" data-s="${s.k}" onclick="APP.selSrc('${s.k}')" style="flex:1;padding:10px 6px;border-radius:12px;border-width:1.5px;border-style:solid;border-color:var(--fog);background:var(--card);cursor:pointer;text-align:center;transition:all .12s">
        <div style="font-size:14px;font-weight:700;color:var(--slate)">${s.i}</div>
        <div style="font-size:11px;font-weight:700;color:var(--slate);margin-top:3px">${s.l}</div>
      </div>`
        ).join('');
        document.getElementById('bktGrid').innerHTML = Object.entries(BUCKETS).map(([k, c]) =>
          `<div class="bkt" data-b="${k}" onclick="APP.selBkt('${k}')" style="flex:1;padding:10px 6px;border-radius:12px;border-width:1.5px;border-style:solid;border-color:var(--fog);background:var(--card);cursor:pointer;text-align:center;transition:all .12s;position:relative">
        <div style="width:24px;height:24px;border-radius:7px;background:${c.cl};border:1px solid ${c.cm};color:${c.c};font-size:11px;display:flex;align-items:center;justify-content:center;margin:0 auto 4px">${c.g}</div>
        <div class="bkt-label-text" style="font-size:11px;font-weight:700;color:var(--ink);white-space:normal;word-break:break-word">${c.l}</div>
        <div id="bktck_${k}" style="display:none;position:absolute;top:-5px;right:-5px;width:13px;height:13px;border-radius:7px;background:${c.c};font-size:7px;font-weight:900;color:#fff;align-items:center;justify-content:center">✓</div>
      </div>`
        ).join('');
        this.valAdd();
        this.renderAddTagChips(); // render preset tag chips after bktGrid
      },
      selSrc(k) { S.addSrc = k; document.querySelectorAll('.src').forEach(el => { const on = el.dataset.s === k; el.style.borderColor = on ? 'var(--teal)' : 'var(--fog)'; el.style.borderWidth = on ? '2px' : '1.5px'; el.style.background = on ? 'var(--tealL)' : 'var(--card)'; el.querySelector('div').style.color = on ? 'var(--tealD)' : 'var(--slate)'; el.querySelectorAll('div')[1].style.color = on ? 'var(--tealD)' : 'var(--slate)'; }); this.valAdd(); },
      selBkt(k) {
        S.addBkt = k;
        Object.entries(BUCKETS).forEach(([bk, c]) => {
          const el = document.querySelector(`.bkt[data-b="${bk}"]`);
          const ck = document.getElementById(`bktck_${bk}`);
          if (!el) return;
          const on = bk === k;
          el.style.borderColor = on ? c.c : 'var(--fog)';
          el.style.borderWidth = on ? '2px' : '1.5px';
          el.style.background = on ? c.cl : 'var(--card)';
          // On light pastel background use dark text; on dark card use white
          const labelEl = el.querySelector('.bkt-label-text');
          if (labelEl) labelEl.style.color = on ? c.c : 'var(--ink)';
          if (ck) ck.style.display = on ? 'flex' : 'none';
        });
        this.valAdd();
      },
      valAdd() {
        const amtEl = document.getElementById('addAmt');
        const amt = parseINR(amtEl?.value || '0');
        const desc = (document.getElementById('addDesc')?.value || '').trim();
        const ok = amt > 0 && amt <= MAX_AMT && S.addSrc && S.addBkt;
        const btn = document.getElementById('addSave'); if (btn) { btn.disabled = !ok; btn.style.opacity = ok ? '1' : '.3'; }
        // Real-time validation feedback
        const amtHero = amtEl?.closest('.amt-hero');
        if (amtEl && amt > 0 && amt > MAX_AMT) { amtEl.style.color = 'var(--err)'; }
        else if (amtEl) { amtEl.style.color = ''; }
      },
      // ── MN-01: merchant name normalisation — fires on blur of "what was it for" ──
      checkMerchantNorm(inputEl) {
        if (!getAIConfig().merchantNorm) return;
        const typed = (inputEl?.value || '').trim();
        if (!typed) return;
        try {
          const suggestion = _suggestMerchantName(typed);
          if (!suggestion) return;
          userModal(`Did you mean "${suggestion}"?`,
            `You typed "${typed}" — "${suggestion}" is a merchant you've used before.`,
            [
              { l: 'No, keep mine', c: 'mb-nil', a: () => this.cm() },
              { l: `Yes, use "${suggestion}"`, c: 'mb-ok', a: () => {
                  const el = document.getElementById('addDesc');
                  if (el) el.value = suggestion;
                  this.cm();
                } },
            ]);
        } catch(e) { /* non-critical — skip suggestion on any error */ }
      },

      saveManual() {
        if (S.saveBusy) return; // BUG-006: prevent double-save
        const amtEl = document.getElementById('addAmt');
        const amt = parseINR(amtEl?.value || '0');
        const desc = (document.getElementById('addDesc')?.value || '').trim();
        if (!amt || amt <= 0) { toast('Please enter an amount'); return; }
        if (amt > MAX_AMT) { toast('Amount too large'); return; }
        if (!S.addSrc) { toast('Please select a payment method'); return; }
        if (!S.addBkt) { toast('Please select a bucket'); return; }
        const btn = document.getElementById('addSave');
        if (btn) { btn.disabled = true; btn.style.opacity = '.5'; }
        S.saveBusy = true;
        try {
          const now = new Date();
          D.transactions = [{ id: `t_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`, timestamp: now.toISOString(), date: now.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }), time: now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }), month: (function(){var d=(document.getElementById('addDate')?.value||'').trim().split(' ');var mn=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];return(d.length>=3&&mn.includes(d[1])&&d[2]&&d[2].length===4)?d[1]+' '+d[2]:now.toLocaleDateString('en-IN',{month:'short',year:'numeric'});})() /* BUG-15 */, merchant: desc || 'Manual Entry', amount: amt, bucket: S.addBkt, source: S.addSrc, tags: [..._addTags] }, ...(D.transactions || [])];
          DB.save(D); this.markUnsaved();
          _addTags = []; // clear after save — no stale tags on next open
          if (navigator.vibrate) navigator.vibrate(50);
          toast(`₹${amt.toLocaleString('en-IN')} → ${BUCKETS[S.addBkt].l}`);
          this.go('home');
        } finally {
          setTimeout(() => { S.saveBusy = false; if (btn) { btn.disabled = false; btn.style.opacity = '1'; } }, 500);
        }
      },

      // ── LIMITS ──
      r_limits() {
        S.limVals = { ...D.limits }; const sm = summary(offsetMonthStr(0)); // BUG-1: scoped
        document.getElementById('limBody').innerHTML = Object.entries(BUCKETS).map(([k, c]) => {
          const amt = sm[k] || 0, lim = S.limVals[k] || 0, isOver = lim > 0 && amt > lim, isNear = lim > 0 && amt >= lim * .8 && !isOver, pct = lim > 0 ? Math.min((amt / lim) * 100, 100) : 0, col = isOver ? 'var(--err)' : isNear ? 'var(--warn)' : c.c;
          return `<div class="lim-card" style="border-left-color:${c.c}">
        <div class="lc-hdr">
          <div class="bc-ic" style="background:${c.cl};color:${c.c};border-color:${c.cm};width:38px;height:38px;flex-shrink:0">${c.g}</div>
          <div class="lc-info"><div class="lc-nm">${c.l}</div><div class="lc-tg">${c.t}</div></div>
          ${isOver ? `<span class="lc-st" style="color:var(--err)">OVER</span>` : ''}
          ${isNear ? `<span class="lc-st" style="color:var(--warn)">NEAR</span>` : ''}
        </div>
        <div class="lc-row"><span class="lc-sym">₹</span><input class="lc-in" id="lv_${k}" type="text" inputmode="decimal" value="${lim > 0 ? fmtINR(lim) : ''}" placeholder="0" style="color:${col};border-color:${isOver ? 'var(--err)' : isNear ? 'var(--warn)' : 'var(--fog)'}" oninput="_fmtAmtLive(this);S.limVals['${k}']=Math.max(0,parseINR(this.value)||0)" onfocus="this.value=parseINR(this.value)||''" onblur="if(this.value)this.value=fmtINR(parseINR(this.value))"></div>
        ${lim > 0 ? `<div class="lc-bar" style="background:${c.cl}"><div class="lc-bfill" style="background:${col};width:${pct}%"></div></div><div class="lc-bt">₹${amt.toLocaleString('en-IN')} of ₹${lim.toLocaleString('en-IN')} (${Math.round(pct)}%)</div>` : `<div style="font-size:11px;color:var(--mist);margin-top:6px">Type your monthly budget above and tap Save ›</div>`}
      </div>`;
        }).join('')
          + (() => { try { return generateBudgetSuggestion(); } catch(e) { return ''; } })() // BS-01: wired in — was defined but never rendered
          + `<button onclick="APP.resetLimits()" style="width:100%;background:var(--paper);border:1.5px solid var(--fog);border-radius:var(--r);padding:14px;font-size:13px;color:var(--slate);font-weight:600;cursor:pointer;margin-top:4px">Reset to defaults</button>`;
      },
      setLimQuick(k, v) { S.limVals[k] = v; const el = document.getElementById('lv_' + k); if (el) el.value = fmtINR(v); this.r_limits(); },
      saveLimits() { Object.keys(S.limVals).forEach(k => { if (S.limVals[k] < 0) S.limVals[k] = 0; }); D.limits = { ...S.limVals }; DB.save(D); toast('Limits saved ✓'); this.go('home'); },
      resetLimits() { modal('Reset to defaults?', 'Restore original limits?', [{ l: 'Cancel', c: 'mb-nil', a: () => this.cm() }, { l: 'Reset', c: 'mb-sec', a: () => { S.limVals = { ...(ROLES[D.profile.role || 'working'].lim) }; this.cm(); this.r_limits(); } }]); },

      // ── SETTINGS ──
      r_settings() {
        S.setRole = D.profile.role; S.setToggles = { ...D.settings }; const p = D.profile;
        document.getElementById('setBody').innerHTML = `
      <div class="acc open" id="acc-p">
        <div class="acc-hdr" onclick="APP.tgAcc('acc-p')"><div class="acc-title">👤 My Profile</div><div class="acc-tog">+</div></div>
        <div class="acc-body">
          <div onclick="APP.pickPhoto('s')" style="display:flex;justify-content:center;margin:14px 0;cursor:pointer">
            <div id="sAv" style="width:70px;height:70px;border-radius:20px;border:2px solid var(--teal);overflow:hidden;background:var(--tealD);display:flex;align-items:center;justify-content:center">${avHTML(p, 70)}</div>
          </div>
          <label class="s-lbl" for="sp-nm">NAME</label><input class="s-in" id="sp-nm" type="text" inputmode="text" value="${esc(p.name || '')}" autocomplete="name" maxlength="60">
          <label class="s-lbl" for="sp-ct">CITY</label><input class="s-in" id="sp-ct" type="text" inputmode="text" value="${esc(p.city || '')}" maxlength="40">
          <label class="s-lbl" for="sp-db">DATE OF BIRTH</label><input class="s-in" id="sp-db" type="text" inputmode="numeric" value="${esc(p.dob || '')}" placeholder="DD/MM/YYYY" maxlength="10">
          <span class="s-lbl">I AM A...</span>
          ${Object.entries(ROLES).map(([k, r]) => `<div class="s-role${p.role === k ? ' on' : ''}" data-r="${k}" onclick="APP.sRole('${k}')"><span>${r.e}</span><span class="s-role-nm">${r.l}</span>${p.role === k ? '<span style="color:var(--teal);font-weight:700;margin-left:auto">✓</span>' : ''}</div>`).join('')}
          <label class="s-lbl" for="sp-qt">MY DAILY QUOTE</label><textarea class="s-in s-ta" id="sp-qt" maxlength="120">${esc(p.quote || '')}</textarea>
          <div style="border-top:1px solid var(--fog);margin:14px 0 10px"></div>
          <div class="s-lbl" style="margin-bottom:10px">CHANGE PASSWORD</div>
          <div class="pw-box">
            <div class="pw-r"><input class="pw-i" id="pwOld" type="password" autocomplete="current-password" style="font-size:16px" placeholder="Current password"></div>
            <div class="pw-r"><input class="pw-i" id="pwN1" type="password" autocomplete="new-password" style="font-size:16px" placeholder="New (min 4 chars)"><input class="pw-i" id="pwN2" type="password" autocomplete="new-password" style="font-size:16px" placeholder="Confirm"></div>
            <div style="font-size:11px;color:var(--err);min-height:16px;margin-bottom:8px" id="pwChErr"></div>
            <button class="pw-sv" style="width:100%" onclick="APP.changePw()">Change Password</button>
          </div>
        </div>
      </div>

      <div class="acc" id="acc-n">
        <div class="acc-hdr" onclick="APP.tgAcc('acc-n')"><div class="acc-title">🔔 Notifications</div><div class="acc-tog">+</div></div>
        <div class="acc-body">
          <div class="tgl-row"><div class="tgl-inf"><div class="tgl-lbl">Morning reminder</div><div class="tgl-sub">Daily nudge to log spends</div></div><button class="tgl${S.setToggles.notif ? ' on' : ''}" id="tgl-n" onclick="APP.tglSet('notif','tgl-n')"><div class="tgl-k"></div></button></div>
          <div class="push-box"><span class="push-lbl">FUTURE FEATURE</span><div class="push-text">Push messages from the app will appear here. No marketing. No data shared.</div></div>
        </div>
      </div>

      <div class="acc" id="acc-d">
        <div class="acc-hdr" onclick="APP.tgAcc('acc-d')"><div class="acc-title">💾 My Data</div><div class="acc-tog">+</div></div>
        <div class="acc-body">
          <div style="background:var(--tealL);border:1.5px solid var(--tealM);border-radius:var(--r);padding:12px;margin-bottom:14px">
            <div style="font-size:11px;font-weight:700;color:var(--tealD);letter-spacing:1.5px;margin-bottom:4px">YOUR DATA IS SAFE WHEN YOU SAVE</div>
            <div style="font-size:11px;color:var(--tealD);line-height:1.7"><span id="dataMgmtSaveInfo">Loading…</span></div>
          </div>
          <div style="font-size:10px;font-weight:700;color:var(--mist);letter-spacing:2px;margin-bottom:8px">FOLDER BACKUP (RECOMMENDED)</div>
          <div class="act" onclick="APP.exportZipFolder()" style="cursor:pointer"><div class="act-ic">🗂️</div><div class="act-inf"><div class="act-t">Export folder backup</div><div class="act-s">ZIP with manifest + monthly files — safest option</div></div><div class="act-ar">›</div></div>
          <div class="act" onclick="APP.importZipFolder()" style="cursor:pointer"><div class="act-ic">📥</div><div class="act-inf"><div class="act-t">Restore from folder backup</div><div class="act-s">Load a Spend-na ZIP backup file</div></div><div class="act-ar">›</div></div>
          <div class="txt-eyebrow-mist">SINGLE FILE (CLASSIC)</div>
          <div class="act" onclick="APP.saveFile()" style="cursor:pointer"><div class="act-ic">💾</div><div class="act-inf"><div class="act-t">Export single JSON file</div><div class="act-s">One file — all records combined</div></div><div class="act-ar">›</div></div>
          <div class="act" onclick="APP.loadFile()" style="cursor:pointer"><div class="act-ic">📂</div><div class="act-inf"><div class="act-t">Import / restore JSON</div><div class="act-s">Load from a saved single-file backup</div></div><div class="act-ar">›</div></div>
          <div class="txt-eyebrow-mist">OTHER</div>
          <div class="act" onclick="APP.exportCurrentMonthShard()" style="cursor:pointer"><div class="act-ic">📦</div><div class="act-inf"><div class="act-t">Export this month only</div><div class="act-s">Save current month as a separate file</div></div><div class="act-ar">›</div></div>
          <div class="act" onclick="APP.showAnnualWrap()" style="cursor:pointer"><div class="act-ic">🎉</div><div class="act-inf"><div class="act-t">See Annual Wrap 🎉</div><div class="act-s">Your year in rupees — beautiful summary</div></div><div class="act-ar">›</div></div>
          <div class="act" onclick="APP.openMigrationWizard('settings')" style="cursor:pointer"><div class="act-ic">📱</div><div class="act-inf"><div class="act-t">Transfer to new device</div><div class="act-s">Move your data to another phone</div></div><div class="act-ar">›</div></div>
          <div class="act" onclick="APP.shareBlank()" style="cursor:pointer"><div class="act-ic">🎁</div><div class="act-inf"><div class="act-t">Share app with a friend</div><div class="act-s">Send a blank copy — no personal data</div></div><div class="act-ar">›</div></div>
          <div class="txt-eyebrow-mist">STORAGE</div>
          <div class="tgl-row"><div class="tgl-inf"><div class="tgl-lbl">Monthly file sharding</div><div class="tgl-sub">Keeps main file lean — past months saved separately</div></div><button class="tgl${FLAGS.get('data_sharding') ? ' on' : ''}" id="tgl-shard" onclick="FLAGS.set('data_sharding',!FLAGS.get('data_sharding'));this.classList.toggle('on');toast(FLAGS.get('data_sharding')?'Sharding on — months saved separately':'Sharding off')"><div class="tgl-k"></div></button></div>
          <div style="border-top:1px solid var(--fog);margin:12px 0 8px"></div>
          <div class="act" onclick="APP.clearAllFresh()" style="cursor:pointer"><div class="act-ic" style="color:var(--err)">🗑️</div><div class="act-inf"><div class="act-t" style="color:var(--err)">Clear all data</div><div class="act-s">Delete everything and start fresh</div></div><div class="act-ar">›</div></div>
        </div>
      </div>

      <div class="acc" id="acc-acc">
        <div class="acc-hdr" onclick="APP.tgAcc('acc-acc')"><div class="acc-title">♿ Accessibility</div><div class="acc-tog">+</div></div>
        <div class="acc-body">
          <div class="s-row" style="display:flex;align-items:center;justify-content:space-between;padding:4px 0 14px">
            <div>
              <div class="s-lbl" style="margin-bottom:2px">APPEARANCE</div>
              <div style="font-size:11px;color:var(--mist)">Tap to cycle: Light → Dark → System</div>
            </div>
            <div class="focus-badge" onclick="APP.cycleTheme()">
              <span class="theme-badge-icon">${(() => { const t = localStorage.getItem('sn_theme') || 'light'; return { dark: '🌙', light: '☀️', system: '🌗' }[t]; })()}</span>
              <span class="theme-badge-label">${(() => { const t = localStorage.getItem('sn_theme') || 'light'; return { dark: 'Dark', light: 'Light', system: 'System' }[t]; })()}</span>
            </div>
          </div>
          <div class="s-row" style="display:flex;align-items:center;justify-content:space-between;padding:4px 0">
            <div>
              <div class="s-lbl" style="margin-bottom:2px">TEXT SIZE</div>
              <div style="font-size:11px;color:var(--mist)">Tap to cycle: Default → Comfortable → Large</div>
            </div>
            <div class="focus-badge" onclick="APP.cycleFocusMode()">
              <span class="focus-badge-aa">Aa</span>
              <span class="focus-badge-label">${(() => { const l = parseInt(localStorage.getItem('sn_focus_level')||'0',10); return ['Default','Comfortable','Large'][l]||'Default'; })()}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="acc" id="acc-ai">
        <div class="acc-hdr" onclick="APP.tgAcc('acc-ai')"><div class="acc-title">🤖 AI &amp; Intelligence</div><div class="acc-tog">+</div></div>
        <div class="acc-body" id="aiConfigBody">
          ${APP._renderAIConfigs()}
        </div>
      </div>

      <div class="acc" id="acc-ab">
        <div class="acc-hdr" onclick="APP.tgAcc('acc-ab')"><div class="acc-title">ℹ️ About</div><div class="acc-tog">+</div></div>
        <div class="acc-body">
          <div style="text-align:center;padding:20px 0">
            <div style="font-size:24px;font-weight:800;color:var(--teal);letter-spacing:-.5px">Spend-na</div>
            <div style="font-size:12px;color:var(--slate);margin-top:4px">Version 4.5 · PWA · Offline First</div>
            <div style="width:32px;height:1.5px;background:var(--fog);margin:14px auto"></div>
            <div style="font-size:13px;color:var(--ink);line-height:1.8;margin-bottom:10px">Built with ♥ by Sandeep Hakki<br>for every Indian who wants to<br>understand their money honestly.</div>
            <a href="http://www.hakki.in" target="_blank" style="font-size:13px;font-weight:700;color:var(--teal)">www.hakki.in</a>
            <div style="font-size:11px;color:var(--mist);line-height:1.9;margin-top:14px">© 2026 Sandeep Hakki. All rights reserved.<br>No data collected. No servers. Your privacy is the point.</div>
          </div>
        </div>
      </div>
    `;
        // after document.getElementById('setBody').innerHTML = `...`;
        setupDobInput('sp-db'); // DOB formatter for settings (BUG-007)
        const dmEl = document.getElementById('dataMgmtSaveInfo');
        if (dmEl) dmEl.textContent = `${D.transactions.length} total records · Last: ${D.lastSaved ? new Date(D.lastSaved).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'Never'}`;
      },
      tgAcc(id) {
        const el = document.getElementById(id);
        const isOpen = el.classList.contains('open');
        // Close all accordions first
        document.querySelectorAll('.acc').forEach(a => a.classList.remove('open'));
        // If it wasn't open, open it now (tap-to-toggle still works)
        if (!isOpen) el.classList.add('open');
      },
      sRole(k) { S.setRole = k; document.querySelectorAll('.s-role').forEach(el => el.classList.toggle('on', el.dataset.r === k)); },
      tglSet(k, id) { S.setToggles[k] = !S.setToggles[k]; document.getElementById(id).classList.toggle('on', S.setToggles[k]); },

      changePw() {
        const old = document.getElementById('pwOld')?.value || '', n1 = document.getElementById('pwN1')?.value || '', n2 = document.getElementById('pwN2')?.value || '';
        const er = document.getElementById('pwChErr');
        if (hashPw(old) !== D.passwordHash) { er.textContent = 'Current password wrong'; return; }
        if (n1.length < 4) { er.textContent = 'Minimum 4 characters'; return; }
        if (n1 !== n2) { er.textContent = 'Passwords do not match'; return; }
        D.passwordHash = hashPw(n1); DB.save(D); this.markUnsaved(); er.textContent = '';
        ['pwOld', 'pwN1', 'pwN2'].forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
        modal('Password Changed!', 'Save your data file now — the new password is stored inside it.', [
          { l: 'Save now', c: 'mb-ok', a: () => { this.cm(); this.saveFile(); } },
          { l: 'Later', c: 'mb-nil', a: () => this.cm() },
        ]);
      },

      toggleAIConfig(key, btn) {
        const cfg = getAIConfig();
        cfg[key] = !cfg[key];
        saveAIConfig(cfg);
        const on = cfg[key];
        btn.textContent = on ? 'On' : 'Off';
        btn.classList.toggle('on', on);
        btn.setAttribute('aria-pressed', String(on));
        toast(`${on ? 'Enabled' : 'Disabled'}`);
      },

      _renderAIConfigs() {
        const cfg = getAIConfig();
        const row = (key, label, desc) => {
          const on = cfg[key] !== false;
          return `<div class="ai-cfg-row">
            <div class="ai-cfg-info">
              <div class="ai-cfg-label">${label}</div>
              <div class="ai-cfg-desc">${desc}</div>
            </div>
            <button class="ai-cfg-toggle${on ? ' on' : ''}"
              onclick="APP.toggleAIConfig('${key}', this)"
              aria-pressed="${on}">${on ? 'On' : 'Off'}</button>
          </div>`;
        };
        return `
          <div class="ai-cfg-section">HOME SCREEN</div>
          ${row('insight','AI Insight Card ✨','Weekly pattern observation')}
          ${row('forecast','Spend Forecast 📈','Month-end projection')}
          ${row('streak','Spend Streak 🔥','Under-budget day counter')}
          <div class="ai-cfg-section">ADD SPEND</div>
          ${row('voice','Voice Input 🎤','Speak to log a spend')}

          ${row('reactions','AI Reactions','Smart toast after each save')}
          ${row('mood','Mood Tagging 😊','How did this spend feel?')}
          ${row('duplicate','Duplicate Detector ⚠️','Catch accidental double entries')}
          ${row('merchantNorm','Merchant Name Cleanup','Suggest matching past merchant names')}
          <div class="ai-cfg-section">HISTORY</div>
          ${row('whyBuyThis','Why Did I Buy This? ✨','Pattern insight per transaction')}
          ${row('smartSearch','Smart Search 🔎','Food finds Swiggy, chai, lunch')}
          <div class="ai-cfg-section">MY MONTH</div>
          ${row('story','Monthly Story 📖','AI-written month narrative')}
          ${row('mirror','Honest Mirror 🪞','Multi-month overrun alert')}
          ${row('spendTwin','Spend Twin 👫','Compare to similar past month')}
          <div class="ai-cfg-section">SMART BANNER</div>
          ${row('weeklyDigest','Weekly Digest 📅','Monday morning summary')}
          <div class="ai-cfg-section">LIMITS</div>
          ${row('budgetSuggest','Smart Budget Suggestion','AI-suggested limits from history')}
          ${row('monthEndWarn','Month-End Warning ⚠️','Near/over limit alert in last week')}
          <div class="ai-cfg-section">HOME CARDS</div>
          ${row('paydayMode','Payday Mode 💰','Daily budget left from income sources')}
          ${row('guiltFree','Guilt-Free Streak 🌿','Zero-spend day counter')}
          <div class="ai-cfg-section">TAGS</div>
          <button onclick="APP.showTagManager()" style="width:100%;text-align:left;background:rgba(255,255,255,.05);border:none;border-radius:var(--r);padding:12px 14px;font-size:14px;font-weight:700;color:var(--ink);cursor:pointer;font-family:var(--ff)">🏷 Manage Tags</button>
        `;
      },

      saveSettings() {
        const p = D.profile;
        p.name = document.getElementById('sp-nm')?.value?.trim() || p.name;
        p.city = document.getElementById('sp-ct')?.value?.trim() || p.city;
        p.dob = document.getElementById('sp-db')?.value?.trim() || p.dob;
        p.quote = document.getElementById('sp-qt')?.value?.trim() || p.quote;
        p.role = S.setRole || p.role;
        D.settings = { ...S.setToggles };
        DB.save(D);
        toast('Settings saved ✓'); this.go('home');
      },

      shareBlank() {
        modal('Share Spend-na App 🎁', 'Share this app as a blank copy — zero personal data. Your friend sets their own password and starts fresh.\n\nThey\'ll get the same app with a personal welcome from you!', [
          { l: 'Cancel', c: 'mb-nil', a: () => this.cm() },
          {
            l: 'Share app link', c: 'mb-ok', a: () => {
              this.cm();
              const appUrl = window.location.href.split('?')[0].split('#')[0];
              const shareText = `Hey! I use Spend-na to track my money — it's simple, private, and everything stays on your phone (no sign-up, no cloud). Try it: ${appUrl}`;
              if (navigator.share) {
                navigator.share({ title: 'Spend-na — Your Money Mirror', text: shareText, url: appUrl })
                  .then(() => { setTimeout(() => toast('🎉 Thanks for sharing Spend-na!', 3000), 500); })
                  .catch(() => { });
              } else {
                navigator.clipboard.writeText(shareText).then(() => toast('Link copied! Share it with your friend 🎉', 3000)).catch(() => toast('Share not available'));
              }
            }
          },
        ]);
      },

      clearAll() {
        modal('Clear all data?', 'Permanently deletes everything. Save your file first!', [
          { l: 'Save file first', c: 'mb-ok', a: () => { this.cm(); this.saveFile(); } },
          { l: 'Clear everything', c: 'mb-err', a: () => { localStorage.clear(); this.cm(); location.reload(); } },
          { l: 'Cancel', c: 'mb-nil', a: () => this.cm() },
        ]);
      },

      // ── MIGRATION WIZARD ─────────────────────────────────────────

      openMigrationWizard(returnTo) {
        S._mwReturn = returnTo || 'home';
        S._mwStep = 1;
        S._mwExported = false;
        this.show('pgMigrate');
        this.renderMWStep();
      },

      renderMWStep() {
        const step = S._mwStep;
        const wrap = document.getElementById('mwWrap');
        if (!wrap) return;
        const appUrl = window.location.href.split('?')[0].split('#')[0];
        const p = detectPlatform();
        const dots = [1, 2, 3, 4].map(n =>
          `<div class="mw-step-dot ${n < step ? 'done' : n === step ? 'active' : ''}"></div>`
        ).join('');
        const header = `
      <div class="mw-header">
        <button class="mw-back" onclick="APP._mwBack()">← Back</button>
        <button class="mw-skip" onclick="APP._mwSkip()">Skip all</button>
      </div>
      <div class="mw-steps">${dots}</div>`;

        if (step === 1) {
          const lastExp = localStorage.getItem('sn_last_exported');
          const expLabel = lastExp
            ? `Last exported: ${new Date(lastExp).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}`
            : 'You have not exported yet';
          wrap.innerHTML = `${header}
        <div class="mw-icon" style="background:var(--tealL)">💾</div>
        <div class="mw-title">Step 1 — Save your data first</div>
        <div class="mw-sub">Before switching browsers, export your data file. This is the bridge that carries all your records to Safari.</div>
        <div class="mw-safe">
          <div class="mw-safe-text">🔒 <strong>Your data is safe.</strong> Everything currently in this browser's storage stays there until you clear it. Take your time — no rush.</div>
        </div>
        <div class="mw-instr">
          <div style="font-size:11px;color:var(--slate);margin-bottom:8px">${expLabel}</div>
          <div style="font-size:13px;color:var(--ink)">Tap the button below to export <strong>${D.transactions.length} records</strong> to a file.</div>
        </div>
        <div class="mw-export-done" id="mwExpDone">
          <div class="mw-export-done-text">✅ File exported! Now move it to the Files app before continuing.</div>
        </div>
        <button class="mw-btn-primary" onclick="APP._mwExport()">Export my data now</button>
        <button class="mw-btn-secondary" onclick="APP._mwNextStep()">I already have my file → Next</button>`;

        } else if (step === 2) {
          if (p.isChromeIOS) {
            wrap.innerHTML = `${header}
          <div class="mw-icon" style="background:rgba(251,191,36,.18)">📁</div>
          <div class="mw-title">Step 2 — Move file to Files app</div>
          <div class="mw-sub">Your file is in Chrome's Downloads. Safari can't see it there. Move it to the Files app first.</div>
          <div class="mw-warn">
            <div class="mw-warn-title">⚠ Don't skip this step</div>
            <div class="mw-warn-text">If you skip this, you won't be able to import your data in Safari. Your data won't be lost, but you'll have to come back to Chrome to redo the export.</div>
          </div>
          <div class="mw-instr">
            <div class="mw-instr-step"><div class="mw-step-num">1</div><div class="mw-step-text">Tap the Chrome menu <strong>⋮</strong> (top right of your browser)</div></div>
            <div class="mw-instr-step"><div class="mw-step-num">2</div><div class="mw-step-text">Tap <strong>Downloads</strong></div></div>
            <div class="mw-instr-step"><div class="mw-step-num">3</div><div class="mw-step-text">Find <strong>spend-na-data.json</strong> → tap it</div></div>
            <div class="mw-instr-step"><div class="mw-step-num">4</div><div class="mw-step-text">Tap the <strong>Share icon</strong> → <strong>Save to Files</strong> → <strong>Downloads</strong> → Save</div></div>
          </div>
          <div class="mw-safe"><div class="mw-safe-text">✅ Once saved to Files, Safari can see and import it.</div></div>
          <button class="mw-btn-primary" onclick="APP._mwNextStep()">I've moved the file → Next</button>
          <button class="mw-btn-secondary" onclick="APP._mwNextStep()">Skip this step</button>`;
          } else {
            S._mwStep = 3;
            this.renderMWStep();
          }

        } else if (step === 3) {
          const browserName = p.isIOS ? 'Safari' : 'your default browser';
          wrap.innerHTML = `${header}
        <div class="mw-icon" style="background:rgba(56,189,248,.18)">🧭</div>
        <div class="mw-title">Step 3 — Open in ${browserName}</div>
        <div class="mw-sub">${p.isIOS
              ? 'Open Safari and go to the Spend-na URL. Then add it to your home screen for the best experience.'
              : 'Open your default browser and go to the Spend-na URL.'
            }</div>
        <div style="font-size:10px;color:var(--slate);letter-spacing:2px;font-weight:700;margin-bottom:8px">APP URL</div>
        <div class="mw-url-box">
          <div class="mw-url-text">${esc(appUrl)}</div>
          <button class="mw-url-copy" id="mwCopyBtn" onclick="APP._mwCopyUrl('${esc(appUrl)}')">Copy</button>
        </div>
        ${p.isIOS ? `
        <div class="mw-instr">
          <div class="mw-instr-step"><div class="mw-step-num">1</div><div class="mw-step-text">Open the <strong>Safari</strong> app</div></div>
          <div class="mw-instr-step"><div class="mw-step-num">2</div><div class="mw-step-text">Tap the address bar and <strong>paste the URL</strong></div></div>
          <div class="mw-instr-step"><div class="mw-step-num">3</div><div class="mw-step-text">Tap <strong>Share ↑</strong> → <strong>Add to Home Screen</strong> → Add</div></div>
          <div class="mw-instr-step"><div class="mw-step-num">4</div><div class="mw-step-text">Open Spend-na from your <strong>home screen icon</strong></div></div>
        </div>` : `
        <div class="mw-instr">
          <div class="mw-instr-step"><div class="mw-step-num">1</div><div class="mw-step-text">Open your <strong>default browser</strong></div></div>
          <div class="mw-instr-step"><div class="mw-step-num">2</div><div class="mw-step-text">Paste the URL and open Spend-na</div></div>
        </div>`}
        <button class="mw-btn-primary" onclick="APP._mwNextStep()">I've opened it → Next</button>
        <button class="mw-btn-secondary" onclick="APP._mwSkip()">Stay in this browser</button>`;

        } else if (step === 4) {
          wrap.innerHTML = `${header}
        <div class="mw-icon" style="background:#f0fdf4">📂</div>
        <div class="mw-title">Step 4 — Import your data</div>
        <div class="mw-sub">Once you're in Safari (or your home screen app), import your data file to restore everything.</div>
        <div class="mw-instr">
          <div class="mw-instr-step"><div class="mw-step-num">1</div><div class="mw-step-text">Open Spend-na in <strong>Safari</strong></div></div>
          <div class="mw-instr-step"><div class="mw-step-num">2</div><div class="mw-step-text">Complete the onboarding (name, password)</div></div>
          <div class="mw-instr-step"><div class="mw-step-num">3</div><div class="mw-step-text">On the home screen, tap <strong>Load from my file</strong></div></div>
          <div class="mw-instr-step"><div class="mw-step-num">4</div><div class="mw-step-text">Pick <strong>spend-na-data.json</strong> from your Files app → Downloads</div></div>
          <div class="mw-instr-step"><div class="mw-step-num">5</div><div class="mw-step-text">All your <strong>${D.transactions.length} records</strong> will be restored ✅</div></div>
        </div>
        <div class="mw-safe">
          <div class="mw-safe-text">🔒 Your data in this Chrome browser stays safe until you clear Chrome's browsing data. You can always come back here if needed.</div>
        </div>
        <button class="mw-btn-primary" onclick="APP._mwFinish()">Got it — I'm all set ✓</button>
        <button class="mw-btn-secondary" onclick="APP._mwSkip()">Stay in this browser</button>`;
        }
      },

      _mwExport() {
        DB.exportFile(D);
        S.unsaved = false;
        S._mwExported = true;
        const doneEl = document.getElementById('mwExpDone');
        if (doneEl) doneEl.classList.add('show');
        toast(`${D.transactions.length} records exported ✓`);
      },

      _mwNextStep() {
        S._mwStep = Math.min(S._mwStep + 1, 4);
        this.renderMWStep();
        const wrap = document.getElementById('mwWrap');
        if (wrap) wrap.scrollTop = 0;
      },

      _mwBack() {
        if (S._mwStep <= 1) {
          this._mwReturn();
        } else {
          S._mwStep = Math.max(S._mwStep - 1, 1);
          this.renderMWStep();
        }
      },

      _mwSkip() { this._mwReturn(); },

      _mwFinish() {
        sessionStorage.setItem('sn_mw_done', '1');
        this._mwReturn();
      },

      _mwReturn() {
        const dest = S._mwReturn || 'home';
        if (dest === 'trust') { this.show('pgTrust'); }
        else if (dest === 'settings') { this.go('settings'); }
        else { this.go('home'); }
      },

      _mwCopyUrl(url) {
        if (navigator.clipboard) {
          navigator.clipboard.writeText(url).then(() => {
            const btn = document.getElementById('mwCopyBtn');
            if (btn) { btn.textContent = 'Copied!'; setTimeout(() => { if (btn) btn.textContent = 'Copy'; }, 2000); }
          }).catch(() => toast('Could not copy — please copy manually'));
        } else {
          toast('Copy not available — please copy the URL manually');
        }
      },

      // ── TAGS ─────────────────────────────────────────────────────

      _toggleCustomTag() {
        const el = document.getElementById('addTagCustomArea');
        if (!el) return;
        el.style.display = el.style.display === 'none' ? 'block' : 'none';
        if (el.style.display === 'block') {
          setTimeout(() => document.getElementById('addTagCustom')?.focus(), 100);
        }
      },

      renderAddTagChips() {
        const chipsEl = document.getElementById('addTagChips');
        const pillsEl = document.getElementById('addTagSelected');
        if (!chipsEl) return;
        // BUG-2: snapshot list once — avoids repeated pruneOldTags() calls per render
        const baseList = getDynamicTagList();
        const allTags = baseList.concat(_addTags.filter(t => !baseList.includes(t)));
        const activeSet = new Set(_addTags);
        // Single DOM write for chips
        chipsEl.innerHTML = allTags.map(tag => {
          const on = activeSet.has(tag);
          const isCustom = !PRESET_TAGS.includes(tag);
          const border = on ? 'var(--teal)' : (isCustom ? 'var(--teal)' : 'var(--fog))');
          const bg = on ? 'var(--tealL)' : 'var(--card)';
          const color = on ? 'var(--tealD)' : (isCustom ? 'var(--teal)' : 'var(--slate)');
          return `<div data-tag="${esc(tag)}" style="flex-shrink:0;padding:6px 11px;border-radius:16px;border:1.5px solid ${border};background:${bg};font-size:11px;font-weight:600;color:${color};cursor:pointer;white-space:nowrap;transition:background .1s,border-color .1s">#${esc(tag)}</div>`;
        }).join('');
        // Attach single delegated listener (BUG-2: no per-chip listeners, no stacking)
        chipsEl._tagHandler && chipsEl.removeEventListener('click', chipsEl._tagHandler);
        chipsEl._tagHandler = (e) => {
          const el = e.target.closest('[data-tag]');
          if (!el) return;
          APP.toggleAddTag(el.dataset.tag);
        };
        chipsEl.addEventListener('click', chipsEl._tagHandler);
        // Single DOM write for selected pills
        if (pillsEl) {
          pillsEl.innerHTML = _addTags.length === 0 ? '' :
            _addTags.map(tag => `<span class="tag-pill">#${esc(tag)}<button class="tag-pill-rm" data-tag="${esc(tag)}">✕</button></span>`).join('');
          pillsEl._pillHandler && pillsEl.removeEventListener('click', pillsEl._pillHandler);
          pillsEl._pillHandler = (e) => {
            const btn = e.target.closest('.tag-pill-rm');
            if (!btn) return;
            APP.toggleAddTag(btn.dataset.tag);
          };
          pillsEl.addEventListener('click', pillsEl._pillHandler);
        }
      },

      toggleAddTag(tag) {
        if (!tag) return;
        // BUG-2: direct array mutation then single re-render — no intermediate state
        const idx = _addTags.indexOf(tag);
        if (idx !== -1) { _addTags.splice(idx, 1); } else { _addTags.push(tag); }
        this.renderAddTagChips();
      },

      addCustomTag() {
        const inp = document.getElementById('addTagCustom');
        if (!inp) return;
        // Sanitise: allow only letters, numbers, spaces, hyphens (SEC-001 to SEC-017)
        const val = (inp.value || '').trim().replace(/[^a-zA-Z0-9 \-]/g, '').replace(/\s+/g, ' ');
        if (!val) { inp.value = ''; return; }
        if (val.length > 30) { toast('Tag too long — max 30 characters'); return; }
        if (_addTags.includes(val)) { inp.value = ''; return; } // silent dedup (U-009, UI-015)
        _addTags.push(val);
        recordTagUsage(val); // persist to registry
        inp.value = '';
        this.renderAddTagChips();
      },

      _renderSelectedTags() {
        const el = document.getElementById('addTagSelected');
        if (!el) return;
        if (_addTags.length === 0) { el.innerHTML = ''; return; }
        el.innerHTML = _addTags.map(tag =>
          `<span class="tag-pill">#${esc(tag)}<button class="tag-pill-rm" onclick="APP.toggleAddTag('${esc(tag)}')">✕</button></span>`
        ).join('');
      },

      // History retroactive tagging
      hToggleTag(txnId, tag) {
        _txnUpdate(txnId, t => {
          const tags = t.tags || [];
          return { ...t, tags: tags.includes(tag) ? tags.filter(g => g !== tag) : [...tags, tag] };
        });
        debouncedSave(D); this.markUnsaved(); // HR-04
        this._refreshTxnTagUI(txnId);
      },

      hAddCustomTag(txnId) {
        const inp = document.getElementById(`ietc_${txnId}`);
        if (!inp) return;
        // Same sanitisation as addCustomTag (SEC-001 to SEC-017)
        const val = (inp.value || '').trim().replace(/[^a-zA-Z0-9 \-]/g, '').replace(/\s+/g, ' ');
        if (!val) { inp.value = ''; return; }
        if (val.length > 30) { toast('Tag too long — max 30 characters'); return; }
        const txn = D.transactions.find(t => t.id === txnId);
        if (!txn) return;
        if ((txn.tags || []).includes(val)) { inp.value = ''; return; } // silent dedup
        D.transactions = D.transactions.map(t =>
          t.id === txnId ? { ...t, tags: [...(t.tags || []), val] } : t
        );
        DB.save(D);
        this.markUnsaved();
        inp.value = '';
        this._refreshTxnTagUI(txnId);
      },

      _refreshTxnTagUI(txnId) {
        const txn = D.transactions.find(t => t.id === txnId);
        if (!txn) return;
        const tTags = txn.tags || [];

        // Refresh tag pill display on the transaction card in History
        const cardEl = document.getElementById('ht_' + txnId);
        if (cardEl) {
          const infoEl = cardEl.querySelector('.htxn-info');
          if (infoEl) {
            let pillsRow = infoEl.querySelector('.txn-tag-pills');
            if (tTags.length === 0) {
              if (pillsRow) pillsRow.remove();
            } else {
              if (!pillsRow) {
                pillsRow = document.createElement('div');
                pillsRow.className = 'txn-tag-pills';
                pillsRow.style.cssText = 'display:flex;flex-wrap:wrap;gap:4px;margin-top:5px';
                infoEl.appendChild(pillsRow);
              }
              pillsRow.innerHTML = tTags.map(t => `<span class="tag-pill">#${esc(t)}</span>`).join('');
            }
          }
        }

        // Refresh preset chip states in edit box
        const chipsEl = document.getElementById('iet_' + txnId);
        if (chipsEl) {
          chipsEl.innerHTML = PRESET_TAGS.map(t => {
            const on = tTags.includes(t);
            return `<button class="tag-chip${on ? ' on' : ''}" onclick="APP.hToggleTag('${txnId}','${esc(t)}')">#${esc(t)}</button>`;
          }).join('');
        }

        // Refresh selected pills row in edit box
        const selEl = document.getElementById('iet_sel_' + txnId);
        if (selEl) {
          selEl.innerHTML = tTags.map(t =>
            `<span class="tag-pill">#${esc(t)}<button class="tag-pill-rm" onclick="APP.hToggleTag('${txnId}','${esc(t)}')">&#x2715;</button></span>`
          ).join('');
        }

        // Rebuild filter bar so new tag pills appear (BUG-07)
        document.getElementById('fBar').innerHTML = '';
        // BUG-FIX: if active filter is a tag filter, check it still matches at least one transaction.
        // If not, clear the filter so the list doesn't go blank.
        if (S.histF && S.histF.startsWith('tag:')) {
          const activeTag = S.histF.slice(4);
          const hasMatch = (D.transactions || []).some(t => (t.tags || []).includes(activeTag));
          if (!hasMatch) { S.histF = null; }
        }
        this.r_history();
        // Re-open the edit box that r_history just re-rendered closed (BUG-01 core fix)
        const ieEl = document.getElementById('ie_' + txnId);
        if (ieEl) ieEl.style.display = 'block';
      },

      // ── SOURCES ──────────────────────────────────────────────────

      r_sources() {
        const sd = SRC_DB.load();
        const currentMonth = offsetMonthStr(0);
        const prevMonth = offsetMonthStr(-1);

        // ── Carry Forward Logic ──
        // Only run if previous month had source entries with non-zero total (test U-025, U-026)
        const prevSources = (sd.sources || []).filter(s => s.month === prevMonth);
        const hasCarryForCurrentMonth = (sd.sources || []).some(
          s => s.month === currentMonth && s.type === 'carry_forward'
        );

        if (prevSources.length > 0 && !hasCarryForCurrentMonth) {
          const prevSrcTotal = prevSources.reduce((sum, s) => sum + (Number(s.amount) || 0), 0);
          if (prevSrcTotal === 0) { /* no carry — U-025 */ } else {
            const prevSpendTotal = summary(prevMonth).total;
            const carryAmt = prevSrcTotal - prevSpendTotal;
            // Only create carry forward if amount is non-zero (test U-026)
            if (carryAmt !== 0) {
              const now = new Date();
              sd.sources = sd.sources || [];
              sd.sources.unshift({
                id: `src_cf_${Date.now()}`,
                timestamp: now.toISOString(),
                date: now.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
                month: currentMonth,
                name: 'Carried Forward',
                amount: carryAmt,
                note: `Balance from ${prevMonth}`,
                type: 'carry_forward'
              });
              SRC_DB.save(sd);
            }
          }
        }

        // ── Calculate balance ──
        const thisMonthSources = (sd.sources || []).filter(s => s.month === currentMonth);
        const srcTotal = thisMonthSources.reduce((sum, s) => sum + (Number(s.amount) || 0), 0);
        const spendTotal = summary(currentMonth).total;
        const balance = srcTotal - spendTotal;

        const bodyEl = document.getElementById('sourcesBody');
        if (!bodyEl) return;

        // Update subtitle with live entry count (BUG-04)
        const subEl = document.getElementById('sourcesSub');
        if (subEl) {
          subEl.textContent = thisMonthSources.length > 0
            ? `${thisMonthSources.length} source${thisMonthSources.length > 1 ? 's' : ''} · ${currentMonth}`
            : 'Where your money comes from';
        }

        // ── Empty state ──
        if (thisMonthSources.length === 0) {
          bodyEl.innerHTML = `
        <div class="src-empty">
          <div style="font-size:52px;margin-bottom:16px">💰</div>
          <div style="font-size:20px;font-weight:800;color:var(--ink);margin-bottom:8px">Track all your income sources</div>
          <div style="font-size:14px;color:var(--slate);line-height:1.6;margin-bottom:24px">Add your salary, freelance income,<br>or any money you received this month.</div>
          <button onclick="APP.openAddSource()" class="btn-teal">+ Add Source</button>
        </div>`;
          return;
        }

        // ── Balance pill states ──
        let pillBg, pillColor, pillBorder, pillMsg;
        const nearThreshold = srcTotal * 0.1;
        if (balance < 0) {
          pillBg = '#fff1f2'; pillColor = '#f43f5e'; pillBorder = '#fda4af';
          pillMsg = 'Heads up — your spending has crossed your sources this month.';
        } else if (balance <= nearThreshold) {
          pillBg = '#fffbeb'; pillColor = '#f59e0b'; pillBorder = '#fde68a';
          pillMsg = 'Running low on your sources for this month.';
        } else {
          pillBg = '#ecfdf5'; pillColor = '#10b981'; pillBorder = '#6ee7b7';
          pillMsg = '';
        }

        // ── Passbook list — newest first ──
        const entries = [...thisMonthSources].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        const listHTML = entries.map(s => {
          const isCarry = s.type === 'carry_forward';
          const amtColor = s.amount < 0 ? 'var(--err)' : 'var(--ok)';
          const amtPrefix = s.amount < 0 ? '-' : '+';
          return `<div class="src-entry${isCarry ? ' src-carry' : ''}" id="sre_${s.id}">
        <div class="src-entry-ic">${isCarry ? '↩' : '↑'}</div>
        <div class="src-entry-info">
          <div class="src-entry-name">${esc(s.name)}${isCarry ? ' 🔒' : ''}</div>
          <div class="src-entry-meta">${s.date} · ${s.month}</div>
          ${s.note ? `<div class="src-entry-note">${esc(s.note)}</div>` : ''}
          ${!isCarry ? `<div class="src-entry-acts">
            <button class="src-entry-act edit" onclick="APP.editSource('${s.id}')">Edit</button>
            <button class="src-entry-act del"  onclick="APP.deleteSource('${s.id}')">Delete</button>
          </div>` : '<div class="src-entry-meta" style="margin-top:4px;color:var(--mist);font-size:10px">Auto-calculated · cannot be deleted</div>'}
        </div>
        <div class="src-entry-right">
          <div class="src-entry-amt" style="color:${amtColor}">${amtPrefix}${fmtF(Math.abs(s.amount))}</div>
        </div>
      </div>`;
        }).join('');

        bodyEl.innerHTML = `
      <div class="src-balance-pill">
        <div class="src-pill-row">
          <span class="src-pill-label">BALANCE THIS MONTH</span>
          <span class="src-status-pill" style="background:${pillBg};color:${pillColor};border:1.5px solid ${pillBorder}">
            ${balance < 0 ? '⚠' : balance <= nearThreshold ? '⚡' : '✓'} ${balance < 0 ? 'Overspent' : balance <= nearThreshold ? 'Running low' : 'On track'}
          </span>
        </div>
        <div class="src-pill-amt" style="color:${pillColor}">${balance < 0 ? '-' : ''}${fmtF(Math.abs(balance))}</div>
        <div class="src-pill-sub">
          <span class="src-pill-sub-item">↑ In: ${fmtF(srcTotal)}</span>
          <span class="src-pill-sub-item">↓ Spent: ${fmtF(spendTotal)}</span>
        </div>
        ${balance < 0 || balance <= nearThreshold ? `<div style="font-size:12px;color:${pillColor};margin-top:6px;line-height:1.5">${pillMsg}</div>` : ''}
      </div>
      <div class="src-month-hdr">THIS MONTH · ${currentMonth}</div>
      ${listHTML}
      <div style="height:20px"></div>
    `;
      },

      openAddSource(prefill) {
        const isEdit = !!prefill;
        const now = new Date();
        const defaultDate = now.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

        modal(
          isEdit ? 'Edit Source' : '+ Add Source',
          `<div style="display:flex;flex-direction:column;gap:14px;margin-top:8px">
        <div>
          <div class="txt-eyebrow">SOURCE NAME</div>
          <input id="srcName" class="add-in" type="text" inputmode="text" maxlength="60"
            placeholder="e.g. Salary, Freelance, Gift from Dad"
            value="${esc(prefill?.name || '')}">
        </div>
        <div>
          <div class="txt-eyebrow">AMOUNT RECEIVED (₹)</div>
          <input id="srcAmt" class="add-in" type="number" inputmode="decimal" min="0.01" step="any"
            placeholder="₹ e.g. 50000" value="${prefill?.amount || ''}">
        </div>
        <div>
          <div class="txt-eyebrow">NOTE (optional)</div>
          <input id="srcNote" class="add-in" type="text" inputmode="text" maxlength="100"
            placeholder="Optional — e.g. April salary, Client payment"
            value="${esc(prefill?.note || '')}">
        </div>
        <div style="font-size:11px;color:var(--mist)">Date: ${prefill?.date || defaultDate}</div>
      </div>`,
          [
            { l: 'Cancel', c: 'mb-nil', a: () => this.cm() },
            {
              l: isEdit ? 'Save Changes' : 'Add Source', c: 'mb-ok', a: () => {
                const name = (document.getElementById('srcName')?.value || '').trim();
                const rawAmt = document.getElementById('srcAmt')?.value || '';
                const amt = parseFloat(rawAmt);
                const note = (document.getElementById('srcNote')?.value || '').trim();

                if (!name) { toast('Please enter a source name'); return; }
                // Validate amount: must be a finite positive number (tests SEC-007 to SEC-014)
                if (!rawAmt || isNaN(amt) || !isFinite(amt) || amt <= 0) {
                  toast('Please enter a valid amount'); return;
                }

                const sd = SRC_DB.load();
                sd.sources = sd.sources || [];

                if (isEdit) {
                  sd.sources = sd.sources.map(s =>
                    s.id === prefill.id ? { ...s, name, amount: amt, note } : s
                  );
                  toast('Source updated ✓');
                } else {
                  const entryNow = new Date();
                  sd.sources.unshift({
                    id: `src_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
                    timestamp: entryNow.toISOString(),
                    date: entryNow.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
                    month: offsetMonthStr(0),
                    name,
                    amount: amt,
                    note,
                    type: 'income'
                  });
                  toast(`${fmtF(amt)} added to Sources ✓`);
                }

                SRC_DB.save(sd);
                this.cm();
                this.r_sources();
              }
            }
          ]
        );
        // Auto-focus name field so keyboard appears immediately (UI-009)
        setTimeout(() => {
          const nameEl = document.getElementById('srcName');
          if (nameEl) nameEl.focus();
        }, 150);
      },

      editSource(id) {
        const sd = SRC_DB.load();
        const entry = (sd.sources || []).find(s => s.id === id);
        if (!entry) return;
        this.openAddSource(entry);
      },

      deleteSource(id) {
        modal('Delete source entry?', 'This cannot be undone.', [
          { l: 'Cancel', c: 'mb-nil', a: () => this.cm() },
          {
            l: 'Delete', c: 'mb-err', a: () => {
              const sd = SRC_DB.load();
              sd.sources = (sd.sources || []).filter(s => s.id !== id);
              SRC_DB.save(sd);
              this.cm();
              this.r_sources();
              toast('Source deleted');
            }
          }
        ]);
      },
    };
    function setupDobInput(inputId) {
      const el = document.getElementById(inputId);
      if (!el) return;
      el.addEventListener('input', function (e) {
        let v = this.value.replace(/\D/g, ''); // strip non-digits
        if (v.length >= 3 && v.length <= 4) v = v.slice(0, 2) + '/' + v.slice(2);
        else if (v.length >= 5) v = v.slice(0, 2) + '/' + v.slice(2, 4) + '/' + v.slice(4, 8);
        this.value = v;
      });
      el.addEventListener('keydown', function (e) {
        // Allow backspace to delete slash cleanly
        if (e.key === 'Backspace' && (this.value.endsWith('/'))) {
          this.value = this.value.slice(0, -1);
          e.preventDefault();
        }
      });
    }

    // ═══════════════════════════════════════════════════════════════════
    // AI FEATURES — Spend-na
    // Features: Smart Add (Text + Voice + Photo), AI Reactions,
    //           Home Insight, Spend Forecast, Monthly Story, Honest Mirror
    // All on-device. No API key. No server. Works: iOS Safari, iOS Chrome, Android Chrome.
    // ═══════════════════════════════════════════════════════════════════

    // ── AI STATE ────────────────────────────────────────────────────
    const AI = {
      parsed: null,       // current parsed result {amt, desc, bkt, src}
      voiceRec: null,     // SpeechRecognition instance
      voiceActive: false, // is mic recording?
      ocrWorker: null,    // Tesseract worker (reused)
      mirrorBucket: null, // which bucket the mirror is about
    };

    // ── BUCKET KEYWORD MAP (for auto-categorization) ─────────────────
    const AI_BKT_KEYWORDS = {
      necessary: [
        'rice','dal','atta','milk','bread','egg','vegetable','veg','sabzi','grocery','groceries',
        'kirana','provision','medicine','medical','doctor','hospital','clinic','pharmacy','chemist',
        'tablet','injection','lab','test','scan','rent','emi','loan','electricity','bill','water',
        'gas','lpg','cylinder','mobile','recharge','internet','wifi','broadband','school','fees',
        'tuition','bus','auto','rickshaw','metro','train','ticket','petrol','diesel','fuel','cng',
        'maintenance','repair','plumber','electrician','maid','salary','insurance','lic','sip',
        'mutual fund','ppf','nps','tax','challan','fine','hospital','medicine','medical',
        'health','swiggy','zomato','food','lunch','dinner','breakfast','tiffin','mess','canteen',
        'chai','tea','coffee','snack','biscuit'
      ],
      committed: [
        'emi','loan','credit card','insurance','lic','premium','sip','mutual fund','ppf',
        'subscription','netflix','hotstar','prime','spotify','gym','membership','rent advance',
        'deposit','maintenance','society','broadband','annual','yearly','quarterly'
      ],
      comfortable: [
        'shopping','clothes','shirt','trouser','shoe','apparel','salon','haircut','spa','massage',
        'movie','cinema','pvr','inox','outing','picnic','weekend','party','gift','present',
        'decoration','amazon','flipkart','meesho','myntra','ajio','electronics','gadget',
        'mobile phone','laptop','headphone','earphone','watch','perfume','cosmetic','beauty',
        'makeup','skincare','household','furniture','cushion','curtain'
      ],
      luxury: [
        'restaurant','fine dining','bar','pub','alcohol','beer','wine','whisky','party','club',
        'lounge','resort','hotel','holiday','trip','vacation','tour','flight','air ticket',
        'cab','uber','ola','rapido','international','foreign','jewellery','gold','diamond',
        'luxury','branded','designer','premium','expensive','iphone','macbook','ps5','xbox',
        'gaming','concert','event','show','ticket'
      ]
    };

    // ── MERCHANT → BUCKET map for OCR ───────────────────────────────
    const AI_MERCHANT_MAP = {
      swiggy:'necessary', zomato:'necessary', blinkit:'necessary', zepto:'necessary',
      bigbasket:'necessary', dunzo:'necessary', jiomart:'necessary', dmart:'necessary',
      apollo:'necessary', medplus:'necessary', netmeds:'necessary', '1mg':'necessary',
      ola:'necessary', uber:'necessary', rapido:'necessary', irctc:'necessary',
      netflix:'committed', hotstar:'committed', primevideo:'committed', spotify:'committed',
      amazon:'comfortable', flipkart:'comfortable', myntra:'comfortable', ajio:'comfortable',
      meesho:'comfortable', nykaa:'comfortable', tatacliq:'comfortable',
    };

    // ── HISTORY MERCHANT LOOKUP ───────────────────────────────────────
    // Returns {bkt, confidence, matchedDesc} or null
    // confidence: 3=exact, 2=contains, 1=word-overlap
    // MQ-03: merchant index — built once, invalidated on new transactions
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
        } else if (hay.includes(needle) || needle.includes(hay)) {
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

    // ── PARSE NLT (natural language text) ────────────────────────────
    // Returns {amt, desc, bkt, src, suggestedTags, learnedFromHistory, historyInfo} or null
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
        // Suggest tags from history match (dedupe, filter preset)
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

    // ── SHOW AI CONFIRMATION CARD ────────────────────────────────────
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

    // ── CLEAR AI STATE ───────────────────────────────────────────────
    function aiClear() {
      AI.parsed = null;
      const card = document.getElementById('aiConfirmCard');
      const saveBtn = document.getElementById('aiSaveBtn');
      const status = document.getElementById('aiStatus');
      if (card) card.style.display = 'none';
      if (saveBtn) saveBtn.style.display = 'none';
      if (status) status.textContent = '';
    }

    // ── AI REACTION after save ───────────────────────────────────────
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
      const today = now.toLocaleDateString('en-IN', {day:'2-digit', month:'short'});
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

    // ── AI INSIGHT (weekly, home screen) ─────────────────────────────
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

    // ── SPEND FORECAST ───────────────────────────────────────────────
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

    // ── MONTHLY STORY ────────────────────────────────────────────────
    function aiGenerateStory(monthStr) {
      const txns = (D.transactions || []).filter(t => t.month === monthStr);
      if (txns.length < 3) return null;

      const total = txns.reduce((s,t)=>s+t.amount,0);
      const prevMonth = (() => { const d = new Date(); d.setDate(1); d.setMonth(d.getMonth()-1); return d.toLocaleDateString('en-IN',{month:'short',year:'numeric'}); })();
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

    // ── HONEST MIRROR ────────────────────────────────────────────────
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

    // Inject all AI methods into APP object
    // (called once after APP is defined — extends APP in-place)
    // NEW AI FEATURES (v4.5)
    // ── SPEND STREAK 🔥 ──────────────────────────────────────────
    function updateStreak() {
      if (!getAIConfig().streak) return null;
      const today = new Date().toISOString().slice(0,10);
      const lim = D.limits || {};
      const totalLimit = Object.values(lim).reduce((s,v)=>s+(v||0),0);
      if (totalLimit === 0) return null;
      const dailyBudget = totalLimit / 30;
      const todayTotal = (D.transactions||[]).filter(t=>t.date&&t.date.startsWith(today)).reduce((s,t)=>s+(t.amount||0),0);
      let streak = { count:0, lastDate:'', best:0 };
      try { streak = JSON.parse(localStorage.getItem('sn_streak')||'{}'); } catch(e) { console.warn("[catch]", e); }
      const yesterday = new Date(Date.now()-MS_PER_DAY).toISOString().slice(0,10);
      if (todayTotal <= dailyBudget) {
        if (streak.lastDate === yesterday) { streak.count = (streak.count||0)+1; }
        else if (streak.lastDate !== today) { streak.count = 1; }
        streak.lastDate = today;
        streak.best = Math.max(streak.best||0, streak.count);
      } else if (streak.lastDate !== today) { streak.count = 0; streak.lastDate = today; }
      try { localStorage.setItem('sn_streak', JSON.stringify(streak)); } catch(e) { console.warn("[catch]", e); }
      return streak;
    }

    // ── SMART DUPLICATE DETECTOR ⚠️ ──────────────────────────────
    function checkDuplicate(amount, merchant) {
      if (!getAIConfig().duplicate) return null;
      const cutoff = Date.now() - (15 * 60 * 1000);
      return (D.transactions||[]).find(t => {
        const tTime = new Date(t.timestamp||0).getTime();
        return tTime > cutoff && Math.abs(t.amount - amount) < 2
          && (t.merchant||'').toLowerCase() === (merchant||'').toLowerCase();
      }) || null;
    }

    // ── SMART SEARCH SYNONYMS 🔎 ──────────────────────────────────
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

    // ── SPEND TWIN 👫 ─────────────────────────────────────────────
    function generateSpendTwin(currentMonthStr) {
      if (!getAIConfig().spendTwin) return null;
      const txns = D.transactions || [];
      const currentTxns = txns.filter(t=>t.month===currentMonthStr);
      if (currentTxns.length < 3) return null;
      const current = {};
      Object.keys(BUCKETS).forEach(k => { current[k] = currentTxns.filter(t=>t.bucket===k).reduce((s,t)=>s+t.amount,0); });
      const currentTotal = Object.values(current).reduce((s,v)=>s+v,0);
      if (currentTotal === 0) return null;
      const pastMonths = [...new Set(txns.map(t=>t.month))].filter(m=>m!==currentMonthStr);
      if (pastMonths.length < 2) return null;
      let bestMatch = null, bestScore = Infinity;
      pastMonths.forEach(m => {
        const past = {};
        Object.keys(BUCKETS).forEach(k => { past[k] = txns.filter(t=>t.month===m&&t.bucket===k).reduce((s,t)=>s+t.amount,0); });
        const pastTotal = Object.values(past).reduce((s,v)=>s+v,0);
        if (pastTotal === 0) return;
        const score = Object.keys(BUCKETS).reduce((s,k)=>s+Math.abs((currentTotal>0?current[k]/currentTotal:0)-(pastTotal>0?past[k]/pastTotal:0)),0);
        if (score < bestScore) { bestScore=score; bestMatch={month:m,total:pastTotal}; }
      });
      if (!bestMatch || bestScore > 0.45) return null;
      return { ...bestMatch, similarity: Math.round((1-bestScore/2)*100) };
    }

    // ── SMART BUDGET SUGGESTION ───────────────────────────────────
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

    // ── WEEKLY DIGEST 📅 ──────────────────────────────────────────
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

    // ── WHY DID I BUY THIS — observation generator ───────────────
    function _generateWhyObservation(t) {
      const txns = D.transactions || [];
      const merchant = (t.merchant||'').toLowerCase();
      const hour = t.time ? parseInt(t.time.split(':')[0],10) : 12;
      const isLateNight = hour >= 22 || hour <= 4;
      const thisMonth = txns.filter(x=>x.month===t.month&&(x.merchant||'').toLowerCase()===merchant);
      const allTime = txns.filter(x=>(x.merchant||'').toLowerCase()===merchant);
      if (isLateNight && thisMonth.length >= 2)
        return 'This \u20b9'+t.amount+' '+t.merchant+' at '+t.time+' \u2014 '+thisMonth.length+' orders here this month were late night.';
      if (thisMonth.length >= 3)
        return t.merchant+' appears '+thisMonth.length+' times this month \u2014 '+fmtF(thisMonth.reduce((s,x)=>s+x.amount,0))+' total.';
      if (allTime.length >= 5)
        return 'You\u2019ve visited '+t.merchant+' '+allTime.length+' times. It\u2019s a regular habit.';
      const dayTotal = txns.filter(x=>x.date===t.date).reduce((s,x)=>s+x.amount,0);
      const dow = new Date((t.timestamp||Date.now())).toLocaleDateString('en-IN',{weekday:'long'});
      return 'A '+dow+' spend \u2014 '+fmtF(dayTotal)+' total that day.';
    }

    // ── MOOD PROMPT STYLES ────────────────────────────────────────
    (function() {
      if (document.getElementById('moodPromptStyle')) return;
      const s = document.createElement('style');
      s.id = 'moodPromptStyle';
      s.textContent = '#moodPrompt{position:fixed;bottom:calc(env(safe-area-inset-bottom,0px)+88px);left:50%;transform:translateX(-50%);background:var(--card);border:1px solid var(--fog);border-radius:40px;padding:8px 16px;display:none;align-items:center;gap:10px;box-shadow:0 8px 24px rgba(0,0,0,.12);z-index:801;white-space:nowrap}'
        +'.mood-q{font-size:12px;color:var(--slate);font-weight:600}'
        +'.mood-btn{font-size:22px;background:none;border:none;cursor:pointer;padding:4px;line-height:1;font-family:var(--ff)}';
      document.head.appendChild(s);
    })();

    function _installAIMethods() {

      // ── aiAddParse — fires on every keystroke ──
      APP.aiAddParse = function(val) {
        const status = document.getElementById('aiStatus');
        if (!val || val.trim().length < 3) { aiClear(); return; }
        const parsed = aiParseText(val);
        if (parsed) {
          if (status) status.textContent = '';
          aiShowConfirm(parsed);
        } else {
          if (status) status.textContent = 'Type amount + what it was for…';
          aiClear();
        }
      };

      // ── aiAddConfirm — Enter key shortcut ──
      APP.aiAddConfirm = function() {
        if (AI.parsed) this.aiSaveConfirmed();
      };

      // ── aiSaveConfirmed — save from AI card ──
      APP.aiSaveConfirmed = function() {
        const p = AI.parsed;
        if (!p) { toast('Nothing to save yet'); return; }
        if (!p.amt || p.amt <= 0) { toast('Please enter an amount'); return; }
        const now = new Date();
        const txn = {
          id: _mkTxnId(),
          timestamp: now.toISOString(),
          date: _fmtDate(now),
          time: _fmtTime(now),
          month: _fmtMonth(now),
          merchant: p.desc || 'Spend',
          amount: p.amt,
          bucket: p.bkt,
          source: p.src,
          tags: [..._addTags]
        };
        D.transactions = [txn, ...(D.transactions||[])];
        // Remember last used source
        D.lastSrc = p.src;
        _invalidateMerchantIndex(); // MQ-03
        DB.save(D); this.markUnsaved();
        _addTags = [];
        if (navigator.vibrate) navigator.vibrate(50);
        // AI reaction toast
        const reaction = (typeof getAIConfig==='function'&&getAIConfig().reactions===false) ? null : aiReaction(p.amt, p.desc, p.bkt, D.transactions.slice(1));
        toast(reaction, 3000);
        // Reset smart add
        const inp = document.getElementById('aiAddInput');
        if (inp) inp.value = '';
        aiClear();
        this.go('home');
      };

      // ── aiEditField — tap Edit on confirmation card ──
      APP.aiEditField = function(field) {
        // Hide card, show manual form, focus relevant field
        this.aiToggleManual(true);
        setTimeout(() => {
          if (field === 'amt') { const el = document.getElementById('addAmt'); if (el) { el.focus(); el.select(); } }
          if (field === 'desc') { const el = document.getElementById('addDesc'); if (el) { el.focus(); el.select(); } }
          if (field === 'bkt') { document.getElementById('bktGrid')?.scrollIntoView({behavior:'smooth'}); }
          if (field === 'src') { document.getElementById('srcGrid')?.scrollIntoView({behavior:'smooth'}); }
        }, 100);
      };

      // ── aiToggleManual — show/hide manual form ──
      APP.aiToggleManual = function(forceShow) {
        const form = document.getElementById('aiManualForm');
        const toggle = document.getElementById('aiManualToggle');
        if (!form) return;
        const show = forceShow !== undefined ? forceShow : form.style.display === 'none';
        form.style.display = show ? 'block' : 'none';
        if (toggle) toggle.innerHTML = show ? 'or <span>hide manual form ↑</span>' : 'or <span>add manually ↓</span>';
      };

      // ── aiVoiceToggle — start/stop voice ──
      APP.aiVoiceToggle = function() {
        if (!getAIConfig().voice) { toast('Voice input is disabled in AI Settings'); return; }
        const btn = document.getElementById('aiVoiceBtn');
        if (AI.voiceActive) {
          if (AI.voiceRec) AI.voiceRec.stop();
          AI.voiceActive = false;
          if (btn) { btn.classList.remove('recording'); btn.textContent = '🎤'; }
          return;
        }
        // Check API availability
        const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRec) {
          toast('Voice not supported on this browser');
          if (btn) btn.style.display = 'none';
          return;
        }
        const rec = new SpeechRec();
        rec.lang = 'en-IN';
        rec.interimResults = true;
        rec.maxAlternatives = 1;
        AI.voiceRec = rec;
        AI.voiceActive = true;
        if (btn) { btn.classList.add('recording'); btn.textContent = '⏹'; }
        const status = document.getElementById('aiStatus');
        if (status) status.textContent = '🎤 Listening…';
        const inp = document.getElementById('aiAddInput');
        rec.onresult = (e) => {
          const transcript = Array.from(e.results).map(r=>r[0].transcript).join('');
          if (inp) inp.value = transcript;
          if (status) status.textContent = transcript ? '' : '🎤 Listening…';
          APP.aiAddParse(transcript);
        };
        rec.onerror = (e) => {
          AI.voiceActive = false;
          if (btn) { btn.classList.remove('recording'); btn.textContent = '🎤'; btn.setAttribute('aria-pressed', 'false'); }
          if (status) status.textContent = '';
          if (e.error === 'not-allowed') toast('Microphone permission denied');
        };
        rec.onend = () => {
          AI.voiceActive = false;
          if (btn) { btn.classList.remove('recording'); btn.textContent = '🎤'; }
          if (status) status.textContent = '';
        };
        try { rec.start(); } catch(e) { AI.voiceActive = false; if (btn) { btn.classList.remove('recording'); btn.textContent = '🎤'; } }
      };





      // ── aiRenderInsight — render on home screen ──
      APP.aiRenderInsight = function() {
        if (!getAIConfig().insight) { const _c=document.getElementById('aiInsightCard'); if(_c) _c.style.display='none'; return; }
        try {
          const card = document.getElementById('aiInsightCard');
          const textEl = document.getElementById('aiInsightText');
          if (!card || !textEl) return;
          const d = _safeGet('sn_ai_insight', {}); // CR-03
          if (d.dismissed && d.week === _aiWeekKey()) { card.style.display = 'none'; return; }
          if (d.text && d.week === _aiWeekKey()) {
            textEl.textContent = d.text;
            card.style.display = 'block';
            return;
          }
          const insight = aiGenerateInsight();
          if (!insight) { card.style.display = 'none'; return; }
          textEl.textContent = insight;
          card.style.display = 'block';
          try { localStorage.setItem('sn_ai_insight', JSON.stringify({text: insight, week: _aiWeekKey()})); } catch(e) { console.warn("[catch]", e); }
        } catch(e) {
          console.warn('AI insight render error:', e);
          const card = document.getElementById('aiInsightCard');
          if (card) card.style.display = 'none';
        }
      };

      // ── aiDismissInsight ──
      APP.aiDismissInsight = function() {
        const card = document.getElementById('aiInsightCard');
        if (card) card.style.display = 'none';
        try { const d = JSON.parse(localStorage.getItem('sn_ai_insight')||'{}'); d.dismissed = true; d.week = _aiWeekKey(); localStorage.setItem('sn_ai_insight', JSON.stringify(d)); } catch(e) { console.warn("[catch]", e); }
      };

      // ── aiRenderForecast — render on home screen ──
      APP.aiRenderForecast = function() {
        if (!getAIConfig().forecast) { const _c=document.getElementById('aiForecastCard'); if(_c) _c.style.display='none'; return; }
        try {
          const card = document.getElementById('aiForecastCard');
          const textEl = document.getElementById('aiForecastText');
          const fill = document.getElementById('aiForecastFill');
          if (!card || !textEl) return;
          const f = aiGenerateForecast();
          if (!f) { card.style.display = 'none'; return; }
          textEl.textContent = f.text;
          if (fill) fill.style.width = f.pct + '%';
          if (fill) fill.style.background = f.pct > 90 ? '#ef4444' : f.pct > 70 ? '#f59e0b' : 'var(--teal)';
          card.style.display = 'block';
        } catch(e) {
          console.warn('AI forecast render error:', e);
          const card = document.getElementById('aiForecastCard');
          if (card) card.style.display = 'none';
        }
      };

      // ── IMP-1: aiRenderPayday — shows balance left + daily budget ──
      APP.aiRenderPayday = function() {
        const card = document.getElementById('aiPaydayCard');
        if (!card) return;
        if (!getAIConfig().paydayMode) { card.style.display = 'none'; return; }
        try {
          const info = _getPaydayInfo();
          if (!info) { card.style.display = 'none'; return; }
          const textEl = document.getElementById('aiPaydayText');
          const subEl = document.getElementById('aiPaydaySub');
          const leftSign = info.left < 0 ? '-' : '';
          if (textEl) textEl.textContent = `${info.pct}% spent · ${leftSign}${fmtF(Math.abs(info.left))} left`;
          if (subEl) subEl.textContent = info.dailyBudget > 0
            ? `${info.daysLeft} days left · ≈ ${fmtF(info.dailyBudget)}/day`
            : info.left < 0 ? `Over budget by ${fmtF(Math.abs(info.left))} 😬` : '';
          card.style.display = 'block';
        } catch(e) { if (card) card.style.display = 'none'; }
      };

      // ── IMP-2: aiRenderGuiltFree — shows zero-spend streak ──
      APP.aiRenderGuiltFree = function() {
        const card = document.getElementById('aiGuiltFreeCard');
        if (!card) return;
        if (!getAIConfig().guiltFree) { card.style.display = 'none'; return; }
        try {
          const streak = _getGuiltFreeStreak();
          if (streak < 1) { card.style.display = 'none'; return; }
          const textEl = document.getElementById('aiGuiltFreeText');
          const plural = streak === 1 ? 'day' : 'days';
          if (textEl) textEl.textContent = streak === 1
            ? `Yesterday was a guilt-free day 🌿`
            : `${streak} guilt-free ${plural} in a row — nice discipline! 🌿`;
          card.style.display = 'block';
        } catch(e) { if (card) card.style.display = 'none'; }
      };

      // ── IMP-5: aiRenderMonthEnd — warns about near/over limits last week ──
      APP.aiRenderMonthEnd = function() {
        const card = document.getElementById('aiMonthEndCard');
        if (!card) return;
        if (!getAIConfig().monthEndWarn) { card.style.display = 'none'; return; }
        try {
          // Check if dismissed this month
          const curMon = new Date().toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
          const warned = _safeGet('sn_monthend_warned', {}); // CR-03
          if (warned.dismissed && warned.month === curMon) { card.style.display = 'none'; return; }
          const warnings = _getMonthEndWarnings();
          if (warnings.length === 0) { card.style.display = 'none'; return; }
          const textEl = document.getElementById('aiMonthEndText');
          if (textEl) {
            textEl.innerHTML = warnings.map(w => {
              const icon = w.over ? '🔴' : '🟡';
              const msg = w.over
                ? `${icon} ${w.cfg.l}: over by ${fmtF(w.spent - w.limit)}`
                : `${icon} ${w.cfg.l}: ${Math.round(w.pct * 100)}% used — ${fmtF(w.limit - w.spent)} left`;
              return `<div>${msg}</div>`;
            }).join('');
          }
          card.style.display = 'block';
        } catch(e) { if (card) card.style.display = 'none'; }
      };

      // ── aiRenderStory — render on month screen ──
      APP.aiRenderStory = function(monthStr) {
        if (!getAIConfig().story) { const _c=document.getElementById('aiStoryCard'); if(_c) _c.style.display='none'; return; }
        try {
          const card = document.getElementById('aiStoryCard');
          const textEl = document.getElementById('aiStoryText');
          if (!card || !textEl) return;
          const story = aiGenerateStory(monthStr || offsetMonthStr(0));
          if (!story) { card.style.display = 'none'; return; }
          textEl.textContent = story;
          card.style.display = 'block';
        } catch(e) {
          console.warn('AI story render error:', e);
          const card = document.getElementById('aiStoryCard');
          if (card) card.style.display = 'none';
        }
      };

      // ── aiRenderMirror — render on month screen ──
      APP.aiRenderMirror = function() {
        if (!getAIConfig().mirror) { const _c=document.getElementById('aiMirrorCard'); if(_c) _c.style.display='none'; return; }
        try {
          const card = document.getElementById('aiMirrorCard');
          const textEl = document.getElementById('aiMirrorText');
          const btn = document.getElementById('aiMirrorBtn');
          if (!card || !textEl) return;
          const mirror = aiCheckMirror();
          if (!mirror) { card.style.display = 'none'; return; }
          textEl.textContent = mirror.text;
          if (btn) btn.textContent = `Set ${BUCKETS[mirror.bk]?.l || ''} limit to ${fmtF(mirror.newLimit)}`;
          card.style.display = 'block';
        } catch(e) {
          console.warn('AI mirror render error:', e);
          const card = document.getElementById('aiMirrorCard');
          if (card) card.style.display = 'none';
        }
      };

      // ── aiMirrorAction — user taps update limit ──
      APP.aiMirrorAction = function() {
        if (!AI.mirrorBucket || !AI.mirrorNewLimit) return;
        if (!D.limits) D.limits = {};
        D.limits[AI.mirrorBucket] = AI.mirrorNewLimit;
        DB.save(D); this.markUnsaved();
        // Mark as shown this month
        try {
          const shown = _safeGet('sn_mirror_shown', {}); // CR-03
          shown[AI.mirrorBucket] = offsetMonthStr(0);
          localStorage.setItem('sn_mirror_shown', JSON.stringify(shown));
        } catch(e) { console.warn("[catch]", e); }
        const card = document.getElementById('aiMirrorCard');
        if (card) card.style.display = 'none';
        toast(`${BUCKETS[AI.mirrorBucket]?.l} limit updated to ${fmtF(AI.mirrorNewLimit)} ✓`);
        AI.mirrorBucket = null;
      };

      // ── aiWhyThis — why did I buy this? ✨ ─────────────────────
      APP.aiWhyThis = function(id) {
        if (!getAIConfig().whyBuyThis) return;
        const t = (D.transactions||[]).find(x=>x.id===id);
        if (!t) return;
        const obs = _generateWhyObservation(t);
        userModal('✨ Pattern insight', obs, [{ l: 'Got it', c: 'mb-ok', a: () => this.cm() }]);
      };

      // ── applyBudgetSuggestion ─────────────────────────────────
      APP.applyBudgetSuggestion = function() {
        if (!window._aiSuggestedLimits) return;
        D.limits = { ...window._aiSuggestedLimits };
        DB.save(D); this.markUnsaved();
        this.r_limits();
        toast('Limits applied from your spending history \u2713');
      };

      // ── Mood tagging ─────────────────────────────────────────
      APP._showMoodPrompt = function(txId) {
        if (!getAIConfig().mood) return;
        const el = document.getElementById('moodPrompt');
        if (!el) return;
        el._pendingId = txId;
        el.style.display = 'flex';
        clearTimeout(el._t);
        el._t = setTimeout(() => {
          if (el._pendingId === txId) { el.style.display='none'; }
        }, 4500);
      };
      APP.tapMood = function(mood) {
        const el = document.getElementById('moodPrompt');
        if (!el) return;
        clearTimeout(el._t);
        const txId = el._pendingId;
        el.style.display = 'none';
        if (!txId) return;
        const t = (D.transactions||[]).find(x=>x.id===txId);
        if (t) { t.mood = mood; DB.save(D); }
        if (mood === 'regret') toast('Noted. Your patterns will reflect this.');
      };

    }

    // ── OCR TEXT PARSER ─────────────────────────────────────────────
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

    // ── v5.0 AI FEATURES ─────────────────────────────────────────────

    // Feature 1: 3am Warning
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

    // Feature 2: Category Creep Detector
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

    // Feature 3: Salary Day Intelligence
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

    // Feature 4: Honest Comparison
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

    // ── Week key helper ─────────────────────────────────────────────
    function _aiWeekKey() {
      return 'w' + Math.floor(Date.now() / (WEEK_MS));
    }

    // ── FEATURE 1: PAYDAY MODE ────────────────────────────────────────
    // Detects approximate payday from history, shows balance left this month
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

    // ── FEATURE 2: GUILT-FREE DAY STREAK ─────────────────────────────
    // Counts consecutive days with zero spends
    function _getGuiltFreeStreak() {
      const txns = D.transactions || [];
      if (txns.length === 0) return 0;
      const now = new Date();
      let streak = 0;
      // Walk back from yesterday
      for (let i = 1; i <= 30; i++) {
        const d = new Date(now); d.setDate(d.getDate() - i);
        const dateStr = d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
        const hasSpend = txns.some(t => t.date === dateStr);
        if (hasSpend) break;
        streak++;
      }
      return streak;
    }

    // ── FEATURE 3: MERCHANT FREQUENCY ALERT ──────────────────────────
    // Called from aiReaction — returns alert string or null
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

    // ── FEATURE 4: SMART AMOUNT SUGGEST ──────────────────────────────
    // Returns last amount for a matched merchant, or null
    function _getLastAmount(desc) {
      if (!desc || desc.length < 2) return null;
      const lower = desc.toLowerCase();
      const txns = D.transactions || [];
      for (const t of txns) {
        if (t.merchant && t.merchant.toLowerCase() === lower && t.amount > 0) {
          return t.amount;
        }
      }
      return null;
    }

    // ── FEATURE 5: MONTH-END WARNING ─────────────────────────────────
    // Returns array of buckets near/over limit in last week of month, or []
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

    // ── INSTALL AI METHODS + HOOK r_home / r_add / r_month ──────────
    // BUG-7: rHist + rHistDebounced — called from HTML oninput but were never defined
    function rHist() { if (APP && APP.r_history) APP.r_history(); }
    let _rHistTimer; // LW-02: let not var
    function rHistDebounced() {
      clearTimeout(_rHistTimer);
      _rHistTimer = setTimeout(rHist, 200);
    }

    _guardAPP(APP);
    _installAIMethods();
    // Seed tag registry from existing transaction history (runs once)
    try { migrateTagsToRegistry(); } catch(e) { console.warn("[catch]", e); }

    // Hook r_home to also render AI cards
    const _origRHome = APP.r_home.bind(APP);
    APP.r_home = function() {
      _origRHome();
      APP.aiRenderInsight();
      APP.aiRenderForecast();
      APP.aiRenderPayday();
      APP.aiRenderGuiltFree();
      APP.aiRenderMonthEnd();
    };

    // Hook r_add to reset AI smart add input
    const _origRAdd = APP.r_add.bind(APP);
    APP.r_add = function() {
      _origRAdd();
      const inp = document.getElementById('aiAddInput');
      if (inp) inp.value = '';
      aiClear();
      // Show manual form by default if coming back from edit
      const form = document.getElementById('aiManualForm');
      if (form) form.style.display = 'none';
    };

    // Hook r_month to render AI story + mirror
    const _origRMonth = APP.r_month ? APP.r_month.bind(APP) : null;
    if (_origRMonth) {
      APP.r_month = function(...args) {
        _origRMonth(...args);
        const monthStr = (S && S.monthOffset !== undefined) ? offsetMonthStr(S.monthOffset) : offsetMonthStr(0);
        APP.aiRenderStory(monthStr);
        APP.aiRenderMirror();
        APP.aiRenderSpendTwin(monthStr);
        // FIX-5A: peek pattern — remove mask after first scroll
        const _mmBody = document.getElementById('mmBody');
        if (_mmBody) {
          _mmBody.classList.remove('scrolled-once');
          const _onceScroll = () => {
            _mmBody.classList.add('scrolled-once');
            _mmBody.removeEventListener('scroll', _onceScroll);
          };
          _mmBody.addEventListener('scroll', _onceScroll, { passive: true });
        }
      };
    }

    // Hook saveManual to also show AI reaction
    const _origSaveManual = APP.saveManual.bind(APP);
    APP.saveManual = function() {
      _invalidateMerchantIndex(); // MQ-03
      if (S.saveBusy) return; // BUG-006: prevent double-save in AI hook
      const amtEl = document.getElementById('addAmt');
      const amt = parseINR((amtEl && amtEl.value) || '0');
      const desc = (document.getElementById('addDesc') && document.getElementById('addDesc').value || '').trim();
      const bkt = S.addBkt;
      // Call original save
      _origSaveManual();
      // Show AI reaction after a brief delay
      if (amt > 0 && bkt) {
        setTimeout(() => {
          const reaction = (typeof getAIConfig==='function'&&getAIConfig().reactions===false) ? null : aiReaction(amt, desc, bkt, D.transactions || []);
          toast(reaction, 3000);
        }, 300);
      }
      // Record tags to registry
      if (_addTags && _addTags.length > 0) {
        for (const tag of _addTags) recordTagUsage(tag);
      }
    };

    // Wrap aiSaveConfirmed to record tags after AI save
    const _origAiSaveConfirmed = APP.aiSaveConfirmed ? APP.aiSaveConfirmed.bind(APP) : null;
    if (_origAiSaveConfirmed) {
      APP.aiSaveConfirmed = function() {
        // Record tags before save clears _addTags
        const tagsToRecord = [...(_addTags || [])];
        _origAiSaveConfirmed.call(this);
        for (const tag of tagsToRecord) recordTagUsage(tag);
      };
    }

    // Wrap hToggleTag to record tag registry usage
    const _origHToggleTag = APP.hToggleTag ? APP.hToggleTag.bind(APP) : null;
    if (_origHToggleTag) {
      APP.hToggleTag = function(txnId, tag) {
        _origHToggleTag.call(this, txnId, tag);
        recordTagUsage(tag);
      };
    }

    // Wrap _refreshTxnTagUI to use dynamic tag list
    const _origRefreshTxnTagUI = APP._refreshTxnTagUI ? APP._refreshTxnTagUI.bind(APP) : null;
    if (_origRefreshTxnTagUI) {
      APP._refreshTxnTagUI = function(txnId) {
        const chipsEl = document.getElementById(`iet_${txnId}`);
        if (!chipsEl) return;
        const t = (D.transactions || []).find(x => x.id === txnId);
        if (!t) return;
        const tTags = t.tags || [];
        const allTags = getDynamicTagList();
        chipsEl.innerHTML = allTags.map(tag => {
          const on = tTags.includes(tag);
          return `<button class="tag-chip${on?' on':''}" onclick="APP.hToggleTag('${txnId}','${esc(tag)}')">` +
            `#${esc(tag)}</button>`;
        }).join('');
      };
    }

    // ── TAG MANAGER MODAL ─────────────────────────────────────────────
    APP.showTagManager = function() {
      const registry = _loadTagRegistry();
      const customTags = registry.tags
        .filter(t => !PRESET_TAGS.includes(t.name))
        .sort((a, b) => (b.lastUsed || 0) - (a.lastUsed || 0));

      const tagRows = customTags.length === 0
        ? '<p style="color:var(--slate);font-size:14px;text-align:center;padding:20px 0">No custom tags yet.<br>Add tags while logging spends.</p>'
        : customTags.map(t => {
            const daysAgo = Math.floor((Date.now() - (t.lastUsed || 0)) / MS_PER_DAY);
            const lastUsedStr = daysAgo === 0 ? 'Today' : daysAgo === 1 ? 'Yesterday' : `${daysAgo}d ago`;
            return `<div style="display:flex;align-items:center;justify-content:space-between;padding:10px 0;border-bottom:1px solid var(--fog)">
              <div>
                <span style="font-size:13px;font-weight:600;color:var(--ink)">#${esc(t.name)}</span>
                <span style="font-size:11px;color:var(--slate);margin-left:8px">${t.useCount||1}× · ${lastUsedStr}</span>
              </div>
              <button onclick="APP._deleteCustomTag('${esc(t.name)}')"
                style="background:none;border:none;font-size:16px;cursor:pointer;color:var(--slate);padding:4px 8px">🗑</button>
            </div>`;
          }).join('');

      safeModal('🏷 My Custom Tags',
        `<div style="margin-bottom:12px;font-size:13px;color:var(--slate)">Custom tags are remembered for ${TAG_PRUNE_DAYS} days after last use.</div>` + tagRows,
        [{ l: 'Done', c: 'mb-ok', a: () => this.cm() }]
      );
    };

    APP._deleteCustomTag = function(tagName) {
      const registry = _loadTagRegistry();
      registry.tags = registry.tags.filter(t => t.name !== tagName);
      _saveTagRegistry(registry);
      this.cm();
      setTimeout(() => this.showTagManager(), 50);
    };

    // BUG-017: global error handlers
    // BUG-6: Pinch zoom snap-back on iOS
    (function(){
      var _lte=0,_pin=false;
      document.addEventListener('touchstart',function(e){
        if(e.touches.length>=2)_pin=true;
      },{passive:true});
      document.addEventListener('touchend',function(e){
        var now=Date.now();
        if(e.touches.length===0&&now-_lte<=300&&!_pin)e.preventDefault();
        if(e.touches.length===0)_lte=now;
        if(_pin&&e.touches.length===0){
          _pin=false;
          setTimeout(function(){
            var m=document.querySelector('meta[name=viewport]');
            if(!m)return;
            var o=m.getAttribute('content');
            m.setAttribute('content',o+',maximum-scale=1.0,minimum-scale=1.0');
            requestAnimationFrame(function(){
              requestAnimationFrame(function(){m.setAttribute('content',o);});
            });
          },120);
        }
      },{passive:false});
    })();
    window.onerror = (msg, src, line) => { console.error('Global error:', msg, src, line); };
    window.addEventListener('unhandledrejection', e => {
      console.error('Unhandled promise:', e.reason);
      if (e.reason && String(e.reason).toLowerCase().indexOf('storage') === -1) {
        toast('Something went wrong. Please try again.');
      }
      e.preventDefault();
    });

        // BUG-020: Escape key closes modal
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && document.getElementById('modal').classList.contains('on')) APP.cm();
    });

        APP.boot();

    // BUG-021: Swipe right to go back on sub-screens
    (function () {
      let sx = 0, sy = 0;
      const BACK_SCREENS = { sort: 'home', slice: 'month', add: 'home', limits: 'home', settings: 'home' };
      document.addEventListener('touchstart', e => { if (e.touches.length === 1) { sx = e.touches[0].clientX; sy = e.touches[0].clientY; } }, { passive: true });
      document.addEventListener('touchend', e => {
        if (!e.changedTouches.length) return;
        const dx = e.changedTouches[0].clientX - sx, dy = e.changedTouches[0].clientY - sy;
        if (sx > 30) return; // must start from left edge
        if (dx > 60 && Math.abs(dy) < 80) {
          const dest = BACK_SCREENS[S.tab];
          if (dest) APP.go(dest);
        }
      }, { passive: true });
    })();
