import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddAuditLogEntity1787000000003 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `CREATE TABLE IF NOT EXISTS "audit_log" (
                "id" varchar PRIMARY KEY NOT NULL,
                "workspaceId" varchar NOT NULL,
                "userId" varchar,
                "action" varchar NOT NULL,
                "targetType" varchar NOT NULL,
                "targetId" varchar,
                "metadata" text,
                "createdDate" datetime NOT NULL DEFAULT (datetime('now'))
            );`
        )
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_audit_log_workspace_date" ON "audit_log"("workspaceId", "createdDate");`)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE IF EXISTS "audit_log";`)
    }
}
