export interface CodeInputProps {
    value: string
    onChange: (code: string) => void
    language?: string
    disabled?: boolean
    height?: string
}
/**
 * CodeMirror-based code editor atom.
 *
 * Supports javascript (default), python, and json syntax highlighting.
 * Theme switches automatically based on dark mode.
 */
export declare function CodeInput({ value, onChange, language, disabled, height }: CodeInputProps): import('react/jsx-runtime').JSX.Element
