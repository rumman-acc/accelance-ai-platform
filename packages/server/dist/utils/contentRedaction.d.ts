export interface IRedactionConfig {
    /** Additional regex source strings, applied alongside the built-in PII presets. */
    patterns?: string[];
}
/**
 * Replaces every match of the built-in PII presets plus any extra `patterns` with `[REDACTED:LABEL]`.
 * Never throws on a bad custom pattern -- an invalid regex is skipped rather than failing the
 * whole message save, since this runs on the hot chat-message-persistence path.
 */
export declare const redactContent: (text: string, config?: IRedactionConfig) => string;
