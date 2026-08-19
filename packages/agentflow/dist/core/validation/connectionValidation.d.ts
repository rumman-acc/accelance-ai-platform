import { FlowEdge, FlowNode } from '../types'

/**
 * Check if a connection is valid for AgentFlow v2
 */
export declare function isValidConnectionAgentflowV2(
    connection: {
        source: string
        target: string
    },
    nodes: FlowNode[],
    edges: FlowEdge[]
): boolean
