import { MigrationInterface, QueryRunner } from 'typeorm'

/**
 * Replaces the flat UNIQUE(key) from 1796000000000-AddGuardrailDefinitionKeyUniqueConstraint.ts
 * (left as-is, not edited -- this is a new migration on top) with a composite
 * UNIQUE(key, version), matching definition-schema.md's documented versioning model: an edit
 * creates a NEW row with the same `key` and a higher `version`, the old row's
 * `supersededByDefinitionId` pointing forward. A flat UNIQUE(key) made that impossible;
 * UNIQUE(key, version) permits multiple rows per key while still rejecting a genuine duplicate
 * (same key, same version).
 *
 * "Which version is current for a key" is a separate question from what this constraint
 * enforces, and is answered explicitly rather than left implicit: a row is current when
 * `deletedAt IS NULL AND supersededByDefinitionId IS NULL` -- the fields the schema already
 * has, unchanged, enforced in application code on all 4 drivers (see services/guardrails'
 * listDefinitions(), which already filters on exactly this). Rejected: MAX(version) at query
 * time (wrong if the highest version is soft-deleted with no replacement -- it would silently
 * resurrect an older version as "current" instead of correctly reporting no active row); a new
 * `is_current` boolean column (duplicates state already derivable from existing fields, and
 * adds a write-time risk of forgetting to flip the old row's flag when superseding -- a risk
 * the supersededByDefinitionId-based approach doesn't have, since that field is set exactly
 * once, atomically, as part of the same write that makes the new row current).
 *
 * Checked the live dev DB before writing this: all 13 rows have version=1,
 * supersededByDefinitionId=NULL, deletedAt=NULL -- uniform, as expected since nothing has been
 * edited yet, so this is safe to apply.
 */
export class MakeGuardrailDefinitionKeyVersionUnique1797000000000 implements MigrationInterface {
    name = 'MakeGuardrailDefinitionKeyVersionUnique1797000000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX IF EXISTS "idx_guardrail_definition_key";`)
        await queryRunner.query(
            `CREATE UNIQUE INDEX IF NOT EXISTS "idx_guardrail_definition_key_version" ON "guardrail_definition"("key", "version");`
        )
        // Non-unique index on key alone, restored -- most reads still filter/join on key alone
        // (e.g. listDefinitions()'s ORDER BY, resolveGuardrailAttachment's join), and a
        // composite (key, version) index alone doesn't serve a key-only lookup as well.
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_guardrail_definition_key" ON "guardrail_definition"("key");`)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX IF EXISTS "idx_guardrail_definition_key_version";`)
        await queryRunner.query(`DROP INDEX IF EXISTS "idx_guardrail_definition_key";`)
        await queryRunner.query(`CREATE UNIQUE INDEX IF NOT EXISTS "idx_guardrail_definition_key" ON "guardrail_definition"("key");`)
    }
}
