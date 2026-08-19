export interface DropdownOption {
    label: string
    name: string
    description?: string
    imageSrc?: string
}
export interface DropdownProps {
    name?: string
    value: string
    options: DropdownOption[]
    onSelect: (value: string) => void
    disabled?: boolean
    loading?: boolean
    freeSolo?: boolean
    disableClearable?: boolean
}
/**
 * Autocomplete-based dropdown with search, image, and description support.
 * Mirrors the original Flowise Dropdown component.
 */
export declare function Dropdown({
    name,
    value,
    options,
    onSelect,
    disabled,
    loading,
    freeSolo,
    disableClearable
}: DropdownProps): import('react/jsx-runtime').JSX.Element
