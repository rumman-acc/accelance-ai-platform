import { FlowEdge, FlowNode } from '../types'

/**
 * Generate export-friendly flow data.
 * Uses an explicit allowlist (matching agentflow v2 behaviour) so that
 * server-only metadata and sensitive values never leak into exports.
 */
export declare function generateExportFlowData(flowData: { nodes: FlowNode[]; edges: FlowEdge[] }): {
    nodes: FlowNode[]
    edges: FlowEdge[]
}
