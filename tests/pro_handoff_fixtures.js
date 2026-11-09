// Fictional test person (not a real customer). AI replies include planted fabrications so the truth guards are tested.
const RESUME=`Jordan Reyes
Warehouse Associate
Tampa, FL · (813) 555-0199 · jordan.reyes@example.com

Summary
Warehouse associate with 4 years of picking, packing and loading trucks for retail and grocery distribution.

Experience
Warehouse Associate | Gulf Coast Grocers, Tampa FL | 2022 – Present
- Picked and packed orders with an RF scanner
- Drove sit-down forklift to move pallets
- Did daily cycle counts for the frozen section
Stock Clerk | Bayside Hardware, Brandon FL | 2020 – 2022
- Unloaded trucks and stocked shelves
- Helped customers find parts

Skills & Certs
Forklift certified, RF scanner, pallet jack, inventory counts, OSHA 10

Education
High School Diploma — Plant High School, 2019
`;
const ORIG_SUMMARY='Warehouse associate with 4 years of picking, packing and loading trucks for retail and grocery distribution.';
const JD='Inventory Control Specialist — Sunrise Logistics, Lakeland FL. Duties: cycle counts, RF scanning, forklift operation, reconcile inventory discrepancies, WMS (Manhattan). OSHA 10 preferred, SAP a plus.';
const XRAY=`## AI MATCH ESTIMATE: 64/100 (vs this job posting)
## VERDICT: Close — tighten the inventory wording and you are in the running.
_This is an AI estimate vs this posting, not an official ATS score._

## ✅ KEYWORD HITS (4 found)
- Forklift
- RF scanner
- Cycle counts
- OSHA 10

## ❌ CRITICAL GAPS (3 missing)
- 🔴 MUST HAVE: Inventory reconciliation wording
- 🟡 SHOULD HAVE: Manhattan WMS
- 🟢 NICE TO HAVE: SAP

## 🔧 TOP 5 FIXES — do these before applying
1. Lead with cycle counts.

## 📝 REWRITTEN EXPERIENCE SECTION
### Warehouse Associate | Gulf Coast Grocers, Tampa FL | 2022 – Present
- Ran daily cycle counts for the frozen section using an RF scanner

## 📝 REWRITTEN SUMMARY
Warehouse associate with 4 years of daily cycle counts and RF scanning in grocery distribution.

## 🧰 SKILLS TO LIST
Cycle counts, RF scanning, Forklift operation, OSHA 10, SAP

## 📊 HIRING PROBABILITY
Fair.
`;
const UPG=`# Jordan Reyes
Inventory Control Specialist

## PROFESSIONAL SUMMARY
Warehouse associate with 4 years of inventory work, daily cycle counts and RF scanning in grocery distribution. Forklift certified and OSHA 10 trained. Cut shrink by 30% at Gulf Coast Grocers.

## EXPERIENCE
### Warehouse Associate | Gulf Coast Grocers, Tampa FL | 2022 – Present
- Ran daily cycle counts for the frozen section using an RF scanner
- Moved pallets by sit-down forklift
- Picked and packed orders accurately for 150 stores

### Inventory Control Specialist | Sunrise Logistics | 2024 – Present
- Reconciled inventory discrepancies in Manhattan WMS

### Stock Clerk | Bayside Hardware, Brandon FL | 2020 – 2022
- Unloaded trucks and stocked shelves daily
- Helped customers find the right parts

## SKILLS
Cycle counts, RF scanning, Forklift operation, Inventory counts, OSHA 10, SAP, Manhattan WMS, Pallet jack

## WHAT WE IMPROVED
- Rewrote your summary around inventory control and cycle counts
- Put cycle counts, RF scanning and forklift first in Skills
- Added SAP to your skills
`;
const CL='## Cover letter\nDear Hiring Manager,\nI run daily cycle counts.\n\n## Why me\nForklift certified.\n\n## Close\nThanks.';
const IV='## Questions\n1. Tell me about cycle counts.\n\n## Answers\nOK.\n\n## Tips\nBe on time.';
const STRIPE='<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><body style="font-family:-apple-system,Arial;padding:28px;background:#f6f9fc"><div style="max-width:420px;margin:auto;background:#fff;border-radius:12px;padding:24px;box-shadow:0 4px 20px rgba(0,0,0,.08)"><div style="background:#FEF3C7;color:#92400E;font-weight:700;font-size:12px;padding:4px 8px;border-radius:4px;display:inline-block">TEST MODE · mocked Stripe Checkout</div><h2 style="margin:14px 0 4px">YourFirstShift Pro</h2><div style="font-size:30px;font-weight:800">$9.00 <span style="font-size:15px;font-weight:500;color:#6b7280">per month</span></div><p style="color:#6b7280">Card 4242 4242 4242 4242 (test)</p><a id="pay" href="http://yfs.local/app.html?checkout=success&session_id=cs_test_123" style="display:block;text-align:center;background:#635BFF;color:#fff;padding:14px;border-radius:8px;font-weight:700;text-decoration:none">Subscribe (test)</a></div></body>';
const VAULT={active:'vJ',list:[{id:'vJ',name:'JordanReyesResume',text:RESUME,look:'Modern Professional',ts:1}]};
module.exports={RESUME,ORIG_SUMMARY,JD,XRAY,UPG,CL,IV,STRIPE,VAULT};
