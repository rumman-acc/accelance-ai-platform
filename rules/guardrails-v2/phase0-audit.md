# Guardrails v2 — Phase 0 audit

Written per `Guardrails_build_plan.md`'s Phase 0 exit criteria: "audit what
`preflightGuardrails.ts`, `toolPolicy.ts`, and the PII-on-save path *actually* do — the ledger
records intent." Everything below is drawn from direct reads of the current code (this
session), not from `rules/epics-feature-status.md`'s summary of it — that file has been wrong
about this exact area before (see `rules/known-issues.md` #015).

## Finding 1 — the catalog is not 5 rows

`Guardrails_build_plan.md` §1 says: "The `guardrail_definition` catalog holds a fixed set of
five rows — content moderation, PII redaction, prompt-injection defense, tool allowlist, topic
scoping." As of this audit, `guardrail_catalog_item` actually holds:

- **Guardrail category (11):** `content_moderation`, `tool_allowlist`, `pii_redaction`,
  `prompt_injection_defense`, `topic_action_scoping`, `spend_token_budgets`,
  `hitl_approval_gates`, `loop_recursion_detection`, `egress_filtering`,
  `confused_deputy_prevention`, `memory_rag_write_validation`.
- **Compliance category (3):** `audit_log`, `data_retention_policy`, `policy_templates`.

That is **14 rows total**, grown across three migration batches
(`1783000000000`/`1785000000000`/`1786000000000` and their per-driver siblings) after the
plan's problem statement was written. §8's backfill scope ("the five existing catalog rows")
has to be re-derived from what's actually enforced today, not from this count — see Finding 3.

## Finding 2 — per-function audit

| File | Function | What it actually does | Reached via |
|---|---|---|---|
| `packages/server/src/utils/preflightGuardrails.ts` | `checkPreflightGuardrails` | Evaluates `topic_action_scoping` (substring match against `config.deniedTopics`, saves a refusal message and blocks) and `spend_token_budgets` (counts this month's `apiMessage` rows for the workspace, blocks past `config.maxPredictionsPerMonth`). Called **once per request**, before any node executes. | **Direct server-side TypeORM** — `guardrailsService.evaluate()` calls `appServer.AppDataSource.getRepository(GuardrailPolicy)` directly. Not affected by the `databaseEntities` bag at all. |
| `packages/server/src/utils/preflightGuardrails.ts` | `resolveTrustedToolCallerUserId` | Confused-deputy check: only trusts a claimed triggering-user id (from an inner `AgentAsTool` call) after verifying that user is an active member of the target workspace. Fails safe (`undefined`) on any error or unverified claim. | Same direct server-side path as above. |
| `packages/components/src/toolPolicy.ts` | `checkEgressFiltering` | Evaluates `egress_filtering`; if enabled, denies a tool call whose stringified args match a blocked-domain pattern (seeded SSRF baseline). | **`options.databaseEntities['GuardrailPolicy']`** — a manually-curated allowlist object (`packages/server/src/utils/index.ts`), threaded into every node's `options` bag. Only reached from `packages/components/nodes/agentflow/Tool/Tool.ts` — AgentFlow V2's Tool node. |
| `packages/components/src/toolPolicy.ts` | `applyPromptInjectionWrapping` | Evaluates `prompt_injection_defense`; if enabled, wraps a successful tool result string in `[UNTRUSTED TOOL OUTPUT]` delimiters before the LLM re-reads it. Unconditional transform when enabled — nothing to "match," it always wraps. | Same `databaseEntities` bag path as above. |
| `packages/server/src/utils/buildAgentflow.ts` | inline `loop_recursion_detection` check (~line 1932) | Evaluates the guardrail once before the AgentFlow V2 execution loop starts; if enabled, `config.maxSteps` becomes an additional per-workspace/agent ceiling layered under the platform-wide `MAX_ITERATIONS` env var. | Direct server-side TypeORM, same as `preflightGuardrails.ts`. |
| `packages/server/src/utils/contentRedaction.ts` + `addChatMesage.ts` | `redactContent`, called from the message-save path | Evaluates `pii_redaction` (plus any enabled custom policy-kind entry) via `getActiveRedactionPatterns`; if enabled, redacts email/phone/SSN/card patterns (+ custom regex) in a chat message's content **before it's persisted** — this runs after the flow has already returned, server-side, with no host node. This is the case §4.4 is about. | Direct server-side TypeORM. |
| `packages/server/src/services/documentstore/index.ts` | `editDocumentStoreFileChunk` | Evaluates `memory_rag_write_validation` — **hardcoded `chatflowId=''`**, i.e. workspace-wide only, never chatflow-scoped in practice. Redacts a document chunk's content against a custom pattern denylist (empty by default) before a manual chunk edit is saved. | Direct server-side TypeORM. Workspace-scoped, no chatflow, no host node — gates a document-store write, not an agent's execution. |
| `packages/server/src/services/audit-log/index.ts` | audit write | Evaluates `audit_log` — **hardcoded workspace-wide** (`WORKSPACE_WIDE` sentinel). Writes an audit row only if enabled for the workspace. | Direct server-side TypeORM (own query, doesn't even go through `guardrailsService`). Workspace-scoped, no chatflow. |
| `packages/server/src/schedule/RetentionCleanup.ts` | daily cron | Evaluates `data_retention_policy` — **hardcoded workspace-wide** (`findBy({chatflowId: WORKSPACE_WIDE, ...})`). Deletes chat messages/executions/tool-call-audit rows older than the configured window only for workspaces with this enabled. | Direct server-side TypeORM. Workspace-scoped, no chatflow, runs on a cron, not per-request. |

**Critical distinction found here, load-bearing for Phase 1 rollout safety:** every guardrail
above is reached via **direct server-side TypeORM** except the two routed through
`packages/components/src/toolPolicy.ts`'s `evaluateGuardrailPolicy()`, which reads
`options.databaseEntities['GuardrailPolicy']` — a separate, manually-curated allowlist object
that (as of this audit) is **missing `GuardrailPolicy`/`GuardrailCatalogItem` entirely** (see
`rules/known-issues.md` #017). This means `egress_filtering` and `prompt_injection_defense`
have been silently non-functional (fail-open, `enabled:false` on every call) regardless of
their toggle state, while every other guardrail in this table has been genuinely live and
unaffected by anything in this rearchitecture. **Fixing #017's plumbing bug is therefore not a
routine fix — it turns on real, previously-inert enforcement for whichever
workspaces/chatflows already have these two toggled on.** See the implementation plan's
"shadow-gate" section for how Phase 1 handles this without silently changing production
behavior.

## Finding 3 — three execution chokepoints, not one

There is no single shared per-node execution function across flow types:

- AgentFlow V2: `newNodeInstance.run(reactFlowNodeData, finalInput, runParams)` —
  `packages/server/src/utils/buildAgentflow.ts:~1272`.
- Classic/multi-agent: `newNodeInstance.init(reactFlowNodeData, finalQuestion, {...})` —
  `packages/server/src/utils/index.ts`'s `buildFlow`, `~657`.
- Classic ending node: `.run()` again — `packages/server/src/utils/buildChatflow.ts:~794`.

`checkPreflightGuardrails` genuinely covers all three flow types uniformly, but only as one
**request-level** gate inside `utilBuildChatflow` (the shared entry point every flow type
dispatches through before reaching any of the three chokepoints above) — not because there's
one shared per-node call.

## Finding 4 — which rows are genuinely chatflow-scoped vs. workspace-only

This determines what §8's backfill can even attach to, since `inline`/`attached`/`flow`
placement are all chatflow-scoped by definition in the build plan's model.

**Chatflow-scoped today, real backfill candidates (7):** `pii_redaction`,
`topic_action_scoping`, `spend_token_budgets`, `prompt_injection_defense`,
`egress_filtering`, `confused_deputy_prevention`, `loop_recursion_detection` — each reads
`GuardrailPolicy` with a real `chatflowId`, honoring most-specific-match-wins. Two of these
seven (`egress_filtering`, `prompt_injection_defense`) are the ones affected by the
`databaseEntities` bug in Finding 2 — chatflow-scoped in the data model, but not actually
live until that plumbing bug is fixed, and even then gated behind an explicit promotion step
(see the implementation plan).

**No live `GuardrailPolicy` dependency at all — nothing to backfill:** `content_moderation`
(the actual moderation logic lives on the `SimplePromptModeration`/`OpenAIModeration` node
instance itself, independent of any policy row) and `hitl_approval_gates` (no enforcement
tied to `GuardrailPolicy` — the real HITL enforcement is a separate AI-generator classifier
mechanism, unrelated to this catalog entry).

**Real, live, but workspace-scoped only — no chatflow to attach to, stay on the old
mechanism unchanged:** `memory_rag_write_validation`, `audit_log`, `data_retention_policy`
(confirmed above), plus `tool_allowlist` (never reads `GuardrailPolicy` at all — lives
entirely on its own `AgentToolPolicy` table). **This is the reason
`guardrail_policy`/`guardrail_catalog_item` cannot be dropped in Phase 1** — three real checks
still read them, and dropping the tables would be a silent regression exactly like the one §8
warns about.

**Deleted outright, not migrated:** `policy_templates` — its entire function
(`applyDefaultPolicyTemplate`, the retroactive-apply mechanism) is a §2.2 deletion target.

That's **14 rows accounted for**: 7 backfilled + 2 no-dependency + 4 workspace-scoped-exception
(`tool_allowlist`, `memory_rag_write_validation`, `audit_log`, `data_retention_policy`) +
1 deleted (`policy_templates`) = 14.

## §4.4 resolution

PII-on-save becomes a `flow`-placement guardrail (conceptually attached to a chatflow's start
node) rather than staying a documented runtime exception. Rationale: avoids reintroducing the
two-mechanisms problem decision 8 was written to prevent, at the cost of some extra Phase-1
backfill work — accepted, since `pii_redaction` is one of the 7 real chatflow-scoped rows
being backfilled anyway.
