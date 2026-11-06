# CLAUDE RETURN: org-codes
Base: LIVE tip d613ae0a · app.html sha256 7dc7461f53c4564ae02bdc15651d88b96aefc74089a72e48ad1d434fd9376600 · 265045 B (verified, matches ticket; = branch claude/file-reader-retry)
Return: app.html · sha256 6edd672e0c0769c1b5d1edfd48416bd8923bf37262be496ec2c0cba49ef37ba5 · 275526 bytes · Scope: app.html only (1 small head script + 1 code box + 1 script)
Branch: claude/org-codes · PR: https://github.com/Hoc5454/yourfirstshift-site/pull/5
Full file: app-org-codes.html.LINK.md in this folder (byte-exact GitHub link + sha)
Screenshots (390x844), on GitHub:
- code accepted: https://github.com/Hoc5454/yourfirstshift-site/blob/claude/org-codes/docs/returns/org-codes-390x844.png
- deep-link entry: https://github.com/Hoc5454/yourfirstshift-site/blob/claude/org-codes/docs/returns/org-codes-390x844-entry.png
- "access ended" notice: https://github.com/Hoc5454/yourfirstshift-site/blob/claude/org-codes/docs/returns/org-codes-390x844-ended.png
**DO NOT MERGE until Liz PASS + Shift ships + Hunter phone PASS.**

## ⚠ Read first
1. **The app part is done. It does nothing on its own until Shift adds one Worker route** (`POST /api/org/redeem`, spec below). If the app ships first, entering a code shows "Couldn't check the code right now — nothing changed". It does not say "invalid" and it does not unlock anything. So either ship order is safe. Shipping the Worker first is cleanest.
2. **Hunter's OK on the entitlement.** This is a second way to get Pro that doesn't go through Stripe. All the real checks (valid, seats, end date) live in the Worker. No codes are in the app, so nobody can read them out of the page. Hunter should OK this before Shift turns the route on (no spend involved).
3. **"Seat" = one phone/browser, not a person.** YFS has no logins. If a student uses two devices, or clears their browser data, that uses 2 seats. Re-entering the code on the same device does NOT use a new seat. Ways to handle it: give pilots a little slack (e.g. 25 students → limit 30), and/or Shift can free seats by hand. If this becomes a problem, a later ticket can add "claim with email".

## Summary (plain English)
A school or job program gets one code, like `YFS-TCTC-7KQ4`. A student can enter it in any of three places:
- Account → "Have a code from your school or program?"
- Plans → "Have a program code? Enter it here"
- Inside "Already Pro? Restore"
Or the program can send them a link: `yourfirstshiftapp.com/app.html?org=YFS-TCTC-7KQ4`. The link opens the box with the code already filled in, and the student taps **Unlock Pro**. A seat is never used without that tap.

If the code is good, the student gets full Pro (same as $9 Pro) on that device until the program's end date. Account shows "Pro — via Tri-County Tech … runs through Dec 6, 2026. No charge to you." There's no "Manage / Cancel" button for them, because there's no subscription. On the end date the device goes back to Free and shows a plain note once: "Your program's Pro access ended on …". Saved resumes stay.

When a code fails, the message says why:
- Bad code: "That code isn't valid. Check it with your program coordinator."
- Ended: "That code ended on Nov 5, 2026. Ask your program coordinator about a new one."
- Full: "All 25 seats for that code are taken. Ask your program coordinator."
- Typos are caught on the phone before anything is sent.

A paying Pro user is never touched: "You already have Pro on this device — no code needed."

## Expiry choice (ticket asked to pick one)
**Pilot = 30 days from the issue date** (as Liz recommended), so every seat on a code ends on the same day. That's easy to explain to the coordinator and easy to invoice from. Paid annual plans: end date = contract end date. The Worker stores one fixed `ends` per code.

## Shift: Worker + KV steps (no secrets in this note; Shift uses the existing token secret)
**Route:** `POST /api/org/redeem`. Body: `{"code":"YFS-TCTC-7KQ4","device":"<32 hex chars>"}`. CORS is the same as `/api/pro/restore`.
1. Normalize `code` (uppercase, trim). Rate-limit per IP (e.g. 10 tries/hour). Over the limit → `429`.
2. Read KV `org:<CODE>` → `{"org":"Tri-County Tech","seat_limit":25,"ends":<unix seconds>,"plan":"pilot","issued":"2026-11-10"}`. Missing → `404 {"error":"invalid"}`.
3. If `now >= ends` → `410 {"error":"expired","ends":<ends>}`.
4. Seat check:
   - If KV `orgseat:<CODE>:<device>` already exists → this device already has a seat. Go to step 5.
   - Otherwise, if the seat count (e.g. KV `orgcount:<CODE>`, or a D1 row) is already `>= seat_limit` → `409 {"error":"full","seat_limit":25}`.
   - Otherwise write `orgseat:<CODE>:<device>` = first-redeem time and add 1 to the count. KV isn't atomic. That's fine at pilot size; use D1 or a Durable Object if exact counts matter.
5. Make a Pro token the **same way `/api/pro/verify` does**, with `exp = ends` and subject `org:<CODE>:<device>`. The AI route must accept it like a Stripe token, and return `402` once it's past `exp`. The app already handles 402 by dropping back to Free.
6. Return `200 {"token":"…","org":"Tri-County Tech","ends":<unix seconds>,"seats_used":N,"seat_limit":25}`.
- Optional: bump the `org_redeem` counter. The app already pings `/api/metrics/org_redeem` on success.

**Issuing a code (Liz/Hunter → Shift):**
- Send Shift the org name, seat limit, and start date.
- Shift makes the code: `YFS-<4-letter org tag>-<4 random chars from ABCDEFGHJKMNPQRSTUVWXYZ23456789>`, e.g. `YFS-TCTC-7KQ4`. Use 4 random chars, not 3, so codes are hard to guess.
- Shift runs: `wrangler kv key put --binding=<KV> "org:YFS-TCTC-7KQ4" '{"org":"Tri-County Tech","seat_limit":25,"ends":<start+30 days, unix s>,"plan":"pilot","issued":"<date>"}'`
- To end a code early: set `ends` to now.
- To free a seat: delete that `orgseat:` key and subtract 1 from the count. That's Shift's call, not Claude's.
- Seat counts for the monthly report → FOR_CLAUDE-org-report.

## Changelog
- `<script id="yfs-org-exp">` before `</head>`. It runs before the app reads Pro status. If this device's org Pro is past its end date, it turns Pro off and remembers to show the "ended" note. It only removes the token if that token is the org token. If Pro now comes from Stripe or Restore, it only drops the stale org record.
- New "Enter your program code" box (`#yfsOrgModal`), reusing the Restore box styles, light theme.
- End-of-body script:
  - `yfsOpenOrg()` / `yfsOrgRedeem()`. Codes are normalized (uppercase; spaces and dashes fixed).
  - Each device gets a random ID (`localStorage.yfs_did`, no personal data). It's sent with the code so a re-entry doesn't use a new seat.
  - On success it saves the token like Restore does (`yfs_pro`, `yfs_pro_token`) plus `yfs_org` `{org, ends, tok}`.
- Three entry points (Account, Plans, Restore box) and the `?org=` / `?code=` deep link. The code is removed from the address bar after it's read.
- Org-Pro users: no Manage/Cancel button; Account shows the org and end date.
- End date reached while the app is open → checked every minute and when the app comes back to the screen. Shows the "ended" note once.
- No Stripe, pricing, checkout, or key changes. No codes or secrets in the file.
- Test: new `tests/org_t.js`.

## Test results (Playwright, 390x844, Worker mocked with a fake code table, nothing real called)
- `org_t.js`: **ALL PASS (38 checks)**
  - T1: deep link prefills and does NOT use a seat until the tap; success message; Pro on; Account shows the org; no Manage/Cancel. AI calls carry the org token. Pro stays after reload. Same-device re-entry uses no new seat.
  - T2 / T3: 2nd device OK; 3rd device on a 2-seat code → "All 2 seats … taken", stays Free.
  - T4: invalid / ended / typo (rejected on the phone, no call) / empty. T4b: Worker route missing → "couldn't check", not "invalid".
  - T5: paying Pro user: no call, Stripe token untouched, Manage/Cancel kept.
  - T6: past end date at load → Free + note, shown once. T7: end date passes while open → Free + note.
  - T8: an old org record never removes Stripe Pro.
  - T9: all three entry points open the box.
  - No page errors anywhere.
- Regression vs base, output identical: `e2e.js` (free tease) and `upg_t.js` (Upgrade + checkout, Free/Pro). `frt_t.js` ALL PASS. `persist_t.js` no errors.

## Hunter phone steps (Android, Chrome, Incognito). After Shift adds the Worker route and one test code (e.g. `YFS-TEST-AB12`, 2 seats, ends in 30 days):
1. Open `yourfirstshiftapp.com/app.html?org=YFS-TEST-AB12`. PASS = a box "Enter your program code" opens with the code filled in.
2. Tap **Unlock Pro**. PASS = green "✓ Pro is on for this device through <date> — courtesy of <org>", and the top pill turns to Pro.
3. Tap **Account** (bottom right). PASS = "Pro — via <org>", the end date, and no Manage/Cancel button.
4. In a new Incognito window, open Account → "Have a code from your school or program?" and type `YFS-WRONG-0000`. PASS = "That code isn't valid…". Nothing unlocks.
5. Run any tool in the Pro window. PASS = full result, no blur.

## Rollback
Redeploy the base app.html (tip d613ae0a, sha256 7dc7461f…6600). Deeper rollback per ticket: tip 53e249d2. To switch codes off without a redeploy, Shift can remove the Worker route or set every code's `ends` to now.

## Not done
- Not done (outside Claude's role): deploy, merge to main, Worker route + KV entries + token signing (Shift), issuing real codes (Liz/Hunter → Shift), Stripe invoices / net-30 billing (Shift + Hunter).
- Root landing `yourfirstshiftapp.com/?org=…` is not handled because index.html isn't in this repo. Use the `app.html?org=` link.
- Monthly usage export → separate ticket FOR_CLAUDE-org-report.
- Full app.html and screenshots are linked on GitHub (byte-exact) instead of pasted into Drive, same as earlier returns.
