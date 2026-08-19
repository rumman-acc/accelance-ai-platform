import { Connection, EdgeChange, Node, NodeChange } from 'reactflow'
import { FlowDataCallback, FlowEdge, FlowNode, NodeDataSchema } from '../../../core/types'

interface UseFlowHandlersProps {
    nodes: FlowNode[]
    edges: FlowEdge[]
    setLocalNodes: React.Dispatch<React.SetStateAction<FlowNode[]>>
    setLocalEdges: React.Dispatch<React.SetStateAction<FlowEdge[]>>
    onNodesChange: (changes: NodeChange[]) => void
    onEdgesChange: (changes: EdgeChange[]) => void
    onFlowChange?: FlowDataCallback
    availableNodes: NodeDataSchema[]
    onConstraintViolation?: (message: string) => void
}
/**
 * Hook for handling flow connection and change events
 */
export declare function useFlowHandlers({
    nodes,
    edges,
    setLocalNodes,
    setLocalEdges,
    onNodesChange,
    onEdgesChange,
    onFlowChange,
    availableNodes,
    onConstraintViolation
}: UseFlowHandlersProps): {
    handleConnect: (params: Connection) => void
    handleNodesChange: (changes: NodeChange[]) => void
    handleNodeDragStop: (_event: React.MouseEvent, _node: Node, draggedNodes: Node[]) => void
    handleEdgesChange: (changes: EdgeChange[]) => void
    handleAddNode: (
        nodeType: string,
        position?: {
            x: number
            y: number
        }
    ) => void
}
export {}
