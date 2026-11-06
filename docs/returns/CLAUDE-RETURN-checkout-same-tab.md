# CLAUDE RETURN: checkout-same-tab (slow/blank Stripe tab on Upgrade)
Fixed under Hunter's standing OK; Liz's diagnosis (Shift test: Worker answers in ~0.5s, Stripe tab sat blank 22–50s on all 6 taps). Liz's ticket not needed.
Branch `claude/checkout-same-tab` · stacked on #17 · app.html sha256 `d81fbb6af2d4fb20cbe21f29e1dfe6cc4f4a5433699ee15356a279e239aebb65` · 292752 B
**DO NOT MERGE until Liz PASS + Shift ships + Hunter phone PASS.**

## Cause
`yfsOpenCheckout()` and `yfsCheckoutPlan()` waited for `/api/pro/checkout`, THEN called `window.open(url,'_blank')`. A new tab opened after an await is no longer tied to the tap, so phones/in-app browsers treat it as a pop-up: blocked, stalled, or opened blank.

## Fix
- Both now do `window.location.assign(d.url)` → Stripe loads in the same tab. The Worker already sends people back to `app.html?checkout=success|canceled`, so pay → return → Pro verified in the SAME browser (also fixes "paid inside TikTok's browser, no Pro in Safari").
- Double-tap guard: one checkout session per tap; resets on failure, on return from Stripe (pageshow) and after 15s.
- Failure path unchanged: "Checkout is unavailable… You have not been charged." No Worker, price or Stripe changes.

## Tests
- New `tests/cotab_t.js` ALL PASS: same tab lands on Stripe, no new tab, triple tap = 1 session, failure alert + retry, src=tiktok-ad still sent, back button → Upgrade works again.
- `src_t.js` / `frt_t.js`: harness now answers the fake Stripe page with 204 so the test stays on the app (old behavior opened a tab the test closed). Both ALL PASS on this build AND on LIVE.
- refresh/adtag/heard/org/owen ALL PASS; e2e + upg_t output identical to LIVE.

## Phone check (Hunter)
Free run → Upgrade → Stripe should appear in the same tab within ~2–3s. Tap ← back: app is still there. Don't pay.
