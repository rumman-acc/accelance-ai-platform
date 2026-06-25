# Change Log

Format: `[DATE] [STEP] — What changed, why, any gotchas`

---

## 2026-06-25 — Project Setup

**Step: Rules folder + CLAUDE.md created**

-   Created `rules/` folder with architecture.md, services.md, changes.md, known-issues.md
-   Created `CLAUDE.md` as entry point for Claude sessions
-   No code changed — structural/documentation only

**Current repo state:**

-   Flowise 3.1.2 monorepo, packages: server, ui, components, agentflow, api-documentation, observe
-   `packages/server/src/enterprise/` contains: auth, org/workspace/user entities, RBAC, SSO
-   `ChatFlow` entity already has `workspaceId` column
-   No `apps/` directory yet — v0.0 restructure not started

**Next step:** Step 1 — Create apps/ directory structure and update pnpm-workspace.yaml

---

## 2026-06-25 — Step 01: Monorepo Restructure (COMPLETE)

**Files changed:**

-   `pnpm-workspace.yaml` — added `apps/*` glob
-   `package.json` (root) — added `apps/*` to workspaces array
-   `turbo.json` — added `.next/**` to build outputs, added `persistent: true` to dev, added `lint` and `typecheck` tasks
-   `apps/gateway/nginx.conf` — Nginx routing config (placeholder, full config in Step 6)
-   `apps/gateway/Dockerfile` — FROM nginx:alpine
-   `apps/web/package.json` — `@accelance/web` stub (Next.js, port 3001)
-   `apps/api/package.json` — `@accelance/api` stub (NestJS, port 3000)
-   `apps/engine/package.json` — `@accelance/engine` stub (Flowise, port 3002, code moves here in Step 2)
-   `packages/shared/package.json` — `@accelance/shared` with TypeScript config
-   `packages/shared/tsconfig.json`
-   `packages/shared/src/index.ts` — barrel export
-   `packages/shared/src/types/tenant.types.ts` — ITenant, IWorkspace, IWorkspaceContext
-   `packages/shared/src/types/auth.types.ts` — IUser, IJwtPayload, UserRole enum
-   `packages/shared/src/types/common.types.ts` — IApiResponse, IPaginatedResponse, ENGINE_HEADERS constants

**Verified:** `pnpm install` completes cleanly. `pnpm --filter @accelance/api run dev` reaches the package (expected error: nest not installed yet).

**What did NOT change:** packages/server, packages/ui, packages/components — Flowise still runs unchanged.

**Next step:** Step 02 — Strip engine (move packages/server → apps/engine, remove enterprise auth)
See `rules/steps/step-02-strip-engine.md`

---

## 2026-06-25 — Step 02: Strip Engine (COMPLETE)

**Build result:** PASS — `pnpm --filter flowise build` completes with no errors

**Files changed:**

-   `packages/server/src/middlewares/trustEngineHeaders.ts` — new middleware; reads X-Workspace-Id, X-Tenant-Id, X-User-Id headers; sets req.user with isOrganizationAdmin=true so all RBAC guards pass
-   `packages/server/src/index.ts` — added `ENGINE_MODE` const; when true: skips initializeJwtCookieMiddleware, uses trustEngineHeaders instead of verifyToken, skips initializeSSO
-   `packages/server/src/routes/index.ts` — wrapped enterprise auth routes (auth, audit, user, organization, role, workspace, account, loginmethod, logs) in `if (ACCELANCE_ENGINE_MODE !== 'true')` guard
-   `apps/engine/package.json` — updated with real scripts; dev/start both set `ACCELANCE_ENGINE_MODE=true PORT=3002`
-   `rules/workflow.md` — new: build+test rules for every step
-   `CLAUDE.md` — updated with workflow rules

**How to activate engine mode:**

```bash
ACCELANCE_ENGINE_MODE=true PORT=3002 pnpm --filter flowise start
```

**Default (Flowise mode) unchanged** — no env var = original Flowise auth still works.

**Next step:** Step 03 — Audit + add workspaceId to missing entities
See `rules/steps/step-03-workspace-id-audit.md`

<!-- Add new entries below this line, newest at the top -->
