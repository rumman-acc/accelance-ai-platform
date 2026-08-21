import { MigrationInterface, QueryRunner } from 'typeorm'

/**
 * Surfaced building Phase 3's create-custom-definition endpoint
 * (rules/guardrails-v2/phase3-authoring.md): the existing UNIQUE(key, version) index
 * (1797000000000-MakeGuardrailDefinitionKeyVersionUnique.ts) was correct for Phase 0/1, where
 * every row was a system row (workspaceId IS NULL) with a distinct key -- but it is NOT scoped
 * by workspace, so once workspace users can pick their own `key`, two different workspaces
 * both choosing e.g. "block_profanity" at version 1 would collide on this index for a reason
 * that has nothing to do with anything either workspace did wrong.
 *
 * Fix: scope the uniqueness to (workspaceId, key, version) instead of (key, version) alone --
 * but a plain composite index on a nullable column doesn't work here, because Postgres treats
 * NULL as distinct-from-NULL in a unique index, which would silently stop deduplicating SYSTEM
 * rows against each other (the opposite regression). Uses COALESCE(workspaceId, '') instead --
 * the same "" = workspace-wide/system sentinel idiom this codebase already uses elsewhere
 * (GuardrailPolicy.chatflowId = '' for workspace-wide, see services/guardrails/index.ts's
 * WORKSPACE_WIDE constant) -- so all system rows still collide with each other on (key,
 * version) exactly as before, and each workspace's custom rows are deduplicated independently
 * of every other workspace's.
 *
 * Checked the live dev DB before writing this: all 16 rows today have workspaceId IS NULL (no
 * custom definitions exist yet, Phase 3 hasn't shipped the create endpoint), so this migration
 * changes zero rows' data, only the index definition.
 */
export class ScopeGuardrailDefinitionKeyToWorkspace1800000000000 implements MigrationInterface {
    name = 'ScopeGuardrailDefinitionKeyToWorkspace1800000000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX IF EXISTS "idx_guardrail_definition_key_version";`)
        await queryRunner.query(
            `CREATE UNIQUE INDEX IF NOT EXISTS "idx_guardrail_definition_workspace_key_version" ON "guardrail_definition"(COALESCE("workspaceId", ''), "key", "version");`
        )
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX IF EXISTS "idx_guardrail_definition_workspace_key_version";`)
        await queryRunner.query(
            `CREATE UNIQUE INDEX IF NOT EXISTS "idx_guardrail_definition_key_version" ON "guardrail_definition"("key", "version");`
        )
    }
}
