import { NodeDataSchema } from '../../../core/types'

/**
 * Hook for loading and filtering available agentflow nodes from the API
 */
export declare function useFlowNodes(): {
    availableNodes: NodeDataSchema[]
    isLoading: boolean
    error: Error | null
}
