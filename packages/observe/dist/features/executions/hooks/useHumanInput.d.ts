import { HumanInputParams } from '../../../core/types';

interface UseHumanInputOptions {
    agentflowId: string;
    sessionId: string;
    nodeId: string;
    enableFeedback: boolean;
    onHumanInput?: (agentflowId: string, params: HumanInputParams) => Promise<void>;
}
export interface HumanInputState {
    isSubmitting: boolean;
    submitError: string | null;
    feedbackOpen: boolean;
    feedbackText: string;
    setFeedbackText: (value: string) => void;
    dismissError: () => void;
    handleProceed: () => void;
    handleReject: () => void;
    cancelFeedbackDialog: () => void;
    submitFeedback: () => void;
}
/**
 * Owns the HITL submission lifecycle for `NodeExecutionDetail`:
 *  - Direct submit if `enableFeedback === false`
 *  - Open feedback dialog otherwise (then submit on confirmation)
 *  - Tracks isSubmitting / submitError surfaces for the action bar
 *
 * The hook is a no-op when `onHumanInput` is undefined — callers can still
 * mount the action bar; clicks resolve to nothing.
 */
export declare function useHumanInput({ agentflowId, sessionId, nodeId, enableFeedback, onHumanInput }: UseHumanInputOptions): HumanInputState;
export {};
