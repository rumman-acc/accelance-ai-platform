"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddAuditLogEntity1787000000001 = void 0;
class AddAuditLogEntity1787000000001 {
    async up(queryRunner) {
        await queryRunner.query(`CREATE TABLE IF NOT EXISTS \`audit_log\` (
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
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;`);
    }
    async down(queryRunner) {
        await queryRunner.query(`DROP TABLE IF EXISTS \`audit_log\`;`);
    }
}
exports.AddAuditLogEntity1787000000001 = AddAuditLogEntity1787000000001;
//# sourceMappingURL=1787000000001-AddAuditLogEntity.js.map