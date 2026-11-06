# CLAUDE RETURN: owen-landing
Base: LIVE tip d613ae0a · app.html sha256 7dc7461f53c4564ae02bdc15651d88b96aefc74089a72e48ad1d434fd9376600 · 265045 B (verified, matches ticket)
**Built on top of src-tracking** (ticket says it depends on it). This file = src-tracking + Owen card. Ship src-tracking first, or ship this file alone (it contains both).
Return: app.html · sha256 fd2e1681d2948aeecc8f95053bf1bcf46aff67e8a8a2abdae06a63fdc1b7ab35 · 269517 bytes · Scope: app.html only
Branch: claude/owen-landing (stacked on claude/src-tracking) · PR: __PR__
Screenshots (390x844): docs/returns/owen-landing-390x844.png (Start screen) · docs/returns/owen-landing-xray-390x844.png (`#tool-1`)
**DO NOT MERGE until Liz PASS + Shift ships + Hunter phone PASS.**

## Summary (plain English)
If someone arrives from a link with `?src=tiktok` (or `reels` / `shorts`), they see a small amber card at the top: **"Owen sent you. Your free run is ready."** with an ✕ to close it. It sits above the page and pushes nothing off screen. All the buttons still work with one tap. Without a src, nobody sees it.
To keep it honest, the card only shows when the free run really is ready. It does not show for Pro users or after the free run is used, and it goes away once they run it.

## Changelog
- New `<style id="yfs-owen">` before `</head>`: light amber card (#FFFBEB, amber border/accent, navy #0F172A text), 44px ✕ tap target, hidden in print.
- New `<script id="yfs-owen-js">` at end of `<body>`:
  - Adds one `<div id="yfsOwen">` above the Start screen. Same spot works for the Start screen and for deep links (`#tool-1`).
  - Shows only if: a known src came in **this visit** (`yfsSrcThisSession()` from src-tracking), not dismissed this session, not Pro, free run not used.
  - ✕ hides it for the rest of the session (survives tool switching + reload).
  - Wraps `updateUsagePill` so the card hides as soon as the free run is used or Pro unlocks.
- Copy is exactly the ticket's. No testimonial, no claim Owen used the app.
- Test: new `tests/owen_t.js`.

## Test results (Playwright, 390x844, Worker + Stripe mocked, nothing real called)
- `owen_t.js`: **ALL PASS**
  - T1 `?src=tiktok` Start: card shown, copy exact, 66px tall, "Fix my resume" card still above the fold
  - T2 `reels`, `shorts`: shown
  - T3 no src / `facebook` / empty / src only from an earlier visit: no card
  - T4 Pro / free run already used: no card
  - T5 `?src=tiktok#tool-1`: X-Ray open + card; Run button enabled and not covered; one tap = 1 AI run; card gone after the run
  - T6 ✕ → stays hidden after tool switch and reload; Start cards still work
  - T7 hidden in print
- `src_t.js` (src-tracking): ALL PASS on this file too
- Regression, output identical base vs new: `e2e.js`, `upg_t.js`, `frt_t.js` (ALL PASS), `persist_t.js`. No page errors.

## Hunter phone steps (Android, Chrome, Incognito)
1. Open `yourfirstshiftapp.com/app.html?src=tiktok`. PASS = small amber card at the top: "Owen sent you. Your free run is ready."
2. Tap "Fix my resume for a job". It opens with one tap (the card stays on top, nothing blocked).
3. Tap ✕ on the card. It disappears. Go back to All tasks: it stays gone.
4. Open a new Incognito tab: `yourfirstshiftapp.com/app.html` (no `?src`). PASS = no card.
5. Optional: new Incognito tab with `?src=tiktok`, run your free X-Ray. The card goes away after the run.

## Rollback
Redeploy the base app.html (tip d613ae0a, sha256 7dc7461f…6600). To keep src-tracking but drop the card: redeploy the src-tracking app.html (sha256 c9622d12…acc9).

## Not done / notes
- Not done (outside Claude's role): deploy, merge to main.
- The root landing page (`yourfirstshiftapp.com/`, index.html) isn't in this repo or the ticket base, so the card is on the app's Start screen. With the bio link `…/app.html?src=tiktok` this is the first screen people see. If the bio must be the root, index.html needs its own ticket (see src-tracking return).
