import { NodeExecutionOutput } from '../core/types';

interface MetricsDisplayProps {
    output?: NodeExecutionOutput;
}
/**
 * Displays time, token, and cost metrics for a node execution as a chip row.
 *
 * Formatting:
 *  - Time:   `(delta / 1000).toFixed(2)` seconds; hidden when delta is falsy
 *            (so a 0ms placeholder is suppressed).
 *  - Tokens: integer count + ` tokens`.
 *  - Cost:   `$X.XX` when >= $0.01, else `$0.000000` (6 decimals) for tiny amounts.
 *            Hidden when cost is null/undefined or negative.
 *
 * Renders nothing if no metric chip is visible.
 */
export declare function MetricsDisplay({ output }: MetricsDisplayProps): import("react/jsx-runtime").JSX.Element | null;
export {};
