"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddAgentToolPolicyEntity1781000000003 = void 0;
class AddAgentToolPolicyEntity1781000000003 {
    async up(queryRunner) {
        await queryRunner.query(`CREATE TABLE IF NOT EXISTS "agent_tool_policy" (
                "id" varchar PRIMARY KEY NOT NULL,
                "workspaceId" varchar NOT NULL,
                "chatflowId" varchar NOT NULL DEFAULT (''),
                "toolNodeName" varchar NOT NULL,
                "effect" varchar NOT NULL DEFAULT ('allow'),
                "createdBy" varchar,
                "createdDate" datetime NOT NULL DEFAULT (datetime('now')),
                "updatedDate" datetime NOT NULL DEFAULT (datetime('now')),
                CONSTRAINT "idx_agent_tool_policy_scope" UNIQUE ("workspaceId", "chatflowId", "toolNodeName")
            );`);
    }
    async down(queryRunner) {
        await queryRunner.query(`DROP TABLE IF EXISTS "agent_tool_policy";`);
    }
}
exports.AddAgentToolPolicyEntity1781000000003 = AddAgentToolPolicyEntity1781000000003;
//# sourceMappingURL=1781000000003-AddAgentToolPolicyEntity.js.map