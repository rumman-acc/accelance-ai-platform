import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddGuardrailCatalogItemEntity1783000000002 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `CREATE TABLE IF NOT EXISTS \`guardrail_catalog_item\` (
                \`id\` varchar(36) NOT NULL,
                \`key\` varchar(255) NOT NULL,
                \`name\` varchar(255) NOT NULL,
                \`description\` text NOT NULL,
                \`kind\` varchar(20) NOT NULL DEFAULT 'policy',
                \`category\` varchar(20) NOT NULL DEFAULT 'guardrail',
                \`nodeNames\` text,
                \`enforcementStatus\` varchar(20) NOT NULL DEFAULT 'planned',
                \`configSchema\` text,
                \`defaultConfig\` text,
                \`isStandard\` tinyint NOT NULL DEFAULT 1,
                \`workspaceId\` varchar(36),
                \`createdBy\` varchar(36),
                \`createdDate\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                \`updatedDate\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
                PRIMARY KEY (\`id\`),
                UNIQUE KEY \`idx_guardrail_catalog_item_key\` (\`key\`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`
        )

        await queryRunner.query(
            `INSERT IGNORE INTO \`guardrail_catalog_item\` (\`id\`,\`key\`,\`name\`,\`description\`,\`kind\`,\`category\`,\`nodeNames\`,\`enforcementStatus\`,\`configSchema\`,\`defaultConfig\`,\`isStandard\`)
             VALUES
             ('a1b2c3d4-0001-4000-8000-000000000001','content_moderation','Content Moderation','Blocks or flags toxic/policy-violating content using OpenAI Moderation or a deny-list, applied at a specific point in the flow.','node','guardrail','["openAIModeration","simplePromptModeration"]','enforced',NULL,NULL,1),
             ('a1b2c3d4-0001-4000-8000-000000000002','tool_allowlist','Tool Allowlist','Least-privilege allow/deny list controlling which tools an agent may invoke, enforced on every tool call regardless of canvas position. Managed via the existing Tool Access Policy, shown here read-only.','policy','guardrail',NULL,'enforced',NULL,NULL,1),
             ('a1b2c3d4-0001-4000-8000-000000000003','pii_redaction','PII Detection & Redaction','Scans content before it is logged or stored and masks emails, phone numbers, and card/SSN-style numbers using pattern matching.','policy','guardrail',NULL,'enforced','{"patterns":{"type":"array","items":"string","description":"Additional regex patterns to redact, beyond the built-in email/phone/SSN/card presets"}}','{"patterns":[]}',1),
             ('a1b2c3d4-0001-4000-8000-000000000004','prompt_injection_defense','Prompt-Injection Defense','Separates trusted instructions from untrusted content an agent merely reads, so content the agent processes cannot inject new instructions. Not yet enforced by the runtime -- listed for visibility.','policy','guardrail',NULL,'planned',NULL,NULL,1),
             ('a1b2c3d4-0001-4000-8000-000000000005','topic_action_scoping','Topic & Action Scoping','Bounds what an agent may discuss or do, beyond the tool-level allowlist. Not yet enforced by the runtime -- listed for visibility.','policy','guardrail',NULL,'planned',NULL,NULL,1);`
        )
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE IF EXISTS \`guardrail_catalog_item\`;`)
    }
}
