# CLAUDE RETURN: light theme for all tool screens + Vault (Phase 3, pulled forward)
Base: Claude's Start + nav app.html (= tip de8b1c11 IF Liz confirms byte-identical) · Rollback: de8b1c11
File: app.html (full replacement). Change = ONE new <style id="yfs-p3light"> block appended at the end of <head>. No HTML or JS changed.

## What changed
- The whole app is now light (#F8FAFC page, white cards, #0F172A text), matching Start, Plans, and Account: top bar, Vault bar, tool tabs, all 6 tool screens, upload box, inputs, Resume Builder form + style picker, the preview backdrop, results, paywall, footer.
- **Vault modal light** (fixes the near-invisible dark-blue "RESUME VAULT" title on dark). Cards, buttons, and name field are light; 44px close button.
- **Restore Pro modal light.**
- **Contrast fixes:** amber and green used as text are now dark amber #B45309 / dark green #047857 so they pass WCAG AA on white. Amber stays as the button fill color, with dark text on it.
- Run button = amber with dark text; disabled = grey. Copy = green with white text.
- The checkout-canceled toast stays dark on purpose (it floats over the page).

## Not changed
Resume look CSS (what prints/downloads), export code, Stripe/Worker/checkout, free/Pro gating, Start/nav/Plans/Account.

## Tested (headless Chrome, 390×844)
- Screenshots of all 6 tools (free), free result + paywall, Pro result + look picker, Builder, Vault, Restore modal: all light, readable.
- No JS errors. Start/nav/Plans/Account test suite passes.
- Regression: Trades PDF 2 pages, 371 words readable; builder PDF OK; lonely-bullet sweep 150/150 clean.

## Hunter phone PASS (hard-reload)
1. Open every tool from Start: light background, no dark screens
2. Resume Vault: title readable, cards light, Save works
3. Run a tool: the result box and the Copy / Download buttons are readable
4. Free (Incognito): paywall card readable; "Get the clean PDF" button orange with dark text
5. Resume Builder: style picker + preview look right; Download PDF still matches the screen
6. Restore Pro (Account → Restore): light modal, readable
