# CLAUDE RETURN: resume-fix — switching apps mid-result (Hunter's Samsung FAIL)
**DO NOT MERGE until Liz PASS + Shift ships + Hunter phone PASS. No TikTok until then.** Ship Worker first, then App.

| PR part | Branch (base) | |
|---|---|---|
| Worker | `claude/resume-worker` (on #22, live) | run IDs, free-run protection, 10-min result cache, error-type log |
| App | `claude/resume` (on #23, live) · app.html sha256 `d3c0ebc6d58040c6162cbe17761c85fa96678bcbfdc0bda9d256675dc7ca66e3` · 307157 B | resume once, honest errors, no stuck "Writing…" |

## Root cause (confirmed in code)
1. Backgrounding kills the stream → `yfsReadStream` throws → `runTool` catch showed "Something went wrong…" but never cleared "✍️ Writing your result…" or the partial text → looked stuck.
2. `freeGate` counts the free run at request START (FREE_PER_DAY=1, when ENFORCE_FREE_LIMIT=1). An interrupted run had already used the free run server-side while the app still said "1 free run left" → the retry would hit 402/Upgrade.

## Liz's checklist
- **Free-run question settled:** free run is counted once per run ID. Retrying the SAME run (same X-YFS-Run + byte-identical request, SHA-256 checked) within 10 min doesn't count again, max 3 retries. New run IDs, changed requests, or a 4th retry count normally → no unlimited free runs. Old app versions without run IDs behave exactly as before.
- **Full resume:** Worker tees the stream and (`ctx.waitUntil`) caches the FINISHED result 10 min under `runres:<device>:<run>`. GET `/api/run/<run>?d=<device>` needs both 128-bit random ids → nobody can fetch someone else's result; expires automatically (TTL 600s); free users' cached text is the same free-cut stream they saw. Spend: a cache hit costs no AI call; a miss re-runs at most 3 times per run. Note: Cloudflare gives waitUntil ~30s after the client leaves, so very long results may not be cached; then the app re-runs the same run (free-run safe).
- **App cleanup:** "Writing…" removed on any failure; partial results marked "⚠️ Incomplete — cut off before it finished"; separate messages for interrupted / lost connection / busy / server hiccup / timeout / cut off / no result; real in-flight guard (double taps ignored); **one** automatic resume (only when the run was interrupted by leaving the app, only when you come back), then a manual Try again button — no loop; 45s stall watchdog (only while on screen).
- **Not touched:** checkout, pricing, Pro/pack logic, org codes, Stripe webhooks.
- **Error logging:** POST `/api/metrics/client_err` {type, browser family} → daily counters; GET `/api/metrics/errors`. No text, no ids, no personal data.
- **CORS:** adds X-YFS-Run, X-YFS-Dev to allowed headers.

## Tests (mocked, no network)
- Worker: new `worker/test/resume_worker_t.mjs` **ALL PASS (24)** (interrupted → retry free, abuse caps, cache per device, other device 404, TTL, no-PII logs, CORS); org_worker_t 51/51; plans_worker_t 29/29.
- App: new `tests/resume_t.js` **ALL PASS** — reproduces Hunter's case (leave app mid-result → come back → finished result, free run intact), no-cache re-run with the same run, one-resume-only, visible network drop, 5xx, visible cut-off, triple tap, new id per new run, 402 unchanged. cotab, plans, src, frt, refresh, org, orgrep, heard, adtag, owen ALL PASS; sweep_qa clean; e2e + upg_t + persist_t identical to LIVE.

## Hunter phone steps (Samsung Internet)
1. Open yourfirstshiftapp.com → Fix my resume → Try an example → Run.
2. While it's writing, switch to another app for ~10 seconds, then come back.
3. PASS = the full result appears (or "Picking it back up…" then the result), no stuck "Writing…", and you're not asked to upgrade.
4. Repeat once with Wi-Fi off mid-result → PASS = "Lost connection… Try again" button; turn Wi-Fi on, tap it → result.

## Rollback
Worker: Cloudflare previous version (#22). App: redeploy #23's app.html. Either half alone is safe (app without the Worker part just won't find a cache and re-runs; Worker without the app part behaves exactly as before).
