import { MigrationInterface, QueryRunner } from 'typeorm'
import { randomUUID } from 'crypto'

/**
 * See the postgres sibling migration
 * (1798000000000-SupersedePromptInjectionDefenseParamSchema.ts) for the full rationale comment --
 * kept identical here to avoid drift across driver files.
 */
export class SupersedePromptInjectionDefenseParamSchema1798000000003 implements MigrationInterface {
    name = 'SupersedePromptInjectionDefenseParamSchema1798000000003'

    public async up(queryRunner: QueryRunner): Promise<void> {
        const rows: any[] = await queryRunner.query(
            `SELECT * FROM "guardrail_definition" WHERE "key" = 'prompt_injection_defense' AND "supersededByDefinitionId" IS NULL AND "deletedAt" IS NULL;`
        )
        if (rows.length !== 1) return

        const old = rows[0]
        const newId = randomUUID()
        const newVersion = Number(old.version) + 1

        await queryRunner.query(
            `INSERT INTO "guardrail_definition"
                ("id","key","name","description","icon","origin","category","kindKey","placement","allowedHosts","hooks","paramSchema","defaultParams","defaultOnFailAction","defaultFailMode","defaultTimeoutMs","defaultObserveMode","frameworkRefs","version","workspaceId","createdBy")
             VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?);`,
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
        await queryRunner.query(`UPDATE "guardrail_definition" SET "supersededByDefinitionId" = ? WHERE "id" = ?;`, [newId, old.id])
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const rows: any[] = await queryRunner.query(
            `SELECT * FROM "guardrail_definition" WHERE "key" = 'prompt_injection_defense' AND "supersededByDefinitionId" IS NULL AND "deletedAt" IS NULL;`
        )
        if (rows.length !== 1) return
        const current = rows[0]
        await queryRunner.query(`DELETE FROM "guardrail_definition" WHERE "id" = ?;`, [current.id])
        await queryRunner.query(
            `UPDATE "guardrail_definition" SET "supersededByDefinitionId" = NULL WHERE "key" = 'prompt_injection_defense' AND "supersededByDefinitionId" = ?;`,
            [current.id]
        )
    }
}
