# Database Design

Postgres 17 on Supabase. All schema changes are versioned migrations in `supabase/migrations/`. This document is the target design; tables are created phase by phase (see [implementation-roadmap.md](implementation-roadmap.md)).

## 1. Conventions

- Every tenant-owned table has `organization_id uuid not null references organizations(id) on delete cascade`, indexed, as the leading column of composite indexes.
- `id uuid primary key default gen_random_uuid()`, `created_at timestamptz not null default now()`, `updated_at timestamptz not null default now()` (maintained by a trigger).
- `created_by uuid references auth.users(id)` where a human creates the row.
- Enums as Postgres `text` + `check` constraints (easier to migrate than native enums).
- JSON configuration in `jsonb`, always validated by Zod in the app and, for critical shapes, by `pg_jsonschema` check constraints.
- Soft delete only where restore is a product feature (`archived_at`); otherwise hard delete.
- **RLS enabled on every table in `public`**, no exceptions. Tables with no client access get RLS enabled and no policies (service role only).

## 2. Schemas

| Schema | Purpose |
|---|---|
| `public` | Application tables exposed through PostgREST under RLS. |
| `private` | Security-definer helper functions and internal tables never exposed via the API. |
| `vault` | Supabase Vault — not used for customer credentials (application-level encryption instead, ADR-014). |
| `extensions` | `pgcrypto`, `uuid-ossp`, `vector`, `pg_jsonschema`, etc. |

## 3. Authorization helpers (in `private`, `security definer`, `set search_path = ''`)

```sql
private.is_org_member(org_id uuid) returns boolean
private.has_org_role(org_id uuid, roles text[]) returns boolean
```

Both read `public.organization_members` for `auth.uid()`. Policies call them as `(select private.is_org_member(organization_id))` so the planner evaluates efficiently. `private` is not in the API's exposed schemas.

Standard policy set for a tenant table:

```sql
-- read: any member
create policy "members read" on public.<t> for select to authenticated
  using ((select private.is_org_member(organization_id)));
-- write: role-restricted per table
create policy "admins write" on public.<t> for all to authenticated
  using ((select private.has_org_role(organization_id, array['owner','admin'])))
  with check ((select private.has_org_role(organization_id, array['owner','admin'])));
```

## 4. Tables by module

### Identity
| Table | Key columns | Client access |
|---|---|---|
| `profiles` | `id` (= auth.users.id), `full_name`, `avatar_url` | self read/update; co-members read |
| `organizations` | `name`, `slug` unique, `created_by` | members read; owners/admins update; insert via `create_organization()` RPC |
| `organization_members` | `organization_id`, `user_id`, `role` check in (owner, admin, member, viewer), unique(org,user) | members read; owners/admins manage; last-owner guard trigger |
| `organization_invitations` | `email`, `role`, `token_hash`, `expires_at`, `accepted_at` | owners/admins; acceptance via RPC |

### Knowledge
| Table | Key columns |
|---|---|
| `business_profiles` | one per org; `profile jsonb` (industry, offerings, tone, hours, policies) |
| `knowledge_collections` | `name`, `description` |
| `knowledge_documents` | `collection_id`, `storage_path`, `mime_type`, `status` (pending/processing/ready/failed), `checksum` |
| `knowledge_chunks` | `document_id`, `content`, `token_count`, `embedding vector(1536)` (dimension fixed by chosen embedding model, ADR-008), HNSW index |

Retrieval via `match_knowledge_chunks(org_id, collection_ids, query_embedding, k)` — `security invoker` so RLS applies.

### Employees
| Table | Key columns |
|---|---|
| `employee_templates` | global (no org) catalog; `slug`, `category`, `default_config jsonb`; read-only to clients |
| `employees` | `name`, `role_category`, `status` (draft/active/paused/archived), `current_version_id` |
| `employee_versions` | `employee_id`, `version int`, `config jsonb` (instructions, model tier, limits), immutable once created |
| `employee_tool_grants` | `employee_id`, `tool_key`, `connection_id` nullable, `autonomy` override (bounded by policy) |
| `employee_knowledge_grants` | `employee_id`, `collection_id` |

### Skills, tools, integrations
| Table | Key columns | Client access |
|---|---|---|
| `integration_connections` | `provider`, `status` (connected/needs_reauth/revoked/error), `external_account_id`, `scopes text[]`, `encrypted_credentials text` (AES-256-GCM envelope, ADR-014), `credentials_key_id text` | members read non-secret columns (column privilege on `encrypted_credentials` revoked from `authenticated`); admins manage via server |
| `integration_webhook_events` | `provider`, `provider_event_id` unique per provider, `received_at`, `processed_at`, `payload_ref` | none (service only) |
| `tool_invocations` | `task_id`, `step_id`, `tool_key`, `input_redacted jsonb`, `output_redacted jsonb`, `status`, `idempotency_key` unique, `policy_decision` | members read |

Tool definitions live in code (registry), not the database, so schemas are type-checked and versioned with code.

### Workflows
| Table | Key columns |
|---|---|
| `workflows` | `name`, `description`, `status` (draft/active/paused/archived), `current_version_id`, `draft_definition jsonb` |
| `workflow_versions` | `workflow_id`, `version`, `definition jsonb` (validated), `published_by`, immutable |
| `workflow_triggers` | `workflow_id`, `type` (manual/schedule/integration_event/webhook), `config jsonb`, `enabled` |
| `workflow_runs` | `workflow_version_id`, `status` (queued/running/waiting/succeeded/failed/cancelled/rejected), `trigger_payload_ref`, `started_at`, `finished_at`, `trigger_run_id` |
| `workflow_run_steps` | `run_id`, `node_id`, `attempt`, `status`, `input jsonb`, `output jsonb`, `waitpoint_id`, `error` |

### Governance
| Table | Key columns |
|---|---|
| `policies` | org-level `rules jsonb` (per risk level / tool / employee), `version` |
| `approval_requests` | `task_id`, `run_step_id`, `tool_invocation_id`, `requested_action jsonb`, `rationale`, `status` (pending/approved/rejected/expired/cancelled), `decided_by`, `decided_at`, `expires_at`, `edited_input jsonb` |

Decisions are made through `decide_approval(request_id, decision, edited_input)` RPC that checks role and pending status atomically, then the server resumes the waitpoint.

### Observability
| Table | Key columns |
|---|---|
| `tasks` | `employee_id`, `workflow_run_id` nullable, `title`, `status`, `source` (chat/workflow/api), `cost_usd numeric`, timings |
| `task_events` | `task_id`, `seq`, `type` (model_turn/tool_call/approval/policy/error/note), `data jsonb` (redacted) |
| `audit_events` | `actor_type` (user/employee/system), `actor_id`, `action`, `target_type`, `target_id`, `metadata jsonb`, `ip_hash`; **append-only** (no update/delete policies; trigger blocks updates) |

### Analytics and billing
| Table | Key columns |
|---|---|
| `model_usage` | `task_id`, `provider`, `model`, `input_tokens`, `output_tokens`, `cost_usd` |
| `outcome_events` | `employee_id`, `outcome_key`, `value`, `task_id` |
| `billing_customers` | `stripe_customer_id` unique (service only) |
| `subscriptions` | `stripe_subscription_id`, `plan_key`, `status`, `current_period_end` (members read; service writes) |
| `plan_entitlements` | global: `plan_key`, `entitlements jsonb` |
| `usage_counters` | `period_start`, `metric`, `value` (service writes) |
| `stripe_events` | `stripe_event_id` unique, processed flag (service only, idempotency) |

## 5. Data retention

| Data | Retention |
|---|---|
| `task_events` detailed payloads | 90 days (configurable per plan), then summarized |
| `integration_webhook_events` | 30 days |
| `audit_events` | 1 year minimum |
| Knowledge documents | until deleted by user |

Retention jobs run via `pg_cron` or Trigger.dev schedules (decided in Phase 8).

## 6. Migration plan

| Phase | Migrations |
|---|---|
| 3 | extensions, `private` schema + helpers, identity tables, updated_at trigger, audit_events |
| 4 | knowledge tables, `vector`, storage bucket + storage policies |
| 5 | employees, templates seed, model_usage |
| 6 | tool_invocations, policies, approval_requests, tasks, task_events |
| 7 | integration_connections (encrypted credential columns), webhook events |
| 8–9 | workflows, versions, triggers, runs, steps |
| 10 | outcome_events, analytics views |
| 11 | billing tables, entitlements seed |
