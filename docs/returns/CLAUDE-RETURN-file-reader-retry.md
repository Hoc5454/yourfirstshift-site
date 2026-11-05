# CLAUDE RETURN: file-reader-retry
Base: main / LIVE tip 53e249d2 · sha256 b83e9d4095f2efc5a8d59abfd3daf5b1d7143462ce89d32a667004bc2db11bd0 · 260854 B (verified, matches ticket)
Return: app.html · sha256 7dc7461f53c4564ae02bdc15651d88b96aefc74089a72e48ad1d434fd9376600 · 265045 bytes · Scope: app.html only
Branch: claude/file-reader-retry · PR: https://github.com/Hoc5454/yourfirstshift-site/pull/1
**DO NOT MERGE until Liz PASS + Shift ships + Hunter phone PASS.**

## Summary (plain English)
If you upload a PDF resume and switch to another app while it is reading, Android pauses the browser and the read dies. Now the app keeps the file you picked and quietly tries reading it **one more time** when you come back. You keep seeing "Reading your document…" instead of an error. If that second try also fails, you get the same friendly error as before plus the "paste your resume" fallback. Reading a file never uses up the free run.
After the free run is used, the "Upgrade to continue →" button now always stays orange and opens checkout, even when the upload box is showing an error.

## Changelog
- New `<style id="yfs-file-retry">` before `</head>`: `#runBtn.yfs-upgrade-cta` is always orange and tappable (even if a `disabled` class sneaks in).
- New `<script>` at end of `<body>` (wraps existing functions, no core rewrite):
  - `processFile` wrapper keeps the selected File and notes if the page went to the background during the read.
  - `showFileError` wrapper: if the read failed (or the page was hidden) because of an app switch, and it's a temporary-type error (not "too large", HEIC, scanned, empty), it holds the "Reading…" screen and retries **once** when the user returns (`visibilitychange` / `pageshow` / `focus`). Second failure → existing friendly error + paste fallback. No third try.
  - If the read just goes silent while away (no answer at all), it waits 6 s after return, then retries once. A late failure from the old read can't overwrite a good result.
  - Errors while the user stays on the page (no app switch) are unchanged: error shown right away, no auto-retry.
  - Works for both the main upload box and the "My resumes" upload.
  - `updateRunBtn` + file success/error wrappers: when Free is used (not Pro, non-builder tool), the run slot is always "Upgrade to continue →", orange, enabled, `onclick = yfsOpenCheckout()`, and the gray gate hint is hidden. Pro and Resume Builder unchanged.
- Tests: new `tests/frt_t.js` (7 scenarios) and `tests/vault_retry_probe.js`; `upg_t.js`, `persist_t.js`, `cl_t.js`, `gate_t2.js` now take the app.html path as argv[2] (default `../app.html`) instead of old hardcoded `../pN/` folders.

## Test results (Playwright, 390x844, Worker/checkout mocked, nothing real called)
- `frt_t.js` new file: **ALL PASS**
  - T1 app switch kills read → 1 auto-retry on return → "Resume loaded", 2 extract calls, yfs_usage untouched, no page errors
  - T2 retry also fails → friendly error + paste fallback, no 3rd try, free run not burned
  - T3 read stalls while away → retry 6 s after return → loaded; late failure of old read ignored
  - T4 error without app switch → unchanged (error shown, 1 call)
  - T5 after Free run + file error → Upgrade CTA orange rgb(245,158,11), enabled, still orange after typing, tap = 1 checkout call, 0 extra AI runs, usage stays 1
  - T6 Pro → normal "Run Cover Letter Generator →"
  - T7 free slice: Run ready → 1 AI run → usage=1 → Upgrade orange → tap = checkout, no 2nd run
- Against base, T1–T3 fail (reproduces the bug); T5 passes on base too in headless Chrome (I could not reproduce the gray button headless — the fix forces the orange state on every button refresh and on return to the app, so it holds whatever path turned it gray on the phone).
- `vault_retry_probe.js`: PASS on new, FAIL on base (expected).
- Regression, output identical base vs new: `e2e.js` (free 4-tool tease; also Pro run), `upg_t.js`, `persist_t.js` (per-tool yfs_res restore, reload, no second free run, 1 worker call), `cl_t.js` (cover free slice), `gate_t2.js`, `p1test.js`. No PAGEERR anywhere.

## Hunter phone steps (Android, Chrome, Incognito, yourfirstshiftapp.com)
1. Open Cover Letter, tap the upload box and pick a PDF resume.
2. While it says "Reading your document…", switch to another app for ~10 seconds, then come back.
3. PASS = it finishes and shows "Resume loaded" (no "couldn't reach our file reader"). It may take a few seconds after you come back.
4. Paste a job, run your free Cover Letter. Then upload a file again and switch away/back (or upload something broken). The "Upgrade to continue →" button must stay **orange**.
5. Tap it → Stripe checkout opens. Don't pay; just confirm it opens.

## Rollback
Redeploy the base/main app.html (tip 53e249d2, sha256 b83e9d40…bd0).

## Not done / notes
- Not done (outside Claude's role): deploy, merge to main (Shift / team).
- If Android fully kills and reloads the tab while you're away, the browser forgets the picked file, so there's nothing to retry. The page reloads fresh (or shows the paywall if Free is used). User re-picks the file.
- The ticket's landing note (add index.html to main) is a separate item; not touched here.
