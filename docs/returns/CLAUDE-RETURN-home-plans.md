# CLAUDE RETURN: home-plans (homepage Pack / Yearly cards follow the server)

## Problem
The homepage's Job Hunt Pack ($29) and Pro yearly ($59) cards were hard-coded "Available soon" (greyed). The app instead asks the Worker (`GET /api/pro/plans`) which plans are on sale. So the homepage could never show them as available, even when they're live in the app. (Not caused by the ATS note; the live homepage 9758fcd7 has the same hard-coded cards.)

## Fix (index.html only, stacked on #33)
- On load, the homepage calls the same `/api/pro/plans` the app uses (5s timeout).
- A card turns live ONLY if the Worker says `true` for it: badge "Available now", amber button "Get the Job Hunt Pack — $29" / "Get Pro yearly — $59/year".
- The button calls the existing checkout with `{"plan":"pack"}` / `{"plan":"pro_year"}`, the same bodies the app sends. Success returns to app.html like today.
- Pro $9 button is unchanged (still sends `{}`).
- If the Worker says false, errors, or never answers, the cards stay exactly as today ("Available soon"). Premium stays "Coming soon".
- No Worker, Stripe, price, app or DNS change.

## Files / hashes
- New index.html sha256 `2e05337d53e144b724ead36e9b7cc5e04841d2a33adbb3948a6b7edb084e8ce7` (25781 bytes). Base #33 1e327028…, live 9758fcd7….
- Deploy index.html ONLY (it includes #33's ATS note). Never deploy the branch wholesale.

## Tests: tests/home_plans_t.js, 12/12 PASS
T1-2 plans on → both cards live; T3-4 buttons send pack / pro_year; T5 Pro still sends {}; T6 no page errors; T7 CLS 0; T8 only Pack on → Yearly stays soon; T9 plans off → today's look; T10 server error → today's look, no errors; T11 server never answers → gives up at 5s, today's look.
Screenshot: docs/returns/home-plans/plans-live-412px.jpg

## What decides whether they turn on
The Worker returns pack/pro_year = true only when Shift has set the Stripe price IDs `YFS_PRICE_PACK` and `YFS_PRICE_YEAR` on the live Worker. If they aren't set, the app doesn't sell them either, and the homepage correctly keeps "Available soon".

## Rollback
Re-upload index.html from #33 (1e327028…) or live (9758fcd7…).
