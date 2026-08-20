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

Typecheck (`tsc --noEmit`) and lint (`eslint`) are clean across all new/modified files as of
this writing. **Live verification (rebuild, restart, palette check, drag/connect/configure,
save/reload persistence, observe-mode shadow-verdict proof, promote-and-block proof, existing-
flow regression check) has not yet been run** — see the plan document's Verification section
for the exact remaining checklist. Do not treat Phase 2 as signed off until that list is
actually run against a live dev instance, per this project's standing evidence-over-assertion
practice.
