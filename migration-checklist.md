# Migration Checklist

Rows are migrated **one at a time, in order**, per CLAUDE.md rule 5. Each row references the relevant
`DESIGN_SPEC.md` Section 2 route(s) and `design-system/` tokens/components. Status: `not started` /
`in progress` / `done`. Notes column records drafted components (Gap protocol) and open issues.

> **Before starting row 1**, re-read `DESIGN_SPEC.md` Section 9 — several rows below depend on open
> questions there (canonical v1/v2 canvas, dark mode, Executions-vs-Logs) that are flagged inline.

| # | Page / Feature | Route(s) | Status | Notes |
|---|---|---|---|---|
| 1 | App shell — Header + Sidebar | (all routes, `MainLayout`) | done | **Conservative re-skin (not a shadcn/Radix rewrite)** — `NavItem`/`NavGroup`'s MUI structure and RBAC/feature-flag logic left untouched (shared with the canvas settings dropdown, out of scope); only recolored via the theme source (`_themes-vars.module.scss`, `config.js`) to brand tokens (`#0052CC` primary, 8px radius, Inter/Arial), plus added the spec's left-blue-bar + tint active-item indicator to `NavItem`. Dark-mode toggle removed from Header per the light-only decision (see Section 9); `customizationReducer.isDarkMode` forced `false` so no user gets stranded in dark mode. Set up Tailwind v3 + shadcn primitives (`design-system/components/ui/button.jsx`, `icon.jsx`) as infra for later rows, with `preflight` disabled so it coexists with MUI during the migration. **Gap found and logged (Section 9):** brand tokens.json has no light/200/800/dark tonal ramp — existing tokens reused rather than inventing new hex values. Verified: `pnpm build` succeeds, `eslint` clean (no new errors/warnings). Not verified: visual check in a running browser (no dev-server/screenshot tooling available in this environment) — recommend a manual look before treating this as fully final. |
| 2 | Credentials | `/credentials` | done | Conservative re-skin, same philosophy as row 1. **Two global theme fixes made here that benefit every later row automatically** — don't redo them: (1) added `color.border` (#E2E8F0) as MUI's `theme.palette.divider`, wired only for light mode; (2) added `theme.shape.borderRadius` (from `customization.borderRadius`, now 8px) which was previously unset, so numeric `sx={{borderRadius: N}}` shorthand now actually resolves to the brand radius app-wide; also fixed the `MuiButton` hardcoded `4px` override flagged in DESIGN_SPEC.md Section 4 to use the same token. Page-specific: replaced this page's two `theme.palette.grey[900] + 25` border hacks with `theme.palette.divider`, dropped a redundant hardcoded `borderRadius: 2` on the Add Credential button (now inherits the fixed global default). Did not touch `AddEditCredentialDialog`/`CredentialListDialog`/`ShareWithWorkspaceDialog` internals or the empty-state pattern (still no shared `EmptyState` component — same gap as baseline, not introduced here). Verified: `pnpm build` + `eslint` clean. |
| 3 | Variables | `/variables` | not started | Same shape as Credentials — should reuse, not re-derive, patterns from row 2. |
| 4 | API Keys | `/apikey` | not started | Same CRUD shape again. |
| 5 | Tools | `/tools` | not started | Adds MCP server config dialogs on top of the base CRUD shape. |
| 6 | Assistants | `/assistants`, `/assistants/custom`, `/assistants/custom/:id`, `/assistants/openai` | not started | Two sub-flows (custom vs OpenAI Assistants) — check both against Section 2/3. |
| 7 | Marketplace | `/marketplaces`, `/marketplace/:id`, `/v2/marketplace/:id` | not started | Gallery + read-only preview canvas. Preview canvas shares layout with row 12/13 — coordinate. |
| 8 | Document stores / RAG | `/document-stores`, `/document-stores/:storeId`, chunk viewer, loader config, vector store configure/query | not started | Largest single feature folder currently (Section 2) — budget accordingly, may warrant sub-rows if it grows unwieldy. |
| 9 | Datasets / Evaluators / Evaluations | `/datasets`, `/dataset_rows/:id`, `/evaluators`, `/evaluations`, `/evaluation_results/:id` | not started | Feature-flagged module (`feat:datasets`/`evaluators`/`evaluations`) — verify flagged-nav-state handling (Section 9) works correctly here. |
| 10 | Executions | `/executions`, `/execution/:id` (public) | not started | **Executions-vs-Logs open question (Section 9)** — migrate as-is (separate from Logs) unless the design conversation has resolved the merge question by this point. AgentStatus/ApprovalCard components are a natural fit here. |
| 11 | Logs | `/logs` | not started | See row 10's open question before assuming this stays separate. |
| 12 | Chatflow canvas (v1) | `/chatflows` (list), `/canvas`, `/canvas/:id`, `/agentcanvas`, `/agentcanvas/:id` | not started | **Decided 2026-07-27: v2 is canonical** (row 13) — the chatflow list + `/canvas` builder still get migrated here (chatflows aren't part of the v1/v2 agentflow split); `/agentcanvas` (v1 agentflow, reusing this canvas) is left unmigrated/as-is pending design-conversation sign-off on deprecating it. |
| 13 | Agentflow canvas (v2) | `/v2/agentcanvas`, `/v2/agentcanvas/:id` | not started | **Decided 2026-07-27: canonical agentflow canvas.** Highest-risk, highest-effort row in the checklist (custom nodes/edges/handles, no current a11y, no mobile support per Section 7/8). |
| 14 | Account settings | `/account` | not started | Personal settings — should be low-risk once rows 1-4 establish form patterns. |
| 15 | Auth flows | `/login`, `/signin`, `/register`, `/verify`, `/confirm-email-change`, `/forgot-password`, `/reset-password`, `/unauthorized`, `/rate-limited`, `/organization-setup`, `/license-expired`, `/sso-success` | not started | No sidebar/header (`AuthLayout`) — different shell than rows 1-14. Batch together since they share one layout. |
| 16 | Users / Roles / Workspaces / SSO / Login Activity | `/users`, `/roles`, `/workspaces`, `/workspace-users/:id`, `/sso-config`, `/login-activity` | not started | Enterprise/admin, all `feat:*`-flagged — lowest traffic, do last. Verify flagged-nav-state handling again here (multiple flags stack). |
| 17 | Public/embeddable chat widget | `/chatbot/:id` | not started | No auth, no app shell — different constraints (must work embedded in third-party pages). |

## Explicitly out of scope for this checklist (per CLAUDE.md — presentation only)

- `views/files/` — route is commented out/disabled in the current app (Section 9 open item). Not
  migrated until the design conversation decides whether it's planned or dead.
- Backend/API contracts, RBAC permission strings, business logic, data flow — never touched per
  CLAUDE.md hard rule 1.
