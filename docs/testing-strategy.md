# Testing Strategy

Principle: **security boundaries are tested as rigorously as features.** A phase is not done until its boundary tests pass, and results are reported verbatim.

## 1. Test layers

| Layer | Tool | Scope | Runs |
|---|---|---|---|
| Static | TypeScript strict, ESLint, import-boundary lint rule | Types, module boundaries, no `NEXT_PUBLIC_` secrets | every commit (CI) |
| Unit | Vitest | Domain logic: Zod schemas, policy engine, workflow validation, reference resolver, cost accounting | every commit |
| Database | pgTAP (`supabase test db`) | RLS policies, RPCs, triggers (last-owner guard, append-only audit) | every PR touching migrations |
| Integration | Vitest + real Supabase test project/branch | Module services against a real database with seeded orgs/users | every PR |
| Adapter contract | Vitest + recorded fixtures (msw) | Adapter request/response mapping, error normalization, redaction | every PR — labelled "contract (fixture)" |
| Adapter live | Manual or scheduled job against sandbox accounts | Real provider calls | before marking an integration available; nightly (P1) |
| Durable execution | Trigger.dev dev environment | Waits/resume, retries, idempotency, cancellation | per phase 7+ |
| End-to-end | Playwright | Critical user journeys and cross-org isolation through the UI | PRs to main |
| Model behaviour | Eval suite (fixtures + rubric/assertions) | NL→workflow generation validity, tool-use correctness, injection resistance | on prompt/model changes |

## 2. Mandatory security test suites

**Tenant isolation (pgTAP + integration):** for every tenant table, as user A (org A): select/insert/update/delete rows of org B → 0 rows / error. Includes RPCs and storage objects.

**Role boundaries:** `viewer` and `member` cannot manage members, integrations, policies, billing; cannot approve actions above their role; cannot remove the last owner.

**Unauthenticated:** anon key cannot read any tenant table.

**Tool executor:** ungranted tool → denied; tool targeting connection of another org → denied; model-supplied `organizationId` ignored; `write_external` without approval → waits; rejected approval → no adapter call (assert mock not called); double execution with same idempotency key → one external effect.

**Webhooks:** bad signature → 401 and no row; replayed event id → processed once.

**Prompt injection evals:** inbound content with instructions to exfiltrate data or change recipients must not produce an allowed external write.

**Secrets:** CI scans `.next/static` for secret prefixes.

## 3. Environments

No Docker on the primary dev machine, so the Supabase local stack is unavailable. Options (decide in Phase 3, ADR-010):
- **Preferred:** a dedicated Supabase **dev/test project** (or Supabase branching) for integration and pgTAP tests, reset via migrations + seed.
- CI (GitHub Actions, Linux) *can* run `supabase start` with Docker, giving isolated ephemeral databases per run.

## 4. Test data

Seed script creates: 2 orgs × users with each role, employees, connections marked as `fixture`, workflows. Never real customer data. Fixture credentials are fake strings that cannot authenticate anywhere.

## 5. Definition of done (every phase)

- Typecheck, lint, unit, database, integration tests pass (output included in the phase report).
- New tables have RLS + isolation tests.
- Supabase advisors show no new security warnings.
- Docs and `CLAUDE.md` updated; known limitations listed honestly.
