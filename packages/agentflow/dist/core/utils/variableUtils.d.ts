import { FlowEdge, FlowNode } from '../types'

/** Regex that matches `{{variablePath}}` tokens in text. Use with `g` flag. */
export declare const VARIABLE_REGEX: RegExp
/**
 * Extract all variable paths from a string containing `{{variable}}` tokens.
 *
 * @example
 * extractVariables('Hello {{question}}, see {{node1.data.instance}}')
 * // => ['question', 'node1.data.instance']
 */
export declare function extractVariables(text: string): string[]
/**
 * Recursively walk edges backward from `nodeId` to collect **all** ancestor nodes
 * in the AgentFlow V2 graph. Excludes `startAgentflow` by default (its state
 * variables are handled separately by `useAvailableVariables`). Also traverses
 * the `parentNode` property for nodes inside iteration groups.
 *
 * Matches the `collectAgentFlowV2ParentNodes` logic in
 * packages/ui/src/utils/genericHelper.js:655-672.
 *
 * @param includeStart  When true, include `startAgentflow` in the results.
 */
export declare function getUpstreamNodes(nodeId: string, nodes: FlowNode[], edges: FlowEdge[], includeStart?: boolean): FlowNode[]
/**
 * Collect all user-defined state keys from nodes in the flow.
 * Scans each node's state-related inputs (startState, *UpdateState) for key definitions.
 */
export declare function getDefinedStateKeys(nodes: FlowNode[]): string[]
