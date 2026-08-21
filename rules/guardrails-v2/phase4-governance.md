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

## Next units (not yet built)

- Verdict audit trail UI (Tier B rendering, Tier A confirming displayed verdicts match real DB
  rows) -- the frontend for the endpoint above.
- Framework coverage view -- blocked on `frameworkRefs` being populated (currently `NULL` on
  every existing definition; carried forward from Phase 3's framework-pack deferral) and on
  defining a real framework/control vocabulary, neither of which exists yet.
- Wiring into `/compliance`, confirming no workspace-wide-defaults concept is reintroduced.
