# Guardrails v2 — Phase 1 reconciliation (14 catalog rows → 13 seeded → 7 backfilled)

Written in response to an explicit verification request before Phase 1 sign-off: account for
every row in the chain, not just the totals.

## The full table

| Definition (catalog key) | Seeded into `GuardrailDefinition`? | Flow-attachable (has a chatflow to attach to)? | Backfilled into `GuardrailFlowAttachment`? | Reason if not backfilled |
|---|---|---|---|---|
| `content_moderation` | Yes | **No** | No | Never read `GuardrailPolicy` for real behavior — its actual moderation logic lives on the `SimplePromptModeration`/`OpenAIModeration` node instance itself, detected by node presence, not a policy toggle. Nothing to backfill. |
| `tool_allowlist` | Yes | **No** | No | Lives entirely on its own `AgentToolPolicy` table (a separate, pre-existing, already chatflow-scoped mechanism) — never touches `GuardrailPolicy` at all. Out of scope for this model. |
| `pii_redaction` | Yes | **Yes** | **Yes** | — |
| `prompt_injection_defense` | Yes | **Yes** | **Yes** | Backfilled, but see "The one caveat" below — its real enforcement additionally depends on a plumbing bug fix (#017) that is itself gated behind explicit promotion, not automatic. |
| `topic_action_scoping` | Yes | **Yes** | **Yes** | — |
| `spend_token_budgets` | Yes | **Yes** | **Yes** | — |
| `hitl_approval_gates` | Yes | **No** | No | No `GuardrailPolicy` dependency exists to preserve — real HITL enforcement is a separate AI-generator classifier mechanism, unrelated to this catalog entry. |
| `loop_recursion_detection` | Yes | **Yes** | **Yes** | — |
| `egress_filtering` | Yes | **Yes** | **Yes** | Same caveat as `prompt_injection_defense` below. |
| `confused_deputy_prevention` | Yes | **Yes** | **Yes** | — |
| `memory_rag_write_validation` | Yes | **No** | No | Its own enforcement code hardcodes `chatflowId=''` — workspace-scoped only, no per-chatflow attachment point exists in the current implementation at all. |
| `audit_log` | Yes | **No** | No | Hardcoded workspace-wide sentinel in `services/audit-log/index.ts` — no chatflow concept. |
| `data_retention_policy` | Yes | **No** | No | A daily cron job, workspace-scoped — no chatflow concept. |
| `policy_templates` | **No** | N/A | N/A | Deleted outright per §2.2 — its entire function (`applyDefaultPolicyTemplate`, the retroactive-apply mechanism) no longer exists, so there is nothing to seed or attach. |

**Totals: 14 catalog rows → 13 seeded (all except `policy_templates`, which is deleted, not
migrated) → 7 flow-attachable → 7 backfilled.**

## Answering the three specific questions

**What happened to the 14th row?** `policy_templates`. It is not one of the three
workspace-scoped-only items — it's the one row deleted outright, because its entire function
(applying a default bundle to new workspaces, and retroactively when toggled) is the exact
"workspace-wide defaults" mechanism §2.2 removes. There was nothing to seed: no definition, no
attachment, no equivalent in the new model.

**Of the 13 seeded definitions, how many are flow-attachable vs. workspace-scoped-only?**
**7 are flow-attachable** (have a real chatflow to attach to): `pii_redaction`,
`prompt_injection_defense`, `topic_action_scoping`, `spend_token_budgets`,
`loop_recursion_detection`, `egress_filtering`, `confused_deputy_prevention`.
**6 are not** — split two ways: `content_moderation` and `hitl_approval_gates` have no
`GuardrailPolicy` dependency at all (their real behavior lives elsewhere); `tool_allowlist`,
`memory_rag_write_validation`, `audit_log`, `data_retention_policy` are real, live checks that
are workspace-scoped only, with no chatflow to attach to, and stay on their existing mechanism
unchanged.

**Do the 7 backfilled keys cover all flow-attachable definitions, or a subset?** **All of
them — full coverage, not a subset.** Every one of the 7 flow-attachable definitions has a
corresponding backfill; there is no flow-attachable definition that was left out. (Verified
against the real dev DB before the working-tree revert described in the implementation
record: 147 attachment rows = 21 chatflows × 7 keys, no gaps.)

## The one caveat — `egress_filtering` and `prompt_injection_defense`

These two are "backfilled" in the sense that a `GuardrailFlowAttachment` row exists wherever
the old `GuardrailPolicy` row was enabled. But their real enforcement runs through
`packages/components/src/toolPolicy.ts`, which reads `options.databaseEntities['GuardrailPolicy']`
— an object that, as of the Phase 0 audit, was **missing** that key entirely (`known-issues.md`
#017), meaning these two guardrails have been silently non-functional regardless of toggle
state. Fixing that plumbing bug is not "routine" — it turns on real, previously-inert
enforcement for two toggles that a real workspace has had switched on. See the implementation
plan's shadow-gate design: the fix now lets the old path's decision be **recorded** (so
comparison data can accumulate), but the actual block/wrap action stays off until a
`GuardrailFlowAttachment.observeMode` is explicitly flipped to `false` — which nothing in
Phase 1 does automatically.
