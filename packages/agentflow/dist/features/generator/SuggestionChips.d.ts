export interface Suggestion {
    text: string
    id?: string
}
export interface SuggestionChipsProps {
    /** List of suggestions to display */
    suggestions: Suggestion[]
    /** Callback when a suggestion is clicked */
    onSelect: (suggestion: Suggestion) => void
    /** Whether the chips are disabled */
    disabled?: boolean
}
declare const defaultSuggestions: Suggestion[]
/**
 * Suggestion chips for the generate flow dialog
 */
declare function SuggestionChipsComponent({
    suggestions,
    onSelect,
    disabled
}: SuggestionChipsProps): import('react/jsx-runtime').JSX.Element
export declare const SuggestionChips: import('react').MemoExoticComponent<typeof SuggestionChipsComponent>
export { defaultSuggestions }
export default SuggestionChips
