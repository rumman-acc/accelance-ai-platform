import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddGuardrailCatalogItemBatch2_1785000000003 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `INSERT OR IGNORE INTO "guardrail_catalog_item" ("id","key","name","description","kind","category","nodeNames","enforcementStatus","configSchema","defaultConfig","isStandard")
             VALUES
             ('a1b2c3d4-0002-4000-8000-000000000001','spend_token_budgets','Spend & Token Budgets','Per-workspace/per-agent token and spend caps with warn/block thresholds. Tracked as its own epic (FinOps §12) -- surfaced here for visibility, not yet built.','policy','guardrail',NULL,'planned',NULL,NULL,1),
             ('a1b2c3d4-0002-4000-8000-000000000002','hitl_approval_gates','Human-in-the-Loop Approval Gates','Pauses execution before a risky step for a human proceed/reject decision, via the Human Input node. Real and working when placed manually, or auto-inserted by the AI flow generator before write-capable tools -- not policy-toggleable, and not enforced on hand-built flows that omit it.','node','guardrail','["humanInputAgentflow"]','enforced',NULL,NULL,1),
             ('a1b2c3d4-0002-4000-8000-000000000003','loop_recursion_detection','Loop & Recursion Detection','Detects runaway loops or excessive delegation depth in multi-agent/supervisor flows and halts execution before it consumes unbounded time or spend. Not yet built.','policy','guardrail',NULL,'planned',NULL,NULL,1),
             ('a1b2c3d4-0002-4000-8000-000000000004','egress_filtering','Egress Filtering','Blocks or flags outbound data (tool calls, HTTP requests) that could exfiltrate sensitive content, the main defense against prompt-injection-driven data exfiltration. Not yet built.','policy','guardrail',NULL,'planned',NULL,NULL,1),
             ('a1b2c3d4-0002-4000-8000-000000000005','confused_deputy_prevention','Confused-Deputy Prevention','Ensures an agent cannot use its own elevated privileges on behalf of a less-privileged user or caller. Not yet built -- related to, but distinct from, the existing per-user credential-access model.','policy','guardrail',NULL,'planned',NULL,NULL,1),
             ('a1b2c3d4-0002-4000-8000-000000000006','memory_rag_write_validation','Memory & RAG Write Validation','Validates content before it is written into an agent''s memory or a document store, so poisoned input cannot persist across sessions/runs. Not yet built.','policy','guardrail',NULL,'planned',NULL,NULL,1);`
        )
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `DELETE FROM "guardrail_catalog_item" WHERE "key" IN ('spend_token_budgets','hitl_approval_gates','loop_recursion_detection','egress_filtering','confused_deputy_prevention','memory_rag_write_validation');`
        )
    }
}
