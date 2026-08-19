"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.getWriteCapableToolNames = exports.isWriteCapableToolNode = void 0;
// Ordered roughly by how unambiguous the prefix is. Intentionally broad -- false positives
// (flagging a safe action as risky) just mean an extra HITL gate in the generated flow, which
// is the safe direction to be wrong in. False negatives (missing a real write action) are the
// failure mode this exists to avoid.
const WRITE_ACTION_NAME_PATTERN = /^(send|delete|trash|remove|revoke|clear|create|update|modify|write|share|cancel|move|archive|forward|reply|bcc|schedule|invite|insert|append|replace|upsert|batchUpdate|batchClear)/i;
/**
 * Recursively collects every option `name` string exposed by a tool node's `inputs` (covers
 * `type: 'options'`/`'multiOptions'` action pickers, wherever they appear in the node's params).
 */
const collectOptionNames = (inputs) => {
    if (!Array.isArray(inputs))
        return [];
    const names = [];
    for (const input of inputs) {
        if (Array.isArray(input?.options)) {
            for (const opt of input.options) {
                if (typeof opt?.name === 'string')
                    names.push(opt.name);
            }
        }
    }
    return names;
};
/**
 * Does this tool node component (as found in componentNodes[toolName]) expose at least one
 * action whose name matches a mutating/write-style pattern?
 */
const isWriteCapableToolNode = (componentNode) => {
    if (!componentNode)
        return false;
    return collectOptionNames(componentNode.inputs).some((name) => WRITE_ACTION_NAME_PATTERN.test(name));
};
exports.isWriteCapableToolNode = isWriteCapableToolNode;
/**
 * Given the full componentNodes registry and a list of tool node names, return the subset that
 * are write-capable per isWriteCapableToolNode.
 */
const getWriteCapableToolNames = (componentNodes, toolNodeNames) => {
    return toolNodeNames.filter((name) => (0, exports.isWriteCapableToolNode)(componentNodes[name]));
};
exports.getWriteCapableToolNames = getWriteCapableToolNames;
//# sourceMappingURL=toolActionRisk.js.map