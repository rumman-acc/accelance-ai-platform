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

## 2026-06-25 — Step 03: workspaceId Audit (COMPLETE)

**Build result:** PASS — no code changes, build verified clean

**Finding:** ALL top-level entities already have workspaceId (15 entities confirmed).
Child records (ChatMessage, DatasetRow, etc.) are scoped through parent FK — no direct workspaceId needed.
No migrations required.

**Key confirmed:** `getWorkspaceSearchOptionsFromReq(req)` reads `req.user.activeWorkspaceId` —
which our Step 02 `trustEngineHeaders` middleware sets from `X-Workspace-Id` header. The chain works end-to-end.

**Files changed:** None — audit only.

**Next step:** Step 04 — Scaffold NestJS apps/api
See `rules/steps/step-04-nestjs-api.md`

## 2026-06-25 — Step 04: NestJS API Scaffold (COMPLETE)

**Build result:** PASS — `pnpm --filter @accelance/api build` clean after 1 fix

**Known issue fixed:** `import * as cookieParser` fails with esModuleInterop — must use `import cookieParser = require('cookie-parser')` in NestJS. Logged in known-issues.md.

**Files created:**

-   `apps/api/package.json` — NestJS 10, passport-jwt, typeorm, bcryptjs, http-proxy-middleware, class-validator
-   `apps/api/tsconfig.json`, `tsconfig.build.json`, `nest-cli.json`
-   `apps/api/src/main.ts` — bootstrap + cookie-parser + proxy middleware (POST-JWT injects x-workspace-id etc)
-   `apps/api/src/app.module.ts` — global JwtAuthGuard via APP_GUARD
-   `apps/api/src/database/database.module.ts` — TypeORM postgres, synchronize:false (engine owns schema)
-   `apps/api/src/entities/` — User, Organization, Workspace, WorkspaceUser, Role, OrganizationUser (copied lean from enterprise)
-   `apps/api/src/auth/auth.module.ts` — PassportModule + JwtModule
-   `apps/api/src/auth/auth.controller.ts` — POST /auth/register, /auth/login, /auth/logout
-   `apps/api/src/auth/auth.service.ts` — register (creates org+workspace+role in transaction), login
-   `apps/api/src/auth/strategies/jwt.strategy.ts` — Bearer token, validates user exists
-   `apps/api/src/auth/guards/jwt-auth.guard.ts` — global, respects @Public() decorator
-   `apps/api/src/auth/dto/login.dto.ts`, `register.dto.ts`
-   `apps/api/src/common/decorators/public.decorator.ts` — @Public() skips JWT guard
-   `apps/api/src/common/decorators/current-user.decorator.ts` — @CurrentUser() param decorator

**Proxy behaviour:**
All `/api/v1/*` requests → validated by JWT → forwarded to engine (:3002) with headers:
x-workspace-id, x-tenant-id, x-user-id, x-user-role

**Next step:** Step 05 — Next.js web shell
See `rules/steps/step-05-nextjs-web.md`

## 2026-06-25 — Step 05: Next.js Web Shell (COMPLETE)

**Build result:** PASS — `pnpm --filter @accelance/web build` clean (8 routes generated)

**Canvas embed approach (canvasBootstrap):**

-   `GET /auth/canvas-token` (NestJS) → signs 2-min JWT `{ workspaceId, tenantId, userId, role, type:'canvas' }`
-   Next.js canvas page: fetches token → renders `<iframe src="ENGINE_URL/canvas/ID?__ctkn=TOKEN">`
-   Engine: `canvasBootstrap` middleware verifies token → sets `accel_ctx` httpOnly cookie → injects localStorage bootstrap script into index.html
-   Flowise SPA reads localStorage → RequireAuth passes → canvas loads
-   SPA API calls (`/api/v1/*`) → `trustEngineHeaders` reads `accel_ctx` cookie as fallback

**Files created (new):**

-   `packages/server/src/middlewares/canvasBootstrap.ts` — HTML injection + cookie bootstrap
-   `apps/web/package.json` — Next.js 15, tailwindcss
-   `apps/web/tsconfig.json`, `next.config.ts`, `tailwind.config.ts`, `postcss.config.js`, `.eslintrc.json`
-   `apps/web/src/middleware.ts` — route protection via `accel_auth` cookie
-   `apps/web/src/app/layout.tsx`, `page.tsx`, `globals.css`
-   `apps/web/src/app/login/page.tsx` — POST /auth/login
-   `apps/web/src/app/register/page.tsx` — POST /auth/register
-   `apps/web/src/app/dashboard/page.tsx` — lists chatflows, create/delete
-   `apps/web/src/app/canvas/[id]/page.tsx` — fetches canvas token, renders iframe
-   `apps/web/src/app/settings/page.tsx` — user/workspace info stub
-   `apps/web/src/lib/auth.ts` — login/register/logout + localStorage seeding
-   `apps/web/src/lib/api.ts` — fetch wrapper + getChatflows/getCanvasToken/createChatflow/deleteChatflow

**Files modified:**

-   `packages/server/src/middlewares/trustEngineHeaders.ts` — fallback: read workspace ctx from `accel_ctx` cookie
-   `packages/server/src/index.ts` — ENGINE_MODE catch-all uses canvasBootstrap; sets IFRAME_ORIGINS=\* default
-   `apps/api/src/auth/strategies/jwt.strategy.ts` — `fromExtractors([Bearer, cookie('token')])`
-   `apps/api/src/auth/auth.controller.ts` — `GET /auth/canvas-token`
-   `apps/api/src/auth/auth.service.ts` — `generateCanvasToken()`

**Next.js rewrites (server-side, transparent proxy):**

-   `/auth/*` → `http://localhost:3000/auth/*`
-   `/api/v1/*` → `http://localhost:3000/api/v1/*`

**Next step:** Step 06 — Nginx gateway config
See `rules/steps/step-06-nginx-gateway.md`

## 2026-06-29 — Neon DB wired up + synchronize fix

**Build result:** PASS — `pnpm --filter @accelance/api build` clean

**Files changed:**

-   `.env` — created with Neon PostgreSQL credentials (direct connection, not pooler)
-   `packages/server/.env` — updated with Flowise-format Neon credentials + ENGINE_MODE vars
-   `apps/api/src/database/database.module.ts` — `synchronize: true` in dev (auto-creates NestJS tables on first run), `false` in prod
-   JWT_SECRET generated and identical in both .env files

**Why direct connection (not pooler):**
Neon pooler URL has `-pooler` in hostname. TypeORM migrations + schema sync need direct connection.
Pooler can be used later for production read traffic.

**DB_NAME = `neondb`** (Neon's default, not `flowise` — updated in both env files)

---

## 2026-06-29 — Cloud DB Switch (amendment to Step 07)

Both dev and production use cloud-managed PostgreSQL and Redis — no local containers needed.

**Files changed:**

-   `docker-compose.yml` — removed postgres + redis containers; all DB/Redis vars now come from `.env`
-   `.env.example` — updated with full set of cloud connection vars (DB_HOST, DB_USER, DB_PASSWORD, DB_NAME, DB_SSL, REDIS_URL, JWT_SECRET)
-   `apps/api/src/app.module.ts` — ConfigModule now reads `../../.env` (repo root) when pnpm runs from `apps/api/`
-   `apps/api/src/database/database.module.ts` — added `ssl` option controlled by `DB_SSL` env var (required for Azure/Supabase/Neon)

**How to run locally (no Docker needed):**

1. `cp .env.example .env` and fill in cloud credentials
2. `pnpm install`
3. `pnpm --filter @accelance/shared build`
4. Three terminals:
    - `pnpm --filter @accelance/api start:dev` (NestJS with watch)
    - `ACCELANCE_ENGINE_MODE=true PORT=3002 pnpm --filter flowise start` (Engine — needs `packages/server/.env` too, see below)
    - `pnpm --filter @accelance/web dev` (Next.js)

**Engine local dev:** Flowise reads `packages/server/.env` on startup. Copy root `.env` vars there with Flowise naming:

```
DATABASE_TYPE=postgres
DATABASE_HOST=<same as DB_HOST>
DATABASE_PORT=5432
DATABASE_USER=<same as DB_USER>
DATABASE_PASSWORD=<same as DB_PASSWORD>
DATABASE_NAME=flowise
DATABASE_SSL=true
JWT_SECRET=<same as JWT_SECRET>
ACCELANCE_ENGINE_MODE=true
PORT=3002
```

---

## 2026-06-29 — Step 07: Docker Compose (COMPLETE)

**Build result:** Config verified — `docker compose config` validates cleanly (Docker not running; build/run deferred to smoke test)

**Files created:**

-   `docker-compose.yml` — wires gateway, web, api, engine, postgres, redis
-   `.env.example` — documents DB_PASSWORD and JWT_SECRET
-   `apps/api/Dockerfile`
-   `apps/web/Dockerfile`
-   `apps/engine/Dockerfile`
-   `rules/steps/step-07-docker-compose.md`

**Files modified:**

-   `.dockerignore` — added .git, .env, .next, .turbo, coverage, OS/editor noise
-   `apps/gateway/nginx.conf` — added engine upstream + `/canvas/` proxy route
-   `apps/api/src/main.ts` — added `/health` Express middleware (before JWT guard)
-   `apps/web/src/app/canvas/[id]/page.tsx` — changed `||` to `??` for ENGINE_URL

**Canvas URL fix:**
`NEXT_PUBLIC_ENGINE_URL=""` baked into the web image at build time (set in web/Dockerfile).
With `??` (not `||`), empty string stays empty → canvas iframe uses relative URL
`/canvas/{id}?...` → nginx proxies to engine:3002 → engine validates `__ctkn` JWT.

**Startup order:** postgres → api + engine (parallel) → web → gateway

**Smoke test (requires Docker running):**

```bash
cp .env.example .env   # edit DB_PASSWORD and JWT_SECRET
docker compose up --build
curl http://localhost/nginx-health    # → OK
curl http://localhost/health          # → {"status":"ok"}
open http://localhost                 # → login page
```

**Next step:** Step 08 — Production hardening (pgvector init, DB migrations, env overrides)

---

## 2026-06-29 — Step 06: Nginx Gateway Config (COMPLETE)

**Build result:** PASS — `nginx -t` validates clean (config syntax ok)

**Files changed:**

-   `apps/gateway/nginx.conf` — replaced Step 01 placeholder with production-ready config
-   `rules/steps/step-06-nginx-gateway.md` — step plan
-   `rules/services.md` — gateway, api, web statuses updated to Complete
-   `rules/architecture.md` — service map statuses updated

**Key decisions:**

-   Port 80 primary (not 443): Cloudflare terminates TLS and forwards plain HTTP; same config works for local dev. Direct TLS block commented in nginx.conf for future use.
-   `/auth/*` and `/api/*` both route to NestJS api. NestJS owns `/auth/*` natively and proxies `/api/v1/*` to engine internally.
-   `proxy_buffering off` on `/api/` so LLM SSE streaming reaches the browser token-by-token.
-   300s read/send timeout on `/api/` for slow LLM calls.
-   Rate limit zone on `/auth/`: 5 req/min per IP, burst 20.
-   WebSocket upgrade map in `/` location for Next.js HMR and future WebSocket features.

**How to verify:**

```bash
docker run --rm \
  -v "$(pwd)/apps/gateway/nginx.conf:/etc/nginx/nginx.conf:ro" \
  nginx:alpine nginx -t
```

**Next step:** Step 07 — Docker Compose (wire gateway, api, web, engine, postgres, redis)
See `rules/steps/step-07-docker-compose.md`

<!-- Add new entries below this line, newest at the top -->
