"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddAuditLogEntity1787000000000 = void 0;
class AddAuditLogEntity1787000000000 {
    constructor() {
        this.name = 'AddAuditLogEntity1787000000000';
    }
    async up(queryRunner) {
        await queryRunner.query(`CREATE TABLE IF NOT EXISTS "audit_log" (
                "id" uuid NOT NULL DEFAULT gen_random_uuid(),
                "workspaceId" text NOT NULL,
                "userId" text,
                "action" text NOT NULL,
                "targetType" text NOT NULL,
                "targetId" text,
                "metadata" text,
                "createdDate" timestamp NOT NULL DEFAULT now(),
                CONSTRAINT "PK_audit_log_id" PRIMARY KEY ("id")
            );`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_audit_log_workspace_date" ON "audit_log"("workspaceId", "createdDate");`);
    }
    async down(queryRunner) {
        await queryRunner.query(`DROP TABLE IF EXISTS "audit_log";`);
    }
}
exports.AddAuditLogEntity1787000000000 = AddAuditLogEntity1787000000000;
//# sourceMappingURL=1787000000000-AddAuditLogEntity.js.map