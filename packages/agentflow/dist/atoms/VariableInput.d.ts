import { Editor } from '@tiptap/react'
import { SuggestionItem } from './SuggestionDropdown'

export type { SuggestionItem }
export interface VariableInputProps {
    value: string
    onChange: (value: string) => void
    placeholder?: string
    disabled?: boolean
    /** Number of visible text rows. When set, renders as a multiline editor. */
    rows?: number
    /** Available variables for autocomplete when typing `{{` */
    suggestionItems?: SuggestionItem[]
    /** Auto-focus the editor on mount */
    autoFocus?: boolean
    /** Called with the live editor instance once it is ready (and null on unmount). Used by ExpandTextDialog to call getMarkdown() on mode switch. */
    onEditorReady?: (editor: Editor | null) => void
}
/**
 * A TipTap-based text input with `{{ variable }}` mention support.
 *
 * When the user types `{{`, a suggestion dropdown appears anchored to the cursor
 * with available variables. Selecting a variable inserts it as a styled mention chip
 * that renders as `{{variableName}}` in the markdown output.
 *
 * Content is stored and emitted as markdown. The CustomMention extension's
 * markdownTokenizer/parseMarkdown/renderMarkdown hooks ensure `{{variable}}` syntax
 * survives markdown round-trips intact. Legacy HTML values are accepted for backward
 * compatibility — TipTap renders them correctly and subsequent edits emit markdown.
 *
 * This is the agentflow equivalent of the UI package's RichInput component.
 */
export declare function VariableInput({
    value,
    onChange,
    placeholder,
    disabled,
    rows,
    suggestionItems,
    autoFocus,
    onEditorReady
}: VariableInputProps): import('react/jsx-runtime').JSX.Element
