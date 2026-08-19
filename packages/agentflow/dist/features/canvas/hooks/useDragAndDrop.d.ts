import { RefObject } from 'react'
import { FlowNode } from '../../../core/types'

export declare const DROP_OFFSET_X = 100
export declare const DROP_OFFSET_Y = 50
interface UseDragAndDropProps {
    nodes: FlowNode[]
    setLocalNodes: React.Dispatch<React.SetStateAction<FlowNode[]>>
    reactFlowWrapper: RefObject<HTMLDivElement>
    onConstraintViolation?: (message: string) => void
}
/**
 * Hook for handling drag and drop of nodes onto the canvas
 */
export declare function useDragAndDrop({ nodes, setLocalNodes, reactFlowWrapper, onConstraintViolation }: UseDragAndDropProps): {
    handleDragOver: (event: React.DragEvent) => void
    handleDrop: (event: React.DragEvent) => void
}
export {}
