# Guardrails v2 — Kind list (finalized)

The 10 candidates from `Guardrails_build_plan.md` §3.1, unchanged in count. Each wraps
existing, already-tested logic (see `phase0-audit.md`) rather than being reimplemented from
scratch — this is the whole point of "ten executors in code, unlimited nodes in the palette."

| Kind key | What it checks | Config shape | Wraps |
|---|---|---|---|
| `regex_match` | Does content match/not-match a configured regex? Verdict depends on `action`: `block`/`flag`/`redact` on match, or (for the fixed-transform case below) unconditional. | `{ pattern: string, action: 'block'\|'flag'\|'redact' }` | New — no direct existing equivalent, but the `prompt_injection_defense`/`egress_filtering` approximations below reuse it. |
| `keyword_list` | Does content contain any of a denied/allowed keyword list? | `{ terms: string[], mode: 'deny'\|'allow' }` | `checkPreflightGuardrails`'s topic-scoping substring match (lifted into a shared function). |
| `json_schema` | Does a structured payload validate against a JSON Schema? | `{ schema: object }` | New — no existing equivalent. Deferred usage until a real definition needs it; `memory_rag_write_validation` was considered but stays outside the node model entirely (see `phase0-audit.md` Finding 4), so this kind has no live Phase 1 consumer yet. |
| `pii_regex` | Regex-based PII detection + redaction. | `{ patterns?: string[] }` (built-in email/phone/SSN/card presets always apply, `patterns` adds more) | `contentRedaction.redactContent` — unchanged. |
| `llm_judge` | An LLM scores content against a rubric. | `{ rubric: string, model: string, threshold: number }` | New — no existing equivalent. No Phase 1 consumer, listed for completeness per the plan, not built against real data yet. |
| `tool_allowlist` | Is a tool call allowed for this agent? | n/a — stays on `AgentToolPolicy`, not migrated | `AgentToolPolicy.evaluate()` — unchanged, out of scope for this pass (see `phase0-audit.md` Finding 4). |
| `rate_limit` | Has a configured count/budget been exceeded in a window? | `{ metric: 'predictions'\|'steps', max: number, windowDays?: number }` | `checkPreflightGuardrails`'s spend-budget count query, and `buildAgentflow.ts`'s `maxSteps` check — one kind, two definitions (`spend_token_budgets`, `loop_recursion_detection`), each with different `metric`. |
| `hitl_gate` | Pause for human proceed/reject. | `{ message?: string }` | The existing `humanInputAgentflow` node's own runtime behavior — no Phase 1 backfill needed (Finding 4: no live `GuardrailPolicy` dependency to preserve). |
| `length_bound` | Is content within a min/max length? | `{ minLength?: number, maxLength?: number }` | New — no existing equivalent, no Phase 1 consumer. |
| `enum_constraint` | Is a value a member of an allowed set? | `{ allowedValues: string[] }` (for `confused_deputy_prevention`: the allowed set is "active members of this workspace," resolved dynamically, not a static list) | `resolveTrustedToolCallerUserId` — unchanged. |

## Two approximations, recorded rather than silently forced

**`prompt_injection_defense` → `regex_match`.** This guardrail doesn't conditionally match
anything — it unconditionally wraps every successful tool result in
`[UNTRUSTED TOOL OUTPUT]` delimiters when enabled. Modeled as `regex_match` with a
match-all pattern (`.*`) and `action: 'redact'`, so its verdict is always `redact` with the
wrapped string as `transformedPayload`. This is an approximation for schema uniformity, not a
functional change — `applyPromptInjectionWrapping`'s actual logic is unchanged and unaffected.

**`confused_deputy_prevention` → `enum_constraint`.** This guardrail doesn't check payload
content at all — it verifies a *claimed identity* against workspace membership. Modeled as
`enum_constraint` where the "allowed set" is resolved per-call (active `WorkspaceUser` rows for
the target workspace) rather than a static `allowedValues` list from config. Same note: this is
a schema-fit decision, `resolveTrustedToolCallerUserId`'s logic is unchanged.

## Kinds with no Phase 1 consumer

`json_schema`, `llm_judge`, `length_bound` are part of the finalized list (for Phase 2/3
authoring, once tenants can pick a kind and configure it) but have zero definitions seeded
against them in Phase 1 — nothing today needs them. `hitl_gate` and `tool_allowlist` kinds
exist in the list but their matching catalog rows (`hitl_approval_gates`, `tool_allowlist`)
are excluded from Phase 1's backfill (Finding 4) since neither has a live `GuardrailPolicy`
dependency worth preserving.
