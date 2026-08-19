import { HumanInputState } from '../hooks/useHumanInput';

interface HitlPanelProps {
    /**
     * Controls visibility of the floating Proceed/Reject bar. Driven by the
     * caller's gating logic (onHumanInput provided && node is humanInput &&
     * status is INPROGRESS). The feedback dialog and loading overlay render
     * regardless — they're scoped to `state.feedbackOpen` / `state.isSubmitting`,
     * which only flip when the bar has already been used.
     */
    show: boolean;
    state: HumanInputState;
}
/**
 * Floating Proceed/Reject bar + optional feedback dialog + submission overlay
 * for HITL nodes. Single mount in NodeExecutionDetail; submission lifecycle
 * lives in the `useHumanInput` hook.
 */
export declare function HitlPanel({ show, state }: HitlPanelProps): import("react/jsx-runtime").JSX.Element;
export {};
