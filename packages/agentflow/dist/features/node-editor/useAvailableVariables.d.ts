import { VariableItem } from '../../atoms/VariablePicker'

/**
 * Returns the list of variable items available for a given node.
 *
 * Matches the original suggestionOption.js behaviour:
 * - Chat context: question, chat_history, current_date_time, runtime_messages_length, loop_count, file_attachment
 * - Flow variables: $flow.sessionId, $flow.chatId, $flow.chatflowId
 * - Upstream node outputs (from edges)
 * - Flow state variables (from startAgentflow node's startState)
 *
 * Lives in the features layer so it can read from AgentflowContext.
 * The returned items are passed to the VariablePicker atom via props.
 */
export declare function useAvailableVariables(nodeId: string): VariableItem[]
