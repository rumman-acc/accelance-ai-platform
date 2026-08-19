interface JsonBlockProps {
    value: object;
    isDarkMode: boolean;
    maxHeight?: number | string;
}
/**
 * Flat syntax-highlighted JSON pre-block. Used for inline (non-raw) JSON
 * content — Input/Output bubbles for HTTP/form/structured nodes. The
 * interactive tree-view `flowise-react-json-view` is reserved for the Raw view
 * where collapse/expand is useful.
 */
export declare function JsonBlock({ value, isDarkMode, maxHeight }: JsonBlockProps): import("react/jsx-runtime").JSX.Element;
interface JsonPrimitiveProps {
    value: string | number | boolean | null;
    isDarkMode: boolean;
}
export declare function JsonPrimitive({ value, isDarkMode }: JsonPrimitiveProps): import("react/jsx-runtime").JSX.Element;
export {};
