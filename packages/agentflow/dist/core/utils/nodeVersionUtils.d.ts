import { NodeData, NodeDataSchema } from '../types'

export declare function isNodeOutdated(nodeData: NodeData, componentNode: NodeDataSchema): boolean
export declare function getNodeVersionWarning(nodeData: NodeData, componentNode: NodeDataSchema): string | null
/**
 * Re-initialize a node to the latest component schema while preserving user data.
 * Port of updateOutdatedNodeData() from packages/ui/src/utils/genericHelper.js:233-351.
 */
export declare function upgradeNodeData(componentNode: NodeDataSchema, existingData: NodeData): NodeData
