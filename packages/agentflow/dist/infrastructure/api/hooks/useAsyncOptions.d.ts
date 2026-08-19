import { NodeOption } from '../../../core/types'

export type OptionItem = NodeOption
interface UseAsyncOptionsParams {
    loadMethod?: string
    credentialNames?: string[]
    params?: Record<string, unknown>
}
interface UseAsyncOptionsResult {
    options: OptionItem[]
    loading: boolean
    error: string | null
    refetch: () => void
}
/**
 * Fetches async option lists from the API using the loadMethodRegistry.
 */
export declare function useAsyncOptions({ loadMethod, credentialNames, params }: UseAsyncOptionsParams): UseAsyncOptionsResult
export {}
