/**
 * Naming-convention classifier for "does this tool node expose any mutating/side-effecting
 * action" -- e.g. Gmail's sendMessage/deleteMessage vs listMessages/getMessage, Drive's
 * deleteFile vs searchFiles, Calendar's deleteEvent vs listEvents.
 *
 * This exists because nothing in the platform's node schema (INodeOptionsValue/INodeParams,
 * see src/Interface.ts) carries any structured risk/mutation flag -- confirmed by search, not
 * assumed. It's a heuristic over action *names*, not a guarantee: a tool author who names an
 * action inconsistently with this convention won't be caught. Treat this as a seed for the
 * platform's tracked "HIL policy (which actions require approval)" gap
 * (rules/epics-feature-status.md), not the final answer to it -- a real implementation would
 * want structured per-action metadata on each tool node instead of pattern-matching names.
 */
/**
 * Does this tool node component (as found in componentNodes[toolName]) expose at least one
 * action whose name matches a mutating/write-style pattern?
 */
export declare const isWriteCapableToolNode: (componentNode: {
    inputs?: any[];
} | undefined) => boolean;
/**
 * Given the full componentNodes registry and a list of tool node names, return the subset that
 * are write-capable per isWriteCapableToolNode.
 */
export declare const getWriteCapableToolNames: (componentNodes: Record<string, any>, toolNodeNames: string[]) => string[];
