import { SuggestionItem } from './VariableInput'

export interface ExpandTextDialogProps {
    open: boolean
    value: string
    title?: string
    placeholder?: string
    disabled?: boolean
    /** The input param type — determines which editor to render. 'string' uses the TipTap RichTextEditor, 'code' renders CodeInput; others fall back to a plain TextField. */
    inputType?: string
    /** Language hint for 'code' mode (e.g. 'javascript', 'python', 'json'). */
    language?: string
    /** Variable suggestion items for `{{ }}` autocomplete in string mode. When provided, uses VariableInput instead of RichTextEditor. */
    suggestionItems?: SuggestionItem[]
    onConfirm: (value: string) => void
    onCancel: () => void
}
/**
 * A reusable expand dialog for editing long text content in a larger viewport.
 * Used by NodeInputHandler (multiline string fields) and MessagesInput (message content).
 *
 * For `inputType='string'`, an Edit/Source toggle lets users switch between the
 * WYSIWYG TipTap editor and a raw markdown text view.
 */
export declare function ExpandTextDialog({
    open,
    value,
    title,
    placeholder,
    disabled,
    inputType,
    language,
    suggestionItems,
    onConfirm,
    onCancel
}: ExpandTextDialogProps): import('react/jsx-runtime').JSX.Element
