# Fluid — Application Overview

A one-stop orientation doc: what Fluid is, how it's put together, what it can already do,
and where to go for more depth. If you only read one file before touching this repo, read
this one, then follow its links.

---

## 1. What it is

Fluid (formerly "Accelance AI Platform", then "Envoy") is a **multi-tenant AI agent platform** — a
low-code, drag-and-drop canvas for building, running, and governing AI agents, agent
swarms, and RAG pipelines, aimed at enterprise teams that need agents backed by real
tenancy, RBAC, and (increasingly) governance controls rather than a single-user hobby tool.

It's built on a [Flowise](https://github.com/FlowiseAI/Flowise) 3.1.2 OSS fork rather than
from scratch — Flowise supplies the visual builder, the 200+ node integrations, and the
flow-execution engine; Accelance has layered multi-tenancy, enterprise auth, branding, and
(in progress) governance/guardrails on top of that foundation.

## 2. Architecture at a glance

One pnpm monorepo, one deployed service. There is no microservice split, API gateway, or
separate frontend server today — `packages/server` serves the built React UI, the full REST
API, and executes every agent flow in-process, in the same Node runtime.

```
Browser / API caller
        │  HTTPS
        ▼
packages/server (Express)  ── serves the built React UI + REST API + enterprise auth
        │  in-process call
        ▼
Flow-execution engine (utils/buildFlow)  ── walks the graph, streams results over SSE
        │  dynamically loads node implementations from packages/components (200+ nodes)
        ▼
PostgreSQL (Neon) — system of record       Qdrant (vector, optional)     Neo4j (graph, optional)
```

Full diagrams, the services table, the auth flow, and key file references:
**[rules/architecture.md](rules/architecture.md)**.

## 3. Tech stack

| Layer | Technology |
| --- | --- |
| Backend | Express.js + TypeORM |
| Frontend | React 18 + Vite (served by the backend, not a standalone deployment) |
| Database | PostgreSQL, managed on Neon |
| Optional data stores | Qdrant (vector search), Neo4j (graph memory) — provisioned per flow, only when configured |
| Node/tool integrations | 200+ LangChain-based nodes — chat models, embeddings, vector stores, document loaders, tools |
| Auth | JWT + session, enterprise org → workspace → RBAC hierarchy |
| Package management | pnpm workspace monorepo |

## 4. Core capabilities

Grouped by area, condensed from the full feature inventory. See
**[FEATURE-BUILD-LEDGER.md](FEATURE-BUILD-LEDGER.md)** for every individual feature with a
description, build status, and remaining scope, or
**[rules/epics-feature-status.md](rules/epics-feature-status.md)** for the same data with
code-evidence paths and effort estimates.

- **Agent orchestration** — Agentflow V2 ("Agent Swarm"), Supervisor/Worker multi-agent,
  Sequential (state-machine) agents, classic single agents, and classic LangChain chains.
- **Tools & integrations** — native connectors for 50+ SaaS tools (Gmail, Salesforce, Jira,
  Azure, Zendesk, and more), custom MCP server support, an OpenAPI/Composio importer that
  saves any picked endpoint or action as a reusable tool, and a centralized tool-call policy
  layer (allowlists + per-user credential grants, audit-logged).
- **Memory, knowledge & RAG** — 16+ vector store providers, a document ingestion pipeline,
  30+ document loaders, Neo4j graph memory, response caching, and 12 memory strategies.
- **Model access** — 30 chat-model providers (added Moonshot AI/Kimi, 2026-08-17) and 16
  embedding providers, including self-hosted options (Ollama, LocalAI) and a LiteLLM gateway.
  Static per-provider model catalogs live in `packages/components/models.json`; OpenAI,
  Anthropic, and Gemini are additionally kept fresh by a daily live-refresh job
  (`packages/server/src/jobs/refreshModelList.ts`) — every other provider's list is
  hand-maintained, so it can drift stale between manual refresh passes.
- **Human-in-the-loop & guardrails** — a real pause/resume approval checkpoint node, an
  AI-generator-scoped HIL policy, and content-moderation nodes, plus a DB-backed Guardrails &
  Compliance catalog with a per-agent canvas visibility panel and regex-based PII redaction
  (opt-in); prompt-injection defense and topic/action scoping are listed in the catalog for
  visibility but still to be built.
- **Admin & governance** — a Control Tower dashboard (agent inventory, health, pending
  approvals) as the default landing page; audit logging, agent lifecycle states, and
  budget/cost dashboards are still to be built.
- **Multi-tenancy** — org → workspace → RBAC with custom roles, SSO scaffolding for four
  providers, and a partially-enabled path to true self-serve multi-org SaaS (billing/quota
  code exists, gated behind an unused platform mode).
- **Builder tooling** — evaluations (LLM-as-judge), a marketplace with global and
  per-workspace templates, and an AI-assisted agent generator that builds a working
  Agentflow from a natural-language prompt.

### Build maturity snapshot

Of 87 tracked features: **33 done & configured**, **41 built but not configured** (mostly an
ops task — set a credential or flip an env var — not a development backlog item), and
**13 still to be built** (concentrated in guardrails, compliance, and admin/governance).
Full breakdown, effort estimates, and a dedicated multi-tenant-SaaS deep dive live in
[rules/epics-feature-status.md](rules/epics-feature-status.md).

## 5. Multi-tenancy & deployment model

Fluid runs in `Platform.ENTERPRISE` mode (`ACCELANCE_PLATFORM=enterprise`). Any number of
organizations can exist on one deployment, each with its own workspaces, users, and (as of
`09d279e`) its own SSO configuration via slug-based routing. What enterprise mode does not
yet provide is self-serve signup, billing, or quota enforcement — those exist in code
(Stripe integration, usage-quota manager) but sit behind `Platform.CLOUD`, currently unused.
See [rules/architecture.md § 5](rules/architecture.md) and
[rules/epics-feature-status.md § 6](rules/epics-feature-status.md) for the full auth-flow
and multi-org-SaaS detail.

## 6. Getting started

Setting up a local environment, running the app, and troubleshooting first-run issues:
**[NEW-DEVELOPER-SETUP.md](NEW-DEVELOPER-SETUP.md)**.

## 7. Documentation map

This repo carries two separately-owned tracking systems — which one(s) apply depends on
what you're changing (see [CLAUDE.md](CLAUDE.md) for the full rule).

| Doc | Use it for |
| --- | --- |
| [README.md](README.md) | Repo front door — quick start, repo layout |
| **Fluid-overview.md** *(this file)* | Orientation — what the app is, at a glance |
| [NEW-DEVELOPER-SETUP.md](NEW-DEVELOPER-SETUP.md) | Local dev environment setup |
| [rules/architecture.md](rules/architecture.md) | Full technical architecture, services, auth flow, key files |
| [rules/architecture-reference-vs-accelance.md](rules/architecture-reference-vs-accelance.md) | Box-by-box comparison against an external reference architecture |
| [rules/epics-feature-status.md](rules/epics-feature-status.md) | Feature-by-feature build status, effort estimates, code evidence — the source of truth for "what's built" |
| [FEATURE-BUILD-LEDGER.md](FEATURE-BUILD-LEDGER.md) | The same feature inventory, flattened into a searchable, description-first sheet |
| [rules/known-issues.md](rules/known-issues.md) | Open bugs |
| [rules/changes.md](rules/changes.md) | Change log |
| [rules/services.md](rules/services.md) | Service-level reference |
| [rules/shared-database-entities.md](rules/shared-database-entities.md) | Shared DB entity reference |
| [DESIGN_SPEC.md](DESIGN_SPEC.md) | UI/design-system spec — read-only except Section 9, for presentation work |
| [migration-checklist.md](migration-checklist.md) | Page-by-page design-system migration tracker |
| `design-system/tokens.json`, `design-system/components/component-inventory.md` | Design tokens and component catalog for UI work |
| [CLAUDE.md](CLAUDE.md) | Rules for AI-assisted changes to this repo — read this before any non-trivial change |
| [CONTRIBUTING.md](CONTRIBUTING.md) | Contribution guidelines |

---

*Keep this file in sync with `rules/epics-feature-status.md` and `rules/architecture.md`
whenever a change alters what's built, what the architecture looks like, or the
documentation map itself — same rule as `FEATURE-BUILD-LEDGER.md`.*
