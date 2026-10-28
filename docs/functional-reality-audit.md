# Functional Reality Audit

**Date:** 2026-10-29 · **Commit audited:** `6673c03` (`main` and `ccr-3d2f7a33-fp6zyi`) plus the small fixes listed in §6 · **Auditor:** Claude Code

This audit records what Nexefiy actually does today, and what it only shows, plans or simulates. It was written from the code, the database and the live site, not from earlier reports. Every "verified" below names the evidence. The remediation plan is in [implementation-remediation-plan.md](implementation-remediation-plan.md).

## 1. How this audit was done

| Source | What was checked |
|---|---|
| Code | Every route (`src/app`), Server Action, cron route, Trigger.dev job, module (`src/modules/*`), the env catalog and `scripts/`. A repository-wide search for `TODO`, `FIXME`, `mock`, `fake`, `stub`, `simulat`, `placeholder`, `coming soon`, `not implemented`, `hardcod` and `dummy` in `src/` and `trigger/`. |
| Development database (`rnqrqconfbcrmszllxgu`), read-only | Applied migrations, row counts per core table, RLS on every public table, the Supabase security advisor. |
| Live site | `https://www.nexefiy.com`: signed-out smoke tests on 2026-10-25 (docs/production-smoke-tests.md). Not repeated today: no deployable code changed until this audit's fixes. |
| Local runs | `npm run typecheck`, `npm run lint`, `npx vitest run` and `npm run env:check`. Results are in §7. |

No credentials were added, no environment variables were changed, nothing was written to the database, and no destructive operation was run.

### Status definitions (used consistently below)

| Status | Meaning |
|---|---|
| **WORKING_VERIFIED** | Observed working in a real environment (the live site, the dev Supabase project, or a real database), with the evidence named. |
| **IMPLEMENTED_UNVERIFIED** | Code is complete and tested with fakes, mocks or a local stand-in database, but it has never run end to end against real services. |
| **PARTIALLY_IMPLEMENTED** | Some of the feature works. A named part is missing or only approximated. |
| **MOCK_OR_PLACEHOLDER** | It shows example data or text, or simulates behaviour, instead of doing the work. |
| **MISSING** | No implementation, or only reserved names, tables or documents. |
| **BLOCKED_BY_CONFIGURATION** | The code exists, but it cannot run on any deployment because credentials or settings are absent. |

> A page that opens is not proof that its feature works. A model response is not proof that an external action happened. A unit test with a fake provider proves our side of a contract, not the provider's.

## 2. Headline findings

1. **Nothing an AI employee does has ever run for real.** No model key is configured anywhere (`ANTHROPIC_API_KEY` unset), so no model call has ever been made. The dev database has **0 AI employees, 0 tasks, 0 tool executions, 0 integrations, 0 workflow runs and 0 usage records** (read 2026-10-29). Every AI feature is at best IMPLEMENTED_UNVERIFIED or BLOCKED_BY_CONFIGURATION.
2. **The code is not fake.** The search found no mocked tool results, invented metrics, fake connection statuses or success claims without a check in application code. Mocks and fakes live only in `tests/`. Pages that lack a credential say so ("Nothing is simulated", "not configured"). The only example-data screen is the development component gallery, which returns 404 in production.
3. **Every background path is switched off in production.** `CRON_SECRET` is not set on Vercel, so all four cron routes answer 503 (verified live). Trigger.dev is not configured either. The service-role key *is* set there, as the legacy `SUPABASE_SERVICE_ROLE_KEY`, which the app accepts with a warning. So even with a model key, queued tasks, approved actions, knowledge processing and workflow runs would only advance through the after-response nudge (`after()`) in the request that queued them. Anything cut off there would wait for a cron run that never comes.
4. **Real things that work:**
   - The public website and the deployment.
   - Sign-up with email confirmation, sign-in, and workspace creation. **One account was created, confirmed and signed in on 2026-10-25, and it created a workspace.** The dev database holds that user (`email_confirmed_at` set, `last_sign_in_at` set), the organization, its owner membership, `company_settings`, the default policy, and 4 audit rows written by triggers. The host used was not recorded.
   - The database security model: 24 migrations applied, RLS on all 42 public tables, and pgTAP 001–015 passing on the dev project.
5. **Missing shared foundations:**
   - Notifications: nobody is told about an approval, an escalation or a stop.
   - Deliverable storage: employees produce text reports only, with no generated files.
   - Inbound webhooks and event triggers.
   - Chat.
   - Billing and entitlement enforcement.
   - Error monitoring.
   - CI.
   - Signed-in end-to-end tests.
6. **Two documents were wrong, and the audit corrected them:**
   - The overview page and onboarding checklist called employees, integrations and analytics "not available yet", although they are built (fixed).
   - `npm run env:check` and docs/credential-setup.md told operators to register five provider URLs that have no route and answer 404 (fixed).
   - Still open: docs/supabase-setup.md expects leaked-password protection to be on, but the security advisor reports it **disabled**. This is a dashboard setting for the owner.

## 3. Capability audit

Columns:

- **FE:** frontend.
- **BE:** backend.
- **DB:** database persistence.
- **Ext:** external services the feature needs.
- **Exec:** actual execution status (one of the six statuses).
- **Proof:** the tests that prove it.
- **Missing:** credentials or configuration not yet set.

The remediation codes (WP-n) refer to the remediation plan.

### 3.1 Platform, identity and tenancy

| Feature | FE | BE | DB | Ext | Exec | Proof | Missing | Risks | Remediation |
|---|---|---|---|---|---|---|---|---|---|
| Public website (`src/app/(site)`) | Done | Static pages; contact Server Action | — | Vercel | **WORKING_VERIFIED** (www.nexefiy.com, 2026-10-25: 200s, sitemap, 375 px, headers) | `tests/app/site-content.test.ts` | — | Legal pages are unreviewed drafts (noindex, labelled) | WP-0 legal review before launch |
| Contact form | Disabled with an explanation | `contact-service.ts` → Resend | — | Resend | **BLOCKED_BY_CONFIGURATION** | Vitest with a fake fetch | `RESEND_API_KEY`, `EMAIL_FROM`, `CONTACT_FORM_TO` | In-memory rate limit | WP-0, WP-9 |
| Sign-up, email confirmation, sign-in | Done | `identity/server/auth-actions.ts`, `/auth/callback`, `/auth/confirm` | `auth.users`, `profiles` | Supabase Auth | **WORKING_VERIFIED** (one confirmed account signed in, 2026-10-25, dev DB rows) | Vitest (fake client), pgTAP 005 | Custom SMTP: Supabase's built-in mailer only reaches project team members | Supabase Auth URLs for www not confirmed; leaked-password protection **off** | WP-0 |
| Password reset and change, sign-out everywhere | Done | Same | — | Supabase Auth | **IMPLEMENTED_UNVERIFIED** | Vitest | Same as above | PKCE links only work in the requesting browser | WP-0, WP-12 |
| Workspaces (create, switch, settings, delete) | Done | `workspace-actions.ts`, `create_organization()` | `organizations`, `organization_members`, `company_settings` | Supabase | Create: **WORKING_VERIFIED** (2026-10-25 rows plus 4 audit rows). Switch and delete: **IMPLEMENTED_UNVERIFIED** | pgTAP 002, 003, 005 | — | Delete is immediate and cascading | WP-12 |
| Members, roles, invitations | Done | `member-actions.ts`, `invitation-actions.ts`, `create/get/accept_invitation()` | `organization_invitations` (token hash only) | Resend (optional) | **IMPLEMENTED_UNVERIFIED** (0 invitations in the DB) | pgTAP 003, 005; Vitest | `RESEND_API_KEY` (otherwise the link is shown once to the inviter) | — | WP-12 |
| Onboarding checklist | Done (fixed in this audit) | Derived from real rows | — | — | **IMPLEMENTED_UNVERIFIED** | `tests/app/identity-domain.test.ts` | — | Before the fix, it said employees and integrations were "not available yet" | Done (§6) |
| Tenant isolation and RLS | — | `private.member_org_ids()` and related helpers | 42 tables, all with RLS | Supabase | **WORKING_VERIFIED** (pgTAP 001–015 on the dev project 2026-10-19; RLS count re-read 2026-10-29) | pgTAP 001–015 | — | 33 SECURITY DEFINER RPCs callable by `authenticated` (intentional, documented in database-design.md §6, each checks the role inside) | Keep pgTAP in CI (WP-1) |
| Environment validation | `env:check` | `src/lib/env/*` | — | — | **WORKING_VERIFIED** (production build fails without the app URL; `env:check` output today) | `tests/env/*` | — | — | — |
| Security headers, cron auth | — | `next.config.ts`, cron `authorized()` | — | Vercel | **WORKING_VERIFIED** (live, 2026-10-25) | Smoke tests A2, A3 | — | CSP only has `frame-ancestors` | WP-10 |
| Form and search rate limiting | — | `src/lib/request.ts` (in memory) | — | — | **PARTIALLY_IMPLEMENTED** (per server instance only) | Vitest | — | Doesn't hold across Vercel instances | WP-10 |

### 3.2 AI employees

| Feature | FE | BE | DB | Ext | Exec | Proof | Missing | Risks | Remediation |
|---|---|---|---|---|---|---|---|---|---|
| Employee creation from a template | Done | `employees/server/actions.ts`, `domain/templates.ts` (13 templates) | `ai_employees`, `employee_versions` | — | **IMPLEMENTED_UNVERIFIED** (0 employees in the DB) | `tests/employees/templates.test.ts`, pgTAP 008, 012 | — | — | WP-3 |
| Employee creation from a description | Done | `drafting.ts`: model with structured output; without a key, labelled keyword rules (`rule-drafter.ts`) | Same | Anthropic | Model path: **BLOCKED_BY_CONFIGURATION**. Keyword path: **IMPLEMENTED_UNVERIFIED** (crude by design, labelled) | Vitest with a mocked gateway | `ANTHROPIC_API_KEY` | — | WP-0, WP-3 |
| Editor, versions, lifecycle (draft → testing → active → paused → archived) | Done | `change_employee_status()` | `employee_versions` (immutable) | — | **IMPLEMENTED_UNVERIFIED** | pgTAP 008; Vitest | — | — | WP-3 |
| Test playground | Refuses to run without a key ("Nothing is simulated") | `playground.ts`, `test-invoker.ts` (reads run; writes are described, never performed) | `employee_test_runs`, `usage_records` | Anthropic | **BLOCKED_BY_CONFIGURATION** | Vitest with a fake SDK | `ANTHROPIC_API_KEY` | A passing test proves the decision, not the provider's answer to a write | WP-3 |
| Test-gated activation | Done | SQL requires passing tests on the latest version | — | — | **IMPLEMENTED_UNVERIFIED** (no test can run without a model) | pgTAP 008 | Model | — | WP-3 |
| Skills catalogue (44, 30 available) | Done | Prompt procedures added to the system prompt | `skills` (seeded) | — | **IMPLEMENTED_UNVERIFIED**. Skills shape prompts only; they are not enforced | Fingerprint tests, pgTAP 012 | — | Workspace-defined skills: in the DB, no UI, not added to prompts | WP-13 |
| Category coverage (sales, support, marketing, ops, EA, finance, HR, research, analytics) | Gallery shows availability | `domain/capabilities.ts` | — | Various | **PARTIALLY_IMPLEMENTED**. Abilities are limited to knowledge search, 4 HubSpot contact/note actions and 2 Slack actions. Email, calendar, help desk, web research, accounting, HR and publishing are **MISSING** | `tests/employees/templates.test.ts` ties claims to the tool catalogue | Integrations | Users may expect department work the tools can't do; the gallery states the limits | WP-13 |
| Voice employees | Template shown as unusable | — | — | Twilio (designed) | **MISSING** (docs/voice-employees.md only) | — | Everything | — | Later |

### 3.3 Shared execution foundations

| Feature | FE | BE | DB | Ext | Exec | Proof | Missing | Risks | Remediation |
|---|---|---|---|---|---|---|---|---|---|
| Model-provider abstraction | — | `models/server/gateway.ts`, `anthropic.ts` (official SDK; no temperature, no forced tool choice, effort, refusal handling) | — | Anthropic | **BLOCKED_BY_CONFIGURATION**. **Zero model calls ever made** | `tests/employees/*` with a fake SDK client | `ANTHROPIC_API_KEY` | Prices in `models/domain/catalog.ts` are unconfirmed list prices; OpenAI only shows a warning | WP-0, WP-3 |
| Agent runtime (`runEmployee`) | Task pages | `employees/server/runtime.ts`: turns, tool calls, checkpoints, limits, escalation, cancellation | `task_attempts.checkpoint`, `execution_events` | Model | **IMPLEMENTED_UNVERIFIED**: in memory only (scripted model, real executor, fake HubSpot) | `tests/tasks/*`; `tests/integration/durable-execution.test.ts` (local PostgreSQL only) | Model | Verification of claims is a wording heuristic plus receipts | WP-3, WP-6 |
| Tool registry | Editor tool picker | `employees/server/tools.ts`, `integrations/server/catalog.ts`: integration actions and knowledge search, nothing else | `employee_tool_permissions` | — | **IMPLEMENTED_UNVERIFIED** (7 tools exist) | `tests/employees/domain.test.ts` checks that no other tool can be offered | — | — | WP-13 |
| Credential vault | — | `integrations/server/credentials.ts` (AES-256-GCM `nxf1.` envelopes, leased refresh) | `integration_secrets` (service role only) | — | **BLOCKED_BY_CONFIGURATION** (no encryption keyring set on any deployment) | `tests/crypto/*`, pgTAP 004, 007 | `INTEGRATION_ENCRYPTION_KEYS`, `INTEGRATION_ENCRYPTION_ACTIVE_KEY_ID` | Key rotation re-encryption job not built | WP-0, WP-5 |
| Integration executor (permission enforcement for actions) | Test console, approvals | `integrations/server/executor.ts`: roles, schemas, scopes, policy, payload-bound approval, idempotency, retries, rate limits | `tool_executions`, `approval_requests` | Providers | **IMPLEMENTED_UNVERIFIED** (0 tool executions in the DB) | Contract tests; `tests/integration/governance.test.ts` (local PostgreSQL) | Provider apps, encryption keyring | A non-idempotent call cut off mid-flight ends as "outcome unknown" (by design) | WP-5 |
| Governance (risk tiers, policies, approvals, emergency stop, handoff, revocation, retention) | Done (`/app/settings/governance`, `/app/approvals`) | `governance/*`; enforced in SQL triggers and claim filters | `organization_policies` (+ versions), `approval_requests`, `organization_governance` | — | DB layer **WORKING_VERIFIED** (pgTAP 013 and 015 on the dev project). App flow **IMPLEMENTED_UNVERIFIED** (no approval request has ever existed) | pgTAP 013, 015; integration tests (local) | — | Policy conditions (amounts, recipients, time windows) not evaluated | WP-7, WP-8 |
| Human approvals: notification | Inbox and header count only | — | — | Email | **MISSING** (nobody is notified) | — | Resend | Approvals expire unseen | WP-8 |
| Durable task execution | Task Center | `tasks/server/runner.ts` (leases, checkpoints, 3 attempts, failure classes), `dispatch.ts`, `engine.ts`; `trigger/employee-tasks.ts` | `tasks`, `task_attempts` | Trigger.dev | Trigger.dev: **BLOCKED_BY_CONFIGURATION** (no project; no job ever ran). Inline fallback: **PARTIALLY_IMPLEMENTED** in production (`after()` nudges can run with the service-role key; the cron backstop answers 503) | `tests/integration/durable-execution.test.ts` (local), job tests with the SDK mocked | `TRIGGER_SECRET_KEY`, `TRIGGER_PROJECT_REF`, `CRON_SECRET` | Hobby cron is daily, so a stalled task can wait about a day | WP-0, WP-4 |
| Retry and failure recovery | Retry button | Attempts in Postgres; resume from checkpoint; idempotency keys `task:<id>:<call>` | `task_attempts` | — | **IMPLEMENTED_UNVERIFIED** (local PostgreSQL: worker death recovered, no action repeated) | `tests/integration/durable-execution.test.ts` | Same as above | — | WP-4 |
| Workflow builder | React Flow canvas, forms, JSON | `workflows/server/*`, validation in two passes | `workflow_definitions`, `workflow_versions` | Model (generation) | **IMPLEMENTED_UNVERIFIED**. Generation: **BLOCKED_BY_CONFIGURATION** (keyword fallback labelled) | pgTAP 011; `tests/workflows/*`; editor checked in Chromium against stubbed actions | Model | — | WP-7 |
| Workflow execution (orchestrator) | Run pages | `orchestrator.ts` (leases, branches, joins, delays, retries, gates, limits) | `workflow_runs`, `workflow_run_steps` | Trigger.dev | **IMPLEMENTED_UNVERIFIED** (0 runs; local PostgreSQL only) | `tests/integration/workflows.test.ts` (local) | As durable execution | — | WP-7 |
| Workflow triggers: schedule | Done | `start_scheduled_workflow_run` | `workflow_triggers` | Cron/engine | **BLOCKED_BY_CONFIGURATION** (needs a running dispatcher) | pgTAP 011 | Same | — | WP-4 |
| Workflow triggers: events and webhooks | — | — | `provider_webhook_events` table only | Slack/HubSpot | **MISSING** | — | — | Website lists it as "first release" | WP-11 |
| Employee-to-employee communication | — | By design only through workflow edges checked against `workflow.handoff` policy; employees have no delegation tool | — | — | Hand-off: **IMPLEMENTED_UNVERIFIED**. Direct messaging between employees: **MISSING** (deliberately) | `tests/workflows/*`, governance tests | — | — | Keep the design; no direct channel |
| Chat with an employee | — | — | — | Model | **MISSING** | — | — | — | WP-12 |
| Deliverables (files, reports) | Task result text, evidence list | `finish_task` structured report stored on the task | `tasks.result`, `task_evidence` | — | Text reports: **IMPLEMENTED_UNVERIFIED**. **Generated files (documents, spreadsheets, PDFs) and deliverable storage: MISSING** | `tests/tasks/*` | — | — | WP-9 |
| Audit events | Admin audit page | Triggers and `governance` writes | `audit_logs` (append-only) | — | Trigger writes: **WORKING_VERIFIED** (4 rows on workspace creation, 2026-10-25). Page: **IMPLEMENTED_UNVERIFIED** | pgTAP 013 | — | No export | — |
| Usage and cost accounting | Analytics (admin) | `runner.ts` and `playground.ts` upsert per-step usage; budgets from `governance/server/state.ts` | `usage_records` (0 rows) | Model | **IMPLEMENTED_UNVERIFIED** | Integration tests (local) | Model | List-price cost only; no caching discounts | WP-3 |

### 3.4 Knowledge, integrations, analytics, billing

| Feature | FE | BE | DB | Ext | Exec | Proof | Missing | Risks | Remediation |
|---|---|---|---|---|---|---|---|---|---|
| Business context (profile, hours, brand voice, 8 kinds) | Done | `knowledge/server/actions.ts` | `company_settings` (1 row), `business_context_items` | — | Company settings row: **WORKING_VERIFIED** (written on workspace creation). Context items: **IMPLEMENTED_UNVERIFIED** | pgTAP 006 | — | — | WP-12 |
| Document upload and processing | Done | `processor.ts` (extract, chunk, queue, retries) | `knowledge_sources` (0), `knowledge_chunks`, storage bucket | Supabase Storage | **IMPLEMENTED_UNVERIFIED** (0 sources. On Vercel, processing can run after the upload with the service-role key. Locally it is blocked: no secret key in `.env.local`) | Vitest extraction from real PDF and Word files; pgTAP 006 | `CRON_SECRET` for retries; `sb_secret_…` to replace the legacy key | No OCR; a failed first pass waits for the cron backstop | WP-0 |
| Retrieval (keyword and vector, citations, evidence verdict) | Test search page | `retrieval.ts`, `search_knowledge` | — | Voyage AI | Keyword: **IMPLEMENTED_UNVERIFIED**. Vector: **BLOCKED_BY_CONFIGURATION** | Contract test with a fake fetch | `VOYAGE_API_KEY` | 0.45 threshold uncalibrated | WP-0, WP-3 |
| HubSpot connector (find, create, update contact; add note) | Done | `connectors/hubspot.ts` | `integrations`, `tool_executions` | HubSpot | **BLOCKED_BY_CONFIGURATION** (no app, **no live call ever**) | Contract tests from documentation | `HUBSPOT_CLIENT_ID`, `HUBSPOT_CLIENT_SECRET`, keyring | Responses modelled from docs | WP-5 |
| Slack connector (list channels, post message) | Done | `connectors/slack.ts` | Same | Slack | **BLOCKED_BY_CONFIGURATION** (no live call ever) | Contract tests | `SLACK_CLIENT_ID`, `SLACK_CLIENT_SECRET`, keyring | Same | WP-5 |
| OAuth connect, callback, health checks, disconnect | Done (button disabled while not configured) | `oauth.ts`, `/api/integrations/[provider]/callback`, `connections.ts` | `integration_oauth_states` | Providers | **BLOCKED_BY_CONFIGURATION** | Vitest; pgTAP 007 | As above | — | WP-5 |
| Gmail, Google Calendar | — | — | — | Google | **MISSING** (env vars reserved; the callback answers 404 "Unknown provider") | `tests/app/endpoints.test.ts` (new) | — | Website lists them as "first release" | WP-13 |
| Inbound webhooks (Slack events, HubSpot, Gmail push, Stripe) | — | — | `provider_webhook_events` | Various | **MISSING** (no `/api/webhooks/*` routes) | `tests/app/endpoints.test.ts` (new) | Signing secrets | Before this audit, `env:check` told operators to register them | WP-11 |
| Analytics dashboards and evidence | Done | `analytics_*` SQL functions | `outcome_records` (trigger-written) | — | **IMPLEMENTED_UNVERIFIED** (no data; never opened signed in) | pgTAP 014; `tests/integration/analytics.test.ts` (local) | — | — | WP-6 |
| Overview counts | Done | `workspace-summary.ts` (RLS counts) | — | — | **IMPLEMENTED_UNVERIFIED** | — | — | — | — |
| Billing, plans, entitlements | Pricing page says pricing isn't decided | **None**: no Stripe code, no webhook, no checkout, no enforcement | `plans`, `plan_entitlements`, `subscriptions`, `usage_records` tables only | Stripe | **MISSING** (on hold by the owner's decision) | — | Stripe keys | Plan limits (`employees.max`) aren't enforced | WP-14 (on hold) |
| Email delivery (invitations, notifications) | — | `src/lib/email` (Resend) | — | Resend | **BLOCKED_BY_CONFIGURATION** | Vitest with a fake fetch | `RESEND_API_KEY`, `EMAIL_FROM` | — | WP-0, WP-8 |

### 3.5 Operations and quality

| Feature | Exec | Evidence / gap | Remediation |
|---|---|---|---|
| Deployment (Vercel, www.nexefiy.com) | **WORKING_VERIFIED** | `main` deploys to Production; signed-out smoke tests pass (2026-10-25). Production uses the **development** Supabase project. | WP-2 |
| Cron schedules (`vercel.json`, daily) | **BLOCKED_BY_CONFIGURATION** | All 4 routes answer 503 live because `CRON_SECRET` is unset; the service-role key is present. Hobby allows only daily runs. | WP-0, WP-4 |
| Trigger.dev jobs (`trigger/`) | **BLOCKED_BY_CONFIGURATION** | No project; never deployed. | WP-4 |
| Unit tests (Vitest) | **WORKING_VERIFIED** locally | Results in §7. | WP-1 |
| Database integration tests (`tests/integration`, `db:test:local`) | **IMPLEMENTED_UNVERIFIED** here | Excluded from `npm test`; this machine has no PostgreSQL. Last passed 2026-10-19 elsewhere. | WP-1 |
| pgTAP on the dev project | **WORKING_VERIFIED** (2026-10-19) | Not re-run today (no schema change since). | WP-1 |
| CI | **MISSING** | No pipeline. | WP-1 |
| End-to-end browser tests (Playwright) | **MISSING** | Only manual signed-out checks. | WP-15 |
| Error monitoring (Sentry) | **MISSING** | Env var reserved; package not installed. | WP-10 |
| Content-Security-Policy | **PARTIALLY_IMPLEMENTED** | `frame-ancestors 'none'` only. | WP-10 |
| Leaked-password protection | **Disabled** (security advisor, 2026-10-29) | docs/supabase-setup.md expects it on. Owner setting; may require a paid Supabase plan. | WP-0 |

## 4. Mock, placeholder and stale-claim inventory

| Item | Where | Kind | Verdict |
|---|---|---|---|
| Component gallery | `src/app/app/dev/components` | Example data and example actions | Acceptable. Labelled, returns 404 in production (`appEnv === 'production'`), and its Server Actions refuse there too. |
| Keyword-rule drafters | `employees/domain/rule-drafter.ts`, `workflows/domain/rule-drafter.ts` | Non-AI fallback | Acceptable. Labelled as keyword rules in the UI; never adds a tool that doesn't exist. |
| Test invoker | `employees/server/test-invoker.ts` | Describes writes instead of performing them | Acceptable by design. The playground says test runs never write. |
| Claim check in verification | `tasks/domain/verification.ts` (`claimsChange`) | Wording heuristic | Acceptable. A mismatch is "needs review", never "verified". Receipts are checked against `tool_executions`. |
| Legal pages | `src/app/(site)/legal/*` | Drafts with `[placeholders]` | Must be reviewed before launch. Labelled "not in effect" and noindex. |
| Onboarding steps "Set up your first AI employee" and "Connect a business app" shown as "Not available yet" | `identity/domain/onboarding.ts` | **Stale claim** (both built in Phases 8–9) | **Fixed** (§6). |
| Overview text "Outcome and cost reporting will appear in Analytics once it's available" | `src/app/app/page.tsx` | **Stale claim** (Analytics built in Phase 15) | **Fixed** (§6). |
| Provider URLs for `/api/webhooks/{google,slack,hubspot,stripe}` and the Google OAuth callback listed as "URLs to register" | `src/lib/config/endpoints.ts`, `scripts/check-env.ts`, docs/credential-setup.md | **Misleading**: these routes don't exist | **Fixed** (§6): marked `built: false`, printed as "reserved, don't register", and tested. |
| "Leaked-password protection on" | docs/supabase-setup.md | **Doc doesn't match the setting** | Recorded. The owner turns it on in the Supabase dashboard (WP-0). |
| Mocked providers (Anthropic SDK, HubSpot, Slack, Voyage, Resend, Trigger.dev) | `tests/**` only | Test fakes | Acceptable. Never imported by `src/`. Each adapter is labelled contract-tested in docs and CLAUDE.md. |

No hard-coded dashboard metrics, fake connection statuses, no-op handlers presented as working, or unimplemented API routes behind live buttons were found. Disabled buttons (contact form, connect without app credentials, playground without a model) each state why.

## 5. Dependency map of shared foundations

Every AI employee, whatever its department, depends on the same chain. A broken link blocks all employees at once.

```
Owner configuration (WP-0)
  ├─ ANTHROPIC_API_KEY ───────────────► Model gateway ─┐
  ├─ Service-role key (set on Vercel as the legacy JWT; replace with sb_secret_…) ─► runner, executor, knowledge
  ├─ CRON_SECRET ─────────────────────► Cron backstop
  ├─ INTEGRATION_ENCRYPTION_KEYS ────► Credential vault ─► Integration executor ─┐
  ├─ HubSpot / Slack app credentials ─► OAuth connections ───────────────────────┤
  └─ Trigger.dev project ─────────────► Durable execution ──┐                     │
                                                            ▼                     ▼
              Tool registry ──► Agent runtime (runEmployee) ◄── Permission enforcement
                                   │                            (roles, grants, policies,
                                   │                             approvals, stops — SQL)
                                   ▼
               Tasks (queue, checkpoints, retries) ──► Workflows (orchestrator, hand-offs)
                                   │
                ┌──────────────────┼───────────────────┬────────────────────┐
                ▼                  ▼                   ▼                    ▼
          Audit events     Usage and cost       Verification and      Deliverables
          (works)          (built, idle)        evidence (built)      (MISSING)
                                   │
                                   ▼
                     Analytics (built) ─► Billing and entitlements (MISSING, on hold)

Cross-cutting and missing: notifications (approvals, escalations, stops), inbound
webhooks and event triggers, chat, error monitoring, CI, signed-in end-to-end tests.
```

| Foundation | Status | Blocks | First unblocking step |
|---|---|---|---|
| Model-provider abstraction | BLOCKED_BY_CONFIGURATION | Every employee, playground, generation, workflows with employee steps | `ANTHROPIC_API_KEY` in Vercel and `.env.local` (WP-0) |
| Agent runtime | IMPLEMENTED_UNVERIFIED | Every employee | One live playground run (WP-3) |
| Tool registry | IMPLEMENTED_UNVERIFIED | Employee abilities | Knowledge search works without integrations. First live connector (WP-5) |
| Credential vault | BLOCKED_BY_CONFIGURATION | Every integration | Encryption keyring (WP-0) |
| Permission enforcement | DB verified; app unverified | Everything | Signed-in role checks in Playwright (WP-15) |
| Durable task execution | BLOCKED_BY_CONFIGURATION | Tasks that outlive a request, schedules, approvals that resume | Cron secret first, then Trigger.dev (WP-0, WP-4) |
| Workflow and dependency management | IMPLEMENTED_UNVERIFIED | Multi-employee work | One live run with a gate (WP-7) |
| Employee communication | Workflow hand-offs only; chat MISSING | Interactive use | Chat (WP-12) |
| Human approvals | Built; notification MISSING | Every consequential action | Approval email (WP-8) |
| Deliverable storage | MISSING | File outputs (reports, documents, CSVs) | Design and build (WP-9) |
| Audit events | WORKING_VERIFIED (triggers) | — | — |
| Usage and cost accounting | IMPLEMENTED_UNVERIFIED | Budgets, analytics, billing | First model call writes a row (WP-3) |
| Retry and failure recovery | IMPLEMENTED_UNVERIFIED | Reliability | Live Trigger.dev run with an injected failure (WP-4) |

## 6. Safe fixes made during this audit

| Fix | Files | Test |
|---|---|---|
| The onboarding checklist now counts real employees (operator and above) and connected apps (admin and above) instead of listing both as "Not available yet". | `src/modules/identity/domain/onboarding.ts`, `src/modules/identity/server/queries.ts`, `src/app/app/page.tsx` | `tests/app/identity-domain.test.ts` (rewritten case) |
| The overview no longer says Analytics isn't available; it links to it. | `src/app/app/page.tsx` | Typecheck and build |
| Provider endpoints carry `built`. `env:check` lists only built paths to register and shows the rest as "reserved, don't register". The credential-setup table gained a Route column. | `src/lib/config/endpoints.ts`, `scripts/check-env.ts`, docs/credential-setup.md | `tests/app/endpoints.test.ts` (new): each built path has a route file (and a connector, for OAuth callbacks); each reserved one has none |

No migration, database write, credential, environment variable or deployment setting was changed.

## 7. Tests run for this audit (2026-10-29, local Windows machine)

| Command | Result |
|---|---|
| `npm run typecheck` | Pass (exit 0) |
| `npm run lint` | Pass (exit 0) |
| `npx vitest run`, with the fixes | 46 files, **695 tests passed**, 0 failed (including the new `tests/app/endpoints.test.ts`) |
| `npm run build` | Pass (exit 0, no warnings) |
| `npm run check:bundle` | Pass: 161 files scanned (66 browser assets), no secrets or server-only variable names |
| `npm run env:check` | 1 of 14 features configured locally (core Supabase). AI, Supabase secret key, encryption keyring, Voyage, Resend, Google, Slack, HubSpot, Trigger.dev, Sentry, cron secret and Stripe are not configured. |
| Dev project, read-only (Supabase connector) | 24 migrations applied (match `supabase/migrations`). 42 public tables, 0 without RLS. Security advisor: 33 WARN for definer RPCs (documented as intentional), 4 INFO for service-only tables (intentional), **1 WARN: leaked-password protection disabled**. Row counts: 1 user, 1 organization, 1 member, 1 company settings row, 4 audit rows; 0 in every employee, task, execution, integration, workflow-run, usage and knowledge-source table. |
| `npm run db:test:local`, pgTAP | **Not run**: no PostgreSQL on this machine. Last full pass: 2026-10-19 (dev project and local PostgreSQL 16). |

These are the checks this audit was committed after. Their results are also recorded in docs/production-smoke-tests.md.

## 8. Is the platform production-ready?

**No.** It is a carefully built, well-tested codebase whose AI workforce has never done a single piece of real work. What runs today is the website, accounts and workspaces, and the database security model. To be production-ready it needs, at minimum:

- the owner configuration in WP-0;
- a production Supabase project (WP-2);
- a durable engine (WP-4);
- one verified end-to-end task with a real tool (WP-6);
- notifications for approvals (WP-8);
- error monitoring and CI (WP-10, WP-1);
- signed-in end-to-end tests (WP-15).
