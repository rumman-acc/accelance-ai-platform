/**
 * Tagged result for tryParseJson. We can't use `null`/`undefined` as a "not
 * parseable" sentinel because `JSON.parse('null')` legitimately returns null,
 * which is a value worth surfacing through the JSON viewer.
 */
export type ParseResult = {
    ok: true;
    value: unknown;
} | {
    ok: false;
};
/**
 * Try to parse a string as JSON. Accepts ANY parseable value — objects,
 * arrays, numbers, booleans, null. Plain text like "hello" fails JSON.parse
 * and falls through (`ok: false`).
 */
export declare function tryParseJson(value: string): ParseResult;
export type JsonTokenType = 'punctuation' | 'key' | 'string' | 'boolean' | 'null' | 'number';
export interface JsonToken {
    type: JsonTokenType;
    text: string;
}
export declare function tokenizeJson(json: string): JsonToken[];
