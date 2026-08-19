import { NodeData } from '../../../core/types'

export interface NodeInfoDialogProps {
    open: boolean
    onClose: () => void
    data: NodeData
}
/**
 * Dialog showing full node information including icon, badges, description,
 * documentation link, and parameter configuration table.
 */
declare function NodeInfoDialogComponent({ open, onClose, data }: NodeInfoDialogProps): import('react/jsx-runtime').JSX.Element | null
export declare const NodeInfoDialog: import('react').MemoExoticComponent<typeof NodeInfoDialogComponent>
export {}
