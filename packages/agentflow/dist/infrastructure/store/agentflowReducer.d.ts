import { AgentflowAction, AgentflowState, FlowNode } from '../../core/types'

export declare function normalizeNodes(nodes: FlowNode[]): FlowNode[]
export declare const initialState: AgentflowState
export declare function agentflowReducer(state: AgentflowState, action: AgentflowAction): AgentflowState
