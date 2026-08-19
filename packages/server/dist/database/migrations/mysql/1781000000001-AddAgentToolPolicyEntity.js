"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddAgentToolPolicyEntity1781000000001 = void 0;
class AddAgentToolPolicyEntity1781000000001 {
    async up(queryRunner) {
        await queryRunner.query(`CREATE TABLE IF NOT EXISTS \`agent_tool_policy\` (
                \`id\` varchar(36) NOT NULL,
                \`workspaceId\` varchar(36) NOT NULL,
                \`chatflowId\` varchar(36) NOT NULL DEFAULT '',
                \`toolNodeName\` varchar(255) NOT NULL,
                \`effect\` varchar(10) NOT NULL DEFAULT 'allow',
                \`createdBy\` varchar(36),
                \`createdDate\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                \`updatedDate\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
                PRIMARY KEY (\`id\`),
                UNIQUE KEY \`idx_agent_tool_policy_scope\` (\`workspaceId\`, \`chatflowId\`, \`toolNodeName\`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;`);
    }
    async down(queryRunner) {
        await queryRunner.query(`DROP TABLE IF EXISTS \`agent_tool_policy\`;`);
    }
}
exports.AddAgentToolPolicyEntity1781000000001 = AddAgentToolPolicyEntity1781000000001;
//# sourceMappingURL=1781000000001-AddAgentToolPolicyEntity.js.map