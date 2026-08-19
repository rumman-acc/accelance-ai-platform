import { FlowEdge, FlowNode, NodeDataSchema, ValidationError, ValidationResult } from '../types'

/**
 * Validate the flow structure
 */
export declare function validateFlow(nodes: FlowNode[], edges: FlowEdge[], availableNodes?: NodeDataSchema[]): ValidationResult
/**
 * Check if a specific node is valid.
 *
 * @param availableNodes Component definitions (not flow node instances) used to look up
 *   nested config schemas via `availableNodes.find(n => n.name === componentName)`.
 */
export declare function validateNode(node: FlowNode, availableNodes?: NodeDataSchema[]): ValidationError[]
/**
 * Group validation errors by nodeId into a map of nodeId -> error messages.
 * Useful for pushing validationErrors to node data for border highlighting.
 */
export declare function groupValidationErrorsByNodeId(errors: ValidationError[]): Map<string, string[]>
/**
 * Apply validation errors to node data for border highlighting.
 * Returns the updated nodes array (new references only for nodes whose errors changed).
 */
export declare function applyValidationErrorsToNodes(nodes: FlowNode[], errors: ValidationError[]): FlowNode[]
