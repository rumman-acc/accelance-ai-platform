# Architecture

## Current State (as of 2026-06-30)

Single-service architecture — Flowise 3.1.2 with enterprise auth enabled via env bypass.

## Service

| Service           | Type       | Port | Description                                  |
| ----------------- | ---------- | ---- | -------------------------------------------- |
| `packages/server` | Express.js | 3002 | Flowise backend + enterprise auth + React UI |

## Database

| DB         | Provider     | Purpose            |
| ---------- | ------------ | ------------------ |
| PostgreSQL | Neon (cloud) | Primary — all data |

Env vars: `DATABASE_TYPE=postgres`, `DATABASE_HOST=...` (see `packages/server/.env`)

## Platform Mode: ENTERPRISE

Set via `FLOWISE_PLATFORM=enterprise` in `packages/server/.env`.

Bypasses Flowise's license check → forces `Platform.ENTERPRISE` in `IdentityManager`.

Patch location: `packages/server/src/IdentityManager.ts` → `_validateLicenseKey()`

ENTERPRISE mode unlocks:

-   `/register` page for first-time org + admin user creation
-   `/signin` login page
-   `/api/v1/workspace` — workspace CRUD
-   `/api/v1/account/invite` — user invites with email
-   `/api/v1/workspaceuser` — user role management
-   `/api/v1/role` — custom role management
-   All enterprise feature flags enabled

## Auth Flow

```
First time:
  GET /register → fill org name, name, email, password
  POST /api/v1/account/register → creates: org + admin user (OWNER role) + default workspace
  → redirected to /signin
  → login → session cookie

Ongoing:
  Admin creates workspaces: POST /api/v1/workspace
  Admin invites users: POST /api/v1/account/invite (email sent with temp token link)
  User clicks invite link → /register?token=<tmp> → completes signup → MEMBER role
  Admin can promote to OWNER via workspace user settings
```

## Key Files

| File                                                                | Purpose                                           |
| ------------------------------------------------------------------- | ------------------------------------------------- |
| `packages/server/src/IdentityManager.ts`                            | Platform detection — patched for FLOWISE_PLATFORM |
| `packages/server/src/enterprise/services/account.service.ts`        | Registration, invite, login                       |
| `packages/server/src/enterprise/services/organization.service.ts`   | Org management                                    |
| `packages/server/src/enterprise/services/workspace.service.ts`      | Workspace management                              |
| `packages/server/src/enterprise/services/workspace-user.service.ts` | User↔workspace roles                              |
| `packages/server/src/enterprise/database/migrations/postgres/`      | All DB schema migrations                          |
| `packages/server/src/database/migrations/postgres/index.ts`         | Migration import + order                          |
| `packages/server/.env`                                              | Local config (gitignored)                         |
| `packages/server/src/DataSource.ts`                                 | TypeORM connection config                         |

## Roles

| Role               | Name in DB           | Capabilities                                  |
| ------------------ | -------------------- | --------------------------------------------- |
| OWNER              | `owner`              | Full org + workspace control, user management |
| MEMBER             | `member`             | Limited org access                            |
| PERSONAL_WORKSPACE | `personal workspace` | Access to own personal workspace only         |

## Constraints

-   ENTERPRISE mode allows only **one organization** per deployment (`ensureOneOrganizationOnly()`)
-   This is correct — one Accelance Platform instance = one org with multiple workspaces
-   If multi-org (SaaS) is needed → switch to CLOUD platform (requires Stripe integration)

## Future Architecture (planned, not started)

Original 5-service plan:

1. `apps/api` — NestJS auth gateway
2. `apps/engine` — Flowise as engine (port 3002)
3. `apps/web` — Next.js frontend
4. Redis — queue/cache
5. PostgreSQL — shared DB

Current decision: single service is sufficient. Expand only when specific requirements demand it.
