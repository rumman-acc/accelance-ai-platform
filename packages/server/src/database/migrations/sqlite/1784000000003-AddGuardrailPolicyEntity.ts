import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddGuardrailPolicyEntity1784000000003 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `CREATE TABLE IF NOT EXISTS "guardrail_policy" (
                "id" varchar PRIMARY KEY NOT NULL,
                "workspaceId" varchar NOT NULL,
                "chatflowId" varchar NOT NULL DEFAULT (''),
                "catalogKey" varchar NOT NULL,
                "enabled" boolean NOT NULL DEFAULT (0),
                "config" text,
                "createdBy" varchar,
                "createdDate" datetime NOT NULL DEFAULT (datetime('now')),
                "updatedDate" datetime NOT NULL DEFAULT (datetime('now')),
                CONSTRAINT "idx_guardrail_policy_scope" UNIQUE ("workspaceId", "chatflowId", "catalogKey")
            );`
        )
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE IF EXISTS "guardrail_policy";`)
    }
}
