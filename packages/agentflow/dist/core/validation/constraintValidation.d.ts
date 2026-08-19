import { FlowNode } from '../types'

export interface ConstraintResult {
    valid: boolean
    message?: string
}
/**
 * Check that only one start node exists in the flow
 */
export declare function checkSingleStartNode(nodes: FlowNode[], newNodeName: string): ConstraintResult
/**
 * Check that iteration nodes are not nested inside other iteration nodes
 */
export declare function checkNestedIteration(newNodeName: string, parentNode: FlowNode | null): ConstraintResult
/**
 * Check that human input nodes are not placed inside iteration nodes
 */
export declare function checkHumanInputInIteration(newNodeName: string, parentNode: FlowNode | null): ConstraintResult
/**
 * Check all placement constraints for a node being added to the canvas.
 * Returns the first failing constraint, or a valid result if all pass.
 */
export declare function checkNodePlacementConstraints(
    nodes: FlowNode[],
    nodeType: string,
    position?: {
        x: number
        y: number
    } | null
): ConstraintResult
/**
 * Find the iteration node that contains the given position, if any
 */
export declare function findParentIterationNode(
    nodes: FlowNode[],
    position: {
        x: number
        y: number
    }
): FlowNode | null
