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
| AI-assisted agent generation from a prompt/spec | 🟡 Built, real bugs found via live testing (2026-08-12/13), several fixed | `packages/server/src/services/agentflowv2-generator`, `packages/components/src/agentflowv2Generator.ts` — see `rules/architecture.md`'s "Update (2026-08-12/13)" notes and `rules/known-issues.md` #009. Fixed so far: propose→approve→execute tool reuse, baseline HITL-by-default safety rule, model/credential consistency across all model-bearing node types (incl. the router), and per-node LLM content generation for router scenarios/instructions + agent system prompts (previously left blank, causing the router to hard-crash and agents to run role-less). Not yet stress-tested against a wide variety of prompts/graph shapes beyond the specific cases hit so far — treat as "built, actively being hardened," not "done" | "SOP-document → agent" style generation (watsonx-style pattern) |
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
| Save custom MCP server from canvas into the global `CustomMcpServer` list | ✅ Done (both URL and stdio servers, 2026-08-14) | `NodeInputHandler.jsx` — "Save to My MCP Servers" button next to the `Custom_MCP` node's config editor. URL-based configs still open `CustomMcpServerDialog` for review before saving; stdio (command-based) configs now save immediately (no further review needed — the config is already fully known) via the same entity/service extension built for the MCP registry browser row below. Previously stdio configs were explicitly rejected because the entity only modeled remote URL/SSE servers — that schema gap is now closed | "Save as reusable connector" affordance, same shape as the existing Custom Tool save flow |
| Tool/node catalog performance at 1000+ scale (virtualization, lazy-loaded schemas, debounced search) | 🟡 Partially built (2026-08-11) | **Done**: `AddNodes.jsx` — the canvas node picker's per-category list is now `react-window`-virtualized (`FixedSizeList`, 72px rows, capped at 350px viewport height so one huge category scrolls internally instead of rendering thousands of DOM nodes); `Accordion` now sets `TransitionProps={{ unmountOnExit: true }}` so collapsed categories' nodes aren't mounted at all (previously ALL categories' nodes were always in the DOM regardless of expand state — the actual biggest cost at scale); the search-filter timer is now a real debounce (was a bug: `setTimeout` with no `clearTimeout`, so fast typing stacked multiple overlapping 500ms-delayed scoring passes — now properly cancels the previous timer, 250ms). `NativeToolsTab.jsx` (Tools page) now paginates client-side via the existing `TablePagination` component instead of rendering the full filtered set in one CSS grid. **Not done**: none of this is server-paginated yet — `/nodes/category/:name` and `useNativeToolsCatalog.jsx` still fetch the *entire* category in one response; that's fine at today's ~62-node catalog but will need cursor-based pagination + a lightweight list-view schema (id/name/icon/category only, full input schema fetched on-demand) once real aggregator-scale sources (Composio/Pipedream fully configured, or an MCP registry browser) are added — see the two catalog-breadth items below | Standard large-catalog UX pattern (virtualized list + paginated/lazy server-side catalog for aggregator-scale tools, e.g. Composio/Zapier-class integration counts) |
| **Product direction (2026-08-11, explicit call):** native connector breadth is the primary catalog strategy — the platform should natively cover "all the nodes and tools" itself (hand-built connectors + native MCP servers), not rely on aggregators as the main path. Composio stays in the catalog as one supplemental option, not the strategy. **Custom Tool (user-authored JS function) is a last resort** — for a genuinely bespoke/internal application with no possible pre-built connector — not the default way ordinary SaaS integrations get built. This reverses the framing of the row below (previously pitched as "fastest path to breadth") — Composio/Pipedream configuration is now optional/supplemental, not prioritized over expanding the native library | n/a | n/a | n/a |
| Composio + Pipedream aggregator nodes (supplemental, not primary) | 🟡 Built, not configured | `nodes/tools/Composio/Composio.ts`, `nodes/tools/MCP/Pipedream/PipedreamMCP.ts` — both already in the catalog. Configuring these is optional breadth on top of the native library, not a substitute for it per the product direction above | One supplemental aggregator option among many, not the catalog-breadth strategy |
| Native connector library — batch 2 (2026-08-12, per explicit "platform should have all the nodes and tools" product direction) | 🟡 Built, not configured | Batch 1 (2026-08-11): Salesforce, HubSpot, Discord, Twilio, Airtable, DocuSign, Shopify + Notion/Linear/Sentry/Figma/Browserbase MCP servers — see the market-gap row above. **Batch 2 (2026-08-12), all 27 built**: Support/ticketing — Zendesk, Intercom, Freshdesk; Project/PM — Asana, Trello, Monday.com (GraphQL API), ClickUp; Marketing/email — Mailchimp, SendGrid, Klaviyo; Comms — Zoom (Server-to-Server OAuth), Telegram, WhatsApp Business (Meta Cloud API); Dev/infra — GitLab, Bitbucket, CircleCI, Vercel, Datadog, PagerDuty; Finance/accounting — QuickBooks, Xero; Cloud storage — Dropbox, Box, OneDrive (Microsoft Graph OAuth2, reuses the `MicrosoftOutlookOAuth2`-style credential shape); Data/analytics — Segment, Amplitude, Mixpanel. Snowflake, BigQuery, and Google Meet were deliberately dropped from the original 30-item shortlist: the first two are SQL warehouses better served by this platform's existing SQL-chain nodes than a REST-tool wrapper, and Google Meet has no standalone API (meetings are created via Google Calendar's API, already a separate existing connector) — building either would have been a bad fit forced to match the pattern, not a real gap. All 27 follow the Jira.ts/core.ts pattern (DynamicStructuredTool + zod schemas + secureFetch); QuickBooks/Xero use the same pre-obtained-token simplification as Salesforce/DocuSign (Xero's tokens are notably short-lived, ~30 min, with no refresh handling built); all added to `NATIVE_CONNECTOR_NAMES` in `nativeToolsClassification.js`. Verified together: `tsc --noEmit`, `eslint`, and a full `packages/components` build (icons confirmed landing in `dist/`) all pass clean; zero node/credential name collisions. Not yet configured with real credentials, not yet tested against live APIs — same "built, not configured" caveat as every other native tool node in this table | Matches the "cover the common SaaS surface natively" direction rather than funneling everything through aggregators |
| MCP registry browser (browse/add from a public directory of community MCP servers without a hand-written node per server) | 🟡 Built, not configured (2026-08-14) | **Done**: the security conflict flagged 2026-08-11 was resolved by fixing a miscategorization, not by weakening security — `MCP/core.ts`'s `validateCommandFlags` had `-y`/`--yes` in `npx`'s dangerous-flags list alongside genuine code-execution flags (`-c`, `--call`, `--shell-auto-fallback`); `-y` only auto-confirms npm's install prompt (which a non-interactive spawned process can't answer anyway) and isn't a code-execution primitive, so it was removed from that list while the real dangerous flags stay blocked. `uvx` (the modern Python-package runner most community pypi-based MCP servers actually use) was also added to the command allowlist. **Trust model** (explicit product decision, not assumed): any user with `tools:create` can add any registry server; stdio (local-process) servers show an explicit "this runs third-party code we haven't reviewed" confirmation before the add proceeds — no additional role gate, matching the Composio-importer's fully self-service philosophy. **Schema**: `CustomMcpServer` gained `transportType` ('url'\|'stdio'), `command`, `args` (JSON), `env` (encrypted like `authConfig`) columns, `serverUrl` now nullable — migrated for postgres+sqlite (`1790000000000-AddCustomMcpServerStdioTransport`, matching the postgres+sqlite-only convention the concurrent `AddOrganizationAnalytic` migration also used). `services/custom-mcp-servers` and the `CustomMcpServerTool` execution-path node both branch on `transportType`: URL servers unchanged (SSE transport); stdio servers re-run `validateMCPServerConfig` at both save-time AND execution-time (defense in depth, matching the canvas node's own re-validation philosophy) before launching via `MCPToolkit(..., 'stdio')`. **Data source**: the official public MCP registry (`registry.modelcontextprotocol.io`, a community good, not a private/ToS-restricted directory like Claude's own connector directory the ask was modeled on) — unauthenticated `GET /v0/servers?search=`, confirmed live via direct `curl` rather than trusting docs alone (learned that lesson from the Composio v2/v3 incident). New `packages/server/src/{routes,controllers,services}/mcp-registry/` proxies search + a per-server import that re-fetches the entry server-side (by exact-name search match — no confirmed single-item GET-by-name endpoint) rather than trusting client-supplied server metadata, then reuses `customMcpServersService.createCustomMcpServer`/`authorizeCustomMcpServer`. Frontend: "Browse MCP Registry" button on the Custom MCP Servers toolbar opens `McpRegistryDialog.jsx` — search, per-result transport badge (remote/local-process/unsupported), inline required-field inputs (headers for remote, env vars for stdio) declared by the registry entry itself, and the third-party-code confirmation gate for stdio adds. `tsc`, `eslint`, and full builds of `packages/components`, `packages/server`, and `packages/ui` all pass clean. **Scope decision**: oci/docker-packaged registry entries are excluded (shown as "not supported yet") — launching them needs `docker run`, which the validator blocks outright as a materially more severe risk class (host mounts, container escape surface) than npx/uvx; not reopened here. npm+pypi cover the large majority of real-world community servers. **Not done**: no live end-to-end test importing and running a real registry server (no sandboroom/isolated execution environment available in this dev environment to safely test third-party code execution); Smithery/Glama as additional registry sources (official registry only, for now); no in-app editing UI for an already-saved stdio server's command/args (only add-time and the API support it — `CustomMcpServerDialog.jsx`'s manual form itself wasn't extended with stdio fields, out of scope for this pass) | The actual long-term mechanism for "generic MCP connectors at scale" — real breadth without an engineer writing a node per integration, complementary to (not a replacement for) the native-first direction above |
| Native connector library — batch 3 / market-gap round 2 (2026-08-12): Azure, Microsoft 365/Graph beyond Outlook/Teams/OneDrive, Anthropic/OpenAI ecosystems, other enterprise "big fish" | 🟡 Built, not configured | All 13 built: **Azure** — Azure Blob Storage, Azure Key Vault, Azure DevOps, Entra ID (Azure AD) (all 4 via Azure AD app service-principal client-credentials OAuth2, fresh token per call, no caching); **Microsoft Graph delegated** — SharePoint, Excel Online, Planner (all 3 reuse the `MicrosoftOutlookOAuth2`-style delegated OAuth2 credential shape + Gmail's `getCredentialData`→`refreshOAuth2Token`→`getCredentialParam('access_token', ...)` pattern); **ITSM/identity** — ServiceNow (OAuth2 client-credentials against the instance's own token endpoint), Okta (`SSWS` custom auth scheme), Confluence (reuses the existing `confluenceCloudApi` credential from the document-loader feature — no duplicate credential created), Jira Service Management (reuses the existing `jiraApi` credential, hits the separate `/rest/servicedeskapi/` surface); **LLM-as-sub-agent** — Claude (Sub-Agent) and GPT (Sub-Agent), a new connector *kind*: each wraps the Anthropic Messages API / OpenAI Chat Completions API as a callable tool another agent can invoke mid-flow, reusing the existing `anthropicApi`/`openAIApi` credentials (confirmed via research that neither vendor publishes a broad enterprise-tool MCP catalog worth wrapping instead). All 13 follow the Jira.ts/core.ts pattern (`DynamicStructuredTool` + zod schemas + `secureFetch` + `TOOL_ARGS_PREFIX`/`formatToolError`); zero credential duplication (3 of 13 deliberately reuse pre-existing credentials instead of creating new ones); all 13 added to `NATIVE_CONNECTOR_NAMES` in `nativeToolsClassification.js`. Verified together: `tsc --noEmit`, `eslint`, and a full `packages/components` build all pass clean; zero node/credential name collisions across the batch. Confirmed via research: Azure Cognitive Search and Snowflake are both better served by this platform's existing RAG/SQL-chain nodes (reinforces the earlier Snowflake/BigQuery exclusion, doesn't overturn it); SAP/Workday are real but high-cost/low-near-term-ROI (negotiated API access, complex OAuth2+SCIM) — deliberately deferred, not forgotten. Not yet configured with real credentials, not yet tested against live APIs — same "built, not configured" caveat as every other native tool node in this table | Rounds out enterprise-tier coverage (identity, ITSM, Microsoft ecosystem, LLM-as-tool) that batches 1–2 didn't reach |
| Dynamic tool infrastructure — "save any generated tool to the database, fetch it later" | 🟡 Partially built (2026-08-12) | **Done**: `OpenAPIToolkit` node (`nodes/tools/OpenAPIToolkit/OpenAPIToolkit.ts`) can now save any selected endpoint straight into the same `Tool` table the "Custom Tools" tab already manages — a new `exportSelectedEndpointsAsTools` loadMethod flattens the endpoint's path/query/body parameters into the `Tool` entity's existing flat schema format (`convertSchemaToZod`-compatible) and generates a `fetch`-based `func` body (same `require('node-fetch')` pattern `OpenAPIToolkit/core.ts`'s own `defaultCode` already uses), reusing the exact same `Tool` entity + `CustomTool` node + `toolsApi.createNewTool` + `ToolDialog` infra that already exists — **zero new entity, zero new node type, zero schema migration**. Frontend: a "Save to My Tools" button next to the node's "Available Endpoints" field (`NodeInputHandler.jsx`), calling the loadMethod via the existing `/node-load-method/:name` route (same plumbing the async-options dropdowns already use) then looping `toolsApi.createNewTool` per selected endpoint. Parameter names that aren't valid JS identifiers get sanitized to a safe fallback (`param1`, `param2`, ...) consistently in both the saved schema and the generated code, with the real API parameter name preserved in the description and in the actual HTTP call — verified this mapping doesn't silently diverge (an early version of this fix had exactly that bug, caught before shipping) via a standalone generated-code test (syntax-validated with `vm.Script`, inspected the request shape by hand). `tsc`, `eslint`, and full builds of both `packages/components` and `packages/ui` all pass clean. **Why this matters**: most Azure services (and many other REST APIs) publish real OpenAPI specs — point `OpenAPIToolkit` at one, save the 3-5 endpoints actually needed, done, no hand-written connector required. **Not done**: the Composio catalog importer (see next row) — the harder half of "don't build 2000+ tools by hand, let users import only what they need" | Reuses 95%+ of existing infra rather than inventing a parallel dynamic-tool system — the generic execution engine (`DynamicStructuredTool` in `OpenAPIToolkit/core.ts`, driven entirely by `{name, description, schema, baseUrl, method, headers}` data) already existed; this closes the "not saved anywhere reusable" gap around it |
| Composio catalog importer (browse/search Composio's 2000+ actions, import only the specific ones a user picks as first-class named `Tool` rows, instead of one generic "Composio" node with everything crammed into it) | 🟡 Built, not configured (2026-08-12, v2→v3 fix same day) | **Done**: reused the existing `composioApi` credential (same one the generic `Composio` node already uses — no new credential type). Backend routes under `packages/server/src/routes/composio-catalog/` (`GET /search`, `GET /connections`, `POST /import`; wired through matching `controllers/composio-catalog` + `services/composio-catalog`, reusing `credentialsService.getCredentialById` to resolve+decrypt the workspace's Composio key server-side and `toolsService.createTool` to persist the result — the frontend never sees the raw API key). Import flattens the selected action's JSON-Schema `input_parameters` into the `Tool` entity's flat schema format (same sanitize-to-`paramN`-with-real-name-in-description convention as the OpenAPIToolkit row above) and generates a `func` that does a raw `node-fetch` call with the resolved API key + connected-account id baked in — same secrets-baked-into-`func` tradeoff already accepted for OpenAPIToolkit-derived tools, not a new one. **Live bug found and fixed same day**: shipped first against the v2 REST surface (`/api/v2/actions...`), matching what the already-installed `composio-core@0.5.39` package's bundled client targets internally — but Composio has fully retired v2 in production (confirmed live: `410 "This endpoint is no longer available. Please upgrade to v3 APIs."`, hit by the user testing the feature immediately after ship). This means **the existing native `Composio` node (`nodes/tools/Composio/Composio.ts`), which still depends on `composio-core@0.5.39`'s v2-targeting client, is very likely broken in production too** — not something this pass fixed, since upgrading that node means either replacing `LangchainToolSet` with direct v3 REST calls or waiting for/adopting a v3-targeting version of the SDK; flagging as a follow-up, not yet actioned. The importer itself was migrated to the confirmed-live v3/v3.1 surface: search `GET /api/v3.1/tools?query=<term>` (item fields: `slug`, `name`, `description`, `input_parameters`, `toolkit.{slug,name,logo}`, `no_auth`), import detail fetch reuses the same endpoint via `?tool_slugs=<slug>`, connected-accounts list `GET /api/v3/connected_accounts?toolkit_slug=&status=ACTIVE`, execute `POST /api/v3/tools/execute/{slug}` with body `{connected_account_id, arguments}` — all three endpoints spot-checked live (unauthenticated `curl`) to confirm `401` (alive, needs auth) rather than `410` (dead) before shipping the fix. Frontend: "Import from Composio" button on the Custom Tools toolbar (`views/tools/index.jsx`) opens `ComposioImportDialog.jsx` — credential picker, debounced search, per-result row that lazily loads connected accounts and lets the user pick one before importing (mirrors the existing `Composio` node's own "pick a connection" UX; no new OAuth-hosting flow in this pass — connecting an app still happens on app.composio.dev). `tsc`, `eslint`, and full builds of `packages/components`, `packages/server`, and `packages/ui` all pass clean after the fix. **Not done**: no live end-to-end test against a real Composio account with real data (no test API key available in this environment — only endpoint-liveness was spot-checked); the existing `Composio` node's own v2→v3 migration (separate, not yet started); no in-app "connect this app" hosted OAuth flow (Composio's `link()`/`initiateConnection` v3 endpoints exist, confirmed during research, intentionally out of scope here) | The direct fix for "adding tools should be saved in the database and fetched" as it applies to Composio specifically — each imported action becomes its own searchable, named tool via the same underlying `Tool`-table mechanism as the OpenAPIToolkit row above, different catalog source, zero engineering effort scaling with catalog size |

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
| Provider-agnostic LLM access (30 chat-model providers incl. OpenAI, Anthropic, Bedrock, Vertex, Watsonx, Groq, Mistral, Moonshot AI/Kimi, Ollama, LiteLLM, LocalAI, etc.) | ✅ Done | `nodes/chatmodels/` | Provider-agnostic LLM/model access layer — see Q3 below |
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
| HIL policy (which actions require approval vs. run autonomously) | 🟡 Built, generator-scoped only | `packages/components/src/toolActionRisk.ts` (naming-convention classifier: send/delete/trash/remove/clear/modify/update/create-style action names = write-capable) + `agentflowv2Generator.ts`'s `validateAndRepairFlow` and the AgentFlow V2 "Generate" prompt's non-optional safety rule (`services/agentflowv2-generator/prompt.ts`) — commit on branch fixing the one-shot generator. This is a first real gate-matrix implementation, not the full epic: it only applies to flows built via the natural-language generator (forces a condition+HITL gate before write-capable tools, repairs empty model fields, warns if a flow has write-capable tools with zero HITL node anywhere). It does **not** enforce anything on manually-built flows, and the classifier is a heuristic over action *names*, not structured per-action metadata — a full implementation of this epic would still want that | A named gate matrix (which action types always pause: external writes, comms, irreversible actions) |
| Approver inbox / review UI | 🔴 To build | none | Dedicated HIL inbox screen |
| Node-level retry/resume after a genuine execution error (tool/schema failure, not a HumanInput pause) | 🔴 To build | none — confirmed empirically: a failed tool call lands the execution on `FINISHED`/`ERROR` with the failure embedded in that node's data; `ExecutionDetails.jsx` has no retry action for this case, only the Proceed/Reject path for `STOPPED` HumanInput pauses | Partial-run resume from the last successful node — most agent platforms distinguish "paused for a human" from "failed mid-run" and support resuming both |

## 9. Guardrails & Safety

| Epic | Status | Accelance evidence | Reference Pattern |
| --- | --- | --- | --- |
| Guardrails & Compliance catalog (DB-backed, browsable list of standard + custom guardrails; per-agent canvas visibility panel + header badge + a standalone workspace-level admin page) | 🟡 Built (2026-08-17) | `database/entities/{GuardrailCatalogItem,GuardrailPolicy}`, `services/guardrails`, `routes/guardrails` (`/guardrails/catalog`, `/guardrails/policy`, `/guardrails/summary/:chatflowId`); UI: `ui-component/extended/GuardrailsCompliance.jsx` (new "Guardrails & Compliance" group in `ChatflowConfigurationDialog`, per-agent), shield-icon+count badge in `CanvasHeader.jsx`, guardrail-node marker on `CanvasNode.jsx` for `category==='Moderation'`, plus a standalone `views/guardrails/index.jsx` page at `/guardrails` (sidebar nav under Studio) for setting workspace-wide defaults and seeing an "Overridden by N agents" count per catalog entry. Catalog is seeded by migration (not hardcoded into `packages/components`), same reasoning as the MCP registry browser/Composio importer. Distinguishes `kind:'node'` (draggable canvas nodes, detected by scanning `flowData`) from `kind:'policy'` (engine-enforced, no canvas position, most-specific-match-wins via `chatflowId=''` sentinel — same convention as `AgentToolPolicy`). The standalone page reuses the existing `/guardrails/catalog` and `/guardrails/policy` endpoints with no `chatflowId` — no new backend routes needed. Tool Allowlist is surfaced read-only in both UIs by querying the existing `AgentToolPolicy` table rather than duplicating it | Guardrails/policy catalog + admin visibility, same shape as e.g. watsonx Orchestrate's guardrails list or Agentforce's Trust Layer controls |
| Content moderation (OpenAI Moderation API, deny-list) | 🟡 Built, not configured | `nodes/moderation/{OpenAIModeration,SimplePromptModeration}`; now a `kind:'node'` catalog entry (`content_moderation`), detected on canvas and shown in the new Guardrails & Compliance panel — visibility only, the nodes themselves are still unused and the deny-list is still empty | Content/toxicity guardrail |
| Prompt-injection defense (trusted vs. untrusted content separation) | ✅ Done (2026-08-17/18) | `packages/components/src/toolPolicy.ts`'s `applyPromptInjectionWrapping` — every successful tool-call result is wrapped in explicit `[UNTRUSTED TOOL OUTPUT]` delimiters before the LLM re-reads it, gated on the `prompt_injection_defense` policy (catalog flipped `enforcementStatus:'planned'→'enforced'` by the `GuardrailCatalogBatch3Enforcement` migration). No custom-config UI yet (nothing to configure — the wrapper is unconditional once enabled) | Untrusted-content delimiting; instruction-origin rule (goals accepted only from authenticated requests, never from content an agent merely reads) |
| PII detection & redaction | 🟡 Built (2026-08-17), regex-based | `utils/contentRedaction.ts` (email/phone/SSN/card-pattern presets + custom regex list), wired into `utils/addChatMesage.ts` — every chat message save now runs `guardrailsService.getActiveRedactionPatterns()` and redacts before persisting, but only when the `pii_redaction` catalog policy (or a custom denylist-type policy) is enabled for that workspace/chatflow; off by default. NER-based detection remains 🔴, not attempted here | PII scan/redaction on logged/stored content |
| Topic/action scoping (bound exactly what an agent may do) | ✅ Done (2026-08-17/18) | `utils/preflightGuardrails.ts`'s `checkPreflightGuardrails`, called from `utilBuildChatflow` before every flow type executes — matches the question text against a `deniedTopics` list (seeded default: self-harm/suicide/illegal drugs/weapons/child exploitation) and returns a configured refusal message instead of running the flow. Enabled via the same `/guardrails` toggle; no UI yet to edit the denied-topics list beyond the seeded default (DB `defaultConfig` only) | "Topics & Actions" style scoping |
| Loop & recursion detection (runaway loops / excessive delegation depth in multi-agent flows) | ✅ Done (2026-08-17/18) | `utils/buildAgentflow.ts` reads the `loop_recursion_detection` policy (default `maxSteps:25`) and halts an AgentFlow V2 execution once its step count exceeds the configured max | Max-depth/step-count circuit breaker on supervisor/worker and sequential-agent loops |
| Egress filtering (block/flag outbound data that could exfiltrate sensitive content) | ✅ Done (2026-08-17/18) | `packages/components/src/toolPolicy.ts`'s `checkEgressFiltering` — blocks a tool call whose stringified arguments match a blocked-domain pattern (seeded default: loopback/link-local/metadata-endpoint hosts, an SSRF-style baseline) before the call runs | Outbound-request inspection at the tool-call boundary |
| Confused-deputy prevention (agent can't use its own elevated privileges on behalf of a less-privileged caller) | ✅ Done (2026-08-17/18) | `utils/preflightGuardrails.ts`'s `resolveTrustedToolCallerUserId`, called from `AgentAsTool.ts` — an inner `AgentAsTool` call's claimed triggering-user id is only trusted as the execution principal if the guardrail is enabled AND that user is verified as an active member of the target workspace; otherwise falls back to no principal (today's existing, more restrictive default), never to trusting an unverified id | Delegation-boundary check between caller identity and agent's own service-identity privileges |
| Memory & RAG write validation (poisoned input persisting via agent memory or document-store writes) | ✅ Done (2026-08-17/18) | `services/documentstore/index.ts` checks the `memory_rag_write_validation` policy (a custom regex/pattern denylist, empty by default) against content before a document-chunk write | Write-path content validation before a memory/vector-store commit, not just read-path RAG retrieval |

**Correction (2026-08-18):** the six rows above were documented as `🔴 To build`/`enforcementStatus:'planned'` in this file as recently as the prior pass, but the actual code shipped in the *same* commit (`4e8adc8`) already flips all six to real, wired enforcement via a follow-on `GuardrailCatalogBatch3Enforcement` migration — the doc pass in that commit simply didn't catch up to the final code state before it was committed. Verified directly against the running code (migration content, call sites in `preflightGuardrails.ts`/`toolPolicy.ts`/`buildAgentflow.ts`/`AgentAsTool.ts`/`documentstore/index.ts`), not assumed from the commit message. See `rules/known-issues.md` #015.

## 10. Compliance & Data Governance

| Epic | Status | Accelance evidence | Reference Pattern |
| --- | --- | --- | --- |
| Audit log (who did what, when, to what) | ✅ Done (2026-08-17/18), first pass | `database/entities/AuditLog.ts`, `services/audit-log`, `routes/audit-log` — records are written from `controllers/guardrails` (`guardrail_policy.upsert`), `controllers/tool-policy` (`tool_policy.upsert`), and `controllers/chatflows` (`chatflow.delete`). Covers guardrail/tool-policy changes and chatflow deletion, **not yet every consequential action** (e.g. no coverage yet for credential/role changes or individual tool calls beyond `ToolCallAudit`, which is a separate, older table) | Append-only audit trail across agent/tool actions |
| Data retention policy (TTL/cleanup for logs, messages, traces) | ✅ Done (2026-08-17/18) | `schedule/RetentionCleanup.ts`, a daily (`0 3 * * *`) cron job started from `index.ts`, deletes chat messages/executions/`ToolCallAudit` rows older than a configured window (default 90 days each, via the `data_retention_policy` catalog entry) | Configurable retention tiers |
| Compliance certifications / data residency (SOC2, GDPR, HIPAA) | 🔴 To build (lowest priority until contractually required) | none — deliberately left as a static "not yet built" placeholder on `/compliance`, since it's an external audit/legal process, not a coding task | Certifications — largely an audit/business process, not just code |
| Policy templates applied platform-wide | ✅ Done (2026-08-17/18), narrow scope | `services/guardrails`' `applyDefaultPolicyTemplate` — applies one hardcoded bundle (currently just PII redaction) to every newly created workspace, and retroactively to an existing workspace when the `policy_templates` catalog entry is toggled on. Not yet a general "define any custom bundle" template system — one fixed default bundle only | Standard rule sets applied to every agent automatically |

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
| Per-workspace token/spend budgets + alert thresholds | 🟡 Partially built (2026-08-17/18) | `spend_token_budgets` guardrail (`utils/preflightGuardrails.ts`) — a per-workspace **prediction-count-per-month** cap (default 10,000) enforced pre-flight, as a proxy until real cost-per-call metering (Langfuse) is wired in. Not a $ or token-based cap, and no warn-before-block threshold yet — see the quota scaffolding also noted in section 6 | FinOps budget guardrails (e.g. 80% warn / 100% block) |
| Model tiering for cost control | 🟡 Available per-flow, not enforced as policy | any chatmodel node, manual choice | Tiered model routing for cost |
| Rate limiting / usage caps | 🟡 Built, disabled | `LICENSE_QUOTAS` (`PREDICTIONS_LIMIT`, `FLOWS_LIMIT`, `USERS_LIMIT`, `STORAGE_LIMIT`) in `UsageCacheManager.ts`, gated behind CLOUD platform mode | Rate/usage caps at plan/tenant/model level |

## 13. Agent Builder Tooling & Evaluation

| Epic | Status | Accelance evidence | Reference Pattern |
| --- | --- | --- | --- |
| Low-code visual flow builder (drag-and-drop canvas) | ✅ Done & configured | `packages/ui` canvas | Low-code agent IDE |
| AI-assisted agent generation from a prompt | 🟡 Built, real bugs found via live testing, several fixed | `services/agentflowv2-generator` — see section 2's fuller row and `rules/known-issues.md` #009 | "SOP-document → agent" generation |
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

## 17. Internationalization (i18n)

| Epic | Status | Accelance evidence | Reference Pattern |
| --- | --- | --- | --- |
| Full platform i18n — en-US, en-GB, de-DE, hi-IN | 🔴 To be built — planned, not started (2026-08-13) | None — confirmed via audit (`packages/ui` has no `react-i18next`/locale dependency or folder; `customizationReducer.js`/`user.entity.ts` have no language field; `packages/server`'s `InternalAccelanceError` throws ~130 hardcoded English messages; 8 English-only `.hbs` email templates under `enterprise/emails/`; date/number formatting is already inconsistent — 14 files use `moment`, 5 use native `toLocaleDateString`, no shared formatter). **Plan** (decisions confirmed with the user 2026-08-13): (1) `react-i18next`+`i18next` on the frontend (Vite-native dynamic `import()` per-locale bundle), `i18next`+`i18next-fs-backend` on the server; new `language` field on the user entity + API endpoint (currently nowhere to persist a locale preference) — this is the one real DB/API-surface change in the plan, everything else is presentation. (2) Standardize date/number formatting on `Intl.DateTimeFormat`/`Intl.NumberFormat` first, independently of translation — en-US vs en-GB alone disagree on date order (MM/DD vs DD/MM). (3) AST codemod (jscodeshift) first-pass extraction of ~400-800+ hardcoded strings across 304 `packages/ui/src` JSX files into `en-US.json`, namespaced per feature, reviewed page-by-page reusing `migration-checklist.md`'s existing page groupings. (4) **User decision: full backend i18n** — all ~130 `InternalAccelanceError` throw sites get re-keyed to translation keys resolved server-side by locale (higher effort/risk than an MVP frontend-fallback-map approach, chosen anyway for completeness). (5) 8 email templates get real per-locale content. (6) **User decision: German/Hindi content via MT draft + mandatory native-speaker review** before shipping (not a vendor, not raw MT) — especially for legal/compliance copy (data-retention policy text, etc.); en-GB is a cheap delta-dictionary over en-US (reverses the word-list from the 2026-08-13 US-English copy sweep), not a full re-translation. (7) **User decision: ESLint no-literal-string rule turned on repo-wide immediately** once infra lands (with a shrinking per-file ignore list as pages migrate), not deferred until the sweep finishes — plus a CI script diffing key sets across all locale JSON files. (8) A maintained do-not-translate glossary (Agent, Agent Swarm, RAG, LLM, node/provider names, etc.) — AI/ML jargon and product terminology are explicitly excluded from translation per the user's direction, same rule as the US-English sweep. Rough estimate: ~6-8 weeks total (full backend-i18n scope pushes this toward the higher end vs. an MVP-fallback approach). Not started — this row exists so the decisions above aren't silently lost before implementation begins. | Standard multi-locale SaaS i18n (react-i18next/i18next + locale-aware Intl formatting + translation-key backend errors) |

---

## Reading this map

Out of roughly 60 epics tracked here, the large majority already exist in this repo in some
form — most of section 1 (core orchestration), all of section 3's building blocks, and all
of section 4 (model access) are fully done. The 🟡 bucket (sections 2, 3, 5, 6, 7, 8, 9, 12,
13, 15, 16) is config/account work, not development — several of those (multi-org platform
mode, usage quotas) turned out to be further along than expected, gated behind a platform
mode rather than missing code. **Update (2026-08-18):** Guardrails (§9) is no longer part of the 🔴 backlog — all six items
that were listed as "planned"/"to build" (prompt-injection defense, topic/action scoping, loop
& recursion detection, egress filtering, confused-deputy prevention, memory & RAG write
validation) shipped with real enforcement in the same commit that built the catalog, plus
Compliance's audit log and data retention policy (§10) — see the correction note under §9 and
`rules/known-issues.md` #015 for why this file didn't reflect that until now. The genuine 🔴
backlog now clusters in two areas — **the Admin/Governance Control Plane and full compliance
certifications** — plus service accounts/ABAC (§6), the specific security invariant of scoping
agent tool access to the acting user's own permissions (already ✅, see §11), and the
org-onboarding process itself (section 16).

---

## Configuration Ownership: Build vs. Platform Setup vs. End-User Setup

The status legend (✅/🟡/🔴) answers "does the code exist?" It doesn't answer "who does the
remaining work?" — and for the 🟡 bucket especially, that's two very different kinds of task
that were being conflated (see the note under the legend at the top of this file). This
section re-sorts every non-done epic along that second axis, cutting across the 17 numbered
sections above:

- **A. To be built** — genuine engineering work, owned by whoever is building the platform.
  This is the 🔴 backlog, plus the handful of 🟡 rows whose remaining work is more dev than
  config (DLP redaction, catalog pagination, CLOUD-mode wiring).
- **B. Platform build-out configuration** — one-time, deployment-wide setup that has to happen
  *before* any tenant can use the feature at all (a shared OAuth app, an infra instance, an
  account with a third-party vendor, a security/governance default). This is done once by
  whoever stands up the platform, not per-customer.
- **C. End-user / tenant self-service configuration** — per-workspace, per-agent, or
  per-integration setup that the UI already supports and that individual customers are meant
  to do themselves as part of normal use, not something to front-load during platform
  build-out. Doing these during the build pass would be premature — there's no real value
  they're configured against yet.

Each entry cross-references its section number (§) above for full detail/evidence.

### A. To be built

| Epic | § | Why it's a build item, not config |
| --- | --- | --- |
| Agent Library/Registry | 1 | New entity + CRUD + list page + canvas save/load/sync UX — planned, not started |
| Centralized tool-call policy — DLP content redaction | 2 | Field-level masking/regex rules on tool input/output were never written |
| Tool/node catalog server-side pagination | 2 | Client-side virtualization shipped; cursor-based server pagination isn't |
| Cost/usage dashboards per workspace | 5 | No aggregated view exists |
| Drift detection | 5 | No behavior-change detection exists |
| Service accounts | 6 | No non-human, project-scoped identity concept exists |
| ABAC / resource tagging | 6 | RBAC is role-only today |
| Multi-org CLOUD mode — self-serve signup, quota enforcement wiring, tenant isolation testing, billing self-service | 6, 16 | Stories 4–7 of the Deep Dive below are new code, not a mode flip (stories 1–3 are config — see bucket B) |
| Dev/staging/prod environment separation | 7 | No environment-per-tier pattern exists |
| Multi-region / HA | 7 | Not needed at current scale — deferred, not estimated |
| HIL policy — runtime gate matrix for manually-built flows | 8 | Today's classifier only gates flows built via the AI generator |
| Approver inbox / review UI | 8 | No dedicated screen for reviewing pending HIL pauses |
| Node-level retry/resume after execution error | 8 | No resume path for a genuine tool/schema failure, only HITL pauses |
| Per-workspace token/spend budgets — real $/token metering | 12 | The shipped `spend_token_budgets` guardrail is a predictions-per-month proxy only; real cost-based metering still depends on Langfuse (§5) being on first |
| Pre-publish evaluation gate | 13 | Eval results don't block anything from going live today |
| Control Tower — budgets/cost view | 14 | Inventory/approvals shipped; budget data still missing |
| Agent lifecycle states (draft → validated → published) | 14 | No lifecycle state exists on flows today |
| Ownerless-agent / risk flagging | 14 | No automated flagging exists |
| Per-org dedicated deployment runbook | 16 | Mechanism works; the process itself was never written down |
| Branded first-party SDK package | 16 | Currently ships under the unforked upstream package name (optional) |
| Full platform i18n | 17 | Confirmed zero existing i18n infra; ~6–8 week plan, not started |

Deliberately excluded from this backlog (see their rows above for why): Compliance
certifications/data residency (§10 — a business/audit process, not a dev task) and the
dedicated Git-backed workflow engine (§15 — deferred until in-graph nodes prove insufficient).
Also excluded, as of the 2026-08-18 correction — not deferred, but already shipped and
enforced: all six §9 guardrails, plus §10's audit log and data retention policy. Enabling any
of these for a given workspace/agent is bucket C work (the `/guardrails` toggle), not bucket A.

### B. Platform build-out configuration (done once, before any tenant can use it)

| Epic | § | What's configured, and why it's mine not the end-user's |
| --- | --- | --- |
| Native connector OAuth apps (Gmail, GDrive, Jira, MS Teams/Outlook, Figma MCP) | 2 | One OAuth app per provider serves the whole deployment; after this, end users just click "Connect" |
| Custom MCP security toggles (`CUSTOM_MCP_SECURITY_CHECK`, `CUSTOM_MCP_ALLOWED_ENV_VARS`) | 2 | A deployment-wide security-posture decision, not a per-tenant one |
| Vector store instance (Qdrant) | 3 | Infra needed before any workspace can use RAG at all (tenants can layer their own credential on top later) |
| Graph database (Neo4j) instance | 3 | Same reasoning as vector stores |
| LLM response cache backend (Redis/Upstash/Momento) | 3 | Deployment-wide performance feature |
| Model tiering policy (cheap vs. frontier convention) | 4, 12 | A written convention + default templates, not a per-tenant setting |
| Model allow/deny-listing | 4 | Deployment-wide governance decision (`MODEL_LIST_CONFIG_JSON`, `DISABLED_NODES`) |
| Tracing backend (Langfuse/LangSmith/Arize/Phoenix) project + API key | 5 | Highest-value single config item in the whole 🟡 bucket per the original estimate; observability is a deployment-wide decision |
| Prometheus / OpenTelemetry metrics + collector | 5 | Infra-level, one collector for the deployment |
| Custom observability SDK (`packages/observe`) scope assessment | 5 | A short investigation task before anyone can rely on it |
| Queue mode / BullMQ (`MODE=queue`) | 7 | Infra-level worker-pool decision |
| Production security toggles (HTTP/OAuth2 checks, path-traversal, trust-proxy) | 11 | Must be reviewed/set before sitting behind a real load balancer, deployment-wide |
| Stripe account + plan-tier definitions for CLOUD mode | 6, 16 | Stories 1–3 of the Deep Dive below — a platform business decision, prerequisite to any org self-serving |
| Rate limiting / usage caps wiring | 12 | Tied to the CLOUD-mode decision above, not a per-tenant toggle |
| First org's SSO provider (if launching with SSO enabled on day one) | 6 | Every *subsequent* org configures its own via slug routing — see bucket C |

### C. End-user / tenant self-service configuration (leave for the customer, don't front-load)

| Epic | § | Why this waits for the end user |
| --- | --- | --- |
| Pre-obtained-token connectors — Salesforce, DocuSign, QuickBooks, Xero | 2 | Each tenant supplies their own personal token; there's no shared app to register |
| API-key connectors — Discord, Twilio, Airtable, Shopify, Zendesk, Intercom, Freshdesk, Asana, Trello, Monday.com, ClickUp, Mailchimp, SendGrid, Klaviyo, Zoom, Telegram, WhatsApp, GitLab, Bitbucket, CircleCI, Vercel, Datadog, PagerDuty, Dropbox, Box, Segment, Amplitude, Mixpanel, Azure services, ServiceNow, Okta, Confluence, Jira Service Mgmt, Claude/GPT sub-agent | 2 | Each tenant enters their own account's API key via the existing Credentials UI |
| MCP servers — Notion, Linear, Sentry, Browserbase, registry imports, Pipedream | 2 | Connected per-workspace, as needed, by whoever wants that integration |
| Composio account/API key | 2 | Supplemental by product direction (§2) — bring-your-own, not platform-provisioned |
| Document Store content ingestion | 3 | Populating it with real documents is a usage-time task, not platform setup |
| Additional SSO providers (2nd org onward) | 6 | Per-org self-service via slug-based routing (`09d279e`) — that's the point of the feature |
| Guardrail policy enablement per workspace/agent (content moderation, PII redaction, tool allowlist) | 9 | The `/guardrails` admin page exists specifically so workspace admins toggle these themselves |
| HumanInput checkpoint placement into a specific flow | 8 | A flow-design choice made by whoever builds that agent, not a platform prerequisite |
| Scheduling — first scheduled flow | 15 | Set up per automation the customer actually wants |
| Webhooks — first webhook registration | 15 | Per integration the customer wants, not a platform default |
| Evaluations framework — first dataset/evaluator | 13 | Created per agent being evaluated, by whoever owns that agent |
| Marketplace "Save As Template" | 13 | Any user can do this today, zero platform prerequisite |

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

**AI-assisted agent generation** — Generate a working agentflow from a natural-language prompt/spec. Built, but live testing (2026-08-12/13) found and fixed several real bugs (tool reuse, safety-by-default, model consistency, router/agent content generation — see `rules/known-issues.md` #009); still being hardened against a wider range of prompts. **Effort: 0 days for what's fixed; ongoing as new failure modes surface from real use.**

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

**Provider-agnostic LLM access** — 30 chat-model providers already wired in, including self-hosted/local options (Ollama, LocalAI) and a LiteLLM gateway node. Added Moonshot AI (Kimi) as a standalone node/credential (`chatMoonshot`, OpenAI-compatible endpoint) on 2026-08-17; also refreshed the hand-maintained model catalogs for Groq, Mistral AI, Alibaba Tongyi, and Cerebras in `packages/components/models.json`, which had drifted stale relative to OpenAI/Anthropic/Gemini (kept current by the daily `refreshModelList` job) and Bedrock/Azure (kept current by hand). Non-refreshed catalogs (Perplexity, Cohere, Baidu Wenxin, DeepSeek) were checked and found already current. **Effort: 0 days** — see Q3 below.

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

**HIL policy (which actions require approval)** — Done for the AgentFlow V2 auto-generator specifically: a naming-convention write-capable-action classifier now drives a non-optional safety rule in the generation prompt plus a deterministic post-generation check. Manually-built flows still have no platform default — this was scoped to fixing the generator, not the general epic. **Effort remaining: ~2 days** to extend the same classifier into a real runtime gate matrix (today it only forces gates into *generated* flows and warns about ungated ones; it doesn't enforce anything on flows built by hand or already deployed).

**Approver inbox / review UI** — No dedicated screen for reviewing/acting on pending HIL pauses exists; today it would have to be handled ad hoc per flow. **Effort: 4 days**, or folds into the Admin/Governance dashboard build if that's done first.

### 9. Guardrails & Safety

**Guardrails & Compliance catalog** — Built 2026-08-17: a DB-backed catalog (`GuardrailCatalogItem`, seeded by migration with 5 standard entries: `content_moderation`, `tool_allowlist`, `pii_redaction`, `prompt_injection_defense`, `topic_action_scoping`) plus per-workspace/per-agent enable state (`GuardrailPolicy`, mirroring `AgentToolPolicy`'s sentinel-row/most-specific-match-wins convention). A canvas-level "Guardrails & Compliance" panel (new group in `ChatflowConfigurationDialog`) shows every catalog entry's effective state and source (workspace default / overridden for this agent / detected on canvas / off) for the agent currently open, plus a shield-icon count badge in the canvas header for at-a-glance visibility, plus a small green shield marker on any `category==='Moderation'` node card. Users can also create custom catalog entries (name + description, policy-type, reuses the redaction enforcement path). **Deliberately out of scope for this pass, per the design discussion that scoped it**: true Compliance items (audit log, data retention, certifications) stay out of the catalog entirely — they're org/workspace admin settings, not agent-scoped, and don't fit the node/policy model this catalog uses. **Update (2026-08-17, cont'd):** the workspace-level admin screen noted as missing above is now built — `views/guardrails/index.jsx` at `/guardrails`, listed in the sidebar under Studio, letting an admin set workspace-wide defaults and see how many agents currently override each guardrail, via the same endpoints the per-agent panel already used (no new routes).

**Update (2026-08-17, cont'd again):** split the single "Guardrails & Compliance" label into two — the user pointed out nothing compliance-related (§10: audit log, retention, certs) actually existed behind that name, which was misleading. "Guardrails" (nav item + canvas panel + `/guardrails` page) now covers only the 5 real catalog entries. A new, separate "Compliance" nav item + `views/compliance/index.jsx` (`/compliance`) plainly lists the §10 items as **not yet built** — no toggles, no fake persistence, just visibility that they don't exist yet. Also extracted the duplicated row-rendering markup from the canvas panel and the `/guardrails` page into a shared `ui-component/extended/GuardrailRow.jsx`, fixing a real responsive-layout bug in the process (a title+badge row with no `flexWrap`/`minWidth:0` collapsed into a single narrow, character-wrapped column at some viewport widths). Also found and fixed a genuinely non-obvious bug while adding the two new sidebar entries: the actual rendered sidebar (`accelance-shell/AccelanceSidebar.jsx`) ignores `menu-items/dashboard.js`'s `icon:` prop entirely and looks up icons by item id in its own Lucide-based registry — see `rules/known-issues.md` #012.

**Update (2026-08-17, catalog batch 2):** a taxonomy review against NIST AI RMF / OWASP LLM Top 10 / MLCommons hazard categories / agent-specific guardrail patterns (prompted by the user) surfaced two kinds of gap, both closed the same way — new seeded catalog rows, no enforcement code: (1) **cross-links to backlog items that already existed but were invisible from `/guardrails`** — `spend_token_budgets` (policy, planned, points to §12 FinOps budgets, still 🔴) and `hitl_approval_gates` (node, enforced, maps to the existing `humanInputAgentflow` node — real when placed, not policy-toggleable, matching how Content Moderation is represented); (2) **four genuinely new agent-specific guardrail concepts with zero prior representation anywhere**, added as new §9 rows above (`loop_recursion_detection`, `egress_filtering`, `confused_deputy_prevention`, `memory_rag_write_validation`), all `enforcementStatus:'planned'`. Also added 4 reference-only rows to the `/compliance` page (NIST AI RMF, ISO/IEC 42001, EU AI Act, OWASP LLM Top 10) naming frameworks worth mapping to later — explicitly not a certification claim, no code behind them. **Deliberately not done in this pass**: MLCommons/Llama-Guard-level category granularity inside Content Moderation's deny-list, domain-specific compliance packs (healthcare/fin-services/HR), and any real enforcement of the four new planned items — each is a separate, non-trivial future epic (egress filtering in particular has no existing network-boundary chokepoint to hook into anywhere in the flow-execution path).

**Update (2026-08-17/18, catalog batch 3 — real enforcement, corrected 2026-08-18):** all six items seeded as `'planned'` in batch 2 (`prompt_injection_defense`, `topic_action_scoping`, `loop_recursion_detection`, `egress_filtering`, `confused_deputy_prevention`, `memory_rag_write_validation`) plus `spend_token_budgets` flip to `enforcementStatus:'enforced'` via a follow-on `GuardrailCatalogBatch3Enforcement` migration, each with a sensible seeded `defaultConfig` since no config-editing UI exists yet — none can be customized, only toggled on/off, until that UI exists. Three new compliance-category catalog entries also ship as real (not placeholder): `audit_log`, `data_retention_policy`, `policy_templates` — see §10. This migration shipped in the *same* commit as the batch-2 seed above (`4e8adc8`), but this file's own documentation pass didn't catch up to it until this correction — verified directly against the migration content and each call site, not assumed from the commit message (see `rules/known-issues.md` #015). Full detail per item below.

**Content moderation** — OpenAI Moderation + deny-list nodes exist, unused, deny-list empty. Now discoverable via the catalog above (detected if dragged onto canvas), but the nodes/deny-list themselves are unchanged. **Effort: 1 day** to wire into a first flow and populate a starter deny-list.

**Prompt-injection defense** — `packages/components/src/toolPolicy.ts`'s `applyPromptInjectionWrapping` wraps every successful tool-call result in `[UNTRUSTED TOOL OUTPUT]` delimiters before the LLM re-reads it. **Effort: 0 days** — nothing to configure beyond enabling the toggle.

**PII detection & redaction** — Built 2026-08-17, regex-based (not NER): `utils/contentRedaction.ts` redacts email/phone/SSN/card-pattern matches (plus any custom regex patterns from a policy's config) in every chat message before it's persisted, gated behind the `pii_redaction` catalog policy being enabled for that workspace/chatflow (off by default, opt-in). **Effort remaining: ~2 days** for an NER-based pass to catch what regex patterns miss (names, addresses, free-text PII).

**Topic/action scoping** — `utils/preflightGuardrails.ts`'s `checkPreflightGuardrails`, called before every flow type executes, refuses the request with a configured message if the question matches a denied-topics list (seeded default: self-harm/suicide/illegal drugs/weapons/child exploitation). **Effort remaining: ~1 day** for a UI to edit the denied-topics list per workspace instead of relying on the seeded default.

**Loop & recursion detection** — `utils/buildAgentflow.ts` halts an AgentFlow V2 execution once its step count exceeds a configured `maxSteps` (default 25). **Effort: 0 days.**

**Egress filtering** — `toolPolicy.ts`'s `checkEgressFiltering` blocks a tool call whose arguments match a blocked-domain pattern (seeded default: loopback/link-local/metadata-endpoint hosts — an SSRF baseline, not a general DLP/exfiltration scanner). **Effort remaining: ~2 days** to widen the default pattern set and add a config-editing UI.

**Confused-deputy prevention** — `utils/preflightGuardrails.ts`'s `resolveTrustedToolCallerUserId`, called from `AgentAsTool.ts`, only trusts an inner call's claimed triggering-user id after verifying that user is an active member of the target workspace. **Effort: 0 days.**

**Memory & RAG write validation** — `services/documentstore/index.ts` checks a custom regex/pattern denylist (empty by default) against content before a document-chunk write. **Effort remaining: ~1 day** to seed a sensible non-empty default pattern set, since an empty denylist enforces nothing until an admin populates it.

**Update (2026-08-19, Guardrails v2 — Phase 0 + Phase 1 of `Guardrails_build_plan.md`):**
a separate planning doc called for replacing this boolean-toggle catalog with a DB-driven,
drag-and-drop node system (Kind → Definition → Node instance; verdict contract;
`inline`/`attached`/`flow` placement) — full rationale in `rules/guardrails-v2/` (four Phase 0
artifacts: `kinds.md`, `verdict-contract.md`, `definition-schema.md`, `phase0-audit.md`, plus a
`reconciliation.md` accounting for every catalog row) and the "Guardrails Rearchitecture
Phase 0 + Phase 1" implementation plan. Two corrections the plan's own problem statement got
wrong, found by reading the real code rather than trusting the doc (same discipline as
`known-issues.md` #015): the catalog above is **14 rows, not 5**, by the time this landed
(11 guardrail-category above + 3 compliance-category in §10); and
`memory_rag_write_validation`/`audit_log`/`data_retention_policy` are real but
workspace-scoped-only checks with no chatflow to attach to, not items with "no live
enforcement" as first assumed.

Built this pass: three new entities (`GuardrailDefinition` replacing `GuardrailCatalogItem` as
the source of truth going forward, `GuardrailFlowAttachment` — chatflow-scoped, no more
workspace-wide `''` sentinel — and append-only `GuardrailVerdict`); a 5-migration batch
(`1791000000000`–`1795000000000` × 4 drivers) seeding 13 of the 14 catalog rows
(`policy_templates` deleted outright, not migrated — its whole function was the
retroactive-apply mechanism §2.2 removes) and backfilling `GuardrailFlowAttachment` for the 7
keys that are genuinely chatflow-scoped and read `GuardrailPolicy` today (`pii_redaction`,
`topic_action_scoping`, `spend_token_budgets`, `prompt_injection_defense`, `egress_filtering`,
`confused_deputy_prevention`, `loop_recursion_detection`) — verified against the real dev DB:
13 definitions, 147 attachment rows (21 chatflows × 7 keys), re-running the backfill SQL a
second time confirmed idempotent (147 → 147, no duplicates). The `/guardrails` page is now a
read-only catalog browser (no toggles, no override counts, no custom-catalog authoring) per
§2.2 — the per-agent canvas panel and the `/compliance` page's `data_retention_policy` toggle
are unchanged and still fully functional.

**Load-bearing design choice, verified not asserted:** every one of the 7 backfilled keys'
real block/allow decision is **still made by the OLD `GuardrailPolicy`-backed `evaluate()`
path, unchanged** — the new `GuardrailFlowAttachment`-backed path only records a
`GuardrailVerdict` for later diffing, never blocks anything itself. One exception required
explicit handling: fixing `known-issues.md` #017 (a `databaseEntities` plumbing bug that had
silently disabled Prompt-Injection Defense and Egress Filtering on AgentFlow V2 Tool nodes)
makes their old path functional *for the first time* — since that path was never actually
live, simply fixing the bug would itself have turned on real enforcement for the one real
workspace that already has both toggled on (confirmed via direct DB query: 18 live AgentFlow
V2 agents). `toolPolicy.ts` now gates the real action behind an explicit `isPromoted()` check
(a `GuardrailFlowAttachment.observeMode === false`, which nothing in this codebase ever sets)
— verified directly against the real database and real toggle state: a tool call matching a
blocked egress pattern is still allowed through, and prompt-injection wrapping still doesn't
happen, while the correct "would have blocked"/"would have redacted" verdicts are written to
`guardrail_verdict`.

**Residual risk, stated plainly rather than assumed away:** the backfill migration was
verified against postgres only (the real dev DB) — mysql/mariadb/sqlite were not exercised
against real instances of those drivers in this pass. **Update (2026-08-19):** the seed
migration's idempotency gap was closed — a follow-up migration
(`1797000000000-MakeGuardrailDefinitionKeyVersionUnique`) replaced the plain index on `key`
with a real `UNIQUE(key, version)` constraint, applied to the live dev DB and proven via both a
duplicate-insert rejection and a legitimate-new-version-success test; "current version" for a
key is application-determined (`deletedAt IS NULL AND supersededByDefinitionId IS NULL`), not
`MAX(version)`. All 5 original migrations have a `down()` method, but none has been tested
executing.

**Update (2026-08-20, Guardrails v2 — Phase 2 of `Guardrails_build_plan.md`):** the approved
Phase 2 plan targeted AgentFlow V2 host nodes and a DB-synthesized ("no physical file") node
system; both were corrected mid-build after verifying the actual mechanisms directly against
the code — full account in `rules/guardrails-v2/phase2-canvas.md`. In short: AgentFlow V2 has
no typed-connection anchor mechanism at all (tools are picked from a dropdown, not wired via
canvas handles), so host nodes became classic `ToolAgent.ts` (v2.0→2.1) and `AgentAsTool.ts`
(v1.0→1.1) instead of AgentFlow V2's `Tool.ts`/`Agent.ts`; and DB-synthesized nodes are
impossible on the classic build path (a node must be a real file scanned by `NodesPool` to be
`.init()`-able), so `egress_filtering`, `prompt_injection_defense`, and
`confused_deputy_prevention` shipped as 3 real physical component files under
`packages/components/nodes/guardrails/` instead — the "merged nodes API"/`nodeSynthesis.ts`
piece from the original plan was dropped entirely, not deferred. Each new node attaches via a
new `guardrails` anchor and is wired independently of Phase 1's legacy toggle path (which
remains untouched, still permanently observe-only via `isPromoted()`). **Live verification
completed 2026-08-20** against the real dev instance/DB, including a genuine LLM-backed
tool-call trigger (Calculator tool, real model call after working through several dead
credentials in this workspace): confirmed the palette entry, drag/connect/save/reload
persistence (`guardrails` anchor round-trips as `["{{nodeId.data.instance}}"]`, matching the
classic resolution mechanism), the exact resolved-config shape `runToolEgressGuardrails`
receives at runtime, a shadow-mode run (`GuardrailVerdict` recorded `block`/`observeMode:true`,
tool call still succeeded), and a promote-to-block run scoped to the one node instance (tool
call actually blocked, verdict `observeMode:false`), then confirmed reverting `observeMode`
restores normal behavior. **Follow-up (same day):** a review pass required two more checks
before treating this as signed off rather than accepting "same mechanism, low risk" on faith —
that exact phrase had already been wrong once this build (the AgentFlow V2 host-node
assumption). Both ran: (1) `AgentAsTool.ts`/Confused Deputy Prevention — the real "block" case
needs a claimed identity that isn't a valid workspace member, which a live session (always a
real, valid member) can't produce, so this was proven via direct invocation of the real
compiled function against the real DB instead (4 cases: shadow+valid, promoted+valid,
promoted+invalid="block", shadow+invalid — all correct, each a real `GuardrailVerdict` write,
cleaned up after); (2) existing-flow regression — no real flow in the DB uses these nodes
except one unrelated pre-existing broken row, so a clean substitute was saved under the
pre-Phase-2 code, triggered, then reopened unmodified under current code and re-triggered —
byte-identical error, no data loss, correct sync-warning UI. Both passed. Full evidence in
`rules/guardrails-v2/phase2-canvas.md`.

**Phase 2 remaining scope, in progress per `Guardrails_end_to_end_protocol.md` (2026-08-20/21):**
connection validation and the config-panel round-trip are both done and Tier-A-verified against
the live Neon DB. Connection validation: gave each of the 3 guardrail nodes a specific
`baseClasses` entry (`ToolCallGuardrail`/`IdentityGuardrail`) instead of a shared generic
`'Guardrail'` type, so the existing `isValidConnection` type-matching now structurally rejects
wrong-host attachments (e.g. Confused Deputy Prevention → `ToolAgent`) — live-tested, 4/4
correct. Config-panel round-trip: full save/reload cycle for all 3 nodes' real params
(`blockedDomainPatterns`, `observeMode`) verified byte-identical against the DB and a hard page
reload; surfaced and closed a real, pre-existing catalog/reality mismatch on
`prompt_injection_defense` (DB `paramSchema` implied 2 configurable params the shipped node
never had) via a proper new-version migration row, not an in-place edit, confirmed
before/after against the live DB with a negative case (other 12 keys untouched).
**Observe-vs-block UI state (2026-08-21), done:** `CanvasNode.jsx` now renders an amber/green
shield badge on any `category:'Guardrails'` node reflecting its `observeMode` — live-updates on
toggle with no save/reload (Tier B), and confirmed via a hard reload against a real 3-node
fixture that all 3 badge colors exactly matched the persisted DB `observeMode` values (Tier A).
**Content Moderation/HITL placement decision (2026-08-21), done:** decided neither gets the
attached-node treatment the other 3 guardrail nodes use — both already have a real placement
mechanism (the Moderation node itself; the Human Input node), so `placement` was corrected from
the seeded (wrong) `'attached'` to `'inline'` for both, via a proper versioned migration, not an
in-place edit, verified before/after with a negative case on the other 11 keys. Catalog
descriptions reconciled to current real capability in the same migration: `content_moderation`
= built-but-unconfigured, `hitl_approval_gates` = real-when-placed. No UI build required — the
`/guardrails` catalog page already renders `description`/`category` generically. **All four
Phase 2 remaining-scope items are now closed — Phase 2 is fully signed off as of 2026-08-21.**
Full evidence in `rules/guardrails-v2/phase2-canvas.md`.

**Not built this pass, deliberately:** dynamic DB-driven node registration (so a
`GuardrailDefinition` row becomes a droppable canvas node with no code changes) was not built
and — per the Phase 3 authoring-mechanism re-confirmation done 2026-08-21
(`rules/guardrails-v2/phase3-authoring-mechanism.md`) — never will be; it isn't required.
`NodesPool` does a one-shot boot-time scan with no hot-reload path anywhere in this codebase,
confirmed directly in code, so "no restart/deploy" for user-authored guardrails is instead
satisfied the same way `CustomTool.ts`/`CustomMCP.ts` already satisfy it for custom
tools/MCP servers: one or two generic wrapper node(s), always in the palette, whose
`asyncOptions` dropdown resolves the user's saved custom `GuardrailDefinition` rows at
flow-build time — zero new physical files per user-authored definition, ever. This unblocks
Phase 3; the only addition to Phase 3's stated build list is two small generic node files
(`CustomToolCallGuardrail.ts`/`CustomIdentityGuardrail.ts`, one per host category, so Phase 2's
static connection-validation guarantee isn't broken by a single overly-permissive generic type).
Also still not built: inline pass/fail ports (the two catalog-only keys corrected to `inline`
placement 2026-08-21 are description-only, not a rendered port on canvas — see
`phase2-canvas.md`), the dry-run tester, and framework-coverage reporting on `/compliance`.

**Phase 3 (Authoring) started 2026-08-21** (`rules/guardrails-v2/phase3-authoring.md`): first
unit built one real generic `regex_match` kind executor
(`evaluateRegexMatch` in `packages/components/src/guardrails/kinds/regexMatch.ts`) —
a real finding surfaced first: neither of the two existing "kind executors" is actually generic
(`checkEgressPattern`/`wrapPromptInjection`/`verifyWorkspaceMembership` are each hardcoded to
one specific existing definition, none take arbitrary user-supplied config), so authoring v1 is
correctly scoped to `regex_match` only until other kinds get their own real generic executor.
Verified directly (8 cases: match/no-match across block/flag/redact, multi-match redact,
invalid-pattern fails closed to `block` rather than throwing, empty/non-string content).
**Unit 2, done:** `POST /api/v1/guardrails/definitions` — building it surfaced a real bug in a
Phase 1 non-negotiable: the `UNIQUE(key, version)` index wasn't scoped by workspace, so two
workspaces choosing the same custom key would have collided. Fixed via a 4-driver migration to
`UNIQUE(COALESCE(workspaceId,''), key, version)` (same `''`-sentinel idiom `GuardrailPolicy`
already uses), verified with 3 transactional negative-case proofs directly against the DB
(different workspaces: no collision; same workspace: still collides; two system rows: still
collides) plus 5 live-endpoint cases (valid create, duplicate-key rejection, invalid-pattern
rejection, unsupported-kind rejection, malformed-key rejection). `defaultObserveMode` is forced
`true` server-side, never client-controllable.
**Unit 3, done:** building the wrapper node surfaced a deeper gap — the runtime dispatcher only
recognized 2 hardcoded built-in keys, so any custom guardrail would have attached and shown a
live badge while being completely inert. User rejected the simpler "fix to post-call" option and
directed real (narrowed) scope: `hooks` (`pre`|`post` only, `both` explicitly deferred) is now an
author-chosen field consumed by a real dispatcher (`runCustomToolCallGuardrails`), wired into
`ToolAgent.ts`'s existing wrap path, plus the actual `CustomToolCallGuardrail.ts` wrapper node
(following `CustomTool.ts`'s exact precedent). Proven via direct invocation of the real compiled
code with captured logs showing execution order: pre-hook blocked strictly before the real tool
call ran (based on args), post-hook ran after and redacted based on the result even when the
pattern was absent from args entirely; real `GuardrailVerdict` rows confirmed written. Not yet
built: framework packs, a create-definition UI form, and `CustomIdentityGuardrail.ts`
(deferred — no generic identity-scoped kind executor exists yet).
**Unit 4, done:** `POST /api/v1/guardrails/definitions/dry-run` — runs the exact same generic
executor and validator a saved definition would use, against a real sample input, with zero DB
writes. Live-tested 5 cases (match/no-match/redact-with-real-transformedPayload/invalid-pattern/
unsupported-kind); confirmed `guardrail_definition`/`guardrail_verdict` row counts unchanged
(16/0) before and after, proving the tester never persists anything — satisfies the protocol's
explicit "before save" requirement for this unit.

### 10. Compliance & Data Governance

**Audit log** — `database/entities/AuditLog.ts` + `services/audit-log`, built 2026-08-17/18. Records guardrail-policy changes, tool-policy changes, and chatflow deletion. **Effort remaining: ~3 days** to extend write-path hooks to the remaining consequential actions (credential/role changes, individual predictions) — first pass covers governance-relevant changes, not literally everything.

**Data retention policy** — `schedule/RetentionCleanup.ts`, a daily cron job (`0 3 * * *`) deleting chat messages/executions/`ToolCallAudit` rows older than a configured window (default 90 days each). **Effort: 0 days** for the mechanism; per-workspace override UI (today it's one global default) is a small fast-follow if needed.

**Compliance certifications/data residency** — Largely an audit/business process (external audit, legal review, region guarantees), not a coding task. **Effort: not a dev estimate — pursue only once a contract requires it**, and only after the technical controls above exist.

**Policy templates platform-wide** — 🔴 **Deleted 2026-08-19**, not built. `applyDefaultPolicyTemplate`, `DEFAULT_POLICY_TEMPLATE`, the `policy_templates` catalog row, and its workspace-creation call site are all removed per the Guardrails v2 rearchitecture §2.2 — no workspace-wide defaults or retroactive-apply concept exists in the new model. Revisit only if a future "framework packs a builder applies to one agent" feature is scoped (build-plan §11 flags this as the likely redefinition, not a straight rebuild).

### 11. Security & Permission Model

**Encrypted secrets at rest** — Working today. **Effort: 0 days.**

**Production security toggles** — Exist, left on defaults. **Effort: 0.5 day** to review and set deliberately before sitting behind a real load balancer.

**Agent principal model (agent acts only within its user's own permissions)** — Done. `userId` threaded through the execution path, `CredentialAccess` grants enforced at the tool-call chokepoint. **Effort: 0 days.**

**Least-privilege per-agent tool allowlist** — Done. `AgentToolPolicy` enforced at the same chokepoint. **Effort: 0 days.**

### 12. Cost / Token / FinOps Management

**Per-call cost tracking** — Exists via Langfuse + the evaluations cost calculator, dormant until Langfuse is on. **Effort: 0 days** once section 5's Langfuse item is done.

**Per-workspace token/spend budgets + alerts** — Partially built 2026-08-17/18: the `spend_token_budgets` guardrail (`utils/preflightGuardrails.ts`) enforces a per-workspace predictions-per-month cap (default 10,000) as a proxy, pre-flight, before every flow runs. Not a $ or token-based cap, and no warn-before-block threshold — see also the quota scaffolding in section 6. **Effort remaining: ~4 days** for real cost-based metering once Langfuse (§5) is on, plus a warn/block threshold pair.

**Model tiering for cost control** — Same item as section 4; listed here for the cost angle. **Effort: 2 days** (shared with the section-4 estimate, not additive).

**Rate limiting/usage caps** — `LICENSE_QUOTAS` + `UsageCacheManager` already implement this, gated behind CLOUD platform mode. **Effort: 2 days** to verify/wire the existing quota mechanism rather than build one, once Q2's platform-mode decision is made.

### 13. Agent Builder Tooling & Evaluation

**Low-code visual builder** — Core product, already in daily use. **Effort: 0 days.**

**AI-assisted agent generation** — Same item as section 1; see that row for current status (built, being hardened against real bugs found via live testing). **Effort: 0 days for what's fixed so far.**

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
