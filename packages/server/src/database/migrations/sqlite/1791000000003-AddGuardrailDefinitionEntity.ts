import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddGuardrailDefinitionEntity1791000000003 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `CREATE TABLE IF NOT EXISTS "guardrail_definition" (
                "id" varchar PRIMARY KEY NOT NULL,
                "key" varchar NOT NULL,
                "name" text NOT NULL,
                "description" text NOT NULL,
                "icon" text,
                "origin" varchar NOT NULL DEFAULT ('system'),
                "category" varchar NOT NULL DEFAULT ('safety'),
                "kindKey" varchar NOT NULL,
                "placement" varchar NOT NULL DEFAULT ('attached'),
                "allowedHosts" text,
                "hooks" text,
                "paramSchema" text NOT NULL,
                "defaultParams" text NOT NULL,
                "defaultOnFailAction" varchar NOT NULL DEFAULT ('flag'),
                "defaultFailMode" varchar NOT NULL DEFAULT ('open'),
                "defaultTimeoutMs" integer NOT NULL DEFAULT (5000),
                "defaultObserveMode" boolean NOT NULL DEFAULT (1),
                "frameworkRefs" text,
                "version" integer NOT NULL DEFAULT (1),
                "supersededByDefinitionId" varchar,
                "workspaceId" varchar,
                "createdBy" varchar,
                "deletedAt" datetime,
                "createdDate" datetime NOT NULL DEFAULT (datetime('now')),
                "updatedDate" datetime NOT NULL DEFAULT (datetime('now'))
            );`
        )
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_guardrail_definition_key" ON "guardrail_definition"("key");`)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE IF EXISTS "guardrail_definition";`)
    }
}
