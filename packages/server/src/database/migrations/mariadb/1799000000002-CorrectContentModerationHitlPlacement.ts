import { MigrationInterface, QueryRunner } from 'typeorm'
import { randomUUID } from 'crypto'

/**
 * See the postgres sibling migration
 * (1799000000000-CorrectContentModerationHitlPlacement.ts) for the full rationale comment --
 * kept identical here to avoid drift across driver files.
 */
export class CorrectContentModerationHitlPlacement1799000000002 implements MigrationInterface {
    name = 'CorrectContentModerationHitlPlacement1799000000002'

    private readonly corrections: Record<string, string> = {
        content_moderation:
            'Blocks or flags toxic/policy-violating content using OpenAI Moderation or a deny-list. Built but unconfigured -- the SimplePromptModeration/OpenAIModeration nodes are real and functional when placed inline in a flow, but no shipped flow uses one yet and the deny-list is empty by default.',
        hitl_approval_gates:
            'Pauses execution before a risky step for a human proceed/reject decision, via the Human Input node. Real when placed -- the pause/resume mechanism genuinely works once a Human Input node is placed inline in a flow; it is simply unused in any flow built so far.'
    }

    public async up(queryRunner: QueryRunner): Promise<void> {
        for (const key of Object.keys(this.corrections)) {
            const rows: any[] = await queryRunner.query(
                `SELECT * FROM \`guardrail_definition\` WHERE \`key\` = ? AND \`supersededByDefinitionId\` IS NULL AND \`deletedAt\` IS NULL;`,
                [key]
            )
            if (rows.length !== 1) continue

            const old = rows[0]
            const newId = randomUUID()
            const newVersion = Number(old.version) + 1

            await queryRunner.query(
                `INSERT INTO \`guardrail_definition\`
                    (\`id\`,\`key\`,\`name\`,\`description\`,\`icon\`,\`origin\`,\`category\`,\`kindKey\`,\`placement\`,\`allowedHosts\`,\`hooks\`,\`paramSchema\`,\`defaultParams\`,\`defaultOnFailAction\`,\`defaultFailMode\`,\`defaultTimeoutMs\`,\`defaultObserveMode\`,\`frameworkRefs\`,\`version\`,\`workspaceId\`,\`createdBy\`)
                 VALUES (?,?,?,?,?,?,?,?,'inline',?,?,?,?,?,?,?,?,?,?,?,?);`,
                [
                    newId,
                    old.key,
                    old.name,
                    this.corrections[key],
                    old.icon,
                    old.origin,
                    old.category,
                    old.kindKey,
                    old.allowedHosts,
                    old.hooks,
                    old.paramSchema,
                    old.defaultParams,
                    old.defaultOnFailAction,
                    old.defaultFailMode,
                    old.defaultTimeoutMs,
                    old.defaultObserveMode,
                    old.frameworkRefs,
                    newVersion,
                    old.workspaceId,
                    old.createdBy
                ]
            )
            await queryRunner.query(`UPDATE \`guardrail_definition\` SET \`supersededByDefinitionId\` = ? WHERE \`id\` = ?;`, [
                newId,
                old.id
            ])
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        for (const key of Object.keys(this.corrections)) {
            const rows: any[] = await queryRunner.query(
                `SELECT * FROM \`guardrail_definition\` WHERE \`key\` = ? AND \`supersededByDefinitionId\` IS NULL AND \`deletedAt\` IS NULL;`,
                [key]
            )
            if (rows.length !== 1) continue
            const current = rows[0]
            await queryRunner.query(`DELETE FROM \`guardrail_definition\` WHERE \`id\` = ?;`, [current.id])
            await queryRunner.query(
                `UPDATE \`guardrail_definition\` SET \`supersededByDefinitionId\` = NULL WHERE \`key\` = ? AND \`supersededByDefinitionId\` = ?;`,
                [key, current.id]
            )
        }
    }
}
