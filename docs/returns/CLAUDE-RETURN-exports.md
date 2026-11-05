# CLAUDE RETURN: PDF + Word export hardening
Base: tip 0a80bad6 · Rollback: 0a80bad6 · File: app.html (full replacement, single file)
File lock released once Shift ships this tip.

## Changelog
1. **Styled PDF is now ATS-readable.** Before: the html2pdf PDF was an image only (0 readable words; an ATS saw a blank page). Now: an invisible text layer sits under the design, matched line by line. Same look, and the words are now selectable and copyable (tested: 371/371 words extracted, correct reading order, dates on the job line).
2. **Builder "Download PDF" = the design on screen (WYSIWYG).** Before: it saved a plain Helvetica text PDF that didn't match the chosen look. Now: styled PDF with text layer. The plain text PDF is kept as an automatic fallback if the PDF library fails to load.
3. **PDF filename** = `First-Last-Resume.pdf` in both paths (was `YourFirstShift-Resume.pdf` in the builder).
4. **No lone bullet on the next page.** If the last bullet of a 3+ item list would fall alone at the top of page 2, it moves with the bullet before it (fixes Trades "CPR / First Aid" alone on p2).
5. **Page-height math matches html2pdf exactly** (shared `yfsPdfPH()`), so breaks and the text layer can't drift on 3+ page resumes.
6. **Word (.docx):** section headings, name/title, and job lines are kept with the next line (no heading stranded at the bottom of a page). Job lines are `Title · Company` with **dates right-aligned on a tab**, matching the PDF. The header still prints once, and the Trades hierarchy is kept.
7. **Helper copy (builder toolbar)** now says what each button is for: PDF = design + ATS-readable; Word = editable copy for employer portals (some phone apps restyle it); Text = paste-in boxes.

## Not changed (per TEAM LOCK)
No theme/look CSS, no light theme, no Vault, no Stripe/Worker/checkout, no free/Pro gating logic.

## Tested (headless Chrome, 390px phone viewport, html2pdf 0.10.1 / jsPDF 2.5.1)
- All 5 looks × result-area PDF + Word, and all 5 looks × builder PDF. No JS errors.
- PDF: 2 pages, no clipping, no dead bands, text extracts.
- Word: valid OOXML, opens in LibreOffice, 2 pages, dates right-aligned.

## Known / follow-up (theme phase)
- The builder live preview shows job lines as plain text (no bold title). The PDF matches the screen; the hierarchy upgrade belongs in the theme work.
- Trades PDF has a 0.4in white strip above the black header band (uniform page margin). Fix during theme work.
- Android Google Docs restyles .docx: accepted.

## Hunter phone PASS checklist (live tip)
1. Bold Trades → Download PDF → open: 2 pages, nothing cut off at the bottom, no big blank gap
2. In that PDF, long-press a word → it selects/copies (= ATS can read it)
3. Page 2 doesn't start with one lonely bullet
4. Filename is YourName-Resume.pdf
5. Word (.docx) → name/contact appears once, job titles bold, dates on the right
6. Resume Builder tab → Download PDF → looks like the on-screen preview, not plain text
7. Spot-check Modern, Minimal, Tech, Classic → Download PDF opens and looks right
8. Free account → PDF/Word still show 🔒 and go to checkout
