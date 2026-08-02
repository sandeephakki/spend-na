// ═══════════════════════════════════════════════════
// ENV-CONFIG — v5.8
// Detects which deployment is running (local / QA / prod) purely from
// location.hostname — no build step, no server, matches the rest of this
// PWA's "no backend" constraint. Exposes ONE global, window.ENV, that the
// rest of the app reads. Nothing else should sniff location.hostname
// directly — add new per-environment behavior here, not scattered around.
//
// MUST load before app.js (and ideally before the theme bootstrap in
// index.html <head>) since app.js reads window.ENV.debug at boot and the
// SW registration reads window.ENV.basePath.
//
// Configured for: QA = sandeephakki-qa.github.io/spend-na/ (GitHub Pages
// project site). Prod = www.spendna.in (custom domain, added v6.15 — serves
// from root) with sandeephakki.github.io/spend-na/ kept as a fallback prod
// match in case the old URL is still reachable during DNS cutover — each
// hostname maps to its OWN path prefix below since a custom domain and a
// GitHub Pages project subpath need different values.
// ═══════════════════════════════════════════════════
(function () {
  var QA_HOSTNAMES = ['sandeephakki-qa.github.io'];
  var QA_PATH_PREFIX = '/spend-na/';

  // hostname -> path prefix (custom domains serve from root; a GitHub Pages
  // project page serves from /<repo>/)
  var PROD_HOSTS = {
    'www.spendna.in': '/',
    'spendna.in': '/',
    'sandeephakki.github.io': '/spend-na/'
  };
  var PROD_HOSTNAMES = Object.keys(PROD_HOSTS);
  // ═══════════════════════════════════════════════════

  var host = location.hostname;
  var isLocal = host === 'localhost' || host === '127.0.0.1' || host === '' || location.protocol === 'file:';
  var isQA = QA_HOSTNAMES.indexOf(host) !== -1;
  var isProd = PROD_HOSTNAMES.indexOf(host) !== -1;

  var name, label, debug, basePath;
  if (isLocal) {
    name = 'local'; label = 'LOCAL'; debug = true; basePath = '/';
  } else if (isQA) {
    name = 'qa'; label = 'QA'; debug = true; basePath = QA_PATH_PREFIX;
  } else if (isProd) {
    name = 'prod'; label = null; debug = false; basePath = PROD_HOSTS[host];
  } else {
    // Unrecognized host (e.g. a PR preview, a fork, someone's own clone) —
    // fail safe toward prod behavior (no debug noise, no stray ribbon) but
    // flag it distinctly in case that's wrong for your setup.
    name = 'unknown'; label = null; debug = false; basePath = '/';
  }

  window.ENV = {
    name: name,              // 'local' | 'qa' | 'prod' | 'unknown'
    label: label,            // ribbon text, or null to show nothing
    debug: debug,            // wired into app.js's DEBUG const
    basePath: basePath,      // prefix for absolute-path assets (sw.js, manifest)
    swPath: basePath + 'sw.js',
    isProd: name === 'prod'
  };

  // Small visual ribbon so QA/local can't be mistaken for prod — self-
  // contained here (no changes needed to styles.css or index.html markup).
  // Shows nothing at all in prod or on an unrecognized host.
  if (window.ENV.label) {
    document.addEventListener('DOMContentLoaded', function () {
      var el = document.createElement('div');
      el.textContent = window.ENV.label;
      el.setAttribute('aria-hidden', 'true');
      el.style.cssText = [
        'position:fixed', 'top:0', 'right:0', 'z-index:99999',
        'background:#dc2626', 'color:#fff', 'font:700 10px/1 -apple-system,sans-serif',
        'padding:3px 8px', 'letter-spacing:.06em',
        'border-bottom-left-radius:8px', 'pointer-events:none'
      ].join(';');
      document.body.appendChild(el);
    });
  }
})();
