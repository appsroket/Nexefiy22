# API Credentials

What each external credential is, where to get it, where it may be used, and which phase needs it. **Values never go in this file** — put them in `.env.local` (local) and Vercel / Trigger.dev environment settings (deployed).

Legend — **Exposure:** `public` = may be shipped to browsers; `server` = server/worker only.

| Provider | Credential | Env var | Exposure | Obtain from | Needed by |
|---|---|---|---|---|---|
| Supabase | Project URL | `NEXT_PUBLIC_SUPABASE_URL` | public | Dashboard → Project Settings → API | Phase 2 ✅ configured |
| Supabase | Publishable key | `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | public | Dashboard → API Keys | Phase 2 ✅ configured |
| Supabase | Secret key | `SUPABASE_SECRET_KEY` | server | Dashboard → API Keys → create secret key | Phase 2 |
| Supabase | Database password | `SUPABASE_DB_PASSWORD` | server (CLI only) | Dashboard → Database settings | Phase 2 (migrations via CLI) |
| Supabase | Personal access token | — (CLI `supabase login`) | developer machine | Account → Access tokens | Phase 2 |
| Anthropic | API key | `ANTHROPIC_API_KEY` | server | console.anthropic.com | Phase 4 |
| OpenAI (optional) | API key (embeddings fallback / alt provider) | `OPENAI_API_KEY` | server | platform.openai.com | Phase 3/4, only if chosen in ADR-008 |
| Trigger.dev | Secret key per environment | `TRIGGER_SECRET_KEY` | server | Trigger.dev dashboard → API keys | Phase 7 |
| Trigger.dev | Project ref | `TRIGGER_PROJECT_REF` | server | Trigger.dev project settings | Phase 7 |
| Google Cloud | OAuth client id/secret (Gmail, Calendar) | `GOOGLE_OAUTH_CLIENT_ID`, `GOOGLE_OAUTH_CLIENT_SECRET` | server | Google Cloud Console → APIs & Services → Credentials | Phase 6 |
| Slack | App client id/secret, signing secret | `SLACK_CLIENT_ID`, `SLACK_CLIENT_SECRET`, `SLACK_SIGNING_SECRET` | server | api.slack.com/apps | Phase 6 |
| HubSpot | Public app client id/secret | `HUBSPOT_CLIENT_ID`, `HUBSPOT_CLIENT_SECRET` | server | HubSpot developer account | Phase 6 |
| Stripe | Publishable key | `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | public | Stripe Dashboard → Developers → API keys | Phase 10 |
| Stripe | Secret key (restricted key preferred) | `STRIPE_SECRET_KEY` | server | Stripe Dashboard | Phase 10 |
| Stripe | Webhook signing secret | `STRIPE_WEBHOOK_SECRET` | server | Stripe Dashboard → Webhooks / Stripe CLI | Phase 10 |
| Nexefiy | Integration encryption key | `INTEGRATION_ENCRYPTION_KEY` | server | Generate: `openssl rand -base64 32` | Phase 6 (only if a value is stored outside Vault) |
| Sentry (optional) | DSN | `SENTRY_DSN` | public-ish | sentry.io | Phase 12 |
| Telephony (post-MVP) | e.g. Twilio account SID/auth token | TBD | server | Provider console | Voice phase |

## Handling rules

1. Use **test/sandbox** credentials for development (Stripe test mode, Google test users, HubSpot developer test account, Slack dev workspace).
2. Store per-organization OAuth tokens in **Supabase Vault**, referenced by `integration_connections.vault_secret_id`. Never in plain columns, logs, task events, or model prompts.
3. Rotate a credential immediately if it is pasted into a chat, commit, issue, or log. Supabase keys can be rotated independently under the new key system.
4. Prefer restricted/limited-scope keys (Stripe restricted keys, minimal OAuth scopes).
5. Each deployed environment (preview, production) gets its own credentials.
