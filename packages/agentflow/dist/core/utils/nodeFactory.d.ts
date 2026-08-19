import { FlowNode, NodeData, NodeDataSchema } from '../types'

/**
 * Resolve the ReactFlow node type from a NodeData type string.
 */
export declare function resolveNodeType(nodeDataType: string): string
/**
 * Generate a unique node ID based on existing nodes.
 * Accepts both NodeDataSchema (from API) and NodeData (canvas nodes).
 */
export declare function getUniqueNodeId(nodeData: Pick<NodeData, 'name'>, nodes: FlowNode[]): string
/**
 * Generate a unique node label based on existing nodes.
 * Accepts both NodeDataSchema (from API) and NodeData (canvas nodes).
 */
export declare function getUniqueNodeLabel(nodeData: Pick<NodeData, 'name' | 'type' | 'label'>, nodes: FlowNode[]): string
/**
 * Initialize a node with proper anchors and default values.
 * Converts an API response (NodeDataSchema, where inputs is a schema array) into a
 * canvas-ready NodeData (where inputParams is the schema and inputs is key-value values).
 */
export declare function initNode(nodeData: NodeDataSchema, newNodeId: string, isAgentflow?: boolean): NodeData
