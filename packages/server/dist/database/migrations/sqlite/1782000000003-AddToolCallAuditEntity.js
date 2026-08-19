"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddToolCallAuditEntity1782000000003 = void 0;
class AddToolCallAuditEntity1782000000003 {
    async up(queryRunner) {
        await queryRunner.query(`CREATE TABLE IF NOT EXISTS "tool_call_audit" (
                "id" varchar PRIMARY KEY NOT NULL,
                "workspaceId" varchar NOT NULL,
                "chatflowId" varchar NOT NULL,
                "userId" varchar,
                "toolNodeName" varchar NOT NULL,
                "credentialId" varchar,
                "decision" varchar NOT NULL,
                "reason" text,
                "createdDate" datetime NOT NULL DEFAULT (datetime('now'))
            );`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_tool_call_audit_workspace_chatflow" ON "tool_call_audit"("workspaceId", "chatflowId");`);
    }
    async down(queryRunner) {
        await queryRunner.query(`DROP TABLE IF EXISTS "tool_call_audit";`);
    }
}
exports.AddToolCallAuditEntity1782000000003 = AddToolCallAuditEntity1782000000003;
//# sourceMappingURL=1782000000003-AddToolCallAuditEntity.js.map