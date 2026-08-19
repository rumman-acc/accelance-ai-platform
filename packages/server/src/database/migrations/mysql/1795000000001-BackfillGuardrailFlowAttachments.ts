import { MigrationInterface, QueryRunner } from 'typeorm'

/**
 * See the postgres sibling migration (1795000000000-BackfillGuardrailFlowAttachments.ts) for
 * the full rationale comment -- kept identical here to avoid drift across driver files.
 */
export class BackfillGuardrailFlowAttachments1795000000001 implements MigrationInterface {
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
            await queryRunner.query(
                `INSERT INTO \`guardrail_flow_attachment\`
                    (\`id\`,\`workspaceId\`,\`chatflowId\`,\`definitionId\`,\`definitionKey\`,\`kindKey\`,\`paramsSnapshot\`,\`onFailAction\`,\`failMode\`,\`timeoutMs\`,\`observeMode\`)
                 SELECT UUID(), gp.\`workspaceId\`, gp.\`chatflowId\`, gd.\`id\`, gd.\`key\`, gd.\`kindKey\`,
                        COALESCE(gp.\`config\`, gd.\`defaultParams\`), gd.\`defaultOnFailAction\`, gd.\`defaultFailMode\`, gd.\`defaultTimeoutMs\`, 1
                 FROM \`guardrail_policy\` gp
                 JOIN \`guardrail_definition\` gd ON gd.\`key\` = gp.\`catalogKey\` AND gd.\`workspaceId\` IS NULL
                 WHERE gp.\`catalogKey\` = '${key}' AND gp.\`enabled\` = 1 AND gp.\`chatflowId\` != ''
                   AND NOT EXISTS (
                       SELECT 1 FROM \`guardrail_flow_attachment\` existing
                       WHERE existing.\`chatflowId\` = gp.\`chatflowId\` AND existing.\`definitionKey\` = '${key}'
                   );`
            )

            await queryRunner.query(
                `INSERT INTO \`guardrail_flow_attachment\`
                    (\`id\`,\`workspaceId\`,\`chatflowId\`,\`definitionId\`,\`definitionKey\`,\`kindKey\`,\`paramsSnapshot\`,\`onFailAction\`,\`failMode\`,\`timeoutMs\`,\`observeMode\`)
                 SELECT UUID(), gp.\`workspaceId\`, cf.\`id\`, gd.\`id\`, gd.\`key\`, gd.\`kindKey\`,
                        COALESCE(gp.\`config\`, gd.\`defaultParams\`), gd.\`defaultOnFailAction\`, gd.\`defaultFailMode\`, gd.\`defaultTimeoutMs\`, 1
                 FROM \`guardrail_policy\` gp
                 JOIN \`guardrail_definition\` gd ON gd.\`key\` = gp.\`catalogKey\` AND gd.\`workspaceId\` IS NULL
                 JOIN \`chat_flow\` cf ON cf.\`workspaceId\` = gp.\`workspaceId\`
                 WHERE gp.\`catalogKey\` = '${key}' AND gp.\`enabled\` = 1 AND gp.\`chatflowId\` = ''
                   AND NOT EXISTS (
                       SELECT 1 FROM \`guardrail_flow_attachment\` existing
                       WHERE existing.\`chatflowId\` = cf.\`id\` AND existing.\`definitionKey\` = '${key}'
                   );`
            )
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `DELETE FROM \`guardrail_flow_attachment\` WHERE \`definitionKey\` IN (${this.keys.map((k) => `'${k}'`).join(',')});`
        )
    }
}
