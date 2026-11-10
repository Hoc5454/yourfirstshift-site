# Worker sec-fixes v4 (on top of v3 abec8df6). NOT deployed
- worker/worker.js sha256 0585e89d4990358d29089a587dea31d01d174e54c786e6432f7249ae39f21dc9, 176601 B. Base: claude/resume-worker 7ef2b159 (worker.js there == live e40f1e45, sha256 16adbc29…).
- Liz must-fix (v3 FAIL): /api/pro/restore, /api/pro/status and /api/pro/refresh go back to the exact live limiter, `rateLimit(request)`: 20/h per IP, Cache API, the shared `rl:<ip>` key, and the old 429 body `{"error":"Rate limit"}` with Retry-After 3600. Those three handlers are now byte-identical to live. So are verify, checkout, rateLimit, the price/plan constants, the Stripe webhooks, and sign/verifyProToken (region-compare by AST + sha256).
- The new limiter (`yfsRateLimit`: Pro/org token 120/h, free IP+device 60/h with a 300/h per-IP ceiling, free IP-only 60/h, D1 counter with a 1.5 s timeout) now runs ONLY on the AI route (POST / and /api/claude).
- Why status/refresh also moved back: there was no concrete reason to change them. Live parity keeps Pro restore/refresh flows exactly as tested. Known live behaviour, unchanged: a school/office NAT shares one 20/h bucket across verify/checkout/restore/status/refresh.
- Tests: node worker/test/sec_fixes_t.mjs → 72 checks. New checks:
  - restore caps at 20/h per IP; a rotating/forged X-YFS-Dev or a valid Pro token does not raise it;
  - restore/status/refresh/verify share the live bucket;
  - a file read with no device id works and is counted in the IP-only bucket;
  - the exact /api/claude 410 JSON body, content-type and CORS.
  - The existing org 51, plans 29 and resume 24 suites still pass. Run against v3 code, the v4 suite fails 11 checks (the restore/status/refresh ones), as expected.

## Notes for the PR body (should-fix, Hunter's call)
1. **Fails open by design.** If D1 errors or takes over 1.5 s, the AI-route limiter lets the request through, so a D1 outage means no per-hour cap on AI calls. **Set an Anthropic spend cap/alert (console → Limits) before any deploy.** That is the backstop for cost.
2. **Per-IP limits are beatable.** An IPv6 user can rotate through a /64 (billions of addresses), and anyone can rotate proxies or VPN exits. In testing, the box's own fresh connections arrived from 36 different IPs in 64 requests. The X-YFS-Dev device id is client-chosen; the 300/h per-IP ceiling limits rotation of it but not of IPs. Real protection against a determined abuser = spend cap + monitoring (+ optionally keying IPv6 on its /64, or Turnstile on free runs).
3. **main's worker/ is behind live.** main worker/worker.js sha256 d203d8a7… ≠ live e40f1e45 16adbc29… (live == claude/resume-worker 7ef2b159). Merge order matters; this PR is based on resume-worker, not main. Note only; main not changed.
4. Not deployed. Live stays e40f1e45 @100%; previews_enabled stays off.
