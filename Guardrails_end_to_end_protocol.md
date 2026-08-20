# Guardrails v2 — End-to-End Build Protocol

This is a standing instruction set, not a single task. Read this in full at the start of
every session before touching code. Work through the phases in order. Do not skip ahead,
do not parallelize across phases, and do not mark anything done without the report format
below.

Prior context you must treat as binding, not as history to re-derive:
- `Guardrails_build_plan.md` — the phase plan and scope
- `rules/guardrails-v2/` — kind list, verdict contract, definition schema, reconciliation,
  phase2-canvas.md, and any decision records already written
- `rules/known-issues.md`, `rules/epics-feature-status.md`, `FEATURE-BUILD-LEDGER.md`
- The 8 locked decisions (node-primary/DB-served definitions, tiers 1–2 only in v1,
  replace-not-extend the old model, RBAC parity with the rest of the app, observe-first
  default, per-config fail-open/closed with no platform default, framework metadata from
  day one, node-attached placement for non-inline guardrails)

If anything you're about to do contradicts one of these, stop and flag it — don't silently
resolve the conflict either direction.

---

## The operating loop

Every unit of work, at every phase, follows this cycle. No exceptions, only the verification
*tier* changes (see below).

```
1. BUILD     — implement the smallest coherent unit of the current phase's scope
2. TEST      — run the verification appropriate to this unit's tier (below)
3. REPORT    — write the result in the report format below, pass or fail, with evidence
4. READ      — before moving on, re-read your own report as if someone else wrote it.
               Does the evidence actually support the claim? If a claim has no evidence
               attached, it's not verified — go back to step 2.
5. FIX       — if anything failed or the evidence doesn't hold up, fix it now, in this
               unit, before moving forward. Do not carry a known failure into the next unit.
6. RE-TEST   — repeat step 2 against the fix specifically, not just "typecheck passes now"
7. ADVANCE   — only once 1–6 are clean, move to the next unit or phase
```

Never batch multiple units' worth of building before the first test. A unit is small: one
migration, one node, one endpoint, one UI panel — not "all of Phase 2."

### Verification tiers

Not everything needs the same weight of proof. Assign a tier before building, state which
tier you assigned and why in the report, and match the evidence to it.

**Tier A — full proof required (schema, runtime resolution, anything touching existing
flows, anything security/enforcement-relevant, anything that changes default behavior):**
- Direct DB query or captured runtime log showing the actual state/value, not an inference
  from a clean typecheck or a UI render
- Before/after comparison where relevant (row counts, behavior on existing flows)
- A genuine negative case tested, not just the happy path (e.g. a duplicate-key insert
  that should fail, an unpromoted guardrail that should not block)

**Tier B — self-verified, reported as plain pass/fail (UI rendering, palette appearance,
icons/labels, non-security config forms, documentation-only changes):**
- Confirm it visually or functionally yourself, state what you saw in one or two lines
- No DB query or log capture required unless something looks wrong
- If in doubt about which tier something is, default to Tier A — the cost of over-proving
  is small; the cost of under-proving on something that turns out to matter is what caused
  the #017 bug in the first place

### Report format (every unit, every phase)

```
UNIT: [what was built]
TIER: [A/B, one line why]
BUILD: [what changed — files, migrations, entities]
TEST: [what you ran, what you saw — evidence for Tier A, plain statement for Tier B]
RESULT: PASS / FAIL
IF FAIL: what broke, what you fixed, re-test result
CARRY-FORWARD: anything this unit reveals that affects a later phase (log it now,
  don't wait for that phase to rediscover it)
```

### When to stop and ask instead of deciding silently

Stop and present options (like the node-synthesis fork) rather than picking one, when:
- A locked decision turns out to be technically infeasible as written (as happened with
  DB-synthesized nodes vs. the classic resolution path)
- A choice would affect data already in the live DB, or would be expensive to reverse later
- A choice trades off against a future phase's stated scope (e.g. anything that would make
  Phase 3's no-deploy custom-guardrail promise harder to deliver)
- You genuinely don't have enough information to pick correctly — not "there are two valid
  options," but "picking wrong here is costly and I can't yet tell which is which"

Otherwise, proceed using the tiering above and report at the end of the unit. Don't ask
permission for routine implementation choices.

---

## Phase 0 — Alignment (status: complete, verify before continuing)

Confirm still true, don't re-derive: kind list, verdict contract, definition schema, and the
14-row code audit are all written in `rules/guardrails-v2/`. If any of these files are
missing or stale relative to what's since been built, fix that first — Phase 1 and 2 already
built on top of them, so drift here is a Tier A problem, not documentation cleanup.

## Phase 1 — Registry & foundation (status: complete, two follow-ups outstanding)

Before continuing to Phase 2 work, close:
1. AgentAsTool.ts / Confused Deputy Prevention live-trigger proof — same standard as the
   ToolAgent proof already done (resolved-config-array log, shadow verdict, promote-to-block,
   revert). Tier A. Do not assume from "same mechanism."
2. Regression check on at least one real pre-existing flow using ToolAgent or AgentAsTool
   with no guardrails anchor connected — confirm absent/undefined `guardrails` input changes
   nothing. Tier A. This gates Phase 2 sign-off.
3. Delete the "Phase2 Guardrails Verify" test chatflow and its live credentials from the
   workspace. If a fixture is wanted, export as flow-JSON with placeholder credentials.
4. One-line `known-issues.md` entry on the dead-credential state encountered during
   verification.

## Phase 2 — Canvas (remaining scope)

Already built: 3 physical guardrail node files, `guardrails` anchor on `ToolAgent.ts` and
`AgentAsTool.ts`, refactored `runAttachedGuardrails.ts`, palette/persistence/shadow/promote
all proven for the `ToolAgent` path.

Remaining:
- Connection validation — reject an edge from a guardrail node to a host node category it
  isn't declared compatible with (per the `allowedHosts` concept in the definition schema).
  Tier A: prove a valid connection succeeds and an invalid one is rejected, not just that
  the validation function exists.
- Config panel — confirm the parameter form for each of the 3 nodes actually maps to and
  from the definition's parameter schema, not just that fields render. Tier A for the
  save/reload round-trip, Tier B for cosmetic form layout.
- Observe-vs-block UI state — the node's canvas representation must make it visually
  unambiguous whether it's currently observing or enforcing. Tier B for the visual, Tier A
  for confirming the visual state actually matches the DB `observeMode` value it claims to
  reflect (a UI that lies about the mode is worse than no UI).
- Content Moderation and HITL Approval Gates — per the Phase 1 reconciliation, these two
  have no `GuardrailPolicy` dependency today. Decide in this phase whether they get the same
  attached-node treatment or a different one (they may not fit the pattern the other 7 do),
  and report the decision with reasoning before building either.

Phase 2 is not signed off until every item above has a report, and the two Phase 1
follow-ups are closed.

## Phase 3 — Authoring

Do not start until Phase 2 is fully signed off and the following is explicitly re-confirmed,
because Phase 2 built on the static-node-file path, not the dynamic-DB-synthesis path
originally planned:

- Restate, in writing, how a user-created custom guardrail will become a draggable canvas
  node given that static physical files are now the proven mechanism and dynamic
  `componentNodes` registration was deferred, not built. This is the fork flagged earlier —
  it cannot stay unresolved once real authoring starts. If dynamic registration is now
  required, that is new scope, size it before building anything else in this phase.
- Build: create-custom-definition flow, framework-pack browse and apply, and the dry-run
  tester. The tester is Tier A — prove a user-authored regex or judge rubric can actually be
  tested against sample input before save, not just that the form submits.
- Verify: a newly authored custom definition appears in the palette without a restart or
  deploy, using whatever mechanism was decided above. This is the single most important
  proof in this phase — it's the entire premise of decision 1.

## Phase 4 — Governance surface

- Verdict audit trail UI — Tier B for rendering, Tier A for confirming displayed verdicts
  match actual `GuardrailVerdict` rows, not a cached or mocked subset.
- Per-agent framework coverage view, wired to the `frameworkRefs` metadata captured since
  Phase 0. Tier A: confirm at least one real agent's coverage report matches its actual
  attached guardrails, not a hardcoded example.
- Wire into `/compliance`. Confirm this doesn't reintroduce any workspace-wide-defaults
  concept removed in Phase 1 — that removal was deliberate, not an oversight to "fix" here.

## Phase 5 — Deferred set

Only after 0–4 are signed off. Re-scope each item against whatever's actually needed at that
point rather than building blind against the original list:
`pii_ner`, `classifier_http`/webhook guardrails, `custom_code` guardrails (needs real
sandboxing — egress allowlist, timeout, no credential access — spec this properly before any
code, it's the one item in the whole plan with a real security surface if done wrong),
retrieval-stage guardrails, approver inbox.

---

## Non-negotiables, restated (do not silently drift from these at any phase)

- No workspace-wide defaults or mandatory enforcement — a guardrail exists only where a
  builder places it, by design, per decision 1 and §2.2 of the build plan
- Every new guardrail defaults to observe mode; promotion to blocking is an explicit,
  per-node action, never a bulk or default flip
- Definition IDs are immutable and never reused; deletion is soft-delete only; edits create
  a new version, current-version determination is `deletedAt IS NULL AND
  supersededByDefinitionId IS NULL`, application-enforced — not DB-enforced, logged as a
  known race risk for Phase 3 write paths to handle transactionally
- `guardrail_definition` has a `UNIQUE(key, version)` constraint, not a flat unique on `key`
- Fail-open/closed is explicit per guardrail config, derived from category as a default,
  never a platform-wide setting
- Framework references (`frameworkRefs`) are populated on every new definition from Phase 0
  onward, even before the coverage UI exists to display them

## What "done" means for this whole effort

All five phases signed off per their gates above, every Tier A claim backed by captured
evidence in the corresponding phase's report, `rules/guardrails-v2/`,
`rules/epics-feature-status.md`, and `FEATURE-BUILD-LEDGER.md` all reflecting what was
actually built rather than what was planned, and zero open items silently left unresolved —
anything deferred is deferred with a written reason and a note on what phase it blocks, not
dropped.