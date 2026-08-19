import { RichTextEditorProps } from './RichTextEditor'

/**
 * Lazy-loaded RichTextEditor — keeps TipTap + highlight.js out of the main bundle.
 * This is the public API; use this instead of importing RichTextEditor directly.
 */
export declare function RichTextEditor(props: RichTextEditorProps): import('react/jsx-runtime').JSX.Element
