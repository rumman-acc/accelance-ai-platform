import { StateUpdate } from '../core/types'
import { SuggestionItem } from './SuggestionDropdown'

export interface StateKeyValueInputProps {
    value: StateUpdate[]
    onChange: (value: StateUpdate[]) => void
    disabled?: boolean
    /** Available variables for autocomplete in the value field */
    suggestionItems?: SuggestionItem[]
}
/**
 * Key-value pair editor for flow state updates.
 * Keys are plain text; values support variable syntax via VariableInput.
 */
export declare function StateKeyValueInput({
    value,
    onChange,
    disabled,
    suggestionItems
}: StateKeyValueInputProps): import('react/jsx-runtime').JSX.Element
