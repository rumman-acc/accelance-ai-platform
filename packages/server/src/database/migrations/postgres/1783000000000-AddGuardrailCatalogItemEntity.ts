import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddGuardrailCatalogItemEntity1783000000000 implements MigrationInterface {
    name = 'AddGuardrailCatalogItemEntity1783000000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `CREATE TABLE IF NOT EXISTS "guardrail_catalog_item" (
                "id" uuid NOT NULL DEFAULT gen_random_uuid(),
                "key" text NOT NULL,
                "name" text NOT NULL,
                "description" text NOT NULL,
                "kind" text NOT NULL DEFAULT 'policy',
                "category" text NOT NULL DEFAULT 'guardrail',
                "nodeNames" text,
                "enforcementStatus" text NOT NULL DEFAULT 'planned',
                "configSchema" text,
                "defaultConfig" text,
                "isStandard" boolean NOT NULL DEFAULT true,
                "workspaceId" text,
                "createdBy" text,
                "createdDate" timestamp NOT NULL DEFAULT now(),
                "updatedDate" timestamp NOT NULL DEFAULT now(),
                CONSTRAINT "PK_guardrail_catalog_item_id" PRIMARY KEY ("id")
            );`
        )
        await queryRunner.query(`CREATE UNIQUE INDEX IF NOT EXISTS "idx_guardrail_catalog_item_key" ON "guardrail_catalog_item"("key");`)

        await queryRunner.query(
            `INSERT INTO "guardrail_catalog_item" ("id","key","name","description","kind","category","nodeNames","enforcementStatus","configSchema","defaultConfig","isStandard")
             VALUES
             ('a1b2c3d4-0001-4000-8000-000000000001','content_moderation','Content Moderation','Blocks or flags toxic/policy-violating content using OpenAI Moderation or a deny-list, applied at a specific point in the flow.','node','guardrail','["openAIModeration","simplePromptModeration"]','enforced',NULL,NULL,true),
             ('a1b2c3d4-0001-4000-8000-000000000002','tool_allowlist','Tool Allowlist','Least-privilege allow/deny list controlling which tools an agent may invoke, enforced on every tool call regardless of canvas position. Managed via the existing Tool Access Policy, shown here read-only.','policy','guardrail',NULL,'enforced',NULL,NULL,true),
             ('a1b2c3d4-0001-4000-8000-000000000003','pii_redaction','PII Detection & Redaction','Scans content before it is logged or stored and masks emails, phone numbers, and card/SSN-style numbers using pattern matching.','policy','guardrail',NULL,'enforced','{"patterns":{"type":"array","items":"string","description":"Additional regex patterns to redact, beyond the built-in email/phone/SSN/card presets"}}','{"patterns":[]}',true),
             ('a1b2c3d4-0001-4000-8000-000000000004','prompt_injection_defense','Prompt-Injection Defense','Separates trusted instructions from untrusted content an agent merely reads, so content the agent processes cannot inject new instructions. Not yet enforced by the runtime -- listed for visibility.','policy','guardrail',NULL,'planned',NULL,NULL,true),
             ('a1b2c3d4-0001-4000-8000-000000000005','topic_action_scoping','Topic & Action Scoping','Bounds what an agent may discuss or do, beyond the tool-level allowlist. Not yet enforced by the runtime -- listed for visibility.','policy','guardrail',NULL,'planned',NULL,NULL,true)
             ON CONFLICT ("key") DO NOTHING;`
        )
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE IF EXISTS "guardrail_catalog_item";`)
    }
}
