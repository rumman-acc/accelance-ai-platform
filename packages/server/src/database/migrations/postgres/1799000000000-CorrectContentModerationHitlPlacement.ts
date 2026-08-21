import { MigrationInterface, QueryRunner } from 'typeorm'
import { randomUUID } from 'crypto'

/**
 * Closes the Phase 2 remaining-scope decision on Content Moderation / HITL Approval Gates
 * placement (rules/guardrails-v2/phase2-canvas.md, "Content Moderation & HITL placement
 * decision" section, 2026-08-21): both were seeded with `placement:'attached'`
 * (1794000000000-SeedGuardrailDefinitions.ts), implying they'd get the same
 * canvas-anchor-attachment treatment as the 3 Phase 2 guardrail nodes. They don't -- both are
 * placed directly as first-class steps in a flow's own node graph (SimplePromptModeration/
 * OpenAIModeration on the Moderation anchor; Human Input as its own node), not attached as a
 * side-accessory to a host node's anchor. Corrected to `placement:'inline'` to match that real
 * mechanism. No new build -- this is a metadata/catalog correction only, per the decision, not
 * a new attached-node feature for these two keys.
 *
 * Descriptions also corrected while superseding, to state real current capability rather than
 * "catalog entry only" (which undersold both):
 *  - content_moderation: built-but-unconfigured -- the nodes are real and functional, just
 *    unused in any shipped flow with an empty deny-list (matches
 *    rules/epics-feature-status.md's existing characterization).
 *  - hitl_approval_gates: real-when-placed -- the Human Input node's pause/resume mechanism
 *    genuinely works once placed in a flow; it's just unused in any flow built so far
 *    (rules/epics-feature-status.md section 8, "Execution checkpoint").
 *
 * Follows definition-schema.md's documented versioning model exactly (same mechanism as
 * 1798000000000-SupersedePromptInjectionDefenseParamSchema.ts): a new row per key,
 * supersededByDefinitionId pointing forward from the old one -- no row mutated in place.
 */
export class CorrectContentModerationHitlPlacement1799000000000 implements MigrationInterface {
    name = 'CorrectContentModerationHitlPlacement1799000000000'

    private readonly corrections: Record<string, string> = {
        content_moderation:
            'Blocks or flags toxic/policy-violating content using OpenAI Moderation or a deny-list. Built but unconfigured -- the SimplePromptModeration/OpenAIModeration nodes are real and functional when placed inline in a flow, but no shipped flow uses one yet and the deny-list is empty by default.',
        hitl_approval_gates:
            'Pauses execution before a risky step for a human proceed/reject decision, via the Human Input node. Real when placed -- the pause/resume mechanism genuinely works once a Human Input node is placed inline in a flow; it is simply unused in any flow built so far.'
    }

    public async up(queryRunner: QueryRunner): Promise<void> {
        for (const key of Object.keys(this.corrections)) {
            const rows: any[] = await queryRunner.query(
                `SELECT * FROM "guardrail_definition" WHERE "key" = $1 AND "supersededByDefinitionId" IS NULL AND "deletedAt" IS NULL;`,
                [key]
            )
            if (rows.length !== 1) continue

            const old = rows[0]
            const newId = randomUUID()
            const newVersion = Number(old.version) + 1

            await queryRunner.query(
                `INSERT INTO "guardrail_definition"
                    ("id","key","name","description","icon","origin","category","kindKey","placement","allowedHosts","hooks","paramSchema","defaultParams","defaultOnFailAction","defaultFailMode","defaultTimeoutMs","defaultObserveMode","frameworkRefs","version","workspaceId","createdBy")
                 VALUES
                    ($1,$2,$3,$4,$5,$6,$7,$8,'inline',$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20);`,
                [
                    newId,
                    old.key,
                    old.name,
                    this.corrections[key],
                    old.icon,
                    old.origin,
                    old.category,
                    old.kindKey,
                    old.allowedHosts,
                    old.hooks,
                    old.paramSchema,
                    old.defaultParams,
                    old.defaultOnFailAction,
                    old.defaultFailMode,
                    old.defaultTimeoutMs,
                    old.defaultObserveMode,
                    old.frameworkRefs,
                    newVersion,
                    old.workspaceId,
                    old.createdBy
                ]
            )
            await queryRunner.query(`UPDATE "guardrail_definition" SET "supersededByDefinitionId" = $1 WHERE "id" = $2;`, [newId, old.id])
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        for (const key of Object.keys(this.corrections)) {
            const rows: any[] = await queryRunner.query(
                `SELECT * FROM "guardrail_definition" WHERE "key" = $1 AND "supersededByDefinitionId" IS NULL AND "deletedAt" IS NULL;`,
                [key]
            )
            if (rows.length !== 1) continue
            const current = rows[0]
            await queryRunner.query(`DELETE FROM "guardrail_definition" WHERE "id" = $1;`, [current.id])
            await queryRunner.query(
                `UPDATE "guardrail_definition" SET "supersededByDefinitionId" = NULL WHERE "key" = $1 AND "supersededByDefinitionId" = $2;`,
                [key, current.id]
            )
        }
    }
}
