import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddGuardrailPolicyEntity1784000000000 implements MigrationInterface {
    name = 'AddGuardrailPolicyEntity1784000000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `CREATE TABLE IF NOT EXISTS "guardrail_policy" (
                "id" uuid NOT NULL DEFAULT gen_random_uuid(),
                "workspaceId" text NOT NULL,
                "chatflowId" text NOT NULL DEFAULT '',
                "catalogKey" text NOT NULL,
                "enabled" boolean NOT NULL DEFAULT false,
                "config" text,
                "createdBy" text,
                "createdDate" timestamp NOT NULL DEFAULT now(),
                "updatedDate" timestamp NOT NULL DEFAULT now(),
                CONSTRAINT "PK_guardrail_policy_id" PRIMARY KEY ("id")
            );`
        )
        await queryRunner.query(
            `CREATE UNIQUE INDEX IF NOT EXISTS "idx_guardrail_policy_scope" ON "guardrail_policy"("workspaceId", "chatflowId", "catalogKey");`
        )
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE IF EXISTS "guardrail_policy";`)
    }
}
