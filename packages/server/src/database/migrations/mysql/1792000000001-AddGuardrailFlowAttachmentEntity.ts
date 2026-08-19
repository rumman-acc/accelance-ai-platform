import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddGuardrailFlowAttachmentEntity1792000000001 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `CREATE TABLE IF NOT EXISTS \`guardrail_flow_attachment\` (
                \`id\` varchar(36) NOT NULL,
                \`workspaceId\` varchar(36) NOT NULL,
                \`chatflowId\` varchar(36) NOT NULL,
                \`definitionId\` varchar(36) NOT NULL,
                \`definitionKey\` varchar(255) NOT NULL,
                \`kindKey\` varchar(64) NOT NULL,
                \`paramsSnapshot\` text NOT NULL,
                \`onFailAction\` varchar(32) NOT NULL,
                \`failMode\` varchar(16) NOT NULL,
                \`timeoutMs\` int NOT NULL,
                \`observeMode\` tinyint NOT NULL DEFAULT 1,
                \`createdBy\` varchar(36),
                \`createdDate\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                \`updatedDate\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
                PRIMARY KEY (\`id\`),
                UNIQUE KEY \`idx_guardrail_flow_attachment_scope\` (\`chatflowId\`, \`definitionKey\`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;`
        )
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE IF EXISTS \`guardrail_flow_attachment\`;`)
    }
}
