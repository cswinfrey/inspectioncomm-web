# TODO

Deferred decisions from the Week 9-10 polish pass — not urgent, but worth
revisiting. Both require taking on a new cost or dependency, so they were
deliberately left for an explicit decision rather than done silently.

## Rate limiting (brute-force protection)

Currently: a honeypot field deters basic bots on the public email signup
form, and Supabase Auth throttles login attempts at the platform level.
Neither is real, configurable rate limiting.

Not protected against: repeated login attempts against a specific account,
or scraping/brute-forcing `/report/<token>` links (low risk today — tokens
are random UUIDs with 122 bits of entropy — but there's no throttle backing
that up).

**Why not done:** Vercel's serverless functions are stateless between
invocations, so in-memory rate limiting doesn't actually work reliably.
Real rate limiting needs an external store — the standard choice in the
Vercel ecosystem is [Upstash Redis](https://upstash.com/) with
`@upstash/ratelimit`. That's a new third-party service (new account, new
API keys to store in Key Vault, and its free tier is generous but it's
still a new dependency), which is why it wasn't added unprompted.

**If revisited:** decide whether Upstash (or an alternative) is worth
adding, then rate-limit at minimum: `/inspector/login` (POST), the coming-
soon signup form, and `/report/[token]` (GET).

## Geo-redundant storage for inspection media

Currently: `inspectioncommstorage` is Standard_LRS (locally redundant —
replicated within one Azure region only). Soft-delete/versioning (added in
the Week 9-10 pass) protects against accidental delete/overwrite, but not
against a regional Azure outage or data-center-level disaster.

**Why not done:** Upgrading to Standard_GRS (geo-redundant, replicates to a
paired region) roughly doubles blob storage cost. Pure cost-vs-risk
tradeoff — not a decision to make unilaterally.

**If revisited:** `az storage account update --sku Standard_GRS --name
inspectioncommstorage --resource-group inspectioncomm-rg` (no app code
changes needed either way).
