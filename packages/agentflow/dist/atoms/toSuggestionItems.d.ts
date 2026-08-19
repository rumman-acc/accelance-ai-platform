import { SuggestionItem } from './SuggestionDropdown'
import { VariableItem } from './VariablePicker'

/**
 * Convert VariableItem[] (from useAvailableVariables) to SuggestionItem[] for
 * TipTap mention autocomplete. Ensures unique ids by appending a counter suffix
 * when the same base id appears more than once.
 */
export declare function toSuggestionItems(variableItems: VariableItem[] | undefined): SuggestionItem[] | undefined
