# YourFirstShift — site code

Code for **yourfirstshiftapp.com** (Cloudflare Pages). Owned by Hunter & Madeline.

## What's here
| File | What it is |
|---|---|
| `app.html` | The live app, single file. **main = live** (Cloudflare tip `53e249d2`, sha256 `b83e9d40…`, 260,854 B, includes the Upgrade-button fix). |
| `docs/returns/` | Claude's return notes for each shipped ticket (changelog, sha, rollback). |

## TEAM LOCK
1. **Liz** writes the ticket (Drive → `YFS Handoffs/To Claude`).
2. **Claude** builds, tests, and returns the full file (Drive → `From Claude`, plus a branch/PR here).
3. **Liz PASS** → **Shift tips** to Cloudflare → **Hunter phone PASS**.
- One editor on app code: Claude.
- **No secrets** in this repo (no Worker keys, Stripe secrets, CF tokens).
- Ask Hunter before any spend, DNS change, or delete.

## Rules for this repo
- `main` only ever holds what is **live**. New work goes on a branch → PR → Liz PASS → Shift ships → merge.
- **Cloudflare Pages is NOT connected to this repo** (on purpose). Don't connect it until the team agrees — once connected, a merge to main goes live automatically.
- Drive holds tickets and docs; GitHub holds code and history.
