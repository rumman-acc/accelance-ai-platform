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
2. Enter Organization Name, Your Name, Email, Password
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

---

## #008 — Google Gemini node: `models/gemini-1.5-flash is not found for API version v1beta`

**Symptom:** Any node using the "Google Gemini" chat model (e.g. a Condition Agent, or any agentflow node with a Gemini Chat Model input) fails with `[GoogleGenerativeAI Error]: ... [404 Not Found] models/gemini-1.5-flash is not found for API version v1beta, or is not supported for generateContent.`

**Root cause:** Google retired the Gemini 1.5 model family from the `generativelanguage.googleapis.com` (AI Studio) `v1beta` API. The bundled `packages/components/models.json` still listed `gemini-1.5-flash`, `gemini-1.5-flash-8b`, and `gemini-1.5-pro` as selectable options for the `chatGoogleGenerativeAI` node, and the node's hardcoded default (`packages/components/nodes/chatmodels/ChatGoogleGenerativeAI/ChatGoogleGenerativeAI.ts`) was `gemini-1.5-flash-latest`. `chatGoogleGenerativeAI` is on the daily model-refresh job's target list (`packages/server/src/jobs/refreshModelList.ts`) that would have pruned retired models automatically, but that job is disabled by default (`MODEL_REFRESH_ENABLED=false` in `.env.example`), so the stale bundled list was still being served.

**Fix:** Removed the three retired `gemini-1.5-*` entries from the `chatGoogleGenerativeAI` block in `models.json`, and changed the node's default `modelName` to `gemini-2.5-flash`. The separate `chatGoogleVertexAI` model list (a different provider path, not on the auto-refresh target list) was left untouched — no evidence Vertex AI is affected the same way.

**If you hit this on an existing saved flow:** the fix only affects new model selections — a flow with `gemini-1.5-flash` already saved in it will keep failing until you open the node and re-pick a current model (`gemini-2.5-flash` or `gemini-2.0-flash`).

**Prevention:** Turn on `MODEL_REFRESH_ENABLED=true` with a `MODEL_REFRESH_GOOGLE_API_KEY` (and the OpenAI/Anthropic equivalents) in production so retired models drop out of dropdowns automatically instead of waiting for a user to hit a 404 first.

**Follow-up — sharing one `.env` across multiple developers (same Neon DB):** Even with the mkdir fix, `SECRETKEY_PATH` only points at a *local file* — it isn't part of `.env`'s literal content, so two developers sharing an identical `.env` would still each auto-generate a different encryption key on first boot (their `.flowise/encryption.key` never existed to begin with) and be unable to decrypt each other's already-saved credentials in the shared Neon DB. Same issue applied to `TOKEN_HASH_SECRET` (also file-backed, not previously set explicitly). Fixed by adding `SECRETKEY_OVERWRITE` and `TOKEN_HASH_SECRET` as explicit literal values in `packages/server/.env` (pulled from the existing `.flowise/encryption.key` / `token_hash_secret.key` file contents) — `SECRETKEY_OVERWRITE` is checked before any file/path logic in `getEncryptionKey()`, so every machine using this exact `.env` now decrypts identically regardless of local path differences.

---

## #009 — User logged out every ~1 hour (idle timeout, not JWT expiry)

**Symptom:** User gets signed out roughly every hour, landing back on `/login` with no explanation. Looked exactly like a broken JWT-refresh cycle since `JWT_TOKEN_EXPIRY_IN_MINUTES=60` matches the observed interval.

**Root cause:** Coincidence of two unrelated 60-minute numbers. The JWT access/refresh-token/session flow (`packages/server/src/enterprise/middleware/passport/index.ts`, `packages/ui/src/api/client.js`) was verified end-to-end and is working correctly — it silently refreshes on a `TOKEN_EXPIRED` 401 and only truly expires after the 24h refresh-token lifetime. The actual cause is a separate, hardcoded client-side inactivity timer: `IDLE_TIMEOUT_MS = 60 * 60 * 1000` in `packages/ui/src/ui-component/auth/SessionTimeout.jsx`, mounted globally in `App.jsx`. If no `mousemove`/`mousedown`/`keydown`/`scroll`/`touchstart`/`click` fires for 60 minutes, it calls `POST /account/logout` and force-navigates to `/login` — confirmed via the user's Network tab (a `logout` request sitting right after a burst of normal API calls, no 401 involved anywhere in the trail).

**Compounding bug:** `SessionTimeout.jsx` passed `navigate('/login', { state: { reason: 'idle-timeout' } })`, but `signIn.jsx` never read `location.state?.reason` — so the logout gave zero on-screen explanation, making it look like a random/broken session rather than an intentional idle timeout.

**Fix:** Confirmed with the user this is a genuinely idle case (away from keyboard, e.g. watching a long run) and that 60 minutes is the desired duration — no timer change needed. Added an info `Alert` to `signIn.jsx` that reads `location.state?.reason === 'idle-timeout'` and shows "You've been signed out after 60 minutes of inactivity." so future idle-logouts are self-explanatory instead of looking like a bug.

**Prevention:** When debugging "logged out after N minutes," check for a client-side idle/session timer before assuming it's the JWT/refresh-token chain — the two are independent and can coincidentally share the same duration. Any `navigate(..., { state: {...} })` redirect that's meant to explain *why* the user landed somewhere should be verified to actually be read on the receiving page, not just passed.

---

## #009 — AgentFlow V2 "Generate" feature: Condition Agent (router) node crashes immediately with "Failed to parse a valid scenario"

**Symptom:** A flow built via the natural-language "Generate" feature errors as soon as it hits a `conditionAgentAgentflow` ("Condition Agent"/router) node: `Error in Condition Agent node: Failed to parse a valid scenario from the LLM's response... Raw LLM Response: "I cannot process this request because the scenarios list is empty (contains only empty strings) and the instruction is missing..."`.

**Root cause:** the generator pipeline (`packages/components/src/agentflowv2Generator.ts`) never wrote task-specific content into this node at all. Phase 1 (`generateNodesEdges`) only produces graph *shape* — its `NodeDataType` zod schema caps `data` to `{label, name}` — and phase 2 (`generateNodesData`/`initNode`) then overwrites every node's `inputs` with the component's own generic schema defaults regardless of what the flow is for. For `conditionAgentAgentflow` that generic default is two blank `{scenario: ''}` entries and an empty `conditionAgentInstructions` string (see `ConditionAgent.ts`'s input definitions) — the node's own runtime correctly refuses to classify against that and errors immediately. The same gap existed for `agentAgentflow` nodes' system prompt (`agentMessages`), but that field is optional, so it silently degraded (agent runs on label + tools only) instead of crashing — same root cause, quieter symptom.

**Fix:** added two per-node LLM content-generation calls inside `generateSelectedTools` (same pattern as its existing tool-selection calls, so no new pipeline phase). For `conditionAgentAgentflow`: derive the branch count and order directly from the node's own outgoing edges (`${node.id}-output-N` sourceHandle suffix — reliable because edges, unlike node.data, aren't stripped from the few-shot marketplace templates), then ask the model for one scenario per branch plus routing instructions. For `agentAgentflow`: ask the model for role-specific system instructions given the node's label, position in the flow, and selected tools. `validateAndRepairFlow` also gained a backstop warning if a router's scenarios/instructions are still blank after generation (model error, unparseable response, zero matched branches), so a guaranteed-to-crash node is surfaced to the user before they hit it mid-run.

**Prevention:** any new agentflow node type added to the generator's node list that has a `minItems`/required free-text field (like `conditionAgentScenarios`) needs the same treatment — a generic component default will not be task-appropriate, and if the node's runtime doesn't tolerate a blank value the way `agentAgentflow` does, it will hard-crash exactly like this.

---

## #010 — "Import from Composio" search fails with `410: This endpoint is no longer available. Please upgrade to v3 APIs.`

**Symptom:** Searching the Composio catalog importer (`ComposioImportDialog.jsx`) immediately errors with a `composioCatalogService.searchActions` failure wrapping a raw Composio `410` response, even with a valid `composioApi` credential configured.

**Root cause:** the importer's backend service (`packages/server/src/services/composio-catalog/index.ts`) was originally built against Composio's `/api/v2/...` REST surface, chosen for consistency with the already-installed `composio-core@0.5.39` package (whose bundled client also targets v2 internally) rather than the newer v3.1 API a first documentation pass had surfaced. Composio has since fully retired v2 in production — the whole surface now returns `410`, not just the specific paths this feature used.

**Fix:** migrated `composio-catalog`'s `searchActions`/`listConnections`/`importAction` (and the `func` generator template that imported Tools execute through) to the confirmed-live v3/v3.1 endpoints: search `GET /api/v3.1/tools?query=`, detail-by-slug `GET /api/v3.1/tools?tool_slugs=`, connected accounts `GET /api/v3/connected_accounts?toolkit_slug=&status=ACTIVE`, execute `POST /api/v3/tools/execute/{slug}` with body `{connected_account_id, arguments}`. All three were spot-checked live with an unauthenticated `curl` (expect `401`, not `410`) before shipping the fix, rather than trusting docs alone a second time.

**Not yet fixed — same root cause, different node:** the existing native `Composio` tool node (`packages/components/nodes/tools/Composio/Composio.ts`) still uses `composio-core@0.5.39`'s `LangchainToolSet`, which targets the same now-dead v2 surface internally. It is very likely broken in production the same way this feature was, for any workspace actually using it. Not yet investigated or fixed — flagged here so it isn't rediscovered from scratch.

**Prevention:** when a REST integration is scaffolded by reading an installed SDK's bundled client to infer "the real endpoints" (as this feature was, since the SDK's behavior is more trustworthy than prose docs for exact paths/params), the SDK's *version* still matters — an old, unmaintained SDK can target endpoints its own vendor has since retired. Cross-check the SDK-inferred endpoints against current API docs (or a live, unauthenticated request) before trusting them, especially for any third-party integration where the installed package hasn't been bumped recently.
