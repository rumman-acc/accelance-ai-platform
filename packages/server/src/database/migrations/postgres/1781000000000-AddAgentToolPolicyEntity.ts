import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddAgentToolPolicyEntity1781000000000 implements MigrationInterface {
    name = 'AddAgentToolPolicyEntity1781000000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `CREATE TABLE IF NOT EXISTS "agent_tool_policy" (
                "id" uuid NOT NULL DEFAULT gen_random_uuid(),
                "workspaceId" text NOT NULL,
                "chatflowId" text NOT NULL DEFAULT '',
                "toolNodeName" text NOT NULL,
                "effect" text NOT NULL DEFAULT 'allow',
                "createdBy" text,
                "createdDate" timestamp NOT NULL DEFAULT now(),
                "updatedDate" timestamp NOT NULL DEFAULT now(),
                CONSTRAINT "PK_agent_tool_policy_id" PRIMARY KEY ("id")
            );`
        )
        await queryRunner.query(
            `CREATE UNIQUE INDEX IF NOT EXISTS "idx_agent_tool_policy_scope" ON "agent_tool_policy"("workspaceId", "chatflowId", "toolNodeName");`
        )
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE IF EXISTS "agent_tool_policy";`)
    }
}
