# New Developer Setup — Envoy

## What you're running

A single Express.js server (Flowise 3.1.2 fork) with enterprise auth enabled, backed by PostgreSQL on Neon. There is no Docker, no Redis, no separate frontend — one process at `localhost:3002`.

---

## Prerequisites

| Tool    | Version | Install                                |
| ------- | ------- | -------------------------------------- |
| Node.js | 24.x    | `nvm install 24.15.0 && nvm use`       |
| pnpm    | latest  | `corepack enable` (after Node install) |
| Git     | any     | —                                      |

---

## Step 1 — Clone and install

```bash
git clone <repo-url>
cd AI-Platform-Internal
corepack enable
pnpm install
```

---

## Step 2 — Get your `.env` file

The Neon database and secrets already exist for this project — you don't need to create anything. Ask a teammate for the shared `.env` and drop it in place:

```bash
cp /path/to/shared/.env packages/server/.env
```

Then open it and fix only the two things that are local to **your** machine:

- `BLOB_STORAGE_PATH` — set to a real absolute path on your machine, e.g. `C:/Users/yourname/.accelance/storage`
- `SECRETKEY_PATH` — only if it's set at all; same deal, point it at your machine (see note below if it's absent)

Everything else — `ACCELANCE_PLATFORM`, DB credentials, JWT/session secrets — is shared per environment, not per developer, so leave it as-is. Then skip to [Step 3](#step-3--build).

> **Windows path tip:** Use forward slashes (`C:/Users/...`) or double backslashes (`C:\\Users\\...`).

> **SECRETKEY_PATH is optional.** If it's unset in the shared `.env`, the encryption key auto-generates at `~/.accelance/encryption.key` on first boot — nothing to do. If it wipes credentials for you, it means the folder got deleted; pick a stable path.

<details>
<summary>Setting up a brand-new environment instead (no shared <code>.env</code> exists yet)</summary>

**Get a Neon database:**

1. Sign up at [neon.tech](https://neon.tech) — free, no credit card
2. Create a new project
3. Go to **Connection Details** → select **Direct connection** (NOT the pooler — TypeORM migrations require it)
4. Copy the host, user, password, and database name

**Create the `.env` from the template:**

```bash
cp packages/server/.env.example packages/server/.env
```

Open `packages/server/.env` and fill in these **required** values:

```env
# Must stay exactly as-is — enables enterprise auth
ACCELANCE_PLATFORM=enterprise
PORT=3002

# Neon database — use Direct connection (not pooler)
DATABASE_TYPE=postgres
DATABASE_HOST=your-project.c-9.us-east-1.aws.neon.tech
DATABASE_PORT=5432
DATABASE_USER=neondb_owner
DATABASE_PASSWORD=your_neon_password
DATABASE_NAME=neondb
DATABASE_SSL=true

# Local path — change to a real absolute path on your machine
BLOB_STORAGE_PATH=C:/Users/yourname/.accelance/storage
STORAGE_TYPE=local

# Generate each secret individually:
#   node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
# Run that command 3 separate times — never reuse values.
JWT_AUTH_TOKEN_SECRET=<64-char hex>
JWT_REFRESH_TOKEN_SECRET=<different 64-char hex>
EXPRESS_SESSION_SECRET=<any strong random string>
```

> **Windows path tip:** Use forward slashes (`C:/Users/...`) or double backslashes (`C:\\Users\\...`).

> **SECRETKEY_PATH is optional.** Leave it unset and the encryption key auto-generates at `~/.accelance/encryption.key` on first boot. Only set `SECRETKEY_PATH=C:/Users/yourname/.accelance` if you want the key stored somewhere specific. Either way: if you wipe that folder, any credentials stored in the DB become unreadable — pick a stable path if you do set it.
>
> **Deploying to an ephemeral filesystem (e.g. Oracle Cloud VM)?** Set `SECRETKEY_OVERWRITE` to a fixed 32-character string instead, so the encryption key survives a filesystem reset.

</details>

---

## Step 3 — Build

```bash
pnpm build
```

This builds all packages (server + components + UI). Takes 2–5 minutes on first run.

---

## Step 4 — Start

```bash
cd packages/server
node bin/run start
```

Or from the repo root:

```bash
pnpm start:windows   # Windows
pnpm start:default   # Linux / Mac
```

On first start, TypeORM migrations run automatically and create all tables in your Neon DB (only relevant the first time this environment's DB is used — if you copied a shared `.env`, this is a no-op).

---

## Step 5 — Sign in

The `/` route shows a login page — this is expected.

**If you copied a shared `.env`:** the org already exists in that Neon DB. Get invited by whoever's already an admin (see Step 6), then sign in at `http://localhost:3002/signin` with the credentials from your invite email/link.

**If you set up a brand-new environment:** you're the first user, so register instead:

1. Go to `http://localhost:3002/register`
2. Fill in:
    - **Organisation Name:** Envoy
    - **Your Name:** your name
    - **Email:** your work email
    - **Password:** strong password
3. Submit → you are now the `OWNER` (org admin)
4. Sign in at `http://localhost:3002/signin`

> Only the **first** registration creates an org. After that, new users must be invited by an admin.

---

## Step 6 — Invite teammates (optional)

In the UI: workspace settings → Members → Invite

Or via API (while logged in):

```http
POST http://localhost:3002/api/v1/account/invite
Content-Type: application/json
Cookie: <your session cookie>

{
  "user": { "email": "colleague@accelance.io" },
  "workspace": { "id": "<workspaceId>" },
  "role": { "id": "<roleId>" }
}
```

Without SMTP configured, the invite link is printed to the server console instead of emailed.

---

## Common errors

| Error                                           | Likely cause                           | Fix                                                                  |
| ----------------------------------------------- | -------------------------------------- | -------------------------------------------------------------------- |
| Port 3000 instead of 3002                       | `.env` in wrong location               | Confirm file is at `packages/server/.env`                            |
| `ECONNREFUSED` on Neon                          | SSL not set                            | Confirm `DATABASE_SSL=true`                                          |
| `column OrganizationUser.roleId does not exist` | Old schema in DB                       | Drop all enterprise tables and restart (migrations recreate them)    |
| `Role not found` after login                    | Migrations didn't fully run            | Check `migrations` table in Neon; drop enterprise tables and restart |
| Login page at `/` on first start                | Normal — enterprise mode requires auth | Go to `/register` first                                              |

---

## Key files to know

| File                                       | Purpose                                           |
| ------------------------------------------ | ------------------------------------------------- |
| `packages/server/.env`                     | Your local config (gitignored — never commit)     |
| `packages/server/src/IdentityManager.ts`   | Enterprise mode bypass (`ACCELANCE_PLATFORM` check) |
| `packages/server/src/DataSource.ts`        | TypeORM DB connection                             |
| `packages/server/src/enterprise/services/` | Auth, org, workspace, invite logic                |
| `rules/`                                   | Project decisions, architecture, known issues     |

---

## What to read next

-   `rules/architecture.md` — service layout and decisions
-   `rules/services.md` — what the server does and all its routes
-   `rules/known-issues.md` — bugs already encountered and solved
-   `rules/changes.md` — log of every structural change made to the repo
