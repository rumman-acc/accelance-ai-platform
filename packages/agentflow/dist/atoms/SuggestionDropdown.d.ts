/**
 * Shape of items returned by the TipTap suggestion `items()` callback.
 * Matches the UI package's SuggestionList item shape.
 */
export interface SuggestionItem {
    id: string
    /** Display label (called `mentionLabel` in the UI package) */
    label: string
    description?: string
    category?: string
}
export interface SuggestionDropdownProps {
    /** Filtered suggestion items from TipTap's suggestion plugin */
    items: SuggestionItem[]
    /** TipTap command to insert the selected mention node */
    command: (attrs: { id: string; label: string }) => void
}
/** Ref handle exposed to TipTap's suggestion `onKeyDown` callback. */
export interface SuggestionDropdownRef {
    onKeyDown: (args: { event: KeyboardEvent }) => boolean
}
/**
 * Autocomplete dropdown for TipTap mention suggestions.
 *
 * Rendered by TipTap's suggestion plugin via ReactRenderer.
 * Exposes keyboard navigation via forwardRef + useImperativeHandle
 * so the suggestion plugin can delegate keystrokes.
 *
 * Port of packages/ui/src/ui-component/input/SuggestionList.jsx to TypeScript.
 */
export declare const SuggestionDropdown: import('react').ForwardRefExoticComponent<
    SuggestionDropdownProps & import('react').RefAttributes<SuggestionDropdownRef>
>
