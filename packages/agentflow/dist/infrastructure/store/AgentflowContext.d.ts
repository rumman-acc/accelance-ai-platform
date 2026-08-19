import { Dispatch, ReactNode } from 'react'
import { ReactFlowInstance } from 'reactflow'
import {
    AgentflowAction,
    AgentflowState,
    ExecutionStatus,
    FlowConfig,
    FlowData,
    FlowDataCallback,
    FlowEdge,
    FlowExecutionState,
    FlowNode,
    InputParam,
    NodeData,
    NodeDataSchema
} from '../../core/types'

type NodesSetter = (nodes: FlowNode[]) => void
type EdgesSetter = (edges: FlowEdge[]) => void
export interface AgentflowContextValue {
    state: AgentflowState
    dispatch: Dispatch<AgentflowAction>
    setNodes: NodesSetter
    setEdges: EdgesSetter
    syncNodesFromReactFlow: NodesSetter
    syncEdgesFromReactFlow: EdgesSetter
    setChatflow: (chatflow: FlowConfig | null) => void
    setDirty: (dirty: boolean) => void
    setReactFlowInstance: (instance: ReactFlowInstance | null) => void
    deleteNode: (nodeId: string) => void
    duplicateNode: (nodeId: string, distance?: number) => void
    updateNodeData: (nodeId: string, data: Partial<FlowNode['data']>, edges?: FlowEdge[]) => void
    deleteEdge: (edgeId: string) => void
    getFlowData: () => FlowData
    /** Return all unique state keys defined via `updateFlowState` across all nodes. */
    getFlowStateKeys: () => string[]
    reset: () => void
    openEditDialog: (nodeId: string, data: NodeData, inputParams: InputParam[]) => void
    closeEditDialog: () => void
    registerLocalStateSetters: (setLocalNodes: NodesSetter, setLocalEdges: EdgesSetter) => void
    registerOnFlowChange: (callback: FlowDataCallback | undefined) => void
    executionState: FlowExecutionState | null
    startExecution: (executionId: string) => void
    setNodeExecutionStatus: (nodeId: string, status: ExecutionStatus, error?: string) => void
    clearExecutionState: () => void
    setComponentNodes: (nodes: NodeDataSchema[]) => void
    hasOutdatedNodes: boolean
    syncNodes: () => void
}
declare const AgentflowContext: import('react').Context<AgentflowContextValue | null>
interface AgentflowStateProviderProps {
    children: ReactNode
    initialFlow?: FlowData
}
export declare function AgentflowStateProvider({
    children,
    initialFlow
}: AgentflowStateProviderProps): import('react/jsx-runtime').JSX.Element
export declare function useAgentflowContext(): AgentflowContextValue
export { AgentflowContext }
