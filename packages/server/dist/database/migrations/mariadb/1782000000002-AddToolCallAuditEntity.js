"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddToolCallAuditEntity1782000000002 = void 0;
class AddToolCallAuditEntity1782000000002 {
    async up(queryRunner) {
        await queryRunner.query(`CREATE TABLE IF NOT EXISTS \`tool_call_audit\` (
                \`id\` varchar(36) NOT NULL,
                \`workspaceId\` varchar(36) NOT NULL,
                \`chatflowId\` varchar(36) NOT NULL,
                \`userId\` varchar(36),
                \`toolNodeName\` varchar(255) NOT NULL,
                \`credentialId\` varchar(36),
                \`decision\` varchar(10) NOT NULL,
                \`reason\` text,
                \`createdDate\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                PRIMARY KEY (\`id\`),
                KEY \`idx_tool_call_audit_workspace_chatflow\` (\`workspaceId\`, \`chatflowId\`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`);
    }
    async down(queryRunner) {
        await queryRunner.query(`DROP TABLE IF EXISTS \`tool_call_audit\`;`);
    }
}
exports.AddToolCallAuditEntity1782000000002 = AddToolCallAuditEntity1782000000002;
//# sourceMappingURL=1782000000002-AddToolCallAuditEntity.js.map