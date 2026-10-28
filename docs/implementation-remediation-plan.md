# Implementation Remediation Plan

**Date:** 2026-10-29. Follows [functional-reality-audit.md](functional-reality-audit.md).

The goal is to turn a well-tested but never-exercised codebase into a platform where AI employees do real, verified, supervised work.

**Principle:** prove the shared foundations live, once, before adding any employee-specific feature. Every employee runs on the same runtime, tools, vault, executor, engine and approvals. One verified end-to-end task proves the path for all of them, and one broken link blocks them all.

**Ground rules (from CLAUDE.md):**

- No step is "done" until it has been observed working. Record the evidence in docs/production-smoke-tests.md and docs/known-limitations.md.
- Migrations are new files only. They are applied to development first, with pgTAP, advisors and types regenerated.
- Never on Production without the owner's go-ahead: env vars, domains, migrations, deployments of migrations.
- No secret ever enters code, docs, prompts or logs.

## Order at a glance

| # | Work package | Kind | Depends on | Unblocks |
|---|---|---|---|---|
| WP-0 | Owner configuration and account hygiene | Owner, no code | — | Everything live |
| WP-1 | CI pipeline | Code | — | Safe change velocity |
| WP-2 | Production Supabase project | Owner + ops | WP-0 | Real customers |
| WP-3 | First live model call (playground, usage, drafting) | Verification | WP-0 | WP-6, WP-7 |
| WP-4 | Durable execution live (Trigger.dev) | Ops + verification | WP-0 | WP-6, WP-7 |
| WP-5 | First live connector (Slack, then HubSpot) | Owner + verification | WP-0 | WP-6 |
| WP-6 | First end-to-end employee task with a real tool | Verification | WP-3, WP-4, WP-5 | Claiming "AI employees work" |
| WP-7 | First live workflow run with an approval gate | Verification | WP-6 | Multi-employee work |
| WP-8 | Notifications (approvals, escalations, stops) | Code + migration | WP-0 (Resend) | Supervision at scale |
| WP-9 | Deliverable storage and generated files | Code + migration | WP-6 | File outputs |
| WP-10 | Observability and hardening (Sentry, shared rate limit, CSP) | Code | WP-1 | Production operations |
| WP-11 | Inbound webhooks and event triggers | Code + migration | WP-5, WP-4 | Event-driven work |
| WP-12 | Chat with an employee, and signed-in UX checks | Code | WP-3, WP-4 | Interactive use |
| WP-13 | More tools and connectors (Gmail, Calendar, web research) | Code | WP-6 | Department coverage |
| WP-14 | Billing and entitlements | Code + migration | WP-2 | Charging (on hold by the owner) |
| WP-15 | Signed-in end-to-end tests (Playwright) | Code | WP-1, WP-0 | Regression safety |

WP-1 and WP-10 can run in parallel with WP-0 to WP-5. WP-8 and WP-9 can start once WP-6 is green.

---

## WP-0 · Owner configuration and account hygiene

**Why first:** the audit's top blockers are settings, not code. No code change can make an AI employee run without them.

**Steps.** Owner actions; each needs the owner's explicit go-ahead. Never paste secrets into a chat.

1. Supabase Auth, URL configuration:
   - Site URL: `https://www.nexefiy.com`.
   - Redirect URLs: `https://www.nexefiy.com/**`, `http://localhost:3000/**` and the Preview pattern (docs/supabase-setup.md).
2. Supabase Auth: turn on leaked-password protection (the advisor reports it off; it may need a paid plan) and set custom SMTP through Resend.
3. Vercel, Production and Preview:
   - `CRON_SECRET` (a random value).
   - `ANTHROPIC_API_KEY`.
   - `INTEGRATION_ENCRYPTION_KEYS` and `INTEGRATION_ENCRYPTION_ACTIVE_KEY_ID` (generate with `npm run env:generate-key`).
   - `RESEND_API_KEY`, `EMAIL_FROM` and `CONTACT_FORM_TO`.
   - Replace the legacy `SUPABASE_SERVICE_ROLE_KEY` with `SUPABASE_SECRET_KEY` (`sb_secret_…`).
4. `.env.local` on the dev machine: the same set, using development values.
5. Get the legal pages reviewed before inviting users.

**Acceptance criteria:**

- `npm run env:check:connectivity -- --strict` passes for every configured feature.
- `/api/cron/governance` answers 401 without a header (no longer 503).
- A password-reset email arrives at a non-team address and returns to www.nexefiy.com.
- The advisor no longer lists leaked-password protection.

**Risks:** a cron secret set on Production makes the daily cron jobs start running for real, against the development database. That is acceptable while it holds no customer data. A wrong key shows up as `misconfigured` in `env:check`, never as a crash.

**Tests:** production smoke tests A3, C2 and C3, recorded in docs/production-smoke-tests.md.

## WP-1 · CI pipeline

**Scope:** GitHub Actions on every push and pull request:

- `npm ci`, typecheck, lint, Vitest, `next build`, `check:bundle`;
- `db:test:local` on a PostgreSQL 16 service with pgvector, pgTAP and plpython3u (the script is CI-ready);
- `npm audit --omit=dev` as a warning.

No secrets are needed: the build uses placeholder public values the way the tests do.

**Acceptance:** a red check blocks merging to `main`. pgTAP 001–015 and `tests/integration` pass in CI.

**Risks:** the cost of PostgreSQL extensions on the runner image. Pin the image.

**Tests:** CI itself.

## WP-2 · Production Supabase project

**Scope:**

- Create the production project in the same region.
- Promote the 24 migrations (`db push --dry-run`, then a real push after a backup).
- Run pgTAP against a staging branch, never Production.
- Switch Vercel Production's three Supabase variables.
- Keep the dev project for Preview and local work.

**Acceptance:** `migration list` matches; Production signs up a test account on the new project; the dev project no longer receives Production traffic.

**Migration risk:**

- None from schema changes; it is a fresh project.
- The one existing dev account and workspace (created 2026-10-25) stay in development.
- The owner must decide whether to recreate them. Never copy user data without authorization.

**Tests:** smoke tests A–D on Production; pgTAP on staging.

## WP-3 · First live model call

**Scope:** with `ANTHROPIC_API_KEY` set:

- draft an employee from a description;
- run a playground test;
- record usage;
- calibrate the model prices in `models/domain/catalog.ts` against the pricing page;
- confirm `output_config.effort` and the structured-output shape against the live API.

**Acceptance:**

- One `employee_test_runs` row with a real model id.
- A matching `usage_records` row, with its cost equal to tokens times the catalogue price.
- A refusal or failure shows a controlled state with no stack trace (smoke test E1, E5).
- One employee activated through test-gated activation.

**Risks:** spend. Set the workspace budget limit before running, and use Haiku for the first runs.

**Tests:**

- Keep the fake-SDK contract tests.
- Add an opt-in live test (`LIVE_MODEL_TESTS=1`, never in CI by default) that makes one tiny call and asserts the response shape the adapter relies on.

## WP-4 · Durable execution live

**Scope:**

- Create the Trigger.dev project and set `TRIGGER_SECRET_KEY` and `TRIGGER_PROJECT_REF`.
- Deploy `trigger/` (docs/credential-setup.md E5).
- Confirm the one-minute sweep and on-demand dispatch.
- Decide between a Vercel plan with frequent cron and relying on Trigger.dev's schedule. On Hobby, the cron is a daily backstop only, and the plan is non-commercial.

**Acceptance:**

- A task assigned in the UI is claimed by a Trigger.dev run within a minute.
- When the run is killed mid-step, a new attempt resumes from the checkpoint without repeating the tool call: the same `tool_executions` row and idempotency key (smoke test E4).
- Approval expiry and deadline timeouts happen without anyone opening a page.

**Risks:** two dispatchers (cron and engine) overlapping. Claims are lease-protected and covered by `tests/integration/durable-execution.test.ts`.

**Tests:** the existing integration tests plus a recorded live run.

## WP-5 · First live connector

**Scope:**

- Create a Slack app (smallest scopes: `channels:read`, `chat:write`) and register only the **built** redirect URL. `npm run env:check` now separates built from reserved URLs.
- Connect a test workspace; run the health check, `list_channels`, then `post_message` behind an approval.
- Then HubSpot (a developer test account): find, create and update a contact, add a note.
- Follow docs/integration-architecture.md §7, and fix any contract the live API contradicts.

**Acceptance:**

- `integrations.status = connected`.
- `integration_secrets` holds only `nxf1.` envelopes.
- The health check is healthy.
- A write needs an approval and runs exactly once after it.
- A disconnect revokes the token at the provider.
- The integrations page never shows "connected" for a revoked token.

**Risks:** provider responses differ from the documentation the contracts were written from. Rate limits are held below the published limits.

**Tests:** update the contract tests to recorded real responses (redacted); add an opt-in live smoke script.

## WP-6 · First end-to-end employee task with a real tool

This is the stop condition Phase 10 never met. Until it is met, nobody may claim that AI employees work.

**Scope:**

- Create an employee from the Team Updates or Sales Operations template, test it and activate it.
- Assign a bounded task that reads (Slack channels or HubSpot search), then writes (a message or note) behind an approval.
- Run it on Trigger.dev, approve it as an admin, and check that a viewer cannot approve.

**Acceptance:**

- The task ends `succeeded` only with verification `verified`, backed by `tool_executions` receipts.
- Evidence, trace and usage are visible on the task page.
- Analytics shows the task, the verified completion and an outcome record linked to the action.
- Smoke tests E2, E3 and D1 pass.

**Risks:** a model claiming work it didn't do. That is exactly what `verifyTaskResult` checks; keep it.

**Tests:** a recorded run in docs/production-smoke-tests.md, plus a Playwright flow once WP-15 exists.

## WP-7 · First live workflow run with an approval gate

**Scope:**

- Generate a two-employee workflow (or build it from a template) with an approval step and a tool action.
- Activate it as an admin, start it by hand and on a schedule, cancel one run.

**Acceptance:**

- Runs are pinned to a version.
- The gate appears in the approvals inbox.
- Rejection follows the rejected path.
- Cancellation withdraws pending work and discloses completed actions.
- A hand-off edge is refused when the `workflow.handoff` policy denies it.

**Tests:** `tests/integration/workflows.test.ts` in CI (WP-1) and a recorded live run.

## WP-8 · Notifications

**Scope:**

- A `notifications` table (organization-scoped, RLS, pgTAP isolation tests).
- In-app delivery in the header menu, which currently shows approvals only.
- Email through Resend for:
  - approval requests and expiry warnings;
  - escalations waiting on the requester;
  - emergency stops;
  - voided approvals.
- Per-user preferences.
- Delivery runs in the engine, not in requests.

**Acceptance:**

- An approval request emails the eligible approvers (and nobody else) within a minute.
- Emails contain no payload secrets (`redact`).
- Unsubscribe works.

**Migration risk:** new tables only. Low.

**Tests:** pgTAP for notification isolation; Vitest for recipient selection by role and the separate-approver rule.

## WP-9 · Deliverable storage and generated files

**Scope:**

- Design an ADR first: a `deliverables` table (task, version, kind, storage path, checksum, size) and a private `deliverables` storage bucket with organization-prefixed paths, like `knowledge`.
- Add a built-in tool, `create_document` (Markdown, CSV and later DOCX/PDF), that writes through the server, never directly by the model.
- Add download through signed URLs after a membership check.
- Handle retention and holds the way evidence does.

**Acceptance:**

- A task can produce a file.
- The file is listed on the task page and downloadable only by members of that workspace.
- Its checksum is recorded.
- Verification counts it as a receipt.

**Migration risk:** a new table and bucket with storage policies. Test cross-organization access in pgTAP.

**Tests:** pgTAP storage isolation; Vitest for generators; the tool is listed through `listEmployeeTools()` (the existing domain test must be updated).

## WP-10 · Observability and hardening

**Scope:**

- Sentry for server and client, with `redact` in `beforeSend`.
- A shared rate limiter in Postgres, reusing `consume_integration_rate_limit`'s pattern, to replace the in-memory one.
- A full Content-Security-Policy with nonces.
- Uptime checks on `/` and `/sign-in`.
- An `npm audit` triage.

**Acceptance:**

- A thrown test error reaches Sentry with no secrets or emails.
- The rate limit holds across two instances.
- The CSP gives no console violations on the main pages.

**Tests:** Vitest for `beforeSend` redaction; Playwright CSP check (WP-15).

## WP-11 · Inbound webhooks and event triggers

**Scope:**

- Add `/api/webhooks/slack` and `/api/webhooks/hubspot`. Verify signatures (Slack signing secret; HubSpot v3 signature) and check timestamps.
- Store payloads in `provider_webhook_events` (deduplication by event id, redacted bodies).
- Start workflows from events through a new trigger kind.
- Flip `built: true` in `src/lib/config/endpoints.ts` only in the change that ships each route; `tests/app/endpoints.test.ts` enforces this.

**Acceptance:** a bad signature gets 401 and is not stored; a replayed event is ignored; a matching event starts exactly one run.

**Migration risk:** an enum or check-constraint widening for the trigger kind. Use a new migration; never edit an applied one.

**Tests:** signature-failure tests (CLAUDE.md rule 10); pgTAP for the new trigger kind.

## WP-12 · Chat and signed-in UX checks

**Scope:**

- A conversation surface per employee that creates bounded tasks, not free-running sessions. Messages are persisted, and replies go through `runEmployee`.
- A signed-in walkthrough of every page with the dev account: workspaces, members, invitations, knowledge, employees, tasks, approvals, governance, analytics.

**Acceptance:**

- Chat messages persist across reloads.
- Every write a chat causes goes through the executor and approvals.
- The walkthrough has no console errors and no page that claims data it doesn't have.

**Tests:** Vitest for chat-to-task mapping; Playwright (WP-15).

## WP-13 · More tools and connectors

**Scope, in order of how many templates each unblocks:**

1. Gmail and Google Calendar: OAuth, read, draft-then-approve send, events. Then mark the Google callback `built`.
2. Web research (fetch and search, framed as untrusted).
3. A help desk.
4. A UI for workspace-defined skills, with their procedures added to prompts.

Each new action declares risk, category, approval, idempotency and scopes, and gets contract tests. Its capability flips to `built` only with tests (`domain/capabilities.ts` rule).

**Acceptance:** the matching templates move from "partly available" to "ready", with a live run each.

## WP-14 · Billing and entitlements (on hold)

**Scope (when the owner lifts the hold):**

- Stripe Checkout and the customer portal.
- `/api/webhooks/stripe` with signature checks and idempotent event handling.
- Subscription sync to `subscriptions`.
- Enforcing `plan_entitlements` (`employees.max`, monthly model budget) on the server.
- Prices on the website only once decided.

**Acceptance:** a test-mode subscription changes entitlements, and an over-limit create is refused on the server.

**Migration risk:** the tables exist. Changes need new migrations, and billing data must never be client-writable.

## WP-15 · Signed-in end-to-end tests

**Scope:**

- Playwright against a local build and Preview, using a seeded test account (credentials only from git-ignored env; never committed).
- Flows: sign-up and confirmation (with an email capture in local only), workspace isolation (C4), the viewer restrictions (C5), employee create and test, approval decisions, and every analytics number linking to its evidence.

**Acceptance:** runs in CI against a local stack (WP-1). Failures block merging.

---

## What not to do

- Don't add UI for capabilities whose foundations aren't proven live (WP-3 to WP-6).
- Don't mark any capability `built`, `WORKING_VERIFIED` or "available" from a unit test with a fake provider.
- Don't give employees direct messaging or task-creation tools. Hand-offs stay workflow edges checked against policy.
- Don't work around the missing durable engine with in-memory waits or long requests.
