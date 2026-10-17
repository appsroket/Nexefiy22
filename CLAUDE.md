# CLAUDE.md — Nexefiy

Permanent instructions for Claude Code (and humans) working in this repository. Keep this file current at the end of every phase.

## What Nexefiy is

Nexefiy is a multi-tenant SaaS "AI workforce" platform. A business creates an organization, configures AI employees (support, sales, marketing, operations, executive assistant, analytics, finance admin, HR admin, research, voice, custom), connects its business apps, assigns work, coordinates employees through workflows, supervises execution through approvals, and measures outcomes.

All employee categories run on **one shared employee runtime**. A "sales employee" is configuration (role, instructions, skills, tools, policies), not a separate product or code path.

Start with [docs/product-vision.md](docs/product-vision.md) and [docs/system-architecture.md](docs/system-architecture.md).

## Current status

- **Phase:** 1 — Foundation and specification (complete, pending review).
- **Code:** none yet. No application, migrations, or tests exist. Do not claim otherwise.
- **Supabase:** project `rnqrqconfbcrmszllxgu` (eu-north-1, Postgres 17) is empty — no tables, no migrations.
- **Next phase:** Phase 2 — application scaffold, auth, organizations, RLS. See [docs/implementation-roadmap.md](docs/implementation-roadmap.md).

## Stack (verified versions in docs/architecture-decisions.md, ADR-002)

Next.js App Router · React · strict TypeScript · Tailwind CSS + shadcn/ui · Supabase Auth/Postgres/Storage/Vault with RLS · Zod · provider-independent model interface (Anthropic first) · Trigger.dev for durable execution · React Flow (`@xyflow/react`) · Stripe · Vercel.

## Repository layout (target, created in Phase 2)

```
src/
  app/                      Next.js routes (UI + route handlers). Thin: delegate to modules.
  modules/<module>/
    domain/                 Pure types, Zod schemas, business rules. No I/O.
    server/                 Server-only services and repositories ("server-only" import).
    ui/                     React components for this module.
  lib/                      Cross-cutting utilities (supabase clients, env, logging).
supabase/migrations/        Versioned SQL migrations — the only way to change the schema.
supabase/tests/             pgTAP tests for RLS and database functions.
trigger/                    Trigger.dev task definitions (durable execution).
tests/                      Vitest unit/integration tests and Playwright e2e.
docs/                       Specification and decisions.
```

Modules: `app-shell`, `identity` (auth + orgs), `knowledge`, `employees`, `models`, `skills` (typed tools), `integrations`, `workflows`, `governance` (approvals + policy), `observability` (tasks + audit), `analytics`, `billing`. A module may import another module's `domain` exports and public `server` service functions only — never its internals or tables directly.

## Permanent engineering rules

1. **Never fabricate.** Do not claim an integration, feature, or test works unless it was actually executed and observed. Mocked or contract-tested adapters must be labelled as such. Report failing tests verbatim.
2. **Model output is never authorization.** Every tool call proposed by a model is re-checked server-side against the caller's organization, the employee's granted tools, entitlements, and policy. The model cannot grant itself permissions, choose another org, or skip approvals.
3. **No privileged credentials in browser code.** Only `NEXT_PUBLIC_*` variables reach the client, and only the Supabase URL, Supabase publishable key, Stripe publishable key, and app URL may be `NEXT_PUBLIC_`. Server modules import `server-only`.
4. **No cross-organization access.** Every tenant-owned table has `organization_id`, RLS enabled, and policies using the `private.is_org_member` / `private.has_org_role` helpers. Service-role code must scope every query by `organization_id` explicitly.
5. **Persist long-running state.** Anything that waits (approvals, retries, multi-step runs, scheduled work) runs in the durable engine with state in Postgres — never in an in-memory promise or a serverless request.
6. **Validate AI-generated workflows** with Zod schema validation *and* semantic validation (tools exist, are granted, integrations connected, graph acyclic where required, policies satisfiable) before saving a draft, and again before publishing.
7. **Restricted actions require approval.** Tool risk levels and org policies determine `auto` / `require_approval` / `deny`; default for external writes is `require_approval`.
8. **Audit without hoarding.** Write append-only audit events for security-relevant actions. Store references and redacted summaries, not raw secrets, tokens, or full message bodies unless the feature needs them.
9. **Versioned SQL migrations only** (`supabase/migrations/<timestamp>_<name>.sql`). No dashboard schema edits. No destructive migration without an explicit, reviewed plan.
10. **Test security boundaries,** not just happy paths: cross-org reads/writes, role escalation, unauthenticated access, approval bypass, webhook signature failures.
11. **Stop at each phase boundary** and report: files changed, tests executed, results, unresolved issues, next-phase prerequisites.
12. **Explain before destroying.** If a major architectural conflict appears, describe it and wait for direction before deleting or rewriting working code.
13. **Secrets live in `.env.local` (git-ignored) or a secret manager** — never in source, docs, prompts, or commit messages. `.env.example` holds placeholders only.

## Commands

None yet — added in Phase 2 (`npm run dev`, `lint`, `typecheck`, `test`, `test:e2e`, `db:*`).

## Environment

- No Docker on the primary dev machine → no local Supabase stack. RLS/pgTAP tests run against a Supabase branch or a dedicated dev project (see [docs/testing-strategy.md](docs/testing-strategy.md)).
- Supabase CLI is available via `npx supabase`.
- GitHub remote: `https://github.com/appsroket/Nexefiy.git` (private), default branch `main`.

## Documentation map

| Topic | File |
|---|---|
| Vision / requirements / MVP | docs/product-vision.md, docs/product-requirements.md, docs/mvp-scope.md |
| Architecture | docs/system-architecture.md, docs/architecture-decisions.md |
| Data | docs/database-design.md, docs/supabase-setup.md |
| Employees and orchestration | docs/ai-employee-architecture.md, docs/agent-orchestration.md |
| Integrations | docs/integration-architecture.md, docs/api-credentials.md |
| Security | docs/security-and-governance.md |
| Workflows | docs/workflow-editor.md |
| Billing | docs/billing-and-entitlements.md |
| Config | docs/environment-variables.md |
| Quality | docs/testing-strategy.md |
| Plan and gaps | docs/implementation-roadmap.md, docs/known-limitations.md |
