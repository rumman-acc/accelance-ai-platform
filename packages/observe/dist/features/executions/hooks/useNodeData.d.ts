import { ChatMessage, ConditionEntry, ExecutionTreeNode, NodeExecutionData, NodeExecutionOutput } from '../../../core/types';

export interface DerivedNodeData {
    /** Raw node data (or undefined for virtual iteration nodes). */
    raw: NodeExecutionData | undefined;
    /** Whole `data` payload, defaulted to {}. */
    payload: Record<string, unknown>;
    /** `data.output` as a record (used for metrics + content selection). */
    dataOutput: NodeExecutionOutput | undefined;
    /** `data.input` as a record. */
    dataInput: Record<string, unknown> | undefined;
    /** Chat-style message array if `data.input.messages` is one, else null. */
    inputMessages: ChatMessage[] | null;
    /** Curated input value: `data.input.question` if present, else `data.input`. */
    inputValue: unknown;
    /** Curated output value: `output.form` | `output.http` | `output.content`. */
    outputValue: unknown;
    /**
     * Condition-node output (`data.output.conditions`) when present. Rendered
     * as success-bordered "Fulfilled" boxes instead of through the generic
     * content renderer. Mirrors legacy `renderFullfilledConditions`.
     */
    outputConditions: ConditionEntry[] | null;
    errorValue: unknown;
    stateValue: unknown;
    hasInput: boolean;
    hasError: boolean;
    hasState: boolean;
    /**
     * Whether this is the special HITL node — `name === 'humanInputAgentflow'`.
     */
    isHumanInputNode: boolean;
    /**
     * Whether the runtime requested the optional feedback dialog before the
     * proceed/reject submission. Stored at `data.input.humanInputEnableFeedback`
     * with backward-compat fallback to `data.humanInputEnableFeedback`.
     */
    enableFeedback: boolean;
}
/**
 * Derive the curated values used by `NodeExecutionDetail` from a tree node.
 * Encapsulates the legacy parity rules:
 *
 *  - Input: chat-style nodes (Agent / LLM) put a message history at
 *    `data.input.messages`. Otherwise prefer the simple `question` field,
 *    falling back to the raw input value.
 *  - Output: prefer `data.output.form` → `data.output.http` →
 *    `data.output.content`. Other output keys (timeMetadata, usageMetadata,
 *    usedTools, ...) are metadata, not user-facing content.
 *  - Empty objects in input fall back to "No data" placeholder rather than
 *    a `root: {}` JSON dump.
 */
export declare function useNodeData(node: ExecutionTreeNode): DerivedNodeData;
