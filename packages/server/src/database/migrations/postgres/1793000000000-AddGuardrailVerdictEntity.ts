import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddGuardrailVerdictEntity1793000000000 implements MigrationInterface {
    name = 'AddGuardrailVerdictEntity1793000000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `CREATE TABLE IF NOT EXISTS "guardrail_verdict" (
                "id" uuid NOT NULL DEFAULT gen_random_uuid(),
                "workspaceId" text NOT NULL,
                "chatflowId" text NOT NULL,
                "nodeId" text NOT NULL DEFAULT '',
                "definitionId" text,
                "definitionKey" text NOT NULL,
                "kindKey" text NOT NULL,
                "verdict" text NOT NULL,
                "score" double precision,
                "reason" text,
                "evidence" text,
                "latencyMs" integer NOT NULL,
                "observeMode" boolean NOT NULL,
                "createdDate" timestamp NOT NULL DEFAULT now(),
                CONSTRAINT "PK_guardrail_verdict_id" PRIMARY KEY ("id")
            );`
        )
        await queryRunner.query(
            `CREATE INDEX IF NOT EXISTS "idx_guardrail_verdict_workspace_chatflow_date" ON "guardrail_verdict"("workspaceId", "chatflowId", "createdDate");`
        )
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE IF EXISTS "guardrail_verdict";`)
    }
}
