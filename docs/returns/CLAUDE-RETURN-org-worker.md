# CLAUDE RETURN: org-worker (Worker side of org-codes #5 + org-report #6)
Base: Shift's PR #7 branch `cursor/worker-source-import-cb29` (sanitized live Worker, verified secret-free by Claude).
Branch: `claude/org-worker` · Scope: `worker/worker.js` (+1 test file). **No deploy. No merge. No secrets.**
**DO NOT MERGE until Liz PASS + Shift ships + Hunter phone PASS.**

## ⚠ Read first
1. **Hunter's OK needed on one new secret: `ADMIN_KEY`.** It protects the monthly report page. Shift creates it with `wrangler secret put ADMIN_KEY` and gives it to Liz/Hunter privately. Never put it in Drive, GitHub or chat. Until it's set, the report route answers `503` and is safely off. Codes and redeem work without it.
2. **Ship order: Worker first, then app PR #5 (org-codes), then PR #6 (org-report).** Either order is safe (the app says "couldn't check" if the route is missing), but Worker-first means codes work the moment the app ships.
3. **This is a second way to get Pro without Stripe.** All checks live here in the Worker: code exists, not ended, seat free. The app holds no codes.
4. **One change from my earlier org-codes note:** org tokens carry `{org, did, exp}` instead of `sub: "org:…"`. This keeps them away from the Stripe status lookup and the `sub:` revocation check. The app never reads inside the token, so **no app change is needed.**

## What changed in worker.js
- `verifyProToken`: if the token is an org token, it's only valid while `org:<CODE>` exists, isn't `disabled`, hasn't passed `ends`, **and** that device's seat key still exists. So Shift can end a code early or free one seat and it takes effect on the next AI call. Stripe tokens: unchanged.
- New routes (inside `routePro`, checked before `/api/metrics/*`):
  - `POST /api/org/redeem {code, device}` → `200 {token, org, ends, seats_used, seat_limit}` / `404 invalid` / `410 expired` / `409 full` / `429` (10 tries/hour/IP) / `400 bad_device`. Same allowed-origins check and CORS as Restore.
  - `POST /api/metrics/org_event` (text/plain JSON `{t, k:'open'|'run', tool}`) → always `204`. Counts only org tokens that pass the same check as the AI route.
  - `GET /api/admin/org-report?code=&month=YYYY-MM` + `Authorization: Bearer <ADMIN_KEY>` → JSON report for `org-report.html`. `401` wrong key, `404` unknown code, `503` if `ADMIN_KEY` isn't set.
- `org_redeem` added to the funnel counters (the app already pings it).
- Uses existing bindings only: `YFS_KV`, `PRO_SIGNING_SECRET`. Nothing new in `wrangler.toml`.

## KV keys (no personal data)
| Key | Value | Who writes |
|---|---|---|
| `org:<CODE>` | `{"org":"Tri-County Tech","seat_limit":25,"ends":<unix s>,"plan":"pilot","issued":"2026-11-10"}` | **Shift** (when issuing) |
| `orgcount:<CODE>` | seats redeemed | Worker |
| `orgseat:<CODE>:<device>` | first redeem time | Worker (Shift deletes to free a seat) |
| `orgact:<CODE>:<YYYY-MM>:<device>` | `1`, 400-day TTL | Worker |
| `orgm:<CODE>:<YYYY-MM>:run:<tool>` | count, 800-day TTL | Worker |

## Shift: issuing a code
1. Liz/Hunter send: org name, seat limit, start date.
2. Code = `YFS-<4-letter tag>-<4 random from ABCDEFGHJKMNPQRSTUVWXYZ23456789>`, e.g. `YFS-TCTC-7KQ4`.
3. `wrangler kv key put --binding=YFS_KV --remote "org:YFS-TCTC-7KQ4" '{"org":"Tri-County Tech","seat_limit":25,"ends":<start + 30 days, unix seconds>,"plan":"pilot","issued":"2026-11-10"}'`
- End early: set `ends` to now (or add `"disabled":true`).
- Free a seat: delete `orgseat:<CODE>:<device>` and lower `orgcount:<CODE>` by 1.
- Test code for Hunter's phone check: `YFS-TEST-AB12`, 2 seats, ends in 30 days. Delete it after.

## Tests: `node worker/test/org_worker_t.mjs` → **ALL PASS (36 checks)**
Mocked KV/cache/Anthropic, no network, fake secrets. Covers: invalid / malformed / bad device; normalized code; re-redeem uses no seat; full at limit; expired; CORS + preflight; foreign origin 403; rate limit; org token passes the free gate; forged token, freed seat, ended-early code and fake code all rejected (and restored code works again); **Stripe token still works and canceled Stripe sub still revoked**; usage events counted per tool, non-org/bad tokens ignored; report auth (none/wrong/missing secret), counts, paged active seats, period, 404/400; `org_redeem` + existing `visit` metric.

## Honest limits
- KV isn't atomic: two devices redeeming the last seat at the same instant could both get in. Fine for pilots; move counts to D1 if seats are ever billed strictly.
- A seat = one phone/browser (no logins). Give pilots a little slack (25 students → 30 seats).

## Rollback
Redeploy the previous Worker version from the Cloudflare dashboard (Deployments → previous → Rollback). Or keep the code and switch codes off by setting each `ends` to now.

## Not done (outside Claude's role)
Deploy, merge, setting `ADMIN_KEY`, creating KV codes — Shift. Approving the new secret — Hunter.
