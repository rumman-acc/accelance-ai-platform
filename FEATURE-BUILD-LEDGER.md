# Feature Build Ledger

Every tracked epic across the platform — what it's for, how much of it exists in this
codebase today, and what closes the gap. Condensed from `rules/epics-feature-status.md`
into a flatter, description-first sheet; that file remains the source of truth (file/path
evidence, full effort-estimate detail, the multi-tenant SaaS deep-dive). Re-derive this file
from there if the two drift.

**Build %** is a directional estimate translated from that doc's qualitative status +
effort-days — not a number that exists verbatim in the source. Most "Built, not configured"
rows are engineering-complete but unconfigured/untested against live credentials, which is
not the same as verified in production.

Status legend: ✅ Done · 🟡 Built, not configured · 🔴 To be built

**Summary: 90 tracked features — 33 done · 39 built-not-configured · 18 to be built.** (Revised
2026-08-18: 8 §9/§10 guardrail/compliance items moved 🔴→✅ and 3 moved 🔴→🟡 — they were already
built and enforced, just undocumented; see `rules/known-issues.md` #015.)

**TODO (2026-08-19, extended 2026-08-20):** the summary counts above don't yet reflect the
Guardrails v2 rearchitecture rows changed since (Guardrails catalog ✅-leaning→🟡 40%→55%,
Policy templates ✅→🔴) — `rules/epics-feature-status.md` §9/§10 is up to date and remains the
source of truth; re-derive this file's summary line from it rather than trusting the number
above until it's recounted.

**Who configures what:** the ✅/🟡/🔴 status here answers "does the code exist?" — it doesn't
say who does the remaining work. `rules/epics-feature-status.md`'s "Configuration Ownership"
section re-sorts every non-done epic into build backlog vs. one-time platform build-out setup
vs. end-user/tenant self-service — read that before scoping a build-out plan off this sheet.

---

## 1. Core Orchestration & Agent Execution

| Feature | What it's for | Status | Built | Scope / what's left |
| --- | --- | --- | --- | --- |
| Agentflow V2 ("Agent Swarm") | Visual multi-node orchestration — Agent, Condition, Loop, Iteration, ExecuteFlow nodes composed on a canvas. The core flow-builder capability. | ✅ | 100% | Core product — nothing to close. |
| Multi-agent Supervisor/Worker | Supervisor-delegates-to-workers pattern most from-scratch multi-agent frameworks propose building. | ✅ | 100% | Nothing to build. |
| Sequential Agents | A third, more explicit state-machine-style agent system (named State nodes, RECEIVED→DONE). | ✅ | 100% | Nothing to build. |
| Classic single agents | ToolAgent, ReAct, XMLAgent, OpenAI Assistants, LlamaIndex — for when a full graph is overkill. | ✅ | 100% | Nothing to build. |
| Classic Chains | 11 pre-agentflow chain types (LLMChain, ConversationalRetrievalQAChain, ApiChain, SqlDatabaseChain, GraphCypherQAChain, etc.). | ✅ | 100% | Bonus capability most comparable stacks don't name at all. |
| AI-assisted agent generation | Generates a working Agentflow from a natural-language prompt/spec — the "SOP-document → agent" pattern. | 🟡 | 75% | Real bugs found via live testing (2026-08-12/13), several fixed. Not yet stress-tested against a wide variety of prompts/graph shapes — ongoing hardening. |
| Agent Library/Registry | A reusable, standalone Agent entity independent of any one flow. | 🔴 | 0% | Planned, not started. New entity + list page + save/load/sync actions. ~4 days MVP; live-sync/multi-node-type support/impact view are phase 2 (~2–3 more days). |

## 2. Tool / Integration Execution Layer

| Feature | What it's for | Status | Built | Scope / what's left |
| --- | --- | --- | --- | --- |
| Native tool nodes (Gmail, GDrive, Jira, Teams/Outlook, Composio, MCP, custom REST) | The original built-in connector library. | 🟡 | 90% | 100% engineering-complete — remaining step per integration is registering an OAuth app, ~0.5–1 day each, not dev backlog. |
| Native connectors — batch 1 (12): Salesforce, HubSpot, Discord, Twilio, Airtable, DocuSign, Shopify + Notion/Linear/Sentry/Figma/Browserbase (MCP) | First market-gap round closing CRM/PM/comms/data/e-sign/e-commerce/dev gaps. | 🟡 | 85% | Salesforce/DocuSign use pre-obtained-token auth, not full OAuth2. Figma OAuth unverified live. All 12 use placeholder icons — swap before wide use. |
| Encrypted per-node credential store + OAuth2 | Mechanism every tool credential is stored and refreshed through. | ✅ | 100% | Mechanism is done — what the tool-credential rows plug into. |
| Centralized tool-call policy enforcement | Runtime allow/deny gate on every tool call, with audit logging. | 🟡 | 70% | "May this run" half is enforced live. DLP content redaction (field masking, regex rules) never built — ~3 days. |
| Custom MCP tool support | Point the platform at any MCP server via a generic node. | 🟡 | 80% | Security toggles exist; no server connected/reviewed yet. ~0.5 day per server. |
| Tools list UI — native tool visibility | Native Tools / Native Connectors / Native MCP Servers as first-class tabs. | ✅ | 100% | Shipped. New nodes just need adding to the classification list. |
| Save custom MCP server from canvas to global list | Turns a one-off canvas MCP config into a reusable workspace-wide entry. | 🟡 | 90% | Works for URL/SSE servers only — stdio configs rejected (schema limitation). |
| Tool/node catalog performance at scale | Keeps the node picker and Tools page usable as the catalog grows. | 🟡 | 60% | Client-side virtualization/pagination/debounce shipped. Server-side pagination not done — fine at ~62 nodes, will matter at aggregator scale. |
| Native connectors — batch 2 (27): support/PM/marketing/comms/dev/finance/storage/analytics | Zendesk, Asana, Mailchimp, Zoom, GitLab, QuickBooks, Dropbox, Segment, and 19 more. | 🟡 | 85% | All built and build-verified. Not configured with real credentials; not tested live. Xero has no refresh-token handling for its ~30-min token lifetime. |
| MCP registry browser | Browse a public directory of community MCP servers, one-click-add. | 🔴 | 0% | Plan drafted, not built. Blocker: current validator blocks the `npx -y` pattern most community servers use — needs a new trust tier, decision pending. |
| Native connectors — batch 3 (13): Azure, Microsoft Graph, ITSM/identity, LLM-as-sub-agent | Azure Blob/Key Vault/DevOps/Entra ID, SharePoint/Excel/Planner, ServiceNow, Okta, Confluence, JSM, Claude/GPT as sub-agent tools. | 🟡 | 85% | All 13 built and build-verified. Not configured/tested live. SAP/Workday deliberately deferred. |
| Dynamic tool infrastructure (save any generated tool to the DB) | Point OpenAPI Toolkit at any spec, save the endpoints actually needed as reusable Tools. | ✅ | 100% | Shipped and verified — reuses the existing Tool entity end to end. |
| Composio catalog importer | Browse/search Composio's 2000+ actions, import only the ones needed as named Tool rows. | 🟡 | 80% | Built, migrated to v3 API after a live v2-retirement bug was caught same day. Older generic Composio node still targets dead v2 (separate fix). No in-app OAuth "connect" flow yet; no live end-to-end test. |

## 3. Memory, Knowledge & RAG

| Feature | What it's for | Status | Built | Scope / what's left |
| --- | --- | --- | --- | --- |
| Vector stores (16+ providers incl. Qdrant) | Embedding storage/retrieval backends for RAG. | 🟡 | 90% | Fully implemented; needs an instance + credential. ~1 day. |
| Document Store (chunking/ingestion pipeline) | Splits, embeds, and indexes source documents for retrieval. | 🟡 | 85% | Empty until content is loaded. ~0.5 day setup + content-proportional time. |
| Document loaders (30+ sources) | Ingestion connectors feeding the Document Store. | ✅ | 100% | Ready to use as-is. |
| Record Manager | Dedup/incremental re-indexing across MySQL/Postgres/SQLite. | ✅ | 100% | Nothing to build. |
| Graph database (Neo4j + GraphCypherQAChain) | Purpose-built graph store for true graph traversal. | 🟡 | 85% | ~1 day to provision an instance and wire a credential when needed. |
| LLM response caching | Semantic/exact response caching (Redis, Upstash, Momento, in-memory). | 🟡 | 85% | Nodes exist, unused. ~0.5 day to enable. |
| Memory node types (12 total) | Buffer, summary, Zep, Mem0, and more. | ✅ | 100% | Ready to use as-is. |

## 4. Model Access & Cost Tiering

| Feature | What it's for | Status | Built | Scope / what's left |
| --- | --- | --- | --- | --- |
| Provider-agnostic LLM access (30 providers) | OpenAI, Anthropic, Bedrock, Vertex, Watsonx, Groq, Mistral, Moonshot AI (Kimi), Ollama, LiteLLM, LocalAI, etc. | ✅ | 100% | Nothing to build. Model catalogs for Groq/Mistral/Alibaba Tongyi/Cerebras refreshed 2026-08-17 (`rules/epics-feature-status.md` § 4); most non-OpenAI/Anthropic/Gemini catalogs are hand-maintained and can drift stale again without a periodic re-check. |
| Embedding providers (16) | Same provider-agnostic layer for embeddings. | ✅ | 100% | Nothing to build. |
| Model tiering (cheap/critic vs. frontier) | Cheaper model for easy steps, frontier for hard ones. | 🟡 | 40% | Selectable per node; no platform-wide policy. ~2 days to define a tiering convention + default templates (policy, not code). |
| Model allow/deny-listing | Restrict which models are selectable platform-wide. | 🟡 | 80% | Env vars exist, unpopulated. ~0.5 day. |

## 5. Observability & Tracing

| Feature | What it's for | Status | Built | Scope / what's left |
| --- | --- | --- | --- | --- |
| Langfuse / LangSmith / Arize / Phoenix tracing | Full LLM call tracing for debugging and evaluation. | 🟡 | 85% | No project/API key created yet. ~1 day — highest-value item in the whole "built, not configured" bucket. |
| Prometheus / OpenTelemetry metrics | Platform-level infra metrics. | 🟡 | 80% | Plumbing exists; `ENABLE_METRICS` unset. ~1 day to enable, +2 days for a real dashboard. |
| Custom observability SDK (`packages/observe`) | In-house observability package. | 🟡 | 60% | Scope/usage unclear. ~0.5 day just to assess. |
| Cost/usage dashboards per workspace | Workspace-level spend/usage view. | 🔴 | 0% | No aggregated view. ~3 days once Langfuse is on. |
| Drift detection | Flags meaningful behavior change over time. | 🔴 | 0% | ~4 days — lowest priority until enough production traffic exists. |

## 6. User, Access & Multi-Tenancy Management

| Feature | What it's for | Status | Built | Scope / what's left |
| --- | --- | --- | --- | --- |
| Org → Workspace → RBAC hierarchy | Core tenancy model. | ✅ | 100% | Fully working today. |
| Custom roles | Roles beyond built-in defaults. | ✅ | 100% | Fully working today. |
| SSO (Auth0 / Azure AD / Google / GitHub) | Enterprise identity-provider login. | 🟡 | 75% | Code exists for all four; none configured. ~2 days for the first, +0.5/additional. |
| API keys | Scoped programmatic access. | ✅ | 100% | Working today. Optional hardening: per-endpoint scoping/expiry, ~2 days. |
| Service accounts | Non-human, project-scoped identities. | 🔴 | 0% | No such concept exists. ~3 days. |
| ABAC / resource tagging | Attribute/tag-based access rules. | 🔴 | 0% | RBAC is role-only today. ~4 days. |
| Multi-org platform mode (true multi-tenant SaaS) | Multiple self-serve, billed orgs sharing one deployment. | 🟡 | 55% | One-org lock removed, per-org SSO works. Billing/quota enforcement exists in code but gated behind an unused platform mode. ~6–8 days for a first rollout. |

## 7. Infrastructure, Scaling & Environments

| Feature | What it's for | Status | Built | Scope / what's left |
| --- | --- | --- | --- | --- |
| Single-service deployment on managed Postgres | Current production deployment model (Neon). | ✅ | 100% | Nothing to build. |
| Queue mode / BullMQ parallel workers | Runs executions through a shared queue across workers. | 🟡 | 85% | Redis provisioned; `MODE=queue` never set. ~0.5 day to flip on. |
| Dev/staging/prod environment separation | Distinct environments before changes reach production. | 🔴 | 0% | No pattern exists. ~4 days — mostly config/process. |
| Multi-region / high availability | Multi-region traffic + failover. | 🔴 | 0% | Not needed at current scale — deferred, not estimated. |

## 8. Human-in-the-Loop (HITL)

| Feature | What it's for | Status | Built | Scope / what's left |
| --- | --- | --- | --- | --- |
| Execution checkpoint (pause/resume, proceed/reject) | Halts a flow before a risky step for a human decision. | 🟡 | 70% | Works, unused in any shipped flow. ~1 day to wire into a first flow. Also surfaced 2026-08-17 as the `hitl_approval_gates` entry in the §9 Guardrails catalog, so it's visible from `/guardrails` too, not just this section. |
| HIL policy (which actions require approval) | Rule set deciding what must pause vs. run autonomously. | 🟡 | 50% | Done for the AI generator specifically; not enforced on manually-built flows. ~2 days to extend into a real runtime gate matrix. |
| Approver inbox / review UI | Dedicated screen for pending approvals across all flows. | 🔴 | 0% | Doesn't exist — handled ad hoc today. ~4 days, or folds into the Admin dashboard. |
| Retry/resume after a genuine execution error | Resume a flow after a real tool/schema failure. | 🔴 | 0% | Confirmed empirically: failed calls just land on ERROR, no retry action. No effort estimate sized yet. |

## 9. Guardrails & Safety

| Feature | What it's for | Status | Built | Scope / what's left |
| --- | --- | --- | --- | --- |
| Guardrails catalog | **Superseded 2026-08-19** by a DB-driven Kind/Definition/Node-instance model per `Guardrails_build_plan.md` — see `rules/guardrails-v2/`. `/guardrails` is now a plain read-only catalog browser (13 definitions across 5 categories); no workspace-wide toggles, override counts, or custom-catalog authoring on that page anymore. | 🟡 | 75% | Phase 0 + Phase 1 (as before) done and verified, including the `UNIQUE(key, version)` constraint added 2026-08-19. **Phase 2 core (2026-08-20), fully signed off:** a real `guardrails` canvas anchor exists on classic `ToolAgent.ts`/`AgentAsTool.ts` (not AgentFlow V2 as originally planned — no anchor mechanism there, discovered mid-build) via 3 real physical node files (`egress_filtering`, `prompt_injection_defense`, `confused_deputy_prevention`) instead of the originally-planned DB-synthesized ones. Live-verified end to end on the real dev instance/DB across 8 steps: palette entry, drag/connect/save/reload persistence, the exact resolved-config shape at runtime, a shadow-mode run (verdict recorded, call unmodified), a promote-to-block run scoped to one node instance (call actually blocked, then reverted), the `AgentAsTool.ts`/Confused Deputy Prevention equivalent (via direct invocation of the real compiled function against the real DB, since the "block" case needs a non-member claim a live valid session can't produce), and an existing-flow regression check (pre/post code swap on the same saved flow, byte-identical error, no data loss). **Phase 2 remaining scope, 4/4 done (2026-08-20/21) — Phase 2 is fully signed off:** connection validation (type-string-based host-category enforcement, live-tested 4/4 correct); config-panel round-trip (full save/reload cycle Tier-A-verified against the live DB + a hard reload, including closing a real `prompt_injection_defense.paramSchema` catalog/reality mismatch via a proper versioned migration); observe-vs-block UI state (an amber/green shield badge on the canvas card reflecting live `observeMode`, confirmed both to update live on toggle and to match the persisted DB value after a hard reload); and the Content Moderation/HITL placement decision (neither gets attached-node treatment — both already have a real placement mechanism, `placement` corrected from the seeded `'attached'` to `'inline'` via a versioned migration, catalog descriptions reconciled to built-but-unconfigured / real-when-placed respectively). Full evidence in `rules/guardrails-v2/phase2-canvas.md`. **Phase 3 (Authoring) unblocked 2026-08-21:** the dynamic-node-registration fork is resolved, in writing, in `rules/guardrails-v2/phase3-authoring-mechanism.md` — dynamic `componentNodes` registration is confirmed to not exist anywhere in this codebase and is not required; user-authored custom guardrails will use the same generic-wrapper-node pattern `CustomTool.ts`/`CustomMCP.ts` already use for custom tools/MCP servers (one node always in the palette, an `asyncOptions` dropdown resolving DB rows at flow-build time), split into two wrapper nodes (one per host category) so Phase 2's static connection-validation guarantee holds. **Phase 3 (Authoring) started 2026-08-21:** unit 1 built a real generic `regex_match` kind executor after finding neither existing "executor" was actually generic (both hardcoded to one specific built-in definition) — authoring v1 correctly re-scoped to `regex_match` only, verified via 8 direct test cases including invalid-pattern fail-closed behavior. Unit 2 built `POST /api/v1/guardrails/definitions`, which surfaced and fixed a real cross-tenant bug in a Phase 1 non-negotiable (`UNIQUE(key,version)` wasn't workspace-scoped) via a 4-driver migration, verified with direct transactional negative-case proofs plus 5 live-endpoint cases. Unit 3 built the actual `CustomToolCallGuardrail.ts` wrapper node, which surfaced a deeper gap — the runtime dispatcher only recognized 2 hardcoded built-in keys, so a custom guardrail would have attached and shown a live badge while being completely inert. User directed real scope: `hooks` (pre/post only, `both` explicitly deferred) is now an author-chosen field driving a real dispatcher, proven via direct invocation with captured logs showing actual execution order (pre blocks strictly before the real tool call; post runs after and redacts based on the result even when absent from args). Unit 4 built the dry-run tester (`POST .../definitions/dry-run`) — runs the real executor/validator with zero DB writes, live-tested 5 cases including a real redact transformedPayload, confirmed row counts unchanged before/after. Unit 5 built the actual create-custom-definition UI form (modeled on `ToolDialog.jsx`, with a live dry-run "Test" button), full browser-tested end to end (create → test → save → appears in catalog on reload → DB-confirmed). "Framework-pack browse and apply" (undefined anywhere in this repo, two unreconciled competing hints) resolved by deferral to Phase 4's already-planned coverage view. Capstone check closed: live proof a new custom definition appears in a fresh chatflow's dropdown with the server running continuously, no restart/deploy. **All of Phase 3's stated build-list items are now closed.** Remaining, not part of the original list: `CustomIdentityGuardrail.ts` (blocked on a real generic identity-scoped executor). **Phase 4 (Governance surface) started 2026-08-21:** unit 1 built `GET /guardrails/verdicts`, the first read path ever for `GuardrailVerdict` (write-only until now), with real pagination and workspace isolation verified via 6 direct-invocation cases against the live DB including the real cross-tenant negative case. Remaining: verdict audit trail UI, framework coverage view (blocked on `frameworkRefs` being populated — currently `NULL` everywhere). |
| Compliance (placeholder) | Separate nav item/page (`/compliance`) — dynamically renders every `category:'compliance'` catalog entry as a real toggleable row; only a small hardcoded `STATIC_NOT_BUILT_ITEMS` list (just Certifications) shows the static "Not yet built" badge. | 🟡 | 90% | Added 2026-08-17. 3 of its 4 underlying features shipped real enforcement 2026-08-17/18 (batch 3) and already render correctly here since the page reads the catalog dynamically, not a hardcoded list — no UI fix needed. Only Certifications is genuinely a placeholder — see their own §10 rows below. |
| Content moderation | Blocks/flags toxic or policy-violating content. | 🟡 | 80% | Nodes exist, unused, deny-list empty. Now discoverable via the catalog above. ~1 day to wire in + populate a starter list. |
| Prompt-injection defense | Separates trusted instructions from untrusted content an agent reads. | ✅ | 100% | Built 2026-08-17/18: every successful tool-call result is wrapped in `[UNTRUSTED TOOL OUTPUT]` delimiters (`toolPolicy.ts`) before the LLM re-reads it. Nothing to configure beyond the enable toggle. |
| PII detection & redaction | Scans and redacts personal data before logging/storing. | 🟡 | 60% | Built 2026-08-17: regex-based redaction (email/phone/SSN/card + custom patterns) wired into every chat message save, opt-in per workspace/agent. ~2 days remaining for an NER-based pass to catch free-text PII regex misses. |
| Topic/action scoping | Bounds what subject matter/actions an agent may touch. | ✅ | 95% | Built 2026-08-17/18: pre-flight denied-topic keyword check (`preflightGuardrails.ts`) before every flow runs, seeded default list. ~1 day remaining for a UI to edit the denied-topics list beyond the seeded default. |
| Loop & recursion detection | Halts runaway loops/excessive delegation depth in multi-agent flows before they burn unbounded time or spend. | ✅ | 100% | Built 2026-08-17/18: AgentFlow V2 execution halts past a configured `maxSteps` (default 25). |
| Egress filtering | Blocks/flags outbound data that could exfiltrate sensitive content via a poisoned tool call. | ✅ | 90% | Built 2026-08-17/18: blocks a tool call whose args match a blocked-domain pattern (seeded SSRF baseline: loopback/link-local/metadata endpoints). ~2 days remaining to widen the default pattern set + add a config-editing UI. |
| Confused-deputy prevention | Stops an agent from using its own elevated privileges on behalf of a less-privileged caller. | ✅ | 100% | Built 2026-08-17/18: an `AgentAsTool` inner call's claimed triggering-user id is only trusted after verifying active workspace membership. |
| Memory & RAG write validation | Validates content before it's written into agent memory/a document store, so poisoned input can't persist across runs. | 🟡 | 70% | Built 2026-08-17/18: document-chunk writes are checked against a custom pattern denylist — but it's empty by default, so enforces nothing until an admin populates it. ~1 day to seed a sensible non-empty default. |

## 10. Compliance & Data Governance

| Feature | What it's for | Status | Built | Scope / what's left |
| --- | --- | --- | --- | --- |
| Audit log | Append-only record of who did what, when. | ✅ | 60% | Built 2026-08-17/18: records guardrail-policy changes, tool-policy changes, and chatflow deletion. ~3 days remaining to extend to remaining consequential actions (credential/role changes, individual predictions). |
| Data retention policy | TTL/cleanup for logs, messages, traces. | ✅ | 100% | Built 2026-08-17/18: daily cron job deletes chat messages/executions/tool-call-audit rows older than a configured window (default 90 days each). |
| Compliance certifications / data residency (SOC2, GDPR, HIPAA) | Formal certifications some enterprise buyers require. | 🔴 | 0% | Largely a legal/audit process. Pursue only once contractually required. |
| Policy templates applied platform-wide | Standard rule set applied to every new agent automatically. | 🔴 | 0% | **Deleted 2026-08-19** per the Guardrails v2 rearchitecture — no workspace-wide-defaults concept exists in the new model. May resurface as "framework packs a builder applies to one agent" (a different feature) once Phase 3 authoring exists. |

## 11. Security & Permission Model

| Feature | What it's for | Status | Built | Scope / what's left |
| --- | --- | --- | --- | --- |
| Encrypted secrets at rest | Credentials/secrets encrypted in the DB. | ✅ | 100% | Working today. |
| Production security toggles (HTTP/OAuth2 checks, path-traversal, trust-proxy) | Standard hardening for a real load balancer. | 🟡 | 70% | Left on defaults. ~0.5 day to review and set deliberately. |
| Agent principal model (least-privilege, per-user delegated credentials) | An agent only ever exercises the acting user's own grants. | ✅ | 100% | Enforced at runtime. Nothing to build. |
| Least-privilege per-agent tool allowlist | Restricts which tools an agent may call. | ✅ | 100% | Enforced at the same chokepoint. Nothing to build. |

## 12. Cost / Token / FinOps Management

| Feature | What it's for | Status | Built | Scope / what's left |
| --- | --- | --- | --- | --- |
| Per-call cost tracking | Tracks $ cost of each LLM call. | 🟡 | 85% | Exists via Langfuse + cost calculator, dormant until Langfuse is on. |
| Per-workspace token/spend budgets + alerts | Spend ceiling per workspace with warning thresholds. | 🟡 | 40% | Built 2026-08-17/18 as a predictions-per-month proxy cap (default 10,000), enforced pre-flight — not a $ or token-based cap yet, no warn-before-block threshold. ~4 days remaining for real cost-based metering once Langfuse is on, plus a warn/block threshold pair. |
| Rate limiting / usage caps | Per-tenant caps on predictions, flows, users, storage. | 🟡 | 70% | Already implemented, gated behind the unused CLOUD mode. ~2 days to verify/wire once that decision is made. |

## 13. Agent Builder Tooling & Evaluation

| Feature | What it's for | Status | Built | Scope / what's left |
| --- | --- | --- | --- | --- |
| Low-code visual flow builder | The drag-and-drop canvas every flow is built on. | ✅ | 100% | Already in daily use. |
| Evaluations framework (LLM-as-judge, datasets, cost tracking) | Scores agent output quality before trusting a flow in production. | 🟡 | 70% | Exists, never exercised. ~2 days for a first real dataset/evaluator. |
| Pre-publish evaluation gate | Blocks a flow from going live if it fails evaluation. | 🔴 | 0% | Eval results don't block anything today. ~4 days. |
| Marketplace: global static templates | Pre-installed starter flows shipped with every deployment. | 🟡 | 60% | Generic content only. Not prioritized — custom-template path is faster. |
| Marketplace: live "Save As Template" | Save any real flow as a reusable per-workspace template. | ✅ | 100% | Fully working, unused. ~0.5 day to save/polish a first template. |

## 14. Admin / Governance Control Plane

| Feature | What it's for | Status | Built | Scope / what's left |
| --- | --- | --- | --- | --- |
| Unified admin dashboard (Control Tower) | One screen for agent inventory, health, and approvals. | 🟡 | 55% | Inventory/health/approval counts + click-through filtering done. Budgets/cost data missing. ~8 days remaining. |
| Agent lifecycle states (draft → validated → published) | Governed catalog with explicit trust states. | 🔴 | 0% | No lifecycle state exists. ~5 days, shares work with the pre-publish eval gate. |
| Ownerless-agent / agent-risk flagging | Flags agents with no owner or elevated risk. | 🔴 | 0% | Nothing exists yet. ~2 days, extension of the admin dashboard. |

## 15. Workflow / Deterministic Automation

| Feature | What it's for | Status | Built | Scope / what's left |
| --- | --- | --- | --- | --- |
| Scheduling (cron-triggered flow runs) | Runs a flow automatically on a schedule. | 🟡 | 85% | Exists, unused. ~0.5 day to set up a first scheduled flow. |
| Webhooks | Triggers a flow from an inbound HTTP call. | 🟡 | 80% | Exists, untested. ~0.5 day to register/verify a first webhook. |
| In-graph deterministic steps (HTTP, CustomFunction, ExecuteFlow) | Non-agentic building blocks for plain automation logic. | ✅ | 100% | Already covers most of what a lightweight workflow engine needs. |
| Dedicated Git-backed workflow engine (n8n-equivalent) | Standalone deterministic automation product, separate from the agent graph. | 🔴 | 0% | Deliberately deferred — only worth scoping if in-graph nodes genuinely can't cover a need. |

## 16. External Integration & SDK

| Feature | What it's for | Status | Built | Scope / what's left |
| --- | --- | --- | --- | --- |
| Embeddable chat widget SDK | Drops a chat interface for any flow into a third-party site. | ✅ | 100% | Works as-is today. |
| Prediction/REST API | Public API surface for calling a flow programmatically. | ✅ | 100% | Already the integration surface for any external caller. |
| Per-org dedicated deployment runbook | Documented, repeatable process for a new single-tenant deployment. | 🔴 | 20% | Mechanism works; never written down. ~1 day to document. |
| True multi-org self-serve onboarding | Any org can sign up, get billed, and get quota-capped without admin intervention. | 🟡 | 55% | Same project as the Section 6 multi-org row. ~8–10 days for a first rollout. |
| Branded first-party SDK package | An `@accelance`-scoped embed package distinct from upstream `flowise-embed`. | 🔴 | 0% | Currently ships under the upstream name. ~2 days to fork/republish, if white-labeling matters. |

## 17. Internationalization (i18n)

| Feature | What it's for | Status | Built | Scope / what's left |
| --- | --- | --- | --- | --- |
| Full platform i18n (en-US, en-GB, de-DE, hi-IN) | Lets the platform be used in a user's own language/locale. | 🔴 | 0% | Planned in detail (2026-08-13), not started. react-i18next/i18next, Intl-based formatting, AST-codemod extraction, full backend error re-keying, real per-locale emails, MT-draft + native-speaker review for de-DE/hi-IN, repo-wide no-literal-string lint. Est. ~6–8 weeks total. |

---

*Interactive, searchable/filterable version (with CSV export) also published as an artifact. Full evidence paths, effort-estimate rationale, and the multi-tenant SaaS deep-dive live in `rules/epics-feature-status.md`.*
