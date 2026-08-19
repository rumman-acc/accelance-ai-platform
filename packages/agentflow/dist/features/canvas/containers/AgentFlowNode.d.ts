import { NodeData } from '../../../core/types'

export interface AgentFlowNodeProps {
    data: NodeData
}
/**
 * Agent Flow Node component for rendering nodes in the canvas
 */
declare function AgentFlowNodeComponent({ data }: AgentFlowNodeProps): import('react/jsx-runtime').JSX.Element
export declare const AgentFlowNode: import('react').MemoExoticComponent<typeof AgentFlowNodeComponent>
export default AgentFlowNode
