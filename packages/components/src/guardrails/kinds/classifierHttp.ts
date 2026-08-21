import { secureFetch } from '../../httpSecurity'
import { GuardrailVerdictType, IGuardrailVerdict } from '../verdictTypes'

/**
 * Guardrails v2 Phase 5 -- "classifier_http"/webhook guardrails, per
 * Guardrails_end_to_end_protocol.md's Phase 5 list. Unlike every prior kind, this one makes a
 * real outbound network call the server itself initiates from a user-supplied URL -- the
 * classic SSRF shape. Uses `secureFetch` (httpSecurity.ts), the same DNS-resolve + deny-list +
 * redirect-revalidation + IP-pinned-agent mechanism `RequestsPost.ts`'s tool already uses for
 * user-configured URLs, rather than a bare `fetch()` -- building a second, weaker HTTP path for
 * this kind specifically would be a real security regression next to what already exists.
 *
 * Contract: POST `{content}` as JSON to the configured URL; the endpoint is expected to answer
 * with a verdict-contract.md-shaped JSON body (`{verdict, reason?, transformedPayload?,
 * evidence?, score?}`) -- the SAME shape every other kind executor returns, not a second,
 * bespoke wire format. Any technical failure (bad URL, DNS/deny-list rejection, timeout,
 * non-2xx, malformed/missing verdict) resolves to a real verdict rather than throwing, per
 * `failMode` -- 'closed' fails to `block`, anything else (including unset) fails to `pass`,
 * matching the "open by default, per-config, never a platform-wide setting" non-negotiable.
 * This is also the first kind to actually READ a fail-mode value, since `defaultFailMode` has
 * been schema-defined but inert (never consumed at runtime) since Phase 0.
 */

export interface IClassifierHttpParams {
    url: string
    timeoutMs?: number
    failMode?: 'open' | 'closed'
}

const VALID_VERDICTS: GuardrailVerdictType[] = ['pass', 'flag', 'block', 'redact', 'require_approval']

const failureVerdict = (failMode: 'open' | 'closed' | undefined, reason: string): IGuardrailVerdict => ({
    verdict: failMode === 'closed' ? 'block' : 'pass',
    reason
})

export const evaluateClassifierHttp = async (params: IClassifierHttpParams, content: string): Promise<IGuardrailVerdict> => {
    if (!params.url) return failureVerdict(params.failMode, 'classifier_http: no url configured')

    const controller = new AbortController()
    const timeoutMs = params.timeoutMs && params.timeoutMs > 0 ? params.timeoutMs : 5000
    const timeoutHandle = setTimeout(() => controller.abort(), timeoutMs)

    try {
        const res = await secureFetch(params.url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content }),
            // node-fetch's own RequestInit declares a slightly different AbortSignal shape than
            // the DOM lib's global AbortController produces -- functionally identical at runtime.
            signal: controller.signal as never
        })

        if (!res.ok) {
            return failureVerdict(params.failMode, `classifier_http: endpoint returned HTTP ${res.status}`)
        }

        const body: unknown = await res.json().catch(() => null)
        if (!body || typeof body !== 'object' || !VALID_VERDICTS.includes((body as { verdict?: string }).verdict as GuardrailVerdictType)) {
            return failureVerdict(params.failMode, 'classifier_http: endpoint returned a malformed response')
        }

        const parsed = body as {
            verdict: GuardrailVerdictType
            reason?: unknown
            transformedPayload?: unknown
            evidence?: unknown
            score?: unknown
        }
        const verdict: IGuardrailVerdict = { verdict: parsed.verdict }
        if (typeof parsed.reason === 'string') verdict.reason = parsed.reason
        if (typeof parsed.transformedPayload === 'string') verdict.transformedPayload = parsed.transformedPayload
        if (parsed.evidence && typeof parsed.evidence === 'object') verdict.evidence = parsed.evidence as Record<string, unknown>
        if (typeof parsed.score === 'number') verdict.score = parsed.score
        return verdict
    } catch (e) {
        const message = e instanceof Error ? e.message : String(e)
        return failureVerdict(params.failMode, `classifier_http: request failed - ${message}`)
    } finally {
        clearTimeout(timeoutHandle)
    }
}
