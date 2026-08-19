# Guardrails v2 — Verdict contract

Per `Guardrails_build_plan.md` §5: every kind returns the same shape, whatever it does
internally. The runtime never needs to know what a guardrail checks — only what it returned.

## `IGuardrailVerdict` (returned by every kind's `execute()`)

| Field | Type | Notes |
|---|---|---|
| `verdict` | `'pass' \| 'flag' \| 'block' \| 'redact' \| 'require_approval'` | The one thing every caller branches on. |
| `score?` | `number` | Optional confidence/severity score (e.g. an `llm_judge` rubric score). Most kinds omit it. |
| `reason?` | `string` | Human-readable explanation, surfaced in `GuardrailVerdict.reason` and any future review UI. |
| `transformedPayload?` | `string` | Only present when `verdict === 'redact'` — the content after transformation (e.g. PII-redacted text, prompt-injection-wrapped tool output). |
| `evidence?` | `Record<string, unknown>` | Whatever the kind wants to record for audit (matched pattern, matched keyword, exceeded count, etc.) — stored as JSON in `GuardrailVerdict.evidence`. |
| `latencyMs` | `number` | Measured by the caller (`resolveGuardrailAttachment`'s wrapper), not the kind itself — keeps every kind implementation simple. |

## Per-node-instance config (carried on `GuardrailFlowAttachment`, not the verdict)

| Field | Type | Notes |
|---|---|---|
| `onFailAction` | `'block' \| 'redact' \| 'flag' \| 'require_approval'` | What happens when the verdict isn't `pass`, for `attached`/`flow` placement (no output ports to branch on — see build plan §4). Defaulted per-definition, not global. |
| `failMode` | `'open' \| 'closed'` | What happens if the kind itself throws/times out. Per decision 6: **no platform-wide setting** — defaulted from category (privacy/security categories default `closed`; quality/safety default `open`), explicit per instance. |
| `timeoutMs` | `number` | Hard ceiling on kind execution — see "Timeouts" below. |
| `observeMode` | `boolean` | Per decision 5: **defaults `true`** on every definition and every backfilled attachment. In observe mode, a non-`pass` verdict is recorded but never blocks — traffic always proceeds. Promotion to blocking is an explicit per-attachment flip, not built until Phase 2 has a UI for it. **`observeMode === false` is the sole gate for real enforcement anywhere in Phase 1** — nothing sets it automatically; see the implementation plan's shadow-gate section for why this matters specifically for `egress_filtering`/`prompt_injection_defense`. |

## Timeouts

Every kind execution is wrapped in `withTimeout(promise, ms, message)` — lifted from
`packages/server/src/services/custom-mcp-servers/index.ts`'s existing `Promise.race` helper —
so a hanging guardrail (most likely an `llm_judge` call, once one exists) can never block the
single-process event loop indefinitely. A timeout is treated as a thrown error and goes
through the `failMode` open/closed handling like any other kind failure.

## Interaction between observe mode and placement

An `inline`-placement guardrail's fail port never fires while `observeMode` is `true` — the
verdict is still recorded, but the graph always routes to the pass edge. This only matters
starting Phase 2 (no `inline` guardrails can exist without canvas drag-and-drop); recorded
here because the field exists on the schema now and defaults correctly, so Phase 2 doesn't
need a migration to introduce it later.
