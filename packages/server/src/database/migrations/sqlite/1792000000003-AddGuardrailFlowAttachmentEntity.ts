import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddGuardrailFlowAttachmentEntity1792000000003 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `CREATE TABLE IF NOT EXISTS "guardrail_flow_attachment" (
                "id" varchar PRIMARY KEY NOT NULL,
                "workspaceId" varchar NOT NULL,
                "chatflowId" varchar NOT NULL,
                "definitionId" varchar NOT NULL,
                "definitionKey" varchar NOT NULL,
                "kindKey" varchar NOT NULL,
                "paramsSnapshot" text NOT NULL,
                "onFailAction" varchar NOT NULL,
                "failMode" varchar NOT NULL,
                "timeoutMs" integer NOT NULL,
                "observeMode" boolean NOT NULL DEFAULT (1),
                "createdBy" varchar,
                "createdDate" datetime NOT NULL DEFAULT (datetime('now')),
                "updatedDate" datetime NOT NULL DEFAULT (datetime('now')),
                CONSTRAINT "idx_guardrail_flow_attachment_scope" UNIQUE ("chatflowId", "definitionKey")
            );`
        )
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE IF EXISTS "guardrail_flow_attachment";`)
    }
}
