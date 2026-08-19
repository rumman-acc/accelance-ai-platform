import { MigrationInterface, QueryRunner } from 'typeorm';
/**
 * Third catalog pass (2026-08-17): moves the 7 'planned' guardrail entries to real enforcement
 * with sensible built-in defaults (no config-editing UI exists yet, so defaults must be usable
 * out of the box), and adds 3 real compliance entries (audit_log, data_retention_policy,
 * policy_templates) alongside the existing 'Not yet built' placeholder rows on /compliance --
 * these three ARE built, category='compliance' distinguishes them from the static placeholders.
 */
export declare class GuardrailCatalogBatch3Enforcement1786000000000 implements MigrationInterface {
    name: string;
    up(queryRunner: QueryRunner): Promise<void>;
    down(queryRunner: QueryRunner): Promise<void>;
}
