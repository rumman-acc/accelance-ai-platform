import { FlowData } from '../../core/types'

export interface GenerateFlowDialogProps {
    /** Whether the dialog is open */
    open: boolean
    /** Callback when dialog is closed */
    onClose: () => void
    /** Callback when flow is generated successfully */
    onGenerated: (nodes: FlowData['nodes'], edges: FlowData['edges']) => void
}
/**
 * Generate Flow Dialog - AI-powered flow generation
 */
declare function GenerateFlowDialogComponent({
    open,
    onClose,
    onGenerated
}: GenerateFlowDialogProps): import('react/jsx-runtime').JSX.Element
export declare const GenerateFlowDialog: import('react').MemoExoticComponent<typeof GenerateFlowDialogComponent>
export default GenerateFlowDialog
