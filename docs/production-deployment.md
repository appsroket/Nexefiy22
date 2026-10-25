# Production Deployment (Vercel)

How Nexefiy is built and deployed on Vercel, what is configured today, and what must happen before the first production release. Inspected on 2026-10-19; every "current state" line below was read from Vercel or the repository that day, and anything not verified says so.

Related: [environment-variables.md](environment-variables.md) · [supabase-setup.md](supabase-setup.md) · [production-smoke-tests.md](production-smoke-tests.md) · [rollback-procedure.md](rollback-procedure.md) · [credential-setup.md](credential-setup.md)

## 1. Current state (2026-10-19, production and domain rows updated 2026-10-25)

| Item | Value | How it was checked |
|---|---|---|
| Vercel account | Personal account `leadsmatic` (`team_PyfHTCPKbtnyxf8D9N9IzQGl`), **Hobby plan**, no teams | Vercel connector (`get_auth_user`, `list_teams`) |
| Vercel project | `nexefiy` (`prj_mUPspdMYa8sGXkQj0I0IKRGMEwYc`) | `list_projects`, `get_project` |
| Git | `appsroket/Nexefiy` (GitHub) connected; every push builds a Preview | deployment list: 9 branch deployments, all `READY` |
| Framework / Node | Next.js preset; Node `24.x` (project setting; `package.json` `engines` now pins `24.x` too) | `get_project` |
| Root directory | Repository root (the only `package.json`); builds from it succeed | Preview builds `READY` |
| Install / build | `npm ci` from `package-lock.json` (auto-detected) / `next build` (default) | No overrides needed |
| Production branch | `main`; Vercel's `nexefiy-git-main-…` alias shows `main` is tracked | project domains |
| Latest Preview | `nexefiy-rhoqki916-leadsmatic.vercel.app` for `4a58a63` (PR #4 branch), `READY`, signed-out smoke tests pass (2026-10-25) | `list_deployments`, browser |
| Production | **Live at `https://www.nexefiy.com`** (custom domain, 2026-10-25), `main` @ `da01194` (violet restyle); signed-out smoke tests pass there. First live on 2026-10-25 at `nexefiy.vercel.app` from `bf34723` (PR #4 fast-forwarded into `main`). Earlier attempt from `main` @ `e6072c9` (Phase 6) failed (`ERROR`). Uses the **development** Supabase project (owner's decision, for now). | GitHub commit statuses from Vercel, curl, browser |
| Domains | **`www.nexefiy.com`** serves Production; `nexefiy.com` redirects (308) to it. Added by the owner in Vercel on 2026-10-25 (not read from Vercel here). `nexefiy.vercel.app` now returns 404 `DEPLOYMENT_NOT_FOUND`; `nexefiy-leadsmatic.vercel.app` (410) and `nexefiy-git-main-leadsmatic.vercel.app` (404) don't serve the app either | curl, 2026-10-25 |
| Deployment protection | Vercel Authentication, "all except custom domains"; no password protection; no trusted IPs | `get_project` |
| Environment variables | `NEXT_PUBLIC_APP_URL` (config, Production only, added 2026-10-25 as `https://nexefiy.vercel.app`; the live sitemap and `robots.txt` now use `https://www.nexefiy.com`, so it points at the custom domain, value not read); plus 3 of type `sensitive`, targets Production + Preview: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SERVICE_ROLE_KEY`. None for Development. Values were not read. | `filter_project_envs` (decrypt off) |
| Supabase | One project, `rnqrqconfbcrmszllxgu` — the **development** database (ADR-010). No production project exists. | [supabase-setup.md](supabase-setup.md) |

**Why the production attempt failed (probable).** The Vercel connector is refused (`403`) for deployment details and build logs on this account, so the log was not read. A local build with `VERCEL_ENV=production` and no `NEXT_PUBLIC_APP_URL` fails the same way on purpose — `EnvValidationError: NEXT_PUBLIC_APP_URL is required in production` while prerendering `/_not-found` — and that variable is not set in Vercel. Set it for Production (§4) and the build gets past that check; confirm in the Vercel build log.

**Preview smoke test (2026-10-20, `8b08b2b`, opened in a browser signed in to Vercel; the connector still gets `403` on deployment details):** the public website, `robots.txt`, `sitemap.xml` and `/invite` return 200, unknown paths 404, and all four cron routes 503 (no `CRON_SECRET`) — but **`/sign-in`, `/sign-up`, `/forgot-password` and `/app` returned 500**. Vercel's runtime log: `PublicEnvError: … NEXT_PUBLIC_APP_URL is missing`, thrown in the proxy. `src/lib/env/public.ts` treated every `NODE_ENV=production` build as Production, so Previews without `NEXT_PUBLIC_APP_URL` broke every session route, although the server side defaults Previews to `https://$VERCEL_URL`. **Fixed in `4a58a63`: the public parser now takes the environment from Vercel's `NEXT_PUBLIC_VERCEL_ENV` and defaults Previews to `https://$NEXT_PUBLIC_VERCEL_URL`, like the server. Re-tested on Preview `nexefiy-rhoqki916-leadsmatic.vercel.app` (`4a58a63`, 2026-10-25): every signed-out check passes (account pages 200, `/app` → `/sign-in`, security headers, cron 503, no console or runtime errors, phone width usable). Results: [production-smoke-tests.md](production-smoke-tests.md#results).

## 2. Production blockers (decide before the first release)

1. **Production database.** Vercel's Production and Preview environments currently share the Supabase values, which (if they hold the only project's keys) point at the development database. ADR-010 and [supabase-setup.md](supabase-setup.md#staging-and-production-safe-rollout) require a separate production project. Create it, apply all 24 migrations there with the reviewed workflow, and set Production-only Supabase variables.
2. **Vercel plan.** The project is on Hobby, which Vercel limits to non-commercial use, cron jobs at most once a day (±59 min), and Vercel Authentication covering preview URLs only on the account's own login. A paying-customer SaaS needs Pro (or another plan you choose). `vercel.json` is written to deploy on Hobby (daily schedules); tighten the schedules on Pro (§5).
3. ~~`NEXT_PUBLIC_APP_URL` for Production~~ — set 2026-10-25.
4. ~~Merge PR #4 into `main`~~ — fast-forwarded 2026-10-25 (`bf34723`).
5. **Supabase Auth URLs** for `https://www.nexefiy.com` and the preview hosts (§6) — otherwise confirmation and password-reset links fall back to the Site URL.
6. **No billing exists.** There is no Stripe code, checkout, webhook route or entitlement enforcement (`docs/billing-and-entitlements.md` is a design). The billing phase is on hold until the core product works end to end. Do not set Stripe variables expecting anything to happen.
7. **Nothing has been verified live**: no real sign-in, model call, HubSpot/Slack call, Trigger.dev job, or workflow run ([known-limitations.md](known-limitations.md)). A production release before that is a release of unverified behaviour.
8. **No error monitoring.** `SENTRY_DSN` is in the catalog, but no Sentry SDK is installed or wired. Vercel runtime logs are the only signal (§8).

## 3. Repository configuration

| File | Purpose |
|---|---|
| `next.config.ts` | `poweredByHeader: false`, React strict mode, Cache Components off (ADR-018), security headers on every path: `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Content-Security-Policy: frame-ancestors 'none'`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy` (camera, microphone, geolocation, payment off). HSTS comes from Vercel. A full CSP is not configured yet. |
| `vercel.json` | Cron schedules only (§5). Nothing else is overridden; the Next.js preset does the rest. |
| `package.json` | `engines.node: 24.x` — the version the code is verified on. `npm ci` uses the committed `package-lock.json`. |
| `src/proxy.ts` | Session refresh and redirects for `/app` and account pages only, so the public website stays static. |
| `trigger.config.ts`, `trigger/` | Trigger.dev v4 jobs (deployed to Trigger.dev, not Vercel). |

`tests/app/deployment-config.test.ts` checks the headers, that every cron path exists and requires `CRON_SECRET` with a constant-time compare, that schedules run at most daily, and the Node pin.

## 4. Environment variables per Vercel environment

Add values in **Vercel → Project `nexefiy` → Settings → Environment Variables**, choosing the environments per row. Mark secrets **Sensitive**. Never paste values into chat, issues, commits or docs. Full reference: [environment-variables.md](environment-variables.md); where to obtain each value: [credential-setup.md](credential-setup.md).

| Variable | Production | Preview | Development (`vercel env pull`) | Notes |
|---|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | production project | dev project | dev project | Set today for Production + Preview (same value) — split once a production project exists |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | production project | dev project | dev project | as above |
| `SUPABASE_SECRET_KEY` | production `sb_secret_…` | dev `sb_secret_…` | — (use `.env.local`) | Replace `SUPABASE_SERVICE_ROLE_KEY` (legacy JWT, set today; the app accepts it with a warning) |
| `NEXT_PUBLIC_APP_URL` | **required** — `https://www.nexefiy.com` | leave unset (defaults to `https://$VERCEL_URL`) | `http://localhost:3000` | Missing in Production → build fails |
| `CRON_SECRET` | ≥ 32 random chars | optional (Vercel Cron only calls Production) | — | Cron routes return 503 while unset |
| `INTEGRATION_ENCRYPTION_KEYS`, `INTEGRATION_ENCRYPTION_ACTIVE_KEY_ID` | own keyring | separate keyring | separate | Back up; losing it loses every stored integration token |
| `ANTHROPIC_API_KEY` (+ `AI_PROVIDER` optional) | when enabling AI employees | test key or unset | — | Unset = AI features show "not configured" |
| `VOYAGE_API_KEY` | when enabling knowledge search | optional | — | Unset = sources wait unindexed |
| `RESEND_API_KEY`, `EMAIL_FROM`, `CONTACT_FORM_TO` | when enabling email | optional | — | Supabase Auth email uses Supabase's SMTP settings, not these |
| `HUBSPOT_*`, `SLACK_*` | separate OAuth apps per environment where the provider allows | dev apps | — | Follow docs/integration-architecture.md §7 first |
| `TRIGGER_SECRET_KEY`, `TRIGGER_PROJECT_REF` | Trigger.dev **prod** environment key | Trigger.dev **staging/dev** key | — | Without them tasks run inline after the request |
| `STRIPE_*` | — | — | — | Billing is not built; leave unset |
| `SENTRY_DSN` | — | — | — | Not wired in code; leave unset |

Validation: the app refuses to build or start with missing/invalid core variables or a secret in a `NEXT_PUBLIC_*` variable; every other feature is disabled independently when its variables are missing ([environment-variables.md](environment-variables.md#validation-behaviour)). A variable being set proves nothing about the service — use `npm run env:check:connectivity` locally against the same values, then the smoke tests.

## 5. Scheduled jobs

`vercel.json` schedules the four cron routes once a day (UTC; Hobby fires within the hour). Vercel Cron only calls **Production** and sends `Authorization: Bearer $CRON_SECRET`; each route compares it in constant time, returns 401 on mismatch and 503 while `CRON_SECRET` or `SUPABASE_SECRET_KEY` is unset.

| Route | Schedule now | Recommended on Pro | What it does |
|---|---|---|---|
| `/api/cron/knowledge` | `0 2 * * *` | every 5 min | Picks up queued/retrying knowledge sources the after-response nudge missed |
| `/api/cron/integrations` | `0 3 * * *` | every 5 min | Runs approved actions not yet run, connection health checks, purges OAuth states |
| `/api/cron/governance` | `0 4 * * *` | daily | Evidence retention per workspace policy (never touches `audit_logs`) |
| `/api/cron/tasks` | `0 5 * * *` | every 5 min without Trigger.dev; optional with it | With Trigger.dev: enqueues a dispatch. Without: runs up to 3 due tasks/runs inline |

Long-running AI work does not depend on these: with Trigger.dev configured, `trigger/employee-tasks.ts` sweeps every minute and each task runs in its own job with Postgres as the record (ADR-026). Without Trigger.dev, work runs after the triggering response (within the function's 300 s `maxDuration`), resumes from checkpoints on a later run, and the daily cron is only a backstop — **on Hobby without Trigger.dev, a task interrupted mid-step may wait up to a day.** Deploy the Trigger.dev project (credential-setup.md E5) before relying on tasks or workflows.

Manual run (production, after `CRON_SECRET` is set) — the header value comes from your password manager, never typed into a shared terminal history:

```bash
vercel crons run /api/cron/governance
```

## 6. Supabase for each environment

1. **Auth → URL Configuration** of each Supabase project:
   - Site URL: the environment's `NEXT_PUBLIC_APP_URL` (production: the production domain).
   - Redirect URLs: `https://<production host>/**`; for the dev project also `http://localhost:3000/**` and `https://nexefiy-*-leadsmatic.vercel.app/**` (Preview).
   - The app sends users to `/auth/callback` (PKCE: sign-in links, password reset) and `/auth/confirm` (token-hash email links).
2. Email confirmations on (invitations require a confirmed email); custom SMTP before real users (credential-setup.md C).
3. Storage bucket `knowledge` is private and created by migration `knowledge_pipeline` with per-organization policies (pgTAP 006).
4. Migrations: [supabase-setup.md](supabase-setup.md#staging-and-production-safe-rollout). Never `db reset` a remote project.

These dashboard settings could not be read from here (no connector tool exposes Auth configuration); check them by hand.

## 7. Release workflow

1. Work on a branch → push → Vercel builds a Preview automatically (Git integration; no custom pipeline).
2. Before merging: `npm run typecheck`, `npm run lint`, `npm test`, `npm run build`, `npm run check:bundle`; `npm run db:test:local` when migrations changed. **There is no CI** — these run by hand until a GitHub Actions workflow exists; branch protection on `main` (required review, and required checks once CI exists) is a GitHub setting to turn on.
3. Open the Preview (signed in to Vercel) and run the Preview part of [production-smoke-tests.md](production-smoke-tests.md).
4. Migrations: apply to production **before** merging code that needs them; keep each migration backward-compatible with the code currently in production (expand → migrate → contract).
5. Merge to `main` → Vercel builds Production. Confirm `READY`, then run the production smoke tests and read runtime logs.
6. Something wrong → [rollback-procedure.md](rollback-procedure.md).

## 8. Monitoring and logs

- **Configured:** Vercel build logs and runtime logs (Dashboard → Project → Logs). Server code logs through `redact()`; keys, tokens, auth headers and raw webhook payloads are never logged.
- **Missing:** error alerting (Sentry or Vercel's log drains/alerts), uptime checks, Trigger.dev alerting (no project yet), Supabase log alerts.
- Supabase backups: depend on the production project's plan (daily backups on paid plans; point-in-time recovery is an add-on). Confirm before storing customer data.

## 9. Custom domain

**`www.nexefiy.com`** (added by the owner on 2026-10-25; `nexefiy.com` redirects to it). The live sitemap shows `NEXT_PUBLIC_APP_URL` follows it. Still to do for this host: Supabase Site URL and Redirect URLs (§6), and every OAuth app's redirect URI (`https://www.nexefiy.com/api/integrations/<provider>/callback`) once HubSpot/Slack apps exist. Custom domains are exempt from Vercel Authentication under the current protection setting.

To change domains later: Vercel → Project → Settings → Domains → Add, create the DNS records Vercel shows (an `A` record for an apex domain or a `CNAME` to Vercel's target for a subdomain), wait for "Valid Configuration", then update `NEXT_PUBLIC_APP_URL`, Supabase URLs and OAuth redirect URIs, and redeploy.
