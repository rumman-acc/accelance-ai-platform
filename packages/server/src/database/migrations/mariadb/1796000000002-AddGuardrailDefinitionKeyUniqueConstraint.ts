import { MigrationInterface, QueryRunner } from 'typeorm'

/**
 * See the postgres sibling migration (1796000000000-AddGuardrailDefinitionKeyUniqueConstraint.ts)
 * for the full rationale comment -- kept identical here to avoid drift across driver files.
 */
export class AddGuardrailDefinitionKeyUniqueConstraint1796000000002 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`guardrail_definition\` DROP INDEX \`idx_guardrail_definition_key\`;`)
        await queryRunner.query(`ALTER TABLE \`guardrail_definition\` ADD UNIQUE INDEX \`idx_guardrail_definition_key\` (\`key\`);`)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`guardrail_definition\` DROP INDEX \`idx_guardrail_definition_key\`;`)
        await queryRunner.query(`ALTER TABLE \`guardrail_definition\` ADD INDEX \`idx_guardrail_definition_key\` (\`key\`);`)
    }
}
