# Known Issues

## #001 — column OrganizationUser.roleId does not exist

**Symptom:** Server crashes with `column OrganizationUser.roleId does not exist`

**Root cause:** `organization_user` table was created by the old custom NestJS code without `roleId`/`status` columns. Flowise enterprise entity expects them.

**Fix:** Delete all enterprise tables (or use a fresh DB) so Flowise migrations recreate them from scratch.

**Prevention:** Always use a fresh/clean database when switching to the Flowise enterprise migration chain.

---

## #002 — Login page appears at / on first start (expected)

**Symptom:** `http://localhost:3002/` shows `/signin` login page

**Root cause:** ENTERPRISE mode requires authentication — this is correct behavior.

**First-time flow:**

1. Go to `http://localhost:3002/register`
2. Enter Organisation Name, Your Name, Email, Password
3. Submit → org + admin user + default workspace created
4. Redirected to login → sign in

---

## #003 — Server starts on port 3000 instead of 3002

**Symptom:** Port 3000 used even though `PORT=3002` in `.env`

**Root cause 1:** `.env` is in the wrong folder (must be `packages/server/.env`, not root)  
**Root cause 2:** Flowise's `bin/run` script doesn't load `.env` before reading PORT

**Fix:** Confirm `packages/server/.env` exists and has `PORT=3002`. Check that `dotenv` is initialized before the HTTP server starts in `packages/server/src/index.ts`.

---

## #004 — csstype TypeScript error in @flowiseai/agentflow build

**Symptom:** `Type '"auto"' is not assignable to type 'AlignmentBaseline | undefined'` in `NodeOutputHandles.tsx`

**Root cause:** Two csstype versions installed (`3.1.3` wanted by agentflow, `3.2.3` pulled by other deps). TypeScript picks up the stricter `3.2.3` definitions.

**Fix:** `"csstype": "3.1.3"` in `pnpm.overrides` in root `package.json` ✅ (already applied)

---

## #005 — "Role not found" after login

**Symptom:** Login succeeds but immediately throws "Role not found"

**Root cause:** The `role` table doesn't have the general roles seeded (`owner`, `member`, `personal workspace`). These are inserted by the `RefactorEnterpriseDatabase1737076223692` migration.

**Fix:** Ensure all migrations ran completely. Check `migrations` table in PostgreSQL for any failed/missing entries. Drop enterprise tables and restart if needed.

---

## #006 — Database connection fails to Neon

**Symptom:** `ECONNREFUSED` or SSL errors connecting to Neon PostgreSQL

**Root cause 1:** `DATABASE_SSL=true` required but not set  
**Root cause 2:** Neon requires direct connection URL (not pooler) for TypeORM migrations

**Fix:** Confirm `DATABASE_SSL=true` in `packages/server/.env`. Use the direct host (`ep-lively-firefly-...`) not the pooler URL.

---

## #007 — Fresh clone crashes at boot: `ENOENT` writing encryption.key

**Symptom:** New developer clones repo, copies `.env.example` → `.env`, runs `node bin/run start`, server crashes immediately with `ENOENT: no such file or directory, open '.../.accelance/encryption.key'` (or similar, depending on `SECRETKEY_PATH`).

**Root cause:** `getEncryptionKey()` in `packages/server/src/utils/index.ts` auto-generates a key on first boot and writes it to `SECRETKEY_PATH/encryption.key` (or `~/.accelance/encryption.key` if unset) — but never created the parent directory first. `.env.example` used to ship `SECRETKEY_PATH=/absolute/path/to/.accelance` as a live, uncommented placeholder, so a fresh clone pointed at a directory that never existed.

**Fix:** `getEncryptionKey()` now creates the parent directory (`fs.mkdirSync(dir, { recursive: true })`) before writing the key, mirroring the pattern already used by `getOrCreateStoredSecret()` for auth secrets. `.env.example`'s `SECRETKEY_PATH` is now commented out by default — it self-heals to `~/.accelance` when unset.

**Related production bug found in the same pass:** `render.yaml` referenced three pre-rebrand env var names that the code no longer reads at all — `FLOWISE_PLATFORM` (code reads `ACCELANCE_PLATFORM`), `DISABLE_FLOWISE_TELEMETRY` (code reads `DISABLE_TELEMETRY`), and `FLOWISE_SECRETKEY_OVERWRITE` (code reads `SECRETKEY_OVERWRITE`). The last one is the most serious: it's the mechanism that's supposed to prevent the encryption key from being regenerated on every Render redeploy (Render's filesystem is ephemeral), but since the env var name didn't match, it silently did nothing — every redeploy would have permanently orphaned every encrypted credential in Neon. All three names fixed in `render.yaml`; also added `TOKEN_HASH_SECRET` as an explicit secret so ephemeral `/tmp` resets don't invalidate in-flight password-reset/email-verification tokens either.

**Prevention:** When renaming an env var read by application code, grep for the old name across `.env.example`, `render.yaml`, `docker-compose*.yml`, and `CLAUDE.md` in the same pass — deployment config files are easy to miss since they aren't executed/type-checked locally. Note: `CLAUDE.md` itself still documents the old `FLOWISE_PLATFORM` name (line ~19) — not fixed here since it's user-owned instructions, flagged to the user separately.

**Follow-up — sharing one `.env` across multiple developers (same Neon DB):** Even with the mkdir fix, `SECRETKEY_PATH` only points at a *local file* — it isn't part of `.env`'s literal content, so two developers sharing an identical `.env` would still each auto-generate a different encryption key on first boot (their `.flowise/encryption.key` never existed to begin with) and be unable to decrypt each other's already-saved credentials in the shared Neon DB. Same issue applied to `TOKEN_HASH_SECRET` (also file-backed, not previously set explicitly). Fixed by adding `SECRETKEY_OVERWRITE` and `TOKEN_HASH_SECRET` as explicit literal values in `packages/server/.env` (pulled from the existing `.flowise/encryption.key` / `token_hash_secret.key` file contents) — `SECRETKEY_OVERWRITE` is checked before any file/path logic in `getEncryptionKey()`, so every machine using this exact `.env` now decrypts identically regardless of local path differences.
