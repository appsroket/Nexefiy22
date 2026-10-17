# Environment Variables

Template: [`.env.example`](../.env.example). Local values: `.env.local` (git-ignored). Validated at startup by `src/lib/env.ts` (Phase 2) — the app refuses to boot with missing required server variables in production.

## Rules

- Only variables in the **public** list below may use the `NEXT_PUBLIC_` prefix. Anything prefixed `NEXT_PUBLIC_` is inlined into the browser bundle.
- Server code reads secrets via `serverEnv` from a module that imports `server-only`.
- CI runs a bundle scan that fails if any known secret prefix (`sb_secret_`, `sk_live_`, `sk_test_`, `whsec_`, `tr_`, `sk-ant-`) appears in `.next/static`.

## Reference

| Variable | Exposure | Required from | Description |
|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | public | Phase 2 | Supabase API URL. Set. |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | public | Phase 2 | Supabase publishable key (`sb_publishable_…`). Set. |
| `SUPABASE_SECRET_KEY` | server | Phase 2 | Supabase secret key (`sb_secret_…`); bypasses RLS; used only by the org-scoped service client. |
| `SUPABASE_DB_PASSWORD` | CLI only | Phase 2 | For `supabase db push`/`link`. Not read by the app. |
| `NEXT_PUBLIC_APP_URL` | public | Phase 2 | Base URL for redirects and emails. |
| `ANTHROPIC_API_KEY` | server | Phase 4 | Default model provider. |
| `OPENAI_API_KEY` | server | optional | Alternate provider / embeddings if selected. |
| `TRIGGER_SECRET_KEY` | server | Phase 7 | Trigger.dev environment secret key. |
| `TRIGGER_PROJECT_REF` | server | Phase 7 | Trigger.dev project reference. |
| `INTEGRATION_ENCRYPTION_KEY` | server | Phase 6 (conditional) | Envelope encryption key if any credential is stored outside Vault. |
| `GOOGLE_OAUTH_CLIENT_ID` / `_SECRET` | server | Phase 6 | Gmail + Calendar OAuth. |
| `SLACK_CLIENT_ID` / `_SECRET` / `SLACK_SIGNING_SECRET` | server | Phase 6 | Slack OAuth + request verification. |
| `HUBSPOT_CLIENT_ID` / `_SECRET` | server | Phase 6 | HubSpot OAuth. |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | public | Phase 10 | Stripe.js. |
| `STRIPE_SECRET_KEY` | server | Phase 10 | Stripe API. |
| `STRIPE_WEBHOOK_SECRET` | server | Phase 10 | Webhook signature verification. |
| `SENTRY_DSN` | public-ish | optional | Error reporting. |

## Per-environment placement

| Environment | Where values live |
|---|---|
| Local | `.env.local` |
| Vercel preview / production | Vercel project → Environment Variables (scoped per environment) |
| Trigger.dev workers | Trigger.dev project → Environment Variables (synced from Vercel or set manually) |
| CI | GitHub Actions secrets (test/sandbox values only) |
