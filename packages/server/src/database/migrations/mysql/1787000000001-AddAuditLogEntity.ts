import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddAuditLogEntity1787000000001 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `CREATE TABLE IF NOT EXISTS \`audit_log\` (
                \`id\` varchar(36) NOT NULL,
                \`workspaceId\` varchar(36) NOT NULL,
                \`userId\` varchar(36),
                \`action\` varchar(255) NOT NULL,
                \`targetType\` varchar(255) NOT NULL,
                \`targetId\` varchar(255),
                \`metadata\` text,
                \`createdDate\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                PRIMARY KEY (\`id\`),
                KEY \`idx_audit_log_workspace_date\` (\`workspaceId\`, \`createdDate\`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;`
        )
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE IF EXISTS \`audit_log\`;`)
    }
}
