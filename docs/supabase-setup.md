# Supabase Setup

## Project

| Item | Value |
|---|---|
| Project name | Nexefiy |
| Project ref | `rnqrqconfbcrmszllxgu` |
| API URL | `https://rnqrqconfbcrmszllxgu.supabase.co` |
| Region | eu-north-1 (Stockholm) |
| Postgres | 17 |
| State at Phase 1 (verified 2026-10-17) | Healthy; no tables in `public`; no migrations; extensions installed: `pgcrypto`, `uuid-ossp`, `pg_stat_statements`, `supabase_vault`, `plpgsql` |

## API keys

Supabase now issues two key types; Nexefiy uses the **new** ones.

| Key | Format | Where used | Notes |
|---|---|---|---|
| Publishable key | `sb_publishable_…` | Browser + server (`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`) | Safe to expose; all access governed by RLS. Configured in `.env.local`. |
| Secret key | `sb_secret_…` | Server/worker only (`SUPABASE_SECRET_KEY`) | Bypasses RLS. Needed from Phase 3. Create in Dashboard → Project Settings → API Keys. Never `NEXT_PUBLIC_`. |
| Legacy `anon` / `service_role` JWT keys | `eyJ…` | Not used | Still enabled on the project. Plan: disable legacy keys once the app runs entirely on new keys (Phase 3 exit). |

## Clients (implemented in Phase 3)

| Client | File | Key | Use |
|---|---|---|---|
| Browser | `src/lib/supabase/client.ts` | publishable | Client components (auth UI, realtime). |
| Server (user) | `src/lib/supabase/server.ts` | publishable + auth cookies via `@supabase/ssr` | Server components, actions, route handlers. RLS applies. |
| Middleware/proxy | `src/lib/supabase/middleware.ts` | publishable | Session refresh. |
| Service (org-scoped) | `src/lib/supabase/service.ts` | secret, `server-only` | Workers, webhooks, billing. Wrapped to require `organizationId`. |

## Auth configuration (Dashboard → Authentication)

To configure in Phase 3:
- Site URL: `http://localhost:3000` for dev; production domain later.
- Redirect URLs: `http://localhost:3000/**`, Vercel preview pattern, production URL. The app's callback route is `/auth/callback` (`src/lib/config/endpoints.ts`).
- Email confirmations: on. Custom SMTP via Resend before launch (Supabase default SMTP is rate-limited) — settings in [credential-setup.md](credential-setup.md#c-email-resend).
- Minimum password length 10; leaked-password protection on (if available on plan).
- MFA (TOTP) enabled for P1.

## Storage

Bucket `knowledge` (private). Object path convention: `<organization_id>/<document_id>/<filename>`. Storage policies check `private.is_org_member((storage.foldername(name))[1]::uuid)`.

## Migrations workflow

No Docker on the dev machine, so the local Supabase stack is not used. Workflow:

```bash
npx supabase login
npx supabase link --project-ref rnqrqconfbcrmszllxgu
npx supabase migration new <name>
npx supabase db push            # applies to the linked project
npx supabase gen types typescript --project-id rnqrqconfbcrmszllxgu > src/lib/supabase/database.types.ts
```

Recommended before production data exists: create a separate **dev** Supabase project or use **Supabase branching** for previews, and treat `rnqrqconfbcrmszllxgu` as production once launched. Decision recorded as open in ADR-010.

After every DDL migration: run Supabase **security and performance advisors** and fix any "RLS disabled" or "function search_path mutable" findings before the phase is considered done.
