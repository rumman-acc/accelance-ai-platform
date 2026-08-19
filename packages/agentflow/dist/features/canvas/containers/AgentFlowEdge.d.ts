import { Position } from 'reactflow'
import { EdgeData } from '../../../core/types'

export interface AgentFlowEdgeProps {
    id: string
    sourceX: number
    sourceY: number
    targetX: number
    targetY: number
    sourcePosition: Position
    targetPosition: Position
    data?: EdgeData
    markerEnd?: string
    selected?: boolean
}
/**
 * Agent Flow Edge component for rendering edges in the canvas
 */
declare function AgentFlowEdgeComponent({
    id,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    data,
    markerEnd,
    selected
}: AgentFlowEdgeProps): import('react/jsx-runtime').JSX.Element
export declare const AgentFlowEdge: import('react').MemoExoticComponent<typeof AgentFlowEdgeComponent>
export default AgentFlowEdge
