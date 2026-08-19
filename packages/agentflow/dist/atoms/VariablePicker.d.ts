export interface VariableItem {
    label: string
    description?: string
    category?: string
    value: string
    /** Optional per-item icon component (e.g. the upstream node's icon). */
    icon?: React.ElementType
    /** Optional per-item icon color. Falls back to the category color. */
    iconColor?: string
}
export interface VariablePickerProps {
    items: VariableItem[]
    onSelect: (variableString: string) => void
    disabled?: boolean
}
/**
 * Grouped variable picker panel. Shows variables organized by category with
 * section headers and colored icons. Used in popovers (e.g. JSON editor per-key
 * injection, non-TipTap variable selection).
 */
export declare function VariablePicker({ items, onSelect, disabled }: VariablePickerProps): import('react/jsx-runtime').JSX.Element | null
