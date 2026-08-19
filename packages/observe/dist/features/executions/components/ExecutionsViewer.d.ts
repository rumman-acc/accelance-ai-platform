import { ExecutionsViewerProps } from '../../../core/types';

/**
 * Top-level executions list + detail drawer.
 * When agentflowId is provided: scoped view (filters list + hides agentflow-name filter).
 * When agentflowId is omitted: full cross-agent list.
 */
export declare function ExecutionsViewer({ agentflowId, allowDelete, pollInterval, onHumanInput, onAgentflowClick, initialFilters, drawer }: ExecutionsViewerProps): import("react/jsx-runtime").JSX.Element;
