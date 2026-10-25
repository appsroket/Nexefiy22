# Rollback Procedure

What to do when a production release misbehaves. Nothing here is automatic: every rollback, DNS change or database recovery needs an explicit decision by the owner.

## 1. Decide what failed

| Symptom | Likely layer | Go to |
|---|---|---|
| Build fails / deployment `ERROR` | Build or configuration | §2 (production keeps serving the previous deployment) |
| Pages error, wrong behaviour, after a code-only release | Application | §3 |
| Errors mention missing columns/functions, or started right after a migration | Database | §4 |
| Feature says "not configured" | Environment variables | §5 |

## 2. Failed build

A failed build never replaces the live deployment. Read the build log (Vercel → Deployments → the deployment → Build Logs). `EnvValidationError` lists the variables to fix by name. Fix, push, or Redeploy.

## 3. Application rollback (Vercel)

1. Vercel → Project `nexefiy` → Deployments → filter Production → find the last deployment known to be good (recorded in [production-smoke-tests.md](production-smoke-tests.md#results)).
2. Use **Instant Rollback** on it (Hobby allows rolling back to the immediately previous production deployment; Pro to any earlier one), or **Promote to Production** for a Preview built from the same commit.
3. After a rollback Vercel stops auto-assigning new `main` builds to production until you promote again — fix forward on `main`, verify the Preview, then promote.
4. Run section A of the smoke tests and read runtime logs.

CLI equivalent (needs `vercel login` to the `leadsmatic` scope):

```bash
vercel rollback <deployment-url-or-id>
```

Environment variable changes apply only to new deployments; rolling back restores the code, not the variables.

## 4. Database changes

Rolling back the application **does not undo migrations**. Nexefiy migrations are forward-only (`supabase/migrations`, never edited once applied).

- Release migrations expand-then-contract: add columns/functions first in a release whose old code still works, switch code, remove old structures in a later release. Then an application rollback stays compatible with the schema.
- If a migration itself is wrong: write a new corrective migration, review it, test it on dev (`pgTAP` + `npm run db:test:local`), apply it to production. Never hand-edit production schema in the dashboard.
- Data loss or corruption: restore from Supabase backups (daily on paid plans; point-in-time recovery if the add-on is enabled). A restore replaces the database and loses later writes — owner approval required, and confirm the plan's retention before relying on it.
- Never run `supabase db reset` against a remote project.

## 5. Configuration rollback

Vercel keeps no history of variable values. Keep the previous value in your password manager until the new one is verified, set it back in Vercel, then Redeploy. Rotated credentials (see credential-setup.md) are rolled forward, not back.

## 6. After any rollback

Record date, cause, deployment ids and what was done in the results table of production-smoke-tests.md, and add a known limitation or test so it doesn't recur.
