# CLAUDE RETURN: Cover Letter upload gate + wiring, Free Builder blur
Base: tip 0763c214 (sha256 4929599e…, verified identical) · Rollback: 0763c214 · File: app.html (full replacement)
Kept: free-tease, yfs-p3light, yfs-p4tease. No index.html / Stripe / Worker / Start / nav / Plans / Account / prompt-copy changes.

## Changelog
1. **Busy gate (all upload tools):** while a resume file is being read, Run is grey and a hint says "Reading your resume… usually 10–30 seconds. Run unlocks when it's done." runTool does nothing while busy (no Worker call, no free run burned). There's a 90s safety reset if a read never finishes. The upload text changed from "about 10 seconds" to "Usually 10–30 seconds…".
2. **Cover Letter ready rule:** Run unlocks only with BOTH the job description typed AND a resume (uploaded file OR My resumes). A live hint says exactly what's missing: "Add your resume and the job description." / "Add your resume (upload it, or save it in My resumes)." / "Paste the job description." runTool double-checks and won't call the Worker if anything is missing.
3. **Cover Letter wiring fixed:** Job info = the job box only. Applicant background = uploaded resume, or My resumes if none uploaded. Before, the uploaded resume replaced the job info and was sent as "Job info". Tested: the request body has the JD under Job info and the resume under Applicant background.
4. **Uploading no longer wipes the Cover Letter job box.** Translator still clears its paste box on upload (unchanged).
5. **Free Resume Builder preview:** name/contact + Professional Summary sharp. Experience → Skills → Education → Additional blurred, with "Unlock full resume — $9/mo" + Stripe cancel link (watermark kept). Form text untouched. **Pro unchanged:** full sharp preview, PDF matches (tested).

## Tested (headless Chrome 390px, mocked Worker)
- Cover Letter: empty → grey + hint; JD only → grey "Add your resume"; resume only → grey "Paste the job description"; busy → grey, no Worker call; both → ready → letter + resume tease.
- Translator: upload alone → ready (unchanged). X-Ray: needs JD + resume (unchanged).
- Free Builder blurred + CTA; Pro Builder sharp; Builder Pro PDF OK.
- Regression: free tease on X-Ray/Outreach/Cover/Interview; lonely-bullet sweep 150/150; Start/nav suite; Builder Pro edit round-trip; no JS errors.

## Hunter phone PASS (Incognito = Free)
1. Cover Letter: upload a resume → button stays grey with "Reading your resume…" until it says Resume loaded
2. With only the resume: grey + "Paste the job description." Type the job → button turns orange
3. Run → a real letter about THAT job, using your resume (no "not enough information"), then the resume page tease
4. Translator: upload a resume → Run works like before
5. Resume Builder (Free): fill the form → name + summary clear, everything below blurred with the orange $9 button
6. Pro phone: Builder preview fully clear; Download PDF matches
