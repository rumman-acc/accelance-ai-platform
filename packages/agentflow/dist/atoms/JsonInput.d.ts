import { VariableItem } from './VariablePicker'

export interface JsonInputProps {
    value: string
    onChange: (json: string) => void
    disabled?: boolean
    /** Variable items for per-key injection. When provided, clicking a JSON key opens the variable picker. */
    variableItems?: VariableItem[]
}
/**
 * Interactive JSON tree editor atom.
 *
 * Stores data as a JSON **string** — parses on mount, stringifies on every edit.
 * Falls back to `{}` for empty or invalid input.
 *
 * When `variableItems` is provided, clicking a JSON key opens a popover to
 * inject a variable into that specific key (matching the original Flowise behaviour).
 */
export declare function JsonInput({ value, onChange, disabled, variableItems }: JsonInputProps): import('react/jsx-runtime').JSX.Element
