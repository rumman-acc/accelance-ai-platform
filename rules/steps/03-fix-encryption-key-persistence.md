# Step 03 — Fix Encryption Key Persistence (Dev Crash + Production Data Loss)

## Problem

1. **New developer clone crash:** `getEncryptionKey()` in `packages/server/src/utils/index.ts`
   auto-generates and writes an encryption key file when none exists, but never creates the
   parent directory first. `.env.example` ships `SECRETKEY_PATH=/absolute/path/to/.accelance`
   as a literal, uncommented placeholder — a fresh clone crashes at server boot
   (`index.ts:107`) with `ENOENT: no such file or directory`.

2. **Production data-loss bug (Render):** `render.yaml` sets `FLOWISE_SECRETKEY_OVERWRITE`,
   but the code reads `SECRETKEY_OVERWRITE` (renamed in the 2026-07-02 rebrand, `render.yaml`
   predates that rename and was never updated). The override silently does nothing. Combined
   with `SECRETKEY_PATH=/tmp/.accelance` (ephemeral on Render), every redeploy regenerates the
   encryption key, permanently orphaning every credential already encrypted in Neon Postgres.
   The same ephemeral-path issue applies to `TOKEN_HASH_SECRET` (not set as an explicit secret),
   which would invalidate in-flight password-reset/email-verification tokens on redeploy.

3. **Git hygiene:** `.flowise/database.sqlite` is accidentally tracked in git (leftover from
   before Postgres/Neon was wired up); the rest of `.flowise/` (logs, storage) is untracked but
   not explicitly ignored.

## Fix

- [x] `packages/server/src/utils/index.ts` — `getEncryptionKey()`: create the parent directory
      (`fs.mkdirSync(dir, { recursive: true })`) before writing the auto-generated key, mirroring
      the pattern already used in `getOrCreateStoredSecret()`.
- [x] `packages/server/.env.example` — comment out `SECRETKEY_PATH` default placeholder so a
      fresh clone self-heals to `~/.accelance` (now safe thanks to the mkdir fix) instead of
      crashing on a broken literal path.
- [x] `render.yaml` — rename `FLOWISE_SECRETKEY_OVERWRITE` → `SECRETKEY_OVERWRITE` (matches code)
      and add `TOKEN_HASH_SECRET` as an explicit `sync: false` secret.
- [x] Untrack `.flowise/database.sqlite` from git; extend `.gitignore` to cover local `.flowise/`
      dev artifacts (sqlite db, logs) so this doesn't recur.
- [x] Build to confirm no regressions.
- [x] Log in `rules/known-issues.md` and `rules/changes.md`.

## Explicitly out of scope

- AWS Secrets Manager setup (`SECRETKEY_STORAGE_TYPE=aws`) — user opted out, not used here.
- Attaching a Render persistent disk — `SECRETKEY_OVERWRITE` (fixed name) makes the encryption
  key deployment-independent, so a persistent disk is not required for the key itself.
