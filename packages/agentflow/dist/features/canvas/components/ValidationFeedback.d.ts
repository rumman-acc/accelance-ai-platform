import { FlowEdge, FlowNode, NodeDataSchema } from '../../../core/types'

export interface ValidationFeedbackProps {
    nodes: FlowNode[]
    edges: FlowEdge[]
    availableNodes?: NodeDataSchema[]
    setNodes: React.Dispatch<React.SetStateAction<FlowNode[]>>
}
declare function ValidationFeedbackComponent({
    nodes,
    edges,
    availableNodes,
    setNodes
}: ValidationFeedbackProps): import('react/jsx-runtime').JSX.Element
export declare const ValidationFeedback: import('react').MemoExoticComponent<typeof ValidationFeedbackComponent>
export {}
