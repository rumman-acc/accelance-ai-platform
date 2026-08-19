import { ExecutionStatus } from '../../../core/types'

export interface NodeStatusIndicatorProps {
    status?: ExecutionStatus
    error?: string
}
export interface NodeWarningIndicatorProps {
    message: string
}
/**
 * Status indicator badge shown on the top-right of a node
 */
declare function NodeStatusIndicatorComponent({ status, error }: NodeStatusIndicatorProps): import('react/jsx-runtime').JSX.Element | null
/**
 * Warning indicator badge shown on the top-left of a node
 */
declare function NodeWarningIndicatorComponent({ message }: NodeWarningIndicatorProps): import('react/jsx-runtime').JSX.Element | null
export declare const NodeStatusIndicator: import('react').MemoExoticComponent<typeof NodeStatusIndicatorComponent>
export declare const NodeWarningIndicator: import('react').MemoExoticComponent<typeof NodeWarningIndicatorComponent>
export {}
