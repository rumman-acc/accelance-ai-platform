import { Editor, Range } from '@tiptap/core'
import { EditorView } from '@tiptap/pm/view'
import { SuggestionItem } from './SuggestionDropdown'

interface SuggestionCallbackProps {
    editor: Editor
    range: Range
    query: string
    text: string
    items: SuggestionItem[]
    command: (props: SuggestionItem) => void
    decorationNode: Element | null
    clientRect?: (() => DOMRect | null) | null
}
interface SuggestionKeyDownCallbackProps {
    view: EditorView
    event: KeyboardEvent
    range: Range
}
export interface SuggestionConfigOptions {
    items: SuggestionItem[]
}
/**
 * Creates the TipTap suggestion config object for the CustomMention extension.
 *
 * @param suggestionItems - The full list of available variable items.
 *   Filtering by query is done inside the `items` callback.
 */
export declare function createSuggestionConfig(suggestionItems: SuggestionItem[]): {
    char: string
    items: ({ query }: { query: string }) => SuggestionItem[]
    render: () => {
        onStart: (props: SuggestionCallbackProps) => void
        onUpdate(props: SuggestionCallbackProps): void
        onKeyDown(props: SuggestionKeyDownCallbackProps): boolean
        onExit(): void
    }
}
export {}
