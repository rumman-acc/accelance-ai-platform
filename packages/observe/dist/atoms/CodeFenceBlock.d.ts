interface CodeFenceBlockProps {
    value: string;
    language: string;
}
/**
 * Code-fence renderer with copy + download buttons in a dark header bar.
 * Uses Prism via react-syntax-highlighter with the oneDark theme.
 */
export declare function CodeFenceBlock({ value, language }: CodeFenceBlockProps): import("react/jsx-runtime").JSX.Element;
export {};
