# Architecture Decision Records

Status values: **Accepted**, **Proposed** (needs owner/phase confirmation), **Superseded**.

---

## ADR-001 Modular monolith first — Accepted

**Context:** Twelve functional modules, small team, early product.
**Decision:** One Next.js application with strict module folders and service APIs; durable workers via Trigger.dev from the same repo. No microservices until a module has a concrete scaling or isolation need.
**Consequences:** Simple deploys and refactors; boundaries must be enforced by lint rules and review.

## ADR-002 Technology versions — Proposed (verify at Phase 2 install)

Latest npm versions observed on 2026-10-17:

| Package | Version | Note |
|---|---|---|
| next | 16.4.2 | App Router; requires Node ≥ 20.9 (local Node 24.20 ✅) |
| react | 19.3.1 | |
| typescript | 7.0.2 | Native (Go) compiler. **Verify** Next.js/ESLint/Vitest tooling compatibility; fall back to latest 5.x/6.x if anything breaks. |
| tailwindcss | 4.3.3 | |
| shadcn (CLI) | 4.22.0 | |
| @supabase/supabase-js | 2.118.0 | |
| @supabase/ssr | 0.12.7 | |
| supabase (CLI) | 2.121.0 | |
| zod | 4.6.7 | |
| @trigger.dev/sdk | 4.7.4 | |
| @xyflow/react | 12.12.0 | React Flow |
| stripe | 23.0.0 | |
| vitest | 5.0.5 | |
| @playwright/test | 1.64.1 | |
| eslint | 10.13.0 | |

**Decision:** Use these majors, pin exact versions in `package.json`, read each package's current docs before use.

## ADR-003 Supabase as data, auth, storage, and secrets platform — Accepted

Postgres with RLS for tenant isolation, Supabase Auth with `@supabase/ssr`, Storage for documents, Vault for integration tokens, pgvector for embeddings. Use the new `sb_publishable_` / `sb_secret_` keys; legacy JWT keys to be disabled before launch.

## ADR-004 Trigger.dev for durable execution — Proposed

**Context:** Runs wait hours/days for approvals and must survive deploys and serverless timeouts.
**Options:** Trigger.dev v4 (TypeScript-native, waitpoint tokens, concurrency keys, schedules, cloud + self-host), Inngest (similar, step functions), Temporal (most powerful, heavier ops), Postgres queue (`pgmq`) + custom workers (most control, most work).
**Decision:** Trigger.dev v4, with orchestration logic in `modules/workflows` and Trigger.dev confined to thin task wrappers so it is replaceable. Confirm pricing/region at Phase 7.

## ADR-005 Postgres as the source of truth for run state — Accepted

Trigger.dev executes; Postgres records. UI, analytics, audit, and resumption logic read Postgres, not the engine's API.

## ADR-006 Explicit workflow graphs over free-form multi-agent chat — Accepted

Orchestration via versioned graphs with typed node outputs; bounded delegation tool for handoffs. Predictable cost, auditable, testable.

## ADR-007 Provider-independent model gateway — Accepted

Own thin `ModelProvider` interface; first adapter uses the official Anthropic SDK. Model tiers (`fast`/`balanced`/`deep`) map to concrete models in config. Using the Vercel AI SDK (`ai` 7.x) as an adapter implementation detail is allowed but not as the public interface, to keep tool-call handling and cost accounting under our control.

## ADR-008 Embeddings provider — Proposed

Anthropic does not provide a first-party embeddings API; options: Voyage AI, OpenAI `text-embedding-3-*`, or Supabase built-in `gte-small` via Edge Functions. Decide in Phase 3 based on quality, cost, and EU data-handling; vector dimension in `knowledge_chunks` follows the choice.

## ADR-009 Tool definitions in code, grants in the database — Accepted

Typed Zod schemas and risk levels are code (type-checked, reviewed, versioned). Which org/employee may use which tool is data (auditable, revocable).

## ADR-010 Database environments for development and testing — Proposed

No Docker locally. Proposal: keep `rnqrqconfbcrmszllxgu` as the main project; create a second Supabase project (or enable branching) for dev/test; CI uses `supabase start` in Docker. Needs owner decision before Phase 2 migrations run.

## ADR-011 Integration credential storage in Supabase Vault — Accepted

OAuth tokens stored via `vault.create_secret`, accessed only by server code with the secret key through a `private` security-definer function scoped by org. `INTEGRATION_ENCRYPTION_KEY` exists only as a fallback if Vault is unsuitable for some credential type.

## ADR-012 Approval-by-default for external writes — Accepted

`write_external` and `sensitive` tools require human approval unless an org admin explicitly grants autonomy for a specific tool and condition. `sensitive` cannot be made autonomous in the MVP.

## ADR-013 Deployment on Vercel — Proposed

Web app on Vercel (EU region near Supabase), workers on Trigger.dev Cloud. Voice runtime (later) will need a long-lived-connection host and is out of scope here.
