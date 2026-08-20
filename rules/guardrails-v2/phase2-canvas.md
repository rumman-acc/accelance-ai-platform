# Guardrails v2 — Phase 2 (Canvas), as-built

Written after implementation, not before, because the approved plan was corrected twice
mid-build once the underlying mechanisms were verified directly against the code rather than
assumed. Both corrections are logged here so a future reader doesn't have to reconstruct them
from `git log`. The approved plan document itself
(`C:\Users\Mohd Rumman\.claude\plans\validated-yawning-whisper.md`, tracked outside this repo,
not this file) was also updated in place to match.

## Correction 1 — host node: AgentFlow V2 → classic agents

The approved plan targeted AgentFlow V2 (`packages/components/nodes/agentflow/Tool/Tool.ts`,
`agentflow/Agent/Agent.ts`) as the host nodes for a new `guardrails` anchor. Mid-implementation,
an exhaustive grep across every AgentFlow V2 node file found **zero typed-connection anchors of
any kind** — every input's `type` is a primitive (`string`/`number`/`boolean`/`options`/
`array`/`asyncOptions`); tools are picked by name from a dropdown and dynamically instantiated,
with no canvas "attach a child node via a handle" concept anywhere in this node category. This
isn't a workaround-able gap — the entire design (`guardrails` anchor + connection validation +
drag-and-drop attach) depends on a mechanism AgentFlow V2 simply does not have.

Classic agent nodes do have it: `packages/components/nodes/agents/ToolAgent/ToolAgent.ts`
already ships `tools` (`type:'Tool', list:true`) and `inputModeration`
(`type:'Moderation', list:true`) anchors with real resolution behind them.

**Resolution:** host nodes are `ToolAgent.ts` (v2.0→2.1) and
`packages/components/nodes/tools/AgentAsTool/AgentAsTool.ts` (v1.0→1.1), not `Tool.ts`/
`Agent.ts`. AgentFlow V2 is untouched by Phase 2.

## Correction 2 — node synthesis: DB-driven (no file) → 3 static physical files

The approved plan's "merged nodes API" assumed a `GuardrailDefinition` DB row could be
synthesized into an `INode`-shaped object with no file on disk, injected into `getAllNodes`'s
response at request time (`nodeSynthesis.ts`, never built).

Traced directly how a classic node's typed `list:true` anchor actually resolves at runtime,
rather than assuming the DB-synthesis approach would slot into it:
- `packages/ui/src/views/canvas/index.jsx` writes a literal `` `{{${sourceNodeId}.data.instance}}` ``
  string into the anchor's `inputs[]` array at connection time, when the flow is saved.
- `packages/server/src/utils/index.ts`'s `resolveVariables`/`getVariableValue` (called from
  `buildFlow`) resolves that string at execution time by finding the node in `reactFlowNodes`
  and reading `.data.instance` — populated by that node's own `.init()` result, run earlier in
  the same topological pass.
- This requires the connected node to be `componentNodes[name]`-resolvable, which only happens
  for a real file scanned by `NodesPool` at server startup. A DB-only row is never in that map.
- Classic node `options` (the bag passed into `init()`/`run()`) also carry **no raw
  `reactFlowNodes`/edges** — confirmed by reading the fixed, enumerated list of keys `buildFlow`
  actually puts there — so there was no way to resolve a DB-only node by an alternate route
  either (unlike AgentFlow V2, which does thread `options.previousNodes`/`reactFlowNodes` for
  its own, unrelated reasons).

**Resolution:** 3 real, physical component files —
`packages/components/nodes/guardrails/{EgressFiltering,PromptInjectionDefense,
ConfusedDeputyPrevention}.ts` — written to the exact convention `SimplePromptModeration.ts`/
`OpenAIModeration.ts` already use: static `inputs[]`, `init()` returns a plain object (not a
LangChain-typed instance). Confirmed safe because the same trace showed classic anchor
resolution does zero shape validation on what `.init()` returns — whatever lands in
`.data.instance` is pushed into the array as-is, left entirely to the consuming node
(`ToolAgent.ts`, `AgentAsTool.ts`) to interpret.

**What this means going forward, stated explicitly so it isn't silently assumed solved:**
- The "merged nodes API"/`nodeSynthesis.ts`/`getAllNodes` DB-merge piece from the original
  plan is **dropped entirely**, not deferred — no server-side merge code was written or is
  needed, since real files are already served by the existing `/nodes` endpoint.
- `GuardrailDefinition` DB rows remain the read-only catalog source of truth for the
  `/guardrails` browser page only. They are **unrelated** to what's droppable on canvas as of
  this phase — a definition row existing in the catalog does not imply a matching canvas node
  exists, and vice versa (only 3 of 13 seeded definitions have one).
- **Dynamic, DB-driven node registration (a `GuardrailDefinition` row becoming a real,
  droppable canvas node with no code changes) remains entirely unbuilt.** This is a hard
  prerequisite for any future Phase 3 "author your own guardrail" flow — user-created
  guardrails have no physical file under this design and never will unless that mechanism is
  built. Do not assume Phase 2 solved this; it deliberately did not attempt to.

## Scope actually shipped

- `egress_filtering`, `prompt_injection_defense` attach to `ToolAgent.ts` via its new
  `guardrails` anchor; wired via `wrapToolsWithAttachedGuardrails` in `prepareAgent`, wrapping
  every tool this agent calls.
- `confused_deputy_prevention` attaches to `AgentAsTool.ts` via its new `guardrails` anchor;
  wired via `runAgentAsToolIdentityGuardrails` right before the existing
  `x-original-user-id` header logic in `init()`.
- All 3 default `observeMode: true` (decision 5, applied identically to this new mechanism).
- This is fully independent of Phase 1's legacy `GuardrailPolicy`/`isPromoted()` toggle path,
  which is **not** wired into `ToolAgent.ts` at all (deliberately not backported — Phase 1
  never ran there; adding it now would be undiscussed scope creep for this pass).

## Verification status

**Live verification completed 2026-08-20, on the real dev instance and real dev DB** (not
mocked). Typecheck/lint clean throughout. Evidence for each step:

1. **Rebuild + restart**: `packages/components` built clean; server restart's boot log showed
   `Nodes pool initialized successfully` with zero errors/warnings referencing any of the 3 new
   nodes, `ToolAgent`, or `AgentAsTool` (one pre-existing, unrelated Couchbase native-binding
   error appears on every boot regardless of this change).
2. **Palette check**: a real classic canvas's node picker, searched for "Guardrail", showed a
   "Guardrails" category with all 3 nodes and their correct descriptions/icons.
3. **Drag, connect, configure, save, reload**: built a real test chatflow ("Phase2 Guardrails
   Verify") with Egress Filtering attached to a `ToolAgent`'s new `guardrails` anchor,
   configured `blockedDomainPatterns`. Confirmed via direct DB query of the persisted
   `flowData` that the node, its config, and the edge all round-tripped correctly — critically,
   confirmed `toolAgent_0.data.inputs.guardrails` persists as `["{{egressFilteringGuardrail_0
   .data.instance}}"]`, the exact anchor-resolution placeholder format the classic build path
   expects. Re-opening the chatflow and a full browser F5 reload both re-rendered the node,
   edge, and config identically (`react-flow__node` count 2, `react-flow__edge` count 1 in
   both cases).
4. **Runtime resolution check**: added temporary debug logging to `runToolEgressGuardrails`,
   rebuilt, and captured a real tool-call execution. Confirmed `guardrailConfigs` arrives as a
   real resolved array (`isArray: true`) containing the exact object `EgressFiltering.ts`'s
   `init()` produces (`{"definitionKey":"egress_filtering","kindKey":"regex_match",
   "observeMode":true,"blockedDomainPatterns":["phase2-verify.example.com"]}`) — not node ids,
   not `undefined`, not a LangChain-shaped instance. Instrumentation removed after capture;
   `runAttachedGuardrails.ts` is byte-for-byte identical to the committed version again.
5. **Observe-mode shadow-verdict proof**: with a real Anthropic/OpenAI/Gemini-model-backed
   agent (Calculator tool, real LLM call — every credential in this workspace was tried, most
   were dead; Gemini with a corrected model name worked), triggered a tool call whose argument
   matched the blocked pattern. `guardrail_verdict` went from 0 rows to 2 rows
   (`verdict:'block'`, `observeMode:true`, `nodeId:'toolAgent_0'` — the real host node's id, the
   per-node granularity this table exists for), while the chat transcript confirms the
   Calculator tool call itself still succeeded ("I don't know how to do that" — its own
   response to a non-numeric input, not a guardrail error) — shadow mode holds.
6. **Promote-to-block proof**: flipped this one node instance's `observeMode` to `false`
   (confirmed scoped to this attachment via direct DB check, not workspace-wide), re-sent the
   identical input — the chat transcript now shows the tool call itself returned "Egress
   Filtering: blocked a reference to \"phase2-verify.example.com\"", and the new
   `guardrail_verdict` row has `observeMode:false`. Flipped back to `observeMode:true`, re-sent
   again — the tool call succeeded normally again ("I don't know how to do that"), with the
   corresponding verdict row back to `observeMode:true`. Promotion is real, per-node, and
   reversible.

## Follow-up verification (2026-08-20, same day, after initial sign-off review)

A review pass on the initial verification asked for two more things before treating Phase 2
as fully signed off, on the grounds that "same mechanism, low risk" had already been wrong
once this build (the AgentFlow V2 host-node assumption) and shouldn't be trusted twice without
checking. Both were run.

### 7. `AgentAsTool.ts` / Confused Deputy Prevention proof

**Not a live chat trigger** — stated plainly, because it's a real, deliberate difference from
steps 4-6 above, not an oversight. Two independent blockers made a live UI trigger impractical:
- The "block" scenario for this guardrail specifically requires a claimed identity that is
  **not** an active workspace member. A live browser session run by a genuine, valid member
  (which any session driving this verification necessarily is) can never produce that input —
  there is no way to "become" an invalid user through the normal chat UI. Testing the block
  path at all requires supplying the claim directly, not routing it through a live session.
- Separately, building a live `AgentAsTool` fixture hit real UI infrastructure friction
  unrelated to the guardrails code: the "Select Agent" async-options loader
  (`AgentAsTool.ts`'s `listAgentflows`) returned `[]` for an entire build attempt before the
  cause was found — the fixture had silently landed in "Personal Workspace" (the last-active
  workspace from an earlier, unrelated test in this same pass, which persists server-side per
  account) while the target agentflow lived in "Default Workspace"; `listAgentflows` is
  correctly workspace-scoped, so it legitimately found nothing to list.

Given both, verification instead directly invoked the real, compiled
`runAgentAsToolIdentityGuardrails` (`packages/components/dist/src/guardrails/
runAttachedGuardrails.js`) against a real `DataSource` connected to the live dev DB (via
`packages/server/dist/DataSource.js`, same entities, same `GuardrailVerdict`/`WorkspaceUser`
tables) — the identical function classic `AgentAsTool.ts` calls, exercised with the exact
`guardrailConfigs` shape `ConfusedDeputyPrevention.ts`'s `init()` produces
(`{definitionKey:'confused_deputy_prevention', kindKey:'enum_constraint', observeMode}`), just
supplied directly rather than resolved from a live canvas. Four cases, each writing and then
verified via a real `GuardrailVerdict` row:

| Case | claimedUserId | observeMode | `isTrusted` returned | verdict recorded |
|---|---|---|---|---|
| 1. Shadow, valid member | real, active user | `true` | `false` | `pass` |
| 2. Promoted, valid member | real, active user | `false` | `true` | `pass` |
| 3. Promoted, non-member (**the real block case**) | `00000000-…-000000000000` | `false` | `false` | `block`, reason: "claimed user … is not an active member of this workspace" |
| 4. Shadow, non-member | `00000000-…-000000000000` | `true` | `false` | `block` |

Case 1 confirms decision 5 (observe-first) applied correctly to a "grant" action: even a claim
that verifies successfully gets no real trust while unpromoted. Case 2 confirms promotion
genuinely grants trust once verified. Case 3 is the actual "block" proof the live path couldn't
produce. Case 4 confirms shadow mode still computes and records the correct decision without
enforcing it. All 4 test verdict rows were deleted after verification (0 → 4 → 0).

**PASS**, by this standard — real compiled code, real DB, real verdict writes — but explicitly
not a live chat/UI-driven trigger the way steps 4-6 were. That distinction is real, not
cosmetic, and is why it's called out rather than folded into the pass/fail summary silently.

### 8. Existing-flow regression check

No real chatflow in this database uses `toolAgent` or `agentAsTool` at all except one — a
workspace's `Sample-test01`, which turned out to be unrelated pre-existing broken test data
(every node has `position: null` and `type: null`, created 2026-08-05, crashes the canvas on
load under **either** code version — confirmed by loading it under the pre-Phase-2 code first).
Not a usable baseline.

Built a clean substitute instead: a real chatflow (`ToolAgent` + `Calculator` + `BufferMemory`
+ `Anthropic Claude`, no working credential — deliberately irrelevant, since the regression
question is about the code path reaching the same failure point, not about getting a
successful model response) saved under the **pre-Phase-2** `ToolAgent.ts` (temporarily restored
via `git checkout fd57784 --`, rebuilt, server restarted on that build). Triggered it — result:
`Error: Anthropic API key not found`, thrown downstream of `prepareAgent()`, same as it would
be with a real pre-existing flow.

Restored the current Phase 2 code (`git checkout HEAD --`, rebuilt, restarted), reopened the
**same saved chatflow** (not rebuilt, not resaved) and re-triggered the identical input.
Result: **byte-identical** `Error: Anthropic API key not found`. Node count (4) and edge count
(3) unchanged. The canvas showed the expected "Sync Nodes" warning icon and toolbar button
(confirming the version-mismatch UI engaged correctly) while still rendering the node's old,
pre-Phase-2 schema (no "Guardrails" row) until an explicit sync — no forced upgrade, no data
loss, no crash.

**PASS.** An absent `guardrails` field (as every pre-existing flow has, since the field never
existed before this change) does not alter behavior — same error, same point of failure, same
persisted shape, before and after. Test fixture deleted after verification.

## Sign-off

With both follow-up items passing, Phase 2 is signed off as of 2026-08-20: all 8 verification
steps (6 original + 2 follow-up) have direct, DB- or log-confirmed evidence, not inference from
a clean typecheck. The two corrections made mid-build (host node, node synthesis) and the one
explicitly-labeled non-live test (item 7) are the honest record of what shipped and how it was
checked — nothing here should be read as "same mechanism, assumed fine" without the evidence
line next to it.

## Phase 2 remaining scope — Connection validation (2026-08-20, per `Guardrails_end_to_end_protocol.md`)

Before this unit, all 3 guardrail nodes and both host anchors declared the same generic
`type:'Guardrail'`, so `isValidConnection` (plain type-string matching, no category/
`allowedHosts` awareness) would have let `Egress Filtering`/`Prompt-Injection Defense` wrongly
attach to `AgentAsTool.ts`'s anchor, and `Confused Deputy Prevention` wrongly attach to
`ToolAgent.ts`'s — nothing rejected it structurally.

**Fix:** gave each node a second, specific `baseClasses` entry — `ToolCallGuardrail` for
`EgressFiltering.ts`/`PromptInjectionDefense.ts`, `IdentityGuardrail` for
`ConfusedDeputyPrevention.ts` — and changed each host anchor's declared `type` to match only
the one it should accept (`ToolAgent.ts` → `ToolCallGuardrail`, `AgentAsTool.ts` →
`IdentityGuardrail`). No new validation code — this reuses the exact type-matching
`isValidConnection` already does for every other typed anchor in the codebase.

**Live-tested, 4 cases, before/after edge count on a real canvas:** Egress Filtering →
`ToolAgent` guardrails succeeded (valid); Confused Deputy Prevention → `ToolAgent` guardrails
was rejected (invalid); Confused Deputy Prevention → `AgentAsTool` guardrails succeeded
(valid); Egress Filtering → `AgentAsTool` guardrails was rejected (invalid). All 4 correct.
(One false-negative on the first pass was a node visually overlapping the source handle,
confirmed via `elementFromPoint` and fixed by spreading nodes apart before retrying — not a
validation bug.)

This satisfies the *behavior* `allowedHosts` was meant to drive, structurally rather than by
reading the DB column at runtime — consistent with Phase 2's static-physical-node-file
pattern. `allowedHosts`/`hooks` on the 3 in-scope `guardrail_definition` rows remain
unpopulated and unread; see the 2026-08-20 update in `definition-schema.md`.
