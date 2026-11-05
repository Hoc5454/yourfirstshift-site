# CLAUDE RETURN: "Upgrade to continue →" opens checkout
Base: tip 5550e8e2 (sha256 cfddee2f…, 260627 B; verified = Claude's last file) · Rollback: 5550e8e2
Return: app.html · sha256 b83e9d4095f2efc5a8d59abfd3daf5b1d7143462ce89d32a667004bc2db11bd0 · 260854 bytes · Scope: app.html only

## Fix
- After a Free run, the run-slot button "Upgrade to continue →" is now orange (ready), enabled, and calls **yfsOpenCheckout()**, the same path as the working bottom unlock / Clean PDF buttons. Before, it was grey and still wired to runTool, which no-ops when the free run is used.
- The gate wrapper keeps it that way if updateRunBtn runs again (e.g., typing in the job box), so it never turns grey/dead again.
- No second free AI run is possible from it (it never calls runTool).
- Pro: unchanged. Pro never sees Upgrade on the run button (existing Pro reset kept).
- Builder: unchanged (its "Free AI build used — Unlock Pro for more →" already opened checkout).

## Tested (390px, mocked Worker/checkout)
- Free Cover run → button "Upgrade to continue →", orange, enabled; still so after typing; tap → 1 checkout call, 0 extra AI calls.
- Pro Cover run → "Run Cover Letter Generator →", runs again normally.
- Regression: per-tool restore (switch away/back), Cover gate hints, 4-tool tease, page-break sweep 150/150.

## Hunter phone PASS (Incognito)
1. Free Cover Letter run → top button says "Upgrade to continue →" in orange
2. Tap it → Stripe checkout opens (same as the bottom unlock button). Don't pay; just confirm it opens.
