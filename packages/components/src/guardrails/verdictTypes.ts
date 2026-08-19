/**
 * Guardrails v2 -- the shape every kind executor returns, per
 * rules/guardrails-v2/verdict-contract.md. The runtime never needs to know what a guardrail
 * checks internally, only what it returned.
 */
export type GuardrailVerdictType = 'pass' | 'flag' | 'block' | 'redact' | 'require_approval'

export interface IGuardrailVerdict {
    verdict: GuardrailVerdictType
    score?: number
    reason?: string
    /** Only present when verdict === 'redact'. */
    transformedPayload?: string
    evidence?: Record<string, unknown>
}
