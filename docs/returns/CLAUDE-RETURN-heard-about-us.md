# CLAUDE RETURN: heard-about-us
Base: LIVE tip d613ae0a · app.html sha256 7dc7461f53c4564ae02bdc15651d88b96aefc74089a72e48ad1d434fd9376600 · 265045 B (verified, matches ticket; = branch claude/file-reader-retry)
Return: app.html · sha256 82377a42fd44e6a986719380d12f5d21e2d91a1ad2a0d05c65a3545faf60bd3a · 270706 bytes · Scope: app.html only (1 style + 2 small scripts)
Branch: claude/heard-about-us · PR: https://github.com/Hoc5454/yourfirstshift-site/pull/4
Full file: app-heard-about-us.html.LINK.md in this folder (byte-exact GitHub link + sha)
Screenshot (390x844, Pro thank-you card): https://github.com/Hoc5454/yourfirstshift-site/blob/claude/heard-about-us/docs/returns/heard-about-us-390x844.png
**DO NOT MERGE until Liz PASS + Shift ships + Hunter phone PASS.**
Note: built on d613ae0a, not on src-tracking (PR #2, not shipped yet). The two changes don't overlap and can ship in either order. If both ship, the answer also carries the TikTok/Reels/Shorts tag.

## Summary (plain English)
Before this change, a paid return from Stripe turned on Pro without any message on screen. Now the user sees a small card: "✅ You're Pro — thank you!". It has one optional box: "How did you hear about us?" They can type a few words and tap Send, or tap Skip or ✕. Pro is already on, and the card doesn't cover the app, so it never blocks anything. We ask only once per phone. The answer goes to our Worker's existing counter address. Shift needs a small Worker change to keep the text (see below).

## ⚠ Shift: one Worker change to keep the answers
The app sends `POST /api/metrics/heard_about`. The body is plain text containing JSON: `{"answer":"TikTok","src":"tiktok"}`. `src` is empty if there's no tag. Today the Worker will at most bump a `heard_about` counter and drop the text. To keep the text, the Worker should:
1. Read `await request.text()` and `JSON.parse` it.
2. Trim `answer` to 120 chars.
3. Store it, e.g. KV key `heard:<timestamp>:<random>` → `{answer,src,ts}`.
No new secrets are needed. Skips are counted as `heard_skip`, using the same counter path as visit/free_run/pay_tap.

## Changelog
- `<style id="yfs-heard">` before `</head>`: light-theme card, 44px tap targets, 16px input font (no zoom on phones).
- `<script id="yfs-heard-js">` before `</head>`: watches only the existing `/api/pro/verify` call (the real paid return with `session_id`). On OK + token it queues the thank-you card. Other requests are untouched.
- Script at end of `<body>`: `yfsShowThankYou()` card.
  - Optional text box (max 120 chars). Send stays disabled while empty.
  - Skip / ✕ = skip.
  - Answer is cleaned (no `<>` or control chars, whitespace collapsed) and sent as described above. A copy is kept on the device in `localStorage.yfs_heard`.
  - Asked once per device (`yfs_heard_done`). A repeat purchase shows the thank-you with a "Start using Pro" button and no question.
  - Small print: "Please don't include your name or email."
- No changes to Stripe, pricing, checkout, or keys.
- Test: new `tests/heard_t.js`.

## Test results (Playwright, 390x844, Worker + Stripe mocked, nothing real called)
- `heard_t.js`: **ALL PASS (29 checks)**
  - T1: card shows after a verified paid return. Pro is on and the page above the card is tappable. Send sends a cleaned answer as `text/plain`. It's saved on the device and the card closes. A reload shows no card.
  - T2 Skip and T3 ✕: card closes, `heard_skip` counted, still Pro, tools run.
  - T4 failed verify → no card, still Free. T5 normal load → no card, no metrics.
  - T6 already answered → thank-you only. T7 `src` included when present.
  - No page errors anywhere.
- Regression vs base, output identical: `e2e.js` (free tease) and `upg_t.js` (Upgrade button + checkout, Free/Pro). `frt_t.js` ALL PASS, `persist_t.js` OK.

## Hunter phone steps (Android, Chrome)
The card only appears after a real Stripe payment. Easiest check: when Shift tips the preview, do a real $9 checkout (or a Stripe test-mode one if Shift sets it up), then:
1. After paying, Stripe sends you back to the app. PASS = a white card at the bottom says "✅ You're Pro — thank you!".
2. Type "test" in "How did you hear about us?" and tap Send. PASS = "Thanks! 🙌", then the card goes away.
3. Open any tool and run it. PASS = Pro works (no blur, Upgrade gone).
4. Reload the page. PASS = the card does not come back.
5. Open `yourfirstshiftapp.com/app.html` normally. PASS = no card, app looks like before.

## Rollback
Redeploy the base app.html (tip d613ae0a, sha256 7dc7461f…6600). Deeper rollback per ticket: tip 53e249d2.

## Not done
- Not done (outside Claude's role): deploy, merge to main, and the Worker change to store the answer text (Shift; the Worker isn't in this repo).
- Full app.html and screenshot are linked on GitHub (byte-exact) instead of pasted into Drive, same as earlier returns. The Drive connector only takes inline text, and re-typing 270 KB could corrupt it.
