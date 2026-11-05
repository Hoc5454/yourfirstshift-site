# CLAUDE RETURN: Free results sell the resume (all 6 tools)
Base: tip 4f947d02 (verified byte-identical, sha256 70907ae0…) · Rollback: 4f947d02 · File: app.html (full replacement)
Additive: 1 CSS block + 2 scripts at the end of the file + a 1-word guard in rbSyncFromPage. No Stripe/Worker/Start/nav/Plans/Account/prompt changes. yfs-p3light kept.

## What changed
1. **New shared free "resume tease" (X-Ray, Outreach, Cover Letter, Interview).** Under the result, the person's OWN resume (Vault / upload / X-Ray resume box) is painted on a white resume page in their chosen look:
   - Name, title, contact and Professional Summary are sharp. Experience → Skills → Certs are blurred, with "Unlock full resume — $9/mo" and the Stripe cancel link.
   - Look chips above the page: Free can try all 5 looks on screen (Bold Trades, Modern…). It's a fun moment, and it shows what Pro downloads.
   - A per-tool heading and lock message, e.g. "Your resume, ready to send with this letter."
   - **Truth Lock:** the page is their own text, unchanged. Nothing is generated or invented.
   - Raw resumes (PDF/Word/paste) are converted to sections by a new `yfsRawToMd` (headings, job lines, bullets). No resume on file means no tease (nothing faked).
2. **X-Ray Free:** score + verdict stay sharp on top. The grey "rest of your fixes" blur is replaced by the resume page: "Your rewritten Experience + every fix are ready."
   **X-Ray Pro:** the full page with **the AI's rewritten Experience swapped in**, run through tlQuietStrip + pvClean against their resume + job first.
3. **Outreach / Cover Letter / Interview Free:** their usable free slice is unchanged. The old DARK blur bar is now light and readable, with honest per-tool wording ("The rest of your letter is ready", "Your other 2 messages + follow-up plan are ready", "The rest of your interview prep is ready").
4. **Resume Builder:** the live preview now shows a finished resume: bold job title · company, dates on the right, real bullets, skills joined with ·. Applies to Free (watermarked) and Pro, and the **Pro PDF matches** (tested in all 5 looks, 1 page). Pro editing: tap a section and it turns back into plain text to edit; tap away and it re-formats. The form text stays the source of truth (Word/Text exports unchanged).
5. Translator (tool 0): unchanged (regression PASS).

## Tested (headless Chrome 390px, simulated runs with a mocked Worker)
- Free X-Ray / Outreach / Cover / Interview with a raw Vault resume → tease shows, summary sharp, rest blurred, $9 button visible.
- X-Ray Pro → rewritten Experience on the page. Pro Outreach/Cover/Interview → no tease (full result only).
- Translator free paper unchanged; Builder free + Pro preview formatted; Builder PDF 1 page in all 5 looks.
- Regression: Trades result PDF 2 pages / 371 words readable; lonely-bullet sweep 150/150; Start/nav/Plans/Account suite PASS; no JS errors.

## Hunter phone PASS (hard-reload, Incognito = Free, with a resume saved in My resumes)
1. ATS X-Ray: score + verdict on top, then "Your resume for this job" page: your name/summary sharp, rest blurred, orange $9 button
2. Tap the look chips (Bold Trades, Classic…): the page restyles instantly
3. Cover Letter: letter shows, light "rest of your letter" lock, then the resume page tease
4. Interview Prep + Outreach: same pattern, readable (no dark bars)
5. Translator: same as before
6. Resume Builder: preview shows bold job titles, dates on the right, bullets
7. Pro (your phone): X-Ray shows the full page with the rewritten Experience; Builder Download PDF matches the screen
