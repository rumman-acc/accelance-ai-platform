import { MigrationInterface, QueryRunner } from 'typeorm'

/**
 * Backfills GuardrailFlowAttachment for the 7 catalog keys that are genuinely chatflow-scoped
 * and read guardrail_policy today (see rules/guardrails-v2/phase0-audit.md Finding 4 and
 * rules/guardrails-v2/reconciliation.md) -- preserves today's real effective behavior under
 * the new model, per build-plan §8.
 *
 * Two inserts per key, no per-row JS loop, no flowData JSON rewrite:
 *  1. Direct chatflow-scoped guardrail_policy rows (an explicit per-agent override).
 *  2. Workspace-wide (chatflowId='') rows expanded across every chatflow in that workspace,
 *     skipped where step 1 already created a more-specific row for that chatflow -- preserves
 *     most-specific-match-wins exactly as guardrailsService.evaluate() does today.
 *
 * observeMode is always true on every backfilled row (decision 5 -- promotion to blocking is a
 * later, explicit per-attachment action, not assumed here, and nothing in this codebase ever
 * sets it false). This is the sole reason it's safe to run this backfill against a live,
 * already-toggled-on production workspace: it only ever creates observation data, never
 * changes what any request actually does.
 */
export class BackfillGuardrailFlowAttachments1795000000000 implements MigrationInterface {
    name = 'BackfillGuardrailFlowAttachments1795000000000'

    private readonly keys = [
        'pii_redaction',
        'topic_action_scoping',
        'spend_token_budgets',
        'prompt_injection_defense',
        'egress_filtering',
        'confused_deputy_prevention',
        'loop_recursion_detection'
    ]

    public async up(queryRunner: QueryRunner): Promise<void> {
        for (const key of this.keys) {
            // Step 1: direct chatflow-scoped overrides.
            await queryRunner.query(
                `INSERT INTO "guardrail_flow_attachment"
                    ("workspaceId","chatflowId","definitionId","definitionKey","kindKey","paramsSnapshot","onFailAction","failMode","timeoutMs","observeMode")
                 SELECT gp."workspaceId", gp."chatflowId", gd."id"::text, gd."key", gd."kindKey",
                        COALESCE(gp."config", gd."defaultParams"), gd."defaultOnFailAction", gd."defaultFailMode", gd."defaultTimeoutMs", true
                 FROM "guardrail_policy" gp
                 JOIN "guardrail_definition" gd ON gd."key" = gp."catalogKey" AND gd."workspaceId" IS NULL
                 WHERE gp."catalogKey" = '${key}' AND gp."enabled" = true AND gp."chatflowId" != ''
                   AND NOT EXISTS (
                       SELECT 1 FROM "guardrail_flow_attachment" existing
                       WHERE existing."chatflowId" = gp."chatflowId" AND existing."definitionKey" = '${key}'
                   );`
            )

            // Step 2: workspace-wide rows expanded per chatflow, skipped where step 1 already
            // created a more-specific attachment for that chatflow. chat_flow.id AND
            // chat_flow.workspaceId are both native uuid columns in the real deployed postgres
            // DB (verified directly against information_schema -- ChatFlow.ts's own
            // `@Column({type:'text'})` decorator for workspaceId does not reflect this; that's
            // an existing entity/DB drift, not something this migration changes) while
            // guardrail_flow_attachment's columns are text -- cast both explicitly, since
            // postgres has no bare uuid = text comparison operator.
            await queryRunner.query(
                `INSERT INTO "guardrail_flow_attachment"
                    ("workspaceId","chatflowId","definitionId","definitionKey","kindKey","paramsSnapshot","onFailAction","failMode","timeoutMs","observeMode")
                 SELECT gp."workspaceId", cf."id"::text, gd."id"::text, gd."key", gd."kindKey",
                        COALESCE(gp."config", gd."defaultParams"), gd."defaultOnFailAction", gd."defaultFailMode", gd."defaultTimeoutMs", true
                 FROM "guardrail_policy" gp
                 JOIN "guardrail_definition" gd ON gd."key" = gp."catalogKey" AND gd."workspaceId" IS NULL
                 JOIN "chat_flow" cf ON cf."workspaceId"::text = gp."workspaceId"
                 WHERE gp."catalogKey" = '${key}' AND gp."enabled" = true AND gp."chatflowId" = ''
                   AND NOT EXISTS (
                       SELECT 1 FROM "guardrail_flow_attachment" existing
                       WHERE existing."chatflowId" = cf."id"::text AND existing."definitionKey" = '${key}'
                   );`
            )
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `DELETE FROM "guardrail_flow_attachment" WHERE "definitionKey" IN (${this.keys.map((k) => `'${k}'`).join(',')});`
        )
    }
}
