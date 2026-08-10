# CLAUDE.md — implementation rules

## Project overview

Envoy (formerly "Accelance AI Platform") — a multi-tenant AI agent platform built on a Flowise
3.1.2 OSS fork, running in enterprise mode with PostgreSQL on Neon. Root:
`d:/Accelance AI Platform/AI-Platform-Internal/`. See `NEW-DEVELOPER-SETUP.md` for the dev setup
path and `rules/architecture.md` for the full service layout.

This repo carries two separate, differently-owned bodies of tracking documentation. Which one(s)
apply depends on what kind of change you're making — most non-trivial changes touch both:

| If the change is... | Read / update... |
|---|---|
| UI/presentation — re-skinning an existing page, or any page-level visual work | `DESIGN_SPEC.md` (read-only except Section 9) + `migration-checklist.md` + `design-system/tokens.json` + `design-system/components/component-inventory.md` |
| Backend, business logic, architecture, or a new feature/epic | `rules/architecture.md`, `rules/epics-feature-status.md`, `rules/known-issues.md`, `rules/changes.md` |
| A user-facing rename or copy change (product name, page names, terminology) | Whichever of the above already refers to the old name — add a one-line note wherever it appears, don't just fix the code |

**Never skip the read step because a change "looks small."** The 2026-08 Control Tower dashboard,
the Envoy rebrand, and the Chatbots→Agent/Agent Swarm rename all shipped without touching any of
these files, and by the time it was caught, `DESIGN_SPEC.md`, `tokens.json`,
`component-inventory.md`, `migration-checklist.md`, and `rules/epics-feature-status.md` were all
simultaneously wrong. Reconciling that after the fact costs far more than reading four files
before starting would have.

## Role (UI/design-system work)

When the change is UI/presentation work, you are implementing changes based on `DESIGN_SPEC.md`
and `design-system/tokens.json`. You are NOT the designer. Do not make aesthetic judgment calls
that contradict the spec. If the spec doesn't cover something you need, stop and flag it — see
"Gap protocol" below.

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
4. Add ONE line to `DESIGN_SPEC.md` Section 9 (Open questions / gaps) describing what
   you built and why. Do not silently treat it as final.
   **Section 9 is the ONLY part of `DESIGN_SPEC.md` you may ever edit.** Every other
   section (1-8, 10) is owned by the design conversation and read-only to you, full stop
   — not "read-only unless it looks wrong," not "read-only unless the user asks for a
   general reconciliation pass." If a value elsewhere in the file is stale or wrong,
   say so in a Section 9 line; do not fix it yourself, even in the same edit that adds
   the Section 9 line.
5. Do not proceed to style five more screens using an unreviewed draft component —
   surface it and wait for a review pass after 1–2 uses.

## Before each page (UI/design-system work)

- Re-read the relevant section of `DESIGN_SPEC.md` and the current row in
  `migration-checklist.md`.
- Re-check `design-system/tokens.json` and `component-inventory.md` for anything
  that's changed since your last pass (design conversation may have updated it).

## After each page (UI/design-system work)

- Run `npm run lint:design-tokens` (or equivalent) and fix violations.
- Take before/after screenshots if the visual-review script is set up.
- Update `migration-checklist.md` status for that row to `done` and note any
  drafted components in the "notes" column.
- **If this page/feature didn't come from the next row in the checklist** (e.g. it was
  built to meet a deadline outside the normal one-page-at-a-time flow, like a new
  dashboard) — still add a row for it, even if its status is `not started` for the
  design-system pass. A shipped page with no row is exactly how this checklist goes
  stale; logging it as "not yet migrated" is far better than not logging it at all.
- If the page satisfies, contradicts, or changes the status of anything in
  `rules/epics-feature-status.md` (a new dashboard, a removed constraint, a renamed
  feature), update that file too in the same pass — don't leave it for a future
  "reconciliation" prompt to discover via git log.

## Before/after any backend, architecture, or feature change

- **Before:** read `rules/architecture.md` and the relevant section(s) of
  `rules/epics-feature-status.md` to see what's already built, built-but-disabled, or
  explicitly not started — so you don't rebuild something that exists or contradict a
  documented constraint that was already lifted. Check `rules/known-issues.md` for
  anything relevant to what you're touching.
- **After:** update the epic's status row in `rules/epics-feature-status.md` (flip
  ✅/🟡/🔴 as appropriate, note the commit/file that changed it), add a line to
  `rules/architecture.md` if it changes a documented constraint or adds a new
  service/route, and log a `rules/known-issues.md` entry if you fixed a bug. A one-line
  update in the same commit is cheaper than a later audit reconstructing it from
  `git log`.