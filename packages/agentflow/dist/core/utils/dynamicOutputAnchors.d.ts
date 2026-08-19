import { OutputAnchor } from '../types'

/** Build a deterministic output handle ID for a given node and index. */
export declare function getOutputHandleId(nodeId: string, index: number): string
/** Parse the numeric index from an output handle ID. Returns NaN if the format doesn't match. */
export declare function parseOutputHandleIndex(nodeId: string, handleId: string): number
/**
 * Build output anchors for a node based on a dynamic item count.
 *
 * Matches the v2 flow data format where `label` and `name` are numeric
 * indices and `description` holds the human-readable text
 * (e.g. "Condition 0", "Else").
 */
export declare function buildDynamicOutputAnchors(nodeId: string, count: number, labelPrefix: string, includeElse?: boolean): OutputAnchor[]
