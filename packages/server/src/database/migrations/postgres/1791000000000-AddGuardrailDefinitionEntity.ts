import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddGuardrailDefinitionEntity1791000000000 implements MigrationInterface {
    name = 'AddGuardrailDefinitionEntity1791000000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `CREATE TABLE IF NOT EXISTS "guardrail_definition" (
                "id" uuid NOT NULL DEFAULT gen_random_uuid(),
                "key" text NOT NULL,
                "name" text NOT NULL,
                "description" text NOT NULL,
                "icon" text,
                "origin" text NOT NULL DEFAULT 'system',
                "category" text NOT NULL DEFAULT 'safety',
                "kindKey" text NOT NULL,
                "placement" text NOT NULL DEFAULT 'attached',
                "allowedHosts" text,
                "hooks" text,
                "paramSchema" text NOT NULL DEFAULT '{}',
                "defaultParams" text NOT NULL DEFAULT '{}',
                "defaultOnFailAction" text NOT NULL DEFAULT 'flag',
                "defaultFailMode" text NOT NULL DEFAULT 'open',
                "defaultTimeoutMs" integer NOT NULL DEFAULT 5000,
                "defaultObserveMode" boolean NOT NULL DEFAULT true,
                "frameworkRefs" text,
                "version" integer NOT NULL DEFAULT 1,
                "supersededByDefinitionId" text,
                "workspaceId" text,
                "createdBy" text,
                "deletedAt" timestamp,
                "createdDate" timestamp NOT NULL DEFAULT now(),
                "updatedDate" timestamp NOT NULL DEFAULT now(),
                CONSTRAINT "PK_guardrail_definition_id" PRIMARY KEY ("id")
            );`
        )
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_guardrail_definition_key" ON "guardrail_definition"("key");`)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE IF EXISTS "guardrail_definition";`)
    }
}
