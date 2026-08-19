"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddAgentToolPolicyEntity1781000000000 = void 0;
class AddAgentToolPolicyEntity1781000000000 {
    constructor() {
        this.name = 'AddAgentToolPolicyEntity1781000000000';
    }
    async up(queryRunner) {
        await queryRunner.query(`CREATE TABLE IF NOT EXISTS "agent_tool_policy" (
                "id" uuid NOT NULL DEFAULT gen_random_uuid(),
                "workspaceId" text NOT NULL,
                "chatflowId" text NOT NULL DEFAULT '',
                "toolNodeName" text NOT NULL,
                "effect" text NOT NULL DEFAULT 'allow',
                "createdBy" text,
                "createdDate" timestamp NOT NULL DEFAULT now(),
                "updatedDate" timestamp NOT NULL DEFAULT now(),
                CONSTRAINT "PK_agent_tool_policy_id" PRIMARY KEY ("id")
            );`);
        await queryRunner.query(`CREATE UNIQUE INDEX IF NOT EXISTS "idx_agent_tool_policy_scope" ON "agent_tool_policy"("workspaceId", "chatflowId", "toolNodeName");`);
    }
    async down(queryRunner) {
        await queryRunner.query(`DROP TABLE IF EXISTS "agent_tool_policy";`);
    }
}
exports.AddAgentToolPolicyEntity1781000000000 = AddAgentToolPolicyEntity1781000000000;
//# sourceMappingURL=1781000000000-AddAgentToolPolicyEntity.js.map