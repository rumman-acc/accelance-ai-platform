export interface NodeContentRendererProps {
    value: unknown;
    isDarkMode: boolean;
    /**
     * When true (default), string content that parses as a JSON primitive
     * (e.g. `"6092"` → 6092) is rendered through `JsonPrimitive` with its own
     * bordered frame. Pass `false` for the simple input rendering path
     * (Start / Direct Reply nodes), which renders `data.input.question` as
     * plain markdown text without a nested inner border.
     */
    parsePrimitiveAsJson?: boolean;
    /**
     * Override the bordered JSON viewer's max height. Defaults to JsonBlock's
     * value (400) — set this only when the embedding context (e.g. a
     * compact list cell) needs a smaller cap.
     */
    jsonMaxHeight?: number | string;
}
/**
 * Renders a single value as JSON, markdown, or plain text.
 *
 * We deliberately do NOT enable `rehype-raw`: agent inputs frequently contain
 * malformed HTML fragments which crash the rehype-raw HTML tokenizer. Without
 * it, ReactMarkdown safely escapes HTML as text.
 */
export declare function NodeContentRenderer({ value, isDarkMode, parsePrimitiveAsJson, jsonMaxHeight }: NodeContentRendererProps): import("react/jsx-runtime").JSX.Element;
