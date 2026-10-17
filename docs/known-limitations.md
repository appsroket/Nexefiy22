# Known Limitations

Honest list of what does not exist or is unverified. Update every phase.

## As of Phase 3 (2026-10-17)

### Implemented and verified
- **Environment configuration** (Phase 2): validated env module with feature gating, `.env.example`, `npm run env:check`, credential encryption library, log redaction. Covered by Vitest.
- **Database** (Phase 3): 12 migrations applied to the development project `rnqrqconfbcrmszllxgu` (verified via migration history; local files byte-identical to what was applied). 33 tables, RLS and explicit grants on all of them, 5 RPCs.
- **Database security tests**: 173 pgTAP assertions in `supabase/tests/database/`, all passing against the development project on 2026-10-17. They ran through the Supabase MCP connector, with each file wrapped so its TAP output came back in an error message and its transaction was always rolled back. They have **not** been run with `supabase test db` (CLI login and DB password not configured, no Docker). After the runs, the database held no test data (0 users, 0 organizations, 0 audit rows).
- Supabase advisors: no ERROR findings. Accepted findings are listed in database-design.md §6 and §8.
- Generated TypeScript types and a typed admin client (`src/lib/supabase/admin.ts`, not yet called by any route).

### Not implemented
- **No Next.js application yet.** No UI, routes, middleware, user-session Supabase clients, or workers.
- Endpoint paths in `src/lib/config/endpoints.ts` are reserved, not implemented.
- No Storage bucket or storage policies yet (knowledge phase).
- No integrations, billing, model adapter, or embedding client. `requireFeature()` returning a config means only that credentials are present and well-formed.
- No scheduled jobs: approval expiry happens only when someone tries to decide, and retention purges (`execution_events`, webhook events, audit logs after 365 days) are not scheduled.
- Credential re-encryption job (key rotation step 3) is designed, not built.
- No CI pipeline yet; `npm test` and pgTAP are run manually.

### Credentials
- Configured locally: Supabase URL and publishable key only.
- Not configured: `SUPABASE_SECRET_KEY`, DB password / CLI login, and every optional provider (Anthropic, Voyage, Resend, Stripe, Google, Slack, HubSpot, Trigger.dev, Sentry, cron secret, encryption keyring).
- Connectivity checks for Anthropic, Resend, Stripe, and the Supabase secret key are untested against real credentials.
- OAuth scopes in the setup guide are the planned minimum and must be re-checked against provider docs when each adapter is built.

### Environment
- Docker is not installed on the dev machine → no local Supabase stack (ADR-010: the current project is the development database).
- GitHub CLI (`gh`) is not installed; git access works through the Git credential manager.
- Git identity is configured for this repository only.
- `npm install` warns that `esbuild`'s install script is not approved under npm's script policy; Vitest and tsx work without it.

### Unverified decisions
- TypeScript 7 with Next.js 16 and ESLint (verified only with `tsc` and Vitest).
- Trigger.dev pricing/EU region (ADR-004).
- Pricing and plan quotas (plans seeded with `NULL` prices).
- Final MVP integration list.

### Known external constraints
- Gmail read scopes are **restricted**: Google OAuth verification plus a third-party security assessment is required before non-test users can connect.
- Slack requires HTTPS redirect URLs and event endpoints → local development needs a tunnel.
- Supabase default SMTP is rate-limited; custom SMTP (Resend) required before launch. Invitation acceptance requires confirmed emails.
- Legacy Supabase `anon`/`service_role` JWT keys are still enabled on the project.
- The development project is also the only project: create staging and production projects before real customer data exists.

## Integration verification log

| Integration | Contract tests | Live sandbox verified | Date | Notes |
|---|---|---|---|---|
| — | — | — | — | none yet |
