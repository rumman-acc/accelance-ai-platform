import { AvailableToolEntry, ChatMessage, ConditionEntry, UsedToolEntry } from '../types';

/**
 * Domain-aware type guards used across NodeExecutionDetail and useNodeData
 * to decide which sub-renderer to dispatch for `data.input.messages`,
 * `data.output.conditions`, `data.output.availableTools`, and
 * `data.output.usedTools`. Live in core/utils since they understand the
 * shape of the runtime payload.
 */
export declare function isChatMessageArray(value: unknown): value is ChatMessage[];
export declare function isConditionArray(value: unknown): value is ConditionEntry[];
export declare function isAvailableToolArray(value: unknown): value is AvailableToolEntry[];
export declare function isUsedToolArray(value: unknown): value is UsedToolEntry[];
