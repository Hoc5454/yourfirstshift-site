# YFS headless test harness

Playwright (preinstalled in Claude workspaces) + routed CDN libs + mocked Worker. Nothing here talks to the real Worker or Stripe.

Setup: `cd tests && npm install` (html2pdf + jspdf get served locally to the page). pdftotext/pdftoppm for PDF checks.

Main scripts (most take the app.html path as an argument; one-offs may hardcode `../app.html`):
| Script | Checks |
|---|---|
| `run.js <app.html> <look> <out>` | Pro styled PDF + DOCX export for one look |
| `sweep.js` | Lonely-bullet sweep (150 cases) |
| `e2e.js` | Free tease end-to-end |
| `rb.js`, `rbedit.js` | Resume Builder render/edit/PDF |
| `gate_t2.js`, `cl_t.js` | Cover upload gate / free slice |
| `persist_t.js` | Per-tool restore |
| `upg_t.js` | Upgrade button after free run |
| `p1test.js` | Start screen, nav, deep links |

Minimum bar before any return: page loads with no PAGEERR, the ticket's own test passes, and `e2e.js` + `upg_t.js` still pass.
