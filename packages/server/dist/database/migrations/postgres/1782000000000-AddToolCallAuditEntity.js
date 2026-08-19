"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddToolCallAuditEntity1782000000000 = void 0;
class AddToolCallAuditEntity1782000000000 {
    constructor() {
        this.name = 'AddToolCallAuditEntity1782000000000';
    }
    async up(queryRunner) {
        await queryRunner.query(`CREATE TABLE IF NOT EXISTS "tool_call_audit" (
                "id" uuid NOT NULL DEFAULT gen_random_uuid(),
                "workspaceId" text NOT NULL,
                "chatflowId" text NOT NULL,
                "userId" text,
                "toolNodeName" text NOT NULL,
                "credentialId" text,
                "decision" text NOT NULL,
                "reason" text,
                "createdDate" timestamp NOT NULL DEFAULT now(),
                CONSTRAINT "PK_tool_call_audit_id" PRIMARY KEY ("id")
            );`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_tool_call_audit_workspace_chatflow" ON "tool_call_audit"("workspaceId", "chatflowId");`);
    }
    async down(queryRunner) {
        await queryRunner.query(`DROP TABLE IF EXISTS "tool_call_audit";`);
    }
}
exports.AddToolCallAuditEntity1782000000000 = AddToolCallAuditEntity1782000000000;
//# sourceMappingURL=1782000000000-AddToolCallAuditEntity.js.map