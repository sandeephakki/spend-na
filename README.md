# Spend-na

Personal finance tracker — your money, your device. A single-file, offline-first
PWA. Excel/JSON is the database; the HTML file is a stateless transformation
layer with no server and no login-session persistence beyond what you export.

**Version:** v5.5 · **Schema version:** 2 · **Host:** GitHub Pages (`git push` = deployed)

---

## Deploying

Repo root needs all of these (not just `index.html`):

```
your-repo/
├── index.html       ← the app
├── manifest.json    ← PWA install metadata
├── sw.js            ← service worker (must be same-origin, see below)
├── icon-192.png
├── icon-512.png
└── .nojekyll        ← stops GitHub Pages stripping files during Jekyll processing
```

After pushing, verify: DevTools → Application → Service Workers shows
"activated and running", and Application → Manifest shows no errors.

---

## Design principles (enforced — see the PIB comment block at the top of `index.html`)

- **Single-file app logic.** No build step, no npm. `sw.js`/`manifest.json`/icons
  are the one accepted exception — they're inert PWA plumbing, not app logic.
- **Offline-first.** The app never requires a network connection after first load.
- **No external AI calls.** Every "AI" feature (insights, forecasts, budget
  suggestions, merchant matching) is rule-based logic running on-device.
- **Stateless by design.** There is no "save session and reopen later." Your
  exported JSON file is the database; the app is a pure transform over it.

---

## Why the UI is built mobile-portrait-first

Spend-na is designed to be used like a native phone app — one-handed, quick
entries, thumb-reachable buttons — not as a general-purpose responsive web
app. That shows up directly in the CSS:

```css
/* mobile (default): the app fills the real screen */
@media (max-width: 767px) { #app { width: 100%; height: 100%; } }

/* tablet/desktop: render the SAME phone layout as a fixed-size card,
   centered on the page — a phone mockup, not a redesigned desktop UI */
@media (min-width: 768px)  { #app { width: 420px; height: 820px;  } }
@media (min-width: 1200px) { #app { width: 440px; height: 880px;  } }
```

So on a laptop, you're not getting a "desktop version" — you're getting the
phone UI rendered inside a fixed 420×820 box in the middle of the screen.
That's a deliberate, cheap way to make a solo-developer single-file app look
intentional on any screen, without maintaining two layouts. `manifest.json`
also declares `"orientation": "portrait-primary"`, which locks orientation
*for an installed/standalone PWA* — reinforcing that portrait is the one
supported shape.

## Why not every screen size/orientation actually works

The whole file has exactly **three width breakpoints (767px / 768px / 1200px)
and zero orientation queries.** That has real consequences the width-only
model doesn't account for:

- **Rotating a phone to landscape breaks the illusion.** A phone in landscape
  is typically 700–930px wide — past the 767px breakpoint. So the app stops
  filling the screen and instead renders as the small fixed 420×820 "card,"
  letterboxed in the middle of a landscape phone screen, with large empty
  margins either side. Nothing in the CSS detects `orientation: landscape`
  and adapts; the phone layout is just shown at the wrong scale.
- **Small tablets sit exactly on the seam.** A 768px-wide iPad (portrait)
  crosses into the "desktop card" treatment even though it's a touch device
  held like a tablet, not a mouse-driven desktop — so touch targets and text
  are sized for a 420px phone card rather than for a tablet actually being
  touched.
- **Internal content doesn't reflow for width — only the outer shell does.**
  Things like the Insights bar charts (`.ins-bar-track`), modal widths
  (hardcoded `max-width: 340px` / `380px` / `480px` at different call sites),
  and the bucket grid assume a ~360–420px column. On the rare paths where the
  outer shell *is* wider (desktop card, future landscape support), none of
  that inner content was designed to use the extra space — it just sits in a
  narrow column with more surrounding empty space.
- **`orientation: portrait-primary` only helps installed PWAs.** If Sandeep
  opens the site in a normal mobile browser tab (not "Add to Home Screen"),
  nothing stops or adapts to landscape — the manifest hint doesn't apply.

**In short:** the app supports one shape well — a narrow portrait column,
whether that's a real phone screen or a simulated phone-card on desktop.
Anything that isn't that shape (phone landscape, tablet portrait near 768px,
foldables) falls back to the desktop treatment by accident of width, not by
design, and looks off rather than adapting.

### Fix applied in v5.5
Added a `.rotate-guard` overlay: `@media (orientation: landscape) and
(max-height: 500px) and (pointer: coarse)` hides `#app` and shows a
"please rotate your device" screen instead. That condition is deliberately
narrow so it **only** fires for an actual phone turned sideways:

- `pointer: coarse` excludes any mouse-driven desktop/laptop window, even one
  resized short and wide.
- `max-height: 500px` excludes tablets in landscape (an iPad landscape is
  ~768px tall) — they still get the existing card layout.

This closes the letterboxing bug without touching the desktop "phone card"
treatment or building out a full landscape layout. The second, more thorough
option below is still open if it's ever worth the effort:

**Not done in v5.5** — a real landscape layout (tab bar moved to the side,
content reflowed) instead of just blocking the broken state. Left as a
possible follow-up.

---

## What's new in v5.5

- Real `sw.js` service worker (data: URI registration was silently failing on
  modern Chrome/Firefox — no offline support, no install prompt).
- `manifest.json` + `icon-192.png` / `icon-512.png` + `.nojekyll` — PWA install
  now actually works.
- `safeModal()` / `userModal()` helpers — closes out the modal-body XSS gap;
  every call site now states whether its content is static or user-derived.
- `merchantNorm` — new feature. Suggests your canonical merchant spelling
  ("Maiyas Coffee" vs "Maiyya Coffee") when you type a close variant.
- `spendTwin`, `budgetSuggest`, `weeklyDigest` — these already had working
  logic in v5.4 but were never called from any screen. Now wired into
  Insights, Limits, and Home respectively.
- Day-of-week spend chart added to Insights.
- `console.log` calls now gated behind a `DEBUG` flag (off by default).
- Rotate-guard overlay: phones in landscape now see a "please rotate" screen
  instead of the letterboxed desktop card layout (tablets/desktop unaffected).

See the PIB comment block at the top of `index.html` (sections 1–10) for the
full versioned history and gotcha list — it's the single source of truth for
this project and is updated on every change.
