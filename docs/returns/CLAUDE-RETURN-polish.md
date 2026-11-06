# CLAUDE RETURN: polish sweep (premium feel, tap sizes, layout)
Hunter: "make everything feel premium, no bugs." Branch `claude/polish` on #20 · app.html sha256 `c7815286d7c5f4ecb51ed6eb27c157de3a03f648eb7c832fcac2516fe985540c` · 301123 B
**DO NOT MERGE until Liz PASS + Shift ships + Hunter phone PASS.** CSS + 1 tiny script + 1 aria-label. No logic, price, Stripe or Worker change.

## How it was checked
New `tests/sweep_qa.js`: opens every screen (home, all 6 tools, results, Plans, Account, Restore, Vault, program code) at **390px and 360px**, free and Pro, and reports page errors, console errors, sideways scrolling, elements wider than the screen, buttons under 36px, unlabeled controls. Before: 0 errors, 0 overflow, but 28 small/cramped controls. **After: clean.**

## Fixed
- Footer links broke mid-phrase ("Delete / my / data", "Cancel / manage / subscription") → each link stays on one line, rows wrap centered.
- Vault cards: Use/Edit/Rename/🗑 squeezed into one row ("In use" on 2 lines, 32px wide) → 2×2 grid, 44px buttons; 🗑 now has an accessible label.
- Resume Builder: style picks, certification chips, PDF/Word/Text/Print buttons were 32px tall → 44px (finger-size standard).
- Result actions on phones fill the row evenly (no tiny orphan "Clear").
- Tool tab strip: soft fade on the right shows it scrolls; fade disappears at the end.

## Tests
sweep_qa clean; plans, cotab, refresh, adtag, src, heard, org, orgrep, owen, frt ALL PASS; e2e + upg_t + persist_t output identical to LIVE.
