import { MigrationInterface, QueryRunner } from 'typeorm'

/**
 * Seeds one system-origin GuardrailDefinition row per catalog key that still matters under the
 * new model -- see rules/guardrails-v2/phase0-audit.md Finding 4 and
 * rules/guardrails-v2/reconciliation.md for the reasoning behind which keys get which
 * placement, and which are catalog-only (content_moderation, hitl_approval_gates,
 * tool_allowlist, memory_rag_write_validation, audit_log, data_retention_policy -- none of
 * these get a GuardrailFlowAttachment backfill; the four workspace-scoped ones keep reading
 * the OLD guardrail_policy/guardrail_catalog_item tables unchanged). policy_templates is
 * deleted outright (§2.2), not seeded here.
 */
export class SeedGuardrailDefinitions1794000000000 implements MigrationInterface {
    name = 'SeedGuardrailDefinitions1794000000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `INSERT INTO "guardrail_definition"
                ("id","key","name","description","origin","category","kindKey","placement","paramSchema","defaultParams","defaultOnFailAction","defaultFailMode","defaultTimeoutMs")
             VALUES
                ('b2c3d4e5-0001-4000-8000-000000000001','content_moderation','Content Moderation','Blocks or flags toxic/policy-violating content using OpenAI Moderation or a deny-list. Catalog entry only in Phase 1 -- real behavior lives on the SimplePromptModeration/OpenAIModeration node instance itself, independent of this row.','system','safety','keyword_list','attached','{"denyList":"string[]"}','{"denyList":[]}','block','open',5000),
                ('b2c3d4e5-0001-4000-8000-000000000002','tool_allowlist','Tool Allowlist','Least-privilege allow/deny list controlling which tools an agent may invoke. Catalog entry only -- real enforcement stays on AgentToolPolicy, unchanged by this migration.','system','security','tool_allowlist','attached','{}','{}','block','closed',5000),
                ('b2c3d4e5-0001-4000-8000-000000000003','pii_redaction','PII Detection & Redaction','Scans content before it is logged or stored and masks emails, phone numbers, and card/SSN-style numbers using pattern matching.','system','privacy','pii_regex','flow','{"patterns":"string[]"}','{"patterns":[]}','redact','closed',5000),
                ('b2c3d4e5-0001-4000-8000-000000000004','prompt_injection_defense','Prompt-Injection Defense','Separates trusted instructions from untrusted content an agent merely reads, so content the agent processes cannot inject new instructions.','system','security','regex_match','attached','{"pattern":"string","action":"string"}','{"pattern":".*","action":"redact"}','redact','closed',5000),
                ('b2c3d4e5-0001-4000-8000-000000000005','topic_action_scoping','Topic & Action Scoping','Bounds what an agent may discuss or do, beyond the tool-level allowlist.','system','safety','keyword_list','flow','{"deniedTopics":"string[]"}','{"deniedTopics":["self-harm","suicide","illegal drugs","weapons","child exploitation"]}','block','open',5000),
                ('b2c3d4e5-0001-4000-8000-000000000006','spend_token_budgets','Spend & Token Budgets','Per-workspace prediction-count cap per calendar month, as a proxy for spend/token budget until real cost-per-call metering is wired in.','system','quality','rate_limit','flow','{"metric":"string","max":"number"}','{"metric":"predictions","max":10000}','block','open',5000),
                ('b2c3d4e5-0001-4000-8000-000000000007','hitl_approval_gates','Human-in-the-Loop Approval Gates','Pauses execution before a risky step for a human proceed/reject decision, via the Human Input node. Catalog entry only -- no GuardrailPolicy dependency exists to preserve.','system','safety','hitl_gate','attached','{"message":"string"}','{}','require_approval','open',5000),
                ('b2c3d4e5-0001-4000-8000-000000000008','loop_recursion_detection','Loop & Recursion Detection','Detects runaway loops or excessive delegation depth in multi-agent/supervisor flows and halts execution before it consumes unbounded time or spend.','system','safety','rate_limit','flow','{"metric":"string","max":"number"}','{"metric":"steps","max":25}','block','open',5000),
                ('b2c3d4e5-0001-4000-8000-000000000009','egress_filtering','Egress Filtering','Blocks or flags outbound data (tool calls, HTTP requests) that could exfiltrate sensitive content -- the main defense against prompt-injection-driven data exfiltration.','system','security','regex_match','attached','{"blockedDomainPatterns":"string[]"}','{"blockedDomainPatterns":["127.0.0.1","localhost","169.254.169.254","metadata.google.internal"]}','block','closed',5000),
                ('b2c3d4e5-0001-4000-8000-000000000010','confused_deputy_prevention','Confused-Deputy Prevention','Ensures an agent cannot use its own elevated privileges on behalf of a less-privileged user or caller.','system','security','enum_constraint','attached','{}','{}','block','closed',5000),
                ('b2c3d4e5-0001-4000-8000-000000000011','memory_rag_write_validation','Memory & RAG Write Validation','Validates content before it is written into an agent''s memory or a document store, so poisoned input cannot persist across sessions/runs. Catalog entry only -- real enforcement is workspace-scoped (no chatflow to attach to), stays on the old guardrail_policy path.','system','privacy','json_schema','flow','{"patterns":"string[]"}','{"patterns":[]}','redact','closed',5000),
                ('b2c3d4e5-0001-4000-8000-000000000012','audit_log','Audit Log','Append-only record of who did what, when, and to what. Catalog entry only -- real enforcement is workspace-scoped, stays on the old guardrail_policy path.','system','compliance','json_schema','flow','{}','{}','flag','open',5000),
                ('b2c3d4e5-0001-4000-8000-000000000013','data_retention_policy','Data Retention Policy','Deletes chat messages, executions, and tool-call audit rows older than the configured window via a daily cleanup job. Catalog entry only -- real enforcement is workspace-scoped, stays on the old guardrail_policy path.','system','compliance','rate_limit','flow','{"chatMessageRetentionDays":"number","executionRetentionDays":"number","toolCallAuditRetentionDays":"number"}','{"chatMessageRetentionDays":90,"executionRetentionDays":90,"toolCallAuditRetentionDays":90}','flag','open',5000);`
        )
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `DELETE FROM "guardrail_definition" WHERE "key" IN ('content_moderation','tool_allowlist','pii_redaction','prompt_injection_defense','topic_action_scoping','spend_token_budgets','hitl_approval_gates','loop_recursion_detection','egress_filtering','confused_deputy_prevention','memory_rag_write_validation','audit_log','data_retention_policy');`
        )
    }
}
