# CLAUDE RETURN: title parser + lonely-bullet guard
Base: tip dadd11b8 · Rollback: dadd11b8 · File: app.html (full replacement)
TEAM LOCK kept: no look CSS, Vault, Stripe/Worker, or free/Pro gating touched.

## Changelog
1. **Title stays the title.** The header parser now splits each header line on · | • and classifies each piece. Email, phone, City ST, and links go to contact; everything else goes to the target title. "Site Foreman · Heavy Equipment Operator" now shows as the orange title line, whether the AI writes it on its own line or tacked onto the contact line. Tested: Jordan Hayes, Jeffrey Moreno, "Registered Nurse | ICU", "Orlando, Florida 32801 — phone — email".
   PDF, Word, and Text all get this fix (same parser).
2. **Lonely-bullet guard (PDF).** A second pass after page breaks:
   - Widow: the last bullet of a job alone at the top of page 2 → the bullet before it comes too (and the job header if the job has only 2 bullets).
   - Orphan: the first bullet alone at the bottom of page 1 under its header (3+ bullet jobs) → header + bullet move to page 2.
   - Re-measures after every move; capped so it can't create big gaps.
   Sweep test: 5 looks × 30 content lengths on a Jordan-style 7-job resume. Before: 14 bad breaks. After: 0 widows, 0 orphans, 0 headers alone, 0 cut lines.
3. ATS text layer unchanged: still extracts all words.

## Note for Hunter's screenshot
"Labor Hand · Sunnyland Energy Service" at the top of page 2 is a **whole job** (header + its only bullet) that didn't fit at the bottom of page 1. That's the correct break, not an orphan. Keeping a job together is the right call; splitting the header from its bullet would be the real mistake.

## Hunter phone retest (live tip, hard-reload)
1. Jordan Hayes → Bold Trades: "SITE FOREMAN · HEAVY EQUIPMENT OPERATOR" is the orange title; contact = city · phone · email only
2. Download PDF → no single bullet alone at the top of page 2; no job header alone at the bottom of page 1
3. Long-press a word in the PDF (Drive viewer) → selects
4. Word (.docx) → title on its own line, contact clean
5. Spot-check one other look
6. Incognito (free) → still 🔒
