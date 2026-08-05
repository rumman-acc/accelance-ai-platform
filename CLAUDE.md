<!-- # Accelance AI Platform — Claude Instructions

## Read This First

Before making any change, read the files in `rules/` to understand the current state of the project.
After making any change, update the relevant file in `rules/`.

**Rules folder:** `rules/`

-   `rules/architecture.md` — service layout, ports, decisions
-   `rules/changes.md` — log of every structural change made
-   `rules/services.md` — what each service does, where it lives, its status
-   `rules/known-issues.md` — bugs encountered and how they were resolved
-   `rules/shared-database-entities.md` — **CRITICAL: entity ownership + cross-service change checklist**

## Project Overview

Accelance AI Platform — a multi-tenant AI agent platform built on a Flowise OSS fork.
Root: `d:/Accelance AI Platform/AI-Platform-Internal/`

Current state: **Flowise 3.1.2** running in enterprise mode with PostgreSQL on Neon.
Enterprise auth is enabled via a `FLOWISE_PLATFORM=enterprise` env bypass (no license needed).

## Developer Setup (for new contributors)

Quick path from clone to running:

```bash
# 1. Install Node 24 via nvm
nvm install 24.15.0 && nvm use

# 2. Install dependencies
corepack enable && pnpm install

# 3. Create and fill in the .env file
cp packages/server/.env.example packages/server/.env
# Edit packages/server/.env — fill in Neon DB credentials and generated secrets

# 4. Build and run
pnpm build
cd packages/server && node bin/run start

# 5. First time only: go to http://localhost:3002/register
#    First registered user becomes the org admin (OWNER role)
```

See `rules/steps/01-enterprise-auth-setup.md` for full detail.
For Neon DB: sign up at neon.tech → create project → Connection Details → **Direct connection** (not pooler).

## Key Rules

-   Never modify files outside this repo
-   Always check `rules/changes.md` before starting work so you know what was already done
-   When a service breaks, check `rules/known-issues.md` first
-   `FLOWISE_PLATFORM=enterprise` in `packages/server/.env` enables enterprise auth — do not remove this
-   All auth flows use Flowise's built-in enterprise code — do not build custom auth
-   Shared TypeScript types live in `packages/shared` only
-   **After every step or change: run build + test and record the result**
-   **Save the full step plan to `rules/steps/` before touching any code**
-   **When you alter any entity/table, immediately check `rules/shared-database-entities.md`** -->
# CLAUDE.md — implementation rules

## Role

You are implementing UI changes based on `DESIGN_SPEC.md` and `design-system/tokens.json`.
You are NOT the designer. Do not make aesthetic judgment calls that contradict the spec.
If the spec doesn't cover something you need, stop and flag it — see "Gap protocol" below.

## Hard rules

1. Do not change business logic, API contracts, or data flow. Presentation only.
2. Do not introduce new colors, spacing, radii, shadows, or font sizes outside
   `design-system/tokens.json`. No hardcoded hex values or arbitrary Tailwind values
   (e.g. no `mt-[13px]` — use the scale).
3. Use `shadcn/ui` components as the base layer wherever the spec's component maps to one.
   Compose from `design-system/components/` for anything more specific
   (NodeCard, WorkflowToolbar, PropertiesPanel, etc.).
4. Never build a new component if an equivalent already exists in
   `design-system/components/component-inventory.md`. Check first.
5. One page/feature at a time, per `migration-checklist.md`. Do not touch other pages
   in the same pass, even if you notice inconsistencies there — log them instead.
6. Commit after each completed page with a message referencing the checklist row,
   e.g. `feat(ui): migrate chatflow canvas toolbar to design system`.
7. Preserve all existing functionality and tests. If a test breaks because a DOM
   structure changed, update the test's selectors, not its assertions about behavior.

## Gap protocol (when the spec or design system doesn't cover something)

1. Check if it can be composed from existing components/tokens instead of a new one.
2. If a genuinely new component is needed, build it matching the naming/variant
   conventions of the closest existing component, using only existing tokens.
3. Add it to `design-system/components/component-inventory.md` marked
   `status: draft — pending design review`.
4. Add a line to `DESIGN_SPEC.md` Section 9 (Open questions / gaps) describing what
   you built and why. Do not silently treat it as final.
5. Do not proceed to style five more screens using an unreviewed draft component —
   surface it and wait for a review pass after 1–2 uses.

## Before each page

- Re-read the relevant section of `DESIGN_SPEC.md` and the current row in
  `migration-checklist.md`.
- Re-check `design-system/tokens.json` and `component-inventory.md` for anything
  that's changed since your last pass (design conversation may have updated it).

## After each page

- Run `npm run lint:design-tokens` (or equivalent) and fix violations.
- Take before/after screenshots if the visual-review script is set up.
- Update `migration-checklist.md` status for that row to `done` and note any
  drafted components in the "notes" column.