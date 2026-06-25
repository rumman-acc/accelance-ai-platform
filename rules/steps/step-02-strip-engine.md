# Step 02 — Strip Engine

**Status:** COMPLETE ✓
**Date started:** 2026-06-25
**Depends on:** Step 01 (monorepo restructure) ✓
**Unblocks:** Step 04 (NestJS api — needs engine running on :3002 to proxy to)

---

## Goal

Make `packages/server` (Flowise) run as a trusted internal engine:

-   No self-contained auth — NestJS API (apps/api) owns auth
-   Accepts `X-Workspace-Id`, `X-Tenant-Id`, `X-User-Id` headers from NestJS and trusts them
-   Runs on port 3002 (not 3000)
-   Enterprise auth routes (login, register, SSO, org management) are disabled
-   AI execution routes (chatflows, agentflows, credentials, etc.) still fully work
-   Controlled by a single env var: `ACCELANCE_ENGINE_MODE=true`

## Why This Approach (NOT a full file move)

`packages/server` is 20k+ lines. A physical move to `apps/engine` would touch hundreds
of import paths with no functional benefit at this stage. Instead:

-   `ACCELANCE_ENGINE_MODE=true` toggles engine behaviour inside packages/server
-   `apps/engine/package.json` (created in Step 1) wraps it with the right startup script
-   When Step 4 is complete and NestJS is running, we can optionally do the physical move
-   This is safe and fully reversible — default mode still works as original Flowise

---

## What Changes

### 1. New file: `packages/server/src/middlewares/trustEngineHeaders.ts`

Reads workspace context from trusted headers (injected by NestJS API).
Sets `req.user` exactly as the existing JWT flow does, so all downstream
`checkPermission` and `checkAnyPermission` calls pass through.

Sets `isOrganizationAdmin: true` so all RBAC checks pass —
NestJS API already validated the user's actual permissions before proxying.

### 2. Modified: `packages/server/src/index.ts`

When `ACCELANCE_ENGINE_MODE=true`:

-   Skip `initializeJwtCookieMiddleware` (no JWT setup)
-   Skip `verifyToken` middleware, use `trustEngineHeaders` instead
-   Skip `initializeSSO`
-   Read port from env: default to 3002

No changes when `ACCELANCE_ENGINE_MODE` is unset/false — original Flowise auth still works.

### 3. Modified: `packages/server/src/routes/index.ts`

When `ACCELANCE_ENGINE_MODE=true`:

-   Skip mounting enterprise auth routes: auth, account, audit, login-method,
    organization, organization-user, role, user, workspace, workspace-user
-   AI execution routes remain: chatflows, credentials, tools, documentstore, etc.

### 4. Updated: `apps/engine/package.json`

Add scripts that start packages/server with `ACCELANCE_ENGINE_MODE=true` and `PORT=3002`.

---

## Key Implementation Detail: req.user shape

The `LoggedInUser` type (enterprise/Interface.Enterprise.ts) requires:

```typescript
{
    id, email, name, roleId,
    activeOrganizationId,    ← from X-Tenant-Id header
    activeWorkspaceId,       ← from X-Workspace-Id header
    isOrganizationAdmin: true, ← grants all permissions
    assignedWorkspaces: [],
    permissions: ['*'],
    activeOrganizationSubscriptionId: '',
    activeOrganizationCustomerId: '',
    activeOrganizationProductId: ''
}
```

---

## Files Changed (exact list)

1. `packages/server/src/middlewares/trustEngineHeaders.ts` — new
2. `packages/server/src/index.ts` — modified (ENGINE_ONLY_MODE guard)
3. `packages/server/src/routes/index.ts` — modified (skip enterprise routes)
4. `apps/engine/package.json` — updated with real scripts

---

## Build + Test After This Step

```bash
pnpm --filter flowise build
```

Expected: build passes, no type errors.

Manual smoke test:

```bash
ACCELANCE_ENGINE_MODE=true PORT=3002 pnpm --filter flowise start
# Hit http://localhost:3002/api/v1/ping — should return 200
# Hit http://localhost:3002/api/v1/chatflows with X-Workspace-Id header — should return 200
# Hit http://localhost:3002/api/v1/auth/login — should return 404 (route not mounted)
```

---

## Rollback

Set `ACCELANCE_ENGINE_MODE=false` (or remove the env var). Everything reverts to original Flowise.
No DB changes, no migrations — this is purely a runtime behaviour change.

---

## Next Step

→ Step 03: Audit + add workspaceId to missing entities
See `rules/steps/step-03-workspace-id-audit.md`
