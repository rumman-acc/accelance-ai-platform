import { ComponentCredentialSchema } from '../core/types'

export interface CredentialTypeSelectorProps {
    schemas: ComponentCredentialSchema[]
    apiBaseUrl: string
    onSelect: (schema: ComponentCredentialSchema) => void
}
/**
 * Search + grid selector for choosing a credential type.
 * Renders a search bar and a 3-column grid of credential cards with icons.
 */
export declare function CredentialTypeSelector({
    schemas,
    apiBaseUrl,
    onSelect
}: CredentialTypeSelectorProps): import('react/jsx-runtime').JSX.Element
/** Circular credential icon with fallback to a key icon on load error. */
export declare function CredentialIcon({ name, apiBaseUrl }: { name: string; apiBaseUrl: string }): import('react/jsx-runtime').JSX.Element
