import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddToolCallAuditEntity1782000000000 implements MigrationInterface {
    name = 'AddToolCallAuditEntity1782000000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `CREATE TABLE IF NOT EXISTS "tool_call_audit" (
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
