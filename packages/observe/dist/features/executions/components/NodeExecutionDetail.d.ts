import { ExecutionTreeNode, HumanInputParams } from '../../../core/types';

interface NodeExecutionDetailProps {
    node: ExecutionTreeNode;
    agentflowId: string;
    sessionId: string;
    onHumanInput?: (agentflowId: string, params: HumanInputParams) => Promise<void>;
}
/**
 * Right-panel detail view for a selected node in the execution tree.
 * Shows node metadata, metrics, rendered/raw output, and HITL controls when
 * applicable.
 *
 * HITL controls render only when ALL of:
 *  - `onHumanInput` callback is provided
 *  - the node's `name` is `humanInputAgentflow`
 *  - the node's `status` is `INPROGRESS`
 *
 * The feedback dialog is gated on the `humanInputEnableFeedback` flag inside
 * the node's data payload.
 */
export declare function NodeExecutionDetail({ node, agentflowId, sessionId, onHumanInput }: NodeExecutionDetailProps): import("react/jsx-runtime").JSX.Element;
export {};
