import { MigrationInterface, QueryRunner } from 'typeorm'

/**
 * See the postgres sibling migration
 * (1800000000000-ScopeGuardrailDefinitionKeyToWorkspace.ts) for the full rationale comment --
 * kept identical here to avoid drift across driver files.
 */
export class ScopeGuardrailDefinitionKeyToWorkspace1800000000003 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX IF EXISTS "idx_guardrail_definition_key_version";`)
        await queryRunner.query(
            `CREATE UNIQUE INDEX IF NOT EXISTS "idx_guardrail_definition_workspace_key_version" ON "guardrail_definition"(COALESCE("workspaceId", ''), "key", "version");`
        )
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX IF EXISTS "idx_guardrail_definition_workspace_key_version";`)
        await queryRunner.query(
            `CREATE UNIQUE INDEX IF NOT EXISTS "idx_guardrail_definition_key_version" ON "guardrail_definition"("key", "version");`
        )
    }
}
