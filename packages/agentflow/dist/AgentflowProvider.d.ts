import { ReactNode } from 'react'
import { FlowData, RequestInterceptor } from './core/types'

interface AgentflowProviderProps {
    /** Flowise API server endpoint */
    apiBaseUrl: string
    /** Authentication token for API calls */
    token?: string
    /**
     * Optional callback to customize outgoing API requests.
     * Has access to full request config including auth tokens — only pass trusted code.
     */
    requestInterceptor?: RequestInterceptor
    /** Whether to use dark mode (default: false) */
    isDarkMode?: boolean
    /** Array of allowed node component names */
    components?: string[]
    /** Whether the canvas is read-only */
    readOnly?: boolean
    /** Initial flow data */
    initialFlow?: FlowData
    /** Children to render */
    children: ReactNode
}
/**
 * Provider component that wraps the entire Agentflow application.
 * Sets up all required contexts for API access, configuration, and state management.
 */
export declare function AgentflowProvider({
    apiBaseUrl,
    token,
    requestInterceptor,
    isDarkMode,
    components,
    readOnly,
    initialFlow,
    children
}: AgentflowProviderProps): import('react/jsx-runtime').JSX.Element
export default AgentflowProvider
