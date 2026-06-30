# Known Issues

When the app breaks, check here first.

---

## Template

```
## [DATE] — Issue Title
**Service:** which service broke
**Symptom:** what error or behavior you see
**Root cause:** what was actually wrong
**Fix:** what was changed to fix it
**Files changed:** list of files
```

---

## 2026-06-25 — cookie-parser import in NestJS

**Service:** apps/api
**Symptom:** `TS2349: This expression is not callable. Type 'typeof cookieParser' has no call signatures`
**Root cause:** `import * as cookieParser from 'cookie-parser'` creates a namespace import in TypeScript strict mode — namespace imports can't be called as functions.
**Fix:** Use `import cookieParser = require('cookie-parser')` instead
**Files changed:** `apps/api/src/main.ts`

<!-- Add issues below as they are encountered -->

## 2026-06-30 — Flowise enterprise migrations crash on shared tables

**Service:** packages/server (Flowise engine)
**Symptom:** Engine starts but logs `Migration "..." failed` errors on startup; chatflows return 401
**Root cause:** NestJS (apps/api) and the Flowise engine share the same PostgreSQL database.
Flowise's enterprise migrations assume they own `user`, `organization`, `workspace` etc.,
but NestJS created those tables with additional NOT NULL columns (`createdBy`, `updatedBy`).
Three migrations crashed:

-   `LinkWorkspaceId` — tried to ALTER non-existent `user.activeWorkspaceId`
-   `AddPersonalWorkspace` — INSERT into `workspace` failed on NOT NULL `createdBy`
-   `RefactorEnterpriseDatabase` — would have renamed and recreated `user`/`organization` (destroying NestJS auth data)

**Fix:** Three migrations made into no-ops with explanatory comments. See `rules/shared-database-entities.md` for the ownership rule and upgrade checklist.
**Files changed:**

-   `packages/server/src/enterprise/database/migrations/postgres/1729130948686-LinkWorkspaceId.ts` — conditional `hasColumn()` check for `user.activeWorkspaceId`
-   `packages/server/src/enterprise/database/migrations/postgres/1734074497540-AddPersonalWorkspace.ts` — no-op
-   `packages/server/src/enterprise/database/migrations/postgres/1737076223692-RefactorEnterpriseDatabase.ts` — no-op

## 2026-06-30 — /api/v1/\* returns 401 (engine missing workspace headers)

**Service:** apps/web → apps/api → packages/server (Flowise engine)
**Symptom:** Dashboard loads, user logged in, but `GET /api/v1/chatflows` returns 401 with `{ error: "Missing engine context headers" }`
**Root cause:** `next.config.ts` rewrites do not reliably forward the `Authorization: Bearer` header from the browser to NestJS. Without the token, the JWT middleware on `/api/v1` had no user context, so the proxy callback never injected `x-workspace-id`/`x-tenant-id` into the upstream request. The engine's `trustEngineHeaders` middleware returned 401.
**Fix:** Replaced the `next.config.ts` rewrite for `/api/v1/*` with an explicit Next.js Route Handler (`apps/web/src/app/api/v1/[...path]/route.ts`) that explicitly reads and forwards the `Authorization` header.
**Files changed:** `apps/web/src/app/api/v1/[...path]/route.ts` (new), `apps/web/next.config.ts` (rewrite removed)
