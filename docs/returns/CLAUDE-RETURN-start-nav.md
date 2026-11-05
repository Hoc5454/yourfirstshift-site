# CLAUDE RETURN: Phase 1 Start screen + labeled bottom nav
Base: tip 53924f21 (205,807 bytes, verified byte-identical) · Rollback: 53924f21 · File: app.html (full replacement, 231,259 bytes)
Change is additive: one new <style>, the Start screen markup, bottom nav + 2 sheets, and one new <script>. No existing function body edited (the wrappers call the originals).

## What's new
1. **Start screen (light #F8FAFC)**: "Get hired faster. What do you need help with today?"
   - Build my resume → Resume Builder (tool 5)
   - Fix my resume for a job → ATS X-Ray (tool 1), "Start here if you have a resume"
   - Write a cover letter → Cover Letter (tool 3)
   - Practice my interview → Interview Prep (tool 4)
   - "More tools": Resume Translator (0), Outreach (2). All 6 live tools are reachable; no dead ends.
   - Resume strip: "Already have a resume? Add" → Vault. Once saved: "Using: <name> · Change".
2. **Labeled bottom nav** (all screen sizes): Home · My resumes (opens Vault) · Plans · Account.
3. **Tool view**: the hero/stat block is hidden, so the tool sits above the fold. Tabs show text labels on phones (no more emoji-only). "‹ All tasks" back link. The phone Back button returns to Start (#tool-N history). Deep link: /app.html#tool-3 opens that tool.
4. **Plans sheet** (prices locked): Job Hunt Pack $29/30d · Pro $9/mo · Pro yearly $59 · Premium "Coming soon" (cannot be selected) · Free $0 · under Free: "For schools, unions & job programs → Contact us" (email). Fine print changes with the plan picked (Pack = "One-time charge · no subscription"; Pro = "Cancel anytime").
5. **Account sheet**: plan status + free runs left, See plans, Restore Pro, Manage/cancel (Pro only), My resumes, Privacy · Terms · Contact · Delete my data. The Restore/Manage buttons moved here from the crowded top bar.
6. **Pill**: "1 free run left" / "Free run used" / "Pro — Unlimited".

## ⚠ Needs Worker/Stripe (not in this tip, TEAM LOCK)
- **$29 Pack and $59 yearly are shown as "Available soon" and can't be bought yet.** The Worker's /api/pro/checkout only sells $9 Pro today. To go live: Stripe prices (Pack = one-time payment + 30-day access; Pro yearly = recurring), Worker accepts `{"plan":"pack"|"pro_year"}`, and Pack Pro-token expiry at 30 days. Then flip `live:true` in `YFS_PLANS` (2 words). The Pack automatically becomes the default pick when live. Until then the default is $9 Pro, which works today.
- **Free-run count:** the Worker has no "runs left" endpoint, so the pill uses the same device count the app already uses, corrected by the Worker's 402. A true server count needs a small Worker endpoint (optional).

## Not changed (per ticket)
No B2B, no Premium buy, no job link. Tool screens, Vault modal, paywalls, and checkout code untouched and still dark (light theme for tool screens = Phase 3). Exports untouched.

## Tested (headless Chrome, 390×844 phone + 1280 desktop)
- No JS errors. All 6 tool routes open the right tool; Back → Start; deep link works.
- Plans: Premium/Pack/yearly can't be selected; CTA "Continue — $9 / month" → existing checkout.
- Free and Pro states (pill, Account sheet) correct.
- Regression: Trades PDF 2 pages + 371 words readable; builder PDF OK; lonely-bullet sweep 150/150 clean.

## Hunter phone PASS checklist (hard-reload the tip)
1. Opens on "GET HIRED FASTER." with 4 big cards, light background
2. Each card opens the right tool; "‹ All tasks" and the phone Back button return to Start
3. Bottom bar shows Home · My resumes · Plans · Account, with words under the icons
4. My resumes opens the Vault; after saving, Start shows "Using: <name>"
5. Plans: Premium greyed "Coming soon"; Pack/yearly "Available soon"; $9 Pro → Stripe checkout opens; schools "Contact us" opens email
6. Account: Restore works (free); Manage/cancel shows only when Pro
7. Pill says "1 free run left" (Incognito)
8. Run one tool + Download PDF still works; bottom bar not in the PDF or print
