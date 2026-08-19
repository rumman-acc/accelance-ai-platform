import { MigrationInterface, QueryRunner } from 'typeorm'

/**
 * Closes a real gap: guardrail_definition.key had only a plain (non-unique) index, so nothing
 * at the DB level stopped a duplicate key from being seeded or manually inserted. Checked the
 * live dev DB before writing this -- 13 rows, 13 distinct keys, zero duplicates -- so this is
 * safe to apply as-is.
 *
 * Deliberate tradeoff, not an oversight: definition-schema.md documents a future versioning
 * model where editing a definition creates a NEW row with the same `key` (the old row gets
 * `supersededByDefinitionId` pointing forward) -- a flat UNIQUE(key) forecloses that. Accepted
 * because (a) nothing in Phase 1 ever creates a second row for an existing key, so this is safe
 * today, and (b) a partial/conditional unique index (unique only among "active" rows) isn't
 * expressible portably across all 4 drivers -- mysql/mariadb have no native partial-index
 * syntax, unlike postgres/sqlite. Whoever builds Phase 3 authoring/versioning will need to
 * either bump `version` in place on the same row instead of inserting a new one, or migrate
 * this constraint away in favor of a generated-column-based unique index at that time.
 */
export class AddGuardrailDefinitionKeyUniqueConstraint1796000000000 implements MigrationInterface {
    name = 'AddGuardrailDefinitionKeyUniqueConstraint1796000000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX IF EXISTS "idx_guardrail_definition_key";`)
        await queryRunner.query(`CREATE UNIQUE INDEX IF NOT EXISTS "idx_guardrail_definition_key" ON "guardrail_definition"("key");`)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX IF EXISTS "idx_guardrail_definition_key";`)
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_guardrail_definition_key" ON "guardrail_definition"("key");`)
    }
}
