# Implementation Roadmap

Each phase ends with a stop-and-report: files changed, tests executed, results, unresolved issues, next-phase prerequisites. Phase numbers follow the implementation prompt sequence (Phase 2 = environment configuration, inserted 2026-10-17; later phases shifted by one). Dependencies must not be violated.

## Dependency graph

```
P1 Foundation ✅
 └─ P2 Environment configuration & credentials ✅
     └─ P3 Scaffold + Auth + Orgs + RLS
         ├─ P4 Business context & knowledge
         ├─ P5 Employees + model gateway ──────────┐
         │    (needs P4 for retrieval)              │
         └─ P6 Tools, policy, approvals, tasks ◄────┘
              └─ P7 Integrations (OAuth, encrypted credentials, adapters, webhooks)
                   └─ P8 Durable execution (Trigger.dev) + task history
                        └─ P9 Workflow editor (NL gen, visual, manual) + triggers
                             ├─ P10 Analytics & outcomes
                             └─ P11 Billing & entitlements (can start after P3 in parallel; enforcement hooks need P6/P8)
                                  └─ P12 Hardening, observability, launch readiness
                                       └─ P13+ Voice employees, more templates/integrations
```

## Phases

| Phase | Goal | Key deliverables | Exit criteria | Prerequisites |
|---|---|---|---|---|
| **1** ✅ | Foundation & spec | `CLAUDE.md`, `docs/*`, env template, git remote | Docs reviewed by owner | Repo + Supabase access |
| **2** ✅ | Environment configuration & credentials | Credential inventory, `.env.example`, validated env module (`src/lib/env`), feature gating, credential encryption (AES-256-GCM keyring), log redaction, `npm run env:check`, setup guide | Missing optional credentials disable only their feature (tested); no secret reaches `NEXT_PUBLIC_*`, logs, or error messages (tested) | — |
| **3** | App scaffold, auth, orgs, RLS | Next.js app, Tailwind/shadcn, Supabase clients wired to `src/lib/env`, auth pages, org create/switch/invite, roles, `private` helpers, audit_events, CI (typecheck/lint/test), pgTAP isolation tests | Two-org isolation tests pass; auth flows work; no secrets in bundle | `SUPABASE_SECRET_KEY`, DB password / CLI login, test DB decision (ADR-010) |
| **4** | Business context & knowledge | Business profile UI, storage bucket + policies, upload, parsing, chunking, embeddings, retrieval RPC | Upload → retrieve cited chunks; cross-org storage access denied | Embedding provider decision (ADR-008) + key |
| **5** | AI employees & model gateway | Templates seed, employee CRUD + versions, grants, `ModelGateway` + Anthropic adapter, chat with employee (read-only tools) | Cited answer from Support employee; usage + cost recorded | `ANTHROPIC_API_KEY` |
| **6** | Typed tools, policy, approvals, tasks | Tool registry + executor, policy engine, approval inbox, tasks/task_events, kill switches, limits | Tool-executor security suite passes; rejection prevents execution | P5 |
| **7** | Integrations | OAuth framework, encrypted credential storage, re-encryption job, Gmail/Calendar/Slack/HubSpot/webhook adapters, webhook ingestion, health | Each adapter: contract tests + recorded live sandbox verification | Google/Slack/HubSpot developer apps + test accounts, encryption keyring |
| **8** | Durable execution | Trigger.dev setup, `employee.task`, waits for approvals, retries, idempotency, cancellation, run timelines, cron routes | Run survives redeploy while waiting; idempotency test passes | Trigger.dev account + keys, `CRON_SECRET` |
| **9** | Workflows | Definition schema, validation pipeline, NL generation, React Flow editor, manual forms, publish/versioning, triggers | MVP acceptance criterion #3–#5 pass | P8 |
| **10** | Analytics | Dashboard metrics, outcome events per template | Metrics match seeded data | P9 |
| **11** | Billing | Stripe products, Checkout, Portal, webhooks, entitlements enforcement, usage counters | Quota block + upgrade restore e2e | Stripe test account + keys, pricing decision |
| **12** | Hardening & launch | Security headers, rate limits, Sentry, retention jobs, GDPR export/delete, legacy key disable, prod env, Google OAuth verification | Security review done; MVP acceptance criteria 1–9 pass in staging | Domain, SMTP, legal docs |
| **13+** | Expansion | Voice employees, more templates, more integrations, agency mode | — | Telephony provider decision |

## Risks

| Risk | Impact | Mitigation |
|---|---|---|
| Prompt injection via inbound content leads to harmful external actions | High | Approval default for external writes; server-side authorization; injection evals; recipient allow-lists |
| Google restricted-scope verification delays Gmail launch | High (MVP integration) | Start verification early (Phase 7); offer Outlook/IMAP alternative; limit to test users before verification |
| Durable engine lock-in / pricing | Medium | Keep orchestration logic in `modules/workflows`; Trigger.dev only in thin task wrappers (ADR-004) |
| LLM cost overruns | Medium | Tiered models, per-task/org limits, caching, metering |
| RLS mistakes | Critical | Helper functions, pgTAP suite per table, advisors after each migration |
| Toolchain churn (TypeScript 7, Next 16, Tailwind 4) | Medium | Pin versions; TypeScript 7 verified with tsc + Vitest in Phase 2; verify with Next.js in Phase 3 (ADR-002) |
| No local Docker → slower DB testing | Low/Med | Dedicated test project/branch; Docker in CI |
| Scope creep across 11 employee categories | High | Shared runtime; ship 3 templates first; others are config |
