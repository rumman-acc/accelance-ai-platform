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

## Next units (not yet built)

- Dry-run tester (Tier A: prove a user-authored pattern can be tested against sample input
  before save).
- Framework-pack browse and apply — not yet scoped in detail.
- A create-custom-definition UI form (the endpoint has no frontend yet).
- `CustomIdentityGuardrail.ts` (the `AgentAsTool.ts`-side wrapper) — deferred until a real
  generic identity-scoped kind executor exists (today only `regex_match` is generic; the
  existing `enum_constraint` "executor" is still hardcoded to workspace-membership checking).
