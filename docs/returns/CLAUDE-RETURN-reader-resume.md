# CLAUDE RETURN: reader-resume (ATS X-Ray "couldn't reach our file reader" after an app switch)
From Hunter's 7:30–7:40am phone check (Samsung Internet, Liz watched the recording). Branch `claude/reader-resume` on #26 (580c5d8d) · app.html sha256 `8eb19ea8ece259b86fbabbd5336a64d85198fcb7ace876d546d4662ef368f304` · 308527 B
**DO NOT MERGE until Liz PASS + Shift ships + Hunter phone PASS.** Ships separately from #25/#26. App-only; no Worker change.

## Cause
The file reader already had one automatic retry on return (#1), but it fired **350 ms** after the page came back. On Samsung Internet the network isn't back that fast, so the retry failed too → "We couldn't reach our file reader just now…". Samsung also *freezes* background tabs, which #1 didn't listen for.

## Liz's asks
1. **Note while reading/writing:** "Keep this screen open — about 30 seconds." (upload zone while reading; under "✍️ Writing your result…").
2. **Read fails while hidden → one automatic retry when visible:** waits until the phone is online, then 1.5 s, then retries **once**, showing "Reconnecting — picking your document back up" instead of an error. Error shows only if that retry also fails. Also treats `freeze`/`resume` (Samsung/Chrome tab pausing) as leaving/returning, for both reading and writing.
3. **No free run burned on a background failure:** reading never counts a run; writing is covered by #25/#26 (same-run retry, one auto-resume).
Not touched: checkout, pricing, Pro/pack, org codes, Stripe, Worker.

## Tests
- New `tests/reader_t.js` **ALL PASS**: leave mid-read → no error while away → "Reconnecting" → exactly one retry ~1.5 s after return → document loaded, no free run used; still offline on return → waits for `online` (no wasted retry); retry also fails → honest error once, no loop; failure while on screen → error right away (unchanged); Samsung freeze → resume → retry → success.
- `tests/frt_t.js` (#1's test): only its post-return wait raised 1.5 s → 3.2 s for the new grace period; ALL PASS on this build and on LIVE.
- resume_t, cotab, plans, src, refresh, org, orgrep, heard, adtag, owen ALL PASS; sweep_qa clean; e2e + upg_t + persist_t identical to LIVE.

## Hunter phone steps (Samsung Internet, after Shift ships)
1. ATS X-Ray → upload your resume PDF.
2. While it says "Reading your document… Keep this screen open", switch apps ~10 s, come back.
3. PASS = "Reconnecting — picking your document back up", then "Resume loaded". No error.
