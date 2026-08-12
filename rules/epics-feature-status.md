# Accelance Platform — Feature Inventory & Build Roadmap

Epic-by-epic inventory of the agentic platform: what Accelance already has from the Flowise
fork, what exists in code but has never been switched on, and what's genuinely still to
build — checked directly against the code in this repo (`packages/components`,
`packages/server`) and the actual `.env` in use, not assumed. Each epic also carries a
**Reference Pattern** column — the equivalent component or design pattern as it shows up
across the broader enterprise-agentic-platform landscape (LangGraph/LangSmith, Langfuse,
n8n, Salesforce Agentforce, watsonx Orchestrate, Microsoft 365 Copilot, AWS AgentCore, and
similar), so a feature is never scoped in a vacuum.

Purpose: this is the working roadmap for turning the current Flowise-based fork into the
full-fledged application — what to configure now, what to build, and roughly how much
effort each item takes, so nothing gets rebuilt that already exists and nothing real gets
missed.

Status legend: ✅ Done & configured · 🟡 Built, not configured · 🔴 To be built

Note on "🟡 Built, not configured": this covers two different kinds of remaining work and
they should not be conflated when scoping engineering effort. Some rows (e.g. Queue mode,
SSO, tracing nodes) still need wiring/testing work. Others — notably native tool nodes
(Gmail, GDrive, Jira, MS Teams/Outlook, Composio, custom MCP) — are 100% engineering-complete;
the only remaining step is a per-deployment operational task (registering an OAuth app with
the provider and setting the resulting client id/secret/env vars), not further development.
Treat those as an ops/deployment checklist item, not a dev backlog item, when planning
sprints.

Columns: **Epic** · **Status** · **Accelance evidence** (file/path in this repo, or "none") ·
**Reference Pattern** (the comparable component/pattern from the wider agentic-platform
field)

---

## 1. Core Orchestration & Agent Execution

| Epic | Status | Accelance evidence | Reference Pattern |
| --- | --- | --- | --- |
| Agentflow V2 (Agent, Condition, Loop, Iteration, ExecuteFlow nodes) — user-facing as "Agent Swarm" | ✅ Done | `packages/components/nodes/agentflow/` | LangGraph-style supervisor/services/task agent orchestration |
| Multi-agent Supervisor/Worker pattern | ✅ Done | `nodes/multiagents/{Supervisor,Worker}` | Same supervisor/worker orchestration pattern |
| Sequential Agents (explicit State-machine style) | ✅ Done | `nodes/sequentialagents/{Agent,Condition,LLMNode,Loop,State,ToolNode}` | Formal state-machine loop driver (RECEIVED → ... → DONE) — the kind of thing most from-scratch builds spend real effort designing |
| Classic single agents (ToolAgent, ReAct, XMLAgent, OpenAI Assistants, LlamaIndex) | ✅ Done | `nodes/agents/` | Single-agent execution tier |
| Classic Chains (LLMChain, ConversationalRetrievalQAChain, ApiChain, SqlDatabaseChain, GraphCypherQAChain, etc.) | ✅ Done | `nodes/chains/` (11 chain types) | Not commonly named as a first-class layer elsewhere — bonus capability |
| AI-assisted agent generation from a prompt/spec | ✅ Done | `packages/server/src/services/agentflowv2-generator` | "SOP-document → agent" style generation (watsonx-style pattern) |
| Agent Library/Registry (reusable, standalone Agent entity independent of a specific flow) | 🔴 To be built — planned, not started (2026-08-11) | none — agents inside an Agent Swarm (`nodes/agentflow/Agent/`) are inline JSON in that flow's `ChatFlow.flowData` blob, not independently addressable; `Assistant` entity is the unrelated OpenAI Assistants wrapper; `AgentAsTool` only reuses whole flows, not individual agent nodes. **Plan**: new `Agent` entity (`id, name, description, workspaceId, config JSON, version, createdBy`) + `/agents` list page (mirrors Tools page conventions) + "Save to/Load from Agent Library" actions on the Agentflow V2 Agent node, snapshot-based (not live-linked — editing a library entry doesn't retroactively change flows already using it; bound nodes get an explicit Sync action). Snapshot approach means **zero flow-execution-engine changes** — the library is purely an authoring/governance layer, since a bound node's `data.inputs` is still plain JSON at runtime. Est. ~4 days (entity+CRUD ~1d, list page ~1d, canvas save/load/sync UX ~1–1.5d, QA ~0.5d). Live-sync mode, Worker/Sequential-agent node support, and a "who uses this Agent" impact view are phase 2 (~2–3d), not MVP. **Open question before locking the schema**: `feature/tool-governance-phase-0-identity` is already threading per-user `CredentialAccess` grants through flow execution — a first-class `Agent` entity may be the right place to scope credential access per-agent (add `agentId` to `CredentialAccess`) rather than per-flow; decide with that epic's owner before phase 1 ships, to avoid a breaking migration later | Agent marketplace/registry pattern (Agentforce Agent Library, watsonx Orchestrate skill catalog) — needs a new `Agent` entity + list page + reference-vs-inline binding on the Agent node |

## 2. Tool / Integration Execution Layer

| Epic | Status | Accelance evidence | Reference Pattern |
| --- | --- | --- | --- |
| Native tool nodes (Gmail, GDrive, Jira, MS Teams/Outlook, Composio, MCP, custom REST) | 🟡 Built, not configured | `packages/components/nodes/tools/` | Built-in tool/connector library |
| Market-gap native additions (2026-08-11, per `AskUserQuestion` scoping against the market-research gap analysis) — CRM: Salesforce, HubSpot; PM/docs: Notion, Linear (MCP); comms: Discord, Twilio; data: Airtable; e-sign: DocuSign; e-commerce: Shopify; dev/infra: Sentry (MCP), Figma (MCP); browser automation: Browserbase (MCP) | 🟡 Built, not configured | 7 direct connectors under `nodes/tools/{Salesforce,Hubspot,Discord,Twilio,Airtable,Docusign,Shopify}/` + matching `credentials/*Api.credential.ts`; 5 MCP servers under `nodes/tools/MCP/{Notion,Linear,Sentry,Figma,Browserbase}/`. Added to `NATIVE_CONNECTOR_NAMES` in `packages/ui/src/store/nativeToolsClassification.js` so they surface on the Native Connectors / Native MCP Servers tabs. Salesforce/DocuSign use a pre-obtained-token credential rather than a full interactive OAuth2 flow (simpler, avoids the instance-URL/account-base-URI discovery step a real OAuth2 grant would need) — upgrading those two to full OAuth2 like Gmail is a reasonable future enhancement, not done here. Figma's credential *is* full OAuth2 (`figmaOAuth2`) since Figma's remote MCP server only accepts OAuth, not PATs — this has NOT been verified against a live Figma OAuth app; flag for real-world testing before relying on it. Icons for all 12 are simple placeholder monogram SVGs (brand-colored badge + initial), not official logos — swap for real brand assets before wide use. Requires `pnpm build` in `packages/components` (or a dev-server restart) to actually load into a running node pool | Rounds out the connector library against Composio/Zapier/MCP-ecosystem "default stack" gaps identified in the market scan |
| Encrypted per-node credential store + OAuth2 | ✅ Done (mechanism) | `services/credentials`, `routes/oauth2` | OAuth/token/secret management for tools |
| Centralized tool-call policy enforcement | 🟡 Built, not DLP | `wrapToolWithPolicy`/`evaluateToolCall` (`packages/components/src/toolPolicy.ts`), wired into the two real tool-instantiation surfaces — `utils/index.ts` `buildFlow` (covers classic single-agent, Multi-Agent, and Sequential Agents, since all three instantiate tool nodes through this one shared loop) and AgentFlow V2's `Tool.ts` — plus `ToolCallAudit` logging every allow/deny. Commits on `feature/tool-governance-phase-0-identity`. Enforces the allowlist (`AgentToolPolicy`) and per-user credential grants (`CredentialAccess`) live; DLP content redaction was never built — everything past "may this tool/credential run" (field-level masking, regex rules on tool input/output) is still 🔴 | Per-action runtime authorization tied to IdP/DLP/compliance policy, with audit logging — worth building directly on the existing credential/tool-node model rather than adopting a third-party tool-governance vendor for what's ultimately a policy layer, not new integrations |
| Custom MCP tool support | 🟡 Built, not configured | `CUSTOM_MCP_SECURITY_CHECK`, `CUSTOM_MCP_ALLOWED_ENV_VARS` | MCP as the standard tool-context protocol |
| Tools list UI shows native tool nodes (not just custom tools + custom MCP servers) | ✅ Done | `views/tools/index.jsx` now has 5 tabs: Custom Tools, Custom MCP Servers, **Native Tools**, **Native Connectors**, **Native MCP Servers**. The 3-way native split is a curated classification (no DB/node field distinguishes "generic capability" vs "named connector") maintained in `store/nativeToolsClassification.js` — `NATIVE_CONNECTOR_NAMES` lists the 12 node names treated as named third-party connectors (Gmail, GDrive, Jira, Outlook/Teams, AWS, Stripe, Composio); everything else in the `Tools` category is a Native Tool; everything in `Tools (MCP)` (minus the custom-mechanism nodes) is a Native MCP Server. Each card shows per-workspace configuration status via `useNativeToolsCatalog.jsx`. Anyone adding a new native node must add its name to `NATIVE_CONNECTOR_NAMES` if it's a named-service connector, or it defaults to Native Tools | Integrations/marketplace tab listing built-in connectors with per-workspace configuration status |
| Save custom MCP server from canvas into the global `CustomMcpServer` list | ✅ Done (URL-based servers only) | `NodeInputHandler.jsx` — "Save to My MCP Servers" button next to the `Custom_MCP` node's config editor, opens `CustomMcpServerDialog` (extended to accept ADD-mode prefill) writing into `CustomMcpServer`. Stdio command-based configs (no `url` key) are explicitly rejected with a message, since the `CustomMcpServer` entity only models remote URL/SSE servers — not a limitation of this fix, but of the underlying schema | "Save as reusable connector" affordance, same shape as the existing Custom Tool save flow |
| Tool/node catalog performance at 1000+ scale (virtualization, lazy-loaded schemas, debounced search) | 🟡 Partially built (2026-08-11) | **Done**: `AddNodes.jsx` — the canvas node picker's per-category list is now `react-window`-virtualized (`FixedSizeList`, 72px rows, capped at 350px viewport height so one huge category scrolls internally instead of rendering thousands of DOM nodes); `Accordion` now sets `TransitionProps={{ unmountOnExit: true }}` so collapsed categories' nodes aren't mounted at all (previously ALL categories' nodes were always in the DOM regardless of expand state — the actual biggest cost at scale); the search-filter timer is now a real debounce (was a bug: `setTimeout` with no `clearTimeout`, so fast typing stacked multiple overlapping 500ms-delayed scoring passes — now properly cancels the previous timer, 250ms). `NativeToolsTab.jsx` (Tools page) now paginates client-side via the existing `TablePagination` component instead of rendering the full filtered set in one CSS grid. **Not done**: none of this is server-paginated yet — `/nodes/category/:name` and `useNativeToolsCatalog.jsx` still fetch the *entire* category in one response; that's fine at today's ~62-node catalog but will need cursor-based pagination + a lightweight list-view schema (id/name/icon/category only, full input schema fetched on-demand) once real aggregator-scale sources (Composio/Pipedream fully configured, or an MCP registry browser) are added — see the two catalog-breadth items below | Standard large-catalog UX pattern (virtualized list + paginated/lazy server-side catalog for aggregator-scale tools, e.g. Composio/Zapier-class integration counts) |
| **Product direction (2026-08-11, explicit call):** native connector breadth is the primary catalog strategy — the platform should natively cover "all the nodes and tools" itself (hand-built connectors + native MCP servers), not rely on aggregators as the main path. Composio stays in the catalog as one supplemental option, not the strategy. **Custom Tool (user-authored JS function) is a last resort** — for a genuinely bespoke/internal application with no possible pre-built connector — not the default way ordinary SaaS integrations get built. This reverses the framing of the row below (previously pitched as "fastest path to breadth") — Composio/Pipedream configuration is now optional/supplemental, not prioritized over expanding the native library | n/a | n/a | n/a |
| Composio + Pipedream aggregator nodes (supplemental, not primary) | 🟡 Built, not configured | `nodes/tools/Composio/Composio.ts`, `nodes/tools/MCP/Pipedream/PipedreamMCP.ts` — both already in the catalog. Configuring these is optional breadth on top of the native library, not a substitute for it per the product direction above | One supplemental aggregator option among many, not the catalog-breadth strategy |
| Native connector library — batch 2 (2026-08-12, per explicit "platform should have all the nodes and tools" product direction) | 🟡 Built, not configured | Batch 1 (2026-08-11): Salesforce, HubSpot, Discord, Twilio, Airtable, DocuSign, Shopify + Notion/Linear/Sentry/Figma/Browserbase MCP servers — see the market-gap row above. **Batch 2 (2026-08-12), all 27 built**: Support/ticketing — Zendesk, Intercom, Freshdesk; Project/PM — Asana, Trello, Monday.com (GraphQL API), ClickUp; Marketing/email — Mailchimp, SendGrid, Klaviyo; Comms — Zoom (Server-to-Server OAuth), Telegram, WhatsApp Business (Meta Cloud API); Dev/infra — GitLab, Bitbucket, CircleCI, Vercel, Datadog, PagerDuty; Finance/accounting — QuickBooks, Xero; Cloud storage — Dropbox, Box, OneDrive (Microsoft Graph OAuth2, reuses the `MicrosoftOutlookOAuth2`-style credential shape); Data/analytics — Segment, Amplitude, Mixpanel. Snowflake, BigQuery, and Google Meet were deliberately dropped from the original 30-item shortlist: the first two are SQL warehouses better served by this platform's existing SQL-chain nodes than a REST-tool wrapper, and Google Meet has no standalone API (meetings are created via Google Calendar's API, already a separate existing connector) — building either would have been a bad fit forced to match the pattern, not a real gap. All 27 follow the Jira.ts/core.ts pattern (DynamicStructuredTool + zod schemas + secureFetch); QuickBooks/Xero use the same pre-obtained-token simplification as Salesforce/DocuSign (Xero's tokens are notably short-lived, ~30 min, with no refresh handling built); all added to `NATIVE_CONNECTOR_NAMES` in `nativeToolsClassification.js`. Verified together: `tsc --noEmit`, `eslint`, and a full `packages/components` build (icons confirmed landing in `dist/`) all pass clean; zero node/credential name collisions. Not yet configured with real credentials, not yet tested against live APIs — same "built, not configured" caveat as every other native tool node in this table | Matches the "cover the common SaaS surface natively" direction rather than funneling everything through aggregators |
| MCP registry browser (browse/add from a public directory of community MCP servers without a hand-written node per server) | 🔴 To be built | none — adding a new MCP-backed integration today means either a hand-written native MCP node (`nodes/tools/MCP/*`) or a user manually pasting server config into the generic Custom MCP node. No UI exists to browse a public registry (official MCP registry, Smithery, Glama, etc.) and one-click-add a server as a `CustomMcpServer` row. Plan drafted 2026-08-11 (see conversation) — a real security conflict was found: the existing Custom MCP validation blocks the `npx -y` flag pattern that nearly all community stdio-based MCP servers actually use, so registry-sourced installs need a distinct, more-permissive trust tier (with an explicit install-time warning) or most entries won't work — decision pending | The actual long-term mechanism for "generic MCP connectors at scale" — real breadth without an engineer writing a node per integration, complementary to (not a replacement for) the native-first direction above |
| Native connector library — batch 3 / market-gap round 2 (2026-08-12): Azure, Microsoft 365/Graph beyond Outlook/Teams/OneDrive, Anthropic/OpenAI ecosystems, other enterprise "big fish" | 🟡 Built, not configured | All 13 built: **Azure** — Azure Blob Storage, Azure Key Vault, Azure DevOps, Entra ID (Azure AD) (all 4 via Azure AD app service-principal client-credentials OAuth2, fresh token per call, no caching); **Microsoft Graph delegated** — SharePoint, Excel Online, Planner (all 3 reuse the `MicrosoftOutlookOAuth2`-style delegated OAuth2 credential shape + Gmail's `getCredentialData`→`refreshOAuth2Token`→`getCredentialParam('access_token', ...)` pattern); **ITSM/identity** — ServiceNow (OAuth2 client-credentials against the instance's own token endpoint), Okta (`SSWS` custom auth scheme), Confluence (reuses the existing `confluenceCloudApi` credential from the document-loader feature — no duplicate credential created), Jira Service Management (reuses the existing `jiraApi` credential, hits the separate `/rest/servicedeskapi/` surface); **LLM-as-sub-agent** — Claude (Sub-Agent) and GPT (Sub-Agent), a new connector *kind*: each wraps the Anthropic Messages API / OpenAI Chat Completions API as a callable tool another agent can invoke mid-flow, reusing the existing `anthropicApi`/`openAIApi` credentials (confirmed via research that neither vendor publishes a broad enterprise-tool MCP catalog worth wrapping instead). All 13 follow the Jira.ts/core.ts pattern (`DynamicStructuredTool` + zod schemas + `secureFetch` + `TOOL_ARGS_PREFIX`/`formatToolError`); zero credential duplication (3 of 13 deliberately reuse pre-existing credentials instead of creating new ones); all 13 added to `NATIVE_CONNECTOR_NAMES` in `nativeToolsClassification.js`. Verified together: `tsc --noEmit`, `eslint`, and a full `packages/components` build all pass clean; zero node/credential name collisions across the batch. Confirmed via research: Azure Cognitive Search and Snowflake are both better served by this platform's existing RAG/SQL-chain nodes (reinforces the earlier Snowflake/BigQuery exclusion, doesn't overturn it); SAP/Workday are real but high-cost/low-near-term-ROI (negotiated API access, complex OAuth2+SCIM) — deliberately deferred, not forgotten. Not yet configured with real credentials, not yet tested against live APIs — same "built, not configured" caveat as every other native tool node in this table | Rounds out enterprise-tier coverage (identity, ITSM, Microsoft ecosystem, LLM-as-tool) that batches 1–2 didn't reach |
| Dynamic tool infrastructure — "save any generated tool to the database, fetch it later" | 🟡 Partially built (2026-08-12) | **Done**: `OpenAPIToolkit` node (`nodes/tools/OpenAPIToolkit/OpenAPIToolkit.ts`) can now save any selected endpoint straight into the same `Tool` table the "Custom Tools" tab already manages — a new `exportSelectedEndpointsAsTools` loadMethod flattens the endpoint's path/query/body parameters into the `Tool` entity's existing flat schema format (`convertSchemaToZod`-compatible) and generates a `fetch`-based `func` body (same `require('node-fetch')` pattern `OpenAPIToolkit/core.ts`'s own `defaultCode` already uses), reusing the exact same `Tool` entity + `CustomTool` node + `toolsApi.createNewTool` + `ToolDialog` infra that already exists — **zero new entity, zero new node type, zero schema migration**. Frontend: a "Save to My Tools" button next to the node's "Available Endpoints" field (`NodeInputHandler.jsx`), calling the loadMethod via the existing `/node-load-method/:name` route (same plumbing the async-options dropdowns already use) then looping `toolsApi.createNewTool` per selected endpoint. Parameter names that aren't valid JS identifiers get sanitized to a safe fallback (`param1`, `param2`, ...) consistently in both the saved schema and the generated code, with the real API parameter name preserved in the description and in the actual HTTP call — verified this mapping doesn't silently diverge (an early version of this fix had exactly that bug, caught before shipping) via a standalone generated-code test (syntax-validated with `vm.Script`, inspected the request shape by hand). `tsc`, `eslint`, and full builds of both `packages/components` and `packages/ui` all pass clean. **Why this matters**: most Azure services (and many other REST APIs) publish real OpenAPI specs — point `OpenAPIToolkit` at one, save the 3-5 endpoints actually needed, done, no hand-written connector required. **Not done**: the Composio catalog importer (see next row) — the harder half of "don't build 2000+ tools by hand, let users import only what they need" | Reuses 95%+ of existing infra rather than inventing a parallel dynamic-tool system — the generic execution engine (`DynamicStructuredTool` in `OpenAPIToolkit/core.ts`, driven entirely by `{name, description, schema, baseUrl, method, headers}` data) already existed; this closes the "not saved anywhere reusable" gap around it |
| Composio catalog importer (browse/search Composio's 2000+ actions, import only the specific ones a user picks as first-class named `Tool` rows, instead of one generic "Composio" node with everything crammed into it) | 🔴 To be built — API researched, not started | Composio's real API confirmed via research 2026-08-12 (see conversation/agent output for exact endpoints once implementation starts) — the plan: use Composio purely as a catalog/schema source and execution proxy (it already holds each end-user's real per-service OAuth tokens, so we never need to collect Gmail/Slack/etc. credentials ourselves for imported actions); user browses/searches Composio's action catalog (reusing the virtualized list-rendering work from the catalog-performance row above), picks specific actions, each import becomes its own `Tool` row whose generated `func` calls Composio's execute-action endpoint with the user's connected-account reference baked in. Directly answers the "2000+ Composio tools, don't want to hand-build them, don't want one node with everything crammed in" concern — each imported action shows up as its own searchable, named tool, exactly like a hand-built connector would, with zero engineering effort scaling with catalog size | The direct fix for "adding tools should be saved in the database and fetched" as it applies to Composio specifically — same underlying `Tool`-table mechanism as the OpenAPIToolkit row above, different catalog source |

## 3. Memory, Knowledge & RAG

| Epic | Status | Accelance evidence | Reference Pattern |
| --- | --- | --- | --- |
| Vector stores (16+ providers incl. Qdrant) | 🟡 Built, not configured | `nodes/vectorstores/` | Vector database layer |
| Document Store (chunking/ingestion pipeline) | 🟡 Built, not configured | `services/documentstore` | Data ingestion pipeline / "Data Products" |
| Document loaders (30+ ingestion sources) | ✅ Done | `nodes/documentloaders/` | Ingestion connectors |
| Record Manager (dedup / incremental re-indexing) | ✅ Done | `nodes/recordmanager/{MySQL,Postgres,SQLite}` | Not commonly named as a standalone layer elsewhere |
| Graph database (Neo4j + GraphCypherQAChain) | 🟡 Built, not configured | `nodes/graphs/Neo4j`, `nodes/chains/GraphCypherQAChain` | Knowledge-graph memory — a purpose-built graph-native option, generally stronger than cramming graph data into a relational store |
| LLM response caching (semantic/exact) | 🟡 Built, not configured | `nodes/cache/{InMemory,Redis,Upstash,Momento}` | Caching services layer |
| Memory node types (buffer/summary/Zep/Mem0/etc., 12 total) | ✅ Done | `nodes/memory/` | Short-term/working memory |

## 4. Model Access & Cost Tiering

| Epic | Status | Accelance evidence | Reference Pattern |
| --- | --- | --- | --- |
| Provider-agnostic LLM access (29 chat-model providers incl. OpenAI, Anthropic, Bedrock, Vertex, Watsonx, Groq, Mistral, Ollama, LiteLLM, LocalAI, etc.) | ✅ Done | `nodes/chatmodels/` | Provider-agnostic LLM/model access layer — see Q3 below |
| Embedding providers (16) | ✅ Done | `nodes/embeddings/` | Same model-access layer |
| Model tiering (cheap/critic model vs. frontier model) | 🟡 Available per-flow, not policy-enforced | configurable per node, no platform-wide rule | Tiered model routing (frontier / standard / light) |
| Model allow/deny-listing | 🟡 Built, not configured | `MODEL_LIST_CONFIG_JSON`, `DISABLED_NODES` env vars | Model governance / allowlisting |

## 5. Observability & Tracing

| Epic | Status | Accelance evidence | Reference Pattern |
| --- | --- | --- | --- |
| Langfuse / LangSmith / Arize / Phoenix tracing nodes | 🟡 Built, not configured | `nodes/analytic/{LangFuse,LangSmith,Arize,Phoenix}` | LLM observability / tracing layer |
| Prometheus / OpenTelemetry metrics | 🟡 Built, not configured | `packages/server/src/metrics/{Prometheus,OpenTelemetry}.ts` | Platform metrics/monitoring |
| Custom observability SDK | ✅ Done (exists) | `packages/observe` (separate top-level package) | No common equivalent — bonus |
| Cost/usage dashboards per workspace | 🔴 To build | none | Per-project/user cost & usage analytics with budgets |
| Drift detection | 🔴 To build | none | Behavior-drift monitoring |

## 6. User, Access & Multi-Tenancy Management

| Epic | Status | Accelance evidence | Reference Pattern |
| --- | --- | --- | --- |
| Org → Workspace → RBAC hierarchy | ✅ Done & configured | `enterprise/rbac`, `enterprise/services` | Nested org/workspace/project tenancy |
| Custom roles | ✅ Done | `/api/v1/role` | Custom role definitions |
| SSO (Auth0 / Azure AD / Google / GitHub) | 🟡 Built, not configured | `enterprise/sso/` | SSO/SAML with enforced-SSO |
| API keys | ✅ Done | `routes/apikey` | Scoped API keys — a per-endpoint-scoped, expiring version is a further-hardening option, not a gap |
| Service accounts (non-human identities scoped to a project) | 🔴 To build | none found | Service-account identity model |
| ABAC / resource tagging | 🔴 To build | none | Attribute/tag-based access control |
| **Multi-org platform mode (true multi-tenant SaaS)** | 🟡 **Partially enabled** | Org-creation lock removed in Enterprise mode (`93bff59`); per-org SSO via slug routing added (`09d279e`); billing/quota enforcement (`StripeManager.ts`, `UsageCacheManager.ts`, `LICENSE_QUOTAS`) still gated behind `Platform.CLOUD`, unused — see Q2 below | Full SaaS onboarding: any org self-registers, billed and quota-capped independently |

## 7. Infrastructure, Scaling & Environments

| Epic | Status | Accelance evidence | Reference Pattern |
| --- | --- | --- | --- |
| Single-service deployment on managed Postgres | ✅ Done & configured | `rules/architecture.md` (Neon) | Managed API gateway/backend |
| Queue mode / BullMQ parallel workers | 🟡 Built, not configured | `MODE=queue`, Redis (Upstash) URL already in `.env` | Stateless run-driver/worker pool over a shared queue |
| Dev/staging/prod environment separation | 🔴 To build | none | Environment-per-tier separation |
| Multi-region / high availability | 🔴 To build (not needed at current scale) | none | Multi-region + HA |

## 8. Human-in-the-Loop (HITL)

| Epic | Status | Accelance evidence | Reference Pattern |
| --- | --- | --- | --- |
| Real execution checkpoint — pause/resume with proceed/reject decision | 🟡 Built, not used in any flow | `nodes/agentflow/HumanInput` | HIL control & feedback checkpoint — one of the most emphasized capabilities across enterprise agent platforms |
| HIL policy (which actions require approval vs. run autonomously) | 🔴 To build | none — the mechanism exists, no policy has been defined | A named gate matrix (which action types always pause: external writes, comms, irreversible actions) |
| Approver inbox / review UI | 🔴 To build | none | Dedicated HIL inbox screen |
| Node-level retry/resume after a genuine execution error (tool/schema failure, not a HumanInput pause) | 🔴 To build | none — confirmed empirically: a failed tool call lands the execution on `FINISHED`/`ERROR` with the failure embedded in that node's data; `ExecutionDetails.jsx` has no retry action for this case, only the Proceed/Reject path for `STOPPED` HumanInput pauses | Partial-run resume from the last successful node — most agent platforms distinguish "paused for a human" from "failed mid-run" and support resuming both |

## 9. Guardrails & Safety

| Epic | Status | Accelance evidence | Reference Pattern |
| --- | --- | --- | --- |
| Content moderation (OpenAI Moderation API, deny-list) | 🟡 Built, not configured | `nodes/moderation/{OpenAIModeration,SimplePromptModeration}` | Content/toxicity guardrail |
| Prompt-injection defense (trusted vs. untrusted content separation) | 🔴 To build | none — only a manual deny-list exists | Untrusted-content delimiting; instruction-origin rule (goals accepted only from authenticated requests, never from content an agent merely reads) |
| PII detection & redaction | 🔴 To build | none — only incidental GDPR account-deletion code | PII scan/redaction on logged/stored content |
| Topic/action scoping (bound exactly what an agent may do) | 🔴 To build | none | "Topics & Actions" style scoping |

## 10. Compliance & Data Governance

| Epic | Status | Accelance evidence | Reference Pattern |
| --- | --- | --- | --- |
| Audit log (who did what, when, to what) | 🔴 To build | none | Append-only audit trail across agent/tool actions |
| Data retention policy (TTL/cleanup for logs, messages, traces) | 🔴 To build | none — data accumulates indefinitely today | Configurable retention tiers |
| Compliance certifications / data residency (SOC2, GDPR, HIPAA) | 🔴 To build (lowest priority until contractually required) | none | Certifications — largely an audit/business process, not just code |
| Policy templates applied platform-wide | 🔴 To build | none | Standard rule sets applied to every agent automatically |

## 11. Security & Permission Model

| Epic | Status | Accelance evidence | Reference Pattern |
| --- | --- | --- | --- |
| Encrypted secrets at rest | ✅ Done & configured | `utils/index.ts` `getEncryptionKey()`, `SECRETKEY_OVERWRITE` | Secrets management |
| Production security toggles (HTTP/OAuth2 checks, path-traversal safety, trust-proxy) | 🟡 Built, not configured | left on defaults in `.env` | Standard hardening checklist |
| Agent principal model (an agent only ever exercises the acting user's own delegated grants) | ✅ Done | `CredentialAccess` + `services/credential-access`, `Credential.createdBy`, `userId` threaded through the execution path, now **enforced** at runtime via `evaluateToolCall` (`packages/components/src/toolPolicy.ts`), wired into both real tool-instantiation surfaces (`utils/index.ts` `buildFlow`, AgentFlow V2 `Tool.ts`) — commits on `feature/tool-governance-phase-0-identity`. No-principal runs (public chatbot/API-key) skip this check by design, per the locked-in rollout decision | Least-privilege, per-user-delegated tool execution |
| Least-privilege per-agent tool allowlist | ✅ Done | `AgentToolPolicy` + `services/tool-policy`, **enforced** at the same chokepoint as above — commits on `feature/tool-governance-phase-0-identity`. CRUD routes under `/tool-policy` (`tools:manage-policy` permission). Coarse by design — keyed on toolNodeName, so composite nodes like `agentAsTool` are allow/deny as a whole, not per downstream target | Least-privilege agent access control |

## 12. Cost / Token / FinOps Management

| Epic | Status | Accelance evidence | Reference Pattern |
| --- | --- | --- | --- |
| Per-call cost tracking | 🟡 Built, not configured | `nodes/analytic/LangFuse`; `services/evaluations/CostCalculator.ts` | Cost/usage analytics |
| Per-workspace token/spend budgets + alert thresholds | 🔴 To build | none — though see the quota scaffolding noted in section 6 | FinOps budget guardrails (e.g. 80% warn / 100% block) |
| Model tiering for cost control | 🟡 Available per-flow, not enforced as policy | any chatmodel node, manual choice | Tiered model routing for cost |
| Rate limiting / usage caps | 🟡 Built, disabled | `LICENSE_QUOTAS` (`PREDICTIONS_LIMIT`, `FLOWS_LIMIT`, `USERS_LIMIT`, `STORAGE_LIMIT`) in `UsageCacheManager.ts`, gated behind CLOUD platform mode | Rate/usage caps at plan/tenant/model level |

## 13. Agent Builder Tooling & Evaluation

| Epic | Status | Accelance evidence | Reference Pattern |
| --- | --- | --- | --- |
| Low-code visual flow builder (drag-and-drop canvas) | ✅ Done & configured | `packages/ui` canvas | Low-code agent IDE |
| AI-assisted agent generation from a prompt | ✅ Done | `services/agentflowv2-generator` | "SOP-document → agent" generation |
| Evaluations framework (LLM-as-judge, datasets, cost tracking) | 🟡 Built, not configured | `services/{evaluations,dataset,evaluator}` | Pre-deployment evaluation (journey completion, tool-call accuracy) |
| Pre-publish evaluation gate (block go-live on failing eval) | 🔴 To build | none — eval results don't currently block anything | "Publish only validated agents" gating |
| Marketplace: global static templates | 🟡 Built, not configured (generic content only) | `marketplaces/{chatflows,agentflowsv2,tools}` | Agent/template registry |
| Marketplace: live "Save As Template" (per-workspace custom template) | ✅ Done, unused | `POST /api/v1/marketplaces/custom`, `CustomTemplate` entity | Same registry concept, workspace-scoped |

## 14. Admin / Governance Control Plane

| Epic | Status | Accelance evidence | Reference Pattern |
| --- | --- | --- | --- |
| Unified admin dashboard (agent inventory, approvals, budgets, one screen) | 🟡 Partially built | Control Tower: agent inventory + health stat tiles + awaiting-approval count + click-through filtering into Agents/Executions — `packages/ui/src/views/controltower/`, `packages/server/src/{controllers,routes,services}/control-tower/` | Governance control tower / admin center — inventory/approvals covered, budgets still missing |
| Agent lifecycle states (draft → validated → published) | 🔴 To build | none | Governed catalog with lifecycle states |
| Ownerless-agent / agent-risk flagging | 🔴 To build | none | Rules-based lifecycle governance |

## 15. Workflow / Deterministic Automation

| Epic | Status | Accelance evidence | Reference Pattern |
| --- | --- | --- | --- |
| Scheduling (cron-triggered flow runs) | 🟡 Built, not configured | `packages/server/src/schedule` | Scheduled/triggered automation |
| Webhooks | 🟡 Built, not configured | `services/{webhook,webhook-listener}` | Webhook-triggered automation |
| Deterministic steps inside a flow (HTTP, CustomFunction, ExecuteFlow nodes) | ✅ Done | `nodes/agentflow/{HTTP,CustomFunction,ExecuteFlow}` | Integration/automation blocks |
| Dedicated Git-backed workflow engine, separate from the agent graph | 🔴 To build (optional/deferred) | none | Standalone deterministic workflow product (e.g. n8n) — only worth building if in-graph nodes genuinely can't cover a need |

## 16. External Integration & SDK (org onboarding)

| Epic | Status | Accelance evidence | Reference Pattern |
| --- | --- | --- | --- |
| Embeddable chat widget SDK | ✅ Done | `flowise-embed` / `flowise-embed-react` (npm, referenced in `packages/ui/package.json`), `EmbedChat.jsx` | Client SDK for embedding an agent in a third-party site |
| Prediction/REST API for programmatic access | ✅ Done | `routes/predictions`, `routes/public-chatflows`, API keys | Public API surface |
| Per-org dedicated deployment runbook | 🔴 To build (as a documented process — the mechanism itself already works) | none written down yet | Single-tenant-per-deployment onboarding |
| True multi-org self-serve onboarding | 🟡 Built, disabled | `Platform.CLOUD` mode, Stripe billing scaffolding | Self-serve SaaS signup |
| Branded/first-party SDK package (`@accelance/embed`, distinct from upstream `flowise-embed`) | 🔴 To build | none — currently pulls the unforked upstream package name | Own-branded client SDK |

---

## Reading this map

Out of roughly 60 epics tracked here, the large majority already exist in this repo in some
form — most of section 1 (core orchestration), all of section 3's building blocks, and all
of section 4 (model access) are fully done. The 🟡 bucket (sections 2, 3, 5, 6, 7, 8, 9, 12,
13, 15, 16) is config/account work, not development — several of those (multi-org platform
mode, usage quotas) turned out to be further along than expected, gated behind a platform
mode rather than missing code. The genuine 🔴 backlog clusters in three areas — **Guardrails,
Compliance, and the Admin/Governance Control Plane** — plus the specific security invariant
of scoping agent tool access to the acting user's own permissions, and the org-onboarding
process itself (section 16).

---

## Deep Dive: Multi-Tenant SaaS Model

Section 6 and 16 each carry one line for this; because it's the actual decision blocking
onboarding a second organization, it gets its own full breakdown here — current state,
target model, and every story required to get from one to the other.

### Current state (the constraint)

**Update (2026-08-10, commit `93bff59`):** the one-organization-per-deployment lock described
below has been removed — `ensureOneOrganizationOnly()` no longer exists in the codebase.
ENTERPRISE mode now permits multiple organizations on one deployment, each with its own
workspaces and (per `09d279e`) its own independently-configured SSO via slug-based routing
(`/o/:slug/login`). What's described next — the *billing/quota* half of true multi-tenant
SaaS — is still accurate and still open.

Envoy runs today in `Platform.ENTERPRISE` mode (`packages/server/src/IdentityManager.ts`,
forced via the `ACCELANCE_PLATFORM=enterprise` env override). Previously that mode enforced
**exactly one organization per deployment**; as of `93bff59` it no longer does — every
user, workspace, credential, and flow can now belong to any of several orgs on the same
deployment. What ENTERPRISE mode still doesn't provide is self-serve signup, billing, or
quota enforcement per org — those remain gated behind `Platform.CLOUD` (below), so scaling
to many paying customers still means an admin manually provisioning each org rather than
self-serve signup with billing.

### Target state (the model)

Flip to `Platform.CLOUD` mode. This is a mode switch, not a rewrite — the multi-org
scaffolding already exists in the codebase and has simply never been turned on:

- **`packages/server/src/StripeManager.ts`** — a working Stripe SDK wrapper (subscription
  lookup, product/price resolution). Needs a real Stripe account, products, and price IDs;
  the integration code itself is already there.
- **`packages/server/src/UsageCacheManager.ts`** + **`LICENSE_QUOTAS`**
  (`packages/server/src/utils/constants.ts`) — per-org quota enforcement is already modeled:
  `PREDICTIONS_LIMIT` (renews monthly), `FLOWS_LIMIT`, `USERS_LIMIT`, `STORAGE_LIMIT`,
  `ADDITIONAL_SEATS_LIMIT`. `DISABLED_QUOTAS` and `UNLIMITED_QUOTAS` constants show the
  plan-tier pattern (a free/disabled tier vs. an unlimited tier) is already anticipated —
  the missing piece is populating real tier values and wiring quota checks into the request
  path.
- **The one-org lock** in enterprise mode is exactly what `CLOUD` mode removes — organizations
  become self-service, each with its own billing and quota state, on one shared deployment.

### Story breakdown

| # | Story | What "done" looks like | Effort |
| --- | --- | --- | --- |
| 1 | Stand up a real Stripe account + products | Stripe dashboard has products/prices matching the intended plan tiers (e.g. Starter/Growth/Enterprise); `STRIPE_SECRET_KEY` set in `.env`; `StripeManager.getInstance()` initializes without error | 1 day |
| 2 | Define plan tiers against `LICENSE_QUOTAS` | A config mapping each Stripe price ID → concrete quota values (predictions/month, max flows, max users, storage cap, extra seats) — replacing the placeholder `DISABLED_QUOTAS`/`UNLIMITED_QUOTAS` constants with real tier definitions | 1 day |
| 3 | Switch platform mode to CLOUD for billing | ~~Remove the single-org lock~~ — done (`93bff59`, Enterprise mode already permits multiple orgs). Remaining: `IdentityManager` resolves `Platform.CLOUD` for deployments that need Stripe billing/quota enforcement rather than Enterprise's current unmetered multi-org mode | 1 day |
| 4 | Self-serve org signup flow | A new org can register (`/register`-equivalent), select a plan, and land with a Stripe customer + subscription created automatically — no admin intervention required | 2 days |
| 5 | Quota enforcement on the request path | `UsageCacheManager` checks are actually invoked before creating a flow, adding a user, running a prediction, or uploading a file — requests over quota return a clear, actionable error rather than silently succeeding | 2 days |
| 6 | Tenant isolation verification | A written test pass confirming one org's workspaces, credentials, flows, and storage are never visible or reachable from another org's session — this is the step that makes CLOUD mode trustworthy, not just functional | 2 days |
| 7 | Billing self-service (upgrade/downgrade/cancel) | An org admin can change plans or cancel from within the app, with Stripe webhooks keeping `UsageCacheManager`'s cached quota state in sync | 1–2 days |
| 8 | Per-org branding/domain (optional, defer if not needed at launch) | Each org can set a display name/logo shown in their own workspace UI — not a blocker for launch, listed for completeness | not estimated — defer |

**Total for a first working rollout: 8–10 days** (stories 1–6; story 7 can land shortly after,
story 8 is optional). This matches the estimate already carried in sections 6/12/16 — this
breakdown is what that number is made of.

### Migration note

Nothing about switching to `CLOUD` mode requires touching the current single org's data —
the existing org simply becomes "tenant one" on the shared instance (or stays on its own
dedicated deployment if that's preferred for its size/contract). The decision isn't
either/or: dedicated-deployment-per-enterprise-customer and shared-CLOUD-mode-for-smaller
self-serve customers can coexist as two distinct go-to-market tracks on the same codebase.

---

## Epic Details & Effort Estimates

One entry per epic: what it is, current state, what closes it out, and an effort estimate
in days. Estimates for 🔴 epics are already the *reduced* number — cut relative to a
from-scratch estimate, since in every case Flowise gives a real head start (existing
tables/patterns to extend, an existing permission system to hook into, existing tracing
data to build a budget on top of, etc.) rather than a blank slate. Where an estimate already
existed in the tracking sheet (Langfuse, Metrics, SSO, Qdrant, Tool credentials, Queue mode,
Centralized tool-call governance, Admin/Governance dashboard, Audit log, Agent lifecycle
gating, Cost/FinOps budgets), that number is kept as-is rather than re-cut — everything else
is newly estimated on the same reduced basis.

### 1. Core Orchestration & Agent Execution

**Agentflow V2** — Native orchestration (conditional branching, loops, iteration, human-input) is a first-class part of the flow builder, not a bolt-on. Nothing to build; using it for a real solution is flow-design work, not platform work. **Effort: 0 days.**

**Multi-agent Supervisor/Worker** — An older but still-shipping supervisor/worker node pair, functionally the same pattern most supervisor-framework designs propose building from scratch. **Effort: 0 days.**

**Sequential Agents** — A third, even more explicit state-machine-style agent system (named State nodes) sits alongside the two above — three working generations of the same idea. **Effort: 0 days.**

**Classic single agents** — ToolAgent/ReAct/XMLAgent/OpenAI Assistants/LlamaIndex agents, for when a full graph is overkill. **Effort: 0 days.**

**Classic Chains** — 11 pre-agentflow chain types (LLMChain, ConversationalRetrievalQAChain, ApiChain, SqlDatabaseChain, GraphCypherQAChain, etc.) — a capability most comparable stacks don't name at all. **Effort: 0 days.**

**AI-assisted agent generation** — Generate a working agentflow from a natural-language prompt/spec. Already built; not yet used for any real solution design. **Effort: 0 days (0.5 day to try it against a first real spec).**

### 2. Tool / Integration Execution Layer

**Native tool nodes** — Gmail, Drive, Jira, Teams/Outlook, Composio, MCP, custom REST are all implemented; none has a credential yet. **Effort: 0.5–1 day per integration actually needed** (register an OAuth app, add the credential) — not a lump sum, since it scales with how many tools a given solution actually calls.

**Encrypted credential store + OAuth2** — The underlying mechanism (encryption at rest, OAuth2 routes/templates) is done; it's what the tool-credential work above plugs into. **Effort: 0 days.**

**Centralized tool-call policy enforcement** — Done for the policy-check half: `evaluateToolCall`/`wrapToolWithPolicy` wraps every real tool instantiation (classic/Multi-Agent/Sequential Agents via `buildFlow`, and AgentFlow V2's `Tool.ts`), checks `AgentToolPolicy` + `CredentialAccess`, and logs to `ToolCallAudit`. **DLP rule hooks (content-level redaction) were not built** — this covers "may this tool/credential run," not "does this tool call contain data that should be masked/blocked." **Effort remaining: ~3 days** for DLP redaction rules, if/when needed.

**Custom MCP tool support** — Security toggles and env vars exist; no MCP server has been connected and the toggles haven't been explicitly reviewed. **Effort: 0.5 day** per server connected.

### 3. Memory, Knowledge & RAG

**Vector stores (Qdrant, etc.)** — Node is fully implemented; needs an instance + credential. **Effort: 1 day** (kept as originally sized).

**Document Store** — Chunking/ingestion service exists; empty until content is loaded. **Effort: 0.5 day setup + time proportional to how much content is ingested (not a platform cost).**

**Document loaders** — 30+ ingestion sources ready to use as-is. **Effort: 0 days.**

**Record Manager** — Dedup/incremental re-indexing across MySQL/Postgres/SQLite already exists. **Effort: 0 days.**

**Graph database (Neo4j)** — A purpose-built graph store + Cypher QA chain already exists — a stronger option than assuming graph data has to live inside a relational store. **Effort: 1 day** to provision an instance and wire a credential, whenever a solution needs true graph traversal rather than vector similarity.

**LLM response caching** — Semantic/exact caching nodes (Redis, Upstash, Momento, in-memory) exist, unused. **Effort: 0.5 day.**

**Memory node types** — 12 memory strategies (buffer, summary, Zep, Mem0, etc.) ready to use. **Effort: 0 days.**

### 4. Model Access & Cost Tiering

**Provider-agnostic LLM access** — 29 chat-model providers already wired in, including self-hosted/local options (Ollama, LocalAI) and a LiteLLM gateway node. **Effort: 0 days** — see Q3 below.

**Embedding providers** — 16 providers, same story. **Effort: 0 days.**

**Model tiering (cheap vs. frontier per node)** — Selectable per node today; no platform-wide policy enforcing which tier a given role must use. **Effort: 2 days** to define and document a tiering convention (not code — a policy + a couple of default flow templates).

**Model allow/deny-listing** — Env vars exist (`MODEL_LIST_CONFIG_JSON`, `DISABLED_NODES`); nobody has populated them. **Effort: 0.5 day.**

### 5. Observability & Tracing

**Langfuse/LangSmith/Arize/Phoenix tracing** — Node exists; no project/API key created anywhere. **Effort: 1 day** (kept as originally sized) — this is the highest-value single item in the whole 🟡 bucket.

**Prometheus/OpenTelemetry metrics** — Server-side plumbing exists; `ENABLE_METRICS` is unset. **Effort: 1 day** to turn on and point at a collector; **+2 days** if a real Grafana-style dashboard is wanted on top, since the code only exposes metrics, it doesn't visualize them.

**Custom observability SDK (`packages/observe`)** — Exists as a separate package; scope/usage unclear, worth a short investigation before counting on it. **Effort: 0.5 day to assess what it actually does today.**

**Cost/usage dashboards per workspace** — No aggregated view exists yet; depends on Langfuse being on first. **Effort: 3 days** once tracing data exists to build on.

**Drift detection** — No behavior-change detection exists. **Effort: 4 days** — lowest priority in this section; only worth it once there's enough production traffic for drift to be meaningful.

### 6. User, Access & Multi-Tenancy Management

**Org → Workspace → RBAC hierarchy** — Fully working today. **Effort: 0 days.**

**Custom roles** — Fully working today. **Effort: 0 days.**

**SSO (Auth0/Azure/Google/GitHub)** — Code exists for all four; none configured. **Effort: 2 days** (kept as originally sized) for the first provider, **+0.5 day** per additional provider.

**API keys** — Working today. **Effort: 0 days** as-is; **2 days** if per-endpoint scoping/expiry is wanted as a further hardening step.

**Service accounts** — No non-human, project-scoped identity concept exists distinct from a real user. **Effort: 3 days.**

**ABAC / resource tagging** — RBAC is role-only; no tag-based scoping. **Effort: 4 days.**

**Multi-org platform mode** — See the dedicated answer to Q2 below; this is a platform-mode switch plus billing integration, not a from-scratch build. The single-org constraint itself is already removed (`93bff59`) and per-org SSO already works (`09d279e`). **Effort: 6–8 days** for a first working CLOUD-mode rollout (Stripe product/plan setup, quota wiring, isolation testing) — revised down from the original 8–10 day estimate now that the org-lock removal is done.

### 7. Infrastructure, Scaling & Environments

**Single-service deployment** — Running today on Neon Postgres. **Effort: 0 days.**

**Queue mode / BullMQ** — Redis already provisioned; `MODE=queue` never set. **Effort: 0.5 day** (kept as originally sized) to flip on and start a worker.

**Dev/staging/prod separation** — No environment-per-tier pattern exists. **Effort: 4 days** — mostly config/process (separate DBs or a tag convention), not new features.

**Multi-region/HA** — Not needed at current scale. **Effort: deferred — not estimated** until a specific uptime/latency requirement exists.

### 8. Human-in-the-Loop (HITL)

**HumanInput execution checkpoint** — A real proceed/reject interrupt exists; unused in any flow today. **Effort: 1 day** to wire into a first flow (e.g. gating an autonomous write action).

**HIL policy (which actions require approval)** — No policy defining which action types always pause exists yet — today it's a flow-by-flow design choice with no platform default. **Effort: 3 days** to define and document a default gate list (external writes, comms, irreversible actions).

**Approver inbox / review UI** — No dedicated screen for reviewing/acting on pending HIL pauses exists; today it would have to be handled ad hoc per flow. **Effort: 4 days**, or folds into the Admin/Governance dashboard build if that's done first.

### 9. Guardrails & Safety

**Content moderation** — OpenAI Moderation + deny-list nodes exist, unused, deny-list empty. **Effort: 1 day** to wire into a first flow and populate a starter deny-list.

**Prompt-injection defense** — Only a manual deny-list exists; no structural separation of trusted instructions from untrusted content. **Effort: 3 days** for a reusable "wrap untrusted content" pattern (custom function node + documented convention) agents are instructed to treat as data, not commands.

**PII detection & redaction** — No content-level scanning exists. **Effort: 4 days** for a regex/NER-based redaction step applied before logging/storing content.

**Topic/action scoping** — No per-agent bound on allowed subject matter/actions exists. **Effort: 3 days.**

### 10. Compliance & Data Governance

**Audit log** — No append-only record of agent/tool actions exists anywhere. **Effort: 8 days** (kept as originally sized) — schema + write-path hooks at every consequential action.

**Data retention policy** — No TTL/cleanup job exists; everything accumulates indefinitely. **Effort: 3 days** for a configurable retention window + scheduled cleanup.

**Compliance certifications/data residency** — Largely an audit/business process (external audit, legal review, region guarantees), not a coding task. **Effort: not a dev estimate — pursue only once a contract requires it**, and only after the technical controls above exist.

**Policy templates platform-wide** — No mechanism to apply a standard rule set to every agent automatically. **Effort: 3 days.**

### 11. Security & Permission Model

**Encrypted secrets at rest** — Working today. **Effort: 0 days.**

**Production security toggles** — Exist, left on defaults. **Effort: 0.5 day** to review and set deliberately before sitting behind a real load balancer.

**Agent principal model (agent acts only within its user's own permissions)** — Done. `userId` threaded through the execution path, `CredentialAccess` grants enforced at the tool-call chokepoint. **Effort: 0 days.**

**Least-privilege per-agent tool allowlist** — Done. `AgentToolPolicy` enforced at the same chokepoint. **Effort: 0 days.**

### 12. Cost / Token / FinOps Management

**Per-call cost tracking** — Exists via Langfuse + the evaluations cost calculator, dormant until Langfuse is on. **Effort: 0 days** once section 5's Langfuse item is done.

**Per-workspace token/spend budgets + alerts** — No budget concept exists as a first-class feature, though see the quota scaffolding in section 6. **Effort: 6 days** (kept as originally sized).

**Model tiering for cost control** — Same item as section 4; listed here for the cost angle. **Effort: 2 days** (shared with the section-4 estimate, not additive).

**Rate limiting/usage caps** — `LICENSE_QUOTAS` + `UsageCacheManager` already implement this, gated behind CLOUD platform mode. **Effort: 2 days** to verify/wire the existing quota mechanism rather than build one, once Q2's platform-mode decision is made.

### 13. Agent Builder Tooling & Evaluation

**Low-code visual builder** — Core product, already in daily use. **Effort: 0 days.**

**AI-assisted agent generation** — Same item as section 1. **Effort: 0 days.**

**Evaluations framework** — LLM-as-judge, datasets, cost tracking all exist; never exercised. **Effort: 2 days** to create a first dataset/evaluator for a real flow.

**Pre-publish evaluation gate** — Eval results don't block anything from going live today. **Effort: 4 days** to add a draft/published state plus a threshold check on promotion.

**Marketplace: global static templates** — Ships generic-only. **Effort: not prioritized** — the custom-template path below is faster for anything Accelance-specific.

**Marketplace: live "Save As Template"** — Fully working, zero-dev feature nobody has used yet. **Effort: 0.5 day** to save and polish a first starter template.

### 14. Admin / Governance Control Plane

**Unified admin dashboard** — Partially built: Control Tower (`packages/ui/src/views/controltower/`) now covers agent inventory, health stat tiles, and awaiting-approval counts, with click-through filtering into Agents/Executions; budgets/cost data are still missing. **Effort: ~8 days remaining** (revised down from the original 15-day estimate, which predated Control Tower) — still the largest open item in this section, but no longer a from-scratch build.

**Agent lifecycle states (draft → validated → published)** — No lifecycle state exists on flows today. **Effort: 5 days** (kept as originally sized) — shares work with the pre-publish evaluation gate in section 13.

**Ownerless-agent/risk flagging** — No automated flagging of unowned or risky agents exists. **Effort: 2 days**, naturally an extension of the admin dashboard once it exists.

### 15. Workflow / Deterministic Automation

**Scheduling** — Cron-triggered flow runs exist, unused. **Effort: 0.5 day** to set up a first scheduled flow.

**Webhooks** — Exist, untested. **Effort: 0.5 day** to register and verify a first webhook.

**In-graph deterministic steps (HTTP/CustomFunction/ExecuteFlow)** — Already cover most of what a lightweight workflow engine would be asked to do. **Effort: 0 days.**

**Dedicated Git-backed workflow engine (n8n-equivalent)** — Not built, and deliberately deferred. **Effort: not estimated** — only worth scoping if a specific need surfaces that in-graph nodes can't cover.

### 16. External Integration & SDK

**Embeddable chat widget SDK** — `flowise-embed`/`flowise-embed-react` already work against this server. **Effort: 0 days** to use as-is.

**Prediction/REST API** — Already the integration surface for any external caller. **Effort: 0 days.**

**Per-org dedicated deployment runbook** — The mechanism (spin up a new instance) already works; it's just never been written down as a repeatable process. **Effort: 1 day** to document (env template, DB provisioning steps, first-admin registration, DNS/branding checklist).

**True multi-org self-serve onboarding** — See Q2. **Effort: 8–10 days**, same estimate as the section-6 entry (not additive — one project).

**Branded first-party SDK package** — Currently `flowise-embed`/`flowise-embed-react` are consumed under their upstream name. **Effort: 2 days** to fork/republish under an Accelance scope if white-labeling the embed SDK matters for external customers.

---

**Total, excluding deferred/non-dev items:** roughly **105–115 days** of real development effort across the entire 🔴 backlog plus all 🟡 config/setup work — noticeably less than a from-scratch build of the same capability set would take, because most of the foundation already exists and needs configuring, not writing.

---

## Action Plan: Add a First Marketplace Template

1. **Confirm permission.** The "Save As Template" menu item is gated by the `templates:flowexport`
   permission (`packages/ui/src/ui-component/button/FlowListMenu.jsx`) — confirm the account
   doing this has it (an OWNER/admin role will).
2. **Build the source flow first.** A template is only as good as the flow behind it — pick
   something that demonstrates a real, reusable pattern rather than a placeholder. The two most
   valuable first templates are the two capabilities already built but never exercised:
   - **"Supervisor + HIL Gate" starter** — a small agentflow: Supervisor Agent → Task Agent →
     `HumanInput` checkpoint before any write/send action. Costs nothing to demonstrate since
     both nodes already exist.
   - **"Moderated Chat" starter** — a simple chain with `OpenAIModeration` or
     `SimplePromptModeration` wired in front of the model call, deny-list pre-populated.
3. **Save it as a template.** Open the flow → the "⋮" menu (`FlowListMenu`) → **Save As
   Template** → `ExportAsTemplateDialog` → fill in name, description, and a badge/category →
   Save. This calls `POST /api/v1/marketplaces/custom`, persisting it as a `CustomTemplate` row
   scoped to the current workspace.
4. **Verify it shows up.** Go to the Marketplace view's second tab (custom/workspace templates,
   distinct from the global static tab) and confirm it renders with the name/description just set.
5. **Share across workspaces if useful.** `CustomTemplate` rows can be shared via
   `WorkspaceService.getSharedItemsForWorkspace`, so a template built in one workspace can be made
   visible in others without duplicating it.
6. **Tools, not just flows, can be templated the same way** — `ToolDialog.jsx` has the same
   export action gated by `templates:toolexport`.
7. **Only build a *global* (static JSON) template if it must ship pre-installed on every fresh
   deployment** — that path requires a code change under `packages/server/marketplaces/` plus a
   rebuild, and isn't needed for an internal starter template. Default to the custom-template
   path above.

This closes out the 0.5-day estimate already sitting against this epic — no development
required, just doing steps 2–4 once for a first template.
