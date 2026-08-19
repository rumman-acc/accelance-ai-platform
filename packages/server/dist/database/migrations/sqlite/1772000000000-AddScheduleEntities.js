"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddScheduleEntities1772000000000 = void 0;
class AddScheduleEntities1772000000000 {
    async up(queryRunner) {
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "schedule_record" (
                "id" varchar PRIMARY KEY NOT NULL,
                "triggerType" varchar(32) NOT NULL,
                "targetId" varchar NOT NULL,
                "nodeId" text,
                "cronExpression" text NOT NULL,
                "timezone" varchar(64) NOT NULL DEFAULT 'UTC',
                "enabled" boolean NOT NULL DEFAULT 1,
                "scheduleInputMode" varchar(16) NOT NULL,
                "defaultInput" text,
                "defaultForm" text,
                "lastRunAt" datetime,
                "nextRunAt" datetime,
                "endDate" datetime,
                "workspaceId" varchar NOT NULL,
                "createdDate" datetime NOT NULL DEFAULT (datetime('now')),
                "updatedDate" datetime NOT NULL DEFAULT (datetime('now'))
            );
        `);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_schedule_record_targetId" ON "schedule_record" ("targetId");`);
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "schedule_trigger_log" (
                "id" varchar PRIMARY KEY NOT NULL,
                "scheduleRecordId" varchar NOT NULL,
                "triggerType" varchar(32) NOT NULL,
                "targetId" varchar NOT NULL,
                "executionId" varchar,
                "status" varchar(32) NOT NULL,
                "error" text,
                "elapsedTimeMs" integer,
                "scheduledAt" datetime NOT NULL,
                "workspaceId" varchar NOT NULL,
                "createdDate" datetime NOT NULL DEFAULT (datetime('now'))
            );
        `);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_schedule_trigger_log_scheduleRecordId" ON "schedule_trigger_log" ("scheduleRecordId");`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_schedule_trigger_log_targetId" ON "schedule_trigger_log" ("targetId");`);
    }
    async down(queryRunner) {
        await queryRunner.query(`DROP TABLE IF EXISTS "schedule_trigger_log"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "schedule_record"`);
    }
}
exports.AddScheduleEntities1772000000000 = AddScheduleEntities1772000000000;
//# sourceMappingURL=1772000000000-AddScheduleEntities.js.map