import { MigrationInterface, QueryRunner } from 'typeorm'
import { randomUUID } from 'crypto'

/**
 * Closes a real catalog/reality mismatch found while live-verifying Phase 2's config-panel
 * round-trip (rules/guardrails-v2/phase2-canvas.md, "Config panel round-trip" unit,
 * 2026-08-21): the seeded `prompt_injection_defense` row
 * (1794000000000-SeedGuardrailDefinitions.ts) has `paramSchema: {"pattern":"string",
 * "action":"string"}`, but the shipped node (`PromptInjectionDefense.ts`) has zero configurable
 * params beyond `observeMode` -- it implements the "match-all approximation" already documented
 * as final v1 scope in kinds.md. The DB row was never updated to match.
 *
 * Follows definition-schema.md's documented versioning model exactly (line 32): "Bumped by
 * creating a new row with supersededByDefinitionId pointing forward from the old one -- not by
 * mutating a row in place, so a flow that snapshotted an old version's params keeps working."
 * No existing GuardrailFlowAttachment/flowData row references this definition's paramSchema
 * shape by value (Phase 2's attached nodes carry their own params in the node's own
 * `data.inputs`, not a snapshot of this row -- see phase2-canvas.md), so there is nothing to
 * migrate forward; this purely corrects the catalog going forward.
 */
export class SupersedePromptInjectionDefenseParamSchema1798000000000 implements MigrationInterface {
    name = 'SupersedePromptInjectionDefenseParamSchema1798000000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        const rows: any[] = await queryRunner.query(
            `SELECT * FROM "guardrail_definition" WHERE "key" = 'prompt_injection_defense' AND "supersededByDefinitionId" IS NULL AND "deletedAt" IS NULL;`
        )
        if (rows.length !== 1) return // nothing to do -- either already superseded or absent

        const old = rows[0]
        const newId = randomUUID()
        const newVersion = Number(old.version) + 1

        await queryRunner.query(
            `INSERT INTO "guardrail_definition"
                ("id","key","name","description","icon","origin","category","kindKey","placement","allowedHosts","hooks","paramSchema","defaultParams","defaultOnFailAction","defaultFailMode","defaultTimeoutMs","defaultObserveMode","frameworkRefs","version","workspaceId","createdBy")
             VALUES
                ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21);`,
            [
                newId,
                old.key,
                old.name,
                old.description,
                old.icon,
                old.origin,
                old.category,
                old.kindKey,
                old.placement,
                old.allowedHosts,
                old.hooks,
                '{}',
                '{}',
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

    public async down(queryRunner: QueryRunner): Promise<void> {
        const rows: any[] = await queryRunner.query(
            `SELECT * FROM "guardrail_definition" WHERE "key" = 'prompt_injection_defense' AND "supersededByDefinitionId" IS NULL AND "deletedAt" IS NULL;`
        )
        if (rows.length !== 1) return
        const current = rows[0]
        await queryRunner.query(`DELETE FROM "guardrail_definition" WHERE "id" = $1;`, [current.id])
        await queryRunner.query(
            `UPDATE "guardrail_definition" SET "supersededByDefinitionId" = NULL WHERE "key" = 'prompt_injection_defense' AND "supersededByDefinitionId" = $1;`,
            [current.id]
        )
    }
}
