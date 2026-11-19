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


## How the site is served (Cloudflare Pages `_worker.js`)

Every page of yourfirstshiftapp.com is answered by one file, `_worker.js`, uploaded to Cloudflare Pages (Direct Upload, advanced mode).
It holds every site file plus a small router. Because that worker answers every request, Cloudflare ignores `_redirects`, `_headers`
and its own static-file routing for this project. `_redirects` in this repo has no effect and is kept only as a note.

The builder and router live here so the deployed file always comes from reviewed code:

```
node tools/build-pages-worker.js <siteDir> tools/pages-files.json _worker.js --dir-index
```

- `<siteDir>` is a folder holding every file named in `tools/pages-files.json`. This repo holds `app.html`, `org-report.html` and `job/`.
  The home page, legal page, icons, `robots.txt`, `sitemap.xml` and `site.webmanifest` are **not in the repo yet**; they come from the deploy box.
- `--dir-index` makes `/job` and `/job/` serve `job/index.html`. Use it for every deploy. Without it you get the router production ran up to be89f333.
- Same files + same list + same flag = the same bytes. The command prints the bundle's sha256 and size: post them with every deploy.
- The router reads only the path. No keys, no network calls, no bindings. `/api/*` is not served here (404); the API is the separate `yourfirstshift` Worker.
- To add a file to the site, add a line to `tools/pages-files.json` (path + content type). New lines go at the end.

Checks: `node tests/pages_worker_t.js ..` builds a bundle and sends requests through the router.
With the 21 production files in a folder, `node tests/pages_worker_t.js .. --prod-dir <folder>` also rebuilds production be89f333 and compares it byte for byte
(sha256 `1a7d3063…`, 1,009,929 B; expected hashes in `tools/prod-be89f333.expected.json`).

Is it live? `node tools/live-check.js` downloads every site file this repo holds and compares it with `main`, byte for byte.
If a file differs, it says which earlier version the site has. `--base <preview address> --ref <branch>` checks a preview before it ships.
On GitHub: Actions → Live site check → Run workflow (green = the site is main). It only reads public files: no keys, nothing changed, nothing deployed.
On yourfirstshiftapp.com (not on `*.pages.dev` previews) Cloudflare hides email addresses in a page on the way out, with a new key on every download,
so `/app.html` as a visitor gets it never has the hash of the uploaded file. The check undoes exactly that edit before comparing and says so in its answer.
In `app.html`, the marker that ends an `<!--email_off-->` part is `<!--/email_off-->`. The file has `<!--email_on-->` there, which Cloudflare does not read,
so protection stays off from that point to the end of the page (harmless; fix it with the next `app.html` change).
Its own test, against a stand-in site: `node tests/live_check_t.js ..`.

Deploying is Shift's job, after Hunter says so. Nothing in this repo deploys anything.

Clocked In offline: it opens with no signal from `/job/` or the Home Screen icon (`/job/?src=homescreen`) after one visit with signal. The address `/job` (no slash) needs signal.
