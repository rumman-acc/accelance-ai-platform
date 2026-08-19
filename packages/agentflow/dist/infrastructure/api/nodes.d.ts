import { AxiosInstance } from 'axios'
import { NodeConfigEntry, NodeData, NodeDataSchema } from '../../core/types'

/**
 * Create nodes API functions bound to a client instance
 */
export declare function bindNodesApi(client: AxiosInstance): {
    /**
     * Get all available nodes.
     * Component definitions from the server (`inputs` is a schema array).
     * Pass results through initNode() to get canvas-ready NodeData.
     */
    getAllNodes: () => Promise<NodeDataSchema[]>
    /**
     * Get a specific node by name.
     * Single component definition (`inputs` is a schema array).
     */
    getNodeByName: (name: string) => Promise<NodeDataSchema>
    /**
     * Call a loadMethod on a specific node (e.g. listRegions on awsChatBedrock).
     * Maps to POST /node-load-method/{nodeName} with { loadMethod, ...body }.
     */
    loadNodeMethod: (nodeName: string, loadMethod: string, body?: Record<string, unknown>) => Promise<unknown>
    /**
     * Get node configuration (override configs) for a node.
     * Posts the node data to /node-config and returns an array of config entries.
     * NodeData field names (inputParams for schema, inputs for values) already
     * match what the server expects.
     */
    getNodeConfig: (data: NodeData) => Promise<NodeConfigEntry[]>
    /**
     * Get node icon URL
     */
    getNodeIconUrl: (instanceUrl: string, nodeName: string) => string
}
export type NodesApi = ReturnType<typeof bindNodesApi>
