import { MigrationInterface, QueryRunner } from 'typeorm'

/**
 * See the postgres sibling migration
 * (1800000000000-ScopeGuardrailDefinitionKeyToWorkspace.ts) for the full rationale comment --
 * kept identical here to avoid drift across driver files.
 */
export class ScopeGuardrailDefinitionKeyToWorkspace1800000000002 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`guardrail_definition\` DROP INDEX \`idx_guardrail_definition_key_version\`;`)
        await queryRunner.query(
            `ALTER TABLE \`guardrail_definition\` ADD UNIQUE INDEX \`idx_guardrail_definition_workspace_key_version\` ((COALESCE(\`workspaceId\`, '')), \`key\`, \`version\`);`
        )
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`guardrail_definition\` DROP INDEX \`idx_guardrail_definition_workspace_key_version\`;`)
        await queryRunner.query(
            `ALTER TABLE \`guardrail_definition\` ADD UNIQUE INDEX \`idx_guardrail_definition_key_version\` (\`key\`, \`version\`);`
        )
    }
}
