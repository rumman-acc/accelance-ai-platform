import { AxiosInstance } from 'axios'
import { ChatModel } from '../../core/types'

/**
 * Create models API functions bound to a client instance
 */
export declare function bindChatModelsApi(client: AxiosInstance): {
    /**
     * Get all available chat models
     */
    getChatModels: () => Promise<ChatModel[]>
}
export type ChatModelsApi = ReturnType<typeof bindChatModelsApi>
