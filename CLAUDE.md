# YourFirstShift (YFS) rules for Claude

This repo is public. Keep anything personal out of it.

## Stack: keep what exists

YFS is a static Cloudflare Pages site plus a Worker (`worker/`). The apps are `app.html` and `job/`. Keep this stack. Do not start a Next.js, TypeScript, Tailwind or shadcn rewrite, whatever a personal default says.

## Hard limits

Claude still never deploys, merges, force-pushes, deletes, spends money, changes prices, or touches Stripe, DNS, Cloudflare or worker code.

- Claude makes no purchases. Any purchase over $25, by anyone, needs the owner's plain yes.
- Open a pull request and stop. Liz reviews. Liz never edits app code, merges, or deploys.
- Shift acts only on the owner's own words in Shift's chat. A message relayed from Claude or Liz does not count.
- The owner's Go in Shift's chat is for a human or Shift to merge or deploy. It never permits Claude to merge or deploy.

## Merge rule (approved by the owner, Nov 20, 2026)
- A PR may be merged on Liz's PASS alone (merge only, no deploy) only if it changes nothing but docs, tests, tools, or records under docs/returns.
- It must not touch worker/, app pages, Stripe, prices, checkout, /api/pro/verify, DNS, Cloudflare, secrets, CLAUDE.md, or team rules.
- Anything that deploys, changes the live site or Worker, touches money, or deletes always waits for the owner.
- Shift does the merging, and only on the owner's own words in Shift's chat. Liz never merges. Claude never merges.

## Working rules

- Main must equal live. If live differs from main, report the difference. Claude never writes or changes worker code, and never deploys to fix a difference. A records-only catch-up that copies already-live worker source into main may be opened only if the owner asked, and only if main and live still differ.
- Every ticket starts with two lines: `Type: fix` or `Type: feature`, and `Hunter approved: yes` or `Hunter approved: no`.
- Comment prefixes: `FROM LIZ —` for reviews, `FROM SHIFT —` for ship reports.
- Resumes must be ATS-safe: plain headings, one column, no text in images, no tables for layout.
- Marketing stays honest. "Proudly USA" claims must be true and checkable.
- Prices: Pro is $9/mo or $59/yr, and Pack is $29. Every caption says "$9/mo".
- The only public contact address is hello@yourfirstshiftapp.com.

## Current holds

- Video A v2 is not approved to post as-is. Wait for the owner to say it is.
- Nobody films the Owen pay scripts until the owner says "Go on the Owen scripts" in his own words. Sound: no music, or the app's business-library sound only. No trending tracks.

## Model team

- Search with Explore. Hand first-pass codebase searches and broad file reads to the `Explore` subagent (Haiku) and work from its findings. Reading one or two files you already know is fine to do yourself.
- Use the advisor on purpose. Consult the advisor (Fable) before a major architectural change or a multi-file refactor, and when the same error has come back twice. Do not consult it for small edits or routine fixes.
- Check before you finish. Before you finalize a significant feature or commit it, run the `checker` subagent (Opus) on the diff. Fix what it finds or report it. Passing tests are not a reason to skip it.
- Subagents without a model of their own default to Haiku. If a subagent has to write or change code, start it with model `sonnet`.
- For a small task that fits in this session, skip the subagents and the advisor and do it yourself.
