# CLAUDE RETURN: share-preview (fix blank square when the link is texted/shared)
Branch: `claude/share-preview` · stacked on #14 · **DO NOT MERGE until Liz PASS + Shift ships + Hunter phone PASS.**
- app.html sha256 `55e0f7c8a08b6375c26a0f39a33fac47bc520484e53be086d4235d4fd8b4c196` · 289005 B
- NEW og-image.jpg (1200×630, 104 KB) sha256 `9649b967ec13450e08dd0b1e757258c917bd1b8ab738efe7ffad4674cd6776bb` → must be served at **https://yourfirstshiftapp.com/og-image.jpg**

## Why
Hunter texted yourfirstshiftapp.com and the preview showed a blank orange square. Neither index.html nor app.html had Open Graph tags (og:image/og:title/og:description), so Messages/RCS, Facebook, LinkedIn etc. had no picture to show.

## Change
- app.html: Open Graph + Twitter card tags after `<title>` (head only, no script/style change).
- og-image.jpg: navy card, YourFirstShift wordmark (site font Barlow Condensed, amber "First"), "Honest AI job tools for real workers", "1 free run · no card", "Pro $9/mo", Owen (approved master front image). No real brands, no photo of Hunter.

## ⚠ Shift: index.html is NOT in this repo
The link people share is the ROOT (yourfirstshiftapp.com). Paste `docs/returns/index-share-snippet.html` into index.html right after its `<title>` line, and deploy og-image.jpg at the site root. Without this, the root link still shows the blank square.

## After deploy
Previews are cached by each app. Check with https://developers.facebook.com/tools/debug/ (paste the URL → "Scrape Again"). Texts usually update for new messages; an old message keeps its old preview.

## Tests
adtag_t, src_t, heard_t, org_t, owen_t, frt_t ALL PASS; e2e + upg_t identical to LIVE.
