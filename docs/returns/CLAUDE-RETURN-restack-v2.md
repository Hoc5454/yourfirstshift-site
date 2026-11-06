# CLAUDE RETURN: heard-about-us v2 + org-codes v2 + org-report v2 (restack on LIVE)
Ticket: FOR_CLAUDE-heard-about-us-v2 (Liz, Nov 6 ~2:07pm)
**LIVE base (verified):** `claude/src-tracking` app.html · sha256 `c9622d1272a8304523df84dc26af7e96407be31b8387a63e83e4c4737bdcacc9` · 266,803 B (git file, not the served/obfuscated copy)
**DO NOT MERGE until Liz PASS + Shift ships + Hunter phone PASS.**

| Replaces | New branch | app.html sha256 | Bytes | Built on |
|---|---|---|---|---|
| #4 heard-about-us | `claude/heard-about-us-v2` | `510559053cd9e2449ea0a30e234c864d7923792a3a82052702391654ab138a9c` | 272,464 | LIVE |
| #5 org-codes | `claude/org-codes-v2` | `d4829ea2ce34f3cd54ae33e270008b05e2560c4fb5783854b06a3a7d453a2b00` | 277,284 | LIVE |
| #6 org-report | `claude/org-report-v2` | `9c98640008e33eb81182424e3569bf579edf9d503d50fadeec658400fc996413` | 279,261 | org-codes v2 (so #6 v2 ships #5 v2 with it) |

## How it was rebuilt
3-way merge of each original PR onto LIVE, using the original base d613ae0a (`7dc7461f…`) as the common ancestor. The **only** overlap in all three: both src-tracking and the feature add a `<script>` right before `</head>`. Resolved by keeping both, `yfs-src` first. No feature code was rewritten; everything that passed in the originals is unchanged (heard: `r.clone()` fetch wrap, bottom card with no overlay, ask once per device, client sanitize, 120-char cap; org: all of #5/#6).
- Heard payload unchanged and matches #8: `POST /api/metrics/heard_about`, text/plain `{answer, src}`. With src-tracking live, the URL also gets `?src=tiktok` (yfs-src tags every metrics call). #8's route reads the path only, so this is harmless and gives the src twice.
- #6 v2: the old `worker-proposal/` folder is dropped. #8 is the real Worker code now.

## Tests (Playwright 390x844, mocked Worker, nothing real called)
- heard-about-us v2: `heard_t.js` **ALL PASS**, incl. new T7b (URL tagged `?src=tiktok`). One test-harness fix: it now strips `?src=…` when naming the metric. `src_t.js` ALL PASS.
- org-codes v2: `org_t.js` ALL PASS · `src_t.js` ALL PASS.
- org-report v2: `org_t.js` ALL PASS · `orgrep_t.js` ALL PASS · `src_t.js` ALL PASS.
- Regression: `e2e.js` + `upg_t.js` output **byte-identical to LIVE** on all three. `frt_t.js` (file-reader retry) ALL PASS on all three. No page errors.

## Ship order (each one changes app.html, so they stack)
1. #3 Owen landing (if it ships first, the next ones need one more quick restack — tell Claude).
2. **org-report v2** (includes org-codes v2) — #8 is already passed/deploying, so codes work right away.
3. **heard-about-us v2** — after #2 above ships, Claude restacks it on the new tip in minutes (same one-spot merge).
Or ask Claude for one combined build of everything once Liz has PASSed each.

## Liz's optional notes on #8 (not changed — #8 is mid-deploy)
- Worker heard_about doesn't strip `<>`: harmless, nothing renders it; app already strips. Can tighten later.
- Heard writes share the 10/hr/IP bucket with org redeem: worst case a person who redeems 10 codes in an hour can't send an answer. Separate bucket = 2-line follow-up after #8 is live, if wanted.

## Not done
Deploy/merge (Shift + Hunter). Old PRs #4/#5/#6 left open for Liz to close as superseded.
