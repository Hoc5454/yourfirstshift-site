# CLAUDE RETURN: tiktok-ad link tag (for the paid boost)
Branch: `claude/tiktok-ad-tag` · stacked on #13 (owen-landing v2) · app.html sha256 `86952cc7be79e6b43927910c7816771e2e637f9981f110629e52173649231898` · 287681 B
**DO NOT MERGE until Liz PASS + Shift ships + Hunter phone PASS. Ship after #13.**

Boost link: `yourfirstshiftapp.com/app.html?src=tiktok-ad` (or the root `?src=tiktok-ad` if the landing page forwards the query).

## Change (3 tiny edits, app.html only)
- `yfs-src` allowed tags: added `tiktok-ad` (was tiktok/reels/shorts). Everything else unchanged.
- Heard card's fallback src check: added `tiktok-ad`.
- Comment updated. Worker needs nothing: #8 already accepts any lowercase a-z0-9_- tag.
Result: paid visitors are counted separately from organic TikTok (visit / free_run / pay_tap / checkout / heard answers), and Owen's welcome card shows for them too.

## Tests
- New `tests/adtag_t.js`: ALL PASS (tag captured, visit metric tagged, Owen card shows, checkout carries src=tiktok-ad, junk tag rejected, no page errors).
- src_t, heard_t, org_t, orgrep_t, owen_t, frt_t: ALL PASS. e2e + upg_t identical to LIVE.

## Note on Liz's handoff
#12 (heard v3) and #13 (Owen v2) are ALREADY built on #11. If #11 shipped byte-exact (app.html sha256 9c98640008e3…6413), no rebuild is needed: review #12 → #13 → this PR.
