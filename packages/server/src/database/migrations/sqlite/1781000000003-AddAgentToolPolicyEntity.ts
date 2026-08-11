import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddAgentToolPolicyEntity1781000000003 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `CREATE TABLE IF NOT EXISTS "agent_tool_policy" (
                "id" varchar PRIMARY KEY NOT NULL,
                "workspaceId" varchar NOT NULL,
                "chatflowId" varchar NOT NULL DEFAULT (''),
                "toolNodeName" varchar NOT NULL,
                "effect" varchar NOT NULL DEFAULT ('allow'),
                "createdBy" varchar,
                "createdDate" datetime NOT NULL DEFAULT (datetime('now')),
                "updatedDate" datetime NOT NULL DEFAULT (datetime('now')),
                CONSTRAINT "idx_agent_tool_policy_scope" UNIQUE ("workspaceId", "chatflowId", "toolNodeName")
            );`
        )
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE IF EXISTS "agent_tool_policy";`)
    }
}
