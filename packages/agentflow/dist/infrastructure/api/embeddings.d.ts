import { AxiosInstance } from 'axios'
import { NodeOption } from '../../core/types'

/**
 * Create embeddings API functions bound to a client instance
 */
export declare function bindEmbeddingsApi(client: AxiosInstance): {
    /**
     * Get all available embedding models
     */
    getEmbeddings: () => Promise<NodeOption[]>
}
export type EmbeddingsApi = ReturnType<typeof bindEmbeddingsApi>
