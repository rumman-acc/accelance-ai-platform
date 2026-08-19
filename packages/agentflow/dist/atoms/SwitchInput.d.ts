export interface SwitchInputProps {
    label?: string
    value: boolean | string | undefined
    onChange: (checked: boolean) => void
    disabled?: boolean
}
/**
 * A reusable switch input with optional label.
 * Mirrors the original Flowise SwitchInput component.
 */
export declare function SwitchInput({ label, value, onChange, disabled }: SwitchInputProps): import('react/jsx-runtime').JSX.Element
