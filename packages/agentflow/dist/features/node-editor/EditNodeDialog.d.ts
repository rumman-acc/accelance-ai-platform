import { EditDialogProps } from '../../core/types'

export interface EditNodeDialogProps {
    show: boolean
    dialogProps: EditDialogProps
    onCancel: () => void
}
/**
 * Dialog for editing node properties
 */
declare function EditNodeDialogComponent({
    show,
    dialogProps,
    onCancel
}: EditNodeDialogProps): import('react/jsx-runtime').JSX.Element | null
export declare const EditNodeDialog: import('react').MemoExoticComponent<typeof EditNodeDialogComponent>
export default EditNodeDialog
