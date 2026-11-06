# CLAUDE RETURN: restack-on-22b6264f
**DO NOT MERGE until Liz PASS + Shift ships + Hunter phone PASS.**

## Summary (plain English)
Good news: the restack Liz asked for was already sitting on GitHub, built on exactly the commit that went live (`ae425f17`). PR #9 is rebuilt as **PR #12**, PR #3 as **PR #13**, and the `tiktok-ad` link tag is **PR #14** on top. This run checked all of it against the live tip and reran every test. Everything passes. No new code was needed, so this run pushed no new branch and opened no new PR. A duplicate would only add noise.

## New base (verified)
- Live tip 22b6264f = branch `claude/org-report-v2` @ `ae425f1767db193570c1749a556143f3c9e63c7f`
- Its app.html sha256 = `9c98640008e33eb81182424e3569bf579edf9d503d50fadeec658400fc996413`, 279,261 B. **Matches the ticket exactly.**
- `ae425f17` is an ancestor of #12, #13 and #14, so nothing from the live tip is dropped.

## Restacked PRs (ship in this order, or ship #14 alone = everything)
| Replaces | New PR | Branch | head | app.html sha256 | Bytes |
|---|---|---|---|---|---|
| #9 heard-about-us v2 | **#12** https://github.com/Hoc5454/yourfirstshift-site/pull/12 | `claude/heard-about-us-v3` | `0584f8cd` | `553a3fe75a8c3d3055ea2970878eec5bb5ac0ba70384f2fdf0ae8ebd290b1eee` | 284,922 |
| #3 Owen card | **#13** https://github.com/Hoc5454/yourfirstshift-site/pull/13 | `claude/owen-landing-v2` | `8c36f7ac` | `2ad80b9d7b68fb37400b17cb392c2bfe252a151251ca890440caf51b77d2815d` | 287,636 |
| + tiktok-ad tag | **#14** https://github.com/Hoc5454/yourfirstshift-site/pull/14 | `claude/tiktok-ad-tag` | `882a66bd` | `86952cc7be79e6b43927910c7816771e2e637f9981f110629e52173649231898` | 287,681 |

Each PR's base is the one before it, so each GitHub diff shows only that feature. `app-restack-on-22b6264f` (the #14 head = everything) is the attached file.

## Allowlist change
`yfs-src` now accepts `tiktok | reels | shorts | tiktok-ad` (also mirrored in the checkout `src()` helper). Unknown tags like `tiktok-adz` are still rejected. Boost link: `yourfirstshiftapp.com/?src=tiktok-ad`.

## Kept intact (checked on #14 head)
- `yfs-src` is still the **first `<script>` in `<head>`** (same position as live).
- `yfs-file-retry`, org-codes (`yfs-org-exp`) + org-report scripts from #10/#11, heard-about-us fields, and the Owen card UI/copy are all present and unchanged. Owen's locked look was not touched.
- Conflicts: none beyond the blocks appended before `</head>` / `</body>`. All kept, and no feature code was changed.

## Test results (Playwright 390x844, Worker mocked, no real API/Stripe)
| Suite | #12 | #13 | #14 |
|---|---|---|---|
| heard_t | PASS | PASS | PASS |
| src_t | PASS | PASS | PASS |
| frt_t | PASS | PASS | PASS |
| org_t | PASS | PASS | PASS |
| orgrep_t | PASS | PASS | PASS |
| owen_t | n/a (no Owen yet) | PASS | PASS |
| adtag_t | n/a | n/a | PASS |
| e2e.js | identical to LIVE | identical to LIVE | identical to LIVE |
| upg_t.js | identical to LIVE | identical to LIVE | identical to LIVE |
No page errors. Screenshot: `restack-on-22b6264f-390x844` (opened with `?src=tiktok-ad`; Owen card shows).

## Hunter phone steps (Android, after Shift deploys #14 to a preview link)
1. Open the preview link Shift sends, with `?src=tiktok-ad` added to the end.
2. Check that a yellow "Owen sent you. Your free run is ready." card shows at the top, then tap the X. It should go away.
3. Tap "Fix my resume for a job", paste a resume, and run it. You should see a score and the blurred locked part as usual.
4. Look for the "How did you hear about us?" question and pick an answer. It should save without errors.
5. Tap Upgrade. Stripe checkout should open showing $9/mo. **Do not pay.** Just go back.

## Rollback
Redeploy the current live tip: Pages deploy `22b6264f` (app.html sha256 `9c986400…6413`, from `claude/org-report-v2` @ `ae425f17`). The earlier rollback deploy `f6ff9bb7` is still available.

## Not done (outside Claude's role)
- Deploying, and merging anything to main: Shift / Hunter.
- #4/#5/#6 were already closed as superseded by an earlier run (branches kept). Old #9 and #3 are still open. Close them once #12/#13 PASS (Liz/Hunter call).
- #15 (share-preview, stacked on #14) exists from another session. It wasn't part of this ticket and wasn't touched.
