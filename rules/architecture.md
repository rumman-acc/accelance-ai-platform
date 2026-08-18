# Envoy — Architecture

**Current state (as of 2026-07-22):** a single-service application — a Flowise 3.1.2 fork,
running in enterprise mode, on PostgreSQL (Neon). This document describes what actually
runs today, structured so a designer can turn it directly into a diagram for a senior
audience. It is not a proposal — nothing here should change without a separate decision.

For the full feature-by-feature build status and effort estimates, see
[`rules/epics-feature-status.md`](epics-feature-status.md). For a box-by-box comparison
against an external reference architecture, see
[`rules/architecture-reference-vs-accelance.md`](architecture-reference-vs-accelance.md).
This file is the standalone, presentation-ready version of "what we have," on its own.

---

## 1. Repository structure

One PNPM monorepo. One deployed service (`packages/server`) does everything — it serves
the built frontend, the REST API, and executes every agent flow in-process. Three other
packages are standalone, independently publishable libraries, not part of the running
service.

```
AI-Platform-Internal/                  # PNPM workspace
└── packages/
    ├── server/                        # Express + TypeORM — the one deployed service
    │   ├── src/routes/                # REST API: predictions, chatflows, admin, auth
    │   ├── src/services/               # Business logic (chatflows, credentials, evaluations...)
    │   ├── src/enterprise/            # Org/workspace/RBAC/SSO — enterprise auth layer
    │   ├── src/database/entities/     # TypeORM entities (ChatFlow, Credential, ApiKey...)
    │   └── src/utils/index.ts         # Flow-execution engine (buildFlow)
    │
    ├── ui/                            # React 18 + Vite — served BY packages/server, not standalone
    │   └── src/                       # Canvas, chat, marketplace, admin screens
    │
    ├── components/                    # 200+ node integrations (LLMs, tools, vector stores...)
    │   └── nodes/                     # Dynamically loaded by the execution engine at runtime
    │
    ├── shared/                        # TypeScript types only — no runtime code
    │
    ├── agentflow/                     # Standalone embeddable React lib — agent-graph editor
    │                                  # published independently, not imported by packages/ui
    ├── observe/                       # Standalone embeddable React lib — execution-trace viewer
    │                                  # published independently, not imported by packages/ui
    └── api-documentation/             # Standalone Swagger/OpenAPI docs service — separate process
```

---

## 2. Services

| Service | Tech | Port | Role |
| --- | --- | --- | --- |
| **`packages/server`** | Express.js + TypeORM | 3002 | The application. Serves the built React UI, the full REST API, enterprise auth (org/workspace/RBAC), and executes every flow by dynamically loading node implementations from `packages/components`. |
| `packages/api-documentation` | Express + Swagger UI | 6655 | Standalone OpenAPI docs viewer — informational only, not on the request path. |
| `packages/agentflow` (published npm lib) | React 18 | n/a | Embeddable agent-graph editor for use in external apps — not currently embedded anywhere in `packages/ui`. |
| `packages/observe` (published npm lib) | React 18 | n/a | Embeddable execution-trace viewer for use in external apps — not currently embedded anywhere in `packages/ui`. |

There is no separate frontend service, API gateway, or worker service today — one Node
process is the entire application.

---

## 3. Architecture layers

```
 ┌────────────────────────────────────────────────────────────┐
 │  Internet                                                   │
 │  Browser / API caller                                       │
 └───────────────────────────┬──────────────────────────────────┘
                              │  HTTPS
 ┌───────────────────────────▼──────────────────────────────────┐
 │  Application  ·  packages/server (Express)  ·  :3000 · Oracle Cloud VM │
 │  ── serves built React UI (static assets)                     │
 │  ── REST API: /api/v1/{predictions,chatflows,workspace,...}   │
 │  ── enterprise auth: JWT + session, org/workspace/RBAC         │
 └───────────────────────────┬──────────────────────────────────┘
                              │  in-process call
 ┌───────────────────────────▼──────────────────────────────────┐
 │  Execution Engine  ·  packages/server/src/utils/buildFlow      │
 │  ── walks the flow graph node-by-node                         │
 │  ── dynamically loads node implementations from                │
 │     packages/components (200+ integrations)                   │
 │  ── streams results back over SSE                              │
 └───────────────────────────┬──────────────────────────────────┘
                              │
 ┌───────────────────────────▼──────────────────────────────────┐
 │  Data                                                          │
 │  PostgreSQL (Neon, managed) — system of record, always on      │
 │  Qdrant (vector) — optional, per-flow, when RAG is configured  │
 │  Neo4j (graph) — optional, per-flow, when graph memory is used │
 └────────────────────────────────────────────────────────────────┘
```

**Coupling rule:** everything above the Data layer runs in one process. There is no
service-to-service HTTP call anywhere in the request path — the UI, the API, and the
execution engine share the same Node runtime and memory space. The only external network
calls a request makes are to the LLM provider, and — only if a flow is configured to use
them — Qdrant or Neo4j.

---

## 4. Platform features

### Core AI — from the Flowise OSS foundation (Apache 2.0, no build cost)

- Visual builder for single-flow Agents (route `/chatflows`) and multi-agent Agent Swarms (route `/agentflows`, drag-and-drop canvas) — renamed from "Chatflow(s)"/"Agentflow(s)" in the UI; the code-level identifiers (`chatflowId`, `agentflowId`, route paths) were deliberately left unchanged
- Multi-agent orchestration: supervisor/worker pattern, sequential state-machine agents, Agentflow V2 engine — user-facing as "Agent Swarm" (conditions, loops, human-input checkpoints)
- 200+ LangChain-based node integrations — chat models (30 providers, including self-hosted Ollama/LocalAI), embeddings, vector stores, document loaders, tools
- Flow execution engine with SSE streaming
- Document Store + vector search (RAG pipeline)
- Encrypted credential store + OAuth2 for tool auth
- Evaluations framework (LLM-as-judge, datasets, cost tracking)
- Marketplace: global templates + live "Save As Template" per-workspace
- Public prediction API, API keys, embeddable chat widget (`flowise-embed`)

### Platform features — built by Accelance on top

- Multi-tenant org → workspace hierarchy with RBAC and custom roles
- Enterprise auth: registration, login, invites, password reset (JWT + session)
- Encryption-key persistence and credential-loss prevention (self-healing key storage)
- Brand theme (colors, email templates) and rebrand of internal error/metric identifiers — now on the Envoy brand (Azure Blue `#0F74BD` / DeepBlue `#062667` / Vivid Green `#13BA2F`, `packages/ui/src/assets/scss/_themes-vars.module.scss`), superseding the earlier Accelance blue
- Pluggable storage provider (local / S3 / GCS / Azure / ImageKit)
- Control Tower: agent-health/execution overview dashboard, now the default landing page (`packages/ui/src/views/controltower/`, `packages/server/src/{controllers,routes,services}/control-tower/`), gated behind `executions:view`
- Composio catalog importer: search Composio's action catalog and import specific actions as first-class `Tool` rows, without writing a hand-built connector per action (`packages/server/src/{controllers,routes,services}/composio-catalog/`, `packages/ui/src/views/tools/ComposioImportDialog.jsx`) — see `rules/epics-feature-status.md` § 2 for details
- MCP registry browser: search the official public MCP registry and add any server (remote or local-process) directly to `CustomMcpServer`, no hand-written node per server (`packages/server/src/{controllers,routes,services}/mcp-registry/`, `packages/ui/src/views/tools/McpRegistryDialog.jsx`) — `CustomMcpServer` now supports both `url` and `stdio` transport types; see `rules/epics-feature-status.md` § 2 for details

### Not yet built or not yet configured

Tracked in full, with effort estimates, in
[`rules/epics-feature-status.md`](epics-feature-status.md) — highlights: Langfuse/metrics
tracing (built, not switched on), SSO (built, not configured), a centralized tool-call
governance layer, an admin/governance dashboard, audit logging, and true multi-org SaaS
mode (also built, gated behind a platform-mode switch).

---

## 5. Auth flow

```
First time:
  GET /register → fill org name, name, email, password
  POST /api/v1/account/register → creates: org + admin user (OWNER role) + default workspace
  → redirected to /signin
  → login → session cookie

Ongoing:
  Admin creates workspaces: POST /api/v1/workspace
  Admin invites users: POST /api/v1/account/invite (email sent with temp token link)
  User clicks invite link → /register?token=<tmp> → completes signup → MEMBER role
  Admin can promote to OWNER via workspace user settings
```

### Roles

| Role | Name in DB | Capabilities |
| --- | --- | --- |
| OWNER | `owner` | Full org + workspace control, user management |
| MEMBER | `member` | Limited org access |
| PERSONAL_WORKSPACE | `personal workspace` | Access to own personal workspace only |

### Platform mode

Set via `ACCELANCE_PLATFORM=enterprise` in `packages/server/.env`. Bypasses Flowise's
license check → forces `Platform.ENTERPRISE` in `IdentityManager`
(`packages/server/src/IdentityManager.ts` → `_validateLicenseKey()`). Unlocks `/register`,
`/signin`, workspace CRUD, user invites, custom roles.

**Update (2026-08-10, commit `93bff59`):** the one-organization-per-deployment lock has been
removed — `ensureOneOrganizationOnly()` no longer exists anywhere in the codebase. ENTERPRISE
mode now permits multiple organizations on one Envoy deployment, each with its own
workspaces, and (per commit `09d279e`) its own independently-configured SSO via slug-based
routing (`/o/:slug/login`, `organization.slug` column). What ENTERPRISE mode still lacks vs.
`Platform.CLOUD` is self-serve signup UI, Stripe billing, and quota enforcement (Stripe
billing scaffolding already exists in the codebase, unused) — see
`rules/epics-feature-status.md` for the full breakdown.

---

## 6. Key files

| File | Purpose |
| --- | --- |
| `packages/server/src/IdentityManager.ts` | Platform detection — patched for `ACCELANCE_PLATFORM` |
| `packages/server/src/enterprise/services/account.service.ts` | Registration, invite, login |
| `packages/server/src/enterprise/services/organization.service.ts` | Org management |
| `packages/server/src/enterprise/services/workspace.service.ts` | Workspace management |
| `packages/server/src/enterprise/services/workspace-user.service.ts` | User↔workspace roles |
| `packages/server/src/utils/index.ts` | Flow-execution engine (`buildFlow`) |
| `packages/server/src/utils/buildChatflow.ts` | Prediction request orchestration |
| `packages/server/src/enterprise/database/migrations/postgres/` | All DB schema migrations |
| `packages/server/.env` | Local config (gitignored) |
| `packages/server/src/DataSource.ts` | TypeORM connection config |

**Update (2026-08-11):** the flow-execution path now threads the triggering user's identity
(`userId`, from `req.user?.id`) end-to-end — `IExecuteFlowParams` → `executeFlow` → `buildFlow`
(`utils/index.ts`)/`buildAgentGraph`/`executeAgentFlow` (`buildAgentflow.ts`) → every node's
`init()`/`run()` options bag — and onto a new nullable `Execution.userId` column. Previously
`req.user` was read only at the HTTP route to resolve `workspaceId` and then discarded; no
execution-time code path knew who (if anyone — public/API-key-triggered runs have no principal)
triggered a given run. This is foundation-only plumbing for the 🔴 "agent principal model" /
"least-privilege per-agent tool allowlist" / "centralized tool-call policy" epics in
§2 of `rules/epics-feature-status.md` — no enforcement exists yet, this just makes the identity
available for those epics to consume.

**Update (2026-08-11, cont'd):** built on that plumbing — `CredentialAccess`
(`database/entities/CredentialAccess.ts`, `services/credential-access`) is a new explicit
per-user grant table for `Credential`, plus a `Credential.createdBy` owner column. Previously
`Credential` was scoped only by `workspaceId`; any workspace member with
`chatflows:update`/`credentials:update` could attach any teammate's credential to any flow with
no record of it. `hasAccess(userId, credentialId)` checks ownership, an explicit grant, or
cross-workspace sharing via the existing `WorkspaceShared` mechanism. A backfill migration grants
every current active `WorkspaceUser` access to their workspace's existing credentials so nothing
breaks on deploy; credentials created after this ships default to creator-only access. Still no
execution-time enforcement — `hasAccess()` is only consulted by the new non-blocking
`GET /chatflows/:id/credential-access-warnings` endpoint so far. Enforcement is the Phase 3
tool-call chokepoint in the same epic, not yet built.

**Update (2026-08-11, cont'd again):** added `AgentToolPolicy` (`database/entities/AgentToolPolicy.ts`,
`services/tool-policy`) — the least-privilege per-agent tool allowlist. Rows are keyed on
`(workspaceId, chatflowId, toolNodeName)`; `chatflowId` uses `''` as a "workspace-wide default"
sentinel rather than `NULL`, since two `NULL`s don't collide under a unique index and a sentinel
keeps exactly one default row enforceable across all four DB drivers this repo still migrates
(postgres/mysql/mariadb/sqlite). `evaluate()` does most-specific-match-wins (chatflow-scoped row
beats the workspace default) and defaults to allow when no row matches at all — deliberately
permissive so nothing breaks the moment this ships. CRUD routes live under `/tool-policy`, gated
by a new `tools:manage-policy` permission. Same as `CredentialAccess`: the grant model exists,
nothing at execution time consults it yet. Known coarseness, not a bug: composite tool nodes
like `AgentAsTool` (which lets one agent call another agentflow via its own fresh HTTP request to
`/api/prediction/:agentflowid`) are allow/deny as a whole under this scheme — a workspace can
block the `agentAsTool` node type for an agent, but not restrict which *target* agentflow it may
call. That also means the *called* agentflow's own principal check is unaffected by the caller's
identity, since the inner request authenticates via `agentAsTool`'s own credential, not the
original triggering user.

**Update (2026-08-11, final):** enforcement is now live — `evaluateToolCall`/`wrapToolWithPolicy`
(`packages/components/src/toolPolicy.ts`) wraps every tool instance's `_call` so a denial surfaces
as a normal tool-error observation through LangChain's own callback machinery (`handleToolError`),
not a bolted-on special case. **Correction to the two updates above:** actual tracing showed only
**two** tool-instantiation surfaces exist, not three. `packages/server/src/utils/index.ts`
`buildFlow`'s generic per-node `.init()` loop is where every real tool node (Gmail, Jira, custom
REST, ...) gets instantiated — and *every* flow type routes through it first: classic
single-agent, Multi-Agent, and Sequential Agents all call `buildFlow` before their own downstream
graph-building runs (confirmed via `sequentialagents/ToolNode/ToolNode.ts`, which receives
already-built `StructuredTool[]` instances via `nodeData.inputs.tools`, not raw config it
instantiates itself). AgentFlow V2's `Tool.ts` is the only genuinely separate surface, because its
underlying tool is selected dynamically at runtime from a dropdown rather than being its own node
in the graph. So the two wrap sites are: `utils/index.ts` `buildFlow` (right after
`newNodeInstance.init()`, gated on `category === 'Tools'`) and `Tool.ts`'s own `init()` call.
`buildAgentGraph.ts` needed no changes — it only consumes tool instances `buildFlow` already
wrapped. `ToolCallAudit` (new entity) logs every allow/deny; DLP content redaction was not built.

**Update (2026-08-17):** built the Guardrails & Compliance catalog on top of the `AgentToolPolicy`
pattern above, per a design discussion that settled two things first: (1) guardrails split into
`kind:'node'` (canvas-visible, position matters — e.g. Content Moderation) and `kind:'policy'`
(no canvas position, engine-enforced everywhere — e.g. PII redaction, the existing Tool Allowlist),
listed together in one catalog but handled differently in the UI; (2) true Compliance items (audit
log, data retention, certifications) are org/workspace admin settings, not agent-scoped, and were
explicitly kept OUT of this catalog — they don't fit the node/policy model. New entities
`GuardrailCatalogItem` (the DB-backed catalog itself — seeded by migration with 5 standard entries,
not hardcoded into `packages/components`, same reasoning as the MCP registry browser/Composio
importer) and `GuardrailPolicy` (per-workspace/per-agent enable state, same `chatflowId=''`
sentinel + most-specific-match-wins convention as `AgentToolPolicy`, except the no-match default is
OFF rather than permissive-allow, since a disabled guardrail isn't the kind of regression a
silently-blocked tool call would be). `services/guardrails` merges catalog + policy + a scan of the
chatflow's `flowData` node names into one effective-state view (`GET /guardrails/summary/:chatflowId`)
for the new canvas-side "Guardrails & Compliance" panel (`ui-component/extended/
GuardrailsCompliance.jsx`, a new group in `ChatflowConfigurationDialog`) and the shield-icon+count
badge in `CanvasHeader.jsx`. Tool Allowlist is surfaced in that summary read-only by querying the
existing `AgentToolPolicy` table directly rather than duplicating it into `GuardrailPolicy`. Real
enforcement was wired for exactly one new guardrail in this pass — **PII redaction**
(`utils/contentRedaction.ts`, regex-based: email/phone/SSN/card presets + custom pattern list from a
policy's config), called from `utils/addChatMesage.ts` before every chat message save, gated behind
the `pii_redaction` policy being enabled (off by default). Prompt-injection defense and topic/action
scoping are seeded into the catalog as `enforcementStatus:'planned'` for visibility only — their
policy toggle is disabled in the UI so enabling one can't silently do nothing. **Not built**: a
workspace-level admin screen for setting defaults (the `/guardrails/policy` endpoint already
supports omitting `chatflowId` to set one, just no dedicated UI page yet — only the per-agent canvas
view built here).

**Update (2026-08-17, cont'd):** built that missing workspace-level screen — `views/guardrails/index.jsx`,
routed at `/guardrails`, added to the sidebar under Studio (next to Tools) via `menu-items/dashboard.js`,
gated on the same `guardrails:view`/`guardrails:manage` permissions as the canvas panel. No new backend
routes were needed: it calls the existing `GET /guardrails/catalog` and `GET /guardrails/policy` (no
`chatflowId` → returns every policy row in the workspace, both the `chatflowId=''` workspace-wide rows
and every per-agent override) and filters client-side to the `chatflowId=''` rows for the "workspace
default" toggle state, while counting the non-`''` enabled rows per catalog key into an "Overridden by N
agents" chip — visibility into per-agent overrides without a new endpoint. Toggling here calls the same
`POST /guardrails/policy` with no `chatflowId`, which the service already treats as the `WORKSPACE_WIDE`
sentinel. Verified end-to-end in a real browser against the running dev server: toggled PII Detection &
Redaction's workspace default on (`chatflowId:""` in the request body, confirmed in the response) and
back off, chip updated correctly both times, zero console errors.

**Update (2026-08-17/18, batch 3 — real enforcement for the remaining six, plus Compliance):** a
`GuardrailCatalogBatch3Enforcement` migration flips `prompt_injection_defense`, `topic_action_scoping`,
`loop_recursion_detection`, `egress_filtering`, `confused_deputy_prevention`, and
`memory_rag_write_validation` from `enforcementStatus:'planned'` to `'enforced'`, each seeded with a
usable `defaultConfig` (no config-editing UI exists yet, so a workspace can only toggle these on/off,
not customize the specifics, until that ships). Real call sites, one new shared chokepoint plus four
existing ones extended: `packages/server/src/utils/preflightGuardrails.ts` is a new single pre-flight
check (`checkPreflightGuardrails`) called from `utilBuildChatflow` before any flow type executes —
covers Topic & Action Scoping (denied-topic keyword match against the question, configurable refusal
message) and a `spend_token_budgets` guardrail (a predictions-per-month proxy cap, not real $/token
metering, until Langfuse cost data is wired in — see §12 of `rules/epics-feature-status.md`) uniformly
across every flow type in one place. The same file's `resolveTrustedToolCallerUserId` implements
Confused-Deputy Prevention, called from `AgentAsTool.ts`: an inner `AgentAsTool` call's claimed
triggering-user id is only trusted as the execution principal if the guardrail is enabled AND that user
verifies as an active member of the target workspace — otherwise falls back to no principal (today's
existing, more restrictive default), never to trusting an unverified id. `packages/components/src/
toolPolicy.ts` gained `checkEgressFiltering` (blocks a tool call whose stringified arguments match a
blocked-domain pattern — seeded default is an SSRF baseline: loopback/link-local/metadata-endpoint
hosts) and `applyPromptInjectionWrapping` (wraps every successful tool-call result in explicit
`[UNTRUSTED TOOL OUTPUT]` delimiters before the LLM re-reads it), both invoked from the same
`wrapToolWithPolicy` chokepoint the tool-governance phase-0 work already built. `utils/buildAgentflow.ts`
reads `loop_recursion_detection`'s `maxSteps` (default 25) and halts an AgentFlow V2 execution once
exceeded. `services/documentstore/index.ts` checks `memory_rag_write_validation`'s pattern denylist
(empty by default — enforces nothing until an admin populates it) before a document-chunk write.

Also shipped in this pass, previously placeholder-only on `/compliance`: a new `AuditLog` entity +
`services/audit-log` + `routes/audit-log`, with write-path hooks from `controllers/guardrails`
(`guardrail_policy.upsert`), `controllers/tool-policy` (`tool_policy.upsert`), and
`controllers/chatflows` (`chatflow.delete`) — a first pass covering governance-relevant changes, not
literally every action yet. A daily cron job (`schedule/RetentionCleanup.ts`, `0 3 * * *`, started from
`index.ts`) deletes chat messages/executions/`ToolCallAudit` rows older than a configured window
(default 90 days each) for Data Retention Policy. `services/guardrails`' `applyDefaultPolicyTemplate`
applies one hardcoded bundle (currently just PII redaction) to every newly created workspace and
retroactively to an existing one when the `policy_templates` catalog entry is toggled on — Policy
Templates in name, but a single fixed bundle in scope today, not a general template editor.

**Documentation note:** this entire batch-3 pass shipped in the same commit as the batch-2 seed above
(`4e8adc8`), but `rules/epics-feature-status.md`'s own doc-update half of that commit captured the
batch-2 (`'planned'`, visibility-only) state and was never revised to match batch-3 before the commit
landed — so the tracking file spent a full day contradicting the code sitting right next to it in the
same commit. Caught and corrected 2026-08-18 by reading the migration content and call sites directly
rather than trusting the commit message. See `rules/known-issues.md` #015.

**Update (2026-08-12):** the AgentFlow V2 natural-language "Generate" feature
(`packages/server/src/services/agentflowv2-generator`, `packages/components/src/
agentflowv2Generator.ts`) had two real bugs, found by actually generating a flow and inspecting
the saved JSON rather than assuming the feature worked: (1) `generateSelectedTools` kept one
flat `selectedTools` array across the whole generation run and told the model to never reuse an
already-selected tool — this silently breaks any propose(agent)→approve(HITL)→execute
(toolAgentflow) flow, since the execute step needs to reuse whichever tool its proposing agent
already claimed, and was getting forced onto an unrelated one instead; (2) the master prompt had
no baseline instruction to gate write-capable tool calls behind human approval, so safety
structure only appeared when the user's own prompt spelled it out in detail — a vague prompt
would produce a fully autonomous, ungated agent. Fixed via: a deterministic graph lookup
(`findProposingAgentTools`) that reuses the proposing agent's tool directly instead of asking an
LLM to guess correctly; a new naming-convention tool-action-risk classifier
(`packages/components/src/toolActionRisk.ts`) feeding a non-optional safety rule into the
generation prompt; and a third pipeline phase, `validateAndRepairFlow`, running after tool
selection and edge cleanup — repairs empty `agentModel`/`llmModel` fields (the LLM's phase-1
graph output inconsistently omits these; there is no separate model-selection call to catch it
otherwise) and returns `warnings: string[]` on the response for anything it can't safely
auto-fix (e.g. a write-capable tool with no HITL node anywhere in the flow). One structural
finding worth remembering: `getAllAgentflowv2Marketplaces()` strips `node.data` from every
few-shot template before it reaches the prompt (`agentflowv2-generator/index.ts:134-139`) — the
generating model never sees which tool/model any example node used, only graph layout. Fixing
tool-selection behavior via a better example template is therefore structurally impossible in
this pipeline; it has to be fixed in the deterministic/prompt logic, which is why the fix took
the shape it did.

**Update (2026-08-12, cont'd):** `findProposingAgentTools` initially only walked 1-2 hops back
(direct agent, or agent→HITL-gate), matching the exact shape the first bug reproduced with. A
second real generation run produced a *different* shape for the same intent — the execute step
was a full `agentAgentflow` node rather than a `toolAgentflow`, and its immediate predecessor was
a tool-less `llmAgentflow` "draft the action" step, with the actual tool-bearing agent one hop
further back, before a `conditionAgentAgentflow` read/write split. That run happened to come out
correct anyway (the underlying model ignored its own "don't reuse" instruction), which is not a
guarantee — the same unfixed flaw was still there, just not triggered that time. Generalized the
walk into a proper backward BFS that keeps traversing through non-gate intermediate nodes until
it finds the nearest upstream `agentAgentflow` with tools already selected, and applied the same
deterministic reuse to the `agentAgentflow`-as-executor case (simpler than the `toolAgentflow`
case here, since there's no single-tool constraint — the full set gets copied, no LLM call
needed at all when a proposer is found).

**Update (2026-08-12/13):** two more gaps found via live testing, both in the same
`agentflowv2Generator.ts` pipeline. (1) `validateAndRepairFlow`'s model-forcing step only handled
`agentAgentflow`/`llmAgentflow` — it missed `conditionAgentAgentflow` (the router/condition-agent
node), which has its own `conditionAgentModel`/`conditionAgentModelConfig` fields; extended the
`MODEL_FIELD_BY_NODE_NAME` map to cover it. (2) Much larger: phase-1 generation
(`generateNodesEdges`) only ever produces graph *shape* — its own `NodeDataType` zod schema caps
`data` to `{label, name}` — and phase-2 (`generateNodesData`/`initNode`) then overwrites every
node's `inputs` with the component's own generic schema defaults, regardless of what the flow is
actually for. For most node types this is a silent quality gap (an `agentAgentflow` ships with an
empty `agentMessages` system prompt and just runs on its label + tools). For
`conditionAgentAgentflow` it's a hard crash: its default `conditionAgentScenarios` is two blank
`{scenario: ''}` entries and `conditionAgentInstructions` is `''`, and the node's own runtime
correctly refuses to classify against that and errors immediately. Fixed by adding two new
per-node LLM content-generation calls inside `generateSelectedTools` (same pattern as its existing
tool-selection calls): one for `conditionAgentAgentflow` nodes that derives the branch count/order
directly from the node's own outgoing edges (`${node.id}-output-N` sourceHandle suffix — reliable
because edges, unlike node.data, aren't stripped from the few-shot templates) and asks the model
for a scenario per branch plus routing instructions; one for `agentAgentflow` nodes that asks the
model for role-specific system instructions given the node's label, position, and selected tools.
`validateAndRepairFlow` gained a matching backstop warning if a router's scenarios/instructions
are still blank after generation (model error/unparseable response/zero matched branches), so a
guaranteed-to-crash node is surfaced before the user hits it mid-run rather than after.

---

## 7. Deployment

| Environment | How | Notes |
| --- | --- | --- |
| Production (current) | `DEPLOY_ORACLE.md` — Oracle Cloud Always Free ARM VM, Docker Compose | Runs `docker compose up --build -d`; single container, Neon-hosted Postgres |
| Docker (alternative) | Root `Dockerfile`, `node:24-alpine` | Single image containing server + UI + components |
| Optional queue mode | `docker/docker-compose-queue-*.yml` | BullMQ + Redis worker pool for parallel execution — opt-in, not the default path |
| CI/CD | `.github/workflows/` — 8 pipelines | Lint/build/test/Cypress e2e, Docker image build+push (Docker Hub, AWS ECR), publish pipelines for `packages/agentflow`/`packages/observe` |

---

## Open item: no user-journey document exists yet

There is currently no written user-journey flow for the Envoy platform itself anywhere
in this repo (`rules/` was checked in full). If one is wanted for the same senior
presentation this file is meant to support, that would be new documentation to write, not
something to locate.
