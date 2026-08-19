import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddGuardrailVerdictEntity1793000000003 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `CREATE TABLE IF NOT EXISTS "guardrail_verdict" (
                "id" varchar PRIMARY KEY NOT NULL,
                "workspaceId" varchar NOT NULL,
                "chatflowId" varchar NOT NULL,
                "nodeId" varchar NOT NULL DEFAULT (''),
                "definitionId" varchar,
                "definitionKey" varchar NOT NULL,
                "kindKey" varchar NOT NULL,
                "verdict" varchar NOT NULL,
                "score" float,
                "reason" text,
                "evidence" text,
                "latencyMs" integer NOT NULL,
                "observeMode" boolean NOT NULL,
                "createdDate" datetime NOT NULL DEFAULT (datetime('now'))
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
