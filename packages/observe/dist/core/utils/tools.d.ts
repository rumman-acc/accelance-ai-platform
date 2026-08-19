import { AvailableToolEntry, NormalizedToolCall } from '../types';

/**
 * Resolves a tool reference (typically `message.name` or a tool_call function
 * name) against the runtime's `availableTools` list, falling back to the raw
 * name for both icon lookup and display label when no match is found.
 */
export declare function resolveTool(name: string, availableTools: AvailableToolEntry[] | undefined): {
    iconName: string;
    label: string;
};
/**
 * Tool calls arrive in two shapes: OpenAI-style `message.tool_calls`, or
 * Gemini-style `message.content` of `{ type: 'functionCall', functionCall }`.
 * `suppressContent` tells the caller to hide the content dump when it carries
 * the same data as the accordions (some providers send both shapes at once).
 */
export declare function extractToolCalls(message: {
    tool_calls?: unknown;
    content?: unknown;
}): {
    calls: NormalizedToolCall[];
    suppressContent: boolean;
};
