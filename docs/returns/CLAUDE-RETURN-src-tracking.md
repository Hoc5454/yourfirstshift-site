# CLAUDE RETURN: src-tracking
Base: LIVE tip d613ae0a · app.html sha256 7dc7461f53c4564ae02bdc15651d88b96aefc74089a72e48ad1d434fd9376600 · 265045 B (verified, matches ticket; = branch claude/file-reader-retry)
Return: app.html · sha256 c9622d1272a8304523df84dc26af7e96407be31b8387a63e83e4c4737bdcacc9 · 266803 bytes · Scope: app.html only (+1 small script)
Branch: claude/src-tracking · PR: https://github.com/Hoc5454/yourfirstshift-site/pull/2
Screenshot (390x844, `app.html?src=tiktok#tool-1` → ATS X-Ray): docs/returns/src-tracking-390x844.png
**DO NOT MERGE until Liz PASS + Shift ships + Hunter phone PASS.**

## Summary (plain English)
When someone opens the app from a link like `…/app.html?src=tiktok`, the app now remembers "tiktok" (also `reels` and `shorts`). It sends that tag along with the anonymous counters we already have (visit → free run → pay tap) and with the "Get Pro" checkout request. So we can see which platform brings free runs and paying users. Anything other than tiktok/reels/shorts is ignored. No personal data, no new keys.
`#tool-1` already opened ATS X-Ray on the live tip. It still does, with or without `?src=` (tested).

## ⚠ Three things the team must know (not code I can change)
1. **Stripe metadata needs a 2-line Worker change (Shift).** The app now sends `{"src":"tiktok"}` in the body of `POST /api/pro/checkout`. The Worker is not in this repo. To land it in Stripe, the Worker should read `body.src`, accept only `tiktok|reels|shorts`, and pass it as `metadata[src]` (and/or `subscription_data[metadata][src]`) when it creates the Checkout Session. Until then the Worker just ignores it. Checkout still works either way (tested: body is valid JSON; with no src the body is still exactly `{}`).
2. **Counters:** metrics now go to `/api/metrics/<name>?src=tiktok`. A Worker that routes on the path works the same. To count by platform, the Worker should read `?src` (same 3 values) and bump e.g. `free_run:tiktok`. Until then the totals are unchanged.
3. **Bio link:** `yourfirstshiftapp.com/` is the landing page (index.html). It is not in this repo and not in the ticket base, so I didn't touch it. Two options:
   - **Easiest (no code):** bio link = `https://yourfirstshiftapp.com/app.html?src=tiktok` (or `…/app.html?src=tiktok#tool-1` to open X-Ray directly). Works with this PR alone.
   - If the bio must be the root `/?src=tiktok`: index.html needs a small change. Send me a ticket with index.html attached. It is a 3-line script that saves the same value (`localStorage.yfs_src = {"s":"tiktok","t":<ms>}`), and forwards `?src` on the "Try it free" links. Same domain, so app.html picks it up.

## Changelog
- New `<script id="yfs-src">` before `</head>` (runs before the existing "visit" counter):
  - Reads `?src=`; trims and lowercases; keeps it only if it is `tiktok`, `reels` or `shorts`. Unknown/empty/junk → ignored. A bad `?src` never wipes a good one.
  - Saves it for this tab (`sessionStorage.yfs_src`) and for 30 days on this device (`localStorage.yfs_src`, last click wins). So it survives SPA navigation, a reload, a new tab, and the return from Stripe.
  - `window.yfsSrc()` returns it (`''` if none). `window.yfsSrcThisSession()` = only if it came in this visit (used by the Owen card ticket).
  - Wraps `fetch` for our Worker only. `/api/metrics/*` → adds `?src=`. `/api/pro/checkout` → adds `"src"` to the JSON body (keeps `plan` etc.). Nothing else is touched: the AI request body is unchanged, and no new headers (so no CORS risk).
- No other code changed. No Stripe keys, no secrets.
- Test: new `tests/src_t.js`.

## Test results (Playwright, 390x844, Worker + Stripe mocked, nothing real called)
- `src_t.js`: **ALL PASS (41 checks)**
  - T1 `?src=tiktok`: visit metric `?src=tiktok`; survives home/tool/sheets nav; free X-Ray run → 1 AI call, `free_run?src=tiktok`, AI body has no src; Pro checkout body `{"src":"tiktok"}`; pay_tap carries src; plan checkout → `{"plan":"pack","src":"tiktok"}`; new tab without `?src` still sends tiktok on checkout
  - T2 `reels`, `shorts`, ` TikTok ` → captured (lowercased)
  - T3 empty / facebook / `<script>` / `tiktok"` / no query → nothing stored; checkout body exactly `{}`, metric URLs unchanged
  - T4 31-day-old src ignored; bogus `?src` keeps the last good one
  - T5 `#tool-1` and `?src=tiktok#tool-1` → ATS X-Ray open, job box visible
  - No page errors anywhere
- Regression, output identical base vs new: `e2e.js` (free 4-tool tease), `upg_t.js` (Upgrade button + checkout, Free/Pro), `frt_t.js` (file-reader retry, ALL PASS), `persist_t.js`.

## Hunter phone steps (Android, Chrome, Incognito)
1. Open `yourfirstshiftapp.com/app.html?src=tiktok#tool-1`. PASS = ATS X-Ray opens straight away.
2. Tap "‹ All tasks", open a couple of tools. Nothing looks different (this change is invisible).
3. Run your free X-Ray. It works as before.
4. Tap "Upgrade to continue →". Stripe checkout opens. Don't pay; just confirm it opens.
5. Open `yourfirstshiftapp.com/app.html?src=junk`. App works normally.

## Rollback
Redeploy the base app.html (tip d613ae0a, sha256 7dc7461f…6600). Deeper rollback per ticket: tip 53e249d2.

## Not done
- Not done (outside Claude's role): deploy, merge to main, Worker change to put src into Stripe Checkout metadata + per-platform counters (Shift; Worker isn't in this repo).
- index.html (root landing) not in base/repo → see option list above.
