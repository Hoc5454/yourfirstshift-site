# CLAUDE RETURN: #9 and #3 pre-stacked on #11 (ready the moment #11 ships)
**DO NOT MERGE until Liz PASS + Shift ships + Hunter phone PASS. Ship only AFTER #11 is live.**

Stack (each PR's base is the one before it, so the diffs show only that feature):
LIVE c9622d12 → #10 org-codes v2 → #11 org-report v2 → **heard-about-us v3** → **owen-landing v2**

| Branch | Replaces | app.html sha256 | Bytes |
|---|---|---|---|
| `claude/heard-about-us-v3` | #9 (same code, on top of #11) | `553a3fe75a8c3d3055ea2970878eec5bb5ac0ba70384f2fdf0ae8ebd290b1eee` | 284,922 |
| `claude/owen-landing-v2` | #3 (same code, on top of heard v3) | `2ad80b9d7b68fb37400b17cb392c2bfe252a151251ca890440caf51b77d2815d` | 287,636 |

Built by 3-way merge with LIVE (c9622d12) as the common ancestor. Only overlaps: blocks added right before `</head>` / `</body>`. Kept all of them; no feature code changed.

## Tests (Playwright 390x844, mocked Worker)
- heard v3: heard_t, org_t, src_t, frt_t → ALL PASS
- owen v2 (= everything): heard_t, org_t, orgrep_t, src_t, frt_t, owen_t → ALL PASS
- e2e + upg_t output byte-identical to LIVE on both. No page errors.

## Ship order
#8 Worker (deploying) → #11 → heard v3 → owen v2. If anything else ships in between, tell Claude the new tip and it restacks in minutes.
Old #9 and #3 can be closed once these PASS.
