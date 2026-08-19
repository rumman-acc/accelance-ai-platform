import { AxiosInstance } from 'axios'
import { Tool } from '../../core/types'

/**
 * Create tools API functions bound to a client instance
 */
export declare function bindToolsApi(client: AxiosInstance): {
    /**
     * Get all available tools
     */
    getAllTools: (nodeName?: string) => Promise<Tool[]>
    /**
     * Get input argument names for the currently selected tool.
     * Passes current node inputs as `currentNode.inputs` so the server can resolve the selected tool.
     */
    getToolInputArgs: (inputs: Record<string, unknown>, nodeName?: string) => Promise<Tool[]>
}
export type ToolsApi = ReturnType<typeof bindToolsApi>
