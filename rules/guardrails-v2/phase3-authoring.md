# Guardrails v2 — Phase 3 (Authoring), as-built

Progress log for Phase 3, following `Guardrails_end_to_end_protocol.md`'s
BUILD/TEST/REPORT/READ/FIX/RE-TEST/ADVANCE loop, one small unit at a time. The
dynamic-node-registration fork required before this phase could start is resolved separately in
`phase3-authoring-mechanism.md` — this file is the build log for the actual authoring work.

## Kind-scope decision (2026-08-21)

Before building the create-custom-definition form, checked which of the 10 finalized kinds
(`kinds.md`) have a real, generic, config-driven executor today. Finding: **neither of the two
kind executors that exist is actually generic.**

- `regexMatch.ts`'s `checkEgressPattern` is hardcoded to `blockedDomainPatterns` substring
  matching for `egress_filtering` specifically; `wrapPromptInjection` is a fully hardcoded,
  unconditional transform for `prompt_injection_defense` specifically. Neither takes an
  arbitrary user-supplied pattern.
- `enumConstraint.ts`'s `verifyWorkspaceMembership` is hardcoded to active-workspace-membership
  checking for `confused_deputy_prevention` specifically -- it **ignores** any
  config-provided `allowedValues` list entirely.

So "authoring v1 scoped to kinds with real executors" (the first decision made this phase)
initially resolved to zero kinds, not two. Corrected in a second round: build one genuinely
generic executor first, as its own prerequisite unit, and scope authoring v1 to just that kind.
**Decision: `regex_match` only, for v1.** `enum_constraint` (and the other 8) deferred until a
real generic executor exists for them -- not built blind against a name in a table.

## Unit 1 — generic `regex_match` executor

**Tier A** (enforcement-relevant, changes what a future custom guardrail actually does).

**Build:** `packages/components/src/guardrails/kinds/regexMatch.ts` — added `evaluateRegexMatch(
params: {pattern, action}, content: string): IGuardrailVerdict`, a genuinely generic executor
matching `kinds.md`'s documented `regex_match` config shape exactly. `action:'redact'` returns
`transformedPayload` with all matches replaced (global flag); `'block'`/`'flag'` return the
matching verdict with the matched text as evidence; an invalid `pattern` fails to `block`
(loud, not silently inert) rather than throwing, matching this codebase's existing fail-closed
convention for verification failures. No new ReDoS mitigation was added -- `new RegExp()` on
user-controlled input with no complexity/timeout guard is this codebase's pre-existing
convention (`agentflowv2Generator.ts` already does the same), not a new gap this function
introduces. Flagged here rather than silently inherited: **a future hardening pass should add a
pattern-complexity check or timeout before `regex_match` is exposed to untrusted/external
users** -- acceptable for now since only workspace members with `guardrails:manage` can author
one.

**Test:** built the compiled function directly (no jest suite exists for any guardrails-v2 kind
executor in this codebase; matched that convention rather than introducing one), ran 8 real
cases: no-match pass, block-on-match, flag-on-match, redact with correct `transformedPayload`,
redact with multiple occurrences all replaced (confirms the `g` flag path), and the genuine
negative case -- an invalid/unclosed regex pattern returns `{verdict:'block', reason:'invalid
regex...'}` rather than throwing. Plus empty-content and non-string-content pass-through. All 8
passed.

**RESULT: PASS.**

**CARRY-FORWARD:** the ReDoS-hardening note above; not blocking, but should be revisited before
any world where an untrusted (non-workspace-member) actor could ever submit a pattern.

## Next units (not yet built)

- Backend: `POST /api/v1/guardrails/definitions` (create a custom `GuardrailDefinition` row,
  `origin:'custom'`, `workspaceId` forced server-side, `kindKey` restricted to `regex_match` for
  now, `placement:'attached'`), gated by the existing `guardrails:manage` permission, following
  the field-allowlist pattern `toolsController.createTool` already uses.
  `packages/server/src/services/guardrails/index.ts` currently has no create/update/delete for
  `GuardrailDefinition` -- this is genuinely new surface, not a resurrection of the removed
  `POST /catalog`.
- The two generic wrapper canvas nodes (`CustomToolCallGuardrail.ts`,
  `CustomIdentityGuardrail.ts` per `phase3-authoring-mechanism.md`) — deferred until at least one
  is needed; `CustomToolCallGuardrail.ts` first, since it's the one `regex_match`-compatible
  host category.
- Dry-run tester (Tier A: prove a user-authored pattern can be tested against sample input
  before save).
- Framework-pack browse and apply — not yet scoped in detail.
