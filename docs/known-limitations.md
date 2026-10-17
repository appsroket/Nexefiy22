# Known Limitations

Honest list of what does not exist or is unverified. Update every phase.

## As of Phase 1 (2026-10-17)

### Not implemented
- **No application code.** No Next.js app, UI, API routes, workers, or tests exist yet.
- **No database schema.** Supabase project `rnqrqconfbcrmszllxgu` has no tables or migrations.
- **No integrations.** No provider is connected or verified. All integrations are "coming soon".
- **No billing.** No Stripe account/products configured.

### Environment
- Docker is not installed on the dev machine → Supabase local stack cannot run (see ADR-010).
- GitHub CLI (`gh`) is not installed; git access to the private repo works through the existing Git credential manager.
- Git identity is configured for this repository only (repo-local `user.name` / `user.email`), not globally.
- Only the Supabase URL and publishable key are configured. Secret key, DB password, and all other provider credentials are pending.

### Unverified decisions
- TypeScript 7 compatibility with the Next.js 16 toolchain (ADR-002).
- Trigger.dev pricing/EU region (ADR-004).
- Embeddings provider (ADR-008).
- Pricing and plan quotas (billing doc placeholders).
- Final MVP integration list.

### Known external constraints
- Gmail restricted scopes require Google OAuth verification (and potentially a third-party security assessment) before non-test users can connect.
- Supabase default SMTP is rate-limited; custom SMTP required before launch.
- Legacy Supabase `anon`/`service_role` JWT keys are still enabled on the project.

## Integration verification log

| Integration | Contract tests | Live sandbox verified | Date | Notes |
|---|---|---|---|---|
| — | — | — | — | none yet |
