import { FlowEdge } from '../../core/types'

/**
 * Hook for managing dynamic output ports on nodes whose anchor count
 * depends on runtime data (e.g. condition nodes).
 *
 * Provides `cleanupOrphanedEdges` which filters out edges pointing to
 * output handles that no longer exist and returns the cleaned array.
 * The caller should pass the returned edges to `updateNodeData` so that
 * nodes and edges are updated atomically in a single `onFlowChange` call.
 *
 * Pass `enabled: false` to make the hook inert for non-applicable nodes.
 */
export declare function useDynamicOutputPorts(
    nodeId: string,
    enabled?: boolean,
    includeElse?: boolean
): {
    cleanupOrphanedEdges: (count: number) => FlowEdge[] | undefined
}
