# Guardrails v2 — Phase 4 (Governance surface), as-built

Progress log for Phase 4, following `Guardrails_end_to_end_protocol.md`'s
BUILD/TEST/REPORT/READ/FIX/RE-TEST/ADVANCE loop, one small unit at a time. Phase 4's stated
build list: "Verdict audit trail UI... Per-agent framework coverage view, wired to the
`frameworkRefs` metadata... Wire into `/compliance`." Phase 3's "framework-pack browse and
apply" deferral (`phase3-authoring.md`) also lands here, since it was folded into this phase's
already-planned coverage view.

## Unit 1 — verdict listing backend (`GET /guardrails/verdicts`)

**Tier A** (first read path for security/enforcement-relevant data; must not leak across
workspaces).

**Build:** `services/guardrails/index.ts`'s `listVerdicts(workspaceId, chatflowId?, page, limit)`
-- the first read of `GuardrailVerdict`, which the entity's own header comment says nothing
reads yet. Follows `toolsService.getAllTools`'s exact pagination convention
(`{data, total}` when both `page`/`limit` are positive, a plain array otherwise) rather than
`audit-log`'s `list()` (a `take`-only cap with no true paging) -- a verdict trail can grow large
fast (one row per attached guardrail per tool call), so it gets real paging from day one.
`controllers/guardrails/index.ts`'s `listVerdicts` uses the existing `getPageAndLimitParams`
utility (the same one `tools`/`variables`/`chat-messages` etc. already use) and an optional
`chatflowId` query filter. Route: `GET /guardrails/verdicts`, gated by the existing
`guardrails:view` permission (already gates the read-only catalog and the existing `/audit-log`
endpoint) -- no new permission needed.

**Test:** rebuilt, restarted against the live Neon DB (boot took unusually long this run --
~4 minutes instead of the usual ~15-25s, traced to resource contention from several leftover
Chromium processes left running by earlier Playwright test scripts that didn't reach their own
`browser.close()`; killed them and the next restart completed normally -- not a code issue).
Since the real HTTP endpoint always derives `workspaceId` from the logged-in session (no way to
exercise cross-workspace isolation through a single real login), verified via direct invocation
of the real compiled `listVerdicts` against a real initialized `DataSource`, with real inserted
rows across two distinct workspaceIds and explicit staggered timestamps (avoiding a same-instant
insert's undefined tie-break order): (1) page 1/limit 3 of 5 workspace-A rows returns the 3 most
recent, correctly ordered, `total:5`; (2) page 2/limit 3 returns the remaining 2, no overlap, no
gap; (3) workspace-A results never include workspace-B rows (the real negative case -- this is
exactly the kind of cross-tenant leak Phase 3's own key-uniqueness bug this session made worth
checking explicitly, not assuming); (4) workspace-B queried alone returns exactly its own 2 rows;
(5) the `chatflowId` filter returns only the matching subset; (6) omitting page/limit returns a
plain array, not `{data,total}`. All 6 passed. Test rows deleted after.

**RESULT: PASS.**

## Unit 2 — verdict audit trail UI

**Tier B** (rendering) **+ Tier A** (confirming displayed verdicts match real DB rows, per the
protocol's own split for this exact item).

**Build:** `views/guardrails/VerdictAuditTrail.jsx` -- same plain-MUI table + real
`TablePagination` component (`ui-component/pagination/TablePagination.jsx`) pattern
`views/variables/index.jsx` already uses, not a DataGrid and not `audit-log`'s uncapped list.
Rendered as a new section on the existing `/guardrails` page (not a new top-level nav item, to
avoid the icon-registry gotcha logged in `known-issues.md` #012 for a view this narrow in
scope) -- `migration-checklist.md` row 28 amended to cover it, same "not started for the
design-system pass" status as the rest of this feature area. Columns: when, chatflow, definition
key, a color-coded verdict chip (pass=success/flag=warning/block=error/redact=info, standard
MUI palette keys, no new ad hoc colors), Observe/Enforce mode, reason.

**Test:** rebuilt (`accelance-ui`), inserted 3 real verdict rows for the actual logged-in
workspace directly via SQL, then live browser test. First pass showed both this section and the
catalog above stuck on loading spinners -- traced to the catalog request genuinely taking ~3.9s
(confirmed via a direct authenticated-fetch timing check hitting both endpoints, both returned
200 with correct real data, just slower than the 2.5-3s wait I'd given the page) -- not a bug in
this unit, a test-script timing issue. Re-ran with a proper wait: all 3 real rows rendered
correctly, most-recent-first, with the exact real `reason` text
(`blocked a reference to "169.254.169.254"`) on the one `block` row, correct
Observe/Enforce label matching each row's real `observeMode` value, correct color-coded verdict
chips, and correct pagination summary ("Items 1 to 3 of 3"). Screenshot captured. Test rows
deleted after.

**RESULT: PASS.**

## Framework coverage view — deferred, not started (2026-08-21)

Before scoping this unit, presented the user with the real choice: which framework(s) to
target, since nothing in this repo currently has an authoritative mapping to reuse. The
`/compliance` page's `FRAMEWORK_REFERENCES` list (NIST AI RMF, ISO/IEC 42001, EU AI Act, OWASP
LLM Top 10) is explicitly labeled "reference-only... not features to build" -- adopting it as
this unit's target would still require inventing real, control-level mappings
(`{framework, control}` values in `frameworkRefs`) with no source to check them against.
Fabricating those mappings myself would be authoring compliance content, not implementing a
spec -- explicitly out of bounds for this build session.

**Decision: defer entirely, do not build any part of this unit.** `frameworkRefs` remains
`NULL` on every existing definition. No framework/control vocabulary is defined anywhere in this
codebase. Populating either requires a real compliance/legal-reviewed mapping exercise -- a
content-authoring task, not an engineering one -- and is not picked up on momentum from this
session. This is the same "resolved by deferral, not silently dropped" treatment Phase 3 gave
"framework-pack browse and apply" (which was folded into this exact unit); both now defer to
whenever that mapping work is actually commissioned.

**Not built, wiring into `/compliance` either** -- there is nothing real yet to wire in.

## Phase 4 status

**Signed off as of 2026-08-21**, with one deliverable: the verdict audit trail UI (units 1-2
above, backend + frontend, both Tier A/B verified). The framework coverage view is the phase's
only other originally-listed item, and it is explicitly NOT signed off as done -- it is an
open, unstarted gap, logged above with the reason, not quietly treated as satisfied because the
rest of the phase closed. Phase 5 is gated behind this sign-off per the protocol, but should not
be started without a separate explicit go-ahead -- its remaining items include `custom_code`
sandboxing, which the protocol itself flags as the one item in the whole build with a real
security surface if done wrong.
