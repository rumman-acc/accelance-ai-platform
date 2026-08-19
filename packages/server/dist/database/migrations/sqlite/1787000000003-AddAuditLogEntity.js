"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddAuditLogEntity1787000000003 = void 0;
class AddAuditLogEntity1787000000003 {
    async up(queryRunner) {
        await queryRunner.query(`CREATE TABLE IF NOT EXISTS "audit_log" (
                "id" varchar PRIMARY KEY NOT NULL,
                "workspaceId" varchar NOT NULL,
                "userId" varchar,
                "action" varchar NOT NULL,
                "targetType" varchar NOT NULL,
                "targetId" varchar,
                "metadata" text,
                "createdDate" datetime NOT NULL DEFAULT (datetime('now'))
            );`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_audit_log_workspace_date" ON "audit_log"("workspaceId", "createdDate");`);
    }
    async down(queryRunner) {
        await queryRunner.query(`DROP TABLE IF EXISTS "audit_log";`);
    }
}
exports.AddAuditLogEntity1787000000003 = AddAuditLogEntity1787000000003;
//# sourceMappingURL=1787000000003-AddAuditLogEntity.js.map