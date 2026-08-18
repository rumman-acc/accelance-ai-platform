import { MigrationInterface, QueryRunner } from 'typeorm'

export class GuardrailCatalogBatch3Enforcement1786000000002 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `UPDATE \`guardrail_catalog_item\` SET \`enforcementStatus\` = 'enforced', \`defaultConfig\` = '{"deniedTopics":["self-harm","suicide","illegal drugs","weapons manufacturing","child exploitation"],"refusalMessage":"I can''t help with that topic."}' WHERE \`key\` = 'topic_action_scoping';`
        )
        await queryRunner.query(
            `UPDATE \`guardrail_catalog_item\` SET \`enforcementStatus\` = 'enforced', \`defaultConfig\` = '{}' WHERE \`key\` = 'prompt_injection_defense';`
        )
        await queryRunner.query(
            `UPDATE \`guardrail_catalog_item\` SET \`enforcementStatus\` = 'enforced', \`defaultConfig\` = '{"maxSteps":25}' WHERE \`key\` = 'loop_recursion_detection';`
        )
        await queryRunner.query(
            `UPDATE \`guardrail_catalog_item\` SET \`enforcementStatus\` = 'enforced', \`defaultConfig\` = '{"blockedDomainPatterns":["localhost","127.0.0.1","169.254.169.254","0.0.0.0","::1"]}' WHERE \`key\` = 'egress_filtering';`
        )
        await queryRunner.query(
            `UPDATE \`guardrail_catalog_item\` SET \`enforcementStatus\` = 'enforced', \`defaultConfig\` = '{}' WHERE \`key\` = 'confused_deputy_prevention';`
        )
        await queryRunner.query(
            `UPDATE \`guardrail_catalog_item\` SET \`enforcementStatus\` = 'enforced', \`defaultConfig\` = '{"patterns":[]}' WHERE \`key\` = 'memory_rag_write_validation';`
        )
        await queryRunner.query(
            `UPDATE \`guardrail_catalog_item\` SET \`enforcementStatus\` = 'enforced', \`defaultConfig\` = '{"maxPredictionsPerMonth":10000}', \`description\` = 'Per-workspace prediction-count cap per calendar month, as a proxy for spend/token budget until real cost-per-call metering (Langfuse) is wired in. Not a $ or token-based cap yet.' WHERE \`key\` = 'spend_token_budgets';`
        )

        await queryRunner.query(
            `INSERT IGNORE INTO \`guardrail_catalog_item\` (\`id\`,\`key\`,\`name\`,\`description\`,\`kind\`,\`category\`,\`nodeNames\`,\`enforcementStatus\`,\`configSchema\`,\`defaultConfig\`,\`isStandard\`)
             VALUES
             ('a1b2c3d4-0003-4000-8000-000000000001','audit_log','Audit Log','Append-only record of who did what, when, and to what. Covers guardrail/tool-policy changes and chatflow deletion in this first pass -- not literally every action yet.','policy','compliance',NULL,'enforced','{}','{}',1),
             ('a1b2c3d4-0003-4000-8000-000000000002','data_retention_policy','Data Retention Policy','Deletes chat messages, executions, and tool-call audit rows older than the configured window via a daily cleanup job.','policy','compliance',NULL,'enforced','{"chatMessageRetentionDays":"number","executionRetentionDays":"number","toolCallAuditRetentionDays":"number"}','{"chatMessageRetentionDays":90,"executionRetentionDays":90,"toolCallAuditRetentionDays":90}',1),
             ('a1b2c3d4-0003-4000-8000-000000000003','policy_templates','Policy Templates','Applies a default guardrail bundle (currently: PII redaction) to every new workspace automatically, and retroactively to this workspace when turned on here.','policy','compliance',NULL,'enforced','{}','{}',1);`
        )
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `DELETE FROM \`guardrail_catalog_item\` WHERE \`key\` IN ('audit_log','data_retention_policy','policy_templates');`
        )
    }
}
