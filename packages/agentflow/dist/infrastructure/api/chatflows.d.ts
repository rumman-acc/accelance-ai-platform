import { AxiosInstance } from 'axios'
import { Chatflow, FlowData } from '../../core/types'

/**
 * Create chatflows API functions bound to a client instance
 */
export declare function bindChatflowsApi(client: AxiosInstance): {
    /**
     * Get all chatflows
     */
    getAllChatflows: () => Promise<Chatflow[]>
    /**
     * Get a specific chatflow by ID
     */
    getChatflow: (id: string) => Promise<Chatflow>
    /**
     * Create a new chatflow
     */
    createChatflow: (data: { name: string; flowData: FlowData | string; type?: string }) => Promise<Chatflow>
    /**
     * Update an existing chatflow
     */
    updateChatflow: (
        id: string,
        data: Partial<{
            name: string
            flowData: FlowData | string
            deployed: boolean
            isPublic: boolean
            chatbotConfig: string
        }>
    ) => Promise<Chatflow>
    /**
     * Delete a chatflow
     */
    deleteChatflow: (id: string) => Promise<void>
    /**
     * Generate an agentflow using AI
     */
    generateAgentflow: (data: { question: string; selectedChatModel: Record<string, unknown> }) => Promise<{
        nodes: FlowData['nodes']
        edges: FlowData['edges']
    }>
    /**
     * Get available chat models for generation
     */
    getChatModels: () => Promise<
        Array<{
            name: string
            label: string
            description?: string
            category?: string
            inputParams?: Array<{
                name: string
                label: string
                type: string
                optional?: boolean
                default?: unknown
            }>
        }>
    >
}
export type ChatflowsApi = ReturnType<typeof bindChatflowsApi>
