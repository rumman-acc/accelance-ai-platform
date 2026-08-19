import { AxiosInstance } from 'axios'
import { NodeOption } from '../../core/types'

/**
 * Create stores API functions bound to a client instance
 */
export declare function bindStoresApi(client: AxiosInstance): {
    /**
     * Get all available document stores
     */
    getStores: () => Promise<NodeOption[]>
    /**
     * Get all available vector stores
     */
    getVectorStores: () => Promise<NodeOption[]>
}
export type StoresApi = ReturnType<typeof bindStoresApi>
