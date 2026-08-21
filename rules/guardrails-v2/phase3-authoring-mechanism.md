# Guardrails v2 — Phase 3 authoring mechanism, re-confirmed before starting

Required by `Guardrails_end_to_end_protocol.md`'s Phase 3 gate: "Restate, in writing, how a
user-created custom guardrail will become a draggable canvas node given that static physical
files are now the proven mechanism and dynamic `componentNodes` registration was deferred, not
built... If dynamic registration is now required, that is new scope, size it before building
anything else in this phase."

This restates the mechanism, grounded in direct code verification (not assumption), and flags
one real design detail it surfaces that Phase 3's build must account for.

## The fork, restated

Phase 2 shipped 3 guardrail node types as static physical `.ts` files under
`packages/components/nodes/guardrails/`, scanned once by `NodesPool` at server boot. The
originally-planned "DB-synthesized node, no physical file" mechanism was dropped entirely for
Phase 2 (see Correction 2 in `phase2-canvas.md`) because it's structurally impossible on this
codebase's classic build path — a node must be `componentNodes[name]`-resolvable, which requires
a real file `NodesPool` scanned at boot.

Phase 3's premise (decision 1: "a newly authored custom definition appears in the palette
without a restart or deploy") therefore cannot mean "each user-authored definition becomes its
own new node class." That was never possible under this codebase's architecture, Phase 2 or not.

## Verified: no dynamic node-class registration exists anywhere in this codebase

Confirmed directly against the code, not inferred:
- `packages/server/src/NodesPool.ts` — `initialize()` does one `require()`-based directory scan
  at process startup (`packages/server/src/index.ts` and `commands/worker.ts` are the only two
  call sites). No file-watcher, no cron re-scan, no public reload method exists anywhere in
  `NodesPool.ts` or its callers.
- `GET /api/v1/nodes` (`services/nodes/index.ts`) serves the palette from that same in-memory
  `componentNodes` map, cached, explicitly commented as safe because the map "is populated once
  and never mutated afterward." The UI's palette (`AddNodes.jsx`) is fed from exactly this
  snapshot via Redux (`SET_COMPONENT_NODES`).

This forecloses "dynamic registration" as Phase 3's mechanism. It is not new scope to size --
it was never available scope to begin with, on this architecture, and building it (a live
`require()`/module-loader hot-reload path into a running Node process) would be a materially
larger and riskier undertaking than anything else in this build. Not proposed.

## What already exists instead, and is the real mechanism: generic wrapper + DB-selected behavior

Two real precedents in this codebase already solve "a user creates a new capability through a
form, with zero new files, and it's usable immediately" -- verified directly:

- **`CustomTool.ts`** (`packages/components/nodes/tools/CustomTool/CustomTool.ts`): one physical
  node class. Its `selectedTool` input is `type:'asyncOptions', loadMethod:'listTools'`, which
  queries the DB *at flow-build time* (not boot) for the workspace's custom `Tool` rows. `init()`
  resolves the chosen row into a real `DynamicStructuredTool` built from that row's stored
  name/description/schema/function. A new custom tool, created purely via a UI form and a DB
  insert, is usable the moment it's saved -- no `NodesPool` involvement at all, because it was
  never a node class; it's data selected by one preexisting generic node.
- **`CustomMCP.ts`** (`packages/components/nodes/tools/MCP/CustomMCP/CustomMCP.ts`): same
  pattern, config supplied as a JSON blob instead of a DB row.

**Phase 3's mechanism: the same pattern, applied to guardrails.** A user-authored custom
`GuardrailDefinition` row (`origin:'custom'`, `workspaceId` set -- both columns already exist on
the entity today, added in Phase 0 specifically for this) is *never* a new node class. It is a
DB row selected, at flow-build time, through a generic wrapper node's `asyncOptions` dropdown,
exactly like `CustomTool`'s `selectedTool`. Zero new physical files per user-authored
definition, ever -- matching decision 1's "no restart, no deploy" promise exactly, because that
promise was never about dynamic *node* registration; it's about dynamic *definition* selection
inside an already-registered generic node, which this codebase already does, twice, for tools
and MCP servers.

## One real design detail this surfaces, not previously resolved

Phase 2's connection-validation fix (`phase2-canvas.md`, "Connection validation" section) is
**structural and static**: each of the 3 guardrail nodes declares a specific `baseClasses` entry
(`ToolCallGuardrail` / `IdentityGuardrail`) at the class level, and `isValidConnection` rejects a
wrong-host attachment purely by matching those declared type strings -- before any config is
set, at drag-time.

A single generic `CustomGuardrail.ts` node (one class, all custom definitions) cannot carry a
single static `baseClasses` value that's correct for every definition a user might select --
some user-authored guardrails will be tool-call-scoped, others identity-scoped, and that's only
known *after* the definition is chosen, which happens after the node is already dropped and
wired under today's `asyncOptions`-dropdown-inside-a-dropped-node pattern. Applying `CustomTool`'s
pattern naively would mean either accepting an overly-permissive static type (breaking Phase 2's
structural guarantee) or bolting on a new after-the-fact "validate once configured" check the
rest of the model doesn't otherwise need.

**Resolution, decided here rather than left for Phase 3 mid-build to rediscover:** two generic
wrapper nodes, not one -- `CustomToolCallGuardrail.ts` (`baseClasses:['Guardrail',
'ToolCallGuardrail']`, attaches only to `ToolAgent.ts`'s anchor) and
`CustomIdentityGuardrail.ts` (`baseClasses:['Guardrail','IdentityGuardrail']`, attaches only to
`AgentAsTool.ts`'s anchor). Each one's `asyncOptions` dropdown is server-filtered to only the
user's custom definitions whose `kindKey`/category matches that wrapper's host category, so a
user can never even select a mismatched definition -- preserving Phase 2's drag-time structural
guarantee exactly, at the cost of exactly one extra physical file (still zero files per
user-authored definition, still fully consistent with decision 1).

This is a design decision being surfaced now, not a request to expand scope: two generic files
instead of one is a trivial addition to what Phase 3 already has to build (the create-definition
form, the dry-run tester), not new categories of work.

## What this means for Phase 3's actual build list

No change to the phase's stated scope (create-custom-definition flow, framework-pack browse and
apply, dry-run tester). The one addition: build `CustomToolCallGuardrail.ts` and
`CustomIdentityGuardrail.ts` (two small generic node files, following the `CustomTool.ts`
pattern) as part of "create-custom-definition flow," each with a server-side-filtered
`asyncOptions` `loadMethod`. The Phase 3 exit criterion ("a newly authored custom definition
appears in the palette without a restart or deploy") is satisfiable exactly as originally
promised -- the definition doesn't newly *appear in the palette* at all; the two generic wrapper
nodes are always in the palette, and the definition appears inside their dropdown the moment
it's saved, which is the real, already-working mechanism this codebase uses for custom tools and
MCP servers today.

## Sign-off

Fork resolved. Dynamic `componentNodes` registration is confirmed not required and not proposed.
Phase 3 may proceed using the generic-wrapper-node pattern above.
