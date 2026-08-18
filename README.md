# Envoy

Envoy is Accelance's multi-tenant AI agent platform — a low-code canvas for building,
running, and governing AI agents. It's built on a [Flowise](https://github.com/FlowiseAI/Flowise)
3.1.2 OSS fork, running in enterprise mode (org → workspace → RBAC) on PostgreSQL (Neon).

For a fuller picture of what the application does and how it's put together, start with
**[Envoy-overview.md](Envoy-overview.md)**.

## Quick start

New to this repo? Follow **[NEW-DEVELOPER-SETUP.md](NEW-DEVELOPER-SETUP.md)** for the full
walkthrough (Node/pnpm versions, `.env`, first run). The short version:

```bash
corepack enable
pnpm install
# add packages/server/.env — ask a teammate for the shared file
pnpm dev
```

The app runs as a single process at `http://localhost:3002`. No Docker or Redis is required
for local dev — `docker-compose*.yml` and the `docker/` folder exist for queue-mode/deployment
use cases only.

## Repository structure

One pnpm monorepo. One deployed service (`packages/server`) serves the UI, the REST API, and
executes every agent flow in-process.

| Package | What it is |
| --- | --- |
| `packages/server` | Express + TypeORM — the one deployed service |
| `packages/ui` | React 18 + Vite — served by `packages/server`, not standalone |
| `packages/components` | 200+ node integrations (LLMs, tools, vector stores, document loaders...) |
| `packages/shared` | TypeScript types only, no runtime code |
| `packages/agentflow` | Standalone embeddable agent-graph editor (published independently) |
| `packages/observe` | Standalone embeddable execution-trace viewer (published independently) |
| `packages/api-documentation` | Standalone Swagger/OpenAPI docs viewer |

Full diagrams and request-path detail live in **[rules/architecture.md](rules/architecture.md)**.

## Documentation map

| Doc | What's in it |
| --- | --- |
| [Envoy-overview.md](Envoy-overview.md) | What the application is, at a glance — capabilities, architecture, and a full doc index |
| [NEW-DEVELOPER-SETUP.md](NEW-DEVELOPER-SETUP.md) | Local dev environment setup |
| [rules/architecture.md](rules/architecture.md) | Full technical architecture — services, layers, auth flow, key files |
| [rules/epics-feature-status.md](rules/epics-feature-status.md) | Feature-by-feature build status and effort estimates, with code evidence |
| [FEATURE-BUILD-LEDGER.md](FEATURE-BUILD-LEDGER.md) | The same feature inventory, flattened into a searchable, description-first sheet |
| [rules/known-issues.md](rules/known-issues.md) | Open bugs |
| [rules/changes.md](rules/changes.md) | Change log |
| [DESIGN_SPEC.md](DESIGN_SPEC.md) | UI/design-system spec for presentation work |
| [migration-checklist.md](migration-checklist.md) | Page-by-page design-system migration tracker |
| [CLAUDE.md](CLAUDE.md) | Rules for AI-assisted changes to this repo |
| [CONTRIBUTING.md](CONTRIBUTING.md) | Contribution guidelines |

## License

Envoy is built on [Flowise](https://github.com/FlowiseAI/Flowise), used under the
[Apache License 2.0](https://github.com/FlowiseAI/Flowise/blob/main/LICENSE.md). This
repository does not currently carry its own top-level license file — check with the project
owner before treating Accelance-specific code as separately licensed.
