# CLAUDE RETURN: plans — $29 Job Hunt Pack + $59/yr Pro, checkout polish
Hunter approved: turn both plans on and make checkout premium. **DO NOT MERGE until Liz PASS + Shift ships + Hunter phone PASS.**

| Part | Branch / PR base | What |
|---|---|---|
| Worker | `claude/plans-worker` on #16 | plan-aware checkout, /api/pro/plans, pack verify/restore/refund |
| App | `claude/plans` on #18 · app.html sha256 `28a4a0d2ec6596bb26bde239e6596353b23995e2a4a0f1a2ae53b589ea0e08bc` · 299846 B | plans go live only when the Worker says so; pack UI; checkout spinner + guard |

## Shift: Stripe setup (no secrets, no code change needed)
1. In Stripe create two prices on the YourFirstShift product:
   - **Job Hunt Pack: $29.00 USD, one-time** (not recurring).
   - **Pro yearly: $59.00 USD, recurring every 1 year.**
2. In the Worker (Cloudflare → Settings → Variables, **plain text vars, not secrets**): `YFS_PRICE_PACK = price_…` (the $29 one-time) and `YFS_PRICE_YEAR = price_…` (the $59/yr).
3. In the Stripe webhook for this Worker, also send **`charge.refunded`** (so a refunded pack stops working).
Until step 2 is done the app keeps $29/$59 greyed out ("Available soon") and the Worker refuses those plans (409), so **nobody can be charged the wrong amount**. Deploy order doesn't matter.

## Worker (`claude/plans-worker`)
- `POST /api/pro/checkout {plan}`: `pro` (default, unchanged $9/mo), `pro_year` (subscription), `pack` (one-time payment, `customer_creation=always`). Metadata `yfs_plan` + cleaned `yfs_src` (TikTok/ad tag now visible on each Stripe payment). Unknown/unset plan → 409 `plan_unavailable`.
- `GET /api/pro/plans` → which plans are buyable now.
- `/api/pro/verify`: pack sessions (paid) → pass that ends **30 days from purchase** (not from verify). Unpaid → 402, older than 30 days → 410.
- `/api/pro/restore`: finds an active subscription first; otherwise a pack bought within 30 days → pass with the **remaining** days.
- Pack passes: no `sub`, can't be refreshed; refund (`charge.refunded` webhook) revokes immediately.
- Yearly = normal subscription: verify, restore, renewal (#16) all work as monthly.
- Tests: `node worker/test/plans_worker_t.mjs` **ALL PASS (25)**; `org_worker_t.mjs` still **51/51**.

## App (`claude/plans`)
- Plans sheet asks `/api/pro/plans`; $29/$59 become selectable only when live. If a plan disappears, checkout says "not available, you have not been charged" and re-checks.
- All checkout buttons share one path: same tab, double-tap guard, **"Opening secure checkout… 🔒 Stripe"** at the top of the screen, button dimmed while it loads.
- Pack holder: pill "Pro · through <date>", Account "Job Hunt Pack — Pro · nothing to cancel", no Manage/Cancel, can still pick monthly/yearly.
- Pack end: removed before the app reads Pro (head script), plain one-time notice with **See plans**; also ends cleanly if it runs out while the app is open.
- Tests: new `tests/plans_t.js` **ALL PASS (28)**; cotab, refresh, adtag, src, heard, org, orgrep, owen, frt ALL PASS; e2e + upg_t identical to LIVE. Screens checked at 390×844.

## Ship order
#16 → #18 (in progress) → plans-worker → plans (app) → Shift does the Stripe steps above → Hunter phone check: Plans shows $29/$59, tap each → Stripe in same tab with the right price (don't pay).
