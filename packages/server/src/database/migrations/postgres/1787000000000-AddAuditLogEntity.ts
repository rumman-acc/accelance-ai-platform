import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddAuditLogEntity1787000000000 implements MigrationInterface {
    name = 'AddAuditLogEntity1787000000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `CREATE TABLE IF NOT EXISTS "audit_log" (
                "id" uuid NOT NULL DEFAULT gen_random_uuid(),
                "workspaceId" text NOT NULL,
                "userId" text,
                "action" text NOT NULL,
                "targetType" text NOT NULL,
                "targetId" text,
                "metadata" text,
                "createdDate" timestamp NOT NULL DEFAULT now(),
                CONSTRAINT "PK_audit_log_id" PRIMARY KEY ("id")
            );`
        )
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_audit_log_workspace_date" ON "audit_log"("workspaceId", "createdDate");`)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE IF EXISTS "audit_log";`)
    }
}
