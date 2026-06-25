# Step 01 — Monorepo Restructure

**Status:** COMPLETE ✓
**Date started:** 2026-06-25
**Depends on:** Nothing — this is the first step
**Unblocks:** Step 02 (engine strip), Step 04 (NestJS api), Step 05 (Next.js web)

---

## Goal

Create the `apps/` directory scaffold alongside the existing `packages/`.
Do NOT move or delete any existing code. The current Flowise still runs unchanged.
This step only adds structure and updates workspace config.

---

## What Changes

### 1. `pnpm-workspace.yaml`

Add `apps/*` so pnpm treats each app as a workspace package.

Before:

```yaml
packages:
    - 'packages/*'
```

After:

```yaml
packages:
    - 'packages/*'
    - 'apps/*'
```

### 2. Root `package.json` → `workspaces` array

Add `apps/*`.

### 3. `turbo.json`

Add `dev` and `build` pipeline entries that understand the new app services.
Keep `pipeline` key (turbo 1.10.16 syntax — NOT `tasks`).

### 4. New folders and files created

```
apps/
  gateway/
    nginx.conf          ← Nginx routing config (placeholder, filled in Step 6)
    Dockerfile          ← FROM nginx:alpine
    README.md
  web/
    package.json        ← @accelance/web, Next.js stub
    README.md
  api/
    package.json        ← @accelance/api, NestJS stub
    README.md
  engine/
    package.json        ← @accelance/engine, placeholder (code moves here in Step 2)
    README.md

packages/
  shared/
    package.json        ← @accelance/shared
    tsconfig.json
    src/
      index.ts          ← barrel export
      types/
        tenant.types.ts
        auth.types.ts
        common.types.ts
```

---

## What Does NOT Change

-   `packages/server` — still exists, still runs Flowise (moved in Step 2)
-   `packages/ui` — still exists (replaced in Step 5)
-   `packages/components` — untouched
-   All other existing packages — untouched
-   No migrations, no DB changes

---

## How to Verify Step 1 Worked

```bash
pnpm install          # should complete with no errors
pnpm ls -r --depth 0  # should list all workspace packages including new apps/*
```

---

## Rollback

Delete the `apps/` directory and `packages/shared/`.
Revert `pnpm-workspace.yaml`, root `package.json`, and `turbo.json` to previous values.

---

## Files Changed (exact list)

1. `pnpm-workspace.yaml` — updated
2. `package.json` (root) — updated workspaces array
3. `turbo.json` — updated pipeline
4. `apps/gateway/nginx.conf` — created
5. `apps/gateway/Dockerfile` — created
6. `apps/gateway/README.md` — created
7. `apps/web/package.json` — created
8. `apps/web/README.md` — created
9. `apps/api/package.json` — created
10. `apps/api/README.md` — created
11. `apps/engine/package.json` — created
12. `apps/engine/README.md` — created
13. `packages/shared/package.json` — created
14. `packages/shared/tsconfig.json` — created
15. `packages/shared/src/index.ts` — created
16. `packages/shared/src/types/tenant.types.ts` — created
17. `packages/shared/src/types/auth.types.ts` — created
18. `packages/shared/src/types/common.types.ts` — created

---

## Next Step

→ Step 02: Strip engine — move `packages/server` to `apps/engine`, remove enterprise auth from it
See `rules/steps/step-02-strip-engine.md`
