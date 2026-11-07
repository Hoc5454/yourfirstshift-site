# CLAUDE RETURN: hang-guard (nothing stays stuck forever)

Found in the full bug sweep (Nov 7). Stacked on #27 (claude/reader-resume). Merge/deploy #27 first, or deploy this instead of #27 (it contains #27).

## Bugs fixed
1. **AI run stuck forever.** If the server never answers (no response at all) while the screen is open, the button sat on "Working on it" forever. Now: after 45s with the screen open, the run stops and shows "Your result stopped coming in. Tap Try again." The free run is not used. While the app is in the background the timer waits (no false errors on app switch).
2. **File read stuck forever.** Photo or scanned-PDF reads that never get an answer sat on "Reading your document" forever. Now: after 60s with the screen open, it shows "We couldn't reach our file reader just now. Try again, upload a PDF, or paste your resume below." Same background rule.
3. **Small phones (320px, iPhone SE size):** the Edit and delete buttons in My resumes were 32px wide. They now stack full width (44px tall).

## Not touched
Checkout, pricing, Pro/pack, org codes, Stripe webhooks, Worker.

## Tests
- New `tests/hang_t.js`: 10 checks. On #27 build: 5 FAIL (bugs reproduced). On this build: ALL PASS.
- Full regression on this build: upg_t, src_t, frt_t, cotab_t, gate_t2, plans_t, refresh_t, resume_t, reader_t, persist_t, org_t, heard_t, adtag_t, owen_t all pass; e2e free and upgrade output identical to the live baseline.
- QA sweep at 320 / 360 / 390 / 412 / 768 px, free + Pro: no page errors, no sideways scroll, no unlabeled controls, no small tap targets.

## Phone check (Hunter)
1. Cover Letter: run normally, it should work as before.
2. Upload a resume photo, it should read as before.
3. Turn on airplane mode, tap Run, and wait about a minute with the screen on. You should get a Try again message instead of an endless spinner. Turn airplane mode off and tap Try again.
