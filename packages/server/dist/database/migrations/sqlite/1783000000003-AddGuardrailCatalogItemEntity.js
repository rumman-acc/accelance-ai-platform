"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddGuardrailCatalogItemEntity1783000000003 = void 0;
class AddGuardrailCatalogItemEntity1783000000003 {
    async up(queryRunner) {
        await queryRunner.query(`CREATE TABLE IF NOT EXISTS "guardrail_catalog_item" (
                "id" varchar PRIMARY KEY NOT NULL,
                "key" varchar NOT NULL,
                "name" varchar NOT NULL,
                "description" text NOT NULL,
                "kind" varchar NOT NULL DEFAULT ('policy'),
                "category" varchar NOT NULL DEFAULT ('guardrail'),
                "nodeNames" text,
                "enforcementStatus" varchar NOT NULL DEFAULT ('planned'),
                "configSchema" text,
                "defaultConfig" text,
                "isStandard" boolean NOT NULL DEFAULT (1),
                "workspaceId" varchar,
                "createdBy" varchar,
                "createdDate" datetime NOT NULL DEFAULT (datetime('now')),
                "updatedDate" datetime NOT NULL DEFAULT (datetime('now')),
                CONSTRAINT "idx_guardrail_catalog_item_key" UNIQUE ("key")
            );`);
        await queryRunner.query(`INSERT OR IGNORE INTO "guardrail_catalog_item" ("id","key","name","description","kind","category","nodeNames","enforcementStatus","configSchema","defaultConfig","isStandard")
             VALUES
             ('a1b2c3d4-0001-4000-8000-000000000001','content_moderation','Content Moderation','Blocks or flags toxic/policy-violating content using OpenAI Moderation or a deny-list, applied at a specific point in the flow.','node','guardrail','["openAIModeration","simplePromptModeration"]','enforced',NULL,NULL,1),
             ('a1b2c3d4-0001-4000-8000-000000000002','tool_allowlist','Tool Allowlist','Least-privilege allow/deny list controlling which tools an agent may invoke, enforced on every tool call regardless of canvas position. Managed via the existing Tool Access Policy, shown here read-only.','policy','guardrail',NULL,'enforced',NULL,NULL,1),
             ('a1b2c3d4-0001-4000-8000-000000000003','pii_redaction','PII Detection & Redaction','Scans content before it is logged or stored and masks emails, phone numbers, and card/SSN-style numbers using pattern matching.','policy','guardrail',NULL,'enforced','{"patterns":{"type":"array","items":"string","description":"Additional regex patterns to redact, beyond the built-in email/phone/SSN/card presets"}}','{"patterns":[]}',1),
             ('a1b2c3d4-0001-4000-8000-000000000004','prompt_injection_defense','Prompt-Injection Defense','Separates trusted instructions from untrusted content an agent merely reads, so content the agent processes cannot inject new instructions. Not yet enforced by the runtime -- listed for visibility.','policy','guardrail',NULL,'planned',NULL,NULL,1),
             ('a1b2c3d4-0001-4000-8000-000000000005','topic_action_scoping','Topic & Action Scoping','Bounds what an agent may discuss or do, beyond the tool-level allowlist. Not yet enforced by the runtime -- listed for visibility.','policy','guardrail',NULL,'planned',NULL,NULL,1);`);
    }
    async down(queryRunner) {
        await queryRunner.query(`DROP TABLE IF EXISTS "guardrail_catalog_item";`);
    }
}
exports.AddGuardrailCatalogItemEntity1783000000003 = AddGuardrailCatalogItemEntity1783000000003;
//# sourceMappingURL=1783000000003-AddGuardrailCatalogItemEntity.js.map