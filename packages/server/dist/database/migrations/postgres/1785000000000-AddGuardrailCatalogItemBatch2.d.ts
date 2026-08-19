import { MigrationInterface, QueryRunner } from 'typeorm';
/**
 * Second catalog seed batch (2026-08-17, after a taxonomy review against NIST AI RMF / OWASP LLM
 * Top 10 / MLCommons hazard categories / agent-specific guardrail patterns surfaced two gaps:
 * (1) two items -- spend/token budgets and HITL approval gates -- already exist as separate,
 * untracked-in-this-catalog epics (FEATURE-BUILD-LEDGER.md §12 and §8 respectively) and were
 * invisible from /guardrails; (2) four genuinely new agent-specific guardrail concepts had no
 * representation anywhere. All six are added here, not built -- 'hitl_approval_gates' is the only
 * one with any real enforcement (the existing `humanInputAgentflow` node), the rest are 'planned'.
 */
export declare class AddGuardrailCatalogItemBatch2_1785000000000 implements MigrationInterface {
    name: string;
    up(queryRunner: QueryRunner): Promise<void>;
    down(queryRunner: QueryRunner): Promise<void>;
}
