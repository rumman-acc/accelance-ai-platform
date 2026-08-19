import { MigrationInterface, QueryRunner } from 'typeorm'

/**
 * See the postgres sibling migration
 * (1797000000000-MakeGuardrailDefinitionKeyVersionUnique.ts) for the full rationale comment --
 * kept identical here to avoid drift across driver files.
 */
export class MakeGuardrailDefinitionKeyVersionUnique1797000000001 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`guardrail_definition\` DROP INDEX \`idx_guardrail_definition_key\`;`)
        await queryRunner.query(
            `ALTER TABLE \`guardrail_definition\` ADD UNIQUE INDEX \`idx_guardrail_definition_key_version\` (\`key\`, \`version\`);`
        )
        await queryRunner.query(`ALTER TABLE \`guardrail_definition\` ADD INDEX \`idx_guardrail_definition_key\` (\`key\`);`)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`guardrail_definition\` DROP INDEX \`idx_guardrail_definition_key_version\`;`)
        await queryRunner.query(`ALTER TABLE \`guardrail_definition\` DROP INDEX \`idx_guardrail_definition_key\`;`)
        await queryRunner.query(`ALTER TABLE \`guardrail_definition\` ADD UNIQUE INDEX \`idx_guardrail_definition_key\` (\`key\`);`)
    }
}
