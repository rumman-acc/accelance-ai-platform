import { ExecutionTreeNode } from '../../../core/types';

/**
 * Builds a hierarchical `ExecutionTreeNode[]` from the flat `NodeExecutionData[]`
 * stored in `execution.executionData` (JSON string). Two parenting mechanisms,
 * mirroring the legacy `ExecutionDetails.jsx` `buildTreeData`:
 *
 * 1. **`previousNodeIds` parent→child** — each non-iteration node attaches to
 *    the most recent prior instance of any node listed in its `previousNodeIds`.
 *    A node with empty `previousNodeIds` becomes a root.
 * 2. **Iteration grouping** — children with `parentNodeId` + `iterationIndex`
 *    are grouped into virtual `Iteration #N` container nodes under the iteration
 *    agent's most recent instance, then linked to one another inside the
 *    iteration via the same `previousNodeIds` rule.
 *
 * Tree node ids are `${nodeId}_${index}` (array position) so the same `nodeId`
 * appearing multiple times (e.g. inside a loop) keeps each instance addressable.
 */
export declare function useExecutionTree(executionDataJson: string | null): ExecutionTreeNode[];
