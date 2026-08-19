import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddGuardrailFlowAttachmentEntity1792000000000 implements MigrationInterface {
    name = 'AddGuardrailFlowAttachmentEntity1792000000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `CREATE TABLE IF NOT EXISTS "guardrail_flow_attachment" (
                "id" uuid NOT NULL DEFAULT gen_random_uuid(),
                "workspaceId" text NOT NULL,
                "chatflowId" text NOT NULL,
                "definitionId" text NOT NULL,
                "definitionKey" text NOT NULL,
                "kindKey" text NOT NULL,
                "paramsSnapshot" text NOT NULL,
                "onFailAction" text NOT NULL,
                "failMode" text NOT NULL,
                "timeoutMs" integer NOT NULL,
                "observeMode" boolean NOT NULL DEFAULT true,
                "createdBy" text,
                "createdDate" timestamp NOT NULL DEFAULT now(),
                "updatedDate" timestamp NOT NULL DEFAULT now(),
                CONSTRAINT "PK_guardrail_flow_attachment_id" PRIMARY KEY ("id")
            );`
        )
        await queryRunner.query(
            `CREATE UNIQUE INDEX IF NOT EXISTS "idx_guardrail_flow_attachment_scope" ON "guardrail_flow_attachment"("chatflowId", "definitionKey");`
        )
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE IF EXISTS "guardrail_flow_attachment";`)
    }
}
