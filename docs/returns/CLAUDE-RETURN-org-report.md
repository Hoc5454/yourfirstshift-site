# CLAUDE RETURN: org-report
Base: LIVE tip d613ae0a · app.html sha256 7dc7461f53c4564ae02bdc15651d88b96aefc74089a72e48ad1d434fd9376600 · 265045 B (verified). Built **on top of org-codes** (branch claude/org-codes, PR #5), because the ticket depends on it.
Return:
- app.html · sha256 012eb6615d10277ea076af531871db4976fe3cbb68b62d9e5f808fd315166095 · 277503 bytes (= org-codes + this ticket)
- NEW org-report.html (admin page) · sha256 59a5f8712347a5e0e80569a2bdc94571550811652d02d44f76bf4cf91a178b81 · 7364 bytes
- NEW worker-proposal/org-report.js (Worker reference code for Shift. **Not deployed, not wired.**)
Branch: claude/org-report · PR: https://github.com/Hoc5454/yourfirstshift-site/pull/6 (**depends on PR #5 org-codes**)
Full files: app-org-report.html.LINK.md in this folder (byte-exact GitHub links + sha)
Screenshot (390x844, sample report with mocked data): https://github.com/Hoc5454/yourfirstshift-site/blob/claude/org-report/docs/returns/org-report-390x844.png
**DO NOT MERGE until Liz PASS + Shift ships + Hunter phone PASS.**

## ⚠ Read first
1. **Ship with or after org-codes.** This app.html already contains org-codes. If PR #6 ships, PR #5 ships with it. Without org codes, the report has nothing to count.
2. **Shift owns the Worker part.** Two routes, plus an admin key check. Reference code is in `worker-proposal/org-report.js`.
   - The app sends events whether or not the Worker is ready. Until it is, they're just ignored, so either ship order is safe.
3. **Admin key.** The ticket says to protect the report "the same way other admin paths already are". I can't see the Worker, so the reference uses `env.ADMIN_KEY` as a placeholder.
   - If the Worker already has admin protection, Shift should use that.
   - If not, Shift adds one with `wrangler secret put ADMIN_KEY` and gives it to Liz/Hunter privately. **It is never put in Drive or GitHub.**
   - This is Shift's call, but it's a new key, so Hunter should know.
4. **Honest limits** (also printed on the report itself):
   - A seat = one phone or browser.
   - Runs made *before* a device entered the code aren't counted for the org, so free vs Pro runs can't be split. All counted runs are Pro runs. `free_runs` is left empty on purpose.
   - KV counts can be off by a few. Fine for a pilot report; use D1 for exact numbers if billing ever depends on run counts (it doesn't today; billing is per seat).

## Summary (plain English)
While someone uses Pro through a program code, the app now quietly sends two kinds of tick to our Worker:
- "opened the app today" (at most once a day)
- "ran tool X" (after each successful run)
Each tick carries only the code's token and the tool name. It never includes the resume, the person's name or email, or what they typed.

Each month Liz opens `yourfirstshiftapp.com/org-report.html` and types the program code, the month, and the admin key from Shift. She sees:
- seats used out of the limit (e.g. 18 / 25)
- how many seats were active that month
- Pro runs for each of the 6 tools, plus the total
**Download CSV** gives a one-row spreadsheet that can go straight to the partner. **Copy summary** gives text for an email. The admin key is typed each time and never saved in the browser.

## Export format (CSV, one row per code per month, no PII)
`org,code,period_start,period_end,seat_limit,seats_redeemed,active_seats,translator_runs,ats_runs,outreach_runs,cover_runs,interview_runs,builder_runs,total_pro_runs,generated_at`
Example: `Tri-County Tech,YFS-TCTC-7KQ4,2026-11-01,2026-11-30,25,18,14,9,31,6,17,12,8,83,2026-12-01T13:00:00Z`
Tip on the page: for groups with fewer than 5 active seats, share totals rather than per-tool numbers, so no single student stands out.

## Shift: Worker steps (no secrets here)
Full reference code: `worker-proposal/org-report.js` on the branch.
1. **`POST /api/metrics/org_event`**
   - The body is `text/plain` JSON: `{"t":"<token>","k":"open"|"run","tool":"translator|ats|outreach|cover|interview|builder|other"}`.
   - Verify `t` with the **same check the AI route uses**. Expired tokens must be rejected. Org tokens have subject `org:<CODE>:<device>` (from the org-codes return).
   - Not an org token → reply `204` and ignore it.
   - For `open` and `run`: put KV `orgact:<CODE>:<YYYY-MM>:<device>` = `1` (TTL about 400 days).
   - For `run`: add 1 to `orgm:<CODE>:<YYYY-MM>:run:<tool>`.
   - Always reply `204`.
2. **`GET /api/admin/org-report?code=…&month=YYYY-MM`** with header `Authorization: Bearer <admin key>`.
   - Wrong or missing key → `401`.
   - Code not found → `404`.
   - Otherwise return JSON:
     `{code, org, plan, period:{start,end}, seat_limit, seats_redeemed (from orgcount:<CODE>), active_seats (count of orgact:<CODE>:<month>:* keys), runs:{translator,ats,outreach,cover,interview,builder,other}, runs_total, free_runs:null, generated_at}`
3. **CORS:** let `https://yourfirstshiftapp.com` call route 2 with the `Authorization` header (preflight `OPTIONS`). Route 1 is a simple request, so it needs no preflight.
4. Optional, later: a monthly Cron Trigger that emails each org's report to hello@. Skipped in v1 because the download page is simpler.
5. Optional: if you'd rather `org-report.html` not be on the public site, don't deploy it. Liz can open the file from her computer and it works the same. It's harmless public anyway: it's `noindex` and shows nothing without the key.

## Changelog
- app.html: new script at the end of `<body>`. It wraps `fetch` only to spot successful AI tool calls, and only while an org code is active (`yfsOrgInfo()`).
  - Tool ids: 0 translator, 1 ats, 2 outreach, 3 cover, 4 interview, 5 builder.
  - File-read calls (`X-YFS-Kind: extract`) and failed calls are not counted.
  - The "open" ping is once per day (`localStorage.yfs_org_open` = date), plus right after a redeem.
  - Events are `text/plain` so they don't need a CORS preflight.
- New `org-report.html`: standalone, light theme, mobile-first. CSV is built in the browser from the Worker's JSON.
- New `worker-proposal/org-report.js`: reference only.
- Test: new `tests/orgrep_t.js`.

## Test results (Playwright, 390x844, Worker mocked, nothing real called)
- `orgrep_t.js`: **ALL PASS (20 checks)**
  - T1: org user gets 1 "open" event (not repeated the same day). Run events show up as `cover` and `interview`. Events contain only token/kind/tool, no resume text, `text/plain`.
  - T2: file-read not counted. T3: failed AI call not counted.
  - T4: Free user and Stripe-Pro user send no org events. T5: "open" fires right after redeem.
  - T6: admin page. Wrong key → "Admin key not accepted". Right key → report renders. CSV row is exact with no PII. Key is not stored. No page errors.
- `org_t.js` (org-codes) still ALL PASS (38).
- Regression vs base, output identical: `e2e.js` and `upg_t.js`. `frt_t.js` ALL PASS. `persist_t.js` no errors.

## Hunter phone steps (Android, Chrome). After Shift ships org-codes + this, and gives you the admin key privately:
1. On your phone, open `yourfirstshiftapp.com/app.html?org=<test code>` and tap Unlock Pro.
2. Run 2 different tools (e.g. Cover Letter, then Interview Prep).
3. Open `yourfirstshiftapp.com/org-report.html`. Type the test code, pick this month, and enter the admin key. Tap **Get report**.
   PASS = seats redeemed shows 1, active seats 1, and Cover Letter 1 and Interview Prep 1.
4. Tap **Download CSV**. PASS = a small spreadsheet with one row and no names or emails.
5. Type a wrong admin key. PASS = "Admin key not accepted."

## Rollback
Redeploy the base app.html (tip d613ae0a, sha256 7dc7461f…6600) and remove `org-report.html`. Deeper rollback per ticket: tip 53e249d2. Turning off the two Worker routes also stops all collection.

## Not done
- Not done (outside Claude's role): deploy, merge to main, adding/wiring the Worker routes, KV, admin key (Shift), emailing reports (Shift/Liz).
- Free-vs-Pro run split for org users: not possible honestly, because devices aren't linked to a code before they enter it. Left as `null`.
- Full files and screenshot are linked on GitHub (byte-exact) instead of pasted into Drive, same as earlier returns.
