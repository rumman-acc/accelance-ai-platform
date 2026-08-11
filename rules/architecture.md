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
- 200+ LangChain-based node integrations — chat models (29 providers, including self-hosted Ollama/LocalAI), embeddings, vector stores, document loaders, tools
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
