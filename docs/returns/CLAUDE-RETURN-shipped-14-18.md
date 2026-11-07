# CLAUDE RETURN: shipped-14-18 (follow-ups from Liz's review)

**DO NOT MERGE until Liz PASS + Shift ships + Hunter phone PASS.**

## Summary (plain English)
Liz's two follow-ups were mostly already built in PR #20/#21 (the "Opening secure checkout… 🔒 Stripe" spinner and a double-tap guard on every checkout button, including yfsCheckoutPlan). The one missing piece was the **~10 second timeout**: if the payment server never answered, the spinner would spin forever and the button stayed locked. Now, after 10 seconds the spinner goes away and the person sees: "Checkout is taking too long to open. Please check your connection and tap again. You have not been charged." Tapping again works normally. A slow-but-working server (e.g. 7s) still goes to Stripe as before.

## Changelog
- app.html `yfsGoCheckout` (used by yfsOpenCheckout and yfsCheckoutPlan): 10s timeout (`YFS_CO_TIMEOUT_MS=10000`) via AbortController + a Promise.race backstop for browsers where abort doesn't fire; reads the reply with a 3s cap; on timeout clears spinner + busy flag and shows an honest "taking too long / not charged" alert. Success, 409 plan_unavailable and generic-error paths unchanged.
- tests/cotimeout_t.js: new test (mocked Worker only).
- No CSS, pricing, Worker or Stripe changes.

## Base / hashes
- Branch: claude/shipped-14-18 · PR: https://github.com/Hoc5454/yourfirstshift-site/pull/24 (stacked on #21; ship #21 first)
- Base: branch claude/polish (PR #21) app.html sha256 c7815286d7c5f4ecb51ed6eb27c157de3a03f648eb7c832fcac2516fe985540c · 301,123 B — stacked on #21 because the spinner + double-tap guard live there (main = live d81fbb6a… does not have them yet).
- New app.html sha256 c7191a2846aabcb68dbbe577b941d220f2f8505305ccb2b4090d5b37ca4ad383 · 301,947 B
- Live main app.html (rollback) d81fbb6af2d4fb20cbe21f29e1dfe6cc4f4a5433699ee15356a279e239aebb65 · 292,752 B

## Tests
- cotimeout_t.js 12/12 PASS (spinner shows; triple tap = 1 call; still waiting at 9s; gives up at ~10.0s; honest alert; stays on app; tap again → Stripe same tab; fast and 7s Workers → Stripe with no alert; no page errors)
- plans_t.js ALL PASS, cotab_t.js ALL PASS
- e2e.js + upg_t.js output identical to base (#21); no PAGEERR
- Screenshot: docs/returns/shipped-14-18-390x844.png

## Hunter phone steps (Android, after Shift ships)
1. Open yourfirstshiftapp.com/app.html in Chrome.
2. Tap **Plans** at the bottom, then the $9 button.
3. You should see a dark bar at the top: "Opening secure checkout… 🔒 Stripe", then the Stripe page in the same tab. Don't pay — tap back.
4. (Optional) Turn on Airplane mode, tap the $9 button again: the bar should disappear within about 10 seconds (often right away) with a message that says "You have not been charged." It should NOT spin forever. Turn Airplane mode off.

## Rollback
Redeploy the base/main app.html (live d81fbb6a…, or #21's c7815286… if #21 has shipped).

## Not done (outside Claude's role)
- Deploying, merging and Stripe setup — Shift/Hunter.
