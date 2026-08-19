"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddGuardrailPolicyEntity1784000000002 = void 0;
class AddGuardrailPolicyEntity1784000000002 {
    async up(queryRunner) {
        await queryRunner.query(`CREATE TABLE IF NOT EXISTS \`guardrail_policy\` (
                \`id\` varchar(36) NOT NULL,
                \`workspaceId\` varchar(36) NOT NULL,
                \`chatflowId\` varchar(36) NOT NULL DEFAULT '',
                \`catalogKey\` varchar(255) NOT NULL,
                \`enabled\` tinyint NOT NULL DEFAULT 0,
                \`config\` text,
                \`createdBy\` varchar(36),
                \`createdDate\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                \`updatedDate\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
                PRIMARY KEY (\`id\`),
                UNIQUE KEY \`idx_guardrail_policy_scope\` (\`workspaceId\`, \`chatflowId\`, \`catalogKey\`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`);
    }
    async down(queryRunner) {
        await queryRunner.query(`DROP TABLE IF EXISTS \`guardrail_policy\`;`);
    }
}
exports.AddGuardrailPolicyEntity1784000000002 = AddGuardrailPolicyEntity1784000000002;
//# sourceMappingURL=1784000000002-AddGuardrailPolicyEntity.js.map