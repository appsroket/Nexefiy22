# Production Smoke Tests

A checklist to run against a Preview first and then Production after each release. Only features that exist are listed; unbuilt ones are named at the end so nobody marks them as passed. Record each run in the table at the bottom (date, deployment URL, commit, result) — a test counts only when someone actually ran it.

Rules: use a test workspace and test data; no real customer messages, CRM writes, calls or payments. On Preview, nothing is migrated or seeded. Deployment URLs are behind Vercel Authentication — sign in to Vercel in the browser first.

## A. Platform

| # | Check | Expected |
|---|---|---|
| A1 | Deployment state in Vercel | `READY`; build log has no `EnvValidationError` |
| A2 | `curl -sI https://<host>/` | `200`; headers include `x-content-type-options: nosniff`, `x-frame-options: DENY`, `referrer-policy`, `permissions-policy`, `strict-transport-security`; no `x-powered-by` |
| A3 | `curl -s -o /dev/null -w "%{http_code}" https://<host>/api/cron/governance` | `503` while `CRON_SECRET` is unset, `401` once set (no header sent) — never `200` |
| A4 | Runtime logs after the checks | No unhandled errors; no keys, tokens, emails or auth headers in log lines |

## B. Public website

| # | Check | Expected |
|---|---|---|
| B1 | `/`, `/pricing`, `/integrations`, `/use-cases`, `/security`, `/getting-started`, `/contact`, `/legal/*` | Load; navigation and calls to action resolve (`tests/app/site-content.test.ts` checks links at build time) |
| B2 | Same pages at 375 px width | Usable, no horizontal scroll |
| B3 | Browser console | No errors |
| B4 | `/robots.txt`, `/sitemap.xml` | Use `NEXT_PUBLIC_APP_URL` as host |

## C. Authentication and tenancy (needs Supabase Auth URLs configured)

| # | Check | Expected |
|---|---|---|
| C1 | Signed out, open `/app` | Redirect to `/sign-in` |
| C2 | Sign up with a test address | Confirmation email arrives; link lands on `/auth/callback` or `/auth/confirm` on **this** host and signs in |
| C3 | Sign out, sign in, password reset | Each works; reset link returns to this host |
| C4 | Create workspace A (user 1) and workspace B (user 2) | Each user sees only their own workspace; pasting an id from A into a B URL shows not-found |
| C5 | Invite user 2 to A as viewer | Viewer cannot change settings, policies or members (buttons absent; server refuses) |

Database-level isolation is covered by pgTAP 001–015 (run against the dev project 2026-10-19); C4–C5 confirm the deployed app wires it correctly.

## D. Core application

| # | Check | Expected |
|---|---|---|
| D1 | `/app` dashboard, `/app/analytics` | Load with empty states for a new workspace; numbers link to evidence; no invented figures |
| D2 | Create an employee from a template and from a description | Saved as draft; without `ANTHROPIC_API_KEY` the description path uses labelled keyword rules |
| D3 | `/app/integrations` | HubSpot/Slack show "not configured" until their variables are set — never "connected" |
| D4 | Create, validate and save a workflow draft | Validation errors shown for an incomplete graph; draft saves |
| D5 | `/app/tasks`, `/app/approvals`, `/app/settings/audit` | Load; empty states for a new workspace; audit page admin-only |
| D6 | Upload a small Markdown file to Knowledge | Source queued; without `SUPABASE_SECRET_KEY`/`VOYAGE_API_KEY` it stays queued with a clear status |

## E. AI and integrations (only after the matching credentials are set)

| # | Check | Expected |
|---|---|---|
| E1 | Playground test run on a draft employee | Model answers; usage recorded; test runs never perform writes |
| E2 | Activate and assign a bounded task with a read-only tool | Task reaches `succeeded` only with a verified `tool_executions` record |
| E3 | Task with an external write | Pauses for approval; viewer cannot approve; admin approval runs it once |
| E4 | Close the browser mid-task | Task continues (Trigger.dev job or next dispatch) and its state is persisted |
| E5 | Remove the model key from a Preview and run a task | Controlled "not configured"/failed state, retry available, no stack trace shown |

## Not built — do not mark as passed

Billing (Stripe checkout, subscriptions, webhooks, entitlements), chat, notifications, voice, Gmail/Calendar, inbound webhooks, error monitoring (Sentry), CI.

## Results

| Date | Environment | URL | Commit | Ran by | Result |
|---|---|---|---|---|---|
| 2026-10-19 | local `next build` | — | working tree on `8b08b2b` | Claude Code | Build, typecheck, lint, 684 Vitest tests, bundle scan pass. |
| 2026-10-20 | Preview | `nexefiy-e2ecihphx-leadsmatic.vercel.app` | `8b08b2b` | Claude Code (browser signed in to Vercel) | A3 pass (cron 503). B1 pass (13 public pages 200, unknown path 404). A2 partly: HSTS present, other security headers absent (they're added after this commit). **C1 fail: `/sign-in`, `/sign-up`, `/forgot-password`, `/app` → 500** (`PublicEnvError`, `NEXT_PUBLIC_APP_URL` missing on Preview). B2–B4, C2–E not run (C2+ need an account; not created). |
| 2026-10-25 | local build with Preview variables, no app URL | `localhost` | working tree (fix) | Claude Code | `/sign-in`, `/sign-up`, `/forgot-password` 200; `/app` → `/sign-in`; security headers present; sign-in page renders with no console errors. 686 Vitest tests, typecheck, lint, bundle scan pass. Needs a new Preview to confirm on Vercel. |
| 2026-10-25 | Preview | `nexefiy-rhoqki916-leadsmatic.vercel.app` | `4a58a63` | Claude Code (browser signed in to Vercel) | **A1** `READY`. **A2** pass: nosniff, `DENY`, `frame-ancestors 'none'`, referrer and permissions policies, HSTS; no `x-powered-by`. **A3** pass: 4 cron routes 503, wrong token 503. **A4** pass: no error-level runtime logs for the deployment. **B1** pass: 13 public pages 200, unknown path 404. **B2** pass: `/` at 375 px, no horizontal scroll. **B3** pass: no console errors on `/`, `/pricing`, `/sign-up`. **B4** pass: sitemap uses the preview host; `robots.txt` disallows everything outside production. **C1** pass: `/sign-in`, `/sign-up`, `/forgot-password`, `/invite` 200; `/app` → `/sign-in`; `/app/employees` → `/sign-in?next=…`; `/reset-password` without a session → `/forgot-password?expired=1`. C2–E not run (need an account; none created). |
| 2026-10-25 | **Production** | `nexefiy.vercel.app` | `bf34723` (`main`) | Claude Code (signed out, plus browser) | **A1** `READY` (first successful production deployment). **A2** pass: all security headers and HSTS on `/sign-in`. **A3** pass: 4 cron routes 503, wrong token 503. **A4** pass: no error-level runtime logs. **B1** pass: 13 public pages and all 8 sitemap URLs 200, unknown path 404. **B2** pass: `/`, `/sign-in` at 375 px, no horizontal scroll. **B3** pass: no console errors on `/`, `/pricing`, `/sign-in`, `/sign-up`. **B4** pass: `robots.txt` and sitemap use `https://nexefiy.vercel.app`. **C1** pass: account pages 200, `/app` → `/sign-in`, `/reset-password` → `/forgot-password?expired=1`. Production is public (no Vercel Authentication). C2–E not run (no account; Supabase Auth URLs for this host not confirmed). The aliases `nexefiy-leadsmatic.vercel.app` (410) and `nexefiy-git-main-leadsmatic.vercel.app` (404) don't serve the app; use `nexefiy.vercel.app`. |
