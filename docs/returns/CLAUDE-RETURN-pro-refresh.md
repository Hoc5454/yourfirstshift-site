# CLAUDE RETURN: pro-refresh (paying users were silently losing Pro every 35 days)
Found by Claude while checking support scenarios. Fixed under Hunter's standing OK ("fix what you find, tell me after").
**DO NOT MERGE until Liz PASS + Shift ships + Hunter phone PASS.**

## The bug
Stripe Pro passes are signed with exp = 35 days (PRO_TOKEN_TTL_S) and nothing ever renewed them. On day 36 a still-paying customer:
- got the free blurred/cut result (Worker treats the pass as invalid → free path), and/or a 402 that made the app wipe Pro and show "Upgrade";
- had to find "Already Pro? Restore" on their own. Every subscriber, every month → support emails + bad reviews.
No one has hit it yet (no subscriber is 35 days old).

## The fix (two PRs, ship Worker first)
1. **Worker — branch `claude/pro-refresh-worker` (on #8, live):** new `POST /api/pro/refresh {token}`. Accepts a correctly signed Stripe pass up to 90 days past exp, re-checks the subscription with Stripe (falls back to the webhook record if Stripe is down), returns a fresh 35-day pass only if active/trialing/past_due. Canceled → 402 inactive. Org passes never refresh. Same origin check + rate limit as Restore. No new secrets/bindings.
   Tests `node worker/test/org_worker_t.mjs` → **ALL PASS (51)**, incl. a test that reproduces the bug (expired pass refused) and proves the refreshed pass works.
2. **App — branch `claude/pro-refresh` (on #15):** `<script id="yfs-pro-refresh">` before `</body>`. Renews quietly: on load/when the app comes back if <7 days left (max once per 12h), right before an AI call if the pass is already expired, and once after a 402 (then retries that one call). Free users and org-code users untouched. If the Worker route isn't live yet, calls just fail quietly and nothing changes (safe ship order either way, Worker-first is best).
   app.html sha256 `04bcd897c4dfc61560a6129cf935332294e15f797cd351b2c0e6fa52b57f548a` · 292333 B. New `tests/refresh_t.js` **ALL PASS (15)**; adtag/src/heard/org/orgrep/owen/frt ALL PASS; e2e + upg_t identical to LIVE.

## Rollback
App: redeploy previous app.html. Worker: Cloudflare previous version. Either half alone is harmless.
