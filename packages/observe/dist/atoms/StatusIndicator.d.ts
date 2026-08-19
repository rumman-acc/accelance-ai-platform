import { ExecutionState } from '../core/types';

interface StatusIndicatorProps {
    state: ExecutionState;
    size?: number;
}
/**
 * Color-coded icon for an execution or node state.
 * Used in both the list table and the execution tree view.
 */
export declare function StatusIndicator({ state, size }: StatusIndicatorProps): import("react/jsx-runtime").JSX.Element;
export {};
