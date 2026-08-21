# Guardrails v2 — Phase 3 (Authoring), as-built

Progress log for Phase 3, following `Guardrails_end_to_end_protocol.md`'s
BUILD/TEST/REPORT/READ/FIX/RE-TEST/ADVANCE loop, one small unit at a time. The
dynamic-node-registration fork required before this phase could start is resolved separately in
`phase3-authoring-mechanism.md` — this file is the build log for the actual authoring work.

## Kind-scope decision (2026-08-21)

Before building the create-custom-definition form, checked which of the 10 finalized kinds
(`kinds.md`) have a real, generic, config-driven executor today. Finding: **neither of the two
kind executors that exist is actually generic.**

- `regexMatch.ts`'s `checkEgressPattern` is hardcoded to `blockedDomainPatterns` substring
  matching for `egress_filtering` specifically; `wrapPromptInjection` is a fully hardcoded,
  unconditional transform for `prompt_injection_defense` specifically. Neither takes an
  arbitrary user-supplied pattern.
- `enumConstraint.ts`'s `verifyWorkspaceMembership` is hardcoded to active-workspace-membership
  checking for `confused_deputy_prevention` specifically -- it **ignores** any
  config-provided `allowedValues` list entirely.

So "authoring v1 scoped to kinds with real executors" (the first decision made this phase)
initially resolved to zero kinds, not two. Corrected in a second round: build one genuinely
generic executor first, as its own prerequisite unit, and scope authoring v1 to just that kind.
**Decision: `regex_match` only, for v1.** `enum_constraint` (and the other 8) deferred until a
real generic executor exists for them -- not built blind against a name in a table.

## Unit 1 — generic `regex_match` executor

**Tier A** (enforcement-relevant, changes what a future custom guardrail actually does).

**Build:** `packages/components/src/guardrails/kinds/regexMatch.ts` — added `evaluateRegexMatch(
params: {pattern, action}, content: string): IGuardrailVerdict`, a genuinely generic executor
matching `kinds.md`'s documented `regex_match` config shape exactly. `action:'redact'` returns
`transformedPayload` with all matches replaced (global flag); `'block'`/`'flag'` return the
matching verdict with the matched text as evidence; an invalid `pattern` fails to `block`
(loud, not silently inert) rather than throwing, matching this codebase's existing fail-closed
convention for verification failures. No new ReDoS mitigation was added -- `new RegExp()` on
user-controlled input with no complexity/timeout guard is this codebase's pre-existing
convention (`agentflowv2Generator.ts` already does the same), not a new gap this function
introduces. Flagged here rather than silently inherited: **a future hardening pass should add a
pattern-complexity check or timeout before `regex_match` is exposed to untrusted/external
users** -- acceptable for now since only workspace members with `guardrails:manage` can author
one.

**Test:** built the compiled function directly (no jest suite exists for any guardrails-v2 kind
executor in this codebase; matched that convention rather than introducing one), ran 8 real
cases: no-match pass, block-on-match, flag-on-match, redact with correct `transformedPayload`,
redact with multiple occurrences all replaced (confirms the `g` flag path), and the genuine
negative case -- an invalid/unclosed regex pattern returns `{verdict:'block', reason:'invalid
regex...'}` rather than throwing. Plus empty-content and non-string-content pass-through. All 8
passed.

**RESULT: PASS.**

**CARRY-FORWARD:** the ReDoS-hardening note above; not blocking, but should be revisited before
any world where an untrusted (non-workspace-member) actor could ever submit a pattern.

## Unit 2 — create-custom-definition endpoint, plus a real infra bug it surfaced

**Tier A** (schema change + new mutating endpoint).

**Finding, surfaced before writing the endpoint:** the existing `UNIQUE(key, version)` index
(a Phase 1 non-negotiable) is not scoped by workspace. It was correct while every row was a
system row with a distinct key, but a create-custom-definition endpoint lets *workspace* users
pick their own `key` -- two workspaces both choosing e.g. `block_profanity` at version 1 would
collide on this index for a reason unrelated to anything either workspace did. This is a locked
decision proving under-scoped by what Phase 3 actually needs, not something to silently patch
either direction -- raised with the user, who chose: migrate the constraint to
`(workspaceId, key, version)` rather than server-generating an opaque key.

**Build:**
- `1800000000000..1800000000003-ScopeGuardrailDefinitionKeyToWorkspace` (4 drivers): drops
  `idx_guardrail_definition_key_version`, replaces it with a unique index on
  `(COALESCE("workspaceId", ''), key, version)` -- the same `''` = system/workspace-wide
  sentinel idiom this codebase already uses for `GuardrailPolicy.chatflowId`. `COALESCE` (not a
  plain nullable composite index) is required specifically so system rows (`workspaceId IS
  NULL`) keep deduplicating against each other exactly as before -- Postgres treats NULL as
  distinct-from-NULL in a plain unique index, which would have silently stopped protecting
  system rows if not handled this way.
- `services/guardrails/index.ts`: `createCustomDefinition` -- validates `key` format
  (`^[a-z0-9_]+$`), validates `kindKey` against `AUTHORING_KIND_VALIDATORS` (currently just
  `regex_match`, which additionally compiles the submitted `pattern` with `new RegExp()` and
  rejects an invalid one before insert, and checks `action` is one of block/flag/redact), forces
  `origin:'custom'`, `workspaceId` (server-side, never client-supplied), `placement:'attached'`,
  `defaultObserveMode: true` unconditionally (decision 5 is not client-controllable, full stop),
  `version: 1`.
- `controllers/guardrails/index.ts`: `createDefinition` -- explicit field allowlist (same
  pattern as `toolsController.createTool`), audit-logs the creation.
- `routes/guardrails/index.ts`: `POST /definitions`, gated by the existing `guardrails:manage`
  permission (no new permission key needed).

**Test:** rebuilt, restarted against the live Neon DB, confirmed boot log's
`Database migrations completed successfully`, then confirmed the new index definition directly
(`pg_indexes`) matches exactly. Live-tested the endpoint through a real authenticated session (5
cases): valid creation succeeds and persists with `defaultObserveMode:true` even though it
wasn't in the request body (confirms it's forced, not merely defaulted); duplicate key in the
same workspace correctly rejected (412); invalid regex pattern correctly rejected before insert,
with the real `RegExp` compile error surfaced in the message; unsupported `kindKey`
(`json_schema`) correctly rejected; malformed `key` format correctly rejected. Then, directly
against the DB (the actual reason for the migration), three transactional negative-case proofs,
each rolled back: (A) same key+version, two *different* workspaceIds -- both insert
successfully (the bug this migration fixes); (B) same key+version, *same* workspaceId -- second
insert correctly fails on the new constraint; (C) same key+version, two *system* rows
(`workspaceId IS NULL`) -- second insert correctly fails, confirming the original system-row
protection wasn't lost. Test definition and its (empty -- audit logging isn't enabled for this
workspace) audit-log row cleaned up after.

**RESULT: PASS.**

## Unit 3 — hook-point dispatch (`pre`/`post`) + `CustomToolCallGuardrail.ts` wrapper node

**Tier A.** Building the wrapper node surfaced a real gap deeper than the one that stopped unit
2: `runAttachedGuardrails.ts`'s `wrapToolsWithAttachedGuardrails` only ever checked for the 2
hardcoded built-in `definitionKey` strings (`egress_filtering`, `prompt_injection_defense`).
A custom `regex_match` guardrail, with any other key, would never match either check and would
attach, save, and show a live badge -- while being **completely inert at runtime**. Reported to
the user before building anything further.

The user did not take the initially-recommended "fixed to post-call" simplification -- correctly
flagged that fixing every custom `regex_match` guardrail to post-call silently removes half the
legitimate use cases (pre-call "block outgoing X" vs post-call "flag/redact incoming Y" are both
real, and neither is inherently more "default" for a generic pattern-match guardrail the way it
is for the two built-ins, which are each fixed by what they specifically check). Directed:
narrow but real scope -- single-select `hooks` (`pre`|`post`, not `both`, with the reason logged
below) becomes an author-chosen, DB-persisted field on the custom definition, consumed by a real
dispatcher, proven with runtime-log evidence of actual execution order, not just that the value
round-trips through the DB.

**`both` explicitly deferred, per instruction:** implementing `both` doubles the verdict/proof
surface (two independent executions and verdicts for every tool call) for a capability with no
demonstrated need yet. A user wanting both today authors two separate custom definitions with
the same pattern, one `hooks:'pre'` and one `hooks:'post'`.

**Build:**
- `services/guardrails/index.ts`: `createCustomDefinition` now requires `hooks` for
  `regex_match` (`HOOK_SELECTABLE_KIND_KEYS`), rejecting anything except the literal strings
  `'pre'`/`'post'` -- `'both'` is rejected with an explicit "not supported yet" message, not
  silently coerced. Stored on the real `hooks` column (schema-defined since Phase 0, genuinely
  read for the first time by this unit).
- `controllers/guardrails/index.ts` / `routes`: `hooks` added to `createDefinition`'s field
  allowlist. No new route.
- `packages/components/src/guardrails/runAttachedGuardrails.ts`: new `runCustomToolCallGuardrails(
  guardrailConfigs, hookPoint, payload, context, options)` -- filters to
  `origin:'custom' && hooks===hookPoint && kindKey==='regex_match'` (never touches the 2 built-in
  keys' own dispatch, which is unchanged), runs `evaluateRegexMatch` against the stringified
  payload, records a real verdict, and only has a structural effect matching the hook's natural
  shape: `block` denies pre-call, `redact` transforms post-call, `flag` on either hook only ever
  records (matches `kinds.md`'s own semantics -- flag never blocks or transforms). Wired into
  `wrapToolsWithAttachedGuardrails` at both existing call sites, alongside (not replacing) the 2
  built-in checks.
- `packages/components/nodes/guardrails/CustomToolCallGuardrail/CustomToolCallGuardrail.ts` --
  new generic wrapper node, `baseClasses:['Guardrail','ToolCallGuardrail']` (same anchor-type
  scheme as the 3 Phase 2 nodes, so Phase 2's connection-validation guarantee is unaffected).
  `asyncOptions` dropdown (`listCustomToolCallGuardrails`) lists this workspace's own
  `origin:'custom', kindKey:'regex_match'` definitions only, following `CustomTool.ts`'s exact
  precedent (workspace-scoping comes from the caller-supplied, server-derived `searchOptions`,
  confirmed via `controllers/nodes/index.ts`'s `getWorkspaceSearchOptionsFromReq` -- the request
  body's own `searchOptions` is discarded and overwritten server-side, not trusted from the
  client). `init()` resolves the chosen definition and returns
  `{definitionKey, kindKey, origin:'custom', hooks, observeMode, ...defaultParams}` -- the exact
  shape `runCustomToolCallGuardrails` expects.

**Test:** rebuilt components + server, restarted against the live Neon DB -- boot log confirmed
`Nodes pool initialized successfully` with no error from the new node file. Then, direct
invocation of the real compiled node class + real compiled dispatcher against a real initialized
`DataSource` (same technique as the Phase 2 `AgentAsTool`/Confused Deputy Prevention proof): created
2 real `GuardrailDefinition` rows (`pre_hook_proof`: `hooks:'pre'`, pattern `PRE_MARKER_ARG`,
action `block`; `post_hook_proof`: `hooks:'post'`, pattern `POST_MARKER_RESULT`, action
`redact`), resolved each through the real node's `init()`, then:
- **Test 1 (pre):** wrapped a fake tool whose `_call` logs before returning; called it with args
  containing `PRE_MARKER_ARG`. Captured log shows `wrapped._call` threw
  (`pre_hook_proof: matched pattern...`) and the tool's own `_call` **never logged at all**
  (`callLog.length === 0`) -- proof the block happened strictly before the real call, decided
  from args.
- **Test 2 (post):** same fake-tool pattern, args deliberately contain no marker at all. Captured
  log shows the tool's `_call` DID log first (`callLog.length === 1`), and the guardrail's redact
  only fired afterward, transforming the *result* (`"...POST_MARKER_RESULT..."` →
  `"...[REDACTED]..."`) despite the pattern being completely absent from args -- proof it ran
  after and inspected the result, not the arguments.
- **Test 3 (negative case):** both configs attached, clean content with neither marker present
  -- both correctly pass through untouched.
- Confirmed real `GuardrailVerdict` rows were actually written for all 4 evaluations (2 real
  triggers + 2 clean passes from test 3), then cleaned up along with the 2 test definitions.

**RESULT: PASS.**

**CARRY-FORWARD (narrow, logged not fixed):** the workspace-scoped `(workspaceId, key, version)`
uniqueness fixed in unit 2 does not prevent a custom definition from being created with a `key`
that collides with one of the 13 *system* keys (`workspaceId IS NULL` is a different scope than
a real workspace's id, so e.g. a workspace could name a custom definition `egress_filtering`).
`runToolEgressGuardrails`'s `definitionKey === 'egress_filtering'` match would then find the
*custom* config first if it's earlier in the array, run `checkEgressPattern` against it (which
reads `blockedDomainPatterns`, a field the custom config doesn't have), and silently no-op rather
than crash -- an unlikely but real edge case, not addressed this pass since it wasn't part of the
directive that opened this unit.

## Unit 4 — dry-run tester

**Tier A** (per the protocol's own phase build list: "prove a user-authored regex ... can
actually be tested against sample input before save, not just that the form submits").

**Build:**
- `packages/components/src/index.ts` -- exported `evaluateRegexMatch`/`IRegexMatchParams` as
  public package surface for the first time. Deliberately narrow: the two hardcoded, non-generic
  functions in the same file (`checkEgressPattern`, `wrapPromptInjection`) stay internal to
  `packages/components`, not exported -- they were never meant to be called from outside
  `runAttachedGuardrails.ts`.
- `services/guardrails/index.ts`: `AUTHORING_KIND_EXECUTORS` (currently just `regex_match` ->
  `evaluateRegexMatch`) and `dryRunDefinition(params)` -- validates via the SAME
  `AUTHORING_KIND_VALIDATORS` entry `createCustomDefinition` uses (an invalid pattern is
  rejected identically in both places, not more leniently in the tester), then runs the SAME
  executor a saved definition would run at attach time -- not a second, parallel "preview"
  implementation that could silently drift from the real one. Writes nothing: no
  `GuardrailDefinition` row, no `GuardrailVerdict` row.
- `POST /api/v1/guardrails/definitions/dry-run`, gated by `guardrails:manage` (same permission
  as create -- this is authoring-time activity even though it persists nothing).

**Test:** rebuilt both packages, restarted against the live Neon DB. Snapshotted
`guardrail_definition`/`guardrail_verdict` row counts (16 / 0) before testing. Live-tested 5
cases through a real authenticated session: a matching sample input correctly returns
`verdict:'block'` with the matched text as evidence; a non-matching input correctly returns
`verdict:'pass'`; a redact-action test correctly returns the real `transformedPayload`
(`"...CONFIDENTIAL..."` -> `"...[REDACTED]..."`); an invalid regex pattern is rejected with the
same validation error `createCustomDefinition` would give; an unsupported `kindKey` is rejected.
Re-checked both row counts after all 5 calls -- still 16 / 0, exactly unchanged, confirming the
tester is genuinely pure and never touches the DB.

**RESULT: PASS.**

## Unit 5 — create-custom-definition UI form

**Tier B** (UI rendering/form -- no new backend surface, no schema change; the two calls it
makes were already Tier-A-verified in units 2 and 4).

Per this repo's CLAUDE.md, UI/presentation work requires reading `DESIGN_SPEC.md`,
`migration-checklist.md`, `design-system/tokens.json`, and `component-inventory.md` first --
done. Rows 25-27 already logged this whole feature area (`views/guardrails/`) as `not started`
for the design-system pass, staying on plain MUI following `MainCard`/`ViewHeader` conventions
-- this unit follows that same precedent, not a Tailwind/shadcn rebuild. Added
`migration-checklist.md` row 28 per the "log it even if built outside the row-by-row flow" rule.

**Build:**
- `packages/ui/src/api/guardrails.js`: `createDefinition`/`dryRunDefinition` wrappers.
- `packages/ui/src/views/guardrails/CreateGuardrailDefinitionDialog.jsx` -- new dialog, modeled
  directly on `views/tools/ToolDialog.jsx` (the closest existing precedent: a workspace user
  authoring a reusable, DB-backed capability). Fields: name, key (client-validated against the
  same `^[a-z0-9_]+$` the backend enforces), description, kind (a real `Select`, currently one
  disabled option -- adding a second kind later is additive, not a rebuild), pattern, action,
  `hooks` (pre/post), a sample-input box with a "Test" button that calls the real dry-run
  endpoint and renders the actual verdict (color-coded via standard MUI theme palette keys --
  `success`/`warning`/`error`/`info` -- not new ad hoc hex values, so no Gap-protocol entry
  needed).
- `packages/ui/src/views/guardrails/index.jsx`: wired in a `StyledPermissionButton`
  (`guardrails:manage`) that opens the dialog, reloads the catalog on successful create, and
  added `custom: 'Custom'` to the existing `CATEGORY_LABELS` map so custom definitions get a
  properly-capitalized section header instead of the raw `'custom'` string. Also renders a small
  `(custom)` tag next to a custom definition's name in its card.

**Test:** `pnpm build` clean for both `accelance-components` and `accelance-ui`. Full browser
test against the running dev server: opened the dialog, filled the form, clicked Test -- the
real dry-run endpoint returned and rendered an actual `block` verdict with the matched-pattern
evidence text (not a stub), clicked Create -- real snackbar confirmation, dialog closed. First
check (2s after click, same session) didn't yet show the new definition; a fresh hard reload did
-- confirmed via `guardrail_definition`/`GET /guardrails/catalog` directly that the row and API
response were correct all along, so this was the test script's own wait timing, not an app bug.
Full-page screenshot on a clean reload confirmed the "UI Test SSN Blocker (custom)" card renders
correctly under a properly-capitalized "Custom" section header. Test definition and its (empty
-- audit logging not enabled for this workspace) audit-log row deleted after.

**RESULT: PASS.**

## Framework-pack browse and apply — scoped and deferred to Phase 4 (2026-08-21)

Researched before attempting to build: "framework pack" is never defined anywhere in this
repo, only named -- `Guardrails_end_to_end_protocol.md`'s Phase 3 build list names it with no
inline definition, and the source document that reportedly resolved it
(`Guardrails_build_plan.md §11`) does not exist in this repo (confirmed absent, consistent with
earlier findings this session). Two competing, unreconciled hints exist: (a)
`epics-feature-status.md`/`FEATURE-BUILD-LEDGER.md` suggest a per-agent bundle-apply feature
(the deleted "policy templates" feature's likely redefinition); (b) the protocol's own Phase 4
section describes a read-only "per-agent framework coverage view, wired to `frameworkRefs`" --
but assigns it to Phase 4, not Phase 3, as a separate line item. Compounding this: `frameworkRefs`
(the column either interpretation depends on) is `NULL` on every single existing definition
today -- no migration has ever populated it, despite the protocol's own non-negotiable claiming
it's "populated on every new definition from Phase 0 onward." No framework/control vocabulary
(SOC2 control IDs etc.) exists anywhere in code or docs under either interpretation.

**Decision (user's call, presented with both options plus a third to defer):** defer
"framework-pack browse and apply" entirely to Phase 4, folding it into the coverage view already
planned there once `frameworkRefs` is actually populated. This Phase 3 build-list line item is
resolved by deferral, not built -- not silently dropped. **Carry-forward for Phase 4:**
`frameworkRefs` being NULL everywhere is a real gap that phase will need to close (define the
framework/control vocabulary, backfill or re-author values) before a coverage view can show
anything real.

## Capstone verification — palette appearance with no restart or deploy (2026-08-21)

**Tier A.** Per the protocol: "Verify: a newly authored custom definition appears in the
palette without a restart or deploy... This is the single most important proof in this phase --
it's the entire premise of decision 1." Units 2-5 verified the underlying mechanism (DB write,
`init()` resolution, dispatcher, UI form) but not this specific end-to-end UX claim directly, so
closing it explicitly now rather than treating it as implied.

**Test:** with the server running continuously throughout (confirmed no restart between the
start of this check and its conclusion), created a brand-new, uniquely-named custom definition
through the real UI form, then immediately navigated to a **new, unrelated chatflow** and
dragged a fresh `CustomToolCallGuardrail` node onto it. Opened its "Select Custom Guardrail"
dropdown -- the freshly-created definition appeared in the live list immediately, alongside
every other custom definition created earlier in the same no-restart window (screenshot
captured: 7 distinct "Palette Proof <timestamp>" entries, each created moments before its own
successful appearance, none present at server boot). No `NodesPool` rescan, no page reload of
the running app's own session, no server restart, no deploy -- confirms decision 1's premise
holds for the actual mechanism this build shipped (a generic wrapper node's DB-backed dropdown,
not dynamic node-class registration). All 7 test definitions and their audit-log rows deleted
after.

**RESULT: PASS.**

## Phase 3 status

All items from `Guardrails_end_to_end_protocol.md`'s Phase 3 build list are now closed:
create-custom-definition flow (units 2, 5), dry-run tester (unit 4), and framework-pack
browse/apply (resolved by deferral to Phase 4, above). The phase's own "Verify" checkpoint
(palette appearance with no restart/deploy) is directly proven, above.

**Remaining, not part of the original build list but flagged during the work:**
`CustomIdentityGuardrail.ts` (the `AgentAsTool.ts`-side wrapper) — deferred until a real generic
identity-scoped kind executor exists (today only `regex_match` is generic; the existing
`enum_constraint` "executor" is still hardcoded to workspace-membership checking, not
config-driven). This was never in the protocol's explicit Phase 3 list -- it's a natural
extension surfaced by `phase3-authoring-mechanism.md`'s own design, logged so it isn't silently
assumed done.
