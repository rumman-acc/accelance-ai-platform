import { ReactNode } from 'react'
import { AxiosInstance } from 'axios'
import { RequestInterceptor } from '../../core/types'
import { ChatflowsApi, ChatModelsApi, CredentialsApi, EmbeddingsApi, NodesApi, StoresApi, ToolsApi } from '../api'

interface ApiContextValue {
    client: AxiosInstance
    apiBaseUrl: string
    nodesApi: NodesApi
    chatflowsApi: ChatflowsApi
    chatModelsApi: ChatModelsApi
    toolsApi: ToolsApi
    credentialsApi: CredentialsApi
    storesApi: StoresApi
    embeddingsApi: EmbeddingsApi
}
declare const ApiContext: import('react').Context<ApiContextValue | null>
interface ApiProviderProps {
    apiBaseUrl: string
    token?: string
    requestInterceptor?: RequestInterceptor
    children: ReactNode
}
export declare function ApiProvider({
    apiBaseUrl,
    token,
    requestInterceptor,
    children
}: ApiProviderProps): import('react/jsx-runtime').JSX.Element
export declare function useApiContext(): ApiContextValue
export { ApiContext }
