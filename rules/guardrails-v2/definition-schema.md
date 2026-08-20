# Guardrails v2 — Definition schema

Written first as the reviewable spec, then implemented unchanged as
`packages/server/src/database/entities/GuardrailDefinition.ts` in Phase 1. Field types follow
this repo's existing convention (`@Entity()` + explicit `@Column()`, JSON always
`@Column({type:'text'})` + manual `JSON.parse`/`JSON.stringify`, uuid PK, paired
`@CreateDateColumn()`/`@UpdateDateColumn()` — confirmed against `ChatFlow.ts`, `Assistant.ts`,
`GuardrailPolicy.ts`; no `jsonb`/`simple-json` anywhere in this codebase).

## `GuardrailDefinition`

| Field | Type | Nullable | Notes |
|---|---|---|---|
| `id` | uuid, PK | no | `@PrimaryGeneratedColumn('uuid')`, immutable, never reused. |
| `key` | text | no | e.g. `pii_redaction`. Not DB-unique-constrained (see below) — one `key` can have multiple rows across versions. |
| `name` | text | no | Display name. |
| `description` | text | no | |
| `icon` | text | yes | |
| `origin` | text (`'system'\|'custom'`) | no | `system` = seeded/global, `workspaceId IS NULL`. `custom` = workspace-authored (no Phase 1 authoring path exists yet — field exists for Phase 3). |
| `category` | text (`safety\|privacy\|security\|compliance\|quality`) | no | Drives `failMode` default. |
| `kindKey` | text | no | One of the 10 keys in `kinds.md`. |
| `placement` | text (`'inline'\|'attached'\|'flow'`) | no | Every definition declares exactly one, per build plan §4. |
| `allowedHosts` | text (JSON array) | yes | Node categories/baseClasses this may attach to, when `placement='attached'`. **Update (2026-08-20, Phase 2):** a real `guardrails` anchor now exists on `ToolAgent.ts`/`AgentAsTool.ts`, but connection validation is currently structural, not data-driven from this column — the anchor's `type:'Guardrail'` matches any node with `baseClasses:['Guardrail']`, and nothing yet reads `allowedHosts` at runtime to reject an otherwise-type-compatible connection to the wrong host. Seeded rows for the 3 in-scope keys have not been checked/back-filled with real values. This is exactly the gap Phase 2's "Connection validation" unit closes — see `phase2-canvas.md` for that unit's report once done. |
| `hooks` | text (JSON: `'pre'\|'post'\|'both'`) | yes | When `placement='attached'`. Now consumed structurally too: `egress_filtering`/`prompt_injection_defense` are effectively `pre`/`post` respectively via their two separate `runAttachedGuardrails.ts` exports, `confused_deputy_prevention` is `pre` — but again via hardcoded call sites in the 3 physical node files, not by reading this column. |
| `paramSchema` | text (JSON) | no | Descriptive schema for a future config form. Not rendered by anything in Phase 1. |
| `defaultParams` | text (JSON) | no | What a new attachment snapshots if the definition's own default is used. |
| `defaultOnFailAction` | text | no | See `verdict-contract.md`. |
| `defaultFailMode` | text (`'open'\|'closed'`) | no | Defaulted from `category` at seed time, explicit per row after that (decision 6 — no platform-wide setting). |
| `defaultTimeoutMs` | integer | no | |
| `defaultObserveMode` | boolean | no, default `true` | Decision 5 — observe-first. |
| `frameworkRefs` | text (JSON array of `{framework, control}`) | yes | Compliance metadata from day one per decision 7, even though the coverage UI is Phase 4. |
| `version` | integer | no, default `1` | Bumped by creating a new row with `supersededByDefinitionId` pointing forward from the old one — not by mutating a row in place, so a flow that snapshotted an old version's params keeps working. |
| `supersededByDefinitionId` | uuid | yes | Points to the newer version's `id`, when this row has been superseded. |
| `workspaceId` | text | yes | `NULL` = system/global. Set = workspace-scoped custom definition. |
| `createdBy` | text | yes | |
| `deletedAt` | timestamp | yes | **First soft-delete column in this codebase** — no `@DeleteDateColumn()`/boolean-`deleted` precedent exists anywhere else to follow (checked `ChatFlow`, `Assistant`, and every guardrails entity). Flagging explicitly so this isn't mistaken for an established repo pattern in review. |
| `createdDate` / `updatedDate` | timestamp | no | `@CreateDateColumn()` / `@UpdateDateColumn()`, same as every other entity. |

**"Only one active row per `key`" is an application-level invariant, not a DB constraint** —
enforced by every read filtering `deletedAt IS NULL AND supersededByDefinitionId IS NULL`.
This matches how this repo already prefers app-level invariants (e.g. workspace-membership
checks) over exotic DB constraints, and avoids needing a partial/conditional unique index that
would have to be expressed differently across all four supported drivers.

## `GuardrailFlowAttachment`

| Field | Type | Nullable | Notes |
|---|---|---|---|
| `id` | uuid, PK | no | |
| `workspaceId` | text | no | |
| `chatflowId` | text | no | **Always a real chatflow id — no `''` workspace-wide sentinel.** A workspace-wide toggle becomes N per-chatflow rows at backfill time; this is how §2.2's "no workspace-wide defaults" deletion is enforced structurally, not just by removing a UI control. |
| `definitionId` | uuid | no | |
| `definitionKey` | text | no | Denormalized — keeps evaluation working even if the definition is later soft-deleted. |
| `kindKey` | text | no | Denormalized, same reason. |
| `paramsSnapshot` | text (JSON) | no | Snapshotted at attach time, never a live reference to the definition's current params (build plan §6.1 rule 4). |
| `onFailAction` | text | no | |
| `failMode` | text | no | |
| `timeoutMs` | integer | no | |
| `observeMode` | boolean | no, default `true` | **The sole gate for real enforcement.** Nothing in Phase 1 ever sets this to `false` — it stays `true` on every backfilled row. A future, explicit, separately-reviewed promotion step is the only thing that should ever flip it. |
| `createdBy` | text | yes | |
| `createdDate` / `updatedDate` | timestamp | no | |

Unique index `(chatflowId, definitionKey)`.

## `GuardrailVerdict` (append-only)

| Field | Type | Nullable | Notes |
|---|---|---|---|
| `id` | uuid, PK | no | |
| `workspaceId` | text | no | |
| `chatflowId` | text | no | |
| `nodeId` | text | no, default `''` | Real host-node canvas id where one exists; `''` for flow-scoped checks with no host node. |
| `definitionId` | uuid | yes | Nullable defensively — `definitionKey` is the durable join, definitions are never hard-deleted so this should normally resolve. |
| `definitionKey` | text | no | |
| `kindKey` | text | no | |
| `verdict` | text | no | One of the 5 verdict values. |
| `score` | float | yes | |
| `reason` | text | yes | |
| `evidence` | text (JSON) | yes | |
| `latencyMs` | integer | no | |
| `observeMode` | boolean | no | The mode *at the time of this verdict* — recorded per-row since an attachment's mode can change over time and old verdicts shouldn't be reinterpreted retroactively. |
| `createdDate` | timestamp | no | `@CreateDateColumn()` only — **no `updatedDate`**, this table is append-only, mirroring `ToolCallAudit`'s shape. |

This is the concrete hook build plan §2.1 requires: "guardrail verdicts must be recorded per
`chatflowId + nodeId + definitionId` from Phase 1. That is the only hook a future
mandatory-policy layer needs." Nothing reads this table yet in Phase 1 — it exists purely so
that observe-mode data accumulates from day one instead of needing a second migration later to
backfill history that was never recorded.
