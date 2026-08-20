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

**Update (2026-08-20):** confirmed live during Guardrails v2 Phase 2 verification that this fix's own replacement default, `gemini-2.5-flash`, is now *also* retired — a real chat call returned `[404 Not Found] This model models/gemini-2.5-flash is no longer available to new users. Please update your code to use models/gemini-3.6-flash for the latest features and improvements.` Worked around in that verification by setting the node's "Custom Model Name" field (a plain-text override, bypassing the stale `modelName` dropdown/default entirely) to `gemini-3.6-flash`. This is exactly the failure mode `MODEL_REFRESH_ENABLED` exists to prevent, still not turned on. Treat any hardcoded Gemini default in this codebase as provisional, not fixed.

**Follow-up — sharing one `.env` across multiple developers (same Neon DB):** Even with the mkdir fix, `SECRETKEY_PATH` only points at a *local file* — it isn't part of `.env`'s literal content, so two developers sharing an identical `.env` would still each auto-generate a different encryption key on first boot (their `.flowise/encryption.key` never existed to begin with) and be unable to decrypt each other's already-saved credentials in the shared Neon DB. Same issue applied to `TOKEN_HASH_SECRET` (also file-backed, not previously set explicitly). Fixed by adding `SECRETKEY_OVERWRITE` and `TOKEN_HASH_SECRET` as explicit literal values in `packages/server/.env` (pulled from the existing `.flowise/encryption.key` / `token_hash_secret.key` file contents) — `SECRETKEY_OVERWRITE` is checked before any file/path logic in `getEncryptionKey()`, so every machine using this exact `.env` now decrypts identically regardless of local path differences.

---

## #009 — User logged out every ~1 hour (idle timeout, not JWT expiry)

**Symptom:** User gets signed out roughly every hour, landing back on `/login` with no explanation. Looked exactly like a broken JWT-refresh cycle since `JWT_TOKEN_EXPIRY_IN_MINUTES=60` matches the observed interval.

**Root cause:** Coincidence of two unrelated 60-minute numbers. The JWT access/refresh-token/session flow (`packages/server/src/enterprise/middleware/passport/index.ts`, `packages/ui/src/api/client.js`) was verified end-to-end and is working correctly — it silently refreshes on a `TOKEN_EXPIRED` 401 and only truly expires after the 24h refresh-token lifetime. The actual cause is a separate, hardcoded client-side inactivity timer: `IDLE_TIMEOUT_MS = 60 * 60 * 1000` in `packages/ui/src/ui-component/auth/SessionTimeout.jsx`, mounted globally in `App.jsx`. If no `mousemove`/`mousedown`/`keydown`/`scroll`/`touchstart`/`click` fires for 60 minutes, it calls `POST /account/logout` and force-navigates to `/login` — confirmed via the user's Network tab (a `logout` request sitting right after a burst of normal API calls, no 401 involved anywhere in the trail).

**Compounding bug:** `SessionTimeout.jsx` passed `navigate('/login', { state: { reason: 'idle-timeout' } })`, but `signIn.jsx` never read `location.state?.reason` — so the logout gave zero on-screen explanation, making it look like a random/broken session rather than an intentional idle timeout.

**Fix:** Confirmed with the user this is a genuinely idle case (away from keyboard, e.g. watching a long run) and that 60 minutes is the desired duration — no timer change needed. Added an info `Alert` to `signIn.jsx` that reads `location.state?.reason === 'idle-timeout'` and shows "You've been signed out after 60 minutes of inactivity." so future idle-logouts are self-explanatory instead of looking like a bug.

**Prevention:** When debugging "logged out after N minutes," check for a client-side idle/session timer before assuming it's the JWT/refresh-token chain — the two are independent and can coincidentally share the same duration. Any `navigate(..., { state: {...} })` redirect that's meant to explain *why* the user landed somewhere should be verified to actually be read on the receiving page, not just passed.

**Follow-up (2026-08-14) — durations increased, and a real bug found while doing it:** User reported the same symptom again, this time saying the idle gap felt like only ~10 minutes. Re-checked the whole codebase for any other automatic caller of `/account/logout` or a hidden ~10-minute constant (session store TTL, rate limiter, cookie config) — found none. Same root cause as above: the 60-minute idle clock measures inactivity on the app tab specifically, and time spent working in a separate window/tool (e.g. a long debugging conversation) still counts as idle on that tab, so the *felt* gap before logout can be much shorter than 60 minutes. Not a new bug.

Per explicit user request, increased both durations: `IDLE_TIMEOUT_MS` in `SessionTimeout.jsx` raised from 60 minutes to **8 hours**; `JWT_REFRESH_TOKEN_EXPIRY_IN_MINUTES` raised from 1440 (24h) to **10080 (7 days)** in `.env` / `.env.example`. Access-token lifetime (`JWT_TOKEN_EXPIRY_IN_MINUTES=60`) left untouched — it refreshes transparently and isn't user-facing.

**Real bug found in the same pass:** the express-session cookie's `maxAge` in `passport/index.ts` was **hardcoded** to the `DEFAULT_REFRESH_TOKEN_EXPIRY_IN_MINUTES` constant (1440) rather than reading `process.env.JWT_REFRESH_TOKEN_EXPIRY_IN_MINUTES`. Since both happened to be 1440 before, this was invisible — but simply bumping the env var to 7 days would NOT have actually extended sessions, because the session (which `req.user` depends on for every refresh) would still die at the old hardcoded 24h, capping the effective session length regardless of the refresh JWT's own longer expiry. Fixed by deriving the cookie's `maxAge` from the same env var the refresh JWT itself uses (`getRefreshTokenExpiryInMinutes` reads), falling back to the same default constant (now also bumped to 7 days) when unset.

**Prevention (added):** Any time a token/session lifetime is read in more than one place, grep for every hardcoded copy of the old default before assuming a single env var change takes effect everywhere — `DEFAULT_REFRESH_TOKEN_EXPIRY_IN_MINUTES` was duplicated as both "JWT fallback" and, separately, "literal session cookie maxAge," and only one of those two call sites read the env override.

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

---

## #011 — Custom MCP server security validator blocked the single most common real-world stdio launch pattern

**Symptom:** Any Custom MCP server config using `npx -y <package>` — the documented launch command for the large majority of community stdio-based MCP servers — was rejected by `validateMCPServerConfig` with "contains flag '-y' that is not allowed for command 'npx'", even though the config was otherwise completely benign.

**Root cause:** `packages/components/nodes/tools/MCP/core.ts`'s `validateCommandFlags` listed `-y`/`--yes` in `npx`'s dangerous-flags array, in the same bucket as genuine arbitrary-code-execution flags (`-c`, `--call`, `--shell-auto-fallback`). `-y` only auto-confirms npm's "install this package?" prompt — it doesn't enable code execution beyond what launching the named package already does, and a non-interactively spawned process can't answer that prompt anyway (no TTY), so blocking `-y` didn't add real protection while making `npx` effectively unusable for any real server. Found while designing the MCP registry browser feature (2026-08-14), which depends on `npx -y` working for the majority of registry entries.

**Fix:** removed `-y`/`--yes` from `npx`'s dangerous-flags list, keeping the genuinely dangerous ones blocked. Also added `uvx` (the modern Python-package runner most pypi-based MCP servers actually use) to the command allowlist, since it was missing entirely.

**Prevention:** when adding a flag to a command-allowlist/denylist-style security check, verify it's actually a *capability* the flag grants (code execution, filesystem access, network access) rather than just a *behavior* (skips a prompt, changes output format) — the two get conflated easily under a "looks scary" heuristic, and the cost of over-blocking (a whole command becomes unusable) can be as real as the cost of under-blocking.

---

## #012 — New sidebar item added to `menu-items/dashboard.js` with an `icon:` prop shows no icon at all, silently

**Symptom:** Adding a new nav item to `menu-items/dashboard.js` (e.g. `id: 'guardrails', icon: icons.IconShieldCheck, ...`) renders with **no icon glyph and no error** — the item's text also shifts slightly left versus its siblings, since the icon slot collapses to zero width rather than showing a placeholder.

**Root cause:** the sidebar actually rendered today is `packages/ui/src/design-system/accelance-shell/AccelanceSidebar.jsx` (migration-checklist.md row 26, 2026-08-14), not the classic MUI `Sidebar/MenuList/NavItem`. It reuses `menu-items/dashboard.js` for section/item *data* (via `hooks/useMenuSections.js`) but completely ignores that file's `icon:` prop — it looks up a Lucide icon by `item.id` in its own separate registry, `accelance-shell/icons.js`'s `MENU_ITEM_ICONS`. An id with no entry there renders nothing (`{Icon && <Icon .../>}`), and nothing warns you, because `item.icon` (unused) was still a perfectly valid Tabler component reference the whole time — only `MENU_ITEM_ICONS[item.id]` was missing.

**Fix:** added `guardrails: ShieldCheck` and `compliance: BadgeCheck` to `MENU_ITEM_ICONS` in `accelance-shell/icons.js`.

---

## #015 — `rules/epics-feature-status.md` documented six guardrails as "planned"/🔴 for a full day after the commit that made them real, wired enforcement

**Symptom:** Asked to "build" the remaining §9 Guardrails & Safety backlog (prompt-injection defense, topic/action scoping, loop & recursion detection, egress filtering, confused-deputy prevention, memory & RAG write validation), a fresh read of `rules/epics-feature-status.md` said all six were still `🔴 To build`/`enforcementStatus:'planned'`. Reading the actual code first (`packages/components/src/toolPolicy.ts`, `packages/server/src/utils/preflightGuardrails.ts`) showed real, wired enforcement already existed for every one of them, plus §10's audit log and data retention policy.

**Root cause:** commit `4e8adc8` ("feat(guardrails): add Guardrails & Compliance catalog with real enforcement") was a large, multi-part commit spanning several dated sub-passes (catalog v1 → workspace admin page → catalog batch 2 (seeded as `'planned'`, visibility only) → catalog batch 3 (a `GuardrailCatalogBatch3Enforcement` migration flipping all of batch 2 to `'enforced'` plus real call sites in `preflightGuardrails.ts`/`toolPolicy.ts`/`buildAgentflow.ts`/`AgentAsTool.ts`/`documentstore/index.ts`) → `AuditLog` entity/service/routes → `RetentionCleanup.ts` cron job. The doc-update half of that commit captured the state as of the batch-2 sub-pass and was never revised again before the whole thing was committed atomically — so the single commit's own tracked-documentation snapshot was already stale relative to its own code snapshot, not just relative to a later commit.

**Fix:** corrected every affected row in `rules/epics-feature-status.md` §9/§10/§12 (and the "Reading this map" summary, and the "Configuration Ownership" audit section) to match the actual shipped code, verified against the migration content and each call site rather than the commit message. Also corrected `FEATURE-BUILD-LEDGER.md`.

**Prevention:** for a large commit that bundles multiple dated sub-passes into one atomic commit (a pattern this repo uses often, per the "Update (date, cont'd)" convention already throughout these tracking docs), don't trust that the commit's *own* accompanying doc edit reflects the commit's *own* final code state — grep for the actual enforcement call sites (or the terminal migration in a numbered batch sequence) before reporting a tracked epic as still `🔴`/`'planned'`, even immediately after reading the tracking file. This is a stricter version of the "before recommending from memory" rule: a doc file committed five minutes ago can already be behind the code sitting right next to it in the same commit.

---

**Prevention:** any new top-level sidebar item needs an entry in **both** places — `menu-items/dashboard.js` (id/url/permission/breadcrumbs; its own `icon:` prop only matters if the classic `NavItem` shell is ever reinstated) **and** `accelance-shell/icons.js`'s `MENU_ITEM_ICONS`, keyed by the same `id`, with a Lucide icon (this shell's icon library is Lucide, not Tabler — see the note already in `component-inventory.md`'s AccelanceHeader/AccelanceSidebar entry). Forgetting the second one fails silently — no console error, no broken layout, just a missing icon and a few pixels of shifted text, easy to miss in a quick glance.

---

## #013 — Several LLM-provider nodes had stale defaults, a wrong URL scheme, and a duplicate input, found while auditing the model catalog

**Symptom:** Multiple small bugs found while refreshing `packages/components/models.json` (2026-08-17):
- `ChatSambanova.ts`'s "Base Path" default was `htps://api.sambanova.ai/v1` (missing the `t`) — any user who left the default in place and didn't override it would fail to connect.
- `ChatXAI.ts` declared the `maxTokens` number input twice (identical blocks back to back) — harmless but would render a duplicate field in the node UI.
- `ChatXAI.ts`'s model placeholder was `grok-beta`, a long-retired model id.
- `ChatTogetherAI.ts`'s model placeholder was `mixtral-8x7b-32768` — a Groq-style context-length-suffixed id, not a valid Together AI model id format.
- `chatAlibabaTongyi` in `models.json` priced `qwen-plus` at `input_cost: 0.0016` — roughly 1000x every other entry in the file (all other costs are USD-per-token; this one looked like USD-per-1K-tokens left unconverted).

**Root cause:** copy/paste and typo errors accumulated across separate additions to each node; nothing validates `models.json` pricing units or checks node input arrays for duplicate `name` keys.

**Fix:** corrected the SambaNova URL, removed the duplicate `maxTokens` input, bumped both placeholders to current model ids (`grok-4`, a real Together AI id), and fixed the Alibaba Tongyi pricing to per-token units. See `rules/epics-feature-status.md` § 4 for the broader model-catalog refresh this was found during.

---

## #014 — Anthropic (`chatAnthropic`) model catalog never had Claude 5 added, and the reasoning-feature model gate missed a matching regex case

**Symptom:** The Claude picker in the AI agent-generation modal (`/v2/agentcanvas` → "What would you like to build?") only listed Opus/Sonnet 4.x snapshots (`claude-opus-4-7` down to `claude-opus-4-0`) — no Claude 5 model anywhere, even though it's the current generation.

**Root cause:** `chatAnthropic` in `packages/components/models.json` was never updated when Claude 5 shipped — unlike OpenAI/Gemini, Anthropic's catalog here is hand-maintained except for the nightly `refreshModelList` job, and that job only adds/removes model ids it sees live, it doesn't get run without `MODEL_REFRESH_ANTHROPIC_API_KEY` configured. Separately, `anthropicUtils.ts`'s `MODELS_WITHOUT_SAMPLING_PARAMS` regex for "Opus 5.x and beyond" (`/opus-(?:[5-9]|\d{2,})-/`) required a trailing hyphen, so it silently failed to match a bare version id like `claude-opus-5` (no minor/date suffix) — would have kept showing `temperature`/`top_p`/`top_k` controls for a model that doesn't accept them.

**Fix:** added `claude-opus-5`, `claude-sonnet-5`, and `claude-fable-5` to `chatAnthropic` in `models.json`; extended `ChatAnthropic.ts`'s Extended/Adaptive Thinking and Thinking Effort `show`/`hide` gates to include the two reasoning-capable new models; fixed the regex to `/opus-(?:[5-9]|\d{2,})(?:\b|-)/` so it matches both a bare major-version id and a dated/minor-versioned one, matching the sibling pattern for Opus 4.7+ just above it in the same file.

---

## #016 — Brand-new classic canvas (`/canvas`, no chatflowId) crashed to a fully blank page

**Found 2026-08-18.** **Symptom:** Opening a fresh, unsaved classic agent/chatflow canvas (`/canvas`) rendered a completely blank white page — no header, no toolbar, no React Flow grid, nothing. Reproduced 100% of the time on a brand-new canvas; existing/loaded chatflows were unaffected. Production console only showed a minified, unreadable stack trace pointing into an unrelated `data-grid-*.js` vendor chunk, which was a red herring.

**Root cause:** introduced by an in-progress Content Moderation auto-insert-on-new-agent feature (`packages/ui/src/views/canvas/index.jsx`) — a `useEffect` put `nodes.length` directly inside its dependency array. `nodes` comes from `useNodesState()` called with no initial value, so on the very first render `nodes` is `undefined` — and dependency-array expressions are evaluated synchronously during render, before any effect body runs and before `setNodes` has ever been called. Reading `.length` off `undefined` at that point threw `TypeError: Cannot read properties of undefined (reading 'length')`, which had no error boundary above it, so React unmounted the entire component tree, leaving a blank page. Confirmed via a `vite` dev server (unminified stack traces).

**Fix:** guarded both usages — the early-return condition used `(nodes && nodes.length > 0)` and the dependency array used `nodes?.length` instead of `nodes.length`, so first render never dereferenced `undefined`.

**Note (added 2026-08-19):** the feature this bug lived in was itself removed shortly after — a workspace-wide auto-insert toggle didn't fit the Guardrails v2 rearchitecture (see `rules/epics-feature-status.md` §9). Neither the feature nor this fix ever reached a commit before an unrelated working-tree revert wiped that session's uncommitted state, described in that same rearchitecture's Phase 1 write-up. **Neither the bug nor the feature exists in the current codebase** — logged here for the prevention lesson and for narrative continuity across sessions, not because there's current code to point to.

**Prevention:** never put a plain (non-optional-chained) property access on a piece of `useState`/`useNodesState` state inside a `useEffect` dependency array unless that state is guaranteed to have a non-undefined initial value — dependency arrays are evaluated during render, not after it.

---

## #017 — `utils/index.ts`'s `databaseEntities` map was missing `GuardrailPolicy`/`GuardrailCatalogItem`, silently disabling Prompt-Injection Defense and Egress Filtering on AgentFlow V2 Tool nodes

**Found 2026-08-19.**

**Symptom:** found while auditing `packages/components/src/toolPolicy.ts` for the Guardrails v2 rearchitecture (Phase 0 audit). `evaluateGuardrailPolicy()` — the function backing `checkEgressFiltering`/`applyPromptInjectionWrapping`, reached only from `packages/components/nodes/agentflow/Tool/Tool.ts` — reads `options.databaseEntities['GuardrailPolicy']` and `['GuardrailCatalogItem']`. Both keys were absent from the `databaseEntities` object exported by `packages/server/src/utils/index.ts` (the object `buildAgentflow.ts` threads into every node's `options`), which listed `AgentToolPolicy`, `ToolCallAudit`, and eleven other entities but never these two.

**Root cause:** `getRepository(databaseEntities['GuardrailPolicy'])` with the key missing resolves to `getRepository(undefined)`, which throws — caught by `evaluateGuardrailPolicy`'s own fail-open `catch { return { enabled: false } }`. Prompt-Injection Defense and Egress Filtering have therefore done nothing at runtime on AgentFlow V2 Tool nodes since they were built, regardless of admin toggle state. Confirmed directly against the live database: both guardrails are toggled on, workspace-wide, for the one real production workspace (18 live AgentFlow V2 agents) — a real, silent gap, not a hypothetical one.

**Fix, handled with care because it isn't routine:** adding the missing entities to `databaseEntities` makes `evaluateGuardrailPolicy()` functional for the first time — which on its own would turn on real enforcement immediately for that already-toggled-on workspace, the moment this shipped. Unlike other guardrails touched by the same rearchitecture (topic scoping, spend budgets, confused-deputy, loop detection — all reached via direct server-side TypeORM, never affected by this bug, already genuinely live and unaffected by any of this work), these two guardrails' "old path" was **never actually live**, so simply fixing the plumbing bug is itself a production behavior change. `toolPolicy.ts`'s `checkEgressFiltering`/`applyPromptInjectionWrapping` now compute and record (via a new `GuardrailVerdict` row) what the now-functional old path decides, but only actually deny/wrap when a `GuardrailFlowAttachment` row exists with `observeMode` explicitly `false` — a state nothing in this codebase ever sets. Verified directly against the real database and real (enabled) toggle state: a tool call matching a blocked egress pattern is still allowed through, and prompt-injection wrapping still doesn't happen, while the correct "would have blocked"/"would have redacted" verdicts are written to `guardrail_verdict`.

**Prevention:** `databaseEntities` is a manually-curated allowlist, not derived from the real entity registry (`packages/server/src/database/entities/index.ts`) — adding a new entity there does not make it reachable from `packages/components` unless someone remembers to also add it here. Separately: when a bug-fix touches a plumbing layer that gates whether an *already-enabled* toggle actually does anything, treat turning that plumbing on as a new guardrail promotion in its own right — needs the same observe-first caution as flipping a brand-new guardrail live, not the caution level of an ordinary bug fix.

---

## #018 — Every stored credential in the dev workspace used for Guardrails v2 Phase 2 verification was non-functional

**Found 2026-08-20**, during the live verification pass for Guardrails v2 Phase 2 (see `rules/guardrails-v2/phase2-canvas.md`) — not a guardrails bug, logged here purely so the next person doesn't lose the same hours rediscovering it.

**Symptom:** every attempt to run a real LLM-backed agent in the "Accelance LLP / Default Workspace" dev workspace failed on the model call itself, each in a different way: the `anthropicApi` credential ("Anthropic Credentials") returned `401 API key is invalid`; the `openAIApi` credential `acc-main-api-key` returned `429 You exceeded your current quota`; a second, `vikas person api key` returned `401 Unauthorized`; a third, `gvikaschand121@gmail.com`, also returned `401 Unauthorized`; and the `googleGenerativeAI` credential `rumman-personal-api-key` authenticated fine but its node's default model (`gemini-2.5-flash`) was itself already retired by Google (see #008's 2026-08-20 update) — worked once a valid model name was supplied via the node's "Custom Model Name" override.

**Root cause:** none investigated — these are pre-existing account/billing states on external provider accounts, not a code defect, and out of scope to fix from this repo.

**Impact:** verification work that should have taken minutes (once the flow was wired) took several credential-swap round trips to find one working combination. If you're setting up a test agent in this workspace, budget for this — start with `googleGenerativeAI` / `rumman-personal-api-key` with an explicit, current model name in "Custom Model Name" rather than trusting the node's dropdown default.

**Prevention:** none proposed — this is dev-account hygiene, not a product gap. Worth a periodic manual check if this workspace keeps getting used for live verification passes.
