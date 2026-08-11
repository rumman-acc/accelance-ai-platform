import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddToolCallAuditEntity1782000000003 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `CREATE TABLE IF NOT EXISTS "tool_call_audit" (
                "id" varchar PRIMARY KEY NOT NULL,
                "workspaceId" varchar NOT NULL,
                "chatflowId" varchar NOT NULL,
                "userId" varchar,
                "toolNodeName" varchar NOT NULL,
                "credentialId" varchar,
                "decision" varchar NOT NULL,
                "reason" text,
                "createdDate" datetime NOT NULL DEFAULT (datetime('now'))
            );`
        )
        await queryRunner.query(
            `CREATE INDEX IF NOT EXISTS "idx_tool_call_audit_workspace_chatflow" ON "tool_call_audit"("workspaceId", "chatflowId");`
        )
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE IF EXISTS "tool_call_audit";`)
    }
}
