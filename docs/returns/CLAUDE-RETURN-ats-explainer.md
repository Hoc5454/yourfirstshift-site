# CLAUDE RETURN: ats-explainer ("What's ATS?" on the homepage)

## Change
`index.html` only (+4 lines): a short "What's ATS?" note placed directly under the **Fix my resume for a job** card (the homepage's ATS check), so a first-time visitor reads it before opening the app to upload.

Copy is exactly as approved:
> What's ATS? Most companies run resumes through an Applicant Tracking System, software that scans and sorts them before a person ever looks. If it can't read yours, you get skipped. We check that yours makes it through.

Style: existing site variables only (white card, charcoal text, amber left border, same 12px radius as the task cards). No JS, no images, no new fonts.
- Phones (one-column layout): sits right under the Fix card.
- Wider screens (2–3 columns): spans the full row under the task cards, so the card grid isn't broken up.

## Files / hashes
- Base: PR #32 head `315c972` index.html = live, sha256 `9758fcd75bef9939f99b136752674ed53625a13a66784cb6099ae7d51fd3c1b3`
- New index.html: sha256 `1e327028bb13950d72c43fc2f271620819f26cb438bad58d8e41307adb87564c` (24452 bytes)
- Deploy **index.html only**. Do NOT deploy this branch wholesale (its app.html and Worker are older than production).

## Checks
| Width | Note position | Sideways scroll | Layout shift (CLS) |
|---|---|---|---|
| 412 (S25 Ultra) | 12px under Fix card | none | 0 |
| 360 | 12px under Fix card | none | 0 |
| 768 | full row under cards | none | 0 |
| 1280 | full row under cards | none | 0 |

Screenshots: `docs/returns/ats-explainer/s25-ultra-412px.jpg`, `desktop-1280px.jpg`.
Note: the test harness logs one page error ("Unexpected token '<'") on the old and new page alike: it's Cloudflare's email-decode script, which the local harness can't serve. Not from this change.

## Full-app tests (production app, sha256 324aa1b0, unchanged by this PR)
upg_t, src_t, frt_t, cotab_t, gate_t2, plans_t, refresh_t, resume_t, reader_t, hang_t, persist_t, org_t, heard_t, adtag_t, owen_t: **15/15 pass**. e2e free flow matches the live baseline.

## Not touched
app.html, Worker, checkout, pricing, Stripe, DNS, Cloudflare, favicon/icons, Owen assets, og image.

## Rollback
Re-upload the previous index.html (sha256 `9758fcd7…`), or roll back to the current Pages deployment.

## Phone check (Hunter)
Open yourfirstshiftapp.com on the S25 Ultra, scroll to "Pick a task": the amber-edged "What's ATS?" note sits right under "Fix my resume for a job", fully readable, nothing jumps while loading.
