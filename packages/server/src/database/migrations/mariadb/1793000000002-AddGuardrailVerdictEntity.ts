import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddGuardrailVerdictEntity1793000000002 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `CREATE TABLE IF NOT EXISTS \`guardrail_verdict\` (
                \`id\` varchar(36) NOT NULL,
                \`workspaceId\` varchar(36) NOT NULL,
                \`chatflowId\` varchar(36) NOT NULL,
                \`nodeId\` varchar(255) NOT NULL DEFAULT '',
                \`definitionId\` varchar(36),
                \`definitionKey\` varchar(255) NOT NULL,
                \`kindKey\` varchar(64) NOT NULL,
                \`verdict\` varchar(32) NOT NULL,
                \`score\` double,
                \`reason\` text,
                \`evidence\` text,
                \`latencyMs\` int NOT NULL,
                \`observeMode\` tinyint NOT NULL,
                \`createdDate\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                PRIMARY KEY (\`id\`),
                KEY \`idx_guardrail_verdict_workspace_chatflow_date\` (\`workspaceId\`, \`chatflowId\`, \`createdDate\`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`
        )
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE IF EXISTS \`guardrail_verdict\`;`)
    }
}
