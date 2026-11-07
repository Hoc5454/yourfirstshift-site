# CLAUDE RETURN: Liz's follow-ups on #19/#20/#21
**DO NOT MERGE until Liz PASS + Shift ships + Hunter phone PASS.** Ship after #19 and #21.

| Branch (base) | Change | Tests |
|---|---|---|
| `claude/followups-worker` (on #19) | `charge.dispute.created` (chargeback) revokes a $29 pack, same as a refund; restore refuses it too | plans_worker_t **29/29** (+4), org_worker_t 51/51 |
| `claude/followups` (on #21) · app.html sha256 `385b0c929201739037b41ebda69d3c9e97bfcedff73258fed2a23c6bcec0cc94` · 301378 B | aria-label "Add <cert> to certifications" on every .rb-cert-chip; checkout request gives up after 20s → "Checkout is unavailable… not charged", spinner cleared, can retry | cotab_t +3 (hung checkout, retry, labels) ALL PASS; plans/src/frt/refresh/org ALL PASS; sweep_qa clean; e2e + upg_t identical to LIVE |

Shift: the Stripe webhook needs **charge.dispute.created** as well as charge.refunded (Hunter's approval text includes both).
