# Worker sec-fix preview abec8df6 (NOT deployed)
- Cloudflare version: abec8df6-202f-423b-bdda-7dd58924c82c (#63), uploaded non-deployed; live stays e40f1e45 at 100%.
- Preview URL: https://abec8df6-yourfirstshift.culpepperhunter.workers.dev
- Base: worker/worker.js on claude/resume-worker 7ef2b159 == live e40f1e45 source (sha256 16adbc291a2a207cbd34a283617c283e8922a95046212537696e656448dba80a), so this commit's diff is exactly the change.
- This worker.js = byte-for-byte the uploaded version source: sha256 a916326d681e3e323abf9309a98008639bb83c1565eca093d173d4a89e431f20, 176288 B.
- What: v2 + verify/checkout byte-identical to live, IP+device free key (300/h IP ceiling), 429 JSON, 1.5 s D1 timeout fail-open, HMAC IP keys, /api/claude retired (410)
- Tests: node worker/test/sec_fixes_t.mjs (+ existing org/plans/resume suites), all mocked, no network.
- No secrets: bindings/secrets live only in Cloudflare; test values are fakes.
