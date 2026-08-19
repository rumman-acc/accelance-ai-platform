import { Editor } from '@tiptap/react'

export interface RichTextEditorProps {
    /** Markdown string, or legacy HTML string for backward compatibility */
    value: string
    /** Called with the updated markdown string on every edit */
    onChange: (markdown: string) => void
    placeholder?: string
    disabled?: boolean
    /** Number of visible text rows (controls editor height) */
    rows?: number
    /** Auto-focus when the editor mounts */
    autoFocus?: boolean
    /** Called with the live editor instance once it is ready (and null on unmount). Used by ExpandTextDialog to call getMarkdown() on mode switch. */
    onEditorReady?: (editor: Editor | null) => void
    /** When true, emits markdown; when false, emits HTML. Defaults to true. */
    useMarkdown?: boolean
}
/**
 * A TipTap-based rich text editor atom with code block syntax highlighting.
 *
 * Stores and emits content as markdown. Legacy HTML values (content starting with `<`)
 * are accepted for backward compatibility — TipTap renders them correctly, and
 * subsequent edits will emit markdown.
 *
 * This is a "dumb" UI primitive — it receives all data via props and owns no
 * business logic. Variable/mention support lives in the features layer.
 */
export declare function RichTextEditor({
    value,
    onChange,
    placeholder,
    disabled,
    rows,
    autoFocus,
    onEditorReady,
    useMarkdown
}: RichTextEditorProps): import('react/jsx-runtime').JSX.Element
