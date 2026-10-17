# Nexefiy

Universal AI workforce and business operations platform: configure AI employees, connect business apps, coordinate work through workflows, and supervise execution with human approvals.

**Status:** Phase 3 — specification, environment/credential foundation, and the database schema with RLS and security tests. There is no runnable web application yet.

- Project instructions: [CLAUDE.md](CLAUDE.md)
- Specification and architecture: [docs/](docs/)
- Credentials: [inventory](docs/api-credentials.md) · [setup guide](docs/credential-setup.md) · [variable reference](docs/environment-variables.md)
- Database: [design](docs/database-design.md) · [operations](docs/supabase-setup.md)
- Roadmap: [docs/implementation-roadmap.md](docs/implementation-roadmap.md)

## Local setup

Requires Node.js ≥ 20.9 (developed on Node 24).

1. Install dependencies: `npm install`
2. Copy `.env.example` to `.env.local` and fill in at least the core Supabase values ([setup guide](docs/credential-setup.md)).
3. Check configuration (prints no secrets): `npm run env:check`
4. Run tests: `npm test` and `npm run typecheck`
