    // ════════════════════════════════════════════════════════════════
    //  DAL — js/dal/common/storage.js
    //  The only layer that touches localStorage for these concerns.
    //  Extracted verbatim from js/app.js (batch 1 of restructure —
    //  see spend-na-restructure.md). Plain classic script, same
    //  global scope as app.js — NOT an ES module. Loaded before
    //  app.js in index.html. No logic changes, no renamed functions,
    //  no schema changes — pure file relocation.
    // ════════════════════════════════════════════════════════════════

    // ── TAG REGISTRY constants (only ones needed by the functions below) ──
    const TAG_REGISTRY_KEY = 'sn_tag_registry';
    const TAG_PRUNE_DAYS = 90;
    // v6.19-restructure: was `TAG_PRUNE_DAYS * MS_PER_DAY` in app.js, where
    // MS_PER_DAY is a general-purpose time constant used by several
    // BAL-ish functions elsewhere and intentionally NOT moved here (it isn't
    // a storage concern). Inlined the same literal value (86400000) instead
    // of importing across the classic-script boundary — identical number,
    // zero behavior change, no new cross-file dependency.
    const TAG_PRUNE_MS = TAG_PRUNE_DAYS * 86400000;

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

    function pruneOldTags() {
      const registry = _loadTagRegistry();
      const cutoff = Date.now() - TAG_PRUNE_MS;
      registry.tags = registry.tags.filter(t => (t.lastUsed || 0) >= cutoff);
      _saveTagRegistry(registry);
    }

    function isStorageAvailable() {
      try { localStorage.setItem('_sn_test', '1'); localStorage.removeItem('_sn_test'); return true; }
      catch (e) { return false; }
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // SCHEMA VERSION + v1→v2 MIGRATION
    // Called on every load (localStorage + file import).
    // Only operates in memory — user must Save to persist.
    // Never renames keys. Never deletes data. Only adds defaults.
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    const SCHEMA_VERSION = 2;

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

    // ════════════════════════════════════════════════════════════════
    //  BATCH 3 additions — see spend-na-restructure.md report.
    //  LS/DB/SRC_DB/SHARD/debouncedSave/_commitSave/migrateTagsToRegistry.
    //  These reference D (js/core/state.js), BUCKETS/FLAGS/toast/
    //  offsetMonthStr/APP (still in js/app.js) — all resolved at CALL
    //  time, not at declaration time, so load order (this file before
    //  app.js) is safe: none of these run until user interaction, by
    //  which point app.js has finished defining everything else.
    //  Pure relocation — no renames, no logic changes.
    // ════════════════════════════════════════════════════════════════

    const LS = 'sn_v4';

    // ── TAG REGISTRY MIGRATION ──────────────────────────────────────
    // TODO: mixed DATA+read-of-app-constant concern (reads D + PRESET_TAGS,
    // both still in app.js) — see PIB. Kept as DAL per restructure doc's
    // named file mapping; not split further this pass.
    function migrateTagsToRegistry() {
      // Run once: scan all transactions and seed registry with existing custom tags
      const registry = _loadTagRegistry();
      // BUGFIX (post-restructure, explicit user request): the pre-existing
      // call site ran this at module-load time, before D existed, so every
      // real user's registry got poisoned with _migrated=true + tags:[]
      // on their very first page load, ever — confirmed via real-user-data
      // testing. Moving the call into launch() (js/app.js) fixes it for
      // NEW installs, but existing devices already have that poisoned
      // state saved. Heuristic to self-heal: an already-"migrated"
      // registry with zero tags is indistinguishable from the broken
      // state (a legitimately tag-free user also has zero tags) — so
      // re-running the scan in that case is a safe, idempotent no-op for
      // genuinely tag-free users, and a real fix for poisoned ones. Once
      // any tag exists, _migrated blocks re-scans normally.
      if (registry._migrated && registry.tags.length > 0) return;
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

    // ── PRIMARY DATABASE ─────────────────────────────────────────────
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

    // ── DATA SHARDING + LAZY LOADING ──────────────────────────────
    // D.transactions is the single source of truth. SHARD adds a
    // logical layer on top for future month-by-month lazy loading.
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

    // ── SAVE HELPERS ──────────────────────────────────────────────
    let _saveTimer; function debouncedSave(d, ms) { if (!d) return; ms = ms || 300; clearTimeout(_saveTimer); _saveTimer = setTimeout(function(){ try { DB.save(d); } catch(e) { console.error('[debouncedSave]', e); toast('⚠️ Save failed'); } }, ms); } // HR-04

    // TODO: mixed UI+DATA concern, split pending — see PIB
    // (also touches APP.markUnsaved() and toast() — kept whole per
    // restructure doc's "move to primary concern" rule for this pass)
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

    // ── TRANSACTION MUTATION (pure D writes, no DOM) — batch 4 ──────
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
