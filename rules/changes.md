# Change Log

All structural changes to the project are logged here in reverse chronological order.

---

## 2026-07-06 — Add ImageKit Storage Provider

**Goal:** Let documents/attachments be stored on a free, no-card-required third-party cloud (ImageKit) instead of local disk. See `rules/steps/03-imagekit-storage-provider.md` for the full design/tradeoffs writeup.

**Changes:**

-   `packages/components/package.json` — added `imagekit` (^6.0.0) dependency.
-   `packages/components/src/storage/ImageKitStorageProvider.ts` — new `IStorageProvider` implementation. Uses ImageKit's Upload/List/Delete API for file storage; hand-rolled multer storage engine (no official `multer-imagekit` package exists) and a hand-rolled Winston transport (ImageKit has no logging product — buffers log lines and periodically uploads them as dated files, best-effort only).
-   `packages/components/src/storage/StorageProviderFactory.ts` — added `case 'imagekit'`.
-   `packages/components/src/storage/IStorageProvider.ts` — doc comment updated to list `imagekit` as a valid storage type.
-   `packages/server/.env.example` — documented `STORAGE_TYPE=imagekit` + `IMAGEKIT_PUBLIC_KEY` / `IMAGEKIT_PRIVATE_KEY` / `IMAGEKIT_URL_ENDPOINT`.

**Known caveats (not fully verified — no ImageKit account available to runtime-test against):**

-   Uploaded files are retrievable via a predictable public CDN URL unless `isPrivateFile` is set — same exposure model as an unrestricted S3 bucket, mitigated only by UUIDs in the folder path.
-   `getStorageSize`'s recursive behavior when listing nested folders is unconfirmed against ImageKit's live API — should be fine given this repo's shallow `org/chatflow/file` path structure.
-   User must sign up at imagekit.io, get their Public Key / Private Key / URL endpoint, set the 3 env vars, and manually smoke-test an actual upload/download before relying on this.

**Build result:** `pnpm install` succeeded; `tsc --noEmit` on `packages/components` passed with zero errors.

---

## 2026-07-06 — Fix Encryption Key Persistence (Dev Crash + Production Data-Loss Bug)

**Goal:** Fix a fresh-clone startup crash and a latent production credential-loss bug, both rooted in how the AES encryption key is created/persisted. No AWS Secrets Manager — file-based key storage stays, made robust instead. See `rules/steps/03-fix-encryption-key-persistence.md`, `rules/known-issues.md` #007.

**Changes:**

-   `packages/server/src/utils/index.ts` — `getEncryptionKey()` now creates the parent directory (`fs.mkdirSync(recursive: true)`) before writing an auto-generated key, instead of assuming it exists.
-   `packages/server/.env.example` — `SECRETKEY_PATH` default placeholder commented out (was a literal broken path causing fresh-clone crashes); now optional, self-heals to `~/.accelance`.
-   `render.yaml` — fixed three env var names left over from the pre-rebrand codebase that the app no longer reads: `FLOWISE_PLATFORM`→`ACCELANCE_PLATFORM`, `DISABLE_FLOWISE_TELEMETRY`→`DISABLE_TELEMETRY`, `FLOWISE_SECRETKEY_OVERWRITE`→`SECRETKEY_OVERWRITE`. The last one meant the credential-loss-prevention override was silently inert. Also added `TOKEN_HASH_SECRET` as an explicit secret.
-   `.gitignore` — added `.flowise/` and `.accelance/` (local encryption key, auth secrets, sqlite db, logs, blob storage — none of this should ever be tracked).
-   Untracked `.flowise/database.sqlite` (accidentally committed leftover from before Postgres/Neon was wired up; `git rm --cached` only, file kept on disk).

**Key decision:** User explicitly opted out of AWS Secrets Manager for production key storage — `SECRETKEY_OVERWRITE` (env-injected key, platform-independent) is the production path instead, now that the env var name actually matches what the code reads.

**Not fixed (flagged, not touched):** `CLAUDE.md` still documents the old `FLOWISE_PLATFORM` var name — left alone since it's user-owned instructions, not code.

**Build result:** `pnpm --filter accelance build` succeeded.

---

## 2026-07-02 — Email Template Accelance Theme

**Goal:** Replace Flowise black/white email design with Accelance blue+teal brand theme across all 8 email templates (16 files total: `.hbs` + `.html`).

**Changes to all 16 template files:**

- Background color: `#151719` (Flowise dark) → `#0f1729` (Accelance deep navy)
- `bgcolor="#000000"` → `bgcolor="#0f1729"`
- Background image: removed Flowise S3 SVG reference / accelance.io placeholder URL → CSS gradient `linear-gradient(135deg, #0f1729 0%, #1a2e6b 60%, #0d4a44 100%)`
- Logo image src: Flowise S3 PNG → `https://accelance.io/assets/logo-email-white.png` (HTML files; HBS files already had text logo from prior session)
- CTA button gradient: `linear-gradient(to right, #673ab7, #2563eb)` (purple→blue) → `linear-gradient(to right, #2563eb, #0d9488)` (blue→teal)
- CTA button background fallback: `#673ab7` / `#f9fafb` → `#2563eb` (Accelance primary blue)
- Dark mode button override: `#ED00EB` (magenta) → `#0d9488` (Accelance teal)
- SVG decorative gradient stop-color: `#5D5DFF` → `#2563eb`
- Salutation: "The FlowiseAI Team" → "The Accelance Team"
- Reset password body text: "FlowiseAI password/account" → "Accelance password/account"
- Social links: Twitter `FlowiseAI` → `accelanceai`, GitHub `FlowiseAI/Flowise` → `accelance-io/platform`

**Build result:** 7/7 tasks successful ✓

---

## 2026-07-02 — Rebranding Phase 8: Docs & Legal

**Goal:** Rename all Flowise references in README, docs, and legal files.

**Changes:**

- `README.md`: badges, image refs, Quick Start commands (`npx flowise` → `npx accelance`), Docker commands, dev setup `git clone` URL, env var table (`FLOWISE_FILE_SIZE_LIMIT` → `FILE_SIZE_LIMIT`, `FLOWISE_SECRETKEY_OVERWRITE` → `SECRETKEY_OVERWRITE`), default paths (`.flowise` → `.accelance`), docs link, self-host section, GitHub issue/discussion URLs
- `CONTRIBUTING.md`: project name, GitHub URLs, Discord link, package filter names (`flowise-components` → `accelance-components`, `@flowiseai/agentflow` → `@accelance/agentflow`), env var table, contact email `hello@flowiseai.com` → `hello@accelance.io`
- `CODE_OF_CONDUCT.md`: contact email → `hello@accelance.io`
- `SECURITY.md`: all Flowise→Accelance references; contact email `security-team@flowiseai.com` → `security@accelance.io`; cloud URL → `cloud.accelance.io`
- `LICENSE.md`: added Accelance copyright line; Flowise legal attribution lines retained (Apache License requires attribution preservation)
- `docker/README.md`: project name, DockerHub URL, paths, docs link
- `docker/worker/README.md`: project name, main server README link, entrypoint reference

**Build result:** 7/7 tasks successful ✓

---

## 2026-07-02 — Rebranding Phase 7: Docker Files

**Goal:** Rename all Flowise references in Dockerfiles and docker-compose files.

**Changes:**

- `Dockerfile` (root): comments + `WORKDIR /usr/src/flowise` → `/usr/src/accelance`
- `docker/Dockerfile`: `npm install -g flowise` → `accelance`; `ENTRYPOINT ["flowise","start"]` → `["accelance","start"]`
- `docker/worker/Dockerfile`: comment updated
- `docker/docker-compose.yml`: service name `flowise` → `accelance`; image `flowiseai/flowise:latest` → `accelance/accelance:latest`; volume path `~/.flowise` → `~/.accelance`; entrypoint `flowise start` → `accelance start`
- `docker/docker-compose-queue-prebuilt.yml`: service names, container names, images, network, volume paths, queue name defaults, entrypoints, env vars
- `docker/docker-compose-queue-source.yml`: service names, container names, network, volume paths, queue name defaults
- `docker/worker/docker-compose.yml`: image `flowiseai/flowise-worker:latest` → `accelance/accelance-worker:latest`; volume, env vars

**Env var renames applied in docker-compose files (to match Phase 5 server code):**
- `FLOWISE_EE_LICENSE_KEY` → `ACCELANCE_EE_LICENSE_KEY`
- `FLOWISE_SECRETKEY_OVERWRITE` → `SECRETKEY_OVERWRITE`
- `FLOWISE_FILE_SIZE_LIMIT` → `FILE_SIZE_LIMIT`
- `DISABLE_FLOWISE_TELEMETRY` → `DISABLE_TELEMETRY`

**Build result:** 7/7 tasks successful ✓

---

## 2026-07-02 — Rebranding Phase 6: Server Internal Code

**Goal:** Rename internal server error class and metrics identifiers from Flowise → Accelance.

**Changes:**

-   `packages/server/src/errors/internalFlowiseError/` folder renamed to `internalAccelanceError/`
-   `packages/server/src/errors/internalAccelanceError/index.ts`: class `InternalFlowiseError` → `InternalAccelanceError`
-   124 server `.ts` files: `InternalFlowiseError`/`internalFlowiseError` → `InternalAccelanceError`/`internalAccelanceError`
-   12 server `.ts` files: `FLOWISE_METRIC_COUNTERS`→`ACCELANCE_METRIC_COUNTERS`, `FLOWISE_COUNTER_STATUS`→`ACCELANCE_COUNTER_STATUS`
-   `packages/server/src/Interface.Metrics.ts`: enum names updated
-   `packages/server/src/metrics/Prometheus.ts`: metric names + prefix `flowise_`→`accelance_`
-   `packages/server/src/metrics/OpenTelemetry.ts`: metric names
-   `packages/server/src/DataSource.ts`: `.flowise`→`.accelance` default path
-   `packages/server/src/utils/index.ts`: `.flowise`→`.accelance` (×3 default paths)
-   `packages/server/src/enterprise/middleware/passport/SessionPersistance.ts`: `.flowise`→`.accelance`

**Known issue fixed:** PowerShell case-insensitive `-replace` produced `errors/InternalAccelanceError` (capital I) in import paths; fixed via case-sensitive `-creplace` across 123 files.

**Build result:** 7/7 tasks successful ✓

---

## 2026-07-01 — Accelance Brand Theme

**Goal:** Replace Flowise's default violet/purple theme with Accelance's blue+teal brand palette.

**Changes:**

-   `packages/ui/src/assets/scss/_themes-vars.module.scss` — Updated colour values only; no structural changes:
    -   Primary (light mode): `#2196f3` → `#2563eb` (Accelance brand blue), full scale adjusted to blue-100/300/600/700/800
    -   Secondary (light mode): replaced violet `#673ab7` with teal `#0d9488`, full scale adjusted to teal-100/300/600/700/800
    -   Secondary (dark mode): replaced violet `#7c4dff` with teal `#2dd4bf`, surface tones adjusted to match

**Key decisions:**

-   Only the SCSS colour vars were changed — all MUI component overrides and palette mappings reference variables, so zero structural risk.
-   Dark-mode primary (used for surface backgrounds, not brand colour) left untouched.

---

## 2026-07-01 — Render Deployment

**Goal:** Deploy Accelance AI Platform to Render as a web service.

**Changes:**

-   `render.yaml` — Created at repo root. Render IaC config: Node 24.15.0, starter plan, build/start commands, non-secret env vars inline, secrets flagged `sync: false` for manual dashboard entry.
-   `.env.example` (root) — Rewrote to remove deleted `apps/` references, align variable names with Flowise conventions.
-   `packages/server/.env.example` — Prepended Accelance quickstart block (FLOWISE_PLATFORM=enterprise pre-set, PORT=3002, REQUIRED/OPTIONAL sections, secret generation commands).
-   `CLAUDE.md` — Added Developer Setup section with 5-command quickstart.
-   `rules/steps/02-render-deployment.md` — Step documentation.

**Key decisions:**

-   `STORAGE_TYPE=local` with `/tmp` path — files are ephemeral (lost on redeploy). Acceptable for MVP; switch to S3 for production.
-   `FLOWISE_SECRETKEY_OVERWRITE` — secrets flag, must be set before first deploy to prevent credential decryption failure.
-   `plan: starter` — free tier (512MB) will likely OOM when Flowise loads 200+ components. Starter ($7/mo) is minimum viable.

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
