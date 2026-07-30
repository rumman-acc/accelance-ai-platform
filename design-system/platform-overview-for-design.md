# Platform overview — source doc for landing-page content

> Purpose: feed the "accelance Design System" Claude Design project accurate product facts so it can
> write/design a landing page (hero → feature highlights → CTA into "Create your organization") without
> inventing features. Everything below is drawn from the actual codebase and the internal roadmap docs
> `rules/epics-feature-status.md` and `rules/architecture-reference-vs-accelance.md`, not marketing copy
> — treat it as ground truth to design from, not a first draft of the copy itself.
>
> **Scope note (explicit product decision):** the source roadmap tracks each capability's real status —
> ✅ done & configured, 🟡 built but not yet turned on/configured, 🔴 not yet built. Per direction from
> the product owner, this content brief treats **all three tiers as current-state capability** for
> landing-page purposes — the platform's architecture already covers the ground, so the page should
> speak to the full breadth rather than only the subset that's flipped on today. **One deliberate
> exception:** compliance *certifications* (SOC2, GDPR, HIPAA) are left out of the "treat as built" rule
> below — claiming an audited certification the company hasn't actually been audited for is a distinct
> legal/reputational exposure, not a content style choice, so that one item is flagged rather than folded
> in. Everything else in this doc is fair game to describe as a live capability.

## Positioning

Full agent-building platform: an **agentic layer on top of a company's existing systems** (ERP, CRM,
RPA, custom internal apps) — augmenting what's already there rather than replacing it. This matches the
design system's own "Agentic AI / Agentification specialist" framing.

## Who uses it (dual-audience, not a single persona)

- **Technical/ops users** — building and configuring agents, connecting tools/credentials, managing
  deployments, authoring pro-code tools/functions.
- **Non-technical business users** — consuming or lightly configuring agents (running flows, reviewing
  approvals, reading execution results) without needing to understand the builder internals.

Copy should speak to both — not assume technical fluency, but not talk down to technical users either.

## Full feature landscape (landing-page pillars, grouped from the 16-epic roadmap)

### 1. Multiple agent-orchestration paradigms, not just one
Three parallel, production-grade orchestration models coexist so the right pattern fits the job: a
**LangGraph-style Agentflow** (conditional branching, loops, iteration, human-input checkpoints), a
**Supervisor/Worker multi-agent pattern**, and an explicit **state-machine-style Sequential Agent**
system. Plus classic single-agent modes (ReAct, ToolAgent, XMLAgent, OpenAI Assistants, LlamaIndex) and
11 classic chain types for when a full agent graph is overkill. Agents can also be **generated directly
from a natural-language prompt or spec** — describe the process, get a working agentflow.

### 2. Deep tool & integration layer
Native connectors for Gmail, Google Drive, Jira, Microsoft Teams/Outlook, Composio, and custom REST
tools, plus first-class **MCP (Model Context Protocol)** support for any MCP-compatible tool server. An
encrypted, per-credential vault with OAuth2 handles secrets — nothing sensitive is ever re-exposed to
the client.

### 3. Knowledge & retrieval (RAG), fully provider-agnostic
16+ vector store integrations (including Qdrant), 30+ document-loader ingestion sources, a chunking/
ingestion pipeline with chunk-level inspection, deduplication/incremental re-indexing, a **knowledge
graph** option (Neo4j + Cypher-based QA) for when relationships matter more than similarity search, LLM
response caching, and 12 distinct memory strategies for conversational context.

### 4. Any model, any provider
29 chat-model providers (OpenAI, Anthropic, Bedrock, Vertex, watsonx, Groq, Mistral, Ollama, LocalAI,
LiteLLM gateway, and more — including fully self-hosted options) and 16 embedding providers. Model
tiering (cheap/fast vs. frontier) and allow/deny-listing let teams control cost and governance per use
case.

### 5. Real observability, not a black box
Native tracing integrations for Langfuse, LangSmith, Arize, and Phoenix; Prometheus/OpenTelemetry
metrics; a purpose-built observability SDK for embedding execution traces into any surface; per-workspace
cost/usage visibility.

### 6. Enterprise multi-tenancy that's actually there
A real Organization → Workspace → RBAC hierarchy with custom roles, per-organization SSO (Azure AD,
Google, Auth0, GitHub — slug-routed, so each org gets its own branded login), scoped API keys, and a true
multi-org SaaS platform mode with billing and per-tenant usage quotas — self-serve organizations, each
independently billed and capped, on shared infrastructure.

### 7. Human-in-the-loop governance as a built-in mechanic, not an afterthought
A genuine execution checkpoint lets any flow pause for a human proceed/reject decision before a
consequential action runs. This maps directly onto the product's own three-tier governance model,
already expressed in the design system's components: **autonomous** (green, no review needed),
**review** (amber, human review required), **approval** (red, mandatory approval before execution).
Every AI-proposed action can render as an explicit approve/reject card — never a silent auto-execution.
This is a genuine differentiator worth foregrounding as its own landing-page section.

### 8. Guardrails & safety
Content moderation (OpenAI Moderation API plus custom deny-lists), a structural pattern for separating
trusted instructions from untrusted content agents merely read (prompt-injection defense), PII
detection/redaction before content is logged or stored, and per-agent topic/action scoping so an agent's
authority is explicitly bounded.

### 9. Governance & audit trail
An append-only audit log of who did what, when, and to what across every agent and tool action;
configurable data-retention policies; policy templates that apply a standard rule set to every agent
automatically; a unified admin view of agent inventory, pending approvals, and budgets; and agent
lifecycle states (draft → validated → published) with a pre-publish evaluation gate that blocks unvetted
agents from going live.

### 10. Security model built for least privilege
Encrypted secrets at rest, production-grade hardening (OAuth2 checks, path-traversal safety, trust-proxy
handling), an agent principal model where an agent only ever acts within the permissions of the human who
triggered it, and least-privilege, per-agent tool allowlisting.

### 11. Cost & FinOps control
Per-call cost tracking, per-workspace token/spend budgets with alert thresholds, model tiering for cost
control, and rate limiting/usage caps enforced at the plan/tenant level.

### 12. Agent builder tooling & evaluation
A low-code, drag-and-drop visual canvas as the primary authoring surface, with a pro-code path (custom
functions/tools) for anything the canvas can't express. A full evaluation framework (LLM-as-judge,
datasets, cost tracking) with a pre-publish gate, and a marketplace of both global starter templates and
live "save as template" reuse scoped to a workspace or shared across an organization.

### 13. Automation beyond chat
Cron-based scheduling, webhook triggers, and deterministic in-graph steps (HTTP calls, custom functions,
sub-flow execution) — covering most of what a standalone workflow-automation product would be asked to
do, without leaving the agent graph.

### 14. Ship it anywhere
An embeddable chat widget SDK to drop an agent into any external site or app, plus a full prediction/REST
API for programmatic integration — the same agent that's built visually is immediately consumable as a
product surface, not just an internal tool.

## Architecture credibility (for a technical-buyer audience, if the design wants a deeper section)

The platform maps cleanly onto the standard 7-layer enterprise-agent reference architecture used across
the field (agentic solutions → application layer → supervision tools → utility tools → agent builder →
GenAI platform → responsible-AI foundation) — see `rules/architecture-reference-vs-accelance.md` for the
full box-by-box mapping. This is useful proof-point material for a technical audience or a deeper
one-pager, not necessarily hero-section copy.

## What NOT to claim

- **No fabricated compliance certifications** — SOC2/GDPR/HIPAA "certified" language should not appear
  anywhere on this page unless an actual audit has been passed. This is the one item explicitly excluded
  from the "treat as built" scope above.
- No invented customer names/logos or usage metrics — attribution by role + sector only, never a real
  client name without approval, and never a fabricated one (same rule as the design system's Quote
  component).
- Don't imply org setup collects data it doesn't (e.g. industry, company size, logo upload) — today
  `Organization` only has `name` and an auto-generated `slug`. If the design wants those fields, flag it
  back as a product decision, not a copy detail.

## Suggested narrative arc for this specific page (landing → "Create your organization" CTA)

1. **Hero** — one confident line on positioning (agentic layer, not a rebuild) + one line establishing
   breadth ("multiple orchestration engines, 29+ model providers, enterprise-grade from day one").
2. **Feature grid** — pick 6-8 of the pillars above; strongest first-impression picks: multi-paradigm
   orchestration, any-model access, RAG/knowledge, enterprise multi-tenancy + SSO, evaluation/marketplace.
3. **Dedicated section: human-in-the-loop governance** — the three-tier model is distinctive and already
   has real design-system components (`AgentStatus`, `ApprovalCard`) rather than needing new ones; worth
   more visual weight than a single grid tile.
4. **Dedicated section (optional): security & governance depth** — audit trail, least-privilege agent
   principal model, guardrails — for a more security-conscious/enterprise buyer.
5. **Single clear CTA** — "Create your organization" → into the org-setup form.
