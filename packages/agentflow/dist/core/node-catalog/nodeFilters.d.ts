/**
 * Filter nodes based on allowed components list
 * @param allNodes - All available nodes from API
 * @param allowedComponents - Array of allowed node names (optional)
 * @returns Filtered array of nodes
 */
export declare function filterNodesByComponents<
    T extends {
        name: string
    }
>(allNodes: T[], allowedComponents?: string[]): T[]
/**
 * Check if a node type is an agentflow node
 */
export declare function isAgentflowNode(nodeName: string): boolean
/**
 * Group nodes by category (palette API entries or any node-like object with `category`).
 */
export declare function groupNodesByCategory<
    T extends {
        category?: string
    }
>(nodes: T[]): Record<string, T[]>
