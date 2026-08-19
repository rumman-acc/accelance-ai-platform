import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddGuardrailDefinitionEntity1791000000001 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `CREATE TABLE IF NOT EXISTS \`guardrail_definition\` (
                \`id\` varchar(36) NOT NULL,
                \`key\` varchar(255) NOT NULL,
                \`name\` text NOT NULL,
                \`description\` text NOT NULL,
                \`icon\` text,
                \`origin\` varchar(32) NOT NULL DEFAULT 'system',
                \`category\` varchar(32) NOT NULL DEFAULT 'safety',
                \`kindKey\` varchar(64) NOT NULL,
                \`placement\` varchar(32) NOT NULL DEFAULT 'attached',
                \`allowedHosts\` text,
                \`hooks\` text,
                \`paramSchema\` text NOT NULL,
                \`defaultParams\` text NOT NULL,
                \`defaultOnFailAction\` varchar(32) NOT NULL DEFAULT 'flag',
                \`defaultFailMode\` varchar(16) NOT NULL DEFAULT 'open',
                \`defaultTimeoutMs\` int NOT NULL DEFAULT 5000,
                \`defaultObserveMode\` tinyint NOT NULL DEFAULT 1,
                \`frameworkRefs\` text,
                \`version\` int NOT NULL DEFAULT 1,
                \`supersededByDefinitionId\` varchar(36),
                \`workspaceId\` varchar(36),
                \`createdBy\` varchar(36),
                \`deletedAt\` datetime(6),
                \`createdDate\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                \`updatedDate\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
                PRIMARY KEY (\`id\`),
                KEY \`idx_guardrail_definition_key\` (\`key\`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;`
        )
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE IF EXISTS \`guardrail_definition\`;`)
    }
}
