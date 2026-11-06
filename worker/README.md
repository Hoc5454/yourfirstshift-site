# yourfirstshift Worker source

Import of the live Cloudflare Worker script `yourfirstshift`. This directory is source only. Do not deploy it, and do not treat `wrangler.toml` as deploy-ready.

## Provenance

Checked read-only on 2026-11-06. Live script `yourfirstshift`, `modified_on` 2026-11-01T16:02:45.269063Z.

`worker.js` opens with a provenance comment. The executable source under that comment is the live script body, byte for byte. The banner is the block comment and the newline after `*/`. The bytes after that newline are the live body:

- Length: 145945
- sha256: `953fa624d3dbbb1ba68c1674f434803d761566da222a0742ba3409507b17d4d8`

A read-only `content/v2` download of `yourfirstshift` on 2026-11-06 produced the same script-part length and sha256. The uploaded file, banner included, is 146409 bytes, sha256 `3b5e595eceefa9af5de961f8cd47130c561056c6ba15f9c1637a80de2724f469`.

No org, seat, or `src` metadata behavior was changed.

## Config that was verified

`wrangler.toml` records the script name and the non-secret bindings confirmed live:

- `compatibility_date` is `2026-07-15`. Live `compatibility_flags` is empty. The prep attachment said `2024-11-01`; that date is not what is running, so it was not kept.
- KV binding `YFS_KV`, id `e2b480fa2ccc43018f562ee82856e79c`, namespace title `YFS_KV`.
- D1 binding `DB`, id `13fe808c-270f-4960-a56c-c7b6003ef982`, database name `yourfirstshift-db`. The prep attachment set `database_name` to `DB`, which is the binding name, not the database name.

The script is an ES module (`export default`) and `main` is `worker.js`.

## Left out on purpose

These live settings are not in `wrangler.toml`. A deploy from this file would not reproduce production:

- Plain-text `APP_URL`. The value is omitted.
- Secret bindings, listed by name only: `ANTHROPIC_API_KEY`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI`, `PRO_SIGNING_SECRET`, `STRIPE_RK`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`.
- Route `yourfirstshiftapp.com/*`.
- `workers.dev` subdomain is enabled on the live script, and preview URLs are disabled.
- `usage_model` is `standard`. `logpush` is false. There are no cron schedules.
- Workers Logs and traces are not turned on here. The live script has `logpush` false and no tail consumers, and this import does not change that.

`ENFORCE_FREE_LIMIT` is an optional env read in the source. It is not a live secret binding.

There is no Workers Builds configuration, trigger, or deploy hook on `yourfirstshift`. Do not run `wrangler deploy` or `wrangler secret put`.

## Secrets

This import contains no `.env`, `.env.example`, or `.dev.vars` file. `.gitignore` blocks `.dev.vars` and variants, every `.env` file, `.wrangler/`, `node_modules/`, and private-key material.

The executable source references secret bindings through `env.*` and contains one Stripe Price id. It does not contain Stripe secret keys, webhook signing secrets, or API key literals.
