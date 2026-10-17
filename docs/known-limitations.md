# Known Limitations

Honest list of what does not exist or is unverified. Update every phase.

## As of Phase 2 (2026-10-17)

### Implemented
- Environment configuration: validated env module with feature gating (`src/lib/env`), `.env.example`, `npm run env:check` (with read-only connectivity checks), credential encryption library (`src/lib/crypto`), log redaction (`src/lib/logging/redact.ts`). Covered by unit tests; the core Supabase connectivity check was run against the real project (HTTP 200).

### Not implemented
- **No Next.js application yet.** No UI, routes, middleware, Supabase clients, workers, or migrations. The env module is ready to be wired in during Phase 3.
- The endpoint paths in `src/lib/config/endpoints.ts` (OAuth callbacks, webhooks, cron) are **reserved, not implemented** — registering them with providers is pointless until the routes exist.
- No database schema; Supabase project `rnqrqconfbcrmszllxgu` has no tables or migrations.
- No integrations, no billing, no model adapter. `requireFeature('ai')` returning a config means only that the credentials are present and well-formed.
- The credential re-encryption job (rotation step 3) is designed, not built (Phase 7).

### Credentials
- Configured locally: Supabase URL and publishable key only.
- Not configured: `SUPABASE_SECRET_KEY`, DB password, and every optional provider.
- Connectivity checks for Anthropic, Resend, Stripe, and the Supabase secret key are implemented but **untested against real credentials** (none are configured). Only their failure handling is covered indirectly.
- Google, Slack, HubSpot, Trigger.dev, and Sentry credentials are format-checked only; they're verified by real OAuth connections / CLI runs in later phases.
- OAuth scopes in the setup guide are the planned minimum and must be re-checked against provider docs when each adapter is built (HubSpot notes scope in particular).

### Environment
- Docker is not installed on the dev machine → Supabase local stack cannot run (ADR-010).
- GitHub CLI (`gh`) is not installed; git access works through the Git credential manager.
- Git identity is configured for this repository only (repo-local `user.name` / `user.email`), not globally.
- `npm install` warns that `esbuild`'s install script is not approved under npm's script policy. Vitest and tsx work without it; approve with `npm install-scripts approve esbuild` if a future tool needs it.

### Unverified decisions
- TypeScript 7 with Next.js 16 and ESLint (verified only with `tsc` and Vitest so far — ADR-002).
- Trigger.dev pricing/EU region (ADR-004).
- Embeddings provider (ADR-008).
- Pricing and plan quotas.
- Final MVP integration list.

### Known external constraints
- Gmail read scopes are **restricted**: Google OAuth verification plus a third-party security assessment is required before non-test users can connect.
- Slack requires HTTPS redirect URLs and event endpoints → local development needs a tunnel.
- Supabase default SMTP is rate-limited; custom SMTP (Resend) required before launch.
- Legacy Supabase `anon`/`service_role` JWT keys are still enabled on the project.

## Integration verification log

| Integration | Contract tests | Live sandbox verified | Date | Notes |
|---|---|---|---|---|
| — | — | — | — | none yet |
