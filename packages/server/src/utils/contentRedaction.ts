/**
 * Regex-based redaction used by the 'pii_redaction' guardrail (and by custom keyword/regex-denylist
 * catalog entries, which reuse this same function with their own pattern list instead of the
 * built-in PII presets). Deliberately pattern-matching, not NER -- a full NER-based pass is a
 * separate, larger effort tracked in rules/epics-feature-status.md §9; this covers the concrete,
 * high-confidence patterns regex handles well.
 */
const PII_PRESETS: { label: string; pattern: RegExp }[] = [
    { label: 'EMAIL', pattern: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g },
    { label: 'PHONE', pattern: /\+?\d{1,3}[-.\s]?\(?\d{2,4}\)?[-.\s]?\d{3,4}[-.\s]?\d{3,4}/g },
    { label: 'SSN', pattern: /\b\d{3}-\d{2}-\d{4}\b/g },
    { label: 'CARD', pattern: /\b(?:\d[ -]*?){13,16}\b/g }
]

export interface IRedactionConfig {
    /** Additional regex source strings, applied alongside the built-in PII presets. */
    patterns?: string[]
}

/**
 * Replaces every match of the built-in PII presets plus any extra `patterns` with `[REDACTED:LABEL]`.
 * Never throws on a bad custom pattern -- an invalid regex is skipped rather than failing the
 * whole message save, since this runs on the hot chat-message-persistence path.
 */
export const redactContent = (text: string, config?: IRedactionConfig): string => {
    if (!text) return text
    let result = text
    for (const { label, pattern } of PII_PRESETS) {
        result = result.replace(pattern, `[REDACTED:${label}]`)
    }
    for (const source of config?.patterns ?? []) {
        try {
            const custom = new RegExp(source, 'g')
            result = result.replace(custom, '[REDACTED:CUSTOM]')
        } catch {
            // Invalid pattern supplied via a custom guardrail's config -- skip it, don't break the save.
        }
    }
    return result
}
