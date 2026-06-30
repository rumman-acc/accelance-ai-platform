# Change Log

All structural changes to the project are logged here in reverse chronological order.

---

## 2026-06-30 — Enterprise Auth Enable + PostgreSQL

**Goal:** Enable org/workspace/user management with PostgreSQL (no Flowise license)

**Changes:**

-   `packages/server/src/IdentityManager.ts` — Added `FLOWISE_PLATFORM` check at start of `_validateLicenseKey()`. If `FLOWISE_PLATFORM=enterprise`, sets `Platform.ENTERPRISE` and returns immediately, bypassing license validation.
-   `packages/server/.env` — Created (gitignored): `FLOWISE_PLATFORM=enterprise`, `PORT=3002`, PostgreSQL/Neon credentials, JWT secrets, SMTP/Brevo config
-   `CLAUDE.md` — Recreated (was deleted in revert)
-   `rules/` — Created: architecture.md, changes.md, services.md, known-issues.md, shared-database-entities.md
-   `rules/steps/01-enterprise-auth-setup.md` — Step documentation

**Result:**

-   Server runs on port 3002
-   PostgreSQL connected (TypeORM migrations run automatically on first startup)
-   Enterprise auth: registration at `/register`, login at `/signin`, workspaces, user invites

---

## 2026-06-29 — Full Revert to Original Flowise 3.1.2

**Goal:** Remove all previous custom code, restore clean Flowise 3.1.2

**What was deleted:**

-   `apps/` — custom NestJS API + Next.js frontend
-   `rules/` — previous architecture docs
-   `CLAUDE.md` — previous instructions
-   `docker-compose.yml`
-   `packages/server/src/accelance/` — custom engine mode code
-   `packages/server/src/middlewares/trustEngineHeaders.ts`
-   `packages/server/src/middlewares/canvasBootstrap.ts`
-   `packages/server/src/enterprise/database/entities/invite.entity.ts`
-   `scripts/` — custom DB migration scripts
-   `packages/server/.env` — had leftover PORT=3002 + ACCELANCE_ENGINE_MODE=true

**What was restored:**

-   `packages/server/src/index.ts` — via `git checkout 12937a5 -- packages/server/`
-   All enterprise auth files — restored to original Flowise state
-   `packages/server/src/enterprise/database/entities/organization-user.entity.ts`
-   `packages/server/src/enterprise/database/entities/workspace-user.entity.ts`

**Remaining intentional differences vs original Flowise:**

-   `package.json` — `"csstype": "3.1.3"` in pnpm.overrides (fixes agentflow build)
-   `packages/ui/index.html` — "Accelance" branding (pre-existing, kept)
-   `packages/ui/src/views/chatflows/EmbedChat.jsx` — Accelance branding (pre-existing, kept)
-   `packages/shared/` — empty scaffold (harmless, not imported by anything)

---

## 2026-06-25 — Initial Flowise 3.1.2 Fork

**Goal:** Fork Flowise 3.1.2 as the base for Accelance AI Platform

Commit: `12937a5 First commit`
