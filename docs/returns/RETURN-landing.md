# CLAUDE RETURN: landing refresh (index.html only)
Base: live index.html (sha256 f9f4d5e5…, 28,071 bytes) · Rollback: current Pages tip de8b1c11 (re-tip the old index.html) · app.html NOT touched (prior app rollback 53924f21)
File: index.html (full replacement). Shift: tip index.html only.

## Changelog
1. **Light theme matching the app Start:** #F8FAFC background, white cards, #0F172A text, amber CTAs with dark text, blue links. Mobile-first, 44px+ tap targets, WCAG AA colors.
2. **Hero:** "STOP GETTING IGNORED" replaced with **"GET HIRED FASTER."** (same as the app). Kept the honest copy: "it's a match problem… fix it with your real experience. We never invent anything." One primary CTA above the fold, **Try it free → app.html**. Secondary: See how it works. "1 free AI run · no signup · no card."
3. **Trust chips:** We never invent experience · Powered by Claude · Proudly USA.
4. **"What do you need?" cards** mirror the app Start and deep-link straight into each tool (app.html#tool-5 / #tool-1 / #tool-3 / #tool-4; More tools → #tool-0 / #tool-2). Uses the #tool-N deep link that shipped in tip de8b1c11.
5. **"Software sorts. People decide."** kept, shortened. The fake terminal with 28→91 scores is replaced by a plain before/after rewrite example labeled as an example ("Match scores are AI estimates, not an official ATS score").
6. **How it works:** 3 steps (was 4).
7. **Pricing, locked to match the app:** Free $0 · **Pro $9/mo, the only buy button** (unchanged `yfsLandCheckout` → Worker /api/pro/checkout) · Job Hunt Pack $29/30d **Available soon** (no button) · Pro yearly $59 **Available soon** · Premium **Coming soon** (no price, no button) · Schools/unions/job programs → **Contact us** (mailto with subject).
   - Removed the "Most Popular" badge (no data behind it); Pro now says "Available now."
   - Pro features updated to match the app: clean PDF + Word downloads; uploads PDF/Word/photo.
8. **Kept:** Stripe portal cancel/manage links (Pro card, under pricing, footer), contact email, Proudly USA line, Anthropic trademark disclaimer, CF email-decode script.
9. Footer Contact is now a plain mailto (wrapped in email_off), so the link doesn't depend on Cloudflare obfuscation.

## Tested (headless Chrome, 390 + 1280)
No JS errors. Every CTA → app.html (or a tool deep link). Only "Get Pro — $9/month" calls checkout (verified: 1 call → stripe redirect). Pack/yearly/Premium have no clickable buy.

## Hunter phone PASS
1. Hard-reload yourfirstshiftapp.com: light page, "GET HIRED FASTER.", orange "Try it free" visible without scrolling
2. Try it free → app Start screen
3. Each task card opens the matching tool in the app
4. Pricing: only Pro has a buy button → Stripe checkout; Pack/yearly "Available soon"; Premium "Coming soon"; Contact us opens email
5. Cancel / Manage subscription → Stripe portal
