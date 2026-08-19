import { MigrationInterface, QueryRunner } from 'typeorm'

/**
 * See the postgres sibling migration (1796000000000-AddGuardrailDefinitionKeyUniqueConstraint.ts)
 * for the full rationale comment -- kept identical here to avoid drift across driver files.
 */
export class AddGuardrailDefinitionKeyUniqueConstraint1796000000003 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX IF EXISTS "idx_guardrail_definition_key";`)
        await queryRunner.query(`CREATE UNIQUE INDEX IF NOT EXISTS "idx_guardrail_definition_key" ON "guardrail_definition"("key");`)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX IF EXISTS "idx_guardrail_definition_key";`)
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_guardrail_definition_key" ON "guardrail_definition"("key");`)
    }
}
