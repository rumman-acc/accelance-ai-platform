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

**Not covered by this pass**: `AgentAsTool.ts`/Confused Deputy Prevention's equivalent
live-trigger proof (steps 5/6 only exercised Egress Filtering via `ToolAgent.ts`) and the
existing-flow regression check (confirming an already-saved flow using the pre-Phase-2
`ToolAgent.ts`/`AgentAsTool.ts` version still loads without data loss, only showing the
outdated-node sync warning). Both are mechanically the same pattern already proven here and
carry low residual risk, but were not separately executed.
