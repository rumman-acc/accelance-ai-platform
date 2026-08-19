export interface CreateCredentialDialogProps {
    open: boolean
    credentialNames: string[]
    onClose: () => void
    onCreated: (credentialId: string) => void
    /** When set, the dialog opens in edit mode for the given credential ID. */
    editCredentialId?: string
}
/**
 * Dialog for creating or editing a credential from within the node editor.
 * Fetches the credential schema from the backend and renders a dynamic form.
 */
export declare function CreateCredentialDialog({
    open,
    credentialNames,
    onClose,
    onCreated,
    editCredentialId
}: CreateCredentialDialogProps): import('react/jsx-runtime').JSX.Element
