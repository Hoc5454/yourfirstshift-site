# CLAUDE RETURN: per-tool result restore (free tease survives tab switches)
Base: tip d3627461 (sha256 6038aad8…, 257807 B; verified = Claude's last Cover Letter file) · Rollback: d3627461
Return: app.html · sha256 cfddee2f0cb2efde33b771da074e2b7ac25a3b4d353806125bd0d091c24c0bb2 · 260627 bytes
TEAM LOCK kept. Scope: app.html only.

## Cause
The app kept ONE result slot (yfs_last_output + yfs_last_tool) and the tease rebuilt its resume page from whatever was loaded at that moment. Switching tabs cleared the upload, so coming back found no resume, and the tease (and sometimes the result) vanished. In the free-used state, a tab could also show another tool's result.

## Fix
1. **Per-tool storage** `yfs_res` (one key, a map by tool): {text, src = the resume used for that tease, free flag, ts}. Saved on every fresh result only.
2. **Restore on every tab open** (switchTool/renderTool, and after reload): if THIS tool has a saved result, show it again exactly as before (Free: same sharp/blurred split + resume tease, rebuilt from the saved resume). Restores never call the Worker and never touch yfs_usage.
3. **No result for this tool → nothing shown.** Another tool's result never appears under it. One free run = that one tool only.
4. Old single-slot data is migrated once into yfs_res.
5. **Delete my data** also clears yfs_res. The internal reset already wipes all yfs_* keys.
6. Pro: unchanged. A free-era record isn't restored for a Pro user (Pro just runs again, clean).
7. Builder: unchanged (it already restores from its draft; Free blur still applies).

## Tested (390px, mocked Worker, 1 Worker call total)
- Cover Free run → X-Ray (paywall, no Cover text) → Interview (same) → Home → Cover = same letterhead + first paragraph + locked rest + JORDAN HAYES tease. usage stays 1.
- Reload page → Cover still restored.
- Builder Free still blurred. Regression: Cover gate, 4-tool tease, page-break sweep 150/150, Start/nav, Trades PDF 371 words, Builder Pro edit.

## Hunter phone PASS (Incognito)
1. Cover Letter Free: resume + job → Run
2. Tap another tool, then Home, then Cover Letter again → same letter preview + resume tease (nothing re-runs, pill still "Free run used")
3. Other tools don't show the Cover Letter result
4. Close and reopen the page → Cover Letter result still there
